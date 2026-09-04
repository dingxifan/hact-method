#!/usr/bin/env node
'use strict';
const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-design-ref-'));
const script = path.join(__dirname, 'check-sprint.js');
function write(rel, text) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
function task(format, refs, schema2 = true) {
  const lines = [
    '---',
    ...(schema2 ? ['package-schema: 2', 'module: refund'] : []),
    'task-id: demo-v2-001',
    'sprint_id: v2-s1',
    'layers: [frontend]',
    'source: sprint',
    'task_type: dev-frontend',
    'contract-impact: governed',
    'urgency: normal',
    'risk: standard',
    'title: 退款审批页',
    'description: 无审批页 → 可审批',
    'depends_on: []',
    'files: [src/Refund.vue]',
    'asset-writes: []',
    'supersedes: []',
    'ac-format: intent-oracle-v1',
    'acceptance-criteria:',
    '  - |- ',
    '    (源：PRD AC-01)',
    '    intent: 可审批退款',
    '    oracle: 点击通过后状态为已通过',
    'relevant-standards: []',
    ...(format ? [`design-reference-format: ${format}`] : []),
    'reference:',
    ...refs.map(ref => `  - ${ref}`),
    'context: Refund.vue',
    'known-risks: []',
    'do-not: []',
    'escalate-if: []',
    '---',
    '',
  ];
  return lines.join('\n');
}
function run() {
  return childProcess.spawnSync(process.execPath, [script, 'v2', root], { cwd: root, encoding: 'utf8' });
}

write('iterations/v2/prd.md', '## 核心功能\n### 功能：退款审批\n- AC-01 intent: 可审批退款\n');
write('iterations/v2/sprint.md', '| task-id | title | layers | 依赖 | 状态 | PR | 交付 |\n| demo-v2-001 | 退款审批页 | frontend | — | [可取] | — | 可并行 |\n');
write('status.yml', 'tasks:\n  - id: demo-v2-001\n    source: sprint\n    iteration: v2\n    layer: frontend\n    status: 可取\n    depends_on: []\n    delivery: 可并行\n');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 退款审批页\n');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页']));
assert.doesNotMatch(run().stdout, /\[reference design\]/, '有效全局+页面 design 锚不应报 design finding');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['ux-flows.md § 退款审批']));
assert.match(run().stdout, /reference design/, 'frontend 缺 design 锚必须失败');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 不存在页']));
assert.match(run().stdout, /真实页面规格标题/, '不存在的页面标题必须失败');
write('design.md', '## 一、全局\n### 退款审批页\n## 八、页面规格\n');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页']));
assert.match(run().stdout, /真实页面规格标题/, '全局区同名三级标题不得冒充页面规格');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 退款审批页\n');
write('iterations/v2/queue/demo-v2-001.md', task('legacy-full', ['design.md 全文（存量）']));
assert.match(run().stdout, /不得继续用 legacy-full/, '现代 design 不得伪装存量全文');
write('design.md', '## 一、色彩系统\n### 主色\n');
write('iterations/v2/queue/demo-v2-001.md', task('legacy-full', ['design.md 全文（存量）']));
assert.doesNotMatch(run().stdout, /reference design|reference 稳定锚/, '真实旧 design + legacy-full 应兼容通过');
write('iterations/v2/queue/demo-v2-001.md', task('', ['design.md § 色彩系统'], false));
assert.doesNotMatch(run().stdout, /reference design/, '缺新 schema 字段的旧包不得被新 design 契约阻断');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint design-reference 正反夹具通过');
