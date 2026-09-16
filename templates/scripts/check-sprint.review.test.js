#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TASK_ID = 'demo-b-101';
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-review-audit-'));
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

function reportText({ taskId, round, mode, prior, targets, baseRef, base, head,
  changedFiles, started, completed, conclusion, body = 'findings: []' }) {
  const evidence = diffEvidence(base, head);
  assert.deepStrictEqual(evidence.names, [...changedFiles].sort(), 'fixture changed files must be real');
  return `---
schema: develop-review-round/v2
task_id: ${taskId}
round: ${round}
mode: ${mode}
risk: ${taskId === 'foundation' ? 'sensitive' : 'standard'}
prior_report: ${prior || 'null'}
target_finding_ids: [${targets.join(', ')}]
base_ref: ${baseRef}
reviewed_base: ${base}
reviewed_head: ${head}
diff_sha256: ${evidence.hash}
changed_files:
${changedFiles.map(file => `  - ${file}`).join('\n')}
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
reference: [project.md § 验证入口]
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
    taskId: TASK_ID, round: 1, mode: 'full', prior: null, targets: [],
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
  const preflightFile = path.join(tempRoot, 'b-reviews', TASK_ID, 'preflight.md');
  const canonicalPreflight = fs.readFileSync(preflightFile, 'utf8');
  const withoutTime = source => source.replace(/^\s*(?:(?:implementation|review)_(?:started|completed)_at|spec_minutes|started_at|completed_at):[^\n]*\n/gm, '');
  write('status.yml', withoutTime(canonicalStatus));
  fs.writeFileSync(roundOnePath, withoutTime(canonicalRoundOne));
  fs.writeFileSync(preflightFile, withoutTime(canonicalPreflight));
  assert.strictEqual(runAudit().status, 0, '无任何成本时间字段仍按真实 Git 和完整审查链通过');
  fs.writeFileSync(roundOnePath, withoutTime(canonicalRoundOne).replace('mode: full', 'mode: targeted'));
  assert.notStrictEqual(runAudit().status, 0, '时间可省，首轮 full 仍不可省');
  write('status.yml', canonicalStatus);
  fs.writeFileSync(roundOnePath, canonicalRoundOne);
  fs.writeFileSync(preflightFile, canonicalPreflight);
  const historicalRound = canonicalRoundOne.replace('mode: full', 'mode: full\nreview_profile: archived-profile.json\nstandards_checked: [BE-OLD-01]');
  const historicalStatus = canonicalStatus.replace('    spec_minutes: 1',
    '    review_profile_version: develop-review-profile/v1\n    issues: []\n    spec_minutes: 1');
  write(`b-reviews/${TASK_ID}/round-01.md`, historicalRound);
  write('status.yml', historicalStatus);
  write('archived-profile.json', '{"selector_revision":1,"historical":true}\n');
  assert.strictEqual(runAudit().status, 0, 'old profile and standards fields are inert; no retired files are needed');
  assert.strictEqual(fs.readFileSync(roundOnePath, 'utf8'), historicalRound, 'audit must not rewrite historical reports');
  assert.strictEqual(fs.readFileSync(path.join(tempRoot, 'status.yml'), 'utf8'), historicalStatus);
  assert.strictEqual(fs.readFileSync(path.join(tempRoot, 'archived-profile.json'), 'utf8'), '{"selector_revision":1,"historical":true}\n');
  write('status.yml', canonicalStatus);
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(`task_id: ${TASK_ID}`, 'task_id: another-task'), 'utf8');
  assert.match(runAudit().stdout, /task_id 不匹配/, 'report identity remains mandatory without profile');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(reviewedHead1, 'c'.repeat(40)), 'utf8');
  assert.match(runAudit().stdout, /固定 diff 不可复现|当前仓可解析/, 'fake tree must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace(/diff_sha256: [0-9a-f]{64}/, `diff_sha256: ${'d'.repeat(64)}`), 'utf8');
  assert.match(runAudit().stdout, /diff_sha256 与/, 'fake diff hash must fail');
  fs.writeFileSync(roundOnePath, canonicalRoundOne.replace('findings: []', `findings:
  - id: ${TASK_ID}-F001
    severity: blocking
    status: open`), 'utf8');
  assert.match(runAudit().stdout, /conclusion=pass 但仍有 open blocking/, 'open blocker must fail pass');
  fs.writeFileSync(roundOnePath, canonicalRoundOne
    .replace('schema: develop-review-round/v2', 'schema: develop-review-round/v2x'), 'utf8');
  assert.match(runAudit().stdout, /未知 round schema|round schema 必须/, 'unknown schema must not fall open to legacy');
  fs.writeFileSync(roundOnePath, canonicalRoundOne, 'utf8');

  write('src/unrelated.ts', 'export const unrelated = true;\n');
  git(['add', 'src/unrelated.ts']);
  const cumulativeHead = git(['write-tree']).trim();
  write(`b-reviews/${TASK_ID}/round-01.md`, reportText({
    taskId: TASK_ID, round: 1, mode: 'full', prior: null, targets: [],
    baseRef, base: baseTree, head: cumulativeHead, changedFiles: [...changedFiles, 'src/unrelated.ts'],
    started: '2026-08-09T00:02:00Z', completed: '2026-08-09T00:03:00Z', conclusion: 'pass',
  }));
  assert.match(runAudit().stdout, /固定 diff 超出任务包 files/, 'cumulative task diff must fail');
  git(['read-tree', reviewedHead1]);
  fs.writeFileSync(roundOnePath, canonicalRoundOne, 'utf8');

  write('tests/enforcement/guard.spec.ts', 'const expected = "safe"; const regression = true;\n');
  git(['add', 'tests/enforcement/guard.spec.ts']);
  const reviewedHead2 = git(['write-tree']).trim();
  write(`b-reviews/${TASK_ID}/round-01.md`, reportText({
    taskId: TASK_ID, round: 1, mode: 'full', prior: null, targets: [],
    baseRef, base: baseTree, head: reviewedHead1, changedFiles,
    started: '2026-08-09T00:02:00Z', completed: '2026-08-09T00:03:00Z', conclusion: 'revise',
    body: `findings:\n  - id: ${TASK_ID}-F001\n    severity: blocking\n    status: open`,
  }));
  const priorReport = `b-reviews/${TASK_ID}/round-01.md`;
  write(`b-reviews/${TASK_ID}/round-02.md`, reportText({
    taskId: TASK_ID, round: 2, mode: 'targeted', prior: priorReport,
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
  const canonicalRoundTwo = fs.readFileSync(roundTwoPath, 'utf8');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo.replace(priorReport, 'b-reviews/missing/round-01.md'), 'utf8');
  assert.match(runAudit().stdout, /prior_report 必须指向/, 'recovery must retain the preceding independent report');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo.replace('status: verified-closed', 'status: open'), 'utf8');
  assert.match(runAudit().stdout, /open blocking/, 'restarting a process cannot silently drop a blocker');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo, 'utf8');
  const priorRound = fs.readFileSync(roundOnePath, 'utf8');
  const historicalPrior = priorRound.replace('mode: full', 'mode: full\nreview_profile: archived-profile.json\nstandards_checked: [BE-OLD-01]');
  fs.writeFileSync(roundOnePath, historicalPrior, 'utf8');
  assert.strictEqual(runAudit().status, 0, 'new targeted review can continue an old full report without profile');
  assert.strictEqual(fs.readFileSync(roundOnePath, 'utf8'), historicalPrior);
  fs.writeFileSync(roundOnePath, priorRound, 'utf8');
  const currentTaskPath = path.join(tempRoot, `b-queue/${TASK_ID}.md`);
  const currentTask = fs.readFileSync(currentTaskPath, 'utf8');
  fs.writeFileSync(currentTaskPath, currentTask
    .replace('title: 收紧 enforcement', 'title: 明确此包边界')
    .replace('reference: [project.md § 验证入口]', 'reference: [project.md § 验证入口, foundation.md § 边界]'), 'utf8');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo, 'utf8');
  assert.strictEqual(runAudit().status, 0, 'local contract revision uses targeted; historical reports remain unchanged');
  fs.writeFileSync(currentTaskPath, currentTask, 'utf8');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo, 'utf8');
  const localFinding = `\n  - id: ${TASK_ID}-F002\n    severity: blocking\n    status: verified-closed`;
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo.replace('status: verified-closed', `status: verified-closed${localFinding}`), 'utf8');
  assert.strictEqual(runAudit().status, 0, 'targeted may verify a local new finding without restarting full');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo.replace('status: verified-closed', `status: verified-closed${localFinding.replace('verified-closed', 'open')}`), 'utf8');
  assert.match(runAudit().stdout, /conclusion=pass 但仍有 open blocking/, 'local findings cannot be skipped to pass');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo, 'utf8');

  // New policy is prospective: historical bytes remain untouched, including old verdicts.
  const bounded = text => text.replace('schema: develop-review-round/v2',
    'schema: develop-review-round/v2\nreview_policy: bounded-v1');
  const evidenceFirst = bounded(priorRound)
    .replace('conclusion: revise', 'conclusion: evidence-needed')
    .replace('status: open', 'status: open\n    action: request-evidence');
  const evidencePath = `b-reviews/${TASK_ID}/runtime.log`;
  write(evidencePath, 'fixed snapshot target run: PASS, exit 0\n');
  const evidenceSecond = bounded(reportText({
    taskId: TASK_ID, round: 2, mode: 'targeted', prior: priorReport,
    targets: [`${TASK_ID}-F001`], baseRef, base: reviewedHead1, head: reviewedHead1,
    changedFiles: [], conclusion: 'pass',
    body: `findings:\n  - id: ${TASK_ID}-F001\n    severity: blocking\n    action: request-evidence\n    status: verified-closed`,
  })).replace('conclusion: pass', `evidence_only: true\nevidence_files: [${evidencePath}]\nconclusion: pass`);
  fs.writeFileSync(roundOnePath, evidenceFirst);
  fs.writeFileSync(roundTwoPath, evidenceSecond);
  let result = runAudit();
  assert.strictEqual(result.status, 0, `same-tree evidence closure: ${result.stdout}\n${result.stderr}`);
  const chain = childProcess.spawnSync(process.execPath, [checkSprint, '--review-chain', TASK_ID, tempRoot], { encoding: 'utf8' });
  assert.strictEqual(chain.status, 0, `pre-merge evidence chain: ${chain.stdout}\n${chain.stderr}`);
  const rejectedSecond = (text, pattern) => {
    fs.writeFileSync(roundTwoPath, text);
    assert.match(runAudit().stdout, pattern);
    fs.writeFileSync(roundTwoPath, evidenceSecond);
  };
  rejectedSecond(evidenceSecond.replace('evidence_only: true', 'evidence_only: false'), /changed_files 为空/);
  rejectedSecond(evidenceSecond.replace('evidence_only: true', 'evidence_only: maybe'), /evidence_only 非布尔/);
  rejectedSecond(evidenceSecond.replace(`reviewed_head: ${reviewedHead1}`, `reviewed_head: ${reviewedHead2}`), /同快照空增量/);
  rejectedSecond(evidenceSecond.replace(evidencePath, 'missing.log'), /非空原始证据/);
  write('empty.log', '');
  rejectedSecond(evidenceSecond.replace(evidencePath, 'empty.log'), /非空原始证据/);
  rejectedSecond(evidenceSecond.replace(evidencePath, priorReport), /非空原始证据/);
  rejectedSecond(evidenceSecond.replace(evidencePath, '../outside.log'), /非空原始证据/);
  rejectedSecond(evidenceSecond.replace(`evidence_files: [${evidencePath}]`, 'evidence_files: []'), /缺 evidence_files/);
  rejectedSecond(evidenceSecond.replace('review_policy: bounded-v1\n', ''), /不得退回旧策略/);
  rejectedSecond(evidenceSecond.replace('review_policy: bounded-v1', 'review_policy: unknown'), /未知 review_policy/);
  rejectedSecond(evidenceSecond.replace('status: verified-closed', 'status: open'), /open blocking/);
  rejectedSecond(evidenceSecond.replace(`target_finding_ids: [${TASK_ID}-F001]`, `target_finding_ids: [${TASK_ID}-F002]`), /此前开放|全部 open blocking/);
  fs.writeFileSync(roundOnePath, bounded(priorRound).replace('status: open', 'status: open\n    action: fix-code'));
  assert.match(runAudit().stdout, /此前开放的 request-evidence/, 'code repair cannot masquerade as evidence only');

  const advisoryFirst = evidenceFirst.replace('severity: blocking', 'severity: advisory').replace('status: open', 'status: advisory');
  fs.writeFileSync(roundOnePath, advisoryFirst);
  assert.match(runAudit().stdout, /evidence-needed 必须有开放/, 'advisory cannot force evidence-needed');
  fs.writeFileSync(roundOnePath, advisoryFirst.replace('conclusion: evidence-needed', 'conclusion: revise'));
  assert.match(runAudit().stdout, /建议不阻断/, 'advisory cannot force revise');
  fs.writeFileSync(roundOnePath, evidenceFirst.replace('action: request-evidence', 'action: fix-code'));
  assert.match(runAudit().stdout, /evidence-needed 必须有开放/, 'a bug is not an evidence gap');
  fs.writeFileSync(roundOnePath, evidenceFirst.replace('action: request-evidence', 'action: backlog'));
  assert.match(runAudit().stdout, /必须有可执行 action/, 'backlog is not an unresolved blocking action');
  fs.writeFileSync(roundOnePath, bounded(priorRound).replace('status: open', 'status: open\n    action: fix-code'));
  fs.writeFileSync(roundTwoPath, bounded(canonicalRoundTwo));
  assert.strictEqual(runAudit().status, 0, 'real blocking repair with code diff still passes');

  // Opt in during an existing chain without rewriting its historical first round.
  fs.writeFileSync(roundOnePath, priorRound);
  assert.strictEqual(runAudit().status, 0, 'bounded targeted can continue an unchanged legacy round');
  assert.strictEqual(fs.readFileSync(roundOnePath, 'utf8'), priorRound);
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo);
  fs.writeFileSync(roundTwoPath, bounded(canonicalRoundTwo).replace('status: verified-closed', 'status: verified-closed\n  - id: demo-b-101-F002\n    severity: advisory\n    status: advisory\n    action: backlog'));
  assert.strictEqual(runAudit().status, 0, 'advisory alongside closed blocker permits pass');
  fs.writeFileSync(roundTwoPath, canonicalRoundTwo);

  const anchorScript = path.join(__dirname, 'build-review-anchor.js');
  const anchor = childProcess.spawnSync(process.execPath, [anchorScript, baseTree, reviewedHead1, tempRoot], { encoding: 'utf8' });
  assert.strictEqual(anchor.status, 0, anchor.stderr);
  assert.ok(anchor.stdout.includes(`diff_sha256: ${diffEvidence(baseTree, reviewedHead1).hash}`));
  assert.ok(anchor.stdout.includes('"scripts/check-guard.js"'));
  const emptyAnchor = childProcess.spawnSync(process.execPath, [anchorScript, reviewedHead1, reviewedHead1, tempRoot], { encoding: 'utf8' });
  assert.strictEqual(emptyAnchor.status, 0, emptyAnchor.stderr);
  assert.match(emptyAnchor.stdout, /changed_files: \[\]/);
  assert.ok(emptyAnchor.stdout.includes(crypto.createHash('sha256').update('').digest('hex')));
  assert.notStrictEqual(childProcess.spawnSync(process.execPath, [anchorScript, 'no-such-ref', reviewedHead1, tempRoot]).status, 0);

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
    taskId: foundationId, round: 1, mode: 'full', prior: null,
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
    implementation_started_at: 2026-08-09T01:01:00Z
    implementation_completed_at: 2026-08-09T01:02:00Z
    review_started_at: 2026-08-09T01:02:00Z
    review_completed_at: 2026-08-09T01:03:00Z
    spec_minutes: 1
`, 'utf8');
  const foundation = runAudit(foundationId);
  assert.strictEqual(foundation.status, 0, `${foundation.stdout}\n${foundation.stderr}`);

  console.log('check-sprint review: fixed snapshots, findings, targeted recovery and foundation passed');
} finally {
  const resolvedTemp = path.resolve(tempRoot);
  const resolvedOsTemp = path.resolve(os.tmpdir());
  if (!resolvedTemp.startsWith(resolvedOsTemp + path.sep)
      || !path.basename(resolvedTemp).startsWith('hact-review-audit-')) {
    throw new Error(`拒绝清理非测试临时目录：${resolvedTemp}`);
  }
  fs.rmSync(resolvedTemp, { recursive: true, force: true });
}
