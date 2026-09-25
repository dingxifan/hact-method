#!/usr/bin/env node
'use strict';
// B 类边界：none 不夹带契约；governed 需明确依据。静态信号不能证明兼容性。
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
      out[key] = /^\[.*\]$/.test(top[2])
        ? top[2].slice(1, -1).split(',').map(item => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : top[2].replace(/^['"]|['"]$/g, '');
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
    // Contract / migration paths 始终受保护，B task 不得借局部优化改写。
    /(^|\/)(standards-(shared|frontend|backend)|project|foundation|design|status)\.md$/i,
    /(^|\/)(migrations?|schema|openapi|swagger|contracts?|shared\/types?)(\/|\.|$)/i,
    /\.(proto|avsc)$/i,
    /(^|\/)status\.yml$/i,
  ];
  return files.filter(file => patterns.some(pattern => pattern.test(String(file).replace(/\\/g, '/'))));
}

function prohibitedPathHits(files) {
  return contractPathHits(files).filter(file => /(^|\/)status\.yml$/i.test(normalizeDeclaredFile(file)) ||
    /(^|\/)(?:iterations\/v[^/]+\/(?:prd|trd|gates)\.md|(?:standards-(?:shared|frontend|backend)|project|foundation|design|status)\.md|migrations?(?:\/|\.|$))/i.test(normalizeDeclaredFile(file)));
}

function normalizeDeclaredFile(file) {
  const text = String(file || '').trim().replace(/\\/g, '/');
  const match = text.match(/^(.+?\.[A-Za-z0-9_-]+)(?:\s|$)/);
  return (match ? match[1] : text).replace(/^\.\//, '');
}

// Governance artifacts are auditable, but they are not business implementation
// files. They remain visible to the review-chain audit; this classifier only
// keeps them out of the task package's implementation write-set.
function governancePath(file, taskId, taskPath = '') {
  const name = String(file || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const normalizedTask = String(taskPath || '').replace(/\\/g, '/');
  return name === 'status.yml' || name === normalizedTask
    || new RegExp(`^b-reviews/${String(taskId || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`).test(name)
    || new RegExp(`^iterations/[^/]+/code-reviews/${String(taskId || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`).test(name);
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
  // Unit callers may provide an isolated changed line; a real Git binary diff
  // always supplies +++ b/<path> before content.
  let implementationFile = true;
  for (const line of String(diff || '').split(/\r?\n/)) {
    if (/^\+\+\+ b\//.test(line)) {
      const file = line.slice(6).trim();
      // Markdown governance may quote a DTO/route/type verbatim. Contract
      // signals are about implementation/schema changes, never prose.
      implementationFile = /\.(?:[cm]?[jt]sx?|java|kt|cs|go|py|rb|php|sql|proto|avsc|ya?ml|json)$/i.test(file)
        && !/\.md$/i.test(file);
      continue;
    }
    if (!/^[+-]/.test(line) || /^(?:\+\+\+|---)/.test(line)) continue;
    if (!implementationFile) continue;
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
  const taskPath = path.relative(root, path.resolve(file)).replace(/\\/g, '/');
  const taskId = String(fm && fm['task-id'] || path.basename(taskPath, '.md'));
  const implementationFiles = changedFiles.filter(changed => !governancePath(changed, taskId, taskPath));
  const undeclared = implementationFiles.filter(changed => !declared.has(changed.replace(/\\/g, '/')));
  if (undeclared.length) errors.push(`固定 diff 含未声明 files：${undeclared.join('、')}`);
  const governed = fm && fm['contract-impact'] === 'governed';
  const pathHits = governed ? prohibitedPathHits(implementationFiles) : contractPathHits(implementationFiles);
  if (pathHits.length) errors.push(`固定 diff 命中共享契约/迁移路径：${pathHits.join('、')}`);
  const signals = contractDiffSignals(diff);
  if (governed ? signals.some(signal => signal.startsWith('数据库 DDL:')) : signals.length) errors.push(`固定 diff 出现共享契约变更信号：${signals.join('；')}`);
  const memberSignals = publicContractSignals(root, base, head, changedFiles);
  if (!governed && memberSignals.length) errors.push(`固定 diff 修改公开类型成员：${memberSignals.join('；')}`);
  return errors;
}

function validate(file, sourceOverride = null) {
  const source = sourceOverride === null ? fs.readFileSync(file, 'utf8') : sourceOverride;
  const fm = parseFrontmatter(source);
  const errors = [];
  if (!fm) return ['缺 YAML frontmatter'];
  if (!['bug', 'optimization'].includes(String(fm.source || '').toLowerCase()))
    errors.push(`source=${fm.source || '<缺失>'}，B 类只能 bug/optimization`);
  if (String(fm['package-schema']) !== '2')
    errors.push(`active B package 必须显式使用 package-schema: 2（当前=${fm['package-schema'] || '缺失'}）`);
  const impact = String(fm['contract-impact'] || '');
  if (!['none', 'governed'].includes(impact)) errors.push('contract-impact 必须为 none 或 governed');
  const nonempty = value => typeof value === 'string' && value.trim() && !/<待填>|TODO/.test(value);
  if (!['standard', 'sensitive'].includes(fm.risk)) errors.push('risk 必须为 standard 或 sensitive');
  for (const key of ['task-id', 'title', 'description', 'context', 'risk'])
    if (!nonempty(fm[key])) errors.push(`缺有效 ${key}`);
  for (const key of ['files', 'reference'])
    if (!Array.isArray(fm[key]) || !fm[key].length || !fm[key].every(nonempty)) errors.push(`缺有效 ${key} 列表`);
  for (const key of ['depends_on', 'do-not'])
    if (!Array.isArray(fm[key])) errors.push(`缺 ${key} 列表；无则 []`);
  const ac = source.match(/^acceptance-criteria:\s*\n((?:[ \t]+.*\n|\s*\n)*)/m);
  const criteria = ac ? ac[1].split(/^[ \t]+-[ \t]+\|[-+]?[ \t]*$/m).slice(1) : [];
  if (!criteria.length || criteria.some(item => ['intent', 'oracle'].some(key => {
    const match = item.match(new RegExp('^[ \\t]+' + key + ':[ \\t]*(.+)$', 'm'));
    return !match || !nonempty(match[1]);
  }))) errors.push('每条 acceptance-criteria 都需可验证的 intent/oracle');
  if (impact === 'governed') {
    if (!Array.isArray(fm['asset-writes']) || !fm['asset-writes'].length || !fm['asset-writes'].every(nonempty))
      errors.push('governed 必须列出受影响共享资产，不能填 []');
    // reference/context 承接已确认意图、兼容边界与验证入口；真实性由 preflight 与独立审查核对。
  }
  if (!('asset-writes' in fm)) errors.push('缺 asset-writes；无共享写集也必须填 []');
  const files = Array.isArray(fm.files) ? fm.files : [];
  const hits = impact === 'governed' ? prohibitedPathHits(files) : contractPathHits(files);
  if (hits.length) errors.push(`files 命中共享契约/迁移路径：${hits.join('、')}`);
  return errors;
}

function main() {
  const args = process.argv.slice(2);
  let base = null, head = null, root = process.cwd(), staged = false;
  const files = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--diff') { base = args[index + 1]; head = args[index + 2]; index += 2; }
    else if (args[index] === '--root') { root = path.resolve(args[index + 1]); index += 1; }
    else if (args[index] === '--staged') staged = true;
    else files.push(args[index]);
  }
  if (!files.length) {
    console.error('用法: node check-b-task.js <b-queue/task-id.md> [...] [--staged] [--diff <base> <head>] [--root <项目根>]');
    process.exit(2);
  }
  if ((base && !head) || (!base && head) || ((base || head) && files.length !== 1)) {
    console.error('--diff 必须同时给 base/head，且一次只校验一个 B 类任务包');
    process.exit(2);
  }
  if (staged && (base || head)) {
    console.error('--staged 不能与 --diff 同时使用');
    process.exit(2);
  }
  let failed = false;
  for (const file of files) {
    if (!staged && !fs.existsSync(file)) {
      failed = true;
      console.error(`❌ ${file}\n  - 任务包文件不存在`);
      continue;
    }
    let stagedSource = null;
    if (staged) {
      const taskPath = path.relative(root, path.resolve(file)).replace(/\\/g, '/');
      try { stagedSource = git(root, ['show', `:${taskPath}`]); }
      catch (error) {
        failed = true;
        console.error(`❌ ${file}\n  - 无法读取 staged B package：${String(error.stderr || error.message).trim()}`);
        continue;
      }
    }
    const errors = base ? validateDiff(file, base, head, root) : validate(file, stagedSource);
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
  publicContractSignals, governancePath, validate, validateDiff };
