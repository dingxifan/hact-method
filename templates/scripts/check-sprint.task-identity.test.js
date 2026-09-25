#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

const checker = path.resolve(__dirname, 'check-sprint.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-duplicate-task-id-'));
const git = args => childProcess.execFileSync('git', args, { cwd: temp, encoding: 'utf8' }).trim();
fs.mkdirSync(temp, { recursive: true });
git(['init', '-q']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
fs.writeFileSync(path.join(temp, 'status.yml'), 'tasks:\n  - id: repeated\n    iteration: v1\n    source: sprint\n    status: merged\n');
git(['add', '.']); git(['commit', '-qm', 'baseline']);
fs.writeFileSync(path.join(temp, 'status.yml'), 'tasks:\n  - id: repeated\n    iteration: v1\n    source: sprint\n    status: merged\n  - id: repeated\n    iteration: v2\n    source: manual-test\n    status: 可取\n');
git(['add', 'status.yml']);
const result = childProcess.spawnSync(process.execPath, [checker, '--staged', temp], { cwd: temp, encoding: 'utf8' });
assert.notStrictEqual(result.status, 0);
assert.match(result.stdout, /重复 task id/);
assert.doesNotMatch(result.stdout, /找不到 A\/B 权威任务包/);
if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
fs.rmSync(temp, { recursive: true, force: true });
console.log('✅ duplicate task id fails closed before review selection');
