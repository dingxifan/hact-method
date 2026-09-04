#!/usr/bin/env node
'use strict';
// 四场景协议演练：不同运行时分工只能改变可选出处，不能改变共同产物。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { TASK_PACKAGE_REQUIRED, REVIEW_AUDIT_FIELDS } = require('../../templates/scripts/check-sprint.js');

const root = path.resolve(__dirname, '..', '..');
const matrixPath = path.join(root, '_meta', 'fixtures', 'runtime-handoff', 'matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const bootRouteMatrix = JSON.parse(fs.readFileSync(
  path.join(root, '_meta', 'fixtures', 'runtime-handoff', 'boot-route-matrix.json'), 'utf8'));
const errors = [];
const hash = value => crypto.createHash('sha256').update(value).digest('hex').slice(0, 12);
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const expected = {
  A: ['cc', 'cc', 'cc'],
  B: ['codex', 'codex', 'codex'],
  C: ['cc', 'cc', 'codex'],
  D: ['codex', 'cc', 'cc'],
};
for (const [id, roles] of Object.entries(expected)) {
  const scenario = matrix.scenarios.find(item => item.id === id);
  if (!scenario) { errors.push(`缺场景 ${id}`); continue; }
  const actual = [scenario.planning, scenario.implementation, scenario.review];
  if (actual.join('/') !== roles.join('/')) errors.push(`${id} 分工错误：${actual.join('/')}`);
}
if (matrix.scenarios.length !== 4) errors.push(`场景数应为 4，实际 ${matrix.scenarios.length}`);

const forbiddenRuntimeField = /(^|\n)\s*(runtime|planner_runtime|implementation_runtime|review_runtime)\s*:/i;
for (const relative of ['templates/status.yml', 'templates/queue/task-package.md', 'templates/iterations/gates.md']) {
  const source = read(relative);
  if (forbiddenRuntimeField.test(source)) errors.push(`${relative} 泄漏运行时字段`);
}
if (!/generated_by:\s*hact-method/.test(read('templates/status.yml')))
  errors.push('status.yml generated_by 未保持 hact-method 中立值');
const artifactSchemaAnchors = {
  'templates/queue/task-package.md': ['task-id:', 'contract-impact:', 'asset-writes:'],
  'templates/status.yml': ['generated_by:', 'tasks:', 'code_reviews:'],
  'templates/iterations/gates.md': ['G1', 'G2', 'G3', 'G4', 'G5'],
  'templates/review-briefs/develop-review-round.md': ['reviewed_base:', 'reviewed_head:', 'conclusion:'],
};
for (const [relative, anchors] of Object.entries(artifactSchemaAnchors)) {
  const source = read(relative);
  for (const anchor of anchors) if (!source.includes(anchor)) errors.push(`${relative} 缺交接夹具所依赖契约锚 ${anchor}`);
}

const boot = read('templates/boot-protocol.md');
const routes = [...boot.matchAll(/^\| `([^`]+)` \| `\.\.\/hact-method-lab\/specs-execution\/([^`]+)`/gmu)];
if (routes.length !== 13) errors.push(`共同启动协议任务路由应为 13，实际 ${routes.length}`);
const parsedBootRoutes = new Map();
for (const match of boot.matchAll(/^\| `([^`]+)` \| [^\n|]* \| `([^`]+)`/gmu)) {
  if (parsedBootRoutes.has(match[1])) errors.push(`共同启动状态信号重复：${match[1]}`);
  parsedBootRoutes.set(match[1], match[2]);
}
const routeErrors = (actual) => bootRouteMatrix.cases.flatMap(({ signal, expected }) => {
  const value = actual.get(signal);
  if (!value) return [`共同启动缺状态：${signal}`];
  return value === expected ? [] : [`共同启动状态 ${signal} 应路由 ${expected}，实际 ${value}`];
});
errors.push(...routeErrors(parsedBootRoutes));
const mutatedBootRoutes = new Map(parsedBootRoutes);
mutatedBootRoutes.set('phase=v1;G2=1;G3=0', 'develop');
if (routeErrors(mutatedBootRoutes).length === 0) errors.push('共同启动状态矩阵变异测试失效');
for (const [entry, runtime] of [['templates/CLAUDE.md', 'cc'], ['templates/AGENTS.md', 'codex']]) {
  const source = read(entry);
  if (!source.includes('boot-protocol.md')) errors.push(`${entry} 未引用共同启动协议`);
  if (!source.includes(`runtime/${runtime}.md`)) errors.push(`${entry} 未引用自身运行时映射`);
  if (!source.includes('runtime/preflight.md')) errors.push(`${entry} 未引用任务能力预检`);
  const mappingIndex = source.indexOf(`runtime/${runtime}.md`);
  const bootIndex = source.indexOf('boot-protocol.md');
  const preflightIndex = source.indexOf('runtime/preflight.md');
  if (!(mappingIndex < bootIndex && bootIndex < preflightIndex))
    errors.push(`${entry} 加载顺序必须为运行时映射 → 共同启动 → 任务能力预检`);
}

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
};
function artifactErrors(fixture) {
  const out = [];
  const artifacts = fixture.artifacts || {};
  const task = artifacts['task-package'] || {};
  for (const field of TASK_PACKAGE_REQUIRED) if (!(field in task)) out.push(`task-package 缺字段 ${field}`);
  if (!['governed', 'none'].includes(task['contract-impact'])) out.push('task-package contract-impact 非法');
  const status = artifacts.status || {};
  if (status.schema !== 1 || status.generated_by !== 'hact-method') out.push('status schema/generated_by 非法');
  if (!Array.isArray(status.tasks) || status.tasks.length !== 1
      || status.tasks[0].id !== task['task-id']) out.push('status.tasks 与任务包不一致');
  const codeReview = Array.isArray(status.code_reviews) && status.code_reviews[0];
  if (!codeReview || codeReview.task_id !== task['task-id']) out.push('status.code_reviews 与任务包不一致');
  else {
    for (const field of ['rounds', 'code_rounds', 'spec_rounds', 'freshness', ...REVIEW_AUDIT_FIELDS])
      if (!(field in codeReview)) out.push(`status.code_reviews 缺字段 ${field}`);
    if (codeReview.rounds !== codeReview.code_rounds + codeReview.spec_rounds)
      out.push('status.code_reviews rounds 拆分不闭合');
  }
  const gates = artifacts.gates || {};
  for (const gate of ['G1', 'G2', 'G3', 'G4', 'G5']) if (typeof gates[gate] !== 'boolean') out.push(`gates.${gate} 非布尔`);
  const statusGates = status.iterations && status.iterations.v1 && status.iterations.v1.gates;
  if (JSON.stringify(stable(statusGates)) !== JSON.stringify(stable(gates))) out.push('status.gates 与 gates 产物不一致');
  const review = artifacts['review-conclusion'] || {};
  if (review.task_id !== task['task-id'] || review.conclusion !== 'pass' || review.blocking !== 0)
    out.push('review conclusion 与任务不一致或未通过');
  const snapshot = review.snapshot || {};
  if (!/^[0-9a-f]{40}$/.test(snapshot.base || '') || !/^[0-9a-f]{40}$/.test(snapshot.head || '')
      || !/^[0-9a-f]{64}$/.test(snapshot.diff_sha256 || '') || !Array.isArray(snapshot.changed_files))
    out.push('review snapshot schema 非法');
  return out;
}
const crossScenarioMismatches = hashes => matrix.shared_artifacts.filter(artifact => {
  const values = matrix.scenarios.map(scenario => hashes[scenario.id] && hashes[scenario.id][artifact]);
  return new Set(values).size !== 1;
});
const scenarioHashes = {};
const loadedFixtures = {};
for (const scenario of matrix.scenarios) {
  const fixturePath = path.join(root, '_meta', 'fixtures', 'runtime-handoff', 'scenarios', `${scenario.id}.json`);
  if (!fs.existsSync(fixturePath)) { errors.push(`${scenario.id} 缺独立产物夹具`); continue; }
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  loadedFixtures[scenario.id] = fixture;
  const actualRoles = [fixture.roles && fixture.roles.planning, fixture.roles && fixture.roles.implementation,
    fixture.roles && fixture.roles.review];
  const expectedRoles = [scenario.planning, scenario.implementation, scenario.review];
  if (actualRoles.join('/') !== expectedRoles.join('/')) errors.push(`${scenario.id} 夹具角色与矩阵不一致`);
  if (!fixture.runtime_context
      || fixture.runtime_context.implementation !== scenario.implementation
      || fixture.runtime_context.review !== scenario.review) errors.push(`${scenario.id} 缺独立运行时出处`);
  for (const message of artifactErrors(fixture)) errors.push(`${scenario.id}: ${message}`);
  scenarioHashes[scenario.id] = {};
  for (const artifact of matrix.shared_artifacts) {
    if (!(artifact in (fixture.artifacts || {}))) { errors.push(`${scenario.id} 缺产物 ${artifact}`); continue; }
    const normalized = JSON.stringify(stable(fixture.artifacts[artifact]));
    if (/"(?:runtime|planner_runtime|implementation_runtime|review_runtime)"\s*:/i.test(normalized))
      errors.push(`${scenario.id}/${artifact} 泄漏运行时字段`);
    scenarioHashes[scenario.id][artifact] = hash(normalized);
  }
}
for (const artifact of crossScenarioMismatches(scenarioHashes)) errors.push(`${artifact} 在四场景中不一致`);
const mutationSource = JSON.parse(JSON.stringify(loadedFixtures.B));
mutationSource.artifacts.gates.G3 = false;
const mutatedHashes = JSON.parse(JSON.stringify(scenarioHashes));
mutatedHashes.B.gates = hash(JSON.stringify(stable(mutationSource.artifacts.gates)));
if (!crossScenarioMismatches(mutatedHashes).includes('gates'))
  errors.push('handoff 产物变异测试失效：单场景 Gate 漂移未被主比较器检出');
const invalidTaskMutation = JSON.parse(JSON.stringify(loadedFixtures.C));
delete invalidTaskMutation.artifacts['task-package'].files;
if (!artifactErrors(invalidTaskMutation).some(message => /files/.test(message)))
  errors.push('handoff schema 变异测试失效：缺任务包 files 未被拒绝');
const invalidStatusMutation = JSON.parse(JSON.stringify(loadedFixtures.D));
delete invalidStatusMutation.artifacts.status.code_reviews[0].review_report_dir;
if (!artifactErrors(invalidStatusMutation).some(message => /review_report_dir/.test(message)))
  errors.push('handoff schema 变异测试失效：缺 status review_report_dir 未被拒绝');

if (errors.length) {
  console.error('❌ 双运行时交接协议演练失败：');
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('✅ 双运行时交接契约夹具通过：A/B/C/D 独立产物规范化哈希一致，Gate 变异可检出');
for (const scenario of matrix.scenarios) {
  console.log(`- ${scenario.id} ${scenario.planning}→${scenario.implementation}→${scenario.review}: ${JSON.stringify(scenarioHashes[scenario.id])}`);
}
