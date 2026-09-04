#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-ready-'));
const script = path.join(__dirname, 'check-sprint.js');
function write(relative, source) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
function task(id, deps) {
  return `---\ntask-id: ${id}\ndepends_on: [${deps.join(', ')}]\nfiles: [src/${id}.ts]\nasset-writes: []\n---\n`;
}
function status(aStatus) {
  return `tasks:\n  - id: demo-v1-001\n    status: ${aStatus}\n  - id: demo-v1-002\n    status: 可取\n`;
}
function ready(ids) {
  return childProcess.spawnSync(process.execPath, [script, '--ready', ids, root], { cwd: root, encoding: 'utf8' });
}

write('iterations/v1/queue/demo-v1-001.md', task('demo-v1-001', []));
write('iterations/v1/queue/demo-v1-002.md', task('demo-v1-002', ['demo-v1-001']));
write('status.yml', status('merged'));
assert.strictEqual(ready('demo-v1-002').status, 0, '外部依赖 merged 应可认领');
write('status.yml', status('taken-by'));
assert.strictEqual(ready('demo-v1-002').status, 1, '外部依赖未 merged 必须阻断');
write('status.yml', status('可取'));
assert.strictEqual(ready('demo-v1-001,demo-v1-002').status, 0, '同批依赖拓扑闭合应通过');
assert.strictEqual(ready('demo-v1-002,demo-v1-001').status, 1, '同批依赖逆序必须阻断');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint ready 正反夹具通过');
