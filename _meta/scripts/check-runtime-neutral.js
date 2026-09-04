#!/usr/bin/env node
// 检查运行时中立文本是否泄漏具体实现机制。
// 默认只扫描已完成中立化的 runtime 核心；执行规范完成清洗后再扩展范围。
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaults = [
  'templates/runtime/interfaces.md',
  'templates/runtime/preflight.md',
];
const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaults;

// 运行时标识 codex/cc 可以出现在入口与预检；以下是实现层专属机制词。
const hardPattern = /sub-?agent|general-purpose|codex exec|--profile|Skill\(|pinchtab|\bExplore\b|\bhaiku\b|model_reasoning_effort|\.codex\/agents/iu;
const findings = [];

for (const target of targets) {
  const absolute = path.resolve(repoRoot, target);
  if (!fs.existsSync(absolute)) {
    findings.push(`${target}:0: 文件不存在`);
    continue;
  }
  const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    if (hardPattern.test(line)) findings.push(`${target}:${index + 1}: ${line}`);
  });
}

if (findings.length > 0) {
  console.error('❌ 运行时中立文本出现实现层专属机制词或目标文件缺失：');
  findings.forEach((line) => console.error(line));
  process.exit(1);
}

console.log(`✅ 运行时中立检查通过：${targets.join(', ')}`);
