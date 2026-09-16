#!/usr/bin/env node
'use strict';
// Read-only: produce mechanical fields for a fixed review snapshot, never a verdict.
const cp = require('child_process');
const crypto = require('crypto');
const path = require('path');
const [base, head, root = '.'] = process.argv.slice(2);
if (!base || !head || process.argv.length > 5) {
  console.error('Usage: node build-review-anchor.js <base> <head> [root]');
  process.exit(2);
}
try {
  const git = args => cp.execFileSync('git', args, { cwd: path.resolve(root), stdio: ['ignore', 'pipe', 'pipe'] });
  const resolve = ref => git(['rev-parse', '--verify', '--end-of-options', `${ref}^{tree}`]).toString('utf8').trim();
  const b = resolve(base), h = resolve(head);
  const diff = git(['diff', '--binary', b, h]);
  const names = git(['diff', '--name-only', '-z', b, h]).toString('utf8').split('\0').filter(Boolean).sort();
  process.stdout.write(`reviewed_base: ${b}\nreviewed_head: ${h}\ndiff_sha256: ${crypto.createHash('sha256').update(diff).digest('hex')}\n`);
  process.stdout.write(names.length ? `changed_files:\n${names.map(n => `  - ${JSON.stringify(n)}`).join('\n')}\n` : 'changed_files: []\n');
} catch (error) {
  console.error(String(error.stderr || error.message).trim());
  process.exit(1);
}
