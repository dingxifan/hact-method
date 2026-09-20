#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { MARKER, SNAPSHOT, normalize, verify, resume } = require('./normalize-legacy-project.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-legacy-normalization-'));
const git = args => cp.execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
try {
  git(['init']); git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(root, 'status.yml'), 'tasks:\n  - id: old-b-001\n    status: merged\n  - id: open-b-002\n    status: taken-by\n');
  git(['add', 'status.yml']); git(['commit', '-m', 'legacy truth']);
  const sourceBase = git(['rev-parse', 'HEAD']);
  assert.ok(verify(root).some(error => /缺 vNext normalization marker/.test(error)), 'unnormalized legacy project cannot enter vNext');
  const result = normalize(root, sourceBase);
  assert.ok(/^[a-f0-9]{40}$/.test(result.commit));
  assert.deepStrictEqual(result.marker.historical_merged_task_ids, ['old-b-001']);
  assert.deepStrictEqual(verify(root), [], 'normalization freezes a verifiable baseline');
  assert.strictEqual(fs.readFileSync(path.join(root, SNAPSHOT), 'utf8'), fs.readFileSync(path.join(root, 'status.yml'), 'utf8'), 'historical truth is copied, not rewritten');
  const marker = JSON.parse(fs.readFileSync(path.join(root, MARKER), 'utf8'));
  assert.strictEqual(marker.source_base, sourceBase);
  assert.strictEqual(marker.source_status_blob, git(['rev-parse', `${sourceBase}:status.yml`]));
  fs.writeFileSync(path.join(root, 'status.yml'), 'tasks:\n  - id: forged-b-001\n    status: merged\n');
  assert.throws(() => normalize(root, sourceBase), /干净工作树|不一致/, 'malformed replacement cannot be admitted as legacy truth');
  git(['checkout', '--', 'status.yml']);
  fs.appendFileSync(path.join(root, SNAPSHOT), '# tamper\n');
  assert.ok(verify(root).some(error => /hash 不一致|未冻结/.test(error)), 'changed historical evidence cannot pass admission');
  const forged = JSON.parse(fs.readFileSync(path.join(root, MARKER), 'utf8'));
  const forgedSnapshot = 'tasks:\n  - id: invented-b-001\n    status: merged\n';
  forged.historical_status_sha256 = require('crypto').createHash('sha256').update(forgedSnapshot).digest('hex');
  forged.historical_merged_task_ids = ['invented-b-001'];
  fs.writeFileSync(path.join(root, SNAPSHOT), forgedSnapshot);
  fs.writeFileSync(path.join(root, MARKER), JSON.stringify(forged, null, 2) + '\n');
  git(['add', MARKER, SNAPSHOT]); git(['commit', '-m', 'attempt rewrite historical truth']);
  assert.ok(verify(root).some(error => /source_base Git truth/.test(error)), 'joint snapshot/hash/inventory rewrite cannot redefine history');

  // A hook interruption keeps exactly the staged artifacts; resume neither
  // resets the index nor chooses a different source.
  const resumeRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-legacy-resume-'));
  try {
    const rg = args => cp.execFileSync('git', ['-C', resumeRoot, ...args], { encoding: 'utf8' }).trim();
    rg(['init']); rg(['config', 'user.name', 'Test']); rg(['config', 'user.email', 'test@example.com']);
    fs.writeFileSync(path.join(resumeRoot, 'status.yml'), 'tasks: []\n'); rg(['add', 'status.yml']); rg(['commit', '-m', 'legacy']);
    const base = rg(['rev-parse', 'HEAD']);
    // Simulate the post-hook-failure index without invoking a bypass.
    const stagedMarker = JSON.stringify({ schema: 2, kind: 'legacy-normalization', source_base: base,
      historical_status_sha256: require('crypto').createHash('sha256').update('tasks: []\n').digest('hex'),
      source_status_blob: rg(['rev-parse', `${base}:status.yml`]), historical_merged_task_ids: [] }, null, 2) + '\n';
    fs.mkdirSync(path.join(resumeRoot, '_meta/hact-vnext-normalization'), { recursive: true });
    fs.writeFileSync(path.join(resumeRoot, MARKER), stagedMarker);
    fs.writeFileSync(path.join(resumeRoot, SNAPSHOT), 'tasks: []\n');
    rg(['add', MARKER, SNAPSHOT]);
    const resumed = resume(resumeRoot, base);
    assert.ok(/^[a-f0-9]{40}$/.test(resumed.commit));
    assert.deepStrictEqual(verify(resumeRoot), []);
  } finally { fs.rmSync(resumeRoot, { recursive: true, force: true }); }
  console.log('✅ legacy normalization: truth freeze, admission refusal and tamper detection passed');
} finally {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('unsafe temp cleanup');
  fs.rmSync(root, { recursive: true, force: true });
}
