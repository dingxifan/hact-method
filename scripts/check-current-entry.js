#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function read(root, relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) throw new Error(`missing current entry: ${relative}`);
  return fs.readFileSync(file, 'utf8');
}

function validate(root = process.cwd()) {
  const errors = [];
  const required = ['AGENTS.md', 'BRIEF.md', 'STATUS.md', '_meta/.current_plan'];
  for (const file of required) {
    try { read(root, file); } catch (error) { errors.push(error.message); }
  }
  if (errors.length) return errors;

  const pointer = read(root, '_meta/.current_plan').trim().replace(/\\/g, '/');
  if (!/^_meta\/plans\/[^/]+$/.test(pointer)) errors.push('current plan pointer must name one plan directory');
  else {
    const plan = path.join(root, pointer, 'task_plan.md');
    if (!fs.existsSync(plan)) errors.push(`current plan target missing: ${pointer}/task_plan.md`);
    else if (!/当前版|current-only/i.test(fs.readFileSync(plan, 'utf8')))
      errors.push('current plan does not declare the current-only model');
  }

  const briefCurrent = read(root, 'BRIEF.md').split(/^## 关键设计决策/m)[0];
  const statusCurrent = read(root, 'STATUS.md').split(/^以下保留各批历史记录/m)[0];
  const checks = [
    ['BRIEF current section', briefCurrent],
    ['STATUS current section', statusCurrent],
  ];
  const retiredActive = [
    /当前阶段[^\n]*(写执行层规范|specs-execution)/i,
    /当前计划[^\n]*review-architecture-optimization/i,
    /\|\s*第二阶段：写结构层规范\s*\|/,
    /\|\s*第三阶段：写执行层规范\s*\|/,
  ];
  for (const [label, text] of checks) for (const pattern of retiredActive)
    if (pattern.test(text)) errors.push(`${label} retains an active retired route: ${pattern}`);

  const taskRoot = path.join(root, 'tasks');
  if (!fs.existsSync(taskRoot)) errors.push('tasks/ missing');
  else for (const name of fs.readdirSync(taskRoot).filter(name => name.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(taskRoot, name), 'utf8');
    if (/runtime-crossing|status-reviews|specs-(?:structural|execution)|review_projection|build-review-projection/i.test(text))
      errors.push(`tasks/${name} references a retired runtime artifact`);
    if (/review\s+(?:audit\s+)?archive|archive\s*\/\s*index|archive[^\n]*(?:count|persistence)|审查归档|归档[^\n]*(?:索引|计数|持久化)/i.test(text))
      errors.push(`tasks/${name} requires a retired review archive`);
  }

  const ignore = read(root, '.gitignore');
  if (/scripts\/hact-watcher\//.test(ignore)) errors.push('.gitignore retains retired hact-watcher entries');
  return errors;
}

if (require.main === module) {
  const errors = validate(path.resolve(process.argv[2] || '.'));
  if (errors.length) {
    for (const error of errors) console.error(`FAIL: ${error}`);
    process.exit(1);
  }
  console.log('PASS: current entry documents point only to the current model');
}

module.exports = { validate };
