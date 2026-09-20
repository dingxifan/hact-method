#!/usr/bin/env node
/*
 * check-gate.js · hact-method Gate 完成判据薄检查器（子计划 3b · G4/G5）
 *
 * 用途：机械核对 G4 / G5 完成判据里**确定性可查**的那几条，取代原 §7 subagent 冷核里
 *      "结构/状态可查"的部分。语义核心（用户验收是否真通过、feedback 分流对不对、
 *      偏离处理对不对）机器判不了，**不碰，留人签**——脚本只把可机械的挡在签字前。
 *
 * 用法（在项目仓根目录执行）：
 *   node scripts/check-gate.js G4 vN     # 验 G4：System Verification complete + manual-test 修复全 merged + 验收报告通过
 *   node scripts/check-gate.js G5 vN     # 验 G5：本期开发/修订任务闭合 + 项目事实文件存在
 *
 * 退出码：有任一 FAIL → 1；全 pass → 0；用法错误 / 自身出错 → 2。
 *
 * 设计边界（见 _meta/plans/2026-06-19-structural-review/sub3b-G345检查器-design.md）：
 *   - G3 不在此脚本：其完成判据需 parse 任务包，而任务包格式尚未规范化，留 sub3c + check-sprint.js。
 *   - 纯 Node 无外部依赖；status.yml 用针对本 schema 的容错行扫描，非完整 YAML AST。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const findings = []; // {level:'fail'|'pass'|'human', rule, loc, msg}
const fail  = (rule, loc, msg) => findings.push({ level: 'fail',  rule, loc, msg });
const pass  = (rule, msg)      => findings.push({ level: 'pass',  rule, msg });
const human = (rule, msg)      => findings.push({ level: 'human', rule, msg }); // 留人签的语义残量，仅提示

function readLines(p) {
  return fs.readFileSync(p, 'utf8').split(/\r?\n/);
}
function exists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}
// 去掉值两端的引号 / 方括号 / 空白（status.yml 偶有 "[可取]" 写法）
function cleanVal(v) {
  return (v || '').trim().replace(/^["']|["']$/g, '').replace(/^\[|\]$/g, '').trim();
}

/* ---------- status.yml 容错解析：只抽 tasks[] 的 source/iteration/status ----------
 * schema 见 skeleton/07-status-contract.md：
 *   tasks:
 *     - id: x
 *       iteration: v2
 *       source: sprint
 *       status: merged
 * 每个条目以 `- ` 起；条目内 `key: value` 缩进更深。只取所需三键。
 */
function parseTasks(statusPath) {
  if (!exists(statusPath)) return null; // 调用方负责区分"无文件"与"空 tasks"
  return parseTasksSource(fs.readFileSync(statusPath, 'utf8'));
}
function parseTasksSource(source) {
  const lines = source.split(/\r?\n/);
  const tasks = [];
  let inTasks = false, baseIndent = null, cur = null;
  const flush = () => { if (cur) { tasks.push(cur); cur = null; } };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '  ').replace(/\s+#.*$/, '');
    if (line.trim() === '' || /^\s*#/.test(line)) continue;
    if (/^tasks:\s*\[\]\s*(?:#.*)?$/.test(line)) return [];
    if (/^tasks:\s*(?:#.*)?$/.test(line)) { inTasks = true; continue; }
    if (!inTasks) continue;
    // 顶格非空行（无缩进且非列表项）→ tasks 段结束
    if (/^\S/.test(line) && !/^-/.test(line)) { flush(); break; }
    const item = line.match(/^(\s*)-\s+(.*)$/);
    if (item) {
      const indent = item[1].length;
      if (baseIndent === null) baseIndent = indent;
      if (indent === baseIndent) {
        flush();
        cur = {};
        // `- key: value` 首键内联
        const kv = item[2].match(/^([A-Za-z_-]+):\s*(.*)$/);
        if (kv) cur[kv[1]] = cleanVal(kv[2]);
        continue;
      }
    }
    const kv = line.match(/^\s+([A-Za-z_-]+):\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = cleanVal(kv[2]);
  }
  flush();
  return inTasks && tasks.every(t => t.id && ['可取', 'taken-by', 'done', 'merged'].includes(t.status)) ? tasks : null;
}

/* ---------------- G4 ---------------- */
function checkG4(iteration, root) {
  const statusPath = path.join(root, 'status.yml');
  const tasks = parseTasks(statusPath);

  // System Verification：只对显式采用 review_architecture 的项目强制；legacy 不补造历史 evidence。
  const statusSource = exists(statusPath) ? fs.readFileSync(statusPath, 'utf8') : '';
  const reviewArchitecture = (statusSource.match(/^review_architecture:\s*([^#\r\n]+)/m) || [])[1]?.trim();
  if (reviewArchitecture === 'system-verification/v1') {
    const systemTasks = (tasks || []).filter(t => t.type === 'integration-verify' && t.iteration === iteration);
    if (systemTasks.length !== 1) fail('G4:System Verification', statusPath, `${iteration} 必须且只能有一个 integration-verify task`);
    else if (systemTasks[0].status !== 'merged') fail('G4:System Verification', statusPath, `integration-verify 尚未 merged（当前 ${systemTasks[0].status || '<缺失>'}）`);
    const systemChecker = path.join(__dirname, 'check-system-review.js');
    if (!exists(systemChecker)) fail('G4:System Verification', systemChecker, '缺 check-system-review.js，不能证明 System Verification completion');
    else {
      const systemErrors = require(systemChecker).validate(iteration, root);
      if (systemErrors.length) fail('G4:System Verification', path.join(root, 'iterations', iteration, 'system-review'), systemErrors.join('；'));
      else pass('G4:System Verification', '双 assurance lane、finding closure 与 revalidation completion 通过');
    }
  } else {
    human('G4:System Verification legacy', 'status.yml 未声明 review_architecture=system-verification/v1；按存量方法执行，不推断或补造历史 System Review evidence');
  }

  // 判据3：所有 develop(source=manual-test, iteration=vN) 已 merged
  if (tasks === null) {
    fail('G4:manual-test任务状态', statusPath, 'status.yml 不存在，无法核 source=manual-test 任务是否全 merged（存量项目退回人工兜底）');
  } else {
    const mt = tasks.filter(t => t.source === 'manual-test' && t.iteration === iteration);
    const unmerged = mt.filter(t => t.status !== 'merged');
    if (mt.length === 0) pass('G4:manual-test任务状态', `无 source=manual-test 修复任务（${iteration}），判据空过`);
    else if (unmerged.length) fail('G4:manual-test任务状态', statusPath, `${unmerged.length} 个 source=manual-test 任务未 merged：${unmerged.map(t => t.id || '?').join(', ')}`);
    else pass('G4:manual-test任务状态', `${mt.length} 个 source=manual-test 任务全部 merged`);
  }

  // 判据4：验收报告已写，结论"通过"
  const reportPath = path.join(root, 'iterations', iteration, 'acceptance-report.md');
  if (!exists(reportPath)) {
    fail('G4:验收报告结论', reportPath, '验收报告 acceptance-report.md 不存在');
  } else {
    const lines = readLines(reportPath);
    const i = lines.findIndex(l => /^##\s*验收结论/.test(l));
    if (i < 0) fail('G4:验收报告结论', reportPath, '验收报告缺「## 验收结论」段');
    else {
      const body = lines.slice(i + 1, i + 6).join('\n');
      if (/通过/.test(body) && !/不通过|未通过/.test(body)) pass('G4:验收报告结论', '验收报告结论为「通过」');
      else fail('G4:验收报告结论', `${reportPath}:${i + 1}`, '「## 验收结论」段未明确写「通过」');
    }
  }

  // 语义残量（留人签，脚本不判）
  human('G4:人签', '用户是否明确说「验收通过」、所有反馈问题是否已处理——可视区人工验收，由签字人确认（design §3）');
}

/* ---------------- G5 ---------------- */
function checkG5(iteration, root) {
  const statusPath = path.join(root, 'status.yml');
  const tasks = parseTasks(statusPath);
  if (tasks === null) fail('G5:任务闭合', statusPath, '缺 status.yml');
  else {
    const pending = tasks.filter(t => t.iteration === iteration
      && (t.type === 'develop' || t.type === 'revise-doc' || t.type === 'integration-verify'
        || ['sprint', 'integration', 'manual-test', 'revise-doc'].includes(t.source))
      && t.status !== 'merged');
    if (pending.length) fail('G5:任务闭合', statusPath, '本期必要任务未 merged：' + pending.map(t => t.id || '?').join(', '));
    else pass('G5:任务闭合', '本期已登记开发/修订任务闭合');
  }
  const projectPath = path.join(root, 'project.md');
  if (!exists(projectPath)) fail('G5:项目事实', projectPath, '缺 project.md');
  else pass('G5:项目事实', 'project.md 存在；准确性由用户确认，不检查其他迭代措辞');
  human('G5:人签', '本期偏离、承诺缺口与退役账处置是否正确，project 是否符合事实；可选经验与归档不阻断');
}

// 受控 status schema：迭代两空格、gates 四空格、Gate 六空格；Gate 值支持 inline/block。
// 不从旧 Markdown 复选框读取状态；格式不支持时报错而非推断已签。
function parseGates(source) {
  const result = new Map();
  let inIterations = false, version = null, inGates = false, gate = null;
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '');
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (/^iterations:\s*$/.test(line)) { inIterations = true; continue; }
    if (/^\S/.test(line)) { inIterations = false; continue; }
    if (!inIterations) continue;
    const v = line.match(/^  (v\d+(?:\.\d+)*):\s*$/);
    if (v) { version = v[1]; inGates = false; gate = null; continue; }
    if (/^    gates:\s*$/.test(line)) { inGates = true; continue; }
    if (!version || !inGates) throw new Error('不支持的 iterations/gates 格式：' + line.trim());
    const g = line.match(/^      (G[1-5]):\s*(.*)$/);
    if (g) {
      gate = version + ':' + g[1];
      if (result.has(gate)) throw new Error('重复 Gate：' + gate);
      result.set(gate, { signed: false, date: null });
      if (!g[2]) continue;
      const value = g[2].match(/^\{\s*signed:\s*(true|false),\s*date:\s*([^}]+?)\s*\}$/);
      if (!value) throw new Error('Gate 须写 signed/date：' + gate);
      result.set(gate, { signed: value[1] === 'true', date: cleanVal(value[2]) });
      continue;
    }
    const property = line.match(/^        (signed|date):\s*(.+?)\s*$/);
    if (!gate || !property) throw new Error('不支持的 Gate 格式：' + line.trim());
    if (property[1] === 'signed') {
      if (!['true', 'false'].includes(property[2])) throw new Error('signed 须为布尔');
      result.get(gate).signed = property[2] === 'true';
    } else result.get(gate).date = cleanVal(property[2]);
  }
  return result;
}

function checkStaged(root) {
  const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const currentSource = git(['show', ':status.yml']);
  let previousSource = '';
  try { previousSource = git(['show', 'HEAD:status.yml']); } catch { /* 新建 status */ }
  const current = parseGates(currentSource), previous = parseGates(previousSource);
  const signed = [...current].filter(([key, value]) => value.signed && !previous.get(key)?.signed);
  const tasks = parseTasksSource(currentSource);
  const oldTasks = new Map((parseTasksSource(previousSource) || []).map(t => [t.id, t]));
  if (tasks === null) throw new Error('缺可解析 tasks 段（按 status 模板块式写入）');
  const merged = tasks.filter(t => t.status === 'merged' && oldTasks.get(t.id)?.status !== 'merged' &&
    (t.type === 'develop' || t.type === 'integration-verify'
      || ['sprint', 'foundation', 'integration', 'manual-test', 'bug', 'optimization'].includes(t.source)));
  // 只核本次状态事件的产物，不因其他迭代在制品阻断认领/登记。
  const inputs = new Set(['status.yml']);
  for (const [key] of signed) inputs.add('iterations/' + key.split(':')[0]);
  if (signed.length) for (const file of ['project.md', 'foundation.md', 'design.md']) inputs.add(file);
  for (const task of merged) {
    if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(task.id)) throw new Error('非法 task-id');
    if (task.type === 'integration-verify') {
      if (!/^v\d+(?:\.\d+)*$/.test(task.iteration || '')) throw new Error('integration-verify 缺合法 iteration');
      inputs.add(task.system_review_dir || `iterations/${task.iteration}/system-review`);
      if (task.integration_result) inputs.add(task.integration_result);
    } else if (['bug', 'optimization'].includes(task.source)) {
      inputs.add('b-queue/' + task.id + '.md');
      inputs.add('b-reviews/' + task.id);
    } else {
      if (!/^v\d+(?:\.\d+)*$/.test(task.iteration || '')) throw new Error('A 类任务缺合法 iteration');
      inputs.add('iterations/' + task.iteration + '/queue/' + task.id + '.md');
      inputs.add('iterations/' + task.iteration + '/code-reviews/' + task.id);
    }
  }
  // 不能用工作树中未暂存的通过产物替已暂存的另一版本背书。
  const dirty = git(['diff', '--name-only', '--', ...inputs]);
  if (dirty.trim()) throw new Error('状态提交的相关产物有未暂存变化，请一并暂存后复核：' + dirty.trim());
  const run = (script, args) => {
    const full = path.join(root, 'scripts', script);
    if (!exists(full)) { human('存量脚本', script + ' 未安装，须按规范人工核对并补铺'); return; }
    try { cp.execFileSync(process.execPath, [full, ...args], { cwd: root, stdio: 'inherit' }); }
    catch { fail('状态提交检查', full, args.join(' ') + ' 未通过'); }
  };
  for (const [key, value] of signed) {
    const [version, gate] = key.split(':');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date || '')) fail('Gate 日期', key, '已签必须有 YYYY-MM-DD 日期');
    if (version === 'v0') {
      if (gate !== 'G2') fail('V0 Gate', key, 'V0 仅 G2');
    } else {
      for (let n = 1; n < Number(gate.slice(1)); n++)
        if (!current.get(version + ':G' + n)?.signed) fail('Gate 前置', key, '缺 G' + n + ' 签署');
    }
    const dir = path.join('iterations', version);
    if (gate === 'G1') run('check-docs.js', ['--prd', path.join(dir, 'prd.md')]);
    if (gate === 'G2' && version !== 'v0') run('check-docs.js', [path.join(dir, 'prd.md'), path.join(dir, 'trd.md')]);
    if (gate === 'G3') run('check-sprint.js', [version]);
    if (gate === 'G4') checkG4(version, root);
    if (gate === 'G5') checkG5(version, root);
    human('Gate 确认', key + ' 必须对应用户明确确认；字段和脚本不代替人签');
  }
  for (const task of merged.filter(item => item.type === 'integration-verify')) {
    const systemChecker = path.join(root, 'scripts', 'check-system-review.js');
    if (!exists(systemChecker)) fail('System Verification checker', systemChecker, 'review_architecture task 合并必须安装 check-system-review.js');
    else run('check-system-review.js', [task.iteration, root]);
  }
  // One staged audit covers new merged events and changed records without rescanning old rounds.
  run('check-sprint.js', ['--staged', root]);
}

/* ---------------- 主流程 ---------------- */
function main() {
  const [gate, iteration, rootArg] = process.argv.slice(2);
  const root = rootArg || process.cwd();
  if (gate !== '--staged' && (!iteration || !/^G[45]$/.test(gate) || !/^v\d+(?:\.\d+)*$/.test(iteration))) {
    console.error('用法: node check-gate.js <G4|G5> <vN> [项目根]；或在项目根运行 --staged');
    process.exit(2);
  }
  try {
    if (gate === '--staged') checkStaged(root);
    else if (gate === 'G4') checkG4(iteration, root);
    else checkG5(iteration, root);
  } catch (e) {
    console.error('check-gate 自身出错（非产物问题）:', e.message);
    process.exit(2);
  }

  const fails = findings.filter(f => f.level === 'fail');
  const passes = findings.filter(f => f.level === 'pass');
  const humans = findings.filter(f => f.level === 'human');
  console.log(`\n=== check-gate ${gate} (${iteration}) 报告 ===`);
  console.log(`通过 ${passes.length} 项 / 失败 ${fails.length} 项\n`);
  if (fails.length) {
    console.log('❌ FAIL:');
    for (const f of fails) console.log(`  [${f.rule}] ${f.loc}\n      ${f.msg}`);
    console.log('');
  } else {
    console.log('✅ 确定性判据全部通过\n');
  }
  if (humans.length) {
    console.log('🧑 留签字人确认（脚本不判，非 FAIL）:');
    for (const h of humans) console.log(`  [${h.rule}] ${h.msg}`);
  }
  process.exit(fails.length ? 1 : 0);
}

module.exports = { parseGates, parseTasks, parseTasksSource };
if (require.main === module) main();
