#!/usr/bin/env node
'use strict';
// 只核本方法论约定的 Codex 入口/角色文件形状，不证明工具或模型可调用。
const fs = require('fs');
const path = require('path');
const AGENTS = {
  'researcher.toml': 'hact-researcher', 'worker.toml': 'hact-worker',
  'reviewer.toml': 'hact-reviewer', 'sensitive_reviewer.toml': 'hact-sensitive-reviewer',
};
function validate(root) {
  const errors = [];
  const read = rel => {
    const file = path.join(root, rel);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { errors.push(rel + ': missing'); return ''; }
    return fs.readFileSync(file, 'utf8');
  };
  for (const [file, tokens] of [
    ['AGENTS.md', ['boot-protocol.md']], ['gitee-ops.md', ['Gitee', 'Invoke-RestMethod', 'check-conn.js']],
  ]) {
    const source = read(file);
    for (const token of tokens) if (!source.includes(token)) errors.push(file + ': missing reference ' + token);
  }
  for (const [file, name] of Object.entries(AGENTS)) {
    const rel = '.codex/agents/' + file, source = read(rel);
    const values = {};
    for (const key of ['name', 'description', 'model', 'model_reasoning_effort', 'sandbox_mode']) {
      const lines = source.split(/\r?\n/).filter(line => new RegExp('^' + key + '\\s*=').test(line));
      const required = key === 'name' || key === 'description';
      if (!lines.length && !required) continue;
      const match = lines.length === 1 && lines[0].match(/=\s*"([^"\r\n]+)"\s*$/);
      if (!match) { errors.push(rel + ': ' + key + ' 必须为唯一非空字符串'); continue; }
      values[key] = match[1];
    }
    if (values.name && values.name !== name) errors.push(rel + ': name 应为 ' + name);
    const blocks = [...source.matchAll(/^developer_instructions\s*=\s*"""([\s\S]*?)^"""\s*$/gm)];
    if (blocks.length !== 1 || !blocks[0][1].trim()) errors.push(rel + ': developer_instructions 缺失或重复');
    if (values.model && /\s|[<>{}]/.test(values.model)) errors.push(rel + ': model 格式非法');
    if (values.model_reasoning_effort && !['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'].includes(values.model_reasoning_effort))
      errors.push(rel + ': effort 非法');
    if (values.sandbox_mode && !['read-only', 'workspace-write', 'danger-full-access'].includes(values.sandbox_mode))
      errors.push(rel + ': sandbox 非法');
    if (/<待填>|\bTODO\b/.test(source)) errors.push(rel + ': contains placeholder');
  }
  return errors;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--root')) {
    console.error('用法: node check-codex-project.js [--root 项目根]'); process.exit(2);
  }
  const errors = validate(path.resolve(args[1] || '.'));
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('✅ Codex 入口与配置形状通过；模型/权限/工具须在使用点确认');
}
module.exports = { validate };
