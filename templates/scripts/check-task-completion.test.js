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

write('status.yml', 'tasks:\n  - id: repeated\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n  - id: repeated\n    iteration: v10\n    type: develop\n    status: merged\n');
runGit(['add', 'status.yml']);
result = runCheck(['--staged', temp]);
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /重复 task id/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ task completion fixtures passed');
