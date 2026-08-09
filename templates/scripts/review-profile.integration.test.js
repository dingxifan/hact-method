#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
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

function runAudit() {
  return childProcess.spawnSync(process.execPath, [checkSprint, '--review', TASK_ID, tempRoot], {
    cwd: tempRoot,
    encoding: 'utf8',
  });
}

try {
  const task = `---
task-id: ${TASK_ID}
task_type: dev-backend
layers: [backend]
source: bug
risk: standard
status: taken-by:cc
relevant-standards: []
title: 收紧 enforcement
description: 规则漏判 → fail-closed
acceptance-criteria:
  - intent: 违规写法被检查器拦截 oracle: 反例退出码非零
---
`;
  const changedFiles = ['tests/enforcement/guard.spec.ts', 'scripts/check-guard.js'];
  const profileRel = `b-reviews/${TASK_ID}/profile-round-01.json`;
  write(`b-queue/${TASK_ID}.md`, task);
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
base_ref: ${'a'.repeat(40)}
base_tree: ${'b'.repeat(40)}
started_at: 2026-08-09T00:00:00Z
completed_at: 2026-08-09T00:01:00Z
spec_minutes: 1
result: pass
---
`);
  write(`b-reviews/${TASK_ID}/round-01.md`, `---
task_id: ${TASK_ID}
round: 1
mode: full
risk: standard
review_profile: ${profileRel}
prior_report: null
target_finding_ids: []
base_ref: ${'a'.repeat(40)}
reviewed_base: ${'b'.repeat(40)}
reviewed_head: ${'c'.repeat(40)}
diff_sha256: ${'d'.repeat(64)}
changed_files:
  - tests/enforcement/guard.spec.ts
  - scripts/check-guard.js
started_at: 2026-08-09T00:02:00Z
completed_at: 2026-08-09T00:03:00Z
elapsed_minutes: 1
escalate_to_full: false
conclusion: pass
---
`);
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
    implementation_started_at: 2026-08-09T00:01:00Z
    implementation_completed_at: 2026-08-09T00:02:00Z
    review_started_at: 2026-08-09T00:02:00Z
    review_completed_at: 2026-08-09T00:03:00Z
    implementation_minutes: 1
    review_minutes: 1
    spec_minutes: 1
`);

  const passing = runAudit();
  assert.strictEqual(passing.status, 0, `${passing.stdout}\n${passing.stderr}`);
  assert.match(passing.stdout, /失败 0 项/);

  profile.selected_dimensions = profile.selected_dimensions.filter(item => item.id !== 'contract');
  write(profileRel, `${JSON.stringify(profile, null, 2)}\n`);
  const tampered = runAudit();
  assert.strictEqual(tampered.status, 1, `${tampered.stdout}\n${tampered.stderr}`);
  assert.match(tampered.stdout, /selected_dimensions|core 维度 contract/);

  const restoredProfile = buildReviewProfileFromText(task, changedFiles, 'standard');
  write(profileRel, `${JSON.stringify(restoredProfile, null, 2)}\n`);
  const priorReport = `b-reviews/${TASK_ID}/round-01.md`;
  write(`b-reviews/${TASK_ID}/round-02.md`, `---
task_id: ${TASK_ID}
round: 2
mode: targeted
risk: standard
review_profile: ${profileRel}
prior_report: ${priorReport}
target_finding_ids: [${TASK_ID}-F001]
base_ref: ${'a'.repeat(40)}
reviewed_base: ${'c'.repeat(40)}
reviewed_head: ${'e'.repeat(40)}
diff_sha256: ${'f'.repeat(64)}
changed_files:
  - tests/enforcement/guard.spec.ts
started_at: 2026-08-09T00:03:00Z
completed_at: 2026-08-09T00:04:00Z
elapsed_minutes: 1
escalate_to_full: false
conclusion: pass
---
`);
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
    implementation_started_at: 2026-08-09T00:01:00Z
    implementation_completed_at: 2026-08-09T00:02:00Z
    review_started_at: 2026-08-09T00:02:00Z
    review_completed_at: 2026-08-09T00:04:00Z
    implementation_minutes: 1
    review_minutes: 2
    spec_minutes: 1
`);
  const targeted = runAudit();
  assert.strictEqual(targeted.status, 0, `${targeted.stdout}\n${targeted.stderr}`);

  const roundTwoPath = path.join(tempRoot, `b-reviews/${TASK_ID}/round-02.md`);
  const wrongProfile = `b-reviews/${TASK_ID}/profile-round-02.json`;
  fs.writeFileSync(roundTwoPath,
    fs.readFileSync(roundTwoPath, 'utf8').replace(`review_profile: ${profileRel}`, `review_profile: ${wrongProfile}`),
    'utf8');
  const wrongInheritance = runAudit();
  assert.strictEqual(wrongInheritance.status, 1, `${wrongInheritance.stdout}\n${wrongInheritance.stderr}`);
  assert.match(wrongInheritance.stdout, /targeted 必须继承/);
  fs.writeFileSync(roundTwoPath,
    fs.readFileSync(roundTwoPath, 'utf8').replace(`review_profile: ${wrongProfile}`, `review_profile: ${profileRel}`),
    'utf8');

  const foundationId = 'foundation';
  const foundationDir = `iterations/v0/code-reviews/${foundationId}`;
  write(`${foundationDir}/preflight.md`, `---
task_id: ${foundationId}
timing: before-code
base_ref: ${'1'.repeat(40)}
base_tree: ${'2'.repeat(40)}
started_at: 2026-08-09T01:00:00Z
completed_at: 2026-08-09T01:01:00Z
spec_minutes: 1
result: pass
---
`);
  write(`${foundationDir}/round-01.md`, `---
task_id: ${foundationId}
round: 1
mode: full
risk: sensitive
review_profile: foundation-review/v1
prior_report: null
target_finding_ids: []
base_ref: ${'1'.repeat(40)}
reviewed_base: ${'2'.repeat(40)}
reviewed_head: ${'3'.repeat(40)}
diff_sha256: ${'4'.repeat(64)}
changed_files: [src/main.ts]
started_at: 2026-08-09T01:02:00Z
completed_at: 2026-08-09T01:03:00Z
elapsed_minutes: 1
escalate_to_full: false
conclusion: pass
---
`);
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
    implementation_minutes: 1
    review_minutes: 1
    spec_minutes: 1
`, 'utf8');
  const foundation = childProcess.spawnSync(process.execPath,
    [checkSprint, '--review', foundationId, tempRoot], { cwd: tempRoot, encoding: 'utf8' });
  assert.strictEqual(foundation.status, 0, `${foundation.stdout}\n${foundation.stderr}`);

  const statusPath = path.join(tempRoot, 'status.yml');
  fs.writeFileSync(statusPath,
    fs.readFileSync(statusPath, 'utf8').replace(
      'review_profile_version: develop-review-profile/v1',
      'review_profile_version: foundation-review/v1'),
    'utf8');
  const sentinelBypass = runAudit();
  assert.strictEqual(sentinelBypass.status, 1, `${sentinelBypass.stdout}\n${sentinelBypass.stderr}`);
  assert.match(sentinelBypass.stdout, /只允许 task_id=foundation/);

  console.log('review-profile integration tests: 7/7 passed');
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  const resolvedOsTemp = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(resolvedOsTemp + path.sep)
      || !path.basename(resolvedTemp).startsWith('hact-review-profile-')) {
    throw new Error(`拒绝清理非测试临时目录：${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
