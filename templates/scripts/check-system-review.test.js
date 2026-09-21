#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { validate, parseYamlText } = require('./check-system-review.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-system-review-'));
const methodSha = 'f'.repeat(40);
const write = (rel, text) => {
  const target = path.join(root, ...rel.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
};
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const commit = message => { git(['add', '.']); git(['commit', '-m', message]); return git(['rev-parse', 'HEAD']); };

git(['init']);
git(['config', 'user.name', 'System Review Test']);
git(['config', 'user.email', 'system-review@example.com']);
write('_meta/method-sync.json', JSON.stringify({ schema: 1, state: 'verified', source: methodSha }));
write('app.txt', 'base\n');
const base = commit('base');
write('app.txt', 'candidate\n');
const candidate = commit('candidate');
write('app.txt', 'repair\n');
const repair = commit('repair');
const repairTree = git(['rev-parse', `${repair}^{tree}`]);
const mainBranch = git(['branch', '--show-current']);
git(['checkout', '-b', 'forked-assurance', candidate]);
write('fork.txt', 'fork\n');
const forked = commit('forked candidate');
git(['checkout', mainBranch]);

const review = ({ number = 1, type = 'full', head = candidate, predecessor = null,
  revalidation = [], result = 'pass', evidence = 'sufficient', finding = null }) => `---
schema: system-review/v1
iteration: v1
review_id: review-${String(number).padStart(3, '0')}
review_type: ${type}
reviewer_isolation: fresh-isolated
method_sha: ${methodSha}
candidate:
  base: ${number === 1 ? base : candidate}
  head: ${head}
predecessor: ${predecessor}
revalidation_of: [${revalidation.join(', ')}]
scope:
  - ${type === 'full' ? 'final-contract' : 'affected-call-chain'}
${type === 'full' && number > 1 ? '  - affected-call-chain\n' : ''}evidence:
  - evidence/system.txt
result:
  status: ${result}
evidence_state:
  status: ${evidence}
findings:${finding ? `
  - id: ${finding.id}
    origin: ${finding.origin || 'semantic-review'}
    severity: blocking
    category: ${finding.category || 'compatibility'}
    summary: ${finding.summary || 'candidate violates contract'}
    evidence:
      - evidence/system.txt
    required_action:
      type: fix-code
      description: repair the behavior
    closure:
      route: ${finding.route}
    revalidation:
      semantic:
        required: true
        scope:
          - affected-call-chain
      runtime:
        required: ${finding.runtimeRequired === false ? 'false' : 'true'}
        not_required_reason: ${finding.runtimeRequired === false ? 'no runtime-observable behavior' : 'null'}
        scope:${finding.runtimeRequired === false ? ' []' : '\n          - target-runtime-path'}
    full_snapshot_invalidated: ${finding.invalidated ? 'true' : 'false'}
    invalidation_reason: ${finding.invalidated ? 'shared API redesign invalidates consumers' : 'null'}
    state: open` : ' []'}
advisories: []
created_at: 2026-09-20T12:00:00Z
---

## Judgement

fixture
`;

const closure = ({ findingId = 'SV-F001', number = 1, route = 'local-close', result = 'closed',
  prior = null, reviewerEvent = null, invalidated = false, runtimeRequired = true,
  sourceArtifact = 'iterations/v1/system-review/review-001.md' }) => `---
schema: system-finding-closure/v1
iteration: v1
closure_id: closure-${String(number).padStart(3, '0')}
finding_id: ${findingId}
source_artifact: ${sourceArtifact}
prior_closure: ${prior}
evidence:
  - evidence/system.txt
repair_candidate:
  base: ${candidate}
  head: ${repair}
route:
  expected: ${number === 1 ? (result === 'escalated' ? 'local-close' : route) : 'system-rereview'}
  effective: ${route}
local_review:
  required: ${route === 'local-close' ? 'true' : 'false'}
  task_id: ${route === 'local-close' ? 'demo-v1-repair' : 'null'}
  report: ${route === 'local-close' ? 'iterations/v1/code-reviews/demo-v1-repair/round-01.md' : 'null'}
  reviewer_isolation: ${route === 'local-close' ? 'fresh-isolated' : 'null'}
  result: ${route === 'local-close' ? 'pass' : 'not-required'}
semantic_revalidation:
  required_scope:
    - affected-call-chain
  verified_scope:
    - affected-call-chain
  result: pass
runtime_revalidation:
  required: ${runtimeRequired ? 'true' : 'false'}
  not_required_reason: ${runtimeRequired ? 'null' : 'no runtime-observable behavior'}
  required_scope:${runtimeRequired ? '\n    - target-runtime-path' : ' []'}
  verified_scope:${runtimeRequired ? '\n    - target-runtime-path' : ' []'}
  result: ${runtimeRequired ? 'pass' : 'not-required'}
system_reviewer_event: ${reviewerEvent}
full_snapshot_invalidated: ${invalidated ? 'true' : 'false'}
invalidation_reason: ${invalidated ? 'shared API redesign invalidates consumers' : 'null'}
escalation:
  occurred: ${result === 'escalated' ? 'true' : 'false'}
  reason: ${result === 'escalated' ? 'repair changed shared API' : 'null'}
result: ${result}
created_at: 2026-09-20T13:00:00Z
---

## Evidence

fixture
`;

const standaloneFinding = ({ route = 'system-rereview', runtimeRequired = false } = {}) => `---
schema: system-finding/v1
iteration: v1
finding_id: SV-F001
origin: runtime-verification
severity: blocking
category: runtime
summary: runtime path fails after review publication
candidate:
  head: ${candidate}
source_review: review-001
evidence:
  - evidence/system.txt
required_action:
  type: fix-code
  description: repair runtime behavior
closure:
  route: ${route}
revalidation:
  semantic:
    required: true
    scope:
      - affected-call-chain
  runtime:
    required: ${runtimeRequired ? 'true' : 'false'}
    not_required_reason: ${runtimeRequired ? 'null' : 'no runtime-observable repair'}
    scope:${runtimeRequired ? '\n      - target-runtime-path' : ' []'}
full_snapshot_invalidated: false
invalidation_reason: null
state: open
created_at: 2026-09-20T12:30:00Z
---

## Evidence and impact

fixture
`;

const status = ({ state = 'merged', final = candidate, reviewNumber = 1, result = 'integration-tests/result-v1.md' } = {}) => `project: demo
schema: 1
generated_by: hact-method
review_architecture: system-verification/v1
iterations: {}
tasks:
  - id: demo-v1-integration-verify
    iteration: v1
    sprint: null
    source: null
    title: System Verification
    type: integration-verify
    layer: null
    status: ${state}
    assigned_to: codex
    pr: null
    parent_id: null
    depends_on: []
    delivery: null
    urgency: null
    system_review_dir: iterations/v1/system-review
    current_system_review: iterations/v1/system-review/review-${String(reviewNumber).padStart(3, '0')}.md
    integration_result: ${result}
    final_candidate: ${final}
  - id: demo-v1-repair
    iteration: v1
    sprint: null
    source: integration
    title: Repair system finding
    type: develop
    layer: backend
    status: merged
    assigned_to: codex
    pr: 1
    parent_id: demo-v1-integration-verify
    depends_on: []
    delivery: null
    urgency: null
integration_tests: []
code_review_archives: []
code_reviews: []
`;

const integration = ({ final = candidate, reviewNumber = 1, ids = [], scope = ['baseline-runtime-path'], satisfied = true } = {}) => `---
schema: integration-result/v2
iteration: v1
candidate_head: ${final}
system_review_dir: iterations/v1/system-review
current_system_review: iterations/v1/system-review/review-${String(reviewNumber).padStart(3, '0')}.md
revalidation_of: [${ids.join(', ')}]
runtime_scope: [${scope.join(', ')}]
result_status: ${satisfied ? 'satisfied' : 'blocked'}
evidence_state: sufficient
created_at: 2026-09-20T14:00:00Z
---

| # | 模块 | 场景描述 | 结果 | 证据 | 未运行原因 | 现象 | 级别 | 复测 |
|---|---|---|---|---|---|---|---|---|
| BE-01 | backend | real path | ✅ | \`integration-tests/evidence/v1/BE-01/transcript.txt\` | — | — | — | 通过 |
`;

function reset() {
  git(['reset', '--mixed', 'HEAD']);
  for (const rel of ['iterations/v1/system-review', 'iterations/v1/code-reviews', 'integration-tests', 'local-reviews'])
    fs.rmSync(path.join(root, ...rel.split('/')), { recursive: true, force: true });
  write('evidence/system.txt', 'evidence\n');
  write('integration-tests/evidence/v1/BE-01/transcript.txt', 'HTTP 200\nstate=done\n');
}

function validateStagedComplete() {
  git(['add', '-A']);
  return validate('v1', root, { staged: true });
}

function writeLocalReview({ taskId = 'demo-v1-repair', reviewedHead = repairTree, conclusion = 'pass' } = {}) {
  write(`iterations/v1/code-reviews/${taskId}/round-01.md`, `---
schema: develop-review-round/v2
task_id: ${taskId}
round: 1
mode: full
risk: standard
reviewed_base: ${git(['rev-parse', `${candidate}^{tree}`])}
reviewed_head: ${reviewedHead}
conclusion: ${conclusion}
---

System finding SV-F001 reviewed with affected-call-chain and target-runtime-path scope.
`);
}

function validPass() {
  reset();
  write('status.yml', status());
  write('iterations/v1/system-review/review-001.md', review({}));
  write('integration-tests/result-v1.md', integration());
}

assert.deepStrictEqual(parseYamlText('root:\n  list:\n    - id: one\n      nested:\n        ok: true\n'),
  { root: { list: [{ id: 'one', nested: { ok: true } }] } }, 'controlled YAML parser handles nested finding shape');

try {
  validPass();
  assert.deepStrictEqual(validateStagedComplete(), [], 'full pass + runtime evidence completes System Verification from index truth');

  write('status.yml', status({ final: repair }));
  write('integration-tests/result-v1.md', integration({ final: repair }));
  assert.ok(validateStagedComplete().some(error => /semantic assurance frontier/.test(error)), 'unreviewed final candidate advance fails semantic frontier');

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 3 }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'system-rereview', runtimeRequired: false } }));
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: forked, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/review-003.md', review({ number: 3, type: 'full', head: repair, predecessor: 'review-002', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', reviewerEvent: 'iterations/v1/system-review/review-003.md', runtimeRequired: false }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 3 }));
  assert.ok(validateStagedComplete().some(error => /forked\/incomparable/.test(error)), 'forked assured candidate lineages fail');

  reset();
  write('status.yml', status({ final: repair }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'local-close' } })
    .replace('route: local-close', 'route: missing-route'));
  write('integration-tests/result-v1.md', integration({ final: repair }));
  const missingRouteErrors = validate('v1', root, { inProgress: true });
  assert.ok(missingRouteErrors.some(error => /closure route/.test(error)), `missing route fails: ${missingRouteErrors.join(' | ')}`);

  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'system-rereview', invalidated: true } })
    .replace('invalidation_reason: shared API redesign invalidates consumers', 'invalidation_reason: null'));
  assert.ok(validate('v1', root, { inProgress: true }).some(error => /invalidation reason/.test(error)), 'invalidation without reason fails');

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 2 }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'system-rereview' } }));
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'missing-review', revalidation: ['SV-F001'] }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 2 }));
  assert.ok(validate('v1', root, { inProgress: true }).some(error => /predecessor/.test(error)), 'targeted without valid predecessor fails');

  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: [] }));
  assert.ok(validate('v1', root, { inProgress: true }).some(error => /revalidation_of/.test(error)), 'targeted system-rereview without finding scope fails');

  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  assert.ok(validateStagedComplete().some(error => /remains open/.test(error)), 'later pass cannot silently remove finding');

  reset();
  write('status.yml', status({ final: repair }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'local-close' } }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', result: 'escalated' }));
  write('integration-tests/result-v1.md', integration({ final: repair }));
  assert.ok(validateStagedComplete().some(error => /remains escalated/.test(error)), 'unresolved escalation fails completion');

  reset();
  write('status.yml', status({ final: repair }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'local-close' } }));
  writeLocalReview();
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({}));
  write('integration-tests/result-v1.md', integration({ final: repair, ids: ['SV-F001'], scope: ['target-runtime-path'] }));
  assert.deepStrictEqual(validateStagedComplete(), [], 'valid local-close lifecycle passes');
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({}).replace('task_id: demo-v1-repair', 'task_id: unrelated-task'));
  assert.ok(validateStagedComplete().some(error => /exactly one status task/.test(error)), 'unrelated local PASS review cannot close system finding');
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({}));
  writeLocalReview({ reviewedHead: git(['rev-parse', `${candidate}^{tree}`]) });
  assert.ok(validateStagedComplete().some(error => /candidate tree does not match/.test(error)), 'local review candidate must equal repair candidate tree');
  writeLocalReview();
  write('status.yml', status({ final: repair }).replace('source: integration', 'source: bug'));
  assert.ok(validateStagedComplete().some(error => /merged source=integration/.test(error)), 'local repair task must be source=integration');
  write('status.yml', status({ final: repair }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({})
    .replace('required_scope:\n    - affected-call-chain', 'required_scope: []'));
  assert.ok(validateStagedComplete().some(error => /semantic required scope dropped/.test(error)), 'closure cannot drop declared semantic scope');
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({})
    .replace('verified_scope:\n    - target-runtime-path', 'verified_scope: []'));
  assert.ok(validateStagedComplete().some(error => /runtime revalidation pass covering required scope|runtime revalidation incomplete/.test(error)), 'required runtime verified scope cannot disappear');
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({}));
  write('integration-tests/result-v1.md', integration({ final: repair, ids: ['SV-F001'], scope: ['unrelated-runtime-path'] }));
  assert.ok(validateStagedComplete().some(error => /runtime_scope 缺 target-runtime-path/.test(error)), 'integration result must cover required runtime scope');

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 2 }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'system-rereview', runtimeRequired: false } }));
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', reviewerEvent: 'iterations/v1/system-review/review-002.md' }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 2, ids: ['SV-F001'], scope: ['target-runtime-path'] }));
  assert.deepStrictEqual(validateStagedComplete(), [], 'valid targeted system-rereview lifecycle passes');
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] })
    .replace('  - affected-call-chain\nevidence:', '  - unrelated-scope\nevidence:'));
  assert.ok(validateStagedComplete().some(error => /Reviewer event scope/.test(error)), 'System Reviewer event must cover required semantic scope');
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', reviewerEvent: 'iterations/v1/system-review/review-002.md' })
    .replace('semantic_revalidation:\n  required_scope:', 'semantic_revalidation:\n  required_scope:')
    .replace('  result: pass\nruntime_revalidation:', '  result: pending\nruntime_revalidation:'));
  assert.ok(validateStagedComplete().some(error => /semantic revalidation pass/.test(error)), 'closed system-rereview cannot leave semantic revalidation pending');

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 2 }));
  write('iterations/v1/system-review/review-001.md', review({}));
  write('iterations/v1/system-review/findings/SV-F001.md', standaloneFinding());
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({
    route: 'system-rereview', reviewerEvent: 'iterations/v1/system-review/review-002.md', runtimeRequired: false,
    sourceArtifact: 'iterations/v1/system-review/findings/SV-F001.md'
  }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 2 }));
  assert.deepStrictEqual(validateStagedComplete(), [], 'post-publication runtime finding uses standalone artifact and common targeted closure');

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 2 }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'local-close', runtimeRequired: false } }));
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'targeted', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', result: 'escalated', runtimeRequired: false }));
  write('iterations/v1/system-review/closures/SV-F001/closure-002.md', closure({
    number: 2, route: 'system-rereview', prior: 'iterations/v1/system-review/closures/SV-F001/closure-001.md',
    reviewerEvent: 'iterations/v1/system-review/review-002.md', runtimeRequired: false
  }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 2 }));
  assert.deepStrictEqual(validateStagedComplete(), [], 'local-close escalation followed by targeted System Reviewer closure passes');

  // Git Truth binding: staged completion cannot consume untracked formal artifacts.
  validPass();
  git(['reset', '--mixed', 'HEAD']);
  git(['add', 'status.yml']);
  assert.ok(validate('v1', root, { staged: true }).some(error => /at least one system review event|required integration_result|Git index/.test(error)),
    'staged merged status cannot consume untracked System Review artifacts');

  validPass();
  git(['reset', '--mixed', 'HEAD']);
  git(['add', 'status.yml', '_meta/method-sync.json', 'iterations/v1/system-review/review-001.md', 'evidence/system.txt', 'integration-tests/result-v1.md']);
  assert.ok(validate('v1', root, { staged: true }).some(error => /runtime evidence|Git index|不在 index Git Truth/.test(error)),
    'staged completion cannot consume untracked integration result/runtime evidence');

  reset();
  write('status.yml', status({ final: repair }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'local-close' } }));
  writeLocalReview({ conclusion: 'fail' });
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({}));
  write('integration-tests/result-v1.md', integration({ final: repair, ids: ['SV-F001'], scope: ['target-runtime-path'] }));
  git(['add', '-A']);
  writeLocalReview({ conclusion: 'pass' });
  assert.ok(validate('v1', root, { staged: true }).some(error => /conclusion invalid/.test(error)),
    'worktree PASS cannot replace non-PASS local review stored in index');

  validPass();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-system-review-outside-'));
  fs.writeFileSync(path.join(outside, 'evidence.txt'), 'outside\n');
  const link = path.join(root, 'escaped');
  try {
    fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    write('iterations/v1/system-review/review-001.md', review({}).replace('evidence/system.txt', 'escaped/evidence.txt'));
    assert.ok(validate('v1', root, { inProgress: true }).some(error => /realpath escapes project|symlink is not allowed/.test(error)),
      'evidence symlink/junction escape must fail');
  } finally {
    fs.rmSync(link, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }

  reset();
  write('status.yml', status({ final: repair, reviewNumber: 2 }));
  write('iterations/v1/system-review/review-001.md', review({ result: 'blocked', finding: { id: 'SV-F001', route: 'system-rereview', invalidated: true, runtimeRequired: false } }));
  write('iterations/v1/system-review/review-002.md', review({ number: 2, type: 'full', head: repair, predecessor: 'review-001', revalidation: ['SV-F001'] }));
  write('iterations/v1/system-review/closures/SV-F001/closure-001.md', closure({ route: 'system-rereview', reviewerEvent: 'iterations/v1/system-review/review-002.md', invalidated: true, runtimeRequired: false }));
  write('integration-tests/result-v1.md', integration({ final: repair, reviewNumber: 2 }));
  assert.deepStrictEqual(validateStagedComplete(), [], 'valid full re-review after broad invalidation passes');

  git(['commit', '-m', 'publish system review']);
  write('iterations/v1/acceptance-report.md', '## 验收结论\n通过\n');
  git(['add', 'iterations/v1/acceptance-report.md']); git(['commit', '-m', 'acceptance']);
  const gatePass = cp.spawnSync(process.execPath, [path.join(__dirname, 'check-gate.js'), 'G4', 'v1', root], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(gatePass.status, 0, gatePass.stdout + gatePass.stderr);
  fs.appendFileSync(path.join(root, 'integration-tests/result-v1.md'), '\ndirty runtime summary\n');
  assert.ok(validate('v1', root).some(error => /differ from committed HEAD/.test(error)), 'committed completion rejects dirty authoritative worktree artifacts');
  git(['checkout', '--', 'integration-tests/result-v1.md']);
  write('iterations/v1/system-review/review-001.md', fs.readFileSync(path.join(root, 'iterations/v1/system-review/review-001.md'), 'utf8') + '\nmutation\n');
  git(['add', 'iterations/v1/system-review/review-001.md']);
  assert.ok(validate('v1', root, { inProgress: true, staged: true }).some(error => /immutable/.test(error)), 'published event modification fails staged audit');

  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  for (const name of ['check-system-review.js', 'check-integration-evidence.js', 'check-sprint.js', 'check-gate.js', 'git-truth-reader.js'])
    fs.copyFileSync(path.join(__dirname, name), path.join(root, 'scripts', name));
  fs.copyFileSync(path.join(__dirname, 'pre-commit-hook.sh'), path.join(root, 'pre-commit.sh'));
  const shell = process.platform === 'win32' ? path.join(process.env.ProgramFiles, 'Git', 'bin', 'sh.exe') : '/bin/sh';
  const hooked = cp.spawnSync(shell, ['pre-commit.sh'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(hooked.status, 1, hooked.stdout + hooked.stderr);
  assert.match(hooked.stdout + hooked.stderr, /check-system-review\.js v1 \. --in-progress --staged/, 'hook routes system-review artifacts to staged checker');
  assert.doesNotMatch(hooked.stdout + hooked.stderr, /MODULE_NOT_FOUND|internal error/, 'hook must execute the real checker, not fail to load dependencies');

  console.log('✅ System Review routing, lineage, closure, invalidation and immutable-event fixtures passed');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
