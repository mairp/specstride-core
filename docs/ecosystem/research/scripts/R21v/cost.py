#!/usr/bin/env python3
"""R21v: independent estimate of cost never recorded in the reference run. Usage fields, model name, message id and
timestamps only. Weighted tokens W = in + cw*cache_write + 0.1*cache_read + 5*out; scale fitted as sum(cost)/sum(W)
(ratio estimator) on passes with a recorded cost; applied to passes without."""
import json, glob, os, pickle, datetime, bisect, collections, sys, random
CUT = 1790637900
TX = '/root/.claude/projects/-root-agentic-netops-srl'
R = [r for r in pickle.load(open('real.pkl', 'rb')) if r['path'].startswith('/root/agentic-netops-srl/')]
P = sorted((p for r in R for p in r['passes']), key=lambda p: p['start'])
starts = [p['start'] for p in P]
def ts(s): return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
def usage(f, seen):
    first = None; out = collections.Counter(); models = collections.Counter()
    with open(f, errors='replace') as fh:
        for l in fh:
            try: d = json.loads(l)
            except Exception: continue
            t = d.get('timestamp')
            if t:
                tt = ts(t)
                if first is None: first = tt
                if tt > CUT: continue
            m = d.get('message')
            if d.get('type') != 'assistant' or not isinstance(m, dict) or not m.get('usage'): continue
            mid = m.get('id')
            if mid in seen: continue
            seen.add(mid); u = m['usage']
            out['in'] += u.get('input_tokens') or 0; out['cw'] += u.get('cache_creation_input_tokens') or 0
            out['cr'] += u.get('cache_read_input_tokens') or 0; out['out'] += u.get('output_tokens') or 0
            models[m.get('model')] += (u.get('cache_read_input_tokens') or 0)
    return first, out, models
rows = {}; allmodels = {'main': collections.Counter(), 'sub': collections.Counter()}
for f in glob.glob(TX + '/*.jsonl'):
    seen = set(); first, u, mo = usage(f, seen)
    if first is None or first > CUT: continue
    i = bisect.bisect_right(starts, first + 5) - 1
    if i < 0 or not (-5 <= first - starts[i] <= 60) or i in rows: continue
    sub = collections.Counter(); sid = os.path.basename(f)[:-6]
    for sf in glob.glob(os.path.join(TX, sid, 'subagents', '*.jsonl')):
        _, su, smo = usage(sf, seen); sub.update(su); allmodels['sub'].update(smo)
    allmodels['main'].update(mo)
    rows[i] = (u, sub)
print('joined', len(rows), 'of', len(P)); print('cache-read tokens by model', {k: dict(v) for k, v in allmodels.items()})
def W(c, cw): return c['in'] + cw*c['cw'] + 0.1*c['cr'] + 5*c['out']
for cw in (2.0, 1.25):
    for incl_sub in (True, False):
        known = [(P[i].get('cost'), W(u, cw) + (W(s, cw) if incl_sub else 0)) for i, (u, s) in rows.items() if P[i].get('cost')]
        unk = [(P[i], W(u, cw) + (W(s, cw) if incl_sub else 0)) for i, (u, s) in rows.items() if not P[i].get('cost')]
        k = sum(c for c, w in known)/sum(w for c, w in known)
        est = sum(w for p, w in unk)*k
        # leave-half-out spread
        random.seed(1); tot = []
        for _ in range(2000):
            s = random.sample(known, len(known)//2); tot.append(sum(w for p, w in unk)*sum(c for c, w in s)/sum(w for c, w in s))
        tot.sort()
        by = collections.defaultdict(float)
        for p, w in unk: by[p.get('kill') or p.get('out')] += w*k
        print(f"cache-write x{cw} subagents {'in' if incl_sub else 'out'}: known passes {len(known)} recorded ${sum(c for c,w in known):.0f}; $/Mtok-equivalent {k*1e6:.2f}; unrecorded passes {len(unk)} estimate ${est:.0f} (5-95 % of half-sample fits ${tot[100]:.0f}-${tot[1900]:.0f});", {a: round(b) for a, b in by.items()})
ks = [(u, s) for i, (u, s) in rows.items() if P[i].get('cost')]; us = [(u, s) for i, (u, s) in rows.items() if not P[i].get('cost')]
for nm, g in (('cost recorded', ks), ('no cost', us)):
    print(nm, 'main cache-read M', round(sum(u['cr'] for u, s in g)/1e6), 'subagent cache-read M', round(sum(s['cr'] for u, s in g)/1e6))
