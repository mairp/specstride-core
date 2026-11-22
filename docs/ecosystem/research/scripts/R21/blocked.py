#!/usr/bin/env python3
"""Passes that declared themselves blocked on a person (text heuristic over agent_text; ESTIMATE),
plus no-progress tails of runs stopped by proposer_max_iter (measured)."""
import json, re, os, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
runs = json.load(open(os.path.join(D, 'runs.json')))
PAT = re.compile(r"(still blocked|is blocked on|blocked on (a |an |the |seven |three |\w+ )?(operator|human|user|owner|decision)|decisions? (that )?only you|waiting (for|on) (the |an |a )?(operator|human|user|owner)('s)? (decision|input|answer|approval)|needs? (a|an|your|the) (operator|human|owner|user)('s)? (decision|input|approval)|operator decision)", re.I)
tot = collections.defaultdict(lambda: [0, 0.0, 0.0, 0])
rows = []
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']: continue
    txt = []
    for l in open(r['path'], errors='replace'):
        if '"agent_text"' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        t = float(e['ts'])
        if t <= CUTOFF: txt.append((t, e.get('text') or ''))
    n = 0; s = 0.0; c = 0.0
    for p in r['passes']:
        if p['outcome'] == 'evidence': continue
        ts = [x for t, x in txt if p['start'] <= t <= p['end']]
        if not ts: continue
        if PAT.search(ts[-1]) or (len(ts) > 1 and PAT.search(ts[0]) and p['active'] < 300):
            n += 1; s += p['active']; c += p['cost'] or 0
    if n:
        rows.append((r['project'], r['run_id'], r['proposer'], r['stop'], len(r['passes']), n, s / 3600, c))
    for k in ('ALL', r['project']):
        tot[k][0] += n; tot[k][1] += s / 3600; tot[k][2] += c; tot[k][3] += 1 if n else 0
print('| project | run | proposer | run ended with | passes | passes declaring a block | their hours | their recorded cost $ |')
print('|---|---|---|---|---|---|---|---|')
for x in sorted(rows, key=lambda x: -x[5]): print('| %s | %s | %s | %s | %d | %d | %.2f | %.0f |' % x)
print('ALL', tot['ALL'])
print('\nruns stopped by proposer_max_iter')
print('| project | run | proposer | passes | hours | passes with evidence | passes under 2 min | hours in passes under 2 min | recorded cost $ |')
print('|---|---|---|---|---|---|---|---|---|')
a = [0, 0.0, 0, 0.0, 0.0]
for r in runs:
    if r['stop'] != 'proposer_max_iter' or r['store'] == '.lisa': continue
    ps = r['passes']; sh = [p for p in ps if p['active'] < 120]
    c = sum(p['cost'] or 0 for p in ps)
    print('| %s | %s | %s | %d | %.2f | %d | %d | %.2f | %.0f |' % (r['project'], r['run_id'], r['proposer'], len(ps), sum(p['active'] for p in ps) / 3600,
          sum(1 for p in ps if p['outcome'] == 'evidence'), len(sh), sum(p['active'] for p in sh) / 3600, c))
    a[0] += len(ps); a[1] += sum(p['active'] for p in ps) / 3600; a[2] += len(sh); a[3] += sum(p['active'] for p in sh) / 3600; a[4] += c
print('total', a)
