#!/usr/bin/env node
// 校验本仓受控的项目级 Codex agent 模板；这是有限字段检查，不冒充通用 TOML 解析器。
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const agentsDir = path.join(repoRoot, 'templates', '.codex', 'agents');
const requiredFiles = [
  'researcher.toml',
  'worker.toml',
  'reviewer.toml',
  'sensitive_reviewer.toml',
];
const allowedModels = new Set(['gpt-5.6-luna', 'gpt-5.6-terra', 'gpt-5.6-sol']);
const allowedEfforts = new Set(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
const allowedSandboxes = new Set(['read-only', 'workspace-write']);
const findings = [];

function scalar(source, key) {
  const matches = [...source.matchAll(new RegExp(`^${key}\\s*=\\s*"([^"]+)"\\s*$`, 'gmu'))];
  if (matches.length !== 1) {
    findings.push(`${key} 应且仅应出现一次，实际 ${matches.length} 次`);
    return null;
  }
  return matches[0][1];
}

for (const fileName of requiredFiles) {
  const relative = `templates/.codex/agents/${fileName}`;
  const absolute = path.join(agentsDir, fileName);
  if (!fs.existsSync(absolute)) {
    findings.push(`${relative}: 文件不存在`);
    continue;
  }

  const source = fs.readFileSync(absolute, 'utf8');
  const before = findings.length;
  const name = scalar(source, 'name');
  scalar(source, 'description');
  const model = scalar(source, 'model');
  const effort = scalar(source, 'model_reasoning_effort');
  const sandbox = scalar(source, 'sandbox_mode');
  const instructionBlocks = [...source.matchAll(/^developer_instructions\s*=\s*"""[\s\S]*?^"""\s*$/gmu)];
  if (instructionBlocks.length !== 1) findings.push('developer_instructions 应且仅应有一个完整多行字符串');
  if (name && !name.startsWith('hact-')) findings.push(`name 必须以 hact- 开头：${name}`);
  if (model && !allowedModels.has(model)) findings.push(`未批准的 model：${model}`);
  if (effort && !allowedEfforts.has(effort)) findings.push(`未批准的 model_reasoning_effort：${effort}`);
  if (sandbox && !allowedSandboxes.has(sandbox)) findings.push(`未批准的 sandbox_mode：${sandbox}`);

  if (findings.length > before) {
    for (let i = before; i < findings.length; i += 1) findings[i] = `${relative}: ${findings[i]}`;
  }
}

if (findings.length > 0) {
  console.error('❌ Codex agent 模板检查失败：');
  findings.forEach((finding) => console.error(finding));
  process.exit(1);
}

console.log(`✅ Codex agent 模板检查通过：${requiredFiles.join(', ')}`);
