# R18 — Behaviour inventory and parity oracle

Feeds `traceability.md` (one row per behaviour item), `architecture.md` (parity oracle design),
`consolidation.md` (divergence register) and feature 100's oracle normalization rules.

Companion files, written next to this report because the inventory has 2 783 rows:

| File | Content |
|---|---|
| `docs/ecosystem/research/R18-behaviour-inventory.tsv` | The full numbered inventory, one row per B-item. Columns: `b_item`, `system`, `kind`, `item`, `evidence` (`file:line` at the baseline commit), `as_is_coverage`, `area`, `same_evidence_as`. This is the machine-readable source for `traceability.md`. |
| `docs/ecosystem/research/R18-behaviour-inventory.md` | The same rows as a Markdown table. |

Appendix A of this report holds the summary tables per area and per cluster. Appendix B holds the raw
per-process exit codes. Appendix C holds the union of stop reasons.

## Prior art consulted

| File | Use |
|---|---|
| `old/028-as-is-specstride/spec.md`, `data-model.md`, `contracts/{cli,config-env,events,files-on-disk,telemetry-http}.md` | **Reused** as the coverage reference for every Specstride B-item. **Contradicted** in several places, listed in F-03 to F-12. |
| `old/011-as-is-mixture-of-loops/spec.md`, `data-model.md`, `contracts/{cli,environment,files-on-disk,output-lines}.md` | **Reused** as the coverage reference for every mixture-of-loops B-item. The contracts are much closer to the code than 028's. **Extended** with the items in F-13 to F-16. |
| `prompts/analysis/A2-consolidation-analysis.md` | **Reused**: the statement that FR coverage is necessary but not sufficient for parity (A2 line 103), the need for B-items (A2 lines 291-293) and for a normalization catalogue in feature 100 (A2 line 321). **Extended**: A2 names four missing behaviours; this report numbers 2 783. |
| `prompts/analysis/A8-micro-loops-and-parity.md` | **Reused**: option (d), the layered strategy with an inertness suite (A8 §2.5). **Extended**: the suite is given a comparator, an allowlist format and a counter assertion (O-10). |
| `docs/ecosystem/research/R14-quotas-cost-observability.md` | **Reused**: the table-driven legacy projection written to `events.legacy.jsonl` (R14 "Compatibility projection"). R14 line 494 says its event appendix is a grep and must be reconciled with this report; the event rows here are that reconciliation input. |
| `docs/ecosystem/research/R19-consolidation-map.md` | **Reused**: conflict rulings C-03, C-06, C-14, C-15, C-16, C-17 and register rows DR-02, DR-08, DR-09, DR-10. This report supplies the raw facts and does not rule. |
| `docs/ecosystem/research/R23-inner-checks-gate-integrity.md` | **Reused**: the named layer surfaces of F-18 (`loop_strategy_selected`, `micro_inert`, the `[LOOP]` line, `loop.strategy`, `loop.level`, `loop.manifest_hash`). They are the allowlist of the second suite. |
| `/root/mixture-of-loops` `tests/e2e/exec-stub-bin/specstride`, `tests/e2e/stub-bin/specstride`, `tests/fixtures/` at `9c88f86` | **Reused** as the model for the engine stub and for two fixtures (`greeting-ready`, `greeting-blocked`). |
| `/root/specstride` `lib/fixtures/stream-golden/`, `lib/fixtures/fake_prime.py` at `9cab15d` | **Reused** as stream inputs for the stub proposer. |

## Questions answered

**Q1. What is the observable surface of the two systems at the baseline commits?**
2 783 behaviour items, numbered `B-0001` to `B-2783`: 2 466 for Specstride and 317 for
mixture-of-loops. The numbering uses four digits because three are not enough. Counts per area and
kind are in Appendix A. 52 rows share their evidence line with an earlier row (the extraction
areas overlap at their seams, and one line can carry two items); the `same_evidence_as` column
names the earlier row, so a traceability row can merge them where they are the same item.

**Q2. Which as-is FR covers each item?**
236 of the 2 466 Specstride items and 145 of the 317 mixture-of-loops items are stated by an FR.
2 230 and 172 have no covering FR (2 402 in total). Of those, 283 and 79 are mentioned in a
contract or data-model file only, and the rest appear nowhere in the as-is specifications.

**Q3. What fixtures, stub agents and normalization rules does the oracle need?**
See O-3 (stubs), O-4 (37 fixture families), O-6 (28 normalization rules). A probe on this machine
showed that the design works: the baseline Specstride ran three phases with one rejection against a
stub `claude` executable and a stub HTTP critic, ended with exit 0, and wrote the same file tree
twice (F-17).

**Q4. What differs per operating system?**
The Specstride reference needs bash 4 or later, `flock`, `setsid`, `sha256sum`, GNU `stat` and GNU
`date`, none of which macOS ships. The reference is therefore authoritative on Linux only, and the
port on macOS is compared with the Linux capture plus a short list of per-OS expectations (O-9).
The mixture-of-loops reference runs on both.

**Q5. How does a parity test cite what it proves?**
With a `proves:` header listing full IDs (`028 FR-005`, `B-0858`), checked by a coverage script, and
backed by an exercise map that records which reference source lines each fixture executed (O-8).

**Q6. How are the Python reference trees obtained without touching the source repositories?**
With `git archive <full sha> | tar -x` into a scratch directory, checked against a pinned tree
hash, made read-only, and run with `PYTHONDONTWRITEBYTECODE=1` (O-1).

**Q7. How does the second suite (layer on, never-completing stub) work?**
It re-runs every fixture on the port with the layer on and compares the capture with the port's own
layer-off capture. The comparator removes only the surfaces named in the register and fails on any
other difference (O-10).

**Q8. How are decisions 18, 22 and 23 handled under the oracle?**
Decisions 22 and 23 are switched off through product configuration. Decision 18 is mapped, with one
waived case (O-11).

## Findings

### Inventory

**F-01** `verified-local`. The inventory has 2 783 items from these sources at the baseline commits:
Specstride `orchestrator.sh`, `proposer.sh`, `specstride`, `specstride-lib.sh`,
`specstride-digest.sh`, `wiggum`, 27 product modules under `lib/`, `.env.example`, `telemetry/`;
mixture-of-loops `scripts/*.py`, `bin/onboard-skill`, `SKILL.md`, the schema. Evidence: every row
has a `file:line` and a literal substring of that line, and `check_rows.py` confirmed all of them
(`/tmp/specstride-research/R18/check_rows.py`, 0 failures on 9 files). A random sample of 14 rows was
read against the source by hand; all 14 were accurate.

**F-02** `verified-local`. FR coverage: Specstride 236 of 2 466, mixture-of-loops 145 of 317. The least
covered area is stream and telemetry: 2 of 404 rows cite an FR (Appendix A).

**F-03** `verified-local`. The engine writes 14 distinct `run_stop` reason literals. 028 names one
(`critic_unavailable`, 028 FR-010). Thirteen are written by `orchestrator.sh`; the fourteenth,
`proposer_yield_timeout`, is written only by `proposer.sh` (B-0610 (`proposer.sh:2155`)), and the
orchestrator then records `proposer_yield_budget` for the same stop (B-0148 (`orchestrator.sh:1940`)).
Appendix C lists every literal with its B-items. Proposer exit 4 at the iteration limit emits no
`run_stop` of its own (B-0597 (`proposer.sh:2365`)).

**F-04** `verified-local`. mixture-of-loops matches two of those reasons by string:
`RETRYABLE_STOP_REASONS = ("wall_budget", "proposer_consecutive_errors")`
(B-2496 (`skills/mixture-of-loops/scripts/contract_lib.py:81`)). Renaming either in the new schema breaks
relaunch classification unless the projection keeps the old string.

**F-05** `verified-local`. At least 62 distinct event names are emitted or rendered; 028
`contracts/events.md` lists 8 and says the list is incomplete. The presenter alone renders about
25 (B-1350 (`lib/present.py:394`)). Learning events go to `<feature-dir>/events.jsonl`, not to the run's
stream, and carry `ts` without `time`.

**F-06** `verified-local`. `required` verification mode changes the flow, which no FR states. A
fixed-argv gate runs before the critic on every attempt (B-0319 (`orchestrator.sh:1979`)). When it fails
the critic is not called, the attempt counts as a rejection with synthetic status 10, and the
orchestrator writes the feedback file itself (B-0320 (`orchestrator.sh:1991`)). Release verification
failure exits 2 with `reason=release_verification` (B-0140 (`orchestrator.sh:982`)). `--generate-tests`
upgrades `off` to `plan`.

**F-07** `verified-local`. The critic's grounding snapshot at `9cab15d` **does expand globs**. A
citation containing `*`, `?` or `[` that does not resolve literally is tried with `glob.glob`
relative to the workdir, and matches render one presence line
`present: wildcard matches <n> file(s) on disk: …` with at most 20 names
(B-0954 (`lib/critic.py:1390`), B-0955 (`lib/critic.py:1400`)). The fix is commit `d6dab74`, an ancestor of the
baseline (`git -C /root/specstride merge-base --is-ancestor d6dab74 9cab15d` succeeds). Two limits
remain: globs are not expanded at extraction time, and a wildcard match contributes no file
content to the snapshot, only the presence line. The prompt's "known tensions" list treats the
missing expansion as an open defect; at the baseline it is not. See Open questions 1.

**F-08** `verified-local`. Proposer exit 8 (no progress) can only occur on the legacy path. For
prime structured and registry-routed backends the iteration ends before the check
(B-0595 (`proposer.sh:2350`); the extraction note cites `proposer.sh:2270`). Progress is any file newer
than the pass start outside `.git`, the state directory, `node_modules` and `.venv`. 028 FR-018
names the code and nothing else.

**F-09** `verified-local`. Counters reset on resume: the attempt counter and the MALFORMED streak
are local variables that start at 1 and 0 in every process (B-0306 (`orchestrator.sh:1742`)). The last
rejected attempt is not archived on a `MAX_REJECTS` halt; the next run archives it under
`resume-<run-id>`. This is the behaviour decision 23 changes.

**F-10** `verified-local`. The proposer-to-orchestrator exit mapping applies only when the
evidence file is absent. With evidence present every proposer status except 6 is ignored
(B-0134 (`orchestrator.sh:1970`), B-0128 (`orchestrator.sh:1884`)).

**F-11** `verified-local`. The stream seam: route resolution runs once per run from the registry
entry's `stream` field (B-0675 (`proposer.sh:332`)), with three literal fallback reasons
(B-0598 (`proposer.sh:337`), B-0599 (`proposer.sh:339`), B-0600 (`proposer.sh:341`)). The tap exits 0 on any exception
(B-2093 (`lib/agent_stream.py:568`)). Pass-through mode strips whitespace and drops blank lines, so it is
not byte-identical to the backend's output.

**F-12** `verified-local`. Places where 028 and the code disagree:

| Subject | 028 says | Code does | Evidence |
|---|---|---|---|
| Critic usage error | exit 3 (module docstring) | argparse exits 2 | B-0860 (`lib/critic.py:22`) |
| Resume replay | "timeouts" are replayed (028 FR-016) | critic timeout, MALFORMED limit, wall budget and start phase are not saved | `ss-frontdoor` rows on `specstride:595` |
| OTLP delivery status | not stated | the shipper labels `sink=otlp`, status surfaces query `otel`, so OTLP never shows as delivered | `lib/ralph_otel_ship.py:328` |
| Bundled Loki port | default `3100` (028 FR-022) | the bundled stack listens on host port 3110 | `telemetry/docker-compose.yml:29` rows |
| `specstride phases` | read-only (028 FR-023) | writes the fixed file `/tmp/specstride-spec-err` | `specstride:534` rows |

**F-13** `verified-local`. mixture-of-loops: the supervisor never branches on the mode value.
`run` and `auto` differ only in the `mode` field of `harness-run.json` and of `[MOL-LAUNCH]`
(B-2765 (`skills/mixture-of-loops/scripts/supervisor_lib.py:614`)). What `auto` does beyond `run`
(generate first) is done by the host model following `SKILL.md`, not by code.

**F-14** `verified-local`. `supervise.py gate` exits 4 for the decision `attach` as well as for
`refuse` (B-2672 (`skills/mixture-of-loops/scripts/supervise.py:90`)). 011 FR-019 describes `attach` and
does not give its exit code.

**F-15** `verified-local`. The failure digest prints the Python literal `None`:
`child-exit=None` when a stage failed before its action ran
(B-2611 (`skills/mixture-of-loops/scripts/runtime.py:675`)). The supervisor's parser accepts it
(B-2750 (`skills/mixture-of-loops/scripts/supervisor_lib.py:97`)). `[MOL-RELAUNCH]` prints `stop-reason`
as a Python `repr`. Both are language artefacts that the port must reproduce for byte parity or
that need a register row.

**F-16** `verified-local`. `validate_contract.py --promote` rewrites the contract without sorting
keys, while the bootstrap writes sorted keys
(B-2637 (`skills/mixture-of-loops/scripts/validate_contract.py:33`)). The promotion digest is computed
over canonical bytes, so key order does not affect it.

### Probe results that shape the oracle

**F-17** `verified-local`. Feasibility probe. Command: the scratch copy of `specstride run -w
<work> --proposer claude --critic claude --verification off --no-live` under `env -i`, with a stub
`claude` first on `PATH` and a stub HTTP server named by `SPECSTRIDE_CLAUDE_CRITIC_BASE_URL`,
scenario "reject, approve, approve". Result: exit 0, three `GATE<N>-APPROVED` markers, phase 1
archived as `attempt1`, 41 events. A second run gave the same file tree after replacing the run ID.
No model was called. Probe files: `/tmp/specstride-research/R18/probe/`, `probe2/`.

**F-18** `verified-local`. The probe took 67 s with defaults and 10 s with
`SPECSTRIDE_WATCHDOG_TICK=1` (B-0521 (`proposer.sh:1003`), default 15 s). The port must honour the same
variable, or a mapped setting, for the oracle to run in reasonable time.

**F-19** `verified-local`. The `claude` and `codex` critics are HTTP POSTs, not CLI calls
(`lib/critic.py:1875-1912`); `dsh` and `prime` critics are CLI calls. The stub critic therefore
needs both transports.

**F-20** `verified-local`. Events written by the bash emitter can contain duplicate JSON keys.
`run_start` has `feature` twice (B-0086 (`orchestrator.sh:963`)); `proposer_start` has `backend` twice
with different values (B-0095 (`orchestrator.sh:1810`)). Bash writes every value as a string, Python
writes typed values: in the probe `phase`, `attempt` and `iter` appeared both as strings and as
integers.

**F-21** `verified-local`. The reference writes into its own install tree: the first probe left
`lib/__pycache__` in the scratch copy. With `PYTHONDONTWRITEBYTECODE=1` it did not.

**F-22** `verified-local`. Line-level tracing of the bash reference works with `SHELLOPTS=xtrace`
and `BASH_XTRACEFD`, and needs `BASH_ENV` to set `PS4`, because bash did not take `PS4` from the
environment when run as root. Test: `probe2/t.sh` printed `+probe2/t.sh:2: echo hi`.

**F-23** `verified-local` for the constructs, `inferred` for their absence on macOS. The Specstride
reference uses `declare -A` and `mapfile` (`orchestrator.sh:278`, `orchestrator.sh:811`), `flock`
(`orchestrator.sh:507`), `setsid` (`specstride-lib.sh:471`), `sha256sum` (`orchestrator.sh:1068`),
`stat -c` (`orchestrator.sh:1719`), `date +%s.%N` (`specstride-lib.sh:105`), `ps -o cputimes=` and
`ps -o sid=` (`proposer.sh:787`, `proposer.sh:1464`) and `/proc/<pid>/stat`
(`lib/backend_overlay.py:297`). Its README makes no macOS claim. That a stock macOS lacks them is
general platform knowledge and was not tested here.

**F-24** `verified-local`. mixture-of-loops uses `fcntl.flock`, `pty`, `/proc/<pid>/cmdline` with
a fallback (`skills/mixture-of-loops/scripts/supervisor_lib.py:744`) and `readlink -f`
(`bin/onboard-skill:254`). Its README lists "Linux or macOS local execution" (`README.md:204`).

**F-25** `verified-local`. Machine-specific content in the baseline: `specstride-digest.sh` is
hard-wired to one workdir and one feature (`specstride-digest.sh:12`). It is inventoried with the
names masked and should be `dropped` or replaced; R19 rules.

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Specstride reference | commit `9cab15d2d08f6c54644985f7251700bbdbcab282`, tree `d58ea3b50f67a6cdfb387b1d86e5d145ac923880` | 2026-09-29, `git rev-parse` |
| mixture-of-loops reference | commit `9c88f86e1771efeabcfe3b4b1cb24384fff284e8`, tree `a7473137805cded899ee0077b7879c70a05f4451` | 2026-09-29, `git rev-parse` |
| Glob fix | commit `d6dab74`, ancestor of `9cab15d` | 2026-09-29 |
| Probe host | Linux 7.0.14 x86_64, Python 3.13.5, GNU bash 5.2.37, `flock`, `setsid`, `timeout` present | 2026-09-29 |
| mixture-of-loops supported Python | 3.10 to 3.13 (011 SC-001) | from the as-is spec |

## Options compared

### Where the reference output comes from

| Criterion | A. Live differential on every run | B. Committed golden captures only | C. Hybrid (recommended) |
|---|---|---|---|
| Matches decision 4 ("run on the same fixtures") | yes | no, the reference never runs | yes, at the release gate |
| Pull-request run time | slow: both implementations, about 10 s per three-phase fixture with tick 1 (F-18) | fast | fast |
| Needs Python, bash 4, GNU tools in CI | always | never | only in the capture job |
| macOS | the Specstride reference cannot run (F-23) | works | works |
| Detects a stub or fixture change that invalidates a golden | yes | no | yes, the capture job fails when a golden differs from a fresh capture |
| Risk | CI fragility | goldens drift unnoticed | two jobs to maintain |

### What the comparator compares

| Criterion | A. Raw bytes after text substitution | B. Logical model (recommended) |
|---|---|---|
| Handles the new state layout (decision 3) | no | yes, both sides map to logical names |
| Handles the new event schema | only through the projection | through the projection, then logical |
| Reviewability of normalization | one regex list | rule table with an owner and a register row per rule |
| Risk of hiding a regression | high, broad regexes | lower, each rule names the field it touches |

### Defect handling under the oracle

| Criterion | A. Port the defect | B. Fix, waive in the oracle (recommended where the owner rules "fix") | C. Fix, keep a bug-compatible switch |
|---|---|---|---|
| Product carries defect code | yes | no | yes, behind a switch |
| Oracle stays green | yes | yes, through a named waiver | yes |
| Proof of the fixed behaviour | none | characterization test | characterization test |

## Recommendation

Adopt the oracle design O-1 to O-12 below, with the hybrid reference (option C), the logical-model
comparator (option B) and waivers instead of bug-compatible switches. Treat the inventory TSV as the
source of the B-rows in `traceability.md`, and assign dispositions per cluster first (255
clusters, Appendix A) and per item only where a cluster is split.

**Confidence: high** for the inventory (every citation machine-checked) and for stub feasibility on
Linux (probed). **Medium** for the macOS expectations (not testable here) and for run time of the
full suite (one fixture measured).

### O-1 Reference trees

1. `oracle/reference/pins.json` holds, per system, the full commit SHA and the tree hash from
   "Version/date pins".
2. A fetch script produces `<scratch>/ref/specstride` and `<scratch>/ref/mixture-of-loops` with
   `git archive <sha> | tar -x -C <scratch>` from a local clone, or from a release tarball whose
   SHA-256 is pinned. It never runs a git command that writes to the source repository.
3. It verifies the tree: `git rev-parse <sha>^{tree}` equals the pinned tree hash.
4. It makes the tree read-only (`chmod -R a-w`) and every run sets `PYTHONDONTWRITEBYTECODE=1`
   (F-21). The capture job fails if the tree changed after a run.
5. The archive contains no `.env`, so the install-root `.env` layer is empty by construction. A
   fixture that tests that layer copies the reference tree and adds its own `.env`.

### O-2 Hermetic environment

Every run, reference and port, starts from `env -i` with this allowlist:

| Variable | Value | Reason |
|---|---|---|
| `PATH` | `<fixture>/stub-bin:<system dirs>` | stubs win over installed harnesses |
| `HOME`, `TMPDIR`, `XDG_*` | fresh directories per run | no user config, no login state |
| `TZ`, `LANG` | `UTC`, `C.UTF-8` | stable `time` fields and sorting |
| `NO_COLOR` | `1` | no escape sequences |
| `PYTHONDONTWRITEBYTECODE` | `1` | F-21 |
| `SPECSTRIDE_WATCHDOG_TICK`, `SPECSTRIDE_YIELD_POLL` | `1` | F-18 |
| `SPECSTRIDE_OTEL_STATE_DIR` | under the run's temp directory | the trace state default is in the user cache |
| `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`, `GIT_AUTHOR_*`, `GIT_COMMITTER_*` | `/dev/null` and fixed identity and dates | stable commits in fixtures that use git |
| Critic endpoint variables | the stub server's address and a dummy key | F-19 |
| Fixture-declared variables | from `fixture.json` | the behaviour under test |

The port reads the same variables or a documented mapping of them; the mapping is part of feature
100's normalization contract.

### O-3 Scripted stub agents

| Stub | Form | Script vocabulary |
|---|---|---|
| Proposer | Executables in `stub-bin` named after the backend command (`claude`, `codex`, `dsh`, `prime-agent`, and a generic name for descriptor-driven harnesses) | Per invocation index: `write` files, `evidence` (tmp then rename), `stream` (replay a recorded stream file), `sleep` in ticks, `exit` code, `yield` artifact, `silent` (no output, for the idle watchdog), `repeat` (same output, for the repetition watchdog), `nothing` (no file change, for no-progress), `plugin-request` |
| Critic, HTTP | One local server speaking the Anthropic messages and the OpenAI chat-completions shapes | Per call index: `approve`, `reject` with text naming task IDs, `malformed-none`, `malformed-wrong-nonce`, `malformed-duplicate`, `empty`, `http-error`, `hang` |
| Critic, CLI | Executables for backends whose critic is a CLI | the same vocabulary |
| Diagnostician | the critic stubs, recognised by the absence of a nonce in the prompt | `hint` text or `fail` |
| Engine (`specstride`) | the existing execution stub, generalised | `succeed`, `transient`, `fail`, `stop`, `sleep`, with the recorded `run_stop.reason` |
| Verification commands | small scripts in the fixture | `pass`, `fail` at step n, `slow` |

Rules:

1. A stub has no clock and no randomness. Its only state is an invocation counter kept outside the
   workdir, so it never counts as proposer progress and never trips the reverse guard.
2. The critic stub takes the nonce from the prompt it receives. A scenario never contains a nonce.
3. Every stub appends a transcript record outside the workdir: role, call index, argv, the names
   of the environment variables it saw (never values), and the prompt. **The transcript is a
   compared surface.** It proves what each agent was asked, which is where the proposer prompt
   contract, the critic prompt, the grounding snapshot and session freshness become observable.
4. The port uses the same stubs unchanged. Where the port reaches the critic over another transport
   (Tier 1 CLI instead of HTTP), the scenario is the same and the transcript is compared in a
   transport-neutral form. The transport itself is a register row (known tension 1).
5. Stubs never call a model and never read credentials.

### O-4 Fixture families

Each fixture is a directory: `fixture.json` (command line, environment, scenario, expected exit
code, `proves` list), a workdir template, stub scenarios. 37 families cover the clusters:

| ID | Family | Exercises |
|---|---|---|
| FX-01 | All phases approved first time | core loop, ticking, `run_end` |
| FX-02 | Reject then approve | archive, feedback, attempt numbering |
| FX-03 | `MAX_REJECTS` reached | exit 2, unarchived last attempt |
| FX-04 | Oscillation | `gate_oscillation`, thresholds |
| FX-05 | MALFORMED variants and limit | verdict grammar, exit 1 |
| FX-06 | Critic transport failure | MALFORMED scoring |
| FX-07 | Critic configuration error | exit 3, `critic_config` |
| FX-08 | Diagnostician and accelerator | signature markers, one pass per signature |
| FX-09 | Spec resolution order and ambiguity | exit 3 listings |
| FX-10 | Three spec formats, invalid spec | grammar, detection |
| FX-11 | Lock held | exit 5; lock directory fallback |
| FX-12 | Stop flag at each check point, `stop --now` | exit 6 |
| FX-13 | Resume and settings replay | counters, replayed keys |
| FX-14 | Verification `off`, `plan`, `required` | gate before critic, synthetic feedback |
| FX-15 | Release verification failure | exit 2 |
| FX-16 | Pre-staged and detached verification commands | reuse rules |
| FX-17 | Iteration limit | proposer 4 to engine 4 |
| FX-18 | Consecutive errors | proposer 7 |
| FX-19 | No progress | proposer 8, both paths of F-08 |
| FX-20 | Hard cap kills | proposer 10, checkpoints |
| FX-21 | Idle, progress and repetition watchdogs | kill classes |
| FX-22 | Yield: each predicate, limit, deadline, refusal | proposer 9 |
| FX-23 | Wall-clock budget | `wall_budget` |
| FX-24 | Short-pass nudge | prompt block, `iter_short_pass` |
| FX-25 | Grounding snapshot: caps, budgets, wildcard, placeholder, missing | critic prompt in the transcript |
| FX-26 | Stream formats through the seam | event vocabulary, fallbacks |
| FX-27 | Git commit after approval | commit message, no push |
| FX-28 | Front-door inspection commands | output lines, exit codes |
| FX-29 | Learning: show, apply, revert, off, evaluate | allowlist, sample floors, quarantine |
| FX-30 | Reverse: plan, lint finding codes, guard | finding codes, exit 3 |
| FX-31 | Telemetry shippers against a local sink | payload shapes |
| FX-32 | Bootstrap: `greeting-ready`, `greeting-blocked`, ambiguity | inventory, draft |
| FX-33 | Validate and promote: each error class, stale, learning binding | exits 20 and 23 |
| FX-34 | Render: stamp, edited launcher, bundle reuse | launcher text |
| FX-35 | Launcher: dry run, preflight, stages, recovery, resume, signals, lock | `[DIGEST]`, exits 20 to 24 and 128+N |
| FX-36 | Supervisor: mode and learning selection, gate, launch, observe, relaunch classifier, stop, retro | `[MOL-*]`, exit map |
| FX-37 | Onboarding | links, exits 2 to 7 |

FX-35 and FX-36 run twice: against the engine stub (isolates the launcher and supervisor) and
against the real engine with agent stubs (full stack).

### O-5 Captured surfaces

Per run: exit code; stdout and stderr as separate byte streams; the file tree after the run (path,
type, mode, link target, content); every events file; stub transcripts; the list of processes the
run left behind; for mixture-of-loops `state.json`, `harness-run.json` and the three logs.

### O-6 Normalization rules

Both captures are converted to a logical model before comparison. Each rule has an ID that a
register row or a test can cite.

| ID | Subject | Rule |
|---|---|---|
| N-01 | Absolute paths | Workdir, fixture root, reference root, port root, `HOME`, `TMPDIR` become `<WORK>`, `<FIXTURE>`, `<IMPL>`, `<HOME>`, `<TMP>`; longest prefix first |
| N-02 | State layout | Both sides map physical paths to logical names through a layout table owned by feature 100, for example `gate:<phase>:approved`, `attempt:<phase>:<n>:evidence`, `run:<id>:events`. The old table is fixed by this inventory's `file` rows; the new table comes from the architecture |
| N-03 | Run ID | `<YYYYmmdd-HHMMSS>-<pid>` (B-0248 (`orchestrator.sh:487`)) becomes `<RUN:k>`, numbered by first appearance |
| N-04 | Timestamps | `ts`, `time`, `updated_at`, `started_at`, `finished_at`, `launched_at`, `generated_at`, log headers, transcript file stamps become `<T>`. Order is kept: the comparator asserts that values are non-decreasing where the reference's are |
| N-05 | Durations | `duration_ms`, `seconds`, `stage-elapsed`, `total-elapsed`, `poll-in` become `<D>` unless the fixture declares the value as the behaviour under test |
| N-06 | Nonce | the 16 hex characters of each critic call become `<NONCE:k>` in transcripts, feedback and verdict files. The comparator first asserts the format and that no two calls share a nonce |
| N-07 | Process IDs | `pid`, `pgid`, lock owner, `kill -TERM -<pgid>` become `<PID:k>` |
| N-08 | Temporary names | `mktemp` suffixes and `.publish-*` names become `<TMPNAME>` |
| N-09 | Hash, class same | Hashes over fixture content must be equal: source `sha256`, `semantic_sha256`, obligation IDs, phase `shape`, unmet-criteria signature, verdict-pin hash, learning prefix hash. Not normalized |
| N-10 | Hash, class path | Hashes whose input contains an absolute path (contract hash, promotion digest, semantic contract digest, bundle directory name): the comparator recomputes each from the side's own input, asserts it is right, replaces it with `<H:path:k>`, and compares the normalized inputs |
| N-11 | Hash, class implementation | Hashes over implementation bytes (launcher `generated-content-sha256`, bundled runtime files): self-consistency is asserted, the value becomes `<H:impl>`, the content is not compared. Register row: known tension 7 |
| N-12 | Event vocabulary | The port's `events.legacy.jsonl` (R14 projection) is compared, not its primary stream |
| N-13 | Event typing and duplicate keys | Lines are parsed into ordered key and value pairs with types kept, so string-versus-integer and duplicate keys (F-20) are compared as they are |
| N-14 | Event order | Order is compared within each writer class (engine lifecycle, stream tap, critic, learning). Interleaving between classes is not compared |
| N-15 | Implementation names in text | `orchestrator.sh:`, `proposer.sh:`, `python3 …/x.py` prefixes in messages map to logical component names through a table; the message after the prefix must be equal |
| N-16 | Generated-by fields | `generated_by.tool`, `promotion.by`, `ORCHESTRATOR=` in `last-run.conf`, `renderer=` compare through the same component table |
| N-17 | Launcher body | Compared as a logical record (marker line present, digest valid, bundle reference resolves, arguments passed through), not as text |
| N-18 | Tracebacks and interpreter messages | argparse usage text and Python exception text compare by exit code and first line class only |
| N-19 | Language literals | `None`, Python `repr` quoting (F-15) and `%g` number formats are compared as written. No rule hides them: the port reproduces them or the register waives them |
| N-20 | Output labels | `[MOL-*]` and `[DIGEST]` lines are compared as written through the projection (R19 C-06) |
| N-21 | ANSI | Captures run with color off; a fixture that tests color compares the escape sequences as written |
| N-22 | Git objects | Commit hashes become `<COMMIT:k>`; message, tree content and the absence of a push are compared |
| N-23 | Counter files and stub transcripts | Stub counter files are excluded from the tree; transcripts are compared after N-01 to N-08 |
| N-24 | Prompt text | Prompts are compared in full after N-01 to N-08. Any difference is a failure or a named register row |
| N-25 | Bytecode and caches | `__pycache__`, `node_modules/.cache` and similar are excluded, and their presence inside the workdir is a failure |
| N-26 | Telemetry payloads | Compared at the stub sink after N-03, N-04, N-07. Metric renames are a register row (R14 waiver) |
| N-27 | Locale-dependent sorting | Both sides run with the same locale; the comparator does not sort for them |
| N-28 | Legacy state and names | `.wiggum`, `WIGGUM_*` and pre-v2 layout behaviour are not compared (decision 3); their B-items are `superseded` |

A normalization rule may only be added with a register row or with a statement that the value is
non-deterministic in the reference itself. The comparator reports how many values each rule
replaced per fixture, and a rule that replaces nothing in any fixture fails the suite.

### O-7 Comparator result

Per fixture and surface: `equal`, `waived (<register row>)` or `different`. Waivers live in one
file keyed by fixture, surface and register row. A waiver that no longer matches a difference fails
the suite, so waivers cannot outlive their reason. A release is blocked on any `different`.

### O-8 Citation and coverage

1. Every parity test carries `proves:` with full IDs, `fixture:`, and `surfaces:`.
2. A coverage script (kept in `docs/ecosystem/`, as the prompt requires for the cross-feature
   review) checks that every row of `traceability.md` with disposition `ported`, `merged-with` or
   `translated` is named by at least one test, and that every ID a test names exists.
3. **Exercise map.** The capture job runs the reference with line tracing (bash: F-22; Python: the
   standard `trace` module) and records which `file:line` each fixture executed. A test may claim
   a B-item only if the fixture executed that item's evidence line. This turns "the fixture covers
   B-0595" from an assertion into a check. `inferred`: the Python half was not run here.
4. B-items that cannot be executed by a fixture (documentation rules in `SKILL.md`, CI
   configuration) are `translated` or `superseded` and cite a characterization test or a register
   row instead.

### O-9 Per-OS expectations

| Subject | Linux | macOS |
|---|---|---|
| Specstride reference | runs live; authoritative | does not run on a stock system (F-23); the port is compared with the Linux capture |
| mixture-of-loops reference | runs live | runs live (F-24) |
| Workdir lock | `flock` on `.specstride/lock` | the reference would take the `lock.d` directory path; the port uses one mechanism on both systems, so the lock's file form is a per-OS register row and the behaviour (exit 5 on a second run) is compared |
| Detached jobs | `setsid` | the port must provide a new session without `setsid(1)`; compared by behaviour: the job survives the pass |
| PID liveness | `/proc/<pid>/cmdline` markers | no `/proc`: a reused PID reads as alive in the reference; the port may do better, register row |
| Event `ts` | nanoseconds | the reference would fall back to whole seconds; normalized by N-04 |
| Temp directory | `/tmp` | `/var/folders/…`, and `/tmp` is a symlink; N-01 resolves real paths first |
| File system | case-sensitive | case-insensitive by default; fixtures avoid names that differ only in case |
| Signals and exit 128+N | compared | compared; numbers for `SIGINT`, `SIGTERM`, `SIGHUP` are the same |
| Keychain, login state | not used by stubs | not used by stubs |

The macOS column is `inferred` throughout; no macOS host was available.

### O-10 Second suite: layer on, never-completing stub

1. Inputs: every fixture of O-4, unchanged. The proposer stub never declares a unit of work
   complete; it behaves exactly as in the first suite.
2. Runs: the port with the micro-loop layer off (capture A, already produced by the first suite)
   and with the layer on (capture B).
3. Comparison: A against B after normalization. The comparator removes only the surfaces in the
   layer allowlist, which is generated from the register rows tagged as layer fields. From R23
   F-18: the event `loop_strategy_selected`, the event `micro_inert`, the run record fields
   `loop.strategy`, `loop.level`, `loop.manifest_hash`, the settings-replay keys of the same
   names, the `[LOOP]` line and the status line.
4. Counter assertion, independent of the diff: iterations used, reject count, MALFORMED streak,
   attempt numbers and yield count are equal in A and B for every phase.
5. Transitivity: A equals the reference (first suite) and B equals A apart from the allowlist, so
   B equals the reference apart from the allowlist.
6. An allowlist entry that matches nothing fails the suite. A difference outside the allowlist
   fails the suite and is reported as a possible breach of gate integrity (R23 IR-28).
7. The proposer prompt is a compared surface (N-24). If the layer adds a protocol block to the
   prompt even when no unit is declared, captures differ. R23 raised this as a pending decision;
   the oracle's default is to treat the block as one more named allowlist entry.

### O-11 Decisions 18, 22, 23 and the known tensions

| Subject | Treatment | How |
|---|---|---|
| Decision 21, micro-loops | switched off | product setting; second suite per O-10 |
| Decision 22, session continuation | switched off | product setting. The comparator also asserts from the stub transcripts that no invocation carried a continuation argument |
| Decision 23, counts survive resume | switched off | the reset flag that decision 23 itself provides is passed in resume fixtures (FX-13). Surviving counts get characterization tests |
| Decision 18, launch by default | mapped, one waiver | The oracle drives commands, not the host skill. `generate` maps to `dry-run`, `run` and `auto` map to `run`. Mode-selection fixtures compare every token, refusal and prose case through that map. The case "no execution phrasing" is waived: reference `generate`, port `run` |
| Tension 1, critic transport | not compared | transcript compared in transport-neutral form (O-3 rule 4) |
| Tension 2, throwaway config home | equal today | no shipped backend declares an overlay (028 SC-007), so stubs run with scope `none` on both sides |
| Tension 4, default proposer and critic | one waiver | every fixture names both roles; one fixture tests the defaults and is waived |
| Tension 5, quota pause | not triggered | stubs emit no quota signal, so consecutive errors take the old path (exit 4). Quota pause gets its own tests |
| Tension 6, layout and event names | mapped | N-02, N-12 |
| Tension 7, bundle hashes | self-consistency | N-11 |
| Tension 10, glob expansion | none needed | the baseline already expands (F-07) |

All switches are ordinary product configuration. The product contains no oracle-only code path
except the legacy projection sink, which R14 also offers to consumers.

### O-12 Order of construction

1. Stubs and FX-01, FX-02, FX-35 (dry run): proves the harness end to end.
2. Normalizer N-01 to N-08 and the layout table.
3. The exercise map, then the remaining fixtures in the order of uncovered clusters.
4. The second suite, once the layer exists.

## Matrix rows

None. This report contributes no harness or host capability row.

## Open questions / risks

1. **DECISIONS-PENDING: glob expansion is already in the baseline.** Evidence: F-07. The prompt
   lists the missing expansion as a defect to fix with a register row. Default: port the baseline
   behaviour, no waiver, one register line recording why (R19 C-17 agrees). If the owner wants
   more than the baseline does (content of matched files in the snapshot), that is a new
   requirement with a characterization test.
2. **DECISIONS-PENDING: language artefacts in output lines.** Evidence: F-15. Default: the port
   reproduces `child-exit=None` and the `repr` form, because the supervisor's parser and any
   consumer script may depend on them. If the owner prefers clean output, two register rows and a
   parser that accepts both.
3. **DECISIONS-PENDING: size of the traceability matrix.** 2 783 B-rows against 110 FRs. Default:
   dispositions per cluster, item rows kept in the TSV and referenced by range. If the owner wants
   one visible row per item, `traceability.md` grows by that many rows.
4. **Risk: static inventory.** Items were read from source, not observed. The exercise map (O-8)
   will show items no fixture can reach; some will turn out to be dead code, as
   `recovery-exhausted` already is (B-2582 (`skills/mixture-of-loops/scripts/runtime.py:481`)).
5. **Risk: inventory granularity is uneven.** Eight extraction passes produced rows of different
   grain; the presenter's colors are itemised as finely as the verdict grammar. Dispositions by
   cluster absorb this.
6. **Risk: the macOS column is inferred.** The first macOS CI run should be treated as a research
   result.
7. **Risk: event order between writers.** N-14 does not compare interleaving. A bug that depends
   on the order of a tap event and an engine event would pass.
8. **Open: machine-specific code in the baseline.** F-25 and the critic's gateway variables are
   inventoried with names masked. R19 should give them `dropped` or `superseded` dispositions.
9. **Open: reference licence in CI.** Vendoring reference tarballs into an MIT repository depends
   on R1's licence statement for the Apache-2.0 baseline.

## Appendix A — Inventory summary

### By area

| Area | B-items | Count | FR-covered | Contract/data-model only | Not mentioned anywhere | cli-command | cli-flag | env | event | exit-code | stop-reason | file | output-line | behaviour |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ss-orchestrator | B-0001…B-0378 | 378 | 70 | 72 | 236 | 3 | 26 | 54 | 27 | 32 | 16 | 35 | 58 | 127 |
| ss-proposer | B-0379…B-0792 | 414 | 56 | 59 | 299 | 11 | 25 | 66 | 21 | 38 | 20 | 30 | 36 | 167 |
| ss-critic | B-0793…B-1150 | 358 | 21 | 30 | 307 | 9 | 24 | 46 | 13 | 15 | 3 | 31 | 29 | 188 |
| ss-frontdoor | B-1151…B-1598 | 448 | 37 | 61 | 350 | 29 | 66 | 22 | 52 | 39 | 17 | 26 | 66 | 131 |
| ss-reverse-spec | B-1599…B-2058 | 460 | 50 | 47 | 363 | 16 | 25 | 9 | 0 | 13 | 80 | 50 | 39 | 228 |
| ss-stream-telemetry | B-2059…B-2462 | 404 | 2 | 13 | 389 | 8 | 38 | 20 | 61 | 8 | 29 | 13 | 28 | 199 |
| ss-zz-extra | B-2463…B-2466 | 4 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 |
| mol-runtime | B-2467…B-2641 | 175 | 80 | 50 | 45 | 3 | 15 | 7 | 0 | 15 | 15 | 7 | 33 | 80 |
| mol-supervisor | B-2642…B-2783 | 142 | 65 | 29 | 48 | 11 | 9 | 2 | 0 | 12 | 36 | 7 | 21 | 44 |

Area names map to sources: `ss-orchestrator` (`orchestrator.sh`, `specstride-lib.sh`,
`specstride-digest.sh`, `wiggum`, `lib/specstride_env.py`); `ss-proposer` (`proposer.sh`,
`lib/error_breaker.py`, `lib/failure_ledger.py`, `lib/backend_overlay.py`, `lib/backends.py`,
`lib/dsh_plugin_requests.py`); `ss-critic` (`lib/critic.py`, `lib/verdict_pins.py`,
`lib/verification_plan.py`, `lib/verification_failure_digest.py`); `ss-frontdoor` (`specstride`,
`lib/present.py`, `lib/banner.py`, `lib/theme.py`, `lib/learn.py`); `ss-reverse-spec`
(`lib/reverse.py`, `lib/reverse_inventory.py`, `lib/specstride_spec.py`); `ss-stream-telemetry`
(the stream, invocation, shipper and policy modules, `telemetry/`); `ss-zz-extra` (four items
observed in the probe); `mol-runtime` (bootstrap, validate, render, runtime, contract library);
`mol-supervisor` (supervisor, onboarding, skill rules).

### By system

| System | B-items | Covered by an FR | No covering FR | of which contract or data-model only | of which mentioned nowhere |
|---|---|---|---|---|---|
| Specstride | 2 466 | 236 | 2 230 | 283 | 1 947 |
| mixture-of-loops | 317 | 145 | 172 | 79 | 93 |
| Total | 2 783 | 381 | 2 402 | 362 | 2 040 |

### By cluster (system, module, kind)

| Cluster | System | Module | Kind | B-items | Count | No covering FR |
|---|---|---|---|---|---|---|
| C-001 | SS | `.env.example` | env | B-0001…B-0385 | 9 | 5 |
| C-002 | SS | `.env.example` | output-line | B-0003 | 1 | 1 |
| C-003 | SS | `specstride_env` | output-line | B-0004 | 1 | 1 |
| C-004 | SS | `specstride_env` | behaviour | B-0005…B-0007 | 3 | 3 |
| C-005 | SS | `orchestrator` | cli-command | B-0008 | 1 | 1 |
| C-006 | SS | `orchestrator` | cli-flag | B-0009…B-0034 | 26 | 15 |
| C-007 | SS | `orchestrator` | env | B-0035…B-0083 | 49 | 36 |
| C-008 | SS | `orchestrator` | event | B-0084…B-1139 | 28 | 28 |
| C-009 | SS | `orchestrator` | exit-code | B-0108…B-0139 | 32 | 16 |
| C-010 | SS | `orchestrator` | stop-reason | B-0140…B-1141 | 18 | 17 |
| C-011 | SS | `orchestrator` | file | B-0156…B-1144 | 34 | 29 |
| C-012 | SS | `orchestrator` | output-line | B-0187…B-1145 | 47 | 45 |
| C-013 | SS | `orchestrator` | behaviour | B-0233…B-2464 | 112 | 90 |
| C-014 | SS | `specstride-digest` | cli-command | B-0338 | 1 | 1 |
| C-015 | SS | `specstride-digest` | file | B-0339…B-0340 | 2 | 2 |
| C-016 | SS | `specstride-digest` | output-line | B-0341…B-0343 | 3 | 3 |
| C-017 | SS | `specstride-digest` | behaviour | B-0344…B-0345 | 2 | 2 |
| C-018 | SS | `specstride-lib` | env | B-0346…B-0348 | 3 | 3 |
| C-019 | SS | `specstride-lib` | event | B-0349…B-0351 | 3 | 3 |
| C-020 | SS | `specstride-lib` | file | B-0352…B-0353 | 2 | 2 |
| C-021 | SS | `specstride-lib` | output-line | B-0354…B-0359 | 6 | 6 |
| C-022 | SS | `specstride-lib` | behaviour | B-0360…B-2466 | 20 | 19 |
| C-023 | SS | `wiggum` | cli-command | B-0376 | 1 | 1 |
| C-024 | SS | `wiggum` | output-line | B-0377 | 1 | 1 |
| C-025 | SS | `wiggum-lib` | behaviour | B-0378 | 1 | 1 |
| C-026 | SS | `backend_overlay` | cli-command | B-0386…B-0391 | 6 | 6 |
| C-027 | SS | `backend_overlay` | env | B-0392 | 1 | 0 |
| C-028 | SS | `backend_overlay` | exit-code | B-0393…B-0394 | 2 | 2 |
| C-029 | SS | `backend_overlay` | file | B-0395…B-0398 | 4 | 4 |
| C-030 | SS | `backend_overlay` | output-line | B-0399…B-0401 | 3 | 2 |
| C-031 | SS | `backend_overlay` | behaviour | B-0402…B-0417 | 16 | 12 |
| C-032 | SS | `backends` | cli-command | B-0418…B-0420 | 3 | 3 |
| C-033 | SS | `backends` | cli-flag | B-0421 | 1 | 1 |
| C-034 | SS | `backends` | output-line | B-0422 | 1 | 1 |
| C-035 | SS | `backends` | behaviour | B-0423…B-0432 | 10 | 2 |
| C-036 | SS | `dsh_plugin_requests` | cli-flag | B-0433 | 1 | 1 |
| C-037 | SS | `dsh_plugin_requests` | exit-code | B-0434 | 1 | 1 |
| C-038 | SS | `dsh_plugin_requests` | file | B-0435…B-0436 | 2 | 2 |
| C-039 | SS | `dsh_plugin_requests` | output-line | B-0437 | 1 | 1 |
| C-040 | SS | `dsh_plugin_requests` | behaviour | B-0438…B-0443 | 6 | 6 |
| C-041 | SS | `error_breaker` | stop-reason | B-0444 | 1 | 1 |
| C-042 | SS | `error_breaker` | file | B-0445 | 1 | 1 |
| C-043 | SS | `error_breaker` | behaviour | B-0446…B-0450 | 5 | 3 |
| C-044 | SS | `failure_ledger` | cli-command | B-0451 | 1 | 1 |
| C-045 | SS | `failure_ledger` | env | B-0452 | 1 | 1 |
| C-046 | SS | `failure_ledger` | exit-code | B-0453 | 1 | 1 |
| C-047 | SS | `failure_ledger` | file | B-0454 | 1 | 1 |
| C-048 | SS | `failure_ledger` | output-line | B-0455…B-0456 | 2 | 2 |
| C-049 | SS | `failure_ledger` | behaviour | B-0457…B-0461 | 5 | 5 |
| C-050 | SS | `proposer` | cli-command | B-0462 | 1 | 1 |
| C-051 | SS | `proposer` | cli-flag | B-0463…B-0485 | 23 | 23 |
| C-052 | SS | `proposer` | env | B-0486…B-0542 | 57 | 47 |
| C-053 | SS | `proposer` | event | B-0543…B-2425 | 22 | 21 |
| C-054 | SS | `proposer` | exit-code | B-0564…B-0597 | 34 | 26 |
| C-055 | SS | `proposer` | stop-reason | B-0598…B-2428 | 22 | 22 |
| C-056 | SS | `proposer` | file | B-0617…B-0638 | 22 | 22 |
| C-057 | SS | `proposer` | output-line | B-0639…B-0667 | 29 | 28 |
| C-058 | SS | `proposer` | behaviour | B-0668…B-2431 | 128 | 112 |
| C-059 | SS | `critic` | cli-command | B-0793 | 1 | 0 |
| C-060 | SS | `critic` | cli-flag | B-0794…B-0806 | 13 | 9 |
| C-061 | SS | `critic` | env | B-0807…B-0850 | 44 | 42 |
| C-062 | SS | `critic` | event | B-0851…B-0859 | 9 | 9 |
| C-063 | SS | `critic` | exit-code | B-0860…B-0868 | 9 | 7 |
| C-064 | SS | `critic` | file | B-0869…B-0882 | 14 | 12 |
| C-065 | SS | `critic` | output-line | B-0883…B-0901 | 19 | 19 |
| C-066 | SS | `critic` | behaviour | B-0902…B-1017 | 116 | 107 |
| C-067 | SS | `verdict_pins` | file | B-1018…B-1019 | 2 | 2 |
| C-068 | SS | `verdict_pins` | behaviour | B-1020…B-1026 | 7 | 7 |
| C-069 | SS | `verification_failure_digest` | cli-command | B-1027 | 1 | 1 |
| C-070 | SS | `verification_failure_digest` | env | B-1028…B-1029 | 2 | 2 |
| C-071 | SS | `verification_failure_digest` | exit-code | B-1030…B-1031 | 2 | 2 |
| C-072 | SS | `verification_failure_digest` | output-line | B-1032…B-1035 | 4 | 4 |
| C-073 | SS | `verification_failure_digest` | behaviour | B-1036 | 1 | 1 |
| C-074 | SS | `verification_plan` | cli-command | B-1037…B-1043 | 7 | 7 |
| C-075 | SS | `verification_plan` | cli-flag | B-1044…B-1054 | 11 | 11 |
| C-076 | SS | `verification_plan` | exit-code | B-1055…B-1058 | 4 | 4 |
| C-077 | SS | `verification_plan` | stop-reason | B-1059 | 1 | 1 |
| C-078 | SS | `verification_plan` | file | B-1060…B-1071 | 12 | 12 |
| C-079 | SS | `verification_plan` | output-line | B-1072…B-1076 | 5 | 5 |
| C-080 | SS | `verification_plan` | behaviour | B-1077…B-1135 | 59 | 59 |
| C-081 | SS | `banner` | cli-command | B-1151 | 1 | 1 |
| C-082 | SS | `banner` | cli-flag | B-1152…B-1160 | 9 | 9 |
| C-083 | SS | `banner` | env | B-1161…B-1164 | 4 | 4 |
| C-084 | SS | `banner` | exit-code | B-1165 | 1 | 1 |
| C-085 | SS | `banner` | output-line | B-1166…B-1167 | 2 | 2 |
| C-086 | SS | `banner` | behaviour | B-1168…B-1173 | 6 | 6 |
| C-087 | SS | `learn` | cli-command | B-1174…B-1182 | 9 | 9 |
| C-088 | SS | `learn` | cli-flag | B-1183…B-1203 | 21 | 20 |
| C-089 | SS | `learn` | env | B-1204…B-1205 | 2 | 2 |
| C-090 | SS | `learn` | event | B-1206…B-1229 | 24 | 24 |
| C-091 | SS | `learn` | exit-code | B-1230…B-1241 | 12 | 12 |
| C-092 | SS | `learn` | stop-reason | B-1242…B-1253 | 12 | 12 |
| C-093 | SS | `learn` | file | B-1254…B-1266 | 13 | 13 |
| C-094 | SS | `learn` | output-line | B-1267…B-1281 | 15 | 15 |
| C-095 | SS | `learn` | behaviour | B-1282…B-1327 | 46 | 42 |
| C-096 | SS | `present` | cli-command | B-1328 | 1 | 1 |
| C-097 | SS | `present` | cli-flag | B-1329…B-1336 | 8 | 8 |
| C-098 | SS | `present` | env | B-1337 | 1 | 1 |
| C-099 | SS | `present` | event | B-1338…B-1365 | 28 | 28 |
| C-100 | SS | `present` | exit-code | B-1366 | 1 | 1 |
| C-101 | SS | `present` | file | B-1367 | 1 | 1 |
| C-102 | SS | `present` | output-line | B-1368…B-1378 | 11 | 11 |
| C-103 | SS | `present` | behaviour | B-1379…B-1407 | 29 | 29 |
| C-104 | SS | `theme` | cli-command | B-1408 | 1 | 1 |
| C-105 | SS | `theme` | env | B-1409…B-1419 | 11 | 11 |
| C-106 | SS | `theme` | exit-code | B-1420 | 1 | 1 |
| C-107 | SS | `theme` | behaviour | B-1421…B-1426 | 6 | 6 |
| C-108 | SS | `specstride` | cli-command | B-1427…B-1443 | 17 | 5 |
| C-109 | SS | `specstride` | cli-flag | B-1444…B-1471 | 28 | 26 |
| C-110 | SS | `specstride` | env | B-1472…B-1475 | 4 | 4 |
| C-111 | SS | `specstride` | exit-code | B-1476…B-1499 | 24 | 23 |
| C-112 | SS | `specstride` | stop-reason | B-1500…B-1504 | 5 | 5 |
| C-113 | SS | `specstride` | file | B-1505…B-1516 | 12 | 9 |
| C-114 | SS | `specstride` | output-line | B-1517…B-1554 | 38 | 38 |
| C-115 | SS | `specstride` | behaviour | B-1555…B-1598 | 44 | 30 |
| C-116 | SS | `reverse` | cli-command | B-1599…B-1602 | 4 | 4 |
| C-117 | SS | `reverse` | cli-flag | B-1603…B-1617 | 15 | 14 |
| C-118 | SS | `reverse` | env | B-1618…B-1620 | 3 | 3 |
| C-119 | SS | `reverse` | exit-code | B-1621…B-1627 | 7 | 7 |
| C-120 | SS | `reverse` | stop-reason | B-1628…B-1697 | 70 | 56 |
| C-121 | SS | `reverse` | file | B-1698…B-1708 | 11 | 10 |
| C-122 | SS | `reverse` | output-line | B-1709…B-1740 | 32 | 27 |
| C-123 | SS | `reverse` | behaviour | B-1741…B-1862 | 122 | 113 |
| C-124 | SS | `reverse_inventory` | cli-command | B-1863 | 1 | 1 |
| C-125 | SS | `reverse_inventory` | cli-flag | B-1864…B-1867 | 4 | 4 |
| C-126 | SS | `reverse_inventory` | env | B-1868…B-1870 | 3 | 3 |
| C-127 | SS | `reverse_inventory` | exit-code | B-1871…B-1872 | 2 | 2 |
| C-128 | SS | `reverse_inventory` | stop-reason | B-1873…B-1874 | 2 | 2 |
| C-129 | SS | `reverse_inventory` | file | B-1875…B-1901 | 27 | 27 |
| C-130 | SS | `reverse_inventory` | output-line | B-1902 | 1 | 1 |
| C-131 | SS | `reverse_inventory` | behaviour | B-1903…B-1966 | 64 | 64 |
| C-132 | SS | `README` | file | B-1967 | 1 | 0 |
| C-133 | SS | `checklist-template` | file | B-1968 | 1 | 1 |
| C-134 | SS | `constitution-template` | file | B-1969…B-1970 | 2 | 2 |
| C-135 | SS | `plan-template` | file | B-1971 | 1 | 1 |
| C-136 | SS | `spec-template` | file | B-1972…B-1975 | 4 | 4 |
| C-137 | SS | `tasks-template` | file | B-1976…B-1977 | 2 | 2 |
| C-138 | SS | `specstride_spec` | cli-command | B-1978…B-1988 | 11 | 3 |
| C-139 | SS | `specstride_spec` | cli-flag | B-1989…B-1994 | 6 | 5 |
| C-140 | SS | `specstride_spec` | env | B-1995…B-1997 | 3 | 2 |
| C-141 | SS | `specstride_spec` | exit-code | B-1998…B-2001 | 4 | 3 |
| C-142 | SS | `specstride_spec` | stop-reason | B-2002…B-2009 | 8 | 8 |
| C-143 | SS | `specstride_spec` | file | B-2010 | 1 | 1 |
| C-144 | SS | `specstride_spec` | output-line | B-2011…B-2016 | 6 | 6 |
| C-145 | SS | `specstride_spec` | behaviour | B-2017…B-2058 | 42 | 34 |
| C-146 | SS | `agent_stream` | cli-command | B-2059 | 1 | 1 |
| C-147 | SS | `agent_stream` | cli-flag | B-2060…B-2076 | 17 | 17 |
| C-148 | SS | `agent_stream` | env | B-2077…B-2081 | 5 | 5 |
| C-149 | SS | `agent_stream` | event | B-2082…B-2091 | 10 | 10 |
| C-150 | SS | `agent_stream` | exit-code | B-2092…B-2093 | 2 | 2 |
| C-151 | SS | `agent_stream` | stop-reason | B-2094…B-2097 | 4 | 4 |
| C-152 | SS | `agent_stream` | file | B-2098…B-2099 | 2 | 2 |
| C-153 | SS | `agent_stream` | output-line | B-2100…B-2109 | 10 | 10 |
| C-154 | SS | `agent_stream` | behaviour | B-2110…B-2144 | 35 | 35 |
| C-155 | SS | `finalize_invocation` | cli-command | B-2145 | 1 | 1 |
| C-156 | SS | `finalize_invocation` | cli-flag | B-2146…B-2148 | 3 | 3 |
| C-157 | SS | `finalize_invocation` | event | B-2149 | 1 | 1 |
| C-158 | SS | `finalize_invocation` | exit-code | B-2150 | 1 | 1 |
| C-159 | SS | `finalize_invocation` | stop-reason | B-2151…B-2153 | 3 | 3 |
| C-160 | SS | `finalize_invocation` | file | B-2154…B-2158 | 5 | 5 |
| C-161 | SS | `finalize_invocation` | output-line | B-2159 | 1 | 1 |
| C-162 | SS | `finalize_invocation` | behaviour | B-2160…B-2164 | 5 | 5 |
| C-163 | SS | `invocation_result` | event | B-2165 | 1 | 1 |
| C-164 | SS | `invocation_result` | stop-reason | B-2166…B-2178 | 13 | 13 |
| C-165 | SS | `invocation_result` | file | B-2179…B-2183 | 5 | 5 |
| C-166 | SS | `invocation_result` | behaviour | B-2184…B-2202 | 19 | 19 |
| C-167 | SS | `observability_policy` | behaviour | B-2203…B-2223 | 21 | 21 |
| C-168 | SS | `prime_stream` | event | B-2224…B-2240 | 17 | 17 |
| C-169 | SS | `prime_stream` | stop-reason | B-2241…B-2243 | 3 | 3 |
| C-170 | SS | `prime_stream` | output-line | B-2244…B-2248 | 5 | 5 |
| C-171 | SS | `prime_stream` | behaviour | B-2249…B-2264 | 16 | 16 |
| C-172 | SS | `ralph_loki_ship` | cli-command | B-2265…B-2266 | 2 | 2 |
| C-173 | SS | `ralph_loki_ship` | cli-flag | B-2267…B-2274 | 8 | 7 |
| C-174 | SS | `ralph_loki_ship` | env | B-2275…B-2277 | 3 | 3 |
| C-175 | SS | `ralph_loki_ship` | event | B-2278…B-2279 | 2 | 2 |
| C-176 | SS | `ralph_loki_ship` | exit-code | B-2280 | 1 | 1 |
| C-177 | SS | `ralph_loki_ship` | stop-reason | B-2281…B-2282 | 2 | 2 |
| C-178 | SS | `ralph_loki_ship` | output-line | B-2283…B-2286 | 4 | 4 |
| C-179 | SS | `ralph_loki_ship` | behaviour | B-2287…B-2299 | 13 | 13 |
| C-180 | SS | `ralph_otel_ship` | cli-command | B-2300…B-2301 | 2 | 2 |
| C-181 | SS | `ralph_otel_ship` | cli-flag | B-2302…B-2309 | 8 | 7 |
| C-182 | SS | `ralph_otel_ship` | env | B-2310…B-2312 | 3 | 3 |
| C-183 | SS | `ralph_otel_ship` | event | B-2313 | 1 | 1 |
| C-184 | SS | `ralph_otel_ship` | exit-code | B-2314 | 1 | 1 |
| C-185 | SS | `ralph_otel_ship` | output-line | B-2315…B-2318 | 4 | 4 |
| C-186 | SS | `ralph_otel_ship` | behaviour | B-2319…B-2335 | 17 | 17 |
| C-187 | SS | `ralph_otel_spans` | env | B-2336…B-2339 | 4 | 4 |
| C-188 | SS | `ralph_otel_spans` | event | B-2340…B-2362 | 23 | 23 |
| C-189 | SS | `ralph_otel_spans` | file | B-2363 | 1 | 1 |
| C-190 | SS | `ralph_otel_spans` | behaviour | B-2364…B-2375 | 12 | 12 |
| C-191 | SS | `stream_seam` | event | B-2376…B-2379 | 4 | 4 |
| C-192 | SS | `stream_seam` | stop-reason | B-2380 | 1 | 1 |
| C-193 | SS | `stream_seam` | output-line | B-2381…B-2382 | 2 | 2 |
| C-194 | SS | `stream_seam` | behaviour | B-2383…B-2404 | 22 | 22 |
| C-195 | SS | `telemetry_delivery` | cli-command | B-2405…B-2406 | 2 | 2 |
| C-196 | SS | `telemetry_delivery` | cli-flag | B-2407…B-2408 | 2 | 2 |
| C-197 | SS | `telemetry_delivery` | event | B-2409 | 1 | 1 |
| C-198 | SS | `telemetry_delivery` | exit-code | B-2410…B-2412 | 3 | 3 |
| C-199 | SS | `telemetry_delivery` | output-line | B-2413…B-2414 | 2 | 2 |
| C-200 | SS | `telemetry_delivery` | behaviour | B-2415…B-2424 | 10 | 10 |
| C-201 | SS | `ralph-loops` | behaviour | B-2434…B-2441 | 8 | 8 |
| C-202 | SS | `docker-compose` | env | B-2442…B-2446 | 5 | 5 |
| C-203 | SS | `docker-compose` | behaviour | B-2447…B-2449 | 3 | 3 |
| C-204 | SS | `loki-config` | behaviour | B-2450 | 1 | 1 |
| C-205 | SS | `collector-config` | behaviour | B-2451…B-2458 | 8 | 8 |
| C-206 | SS | `prometheus` | behaviour | B-2459…B-2462 | 2 | 2 |
| C-207 | SS | `dashboards` | behaviour | B-2460 | 1 | 1 |
| C-208 | SS | `loki` | behaviour | B-2461 | 1 | 1 |
| C-209 | MOL | `bootstrap_contract` | cli-command | B-2467 | 1 | 0 |
| C-210 | MOL | `bootstrap_contract` | cli-flag | B-2468…B-2472 | 5 | 2 |
| C-211 | MOL | `bootstrap_contract` | exit-code | B-2473 | 1 | 1 |
| C-212 | MOL | `bootstrap_contract` | output-line | B-2474 | 1 | 1 |
| C-213 | MOL | `bootstrap_contract` | behaviour | B-2475…B-2491 | 17 | 7 |
| C-214 | MOL | `contract_lib` | env | B-2492…B-2495 | 4 | 2 |
| C-215 | MOL | `contract_lib` | stop-reason | B-2496 | 1 | 1 |
| C-216 | MOL | `contract_lib` | file | B-2497 | 1 | 1 |
| C-217 | MOL | `contract_lib` | output-line | B-2498 | 1 | 0 |
| C-218 | MOL | `contract_lib` | behaviour | B-2499…B-2542 | 44 | 26 |
| C-219 | MOL | `render_launcher` | cli-command | B-2543 | 1 | 0 |
| C-220 | MOL | `render_launcher` | cli-flag | B-2544 | 1 | 0 |
| C-221 | MOL | `render_launcher` | exit-code | B-2545…B-2546 | 2 | 0 |
| C-222 | MOL | `render_launcher` | file | B-2547…B-2548 | 2 | 1 |
| C-223 | MOL | `render_launcher` | output-line | B-2549…B-2551 | 3 | 1 |
| C-224 | MOL | `render_launcher` | behaviour | B-2552…B-2554 | 3 | 1 |
| C-225 | MOL | `runtime` | cli-flag | B-2555…B-2560 | 6 | 4 |
| C-226 | MOL | `runtime` | env | B-2561…B-2563 | 3 | 2 |
| C-227 | MOL | `runtime` | exit-code | B-2564…B-2571 | 8 | 1 |
| C-228 | MOL | `runtime` | stop-reason | B-2572…B-2585 | 14 | 12 |
| C-229 | MOL | `runtime` | file | B-2586…B-2588 | 3 | 1 |
| C-230 | MOL | `runtime` | output-line | B-2589…B-2612 | 24 | 16 |
| C-231 | MOL | `runtime` | behaviour | B-2613…B-2628 | 16 | 9 |
| C-232 | MOL | `validate_contract` | cli-command | B-2629 | 1 | 0 |
| C-233 | MOL | `validate_contract` | cli-flag | B-2630…B-2632 | 3 | 2 |
| C-234 | MOL | `validate_contract` | exit-code | B-2633…B-2636 | 4 | 2 |
| C-235 | MOL | `validate_contract` | file | B-2637 | 1 | 1 |
| C-236 | MOL | `validate_contract` | output-line | B-2638…B-2641 | 4 | 1 |
| C-237 | MOL | `onboard-skill` | cli-command | B-2642 | 1 | 0 |
| C-238 | MOL | `onboard-skill` | cli-flag | B-2643…B-2645 | 3 | 0 |
| C-239 | MOL | `onboard-skill` | env | B-2646 | 1 | 1 |
| C-240 | MOL | `onboard-skill` | exit-code | B-2647…B-2653 | 7 | 1 |
| C-241 | MOL | `onboard-skill` | file | B-2654 | 1 | 1 |
| C-242 | MOL | `onboard-skill` | output-line | B-2655…B-2657 | 3 | 3 |
| C-243 | MOL | `onboard-skill` | behaviour | B-2658…B-2660 | 3 | 3 |
| C-244 | MOL | `SKILL` | file | B-2661…B-2662 | 2 | 2 |
| C-245 | MOL | `SKILL` | behaviour | B-2663…B-2668 | 6 | 5 |
| C-246 | MOL | `supervise` | cli-command | B-2669…B-2678 | 10 | 5 |
| C-247 | MOL | `supervise` | cli-flag | B-2679…B-2684 | 6 | 6 |
| C-248 | MOL | `supervise` | exit-code | B-2685…B-2688 | 4 | 4 |
| C-249 | MOL | `supervise` | output-line | B-2689…B-2693 | 5 | 3 |
| C-250 | MOL | `supervisor_lib` | env | B-2694 | 1 | 1 |
| C-251 | MOL | `supervisor_lib` | exit-code | B-2695 | 1 | 1 |
| C-252 | MOL | `supervisor_lib` | stop-reason | B-2696…B-2731 | 36 | 12 |
| C-253 | MOL | `supervisor_lib` | file | B-2732…B-2735 | 4 | 1 |
| C-254 | MOL | `supervisor_lib` | output-line | B-2736…B-2748 | 13 | 7 |
| C-255 | MOL | `supervisor_lib` | behaviour | B-2749…B-2783 | 35 | 21 |

## Appendix B — Raw exit codes per process

Raw facts for R19's reconciliation. Codes are per process; the same number means different things
in different processes.

| Process | Codes observed in source |
|---|---|
| `orchestrator.sh` | 0 all approved; 1 internal, cannot enter workdir, `python3` missing, MALFORMED limit, proposer ended without evidence on an unmapped status; 2 rejects exceeded, oscillation, release verification failed; 3 invalid spec, configuration or argument, critic exit 3; 4 wall budget, proposer 4, 7, 8, 9, 10; 5 lock held; 6 stop flag or proposer 6 |
| `proposer.sh` | 0 evidence exists; 1 usage or setup failure; 3 overlay declaration (passed through); 4 iteration limit, or plugin installed on the final pass; 6 stop flag; 7 consecutive errors, or plugin request refused or failed; 8 no progress; 9 yield limit, deadline or wall clock; 10 consecutive hard caps; 130 and 143 on signals with an attempt-scope overlay only. A pass returns 124 on any watchdog kill and 127 when the backend command is missing |
| `lib/critic.py` | 0 approved, and always 0 in `--diagnose` mode; 1 uncaught exception; 2 argparse usage; 3 missing spec, invalid format, phase not found, invalid plan, evidence missing; 10 rejected or MALFORMED |
| `lib/verification_plan.py` | 0; 3 any verification error; 10 gate failed; 11 pre-stage failed |
| `lib/reverse.py`, `lib/reverse_inventory.py` | 0; 2 argparse usage; 3 findings or invalid input |
| `lib/specstride_spec.py` | 0; 2 argparse usage; 3 invalid spec or unknown format |
| `lib/learn.py` | 0; 1 no telemetry (`advise`); 2 usage, allowlist, missing input; 3 refused: no telemetry or below the sample floor; 4 quarantined |
| `specstride` front door | 0; 1 unknown subcommand, missing state, resume refusals, missing files; 2 `reverse` argument errors; 3 `phases` on an invalid spec, `reverse` refused flags or mode; otherwise the code of the process it runs |
| `lib/agent_stream.py`, shippers, `lib/finalize_invocation.py`, `lib/failure_ledger.py`, `lib/banner.py`, `lib/present.py` | 0 on every runtime path; 2 on argparse usage where the module has a parser |
| `lib/backend_overlay.py` | 0; 1 populate failure; 3 invalid declaration or scope |
| `lib/dsh_plugin_requests.py`, `lib/telemetry_delivery.py` | 0; 2 request or usage error |
| `bootstrap_contract.py` | 0; 2 any error (argparse) |
| `validate_contract.py` | 0; 2 usage; 20 invalid; 23 stale or learning decisions changed |
| `render_launcher.py` | 0; 2 usage; 20 cannot render; 23 stale |
| Generated launcher (`runtime.py`) | 0; 2 usage; 20 invalid; 21 preflight; 22 stage failed (also when the child exited 6 and the state is `stopped`); 23 stale; 24 lock; 128+N signal. A stage's child code is 124 on timeout and 127 when the action cannot start |
| `supervise.py` | 0; 1 unmapped status; 2 stopped, and argparse usage; 3 unknown-terminal; 4 refused, including gate decision `attach`; 5 supervision expired; 22 failed; 24 lock conflict; 130 interrupted |
| `bin/onboard-skill` | 0; 2 usage; 3 missing source or repository; 4 path in the way; 5 link missing; 6 collision; 7 untrusted pi project |

`supervise.py` uses 2 both for a stopped run and for a usage error. Under `--harness all`,
`onboard-skill` runs with `set -e`, so a failing first link ends the script with that link's code
(4 or 5) before the remaining harnesses are handled; this is `inferred` from `bin/onboard-skill:2`
and `bin/onboard-skill:297` and was not executed.

## Appendix C — Stop reasons

### Engine `run_stop` reasons

| Reason | Written by | Engine exit | B-items | As-is FR |
|---|---|---|---|---|
| `stop_flag` | engine, proposer (during a yield) | 6 | B-0142 (`orchestrator.sh:1769`), B-0144 (`orchestrator.sh:1882`), B-0608 (`proposer.sh:2147`) | none |
| `wall_budget` | engine | 4 | B-0143 (`orchestrator.sh:1775`) | none |
| `proposer_max_iter` | engine | 4 | B-0145 (`orchestrator.sh:1890`) | none |
| `proposer_no_progress` | engine, proposer | 4 | B-0146 (`orchestrator.sh:1905`), B-0616 (`proposer.sh:2349`) | none |
| `proposer_consecutive_errors` | engine, proposer | 4 | B-0147 (`orchestrator.sh:1920`), B-0615 (`proposer.sh:2333`) | none |
| `proposer_yield_budget` | engine, proposer | 4 | B-0148 (`orchestrator.sh:1940`), B-0607 (`proposer.sh:2109`) | none |
| `proposer_yield_timeout` | proposer only | 4 | B-0610 (`proposer.sh:2155`) | none |
| `proposer_cap_exhausted` | engine, proposer | 4 | B-0149 (`orchestrator.sh:1965`), B-0613 (`proposer.sh:2318`) | none |
| `proposer_no_evidence` | engine | 1 | B-0150 (`orchestrator.sh:1969`) | none |
| `critic_config` | engine | 3 | B-0151 (`orchestrator.sh:2135`) | none |
| `critic_unavailable` | engine | 1 | B-0152 (`orchestrator.sh:2180`) | 028 FR-010 |
| `gate_oscillation` | engine | 2 | B-0153 (`orchestrator.sh:2215`) | none (028 FR-009 states the halt, not the literal) |
| `max_rejects` | engine | 2 | B-0154 (`orchestrator.sh:2252`) | none (028 FR-008 states the halt, not the literal) |
| `release_verification` | engine | 2 | B-0140 (`orchestrator.sh:982`) | none |

`run_end outcome=all_approved` is the only outcome literal (B-0155 (`orchestrator.sh:2275`), 028 SC-001).
Where both processes write a reason for one stop, the events file holds two `run_stop` lines with
different fields.

### Other literal families

| Family | Values | Evidence |
|---|---|---|
| Watchdog kill reason and class | `idle_timeout` (hang), `repeat_stall` and `progress_stall` (futility), `hard_cap` (budget) | B-0601 (`proposer.sh:1054`), B-0602 (`proposer.sh:1081`), B-0603 (`proposer.sh:1104`), B-0604 (`proposer.sh:1111`) |
| Invocation result reason codes | 13 codes from `timeout` to `success`, fallback `missing_terminal` | `lib/invocation_result.py:243-291` rows in `ss-stream-telemetry` |
| Launcher state | `preflight`, `ready`, `running`, `failed`, `stopped`, `completed`, and `dry-run` in the digest only | B-2583 (`skills/mixture-of-loops/scripts/runtime.py:608`) |
| Stage reason | `existing-prerequisite`, `setup-required`, `stage-precondition`, `interrupted`, `completed`, `postcondition`, `exit`, `timeout`, `exec-error:<e>`, `recovery-deadline`, `recovery-exhausted` (unreachable) | `runtime.py:427-481` rows in `mol-runtime` |
| Launcher `exit_reason` | `preflight`, `all-stages-complete`, or the stage reason | B-2584 (`skills/mixture-of-loops/scripts/runtime.py:636`), B-2585 (`skills/mixture-of-loops/scripts/runtime.py:685`) |
| Gate refusal reasons | `launcher-not-found`, `launcher-edited`, `learning-decisions-changed`, `stale-sources`, `open-blocker`, `draft-contract`, `invalid-contract`, `unauthorized-root`, `launcher-syntax-error`, `dry-run-failed`, `already-running` | `supervisor_lib.py:455-549` rows in `mol-supervisor` |
| Relaunch decision reasons | the refusal literals of `classify_relaunch` and `classified-transient` | `supervisor_lib.py:962-1055` rows in `mol-supervisor` |
| Supervision status | `starting`, `running`, `completed`, `failed`, `stopped`, `unknown-terminal`, `lock-conflict`, `supervision-expired`, `refused` | B-2695 (`skills/mixture-of-loops/scripts/supervisor_lib.py:91`) |
| Reverse lint finding codes | the rows of kind `stop-reason` in `ss-reverse-spec` | `lib/reverse.py` |
