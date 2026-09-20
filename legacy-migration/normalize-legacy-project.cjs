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
function read(root, file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
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

function recordFor(root, sourceBase) {
  const status = read(root, 'status.yml');
  return {
    schema: 1,
    kind: 'legacy-normalization',
    source_base: sourceBase,
    historical_status_sha256: sha256(status),
    historical_merged_task_ids: mergedTaskIds(status),
  };
}

function verify(root) {
  root = rootOf(root);
  const errors = [];
  let marker, snapshot;
  try { marker = JSON.parse(read(root, MARKER)); } catch { errors.push('缺 vNext normalization marker'); return errors; }
  try { snapshot = read(root, SNAPSHOT); } catch { errors.push('缺 frozen historical status snapshot'); return errors; }
  if (!marker || marker.schema !== 1 || marker.kind !== 'legacy-normalization') errors.push('normalization marker schema 非法');
  if (!isSha(marker && marker.source_base)) errors.push('normalization source_base 非固定 commit SHA');
  else {
    try { git(root, ['cat-file', '-e', `${marker.source_base}^{commit}`]); }
    catch { errors.push('normalization source_base 不可解析'); }
    try { git(root, ['merge-base', '--is-ancestor', marker.source_base, 'HEAD']); }
    catch { errors.push('normalization source_base 不是当前 baseline 祖先'); }
  }
  if (!/^[a-f0-9]{64}$/.test(String(marker && marker.historical_status_sha256 || ''))
      || marker.historical_status_sha256 !== sha256(snapshot)) errors.push('historical status snapshot hash 不一致');
  const ids = mergedTaskIds(snapshot);
  if (!Array.isArray(marker && marker.historical_merged_task_ids)
      || JSON.stringify(marker.historical_merged_task_ids) !== JSON.stringify(ids)) errors.push('historical merged task inventory 不一致');
  for (const file of [MARKER, SNAPSHOT]) {
    try {
      const committed = git(root, ['show', `HEAD:${file}`]);
      if (committed !== read(root, file).replace(/\n$/, '')) errors.push(`normalization baseline 未冻结 ${file}`);
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

function main(argv) {
  let root = process.cwd(), sourceBase = '', writeMode = false, verifyMode = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') root = path.resolve(argv[++i] || '');
    else if (argv[i] === '--source-base') sourceBase = argv[++i] || '';
    else if (argv[i] === '--write') writeMode = true;
    else if (argv[i] === '--verify') verifyMode = true;
    else throw new Error('用法：normalize-legacy-project.cjs --verify [--root <project>]；或 --write --source-base <SHA> [--root <project>]');
  }
  if (writeMode === verifyMode) throw new Error('请选择且只选择 --write 或 --verify');
  if (verifyMode) {
    const errors = verify(root);
    if (errors.length) throw new Error(`项目尚未完成 vNext migration normalization：${errors.join('；')}`);
    console.log('✅ vNext legacy normalization baseline 已冻结且可验证');
  } else console.log(JSON.stringify(normalize(root, sourceBase), null, 2));
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(String(error.stderr || error.message).trim()); process.exitCode = 1; }
}
module.exports = { MARKER, SNAPSHOT, mergedTaskIds, recordFor, verify, normalize };
