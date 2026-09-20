#!/usr/bin/env node
'use strict';

/*
 * Deterministic System Verification contract checker.
 *
 * Usage:
 *   node scripts/check-system-review.js vN [project-root]
 *   node scripts/check-system-review.js vN [project-root] --in-progress [--staged]
 *
 * Complete mode proves both-lane linkage, finding closure, revalidation and final candidate.
 * In-progress mode validates immutable event/finding/closure structure while open obligations remain legal.
 * It does not replace semantic review or execute runtime scenarios.
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { validate: validateIntegrationEvidence } = require('./check-integration-evidence.js');
const { parseTasksSource } = require('./check-gate.js');

const ROUTES = new Set(['local-close', 'system-rereview']);
const REVIEW_TYPES = new Set(['full', 'targeted']);
const FINDING_ORIGINS = new Set(['semantic-review', 'runtime-verification']);
const FINDING_CATEGORIES = new Set([
  'compatibility', 'shared-contract', 'architecture', 'authorization',
  'state-machine', 'data-model', 'runtime', 'evidence'
]);
const ACTIONS = new Set([
  'fix-code', 'fix-mechanism', 'revise-doc', 'downgrade-claim',
  'global-gap-review', 'request-evidence'
]);

function cleanScalar(raw) {
  const value = String(raw || '').trim();
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    return value.slice(1, -1);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    return inner ? inner.split(',').map(item => cleanScalar(item)) : [];
  }
  return value.replace(/\s+#.*$/, '').trim();
}

function yamlLines(source) {
  return source.split(/\r?\n/).map((raw, index) => ({
    raw,
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
    if (index >= lines.length || lines[index].indent !== indent) throw new Error(`YAML indent error at line ${lines[index]?.line || '?'}`);
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
      if (Object.prototype.hasOwnProperty.call(out, pair.key)) throw new Error(`Duplicate YAML key ${pair.key} at line ${row.line}`);
      if (pair.rest !== '') {
        out[pair.key] = cleanScalar(pair.rest);
        i++;
      } else if (i + 1 < lines.length && lines[i + 1].indent > indent) {
        const childIndent = lines[i + 1].indent;
        const parsed = parseNode(i + 1, childIndent);
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
        const childIndent = lines[i].indent;
        const parsed = parseObject(i, childIndent, item);
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

function frontmatterSource(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex(line => /^---\s*$/.test(line));
  if (start < 0) throw new Error('missing frontmatter start');
  const end = lines.findIndex((line, index) => index > start && /^---\s*$/.test(line));
  if (end < 0) throw new Error('missing frontmatter end');
  return lines.slice(start + 1, end).join('\n');
}

function parseFrontmatterFile(file) {
  return parseYamlText(frontmatterSource(fs.readFileSync(file, 'utf8')));
}

function slash(value) { return String(value || '').replace(/\\/g, '/').replace(/^\.\//, ''); }
function isSha(value) { return /^[0-9a-f]{40}$/i.test(String(value || '')); }
function isIso(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function sameSet(a, b) { return JSON.stringify([...new Set(asArray(a))].sort()) === JSON.stringify([...new Set(asArray(b))].sort()); }
function includesAll(actual, required) { const set = new Set(asArray(actual)); return asArray(required).every(item => set.has(item)); }

function safePath(root, relative) {
  const rel = slash(relative);
  if (!rel || path.isAbsolute(rel) || rel.split('/').includes('..')) throw new Error(`unsafe path: ${relative}`);
  const absolute = path.resolve(root, ...rel.split('/'));
  const base = path.resolve(root);
  if (absolute !== base && !absolute.startsWith(base + path.sep)) throw new Error(`path escapes project: ${relative}`);
  let current = base;
  for (const part of rel.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`symlink is not allowed: ${relative}`);
  }
  return absolute;
}

function git(root, args, options = {}) {
  return cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', options.quiet ? 'ignore' : 'pipe'] }).trim();
}

function gitObjectType(root, ref) {
  try { return git(root, ['cat-file', '-t', ref], { quiet: true }); } catch { return null; }
}

function isAncestor(root, base, head) {
  try { cp.execFileSync('git', ['merge-base', '--is-ancestor', base, head], { cwd: root, stdio: 'ignore' }); return true; }
  catch { return false; }
}

function relativeFiles(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  if (!fs.statSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink()) throw new Error(`invalid directory: ${dir}`);
  return fs.readdirSync(dir).filter(name => pattern.test(name)).sort();
}

function validateEvidencePointers(root, pointers, context, staged, errors) {
  if (!Array.isArray(pointers) || !pointers.length) { errors.push(`${context}: evidence must be a non-empty list`); return; }
  for (const pointer of pointers) {
    const value = String(pointer || '').trim();
    const gitRef = value.match(/^git:([0-9a-f]{40})$/i);
    if (gitRef) {
      if (!gitObjectType(root, gitRef[1])) errors.push(`${context}: evidence Git object does not exist: ${value}`);
      continue;
    }
    try {
      const absolute = safePath(root, value);
      if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) errors.push(`${context}: evidence file does not exist: ${value}`);
      else if (staged) {
        try { git(root, ['ls-files', '--error-unmatch', '--', value], { quiet: true }); }
        catch { errors.push(`${context}: staged validation requires evidence in Git index: ${value}`); }
      }
    } catch (error) { errors.push(`${context}: invalid evidence pointer ${value}: ${error.message}`); }
  }
}

function validateFinding(finding, context, errors) {
  const prefix = `${context}:${finding?.id || '<missing-id>'}`;
  if (!finding || typeof finding !== 'object') { errors.push(`${context}: finding must be an object`); return; }
  if (!/^SV-F\d{3}$/.test(finding.id || '')) errors.push(`${prefix}: invalid finding id`);
  if (!FINDING_ORIGINS.has(finding.origin)) errors.push(`${prefix}: invalid origin`);
  if (finding.severity !== 'blocking') errors.push(`${prefix}: system closure finding must be blocking`);
  if (!FINDING_CATEGORIES.has(finding.category)) errors.push(`${prefix}: invalid category`);
  if (!String(finding.summary || '').trim()) errors.push(`${prefix}: missing summary`);
  if (!asArray(finding.evidence).length) errors.push(`${prefix}: evidence must be non-empty`);
  if (!ACTIONS.has(finding.required_action?.type) || !String(finding.required_action?.description || '').trim())
    errors.push(`${prefix}: invalid required_action`);
  if (!ROUTES.has(finding.closure?.route)) errors.push(`${prefix}: exactly one valid closure route is required`);
  const semantic = finding.revalidation?.semantic;
  const runtime = finding.revalidation?.runtime;
  if (!semantic || typeof semantic.required !== 'boolean') errors.push(`${prefix}: semantic.required must be boolean`);
  else if (semantic.required && !asArray(semantic.scope).length) errors.push(`${prefix}: semantic scope required`);
  if (!runtime || typeof runtime.required !== 'boolean') errors.push(`${prefix}: runtime.required must be boolean`);
  else if (runtime.required) {
    if (!asArray(runtime.scope).length) errors.push(`${prefix}: runtime scope required`);
    if (runtime.not_required_reason !== null && runtime.not_required_reason !== undefined) errors.push(`${prefix}: required runtime cannot have not_required_reason`);
  } else {
    if (!String(runtime.not_required_reason || '').trim()) errors.push(`${prefix}: runtime not-required reason missing`);
    if (asArray(runtime.scope).length) errors.push(`${prefix}: runtime scope must be empty when not required`);
  }
  if (typeof finding.full_snapshot_invalidated !== 'boolean') errors.push(`${prefix}: full_snapshot_invalidated must be boolean`);
  if (finding.full_snapshot_invalidated) {
    if (finding.closure?.route !== 'system-rereview') errors.push(`${prefix}: invalidated snapshot requires system-rereview`);
    if (!String(finding.invalidation_reason || '').trim()) errors.push(`${prefix}: invalidation reason missing`);
  } else if (finding.invalidation_reason !== null && finding.invalidation_reason !== undefined) {
    errors.push(`${prefix}: invalidation_reason must be null when snapshot is not invalidated`);
  }
  if (finding.state !== 'open') errors.push(`${prefix}: source finding state must be open`);
}

function validate(iteration, root = process.cwd(), options = {}) {
  const errors = [];
  const inProgress = Boolean(options.inProgress);
  const staged = Boolean(options.staged);
  if (!/^v\d+(?:\.\d+)*$/.test(iteration || '')) return ['iteration must be vN or vN.M'];
  root = path.resolve(root);

  if (staged) {
    try {
      const dirty = git(root, ['diff', '--name-only', '--', 'status.yml', `iterations/${iteration}/system-review`, 'integration-tests']);
      if (dirty) errors.push(`related artifacts have unstaged changes: ${dirty.replace(/\r?\n/g, ', ')}`);
      const stagedDiff = git(root, ['diff', '--cached', '--name-status', '--', `iterations/${iteration}/system-review`]);
      for (const line of stagedDiff.split(/\r?\n/).filter(Boolean)) {
        const status = line.split(/\s+/)[0];
        if (status !== 'A') errors.push(`published system-review artifacts are immutable; staged status ${status} is forbidden: ${line}`);
      }
    } catch (error) { errors.push(`staged check failed: ${error.message}`); }
  }

  let statusSource = '';
  try { statusSource = fs.readFileSync(path.join(root, 'status.yml'), 'utf8'); }
  catch (error) { return [...errors, `status.yml: ${error.message}`]; }
  const architectureMatches = [...statusSource.matchAll(/^review_architecture:\s*([^#\r\n]+)/gm)];
  const reviewArchitecture = architectureMatches[0]?.[1]?.trim();
  if (architectureMatches.length !== 1) errors.push('status.yml must contain exactly one review_architecture field');
  if (reviewArchitecture !== 'system-verification/v1') errors.push('status.yml missing review_architecture=system-verification/v1');
  const statusTasks = parseTasksSource(statusSource);
  if (statusTasks === null) errors.push('status.yml tasks[] cannot be parsed');
  const systemTasks = asArray(statusTasks).filter(task => task?.type === 'integration-verify' && task.iteration === iteration);
  if (systemTasks.length !== 1) errors.push(`status.yml must contain exactly one integration-verify task for ${iteration}`);
  const systemTask = systemTasks[0] || {};
  const expectedDir = `iterations/${iteration}/system-review`;
  if (slash(systemTask.system_review_dir) !== expectedDir) errors.push(`integration-verify system_review_dir must be ${expectedDir}`);
  if (!['可取', 'taken-by', 'done', 'merged'].includes(systemTask.status)) errors.push('integration-verify task status invalid');
  if (systemTask.source !== 'null') errors.push('integration-verify task source must be null');

  let methodSha = null;
  try { methodSha = JSON.parse(fs.readFileSync(path.join(root, '_meta', 'method-sync.json'), 'utf8')).source; }
  catch { errors.push('_meta/method-sync.json with source SHA is required'); }

  let reviewDir;
  try { reviewDir = safePath(root, expectedDir); } catch (error) { return [...errors, error.message]; }
  const reviewsById = new Map();
  const reviewsByPath = new Map();
  const sourceFindings = new Map();
  const candidateHeads = [];
  const pendingRevalidations = [];
  let reviewNames = [];
  try {
    reviewNames = relativeFiles(reviewDir, /^review-\d{3}\.md$/);
    if (fs.existsSync(reviewDir)) for (const entry of fs.readdirSync(reviewDir, { withFileTypes: true })) {
      if (/^review-\d{3}\.md$/.test(entry.name)) {
        if (!entry.isFile() || entry.isSymbolicLink()) errors.push(`${expectedDir}/${entry.name}: review event must be a real file`);
      } else if (!['findings', 'closures'].includes(entry.name)) errors.push(`${expectedDir}/${entry.name}: unsupported system-review artifact`);
    }
  }
  catch (error) { errors.push(error.message); }
  if (!reviewNames.length) errors.push(`${expectedDir}: at least one system review event is required`);

  reviewNames.forEach((name, index) => {
    const rel = `${expectedDir}/${name}`;
    let doc;
    try { doc = parseFrontmatterFile(safePath(root, rel)); }
    catch (error) { errors.push(`${rel}: ${error.message}`); return; }
    const number = Number(name.match(/\d{3}/)?.[0]);
    if (number !== index + 1) errors.push(`${rel}: review sequence must be contiguous`);
    const expectedId = name.replace(/\.md$/, '');
    if (doc.schema !== 'system-review/v1') errors.push(`${rel}: schema must be system-review/v1`);
    if (doc.iteration !== iteration) errors.push(`${rel}: iteration mismatch`);
    if (doc.review_id !== expectedId) errors.push(`${rel}: review_id must match filename`);
    if (!REVIEW_TYPES.has(doc.review_type)) errors.push(`${rel}: invalid review_type`);
    if (!isIso(doc.created_at)) errors.push(`${rel}: created_at must be ISO-8601`);
    if (doc.reviewer_isolation !== 'fresh-isolated') errors.push(`${rel}: reviewer_isolation must be fresh-isolated`);
    if (!isSha(doc.method_sha) || (methodSha && doc.method_sha !== methodSha)) errors.push(`${rel}: method_sha must match adopted method source`);
    if (!isSha(doc.candidate?.base) || gitObjectType(root, doc.candidate?.base) !== 'commit') errors.push(`${rel}: candidate.base is not a project commit`);
    if (!isSha(doc.candidate?.head) || gitObjectType(root, doc.candidate?.head) !== 'commit') errors.push(`${rel}: candidate.head is not a project commit`);
    else candidateHeads.push(doc.candidate.head);
    if (isSha(doc.candidate?.base) && isSha(doc.candidate?.head) && !isAncestor(root, doc.candidate.base, doc.candidate.head))
      errors.push(`${rel}: candidate.base must be ancestor of candidate.head`);
    if (!Array.isArray(doc.scope) || !doc.scope.length) errors.push(`${rel}: scope must be a non-empty list`);
    else if (new Set(doc.scope).size !== doc.scope.length) errors.push(`${rel}: scope entries must be unique`);
    validateEvidencePointers(root, doc.evidence, rel, staged, errors);
    if (!['pass', 'blocked'].includes(doc.result?.status)) errors.push(`${rel}: result.status invalid`);
    if (!['sufficient', 'insufficient'].includes(doc.evidence_state?.status)) errors.push(`${rel}: evidence_state.status invalid`);
    if (doc.result?.status === 'pass' && doc.evidence_state?.status !== 'sufficient') errors.push(`${rel}: insufficient evidence cannot pass`);
    if (!Array.isArray(doc.findings)) errors.push(`${rel}: findings must be a list`);
    if (!Array.isArray(doc.advisories)) errors.push(`${rel}: advisories must be a list`);
    const findings = asArray(doc.findings);
    if (new Set(asArray(doc.revalidation_of)).size !== asArray(doc.revalidation_of).length)
      errors.push(`${rel}: revalidation_of entries must be unique`);
    if (doc.result?.status === 'pass' && findings.length) errors.push(`${rel}: pass event cannot create blocking findings`);
    if (doc.result?.status === 'blocked' && !findings.length) errors.push(`${rel}: blocked event must contain a blocking finding`);
    if (index === 0) {
      if (doc.review_type !== 'full' || doc.predecessor !== null || asArray(doc.revalidation_of).length)
        errors.push(`${rel}: first event must be full with null predecessor and empty revalidation_of`);
    } else if (doc.review_type === 'targeted') {
      if (!reviewsById.has(doc.predecessor)) errors.push(`${rel}: targeted predecessor must name an earlier review`);
      if (!asArray(doc.revalidation_of).length) errors.push(`${rel}: targeted revalidation_of must be non-empty`);
    } else {
      if (!reviewsById.has(doc.predecessor)) errors.push(`${rel}: later full review predecessor must name an earlier review`);
      if (!asArray(doc.revalidation_of).length) errors.push(`${rel}: later full review revalidation_of must be non-empty`);
    }
    if (reviewsById.has(doc.review_id)) errors.push(`${rel}: duplicate review_id`);
    reviewsById.set(doc.review_id, { rel, doc });
    reviewsByPath.set(rel, { rel, doc });
    pendingRevalidations.push({ rel, ids: asArray(doc.revalidation_of) });
    for (const finding of findings) {
      validateFinding(finding, rel, errors);
      validateEvidencePointers(root, finding?.evidence, `${rel}:${finding?.id || '<missing-id>'}`, staged, errors);
      if (finding?.id && sourceFindings.has(finding.id)) errors.push(`${rel}: duplicate system finding ${finding.id}`);
      else if (finding?.id) sourceFindings.set(finding.id, { rel, finding });
    }
  });

  const findingDirRel = `${expectedDir}/findings`;
  let findingNames = [];
  try { findingNames = relativeFiles(safePath(root, findingDirRel), /^SV-F\d{3}\.md$/); } catch (error) { errors.push(error.message); }
  for (const name of findingNames) {
    const rel = `${findingDirRel}/${name}`;
    let doc;
    try { doc = parseFrontmatterFile(safePath(root, rel)); }
    catch (error) { errors.push(`${rel}: ${error.message}`); continue; }
    const id = name.replace(/\.md$/, '');
    if (doc.schema !== 'system-finding/v1' || doc.iteration !== iteration || doc.finding_id !== id)
      errors.push(`${rel}: standalone finding identity/schema mismatch`);
    if (!isIso(doc.created_at)) errors.push(`${rel}: created_at must be ISO-8601`);
    if (!reviewsById.has(doc.source_review)) errors.push(`${rel}: source_review must name an existing review`);
    if (!isSha(doc.candidate?.head) || gitObjectType(root, doc.candidate?.head) !== 'commit') errors.push(`${rel}: candidate.head invalid`);
    else candidateHeads.push(doc.candidate.head);
    const normalized = { ...doc, id: doc.finding_id };
    validateFinding(normalized, rel, errors);
    validateEvidencePointers(root, doc.evidence, rel, staged, errors);
    if (doc.origin !== 'runtime-verification') errors.push(`${rel}: standalone finding origin must be runtime-verification`);
    if (sourceFindings.has(id)) errors.push(`${rel}: duplicate system finding ${id}`);
    else sourceFindings.set(id, { rel, finding: normalized });
  }
  for (const pending of pendingRevalidations) for (const findingId of pending.ids)
    if (!sourceFindings.has(findingId)) errors.push(`${pending.rel}: unknown revalidation finding ${findingId}`);

  const states = new Map([...sourceFindings.keys()].map(id => [id, 'open']));
  const lastClosure = new Map();
  const closingEvents = new Map();
  const closureRootRel = `${expectedDir}/closures`;
  try {
    const closureRoot = safePath(root, closureRootRel);
    if (fs.existsSync(closureRoot)) for (const entry of fs.readdirSync(closureRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) errors.push(`${closureRootRel}/${entry.name}: closure entry must be a real directory`);
      else if (!sourceFindings.has(entry.name)) errors.push(`${closureRootRel}/${entry.name}: closure directory has no source finding`);
    }
  } catch (error) { errors.push(error.message); }
  for (const [findingId, source] of sourceFindings) {
    const dirRel = `${closureRootRel}/${findingId}`;
    let names = [];
    try { names = relativeFiles(safePath(root, dirRel), /^closure-\d{3}\.md$/); } catch (error) { errors.push(error.message); }
    names.forEach((name, index) => {
      const rel = `${dirRel}/${name}`;
      let doc;
      try { doc = parseFrontmatterFile(safePath(root, rel)); }
      catch (error) { errors.push(`${rel}: ${error.message}`); return; }
      const expectedId = name.replace(/\.md$/, '');
      if (Number(name.match(/\d{3}/)?.[0]) !== index + 1) errors.push(`${rel}: closure sequence must be contiguous`);
      if (doc.schema !== 'system-finding-closure/v1' || doc.iteration !== iteration || doc.closure_id !== expectedId || doc.finding_id !== findingId)
        errors.push(`${rel}: closure identity/schema mismatch`);
      if (!isIso(doc.created_at)) errors.push(`${rel}: created_at must be ISO-8601`);
      validateEvidencePointers(root, doc.evidence, rel, staged, errors);
      if (slash(doc.source_artifact) !== source.rel) errors.push(`${rel}: source_artifact mismatch`);
      const expectedPrior = index === 0 ? null : `${dirRel}/${names[index - 1]}`;
      const actualPrior = doc.prior_closure === null ? null : slash(doc.prior_closure);
      if (actualPrior !== expectedPrior) errors.push(`${rel}: prior_closure mismatch`);
      if (!isSha(doc.repair_candidate?.base) || gitObjectType(root, doc.repair_candidate?.base) !== 'commit'
          || !isSha(doc.repair_candidate?.head) || gitObjectType(root, doc.repair_candidate?.head) !== 'commit')
        errors.push(`${rel}: repair candidate refs must be commits`);
      else {
        candidateHeads.push(doc.repair_candidate.head);
        if (!isAncestor(root, doc.repair_candidate.base, doc.repair_candidate.head)) errors.push(`${rel}: repair base must be ancestor of head`);
      }
      if (!ROUTES.has(doc.route?.expected) || !ROUTES.has(doc.route?.effective)) errors.push(`${rel}: invalid route`);
      const priorEffective = index === 0 ? source.finding.closure?.route : lastClosure.get(findingId)?.route?.effective;
      const priorDoc = index === 0 ? null : lastClosure.get(findingId);
      if (doc.route?.expected !== priorEffective) errors.push(`${rel}: route.expected must match prior effective route`);
      if (priorEffective === 'system-rereview' && doc.route?.effective === 'local-close') errors.push(`${rel}: system-rereview cannot downgrade to local-close`);
      if (typeof doc.full_snapshot_invalidated !== 'boolean') errors.push(`${rel}: full_snapshot_invalidated must be boolean`);
      if (doc.full_snapshot_invalidated && !String(doc.invalidation_reason || '').trim()) errors.push(`${rel}: invalidation reason missing`);
      if (!doc.full_snapshot_invalidated && doc.invalidation_reason !== null) errors.push(`${rel}: invalidation_reason must be null`);
      if (index === 0 && source.finding.closure?.route === 'system-rereview'
          && doc.full_snapshot_invalidated !== source.finding.full_snapshot_invalidated)
        errors.push(`${rel}: invalidation decision must match source system-rereview finding`);
      if (index > 0 && doc.full_snapshot_invalidated !== lastClosure.get(findingId)?.full_snapshot_invalidated)
        errors.push(`${rel}: invalidation decision changed without a new escalation event`);
      const expectedSemanticScope = priorDoc?.semantic_revalidation?.required_scope
        || source.finding.revalidation?.semantic?.scope || [];
      if (!includesAll(doc.semantic_revalidation?.required_scope, expectedSemanticScope))
        errors.push(`${rel}: semantic required scope dropped source/prior obligations`);
      const sourceRuntime = source.finding.revalidation?.runtime;
      const expectedRuntimeRequired = priorDoc ? priorDoc.runtime_revalidation?.required === true : sourceRuntime?.required === true;
      const expectedRuntimeScope = priorDoc?.runtime_revalidation?.required_scope || sourceRuntime?.scope || [];
      if (expectedRuntimeRequired && doc.runtime_revalidation?.required !== true)
        errors.push(`${rel}: required runtime revalidation cannot be downgraded`);
      if (!includesAll(doc.runtime_revalidation?.required_scope, expectedRuntimeScope))
        errors.push(`${rel}: runtime required scope dropped source/prior obligations`);

      if (doc.result === 'escalated') {
        if (states.get(findingId) !== 'open' || doc.route?.expected !== 'local-close' || doc.route?.effective !== 'system-rereview'
            || doc.escalation?.occurred !== true || !String(doc.escalation?.reason || '').trim())
          errors.push(`${rel}: invalid local-to-system escalation`);
        states.set(findingId, 'escalated');
      } else if (doc.result === 'closed') {
        if (states.get(findingId) === 'closed') errors.push(`${rel}: finding already closed`);
        if (doc.escalation?.occurred !== false) errors.push(`${rel}: closed event cannot also escalate`);
        if (doc.route?.effective === 'local-close') {
          if (doc.local_review?.required !== true || doc.local_review?.reviewer_isolation !== 'fresh-isolated'
              || doc.local_review?.result !== 'pass' || !String(doc.local_review?.report || '').trim())
            errors.push(`${rel}: local-close requires Fresh Isolated Local Review pass`);
          else {
            try {
              const localReport = safePath(root, doc.local_review.report);
              if (!fs.existsSync(localReport) || !fs.statSync(localReport).isFile()) errors.push(`${rel}: local review report does not exist`);
              else {
                if (parseFrontmatterFile(localReport).conclusion !== 'pass') errors.push(`${rel}: local review report conclusion must be pass`);
                if (staged) {
                  try { git(root, ['ls-files', '--error-unmatch', '--', slash(doc.local_review.report)], { quiet: true }); }
                  catch { errors.push(`${rel}: staged validation requires local review report in Git index`); }
                }
              }
            } catch (error) { errors.push(`${rel}: invalid local review report: ${error.message}`); }
          }
          if (!sameSet(doc.semantic_revalidation?.required_scope, doc.semantic_revalidation?.verified_scope)
              || doc.semantic_revalidation?.result !== 'pass') errors.push(`${rel}: semantic revalidation incomplete`);
          if (doc.runtime_revalidation?.required === true) {
            if (!sameSet(doc.runtime_revalidation.required_scope, doc.runtime_revalidation.verified_scope)
                || doc.runtime_revalidation.result !== 'pass') errors.push(`${rel}: runtime revalidation incomplete`);
          } else if (!String(doc.runtime_revalidation?.not_required_reason || '').trim()
              || doc.runtime_revalidation?.result !== 'not-required') errors.push(`${rel}: runtime not-required contract incomplete`);
          if (doc.system_reviewer_event !== null || doc.full_snapshot_invalidated) errors.push(`${rel}: local-close cannot use system reviewer or invalidate full snapshot`);
        } else {
          const event = reviewsByPath.get(slash(doc.system_reviewer_event));
          if (!event || event.doc.result?.status !== 'pass' || event.doc.evidence_state?.status !== 'sufficient'
              || !asArray(event.doc.revalidation_of).includes(findingId)) errors.push(`${rel}: system-rereview closure requires a passing reviewer event covering the finding`);
          else {
            if (event.doc.candidate?.head !== doc.repair_candidate?.head) errors.push(`${rel}: reviewer event candidate must equal repair candidate head`);
            if (doc.full_snapshot_invalidated && event.doc.review_type !== 'full') errors.push(`${rel}: invalidated snapshot requires full reviewer event`);
          }
        }
        states.set(findingId, 'closed');
        closingEvents.set(findingId, { rel, doc });
      } else errors.push(`${rel}: result must be closed or escalated`);
      lastClosure.set(findingId, doc);
    });
  }

  const finalCandidate = systemTask.final_candidate;
  if (finalCandidate !== null && finalCandidate !== undefined && (!isSha(finalCandidate) || gitObjectType(root, finalCandidate) !== 'commit'))
    errors.push('integration-verify final_candidate must be a project commit');
  if (isSha(finalCandidate)) for (const candidate of candidateHeads) if (!isAncestor(root, candidate, finalCandidate))
    errors.push(`final_candidate must descend from reviewed/repair candidate ${candidate}`);

  const currentReviewRel = slash(systemTask.current_system_review);
  const latestReviewRel = reviewNames.length ? `${expectedDir}/${reviewNames.at(-1)}` : '';
  if (currentReviewRel && currentReviewRel !== latestReviewRel) errors.push('current_system_review must point to latest review event');
  if (latestReviewRel && !currentReviewRel) errors.push('integration-verify task missing current_system_review');

  const integrationRel = slash(systemTask.integration_result);
  if (!inProgress || integrationRel) {
    if (!integrationRel) errors.push('integration-verify task missing integration_result');
    else {
      let integrationPath;
      try { integrationPath = safePath(root, integrationRel); } catch (error) { errors.push(error.message); }
      if (integrationPath) {
        const requiredRuntimeFindings = [...closingEvents].filter(([, item]) => item.doc.runtime_revalidation?.required === true).map(([id]) => id);
        const requiredRuntimeScope = [...closingEvents.values()].flatMap(item => asArray(item.doc.runtime_revalidation?.verified_scope));
        errors.push(...validateIntegrationEvidence(integrationRel, root, {
          requireSystemLinkage: true,
          expectedIteration: iteration,
          expectedCandidate: finalCandidate,
          expectedReview: currentReviewRel,
          requiredRevalidationOf: requiredRuntimeFindings,
          requiredRuntimeScope
        }));
      }
    }
  }

  if (!inProgress) {
    if (systemTask.status !== 'merged') errors.push('integration-verify task must be merged for completion');
    if (!isSha(finalCandidate)) errors.push('completion requires final_candidate');
    for (const [id, state] of states) if (state !== 'closed') errors.push(`system finding ${id} remains ${state}`);
    const latestReview = latestReviewRel && reviewsByPath.get(latestReviewRel)?.doc;
    if (!latestReview) errors.push('completion requires current System Review event');
  }
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  const iteration = args.shift();
  const inProgress = args.includes('--in-progress');
  const staged = args.includes('--staged');
  const rootArg = args.find(arg => !arg.startsWith('--'));
  if (!iteration) {
    console.error('Usage: node check-system-review.js <vN> [project-root] [--in-progress] [--staged]');
    process.exit(2);
  }
  try {
    const errors = validate(iteration, path.resolve(rootArg || process.cwd()), { inProgress, staged });
    if (errors.length) {
      console.error('❌ System Review contract failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    console.log(`✅ System Review contract passed (${iteration}${inProgress ? ', in-progress' : ', complete'})`);
  } catch (error) {
    console.error('check-system-review internal error:', error.message);
    process.exit(2);
  }
}

if (require.main === module) main();
module.exports = { validate, parseYamlText, parseFrontmatterFile, validateFinding };
