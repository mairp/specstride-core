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
