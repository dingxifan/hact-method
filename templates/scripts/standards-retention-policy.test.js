#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { evaluate } = require('./standards-retention-policy');

const base = { zero_use: true, safety_or_data: false, superseded_when_met: false, applies_if_possible: true };
assert.strictEqual(evaluate(base).decision, 'review', '两期零命中不能删除仍可适用的人审规则');
assert.strictEqual(evaluate({ ...base, safety_or_data: true }).decision, 'keep', '安全/数据规则默认保留');
assert.strictEqual(evaluate({ ...base, superseded_when_met: true }).decision, 'delete-allowed', 'superseded-when 成立可删除普通规则');
assert.strictEqual(evaluate({ ...base, migrated_to: 'Foundation F-01', stronger_anchor: 'foundation.md § F-01' }).decision, 'delete-allowed', '迁入更强权威对象可删除');
assert.strictEqual(evaluate({ ...base, safety_or_data: true, superseded_when_met: true }).decision, 'keep', '安全/数据规则没有更强承接锚时仍保留');
assert.strictEqual(evaluate({ ...base, migrated_to: 'x', stronger_anchor: 'x' }).decision, 'review', 'truthy 垃圾锚不得放行删除');
assert.strictEqual(evaluate({ ...base, superseded_when_met: 'false' }).decision, 'invalid', '字符串 false 不得当布尔证据');
assert.strictEqual(evaluate({ ...base, zero_use: 1 }).decision, 'invalid', '数字 1 不得当布尔证据');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-standards-retention-'));
const audit = path.join(temp, 'audit.json');
fs.writeFileSync(audit, JSON.stringify([{ id: 'PAY-REV-01', requested: 'delete', zero_use: true,
  safety_or_data: true, superseded_when_met: false, applies_if_possible: true,
  migrated_to: 'x', stronger_anchor: 'x' }]));
const run = childProcess.spawnSync(process.execPath, [path.join(__dirname, 'standards-retention-policy.js'), audit], { encoding: 'utf8' });
assert.strictEqual(run.status, 1, 'CLI 必须拒绝 bogus stronger anchor 的安全规则删除');
fs.writeFileSync(audit, JSON.stringify([{ id: 'PAY-REV-01', requested: 'delete', zero_use: true,
  safety_or_data: false, superseded_when_met: 'false', applies_if_possible: true }]));
const badBoolean = childProcess.spawnSync(process.execPath, [path.join(__dirname, 'standards-retention-policy.js'), audit], { encoding: 'utf8' });
assert.strictEqual(badBoolean.status, 1, 'CLI 必须拒绝字符串 false/数字等伪布尔证据');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ Standards retention 负向策略夹具通过');
