#!/usr/bin/env node
/*
 * check-paths.js · hact-method 运行时文本的绝对路径检查器
 *
 * 为什么需要：本方法多人共用，各人的工作区根不同（盘符、目录名都不一样）。
 * 运行时被 CC 逐字消费的文本里一旦写死绝对路径，在别人机器上就是死路径——
 * 而这类漂移不报错、不崩溃，只是让 CC 找不到文件后自行发挥，极难发现。
 * 2026-08-30 实测：曾累积到 71 处无人察觉，且一次"修复"只是把 E:\Group-code-lab\
 * 换成 E:\projects\——用另一个写死路径替换写死路径，同样无人拦下。
 *
 * 唯一约定（见 skeleton/02-workspaces.md §目录约定）：三类仓同级并住工作区根，
 * 互相引用一律相对——项目仓 → `../hact-method-lab/`，方法论仓 → `templates/`、`../{项目名}/`。
 *
 * 检查范围：只查**运行时文本**。记录既成事实的历史档（_meta/plans、status-history、
 * sessions、input）与状态快照（STATUS.md）不查——它们描述"当时在哪台机器上发生了什么"，
 * 写具体路径是对的。
 *
 * 用法：node scripts/check-paths.js [文件...]      # 不给文件则全量扫运行时目录
 * 退出码：有命中 → 1；干净 → 0；自身出错 → 2。
 */
'use strict';
const fs = require('fs');
const path = require('path');

// 运行时文本所在处：这些是 CC 会逐字读取、或被复制进项目仓的内容
const RUNTIME_DIRS = ['skeleton', 'specs-structural', 'specs-execution', 'guide', 'templates'];
const RUNTIME_FILES = ['CLAUDE.md', 'BRIEF.md'];
const EXT = /\.(md|js|sh|yml)$/;

// 盘符路径（E:\... / E:/...）与 WSL 挂载路径（/mnt/e/...）
const ABS = [
  // 前置负向断言排除 URL——https://... 里的 `s:/` 会被朴素的盘符正则命中（实测第一次跑就误报）
  [/(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s`'")\]]*/g, '盘符绝对路径'],
  [/\/mnt\/[a-z]\/[^\s`'")\]]*/g, 'WSL 挂载绝对路径'],
];

const hits = [];

function walk(dir, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

function scan(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return; }
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [re, why] of ABS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line))) hits.push({ file, line: i + 1, why, text: m[0] });
    }
  });
}

function main() {
  const root = process.cwd();
  let files = process.argv.slice(2);
  if (!files.length) {
    files = [];
    for (const d of RUNTIME_DIRS) walk(path.join(root, d), files);
    for (const f of RUNTIME_FILES) if (fs.existsSync(path.join(root, f))) files.push(path.join(root, f));
  } else {
    // 传入文件时也只查运行时范围，历史档照旧放行
    files = files.filter(f => {
      const rel = path.relative(root, path.resolve(f)).replace(/\\/g, '/');
      return EXT.test(rel) &&
        (RUNTIME_FILES.includes(rel) || RUNTIME_DIRS.some(d => rel.startsWith(d + '/')));
    });
  }

  files.forEach(scan);

  console.log(`\n=== check-paths 报告 ===`);
  console.log(`扫描 ${files.length} 个运行时文件 / 命中 ${hits.length} 处\n`);
  if (!hits.length) { console.log('✅ 运行时文本无绝对路径\n'); process.exit(0); }

  console.log('❌ FAIL：运行时文本不得写死绝对路径（本方法多人共用，各人工作区根不同）');
  for (const h of hits) {
    console.log(`  ${path.relative(process.cwd(), h.file).replace(/\\/g, '/')}:${h.line}  ${h.why}`);
    console.log(`      ${h.text}`);
  }
  console.log('\n改法：项目仓 → `../hact-method-lab/...`；方法论仓 → `templates/...`、`../{项目名}/...`。');
  console.log('约定见 skeleton/02-workspaces.md §目录约定。历史档（_meta/）与 STATUS.md 不在检查范围，可照写。\n');
  process.exit(1);
}

try { main(); }
catch (e) { console.error('check-paths 自身出错（非产物问题）:', e.message); process.exit(2); }
