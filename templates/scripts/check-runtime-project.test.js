#!/usr/bin/env node
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { validate } = require('./check-runtime-project.js');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hact-runtime-project-'));
assert.ok(validate(root, 'both').length >= 7, '空项目必须报告双运行时缺口');
function write(relative, source = 'configured\n') {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}
write('CLAUDE.md', 'runtime/cc.md\nboot-protocol.md\nruntime/preflight.md\n');
write('.claude/commands/gitee-ops.md', '# Gitee\nInvoke-RestMethod\nnode scripts/check-conn.js\n');
write('AGENTS.md', 'runtime/codex.md\nboot-protocol.md\nruntime/preflight.md\n');
const templatesRoot = path.resolve(__dirname, '..');
for (const name of ['researcher.toml', 'worker.toml', 'reviewer.toml', 'sensitive_reviewer.toml']) {
  const source = fs.readFileSync(path.join(templatesRoot, '.codex', 'agents', name), 'utf8');
  write(`.codex/agents/${name}`, source);
}
assert.deepStrictEqual(validate(root, 'both'), [], '双运行时文件齐备应通过');
write('.codex/agents/reviewer.toml', 'configured\n');
assert.ok(validate(root, 'codex').some(error => /reviewer\.toml: name/.test(error)), '伪 TOML 不得判齐备');
write('.codex/agents/reviewer.toml', `name = "hact-reviewer"
description = "x"
model = "made-up"
model_reasoning_effort = "banana"
sandbox_mode = "root"
developer_instructions = """
x
"""
`);
const invalidValues = validate(root, 'codex');
assert.ok(invalidValues.some(error => /未批准的 model/.test(error)), '非法 model 必须失败');
assert.ok(invalidValues.some(error => /未批准的 effort/.test(error)), '非法 effort 必须失败');
assert.ok(invalidValues.some(error => /未批准的 sandbox/.test(error)), '非法 sandbox 必须失败');
const validReviewer = fs.readFileSync(path.join(templatesRoot, '.codex', 'agents', 'reviewer.toml'), 'utf8');
write('.codex/agents/reviewer.toml', validReviewer.replace(/^description\s*=.*\r?\n/m, ''));
assert.ok(validate(root, 'codex').some(error => /description 应且仅应出现一次/.test(error)),
  '缺 description 必须失败');
fs.rmSync(path.join(root, '.codex', 'agents', 'reviewer.toml'));
assert.deepStrictEqual(validate(root, 'cc'), [], '只核 CC 时不要求 Codex agents');
assert.ok(validate(root, 'codex').some(error => /reviewer\.toml/.test(error)), 'Codex 缺 agent 必须报告');
fs.rmSync(root, { recursive: true, force: true });
console.log('✅ check-runtime-project 正反夹具通过');
