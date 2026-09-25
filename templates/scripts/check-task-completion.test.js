#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const checker = path.resolve(__dirname, 'check-task-completion.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-task-completion-'));
const runGit = args => childProcess.execFileSync('git', args, { cwd: temp, encoding: 'utf8' }).trim();
const runCheck = args => childProcess.spawnSync(process.execPath, [checker, ...args], { cwd: temp, encoding: 'utf8' });
const write = (relative, content) => { const file = path.join(temp, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };

runGit(['init', '-q']); runGit(['config', 'user.email', 'test@example.com']); runGit(['config', 'user.name', 'Test']);
write('status.yml', 'tasks:\n  - id: mail-v11-trd\n    iteration: v11\n    type: draft-tech-design\n    status: taken-by\n');
write('iterations/v11/prd.md', '# PRD\n');
write('iterations/v11/trd.md', '# TRD\n');
runGit(['add', '.']); runGit(['commit', '-qm', 'candidate']);
const candidate = runGit(['rev-parse', 'HEAD']);
const tree = runGit(['rev-parse', 'HEAD^{tree}']);
const artifact = crypto.createHash('sha256').update(childProcess.execFileSync('git', ['show', `${candidate}:iterations/v11/trd.md`], { cwd: temp })).digest('hex');
write('iterations/v11/document-reviews/mail-v11-trd/round-01.md', `---
schema: hact-document-review/v1
task_id: mail-v11-trd
task_type: draft-tech-design
round: 1
review_type: initial
reviewer_isolation: fresh-isolated
prior_report: null
candidate_commit: ${candidate}
candidate_tree: ${tree}
artifact_path: iterations/v11/trd.md
artifact_sha256: ${artifact}
target_finding_ids: []
blocking_finding_ids: []
closed_finding_ids: []
open_blocking_finding_ids: []
conclusion: pass
---

findings: []
`);
runGit(['add', '.']); runGit(['commit', '-qm', 'review']);
write('status.yml', 'tasks:\n  - id: mail-v11-trd\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n');
runGit(['add', 'status.yml']);
let result = runCheck(['--staged', temp]);
assert.strictEqual(result.status, 0, result.stdout + result.stderr);

write('iterations/v11/document-reviews/mail-v11-trd/round-01.md', fs.readFileSync(path.join(temp, 'iterations/v11/document-reviews/mail-v11-trd/round-01.md'), 'utf8').replace(artifact, '0'.repeat(64)));
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /未暂存变化/);
runGit(['checkout', '--', 'iterations/v11/document-reviews/mail-v11-trd/round-01.md']);

write('iterations/v11/document-reviews/mail-v11-trd/round-01.md', fs.readFileSync(path.join(temp, 'iterations/v11/document-reviews/mail-v11-trd/round-01.md'), 'utf8').replace('findings: []', 'findings: rewritten'));
runGit(['add', 'iterations/v11/document-reviews/mail-v11-trd/round-01.md']);
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /不得修改、删除或改名/);
runGit(['reset', 'HEAD', '--', 'iterations/v11/document-reviews/mail-v11-trd/round-01.md']);
runGit(['checkout', '--', 'iterations/v11/document-reviews/mail-v11-trd/round-01.md']);

runGit(['reset', '--hard', 'HEAD']);
write('iterations/v11/document-reviews/mail-v11-trd/round-01.md', fs.readFileSync(path.join(temp, 'iterations/v11/document-reviews/mail-v11-trd/round-01.md'), 'utf8').replace('findings: []', 'findings: committed rewrite'));
runGit(['add', 'iterations/v11/document-reviews/mail-v11-trd/round-01.md']); runGit(['commit', '-qm', 'rewrite historical review']);
write('status.yml', 'tasks:\n  - id: mail-v11-trd\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n');
runGit(['add', 'status.yml']);
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /immutable blob 不一致/);
runGit(['reset', '--hard', 'HEAD~1']);

runGit(['reset', '--hard', 'HEAD']);
write('iterations/v11/trd.md', '# TRD changed after review\n');
runGit(['add', 'iterations/v11/trd.md']); runGit(['commit', '-qm', 'unreviewed trd change']);
write('status.yml', 'tasks:\n  - id: mail-v11-trd\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n');
runGit(['add', 'status.yml']);
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /当前接受的 TRD 与 final reviewed candidate artifact 不一致/);

write('status.yml', 'tasks:\n  - id: repeated\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n  - id: repeated\n    iteration: v10\n    type: develop\n    status: merged\n');
runGit(['add', 'status.yml']);
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /重复 task id/);

const temp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-task-closure-'));
const git2 = args => childProcess.execFileSync('git', args, { cwd: temp2, encoding: 'utf8' }).trim();
const write2 = (relative, content) => { const file = path.join(temp2, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
git2(['init', '-q']); git2(['config', 'user.email', 'test@example.com']); git2(['config', 'user.name', 'Test']);
write2('status.yml', 'tasks:\n  - id: mail-v12-trd\n    iteration: v12\n    type: draft-tech-design\n    status: done\n');
write2('iterations/v12/trd.md', '# TRD v12\n');
git2(['add', '.']); git2(['commit', '-qm', 'v12 candidate']);
const candidate2 = git2(['rev-parse', 'HEAD']);
const tree2 = git2(['rev-parse', 'HEAD^{tree}']);
const artifact2 = crypto.createHash('sha256').update(childProcess.execFileSync('git', ['show', `${candidate2}:iterations/v12/trd.md`], { cwd: temp2 })).digest('hex');
write2('iterations/v12/document-reviews/mail-v12-trd/round-01.md', `---
schema: hact-document-review/v1
task_id: mail-v12-trd
task_type: draft-tech-design
round: 1
review_type: initial
reviewer_isolation: fresh-isolated
prior_report: null
candidate_commit: ${candidate2}
candidate_tree: ${tree2}
artifact_path: iterations/v12/trd.md
artifact_sha256: ${artifact2}
target_finding_ids: []
blocking_finding_ids: [mail-v12-trd-F001]
closed_finding_ids: []
open_blocking_finding_ids: [mail-v12-trd-F001]
conclusion: revise
---
`);
write2('iterations/v12/document-reviews/mail-v12-trd/round-02.md', `---
schema: hact-document-review/v1
task_id: mail-v12-trd
task_type: draft-tech-design
round: 2
review_type: targeted
reviewer_isolation: fresh-isolated
prior_report: iterations/v12/document-reviews/mail-v12-trd/round-01.md
candidate_commit: ${candidate2}
candidate_tree: ${tree2}
artifact_path: iterations/v12/trd.md
artifact_sha256: ${artifact2}
target_finding_ids: [mail-v12-trd-F001]
blocking_finding_ids: []
closed_finding_ids: [mail-v12-trd-F001]
open_blocking_finding_ids: []
conclusion: pass
---
`);
result = childProcess.spawnSync(process.execPath, [checker, '--task', 'mail-v12-trd', temp2], { cwd: temp2, encoding: 'utf8' });
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /必须绑定新的 fixed candidate/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
fs.rmSync(temp2, { recursive: true, force: true });
console.log('✅ task completion fixtures passed');
