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

function delegatesTracked(source) {
  return String(source || '').split(/\r?\n/).some(line => {
    const command = line.trim();
    if (!command || command.startsWith('#')) return false;
    return /^(?:(?:exec|sh|bash)\s+)?(?:\.\/)?scripts\/pre-commit-hook\.sh(?:\s|$)/.test(command);
  });
}

function hasCommand(source, pattern) {
  return String(source || '').split(/\r?\n/).some(line => {
    const command = line.trim();
    return command && !command.startsWith('#') && pattern.test(command);
  });
}

function delegatesViaHusky(active, source) {
  // Husky v9 的生效入口只 source 同目录的 h；h 再按入口名转到
  // .husky/pre-commit。三段都能静态确认时，才把它视为有效委托。
  if (!hasCommand(source, /^\.\s+["']?\$\(dirname\s+["']?\$0["']?\)["']?\/h["']?$/)) return false;
  const huskyRuntime = path.join(path.dirname(active), 'h');
  const projectHook = path.join(path.dirname(path.dirname(active)), path.basename(active));
  if (!fs.existsSync(huskyRuntime) || !fs.existsSync(projectHook)) return false;

  const runtimeSource = fs.readFileSync(huskyRuntime, 'utf8');
  const forwardsNamedHook = hasCommand(runtimeSource, /^n=\$\(basename\s+["']?\$0["']?\)$/)
    && hasCommand(runtimeSource, /^s=\$\(dirname\s+["']?\$\(dirname\s+["']?\$0["']?\)["']?\)\/\$n$/)
    && hasCommand(runtimeSource, /^sh\s+-e\s+["']?\$s["']?\s+["']?\$@["']?$/);
  if (!forwardsNamedHook) return false;
  return delegatesTracked(fs.readFileSync(projectHook, 'utf8'));
}

function isExecutable(file) {
  if (process.platform === 'win32') return true;
  return (fs.statSync(file).mode & 0o111) !== 0;
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
    const activeSource = activeBody.toString('utf8');
    const delegates = delegatesTracked(activeSource);
    const huskyDelegates = !delegates && delegatesViaHusky(active, activeSource);
    if (!isExecutable(active)) {
      result.state = 'degraded';
      result.signals.push('active-not-executable');
    }
    if (Buffer.compare(trackedBody, activeBody) === 0) result.install = 'exact-copy';
    else if (delegates) result.install = 'delegates-tracked';
    else if (huskyDelegates) result.install = 'husky-delegates-tracked';
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
      result.state = 'degraded';
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
module.exports = { inspect, delegatesTracked };
