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
write('iterations/v1/queue/demo-v1-001.md', '---\npackage-schema: 2\ntask-id: demo-v1-001\nfiles: [src/a.ts]\n---\n');
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
// 每次 check 都启动新进程；模拟摘要压缩后的恢复，不模拟模型内部 compaction。
for (let restart = 0; restart < 3; restart += 1) {
  write(progress, 'context-state:\n  task-set: [demo-v1-001, demo-v1-002]\n  phase: implementation\n  next-action: resume second task\n');
  assert.strictEqual(check(report, 'demo-v1-001,demo-v1-002').status, 0, '新进程按原始 Git/report 恢复 accepted 前缀');
  assert.strictEqual(fs.readFileSync(path.join(root, report),'utf8'),validReport,'恢复不重写已完成审查');
}

const evidenceDir = 'iterations/v1/code-reviews/demo-v1-001';
const baseRef = git(['rev-parse', 'HEAD']);
write(`${evidenceDir}/preflight.md`, `---\ntask_id: demo-v1-001\ntiming: before-code\nresult: pass\nbase_ref: ${baseRef}\nbase_tree: ${baseTree}\n---\n`);
const boundedFirst = validReport.replace('task_id:', `schema: develop-review-round/v2\nreview_policy: bounded-v1\nrisk: standard\nbase_ref: ${baseRef}\ntask_id:`)
  .replace('conclusion: pass', 'conclusion: evidence-needed')
  .replace('findings: []', 'findings:\n  - id: demo-v1-001-F001\n    severity: blocking\n    status: open\n    action: request-evidence');
write(report, boundedFirst);
write(`${evidenceDir}/run.log`, 'target passed, exit 0\n');
const evidenceFinal = `${evidenceDir}/round-02.md`;
write(evidenceFinal, `---
schema: develop-review-round/v2
review_policy: bounded-v1
task_id: demo-v1-001
round: 2
mode: targeted
risk: standard
base_ref: ${baseRef}
reviewed_base: ${reviewedHead}
reviewed_head: ${reviewedHead}
diff_sha256: ${crypto.createHash('sha256').update('').digest('hex')}
changed_files: []
prior_report: ${report}
target_finding_ids: [demo-v1-001-F001]
evidence_only: true
evidence_files: [${evidenceDir}/run.log]
escalate_to_full: false
conclusion: pass
---
## Findings
\`\`\`yaml
findings:
  - id: demo-v1-001-F001
    severity: blocking
    status: verified-closed
    action: request-evidence
\`\`\`
`);
const evidenceRestore = check(evidenceFinal, 'demo-v1-001');
assert.strictEqual(evidenceRestore.status, 0, `空增量末轮仍恢复全部 accepted 实现：${evidenceRestore.stdout}`);
write('src/a.ts', 'export const a = 999;\n');
assert.match(check(evidenceFinal, 'demo-v1-001').stdout, /二次未审修改/, '空增量报告不能隐藏未审实现变化');
write('src/a.ts', 'export const a = 2;\n');
write(report, boundedFirst.replace('action: request-evidence', 'action: fix-code'));
assert.match(check(evidenceFinal, 'demo-v1-001').stdout, /审查链无效/, '恢复也校验补证前提');
fs.unlinkSync(path.join(root, evidenceFinal));
fs.unlinkSync(path.join(root, `${evidenceDir}/run.log`));
write(`${evidenceDir}/preflight.md`, 'accepted audit\n');
write(report, validReport);

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
if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)
    || !path.basename(root).startsWith('hact-worktree-')) throw new Error('Invalid temporary fixture root');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint worktree 正反夹具通过');
