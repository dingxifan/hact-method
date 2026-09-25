#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const checker = path.resolve(__dirname, 'check-task-completion.js');
const makeRepo = prefix => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const git = args => childProcess.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  const write = (relative, content) => { const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); };
  const check = args => childProcess.spawnSync(process.execPath, [checker, ...args], { cwd: root, encoding: 'utf8' });
  git(['init', '-q']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
  return { root, git, write, check };
};
const artifactHash = (repo, commit, artifact) => crypto.createHash('sha256')
  .update(childProcess.execFileSync('git', ['show', `${commit}:${artifact}`], { cwd: repo.root })).digest('hex');
const report = ({ id, iteration, round, type, prior = 'null', candidate, tree, artifact, targets = [], opened = [], closed = [], remaining = [], conclusion }) => `---
schema: hact-document-review/v1
task_id: ${id}
task_type: draft-tech-design
round: ${round}
review_type: ${type}
reviewer_isolation: fresh-isolated
prior_report: ${prior}
candidate_commit: ${candidate}
candidate_tree: ${tree}
artifact_path: iterations/${iteration}/trd.md
artifact_sha256: ${artifact}
target_finding_ids: [${targets.join(', ')}]
blocking_finding_ids: [${opened.join(', ')}]
closed_finding_ids: [${closed.join(', ')}]
open_blocking_finding_ids: [${remaining.join(', ')}]
conclusion: ${conclusion}
---
`;

const repo = makeRepo('hact-task-completion-');
const id = 'mail-v11-trd', iteration = 'v11', artifactPath = 'iterations/v11/trd.md';
repo.write('status.yml', `tasks:\n  - id: ${id}\n    iteration: ${iteration}\n    type: draft-tech-design\n    status: taken-by\n`);
repo.write(artifactPath, '# TRD\n');
repo.git(['add', '.']); repo.git(['commit', '-qm', 'candidate']);
const candidate = repo.git(['rev-parse', 'HEAD']);
const tree = repo.git(['rev-parse', 'HEAD^{tree}']);
const artifact = artifactHash(repo, candidate, artifactPath);
const reviewPath = `iterations/${iteration}/document-reviews/${id}/round-01.md`;
repo.write(reviewPath, report({ id, iteration, round: 1, type: 'initial', candidate, tree, artifact, conclusion: 'pass' }));
repo.git(['add', reviewPath]); repo.git(['commit', '-qm', 'review']);
const reviewCommit = repo.git(['rev-parse', 'HEAD']);
const mergedStatus = `tasks:
  - id: ${id}
    iteration: ${iteration}
    type: draft-tech-design
    status: merged
    document_review_commit: ${reviewCommit}
    latest_document_review: ${reviewPath}
`;
repo.write('status.yml', mergedStatus); repo.git(['add', 'status.yml']);
let result = repo.check(['--staged', repo.root]);
assert.strictEqual(result.status, 0, result.stdout + result.stderr);

repo.write(reviewPath, fs.readFileSync(path.join(repo.root, reviewPath), 'utf8') + 'mutable\n');
result = repo.check(['--staged', repo.root]);
assert.notStrictEqual(result.status, 0); assert.match(result.stdout, /未暂存变化/);
repo.git(['checkout', '--', reviewPath]);

repo.write(reviewPath, fs.readFileSync(path.join(repo.root, reviewPath), 'utf8') + 'staged rewrite\n'); repo.git(['add', reviewPath]);
result = repo.check(['--staged', repo.root]);
assert.notStrictEqual(result.status, 0); assert.match(result.stdout, /不得同时修改 document review/);
repo.git(['reset', 'HEAD', '--', reviewPath]); repo.git(['checkout', '--', reviewPath]);

repo.git(['reset', '--hard', reviewCommit]);
repo.write(reviewPath, fs.readFileSync(path.join(repo.root, reviewPath), 'utf8') + 'later rewrite\n');
repo.git(['add', reviewPath]); repo.git(['commit', '-qm', 'later path rewrite']);
repo.write('status.yml', mergedStatus); repo.git(['add', 'status.yml']);
result = repo.check(['--staged', repo.root]);
assert.strictEqual(result.status, 0, 'fixed review_commit must ignore later path rewrite\n' + result.stdout + result.stderr);

repo.git(['reset', '--hard', reviewCommit]);
repo.write(artifactPath, '# unreviewed TRD\n'); repo.git(['add', artifactPath]); repo.git(['commit', '-qm', 'unreviewed trd']);
repo.write('status.yml', mergedStatus); repo.git(['add', 'status.yml']);
result = repo.check(['--staged', repo.root]);
assert.notStrictEqual(result.status, 0); assert.match(result.stdout, /当前接受的 TRD 与 final reviewed candidate artifact 不一致/);

repo.write('status.yml', 'tasks:\n  - id: repeated\n    iteration: v11\n    type: draft-tech-design\n    status: merged\n  - id: repeated\n    iteration: v10\n    type: develop\n    status: merged\n');
repo.git(['add', 'status.yml']); result = repo.check(['--staged', repo.root]);
assert.notStrictEqual(result.status, 0); assert.match(result.stdout, /重复 task id/);

const closure = makeRepo('hact-task-closure-');
const id2 = 'mail-v12-trd', iteration2 = 'v12', artifactPath2 = 'iterations/v12/trd.md';
closure.write('status.yml', `tasks:\n  - id: ${id2}\n    iteration: ${iteration2}\n    type: draft-tech-design\n    status: done\n`);
closure.write(artifactPath2, '# TRD v12\n'); closure.git(['add', '.']); closure.git(['commit', '-qm', 'candidate']);
const candidate2 = closure.git(['rev-parse', 'HEAD']), tree2 = closure.git(['rev-parse', 'HEAD^{tree}']);
const artifact2 = artifactHash(closure, candidate2, artifactPath2);
const dir2 = `iterations/${iteration2}/document-reviews/${id2}`;
closure.write(`${dir2}/round-01.md`, report({ id: id2, iteration: iteration2, round: 1, type: 'initial', candidate: candidate2, tree: tree2, artifact: artifact2,
  opened: [`${id2}-F001`], remaining: [`${id2}-F001`], conclusion: 'revise' }));
closure.git(['add', '.']); closure.git(['commit', '-qm', 'first review']);
closure.write(`${dir2}/round-02.md`, report({ id: id2, iteration: iteration2, round: 2, type: 'targeted', prior: `${dir2}/round-01.md`,
  candidate: candidate2, tree: tree2, artifact: artifact2, targets: [`${id2}-F001`], closed: [`${id2}-F001`], conclusion: 'pass' }));
closure.git(['add', '.']); closure.git(['commit', '-qm', 'invalid closure review']);
const closureReviewCommit = closure.git(['rev-parse', 'HEAD']);
closure.write('status.yml', `tasks:
  - id: ${id2}
    iteration: ${iteration2}
    type: draft-tech-design
    status: done
    document_review_commit: ${closureReviewCommit}
    latest_document_review: ${dir2}/round-02.md
`);
result = closure.check(['--task', id2, closure.root]);
assert.notStrictEqual(result.status, 0); assert.match(result.stdout, /必须绑定新的 fixed candidate/);

for (const root of [repo.root, closure.root]) {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
  fs.rmSync(root, { recursive: true, force: true });
}
console.log('✅ task completion immutable-pointer fixtures passed');
