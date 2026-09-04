#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-ready-'));
const script = path.join(__dirname, 'check-sprint.js');
function write(relative, source) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
function task(id, deps, risk = 'standard', layer = 'backend') {
  return `---\ntask-id: ${id}\nsource: sprint\nrisk: ${risk}\nlayers: [${layer}]\ndepends_on: [${deps.join(', ')}]\nfiles: [src/${id}.ts]\nasset-writes: []\n---\n`;
}
function status(aStatus, extra = '') {
  return `tasks:\n  - id: demo-v1-001\n    status: ${aStatus}\n    depends_on: []\n  - id: demo-v1-002\n    status: 可取\n    depends_on: [demo-v1-001]\n${extra}`;
}
function ready(ids) {
  return childProcess.spawnSync(process.execPath, [script, '--ready', ids, root], { cwd: root, encoding: 'utf8' });
}
function waveReady(ids) {
  return childProcess.spawnSync(process.execPath, [script, '--wave-ready', ids, root], { cwd: root, encoding: 'utf8' });
}
function waveState(progress) {
  return childProcess.spawnSync(process.execPath, [script, '--wave-state', progress, root], { cwd: root, encoding: 'utf8' });
}

write('iterations/v1/queue/demo-v1-001.md', task('demo-v1-001', []));
write('iterations/v1/queue/demo-v1-002.md', task('demo-v1-002', ['demo-v1-001']));
write('status.yml', status('merged'));
assert.strictEqual(ready('demo-v1-002').status, 0, '外部依赖 merged 应可认领');
write('status.yml', status('taken-by'));
assert.strictEqual(ready('demo-v1-002').status, 1, '外部依赖未 merged 必须阻断');
write('status.yml', status('可取'));
assert.strictEqual(ready('demo-v1-001,demo-v1-002').status, 0, '同批依赖拓扑闭合应通过');
assert.strictEqual(ready('demo-v1-002,demo-v1-001').status, 1, '同批依赖逆序必须阻断');
assert.strictEqual(waveReady('demo-v1-001,demo-v1-002').status, 0, '同层 standard 且无 active consumer 应允许 wave');
write('iterations/v1/queue/demo-v1-002.md', task('demo-v1-002', ['demo-v1-001'], 'sensitive'));
assert.strictEqual(waveReady('demo-v1-001,demo-v1-002').status, 1, '声明 sensitive 必须阻断 wave');
write('iterations/v1/queue/demo-v1-002.md', task('demo-v1-002', ['demo-v1-001']));
write('status.yml', status('可取', '  - id: demo-v1-003\n    status: taken-by\n    depends_on: [demo-v1-001]\n'));
assert.strictEqual(waveReady('demo-v1-001,demo-v1-002').status, 1, '集合外 active consumer 必须阻断 wave');
const waveBranch = 'backend-wave-v1-demo-v1-001/demo-v1-002';
childProcess.execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
childProcess.execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
childProcess.execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
childProcess.execFileSync('git', ['add', '.'], { cwd: root });
childProcess.execFileSync('git', ['commit', '-m', 'base'], { cwd: root, stdio: 'ignore' });
childProcess.execFileSync('git', ['checkout', '-b', waveBranch], { cwd: root, stdio: 'ignore' });
const reviewedTree = childProcess.execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: root, encoding: 'utf8' }).trim();
write('src/a.ts', 'export const a = 1;\n');
write('iterations/v1/code-reviews/demo-v1-001/preflight.md', '---\nresult: pass\n---\n');
write('iterations/v1/code-reviews/demo-v1-001/profile-round-01.json', '{}\n');
write('iterations/v1/code-reviews/demo-v1-001/round-01.md', `---\nschema: develop-review-round/v2\ntask_id: demo-v1-001\nreviewed_head: ${reviewedTree}\nconclusion: pass\n---\n`);
childProcess.execFileSync('git', ['add', 'src/a.ts', 'iterations/v1/code-reviews/demo-v1-001'], { cwd: root });
childProcess.execFileSync('git', ['commit', '-m', 'feat: A accepted'], { cwd: root, stdio: 'ignore' });
const acceptedCommit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const progressRel = '_meta/sessions/develop-wave-demo-v1-001--demo-v1-002.json';
write(progressRel, JSON.stringify({ schema: 'wave-progress/v1', branch: waveBranch, tasks: [
  { id: 'demo-v1-001', state: 'accepted', commit: acceptedCommit,
    preflight: 'iterations/v1/code-reviews/demo-v1-001/preflight.md',
    profile: 'iterations/v1/code-reviews/demo-v1-001/profile-round-01.json',
    final_report: 'iterations/v1/code-reviews/demo-v1-001/round-01.md' },
  { id: 'demo-v1-002', state: 'current', commit: null, final_report: null },
] }, null, 2));
write('status.yml', `tasks:\n  - id: demo-v1-001\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n  - id: demo-v1-002\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n`);
assert.strictEqual(waveState(progressRel).status, 0, '真实 branch/progress/accepted report+commit 应可恢复');
write('status.yml', `tasks:\n  - id: demo-v1-001\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n  - id: demo-v1-002\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n  - id: demo-v1-003\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n`);
assert.strictEqual(waveState(progressRel).status, 1, 'progress 漏掉同 branch 的 C 必须失败');
write('status.yml', `tasks:\n  - id: demo-v1-001\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n  - id: demo-v1-002\n    status: 可取\n    assigned_to: alice\n    branch: ${waveBranch}\n`);
assert.strictEqual(waveState(progressRel).status, 1, 'A taken-by/B 可取的死锁状态必须失败');
write('status.yml', `tasks:\n  - id: demo-v1-001\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n  - id: demo-v1-002\n    status: taken-by\n    assigned_to: alice\n    branch: ${waveBranch}\n`);
write('iterations/v1/code-reviews/demo-v1-001/round-01.md', `---\nschema: develop-review-round/v2\ntask_id: demo-v1-001\nreviewed_head: ${reviewedTree}\nconclusion: revise\n---\n`);
childProcess.execFileSync('git', ['add', 'iterations/v1/code-reviews/demo-v1-001/round-01.md'], { cwd: root });
childProcess.execFileSync('git', ['commit', '-m', 'test: committed report revise'], { cwd: root, stdio: 'ignore' });
const reviseCommit = childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const revisedProgress = JSON.parse(fs.readFileSync(path.join(root, progressRel), 'utf8'));
revisedProgress.tasks[0].commit = reviseCommit;
write(progressRel, JSON.stringify(revisedProgress, null, 2));
write('iterations/v1/code-reviews/demo-v1-001/round-01.md', `---\nschema: develop-review-round/v2\ntask_id: demo-v1-001\nreviewed_head: ${reviewedTree}\nconclusion: pass\n---\n`);
assert.strictEqual(waveState(progressRel).status, 1, 'commit 内 revise 不得被工作树 pass 篡改成恢复绿');
const missingEvidence = JSON.parse(fs.readFileSync(path.join(root, progressRel), 'utf8'));
missingEvidence.tasks[0].preflight = 'iterations/v1/code-reviews/demo-v1-001/missing-preflight.md';
write(progressRel, JSON.stringify(missingEvidence, null, 2));
assert.strictEqual(waveState(progressRel).status, 1, 'accepted commit 缺 preflight/profile 必须失败');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint ready 正反夹具通过');
