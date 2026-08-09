#!/usr/bin/env node
'use strict';

const assert = require('assert');
const {
  CORE_DIMENSIONS,
  DIMENSION_IDS,
  buildReviewProfileFromText,
} = require('./review-profile');

function task({ id, type, layers, source, risk = 'standard', standards = [], body = '', api = '' }) {
  return `---
task-id: ${id}
task_type: ${type}
layers: [${layers.join(', ')}]
source: ${source}
risk: ${risk}
relevant-standards: [${standards.join(', ')}]
${api}${body}
---
`;
}

function selected(profile) {
  return profile.selected_dimensions.map(item => item.id);
}

function omitted(profile) {
  return profile.omitted_dimensions.map(item => item.id);
}

function assertPartition(profile) {
  assert.deepStrictEqual([...selected(profile), ...omitted(profile)].sort(), [...DIMENSION_IDS].sort());
  assert.strictEqual(new Set([...selected(profile), ...omitted(profile)]).size, DIMENSION_IDS.length);
  for (const id of CORE_DIMENSIONS) assert(selected(profile).includes(id), `missing core ${id}`);
  for (const item of [...profile.selected_dimensions, ...profile.omitted_dimensions]) assert(item.reason);
}

const enforcement = buildReviewProfileFromText(task({
  id: 'demo-b-001', type: 'dev-backend', layers: ['backend'], source: 'bug',
  body: 'title: 收紧 AST enforcement\ndescription: 规则漏判 → fail-closed\n',
}), ['tests/enforcement/guard.spec.ts', 'scripts/check-guard.js'], 'standard');
assertPartition(enforcement);
assert(selected(enforcement).includes('enforcement'));
for (const id of ['design-fidelity', 'input-provenance', 'query-performance', 'concurrency', 'logging-privacy', 'maintainability']) {
  assert(omitted(enforcement).includes(id), `pure enforcement should omit ${id}`);
}
const enforcementTextChanged = buildReviewProfileFromText(task({
  id: 'demo-b-001', type: 'dev-backend', layers: ['backend'], source: 'bug',
  body: 'title: 收紧 AST enforcement（修订）\ndescription: 规则漏判 → fail-closed\n',
}), ['tests/enforcement/guard.spec.ts', 'scripts/check-guard.js'], 'standard');
assert.notStrictEqual(enforcement.input_fingerprint, enforcementTextChanged.input_fingerprint,
  'task frontmatter changes must invalidate the profile fingerprint');
const statusTaken = buildReviewProfileFromText(task({
  id: 'demo-b-003', type: 'dev-backend', layers: ['backend'], source: 'bug',
  body: 'status: taken-by:cc\ntitle: 状态无关任务\ndescription: A → B\n',
}), ['tests/rule.spec.ts'], 'standard');
const statusMerged = buildReviewProfileFromText(task({
  id: 'demo-b-003', type: 'dev-backend', layers: ['backend'], source: 'bug',
  body: 'status: merged\ntitle: 状态无关任务\ndescription: A → B\n',
}), ['tests/rule.spec.ts'], 'standard');
assert.strictEqual(statusTaken.input_fingerprint, statusMerged.input_fingerprint,
  'operational status transitions must not invalidate a normative review profile');

const frontend = buildReviewProfileFromText(task({
  id: 'demo-v1-001', type: 'dev-frontend', layers: ['frontend'], source: 'sprint', standards: ['FE-001'],
  body: 'title: 账户页面\nreference:\n  - design.md § account\n',
}), ['src/pages/Account.vue', 'src/styles/account.scss'], 'standard');
assertPartition(frontend);
for (const id of ['standards', 'design-fidelity', 'logging-privacy', 'maintainability']) assert(selected(frontend).includes(id));
for (const id of ['input-provenance', 'query-performance', 'concurrency']) assert(omitted(frontend).includes(id));

const backend = buildReviewProfileFromText(task({
  id: 'demo-v1-002', type: 'dev-backend', layers: ['backend'], source: 'sprint', standards: ['BE-001'],
  api: 'api-contract:\n  endpoint: POST /users\n  request:\n    body: { email: string }\n',
  body: 'title: 并发创建用户\ndescription: 普通写入 → transaction + unique 收口\n',
}), ['src/users/user.controller.ts', 'src/users/user.repository.ts'], 'standard');
assertPartition(backend);
for (const id of ['standards', 'input-provenance', 'query-performance', 'concurrency', 'logging-privacy', 'maintainability']) {
  assert(selected(backend).includes(id), `backend data task should select ${id}`);
}
assert(omitted(backend).includes('design-fidelity'));

const sensitiveEnforcement = buildReviewProfileFromText(task({
  id: 'demo-b-002', type: 'dev-backend', layers: ['backend'], source: 'bug', risk: 'sensitive',
  body: 'title: 鉴权规则反例\ndescription: guard 漏判 → 补 AST probe\n',
}), ['tests/auth/guard.spec.ts', 'scripts/check-auth.js'], 'standard');
assertPartition(sensitiveEnforcement);
assert.strictEqual(sensitiveEnforcement.effective_risk, 'sensitive', 'declared sensitive must not be downgraded');
assert(selected(sensitiveEnforcement).includes('sensitive-boundaries'));
assert(selected(sensitiveEnforcement).includes('enforcement'));
assert(omitted(sensitiveEnforcement).includes('input-provenance'));
assert(omitted(sensitiveEnforcement).includes('query-performance'));

const incomplete = buildReviewProfileFromText('---\ntask-id: demo-unknown-001\n---\n', [], 'standard');
assertPartition(incomplete);
assert.deepStrictEqual(selected(incomplete).sort(), [...DIMENSION_IDS].sort());

console.log('review-profile tests: 5/5 passed');
