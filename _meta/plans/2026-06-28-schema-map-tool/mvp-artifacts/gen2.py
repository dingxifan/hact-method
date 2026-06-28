import os
OUT=os.environ['OUT']
mermaid=open(os.path.join(OUT,'jhh_schema.mmd'),encoding='utf-8').read()
doc='''<!DOCTYPE html><html><head><meta charset="utf-8"><title>JHH-Nortion schema</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
<style>
 html,body{margin:0;height:100%;font-family:sans-serif;background:#fafafa}
 header{padding:6px 14px;background:#222;color:#fff;font-size:13px}
 #wrap{width:100%;height:calc(100vh - 30px);overflow:hidden;cursor:grab}
 #graph{width:100%;height:100%}
 #graph svg{width:100%!important;height:100%!important;max-width:none!important}
</style></head><body>
<header>JHH-Nortion · 真库 schema（9 表 · 7 连接）&nbsp;·&nbsp;<b>滚轮缩放 / 拖拽平移 / 右上角 +−⟲</b></header>
<div id="wrap"><div id="graph" class="mermaid">
'''+mermaid+'''
</div></div>
<script>
 mermaid.initialize({startOnLoad:false});
 (async()=>{
   await mermaid.run({querySelector:'#graph'});
   const svg=document.querySelector('#graph svg');
   svg.removeAttribute('style');
   svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
   svgPanZoom(svg,{controlIconsEnabled:true,fit:true,center:true,
     minZoom:0.1,maxZoom:40,zoomScaleSensitivity:0.4});
 })();
</script></body></html>'''
open(os.path.join(OUT,'jhh_schema.html'),'w',encoding='utf-8').write(doc)
print("rewrote jhh_schema.html with pan/zoom, %d bytes" % len(doc))
