#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('./check-integration-evidence.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-integration-evidence-'));
const evidence = 'integration-tests/evidence/v1/S-01/screenshot.png';
fs.mkdirSync(path.dirname(path.join(root, evidence)), { recursive: true });
fs.writeFileSync(path.join(root, evidence), 'png');
const backendEvidence = 'integration-tests/evidence/v1/BE-01/transcript.txt';
fs.mkdirSync(path.dirname(path.join(root, backendEvidence)), { recursive: true });
fs.writeFileSync(path.join(root, backendEvidence), 'HTTP 200\nstate=done\n');
const result = path.join(root, 'integration-tests', 'result-2026-09-04.md');
fs.mkdirSync(path.dirname(result), { recursive: true });
fs.writeFileSync(result, `| # | 模块 | 场景描述 | 结果 | 证据（项目相对路径） | 未运行原因 | 现象 | 级别 | 复测 |
|---|---|---|---|---|---|---|---|---|
| S-01 | web | 登录 | ✅ | \`${evidence}\` | — | — | — | — |
| BE-01 | backend | 创建到终态 | ✅ | \`${backendEvidence}\` | — | — | — | — |
| S-02 | web | 导出 | 未运行 | — | 缺测试账号，移交 manual-test | — | [阻断] | — |
`);
assert.deepStrictEqual(validate(path.relative(root, result), root), [], '前后端有证据或明确未运行原因应通过');
fs.writeFileSync(result, `| # | 模块 | 场景描述 | 结果 | 证据 | 未运行原因 | 现象 | 级别 | 复测 |
|---|---|---|---|---|---|---|---|---|
| S-01 | web | 登录 | ✅ | — | — | — | — | — |
| S-02 | web | 导出 | 未运行 | — | — | — | — | — |
`);
assert.ok(validate(path.relative(root, result), root).length >= 2, '无证据和无原因必须失败');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-integration-evidence 正反夹具通过');
