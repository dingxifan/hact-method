#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const checker = require('./check-runtime-crossing.js');

const sha = character => character.repeat(40);
const sha256 = character => character.repeat(64);
const clone = value => JSON.parse(JSON.stringify(value));
const recordPath = '_meta/runtime-crossings/crossing-001.yml';

function validRecord() {
  return {
    schema: 'hact-runtime-crossing/v2',
    crossing_id: 'crossing-001',
    kind: 'execution-task',
    task: { id: 'demo-v1-001', source: 'sprint', method_sha: sha('a') },
    status: {
      authoritative_ref: 'status.yml#tasks/demo-v1-001',
      snapshot_identity: sha('b'),
      observed_state: 'taken-by',
      observed_at: '2026-09-24T12:00:00Z',
      authoritative: false
    },
    ownership: {
      mode: 'delegated',
      owner_ref: 'status.yml#tasks/demo-v1-001/assigned_to',
      effective_from: '2026-09-24T12:00:00Z'
    },
    repository: { identity: 'repo:demo', workspace: 'project-root' },
    contract: { authoritative_ref: 'iterations/v1/queue/demo-v1-001.md', immutable_identity: sha('c') },
    authority: {
      permission_ceiling: {
        repository_write: true, commit: true, push: false, deploy: false, external_write: false
      },
      authority_refs: ['authority:user-message-001']
    },
    candidate: { ref: 'refs/heads/feature', identity: sha('d') },
    external: { action: null, target: null, snapshot_identity: null },
    return: {
      origin_task_ref: null, origin_issue_ref: null, affected_scope: [],
      return_mode: null, return_condition: null
    },
    runtime: {
      adapter: 'codex', request_key: 'request-001', job_id: null,
      revision: null, status: null, indeterminate: false
    },
    persistence: {
      dispatch: {
        record_path: recordPath,
        commit_sha: sha('e'),
        record_blob_sha: sha('f'),
        reachable_ref: `refs/remotes/origin/runtime@${sha('e')}`,
        verified_at: '2026-09-24T12:01:00Z'
      },
      lifecycle_head: {
        commit_sha: null, record_blob_sha: null, last_event_id: null, verified_at: null
      }
    },
    lifecycle: { events: [] },
    artifacts: [{ path: 'artifacts/result.bin', bytes: 12, sha256: sha256('1') }],
    evidence: [],
    recovery: { last_stable_point: 'dispatch-persisted', next_action: 'dispatch' }
  };
}

const valid = validRecord();
assert.deepStrictEqual(checker.validateRecord(valid, {
  recordPath, requireDispatchReceipt: true, crossRuntime: true
}), [], 'valid v2 record must pass mechanical validation');

const parsedTemplate = checker.parseYamlText(fs.readFileSync(
  path.join(__dirname, '..', 'runtime-crossing-record.yml'), 'utf8'));
assert.strictEqual(parsedTemplate.schema, 'hact-runtime-crossing/v2');
assert.strictEqual(parsedTemplate.status.authoritative, false, 'inline comments must not change boolean parsing');
assert.deepStrictEqual(parsedTemplate.lifecycle.events, []);
assert.deepStrictEqual(Object.keys(parsedTemplate.external), ['action', 'target', 'snapshot_identity'],
  'canonical template must declare exactly the external execution identity fields');
assert.deepStrictEqual(parsedTemplate.external, { action: null, target: null, snapshot_identity: null },
  'canonical external block must not invent defaults');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-runtime-crossing-'));
const legacy = checker.validateProject(temp);
assert.deepStrictEqual(legacy, { files: [], errors: [] }, 'legacy project with no crossing records must pass');
const cli = childProcess.spawnSync(process.execPath, [path.join(__dirname, 'check-runtime-crossing.js'), '--root', temp], {
  encoding: 'utf8'
});
assert.strictEqual(cli.status, 0, `legacy no-record CLI must pass: ${cli.stdout}\n${cli.stderr}`);
assert.match(cli.stdout, /semantic outcomes not certified/);

const unknownMajor = clone(valid);
unknownMajor.schema = 'hact-runtime-crossing/v3';
assert.ok(checker.validateRecord(unknownMajor).some(error => /incompatible.*v3/.test(error)),
  'unknown major version must fail safely');

const additive = clone(valid);
additive.future_optional_extension = { producer: 'future-runtime' };
assert.deepStrictEqual(checker.validateRecord(additive, { recordPath }), [],
  'unknown additive optional top-level field must be tolerated');

const missingRequiredBlock = clone(valid);
delete missingRequiredBlock.candidate;
assert.ok(checker.validateRecord(missingRequiredBlock).some(error => /candidate is required/.test(error)),
  'required v2 record block must not disappear');

const mutableCandidate = clone(valid);
mutableCandidate.candidate.identity = 'latest';
assert.ok(checker.validateRecord(mutableCandidate).some(error => /candidate\.identity must be immutable/.test(error)));

const invalidKind = clone(valid);
invalidKind.kind = 'magic-runtime';
assert.ok(checker.validateRecord(invalidKind).some(error => /kind must be one of/.test(error)));

const invalidOwnership = clone(valid);
invalidOwnership.ownership.mode = 'runtime-owned';
assert.ok(checker.validateRecord(invalidOwnership).some(error => /ownership\.mode/.test(error)));

const missingRequestKey = clone(valid);
missingRequestKey.runtime.request_key = null;
assert.ok(checker.validateRecord(missingRequestKey).some(error => /request_key is required/.test(error)),
  'dispatched crossing requires durable request_key');

const event = (id, sequence, revision = sequence, type = 'runtime-observed') => ({
  event_id: id,
  sequence,
  revision,
  type,
  timestamp: `2026-09-24T12:0${sequence}:00Z`,
  authority_refs: [],
  runtime_receipts: [],
  artifact_refs: [],
  evidence_refs: [],
  details: {}
});

const nonMonotonic = clone(valid);
nonMonotonic.lifecycle.events = [event('event-001', 2), event('event-002', 1)];
assert.ok(checker.validateRecord(nonMonotonic).some(error => /sequence must be.*increasing/.test(error)),
  'non-monotonic lifecycle sequence must fail');

const conflictingDuplicate = clone(valid);
conflictingDuplicate.lifecycle.events = [event('event-001', 1), event('event-001', 2, 2, 'different')];
assert.ok(checker.validateRecord(conflictingDuplicate).some(error => /conflicts with different prior content/.test(error)),
  'same event id with conflicting content must fail');

const copiedContract = clone(valid);
copiedContract.contract.acceptance_criteria = ['AC-01'];
assert.ok(checker.validateRecord(copiedContract).some(error => /forbidden copied semantic Contract data/.test(error)),
  'semantic Contract fields must not be duplicated into crossing records');

const semanticClaims = clone(valid);
semanticClaims.authority_sufficient = true;
semanticClaims.review_pass = true;
semanticClaims.task_complete = true;
semanticClaims.external_effect_occurred = false;
const semanticClaimErrors = checker.validateRecord(semanticClaims);
for (const key of ['authority_sufficient', 'review_pass', 'task_complete', 'external_effect_occurred'])
  assert.ok(semanticClaimErrors.some(error => error.includes(key) && /cannot certify/.test(error)),
    `mechanical checker must reject semantic certification field ${key}`);

const child = clone(valid);
child.kind = 'child-task';
child.return = {
  origin_task_ref: 'task:origin-001',
  origin_issue_ref: 'finding:SV-F001',
  affected_scope: ['affected-call-chain'],
  return_mode: 'resume-active-origin',
  return_condition: 'child merged'
};
assert.deepStrictEqual(checker.validateRecord(child, { recordPath }), [], 'valid child references must pass');
const invalidChild = clone(child);
invalidChild.return.origin_task_ref = null;
invalidChild.return.return_mode = 'reopen-merged-origin';
assert.ok(checker.validateRecord(invalidChild).some(error => /origin_task_ref/.test(error)));
assert.ok(checker.validateRecord(invalidChild).some(error => /return\.return_mode/.test(error)));

const external = clone(valid);
external.kind = 'external-execution';
external.external = {
  action: 'deploy',
  target: 'environment:test',
  snapshot_identity: sha('2')
};
assert.deepStrictEqual(checker.validateRecord(external, { recordPath }), [],
  'valid external action/target/snapshot references must pass');
for (const [field, pattern] of [
  ['action', /external\.action/],
  ['target', /external\.target/],
  ['snapshot_identity', /external\.snapshot_identity/]
]) {
  const missing = clone(external);
  delete missing.external[field];
  assert.ok(checker.validateRecord(missing).some(error => pattern.test(error)),
    `external-execution missing ${field} must fail`);
}
const mutableExternalSnapshot = clone(external);
mutableExternalSnapshot.external.snapshot_identity = 'latest';
assert.ok(checker.validateRecord(mutableExternalSnapshot).some(error => /external\.snapshot_identity/.test(error)));

const nonExternalMetadata = clone(valid);
nonExternalMetadata.external = clone(external.external);
nonExternalMetadata.lifecycle.events = [
  { ...event('event-001', 1), permissions_exercised: { external_write: true } }
];
assert.ok(checker.validateRecord(nonExternalMetadata).some(error => /exceeds permission_ceiling mechanically/.test(error)),
  'external metadata on a non-external kind must not authorize external_write beyond permission_ceiling');

const partialReceipt = clone(valid);
partialReceipt.persistence.dispatch.record_blob_sha = null;
assert.ok(checker.validateRecord(partialReceipt, { recordPath }).some(error => /record_blob_sha/.test(error)),
  'partial dispatch receipt must fail');

const missingReachability = clone(valid);
missingReachability.persistence.dispatch.reachable_ref = null;
assert.deepStrictEqual(checker.validateRecord(missingReachability, { recordPath, requireDispatchReceipt: true }), [],
  'strictly local dispatch may omit reachable_ref');
assert.ok(checker.validateRecord(missingReachability, {
  recordPath, requireDispatchReceipt: true, crossRuntime: true
}).some(error => /reachable_ref is required/.test(error)),
  'cross-Runtime dispatch requires reachable_ref');

const lifecycleHead = clone(valid);
lifecycleHead.lifecycle.events = [event('event-001', 1), event('event-002', 2)];
lifecycleHead.persistence.lifecycle_head = {
  commit_sha: sha('3'),
  record_blob_sha: sha('4'),
  last_event_id: 'event-002',
  verified_at: '2026-09-24T12:03:00Z'
};
assert.deepStrictEqual(checker.validateRecord(lifecycleHead, {
  recordPath, requireLifecycleHead: true
}), [], 'valid lifecycle head receipt must pass');
const staleLifecycleHead = clone(lifecycleHead);
staleLifecycleHead.persistence.lifecycle_head.last_event_id = 'event-001';
assert.ok(checker.validateRecord(staleLifecycleHead).some(error => /must match the latest lifecycle event/.test(error)));

const exceededCeiling = clone(lifecycleHead);
exceededCeiling.lifecycle.events[1].permissions_exercised = { push: true };
assert.ok(checker.validateRecord(exceededCeiling).some(error => /exceeds permission_ceiling mechanically/.test(error)),
  'checker may compare requested permission to ceiling mechanically');

const badArtifact = clone(valid);
badArtifact.artifacts[0].sha256 = 'not-a-hash';
badArtifact.artifacts[0].bytes = -1;
assert.ok(checker.validateRecord(badArtifact).some(error => /sha256/.test(error)));
assert.ok(checker.validateRecord(badArtifact).some(error => /bytes/.test(error)));

if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temporary path escaped OS temp');
fs.rmSync(temp, { recursive: true, force: true });

console.log('✅ check-runtime-crossing mechanical boundary fixtures passed');
