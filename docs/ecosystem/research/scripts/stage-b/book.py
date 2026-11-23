#!/usr/bin/env python3
"""Orchestrator bookkeeping for one finished feature. Input: a JSON file.
{dir, fr, sc, tasks, split: "text or empty", analyze: "text",
 dv: [[as_is, new, decision, oracle], ...]   (in the order DV-new-1..n)
 cq: [[question, source, recommended, otherwise], ...] (order CQ-pending-1..n)
 f100: ["amendment wanted from feature 100", ...], note: "ledger note"}"""
import json, re, sys, glob, subprocess, os

j = json.load(open(os.path.abspath(sys.argv[1])))
os.chdir('/root/specstride-claude')
d = j['dir']; num = d[:3]; E = 'docs/ecosystem/'
cons = open(E+'consolidation.md').read()
last_dv = max(int(x) for x in re.findall(r'(?m)^\| DV-(\d{3}) \|', cons[cons.find('## 6. Divergence register'):]))
queue = open(E+'CLARIFY-QUEUE.md').read().rstrip('\n')
last_cq = max(int(x) for x in re.findall(r'(?m)^\| CQ-(\d{3}) \|', queue))
dvmap = {i+1: 'DV-%03d' % (last_dv+i+1) for i in range(len(j.get('dv', [])))}
cqmap = {i+1: 'CQ-%03d' % (last_cq+i+1) for i in range(len(j.get('cq', [])))}
for f in glob.glob('specs/%s/**/*' % d, recursive=True):
    if not os.path.isfile(f) or not f.endswith(('.md', '.json', '.tsv', '.yaml', '.yml', '.txt')): continue
    t = open(f, encoding='utf-8', errors='replace').read(); o = t
    t = re.sub(r'DV-new-(\d+)', lambda m: dvmap.get(int(m.group(1)), m.group(0)), t)
    t = re.sub(r'CQ-pending-(\d+)', lambda m: cqmap.get(int(m.group(1)), m.group(0)), t)
    if t != o: open(f, 'w').write(t)
if dvmap:
    lines = cons.split('\n')
    i = max(n for n, l in enumerate(lines) if re.match(r'^\| DV-%03d \|' % last_dv, l))
    rows = ['| %s | %s | %s | %s | %s | Row written in Stage B for feature %s; put to the owner in the clarification round |'
            % (dvmap[k+1], r[0], r[1], r[2], r[3], num) for k, r in enumerate(j['dv'])]
    lines[i+1:i+1] = rows
    cons = '\n'.join(lines)
    cons = re.sub(r'Count: \d+ rows, DV-001 to DV-\d{3} \(', 'Count: %d rows, DV-001 to DV-%03d (' % (last_dv+len(rows), last_dv+len(rows)), cons)
    open(E+'consolidation.md', 'w').write(cons)
    s = open(E+'check-traceability.py').read()
    s = re.sub(r'N_REGISTER = \d+', 'N_REGISTER = %d' % (last_dv+len(rows)), s)
    open(E+'check-traceability.py', 'w').write(s)
if cqmap:
    for k, r in enumerate(j['cq']):
        queue += '\n| %s | %s | %s | %s | %s | %s | open; raised by feature %s on 2026-09-29 |' % (cqmap[k+1], num, r[0], r[1], r[2], r[3], num)
    open(E+'CLARIFY-QUEUE.md', 'w').write(queue+'\n')
p = E+'PROGRESS.md'; s = open(p).read()
files = {'specify': 'spec.md', 'clarify': 'spec.md (Clarifications)', 'plan': 'plan.md', 'tasks': 'tasks.md', 'analyze': 'analyze-report.md'}
for st, fn in files.items():
    reqs = '%s FR, %s SC' % (j['fr'], j['sc']) if st == 'specify' else ('%s tasks' % j['tasks'] if st == 'tasks' else '')
    s, n = re.subn(r'\| %s \| 2 \| (top|mid) \| %s \| \w+ \| ([^|]*)\| [^|]*\| [^|]*\|' % (re.escape(d), st),
                   lambda m: '| %s | 2 | %s | %s | done | %s| %s | 2026-09-29 |' % (d, m.group(1), st, m.group(2), reqs), s)
    assert n == 1, (st, n)
note = '- 2026-09-29: **%s** done through analyze: %s requirements, %s success criteria, %s tasks.' % (d, j['fr'], j['sc'], j['tasks'])
if dvmap: note += ' Register rows %s to %s written.' % (dvmap[1], dvmap[len(dvmap)])
if cqmap: note += ' Questions %s to %s queued.' % (cqmap[1], cqmap[len(cqmap)])
if j.get('split'):
    note += ' Split proposed: ' + j['split']
    s = s.replace('None yet. A split is proposed', '- %s: %s\n\nA split is proposed' % (d, j['split'])) if 'None yet. A split is proposed' in s else s.replace('\nA split is proposed', '- %s: %s\n\nA split is proposed' % (d, j['split']), 1)
if j.get('analyze'): note += ' Analyze: ' + j['analyze']
if j.get('note'): note += ' ' + j['note']
s = s.replace('### Stage B notes\n', '### Stage B notes\n\n' + note, 1)
open(p, 'w').write(s)
if j.get('f100'):
    a = E+'STAGE-B-F100-AMENDMENTS.md'
    if not os.path.exists(a):
        open(a, 'w').write('# STAGE-B-F100-AMENDMENTS\n\nWhat the tier 2 features need from feature 100. Collected by the orchestrator during the fan-out and applied to feature 100 in one change after it, by appending and never renumbering. Ids in the text are already the final register and queue ids.\n\n| Feature | Wanted from feature 100 | Applied |\n|---|---|---|\n')
    with open(a, 'a') as f:
        for x in j['f100']:
            x = re.sub(r'DV-new-(\d+)', lambda m: dvmap.get(int(m.group(1)), m.group(0)), x)
            x = re.sub(r'CQ-pending-(\d+)', lambda m: cqmap.get(int(m.group(1)), m.group(0)), x)
            f.write('| %s | %s | no |\n' % (num, x.replace('|', '/')))
out = subprocess.run(['python3', E+'check-traceability.py'], capture_output=True, text=True).stdout
mine = [l for l in out.splitlines() if l.strip().startswith('[h') and ('F'+num in l or d in l)]
print('maps', dvmap, cqmap); print('check lines for feature:', mine or 'none')
subprocess.run(['git', 'add', 'specs/'+d, 'docs/ecosystem', '.specify'], check=True)
subprocess.run(['git', 'commit', '-q', '-m', 'specs(%s): %s, all five steps\n\nCo-Authored-By: Claude <noreply@anthropic.com>' % (num, d.split('-', 1)[1])], check=True)
print(subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True).stdout)
