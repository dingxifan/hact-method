#!/usr/bin/env node
'use strict';
const assert = require('assert');
const { sharedAssetConflicts } = require('./check-sprint.js');

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

console.log('✅ check-sprint shared-assets 正反夹具通过');
