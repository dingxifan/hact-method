#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-wave-split-'));
const prefixWt = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-wave-prefix-'));
function git(args, cwd = root) { return childProcess.execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
function write(cwd, rel, text) { const file = path.join(cwd, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
const wave = 'backend-wave-v1-A/B/C';
const individualB = 'B';
const checkSprint = path.join(__dirname, 'check-sprint.js');
const splitStatus = `tasks:
  - id: A
    status: done
    assigned_to: alice
    branch: ${wave}-prefix
  - id: B
    status: taken-by
    assigned_to: alice
    branch: ${individualB}
  - id: C
    status: 可取
    assigned_to: null
    branch: null
`;

try {
  git(['init']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
  write(root, 'iterations/v1/queue/A.md', `---
package-schema: 2
task-id: A
module: core
task_type: dev-backend
layers: [backend]
source: sprint
risk: standard
relevant-standards: []
files: [src/a.ts]
---
`);
  write(root, 'status.yml', `tasks:\n  - id: A\n    status: taken-by\n    assigned_to: alice\n    branch: ${wave}\n  - id: B\n    status: taken-by\n    assigned_to: alice\n    branch: ${wave}\n  - id: C\n    status: taken-by\n    assigned_to: alice\n    branch: ${wave}\n`);
  git(['add', '.']); git(['commit', '-m', 'recognize wave']); git(['checkout', '-b', wave]);
  const baseRef = git(['rev-parse', 'HEAD']);
  const baseTree = git(['write-tree']);
  write(root, 'src/a.ts', 'export const a = 1;\n');
  write(root, 'iterations/v1/code-reviews/A/preflight.md', `---
task_id: A
source: sprint
timing: before-code
started_at: 2026-09-04T00:00:00Z
completed_at: 2026-09-04T00:01:00Z
base_ref: ${baseRef}
base_tree: ${baseTree}
result: pass
---
`);
  git(['add', 'src/a.ts']);
  const reviewedHead = git(['write-tree']);
  const diff = childProcess.execFileSync('git', ['diff', '--binary', baseTree, reviewedHead], { cwd: root });
  const diffHash = crypto.createHash('sha256').update(diff).digest('hex');
  write(root, 'iterations/v1/code-reviews/A/round-01.md', `---
schema: develop-review-round/v2
task_id: A
round: 1
mode: full
risk: standard
prior_report: null
target_finding_ids: []
base_ref: ${baseRef}
reviewed_base: ${baseTree}
reviewed_head: ${reviewedHead}
diff_sha256: ${diffHash}
changed_files: [src/a.ts]
standards_checked: []
started_at: 2026-09-04T00:01:00Z
completed_at: 2026-09-04T00:02:00Z
escalate_to_full: false
conclusion: pass
---
findings: []
`);
  git(['add', 'src/a.ts', 'iterations/v1/code-reviews/A']);
  git(['commit', '-m', 'feat(A): accepted implementation and evidence']);
  const acceptedA = git(['rev-parse', 'HEAD']);
  write(root, 'src/b.ts', 'export const bSensitive = true;\n');

  git(['branch', `${wave}-prefix`, acceptedA]);
  git(['worktree', 'add', prefixWt, `${wave}-prefix`]);
  assert.ok(fs.existsSync(path.join(prefixWt, 'iterations/v1/code-reviews/A/round-01.md')), 'prefix worktree 必须带 A 审计物');
  const chain = childProcess.spawnSync(process.execPath, [checkSprint, '--review-chain', 'A', prefixWt], { cwd: prefixWt, encoding: 'utf8' });
  assert.strictEqual(chain.status, 0, `${chain.stdout}\n${chain.stderr}`);
  write(prefixWt, 'status.yml', splitStatus);
  git(['add', 'status.yml'], prefixWt); git(['commit', '-m', 'chore: split wave state'], prefixWt);
  const prefixStatus = fs.readFileSync(path.join(prefixWt, 'status.yml'), 'utf8');
  assert.match(prefixStatus, /id: C[\s\S]*status: 可取[\s\S]*assigned_to: null[\s\S]*branch: null/);

  git(['switch', '-c', individualB]);
  write(root, 'status.yml', splitStatus);
  assert.ok(fs.existsSync(path.join(root, 'src/b.ts')), 'split 不得删除/还原 B 在制品');
  assert.strictEqual(git(['stash', 'list']), '', 'split 不得使用 stash');
  assert.match(fs.readFileSync(path.join(root, 'status.yml'), 'utf8'), /id: B[\s\S]*status: taken-by[\s\S]*branch: B/);
  assert.strictEqual(git(['symbolic-ref', '--short', 'HEAD']), individualB, 'dirty B 必须真实切到 individual branch');
  assert.ok(git(['rev-parse', '--verify', `refs/heads/${individualB}`]), 'B branch 必须可解析');
  console.log('✅ wave split transaction 真实 Git/worktree 夹具通过');
} finally {
  try { git(['worktree', 'remove', '--force', prefixWt]); } catch {}
  fs.rmSync(prefixWt, { recursive: true, force: true });
  fs.rmSync(root, { recursive: true, force: true });
}
