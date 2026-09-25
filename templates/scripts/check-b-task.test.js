#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const { parseFrontmatter, contractPathHits, contractDiffSignals, validate, validateDiff } = require('./check-b-task.js');

const valid = parseFrontmatter(`---
source: bug
contract-impact: none
files:
  - src/service.ts
asset-writes: []
---`);
assert.strictEqual(valid.source, 'bug');
assert.deepStrictEqual(contractPathHits(valid.files), []);

const dangerous = ['iterations/v2/trd.md', 'project.md', 'foundation.md', 'standards-shared.md', 'db/migrations/002.sql', 'api/openapi.yaml'];
assert.strictEqual(contractPathHits(dangerous).length, dangerous.length, '共享契约路径必须全部命中');
assert.strictEqual(contractPathHits(['src/service.ts', 'tests/service.test.ts']).length, 0, '普通实现路径不得误报');
assert.ok(contractDiffSignals('+export enum OrderStatus { Pending }').length, '导出 enum 改动必须命中');
assert.ok(contractDiffSignals('+@Get("/users")').length, 'API 路由改动必须命中');

const shortPackage = (file, impact = 'governed') => [
  '---', 'package-schema: 2', 'task-id: demo-b-001', 'source: bug',
  'title: profile display', 'description: missing label -> display existing label',
  'context: Existing caller accepts optional label; verify absent and present values',
  'risk: standard', 'contract-impact: ' + impact, 'files:', '  - ' + file,
  'asset-writes:', ...(impact === 'governed' ? ['  - type:Profile'] : []), 'depends_on: []', 'do-not: []',
  'reference:', '  - issue-12 confirmed display intent and caller compatibility',
  'acceptance-criteria:', '  - |-',
  '    intent: Display the existing profile label',
  '    oracle: Both missing and present labels retain prior behavior', '---', ''
].join('\n');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-b-task-'));
const goodPath = path.join(temp, 'good.md');
const badPath = path.join(temp, 'bad.md');
fs.writeFileSync(goodPath, shortPackage('src/service.ts', 'none'));
fs.writeFileSync(badPath, `---\nsource: optimization\ncontract-impact: governed\nfiles:\n  - iterations/v2/trd.md\nasset-writes:\n  - api:GET /users\n---\n`);
assert.deepStrictEqual(validate(goodPath), [], '普通 B 类包应通过');
fs.writeFileSync(badPath, shortPackage('src/service.ts', 'none').replace('package-schema: 2\n', ''));
assert.deepStrictEqual(validate(badPath), ['active B package 必须显式使用 package-schema: 2（当前=缺失）'],
  '字段完整的 active B 包也不能因缺 schema 降级到弱校验');
fs.writeFileSync(badPath, shortPackage('src/service.ts', 'none').replace('task-id: demo-b-001\n', ''));
assert.ok(validate(badPath).some(error => /缺有效 task-id/.test(error)), 'schema=2 缺 task-id 必须失败');
fs.writeFileSync(badPath, shortPackage('src/service.ts', 'none').replace(/files:\n  - .*\n/, 'files: []\n'));
assert.ok(validate(badPath).some(error => /缺有效 files 列表/.test(error)), 'schema=2 缺 files 必须失败');
fs.writeFileSync(badPath, shortPackage('src/service.ts', 'none').replace(/acceptance-criteria:[\s\S]*?\n---\n/, '---\n'));
assert.ok(validate(badPath).some(error => /intent\/oracle/.test(error)), 'schema=2 缺 acceptance-criteria 必须失败');
fs.writeFileSync(badPath, `---\nsource: optimization\ncontract-impact: governed\nfiles:\n  - iterations/v2/trd.md\nasset-writes:\n  - api:GET /users\n---\n`);
assert.ok(validate(badPath).some(error => /package-schema: 2/.test(error)), 'active B 包缺 schema 必须失败');
assert.ok(validate(badPath).some(error => /迁移路径/.test(error)), '契约夹带包仍必须命中路径');

const repo = path.join(temp, 'repo');
fs.mkdirSync(path.join(repo, 'src', 'models'), { recursive: true });
const runGit = args => childProcess.execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
runGit(['init']);
runGit(['config', 'user.email', 'test@example.com']);
runGit(['config', 'user.name', 'Test']);
fs.writeFileSync(path.join(repo, 'src', 'models', 'user.ts'), 'export const userName = "demo";\n');
fs.writeFileSync(path.join(repo, 'src', 'models', 'profile.ts'), 'export interface Profile {\n  id: string;\n}\n');
runGit(['add', '.']);
runGit(['commit', '-m', 'base']);
const base = runGit(['rev-parse', 'HEAD']);
fs.writeFileSync(path.join(repo, 'src', 'models', 'user.ts'),
  'export const userName = "demo";\nexport enum UserState { Active }\n');
runGit(['add', 'src/models/user.ts']);
const head = runGit(['write-tree']);
const diffTask = path.join(temp, 'diff-task.md');
fs.writeFileSync(diffTask, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - src/models/user.ts\nasset-writes: []\n---\n`);
assert.ok(validateDiff(diffTask, base, head, repo).some(error => /共享契约变更信号/.test(error)),
  '普通源码路径中的导出 enum 也必须由固定 diff 拦截');
fs.writeFileSync(diffTask, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - src/other.ts\nasset-writes: []\n---\n`);
assert.ok(validateDiff(diffTask, base, head, repo).some(error => /未声明 files/.test(error)),
  '实际 diff 超出 files 必须失败');
runGit(['read-tree', `${base}^{tree}`]);
fs.writeFileSync(path.join(repo, 'src', 'models', 'profile.ts'),
  'export interface Profile {\n  id: string;\n  role?: string;\n}\n');
runGit(['add', 'src/models/profile.ts']);
const memberHead = runGit(['write-tree']);
fs.writeFileSync(diffTask, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - src/models/profile.ts\nasset-writes: []\n---\n`);
assert.ok(validateDiff(diffTask, base, memberHead, repo).some(error => /修改公开类型成员/.test(error)),
  '已有 exported interface 增删成员必须命中');
runGit(['read-tree', `${base}^{tree}`]);
fs.writeFileSync(path.join(repo, 'project.md'), '## 技术层\n允许新增未确认的数据出站路径\n');
runGit(['add', 'project.md']);
const projectHead = runGit(['write-tree']);
fs.writeFileSync(diffTask, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - project.md\nasset-writes: []\n---\n`);
assert.ok(validateDiff(diffTask, base, projectHead, repo).some(error => /固定 diff 命中共享契约.*project.md/.test(error)),
  '技术约束迁入 project.md 后，B 类不能从实际 diff 夹带修订');
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts'));
assert.deepStrictEqual(validateDiff(diffTask, base, memberHead, repo), [],
  '有依据的局部公共类型变更可进入 governed 的独立语义审查');
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts', 'none'));
assert.ok(validateDiff(diffTask, base, memberHead, repo).some(e => /修改公开类型成员/.test(e)));
fs.writeFileSync(diffTask, shortPackage('project.md'));
assert.ok(validateDiff(diffTask, base, projectHead, repo).some(e => /project.md/.test(e)),
  'governed 也不能夹带已签规格修订');
fs.writeFileSync(diffTask, shortPackage('db/migrations/002.sql'));
assert.ok(validate(diffTask).some(e => /迁移路径/.test(e)));
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace(/reference:\n  - .*\n/, 'reference: []\n'));
assert.ok(validate(diffTask).some(e => /reference/.test(e)), 'governed 无依据不通过');
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace(/asset-writes:\n  - .*\n/, 'asset-writes: []\n'));
assert.ok(validate(diffTask).some(e => /共享资产/.test(e)));
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace(/    oracle:.*\n/, ''));
assert.ok(validate(diffTask).some(e => /intent\/oracle/.test(e)));
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace('depends_on: []', 'depends_on: [demo-b-000]'));
assert.deepStrictEqual(validate(diffTask), [], '短包可使用紧凑依赖数组');
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace('package-schema: 2', 'package-schema: 3'));
assert.ok(validate(diffTask).some(e => /package-schema: 2/.test(e)));
fs.writeFileSync(diffTask, shortPackage('src/models/profile.ts').replace('\n---\n', '\n  - |-\n    intent: another behavior\n---\n'));
assert.ok(validate(diffTask).some(e => /intent\/oracle/.test(e)), '第二条 AC 不能漏 oracle');
fs.writeFileSync(diffTask, shortPackage('status.yml'));
assert.ok(validate(diffTask).some(e => /status.yml/.test(e)), '实现 diff 不得夹带签署状态');
runGit(['read-tree', base + '^{tree}']);
fs.writeFileSync(path.join(repo, 'src', 'models', 'user.ts'), 'const sql = "ALTER TABLE users ADD role TEXT";\n');
runGit(['add', 'src/models/user.ts']);
const ddlHead = runGit(['write-tree']);
fs.writeFileSync(diffTask, shortPackage('src/models/user.ts'));
assert.ok(validateDiff(diffTask, base, ddlHead, repo).some(e => /数据库 DDL/.test(e)),
  'governed 不能从普通源码夹带迁移 DDL');
runGit(['read-tree', base + '^{tree}']);
const ownTask = path.join(repo, 'b-queue', 'demo-b-001.md');
fs.mkdirSync(path.dirname(ownTask), { recursive: true });
fs.writeFileSync(ownTask, shortPackage('src/models/profile.ts'));
runGit(['add', 'b-queue/demo-b-001.md']);
const ownHead = runGit(['write-tree']);
assert.deepStrictEqual(validateDiff(ownTask, base, ownHead, repo), [], '本任务包维护无需自登记');
runGit(['read-tree', base + '^{tree}']);
fs.writeFileSync(path.join(repo, 'src', 'service.ts'), 'export const service = true;\n');
fs.writeFileSync(path.join(repo, 'status.yml'), 'tasks:\n  - id: demo-b-001\n    status: merged\n');
fs.mkdirSync(path.join(repo, 'b-reviews', 'demo-b-001'), { recursive: true });
fs.writeFileSync(path.join(repo, 'b-reviews', 'demo-b-001', 'preflight.md'), 'historical governance evidence\n');
runGit(['add', 'src/service.ts', 'status.yml', 'b-reviews/demo-b-001/preflight.md']);
const governedEvidenceHead = runGit(['write-tree']);
fs.writeFileSync(ownTask, shortPackage('src/service.ts', 'none'));
assert.deepStrictEqual(validateDiff(ownTask, base, governedEvidenceHead, repo), [],
  'implementation files remain scoped while status and task-owned evidence stay independently auditable');
fs.writeFileSync(path.join(repo, 'b-queue', 'another-task.md'), 'another task\n');
runGit(['add', 'b-queue/another-task.md']);
assert.ok(validateDiff(ownTask, base, runGit(['write-tree']), repo).some(e => /未声明 files/.test(e)), '自登记豁免不覆盖其它任务');

const hookRepo = path.join(temp, 'hook-repo');
fs.mkdirSync(path.join(hookRepo, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(hookRepo, 'b-queue'), { recursive: true });
const runGitInHook = args => childProcess.spawnSync('git', args, { cwd: hookRepo, encoding: 'utf8' });
assert.strictEqual(runGitInHook(['init']).status, 0);
assert.strictEqual(runGitInHook(['config', 'user.email', 'test@example.com']).status, 0);
assert.strictEqual(runGitInHook(['config', 'user.name', 'Test']).status, 0);
fs.copyFileSync(path.join(__dirname, 'check-b-task.js'), path.join(hookRepo, 'scripts', 'check-b-task.js'));
fs.writeFileSync(path.join(hookRepo, 'scripts', 'check-sprint.js'), 'process.exit(0);\n');
fs.writeFileSync(path.join(hookRepo, 'scripts', 'check-secrets.js'), 'process.exit(0);\n');
fs.copyFileSync(path.join(__dirname, 'pre-commit-hook.sh'), path.join(hookRepo, '.git', 'hooks', 'pre-commit'));
fs.chmodSync(path.join(hookRepo, '.git', 'hooks', 'pre-commit'), 0o755);
const hookTask = path.join(hookRepo, 'b-queue', 'demo-b-002.md');
fs.writeFileSync(hookTask, `---\nsource: bug\ncontract-impact: none\nasset-writes: []\n---\n`);
assert.strictEqual(runGitInHook(['add', 'b-queue/demo-b-002.md']).status, 0);
fs.writeFileSync(hookTask, shortPackage('src/service.ts', 'none').replaceAll('demo-b-001', 'demo-b-002'));
const malformedCommit = runGitInHook(['commit', '-m', 'malformed B must fail']);
assert.notStrictEqual(malformedCommit.status, 0, '真实 pre-commit 必须按 index 拒绝缺 schema 的新 B 包，不能读取工作区合法诱饵');
assert.match(`${malformedCommit.stdout}\n${malformedCommit.stderr}`, /package-schema: 2/);
assert.strictEqual(runGitInHook(['reset']).status, 0);
fs.writeFileSync(hookTask, shortPackage('src/service.ts', 'none').replaceAll('demo-b-001', 'demo-b-002'));
assert.strictEqual(runGitInHook(['add', 'b-queue/demo-b-002.md']).status, 0);
fs.writeFileSync(hookTask, `---\nsource: bug\ncontract-impact: none\nasset-writes: []\n---\n`);
const validCommit = runGitInHook(['commit', '-m', 'valid schema 2 B passes']);
assert.strictEqual(validCommit.status, 0, `合法 staged schema=2 B 包不应被工作区坏副本误拦：${validCommit.stdout}\n${validCommit.stderr}`);
assert.match(runGitInHook(['show', 'HEAD:b-queue/demo-b-002.md']).stdout, /package-schema: 2/,
  '真实 commit 必须保存已验证的 staged schema=2 blob');
assert.strictEqual(runGitInHook(['checkout', '--', 'b-queue/demo-b-002.md']).status, 0);
fs.writeFileSync(hookTask, shortPackage('src/service.ts', 'none')
  .replaceAll('demo-b-001', 'demo-b-002').replace('package-schema: 2\n', ''));
assert.strictEqual(runGitInHook(['add', 'b-queue/demo-b-002.md']).status, 0);
fs.writeFileSync(hookTask, shortPackage('src/service.ts', 'none').replaceAll('demo-b-001', 'demo-b-002'));
const downgradedCommit = runGitInHook(['commit', '-m', 'modified B must retain schema 2']);
assert.notStrictEqual(downgradedCommit.status, 0, '已存在 active B 包的 staged blob 删除 schema 后也不能用工作区诱饵绕过');
assert.match(`${downgradedCommit.stdout}\n${downgradedCommit.stderr}`, /package-schema: 2/);

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('临时路径越界');
fs.rmSync(temp, { recursive: true, force: true });

console.log('✅ check-b-task 正反夹具通过');
