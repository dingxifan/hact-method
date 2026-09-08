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

write('iterations/v2/prd.md', '## 核心功能\n### 功能：退款审批\n- AC-01: intent: 可审批退款\n');
write('iterations/v2/sprint.md', '| task-id | title | layers | 依赖 | 状态 | PR | 交付 |\n| demo-v2-001 | 退款审批页 | frontend | — | [可取] | — | 可并行 |\n');
write('status.yml', 'tasks:\n  - id: demo-v2-001\n    source: sprint\n    iteration: v2\n    layer: frontend\n    status: 可取\n    depends_on: []\n    delivery: 可并行\n');
write('design.md', '## 〇、视觉冒烟锚点\n## 八、页面规格\n### 退款审批页\n');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页']));
assert.strictEqual(run().status, 0, '新任务无 Standards 文件或引用字段仍能通过完整 G3 检查');
write('iterations/v2/sprint.md', '| task-id | title | layers | 依赖 | 交付 |\n| demo-v2-001 | 退款审批页 | frontend | — | 可并行 |\n');
assert.strictEqual(run().status, 0, '任务包无状态、sprint 五列规划仍通过 G3');

write('iterations/v2/ux-flows.md', '## 场景列表\n### 用户任务：U1 完成审批\n- S1：确认结果\n');
assert.match(run().stdout, /reference 用户任务/, '用户任务原文存在时前端必须承接 U-id');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页', 'ux-flows.md § U1 S1']));
assert.strictEqual(run().status, 0, '真实 U/S 锚可通过');
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页', 'ux-flows.md § U1 S9']));
assert.match(run().stdout, /不存在的 U\/S-id/, '不存在的场景不能因 U-id 正确而放行');
fs.unlinkSync(path.join(root, 'iterations/v2/ux-flows.md'));
write('iterations/v2/queue/demo-v2-001.md', task('sliced-v1', ['design.md § 全局视觉基线', 'design.md § 退款审批页']));
assert.doesNotMatch(run().stdout, /\[reference design\]/, '有效全局+页面 design 锚不应报 design finding');
assert.doesNotMatch(run().stdout, /字段「supersedes」/, 'schema 2 的 supersedes: [] 是明确无取代关系，不得误报为空字段');
write('design.md', '## 〇、视觉冒烟锚点\n## 十一、页面规格（v1.2）\n### 退款审批页\n');
assert.doesNotMatch(run().stdout, /\[reference design\]/, '页面规格结构不得绑定固定章节编号或禁止标题后缀');
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
const legacyTask = task('', ['design.md § 色彩系统'], false)
  .replace(/^contract-impact:.*\n/m, '')
  .replace(/^asset-writes:.*\n/m, '')
  .replace(/^supersedes:.*\n/m, '');
write('iterations/v2/queue/demo-v2-001.md', legacyTask);
assert.strictEqual(run().status, 0, '旧包缺新增字段应兼容通过');
const modernTask = legacyTask.replace('---\n', '---\npackage-schema: 2\nmodule: refund\n');
write('iterations/v2/queue/demo-v2-001.md', modernTask);
assert.match(run().stdout, /字段「contract-impact」|字段「asset-writes」|字段「supersedes」/, 'schema 2 仍强制新增字段');
write('iterations/v2/queue/demo-v2-001.md', modernTask.replace('package-schema: 2', 'package-schema: 3'));
assert.match(run().stdout, /未知 package-schema=3/, '未知版本不得当存量放行');

const mergedStatus = 'tasks:\n  - id: demo-v2-001\n    source: sprint\n    iteration: v2\n    layer: frontend\n    status: merged\n    depends_on: []\n    delivery: 可并行\n';
write('iterations/v2/sprint.md', '| task-id | title | layers | 依赖 | 状态 | PR | 交付 |\n| demo-v2-001 | 退款审批页 | frontend | — | [merged] | — | 可并行 |\n');
write('iterations/v2/queue/demo-v2-001.md', legacyTask);
write('status.yml', mergedStatus + 'code_reviews:\n  - task_id: demo-v2-001\n    rounds: 1\n    implementation_started_at: 2026-08-01T00:00:00Z\n');
assert.strictEqual(run().status, 0, '历史包不因部分新审计字段倒填不全而失败');
assert.match(run().stdout, /存量任务包仅核历史审查条目存在/, '兼容放行须明确审计边界');
assert.doesNotMatch(run().stdout, /均有合法 rounds、墙钟/, '旧包不得被宣称已通过新版完整审计');
write('iterations/v2/queue/demo-v2-001.md', task('legacy-full', ['design.md 全文（存量）']));
assert.match(run().stdout, /schema 2 缺必需 report 审计字段/, 'schema 2 仍校验审计完整性');
write('iterations/v2/queue/demo-v2-001.md', legacyTask);
write('status.yml', mergedStatus);
assert.match(run().stdout, /code_reviews\[\] 无条目/, '旧包仍须保留历史审查条目');

write('iterations/v2/queue/demo-v2-002.md', legacyTask.replaceAll('demo-v2-001', 'demo-v2-002'));
assert.doesNotMatch(run().stdout, /同写 .*但 depends_on/, '旧包重叠文件不受新共享写集契约追溯阻断');
assert.match(run().stdout, /涉及旧包的共享写入需人工核对/, '旧包共享写入须留人工确认');
write('iterations/v2/queue/demo-v2-001.md', task('legacy-full', ['design.md 全文（存量）']));
assert.doesNotMatch(run().stdout, /同写 .*但 depends_on/, '新旧混合包不按新契约追溯阻断');
write('iterations/v2/queue/demo-v2-002.md', task('legacy-full', ['design.md 全文（存量）']).replaceAll('demo-v2-001', 'demo-v2-002'));
assert.match(run().stdout, /同写 .*但 depends_on/, '两个 schema 2 包同文件无依赖仍应阻断');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-sprint design-reference 正反夹具通过');
