#!/usr/bin/env python3
"""In-pass activity and orientation, from agent_tool/agent_text events only (no transcripts).
Interval between consecutive agent events inside a pass is attributed to the EARLIER event's category,
so a tool's bucket = tool run time + the model turn that follows it. ESTIMATE by construction."""
import json, os, re, sys, collections
D = os.path.dirname(os.path.abspath(__file__))
runs = json.load(open(os.path.join(D, 'runs.json')))
CUTOFF = float(sys.argv[1]) if len(sys.argv) > 1 else 9e18
H = 3600.0
READ = re.compile(r'^\s*(cd [^;&]+(;|&&)\s*)?(cat|ls|grep|rg|head|tail|find|wc|sed -n|git (log|status|diff|show)|stat|tree|jq|awk)\b')
WAIT = re.compile(r'(\bsleep \d|\buntil\b.*\bdo\b|\bwhile\b.*\bsleep\b|\bwait\b \$?\d*|tail -f)')
BOOK = re.compile(r'(PROGRESS\.md|/\.specstride/|/\.wiggum/|GATE\d+-|/gates/)')
PROBE = re.compile(r'^\s*(kubectl (get|logs|describe)|docker (ps|logs|inspect)|ps |pgrep|ss |curl )')


def cat(e):
    t = e.get('tool') or ''
    tg = str(e.get('target') or '')
    if t in ('Read', 'Grep', 'Glob', 'LS', 'NotebookRead'): return 'read'
    if t in ('Edit', 'Write', 'MultiEdit', 'NotebookEdit'):
        return 'bookkeeping' if BOOK.search(tg) else 'edit'
    if t in ('Agent', 'Task'): return 'subagent'
    if t in ('Monitor', 'ScheduleWakeup', 'TaskOutput', 'BashOutput'): return 'wait'
    if t == 'Bash':
        if WAIT.search(tg): return 'wait'
        if PROBE.search(tg): return 'probe'
        if READ.search(tg): return 'read'
        return 'exec'
    return 'other'


def pct(xs, p):
    xs = sorted(xs)
    if not xs: return float('nan')
    k = (len(xs) - 1) * p / 100.0
    f = int(k); c = min(f + 1, len(xs) - 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


res = collections.defaultdict(lambda: dict(cat=collections.Counter(), orient=[], orient_calls=[], share=[], passes=0, hours=0.0,
                                           byout=collections.defaultdict(collections.Counter), prog=0, first3=0, noact=0))
for r in runs:
    if r['store'] == '.lisa' or r['proposer'] in ('stub', 'none') or not r['passes']:
        continue
    evs = []
    for l in open(r['path'], errors='replace'):
        if '"agent_' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        if e.get('event') not in ('agent_tool', 'agent_text', 'agent_init'): continue
        try: t = float(e['ts'])
        except Exception: continue
        if t > CUTOFF: continue
        evs.append((t, e))
    evs.sort(key=lambda x: x[0])
    i = 0
    for p in r['passes']:
        while i < len(evs) and evs[i][0] < p['start']: i += 1
        j = i
        seq = []
        while j < len(evs) and evs[j][0] <= p['end']:
            seq.append(evs[j]); j += 1
        i = j
        if not any(e['event'] == 'agent_tool' for _, e in seq):
            continue
        for key in (r['proposer'], r['proposer'] + '/' + r['project'], 'ALL'):
            g = res[key]
            g['passes'] += 1; g['hours'] += p['active'] / H
            out = p['outcome']
            prev_t = p['start']; prev_c = 'startup'
            first_action = None; calls = 0; ncall = 0; sawprog = False; prog3 = False
            for t, e in seq:
                g['cat'][prev_c] += t - prev_t
                g['byout'][out][prev_c] += t - prev_t
                if e['event'] == 'agent_tool':
                    c = cat(e); ncall += 1
                    if 'PROGRESS.md' in str(e.get('target') or ''):
                        if not sawprog and ncall <= 3: prog3 = True
                        sawprog = True
                    if first_action is None:
                        if c in ('edit', 'exec', 'subagent'):
                            first_action = t - p['start']
                        else:
                            calls += 1
                elif e['event'] == 'agent_text':
                    c = 'model'
                else:
                    c = prev_c
                prev_t, prev_c = t, c
            g['cat'][prev_c] += max(0, p['end'] - prev_t)
            g['byout'][out][prev_c] += max(0, p['end'] - prev_t)
            if sawprog: g['prog'] += 1
            if prog3: g['first3'] += 1
            if first_action is None:
                g['noact'] += 1
            else:
                g['orient'].append(first_action); g['orient_calls'].append(calls)
                if p['active'] > 0: g['share'].append(first_action / p['active'])

cats = ['model', 'exec', 'wait', 'subagent', 'edit', 'bookkeeping', 'read', 'probe', 'other', 'startup']
print('| group | passes with tool events | hours | ' + ' | '.join(c + ' %' for c in cats) + ' |')
print('|---|---|---|' + '---|' * len(cats))
for k in sorted(res, key=lambda k: -res[k]['hours']):
    g = res[k]
    if g['passes'] < 5: continue
    tot = sum(g['cat'].values()) or 1
    print('| %s | %d | %.1f | ' % (k, g['passes'], g['hours']) + ' | '.join('%.1f' % (100 * g['cat'][c] / tot) for c in cats) + ' |')
print()
print('| group | passes | passes reaching an action | min to first action median | p90 | sum h | % of pass hours | orientation calls median | p90 | share of pass median | passes touching PROGRESS.md | within first 3 calls |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|')
for k in sorted(res, key=lambda k: -res[k]['hours']):
    g = res[k]
    if g['passes'] < 5: continue
    o = g['orient']
    print('| %s | %d | %d | %.1f | %.1f | %.1f | %.1f | %.0f | %.0f | %.1f%% | %d | %d |' % (
        k, g['passes'], len(o), pct(o, 50) / 60, pct(o, 90) / 60, sum(o) / H, 100 * (sum(o) / H) / max(g['hours'], 1e-9),
        pct(g['orient_calls'], 50), pct(g['orient_calls'], 90), 100 * pct(g['share'], 50), g['prog'], g['first3']))
print()
g = res['ALL']
print('by outcome (ALL): share of time per category')
for out, c in sorted(g['byout'].items(), key=lambda x: -sum(x[1].values())):
    tot = sum(c.values()) or 1
    print(out, '%.1f h' % (tot / H), {k: round(100 * v / tot, 1) for k, v in c.most_common(6)})
g = res.get('claude/NETOPS')
if g:
    print('by outcome (claude/NETOPS)')
    for out, c in sorted(g['byout'].items(), key=lambda x: -sum(x[1].values())):
        tot = sum(c.values()) or 1
        print(out, '%.1f h' % (tot / H), {k: round(100 * v / tot, 1) for k, v in c.most_common(6)})
