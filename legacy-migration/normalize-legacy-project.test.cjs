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

  // The normalizer compares raw Git blob bytes to the working file.  Exercise
  // the policy explicitly: leading blanks, LF, CRLF, and a missing terminal
  // newline are all preserved exactly rather than silently normalized.
  for (const [label, status] of [
    ['leading-blank-lf', '\n\ntasks:\n  - id: old-b-001\n    status: merged\n'],
    ['crlf', 'tasks:\r\n  - id: old-b-001\r\n    status: merged\r\n'],
    ['no-trailing-newline', 'tasks:\n  - id: old-b-001\n    status: merged'],
  ]) {
    const byteRoot = fs.mkdtempSync(path.join(os.tmpdir(), `hact-legacy-bytes-${label}-`));
    try {
      const bg = args => cp.execFileSync('git', ['-C', byteRoot, ...args], { encoding: 'utf8' }).trim();
      bg(['init']); bg(['config', 'user.name', 'Test']); bg(['config', 'user.email', 'test@example.com']); bg(['config', 'core.autocrlf', 'false']);
      fs.writeFileSync(path.join(byteRoot, 'status.yml'), status);
      bg(['add', 'status.yml']); bg(['commit', '-m', 'legacy bytes']);
      const base = bg(['rev-parse', 'HEAD']);
      normalize(byteRoot, base);
      assert.deepStrictEqual(verify(byteRoot), [], `${label}: identical raw bytes verify`);
      const snapshot = fs.readFileSync(path.join(byteRoot, SNAPSHOT));
      assert.deepStrictEqual(snapshot, Buffer.from(status), `${label}: snapshot preserves exact bytes`);
    } finally { fs.rmSync(byteRoot, { recursive: true, force: true }); }
  }

  // Use a real Git pre-commit failure, not an index simulation. The failed
  // commit must retain exactly the staged artifacts and resume may only commit
  // those bytes after the hook is removed.
  const hookRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-legacy-hook-resume-'));
  try {
    const hg = args => cp.execFileSync('git', ['-C', hookRoot, ...args], { encoding: 'utf8' }).trim();
    hg(['init']); hg(['config', 'user.name', 'Test']); hg(['config', 'user.email', 'test@example.com']);
    fs.writeFileSync(path.join(hookRoot, 'status.yml'), 'tasks: []\n'); hg(['add', 'status.yml']); hg(['commit', '-m', 'legacy']);
    const base = hg(['rev-parse', 'HEAD']);
    const hook = path.join(hookRoot, '.git', 'hooks', 'pre-commit');
    fs.writeFileSync(hook, '#!/bin/sh\necho intentional-normalizer-hook-failure >&2\nexit 1\n');
    try { normalize(hookRoot, base); assert.fail('failing hook must interrupt normalization commit'); }
    catch (error) { assert.match(String(error.stderr || error.message), /intentional-normalizer-hook-failure/); }
    assert.deepStrictEqual(hg(['diff', '--cached', '--name-only']).split(/\r?\n/).sort(), [MARKER, SNAPSHOT].sort(), 'hook failure preserves only real staged artifacts');
    fs.unlinkSync(hook);
    resume(hookRoot, base);
    assert.deepStrictEqual(verify(hookRoot), [], 'real hook interruption resumes without source swap');
  } finally { fs.rmSync(hookRoot, { recursive: true, force: true }); }
  console.log('✅ legacy normalization: truth freeze, admission refusal and tamper detection passed');
} finally {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('unsafe temp cleanup');
  fs.rmSync(root, { recursive: true, force: true });
}
