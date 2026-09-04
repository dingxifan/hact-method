#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { parseFrontmatter, listItems, scalarText } = require('./check-sprint');

const version = process.argv[2];
const root = path.resolve(process.argv[3] || '.');
if (!version || !/^v\d+(\.\d+)*$/.test(version)) {
  console.error('用法: node build-task-review-index.js <vN|vN.M> [项目根]');
  process.exit(2);
}
const queue = path.join(root, 'iterations', version, 'queue');
if (!fs.existsSync(queue)) {
  console.error(`任务目录不存在: ${queue}`);
  process.exit(1);
}
const acIds = value => [...new Set(listItems(value).flatMap(item => item.match(/AC-\d+/gi) || []).map(id => id.toUpperCase()))].sort();
const tasks = fs.readdirSync(queue).filter(name => name.endsWith('.md')).sort().map(name => {
  const fm = parseFrontmatter(path.join(queue, name));
  if (!fm) throw new Error(`${name}: 缺 YAML frontmatter`);
  const packageSchema = scalarText(fm['package-schema']);
  const moduleName = scalarText(fm.module);
  if (packageSchema === '2' && !moduleName) throw new Error(`${name}: schema 2 缺 module`);
  return {
    task_id: scalarText(fm['task-id']) || name.replace(/\.md$/, ''),
    module: moduleName || null,
    layers: listItems(fm.layers),
    task_type: scalarText(fm.task_type),
    risk: scalarText(fm.risk) || 'standard',
    ac_refs: acIds(fm['acceptance-criteria']),
    depends_on: listItems(fm.depends_on),
    files: listItems(fm.files),
    asset_writes: listItems(fm['asset-writes']),
  };
});
process.stdout.write(`${JSON.stringify({ schema: 'task-review-index/v1', version, tasks }, null, 2)}\n`);
