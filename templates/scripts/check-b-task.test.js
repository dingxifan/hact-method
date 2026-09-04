#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseFrontmatter, contractPathHits, validate } = require('./check-b-task.js');

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

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-b-task-'));
const goodPath = path.join(temp, 'good.md');
const badPath = path.join(temp, 'bad.md');
fs.writeFileSync(goodPath, `---\nsource: bug\ncontract-impact: none\nfiles:\n  - src/service.ts\nasset-writes: []\n---\n`);
fs.writeFileSync(badPath, `---\nsource: optimization\ncontract-impact: governed\nfiles:\n  - iterations/v2/trd.md\nasset-writes:\n  - api:GET /users\n---\n`);
assert.deepStrictEqual(validate(goodPath), [], '普通 B 类包应通过');
assert.ok(validate(badPath).length >= 2, '契约夹带包必须同时命中字段与路径');
fs.rmSync(temp, { recursive: true, force: true });

console.log('✅ check-b-task 正反夹具通过');
