#!/usr/bin/env node
'use strict';

/*
 * Mechanical validator for Runtime Crossing Record v2.
 *
 * Usage:
 *   node scripts/check-runtime-crossing.js [record.yml ...] [--root <project-root>]
 *     [--dispatch-ready] [--cross-runtime] [--lifecycle-head]
 *
 * With no record arguments, scans _meta/runtime-crossings/*.yml. A project with
 * no crossing directory/records is a valid legacy no-record flow.
 *
 * This checker validates structure only. It never certifies Authority,
 * semantic Contract validity, Product/UX/risk correctness, Gate approval,
 * Task completion, review PASS, user-language authorization, or whether an
 * external effect actually occurred.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA = 'hact-runtime-crossing/v2';
const KINDS = new Set([
  'stay-local', 'reality-probe', 'capability-slice', 'execution-task',
  'child-task', 'external-execution', 'review-dispatch'
]);
const OWNERSHIP_MODES = new Set(['delegated', 'transferred']);
const RETURN_MODES = new Set([
  'resume-active-origin', 'cascade-new-task', 'create-new-work-for-merged-origin', 'no-return'
]);
const CEILING_KEYS = ['repository_write', 'commit', 'push', 'deploy', 'external_write'];
const CONTRACT_KEYS = new Set(['authoritative_ref', 'immutable_identity']);
const FORBIDDEN_CONTRACT_KEYS = new Set([
  'purpose', 'scope', 'preconditions', 'outputs', 'verification', 'requirements',
  'acceptance_criteria', 'acceptance-criteria', 'decision_rules', 'completion_conditions',
  'prd', 'trd', 'foundation'
]);
const FORBIDDEN_CERTIFICATION_KEYS = new Set([
  'authority_sufficient', 'semantic_contract_valid', 'product_correct', 'ux_correct',
  'risk_correct', 'gate_approved', 'task_complete', 'review_pass',
  'user_language_authorized', 'external_effect_occurred'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function has(object, key) {
  return isObject(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function cleanScalar(raw) {
  const value = String(raw ?? '').replace(/\s+#.*$/, '').trim();
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value === '[]') return [];
  if (value === '{}') return {};
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(',').map(item => cleanScalar(item)) : [];
  }
  return value;
}

function yamlLines(source) {
  return source.split(/\r?\n/).map((raw, index) => ({
    line: index + 1,
    indent: (raw.match(/^\s*/) || [''])[0].replace(/\t/g, '  ').length,
    text: raw.trim()
  })).filter(item => item.text && !item.text.startsWith('#'));
}

function splitKey(text) {
  const match = text.match(/^([A-Za-z_][\w-]*):(?:\s*(.*))?$/);
  return match ? { key: match[1], rest: match[2] || '' } : null;
}

function parseYamlText(source) {
  const lines = yamlLines(source);
  if (!lines.length) return {};

  function parseNode(index, indent) {
    if (index >= lines.length || lines[index].indent !== indent)
      throw new Error(`YAML indent error at line ${lines[index]?.line || '?'}`);
    return lines[index].text.startsWith('- ') ? parseArray(index, indent) : parseObject(index, indent);
  }

  function parseObject(index, indent, seed = {}) {
    const out = seed;
    let i = index;
    while (i < lines.length) {
      const row = lines[i];
      if (row.indent < indent) break;
      if (row.indent > indent) throw new Error(`Unexpected YAML indent at line ${row.line}`);
      if (row.text.startsWith('- ')) break;
      const pair = splitKey(row.text);
      if (!pair) throw new Error(`Unsupported YAML at line ${row.line}`);
      if (has(out, pair.key)) throw new Error(`Duplicate YAML key ${pair.key} at line ${row.line}`);
      if (pair.rest !== '') {
        out[pair.key] = cleanScalar(pair.rest);
        i++;
      } else if (i + 1 < lines.length && lines[i + 1].indent > indent) {
        const parsed = parseNode(i + 1, lines[i + 1].indent);
        out[pair.key] = parsed.value;
        i = parsed.index;
      } else {
        out[pair.key] = null;
        i++;
      }
    }
    return { value: out, index: i };
  }

  function parseArray(index, indent) {
    const out = [];
    let i = index;
    while (i < lines.length) {
      const row = lines[i];
      if (row.indent < indent) break;
      if (row.indent !== indent || !row.text.startsWith('- ')) break;
      const body = row.text.slice(2).trim();
      const pair = splitKey(body);
      if (!pair) {
        out.push(cleanScalar(body));
        i++;
        continue;
      }
      const item = {};
      item[pair.key] = pair.rest === '' ? null : cleanScalar(pair.rest);
      i++;
      if (i < lines.length && lines[i].indent > indent) {
        const parsed = parseObject(i, lines[i].indent, item);
        i = parsed.index;
      }
      out.push(item);
    }
    return { value: out, index: i };
  }

  const parsed = parseNode(0, lines[0].indent);
  if (parsed.index !== lines.length) throw new Error(`Unparsed YAML at line ${lines[parsed.index].line}`);
  return parsed.value;
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isGitObject(value) {
  return typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
}

function isImmutableIdentity(value) {
  return isGitObject(value) || (typeof value === 'string' && (
    /^git:(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value)
    || /^sha256:[0-9a-f]{64}$/i.test(value)
  ));
}

function isSafeRelative(value) {
  if (!nonEmpty(value) || value.includes('\0') || path.win32.isAbsolute(value) || path.posix.isAbsolute(value)) return false;
  const normalized = value.replace(/\\/g, '/');
  return normalized !== '..' && !normalized.startsWith('../') && !normalized.includes('/../');
}

function isReference(value) {
  if (!nonEmpty(value)) return false;
  if (path.win32.isAbsolute(value) || path.posix.isAbsolute(value)) return false;
  return /^[a-z][a-z0-9+.-]*:[^\s]+$/i.test(value) || isSafeRelative(value.split('#')[0]);
}

function isIso(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value));
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function validateReceipt(receipt, label, errors, options = {}) {
  const fields = options.lifecycle
    ? ['commit_sha', 'record_blob_sha', 'last_event_id', 'verified_at']
    : ['record_path', 'commit_sha', 'record_blob_sha', 'reachable_ref', 'verified_at'];
  if (!isObject(receipt)) {
    errors.push(`${label} must be an object`);
    return;
  }
  for (const field of fields) if (!has(receipt, field)) errors.push(`${label}.${field} is required`);
  const anyValue = fields.some(field => receipt[field] !== null && receipt[field] !== undefined && receipt[field] !== '');
  if (!options.required && !anyValue) return;
  if (!isGitObject(receipt.commit_sha)) errors.push(`${label}.commit_sha must be a 40/64 hex Git object id`);
  if (!isGitObject(receipt.record_blob_sha)) errors.push(`${label}.record_blob_sha must be a 40/64 hex Git object id`);
  if (!isIso(receipt.verified_at)) errors.push(`${label}.verified_at must be ISO-8601`);
  if (options.lifecycle) {
    if (!nonEmpty(receipt.last_event_id)) errors.push(`${label}.last_event_id is required`);
  } else {
    if (receipt.record_path !== options.expectedPath) errors.push(`${label}.record_path must equal ${options.expectedPath}`);
    if (receipt.reachable_ref !== null && receipt.reachable_ref !== undefined && !isReference(receipt.reachable_ref))
      errors.push(`${label}.reachable_ref has invalid reference shape`);
    if (options.crossRuntime && !nonEmpty(receipt.reachable_ref))
      errors.push(`${label}.reachable_ref is required for cross-Runtime recovery`);
  }
}

function validateEvents(events, ceiling, errors) {
  if (!Array.isArray(events)) {
    errors.push('lifecycle.events must be an array');
    return;
  }
  const ids = new Map();
  let priorSequence = 0;
  let priorRevision = null;
  for (let index = 0; index < events.length; index++) {
    const event = events[index];
    const prefix = `lifecycle.events[${index}]`;
    if (!isObject(event)) { errors.push(`${prefix} must be an object`); continue; }
    if (!nonEmpty(event.event_id) || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(event.event_id))
      errors.push(`${prefix}.event_id has invalid stable id shape`);
    const serialized = stableStringify(event);
    if (ids.has(event.event_id)) {
      errors.push(ids.get(event.event_id) === serialized
        ? `${prefix}.event_id duplicates an earlier event`
        : `${prefix}.event_id conflicts with different prior content`);
    } else if (nonEmpty(event.event_id)) ids.set(event.event_id, serialized);
    if (!Number.isInteger(event.sequence) || event.sequence <= priorSequence)
      errors.push(`${prefix}.sequence must be a strictly increasing positive integer`);
    else priorSequence = event.sequence;
    if (event.revision !== null && event.revision !== undefined) {
      if (!Number.isInteger(event.revision) || (priorRevision !== null && event.revision <= priorRevision))
        errors.push(`${prefix}.revision must be strictly increasing when present`);
      else priorRevision = event.revision;
    }
    if (!nonEmpty(event.type)) errors.push(`${prefix}.type is required`);
    if (!isIso(event.timestamp)) errors.push(`${prefix}.timestamp must be ISO-8601`);
    if (has(event, 'permissions_exercised')) {
      if (!isObject(event.permissions_exercised)) errors.push(`${prefix}.permissions_exercised must be an object`);
      else for (const [permission, exercised] of Object.entries(event.permissions_exercised)) {
        if (typeof exercised !== 'boolean') errors.push(`${prefix}.permissions_exercised.${permission} must be boolean`);
        else if (exercised && ceiling[permission] !== true)
          errors.push(`${prefix}.permissions_exercised.${permission} exceeds permission_ceiling mechanically`);
      }
    }
  }
}

function validateArtifacts(artifacts, errors) {
  if (!Array.isArray(artifacts)) { errors.push('artifacts must be an array'); return; }
  artifacts.forEach((artifact, index) => {
    const prefix = `artifacts[${index}]`;
    if (!isObject(artifact)) { errors.push(`${prefix} must be an object`); return; }
    if (!isReference(artifact.path || artifact.ref)) errors.push(`${prefix} requires a safe path/ref`);
    if (!Number.isInteger(artifact.bytes) || artifact.bytes < 0) errors.push(`${prefix}.bytes must be a non-negative integer`);
    if (typeof artifact.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(artifact.sha256))
      errors.push(`${prefix}.sha256 must be 64 hex characters`);
  });
}

function validateRecord(record, options = {}) {
  const errors = [];
  if (!isObject(record)) return ['record must be a YAML object'];

  for (const key of [
    'schema', 'crossing_id', 'kind', 'task', 'status', 'ownership', 'repository',
    'contract', 'authority', 'candidate', 'return', 'runtime', 'persistence',
    'lifecycle', 'artifacts', 'evidence', 'recovery'
  ]) if (!has(record, key)) errors.push(`${key} is required`);

  if (record.schema !== SCHEMA) {
    const match = typeof record.schema === 'string' && record.schema.match(/^hact-runtime-crossing\/v(\d+)$/);
    errors.push(match && Number(match[1]) !== 2
      ? `incompatible Runtime Crossing major version: v${match[1]}`
      : `schema must be ${SCHEMA}`);
  }
  if (!nonEmpty(record.crossing_id) || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(record.crossing_id))
    errors.push('crossing_id has invalid stable id shape');
  if (!KINDS.has(record.kind)) errors.push(`kind must be one of: ${[...KINDS].join(', ')}`);

  for (const key of FORBIDDEN_CERTIFICATION_KEYS)
    if (has(record, key)) errors.push(`${key} is forbidden: mechanical checker cannot certify semantic outcomes`);
  for (const key of FORBIDDEN_CONTRACT_KEYS)
    if (has(record, key)) errors.push(`${key} is forbidden copied semantic Contract data`);

  if (!isObject(record.task)) errors.push('task is required');
  else {
    if (!nonEmpty(record.task.id)) errors.push('task.id is required');
    if (!nonEmpty(record.task.source)) errors.push('task.source is required');
    if (!isGitObject(record.task.method_sha)) errors.push('task.method_sha must be a 40/64 hex Git object id');
  }

  if (!isObject(record.status)) errors.push('status is required');
  else {
    for (const key of ['authoritative_ref', 'snapshot_identity', 'observed_state', 'observed_at', 'authoritative'])
      if (!has(record.status, key)) errors.push(`status.${key} is required`);
    if (!isReference(record.status.authoritative_ref)) errors.push('status.authoritative_ref is required and must be a reference');
    if (!isImmutableIdentity(record.status.snapshot_identity)) errors.push('status.snapshot_identity must be immutable');
    if (record.status.authoritative !== false) errors.push('status.authoritative must be false');
    if (record.status.observed_at !== null && record.status.observed_at !== undefined && !isIso(record.status.observed_at))
      errors.push('status.observed_at must be ISO-8601 when present');
  }

  if (!isObject(record.ownership)) errors.push('ownership is required');
  else {
    for (const key of ['mode', 'owner_ref', 'effective_from'])
      if (!has(record.ownership, key)) errors.push(`ownership.${key} is required`);
    if (!OWNERSHIP_MODES.has(record.ownership.mode)) errors.push('ownership.mode must be delegated or transferred');
    if (!isReference(record.ownership.owner_ref)) errors.push('ownership.owner_ref is required and must be a reference');
    if (!nonEmpty(record.ownership.effective_from)) errors.push('ownership.effective_from is required');
  }

  if (!isObject(record.repository)) errors.push('repository is required');
  else {
    for (const key of ['identity', 'workspace'])
      if (!has(record.repository, key)) errors.push(`repository.${key} is required`);
    if (!nonEmpty(record.repository.identity)) errors.push('repository.identity is required');
    if (!nonEmpty(record.repository.workspace)) errors.push('repository.workspace is required');
  }

  if (!isObject(record.contract)) errors.push('contract is required');
  else {
    for (const key of ['authoritative_ref', 'immutable_identity'])
      if (!has(record.contract, key)) errors.push(`contract.${key} is required`);
    if (!isReference(record.contract.authoritative_ref)) errors.push('contract.authoritative_ref is required and must be a reference');
    if (!isImmutableIdentity(record.contract.immutable_identity)) errors.push('contract.immutable_identity must be immutable');
    for (const key of Object.keys(record.contract))
      if (!CONTRACT_KEYS.has(key)) errors.push(`contract.${key} is forbidden copied semantic Contract data`);
  }

  if (!isObject(record.candidate)) errors.push('candidate is required');
  else {
    for (const key of ['ref', 'identity']) if (!has(record.candidate, key)) errors.push(`candidate.${key} is required`);
    if (record.candidate.ref !== null && record.candidate.ref !== undefined && !isReference(record.candidate.ref))
      errors.push('candidate.ref has invalid reference shape');
    if (record.candidate.identity !== null && record.candidate.identity !== undefined
      && !isImmutableIdentity(record.candidate.identity)) errors.push('candidate.identity must be immutable when present');
  }

  let ceiling = {};
  if (!isObject(record.authority)) errors.push('authority is required');
  else {
    ceiling = record.authority.permission_ceiling;
    if (!isObject(ceiling)) errors.push('authority.permission_ceiling is required');
    else {
      for (const key of CEILING_KEYS) {
        if (!has(ceiling, key)) errors.push(`authority.permission_ceiling.${key} is required`);
        else if (typeof ceiling[key] !== 'boolean') errors.push(`authority.permission_ceiling.${key} must be boolean`);
      }
      for (const [key, value] of Object.entries(ceiling))
        if (typeof value !== 'boolean') errors.push(`authority.permission_ceiling.${key} must be boolean`);
    }
    if (!Array.isArray(record.authority.authority_refs)) errors.push('authority.authority_refs must be an array');
    else {
      if (record.kind !== 'stay-local' && !record.authority.authority_refs.length)
        errors.push('authority.authority_refs must be present for a Runtime crossing');
      record.authority.authority_refs.forEach((ref, index) => {
        if (!isReference(ref)) errors.push(`authority.authority_refs[${index}] has invalid reference shape`);
      });
    }
  }

  if (!isObject(record.runtime)) errors.push('runtime is required');
  else {
    for (const key of ['adapter', 'request_key', 'job_id', 'revision', 'status', 'indeterminate'])
      if (!has(record.runtime, key)) errors.push(`runtime.${key} is required`);
    if (!nonEmpty(record.runtime.adapter)) errors.push('runtime.adapter is required');
    if (record.kind !== 'stay-local' && !nonEmpty(record.runtime.request_key))
      errors.push('runtime.request_key is required for dispatched crossing kinds');
    if (record.runtime.job_id !== null && record.runtime.job_id !== undefined && !nonEmpty(record.runtime.job_id))
      errors.push('runtime.job_id must be a non-empty string when present');
    if (typeof record.runtime.indeterminate !== 'boolean') errors.push('runtime.indeterminate must be boolean');
  }

  if (!isObject(record.return)) errors.push('return is required');
  else for (const key of ['origin_task_ref', 'origin_issue_ref', 'affected_scope', 'return_mode', 'return_condition'])
    if (!has(record.return, key)) errors.push(`return.${key} is required`);
  if (record.kind === 'child-task') {
    if (!isObject(record.return) || !isReference(record.return.origin_task_ref))
      errors.push('child-task requires return.origin_task_ref');
    if (!isObject(record.return) || !RETURN_MODES.has(record.return.return_mode))
      errors.push(`child-task return.return_mode must be one of: ${[...RETURN_MODES].join(', ')}`);
    if (!isObject(record.return) || !Array.isArray(record.return.affected_scope) || !record.return.affected_scope.length
      || record.return.affected_scope.some(scope => !nonEmpty(scope)))
      errors.push('child-task requires non-empty return.affected_scope');
  }

  if (record.kind === 'external-execution') {
    if (!isObject(record.external)) errors.push('external-execution requires external action/target/snapshot data');
    else {
      if (!nonEmpty(record.external.action)) errors.push('external.action is required');
      if (!isReference(record.external.target)) errors.push('external.target is required and must be a reference');
      if (!isImmutableIdentity(record.external.snapshot_identity)) errors.push('external.snapshot_identity must be immutable');
    }
  }

  const expectedPath = `_meta/runtime-crossings/${record.crossing_id}.yml`;
  if (!isObject(record.persistence)) errors.push('persistence is required');
  else {
    validateReceipt(record.persistence.dispatch, 'persistence.dispatch', errors, {
      required: options.requireDispatchReceipt || options.crossRuntime,
      crossRuntime: options.crossRuntime,
      expectedPath
    });
    validateReceipt(record.persistence.lifecycle_head, 'persistence.lifecycle_head', errors, {
      required: options.requireLifecycleHead,
      lifecycle: true
    });
  }

  if (!isObject(record.lifecycle)) errors.push('lifecycle is required');
  else validateEvents(record.lifecycle.events, ceiling, errors);
  validateArtifacts(record.artifacts, errors);
  if (!Array.isArray(record.evidence)) errors.push('evidence must be an array');
  if (!isObject(record.recovery) || !has(record.recovery, 'last_stable_point') || !has(record.recovery, 'next_action'))
    errors.push('recovery.last_stable_point and recovery.next_action are required');

  const events = isObject(record.lifecycle) && Array.isArray(record.lifecycle.events) ? record.lifecycle.events : [];
  const head = isObject(record.persistence) ? record.persistence.lifecycle_head : null;
  const headHasValue = isObject(head) && Object.values(head).some(value => value !== null && value !== undefined && value !== '');
  if (headHasValue) {
    const last = events[events.length - 1];
    if (!last || head.last_event_id !== last.event_id)
      errors.push('persistence.lifecycle_head.last_event_id must match the latest lifecycle event');
  }

  if (options.recordPath) {
    const normalized = options.recordPath.replace(/\\/g, '/');
    if (normalized !== expectedPath) errors.push(`record path must be ${expectedPath}`);
  }
  return errors;
}

function validateSource(source, options = {}) {
  try { return validateRecord(parseYamlText(source), options); }
  catch (error) { return [`YAML parse failed: ${error.message}`]; }
}

function validateFile(file, root = process.cwd(), options = {}) {
  const absolute = path.resolve(root, file);
  const relative = path.relative(root, absolute).replace(/\\/g, '/');
  if (!isSafeRelative(relative)) return ['record path escapes project root'];
  let stat;
  try { stat = fs.lstatSync(absolute); } catch { return [`record does not exist: ${relative}`]; }
  if (!stat.isFile() || stat.isSymbolicLink()) return [`record must be a regular non-symlink file: ${relative}`];
  return validateSource(fs.readFileSync(absolute, 'utf8'), { ...options, recordPath: relative });
}

function validateProject(root = process.cwd(), options = {}) {
  const directory = path.join(root, '_meta', 'runtime-crossings');
  if (!fs.existsSync(directory)) return { files: [], errors: [] };
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const errors = [];
  const files = [];
  for (const entry of entries) {
    const relative = `_meta/runtime-crossings/${entry.name}`;
    if (!entry.isFile() || entry.isSymbolicLink()) {
      errors.push(`${relative}: crossing path family accepts regular files only`);
      continue;
    }
    if (!/\.ya?ml$/i.test(entry.name)) {
      errors.push(`${relative}: crossing record must use .yml/.yaml`);
      continue;
    }
    files.push(relative);
    for (const error of validateFile(relative, root, options)) errors.push(`${relative}: ${error}`);
  }
  return { files, errors };
}

function main() {
  const args = process.argv.slice(2);
  const files = [];
  const options = {};
  let root = process.cwd();
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--root') {
      if (!args[index + 1]) { console.error('--root requires a path'); process.exit(2); }
      root = path.resolve(args[++index]);
    } else if (arg === '--dispatch-ready') options.requireDispatchReceipt = true;
    else if (arg === '--cross-runtime') { options.crossRuntime = true; options.requireDispatchReceipt = true; }
    else if (arg === '--lifecycle-head') options.requireLifecycleHead = true;
    else if (arg.startsWith('--')) { console.error(`unknown option: ${arg}`); process.exit(2); }
    else files.push(arg);
  }

  let errors = [];
  let checked = files.length;
  if (files.length) {
    for (const file of files)
      for (const error of validateFile(file, root, options)) errors.push(`${file}: ${error}`);
  } else {
    const result = validateProject(root, options);
    checked = result.files.length;
    errors = result.errors;
  }

  if (errors.length) {
    console.error('❌ Runtime Crossing mechanical contract failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`✅ Runtime Crossing mechanical structure passed (${checked} record${checked === 1 ? '' : 's'}; semantic outcomes not certified)`);
}

if (require.main === module) main();
module.exports = {
  SCHEMA, KINDS, OWNERSHIP_MODES, RETURN_MODES,
  parseYamlText, validateRecord, validateSource, validateFile, validateProject
};
