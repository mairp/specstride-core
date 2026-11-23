#!/usr/bin/env python3
"""Generate the machine-readable form of the annexes of feature 100.

The annexes are the authority. This script reads their tables and writes the files of
`contracts/`, so that a schema file cannot differ from its annex section.

    python3 specs/100-specstride/contracts/tools/generate.py           write the files
    python3 specs/100-specstride/contracts/tools/generate.py --check   compare with the files on disk

It reads, besides the annexes, three hand-written source files in `contracts/sources/`:
`physical-paths.json`, `old-side.json` and `package-graph.json`. It validates them against
the annexes and the behaviour inventory and copies them into the generated data files.

Standard library only. It writes nothing outside `contracts/`.
"""
import csv
import json
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve()
CONTRACTS = HERE.parents[1]
FEATURE = HERE.parents[2]
REPO = HERE.parents[4]
ANNEX_DIR = FEATURE / 'annexes'
ANNEXES = [('A', 'A-foundations'), ('B', 'B-state'), ('C', 'C-ports-and-edges'),
           ('D', 'D-pass-loop'), ('E', 'E-engine'), ('F', 'F-runtime-root'),
           ('G', 'G-cli'), ('H', 'H-hosts'), ('X', 'X-cross-layer')]
URN = 'urn:specstride:schema:'
NOTE = 'Generated from the annexes of specs/100-specstride by contracts/tools/generate.py. The annex stands where the two differ.'

EP_SUBHEADS = ['Id and version', 'Purpose', 'Caller and time', 'Inputs', 'Outputs', 'Errors',
               'Guarantees of the core', 'Guarantees of an implementation',
               'Failure of an implementation', 'Unknown-value rule', 'Wave 1 implementations',
               'Content owner', 'Proving test']

# EP number, schema ids, annex letter, section, file stem, operations
EPS = [
    ('EP-01', ['specstride.host/1'], 'H', '§H.1', 'host', ['describe', 'renderSkill', 'renderEntry', 'renderStatusHooks', 'evalDriver.run']),
    ('EP-02', ['specstride.harness/1'], 'C', '§C.1', 'harness', ['detect', 'capabilities', 'preflight', 'startPass', 'complete', 'stop', 'betweenPasses', 'classify']),
    ('EP-03', ['specstride.spec-format/1'], 'C', '§C.7', 'spec-format', ['detect', 'parse', 'validate', 'tick', 'inputs']),
    ('EP-04', ['specstride.loop-layer/1'], 'D', '§D.1', 'loop-layer', ['contributePrompt', 'afterPass', 'betweenPasses', 'nextPassBlock', 'onEvidence', 'contributeCriticInput', 'resume', 'report']),
    ('EP-05', ['specstride.check-runner/1'], 'C', '§C.8', 'check-runner', ['pin', 'start', 'poll', 'result', 'cancel', 'environment']),
    ('EP-06', ['specstride.router-rules/1'], 'D', '§D.4', 'router-rules', ['route.decided']),
    ('EP-07', ['specstride.verification-source/1'], 'C', '§C.9', 'verification-source', ['discover', 'obligations', 'conflicts']),
    ('EP-08', ['specstride.event-sink/1'], 'C', '§C.10', 'event-sink', ['open', 'write', 'flush', 'close', 'status']),
    ('EP-09', ['specstride.view/1'], 'G', '§G.6', 'view', ['project', 'reduce']),
    ('EP-10', ['specstride.secret-resolver/1'], 'C', '§C.11', 'secret-resolver', ['handles', 'exists', 'resolve', 'boundHost']),
    ('EP-11', ['specstride.terms/1'], 'C', '§C.12', 'terms', ['evaluate']),
    ('EP-12', ['specstride.quota-classifier/1'], 'C', '§C.13', 'quota-classifier', ['classify', 'observe']),
    ('EP-13', ['specstride.lock/1'], 'F', '§F.5', 'lock', ['acquire', 'heartbeat', 'release', 'probe', 'reclaim', 'handDown', 'verify']),
    ('EP-14', ['specstride.doctor/1'], 'G', '§G.7', 'doctor', ['run']),
    ('EP-15', ['specstride.prompt-block/1'], 'D', '§D.5', 'prompt-block', ['blocks']),
    ('EP-16', ['specstride.toolchain/1'], 'C', '§C.14', 'toolchain', []),
    ('EP-17', ['specstride.detach/1'], 'F', '§F.6', 'detach', ['available', 'start', 'describe']),
    ('EP-18', ['specstride.critic-strategy/1', 'specstride.attempt-planner/1'], 'E', '§E.1', 'critic-strategy-and-attempt-planner', ['judge', 'next']),
    ('EP-19', ['specstride.stage-kind/1'], 'F', '§F.7', 'stage-kind', ['validate', 'run', 'evaluate']),
]

# schema id, file stem, annex, section, heading text of the (sub)section, first header cell of
# the field table, closed (unknown top-level key refuses)
RECORDS = [
    ('specstride.layout/1', 'workspace-record', 'B', '§B.6', '§B.6', 'Field', False),
    ('specstride.launch/1', 'launch-record', 'B', '§B.7', '§B.7', 'Field', False),
    ('specstride.lease/1', 'lease', 'B', '§B.8', '§B.8', 'Field', False),
    ('specstride.lease/1:owner', 'owner-record', 'B', '§B.9', '§B.9', 'Field', False),
    ('specstride.procs/1', 'process-registry', 'B', '§B.10', '§B.10', 'Field', False),
    ('specstride.inbox/1', 'inbox-request', 'B', '§B.11', '§B.11', 'Type', False),
    ('specstride.snapshot/1', 'run-snapshot', 'B', '§B.12', '§B.12', 'Field', False),
    ('specstride.ledger/1', 'ledger-record', 'B', '§B.13', '§B.13', 'Field', False),
    ('specstride.approval/1', 'approval-record', 'B', '§B.14', '§B.14', 'Field', False),
    ('specstride.terminal/1', 'terminal-record', 'B', '§B.15', '§B.15', 'Field', False),
    ('specstride.supervision/1', 'supervision-record', 'B', '§B.16', '§B.16', 'Field', False),
    ('specstride.pause/1', 'pause-record', 'B', '§B.17', '§B.17', 'Field', False),
    ('specstride.tripwire/1', 'tripwire-record', 'B', '§B.18', '§B.18', 'Field', False),
    ('specstride.harness/1:descriptor', 'harness-descriptor', 'C', '§C.2', '§C.2', 'Field', True),
    ('specstride.withheld-paths/1', 'withheld-paths', 'C', '§C.4', '§C.4', 'Field', False),
    ('specstride.stream-dialect/1', 'stream-dialect-row', 'C', '§C.5', '§C.5', 'Field of a row', False),
    ('specstride.registry/1', 'resolved-registry', 'C', '§C.6', '§C.6', 'Field', False),
    ('specstride.spec-format/1:model', 'canonical-spec-model', 'C', '§C.7', '§C.7', 'Field', False),
    ('specstride-overlay/v1', 'overlay', 'C', '§C.16', '§C.16', 'Field', False),
    ('specstride.parallel-plan/1', 'parallel-plan', 'D', '§D.3', '§D.3', 'Field', False),
    ('specstride-pass-yield/v1', 'yield-artifact', 'D', '§D.6', '§D.6', 'Field', False),
    ('specstride.fact-block/1', 'fact-block', 'D', '§D.7', '§D.7', 'Field', False),
    ('specstride.manifest/1', 'check-manifest', 'D', '§D.8', '§D.8', 'Field', False),
    ('specstride.run-state/1', 'run-record', 'E', '§E.2', 'Run record', 'Field', False),
    ('specstride.doctor/1', 'doctor-findings', 'G', '§G.7', '§G.7', 'Field', False),
    ('specstride.launch-contract/1', 'launch-contract', 'G', '§G.8', '§G.8', 'Field', True),
    ('specstride.event/1', 'event-envelope', 'X', '§X.1', '§X.1', 'Field', False),
    ('specstride.config/1', 'config-envelope', 'X', '§X.2', '§X.2', 'Field of a configuration file', True),
    ('specstride.table/1', 'rule-table', 'X', '§X.3', '§X.3', 'Field of a table', False),
    ('specstride.redaction/1', 'redaction-pattern-set', 'X', '§X.4', '§X.4', 'Field of the pattern set', False),
]


# ---------------------------------------------------------------- markdown

def cells(line):
    line = line.strip()
    if line.startswith('|'):
        line = line[1:]
    if line.endswith('|'):
        line = line[:-1]
    out, cur, tick = [], '', False
    for ch in line:
        if ch == '`':
            tick = not tick
        if ch == '|' and not tick:
            out.append(cur.strip())
            cur = ''
        else:
            cur += ch
    out.append(cur.strip())
    return out


def parse_annex(letter, stem):
    """Return the tables, the EP sub-sections and the requirements of one annex."""
    text = (ANNEX_DIR / (stem + '.md')).read_text()
    lines = text.split('\n')
    section, heading, sub = None, None, None
    tables, eps, reqs = [], {}, []
    i = 0
    buf_key = None
    while i < len(lines):
        ln = lines[i]
        m = re.match(r'^## (§[A-Z]\.\d+) (.*)$', ln)
        if m:
            section, heading, sub, buf_key = m.group(1), m.group(2).strip(), None, None
            i += 1
            continue
        m = re.match(r'^(###|####) (.*)$', ln)
        if m:
            sub = m.group(2).strip()
            buf_key = None
            if m.group(1) == '####' and sub in EP_SUBHEADS:
                buf_key = (section, sub)
                eps.setdefault(section, {})[sub] = []
            i += 1
            continue
        m = re.match(r'^- \*\*(F100-FR-\d{3})\*\*: (.*)$', ln)
        if m:
            buf_key = None
            req = {'id': m.group(1), 'annex': letter, 'section': section, 'text': m.group(2).strip()}
            i += 1
            while i < len(lines) and re.match(r'^  - [a-z]+: ', lines[i]):
                k, v = lines[i][4:].split(': ', 1)
                req[k] = v.strip()
                i += 1
            reqs.append(req)
            continue
        if ln.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            header = cells(ln)
            rows = []
            i += 2
            while i < len(lines) and lines[i].startswith('|'):
                rows.append(cells(lines[i]))
                i += 1
            tables.append({'annex': letter, 'section': section, 'heading': heading,
                           'subheading': sub, 'header': header, 'rows': rows})
            if buf_key:
                eps[buf_key[0]][buf_key[1]].append(
                    {'table': {'header': header, 'rows': rows}})
            continue
        if buf_key and ln.strip():
            eps[buf_key[0]][buf_key[1]].append(ln.rstrip())
        i += 1
    return tables, eps, reqs


def ticks(s):
    return re.findall(r'`([^`]+)`', s)


KEY = re.compile(r'^[A-Za-z][\w-]*(\.(<[\w-]+>|[\w-]+))+$')


def profile_keys(cell):
    """Return the configuration keys that a cell of the key column of §X.7 names.

    A cell that starts with a dash names no key. Text in parentheses is a remark and names
    no key. A short form (`.tokens`) takes the place of the last segment of the last full
    key. A name in backticks that is not a key (a flag, a verb) is left out.
    """
    cell = cell.strip()
    if cell.startswith('—') or cell.startswith('-'):
        return []
    cell = re.sub(r'\([^()]*\)', '', cell)
    keys, last = [], None
    for name in ticks(cell):
        name = name.strip()
        if name.startswith('.') and last:
            name = last.rsplit('.', 1)[0] + name
        elif KEY.match(name):
            last = name
        if KEY.match(name) and name not in keys:
            keys.append(name)
    return keys


def find_table(tables, annex, section, first, sub=None, nth=0):
    hits = [t for t in tables if t['annex'] == annex and t['section'] == section
            and t['header'][0] == first and (sub is None or t['subheading'] == sub)]
    if len(hits) <= nth:
        sys.exit('no table %s %s %r %r' % (annex, section, first, sub))
    return hits[nth]


def as_dicts(table):
    return [dict(zip(table['header'], r)) for r in table['rows']]


# ---------------------------------------------------------------- JSON Schema

def one_type(words):
    w = words.strip().lower()
    nullable = 'or null' in w
    w = w.replace(', or null', '').replace(' or null', '').strip()
    if w.startswith('member of a closed set') or w.startswith('member of'):
        t = {'type': 'string'}
    elif w.startswith('whole number'):
        t = {'type': 'integer'}
    elif w.startswith('truth value'):
        t = {'type': 'boolean'}
    elif w.startswith('timestamp'):
        t = {'type': 'string', 'format': 'date-time'}
    elif w.startswith('date'):
        t = {'type': 'string', 'format': 'date'}
    elif w.startswith('list'):
        t = {'type': 'array'}
    elif w.startswith('record') or w.startswith('map'):
        t = {'type': 'object'}
    elif 'text' in w or w.startswith('secret reference') or w.startswith('major and minor'):
        t = {'type': 'string'}
    else:
        t = {}
    if nullable and 'type' in t:
        t['type'] = [t['type'], 'null']
    return t


def types_for(words, n):
    parts = [p.strip() for p in re.split(r',(?![^(]*\))', words) if p.strip() and p.strip().lower() not in ('or null',)]
    merged = []
    for p in parts:
        if p.lower().startswith('or null') and merged:
            merged[-1] += ', or null'
        else:
            merged.append(p)
    if n == 1:
        return [one_type(words)]
    if len(merged) == n:
        return [one_type(p) for p in merged]
    if len(merged) == 1:
        return [one_type(merged[0]) for _ in range(n)]
    return [{} for _ in range(n)]


def place(root, path, node, required):
    """Put `node` at the dotted path (with [] for list items) below the schema `root`."""
    cur = root
    parts = re.split(r'\.', path)
    for k, part in enumerate(parts):
        is_list = part.endswith('[]')
        name = part[:-2] if is_list else part
        props = cur.setdefault('properties', {})
        last = k == len(parts) - 1
        if last and not is_list:
            existing = props.get(name, {})
            existing.update(node)
            props[name] = existing
            if required:
                cur.setdefault('required', [])
                if name not in cur['required']:
                    cur['required'].append(name)
            return
        child = props.setdefault(name, {})
        if is_list:
            child.setdefault('type', 'array')
            cur = child.setdefault('items', {'type': 'object'})
            if last:
                cur.update(node)
                return
        else:
            child.setdefault('type', 'object')
            cur = child


def record_schema(tables, spec):
    sid, stem, annex, section, where, first, closed = spec
    sub = where if not where.startswith('§') else None
    table = find_table(tables, annex, section, first, sub)
    hdr = table['header']
    name_col = 1 if first == 'Type' else 0
    schema = {
        '$schema': 'https://json-schema.org/draft/2020-12/schema',
        '$id': URN + sid,
        'title': stem,
        'description': NOTE,
        'x-schema-id': sid,
        'x-annex': 'annex %s, %s' % (annex, section),
        'type': 'object',
    }
    for row in table['rows']:
        d = dict(zip(hdr, row))
        names = [re.sub(r'\s*\(.*\)$', '', n) for n in ticks(row[name_col])
                 if re.match(r'^[A-Za-z_][\w.\[\]-]*$', re.sub(r'\s*\(.*\)$', '', n))]
        if not row[name_col].startswith('`'):
            names = []
        meaning = d.get('Meaning', '')
        words = d.get('Type in words', '')
        req = d.get('Required', '')
        if not names:
            schema.setdefault('x-notes', []).append(
                {'row': row[name_col], 'meaning': meaning, 'required': req})
            continue
        ts = types_for(words, len(names))
        for n, t in zip(names, ts):
            node = dict(t)
            node['description'] = meaning
            node['x-type-in-words'] = words
            node['x-required'] = req
            if first == 'Type':
                node['x-request-type'] = row[0].strip('`')
            lw = words.lower()
            if 'closed set' in lw and 'open set' not in lw and len(names) == 1:
                lits = ticks(meaning)
                low = meaning.lower()
                if len(lits) >= 2 and 'closed set of' not in low and 'enumeration of' not in low:
                    node['enum'] = lits + ([None] if 'null' in lw else [])
            required = req.strip().lower().startswith('yes') and first != 'Type'
            place(schema, n, node, required)
    if closed:
        schema['additionalProperties'] = False
        schema['patternProperties'] = {'^x-': {}}
    else:
        schema['additionalProperties'] = True
    schema['x-unknown-field'] = ('refused, except keys under x-' if closed
                                 else 'ignored by a reader (annex B, §B.4)')
    schema['x-different-major'] = 'refused (annex B, §B.4)'
    return schema


# ---------------------------------------------------------------- main

def dump(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + '\n'


def build():
    out = {}
    tables, eps, reqs = [], {}, []
    for letter, stem in ANNEXES:
        t, e, r = parse_annex(letter, stem)
        tables += t
        eps.update(e)
        reqs += r
        out['annex-tables/%s.json' % stem] = {
            'note': NOTE, 'annex': letter,
            'tables': [{k: x[k] for k in ('section', 'heading', 'subheading', 'header', 'rows')} for x in t]}

    # requirements index
    ids = [r['id'] for r in reqs]
    first = [i for i in ids if int(i[-3:]) <= 226]
    if first != ['F100-FR-%03d' % (n + 1) for n in range(226)]:
        sys.exit('the requirement ids 001 to 226 are not sequential in annex order')
    if sorted(ids) != ['F100-FR-%03d' % (n + 1) for n in range(len(ids))]:
        sys.exit('the requirement ids are not unique and without a gap')
    out['requirements.json'] = {'note': NOTE, 'count': len(reqs), 'requirements': reqs}

    # record schemas
    for spec in RECORDS:
        out['schemas/%s.schema.json' % spec[1]] = record_schema(tables, spec)

    # extension points
    index = []
    for ep, sids, annex, section, stem, ops in EPS:
        body = eps.get(section)
        if not body or [h for h in EP_SUBHEADS if h not in body]:
            sys.exit('extension point %s lacks a sub-heading in %s' % (ep, section))
        flat = json.dumps(body)
        for op in ops:
            if ('`%s`' % op) not in flat and op not in flat:
                sys.exit('%s: operation %s is not in %s' % (ep, op, section))
        own = [r['id'] for r in reqs if r.get('ep', '').startswith(ep + ' ')]
        doc = {'note': NOTE, 'ep': ep, 'ids': sids, 'annex': 'annex %s, %s' % (annex, section),
               'operations': ops, 'requirements': own,
               'sections': {h: body[h] for h in EP_SUBHEADS}}
        out['extension-points/%s.%s.json' % (ep, stem)] = doc
        index.append({'ep': ep, 'ids': sids, 'annex': annex, 'section': section,
                      'file': 'extension-points/%s.%s.json' % (ep, stem), 'operations': ops})
    out['extension-points/index.json'] = {'note': NOTE, 'extensionPoints': index}

    def data(name, sid, annex, section, payload):
        out['data/%s.json' % name] = dict(
            {'schema': sid, 'note': NOTE, 'annex': 'annex %s, %s' % (annex, section)}, **payload)

    # closed sets
    data('closed-sets', 'specstride.closed-sets/1', 'X', '§X.6',
         {'closedSets': [{'number': int(d['#']), 'name': d['Closed set'],
                          'members': d['Members, or where the list is'],
                          'literals': ticks(d['Members, or where the list is']),
                          'owner': d['Owner'], 'closedBy': d['Closed by'],
                          'unknownValue': d['Unknown value']}
                         for d in as_dicts(find_table(tables, 'X', '§X.6', '#'))]})
    # parity profile
    prof = as_dicts(find_table(tables, 'X', '§X.7', '#'))
    data('parity-profile', 'specstride.profile/1', 'X', '§X.7',
         {'profile': 'parity',
          'switches': [{'number': int(d['#']), 'switch': d['Switch'],
                        'key': (profile_keys(d['Key']) or [None])[0],
                        'keys': profile_keys(d['Key']),
                        'keyNote': d['Key'],
                        'default': d['Default'], 'parity': d['Under `parity`'],
                        'owner': d['Owner'], 'registerRows': re.findall(r'DV-\d{3}', d['Register row'])}
                       for d in prof]})
    # stop reasons
    data('stop-reasons', 'specstride.stop-reason/1', 'E', '§E.3',
         {'stopReasons': [{'number': int(d['#']), 'literal': d['Stop reason'].strip('`'),
                           'writtenBy': d['Written by'], 'engineExit': int(d['Engine exit']),
                           'transient': d['Transient'].lower().startswith('yes'),
                           'transientNote': d['Transient'],
                           'retryable': d['`retryable` in the terminal record'],
                           'matchedByStringAtBaseline': d['Matched by string at the baseline']}
                          for d in as_dicts(find_table(tables, 'E', '§E.3', '#'))]})
    # run-state machine
    data('run-state-machine', 'specstride.run-state/1', 'E', '§E.2',
         {'states': as_dicts(find_table(tables, 'E', '§E.2', 'State')),
          'transitions': as_dicts(find_table(tables, 'E', '§E.2', '#')),
          'blockedReasons': as_dicts(find_table(tables, 'E', '§E.2', 'Blocked reason'))})
    # exit codes
    e4 = [t for t in tables if t['annex'] == 'E' and t['section'] == '§E.4']
    data('exit-codes', 'specstride.exit-codes/1', 'E', '§E.4; annex F, §F.8; annex G, §G.4',
         {'engine': [{'process': t['subheading'], 'rows': as_dicts(t)} for t in e4],
          'runtimeRootAndPipelineEntry': as_dicts(find_table(tables, 'F', '§F.8', 'Code')),
          'perCommand': as_dicts(find_table(tables, 'G', '§G.4', 'Command')),
          'collisions': as_dicts(find_table(tables, 'G', '§G.4', 'Value')),
          'handshake': as_dicts(find_table(tables, 'F', '§F.3', 'Outcome'))})
    # cli protocol
    data('cli-protocol', 'specstride.cli-protocol/1', 'G', '§G.1, §G.2, §G.5',
         {'protocol': 1,
          'commands': as_dicts(find_table(tables, 'G', '§G.1', 'Command')),
          'outputModes': as_dicts(find_table(tables, 'G', '§G.2', 'Mode')),
          'budgets': as_dicts(find_table(tables, 'G', '§G.5', 'Subject')),
          'judgmentExchange': as_dicts(find_table(tables, 'G', '§G.9', 'Step'))})
    out['data/cli-protocol.json']['judgmentSchema'] = 'specstride.judgment/1'
    # line grammar
    data('line-grammar', 'specstride.line-grammar/1', 'G', '§G.3',
         {'form': 'opening square bracket, label, closing square bracket, one space, body, end of line',
          'label': '^[A-Z0-9-]+$',
          'families': as_dicts(find_table(tables, 'G', '§G.3', 'Family')),
          'supervisorLines': as_dicts(find_table(tables, 'G', '§G.3', 'Line')),
          'productLines': as_dicts(find_table(tables, 'G', '§G.3', 'Line', nth=1)),
          'digestStates': ['completed', 'failed', 'stopped', 'dry-run']})
    # threat model
    data('threat-model', 'specstride.threat-model/1', 'X', '§X.9',
         {'controls': as_dicts(find_table(tables, 'X', '§X.9', 'Control')),
          'threats': as_dicts(find_table(tables, 'X', '§X.9', 'Id'))})
    data('further-schema-ids', 'specstride.layout/1', 'B', '§B.20',
         {'schemaIds': as_dicts(find_table(tables, 'B', '§B.20', 'Schema id'))})
    data('presenter-interface', 'specstride.presenter/1', 'G', '§G.10',
         {'interface': as_dicts(find_table(tables, 'G', '§G.10', 'Subject'))})
    # identifiers
    data('identifiers', 'specstride.identifiers/1', 'B', '§B.3',
         {'identifiers': as_dicts(find_table(tables, 'B', '§B.3', 'Identifier'))})
    # harness tables
    data('harness-tables', 'specstride.harness/1', 'C', '§C.3, §C.6, §C.15',
         {'completionForms': as_dicts(find_table(tables, 'C', '§C.3', 'Form')),
          'criticOrder': as_dicts(find_table(tables, 'C', '§C.6', 'Step')),
          'containmentLevels': as_dicts(find_table(tables, 'C', '§C.15', 'Level')),
          'placeholders': ['{prompt}', '{promptFile}', '{workdir}', '{emptyTmp}', '{model}',
                           '{sessionId}', '{file:<name>}'],
          'normalizedStreamRecords': ['init', 'text', 'tool', 'usage', 'error', 'terminal']})
    # loop layer tables
    data('loop-layer-tables', 'specstride.loop-layer/1', 'D', '§D.1, §D.2, §D.4',
         {'callPoints': as_dicts(find_table(tables, 'D', '§D.1', '#')),
          'directives': as_dicts(find_table(tables, 'D', '§D.1', 'Directive')),
          'treeStoreOperations': as_dicts(find_table(tables, 'D', '§D.2', 'Operation')),
          'routerDecisionPoints': as_dicts(find_table(tables, 'D', '§D.4', 'Decision point'))})
    # process model
    data('process-model', 'specstride.process-model/1', 'F', '§F.1, §F.2, §F.4',
         {'processes': as_dicts(find_table(tables, 'F', '§F.1', 'Process')),
          'runRequests': as_dicts(find_table(tables, 'F', '§F.2', 'Kind')),
          'relaunchOwner': as_dicts(find_table(tables, 'F', '§F.4', '`relaunch.owner`'))})
    # config
    data('config-ranks', 'specstride.config/1', 'X', '§X.2',
         {'ranks': as_dicts(find_table(tables, 'X', '§X.2', 'Rank')),
          'trustClasses': as_dicts(find_table(tables, 'X', '§X.2', 'Class'))})
    # layers and extension point map
    data('layers', 'specstride.layers/1', 'A', '§A.1, §A.4',
         {'layers': as_dicts(find_table(tables, 'A', '§A.1', 'Layer')),
          'extensionPoints': as_dicts(find_table(tables, 'A', '§A.4', 'EP'))})
    # hasher and redactor operations
    data('kernel-operations', 'specstride.kernel/1', 'X', '§X.4, §X.5',
         {'redactor': as_dicts(find_table(tables, 'X', '§X.4', 'Operation')),
          'hasher': as_dicts(find_table(tables, 'X', '§X.5', 'Operation'))})
    # host capabilities
    data('host-capabilities', 'specstride.host/1', 'H', '§H.1',
         {'capabilities': as_dicts(find_table(tables, 'H', '§H.1', 'Capability'))})

    # layout: new side, with the physical paths of the plan
    names = as_dicts(find_table(tables, 'B', '§B.5', 'Logical name'))
    phys = json.loads((CONTRACTS / 'sources/physical-paths.json').read_text())
    rows, missing = [], []
    for d in names:
        ln = d['Logical name'].strip('`')
        if ln not in phys['paths']:
            missing.append(ln)
            continue
        rows.append({'logicalName': ln, 'root': d['Root'], 'writer': d['Writer'],
                     'readers': d['Readers'], 'content': d['Schema or content'],
                     'path': phys['paths'][ln]})
    extra = [k for k in phys['paths'] if k not in [d['Logical name'].strip('`') for d in names]]
    if missing or extra:
        sys.exit('physical-paths.json: missing %s; not in annex B: %s' % (missing, extra))
    data('layout', 'specstride.layout/1', 'B', '§B.1, §B.5',
         {'layoutVersion': phys['layoutVersion'], 'roots': phys['roots'],
          'locations': as_dicts(find_table(tables, 'B', '§B.1', 'Location')),
          'logicalNames': rows})

    # layout: old side, one row per `file` item of the behaviour inventory
    old = json.loads((CONTRACTS / 'sources/old-side.json').read_text())
    inv = {}
    with open(REPO / 'docs/ecosystem/research/R18-behaviour-inventory.tsv', newline='') as f:
        for r in csv.DictReader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if r['kind'] == 'file':
                inv[r['b_item']] = r
    disp = {}
    with open(REPO / 'docs/ecosystem/traceability-items.tsv', newline='') as f:
        for r in csv.DictReader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            disp[r['b_id']] = r
    known = set(d['Logical name'].strip('`') for d in names)
    orow, bad = [], []
    for b in sorted(inv):
        if b not in old['items']:
            bad.append('no row for ' + b)
            continue
        m = old['items'][b]
        kept = disp[b]['disposition'].split()[0] in ('ported', 'translated', 'merged-with')
        for ln in m.get('logicalNames', []):
            if ln not in known:
                bad.append('%s: %s is not in annex B' % (b, ln))
        if kept and not m.get('logicalNames') and not m.get('rule'):
            bad.append('%s is kept and has neither a logical name nor a rule' % b)
        orow.append({'item': b, 'system': inv[b]['system'],
                     'disposition': disp[b]['disposition'], 'feature': disp[b]['feature'],
                     'asIsPaths': [p for p in ticks(inv[b]['item']) if re.search(r'[/<.]', p) and ' ' not in p.strip()],
                     'logicalNames': m.get('logicalNames', []), 'rule': m.get('rule'),
                     'what': m.get('what', 'location')})
    for b in old['items']:
        if b not in inv:
            bad.append('%s is not a file item of the inventory' % b)
    if bad:
        sys.exit('old-side.json:\n  ' + '\n  '.join(bad))
    data('layout-old-side', 'specstride.oracle-normalization/1', 'X', '§X.8',
         {'count': len(orow), 'placeholders': old['placeholders'], 'items': orow,
          'comparedRows': as_dicts(find_table(tables, 'X', '§X.8', 'As-is path'))})
    # normalization
    data('normalization', 'specstride.oracle-normalization/1', 'X', '§X.8',
         {'rules': as_dicts(find_table(tables, 'X', '§X.8', 'Id')),
          'environmentAliases': as_dicts(find_table(tables, 'X', '§X.8', 'As-is variable')),
          'componentNames': as_dicts(find_table(tables, 'X', '§X.8', 'As-is implementation file')),
          'modeMap': {'generate': 'dry-run', 'run': 'run', 'auto': 'run'},
          'resumeExitCodeMap': [{'asIs': 1, 'cause': 'lock held', 'new': 5},
                                {'asIs': 1, 'cause': 'nothing to resume', 'new': 3}],
          'launchContractKeyMap': {'configuration.auto': 'configuration.relaunch', 'schema_version': 'schema'},
          'layoutOldSide': 'data/layout-old-side.json', 'layoutNewSide': 'data/layout.json'})
    # package graph
    graph = json.loads((CONTRACTS / 'sources/package-graph.json').read_text())
    data('package-graph', 'specstride.package-graph/1', 'A', '§A.1, §A.2, §A.3', graph)

    return {k: dump(v) for k, v in out.items()}


def main():
    files = build()
    gen_dirs = ['annex-tables', 'schemas', 'extension-points', 'data']
    if '--check' in sys.argv:
        bad = 0
        for rel, text in sorted(files.items()):
            p = CONTRACTS / rel
            if not p.exists() or p.read_text() != text:
                print('differs from the annexes:', rel)
                bad += 1
        for d in gen_dirs:
            for p in sorted((CONTRACTS / d).glob('*.json')):
                rel = str(p.relative_to(CONTRACTS))
                if rel not in files and rel != 'requirements.json':
                    print('not generated:', rel)
                    bad += 1
        print('checked %d files, %d differ' % (len(files), bad))
        sys.exit(1 if bad else 0)
    for rel, text in files.items():
        p = CONTRACTS / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text)
    print('wrote %d files' % len(files))


if __name__ == '__main__':
    main()
