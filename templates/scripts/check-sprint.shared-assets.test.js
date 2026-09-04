#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { sharedAssetConflicts, dependencyReadinessErrors } = require('./check-sprint.js');

const value = items => ({ type: 'list', text: '', items });
const pkg = (id, deps, files, assets) => ({
  id,
  deps,
  fm: { files: value(files), 'asset-writes': value(assets) },
});

const unordered = [
  pkg('demo-v1-001', [], ['src/a.ts'], ['enum:OrderStatus']),
  pkg('demo-v1-002', [], ['src/b.ts'], ['enum:OrderStatus']),
];
assert.strictEqual(sharedAssetConflicts(unordered).length, 1, '同一共享资产无依赖必须报冲突');

const ordered = [
  pkg('demo-v1-001', [], ['src/a.ts'], ['enum:OrderStatus']),
  pkg('demo-v1-002', ['demo-v1-001'], ['src/b.ts'], ['enum:OrderStatus']),
];
assert.strictEqual(sharedAssetConflicts(ordered).length, 0, '存在依赖路径时应允许串行');

const sameFile = [
  pkg('demo-v1-001', [], ['src/shared.ts L10-20'], []),
  pkg('demo-v1-002', [], ['src/shared.ts L40-50'], []),
];
assert.strictEqual(sharedAssetConflicts(sameFile).length, 1, '同一文件不同标注仍按共享写入处理');

const statuses = [
  { id: 'demo-v1-001', status: 'merged' },
  { id: 'demo-v1-002', status: '可取' },
  { id: 'demo-v1-003', status: '可取' },
];
assert.deepStrictEqual(dependencyReadinessErrors(
  [pkg('demo-v1-002', ['demo-v1-001'], [], [])], ['demo-v1-002'], statuses), [],
'外部依赖已 merged 时可认领');
assert.ok(dependencyReadinessErrors(
  [pkg('demo-v1-002', ['demo-v1-001'], [], [])], ['demo-v1-002'],
  statuses.map(task => task.id === 'demo-v1-001' ? { ...task, status: 'taken-by' } : task)).length,
'外部依赖未 merged 时必须阻断');
assert.deepStrictEqual(dependencyReadinessErrors(
  [pkg('demo-v1-002', [], [], []), pkg('demo-v1-003', ['demo-v1-002'], [], [])],
  ['demo-v1-002', 'demo-v1-003'], statuses), [], '同批依赖按拓扑序可认领');
assert.ok(dependencyReadinessErrors(
  [pkg('demo-v1-002', [], [], []), pkg('demo-v1-003', ['demo-v1-002'], [], [])],
  ['demo-v1-003', 'demo-v1-002'], statuses).length, '同批依赖逆序必须阻断');

console.log('✅ check-sprint shared-assets 正反夹具通过');
