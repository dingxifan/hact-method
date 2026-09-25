#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const DOCUMENT_TYPES = new Set(['draft-tech-design']);
const findings = [];
const pass = (rule, msg) => findings.push({ level: 'pass', rule, msg });
const fail = (rule, msg) => findings.push({ level: 'fail', rule, msg });
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const isSha40 = value => /^[0-9a-f]{40}$/.test(value || '');

function git(root, args, buffer = false) {
  const result = childProcess.spawnSync('git', ['-C', root, ...args], { encoding: buffer ? null : 'utf8' });
  if (result.status !== 0) throw new Error((buffer ? result.stderr?.toString('utf8') : result.stderr) || 'git failed');
  return buffer ? result.stdout : result.stdout.trimEnd();
}

function parseTasks(source) {
  const tasks = [];
  let inTasks = false, current = null;
  const flush = () => { if (current) tasks.push(current); current = null; };
  for (const raw of String(source || '').split(/\r?\n/)) {
    if (/^tasks:\s*(?:#.*)?$/.test(raw)) { inTasks = true; continue; }
    if (!inTasks) continue;
    if (/^\S/.test(raw) && !/^-/.test(raw)) { flush(); break; }
    const start = raw.match(/^\s*-\s+([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (start) { flush(); current = {}; current[start[1]] = clean(start[2]); continue; }
    const field = raw.match(/^\s+([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (current && field) current[field[1]] = clean(field[2]);
  }
  flush();
  return tasks;
}

function clean(value) { return String(value || '').replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, ''); }

function duplicates(tasks) {
  const counts = new Map();
  for (const task of tasks) if (task.id) counts.set(task.id, (counts.get(task.id) || 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
}

function parseFrontmatter(file) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return null;
  const result = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const field = raw.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!field) continue;
    const value = clean(field[2]);
    if (/^\[.*\]$/.test(value)) result[field[1]] = value.slice(1, -1).split(',').map(clean).filter(Boolean);
    else result[field[1]] = value;
  }
  return result;
}

function reviewErrors(root, task) {
  const errors = [];
  if (!/^v\d+(?:\.\d+)*$/.test(task.iteration || '')) return ['draft-tech-design 缺合法 iteration'];
  const dir = path.join(root, 'iterations', task.iteration, 'document-reviews', task.id);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [`缺 document review 目录：${path.relative(root, dir)}`];
  const reports = fs.readdirSync(dir).filter(name => /^round-\d{2}\.md$/.test(name)).sort();
  if (!reports.length) return ['缺 document review round'];
  let previous = '', previousOpen = [];
  for (let index = 0; index < reports.length; index += 1) {
    const file = path.join(dir, reports[index]);
    const fm = parseFrontmatter(file);
    const label = reports[index];
    if (!fm) { errors.push(`${label}: 缺 frontmatter`); continue; }
    if (fm.schema !== 'hact-document-review/v1') errors.push(`${label}: schema 非 hact-document-review/v1`);
    if (fm.task_id !== task.id || fm.task_type !== task.type) errors.push(`${label}: task identity 不匹配`);
    if (Number(fm.round) !== index + 1) errors.push(`${label}: round 与文件序号不符`);
    if (fm.reviewer_isolation !== 'fresh-isolated') errors.push(`${label}: reviewer_isolation 必须 fresh-isolated`);
    if (!['initial', 'targeted'].includes(fm.review_type)) errors.push(`${label}: review_type 非法`);
    if (index === 0 && fm.review_type !== 'initial') errors.push(`${label}: 首轮必须 initial`);
    if (index > 0 && fm.review_type !== 'targeted') errors.push(`${label}: 后续轮必须 targeted`);
    const expectedPrior = previous ? path.relative(root, previous).replace(/\\/g, '/') : 'null';
    if ((fm.prior_report || 'null') !== expectedPrior) errors.push(`${label}: prior_report 未指向紧邻上一轮`);
    if (!isSha40(fm.candidate_commit) || !isSha40(fm.candidate_tree)) errors.push(`${label}: candidate commit/tree 非固定 40 位 SHA`);
    else {
      try {
        const actualTree = git(root, ['rev-parse', `${fm.candidate_commit}^{tree}`]);
        if (actualTree !== fm.candidate_tree) errors.push(`${label}: candidate_tree 与 commit 不一致`);
      } catch { errors.push(`${label}: candidate commit/tree 不可解析`); }
    }
    if (fm.artifact_path !== `iterations/${task.iteration}/trd.md`) errors.push(`${label}: artifact_path 必须指向本期 TRD`);
    if (!/^[0-9a-f]{64}$/.test(fm.artifact_sha256 || '')) errors.push(`${label}: artifact_sha256 非 64 位小写 hex`);
    else if (isSha40(fm.candidate_commit)) {
      try {
        const bytes = git(root, ['show', `${fm.candidate_commit}:${fm.artifact_path}`], true);
        if (sha256(bytes) !== fm.artifact_sha256) errors.push(`${label}: artifact_sha256 与 candidate blob 不一致`);
      } catch { errors.push(`${label}: candidate 中找不到 artifact`); }
    }
    const newIds = fm.blocking_finding_ids || [];
    const closed = fm.closed_finding_ids || [];
    const targets = fm.target_finding_ids || [];
    const declaredOpen = fm.open_blocking_finding_ids || [];
    const idPattern = new RegExp(`^${task.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-F\\d{3}$`);
    if ([...newIds, ...closed, ...targets, ...declaredOpen].some(id => !idPattern.test(id))) errors.push(`${label}: finding id 非 ${task.id}-FNNN`);
    if (index === 0 && (closed.length || targets.length)) errors.push(`${label}: initial 不得关闭或 target 既有 finding`);
    if (index > 0 && JSON.stringify([...targets].sort()) !== JSON.stringify([...previousOpen].sort()))
      errors.push(`${label}: targeted 必须覆盖上一轮全部 open blocking findings`);
    if (closed.some(id => !previousOpen.includes(id))) errors.push(`${label}: closed finding 不在上一轮 open 集合`);
    const computedOpen = [...new Set([...previousOpen.filter(id => !closed.includes(id)), ...newIds])].sort();
    if (JSON.stringify(computedOpen) !== JSON.stringify([...declaredOpen].sort())) errors.push(`${label}: open finding 集合与 lineage 不一致`);
    if (!['pass', 'revise'].includes(fm.conclusion)) errors.push(`${label}: conclusion 非法`);
    if (fm.conclusion === 'pass' && computedOpen.length) errors.push(`${label}: pass 仍有 open blocking findings`);
    if (fm.conclusion === 'revise' && !computedOpen.length) errors.push(`${label}: revise 缺 open blocking finding`);
    previousOpen = computedOpen;
    previous = file;
  }
  const last = parseFrontmatter(path.join(dir, reports.at(-1)));
  if (!last || last.conclusion !== 'pass' || previousOpen.length) errors.push('末轮 document review 必须 pass 且无 open blocking finding');
  return errors;
}

function checkTask(root, task) {
  if (!DOCUMENT_TYPES.has(task.type)) return;
  const errors = reviewErrors(root, task);
  if (errors.length) errors.forEach(error => fail('document task completion', `${task.id}: ${error}`));
  else pass('document task completion', `${task.id} 的 fixed candidate、Fresh Review 与 finding lineage 已闭合`);
}

function ensureStagedWorld(root, task) {
  if (!DOCUMENT_TYPES.has(task.type) || !/^v\d+(?:\.\d+)*$/.test(task.iteration || '')) return false;
  const inputs = ['status.yml', `iterations/${task.iteration}/trd.md`, `iterations/${task.iteration}/document-reviews/${task.id}`];
  const dirty = git(root, ['diff', '--name-only', '--', ...inputs]);
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard', '--', ...inputs]);
  if (dirty) fail('staged truth', `completion 相关文件有未暂存变化：${dirty.replace(/\r?\n/g, ', ')}`);
  if (untracked) fail('staged truth', `completion 相关文件未加入暂存区：${untracked.replace(/\r?\n/g, ', ')}`);
  return !dirty && !untracked;
}

function checkDuplicateTasks(tasks) {
  const ids = duplicates(tasks);
  if (ids.length) fail('task identity', `status.yml 存在重复 task id，禁止静默覆盖：${ids.join(', ')}`);
  else pass('task identity', 'status.yml task id 唯一');
}

function runStaged(root) {
  const current = parseTasks(git(root, ['show', ':status.yml']));
  let previous = [];
  try { previous = parseTasks(git(root, ['show', 'HEAD:status.yml'])); } catch { /* new status */ }
  checkDuplicateTasks(current);
  const before = new Map(previous.map(task => [task.id, task]));
  for (const task of current) if (task.status === 'merged' && before.get(task.id)?.status !== 'merged') {
    if (ensureStagedWorld(root, task)) checkTask(root, task);
  }
}

function runTask(root, id) {
  const tasks = parseTasks(fs.readFileSync(path.join(root, 'status.yml'), 'utf8'));
  checkDuplicateTasks(tasks);
  const matches = tasks.filter(task => task.id === id);
  if (matches.length !== 1) fail('task identity', `${id} 必须唯一存在于 status.yml`);
  else checkTask(root, matches[0]);
}

function main() {
  const args = process.argv.slice(2);
  const staged = args[0] === '--staged';
  const taskMode = args[0] === '--task';
  const root = path.resolve(staged ? (args[1] || '.') : taskMode ? (args[2] || '.') : '.');
  try {
    if (staged) runStaged(root);
    else if (taskMode && args[1]) runTask(root, args[1]);
    else throw new Error('用法: check-task-completion.js --staged [root] | --task <task-id> [root]');
  } catch (error) { fail('checker', error.message); }
  const failures = findings.filter(item => item.level === 'fail');
  console.log(`\n=== check-task-completion 报告 ===\n通过 ${findings.length - failures.length} 项 / 失败 ${failures.length} 项`);
  for (const item of failures) console.log(`❌ [${item.rule}] ${item.msg}`);
  if (!failures.length) console.log('✅ Task completion 确定性判据通过');
  process.exitCode = failures.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { parseTasks, duplicates, reviewErrors };
