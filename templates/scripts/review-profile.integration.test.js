#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildReviewProfileFromText } = require('./review-profile');

const TASK_ID = 'demo-b-101';
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-review-profile-'));
const checkSprint = path.join(__dirname, 'check-sprint.js');
const reviewProfileScript = path.join(__dirname, 'review-profile.js');

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

function diffEvidence(base, head) {
  const bytes = git(['diff', '--binary', base, head], null);
  const names = git(['diff', '--name-only', '-z', base, head], null)
    .toString('utf8').split('\0').filter(Boolean).sort();
  return { hash: crypto.createHash('sha256').update(bytes).digest('hex'), names };
}

function runAudit(taskId = TASK_ID) {
  return childProcess.spawnSync(process.execPath, [checkSprint, '--review', taskId, tempRoot], {
    cwd: tempRoot,
    encoding: 'utf8',
  });
}

function reportText({ taskId, round, mode, profile, prior, targets, baseRef, base, head,
  changedFiles, started, completed, conclusion, standardsChecked, body = 'findings: []' }) {
  const evidence = diffEvidence(base, head);
  assert.deepStrictEqual(evidence.names, [...changedFiles].sort(), 'fixture changed files must be real');
  return `---
schema: develop-review-round/v2
task_id: ${taskId}
round: ${round}
mode: ${mode}
risk: ${taskId === 'foundation' ? 'sensitive' : 'standard'}
review_profile: ${profile}
prior_report: ${prior || 'null'}
target_finding_ids: [${targets.join(', ')}]
base_ref: ${baseRef}
reviewed_base: ${base}
reviewed_head: ${head}
diff_sha256: ${evidence.hash}
changed_files:
${changedFiles.map(file => `  - ${file}`).join('\n')}
standards_checked: [${(standardsChecked || (taskId === TASK_ID ? ['BE-TEST-01'] : [])).join(', ')}]
started_at: ${started}
completed_at: ${completed}
escalate_to_full: false
conclusion: ${conclusion}
---

## Findings

\`\`\`yaml
${body}
\`\`\`
`;
}

try {
  git(['init']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'Test']);

  const task = `---
package-schema: 2
task-id: ${TASK_ID}
module: enforcement
task_type: dev-backend
layers: [backend]
source: bug
risk: standard
status: taken-by:cc
relevant-standards: [BE-TEST-01 · standards-backend.md § 测试机制]
files:
  - scripts/check-guard.js
  - tests/enforcement/guard.spec.ts
title: 收紧 enforcement
description: 规则漏判 → fail-closed
acceptance-criteria:
  - intent: 违规写法被检查器拦截 oracle: 反例退出码非零
---
`;
  const changedFiles = ['scripts/check-guard.js', 'tests/enforcement/guard.spec.ts'];
  const profileRel = `b-reviews/${TASK_ID}/profile-round-01.json`;
  write(`b-queue/${TASK_ID}.md`, task);
  write('scripts/check-guard.js', 'module.exports = () => true;\n');
  write('tests/enforcement/guard.spec.ts', 'const expected = true;\n');
  git(['add', '.']);
  git(['commit', '-m', 'base']);
  const baseRef = git(['rev-parse', 'HEAD']).trim();
  const baseTree = git(['rev-parse', 'HEAD^{tree}']).trim();

  write('scripts/check-guard.js', 'module.exports = value => value === "safe";\n');
  write('tests/enforcement/guard.spec.ts', 'const expected = "safe";\n');
  git(['add', ...changedFiles]);
  const reviewedHead1 = git(['write-tree']).trim();

  const profileArgs = [reviewProfileScript, path.join(tempRoot, `b-queue/${TASK_ID}.md`),
    '--risk', 'standard', '--output', path.join(tempRoot, profileRel), '--changed-files', ...changedFiles];
  const generated = childProcess.spawnSync(process.execPath, profileArgs, { cwd: tempRoot, encoding: 'utf8' });
  assert.strictEqual(generated.status, 0, `${generated.stdout}\n${generated.stderr}`);
  const overwrite = childProcess.spawnSync(process.execPath, profileArgs, { cwd: tempRoot, encoding: 'utf8' });
  assert.strictEqual(overwrite.status, 2, 'existing profile must be immutable');
  const profile = JSON.parse(fs.readFileSync(path.join(tempRoot, profileRel), 'utf8'));
  write(`b-queue/${TASK_ID}.md`, task.replace('status: taken-by:cc', 'status: merged'));
  write(`b-reviews/${TASK_ID}/preflight.md`, `---
task_id: ${TASK_ID}
timing: before-code
base_ref: ${baseRef}
base_tree: ${baseTree}
started_at: 2026-08-09T00:00:00Z
completed_at: 2026-08-09T00:01:00Z
result: pass
---
`);
  write(`b-reviews/${TASK_ID}/round-01.md`, reportText({
    taskId: TASK_ID, round: 1, mode: 'full', profile: profileRel, prior: null, targets: [],
    baseRef, base: baseTree, head: reviewedHead1, changedFiles,
    started: '2026-08-09T00:02:00Z', completed: '2026-08-09T00:03:00Z', conclusion: 'pass',
  }));
  write('status.yml', `code_reviews:
  - iteration: null
    task_id: ${TASK_ID}
    conclusion: 通过
    rounds: 1
    code_rounds: 1
    spec_rounds: 0
    freshness: pass
    review_report_dir: b-reviews/${TASK_ID}
    review_profile_version: develop-review-profile/v1
    review_evidence_version: develop-review-round/v2
    implementation_started_at: 2026-08-09T00:01:00Z
    implementation_completed_at: 2026-08-09T00:02:00Z
    review_started_at: 2026-08-09T00:02:00Z
    review_completed_at: 2026-08-09T00:03:00Z
    spec_minutes: 1
`);

  const passing = runAudit();
  assert.strictEqual(passing.status, 0, `${passing.stdout}\n${passing.stderr}`);

  const canonicalStatus = fs.readFileSync(path.join(tempRoot, 'status.yml'), 'utf8');
  fs.writeFileSync(path.join(tempRoot, 'status.yml'), canonicalStatus.replace(
    '    spec_minutes: 1',
    '    implementation_minutes: 999\n    review_minutes: 999\n    spec_minutes: 1'), 'utf8');
  assert.strictEqual(runAudit().status, 0, 'legacy derived minutes should be ignored');
  fs.writeFileSync(path.join(tempRoot, 'status.yml'), canonicalStatus, 'utf8');

  const roundOnePath = path.join(tempRoot, `b-reviews/${TASK_ID}/round-01.md`);
  const canonicalRoundOne = fs.readFileSync(roundOnePath, 'utf8');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(reviewedHead1, 'c'.repeat(40)), 'utf8');
  assert.match(runAudit().stdout, /固定 diff 不可复现|当前仓可解析/, 'fake tree must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(/diff_sha256: [0-9a-f]{64}/, `diff_sha256: ${'d'.repeat(64)}`), 'utf8');
  assert.match(runAudit().stdout, /diff_sha256 与/, 'fake diff hash must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace('findings: []', `findings:
  - id: ${TASK_ID}-F001
    severity: blocking
    status: open`), 'utf8');
  assert.match(runAudit().stdout, /conclusion=pass 但仍有 open blocking/, 'open blocker must fail pass');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(/^standards_checked:.*\n/m, ''), 'utf8');
  assert.match(runAudit().stdout, /standards_checked 缺失/, 'v2 full missing standards_checked must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne
    .replace('schema: develop-review-round/v2', 'schema: develop-review-round/v2x')
    .replace(/^standards_checked:.*\n/m, ''), 'utf8');
  assert.match(runAudit().stdout, /未知 round schema|round schema 必须/, 'unknown schema must not fall open to legacy');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(
    'standards_checked: [BE-TEST-01]', 'standards_checked: [BE-TEST-01, FE-EXTRA-01]'), 'utf8');
  assert.match(runAudit().stdout, /任务包外 id/, 'full extra standards id must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne, 'utf8');

  write('src/unrelated.ts', 'export const unrelated = true;\n');
  git(['add', 'src/unrelated.ts']);
  const cumulativeHead = git(['write-tree']).trim();
  write(`b-reviews/${TASK_ID}/round-01.md`, reportText({
    taskId: TASK_ID, round: 1, mode: 'full', profile: profileRel, prior: null, targets: [],
    baseRef, base: baseTree, head: cumulativeHead, changedFiles: [...changedFiles, 'src/unrelated.ts'],
    started: '2026-08-09T00:02:00Z', completed: '2026-08-09T00:03:00Z', conclusion: 'pass',
  }));
  assert.match(runAudit().stdout, /固定 diff 超出任务包 files/, 'cumulative task diff must fail');
  git(['read-tree', reviewedHead1]);
  fs.writeFileSync(roundOnePath, canonicalRoundOne, 'utf8');

  profile.selected_dimensions = profile.selected_dimensions.filter(item => item.id !== 'contract');
  write(profileRel, `${JSON.stringify(profile, null, 2)}\n`);
  const tampered = runAudit();
  assert.strictEqual(tampered.status, 1, `${tampered.stdout}\n${tampered.stderr}`);
  assert.match(tampered.stdout, /selected_dimensions|core 维度 contract/);
  write(profileRel, `${JSON.stringify(buildReviewProfileFromText(task, changedFiles, 'standard'), null, 2)}\n`);

  write('tests/enforcement/guard.spec.ts', 'const expected = "safe"; const regression = true;\n');
  git(['add', 'tests/enforcement/guard.spec.ts']);
  const reviewedHead2 = git(['write-tree']).trim();
  write(`b-reviews/${TASK_ID}/round-01.md`, reportText({
    taskId: TASK_ID, round: 1, mode: 'full', profile: profileRel, prior: null, targets: [],
    baseRef, base: baseTree, head: reviewedHead1, changedFiles,
    started: '2026-08-09T00:02:00Z', completed: '2026-08-09T00:03:00Z', conclusion: 'revise',
    body: `findings:\n  - id: ${TASK_ID}-F001\n    severity: blocking\n    status: open`,
  }));
  const priorReport = `b-reviews/${TASK_ID}/round-01.md`;
  write(`b-reviews/${TASK_ID}/round-02.md`, reportText({
    taskId: TASK_ID, round: 2, mode: 'targeted', profile: profileRel, prior: priorReport,
    targets: [`${TASK_ID}-F001`], baseRef, base: reviewedHead1, head: reviewedHead2,
    changedFiles: ['tests/enforcement/guard.spec.ts'],
    started: '2026-08-09T00:03:00Z', completed: '2026-08-09T00:04:00Z', conclusion: 'pass',
    body: `findings:\n  - id: ${TASK_ID}-F001\n    severity: blocking\n    status: verified-closed`,
  }));
  write('status.yml', `code_reviews:
  - iteration: null
    task_id: ${TASK_ID}
    conclusion: 通过
    rounds: 2
    code_rounds: 2
    spec_rounds: 0
    freshness: pass
    review_report_dir: b-reviews/${TASK_ID}
    review_profile_version: develop-review-profile/v1
    review_evidence_version: develop-review-round/v2
    implementation_started_at: 2026-08-09T00:01:00Z
    implementation_completed_at: 2026-08-09T00:02:00Z
    review_started_at: 2026-08-09T00:02:00Z
    review_completed_at: 2026-08-09T00:04:00Z
    spec_minutes: 1
`);
  const targeted = runAudit();
  assert.strictEqual(targeted.status, 0, `${targeted.stdout}\n${targeted.stderr}`);

  const roundTwoPath = path.join(tempRoot, `b-reviews/${TASK_ID}/round-02.md`);
  const wrongProfile = `b-reviews/${TASK_ID}/profile-round-02.json`;
  fs.writeFileSync(roundTwoPath,
    fs.readFileSync(roundTwoPath, 'utf8').replace(`review_profile: ${profileRel}`, `review_profile: ${wrongProfile}`), 'utf8');
  assert.match(runAudit().stdout, /targeted 必须继承/);
  fs.writeFileSync(roundTwoPath,
    fs.readFileSync(roundTwoPath, 'utf8').replace(`review_profile: ${wrongProfile}`, `review_profile: ${profileRel}`), 'utf8');
  const canonicalRoundTwo = fs.readFileSync(roundTwoPath, 'utf8');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo.replace(
    'standards_checked: [BE-TEST-01]', 'standards_checked: [FE-EXTRA-01]'), 'utf8');
  assert.match(runAudit().stdout, /任务包外 id/, 'targeted standards_checked must be subset of task standards');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo, 'utf8');

  git(['read-tree', baseTree]);
  write('src/main.ts', 'export const main = true;\n');
  git(['add', 'src/main.ts']);
  const foundationHead = git(['write-tree']).trim();
  const foundationId = 'foundation';
  const foundationDir = `iterations/v0/code-reviews/${foundationId}`;
  write(`${foundationDir}/preflight.md`, `---
task_id: ${foundationId}
timing: before-code
base_ref: ${baseRef}
base_tree: ${baseTree}
started_at: 2026-08-09T01:00:00Z
completed_at: 2026-08-09T01:01:00Z
result: pass
---
`);
  write(`${foundationDir}/round-01.md`, reportText({
    taskId: foundationId, round: 1, mode: 'full', profile: 'foundation-review/v1', prior: null,
    targets: [], baseRef, base: baseTree, head: foundationHead, changedFiles: ['src/main.ts'],
    started: '2026-08-09T01:02:00Z', completed: '2026-08-09T01:03:00Z', conclusion: 'pass',
  }));
  fs.appendFileSync(path.join(tempRoot, 'status.yml'), `  - iteration: v0
    task_id: ${foundationId}
    conclusion: 通过
    rounds: 1
    code_rounds: 1
    spec_rounds: 0
    freshness: pass
    review_report_dir: ${foundationDir}
    review_profile_version: foundation-review/v1
    implementation_started_at: 2026-08-09T01:01:00Z
    implementation_completed_at: 2026-08-09T01:02:00Z
    review_started_at: 2026-08-09T01:02:00Z
    review_completed_at: 2026-08-09T01:03:00Z
    spec_minutes: 1
`, 'utf8');
  const foundation = runAudit(foundationId);
  assert.strictEqual(foundation.status, 0, `${foundation.stdout}\n${foundation.stderr}`);

  const statusPath = path.join(tempRoot, 'status.yml');
  fs.writeFileSync(statusPath,
    fs.readFileSync(statusPath, 'utf8').replace(
      'review_profile_version: develop-review-profile/v1', 'review_profile_version: foundation-review/v1'), 'utf8');
  assert.match(runAudit().stdout, /只允许 task_id=foundation/);

  console.log('review-profile integration tests: 12/12 passed');
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  const resolvedOsTemp = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(resolvedOsTemp + path.sep)
      || !path.basename(resolvedTemp).startsWith('hact-review-profile-')) {
    throw new Error(`拒绝清理非测试临时目录：${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
