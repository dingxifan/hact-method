#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-worktree-'));
const script = path.join(__dirname, 'check-sprint.js');
function git(args) { return childProcess.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
function write(relative, source) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
function check(subject) {
  return childProcess.spawnSync(process.execPath,
    [script, '--worktree-from-reports', subject, root], { cwd: root, encoding: 'utf8' });
}

git(['init']);
git(['config', 'user.email', 'test@example.com']);
git(['config', 'user.name', 'Test']);
write('src/a.ts', 'export const a = 1;\n');
write('src/b.ts', 'export const b = 1;\n');
git(['add', '.']);
git(['commit', '-m', 'base']);
assert.strictEqual(check('none').status, 0, '首任务干净工作树应通过');

write('src/a.ts', 'export const a = 2;\n');
git(['add', 'src/a.ts']);
const baseTree = git(['rev-parse', 'HEAD^{tree}']);
const reviewedHead = git(['write-tree']);
const diffHash = crypto.createHash('sha256')
  .update(childProcess.execFileSync('git', ['diff', '--binary', baseTree, reviewedHead], { cwd: root }))
  .digest('hex');
const report = 'iterations/v1/code-reviews/demo-v1-001/round-01.md';
write(report, `---
task_id: demo-v1-001
round: 1
mode: full
reviewed_base: ${baseTree}
reviewed_head: ${reviewedHead}
diff_sha256: ${diffHash}
changed_files:
  - src/a.ts
escalate_to_full: false
conclusion: pass
---
## Findings
\`\`\`yaml
findings: []
\`\`\`
`);
write('iterations/v1/code-reviews/demo-v1-001/preflight.md', 'accepted audit\n');
assert.strictEqual(check(report).status, 0, '前序 accepted 源码与未暂存审计目录应在白名单');
const validReport = fs.readFileSync(path.join(root, report), 'utf8');
fs.writeFileSync(path.join(root, report), validReport.replace('conclusion: pass', 'conclusion: revise'));
assert.strictEqual(check(report).status, 1, '未通过的 final report 不得成为 accepted 白名单');
fs.writeFileSync(path.join(root, report), validReport);

write('src/a.ts', 'export const a = 999;\n');
assert.strictEqual(check(report).status, 1, 'accepted 同路径二次未审修改必须阻断');
write('src/a.ts', 'export const a = 2;\n');
write('src/b.ts', 'export const b = 2;\n');
assert.strictEqual(check(report).status, 1, '白名单外源码改动必须阻断下一任务');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint worktree 正反夹具通过');
