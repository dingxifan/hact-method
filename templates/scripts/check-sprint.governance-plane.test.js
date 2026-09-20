#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { governanceWritePath } = require('./check-sprint.js');

const task = 'b-queue/demo-b-001.md';
const review = 'b-reviews/demo-b-001';
assert.ok(governanceWritePath('status.yml', task, review));
assert.ok(governanceWritePath(task, task, review));
assert.ok(governanceWritePath(`${review}/preflight.md`, task, review));
assert.ok(governanceWritePath(`${review}/round-01.md`, task, review));
assert.ok(governanceWritePath('status-reviews/b.yml', task, review));
assert.ok(!governanceWritePath('src/service.ts', task, review));
assert.ok(!governanceWritePath('b-reviews/other-task/round-01.md', task, review));

const source = fs.readFileSync(path.join(__dirname, 'check-sprint.js'), 'utf8');
assert.match(source, /diff_sha256 与 git diff --binary 实际字节不一致/);
assert.match(source, /changed_files 与固定 diff 实际文件集不一致/);
assert.match(source, /implementationFiles = fixed\.names\.filter/);
console.log('✅ check-sprint implementation/governance plane separation keeps full fixed-diff audit');
