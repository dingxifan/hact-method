#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const sync = require('./sync-method.cjs');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-method-install-'));
const method = path.join(temp, 'method');
const project = path.join(temp, 'project');
const driftProject = path.join(temp, 'drift-project');
const forgedProject = path.join(temp, 'forged-project');
const run = (cwd, args) => childProcess.execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
function init(root) {
  fs.mkdirSync(root, { recursive: true }); run(root, ['init', '-q']);
  run(root, ['config', 'user.email', 'test@example.com']); run(root, ['config', 'user.name', 'Test']);
}
init(method); init(project); init(driftProject); init(forgedProject);
fs.mkdirSync(path.join(method, 'templates', 'scripts'), { recursive: true });
fs.writeFileSync(path.join(method, 'templates', 'AGENTS.md'), 'current agents\n');
fs.writeFileSync(path.join(method, 'templates', 'gitee-ops.md'), 'ops\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'pre-commit-hook.sh'), '#!/bin/sh\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'check-gate.js'), 'console.log("gate")\n');
fs.writeFileSync(path.join(method, 'templates', 'scripts', 'retired-check.js'), 'console.log("old")\n');
run(method, ['add', '.']); run(method, ['commit', '-qm', 'method']);
fs.writeFileSync(path.join(project, 'README.md'), 'project\n'); run(project, ['add', '.']); run(project, ['commit', '-qm', 'project']);
fs.writeFileSync(path.join(driftProject, 'README.md'), 'project\n'); run(driftProject, ['add', '.']); run(driftProject, ['commit', '-qm', 'project']);
fs.writeFileSync(path.join(forgedProject, 'project-owned.txt'), 'keep\n'); run(forgedProject, ['add', '.']); run(forgedProject, ['commit', '-qm', 'project']);

const source = sync.loadSource(method, 'HEAD');
assert.ok(sync.inspect(project, source).rows.every(row => row.state === 'missing'));
assert.strictEqual(sync.install(project, source).state, 'verified');
assert.strictEqual(sync.install(driftProject, source).state, 'verified');
assert.strictEqual(sync.verify(project, source).state, 'verified');
assert.strictEqual(sync.runtimeCheck(project, method).source, source.source);
assert.strictEqual(sync.readAdopted(project, method, 'templates/AGENTS.md'), 'current agents\n');

run(project, ['add', '.']); run(project, ['commit', '-qm', 'installed old method']);
run(driftProject, ['add', '.']); run(driftProject, ['commit', '-qm', 'installed old method']);
fs.writeFileSync(path.join(driftProject, 'scripts', 'retired-check.js'), 'project drift\n');
run(driftProject, ['add', '.']); run(driftProject, ['commit', '-qm', 'drift old method file']);
fs.writeFileSync(path.join(project, 'project-owned.txt'), 'keep\n'); run(project, ['add', '.']); run(project, ['commit', '-qm', 'project data']);
fs.rmSync(path.join(method, 'templates', 'scripts', 'retired-check.js'));
run(method, ['add', '-A']); run(method, ['commit', '-qm', 'retire old checker']);
const next = sync.loadSource(method, 'HEAD');

const forgedBytes = fs.readFileSync(path.join(forgedProject, 'project-owned.txt'));
const forgedHash = require('crypto').createHash('sha256').update(forgedBytes).digest('hex');
fs.mkdirSync(path.join(forgedProject, '_meta'), { recursive: true });
fs.writeFileSync(path.join(forgedProject, '_meta', 'method-sync.json'), `${JSON.stringify({
  schema: 'hact-method-install/v1',
  source: source.source,
  files: [{ path: 'project-owned.txt', sha256: forgedHash }],
}, null, 2)}\n`);
run(forgedProject, ['add', '.']); run(forgedProject, ['commit', '-qm', 'forged ownership']);
assert.throws(() => sync.install(forgedProject, next), /does not match its Method source/);
assert.strictEqual(fs.readFileSync(path.join(forgedProject, 'project-owned.txt'), 'utf8'), 'keep\n', 'forged ownership must never delete project data');

assert.throws(() => sync.install(driftProject, next), /retired Method-owned path drifted/);
assert.strictEqual(sync.install(project, next).state, 'verified');
assert.ok(!fs.existsSync(path.join(project, 'scripts', 'retired-check.js')), 'clean retired Method-owned file must be removed');
assert.strictEqual(fs.readFileSync(path.join(project, 'project-owned.txt'), 'utf8'), 'keep\n', 'project-owned neighbor must remain');

run(project, ['add', '-A']); run(project, ['commit', '-qm', 'installed current method']);
const metadataPath = path.join(project, '_meta', 'method-sync.json');
const tampered = JSON.parse(fs.readFileSync(metadataPath, 'utf8')); tampered.files = [];
fs.writeFileSync(metadataPath, `${JSON.stringify(tampered, null, 2)}\n`);
assert.throws(() => sync.verify(project, next), /file-manifest-mismatch/);
run(project, ['checkout', '--', '_meta/method-sync.json']);

fs.writeFileSync(path.join(project, 'AGENTS.md'), 'drift\n');
assert.throws(() => sync.verify(project, next), /verification failed/);
assert.throws(() => sync.install(project, next), /worktree must be clean/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ current-only Method install/verify fixtures passed');
