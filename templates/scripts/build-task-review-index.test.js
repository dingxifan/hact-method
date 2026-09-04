#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-review-index-'));
const script = path.join(__dirname, 'build-task-review-index.js');
function write(rel, text) { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function pkg(id, dep, marker) {
  return `---\npackage-schema: 2\ntask-id: ${id}\nmodule: billing\nlayers: [backend]\ntask_type: dev-backend\nrisk: standard\ndepends_on: [${dep}]\nfiles: [src/${id}.ts]\nasset-writes: [db:refunds]\nacceptance-criteria:\n  - |-\n    (源：PRD AC-07)\n    intent: refund\n    oracle: ok\ndescription: ${marker.repeat(12000)}\n---\n`;
}
write('iterations/v2/queue/demo-v2-001.md', pkg('demo-v2-001', '', 'X'));
write('iterations/v2/queue/demo-v2-002.md', pkg('demo-v2-002', 'demo-v2-001', 'Y'));
const run = childProcess.spawnSync(process.execPath, [script, 'v2', root], { encoding: 'utf8' });
assert.strictEqual(run.status, 0);
assert.ok(run.stdout.length < 3000, '最小索引不应随任务包大字段线性膨胀');
assert.ok(!run.stdout.includes('XXXXX') && !run.stdout.includes('YYYYY'), '索引不得携带 description/normative prose');
const data = JSON.parse(run.stdout);
assert.deepStrictEqual(data.tasks[1].depends_on, ['demo-v2-001']);
assert.deepStrictEqual(data.tasks[0].ac_refs, ['AC-07']);
assert.deepStrictEqual(data.tasks[0].asset_writes, ['db:refunds']);
assert.strictEqual(data.tasks[0].module, 'billing', 'module 必须来自生产 schema 字段');
write('iterations/v2/queue/demo-v2-002.md', pkg('demo-v2-002', 'demo-v2-001', 'Y').replace('module: billing\n', ''));
const missingModule = childProcess.spawnSync(process.execPath, [script, 'v2', root], { encoding: 'utf8' });
assert.notStrictEqual(missingModule.status, 0, 'schema 2 缺 module 不得从 context/文件名猜测');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ task-review-index 最小索引夹具通过');
