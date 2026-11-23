# R19 — Consolidation map

Feeds `consolidation.md`, `traceability.md` and `feature-briefs.md`. Owns the glossary, the conflict
list and the draft dispositions. Defers to R18 (behaviour inventory, B-item numbers, oracle), R1 (Lisa
reuse), R14 (event schema) and R16 (placement of config layers).

Citation style: `028 FR-012` is a requirement in `old/028-as-is-specstride/spec.md`; `028 C:cli` is
`contracts/cli.md`; `028 DM:Run` is an entity in `data-model.md`. Code citations are at the baseline
commits: Specstride `9cab15d` (working tree of `/root/specstride`, which is at that commit),
mixture-of-loops `9c88f86` (read with `git show`), Lisa `76adfdc` (read with `git show`).
"A locally registered backend" stands for the one registry entry that is specific to the owner's
machines.

## Prior art consulted

| File | Use |
|---|---|
| `prompts/specstride-ecosystem.md` §0–§2, §4 row R19, §5, §6 | Binding. Decisions, tensions, disposition values, feature numbers |
| `prompts/analysis/A2-consolidation-analysis.md` | Starting point. **Extended** throughout; **contradicted** in eight places (Finding F-01) |
| `old/028-as-is-specstride/` (spec, data model, research, 5 contracts) | Read in full |
| `old/011-as-is-mixture-of-loops/` (spec, data model, research, 4 contracts, recovered constitution) | Read in full |
| `old/002-as-is-lisa/` (spec, data model, research, 6 contracts) | Read in full |
| `/root/specstride` at `9cab15d`: `orchestrator.sh`, `proposer.sh`, `specstride`, `specstride-lib.sh`, `specstride-digest.sh`, `lib/critic.py`, `lib/specstride_spec.py`, `lib/verification_plan.py`, `README.md` | Verified the claims below |
| `/root/mixture-of-loops` at `9c88f86`: `supervisor_lib.py`, `supervise.py`, `runtime.py`, `contract_lib.py`, `bootstrap_contract.py`, `SKILL.md` | Verified the claims below |
| `/root/lisa` at `76adfdc` and `363e6a3`: `core/src/engine/lifecycle.ts`, `core/src/engine/phase-loop.ts`, `core/src/critic/ensemble.ts`, `specs/src/resolve.ts`, `cli/src/commands/{status,resume,run}.ts` | Verified the claims below |

## Questions answered

**(a) Where do the three systems overlap, and do they agree?**
See "Overlap map". Specstride and Lisa overlap on the gated loop and agree far more than A2 reports,
because Lisa was ported from the same ancestor and Specstride's code already contains several
behaviours its spec omits. mixture-of-loops overlaps with both only at the edges: locks, hashing,
stop reasons, learning and the tasks grammar.

**(b) Which terms collide and what are the required renames?**
See "Glossary". Eighteen terms, each with one reserved meaning and qualified forms for the rest.
"Micro-loop" takes the decision 21 meaning. The old use becomes **recovery cycle**.

**(c) Which conflicts need a ruling?**
Fourteen. See "Semantic conflicts". Four more are recorded as closed, with the reason.

**(d) What are the exit codes per process and the union of stop reasons?**
See "Exit codes per process" and "Stop reasons". The engine writes 13 run-level stop reasons, not
the three that 028 names. mixture-of-loops matches two of them by string.

**(e) Which defects and accidental behaviours exist, and what happens to each?**
See "Defects and accidental behaviours": 33 items. 14 preserve, 9 fix, 7 drop, and 3 that travel
with a deferred Lisa feature.

**(f) What is the draft disposition of each as-is requirement and success criterion?**
See the Appendix: 133 rows, one disposition each.

**What did `auto` do beyond `run`, and where does it go?**
See "`auto` versus `run`". In the scripts the mode is only a recorded label. The difference is in
the skill: `auto` derives and renders first, `run` requires an existing launcher.

## Findings

### F-01 Corrections to A2

| # | A2 says | What the sources show | Tag |
|---|---|---|---|
| 1 | Conflict 9: 028 counts every non-verdict as MALFORMED and lacks Lisa's transport-versus-config split | The engine halts on a critic exit 3 with `run_stop reason=critic_config` and exit 3 (`orchestrator.sh:2133-2137`). `lib/critic.py` exits 3 for missing specs, phase, plan or evidence (`critic.py:2533-2562`) and turns call errors into MALFORMED (`critic.py:2728-2742`). Both systems have the split | `verified-local` |
| 2 | 028 is silent on what `required` does to a verdict; Lisa turns a verified-failing approval into a rejection | In `required` mode the engine runs the fixed-argv verification **before** the critic. On failure it writes the feedback itself, sets the result to a rejection and does not call the critic (`orchestrator.sh:1979-2019`). Lisa calls the critic first and verifies only after APPROVED (`phase-loop.ts:405-427`). Same outcome, opposite order | `verified-local` |
| 3 | Archive differs: `verdict.txt` versus a copied transcript name; `approved/` exists only in Lisa | Specstride copies the newest transcript as `verdict.txt` (`orchestrator.sh:1376-1378`) and moves leftovers to `attempts/phase<N>/approved/` on approval (`orchestrator.sh:2068-2074`). They agree | `verified-local` |
| 4 | 028 stop reasons are `critic_unavailable`, `wall_budget`, `proposer_consecutive_errors`, "…" | The engine emits 13 run-level reasons (see "Stop reasons") | `verified-local` |
| 5 | The grounding cap with NOT-SHOWN is Lisa-only | Specstride has the same rule (`critic.py:1381-1388`), with `GROUNDING_MAX_FILES` 80 (`critic.py:44`) | `verified-local` |
| 6 | Precedence is defaults → `.env` → flags | It is defaults < install-root `.env` < caller environment < flags (`orchestrator.sh:177-193`) | `verified-local` |
| 7 | The critic snapshot does not expand globs (from A5, repeated in the prompt) | Fixed before the baseline: commit `d6dab74` (2026-09-24 23:05) is an ancestor of `9cab15d`; wildcard citations are expanded (`critic.py:1390-1404`). The rejections A5 counted came from an older install | `verified-local` |
| 8 | A 5 % cap on other languages; feature numbers 101–103 | Superseded by decision 2 and by §6 of the prompt | `verified-local` |

A2 claims that hold after checking: the three-way ID collisions; resume refusing with exit 1 while
locked (`specstride:588-591`); the default verification modes (`orchestrator.sh:226` versus 002
FR-006); the mixture-of-loops tasks parser as a second grammar (`bootstrap_contract.py:29-33`,
which recognizes only `## Phase N:` headings); attempt numbers restarting on resume
(`orchestrator.sh:1742`, comment at `orchestrator.sh:1358-1361`).

### F-02 Lisa product code is the same in both trees for the packages R19 cites

`git diff --stat 76adfdc 363e6a3 -- packages/core packages/cli packages/specs packages/verification
packages/scheduler` shows only removed `demo-*.mjs` files and one added line in each
`package.json`. `lifecycle.ts` is identical at both commits. `verified-local`. So every 002
requirement cited here reads the same on either tree. R1 rules on the rest.

### F-03 Lisa's ensemble is not wired into the CLI

`git grep -n ensemble 76adfdc -- packages/cli/src/commands/run.ts` returns nothing. 002 FR-022
describes a library function. `verified-local`.

### F-04 Lisa has two stop reasons beyond the six in its contract

`proposer_context_invalid` (exit 3) and `critic_protocol` (exit 2) are emitted by
`phase-loop.ts:883-912` but are absent from `RUN_STOP_REASONS` (`lifecycle.ts:56-63`) and from
002 C:cli. `verified-local`.

### Overlap map

Relation: **A** agree, **C** conflict, **X** complement. "Wins" applies the merge rule.

| Concept | 028 Specstride | 011 mixture-of-loops | 002 Lisa | Rel. | Wins | Dest. |
|---|---|---|---|---|---|---|
| Gated phase loop | 028 FR-003, 006–008 | runs it as a `specstride` stage | 002 FR-008–014 | A | 028 | 101 |
| All phases already approved | runs release verification, then exit 0; failure exits 2 (`orchestrator.sh:968-996`) | — | ends at once | C | 028 | 101, 105 |
| Nonce verdict | 028 FR-005 | — | 002 FR-018, 019 | A | either | 101 |
| MALFORMED limit | 028 FR-010 | — | none | X | 028 | 101 |
| Critic config error halts | code only, exit 3 | — | 002 FR-011 | A | either | 101 |
| Oscillation halt | 028 FR-009 | — | none | X | 028 | 101 |
| Diagnostician and accelerator | 028 FR-011, 012 | — | none | X | 028 | 101 |
| Critic ensemble | none | — | 002 FR-022, library only | X | ruling C-11 | roadmap |
| Grounding snapshot and cap | code only | — | 002 FR-021 | A | 028 code | 101 |
| Attempt archive | 028 FR-007 | — | 002 FR-014 (subset) | A | 028 | 101 |
| Atomic evidence write | proposer is told to; runtime files not stated | `state.json` atomic | 002 FR-013 | X | Lisa | 101 |
| Verification modes | default `required`; gate before critic | inventories `verification-commands.json` | default `off`; gate after critic | C | 028 | 105 |
| Verification plan | per run, `runs/<id>/verification/` | coverage `verification_ids` | immutable store per bundle | C | 028 | 105 |
| TEST_PLAN provenance header | code only | — | 002 FR-038 | A | either | 105 |
| Lock | flock or mkdir, per workdir, exit 5 | flock per pipeline, exit 24 | mkdir with dead-owner reclaim, exit 5 | C | ruling C-04 | 102, 107 |
| Stop | `stop.flag`, exit 6, `--now` | signal, exit 128+N; supervisor exit 2 | JSON `stop.flag`, exit 6 | X | 028 + 011 | 102, 107 |
| Resume | replay `last-run.conf`; refuse with exit 1 | stage-level skip; reset on digest change | refuse with 5 or 3; spec-hash check | C | ruling C-03 | 102, 107 |
| Counts across resume | attempt restarts at 1 | relaunch budget persists in `harness-run.json` | attempt restarts at 1 | A (today) | decision 23 | 102 |
| Settings replay | 23 keys, two files | contract is the record | 17+ keys, one file | X | 028 | 102 |
| Front door | 12 verbs | `supervise.py` verbs | 5 inspection verbs unimplemented | C | 028 | 102 |
| Proposer pass supervision | 028 FR-017–019; exits 7, 8, 9, 10 | stage timeout 3600 s | no-progress threshold 2 | X | 028 | 103 |
| Spec formats | 3, `openspec-change` | own tasks parser | 5, `openspec` | C | 028 | 104 |
| Spec resolution without `-s` | 028 FR-001 | explicit `--feature` | unspecified | X | 028 | 104 |
| Input hashing | reverse inventory fingerprint | SHA-256 plus checkbox-insensitive hash | bundle semantic hash | X | 011 | 104 |
| Learning | 028 FR-024 | 011 FR-003, 016, 018, 024 | `@lisa/memory`, no FR | X | 028 + 011 | 106 |
| Contract, launcher, supervisor | none | 011 FR-001–023 | none | X | 011 | 107 |
| Reverse | 028 FR-025–027 | none | bundle profile only | X | 028 | 108 |
| Registry | one registry, closed list | onboarding list of five | `provider/model` chains | C | decision 17 | 109 |
| Defaults for proposer and critic | dsh, claude | — | Opus, Opus | C | decision 13 | 110 |
| Config layers | defaults, `.env`, env, flags, replay | contract `configuration`, stage `env` | `LISA_*`, flags | C | decision 9, R16 | 110 |
| Budgets | time and counts | stage and relaunch budgets | tokens and cost ledger | X | all three | 110 |
| Events | v1 JSONL | labelled stdout lines | v2 plus v1 in one file | C | ruling C-06 | 111 |
| Digest | `specstride-digest.sh`, no FR | `[DIGEST]`, `[MOL-DIGEST]` | none | X | 011 | 111, 107 |
| Telemetry export | Loki and OTLP, off | writes disabled keys, no reader | `@lisa/otel`, no FR | X | decision 11 | 111 |
| Doctor | none | `onboard-skill --check` | `doctor`, no FR | X | Lisa as prior art | 112 |
| Skill onboarding | none | 011 FR-025 | none | — | decision 19 | 113 |
| Human approvals | none | findings resolved by the model | 002 FR-025–027, 050 | X | ruling C-12 | roadmap |
| Scheduler, queue, cron, worktrees | none | none | 002 FR-039–048 | — | ruling C-20 | roadmap |
| API server, trajectory | none | none | 002 FR-049, 051 | — | R13 | 121 |
| Engine hooks, SQLite index, bundles | none | none | 002 FR-030–036, 052, 053 | — | ruling C-20 | roadmap |

### Glossary with required renames

One reserved meaning per term. Every other meaning is written in its qualified form. `inferred`
from the sources cited in each row; the choices are recommendations.

| Term | Meanings today | Reserved meaning | Required renames |
|---|---|---|---|
| **gate** | phase checkpoint `GATE<N>-*` (028, 002); launch gate of six checks (011 FR-019); `VerificationGate` (002 DM); scheduler "safety gates" (002 FR-039); reverse "lint and guard gates" | The phase gate: evidence, verdict, approval marker | **launch check** (011); **verification gate**, always qualified; **admission check** (scheduler); **reverse lint** and **reverse guard** |
| **phase** | gated unit of a spec (028, 002) | As today | — |
| **stage** | one step of a launch contract; a `specstride` stage runs a whole multi-phase run (011 DM:Stage) | Pipeline step in a launch contract | Never used for a phase |
| **task** | Spec Kit `T###` line (028 FR-013); Lisa `taskId`, `task.*` events, scheduler task; the v1 event field `task` = workdir basename (`orchestrator.sh:689`) | Spec Kit work item | Lisa scheduler task → **work item**; event field `task` → **project** in the new schema, `task` in the projection |
| **unit of work** | new (decision 21) | What one micro-loop cycle completes | R23 defines its size |
| **attempt** | proposer-then-critic cycle (028 DM:Attempt); stage retry `attempt n/m` (011); relaunch `attempt=` in `[MOL-RELAUNCH]`; scheduler attempts (002) | **phase attempt**: one proposer-then-critic cycle | **stage attempt** (011 in-stage retry); **relaunch** (supervisor restart); **job attempt** (scheduler) |
| **pass** | one proposer invocation inside an attempt; also called "iteration" (`MAX_ITER`, `iter_start`) | One proposer invocation | "iteration" survives only in the literal names `MAX_ITER`, `iter_*` |
| **micro-loop** | README: "A diagnose-and-accelerate micro-loop for stuck phases" (`README.md:52`, `wiki/Home.md:19`) | Decision 21: a bounded propose-and-check cycle inside one phase attempt | Old use → **recovery cycle** (diagnostician plus accelerator) |
| **relaunch** | supervisor restarts the launcher (011 FR-021) | As today | Distinct from **resume** (operator or engine continues from markers) |
| **run** | one orchestrator invocation, id with pid (028 DM:Run); `runs/<id>/` keyed by pipeline id and reused across relaunches (011 DM:RunState); Lisa run plus Job, QueueJob, DashboardJob | **run**: one engine invocation over one feature | 011's run directory → **pipeline run**; its id is the **pipeline id** |
| **launch** | one detached process tree started by the supervisor (`harness-run.json`) | As today | — |
| **pipeline** | the stages of one launch contract | As today | — |
| **session** | host conversation; harness conversation; POSIX session (`start_new_session`) | A model conversation with one harness | **host session** for the host; "process session" for POSIX |
| **job** | Lisa Job (14 states), QueueJob, DashboardJob; yield `job` (028 DM:Yield); long job (`--long-job-cmd`) | **detached job**: a process the engine waits on | Lisa's Job family is written **scheduler job** and **dashboard job** |
| **verdict** | critic result (028, 002); 011 has decisions, not verdicts | Critic result only | 011 `GateReport.decision` → **launch decision**; **relaunch decision** |
| **digest** | `[DIGEST]` line; `[MOL-DIGEST]` line; `contract_digest` = SHA-256; `specstride-digest.sh`; `verification_failure_digest.py` | The final one-line report of a run | Hashes → **hash** (`contract_hash`, literal `contract_digest` kept in the projection); `verification_failure_digest` → **failure summary** |
| **contract** | launch contract (011); `specstride-pass-yield/v1`, `specstride-overlay/v1` `contract` fields (028); Spec Kit `contracts/`; feature 100 contracts | Never bare | **launch contract**; **yield artifact schema**; **interface contract** |
| **bundle** | content-addressed launcher bundle (011 DM:Bundle); SpecificationBundle v2 (002) | Never bare | **launch bundle**; **spec bundle** |
| **obligation** | CoverageObligation (011); VerificationObligation (028, 002) | Never bare | **coverage obligation**; **verification obligation** |
| **hook** | Lisa lifecycle hooks (002 FR-052); Claude Code and dsh hooks; bash `add_exit_hook` | Never bare | **engine hook**; **host hook** |
| **backend** | registry entry (028 FR-021) | Retired as a product term | → **harness** |
| **harness** | onboarding target and host of the skill (011); agent CLI | An agent CLI, SDK or endpoint that plays the proposer or critic role | 011's sense → **host** |
| **provider** | `provider/model` spelling (002); model vendor | The model vendor or API | — |
| **adapter** | spec-format adapter and delivery adapter (002); stream adapter (028) | Never bare | **harness adapter**; **spec-format adapter**; **stream adapter**; **sink adapter** |
| **host** | — | The orchestrating product that runs the skills: Claude Code, dsh | Claude Code is both a host and a harness; say which |
| **stopped** | engine exit 6; supervisor exit 2; runtime state `stopped` | The outcome name | Codes stay per process |
| **learning / memory** | knob tuning (028, 011); `@lisa/memory`; feature 114 | **learning** = knob tuning; **memory** = context carried forward | — |
| **feature** | Spec Kit directory; state namespace; `FeatureRecord` | Spec Kit feature; **feature slug** for the namespace | Slug rule defined once (028 DM:Feature) |

### Semantic conflicts that need a ruling

Each has options and one recommendation. "Oracle" means the behaviour the parity oracle pins.

| # | Conflict | Options | Recommendation |
|---|---|---|---|
| C-01 | **Verification default and gate order.** 028 defaults to `required` and verifies before the critic; Lisa defaults to `off` and verifies after | (a) 028 in full; (b) 028 default, Lisa order; (c) both orders selectable | **(a)**. It is the oracle, and it saves a critic call on every failing build. 002 FR-009 is superseded |
| C-03 | **Resume refusals.** 028: exit 1 when locked and when no config is saved. Lisa: 5 `already_running`, 3 `nothing_to_resume`, 3 on spec-hash change | (a) keep 1 and 1; (b) adopt 5 and 3, with a register row; (c) keep 1 under a compatibility flag | **(b)**. Exit 1 means internal error everywhere else, and 5 already means lock held. The oracle maps 1 → 5 and 1 → 3 for `resume`. Spec-hash refusal: adopt, because 011 already refuses stale sources with 23 |
| C-04 | **Lock mechanism and stale locks.** flock is released by the kernel; the mkdir fallback is never reclaimed after a kill; Lisa reclaims a dead owner | (a) native flock module; (b) mkdir plus owner pid and start time, with reclaim; (c) both by platform | **(b)** on every platform, same behaviour on Linux and macOS, no native module. Observable contract: exit 5, per workdir, no false RUNNING. Register row for reclaim (DR-13) |
| C-05 | **Nested layers.** Pipeline lock (24) and workdir lock (5) nest. Two pipelines on one workdir pass 24 and the second fails inside its stage with child exit 5, which is not retryable. 011 FR-015 and FR-021 read a child exit code and a stop reason | (a) keep the engine as a child process; (b) in-process engine that returns the same result record; (c) one lock | **(b) with the record of (a)**: the pipeline runtime receives `{exit_code, stop_reason}` from the engine through a file, so 011's rules port unchanged whichever R15 picks. Add a launch check that reports a held workdir lock before launch |
| C-06 | **Event vocabulary and output labels.** Three formats; `[MOL-*]` carries the old product name | (a) new schema only, oracle maps; (b) new schema plus a v1 projection written beside it; (c) keep v1 | **(b)**, in a separate file, not mixed into one file as Lisa does. `[DIGEST]` and `[MOL-*]` lines are kept byte-compatible behind the projection; new output uses `[SPECSTRIDE-*]`. R14 owns the schema |
| C-07 | **Spec-format names and detection order** | (a) 028 names and order; (b) Lisa's; (c) both names as aliases | **(a)**, with `openspec` accepted as an alias. The environment step moves into config precedence (R16). `wiggum` falls under decision 3; `chat` goes to the roadmap |
| C-08 | **Stop reasons as a contract.** 011 matches two strings; its reader takes the newest line that has a `reason` field when the contract names no event (`runtime.py:231-255`) | (a) keep string matching; (b) a closed enum in feature 100 with a `retryable` attribute, read from the run's terminal record | **(b)**. The enum is the union below. The projection still writes `run_stop.reason` |
| C-11 | **Ensemble versus critic diversity** | (a) drop; (b) defer as an opt-in critic strategy; (c) Wave 1 | **(b)**. Decision 7 covers independence; the ensemble has no production caller today (F-03) |
| C-12 | **Human approvals.** A5 found 51 passes on a phase blocked on a human decision | (a) port Lisa approvals in Wave 1; (b) Wave 1 emits a blocked-on-human event and stops with `proposer_no_progress`; approvals deferred to Wave 2; (c) drop | **(b)**. The signal is what the evidence asks for; a durable approval channel needs a UI |
| C-14 | **Counts and attempt numbers across resume.** Today the attempt restarts at 1 and a collision gets a `-<run-id>` suffix. Decision 23 carries counts over | (a) attempt numbers continue, suffix rule disappears; (b) numbers continue, suffix kept for foreign directories | **(a)**, plus a `--reset-counts` flag. The oracle runs with counts reset, or maps attempt numbers (DR-10) |
| C-15 | **State root.** 011 keys `.mixture-of-loops/` by the launcher's location, 028 by workdir | (a) one root per workdir; (b) keep both | **(a)** under decision 3. The pipeline id keys a subdirectory. The oracle maps paths |
| C-16 | **"Stopped" codes.** Engine 6, supervisor 2, launcher 128+N; a stage stopped by child exit 6 ends the launcher with 22 and `state=stopped` (`runtime.py:661-676`) | (a) keep per-process codes; (b) renumber | **(a)**. Renumbering breaks the oracle for no gain. The table is per process |
| C-17 | **Glob expansion.** The prompt lists it as a defect to fix; the baseline already has the fix (F-01 row 7) | (a) port the baseline, no waiver; (b) keep the register row as a record | **(a)**, and keep one register line saying why no waiver is needed. If the oracle reference were ever pinned to an older commit the waiver returns |
| C-20 | **Lisa platform features with no home**: bundles, immutable plan store, scheduler, queue, cron, worktrees, server, engine hooks, SQLite index, approvals | per group: defer or drop | **Defer** all (28 rows), so nothing is lost before R1 and R26 report. Drop candidates if the owner wants a smaller roadmap: SQLite index, cron, queue |

Closed without a ruling:

| # | Conflict | Why closed |
|---|---|---|
| C-02 | Default proposer and critic | Decision 13; register row DR-04 |
| C-09 | Critic config versus transport errors | Not a conflict (F-01 row 1) |
| C-10 | All-approved behaviour | Merge rule: 028 wins |
| C-13 | Default mode of the run skill | Decision 18; register row DR-08 |

### Exit codes per process

`verified-local` against the files named; codes from the contracts are marked (C).

| Process today | Codes | Source |
|---|---|---|
| Engine (`orchestrator.sh`) | 0 done; 1 internal, `critic_unavailable`, `proposer_no_evidence`; 2 `max_rejects`, `gate_oscillation`, `release_verification`; 3 invalid spec or config, `critic_config`, unknown argument; 4 budget; 5 lock; 6 stop | `orchestrator.sh:25-33`, `:982-984`, `:1969-1970`, `:2135-2136` |
| Critic (`lib/critic.py`) | 0 approved; 3 config or usage; 10 rejected or malformed | `critic.py:2533-2562`, `:2764`, `:2846` |
| Proposer loop (`proposer.sh`) | 0 evidence; 1 usage; 3 overlay error; 4 max-iter; 6 stop; 7 errors; 8 no progress; 9 yield budget; 10 cap kills; 127 harness binary not found; 130 and 143 on INT and TERM | `proposer.sh:117-133`, `:499`, `:1874-1875` |
| Front door (`specstride`) | 0; 1 unknown subcommand, missing state, resume refused, usage of inspection verbs; 3 invalid spec in `phases` | `specstride:252-259`, `:534`, `:583-591`, `:717-720` |
| `specstride reverse` wrapper | 0; 2 usage; 3 refused flag or mode | `specstride:96-124` |
| Reverse lint and guard | 0; 3 findings | `reverse.py:42` |
| Bootstrap | 0; 2 usage | 011 C:cli (C) |
| Validate, render | 0; 20 invalid; 23 stale | 011 C:cli (C) |
| Launcher and pipeline runtime | 0; 20; 21; 22; 23; 24; 128+N | `runtime.py:42-46`, `:661-676` |
| Supervisor (`supervise.py`) | 0; 2 stopped; 3 unknown-terminal; 4 refused; 5 supervision-expired; 22 failed; 24 lock-conflict; 130 interrupted | `supervisor_lib.py:91-92`; 011 C:cli (C) |
| Onboarding linker | 0; 2–7 | 011 FR-025 |
| Lisa CLI | 0–6 as the engine; 1 unknown verb and unimplemented verb; 70 uncaught | `lifecycle.ts:24-33`; 002 FR-001, 004, 005 |
| Lisa doctor; approvals | 0, 2, 1; 2 refused | 002 C:cli (C) |

Collisions by value: 1 (five meanings), 2 (six), 3 (five), 4 (four), 5 (four), 6 (three).

Proposed table for the new product (`inferred`; feature 100 owns it):

| Process or command | Codes kept | Notes |
|---|---|---|
| `specstride run`, `resume` (engine) | 0–6 | `resume` refusals per C-03 |
| Proposer pass loop (internal) | 0, 4, 6, 7, 8, 9, 10 | A result record if in-process. Quota pause adds no code: the run waits |
| Critic call (internal) | approved, rejected, malformed, config error | 10 and 3 survive only if it stays a child process |
| Pipeline runtime (launcher) | 0, 20–24, 128+N | Unchanged |
| `specstride supervise` | 0, 2, 3, 4, 5, 22, 24, 130 | Unchanged |
| `specstride reverse`, lint, guard | 0, 2, 3 | Unchanged |
| Inspection commands | 0, 1, 3 | Unchanged |
| `specstride doctor` | 0 healthy, 2 findings, 1 error | From Lisa; R16 owns |
| Any command, uncaught error | 70 | From 002 FR-005 |

Micro-loops add no codes (decision 21).

### Stop reasons

Run-level reasons the engine writes as `run_stop reason=…` (`verified-local`, `orchestrator.sh`):

| Reason | Engine exit | Line | In 028 spec | In Lisa | Retryable by 011 |
|---|---|---|---|---|---|
| `stop_flag` | 6 | 1769, 1882 | no | yes | no |
| `wall_budget` | 4 | 1775 | no | yes | **yes** |
| `proposer_max_iter` | 4 | 1890 | no | yes | no |
| `proposer_no_progress` | 4 | 1905 | no | no (event `proposer.no_progress`) | no |
| `proposer_consecutive_errors` | 4 | 1920 | no | no | **yes** |
| `proposer_yield_budget` | 4 | 1940 | no | no | no |
| `proposer_cap_exhausted` | 4 | 1965 | no | no | no |
| `proposer_no_evidence` | 1 | 1969 | no | yes | no |
| `critic_config` | 3 | 2135 | no | yes | no |
| `critic_unavailable` | 1 | 2180 | 028 FR-010 | no | no |
| `gate_oscillation` | 2 | 2215 | no | no | no |
| `max_rejects` | 2 | 2252 | no | yes | no |
| `release_verification` | 2 | 982 | no | no | no |

Pass-level `run_stop` lines, written by the proposer loop into the same file with an `iter` field:
`proposer_yield_budget`, `proposer_yield_timeout`, `stop_flag`, `proposer_cap_exhausted`,
`proposer_consecutive_errors`, `proposer_no_progress` (`proposer.sh:2109-2349`).
`proposer_yield_timeout` exists only at this level. `ralph_otel_spans.py:250-251` tells the two
levels apart by the `iter` field.

Lisa only: `proposer_context_invalid` (3), `critic_protocol` (2) (F-04).

mixture-of-loops:

| Kind | Values | Source |
|---|---|---|
| Retryable engine reasons | `wall_budget`, `proposer_consecutive_errors` | `contract_lib.py:81` |
| Stage reasons, transient | `exit`, `timeout`, `recovery-deadline`, `recovery-exhausted` | `supervisor_lib.py:80` |
| Stage reasons, deliberate | `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, `exec-error:<e>` | `supervisor_lib.py:81-88` |
| Run `exit_reason` | `preflight`, a stage reason, `all-stages-complete` | 011 DM:RunState |
| Launcher exit reasons | `invalid-contract`, `preflight-blocked`, `stage-failed`, `stale-sources`, `lock-conflict` | `supervisor_lib.py:54-60` |
| Relaunch refusals | `still-running`, `operator-stop`, `completed`, `deliberate-stop`, `unknown-terminal`, `lock-conflict`, `unknown-launcher-exit`, `signal-stop`, `launcher-exit-<n>`, `state-not-failed`, `unknown-stage`, `exec-error`, `stage-reason-not-transient`, `child-exit-not-retryable`, `stop-reason-not-allowed`, `contract-digest-changed`, `learning-decisions-changed`, `launcher-edited`, `budget-exhausted`, `budget-deadline-exceeded`, `relaunch-disabled`; approval `classified-transient` | `supervisor_lib.py:962-1056`, `:1217` |

New reasons the decisions imply (`inferred`): none for micro-loops; `quota_paused` is a run state,
not a stop reason (decision 8); `blocked_on_human` is an event (C-12).

### `auto` versus `run`

| Level | `run` | `auto` | Evidence |
|---|---|---|---|
| Skill (`SKILL.md`) | Executes a launcher that already exists. Finds it with `supervise.py resolve`. Derives and renders nothing. Stale sources are reported (exit 23) and `auto` is offered | `generate` (derive, validate, promote, render, `bash -n`, `--dry-run`), then launch if the launch checks pass | `SKILL.md:43-49`, `:225-238`; `verified-local` |
| Mode selection | Execution phrasing alone | The word "auto", or generation words together with execution words | `supervisor_lib.py:199-207`; `verified-local` |
| `supervise.py launch --mode` | default `run` | accepted | `supervise.py:247`; `verified-local` |
| `supervise.py auto` subcommand | accepted with `--mode run` | default; it is `launch` followed by `watch` | `supervise.py:142-146`, `:265`; `verified-local` |
| Effect of the mode value | The string is stored in `harness-run.json` and printed in `[MOL-LAUNCH] mode=` | same | `supervisor_lib.py:614`, `:1091`; no other reader found by `grep`; `verified-local` |
| Relaunching | Same classifier and budget in both modes; off only with `--no-relaunch` | same | `supervise.py:112-116`; `verified-local` |
| Budget key | `configuration.auto` holds the relaunch budget for both modes | same | `contract_lib.py:401-423`; `verified-local` |

Where each piece goes under decision 18:

| Behaviour | Destination |
|---|---|
| Derive, validate, promote, render before launch (`auto`) | The default path of `specstride-run`, feature 107 driven by 113 |
| Launch an existing launcher without re-deriving (`run`) | Kept as the re-attach and relaunch path of `specstride-run` when a validated, non-stale launch contract exists. A stale one triggers re-derivation, which the skill announces |
| `generate` | `dry-run` mode |
| Relaunch within budget | Unchanged, feature 107 |
| `mode` field in the launch record and `[MOL-LAUNCH]` | Kept in the projection with value `run`; the divergence register lists the field (DR-08) |
| `configuration.auto` | Renamed `configuration.relaunch` in the new contract schema; the old key is a normalizer mapping |
| Mode selection from prose (011 FR-017) | Superseded. The host model reads the optional comment; only `dry-run` withholds consent |

### Defects and accidental behaviours

Default is preserve. "Fix" needs a register row and an oracle waiver or mapping.

| # | Behaviour | Evidence | Rec. |
|---|---|---|---|
| D-01 | Wildcard citations read as MISSING in the critic snapshot | Fixed at baseline (F-01 row 7) | **fix** (port the fixed behaviour; no waiver) |
| D-02 | README documents repetition limit 5; code uses 12 | `proposer.sh:166`; `README.md:1352-1353` | preserve 12; correct the documentation |
| D-03 | `specstride-digest.sh` has a hard-coded workdir and feature | `specstride-digest.sh:12-15` | **drop**; the digest and `status` replace it |
| D-04 | Attempt number restarts at 1 on resume; reject limit restarts with it | `orchestrator.sh:1742`, `:1358-1361` | **fix** (decision 23, DR-10) |
| D-05 | Leftover rejected evidence on resume is archived under `attemptresume-<run-id>` | `orchestrator.sh:1752-1754` | preserve |
| D-06 | The mkdir lock fallback is never reclaimed after a kill | `orchestrator.sh:515-521` | **fix** (C-04, DR-13) |
| D-07 | Lisa status says RUNNING for any existing lock directory | `status.ts:120-132` | **drop**; 028's probe wins |
| D-08 | `recovery-exhausted` is unreachable but accepted by the classifier | `supervisor_lib.py:75-80`, `runtime.py:481` | preserve |
| D-09 | A stage stopped by child exit 6 ends the launcher with exit 22 and `state=stopped` | `runtime.py:661-676` | preserve |
| D-10 | Stale and invalid `[DIGEST]` lines go to stderr and carry `evidence=none` | `runtime.py:563-570` | preserve |
| D-11 | The reason reader takes the newest line with any `reason` field when no event is named | `runtime.py:231-255` | preserve in the projection; new code reads the typed terminal record (C-08) |
| D-12 | Five contract configuration keys are written and never read | 011 C:environment | **drop**; hashes differ anyway (DR-07) |
| D-13 | The JSON Schema is looser than the hand-written validator | 011 research | **fix**: one schema is both; validator behaviour is the oracle |
| D-14 | `MOL_VIA` reminder on stderr | 011 FR-026 | **drop** |
| D-15 | Legacy `wiggum` spellings, `.wiggum/` fallback, `WIGGUM_*` variables, pre-v2 layout migration | 011 FR-027; 028 research; 028 DM:Feature | **drop** (decision 3, DR-06) |
| D-16 | Lisa has two canonicalizers that may disagree | 002 Assumptions | deferred with bundles; fix if revived |
| D-17 | Lisa claims CloudEvents compatibility without the fields | 002 C:events | **drop** the claim |
| D-18 | Lisa README documents a doctor exit 3 that does not exist | 002 C:cli | preserve code (0, 2, 1) |
| D-19 | Lisa `.env.example` variables with no reader | 002 C:config-env | **drop** |
| D-20 | Lisa has two `Schedule` shapes | 002 DM:Schedule | deferred with the scheduler |
| D-21 | Lisa approval status `expired` has no writer | 002 DM Assumptions | deferred with approvals |
| D-22 | A failed `last-run.conf` write is ignored | `orchestrator.sh:683`; 002 DM:RunConfig | preserve |
| D-23 | Resume does not replay critic timeout, wall budget, MALFORMED limit, diagnostician and accelerator switches or learning mode, which are environment-only | `specstride:592-626` | preserve under the oracle; R16 decides for new config |
| D-24 | `specstride phases` writes a fixed `/tmp/specstride-spec-err` | `specstride:534` | **fix**; not observable to the oracle |
| D-25 | The Bash emitter writes every value as a string; Python emitters write typed values | 028 C:events | preserve in the projection; typed in the new schema |
| D-26 | Engine and proposer loop both write `run_stop` to one file | `proposer.sh:2109-2349` | preserve in the projection |
| D-27 | Short-pass nudge, iteration limit and repeat-stall watchdog would misfire on passes that end at a micro-loop check | `proposer.sh:1936-1946`, `:2142`, `:2185-2191` | **fix** by exemption, as yields are exempt (DR-12) |
| D-28 | `specstride stop` with no active run still writes the flag, so the next run stops at once | `specstride:551-555` | preserve |
| D-29 | The engine deletes `stop.flag` when it honours it | `orchestrator.sh:1770` | preserve |
| D-30 | A long verification job keeps running after a failure is visible | A5; prompt §0 | **fix** in 115 (fail-fast, R23) |
| D-31 | `configuration.auto` names a budget that applies to both modes | `contract_lib.py:401-423` | preserve behaviour; rename the key |
| D-32 | mixture-of-loops parses `tasks.md` with its own, narrower grammar | `bootstrap_contract.py:29-33` | **fix**: use the one grammar owner (104); inventory output is the oracle |
| D-33 | Lisa's budget ledger loads as zero usage when unreadable | 002 FR-042 | **fix** for hard caps: an unreadable ledger must not reset spend (decision 8) |

### Divergence register candidates

One row per known tension in §2, plus the ones this report adds.

| # | As-is behaviour | New behaviour | Oracle treatment | Source |
|---|---|---|---|---|
| DR-01 | Critic prefers direct HTTP (Principle IX) | Tier 1 CLI subprocess is the default critic path | Stub critic is transport-neutral; no comparison of transport | tension 1 |
| DR-02 | Principle VIII: throwaway config home; shipped overlays: none (028 SC-007) | Tier 1 uses the logged-in CLI config | Oracle runs stubs with overlay scope `none`, which matches today | tension 2 |
| DR-03 | Principle XII restricts subscription paths | Tiers 1 and 3 are subscription paths | Not observable with stubs | tension 3 |
| DR-04 | Defaults: dsh proposer, claude critic | Claude and Claude in Wave 1 | Fixtures always name both roles | tension 4 |
| DR-05 | Quota errors trip the error breaker: proposer 7, engine 4, then a relaunch | Pause and resume; attempt not counted | Fixtures use non-quota errors; a quota fixture is waived | tension 5 |
| DR-06 | Paths `.specstride/`, `.mixture-of-loops/`; event names; legacy fallbacks | One layout, one schema, no legacy | Path map and the compatibility projection | tension 6 |
| DR-07 | Bundle holds `runtime.py`, `contract_lib.py`; hashes over them | TypeScript artifacts | Normalize bundle hash, launcher digest, `generated_by`, stamp `by` | tension 7 |
| DR-08 | Default mode `generate`; modes `run`, `auto` | Launch by default; `run`, `dry-run` | Oracle calls the scripts' equivalents directly; `mode` field listed | tension 8, decision 18 |
| DR-09 | Every pass is a fresh session | Session may continue within an attempt | Off under the oracle | decision 22 |
| DR-10 | Counts and attempt numbers reset on resume; `-<run-id>` suffix | Counts survive | Oracle runs with counts reset, or maps attempt numbers | decision 23 |
| DR-11 | No inner layer | Micro-loops on by default | Layer off; second suite with the layer on and never-completing stubs | decision 21 |
| DR-12 | Nudge, iteration limit, repeat-stall apply to every pass | Passes ending at a micro-loop check are exempt | Only reachable with the layer on | tension 9 |
| DR-13 | mkdir lock never reclaimed; flock on Linux | One mechanism with dead-owner reclaim | Per-OS expectation; stale-lock fixture waived | C-04 |
| DR-14 | Contract beats environment for learning mode | Kept as a named exception to decision 9 | Parity test | 011 FR-016, R16 |
| DR-15 | pytest, unittest, shellcheck, Mergify | TypeScript tests, oracle, CI | No differential test possible | 028 FR-030, 011 SC-001 |
| DR-16 | Symlink onboarding for five harnesses | Plugin install | No differential test | 011 FR-025 |
| DR-17 | Lisa unimplemented verbs; stale-lock RUNNING | 028 front door | Characterization not carried | 002 FR-004, 017 |
| DR-18 | Lisa verifies after the critic | 028 order | Characterization not carried | C-01 |
| DR-19 | Resume refuses with exit 1 | 5 and 3 | Exit-code map for `resume` | C-03, if ruled |
| DR-20 | Glob defect | Already fixed at baseline | None needed | tension 10, C-17 |

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Specstride | `9cab15d` (`git rev-parse HEAD` in `/root/specstride`) | 2026-09-29 |
| Glob fix | `d6dab74`, 2026-09-24, ancestor of `9cab15d` | 2026-09-29 |
| mixture-of-loops | `9c88f86`, read with `git show`; checked-out branch is `roadmap-new-harnesses` | 2026-09-29 |
| Lisa | `76adfdc` and `363e6a3`, read with `git show` | 2026-09-29 |

## Options compared

Rule for choosing between `merged-with` and `translated` when both apply:

| Option | Traceability of the Lisa side | Marks layout changes | Chosen |
|---|---|---|---|
| Both sides `merged-with`; layout change noted as "layout-mapped" | Kept on both rows | In the note | **yes** |
| Winner `translated`, Lisa side `merged-with` | Kept on one row | In the disposition | no |
| Everything that touches a path is `translated` | Lost | Yes, but almost every row qualifies | no |

`translated` is used for a requirement with no equivalent in another system whose form changes, and
for every implementation-describing requirement that survives.

## Recommendation

Adopt the glossary, the per-process exit table, the 13-reason enum and the appendix as the drafts
for `consolidation.md` and `traceability.md`, and put the fourteen conflicts before the owner with
the recommendations above. Treat 028 **code** as the winner wherever 028's spec is silent, since
four supposed Lisa advantages are already in that code.

Confidence: **high** for the verified corrections, the exit codes and the stop reasons; **medium**
for the dispositions, because R1 (Lisa reuse), R15 (engine as child process) and R26 (scheduler) can
move rows between `deferred`, `merged-with` and `translated`.

## Matrix rows

None.

## Open questions / risks

1. **The glob defect is already fixed at the baseline.** The prompt and A5 treat it as a fix to
   make. Proposed for `DECISIONS-PENDING.md`: proceed by porting the baseline; R21 should restate
   the false-rejection figure as a cost of an old install.
2. **Stop reasons are wider than any spec says.** Ten of the 13 engine reasons appear in no as-is
   requirement. R18 must number them as B-items or the traceability matrix cannot cite them.
3. **C-05 depends on R15.** If the engine runs in-process, 011 FR-015 and FR-021 move from
   `ported` to `translated`.
4. **28 Lisa rows are `deferred`.** Each needs a roadmap entry; if the owner prefers `dropped` for
   some, each needs a written justification.
5. **`superseded-by` targets.** Six rows point at a feature (`F100`, `F105`, `F109`, `F113`) whose
   requirement IDs do not exist yet. Stage B must replace them with real IDs.
6. **Not verified:** the Lisa usage-error exit code for 002 FR-007; whether Lisa's format override
   accepts `openspec` and `chat`; Specstride's behaviour on macOS without `flock`. Tried: reading
   `resolve.ts:51-70` and `orchestrator.sh:506-523` only; nothing was executed.

## Appendix — draft dispositions (f)

133 rows: 110 requirements and 23 success criteria.

| Disposition | FRs | SCs | Total |
|---|---|---|---|
| `ported` | 29 | 9 | 38 |
| `merged-with` | 29 | 5 | 34 |
| `translated` | 18 | 2 | 20 |
| `superseded-by` | 8 | 3 | 11 |
| `deferred` | 25 | 3 | 28 |
| `dropped` | 1 | 1 | 2 |
| Total | 110 | 23 | 133 |

| System | ported | merged-with | translated | superseded-by | deferred | dropped | Total |
|---|---|---|---|---|---|---|---|
| 028 | 16 | 12 | 7 | 3 | 0 | 0 | 38 |
| 011 | 19 | 0 | 10 | 4 | 0 | 2 | 35 |
| 002 | 3 | 22 | 3 | 4 | 28 | 0 | 60 |

"Layout-mapped" in a note means the parity test asserts the path or event name through the
documented mapping. Destination `roadmap` means no Wave 1 feature; `none` means nothing is carried.

| Origin | As-is behaviour (short) | Disposition | Dest. | Proof | Note |
|---|---|---|---|---|---|
| 028 FR-001 | Spec resolution order without `-s`; list candidates and exit 3 | ported | 104 | parity | Input paths live in the consumer project, not in the state root, so no layout mapping |
| 028 FR-002 | Format detection: override, filename, content; unknown explicit format is an error | merged-with 002 FR-029 | 104 | parity (028 side) | 028 order and the name `openspec-change` win (C-07); Lisa's env step is placed by R16 |
| 028 FR-003 | First phase without approval marker; all approved runs release verification then exit 0 | merged-with 002 FR-008 | 101 | parity (028 side) | 028 wins: release verification runs first and can exit 2 `release_verification` (C-10); release gate itself specified in 105 |
| 028 FR-004 | One run per workdir; flock or lock.d; exit 5 | translated | 102 | parity through mapping | Lock path in new layout; Node mechanism per R2; stale-owner reclaim is DR-13 (C-04) |
| 028 FR-005 | Per-call nonce; exactly one verdict line; else MALFORMED | merged-with 002 FR-019 | 101 | parity (028 side) | Identical grammar in both (16 hex) |
| 028 FR-006 | APPROVED writes empty marker; REJECTED/MALFORMED writes feedback, critic exits 10 | merged-with 002 FR-012 | 101 | parity (028 side) | Critic process exit 10 stays in the per-process table only if the critic remains a child process (R15); layout-mapped |
| 028 FR-007 | Archive rejected attempt; copy feedback, hint, acceleration note, transcript; `-<run-id>` suffix | merged-with 002 FR-014 | 101 | parity (028 side) | 028 file set wins; suffix rule changes under decision 23 (DR-10); layout-mapped |
| 028 FR-008 | Retry until MAX_REJECTS (3); exit 2 | merged-with 002 FR-010 | 101 | parity (028 side) |  |
| 028 FR-009 | Oscillating criterion halts with exit 2 after archiving | ported | 101 | parity | Stop reason `gate_oscillation` |
| 028 FR-010 | MALFORMED limit (3, 0 disables); exit 1 `critic_unavailable` | merged-with 002 FR-011 | 101 | parity (028 side) | 028 code already separates config errors (exit 3 `critic_config`), so no conflict (C-09 closed) |
| 028 FR-011 | Diagnostician on a new unmet-criteria signature | translated | 101 | parity through mapping | Implementation names (`lib/critic.py --diagnose`) and marker path change form; behaviour kept |
| 028 FR-012 | Accelerator due conditions | ported | 101 | parity | Uses `.accelerated-phase<N>` marker, which 028 does not name (B-item) |
| 028 FR-013 | Tick task checkboxes after approval; failure does not undo approval | ported | 101 | parity |  |
| 028 FR-014 | Git commit after approved phase when `auto`; never init or push | ported | 101 | parity | Lisa `gitCheckpoint` agrees (002 FR-012) |
| 028 FR-015 | stop.flag honoured at boundaries and during a pass; exit 6; `--now` kills pass tree | merged-with 002 FR-046 | 102 | parity (028 side) | Lisa JSON flag is a superset; empty flag = clean in both; layout-mapped |
| 028 FR-016 | Resume refuses while locked; replays last-run.conf, extras last-wins | merged-with 002 FR-016 | 102 | parity (028 side) | 028 exit 1 wins under the oracle; C-03 rules on the new code and on spec-hash refusal |
| 028 FR-017 | Watchdogs: idle 900, disk-progress 1800, repetition 12 | ported | 103 | parity | Code value 12 is the truth (D-02); micro-loop exemption is DR-12 |
| 028 FR-018 | Error and hard-cap breakers; orchestrator exit 4 on proposer 4, 7, 8, 9, 10 | ported | 103 | parity | Quota pause carves quota errors out of exit 7 (DR-05); exit mapping in 100 |
| 028 FR-019 | Yield artifact `specstride-pass-yield/v1`, poll 30, max 4 per attempt, command predicate off | ported | 103 | parity | Contract name kept; layout-mapped |
| 028 FR-020 | `--verification off\|plan\|required`, default `required`; other values exit 3 | ported | 105 | parity | What `required` does to a verdict has no FR; taken from code (C-01) |
| 028 FR-021 | One backend registry; defaults proposer dsh, critic claude | translated | 109 | parity through mapping | Registry becomes the adapter registry with discovery (decision 17); default change is DR-04 |
| 028 FR-022 | Loki and OTel off by default; default endpoints | translated | 111 | parity through mapping | One exporter (decision 11); off-by-default kept |
| 028 FR-023 | Front door verbs; read-only except stop, resume, learn, reverse writes | merged-with 002 FR-003 | 102 | parity (028 side) | 028 verb set wins; `learn` → 106, `reverse` → 108 |
| 028 FR-024 | Learn adjusts only allowlisted knobs within bounds | ported | 106 | parity |  |
| 028 FR-025 | Reverse output naming and refusals | ported | 108 | parity | State-directory refusal maps to the new state root |
| 028 FR-026 | Reverse guard against baseline inventory | ported | 108 | parity |  |
| 028 FR-027 | Reverse linter per level | ported | 108 | parity |  |
| 028 FR-028 | Config-home overlay declared in registry entry; scope variable | translated | 109 | parity through mapping | Overlay plumbing kept; interaction with Tier 1 login is DR-02 |
| 028 FR-029 | One module owns the spec grammar; shims and critic import it | translated | 104 | parity through mapping | Implementation-describing; becomes "one grammar owner" in TS; absorbs the mixture-of-loops tasks parser |
| 028 FR-030 | pytest suite and CI workflow | superseded-by F100 (development workflow) | 100 | divergence row DR-15 | Implementation-describing; replaced by the TS test and CI setup plus the parity oracle |
| 028 SC-001 | All approved ends exit 0 with `run_end outcome=all_approved` | translated | 101 | parity through mapping | Event name through the compatibility projection (111) |
| 028 SC-002 | No approval from a verdict line in evidence | merged-with 002 SC-001 | 101 | parity (028 side) |  |
| 028 SC-003 | Each halt cause maps to one exit code 0–6 | merged-with 002 SC-004 | 100 | parity (028 side) | Per-process exit table |
| 028 SC-004 | At most MAX_REJECTS critic-judged attempts | ported | 101 | parity | Meaning across resume changes under decision 23 (DR-10) |
| 028 SC-005 | One diagnostician pass per signature; one accelerator attempt per diagnosed signature | ported | 101 | parity |  |
| 028 SC-006 | Reverse run changes nothing outside output and state dir | ported | 108 | parity |  |
| 028 SC-007 | No shipped backend declares an overlay; runs use the operator's real environment | superseded-by F109 (overlay policy under tiered auth) | 109 | divergence row DR-02 | A statement about the shipped registry, not a behaviour; ruling needed with Principle VIII |
| 028 SC-008 | CI succeeds only when lint and test jobs succeed | superseded-by F100 (development workflow) | 100 | divergence row DR-15 | Implementation-describing |
| 011 FR-001 | Bootstrap inventories sources with SHA-256, line count, semantic hash for tasks.md | ported | 107 | parity | Hashing scheme is the one canonical hasher in 104 |
| 011 FR-002 | Bootstrap emits draft with open blocker `semantic-derivation-required` | ported | 107 | parity | `generated_by.tool` literal names a Python file: normalizer field |
| 011 FR-003 | Bind Specstride decision log into `configuration.learning` | translated | 106 | parity through mapping | Path to the decision log in the new layout; log byte format must be kept or the hash binding changes |
| 011 FR-004 | Strict validation rules | ported | 107 | parity |  |
| 011 FR-005 | Reject open blockers and unresolved coverage | ported | 107 | parity |  |
| 011 FR-006 | `--promote` writes validated plus stamp; failure sets draft, `next:` hints, exit 20 | translated | 107 | parity through mapping | Stamp `by` literal and command name change form |
| 011 FR-007 | Stale sources exit 23 except checkbox-only changes | ported | 104 | parity |  |
| 011 FR-008 | Renderer re-validates, requires stamp, refuses edited launcher unless `--replace-edited` | ported | 107 | parity |  |
| 011 FR-009 | Content-addressed bundle with contract, runtime.py, contract_lib.py | translated | 107 | parity through mapping | Bundle holds TS artifacts, so content hashes differ (DR-07); path in new layout |
| 011 FR-010 | Generated Bash launcher with marker and self-digest, execs runtime.py | translated | 107 | parity through mapping | Implementation-describing; thin shim allowed (decision 2); marker text is a normalizer field |
| 011 FR-011 | Runtime exits 23/20 with `[DIGEST] state=failed`; dry-run plan and `[DIGEST] state=dry-run exit=0` | ported | 107 | parity |  |
| 011 FR-012 | Run state under `runs/<id>/`; exclusive lock; exit 24 | translated | 107 | parity through mapping | Path in new layout; state root no longer keyed by launcher location (C-15) |
| 011 FR-013 | Preflight; exit 21 `preflight` | ported | 107 | parity |  |
| 011 FR-014 | Stages in order; skip completed; reset on digest change; record in state.json | ported | 107 | parity |  |
| 011 FR-015 | In-stage retry by exit code and stop reason; exit 22 or 128+N; child 6 is stopped | ported | 107 | parity | Depends on the stop-reason contract (100) and on the engine result staying observable as child exit plus reason (C-05) |
| 011 FR-016 | Strip inherited learning env; force `off` unless the stage declares it | ported | 106 | parity | Deliberate exception to decision 9 precedence: DR-14; `WIGGUM_LEARNING` part falls under decision 3 |
| 011 FR-017 | Mode selection defaults to `generate` | superseded-by decision 18 | 113 | divergence row DR-08 | `generate` → `dry-run`; `run` and `auto` → `run` (see §Auto versus run) |
| 011 FR-018 | Learning-mode selection from the request | ported | 106 | parity | Deterministic selector kept; the host comment (decision 18) cannot widen it |
| 011 FR-019 | Six ordered launch checks; first failure refuses; held lock yields `attach` | translated | 107 | parity through mapping | Check names kept; `launcher-syntax` checks the launcher in its new form |
| 011 FR-020 | Detached launch, stdin closed, new session, logs, `harness-run.json` | translated | 107 | parity through mapping | File names and paths in new layout; detached Node runtime (decision 5) |
| 011 FR-021 | Relaunch classifier conditions; every refusal named | ported | 107 | parity | Quota pause removes one relaunch cause (DR-05) |
| 011 FR-022 | Relaunch budget default 2, declared 0–5 | ported | 107 | parity | `configuration.auto` key name kept in the contract schema or mapped (C-13) |
| 011 FR-023 | `[MOL-*]` labelled lines and final digest fields | translated | 111 | parity through mapping | Label prefix ruling in C-06; grammar kept |
| 011 FR-024 | Retrospective per contract digest; suggestions not run | translated | 106 | parity through mapping | Path in new layout |
| 011 FR-025 | `bin/onboard-skill` symlinker and its exit codes | superseded-by F113 (plugin packaging) | 113 | divergence row DR-16 | Plugin install replaces symlink onboarding (decisions 13, 19); dsh in 120 |
| 011 FR-026 | stderr reminder when `MOL_VIA` is not `shell` | dropped | none | justification + ruling | Exists to steer a model toward the scripts; one CLI with terse output (decision 16) removes the cause |
| 011 FR-027 | Legacy `wiggum` spellings normalized with a warning | superseded-by decision 3 | none | divergence row DR-06 | Legacy compatibility |
| 011 SC-001 | CI matrix on Python 3.10–3.13 | superseded-by F100 (development workflow) | 100 | divergence row DR-15 | Implementation-describing |
| 011 SC-002 | Mergify automerge with label and green ci | dropped | none | justification + ruling | Repository merge automation, not product behaviour |
| 011 SC-003 | `--dry-run` exits 0, no action, one `[DIGEST] state=dry-run` | ported | 107 | parity | This is the behaviour behind the `dry-run` mode of decision 18 |
| 011 SC-004 | Launcher failure classes map to 20–24 | ported | 100 | parity | Per-process exit table |
| 011 SC-005 | Poll ≥ 60 s, ×1.5, cap 600 s | ported | 107 | parity | Token cost of one supervision cycle is budgeted in 113 (decision 16) |
| 011 SC-006 | At most 5 relaunches, 2 by default | ported | 107 | parity |  |
| 011 SC-007 | Seven supervision outcomes mapped to exits | ported | 100 | parity | Supervisor `stopped` = 2 differs from engine stop = 6 (C-16) |
| 011 SC-008 | Fixture expectations greeting-blocked and greeting-ready | translated | 107 | parity through mapping | Fixtures become oracle fixtures (R18) |
| 002 FR-001 | Unknown verb: exit 1, outcome `unknown` | merged-with 028 FR-023 | 102 | characterization (Lisa side) | 028 front door also exits 1 on an unknown subcommand (specstride:717-720) |
| 002 FR-002 | Usage and exit 0 on empty argv or help | merged-with 028 FR-023 | 102 | characterization (Lisa side) |  |
| 002 FR-003 | `run`, `start` or a leading flag launches | merged-with 028 FR-023 | 102 | characterization (Lisa side) | Identical routing |
| 002 FR-004 | Recognized but unimplemented verbs exit 1 `verb_not_implemented` | superseded-by 028 FR-023 | 102 | divergence row DR-17 | The new product implements these verbs |
| 002 FR-005 | Exit with router code; 70 on uncaught error | ported | 102 | characterization | 028 and 011 are silent; sound; enters the per-process table |
| 002 FR-006 | Launch defaults (Opus proposer and critic, verification `off`) | superseded-by 028 FR-020 | 110 | divergence row DR-04 | Verification default is 028's `required`; harness defaults come from decision 13; numeric defaults agree with 028 |
| 002 FR-007 | Strict flag parser rejects unknown flags | merged-with 028 FR-023 | 102 | characterization (Lisa side) | 028 prints usage and exits 3 on an unknown argument (028 C:cli); 028 code wins |
| 002 FR-008 | Resume at first unapproved phase; all approved ends at once | merged-with 028 FR-003 | 101 | characterization (Lisa side) | 028 wins on release verification |
| 002 FR-009 | Approval advances only when verification passes; else rejection | superseded-by F105 (028 code: verification gate runs before the critic) | 105 | divergence row DR-18 | Same outcome, different order; 028 code wins (C-01) |
| 002 FR-010 | Halt `max_rejects` or archive and retry | merged-with 028 FR-008 | 101 | characterization (Lisa side) |  |
| 002 FR-011 | Transport error is MALFORMED; config error halts | merged-with 028 FR-010 | 101 | characterization (Lisa side) | Agrees with 028 code |
| 002 FR-012 | On approval: marker, archive leftover feedback, events, optional checkpoint | merged-with 028 FR-006 | 101 | characterization (Lisa side) | 028 also moves leftovers to `attempts/phase<N>/approved/` |
| 002 FR-013 | Atomic evidence write (tmp, fsync, rename); empty approval marker | ported | 101 | characterization | Lisa wins where 028 is silent on runtime-written files |
| 002 FR-014 | Archive rejected attempt | merged-with 028 FR-007 | 101 | characterization (Lisa side) | Subset of 028 |
| 002 FR-015 | Exit vocabulary 0–6 | merged-with 028 SC-003 | 100 | characterization (Lisa side) |  |
| 002 FR-016 | Resume refusals: SPEC nothing_to_resume, LOCK already_running, SPEC on spec-hash change | merged-with 028 FR-016 | 102 | characterization (Lisa side) | Conflicts on codes; 028 wins under the oracle (C-03) |
| 002 FR-017 | Status reports RUNNING whenever the lock directory exists | superseded-by 028 FR-023 | 102 | divergence row DR-17 | 028 status probes the lock; Lisa's stale-lock RUNNING is defect D-07 |
| 002 FR-018 | Fresh 16-hex nonce per review | merged-with 028 FR-005 | 101 | characterization (Lisa side) |  |
| 002 FR-019 | Exactly one verdict line with exact nonce | merged-with 028 FR-005 | 101 | characterization (Lisa side) |  |
| 002 FR-020 | MALFORMED feedback states fail-safe rejection | merged-with 028 FR-006 | 101 | characterization (Lisa side) | 028 writes the same sentence (critic.py:2818-2821) |
| 002 FR-021 | Grounding presence lines up to cap; beyond cap NOT-SHOWN | merged-with 028 FR-006 | 101 | characterization (Lisa side) | 028 code has the same rule with no FR (critic.py:1381-1388); R18 numbers the B-item |
| 002 FR-022 | Critic ensemble second-judge concurrence | deferred 3+ | 101 | roadmap entry | Library only in Lisa (no CLI wiring found); ruling C-11 |
| 002 FR-023 | Best-effort emission: v2 journal plus v1 line | translated | 111 | characterization through mapping | The pattern becomes the compatibility projection (decision 11) |
| 002 FR-024 | Delivery dispatcher keyed by adapter id and idempotency key | deferred 2 | 111 | roadmap entry | Needed only when sinks beyond file and OTel exist |
| 002 FR-025 | Approval decision refusal rules | deferred 2 | roadmap | roadmap entry | C-12; Wave 1 only signals blocked-on-human |
| 002 FR-026 | Approval store idempotency and atomic rewrite | deferred 2 | roadmap | roadmap entry | C-12 |
| 002 FR-027 | Approvals CLI refused exit 2 | deferred 2 | roadmap | roadmap entry | C-12 |
| 002 FR-028 | Five format adapters registered | merged-with 028 FR-029 | 104 | characterization (Lisa side) | `wiggum` adapter falls under decision 3; `chat` adapter is roadmap |
| 002 FR-029 | Detection order with env steps | merged-with 028 FR-002 | 104 | characterization (Lisa side) | 028 order wins (C-07) |
| 002 FR-030 | `spec import-project` refusals | deferred 3+ | 104 | roadmap entry | Bundle import (C-20) |
| 002 FR-031 | Artifact selection by role | deferred 3+ | 104 | roadmap entry | Overlaps 011 FR-001 inventory, which wins |
| 002 FR-032 | Exactly one spec and one tasks artifact | deferred 3+ | 104 | roadmap entry |  |
| 002 FR-033 | `--require-traceability` failures | deferred 3+ | 104 | roadmap entry |  |
| 002 FR-034 | Import summary fields | deferred 3+ | 104 | roadmap entry |  |
| 002 FR-035 | Snapshot artifacts and recompute semantic hash | deferred 3+ | 104 | roadmap entry | One hasher in 104: 011's scheme wins |
| 002 FR-036 | Bundle store hash refusals | deferred 3+ | 104 | roadmap entry |  |
| 002 FR-037 | Verification plan bound to bundle; immutable store | deferred 3+ | 105 | roadmap entry | 028 derives the plan per run; 028 wins in Wave 1 |
| 002 FR-038 | TEST_PLAN starts with content-hash comment and provenance | merged-with 028 FR-020 | 105 | characterization (Lisa side) | 028 code renders the same marker and provenance (verification_plan.py:37, 1175-1176) |
| 002 FR-039 | Scheduler safety predicate, five checks | deferred 3+ | roadmap | roadmap entry | R26 decides; no production caller found in Lisa |
| 002 FR-040 | Greedy batch admission up to maxParallel | deferred 3+ | roadmap | roadmap entry | R26 |
| 002 FR-041 | Budget evaluation over four ceilings; 0 is off | translated | 110 | characterization through mapping | Becomes per-role budgets (decision 8); Lisa wins where 028 and 011 have no cost budget |
| 002 FR-042 | Budget ledger persisted atomically; unreadable loads as zero | translated | 110 | characterization through mapping | "Unreadable loads as zero" is unsafe for a hard cap: see D-33 |
| 002 FR-043 | Queue selection by priority then FIFO | deferred 3+ | roadmap | roadmap entry | C-20 |
| 002 FR-044 | Idempotent attempt start | deferred 3+ | roadmap | roadmap entry | C-20 |
| 002 FR-045 | Queue crash recovery | deferred 3+ | roadmap | roadmap entry | C-20 |
| 002 FR-046 | stop.flag atomic write; empty means clean | merged-with 028 FR-015 | 102 | characterization (Lisa side) |  |
| 002 FR-047 | Cron evaluation and misfire policy | deferred 3+ | roadmap | roadmap entry | Host scheduled tasks may replace it (R3) |
| 002 FR-048 | Worktree creation rules | deferred 3+ | roadmap | roadmap entry | R26 |
| 002 FR-049 | API server auth, healthz, JSON-RPC | deferred 2 | 121 | roadmap entry | Only if R13 picks a local server for the kanban |
| 002 FR-050 | Approvals webhook response routing | deferred 2 | roadmap | roadmap entry | C-12 |
| 002 FR-051 | Trajectory paging clamp and cursor | deferred 2 | 121 | roadmap entry | View model contract in 111 |
| 002 FR-052 | Engine hooks fail closed at blockable points | deferred 3+ | roadmap | roadmap entry | Term is "engine hook"; host hooks are in 113 |
| 002 FR-053 | SQLite index in WAL mode, rebuildable | deferred 3+ | roadmap | roadmap entry | Native module; files stay the truth; drop candidate |
| 002 SC-001 | Replies without exactly one nonce line are non-approvals | merged-with 028 SC-002 | 101 | characterization (Lisa side) |  |
| 002 SC-002 | Resume starts at first unapproved phase, no counter | merged-with 028 FR-003 | 101 | characterization (Lisa side) | Counts survive resume (decision 23) but the phase position stays marker-derived |
| 002 SC-003 | No reader sees a partial evidence file | ported | 101 | characterization | With 002 FR-013 |
| 002 SC-004 | Every termination maps to 0–6 | merged-with 028 SC-003 | 100 | characterization (Lisa side) |  |
| 002 SC-005 | Bundles with disagreeing hashes refused on read | deferred 3+ | 104 | roadmap entry |  |
| 002 SC-006 | Stale-hash approval decisions refused | deferred 2 | roadmap | roadmap entry |  |
| 002 SC-007 | Trajectory page ≤ 500 records | deferred 2 | 121 | roadmap entry |  |
