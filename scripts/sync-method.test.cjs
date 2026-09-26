#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const sync = require('./sync-method.cjs');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-method-install-v2-'));
const method = path.join(temp, 'method');
const project = path.join(temp, 'project');
const customProject = path.join(temp, 'custom-project');
const forgedProject = path.join(temp, 'forged-project');
const retiredDriftProject = path.join(temp, 'retired-drift-project');
const run = (cwd, args) => childProcess.execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
function init(root) {
  fs.mkdirSync(root, { recursive: true }); run(root, ['init', '-q']);
  run(root, ['config', 'user.email', 'test@example.com']); run(root, ['config', 'user.name', 'Test']);
}
function commit(root, message) { run(root, ['add', '-A']); run(root, ['commit', '-qm', message]); }
function writeMethod() {
  fs.mkdirSync(path.join(method, 'templates', 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(method, 'templates', 'AGENTS.md'), 'current agents\n');
  fs.writeFileSync(path.join(method, 'templates', 'gitee-ops.md'), 'ops\n');
  fs.writeFileSync(path.join(method, 'templates', 'scripts', 'pre-commit-hook.sh'), '#!/bin/sh\n');
  fs.writeFileSync(path.join(method, 'templates', 'scripts', 'check-gate.js'), 'console.log("gate")\n');
  fs.writeFileSync(path.join(method, 'templates', 'scripts', 'retired-check.js'), 'console.log("old")\n');
  fs.writeFileSync(path.join(method, 'templates', 'method-install-policy.json'), `${JSON.stringify({
    schema: 'hact-method-install-policy/v1', default_ownership: 'method-owned',
    files: { 'AGENTS.md': 'merged', 'gitee-ops.md': 'project-owned' },
  }, null, 2)}\n`);
  commit(method, 'method');
}

init(method); init(project); init(customProject); init(forgedProject); init(retiredDriftProject); writeMethod();
for (const root of [project, customProject, forgedProject, retiredDriftProject]) {
  fs.writeFileSync(path.join(root, 'README.md'), 'project\n'); commit(root, 'project');
}
fs.writeFileSync(path.join(customProject, 'AGENTS.md'), 'project rules\n'); commit(customProject, 'custom agents');

const source = sync.loadSource(method, 'HEAD');
assert.ok(sync.inspect(project, source).rows.every(row => row.state === 'missing'));
assert.strictEqual(sync.install(project, source).state, 'verified');
assert.strictEqual(sync.verify(project, source).state, 'verified');
assert.strictEqual(sync.runtimeCheck(project, method).source, source.source);
assert.strictEqual(sync.readAdopted(project, method, 'templates/AGENTS.md'), 'current agents\n');
assert.throws(() => sync.install(customProject, source), /legacy normalization/);
assert.strictEqual(fs.readFileSync(path.join(customProject, 'AGENTS.md'), 'utf8'), 'project rules\n');

assert.strictEqual(sync.install(retiredDriftProject, source).state, 'verified');
commit(retiredDriftProject, 'installed old method');
fs.writeFileSync(path.join(retiredDriftProject, 'scripts', 'retired-check.js'), 'project customization\n');
commit(retiredDriftProject, 'customized retired method file');

commit(project, 'installed old method');
fs.writeFileSync(path.join(project, 'project-owned.txt'), 'keep\n'); commit(project, 'project data');
fs.rmSync(path.join(method, 'templates', 'scripts', 'retired-check.js'));
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'check-gate.js'), 'console.log("gate-v2")\n');
commit(method, 'next method');
const next = sync.loadSource(method, 'HEAD');
assert.strictEqual(sync.install(project, next).state, 'verified');
assert.ok(!fs.existsSync(path.join(project, 'scripts', 'retired-check.js')), 'clean retired Method-owned file must be removed');
assert.strictEqual(fs.readFileSync(path.join(project, 'project-owned.txt'), 'utf8'), 'keep\n');
assert.strictEqual(fs.readFileSync(path.join(project, 'scripts', 'check-gate.js'), 'utf8'), 'console.log("gate-v2")\n');
assert.throws(() => sync.install(retiredDriftProject, next), /retired\/orphan Method path requires resolution/);
assert.strictEqual(fs.readFileSync(path.join(retiredDriftProject, 'scripts', 'retired-check.js'), 'utf8'), 'project customization\n');

const forgedBytes = fs.readFileSync(path.join(forgedProject, 'README.md'));
fs.mkdirSync(path.join(forgedProject, '_meta'), { recursive: true });
fs.writeFileSync(path.join(forgedProject, '_meta', 'method-sync.json'), `${JSON.stringify({
  schema: sync.MANIFEST_SCHEMA,
  source: source.source,
  files: [{ path: 'README.md', ownership: 'method-owned', source_sha256: sync.sha256(forgedBytes), installed_sha256: sync.sha256(forgedBytes) }],
}, null, 2)}\n`);
commit(forgedProject, 'forged ownership');
assert.throws(() => sync.install(forgedProject, next), /does not match its Method source/);

commit(project, 'installed current method');
const metadataPath = path.join(project, '_meta', 'method-sync.json');
const tampered = JSON.parse(fs.readFileSync(metadataPath, 'utf8')); tampered.files = [];
fs.writeFileSync(metadataPath, `${JSON.stringify(tampered, null, 2)}\n`);
assert.throws(() => sync.verify(project, next), /file-manifest-mismatch/);
run(project, ['checkout', '--', '_meta/method-sync.json']);
fs.writeFileSync(path.join(project, 'AGENTS.md'), 'unrecorded drift\n');
assert.throws(() => sync.verify(project, next), /installed-content-drift/);
assert.throws(() => sync.install(project, next), /worktree must be clean/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ current-only Method install/verify v2 fixtures passed');
