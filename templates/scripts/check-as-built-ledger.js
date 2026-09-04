#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

function validate(iteration, root) {
  const v0 = path.join(root, 'iterations', 'v0');
  if (!fs.existsSync(v0) || iteration === 'v0') return [];
  const ledger = path.join(root, 'iterations', iteration, 'as-built-ledger.md');
  const errors = [];
  if (!fs.existsSync(ledger)) return [`走过 V0 的 ${iteration} 缺 as-built-ledger.md`];
  const source = fs.readFileSync(ledger, 'utf8');
  const templatePlaceholder = /\{(?:N|迁移\/实体\/状态机\/队列定义的实际路径与符号|实体\/枚举\/队列\/转换边\/地基关注点|foundation\/project\/上期契约中的声明|路径#符号或迁移 id|当前真实承载与约束|沿用；或 revise-doc id；或需补证据)\}/;
  if (source.includes('<待填>') || templatePlaceholder.test(source)) errors.push('账本仍含模板占位符');
  if (!/^## 证据源\s*$/m.test(source)) errors.push('缺「## 证据源」');
  if (!/^## 对账项\s*$/m.test(source)) errors.push('缺「## 对账项」');
  const rows = source.split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length === 6 && cells[0] !== '对象' && !/^---+$/.test(cells[0]));
  if (!rows.length) errors.push('对账表至少需要一条本期相关事实');
  for (const [subject, declared, evidence, observed, relation, action] of rows) {
    if (![subject, declared, evidence, observed, relation, action].every(Boolean)) {
      errors.push(`对账行存在空格：${subject || '<无对象>'}`);
      continue;
    }
    if (!/`[^`]+`/.test(evidence)) errors.push(`${subject} 的 as-built 证据须含反引号路径/符号锚`);
    if (!['一致', '漂移', '未知'].includes(relation)) errors.push(`${subject} 的关系「${relation}」非法`);
    if (['漂移', '未知'].includes(relation) && /^(无|none|n\/a|-|—)$/i.test(action))
      errors.push(`${subject} 为${relation}但没有处置动作`);
  }
  return errors;
}

function main() {
  const iteration = process.argv[2];
  const root = path.resolve(process.argv[3] || process.cwd());
  if (!/^v\d+(?:\.\d+)*$/.test(iteration || '')) {
    console.error('用法: node check-as-built-ledger.js <vN|vN.M> [项目根]');
    process.exit(2);
  }
  const errors = validate(iteration, root);
  if (errors.length) {
    console.error(`❌ ${iteration} as-built 对账账本失败：`);
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`✅ ${iteration} as-built 对账账本通过（无 V0 时为 not-required）`);
}

if (require.main === module) main();
module.exports = { validate };
