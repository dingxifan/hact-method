#!/usr/bin/env node
'use strict';
// B 类任务包硬边界：只能修既有行为，不能夹带共享契约修订。
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/m);
  if (!match) return null;
  const lines = match[1].split(/\r?\n/);
  const out = {};
  let key = null;
  for (const line of lines) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*?)\s*(?:#.*)?$/);
    if (top) {
      key = top[1];
      out[key] = top[2] === '[]' ? [] : top[2].replace(/^['"]|['"]$/g, '');
      continue;
    }
    const item = line.match(/^\s+-\s+(.+?)\s*(?:#.*)?$/);
    if (item && key) {
      if (!Array.isArray(out[key])) out[key] = [];
      out[key].push(item[1]);
    }
  }
  return out;
}

function contractPathHits(files) {
  const patterns = [
    /(^|\/)iterations\/v[^/]+\/(prd|trd|gates)\.md$/i,
    // 存量规则文件在项目迁移完成前仍受保护；不再生成或加载这些文件。
    /(^|\/)(standards-(shared|frontend|backend)|project|foundation|design)\.md$/i,
    /(^|\/)(migrations?|schema|openapi|swagger|contracts?|shared\/types?)(\/|\.|$)/i,
    /\.(proto|avsc)$/i,
  ];
  return files.filter(file => patterns.some(pattern => pattern.test(String(file).replace(/\\/g, '/'))));
}

function normalizeDeclaredFile(file) {
  const text = String(file || '').trim().replace(/\\/g, '/');
  const match = text.match(/^(.+?\.[A-Za-z0-9_-]+)(?:\s|$)/);
  return (match ? match[1] : text).replace(/^\.\//, '');
}

function contractDiffSignals(diff) {
  const patterns = [
    { label: '导出共享 type/interface/enum', re: /\bexport\s+(?:interface|type|enum)\b/ },
    { label: '导出 DTO/request/response/event', re: /\bexport\s+class\s+\w*(?:Dto|Request|Response|Event)\b/i },
    { label: 'API 路由签名', re: /@(Get|Post|Put|Patch|Delete)\s*\(/ },
    { label: '数据库 DDL', re: /\b(?:CREATE|ALTER|DROP)\s+(?:TABLE|TYPE|INDEX|COLUMN)\b/i },
    { label: 'OpenAPI/Swagger 根声明', re: /^\s*(?:openapi|swagger)\s*:/i },
  ];
  const hits = [];
  for (const line of String(diff || '').split(/\r?\n/)) {
    if (!/^[+-]/.test(line) || /^(?:\+\+\+|---)/.test(line)) continue;
    const code = line.slice(1);
    for (const { label, re } of patterns) if (re.test(code)) hits.push(`${label}: ${code.trim().slice(0, 120)}`);
  }
  return [...new Set(hits)];
}

function git(root, args) {
  return childProcess.execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function extractPublicContracts(source) {
  const contracts = new Map();
  const text = String(source || '');
  const declaration = /\bexport\s+(interface|enum|class|type)\s+([A-Za-z_$][\w$]*)[^\n{;]*?(?:=\s*)?\{/g;
  let match;
  while ((match = declaration.exec(text))) {
    const kind = match[1], name = match[2];
    if (kind === 'class' && !/(?:Dto|Request|Response|Event)$/i.test(name)) continue;
    const open = text.indexOf('{', match.index);
    let depth = 0, close = -1;
    for (let index = open; index < text.length; index += 1) {
      if (text[index] === '{') depth += 1;
      else if (text[index] === '}' && --depth === 0) { close = index; break; }
    }
    if (close < 0) continue;
    const normalized = text.slice(match.index, close + 1)
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
    contracts.set(`${kind}:${name}`, normalized);
    declaration.lastIndex = close + 1;
  }
  return contracts;
}

function publicContractSignals(root, base, head, files) {
  const hits = [];
  const show = (object, file) => {
    try { return git(root, ['show', `${object}:${file}`]); }
    catch { return ''; }
  };
  for (const file of files.filter(name => /\.[cm]?[jt]sx?$/i.test(name))) {
    const before = extractPublicContracts(show(base, file));
    const after = extractPublicContracts(show(head, file));
    const keys = new Set([...before.keys(), ...after.keys()]);
    for (const key of keys) if (before.get(key) !== after.get(key)) hits.push(`${file} ${key}`);
  }
  return hits;
}

function validateDiff(file, base, head, root = process.cwd()) {
  const errors = validate(file);
  let changedFiles, diff;
  try {
    git(root, ['cat-file', '-e', `${base}^{tree}`]);
    git(root, ['cat-file', '-e', `${head}^{tree}`]);
    changedFiles = git(root, ['diff', '--name-only', base, head]).split(/\r?\n/).filter(Boolean);
    diff = git(root, ['diff', '--binary', base, head]);
  } catch (error) {
    return [...errors, `固定 diff 不可复现：${String(error.stderr || error.message).trim()}`];
  }
  const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  const declared = new Set((Array.isArray(fm && fm.files) ? fm.files : []).map(normalizeDeclaredFile));
  const undeclared = changedFiles.filter(changed => !declared.has(changed.replace(/\\/g, '/')));
  if (undeclared.length) errors.push(`固定 diff 含未声明 files：${undeclared.join('、')}`);
  const pathHits = contractPathHits(changedFiles);
  if (pathHits.length) errors.push(`固定 diff 命中共享契约/迁移路径：${pathHits.join('、')}`);
  const signals = contractDiffSignals(diff);
  if (signals.length) errors.push(`固定 diff 出现共享契约变更信号：${signals.join('；')}`);
  const memberSignals = publicContractSignals(root, base, head, changedFiles);
  if (memberSignals.length) errors.push(`固定 diff 修改公开类型成员：${memberSignals.join('；')}`);
  return errors;
}

function validate(file) {
  const source = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(source);
  const errors = [];
  if (!fm) return ['缺 YAML frontmatter'];
  if (!['bug', 'optimization'].includes(String(fm.source || '').toLowerCase()))
    errors.push(`source=${fm.source || '<缺失>'}，B 类只能 bug/optimization`);
  if (String(fm['contract-impact'] || '').toLowerCase() !== 'none')
    errors.push('contract-impact 必须为 none；若为 governed 或需修订契约，应退出 B 类');
  if (!('asset-writes' in fm)) errors.push('缺 asset-writes；无共享写集也必须填 []');
  const files = Array.isArray(fm.files) ? fm.files : [];
  const hits = contractPathHits(files);
  if (hits.length) errors.push(`files 命中共享契约/迁移路径：${hits.join('、')}`);
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  let base = null, head = null, root = process.cwd();
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--diff') { base = args[index + 1]; head = args[index + 2]; index += 2; }
    else if (args[index] === '--root') { root = path.resolve(args[index + 1]); index += 1; }
    else files.push(args[index]);
  }
  if (!files.length) {
    console.error('用法: node check-b-task.js <b-queue/task-id.md> [...] [--diff <base> <head>] [--root <项目根>]');
    process.exit(2);
  }
  if ((base && !head) || (!base && head) || ((base || head) && files.length !== 1)) {
    console.error('--diff 必须同时给 base/head，且一次只校验一个 B 类任务包');
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    if (!fs.existsSync(file)) {
      failed = true;
      console.error(`❌ ${file}\n  - 任务包文件不存在`);
      continue;
    }
    const errors = base ? validateDiff(file, base, head, root) : validate(file);
    if (errors.length) {
      failed = true;
      console.error(`❌ ${file}`);
      errors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log(`✅ ${file}：B 类契约边界通过`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
module.exports = { parseFrontmatter, contractPathHits, contractDiffSignals, extractPublicContracts,
  publicContractSignals, validate, validateDiff };
