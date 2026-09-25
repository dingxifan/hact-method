#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const META = '_meta/method-sync.json';
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

function loadSource(methodRoot, ref) {
  methodRoot = gitRoot(methodRoot);
  const source = git(methodRoot, ['rev-parse', '--verify', `${ref}^{commit}`]);
  const names = git(methodRoot, ['ls-tree', '-r', '--name-only', source, '--', 'templates']).split(/\r?\n/).filter(Boolean);
  const files = names.filter(name =>
    (/^templates\/scripts\/[^/]+\.js$/.test(name) && !name.endsWith('.test.js'))
    || /^templates\/\.codex\/agents\/[^/]+\.toml$/.test(name)
    || ['templates/AGENTS.md', 'templates/gitee-ops.md', 'templates/scripts/pre-commit-hook.sh'].includes(name));
  const read = file => childProcess.execFileSync('git', ['-C', methodRoot, 'show', `${source}:${file}`]);
  return { root: methodRoot, source, files, read };
}

const destination = sourcePath => sourcePath.slice('templates/'.length);

function expected(source) {
  return source.files.map(from => {
    const bytes = source.read(from);
    return { from, to: destination(from), sha256: sha256(bytes), bytes };
  });
}

function inspect(projectRoot, source) {
  const root = gitRoot(projectRoot);
  if (root === source.root) throw new Error('refuse to install Method into Method repository');
  const rows = expected(source).map(item => {
    const target = safe(root, item.to);
    if (!fs.existsSync(target)) return { ...item, state: 'missing' };
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

function readOwnedManifest(root, methodRoot) {
  const file = safe(root, META);
  if (!fs.existsSync(file)) return null;
  const metadata = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (metadata.schema !== 'hact-method-install/v1' || !/^[0-9a-f]{40}$/.test(metadata.source || '') || !Array.isArray(metadata.files))
    throw new Error('existing Method ownership manifest is invalid');
  const seen = new Set();
  for (const item of metadata.files) {
    if (!item || typeof item.path !== 'string' || !/^[0-9a-f]{64}$/.test(item.sha256 || '') || seen.has(item.path))
      throw new Error('existing Method ownership manifest is invalid');
    safe(root, item.path); seen.add(item.path);
  }
  let priorSource;
  try { priorSource = loadSource(methodRoot, metadata.source); }
  catch { throw new Error('existing Method ownership manifest source cannot be proven'); }
  if (priorSource.source !== metadata.source) throw new Error('existing Method ownership manifest source cannot be proven');
  const declared = metadata.files.slice().sort((a, b) => a.path.localeCompare(b.path));
  const proven = expected(priorSource).map(({ to, sha256 }) => ({ path: to, sha256 })).sort((a, b) => a.path.localeCompare(b.path));
  if (JSON.stringify(declared) !== JSON.stringify(proven))
    throw new Error('existing Method ownership manifest does not match its Method source');
  return metadata;
}

function install(projectRoot, source) {
  const result = inspect(projectRoot, source);
  const dirty = git(result.root, ['status', '--porcelain=v1']);
  if (dirty) throw new Error('project worktree must be clean before current Method install');
  const prior = readOwnedManifest(result.root, source.root);
  const currentPaths = new Set(result.rows.map(row => row.to));
  const retired = [];
  if (prior) for (const item of prior.files) {
    if (currentPaths.has(item.path)) continue;
    const target = safe(result.root, item.path);
    if (!fs.existsSync(target)) continue;
    if (!fs.statSync(target).isFile() || sha256(fs.readFileSync(target)) !== item.sha256)
      throw new Error(`retired Method-owned path drifted; refuse deletion: ${item.path}`);
    retired.push(target);
  }
  for (const row of result.rows) writeAtomic(safe(result.root, row.to), row.bytes);
  for (const target of retired) fs.unlinkSync(target);
  const metadata = {
    schema: 'hact-method-install/v1',
    source: source.source,
    files: expected(source).map(({ to, sha256 }) => ({ path: to, sha256 })),
  };
  writeAtomic(safe(result.root, META), Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`));
  return verify(result.root, source);
}

function verify(projectRoot, source) {
  const result = inspect(projectRoot, source);
  const bad = result.rows.filter(row => row.state !== 'same');
  const metaPath = safe(result.root, META);
  let metadata;
  try { metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8')); }
  catch { bad.push({ to: META, state: 'missing-or-invalid' }); }
  if (metadata && (metadata.schema !== 'hact-method-install/v1' || metadata.source !== source.source))
    bad.push({ to: META, state: 'wrong-source' });
  if (metadata) {
    const declared = Array.isArray(metadata.files) ? metadata.files.slice().sort((a, b) => a.path.localeCompare(b.path)) : [];
    const wanted = expected(source).map(({ to, sha256 }) => ({ path: to, sha256 })).sort((a, b) => a.path.localeCompare(b.path));
    if (JSON.stringify(declared) !== JSON.stringify(wanted)) bad.push({ to: META, state: 'file-manifest-mismatch' });
  }
  if (bad.length) throw new Error(`current Method verification failed:\n${bad.map(row => `- ${row.to}: ${row.state}`).join('\n')}`);
  return { state: 'verified', root: result.root, source: source.source, files: result.rows.length };
}

function runtimeCheck(projectRoot, methodRoot) {
  const root = gitRoot(projectRoot);
  const metadata = JSON.parse(fs.readFileSync(safe(root, META), 'utf8'));
  if (metadata.schema !== 'hact-method-install/v1') throw new Error('project does not use current Method install schema');
  return verify(root, loadSource(methodRoot, metadata.source));
}

function readAdopted(projectRoot, methodRoot, relative) {
  const root = gitRoot(projectRoot);
  const metadata = JSON.parse(fs.readFileSync(safe(root, META), 'utf8'));
  safe(root, relative);
  return childProcess.execFileSync('git', ['-C', gitRoot(methodRoot), 'show', `${metadata.source}:${relative}`], { encoding: 'utf8' });
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
  else console.log(JSON.stringify(inspect(options.root, source).rows.map(({ to, state }) => ({ path: to, state }))));
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { loadSource, inspect, install, verify, runtimeCheck, readAdopted };
