import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { atomicallyQueue, createAdapter, validatePayload } from './adapter.mjs';

function root() { return fs.mkdtempSync(path.join(os.tmpdir(), 'hact-adapter-test-')); }
function payload(jobId = 'adapter-test-001') {
  return { schema: 'hact.publish.v1', job_id: jobId, repo: 'hact-method', base_branch: 'main', base_sha: 'a'.repeat(40), target_branch: `hact/chat/${jobId}`, task: 'test', commit_message: 'test: adapter', files: [{ path: 'reports/_poc/adapter.md', content: 'test\n' }] };
}

test('queues exact publish bytes atomically and recognizes the same packet', () => {
  const dropboxRoot = root(); const raw = Buffer.from(`${JSON.stringify(payload())}\n`);
  assert.deepEqual(atomicallyQueue(dropboxRoot, 'adapter-test-001', raw), { state: 'queued', location: 'inbox' });
  assert.deepEqual(fs.readFileSync(path.join(dropboxRoot, 'inbox', 'adapter-test-001.publish.json')), raw);
  assert.deepEqual(atomicallyQueue(dropboxRoot, 'adapter-test-001', raw), { state: 'same', location: 'inbox' });
});

test('rejects same job_id with different bytes without replacing the queued packet', () => {
  const dropboxRoot = root(); const one = Buffer.from(JSON.stringify(payload())); const two = Buffer.from(JSON.stringify({ ...payload(), task: 'different' }));
  atomicallyQueue(dropboxRoot, 'adapter-test-001', one);
  assert.deepEqual(atomicallyQueue(dropboxRoot, 'adapter-test-001', two), { state: 'collision', location: 'inbox' });
  assert.deepEqual(fs.readFileSync(path.join(dropboxRoot, 'inbox', 'adapter-test-001.publish.json')), one);
});

test('requires a new job_id after the Watcher has written a result', () => {
  const dropboxRoot = root(); const raw = Buffer.from(JSON.stringify(payload())); const resultDir = path.join(dropboxRoot, 'results'); fs.mkdirSync(resultDir, { recursive: true });
  fs.writeFileSync(path.join(resultDir, 'adapter-test-001.result.json'), '{}');
  assert.deepEqual(atomicallyQueue(dropboxRoot, 'adapter-test-001', raw), { state: 'completed', location: 'results' });
});

test('requires the complete v1 shape needed by the Watcher', () => {
  assert.equal(validatePayload(payload()).job_id, 'adapter-test-001');
  assert.throws(() => validatePayload({ schema: 'hact.publish.v1', job_id: 'missing-fields' }), /invalid repo/);
  assert.throws(() => validatePayload({ ...payload(), base_sha: 'short' }), /base_sha/);
});

test('loopback POST requires a token and queues the unmodified request body', async () => {
  const dropboxRoot = root(); const token = 'local-test-token-0123456789'; const server = createAdapter({ dropbox_root: dropboxRoot, token });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address(); const body = `${JSON.stringify(payload('http-test-001'))}\n`; const url = `http://127.0.0.1:${port}/publish`;
    const denied = await fetch(url, { method: 'POST', body }); assert.equal(denied.status, 401);
    const accepted = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body });
    assert.equal(accepted.status, 202); assert.equal((await accepted.json()).status, 'queued');
    assert.equal(fs.readFileSync(path.join(dropboxRoot, 'inbox', 'http-test-001.publish.json'), 'utf8'), body);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
