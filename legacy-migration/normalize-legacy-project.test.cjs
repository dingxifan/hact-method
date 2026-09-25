#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const sync = require('../scripts/sync-method.cjs');
const normalizer = require('./normalize-legacy-project.cjs');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-legacy-adoption-'));
const method = path.join(temp, 'method');
const project = path.join(temp, 'project');
const duplicateProject = path.join(temp, 'duplicate-project');
const run = (cwd, args) => childProcess.execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
function init(root) {
  fs.mkdirSync(root, { recursive: true }); run(root, ['init', '-q']);
  run(root, ['config', 'user.email', 'test@example.com']); run(root, ['config', 'user.name', 'Test']);
}
function commit(root, message) { run(root, ['add', '-A']); run(root, ['commit', '-qm', message]); return run(root, ['rev-parse', 'HEAD']); }

init(method);
fs.mkdirSync(path.join(method, 'templates', 'scripts'), { recursive: true });
fs.writeFileSync(path.join(method, 'templates', 'AGENTS.md'), '# Agents\n\n## Method\nlegacy agents\n\n## Project\n');
fs.writeFileSync(path.join(method, 'templates', 'gitee-ops.md'), '# Ops\n\n## Method\nlegacy ops\n\n## Project\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'pre-commit-hook.sh'), '#!/bin/sh\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'check-gate.js'), 'console.log("legacy")\n');
const legacySource = commit(method, 'legacy method');
fs.writeFileSync(path.join(method, 'templates', 'AGENTS.md'), '# Agents\n\n## Method\ncurrent agents\n\n## Project\n');
fs.writeFileSync(path.join(method, 'templates', 'gitee-ops.md'), '# Ops\n\n## Method\ncurrent ops\n\n## Project\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'check-gate.js'), 'console.log("current")\n');
fs.writeFileSync(path.join(method, 'templates', 'method-install-policy.json'), `${JSON.stringify({
  schema: 'hact-method-install-policy/v1', default_ownership: 'method-owned',
  files: { 'AGENTS.md': 'merged', 'gitee-ops.md': 'merged' },
}, null, 2)}\n`);
commit(method, 'current method');
const target = sync.loadSource(method, 'HEAD');

function makeLegacyProject(root, status) {
  init(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, '_meta'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Agents\n\n## Method\nlegacy agents\n\n## Project\nproject-only rule\n');
  fs.writeFileSync(path.join(root, 'gitee-ops.md'), '# Ops\n\n## Method\nlegacy ops\n\n## Project\nproject host\n');
  fs.writeFileSync(path.join(root, 'scripts', 'pre-commit-hook.sh'), '#!/bin/sh\n');
  fs.writeFileSync(path.join(root, 'scripts', 'check-gate.js'), 'console.log("legacy")\n');
  fs.writeFileSync(path.join(root, 'status.yml'), status);
  fs.writeFileSync(path.join(root, '_meta', 'method-sync.json'), `${JSON.stringify({
    schema: 1, state: 'verified', source: legacySource,
    files: { 'AGENTS.md': { action: 'merge' }, 'gitee-ops.md': { action: 'merge' },
      'scripts/pre-commit-hook.sh': { action: 'same' }, 'scripts/check-gate.js': { action: 'same' } },
  }, null, 2)}\n`);
  commit(root, 'legacy project');
}

makeLegacyProject(project, 'tasks:\n  - id: current-task\n    status: taken-by\n');
const plan = normalizer.buildPlan(project, target);
assert.deepStrictEqual(plan.blockers, []);
assert.strictEqual(plan.files.find(item => item.path === 'AGENTS.md').action, 'merge-three-way');
assert.strictEqual(plan.files.find(item => item.path === 'scripts/check-gate.js').action, 'update-source');
const result = normalizer.applyPlan(project, target, plan);
assert.strictEqual(result.state, 'verified');
assert.strictEqual(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), '# Agents\n\n## Method\ncurrent agents\n\n## Project\nproject-only rule\n');
assert.strictEqual(fs.readFileSync(path.join(project, 'scripts', 'check-gate.js'), 'utf8'), 'console.log("current")\n');
assert.strictEqual(JSON.parse(fs.readFileSync(path.join(project, '_meta', 'method-sync.json'), 'utf8')).schema, sync.MANIFEST_SCHEMA);
assert.ok(fs.existsSync(path.join(project, normalizer.EVIDENCE)));

commit(project, 'adopted current method');
fs.appendFileSync(path.join(project, 'AGENTS.md'), 'project post-adoption rule\n');
commit(project, 'project customizes merged entry');
fs.writeFileSync(path.join(method, 'templates', 'AGENTS.md'), '# Agents\n\n## Method\ncurrent agents v2\n\n## Project\n');
commit(method, 'upgrade current method');
const target2 = sync.loadSource(method, 'HEAD');
const upgradePlan = normalizer.buildPlan(project, target2);
assert.deepStrictEqual(upgradePlan.blockers, []);
assert.strictEqual(upgradePlan.legacy_method.kind, 'current');
assert.strictEqual(upgradePlan.files.find(item => item.path === 'AGENTS.md').action, 'merge-three-way');
assert.strictEqual(normalizer.applyPlan(project, target2, upgradePlan).state, 'verified');
assert.strictEqual(fs.readFileSync(path.join(project, 'AGENTS.md'), 'utf8'), '# Agents\n\n## Method\ncurrent agents v2\n\n## Project\nproject-only rule\nproject post-adoption rule\n');
assert.ok(fs.existsSync(path.join(project, normalizer.UPGRADE_EVIDENCE_DIR, `${target2.source}.json`)));
assert.ok(fs.existsSync(path.join(project, normalizer.EVIDENCE)), 'initial normalization evidence remains');

makeLegacyProject(duplicateProject, 'tasks:\n  - id: repeated\n    status: merged\n  - id: repeated\n    status: 可取\n');
const blocked = normalizer.buildPlan(duplicateProject, target2);
assert.ok(blocked.blockers.some(item => item.code === 'DUPLICATE_ACTIVE_TASK_ID'));
assert.throws(() => normalizer.applyPlan(duplicateProject, target2, blocked), /normalization blockers remain/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ legacy normalization fixtures passed');
