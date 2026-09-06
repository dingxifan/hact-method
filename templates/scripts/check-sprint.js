#!/usr/bin/env node
/*
 * check-sprint.js · hact-method G3（plan-sprint 产物）完成判据 linter（子计划 3c）
 *
 * 用途：机械核对 G3 完成判据里**确定性可查**的部分——任务包字段完备 / reference 稳定锚 /
 *      AC 正向 tag（含逐条 id 存在性）+ 逐条 AC 反向覆盖（按 PRD AC-nn id）/ depends_on / 共享写集冲突 / sprint↔queue↔status 三方一致 /
 *      视觉地基包（v1 含前端必有 `baseline: visual` 包；vN+1 的 design.md 变更触发退人工）/
 *      归属真空（任务包声明"这件事不在本包"时，须确有另一个包认领）/
 *      审计留痕完备性（已 [merged] 的任务须有 code_reviews[]；新条目区分 code/spec rounds、墙钟、review profile 并落逐轮 report）。
 *      语义残量（疑点确认 / TRD 模块覆盖 / Step3.5 独审结论 / 逐条 AC 忠实性——内容真覆盖、非仅 id 在场）机器判不了，
 *      留签字人确认（🧑 段），脚本只把可机械的挡在签字前。
 *
 * 用法（在项目仓根目录执行）：
 *   node scripts/check-sprint.js vN          # 项目根 = cwd
 *   node scripts/check-sprint.js vN <项目根>
 *   node scripts/check-sprint.js --review <task-id> [项目根]  # A/B 通用 review 审计
 *   node scripts/check-sprint.js --review-chain <task-id> [项目根] # 合并前仅核固定审查链，不依赖终态 status 条目
 *   node scripts/check-sprint.js --ready <task-id,...> [项目根] # develop 认领前依赖就绪检查
 *   node scripts/check-sprint.js --wave-ready <task-id,...> [项目根] # 单人 wave 的机械准入
 *   node scripts/check-sprint.js --wave-state <progress.json> [项目根] # wave 断点恢复可执行性
 *   node scripts/check-sprint.js --worktree-from-reports <report,...|none> [项目根] [--progress <task-id,...>]
 *
 * 退出码：有任一 FAIL → 1；全 pass → 0；用法错误 / 自身出错 → 2。
 *
 * 序列化前提（见 templates/queue/task-package.md + sub3c-design D1）：任务包用 YAML frontmatter。
 *   纯 Node 无外部依赖；frontmatter / status.yml 用针对本 schema 的容错行扫描，非完整 YAML AST。
 * 存量项目（无 status.yml）：三方一致的 status 侧退回兜底（pass + 提示），与 check-gate 同。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const PLACEHOLDER = '<待填>';
const findings = []; // {level:'fail'|'pass'|'human', rule, loc, msg}
const fail  = (rule, loc, msg) => findings.push({ level: 'fail',  rule, loc, msg });
const pass  = (rule, msg)      => findings.push({ level: 'pass',  rule, msg });
const human = (rule, msg)      => findings.push({ level: 'human', rule, msg });

function readLines(p) { return fs.readFileSync(p, 'utf8').split(/\r?\n/); }
function exists(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
function stripComment(s) { return s.replace(/\s+#.*$/, '').trim(); } // 去行尾 ` # 注释`

// 任务包机械必含字段（specs-structural/develop.md §字段规范的可校验子集）。
// status 不在内（与 status.yml 重复，由后者权威）；api-contract 条件必填，单独判。
const REQUIRED = ['task-id', 'sprint_id', 'layers', 'source', 'task_type', 'contract-impact',
  'urgency', 'risk', 'title', 'description', 'depends_on', 'files', 'asset-writes', 'supersedes',
  'ac-format', 'acceptance-criteria',
  'relevant-standards', 'reference', 'context', 'known-risks', 'do-not', 'escalate-if'];

/* ---------- frontmatter 容错解析 ----------
 * 取首个 --- 与下一个 --- 之间。顶格 `key:` 为字段；支持：
 *   标量 `key: v` / 块标量 `key: >`|`|` / 块列表（后续 `  - item`）/ 行内列表 `key: [a, b]` / 空列表 `[]`
 * 返回 { key: {type, text, items} }。列表项的多行续行（更深缩进、非 `-`）并入上一项。
 */
function parseFrontmatter(p) {
  const raw = readLines(p);
  let s = raw.findIndex(l => /^---\s*$/.test(l));
  if (s < 0) return null;
  let e = raw.findIndex((l, i) => i > s && /^---\s*$/.test(l));
  if (e < 0) e = raw.length;
  const fmAbs = s + 1;                          // frontmatter 首行在文件中的绝对行号基
  const lines = raw.slice(s + 1, e);
  const fm = {};
  let curKey = null, cur = null;

  const closeKey = () => { if (curKey) { fm[curKey] = cur; curKey = null; cur = null; } };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.trim() === '') continue;
    if (/^\s*#/.test(ln)) continue;             // 整行注释
    const top = ln.match(/^([A-Za-z_][\w-]*):\s?(.*)$/); // 顶格字段（无前导空格）
    if (top && !/^\s/.test(ln)) {
      closeKey();
      curKey = top[1];
      const rest = top[2];
      const restNoComment = stripComment(rest);
      if (restNoComment === '[]') {
        cur = { type: 'inline-empty-list', text: '[]', items: [] };
      } else if (/^\[.*\]$/.test(restNoComment)) {
        const inner = restNoComment.slice(1, -1).trim();
        cur = { type: 'list', text: restNoComment,
                items: inner ? inner.split(',').map(x => x.trim()).filter(Boolean) : [] };
      } else if (restNoComment === '>' || restNoComment === '|') {
        cur = { type: 'block', text: '', items: [] };     // 后续缩进行并入
      } else if (restNoComment !== '') {
        cur = { type: 'scalar', text: restNoComment, items: [] };
      } else {
        cur = { type: 'pending', text: '', items: [] };   // 待后续行判定 list / block
      }
      continue;
    }
    if (!curKey) continue;
    // 续行：列表项 or 块标量行
    const item = ln.match(/^\s+-\s+(.*)$/);
    if (item) {
      if (cur.type === 'pending') cur.type = 'list';
      if (cur.type === 'list') cur.items.push(stripComment(item[1]));
      continue;
    }
    // 更深缩进的非 `-` 行：列表项续行（并入上一项）或块标量行
    if (cur.type === 'list' && cur.items.length) {
      cur.items[cur.items.length - 1] += ' ' + stripComment(ln);
    } else {
      if (cur.type === 'pending') cur.type = 'block';
      cur.text += (cur.text ? ' ' : '') + stripComment(ln);
    }
  }
  closeKey();
  fm.__line = fmAbs;
  return fm;
}

function valEmpty(key, v) {
  if (!v) return true;                                  // 字段缺失
  if (v.type === 'inline-empty-list') return !['depends_on', 'asset-writes', 'supersedes', 'relevant-standards', 'reference', 'known-risks', 'do-not', 'escalate-if'].includes(key);
  if (v.type === 'list') return v.items.filter(x => x && !x.includes(PLACEHOLDER)).length === 0;
  const t = (v.text || '').trim();
  return t === '' || t.includes(PLACEHOLDER);
}
function listItems(v) { return v && v.items ? v.items.filter(x => x && !x.includes(PLACEHOLDER)) : []; }
function scalarText(v) { return v ? (v.text || '') : ''; }

function normalizeFileAsset(ref) {
  const text = String(ref || '').trim().replace(/\\/g, '/');
  const match = text.match(/^(.+?\.[A-Za-z0-9_-]+)(?:\s|$)/);
  return (match ? match[1] : text).toLowerCase();
}

function taskWriteAssets(pkg) {
  const fileKeys = listItems(pkg.fm.files).map(x => `file:${normalizeFileAsset(x)}`);
  const declared = listItems(pkg.fm['asset-writes']).map(x => `asset:${x.trim().toLowerCase()}`);
  return new Set([...fileKeys, ...declared]);
}

function dependencyPath(packages, fromId, toId) {
  const byId = new Map(packages.map(p => [p.id, p]));
  const seen = new Set();
  const stack = [fromId];
  while (stack.length) {
    const current = stack.pop();
    if (current === toId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    const pkg = byId.get(current);
    if (pkg) stack.push(...pkg.deps);
  }
  return false;
}

function sharedAssetConflicts(packages) {
  const conflicts = [];
  for (let i = 0; i < packages.length; i += 1) {
    const leftAssets = taskWriteAssets(packages[i]);
    for (let j = i + 1; j < packages.length; j += 1) {
      const rightAssets = taskWriteAssets(packages[j]);
      const overlap = [...leftAssets].filter(x => rightAssets.has(x));
      if (!overlap.length) continue;
      const ordered = dependencyPath(packages, packages[i].id, packages[j].id)
        || dependencyPath(packages, packages[j].id, packages[i].id);
      if (!ordered) conflicts.push({ left: packages[i].id, right: packages[j].id, overlap });
    }
  }
  return conflicts;
}

function dependencyReadinessErrors(packages, selectedIds, statusTasks) {
  const errors = [];
  const order = new Map(selectedIds.map((id, index) => [id, index]));
  const byPackage = new Map(packages.map(pkg => [pkg.id, pkg]));
  const byStatus = new Map((statusTasks || []).map(task => [task.id, task]));
  if (new Set(selectedIds).size !== selectedIds.length) errors.push('任务集含重复 task-id');
  for (const id of selectedIds) {
    const pkg = byPackage.get(id);
    const status = byStatus.get(id);
    if (!pkg) { errors.push(`${id} 找不到唯一任务包`); continue; }
    if (!status) errors.push(`${id} 在 status.yml tasks[] 中不存在`);
    else if (status.status !== '可取') errors.push(`${id} 当前 status=${status.status || '<缺失>'}，初次认领只允许 可取`);
    for (const dep of pkg.deps) {
      if (order.has(dep)) {
        if (order.get(dep) >= order.get(id)) errors.push(`${id} 的同批依赖 ${dep} 未排在它之前`);
        continue;
      }
      const depStatus = byStatus.get(dep);
      if (!depStatus) errors.push(`${id} 的外部依赖 ${dep} 在 status.yml 不存在`);
      else if (depStatus.status !== 'merged')
        errors.push(`${id} 的外部依赖 ${dep} 尚未 merged（当前 ${depStatus.status || '<缺失>'}）`);
    }
  }
  return errors;
}

const reLineNum = /L\s*\d+|\d+\s*[-–~]\s*\d+|行\s*\d+/;   // 行号 / 行号区间
const reSectionAnchor = /(?:§|#)\s*[^\s#]|(?:章节|小节)\s*[:：]/;
const reSymbolAnchor = /`[^`]+`|(?:class|function|method|symbol)\s*[:：]\s*\S+/i;
const hasStableAnchor = s => reLineNum.test(s) || reSectionAnchor.test(s) || reSymbolAnchor.test(s);
const reAcTag = /[（(]\s*源\s*[:：]\s*PRD/;               // (源：PRD…)
const reTechTag = /[（(]\s*技术\s*[)）]/;                  // (技术)
const reIntent = /\bintent\s*[:：]/i;
const reOracle = /\boracle\s*[:：]/i;
const reExample = /\bexample\s*[:：]/i;
const reGoldenTrue = /\bgolden\s*[:：]\s*true\b/i;

/* ---------- risk 敏感启发词（安全敏感预检四类，决策#29） ----------
 * 启发式只升不降：命中而任务包未标 risk: sensitive → 🧑 留签字人确认（非 FAIL，允许误报）。
 * 语义级判定在 develop 侧（阶段 B 有效 risk + 末端 diff 独立预检），此处只做确定性词面拦截。*/
const SENSITIVE_HINTS = [
  // 权限 / 认证 / 数据隔离
  '权限', '鉴权', '认证', '越权', '租户', '密码', 'auth', 'permission', 'guard', 'jwt', 'acl',
  // 不可逆数据操作
  '迁移', 'migration', 'drop', 'truncate', '清空', '批量删', '硬删', 'schema',
  // 金额 / 计费
  '金额', '计费', '价格', '扣费', '支付', '退款', '对账', 'billing', 'payment', 'refund',
  // 对外不可撤销副作用
  '扣款', '短信', '邮件', '发信', 'webhook', 'sms',
];
/* 扫描字段白名单。`risk-note`（作者解释"为什么这次命中是误报"的地方）**刻意不在其中**——
 * 否则解释文字本身必然复述启发词、再次命中，作者只能靠改措辞绕开，而改措辞会削弱说明本身。
 * 这不违反「只升不降」：既有字段的信号一个没少，只是给误报说明一个不自我触发的落点。*/
const RISK_SCAN_FIELDS = ['title', 'description', 'acceptance-criteria', 'files', 'known-risks'];
function sensitiveHits(fm) {
  const chunks = [];
  for (const k of RISK_SCAN_FIELDS) {
    const v = fm[k];
    if (!v) continue;
    chunks.push(scalarText(v), ...listItems(v));
  }
  const text = chunks.join(' ').toLowerCase();
  return SENSITIVE_HINTS.filter(w => {
    const needle = w.toLowerCase();
    // `oracle` 内含字母串 `acl`；ACL 只按独立 token 匹配，避免新 AC schema 让所有任务误升 sensitive。
    if (needle === 'acl') return /(^|[^a-z0-9_])acl(?=$|[^a-z0-9_])/.test(text);
    return text.includes(needle);
  });
}

/* ---------- 归属真空：推卸语检测 ----------
 * 缺陷常落在「A 包不做 ∩ B 包不做」的交集里——两个包各自都合规，没人认领那件事。
 * 只匹配"移交给别人"的措辞，不匹配普通禁令（`do-not` 里的"不改 X / 不新增 Y"是正常内容）。
 * 机械可判的只有三件：① 点名的包 id 不在本 sprint queue（推给不存在的包）；② 两包互推（环）；
 * ③ 未点名任何包 id 的推卸语 → 认领方机器认不出，留 🧑 逐条指认。 */
const PUNT_HINTS = [
  // 「不在本包内另查 X」是实现禁令不是移交，排除 内/中/里 后缀
  /不在本包(?![内中里])/, /不在此包(?![内中里])/, /非本包(负责|职责|范围)/, /本包不(负责|收口|承接|覆盖)/,
  /(收口|统一|落点|接线|入口|实现)不在(本|此)包/,
  /留(给)?(后续|下期|下一期|后面|以后|其它包|其他包|另一包)/,
  /(由|归)\s*[\w一-龥-]{1,24}?包\s*(负责|实现|收口|承接|处理|做)/,
  /后续包/, /另起(一)?包/, /下期(再|另)?(做|补|处理|收口)/,
];
const PUNT_SCAN_FIELDS = ['do-not', 'context'];
const reTaskIdLike = /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+-\d{2,3}\b/gi;

/* 返回本包所有推卸语行：{ text, named: 被点名且在 queue 的包 id, ghosts: 被点名但 queue 里没有的 }
 * 走**原始行**而非 parseFrontmatter 的产物：共用解析器按 YAML 规矩把 ` #` 起的尾串当注释剥掉，
 * 而任务包正文里 `决策 #25` 这类引用很常见，剥完会把同一行后半段（推卸语常在那）一起吃掉。 */
function puntLines(file, selfId, queueIds) {
  const raw = readLines(file);
  const s = raw.findIndex(l => /^---\s*$/.test(l));
  if (s < 0) return [];
  let e = raw.findIndex((l, i) => i > s && /^---\s*$/.test(l));
  if (e < 0) e = raw.length;
  const out = [];
  let curKey = null;
  for (const ln of raw.slice(s + 1, e)) {
    const top = /^\s/.test(ln) ? null : ln.match(/^([A-Za-z_][\w-]*):\s?(.*)$/);
    if (top) curKey = top[1];
    if (!PUNT_SCAN_FIELDS.includes(curKey)) continue;
    const line = (top ? top[2] : ln).replace(/^\s*-\s+/, '').trim();
    if (!line) continue;
    const hit = PUNT_HINTS.map(re => line.match(re)).find(Boolean);
    if (!hit) continue;
    const mentioned = [...new Set(line.match(reTaskIdLike) || [])].filter(x => x !== selfId);
    // 报文只截推卸语前后各 30 字——整行常上百字，从行首截会看不见命中处
    const at = hit.index;
    out.push({
      field: curKey,
      text: (at > 30 ? '…' : '') + line.slice(Math.max(0, at - 30), at + 30) + (at + 30 < line.length ? '…' : ''),
      named: mentioned.filter(x => queueIds.includes(x)),
      ghosts: mentioned.filter(x => !queueIds.includes(x)),
    });
  }
  return out;
}

/* ---------- 任务包 AC 行：抽 (源：PRD …) 标签内的所有 AC-nn id ----------
 * 支持单条多覆盖 (源：PRD AC-01、AC-02) 与人读后缀 (源：PRD AC-01·删除确认)。*/
function acRefIds(ac) {
  const tag = ac.match(/[（(]\s*源\s*[:：]\s*PRD([^)）]*)[)）]/);
  if (!tag) return [];
  const out = []; let m; const re = /AC-\d+/g;
  while ((m = re.exec(tag[1]))) out.push(m[0]);
  return out;
}

/* ---------- PRD：抽核心功能各 AC 列表项的全局唯一 AC-nn id ---------- */
function prdAcIds(prdPath) {
  if (!exists(prdPath)) return null;
  const ids = new Set();
  let inCore = false;
  for (const l of readLines(prdPath)) {
    if (/^##\s/.test(l)) inCore = /^##\s*核心功能/.test(l);
    if (!inCore) continue;
    const m = l.match(/^\s*[-*]\s+(AC-\d+)\s*[:：]/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

/* ---------- sprint.md：抽表格首列 task-id ---------- */
function sprintIds(sprintPath) {
  if (!exists(sprintPath)) return null;
  const ids = [];
  for (const l of readLines(sprintPath)) {
    if (!/^\s*\|/.test(l)) continue;
    const cells = l.split('|').map(c => c.trim());
    const first = cells[1] || '';
    if (!first || first === 'task-id' || /^-{2,}$/.test(first.replace(/\s/g, ''))) continue;
    if (/-.*\d/.test(first)) ids.push(first);            // task-id 形如 hact-v4-001
  }
  return ids;
}

/* ---------- status.yml：抽 tasks[] 的 id/source/iteration（容错，同 check-gate） ---------- */
function parseStatusTasks(statusPath) {
  if (!exists(statusPath)) return null;
  const lines = readLines(statusPath);
  const tasks = [];
  let inTasks = false, baseIndent = null, cur = null;
  const flush = () => { if (cur) { tasks.push(cur); cur = null; } };
  const clean = v => (v || '').trim().replace(/^["']|["']$/g, '').replace(/^\[|\]$/g, '').trim();
  for (const raw of lines) {
    const line = raw.replace(/\t/g, '  ');
    if (/^tasks:\s*$/.test(line)) { inTasks = true; continue; }
    if (!inTasks) continue;
    if (/^\S/.test(line) && !/^-/.test(line)) { flush(); break; }
    if (line.trim() === '') continue;
    const item = line.match(/^(\s*)-\s+(.*)$/);
    if (item) {
      const indent = item[1].length;
      if (baseIndent === null) baseIndent = indent;
      if (indent === baseIndent) {
        flush(); cur = {};
        const kv = item[2].match(/^([A-Za-z_-]+):\s*(.*)$/);
        if (kv) cur[kv[1]] = clean(kv[2]);
        continue;
      }
    }
    const kv = line.match(/^\s+([A-Za-z_-]+):\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = clean(kv[2]);
  }
  flush();
  return tasks;
}

// 迭代内 queue 的三个进料口（三方一致 + 审计留痕两处共用，故提到模块级）。
const ITER_SOURCES = new Set(['sprint', 'integration', 'manual-test']);

/* ---------- status.yml：抽 code_reviews[] 的 iteration/task_id/rounds 拆分（同上容错扫描） ----------
 * 只取顶层键即可判完备性；`comment` 常是长中文单行、`issues:` 是更深缩进的子列表，
 * 均靠「顶层条目缩进 === baseIndent」这一条挡住，不做完整 YAML AST。 */
function parseCodeReviews(statusPath) {
  if (!exists(statusPath)) return null;
  const out = [];
  let inBlk = false, baseIndent = null, cur = null;
  const flush = () => { if (cur) { out.push(cur); cur = null; } };
  const clean = v => (v || '').trim().replace(/^["']|["']$/g, '').trim();
  for (const raw of readLines(statusPath)) {
    const line = raw.replace(/\t/g, '  ');
    if (/^code_reviews:\s*$/.test(line)) { inBlk = true; continue; }
    if (!inBlk) continue;
    if (/^\s*#/.test(line)) continue;                               // 注释行（含顶格 `#` 的 schema 示例块）——
    // 必须先于下面的"顶层新键"判定：真实 status.yml 在 code_reviews[] 中段夹着顶格注释示例
    // （doc-extract 即如此），当作块结束会静默丢掉其后的全部条目（实测漏 4 条）。
    if (/^\S/.test(line) && !/^-/.test(line)) { flush(); break; }   // 顶层新键 → 本块结束
    if (line.trim() === '') continue;
    const item = line.match(/^(\s*)-\s+(.*)$/);
    if (item) {
      const indent = item[1].length;
      if (baseIndent === null) baseIndent = indent;
      if (indent === baseIndent) {
        flush(); cur = {};
        const kv = item[2].match(/^([A-Za-z_-]+):\s*(.*)$/);
        if (kv) cur[kv[1]] = clean(kv[2]);
        continue;
      }
      continue;                                                     // issues[] 等子列表项，跳过
    }
    const kv = line.match(/^\s+([A-Za-z_-]+):\s*(.*)$/);
    if (kv && cur && !(kv[1] in cur)) cur[kv[1]] = clean(kv[2]);    // 首次出现为准，防子块同名键覆盖
  }
  flush();
  return out;
}

const REVIEW_AUDIT_FIELDS = [
  'review_report_dir',
  'review_profile_version',
  'implementation_started_at', 'implementation_completed_at',
  'review_started_at', 'review_completed_at',
  'spec_minutes',
];
const isUInt = v => /^\d+$/.test(v || '');
const isSha40 = v => /^[0-9a-f]{40}$/i.test(v || '');
const isSha256 = v => /^[0-9a-f]{64}$/.test(v || '');
const parseIso = v => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(v || '')) return NaN;
  return Date.parse(v);
};
const ceilMinutes = (start, end) => Math.ceil((end - start) / 60000);
const FOUNDATION_PROFILE_VERSION = 'foundation-review/v1';

function gitOutput(root, args, encoding = 'utf8') {
  return childProcess.execFileSync('git', args, {
    cwd: root,
    encoding,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function gitObjectType(root, object) {
  try { return String(gitOutput(root, ['cat-file', '-t', object])).trim(); }
  catch { return null; }
}

function fixedDiffEvidence(root, base, head) {
  try {
    gitOutput(root, ['cat-file', '-e', `${base}^{tree}`]);
    gitOutput(root, ['cat-file', '-e', `${head}^{tree}`]);
    const bytes = gitOutput(root, ['diff', '--binary', base, head], null);
    const names = gitOutput(root, ['diff', '--name-only', '-z', base, head], null)
      .toString('utf8').split('\0').filter(Boolean).map(name => name.replace(/\\/g, '/')).sort();
    return { hash: crypto.createHash('sha256').update(bytes).digest('hex'), names };
  } catch (error) {
    return { error: String(error.stderr || error.message).trim() };
  }
}

function parseReportFindings(reportPath) {
  const lines = readLines(reportPath);
  const start = lines.findIndex(line => /^## Findings\s*$/.test(line));
  if (start < 0) return [];
  const out = [];
  let current = null;
  const flush = () => { if (current) out.push(current); current = null; };
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    if (/^\s*#/.test(line)) continue;
    const item = line.match(/^\s*-\s+id:\s*['"]?([^'"\s]+)['"]?\s*$/);
    if (item) { flush(); current = { id: item[1] }; continue; }
    const field = line.match(/^\s+(severity|status):\s*['"]?([^'"\s]+)['"]?\s*$/);
    if (field && current) current[field[1]] = field[2];
  }
  flush();
  return out;
}

function resolveProjectFile(root, rel) {
  const absRoot = path.resolve(root);
  const abs = path.resolve(root, rel || '');
  if (!rel || path.isAbsolute(rel) || (abs !== absRoot && !abs.startsWith(absRoot + path.sep))) return null;
  return abs;
}

function findTaskPackages(root, id) {
  const matches = [];
  const bTask = path.join(root, 'b-queue', `${id}.md`);
  if (exists(bTask)) matches.push(bTask);
  const iterationsDir = path.join(root, 'iterations');
  if (fs.existsSync(iterationsDir) && fs.statSync(iterationsDir).isDirectory()) {
    for (const iteration of fs.readdirSync(iterationsDir)) {
      const candidate = path.join(iterationsDir, iteration, 'queue', `${id}.md`);
      if (exists(candidate)) matches.push(candidate);
    }
  }
  return matches;
}

function fullProfileErrors(root, id, profileRel, taskPackagePath, changedFiles, effectiveRisk) {
  const errors = [];
  const profilePath = resolveProjectFile(root, profileRel);
  if (!profilePath || !exists(profilePath)) return [`review_profile 非项目内现存文件：${profileRel || '(empty)'}`];
  let tools, actual;
  try { tools = require('./review-profile'); }
  catch (error) { return [`缺 scripts/review-profile.js 或无法加载：${error.message}`]; }
  try { actual = JSON.parse(fs.readFileSync(profilePath, 'utf8')); }
  catch (error) { return [`${profileRel}: JSON 无法解析：${error.message}`]; }
  const expected = tools.buildReviewProfileFromText(
    fs.readFileSync(taskPackagePath, 'utf8'), changedFiles, effectiveRisk);
  if (actual.schema !== tools.PROFILE_SCHEMA) errors.push(`${profileRel}: schema 非 ${tools.PROFILE_SCHEMA}`);
  if (actual.task_id !== id) errors.push(`${profileRel}: task_id 不匹配`);
  if (actual.task_type !== expected.task_type) errors.push(`${profileRel}: task_type 与权威任务包不一致`);
  if (JSON.stringify(actual.layers) !== JSON.stringify(expected.layers)) errors.push(`${profileRel}: layers 与权威任务包不一致`);
  if (actual.source !== expected.source) errors.push(`${profileRel}: source 与权威任务包不一致`);
  if (actual.effective_risk !== effectiveRisk) errors.push(`${profileRel}: effective_risk 与 round risk 不一致`);
  if (actual.input_fingerprint !== expected.input_fingerprint) errors.push(`${profileRel}: input_fingerprint 与权威输入不一致`);
  if (JSON.stringify(actual.changed_files) !== JSON.stringify(expected.changed_files))
    errors.push(`${profileRel}: changed_files 与 full round 不一致`);
  if (JSON.stringify(actual.selected_dimensions) !== JSON.stringify(expected.selected_dimensions))
    errors.push(`${profileRel}: selected_dimensions 不是选择器重算结果`);
  if (JSON.stringify(actual.omitted_dimensions) !== JSON.stringify(expected.omitted_dimensions))
    errors.push(`${profileRel}: omitted_dimensions 不是选择器重算结果`);
  if (JSON.stringify(actual.signals) !== JSON.stringify(expected.signals))
    errors.push(`${profileRel}: signals 不是选择器重算结果`);
  const selectedIds = Array.isArray(actual.selected_dimensions) ? actual.selected_dimensions.map(x => x && x.id) : [];
  const omittedIds = Array.isArray(actual.omitted_dimensions) ? actual.omitted_dimensions.map(x => x && x.id) : [];
  const partition = [...selectedIds, ...omittedIds].sort();
  if (JSON.stringify(partition) !== JSON.stringify([...tools.DIMENSION_IDS].sort())
      || new Set(partition).size !== tools.DIMENSION_IDS.length)
    errors.push(`${profileRel}: selected/omitted 未形成完整且不重复的维度分区`);
  for (const core of tools.CORE_DIMENSIONS) {
    if (!selectedIds.includes(core)) errors.push(`${profileRel}: core 维度 ${core} 不得裁剪`);
  }
  return errors;
}

function reviewAuditErrors(root, id, cr, options = {}) {
  const errors = [];
  const profileVersion = cr.review_profile_version || '';
  const evidenceVersion = cr.review_evidence_version || '';
  if (evidenceVersion && evidenceVersion !== 'develop-review-round/v2')
    errors.push(`未知 review_evidence_version=${evidenceVersion}`);
  const legacyProfile = options.allowLegacyProfile === true && !profileVersion;
  const foundationProfile = profileVersion === FOUNDATION_PROFILE_VERSION;
  if (foundationProfile && id !== 'foundation')
    errors.push(`${FOUNDATION_PROFILE_VERSION} 只允许 task_id=foundation 使用`);
  let profileTools = null;
  if (!foundationProfile && !legacyProfile) {
    try { profileTools = require('./review-profile'); }
    catch (error) { errors.push(`缺 scripts/review-profile.js 或无法加载：${error.message}`); }
    if (profileTools && profileVersion !== profileTools.PROFILE_SCHEMA)
      errors.push(`review_profile_version 必须为 ${profileTools.PROFILE_SCHEMA}`);
  }
  if (!['pass', 'revised'].includes(cr.freshness)) errors.push('freshness 必须为 pass 或 revised');
  const implStart = parseIso(cr.implementation_started_at);
  const implEnd = parseIso(cr.implementation_completed_at);
  const reviewStart = parseIso(cr.review_started_at);
  const reviewEnd = parseIso(cr.review_completed_at);
  if (!options.preMerge) {
    if (![implStart, implEnd, reviewStart, reviewEnd].every(Number.isFinite)) {
      errors.push('四个 started/completed 字段须为带时区 ISO-8601');
    } else {
      if (implStart > implEnd) errors.push('implementation_started_at 晚于 completed_at');
      if (implEnd !== reviewStart) errors.push('implementation_completed_at 必须等于 review_started_at，避免墙钟留白或重叠');
      if (reviewStart > reviewEnd) errors.push('review_started_at 晚于 completed_at');
    }
    if (!isUInt(cr.spec_minutes)) errors.push('spec_minutes 须为 int>=0');
  }

  const relDir = cr.review_report_dir || '';
  const absRoot = path.resolve(root);
  const absDir = path.resolve(root, relDir);
  if (!relDir || path.isAbsolute(relDir) || (absDir !== absRoot && !absDir.startsWith(absRoot + path.sep))) {
    errors.push('review_report_dir 须为项目根内相对路径');
    return errors;
  }
  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
    errors.push(`review_report_dir 不存在：${relDir}`);
    return errors;
  }

  const preflightPath = path.join(absDir, 'preflight.md');
  let preflightBaseRef = '', preflightBaseTree = '';
  if (!exists(preflightPath)) {
    errors.push('缺 preflight.md');
  } else {
    const pf = parseFrontmatter(preflightPath);
    const p = k => scalarText(pf && pf[k]);
    preflightBaseRef = p('base_ref');
    preflightBaseTree = p('base_tree');
    const pfStart = parseIso(p('started_at')), pfEnd = parseIso(p('completed_at'));
    if (!pf || p('task_id') !== id) errors.push('preflight task_id 不匹配');
    if (!['before-code', 'retroactive'].includes(p('timing'))) errors.push('preflight timing 非法');
    if (!['pass', 'revised'].includes(p('result'))) errors.push('preflight result 未闭合');
    if (!isSha40(p('base_ref')) || !isSha40(p('base_tree'))) errors.push('preflight base_ref/base_tree 非固定 40 位 SHA');
    else {
      if (gitObjectType(root, p('base_ref')) !== 'commit') errors.push('preflight base_ref 不是当前仓可解析的 commit');
      if (gitObjectType(root, p('base_tree')) !== 'tree') errors.push('preflight base_tree 不是当前仓可解析的 tree');
    }
    if (![pfStart, pfEnd].every(Number.isFinite) || pfStart > pfEnd) errors.push('preflight 时间非法');
    if (Number.isFinite(pfStart) && Number.isFinite(pfEnd) && isUInt(cr.spec_minutes)
        && Number(cr.spec_minutes) < ceilMinutes(pfStart, pfEnd))
      errors.push('status spec_minutes 小于 preflight 时间戳可计算的最低墙钟');
  }

  const reports = fs.readdirSync(absDir).filter(f => /^round-\d{2}\.md$/.test(f)).sort();
  if (isUInt(cr.code_rounds) && reports.length !== Number(cr.code_rounds))
    errors.push(`round report 数 ${reports.length} != code_rounds ${cr.code_rounds}`);
  let previousEscalated = false, previousReviewedHead = '', lastConclusion = '';
  let activeProfile = '';
  const openBlocking = new Set();
  const fullProfiles = new Set();
  let taskPackagePath = '';
  let declaredTaskFiles = [];
  let relevantStandardIds = [];
  let taskPackageSchema = '';
  if (!foundationProfile && !legacyProfile) {
    const taskPackages = findTaskPackages(root, id);
    if (taskPackages.length !== 1) errors.push(taskPackages.length
      ? `找到 ${taskPackages.length} 个同 id 任务包，review profile 输入必须唯一`
      : '找不到 A/B 权威任务包，无法重算 review profile');
    else {
      taskPackagePath = taskPackages[0];
      const packageFm = parseFrontmatter(taskPackagePath);
      taskPackageSchema = scalarText(packageFm && packageFm['package-schema']);
      declaredTaskFiles = listItems(packageFm && packageFm.files).map(normalizeFileAsset).sort();
      relevantStandardIds = [...new Set(listItems(packageFm && packageFm['relevant-standards'])
        .map(item => (item.match(/^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+/) || [])[0])
        .filter(Boolean).map(item => item.toUpperCase()))].sort();
    }
  }
  let firstReportStarted = NaN, lastReportCompleted = NaN;
  if (taskPackageSchema === '2' && evidenceVersion !== 'develop-review-round/v2')
    errors.push('package-schema=2 必须写 review_evidence_version=develop-review-round/v2');
  const findingId = new RegExp(`^${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-F\\d{3}$`);
  reports.forEach((file, index) => {
    const rp = parseFrontmatter(path.join(absDir, file));
    const r = k => scalarText(rp && rp[k]);
    const mode = r('mode');
    const risk = r('risk');
    const reportSchema = r('schema');
    const profileRel = r('review_profile');
    const started = parseIso(r('started_at')), completed = parseIso(r('completed_at'));
    if (!rp || r('task_id') !== id) errors.push(`${file}: task_id 不匹配`);
    if (Number(r('round')) !== index + 1) errors.push(`${file}: round 与文件序号不符`);
    if (!['full', 'targeted'].includes(mode)) errors.push(`${file}: mode 非法`);
    if (!['standard', 'sensitive'].includes(risk)) errors.push(`${file}: risk 非法`);
    if (reportSchema && reportSchema !== 'develop-review-round/v2')
      errors.push(`${file}: 未知 round schema=${reportSchema}`);
    if (evidenceVersion === 'develop-review-round/v2' && reportSchema !== 'develop-review-round/v2')
      errors.push(`${file}: review_evidence_version=v2 时 round schema 必须为 develop-review-round/v2`);
    if (reportSchema === 'develop-review-round/v2') {
      if (!rp.standards_checked) errors.push(`${file}: v2 standards_checked 缺失`);
      else if (!foundationProfile) {
        const checked = [...new Set(listItems(rp.standards_checked).map(item => item.toUpperCase()))].sort();
        const extras = checked.filter(item => !relevantStandardIds.includes(item));
        if (extras.length) errors.push(`${file}: standards_checked 含任务包外 id：${extras.join(', ')}`);
        if (mode === 'full' && JSON.stringify(checked) !== JSON.stringify(relevantStandardIds))
          errors.push(`${file}: full standards_checked 必须与 relevant-standards 完整对账`);
      }
    }
    if (index === 0 && mode !== 'full') errors.push(`${file}: 首轮必须 full`);
    if (previousEscalated && mode !== 'full') errors.push(`${file}: 上轮要求 escalate_to_full，本轮却非 full`);
    if (!isSha40(r('base_ref'))) errors.push(`${file}: base_ref 非固定 40 位 SHA`);
    else if (preflightBaseRef && r('base_ref') !== preflightBaseRef) errors.push(`${file}: base_ref 与 preflight 不一致`);
    if (!isSha40(r('reviewed_base')) || !isSha40(r('reviewed_head'))) errors.push(`${file}: reviewed tree 非 40 位 SHA`);
    else if (mode === 'full' && preflightBaseTree && r('reviewed_base') !== preflightBaseTree)
      errors.push(`${file}: full reviewed_base 必须等于 preflight base_tree`);
    else if (mode === 'targeted' && previousReviewedHead && r('reviewed_base') !== previousReviewedHead)
      errors.push(`${file}: targeted reviewed_base 必须等于上一轮 reviewed_head`);
    if (!isSha256(r('diff_sha256'))) errors.push(`${file}: diff_sha256 非 64 位小写 hex`);
    const reportedChangedFiles = listItems(rp && rp.changed_files).map(name => name.replace(/\\/g, '/')).sort();
    if (!reportedChangedFiles.length) errors.push(`${file}: changed_files 为空`);
    if (isSha40(r('reviewed_base')) && isSha40(r('reviewed_head'))) {
      const fixed = fixedDiffEvidence(root, r('reviewed_base'), r('reviewed_head'));
      if (fixed.error) errors.push(`${file}: 固定 diff 不可复现：${fixed.error}`);
      else {
        if (r('diff_sha256') !== fixed.hash) errors.push(`${file}: diff_sha256 与 git diff --binary 实际字节不一致`);
        if (JSON.stringify(reportedChangedFiles) !== JSON.stringify(fixed.names))
          errors.push(`${file}: changed_files 与固定 diff 实际文件集不一致`);
        if (declaredTaskFiles.length) {
          const undeclared = fixed.names.filter(name => !declaredTaskFiles.includes(name.toLowerCase()));
          if (undeclared.length) errors.push(`${file}: 固定 diff 超出任务包 files：${undeclared.join(', ')}`);
        }
      }
    }
    if (legacyProfile) {
      // P0 存量报告没有 review_profile；保留原固定 diff/墙钟链审计，不虚构历史 profile。
    } else if (foundationProfile) {
      if (profileRel !== FOUNDATION_PROFILE_VERSION)
        errors.push(`${file}: Foundation review_profile 必须为 ${FOUNDATION_PROFILE_VERSION}`);
    } else if (mode === 'full') {
      const absProfile = resolveProjectFile(root, profileRel);
      const profileKey = absProfile ? path.normalize(absProfile) : profileRel;
      if (fullProfiles.has(profileKey)) errors.push(`${file}: 每次 full 必须生成新的 review_profile`);
      fullProfiles.add(profileKey);
      if (taskPackagePath && ['standard', 'sensitive'].includes(risk))
        errors.push(...fullProfileErrors(root, id, profileRel, taskPackagePath, reportedChangedFiles, risk)
          .map(message => `${file}: ${message}`));
      activeProfile = profileKey;
    } else {
      const absProfile = resolveProjectFile(root, profileRel);
      const profileKey = absProfile ? path.normalize(absProfile) : profileRel;
      if (!activeProfile || profileKey !== activeProfile)
        errors.push(`${file}: targeted 必须继承最近一次 full 的 review_profile`);
    }
    if (![started, completed].every(Number.isFinite) || started > completed) errors.push(`${file}: 时间非法`);
    if (!['pass', 'revise', 'evidence-needed'].includes(r('conclusion'))) errors.push(`${file}: conclusion 非法`);
    if (!['true', 'false'].includes(r('escalate_to_full'))) errors.push(`${file}: escalate_to_full 非布尔`);
    if (mode === 'targeted') {
      if (!r('prior_report') || r('prior_report') === 'null') {
        errors.push(`${file}: targeted 缺 prior_report`);
      } else if (index === 0 || path.resolve(root, r('prior_report')) !== path.resolve(absDir, reports[index - 1])) {
        errors.push(`${file}: prior_report 必须指向紧邻上一轮报告`);
      }
      const ids = listItems(rp && rp.target_finding_ids);
      if (!ids.length) errors.push(`${file}: targeted 缺 target_finding_ids`);
      else if (ids.some(x => !findingId.test(x))) errors.push(`${file}: target_finding_ids 不符合 ${id}-FNNN`);
      if ([...openBlocking].some(openId => !ids.includes(openId)))
        errors.push(`${file}: targeted 未覆盖此前全部 open blocking findings`);
      const reportFindingIds = new Set(parseReportFindings(path.join(absDir, file)).map(finding => finding.id));
      if (ids.some(target => !reportFindingIds.has(target)))
        errors.push(`${file}: targeted 报告未逐条回写 target_finding_ids`);
    }
    const reportFindings = parseReportFindings(path.join(absDir, file));
    for (const finding of reportFindings) {
      if (!findingId.test(finding.id || '')) errors.push(`${file}: finding id 不符合 ${id}-FNNN`);
      if (!['blocking', 'advisory'].includes(finding.severity || '')) errors.push(`${file}: ${finding.id} severity 非法或缺失`);
      if (!['open', 'verified-closed', 'advisory'].includes(finding.status || '')) errors.push(`${file}: ${finding.id} status 非法或缺失`);
      if (finding.severity === 'blocking' && finding.status === 'open') openBlocking.add(finding.id);
      if (finding.status === 'verified-closed' || finding.status === 'advisory') openBlocking.delete(finding.id);
    }
    if (r('conclusion') === 'pass' && openBlocking.size)
      errors.push(`${file}: conclusion=pass 但仍有 open blocking finding：${[...openBlocking].join(', ')}`);
    if (index === 0) firstReportStarted = started;
    lastReportCompleted = completed;
    previousReviewedHead = r('reviewed_head');
    lastConclusion = r('conclusion');
    previousEscalated = r('escalate_to_full') === 'true';
  });
  if (reports.length && Number.isFinite(reviewStart) && firstReportStarted !== reviewStart)
    errors.push('review_started_at 与首轮 report.started_at 不一致');
  if (reports.length && Number.isFinite(reviewEnd) && lastReportCompleted !== reviewEnd)
    errors.push('review_completed_at 与末轮 report.completed_at 不一致');
  if (reports.length && lastConclusion !== 'pass') errors.push('末轮 report.conclusion 必须为 pass');
  if (reports.length && previousEscalated) errors.push('末轮仍要求 escalate_to_full，审查尚未闭合');
  if (openBlocking.size) errors.push(`审查链仍有 open blocking findings：${[...openBlocking].join(', ')}`);
  return errors;
}

/* A/B 共用的单任务 review 审计。显式调用代表当前任务正在走新流程，
 * 因此缺字段是 FAIL；迭代扫描仍对没有任何新字段的存量条目只留人签。 */
function checkReviewAudit(taskId, root) {
  const statusPath = path.join(root, 'status.yml');
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(taskId || '')) {
    fail('review 审计', statusPath, 'task-id 只允许字母、数字和连字符，拒绝路径片段');
    return;
  }
  const crs = parseCodeReviews(statusPath);
  if (crs === null) {
    fail('review 审计', statusPath, '缺 status.yml');
    return;
  }
  const matches = crs.filter(c => c.task_id === taskId);
  if (matches.length !== 1) {
    fail('review 审计', statusPath, matches.length
      ? `${taskId} 有 ${matches.length} 个 code_reviews[] 条目，必须唯一`
      : `${taskId} 无 code_reviews[] 条目`);
    return;
  }
  const cr = matches[0];
  const errors = [];
  if (!isUInt(cr.rounds) || Number(cr.rounds) < 1) errors.push('rounds 须为 int>=1');
  if (!isUInt(cr.code_rounds) || Number(cr.code_rounds) < 1) errors.push('code_rounds 须为 int>=1');
  if (!isUInt(cr.spec_rounds)) errors.push('spec_rounds 须为 int>=0');
  if (isUInt(cr.rounds) && isUInt(cr.code_rounds) && isUInt(cr.spec_rounds)
      && Number(cr.rounds) !== Number(cr.code_rounds) + Number(cr.spec_rounds))
    errors.push('rounds 必须等于 code_rounds + spec_rounds');
  const missing = REVIEW_AUDIT_FIELDS.filter(k => !(k in cr));
  if (missing.length) errors.push(`缺墙钟/report 字段：${missing.join('/')}`);
  else errors.push(...reviewAuditErrors(root, taskId, cr));
  if (errors.length) fail('review 审计', statusPath, `${taskId}: ${errors.join('；')}`);
  else pass('review 审计', `${taskId} 的 freshness、轮次、固定 diff、review profile、逐轮报告与墙钟证据均合法`);
}

function checkReviewChain(taskId, root) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(taskId || '')) {
    fail('review chain', 'task-id', 'task-id 只允许字母、数字和连字符');
    return;
  }
  const candidates = [];
  const bDir = path.join(root, 'b-reviews', taskId);
  if (fs.existsSync(bDir) && fs.statSync(bDir).isDirectory()) candidates.push(bDir);
  const iterations = path.join(root, 'iterations');
  if (fs.existsSync(iterations) && fs.statSync(iterations).isDirectory()) for (const version of fs.readdirSync(iterations)) {
    const dir = path.join(iterations, version, 'code-reviews', taskId);
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) candidates.push(dir);
  }
  if (candidates.length !== 1) {
    fail('review chain', taskId, `须唯一定位 review 目录，当前 ${candidates.length} 个`);
    return;
  }
  const reports = fs.readdirSync(candidates[0]).filter(name => /^round-\d{2}\.md$/.test(name)).sort();
  const taskPackages = findTaskPackages(root, taskId);
  const packageFm = taskPackages.length === 1 ? parseFrontmatter(taskPackages[0]) : null;
  const cr = {
    freshness: 'pass',
    review_report_dir: path.relative(root, candidates[0]).replace(/\\/g, '/'),
    review_profile_version: taskId === 'foundation' ? FOUNDATION_PROFILE_VERSION : 'develop-review-profile/v1',
    review_evidence_version: scalarText(packageFm && packageFm['package-schema']) === '2' ? 'develop-review-round/v2' : '',
    code_rounds: reports.length,
  };
  const errors = reviewAuditErrors(root, taskId, cr, { preMerge: true });
  errors.forEach(message => fail('review chain', cr.review_report_dir, `${taskId}: ${message}`));
  if (!errors.length) pass('review chain', `${taskId} 的 preflight/profile/fixed diff/round/finding 链可在合并前复现`);
}

function checkReady(subject, root) {
  const selectedIds = String(subject || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!selectedIds.length || selectedIds.some(id => !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(id))) {
    fail('认领就绪', 'task-id-list', '任务列表只允许逗号分隔的字母、数字和连字符');
    return;
  }
  const packages = [];
  for (const id of selectedIds) {
    const matches = findTaskPackages(root, id);
    if (matches.length !== 1) {
      fail('认领就绪', id, matches.length ? `找到 ${matches.length} 个同 id 任务包` : '找不到任务包');
      continue;
    }
    const fm = parseFrontmatter(matches[0]);
    packages.push({ id, deps: listItems(fm && fm.depends_on), fm, file: matches[0] });
  }
  const statusTasks = parseStatusTasks(path.join(root, 'status.yml'));
  if (statusTasks === null) {
    fail('认领就绪', 'status.yml', '缺 status.yml，无法证明依赖已 merged');
    return;
  }
  const errors = dependencyReadinessErrors(packages, selectedIds, statusTasks);
  errors.forEach(message => fail('认领就绪', 'status.yml', message));
  if (!errors.length && packages.length === selectedIds.length)
    pass('认领就绪', `${selectedIds.join(' → ')} 依赖闭合，外部依赖均已 merged`);
}

function checkWaveReady(subject, root) {
  const selectedIds = String(subject || '').split(',').map(value => value.trim()).filter(Boolean);
  if (selectedIds.length < 2 || selectedIds.some(id => !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(id))) {
    fail('wave 准入', 'task-id-list', 'wave 至少 2 个任务，且只允许逗号分隔的字母、数字和连字符');
    return;
  }
  const packages = [];
  for (const id of selectedIds) {
    const matches = findTaskPackages(root, id);
    if (matches.length !== 1) {
      fail('wave 准入', id, matches.length ? `找到 ${matches.length} 个同 id 任务包` : '找不到任务包');
      continue;
    }
    const fm = parseFrontmatter(matches[0]);
    const layers = listItems(fm && fm.layers).map(value => value.toLowerCase());
    packages.push({
      id,
      deps: listItems(fm && fm.depends_on),
      source: scalarText(fm && fm.source).toLowerCase(),
      risk: (scalarText(fm && fm.risk) || 'standard').toLowerCase(),
      layer: layers.join(','),
      fm,
      file: matches[0],
    });
  }
  const statusTasks = parseStatusTasks(path.join(root, 'status.yml'));
  if (statusTasks === null) {
    fail('wave 准入', 'status.yml', '缺 status.yml，无法证明依赖与 active consumer');
    return;
  }
  const errors = dependencyReadinessErrors(packages, selectedIds, statusTasks);
  const layers = new Set(packages.map(pkg => pkg.layer));
  if (packages.some(pkg => pkg.source !== 'sprint')) errors.push('wave 只允许 source=sprint');
  if (packages.some(pkg => pkg.risk !== 'standard')) errors.push('wave 只允许已声明 risk=standard；语义有效 risk 仍由主线前置复核');
  if (layers.size !== 1 || layers.has('')) errors.push('wave 任务必须属于同一明确 layer');
  const selected = new Set(selectedIds);
  const activeConsumers = statusTasks.filter(task => {
    if (selected.has(task.id) || !['taken-by', 'done'].includes(task.status)) return false;
    const deps = String(task.depends_on || '').split(',').map(value => value.trim()).filter(Boolean);
    return deps.some(dep => selected.has(dep));
  });
  if (activeConsumers.length) errors.push(`存在集合外 active consumer：${activeConsumers.map(task => task.id).join(', ')}`);
  const selectedNotAvailable = statusTasks.filter(task => selected.has(task.id) && task.status !== '可取');
  if (selectedNotAvailable.length) errors.push(`候选任务并非全部 [可取]：${selectedNotAvailable.map(task => `${task.id}=${task.status}`).join(', ')}`);
  errors.forEach(message => fail('wave 准入', 'status.yml', message));
  if (!errors.length && packages.length === selectedIds.length)
    pass('wave 准入', `${selectedIds.join(' → ')} 为同 layer/standard/sprint，依赖闭合且无已登记 active consumer`);
}

function checkWaveState(progressRel, root) {
  const progressPath = resolveProjectFile(root, progressRel);
  if (!progressPath || !exists(progressPath)) {
    fail('wave 恢复', progressRel || '<空>', 'progress.json 不存在或越界');
    return;
  }
  let progress;
  try { progress = JSON.parse(fs.readFileSync(progressPath, 'utf8')); }
  catch (error) { fail('wave 恢复', progressRel, `progress.json 无法解析：${error.message}`); return; }
  if (progress.schema !== 'wave-progress/v1' || !progress.branch || !Array.isArray(progress.tasks) || progress.tasks.length < 2) {
    fail('wave 恢复', progressRel, '须为 wave-progress/v1，含 branch 与至少 2 个 tasks');
    return;
  }
  const branch = progress.branch;
  try { gitOutput(root, ['rev-parse', '--verify', `refs/heads/${branch}`]); }
  catch { fail('wave 恢复', branch, '本地 wave branch 不可解析'); }
  const statusTasks = parseStatusTasks(path.join(root, 'status.yml'));
  if (statusTasks === null) {
    fail('wave 恢复', 'status.yml', '缺 status.yml');
    return;
  }
  const progressIds = progress.tasks.map(task => task.id);
  const group = statusTasks.filter(task => task.branch === branch);
  const branchIds = group.map(task => task.id).sort();
  const expectedIds = [...progressIds].sort();
  if (JSON.stringify(branchIds) !== JSON.stringify(expectedIds))
    fail('wave 恢复', 'status.yml', `progress tasks 与该 branch 全部任务不一致：progress=${expectedIds.join(',')} status=${branchIds.join(',')}`);
  const wrongBranch = group.filter(task => task.branch !== branch);
  if (wrongBranch.length) fail('wave 恢复', 'status.yml', `任务未绑定 progress branch：${wrongBranch.map(task => task.id).join(', ')}`);
  const escaped = group.filter(task => !['taken-by', 'done'].includes(task.status));
  if (escaped.length) fail('wave 恢复', 'status.yml', `同 wave 不得部分退回可取/merged：${escaped.map(task => `${task.id}=${task.status}`).join(', ')}`);
  const assignees = new Set(group.map(task => task.assigned_to).filter(Boolean));
  if (assignees.size > 1) fail('wave 恢复', 'status.yml', '同 wave 出现多个 assigned_to');
  for (const task of progress.tasks) {
    if (!['accepted', 'current', 'pending'].includes(task.state)) {
      fail('wave 恢复', progressRel, `${task.id}: state 非 accepted/current/pending`);
      continue;
    }
    if (task.state === 'accepted') {
      if (!isSha40(task.commit) || gitObjectType(root, task.commit) !== 'commit') {
        fail('wave 恢复', progressRel, `${task.id}: accepted commit 不可解析`);
        continue;
      }
      try { gitOutput(root, ['merge-base', '--is-ancestor', task.commit, `refs/heads/${branch}`]); }
      catch { fail('wave 恢复', progressRel, `${task.id}: accepted commit 不是 wave branch 祖先`); }
      const evidence = [task.preflight, task.profile, task.final_report];
      if (evidence.some(value => !value || typeof value !== 'string')) {
        fail('wave 恢复', progressRel, `${task.id}: accepted 必须记录 preflight/profile/final_report`);
        continue;
      }
      const treeFiles = String(gitOutput(root, ['ls-tree', '-r', '--name-only', task.commit])).split(/\r?\n/);
      const missingEvidence = evidence.filter(relative => !treeFiles.includes(relative.replace(/\\/g, '/')));
      if (missingEvidence.length) {
        fail('wave 恢复', progressRel, `${task.id}: accepted commit 缺审计物 ${missingEvidence.join(', ')}`);
        continue;
      }
      const reportRel = task.final_report.replace(/\\/g, '/');
      const committedReport = String(gitOutput(root, ['show', `${task.commit}:${reportRel}`]));
      const field = key => ((committedReport.match(new RegExp(`^${key}:\\s*(.+)$`, 'm')) || [])[1] || '').trim();
      if (field('task_id') !== task.id || field('schema') !== 'develop-review-round/v2' || field('conclusion') !== 'pass')
        fail('wave 恢复', progressRel, `${task.id}: commit 内 final report 的 task/schema/conclusion 非法`);
      if (!isSha40(field('reviewed_head')) || gitObjectType(root, field('reviewed_head')) !== 'tree')
        fail('wave 恢复', progressRel, `${task.id}: commit 内 final report reviewed_head 不可解析`);
    }
  }
  if (!findings.some(item => item.level === 'fail'))
    pass('wave 恢复', `${group.length} 个任务的 branch/status/progress/accepted commit+report 可共同恢复`);
}

function checkWorktreeFromReports(subject, root, progressIds = '') {
  const reportPaths = subject === 'none' ? [] : String(subject || '').split(',').map(value => value.trim()).filter(Boolean);
  const allowedFiles = new Set();
  const allowedDirs = [];
  const acceptedBlobs = new Map();
  // 只豁免显式本轮任务的本地进度；不进入 index 或被审实现 tree。
  if (progressIds) {
    const tasks = parseStatusTasks(path.join(root, 'status.yml'));
    const staged = new Set(gitOutput(root, ['diff', '--cached', '--name-only', '-z'], null)
      .toString('utf8').split('\0').filter(Boolean));
    for (const id of progressIds.split(',')) {
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id) || !tasks.some(task => task.id === id)) {
        fail('工作树白名单', id || '<空>', 'progress 必须指定 status.yml 中存在的本轮 task-id');
        continue;
      }
      const relative = `_meta/sessions/develop-${id}-progress.md`;
      const absolute = path.join(root, relative);
      if (staged.has(relative)) {
        fail('工作树白名单', relative, '进度文件不得暂存进实现 tree；保留工作区文件并分离暂存');
        continue;
      }
      let progressStat;
      try { progressStat = fs.lstatSync(absolute); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (progressStat && !progressStat.isFile()) {
        fail('工作树白名单', relative, '进度路径必须是普通文件，不接受符号链接或目录');
        continue;
      }
      if (progressStat) {
        const realRoot = fs.realpathSync(root);
        const realRelative = path.relative(realRoot, fs.realpathSync(absolute));
        if (realRelative.replace(/\\/g, '/') !== relative) {
          fail('工作树白名单', relative, '进度路径必须是项目内原位普通文件，不接受符号链接或目录映射');
          continue;
        }
      }
      allowedFiles.add(relative);
    }
  }
  for (const relative of reportPaths) {
    const report = resolveProjectFile(root, relative);
    if (!report || !exists(report)) {
      fail('工作树白名单', relative || '<空>', 'prior final report 不存在或越界');
      continue;
    }
    const fm = parseFrontmatter(report);
    const value = key => scalarText(fm && fm[key]);
    const reportDir = path.dirname(report);
    const roundFiles = fs.readdirSync(reportDir).filter(name => /^round-\d{2}\.md$/.test(name)).sort();
    if (path.basename(report) !== roundFiles.at(-1)) {
      fail('工作树白名单', relative, '传入报告不是该任务最后一轮');
      continue;
    }
    if (value('conclusion') !== 'pass' || value('escalate_to_full') !== 'false') {
      fail('工作树白名单', relative, 'prior final report 未 pass 或仍要求 full escalation');
      continue;
    }
    const reportFindings = parseReportFindings(report);
    if (reportFindings.some(finding => finding.severity === 'blocking' && finding.status === 'open')) {
      fail('工作树白名单', relative, 'prior final report 仍有 open blocking finding');
      continue;
    }
    const changedFiles = listItems(fm && fm.changed_files).map(file => file.replace(/\\/g, '/')).sort();
    const fixed = fixedDiffEvidence(root, value('reviewed_base'), value('reviewed_head'));
    if (fixed.error || fixed.hash !== value('diff_sha256')
        || JSON.stringify(fixed.names) !== JSON.stringify(changedFiles)) {
      fail('工作树白名单', relative, `prior final report 固定 diff 不可复现或证据不一致${fixed.error ? `：${fixed.error}` : ''}`);
      continue;
    }
    for (const file of changedFiles) {
      allowedFiles.add(file);
      let reviewedBlob = null;
      try { reviewedBlob = String(gitOutput(root, ['rev-parse', `${value('reviewed_head')}:${file}`])).trim(); }
      catch { reviewedBlob = null; }
      acceptedBlobs.set(file, reviewedBlob);
    }
    allowedDirs.push(path.relative(root, reportDir).replace(/\\/g, '/') + '/');
  }
  let dirty = [];
  try {
    const commands = [
      ['diff', '--name-only', '-z'],
      ['diff', '--cached', '--name-only', '-z'],
      ['ls-files', '--others', '--exclude-standard', '-z'],
    ];
    dirty = [...new Set(commands.flatMap(args => gitOutput(root, args, null).toString('utf8')
      .split('\0').filter(Boolean).map(file => file.replace(/\\/g, '/'))))];
    const stash = String(gitOutput(root, ['stash', 'list'])).trim();
    if (stash) fail('工作树白名单', 'git stash list', '存在 stash；先确认归属和是否会 pop，再进入下一任务');
  } catch (error) {
    fail('工作树白名单', root, `无法读取 Git 工作树：${String(error.stderr || error.message).trim()}`);
    return;
  }
  const unexpected = dirty.filter(file => !allowedFiles.has(file) && !allowedDirs.some(dir => file.startsWith(dir)));
  if (unexpected.length) fail('工作树白名单', root, `存在非前序 accepted 实现/审计产物的改动：${unexpected.join(', ')}`);
  for (const [file, reviewedBlob] of acceptedBlobs) {
    let indexBlob = null, worktreeBlob = null;
    try { indexBlob = String(gitOutput(root, ['rev-parse', `:${file}`])).trim(); } catch { indexBlob = null; }
    const absolute = path.join(root, file);
    if (exists(absolute)) {
      try { worktreeBlob = String(gitOutput(root, ['hash-object', '--', file])).trim(); } catch { worktreeBlob = null; }
    }
    if (indexBlob !== reviewedBlob || worktreeBlob !== reviewedBlob)
      fail('工作树白名单', file, '当前 index/worktree blob 已偏离 prior report reviewed_head，存在同路径二次未审修改');
  }
  if (!findings.some(item => item.level === 'fail')) pass('工作树白名单', reportPaths.length
    ? `仅存在 ${reportPaths.length} 个 final/pass 任务的原样 accepted 实现与审计产物`
    : '首任务工作树与 index 干净');
}

/* ====================== 主校验 ====================== */
function checkSprint(iteration, root) {
  const iterDir = path.join(root, 'iterations', iteration);
  const queueDir = path.join(iterDir, 'queue');
  if (!fs.existsSync(queueDir)) {
    fail('queue 目录', queueDir, `queue 目录不存在：${queueDir}`);
    return;
  }
  const files = fs.readdirSync(queueDir).filter(f => f.endsWith('.md'));
  if (files.length === 0) { fail('任务包存在', queueDir, 'queue 目录无任务包'); return; }

  const packages = [];     // {id, fm, layers, deps, file}
  let unparsed = 0;        // frontmatter 解析失败数 —— queue 侧集合因此不完整，见下方三方一致
  for (const f of files) {
    const fp = path.join(queueDir, f);
    let fm;
    try { fm = parseFrontmatter(fp); }
    catch (e) { fail('frontmatter 解析', fp, `解析失败：${e.message}`); unparsed++; continue; }
    if (!fm) { fail('frontmatter 解析', fp, '未找到 YAML frontmatter（--- 包裹）'); unparsed++; continue; }
    const id = f.replace(/\.md$/, '');
    const layersV = fm['layers'];
    const layers = layersV ? (layersV.items.length ? layersV.items : [scalarText(layersV)])
                              .join(',').replace(/[\[\]]/g, '') : '';
    const deps = listItems(fm['depends_on']);
    packages.push({
      id,
      fm,
      file: fp,
      layersStr: layers,
      deps,
      strictSchema: scalarText(fm['package-schema']) === '2',
    });
  }

  // 哪些 backend 任务被前端 depends_on 消费（→ api-contract 必填）
  const consumedByFE = new Set();
  for (const p of packages) {
    if (/frontend/.test(p.layersStr)) for (const d of p.deps) consumedByFE.add(d);
  }

  // 收集任务包 AC tag 引用到的 PRD AC id（逐条反向覆盖用）+ 解析 PRD AC id 集
  const referencedAcIds = new Set();
  const prdPath = path.join(iterDir, 'prd.md');
  const prdIds = prdAcIds(prdPath);   // Set | null（存量无 prd.md → 退人工兜底）

  for (const p of packages) {
    const where = p.file;
    const packageSchema = scalarText(p.fm['package-schema']);
    // package-schema 由新版任务包显式声明。历史 V6 包没有该字段，不能因为后来新增
    // contract-impact / asset-writes / supersedes 等字段而被追溯判红；它们仍经过下方
    // 既有的依赖、引用和 AC 校验，但不获得新版并行资产声明的资格。
    const strictPackageSchema = packageSchema === '2';
    if (packageSchema && packageSchema !== '2') fail('任务包 schema', where, `${p.id}：未知 package-schema=${packageSchema}`);
    if (strictPackageSchema && valEmpty('module', p.fm.module)) fail('任务包 module', where, `${p.id}：schema 2 必填 TRD 稳定 module`);
    // 1. 字段完备
    const requiredFields = strictPackageSchema ? REQUIRED : REQUIRED.filter(key => !['contract-impact', 'asset-writes', 'supersedes'].includes(key));
    for (const key of requiredFields) {
      if (valEmpty(key, p.fm[key])) fail('字段完备', where, `${p.id}：字段「${key}」缺失/为空/占位`);
    }
    // 新格式任务包必须显式声明共享写集；存量旧格式缺字段继续兼容，但不得靠省略字段获得并行资格。
    if (strictPackageSchema && !p.fm['asset-writes'])
      fail('共享写集字段', where, `${p.id}：新任务包缺 asset-writes；无共享资产也必须填 []`);
    if (strictPackageSchema && !p.fm['contract-impact'])
      fail('契约影响字段', where, `${p.id}：新任务包缺 contract-impact；实现已签契约填 governed，不触及填 none`);
    const contractImpact = scalarText(p.fm['contract-impact']).toLowerCase();
    if (p.fm['contract-impact'] && !['governed', 'none'].includes(contractImpact))
      fail('契约影响字段', where, `${p.id}：contract-impact=${contractImpact} 非法，须为 governed 或 none`);
    for (const asset of listItems(p.fm['asset-writes'])) {
      if (!/^[a-z][a-z0-9_-]*:\S/i.test(asset))
        fail('共享写集格式', where, `${p.id}：asset-writes「${asset}」须使用 kind:value 稳定键`);
    }
    // 1b. api-contract 条件必填
    if (/backend/.test(p.layersStr) && consumedByFE.has(p.id)) {
      if (valEmpty('api-contract', p.fm['api-contract']))
        fail('api-contract 必填', where, `${p.id}：backend 且被前端任务 depends_on 消费，api-contract 须填（当前缺/占位/仍注释）`);
    }
    // 2. reference 稳定锚 + ux-flows/trd 链
    const refs = listItems(p.fm['reference']);
    const designRefFormat = scalarText(p.fm['design-reference-format']).toLowerCase();
    const enforceDesignRef = packageSchema === '2' || Boolean(designRefFormat);
    if (/frontend/.test(p.layersStr) && enforceDesignRef) {
      const designPath = path.join(root, 'design.md');
      if (!['sliced-v1', 'legacy-full'].includes(designRefFormat)) {
        fail('reference design', where, `${p.id}：frontend 须填 design-reference-format=sliced-v1|legacy-full`);
      } else if (!exists(designPath)) {
        fail('reference design', where, `${p.id}：项目根缺 design.md`);
      } else {
        const designText = fs.readFileSync(designPath, 'utf8');
        const designRefs = refs.filter(ref => /design\.md/i.test(ref));
        const globalRef = designRefs.some(ref => /全局视觉基线|第?[〇一二三四五六七0-7]节/i.test(ref));
        const pageHeader = designText.match(/^##\s+[^\r\n]*页面规格[^\r\n]*$/m);
        const hasPageSection = Boolean(pageHeader);
        const pageStart = pageHeader ? pageHeader.index + pageHeader[0].length : designText.length;
        const nextTopOffset = designText.slice(pageStart).search(/^##\s+/m);
        const pageBody = designText.slice(pageStart, nextTopOffset >= 0 ? pageStart + nextTopOffset : designText.length);
        const pageTitles = [...pageBody.matchAll(/^###\s+(.+)$/gm)]
          .map(match => match[1].trim()).filter(title => !/[<{].*[>}]|页面\/功能名/.test(title));
        if (designRefFormat === 'legacy-full') {
          if (!designRefs.some(ref => /全文（存量）|全文\(存量\)/i.test(ref)))
            fail('reference design', where, `${p.id}：legacy-full 必须显式写 design.md 全文（存量）`);
          if (hasPageSection && pageTitles.length)
            fail('reference design', where, `${p.id}：design 已有页面规格标题，不得继续用 legacy-full`);
        } else {
          if (!globalRef) fail('reference design', where, `${p.id}：sliced-v1 缺 design.md 全局视觉基线锚`);
          const baseline = scalarText(p.fm['baseline']).toLowerCase() === 'visual';
          if (!baseline && !pageTitles.some(title => designRefs.some(ref => ref.includes(title))))
            fail('reference design', where, `${p.id}：sliced-v1 非视觉地基包须引用 design.md 中真实页面规格标题`);
        }
      }
    } else if (!/frontend/.test(p.layersStr) && p.fm['design-reference-format']) {
      fail('reference design', where, `${p.id}：非 frontend 不得填写 design-reference-format`);
    }
    if (refs.length) {
      const noAnchor = refs.filter(r => !hasStableAnchor(r)
        && !(designRefFormat === 'legacy-full' && /design\.md.*全文[（(]存量[）)]/i.test(r)));
      if (noAnchor.length) fail('reference 稳定锚', where, `${p.id}：${noAnchor.length} 条 reference 无符号/章节/行号锚（首条：${noAnchor[0].slice(0, 40)}…）`);
      // draft-ux 是**可选**环节（PRD 标 `draft-ux: 需要` 才触发）——ux-flows.md 不存在时，
      // 前端 AC 的形态权威落在 TRD「交互技术方案」段，此处不得强求引用一份不存在的文件。
      // 存在时照旧强制（收窄非关闭）。承 v4「source 三口放行」同一处置：检查器不得把可选环节当必选前提。
      if (/frontend/.test(p.layersStr) && fs.existsSync(path.join(iterDir, 'ux-flows.md'))
          && !refs.some(r => /ux-flows/i.test(r)))
        fail('reference ux-flows', where, `${p.id}：前端任务 reference 未含 ux-flows 稳定锚`);
      if (/backend/.test(p.layersStr) && !refs.some(r => /trd/i.test(r)))
        fail('reference trd', where, `${p.id}：后端任务 reference 未含 trd 稳定锚`);
    }
    // 3. AC 正向 tag + 逐条 id 存在性
    const acs = listItems(p.fm['acceptance-criteria']);
    const acFormat = scalarText(p.fm['ac-format']);
    for (const ac of acs) {
      const hasSrc = reAcTag.test(ac), hasTech = reTechTag.test(ac);
      if (!hasSrc && !hasTech)
        fail('AC 回链 tag', where, `${p.id}：AC 缺 (源：PRD…) 或 (技术) 标注 —— ${ac.slice(0, 40)}…`);
      if (hasSrc) {
        const ids = acRefIds(ac);
        if (!ids.length) fail('AC 回链 id', where, `${p.id}：(源：PRD…) 内无 AC-nn id —— ${ac.slice(0, 40)}…`);
        for (const id of ids) {
          referencedAcIds.add(id);
          if (prdIds && !prdIds.has(id)) fail('AC 正向:悬空', where, `${p.id}：AC 回链 ${id} 在 PRD 不存在（打错号/已退休）`);
        }
      }
      if (acFormat === 'intent-oracle-v1') {
        if (!reIntent.test(ac) || !reOracle.test(ac))
          fail('AC intent/oracle', where, `${p.id}：新格式 AC 必须同时含 intent 与 oracle —— ${ac.slice(0, 50)}…`);
        if (reGoldenTrue.test(ac) && !reExample.test(ac))
          fail('AC golden', where, `${p.id}：golden: true 但缺 example —— ${ac.slice(0, 50)}…`);
      }
    }
  }
  if (findings.filter(f => f.level === 'fail').length === 0) pass('任务包字段/AC/reference', `${packages.length} 个任务包字段完备、reference 含稳定锚、AC 回链与新格式合法`);

  // 3b. 共享写集：同文件或同资产的两个任务必须存在任一方向的依赖路径，默认串行。
  const assetConflicts = sharedAssetConflicts(packages.filter(p => p.strictSchema));
  for (const conflict of assetConflicts) {
    fail('共享写集冲突', queueDir, `${conflict.left} 与 ${conflict.right} 同写 ${conflict.overlap.join('、')}，但 depends_on 无任一方向的依赖路径；补依赖并标串行，或证明并拆成不重叠资产键`);
  }
  if (packages.some(p => !p.strictSchema))
    human('共享写集冲突', '含存量任务包，涉及旧包的共享写入需人工核对；未获得新版并行资产声明资格');
  else if (!assetConflicts.length) pass('共享写集冲突', '同文件/同共享资产写入均已由依赖路径串行化');

  // 4. AC 逐条反向覆盖：PRD 每个 AC-nn 被 ≥1 任务包 tag 引用（替代旧功能级——逐条严格强于功能级）
  if (prdIds === null) {
    human('AC 逐条覆盖', `未找到 ${prdPath}（存量项目），逐条 AC 反向覆盖无法机械核 —— 由签字人确认 PRD 每条 AC 均有任务覆盖`);
  } else if (prdIds.size === 0) {
    human('AC 逐条覆盖', `PRD 未发现 AC-nn 形式的 id（存量旧格式 AC1？）—— 逐条覆盖退人工兜底`);
  } else {
    const uncovered = [...prdIds].filter(id => !referencedAcIds.has(id));
    if (uncovered.length) fail('AC 逐条覆盖', prdPath, `PRD AC 未被任何任务包引用：${uncovered.join('、')}`);
    else pass('AC 逐条覆盖', `PRD ${prdIds.size} 条 AC 均被任务包 AC 引用（逐条）`);
  }

  // 5. 三方一致：queue ↔ sprint.md ↔ status.yml
  //
  // ⚠️ 级联抑制：queue 侧集合来自解析成功的包。若有包 frontmatter 解析失败（存量旧格式仓——
  // 字段写成 Markdown 列表而非 YAML），它们不在 queueIds 里，比对就会把 sprint.md / status.yml
  // 里**全部**任务报成"queue 无"——一个根因放大成 N 条下游误报（实测：4 个存量仓里 ~50 条三方
  // 一致 FAIL 中只有 ~8 条是真漂移，其余全是这条级联）。故解析不全时本项整体退 🧑，不出 FAIL：
  // 集合本就不可信，基于它下的判断没有证据力。
  const queueIds = packages.map(p => p.id);
  const stTasks = parseStatusTasks(path.join(root, 'status.yml'));   // 第 9 项也用，故不进抑制块
  if (unparsed > 0) {
    human('三方一致', `queue 有 ${unparsed} 个包 frontmatter 解析失败（见上方 FAIL），queue 侧集合不完整 —— 三方一致本轮不比对（避免把一个格式问题放大成 N 条假漂移）；修好解析后重跑即恢复`);
  } else {
  const spIds = sprintIds(path.join(iterDir, 'sprint.md'));
  if (spIds === null) {
    fail('三方一致:sprint', path.join(iterDir, 'sprint.md'), 'sprint.md 不存在');
  } else {
    const sset = new Set(spIds), qset = new Set(queueIds);
    const qNotSp = queueIds.filter(id => !sset.has(id));
    const spNotQ = spIds.filter(id => !qset.has(id));
    if (qNotSp.length) fail('三方一致:sprint', path.join(iterDir, 'sprint.md'), `queue 有但 sprint.md 无：${qNotSp.join(', ')}`);
    if (spNotQ.length) fail('三方一致:sprint', path.join(iterDir, 'sprint.md'), `sprint.md 有但 queue 无：${spNotQ.join(', ')}`);
    if (!qNotSp.length && !spNotQ.length) pass('三方一致:sprint', `queue ↔ sprint.md 一致（${queueIds.length} 个任务）`);
  }
  if (stTasks === null) {
    human('三方一致:status', '项目根无 status.yml（存量项目），queue↔status 一致性退回人工兜底');
  } else {
    // 迭代内 queue 的三个进料口：plan-sprint 产 sprint；generate-integration-tests Step 4 产
    // integration；manual-test 产 manual-test —— 后两者同样写进 iterations/vN/queue/ 并同步
    // tasks[]，故一致性比对须一并放行（B 类 bug/optimization 走 b-queue、iteration=null，不在此列）。
    const stIds = new Set(stTasks.filter(t => ITER_SOURCES.has(t.source) && t.iteration === iteration).map(t => t.id));
    const qNotSt = queueIds.filter(id => !stIds.has(id));
    const stNotQ = [...stIds].filter(id => !new Set(queueIds).has(id));
    if (qNotSt.length) fail('三方一致:status', 'status.yml', `queue 有但 status.yml tasks[] 无（source∈{sprint,integration,manual-test},${iteration}）：${qNotSt.join(', ')}`);
    if (stNotQ.length) fail('三方一致:status', 'status.yml', `status.yml 有但 queue 无：${stNotQ.join(', ')}`);
    if (!qNotSt.length && !stNotQ.length) pass('三方一致:status', `queue ↔ status.yml tasks[] 一致`);
  }
  }   // ← 级联抑制块结束

  // 6. 视觉地基包：v1 含前端必有标 `baseline: visual` 的地基包（plan-sprint Step 2）；
  //    vN+1 的「design.md 变更触发」机器判不了 → 退人工。
  const fePkgs = packages.filter(p => /frontend/.test(p.layersStr));
  if (fePkgs.length) {
    const basePkg = packages.find(p => /visual/.test(scalarText(p.fm['baseline'])));
    if (!basePkg) {
      if (iteration === 'v1')
        fail('视觉地基包', queueDir, `v1 含 ${fePkgs.length} 个 frontend 任务但无标 baseline: visual 的视觉地基包（全局 reset + UI 库主题覆盖 + token 全局接线）—— plan-sprint Step 2 硬性必有`);
      else
        human('视觉地基包', `本期含 frontend 任务但无地基包 —— 若 design.md 较上期 G3 后有变更需追加「地基跟进包」（design.md 变更触发机器判不了，由签字人确认）`);
    } else {
      const notDep = fePkgs.filter(p => p.id !== basePkg.id && !p.deps.includes(basePkg.id));
      if (notDep.length)
        human('视觉地基依赖', `地基包 ${basePkg.id} 在场，但这些 frontend 任务未 depends_on 它：${notDep.map(p => p.id).join('、')} —— 确认是否应串在地基之后`);
      else
        pass('视觉地基包', `视觉地基包 ${basePkg.id} 在场，frontend 任务均依赖它`);
    }
  }

  // 7. risk 敏感启发核对（决策#29 第③层）：命中启发词而未标 sensitive → 🧑（只升不降，允许误报）
  for (const p of packages) {
    const declared = scalarText(p.fm['risk']).toLowerCase();
    if (declared.includes('sensitive')) continue;
    const hits = sensitiveHits(p.fm);
    if (hits.length)
      human('risk 启发核对', `${p.id}：命中敏感启发词「${[...new Set(hits)].join('、')}」但 risk=${declared || 'standard(缺省)'} —— 确认是否应标 sensitive（决定 develop 独审模型档位；末端预检另按 diff 独立判定兜底）。判定为误报时把理由写进 \`risk-note\` 字段，该字段不参与启发扫描`);
  }

  // 8. 归属真空：声明"这件事不在本包"时，须确有另一个包认领
  const puntGraph = new Map();          // 本包 → 它点名移交的包 id 集
  let puntHitCount = 0;
  for (const p of packages) {
    const lines = puntLines(p.file, p.id, queueIds);
    if (!lines.length) continue;
    puntHitCount += lines.length;
    const named = new Set();
    for (const l of lines) {
      for (const g of l.ghosts)
        fail('归属真空', p.file, `${p.id}：${l.field} 把「${l.text}…」移交给 ${g}，但本期 queue 无该任务包`);
      for (const n of l.named) named.add(n);
      if (!l.named.length && !l.ghosts.length)
        human('归属真空', `${p.id}（${l.field}）：「${l.text}…」未点名承接的任务包 —— 指认哪个包的 files/AC 认领了它，无则本期无人做`);
    }
    puntGraph.set(p.id, named);
  }
  for (const [a, outs] of puntGraph) {
    for (const b of outs) {
      if (a < b && puntGraph.get(b) && puntGraph.get(b).has(a))
        fail('归属真空:互推', queueDir, `${a} 与 ${b} 互相声明该件事不在本包 —— 两边都不做，落在交集里`);
    }
  }
  if (puntHitCount === 0) pass('归属真空', '任务包 do-not/context 无"移交他包"措辞');

  // 9. 审计留痕完备性：已 [merged] 的任务须有 code_reviews[] 条目（develop 末端义务，长期要求）
  //    并须记 rounds（2026-07-30 加的独审轮数仪器）。本项在「标记 [merged]」那次 commit 上触发——
  //    develop 末端 `git add {任务包} sprint.md status.yml` 已命中 hook 的 sprint/queue 路由，无需改路由。
  //    实证驱动：file-extract v2 十一个任务全部在仪器落地后合并，rounds 记录数 0、两个任务连条目都没有，
  //    而无任何机械检查发现——仪器装了不响，与它要解的问题同一失效类。
  if (stTasks === null) {
    human('审计留痕', '无 status.yml（存量项目），code_reviews[] 完备性退回人工兜底');
  } else {
    const crs = parseCodeReviews(path.join(root, 'status.yml')) || [];
    // 按 task_id 建索引，`iteration` 只在条目自带时才用来排除——存量仓（mail-ai）的 code_reviews[]
    // 条目普遍不写 iteration，按 iteration 硬过滤会把它们全判成"无条目"（实测假阳性 8 条）。
    const crByTask = new Map(crs.filter(c => c.task_id && (!c.iteration || c.iteration === iteration))
                                .map(c => [c.task_id, c]));
    const mergedIds = stTasks
      .filter(t => ITER_SOURCES.has(t.source) && t.iteration === iteration && t.status === 'merged')
      .map(t => t.id);
    const noEntry = [], noRounds = [], badRounds = [], noSplit = [], badSplit = [];
    const noAudit = [], partialAudit = [], legacyProfile = [], badAudit = [], legacyPackages = [];
    const legacyAuditFields = REVIEW_AUDIT_FIELDS.filter(k => k !== 'review_profile_version');
    for (const id of mergedIds) {
      const cr = crByTask.get(id);
      if (!cr) { noEntry.push(id); continue; }
      const taskPackage = packages.find(p => p.id === id);
      if (!taskPackage || !taskPackage.strictSchema) {
        // 已合并的旧包只做“是否有历史审查条目”的可追溯性检查；不要把新 schema 的
        // profile、固定 diff 和墙钟约束反向施加到它的原始审计物上。
        if (!('rounds' in cr)) noRounds.push(id);
        legacyPackages.push(id);
        continue;
      }
      if (!('rounds' in cr)) { noRounds.push(id); continue; }
      if (!/^\d+$/.test(cr.rounds) || Number(cr.rounds) < 1) badRounds.push(`${id}(rounds=${cr.rounds})`);
      if (!('code_rounds' in cr) || !('spec_rounds' in cr)) {
        noSplit.push(id);
      } else if (!/^\d+$/.test(cr.code_rounds) || Number(cr.code_rounds) < 1
                 || !/^\d+$/.test(cr.spec_rounds) || Number(cr.spec_rounds) < 0
                 || Number(cr.rounds) !== Number(cr.code_rounds) + Number(cr.spec_rounds)) {
        badSplit.push(`${id}(rounds=${cr.rounds},code=${cr.code_rounds},spec=${cr.spec_rounds})`);
      }
      const presentLegacyAudit = legacyAuditFields.filter(k => k in cr);
      if (!presentLegacyAudit.length) {
        noAudit.push(id);
      } else if (presentLegacyAudit.length !== legacyAuditFields.length) {
        partialAudit.push(`${id}(缺 ${legacyAuditFields.filter(k => !(k in cr)).join('/')})`);
      } else if (!('review_profile_version' in cr)) {
        legacyProfile.push(id);
        const errs = reviewAuditErrors(root, id, cr, { allowLegacyProfile: true });
        if (errs.length) badAudit.push(`${id}: ${errs.join('；')}`);
      } else {
        const errs = reviewAuditErrors(root, id, cr);
        if (errs.length) badAudit.push(`${id}: ${errs.join('；')}`);
      }
    }
    if (noEntry.length)
      fail('审计留痕', 'status.yml', `已 [merged] 但 code_reviews[] 无条目：${noEntry.join(', ')} —— develop 末端漏写审计留痕`);
    if (badRounds.length)
      fail('审计留痕', 'status.yml', `rounds 非 int≥1（见 skeleton/07 值域）：${badRounds.join(', ')}`);
    if (noRounds.length)
      human('审计留痕', `有 code_reviews 条目但缺 rounds：${noRounds.join(', ')} —— rounds 是 2026-07-30 新增字段，存量条目普遍无；本期新合并的应补（轮数事后不可复原，只能当场记）`);
    if (badSplit.length)
      fail('审计留痕', 'status.yml', `rounds 拆分非法或总数不相等：${badSplit.join(', ')}`);
    if (noSplit.length)
      human('审计留痕', `有 code_reviews 条目但缺 code_rounds/spec_rounds：${noSplit.join(', ')} —— 存量可保留；新合并任务须区分代码轮与规格轮`);
    if (partialAudit.length)
      fail('审计留痕', 'status.yml', `墙钟/report/profile 字段只写了一部分：${partialAudit.join('；')}`);
    if (badAudit.length)
      fail('审计留痕', 'status.yml', `墙钟/report/profile 审计非法：${badAudit.join('；')}`);
    if (noAudit.length)
      human('审计留痕', `有 code_reviews 条目但缺墙钟/report 字段：${noAudit.join(', ')} —— 存量可保留；新合并任务须自动记录 implementation/review/spec 分钟与逐轮报告`);
    if (legacyProfile.length)
      human('审计留痕', `P0 报告链合法但缺 review profile：${legacyProfile.join(', ')} —— 存量可保留；新 full review 必须自动生成 profile`);
    if (legacyPackages.length)
      human('审计留痕', `存量任务包仅核历史审查条目存在：${legacyPackages.join(', ')} —— 未验证新版 profile、固定 diff 与墙钟契约`);
    if (!mergedIds.length)
      pass('审计留痕', '本迭代尚无 [merged] 任务，无需审计留痕');
    else if (!noEntry.length && !badRounds.length && !noRounds.length && !badSplit.length && !noSplit.length
             && !partialAudit.length && !legacyProfile.length && !badAudit.length && !noAudit.length && !legacyPackages.length)
      pass('审计留痕', `${mergedIds.length} 个 [merged] 任务均有合法 rounds、墙钟、review profiles 与逐轮 reports`);
  }

  // 语义残量（留人签）
  human('G3:人签','疑点清单已逐条确认 / TRD 每模块都有任务包 / Step3.5 独审无遗留阻断 / 任务包 AC 逐条忠实于其回链的 PRD AC（内容真覆盖，非仅 id 在场）—— 语义判断，由签字人确认');
}

/* ---------------- 主流程 ---------------- */
function main() {
  const args = process.argv.slice(2);
  const reviewMode = args[0] === '--review';
  const reviewChainMode = args[0] === '--review-chain';
  const readyMode = args[0] === '--ready';
  const waveReadyMode = args[0] === '--wave-ready';
  const waveStateMode = args[0] === '--wave-state';
  const worktreeMode = args[0] === '--worktree-from-reports';
  const specialMode = reviewMode || reviewChainMode || readyMode || waveReadyMode || waveStateMode || worktreeMode;
  const subject = specialMode ? args[1] : args[0];
  const root = (specialMode ? args[2] : args[1]) || process.cwd();
  if (worktreeMode && args.length > 3
      && (args.length !== 5 || args[3] !== '--progress' || !args[4])) {
    console.error('用法: --worktree-from-reports <report,...|none> [项目根] [--progress <task-id,...>]');
    process.exit(2);
  }
  if (!subject || (!specialMode && !/^v\d+(\.\d+)*$/.test(subject))) {
    console.error('用法: node check-sprint.js <vN|vN.M> [项目根]\n'
      + '   或: node check-sprint.js --review <task-id> [项目根]\n'
      + '   或: node check-sprint.js --review-chain <task-id> [项目根]\n'
      + '   或: node check-sprint.js --ready <task-id,...> [项目根]\n'
      + '   或: node check-sprint.js --wave-ready <task-id,...> [项目根]\n'
      + '   或: node check-sprint.js --wave-state <progress.json> [项目根]\n'
      + '   或: node check-sprint.js --worktree-from-reports <report,...|none> [项目根] [--progress <task-id,...>]');
    process.exit(2);
  }
  try {
    if (reviewMode) checkReviewAudit(subject, root);
    else if (reviewChainMode) checkReviewChain(subject, root);
    else if (readyMode) checkReady(subject, root);
    else if (waveReadyMode) checkWaveReady(subject, root);
    else if (waveStateMode) checkWaveState(subject, root);
    else if (worktreeMode) checkWorktreeFromReports(subject, root, args[4]);
    else checkSprint(subject, root);
  }
  catch (e) { console.error('check-sprint 自身出错（非产物问题）:', e.message); process.exit(2); }

  const fails = findings.filter(f => f.level === 'fail');
  const passes = findings.filter(f => f.level === 'pass');
  const humans = findings.filter(f => f.level === 'human');
  const label = reviewMode ? `review:${subject}` : reviewChainMode ? `review-chain:${subject}` : readyMode ? `ready:${subject}` : waveReadyMode ? `wave-ready:${subject}` : waveStateMode ? `wave-state:${subject}`
    : worktreeMode ? `worktree:${subject}` : subject;
  console.log(`\n=== check-sprint (${label}) 报告 ===`);
  console.log(`通过 ${passes.length} 项 / 失败 ${fails.length} 项\n`);
  if (fails.length) {
    console.log('❌ FAIL:');
    for (const f of fails) console.log(`  [${f.rule}] ${f.loc}\n      ${f.msg}`);
    console.log('');
  } else {
    console.log('✅ 确定性判据全部通过（语义判据仍需人核）\n');
  }
  if (humans.length) {
    console.log('🧑 留签字人确认（脚本不判，非 FAIL）:');
    for (const h of humans) console.log(`  [${h.rule}] ${h.msg}`);
  }
  process.exit(fails.length ? 1 : 0);
}

if (require.main === module) main();
module.exports = { TASK_PACKAGE_REQUIRED: REQUIRED, REVIEW_AUDIT_FIELDS,
  sharedAssetConflicts, dependencyReadinessErrors, parseFrontmatter, listItems, scalarText };
