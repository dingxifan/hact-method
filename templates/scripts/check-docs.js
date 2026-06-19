#!/usr/bin/env node
/*
 * check-docs.js · hact-method 产物结构 linter（子计划 1 · 地基）
 *
 * 用途：机械核对 PRD / TRD 的「结构完备」+「交叉一致」完成判据。
 *      只验确定性可查的部分；语义判据（场景5要素/三角评估/AC是否用户真要的）不碰，留人。
 *
 * 用法：
 *   node check-docs.js <prd.md> <trd.md>   # 全量 + 交叉对账（推荐）
 *   node check-docs.js --prd <prd.md>      # 只验 PRD
 *   node check-docs.js --trd <trd.md>      # 只验 TRD
 *   位置参数顺序：第一个当 prd、第二个当 trd（也可用 --prd/--trd 显式指定）
 *
 * 退出码：有任一 FAIL → 1；全 pass → 0。
 *
 * 解析策略：容错行扫描（按固定 header + 槽位标签），非完整 markdown AST。
 *          依赖模板的固定 header（## 段落 / ### 功能：/ ### 表：/ ### 接口：）与
 *          槽位写法（**字段**：值）。HTML 注释（<!-- -->）整体忽略。
 */
'use strict';
const fs = require('fs');

const PLACEHOLDER = '<待填>';
const findings = []; // {level:'fail'|'pass', rule, loc, msg}
function fail(rule, loc, msg) { findings.push({ level: 'fail', rule, loc, msg }); }
function pass(rule, msg) { findings.push({ level: 'pass', rule, msg }); }

function isEmptyVal(v) {
  const t = (v || '').trim();
  return t === '' || t.includes(PLACEHOLDER);
}

// 读文件 → 行数组，并标注每行是否处于 HTML 注释内（注释行不计入内容/槽位）
function readDoc(path) {
  const raw = fs.readFileSync(path, 'utf8').split(/\r?\n/);
  const lines = [];
  let inComment = false;
  for (let i = 0; i < raw.length; i++) {
    let text = raw[i];
    let commented = inComment;
    // 单行内可能 <!-- ... --> 开闭；粗略处理：只要本行起始就在注释内 → commented
    if (!inComment && /<!--/.test(text)) {
      commented = true;
      if (/-->/.test(text)) inComment = false; // 单行注释，下一行恢复
      else inComment = true;
    } else if (inComment && /-->/.test(text)) {
      inComment = false; // 本行仍算注释行
    }
    lines.push({ n: i + 1, text, commented });
  }
  return lines;
}

const reH2 = /^##\s+(.+?)\s*$/;
const reH3 = /^###\s+(.+?)\s*$/;
const reSlot = /^\*\*(.+?)\*\*\s*[:：]\s*(.*)$/;
const reListItem = /^\s*[-*]\s+(.+)$/;

// 把文档切成 level-2 段落：{title, start, lines:[{n,text,commented}]}（含其下 ### 块）
function splitSections(lines) {
  const sections = [];
  let cur = null;
  for (const ln of lines) {
    if (ln.commented) { if (cur) cur.lines.push(ln); continue; }
    const m = ln.text.match(reH2);
    if (m) {
      cur = { title: m[1].trim(), start: ln.n, lines: [] };
      sections.push(cur);
    } else if (cur) {
      cur.lines.push(ln);
    }
  }
  return sections;
}

function sectionByTitle(sections, title) {
  return sections.find(s => s.title === title);
}

// 段落是否有实质内容（非空行、非注释、非纯占位）
function sectionHasContent(sec) {
  return sec.lines.some(ln => {
    if (ln.commented) return false;
    const t = ln.text.trim();
    if (t === '') return false;
    if (t.includes(PLACEHOLDER)) return false;
    return true;
  });
}

// 把一个 section 内的 ### 块切出来：{name, start, lines:[]}
function splitBlocks(sec, h3prefix) {
  const blocks = [];
  let cur = null;
  for (const ln of sec.lines) {
    const m = !ln.commented && ln.text.match(reH3);
    if (m && m[1].startsWith(h3prefix)) {
      cur = { name: m[1].slice(h3prefix.length).trim(), start: ln.n, lines: [] };
      blocks.push(cur);
    } else if (cur) {
      cur.lines.push(ln);
    }
  }
  return blocks;
}

// 兼容三种槽位写法：`**key**：v`（PRD 功能槽）/ `- key：v`（TRD 表/接口列表槽）/ `key：v`
function getSlot(blockLines, key) {
  for (const ln of blockLines) {
    if (ln.commented) continue;
    const t = ln.text.replace(/^\s*[-*]\s+/, ''); // 去列表标记
    const m = t.match(/^(?:\*\*)?(.+?)(?:\*\*)?\s*[:：]\s*(.*)$/);
    if (m && m[1].trim() === key) return { val: m[2], line: ln.n };
  }
  return null;
}

// ---------------- PRD ----------------
const PRD_SECTIONS = ['产品目标', '目标用户', '核心功能', '用户故事', 'MVP 边界', '开放问题'];
const DRAFT_UX_ENUM = ['需要', '不需要'];

function checkPRD(path) {
  const lines = readDoc(path);
  const sections = splitSections(lines);
  const file = path;

  // 1. 6 段落齐 + 无空段（开放问题反向：须为空）
  for (const title of PRD_SECTIONS) {
    const sec = sectionByTitle(sections, title);
    if (!sec) { fail('PRD段落完备', `${file}`, `缺段落「## ${title}」`); continue; }
    if (title === '开放问题') {
      const items = sec.lines.filter(ln => !ln.commented && reListItem.test(ln.text));
      if (items.length > 0) fail('PRD开放问题清空', `${file}:${items[0].n}`, `「开放问题」段未清空（残留 ${items.length} 项），定稿须为空`);
      else pass('PRD开放问题清空', '开放问题段为空');
      continue;
    }
    if (title === '核心功能') continue; // 由功能块校验覆盖
    if (!sectionHasContent(sec)) fail('PRD段落非空', `${file}:${sec.start}`, `段落「## ${title}」为空或仅占位`);
    else pass('PRD段落非空', `「## ${title}」有内容`);
  }

  // 2. 功能块
  const core = sectionByTitle(sections, '核心功能');
  const entities = [];
  if (core) {
    const blocks = splitBlocks(core, '功能：');
    if (blocks.length === 0) fail('PRD功能块存在', `${file}:${core.start}`, '「核心功能」段无任何「### 功能：」块');
    for (const b of blocks) {
      const where = `${file}:${b.start}`;
      const tag = `功能「${b.name}」`;
      for (const key of ['入口', '涉及实体']) {
        const slot = getSlot(b.lines, key);
        if (!slot) fail('PRD功能槽完备', where, `${tag} 缺槽位「${key}」`);
        else if (isEmptyVal(slot.val)) fail('PRD功能槽非空', `${file}:${slot.line}`, `${tag} 槽位「${key}」为空或占位`);
        else pass('PRD功能槽非空', `${tag} ${key} 已填`);
      }
      const ux = getSlot(b.lines, 'draft-ux');
      if (!ux) fail('PRD功能槽完备', where, `${tag} 缺槽位「draft-ux」`);
      else if (isEmptyVal(ux.val) || !DRAFT_UX_ENUM.includes(ux.val.trim()))
        fail('PRDdraftux枚举', `${file}:${ux.line}`, `${tag} draft-ux 取值「${ux.val.trim()}」非法，须 ∈ {需要,不需要}`);
      else pass('PRDdraftux枚举', `${tag} draft-ux=${ux.val.trim()}`);
      // AC ≥1（非占位列表项）
      const acItems = b.lines.filter(ln => !ln.commented && reListItem.test(ln.text) && !ln.text.includes(PLACEHOLDER));
      if (acItems.length === 0) fail('PRD功能AC存在', where, `${tag} 无有效 Acceptance Criteria 条目`);
      else pass('PRD功能AC存在', `${tag} 有 ${acItems.length} 条 AC`);
      // 收集实体供交叉对账
      const ent = getSlot(b.lines, '涉及实体');
      if (ent && !isEmptyVal(ent.val)) {
        ent.val.split(/[,，、]/).map(s => s.trim()).filter(Boolean).forEach(e => entities.push(e));
      }
    }
  }
  return { entities };
}

// ---------------- TRD ----------------
const TRD_SECTIONS = ['技术选型变更', '数据库设计', '接口设计', '测试环境约定', '交互技术方案', '模块拆分', '共享组件建议'];

function checkTRD(path) {
  const lines = readDoc(path);
  const sections = splitSections(lines);
  const file = path;

  for (const title of TRD_SECTIONS) {
    const sec = sectionByTitle(sections, title);
    if (!sec) { fail('TRD段落完备', `${file}`, `缺段落「## ${title}」`); continue; }
    if (['数据库设计', '接口设计'].includes(title)) continue; // 由块校验覆盖
    if (!sectionHasContent(sec)) fail('TRD段落非空', `${file}:${sec.start}`, `段落「## ${title}」为空或仅占位`);
    else pass('TRD段落非空', `「## ${title}」有内容`);
  }

  // 数据库设计 → 表块
  const tables = [];
  const db = sectionByTitle(sections, '数据库设计');
  if (db) {
    const blocks = splitBlocks(db, '表：');
    if (blocks.length === 0) fail('TRD表块存在', `${file}:${db.start}`, '「数据库设计」段无任何「### 表：」块');
    for (const b of blocks) {
      tables.push(b.name);
      const f = getSlot(b.lines, '字段');
      if (f && isEmptyVal(f.val)) fail('TRD表字段非空', `${file}:${f.line}`, `表「${b.name}」字段槽为空或占位`);
    }
  }

  // 接口设计 → 接口块（轻校验：三槽非空）
  const api = sectionByTitle(sections, '接口设计');
  if (api) {
    const blocks = splitBlocks(api, '接口：');
    if (blocks.length === 0) fail('TRD接口块存在', `${file}:${api.start}`, '「接口设计」段无任何「### 接口：」块');
    for (const b of blocks) {
      for (const key of ['请求体', '响应体', '错误码']) {
        const slot = getSlot(b.lines, key);
        if (slot && isEmptyVal(slot.val)) fail('TRD接口槽非空', `${file}:${slot.line}`, `接口「${b.name}」槽位「${key}」为空或占位`);
      }
    }
  }
  return { tables };
}

// ---------------- 交叉一致 ----------------
function checkCross(entities, tables, prdPath, trdPath) {
  const norm = s => s.trim().toLowerCase();
  const tableSet = new Set(tables.map(norm));
  const seen = new Set();
  for (const e of entities) {
    if (seen.has(norm(e))) continue;
    seen.add(norm(e));
    if (!tableSet.has(norm(e)))
      fail('交叉:实体有对应表', `${prdPath} → ${trdPath}`, `PRD 涉及实体「${e}」在 TRD 无对应「### 表：${e}」`);
    else pass('交叉:实体有对应表', `实体「${e}」↔ 表存在`);
  }
}

// ---------------- 主流程 ----------------
function parseArgs(argv) {
  const out = { prd: null, trd: null };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--prd') out.prd = argv[++i];
    else if (argv[i] === '--trd') out.trd = argv[++i];
    else pos.push(argv[i]);
  }
  if (!out.prd && pos[0]) out.prd = pos[0];
  if (!out.trd && pos[1]) out.trd = pos[1];
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.prd && !args.trd) {
    console.error('用法: node check-docs.js <prd.md> <trd.md>  (或 --prd / --trd)');
    process.exit(2);
  }
  let prdRes = null, trdRes = null;
  try {
    if (args.prd) prdRes = checkPRD(args.prd);
    if (args.trd) trdRes = checkTRD(args.trd);
  } catch (e) {
    console.error('linter 自身出错（非产物问题）:', e.message);
    process.exit(2);
  }
  if (prdRes && trdRes) checkCross(prdRes.entities, trdRes.tables, args.prd, args.trd);
  else if (args.prd && args.trd === null) console.log('（仅验 PRD，未做交叉对账——补 trd 参数可对账实体↔表）');

  const fails = findings.filter(f => f.level === 'fail');
  const passes = findings.filter(f => f.level === 'pass');
  console.log(`\n=== check-docs 报告 ===`);
  console.log(`通过 ${passes.length} 项 / 失败 ${fails.length} 项\n`);
  if (fails.length) {
    console.log('❌ FAIL:');
    for (const f of fails) console.log(`  [${f.rule}] ${f.loc}\n      ${f.msg}`);
  } else {
    console.log('✅ 全部结构/一致性判据通过（语义判据仍需人核）');
  }
  process.exit(fails.length ? 1 : 0);
}

main();
