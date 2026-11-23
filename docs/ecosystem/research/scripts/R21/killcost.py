#!/usr/bin/env python3
"""Estimate the cost of NETOPS passes that recorded no cost (killed / cut), from Claude Code session transcripts.
Read-only. Transcripts: /root/.claude/projects/-root-agentic-netops-srl/*.jsonl (+ <session>/subagents/*.jsonl).
Method: sum API usage per session (deduplicated by message id), join session -> pass by start time,
fit per-token prices by least squares on passes whose cost WAS recorded, apply to passes without cost."""
import json, os, glob, sys, datetime, collections
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
TX = '/root/.claude/projects/-root-agentic-netops-srl'
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
runs = [r for r in json.load(open(os.path.join(D, 'runs.json'))) if r['project'] == 'NETOPS']


def ep(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()


def usage(path):
    msgs = {}
    first = last = None
    entry = None
    for l in open(path, errors='replace'):
        try: e = json.loads(l)
        except Exception: continue
        ts = e.get('timestamp')
        if ts:
            t = ep(ts)
            if t > CUTOFF: continue
            first = t if first is None else min(first, t)
            last = t if last is None else max(last, t)
        if entry is None and e.get('entrypoint'): entry = e.get('entrypoint')
        if e.get('type') == 'assistant':
            m = e.get('message') or {}
            u = m.get('usage')
            if u and m.get('id'):
                msgs[m['id']] = u
    v = np.zeros(4)
    for u in msgs.values():
        v += np.array([u.get('input_tokens') or 0, u.get('cache_creation_input_tokens') or 0,
                       u.get('cache_read_input_tokens') or 0, u.get('output_tokens') or 0], dtype=float)
    return first, last, v, len(msgs), entry


sessions = []
for f in glob.glob(TX + '/*.jsonl'):
    first, last, v, n, entry = usage(f)
    if first is None or n == 0: continue
    sid = os.path.basename(f)[:-6]
    sub = np.zeros(4); nsub = 0
    for sf in glob.glob(os.path.join(TX, sid, 'subagents', '*.jsonl')):
        _, _, sv, sn, _ = usage(sf)
        sub += sv; nsub += 1
    sessions.append(dict(sid=sid, first=first, last=last, main=v, sub=sub, nsub=nsub, entry=entry))
sessions.sort(key=lambda s: s['first'])
print('sessions with usage', len(sessions), 'entrypoints', collections.Counter(s['entry'] for s in sessions))

passes = [p for r in runs for p in r['passes']]
passes.sort(key=lambda p: p['start'])
used = set(); joined = []
for p in passes:
    best = None
    for s in sessions:
        d = s['first'] - p['start']
        if -1 <= d <= 30 and s['sid'] not in used:
            if best is None or d < best[0]: best = (d, s)
    if best:
        used.add(best[1]['sid']); joined.append((p, best[1]))
print('passes', len(passes), 'joined', len(joined))

known = [(p, s) for p, s in joined if p['cost']]
unk = [(p, s) for p, s in joined if not p['cost']]
for label, tok in (('main only', lambda s: s['main']), ('main + subagents', lambda s: s['main'] + s['sub'])):
    X = np.array([tok(s) for _, s in known]); y = np.array([p['cost'] for p, _ in known])
    w, res, rk, sv = np.linalg.lstsq(X, y, rcond=None)
    pred = X @ w
    ss = 1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()
    print('\nfit on', label, 'n=%d' % len(known), 'USD per M tokens [input, cache write, cache read, output] =', np.round(w * 1e6, 3), 'R2=%.4f' % ss,
          'median abs err $%.2f' % np.median(np.abs(y - pred)), 'sum known $%.0f predicted $%.0f' % (y.sum(), pred.sum()))
    Xu = np.array([tok(s) for _, s in unk])
    pu = Xu @ w
    by = collections.defaultdict(lambda: [0, 0.0, 0.0, np.zeros(4)])
    for (p, s), c in zip(unk, pu):
        b = by[p['outcome']]; b[0] += 1; b[1] += c; b[2] += p['active'] / 3600; b[3] += tok(s)
    for k, b in by.items():
        print('  no-cost passes', k, 'n=%d' % b[0], 'estimated $%.0f' % b[1], 'hours %.2f' % b[2], 'tokens M [in,cw,cr,out]', np.round(b[3] / 1e6, 2))
    print('  total estimated unrecorded $%.0f' % pu.sum())
    # simple alternative: $ per active hour of known passes
rate = sum(p['cost'] for p, _ in known) / (sum(p['active'] for p, _ in known) / 3600)
print('\nalternative estimate: known-cost passes run at $%.2f per active hour; no-cost passes %.2f h -> $%.0f' % (
    rate, sum(p['active'] for p, _ in unk) / 3600, rate * sum(p['active'] for p, _ in unk) / 3600))
tm = sum(s['main'] for _, s in joined); ts = sum(s['sub'] for _, s in joined)
print('tokens, joined passes, M [in,cw,cr,out]: main', np.round(tm / 1e6, 1), 'subagents', np.round(ts / 1e6, 1))
ft = []
for p, s in joined:
    pass

# ---- constrained fit: fixed price ratios (input 1 : cache write(1h) 2 : cache read 0.1 : output 5), free scale per main / subagent
print('\n== constrained fit (price ratios fixed at 1 : 2 : 0.1 : 5; scale fitted, non-negative)')
R = np.array([1.0, 2.0, 0.1, 5.0])
from itertools import product
def nnls2(A, y):
    best = None
    for mask in product([0, 1], repeat=A.shape[1]):
        if not any(mask): continue
        idx = [i for i, m in enumerate(mask) if m]
        w, *_ = np.linalg.lstsq(A[:, idx], y, rcond=None)
        if (w < 0).any(): continue
        full = np.zeros(A.shape[1]); full[idx] = w
        err = ((A @ full - y) ** 2).sum()
        if best is None or err < best[0]: best = (err, full)
    return best[1]
A = np.array([[s['main'] @ R, s['sub'] @ R] for _, s in known]); y = np.array([p['cost'] for p, _ in known])
w = nnls2(A, y); pred = A @ w
print('scale USD per M input-equivalent tokens: main %.2f, subagents %.2f' % (w[0] * 1e6, w[1] * 1e6),
      'R2=%.4f' % (1 - ((y - pred) ** 2).sum() / ((y - y.mean()) ** 2).sum()), 'known $%.0f predicted $%.0f' % (y.sum(), pred.sum()),
      'median abs err $%.2f, p90 abs err $%.2f' % (np.median(np.abs(y - pred)), np.percentile(np.abs(y - pred), 90)))
Au = np.array([[s['main'] @ R, s['sub'] @ R] for _, s in unk]); pu = Au @ w
by = collections.defaultdict(lambda: [0, 0.0, 0.0])
for (p, s), c in zip(unk, pu):
    b = by[p['outcome']]; b[0] += 1; b[1] += c; b[2] += p['active'] / 3600
for k, b in by.items(): print('  ', k, 'n=%d' % b[0], 'estimated $%.0f' % b[1], 'hours %.2f' % b[2])
print('  total estimated unrecorded $%.0f ; recorded $%.0f ; estimated true total $%.0f' % (pu.sum(), y.sum(), pu.sum() + y.sum()))
byph = collections.Counter()
for (p, s), c in zip(unk, pu): byph[p['phase']] += c
print('  by phase', {k: round(v) for k, v in sorted(byph.items(), key=lambda x: int(x[0]))})
# leave-one-out style check: relative error of total on random halves
rng = np.random.default_rng(1); errs = []
for _ in range(200):
    idx = rng.permutation(len(y)); a, b = idx[:len(y) // 2], idx[len(y) // 2:]
    ww = nnls2(A[a], y[a]); errs.append((A[b] @ ww).sum() / y[b].sum() - 1)
print('  split-half check of total: median rel. error %.1f%%, 5th..95th pct %.1f%% .. %.1f%%' % (100 * np.median(errs), 100 * np.percentile(errs, 5), 100 * np.percentile(errs, 95)))
# first-turn context per pass
ft = []
for p, s in joined:
    for l in open(os.path.join(TX, s['sid'] + '.jsonl'), errors='replace'):
        if '"type":"assistant"' not in l and '"type": "assistant"' not in l: continue
        u = (json.loads(l).get('message') or {}).get('usage') or {}
        ft.append(((u.get('input_tokens') or 0) + (u.get('cache_creation_input_tokens') or 0) + (u.get('cache_read_input_tokens') or 0), p['phase'], p['start']))
        break
v = sorted(x[0] for x in ft)
print('first-turn context tokens n=%d median %.0f p90 %.0f max %.0f sum M %.1f' % (len(v), np.median(v), np.percentile(v, 90), max(v), sum(v) / 1e6))
new = [x[0] for x in ft if x[2] >= 1790486835]
print('run 6 only (since relaunch): n=%d median %.0f' % (len(new), np.median(new) if new else 0))
