#!/usr/bin/env node
// HACT local-only adapter: authenticated HTTP delivery into the Watcher inbox.
import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const MAX_BODY_BYTES = 1024 * 1024;
const JOB_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function now() { return new Date().toISOString(); }
function log(level, message) { console.log(`${now()} ${level} ${message}`); }
function fail(message, status = 400) { const error = new Error(message); error.status = status; throw error; }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function parseArgs(args) {
  if (args.length === 2 && args[0] === '--config' && args[1]) return args[1];
  console.log('Usage: node adapter.mjs --config <adapter.config.json>'); process.exit(2);
}
function readConfig(file) {
  let value;
  try { value = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { fail(`invalid config JSON: ${error.message}`, 500); }
  if (!object(value) || value.listen_host !== '127.0.0.1') fail('listen_host must be exactly 127.0.0.1', 500);
  if (!Number.isInteger(value.listen_port) || value.listen_port < 1 || value.listen_port > 65535) fail('listen_port must be an integer from 1 to 65535', 500);
  if (typeof value.dropbox_root !== 'string' || !value.dropbox_root) fail('dropbox_root is required', 500);
  if (typeof value.token !== 'string' || value.token.length < 16) fail('token must be a local secret of at least 16 characters', 500);
  return { ...value, dropbox_root: path.resolve(path.dirname(file), value.dropbox_root) };
}
function validatePayload(value) {
  if (!object(value) || value.schema !== 'hact.publish.v1') fail('body must be a hact.publish.v1 JSON object');
  if (typeof value.job_id !== 'string' || !JOB_ID.test(value.job_id)) fail('invalid job_id');
  for (const key of ['repo', 'base_branch', 'target_branch', 'task', 'commit_message']) if (typeof value[key] !== 'string' || !value[key]) fail(`missing or invalid ${key}`);
  if (typeof value.base_sha !== 'string' || !/^[0-9a-f]{40}$/i.test(value.base_sha)) fail('base_sha must be a 40-character Git commit SHA');
  if (!Array.isArray(value.files) || value.files.length === 0) fail('files must be a non-empty array');
  for (const file of value.files) if (!object(file) || typeof file.path !== 'string' || typeof file.content !== 'string') fail('every files entry requires string path and content');
  return value;
}
function sameBytes(left, right) { return left.length === right.length && timingSafeEqual(left, right); }
function packetPaths(dropboxRoot, jobId) {
  return {
    inbox: path.join(dropboxRoot, 'inbox', `${jobId}.publish.json`),
    processing: path.join(dropboxRoot, 'processing', `${jobId}.publish.json`),
    done: path.join(dropboxRoot, 'done', `${jobId}.publish.json`),
    failed: path.join(dropboxRoot, 'failed', `${jobId}.publish.json`),
    result: path.join(dropboxRoot, 'results', `${jobId}.result.json`),
  };
}
function existingPacketOutcome(paths, raw) {
  if (fs.existsSync(paths.result)) return { state: 'completed', location: 'results' };
  for (const state of ['inbox', 'processing', 'done', 'failed']) {
    if (!fs.existsSync(paths[state])) continue;
    const existing = fs.readFileSync(paths[state]);
    if (sameBytes(existing, raw)) return { state: 'same', location: state };
    return { state: 'collision', location: state };
  }
  return null;
}
function atomicallyQueue(dropboxRoot, jobId, raw) {
  const paths = packetPaths(dropboxRoot, jobId); fs.mkdirSync(path.dirname(paths.inbox), { recursive: true });
  const before = existingPacketOutcome(paths, raw);
  if (before) return before;
  const temporary = path.join(path.dirname(paths.inbox), `.${jobId}.${process.pid}.${randomUUID()}.tmp`);
  fs.writeFileSync(temporary, raw, { flag: 'wx' });
  try {
    // link() is an atomic create-without-replace operation on the same volume.
    fs.linkSync(temporary, paths.inbox);
    return { state: 'queued', location: 'inbox' };
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const after = existingPacketOutcome(paths, raw);
    return after || { state: 'collision', location: 'inbox' };
  } finally { fs.rmSync(temporary, { force: true }); }
}
function authorize(request, token) {
  const supplied = request.headers.authorization;
  const expected = `Bearer ${token}`;
  return typeof supplied === 'string' && Buffer.byteLength(supplied) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
function send(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); response.end(`${JSON.stringify(value)}\n`);
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    request.on('data', chunk => { size += chunk.length; if (size > MAX_BODY_BYTES) { reject(Object.assign(new Error('request body exceeds 1 MiB'), { status: 413 })); request.destroy(); } else chunks.push(chunk); });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}
function createAdapter(config) {
  return createServer(async (request, response) => {
    try {
      if (request.method !== 'POST') return send(response, 405, { error: 'only POST is supported' });
      if (new URL(request.url, 'http://127.0.0.1').pathname !== '/publish') return send(response, 404, { error: 'not found' });
      if (!authorize(request, config.token)) return send(response, 401, { error: 'unauthorized' });
      const raw = await readBody(request); let payload;
      try { payload = JSON.parse(raw.toString('utf8')); } catch { fail('invalid JSON'); }
      validatePayload(payload);
      const outcome = atomicallyQueue(config.dropbox_root, payload.job_id, raw);
      if (outcome.state === 'queued') return send(response, 202, { status: 'queued', job_id: payload.job_id });
      if (outcome.state === 'same') return send(response, 202, { status: 'already_queued', job_id: payload.job_id, location: outcome.location });
      return send(response, 409, { error: outcome.state === 'completed' ? 'job_id already has a result; use a new job_id' : `job_id collision in ${outcome.location}`, job_id: payload.job_id });
    } catch (error) { return send(response, error.status || 500, { error: error.message || 'adapter error' }); }
  });
}
function main() {
  const config = readConfig(path.resolve(parseArgs(process.argv.slice(2)))); const server = createAdapter(config);
  server.listen(config.listen_port, config.listen_host, () => log('INFO', `HACT local-only adapter listening on http://${config.listen_host}:${config.listen_port}/publish`));
  process.once('SIGINT', () => server.close(() => process.exit(0))); process.once('SIGTERM', () => server.close(() => process.exit(0)));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(`${now()} ERROR adapter startup failed: ${error.message}`); process.exit(1); }
}
export { atomicallyQueue, createAdapter, readConfig, validatePayload };
