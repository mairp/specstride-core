#!/usr/bin/env python3
"""R21v: restarts = a run of the same feature (same project root) starting after an earlier run. Gap = start - previous run's last event."""
import pickle, collections, statistics, re
R = pickle.load(open('real.pkl', 'rb'))
g = collections.defaultdict(list)
for r in R:
    root = re.match(r'(/root/[^/]+(?:/[^/.][^/]*)*?)/\.(?:specstride|wiggum)', r['path']).group(1)
    g[(root, r['feature'])].append(r)
gaps = []; by = collections.defaultdict(list); over = 0
for k, rs in g.items():
    rs.sort(key=lambda r: r['t0'])
    for a, b in zip(rs, rs[1:]):
        d = (b['t0'] - a['t1'])/3600
        if d < 0: over += 1
        gaps.append(d); by[a['stop']].append(d)
def q(v, p): v = sorted(v); return v[int(round(p*(len(v)-1)))]
print('features', len(g), 'multi-run features', sum(1 for v in g.values() if len(v) > 1), 'restarts', len(gaps), 'overlapping', over)
print('gap median %.2f p90 %.2f max %.1f sum %.1f sum<=24h %.1f' % (statistics.median(gaps), q(gaps, .9), max(gaps), sum(gaps), sum(x for x in gaps if x <= 24)))
for k, v in sorted(by.items(), key=lambda kv: -len(kv[1])):
    print('  %-32s n %3d median %.2f sum %.1f' % (k, len(v), statistics.median(v), sum(v)))
print('run endings', collections.Counter(r['stop'] for r in R).most_common())
fin = [(k, rs) for k, rs in g.items()]
cl = [len(rs) for k, rs in g.items() if all(r['fam'] == 'claude' for r in rs)]
print('claude-only features: runs per feature', sorted(cl))
