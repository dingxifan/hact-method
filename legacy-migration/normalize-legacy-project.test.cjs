#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { MARKER, SNAPSHOT, normalize, verify } = require('./normalize-legacy-project.cjs');
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
  fs.appendFileSync(path.join(root, SNAPSHOT), '# tamper\n');
  assert.ok(verify(root).some(error => /hash 不一致|未冻结/.test(error)), 'changed historical evidence cannot pass admission');
  console.log('✅ legacy normalization: truth freeze, admission refusal and tamper detection passed');
} finally {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('unsafe temp cleanup');
  fs.rmSync(root, { recursive: true, force: true });
}
