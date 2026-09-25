#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const META = '_meta/method-sync.json';
const POLICY = 'templates/method-install-policy.json';
const MANIFEST_SCHEMA = 'hact-method-install/v2';
const POLICY_SCHEMA = 'hact-method-install-policy/v1';
const OWNERSHIP = new Set(['method-owned', 'merged', 'project-owned']);
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function git(root, args, options = {}) {
  const result = childProcess.spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', ...options });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'git failed').trim());
  return result.stdout.trimEnd();
}

function gitRoot(dir) { return fs.realpathSync(git(dir, ['rev-parse', '--show-toplevel'])); }

function safe(root, relative) {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error(`invalid path: ${relative}`);
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error(`path escaped root: ${relative}`);
  return full;
}

function readJson(bytes, label) {
  try { return JSON.parse(Buffer.isBuffer(bytes) ? bytes.toString('utf8') : bytes); }
  catch (error) { throw new Error(`${label} is invalid JSON: ${error.message}`); }
}

const destination = sourcePath => sourcePath.slice('templates/'.length);

function loadPolicy(read, templateFiles) {
  let policy;
  try { policy = readJson(read(POLICY), 'Method install policy'); }
  catch (error) {
    if (/does not exist|exists on disk|Path .* not in/.test(error.message)) throw new Error(`Method source lacks ${POLICY}`);
    throw error;
  }
  if (policy.schema !== POLICY_SCHEMA || !OWNERSHIP.has(policy.default_ownership)
    || !policy.files || Array.isArray(policy.files) || typeof policy.files !== 'object')
    throw new Error('Method install policy is invalid');
  const destinations = new Set(templateFiles.map(destination));
  for (const [relative, ownership] of Object.entries(policy.files)) {
    if (!destinations.has(relative) || !OWNERSHIP.has(ownership)) throw new Error(`Method install policy has invalid entry: ${relative}`);
  }
  return policy;
}

function loadSource(methodRoot, ref) {
  methodRoot = gitRoot(methodRoot);
  const source = git(methodRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
  const names = git(methodRoot, ['ls-tree', '-r', '--name-only', source, '--', 'templates']).split(/\r?\n/).filter(Boolean);
  const files = names.filter(name =>
    (/^templates\/scripts\/[^/]+\.js$/.test(name) && !name.endsWith('.test.js'))
    || /^templates\/\.codex\/agents\/[^/]+\.toml$/.test(name)
    || ['templates/AGENTS.md', 'templates/gitee-ops.md', 'templates/scripts/pre-commit-hook.sh'].includes(name));
  const read = file => childProcess.execFileSync('git', ['-C', methodRoot, 'show', `${source}:${file}`]);
  const policy = loadPolicy(read, files);
  return { root: methodRoot, source, files, read, policy };
}

function expected(source) {
  return source.files.map(from => {
    const bytes = source.read(from);
    const to = destination(from);
    return { from, to, ownership: source.policy.files[to] || source.policy.default_ownership, sha256: sha256(bytes), bytes };
  });
}

function inspect(projectRoot, source) {
  const root = gitRoot(projectRoot);
  if (root === source.root) throw new Error('refuse to install Method into Method repository');
  const rows = expected(source).map(item => {
    const target = safe(root, item.to);
    if (!fs.existsSync(target)) return { ...item, state: 'missing' };
    if (!fs.statSync(target).isFile()) return { ...item, state: 'not-file' };
    const actual = sha256(fs.readFileSync(target));
    return { ...item, state: actual === item.sha256 ? 'same' : 'drift', actual };
  });
  return { root, rows };
}

function writeAtomic(file, bytes) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, bytes);
  fs.renameSync(temporary, file);
}

function validateManifestShape(metadata, root) {
  if (!metadata || metadata.schema !== MANIFEST_SCHEMA || !/^[0-9a-f]{40}$/.test(metadata.source || '') || !Array.isArray(metadata.files))
    throw new Error('existing Method ownership manifest is invalid or legacy; run legacy normalization first');
  const seen = new Set();
  for (const item of metadata.files) {
    if (!item || typeof item.path !== 'string' || !OWNERSHIP.has(item.ownership)
      || !/^[0-9a-f]{64}$/.test(item.source_sha256 || '') || !/^[0-9a-f]{64}$/.test(item.installed_sha256 || '')
      || seen.has(item.path)) throw new Error('existing Method ownership manifest is invalid');
    if (item.ownership === 'method-owned' && item.source_sha256 !== item.installed_sha256)
      throw new Error(`method-owned manifest entry differs from source: ${item.path}`);
    safe(root, item.path); seen.add(item.path);
  }
}

function readOwnedManifest(root, methodRoot) {
  const file = safe(root, META);
  if (!fs.existsSync(file)) return null;
  const metadata = readJson(fs.readFileSync(file), 'existing Method ownership manifest');
  validateManifestShape(metadata, root);
  let priorSource;
  try { priorSource = loadSource(methodRoot, metadata.source); }
  catch { throw new Error('existing Method ownership manifest source cannot be proven'); }
  if (priorSource.source !== metadata.source) throw new Error('existing Method ownership manifest source cannot be proven');
  const declared = metadata.files.slice().sort((a, b) => a.path.localeCompare(b.path));
  const proven = expected(priorSource).map(({ to, ownership, sha256: sourceHash }) => ({ path: to, ownership, source_sha256: sourceHash }))
    .sort((a, b) => a.path.localeCompare(b.path));
  const owned = declared.map(({ path: itemPath, ownership, source_sha256 }) => ({ path: itemPath, ownership, source_sha256 }));
  if (JSON.stringify(owned) !== JSON.stringify(proven))
    throw new Error('existing Method ownership manifest does not match its Method source');
  return metadata;
}

function ensureClean(root) {
  const dirty = git(root, ['status', '--porcelain=v1']);
  if (dirty) throw new Error('project worktree must be clean before current Method install');
}

function currentHash(root, relative) {
  const target = safe(root, relative);
  if (!fs.existsSync(target)) return '';
  if (!fs.statSync(target).isFile()) throw new Error(`Method target is not a regular file: ${relative}`);
  return sha256(fs.readFileSync(target));
}

function decideInstall(root, row, priorItem) {
  const actual = currentHash(root, row.to);
  if (priorItem && actual !== priorItem.installed_sha256)
    throw new Error(`installed Method path drifted; normalize or merge explicitly: ${row.to}`);
  if (row.ownership === 'method-owned') {
    if (priorItem && priorItem.ownership !== 'method-owned' && actual !== priorItem.source_sha256)
      throw new Error(`ownership tightened for customized path; explicit normalization required: ${row.to}`);
    if (!priorItem && actual && actual !== row.sha256)
      throw new Error(`unowned Method target already exists; legacy normalization required: ${row.to}`);
    return { bytes: row.bytes, installed_sha256: row.sha256 };
  }
  if (row.ownership === 'merged') {
    if (!actual) return { bytes: row.bytes, installed_sha256: row.sha256 };
    if (!priorItem) {
      if (actual !== row.sha256) throw new Error(`merged Method target requires legacy normalization: ${row.to}`);
      return { bytes: null, installed_sha256: actual };
    }
    if (actual === priorItem.source_sha256) return { bytes: row.bytes, installed_sha256: row.sha256 };
    if (priorItem.source_sha256 !== row.sha256)
      throw new Error(`merged Method target has upstream and project changes; explicit three-way merge required: ${row.to}`);
    return { bytes: null, installed_sha256: actual };
  }
  if (!actual) return { bytes: row.bytes, installed_sha256: row.sha256 };
  return { bytes: null, installed_sha256: actual };
}

function install(projectRoot, source) {
  const result = inspect(projectRoot, source);
  ensureClean(result.root);
  const prior = readOwnedManifest(result.root, source.root);
  const priorByPath = new Map((prior?.files || []).map(item => [item.path, item]));
  const currentPaths = new Set(result.rows.map(row => row.to));
  const retired = [];
  if (prior) for (const item of prior.files) {
    if (currentPaths.has(item.path)) continue;
    const actual = currentHash(result.root, item.path);
    if (!actual) continue;
    if (actual !== item.installed_sha256) throw new Error(`retired Method path drifted; refuse cleanup: ${item.path}`);
    if (item.ownership === 'method-owned') retired.push(safe(result.root, item.path));
  }
  const files = [];
  for (const row of result.rows) {
    const decision = decideInstall(result.root, row, priorByPath.get(row.to));
    if (decision.bytes) writeAtomic(safe(result.root, row.to), decision.bytes);
    files.push({ path: row.to, ownership: row.ownership, source_sha256: row.sha256, installed_sha256: decision.installed_sha256 });
  }
  for (const target of retired) fs.unlinkSync(target);
  writeAtomic(safe(result.root, META), Buffer.from(`${JSON.stringify({ schema: MANIFEST_SCHEMA, source: source.source, files }, null, 2)}\n`));
  return verify(result.root, source);
}

function verify(projectRoot, source) {
  const result = inspect(projectRoot, source);
  const bad = [];
  const metaPath = safe(result.root, META);
  let metadata;
  try { metadata = readJson(fs.readFileSync(metaPath), 'Method ownership manifest'); validateManifestShape(metadata, result.root); }
  catch (error) { bad.push({ to: META, state: error.message }); }
  if (metadata && metadata.source !== source.source) bad.push({ to: META, state: 'wrong-source' });
  if (metadata) {
    const declared = new Map(metadata.files.map(item => [item.path, item]));
    const wanted = expected(source);
    if (declared.size !== wanted.length) bad.push({ to: META, state: 'file-manifest-mismatch' });
    for (const row of wanted) {
      const item = declared.get(row.to);
      if (!item || item.ownership !== row.ownership || item.source_sha256 !== row.sha256) {
        bad.push({ to: row.to, state: 'manifest-source-mismatch' }); continue;
      }
      const actual = currentHash(result.root, row.to);
      if (!actual || actual !== item.installed_sha256) bad.push({ to: row.to, state: 'installed-content-drift' });
      if (row.ownership === 'method-owned' && actual !== row.sha256) bad.push({ to: row.to, state: 'method-source-drift' });
    }
  }
  if (bad.length) throw new Error(`current Method verification failed:\n${bad.map(row => `- ${row.to}: ${row.state}`).join('\n')}`);
  return { state: 'verified', root: result.root, source: source.source, files: result.rows.length };
}

function runtimeCheck(projectRoot, methodRoot) {
  const root = gitRoot(projectRoot);
  const metadata = readJson(fs.readFileSync(safe(root, META)), 'Method ownership manifest');
  if (metadata.schema !== MANIFEST_SCHEMA) throw new Error('project does not use current Method install schema; run legacy normalization first');
  return verify(root, loadSource(methodRoot, metadata.source));
}

function readAdopted(projectRoot, methodRoot, relative) {
  const root = gitRoot(projectRoot);
  const metadata = readJson(fs.readFileSync(safe(root, META)), 'Method ownership manifest');
  if (metadata.schema !== MANIFEST_SCHEMA) throw new Error('project does not use current Method install schema');
  safe(root, relative);
  return childProcess.execFileSync('git', ['-C', gitRoot(methodRoot), 'show', `${metadata.source}:${relative}`], { encoding: 'utf8' });
}

function writeManifest(root, source, installedByPath) {
  const files = expected(source).map(row => {
    const installed = installedByPath.get(row.to);
    if (!installed) throw new Error(`legacy adoption did not resolve target: ${row.to}`);
    return { path: row.to, ownership: row.ownership, source_sha256: row.sha256, installed_sha256: installed };
  });
  writeAtomic(safe(root, META), Buffer.from(`${JSON.stringify({ schema: MANIFEST_SCHEMA, source: source.source, files }, null, 2)}\n`));
}

function parse(argv) {
  const options = { action: 'check', root: process.cwd(), methodRoot: path.resolve(__dirname, '..'), ref: 'HEAD', file: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--install') options.action = 'install';
    else if (arg === '--verify') options.action = 'verify';
    else if (arg === '--runtime-check') options.action = 'runtime-check';
    else if (arg === '--read') { options.action = 'read'; options.file = argv[++i]; }
    else if (arg === '--root') options.root = path.resolve(argv[++i]);
    else if (arg === '--method-root') options.methodRoot = path.resolve(argv[++i]);
    else if (arg === '--ref') options.ref = argv[++i];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function main(argv = process.argv.slice(2)) {
  const options = parse(argv);
  if (options.action === 'read') { process.stdout.write(readAdopted(options.root, options.methodRoot, options.file)); return; }
  if (options.action === 'runtime-check') { console.log(JSON.stringify(runtimeCheck(options.root, options.methodRoot))); return; }
  const source = loadSource(options.methodRoot, options.ref);
  if (options.action === 'install') console.log(JSON.stringify(install(options.root, source)));
  else if (options.action === 'verify') console.log(JSON.stringify(verify(options.root, source)));
  else console.log(JSON.stringify(inspect(options.root, source).rows.map(({ to, state, ownership }) => ({ path: to, state, ownership }))));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {
  META, MANIFEST_SCHEMA, sha256, git, gitRoot, safe, writeAtomic, loadSource, expected, inspect,
  install, verify, runtimeCheck, readAdopted, writeManifest, currentHash, ensureClean,
};
