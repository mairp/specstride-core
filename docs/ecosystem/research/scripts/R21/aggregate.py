#!/usr/bin/env python3
"""Aggregate runs.json (from baseline.py). Usage: python3 aggregate.py [section]"""
import json, sys, collections, statistics as st, os
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
H = 3600.0


def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def real(r):
    return r['store'] != '.lisa' and r['proposer'] not in ('stub', 'none') and len(r['passes']) > 0


def table(rows, hdr):
    print('| ' + ' | '.join(hdr) + ' |')
    print('|' + '---|' * len(hdr))
    for r in rows:
        print('| ' + ' | '.join(str(x) for x in r) + ' |')
    print()


def f1(x): return '%.1f' % x
def f2(x): return '%.2f' % x


R = [r for r in runs if real(r)]
print('## population')
print('unique runs', len(runs), 'real (non-stub, non-.lisa, >=1 pass)', len(R))
print('excluded: .lisa', sum(1 for r in runs if r['store'] == '.lisa'), 'stub/none', sum(1 for r in runs if r['store'] != '.lisa' and r['proposer'] in ('stub', 'none')),
      'no pass', sum(1 for r in runs if r['store'] != '.lisa' and r['proposer'] not in ('stub', 'none') and not r['passes']))
print('duplicated copies dropped:', sum(len(r.get('dup_paths', [])) for r in runs))
print('date range', min(r['t0'] for r in R), max(r['t1'] for r in R))

cats = ['proposer', 'yield', 'longjob', 'verification', 'critic', 'diag', 'setup']


def agg(rs):
    a = collections.Counter()
    for r in rs:
        a['alive'] += r['alive']
        for c in cats: a[c] += r['tot'].get(c, 0)
        a['unattr'] += r['unattributed']
        a['passes'] += len(r['passes'])
        for p in r['passes']:
            if p['killed']:
                a['kills'] += 1; a['kill_s'] += p['active']
                a['kill_' + p['killed']] += 1; a['kills_' + p['killed']] += p['active']
            if p['outcome'].startswith('error'):
                a['errors'] += 1; a['error_s'] += p['active']
            if p['cost']:
                a['cost'] += p['cost']; a['cost_n'] += 1
            else:
                a['nocost_n'] += 1; a['nocost_s'] += p['active']
            a['in'] += p['in_tok'] + p['cr_tok'] + p['cc_tok']; a['out'] += p['out_tok']
        for v in r['verdicts']:
            a['v_' + str(v['result'])] += 1
        for t in r['attempts']:
            s = t['proposer'] + t['yield_'] + t['critic'] + t['verification'] + t['setup'] + t['diag']
            res = t['result'] or ('VFAIL' if t.get('vfail') else 'NONE')
            a['att_' + res] += 1; a['atts_' + res] += s; a['attc_' + res] += t['cost']
        a['phase_done'] += r['phase_done']
    return a


print('## by project x proposer family')
g = collections.defaultdict(list)
for r in R: g[(r['project'], r['proposer'], r['critic'])].append(r)
rows = []
for k in sorted(g, key=lambda k: -sum(r['alive'] for r in g[k])):
    a = agg(g[k])
    nv = a['v_APPROVED'] + a['v_REJECTED'] + a['v_MALFORMED']
    rows.append([k[0], k[1], k[2], len(g[k]), f1(a['alive'] / H), f1(a['proposer'] / H), f1((a['yield'] + a['longjob']) / H),
                 f1(a['verification'] / H), f2(a['critic'] / H), a['passes'], a['kills'], f1(a['kill_s'] / H), nv, a['v_APPROVED'],
                 a['v_REJECTED'], a['v_MALFORMED'], a['phase_done'], '%.0f' % a['cost'], a['cost_n']])
table(rows, ['project', 'proposer', 'critic', 'runs', 'alive h', 'proposer h', 'detached-wait h', 'orch. verification h', 'critic h',
             'passes', 'killed', 'killed h', 'verdicts', 'A', 'R', 'M', 'phases approved', 'cost $', 'passes with cost'])

print('## overall and by proposer family')
g = collections.defaultdict(list)
for r in R:
    g['ALL'].append(r); g['fam:' + r['proposer']].append(r)
    if r['project'] != 'NETOPS': g['ALL-except-NETOPS'].append(r)
    g['era:' + r['store']].append(r)
rows = []
for k in sorted(g):
    a = agg(g[k]); al = a['alive']
    rows.append([k, len(g[k]), f1(al / H)] + ['%s (%.1f%%)' % (f1(a[c] / H), 100 * a[c] / al) for c in cats] +
                ['%s (%.1f%%)' % (f1(a['unattr'] / H), 100 * a['unattr'] / al)])
table(rows, ['group', 'runs', 'alive h'] + cats + ['unattributed'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    rows.append([k, a['passes'], a['kills'], f1(a['kill_s'] / H), '%.1f%%' % (100 * a['kill_s'] / max(a['proposer'], 1)),
                 a['kill_hard_cap'], f1(a['kills_hard_cap'] / H), a['kill_repeat_stall'], f1(a['kills_repeat_stall'] / H),
                 a['kill_progress_stall'], f1(a['kills_progress_stall'] / H), a['errors'], f1(a['error_s'] / H)])
table(rows, ['group', 'passes', 'killed', 'killed h', 'killed % of proposer h', 'hard_cap n', 'hard_cap h', 'repeat_stall n', 'repeat_stall h',
             'progress_stall n', 'progress_stall h', 'errors n', 'errors h'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    na = sum(a[x] for x in a if x.startswith('att_'))
    sa = sum(a[x] for x in a if x.startswith('atts_'))
    rej = a['atts_REJECTED'] + a['atts_MALFORMED'] + a['atts_VFAIL']
    rows.append([k, na, a['att_APPROVED'], f1(a['atts_APPROVED'] / H), a['att_REJECTED'], f1(a['atts_REJECTED'] / H), a['att_MALFORMED'],
                 f1(a['atts_MALFORMED'] / H), a['att_VFAIL'], f1(a['atts_VFAIL'] / H), a['att_NONE'], f1(a['atts_NONE'] / H),
                 '%.1f%%' % (100 * rej / max(sa, 1)), '%.0f' % (a['attc_REJECTED'] + a['attc_MALFORMED'] + a['attc_VFAIL']), '%.0f' % a['cost']])
table(rows, ['group', 'attempts', 'approved n', 'approved h', 'rejected n', 'rejected h', 'malformed n', 'malformed h', 'verification-failed n',
             'verification-failed h', 'no verdict n', 'no verdict h', 'time in failed attempts % of attempt time', 'cost in failed attempts $', 'cost total $'])

rows = []
for k in sorted(g):
    a = agg(g[k])
    rows.append([k, a['cost_n'], '%.0f' % a['cost'], a['nocost_n'], f1(a['nocost_s'] / H), '%.0f' % (a['in'] / 1e6), '%.1f' % (a['out'] / 1e6)])
table(rows, ['group', 'passes with cost', 'cost $', 'passes without cost', 'their hours', 'input tokens M (incl. cache)', 'output tokens M'])

print('## distributions (all real runs)')
for k in ['ALL', 'ALL-except-NETOPS', 'fam:claude', 'fam:dsh', 'fam:local-backend']:
    ps = [p for r in g.get(k, []) for p in r['passes']]
    act = [p['active'] / 60 for p in ps]
    cr = [v['critic_s'] for r in g.get(k, []) for v in r['verdicts'] if v['critic_s'] > 0]
    su = [t['setup'] for r in g.get(k, []) for t in r['attempts'] if t['setup'] > 0]
    print(k, 'passes', len(ps), 'pass min median %.1f p90 %.1f max %.1f' % (pct(act, 50), pct(act, 90), max(act)),
          '| critic s n=%d median %.0f p90 %.0f max %.0f' % (len(cr), pct(cr, 50), pct(cr, 90), max(cr) if cr else 0),
          '| setup s n=%d median %.0f p90 %.0f' % (len(su), pct(su, 50), pct(su, 90)))

print('## attempts to approval per phase (per project+feature+phase, across runs)')
ph = collections.defaultdict(list)
for r in sorted(R, key=lambda r: r['t0']):
    for v in r['verdicts']:
        ph[(r['project'], r['feature'], r['path'].split('/runs/')[0], v['phase'])].append(v['result'])
napp = []; first = 0; never = 0
for k, v in ph.items():
    if 'APPROVED' in v:
        i = v.index('APPROVED') + 1; napp.append(i)
        if i == 1: first += 1
    else:
        never += 1
print('phases judged', len(ph), 'approved', len(napp), 'first-try', first, 'never approved', never,
      'attempts to approval mean %.2f median %.0f p90 %.0f max %d' % (st.mean(napp), pct(napp, 50), pct(napp, 90), max(napp)))

print('## stops and restart gaps')
c = collections.Counter(r['stop'] for r in R)
print(dict(c))
seq = collections.defaultdict(list)
for r in R: seq[r['path'].split('/runs/')[0]].append(r)
gaps = collections.defaultdict(list)
for k, v in seq.items():
    v.sort(key=lambda r: r['t0'])
    for a, b in zip(v, v[1:]):
        gaps[a['stop']].append((b['t0'] - a['t1']) / H)
rows = []
allg = []
for k, v in sorted(gaps.items(), key=lambda x: -len(x[1])):
    allg += v
    rows.append([k, len(v), f2(pct(v, 50)), f2(pct(v, 90)), f1(max(v)), f1(sum(v)), f1(sum(x for x in v if x <= 24))])
rows.append(['all', len(allg), f2(pct(allg, 50)), f2(pct(allg, 90)), f1(max(allg)), f1(sum(allg)), f1(sum(x for x in allg if x <= 24))])
table(rows, ['previous run ended with', 'restarts', 'gap median h', 'gap p90 h', 'gap max h', 'gap sum h', 'gap sum h (gaps <= 24 h only)'])
print('features with >1 run', sum(1 for v in seq.values() if len(v) > 1), 'of', len(seq), '; runs per feature median', pct([len(v) for v in seq.values()], 50), 'max', max(len(v) for v in seq.values()))
tot_alive = sum(r['alive'] for r in R) / H
print('total alive h', tot_alive, 'total gap h', sum(allg))

print('## first pass of a run (re-orientation after restart) vs other passes')
fp = [r['passes'][0]['active'] / 60 for r in R if r['resume'] not in (None, '', '0', '1') and r['passes']]
print('first pass after resume n=%d median %.1f min p90 %.1f sum %.1f h' % (len(fp), pct(fp, 50), pct(fp, 90), sum(fp) / 60))

print('## yields')
ys = [(r['project'], y) for r in R for y in r['yields']]
c = collections.Counter(); hs = collections.Counter()
for p, y in ys:
    c[(p, str(y['rc']))] += 1; hs[(p, str(y['rc']))] += y['dur'] / H
for k in sorted(c): print(k, c[k], f2(hs[k]))
