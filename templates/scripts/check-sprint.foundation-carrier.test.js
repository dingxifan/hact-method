'use strict';
const assert = require('assert');
const cp = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('./check-b-task.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-foundation-carrier-'));
const id = 'foundation-follow-up';
const pkg = `docs/tasks/${id}.md`, reviews = `docs/code-reviews/${id}`;
const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const run = (script, ...args) => cp.spawnSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: root, encoding: 'utf8' });
const state = (source = 'foundation', iteration = 'null', status = 'merged', type = 'develop') => `tasks:\n  - id: ${id}\n    type: ${type}\n    source: ${source}\n    iteration: ${iteration}\n    status: ${status}\n`;
const audit = () => run('check-sprint.js', '--staged', root);
const expectFail = (result, pattern) => { assert.notStrictEqual(result.status, 0, result.stdout + result.stderr); assert.match(result.stdout + result.stderr, pattern); };
try {
  git(['init', '-q']); git(['config', 'user.name', 'Test']); git(['config', 'user.email', 'test@example.com']);
  write('status.yml', 'tasks: []\n');
  const packageText = `---\npackage-schema: 2\ntask-id: ${id}\nsource: foundation\nfiles:\n  - src/core.js\ndepends_on: []\n---\n`;
  write(pkg, packageText); write('src/core.js', 'module.exports = 1;\n');
  for (const file of ['check-sprint.js', 'check-gate.js']) fs.copyFileSync(path.join(__dirname, file), (fs.mkdirSync(path.join(root, 'scripts'), { recursive: true }), path.join(root, 'scripts', file)));
  git(['add', '.']); git(['commit', '-qm', 'base']);
  const base = git(['rev-parse', 'HEAD']), baseTree = git(['rev-parse', 'HEAD^{tree}']);
  // Registration and readiness need a canonical package, but not a completed review.
  write('status.yml', state('foundation', 'null', '可取')); git(['add', 'status.yml']);
  assert.strictEqual(audit().status, 0);
  assert.strictEqual(run('check-sprint.js', '--ready', id, root).status, 0);
  write('src/core.js', 'module.exports = 2;\n'); git(['add', 'src/core.js']);
  const head = git(['write-tree']);
  const bytes = cp.execFileSync('git', ['diff', '--binary', baseTree, head], { cwd: root });
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  write(`${reviews}/preflight.md`, `---\ntask_id: ${id}\ntiming: before-code\nresult: pass\nbase_ref: ${base}\nbase_tree: ${baseTree}\n---\n`);
  const round = `---\nschema: develop-review-round/v2\nreview_policy: bounded-v1\ntask_id: ${id}\nround: 1\nmode: full\nrisk: standard\nprior_report: null\ntarget_finding_ids: []\nbase_ref: ${base}\nreviewed_base: ${baseTree}\nreviewed_head: ${head}\ndiff_sha256: ${hash}\nchanged_files:\n  - src/core.js\n  - status.yml\nevidence_only: false\nevidence_files: []\nescalate_to_full: false\nconclusion: pass\n---\n\n\`\`\`yaml\nfindings: []\n\`\`\`\n`;
  write(`${reviews}/round-01.md`, round); write('status.yml', state()); git(['add', '.']);
  const generator = require('./build-review-anchor.js');
  assert.throws(() => generator.draft(root, { task: id, head }), /无开放阻断/, 'generator resolves the canonical completed review chain');
  let result = audit(); assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  result = run('check-gate.js', '--staged', root); assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  assert.ok(!fs.existsSync(path.join(root, 'iterations')), 'no iteration/G3 needed');
  fs.unlinkSync(path.join(root, pkg)); git(['add', pkg]); expectFail(audit(), /须唯一使用|找不到.*任务包/);
  write(pkg, packageText); git(['add', pkg]);
  fs.unlinkSync(path.join(root, reviews, 'round-01.md')); git(['add', reviews]); expectFail(audit(), /缺 round/);
  write(`${reviews}/round-01.md`, round.replace('conclusion: pass', 'conclusion: revise')); git(['add', reviews]); expectFail(audit(), /末轮.*pass/);
  write(`${reviews}/round-01.md`, round); git(['add', reviews]);
  fs.renameSync(path.join(root, reviews), path.join(root, 'saved-review')); git(['add', reviews]); expectFail(audit(), /唯一定位 review/);
  fs.renameSync(path.join(root, 'saved-review'), path.join(root, reviews)); git(['add', reviews]);
  write(`b-reviews/${id}/preflight.md`, 'duplicate\n'); git(['add', 'b-reviews']); expectFail(audit(), /唯一定位 review/);
  fs.unlinkSync(path.join(root, 'b-reviews', id, 'preflight.md')); git(['add', 'b-reviews']);
  fs.rmdirSync(path.join(root, 'b-reviews', id));
  for (const duplicate of [`b-queue/${id}.md`, `iterations/v0/queue/${id}.md`]) {
    write(duplicate, packageText); git(['add', duplicate]); expectFail(audit(), /同 id 任务包|须唯一使用/);
    fs.unlinkSync(path.join(root, duplicate)); git(['add', duplicate]);
  }
  fs.rmdirSync(path.join(root, 'iterations', 'v0', 'queue')); fs.rmdirSync(path.join(root, 'iterations', 'v0')); fs.rmdirSync(path.join(root, 'iterations'));
  // Unstaged and untracked root review inputs cannot back the staged state.
  write(`${reviews}/round-01.md`, round + '\nchanged\n'); expectFail(audit(), /未暂存变化/);
  write(`${reviews}/round-01.md`, round);
  write(`${reviews}/extra.md`, 'untracked\n'); expectFail(audit(), /未加入暂存区/); fs.unlinkSync(path.join(root, reviews, 'extra.md'));
  // Review-only staging is discovered even without a new merged status event.
  write('status.yml', state('foundation', 'null', 'taken-by')); git(['add', '.']); git(['commit', '-qm', 'review evidence']);
  for (const [source, type, iteration] of [['integration', 'develop', 'null'], ['foundation', 'revise-doc', 'null'], ['foundation', 'develop', 'v0']]) {
    write('status.yml', state(source, iteration, 'taken-by', type)); git(['add', 'status.yml']); expectFail(audit(), /docs\/tasks 仅支持/);
  }
  write('status.yml', state('foundation', 'null', 'taken-by')); git(['add', 'status.yml']);
  write(`${reviews}/round-01.md`, round.replace('task_id: ' + id, 'task_id: wrong')); git(['add', reviews]); expectFail(audit(), /task_id 不匹配/);
  write(`${reviews}/round-01.md`, round); write('status.yml', state()); git(['add', '.']);
  write('src/core.js', 'module.exports = 3;\n'); git(['add', 'src/core.js']); expectFail(audit(), /Accepted implementation binding/);
  write('src/core.js', 'module.exports = 2;\n'); git(['add', 'src/core.js']);
  fs.unlinkSync(path.join(root, 'src/core.js')); git(['add', 'src/core.js']);
  const deletionHead = git(['write-tree']);
  const deletionBytes = cp.execFileSync('git', ['diff', '--binary', baseTree, deletionHead], { cwd: root });
  const deletionFiles = git(['diff', '--name-only', baseTree, deletionHead]).split('\n');
  const deletionRound = round.replace(head, deletionHead).replace(hash, crypto.createHash('sha256').update(deletionBytes).digest('hex'))
    .replace('changed_files:\n  - src/core.js\n  - status.yml', 'changed_files:\n' + deletionFiles.map(file => '  - ' + file).join('\n'));
  write(`${reviews}/round-01.md`, deletionRound); git(['add', reviews]);
  result = audit(); assert.strictEqual(result.status, 0, 'reviewed deletion must pass: ' + result.stdout + result.stderr);
  write('src/core.js', 'module.exports = 2;\n'); git(['add', 'src/core.js']); expectFail(audit(), /Accepted implementation binding/);
  write(`${reviews}/round-01.md`, round); git(['add', reviews]);
  // docs is never a fallback for arbitrary null-iteration tasks or B tasks.
  for (const source of ['sprint', 'integration', 'manual-test', 'bug', 'optimization', 'other']) {
    write('status.yml', state(source)); git(['add', 'status.yml']); expectFail(audit(), /docs\/tasks 仅支持/);
  }
  write('status.yml', state('foundation', 'null', 'merged', 'revise-doc')); git(['add', 'status.yml']); expectFail(audit(), /docs\/tasks 仅支持/);
  write('status.yml', state('foundation', '')); git(['add', 'status.yml']); expectFail(audit(), /docs\/tasks 仅支持/);
  assert.ok(validate(path.join(root, pkg)).some(error => /source/.test(error)), 'B checker rejects foundation');
  // An iteration-bound foundation retains its iteration package/review routing.
  const iterPkg = `iterations/v0/queue/${id}.md`, iterReviews = `iterations/v0/code-reviews/${id}`;
  fs.renameSync(path.join(root, pkg), (fs.mkdirSync(path.dirname(path.join(root, iterPkg)), { recursive: true }), path.join(root, iterPkg)));
  fs.mkdirSync(path.dirname(path.join(root, iterReviews)), { recursive: true }); fs.renameSync(path.join(root, reviews), path.join(root, iterReviews));
  write('status.yml', state('foundation', 'v0', 'taken-by')); git(['add', '.']); git(['commit', '-qm', 'iteration-bound carrier']);
  write('status.yml', state('foundation', 'v0')); git(['add', 'status.yml']);
  result = run('check-gate.js', '--staged', root); assert.strictEqual(result.status, 0, result.stdout + result.stderr);
  console.log('foundation carrier: registration, merge, fixed review, binding, missing/duplicate/dirty inputs, restricted routing and V0 PASS');
} finally {
  if (!path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(root).startsWith('hact-foundation-carrier-')) throw new Error('unsafe temp cleanup');
  fs.rmSync(root, { recursive: true, force: true });
}
