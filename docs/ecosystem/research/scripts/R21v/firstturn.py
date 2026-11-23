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
