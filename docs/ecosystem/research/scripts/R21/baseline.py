#!/usr/bin/env python3
"""R21 time-use baseline. Read-only over run state. Usage:
   python3 baseline.py [CUTOFF_EPOCH]  -> writes runs.json, aliases.tsv in this directory
Every events.jsonl from the Specstride lineage (.specstride/, .wiggum/) and .lisa/ under /root is parsed.
Events after CUTOFF_EPOCH are ignored, so a verifier can reproduce a figure on a live run.
"""
import json, os, sys, hashlib, subprocess, collections, re

OUT = os.path.dirname(os.path.abspath(__file__))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
NOISE = ('agent_tool', 'agent_text', 'agent_diagnostic', 'telemetry_delivery', 'yield_wait')


def find_files():
    cmd = ("find /root -name events.jsonl \\( -path '*/.specstride/*' -o -path '*/.wiggum/*' -o -path '*/.lisa/*' \\) "
           "-not -path '*/node_modules/*' -not -path '/root/.claude/*' -size +0 2>/dev/null | sort")
    return subprocess.check_output(cmd, shell=True, text=True).split()


def ts_of(e):
    t = e.get('ts')
    try:
        return float(t)
    except Exception:
        return None


def family(p):
    p = str(p or '')
    if p.startswith('claude-agent-sdk'): return 'claude-sdk'
    if p.startswith('claude'): return 'claude'
    if p.startswith('dsh'): return 'dsh'
    if p.startswith('prime'): return 'prime'
    if p.startswith('fake'): return 'stub'
    if p in ('', 'None'): return 'none'
    return 'local-backend'


def project_root(path):
    m = re.match(r'(/root/[^/]+)', path)
    return m.group(1)


def parse(path):
    evs = []
    tools = collections.Counter()
    with open(path, errors='replace') as fh:
        for l in fh:
            try:
                e = json.loads(l)
            except Exception:
                continue
            t = ts_of(e)
            if t is None or t > CUTOFF:
                continue
            ev = e.get('event') or e.get('type')
            if ev in NOISE:
                if ev == 'yield_wait':
                    evs.append((t, '_tick', {}))
                else:
                    evs.append((t, '_tick', {}))
                continue
            evs.append((t, ev, e))
    return evs


def analyse(path):
    evs = parse(path)
    if not evs:
        return None
    r = dict(path=path, n=len(evs), t0=evs[0][0], t1=evs[-1][0])
    rs = next((e for _, ev, e in evs if ev == 'run_start'), {})
    r['run_id'] = rs.get('run_id') or os.path.basename(os.path.dirname(path))
    r['proposer'] = family(rs.get('proposer'))
    r['critic'] = family(rs.get('critic'))
    r['same_family'] = r['proposer'] == r['critic']
    r['feature'] = rs.get('feature') or ''
    r['resume'] = rs.get('resume')
    r['phases_total'] = rs.get('phases')
    r['verification_mode'] = rs.get('verification')
    stop = [e for _, ev, e in evs if ev in ('run_stop', 'run_end')]
    r['stop'] = (stop[-1].get('reason') or stop[-1].get('outcome') or stop[-1].get('event')) if stop else 'no_terminal_event'

    phase = attempt = None
    passes = []      # dict per pass
    attempts = {}    # (phase, attempt_seq) -> dict
    aseq = 0
    cur = None       # open pass
    open_iv = {}     # kind -> start ts
    tot = collections.Counter()
    verdicts = []
    yields = []
    curatt = None
    last_pass_end_kind = None

    def att():
        nonlocal curatt
        return curatt

    def close_pass(t, kind):
        nonlocal cur, last_pass_end_kind
        if cur is None:
            return
        cur['end'] = t
        cur['active'] = max(0.0, t - cur['start'])
        if cur.get('outcome') is None:
            cur['outcome'] = kind
        passes.append(cur)
        if curatt is not None:
            curatt['proposer'] += cur['active']
            curatt['passes'] += 1
        last_pass_end_kind = cur['outcome']
        cur = None

    for t, ev, e in evs:
        if ev == '_tick':
            continue
        if ev == 'phase_start':
            phase = e.get('phase')
        elif ev in ('proposer_start', 'accelerator_start'):
            close_pass(t, 'superseded')
            aseq += 1
            attempt = e.get('attempt')
            phase = e.get('phase', phase)
            curatt = dict(phase=phase, attempt=attempt, seq=aseq, kind=ev, start=t, proposer=0.0, yield_=0.0,
                          critic=0.0, verification=0.0, setup=0.0, diag=0.0, passes=0, kills=0, cost=0.0,
                          result=None, end=None)
            attempts[aseq] = curatt
            open_iv['setup'] = t
        elif ev == 'iter_start':
            close_pass(t, 'superseded')
            if 'setup' in open_iv:
                d = t - open_iv.pop('setup')
                tot['setup'] += d
                if curatt: curatt['setup'] += d
            cur = dict(start=t, iter=e.get('iter'), phase=phase, attempt=attempt, aseq=aseq, outcome=None,
                       cost=None, results=0, inits=0, in_tok=0, out_tok=0, cr_tok=0, cc_tok=0, killed=None,
                       after=last_pass_end_kind, max_dur=-1)
        elif ev == 'agent_init':
            if cur: cur['inits'] += 1
        elif ev == 'agent_result':
            if cur:
                cur['results'] += 1
                for k, f in (('in_tok', 'input_tokens'), ('out_tok', 'output_tokens'),
                             ('cr_tok', 'cache_read_tokens'), ('cc_tok', 'cache_creation_tokens')):
                    try: cur[k] += int(e.get(f) or 0)
                    except Exception: pass
                try:
                    c = float(e.get('cost_usd'))
                    cur['cost'] = max(cur['cost'] or 0.0, c)
                except Exception:
                    pass
        elif ev == 'pass_killed':
            if cur:
                cur['killed'] = e.get('reason')
                cur['outcome'] = 'killed:' + str(e.get('reason'))
                if curatt: curatt['kills'] += 1
                close_pass(t, 'killed')
        elif ev == 'iter_error':
            if cur:
                st = e.get('subtype') or e.get('reason')
                if st and st.startswith('watchdog_'):
                    cur['killed'] = st.replace('watchdog_', '')
                    cur['outcome'] = 'killed:' + cur['killed']
                    if curatt: curatt['kills'] += 1
                elif st == 'success':
                    cur['outcome'] = 'error:empty_success'
                else:
                    cur['outcome'] = 'error:' + str(st)
                close_pass(t, 'error')
        elif ev == 'pass_yield':
            if cur:
                cur['outcome'] = 'yield'
                close_pass(t, 'yield')
            open_iv['yield'] = t
        elif ev == 'yield_resume':
            if 'yield' in open_iv:
                s = open_iv.pop('yield')
                d = t - s
                tot['yield'] += d
                if curatt: curatt['yield_'] += d
                yields.append(dict(start=s, dur=d, rc=e.get('job_rc'), phase=phase, open=False))
        elif ev == 'long_job_start':
            open_iv['longjob'] = t
        elif ev == 'long_job_ended':
            if 'longjob' in open_iv:
                tot['longjob'] += t - open_iv.pop('longjob')
        elif ev in ('iter_done', 'evidence_written'):
            if cur:
                if ev == 'evidence_written' or e.get('evidence') not in (None, 'missing'):
                    cur['outcome'] = 'evidence'
                close_pass(t, 'normal')
            elif ev == 'evidence_written' and passes and passes[-1]['outcome'] == 'normal' and t - passes[-1]['end'] < 5:
                passes[-1]['outcome'] = 'evidence'
        elif ev == 'verification_start':
            close_pass(t, 'normal')
            open_iv['verification'] = t
        elif ev in ('verification_passed', 'verification_failed', 'verification_release_passed'):
            if 'verification' in open_iv:
                d = t - open_iv.pop('verification')
                tot['verification'] += d
                if curatt: curatt['verification'] += d
            if ev == 'verification_failed' and curatt is not None:
                curatt['vfail'] = True
        elif ev == 'critic_start':
            close_pass(t, 'normal')
            open_iv['critic'] = t
        elif ev == 'verdict':
            d = 0.0
            if 'critic' in open_iv:
                d = t - open_iv.pop('critic')
                tot['critic'] += d
                if curatt: curatt['critic'] += d
            verdicts.append(dict(t=t, phase=e.get('phase'), attempt=e.get('attempt'), result=e.get('result'), critic_s=d,
                                 aseq=aseq))
            if curatt is not None and curatt['result'] is None:
                curatt['result'] = e.get('result')
                curatt['end'] = t
        elif ev == 'diagnostician_start':
            open_iv['diag'] = t
        elif ev in ('diagnostician_done', 'diagnostician_error'):
            if 'diag' in open_iv:
                d = t - open_iv.pop('diag')
                tot['diag'] += d
                if curatt: curatt['diag'] += d
        elif ev in ('run_stop', 'run_end'):
            close_pass(t, 'cut_by_run_end')
    # open intervals at end of file
    tend = evs[-1][0]
    if cur is not None:
        cur['outcome'] = 'open_at_end'
        close_pass(tend, 'open_at_end')
    if 'yield' in open_iv:
        s = open_iv.pop('yield'); d = tend - s
        tot['yield'] += d
        if curatt: curatt['yield_'] += d
        yields.append(dict(start=s, dur=d, rc='open', phase=phase, open=True))
    for k in ('critic', 'verification', 'diag', 'setup', 'longjob'):
        if k in open_iv:
            tot[k] += tend - open_iv[k]
    for p in passes:
        a = attempts.get(p['aseq'])
        if a is not None and p['cost']:
            a['cost'] += p['cost']
    tot['proposer'] = sum(p['active'] for p in passes)
    r['alive'] = r['t1'] - r['t0']
    r['tot'] = dict(tot)
    r['unattributed'] = r['alive'] - sum(tot.values())
    r['passes'] = passes
    r['attempts'] = list(attempts.values())
    r['verdicts'] = verdicts
    r['yields'] = yields
    r['phase_done'] = sum(1 for _, ev, _e in evs if ev == 'phase_done')
    r['real_agent'] = any(p['results'] or p['inits'] for p in passes)
    return r


def main():
    files = find_files()
    roots = sorted({project_root(f) for f in files})
    keep_names = {'/root/agentic-netops-srl': 'NETOPS', '/root/specstride': 'SPECSTRIDE', '/root/lisa': 'LISA',
                  '/root/mixture-of-loops': 'MOL'}
    alias = {}
    i = 0
    for rt in roots:
        if rt in keep_names:
            alias[rt] = keep_names[rt]
        else:
            i += 1
            alias[rt] = 'P%02d' % i
    with open(os.path.join(OUT, 'aliases.tsv'), 'w') as fh:
        for rt in roots:
            fh.write('%s\t%s\n' % (alias[rt], rt))
    runs = []
    seen = {}
    for f in files:
        try:
            r = analyse(f)
        except Exception as ex:
            print('ERR', f, ex, file=sys.stderr)
            continue
        if not r:
            continue
        r['project'] = alias[project_root(f)]
        r['store'] = '.lisa' if '/.lisa/' in f else ('.specstride' if '/.specstride/' in f else '.wiggum')
        key = (r['run_id'], round(r['t0'], 3))
        if key in seen:
            o = seen[key]
            o.setdefault('dup_paths', []).append(f)
            o.setdefault('dup_projects', []).append(r['project'])
            better = ('/runs/' in f and '/runs/' not in o['path']) or (r['n'] > o['n'] and not ('/runs/' in o['path'] and '/runs/' not in f))
            if better:
                r['dup_paths'] = o.get('dup_paths', []) + [o['path']]
                r['dup_projects'] = o['dup_projects']
                runs[runs.index(o)] = r
                seen[key] = r
            continue
        seen[key] = r
        runs.append(r)
    json.dump(runs, open(os.path.join(OUT, 'runs.json'), 'w'))
    print('files', len(files), 'unique runs', len(runs), 'cutoff', CUTOFF)


if __name__ == '__main__':
    main()
