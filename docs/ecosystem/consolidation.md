# Consolidation

Stage A synthesis artifact. Status: **approved by the owner on 2026-09-29** (`APPROVAL.md`), with the
rulings applied. Conflict rulings marked "proposed" below are approved as proposed unless `APPROVAL.md`
says otherwise.

Contents, in order: 1 Glossary · 2 Conflict rulings proposed · 3 Per-process exit-code tables ·
4 Stop-reason list · 5 Defect policy · 6 Divergence register.

## 0. Conventions and status

| Subject | Rule |
|---|---|
| Origin of an as-is id | Always written: `028 FR-012` (Specstride), `011 SC-003` (mixture-of-loops), `002 FR-040` (Lisa). `B-0306` is a behaviour item of `research/R18-behaviour-inventory.tsv`; B-numbers are unique across systems |
| Baselines | Specstride `9cab15d`, mixture-of-loops `9c88f86`, Lisa `363e6a3` for 18 packages and `76adfdc` for `packages/dashboard` (DP-013). Where a spec and the code disagree, the code is right |
| Verifiers | Where a verifier corrected a report, the verifier stands. Applied here: R2v over R2 (lock), R23v over R23 (integrity rules), R8v over R8 (auth tiers per audience), R1v over R1, R21v over R21 |
| Code checked for this file | `orchestrator.sh`, `proposer.sh`, `specstride` at `9cab15d`; `contract_lib.py`, `supervisor_lib.py`, `runtime.py` at `9c88f86`, read with `git show`. Nothing was executed |
| Pending decisions | `DP-nnn` refers to `DECISIONS-PENDING.md`. The text follows the recorded default |
| Machine-specific names | One registry entry of the baseline is specific to the owner's machines. It is written "a locally registered backend" |
| Harness lists | No table here is a closed list of harnesses (decision 17). Harness names appear only where an as-is behaviour names them |

What is `unverified` in this file:

| Item | Why |
|---|---|
| Every statement about macOS | No macOS host was available to any report (DP-006). The Specstride reference does not run on a stock macOS (R18 F-23, itself `inferred`) |
| Engine as a child process or in-process | R15 and R15v are not written yet. Rows that depend on it say so (C-05) |
| R27's reconciled rules IR-58 to IR-60 and its switch names | R27 was still marked running when this file was written; its text is cited as a draft |
| The latent defect D-35 (resume overrides an exported timeout) | Read in source by R16, never executed |
| The mkdir lock that is never released (D-06) | Read in source (`orchestrator.sh:504`, `:515-520` at `9cab15d`), never executed |
| Whether the mixture-of-loops supervisor tolerates an unknown line label in a stage's output | R23 Open question 9 and R23v Open question 5; the parser was not traced for this case |
| Quota signals of every harness except Claude; Claude's `rate_limit_event` on the CLI stream | R14 Open questions 4 and 5 |
| Whether Lisa's tests pass | Never run (R1 O5, R1v V4) |

---

## 1. Glossary

One meaning per term. "Form to write" is the only form allowed in a specification; a bare use of a term
marked "never bare" is a review finding. `inferred` from the sources in each row; the names are
proposals until the owner approves them.

### 1.1 Work and its units

| # | Term | One meaning | Form to write | Specstride today (028) | mixture-of-loops today (011) | Lisa today (002) | Required rename |
|---|---|---|---|---|---|---|---|
| 1 | **gate** | The checkpoint of one phase: phase evidence, verification gate result, verdict, approval record | **phase gate** | `GATE<N>-EVIDENCE.md`, `-FEEDBACK.md`, `-APPROVED`; also "lint and guard gates" of reverse | "launch gate" of six checks (011 FR-019), `supervise.py gate` | phase gate; `VerificationGate` (002 DM); scheduler "safety gates" (002 FR-039) | 011 launch gate → **launch check**; deterministic commands of a phase → **verification gate**; scheduler → **admission check**; reverse → **reverse lint**, **reverse guard** |
| 2 | **phase** | One gated part of a spec, with its own acceptance criteria | phase | phase (028 FR-003) | not used; a `specstride` stage runs all phases | phase (002 FR-008) | None. Never "stage" |
| 3 | **stage** | One step of the pipeline in a launch contract | stage | not used | stage (011 DM:Stage) | not used | Never used for a phase |
| 4 | **task** | A Spec Kit work item, `T###` line in `tasks.md` | task | task (028 FR-013); event field `task` = workdir basename (`orchestrator.sh:689`) | task in the inventory (011 FR-001) | `taskId`, `task.*` events, scheduler task | Lisa scheduler task → **work item**; event field `task` → `project` in the new schema, `task` kept in the compatibility projection |
| 5 | **unit of work** | What one micro-loop cycle completes: one or more tasks of the current phase, declared by the proposer in a checkpoint and validated by the runtime | unit of work | none | none | none | New (decision 21; R23, R27 D1.2) |
| 6 | **attempt** | One proposer-then-critic cycle on one phase | **phase attempt** | attempt (028 DM:Attempt) | stage retry `attempt n/m`; relaunch `attempt=` in `[MOL-RELAUNCH]` | attempt; scheduler attempts | 011 in-stage retry → **stage attempt**; 011 relaunch counter → **relaunch**; Lisa scheduler → **job attempt** |
| 7 | **pass** | One proposer invocation inside a phase attempt | pass | pass; also "iteration" (`MAX_ITER`, `iter_start`) | none | pass | "iteration" survives only in the literals `MAX_ITER` and `iter_*` of the compatibility projection |
| 8 | **relaunch** | The supervisor starts the launcher again after a stop classified as transient | relaunch | none | relaunch (011 FR-021) | none | Distinct from resume |
| 9 | **resume** | A run continues from the records on disk, asked for by the operator or by a relaunch | resume | `specstride resume` (028 FR-016) | stage-level skip of completed stages (011 FR-014) | `resume` (002 FR-016) | 011's skip of completed stages → **pipeline resume** |
| 10 | **run** | The logical run of one feature; its id survives resume and relaunch; one engine process is an engine start (ruling 24) | run | run, id `<time>-<pid>` (028 DM:Run) | `runs/<id>/`, keyed by pipeline id and reused across relaunches (011 DM:RunState) | run; also Job, QueueJob, DashboardJob | 011's run directory → **pipeline run**; its id → **pipeline id** |
| 11 | **launch** | One start of the detached runtime by the host skill or the supervisor | launch | none | launch (`harness-run.json`, 011 FR-020) | none | None |
| 12 | **pipeline** | The ordered stages of one launch contract | pipeline | none | pipeline | none | None |
| 13 | **session** | One model conversation with one harness | session | "no carried session" (B-0761) | POSIX session (`start_new_session`) | harness session | Host conversation → **host session**; POSIX → **process session** |
| 14 | **job** | A process the engine waits on while no session is open | **detached job** | yield `job`, long job (`--long-job-cmd`) | none | Job (14 states), QueueJob, DashboardJob | Lisa's family → **scheduler job**, **dashboard job** |
| 15 | **checkpoint** | The file in which a pass declares a unit of work complete. It is a claim | checkpoint | "pass checkpoint" = note left by a killed pass (`pass-checkpoints/`) | none | `gitCheckpoint` = commit after approval | 028 killed-pass note → **kill note**; commit after approval → **approval commit** |
| 16 | **feature** | A Spec Kit feature directory | feature | feature; state namespace | `--feature` | `FeatureRecord` | State namespace → **feature slug**, rule defined once (028 DM:Feature) |

### 1.2 Roles and judgment

| # | Term | One meaning | Form to write | Specstride today (028) | mixture-of-loops today (011) | Lisa today (002) | Required rename |
|---|---|---|---|---|---|---|---|
| 17 | **proposer** | The role that does the work of a phase and writes phase evidence | proposer | `proposer.sh`; "agent" in log text | none | proposer | None |
| 18 | **critic** | The role that judges phase evidence in a fresh session with no tools and returns the verdict | critic; **critic-class call** for critic, diagnostician and release verification together | `lib/critic.py`; the same module runs the diagnostician (`--diagnose`) | none | critic; ensemble (002 FR-022, library only) | None |
| 19 | **verdict** | The critic's result for one phase attempt: APPROVED, REJECTED, or MALFORMED (fail-safe rejection) | verdict | verdict (028 FR-005) | none; it has "decisions" | verdict (002 FR-019) | 011 `GateReport.decision` → **launch decision**; relaunch classifier output → **relaunch decision** |
| 20 | **approval record** | The record the runtime writes on APPROVED, bound to the verdict, the phase evidence hash and the verification result, kept outside the proposer's write scope | approval record | empty marker file `GATE<N>-APPROVED` (028 FR-006; B-0875) | none | empty marker (002 FR-013); `Approval` = human decision (002 FR-025) | 028 and 002 marker → **approval marker** (as-is only); Lisa human decision → **human approval** (DP-010) |
| 21 | **evidence** | The file the proposer writes to claim a phase is done | **phase evidence** | `GATE<N>-EVIDENCE.md` | `evidence=<path>` field of `[DIGEST]`: a log or run directory | evidence file (002 FR-013) | 011 field → **digest evidence path**; runtime-built block of final inner check results → **unit evidence** |
| 22 | **grounding snapshot** | What the runtime reads from disk about the artifacts the phase evidence cites (existence, size, bounded excerpts, globs expanded), built before the critic is called | grounding snapshot | built in `lib/critic.py`; cap 80 files (`critic.py:44`); no FR | none | grounding (002 FR-021) | None |
| 23 | **inner check** | A deterministic command the runtime runs on a unit of work inside a phase attempt. It never approves | inner check | none | none | none | New (decision 21). Never "gate" |
| 24 | **closing check** | One more run of the inner check set when phase evidence appears, before the phase gate | closing check | none | none | none | New (DP-041) |
| 25 | **micro-loop** | A bounded propose-and-check cycle inside one phase attempt: unit of work, inner check, then keep, repair or escalate | micro-loop; **micro-loop layer** for the switchable layer of the engine | README: "A diagnose-and-accelerate micro-loop for stuck phases" (`README.md:52`) | none | none | The README's use is renamed (row 26) |
| 26 | **recovery cycle** | Diagnostician plus accelerator: after a rejection with a new unmet-criteria signature, one diagnosis and one accelerated phase attempt | recovery cycle | called "micro-loop" in the README; 028 FR-011, 028 FR-012 | none | none | **New name for the README's old use of "micro-loop"** |
| 27 | **obligation** | Never bare | **coverage obligation** (launch contract); **verification obligation** (verification plan) | VerificationObligation, ids `VO-…` (B-1081) | CoverageObligation | VerificationObligation | None beyond the qualifier |
| 28 | **learning** | Tuning of allowlisted knobs from past runs | learning | `learn.py` (028 FR-024) | binds the decision log (011 FR-003) | none | Lisa `@lisa/memory` and feature 114 → **memory** = context carried forward. Never mixed |

### 1.3 Artifacts and records

| # | Term | One meaning | Form to write | Specstride today (028) | mixture-of-loops today (011) | Lisa today (002) | Required rename |
|---|---|---|---|---|---|---|---|
| 29 | **digest** | The final one-line report of a run or pipeline | digest | `specstride-digest.sh` writes a markdown report; `verification_failure_digest.py` | `[DIGEST]`, `[MOL-DIGEST]` lines; `contract_digest` = SHA-256 | none | Every SHA-256 → **hash** (`contract_hash`; the literal `contract_digest` stays in the compatibility projection); `verification_failure_digest` → **failure summary** |
| 30 | **contract** | Never bare | **launch contract**; **yield artifact schema**; **interface contract** | `contract` field of `specstride-pass-yield/v1` and `specstride-overlay/v1` | launch contract | Spec Kit `contracts/` | 028's two → yield artifact schema, overlay schema |
| 31 | **bundle** | Never bare | **launch bundle**; **spec bundle** | `bundleId` of a verification plan (B-1097) | content-addressed bundle (011 DM:Bundle) | SpecificationBundle v2 | 011 → launch bundle; 002 → spec bundle |
| 32 | **hook** | Never bare | **engine hook**; **host hook** | bash `add_exit_hook` | none | lifecycle hooks (002 FR-052) | Lisa → engine hook; Claude Code and dsh hooks → host hook |
| 33 | **control plane** | The runtime-owned directory for everything the runtime decides on, outside the proposer's write scope | control plane | none; all state is inside the workdir | none | none | New (R11 R-1) |
| 34 | **compatibility projection** | The table-driven rendering of new events and output lines in the old vocabularies, written to a separate file | compatibility projection | is the source vocabulary (v1 JSONL) | is the source vocabulary (`[MOL-*]`) | v2 plus v1 in one file (002 FR-023) | R14's "legacy projection" and "oracle projection" → this term |
| 35 | **stop reason** | A member of the closed enumeration in section 4, written in the run's terminal record | stop reason | `run_stop reason=…` | stage reason, `exit_reason`, relaunch refusal reason | `RUN_STOP_REASONS` | 011's three → **stage reason**, **pipeline exit reason**, **relaunch refusal** |
| 36 | **stopped** | The outcome of a run ended on request | stopped | engine exit 6 | supervisor exit 2; state `stopped` | exit 6 | None. Codes stay per process (section 3) |

### 1.4 Harnesses, hosts and auth

| # | Term | One meaning | Form to write | Specstride today (028) | mixture-of-loops today (011) | Lisa today (002) | Required rename |
|---|---|---|---|---|---|---|---|
| 37 | **backend** | Retired as a product term | — | registry entry (028 FR-021) | none | none | → **harness**. Kept only in as-is literals (`--proposer BACKEND`, event field `backend`) inside the compatibility projection |
| 38 | **harness** | An agent CLI, SDK or model endpoint that plays the proposer or the critic role | harness | "backend" | onboarding target and the product the skill runs in | adapter target | 011's sense → **host** |
| 39 | **provider** | The model vendor or API behind a harness | provider | critic `--provider` = backend name | none | `provider/model` spelling | 028 `--provider` → harness |
| 40 | **adapter** | Never bare | **harness adapter**; **spec-format adapter**; **stream adapter**; **sink adapter** | stream adapter | none | spec-format adapter, delivery adapter | Lisa delivery adapter → sink adapter |
| 41 | **descriptor** | The declarative record that lets the generic harness adapter drive a harness: detect, invoke headless, read the stream, authenticate, roles | **harness descriptor** | none; nearest is the registry entry in `lib/backends.py` | none | none | New (decision 17) |
| 42 | **tier** | Never bare | **auth tier** (written "Tier 1", "Tier 2", "Tier 3"); **model tier**; **test tier** | none | test tiers in the README | none | Micro-loop L0–L3 → **micro level**; C0–C3 → **containment level**. Neither is a "tier" |
| 43 | **audience** | For whom the terms gate judges a path: `personal` (the owner and the fleet) or `distributed` (the published package) | audience, with its value | none | none | none | R8's "audience A" → `personal`, "audience B" → `distributed` (R8v, DP-042, DP-057) |
| 44 | **quota pause** | A state of a live run: a role waits for a provider's limit window to reset. It is not a stop and spends no budget | quota pause | none; a quota failure counts as a provider error | none; it relaunches the resulting stop | none | New (decision 8, DP-028) |
| 45 | **host** | The product that runs the host skills: Claude Code, dsh | host | none | "harness" | none | Claude Code is both a host and a harness; every sentence says which |
| 46 | **host skill** | A skill the host model invokes: `specstride-run`, `specstride-reverse`, and the doctor skill | host skill | none | "the skill" (`mixture-of-loops`, `SKILL.md`) | none | None |
| 47 | **detached runtime** | The one process per run that outlives the host session and runs the pipeline and the engine | detached runtime | `orchestrator.sh` started by the launcher | generated Bash launcher plus `runtime.py`, both called "launcher" | `lisa run` | Parts: **launcher** (the generated entry file), **pipeline runtime** (runs stages), **engine** (the gated loop), **supervisor** (host side, reads and relaunches) |

### 1.5 Parity

| # | Term | One meaning | Form to write | Today | Required rename |
|---|---|---|---|---|---|
| 48 | **divergence** | An intended difference between as-is behaviour and the new product, recorded as one row of the divergence register with a stable id | divergence, `DV-nnn` | R19 wrote `DR-nn`; R16 wrote `DR-cfg-nn` | Both → `DV-nnn`; mapping in section 6.1 |
| 49 | **normalization rule** | A rule of the oracle that maps a value to a logical form on every fixture, `N-01` to `N-28` (R18 O-6) | normalization rule, with its id | — | None |
| 50 | **waiver** | An entry of the oracle that accepts one named difference for one fixture and one surface, keyed to a `DV` row (R18 O-7). A waiver that no longer matches fails the suite | waiver | — | Never used for a normalization rule, a switch or a mapping |

Oracle handling words used in section 6: **N-xx** (normalization rule); **off** (switched off under the
oracle by ordinary product configuration); **mapped** (compared through a documented mapping table);
**waiver**; **not observable** (stub agents cannot trigger it); **none needed**.

Count: 50 terms.

---

## 2. Conflict rulings proposed

### 2.1 Summary

| # | Conflict | Proposed ruling | Pending decision | Source |
|---|---|---|---|---|
| C-01 | Verification default and gate order | 028 in full: default `required`, verification gate before the critic | — | R19 |
| C-03 | Resume refusals | New codes 5 and 3; spec-hash refusal adopted | — | R19 |
| C-04 | Lock mechanism and stale locks | Atomic directory lock in the shape R2v gives; no native module | DP-005 | R19, corrected by R2v |
| C-05 | Nested pipeline lock and workdir lock | The pipeline runtime reads `{exit_code, stop_reason}` from a file; a launch check reports a held workdir lock | — | R19; depends on R15 |
| C-06 | Event vocabulary and output labels | New schema primary; compatibility projection in a separate file; old labels kept in the projection | — | R19, R14 |
| C-07 | Spec-format names and detection order | 028 names and order; `openspec` accepted as an alias | — | R19 |
| C-08 | Stop reasons as a contract | Closed enumeration of section 4, with a `transient` attribute | — | R19, R18 |
| C-11 | Ensemble versus critic diversity | Deferred as an opt-in critic strategy | — | R19 |
| C-12 | Human approvals | Wave 1 signals blocked-on-human as a resting state; approvals deferred to Wave 3 or later, since decision 13 defines Wave 2 | — | R19, amended here |
| C-14 | Counts and attempt numbers across resume | Numbers continue; the suffix rule stays for collisions | DP-037, DP-053 | R19, amended here |
| C-15 | State root | One root per workdir; the pipeline id keys a subdirectory | — | R19 |
| C-16 | "Stopped" codes | Keep per-process codes | — | R19 |
| C-17 | Glob expansion | Port the baseline; no waiver | DP-007 | R19, R18, R21v |
| C-20 | Lisa platform features with no home | Defer all | DP-034 | R19, R26 |
| C-21 | Doctor exit codes | 0, 1, 2, 3 with a warning exiting 0 | — | R16 |
| C-22 | Lock type: kernel lock only, or directory lock | Follow DP-005 | DP-005 | R11 T-27 against R2v, R16 |
| C-23 | Quota pause: run state or stop; what happens at the wait ceiling | Run state; one new stop reason at the ceiling | DP-028 | R14 |
| C-24 | Which keys project configuration may set | R11 T-13's list, the stricter one | DP-009 | R11, R16 |
| C-25 | Config layers beyond decision 9; settings replayed on resume | R16's extended order and the run snapshot | DP-058 | R16 against R19 D-22, D-23 |
| C-26 | Approval marker or approval record | Approval record | DP-010 | R11 T-02 |
| C-27 | Proposer permission mode and containment | Contained by default; no bypass flag by default | DP-008, DP-011 | R11 T-07, R5 |
| C-28 | Grounding of paths inside the state directory | Refused by real path, with the layer on or off | — | R23, R23v, R27 |
| C-29 | Scope of "identical apart from named fields" | R23v IR-52: with no unit of work declared the layer executes nothing | DP-039, DP-055, DP-041 | R23, R23v |
| C-30 | Commit or revert per unit of work | Neither | DP-056 | R27 D-04 |
| C-31 | Output lines: language artefacts, verbosity, new lines | Old lines byte for byte in compatibility output; new lines never on a compared stream | DP-060 | R18, R17, R23 |
| C-32 | Exit code of a usage error | Keep the as-is code per command | — | R18 Appendix B |
| C-33 | Default auth tier per audience | `personal`: Tier 1; `distributed`: Tier 2 for three providers | DP-042, DP-057 | R8v, R16 |

27 conflicts carry a proposed ruling: 14 from R19 and 13 raised since.

### 2.2 Conflicts from R19

#### C-01 Verification default and gate order

| | |
|---|---|
| What each system does | Specstride: default `required` (028 FR-020); the verification gate runs **before** the critic; on failure the engine writes the feedback itself and does not call the critic (B-0319, B-0320). Lisa: default `off` (002 FR-006); the critic runs first and verification follows an APPROVED (002 FR-009). mixture-of-loops: inventories `verification-commands.json` only |
| Options | (a) 028 in full; (b) 028 default with Lisa's order; (c) both orders selectable |
| Proposed ruling | **(a)** |
| Reason | Parity binds 028. It saves a critic call on every failing build. Decision 21 requires the full verification gate to run before the critic |
| Pending decision | none |
| Owner must decide | Confirm. 002 FR-009 and the verification part of 002 FR-006 become `superseded-by` (DV-040) |

#### C-03 Resume refusals

| | |
|---|---|
| What each system does | Specstride: exit 1 when the lock is held (B-1496) and when no saved settings exist (B-1494, B-1495). Lisa: 5 `already_running`, 3 `nothing_to_resume`, 3 on a spec-hash change (002 FR-016). mixture-of-loops: refuses stale sources with 23 (011 FR-007) |
| Options | (a) keep 1 and 1; (b) 5 and 3, with a register row; (c) keep 1 under a compatibility flag |
| Proposed ruling | **(b)**, and adopt the spec-hash refusal with exit 3 |
| Reason | 1 means internal error everywhere else in the engine, and 5 already means "lock held" |
| Pending decision | none |
| Owner must decide | Whether `resume` changes its codes (DV-021). If not, option (a) needs no row |

#### C-04 Lock mechanism and stale locks

| | |
|---|---|
| What each system does | Specstride: `flock` on `<state>/lock`, released by the kernel (B-0161); without `flock`, `mkdir lock.d`, which is **never released**, not even on a clean exit, because `rmdir` fails on the directory that still holds `owner` (B-0251). mixture-of-loops: `fcntl.flock` per pipeline run, exit 24 (B-2588). Lisa: `mkdir` with dead-owner reclaim, exit 5 |
| Options | (a) native `flock` module; (b) directory lock with owner pid and start time, and reclaim; (c) both by platform; (d) directory lock with kernel-backed liveness (R2v) |
| Proposed ruling | **(d)**. Atomic `mkdir` for exclusion; owner record written in a temporary directory and renamed into place; reclaim by atomic rename, never remove-then-create; liveness from something the kernel releases and Node ships (`node:sqlite` exclusive transaction or a Unix socket, both tested by R2v); the run's process group tracked, so "owner dead, group alive" refuses to start and names the survivors; boot identity in the owner record; a foreign host is never reclaimed. Same behaviour on Linux and macOS |
| Reason | R19 recommended (b). R2v showed (b) is not equivalent: Lisa's algorithm gave more than one winner in 297 of 300 rounds; a lock with no owner file yet reads as stale; an orphaned child keeps a kernel lock but not a pid lock. The verifier stands. Lisa's lock code is not reused |
| Pending decision | DP-005 |
| Owner must decide | Accept the changed crash behaviour (DV-022), or require exact `flock` semantics, which puts a native component in the Language Ledger |
| `unverified` | macOS start-time resolution; network filesystems; `node:sqlite` is experimental in Node 22 |

#### C-05 Nested pipeline lock and workdir lock

| | |
|---|---|
| What each system does | mixture-of-loops takes a pipeline lock (exit 24) and runs the engine as a child that takes the workdir lock (exit 5). Two pipelines on one workdir both pass 24; the second fails in its stage with child exit 5, which is not retryable. 011 FR-015 and 011 FR-021 read a child exit code and a stop reason |
| Options | (a) keep the engine as a child process; (b) in-process engine that returns the same result record; (c) one lock |
| Proposed ruling | **(b) with the record of (a)**: the engine writes `{exit_code, stop_reason}` to a file and the pipeline runtime reads it, so 011's rules port unchanged whichever process model R15 picks. Add a launch check that reports a held workdir lock before launch |
| Reason | Keeps both locks' observable codes and removes the late failure |
| Pending decision | none; depends on R15 (not written) |
| Owner must decide | Nothing until R15 reports. If the engine runs in-process, 011 FR-015 and 011 FR-021 move from `ported` to `translated` (DV-028) |

#### C-06 Event vocabulary and output labels

| | |
|---|---|
| What each system does | Specstride: v1 JSONL; the Bash emitter writes every value as a string and can write duplicate keys (R18 F-20). mixture-of-loops: labelled stdout lines `[DIGEST]`, `[MOL-*]`. Lisa: v2 and v1 records mixed in one file (002 FR-023) |
| Options | (a) new schema only, oracle maps; (b) new schema plus a compatibility projection written beside it; (c) keep v1 |
| Proposed ruling | **(b)**. The projection goes to a separate file `events.legacy.jsonl`, always on under the oracle and under `compat.legacyEvents: true`, off otherwise (R14). `[DIGEST]` and `[MOL-*]` lines keep their bytes in compatibility output. Renamed product lines use `[SPECSTRIDE-*]` |
| Reason | Decision 11 asks for one schema; Principle XI asks for byte identity; only a projection gives both |
| Pending decision | none |
| Owner must decide | Confirm. Also confirm the label prefix for new lines; R23's `[LOOP]` line does not carry it (see C-31) |

#### C-07 Spec-format names and detection order

| | |
|---|---|
| What each system does | Specstride: three formats, `native`, `speckit-tasks`, `openspec-change`; order override, filename, content (028 FR-002; B-1999). Lisa: five adapters, the name `openspec`, environment steps in detection (002 FR-028, 002 FR-029); `resolve.ts:57-60` rejects an explicit `openspec` although the adapter is registered (R1v V3). mixture-of-loops: its own, narrower `tasks.md` parser (D-32) |
| Options | (a) 028 names and order; (b) Lisa's; (c) both names as aliases |
| Proposed ruling | **(a)**, with `openspec` accepted as an alias of `openspec-change`. The environment step becomes the config keys `spec.format` and `spec.feature` (R16 F5.9). Lisa's `wiggum` adapter falls under decision 3; `chat` goes to the roadmap |
| Reason | Parity binds 028 |
| Pending decision | none |
| Owner must decide | Confirm |

#### C-08 Stop reasons as a contract

| | |
|---|---|
| What each system does | Specstride writes 14 `run_stop` reason literals; 028 names one (028 FR-010). mixture-of-loops matches two of them by string (B-2496) and reads the newest line that has a `reason` field when the launch contract names no event (`runtime.py:231-255`). Lisa declares six and emits two more (R19 F-04) |
| Options | (a) keep string matching; (b) a closed enumeration with a `transient` attribute, read from the run's terminal record |
| Proposed ruling | **(b)**. The enumeration is section 4. The compatibility projection still writes `run_stop.reason` with the old strings. Lisa's two extra reasons are not admitted: 028 wins and Lisa's phase loop is reimplemented (DP-014) |
| Reason | A rename of either matched string silently breaks relaunch classification (R18 F-04) |
| Pending decision | none |
| Owner must decide | Confirm the 14 members, and rule on the one candidate member of C-23 |

#### C-11 Ensemble versus critic diversity

| | |
|---|---|
| What each system does | Lisa has a second-judge ensemble as a library function with no caller in its CLI (002 FR-022; R19 F-03). Specstride and mixture-of-loops have none |
| Options | (a) drop; (b) defer as an opt-in critic strategy; (c) Wave 1 |
| Proposed ruling | **(b)** |
| Reason | Decision 7 covers independence. The ensemble has no production caller |
| Pending decision | none |
| Owner must decide | Defer or drop. Dropping needs a written justification |

#### C-12 Human approvals

| | |
|---|---|
| What each system does | Lisa has approvals (002 FR-025 to 002 FR-027, 002 FR-050). Specstride has none: a phase blocked on a human decision loops until a breaker fires. mixture-of-loops resolves findings with the host model |
| Options | (a) port Lisa approvals in Wave 1; (b) Wave 1 emits a blocked-on-human event and stops; approvals deferred to Wave 2; (c) drop |
| Proposed ruling | **(b)**, amended. The event is `blocked` with a reason, and the run stops under an existing stop reason. R19 named `proposer_no_progress`; that breaker is never evaluated on the structured path of the baseline (B-0784; R18 F-08), so the signal must not depend on it alone |
| Reason | The signal is what the evidence asks for; a durable approval channel needs a UI |
| Pending decision | none |
| Owner must decide | Confirm (b). Feature 103 must say which stop reason a blocked run ends with on every path |

#### C-14 Counts and attempt numbers across resume

| | |
|---|---|
| What each system does | Specstride: the attempt counter and the MALFORMED streak start at 1 and 0 in every process (B-0306); an archive collision gets the suffix `-<run-id>` (B-0292); the oscillation window restarts on purpose (B-0289). Lisa: same restart. mixture-of-loops: the relaunch budget persists in `harness-run.json` |
| Options | (a) numbers continue and the suffix rule disappears; (b) numbers continue and the suffix rule stays for any directory that already exists |
| Proposed ruling | **(b)**, with a reset flag accepted from the command line only and never written to the saved settings (R23v IR-50). The oscillation window is keyed by attempt sequence (DP-037). Pass index, yield index and the consecutive breakers continue too (DP-053) |
| Reason | R19 recommended (a). The oracle switches decision 23 off by passing the reset flag (R18 O-11); numbers then restart at 1 and meet existing directories, so the collision rule is still needed. It also protects audit history |
| Pending decision | DP-037, DP-053 |
| Owner must decide | The flag's name (`--reset-counts` proposed) and whether the oscillation window is exempt from decision 23 |

#### C-15 State root

| | |
|---|---|
| What each system does | Specstride keys `.specstride/` by workdir. mixture-of-loops keys `.mixture-of-loops/` by the launcher's location (B-2497). Lisa uses `.lisa/` |
| Options | (a) one root per workdir; (b) keep both |
| Proposed ruling | **(a)**. The pipeline id keys a subdirectory. The control plane (glossary 33) is part of the layout that feature 100 defines |
| Reason | Decision 3 |
| Pending decision | none |
| Owner must decide | Confirm (DV-006) |

#### C-16 "Stopped" codes

| | |
|---|---|
| What each system does | Engine 6; supervisor 2; launcher 128+N on a signal; a stage whose child exits 6 ends the launcher with 22 and `state=stopped` (B-2570) |
| Options | (a) keep per-process codes; (b) renumber |
| Proposed ruling | **(a)** |
| Reason | Renumbering breaks the oracle for no gain. Section 3 is per process |
| Pending decision | none |
| Owner must decide | Confirm |

#### C-17 Glob expansion

| | |
|---|---|
| What each system does | The prompt lists "the critic snapshot that does not expand globs" as a defect to fix. At `9cab15d` the grounding snapshot expands them (B-0954, B-0955; `lib/critic.py:1390-1404`); the fix is `d6dab74`, an ancestor of the baseline. Lisa's grounding does not expand them (R1 item B7) |
| Options | (a) port the baseline, no waiver; (b) keep a register row as a record |
| Proposed ruling | **(a)**, with one record row (DV-019) that says why no waiver is needed. If Lisa's `grounding.ts` is extracted, glob expansion is added to it before the characterization test is written |
| Reason | Confirmed three times: R19 F-01 row 7, R18 F-07, R21v (the false rejections came from a working tree older than the fix) |
| Pending decision | DP-007 |
| Owner must decide | A formality. The waiver returns only if the oracle reference is pinned before `d6dab74` |

#### C-20 Lisa platform features with no home

| | |
|---|---|
| What each system does | Lisa only: spec bundles and import, immutable plan store, scheduler, queue, cron, worktrees, server, engine hooks, SQLite index, human approvals. 28 rows of R19's appendix |
| Options | Per group: defer or drop |
| Proposed ruling | **Defer all.** Drop candidates if the owner wants a shorter roadmap: SQLite index (native module), cron, queue |
| Reason | None of them is called in a Lisa run (R1, R1v). R26 measured no gain from agent parallelism on the reference run |
| Pending decision | DP-034 for 002 FR-043 to 002 FR-047; DP-013 for the trajectory rows |
| Owner must decide | Defer or drop, per group. Each drop needs a written justification |

### 2.3 Conflicts raised since R19

#### C-21 Doctor exit codes

| | |
|---|---|
| What each system does | Lisa's doctor: 0 healthy, 2 findings (warnings included), 1 error (002 C:cli); its README documents a 3 that does not exist (D-18). R19 carried Lisa's codes. mixture-of-loops: `onboard-skill --check` exits 5 and 6. Specstride: no doctor |
| Options | (a) Lisa's, a warning exits 2; (b) 0 no `fail` finding, 1 the doctor could not run, 2 at least one `fail`, 3 usage error; `--strict` makes warnings exit 2; (c) bitmask |
| Proposed ruling | **(b)** |
| Reason | R16 owns the doctor. The same-model warning fires routinely in Wave 1 (decision 7); exit 2 on a warning would make the code useless |
| Pending decision | none |
| Owner must decide | Confirm (DV-041) |

#### C-22 Lock type

| | |
|---|---|
| What each report says | R11 T-27: kernel advisory lock only, no directory fallback. R2v and DP-005: Node has no `flock`, and a native module breaks a plain `npm install`. R16 F8 follows DP-005 |
| Options | (a) R11; (b) DP-005 |
| Proposed ruling | **(b)**, as in C-04. R11's aim, that a stale or planted lock never blocks every run, is met by kernel-backed liveness and by the doctor reporting a lock with no live holder |
| Reason | R11 was written before R2v's finding. Principle VI requires installation without a compiler |
| Pending decision | DP-005 |
| Owner must decide | Same ruling as C-04 |

#### C-23 Quota pause and the wait ceiling

| | |
|---|---|
| What each system does | Specstride has no quota handling: a quota failure is a provider error, the proposer exits 7, the engine exits 4 with `proposer_consecutive_errors`. mixture-of-loops relaunches that stop and burns the relaunch budget in minutes (R14 F-A). Lisa: none |
| Options | (a) quota pause as a run state inside the detached runtime; (b) a stop with its own stop reason and a timed relaunch |
| Proposed ruling | **(a)**. The process stays alive; the quota pause spends no reject, iteration, MALFORMED, error, wall-clock or relaunch budget. `proposer_consecutive_errors` stays transient only for error classes that are not quota. When the wait ceiling is reached (R14 proposes 12 h), the run stops with **one new stop reason**, engine exit 4, not transient |
| Reason | Decision 8. A relauncher cannot know why a process exited |
| Pending decision | DP-028 |
| Owner must decide | Run state or stop. Whether the ceiling's stop reason is admitted as member 15 of section 4 (R14 names it `paused_quota_ceiling`). Decision 21 forbids new stop reasons for micro-loops only, so this does not contradict it |
| `unverified` | Every numeric default; every quota signal except Claude's |

#### C-24 Which keys project configuration may set

| | |
|---|---|
| What each report says | DP-009 lists harness declarations, endpoints and secret references. R11 T-13 also lists critic selection, containment level, permission flags, budget increases, hook commands, telemetry endpoints and content capture |
| Options | (a) DP-009's list; (b) R11 T-13's list |
| Proposed ruling | **(b)**. Project configuration may narrow a run and never widen it. Decision 9's order is unchanged; this filters which keys a layer may set |
| Reason | R16's schema already follows T-13. A cloned repository must not run a command at launch (decision 18 launches without asking) |
| Pending decision | DP-009 |
| Owner must decide | Confirm the longer list, or add a per-repository trust step |

#### C-25 Config layers beyond decision 9, and settings replayed on resume

| | |
|---|---|
| What each system does | Specstride: defaults < install-root `.env`, sourced as shell code < caller environment < flags (B-0233); `resume` turns the saved `last-run.conf` values into flags, so they beat the environment (`specstride:592-626`); six settings are not saved (B-0260); a failed write of the file is ignored (D-22). mixture-of-loops: the launch contract pins the learning mode and strips it from the environment (B-2561). Lisa: process environment only |
| Options | (a) port as-is; (b) re-resolve everything on resume; (c) R16's order: contract pin > flag > run snapshot (resume only) > env > project > user > learned > default, with saved keys split into pinned and tunable |
| Proposed ruling | **(c)**. The install-root `.env` is not read; its role goes to user configuration. A failed snapshot write is a launch error. R19 marked D-22 and D-23 "preserve"; R16 owns this layer and its ruling replaces both |
| Reason | Fixes D-35. Keeps the identity of a run stable across resume (decision 23). Decision 9's order holds between the layers it names |
| Pending decision | DP-058 |
| Owner must decide | Accept three layers beyond decision 9 (contract pin, run snapshot, learned value), or name another mechanism for them (DV-023 to DV-027) |

#### C-26 Approval marker or approval record

| | |
|---|---|
| What each system does | Specstride and Lisa write an empty file (B-0875; 002 FR-013). Resume trusts its presence (B-0271); the nonce is never consulted on resume. The proposer can write the file |
| Options | (a) keep the approval marker; (b) approval record in the control plane, verified on resume |
| Proposed ruling | **(b)** |
| Reason | R11 T-02. Automatic relaunch would inherit the forgery path |
| Pending decision | DP-010 |
| Owner must decide | Confirm (DV-029). Residual risk: on a harness with no containment, the same OS user can still reach the control plane |

#### C-27 Proposer permission mode and containment

| | |
|---|---|
| What each system does | Specstride passes the harness's bypass flag on every Claude pass (B-0689, B-0740) and sets `IS_SANDBOX=1` itself when run as root (B-0067, B-0497). Claude Code refuses the bypass flag as root outside a recognised sandbox (R5) |
| Options | (a) today's behaviour; (b) containment level C2 where the harness offers it, else C1; C0 only by opt-in in user configuration; accept-edits mode with an allow list for Claude |
| Proposed ruling | **(b)**. The runtime never asserts a sandbox by itself |
| Reason | R11 T-07; R5 |
| Pending decision | DP-008, DP-011 |
| Owner must decide | The default containment level (DV-030, DV-031). If today's behaviour stays, every run is C0 and a sandbox and a non-root user become installation requirements |

#### C-28 Grounding of paths inside the state directory

| | |
|---|---|
| What each system does | Specstride honours a cited path inside the workdir, including the state directory, on purpose (`lib/critic.py:838-841`). R23 IR-19 and R23v IR-45 refuse, by real path, the control plane, the checkpoint outbox, the carry-over files of decision 22 and everything under `.git`; R27 (draft) adds the event stream |
| Options | (a) refuse only with the micro-loop layer on; (b) refuse always |
| Proposed ruling | **(b)** |
| Reason | One citation would carry repair history to the critic (decision 21). A rule that depends on the layer would break the layer-on suite (R23v V-19 item 9) |
| Pending decision | none |
| Owner must decide | Confirm (DV-032). A fixture that cites a state path is waived |

#### C-29 Scope of "identical apart from named fields"

| | |
|---|---|
| What each report says | R23 names seven surfaces that differ with the layer on. R23v V-19 found eleven more that R23's design would change with stub agents that never complete a unit of work, among them the closing check and the unit evidence block |
| Options | (a) R23 as written, with a longer list; (b) R23v IR-52: with no unit of work declared in a phase attempt, the layer executes nothing and adds nothing to any prompt but the checkpoint contract block |
| Proposed ruling | **(b)**. The checkpoint contract block is a named field (DP-039). The closing check runs only once the layer is engaged in the phase attempt |
| Reason | The verifier stands. Decision 21's clause holds only under (b) |
| Pending decision | DP-039, DP-055, DP-041 |
| Owner must decide | Whether a changed pass prompt fits the clause. Under a strict reading the protocol is taught by a separate first pass, at one pass per phase attempt |

#### C-30 Commit or revert per unit of work

| | |
|---|---|
| What each report says | A6 and R25: an unresolved unit of work reverts to the last kept commit. R24: a ref per kept unit. R22, R23: the tree is kept and nothing is committed. Specstride today: one approval commit per phase (028 FR-014) |
| Options | (a) commit and revert per unit of work; (b) neither |
| Proposed ruling | **(b)** (R27 draft, IR-60) |
| Reason | A revert destroys work and writes history that grounding could reach; the approval commit of the oracle would differ |
| Pending decision | DP-056 |
| Owner must decide | Confirm. Under (a) a register row is added for the approval commit |

#### C-31 Output lines: language artefacts, verbosity, new lines

| | |
|---|---|
| What each system does | mixture-of-loops prints `child-exit=None` (B-2611) and a Python `repr` in `[MOL-RELAUNCH]` (B-2746); its own parser accepts `None` (B-2750). It repeats absolute paths in `[MOL-LAUNCH]` and `[MOL-DIGEST]` and prints `[MOL-HOLD]` on every unchanged poll (B-2744), which costs host context (R17). R23 adds a `[LOOP]` line before the final digest |
| Options | (a) reproduce everything; (b) clean up with register rows; (c) two output modes |
| Proposed ruling | **(c)**. Compatibility output reproduces the old lines byte for byte, artefacts included, and is what the oracle compares. Default output is terse (decision 16). A line with no as-is equivalent, `[LOOP]` included, is never written to a stream the oracle compares against the reference |
| Reason | The lines are matched by string today (DP-060). Decision 16 needs terse output. R18's rules do not cover a new line on stdout: with the layer off the port would still print `[LOOP] strategy=classic`, which the reference never prints |
| Pending decision | DP-060 |
| Owner must decide | Accept two output modes (DV-033, DV-034). **New item**: the oracle needs a rule for new-only output lines; none of N-01 to N-28 covers it |

#### C-32 Exit code of a usage error

| | |
|---|---|
| What each system does | Engine: 3 on an unknown argument (B-0108). Every Python module with a parser: 2 (argparse), even where its documentation says 3 (B-0860, B-1998). Front door: 1 on an unknown subcommand (B-1499). Lisa: 1 on an unknown verb (002 FR-001) |
| Options | (a) keep the as-is code per command; (b) one code for the whole CLI |
| Proposed ruling | **(a)** |
| Reason | Defects are preserved by default. N-18 compares usage errors by exit code and first line class |
| Pending decision | none |
| Owner must decide | Confirm, or pick one code and accept a register row per command |

#### C-33 Default auth tier per audience

| | |
|---|---|
| What each report says | Decision 6 makes Tier 1 the default. R8v: for a distributed product Tier 1 is confirmed for two providers only; for Anthropic, OpenAI and the z.ai Coding Plan it is confirmed for personal use only. Tier 3: no provider qualifies |
| Options | (a) Tier 1 default for both audiences; (b) per audience |
| Proposed ruling | **(b)**. `personal`: Tier 1 default. `distributed`: Tier 2 default for those three providers, Tier 1 an opt-in marked "personal use only". The package ships with audience `distributed`; the owner sets `personal` once in user configuration |
| Reason | The verifier stands. Decision 19 asks that anything allowed for personal use only is off by default |
| Pending decision | DP-042, DP-057, DP-020 |
| Owner must decide | The default audience, and whether to seek written confirmation from Anthropic. This is hard evidence against part of decision 6 |

### 2.4 Conflicts closed without a ruling

| # | Conflict | Why closed |
|---|---|---|
| C-02 | Default proposer and critic | Decision 13 rules it. Register row DV-004 |
| C-09 | Critic configuration errors versus transport errors | Not a conflict. Both systems halt on a configuration error and score a transport error as MALFORMED (`orchestrator.sh:2133-2137`; 002 FR-011) |
| C-10 | Behaviour when every phase is already approved | Merge rule: 028 wins. Release verification runs, then exit 0; its failure exits 2 (B-0124, B-0125) |
| C-13 | Default mode of the run skill | Decision 18 rules it. Register row DV-009 |
| C-18, C-19 | — | R19 assigns neither number. Nothing is hidden behind them |
| — | Does the verification gate stop at its first failed command? | R23 contradicted itself (F-21 row 4 against IR-03). R23v V-18 settled it from the code: the gate runs every command (`lib/verification_plan.py:2172`). Stopping early exists only in the step runner inside a yield |
| — | Does a pass that ends at a valid checkpoint reset the short-pass counter? | R23 F-15 said it resets. R23v IR-48: the counter is left as it was, as a yield leaves it. The verifier stands |
| — | Relation of R19's recommendation on the lock to R2's | Both recommended a pid-file lock; R2v corrected both. Folded into C-04 |

---

## 3. Per-process exit-code tables

Codes are per process. The same number means different things in different processes, and the tables
keep it that way (C-16). Sources: R19 "Exit codes per process", R18 Appendix B, and the baseline code.
Where R18 and R19 differ, R18 is the fuller list and was checked against the inventory.

"New code" is the code of the new product. For a component that the engine may call in-process (proposer
pass loop, critic, verification gate), the value is kept as the `exit_code` field of its result record;
it is a process exit code only if R15 keeps the component as a child process. **Micro-loops add no exit
code** (decision 21; R23 IR-07).

### 3.1 Engine (`orchestrator.sh`; Lisa `lifecycle.ts` agrees on 0–6)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Every phase approved, in this run or before it, and release verification passed or not required | B-0125, B-0139 | 0 |
| 1 | Internal error; cannot enter the workdir; MALFORMED limit reached (`critic_unavailable`); proposer ended without phase evidence on an unmapped status (`proposer_no_evidence`) | B-0111, B-0136, B-0134 | 1 |
| 1 | `python3` missing | B-0118 | none: superseded by decision 1 (DV-065) |
| 2 | Rejects exceeded (`max_rejects`); oscillation (`gate_oscillation`); release verification failed | B-0138, B-0137, B-0124 | 2 |
| 3 | Invalid spec, configuration or argument; verification preflight failed; critic exit 3 (`critic_config`) | B-0108 to B-0123 except B-0111, B-0118, B-0119; B-0135 | 3 |
| 4 | Wall-clock budget; proposer 4, 7, 8, 9, 10 | B-0127, B-0129 to B-0133 | 4; also the quota wait ceiling if admitted (C-23) |
| 5 | Workdir lock held | B-0119 | 5 |
| 6 | Stop flag, or proposer 6 | B-0126, B-0128 | 6 |

The mapping from the proposer's code applies only when phase evidence is absent. With phase evidence
present, every proposer status except 6 is ignored (R18 F-10; B-0134, B-0128).

### 3.2 Proposer pass loop (`proposer.sh`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Phase evidence exists | B-0577, B-0592 | 0 |
| 1 | Usage or setup failure | B-0564 to B-0569, B-0578, B-0580, B-0581 | 1 |
| 3 | Invalid overlay declaration or scope, passed through | B-0579 | 3 |
| 4 | Iteration limit; a plugin installed on the final pass | B-0597, B-0587 | 4 |
| 6 | Stop flag | B-0584, B-0589, B-0596 | 6 |
| 7 | Consecutive errors; a plugin request refused or failed | B-0594, B-0585, B-0586 | 7. Quota classes no longer count (DV-005) |
| 8 | Consecutive passes without progress | B-0595 | 8 |
| 9 | Yield limit, yield deadline, or wall clock spent during a yield | B-0588, B-0590, B-0591 | 9 |
| 10 | Consecutive kills at the pass ceiling | B-0593 | 10 |
| 130, 143 | SIGINT, SIGTERM, only with an attempt-scope overlay | B-0582, B-0583 | 130, 143 |
| 124 (pass status) | Any watchdog kill of one pass | B-0576 | 124, in the pass record |
| 127 (pass status) | Harness command not found. The loop keeps going until a breaker ends it | B-0570 to B-0575 | 127, in the pass record |

### 3.3 Critic (`lib/critic.py`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | APPROVED; always 0 in diagnostician mode | B-0867, B-0866 | 0, result `approved` |
| 1 | Uncaught exception | B-0860 | 1 |
| 2 | Usage error (argparse). The module's documentation says 3 | B-0860 | 2 (D-38; compared by N-18) |
| 3 | Missing spec, invalid format, phase not found, invalid plan, phase evidence missing | B-0861 to B-0865 | 3, result `config_error` |
| 10 | REJECTED and MALFORMED alike | B-0868 | 10, result `rejected` or `malformed` |

### 3.4 Verification plan and gate (`lib/verification_plan.py`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Success; verification gate passed; every pre-stage command passed | B-1055 to B-1057 | 0 |
| 3 | Any verification error | B-1058 | 3 |
| 10 | Verification gate failed | B-1057 | 10 |
| 11 | A pre-stage command failed; informational | B-1056 | 11 |

`verification_failure_digest.py` (renamed failure summary): 0, and 2 on wrong usage (B-1030, B-1031). Kept.

### 3.5 Spec module CLI (`lib/specstride_spec.py`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Success | B-1998 | 0 |
| 2 | Usage error (argparse). The module's documentation says 3 | B-1998 | 2 (D-38) |
| 3 | Invalid spec, unknown explicit format, unreadable spec file | B-1999 to B-2001 | 3. An explicit `openspec` is accepted (DV-073) |

### 3.6 Reverse

| Process | As-is code | Meaning | B-items | New code |
|---|---|---|---|---|
| `specstride reverse` wrapper | 0 | Success, dry run included | B-1481 | 0 |
| | 2 | Missing source, or an unexpected argument | B-1477, B-1479 | 2 |
| | 3 | A flag the reverse run sets itself; a refused mode | B-1476, B-1478 | 3 |
| | other | The code of `reverse.py plan` when planning fails | B-1480 | same |
| `reverse.py` (plan, reverse lint, reverse guard) | 0 | Success; no error finding; source untouched | B-1623, B-1624, B-1626 | 0 |
| | 2 | Usage error (argparse) | B-1621 | 2 |
| | 3 | Findings, and invalid input alike | B-1622, B-1624, B-1625, B-1627 | 3 |
| `reverse_inventory.py` | 0, 2, 3 | Success; usage; invalid input | B-1871, B-1872 | 0, 2, 3 |

### 3.7 Learning (`lib/learn.py`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Success | B-1231, B-1234, B-1239 | 0 |
| 1 | `advise`: no telemetry | B-1233 | 1 |
| 2 | Usage; knob outside the allowlist; missing input | B-1230, B-1232, B-1235, B-1238, B-1240, B-1241 | 2 |
| 3 | `apply` refused: no telemetry, or below the sample floor | B-1237 | 3 |
| 4 | `apply` refused: quarantined | B-1236 | 4 |

### 3.8 Front door (`specstride`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Success; `stop` always, once state exists | B-1484, B-1493 | 0 |
| 1 | Unknown subcommand; missing state, feature, log, events, verdicts or feedback; usage of `feedback` and `learn` | B-1482 to B-1491, B-1497 to B-1499 | 1 |
| 1 | `resume`: lock held | B-1496 | **5** if C-03 is ruled (DV-021) |
| 1 | `resume`: no saved settings | B-1494, B-1495 | **3** if C-03 is ruled (DV-021) |
| 2 | `reverse` argument errors | B-1477, B-1479 | 2 |
| 3 | `phases` on an invalid spec; `reverse` refusals | B-1492, B-1476, B-1478 | 3 |
| other | The code of the process it runs | — | same |

### 3.9 mixture-of-loops: contract tools, launcher, pipeline runtime

| Process | As-is code | Meaning | B-items | New code |
|---|---|---|---|---|
| `bootstrap_contract.py` | 0; 2 | Success; any error | B-2473 | 0; 2 |
| `validate_contract.py` | 0 | Valid | B-2636 | 0 |
| | 2 | `--promote` with `--allow-draft` | B-2633 | 2 |
| | 20 | Invalid launch contract | B-2635 | 20 |
| | 23 | Stale sources, or learning decisions changed | B-2634 | 23 |
| `render_launcher.py` | 0; 2; 20; 23 | Success; usage; cannot render; stale | B-2545, B-2546 | 0; 2; 20; 23 |
| Launcher and pipeline runtime (`runtime.py`) | 0 | All stages complete, or dry run | B-2571 | 0 |
| | 2 | Usage error | B-2564 | 2 |
| | 20 | Launch contract invalid at start | B-2566 | 20 |
| | 21 | Preflight failed | B-2569 | 21 |
| | 22 | A stage failed; also when the child exited 6 and the state is `stopped` | B-2570 | 22 (D-09) |
| | 23 | Stale sources | B-2565 | 23 |
| | 24 | Pipeline run lock held | B-2567 | 24 |
| | 128+N | SIGINT, SIGTERM or SIGHUP | B-2568 | 128+N |
| Stage child (status) | 124; 127 | Timeout; the action cannot start | R18 Appendix B | 124; 127 |

### 3.10 mixture-of-loops: supervisor (`supervise.py`)

| As-is code | Meaning | B-items | New code |
|---|---|---|---|
| 0 | Completed; a reading taken; a relaunch started | B-2695, B-2675 | 0 |
| 1 | A status the exit map does not know | B-2695 | 1 |
| 2 | Stopped; **also** a usage error | B-2695, B-2685 | 2 (D-46) |
| 3 | Unknown-terminal | B-2695 | 3 |
| 4 | Refused; **also** the launch decision `attach` | B-2686, B-2687, B-2672 | 4 (D-37) |
| 5 | Supervision expired | B-2695 | 5 |
| 22 | Failed | B-2695 | 22 |
| 24 | Lock conflict | B-2695 | 24 |
| 130 | Interrupted; the run is left alone | B-2688 | 130 |

### 3.11 Processes that are not carried

| Process | As-is codes | Fate |
|---|---|---|
| `bin/onboard-skill` | 0; 1 (under `set -e`, B-2653); 2 to 7 (B-2647 to B-2652) | Superseded by plugin installation (DV-056). Its `--check` becomes doctor checks |
| Lisa CLI | 0–6 as the engine; 1 unknown or unimplemented verb; 70 uncaught error (002 FR-001, 002 FR-004, 002 FR-005) | 0–6 merged with 028; 70 adopted; unimplemented verbs superseded (DV-042) |
| Lisa doctor; Lisa approvals | 0, 2, 1; 2 refused (002 C:cli) | Doctor codes replaced (C-21); approvals deferred (C-12) |
| Helpers: stream tap, shippers, presenter, banner, failure ledger | 0 on every runtime path; 2 on usage where a parser exists | Internal modules in the new product. "Never breaks the loop" is kept as Principle V |
| `backend_overlay.py`; `dsh_plugin_requests.py` | 0, 1, 3; 0, 2 (B-0393, B-0394, B-0434) | Internal; values kept in result records |

### 3.12 The new `specstride` CLI

`inferred`; feature 100 owns the table. One binary; the code depends on the command.

| Command | Codes | From |
|---|---|---|
| `specstride run` | 0–6 | 3.1 |
| `specstride resume` | 0–6; 5 lock held; 3 nothing to resume or spec hash changed | 3.1, 3.8, C-03 |
| `specstride stop` | 0; 1 no state | 3.8 |
| Inspection commands (`status`, `tail`, `events`, `verdicts`, `feedback`, `phases`, `watch`) | 0; 1; 3 (`phases` only) | 3.8 |
| `specstride learn` | 0, 1, 2, 3, 4 | 3.7, 3.8 |
| `specstride reverse`, reverse lint, reverse guard | 0, 2, 3 | 3.6 |
| Launch contract commands (derive, validate, render; names owned by feature 107) | 0, 2, 20, 23 | 3.9 |
| Launcher, pipeline runtime | 0, 2, 20–24, 128+N | 3.9 |
| `specstride supervise` | 0, 1, 2, 3, 4, 5, 22, 24, 130 | 3.10 |
| `specstride doctor` | 0, 1, 2, 3 | 3.13 |
| Any command, uncaught error | 70 | 002 FR-005 |
| Any command, unknown subcommand | 1 | B-1499; 002 FR-001 |

### 3.13 Doctor (R16 F4)

| Code | Meaning | Note |
|---|---|---|
| 0 | No `fail` finding. Warnings and information allowed | Differs from Lisa, where a warning exits 2. `--strict` restores that |
| 1 | The doctor could not run | Same as Lisa |
| 2 | At least one `fail` finding | Not the engine's 2 |
| 3 | Usage error | Same number as the engine's unknown argument |

A probe that times out inside a check never raises the code above a warning.

### 3.14 Collisions

| Value | Meanings, by process |
|---|---|
| 1 | Engine internal error · proposer usage · critic uncaught exception · front door missing state or unknown subcommand · `learn advise` no telemetry · supervisor unknown status · doctor could not run |
| 2 | Engine rejects, oscillation, release verification · usage error of every argparse-based tool · `reverse` argument error · supervisor stopped · supervisor usage error · doctor `fail` finding · `learn` usage |
| 3 | Engine invalid input · critic configuration error · reverse findings · spec invalid · supervisor unknown-terminal · `learn apply` refused · doctor usage · resume nothing to resume (new) |
| 4 | Engine budget · proposer iteration limit · supervisor refused or `attach` · `learn apply` quarantined |
| 5 | Engine lock held · supervisor supervision expired · resume lock held (new) |
| 6 | Engine stop · proposer stop. A stage child's 6 becomes launcher 22 with state `stopped` |
| 10 | Proposer pass-ceiling kills · critic rejected or malformed · verification gate failed |
| 22, 24 | Launcher and supervisor use both with the same meaning: stage failed, lock conflict |
| Within one process | Supervisor 2 (stopped and usage); supervisor 4 (refused and `attach`); critic 10 (rejected and malformed); reverse 3 (findings and invalid input); engine 1 (four causes) |

A caller must always know which process it called. The stop reason, not the code, tells the causes
inside one code apart.

---

## 4. Stop-reason list

### 4.1 Reconciliation of R19 (13) and R18 (14)

| Question | Answer, from the code at `9cab15d` |
|---|---|
| How many reasons does the engine write? | 13, at `orchestrator.sh:982` to `:2252`. R19 counted these |
| How many distinct `run_stop` reason literals reach the events file? | **14.** The fourteenth, `proposer_yield_timeout`, is written only by the proposer pass loop (`proposer.sh:2155`, `:2162`); the engine then records `proposer_yield_budget` for the same stop (`orchestrator.sh:1940`). R18 counted these |
| Which count is the enumeration? | **14.** R18 is right for the contract: the compatibility projection must reproduce the pass-level lines, and `status` reads `proposer_yield_timeout` by name (B-1503). R19 is right about who writes what, and it names the fourteenth in its own text |
| Anything neither report lists? | Two more write sites of existing literals on the structured path, `proposer.sh:2253` (`proposer_cap_exhausted`) and `:2259` (`proposer_consecutive_errors`). The inventory has no `stop-reason` row for them; the nearest is B-0612 (`proposer.sh:2251`). The count stays 14. R18 should add the two rows |

### 4.2 The closed enumeration

"Matched by string" means mixture-of-loops compares the literal today: `RETRYABLE_STOP_REASONS` in
`contract_lib.py:81` (B-2496) limits what a stage's `recovery.reason.allowed` may name, and both the
launcher's in-stage retry and the relaunch classifier test the newest reason against that list
(`runtime.py:420-424`, `supervisor_lib.py:1018-1025`). "Transient" is the attribute the new
enumeration carries for relaunch purposes.

| # | Stop reason | Written by | Engine exit | Matched by string today | Transient | B-items | As-is FR |
|---|---|---|---|---|---|---|---|
| 1 | `stop_flag` | engine; proposer during a yield wait | 6 | no | no | B-0142, B-0144, B-0608 | none (028 FR-015 states the stop) |
| 2 | `wall_budget` | engine | 4 | **yes** | **yes** | B-0143 | none |
| 3 | `proposer_max_iter` | engine. The proposer's exit 4 writes no line (B-0597) | 4 | no | no | B-0145 | none |
| 4 | `proposer_no_progress` | engine; proposer | 4 | no | no | B-0146, B-0616 | none |
| 5 | `proposer_consecutive_errors` | engine; proposer | 4 | **yes** | **yes**, for error classes that are not quota (C-23) | B-0147, B-0615 | none |
| 6 | `proposer_yield_budget` | engine; proposer | 4 | no | no | B-0148, B-0607 | none |
| 7 | `proposer_yield_timeout` | proposer only | 4, recorded by the engine as reason 6 | no | no | B-0610 | none |
| 8 | `proposer_cap_exhausted` | engine; proposer | 4 | no | no | B-0149, B-0613 | none |
| 9 | `proposer_no_evidence` | engine | 1 | no | no | B-0150 | none |
| 10 | `critic_config` | engine | 3 | no | no | B-0151 | none |
| 11 | `critic_unavailable` | engine | 1 | no | no | B-0152 | 028 FR-010 |
| 12 | `gate_oscillation` | engine | 2 | no | no | B-0153 | none (028 FR-009 states the halt) |
| 13 | `max_rejects` | engine | 2 | no | no | B-0154 | none (028 FR-008 states the halt) |
| 14 | `release_verification` | engine | 2 | no | no | B-0140 (same line: B-1141) | none |

Facts that feature 100 must keep:

| Fact | Evidence |
|---|---|
| Where engine and proposer both write a reason, the events file holds two `run_stop` lines with different fields; the engine's line is the newer one | R18 Appendix C; D-26 |
| The pass-level lines carry an `iter` field; the telemetry spans tell the two levels apart by it | `ralph_otel_spans.py:250-251` (R19) |
| When a launch contract names no event, the reader takes the newest line with any `reason` field, which also matches `iter_error`, `yield_timeout` and `knob_adjusted` lines | `runtime.py:231-255`; D-11 |
| `run_end outcome=all_approved` is the only outcome literal | B-0155; 028 SC-001 |
| Four of the literals are read by the learning module as arbitration signals: `max_rejects`, `gate_oscillation`, `critic_config`, `proposer_no_progress` | B-1313 |

### 4.3 Not members

| Literal | Status | Why |
|---|---|---|
| `paused_quota_ceiling` (R14) | **Candidate member 15**, engine exit 4, not transient | Needs the owner's ruling (C-23, DP-028) |
| Quota pause | A run state | Decision 8; DP-028 |
| `blocked` with reason blocked-on-human | An event | C-12 |
| Micro-loop outcomes (cap exhausted, check cannot start, invalid ledger) | Switch the layer off for the phase attempt | Decision 21; R23 IR-07. R23v V-15 notes new occasions for old reasons, not new reasons |
| Integrity events | Reported to the critic; no halt | DP-049 |
| `proposer_context_invalid`, `critic_protocol` | Lisa only, emitted but absent from its own declared list (R19 F-04) | Not admitted (C-08) |

### 4.4 Other closed families (not stop reasons)

| Family | Values | B-items or source | Glossary term |
|---|---|---|---|
| Watchdog kill reason and class | `idle_timeout` (hang); `repeat_stall`, `progress_stall` (futility); `hard_cap` (budget) | B-0601 to B-0604, B-0606 | kill reason |
| Stage reason, transient | `exit`, `timeout`, `recovery-deadline`, `recovery-exhausted` (unreachable, D-08) | B-2697, B-2582 | stage reason |
| Stage reason, deliberate | `postcondition`, `stage-precondition`, `setup-required`, `interrupted`, `existing-prerequisite`, `completed`, `exec-error:<e>` | `supervisor_lib.py:81-88` | stage reason |
| Pipeline exit reason | `preflight`, `all-stages-complete`, or a stage reason | B-2584, B-2585 | pipeline exit reason |
| Launch check refusals | 11 literals, `launcher-not-found` to `already-running` | `supervisor_lib.py:455-549` | launch decision |
| Relaunch refusals | 21 literals and the approval `classified-transient` | `supervisor_lib.py:962-1056` | relaunch refusal |

All are ported as they are. Every literal is matched by string somewhere in mixture-of-loops today, so
the compatibility projection keeps each one.

---

## 5. Defect policy

### 5.1 The rule

| # | Rule |
|---|---|
| 1 | A documented defect or an accidental behaviour is **preserved by default**, because the oracle cannot tell an intended quirk from a bug |
| 2 | One is **fixed** only with a divergence register row that carries the owner's ruling, and with a named oracle treatment: a waiver, a mapping, or a switch. No bug-compatible switch is kept in the product (R18, option B) |
| 3 | One is **dropped** only with a written justification and the owner's ruling. A drop that is forced by an owner decision cites the decision |
| 4 | A defect that travels with a deferred feature is **deferred** with it and fixed if the feature is revived |
| 5 | A fixed behaviour gets a characterization test, since no old behaviour exists to compare it with |
| 6 | A new normalization rule may be added only with a register row, or with a statement that the value is non-deterministic in the reference itself (R18 O-6) |

### 5.2 Glob expansion needs no row

Glob expansion in the grounding snapshot is **already present at the baseline** `9cab15d`
(`lib/critic.py:1390-1404`; B-0954, B-0955; fix commit `d6dab74`). Confirmed by R19 (F-01 row 7), R18
(F-07) and R21v. It is ported as it is, so it has no row in the list below and needs no waiver. R19's
D-01 is retired. The divergence register keeps one record row (DV-019) only because the prompt's list
of known tensions names it. Two limits of the baseline are ported as they are: globs are not expanded
when citations are extracted, and a wildcard match adds a presence line and no file content.

### 5.3 The list

Ids D-02 to D-33 are R19's. D-34 to D-55 were added from R18, R16, R2v, R1v and the code.

| # | Behaviour | Evidence | Policy | Register row |
|---|---|---|---|---|
| D-02 | README documents repetition limit 5; the code uses 12 | B-0491; `README.md:1352-1353` | **preserve** 12; correct the documentation | — |
| D-03 | `specstride-digest.sh` is hard-wired to one workdir and one feature | B-0338 to B-0345 | **drop**; the digest and `status` replace it | DV-061 |
| D-04 | The attempt number and the reject limit restart on resume | B-0306 | **fix** (decision 23) | DV-011 |
| D-05 | Leftover rejected phase evidence is archived on resume under `attemptresume-<run-id>` | B-0307 | **preserve** | — |
| D-06 | The `mkdir` lock fallback is never released: `rmdir` fails on the directory that still holds `owner`, so the lock stays after a clean exit as well as after a kill. R19 described the kill case only | B-0251, B-0163, B-0164; read, not executed | **fix** (C-04) | DV-022 |
| D-07 | Lisa `status` says RUNNING for any existing lock directory | `status.ts:120-132`; 002 FR-017 | **drop**; 028's probe wins | DV-042 |
| D-08 | `recovery-exhausted` is unreachable but accepted by the classifier | B-2582, B-2697 | **preserve** | — |
| D-09 | A stage stopped by child exit 6 ends the launcher with 22 and `state=stopped` | B-2570 | **preserve** | — |
| D-10 | Stale and invalid `[DIGEST]` lines go to stderr with `evidence=none`; nothing is written to the launcher log | B-2605, B-2606 | **preserve** | — |
| D-11 | The reason reader takes the newest line with any `reason` field when no event is named | `runtime.py:231-255` | **preserve** in the compatibility projection; new code reads the typed terminal record (C-08) | — |
| D-12 | Five launch contract configuration keys are written and never read | 011 C:environment | **drop**; the hashes differ anyway | DV-061 |
| D-13 | The JSON Schema is looser than the hand-written validator | 011 research | **fix**: one schema; the validator's behaviour is the oracle | DV-059 |
| D-14 | `MOL_VIA` reminder on stderr | B-2492, B-2498; 011 FR-026 | **drop** | DV-061 |
| D-15 | Legacy `wiggum` spellings, `.wiggum/` fallback, `WIGGUM_*` variables, pre-v2 layout migration | B-0004 to B-0007, B-0252 to B-0255, B-0346, B-0360, B-0376 to B-0378; 011 FR-027 | **drop** (decision 3) | DV-036 to DV-038 |
| D-16 | Lisa has two canonicalizers that may disagree | 002 Assumptions | **deferred** with spec bundles | — |
| D-17 | Lisa claims CloudEvents compatibility without the fields | 002 C:events | **drop** the claim | — |
| D-18 | Lisa README documents a doctor exit 3 that does not exist | 002 C:cli | **drop**; the doctor's codes are R16's (C-21) | DV-041 |
| D-19 | Lisa `.env.example` variables with no reader | 002 C:config-env | **drop** | — |
| D-20 | Lisa has two `Schedule` shapes | 002 DM:Schedule | **deferred** with the scheduler | — |
| D-21 | Lisa approval status `expired` has no writer | 002 DM Assumptions | **deferred** with approvals | — |
| D-22 | A failed write of `last-run.conf` is ignored | B-0260 | **fix**: a failed snapshot write is a launch error. R19 said preserve; R16 owns the layer | DV-024 |
| D-23 | Resume does not replay critic timeout, wall budget, MALFORMED limit, start phase and other settings, which come from the environment only | B-0260; R18 F-12 | **fix**: the run snapshot holds every resolved key. R19 said preserve under the oracle | DV-024 |
| D-24 | `specstride phases` writes the fixed file `/tmp/specstride-spec-err` | B-1513 | **fix** | DV-062 |
| D-25 | The Bash emitter writes every value as a string; Python emitters write typed values | R18 F-20 | **preserve** in the compatibility projection; typed in the new schema | DV-007 |
| D-26 | Engine and proposer pass loop both write `run_stop` to one file | section 4.2 | **preserve** in the compatibility projection | DV-007 |
| D-27 | Short-pass nudge, iteration limit and repeat-stall watchdog would misfire on a pass that ends at a checkpoint | B-0541, B-0040, B-0491 | **fix** by exemption, as yields are exempt | DV-013 to DV-015 |
| D-28 | `specstride stop` with no active run still writes the flag, so the next run stops at once | `specstride:551-555` | **preserve** | — |
| D-29 | The engine deletes the stop flag when it honours it | B-0171 | **preserve** | — |
| D-30 | A long verification job keeps running after a failure is visible | R21v; R23 fail-fast finding | **fix** | DV-051 |
| D-31 | `configuration.auto` names a budget that applies to both modes | B-2518 | **preserve** the behaviour; rename the key | DV-055 |
| D-32 | mixture-of-loops parses `tasks.md` with its own, narrower grammar | `bootstrap_contract.py:29-33` | **fix**: one grammar owner; the inventory output is the oracle | DV-060 |
| D-33 | Lisa's budget ledger loads as zero usage when unreadable | 002 FR-042 | **fix**: an unreadable ledger must not reset spend | DV-063 |
| D-34 | On a `MAX_REJECTS` halt the last phase attempt is not archived; the next run archives it | B-0336 | **preserve** | — |
| D-35 | `resume` re-passes the saved pass timeout as a flag, which overrides an exported `SPECSTRIDE_PROPOSER_TIMEOUT` that the engine's own remediation text tells the operator to set | `specstride:611`, `orchestrator.sh:1916`; read by R16, not executed | **fix** | DV-024 |
| D-36 | `child-exit=None` in the failure digest; Python `repr` in `[MOL-RELAUNCH]` | B-2611, B-2746, B-2750 | **preserve** (DP-060) | DV-070 |
| D-37 | `supervise.py gate` exits 4 for the launch decision `attach` as well as for `refuse` | B-2672 | **preserve** | — |
| D-38 | Usage errors exit 2 where the module documents 3 | B-0860, B-1998 | **preserve** | — |
| D-39 | Events can hold duplicate JSON keys: `feature` twice in `run_start`, `backend` twice in `proposer_start` | B-0086; R18 F-20 | **preserve** in the compatibility projection (N-13) | DV-007 |
| D-40 | OTLP delivery never shows as delivered: the shipper labels `sink=otlp`, the status surfaces query `otel` | `lib/ralph_otel_ship.py:328` (R18 F-12) | **fix** with the one exporter | DV-058 |
| D-41 | The shippers' default Loki address is port 3100; the bundled stack listens on 3110 and has no traces pipeline | B-0042, B-2447, B-2458 | **preserve** the default address. The bundled stack is a non-code asset with no destination yet (R2v) | — |
| D-42 | `.env.example` ships a critic that differs from the built-in default, and documents a precedence that omits the caller environment | B-0001, B-0003 | **drop** with the `.env` layer | DV-023 |
| D-43 | `--promote` rewrites the launch contract without sorting keys; the bootstrap sorts them | B-2637 | **preserve** | — |
| D-44 | The no-progress breaker is never evaluated on the structured path | B-0784 | **preserve** under the oracle. Bears on C-12 | — |
| D-45 | The proposer's exit 4 at the iteration limit writes no `run_stop` line | B-0597 | **preserve** | — |
| D-46 | The supervisor uses exit 2 for a stopped run and for a usage error | B-2685, B-2695 | **preserve** | — |
| D-47 | The engine runs every phase at or above the start phase without checking approval, so a later phase that is already approved runs again | B-0337 | **preserve** | — |
| D-48 | For harnesses that emit no `agent_result`, a crashed pass reads as clean | B-0785 | **preserve** | — |
| D-49 | `onboard-skill --harness all` can exit 1, 4 or 5 before the remaining harnesses are handled | B-2653; `inferred` by R18 | **drop** with onboarding | DV-056 |
| D-50 | `[MOL-HOLD]` is printed on every unchanged poll | B-2744 | **preserve** in compatibility output; terse by default (C-31) | DV-033 |
| D-51 | Lisa's workspace lock reclaim lets several contenders win | R2v, 297 of 300 rounds | **drop**; the code is not reused | DV-022 |
| D-52 | Lisa's dashboard keeps a second phase-heading parser | `packages/dashboard/src/run-tasks.ts:146-148` (R1v) | **drop**; Principle IV forbids it | — |
| D-53 | Lisa's `resolve.ts` rejects an explicit `openspec` although the adapter is registered | `resolve.ts:57-60` (R1v V3) | **fix** by the alias of C-07, if the file is extracted | DV-073 |
| D-54 | Stream pass-through mode strips whitespace and drops blank lines | R18 F-11 | **preserve** | — |
| D-55 | Lisa emits two stop reasons its declared list lacks | R19 F-04 | **drop**; not admitted (C-08) | — |

### 5.4 Counts by policy

| Policy | Count | Ids |
|---|---|---|
| preserve | 25 | D-02, D-05, D-08 to D-11, D-25, D-26, D-28, D-29, D-31, D-34, D-36 to D-39, D-41, D-43 to D-48, D-50, D-54 |
| fix | 13 | D-04, D-06, D-13, D-22 to D-24, D-27, D-30, D-32, D-33, D-35, D-40, D-53 |
| drop | 13 | D-03, D-07, D-12, D-14, D-15, D-17 to D-19, D-42, D-49, D-51, D-52, D-55 |
| deferred | 3 | D-16, D-20, D-21 |
| Total | 54 | |

---

## 6. Divergence register

This is the single copy. Other artifacts cite a row by its id and do not restate it. An id is never
reused. "Oracle handling" uses the words defined in section 1.5; `N-xx` is a normalization rule of
R18 O-6; `FX-xx` is a fixture family of R18 O-4. **The owner approved the register on 2026-09-29** (`APPROVAL.md`). An empty cell in the column
"Owner's ruling" means "approved as proposed"; a filled cell names the ruling that changed or added
the row.

### 6.1 Ids used by earlier reports

| Earlier id | Row here |
|---|---|
| R19 DR-01, DR-02, DR-03, DR-04, DR-05 | DV-001, DV-002, DV-003, DV-004, DV-005 |
| R19 DR-06 | DV-006, DV-007, DV-035 to DV-039 |
| R19 DR-07 | DV-008 |
| R19 DR-08 | DV-009, DV-055 |
| R19 DR-09, DR-10, DR-11 | DV-010, DV-011, DV-012 |
| R19 DR-12 | DV-013, DV-014, DV-015 |
| R19 DR-13 | DV-022 |
| R19 DR-14; R16 DR-cfg-04 | DV-026 |
| R19 DR-15, DR-16, DR-17, DR-18, DR-19, DR-20 | DV-057, DV-056, DV-042, DV-040, DV-021, DV-019 |
| R16 DR-cfg-01, DR-cfg-02, DR-cfg-03, DR-cfg-05 | DV-023, DV-024, DV-025, DV-004 |

### 6.2 Known tensions, and decisions 18, 21, 22, 23

| Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-001 | The critic reaches Claude and Codex by direct HTTP (B-0980, B-0981); Principle IX puts direct HTTP first | At Tier 1 the default critic path is a harness CLI started with no tools, prompt on stdin | Decision 6; known tension 1 | **Not observable** as a difference: the stub critic serves both transports and the transcript is compared in a transport-neutral form (R18 O-3 rule 4) | |
| DV-002 | Principle VIII asks for a throwaway config home for every pass; no shipped registry entry declares an overlay, so runs use the operator's real environment (028 SC-007; 028 FR-028) | Tier 1 uses the consumer's real config home with plugins, hooks, skills and MCP servers off, never written by the run. Tier 2 uses a throwaway home. Session state lives per phase attempt | Decision 6; known tension 2; DP-012, DP-038 | **None needed** for the home: stubs run with overlay scope `none` on both sides. The flags that switch customisations off change argv: see DV-031 | |
| DV-003 | Principle XII restricts subscription paths | Tiers 1 and 3 are subscription paths; Tier 3 ships refused for every provider | Decision 6; known tension 3; DP-020 | **Not observable**: stubs hold no login | |
| DV-004 | Default proposer `dsh`, default critic `claude` (028 FR-021; B-0013, B-0014, B-0038). Lisa: Opus for both (002 FR-006) | Wave 1 default: Claude as proposer and as critic, on different model tiers | Decision 13; known tension 4 | Every fixture names both roles. One fixture tests the defaults: **waiver** | |
| DV-005 | A quota failure counts as a provider error: proposer exit 7, engine exit 4 with `proposer_consecutive_errors` (B-0594, B-0131, B-0147); mixture-of-loops relaunches it (011 FR-021; B-2496) | Quota pause: the run waits alive and spends no budget. `proposer_consecutive_errors` is transient only for other error classes. At the wait ceiling the run stops with a new stop reason (C-23) | Decision 8; known tension 5; DP-028 | **Not observable** in the parity suite: stubs emit no quota signal, so consecutive errors take the old path (R18 O-11). Quota pause has its own tests | |
| DV-006 | State under `<workdir>/.specstride/features/<slug>/` (028 DM:Feature); `.mixture-of-loops/` beside the launcher (B-2497, B-2664); pipeline run under `runs/<id>/` (011 FR-012); `.lisa/` | One layout per workdir, defined by feature 100, with a control plane outside the proposer's write scope | Decision 3; known tension 6; C-15 | **N-01**, **N-02** (layout table) | |
| DV-007 | Event names and shapes of the v1 JSONL stream, string-typed from Bash, with duplicate keys and two `run_stop` writers (028 C:events; B-0086; D-25, D-26, D-39); `[DIGEST]` and `[MOL-*]` lines (011 FR-023) | One typed event schema `specstride.event`. The old vocabulary is a compatibility projection in `events.legacy.jsonl` | Decision 11; known tension 6; C-06 | **N-12**, **N-13**, **N-14**, **N-20**: the projection is compared, not the primary stream | |
| DV-008 | The launch bundle holds `launch-contract.json`, `runtime.py`, `contract_lib.py`; the launcher carries a hash of its own content (011 FR-009, 011 FR-010; B-2547, B-2549) | The launch bundle holds TypeScript artifacts, so content hashes cannot match | Decision 1; known tension 7 | **N-11** (self-consistency asserted, value replaced), **N-10** for hashes over paths, **N-16**, **N-17** | |
| DV-009 | Default mode `generate`; modes `generate`, `run`, `auto`; mode chosen from the request's prose (011 FR-017; B-2751, B-2757) | `specstride-run` launches by default. Modes `run` and `dry-run`. `generate` → `dry-run`; `run` and `auto` → `run`. An optional comment steers and cannot bypass a check | Decision 18; known tension 8 | **Mapped** through the mode map. The case "no execution phrasing" is a **waiver**: reference `generate`, port `run` (R18 O-11; FX-36) | |
| DV-010 | Every pass is a fresh process with no carried session (028 FR-018; B-0761) | Passes inside one phase attempt may continue a session where the harness supports it, within R24's drop rules. A new phase attempt, a relaunch and every critic call start fresh | Decision 22; known tension 8; DP-035, DP-036, DP-016 | **Off.** The comparator also asserts from the stub transcripts that no invocation carried a continuation argument | |
| DV-011 | The attempt counter, the MALFORMED streak, the pass index and the breakers start again in every process (B-0306); an archive collision gets `-<run-id>` (028 FR-007; B-0292); long-job and yield file names carry the run id for the same reason (B-0353) | Counts and phase attempt numbers continue across a resume or relaunch. A flag resets them on purpose. The suffix rule stays for collisions (C-14) | Decision 23; known tension 8; DP-053 | **Off**: resume fixtures pass the reset flag (FX-13). Surviving counts get characterization tests | |
| DV-012 | No inner layer. A default run is the classic loop | The micro-loop layer is on by default | Decision 21; known tension 9 | **Off** for the parity suite. A second suite runs every fixture with the layer on and stub agents that never complete a unit of work (R18 O-10) | |
| DV-013 | A clean pass under 180 s with no phase evidence and no yield counts as short; after 2 the next prompt carries the nudge (B-0540, B-0541, B-0558). A yield leaves the counter untouched | A pass that ends at a valid checkpoint leaves the counter as it was (R23v IR-48) | Decision 21; known tension 9 | Reachable only with the layer on and a declared unit of work: **not observable** in either suite; own tests | |
| DV-014 | At most `MAX_ITER` passes per phase attempt, default 30 (B-0040); a satisfied yield gives its iteration back (B-0775) | A pass with a valid checkpoint and a changed tree gives its iteration back and spends one cycle of the layer's own cap (R23 IR-23) | Decision 21; known tension 9 | As DV-013. The second suite asserts equal counters (R18 O-10 item 4) | |
| DV-015 | The repeat-stall watchdog kills a pass that repeats a command 12 times; commands are ignored by name only (B-0491, B-0492, B-0602) | The exact argv of the inner check set are exempt from the process-level counter; the tool-level counter is unchanged | Decision 21; known tension 9 | As DV-013 | |
| DV-019 | The prompt lists "the critic snapshot that does not expand globs" as a defect | **No divergence.** The baseline expands globs (B-0954, B-0955) and the port reproduces it | Known tension 10; DP-007; C-17 | **None needed.** FX-25 compares the wildcard line as it is. A waiver returns only if the reference is pinned before `d6dab74` | |

### 6.3 Fields that differ in the layer-on suite

These are the only surfaces the second suite may remove before it compares (R18 O-10). Under R23v
IR-52 the list is complete: with no unit of work declared, the layer executes nothing else. An entry
that matches nothing fails the suite.

| Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-016 | No such events | Events `strategy.selected` and `microloop.inert` (catalogue of feature 111, F111-FR-050) | Decision 21; R23 F-18 | Layer field, by name. In the parity suite the events project to nothing (N-12) | |
| DV-017 | No such fields | Run record fields `loop.strategy`, `loop.level`, `loop.manifest_hash`, and the saved-settings keys of the same names | Decision 21; R23 F-18 | Layer field, by name | |
| DV-018 | The final line of a run is the digest (011 C:output-lines) | A `[LOOP]` line before the digest, and the strategy in the status line | Decision 21; R23 F-18 | Layer field, by name. In the parity suite see DV-034 | |
| DV-020 | The pass prompt has five blocks in a fixed order (B-0764); one budgeted block, `yield_contract`, protected by default (B-0076, B-0296) | The layer adds a protected **checkpoint contract block** to the pass prompt. Values derived from the prompt differ with it: size, hash, and `prompt.block_dropped` or `prompt.block_protected` events when the budget is tight (catalogue of feature 111) | Decision 21; DP-039; R23v V-19 items 1 and 3 | Layer field, by name: the block, and the prompt-derived values. N-24 compares the rest of the prompt in full | |
| DV-052 | No check manifest; no fingerprints | Files in the control plane that exist only with the layer on: the check manifest `phase:<N>:manifest` with the record of its derivation and the pins it holds (annex D §D.8), and the fingerprints of the protected set `phase:<N>:protected-set` (F116-FR-004). The task list as read at launch, `run:<runId>:task-list`, is written in every run and is not covered | Decision 21; R23 IR-08; R23v V-19 item 7 | Layer field, by logical name in the layout table (N-02) | |

### 6.4 Pending decisions whose default changes as-is behaviour

| Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-021 | `resume` exits 1 when the lock is held and when no saved settings exist (028 FR-016; B-1494 to B-1496). No check of the spec hash | 5 lock held; 3 nothing to resume; 3 when the spec hash changed | C-03 | **Mapped**: exit-code map for `resume` (1 → 5, 1 → 3). The spec-hash refusal has no reference: own test | |
| DV-022 | Workdir lock by `flock`, released by the kernel and held by the whole process tree (028 FR-004; B-0161, B-0061); `mkdir` fallback never released (B-0251); pipeline run lock by `fcntl.flock` (B-2588) | One directory lock on every platform, with kernel-backed liveness, reclaim by rename, and the process group tracked (C-04) | DP-005; R2v | Exit 5 and exit 24 on a second run are compared (FX-11, FX-35). The lock's file form is **mapped** per OS (N-02; R18 O-9). Stale-lock and orphaned-child fixtures: **waiver** | |
| DV-023 | An install-root `.env` is sourced as shell code and fills unset variables (B-0156, B-0233); it may hold keys in clear | Not read. User configuration takes its place. An inline secret is a configuration error | Decision 9; DP-058; R16 DR-cfg-01 | **None needed**: the reference archive holds no `.env` (R18 O-1). A fixture that tests the layer is a **waiver** | |
| DV-024 | `resume` turns the saved `last-run.conf` into flags, so saved values beat the environment (B-0257; `specstride:592-626`); six settings are not saved (B-0260); a failed write is ignored; saved timeout overrides an exported one (D-35) | A run snapshot with provenance per key. On resume: pinned keys rank below flags and above the environment; tunable keys rank below the environment. A failed snapshot write is a launch error | DP-058; R16 DR-cfg-02; decision 23 | Pinned keys: equal, compared (FX-13). Tunable key set in the environment on resume, a setting that today is not saved, and a failed write: **waiver** each | |
| DV-025 | A learned pass ceiling beats the global `--proposer-timeout` flag and loses to a per-phase setting (B-0302, B-0303) | Kept as it is, and recorded as a named place in the order | Decision 9; R16 DR-cfg-03 | **None needed**: same as today (FX-29) | |
| DV-026 | The launch contract strips the learning mode from the environment of every child and forces `off` unless the stage declares it (011 FR-016; B-2561); it forces `--no-live` when color is never | Kept, as a rule: a key marked as pinned by the launch contract takes the contract's value. It is the only rank above flags. It is a named exception to decision 9 | Decision 9; DP-058 | **None needed** for the two keys of today. The rule is **off** for any other key | |
| DV-027 | Settings are environment variables named per harness and role, for example `SPECSTRIDE_CLAUDE_CRITIC_MODEL` (R16 F5.10); flags per setting | Config keys `roles.<role>.*` and `harnesses.<id>.*`; a generic `--set`. The as-is variable names stay as aliases | Decision 9; R16 | **Mapped**: alias table, part of feature 100's normalization contract (R18 O-2) | |
| DV-029 | Approval is an empty file `GATE<N>-APPROVED`, written without an atomic rename, inside the proposer's write scope (028 FR-006; B-0875); resume trusts its presence (028 FR-003; B-0271); a critic exit 0 without the file is a rejection (B-0323) | An approval record in the control plane, bound to the verdict, the phase evidence hash, the verification result and the tree fingerprint; resume verifies it | DP-010; R11 T-02; R23 IR-02 | Existence is **mapped** by the logical name `gate:<N>:approved` (N-02). Content: **waiver** by surface. A fixture with a planted marker: **waiver** | |
| DV-030 | The engine and the proposer set `IS_SANDBOX=1` themselves when run as root (B-0067, B-0497); every pass runs with no containment | Containment level C2 where the harness offers it, else C1; C0 only by opt-in in user configuration. The runtime never asserts a sandbox | DP-008; R11 T-07 | **Off**: containment is set to today's behaviour. The environment variable names the stub saw are compared in the transcript | |
| DV-031 | Claude proposer argv: `-p --dangerously-skip-permissions --verbose [--disable-slash-commands] [--output-format stream-json] [--model M]` (B-0689, B-0740, B-0534) | Accept-edits permission mode with an allow list and no prompts; customisations off; the mode always stated | DP-011, DP-012; R5 | The stub transcript records argv. **Mapped** through a per-harness argv table owned by the harness adapter, or **off** with DV-030 | |
| DV-044 | The oscillation detector reads only feedback files modified since this run started, so a resume opens a new window on purpose (B-0289; `orchestrator.sh:1323-1325`) | The window is keyed by phase attempt sequence, so carried counts do not make the first rejection after a resume look like oscillation | Decision 23; DP-037 | **Off** with DV-011 (the reset flag restores the as-is window). FX-04 compared | |
| DV-045 | The proposer prompt carries every inherited verification obligation as one line each (B-1117); the block is 193 KB of 275 KB in phase 12 of the reference run (R12) | An index plus a ledger the runtime writes | DP-019; R12, R24 | **Off.** N-24 then compares the prompt in full | |
| DV-046 | The proposer loop ends the instant phase evidence exists (B-0592); Principle I | With the layer engaged, the runtime runs the inner check set once more before the phase gate, within the cycle cap | DP-041; R23 IR-05 | **Off** in the parity suite. In the second suite it cannot run: no unit of work is declared (R23v IR-52) | |
| DV-047 | Harness-native memory is whatever the harness loads; the baseline passes no flag about it | Off for the critic always; off by default for the proposer; recorded per run | DP-017; R12 | Changes argv: handled with DV-031 | |
| DV-048 | No terms gate. Any registered harness runs with whatever login or key it finds | A terms gate per audience. `distributed` is the package default, with Tier 2 default for three providers; a provider with no terms row runs at Tier 1 or Tier 2 with a doctor warning | Decisions 6, 17, 19; DP-042, DP-057 | Fixtures declare audience `personal`: **none needed**. Refusals have own tests | |
| DV-049 | The critic is the configured one or the built-in default (B-0014) | With no critic configured, a qualifying discovered harness may be picked, announced at launch, with a mandatory spend cap | Decision 17; DP-025 | Every fixture names the critic: **not observable** | |
| DV-050 | The model of a pass is the configured one | After repeated deterministic failure a pass may move to a stronger model tier of the same harness, capped at 1 per unit of work and 2 per phase attempt | Decision 20; DP-031, DP-032 | **Off** | |
| DV-051 | A yielded job and a long job are left running until they end or a deadline passes, whatever their output shows (B-0590, B-0591; D-30) | A first-failure predicate ends the wait, and stops a job that the runtime launched and that declares it (R23v IR-51) | DP-054; R23, R27 | **Off** | |
| DV-053 | — (new) | In a run whose verification gate does not execute (mode `plan` or `off`), the layer is off and the fallback is announced with the reason `gate-not-executing` | Decision 21; DP-045; R23v IR-34 | The second suite runs those fixtures with the classic loop; the announcement is a layer field | |
| DV-054 | The launcher is a generated Bash script that executes `runtime.py` (011 FR-010; B-2549) | A generated file with a Node shebang. The Language Ledger is empty at the start of Wave 1 | Decision 2; DP-043; R2v | **N-17**: compared as a logical record, not as text | |
| DV-068 | No project configuration file exists. An install-root `.env` may set anything | Project `specstride.yaml` may narrow a run and never widen it; a widening key is ignored with a launch message and a doctor warning | Decision 9; DP-009; C-24 | **None needed**: no reference behaviour. Own tests | |
| DV-069 | The baseline captures no prompt or response content in telemetry. (One commit past the baseline, in another tree, does) | Superseded by DV-083: the owner ruled that content is captured whenever traces are on | DP-029; owner ruling 43 | See DV-083 | Changed 2026-09-29 (ruling 43) |
| DV-070 | `child-exit=None`; Python `repr` in `[MOL-RELAUNCH]` (B-2611, B-2746) | **No divergence** by default: reproduced byte for byte in compatibility output | DP-060; C-31 | **N-19** compares them as written. If the owner rules for clean output: two waivers | |

### 6.5 Greenfield state and superseded legacy compatibility

| Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-035 | Each product reads the state its earlier runs left: `.specstride/`, `.mixture-of-loops/`, `.lisa/` | None of them is read. Old runs are finished with the old tools | Decision 3 | Every fixture starts from an empty state. **None needed** | |
| DV-036 | `wiggum` command alias; `WIGGUM_*` variables copied to `SPECSTRIDE_*`; `.wiggum/` used when `.specstride/` is absent; one deprecation line each (B-0004 to B-0007, B-0234, B-0346, B-0354, B-0355, B-0360, B-0376 to B-0378) | Not carried | Decision 3 | **N-28**: not compared; the B-items are `superseded` | |
| DV-037 | Three migrations of a pre-v2 layout into `features/default/`, and the event `gates_migrated` (B-0084, B-0193, B-0252 to B-0255, B-0272) | Not carried | Decision 3 | **N-28** | |
| DV-038 | mixture-of-loops normalizes legacy `wiggum` spellings with a warning (011 FR-027) and strips `WIGGUM_LEARNING` (B-2493, B-2561) | Not carried. The stripping of the current learning variable stays (DV-026) | Decision 3 | **N-28** | |
| DV-039 | `resume` tolerates saved settings written by older versions that lack keys (`specstride:596-622`) | Not carried. A snapshot names its schema version; an unknown one is refused | Decision 3 | No fixture holds an old file. **None needed** | |
| DV-042 | Lisa: verbs recognized but not implemented exit 1 (002 FR-004); `status` says RUNNING whenever the lock directory exists (002 FR-017) | 028's front door: the verbs exist; `status` probes the lock | Merge rule; C-16 | No characterization test is carried for the Lisa side | |
| DV-043 | Lisa launch defaults: verification `off` (002 FR-006) | 028's default `required` (028 FR-020) | Merge rule; C-01 | 028 side compared (FX-14). No characterization test for the Lisa side | |
| DV-040 | Lisa calls the critic first and verifies after an APPROVED (002 FR-009) | 028's order: verification gate before the critic (B-0319, B-0320) | Merge rule; C-01 | As DV-043 | |

### 6.6 Other intended differences

| Id | As-is behaviour (origin) | New behaviour | Decision behind it | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-028 | The pipeline runtime reads the engine's process exit code and the newest `run_stop.reason` (011 FR-015, 011 FR-021) | It reads `{exit_code, stop_reason}` from the engine's terminal record. A launch check reports a held workdir lock before launch | C-05; depends on R15 | Same values: compared (FX-35, FX-36). The new launch check: own test | |
| DV-032 | Grounding honours a cited path inside the workdir, the state directory included (`lib/critic.py:838-841`) | Grounding refuses, by real path, the control plane, the checkpoint outbox, the carry-over files, the event stream and everything under `.git` | Decision 21; C-28; R23v IR-45 | Applies with the layer on and off. A fixture whose phase evidence cites a state path: **waiver** (FX-25) | |
| DV-033 | `[MOL-*]` lines carry the old product name, repeat absolute paths, and `[MOL-HOLD]` is printed on every unchanged poll (011 FR-023; B-2742, B-2744, B-2745) | Two output modes. Compatibility output reproduces the lines. Default output is terse and uses `[SPECSTRIDE-*]` | Decision 16; C-06, C-31 | **N-20**: the oracle runs the port in compatibility output | |
| DV-034 | The reference prints no line the new product adds | New lines, `[LOOP]` included, are never written to a stream that is compared with the reference | Decision 21; C-31 | The rule is settled (ruling 68; F100-FR-176): under the `parity` profile no line without an as-is equivalent is emitted. What the second suite compares remains CQ-028; where it compares default output, DV-018 applies | |
| DV-041 | Lisa doctor: 0, 2 on any finding, 1 (002 C:cli). mixture-of-loops: `onboard-skill --check` exits 5 or 6 | 0, 1, 2, 3; a warning exits 0 | Decision 14; C-21 | No reference in 028 or 011. Characterization test of the new codes | |
| DV-055 | The mode is stored in `harness-run.json` and printed in `[MOL-LAUNCH] mode=`; no code branches on it (B-2765). The relaunch budget lives under `configuration.auto` for both modes (011 FR-022; B-2518) | The field stays in the compatibility projection with the mapped value. The key is renamed `configuration.relaunch` | Decision 18; D-31 | **Mapped**: mode map; key name map in the launch contract comparison | |
| DV-056 | `bin/onboard-skill` links the skill directory into five named hosts (011 FR-025; B-2642 to B-2653) | Plugin installation per host. No closed list of hosts or harnesses | Decisions 13, 17, 19 | No differential test is possible. FX-37 is retired with a **waiver** | |
| DV-057 | pytest, unittest, shellcheck and a CI matrix on Python 3.10 to 3.13 (028 FR-030, 028 SC-008, 011 SC-001); merge automation (011 SC-002, `dropped`) | TypeScript tests, the oracle, CI on Linux and macOS | Decisions 1, 4, 12 | No differential test is possible | |
| DV-058 | Two shippers, Loki and OTLP, off by default, with default addresses (028 FR-022; B-0025, B-0027, B-0041, B-0042); OTLP delivery never shows as delivered (D-40) | One OTel exporter; metric and attribute names `specstride.*`; off by default | Decision 11; R14 | **N-26** at the stub sink. Metric renames and the delivery status: **waiver** (FX-31) | |
| DV-059 | The launch contract's JSON Schema is looser than the hand-written validator (D-13) | One schema that is also the validator | R19 D-13 | The validator's behaviour is the reference (FX-33). The schema file is not compared | |
| DV-060 | mixture-of-loops parses `tasks.md` with its own grammar, which knows only `## Phase N:` headings (D-32) | The one grammar owner of Principle IV | 028 FR-029; R19 D-32 | The inventory output is compared (FX-32). A `tasks.md` the old parser could not read: **waiver** | |
| DV-061 | `specstride-digest.sh` (B-0338 to B-0345); `MOL_VIA` reminder (011 FR-026; B-2492); five launch contract keys with no reader (D-12) | Not carried | Decision 16; R19 D-03, D-12, D-14 | Not compared. Each is `dropped` with a written justification | |
| DV-062 | `specstride phases` writes `/tmp/specstride-spec-err` (B-1513), against 028 FR-023 "read-only" | No fixed temporary file | R19 D-24 | **N-08** covers temporary names; the file lies outside the compared tree | |
| DV-063 | Lisa's budget ledger loads as zero usage when it cannot be read (002 FR-042) | An unreadable ledger never resets spend | Decision 8; R19 D-33 | Lisa side only: characterization test of the fixed behaviour | |
| DV-064 | One registry with a closed list of entries; control flow tests harness names in places (028 FR-021; B-0689 to B-0697) | One open harness registry: tested harness adapters, harness descriptors, consumer-declared entries | Decision 17 | Fixtures use stub executables named after as-is commands, and one generic name for a descriptor-driven harness (R18 O-3). Unknown-name messages: **N-15** | |
| DV-065 | Behaviour of the interpreters: `python3 required` exits 1 (B-0118); argparse usage text; tracebacks; bytecode caches | None of it exists in a Node product | Decision 1 | **N-18**, **N-25**. B-0118 is `superseded` | |
| DV-066 | Messages and records name implementation files: `orchestrator.sh:`, `proposer.sh:`, `generated_by.tool`, `ORCHESTRATOR=` in the saved settings (B-2488) | Logical component names | Decision 1 | **N-15**, **N-16** | |
| DV-067 | A phase blocked on a human decision loops until a breaker fires, and on the structured path the no-progress breaker never fires (B-0784; D-44) | A `blocked` event with its reason; the run stops under an existing stop reason | C-12; Principle VIII (draft v3) | The event projects to nothing (N-12). The stop is as-is where the breaker fires. Other paths: own tests | |
| DV-071 | On a system without `flock`, `setsid` and `/proc`, the Specstride reference does not run (R18 F-23). **`unverified`** | The port runs on macOS with the same behaviour as on Linux | Decision 12; DP-006 | The port on macOS is compared with the Linux capture plus per-OS expectations (R18 O-9). Every expectation is `inferred` | |
| DV-072 | Runtime-written files are not all written atomically (B-0875) | Temporary file, then rename, for every file the runtime writes (002 FR-013) | Merge rule: Lisa wins where 028 is silent | **Not observable**: captures are taken after the run | |
| DV-073 | An explicit spec format `openspec` exits 3 (B-1999) | Accepted as an alias of `openspec-change` | C-07 | One fixture: **waiver** (FX-10) | |
| DV-074 | A relaunch is decided by `supervise observe` in the host session, from an observation of a terminated launcher; every refusal is named (011 FR-021, 011 FR-022; B-2496, B-2675, B-2746). A crashed engine is not relaunched | With `relaunch.owner: root` (the default) the runtime root stays alive after a failed stage and decides from a second classifier table, which has a row for a crashed engine; `[MOL-RELAUNCH]` is projected from the root's event. With `relaunch.owner: supervise` the behaviour is as today | Decision 5, aim 3; DP-072, DP-080; R15v B-1 | **Off**: the `parity` profile sets `supervise`, so FX-35 and FX-36 compare as they are. The root's table has its own tests | |
| DV-075 | One lock per pipeline and one per workdir; a second pipeline on a held workdir ends with pipeline exit 22 and child exit 5 (011 FR-012; B-2588; 028 FR-004) | One workspace lock, taken by the runtime root and handed down as a lease; a second pipeline on a held workspace ends with 24 at launch. A foreground `specstride run` on a held workspace ends with 5 as today | DP-073; C-05; R15 Q2 | One fixture of FX-35: **waiver**. Every other lock fixture compares as it is | |
| DV-076 | The verification gate and the grounding pass take no fingerprint of the tree | The protected set is fingerprinted before and after every verification gate command and around the grounding pass; a difference is a fact row in the critic prompt (R23v IR-31). Independent of the micro-loop layer | Decision 21 (gate integrity); R23v V-01; R27 D1.1 | **Off** under the `parity` profile. With it on and no difference found, no output changes; the fact row has its own tests | |
| DV-077 | A phase starts from whatever the tree holds; edits between an approval and the next phase entry are not noticed | The tree at phase entry is compared with the approved tree of the previous phase; a difference is a fact row for the critic and never blocks (R23v IR-33) | R23v V-02; R27 | **Off** under the `parity` profile; own tests | |
| DV-078 | A relaunch derives the verification plan again and nothing compares it with the earlier one | The check manifest derived on a relaunch is compared with the stored one; a difference is a fact row for the critic (R23v IR-54) | R23v; R27 | **Off** under the `parity` profile; own tests | |
| DV-079 | The attempt planner runs the recovery cycle only: diagnostician on a new signature, accelerator when due (028 FR-010 to FR-012) | Option, off by default: after K rejections by the critic the next phase attempt runs on the next model tier of the same harness | Owner ruling 48; DP-033; R25 | **Off** under the `parity` profile; own tests and an ablation arm | Approved 2026-09-29 (ruling 48) |
| DV-080 | Units of a phase are worked one after the other | Option, off by default: tasks marked `[P]` with declared, disjoint write scopes run in parallel worktrees; a deterministic merge check and the full verification gate run on the merged tree before the critic. Independent verification commands may also run concurrently | Owner rulings 56, D2; DP-034; design in R29 | **Off** under the `parity` profile; own tests; experiment E6 | Approved 2026-09-29 (ruling 56) |
| DV-081 | Every critic path is tool-less; the Codex critic is reached by direct HTTP (B-0981) | A harness critic may hold read-only tools inside an operating-system sandbox and run in the working tree, with the proposer's notebook, handoff and outbox moved out and the workspace part denied | Owner rulings 57, 57a, D1; DP-001 | **Not observable**: the stub critic serves both forms and the transcript is compared in transport-neutral form | Approved 2026-09-29 (rulings 57, 57a, D1) |
| DV-082 | Plan staleness is checked when the critic starts, and is fatal (exit 3) | The hashes of spec, plan and tasks are checked at launch, at resume and at every pass start; a change stops the run with the blocked-on-human signal and names the file | Owner ruling K3; R28 | **Off** under the `parity` profile, where the check happens at critic start as today; own tests | Approved 2026-09-29 (ruling K3) |
| DV-083 | The baseline captures no prompt or response content in telemetry (028 C:events; the telemetry payloads compared by N-26). The OTel work tree, one commit past the baseline, puts prompts on spans whenever traces are on | Content is captured whenever traces are on, through the single redaction point, and can be switched off | Owner ruling 43; DP-029 | **Off** under the `parity` profile, so that the payloads at the stub sink compare with the baseline's (FX-31, N-26); own tests, with planted canaries for the redaction point | Approved 2026-09-29 (ruling 43) |
| DV-084 | The engine makes one commit per approved phase in the project's repository and no other (028 FR-013) | With parallel units on, the runtime also makes snapshot commits in its own tree store, outside the project's repository: fixed author, date and message, never a parent of a project commit, never pushed, removed with the run | Owner rulings 50, 56, P1; R29, R29v O-1 | **Off** under the `parity` profile; the project's `.git` is asserted byte-identical in the option's own tests | Approved 2026-09-29 (ruling P1) |
| DV-085 | Only the proposer writes the working tree and ticks tasks through the spec module after approval | With parallel units on, the runtime applies the merged delta of a group to the workspace (forward only, audited paths only, never undone, nothing under `.git`) and ticks the merged tasks. Rule IR-60 is amended to name both acts | Owner rulings 50, 56, P1; R29v O-2 | **Off** under the `parity` profile; own tests | Approved 2026-09-29 (ruling P1) |
| DV-086 | Files carry the modification times the proposer's writes gave them, and the grounding snapshot shows them (Principle III) | With parallel units on, the files of a merged delta carry nearly the same modification time, which can hint that a parallel group ran. Accepted as a named leak; the application does not set times | Owner rulings 53, P9; R29v V-23 | **Off** under the `parity` profile (the option is off) | Approved 2026-09-29 (ruling P9) |
| DV-087 | Before its first pass of an attempt the proposer pass loop spends about 9 minutes of CPU in shell code whose cost grows with the square of its input (`proposer.sh:1807`; R28, measured at 548 s) | Fixed: the same result is computed in time that grows with the input. No output changes | Owner ruling K7; R28 | **None needed**: durations are normalized (N-05) and no output differs | Approved 2026-09-29 (ruling K7) |
| DV-088 | No such events or fields | With parallel units on: the named fields of the layer `parallel` in the run record and the `[LOOP]` line, and the envelope fields `workerId` and `wseq` | Owner ruling 56; R29, R29v | Layer field, by name; **off** under the `parity` profile | Approved 2026-09-29 (ruling 56) |
| DV-089 | Grounding honours any cited path inside the workdir (B-0954 and neighbours) | Grounding also refuses the worker roots and the tree store, as it refuses the control plane | Owner rulings 22, 56; R29 PU-62 | **Not observable** in the parity suite: no fixture cites such a path; own tests | Approved 2026-09-29 |
| DV-090 | The prime critic is called in text mode (Specstride at `9cab15d`) | Outside the `parity` profile the prime critic runs in JSON mode, so that its terminal record decides, since the process exits 0 on a provider error | Owner ruling 32b; R9 | **Off** under the `parity` profile; own tests | Approved 2026-09-29 (ruling 32b) |
| DV-091 | Tasks and spec may change while a run is alive; the change is noticed when the critic starts | `resume` with an explicit flag accepts an intended change: it derives plan and manifest again, records the new hashes and keeps counts and delivered evidence. A dsh plugin install writes to the real home only for plugins in the consumer's allowlist (as today, B-items of `dsh_plugin_requests`) | Owner rulings P12, P15 | The flag has no reference: own tests. The plugin allowlist compares as it is | Approved 2026-09-29 |
| DV-092 | The proposer's notebook is the required first read of a pass, and the runtime writes no handoff and keeps no ledger (Specstride at `9cab15d`) | The runtime keeps a ledger and writes a handoff at every pass start, which the proposer's prompt names (`architecture.md` section 9, technique 4) | Decisions 22, 23; R24, R27 | **Off** under the `parity` profile; own tests | Approved 2026-09-29 with `architecture.md`; row written in Stage B for feature 100 |
| DV-093 | A pass is ended by a termination signal | A polite stop: an interrupt first, then a termination after a grace period (`architecture.md` section 9, technique 8) | R27 | **Off** under the `parity` profile; own tests | Approved 2026-09-29 with `architecture.md`; row written in Stage B for feature 100 |
| DV-094 | The proposer's prompt has five blocks in a fixed order | Stable blocks come first, and the start of the prompt is byte-stable inside a phase attempt (`architecture.md` section 9, technique 6) | R24, R27 | Under the `parity` profile the as-is block set and order are used, and N-24 compares the prompt in full; own tests | Approved 2026-09-29 with `architecture.md`; row written in Stage B for feature 100 |
| DV-095 | The baseline redacts only in stream events, by whole key names and four value patterns | The port redacts all outside text with a wider pattern set: more key-name suffixes, private-key blocks, JWTs, cloud key ids, URLs with credentials, more provider prefixes | Owner ruling 43; R11 F-12 | **None needed**: a test asserts that no fixture text matches a widened-only pattern; own tests and the canary test | Row written in Stage B for feature 111; put to the owner in the clarification round |
| DV-096 | The host reads every source and writes the stages and the coverage by hand (mixture-of-loops at `9c88f86`) | The CLI inventories and pages judgment items of at most 3,000 tokens; the host answers with choices; a host without a model may delegate to a harness named in user configuration, recorded in the digest | DP-023, DP-086; owner ruling 64 | **Not observable**; own tests | Row written in Stage B for feature 107; put to the owner in the clarification round |
| DV-097 | The launch contract has no comment and no verification mode | The launch contract holds `configuration.comment` (hash and what changed), `configuration.verification` (derivation prefers `required` and states why), and declared scopes, reads and writes | Decision 18; owner rulings 40, 56 | Not compared; own tests | Row written in Stage B for feature 107; put to the owner in the clarification round |
| DV-098 | A job started by a yield is left running after a stop, and nothing adopts it (Specstride at `9cab15d`) | The job is `adoptable`: it survives `stop` and `stop --now`, and the next engine start adopts it with the remaining deadline | `architecture.md` section 4; R15v C-6, P-2 | **Not observable** unless a fixture resumes after a stop inside a wait; own tests | Row written in Stage B for feature 118; put to the owner in the clarification round |
| DV-099 | A critic prompt that is still over the window after shrinking is sent anyway, with a note on standard error (B-0922) | By default the call is not made; the outcome is `context_window_exceeded`, scored as a failed critic call | Brief 117; Principle IX | **Off** under the `parity` profile (value `send`); own tests | Row written in Stage B for feature 117; put to the owner in the clarification round |
| DV-100 | The critic prompt holds rules, spec section, phase evidence, grounding snapshot and optional design context, with no data boundary | Text from outside the runtime stands inside boundaries with a per-call token; the fact block has a slot before it; marker lines are removed | R11 R-5; owner rulings 44, 53 | **Off** under the `parity` profile (block set `as-is`); N-24 compares the prompt in full; own tests | Row written in Stage B for feature 117; put to the owner in the clarification round |
| DV-101 | No pass that did nothing is flagged: no stream format opts in to `no_activity` (Specstride at `9cab15d`) | A success terminal is flagged `noActivity` when no tool call and no write of phase evidence was seen | Principle XI | **Off** under the `parity` profile; own tests | Row written in Stage B for feature 126; put to the owner in the clarification round |
| DV-102 | Stream lines have no cap on size or rate | A line over the cap is dropped and a `stream.diagnostic` event is written | R11; Principle V | **Off** under the `parity` profile; own tests | Row written in Stage B for feature 126; put to the owner in the clarification round |
| DV-103 | An invocation is recorded only for structured passes; passes on the legacy path are never finalized (B-0781) | Every pass has an invocation record and a result | R14 EV requirements; X0 (cost counted for every pass) | **Off** under the `parity` profile; own tests | Row written in Stage B for feature 126; put to the owner in the clarification round |
| DV-104 | A role name that the registry does not hold is not refused at start: every pass ends with 127 and the loop runs until a breaker ends it; a critic call is scored MALFORMED with exit 10 (B-0575, B-0996) | Role resolution refuses the launch and lists the harnesses of the registry | Decision 17; R15v B-3 | **Off** under the `parity` profile; own tests | Row written in Stage B for feature 124; put to the owner in the clarification round |
| DV-105 | Any non-empty value of the learning mode other than `off` turns the layer on (observe, evaluate, tamper bracket) without applying anything | A value that is no member of the closed set is read as `off` | F100 annex X §X.6 row 77; LR-11 | **Not observable**; own test CT-106-3 | Row written in Stage B for feature 106; put to the owner in the clarification round |
| DV-106 | A critic model that is not in the table gets a context window of 128,000 (B-0910) | A model whose window is not known does not qualify as critic and gets no default window | Principle IX; decision 17 | **Off** under the `parity` profile, where the fallback applies; own tests | Row written in Stage B for feature 131; put to the owner in the clarification round |
| DV-107 | Every shipped `api_request` carries `result_preview`, 300 characters of model text, unredacted (Specstride at `9cab15d`) | The field is sent only while content capture is on, and redacted; under the `parity` profile capture is off and the field is absent | Owner ruling 43; DV-083 | **Waiver** on FX-31 for the absent field; own tests | Row written in Stage B for feature 128; put to the owner in the clarification round |
| DV-108 | A proposer prompt is handed to dsh as one argument of any size | Outside the `parity` profile: one argument up to 120 KiB, otherwise split at spaces into chunks, none of which starts with a dash; a token over the limit fails the pass | Principle VIII (an adapter that takes the prompt as an argument bounds its size) | **Not observable**; own tests | Row written in Stage B for feature 130; put to the owner in the clarification round |
| DV-109 | A fixed table maps bare model ids to providers; one target is specific to the owner's machines | One built-in row, `glm-` to `zai`; every other row comes from user configuration | Decision 19 (nothing specific to the owner's machines); DV-064 | The fixture supplies the rows | Row written in Stage B for feature 130; put to the owner in the clarification round |
| DV-110 | The dsh critic has no check of version or tool coverage and runs in the working directory the engine hands over | Under the value `strict` the critic is refused unless the version equals the pin and every exposed tool id is covered by the deny list, and it runs in an empty directory | Principle IX; R9 | **Off** under the `parity` profile (value `none`); own tests | Row written in Stage B for feature 130; put to the owner in the clarification round |
| DV-111 | A critic on dsh with an unknown model gets a default window of 98,304 tokens | No default: the critic needs a known window, and the smaller of the declared and the effective window is used | Principle IX | **Off** under the `parity` profile, where the default is kept; own tests | Row written in Stage B for feature 130; put to the owner in the clarification round |
| DV-112 | No variable that switches the harness's own telemetry off is set for prime | Every process started for prime carries the telemetry switch of the dialect and the do-not-track variable | Brief 138; owner ruling 37 | **Waiver** on the surface `transcript` for the two variable names, in the scenarios of FX-01, FX-06 and FX-26 in which the prime stub is started (in the prime scenarios of FX-18 the pass fails before the harness starts, so a waiver there would match nothing) | Row written in Stage B for feature 138; put to the owner in the clarification round |
| DV-113 | A verification command runs with the environment of the process, overlaid with the `env` the command declares (B-1120) | The environment is an allow-list that holds no provider credential, overlaid with the declared `env` | R23 IR-10; R11 T-21 | **Off** under the `parity` profile, because the surface `transcript.verification` records the names of variables; own tests | Row written in Stage B for feature 105; put to the owner in the clarification round |
| DV-114 | With `relaunch.owner: supervise`, `supervise observe` classifies a stop from the observation of the terminated launcher and from the exit codes and reasons that the stage lists. It cannot see `retryable`, so a stop that is not retryable is relaunched where the stage lists the exit code and allows the reason (the as-is classifier of DV-074) | Table 1 reads `retryable` and the blocked reason from the terminal record. Row O-33 refuses a run that rests blocked on a human under every profile (CQ-238: no scenario of FX-35 or FX-36 ends blocked, so the compared output does not change). Row O-34 refuses a stop that is not retryable outside the `parity` profile | F100-FR-163; F123-FR-030; F123-FR-042; owner rulings 6 and 29; CQ-238; review finding B-8.2b-001 | **Off** under the `parity` profile for row O-34 only: FX-36 scenarios that end not retryable compare as they are. Own tests for the two rows | Row written in Stage B after the cross-feature review (act 8.6); put to the owner in the clarification round |
| DV-115 | A failure to append an event to the local file is swallowed, and the event is still shipped to the other sinks (B-2112) | The event writer drops the event, counts it in `event.dropped` and calls no sink: a sink receives only events that have a `seq` and are in the primary file | Annex X §X.1; F111-FR-017, F111-FR-019, F111-FR-034; F126-FR-016; review finding B-8.2d-002 | **Not observable**, confirmed by feature 141 on 2026-09-30: no fixture makes the local append fail; own test CT-126-11 | Row written in Stage B after the cross-feature review (act 8.6); put to the owner in the clarification round |
| DV-116 | The source inventory of a reverse run carries `schema_version` 1 and no field `schema` | The inventory carries `schema` with the value `specstride.reverse-inventory/1`; `schema_version` 1 stays as the as-is field | F100-FR-048; F100-FR-227; annex B §B.20; review finding B-8.2c-003 | To be confirmed by feature 141. Proposed: a normalization rule that removes the key `schema` before the inventory is compared on FX-30 | Row written in Stage B after the cross-feature review (act 8.6); put to the owner in the clarification round |
| DV-117 | A missing credential of the critic is raised inside the critic call, scored as a failed call (MALFORMED) on every phase attempt, and the run ends at the MALFORMED limit with engine exit 1 and `critic_unavailable` | The missing credential is found before the call by `preflight` and refused with engine exit 3 and `critic_config`; no count changes; the message names the credential and holds no value | Principle IX ("Auth failures are named"); 028 FR-010; CQ-187; follow-up report of feature 141 | **Off** under the `parity` profile; own test CT-101-30. The row falls away if the owner answers CQ-187 with "a failed call everywhere" | Row written in Stage B after the cross-feature review (act 8.6); put to the owner in the clarification round |
| DV-118 | The hash that ignores checkboxes replaces the mark of a task line whose id is a T-id only (mixture-of-loops `bootstrap_contract.py:44` at `9c88f86`); a tick of an OpenSpec task line (`- [ ] N.N …`) changes the hash | The rule also covers the OpenSpec task line with a dotted id (F104-FR-013), so that the engine's own tick of an OpenSpec change never makes a run stale (F104-FR-022) | Ruling K3; B-2054; R28; CQ-045 | **Not observable**: the baseline has no fixture with an OpenSpec change; own tests of feature 104 (T034, T048) | Row written after the analyze run of feature 104 (2026-09-30); CQ-045 closed 2026-09-30 |
| DV-119 | The tasks grammar of mixture-of-loops reads a lower-case `## phase N:` heading as a phase (`bootstrap_contract.py:29` at `9c88f86`) | The one grammar (Principle IV) is Specstride's, case-sensitive `## Phase N`; a lower-case heading is not a phase heading, and the inventory output comes from the canonical model (F104-FR-008) | 028 wins where the systems overlap; R19 D-32; CQ-045 | **Not observable**: no fixture of FX-32 has a lower-case heading; own test of feature 104 (T019) | Row written after the analyze run of feature 104 (2026-09-30); CQ-045 closed 2026-09-30 |
| DV-120 | The launch contract carries `schema_version` with the value `1.0`, and validation refuses another value with `schema_version must be '1.0'` (B-2488, B-2521) | The launch contract carries `schema` with the value `specstride.launch-contract/1` and no `schema_version` (F100-FR-048; annex G §G.8; F107-FR-005, F107-FR-012) | F100-FR-048; annex G §G.8; the same case as DV-116 for the inventory of a reverse run | **Mapped**: the key-name map of the launch contract (annex X §X.8) gains the pair `schema_version` and `schema` with their two values, and the message of B-2521 is compared through it | Row written after the analyze run of feature 107 (2026-09-30). The map entry of annex X §X.8 is feature 100's and still to be written |

### 6.7 Rows still to be written

| Subject | Why it is open |
|---|---|
| Integrity rules outside the layer (IR-31, IR-33, IR-54) | **Written**: DV-076, DV-077, DV-078 |
| Engine in-process or child process | **Settled by `architecture.md`**: the engine is a child of the runtime root. Proposer pass loop, critic and verification run inside the engine and return result records that carry today's code numbers (LR-6). Relaunch and the single lock: DV-074, DV-075 |
| Destination of non-code assets | **Placed** by `feature-briefs.md` and `traceability.md` section 5 |

### 6.8 Coverage check

| Required by the assignment | Rows |
|---|---|
| Known tension 1 to 7 | DV-001, DV-002, DV-003, DV-004, DV-005, DV-006 and DV-007, DV-008 |
| Known tension 8 (decisions 18, 22, 23) | DV-009, DV-010, DV-011 |
| Known tension 9 (micro-loops; three exemptions) | DV-012; DV-013, DV-014, DV-015 |
| Known tension 10 (glob expansion) | DV-019, a record row |
| Decision 3 | DV-035 to DV-039 |
| DP-005, DP-008, DP-010, DP-011, DP-012 | DV-022, DV-030, DV-029, DV-031, DV-002 |
| DP-019, DP-028, DP-037, DP-039, DP-041, DP-058 | DV-045, DV-005, DV-044, DV-020, DV-046, DV-023 to DV-027 |
| Other pending decisions that change as-is behaviour | DP-009 DV-068 · DP-017 DV-047 · DP-025 DV-049 · DP-031 DV-050 · DP-042 and DP-057 DV-048 · DP-043 DV-054 · DP-045 DV-053 · DP-053 DV-011 · DP-054 DV-051 · DP-060 DV-070 |
| Fields that differ in the layer-on suite | DV-016, DV-017, DV-018, DV-020, DV-052, and the announcement of DV-053 |
| Legacy compatibility superseded by greenfield state | DV-036, DV-037, DV-038, DV-039 |

Count: 119 rows, DV-001 to DV-119 (DV-092 to DV-113 were written in Stage B for the features, DV-092 to DV-094 for feature 100; DV-114 to DV-117 were written after the cross-feature review; DV-118 and DV-119 after the analyze run of feature 104 (CQ-045); DV-074 to DV-078 were added after R15, R15v and R27; DV-079 to DV-091 record owner rulings of 2026-09-29). DV-019 and DV-070 record that no divergence exists.

