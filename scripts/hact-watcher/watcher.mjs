#!/usr/bin/env node
// HACT Watcher v0.1: a deliberately small, deterministic Dropbox-to-Git publisher.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createHash, randomUUID } from 'node:crypto';
import { homedir, hostname } from 'node:os';
import { pathToFileURL } from 'node:url';

const PUBLISH_SCHEMA = 'hact.publish.v1';
const RESULT_SCHEMA = 'hact.result.v1';
const ROOT_MARKER = '.hact-watcher-root.json';

function now() { return new Date().toISOString(); }
function log(level, message) { console.log(`${now()} ${level} ${message}`); }
function abort(message, stage = 'validation') { const error = new Error(message); error.stage = stage; throw error; }
function must(condition, message, stage) { if (!condition) abort(message, stage); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function parseArgs(args) {
  if (args.length === 2 && args[0] === '--config' && args[1]) return args[1];
  console.log('Usage: node watcher.mjs --config <config.json>');
  process.exit(2);
}
function readJson(file, stage = 'validation') {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) { abort(`invalid JSON: ${error.message}`, stage); }
}
function readPublish(file) {
  let raw;
  try { raw = fs.readFileSync(file); }
  catch (error) { abort(`could not read publish package: ${error.message}`); }
  let job;
  try { job = JSON.parse(raw.toString('utf8')); }
  catch (error) { abort(`invalid JSON: ${error.message}`); }
  return { job, requestSha256: createHash('sha256').update(raw).digest('hex') };
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, file);
}
function ensureInside(root, candidate, label) {
  const relative = path.relative(root, candidate);
  must(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `${label} escapes configured root`, 'configuration');
}
function isBranch(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 &&
    !value.startsWith('/') && !value.endsWith('/') && !value.includes('..') && !value.includes('@{') &&
    !/[\s~^:?*\\[\x00-\x1f]/.test(value) && !value.split('/').some(part => !part || part.startsWith('.') || part.endsWith('.lock'));
}
function globRegex(glob) {
  let output = '^';
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { output += '(?:.*/)?'; i += 2; }
      else { output += '.*'; i += 1; }
    } else if (char === '*') output += '[^/]*';
    else if (char === '?') output += '[^/]';
    else output += char.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  }
  return new RegExp(`${output}$`);
}
function filePath(value) {
  must(typeof value === 'string' && value.length > 0, 'file path must be a non-empty string');
  must(!value.includes('\\') && !value.includes('\0'), `invalid path: ${value}`);
  must(!path.posix.isAbsolute(value) && !path.win32.isAbsolute(value), `path must be relative: ${value}`);
  const parts = value.split('/');
  must(!parts.some(part => !part || part === '.' || part === '..'), `invalid path segment: ${value}`);
  must(!parts.some(part => part === '.git' || part === '.github'), `protected path: ${value}`);
  must(path.posix.normalize(value) === value, `path is not normalized: ${value}`);
  return value;
}
function validateConfig(value, source) {
  must(object(value), 'config must be a JSON object', 'configuration');
  must(Number.isInteger(value.poll_interval_ms) && value.poll_interval_ms >= 1000, 'poll_interval_ms must be an integer >= 1000', 'configuration');
  must(typeof value.dropbox_root === 'string' && typeof value.repos_root === 'string', 'dropbox_root and repos_root are required', 'configuration');
  must(object(value.repos) && Object.keys(value.repos).length > 0, 'repos is required', 'configuration');
  const config = { ...value, dropbox_root: path.resolve(path.dirname(source), value.dropbox_root), repos_root: path.resolve(path.dirname(source), value.repos_root) };
  must(config.dropbox_root !== config.repos_root, 'dropbox_root and repos_root must be different', 'configuration');
  for (const [name, repo] of Object.entries(config.repos)) {
    must(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && object(repo), `invalid repo config: ${name}`, 'configuration');
    must(typeof repo.git_url === 'string' && /^(https:\/\/|ssh:\/\/|git@)/.test(repo.git_url), `invalid git_url: ${name}`, 'configuration');
    must(isBranch(repo.base_branch), `invalid base_branch: ${name}`, 'configuration');
    must(typeof repo.allowed_branch_prefix === 'string' && repo.allowed_branch_prefix.endsWith('/') && isBranch(repo.allowed_branch_prefix.slice(0, -1)), `invalid allowed_branch_prefix: ${name}`, 'configuration');
    must(Array.isArray(repo.allowed_paths) && repo.allowed_paths.every(x => typeof x === 'string' && x), `invalid allowed_paths: ${name}`, 'configuration');
    must(Array.isArray(repo.checks) && repo.checks.length === 0, `v0.1 only supports an empty checks array: ${name}`, 'configuration');
  }
  return config;
}
function validateJob(job, config) {
  must(object(job), 'publish package must be a JSON object');
  must(job.schema === PUBLISH_SCHEMA, `unsupported schema: ${job.schema}`);
  must(typeof job.job_id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(job.job_id), 'invalid job_id');
  must(typeof job.base_sha === 'string' && /^[0-9a-f]{40}$/i.test(job.base_sha), 'base_sha must be a 40-character Git commit SHA');
  must(typeof job.repo === 'string' && Object.hasOwn(config.repos, job.repo), `repo not allowed: ${job.repo}`);
  const repo = config.repos[job.repo];
  must(job.base_branch === repo.base_branch && isBranch(job.base_branch), `base_branch must be ${repo.base_branch}`);
  must(isBranch(job.target_branch), 'invalid target_branch');
  must(job.target_branch.startsWith(repo.allowed_branch_prefix), `target_branch must start with ${repo.allowed_branch_prefix}`);
  must(job.target_branch !== 'main' && job.target_branch !== 'master', 'target_branch may not be main or master');
  must(typeof job.task === 'string' && job.task, 'task must be a non-empty string');
  must(typeof job.commit_message === 'string' && job.commit_message.trim() && !/[\r\n\0]/.test(job.commit_message), 'invalid commit_message');
  must(Array.isArray(job.files) && job.files.length, 'files must be a non-empty array');
  const seen = new Set();
  const files = job.files.map((entry, index) => {
    must(object(entry), `files[${index}] must be an object`);
    const relative = filePath(entry.path);
    must(repo.allowed_paths.some(pattern => globRegex(pattern).test(relative)), `path not allowed: ${relative}`);
    must(typeof entry.content === 'string', `content must be a string: ${relative}`);
    must(!seen.has(relative), `duplicate file path: ${relative}`); seen.add(relative);
    return { path: relative, content: entry.content };
  });
  return { repo, files };
}
function git(cwd, args) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (error) { abort(`git ${args[0]} failed: ${String(error.stderr || error.message).trim().replace(/\s+/g, ' ')}`, 'git'); }
}
function dedicatedClone(config, name, repo) {
  fs.mkdirSync(config.repos_root, { recursive: true });
  const marker = path.join(config.repos_root, ROOT_MARKER);
  if (!fs.existsSync(marker)) {
    must(fs.readdirSync(config.repos_root).length === 0, `repos_root must be empty before Watcher initializes it: ${config.repos_root}`, 'configuration');
    writeJson(marker, { schema: 'hact.watcher.repos-root.v1', created_at: now() });
  } else must(readJson(marker, 'configuration').schema === 'hact.watcher.repos-root.v1', 'invalid Watcher repos_root marker', 'configuration');
  const destination = path.resolve(config.repos_root, name); ensureInside(config.repos_root, destination, 'repo directory');
  if (!fs.existsSync(destination)) {
    log('INFO', `cloning ${name} into dedicated Watcher root`);
    try { execFileSync('git', ['clone', repo.git_url, destination], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (error) { abort(`git clone failed: ${String(error.stderr || error.message).trim().replace(/\s+/g, ' ')}`, 'git'); }
  }
  must(fs.existsSync(path.join(destination, '.git')), `not a Git clone: ${destination}`, 'git');
  must(git(destination, ['remote', 'get-url', 'origin']) === repo.git_url, `origin mismatch for ${name}`, 'git');
  return destination;
}
function move(source, directory) { const target = path.join(directory, path.basename(source)); fs.renameSync(source, target); return target; }
function resultFile(paths, jobId) { return path.join(paths.results, `${jobId}.result.json`); }
function collisionResultFile(paths, jobId, requestSha256) { return path.join(paths.results, `${jobId}.collision.${requestSha256}.result.json`); }
function resultRequestSha256(file) {
  try { return readJson(file, 'idempotency').request_sha256; }
  catch { return undefined; }
}
function existingResultAction(paths, jobId, requestSha256) {
  const existing = resultFile(paths, jobId);
  if (!fs.existsSync(existing)) return null;
  const existingHash = resultRequestSha256(existing);
  if (existingHash === requestSha256) return { type: 'same' };
  return { type: 'collision', existingHash: typeof existingHash === 'string' ? existingHash : 'missing' };
}
function lockPayload(kind, owner) { return { schema: `hact.watcher.${kind}-lock.v1`, owner, pid: process.pid, host: hostname(), created_at: now() }; }
function releaseOwnedLock(lockPath, owner) {
  try { if (fs.existsSync(lockPath) && readJson(lockPath, 'lock').owner === owner) fs.rmSync(lockPath); }
  catch { /* Never delete a lock that cannot be proved to be ours. */ }
}
function pidAlive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code === 'EPERM'; }
}
function singletonLockPath(dropboxRoot) {
  const rootHash = createHash('sha256').update(path.resolve(dropboxRoot).toLowerCase()).digest('hex');
  return path.join(homedir(), '.hact', 'watcher-runtime', `${rootHash}.lock.json`);
}
function acquireSingleton(dropboxRoot) {
  const lockPath = singletonLockPath(dropboxRoot); const owner = randomUUID(); fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { fs.writeFileSync(lockPath, `${JSON.stringify(lockPayload('process', owner))}\n`, { flag: 'wx' }); return { lockPath, owner }; }
    catch (error) {
      if (error.code !== 'EEXIST') abort(`could not create Watcher singleton lock: ${error.message}`, 'singleton');
      const existing = readJson(lockPath, 'singleton');
      if (existing.host === hostname() && Number.isInteger(existing.pid) && pidAlive(existing.pid)) abort(`another HACT Watcher is already running for this dropbox_root (pid ${existing.pid})`, 'singleton');
      try { fs.rmSync(lockPath); } catch (removeError) { abort(`could not recover stale Watcher singleton lock: ${removeError.message}`, 'singleton'); }
    }
  }
  abort('could not acquire Watcher singleton lock after stale-lock recovery', 'singleton');
}
function processFile(source, config, paths, alreadyClaimed = false) {
  let claimed = source; let job; let jobId = path.basename(source).replace(/\.publish\.json$/i, 'unknown'); let lock; let jobLockOwner; let requestSha256;
  try {
    ({ job, requestSha256 } = readPublish(source)); jobId = typeof job?.job_id === 'string' ? job.job_id : jobId;
    const { repo, files } = validateJob(job, config); const result = resultFile(paths, jobId);
    const existing = existingResultAction(paths, jobId, requestSha256);
    if (existing?.type === 'same') { log('INFO', `job ${jobId} already has the same request result; skipping`); move(source, paths.done); return; }
    if (existing?.type === 'collision') {
      const collision = { schema: RESULT_SCHEMA, job_id: jobId, status: 'failed', stage: 'idempotency', error: `job_id collision: existing request_sha256 ${existing.existingHash} differs from ${requestSha256}`, request_sha256: requestSha256, repo: job.repo, branch: job.target_branch };
      const collisionFile = collisionResultFile(paths, jobId, requestSha256); if (!fs.existsSync(collisionFile)) writeJson(collisionFile, collision); move(source, paths.failed); log('ERROR', `job ${jobId} failed at idempotency: ${collision.error}`); return;
    }
    if (!alreadyClaimed) {
      try { claimed = move(source, paths.processing); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    }
    lock = path.join(paths.processing, `.${jobId}.lock`); const candidateJobLockOwner = randomUUID();
    try { fs.writeFileSync(lock, `${JSON.stringify(lockPayload('job', candidateJobLockOwner))}\n`, { flag: 'wx' }); jobLockOwner = candidateJobLockOwner; } catch (error) { if (error.code === 'EEXIST') { log('INFO', `job ${jobId} is already being processed`); if (!alreadyClaimed) move(claimed, paths.inbox); return; } throw error; }
    const afterClaim = existingResultAction(paths, jobId, requestSha256);
    if (afterClaim?.type === 'same') { move(claimed, paths.done); return; }
    if (afterClaim?.type === 'collision') abort(`job_id collision: existing request_sha256 ${afterClaim.existingHash} differs from ${requestSha256}`, 'idempotency');
    const clone = dedicatedClone(config, job.repo, repo);
    git(clone, ['fetch', 'origin']);
    const actualBaseSha = git(clone, ['rev-parse', `origin/${job.base_branch}`]);
    must(actualBaseSha === job.base_sha.toLowerCase(), `base_sha precondition failed: expected ${job.base_sha.toLowerCase()}, actual ${actualBaseSha}`, 'precondition');
    git(clone, ['checkout', '--detach', `origin/${job.base_branch}`]); git(clone, ['reset', '--hard', `origin/${job.base_branch}`]); git(clone, ['clean', '-fd']); git(clone, ['checkout', '-B', job.target_branch, `origin/${job.base_branch}`]);
    for (const file of files) { const destination = path.resolve(clone, ...file.path.split('/')); ensureInside(clone, destination, 'published file'); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, file.content, 'utf8'); }
    git(clone, ['add', '--', ...files.map(file => file.path)]);
    const changed = git(clone, ['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
    if (!changed.length) { writeJson(result, { schema: RESULT_SCHEMA, job_id: jobId, status: 'no_changes', repo: job.repo, branch: job.target_branch, request_sha256: requestSha256, changed_files: [] }); move(claimed, paths.done); log('INFO', `job ${jobId} had no changes`); return; }
    git(clone, ['commit', '-m', job.commit_message]); const commitSha = git(clone, ['rev-parse', 'HEAD']); git(clone, ['push', '-u', 'origin', job.target_branch]);
    writeJson(result, { schema: RESULT_SCHEMA, job_id: jobId, status: 'success', repo: job.repo, branch: job.target_branch, request_sha256: requestSha256, commit_sha: commitSha, changed_files: changed }); move(claimed, paths.done); log('INFO', `job ${jobId} published ${commitSha}`);
  } catch (error) {
    const result = { schema: RESULT_SCHEMA, job_id: jobId, status: 'failed', stage: error.stage || 'unknown', error: error.message };
    if (requestSha256) result.request_sha256 = requestSha256;
    if (job?.repo) result.repo = job.repo; if (job?.target_branch) result.branch = job.target_branch;
    try { const target = resultFile(paths, jobId); if (!fs.existsSync(target)) writeJson(target, result); } catch (resultError) { log('ERROR', `could not write result for ${jobId}: ${resultError.message}`); }
    try { if (fs.existsSync(claimed)) move(claimed, paths.failed); } catch (moveError) { log('ERROR', `could not archive failed job ${jobId}: ${moveError.message}`); }
    log('ERROR', `job ${jobId} failed at ${result.stage}: ${result.error}`);
  } finally { if (lock && jobLockOwner) releaseOwnedLock(lock, jobLockOwner); }
}
function main() {
  const configFile = path.resolve(parseArgs(process.argv.slice(2))); const config = validateConfig(readJson(configFile, 'configuration'), configFile);
  const singleton = acquireSingleton(config.dropbox_root); process.once('exit', () => releaseOwnedLock(singleton.lockPath, singleton.owner));
  const paths = Object.fromEntries(['inbox', 'processing', 'results', 'done', 'failed'].map(name => [name, path.join(config.dropbox_root, name)])); Object.values(paths).forEach(directory => fs.mkdirSync(directory, { recursive: true }));
  const jobs = directory => fs.readdirSync(directory, { withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.publish.json')).map(entry => path.join(directory, entry.name)).sort();
  const scan = () => { jobs(paths.inbox).forEach(file => processFile(file, config, paths)); jobs(paths.processing).forEach(file => processFile(file, config, paths, true)); };
  log('INFO', `HACT Watcher v0.1.1 started; polling ${paths.inbox}`); scan(); setInterval(scan, config.poll_interval_ms);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(`${now()} ERROR startup failed at ${error.stage || 'unknown'}: ${error.message}`); process.exit(1); }
}

export { acquireSingleton, existingResultAction, processFile, releaseOwnedLock, singletonLockPath };
