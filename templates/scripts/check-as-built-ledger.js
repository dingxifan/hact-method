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
  const templatePlaceholder = /\{(?:N|迁移\/实体\/状态机\/队列定义的实际路径与符号|实体\/枚举\/队列\/转换边\/地基关注点|foundation\/project\/上期契约中的声明|路径#符号或迁移 id|当前真实承载与约束|沿用；或 revise-doc id；或补证据|一致时写「本行 as-built 证据」；异常关闭时写 `修订\/证据路径#锚` 或 revise-doc id；未关闭写 `—`)\}/;
  if (source.includes('<待填>') || templatePlaceholder.test(source)) errors.push('账本仍含模板占位符');
  if (!/^## 证据源\s*$/m.test(source)) errors.push('缺「## 证据源」');
  if (!/^## 对账项\s*$/m.test(source)) errors.push('缺「## 对账项」');
  const rows = source.split(/\r?\n/)
    .filter(line => /^\|/.test(line))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 6 && cells[0] !== '对象' && !/^---+$/.test(cells[0]));
  if (!rows.length) errors.push('对账表至少需要一条本期相关事实');
  for (const cells of rows) {
    if (cells.length !== 8) {
      errors.push(`${cells[0] || '<无对象>'} 使用旧 6 列账本，缺闭合状态/闭合证据；须迁移为 8 列后再签 G1`);
      continue;
    }
    const [subject, declared, evidence, observed, relation, closure, action, closedBy] = cells;
    if (![subject, declared, evidence, observed, relation, closure, action, closedBy].every(Boolean)) {
      errors.push(`对账行存在空格：${subject || '<无对象>'}`);
      continue;
    }
    if (!/`[^`]+`/.test(evidence)) errors.push(`${subject} 的 as-built 证据须含反引号路径/符号锚`);
    if (!['一致', '漂移', '未知'].includes(relation)) errors.push(`${subject} 的关系「${relation}」非法`);
    if (!['open', 'closed', 'blocked'].includes(closure)) errors.push(`${subject} 的闭合状态「${closure}」非法`);
    if (closure !== 'closed') errors.push(`${subject} 尚未闭合（${closure}），G1 前必须关闭`);
    if (relation === '未知' && closure === 'closed') errors.push(`${subject} 不能以「未知 + closed」冒充事实闭合；补证后须改判一致或漂移`);
    if (['漂移', '未知'].includes(relation)) {
      if (/^(无|none|n\/a|-|—|需补证据|待处理)$/i.test(action)) errors.push(`${subject} 为${relation}但没有已执行的处置动作`);
      if (!/`[^`]+`|revise-doc|[a-z0-9]+-(?:rd|b)-\d+/i.test(closedBy))
        errors.push(`${subject} 为${relation}但闭合证据不是修订/证据锚或 revise-doc id`);
    } else if (!/本行\s*as-built\s*证据|`[^`]+`/i.test(closedBy)) {
      errors.push(`${subject} 一致项的闭合证据须指向本行 as-built 锚`);
    }
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
