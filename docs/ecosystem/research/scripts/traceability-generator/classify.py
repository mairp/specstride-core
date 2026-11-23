"""Classifier: B-item -> (disposition, feature, fx, dv, note)."""
import re
from load import load

def ids(*spec):
    out=set()
    for s in spec:
        if isinstance(s,tuple):
            for i in range(s[0],s[1]+1): out.add('B-%04d'%i)
        else: out.add('B-%04d'%s)
    return out

LOCAL=r'local-backend|LOCAL_BACKEND|locally registered|locally-registered|locally routed|GATEWAY|gateway'
LEGACY=r'WIGGUM|\.wiggum|wiggum|legacy state|legacy-state|legacy-dir|legacy dir|legacy environment|legacy-prefixed|legacy prefix|legacy-to-|legacy-name|legacy variable|legacy spelling|Legacy normalization|Legacy environment|legacy name|legacy directory|pre-v2'

# ---------- feature rules per module: list of (regex, feature) first match wins
R_ORCH=[
 (r'resume phase is derived|first phase lacking|derived resume phase|--start-phase|start phase','101'),
 (r'flock|LOCK_FD|\block\b|lock\.d|lock-dir','122'),
 (r'[Mm]igrat|pre-v2|swept|sweep|stray','100'),
 (r'\.env\b|[Pp]recedence','110'),
 (r'stop\.flag|stop_flag','102'),
 (r'last-run\.conf','102'),
 (r'wall-clock budget|wall_budget|MAX_WALL|RUN_START_EPOCH|whole-run|own wall-clock','127'),
 (r'learn|LEARNING|tamper','106'),
 (r'diagnostician|accelerat|ACCELERAT|DIAGNOS|HINT|signature','101'),
 (r'long.job|LONG_JOB|prestage','118'),
 (r'telemetry|[Ll]oki|otel|OTEL|OTLP|TRACE_ID','128'),
 (r'verification|test-plan|TEST_PLAN|generate-tests|GENERATE_TESTS|release gate|fixed argv|gate evidence|Gate evidence|deterministic gate|phase gate|gate failure|gate-written|digest helper|--required','105'),
 (r'yield|YIELD','118'),
 (r'proposer-timeout|pass ceiling|PROPOSER_TIMEOUT|proposer_cap\b|phaseTimeouts|N=SECONDS|cap_exhausted|Proposer exit 10','118'),
 (r'overlay|OVERLAY|IS_SANDBOX','109'),
 (r'--proposer BACKEND|--critic BACKEND|SPECSTRIDE_PROPOSER sets|SPECSTRIDE_CRITIC sets|BACKENDS@','124'),
 (r'BACKEND_LABEL|SPECSTRIDE_EVENTS|emit_run_stop|de-duplicate|carries `?backend|events\.jsonl. are created','111'),
 (r'[Ss]pec resolution|spec not found|--specs|spec path|spec format|SPEC_FORMAT|--spec-format|feature slug|--feature|SPECSTRIDE_FEATURE|candidates|SPECS\.md|feature\.json|invalid spec|slug|format is auto-detected|feature specs found|no spec resolved','104'),
 (r'prompt|PROMPT_','103'),
 (r'banner|rail|--live|--no-live|LIVE|present\.py|timeline|`log\(\)`|term\(\)|live mode|Start-up record|resume   :|usage text|unknown arg|--help|workdir not found|cannot .?cd|--debug|-w\|--workdir|flag given without a value|\$\{2:\?\}','119'),
 (r'max-iter|MAX_ITER|[Pp]roposer exit|proposer_(max_iter|no_progress|consecutive|no_evidence)|proposer hit max|proposer made no|proposer aborted|proposer exited|proposer\.sh. is invoked|proposer invocation id|proposer_start|----- proposer|With telemetry on the proposer','103'),
 (r'run id|run-id>/. |durable per-feature state|symlink|creates .<feature-dir>|run\.log. and|run_start|EXIT hook|SPECSTRIDE_RUN_ID','100'),
 (r'python3 required','100'),
]
R_PROP=[
 (LOCAL,'109'),
 (r'plugin','130'),
 (r'stop\.flag','102'),
 (r'no.progress|NOPROGRESS|no_progress|wrote nothing|changed nothing|Disk progress ignores|made progress','103'),
 (r'overlay|OVERLAY|IS_SANDBOX|harness binary|TMPDIR','109'),
 (r'yield|YIELD|ledger|LEDGER|\bjob\b','118'),
 (r'watchdog|WATCHDOG|idle|[Rr]epeat|repetition|progress-timeout|progress_stall|PROGRESS_TIMEOUT|PROGRESS_PATHS|progress-path|[Dd]isk-progress|hard.cap|hard_cap|\bkill|checkpoint|pass ceiling|--timeout|PROPOSER_TIMEOUT\b|proposer\.pid|iter_cap|pass_cost_unknown|MAX_CAPS|cap_exhausted|cap_halt|cap counter|[Ss]hort.pass|SHORT_PASS|long-job|budget\|futility','118'),
 (r'wall-clock budget|wall_budget|MAX_WALL|RUN_START_EPOCH','127'),
 (r'--loki-url|--otel-url|LOKI_URL|OTEL_URL|ralph_loki_ship|-j\b|--stream-json','128'),
 (r'[Ss]tream|\btap\b|AGENT_TAP|agent_observability|invocation|producer\.json|metadata\.json|[Ff]inali[sz]er|Producer status|provider-terminal|response\.txt|--debug','126'),
 (r'--backend NAME|SPECSTRIDE_PROPOSER. is the default|unknown backend|Backend dispatch|@PROPOSER_BACKENDS@|--model MODEL','124'),
 (r'\bclaude\b|STDIN_FILE|PROPOSER_SKILLS|shared agent flags|128 KiB','125'),
 (r'prompt','103'),
 (r'SPECSTRIDE_EVENTS|SPECSTRIDE_BACKEND_LABEL|SPECSTRIDE_TASK|SPECSTRIDE_RUN_ID','111'),
]
R_CRIT=[
 (LOCAL,'109'),
 (r'\bpins?\b|pin file|pin block','117'),
 (r'diagnos|HINT|hint|CASE:','101'),
 (r'[Gg]rounding|snapshot|citation|cited|excerpt|[Aa]nchor|probe|gitignore|[Ss]ecret scan|presence|wildcard|[Gg]lob|workspace member|[Bb]uild export|[Pp]riority|candidate|dotfile|locator|ellipsis|Brace|Search directories|pnpm|NEEDS-GROUNDING|MISSING|renders|File dump|binary|head/tail|whole-file|unreadable file|Paths are extracted|Backticked tokens|Trailing|token counts as a path|Extraction stops|Directory expansion|directory is expanded','117'),
 (r'[Ww]indow|CONTEXT_TOKENS|budget|Bytes-per-token|shrunk|shrinking|reply reserve|rejection history|trimmed|[Pp]rompt block order|design-context|inherited-obligations|evidence file is read|obligations are appended|fitted|opens with the role line|prompt rule|prompt tells|--debug|\[debug\]|critic-prompt','117'),
 (r'telemetry|TELEMETRY|[Ll]oki|OTEL|shipping|shipped','128'),
 (r'event record|events file|SPECSTRIDE_EVENTS|Events are appended|SPECSTRIDE_RUN_ID','111'),
 (r'--provider|SPECSTRIDE_CRITIC. \(default|Dispatch is by provider|unknown provider|unknown .SPECSTRIDE_CRITIC','124'),
 (r'\bclaude\b|ANTHROPIC|CLAUDE','125'),
 (r'timeout|transport|backend call|HTTP|timed out|one backend call','109'),
 (r'verification.plan|VERIFICATION_PLAN','105'),
 (r'--format|spec format|SPEC_FORMAT|--specs|specs not found|phase is not found|phase that the spec|spec file is missing|--feature','104'),
]
R_FRONT=[
 (r'reverse','108'),
 (r'learn','106'),
 (r'\.env\b','110'),
 (r'resume|last-run\.conf|RESUME','102'),
 (r'\bstop\b|kill_tree|proposer\.pid|stop\.flag|STOPPED','102'),
 (r'\block\b|lock\.d|lock_held','122'),
 (r'stream_formats|stream formats','126'),
 (r'telemetry|export configured','128'),
]
R_LIB=[
 (LEGACY,'100'),
 (r'STATE_NOTICE','100'),
 (r'long.job|LONG_JOB|job\b','118'),
 (r'prestage','105'),
 (r'TELEMETRY|OTEL|telemetry probe|export configured','128'),
 (r'backends\.py|backend list','109'),
 (r'specstride_spec|spec not found','104'),
 (r'stream_formats','126'),
 (r'\block\b','122'),
]
R_MOL_CONTRACT=[
 (r'[Ll]earning|LEARNING|applied\.json|decisions_through','106'),
 (r'RETRYABLE|[Rr]elaunch|configuration\.auto|Declared stage seconds|supervision','123'),
 (r'MOL_VIA','107'),
 (r'[Ss]tale|semantic hash|SHA-256 changed|Checkbox-insensitive','104'),
 (r'Phase grammar|Task grammar','104'),
]
R_SUP=[
 (r'[Rr]etro|RETRO|suggestion','106'),
 (r'[Ll]earning|LEARNING','106'),
 (r'Detached launch|start_new_session','122'),
 (r'PID liveness|run-directory-free|flock','122'),
]
R_RUNTIME=[
 (r'\block\b|E_LOCK|another launcher owns','122'),
 (r'LEARNING','106'),
]
R_SKILL=[]

MODULE_DEFAULT={
 '.env.example':('110',[]),
 'lib/specstride_env.py':('110',[]),
 'orchestrator.sh':('101',R_ORCH),
 'specstride-digest.sh':('none',[]),
 'specstride-lib.sh':('111',R_LIB),
 'wiggum':('119',[]),'wiggum-lib.sh':('119',[]),
 'lib/backend_overlay.py':('109',[]),
 'lib/backends.py':('109',[]),
 'lib/dsh_plugin_requests.py':('130',[]),
 'lib/error_breaker.py':('103',[]),
 'lib/failure_ledger.py':('118',[]),
 'proposer.sh':('103',R_PROP),
 'lib/critic.py':('101',R_CRIT),
 'lib/verdict_pins.py':('117',[]),
 'lib/verification_failure_digest.py':('105',[]),
 'lib/verification_plan.py':('105',[]),
 'lib/banner.py':('119',[]),'lib/present.py':('119',[]),'lib/theme.py':('119',[]),
 'lib/learn.py':('106',[]),
 'specstride':('119',R_FRONT),
 'lib/reverse.py':('108',[]),'lib/reverse_inventory.py':('108',[]),
 'lib/specstride_spec.py':('104',[]),
 'lib/agent_stream.py':('126',[]),'lib/stream_seam.py':('126',[]),
 'lib/finalize_invocation.py':('126',[]),'lib/invocation_result.py':('126',[]),
 'lib/observability_policy.py':('111',[]),
 'lib/prime_stream.py':('138',[]),
 'lib/ralph_loki_ship.py':('128',[]),'lib/ralph_otel_ship.py':('128',[]),
 'lib/ralph_otel_spans.py':('128',[]),'lib/telemetry_delivery.py':('128',[]),
 'skills/mixture-of-loops/scripts/bootstrap_contract.py':('107',R_MOL_CONTRACT),
 'skills/mixture-of-loops/scripts/contract_lib.py':('107',R_MOL_CONTRACT),
 'skills/mixture-of-loops/scripts/validate_contract.py':('107',R_MOL_CONTRACT),
 'skills/mixture-of-loops/scripts/render_launcher.py':('107',[]),
 'skills/mixture-of-loops/scripts/runtime.py':('123',R_RUNTIME),
 'skills/mixture-of-loops/scripts/supervise.py':('123',R_SUP),
 'skills/mixture-of-loops/scripts/supervisor_lib.py':('123',R_SUP),
 'bin/onboard-skill':('113',[]),
 'skills/mixture-of-loops/SKILL.md':('113',[]),
}
def module_rule(path):
    if path.startswith('telemetry/'): return ('128',[])
    if 'speckit_templates' in path: return ('108',[])
    return MODULE_DEFAULT[path]

# fixture families per feature (default) and keyword refinements
FX_DEFAULT={'100':'FX-01','101':'FX-01, FX-02, FX-03','117':'FX-25','102':'FX-12, FX-13','119':'FX-28',
 '103':'FX-17, FX-18, FX-19, FX-24','118':'FX-20, FX-21, FX-22','104':'FX-09, FX-10','105':'FX-14, FX-15, FX-16',
 '106':'FX-29','107':'FX-32, FX-33, FX-34','123':'FX-35, FX-36','122':'FX-11','108':'FX-30','109':'FX-26',
 '124':'FX-01','125':'FX-01, FX-06','126':'FX-26','110':'FX-13','127':'FX-23','111':'FX-01, FX-26','128':'FX-31',
 '129':'FX-28','113':'FX-36','141':'FX-32'}
FX_KEY=[
 (r'oscillat|OSC_MAX','FX-04'),(r'MALFORMED|malformed','FX-05'),(r'critic_config|config/usage error|Critic exit 3','FX-07'),
 (r'diagnostician|accelerat|DIAGNOS|ACCELERAT|hint|HINT','FX-08'),(r'git checkpoint|git_checkpoint|git add|GIT_COMMITS','FX-27'),
 (r'max.rejects|MAX_REJECTS','FX-03'),(r'release','FX-15'),(r'long.job|LONG_JOB|prestage|pre-staged','FX-16'),
 (r'yield|YIELD','FX-22'),(r'hard.cap|hard_cap|pass ceiling|MAX_CAPS|cap_exhausted','FX-20'),
 (r'idle|repeat|repetition|progress_stall|disk-progress|watchdog','FX-21'),(r'[Ss]hort.pass|SHORT_PASS|nudge','FX-24'),
 (r'no.progress|NOPROGRESS','FX-19'),(r'consecutive.error|MAX_ERRORS|iter_error|error breaker|error counter','FX-18'),
 (r'max-iter|MAX_ITER|max_iter','FX-17'),(r'wall.clock|wall_budget|MAX_WALL','FX-23'),
 (r'stop\.flag|stop_flag|--now','FX-12'),(r'resume|last-run\.conf','FX-13'),(r'\block\b|flock','FX-11'),
 (r'transport|HTTP|backend call|timed out','FX-06'),
]
MOL_FX=[
 (r'bootstrap|[Ii]nventory|draft|semantic-derivation|Shell candidates|Prerequisite candidates|Obligation id|Contract id|coverage entry','FX-32'),
 (r'render|[Ll]auncher text|[Bb]undle|--replace-edited|generated-content','FX-34'),
 (r'validat|promot|Strict|stale|open blocker|Validation','FX-33'),
]
def fx_for(feature,item,path):
    if path.startswith('skills/mixture-of-loops/scripts/') and feature=='107':
        for p,f in MOL_FX:
            if re.search(p,item): return f
        return 'FX-33'
    if feature in ('101','103','118','102','105','122','127','109','125'):
        for p,f in FX_KEY:
            if re.search(p,item): return f
    return FX_DEFAULT.get(feature,'')

# ---------- explicit disposition sets
SUP={}   # bid -> DV row
def sup(dv,*spec):
    for b in ids(*spec): SUP[b]=dv
sup('DV-036',(4,7),234,346,347,354,355,360,(376,378),807,1282,1379,1763,1914,1995,2110)
sup('DV-037',84,193,(252,255),272)
sup('DV-038',2493,2520,2640)
sup('DV-023',(1,3),(379,385),156,233,1505)
sup('DV-056',(2642,2660))
sup('DV-065',118,568,569,599,673,2427)
sup('DV-062',1513)
sup('DV-022',163,164,251)
sup('DV-024',260,1584)
sup('DV-004',13,14,37,38,466,486)
sup('DV-064',425,429)
sup('DV-073',1999)
sup('DV-009',2757,2665)
EXTRA_DEFER={'B-0984':'130'}
SUP_FEAT={'B-0037':'124','B-0038':'124','B-0118':'100','B-0272':'100','B-1505':'110','B-0234':'110'}
DROP={}
for b in ids((338,345),2492,2498,2489): DROP[b]='DV-061'
MERGED={'B-2475':('merged-with 028 FR-029','DV-060'),'B-2476':('merged-with 028 FR-029','DV-060')}
# items ported under the parity profile although a DV row changes the default (oracle handling: off / not observable / none needed)
PORTED_DV={}
def pdv(dv,*spec):
    for b in ids(*spec): PORTED_DV.setdefault(b,[]).append(dv)
pdv('DV-011',306,308,309,292,353); pdv('DV-044',289); pdv('DV-010',761); pdv('DV-030',67,497)
pdv('DV-013',540,541,558,779,780); pdv('DV-014',40,775); pdv('DV-015',491,492,602)
pdv('DV-045',1117); pdv('DV-046',592); pdv('DV-051',590,591); pdv('DV-005',594,131,147,2496)
pdv('DV-025',302,303); pdv('DV-026',2561,2617); pdv('DV-067',784); pdv('DV-070',2611,2746,2750)
pdv('DV-019',954,955); pdv('DV-020',764,76,296); pdv('DV-032',940); pdv('DV-039',1586)
pdv('DV-028',2616,2775); pdv('DV-072',875)
# owner rulings of 2026-09-29
pdv('DV-081',(831,833))                 # Codex critic transport (rulings 57, 57a, D1)
pdv('DV-082',803,864,1114)              # plan staleness at critic start (ruling K3)
pdv('DV-064',(690,696))                 # control flow that tests harness names
pdv('DV-010',693,696,991)               # passes and critic calls without a session
pdv('DV-030',516,688,690,691)           # containment as today under the parity profile
# items translated through a named mapping
TRANS_DV={}
def tdv(dv,*spec):
    for b in ids(*spec): TRANS_DV.setdefault(b,[]).append(dv)
tdv('DV-022',161,162,61,372,1509,1510,2588,2760)
tdv('DV-024',257,258,259,169,170,1581,1583)
tdv('DV-021',(1494,1496))
tdv('DV-029',875,271,323)
tdv('DV-031',689,740,741,742,534)
tdv('DV-001',980,981); tdv('DV-081',981)
tdv('DV-055',2765,2518)
tdv('DV-008',2547,2549,2550,2552); tdv('DV-054',2549,2553)
tdv('DV-009',(2751,2756),2669)
tdv('DV-064',685,993,996,575,431,432,423,424,(418,422))
tdv('DV-066',2488)
tdv('DV-033',2742,2744,2745)
tdv('DV-036',699,870,1506,1619,1631,1910,2519,2614,2782,(2442,2446),2448)
tdv('DV-038',2561)
tdv('DV-059',2521)
FEAT_OVERRIDE={}
def fo(f,*spec):
    for b in ids(*spec): FEAT_OVERRIDE[b]=f
fo('101',86,105,155,125,275,321,328,326,250,307)
fo('102',258); fo('119',266,201,198,200); fo('103',318,218,76,296,297,314,75,178,300,301)
fo('100',165,157,167,168); fo('118',96,302,304); fo('104',240,244,237); fo('109',115); fo('111',64,66)
fo('118',713,715,716,717,722,726,727,728,730,732,736,774,605,700,735)
fo('103',561,614,615,664,789,785,612,639,479,760,778,637,787)
fo('125',689,740,741,742,534,625,745,744,830,911)
fo('126',751,2426,782,783,754); fo('128',753)
fo('117',896,928,929,942); fo('101',855,874,877,794); fo('109',1014)
fo('119',1500,1507,1511,1563,1564,1570,1482,1558,1430,1533,1537,1541,1573)
fo('123',2557,2705,2726,2761,2771,2567,2607); fo('107',2540,2631,2527)
# general exceptions in harness-name matching (items that name a later-wave harness only as an example)
HARNESS_KEEP=ids(432,512,563,764,534,740,741,742,753,992,2107,2118,2137,466,486,685,785,754,786,993,996,799,845,751,752,746,784,2430,627,636,425,405,2429,748,745,744,781,782,783)

INTERNAL_PROC={'lib/dsh_plugin_requests.py','lib/prime_stream.py','proposer.sh','lib/critic.py','lib/verification_plan.py','lib/verification_failure_digest.py','lib/backend_overlay.py',
 'lib/backends.py','lib/failure_ledger.py','lib/error_breaker.py','lib/finalize_invocation.py','lib/agent_stream.py','lib/ralph_loki_ship.py',
 'lib/ralph_otel_ship.py','lib/telemetry_delivery.py','lib/specstride_spec.py','lib/banner.py','lib/theme.py','lib/present.py',
 'lib/reverse_inventory.py','lib/invocation_result.py','lib/stream_seam.py','lib/ralph_otel_spans.py','lib/verdict_pins.py','lib/observability_policy.py'}
RENAMED_CMD=INTERNAL_PROC|{'lib/learn.py','lib/reverse.py','skills/mixture-of-loops/scripts/bootstrap_contract.py',
 'skills/mixture-of-loops/scripts/validate_contract.py','skills/mixture-of-loops/scripts/render_launcher.py',
 'skills/mixture-of-loops/scripts/supervise.py','skills/mixture-of-loops/scripts/supervisor_lib.py'}
def fx_adapter(r):
    """Fixture families for the items of the adapter features 130, 131 and 138 (R18 O-4), by subject."""
    b=r['b_item']; item=r['item']; path=r['path']
    if b=='B-0764': return 'FX-16, FX-20, FX-22, FX-24'      # the prompt blocks it orders
    if b=='B-0563': return 'FX-19, FX-22'
    if b=='B-0587': return 'FX-17'
    if path in ('lib/prime_stream.py','lib/agent_stream.py'): return 'FX-26'
    if path=='lib/backends.py': return 'FX-26'
    if path=='lib/dsh_plugin_requests.py' or re.search(r'[Pp]lugin',item): return 'FX-17, FX-18'
    if re.search(r'agent_observability',item): return 'FX-01, FX-26'
    if path=='lib/critic.py':
        if re.search(r'[Ww]indow',item): return 'FX-25'
        if re.search(r'\braises?\b|is raised|HTTP',item): return 'FX-06, FX-07'
        return 'FX-01, FX-06'
    if re.search(r'returns 127|returns 1\b|fails the pass|is rejected|rejects|refuses',item): return 'FX-18'
    if re.search(r'overlay|DSH_HOME|reasoningEffort',item): return 'FX-26'
    return 'FX-01, FX-26'

WAVE3={'130':'130-adapter-dsh','131':'131-adapter-codex','138':'138-adapter-prime'}

def classify(r):
    b=r['b_item']; item=r['item']; path=r['path']; kind=r['kind']
    feat,rules=module_rule(path)
    for p,f in rules:
        if re.search(p,item): feat=f; break
    feat=FEAT_OVERRIDE.get(b,feat)
    dv=[]; note=''
    # --- dropped
    if b in DROP:
        return dict(d='dropped',f='none',fx='',dv=[DROP[b]],proof='written justification: consolidation.md %s and section 5.3 (D-03, D-12, D-14)'%DROP[b])
    if path=='specstride-digest.sh':
        return dict(d='dropped',f='none',fx='',dv=['DV-061'],proof='written justification: consolidation.md DV-061')
    # --- superseded
    if b in SUP:
        if feat in WAVE3 or feat=='none': feat='109'
        feat=SUP_FEAT.get(b,feat)
        if SUP[b]=='DV-036' and re.search(r'environment|variable|WIGGUM_',item): feat='110'
        return dict(d='superseded-by '+SUP[b],f=feat,fx='',dv=[SUP[b]],proof='register row '+SUP[b])
    if path in ('wiggum','wiggum-lib.sh','lib/specstride_env.py'):
        return dict(d='superseded-by DV-036',f=feat,fx='',dv=['DV-036'],proof='register row DV-036')
    if path=='.env.example':
        return dict(d='superseded-by DV-023',f='110',fx='',dv=['DV-023'],proof='register row DV-023')
    if path=='bin/onboard-skill':
        return dict(d='superseded-by DV-056',f='113',fx='',dv=['DV-056'],proof='register row DV-056')
    if re.search(LOCAL,item) and path in ('proposer.sh','lib/critic.py','lib/backends.py') and b not in HARNESS_KEEP:
        return dict(d='superseded-by DV-064',f='109',fx='',dv=['DV-064'],proof='register row DV-064')
    if b in MERGED:
        d,v=MERGED[b]
        return dict(d=d,f='104',fx='FX-32',dv=[v],proof='FX-32')
    # --- deferred: later-wave harnesses (DP-083)
    w=None
    if path=='lib/dsh_plugin_requests.py' or feat=='130': w='130'
    elif b in EXTRA_DEFER: w=EXTRA_DEFER[b]
    elif path=='lib/prime_stream.py': w='138'
    elif path in ('proposer.sh','lib/critic.py','lib/backends.py','lib/backend_overlay.py','lib/agent_stream.py','orchestrator.sh') and b not in HARNESS_KEEP:
        if re.search(r'\bdsh\b|DSH_|DeepSeek Harness',item) and not re.search(r'\bclaude\b',item): w='130'
        elif re.search(r'\bcodex\b|OPENAI|CODEX',item) and not re.search(r'\bclaude\b.*\bcodex\b.*prime',item): w='131'
        elif re.search(r'\b[Pp]rime\b|PRIME_|prime-v3|prime:',item): w='138'
    adapter=None
    if w:
        # owner ruling 32: every parity test passes before any release, so the behaviour of dsh,
        # Codex and prime is ported or translated in Wave 1, in the adapter feature of its harness
        adapter=feat=w
    # --- non-executable assets
    if path.startswith('telemetry/'):
        return dict(d='translated',f='128',fx='',dv=['DV-058']+TRANS_DV.get(b,[]),proof='CT-128')
    if path=='skills/mixture-of-loops/SKILL.md':
        return dict(d='translated',f='113',fx='',dv=['DV-006'] if kind=='file' else ['DV-009','DV-033'],proof='CT-113')
    # --- translated / ported by kind
    d='ported'
    if b in TRANS_DV: d='translated'; dv+=TRANS_DV[b]
    if kind=='event': d='translated'; dv.append('DV-007')
    elif kind=='file' and 'speckit_templates' not in path: d='translated'; dv.append('DV-006')
    elif kind=='env': d='translated'; dv.append('DV-027')
    elif kind in ('cli-command','cli-flag') and path in RENAMED_CMD: d='translated'; dv.append('DV-066')
    elif kind=='exit-code' and path in INTERNAL_PROC: d='translated'; dv.append('LR-6')
    elif kind=='output-line':
        if re.search(r'\[MOL-|\[DIGEST\]',item): d='translated'; dv+=['DV-007','DV-033']
        elif re.search(r'(orchestrator\.sh|proposer\.sh|critic\.py|python3 [\w/.]+\.py): |prefix .critic\.py',item): d='translated'; dv.append('DV-066')
    if path.startswith('lib/ralph_') or path=='lib/telemetry_delivery.py':
        d='translated'; dv.append('DV-058')
    if path=='skills/mixture-of-loops/scripts/render_launcher.py' and kind in('behaviour','output-line','file') and 'DV-008' not in dv and re.search(r'[Ll]auncher|[Bb]undle',item):
        d='translated'; dv.append('DV-008')
    if b in PORTED_DV:
        dv+=PORTED_DV[b]
    if re.search(r'stop.reason|kill reason|reason=',item) and False: pass
    dv=list(dict.fromkeys(dv))
    fx=fx_adapter(r) if adapter else fx_for(feat,item,path)
    return dict(d=d,f=feat,fx=fx,dv=dv,proof=fx)

if __name__=='__main__':
    import collections,sys
    rows,cl=load()
    c=collections.Counter(); cf=collections.Counter()
    out=[]
    for r in rows:
        k=classify(r); r.update(k); c[k['d'].split()[0]]+=1; cf[k['f']]+=1
    print(c); print(sorted(cf.items(),key=lambda x:-x[1]))
    if len(sys.argv)>1:
        for r in rows:
            if eval(sys.argv[1]): print(r['b_item'][2:],r['module'][:8],r['kind'][:4],r['d'][:14],r['f'][:4],r['item'][:110].replace('`',''))
