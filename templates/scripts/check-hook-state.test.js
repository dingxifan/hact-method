#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { inspect, delegatesTracked } = require('./check-hook-state.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-hook-'));
assert.strictEqual(spawnSync('git', ['init', '-q', root]).status, 0, '临时 git init 失败');
fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(root, '.git', 'hooks'), { recursive: true });
const tracked = path.join(root, 'scripts', 'pre-commit-hook.sh');
const active = path.join(root, '.git', 'hooks', 'pre-commit');
fs.writeFileSync(tracked, '#!/bin/sh\necho tracked\n');

assert.ok(inspect(root).signals.includes('active-missing'), '未安装必须有信号');
fs.copyFileSync(tracked, active);
assert.strictEqual(inspect(root).state, 'available', '逐字节副本应通过');
fs.writeFileSync(active, '#!/bin/sh\nsh scripts/pre-commit-hook.sh\n');
assert.strictEqual(inspect(root).state, 'available', '委托 tracked 脚本应通过');
assert.strictEqual(delegatesTracked('# scripts/pre-commit-hook.sh\necho no-op\n'), false,
  '注释中出现脚本名不得当作委托');
fs.writeFileSync(active, '#!/bin/sh\n# scripts/pre-commit-hook.sh\necho no-op\n');
assert.ok(inspect(root).signals.includes('active-tracked-drift'), '只有注释的假委托必须降级');
fs.writeFileSync(active, '#!/bin/sh\necho custom\n');
assert.ok(inspect(root).signals.includes('active-tracked-drift'), '未知自定义 hook 必须报告漂移');

const methodRoot = path.join(root, 'method');
fs.mkdirSync(path.join(methodRoot, 'templates', 'scripts'), { recursive: true });
fs.writeFileSync(path.join(methodRoot, 'templates', 'scripts', 'pre-commit-hook.sh'), '#!/bin/sh\necho newer\n');
assert.ok(inspect(root, methodRoot).signals.includes('template-project-drift'), '模板与项目副本差异必须可见');
fs.rmSync(path.join(methodRoot, 'templates', 'scripts', 'pre-commit-hook.sh'));
assert.ok(inspect(root, methodRoot).signals.includes('template-not-found'), '方法论模板缺失必须降级');
if (process.platform !== 'win32') {
  fs.copyFileSync(tracked, active);
  fs.chmodSync(active, 0o644);
  assert.ok(inspect(root).signals.includes('active-not-executable'), 'POSIX hook 无执行位必须降级');
}
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-hook-state 正反夹具通过');
