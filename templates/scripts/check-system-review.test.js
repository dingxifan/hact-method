#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const checker = require('./check-system-review.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-system-review-'));
const git = args => childProcess.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
git(['init', '-q']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
fs.writeFileSync(path.join(root, 'candidate.txt'), 'candidate\n'); git(['add', '.']); git(['commit', '-qm', 'candidate']);
const candidate = git(['rev-parse', 'HEAD']).stdout.trim();
const dir = path.join(root, 'iterations', 'v1', 'system-review'); fs.mkdirSync(dir, { recursive: true });

function report(values, body = '') {
  const array = value => `[${(value || []).join(', ')}]`;
  return `---\nschema: system-review/v2\nreview_id: ${values.id}\nreview_type: ${values.type}\ncandidate: ${values.candidate || candidate}\nprior_report: ${values.prior || 'null'}\ntarget_finding_ids: ${array(values.target)}\nnew_finding_ids: ${array(values.created)}\nclosed_finding_ids: ${array(values.closed)}\nopen_finding_ids: ${array(values.open)}\nconclusion: ${values.conclusion}\nevidence_refs: [evidence/system.txt]\ncreated_at: 2026-09-25T12:00:00Z\n---\n${body}`;
}

const r1 = 'iterations/v1/system-review/review-001.md';
const r2 = 'iterations/v1/system-review/review-002.md';
const findingBody = '\n### SYS-F001\nSeverity: blocking\nSummary: unsafe behavior\nEvidence: evidence/system.txt\nRequired action: fix behavior\n';
fs.writeFileSync(path.join(root, r1), report({ id: 'review-001', type: 'full', created: ['SYS-F001'], open: ['SYS-F001'], conclusion: 'blocked' }, findingBody));
assert.deepStrictEqual(checker.validateChain(root, [r1], { inProgress: true }), []);
assert.ok(checker.validateChain(root, [r1]).some(x => /latest System Review must pass/.test(x)));

fs.writeFileSync(path.join(root, r2), report({ id: 'review-002', type: 'targeted', prior: r1, target: ['SYS-F001'], closed: ['SYS-F001'], open: [], conclusion: 'pass' }));
assert.ok(checker.validateChain(root, [r1, r2]).some(x => /new fixed candidate/.test(x)), 'same candidate cannot close finding');
fs.writeFileSync(path.join(root, 'candidate.txt'), 'fixed\n'); git(['add', '.']); git(['commit', '-qm', 'fix']);
const repairedCandidate = git(['rev-parse', 'HEAD']).stdout.trim();
fs.writeFileSync(path.join(root, r2), report({ id: 'review-002', type: 'targeted', candidate: repairedCandidate, prior: r1, target: ['SYS-F001'], closed: ['SYS-F001'], open: [], conclusion: 'pass' }));
assert.deepStrictEqual(checker.validateChain(root, [r1, r2]), []);

fs.mkdirSync(path.join(root, 'integration-tests', 'evidence', 'v1', 'S-01'), { recursive: true });
fs.writeFileSync(path.join(root, 'integration-tests', 'evidence', 'v1', 'S-01', 'result.txt'), 'PASS\n');
fs.writeFileSync(path.join(root, 'integration-tests', 'result-v1.md'), `---
schema: integration-result/v3
iteration: v1
candidate_head: ${repairedCandidate}
latest_system_review: ${r2}
runtime_scope: [S-01]
result_status: satisfied
evidence_state: sufficient
created_at: 2026-09-25T12:10:00Z
---
| # | 模块 | 场景描述 | 结果 | 证据 | 未运行原因 | 现象 | 级别 | 复测 |
|---|---|---|---|---|---|---|---|---|
| S-01 | core | smoke | ✅ | integration-tests/evidence/v1/S-01/result.txt | — | — | — | — |
`);
const status = latest => `tasks:
  - id: demo-v1-integration-verify
    iteration: v1
    type: integration-verify
    status: merged
    latest_system_review: ${latest}
    integration_result: integration-tests/result-v1.md
    final_candidate: ${repairedCandidate}
`;
fs.writeFileSync(path.join(root, 'status.yml'), status(r2));
assert.deepStrictEqual(checker.validate('v1', root), [], 'completion binds status, report and runtime evidence');
const cli = (...args) => childProcess.spawnSync(process.execPath, [path.join(__dirname, 'check-system-review.js'), ...args], { encoding: 'utf8' });
assert.strictEqual(cli('v1', root).status, 0, 'completion CLI must use the full binding path');
fs.writeFileSync(path.join(root, 'status.yml'), status('iterations/v1/system-review/review-999.md'));
assert.ok(checker.validate('v1', root).some(x => /latest_system_review/.test(x)), 'stale review pointer must fail');
assert.notStrictEqual(cli('v1', root).status, 0, 'completion CLI must reject stale pointers');
fs.writeFileSync(path.join(root, 'status.yml'), status(r2).replace(repairedCandidate, candidate));
assert.ok(checker.validate('v1', root).some(x => /final_candidate/.test(x)), 'candidate mismatch must fail');
assert.notStrictEqual(cli('v1', root).status, 0, 'completion CLI must reject candidate mismatch');
fs.writeFileSync(path.join(root, 'status.yml'), status(r2).replace('integration-tests/result-v1.md', 'integration-tests/missing.md'));
assert.ok(checker.validate('v1', root).length, 'missing runtime result must fail');
assert.notStrictEqual(cli('v1', root).status, 0, 'completion CLI must reject missing runtime result');
fs.writeFileSync(path.join(root, 'status.yml'), status(r2));

fs.writeFileSync(path.join(root, r2), report({ id: 'review-002', type: 'targeted', candidate: repairedCandidate, prior: 'wrong.md', target: ['SYS-F001'], closed: ['SYS-F001'], open: [], conclusion: 'pass' }));
assert.ok(checker.validateChain(root, [r1, r2]).some(x => /prior_report/.test(x)));

fs.writeFileSync(path.join(root, r2), report({ id: 'review-002', type: 'targeted', candidate: repairedCandidate, prior: r1, target: ['SYS-F001'], closed: [], open: [], conclusion: 'pass' }));
assert.ok(checker.validateChain(root, [r1, r2]).some(x => /open_finding_ids/.test(x)));

fs.writeFileSync(path.join(root, r1), report({ id: 'review-001', type: 'targeted', target: ['SYS-F001'], open: [], conclusion: 'pass' }));
assert.ok(checker.validateChain(root, [r1]).some(x => /first System Review must be full/.test(x)));

fs.writeFileSync(path.join(root, r1), report({ id: 'review-001', type: 'full', created: ['SYS-F001'], open: ['SYS-F001'], conclusion: 'blocked' }, '\n### SYS-F001\n'));
assert.ok(checker.validateChain(root, [r1], { inProgress: true }).length, 'hollow finding must fail');

if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ current System Review report-chain fixtures passed');
