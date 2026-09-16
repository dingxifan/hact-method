#!/usr/bin/env node
'use strict';
// Generate facts and drafts, never approvals or finding closures.
const cp = require('child_process'), crypto = require('crypto'), fs = require('fs'), path = require('path');
const { parseFrontmatter, scalarText, listItems, parseReportFindings, findTaskPackages } = require('./check-sprint.js');
const slash = value => value.replace(/\\/g, '/');
function git(root, args) { return cp.execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }); }
function anchor(root, base, head) {
  const resolve = ref => git(root, ['rev-parse', '--verify', '--end-of-options', `${ref}^{tree}`]).toString('utf8').trim();
  const b = resolve(base), h = resolve(head);
  const bytes = git(root, ['diff', '--binary', b, h]);
  const names = git(root, ['diff', '--name-only', '-z', b, h]).toString('utf8').split('\0').filter(Boolean).sort();
  return { base: b, head: h, names, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
}
function fields(a) {
  return `reviewed_base: ${a.base}\nreviewed_head: ${a.head}\ndiff_sha256: ${a.hash}\nchanged_files: ${JSON.stringify(a.names)}\n`;
}
function locate(root, task) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*$/.test(task || '')) throw new Error('Invalid task id');
  if (task === 'foundation') return { packagePath: '', dir: 'iterations/v0/code-reviews/foundation', fm: { risk: 'sensitive' } };
  const packages = findTaskPackages(root, task);
  if (packages.length !== 1) throw new Error('须唯一定位任务包');
  const relative = slash(path.relative(root, packages[0]));
  const dir = relative.startsWith('b-queue/') ? `b-reviews/${task}` : `${relative.split('/').slice(0, 2).join('/')}/code-reviews/${task}`;
  return { packagePath: relative, dir, fm: parseFrontmatter(packages[0]) };
}
function progress(root, dir, packagePath) {
  const names = fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter(n => /^round-\d{2}\.md$/.test(n)).sort() : [];
  let previous, codeReviews = 0;
  for (const [index, name] of names.entries()) {
    if (Number(name.match(/\d+/)[0]) !== index + 1) throw new Error('审查链编号不连续；先找回历史，不重开编号');
    const fm = parseFrontmatter(path.join(root, dir, name));
    const a = anchor(root, previous || scalarText(fm.reviewed_base), scalarText(fm.reviewed_head));
    if (a.names.some(n => n !== packagePath && n !== 'status.yml' && !n.startsWith(dir + '/'))) codeReviews++;
    previous = a.head;
  }
  return { names, codeReviews };
}
function draft(root, args) {
  const task = args.task, info = locate(root, task), absoluteDir = path.join(root, info.dir);
  const history = progress(root, info.dir, info.packagePath);
  const preflight = parseFrontmatter(path.join(absoluteDir, 'preflight.md'));
  if (!preflight) throw new Error('先完成已有 preflight；工具不补造开发前证据');
  if (args.spec) {
    if (!args.base) throw new Error('--spec requires --base');
    const a = anchor(root, args.base, args.head);
    const normative = new Set([info.packagePath, 'status.yml', 'project.md', 'foundation.md', 'design.md', 'decisions.md']);
    const iteration = info.packagePath.startsWith('iterations/') ? info.packagePath.split('/').slice(0, 2).join('/') : null;
    if (iteration) for (const file of ['prd.md', 'trd.md', 'sprint.md', 'ux-flows.md']) normative.add(`${iteration}/${file}`);
    if (a.names.some(n => !normative.has(n) && !n.startsWith(info.dir + '/')))
      throw new Error('spec 草稿含实现/测试或其它任务文件；不能借规格复核跳过代码审查');
    const numbers = fs.readdirSync(absoluteDir).filter(n => /^spec-round-\d{2}\.md$/.test(n)).map(n => Number(n.match(/\d+/)[0]));
    const number = Math.max(0, ...numbers) + 1;
    return { file: `${info.dir}/spec-round-${String(number).padStart(2, '0')}.md`, text:
      `---\ntask_id: ${task}\nreview_type: spec-only\nround: ${number}\n${fields(a)}conclusion: pending\n---\n\n## 待核修订\n\n填写契约变化、依据与影响；普通 files 登记/审计落盘不需要独立 spec-round。不得自动批准。\n` };
  }
  const priorRel = history.names.length ? `${info.dir}/${history.names.at(-1)}` : null;
  if (args.prior && slash(args.prior) !== priorRel) throw new Error('--prior 必须是现有最后一轮，不得重开历史');
  const prior = priorRel && parseFrontmatter(path.join(root, priorRel));
  if (prior && scalarText(prior.conclusion) === 'pending') throw new Error('前一轮仍为草稿，先由审查员完成');
  const targets = priorRel ? parseReportFindings(path.join(root, priorRel)).filter(f => f.severity === 'blocking' && f.status === 'open') : [];
  const full = !prior || scalarText(prior.escalate_to_full) === 'true';
  if (prior && !targets.length && !full) throw new Error('前轮无开放阻断；无需制造复审，新增工作按现有任务边界处理');
  const a = anchor(root, full ? scalarText(preflight.base_tree) : scalarText(prior.reviewed_head), args.head);
  const increment = prior ? anchor(root, scalarText(prior.reviewed_head), args.head) : a;
  const onlyEvidence = !full && a.base === a.head;
  if (onlyEvidence && targets.some(f => f.action !== 'request-evidence'))
    throw new Error('同快照只能补原有证据缺口，不能冒充已完成代码整改');
  const changesCode = increment.names.some(n => n !== info.packagePath && n !== 'status.yml' && !n.startsWith(info.dir + '/'));
  if (changesCode && history.codeReviews >= 3) throw new Error('已有三个实质代码审查快照；先按既有升级规则处理');
  if (onlyEvidence) {
    for (const name of history.names) {
      const fm = parseFrontmatter(path.join(absoluteDir, name));
      if (scalarText(fm.evidence_only) === 'true' && scalarText(fm.reviewed_head) === a.head
          && listItems(fm.target_finding_ids).some(id => targets.some(f => f.id === id)))
        throw new Error('同快照同问题已集中补证一次；停止自动往返并说明剩余缺口');
    }
  }
  const number = history.names.length + 1;
  let findings = 'findings: []';
  if (priorRel) {
    const body = fs.readFileSync(path.join(root, priorRel), 'utf8').split(/^## Findings\s*$/m)[1]?.split(/^## /m)[0] || '';
    const blocks = body.match(/^\s{2}- id:[\s\S]*?(?=^\s{2}- id:|^```|$(?![\s\S]))/gm) || [];
    const selected = blocks.filter(block => targets.some(f => new RegExp(`^  - id: ['"]?${f.id}['"]?\\s*$`, 'm').test(block)));
    if (selected.length !== targets.length) throw new Error('无法完整带入原 finding；请核前轮 YAML，不生成残缺草稿');
    findings = 'findings:\n' + selected.map(s => s.trimEnd()).join('\n');
  }
  return { file: `${info.dir}/round-${String(number).padStart(2, '0')}.md`, text:
    `---\nschema: develop-review-round/v2\nreview_policy: bounded-v1\ntask_id: ${task}\nround: ${number}\nmode: ${full ? 'full' : 'targeted'}\nrisk: ${scalarText(info.fm.risk) || 'standard'}\nprior_report: ${priorRel || 'null'}\ntarget_finding_ids: ${JSON.stringify(targets.map(f => f.id))}\nbase_ref: ${scalarText(preflight.base_ref)}\n${fields(a)}evidence_only: ${onlyEvidence}\nevidence_files: []\nescalate_to_full: false\nconclusion: pending\n---\n\n## 本轮证据与判断\n\n待独立审查员填写新证据、问题判断和结论；前序上下文引用 prior_report，不重抄。${onlyEvidence ? '补齐 evidence_files，并核原始运行证据。' : ''}\n\n## Findings\n\n\`\`\`yaml\n${findings}\n\`\`\`\n` };
}
function main(argv) {
  if (!argv[0]?.startsWith('--')) {
    const [base, head, root = '.'] = argv;
    if (!base || !head || argv.length > 3) throw new Error('Usage: build-review-anchor.js <base> <head> [root]');
    process.stdout.write(fields(anchor(path.resolve(root), base, head))); return;
  }
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i].slice(2);
    if (['write', 'spec'].includes(flag)) args[flag] = true;
    else if (['task', 'head', 'base', 'root', 'prior'].includes(flag) && argv[i + 1]) args[flag] = argv[++i];
    else throw new Error('Usage: --task <id> --head <tree> [--root .] [--write] [--spec --base <tree>]');
  }
  if (!args.head) throw new Error('--head required');
  const root = path.resolve(args.root || '.'), result = draft(root, args);
  if (args.write) {
    fs.writeFileSync(path.join(root, result.file), result.text, { flag: 'wx' });
    console.log(result.file + ' (draft; requires independent judgment)');
  } else process.stdout.write(result.text);
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(String(error.stderr || error.message).trim()); process.exitCode = 1; }
}
module.exports = { anchor, draft, progress };
