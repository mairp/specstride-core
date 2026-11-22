#!/usr/bin/env python3
"""Per feature (one state directory = one feature): launch-to-done calendar time, alive time, gaps, phases, passes, cost.
And per-phase table for a chosen project (arg 2)."""
import json, os, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
H = 3600.0
def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)
feat = collections.defaultdict(list)
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']: continue
    feat[r['path'].split('/runs/')[0]].append(r)
names = {}
rows = []
for i, (k, v) in enumerate(sorted(feat.items(), key=lambda kv: min(r['t0'] for r in kv[1]))):
    v.sort(key=lambda r: r['t0'])
    fid = '%s-F%02d' % (v[0]['project'], i + 1); names[k] = fid
    alive = sum(r['alive'] for r in v) / H
    cal = (v[-1]['t1'] - v[0]['t0']) / H
    done = v[-1]['stop'] == 'all_approved'
    ph = sum(r['phase_done'] for r in v)
    tot = v[-1]['phases_total']
    passes = sum(len(r['passes']) for r in v)
    kills = sum(1 for r in v for p in r['passes'] if p['killed'])
    nv = collections.Counter(x['result'] for r in v for x in r['verdicts'])
    cost = sum(p['cost'] or 0 for r in v for p in r['passes'])
    prop = sorted({r['proposer'] for r in v}); crit = sorted({r['critic'] for r in v})
    mode = 'reverse' if ('reverse' in k.lower() or 'reverse' in (v[0]['feature'] or '').lower() or 'as-is' in (v[0]['feature'] or '').lower()) else 'forward'
    rows.append([fid, mode, '+'.join(prop), '+'.join(crit), len(v), tot, ph, 'yes' if done else 'no', '%.1f' % cal, '%.1f' % alive, '%.1f' % (cal - alive), passes, kills,
                 nv['APPROVED'], nv['REJECTED'], nv['MALFORMED'], '%.0f' % cost, '%.2f' % (alive / ph) if ph else '-'])
hdr = ['feature', 'mode', 'proposer', 'critic', 'runs', 'phases', 'phases approved', 'finished', 'calendar h', 'alive h', 'gap h', 'passes', 'killed passes', 'A', 'R', 'M', 'recorded cost $', 'alive h per approved phase']
print('| ' + ' | '.join(hdr) + ' |'); print('|' + '---|' * len(hdr))
for r in rows: print('| ' + ' | '.join(str(x) for x in r) + ' |')
fin = [r for r in rows if r[7] == 'yes']
print('\nfinished features', len(fin), 'of', len(rows))
for lab, sel in (('finished, claude proposer', [r for r in fin if 'claude' in r[2]]), ('finished, all', fin)):
    if sel:
        print(lab, 'n=%d' % len(sel), 'calendar h median %.1f p90 %.1f | alive h median %.1f p90 %.1f | alive h per approved phase median %.2f p90 %.2f | runs per feature median %.0f max %d' % (
            pct([float(r[8]) for r in sel], 50), pct([float(r[8]) for r in sel], 90), pct([float(r[9]) for r in sel], 50), pct([float(r[9]) for r in sel], 90),
            pct([float(r[17]) for r in sel if r[17] != '-'], 50), pct([float(r[17]) for r in sel if r[17] != '-'], 90), pct([r[4] for r in sel], 50), max(r[4] for r in sel)))
with open(os.path.join(D, 'feature-aliases.tsv'), 'w') as fh:
    for k, v in names.items(): fh.write('%s\t%s\n' % (v, k))

proj = sys.argv[1] if len(sys.argv) > 1 else 'NETOPS'
print('\n## per phase,', proj)
ph = collections.defaultdict(lambda: collections.Counter())
res = collections.defaultdict(list)
for k, v in feat.items():
    if v[0]['project'] != proj: continue
    for r in v:
        for a in r['attempts']:
            key = (names[k], int(a['phase'] or 0))
            c = ph[key]
            c['attempts'] += 1
            for f in ('proposer', 'yield_', 'critic', 'verification', 'setup', 'diag'): c[f] += a[f]
            s = sum(a[f] for f in ('proposer', 'yield_', 'critic', 'verification', 'setup', 'diag'))
            resu = a['result'] or ('VFAIL' if a.get('vfail') else 'NONE')
            c['t_' + resu] += s; c['n_' + resu] += 1
            res[key].append(resu[0])
        for p in r['passes']:
            key = (names[k], int(p['phase'] or 0)); c = ph[key]
            c['passes'] += 1
            if p['killed'] == 'hard_cap': c['cap'] += 1; c['cap_s'] += p['active']
            elif p['killed']: c['stall'] += 1; c['stall_s'] += p['active']
            c['cost'] += p['cost'] or 0
            if not p['cost']: c['nocost'] += 1
            c['tok_in'] += p['in_tok'] + p['cr_tok'] + p['cc_tok']; c['tok_out'] += p['out_tok']
hdr = ['feature', 'phase', 'attempts (results in order)', 'passes', 'cap kills (h)', 'stall kills (h)', 'proposer h', 'detached wait h', 'orch. verification h', 'critic min', 'setup min',
       'time in attempts that failed h', 'time in attempts with no verdict h', 'recorded cost $', 'passes without cost', 'input tokens M', 'output tokens M']
print('| ' + ' | '.join(hdr) + ' |'); print('|' + '---|' * len(hdr))
for key in sorted(ph):
    c = ph[key]
    print('| %s | %d | %d (%s) | %d | %d (%.2f) | %d (%.2f) | %.2f | %.2f | %.2f | %.1f | %.1f | %.2f | %.2f | %.0f | %d | %.0f | %.2f |' % (
        key[0], key[1], c['attempts'], ''.join(res[key]), c['passes'], c['cap'], c['cap_s'] / H, c['stall'], c['stall_s'] / H, c['proposer'] / H, c['yield_'] / H, c['verification'] / H,
        c['critic'] / 60, c['setup'] / 60, (c['t_REJECTED'] + c['t_MALFORMED'] + c['t_VFAIL']) / H, c['t_NONE'] / H, c['cost'], c['nocost'], c['tok_in'] / 1e6, c['tok_out'] / 1e6))
