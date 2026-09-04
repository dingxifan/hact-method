#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('./check-as-built-ledger.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-ledger-'));
fs.mkdirSync(path.join(root, 'iterations', 'v0'), { recursive: true });
fs.mkdirSync(path.join(root, 'iterations', 'v1'), { recursive: true });
assert.strictEqual(validate('v1', root).length, 1, '走过 V0 却无账本必须失败');

fs.writeFileSync(path.join(root, 'iterations', 'v1', 'as-built-ledger.md'), `# As-built 对账账本 · v1
## 证据源
- \`reusables.md#标杆切片\`
## 对账项
| 对象 | 设计声明 | as-built 证据 | 实际观察 | 关系 | 动作 |
|---|---|---|---|---|---|
| OrderStatus | foundation 声明状态机 | \`src/order.ts#OrderStatus\` | 已有 pending/done | 一致 | 沿用 |
`);
assert.deepStrictEqual(validate('v1', root), [], '有证据锚的对账账本应通过');

fs.writeFileSync(path.join(root, 'iterations', 'v1', 'as-built-ledger.md'), `## 证据源
- reusables
## 对账项
| 对象 | 设计声明 | as-built 证据 | 实际观察 | 关系 | 动作 |
|---|---|---|---|---|---|
| OrderStatus | 声明 | src/order.ts | 不确定 | 未知 | 无 |
`);
assert.ok(validate('v1', root).length >= 2, '无证据锚且未知无动作必须失败');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-as-built-ledger 正反夹具通过');
