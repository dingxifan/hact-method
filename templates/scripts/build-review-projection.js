#!/usr/bin/env node
'use strict';

/*
 * Build a deterministic mechanical input manifest for Independent Review.
 * This module does not read repositories, chats, files, networks, or runtimes,
 * and never generates findings, verdicts, approvals, state, or completion.
 */

const SCHEMA = 'hact-review-projection/v1';
const REVIEW_TYPES = new Set(['initial', 'targeted']);
const INPUT_KEYS = new Set([
  'review_type',
  'method_sha',
  'task_contract',
  'shared_protocol_refs',
  'fixed_candidate',
  'authoritative_upstream_artifact_refs',
  'original_evidence_refs',
  'prior_report_ref',
  'open_finding_ids'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function immutableIdentity(value) {
  return typeof value === 'string' && (
    /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value)
    || /^git:(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value)
    || /^sha256:[0-9a-f]{64}$/i.test(value)
  );
}

function normalizeRef(value, label) {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
  const keys = Object.keys(value).sort();
  const unknown = keys.filter(key => !['immutable_identity', 'ref'].includes(key));
  if (unknown.length) throw new Error(`${label} has unknown field(s): ${unknown.join(', ')}`);
  if (typeof value.ref !== 'string' || !value.ref.trim() || value.ref.includes('\0'))
    throw new Error(`${label}.ref must be a non-empty reference`);
  if (!immutableIdentity(value.immutable_identity))
    throw new Error(`${label}.immutable_identity must be immutable`);
  return { ref: value.ref.trim(), immutable_identity: value.immutable_identity };
}

function normalizeRefs(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  const normalized = value.map((item, index) => normalizeRef(item, `${label}[${index}]`));
  const keys = normalized.map(item => `${item.ref}\0${item.immutable_identity}`);
  if (new Set(keys).size !== keys.length) throw new Error(`${label} must not contain duplicates`);
  return normalized.sort((left, right) =>
    compareText(left.ref, right.ref) || compareText(left.immutable_identity, right.immutable_identity));
}

function normalizeFindingIds(value) {
  if (!Array.isArray(value) || !value.length) throw new Error('targeted review requires non-empty open_finding_ids');
  if (value.some(id => typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(id)))
    throw new Error('open_finding_ids contains an invalid stable id');
  if (new Set(value).size !== value.length) throw new Error('open_finding_ids must not contain duplicates');
  return [...value].sort(compareText);
}

function buildProjection(input) {
  if (!isObject(input)) throw new Error('projection input must be an object');
  const unknown = Object.keys(input).filter(key => !INPUT_KEYS.has(key)).sort();
  if (unknown.length) throw new Error(`unknown top-level field(s): ${unknown.join(', ')}`);
  if (!REVIEW_TYPES.has(input.review_type)) throw new Error('review_type must be initial or targeted');
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(String(input.method_sha || '')))
    throw new Error('method_sha must be a 40/64 hex Git object id');

  const targeted = input.review_type === 'targeted';
  const hasPrior = Object.prototype.hasOwnProperty.call(input, 'prior_report_ref');
  const hasFindings = Object.prototype.hasOwnProperty.call(input, 'open_finding_ids');
  if (!targeted && (hasPrior || hasFindings))
    throw new Error('initial review must not contain prior_report_ref or open_finding_ids');
  if (targeted && !hasPrior) throw new Error('targeted review requires prior_report_ref');
  if (targeted && !hasFindings) throw new Error('targeted review requires non-empty open_finding_ids');

  const output = {
    schema: SCHEMA,
    review_type: input.review_type,
    reviewer_isolation: 'fresh-isolated',
    method_sha: input.method_sha,
    task_contract: normalizeRef(input.task_contract, 'task_contract'),
    shared_protocol_refs: normalizeRefs(input.shared_protocol_refs, 'shared_protocol_refs'),
    fixed_candidate: normalizeRef(input.fixed_candidate, 'fixed_candidate'),
    authoritative_upstream_artifact_refs: normalizeRefs(
      input.authoritative_upstream_artifact_refs, 'authoritative_upstream_artifact_refs'),
    original_evidence_refs: normalizeRefs(input.original_evidence_refs, 'original_evidence_refs')
  };
  if (targeted) {
    output.prior_report_ref = normalizeRef(input.prior_report_ref, 'prior_report_ref');
    output.open_finding_ids = normalizeFindingIds(input.open_finding_ids);
  }
  return output;
}

function main() {
  let source = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { source += chunk; });
  process.stdin.on('end', () => {
    try {
      if (!source.trim()) throw new Error('stdin must contain projection input JSON');
      const output = buildProjection(JSON.parse(source));
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } catch (error) {
      console.error(`build-review-projection failed: ${error.message}`);
      process.exitCode = 1;
    }
  });
}

if (require.main === module) main();
module.exports = { SCHEMA, buildProjection };
