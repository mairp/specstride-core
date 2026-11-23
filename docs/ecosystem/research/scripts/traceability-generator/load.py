import csv,re,collections
E_='/root/specstride-claude/docs/ecosystem/'
def module_of(path):
    name=path.split("/")[-1]
    return re.sub(r"\.(py|sh|md|json|yml|yaml)$","",name)
def load():
    rows=list(csv.DictReader(open(E_+'research/R18-behaviour-inventory.tsv'),delimiter='\t',quoting=csv.QUOTE_NONE))
    cl=collections.OrderedDict()
    for r in rows:
        r['path']=r['evidence'].rsplit(':',1)[0]
        r['module']=module_of(r['path'])
        k=(r['system'],r['module'],r['kind'])
        if k not in cl: cl[k]='C-%03d'%(len(cl)+1)
        r['cluster']=cl[k]
        r['covered']='FR-' in r['as_is_coverage']
    return rows,cl
def table():
    t={}
    for l in open(E_+'research/R18-behaviour-inventory-parity-oracle.md'):
        m=re.match(r'\| (C-\d+) \| (\w+) \| `([^`]+)` \| ([\w-]+) \| (\S+) \| (\d+) \| (\d+) \|',l)
        if m: t[m.group(1)]=m.groups()
    return t
if __name__=='__main__':
    rows,cl=load(); t=table()
    print(len(rows),len(cl),len(t))
    cnt=collections.Counter(r['cluster'] for r in rows)
    unc=collections.Counter(r['cluster'] for r in rows if not r['covered'])
    bad=0
    for k,c in cl.items():
        g=t[c]
        if (g[1],g[2],g[3])!=k or int(g[5])!=cnt[c] or int(g[6])!=unc[c]: bad+=1; print(c,k,g,cnt[c],unc[c])
    print('bad',bad)
    print(collections.Counter(r['path'] for r in rows).most_common(100))
