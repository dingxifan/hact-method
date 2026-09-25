#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const SCHEMA = 'system-review/v2';
const FIELDS = [
  'schema', 'review_id', 'review_type', 'candidate', 'prior_report',
  'target_finding_ids', 'new_finding_ids', 'closed_finding_ids',
  'open_finding_ids', 'conclusion', 'evidence_refs', 'created_at'
];

function parseValue(raw) {
  const text = raw.trim();
  if (text === 'null') return null;
  if (text === '[]') return [];
  if (text.startsWith('[') && text.endsWith(']'))
    return text.slice(1, -1).split(',').map(x => x.trim()).filter(Boolean);
  return text.replace(/^['"]|['"]$/g, '');
}

function parseReport(text, relative) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${relative}: YAML frontmatter required`);
  const doc = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) throw new Error(`${relative}: unsupported frontmatter line: ${line}`);
    doc[field[1]] = parseValue(field[2]);
  }
  return { doc, body: match[2] };
}

const asArray = value => Array.isArray(value) ? value : [];
const unique = values => new Set(values).size === values.length;
const findingId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(value);
const isSha = value => typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(value);
const isIso = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));

function git(root, args) {
  return childProcess.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
}

function objectType(root, identity) {
  if (!isSha(identity)) return '';
  const result = git(root, ['cat-file', '-t', identity]);
  return result.status === 0 ? result.stdout.trim() : '';
}

function isAncestor(root, ancestor, descendant) {
  const result = git(root, ['merge-base', '--is-ancestor', ancestor, descendant]);
  return result.status === 0;
}

function findingSection(body, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^###\\s+${escaped}\\s*$`, 'm');
  const match = heading.exec(body);
  if (!match) return '';
  const rest = body.slice(match.index + match[0].length);
  const next = rest.search(/^###\s+/m);
  return next < 0 ? rest : rest.slice(0, next);
}

function listReports(root, iteration, staged) {
  const prefix = `iterations/${iteration}/system-review/`;
  if (staged) {
    const result = git(root, ['ls-files', '--cached', `${prefix}review-*.md`]);
    if (result.status !== 0) throw new Error(result.stderr.trim());
    return result.stdout.split(/\r?\n/).filter(Boolean).sort();
  }
  const directory = path.join(root, prefix);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(name => /^review-\d{3}\.md$/.test(name)).sort()
    .map(name => `${prefix}${name}`);
}

function readReport(root, relative, staged) {
  if (!staged) return fs.readFileSync(path.join(root, relative), 'utf8');
  const result = git(root, ['show', `:${relative}`]);
  if (result.status !== 0) throw new Error(`cannot read staged ${relative}: ${result.stderr.trim()}`);
  return result.stdout;
}

function validateChain(root, reports, options = {}) {
  const errors = [];
  let prior = null;
  let priorPath = null;
  for (let index = 0; index < reports.length; index++) {
    const relative = reports[index];
    let parsed;
    try { parsed = parseReport(readReport(root, relative, options.staged), relative); }
    catch (error) { errors.push(error.message); continue; }
    const { doc, body } = parsed;
    const unknown = Object.keys(doc).filter(key => !FIELDS.includes(key));
    const missing = FIELDS.filter(key => !Object.prototype.hasOwnProperty.call(doc, key));
    if (unknown.length) errors.push(`${relative}: unknown fields: ${unknown.join(', ')}`);
    if (missing.length) errors.push(`${relative}: missing fields: ${missing.join(', ')}`);
    if (doc.schema !== SCHEMA) errors.push(`${relative}: schema must be ${SCHEMA}`);
    const expectedId = path.basename(relative, '.md');
    if (doc.review_id !== expectedId) errors.push(`${relative}: review_id must be ${expectedId}`);
    if (!['full', 'targeted'].includes(doc.review_type)) errors.push(`${relative}: review_type must be full|targeted`);
    if (!['commit', 'tree'].includes(objectType(root, doc.candidate))) errors.push(`${relative}: candidate must resolve to commit/tree`);
    if (!isIso(doc.created_at)) errors.push(`${relative}: created_at must be ISO-8601`);
    for (const field of ['target_finding_ids', 'new_finding_ids', 'closed_finding_ids', 'open_finding_ids', 'evidence_refs']) {
      const values = doc[field];
      if (!Array.isArray(values) || !unique(values)) errors.push(`${relative}: ${field} must be a unique array`);
      if (field !== 'evidence_refs' && asArray(values).some(id => !findingId(id))) errors.push(`${relative}: ${field} contains invalid finding id`);
    }
    if (!Array.isArray(doc.evidence_refs) || doc.evidence_refs.some(ref => typeof ref !== 'string' || !ref.trim()))
      errors.push(`${relative}: evidence_refs must contain non-empty references`);
    if (index === 0) {
      if (doc.review_type !== 'full') errors.push(`${relative}: first System Review must be full`);
      if (doc.prior_report !== null) errors.push(`${relative}: first review prior_report must be null`);
      if (asArray(doc.target_finding_ids).length) errors.push(`${relative}: first review target_finding_ids must be []`);
    } else {
      if (doc.prior_report !== priorPath) errors.push(`${relative}: prior_report must be ${priorPath}`);
      const priorOpen = new Set(asArray(prior.doc.open_finding_ids));
      const targets = asArray(doc.target_finding_ids);
      if (doc.review_type === 'targeted' && !targets.length) errors.push(`${relative}: targeted review requires target_finding_ids`);
      if (targets.some(id => !priorOpen.has(id))) errors.push(`${relative}: target finding not open in prior report`);
      if (asArray(doc.closed_finding_ids).some(id => !priorOpen.has(id))) errors.push(`${relative}: closed finding not open in prior report`);
      if (doc.review_type === 'targeted' && asArray(doc.closed_finding_ids).some(id => !targets.includes(id)))
        errors.push(`${relative}: targeted review may close only target findings`);
      if (asArray(doc.closed_finding_ids).length) {
        if (doc.candidate === prior.doc.candidate) errors.push(`${relative}: closing findings requires a new fixed candidate`);
        const priorType = objectType(root, prior.doc.candidate);
        const currentType = objectType(root, doc.candidate);
        if (priorType === 'commit' && currentType === 'commit' && !isAncestor(root, prior.doc.candidate, doc.candidate))
          errors.push(`${relative}: repair candidate must descend from predecessor candidate`);
      }
      const expected = new Set(priorOpen);
      asArray(doc.closed_finding_ids).forEach(id => expected.delete(id));
      asArray(doc.new_finding_ids).forEach(id => expected.add(id));
      if ([...expected].sort().join('\0') !== asArray(doc.open_finding_ids).slice().sort().join('\0'))
        errors.push(`${relative}: open_finding_ids must equal prior open - closed + new`);
    }
    for (const id of asArray(doc.new_finding_ids)) {
      const section = findingSection(body, id);
      if (!section) { errors.push(`${relative}: new finding ${id} requires a ### heading`); continue; }
      for (const field of ['Severity', 'Summary', 'Evidence', 'Required action'])
        if (!new RegExp(`^${field}:\\s*\\S.+$`, 'm').test(section))
          errors.push(`${relative}: new finding ${id} requires non-empty ${field}`);
      if (!/^Severity:\s*blocking\s*$/mi.test(section)) errors.push(`${relative}: new finding ${id} Severity must be blocking`);
    }
    if (doc.conclusion === 'pass' && asArray(doc.open_finding_ids).length) errors.push(`${relative}: pass requires no open findings`);
    else if (doc.conclusion === 'blocked' && !asArray(doc.open_finding_ids).length) errors.push(`${relative}: blocked requires open findings`);
    else if (!['pass', 'blocked'].includes(doc.conclusion)) errors.push(`${relative}: conclusion must be pass|blocked`);
    prior = parsed;
    priorPath = relative;
  }
  if (!options.inProgress && (!prior || prior.doc.conclusion !== 'pass')) errors.push('latest System Review must pass');
  return errors;
}

function parseArgs(argv) {
  const options = { iteration: '', root: process.cwd(), staged: false, inProgress: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--staged') options.staged = true;
    else if (arg === '--in-progress') options.inProgress = true;
    else if (!options.iteration) options.iteration = arg;
    else options.root = path.resolve(arg);
  }
  if (!/^v\d+(?:\.\d+)*$/.test(options.iteration)) throw new Error('iteration must be vN or vN.N');
  return options;
}

function main(argv = process.argv.slice(2)) {
  let options;
  try { options = parseArgs(argv); } catch (error) { console.error(error.message); return 2; }
  let errors;
  try {
    errors = options.inProgress
      ? validateChain(options.root, listReports(options.root, options.iteration, options.staged), options)
      : validate(options.iteration, options.root, options);
  }
  catch (error) { errors = [error.message]; }
  if (errors.length) {
    console.error('❌ System Review chain failed:'); errors.forEach(error => console.error(`- ${error}`)); return 1;
  }
  console.log('✅ System Review chain passed'); return 0;
}

function validate(iteration, root, options = {}) {
  try {
    const staged = Boolean(options.staged);
    const reports = listReports(root, iteration, staged);
    const errors = validateChain(root, reports, options);
    if (options.inProgress) return errors;
    const read = relative => {
      if (!staged) return fs.readFileSync(path.join(root, relative), 'utf8');
      const result = git(root, ['show', `:${relative}`]);
      if (result.status !== 0) throw new Error(`cannot read staged ${relative}`);
      return result.stdout;
    };
    const tasks = require('./check-gate.js').parseTasksSource(read('status.yml')) || [];
    const matches = tasks.filter(task => task.type === 'integration-verify' && task.iteration === iteration);
    if (matches.length !== 1) return [...errors, `${iteration} requires exactly one integration-verify task`];
    const task = matches[0];
    const latest = reports.at(-1) || '';
    if (task.latest_system_review !== latest) errors.push('status latest_system_review must equal actual latest report');
    let latestDoc = null;
    if (latest) latestDoc = parseReport(read(latest), latest).doc;
    if (!task.final_candidate || !latestDoc || task.final_candidate !== latestDoc.candidate)
      errors.push('status final_candidate must equal latest System Review candidate');
    if (!['commit', 'tree'].includes(objectType(root, task.final_candidate))) errors.push('status final_candidate must resolve to commit/tree');
    if (!task.integration_result) errors.push('status integration_result is required');
    else {
      const integration = require('./check-integration-evidence.js');
      errors.push(...integration.validate(task.integration_result, root, {
        staged,
        requireSystemLinkage: true,
        requireSatisfied: true,
        expectedIteration: iteration,
        expectedCandidate: task.final_candidate,
        expectedReview: task.latest_system_review,
      }));
    }
    return errors;
  } catch (error) { return [error.message]; }
}

if (require.main === module) process.exitCode = main();
module.exports = { SCHEMA, parseReport, validateChain, validate, main };
