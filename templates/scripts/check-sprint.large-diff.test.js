#!/usr/bin/env node
'use strict';

const assert = require('assert');
const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { fixedDiffEvidence } = require('./check-sprint.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-large-diff-'));
const git = args => cp.execFileSync('git', args, {
  cwd: root, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  git(['init', '-q']);
  git(['config', 'user.name', 'Test']);
  git(['config', 'user.email', 'test@example.invalid']);
  git(['-c', 'commit.gpgsign=false', 'commit', '-qm', 'base', '--allow-empty']);
  const base = git(['rev-parse', 'HEAD']).toString().trim();
  // Incompressible binary evidence makes the actual Git diff exceed Node's default buffer.
  fs.writeFileSync(path.join(root, 'evidence.bin'), crypto.randomBytes(2 * 1024 * 1024));
  git(['add', 'evidence.bin']);
  git(['-c', 'commit.gpgsign=false', 'commit', '-qm', 'binary evidence']);
  const head = git(['rev-parse', 'HEAD']).toString().trim();
  const bytes = git(['diff', '--binary', base, head]);
  assert(bytes.length > 1024 * 1024);
  const actual = fixedDiffEvidence(root, base, head);
  assert.strictEqual(actual.hash, crypto.createHash('sha256').update(bytes).digest('hex'));
  assert.deepStrictEqual(actual.names, ['evidence.bin']);
  assert(!actual.error);

  const absent = fixedDiffEvidence(root, '0'.repeat(40), head);
  assert.strictEqual(typeof absent.error, 'string');
  assert(absent.error.trim());
  assert.strictEqual(absent.names, undefined);

  const original = cp.execFileSync;
  try {
    cp.execFileSync = (command, args, options) => {
      if (args[0] === 'diff') {
        assert.strictEqual(options.maxBuffer, 64 * 1024 * 1024);
        const error = new Error('spawnSync git ENOBUFS');
        error.stderr = Buffer.alloc(0);
        throw error;
      }
      return original(command, args, options);
    };
    const failed = fixedDiffEvidence(root, base, head);
    assert.strictEqual(failed.error, 'spawnSync git ENOBUFS');
    assert.strictEqual(failed.names, undefined);
  } finally {
    cp.execFileSync = original;
  }
  console.log('check-sprint large diff: complete binary hash/names, missing object and bounded failure passed');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
