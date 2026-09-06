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
function check(subject, progressIds) {
  return childProcess.spawnSync(process.execPath,
    [script, '--worktree-from-reports', subject, root, ...(progressIds === undefined ? [] : ['--progress', progressIds])],
    { cwd: root, encoding: 'utf8' });
}

git(['init']);
git(['config', 'user.email', 'test@example.com']);
git(['config', 'user.name', 'Test']);
write('src/a.ts', 'export const a = 1;\n');
write('src/b.ts', 'export const b = 1;\n');
write('status.yml', 'tasks:\n  - id: demo-v1-001\n    status: taken-by\n  - id: demo-v1-002\n    status: taken-by\n');
git(['add', '.']);
git(['commit', '-m', 'base']);
assert.strictEqual(check('none').status, 0, '首任务干净工作树应通过');
const progress = '_meta/sessions/develop-demo-v1-001-progress.md';
write(progress, 'context-state:\n  phase: implementation\n');
assert.strictEqual(check('none').status, 1, '旧接口不能自动放行任意 progress');
assert.strictEqual(check('none', 'demo-v1-001').status, 0, '显式本轮任务的未暂存进度可在首任务前存在');
assert.strictEqual(check('none', 'demo-v1-002').status, 1, '另一任务授权不覆盖当前 progress');
assert.strictEqual(check('none', '../outside').status, 1, '拒绝路径穿越 task-id');
assert.strictEqual(check('none', 'unknown').status, 1, '拒绝 status.yml 外的 task-id');
assert.strictEqual(check('none', '').status, 2, '空 progress 参数必须是用法错误');
git(['add', progress]);
assert.strictEqual(check('none', 'demo-v1-001').status, 1, '进度不可暂存混入实现 tree');
git(['commit', '-m', 'fixture tracked progress']);
write(progress, 'context-state:\n  phase: review\n');
assert.strictEqual(check('none', 'demo-v1-001').status, 0, '已跟踪 progress 的未暂存更新同样允许');
const otherProgress = '_meta/sessions/develop-demo-v1-002-progress.md';
write(otherProgress, 'context-state:\n  phase: implementation\n');
assert.strictEqual(check('none', 'demo-v1-001').status, 1, '不得放行其他会话未列出的进度文件');
assert.strictEqual(check('none', 'demo-v1-001,demo-v1-002').status, 0, '显式本轮多任务 progress 可以共同恢复');
fs.unlinkSync(path.join(root, otherProgress));
fs.mkdirSync(path.join(root, otherProgress));
assert.strictEqual(check('none', 'demo-v1-001,demo-v1-002').status, 1, '伪装成 progress 路径的目录不得放行');
fs.rmdirSync(path.join(root, otherProgress));

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
assert.strictEqual(check(report, 'demo-v1-001').status, 0, '前序 accepted 源码、审计目录与本轮 progress 应在白名单');
const validReport = fs.readFileSync(path.join(root, report), 'utf8');
fs.writeFileSync(path.join(root, report), validReport.replace('conclusion: pass', 'conclusion: revise'));
assert.strictEqual(check(report, 'demo-v1-001').status, 1, '未通过的 final report 不得成为 accepted 白名单');
fs.writeFileSync(path.join(root, report), validReport);

write('src/a.ts', 'export const a = 999;\n');
assert.strictEqual(check(report, 'demo-v1-001').status, 1, 'accepted 同路径二次未审修改必须阻断');
write('src/a.ts', 'export const a = 2;\n');
write('src/b.ts', 'export const b = 2;\n');
assert.strictEqual(check(report, 'demo-v1-001').status, 1, '白名单外源码改动必须阻断下一任务');
git(['stash', 'push', '-m', 'fixture stash remains blocked']);
assert.strictEqual(check('none', 'demo-v1-001').status, 1, 'progress 参数不得绕过 stash 阻断');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint worktree 正反夹具通过');
