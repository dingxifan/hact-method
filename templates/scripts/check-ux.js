#!/usr/bin/env node
'use strict';
// 有限的引用/覆盖/证据索引检查；不执行 HTML，不证明用户任务可用或用户已接受。
const fs = require('fs');
const path = require('path');
function validate(ver, root) {
  const errors = [], iter = path.join(root, 'iterations', ver);
  const read = file => {
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { errors.push('文件缺失：' + file); return ''; }
    return fs.readFileSync(file, 'utf8');
  };
  const prd = read(path.join(iter,'prd.md')), ux = read(path.join(iter,'ux-flows.md'));
  const map = read(path.join(iter,'prototype-map.md')), html = read(path.join(iter,'prototype.html'));
  const design = read(path.join(root,'design.md'));
  const section = (text, name) => {
    const lines=text.split(/\r?\n/), start=lines.findIndex(l=>l.trim()==='## '+name);
    if(start<0) { errors.push('缺少段落：'+name);return ''; }
    const end=lines.findIndex((l,i)=>i>start && /^##\s/.test(l));
    return lines.slice(start+1,end<0?undefined:end).join('\n');
  };
  const rows = (text,name) => section(text,name).split(/\r?\n/).filter(l=>/^\|/.test(l))
    .map(l=>l.split('|').slice(1,-1).map(v=>v.trim()));
  const ids = (text,re) => [...String(text).matchAll(re)].map(m=>m[0]);
  const ac = [...prd.matchAll(/^\s*-\s*(?:\*\*)?(AC-\d+)\b/gm)].map(m=>m[1]);
  if (!ac.length) errors.push('PRD 无可核对的 AC 定义');
  if(new Set(ac).size!==ac.length) errors.push('PRD AC 定义重复');
  const sceneSection = section(ux,'场景列表'), surfaceSection=section(ux,'动线—界面地图'), flow=section(ux,'流程图');
  if(!/\x60{3}mermaid\b/.test(flow)) errors.push('流程图无 mermaid 块');
  const tasks=[...sceneSection.matchAll(/^### 用户任务：(U\d+)\s+(.+)$/gm)];
  const sceneOwners=new Map(), taskIds=new Set();
  if(!tasks.length) errors.push('场景列表须按用户任务 U-id 分组');
  tasks.forEach((m,i)=>{
    if(taskIds.has(m[1])) errors.push('用户任务重复：'+m[1]);
    taskIds.add(m[1]);
    const body=sceneSection.slice(m.index+m[0].length, tasks[i+1]?.index);
    for(const label of ['目标','起点','完成','相关功能']) {
      const value=body.match(new RegExp('^- '+label+'：(.+)$','m'))?.[1]?.trim();
      if(!value || /待填|TODO|^无$/.test(value)) errors.push(m[1]+' 缺少有效 '+label);
    }
    const scenes=[...body.matchAll(/^- (S\d+)：(.+)$/gm)];
    if(!scenes.length) errors.push(m[1]+' 无场景');
    for(const scene of scenes) {
      if(sceneOwners.has(scene[1])) errors.push('场景重复：'+scene[1]);
      sceneOwners.set(scene[1],m[1]);
    }
  });
  const surfaceRows=surfaceSection.split(/\r?\n/).filter(l=>/^\|/.test(l))
    .map(l=>l.split('|').slice(1,-1).map(v=>v.trim()));
  const surfaceHeader=surfaceRows.find(r=>r[0]==='位置');
  if(!surfaceHeader || surfaceHeader.join('|')!=='位置|形态与名称|承接任务/场景|打开来源|完成/返回位置')
    errors.push('界面地图表头须包含位置/形态与名称/承接任务或场景/打开来源/完成或返回位置');
  const surfaceIds=new Set(), surfaceRefs=new Set(), placedScenes=new Set();
  for(const r of surfaceRows.filter(r=>r[0] && r[0]!=='位置' && !/^-+$/.test(r[0])))
    if(!/^[PDAI]\d+$/.test(r[0])) errors.push('界面位置 ID 须为 P/D/A/I 加数字：'+r[0]);
  for(const r of surfaceRows.filter(r=>/^[PDAI]\d+$/.test(r[0]))) {
    if(surfaceIds.has(r[0])) errors.push('界面位置重复：'+r[0]);
    surfaceIds.add(r[0]);
    if(!r[1] || /待填|TODO/.test(r[1])) errors.push(r[0]+' 缺少有效形态与名称');
    const users=ids(r[2],/\bU\d+\b/g), scenes=ids(r[2],/\bS\d+\b/g);
    if(!users.length || !scenes.length) errors.push(r[0]+' 缺少承接任务/场景');
    for(const u of users) if(!taskIds.has(u)) errors.push('界面地图引用未知用户任务：'+u);
    for(const scene of scenes) {
      placedScenes.add(scene);
      if(!sceneOwners.has(scene) || !users.includes(sceneOwners.get(scene))) errors.push('界面地图场景与用户任务不匹配：'+scene);
    }
    for(const ref of ids((r[3]||'')+' '+(r[4]||''),/\b[PDAI]\d+\b/g)) surfaceRefs.add(ref);
    if(!r[3] || !r[4] || /待填|TODO/.test((r[3]||'')+(r[4]||''))) errors.push(r[0]+' 缺少打开来源或完成/返回位置');
  }
  if(!surfaceIds.size && surfaceSection) errors.push('动线—界面地图无有效位置行');
  for(const ref of surfaceRefs) if(!surfaceIds.has(ref)) errors.push('界面地图引用未知位置：'+ref);
  for(const scene of sceneOwners.keys()) if(!placedScenes.has(scene)) errors.push('场景未落到界面位置：'+scene);
  const pageHeader=design.match(/^##\s+[^\r\n]*页面规格[^\r\n]*$/m);
  let pageText='';
  if(pageHeader) {
    const remaining=design.slice(pageHeader.index+pageHeader[0].length);
    const end=remaining.search(/^##\s/m); pageText=end<0?remaining:remaining.slice(0,end);
  }
  const pages=new Set([...pageText.matchAll(/^###\s+(.+)$/gm)].map(m=>m[1].trim()));
  const anchors=new Set([...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]));
  const covered=new Set(), excluded=new Set(), mappedScenes=new Set();
  const coverage=rows(map,'前端 AC 覆盖');
  const header=coverage.find(r=>r[0]==='AC');
  if(!header || header.join('|')!=='AC|用户任务|场景|HTML 锚点|页面规格') errors.push('AC 表头须包含用户任务/场景/HTML 锚点/页面规格');
  for(const r of coverage.filter(r=>/^AC-\d+$/.test(r[0]))) {
    covered.add(r[0]);
    if(!ac.includes(r[0])) errors.push('映射引用未知 AC：'+r[0]);
    const users=ids(r[1],/\bU\d+\b/g), scenes=ids(r[2],/\bS\d+\b/g);
    if(!users.length || !scenes.length) errors.push(r[0]+' 缺用户任务/场景');
    for(const u of users) if(!taskIds.has(u)) errors.push('未知用户任务：'+u);
    for(const scene of scenes) {
      mappedScenes.add(scene);
      if(!sceneOwners.has(scene) || !users.includes(sceneOwners.get(scene))) errors.push('场景与用户任务不匹配：'+scene);
    }
    const declared=ids(r[3],/#[A-Za-z_][\w:-]*/g).map(v=>v.slice(1));
    if(!declared.length || declared.some(id=>!anchors.has(id))) errors.push(r[0]+' HTML 锚点缺失');
    const titles=String(r[4]||'').replace(/\x60/g,'').split('、').map(v=>v.trim()).filter(Boolean);
    if(!titles.length || titles.some(title=>!pages.has(title))) errors.push(r[0]+' 页面规格引用不存在：'+(r[4]||''));
  }
  for(const r of rows(map,'排除 AC').filter(r=>/^AC-\d+$/.test(r[0]))) {
    if(excluded.has(r[0])) errors.push('排除 AC 重复：'+r[0]);
    excluded.add(r[0]);
    if(!ac.includes(r[0]) || !r[1] || /待填|TODO/.test(r[1])) errors.push('排除 AC 无有效依据：'+r[0]);
  }
  for(const id of ac) {
    if(!covered.has(id) && !excluded.has(id)) errors.push('PRD AC 未声明覆盖或排除：'+id);
    if(covered.has(id) && excluded.has(id)) errors.push('AC 同时覆盖与排除：'+id);
  }
  for(const scene of sceneOwners.keys()) if(!mappedScenes.has(scene)) errors.push('场景无 AC 映射：'+scene);
  const evidence=new Map();
  for(const r of rows(map,'动线验证').filter(r=>/^S\d+$/.test(r[0]))) {
    if(evidence.has(r[0])) errors.push('重复动线证据：'+r[0]);
    evidence.set(r[0],r);
    if(!sceneOwners.has(r[0])) errors.push('证据引用未知场景：'+r[0]);
    if(r[1]!=='通过') { errors.push('动线未通过：'+r[0]+' '+r[1]);continue; }
    const rel=String(r[2]||'').replace(/\x60/g,'');
    const target=path.resolve(root,rel), absRoot=path.resolve(root)+path.sep;
    if(!rel || path.isAbsolute(rel) || !target.startsWith(absRoot) ||
       !fs.existsSync(target) || !fs.statSync(target).isFile() || !fs.readFileSync(target,'utf8').trim())
      errors.push('动线证据缺失或越界：'+r[0]);
  }
  for(const scene of sceneOwners.keys()) if(!evidence.has(scene)) errors.push('缺少动线验证：'+scene);
  return errors;
}
if(require.main===module) {
  const [ver,root='.']=process.argv.slice(2);
  if(!/^v\d+(\.\d+)*$/.test(ver||'')) { console.error('用法：node check-ux.js <vN|vN.M> [根目录]');process.exit(2); }
  const errors=validate(ver,root);
  if(errors.length) { console.error(errors.join('\n'));process.exit(1); }
  console.log('✅ 用户任务/界面地图/AC/页面/证据索引通过；浏览器行为与用户接受仍需实际走查');
}
module.exports={validate};
