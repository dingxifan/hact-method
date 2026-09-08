'use strict';
const assert = require('assert'), fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { loadSource, inspectProject, prepare, verify, finish, safePath } = require('./sync-method.cjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-distribution-'));
const method = path.join(temp, 'method'), project = path.join(temp, 'project with space');
const realTemplates = path.resolve(__dirname, '../templates');
const git = (root, args) => cp.execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const write = (root, name, body) => { fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true }); fs.writeFileSync(path.join(root, name), body); };
const init = root => { fs.mkdirSync(root); git(root, ['init', '-b', 'main']); git(root, ['config', 'user.name', 'Test']); git(root, ['config', 'user.email', 'test@example.com']); git(root, ['config', 'core.autocrlf', 'false']); };
let wt;
try {
  init(method);
  for (const file of ['AGENTS.md', 'gitee-ops.md', '.codex/agents/researcher.toml', '.codex/agents/worker.toml',
    '.codex/agents/reviewer.toml', '.codex/agents/sensitive_reviewer.toml', 'scripts/check-gate.js',
    'scripts/check-hook-state.js', 'scripts/check-codex-project.js', 'scripts/pre-commit-hook.sh'])
    write(method, 'templates/' + file, fs.readFileSync(path.join(realTemplates, file), 'utf8').replace(/\r\n/g, '\n'));
  // 此夹具不读取本机真实凭据；测试的是分发与实际 hook 执行，凭据扫描本体不在此替身中测。
  write(method, 'templates/scripts/check-secrets.js', 'process.exit(0);\n');
  write(method, 'templates/scripts/check-example.js', 'console.log("old template");\n');
  git(method, ['add', '.']); git(method, ['commit', '-m', 'old']);
  const oldExample = fs.readFileSync(path.join(method, 'templates/scripts/check-example.js'));
  write(method, 'templates/scripts/check-example.js', 'console.log("new template");\n');
  git(method, ['add', '.']); git(method, ['commit', '-m', 'new']);
  git(method, ['branch', 'codex/context-reduction']);
  const source = loadSource(method, 'codex/context-reduction');
  init(project);
  write(project, 'AGENTS.md', '# 项目\n不能操作生产数据。\n');
  write(project, 'project.md', '# 项目事实\n');
  write(project, 'status.yml', 'iterations:\n  v1:\n    gates:\n      G1: { signed: false, date: null }\ntasks: []\n');
  write(project, 'standards-shared.md', '# 项目约束\n只使用本地文件。\n');
  write(project, 'scripts/check-example.js', oldExample);
  write(project, '.codex/config.toml', 'model = "keep-user-choice"\n');
  write(project, 'connections.yml', 'keep: existing-config\n');
  write(project, 'iterations/v1/code-reviews/historical.md', 'historical report must stay byte-identical\n');
  git(project, ['add', '.']); git(project, ['commit', '-m', 'base']);
  const originalHead = git(project, ['rev-parse', 'HEAD']);
  write(project, 'user-wip.txt', 'do not touch');
  write(project, 'scripts/check-example.js', 'uncommitted user override\n');
  const originalStatus = git(project, ['status', '--porcelain=v1']);
  assert.throws(() => inspectProject(method, source), /方法论仓本身/);
  const inventory = inspectProject(project, source);
  assert.strictEqual(inventory.operations.find(x => x.to === 'scripts/check-example.js').action, 'update', '按 HEAD 不按主树在制品选覆盖策略');
  assert.strictEqual(inventory.operations.find(x => x.to === 'AGENTS.md').action, 'merge');
  assert.strictEqual(git(project, ['status', '--porcelain=v1']), originalStatus, 'check 零写入');
  const prepared = prepare(project, source); wt = prepared.worktree;
  assert.strictEqual(git(project, ['rev-parse', 'HEAD']), originalHead);
  assert.strictEqual(git(project, ['status', '--porcelain=v1']), originalStatus, 'prepare 不碰原树/暂存区');
  assert.strictEqual(fs.readFileSync(path.join(wt, 'scripts/check-example.js'), 'utf8'), 'console.log("new template");\n');
  assert.strictEqual(fs.readFileSync(path.join(wt, 'AGENTS.md'), 'utf8'), '# 项目\n不能操作生产数据。\n');
  assert.ok(!fs.existsSync(path.join(wt, 'user-wip.txt')));
  assert.ok(verify(wt, source).some(e => /约束|候选/.test(e)));
  const candidate = path.join(wt, '_meta/method-sync-pending/files/AGENTS.md');
  fs.appendFileSync(candidate, '\nmanual merge in progress\n');
  assert.strictEqual(prepare(project, source).state, 'resume');
  assert.match(fs.readFileSync(candidate, 'utf8'), /manual merge in progress/, '恢复不覆盖在制候选');
  write(wt, 'AGENTS.md', fs.readFileSync(candidate, 'utf8') + '\n项目禁区：不能操作生产数据。\n');
  fs.unlinkSync(candidate);
  write(wt, 'project.md', '# 项目事实\n## 项目约束\n只使用本地文件。\n');
  fs.unlinkSync(path.join(wt, 'standards-shared.md'));
  write(wt, '_meta/method-sync-review.md', '保留本地文件约束到 project，状态不变，原配置不动；以临时 Git 真跑验证，无业务环境验证。\n');
  const hook = git(project, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']) + '/pre-commit';
  fs.writeFileSync(hook, '#!/bin/sh\nsh scripts/pre-commit-hook.sh\n'); fs.chmodSync(hook, 0o755);
  assert.deepStrictEqual(verify(wt, source), []);
  const originalState = fs.readFileSync(path.join(wt, 'status.yml'), 'utf8');
  write(wt, 'status.yml', originalState.replace('tasks: []', 'tasks:\n  - id: demo-b-001\n    source: bug\n    status: 可取'));
  assert.ok(verify(wt, source).some(e => /缺任务包/.test(e)));
  write(wt, 'b-queue/demo-b-001.md', '---\nsource: bug\nreference:\n  - standards-shared.md\n---\n');
  assert.ok(verify(wt, source).some(e => /活跃包仍引用/.test(e)));
  fs.unlinkSync(path.join(wt, 'b-queue/demo-b-001.md'));
  write(wt, 'status.yml', originalState);
  assert.ok(verify(wt, { ...source, sha: '0'.repeat(40) }).some(e => /版本不一致/.test(e)));
  write(method, 'templates/scripts/check-example.js', 'uncommitted source change\n');
  assert.ok(verify(wt, source).some(e => /固定版本|未提交/.test(e)), '不能用未提交方法源码给固定版本背书');
  write(method, 'templates/scripts/check-example.js', source.get('templates/scripts/check-example.js'));
  write(wt, 'scripts/check-example.js', 'console.log("stale customized checker");\n');
  assert.ok(verify(wt, source).some(e => /固定方法版本/.test(e)));
  write(wt, 'scripts/check-example.js', source.get('templates/scripts/check-example.js'));
  write(wt, 'AGENTS.override.md', '# Old override\n');
  assert.ok(verify(wt, source).some(e => /遮蔽/.test(e)));
  fs.unlinkSync(path.join(wt, 'AGENTS.override.md'));
  assert.throws(() => finish(wt, source, true), /在制品|基线/);
  write(wt, 'business.ts', 'not a methodology change\n');
  assert.throws(() => finish(wt, source), /范围外/);
  fs.unlinkSync(path.join(wt, 'business.ts'));
  const result = finish(wt, source);
  assert.strictEqual(result.state, 'committed');
  assert.strictEqual(result.pushed, false);
  assert.strictEqual(fs.existsSync(wt), false);
  assert.ok(!git(project, ['worktree', 'list', '--porcelain']).includes(wt.replace(/\\/g, '/')));
  assert.strictEqual(git(project, ['rev-parse', 'HEAD']), originalHead, '默认不集成');
  assert.strictEqual(git(project, ['status', '--porcelain=v1']), originalStatus);
  assert.strictEqual(git(project, ['show', result.branch + ':.codex/config.toml']), 'model = "keep-user-choice"');
  assert.strictEqual(git(project, ['show', result.branch + ':connections.yml']), 'keep: existing-config');
  assert.strictEqual(git(project, ['show', result.branch + ':iterations/v1/code-reviews/historical.md']), 'historical report must stay byte-identical');
  assert.strictEqual(prepare(project, source).state, 'branch-exists');
  const project2 = path.join(temp, 'clean-project'); init(project2);
  write(project2, 'project.md', '# Clean project\n');
  write(project2, 'status.yml', 'iterations:\n  v1:\n    gates:\n      G1: { signed: false, date: null }\ntasks: []\n');
  git(project2, ['add', '.']); git(project2, ['commit', '-m', 'base']);
  const prepared2 = prepare(project2, source), wt2 = prepared2.worktree;
  write(wt2, '_meta/method-sync-review.md', '无旧规则，原状态保留，实际 hook 接线已验证。\n');
  const hook2 = git(project2, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']) + '/pre-commit';
  fs.writeFileSync(hook2, '#!/bin/sh\nsh scripts/pre-commit-hook.sh\n'); fs.chmodSync(hook2, 0o755);
  const originalExec = cp.execFileSync;
  cp.execFileSync = function(bin, args, opts) {
    if (bin === 'git' && args.includes('remove') && args.includes(wt2)) throw new Error('fixture cleanup failure');
    return originalExec.call(this, bin, args, opts);
  };
  try { assert.throws(() => finish(wt2, source), /fixture cleanup failure/); }
  finally { cp.execFileSync = originalExec; }
  const committedBeforeCleanup = git(wt2, ['rev-parse', 'HEAD']);
  assert.strictEqual(git(wt2, ['status', '--porcelain=v1']), '');
  const integrated = finish(wt2, source, true);
  assert.strictEqual(integrated.commit, committedBeforeCleanup, '提交后清理失败可接续，不制造重复提交');
  assert.strictEqual(integrated.state, 'integrated');
  assert.strictEqual(git(project2, ['rev-parse', 'HEAD']), integrated.commit);
  assert.ok(!fs.existsSync(wt2));
  assert.strictEqual(prepare(project2, source).state, 'already-integrated');
  assert.throws(() => safePath(project, '../outside'), /非法/);
  const linked = path.join(project, 'linked');
  fs.symlinkSync(method, linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => safePath(project, 'linked/forbidden'), /链接/);
  fs.unlinkSync(linked);
  console.log('✅ 分发：固定版本/真实 Git/脏主树保护/自定义候选/恢复/版本校验/实际 hook/本地提交与 worktree 双重回收通过');
} finally {
  // 仅本测试独有 mkdtemp，先注销已登记 worktree，再删已验证临时根；不操作真实项目。
  if (wt && fs.existsSync(wt)) {
    if (!path.resolve(wt).startsWith(path.resolve(temp) + path.sep)) throw new Error('测试 worktree 越界');
    git(project, ['worktree', 'remove', '--force', wt]);
  }
  if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('临时目录越界');
  fs.rmSync(temp, { recursive: true, force: true });
}
