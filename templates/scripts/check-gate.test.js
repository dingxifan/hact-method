'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { parseGates, parseTasksSource } = require('./check-gate.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-gate-'));
const checker = path.join(__dirname, 'check-gate.js');
const write = (file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const run = (...args) => cp.spawnSync(process.execPath, [checker, ...args], { cwd: root, encoding: 'utf8' });
const state = (signed = 4, tasks = 'tasks: []\n', version = 'v1') =>
  'iterations:\n  ' + version + ':\n    gates:\n' + [1, 2, 3, 4, 5].map(n =>
    '      G' + n + ': { signed: ' + (n <= signed) + ', date: ' + (n <= signed ? '2026-09-08' : 'null') + ' }\n').join('') + tasks;
try {
  assert.strictEqual(parseGates(state()).get('v1:G4').signed, true);
  assert.strictEqual(parseGates(state()).get('v1:G5').signed, false);
  assert.strictEqual(parseGates('iterations:\n  v0:\n    gates:\n      G2:\n        signed: true\n        date: 2026-09-08\n').get('v0:G2').signed, true);
  assert.throws(() => parseGates(state().replace('signed: true', 'signed: yes')), /signed\/date/);
  assert.deepStrictEqual(parseTasksSource('tasks: []\n# old example\n# - id: ignored\n'), []);
  assert.strictEqual(parseTasksSource('not_tasks: []\n'), null);
  git(['init']); git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.com']);
  write('status.yml', state());
  write('project.md', '# 项目\n本期待部署，v2 开发中\n');
  write('feedback.md', '# 反馈\n- 保留的已处理经验和后续建议，不清空\n');
  write('iterations/v1/acceptance-report.md', '## 验收结论\n通过\n');
  write('iterations/v1/gates.md', '- [x] G5 旧副本（与真实状态冲突）\n');
  git(['add', '.']); git(['commit', '-m', 'base']);
  assert.strictEqual(run('G5', 'v1').status, 0, '反馈非空/其他迭代开发中不阻断');
  const pending = 'tasks:\n  - id: fix-doc\n    iteration: v1\n    type: revise-doc\n    status: taken-by\n';
  write('status.yml', state(4, pending));
  assert.strictEqual(run('G5', 'v1').status, 1, '本期 revise-doc 未完成仍阻断');
  write('status.yml', state(4, pending.replace('iteration: v1', 'iteration: v2')));
  assert.strictEqual(run('G5', 'v1').status, 0, '不阻断其他迭代');
  write('status.yml', state(4, pending.replace('type: revise-doc', 'source: manual-test')));
  assert.strictEqual(run('G4', 'v1').status, 1, '验收修复未合并仍阻断');
  write('status.yml', state());
  write('iterations/v1/acceptance-report.md', '## 验收结论\n未通过\n');
  assert.strictEqual(run('G4', 'v1').status, 1, '验收不通过仍阻断');
  write('iterations/v1/acceptance-report.md', '## 验收结论\n通过\n');
  write('status.yml', state(4));
  const missingSystemTask = run('G4', 'v1');
  assert.strictEqual(missingSystemTask.status, 1, '采用 Review Architecture 后缺 integration-verify task 必须阻断 G4');
  assert.match(missingSystemTask.stdout + missingSystemTask.stderr, /System Verification|integration-verify/);
  write('status.yml', state(4, `tasks:
  - id: demo-v1-integration-verify
    iteration: v1
    source: null
    type: integration-verify
    status: merged
    latest_system_review: iterations/v1/system-review/review-001.md
    integration_result: integration-tests/result-v1.md
    final_candidate: ${'a'.repeat(40)}
`));
  const missingSystemEvidence = run('G4', 'v1');
  assert.strictEqual(missingSystemEvidence.status, 1, '只有 merged 标记、没有 System Review evidence 仍阻断 G4');
  assert.match(missingSystemEvidence.stdout + missingSystemEvidence.stderr, /System Verification|system review/i);
  write('status.yml', state(5)); git(['add', 'status.yml']);
  assert.strictEqual(run('--staged').status, 1, '当前 Method 不允许移除 integration-verify / System Review 后签 G5');
  write('status.yml', state(5, pending)); git(['add', 'status.yml']);
  assert.strictEqual(run('--staged').status, 1, 'status-only G5 仍拦未完成修订');
  write('status.yml', state(5));
  assert.strictEqual(run('--staged').status, 2, '未暂存的绿状态不能为已暂存的红状态背书');
  git(['add', 'status.yml']);
  write('status.yml', state(5).replace('G3: { signed: true', 'G3: { signed: false'));
  git(['add', 'status.yml']);
  assert.strictEqual(run('--staged').status, 1, 'A Gate 顺序不能借迁移放松');
  // 检查 G1/G2/G3 的路由，替身仅记录参数；真实检查器另有专属回归。
  write('scripts/check-docs.js', "require('fs').appendFileSync('calls.log', process.argv.slice(2).join(' ')+'\\n');\n");
  write('scripts/check-sprint.js', "require('fs').appendFileSync('calls.log', process.argv.slice(2).join(' ')+'\\n');\n");
  write('status.yml', state(3, 'tasks: []\n', 'v2')); git(['add', '.']);
  assert.strictEqual(run('--staged').status, 0);
  const calls = fs.readFileSync(path.join(root, 'calls.log'), 'utf8').replace(/\\/g, '/');
  assert.match(calls, /--prd iterations\/v2\/prd.md/);
  assert.match(calls, /iterations\/v2\/prd.md iterations\/v2\/trd.md/);
  assert.match(calls, /v2\n/);
  assert.strictEqual((calls.match(/--staged/g) || []).length, 1, 'status event invokes scoped audit once');
  // 新 B merged 在没有 sprint/gates 文件变化时仍必须核真实审查入口。
  fs.copyFileSync(path.join(__dirname, 'check-sprint.js'), path.join(root, 'scripts', 'check-sprint.js'));
  write('status.yml', state(4, 'tasks:\n  - id: demo-b-001\n    source: bug\n    iteration: null\n    type: develop\n    status: merged\n'));
  git(['add', '.']);
  const missingAudit = run('--staged');
  assert.notStrictEqual(missingAudit.status, 0);
  assert.match(missingAudit.stdout + missingAudit.stderr, /review|审计/);
  const hook = fs.readFileSync(path.join(__dirname, 'pre-commit-hook.sh'), 'utf8');
  assert.match(hook, /run scripts\/check-gate.js --staged/);
  assert.match(hook, /run scripts\/check-system-review\.js "\$version" \. --in-progress --staged/);
  assert.match(hook, /check-integration-evidence\.js "\$result" \. --staged/);
  assert.match(fs.readFileSync(checker, 'utf8'), /check-system-review\.js'[\s\S]*task\.iteration, root, '--staged'/);
  assert.doesNotMatch(hook, /added_gates=/);
  const shell = process.platform === 'win32'
    ? path.join(process.env.ProgramFiles, 'Git', 'bin', 'sh.exe') : '/bin/sh';
  fs.copyFileSync(checker, path.join(root, 'scripts', 'check-gate.js'));
  fs.copyFileSync(path.join(__dirname, 'check-system-review.js'), path.join(root, 'scripts', 'check-system-review.js'));
  fs.copyFileSync(path.join(__dirname, 'check-integration-evidence.js'), path.join(root, 'scripts', 'check-integration-evidence.js'));
  fs.copyFileSync(path.join(__dirname, 'git-truth-reader.js'), path.join(root, 'scripts', 'git-truth-reader.js'));
  write('scripts/check-secrets.js', 'process.exit(0);\n');
  write('pre-commit.sh', hook.replace(/\r\n/g, '\n'));
  assert.strictEqual(cp.spawnSync(shell, ['-n', 'pre-commit.sh'], { cwd: root }).status, 0, 'hook 必须实际通过 shell 语法检查');
  const hookFail = cp.spawnSync(shell, ['pre-commit.sh'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(hookFail.status, 1, hookFail.stdout + hookFail.stderr);
  assert.match(hookFail.stdout + hookFail.stderr, /check-gate.js --staged/, '实际 shell 调到状态门');
  const finalCandidate = git(['rev-parse', 'HEAD']).trim();
  const systemTask = `tasks:
  - id: demo-v1-integration-verify
    iteration: v1
    source: null
    type: integration-verify
    status: merged
    latest_system_review: iterations/v1/system-review/review-001.md
    integration_result: integration-tests/result-v1.md
    final_candidate: ${finalCandidate}
`;
  write('iterations/v1/system-review/review-001.md', `---
schema: system-review/v2
review_id: review-001
review_type: full
candidate: ${finalCandidate}
prior_report: null
target_finding_ids: []
new_finding_ids: []
closed_finding_ids: []
open_finding_ids: []
conclusion: pass
evidence_refs: []
created_at: 2026-09-25T12:00:00Z
---
# System Review
`);
  write('integration-tests/evidence/v1/S-01/result.txt', 'PASS\n');
  write('integration-tests/result-v1.md', `---
schema: integration-result/v3
iteration: v1
candidate_head: ${finalCandidate}
latest_system_review: iterations/v1/system-review/review-001.md
runtime_scope: [S-01]
result_status: satisfied
evidence_state: sufficient
created_at: 2026-09-25T12:10:00Z
---
| # | 模块 | 场景描述 | 结果 | 证据（项目相对路径） | 未运行原因 | 现象 | 级别 | 复测 |
|---|---|---|---|---|---|---|---|---|
| S-01 | core | smoke | ✅ | integration-tests/evidence/v1/S-01/result.txt | — | — | — | — |
`);
  write('status.yml', state(5, systemTask)); git(['add', 'status.yml', 'iterations/v1/system-review/review-001.md', 'integration-tests', 'scripts/check-system-review.js', 'scripts/check-secrets.js']);
  const hookPass = cp.spawnSync(shell, ['pre-commit.sh'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(hookPass.status, 0, `hook stdout:\n${hookPass.stdout}\nhook stderr:\n${hookPass.stderr}`);
  console.log('✅ Gate 单源状态、G5 真实缺口、签署路由与 merged 审查回归通过');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
