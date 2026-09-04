#!/usr/bin/env node
'use strict';
// 只报告 tracked 门卫、实际生效 hook 与方法论模板之间的状态；绝不安装或覆盖。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || 'git failed').trim());
  return result.stdout.trim();
}

function effectiveHook(root) {
  let hooksPath;
  try {
    hooksPath = git(root, ['rev-parse', '--path-format=absolute', '--git-path', 'hooks']);
  } catch {
    const raw = git(root, ['rev-parse', '--git-path', 'hooks']);
    hooksPath = path.isAbsolute(raw) ? raw : path.resolve(root, raw);
  }
  return path.join(hooksPath, 'pre-commit');
}

function inspect(root, methodRoot) {
  const tracked = path.join(root, 'scripts', 'pre-commit-hook.sh');
  const active = effectiveHook(root);
  const result = { root, tracked, active, state: 'available', signals: [] };
  if (!fs.existsSync(tracked)) {
    result.state = 'degraded';
    result.signals.push('tracked-missing');
    return result;
  }
  const trackedBody = fs.readFileSync(tracked);
  result.trackedHash = hash(trackedBody);
  if (!fs.existsSync(active)) {
    result.state = 'degraded';
    result.signals.push('active-missing');
  } else {
    const activeBody = fs.readFileSync(active);
    result.activeHash = hash(activeBody);
    const delegates = /(?:^|[\/\\])scripts[\/\\]pre-commit-hook\.sh|scripts\/pre-commit-hook\.sh/.test(activeBody.toString('utf8'));
    if (Buffer.compare(trackedBody, activeBody) === 0) result.install = 'exact-copy';
    else if (delegates) result.install = 'delegates-tracked';
    else {
      result.state = 'degraded';
      result.install = 'drift-or-custom';
      result.signals.push('active-tracked-drift');
    }
  }
  if (methodRoot) {
    const template = path.join(methodRoot, 'templates', 'scripts', 'pre-commit-hook.sh');
    result.template = template;
    if (fs.existsSync(template)) {
      const templateBody = fs.readFileSync(template);
      result.templateHash = hash(templateBody);
      if (Buffer.compare(trackedBody, templateBody) !== 0) {
        result.state = 'degraded';
        result.signals.push('template-project-drift');
      }
    } else {
      result.signals.push('template-not-found');
    }
  }
  return result;
}

function parseArgs(argv) {
  const out = { root: process.cwd(), methodRoot: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--root') out.root = argv[++i];
    else if (argv[i] === '--method-root') out.methodRoot = argv[++i];
    else if (argv[i] === '--json') out.json = true;
    else throw new Error(`未知参数：${argv[i]}`);
  }
  out.root = path.resolve(out.root);
  if (out.methodRoot) out.methodRoot = path.resolve(out.methodRoot);
  return out;
}

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exit(2); }
  let result;
  try { result = inspect(args.root, args.methodRoot); }
  catch (error) { console.error(`❌ 门卫状态无法读取：${error.message}`); process.exit(2); }
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`门卫状态：${result.state}`);
    console.log(`- tracked: ${result.tracked}${result.trackedHash ? ` (${result.trackedHash})` : ''}`);
    console.log(`- active: ${result.active}${result.activeHash ? ` (${result.activeHash}, ${result.install})` : ''}`);
    if (result.template) console.log(`- template: ${result.template}${result.templateHash ? ` (${result.templateHash})` : ''}`);
    if (result.signals.length) console.log(`- signals: ${result.signals.join(', ')}`);
  }
  process.exit(result.state === 'available' ? 0 : 1);
}

if (require.main === module) main();
module.exports = { inspect };
