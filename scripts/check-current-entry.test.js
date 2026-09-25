#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { validate } = require('./check-current-entry');

function write(root, relative, text) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-current-entry-'));
try {
  write(root, 'AGENTS.md', 'read BRIEF, STATUS and current plan\n');
  write(root, 'BRIEF.md', '# BRIEF\n当前唯一执行基线\n## 关键设计决策\n历史\n');
  write(root, 'STATUS.md', '# STATUS\n当前阶段：当前版收敛\n以下保留各批历史记录\n');
  write(root, '_meta/.current_plan', '_meta/plans/current-only\n');
  write(root, '_meta/plans/current-only/task_plan.md', '# 当前版 current-only\n');
  write(root, 'tasks/develop.md', '# develop\n');
  write(root, '.gitignore', '.claude/\n');
  assert.deepStrictEqual(validate(root), []);

  write(root, 'STATUS.md', '# STATUS\n当前阶段：第三阶段·写执行层规范\n以下保留各批历史记录\n');
  assert(validate(root).some(error => error.includes('active retired route')));
  write(root, 'STATUS.md', '# STATUS\n当前阶段：当前版收敛\n以下保留各批历史记录\n');

  write(root, 'tasks/develop.md', 'read specs-execution/develop.md\n');
  assert(validate(root).some(error => error.includes('retired runtime artifact')));
  write(root, 'tasks/develop.md', '# develop\n');

  write(root, 'tasks/develop.md', 'maintain review audit archive / index and count\n');
  assert(validate(root).some(error => error.includes('retired review archive')));
  write(root, 'tasks/develop.md', '# develop\n');

  write(root, '_meta/.current_plan', '_meta/plans/missing\n');
  assert(validate(root).some(error => error.includes('current plan target missing')));
  console.log('PASS: current-entry stale-reference fixtures');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
