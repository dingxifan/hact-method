#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');
const sync = require('../scripts/sync-method.cjs');

const PLAN_SCHEMA = 'hact-legacy-adoption/v1';
const EVIDENCE = '_meta/hact-vnext-normalization.json';
const UPGRADE_EVIDENCE_DIR = '_meta/method-upgrades';

function readJson(file, label) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
}

function legacyTemplateFiles(methodRoot, source) {
  const names = sync.git(methodRoot, ['ls-tree', '-r', '--name-only', source, '--', 'templates']).split(/\r?\n/).filter(Boolean);
  const selected = names.filter(name =>
    (/^templates\/scripts\/[^/]+\.js$/.test(name) && !name.endsWith('.test.js'))
    || /^templates\/\.codex\/agents\/[^/]+\.toml$/.test(name)
    || ['templates/AGENTS.md', 'templates/gitee-ops.md', 'templates/scripts/pre-commit-hook.sh'].includes(name));
  return selected.map(from => {
    const bytes = childProcess.execFileSync('git', ['-C', methodRoot, 'show', `${source}:${from}`]);
    return { path: from.slice('templates/'.length), sha256: sync.sha256(bytes), bytes };
  });
}

function mergeThreeWay(current, base, target) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-method-merge-'));
  try {
    const currentFile = path.join(dir, 'current');
    const baseFile = path.join(dir, 'base');
    const targetFile = path.join(dir, 'target');
    fs.writeFileSync(currentFile, current); fs.writeFileSync(baseFile, base); fs.writeFileSync(targetFile, target);
    const result = childProcess.spawnSync('git', ['merge-file', '-p', currentFile, baseFile, targetFile], { encoding: null });
    return { clean: result.status === 0, bytes: result.stdout || Buffer.alloc(0) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function readLegacy(root, methodRoot) {
  const metaPath = sync.safe(root, sync.META);
  if (!fs.existsSync(metaPath)) return { kind: 'absent', source: null, files: [] };
  const metadata = readJson(metaPath, 'legacy Method metadata');
  if (metadata.schema !== sync.MANIFEST_SCHEMA && metadata.schema !== 'hact-method-install/v1' && metadata.schema !== 1)
    return { kind: 'invalid', source: null, files: [] };
  const source = metadata.source || metadata.methodRef;
  if (!/^[0-9a-f]{40}$/.test(source || '')) return { kind: 'invalid', source: null, files: [] };
  let commit;
  try { commit = sync.git(methodRoot, ['rev-parse', '--verify', `${source}^{commit}`]); }
  catch { return { kind: 'unprovable', source, files: [] }; }
  const fromSource = legacyTemplateFiles(methodRoot, commit);
  if (metadata.schema === sync.MANIFEST_SCHEMA) {
    const priorSource = sync.loadSource(methodRoot, commit);
    sync.verify(root, priorSource);
    return {
      kind: 'current', source: commit,
      files: sync.expected(priorSource).map(item => ({ path: item.to, sha256: item.sha256, bytes: item.bytes, ownership: item.ownership })),
    };
  }
  const declaredOwnership = new Map();
  const declaredPaths = new Set();
  const declaredHashes = new Map();
  if (metadata.schema === 'hact-method-install/v1' && Array.isArray(metadata.files))
    for (const item of metadata.files) if (item && typeof item.path === 'string') {
      declaredPaths.add(item.path);
      if (typeof item.sha256 === 'string') declaredHashes.set(item.path, item.sha256);
    }
  if (metadata.files && !Array.isArray(metadata.files) && typeof metadata.files === 'object') {
    for (const [file, record] of Object.entries(metadata.files)) {
      declaredPaths.add(file);
      declaredOwnership.set(file, record?.action === 'merge' ? 'merged' : 'method-owned');
      if (typeof record?.source === 'string') declaredHashes.set(file, record.source);
    }
  }
  if ([...declaredHashes].some(([file, hash]) => fromSource.find(item => item.path === file)?.sha256 !== hash))
    return { kind: 'invalid', source: null, files: [] };
  return {
    kind: metadata.schema === 'hact-method-install/v1' ? 'install-v1' : 'legacy',
    source: commit,
    files: fromSource.filter(item => declaredPaths.has(item.path))
      .map(item => ({ ...item, ownership: declaredOwnership.get(item.path) || 'method-owned' })),
  };
}

function parseTaskIds(statusFile) {
  if (!fs.existsSync(statusFile)) return [];
  const ids = [];
  let inTasks = false;
  for (const raw of fs.readFileSync(statusFile, 'utf8').split(/\r?\n/)) {
    if (/^tasks:\s*(?:#.*)?$/.test(raw)) { inTasks = true; continue; }
    if (!inTasks) continue;
    if (/^\S/.test(raw) && !/^-/.test(raw)) break;
    const match = raw.match(/^\s*-\s+id:\s*([^\s#]+)\s*(?:#.*)?$/);
    if (match) ids.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return ids;
}

function duplicateIds(root) {
  const counts = new Map();
  for (const id of parseTaskIds(path.join(root, 'status.yml'))) counts.set(id, (counts.get(id) || 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
}

function buildPlan(projectRoot, source) {
  const root = sync.gitRoot(projectRoot);
  const baseline = sync.git(root, ['rev-parse', 'HEAD']);
  const baselineTree = sync.git(root, ['rev-parse', 'HEAD^{tree}']);
  const blockers = [];
  const dirty = sync.git(root, ['status', '--porcelain=v1']);
  if (dirty) blockers.push({ code: 'WORKTREE_NOT_CLEAN', detail: dirty.split(/\r?\n/).filter(Boolean) });
  const legacy = readLegacy(root, source.root);
  if (legacy.kind === 'absent') blockers.push({ code: 'NO_LEGACY_METADATA', detail: 'use normal --install for a new project' });
  if (legacy.kind === 'invalid') blockers.push({ code: 'INVALID_LEGACY_METADATA', detail: sync.META });
  if (legacy.kind === 'unprovable') blockers.push({ code: 'LEGACY_SOURCE_UNPROVABLE', detail: legacy.source });
  const duplicates = duplicateIds(root);
  for (const duplicate of duplicates) blockers.push({ code: 'DUPLICATE_ACTIVE_TASK_ID', detail: duplicate });

  const previous = new Map(legacy.files.map(item => [item.path, item]));
  const targetRows = sync.expected(source);
  const targetPaths = new Set(targetRows.map(row => row.to));
  const files = targetRows.map(row => {
    const current = sync.currentHash(root, row.to);
    const prior = previous.get(row.to);
    let action;
    if (!current) action = 'install-source';
    else if (current === row.sha256) action = 'adopt-source';
    else if (row.ownership === 'method-owned' && prior && current === prior.sha256) action = 'update-source';
    else if (row.ownership === 'merged') {
      if (prior?.bytes) {
        const merged = mergeThreeWay(fs.readFileSync(sync.safe(root, row.to)), prior.bytes, row.bytes);
        if (merged.clean) action = 'merge-three-way';
        else {
          action = 'conflict';
          blockers.push({ code: 'MERGED_PATH_CONFLICT', detail: { path: row.to, current_sha256: current, target_sha256: row.sha256 } });
        }
      } else {
        action = 'conflict';
        blockers.push({ code: 'MERGED_PATH_BASE_UNPROVABLE', detail: { path: row.to, current_sha256: current, target_sha256: row.sha256 } });
      }
    }
    else if (row.ownership === 'project-owned') action = 'preserve-current';
    else {
      action = 'conflict';
      blockers.push({ code: 'METHOD_OWNED_DRIFT', detail: { path: row.to, current_sha256: current, target_sha256: row.sha256 } });
    }
    return {
      path: row.to,
      ownership: row.ownership,
      action,
      current_sha256: current || null,
      previous_source_sha256: prior?.sha256 || null,
      target_source_sha256: row.sha256,
      resolved_sha256: action === 'merge-three-way'
        ? sync.sha256(mergeThreeWay(fs.readFileSync(sync.safe(root, row.to)), prior.bytes, row.bytes).bytes)
        : null,
    };
  });
  const retired = legacy.files.filter(item => !targetPaths.has(item.path)).map(item => ({
    path: item.path,
    ownership: item.ownership,
    current_sha256: sync.currentHash(root, item.path) || null,
    previous_source_sha256: item.sha256,
    action: 'preserve-retired',
  }));
  return {
    schema: PLAN_SCHEMA,
    project: {
      repository: (() => { try { return sync.git(root, ['remote', 'get-url', 'origin']); } catch { return null; } })(),
      baseline_commit: baseline,
      baseline_tree: baselineTree,
    },
    target_method: { source: source.source },
    legacy_method: { kind: legacy.kind, source: legacy.source },
    task_identity: { duplicates },
    files,
    retired,
    blockers,
  };
}

function applyPlan(projectRoot, source, plan) {
  const root = sync.gitRoot(projectRoot);
  if (plan.schema !== PLAN_SCHEMA || plan.target_method?.source !== source.source) throw new Error('normalization plan does not match target Method');
  sync.ensureClean(root);
  if (sync.git(root, ['rev-parse', 'HEAD']) !== plan.project?.baseline_commit) throw new Error('project HEAD moved after normalization plan');
  const current = buildPlan(root, source);
  if (JSON.stringify(current) !== JSON.stringify(plan)) throw new Error('normalization plan is stale; regenerate it');
  if (plan.blockers.length) throw new Error(`normalization blockers remain:\n${plan.blockers.map(item => `- ${item.code}: ${JSON.stringify(item.detail)}`).join('\n')}`);
  const rows = new Map(sync.expected(source).map(row => [row.to, row]));
  for (const item of plan.files) {
    const row = rows.get(item.path);
    if (!row) throw new Error(`normalization plan contains unknown target: ${item.path}`);
    if (['install-source', 'update-source'].includes(item.action)) sync.writeAtomic(sync.safe(root, item.path), row.bytes);
    else if (item.action === 'merge-three-way') {
      const prior = legacyTemplateFiles(source.root, plan.legacy_method.source).find(entry => entry.path === item.path);
      if (!prior) throw new Error(`merged path base cannot be reproduced: ${item.path}`);
      const merged = mergeThreeWay(fs.readFileSync(sync.safe(root, item.path)), prior.bytes, row.bytes);
      if (!merged.clean || sync.sha256(merged.bytes) !== item.resolved_sha256) throw new Error(`merged path result changed: ${item.path}`);
      sync.writeAtomic(sync.safe(root, item.path), merged.bytes);
    }
    else if (item.action === 'adopt-source' || item.action === 'preserve-current') { /* deliberate no-op */ }
    else throw new Error(`normalization plan contains unresolved action: ${item.path}=${item.action}`);
  }
  const installed = new Map(plan.files.map(item => [item.path, sync.currentHash(root, item.path)]));
  sync.writeManifest(root, source, installed);
  const evidencePath = plan.legacy_method.kind === 'current'
    ? `${UPGRADE_EVIDENCE_DIR}/${source.source}.json`
    : EVIDENCE;
  const evidence = { ...plan, applied: true, result_manifest_schema: sync.MANIFEST_SCHEMA };
  sync.writeAtomic(sync.safe(root, evidencePath), Buffer.from(`${JSON.stringify(evidence, null, 2)}\n`));
  const verified = sync.verify(root, source);
  return { ...verified, evidence: evidencePath };
}

function parse(argv) {
  const options = { root: process.cwd(), methodRoot: path.resolve(__dirname, '..'), ref: 'HEAD', out: '', apply: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') options.root = path.resolve(argv[++i]);
    else if (arg === '--method-root') options.methodRoot = path.resolve(argv[++i]);
    else if (arg === '--ref') options.ref = argv[++i];
    else if (arg === '--out') options.out = path.resolve(argv[++i]);
    else if (arg === '--apply') options.apply = path.resolve(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parse(argv);
  const source = sync.loadSource(options.methodRoot, options.ref);
  if (options.apply) {
    console.log(JSON.stringify(applyPlan(options.root, source, readJson(options.apply, 'normalization plan'))));
    return;
  }
  const plan = buildPlan(options.root, source);
  const output = `${JSON.stringify(plan, null, 2)}\n`;
  if (options.out) fs.writeFileSync(options.out, output); else process.stdout.write(output);
  if (plan.blockers.length) process.exitCode = 1;
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { PLAN_SCHEMA, EVIDENCE, UPGRADE_EVIDENCE_DIR, buildPlan, applyPlan, duplicateIds };
