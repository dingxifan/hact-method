#!/usr/bin/env node
/*
 * check-secrets.js · 真凭据反查扫描器
 *
 * 解决的问题：`check-conn.js` 只守 `connections.yml` 一个文件，而真凭据泄露的**主要发生方式
 * 不在那里**——是有人把真值当例子抄进文档、示例或脚本。2026-08-30 实测：9 条在用凭据散在
 * 6 个仓的 16 个文件里，全部已入库、远端可见，最长 114 天无人发现。典型形态：
 *   · `standards-backend.md` 里一条 dotenv 踩坑经验，用真 SMTP 密码当例子 → 随模板复制到 6 仓
 *   · `docs/deployment-manual.md` 一个文件 8 条凭据
 *   · `docs/security-findings.md`（一份安全文档）里躺着在用的 JWT secret
 *   · `.env.example`（示例文件的全部意义就是不放真值）
 *   · `db/inject/run.js`、`_meta/seed_*.js` 等代码文件
 *
 * 判据：拿 `~/.hact/secrets.env` 里的**真值**反查文件内容，命中即 FAIL。
 * 这是唯一不依赖"记得别抄"的判据——它不猜哪些字段像机密，只认真值本身。
 *
 * 用法（在项目仓根目录执行）：
 *   node scripts/check-secrets.js            # 扫 staged 文件（门卫用，毫秒级）
 *   node scripts/check-secrets.js --all      # 全仓扫描（排查用，秒级）
 *   node scripts/check-secrets.js <文件...>  # 指定文件
 *
 * 退出码：命中 → 1；干净 → 0；自身出错 → 2。
 *
 * 三条自我约束（都是今天踩过的坑换来的）：
 *   ① **绝不打印凭据值**——只报「文件 + handle 名」。check-conn 第一版就是把 token 随异常
 *      消息打进了报告，这个检查器更不能犯。
 *   ② **`~/.hact/secrets.env` 缺失不算通过**——那等于没有可比对的模式，扫描是空转。
 *      此时明确报「本项未生效」而非绿灯（"装了没响"已撞过四种形态）。
 *   ③ **一次性多模式匹配**——逐条扫 28 个凭据在真实仓上要 10 分钟以上，挂进 pre-commit
 *      会被直接 `--no-verify` 绕开。慢的门卫等于没有门卫。
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SECRETS_FILE = path.join(os.homedir(), '.hact', 'secrets.env');
const MIN_LEN = 8;                        // 太短的值会撞普通单词，不纳入
const MAX_BYTES = 2 * 1024 * 1024;        // 单文件上限，避免读进大二进制
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'coverage', 'vendor', '.venv', '__pycache__']);
const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|svg|pdf|zip|gz|tgz|bz2|xz|7z|rar|mp4|mov|mp3|wav|woff2?|ttf|eot|otf|exe|dll|so|dylib|class|jar|wasm|lock)$/i;

function loadSecrets() {
  if (!fs.existsSync(SECRETS_FILE)) return null;
  const out = [];
  for (const raw of fs.readFileSync(SECRETS_FILE, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) v = v.slice(1, -1);
    if (v.length >= MIN_LEN) out.push({ handle: m[1], value: v });
  }
  return out;
}

function stagedFiles() {
  try {
    // core.quotepath=false：非 ASCII 文件名否则会被转义加引号，路径对不上
    return execFileSync('git', ['-c', 'core.quotepath=false', 'diff', '--cached', '--name-only', '--diff-filter=ACMR'],
      { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split(/\r?\n/).filter(Boolean);
  } catch { return []; }
}

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (!SKIP_EXT.test(e.name)) out.push(p);
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const all = argv.includes('--all');
  const explicit = argv.filter(a => !a.startsWith('--'));

  const secrets = loadSecrets();
  if (secrets === null) {
    // 缺凭据文件 = 无可比对模式 = 扫描空转。必须说清楚，不能装作通过。
    console.log('\n=== check-secrets 报告 ===');
    console.log(`⚠️  本项未生效：${SECRETS_FILE} 不存在，没有可比对的真值。`);
    console.log('   这不等于"没有泄露"——只是这台机器无法判断。配好凭据后重跑。\n');
    process.exit(0);
  }
  if (!secrets.length) {
    console.log('\n=== check-secrets 报告 ===');
    console.log(`⚠️  本项未生效：${SECRETS_FILE} 中无长度 ≥${MIN_LEN} 的凭据可比对。\n`);
    process.exit(0);
  }

  let files = explicit.length ? explicit : (all ? walk(process.cwd(), []) : stagedFiles());
  files = files.filter(f => { try { const s = fs.statSync(f); return s.isFile() && s.size <= MAX_BYTES; } catch { return false; } })
               .filter(f => !SKIP_EXT.test(f));

  const hits = [];
  for (const f of files) {
    let text;
    try { text = fs.readFileSync(f, 'utf8'); } catch { continue; }
    const found = secrets.filter(s => text.includes(s.value)).map(s => s.handle);
    if (found.length) hits.push({ file: f, handles: found });
  }

  console.log('\n=== check-secrets 报告 ===');
  console.log(`比对 ${secrets.length} 条真值 / 扫描 ${files.length} 个文件 / 命中 ${hits.length} 个\n`);

  if (!hits.length) { console.log('✅ 未发现真凭据被写入文件\n'); process.exit(0); }

  console.log('❌ FAIL：文件中出现了 ~/.hact/secrets.env 里的**真实凭据**');
  for (const h of hits) {
    console.log(`  ${h.file.replace(/\\/g, '/')}`);
    console.log(`      命中: ${h.handles.join(' , ')}`);   // 只报 handle 名，绝不打印值
  }
  console.log('\n处置（两步都要做，缺一不可）:');
  console.log('  ① 把文件里的真值换成假值（示例请用明显不可能是真的占位，如 <your-password>）；');
  console.log('  ② **轮换该凭据**——它已进入文件，若已 commit 则视为已泄露，改文件不能挽回。');
  console.log('     真值只应存在于 ~/.hact/secrets.env，入库文件里一律写 ${secret:NAME} 引用。\n');
  process.exit(1);
}

try { main(); }
catch (e) { console.error('check-secrets 自身出错（非产物问题）:', e.message); process.exit(2); }
