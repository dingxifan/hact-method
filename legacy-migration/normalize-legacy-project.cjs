#!/usr/bin/env node
'use strict';
// One-time admission tool. vNext Core neither imports nor interprets its output.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const MARKER = '_meta/hact-vnext-normalization.json';
const SNAPSHOT = '_meta/hact-vnext-normalization/status.yml';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const git = (root, args) => cp.execFileSync('git', ['-C', root, ...args], {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim();
const isSha = value => /^[a-f0-9]{40}$/.test(String(value || ''));
function rootOf(root) { return git(root, ['rev-parse', '--show-toplevel']); }
function read(root, file) { return fs.readFileSync(path.join(root, file)); }
function text(root, file) { return read(root, file).toString('utf8'); }
function write(root, file, value) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function mergedTaskIds(status) {
  const ids = [];
  let inTasks = false, indent = null, current = null;
  const flush = () => { if (current && current.id && current.status === 'merged') ids.push(current.id); current = null; };
  for (const raw of String(status).split(/\r?\n/)) {
    if (/^tasks:\s*(?:\[\])?\s*$/.test(raw)) { inTasks = true; continue; }
    if (!inTasks) continue;
    if (/^\S/.test(raw) && !raw.startsWith('-')) { flush(); break; }
    const item = raw.match(/^(\s*)-\s+id:\s*([^#\s]+)/);
    if (item) {
      if (indent === null) indent = item[1].length;
      if (item[1].length === indent) { flush(); current = { id: item[2] }; continue; }
    }
    const statusMatch = raw.match(/^\s+status:\s*([^#\s]+)/);
    if (current && statusMatch) current.status = statusMatch[1];
  }
  flush();
  return [...new Set(ids)].sort();
}

// Normalization preserves historical facts, but it is not a parser bypass.
// We deliberately validate only the stable legacy envelope here; new vNext
// task/package schema is enforced later by Core for newly created work.
function statusShapeErrors(status) {
  const lines = String(status).split(/\r?\n/);
  if (!lines.some(line => /^tasks:\s*(?:\[\])?\s*$/.test(line))) return ['status.yml 缺 tasks 列表'];
  const errors = []; let current = null;
  const flush = () => {
    if (current && (!current.id || !current.status)) errors.push('status.yml task 缺 id 或 status');
    current = null;
  };
  for (const line of lines) {
    if (/^\s*-\s+id:\s*([^#\s]+)/.test(line)) { flush(); current = { id: true, status: false }; }
    else if (current && /^\s+status:\s*([^#\s]+)/.test(line)) current.status = true;
  }
  flush();
  return errors;
}

function recordFor(root, sourceBase) {
  const status = read(root, 'status.yml');
  return {
    schema: 2,
    kind: 'legacy-normalization',
    source_base: sourceBase,
    historical_status_sha256: sha256(status),
    // This is deliberately a Git object identity, not a second mutable
    // inventory.  A marker and snapshot changed together can no longer invent
    // a different historical world after admission.
    source_status_blob: git(root, ['rev-parse', `${sourceBase}:status.yml`]),
    historical_merged_task_ids: mergedTaskIds(status),
  };
}

function verify(root) {
  root = rootOf(root);
  const errors = [];
  let marker, snapshot;
  try { marker = JSON.parse(text(root, MARKER)); } catch { errors.push('缺 vNext normalization marker'); return errors; }
  try { snapshot = read(root, SNAPSHOT); } catch { errors.push('缺 frozen historical status snapshot'); return errors; }
  if (!marker || marker.schema !== 2 || marker.kind !== 'legacy-normalization') errors.push('normalization marker schema 非法');
  if (!isSha(marker && marker.source_base)) errors.push('normalization source_base 非固定 commit SHA');
  else {
    try { git(root, ['cat-file', '-e', `${marker.source_base}^{commit}`]); }
    catch { errors.push('normalization source_base 不可解析'); }
    try { git(root, ['merge-base', '--is-ancestor', marker.source_base, 'HEAD']); }
    catch { errors.push('normalization source_base 不是当前 baseline 祖先'); }
  }
  if (!/^[a-f0-9]{64}$/.test(String(marker && marker.historical_status_sha256 || ''))
      || marker.historical_status_sha256 !== sha256(snapshot)) errors.push('historical status snapshot hash 不一致');
  if (!/^[a-f0-9]{40}$/.test(String(marker && marker.source_status_blob || ''))) {
    errors.push('normalization source status blob 非固定 Git blob');
  } else if (isSha(marker && marker.source_base)) {
    try {
      const sourceBlob = git(root, ['rev-parse', `${marker.source_base}:status.yml`]);
      const sourceBytes = cp.execFileSync('git', ['-C', root, 'show', `${marker.source_base}:status.yml`]);
      if (sourceBlob !== marker.source_status_blob || !Buffer.from(snapshot).equals(sourceBytes))
        errors.push('historical snapshot 与 source_base Git truth 不一致');
    } catch { errors.push('normalization source_base 缺 status.yml Git truth'); }
  }
  const ids = mergedTaskIds(snapshot);
  if (!Array.isArray(marker && marker.historical_merged_task_ids)
      || JSON.stringify(marker.historical_merged_task_ids) !== JSON.stringify(ids)) errors.push('historical merged task inventory 不一致');
  for (const file of [MARKER, SNAPSHOT]) {
    try {
      const committed = cp.execFileSync('git', ['-C', root, 'show', `HEAD:${file}`]);
      if (!committed.equals(read(root, file))) errors.push(`normalization baseline 未冻结 ${file}`);
    } catch { errors.push(`normalization baseline 缺已提交 ${file}`); }
  }
  return errors;
}

function normalize(root, sourceBase) {
  root = rootOf(root);
  if (!isSha(sourceBase)) throw new Error('--source-base 必须是固定 40 位 commit SHA');
  if (git(root, ['status', '--porcelain=v1'])) throw new Error('normalization 只在干净工作树执行');
  git(root, ['cat-file', '-e', `${sourceBase}^{commit}`]);
  try { git(root, ['merge-base', '--is-ancestor', sourceBase, 'HEAD']); }
  catch { throw new Error('source_base 必须是当前 HEAD 的祖先，不能伪造历史输入'); }
  if (fs.existsSync(path.join(root, MARKER)) || fs.existsSync(path.join(root, SNAPSHOT)))
    throw new Error('已有 normalization artifact；请使用 --verify，不覆盖历史 baseline');
  const status = read(root, 'status.yml');
  const sourceStatus = cp.execFileSync('git', ['-C', root, 'show', `${sourceBase}:status.yml`]);
  if (!status.equals(sourceStatus)) throw new Error('当前 status.yml 与 source_base Git truth 不一致；先选择真实历史 source，不得 reconciliation 伪造');
  const shapeErrors = statusShapeErrors(status);
  if (shapeErrors.length) throw new Error(`legacy status 不可 normalization：${shapeErrors.join('；')}`);
  const marker = recordFor(root, sourceBase);
  write(root, SNAPSHOT, status);
  write(root, MARKER, JSON.stringify(marker, null, 2) + '\n');
  git(root, ['add', '--', MARKER, SNAPSHOT]);
  git(root, ['diff', '--cached', '--check']);
  git(root, ['commit', '-m', 'chore(hact): freeze vNext legacy normalization baseline']);
  const errors = verify(root);
  if (errors.length) throw new Error(errors.join('\n'));
  return { commit: git(root, ['rev-parse', 'HEAD']), marker };
}

// A failed commit (including a real pre-commit rejection) leaves Git's index
// intact. Resume only commits that exact staged normalization; it never resets
// or stages unrelated user artifacts.
function resume(root, sourceBase) {
  root = rootOf(root);
  if (!isSha(sourceBase)) throw new Error('--source-base 必须是固定 40 位 commit SHA');
  const staged = git(root, ['diff', '--cached', '--name-only']).split(/\r?\n/).filter(Boolean).sort();
  if (JSON.stringify(staged) !== JSON.stringify([MARKER, SNAPSHOT].sort()))
    throw new Error('resume 只接受恰好已暂存的 normalization artifacts；不清空或重排真实 staged artifacts');
  const marker = JSON.parse(text(root, MARKER));
  if (marker.source_base !== sourceBase) throw new Error('resume source_base 与已暂存 marker 不一致；不得换 source');
  if (git(root, ['diff', '--name-only']).split(/\r?\n/).filter(Boolean).length)
    throw new Error('resume 要求 artifacts 的工作树与 index 一致');
  git(root, ['diff', '--cached', '--check']);
  git(root, ['commit', '-m', 'chore(hact): freeze vNext legacy normalization baseline']);
  const errors = verify(root);
  if (errors.length) throw new Error(errors.join('\n'));
  return { commit: git(root, ['rev-parse', 'HEAD']), marker };
}

function main(argv) {
  let root = process.cwd(), sourceBase = '', writeMode = false, verifyMode = false, resumeMode = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') root = path.resolve(argv[++i] || '');
    else if (argv[i] === '--source-base') sourceBase = argv[++i] || '';
    else if (argv[i] === '--write') writeMode = true;
    else if (argv[i] === '--verify') verifyMode = true;
    else if (argv[i] === '--resume') resumeMode = true;
    else throw new Error('用法：normalize-legacy-project.cjs --verify [--root <project>]；或 --write/--resume --source-base <SHA> [--root <project>]');
  }
  if (Number(writeMode) + Number(verifyMode) + Number(resumeMode) !== 1) throw new Error('请选择且只选择 --write、--resume 或 --verify');
  if (verifyMode) {
    const errors = verify(root);
    if (errors.length) throw new Error(`项目尚未完成 vNext migration normalization：${errors.join('；')}`);
    console.log('✅ vNext legacy normalization baseline 已冻结且可验证');
  } else console.log(JSON.stringify(resumeMode ? resume(root, sourceBase) : normalize(root, sourceBase), null, 2));
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(String(error.stderr || error.message).trim()); process.exitCode = 1; }
}
module.exports = { MARKER, SNAPSHOT, mergedTaskIds, statusShapeErrors, recordFor, verify, normalize, resume };
