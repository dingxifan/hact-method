#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const SCHEMA = 'hact-external-effect/v1';
const OUTCOMES = new Set(['pending', 'succeeded', 'failed', 'indeterminate', 'reconciled']);
const KEYS = [
  'schema', 'operation_id', 'task_ref', 'method_sha', 'action', 'target', 'snapshot',
  'request_key', 'authority_refs', 'intent_receipt', 'outcome', 'observed_at', 'evidence_refs'
];
const RECEIPT_KEYS = ['commit_sha', 'record_blob_sha', 'reachable_ref', 'verified_at'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const isSha = value => typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
const isIso = value => nonEmpty(value) && !Number.isNaN(Date.parse(value));
const safeRef = value => nonEmpty(value) && !value.includes('\0') && !path.isAbsolute(value);

function validateReceipt(receipt, errors, required) {
  if (!isObject(receipt)) { errors.push('intent_receipt must be an object'); return; }
  const unknown = Object.keys(receipt).filter(key => !RECEIPT_KEYS.includes(key));
  if (unknown.length) errors.push(`intent_receipt has unknown fields: ${unknown.join(', ')}`);
  const values = RECEIPT_KEYS.map(key => receipt[key]);
  const any = values.some(value => value !== null && value !== undefined && value !== '');
  if (!any && !required) return;
  if (!isSha(receipt.commit_sha)) errors.push('intent_receipt.commit_sha must be a Git SHA');
  if (!isSha(receipt.record_blob_sha)) errors.push('intent_receipt.record_blob_sha must be a Git SHA');
  if (receipt.reachable_ref !== null && receipt.reachable_ref !== undefined && !safeRef(receipt.reachable_ref))
    errors.push('intent_receipt.reachable_ref must be a safe reference when present');
  if (!isIso(receipt.verified_at)) errors.push('intent_receipt.verified_at must be ISO-8601');
}

function validateRecord(record, options = {}) {
  const errors = [];
  if (!isObject(record)) return ['record must be a JSON object'];
  const unknown = Object.keys(record).filter(key => !KEYS.includes(key));
  const missing = KEYS.filter(key => !Object.prototype.hasOwnProperty.call(record, key));
  if (unknown.length) errors.push(`unknown fields: ${unknown.join(', ')}`);
  if (missing.length) errors.push(`missing fields: ${missing.join(', ')}`);
  if (record.schema !== SCHEMA) errors.push(`schema must be ${SCHEMA}`);
  if (!nonEmpty(record.operation_id) || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(record.operation_id))
    errors.push('operation_id has invalid stable id shape');
  if (!safeRef(record.task_ref)) errors.push('task_ref must be a safe non-empty reference');
  if (!isSha(record.method_sha)) errors.push('method_sha must be a Git SHA');
  if (!nonEmpty(record.action)) errors.push('action is required');
  if (!nonEmpty(record.target)) errors.push('target is required');
  if (!isSha(record.snapshot)) errors.push('snapshot must be an immutable Git identity');
  if (!nonEmpty(record.request_key)) errors.push('request_key is required');
  if (!Array.isArray(record.authority_refs) || !record.authority_refs.length
      || record.authority_refs.some(ref => !safeRef(ref)))
    errors.push('authority_refs must be a non-empty array of safe references');
  validateReceipt(record.intent_receipt, errors, options.dispatchReady === true);
  if (!OUTCOMES.has(record.outcome)) errors.push(`outcome must be one of: ${[...OUTCOMES].join(', ')}`);
  if (!Array.isArray(record.evidence_refs) || record.evidence_refs.some(ref => !safeRef(ref)))
    errors.push('evidence_refs must be an array of safe references');
  if (record.outcome === 'pending') {
    if (record.observed_at !== null) errors.push('pending outcome requires observed_at=null');
  } else {
    if (!isIso(record.observed_at)) errors.push('terminal outcome requires observed_at ISO-8601');
    if (!Array.isArray(record.evidence_refs) || !record.evidence_refs.length)
      errors.push('terminal outcome requires evidence_refs');
  }
  if (options.recordPath) {
    const expected = `_meta/external-effects/${record.operation_id}.json`;
    if (options.recordPath.replace(/\\/g, '/') !== expected) errors.push(`record path must be ${expected}`);
  }
  return errors;
}

function git(root, args) {
  return childProcess.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

function verifyGitReceipt(root, relative, record, errors = []) {
  const repo = git(root, ['rev-parse', '--show-toplevel']);
  if (repo.status !== 0) { errors.push('dispatch-ready verification requires a Git repository'); return errors; }
  const commit = record.intent_receipt && record.intent_receipt.commit_sha;
  const blob = record.intent_receipt && record.intent_receipt.record_blob_sha;
  const type = git(root, ['cat-file', '-t', commit || '']);
  if (type.status !== 0 || type.stdout.trim() !== 'commit') { errors.push('intent_receipt.commit_sha must resolve to a commit'); return errors; }
  const actualBlob = git(root, ['rev-parse', `${commit}:${relative.replace(/\\/g, '/')}`]);
  if (actualBlob.status !== 0) errors.push('intent receipt path does not exist in commit');
  else if (actualBlob.stdout.trim() !== blob) errors.push('intent_receipt.record_blob_sha does not match committed path');
  const source = git(root, ['show', `${commit}:${relative.replace(/\\/g, '/')}`]);
  if (source.status === 0) {
    try {
      const fixed = JSON.parse(source.stdout);
      for (const key of ['schema', 'operation_id', 'task_ref', 'method_sha', 'action', 'target', 'snapshot', 'request_key'])
        if (JSON.stringify(fixed[key]) !== JSON.stringify(record[key])) errors.push(`committed intent drift: ${key}`);
      if (JSON.stringify(fixed.authority_refs) !== JSON.stringify(record.authority_refs)) errors.push('committed intent drift: authority_refs');
    } catch { errors.push('committed intent is not valid JSON'); }
  }
  const reachable = record.intent_receipt && record.intent_receipt.reachable_ref;
  if (reachable) {
    const ref = git(root, ['rev-parse', '--verify', `${reachable}^{commit}`]);
    if (ref.status !== 0) errors.push('intent_receipt.reachable_ref does not resolve');
    else if (git(root, ['merge-base', '--is-ancestor', commit, ref.stdout.trim()]).status !== 0)
      errors.push('intent commit is not reachable from reachable_ref');
  }
  return errors;
}

function readRecord(root, relative, staged) {
  if (!staged) return fs.readFileSync(path.join(root, relative), 'utf8');
  const result = git(root, ['show', `:${relative.replace(/\\/g, '/')}`]);
  if (result.status !== 0) throw new Error(`cannot read staged ${relative}: ${result.stderr.trim()}`);
  return result.stdout;
}

function listRecords(root, staged) {
  if (staged) {
    const result = git(root, ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
    if (result.status !== 0) throw new Error(result.stderr.trim());
    return result.stdout.split(/\r?\n/).filter(name => /^_meta\/external-effects\/[^/]+\.json$/.test(name));
  }
  const directory = path.join(root, '_meta', 'external-effects');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(name => name.endsWith('.json'))
    .map(name => `_meta/external-effects/${name}`).sort();
}

function parseArgs(argv) {
  const options = { root: process.cwd(), staged: false, dispatchReady: false, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') options.root = path.resolve(argv[++i]);
    else if (arg === '--staged') options.staged = true;
    else if (arg === '--dispatch-ready') options.dispatchReady = true;
    else options.files.push(arg.replace(/\\/g, '/'));
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  const files = options.files.length ? options.files : listRecords(options.root, options.staged);
  const findings = [];
  for (const relative of files) {
    try {
      const record = JSON.parse(readRecord(options.root, relative, options.staged));
      const errors = validateRecord(record, { recordPath: relative, dispatchReady: options.dispatchReady });
      if (options.dispatchReady) verifyGitReceipt(options.root, relative, record, errors);
      errors.forEach(error => findings.push(`${relative}: ${error}`));
    } catch (error) { findings.push(`${relative}: ${error.message}`); }
  }
  if (findings.length) {
    console.error('❌ External Effect receipt failed:');
    findings.forEach(finding => console.error(`- ${finding}`));
    return 1;
  }
  console.log(`✅ External Effect receipt passed (${files.length} file${files.length === 1 ? '' : 's'}; effect reality and Authority not certified)`);
  return 0;
}

if (require.main === module) process.exitCode = main();
module.exports = { SCHEMA, validateRecord, verifyGitReceipt, main };
