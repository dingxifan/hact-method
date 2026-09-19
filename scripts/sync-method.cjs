#!/usr/bin/env node
'use strict';
// 默认只读；固定 Git 版本；只自动搬运已知模板，项目语义由迁移执行人处理。
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process');
const META = '_meta/method-sync.json', PENDING = '_meta/method-sync-pending', NOTE = '_meta/method-sync-review.md';
const normalize = value => value.toString('utf8').replace(/\r\n/g, '\n');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const blobHash = value => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(value) + '\0').update(value).digest('hex');
function git(root, args, options = {}) {
  return cp.execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024, ...options,
  }).trimEnd();
}
function rootOf(dir) { return fs.realpathSync(git(dir, ['rev-parse', '--show-toplevel'])); }
function commonOf(root) { return fs.realpathSync(git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir'])); }
function safePath(root, relative) {
  if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('非法相对路径：' + relative);
  const full = path.resolve(root, relative);
  if (!full.startsWith(path.resolve(root) + path.sep)) throw new Error('路径越界：' + relative);
  let probe = full;
  while (probe !== path.resolve(root)) {
    if (fs.existsSync(probe) && fs.lstatSync(probe).isSymbolicLink()) throw new Error('拒绝经过符号链接/junction：' + relative);
    probe = path.dirname(probe);
  }
  return full;
}
function read(root, file) {
  const full = safePath(root, file);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}
function write(root, file, content) {
  const full = safePath(root, file);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}
function parseTaskSnapshot(source) {
  const tasks = [];
  let inTasks = false, baseIndent = null, cur = null;
  const clean = value => (value || '').trim().replace(/^["']|["']$/g, '').replace(/^\[|\]$/g, '').trim();
  const flush = () => { if (cur) tasks.push(cur); cur = null; };
  for (const raw of String(source || '').split(/\r?\n/)) {
    const line = raw.replace(/\t/g, '  ');
    if (/^tasks:\s*(?:\[\])?\s*$/.test(line)) { inTasks = true; continue; }
    if (!inTasks) continue;
    if (/^\S/.test(line) && !/^-/.test(line)) { flush(); break; }
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const item = line.match(/^(\s*)-\s+(.*)$/);
    if (item) {
      const indent = item[1].length;
      if (baseIndent === null) baseIndent = indent;
      if (indent === baseIndent) {
        flush(); cur = {};
        const kv = item[2].match(/^([A-Za-z_-]+):\s*(.*)$/);
        if (kv) cur[kv[1]] = clean(kv[2]);
        continue;
      }
    }
    const kv = line.match(/^\s+([A-Za-z_-]+):\s*(.*)$/);
    if (kv && cur) cur[kv[1]] = clean(kv[2]);
  }
  flush();
  return tasks;
}
function mergedTaskIds(source) {
  return [...new Set(parseTaskSnapshot(source).filter(task => task.id && task.status === 'merged').map(task => task.id))].sort();
}
function validAdoptionRecord(value) {
  if (!value || value.schema !== 2 || !['legacy-project', 'new-project'].includes(value.kind)
      || !/^[a-f0-9]{40}$/.test(value.method_source || '')
      || !Array.isArray(value.legacy_accepted_tasks)
      || value.legacy_accepted_tasks.some(id => !/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(id))
      || new Set(value.legacy_accepted_tasks).size !== value.legacy_accepted_tasks.length) return false;
  if (value.kind === 'new-project') return value.source_base === null
    && value.accepted_truth_base === null && value.accepted_truth_status_sha256 === null && value.legacy_accepted_tasks.length === 0;
  return /^[a-f0-9]{40}$/.test(value.source_base || '')
    && (/^[a-f0-9]{40}$/.test(value.accepted_truth_base || '')
      || (value.accepted_truth_base === null && value.accepted_truth_status_sha256 === null && value.legacy_accepted_tasks.length === 0))
    && (value.accepted_truth_base === null || /^[a-f0-9]{64}$/.test(value.accepted_truth_status_sha256 || ''));
}
function adoptionErrors(root, adoption, projectBase, options = {}) {
  if (!validAdoptionRecord(adoption)) return ['adoption boundary 缺失或格式非法'];
  if (adoption.kind === 'new-project') return [];
  const errors = [];
  if (adoption.accepted_truth_base === null) {
    if (adoption.source_base !== projectBase) errors.push('adoption source_base 必须固定为迁移前项目 HEAD');
    return errors;
  }
  try { git(root, ['cat-file', '-e', adoption.accepted_truth_base + '^{commit}']); }
  catch { errors.push('accepted_truth_base 不是当前项目仓可解析的 commit'); return errors; }
  try { git(root, options.runtime ? ['merge-base', '--is-ancestor', adoption.accepted_truth_base, projectBase]
    : ['merge-base', '--is-ancestor', projectBase, adoption.accepted_truth_base]); }
  catch { errors.push(options.runtime ? 'accepted_truth_base 不是当前 HEAD 祖先' : 'accepted_truth_base 未建立在本次迁移基线之后'); }
  let status = '';
  try { status = git(root, ['show', adoption.accepted_truth_base + ':status.yml']); }
  catch { status = ''; }
  try { git(root, ['merge-base', '--is-ancestor', adoption.source_base, adoption.accepted_truth_base]); }
  catch { errors.push('source_base 不是 accepted_truth_base 的祖先'); }
  if (digest(status) !== adoption.accepted_truth_status_sha256) errors.push('accepted_truth_base 的 status.yml 与冻结快照 hash 不一致');
  const merged = new Set(mergedTaskIds(status));
  const notAccepted = adoption.legacy_accepted_tasks.filter(id => !merged.has(id));
  if (notAccepted.length)
    errors.push('legacy_accepted_tasks 含 adoption boundary 当时并未 merged 的任务：' + notAccepted.join(', '));
  if (!options.allowPending) {
    const commits = git(root, ['log', '--format=%H', '--reverse', 'HEAD', '--', META]).split('\n').filter(Boolean);
    const origin = commits.map(commit => {
      try { return JSON.parse(git(root, ['show', commit + ':' + META])); } catch { return null; }
    }).find(meta => meta?.adoption?.accepted_truth_base);
    if (!origin) errors.push('找不到已提交的 adoption boundary origin');
    else if (JSON.stringify(origin.adoption) !== JSON.stringify(adoption)) errors.push('adoption boundary 一经创建不得重写或扩张');
  }
  return errors;
}
function tracked(root) { return git(root, ['-c', 'core.quotepath=false', 'ls-files', '-z']).split('\0').filter(Boolean); }
function loadSource(methodRoot, ref) {
  methodRoot = rootOf(methodRoot);
  if (!ref || ref.startsWith('-')) throw new Error('非法 ref');
  const sha = git(methodRoot, ['rev-parse', '--verify', ref + '^{commit}']);
  const names = git(methodRoot, ['ls-tree', '-r', '--name-only', sha, '--', 'templates']).split('\n');
  const files = names.filter(name =>
    /^templates\/scripts\/[^/]+\.js$/.test(name) && !name.endsWith('.test.js') ||
    /^templates\/\.codex\/agents\/[^/]+\.toml$/.test(name) ||
    ['templates/AGENTS.md', 'templates/gitee-ops.md', 'templates/scripts/pre-commit-hook.sh'].includes(name));
  if (!files.includes('templates/AGENTS.md') || !files.includes('templates/scripts/check-gate.js')) throw new Error('不是可分发的 Codex 方法版本');
  const get = file => cp.execFileSync('git', ['-C', methodRoot, 'show', sha + ':' + file], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const known = new Map();
  for (const file of files) {
    const raw = git(methodRoot, ['log', '--format=', '--raw', '--no-abbrev', sha, '--', file]);
    known.set(file, new Set([...raw.matchAll(/^:\d+ \d+ ([a-f0-9]{40}) ([a-f0-9]{40}) /gm)].flatMap(m => [m[1], m[2]])));
  }
  return { root: methodRoot, ref, sha, files, get, known };
}
function inspectProject(root, source) {
  root = rootOf(root);
  if (commonOf(root) === commonOf(source.root)) throw new Error('不能向方法论仓本身分发');
  const base = git(root, ['rev-parse', 'HEAD']);
  const files = git(root, ['-c', 'core.quotepath=false', 'ls-tree', '-r', '--name-only', base]).split('\n').filter(Boolean);
  const atBase = file => files.includes(file) ? cp.execFileSync('git', ['-C', root, 'show', base + ':' + file], { encoding: 'utf8' }) : null;
  let adoption = null;
  const priorMeta = atBase(META);
  if (priorMeta) {
    let parsed;
    try { parsed = JSON.parse(priorMeta); } catch { throw new Error('已有 method-sync.json 不是合法 JSON，拒绝重建 adoption boundary'); }
    if (parsed.adoption) {
      if (!validAdoptionRecord(parsed.adoption)) throw new Error('已有 adoption boundary 非法，拒绝静默重建');
      adoption = parsed.adoption;
    }
  }
  if (!adoption) adoption = {
    schema: 2,
    kind: 'legacy-project',
    method_source: source.sha,
    source_base: base,
    accepted_truth_base: null,
    accepted_truth_status_sha256: null,
    legacy_accepted_tasks: [],
  };
  const operations = source.files.map(from => {
    const to = from.slice('templates/'.length), existing = atBase(to), incoming = source.get(from);
    const known = existing !== null && (source.known.get(from).has(blobHash(existing)) || source.known.get(from).has(blobHash(normalize(existing))));
    return { from, to, action: existing === null ? 'add' : normalize(existing) === normalize(incoming) ? 'same' : known ? 'update' : 'merge' };
  });
  return {
    root, source: source.sha, branch: git(root, ['branch', '--show-current']), base,
    dirty: git(root, ['status', '--porcelain=v1']),
    standards: files.filter(f => /^standards-(shared|frontend|backend)\.md$/.test(f)),
    entries: files.filter(f => /(^|\/)AGENTS(?:\.override)?\.md$/.test(f)), operations, adoption,
    retired: files.filter(f => /^scripts\/(?:review-profile|check-runtime-project|check-runtime-neutral|check-runtime-handoff|audit-standards-retention)(?:\..+)?\.js$/.test(f)),
  };
}
function instructions(source, inv) {
  const relative = path.relative(inv.root, source.root).replace(/\\/g, '/');
  return [
    '# 本仓方法论升级接续', '',
    '状态：准备中，不能宣布升级完成。方法版本 ' + source.ref + '@' + source.sha + '；项目基线 ' + inv.base + '。',
    '本文件只服务本次迁移，不加入日常启动。', '',
    '1. 只在本独立 worktree 工作。其他工作树的在制品不纳入本批，不改业务代码或生产数据，不推送/部署。',
    '2. 阅读 ' + relative + '/guide/07-同步方法论.md。所有迁移判断引用本仓原文、实际 Git 与用户既有确认。',
    '3. pending/files 下为未知自定义文件的新版候选。合并项目专属内容，不整体覆盖；处理完删除对应候选文件。AGENTS 保留项目说明、真实授权和验证入口，退役旧运行时/学科/notes 启动命令。',
    '4. Standards 逐项核有效约束：不变量归 foundation，技术选择/命令归 project，业务/接口归 PRD/TRD/design，任务禁区归 do-not，已有可执行限制留代码。不把三份全文搬进另一个规则库。核完才退役根部三文件，更新活跃包引用；历史报告/已完成包不改。',
    '5. status 与旧 Gate/队列/PR 实际状态对账，保留签署、完成事实、轮次与报告链，不补造批准；成本时间可缺。冲突不能猜，先问用户。旧 gates/sprint/b-tasks 可留历史，未来只写 status。',
    '6. 保留业务 lint/test/config、connections、全局 Codex 配置和私人仓。旧脚本先核消费者再退役，不盲删。',
    '7. 合并 tracked 门卫的新路由并保留自定义检查，核实际 hook/Husky 转发。不覆盖 .git/hooks、core.hooksPath 或未知 hook；本地安装调整须确认影响范围，不能影响活跃开发。',
    '8. 独立复核迁移语义与实际 diff，跑命中的检查、入口和 hook 真触发，记录未运行项；静态通过不等于业务回归通过。',
    '9. 在 ' + NOTE + ' 写约束去向、状态依据、保留配置/hook 与验证证据。--verify 通过后 --finish 生成本地提交并回收 worktree；立即快进原树须显式 --integrate（原树须干净且分支/基线未变）。不自动推送。',
    '', '## 本次需处理',
    ...inv.standards.map(f => '- 约束迁移：' + f),
    ...inv.operations.filter(op => op.action === 'merge').map(op => '- 自定义合并：' + op.to),
    ...inv.retired.map(f => '- 旧消费者核对：' + f),
    ...(inv.dirty ? ['- 原树有在制品，本树仅含已提交 HEAD；不得覆盖或自动集成回原树。'] : []), '',
  ].join('\n');
}
function prepare(root, source) {
  const inv = inspectProject(root, source);
  const branch = 'codex/method-sync-' + source.sha.slice(0, 12);
  const worktree = path.join(fs.realpathSync(path.dirname(inv.root)), path.basename(inv.root) + '-method-sync-' + source.sha.slice(0, 12));
  if (fs.existsSync(worktree)) {
    if (fs.lstatSync(worktree).isSymbolicLink()) throw new Error('同名路径为链接，拒绝恢复');
    const state = JSON.parse(read(worktree, META) || '{}');
    if (commonOf(worktree) !== commonOf(inv.root) || state.source !== source.sha || state.projectBase !== inv.base)
      throw new Error('已有同名目录或旧基线，拒绝覆盖：' + worktree);
    return { state: 'resume', worktree, branch, next: PENDING + '/TASK.md' };
  }
  try {
    git(inv.root, ['show-ref', '--verify', '--quiet', 'refs/heads/' + branch]);
    const state = read(inv.root, META);
    if (state && JSON.parse(state).source === source.sha && JSON.parse(state).state === 'verified')
      return { state: 'already-integrated', branch, source: source.sha };
    return { state: 'branch-exists', branch, message: '已有分发分支，先核是否已集成；不创建重复工作树' };
  } catch (e) { if (e.status !== 1) throw e; }
  git(inv.root, ['worktree', 'add', '-b', branch, worktree, inv.base]);
  try {
    const installed = {}, relative = path.relative(inv.root, source.root).replace(/\\/g, '/');
    const initial = { schema: 2, state: 'preparing', methodRoot: relative, methodRef: source.ref, source: source.sha,
      projectRoot: path.relative(worktree, inv.root).replace(/\\/g, '/'), projectBase: inv.base,
      projectBranch: inv.branch, syncBranch: branch, adoption: inv.adoption, files: installed };
    write(worktree, META, JSON.stringify(initial, null, 2) + '\n');
    write(worktree, PENDING + '/TASK.md', instructions(source, inv));
    for (const op of inv.operations) {
      let body = normalize(source.get(op.from));
      if (op.to === 'AGENTS.md') body = body.replaceAll('../hact-method-lab', relative)
        .replaceAll('{项目名}', path.basename(inv.root)).replace('{一句话描述项目用途}', '项目用途与技术选择见 project.md。');
      if (op.action === 'merge') write(worktree, PENDING + '/files/' + op.to, body);
      else if (op.action !== 'same') write(worktree, op.to, body);
      installed[op.to] = { source: digest(source.get(op.from)), action: op.action };
    }
    write(worktree, PENDING + '/TASK.md', instructions(source, inv));
    write(worktree, META, JSON.stringify({
      schema: 2, state: 'prepared', methodRoot: relative, methodRef: source.ref, source: source.sha,
      projectRoot: path.relative(worktree, inv.root).replace(/\\/g, '/'), projectBase: inv.base,
      projectBranch: inv.branch, syncBranch: branch, adoption: inv.adoption, files: installed,
    }, null, 2) + '\n');
    return { state: 'prepared', worktree, branch, source: source.sha, next: PENDING + '/TASK.md' };
  } catch (error) {
    let dirty = true;
    try { dirty = !!git(worktree, ['status', '--porcelain=v1']); } catch { /* 保留 */ }
    if (!dirty) git(inv.root, ['worktree', 'remove', worktree]);
    throw new Error(String(error.stderr || error.stdout || error.message).trim()
      + '\n准备未完成；路径/分支：' + worktree + ' / ' + branch
      + (dirty ? '。保留在制品，由当前执行人恢复。' : '。干净工作树已回收，分支保留。'));
  }
}
function verify(worktree, source) {
  worktree = rootOf(worktree);
  const state = JSON.parse(read(worktree, META) || '{}'), errors = [];
  if (state.schema !== 2 || state.source !== source.sha) return ['分发记录缺失或方法版本不一致'];
  if (git(worktree, ['branch', '--show-current']) !== state.syncBranch) errors.push('不在记录的分发分支');
  errors.push(...adoptionErrors(worktree, state.adoption, state.projectBase, { allowPending: true }));
  const pending = safePath(worktree, PENDING + '/files');
  if (fs.existsSync(pending) && fs.readdirSync(pending, { recursive: true }).some(f => fs.statSync(safePath(worktree, PENDING + '/files/' + f)).isFile()))
    errors.push('仍有待合并候选文件：' + PENDING + '/files');
  const names = tracked(worktree).filter(f => fs.existsSync(safePath(worktree, f)));
  for (const name of names.filter(f => /^standards-(shared|frontend|backend)\.md$/.test(f))) errors.push('尚未退役并迁移项目约束：' + name);
  for (const name of names.filter(f => /(^|\/)AGENTS(?:\.override)?\.md$/.test(f))) {
    if (/templates[/\\]runtime[/\\]|skills[/\\]adversarial-review|continuous-execution|CLAUDE\.md/.test(read(worktree, name)))
      errors.push('入口仍引用退役机制：' + name);
  }
  const override = read(worktree, 'AGENTS.override.md');
  if (override !== null && !override.includes('boot-protocol.md')) errors.push('AGENTS.override.md 遮蔽入口，须单独合并');
  if (git(source.root, ['rev-parse', 'HEAD']) !== source.sha ||
      git(source.root, ['status', '--porcelain=v1', '--', 'templates', 'specs-execution', 'specs-structural', 'skeleton', 'guide']))
    errors.push('方法论工作树不是固定版本或运行文件未提交，请在该版本干净检出中验证');
  else {
    try {
      const { parseGates, parseTasksSource } = require(path.join(source.root, 'templates/scripts/check-gate.js'));
      const status = read(worktree, 'status.yml');
      if (status === null) throw new Error('status.yml 缺失');
      parseGates(status);
      const tasks = parseTasksSource(status);
      if (tasks === null) throw new Error('tasks 段不能按最终模板解析');
      for (const task of tasks.filter(t => t.status !== 'merged' && (t.type === 'develop' ||
          ['sprint', 'integration', 'manual-test', 'bug', 'optimization', 'foundation'].includes(t.source)))) {
        const file = ['bug', 'optimization'].includes(task.source) ? 'b-queue/' + task.id + '.md'
          : 'iterations/' + task.iteration + '/queue/' + task.id + '.md';
        if (task.source === 'foundation') continue;
        const body = read(worktree, file);
        if (body === null) { errors.push('活跃开发任务缺任务包：' + file); continue; }
        const core = body.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/m)?.[1] || body;
        if (/standards-(shared|frontend|backend)\.md|relevant-standards:/.test(core)) errors.push('活跃包仍引用退役规则：' + file);
      }
      for (const from of source.files.filter(f => /^templates\/scripts\/.*\.js$/.test(f))) {
        const file = from.slice(10), body = read(worktree, file);
        if (body === null) { errors.push('缺检查脚本：' + file); continue; }
        if (normalize(body) !== normalize(source.get(from))) errors.push('检查器尚未与固定方法版本一致：' + file + '；项目额外检查须独立保留接线，不修改核心副本');
        try { cp.execFileSync(process.execPath, ['--check', safePath(worktree, file)], { stdio: 'pipe' }); }
        catch { errors.push('语法错误：' + file); }
      }
      errors.push(...require(path.join(source.root, 'templates/scripts/check-codex-project.js')).validate(worktree));
      const hook = require(path.join(source.root, 'templates/scripts/check-hook-state.js')).inspect(worktree, null);
      if (hook.state !== 'available') errors.push('实际 hook 未确认接通：' + hook.signals.join(', '));
      if (!(read(worktree, 'scripts/pre-commit-hook.sh') || '').split(/\r?\n/).some(line => !/^\s*#/.test(line) && /check-gate\.js\s+--staged/.test(line))) errors.push('tracked hook 缺 status-only 签署路由');
    } catch (e) { errors.push('结构校验失败：' + e.message); }
  }
  if (!(read(worktree, NOTE) || '').trim()) errors.push('缺迁移复核记录：' + NOTE);
  return errors;
}
function finish(worktree, source, integrate = false) {
  worktree = rootOf(worktree);
  const errors = verify(worktree, source);
  if (errors.length) throw new Error(errors.join('\n'));
  let state = JSON.parse(read(worktree, META));
  const project = rootOf(path.resolve(worktree, state.projectRoot));
  if (project === worktree || commonOf(project) !== commonOf(worktree)) throw new Error('目标不是同仓独立原工作树');
  if (integrate && (git(project, ['status', '--porcelain=v1']) || git(project, ['rev-parse', 'HEAD']) !== state.projectBase ||
      git(project, ['branch', '--show-current']) !== state.projectBranch)) throw new Error('原工作树已有在制品或基线/分支变化，不自动集成');
  const changed = [...new Set([...git(worktree, ['-c', 'core.quotepath=false', 'diff', '--name-only', state.projectBase]).split('\n'),
    ...git(worktree, ['-c', 'core.quotepath=false', 'ls-files', '--others', '--exclude-standard']).split('\n')].filter(Boolean))];
  const allowed = f => /^(AGENTS(?:\.override)?\.md|CLAUDE\.md|gitee-ops\.md|project\.md|foundation\.md|design\.md|status\.yml|decisions\.md|standards-(shared|frontend|backend)\.md)$/.test(f)
    || /^(_meta\/(?:method-sync\.json$|method-sync-review\.md$|method-sync-pending\/)|\.codex\/agents\/|\.husky\/|scripts\/|iterations\/[^/]+\/(?:queue\/|prd\.md$|trd\.md$)|b-queue\/|status-reviews\/)/.test(f);
  if (changed.some(f => !allowed(f))) throw new Error('分发夹带范围外文件：' + changed.filter(f => !allowed(f)).join(', '));
  // 先把迁移对账后的 status 作为独立 Git truth 落盘，再写 adoption record。
  // 这使 source base、reconciled truth 与 adoption commit 成为三个不可混淆的阶段。
  if (state.adoption?.kind === 'legacy-project' && state.adoption.accepted_truth_base === null) {
    git(worktree, ['add', '-A']);
    git(worktree, ['diff', '--cached', '--check']);
    git(worktree, ['commit', '-m', 'chore(method): reconcile adoption truth']);
    const truthBase = git(worktree, ['rev-parse', 'HEAD']);
    const truthStatus = git(worktree, ['show', truthBase + ':status.yml']);
    state = { ...state, adoption: { ...state.adoption, accepted_truth_base: truthBase,
      accepted_truth_status_sha256: digest(truthStatus), legacy_accepted_tasks: mergedTaskIds(truthStatus) } };
    write(worktree, META, JSON.stringify(state, null, 2) + '\n');
  }
  if (!(state.state === 'verified' && !git(worktree, ['status', '--porcelain=v1']) && git(worktree, ['rev-parse', 'HEAD']) !== state.projectBase)) {
    write(worktree, META, JSON.stringify({ ...state, state: 'verified' }, null, 2) + '\n');
    // changed 已在上方完成允许写集校验；统一刷新整个隔离升级树的 index，既登记新增/修改，
    // 也兼容调用方为跑真实 hook 而预先 stage 过的删除。对已从 index 移除的路径再次执行
    // `git add -- <deleted-path>` 会报 pathspec 不存在，导致 verified 状态无法收尾。
    git(worktree, ['add', '-A']);
    git(worktree, ['diff', '--cached', '--check']);
    git(worktree, ['commit', '-m', 'chore(method): sync ' + state.methodRef + '@' + state.source.slice(0, 12)]);
  }
  const commit = git(worktree, ['rev-parse', 'HEAD']);
  if (git(worktree, ['status', '--porcelain=v1'])) throw new Error('提交后仍有在制品，保留 worktree：' + worktree);
  let integrationError = null;
  if (integrate) {
    try {
      if (git(project, ['status', '--porcelain=v1']) || git(project, ['rev-parse', 'HEAD']) !== state.projectBase ||
          git(project, ['branch', '--show-current']) !== state.projectBranch) throw new Error('集成前原树已变化，保留分支待人工处理');
      git(project, ['merge', '--ff-only', state.syncBranch]);
    } catch (e) { integrationError = String(e.stderr || e.message); }
  }
  if (process.cwd() === worktree || process.cwd().startsWith(worktree + path.sep)) process.chdir(project);
  git(project, ['worktree', 'remove', worktree]);
  const registered = git(project, ['worktree', 'list', '--porcelain', '-z']).split('\0')
    .filter(line => line.startsWith('worktree ')).map(line => path.resolve(line.slice(9)));
  if (fs.existsSync(worktree) || registered.includes(path.resolve(worktree)))
    throw new Error('worktree 回收未完成：' + worktree);
  return { state: integrationError ? 'integration-failed' : integrate ? 'integrated' : 'committed',
    branch: state.syncBranch, commit, worktreeRemoved: true, pushed: false, integrationError };
}
// Daily use reuses the installed SHA; it never follows the method checkout's HEAD.
function adoptedSource(root) {
  root = rootOf(root);
  const state = JSON.parse(read(root, META) || '{}');
  if (state.state !== 'verified' || !/^[a-f0-9]{40}$/.test(state.source || '') || !state.methodRoot)
    throw new Error('方法论版本漂移：缺已完成的 method-sync 固定来源；沿用获准旧版或先完成同步，不能混用当前分支。');
  const method = path.resolve(root, state.methodRoot);
  git(method, ['cat-file', '-e', state.source + '^{commit}']);
  return { root, method, sha: state.source };
}
function runtimeCheck(root) {
  const source = adoptedSource(root), errors = [];
  const state = JSON.parse(read(source.root, META) || '{}');
  if (state.schema === 2) errors.push(...adoptionErrors(source.root, state.adoption, git(source.root, ['rev-parse', 'HEAD']), { runtime: true }));
  const files = git(source.method, ['ls-tree', '-r', '--name-only', source.sha, '--', 'templates/scripts']).split('\n')
    .filter(f => /\.js$/.test(f) && !f.endsWith('.test.js'));
  for (const from of files) {
    const local = read(source.root, from.slice('templates/'.length));
    const pinned = git(source.method, ['show', source.sha + ':' + from]);
    if (local === null || normalize(local).trimEnd() !== normalize(pinned).trimEnd())
      errors.push('方法论版本漂移：' + from.slice(10) + ' 不匹配已采用 SHA；先同步，不按任务证据失败处理');
  }
  if (!errors.length) {
    const hook = require(path.join(source.root, 'scripts/check-hook-state.js')).inspect(source.root, null);
    if (hook.state !== 'available') errors.push('方法论 hook 未接通：' + hook.signals.join(', '));
  }
  return { source: source.sha, methodRoot: path.relative(source.root, source.method).replace(/\\/g, '/'), errors };
}
function readAdopted(root, file) {
  const source = adoptedSource(root);
  if (!/^(specs-execution|specs-structural|skeleton|guide|templates)\/[A-Za-z0-9_./\-\u0080-\uffff]+\.md$/.test(file || '')
      || file.split('/').includes('..')) throw new Error('只允许读取固定方法版本内的规范 Markdown 路径');
  return git(source.method, ['show', source.sha + ':' + file]) + '\n';
}
function main(argv) {
  if (argv.includes('--help')) {
    console.log('默认 --check 只读；--prepare/--verify/--finish 完成既有隔离同步，--integrate 可选快进；日常 --runtime-check 核已采用版本，--read <规范路径> 读取该 SHA 原文。详见 guide/07-同步方法论.md'); return;
  }
  let action = 'check', root = process.cwd(), method = path.resolve(__dirname, '..'), ref = 'codex/context-reduction', integrate = false, file;
  for (let i = 0; i < argv.length; i++) {
    if (['--check', '--prepare', '--verify', '--finish', '--runtime-check'].includes(argv[i])) action = argv[i].slice(2);
    else if (argv[i] === '--read') { action = 'read'; file = argv[++i]; }
    else if (argv[i] === '--root') root = path.resolve(argv[++i] || '');
    else if (argv[i] === '--method-root') method = path.resolve(argv[++i] || '');
    else if (argv[i] === '--ref') ref = argv[++i] || '';
    else if (argv[i] === '--integrate') integrate = true;
    else throw new Error('用法：node sync-method.cjs [--check|--prepare|--verify|--finish] [--root 仓库] [--ref 方法分支或SHA] [--integrate]');
  }
  if (integrate && action !== 'finish') throw new Error('--integrate 只能与 --finish 一起使用');
  if (action === 'read') { process.stdout.write(readAdopted(root, file)); return; }
  if (action === 'runtime-check') {
    const result = runtimeCheck(root);
    console.log(JSON.stringify(result, null, 2));
    if (result.errors.length) process.exitCode = 1;
    return;
  }
  const source = loadSource(method, ref);
  const result = action === 'prepare' ? prepare(root, source) : action === 'verify' ? { errors: verify(root, source) }
    : action === 'finish' ? finish(root, source, integrate) : inspectProject(root, source);
  console.log(JSON.stringify(result, null, 2));
  if (result.errors?.length || result.integrationError) process.exitCode = 1;
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (e) { console.error(String(e.stderr || e.stdout || e.message).trim()); process.exitCode = 1; }
}
module.exports = { loadSource, inspectProject, prepare, verify, finish, safePath, main, runtimeCheck, readAdopted };
