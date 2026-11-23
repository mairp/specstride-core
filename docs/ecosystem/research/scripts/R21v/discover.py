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
