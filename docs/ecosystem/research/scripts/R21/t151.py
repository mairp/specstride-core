#!/usr/bin/env python3
"""When did each T151 acceptance run first fail, and how long did it keep running afterwards?
Read-only. Sources: bin/acceptance/p15-t151r*/{plan.tsv,results.tsv} and the evidence base of each run
(.evidence/*/acceptance-*-p15-t151r*/<scope>/<files>), using file modification times."""
import os, glob, re, datetime
ROOT = '/root/agentic-netops-srl'
fmt = lambda t: datetime.datetime.fromtimestamp(t).strftime('%m-%d %H:%M')
tot_after = tot_run = 0.0
print('| run | start | end | duration h | result rows | first failing row (scope step rc) | row index / rows | first failure known at | h before | h after first failure | failing rows |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for d in sorted(glob.glob(ROOT + '/bin/acceptance/p15-t151r*'), key=lambda p: int(re.search(r'r(\d+)$', p).group(1))):
    name = os.path.basename(d)
    plan, res = d + '/plan.tsv', d + '/results.tsv'
    if not os.path.exists(res):
        print('| %s | %s | - | - | no results.tsv | - | - | - | - | - | - |' % (name, fmt(os.path.getmtime(d)))); continue
    start = os.path.getmtime(plan) if os.path.exists(plan) else os.path.getmtime(d)
    end = os.path.getmtime(res)
    rows = [l.rstrip('\n').split('\t') for l in open(res) if l.strip()]
    fails = [(i, r) for i, r in enumerate(rows) if len(r) >= 3 and r[2].strip() not in ('0', '')]
    bases = glob.glob(ROOT + '/.evidence/*/acceptance-*-' + name)
    known = None; src = ''
    if fails and bases:
        scope, step = fails[0][1][0], fails[0][1][1]
        cands = []
        for b in bases:
            for f in glob.glob(os.path.join(b, scope, '*')) + glob.glob(os.path.join(b, scope + '.' + step, '*')) + glob.glob(os.path.join(b, scope + '.' + step)):
                if step in os.path.basename(f) or f.endswith(scope + '.' + step):
                    m = os.path.getmtime(f)
                    if start - 60 <= m <= end + 60: cands.append(m)
        if cands:
            known = max(cands); src = 'mtime of step files'
    dur = (end - start) / 3600
    if fails and known is None:
        # fall back to row proportion (estimate)
        known = start + (end - start) * (fails[0][0] + 1) / len(rows); src = 'ESTIMATE by row position'
    if fails:
        after = (end - known) / 3600
        tot_after += after
        f = fails[0][1]
        print('| %s | %s | %s | %.2f | %d | %s %s %s | %d / %d | %s (%s) | %.2f | %.2f | %d |' % (
            name, fmt(start), fmt(end), dur, len(rows), f[0], f[1], f[2], fails[0][0] + 1, len(rows), fmt(known), src,
            (known - start) / 3600, after, len(fails)))
    else:
        print('| %s | %s | %s | %.2f | %d | none | - | - | - | - | 0 |' % (name, fmt(start), fmt(end), dur, len(rows)))
    tot_run += dur
print('\ntotal run hours (runs with results.tsv) %.2f ; hours after the first failing step was known %.2f' % (tot_run, tot_after))
