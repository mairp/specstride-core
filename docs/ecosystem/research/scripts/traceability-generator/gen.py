import collections,re,string
from load import load,table
from classify import classify
from frdata import FR
import os; OUT=os.environ.get('OUT','/nonexistent/')
FEATURES=collections.OrderedDict([
('100','100-specstride'),('141','141-parity-oracle'),('101','101-gate-and-verdict'),('117','117-critic-grounding-and-prompt'),
('102','102-run-control'),('119','119-front-door-and-presenter'),('103','103-proposer-pass'),('118','118-pass-supervision-and-jobs'),
('104','104-spec-input'),('105','105-verification'),('106','106-learning'),('107','107-launch-contract'),
('123','123-pipeline-runtime-and-supervisor'),('122','122-detached-runtime'),('108','108-reverse'),('109','109-harness-seam'),
('124','124-harness-discovery-and-roles'),('125','125-adapter-claude'),('126','126-stream-seam-and-invocation'),
('110','110-config-and-terms'),('127','127-quota-budgets-and-pause'),('111','111-event-schema-and-projection'),
('128','128-telemetry-export'),('129','129-run-view-and-status'),('112','112-doctor'),('113','113-host-claude-code'),
('115','115-micro-loop-layer'),
('130','130-adapter-dsh'),('131','131-adapter-codex'),('134','134-adapter-pi'),('138','138-adapter-prime'),
('142','142-parallel-units')])
def fname(f):
    return FEATURES.get(f,f)
def bnum(b): return int(b[2:])
def ranges(bs):
    ns=sorted(bnum(b) for b in bs); out=[]; s=p=ns[0]
    for n in ns[1:]+[None]:
        if n is not None and n==p+1: p=n; continue
        out.append('B-%04d'%s if s==p else 'B-%04d…B-%04d'%(s,p))
        s=p=n
    return ', '.join(out)
def fxsort(s):
    return ', '.join(sorted(set(x.strip() for x in s if x.strip())))
def dvsort(l):
    def key(x):
        m=re.match(r'DV-(\d+)',x); return (0,int(m.group(1))) if m else (1,x)
    return '; '.join(sorted(set(l),key=key))

rows,cl=load(); tab=table()
ct=collections.Counter()
# ---------- FR rows
frrows=[]
for (o,st,d,f,fx,pk,dv,note) in FR:
    tag=o.replace(' ','').replace('-','')
    if pk=='parity': proof='%s; `PT-%s-%s-*`'%(fx,f,tag)
    elif pk=='ct':
        ct[f]+=1; proof='`CT-%s-%d`'%(f,ct[f])
        if fx: proof+=' (028 side: %s)'%fx
    elif pk=='dv': proof='register row '+dv.split(';')[0].strip()
    elif pk=='roadmap': proof='roadmap entry "%s"'%dv.replace('roadmap: ','')
    else: proof='written justification (notes)'
    if d.split()[0] in('superseded-by','dropped'): note=(note+'. ' if note else '')+'**Disposition approved 2026-09-29 (ruling K8)**'
    frrows.append(dict(o=o,st=st,d=d,f=f,proof=proof,dv=dv,note=note))
# ---------- items
for r in rows:
    r.update(classify(r))
groups=collections.OrderedDict()
for r in rows:
    groups.setdefault(r['cluster'],collections.OrderedDict()).setdefault((r['d'],r['f']),[]).append(r)
subrows=[]
for c,g in groups.items():
    multi=len(g)>1
    for i,((d,f),its) in enumerate(g.items()):
        rid=c+('.'+string.ascii_lowercase[i] if multi else '')
        ctid=None
        if any(x['proof'].startswith('CT-') for x in its):
            ct[f]+=1; ctid='CT-%s-%d'%(f,ct[f])
        for x in its:
            x['row']=rid
            if d.split()[0] in ('ported','translated','merged-with'):
                x['proof_out']=ctid if ctid else '%s; PT-%s-%s-*'%(x['fx'],f,c)
            else: x['proof_out']=x['proof']
            x['dv_out']=dvsort(x['dv'])
        subrows.append(dict(rid=rid,c=c,sys=its[0]['system'],mod=its[0]['module'],kind=its[0]['kind'],bs=[x['b_item'] for x in its],
            cov=sum(1 for x in its if x['covered']),d=d,f=f,fx=fxsort(sum([x['fx'].split(',') for x in its],[])) if not ctid else ctid,
            dv=dvsort(sum([x['dv'] for x in its],[]))))
# ---------- TSVs
with open(OUT+'traceability-items.tsv','w') as fh:
    fh.write('b_id\tcluster\tsystem\tdisposition\tfeature\tproof\tdv_or_roadmap\n')
    for r in rows:
        fh.write('\t'.join([r['b_item'],r['cluster'],r['system'],r['d'],fname(r['f']),r['proof_out'],r['dv_out']])+'\n')
with open(OUT+'traceability-frs.tsv','w') as fh:
    fh.write('origin_id\tsystem\tdisposition\tfeature\tproof\tdv_or_roadmap\n')
    for r in frrows:
        fh.write('\t'.join([r['o'],r['o'].split()[0],r['d'],fname(r['f']),r['proof'].replace('`',''),r['dv']])+'\n')
# ---------- summaries
DISP=['ported','merged-with','translated','superseded-by','deferred','dropped']
def dk(d): return d.split()[0]
frc=collections.Counter(dk(r['d']) for r in frrows if ' FR-' in r['o'])
scc=collections.Counter(dk(r['d']) for r in frrows if ' SC-' in r['o'])
bc=collections.Counter(dk(r['d']) for r in rows)
src=collections.Counter(dk(s['d']) for s in subrows)
clu=collections.Counter(); split=0
for c,g in groups.items():
    ds=set(dk(d) for d,f in g)
    if len(ds)==1: clu[ds.pop()]+=1
    else: split+=1
feat_fr=collections.Counter(r['f'] for r in frrows if ' FR-' in r['o'])
feat_sc=collections.Counter(r['f'] for r in frrows if ' SC-' in r['o'])
feat_b=collections.Counter(r['f'] for r in rows)
feat_bw=collections.Counter(r['f'] for r in rows if dk(r['d']) in('ported','translated','merged-with'))
feat_cl=collections.defaultdict(set)
for s in subrows: feat_cl[s['f']].add(s['c'])
# mismatch between item and covering FR
frd={r['o']:dk(r['d']) for r in frrows}
mism=collections.Counter(); 
for r in rows:
    for m in re.findall(r'(0\d\d (?:FR|SC)-\d+)',r['as_is_coverage']):
        if m in frd:
            a=frd[m]; b=dk(r['d'])
            cls=lambda z:'kept' if z in('ported','translated','merged-with') else z
            if cls(a)!=cls(b): mism[(m,frd[m],b)]+=1
# ---------- markdown
L=[]
A=L.append
A('# Traceability\n')
A('Stage A synthesis artifact. Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`), with the rulings applied.')
A('Every `superseded-by` and `dropped` row is approved 2026-09-29 (ruling K8). Section 4.6 lists what the rulings changed here.\n')
A('This file is generated. Its companions in the same directory are the machine-readable copies:\n')
A('| File | Content |\n|---|---|')
A('| `traceability-frs.tsv` | The 133 rows of section 2, keyed by `origin_id` |')
A('| `traceability-items.tsv` | One line per behaviour item, `B-0001` to `B-2783`, with its cluster, disposition, destination feature, proof and register or roadmap reference |')
A('| `check-traceability.py` | The first half of the coverage check of the cross-feature review. Run it with `python3 docs/ecosystem/check-traceability.py` |\n')
A('Sources: `research/R19-consolidation-map.md` (draft dispositions, re-mapped here), `research/R18-behaviour-inventory.tsv`')
A('(items), `research/R18-behaviour-inventory-parity-oracle.md` (clusters, fixture families FX-01 to FX-37, normalization')
A('rules N-01 to N-28), `consolidation.md` (divergence register DV-001 to DV-083, conflicts, defects), `architecture.md`')
A('section 14 (the 31 Wave 1 features and the umbrella), `roadmap.md`, `APPROVAL.md` (the owner\'s rulings; ruling 19 for the')
A('shape of this file, rulings 32, 32a and 32b for the adapters of dsh, Codex, pi and prime). Feature numbers and names are')
A('those of `architecture.md` section 14.\n')
A('One registry entry of the baseline is specific to the owner\'s machines. It is written "a locally registered backend".\n')
A('## 1. Rules\n')
A('### 1.1 The six dispositions and their proofs\n')
A('| Disposition | Meaning | Proof written in this file |\n|---|---|---|')
A('| `ported` | Reproduced as it is | A parity test: fixture families `FX-nn` and the test name pattern |')
A('| `merged-with <id>` | Combined with an equivalent from another system | A parity test for the 028 or 011 side; a characterization test `CT-<feature>-<n>` for a Lisa side |')
A('| `translated` | The behaviour survives and its form changes under an owner decision | A parity test through the documented mapping: the register row or rule that holds the mapping is named |')
A('| `superseded-by <id>` | Replaced on purpose | The divergence register row, `DV-nnn` in `consolidation.md`. Approved 2026-09-29 (ruling K8) |')
A('| `deferred <wave>` | Kept for a later wave | The roadmap entry. Waves are written `2` and `3+` |')
A('| `dropped` | Not carried over | The written justification. Approved 2026-09-29 (ruling K8) |\n')
A('### 1.2 How a register row decides between `ported`, `translated` and `superseded-by`\n')
A('The oracle handling of a register row decides, so that the disposition says which proof exists:\n')
A('| Oracle handling in `consolidation.md` section 6 | Disposition of the as-is behaviour | Reason |\n|---|---|---|')
A('| off; not observable; none needed; no divergence | `ported`, with the row named | The `parity` profile reproduces the as-is behaviour, so a parity test proves it. The new default is proven by its own tests |')
A('| mapped; a normalization rule N-xx | `translated`, with the row named | The comparison runs through a mapping table |')
A('| waiver; not compared; not carried | `superseded-by <row>` | No parity test can pass; the register row is the proof |\n')
A('### 1.3 Defaults by kind of behaviour item\n')
A('| Kind | Default | Mapping |\n|---|---|---|')
A('| `behaviour`, `stop-reason`, `output-line` | `ported` | Output lines that start with an implementation file name are `translated` (DV-066, N-15). `[MOL-*]` and `[DIGEST]` lines are `translated` (DV-033, DV-007, N-20) |')
A('| `event` | `translated` | DV-007: compared in the compatibility projection (N-12, N-13, N-14) |')
A('| `file` | `translated` | DV-006: compared by logical name through the layout table (N-02). Template files that are read as data are `ported` |')
A('| `env` | `translated` | DV-027: the variable name stays as an alias of a config key |')
A('| `cli-command`, `cli-flag` | `ported` for the engine, the front door and the launcher; `translated` for every other module | DV-066: the command becomes a verb of the one `specstride` CLI or an internal call |')
A('| `exit-code` | `ported` for a process that stays a process; `translated` for a component that the engine calls in-process | Layering rule LR-6 and `consolidation.md` section 3: the value is kept as the `exit_code` field of a result record |\n')
A('An `env` or flag item goes to the feature that owns the behaviour the setting controls. Feature 110 owns the key')
A('name, the alias table and the precedence, and receives only the items about configuration loading itself.\n')
A('### 1.4 The merge rule\n')
A('| # | Rule |\n|---|---|')
A('| 1 | Where systems overlap, 028 and 011 win, because parity binds them |')
A('| 2 | Lisa wins where 028 and 011 are silent and its behaviour is sound: atomic writes (002 FR-013), exit 70 on an uncaught error (002 FR-005), the budget ledger (002 FR-041, 002 FR-042 with the fix of DV-063) |')
A('| 3 | A Lisa row that loses to 028 on purpose is `superseded-by` the register row that records it (DV-040, DV-042, DV-043) |')
A('| 4 | Implementation-describing requirements are `translated` or `superseded-by`, never skipped: 028 FR-029, 028 FR-030, 028 SC-008, 011 FR-009, 011 FR-010, 011 SC-001 |')
A('| 5 | Legacy-compatibility behaviour is `superseded-by` the rows of decision 3: DV-036, DV-037, DV-038, DV-039 |')
A('| 6 | A documented defect is preserved, and therefore `ported`, unless `consolidation.md` section 5.3 marks it fix or drop |')
A('| 7 | Behaviour that belongs to dsh, Codex or prime goes to the adapter feature of that harness (130, 131, 138) and is `ported` or `translated` by the rules of sections 1.2 and 1.3, because every parity test passes before any release (owner rulings 32, 32b). Behaviour of a harness that stays in a later wave would be `deferred 3+` to its adapter feature; the inventory holds no such item |')
A('| 8 | Behaviour of the locally registered backend is `superseded-by DV-064`: a consumer declares such a harness in the open registry |\n')
A('### 1.5 How a cluster row covers its items\n')
A('| # | Rule |\n|---|---|')
A('| 1 | A cluster is the set of items with the same system, source module and kind (R18 Appendix A). There are 255 |')
A('| 2 | A cluster whose items all have the same disposition and destination feature has one row. Any other cluster is split into sub-rows `C-nnn.a`, `C-nnn.b`, and so on, one per pair of disposition and destination |')
A('| 3 | A row names its items by range. Every item is in exactly one row. `traceability-items.tsv` holds the same assignment per item, and the check script proves that all 2,783 appear once |')
A('| 4 | The proving parity test of an item is named `PT-<feature>-<cluster>-*` and runs on the fixture families of its row. The proving test of a requirement is named `PT-<feature>-<origin>-*`, for example `PT-104-028FR001-*` |')
A('| 5 | A test may claim an item only if its fixture executed the item\'s evidence line (R18 O-8). The fixture families here are assigned by subject; the exercise map of feature 141 confirms or corrects them |')
A('| 6 | Destination `roadmap` means a roadmap entry without a feature number; the entry is named. Destination `none` is used only with `dropped` |\n')
A('## 2. As-is requirements and success criteria\n')
A('110 requirements (028: 30, 011: 27, 002: 53) and 23 success criteria (028: 8, 011: 8, 002: 7).\n')
for sysn,title in (('028','028 Specstride'),('011','011 mixture-of-loops'),('002','002 Lisa')):
    A('### %s\n'%title)
    A('| Origin | Statement | Disposition | Destination | Proving test | Register or roadmap | Notes |\n|---|---|---|---|---|---|---|')
    for r in frrows:
        if r['o'].startswith(sysn):
            A('| %s | %s | `%s` | %s | %s | %s | %s |'%(r['o'],r['st'],r['d'],fname(r['f']),r['proof'],r['dv'] or '—',r['note'] or '—'))
    A('')
A('## 3. Behaviour items, by cluster\n')
A('%d rows for 255 clusters and 2,783 items. "With FR" is the number of items that an as-is requirement states.'%len(subrows))
A('The proving test of every `ported`, `merged-with` and `translated` row is `PT-<feature>-<cluster>-*` on the fixture')
A('families named, except where a characterization test `CT-` is named.\n')
A('| Row | System | Module | Kind | B-items | Count | With FR | Disposition | Destination | Fixtures or test | Register or roadmap |\n|---|---|---|---|---|---|---|---|---|---|---|')
for s in subrows:
    A('| %s | %s | `%s` | %s | %s | %d | %d | `%s` | %s | %s | %s |'%(s['rid'],s['sys'],s['mod'],s['kind'],ranges(s['bs']),len(s['bs']),s['cov'],s['d'],fname(s['f']),s['fx'] or '—',s['dv'] or '—'))
A('')
A('## 4. Summaries\n')
A('### 4.1 Counts per disposition\n')
A('| Disposition | FRs | SCs | Clusters with one disposition | Cluster rows | B-items |\n|---|---|---|---|---|---|')
for d in DISP:
    A('| `%s` | %d | %d | %d | %d | %d |'%(d,frc[d],scc[d],clu[d],src[d],bc[d]))
A('| Clusters split over several dispositions | — | — | %d | — | — |'%split)
A('| Total | %d | %d | %d | %d | %d |\n'%(sum(frc.values()),sum(scc.values()),sum(clu.values())+split,len(subrows),sum(bc.values())))
A('### 4.2 Load per destination feature\n')
A('"Parity items" are the items that are `ported`, `merged-with` or `translated`. "Estimate" is parity items divided by')
A('6.7, the measured grain of items per requirement (R15 F-08); it excludes every requirement that comes from research and')
A('not from as-is behaviour. A feature is flagged above about 270 items, which is 40 requirements.\n')
A('| Destination | FRs | SCs | Clusters | B-items | Parity items | Estimate | Flag |\n|---|---|---|---|---|---|---|---|')
order=list(FEATURES)+['120-host-dsh','121-kanban-ui','roadmap','none']
for f in order:
    n=feat_b[f]; 
    if f in ('120-host-dsh',) and not (n or feat_fr[f] or feat_sc[f]): 
        A('| %s | 0 | 0 | 0 | 0 | 0 | 0 | |'%f); continue
    flag='**heavy**' if feat_bw[f]>270 else ''
    A('| %s | %d | %d | %d | %d | %d | %d | %s |'%(fname(f),feat_fr[f],feat_sc[f],len(feat_cl[f]),n,feat_bw[f],round(feat_bw[f]/6.7),flag))
A('| Total | %d | %d | — | %d | %d | — | |\n'%(sum(feat_fr.values()),sum(feat_sc.values()),sum(feat_b.values()),sum(feat_bw.values())))
heavy=[f for f in feat_bw if feat_bw[f]>270]
A('Flagged: '+', '.join('%s with %d parity items, about %d requirements'%(fname(f),feat_bw[f],round(feat_bw[f]/6.7)) for f in heavy)+'.')
A('`architecture.md` section 14 keeps 108 as one feature with two requirement groups and splits it only if')
A('`speckit-specify` yields more than about 45 requirements. This count says the split is likely.\n')
top=sorted(feat_b.items(),key=lambda x:-x[1])[:5]
A('Heaviest five by B-items: '+'; '.join('%s %d'%(fname(f),n) for f,n in top)+'.\n')
A('The five features the owner added to Wave 1: '+'; '.join('%s %d items, %d of them parity items'%(fname(f),feat_b[f],feat_bw[f]) for f in ('130','131','134','138','142'))+'.')
A('None is near the flag. 142-parallel-units also receives 002 FR-048.\n')
A('Features that receive no as-is item: 141-parity-oracle, 129-run-view-and-status, 112-doctor, 115-micro-loop-layer,')
A('134-adapter-pi, 142-parallel-units. Their requirements come from research. 141 receives 011 SC-008. 129 receives')
A('002 FR-017, which is superseded. 142 receives 002 FR-048. 134 receives nothing: pi has no adapter in any of the three systems.\n')
A('### 4.3 Approved as `superseded-by` or `dropped`\n')
A('The owner approved all of them on 2026-09-29 (ruling K8): 2 dropped and 11 superseded requirements and success criteria,')
A('and %d superseded or dropped behaviour items, each with its register row or written justification.\n'%(bc['superseded-by']+bc['dropped']))
A('Requirements and success criteria:\n')
A('| Origin | Disposition | Register row | Destination |\n|---|---|---|---|')
for r in frrows:
    if dk(r['d']) in('superseded-by','dropped'):
        A('| %s | `%s` | %s | %s |'%(r['o'],r['d'],r['dv'],fname(r['f'])))
A('')
A('Behaviour items, grouped by register row:\n')
SUBJ={'DV-004':'Default proposer and critic','DV-009':'Default mode `generate`','DV-022':'The `mkdir` lock fallback that is never released (D-06)',
'DV-023':'The install-root `.env` layer and `.env.example`','DV-024':'Settings that resume does not replay; ignored write failure (D-22, D-23)',
'DV-036':'`wiggum` alias, `WIGGUM_*` variables, `.wiggum/` state directory','DV-037':'Migrations of the pre-v2 layout','DV-038':'Legacy spellings in the launch contract',
'DV-056':'`bin/onboard-skill`','DV-061':'`specstride-digest.sh`, the `MOL_VIA` reminder, five contract keys with no reader','DV-062':'Fixed temporary file of `specstride phases`',
'DV-064':'The closed registry and the locally registered backend','DV-065':'Behaviour of the Python interpreter and of a missing `python3`','DV-073':'Explicit format `openspec` exits 3'}
g=collections.defaultdict(list)
for r in rows:
    if dk(r['d']) in('superseded-by','dropped'): g[(r['d'],r['dv_out'])].append(r)
A('| Disposition | Subject | B-items | Count | Destinations |\n|---|---|---|---|---|')
for (d,dv),its in sorted(g.items(),key=lambda x:x[0][1]):
    A('| `%s` | %s | %s | %d | %s |'%(d,SUBJ.get(dv,dv),ranges([x['b_item'] for x in its]),len(its),', '.join(sorted(set(fname(x['f']) for x in its)))))
A('')
A('Written justifications for `dropped`:\n')
A('| Subject | Justification |\n|---|---|')
A('| 011 FR-026; B-2492, B-2498 | The reminder exists to steer a model toward the scripts. One CLI with terse output (decision 16) removes the cause (D-14) |')
A('| 011 SC-002 | Merge automation of the repository is not product behaviour |')
A('| B-0338 to B-0345 | `specstride-digest.sh` is hard-wired to one workdir, one feature and one phase (D-03). The digest line and `specstride status` replace it |')
A('| B-2489 | Five configuration keys are written by the bootstrap and read by no code (D-12). The contract hashes differ anyway (DV-008) |\n')
A('### 4.4 Deferred\n')
A('No behaviour item is deferred: the 136 items of dsh (66), Codex (8) and prime (62) moved to Wave 1 (owner ruling 32).')
A('%d requirements and %d success criteria stay deferred, all from 002.\n'%(frc['deferred'],scc['deferred']))
g=collections.defaultdict(list)
for r in rows:
    if dk(r['d'])=='deferred': g[(r['d'],r['f'])].append(r)
A('| Disposition | Destination | B-items | FRs and SCs |\n|---|---|---|---|')
fd=collections.Counter((r['d'],r['f'] if r['f']!='roadmap' else r['dv'].replace('roadmap: ','roadmap, "')+'"') for r in frrows if dk(r['d'])=='deferred')
for k,its in sorted(g.items()): A('| `%s` | %s | %d | 0 |'%(k[0],fname(k[1]),len(its)))
for k,n in sorted(fd.items()): A('| `%s` | %s | 0 | %d |'%(k[0],k[1],n))
A('')
A('### 4.5 Items whose disposition differs in class from the requirement that states them\n')
A('A requirement has one disposition; the items under it may differ, because an item is narrower. The table lists every')
A('case where the requirement is kept and an item is not, or the reverse.\n')
A('| Requirement | Its disposition | Item disposition | Items |\n|---|---|---|---|')
for (m,a,b),n in sorted(mism.items()): A('| %s | `%s` | `%s` | %d |'%(m,a,b,n))
A('')
A('### 4.6 What the rulings of 2026-09-29 changed in this file\n')
A('| Ruling | Register row | Change here |\n|---|---|---|')
A('| 32, 32a, 32b | — | 136 items leave `deferred 3+`: 66 to 130-adapter-dsh, 8 to 131-adapter-codex, 62 to 138-adapter-prime, each `ported` or `translated` with fixture families. 134-adapter-pi receives no as-is item. The 19 items of the closed registry and the locally registered backend stay `superseded-by DV-064` |')
A('| 56, D2, D3 | DV-080 | 002 FR-048 leaves `deferred 3+` and is `translated` to 142-parallel-units, proved by `CT-142-1`. 002 FR-039, FR-040, FR-043, FR-044, FR-045 and FR-047 stay `deferred 3+` |')
A('| 20, 70 | — | No row changes: no requirement or success criterion of 002 describes the Agent SDK harness (section 5, item 15) |')
A('| 48 | DV-079 | No row changes: the option has no as-is item, and no row cited the roadmap entry that was removed |')
A('| 57, 57a, D1 | DV-081 | B-0981 and B-0831 to B-0833 (the Codex critic transport and its settings) cite DV-081 |')
A('| K3 | DV-082 | B-0803, B-0864 and B-1114 (plan staleness at critic start) cite DV-082 and keep their dispositions, since the `parity` profile checks at critic start as today. 002 FR-016 cites it for the check at resume |')
A('| K2 | DV-021 | No disposition changes: 028 FR-016, 002 FR-016 and B-1494 to B-1496 already compare through the exit-code map |')
A('| 43 | DV-083 | No row changes: the baseline captures no content, so no as-is item exists |')
A('| K8 | — | Every `superseded-by` and `dropped` row says "approved 2026-09-29 (ruling K8)" |')
A('')
return_data=dict(bc=bc,frc=frc,scc=scc,clu=clu,split=split,src=src,top=top,heavy=heavy,nsub=len(subrows),rows=rows,feat_b=feat_b)
S5=open('section5.md').read()
L.append(S5)
open(OUT+'traceability.md','w').write('\n'.join(L)+'\n')
print(dict(frc),dict(scc),dict(clu),split,dict(src),dict(bc)); print(top); print(len(subrows)); print(sorted(mism.items())[:40])
import json
asset=collections.Counter()
for r in rows:
    if r['path'].startswith('telemetry/'): asset['telemetry stack']+=1
    if 'speckit_templates' in r['path']: asset['templates']+=1
    if r['path'].endswith('SKILL.md'): asset['skill']+=1
    if r['path']=='lib/backend_overlay.py' : asset['overlay']+=1
    if r['path'] in('lib/banner.py','lib/theme.py','lib/present.py'): asset['presenter']+=1
    if r['path']=='lib/observability_policy.py': asset['policy']+=1
    if r['dv_out'] and 'DV-036' in r['dv_out'] and dk(r['d'])=='translated': asset['mixed legacy']+=1
print(asset)
