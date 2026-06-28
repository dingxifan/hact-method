import json,re,os,html
OUT=os.environ['OUT']
schema=json.load(open(os.path.join(OUT,'schema.json'),encoding='utf-8'))
purp=json.load(open(os.path.join(OUT,'purposes.json'),encoding='utf-8'))
def clean(x): return re.sub(r'[^A-Za-z0-9_]','_',str(x))[:24] or 'x'
def cmt(s):
    s=(s or '').replace('"','').replace('\n',' ').strip()
    return s
L=["erDiagram"]
rels=[]
for t,v in schema.items():
    pf=purp.get(t,{})
    pfields=pf.get('fields',{})
    L.append("  "+t+" {")
    for c in v["columns"]:
        cname=c["name"]; typ=c["type"]
        tag="PK" if c["pk"] else ("FK" if c["fk"] else "")
        fp=pfields.get(cname,{})
        note=cmt(fp.get('purpose',''))
        if fp.get('confidence')=='name' and note: note=note+" ※推测"
        line=("    "+clean(typ)+" "+cname+(" "+tag if tag else "")).rstrip()
        if note: line+=' "'+note+'"'
        L.append(line)
        if c["fk"] and '.' in c["fk"]:
            rels.append((t,c["fk"].split('.')[0],cname))
    L.append("  }")
for src,tgt,col in rels:
    if tgt in schema: L.append('  '+tgt+' ||--o{ '+src+' : '+col)
mermaid="\n".join(L)
open(os.path.join(OUT,'jhh_schema.mmd'),'w',encoding='utf-8').write(mermaid)

# legend rows (table purposes)
rows=""
for t in schema:
    pf=purp.get(t,{})
    conf=pf.get('confidence','name')
    dot='#22c55e' if conf=='code' else '#f59e0b'
    pp=html.escape(pf.get('purpose','—'))
    rows+='<div class="row"><span class="dot" style="background:%s"></span><b>%s</b> <span class="pp">%s</span></div>'%(dot,t,pp)

tmpl=r'''<!DOCTYPE html><html><head><meta charset="utf-8"><title>JHH-Nortion schema (用途版)</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
<style>
 html,body{margin:0;height:100%;font-family:sans-serif;background:#fafafa}
 header{padding:6px 14px;background:#222;color:#fff;font-size:13px}
 #wrap{width:100%;height:calc(100vh - 30px);overflow:hidden;cursor:grab}
 #graph svg{width:100%!important;height:100%!important;max-width:none!important}
 #legend{position:fixed;top:38px;left:8px;width:300px;max-height:calc(100vh - 60px);overflow:auto;
   background:rgba(255,255,255,.95);border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:12px;
   box-shadow:0 2px 12px rgba(0,0,0,.12);z-index:9}
 #legend h4{margin:0 0 6px;font-size:12px}
 #legend .row{padding:3px 0;line-height:1.4;border-bottom:1px solid #f0f0f0}
 #legend .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}
 #legend .pp{color:#555}
 #legend .foot{margin-top:8px;color:#888;font-size:11px}
 #toggle{position:fixed;top:38px;left:8px;z-index:10;display:none}
</style></head><body>
<header>JHH-Nortion · 真库 schema + 用途考据（9 表 / 85 字段 · 73 实锤 / 12 推断）&nbsp;·&nbsp;<b>滚轮缩放·拖拽平移</b>&nbsp;·&nbsp;字段右侧灰字=用途，<span style="color:#f59e0b">※推测</span>=仅按命名</header>
<div id="legend"><h4>表用途 <span style="font-weight:400;color:#888">（点表名隐藏）</span></h4>__ROWS__
<div class="foot"><span style="color:#22c55e">●</span> 代码实锤&nbsp;&nbsp;<span style="color:#f59e0b">●</span> 命名推断</div></div>
<div id="wrap"><div id="graph" class="mermaid">
__MERMAID__
</div></div>
<script>
 mermaid.initialize({startOnLoad:false});
 (async()=>{
   await mermaid.run({querySelector:'#graph'});
   const svg=document.querySelector('#graph svg');
   svg.removeAttribute('style'); svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
   svgPanZoom(svg,{controlIconsEnabled:true,fit:true,center:true,minZoom:0.05,maxZoom:60,zoomScaleSensitivity:0.4});
   // best-effort: hover tooltip of table purpose on each entity title
   try{
     const PURP=__PURPJSON__;
     svg.querySelectorAll('text').forEach(tx=>{
       const t=(tx.textContent||'').trim();
       if(PURP[t]){const ti=document.createElementNS('http://www.w3.org/2000/svg','title');
         ti.textContent=t+' — '+PURP[t];(tx.parentNode||tx).appendChild(ti);}
     });
   }catch(e){}
   document.getElementById('legend').addEventListener('click',e=>{e.currentTarget.style.display='none';});
 })();
</script></body></html>'''
purpmap={t:purp.get(t,{}).get('purpose','') for t in schema}
out=tmpl.replace('__ROWS__',rows).replace('__MERMAID__',mermaid).replace('__PURPJSON__',json.dumps(purpmap,ensure_ascii=False))
open(os.path.join(OUT,'jhh_schema.html'),'w',encoding='utf-8').write(out)
print("OK html=%d bytes, %d rels"%(len(out),len(rels)))
