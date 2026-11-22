# R21v — baseline recompute

Verifier report on `docs/ecosystem/research/R21-time-use-baseline.md` and on the headline figures of `prompts/analysis/A5-run-time-evidence.md`. Recomputed 2026-09-29 from the raw run state, with the same data cutoff as R21 (epoch `1790637900`, 2026-09-29 03:25:00 +04:00). All access was read-only: files were read and `stat`-ed; git was used with `log`, `reflog`, `branch --contains` only. Nothing was written outside this report and `/tmp/specstride-research/R21v/`. No lock, process or file of `/root/agentic-netops-srl` was touched. No paid model call was made.

Rule applied: where a figure differs, the recomputed figure stands. "Matters" means a relative difference over 5 % or a changed conclusion.

## Method

1. R21's prose method and cutoff were read; its scripts were not run and not copied. The first part of its `baseline.py` was seen while reading the report (it is embedded there), so the interval definitions are the same by intent; the code below was written separately. Agreement therefore confirms R21's arithmetic and parsing, and it does **not** independently confirm the definitions. Definitions are judged separately under Findings.
2. Discovery: walk `/root`, keep every non-empty `events.jsonl` below a `.specstride`, `.wiggum` or `.lisa` directory, skip `node_modules` and `/root/.claude`. Events with `ts` after the cutoff are dropped. Runs are de-duplicated on (run id, first timestamp).
3. Intervals: see the docstring of `analyse.py`.
4. Acceptance job: start = modification time of `plan.tsv`, end = modification time of `results.tsv`, "failure known" = modification time of the evidence record of the first row of `results.tsv` whose code is neither `0` nor `SKIP`. Cross-checked against the `utc_finished` field inside that record.
5. Cold start: `agent_tool` events for time to first action; session transcripts (timestamp, message id, model and usage fields only) for first-turn tokens.
6. Item 8: the verdict files of the reference run, the run's resolved configuration, and the history of `/root/specstride` (`git log`, `git reflog`).

Commands, in order:

```
cd /tmp/specstride-research/R21v
python3 discover.py     # 285 files -> 209 unique runs -> runs.pkl
python3 analyse.py      # items 1-4; writes real.pkl
python3 restarts.py     # item 6
python3 accept.py       # item 5
python3 coldstart.py    # item 7, time
python3 firstturn.py    # item 7, tokens
python3 cost.py; python3 cost2.py   # estimate 1 (needs numpy for cost2.py)
python3 blocked.py      # estimate 2
```

### `discover.py`

```python
#!/usr/bin/env python3
"""R21v: discover events.jsonl files, load events up to the cutoff, de-duplicate runs. Read-only."""
import os, json, sys, pickle
CUT = 1790637900.0
STATE = ('.specstride', '.wiggum', '.lisa')
def files():
    out = []
    for root, dirs, fs in os.walk('/root'):
        dirs[:] = [d for d in dirs if d != 'node_modules' and not (root == '/root' and d == '.claude')]
        if 'events.jsonl' in fs:
            p = os.path.join(root, 'events.jsonl')
            parts = p.split('/')
            if any(s in parts for s in STATE) and os.path.getsize(p) > 0:
                out.append(p)
    return sorted(out)
def load(p):
    ev = []
    with open(p, errors='replace') as fh:
        for line in fh:
            try:
                e = json.loads(line)
                t = float(e['ts'])
            except Exception:
                continue
            if t > CUT: continue
            e['_t'] = t
            e['_e'] = e.get('event') or e.get('type')
            ev.append(e)
    return ev
if __name__ == '__main__':
    fl = files()
    print('files', len(fl))
    runs = {}; dropped = 0; empty = 0
    for p in fl:
        ev = load(p)
        if not ev: empty += 1; continue
        rs = next((e for e in ev if e['_e'] == 'run_start'), {})
        rid = rs.get('run_id') or ev[0].get('run_id') or os.path.basename(os.path.dirname(p))
        key = (rid, ev[0]['_t'])
        if key in runs:
            dropped += 1
            # keep the longer copy
            if len(ev) <= len(runs[key]['ev']): continue
        runs[key] = dict(path=p, rid=rid, ev=ev, rs=rs)
    print('unique', len(runs), 'copies dropped', dropped, 'empty after cutoff', empty)
    pickle.dump(list(runs.values()), open('runs.pkl', 'wb'))
```

### `analyse.py`

```python
#!/usr/bin/env python3
"""R21v: independent interval accounting per run. Reads runs.pkl from discover.py.
Pass      = iter_start -> first following structural end marker (or last event of the run).
Yield     = pass_yield -> yield_resume (or last event of the run if still open).
Critic    = critic_start -> verdict.  Verification = verification_start -> verification_passed/failed/release_passed.
Setup     = proposer_start/accelerator_start -> first iter_start after it.
Diagnostician = diagnostician_start -> diagnostician_done/error.
Attempt   = proposer_start/accelerator_start -> next such start (or run end); result = first verdict inside it.
"""
import pickle, collections, statistics, json, sys
R = pickle.load(open('runs.pkl', 'rb'))
def fam(p):
    p = str(p or '')
    if p.startswith('claude-agent-sdk'): return 'claude-sdk'
    if p.startswith('claude'): return 'claude'
    if p.startswith('dsh'): return 'dsh'
    if p.startswith('prime'): return 'prime'
    if p.startswith('fake'): return 'stub'
    if not p or p == 'None': return 'none'
    return 'local-backend'
PASS_END = {'pass_yield', 'pass_killed', 'iter_error', 'iter_done', 'evidence_written', 'critic_start',
            'verification_start', 'iter_start', 'proposer_start', 'accelerator_start', 'run_stop', 'run_end'}
def one(r):
    ev = r['ev']; t0 = ev[0]['_t']; t1 = ev[-1]['_t']
    o = dict(path=r['path'], rid=r['rid'], fam=fam(r['rs'].get('proposer')), crit=fam(r['rs'].get('critic')),
             feature=r['rs'].get('feature') or '', t0=t0, t1=t1, alive=t1 - t0, lisa='/.lisa/' in r['path'])
    tot = collections.Counter(); passes = []; atts = []; yields = []; critics = []; setups = []
    cur = None; att = None; op = {}
    def endpass(t, why):
        nonlocal cur
        if cur is None: return
        cur['end'] = t; cur['dur'] = t - cur['start']; cur.setdefault('out', why)
        tot['proposer'] += cur['dur']
        if att is not None: att['t'] += cur['dur']; att['passes'] += 1
        passes.append(cur); cur = None
    def add(kind, d):
        tot[kind] += d
        if att is not None: att['t'] += d
    for e in ev:
        k = e['_e']; t = e['_t']
        if k in ('agent_tool', 'agent_text', 'agent_diagnostic', 'telemetry_delivery', 'yield_wait'): continue
        if k == 'agent_result' and cur is not None:
            try: cur['cost'] = max(cur.get('cost', 0.0), float(e['cost_usd']))
            except Exception: pass
            continue
        if k == 'pass_killed':
            if cur is not None:
                cur['kill'] = e.get('reason'); cur['out'] = 'killed'
            elif passes and t - passes[-1]['end'] < 10 and 'kill' not in passes[-1]:
                passes[-1]['kill'] = e.get('reason'); passes[-1]['out'] = 'killed'
        if k == 'iter_error':
            st = str(e.get('subtype') or e.get('reason') or '')
            tgt = cur if cur is not None else (passes[-1] if passes and t - passes[-1]['end'] < 10 else None)
            if tgt is not None:
                if st.startswith('watchdog_'):
                    if 'kill' not in tgt: tgt['kill'] = st[9:]; tgt['out'] = 'killed'
                elif 'kill' not in tgt: tgt['out'] = 'error'; tgt['err'] = st
        if k == 'evidence_written':
            tgt = cur if cur is not None else (passes[-1] if passes and t - passes[-1]['end'] < 10 else None)
            if tgt is not None and 'kill' not in tgt: tgt['out'] = 'evidence'
        if k == 'pass_yield' and cur is not None: cur['out'] = 'yield'
        if k in PASS_END: endpass(t, 'normal' if k in ('iter_done',) else ('cut' if k in ('run_stop', 'run_end') else 'normal'))
        if k in ('proposer_start', 'accelerator_start'):
            if att is not None: att['end'] = t
            att = dict(start=t, phase=str(e.get('phase')), t=0.0, passes=0, res=None, vfail=False, cost=0.0)
            atts.append(att); op['setup'] = t
        elif k == 'iter_start':
            if 'setup' in op:
                d = t - op.pop('setup'); add('setup', d); setups.append(d)
            cur = dict(start=t, it=e.get('iter'), phase=att['phase'] if att else None, att=len(atts) - 1)
        elif k == 'pass_yield': op['yield'] = (t, e)
        elif k == 'yield_resume' and 'yield' in op:
            s, _ = op.pop('yield'); add('yield', t - s); yields.append(dict(start=s, dur=t - s, rc=e.get('job_rc'), open=False))
        elif k == 'verification_start': op['ver'] = t
        elif k in ('verification_passed', 'verification_failed', 'verification_release_passed'):
            if 'ver' in op: add('verification', t - op.pop('ver'))
            if k == 'verification_failed' and att is not None: att['vfail'] = True
        elif k == 'critic_start': op['crit'] = t
        elif k == 'verdict':
            d = 0
            if 'crit' in op: d = t - op.pop('crit'); add('critic', d); critics.append(d)
            if att is not None and att['res'] is None: att['res'] = str(e.get('result'))
        elif k == 'diagnostician_start': op['diag'] = t
        elif k in ('diagnostician_done', 'diagnostician_error') and 'diag' in op: add('diag', t - op.pop('diag'))
    if cur is not None: cur['out'] = 'open'; endpass(t1, 'open')
    if 'yield' in op:
        s, _ = op.pop('yield'); add('yield', t1 - s); yields.append(dict(start=s, dur=t1 - s, rc=None, open=True))
    stops = [e for e in ev if e['_e'] in ('run_stop', 'run_end')]
    o['stop'] = (stops[-1].get('reason') or stops[-1].get('outcome') or stops[-1]['_e']) if stops else 'none'
    for p in passes:
        a = atts[p['att']] if p['att'] is not None and p['att'] >= 0 and atts else None
        if a is not None: a['cost'] += p.get('cost', 0.0)
    o.update(tot=dict(tot), passes=passes, atts=atts, yields=yields, critics=critics, setups=setups)
    return o
A = [one(r) for r in R]
real = [a for a in A if not a['lisa'] and a['passes']]
print('unique', len(A), 'lisa', sum(a['lisa'] for a in A), 'no-pass (non-lisa)', sum(1 for a in A if not a['lisa'] and not a['passes']), 'real', len(real))
pickle.dump(real, open('real.pkl', 'wb'))
H = 3600.0
def grp(name, rs):
    al = sum(r['alive'] for r in rs); t = collections.Counter()
    for r in rs: t.update(r['tot'])
    ps = [p for r in rs for p in r['passes']]; at = [a for r in rs for a in r['atts']]
    print(f"\n== {name}: runs {len(rs)} passes {len(ps)} attempts {len(at)} alive {al/H:.2f} h")
    for k in ('proposer', 'yield', 'verification', 'critic', 'diag', 'setup'):
        print(f"   {k:13s} {t[k]/H:8.2f} h  {100*t[k]/al:5.1f} %")
    print(f"   unattributed  {(al-sum(t.values()))/H:8.2f} h")
    kl = [p for p in ps if p.get('kill')]
    kh = sum(p['dur'] for p in kl)
    print(f"   killed {len(kl)} passes {kh/H:.2f} h = {100*kh/max(t['proposer'],1):.1f} % of proposer time; by reason:",
          {k: (n, round(sum(p['dur'] for p in kl if p['kill'] == k)/H, 2)) for k, n in collections.Counter(p['kill'] for p in kl).items()})
    cls = collections.defaultdict(lambda: [0, 0.0, 0.0])
    for a in at:
        res = (a['res'] or '').upper()
        if res.startswith('APPROV'): c = 'approved'
        elif res.startswith('REJECT'): c = 'vfail' if a['vfail'] and False else 'rejected'
        elif res: c = 'malformed'
        elif a['vfail']: c = 'vfail'
        else: c = 'noverdict'
        cls[c][0] += 1; cls[c][1] += a['t']; cls[c][2] += a['cost']
    T = sum(v[1] for v in cls.values())
    fail = sum(cls[c][1] for c in ('rejected', 'malformed', 'vfail'))
    print('   attempts:', {k: (v[0], round(v[1]/H, 1)) for k, v in cls.items()}, f"total {T/H:.1f} h")
    print(f"   failed share of attempt time {100*fail/max(T,1):.1f} %; no-verdict share {100*cls['noverdict'][1]/max(T,1):.1f} %")
    cost = sum(p.get('cost', 0) for p in ps); nocost = sum(1 for p in ps if 'cost' not in p)
    print(f"   recorded cost ${cost:.0f}; passes without cost {nocost}")
    d = sorted(p['dur']/60 for p in ps)
    if d: print(f"   pass minutes median {statistics.median(d):.1f} p90 {d[int(0.9*(len(d)-1))]:.1f} max {d[-1]:.1f}")
    return t, al
grp('ALL', real)
for f in ('claude', 'dsh', 'local-backend', 'prime', 'claude-sdk', 'stub'):
    rs = [r for r in real if r['fam'] == f]
    if rs: grp(f, rs)
net = [r for r in real if r['path'].startswith('/root/agentic-netops-srl/')]
grp('NETOPS', net)
grp('ALL except NETOPS', [r for r in real if r not in net])
print('\nNETOPS yields:')
for r in net:
    for y in r['yields']: print('  ', r['rid'], round(y['dur']/H, 2), y['rc'], 'open' if y['open'] else '')
print('NETOPS calendar h', (max(r['t1'] for r in net) - min(r['t0'] for r in net))/H)
print('NETOPS verdicts', collections.Counter(a['res'] for r in net for a in r['atts']))
```

Output:

```
unique 209 lisa 20 no-pass (non-lisa) 17 real 172

== ALL: runs 172 passes 2096 attempts 1286 alive 587.86 h
   proposer        417.64 h   71.0 %
   yield            82.01 h   14.0 %
   verification     48.09 h    8.2 %
   critic           18.57 h    3.2 %
   diag              1.04 h    0.2 %
   setup             7.31 h    1.2 %
   unattributed     13.20 h
   killed 67 passes 40.57 h = 9.7 % of proposer time; by reason: {'hard_cap': (28, 31.58), 'repeat_stall': (36, 6.86), 'progress_stall': (3, 2.14)}
   attempts: {'approved': (400, 141.6), 'rejected': (597, 242.4), 'noverdict': (116, 131.4), 'malformed': (81, 16.1), 'vfail': (92, 42.9)} total 574.3 h
   failed share of attempt time 52.5 %; no-verdict share 22.9 %
   recorded cost $6915; passes without cost 1117
   pass minutes median 5.8 p90 30.0 max 180.0

== claude: runs 55 passes 515 attempts 331 alive 253.94 h
   proposer        130.52 h   51.4 %
   yield            82.01 h   32.3 %
   verification     28.51 h   11.2 %
   critic            5.47 h    2.2 %
   diag              0.82 h    0.3 %
   setup             4.33 h    1.7 %
   unattributed      2.29 h
   killed 37 passes 32.47 h = 24.9 % of proposer time; by reason: {'hard_cap': (23, 26.57), 'repeat_stall': (14, 5.9)}
   attempts: {'approved': (230, 79.0), 'noverdict': (36, 63.8), 'rejected': (42, 85.6), 'vfail': (19, 21.1), 'malformed': (4, 2.2)} total 251.7 h
   failed share of attempt time 43.3 %; no-verdict share 25.3 %
   recorded cost $2264; passes without cost 61
   pass minutes median 3.4 p90 50.5 max 106.8

== dsh: runs 73 passes 976 attempts 610 alive 201.21 h
   proposer        168.37 h   83.7 %
   yield             0.00 h    0.0 %
   verification     18.17 h    9.0 %
   critic            8.92 h    4.4 %
   diag              0.22 h    0.1 %
   setup             2.42 h    1.2 %
   unattributed      3.12 h
   killed 30 passes 8.10 h = 4.8 % of proposer time; by reason: {'hard_cap': (5, 5.01), 'progress_stall': (3, 2.14), 'repeat_stall': (22, 0.96)}
   attempts: {'vfail': (72, 18.9), 'rejected': (380, 96.6), 'malformed': (41, 9.9), 'approved': (63, 21.1), 'noverdict': (54, 51.2)} total 197.8 h
   failed share of attempt time 63.4 %; no-verdict share 25.9 %
   recorded cost $0; passes without cost 976
   pass minutes median 5.6 p90 24.4 max 180.0

== local-backend: runs 42 passes 592 attempts 332 alive 130.42 h
   proposer        116.72 h   89.5 %
   yield             0.00 h    0.0 %
   verification      1.42 h    1.1 %
   critic            3.94 h    3.0 %
   diag              0.00 h    0.0 %
   setup             0.55 h    0.4 %
   unattributed      7.79 h
   killed 0 passes 0.00 h = 0.0 % of proposer time; by reason: {}
   attempts: {'approved': (94, 39.2), 'rejected': (175, 60.2), 'noverdict': (26, 16.4), 'malformed': (36, 4.0), 'vfail': (1, 2.9)} total 122.6 h
   failed share of attempt time 54.7 %; no-verdict share 13.3 %
   recorded cost $4651; passes without cost 67
   pass minutes median 7.6 p90 30.0 max 60.0

== prime: runs 2 passes 13 attempts 13 alive 2.28 h
   proposer          2.03 h   89.1 %
   yield             0.00 h    0.0 %
   verification      0.00 h    0.0 %
   critic            0.23 h   10.0 %
   diag              0.00 h    0.0 %
   setup             0.02 h    0.7 %
   unattributed      0.01 h
   killed 0 passes 0.00 h = 0.0 % of proposer time; by reason: {}
   attempts: {'approved': (13, 2.3), 'rejected': (0, 0.0), 'malformed': (0, 0.0), 'vfail': (0, 0.0)} total 2.3 h
   failed share of attempt time 0.0 %; no-verdict share 0.0 %
   recorded cost $0; passes without cost 13
   pass minutes median 9.0 p90 15.0 max 18.4

== NETOPS: runs 6 passes 142 attempts 25 alive 127.89 h
   proposer         44.08 h   34.5 %
   yield            82.01 h   64.1 %
   verification      0.00 h    0.0 %
   critic            0.44 h    0.3 %
   diag              0.06 h    0.0 %
   setup             1.16 h    0.9 %
   unattributed      0.13 h
   killed 21 passes 17.86 h = 40.5 % of proposer time; by reason: {'hard_cap': (16, 16.04), 'repeat_stall': (5, 1.82)}
   attempts: {'noverdict': (6, 58.6), 'approved': (14, 19.4), 'rejected': (5, 49.7), 'malformed': (0, 0.0), 'vfail': (0, 0.0)} total 127.8 h
   failed share of attempt time 38.9 %; no-verdict share 45.9 %
   recorded cost $516; passes without cost 23
   pass minutes median 11.1 p90 60.1 max 60.3

== ALL except NETOPS: runs 166 passes 1954 attempts 1261 alive 459.97 h
   proposer        373.56 h   81.2 %
   yield             0.00 h    0.0 %
   verification     48.09 h   10.5 %
   critic           18.12 h    3.9 %
   diag              0.98 h    0.2 %
   setup             6.15 h    1.3 %
   unattributed     13.07 h
   killed 46 passes 22.71 h = 6.1 % of proposer time; by reason: {'hard_cap': (12, 15.53), 'progress_stall': (3, 2.14), 'repeat_stall': (31, 5.04)}
   attempts: {'approved': (386, 122.1), 'rejected': (592, 192.6), 'noverdict': (110, 72.8), 'malformed': (81, 16.1), 'vfail': (92, 42.9)} total 446.6 h
   failed share of attempt time 56.4 %; no-verdict share 16.3 %
   recorded cost $6399; passes without cost 1094
   pass minutes median 5.7 p90 30.0 max 180.0

NETOPS yields:
   20260927-092715-907142 19.55 unknown 
   20260927-092715-907142 12.28 0 
   20260927-092715-907142 5.41 0 
   20260927-092715-907142 2.59 None open
   20260924-074615-2937262 10.81 1 
   20260924-074615-2937262 0.04 1 
   20260924-074615-2937262 8.49 1 
   20260924-074615-2937262 16.16 1 
   20260924-074615-2937262 6.68 None open
NETOPS calendar h 189.2450920836793
NETOPS verdicts Counter({'APPROVED': 14, None: 6, 'REJECTED': 5})
```

### `restarts.py`

```python
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
```

Output:

```
features 32 multi-run features 20 restarts 140 overlapping 1
gap median 0.18 p90 2.51 max 230.7 sum 437.4 sum<=24h 114.1
  stop_flag                        n  56 median 0.11 sum 79.1
  none                             n  48 median 0.31 sum 318.6
  proposer_max_iter                n  14 median 0.44 sum 23.6
  max_rejects                      n  11 median 0.15 sum 12.7
  gate_oscillation                 n   5 median 0.53 sum 9.4
  proposer_consecutive_errors      n   3 median 0.03 sum 0.1
  all_approved                     n   2 median -3.05 sum -6.1
  critic_config                    n   1 median 0.01 sum 0.0
run endings [('stop_flag', 57), ('none', 51), ('all_approved', 26), ('proposer_max_iter', 14), ('max_rejects', 12), ('gate_oscillation', 5), ('proposer_consecutive_errors', 3), ('release_verification', 2), ('critic_config', 1), ('proposer_no_evidence', 1)]
claude-only features: runs per feature [1, 1, 1, 2, 6, 8, 10, 13]
```

### `accept.py`

```python
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
```

Output:

```
r2 missing files []
r3 missing files []
r4: dur 0.04 h rows 13 failing 0
r5: dur 4.02 h rows 61 failing 9 | first fail cycle-1 provision-rerun rc 1 row 15; known after 0.69 h; ran on 3.33 h; inner clocks {'utc_finished': '2026-09-25T14:03:03Z', 'utc_time': '2026-09-25T14:02:15Z'}
r6 missing files []
r7: dur 7.15 h rows 71 failing 5 | first fail cycle-1 test-reverify rc 2 row 38; known after 3.45 h; ran on 3.70 h; inner clocks {'utc_finished': '2026-09-25T22:11:09Z', 'utc_time': '2026-09-25T21:32:43Z'}
r8: dur 13.87 h rows 168 failing 14 | first fail cycle-1 verify-topology-view rc 2 row 35; known after 2.80 h; ran on 11.06 h; inner clocks {'utc_finished': '2026-09-26T07:38:49Z', 'utc_time': '2026-09-26T07:35:52Z'}
r9: dur 7.33 h rows 168 failing 7 | first fail cycle-1 credential-scan rc 1 row 58; known after 3.06 h; ran on 4.26 h; inner clocks {'utc_finished': '2026-09-27T00:01:10Z', 'utc_time': '2026-09-26T23:59:14Z'}
r10: dur 10.53 h rows 169 failing 3 | first fail cycle-1 degradation-e2e rc 1 row 59; known after 3.58 h; ran on 6.95 h; inner clocks {'utc_finished': '2026-09-27T16:14:08Z', 'utc_time': '2026-09-27T15:46:00Z'}
r11: dur 0.00 h rows 0 failing 0
TOTAL (runs with >20 rows and a located first failure): 42.89 h, after first failure 29.30 h = 68 %
```

### `coldstart.py`

```python
#!/usr/bin/env python3
"""R21v: minutes from pass start to the first action, from agent_tool events.
Action = Edit/Write/NotebookEdit on a file that is not loop bookkeeping, an Agent/Task launch,
or a shell command with at least one segment whose verb is not in a read-only list."""
import pickle, re, statistics, sys
sys.path.insert(0, '.')
import discover
R = pickle.load(open('real.pkl', 'rb'))
RO = set('cd ls cat head tail wc grep egrep rg find date ps echo stat jq sort uniq tr cut test true pwd which file tree printf awk column nl diff cmp basename dirname env export set source [ [[ if then fi for do done while sleep readlink du df id whoami hostname type command less more xargs tac comm seq'.split())
GITRO = {'log', 'status', 'diff', 'show', 'branch', 'ls-files', 'rev-parse', 'blame', 'ls-tree', 'describe', 'remote', 'tag', 'cat-file', 'grep', 'shortlog', 'reflog'}
def readonly(cmd):
    for seg in re.split(r'&&|\|\||[;|\n]', cmd or ''):
        w = seg.strip().split()
        while w and re.match(r'^[A-Za-z_][A-Za-z0-9_]*=', w[0]): w = w[1:]
        if not w: continue
        v = w[0].lstrip('({').split('/')[-1]
        if v == 'git':
            sub = next((x for x in w[1:] if not x.startswith('-') and x != '-C'), '')
            if sub in GITRO or (len(w) > 2 and w[1] == '-C'): continue
            return False
        if v == 'sed' and '-i' not in w: continue
        if v in ('kubectl', 'docker') and len(w) > 1 and w[1] in ('get', 'logs', 'describe', 'ps', 'inspect', 'images', 'top'): continue
        if v not in RO: return False
    return True
BOOK = re.compile(r'PROGRESS\.md|/\.specstride/|/\.wiggum/|GATE\d+|EVIDENCE')
def action(e):
    t = str(e.get('tool') or ''); tg = str(e.get('target') or '')
    if t in ('Edit', 'Write', 'MultiEdit', 'NotebookEdit'): return not BOOK.search(tg)
    if t in ('Agent', 'Task'): return True
    if t == 'Bash': return not readonly(tg)
    return False
def study(name, runs):
    mins = []; calls = []; tot = 0.0; ptime = 0.0; n = 0; prog = 0; prog3 = 0
    for r in runs:
        ev = [e for e in discover.load(r['path']) if e['_e'] == 'agent_tool']
        for p in r['passes']:
            te = [e for e in ev if p['start'] <= e['_t'] <= p['end']]
            if not te: continue
            n += 1; ptime += p['dur']
            idx = next((i for i, e in enumerate(te) if action(e)), None)
            d = (te[idx]['_t'] - p['start']) if idx is not None else p['dur']
            mins.append(d/60); calls.append(idx if idx is not None else len(te)); tot += d
            pr = [i for i, e in enumerate(te) if 'PROGRESS.md' in str(e.get('target'))]
            if pr: prog += 1; prog3 += pr[0] < 3
    s = sorted(mins); c = sorted(calls)
    print(f"{name}: passes with tool events {n}; minutes to first action median {statistics.median(s):.2f} p90 {s[int(.9*(n-1))]:.2f}; total {tot/3600:.2f} h = {100*tot/ptime:.1f} % of their pass time; calls before median {statistics.median(c)} p90 {c[int(.9*(n-1))]}; PROGRESS.md touched {prog} (first 3 calls {prog3})")
study('Claude proposer', [r for r in R if r['fam'] == 'claude'])
study('NETOPS', [r for r in R if r['path'].startswith('/root/agentic-netops-srl/')])
```

Output:

```
Claude proposer: passes with tool events 473; minutes to first action median 0.43 p90 1.03; total 4.36 h = 3.3 % of their pass time; calls before median 4 p90 8; PROGRESS.md touched 468 (first 3 calls 463)
NETOPS: passes with tool events 141; minutes to first action median 0.25 p90 0.59; total 0.78 h = 1.8 % of their pass time; calls before median 2 p90 6; PROGRESS.md touched 139 (first 3 calls 139)
```

### `firstturn.py`

```python
#!/usr/bin/env python3
"""R21v: first-turn context per proposer pass of the reference run. Reads only timestamp, message id and usage fields
of the session transcripts; joins a session to a pass when its first record falls within [-5 s, +60 s] of an iter_start."""
import json, glob, os, pickle, datetime, statistics, bisect
CUT = 1790637900
R = [r for r in pickle.load(open('real.pkl', 'rb')) if r['path'].startswith('/root/agentic-netops-srl/')]
starts = sorted((p['start'], r['rid']) for r in R for p in r['passes'])
def ts(s): return datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
sess = []
for f in glob.glob('/root/.claude/projects/-root-agentic-netops-srl/*.jsonl'):
    first = None; ft = None
    with open(f, errors='replace') as fh:
        for l in fh:
            try: d = json.loads(l)
            except Exception: continue
            t = d.get('timestamp')
            if t and first is None: first = ts(t)
            u = (d.get('message') or {}).get('usage') if isinstance(d.get('message'), dict) else None
            if d.get('type') == 'assistant' and u and not d.get('isSidechain'):
                ft = (u.get('input_tokens') or 0) + (u.get('cache_read_input_tokens') or 0) + (u.get('cache_creation_input_tokens') or 0)
                break
    if first and ft is not None and first <= CUT: sess.append((first, ft, os.path.basename(f)))
used = {}; 
for first, ft, name in sess:
    i = bisect.bisect_left(starts, (first + 5,)) - 1
    if i >= 0 and -5 <= first - starts[i][0] <= 60:
        used.setdefault(i, (ft, starts[i][1]))
v = sorted(x[0] for x in used.values())
print('sessions', len(sess), 'passes', len(starts), 'joined', len(v))
print('first-turn tokens median', statistics.median(v), 'p90', v[int(.9*(len(v)-1))], 'max', v[-1], 'sum M', round(sum(v)/1e6, 1))
last = sorted(x[0] for x in used.values() if x[1] == '20260927-092715-907142')
print('newest run: n', len(last), 'median', statistics.median(last) if last else None)
```

Output:

```
sessions 158 passes 142 joined 141
first-turn tokens median 107798 p90 129271 max 138781 sum M 15.3
newest run: n 6 median 138225.5
```

### `cost.py`

```python
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
```

Output:

```
joined 141 of 142
cache-read tokens by model {'main': {'claude-opus-5-5': 658851750, 'claude-opus-5': 322497633}, 'sub': {'claude-opus-5-5': 398243427, 'claude-opus-5': 344876394}}
cache-write x2.0 subagents in: known passes 119 recorded $516; $/Mtok-equivalent 3.72; unrecorded passes 22 estimate $483 (5-95 % of half-sample fits $431-$533); {'hard_cap': 417, 'open': 14, 'repeat_stall': 52}
cache-write x2.0 subagents out: known passes 119 recorded $516; $/Mtok-equivalent 4.82; unrecorded passes 22 estimate $190 (5-95 % of half-sample fits $158-$224); {'hard_cap': 148, 'open': 18, 'repeat_stall': 23}
cache-write x1.25 subagents in: known passes 119 recorded $516; $/Mtok-equivalent 4.14; unrecorded passes 22 estimate $474 (5-95 % of half-sample fits $423-$524); {'hard_cap': 410, 'open': 14, 'repeat_stall': 50}
cache-write x1.25 subagents out: known passes 119 recorded $516; $/Mtok-equivalent 5.27; unrecorded passes 22 estimate $188 (5-95 % of half-sample fits $157-$223); {'hard_cap': 147, 'open': 18, 'repeat_stall': 23}
cost recorded main cache-read M 723 subagent cache-read M 173
no cost main cache-read M 258 subagent cache-read M 570
```

### `cost2.py`

```python
#!/usr/bin/env python3
"""R21v: does the recorded pass cost include subagent usage? Two-coefficient least squares, cost ~ a*W_main + b*W_sub."""
import numpy as np, runpy, sys, io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    g = runpy.run_path('cost.py')
rows, P, W = g['rows'], g['P'], g['W']
K = [(P[i]['cost'], W(u, 2.0), W(s, 2.0)) for i, (u, s) in rows.items() if P[i].get('cost')]
y = np.array([k[0] for k in K]); X = np.array([[k[1], k[2]] for k in K])
(a, b), res, *_ = np.linalg.lstsq(X, y, rcond=None)
print('n', len(K), 'a(main) $/Mtok-eq', a*1e6, 'b(sub) $/Mtok-eq', b*1e6, 'passes with subagent usage', int((X[:, 1] > 0).sum()))
pred = X @ np.array([a, b]); print('R2', 1 - ((y-pred)**2).sum()/((y-y.mean())**2).sum())
U = np.array([[W(u, 2.0), W(s, 2.0)] for i, (u, s) in rows.items() if not P[i].get('cost')])
print('estimate with separate coefficients $', float((U @ np.array([a, b])).sum()), ' with one coefficient $', float(U.sum()*y.sum()/X.sum()))
a1 = float((X.sum(1) @ y)/(X.sum(1) @ X.sum(1))); print('one-coefficient least squares $', float(U.sum()*a1))
```

Output:

```
n 119 a(main) $/Mtok-eq 3.305451525964798 b(sub) $/Mtok-eq 5.17118346983791 passes with subagent usage 18
R2 0.8724025488044918
estimate with separate coefficients $ 597.6163582683911  with one coefficient $ 482.673881799054
one-coefficient least squares $ 503.42810911809323
```

### `blocked.py`

```python
#!/usr/bin/env python3
"""R21v: passes that closed by saying they wait on a person. Own pattern, applied to the last agent_text of each pass
that wrote no evidence. Also a text-free proxy: no-evidence passes under 2 minutes in runs stopped by the iteration limit."""
import pickle, re, sys, collections
import discover
R = pickle.load(open('real.pkl', 'rb'))
PAT = re.compile(r"(still|remain\w*|am|is|are)\s+blocked|blocked (on|by|pending|until)|(await|wait)\w*\s+(for\s+)?(the\s+|your\s+|an?\s+)?(operator|user|human|owner|maintainer|decision|answer|input|approval)|need\w*\s+(your|a|an|the)?\s*(decision|input|answer|approval)|no new input|only you can|decisions? (that )?only", re.I)
HUMAN = re.compile(r"operator|user|human|owner|you\b|your\b|decision|approval|maintainer", re.I)
tot = collections.Counter(); per = []
for r in R:
    ev = None; n = h = c = 0; short = [0, 0.0]
    for p in r['passes']:
        if p.get('out') in ('evidence',) or p.get('kill'): 
            continue
        if r['stop'] == 'proposer_max_iter' and p['dur'] < 120: short[0] += 1; short[1] += p['dur']
        if ev is None: ev = [e for e in discover.load(r['path']) if e['_e'] == 'agent_text']
        tx = [e for e in ev if p['start'] <= e['_t'] <= p['end'] + 2]
        if not tx: continue
        last = str(tx[-1].get('text') or tx[-1].get('content') or tx[-1].get('target') or '')
        if PAT.search(last) and HUMAN.search(last):
            n += 1; h += p['dur']; c += p.get('cost', 0) or 0
    if n or short[0]: per.append((r['path'].split('/')[2][:14] if 'agentic-netops-srl' in r['path'] else 'other', r['rid'], r['stop'], len(r['passes']), n, round(h/3600, 2), round(c), short[0], round(short[1]/3600, 2)))
    tot['n'] += n; tot['h'] += h; tot['c'] += c; tot['runs'] += bool(n); tot['short'] += short[0]; tot['shorth'] += short[1]
for x in sorted(per, key=lambda x: -x[4])[:8]: print(x)
print('declared blocked', tot['n'], 'passes in', tot['runs'], 'runs;', round(tot['h']/3600, 2), 'h; $', round(tot['c']))
print('proxy: no-evidence passes < 2 min in iteration-limit runs', tot['short'], round(tot['shorth']/3600, 2), 'h')
mi = [r for r in R if r['stop'] == 'proposer_max_iter']
print('iteration-limit runs', len(mi), 'passes', sum(len(r['passes']) for r in mi), 'h', round(sum(p['dur'] for r in mi for p in r['passes'])/3600, 1), '$', round(sum(p.get('cost', 0) or 0 for r in mi for p in r['passes'])), 'under 2 min', sum(1 for r in mi for p in r['passes'] if p['dur'] < 120), 'no evidence at all', sum(1 for r in mi if not any(p.get('out') == 'evidence' for p in r['passes'])))
```

Output:

```
('agentic-netops', '20260921-093805-686791', 'proposer_max_iter', 30, 25, 2.83, 60, 24, 0.35)
('agentic-netops', '20260921-061005-3506964', 'proposer_max_iter', 33, 11, 0.12, 5, 28, 0.32)
('agentic-netops', '20260924-074615-2937262', 'none', 63, 8, 2.49, 27, 0, 0.0)
('other', '20260909-233418-1479184', 'proposer_max_iter', 39, 3, 0.07, 2, 18, 0.3)
('other', '20260823-201602-751989', 'proposer_max_iter', 98, 0, 0.0, 0, 30, 0.31)
('other', '20260824-200854-249047', 'proposer_max_iter', 30, 0, 0.0, 0, 30, 0.35)
('other', '20260825-233052-3921985', 'proposer_max_iter', 62, 0, 0.0, 0, 28, 0.22)
('other', '20260829-200504-23310', 'proposer_max_iter', 32, 0, 0.0, 0, 29, 0.15)
declared blocked 47 passes in 4 runs; 5.52 h; $ 94
proxy: no-evidence passes < 2 min in iteration-limit runs 351 3.37 h
iteration-limit runs 14 passes 576 h 47.8 $ 846 under 2 min 366 no evidence at all 5
```

## Figure-by-figure comparison

| # | Figure | R21 | R21v | Difference | Matters? |
|---|---|---|---|---|---|
| 1 | Reference run, alive time | 127.9 h | 127.89 h | 0 | No |
| 1 | — detached wait | 82.0 h (64.1 %) | 82.01 h (64.1 %) | 0 | No |
| 1 | — proposer | 44.1 h (34.5 %) | 44.08 h (34.5 %) | 0 | No |
| 1 | — critic | 0.44 h (0.3 %) | 0.44 h (0.3 %) | 0 | No |
| 1 | — setup / diagnostician / unattributed | 1.17 / 0.06 / 0.13 h | 1.16 / 0.06 / 0.13 h | −0.01 h | No |
| 1 | — calendar | 189.2 h | 189.25 h | 0 | No |
| 1 | — yields by result | rc 1: 4 / 35.50 h; rc 0: 2 / 17.69 h; unknown: 1 / 19.55 h; open: 2 / 9.28 h | 4 / 35.50; 2 / 17.69; 1 / 19.55; 2 / 9.27 | −0.01 h | No |
| 2 | Population: files, unique runs, real runs | 285, 209, 172 | 285, 209, 172 | 0 | No |
| 2 | — copies dropped | 106 | 76 (= 285 − 209; 74 duplicates and 2 files empty at the cutoff) | −30 | Internal inconsistency in R21; no figure depends on it |
| 2 | — excluded `.lisa` / no proposer pass | 21 / 16 | 20 / 17 | ±1, same sum | No |
| 2 | Claude proposer: runs, passes, attempts | 55, 515, 331 | 55, 515, 331 | 0 | No |
| 2 | Claude proposer: alive | 253.9 h | 253.94 h | 0 | No |
| 2 | — proposer / wait / verification / critic | 130.5 (51.4 %) / 82.0 (32.3 %) / 28.5 (11.2 %) / 5.5 (2.2 %) | 130.52 (51.4 %) / 82.01 (32.3 %) / 28.51 (11.2 %) / 5.47 (2.2 %) | 0 | No |
| 2 | — setup | 4.5 h (1.8 %) | 4.33 h (1.7 %) | −3.8 % | No |
| 2 | All runs: alive and split | 587.9 h; 71.0 / 14.0 / 8.2 / 3.2 % | 587.86 h; 71.0 / 14.0 / 8.2 / 3.2 % | 0 | No |
| 2 | All runs: unattributed | 0.5 h (0.3 h without the reference run) | 13.20 h (13.07 h) | +12.7 h | **Yes** (R21's own row sums to 574.7 h of 587.9 h; its per-family rows add to 13.1 h) |
| 3 | Claude proposer, killed passes | 37 passes, 32.5 h, 24.9 % of proposer time | 37, 32.47 h, 24.9 % | 0 | No |
| 3 | — hard cap / repeat stall | 23 / 26.6 h; 14 / 5.9 h | 23 / 26.57 h; 14 / 5.90 h | 0 | No |
| 3 | All runs, killed passes | 66, 40.6 h, 9.7 % | 67, 40.57 h, 9.7 % | +1 pass, 0 h | No |
| 3 | Reference run, killed passes | 21, 17.9 h, 40.5 % | 21, 17.86 h, 40.5 % | 0 | No |
| 4 | Failed share of attempt time, all | 52.5 % (301 h of 574 h) | 52.5 % (301.4 of 574.3 h) | 0 | No |
| 4 | — Claude proposer | 43.3 % failed, 25.4 % no verdict | 43.3 %, 25.3 % | −0.1 pt | No |
| 4 | — reference run | 38.9 %; 49.7 h failed; 58.6 h no verdict | 38.9 %; 49.7 h; 58.6 h | 0 | No |
| 4 | Attempt counts, all (A / R / M / V / N) | 400 / 597 / 81 / 92 / 116 | 400 / 597 / 81 / 92 / 116 | 0 | No |
| 5 | Acceptance job time, r5 + r7–r10 | 42.9 h | 42.89 h | 0 | No |
| 5 | — after the first failure was known | 29.3 h (68 %) | 29.30 h (68 %) | 0 | No |
| 5 | — failing rows at the end (r5, r7, r8, r9, r10) | 27, 5, 58, 51, 3 | 9, 5, 14, 7, 3 rows with a non-zero code; R21's numbers are reached only by also counting `SKIP` rows | label | Minor: R21's column counts skipped rows as failing |
| 6 | Restarts | 137; median gap 0.18 h; p90 2.6 h; sum 441.8 h | 135–143 depending on how runs without a feature name are grouped (140 with project root + feature); median 0.18–0.19 h; p90 2.5–2.7 h; sum 435–470 h | ±3 % | No |
| 6 | Automatic relaunches, reference run | 0 | 0 (`relaunches: []`; 7 `[MOL-LAUNCH]` lines) | 0 | No |
| 6 | Run endings | stop flag 57, none 51, approved 26, iteration limit 14, reject limit 12 | 57, 51, 26, 14, 12 | 0 | No |
| 7 | Minutes to first action, Claude, median / p90 | 0.5 / 2.0 | 0.43 / 1.03 | −14 % / −49 % | Definition-dependent; conclusion unchanged |
| 7 | — total and share of pass time | 6.7 h, 5.2 % | 4.36 h, 3.3 % | −35 % | Over 5 %, conclusion unchanged (small) |
| 7 | — reference run | 0.3 min; 0.9 h; 2.0 % | 0.25 min; 0.78 h; 1.8 % | −13 % | As above |
| 7 | Passes touching `PROGRESS.md` (first 3 calls), Claude | 468 (463) of 473 | 468 (463) of 473 | 0 | No |
| 7 | First-turn tokens, reference run | median 107,798; p90 129,271; max 138,781; 15.3 M; newest run 138,226 | 107,798; 129,271; 138,781; 15.3 M; 138,225.5 | 0 | No |
| 8 | Rejections in the reference run | 5 of 19 verdicts (R21 F-3); false-rejection split is A5's: 3 false | 5 of 19; 3 false (7/1, 10/1, 10/2), all three caused by a wildcard citation reported as MISSING | 0 | No, but see F-9 to F-11 for the version |
| E1 | Unrecorded cost, reference run | $592 central, $440–$760 | $483 (ratio estimator), $503 (one-coefficient least squares), $598 (separate coefficient for subagents) | −18 % to +1 % | Over 5 % on the central value; conclusion unchanged |
| E1 | Recorded cost, passes without cost | $516; 23 | $516; 23 | 0 | No |
| E1 | All runs: passes without any cost | 1,152 (55 %) | 1,117 (53 %) | −3 % | No |
| E2 | Passes that declared a block | 76 passes, 6 runs, 3.57 h, $82 | 47 passes, 4 runs, 5.52 h, $94 with a different pattern | −38 % passes, +55 % hours | **Yes**: the count is not stable |
| E2 | Iteration-limit runs | 14 runs, 576 passes, 47.8 h, $846; 366 under 2 min; 5 without evidence | 14, 576, 47.8 h, $846; 366; 5 | 0 | No |

A5 headline figures, checked at the same time (A5 was measured 55 minutes before the cutoff, so live quantities are expected to be 0.9 h lower):

| A5 figure | A5 | R21v at the cutoff | Verdict |
|---|---|---|---|
| Alive time | 127.0 h | 127.89 h | Consistent |
| Yield | 81.09 h (63.9 %) | 82.01 h (64.1 %) | Consistent |
| Proposer active | 44.12 h | 44.08 h | Reproduces |
| Hard-cap kills | 16 passes, 16.08 h | 16, 16.04 h | Reproduces |
| Stall kills | 5 passes, 1.83 h | 5, 1.82 h | Reproduces |
| Critic | 19 verdicts, 0.44 h | 19, 0.44 h | Reproduces |
| Pass length | median 11.1 min, p90 60.1 min | 11.1, 60.1 | Reproduces |
| First four waits, all `job_rc=1` | 35.6 h | 35.50 h (127,789 s) | A5 is 0.1 h high |
| First-turn tokens | median 107.8 k, p90 129 k, max 139 k | 107.8 k, 129.3 k, 138.8 k | Reproduces |
| Time after a failure was knowable in T151 | ≈25 h, estimated | 29.30 h, measured | R21's replacement reproduces |
| Recorded spend | $515 | $516 | Reproduces |

## Findings

**F-1. The measured headline figures of R21 reproduce.** `verified-local` — `analyse.py` output: reference run 127.89 h alive, 82.01 h wait, 44.08 h proposer, 0.44 h critic; Claude proposer 55 runs, 515 passes, 331 attempts, 253.94 h; killed 37 passes, 32.47 h, 24.9 %; failed share 43.3 % (Claude), 52.5 % (all). Every one is within 0.1 h or 0.1 point of R21.

**F-2. R21's "unattributed" figure for the whole population is wrong.** `verified-local` — R21 F-2 row "All" lists 0.5 h. Its own columns add to 417.6 + 82.0 + 48.1 + 18.6 + 1.0 + 7.4 = 574.7 h against 587.9 h alive, a remainder of 13.2 h; `analyse.py` gives 13.20 h (2.2 % of alive time), and 13.07 h without the reference run. 7.79 h of it is in the local-backend runs.

**F-3. R21's count of dropped copies is inconsistent with its own totals.** `verified-local` — 285 files and 209 unique runs leave 76, not 106. `discover.py`: 74 duplicates, 2 files with no event before the cutoff.

**F-4. The Claude-proposer baseline is carried by one feature in two of its four headline shares.** `verified-local`, arithmetic on `analyse.py` output.

| Claude proposer | With the reference run | Without it (49 runs, 126.05 h alive) |
|---|---|---|
| Proposer share of alive time | 51.4 % | 68.6 % (86.44 h) |
| Detached wait | 32.3 % | 0 % |
| Orchestrator verification | 11.2 % | 22.6 % (28.51 h) |
| Critic | 2.2 % | 4.0 % (5.03 h) |
| Killed passes, share of proposer time | 24.9 % | 16.9 % (16 passes, 14.61 h) |
| Failed share of attempt time | 43.3 % | 47.8 % (59.2 of 123.9 h) |

All 82.0 h of detached wait and all the missing orchestrator verification come from the reference run. R21's recommendation (option D) already separates a "long verification" baseline, but item 1 of that recommendation still quotes 51 % / 32 % / 11 % / 2.2 % as the general Claude baseline. Those four numbers describe a mixture, and no single run looks like them.

**F-5. 45.05 h of the reference run's 49.7 h of "failed attempt" time is one attempt, and most of that attempt is waiting.** `inferred` from R21's per-phase table (phase 15: 45.05 h failed, 82.01 h detached wait) and from `analyse.py` (attempt time includes yield time). Without that one attempt the Claude failed share is (108.9 − 45.05) / (251.7 − 45.05) = 30.9 %. The 43 % figure therefore mixes model work that was rejected with waiting on a job.

**F-6. The time after the first failure reproduces, and the clock it rests on is sound.** `verified-local` — `accept.py`: 42.89 h, 29.30 h after the first failing step. The evidence records carry their own `utc_finished`; for r8 it reads `2026-09-26T07:38:49Z`, which is 2.80 h after the modification time of `plan.tsv`, the same value the modification time gives. R21's open risk 5 (modification times as clocks) is closed for these five runs. Two of the five runs (r5, r7) ended with code 143 (`/tmp/p15/chain.log` lines 130 and 151), so they were terminated from outside and did not run to their natural end; the "kept running" time for those two is time until someone or something stopped them.

**F-7. Cold-start time depends on what counts as an action; first-turn tokens do not.** `verified-local` — `coldstart.py` with its own read-only command list gives a median of 0.43 min and 4.36 h in total for Claude passes, against R21's 0.5 min and 6.7 h. `firstturn.py` gives R21's token figures to the token. The honest statement for time is a range: 4.4–6.7 h, 3.3–5.2 % of Claude pass time.

**F-8. Restart counts depend on the grouping of 8 runs that have no feature name.** `verified-local` — `restarts.py` and its three groupings: 135, 140 or 143 restarts. The median gap is 0.18–0.19 h in all three. One pair of runs of the same feature overlaps in time (negative gap, −6.1 h after an "all approved" ending), so "gap" is not always idle time.

**F-9. The reference run did not use one Specstride version. It executes the working tree of `/root/specstride`, which changed under it.** `verified-local` — `last-run.conf` of the feature: `ORCHESTRATOR=/root/specstride/orchestrator.sh`. `git reflog` in `/root/specstride` shows more than 40 checkouts, rebases and commits between 2026-09-26 and 2026-09-28 while runs 5 and 6 were alive, including feature branches (`002-…`, `003-…`, `004-…`). No event or log line of the run records a commit id. The baseline `9cab15d` became the tree's `HEAD` on 2026-09-28 16:15 +04:00, 31 hours after run 6 started.

**F-10. At the time of the three false rejections the critic snapshot did not expand wildcards; from the next attempt on it did.** `verified-local` —

| Verdict | Time (+04:00) | Snapshot line in the verdict file |
|---|---|---|
| Phase 7 attempt 1, rejected | 2026-09-24 17:57:54 | `verdicts/phase7.attempt1.20260924-175619.txt:5395`: `agents/supervisors/provisioning/prompts/*.md — MISSING (does not exist on disk)` |
| Phase 10 attempt 1, rejected | 22:17:04 | `phase10.attempt1.20260924-221559.txt:5177`: `examples/migrations/*.yaml — MISSING` |
| Phase 10 attempt 2, rejected | 22:20:26 | `phase10.attempt2.20260924-221910.txt:5253`: the same line |
| — | 22:23:02 | `/root/agentic-netops-srl/.mixture-of-loops/specstride-critic-wildcard.patch` written; it is the diff of `lib/critic.py` that adds the wildcard branch |
| Phase 10 attempt 3, approved | 22:40:16 | `phase10.attempt3.20260924-223858.txt:2825`: `examples/migrations/*.yaml — present: wildcard matches 4 file(s) on disk` |
| — | 23:05:41 | commit `d6dab74` "fix(critic): ground a wildcard citation by its matches (#64)" |

The diagnostician classified 7/1 and 10/1 as `grounding` (`diagnostician_done` events). The directories hold files today (14 and 3 to 4 files).

**F-11. Both reports are right, about different moments.** `inferred` from F-9 and F-10. A5's cause for rejections 1, 3 and 4 (no wildcard expansion) is correct for the code that ran at 17:57–22:20 on 2026-09-24. The other report's statement that expansion is present at `9cab15d` (`lib/critic.py` lines 1390–1404, read for this report) is also correct: the fix entered the working tree between 22:20 and 22:38 that evening, was committed 25 minutes after the approval, and is an ancestor of `9cab15d`. The defect is closed at the baseline. A5 §5 and §6 propose a deterministic pre-check that expands globs as a future saving; that saving is already taken and must not be counted again.

**F-12. A5's account of how phase 10 was finally approved is incomplete.** `verified-local` — A5 §3 row 4 says attempt 3 was approved "after a full proposer pass (18 min) restaged the proof". The snapshot of attempt 3 shows the wildcard resolved by the patched critic (F-10). Whether the restaging alone would have been enough cannot be told from the files. `unverified`: no record says who applied the patch to the working tree.

**F-13. Estimate 1 (unrecorded cost): the method is sound, the central value sits at the top of what the data supports.** `inferred` — `cost.py`, `cost2.py`.

| Estimator | Unrecorded cost |
|---|---|
| Ratio of sums, one price scale, subagents included | $483 (half-sample 5–95 %: $431–$533) |
| Least squares through the origin, one scale | $503 |
| Least squares, separate scale for subagent tokens | $598 |
| Main sessions only (wrong, shown for contrast) | $190 |

- The assumption that recorded cost includes subagent usage holds: the fitted scale for subagent tokens is positive and of the same order as the main one ($5.17 against $3.31 per million input-equivalent tokens, R² 0.87).
- The weak point: only 18 of the 119 fitted passes have subagent usage, and the passes being estimated are dominated by it (570 M subagent cache-read tokens against 258 M in their main sessions). The estimate extrapolates from a thin sample. R21's $592 matches the estimator that gives subagents their own scale.
- The cache-write ratio (2 or 1.25) moves the result by under 2 %.
- Both models seen in the transcripts are from the same tier, so a single price scale per token kind is acceptable.
- R21 reports 720 M subagent and 204 M main cache-read tokens for the passes without cost; this recompute finds 570 M and 258 M with message-id de-duplication across a session and its subagents. `unverified` which is right; the dollar estimate is not sensitive to the split when one scale is used.
- Standing figure: **$480–$600 unrecorded, true spend $1,000–$1,100.** R21's conclusion (recorded cost misses about half) stands.

**F-14. Estimate 2 (blocked passes): the hours and dollars are an order of magnitude, the pass count is not a measurement.** `verified-local` — the `agent_text` events that carry the closing message are cut to 160 bytes (`"truncated":true,"original_bytes":2604,"retained_bytes":160` in the last such event of run `20260921-093805-686791`). A pattern can only see the first sentence. A second, independently written pattern finds 47 passes in 4 runs (5.52 h, $94) against R21's 76 in 6 runs (3.57 h, $82). Harnesses that emit no text events cannot be counted at all. What is measured and reproduces: 14 runs stopped by the iteration limit, 576 passes, 47.8 h, $846, 366 passes under 2 minutes, 5 runs without evidence.

## Figures that stand corrected

| Figure | R21 | Stands as |
|---|---|---|
| Unattributed time, all runs | 0.5 h | 13.2 h (2.2 % of alive time) |
| Unattributed time, all runs except the reference run | 0.3 h | 13.1 h |
| Copies dropped in de-duplication | 106 | 76 |
| Excluded runs: `.lisa` / no pass | 21 / 16 | 20 / 17 |
| Killed passes, all runs | 66 | 67 (hours unchanged, 40.6 h) |
| Setup time, Claude proposer | 4.5 h | 4.33 h |
| Failing rows at the end of r5, r8, r9 | 27, 58, 51 | 9, 14, 7 failing; the rest were skipped |
| Restarts | 137 | 135–143, by grouping; median gap unchanged |
| Time to first action, Claude: total | 6.7 h (5.2 %) | 4.4–6.7 h (3.3–5.2 %) |
| Time to first action, Claude: p90 | 2.0 min | 1.0–2.0 min |
| Passes without any recorded cost, all runs | 1,152 (55 %) | 1,117 (53 %) |
| Unrecorded cost, reference run | $590 central, $440–$760 | $480–$600 |
| Passes that declared a block | 76 passes, 3.57 h, $82 | 47–76 passes, 3.6–5.5 h, $82–$94 |
| A5: first four waits | 35.6 h | 35.50 h |
| A5: glob expansion as a future saving | open | already fixed in `d6dab74`, present at `9cab15d` |

Figures that stand unchanged: every figure in items 1–5 of the assignment, the run endings, 0 automatic relaunches, and the first-turn token figures.

## Open questions / risks

1. **The reference run has no recorded code version.** Any statement "the run used version X" is wrong for part of the run (F-9). A run that executes a working tree under active development also means its behaviour changed between attempts for reasons outside the run. For the new product: record the code identity at run start and on every change, and run from an installed, immutable copy. This belongs with R14's telemetry gaps; R21's list of 20 does not have it.
2. **Baseline wording for the acceleration reports.** Reports that quote "32 % detached wait" or "11 % orchestrator verification" as the ordinary Claude baseline will misstate savings (F-4). Suggested wording: ordinary Claude runs are 69 % proposer, 23 % orchestrator verification, 4 % critic, with 17 % of proposer time in killed passes; the reference run is 64 % detached wait and 40 % of proposer time in killed passes.
3. **"Failed attempt time" counts waiting.** For a fair micro-loop evaluation, attempt time should be split into pass time and wait time before shares are compared (F-5).
4. **Independence of this check.** The definitions are shared with R21 by design, so a definition error common to both would not show here. The two places where an independent definition was possible (first action, blocked passes) are the two places where results moved.
5. **Subagent usage after a kill.** Whether subagent sessions keep consuming after the parent pass is killed was not tested; if they do, the unrecorded cost is understated by both reports. `unverified` — the transcripts carry no pass id to decide it.
6. **Decisions.** Nothing found here makes an owner decision infeasible. Decision 21's "cost no worse" test remains unsound on recorded cost alone, as R21 states.
