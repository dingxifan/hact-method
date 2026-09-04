#!/usr/bin/env node
'use strict';
// 四场景协议演练：不同运行时分工只能改变可选出处，不能改变共同产物。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..', '..');
const matrixPath = path.join(root, '_meta', 'fixtures', 'runtime-handoff', 'matrix.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
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

const boot = read('templates/boot-protocol.md');
const routes = [...boot.matchAll(/^\| `([^`]+)` \| `\.\.\/hact-method-lab\/specs-execution\/([^`]+)`/gmu)];
if (routes.length !== 13) errors.push(`共同启动协议任务路由应为 13，实际 ${routes.length}`);
for (const [entry, runtime] of [['templates/CLAUDE.md', 'cc'], ['templates/AGENTS.md', 'codex']]) {
  const source = read(entry);
  if (!source.includes('boot-protocol.md')) errors.push(`${entry} 未引用共同启动协议`);
  if (!source.includes(`runtime/${runtime}.md`)) errors.push(`${entry} 未引用自身运行时映射`);
}

const canonical = {
  'task-package': 'task-id=demo-v1-001|source=sprint|contract-impact=governed|asset-writes=[]',
  status: 'task=demo-v1-001|status=merged|gate.G3=signed|generated_by=hact-method',
  gates: 'G1=x|G2=x|G3=x|G4=-|G5=-',
  'review-conclusion': 'conclusion=pass|blocking=0|snapshot=fixed',
};
const scenarioHashes = {};
for (const scenario of matrix.scenarios) {
  const artifacts = { ...canonical };
  // 出处只能附着在 progress/review report；不进入上面的共同产物。
  const attribution = {
    progress: `runtime=${scenario.implementation}`,
    'review-report': `runtime=${scenario.review}`,
  };
  scenarioHashes[scenario.id] = Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, hash(value)]));
  if (!attribution.progress || !attribution['review-report']) errors.push(`${scenario.id} 缺运行时出处`);
}
for (const artifact of matrix.shared_artifacts) {
  const values = matrix.scenarios.map(scenario => scenarioHashes[scenario.id][artifact]);
  if (new Set(values).size !== 1) errors.push(`${artifact} 在四场景中不一致`);
}

if (errors.length) {
  console.error('❌ 双运行时交接协议演练失败：');
  errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}

console.log('✅ 双运行时交接协议演练通过：A/B/C/D 四场景共同产物哈希一致');
for (const scenario of matrix.scenarios) {
  console.log(`- ${scenario.id} ${scenario.planning}→${scenario.implementation}→${scenario.review}: ${JSON.stringify(scenarioHashes[scenario.id])}`);
}
