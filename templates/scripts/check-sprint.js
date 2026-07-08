#!/usr/bin/env node
/*
 * check-sprint.js · hact-method G3（plan-sprint 产物）完成判据 linter（子计划 3c）
 *
 * 用途：机械核对 G3 完成判据里**确定性可查**的部分——任务包字段完备 / reference 行号 /
 *      AC 正向 tag（含逐条 id 存在性）+ 逐条 AC 反向覆盖（按 PRD AC-nn id）/ depends_on / sprint↔queue↔status 三方一致 /
 *      视觉地基包（v1 含前端必有 `baseline: visual` 包；vN+1 的 design.md 变更触发退人工）。
 *      语义残量（疑点确认 / TRD 模块覆盖 / Step3.5 独审结论 / 逐条 AC 忠实性——内容真覆盖、非仅 id 在场）机器判不了，
 *      留签字人确认（🧑 段），脚本只把可机械的挡在签字前。
 *
 * 用法（在项目仓根目录执行）：
 *   node scripts/check-sprint.js vN          # 项目根 = cwd
 *   node scripts/check-sprint.js vN <项目根>
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

const PLACEHOLDER = '<待填>';
const findings = []; // {level:'fail'|'pass'|'human', rule, loc, msg}
const fail  = (rule, loc, msg) => findings.push({ level: 'fail',  rule, loc, msg });
const pass  = (rule, msg)      => findings.push({ level: 'pass',  rule, msg });
const human = (rule, msg)      => findings.push({ level: 'human', rule, msg });

function readLines(p) { return fs.readFileSync(p, 'utf8').split(/\r?\n/); }
function exists(p) { try { return fs.statSync(p).isFile(); } catch { return false; } }
function stripComment(s) { return s.replace(/\s+#.*$/, '').trim(); } // 去行尾 ` # 注释`

// 任务包机械必含的 17 字段（specs-structural/develop.md §字段规范的可校验子集）。
// status 不在内（与 status.yml 重复，由后者权威）；risk 缺省按 standard，不机械校验；api-contract 条件必填，单独判。
const REQUIRED = ['task-id', 'sprint_id', 'layers', 'source', 'task_type', 'urgency',
  'title', 'description', 'depends_on', 'files', 'acceptance-criteria',
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
  if (v.type === 'inline-empty-list') return key !== 'depends_on'; // 仅 depends_on 允许 []
  if (v.type === 'list') return v.items.filter(x => x && !x.includes(PLACEHOLDER)).length === 0;
  const t = (v.text || '').trim();
  return t === '' || t.includes(PLACEHOLDER);
}
function listItems(v) { return v && v.items ? v.items.filter(x => x && !x.includes(PLACEHOLDER)) : []; }
function scalarText(v) { return v ? (v.text || '') : ''; }

const reLineNum = /L\s*\d+|\d+\s*[-–~]\s*\d+|行\s*\d+/;   // 行号 / 行号区间
const reAcTag = /[（(]\s*源\s*[:：]\s*PRD/;               // (源：PRD…)
const reTechTag = /[（(]\s*技术\s*[)）]/;                  // (技术)

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
const RISK_SCAN_FIELDS = ['title', 'description', 'acceptance-criteria', 'files', 'known-risks'];
function sensitiveHits(fm) {
  const chunks = [];
  for (const k of RISK_SCAN_FIELDS) {
    const v = fm[k];
    if (!v) continue;
    chunks.push(scalarText(v), ...listItems(v));
  }
  const text = chunks.join(' ').toLowerCase();
  return SENSITIVE_HINTS.filter(w => text.includes(w.toLowerCase()));
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
  for (const f of files) {
    const fp = path.join(queueDir, f);
    let fm;
    try { fm = parseFrontmatter(fp); }
    catch (e) { fail('frontmatter 解析', fp, `解析失败：${e.message}`); continue; }
    if (!fm) { fail('frontmatter 解析', fp, '未找到 YAML frontmatter（--- 包裹）'); continue; }
    const id = f.replace(/\.md$/, '');
    const layersV = fm['layers'];
    const layers = layersV ? (layersV.items.length ? layersV.items : [scalarText(layersV)])
                              .join(',').replace(/[\[\]]/g, '') : '';
    const deps = listItems(fm['depends_on']);
    packages.push({ id, fm, file: fp, layersStr: layers, deps });
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
    // 1. 字段完备
    for (const key of REQUIRED) {
      if (valEmpty(key, p.fm[key])) fail('字段完备', where, `${p.id}：字段「${key}」缺失/为空/占位`);
    }
    // 1b. api-contract 条件必填
    if (/backend/.test(p.layersStr) && consumedByFE.has(p.id)) {
      if (valEmpty('api-contract', p.fm['api-contract']))
        fail('api-contract 必填', where, `${p.id}：backend 且被前端任务 depends_on 消费，api-contract 须填（当前缺/占位/仍注释）`);
    }
    // 2. reference 行号 + ux-flows/trd 链
    const refs = listItems(p.fm['reference']);
    if (refs.length) {
      const noLine = refs.filter(r => !reLineNum.test(r) || /全文/.test(r));
      if (noLine.length) fail('reference 行号', where, `${p.id}：${noLine.length} 条 reference 无行号或写"全文"（首条：${noLine[0].slice(0, 40)}…）`);
      if (/frontend/.test(p.layersStr) && !refs.some(r => /ux-flows/i.test(r)))
        fail('reference ux-flows', where, `${p.id}：前端任务 reference 未含 ux-flows 行号条目`);
      if (/backend/.test(p.layersStr) && !refs.some(r => /trd/i.test(r)))
        fail('reference trd', where, `${p.id}：后端任务 reference 未含 trd 行号条目`);
    }
    // 3. AC 正向 tag + 逐条 id 存在性
    const acs = listItems(p.fm['acceptance-criteria']);
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
    }
  }
  if (findings.filter(f => f.level === 'fail').length === 0) pass('任务包字段/AC/reference', `${packages.length} 个任务包字段完备、reference 含行号、AC 均带回链 tag`);

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
  const queueIds = packages.map(p => p.id);
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
  const stTasks = parseStatusTasks(path.join(root, 'status.yml'));
  if (stTasks === null) {
    human('三方一致:status', '项目根无 status.yml（存量项目），queue↔status 一致性退回人工兜底');
  } else {
    const stIds = new Set(stTasks.filter(t => t.source === 'sprint' && t.iteration === iteration).map(t => t.id));
    const qNotSt = queueIds.filter(id => !stIds.has(id));
    const stNotQ = [...stIds].filter(id => !new Set(queueIds).has(id));
    if (qNotSt.length) fail('三方一致:status', 'status.yml', `queue 有但 status.yml tasks[] 无（source=sprint,${iteration}）：${qNotSt.join(', ')}`);
    if (stNotQ.length) fail('三方一致:status', 'status.yml', `status.yml 有但 queue 无：${stNotQ.join(', ')}`);
    if (!qNotSt.length && !stNotQ.length) pass('三方一致:status', `queue ↔ status.yml tasks[] 一致`);
  }

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
      human('risk 启发核对', `${p.id}：命中敏感启发词「${[...new Set(hits)].join('、')}」但 risk=${declared || 'standard(缺省)'} —— 确认是否应标 sensitive（决定 develop 独审模型档位；末端预检另按 diff 独立判定兜底）`);
  }

  // 语义残量（留人签）
  human('G3:人签', '疑点清单已逐条确认 / TRD 每模块都有任务包 / Step3.5 独审无遗留阻断 / 任务包 AC 逐条忠实于其回链的 PRD AC（内容真覆盖，非仅 id 在场）—— 语义判断，由签字人确认');
}

/* ---------------- 主流程 ---------------- */
function main() {
  const [iteration, rootArg] = process.argv.slice(2);
  const root = rootArg || process.cwd();
  if (!iteration || !/^v\d+$/.test(iteration)) {
    console.error('用法: node check-sprint.js <vN> [项目根]');
    process.exit(2);
  }
  try { checkSprint(iteration, root); }
  catch (e) { console.error('check-sprint 自身出错（非产物问题）:', e.message); process.exit(2); }

  const fails = findings.filter(f => f.level === 'fail');
  const passes = findings.filter(f => f.level === 'pass');
  const humans = findings.filter(f => f.level === 'human');
  console.log(`\n=== check-sprint (${iteration}) 报告 ===`);
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

main();
