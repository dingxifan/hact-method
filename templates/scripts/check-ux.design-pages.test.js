#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-ux-pages-'));
const script = path.join(__dirname, 'check-ux.js');
function write(rel, text) { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
function run() { return childProcess.spawnSync(process.execPath, [script, 'v3', root], { encoding: 'utf8' }); }

write('iterations/v3/prd.md', '## 核心功能\n### 功能：退款审批 `新增`\n**draft-ux**：需要\n**Acceptance Criteria**：\n- AC-01\n');
write('iterations/v3/ux-flows.md', '## 场景列表\n- S1：审批\n## 流程图\n```mermaid\nflowchart TD\nA-->B\n```\n');
write('iterations/v3/prototype-map.md', '## 前端 AC 覆盖\n| AC | 场景 | HTML 锚点 |\n|---|---|---|\n| AC-01 | S1 | #approve |\n');
write('iterations/v3/prototype.html', '<button id="approve">approve</button>');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 旧页面\n');
assert.match(run().stderr, /退款审批/, '已有全局基线但新增页面缺规格必须失败');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 退款\n');
assert.match(run().stderr, /退款审批/, '旧页面前缀不得冒充新功能页面');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 退款审批页\n');
assert.strictEqual(run().status, 0, '补入本期页面规格后应通过');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-ux design 页面覆盖夹具通过');
