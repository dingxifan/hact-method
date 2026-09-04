#!/usr/bin/env node
'use strict';
// 只读诊断项目仓的运行时入口与配置是否齐备；不安装、不覆盖。
const fs = require('fs');
const path = require('path');

const CODEX_AGENTS = ['researcher.toml', 'worker.toml', 'reviewer.toml', 'sensitive_reviewer.toml'];
const AGENT_KEYS = ['name', 'description', 'model', 'model_reasoning_effort', 'sandbox_mode', 'developer_instructions'];
const EXPECTED_NAMES = {
  'researcher.toml': 'hact-researcher',
  'worker.toml': 'hact-worker',
  'reviewer.toml': 'hact-reviewer',
  'sensitive_reviewer.toml': 'hact-sensitive-reviewer',
};
const ALLOWED_MODELS = new Set(['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol']);
const ALLOWED_EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
const ALLOWED_SANDBOXES = new Set(['read-only', 'workspace-write']);

function checkFile(root, relative, tokens, errors) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    errors.push(`${relative}: missing`);
    return;
  }
  const source = fs.readFileSync(absolute, 'utf8');
  for (const token of tokens) if (!source.includes(token)) errors.push(`${relative}: missing reference ${token}`);
}

function checkAgent(root, relative, errors) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
    errors.push(`${relative}: missing`);
    return;
  }
  const source = fs.readFileSync(absolute, 'utf8');
  const values = {};
  for (const key of AGENT_KEYS.filter(key => key !== 'developer_instructions')) {
    const matches = [...source.matchAll(new RegExp(`^${key}\\s*=\\s*"([^"]+)"\\s*$`, 'gmu'))];
    if (matches.length !== 1) errors.push(`${relative}: ${key} 应且仅应出现一次`);
    else values[key] = matches[0][1];
  }
  const instructionBlocks = [...source.matchAll(/^developer_instructions\s*=\s*"""[\s\S]*?^"""\s*$/gmu)];
  if (instructionBlocks.length !== 1) errors.push(`${relative}: developer_instructions 应且仅应有一个完整多行字符串`);
  const expectedName = EXPECTED_NAMES[path.basename(relative)];
  if (values.name && values.name !== expectedName) errors.push(`${relative}: name 应为 ${expectedName}`);
  if (values.model && !ALLOWED_MODELS.has(values.model)) errors.push(`${relative}: 未批准的 model ${values.model}`);
  if (values.model_reasoning_effort && !ALLOWED_EFFORTS.has(values.model_reasoning_effort))
    errors.push(`${relative}: 未批准的 effort ${values.model_reasoning_effort}`);
  if (values.sandbox_mode && !ALLOWED_SANDBOXES.has(values.sandbox_mode))
    errors.push(`${relative}: 未批准的 sandbox ${values.sandbox_mode}`);
  if (/<待填>|\bTODO\b/i.test(source)) errors.push(`${relative}: contains placeholder`);
}

function validate(root, runtime = 'both') {
  const errors = [];
  if (!['both', 'cc', 'codex'].includes(runtime)) return [`runtime=${runtime} 非法`];
  if (runtime === 'both' || runtime === 'cc') {
    checkFile(root, 'CLAUDE.md', ['runtime/cc.md', 'boot-protocol.md', 'runtime/preflight.md'], errors);
    checkFile(root, '.claude/commands/gitee-ops.md', ['Gitee', 'Invoke-RestMethod', 'check-conn.js'], errors);
  }
  if (runtime === 'both' || runtime === 'codex') {
    checkFile(root, 'AGENTS.md', ['runtime/codex.md', 'boot-protocol.md', 'runtime/preflight.md'], errors);
    checkFile(root, '.claude/commands/gitee-ops.md', ['Gitee', 'Invoke-RestMethod', 'check-conn.js'], errors);
    for (const agent of CODEX_AGENTS) checkAgent(root, `.codex/agents/${agent}`, errors);
  }
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  let runtime = 'both', root = process.cwd();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--runtime') runtime = args[++index];
    else if (args[index] === '--root') root = path.resolve(args[++index]);
    else { console.error(`未知参数：${args[index]}`); process.exit(2); }
  }
  const errors = validate(root, runtime);
  if (errors.length) {
    console.error(`❌ 运行时项目配置缺口（${runtime}）：`);
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  console.log(`✅ 运行时项目配置齐备（${runtime}）`);
}

if (require.main === module) main();
module.exports = { validate };
