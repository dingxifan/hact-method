'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function slash(value) { return String(value || '').replace(/\\/g, '/').replace(/^\.\//, ''); }

function git(root, args, options = {}) {
  return cp.execFileSync('git', args, {
    cwd: root,
    encoding: options.buffer ? undefined : 'utf8',
    stdio: ['ignore', 'pipe', options.quiet ? 'ignore' : 'pipe']
  });
}

function lexicalPath(root, relative) {
  const rel = slash(relative);
  if (!rel || path.isAbsolute(rel) || rel.split('/').includes('..')) throw new Error(`unsafe path: ${relative}`);
  const absolute = path.resolve(root, ...rel.split('/'));
  const base = path.resolve(root);
  if (absolute !== base && !absolute.startsWith(base + path.sep)) throw new Error(`path escapes project: ${relative}`);
  return { rel, absolute, base };
}

function assertRealpathContained(root, relative) {
  const resolved = lexicalPath(root, relative);
  if (!fs.existsSync(resolved.absolute)) return resolved;
  const baseReal = fs.realpathSync.native(resolved.base);
  const targetReal = fs.realpathSync.native(resolved.absolute);
  if (targetReal !== baseReal && !targetReal.startsWith(baseReal + path.sep))
    throw new Error(`realpath escapes project: ${relative}`);
  let current = resolved.base;
  for (const part of resolved.rel.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`symlink is not allowed: ${relative}`);
  }
  return resolved;
}

class GitTruthReader {
  constructor(root, mode = 'head') {
    this.root = path.resolve(root);
    if (!['head', 'index', 'worktree'].includes(mode)) throw new Error(`invalid Git truth mode: ${mode}`);
    this.mode = mode;
    this.readPaths = new Set();
  }

  read(relative) {
    const { rel, absolute } = assertRealpathContained(this.root, relative);
    this.readPaths.add(rel);
    if (this.mode === 'worktree') {
      if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`file missing from worktree: ${rel}`);
      return fs.readFileSync(absolute, 'utf8');
    }
    this.assertRegularBlob(rel);
    const spec = this.mode === 'index' ? `:${rel}` : `HEAD:${rel}`;
    try { return git(this.root, ['show', spec], { quiet: true }).toString(); }
    catch { throw new Error(`file missing from ${this.mode === 'index' ? 'Git index' : 'HEAD'}: ${rel}`); }
  }

  exists(relative) {
    try { this.read(relative); return true; } catch { return false; }
  }

  list(prefix) {
    const { rel, absolute } = lexicalPath(this.root, prefix);
    if (this.mode === 'worktree') {
      if (!fs.existsSync(absolute)) return [];
      const out = [];
      const walk = (dir, baseRel) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const childRel = `${baseRel}/${entry.name}`;
          assertRealpathContained(this.root, childRel);
          if (entry.isDirectory()) walk(path.join(dir, entry.name), childRel);
          else if (entry.isFile()) out.push(slash(childRel));
          else throw new Error(`unsupported filesystem entry: ${childRel}`);
        }
      };
      if (fs.statSync(absolute).isFile()) return [rel];
      walk(absolute, rel);
      return out.sort();
    }
    const args = this.mode === 'index'
      ? ['ls-files', '--cached', '--', rel]
      : ['ls-tree', '-r', '--name-only', 'HEAD', '--', rel];
    try { return git(this.root, args, { quiet: true }).toString().split(/\r?\n/).map(slash).filter(Boolean).sort(); }
    catch { return []; }
  }

  assertRegularBlob(relative) {
    const { rel } = lexicalPath(this.root, relative);
    if (this.mode === 'worktree') return assertRealpathContained(this.root, rel);
    let output = '';
    try {
      output = this.mode === 'index'
        ? git(this.root, ['ls-files', '-s', '--', rel], { quiet: true }).toString().trim()
        : git(this.root, ['ls-tree', 'HEAD', '--', rel], { quiet: true }).toString().trim();
    } catch { /* handled below */ }
    const line = output.split(/\r?\n/).find(item => item.replace(/\t/g, ' ').endsWith(` ${rel}`));
    if (!line) throw new Error(`file missing from ${this.mode === 'index' ? 'Git index' : 'HEAD'}: ${rel}`);
    const mode = line.trim().split(/\s+/)[0];
    if (!['100644', '100755'].includes(mode)) throw new Error(`authoritative artifact must be a regular Git blob, got mode ${mode}: ${rel}`);
    assertRealpathContained(this.root, rel);
    return rel;
  }

  assertClean(prefixes) {
    if (this.mode !== 'head') return;
    const args = ['status', '--porcelain=v1', '--untracked-files=all', '--', ...prefixes.map(slash)];
    const dirty = git(this.root, args).toString().trim();
    if (dirty) throw new Error(`authoritative artifacts differ from committed HEAD: ${dirty.replace(/\r?\n/g, ', ')}`);
  }

  assertReadPathsClean() {
    if (this.mode !== 'head' || !this.readPaths.size) return;
    this.assertClean([...this.readPaths]);
  }
}

module.exports = { GitTruthReader, lexicalPath, assertRealpathContained, slash, git };
