#!/usr/bin/env node
'use strict';
// B 类任务包硬边界：只能修既有行为，不能夹带共享契约修订。
const fs = require('fs');

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/m);
  if (!match) return null;
  const lines = match[1].split(/\r?\n/);
  const out = {};
  let key = null;
  for (const line of lines) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*?)\s*(?:#.*)?$/);
    if (top) {
      key = top[1];
      out[key] = top[2] === '[]' ? [] : top[2].replace(/^['"]|['"]$/g, '');
      continue;
    }
    const item = line.match(/^\s+-\s+(.+?)\s*(?:#.*)?$/);
    if (item && key) {
      if (!Array.isArray(out[key])) out[key] = [];
      out[key].push(item[1]);
    }
  }
  return out;
}

function contractPathHits(files) {
  const patterns = [
    /(^|\/)iterations\/v[^/]+\/(prd|trd|gates)\.md$/i,
    /(^|\/)(standards-(shared|frontend|backend)|foundation|design)\.md$/i,
    /(^|\/)(migrations?|schema|openapi|swagger|contracts?|shared\/types?)(\/|\.|$)/i,
    /\.(proto|avsc)$/i,
  ];
  return files.filter(file => patterns.some(pattern => pattern.test(String(file).replace(/\\/g, '/'))));
}

function validate(file) {
  const source = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(source);
  const errors = [];
  if (!fm) return ['缺 YAML frontmatter'];
  if (!['bug', 'optimization'].includes(String(fm.source || '').toLowerCase()))
    errors.push(`source=${fm.source || '<缺失>'}，B 类只能 bug/optimization`);
  if (String(fm['contract-impact'] || '').toLowerCase() !== 'none')
    errors.push('contract-impact 必须为 none；若为 governed 或需修订契约，应退出 B 类');
  if (!('asset-writes' in fm)) errors.push('缺 asset-writes；无共享写集也必须填 []');
  const files = Array.isArray(fm.files) ? fm.files : [];
  const hits = contractPathHits(files);
  if (hits.length) errors.push(`files 命中共享契约/迁移路径：${hits.join('、')}`);
  return errors;
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('用法: node check-b-task.js <b-queue/task-id.md> [...]');
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const errors = validate(file);
    if (errors.length) {
      failed = true;
      console.error(`❌ ${file}`);
      errors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log(`✅ ${file}：B 类契约边界通过`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
module.exports = { parseFrontmatter, contractPathHits, validate };
