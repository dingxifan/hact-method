#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const REVIEW_ID = 'demo-b-101';
const ITERATION_ID = 'demo-v1-001';
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-review-archive-'));
const checkSprint = path.join(__dirname, 'check-sprint.js');

function write(rel, contents) {
  const target = path.join(tempRoot, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

function git(args, encoding = 'utf8') {
  return childProcess.execFileSync('git', args, {
    cwd: tempRoot,
    encoding,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function run(...args) {
  return childProcess.spawnSync(process.execPath, [checkSprint, ...args, tempRoot], {
    cwd: tempRoot,
    encoding: 'utf8',
  });
}

function diffEvidence(base, head) {
  const bytes = git(['diff', '--binary', base, head], null);
  const names = git(['diff', '--name-only', '-z', base, head], null)
    .toString('utf8').split('\0').filter(Boolean).sort();
  return { hash: crypto.createHash('sha256').update(bytes).digest('hex'), names };
}

function archiveIndex({ file = 'status-reviews/b.yml', count = 1, iteration = 'null', live = '[]' } = {}) {
  return `code_review_archives:
  - iteration: ${iteration}
    file: ${file}
    count: ${count}
code_reviews: ${live}
`;
}

try {
  git(['init', '-b', 'main']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);

  write(`b-queue/${REVIEW_ID}.md`, `---
package-schema: 2
task-id: ${REVIEW_ID}
module: archive
task_type: dev-backend
layers: [backend]
source: bug
risk: standard
status: merged
reference: [project.md § 验证入口]
files: [src/archive.js]
title: 审查归档
description: 主文件过大 → 归档后仍可审计
acceptance-criteria:
  - intent: 归档条目仍可定位 oracle: --review 通过
---
`);
  write('src/archive.js', 'module.exports = true;\n');
  git(['add', '.']);
  git(['commit', '-m', 'base']);
  const baseRef = git(['rev-parse', 'HEAD']).trim();
  const baseTree = git(['rev-parse', 'HEAD^{tree}']).trim();
  write('src/archive.js', 'module.exports = "archived";\n');
  git(['add', 'src/archive.js']);
  const reviewedHead = git(['write-tree']).trim();
  const evidence = diffEvidence(baseTree, reviewedHead);

  write(`b-reviews/${REVIEW_ID}/preflight.md`, `---
task_id: ${REVIEW_ID}
timing: before-code
base_ref: ${baseRef}
base_tree: ${baseTree}
result: pass
---
`);
  write(`b-reviews/${REVIEW_ID}/round-01.md`, `---
schema: develop-review-round/v2
task_id: ${REVIEW_ID}
round: 1
mode: full
risk: standard
prior_report: null
target_finding_ids: []
base_ref: ${baseRef}
reviewed_base: ${baseTree}
reviewed_head: ${reviewedHead}
diff_sha256: ${evidence.hash}
changed_files:
  - src/archive.js
escalate_to_full: false
conclusion: pass
---

## Findings

\`\`\`yaml
findings: []
\`\`\`
`);

  const reviewEntry = `  - iteration: null
    task_id: ${REVIEW_ID}
    conclusion: 通过
    rounds: 1
    code_rounds: 1
    spec_rounds: 0
    freshness: pass
    review_report_dir: b-reviews/${REVIEW_ID}
    review_evidence_version: develop-review-round/v2
`;
  const archiveBody = `code_reviews:\n${reviewEntry}`;
  write('status-reviews/b.yml', archiveBody);
  write('status.yml', archiveIndex());
  let result = run('--review', REVIEW_ID);
  assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);

  write('status.yml', archiveIndex({ live: `\n${reviewEntry}` }));
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '主文件与归档同 task_id 必须失败');
  assert.match(result.stdout, /同时出现在 status\.yml 与归档|必须唯一/);

  write('status.yml', archiveIndex({ count: 2 }));
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, 'count 不符必须失败');
  assert.match(result.stdout, /count=2，实际 code_reviews 条目数=1/);

  fs.unlinkSync(path.join(tempRoot, 'status-reviews/b.yml'));
  write('status.yml', archiveIndex());
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '归档文件缺失必须失败');
  assert.match(result.stdout, /归档文件不存在/);
  write('status-reviews/b.yml', archiveBody);

  write('status.yml', archiveIndex({ file: 'status-reviews/../b.yml' }));
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '../ 路径必须失败');
  assert.match(result.stdout, /拒绝绝对路径、\.\./);

  const absolute = path.resolve(tempRoot, 'status-reviews/b.yml').replace(/\\/g, '/');
  write('status.yml', archiveIndex({ file: absolute }));
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '绝对路径必须失败');
  assert.match(result.stdout, /拒绝绝对路径、\.\./);

  write('status-reviews/b.yml', 'tasks: []\n');
  write('status.yml', archiveIndex());
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '归档顶层 schema 错误必须失败');
  assert.match(result.stdout, /顶层必须且只能有 code_reviews/);

  fs.rmSync(path.join(tempRoot, 'status-reviews'), { recursive: true, force: true });
  write('linked-reviews/b.yml', archiveBody);
  fs.symlinkSync(path.join(tempRoot, 'linked-reviews'), path.join(tempRoot, 'status-reviews'),
    process.platform === 'win32' ? 'junction' : 'dir');
  write('status.yml', archiveIndex());
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, '符号链接/junction 必须失败');
  assert.match(result.stdout, /符号链接\/junction/);
  fs.unlinkSync(path.join(tempRoot, 'status-reviews'));
  write('status-reviews/b.yml', archiveBody);

  write('status-reviews/v1.yml', archiveBody);
  write('status.yml', archiveIndex({ file: 'status-reviews/v1.yml' }));
  result = run('--review', REVIEW_ID);
  assert.notStrictEqual(result.status, 0, 'iteration 与 file 错配必须失败');
  assert.match(result.stdout, /iteration=null 必须指向 status-reviews\/b\.yml/);

  write('status-reviews/v1-1.yml', 'code_reviews: []\n');
  write('status.yml', `code_review_archives:
  - iteration: null
    file: status-reviews/b.yml
    count: 1
  - iteration: v1.1
    file: status-reviews/v1-1.yml
    count: 0
code_reviews: []
`);
  result = run('--review', REVIEW_ID);
  assert.strictEqual(result.status, 0, '点号迭代须使用连字符 archive key');

  write('status.yml', `code_reviews:\n${reviewEntry}`);
  const withoutIndex = run('--review', REVIEW_ID);
  assert.strictEqual(withoutIndex.status, 0, '存量 status 无归档索引仍按原路径通过');
  write('status.yml', `code_review_archives: []\ncode_reviews:\n${reviewEntry}`);
  const emptyIndex = run('--review', REVIEW_ID);
  assert.strictEqual(emptyIndex.status, withoutIndex.status);
  assert.strictEqual(emptyIndex.stdout, withoutIndex.stdout, '缺索引与显式空索引输出须逐字节一致');
  assert.strictEqual(emptyIndex.stderr, withoutIndex.stderr);

  const legacyTask = `---
task-id: ${ITERATION_ID}
sprint_id: v1-s1
layers: [backend]
source: sprint
task_type: dev-backend
contract-impact: none
urgency: normal
risk: standard
title: 归档后检查本期
description: 审查条目搬家 → 检查 #9 仍可定位
depends_on: []
files: [src/iteration.js]
asset-writes: []
supersedes: []
ac-format: intent-oracle-v1
acceptance-criteria:
  - |-
    (源：PRD AC-01)
    intent: 审查归档后仍能核对
    oracle: check-sprint v1 退出码为 0
reference: [iterations/v1/trd.md § API, project.md § 验证入口]
context: iteration archive
known-risks: []
do-not: []
escalate-if: []
---
`;
  write(`iterations/v1/queue/${ITERATION_ID}.md`, legacyTask);
  write('iterations/v1/prd.md', '## 核心功能\n- AC-01: intent: 审查归档后仍能核对\n');
  write('iterations/v1/sprint.md', `| task-id | title | layers | 依赖 | 状态 | PR | 交付 |
| ${ITERATION_ID} | 归档后检查本期 | backend | — | [merged] | — | 可并行 |
`);
  const iterationReview = `  - iteration: v1
    task_id: ${ITERATION_ID}
    rounds: 1
`;
  write('status-reviews/v1.yml', `code_reviews:\n${iterationReview}`);
  write('status.yml', `iterations:
  v1:
    gates:
      G5: { signed: true, date: 2026-09-14 }
tasks:
  - id: ${ITERATION_ID}
    source: sprint
    iteration: v1
    layer: backend
    status: merged
    depends_on: []
    delivery: 可并行
code_review_archives:
  - iteration: v1
    file: status-reviews/v1.yml
    count: 1
code_reviews: []
`);
  result = run('v1');
  assert.strictEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(result.stdout, /code_reviews\[\] 无条目/, '检查 #9 必须读取本期归档');
  write('status.yml', fs.readFileSync(path.join(tempRoot, 'status.yml'), 'utf8')
    .replace(/code_review_archives:[\s\S]*?code_reviews: \[\]\n/, 'code_reviews: []\n'));
  result = run('v1');
  assert.notStrictEqual(result.status, 0, '移除归档索引后检查 #9 应重新发现缺条目');
  assert.match(result.stdout, /code_reviews\[\] 无条目/);

  console.log('✅ check-sprint review archive 正反夹具通过');
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  const resolvedOsTemp = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(resolvedOsTemp + path.sep)
      || !path.basename(resolvedTemp).startsWith('hact-review-archive-')) {
    throw new Error(`拒绝清理非测试临时目录：${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
