import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { acquireJobLock, acquireSingleton, commitTrailers, processFile, releaseOwnedLock, singletonLockPath } from './watcher.mjs';

function temporaryRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'hact-watcher-test-'));
}
function packet(jobId) {
  return {
    schema: 'hact.publish.v1', job_id: jobId, repo: 'hact-method', base_branch: 'main',
    base_sha: 'a'.repeat(40), target_branch: `hact/chat/${jobId}`, task: 'test', commit_message: 'test: watcher lock',
    files: [{ path: 'reports/_poc/lock.md', content: 'lock test\n' }],
  };
}
function config(root) {
  return { repos_root: path.join(root, 'repos'), repos: { 'hact-method': { git_url: 'https://github.com/dingxifan/hact-method.git', base_branch: 'main', allowed_branch_prefix: 'hact/chat/', allowed_paths: ['reports/_poc/**'], checks: [] } } };
}
function git(cwd, args) { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }

test('singleton rejects a live instance and recovers a stale lock', () => {
  const dropboxRoot = path.join(temporaryRoot(), 'HACT');
  const first = acquireSingleton(dropboxRoot);
  assert.throws(() => acquireSingleton(dropboxRoot), /already running/);
  releaseOwnedLock(first.lockPath, first.owner);

  const stalePath = singletonLockPath(dropboxRoot);
  fs.mkdirSync(path.dirname(stalePath), { recursive: true });
  fs.writeFileSync(stalePath, JSON.stringify({ pid: 99999999, host: os.hostname(), owner: 'dead' }));
  const recovered = acquireSingleton(dropboxRoot);
  assert.notEqual(recovered.owner, 'dead');
  releaseOwnedLock(recovered.lockPath, recovered.owner);
});

test('a losing processing-job invocation preserves the winner lock and does not execute', () => {
  const root = temporaryRoot();
  const paths = Object.fromEntries(['inbox', 'processing', 'results', 'done', 'failed'].map(name => [name, path.join(root, name)]));
  Object.values(paths).forEach(directory => fs.mkdirSync(directory, { recursive: true }));
  const jobId = `race-${randomUUID()}`;
  const jobFile = path.join(paths.processing, `${jobId}.publish.json`);
  fs.writeFileSync(jobFile, JSON.stringify(packet(jobId)));
  const lockFile = path.join(paths.processing, `.${jobId}.lock`);
  const winner = JSON.stringify({ owner: 'watcher-one', pid: process.pid });
  fs.writeFileSync(lockFile, winner);

  processFile(jobFile, config(root), paths, true);

  assert.equal(fs.readFileSync(lockFile, 'utf8'), winner);
  assert.ok(fs.existsSync(jobFile));
  assert.equal(fs.existsSync(path.join(config(root).repos_root, 'hact-method')), false);
  assert.equal(fs.readdirSync(paths.results).length, 0);
});

test('request hashes differ when raw publish content differs', () => {
  const one = Buffer.from(JSON.stringify(packet('hash-one')));
  const two = Buffer.from(JSON.stringify({ ...packet('hash-one'), task: 'different bytes' }));
  assert.notEqual(createHash('sha256').update(one).digest('hex'), createHash('sha256').update(two).digest('hex'));
});

test('a stale local processing-job lock is recovered after a crash', () => {
  const root = temporaryRoot(); const lockFile = path.join(root, '.crashed.lock');
  fs.writeFileSync(lockFile, JSON.stringify({ host: os.hostname(), pid: 99999999, owner: 'dead' }));
  const acquired = acquireJobLock(lockFile);
  assert.ok(acquired);
  assert.notEqual(acquired.owner, 'dead');
  releaseOwnedLock(lockFile, acquired.owner);
});

test('recovery trailers require one exact job and request hash', () => {
  const trailers = commitTrailers('hact: publish\n\nHACT-Job-ID: job-1\nHACT-Request-SHA256: abc123');
  assert.equal(trailers.get('HACT-Job-ID'), 'job-1');
  assert.equal(trailers.get('HACT-Request-SHA256'), 'abc123');
  assert.equal(commitTrailers('HACT-Job-ID: one\nHACT-Job-ID: two').get('HACT-Job-ID'), null);
});

test('a remote branch with matching trailers reconstructs a missing success result', () => {
  const root = temporaryRoot(); const remote = path.join(root, 'remote.git'); const writer = path.join(root, 'writer');
  execFileSync('git', ['init', '--bare', remote]); execFileSync('git', ['init', '-b', 'main', writer]);
  git(writer, ['config', 'user.name', 'HACT test']); git(writer, ['config', 'user.email', 'hact-test@example.invalid']);
  fs.writeFileSync(path.join(writer, 'README.md'), 'base\n'); git(writer, ['add', 'README.md']); git(writer, ['commit', '-m', 'base']); git(writer, ['remote', 'add', 'origin', remote]); git(writer, ['push', '-u', 'origin', 'main']);
  const baseSha = git(writer, ['rev-parse', 'HEAD']); const jobId = `recovery-${randomUUID()}`; const targetBranch = `hact/chat/${jobId}`;
  const job = { ...packet(jobId), base_sha: baseSha, target_branch: targetBranch };
  const raw = Buffer.from(`${JSON.stringify(job)}\n`); const requestSha256 = createHash('sha256').update(raw).digest('hex');
  git(writer, ['checkout', '-b', targetBranch]); fs.mkdirSync(path.join(writer, 'reports', '_poc'), { recursive: true }); fs.writeFileSync(path.join(writer, 'reports', '_poc', 'recovered.md'), 'already pushed\n');
  git(writer, ['add', 'reports/_poc/recovered.md']); git(writer, ['commit', '-m', 'hact: simulated crash', '-m', `HACT-Job-ID: ${jobId}\nHACT-Request-SHA256: ${requestSha256}`]); const pushedSha = git(writer, ['rev-parse', 'HEAD']); git(writer, ['push', '-u', 'origin', targetBranch]);
  git(writer, ['checkout', 'main']); fs.writeFileSync(path.join(writer, 'README.md'), 'base advanced after push\n'); git(writer, ['add', 'README.md']); git(writer, ['commit', '-m', 'advance main']); git(writer, ['push', 'origin', 'main']);

  const paths = Object.fromEntries(['inbox', 'processing', 'results', 'done', 'failed'].map(name => [name, path.join(root, 'HACT', name)])); Object.values(paths).forEach(directory => fs.mkdirSync(directory, { recursive: true }));
  const jobFile = path.join(paths.processing, `${jobId}.publish.json`); fs.writeFileSync(jobFile, raw);
  const watcherConfig = config(root); watcherConfig.repos['hact-method'].git_url = remote;
  processFile(jobFile, watcherConfig, paths, true);

  const result = JSON.parse(fs.readFileSync(path.join(paths.results, `${jobId}.result.json`), 'utf8'));
  assert.equal(result.status, 'success'); assert.equal(result.recovered, true); assert.equal(result.commit_sha, pushedSha); assert.deepEqual(result.changed_files, ['reports/_poc/recovered.md']);
  assert.ok(fs.existsSync(path.join(paths.done, `${jobId}.publish.json`)));
});
