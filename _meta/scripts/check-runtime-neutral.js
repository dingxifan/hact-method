#!/usr/bin/env node
// 检查运行时中立文本是否泄漏具体实现机制。
// 默认扫描全部运行时中立正文；实现细节只允许出现在 templates/runtime/{cc,codex}.md。
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaults = [
  'templates/runtime/interfaces.md',
  'templates/runtime/preflight.md',
  'templates/boot-protocol.md',
  'specs-execution',
  'specs-structural',
  'skeleton',
  'templates/review-briefs',
  'templates/checklists',
  'templates/design.md',
  'guide/02-一期完整流程.md',
];
const targets = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaults;

// 运行时标识 codex/cc 可以出现在入口与预检；以下是实现层专属机制词。
const hardPattern = /sub-?agent|general-purpose|codex exec|--profile|Skill\(|pinchtab|\bExplore\b|\bhaiku\b|model_reasoning_effort|\.codex\/agents/iu;
const findings = [];

function collectFiles(absolute) {
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  if (!stat.isDirectory()) return [];

  return fs.readdirSync(absolute, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const child = path.join(absolute, entry.name);
      if (entry.isDirectory()) return collectFiles(child);
      return entry.isFile() && entry.name.endsWith('.md') ? [child] : [];
    });
}

for (const target of targets) {
  const absolute = path.resolve(repoRoot, target);
  if (!fs.existsSync(absolute)) {
    findings.push(`${target}:0: 文件不存在`);
    continue;
  }
  for (const file of collectFiles(absolute)) {
    const relative = path.relative(repoRoot, file).replaceAll('\\', '/');
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (hardPattern.test(line)) findings.push(`${relative}:${index + 1}: ${line}`);
    });
  }
}

if (findings.length > 0) {
  console.error('❌ 运行时中立文本出现实现层专属机制词或目标文件缺失：');
  findings.forEach((line) => console.error(line));
  process.exit(1);
}

console.log(`✅ 运行时中立检查通过：${targets.join(', ')}`);
