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

const dangerous = ['iterations/v2/trd.md', 'standards-shared.md', 'db/migrations/002.sql', 'api/openapi.yaml'];
assert.strictEqual(contractPathHits(dangerous).length, dangerous.length, '共享契约路径必须全部命中');
assert.strictEqual(contractPathHits(['src/service.ts', 'tests/service.test.ts']).length, 0, '普通实现路径不得误报');
assert.ok(contractDiffSignals('+export enum OrderStatus { Pending }').length, '导出 enum 改动必须命中');
assert.ok(contractDiffSignals('+@Get("/users")').length, 'API 路由改动必须命中');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-b-task-'));
const goodPath = path.join(temp, 'good.md');
const badPath = path.join(temp, 'bad.md');
fs.writeFileSync(goodPath, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - src/service.ts\nasset-writes: []\n---\n`);
fs.writeFileSync(badPath, `---\nsource: optimization\ncontract-impact: governed\nfiles:\n  - iterations/v2/trd.md\nasset-writes:\n  - api:GET /users\n---\n`);
assert.deepStrictEqual(validate(goodPath), [], '普通 B 类包应通过');
assert.ok(validate(badPath).length >= 2, '契约夹带包必须同时命中字段与路径');

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
fs.rmSync(temp, { recursive: true, force: true });

console.log('✅ check-b-task 正反夹具通过');
