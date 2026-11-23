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
