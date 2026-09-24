#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const path = require('path');
const { SCHEMA, buildProjection } = require('./build-review-projection.js');

const sha = character => character.repeat(40);
const ref = (name, character) => ({ ref: name, immutable_identity: sha(character) });
const clone = value => JSON.parse(JSON.stringify(value));

function initialInput() {
  return {
    review_type: 'initial',
    method_sha: sha('a'),
    task_contract: ref('tasks/develop.md', 'b'),
    shared_protocol_refs: [ref('protocols/review.md', 'd'), ref('protocols/authority.md', 'c')],
    fixed_candidate: ref('git:refs/review/candidate', 'e'),
    authoritative_upstream_artifact_refs: [ref('iterations/v1/trd.md', '1'), ref('iterations/v1/prd.md', 'f')],
    original_evidence_refs: [ref('evidence/tests.log', '2'), ref('evidence/build.log', '3')]
  };
}

const input = initialInput();
const before = JSON.stringify(input);
const projection = buildProjection(input);
assert.strictEqual(JSON.stringify(input), before, 'buildProjection must not mutate caller input');
assert.strictEqual(projection.schema, SCHEMA);
assert.strictEqual(projection.reviewer_isolation, 'fresh-isolated');
assert.deepStrictEqual(Object.keys(projection), [
  'schema', 'review_type', 'reviewer_isolation', 'method_sha', 'task_contract',
  'shared_protocol_refs', 'fixed_candidate', 'authoritative_upstream_artifact_refs',
  'original_evidence_refs'
], 'initial projection must contain only allowlisted output keys');
assert.deepStrictEqual(projection.shared_protocol_refs.map(item => item.ref),
  ['protocols/authority.md', 'protocols/review.md']);
assert.deepStrictEqual(projection.authoritative_upstream_artifact_refs.map(item => item.ref),
  ['iterations/v1/prd.md', 'iterations/v1/trd.md']);
assert.deepStrictEqual(projection.original_evidence_refs.map(item => item.ref),
  ['evidence/build.log', 'evidence/tests.log']);

const excludedOwnerFields = [
  'owner_full_chat', 'owner_private_reasoning', 'owner_defensive_summary',
  'irrelevant_prior_attempts', 'mutable_worktree_narrative'
];
for (const key of excludedOwnerFields) {
  const value = initialInput();
  value[key] = 'must not enter reviewer projection';
  assert.throws(() => buildProjection(value), new RegExp(`unknown top-level field.*${key}`),
    `${key} must fail closed`);
}

const forbiddenSemanticFields = [
  'review_result', 'verdict', 'pass', 'gate', 'gate_approval',
  'task_completion', 'completion', 'authority_sufficient', 'authority_decision'
];
for (const key of forbiddenSemanticFields) {
  const value = initialInput();
  value[key] = true;
  assert.throws(() => buildProjection(value), new RegExp(`unknown top-level field.*${key}`),
    `${key} must not become a projection claim`);
}

for (const forbidden of [
  { prior_report_ref: ref('reviews/round-01.md', '4') },
  { open_finding_ids: ['PKG-F001'] }
]) assert.throws(() => buildProjection({ ...initialInput(), ...forbidden }),
  /initial review must not contain prior_report_ref or open_finding_ids/);

const targetedBase = { ...initialInput(), review_type: 'targeted' };
assert.throws(() => buildProjection(targetedBase), /targeted review requires prior_report_ref/);
assert.throws(() => buildProjection({ ...targetedBase, prior_report_ref: ref('reviews/round-01.md', '4') }),
  /targeted review requires non-empty open_finding_ids/);
assert.throws(() => buildProjection({
  ...targetedBase,
  prior_report_ref: ref('reviews/round-01.md', '4'),
  open_finding_ids: []
}), /targeted review requires non-empty open_finding_ids/);

const targetedInput = {
  ...targetedBase,
  prior_report_ref: ref('reviews/round-01.md', '4'),
  open_finding_ids: ['PKG-F002', 'PKG-F001']
};
const targeted = buildProjection(targetedInput);
assert.deepStrictEqual(targeted.prior_report_ref, ref('reviews/round-01.md', '4'));
assert.deepStrictEqual(targeted.open_finding_ids, ['PKG-F001', 'PKG-F002']);

const reordered = clone(targetedInput);
reordered.shared_protocol_refs.reverse();
reordered.authoritative_upstream_artifact_refs.reverse();
reordered.original_evidence_refs.reverse();
reordered.open_finding_ids.reverse();
assert.strictEqual(JSON.stringify(buildProjection(reordered)), JSON.stringify(targeted),
  'reordered equivalent set-like inputs must produce byte-identical objects');

assert.throws(() => buildProjection({
  ...initialInput(),
  task_contract: { ...ref('tasks/develop.md', 'b'), owner_full_chat: 'nested leak' }
}), /task_contract has unknown field/,
'reference objects must also fail closed');

const script = path.join(__dirname, 'build-review-projection.js');
const cli = childProcess.spawnSync(process.execPath, [script], {
  input: JSON.stringify(targetedInput), encoding: 'utf8'
});
assert.strictEqual(cli.status, 0, cli.stderr);
assert.strictEqual(cli.stdout, `${JSON.stringify(targeted, null, 2)}\n`,
  'CLI output must equal buildProjection output');
const invalidJson = childProcess.spawnSync(process.execPath, [script], {
  input: '{not-json', encoding: 'utf8'
});
assert.notStrictEqual(invalidJson.status, 0, 'invalid CLI JSON must fail');
assert.match(invalidJson.stderr, /build-review-projection failed/);
const forbiddenCli = childProcess.spawnSync(process.execPath, [script], {
  input: JSON.stringify({ ...initialInput(), owner_full_chat: 'leak' }), encoding: 'utf8'
});
assert.notStrictEqual(forbiddenCli.status, 0, 'forbidden CLI input must fail');
assert.strictEqual(forbiddenCli.stdout, '', 'invalid projection must not emit a partial manifest');

console.log('✅ reviewer projection allowlist, exclusions, targeting and determinism fixtures passed');
