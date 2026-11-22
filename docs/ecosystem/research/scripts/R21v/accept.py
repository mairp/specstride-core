#!/usr/bin/env python3
"""R21v: time an acceptance run kept running after its first failing step was known. Read-only (stat + read)."""
import os, glob, json, re, datetime
B = '/root/agentic-netops-srl/bin/acceptance'; EV = '/root/agentic-netops-srl/.evidence/agentic-netops_agentic-netops-fabric'
CUT = 1790637900
def iso(s):
    try: return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
    except Exception: return None
tot = totafter = 0
for d in sorted(glob.glob(B + '/p15-t151r*'), key=lambda p: int(re.search(r'r(\d+)$', p).group(1))):
    n = re.search(r'(r\d+)$', d).group(1)
    pl, rs = d + '/plan.tsv', d + '/results.tsv'
    if not os.path.exists(rs) or not os.path.exists(pl): print(n, 'missing files', os.listdir(d)); continue
    t0, t1 = os.stat(pl).st_mtime, os.stat(rs).st_mtime
    rows = [l.rstrip('\n').split('\t') for l in open(rs) if l.strip()]
    bad = [(i, r) for i, r in enumerate(rows) if len(r) >= 3 and r[2] not in ('0', 'SKIP')]
    nfail = len(bad)
    evd = [e for e in glob.glob(EV + '/acceptance-*') if e.endswith('-t151' + n)]
    line = f"{n}: dur {(t1-t0)/3600:.2f} h rows {len(rows)} failing {nfail}"
    if t1 > CUT: line += ' (ends after cutoff)'
    if bad and evd:
        i, r = bad[0]
        f = f"{evd[0]}/{r[0]}/acceptance.{r[1]}.json"
        if os.path.exists(f):
            tm = os.stat(f).st_mtime
            j = json.load(open(f)); inner = {k: v for k, v in j.items() if re.search(r'time|_at$|start|finish|end', k)}
            line += f" | first fail {r[0]} {r[1]} rc {r[2]} row {i+1}; known after {(tm-t0)/3600:.2f} h; ran on {(t1-tm)/3600:.2f} h; inner clocks {inner}"
            if len(rows) > 20: tot += t1 - t0; totafter += t1 - tm
        else: line += f" | first fail {r[:3]} evidence file not found {f}"
    print(line)
print(f"TOTAL (runs with >20 rows and a located first failure): {tot/3600:.2f} h, after first failure {totafter/3600:.2f} h = {100*totafter/max(tot,1):.0f} %")
