'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('credential repository checks ignore caller Git selectors in direct calls and real worktree hooks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-conn-env-'));
  const env = { ...process.env };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE',
    'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_PREFIX']) delete env[key];
  const git = (cwd, args) => {
    const result = spawnSync('git', ['-C', cwd, ...args], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
  };
  try {
    const caller = path.join(root, 'caller'), worktree = path.join(root, 'worktree');
    fs.mkdirSync(caller); git(caller, ['init']);
    git(caller, ['config', 'user.email', 'fixture@example.test']);
    git(caller, ['config', 'user.name', 'fixture']);
    git(caller, ['commit', '--allow-empty', '-m', 'base']);
    git(caller, ['worktree', 'add', '-b', 'fixture', worktree]);
    fs.writeFileSync(path.join(worktree, 'connections.yml'), 'app:\n  token: ${secret:HACT_FIXTURE_TOKEN}\n');
    const safeHome = path.join(root, 'safe-home'), unsafeHome = path.join(root, 'unsafe-home');
    for (const home of [safeHome, unsafeHome]) {
      fs.mkdirSync(path.join(home, '.hact'), { recursive: true });
      fs.writeFileSync(path.join(home, '.hact', 'secrets.env'), 'HACT_FIXTURE_TOKEN=fixture-only\n', { mode: 0o600 });
    }
    git(unsafeHome, ['init']);
    const checker = path.resolve(__dirname, 'check-conn.js');
    const invoke = (home, gitDir) => spawnSync(process.execPath, [checker, 'check', worktree], {
      cwd: worktree, encoding: 'utf8',
      env: { ...env, HOME: home, USERPROFILE: home, GIT_DIR: gitDir,
        GIT_INDEX_FILE: path.join(worktree, 'fixture-index') },
    });
    const absoluteGitDir = git(worktree, ['rev-parse', '--absolute-git-dir']);
    const safe = invoke(safeHome, absoluteGitDir);
    assert.equal(safe.status, 0, safe.stdout + safe.stderr);
    assert.match(safe.stdout, /~\/\.hact 不在任何 git 工作树内/);
    for (const selector of [absoluteGitDir, '.git']) {
      const unsafe = invoke(unsafeHome, selector);
      assert.equal(unsafe.status, 1, unsafe.stdout + unsafe.stderr);
      assert.match(unsafe.stdout, /该文件位于 git 工作树/);
      assert.ok(unsafe.stdout.includes(unsafeHome.replace(/\\/g, '/')) || unsafe.stdout.includes(unsafeHome));
    }
    // Exercise Git's own exported hook environment, not just a hand-built env mock.
    const hooks = path.join(root, 'hooks'); fs.mkdirSync(hooks);
    const output = path.join(root, 'hook-output.txt');
    const quote = value => `'${value.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`;
    fs.writeFileSync(path.join(hooks, 'pre-commit'), `#!/bin/sh\n${quote(process.execPath)} ${quote(checker)} check ${quote(worktree)} > ${quote(output)} 2>&1\n`, { mode: 0o755 });
    git(caller, ['config', 'core.hooksPath', hooks]);
    for (const [home, expected] of [[safeHome, 0], [unsafeHome, 1]]) {
      const result = spawnSync('git', ['-C', worktree, 'commit', '--allow-empty', '-m', 'hook fixture'], {
        encoding: 'utf8', env: { ...env, HOME: home, USERPROFILE: home },
      });
      const log = fs.readFileSync(output, 'utf8');
      assert.equal(result.status, expected, result.stderr + log);
      assert.match(log, expected ? /该文件位于 git 工作树/ : /~\/\.hact 不在任何 git 工作树内/);
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
