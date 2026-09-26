#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('./check-codex-project.js');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-codex-project-'));
function write(p,s) { const target=path.join(root,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,s); }
try {
  assert.ok(validate(root).length >= 6);
  const templates=path.resolve(__dirname,'..');
  for(const file of ['AGENTS.md','gitee-ops.md','.codex/agents/researcher.toml','.codex/agents/worker.toml',
    '.codex/agents/reviewer.toml','.codex/agents/sensitive_reviewer.toml']) write(file,fs.readFileSync(path.join(templates,file),'utf8'));
  assert.deepStrictEqual(validate(root), [], '单 Codex 项目无 CC 文件或固定模型也能通过');
  const rel='.codex/agents/reviewer.toml', source=fs.readFileSync(path.join(root,rel),'utf8');
  write(rel,source+'\nmodel = "x"\nmodel = "y"\nmodel_reasoning_effort = "banana"\n');
  assert.deepStrictEqual(validate(root), [], '模型和 reasoning 配置不属于 HACT Method validation');
  write(rel,source.replace(/^description[^\r\n]*(?:\r?\n|$)/m,''));
  assert.ok(validate(root).some(e=>/description/.test(e)));
  write(rel,source.replace('hact-reviewer','other'));
  assert.ok(validate(root).some(e=>/name 应为/.test(e)));
  write(rel,source);
  fs.rmSync(path.join(root,'gitee-ops.md'));
  assert.ok(validate(root).some(e=>/gitee-ops.md/.test(e)), '托管说明仍须可寻址');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
const boot=fs.readFileSync(path.resolve(__dirname,'../boot-protocol.md'),'utf8');
const expected=require('../../_meta/fixtures/codex-boot.json').cases;
const routes=new Map(boot.split(/\r?\n/).map(line=>line.match(/^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`/)).filter(Boolean).map(m=>[m[1].replace(/\s+/g,''),m[2]]));
assert.ok(!/^\| canonical task \| Task Contract \| legacy alias/m.test(boot), 'boot catalog stays canonical two-column');
assert.doesNotMatch(boot, /draft-prd-vN|generate-integration-tests/, '旧 task alias 已退役');
assert.match(boot, /integration-verify[\s\S]*check-system-review\.js/);
for(const row of expected) assert.strictEqual(routes.get(row.signal),row.expected,'任务状态路由 '+row.signal);
console.log('✅ Codex 初始化与角色配置正反例通过');
