import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { acquireSingleton, processFile, releaseOwnedLock, singletonLockPath } from './watcher.mjs';

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
