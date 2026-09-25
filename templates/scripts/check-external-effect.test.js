#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const pathModule = require('path');
const childProcess = require('child_process');
const checker = require('./check-external-effect.js');

const sha = character => character.repeat(40);
const clone = value => JSON.parse(JSON.stringify(value));
const path = '_meta/external-effects/deploy-001.json';

function valid() {
  return {
    schema: 'hact-external-effect/v1',
    operation_id: 'deploy-001',
    task_ref: 'status.yml#tasks/deploy-001',
    method_sha: sha('a'),
    action: 'deploy',
    target: 'environment:production',
    snapshot: sha('b'),
    request_key: 'deploy-001-attempt-001',
    authority_refs: ['authority:user-001'],
    intent_receipt: {
      commit_sha: sha('c'), record_blob_sha: sha('d'),
      reachable_ref: 'refs/remotes/origin/effects', verified_at: '2026-09-25T12:00:00Z'
    },
    outcome: 'pending', observed_at: null, evidence_refs: []
  };
}

assert.deepStrictEqual(checker.validateRecord(valid(), { recordPath: path, dispatchReady: true }), []);

const draft = valid();
draft.intent_receipt = { commit_sha: null, record_blob_sha: null, reachable_ref: null, verified_at: null };
assert.deepStrictEqual(checker.validateRecord(draft, { recordPath: path }), []);
assert.ok(checker.validateRecord(draft, { recordPath: path, dispatchReady: true }).some(x => /commit_sha/.test(x)));

for (const field of ['task_ref', 'action', 'target', 'request_key']) {
  const broken = valid(); broken[field] = null;
  assert.ok(checker.validateRecord(broken, { recordPath: path }).length, `${field} must fail`);
}

const wrongSnapshot = valid(); wrongSnapshot.snapshot = 'latest';
assert.ok(checker.validateRecord(wrongSnapshot).some(x => /snapshot/.test(x)));

const succeeded = valid();
succeeded.outcome = 'succeeded'; succeeded.observed_at = '2026-09-25T12:05:00Z';
succeeded.evidence_refs = ['evidence/deploy-001.json'];
assert.deepStrictEqual(checker.validateRecord(succeeded, { recordPath: path }), []);

const noEvidence = clone(succeeded); noEvidence.evidence_refs = [];
assert.ok(checker.validateRecord(noEvidence).some(x => /requires evidence_refs/.test(x)));

const indeterminate = clone(succeeded); indeterminate.outcome = 'indeterminate';
assert.deepStrictEqual(checker.validateRecord(indeterminate, { recordPath: path }), []);

const semanticClaim = valid(); semanticClaim.task_complete = true;
assert.ok(checker.validateRecord(semanticClaim, { recordPath: path }).some(x => /unknown fields/.test(x)));

const wrongPath = checker.validateRecord(valid(), { recordPath: '_meta/external-effects/other.json' });
assert.ok(wrongPath.some(x => /record path/.test(x)));

const root = fs.mkdtempSync(pathModule.join(os.tmpdir(), 'hact-effect-'));
const git = args => childProcess.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
git(['init', '-q']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
const relative = '_meta/external-effects/deploy-001.json';
const file = pathModule.join(root, relative); fs.mkdirSync(pathModule.dirname(file), { recursive: true });
const intent = valid(); intent.intent_receipt = { commit_sha: null, record_blob_sha: null, reachable_ref: null, verified_at: null };
fs.writeFileSync(file, `${JSON.stringify(intent, null, 2)}\n`); git(['add', relative]); git(['commit', '-qm', 'intent']);
const commit = git(['rev-parse', 'HEAD']).stdout.trim();
const blob = git(['rev-parse', `${commit}:${relative}`]).stdout.trim();
git(['branch', 'effects', commit]);
const ready = valid(); ready.intent_receipt = { commit_sha: commit, record_blob_sha: blob, reachable_ref: 'refs/heads/effects', verified_at: '2026-09-25T12:00:00Z' };
assert.deepStrictEqual(checker.verifyGitReceipt(root, relative, ready, []), []);
const wrongBlob = clone(ready); wrongBlob.intent_receipt.record_blob_sha = sha('f');
assert.ok(checker.verifyGitReceipt(root, relative, wrongBlob, []).some(x => /record_blob_sha/.test(x)));
const drift = clone(ready); drift.target = 'environment:other';
assert.ok(checker.verifyGitReceipt(root, relative, drift, []).some(x => /intent drift/.test(x)));
const badRef = clone(ready); badRef.intent_receipt.reachable_ref = 'refs/heads/missing';
assert.ok(checker.verifyGitReceipt(root, relative, badRef, []).some(x => /reachable_ref/.test(x)));
assert.ok(checker.verifyGitReceipt(pathModule.join(root, 'not-repo'), relative, ready, []).some(x => /Git repository/.test(x)));
if (!pathModule.resolve(root).startsWith(pathModule.resolve(os.tmpdir()) + pathModule.sep)) throw new Error('temp escaped');
fs.rmSync(root, { recursive: true, force: true });

console.log('✅ check-external-effect current-schema fixtures passed');
