#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const checker = path.join(__dirname, 'check-sprint.js');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-staged-scope-'));
let count = 0;
const oldId = 'demo-v2-001', newId = 'demo-v2-002';
const packagePath = id => `iterations/v2/queue/${id}.md`;
const prd = '## 核心功能\n### 功能：演示\n- AC-01：已有行为\n  - oracle：成功\n- AC-99：历史未覆盖\n  - oracle：历史预期\n';
function pkg(id, options = {}) {
  return ['---', ...(options.legacy ? [] : ['package-schema: 2', 'module: demo']),
    `task-id: ${id}`, 'sprint_id: v2-s1', 'layers: [backend]', 'source: manual-test',
    'task_type: dev-backend', 'contract-impact: governed', 'urgency: normal', 'risk: standard',
    'title: 演示', 'description: 验证提交检查范围', `depends_on: [${options.dep || ''}]`,
    `files: [src/${options.file || id}.js]`, 'asset-writes: []', 'supersedes: []',
    'ac-format: intent-oracle-v1', 'acceptance-criteria:',
    `  - (源：PRD ${options.ac || 'AC-01'}) intent: 正常运行 oracle: 返回结果`,
    'reference:', '  - iterations/v2/trd.md § 演示', 'context: 当前任务',
    'known-risks: []', 'do-not: []', 'escalate-if: []', '---', ''].join('\n');
}
function state(ids, oldStatus = '可取') {
  return 'tasks:\n' + ids.map(id => `  - id: ${id}\n    type: develop\n    source: manual-test\n    iteration: v2\n    layer: backend\n    status: ${id === oldId ? oldStatus : '可取'}\n    depends_on: []\n`).join('');
}
function sprint(ids) { return '| task-id | title |\n| --- | --- |\n' + ids.map(id => `| ${id} | 演示 |\n`).join(''); }
function scenario(name, action, options = {}) {
  const root = path.join(temp, String(++count));
  fs.mkdirSync(root);
  const git = args => cp.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const write = (file, text) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); };
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const run = (mode = '--staged') => cp.spawnSync(process.execPath, [checker, mode, root], { cwd: root, encoding: 'utf8' });
  const expect = (status, pattern, mode) => {
    const result = run(mode);
    assert.strictEqual(result.status, status, `${name}\n${result.stdout}\n${result.stderr}`);
    if (pattern) assert.match(result.stdout + result.stderr, pattern, name);
    return result;
  };
  git(['init', '-q']); git(['config', 'user.email', 'test@example.com']); git(['config', 'user.name', 'Test']);
  write(packagePath(oldId), pkg(oldId, { legacy: !options.currentOld }));
  write('status.yml', state([oldId])); write('iterations/v2/sprint.md', sprint([oldId]));
  write('iterations/v2/prd.md', prd); write('iterations/v2/trd.md', '## 演示\n');
  git(['add', '.']); git(['commit', '-qm', 'baseline']);
  const addNew = (settings = {}) => {
    write(packagePath(newId), pkg(newId, settings));
    write('status.yml', state([oldId, newId])); write('iterations/v2/sprint.md', sprint([oldId, newId]));
    git(['add', '.']);
  };
  action({ root, git, write, read, expect, addNew });
}
try {
  scenario('unchanged legacy is outside schema scope, full planning remains strict', ({ addNew, expect }) => {
    addNew(); expect(0); expect(1, /任务包 schema/, 'v2');
  });
  scenario('new legacy package rejected', ({ addNew, expect }) => { addNew({ legacy: true }); expect(1, /任务包 schema/); });
  scenario('modified legacy package rejected', ({ write, git, expect }) => {
    write(packagePath(oldId), pkg(oldId, { legacy: true }) + '本次改动\n'); git(['add', '.']); expect(1, /任务包 schema/);
  });
  scenario('status-only activation selects legacy schema', ({ write, git, expect }) => {
    write('status.yml', state([oldId], 'taken-by')); git(['add', '.']); expect(1, /任务包 schema/);
  });
  scenario('status merged cannot avoid schema or review', ({ write, git, expect }) => {
    write('status.yml', state([oldId], 'merged')); git(['add', '.']);
    const result = expect(1, /任务包 schema/); assert.match(result.stdout, /review chain/);
  });
  scenario('status identity changes select legacy schema', ({ write, git, read, expect }) => {
    write('status.yml', read('status.yml').replace('layer: backend', 'layer: frontend')); git(['add', '.']); expect(1, /任务包 schema/);
  });
  scenario('new package cannot reference absent AC with unchanged PRD', ({ addNew, expect }) => {
    addNew({ ac: 'AC-404' }); expect(1, /AC 正向:悬空/);
  });
  scenario('added PRD AC needs coverage', ({ addNew, write, git, expect }) => {
    addNew(); write('iterations/v2/prd.md', prd + '- AC-02：新增行为\n'); git(['add', '.']); expect(1, /PRD AC 未被任何任务包引用：AC-02/);
  });
  scenario('PRD-only revision keeps document-first routing', ({ write, git, expect }) => {
    write('iterations/v2/prd.md', prd + '- AC-02：等待后续规划\n'); git(['add', '.']); expect(0);
  });
  scenario('changed multiline AC needs coverage', ({ addNew, write, git, expect }) => {
    addNew(); write('iterations/v2/prd.md', prd.replace('oracle：历史预期', 'oracle：新增预期')); git(['add', '.']); expect(1, /PRD AC 未被任何任务包引用：AC-99/);
  });
  scenario('changed covered AC passes without recertifying unchanged legacy package', ({ addNew, write, git, expect }) => {
    addNew(); write('iterations/v2/prd.md', prd.replace('oracle：成功', 'oracle：新的成功条件')); git(['add', '.']); expect(0);
  });
  scenario('AC deletion rejects references in unchanged packages', ({ addNew, write, git, expect }) => {
    addNew({ ac: 'AC-99' }); write('iterations/v2/prd.md', prd.replace('- AC-01：已有行为\n  - oracle：成功\n', '')); git(['add', '.']); expect(1, /本次 PRD 变更中被移除/);
  });
  scenario('removing last package coverage cannot create a gap', ({ write, git, expect }) => {
    write(packagePath(oldId), pkg(oldId, { ac: 'AC-99' })); git(['add', '.']); expect(1, /PRD AC 未被任何任务包引用：AC-01/);
  }, { currentOld: true });
  scenario('shared assets still inspect unchanged current packages', ({ addNew, expect }) => {
    addNew({ file: oldId }); expect(1, /共享写集冲突/);
  }, { currentOld: true });
  scenario('dependency path still serializes shared assets', ({ addNew, expect }) => {
    addNew({ file: oldId, dep: oldId }); expect(0);
  }, { currentOld: true });
  scenario('unstaged package cannot back staged content', ({ addNew, write, expect }) => {
    addNew(); write(packagePath(newId), pkg(newId, { legacy: true })); expect(2, /未暂存变化/);
  });
  scenario('unstaged historical input also rejected', ({ addNew, write, expect }) => {
    addNew(); write(packagePath(oldId), pkg(oldId)); expect(2, /未暂存变化/);
  });
  scenario('untracked queue package cannot back staged coverage', ({ addNew, write, expect }) => {
    addNew(); write(packagePath('demo-v2-003'), pkg('demo-v2-003', { ac: 'AC-99' })); expect(2, /未加入暂存区/);
  });
  scenario('duplicate identity still rejected globally', ({ addNew, write, read, git, expect }) => {
    addNew(); write('status.yml', read('status.yml') + `  - id: ${oldId}\n    source: manual-test\n    iteration: v2\n`); git(['add', '.']); expect(1, /重复 task id/);
  });
  scenario('queue sprint registration stays global', ({ addNew, write, git, expect }) => {
    addNew(); write('iterations/v2/sprint.md', sprint([newId])); git(['add', '.']); expect(1, /queue 有但 sprint.md 无/);
  });
  console.log(`✅ staged scope ${count} 个 Git 正反夹具通过`);
} finally {
  if (!path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep)) throw new Error('temp escaped');
  fs.rmSync(temp, { recursive: true, force: true });
}
