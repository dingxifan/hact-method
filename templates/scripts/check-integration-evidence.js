#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function clean(cell) { return String(cell || '').trim().replace(/^`|`$/g, ''); }

function validate(resultFile, root = process.cwd()) {
  const errors = [];
  const absoluteResult = path.resolve(root, resultFile);
  if (!fs.existsSync(absoluteResult)) return [`结果文件不存在：${resultFile}`];
  const rows = fs.readFileSync(absoluteResult, 'utf8').split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length && cells[0] !== '#' && !/^---+$/.test(cells[0]));
  if (!rows.length) return ['结果表至少需要一条场景'];
  for (const cells of rows) {
    if (cells.length !== 9) { errors.push(`${cells[0] || '<无序号>'} 使用旧结果表，缺证据/未运行原因列`); continue; }
    const [id, , , result, evidence, notRunReason] = cells;
    if (!['✅', '❌', '未运行'].includes(result)) { errors.push(`${id}: 结果「${result}」非法`); continue; }
    if (result === '未运行') {
      if (!notRunReason || /^(?:—|-|无|none)$/i.test(notRunReason)) errors.push(`${id}: 未运行必须写原因与移交`);
      continue;
    }
    if (!evidence || /^(?:—|-|无|none)$/i.test(evidence)) { errors.push(`${id}: 已执行但无证据路径`); continue; }
    const paths = evidence.split(/<br\s*\/?>|[,，]/i).map(clean).filter(Boolean);
    for (const relative of paths) {
      const normalized = relative.replace(/\\/g, '/');
      if (!/^integration-tests\/evidence\/v[^/]+\/[^/]+\//.test(normalized)) {
        errors.push(`${id}: 证据不在共同目录 integration-tests/evidence/vN/{场景-id}/：${relative}`);
        continue;
      }
      const absolute = path.resolve(root, normalized);
      const rootAbsolute = path.resolve(root);
      if (!absolute.startsWith(rootAbsolute + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile())
        errors.push(`${id}: 证据文件不存在或越界：${relative}`);
    }
  }
  return errors;
}

function main() {
  const file = process.argv[2];
  const root = path.resolve(process.argv[3] || process.cwd());
  if (!file) { console.error('用法: node check-integration-evidence.js <result-file> [项目根]'); process.exit(2); }
  const errors = validate(file, root);
  if (errors.length) {
    console.error('❌ 联调证据契约失败：');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log('✅ 联调证据契约通过');
}

if (require.main === module) main();
module.exports = { validate };
