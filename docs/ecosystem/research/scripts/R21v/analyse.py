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
