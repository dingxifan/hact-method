import json,re,os
OUT=os.environ['OUT']
d=json.load(open(os.path.join(OUT,'jhh_openapi.json')))
defs=d.get('definitions',{})
out={}
for t in sorted(defs):
    cols=[]
    for cname,c in defs[t].get('properties',{}).items():
        desc=c.get('description','') or ''
        typ=c.get('format') or c.get('type') or '?'
        pk='<pk/>' in desc or 'Primary Key' in desc
        m=re.search(r"This is a Foreign Key to `([^`]+)`",desc) or re.search(r"fk table='([^']+)'",desc)
        fk=m.group(1) if m else None
        cols.append({"name":cname,"type":typ,"pk":pk,"fk":fk})
    out[t]={"columns":cols}
open(os.path.join(OUT,'schema.json'),'w',encoding='utf-8').write(json.dumps(out,ensure_ascii=False,indent=1))
# also a compact human-readable spec for the agent
lines=[]
for t,v in out.items():
    lines.append("## "+t)
    for c in v["columns"]:
        tag=" PK" if c["pk"] else (" FK->"+c["fk"] if c["fk"] else "")
        lines.append("  - %s : %s%s"%(c["name"],c["type"],tag))
open(os.path.join(OUT,'schema_spec.txt'),'w',encoding='utf-8').write("\n".join(lines))
print("\n".join(lines))
