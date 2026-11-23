#!/usr/bin/env python3
"""Orchestrator bookkeeping for one finished split. Input JSON:
{old, new, scope, frs:[ids], clusters:[C-..], items:[B-..], counts:{old:[fr,sc],new:[fr,sc]},
 cq_old:[[q,src,rec,otherwise],...], cq_new:[...], dv_old:[...], dv_new:[...], f100:[...], note}"""
import json, re, sys, glob, subprocess, os, csv, collections
j = json.load(open(os.path.abspath(sys.argv[1])))
os.chdir('/root/specstride-claude')
E = 'docs/ecosystem/'; old, new = j['old'], j['new']; o3, n3 = old[:3], new[:3]
def retest(s): return re.sub(r'\b(PT|CT)-%s-' % o3, r'\1-%s-' % n3, s)
# ---- TSVs
def rw(path, keycol, pick):
    lines = open(path).read().split('\n'); out = []; moved = []
    for l in lines:
        c = l.split('\t')
        if len(c) > 5 and c[0] != keycol and pick(c):
            fi = 3 if keycol == 'origin_id' else 4
            assert c[fi] == old, (c, old)
            c[fi] = new; c[fi+1] = retest(c[fi+1]); moved.append(c[0]); l = '\t'.join(c)
        out.append(l)
    open(path, 'w').write('\n'.join(out)); return moved
frs = set(j.get('frs', [])); cl = set(j.get('clusters', [])); it = set(j.get('items', []))
mf = rw(E+'traceability-frs.tsv', 'origin_id', lambda c: c[0] in frs)
mi = set(rw(E+'traceability-items.tsv', 'b_id', lambda c: c[4] == old and (c[1] in cl or c[0] in it)))
assert set(mf) == frs, (frs - set(mf)); assert it <= mi, it - mi
inv = {r['b_item']: r for r in csv.DictReader(open(E+'research/R18-behaviour-inventory.tsv'), delimiter='\t', quoting=csv.QUOTE_NONE)}
def bnum(b): return int(b[2:])
def ranges(bs):
    ns = sorted(bnum(b) for b in bs); out = []; s = p = ns[0]
    for n in ns[1:]+[None]:
        if n is not None and n == p+1: p = n; continue
        out.append('B-%04d' % s if s == p else 'B-%04d…B-%04d' % (s, p)); s = p = n
    return ', '.join(out)
def expand(r):
    o = []
    for part in r.split(','):
        m = re.match(r'^B-(\d{4})(?:…B-(\d{4}))?$', part.strip()); a = int(m.group(1)); b = int(m.group(2) or a)
        o += ['B-%04d' % n for n in range(a, b+1)]
    return o
def withfr(bs): return sum(1 for b in bs if inv[b]['as_is_coverage'].strip() not in ('', 'none'))
md = open(E+'traceability.md').read().split('\n')
s3a = next(i for i, l in enumerate(md) if l.startswith('## 3. ')); s4 = next(i for i, l in enumerate(md) if l.startswith('## 4. '))
used = collections.defaultdict(set)
for l in md[s3a:s4]:
    m = re.match(r'^\| (C-\d{3})(?:\.([a-z]+))? \|', l)
    if m: used[m.group(1)].add(m.group(2) or '')
def nextsuffix(c):
    import itertools, string
    for n in itertools.count(1):
        for t in itertools.product(string.ascii_lowercase, repeat=n):
            s = ''.join(t)
            if s not in used[c]: used[c].add(s); return s
out = []; rows_new = 0
for i, l in enumerate(md):
    if i < s3a:
        m = re.match(r'^\| ((?:028|011|002) (?:FR|SC)-\d{3}) \|', l)
        if m and m.group(1) in frs:
            l = retest(l.replace('| %s |' % old, '| %s |' % new))
        out.append(l); continue
    if s3a <= i < s4:
        cells = [c.strip() for c in l.strip().strip('|').split(' | ')]
        if len(cells) == 11 and re.match(r'^C-\d{3}', cells[0]) and cells[8] == old:
            bs = expand(cells[4]); mv = [b for b in bs if b in mi]
            if mv and len(mv) == len(bs):
                cells[8] = new; l = '| ' + ' | '.join(cells) + ' |'
            elif mv:
                rest = [b for b in bs if b not in mi]
                cells[4] = ranges(rest); cells[5] = str(len(rest)); cells[6] = str(withfr(rest))
                out.append('| ' + ' | '.join(cells) + ' |')
                c2 = list(cells); c2[0] = cells[0][:5] + '.' + nextsuffix(cells[0][:5]); c2[4] = ranges(mv); c2[5] = str(len(mv)); c2[6] = str(withfr(mv)); c2[8] = new
                l = '| ' + ' | '.join(c2) + ' |'; rows_new += 1
    out.append(l)
md = out
# counts 4.1 cluster rows and total rows; 4.2 rows
fr_rows = list(csv.DictReader(open(E+'traceability-frs.tsv'), delimiter='\t', quoting=csv.QUOTE_NONE))
it_rows = list(csv.DictReader(open(E+'traceability-items.tsv'), delimiter='\t', quoting=csv.QUOTE_NONE))
KEPT = ('ported', 'translated', 'merged-with')
def load(f):
    F = sum(1 for r in fr_rows if r['feature'] == f and ' FR-' in r['origin_id']); Sx = sum(1 for r in fr_rows if r['feature'] == f and ' SC-' in r['origin_id'])
    its = [r for r in it_rows if r['feature'] == f]; k = sum(1 for r in its if r['disposition'].split()[0] in KEPT)
    return '| %s | %d | %d | %d | %d | %d | %d |  |' % (f, F, Sx, len(set(r['cluster'] for r in its)), len(its), k, round(k/6.7))
text = '\n'.join(md)
m = re.search(r'(?m)^\| %s \| \d+ \| \d+ \| \d+ \| \d+ \| \d+ \| \d+ \|[^\n]*$' % re.escape(old), text)
text = text[:m.start()] + load(old) + '\n' + load(new) + text[m.end():]
if rows_new:
    # cluster rows total and per-disposition counts of rows in 4.1
    def bump(mo): return mo.group(0)
    sec3 = text[text.find('## 3. '):text.find('## 4. ')]
    per = collections.Counter(); total = 0
    for l in sec3.split('\n'):
        c = [x.strip() for x in l.strip().strip('|').split(' | ')]
        if len(c) == 11 and re.match(r'^C-\d{3}', c[0]): per[c[7].strip('`').split()[0]] += 1; total += 1
    def fix(mo):
        name = mo.group(1); c = mo.group(0).split(' | '); c[4] = str(per[name]); return ' | '.join(c)
    a = text.find('### 4.1 '); b = text.find('### 4.2 ')
    t41 = re.sub(r'(?m)^\| `([a-z-]+)` \| \d+ \| \d+ \| \d+ \| \d+ \| \d+ \|$', fix, text[a:b])
    t41 = re.sub(r'(?m)^(\| Total \| \d+ \| \d+ \| \d+ \| )\d+( \| \d+ \|)$', lambda mo: mo.group(1)+str(total)+mo.group(2), t41)
    text = text[:a] + t41 + text[b:]
    text = re.sub(r'\d+ rows for 255 clusters', '%d rows for 255 clusters' % total, text)
open(E+'traceability.md', 'w').write(text)
# ---- check script and architecture
s = open(E+'check-traceability.py').read()
if '"%s"' % new not in s:
    s = s.replace('    "142-parallel-units",\n]', '    "142-parallel-units",\n    "%s",  # split of %s\n]' % (new, old)) if '# split of' not in s else re.sub(r'(    "[0-9a-z-]+",  # split of [0-9a-z-]+\n)(\])', lambda mo: mo.group(1) + '    "%s",  # split of %s\n' % (new, old) + mo.group(2), s, count=1)
    k = int(re.search(r'N_WAVE1 = (\d+)', s).group(1)); s = s.replace('N_WAVE1 = %d' % k, 'N_WAVE1 = %d' % (k+1))
    u = re.search(r'UNUSED = \(([^)]*)\)', s); left = [x.strip() for x in u.group(1).split(',') if x.strip() and x.strip().strip('"') != n3]
    s = s.replace(u.group(0), 'UNUSED = (%s%s)' % (', '.join(left), ',' if len(left) == 1 else ''))
    open(E+'check-traceability.py', 'w').write(s)
a = open(E+'architecture.md').read()
if '| %s |' % new not in a:
    a = a.replace('| 114-memory | — | Not specified (owner ruling 17) |', '| %s | %s | **Split of %s in Stage B** (split rule, 2026-09-29) |\n| 114-memory | — | Not specified (owner ruling 17) |' % (new, j['scope'], old))
    open(E+'architecture.md', 'w').write(a)
# ---- queue, register, specs
cons = open(E+'consolidation.md').read()
queue = open(E+'CLARIFY-QUEUE.md').read().rstrip('\n')
last_cq = max(int(x) for x in re.findall(r'(?m)^\| CQ-(\d{3}) \|', queue))
last_dv = max(int(x) for x in re.findall(r'(?m)^\| DV-(\d{3}) \|', cons[cons.find('## 6. Divergence register'):]))
for side, d in (('old', old), ('new', new)):
    cq = j.get('cq_'+side, []); dv = j.get('dv_'+side, [])
    cqmap = {k+1: 'CQ-%03d' % (last_cq+k+1) for k in range(len(cq))}; last_cq += len(cq)
    dvmap = {k+1: 'DV-%03d' % (last_dv+k+1) for k in range(len(dv))}; last_dv += len(dv)
    for k, r in enumerate(cq): queue += '\n| %s | %s | %s | %s | %s | %s | open; raised by feature %s on 2026-09-29 |' % (cqmap[k+1], d[:3], r[0], r[1], r[2], r[3], d[:3])
    if dv:
        L = cons.split('\n'); i = max(n for n, l in enumerate(L) if re.match(r'^\| DV-\d{3} \|', l) and n > cons[:cons.find('## 6. Divergence register')].count('\n'))
        L[i+1:i+1] = ['| %s | %s | %s | %s | %s | Row written in Stage B for feature %s; put to the owner in the clarification round |' % (dvmap[k+1], r[0], r[1], r[2], r[3], d[:3]) for k, r in enumerate(dv)]
        cons = '\n'.join(L); cons = re.sub(r'Count: \d+ rows, DV-001 to DV-\d{3} \(', 'Count: %d rows, DV-001 to DV-%03d (' % (last_dv, last_dv), cons)
        cs = open(E+'check-traceability.py').read(); cs = re.sub(r'N_REGISTER = \d+', 'N_REGISTER = %d' % last_dv, cs); open(E+'check-traceability.py', 'w').write(cs)
    for f in glob.glob('specs/%s/**/*' % d, recursive=True):
        if not os.path.isfile(f) or not f.endswith(('.md', '.json', '.tsv')): continue
        t = open(f, encoding='utf-8', errors='replace').read(); o = t
        t = re.sub(r'DV-new-(\d+)', lambda mo: dvmap.get(int(mo.group(1)), mo.group(0)), t)
        t = re.sub(r'CQ-pending-(\d+)', lambda mo: cqmap.get(int(mo.group(1)), mo.group(0)), t)
        if t != o: open(f, 'w').write(t)
    print(side, cqmap, dvmap)
open(E+'CLARIFY-QUEUE.md', 'w').write(queue+'\n'); open(E+'consolidation.md', 'w').write(cons)
# ---- ledger
p = E+'PROGRESS.md'; s = open(p).read()
tier = re.search(r'\| %s \| 2 \| (top|mid) \|' % re.escape(old), s).group(1)
co, cn = j['counts']['old'], j['counts']['new']
s = re.sub(r'(\| %s \| 2 \| (?:top|mid) \| specify \| done \| [^|]*\| )[^|]*\|' % re.escape(old), lambda mo: mo.group(1) + '%d FR, %d SC after the split | ' % (co[0], co[1]), s)
files = [('specify', 'spec.md', '%d FR, %d SC' % (cn[0], cn[1])), ('clarify', 'spec.md (Clarifications)', ''), ('plan', 'plan.md', ''), ('tasks', 'tasks.md', ''), ('analyze', 'analyze-report.md', '')]
rows = '\n'.join('| %s | 2 | %s | %s | done | `specs/%s/%s` | %s | 2026-09-29 |' % (new, tier, st, new, fn, r) for st, fn, r in files)
s = s.replace('\n### Splits\n', '\n' + rows + '\n\n### Splits\n') if False else s
anchor = s.find('\n\n### Splits')
s = s[:anchor] + '\n' + rows + s[anchor:]
note = '- 2026-09-29: **split done: %s into %s.** %s keeps %d requirements and %d success criteria; %s has %d and %d. Traceability rows moved: %d requirements and success criteria, %d behaviour items.' % (old, new, old, co[0], co[1], new, cn[0], cn[1], len(mf), len(mi))
if j.get('note'): note += ' ' + j['note']
s = s.replace('### Stage B notes\n', '### Stage B notes\n\n' + note, 1); open(p, 'w').write(s)
if j.get('f100'):
    with open(E+'STAGE-B-F100-AMENDMENTS.md', 'a') as f:
        for x in j['f100']: f.write('| %s | %s | no |\n' % (n3, x.replace('|', '/')))
out = subprocess.run(['python3', E+'check-traceability.py'], capture_output=True, text=True).stdout
print([l for l in out.splitlines() if l.startswith('[') and (('F'+o3) in l or ('F'+n3) in l or old in l or new in l or l[1] in 'abcdefg')] or 'check clean for both parts')
subprocess.run(['git', 'add', 'specs/'+old, 'specs/'+new, 'docs/ecosystem', '.specify'], check=True)
subprocess.run(['git', 'commit', '-q', '-m', 'specs(%s, %s): split of %s into %s\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01NUVyhCCu92itppZfrMWwgP' % (o3, n3, old, new)], check=True)
print(subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True).stdout)
