#!/usr/bin/env node
'use strict';
const path = require('path');
const { GitTruthReader } = require('./git-truth-reader.js');

function clean(cell) { return String(cell || '').trim().replace(/^`|`$/g, ''); }

function parseFlatFrontmatter(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => /^---\s*$/.test(line));
  if (start < 0) return null;
  const end = lines.findIndex((line, index) => index > start && /^---\s*$/.test(line));
  if (end < 0) return null;
  const out = {};
  for (const line of lines.slice(start + 1, end)) {
    const match = line.match(/^([A-Za-z_][\w-]*):\s*(.*?)\s*$/);
    if (!match) continue;
    const raw = match[2].replace(/\s+#.*$/, '').trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      const inner = raw.slice(1, -1).trim();
      out[match[1]] = inner ? inner.split(',').map(item => item.trim()).filter(Boolean) : [];
    } else out[match[1]] = raw === 'null' ? null : raw;
  }
  return out;
}

function validate(resultFile, root = process.cwd(), options = {}) {
  const errors = [];
  const truthMode = options.truthMode || (options.staged ? 'index' : options.committed ? 'head' : 'worktree');
  const reader = options.reader || new GitTruthReader(root, truthMode);
  let resultSource = '';
  try { resultSource = reader.read(resultFile); }
  catch (error) { return [`结果文件不可从 ${truthMode} 读取：${resultFile}（${error.message}）`]; }
  const fm = parseFlatFrontmatter(resultSource);
  let resultStatus = null;
  if (fm) {
    const value = key => typeof fm[key] === 'string' ? fm[key] : '';
    const schema = value('schema');
    if (schema !== 'integration-result/v3') errors.push(`integration result schema 必须为 integration-result/v3`);
    const iteration = value('iteration');
    const candidate = value('candidate_head');
    const currentReview = value('latest_system_review').replace(/\\/g, '/');
    const createdAt = value('created_at');
    resultStatus = value('result_status');
    const evidenceState = value('evidence_state');
    const runtimeScope = Array.isArray(fm.runtime_scope) ? fm.runtime_scope : [];
    if (!/^v\d+(?:\.\d+)*$/.test(iteration)) errors.push('integration result iteration 非法');
    if (!/^[0-9a-f]{40}$/i.test(candidate)) errors.push('integration result candidate_head 非 40 位 SHA');
    if (!new RegExp(`^iterations/${iteration.replace(/\./g, '\\.')}/system-review/review-\\d{3}\\.md$`).test(currentReview))
      errors.push('latest_system_review 路径非法');
    if (!['satisfied', 'blocked'].includes(resultStatus)) errors.push('result_status 非法');
    if (!['sufficient', 'insufficient'].includes(evidenceState)) errors.push('evidence_state 非法');
    if (!/^\d{4}-\d{2}-\d{2}T/.test(createdAt) || Number.isNaN(Date.parse(createdAt))) errors.push('created_at 必须是 ISO-8601');
    if (!runtimeScope.length) errors.push('runtime_scope 必须非空');
    if (new Set(runtimeScope).size !== runtimeScope.length) errors.push('runtime_scope 不得重复');
    if (resultStatus === 'satisfied' && evidenceState !== 'sufficient') errors.push('evidence insufficient 不能建立 runtime satisfied');
    if (options.requireSatisfied && (resultStatus !== 'satisfied' || evidenceState !== 'sufficient'))
      errors.push('System Verification completion requires runtime satisfied + evidence sufficient');
    if (options.expectedIteration && iteration !== options.expectedIteration) errors.push('integration result iteration 与 System Verification 不一致');
    if (options.expectedCandidate && candidate !== options.expectedCandidate) errors.push('integration result candidate 与 final_candidate 不一致');
    if (options.expectedReview && currentReview !== options.expectedReview) errors.push('integration result latest_system_review 与 status 不一致');
    for (const scope of options.requiredRuntimeScope || []) if (!runtimeScope.includes(scope))
      errors.push(`runtime_scope 缺 ${scope}`);
  } else if (options.requireSystemLinkage) {
    errors.push('System Verification completion 要求 integration-result/v3 frontmatter');
  }
  const rows = resultSource.split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length && cells[0] !== '#' && !/^---+$/.test(cells[0]));
  if (!rows.length) return ['结果表至少需要一条场景'];
  for (const cells of rows) {
    if (cells.length !== 9) { errors.push(`${cells[0] || '<无序号>'} 使用旧结果表，缺证据/未运行原因列`); continue; }
    const [id, , , result, evidence, notRunReason] = cells;
    if (!['✅', '❌', '未运行'].includes(result)) { errors.push(`${id}: 结果「${result}」非法`); continue; }
    if (result === '未运行') {
      if (!notRunReason || /^(?:—|-|无|none)$/i.test(notRunReason)) errors.push(`${id}: 未运行必须写原因与移交`);
      if (resultStatus === 'satisfied' && /\[?阻断\]?/.test(cells[7] || '')) errors.push(`${id}: blocking 未运行场景不能建立 runtime satisfied`);
      continue;
    }
    if (resultStatus === 'satisfied' && result === '❌') errors.push(`${id}: 失败场景不能建立 runtime satisfied`);
    if (!evidence || /^(?:—|-|无|none)$/i.test(evidence)) { errors.push(`${id}: 已执行但无证据路径`); continue; }
    const paths = evidence.split(/<br\s*\/?>|[,，]/i).map(clean).filter(Boolean);
    for (const relative of paths) {
      const normalized = relative.replace(/\\/g, '/');
      if (!/^integration-tests\/evidence\/v[^/]+\/[^/]+\//.test(normalized)) {
        errors.push(`${id}: 证据不在共同目录 integration-tests/evidence/vN/{场景-id}/：${relative}`);
        continue;
      }
      try { reader.read(normalized); }
      catch (error) { errors.push(`${id}: 证据文件不在 ${truthMode} Git Truth、越界或不安全：${relative}（${error.message}）`); }
    }
  }
  if (truthMode === 'head') {
    try { reader.assertReadPathsClean(); } catch (error) { errors.push(error.message); }
  }
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const file = args.shift();
  const staged = args.includes('--staged');
  const rootArg = args.find(arg => !arg.startsWith('--'));
  const root = path.resolve(rootArg || process.cwd());
  if (!file) { console.error('用法: node check-integration-evidence.js <result-file> [项目根]'); process.exit(2); }
  const errors = validate(file, root, { staged });
  if (errors.length) {
    console.error('❌ 联调证据契约失败：');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('✅ 联调证据契约通过');
}

if (require.main === module) main();
module.exports = { validate };
