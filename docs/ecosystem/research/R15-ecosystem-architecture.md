# R15 — Ecosystem architecture

Written 2026-09-29. Read-only work. No paid model call, no harness CLI invoked, no subagent.
Scratch: `/tmp/specstride-research/R15/` (`size.py`, a keyword count over R18's inventory file; extracts
of the other reports). This report is the **draft architecture**. The synthesis adopts or amends it and
R15v attacks it.

How to read the tags. `verified-local` means read by me at the cited line. A figure taken from another
report is cited `R<n>:<line>` or by section name, and the measurement belongs to that report.
Every design statement is `inferred`; the facts it rests on are named beside it. Baselines: Specstride
`9cab15d` (working tree of `/root/specstride`), mixture-of-loops `9c88f86` (read with `git show`), Lisa
per R1's ruling. "A locally registered backend" stands for the registry entry that is specific to the
owner's machines.

Names used here. **Runtime root**: the detached process that owns a run. **Engine**: the process that
runs the gated loop. **Control plane**: state the runtime relies on to decide something. **Workspace
part**: state the proposer produces or reads. **EP**: extension point. **Layer**, without a number, means
the micro-loop layer.

## Prior art consulted

| File | Read | Reused, extended or contradicted |
|---|---|---|
| `docs/ecosystem/research/BRIEF-COMMON.md` | in full | Template, tags, safety rules |
| `prompts/specstride-ecosystem.md` §0, §1, §2, §4 row R15, §5, §6 | in full | Decisions 1–23 are the frame. §6 is the starting decomposition |
| `R19-consolidation-map.md` | in full | **Reused**: glossary, per-process exit table, stop-reason enum, conflicts C-01 to C-20, register rows. **Contradicted** in two places: C-05's lean toward an in-process engine (Q2), and the reserved meaning of "run" (A-5.2) |
| `R27-run-acceleration-synthesis.md` | in full | **Taken as given**: D1.1 to D1.13, IR-01 to IR-60, the Wave 1 lists, the roadmap order. This report only places them in layers and features |
| `DECISIONS-PENDING.md` DP-001 to DP-066 | in full | The defaults are what the architecture is built on. Section "Rulings that would change the architecture" lists the sensitive ones |
| `PROGRESS.md` notes | in full | Verifier corrections applied: R1v (`verification` not extractable whole), R2v (lock race, launcher language, non-code assets), R3v (`--bg --exec` exists; npm marketplace sources not implemented), R21v, R23v, R8v |
| `research-synthesis.md` | in full | The two capability matrices are the input for EP-01 and EP-02. No row is changed |
| `constitution-amendment.md` (draft v3.0.0) | in full | The architecture satisfies it except in three places, where a wording change is proposed (A-10) |
| `/root/mixture-of-loops_lisa/design/speckit-execution-router.md` | in full | **Reused** through R25: pure first-match rule table, separate verification axis, "unsure goes to the judge", the router never derives resume. **Contradicted**: per-phase routing to two ungated modes |
| `/root/mixture-of-loops_lisa/prototype/router/{rules.py,signals.py}` | in full | The shape of the rule table (F-02) |
| `/root/specstride-harness-roadmaps/roadmap/stage-parallelism-research.md` | in full | **Reused**: the three levels of parallelism and their owners, `writes[]`, "absent declared write-sets, keep it serial". Placed in A-8 |
| R1, R1v, R2, R2v, R3, R3v, R4, R5, R6, R7, R8, R8v, R9, R10, R11, R12, R13, R14, R16, R17, R18, R20, R21, R21v, R22, R23, R23v, R24, R25, R26 | "Questions answered", "Recommendation", "Open questions / risks" of each; further sections of R1, R2, R2v, R3, R11, R13, R14, R16, R18, R20, R23 where a design point depends on them | Cited per claim |
| `R18-behaviour-inventory.tsv` | counted with `size.py` | Feature sizing (F-08, A-9) |
| `/root/mixture-of-loops` at `9c88f86`: `runtime.py`, `supervisor_lib.py`, `contract_lib.py`, `render_launcher.py` | cited lines | The process chain of today (F-01) |
| `/root/specstride` at `9cab15d`: `orchestrator.sh` | cited lines | Lock, child processes of the engine (F-01) |
| `prompts/analysis/A2-consolidation-analysis.md` `:186`, `:335-336`; `A8-micro-loops-and-parity.md` headings | lines | A2 raised the child-process question; R19 and this report answer it |

## Questions answered

**Q1. Loop, router, or both, and at which layers?**
Both, and they are not peers. The **loop** is the control structure at every level: pipeline stages, the
phases of a run, phase attempts, passes, and the cycles of the micro-loop layer. The **router** is a pure
decision function that a loop consults at three fixed decision points and that runs nothing. It sits in
one layer only, the pass loop with its loop layer (L3 in the diagram). There is no router at the pipeline
level, at the phase level or in the host.

| Use in decision 20 | Verdict | Where it sits |
|---|---|---|
| Routing tools | Yes, narrowly: ordering and excluding entries of the frozen per-phase check manifest. It adds no command and builds no argument list (R27 D1.4, IR-53) | Decision point `tools`, consulted by the loop layer before a check |
| Choosing between kinds of loop | Yes. A kind of loop is an implementation of the loop-layer interface (EP-04). The strategy is pinned at launch from config; the router may switch the layer off for an attempt and may never switch it on (R27 D-13). `autoresearch` is a later implementation of the same interface and gets rule rows when it exists | Decision point `loop`, consulted at attempt start |
| Escalation after a deterministic failure | Yes, as the second repair (R27 D-03) | Decision point `escalation`, consulted by the micro-loop layer |
| Replacing the gated loop, or routing a phase to an ungated mode | No. Two of the prototype's three modes have no critic, which Principle II forbids | — |
| Choosing the proposer and critic | Not routing (decision 20). It is **role resolution**, a separate component in the harness layer (A-3, EP-02) | — |

The same table pattern (pure function, versioned data, the rule id recorded with the decision) is used
in four other places that are not routing: the quota classifier, the relaunch classifier, lane derivation
and the terms gate. One evaluator serves all five.

**Q2. Child process or one process?**
The engine stays a **child process**. The merged runtime is one process tree with two long-lived Node
processes: the runtime root (supervisor role, pipeline stage executor, lock and lease owner, relaunch
classifier) and the engine it spawns for each `specstride` stage. Everything that is a separate process
today without a separately observed exit code is folded in: the Bash launcher and `runtime.py` become
the root; `orchestrator.sh`, `proposer.sh`, `lib/critic.py`, the stream tap and the shippers become the
engine. Reasons, in order of weight: crash isolation is what makes relaunch automatic without a host
session; stage timeout, environment stripping and signal handling in 011 are process semantics; the
oracle substitutes an engine stub by `PATH`; the launch contract expresses a stage as an argument list.
The nested-lock problem of R19 C-05 is solved by one workspace lock that the root takes and hands down
as a lease, not by removing the process boundary. The engine also writes a typed terminal record, so
011's rules read `{exit_code, stop_reason}` from a file and do not depend on string matching. Options and
costs are in "Options compared", O-2.

**Q3. The layered architecture and its extension points.** Section A-1 (diagram), A-2 (rules), A-3 (18
extension points, each with version, interface, implementer, guarantee and proving test).

**Q4. Package layout and where Lisa's modules land.** Section A-4.

**Q5. State layout and run-state machine.** Sections A-5 and A-6. The state has three roots: user-level
state, one control plane per workspace **outside the working tree**, and a workspace part inside it.

**Q6. The detached runtime.** Section A-7.

**Q7. Where `stage-parallelism-research.md` and R26's constraints fit.** Section A-8. No parallelism of
agents in Wave 1. Six constraints are built in now so that each level of parallelism is a later addition
to one component: stages and features in the pipeline stage executor, units in the loop layer,
selection in the attempt planner.

**Q8. The feature decomposition.** Section A-9. Wave 1 grows from 14 features plus the umbrella (15 with 114-memory) to 27
plus the umbrella. Nine of the §6 features must be split. 114-memory is **not specified** (R12, DP-018).

**Q9. Self-check against decisions 1–23.** Section A-11.

## Findings

### Part I — Facts the design rests on

**F-01 Today's process chain.** `verified-local`.

| Step | Evidence |
|---|---|
| The supervisor starts the launcher detached: `subprocess.Popen(argv, …, stdin=DEVNULL, stdout=handle, stderr=STDOUT, start_new_session=True)` and records `pid`, `pgid`, `launched_at` | `supervisor_lib.py:602-604` and the record that follows, at `9c88f86` |
| The rendered launcher is a Bash file that ends in `exec python3 "$BUNDLE_DIR/runtime.py"`, so launcher and pipeline runtime are one process | `render_launcher.py:105` |
| The pipeline runtime takes a lock per pipeline (`fcntl.flock … LOCK_EX \| LOCK_NB`) and runs every stage as a child in its own session | `runtime.py:582`, `runtime.py:352-359` |
| A stage is retried when the child's exit code is in `retry_exit_codes` and, if a reason is declared, when the newest `reason` in a named JSONL file is in the allowed list | `runtime.py:416-424`, `runtime.py:231-255` |
| Stage kinds are `setup`, `decision`, `command`, `specstride`, `smoke`; the engine is the kind `specstride` | `contract_lib.py:16`, `contract_lib.py:21` |
| The engine takes a lock per workdir (`flock -n` on a descriptor, or `mkdir "$LOCK.d"`), exit 5 | `orchestrator.sh:506-521` at `9cab15d` |
| The engine starts the pass loop as a separate process and the diagnostician as another | `orchestrator.sh:1861`, `orchestrator.sh:1086` |

Consequence `inferred`: three of five stage kinds are arbitrary commands. The pipeline runtime spawns
children whatever is decided for the engine, so an in-process engine would remove one process boundary of
several and would need a second code path for the kind `specstride`.

**F-02 The router prototype.** `verified-local`. `rules.py` is a pure function ("No I/O, no model call, no
network", `rules.py:5`) with ordered rules, first match wins, each decision echoing its rule id and the
signals it fired on (`rules.py:83-152`). It routes a **phase** to one of `speckit-implement`, `goal`,
`orchestrated` or `skip` (`design/speckit-execution-router.md:134`, `:208-218`). Only `orchestrated` has
a critic. Verification mode is chosen on a separate axis (`rules.py:65`). R25 keeps the table form and
drops the ungated modes; this report follows R25.

**F-03 The supervisor of today lives in the host session.** `verified-local` for the sources, `inferred`
for the consequence. `supervise.py auto` is `launch` followed by `watch` (R19:296), and polling is at
least 60 s with a factor 1.5 up to 600 s (011 SC-005, R19:528). Each call is a short command run by the
host model. A relaunch can therefore happen only while a host session is supervising. The reference run
had 0 automatic relaunches and the machine shows 137 manual restarts (R21, Q4; R21v puts the count at
135–143). Aim 3 of the prompt asks for automatic relaunch, and decision 5 says host sessions end.

**F-04 Locks.** R2v:264-273 (`verified-local` there): Lisa's reclaim algorithm gave more than one winner
in 297 of 300 rounds; a kernel lock is held by the process tree while a pid record is held by one
process; a grandchild that calls `setsid` escapes a group kill; Node opens descriptors close-on-exec.
R2v:280-281: an exclusive transaction in `node:sqlite` and a Unix socket both give liveness that the
kernel releases on death. DP-005 records the default built on this.

**F-05 Detach.** R3:94-97: no plugin API starts a process that outlives the session; Claude Code
terminates the process tree of a running Bash command on SIGTERM; a process started with
`spawn(…, {detached: true, stdio: […file…]}).unref()` leaves the process group. Whether it survives in an
interactive session, under `-p`, and with the Bash sandbox on is `unverified` (R3 risk 1). R4 Q2 reports
the same gap on dsh. R3:130: plugin variables are not in the environment of commands run by the Bash
tool.

**F-06 Control files are inside the proposer's write scope today.** R23:140-146 (`verified-local`
there): state directory, gate files, stop flag, yield artifact and verification evidence all sit under
`$WORKDIR`; the approval is an empty file. R11 T-02 (R11:501) and DP-010 follow from it.

**F-07 Lisa's loop has no seam.** R1:147 (`verified-local` there): three injected callbacks and nothing
else; adding the MALFORMED limit, the recovery cycle, yield, the oscillation halt or the layer means
editing the loop. R1v confirms. The engine is therefore written new, with the seams of A-3, and Lisa
supplies primitives.

**F-08 Requirement grain.** `verified-local` for the counts, `inferred` for the ratio. R18:85: 236
Specstride items and 145 mixture-of-loops items are stated by an FR. With 30 and 27 FRs that is 7.9 and
5.4 items per FR, pooled 381 / 57 = **6.7 items per requirement at today's grain**. The inventory has
2,783 items (R18:77). At the same grain the two Python systems alone need about 415 requirements, before
any requirement for decisions 5 to 23. `python3 /tmp/specstride-research/R15/size.py <tsv>` classifies
the items of the four largest drivers by keyword, first match wins:

| Source | Items | Split |
|---|---|---|
| `orchestrator.sh` | 347 | gate and verdict 137, run control 59, proposer 51, spec 43, verification 32, other 25 |
| `proposer.sh` | 338 | harness invocation 96, supervision 82, yield and jobs 82, loop accounting 37, prompt 11, other 30 |
| `specstride` (front door) | 172 | run control 52, inspection 51, reverse 28, learning 15, other 26 |
| `lib/critic.py` | 225 | grounding 59, transport 39, verdict 37, prompt budget 32, diagnostician 6, other 52 |
| `lib/reverse.py` | 264 | lint 99, plan 74, guard 24, other 67 |

The classification is coarse. It is used in A-9 to decide which features must be split, not to fix a
requirement count.

**F-09 The oracle substitutes the engine by `PATH`.** R18 O-3 lists an engine stub ("the existing
execution stub, generalised") and O-4 runs the launcher and supervisor families twice, "against the
engine stub" and "against the real engine with agent stubs". R18 O-11: "The product contains no
oracle-only code path except the legacy projection sink". An in-process engine would need an injection
seam that exists only for the oracle.

**F-10 One writer for events.** R14:231, R14:316 (EV-21): `seq` is monotonic per run, gapless, "assigned
by the single writer … under the run's append lock". R14:296 (EV-01) has the supervisor write into the
same stream. R13:101-104: `RunView` is a pure projection of events and named state files.

### Part II — The draft architecture

#### A-1 Layer diagram

```
                          consumer
                             │ invokes a skill, optional comment
┌────────────────────────────▼───────────────────────────────────────────────────────┐
│ L7 HOSTS     Claude Code plugin │ dsh plugin (Wave 2) │ plain shell                 │
│              skills · hook shims · bin shim · eval suites                   [EP-01] │
└────────────────────────────┬───────────────────────────────────────────────────────┘
       CLI protocol v1: argv in, exit code and terse lines out, --json on request
┌────────────────────────────▼───────────────────────────────────────────────────────┐
│ L6 CLI (short-lived)  derive · validate · promote · launch · status · wait · stop · │
│              resume · doctor · reverse · learn · inspection verbs · watch · ui      │
│              readers: RunView [EP-09] · doctor checks [EP-14]                       │
└───────┬───────────────────────────────┬─────────────────────▲──────────────────────┘
  spawn │ once, detached [EP-17]        │ requests            │ reads events
        │                               ▼ (inbox files)       │ and state files
┌───────▼─────────────────────────────────────────────────────┴──────────────────────┐
│ L5 RUNTIME ROOT (detached, one per run)                                             │
│              supervisor role · pipeline stage executor · lock and lease [EP-13] ·   │
│              relaunch classifier · run-state owner · terminal digest                │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
  spawn │ per `specstride` stage; back: exit code and a terminal record file
┌───────▼─────────────────────────────────────────────────────────────────────────────┐
│ L4 ENGINE (child)  run → phase → phase attempt                                      │
│              verification gate → critic [EP-18] → approval record ·                 │
│              recovery cycle · attempt planner [EP-18]                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ L3 PASS LOOP  pass loop · watchdogs · breakers · yield and detached jobs            │
│              loop layer [EP-04]: none (classic) │ micro │ later kinds               │
│              router [EP-06]: decision points tools · loop · escalation              │
│              prompt assembler [EP-15] · carry-over (ledger, handoff, index)         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ L2 PORTS     interfaces owned by the core; no implementation inside it              │
│              harness [EP-02] · spec format [EP-03] · check runner [EP-05] ·         │
│              verification-plan source [EP-07] · event sink [EP-08] ·                │
│              secret resolver [EP-10] · terms-gate data [EP-11] ·                    │
│              quota classifier [EP-12] · toolchain profile [EP-16]                   │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
┌───────▼─────────────────────────────────────────────────────────────────────────────┐
│ L1 EDGES     Claude adapter · generic descriptor adapter · stream readers ·         │
│              file sink · legacy projection sink · OTLP exporter ·                   │
│              command check runner · env/file/keychain resolvers · detach strategies │
└───────┬─────────────────────────────────────────────────────────────────────────────┘
  spawn │ or HTTP
        ▼   harness processes · check commands · detached jobs · provider endpoints
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ L0 STATE     user-level state │ control plane per workspace │ workspace part        │
└─────────────────────────────────────────────────────────────────────────────────────┘
 across all layers: the contracts package (schemas, enums, logical state names)
```

#### A-2 Rules of the layering

| # | Rule | Rests on |
|---|---|---|
| LR-1 | A layer imports only from layers below it and from the contracts package. L4 and L3 import L2 interfaces and never an L1 implementation. CI enforces it with an import-boundary check over the package graph | Principle VI; decision 17 |
| LR-2 | A host reaches the product only through the CLI protocol. It reads no state file, event file, launch contract or log | Decision 16; R17 Recommendation, rules |
| LR-3 | Between L6 and L5 there are only files, plus one `spawn` at launch and signals for `stop --now`. The CLI writes requests to the inbox; it never writes run state | Decision 5; Principle I |
| LR-4 | Only the runtime tree (L5, L4) writes the control plane. Readers derive `dead` and `stale`; they never write them | R11 R-1; R14 EV-15 |
| LR-5 | At any moment one process is the writer of a run's event file. The root writes while no engine is alive; the engine writes while it is alive. The append lock exists so that a later parallel worker can be added | F-10; R26 constraint (c) |
| LR-6 | Every process boundary that carries a per-process exit code today is a process boundary in the product. Every other one is a function call with a result record that carries the same code number | Decision 4; R19:231-243 |
| LR-7 | The router, the quota classifier, the relaunch classifier, lane derivation and the terms gate are pure tables: versioned data, one evaluator, and the rule id recorded with every decision | R25 RT-A; R14:141-154; R13:126; R8 rule 1 |
| LR-8 | Role resolution (which harness and model play proposer and critic) belongs to the harness layer and runs once at launch. Its result is stored and replayed on resume. No loop and no router calls it | Decision 20; R20:472-477 |
| LR-9 | Text from outside the runtime enters through one ingress (stream reader, check output capture, critic reply capture, comment capture), where it is redacted and size-capped. Sinks and prompts receive the result | R11 R-3, R-5 |
| LR-10 | Every switch is ordinary product configuration. The oracle sets switches; the product has no oracle mode | R18 O-11; R27 D1.1 |

#### A-3 Extension points

All statements are `inferred` from the reports named in each block.

**Common rules for every extension point.**

| Rule | Content |
|---|---|
| Identity and version | Each point has an id `specstride.<name>/<major>`. Changes inside a major are additive. An implementation declares the majors it supports; the registry refuses one outside the range and the doctor reports it (check `events.schema` is the model, R16:108). The core supports the current major and the one before it |
| Three classes of implementation | **D** data (a file validated against a schema: descriptors, rule tables, terms rows, toolchain profiles). **F** first-party code (a workspace package that registers through the public registration call). **T** third-party code (an npm package named in user-scope config). Wave 1 accepts D from consumers and F from the product. T is designed and not enabled (DP-R15-6) |
| Trust | An implementation that widens capability is accepted from user scope, environment or flags only, never from project configuration (DP-009, R11 R-4) |
| Registration | One registry per point, populated at process start. Registries are read-only after launch. What a run resolved is written to the run record and replayed on resume |
| Conformance | Each point has a conformance suite in the test kit. A tested implementation passes it in CI. A data implementation is validated at load and conformance is what `specstride harness verify` and its siblings run on request |
| Proof of "no core change" | For every point the test tree holds a **sample implementation outside the core package**. CI runs the conformance suite on it and runs the import-boundary check, which fails if a core file names the sample. The sample is the proof that the point is real |
| Failure of an extension | An extension that throws, times out or returns a value outside its closed result set degrades to the documented plainer path. It never produces a verdict, an exit code or a stop reason of its own |

**Public points and internal seams.** EP-01 to EP-17 are public: they are versioned contracts of feature
100. EP-18 is an internal seam: versioned and tested in the same way, with no promise to implementers
outside the repository in Wave 1. The cost of a public point is a conformance suite, a sample and a
compatibility promise, so the list is kept to what decisions 11, 17, 20 and 21 and the owner's
evolvability aim require.

##### EP-01 Host port — `specstride.host/1`

| Aspect | Content |
|---|---|
| What it is | Two contracts. (a) The **CLI protocol** the host calls: verbs, the grammar of default output lines, `--json` schemas, exit codes, and `specstride --protocol`, which prints the protocol integer. (b) The **host package contract**: what a host package supplies |
| Operations of a host package | `describe` returns the host's capabilities: skill naming rule and description cap, hook events or none, background primitive or none, status surface, eval driver, packaging form. `renderSkill` turns one skill source (logical id, body, references, budget) into the host's artifact. `renderEntry` maps a logical command id such as `doctor` to the host's spelling. `renderStatusHooks` is optional and emits shims that print a precomputed file. `evalDriver.run` takes a trigger suite and returns one result per case |
| Inputs and outputs | In: one skill source per skill, the budgets of DP-024, the CLI protocol version. Out: an artifact tree (plugin directory, or a skill directory), and eval results |
| Errors | `capability-absent` with the declared fallback; `budget-exceeded`, which fails the build; `protocol-mismatch`, refused with one doctor line |
| Implemented by | `host-claude-code` (Wave 1), `host-dsh` (Wave 2), `host-shell` (the plain CLI; also the test host) |
| Core guarantees | Every fact a host needs is a CLI line. Default output is terse and within budget; an unchanged state prints nothing on `wait`. No run depends on a hook, a monitor or a host process. The logical ids of skills and commands are stable; spelling is the host's |
| Capability levels | `hooks`, `statusSurface`, `background` and `evals` are optional, each with a declared fallback: no hooks means alerts arrive through `status` and the digest (DP-003); no background primitive means the 150-token cycle applies (R17 risk 5); no native evals means the session-log driver (DP-002) |
| Proving test | Host conformance suite, run against `host-shell` and each host package: it plays both skills' command sequences on oracle fixtures with stub agents, measures bytes against the budgets, checks the reference closure (no path into product source or state), and checks that the artifact tree validates. The detach-survival case runs where a live host is available and is reported as a skip with its reason elsewhere (Principle XVII) |

##### EP-02 Harness port — `specstride.harness/1`, descriptor `descriptorVersion: 1`

| Aspect | Content |
|---|---|
| Capability levels | **`proposer`**: capabilities P1 to P6 of R20 (terminates by itself; prompt by stdin, file or bounded argument; works in a given directory without asking; declared way to suppress prompts; exit code; credential check without a paid call). **`completion`**: C1 to C6 (one prompt in, one reply out; tool-less by construction or by a declared and verified mechanism; known context window with its source; fresh session per call; typed failures; provider and model identity) |
| Operations | `detect` returns presence, version and whether a config home exists. `capabilities` returns a map in which every entry is `declared`, `probed`, `adapter` or `catalogue`, or `null`: containment ceiling C0 to C3, continuation, `tiers` ladder, usage source, native-memory switch, tool-less mode, context window. `preflight(role)` checks the credential. `startPass(request)` returns a handle with process identity, the raw stream and the session id. `complete(request)` returns the reply, usage and the facts of the initial record (tool list, session id). `stop(handle, polite \| terminate \| kill)`. `classify(raw)` returns a typed failure |
| Inputs | `startPass`: prompt reference, working directory, session directive (`fresh` with a minted id, or `continue` with an id), model, tier or effort, containment level, environment allow-list, time limits, trace parent. `complete`: prompt, model, output cap, budget cap, an empty working directory |
| Errors | Closed vocabulary: `authentication_failed`, `rate_limited`, `quota_exhausted`, `context_window_exceeded`, `transport_failed`, `agent_failure`, `capability_absent`, and `critic_not_toolless`, which is a critic configuration error that halts the run (Principle IX) |
| Implemented by | Tested adapters, each a descriptor plus optional code hooks: Claude in Wave 1. The **generic adapter**, which is the same port driven by a descriptor alone, for the kinds `cli`, `openai-chat` and `anthropic-messages`. Descriptors the consumer declares in user scope |
| Sub-point: stream readers | A registry from `stream.format` to a reader. A reader turns the raw stream into normalized records (`init`, `text`, `tool`, `usage`, `error`, `terminal`) and synthesizes `init` and `terminal` for a text stream. `kind` and `stream.format` are open sets (R20:425-427): a new one is a reader package |
| Role resolution | Lives beside the registry. Input: config, the resolved registry, the terms gate, the critic order of decision 17 with the qualification and ranking of R20:443-470. Output: proposer, critic, runners-up, the reason for each, the same-model warning. Runs at launch only |
| Core guarantees | The core sees only the port and never tests a harness name. One resolved registry per launch, stored with the provenance of each value. Unknown values are `null`. Tier 3 is not a valid value. The environment of every call is an allow-list. The critic is refused unless the initial record shows an empty tool list and the minted session id (R5 Q2). An unverified `cli` harness is never picked as critic automatically |
| Proving test | Adapter conformance suite: a fake binary and a fake endpoint assert argument list, stdin, environment and clean-up; recorded streams are replayed through the reader. **Descriptor-only fixture**: a descriptor for a fake CLI and one for a fake endpoint, both in the test tree, complete a run as proposer and as critic, are shown by the doctor as unverified, and the endpoint is picked as the diverse critic when none is configured. This is the success criterion of §6 of the prompt, run with no product file changed |

##### EP-03 Spec-format adapter — `specstride.spec-format/1`

| Aspect | Content |
|---|---|
| Operations | `detect(path, head of content)`. `parse(files)` returns the canonical spec model. `validate(model)` returns findings. `tick(task ids)` edits checkboxes in place. `inputs()` lists the source files with their hashes from the one canonical hasher (SHA-256 and the checkbox-insensitive hash of 011 FR-001) |
| The canonical model | Phases with number, title, section and criteria, as today, **plus** structured tasks: id, markers such as `[P]` and story tags, and text. The four-field view that the oracle pins is a projection of it. The structured tasks are what the layer validates task IDs against (R27 D1.2) and what contract derivation inventories, so the second parser in mixture-of-loops disappears (R19 D-32) |
| Errors | `invalid-spec` and `ambiguous-candidates` (engine exit 3 with the listing of 028 FR-001), `unknown-format` |
| Implemented by | `native`, `speckit-tasks`, `openspec-change` with the alias `openspec` (R19 C-07). Roadmap: `chat`, spec bundles |
| Core guarantees | One grammar owner: engine, critic, contract derivation, CLI, doctor and UI read the canonical model (Principle IV). Detection order is the registry's order and is 028's. Resume position is derived by the engine from approval records, never by an adapter |
| Proving test | Adapter conformance on the oracle's format fixtures (FX-09, FX-10): golden models, round trip of `tick`, hash stability. A sample format registered from the test tree is detected, parsed and run |

##### EP-04 Loop-layer interface — `specstride.loop-layer/1`

| Aspect | Content |
|---|---|
| What it is | The inner layer of the one engine (decision 21). The classic loop is the engine with the layer `none`. A kind of loop is an implementation of this interface |
| Operations (hooks, called by the engine at fixed points) | 1. `contributePrompt` returns prompt blocks for a pass (the checkpoint protocol). 2. `afterPass` receives the pass result and the outbox and returns `accept`, `refuse` or `none`. 3. `betweenPasses` does runtime work while no session is open and returns an outcome with accounting directives. 4. `nextPassBlock` returns the block for the next pass. 5. `onEvidence` decides on a closing check. 6. `contributeCriticInput` returns the fact block. 7. `resume` receives the ledger state. 8. `report` returns the fields of the `[LOOP]` line. The list is R23's (R23:449) with resume and report added |
| Inputs | A read-only view of the attempt (counters, manifest, fingerprints), a writable namespace in the ledger that belongs to the layer, the **working directory as a parameter**, the check runner, the router handle |
| Outputs | Directives from a closed set: keep, repair, unresolved, layer off for the attempt, give the iteration back, exempt the pass from the short-pass nudge, exempt manifest commands from the repeat counter |
| Errors | A thrown error, an invalid ledger, a spent cap or a check that cannot start each switch the layer off for the attempt. None stops a run (IR-07) |
| Withheld by construction | The writers of approval, verdict, feedback, hint and recovery markers are not passed to a layer (IR-01). A layer cannot write a counter of the outer loop (IR-06, IR-48) and cannot reset, clean or commit the tree (IR-60) |
| Implemented by | `none` (built in), `micro` (Wave 1). Roadmap: `autoresearch`, units in worktrees |
| Core guarantees | The order after a pass is fixed: kill check, yield check, layer, classic accounting (R23:158-163, R23:209-230). With `none`, or with a layer that never engages, output is identical apart from the fields the divergence register names. The strategy is pinned at launch and recorded per run and per attempt |
| Proving test | (i) The inertness suite: every oracle fixture with the layer on and stubs that never declare a unit. (ii) A sample layer `noop` in the test tree passes the whole oracle. (iii) Static: the module graph of a layer package holds no import of a gate writer. (iv) The layer's own tests |

##### EP-05 Check runner — `specstride.check-runner/1`

| Aspect | Content |
|---|---|
| Operations | `prepare(entry)` resolves the executable to an absolute path with size and hash, at launch. `run(prepared, working directory, environment allow-list, time limit, containment level)` returns the result. `cancel` ends the process group |
| Result | Exit code, duration, a reference to the captured output, and conditions in separate fields: `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` with its reason |
| Errors | `cannot-start`, `timeout`, `interrupted` |
| Implemented by | `command` (fixed argument list, no shell; the only kind in Wave 1). Wave 1 option: `steps`, the step runner. Roadmap: runners that parse results (test counts, DP-047) |
| Core guarantees | A check is run by the runtime, never by the proposer's harness. The verification gate and the inner checks use the same runner, so a result means the same in both. Every run emits `check.started` and `check.ended`. Concurrency is a parameter, default 1, and a command runs beside another only with declared disjoint write scopes (R26 recommendation 2) |
| Proving test | Runner conformance with scripted commands: pass, fail at step n, slow, never ending, very large output. A sample runner registered from the test tree serves a manifest entry of its kind |

##### EP-06 Router rule table — `specstride.router-rules/1`

| Aspect | Content |
|---|---|
| Form | Per decision point an ordered table. A row has a rule id, a predicate over named signals, and a choice from the closed choice set of the point. One function, `route(point, signals, config, ladder)`, returns the choice, the rule id, the signals and the table version. No I/O, no clock, no model |
| Decision points and choice sets | `tools`: an order over manifest entries and a set of exclusions with reasons. `loop`: a registered layer id, or off for this attempt. `escalation`: the next rung of the pinned ladder, or `skip` with a reason |
| Inputs | Counts, exit codes, the failure signature (ordered failed command ids with exit codes), tree fingerprints, measured durations, caps left, config, the ladder. Never task prose, check output or anything a model wrote |
| Errors | A table without a default row for a point fails validation at load. An invalid table switches routing off for the run, announced, with `route.decided` carrying the rule id `config-off` |
| Implemented by | The shipped table (R25 RT-B to RT-D as amended by R27). A loop layer contributes the rows of the points it consults |
| Core guarantees | The router runs nothing, reads no critic prompt, nonce or verdict, changes no role and no outer counter, and cannot switch a layer on. Every decision is an event, including the ones that change nothing. No routing decision reaches the critic (IR-59) |
| Proving test | Golden decisions per row. Property: for every signal vector exactly one row fires. The sample layer of EP-04 adds a decision point with two rows; the engine is unchanged |

##### EP-07 Verification-plan source — `specstride.verification-source/1`

| Aspect | Content |
|---|---|
| Operations | `discover(workspace, canonical spec model)` returns declared commands with provenance (file and line), phase, time limit, an optional `tasks` field and optional steps. `obligations(model)` returns one obligation per task line. `conflicts` returns blockers |
| Errors | A command that cannot be written as a fixed argument list, or two declarations that disagree, is a blocker, never a guess (Principle XIV) |
| Implemented by | The verification-commands document; commands declared literally in plan or tasks; toolchain discovery of build, type check, lint and test entry points; the launch-contract inventory. Roadmap: plans bound to a spec bundle (002 FR-037) |
| Core guarantees | The plan is bound to the hashes of its sources, frozen at launch and stored in the control plane. The per-phase check manifest is derived from it and from nothing else. A phase without commands stays explicitly empty. A relaunch that derives a different manifest is a fact for the critic (IR-54) |
| Proving test | Source conformance on fixtures with declared commands, with conflicts and with none. A sample source in the test tree contributes a command that appears in the manifest with its provenance |

##### EP-08 Event sink — `specstride.event-sink/1`

| Aspect | Content |
|---|---|
| Operations | `open(run context)`, `write(event)` in `seq` order, `flush`, `close`. A sink declares the schema range it accepts |
| Errors | Every error is contained in the sink. The writer records `telemetry.delivery` and goes on |
| Implemented by | The legacy projection sink (`events.legacy.jsonl`), the OTLP exporter, the Loki sink. Roadmap: the delivery dispatcher of 002 FR-024. Third-party event types carry the prefix `x.` |
| Not replaceable | The primary file writer. It is part of the core, it is authoritative, and sinks receive events after it has written them |
| Core guarantees | Local first. A slow, failing or dead sink never stalls or fails a run (Principle V). Events reach a sink already redacted and without content (EV-32). Readers ignore unknown fields and types |
| Proving test | Sink conformance: a slow sink, a throwing sink and a dead collector leave the outcome and the event file of a fixture run unchanged. A sample sink that keeps events in memory is registered from the test tree |

##### EP-09 UI read model — `specstride.view/1` (`RunView`)

| Aspect | Content |
|---|---|
| Operations | `project(events, state files, now)` returns a `RunView`. `reduce(view, event)` returns the next one. A cursor `{file, offset, lastSeq}` lets a renderer continue |
| Inputs | The event stream and three named state files: the run record, the lease, the pause record. Nothing else |
| Errors | A torn last line is tolerated. An event major outside the accepted range yields a view marked `stale` with the reason, and a doctor warning |
| Implemented by (renderers) | `status` text and `--line` (Wave 1), the hook status shim, `watch` and the web viewer (Wave 2), the static export |
| Core guarantees | Lanes, attention items and budget levels are derived in the contract, never in a renderer. A renderer never opens the event file. A cached snapshot is disposable. Fields are additive inside a major |
| Proving test | Golden views from fixture event logs, including the oracle's and one with a torn line. Prefix property: batch projection equals folding event by event. A sample renderer in the test tree takes `RunView` JSON and is given no file handle |

##### EP-10 Secret resolver — `specstride.secret-resolver/1`

| Aspect | Content |
|---|---|
| Operations | `handles(scheme)`. `exists(reference)` returns yes, no or `unprobed` and never the value. `resolve(reference)` returns the value in memory and registers it with the redactor. `boundHost(reference)` returns the host the secret may be sent to |
| Errors | `missing`; `inline-secret`, a configuration error; `unsafe-file` for a target inside the workspace or readable by others |
| Implemented by | `env:`, `file:`, `keychain:` (macOS Keychain; Linux secret service, where the existence check is `unprobed` until a non-printing query is found, R16 open question 5) |
| Core guarantees | A secret is resolved at the moment of use, passed by environment or stdin and never by argument list, written to no state, event, log or contract, and sent only to its bound host (R11 T-16) |
| Proving test | Canary test: secrets planted in tool output, evidence, check output and the comment are absent from every sink. A sample resolver for the scheme `test:` is registered from the test tree |

##### EP-11 Terms-gate data — `specstride.terms/1`

| Aspect | Content |
|---|---|
| Form | Rows of provider, tier, audience (`personal`, `distributed`), status (`allowed`, `conditional`, `personal-only`, `refused`), source, access date, quoted sentence, `verified-on`. One function, `evaluate(provider, tier, audience, acknowledgements)`, returns the decision and the row it rests on |
| Errors | No row means unknown terms: Tiers 1 and 2, with a warning. Tier 3 with no `allowed` row is refused with the explanation. Data older than 30 days is a doctor warning |
| Implemented by | The data file shipped in the package. A newer file placed in user-level state replaces it, so the data can change without a product release (R8 open question 9) |
| Core guarantees | Evaluated at launch, at role resolution and at every fallback switch. No comment, flag, mode or project key bypasses it. A front harness is gated by its back end's row (R8 rule 6) |
| Proving test | Table tests generated from R8v's corrected matrix. A row for a fictional provider in a test overlay changes the decision with no code change |

##### EP-12 Quota classifier — `specstride.quota-classifier/1`

| Aspect | Content |
|---|---|
| Operation | `classify(signal)` returns class, confidence (`structured`, `status`, `text`, `stall`), `resetsAt` or `null`, and `retryable`. Classes are R14's: `quota_window`, `quota_credit`, `rate_limit_transient`, `overload`, `auth`, `context_window`, `agent_failure`, `provider_other`, `budget_cap` (R14:145-152) |
| Input | What the adapter saw: a structured stream record, an HTTP status with headers and body code, an exit code, error text |
| Implemented by | The `failures` map of a descriptor (data); code in a tested adapter; a default text classifier whose confidence is `text` |
| Core guarantees | The engine acts on the class only. The quota classes spend no iteration, reject, MALFORMED, error, wall-clock or relaunch budget. A `text` or `stall` classification pauses only after a confirming probe |
| Proving test | Classifier fixtures per tested harness. A declared map for a fake harness pauses a fixture run and the reject count stays unchanged, which is the second success criterion of §6 |

##### EP-13 Lock and liveness provider — `specstride.lock/1`

| Aspect | Content |
|---|---|
| Operations | `acquire(scope, owner record)` returns a lease or a conflict that names the holder. `heartbeat`. `release`. `probe(scope)` returns one of `free`, `held-live`, `held-foreign`, `stale-owner-dead`, `owner-dead-group-alive`, `unknown`. `reclaim(scope)` returns a lease or `lost-race`. `handDown(lease)` returns a token for a child; `verify(token)` lets the child confirm that its parent holds the lease |
| Owner record | pid, process group, process start time, boot id, host name, pid-namespace id, launch id, a hash of the run token |
| Errors | `conflict` (engine exit 5, pipeline exit 24), `foreign-owner`, which is never reclaimed automatically, and `unknown`, which counts as held |
| Implemented by | The default of DP-005: atomic `mkdir`, the owner record renamed into place so that a lock never exists without an owner, reclaim by atomic rename, liveness backed by the kernel through something Node ships. Roadmap: a native kernel lock, which would be a Language Ledger entry |
| Core guarantees | One run per workspace. The scope is the workspace; a lease is handed down, so a child never takes a second lock. `owner-dead-group-alive` refuses to start and names the survivors (R2v risk 3). A signal is sent only when pid, start time and run token all match (R11 T-26) |
| Proving test | Provider conformance: 8 contenders over 300 rounds give exactly one winner each round (the test that Lisa's algorithm failed, R2v:264); owner killed with SIGKILL; owner dead with a live child; a reused pid after a changed boot id; a foreign host name. A sample provider that keeps locks in memory is registered from the test tree |

##### EP-14 Doctor check registry — `specstride.doctor/1`

| Aspect | Content |
|---|---|
| Form | A check has a stable dotted id, a severity rule, the flag `lb` (launch-blocking), an order, a probe function that receives injected probes, a message template of at most 200 bytes and a fix hint. `run(context, flags)` returns findings |
| Errors | A probe that times out yields a warning `probe timed out`. A check that throws yields exit 1 for the doctor and nothing for a run |
| Implemented by | The catalogue of R16 (44 checks). Every package registers its own: an adapter its `bin`, `auth` and `version` checks, a host its `host.*` checks, the layer its toolchain check. The six launch checks of 011 FR-019 are registered checks with `lb` set and a fixed order |
| Core guarantees | A check reads and never writes, makes no paid call and reads no secret value. The launch preflight is exactly the `lb` subset, so the doctor and the launch cannot disagree. The critic-diversity warning is never `lb` (decision 7) |
| Proving test | Registry conformance. A sample check registered from the test tree appears in `--json` output, and with `lb` set it refuses a launch, with no core file changed |

##### EP-15 Prompt block provider — `specstride.prompt-block/1`

| Aspect | Content |
|---|---|
| Operation | `blocks(pass context)` returns blocks, each with id, bytes, a digest, its writer, `protected` or not, and `stable` or `volatile` |
| Implemented by | Spec context, the obligations index, the handoff, feedback, hint, acceleration note, the yield contract, the layer's protocol block. Roadmap: a lessons block (R12 part 4) |
| Core guarantees | One assembler budgets the whole prompt, places stable blocks first and keeps the start byte-stable within an attempt (R27 D1.10, D1.11). Every pass emits `prompt.built` with the blocks and what was dropped. A protected block is never dropped. The critic has its own assembler and block set. With the legacy block set selected, the prompt equals the baseline's byte for byte (R18 N-24) |
| Proving test | Golden prompts on oracle fixtures. A sample provider adds a block that shows up in `prompt.built` |

This point is what R12 asked of the engine (R12, DP-R12-3: "one interface: a provider of proposer
prompt blocks"). It is why no memory feature needs to change the engine later.

##### EP-16 Toolchain profile — `specstride.toolchain/1` (data)

| Aspect | Content |
|---|---|
| Form | Per toolchain: patterns for check-definition files (class A of IR-38), cache locations, user-level configuration files, suppression markers, the executables to pin |
| Implemented by | Shipped profiles for the toolchains the product detects. Consumer profiles in user scope |
| Core guarantees | A toolchain without a profile has the protection of R23 as written, and the doctor and the `[LOOP]` line say so (R27, table "R23v rules", IR-36 to IR-38) |
| Proving test | A profile for a fictional toolchain in a test overlay changes the protected set of a fixture |

##### EP-17 Detach strategy — `specstride.detach/1`

| Aspect | Content |
|---|---|
| Operations | `available`. `start(runtime entry, environment allow-list, log path, launch nonce)` returns the started process identity. `describe` |
| Errors | `unavailable`; `not-ready` when the lease handshake does not complete in time |
| Implemented by | `spawn-detached` (default: a new session and process group, stdio on files). `foreground`: the consumer starts the runtime root in a terminal of their own. Roadmap: `service`, a systemd user unit or a launchd agent, which also survives a reboot |
| Core guarantees | Whatever the strategy, readiness is confirmed by the lease carrying the launch nonce. The CLI waits for the handshake and no longer. The strategy in use is in the run record and the doctor |
| Proving test | Strategy conformance: start, end the parent, confirm the child lives and the lease is valid; then the same with the parent killed by signal. A sample strategy is registered from the test tree |

##### EP-18 Critic strategy and attempt planner — internal seams

| Seam | Interface in words | Wave 1 | Room for |
|---|---|---|---|
| Critic strategy | `judge(gate input)` makes one or more `completion` calls, each with its own nonce, and returns one verdict record | One critic | The ensemble of 002 FR-022 (R19 C-11) |
| Attempt planner | `next(attempt history)` returns the kind of the next phase attempt | The recovery cycle as today: diagnostician on a new signature, accelerator when due | The tier bump after K rejections (DP-033); selection among N candidates (A-8) |

They are seams because R1 found that their absence is what closed Lisa's loop (F-07). They are internal
because no decision asks for third-party implementations and both sit next to the verdict.

#### A-4 Package layout

`inferred` from R3 recommendation 1 (one published package with the plugin inside), R17 recommendation
part 1 (one bundled ESM file with lazy imports), R1 F-B with R1v's correction, R2's port maps and R2v's
inventory gaps.

One npm workspace. Workspace packages are private and are bundled into **one published package,
`specstride`**, which holds the CLI, the runtime entry and the Claude Code plugin directory. Consumers
never install a workspace package by itself.

| Package | Layer | Holds | May import |
|---|---|---|---|
| `@specstride/contracts` | all | Schemas and types: event schema, `RunView`, config schema, descriptor schema, launch-contract schema, exit codes per process, stop-reason enum with `retryable`, logical state names, the interface types of every EP. No `node:` import | a schema library |
| `@specstride/kernel` | all | Atomic file write, the canonical hasher, the table evaluator of LR-7, the redactor, the process supervisor primitive (spawn in a group, signal a group, read start time), clock | contracts |
| `@specstride/core` | L4, L3 | The engine: run, phase and attempt loop; verification-gate call; verdict parser; grounding; approval records; recovery cycle; attempt planner; pass loop; watchdogs and breakers; yield and detached jobs; ledger and counters; prompt assembler; the hook points of EP-04; the router call sites | contracts, kernel |
| `@specstride/layer-micro` | L3 | The micro-loop layer, its rule rows, the fact block | contracts, kernel |
| `@specstride/spec-formats` | L1 | Registry and the three adapters; canonical model; validation | contracts, kernel |
| `@specstride/verification` | L1 | Plan model, plan sources, manifest derivation, gate executor, `command` runner, step runner, first-failure predicate, failure summary | contracts, kernel |
| `@specstride/harness` | L1 | Registry, discovery, generic adapter, stream readers, endpoint completion clients, role resolution, config-home overlay, containment mapping | contracts, kernel |
| `@specstride/adapter-claude` | L1 | The Claude descriptor and its code hooks | contracts, kernel, harness |
| `@specstride/config` | L1 | Loader, precedence, trust filter, run snapshot, secret resolvers | contracts, kernel |
| `@specstride/policy` | L1 | Terms gate and its data, quota classifier, pause and fallback rules, budgets and alerts | contracts, kernel |
| `@specstride/observability` | L1 | The event writer, the redaction ingress, the legacy projection, OTLP and Loki sinks, the shipped telemetry stack as optional assets | contracts, kernel |
| `@specstride/view` | L6 | `project`, `reduce`, lane table. No `node:` import in its core | contracts |
| `@specstride/learning` | L1 | Metrics from events, decisions, resolution, retrospective | contracts, kernel |
| `@specstride/reverse` | L6 | Inventory, plan, driver spec, lint, guard, the Spec Kit templates with their MIT notice (R1 O8) | contracts, kernel, spec-formats |
| `@specstride/pipeline` | L5 | Launch contract: inventory, validation, promotion, rendering, bundle; stage executor; launch checks; relaunch classifier; digest lines | contracts, kernel, spec-formats, config |
| `@specstride/runtime` | L5, L4 | Composition root of both long-lived processes: wires registries, takes the lock, keeps the lease, reads the inbox, owns run-state transitions. Detach strategies and the lock provider | every package above |
| `@specstride/doctor` | L6 | The registry and the core catalogue | contracts, kernel, config, view |
| `@specstride/cli` | L6 | Commands, terse output, text renderer, the follower | every package above |
| `@specstride/host-claude-code` | L7 | Skill sources, generator, hook shims, `bin` shim, eval suites, budget gates | contracts (build time only) |
| `@specstride/host-dsh`, `@specstride/ui-web` | L7 | Wave 2 | contracts; `ui-web` also view |
| `@specstride/testkit`, `@specstride/oracle` | dev | Conformance suites, sample extensions; stubs, fixtures, normalizer, comparator, reference fetch | anything; never shipped |

**What the core may not import.** `@specstride/core` and `@specstride/layer-micro` import `contracts`
and `kernel` and nothing else from the workspace. They import no adapter, no sink, no config loader, no
host, no UI, no provider SDK, and neither `node:child_process` nor a network module directly. They
receive resolved configuration, registries and ports as arguments from the composition root. The
import-boundary check in CI states this as a rule over the package graph, and `package.json`
dependencies of the two packages list nothing else.

**Where the extracted Lisa modules land.** R1's list, with R1v's correction and two changes of this
report, each marked.

| Lisa module (tree per R1) | Lands in | Note |
|---|---|---|
| `core/critic/verdict.ts` | core | The type `VerdictResult` is redeclared, not imported (R1v:147). Nonce raised to 128 bits is R11's proposal and needs a register row |
| `core/critic/grounding.ts` | core | It is a port of an older Python; 028's code at `9cab15d` is the oracle, so wildcard expansion and the caps are brought to the baseline before the characterization tests are written |
| `core/gates/store.ts` | core | As reference for atomic writes. The approval becomes a signed record (DP-010), so the store is rewritten |
| `core/engine/lifecycle.ts`, exit codes only | contracts | The 14-state job lifecycle is not taken |
| `core/engine/proposer-context.ts` | core, prompt assembler | Becomes the first implementation behind EP-15 |
| `core/events/journal.ts`, the pattern | observability | The one-emit-two-encodings idea becomes the projection sink, written to a separate file (R19 C-06) |
| `specs`: `resolve.ts`, the three adapters, `validate.ts`, `context.ts`, registry shape | spec-formats | `openspec` is renamed with an alias; `resolve.ts` gets a characterization test before the rename (R1v V3) |
| `verification`: `executor`, `store`, `hash`, `render`, `discovery`, **plus `core/domain/verification-plan.ts`** | verification | **Not the whole package** (R1v:149). The planner is rewritten to take the canonical spec model, because its input type is the deferred spec bundle |
| `agents/provider.ts` | harness | The two capability levels. Version pin, tier, quota signal, continuation and discovery are added |
| `agents/anthropic/completion.ts`, `agents/openai-compat/completion.ts` (`OpenAiCompatCompletion` only) | harness | Machine-specific names removed (R1 B4) |
| `agents/claude-agent-sdk/harness.ts`, `tap.ts` | **not extracted in Wave 1** (change 1) | R5 recommends the `claude` subprocess and no Agent SDK dependency; R8v restricts the SDK to API keys. `tap.ts` is reference for the stream mapping. An SDK transport is a roadmap item behind EP-02 |
| `otel` (whole) | observability | Separable: its only non-relative import is `node:crypto` (R1v:151) |
| `scheduler/stop.ts`, `stop-now.ts` | runtime | A process walk for macOS is added (R1 B5). Signals only on a matching pid, start time and token |
| `scheduler/budgets.ts` | policy | Its state input is the 14-state job; it gets a new input type (R1v:152) |
| `tui/presenter.ts` | cli | It ports an older `present.py`; the baseline's behaviour is the oracle |
| `cli/commands/doctor.ts`, the finding model | doctor | Model only |
| `cli/layout.ts`, the lock | **not reused** (change 2) | R2v showed the race (F-04) |
| `testkit`, the characterization pattern | testkit | Pattern only |
| `web` tokens and pure builders; `dashboard/trajectory.ts`, `provider-health.ts` | ui-web, Wave 2 | `trajectory.ts` from `76adfdc` (DP-013) |

**Where the non-code assets land** (R2v:139-150 found that they had no destination).

| Asset | Lands in |
|---|---|
| `launch-contract.schema.json` | contracts. One schema is both schema and validator input (R19 D-13) |
| `SKILL.md`, `references/contract.md`, `references/derivation.md` | host-claude-code, as skill sources cut to the budgets of DP-024. What they state as rules becomes behaviour of `pipeline` (R17, DP-023) |
| `agents/openai.yaml`, `bin/onboard-skill` | Superseded by plugin packaging (R19 DR-16) |
| `lib/speckit_templates/*.md` | reverse |
| `telemetry/` (dashboard, compose, collector configuration) | observability, optional assets; the old metric names are an opt-in (R14:352) |
| `.env.example` | The config schema and its generated reference |
| `lib/fixtures/**` | oracle |

**Platform dependencies outside npm**, to be listed once in `architecture.md` (R2v:253): `git`; `ps` and
`pgrep` for foreign process groups and CPU time, with different keywords on macOS; the platform keychain
tool. Each is probed by a doctor check and none is required for a run to start except `git` where
commits are on.

**Language Ledger.** Empty at the start of Wave 1 (R17; R2v; DP-043). The architecture adds no entry.
The places where one could enter later are EP-13 (a native kernel lock) and EP-17 (a service installer),
both behind an interface.

#### A-5 State layout

`inferred` from F-06, R11 R-1, R23:449, R24 F-8 as resolved by R27 D-10, R14:159 and R14:356, R16 F7,
R20:472-477, R26 recommendation 3, R3:118 and R3:133, DP-066.

##### A-5.1 Three roots

| Root | Default location | Who writes | Who reads |
|---|---|---|---|
| **User-level state** | Config in `~/.config/specstride/`; state in `$XDG_STATE_HOME/specstride/user/`, default `~/.local/state/specstride/user/` | The consumer (config); the CLI on the consumer's request; the runtime for the tripwire only | CLI, runtime, doctor |
| **Control plane**, one per workspace | `$XDG_STATE_HOME/specstride/workspaces/<workspace-id>/` | The runtime tree. The CLI writes into `inbox/` and `launches/` only | CLI, doctor, renderers, the critic's fact block builder |
| **Workspace part** | `<workspace>/.specstride/` | The proposer, and the runtime for the handoff | The proposer, the runtime, grounding |

The control plane is **outside the working tree**. A sandbox that confines writes to the working
directory then protects every control file with no rule of its own, and grounding, which honours paths
inside the workdir (R23:196-202), cannot reach it by citation. `<workspace-id>` is a hash of the real
path of the workspace root with a readable prefix. The runtime derives it; it is never read from a file
inside the workspace, because the proposer can write there. The cost and the alternative are in O-3 and
DP-R15-2.

There is no mutable file shared between two workspaces. Two runs in two workspaces, or in two worktrees
of one repository, have different control planes and different locks (R26 recommendation 3a).

##### A-5.2 Identifiers

| Id | Scope | Minted by | Note |
|---|---|---|---|
| `workspaceId` | workspace | runtime, derived | |
| `pipelineId` | launch contract | contract derivation | 011's pipeline id |
| `runId` | the logical run of one feature | CLI at first launch | **Stable across resume and relaunch** (R14:234). It ends when all phases are approved or when the consumer starts a new run |
| `launchId` | one start of the runtime root | runtime root | Increments on resume and on relaunch (R14:235) |
| `engineStartId` | one start of the engine process | runtime root | Projects to the legacy `run_id`, which today is minted per orchestrator process (R18 N-03) |
| `attemptId` | one phase attempt | engine | Minted once, never reused, names the directory. The **counts** used for limits live in the ledger and are what `--reset-counts` resets. The directory identity is not reset, so no `-<run-id>` suffix rule is needed (R19 C-14) |
| `passId`, `unitId`, `jobId` | as named | engine | R14 EV-14; R27 D1.2 |

R19's glossary reserves "run" for "one engine invocation over one feature" (R19:159). R14 and decision 23
need an identity that survives a restart. This report proposes that **run** means the logical run and
that one engine invocation is an **engine start**. The glossary owner rules (DP-R15-5).

##### A-5.3 The tree

```
USER LEVEL
~/.config/specstride/config.yaml                  user configuration (decision 9)
~/.config/specstride/harnesses/*.yaml             consumer descriptors (EP-02)
~/.config/specstride/toolchains/*.yaml            consumer toolchain profiles (EP-16)
$STATE/specstride/user/tripwire.json              gate-integrity tripwire (DP-066); cleared by the operator
$STATE/specstride/user/terms/terms.json           newer terms-gate data, if any (EP-11)
$STATE/specstride/user/harness-verify/<id>.json   results of `harness verify`: version, descriptor hash, date
$CACHE/specstride/catalogue/                      dated model catalogue snapshot (R20 L4)

CONTROL PLANE      $STATE/specstride/workspaces/<workspace-id>/        directories 0700, files 0600
  workspace.json                 real path, layout version, created
  lock/                          the workspace lock: owner record and liveness endpoint (EP-13)
  inbox/                         written from outside the runtime tree, read by it at boundaries
    stop.request                   stop flag; empty means clean (028 FR-015)
    host-events.jsonl              host-observed facts, for example a host rate limit (R14:216)
  pipelines/<pipelineId>/
    contract/                      draft, validated contract, promotion stamp
    bundle/<hash>/                 launch bundle, content-addressed
    state.json                     stage state, current only (R14 EV-18)
    retrospective/
  launches/<launchId>/           PER LAUNCH
    launch.json                    who launched, mode, comment hash, detach strategy, launch nonce
    runtime.log
  features/<slug>/
    approvals/phase-<N>.json       signed approval record (DP-010); survives runs
    learning/                      decision log (byte format kept, 011 FR-003), applied decisions
    keys/approval.key              verifies approvals on resume
    runs/<runId>/                PER RUN
      run.json                       plan, caps, pinned strategy, state, terminal record
      config.resolved.json           value and source layer per key (R16 F7)
      registry.resolved.json         resolved harness registry and the critic pick with runners-up
      lease.json                     liveness (A-7)
      pause.record                   present while paused for quota
      events.jsonl                   the one event stream
      events.legacy.jsonl            projection, when the sink is on
      view.json, status.line         disposable caches for renderers and hook shims
      ledger.jsonl                   append-only, chained, signed; counters live here
      keys/ledger.key                not the approval key (IR-57)
      procs/                         process registry: pid, group, start time, token, per child
      verification/                  plan, its hash, toolchain pins
      phases/<N>/                  PER PHASE
        manifest.json                  check manifest and hash (IR-08)
        protected-set.json             fingerprints at phase entry (IR-33)
        attempts/<attemptId>/        PER PHASE ATTEMPT
          attempt.json                   kind, strategy, session directive, outcome
          session/                       harness session state; removed when the attempt ends (DP-038)
          gate/                          verification result, evidence set aside with its hash
          critic/                        prompt reference, reply, verdict record, fact block
          feedback.md, hint.md, acceleration.md
          passes/<passId>/             PER PASS
            prompt.txt, stream.ndjson, invocation.json, usage.json
          units/<unitId>/              PER UNIT
            checkpoint.json              moved here from the outbox when read (IR-55)
            checks/<n>.json              result per command, fingerprints before and after
          jobs/<jobId>/                detached jobs of a yield: identity, predicate, step times

WORKSPACE PART     <workspace>/.specstride/
  features/<slug>/
    evidence/GATE<N>-EVIDENCE.md   written by the proposer
    outbox/                        checkpoint and yield artifacts, written by the proposer
    notebook/PROGRESS.md           the proposer's notebook; no longer the required first read
    handoff.md                     written by the runtime at every pass start, never read back by it
```

##### A-5.4 Rules of the layout

| # | Rule | Rests on |
|---|---|---|
| SL-1 | Nothing in the workspace part decides anything. The runtime reads the outbox and the evidence as claims, after the pass has exited, as regular files without following links | IR-09, IR-55; Principle I |
| SL-2 | A file is written to a temporary name and renamed. State files hold current state; history is the event stream | 002 FR-013; R14 EV-18 |
| SL-3 | Grounding refuses every path of the control plane and of the event stream, whatever the evidence cites | IR-45, IR-59 |
| SL-4 | Feature 100 owns a table from logical names to paths, such as `approval:<phase>`, `attempt:<phase>:<n>:evidence`, `run:<id>:events`. Specs, the oracle (R18 N-02) and the doctor use logical names. A later change of layout is a change to one table and a layout version | R18 N-02; decision 3 |
| SL-5 | The inbox is the only place a process outside the runtime tree writes after launch. A stop request is honoured as today, including when no run is active | Principle I; R19 D-28, D-29 |
| SL-6 | At containment C0 and C1 the control plane is protected by location and by detection, not by the operating system: the proposer runs as the same user. The run record and the `[LOOP]` line say `protection=detect` | DP-040; R23 open question 8 |
| SL-7 | Old `.specstride/`, `.lisa/` and `.mixture-of-loops/` trees are not read (decision 3). An old `.specstride/` in the workspace is reported by the doctor check `config.legacy` and the new workspace part uses a layout version file to tell itself apart | Decision 3; R16:98 |

#### A-6 Run-state machine

`inferred` from R13:112, R14:156-166 and R14:193, R19 C-12 and C-16, R19:275-287, DP-028, R27 D1.5.

##### A-6.1 States

| State | A process is alive | Lock held | Meaning |
|---|---|---|---|
| `created` | CLI only | no | Launch checks passed, launch record written |
| `starting` | runtime root | being taken | The root is up; the lease handshake is not yet confirmed |
| `running` | root and engine | yes | The loop is working. Sub-states come from open events and are not states of the machine: proposing, checking, verifying, reviewing, waiting on a job |
| `paused-quota` | root and engine, asleep | yes | A quota window is closed. No budget of any kind is spent (DP-028) |
| `relaunching` | root | yes | The engine ended with a classified transient; the root waits out the backoff |
| `stopping` | root, perhaps engine | yes | A stop request was seen |
| `blocked-on-human` | **none** | no | The run cannot go on without the consumer: a declared block, missing credit, failed authentication, a hard budget cap, the quota-wait ceiling. It rests until `resume` |
| `finished` | none | no | All phases approved, release verification passed, remaining stages complete |
| `stopped` | none | no | Operator stop |
| `failed` | none | no | A halt with a stop reason that is not retryable, or the relaunch budget is spent |
| `dead` (derived) | none | stale | The record says a live state and the lease has no live owner. Never written as a state; a reader derives it, and the next launch writes the closing event |

`blocked-on-human` is a resting state in Wave 1, as R19 C-12 (b) proposes: the run emits `blocked`,
ends with the existing stop reason, and the digest and `RunView.attention[]` say what is needed. A
later approvals feature can keep a process alive in this state without a new state name
(DP-R15-7).

##### A-6.2 Transitions and their owners

| From | To | Trigger | Owner (process) | Written |
|---|---|---|---|---|
| — | `created` | `specstride launch` or `resume` passes the launch checks | CLI | `launches/<id>/launch.json` |
| `created` | `starting` | The detach strategy starts the root | CLI | — |
| `starting` | `running` | Lock acquired or reclaimed, lease written with the launch nonce, earlier launch closed if it died | root | `lease.json`, `run.launched`, and `run.ended{synthesized}` for a dead predecessor |
| `starting` | `failed` | Lock conflict, stale sources, invalid contract, failed preflight | root | terminal record; pipeline codes 24, 23, 20, 21 |
| `running` | `paused-quota` | The quota classifier returns `quota_window` with sufficient confidence | engine | `pause.record`, `quota.signal`, `run.paused` |
| `paused-quota` | `running` | `resumeAt` reached, or a probe succeeds | engine | `run.resumed`; `pause.record` removed |
| `paused-quota` | `blocked-on-human` | The pause ceiling is reached | engine, then root | `blocked`, terminal record |
| `running` | `blocked-on-human` | A declared block with the no-progress breaker, `quota_credit`, `auth`, a hard cap | engine, then root | `blocked`, `run.ended`; engine exit and stop reason as in the per-process table |
| `running` | `relaunching` | The engine exits; the relaunch classifier says transient and budget remains | root | `supervisor.observed`, `supervisor.relaunch` |
| `relaunching` | `running` | Backoff over | root | new `engineStartId`; counts carried |
| `running`, `paused-quota`, `relaunching` | `stopping` | A stop request in the inbox, seen at a boundary; `--now` also signals the recorded groups | engine at boundaries; root for `--now` | the request is removed when honoured |
| `stopping` | `stopped` | The engine exits 6 | root | `supervisor.stopped`, terminal record |
| `running` | `finished` | The last stage completes | root | `run.ended{all_approved}`, the digest |
| `running`, `relaunching` | `failed` | A stop reason that is not retryable, or no budget left | root | terminal record, the digest |
| `blocked-on-human`, `stopped`, `failed`, `dead` | `created` | `specstride resume`, by the consumer or by the host skill on the consumer's request | CLI | a new launch record |
| any live state | `dead` | The owner is gone | nobody | derived |

Rules: the host writes no transition. The CLI writes only the two transitions into and out of
`created`. A pause is a state and never a stop, so the relaunch classifier has nothing to classify and
the relaunch budget is untouched (R14:183-185). A quota pause on the critic is the same state.

##### A-6.3 Codes and reasons

The per-process exit table of R19:231-243 stands, with the process names of this architecture:

| Process or command | Codes |
|---|---|
| Engine: `specstride run`, `resume` in the foreground, and the engine child of the root | 0 to 6; 70 on an uncaught error |
| Pipeline entry: `specstride pipeline run` in the foreground, and the runtime root | 0, 20 to 24, 128+N |
| `specstride supervise <verb>` | 0, 2, 3, 4, 5, 22, 24, 130 |
| `specstride reverse`, lint, guard | 0, 2, 3 |
| Inspection commands | 0, 1, 3 |
| `specstride doctor` | 0, 1, 2, 3 (R16:117-122) |
| Inside the engine, as result records with the same numbers where the baseline prints them | pass loop 0, 4, 6, 7, 8, 9, 10; critic call approved, rejected, malformed, configuration error |

The engine writes a **terminal record** into `run.json` before it exits: exit code, stop reason from
the closed enum, `retryable`, and the launch and engine-start ids. The root and the relaunch classifier
read the record; when it is missing they fall back to the exit code and classify the end as a crash.
The projection keeps writing `run_stop.reason`, so the string rules of 011 hold under the oracle
(R19 C-08).

#### A-7 The detached runtime

`inferred` from F-01, F-03, F-04, F-05, R3:118, R14:159-163, R17 recommendation part 1, R11 T-26 and
T-47, DP-005, DP-043.

##### A-7.1 The process tree of a run

```
specstride launch            (CLI, exits after the handshake)
   └─ runtime root           (session leader; supervisor role and pipeline stage executor)
        ├─ stage child       (kinds setup, command, smoke: any declared argument list)
        └─ engine            (kind specstride; one at a time)
             ├─ harness process, one per pass or critic call, own process group
             ├─ check command, own process group
             └─ detached job of a yield, own session (outlives the pass; in the process registry)
```

The root accepts a **run request** of one of two kinds. `pipeline`: a promoted launch contract, which is
what `specstride-run` produces. `engine`: one engine invocation with its arguments, which is what
`specstride-reverse` and `specstride run --detach` produce. The second kind has no contract to validate
and no stages; it has the same lock, lease, relaunch classifier and digest. This keeps one detach
mechanism for both skills (DP-R15-8).

The rendered launcher stays a file the operator can see and run (011 FR-010), now a Node-shebang file
(DP-043) whose only job is to call the pipeline entry with the bundle hash. The bundle is in the control
plane. The root verifies the bundle hash and the launcher's own digest at launch and at every relaunch
(R11 T-47).

##### A-7.2 What the host skill does and what the runtime does

| Step | Host skill (model, through the CLI) | CLI (deterministic, short-lived) | Runtime tree |
|---|---|---|---|
| Derivation | Judges bounded batches of items the inventory could not settle, at most 3,000 tokens each (DP-023); records provenance | Inventories the sources, hashes them, pages the judgment items | — |
| Validation and promotion | Reads the result line | Validates; only validation promotes (Principle XIII) | — |
| Comment | Passes the consumer's comment verbatim and says what it changed because of it | Stores the comment with its hash before any repository text is printed (R11 T-09); redacts it | Records both in events and digest |
| Launch | Invokes `launch`, or `launch --dry-run` | Runs the launch checks (the `lb` subset), writes the launch record, starts the root, waits for the handshake, prints one line | Takes the lock, writes the lease |
| Supervision | Decides what to tell the consumer and whether to ask for a `resume` | `wait --until-change` prints nothing while nothing changes; `status` prints one line from `RunView` | Runs the loop; pauses; relaunches classified transients within budget |
| Diagnosis | Reads the digest and the attention items; may read a named feedback file when the consumer asks | `status --json`, inspection verbs | Writes what is diagnosed from |
| Report | Prints the digest verbatim | Prints the terminal digest line | Produces the digest from events (R11 T-11) |
| Stop | Invokes `stop` | Writes the stop request; with `--now` signals the recorded groups after the identity check | Honours the request at boundaries |

Decision 5 gives supervision to the host skill. In this architecture the host **observes and decides
what to ask for**, and the deterministic part of supervision, the relaunch classifier with its budget,
runs in the runtime root. The reason is F-03: a classifier that runs in the host can act only while a
host session is open. The classifier itself is ported unchanged (011 FR-021, FR-022), including every
named refusal. `specstride supervise` keeps its verbs and exit codes for parity; in the product they are
readers, plus `relaunch` for the case in which the root itself is gone (DP-R15-3).

##### A-7.3 Life cycle

| Phase | Mechanism |
|---|---|
| **Start** | `launch` resolves the run request, runs the launch checks, writes `launch.json` with a fresh launch nonce, and calls the detach strategy (EP-17). The default strategy starts `node <runtime entry>` as the leader of a new session with stdin closed and stdout and stderr on `runtime.log`. The environment is an allow-list |
| **Handshake** | The root takes the workspace lock, writes `lease.json` holding the launch nonce, and emits `run.launched`. `launch` polls for a lease with its nonce for a bounded time, prints `[SPECSTRIDE-LAUNCH] run=<id> state=running`, and exits 0. Without a lease in time it prints the refusal and exits with the supervisor's refusal code |
| **Detach** | Nothing connects the root to the host afterwards: no pipe, no socket the host must keep, no parent that waits |
| **Liveness** | `lease.json` carries the owner record of EP-13 and is touched as a heartbeat at a fixed interval. A reader calls `probe`. Liveness is never an event (R14 EV-29). `stale` means a live owner whose heartbeat and events are both old, for example a machine that slept; a paused run recomputes from `resumeAt` on wake and not from a timer (R14 risk 10) |
| **Re-attachment** | A new host session knows nothing. The `SessionStart` shim prints `status.line` if a run exists in this workspace, without starting Node (R17). `status` projects `RunView`, probes the lease and lists the attention items. Re-attachment is reading; there is no channel to re-open |
| **Stop** | `stop` writes `inbox/stop.request`. The engine reads it at the boundaries of today and during a pass (028 FR-015). `stop --now` signals each process group in `procs/` whose pid, start time and run token match, the detached jobs included, because a job in its own session escapes a group signal (R2v:227) |
| **Crash of the engine** | The root sees an exit outside 0 to 6, or a signal. It writes the terminal record with the cause `crash`, asks the classifier, and relaunches within budget. Counts and attempt ids come from the ledger (decision 23). The ledger's resume states decide what happens to an open unit (R23:248-261) |
| **Crash of the root, or a reboot** | Nothing relaunches by itself in Wave 1. The run is `dead` to every reader, `attention[]` holds `dead-run`, and the `SessionStart` shim says so. `resume` starts a new launch, which reclaims the lock, closes the dead launch with `run.ended{synthesized: true}`, re-enters a pause if `pause.record` exists, and continues at the first phase without a valid approval record. A service strategy that survives a reboot is a roadmap implementation of EP-17 |
| **Orphans** | If the owner is dead and a recorded group is alive, `probe` returns `owner-dead-group-alive`; `resume` refuses and names the survivors, and `stop --now` ends them |

##### A-7.4 What has to be proven before the specification freezes

The default detach strategy is `unverified` inside a host session (F-05). Feature 122 starts with a
spike on Linux and macOS: start the root from a command run by the host's shell tool in an interactive
session and under `claude -p`, with the shell sandbox off and on; end the session; confirm the root
lives and its log fills. If the default strategy fails under the sandbox, `foreground` and `service`
are the fallbacks and the doctor names the one in use. The architecture does not depend on the outcome,
because the strategy is an extension point.

#### A-8 Where `stage-parallelism-research.md` and R26's constraints fit

`inferred` from the note and from R26's recommendation, which is taken as given.

| Level in the note | What runs concurrently | Component that would own it | Wave 1 | What Wave 1 builds in so that it is an addition later |
|---|---|---|---|---|
| L1 stages | Sibling stages of one launch contract | The **pipeline stage executor** in the runtime root | Serial | The contract schema keeps `depends_on` and accepts an optional `stages[].writes[]`, validated and unused. Stage state is keyed by stage id. The resume predicate is defined over groups of stages, with groups of one |
| L2 features | Two engine runs | The pipeline stage executor, with one **workspace per run** | Serial | A-5: state and lock are per workspace; nothing mutable is shared between workspaces. A second workspace, such as a worktree, has its own control plane |
| L3 tasks, by merge | `[P]` units inside a phase | A **loop layer** (EP-04) | Rejected by the note and by R26 for Wave 1 | EP-04 takes the working directory as a parameter; a unit record carries `writes[]`, empty meaning the whole tree; unit and check events carry a worker id |
| L3 by selection | N proposers on one phase attempt | The **attempt planner** (EP-18) | Not in Wave 1; R26 recomputed the note's figure as 1.2 to 1.3 times faster at 1.5 to 1.6 times the cost | The planner seam; `attemptId` names a directory, so candidates can be siblings |
| Verification commands | Independent commands of a gate | The **check runner** (EP-05) | Option, off, `verification.parallelism` default 1 | Declared write scopes; undeclared means serial |
| Overlap of a detached wait with other work | — | — | Saves nothing in the reference run (R26 Q5) | — |

The six constraints of R26 and R27 (R27:546-549) and where each is met:

| Constraint | Met by |
|---|---|
| Run state and lock are local to the workspace | A-5.1, EP-13 |
| The unit executor takes its working directory as a parameter | EP-04, EP-05 |
| A unit record carries `writes[]` | The ledger record of `units/<unitId>/` |
| Unit and check events carry a worker id | The event envelope; LR-5 keeps the append lock for it |
| The descriptor has optional `tiers` and `session.*` fields | EP-02 capabilities |
| Toolchain pattern sets are versioned data | EP-16 |

Two things the note warns about are kept as rules: the launcher schedules stages and never tasks, since
it "is a control layer … not a second gate authority"; and a concurrency claim without declared write
sets is a blocker, not a default. Shared resources outside a workspace (a lab, a port, a quota window)
are not covered by any lock here. Jobs declare a `resource`, the runtime emits `resource.wait`
(R14 EV-10), and the doctor names resources it cannot check (R26 recommendation 3a).

#### A-9 Feature decomposition

##### A-9.1 Why §6 cannot stand as it is

`inferred` from F-08. At today's grain of 6.7 items per requirement the 2,783 inventory items need about
415 requirements. Decisions 5 to 23 and the research add requirements that have no as-is behaviour: 34
event requirements (R14 EV-01 to EV-34), 60 integrity rules (R27 D1.9), 44 doctor checks (R16), the
discovery design (R20), the config schema (R16 F6), the detached runtime, the terms gate. A cautious
total is 650 to 750. At 40 per feature that is 17 to 19 features if the load were even, against 14 in
§6. It is not even. Estimates per §6 feature, from `size.py` and the module counts of R18 Appendix A
(items divided by 6.7, plus the new requirements named):

| §6 feature | Inventory items it receives | Estimated requirements | Verdict |
|---|---|---|---|
| 101 gate-and-verdict | about 440: `critic` 225, gate share of the drivers about 175, `verdict_pins` 9, and the transports | about 65, plus the approval record and the invariants | **split** |
| 102 run-control | about 370: run control about 145, front door 77, `present` 80, `banner` 23, `theme` 19 | about 55, plus lock, lease and state machine | **split** |
| 103 proposer-pass | about 330: loop accounting and prompt about 135, supervision 82, yield and jobs 82, `failure_ledger` 11 | about 50, plus carry-over and the layer's hook points | **split** |
| 104 spec-input | about 130 | about 22 | keep |
| 105 verification | about 145 | about 21, plus about 10 new | keep |
| 106 learning | about 185 | about 29 | keep |
| 107 contract-launcher-supervisor | about 300 | about 45, plus the detached runtime, about 20 | **split** |
| 108 reverse | about 395: `reverse` 264, `reverse_inventory` 104, front door 28 | about 59 | **split** |
| 109 adapter-seam-claude | about 320: invocation 96, overlay 32, registry 15, stream and invocation modules 173 | about 48, plus discovery about 35 and the Claude adapter about 20 | **split** |
| 110 config-auth-quota | the `env` and `cli-flag` items of every module, about 300 | the schema about 30, tiers and terms about 14, quota, pause, fallback and budgets about 35 | **split** |
| 111 observability | about 170 telemetry items and 62 event names | EV 34, projection about 8, `RunView` about 20, export about 32 | **split** |
| 112 doctor | none from the Python systems | about 30 | keep |
| 113 host-claude-code | skill rules, onboarding | about 35 | keep |
| 115 micro-loops | none | 60 integrity rules, D1.2 to D1.13, the router table, fail-fast | **split** |

##### A-9.2 The recommended decomposition

Feature numbers beyond §6 are provisional; the orchestrator assigns the final ones. Numbers 130 to 139
stay with the ten named adapters. Every feature below is Wave 1 unless marked. "Est." is the estimated
number of requirements.

| Feature | Scope | Receives from | Est. | Change against §6 and why |
|---|---|---|---|---|
| 100-specstride (umbrella) | As §6, plus: the extension-point contracts of A-3 with their versions, the layering rules of A-2, the logical state names (SL-4), the identifiers of A-5.2, the run-state machine of A-6, the closed stop-reason enum, the CLI protocol, the conformance suites as integration acceptance | 028, 011, 002 | — | **Extended.** It must be specified alone and first (prompt §6), and with 26 features citing it the contracts carry more weight |
| 101-gate-and-verdict | The gated phase loop; nonce verdict; MALFORMED limit; oscillation; the recovery cycle; attempt archive; approval record; post-approval steps; the attempt planner and critic strategy seams (EP-18); invariants IR-01 to IR-07 | 028, 002 | 40 | **Narrowed.** Grounding, critic prompt and transports leave |
| 117-critic-grounding-and-prompt | Grounding snapshot with its caps and refusals (IR-45, IR-59); the critic's prompt assembly and window fitting; verdict pins; the slot and the escaping of the fact block (IR-44); data framing of untrusted text | 028, 002 | 28 | **New, split from 101.** `lib/critic.py` alone has 225 items, 205 of them with no FR |
| 102-run-control | Stop, resume and its refusals (C-03), the run snapshot with pinned and tunable keys, counts that survive and the reset flag, the operations of the run-state machine | 028, 002 | 30 | **Narrowed.** The front door leaves; lock and lease go to 122 |
| 119-front-door-and-presenter | The front-door verbs, inspection commands, output lines, the presenter, banner and theme | 028, 002 | 30 | **New, split from 102.** 199 items, nearly all without an FR |
| 103-proposer-pass | The pass loop ported for parity; breakers; no-progress; pass budget; the hook points of EP-04; the prompt assembler (EP-15); carry-over: ledger, handoff, obligations index, cache-stable start, polite stop | 028 | 36 | **Narrowed.** Supervision and yield leave |
| 118-pass-supervision-and-jobs | Idle, progress and repeat watchdogs; hard cap and kills; the yield artifact and its predicates; detached jobs; **fail-fast for long verification jobs**: the first-failure predicate, and the step runner as an option | 028 | 36 | **New, split from 103, and it takes fail-fast from 115.** R27 gives fail-fast its own switch and its own ablation and states that nothing may ride on the layer's switch (IR-52); it acts on a yield, which is specified here |
| 104-spec-input | As §6, with the canonical model of EP-03 | 028, 011, 002 | 22 | Unchanged |
| 105-verification | As §6, plus the plan sources (EP-07), the manifest derivation, the check runner (EP-05), the integrity rules that hold with the layer off (IR-31 at the gate, IR-33, IR-54), the concurrency option | 028, 011, 002 | 34 | **Extended** with two extension points |
| 106-learning | As §6 | 028, 011 | 29 | Unchanged. It is also the across-runs layer that R12 keeps |
| 107-launch-contract | Inventory, derivation in bounded batches, validation, promotion, rendering, bundle, dry-run, the consumer's comment, which verification mode derivation sets (DP-064) | 011 | 25 | **Narrowed** to the contract |
| 123-pipeline-runtime-and-supervisor | The stage executor; in-stage retry; the six launch checks; the relaunch classifier and budget; `supervise` verbs; the digest and `[MOL-*]` lines; the run request of kind `engine` | 011 | 32 | **New, split from 107.** It is the parity port of `runtime.py` and the supervisor |
| 122-detached-runtime | Detach strategies (EP-17), lock and liveness (EP-13), lease and heartbeat, process registry, inbox, re-attachment, crash recovery, the spike of A-7.4 | research, 028, 011 | 22 | **New.** Decision 5 says the mechanism "is ours to design"; it has no as-is owner, and two features (102 and 107) would otherwise each own half of it |
| 108-reverse | The wrapper and its refusals, plan, driver spec, guard, the `specstride-reverse` run request | 028 | 27 | **Narrowed** |
| 140-reverse-inventory-and-lint | Source inventory, fingerprint, manifests; the linter with its finding codes per level | 028 | 33 | **New, split from 108.** 368 items in two modules |
| 109-harness-seam | Registry, harness port with two levels, descriptor schema, generic adapter, containment levels, config-home overlay, environment allow-list, the conformance suite | 028, 002 | 30 | **Narrowed** |
| 124-harness-discovery-and-roles | The seven discovery sources, the probe ladder, the four states and promotion, role resolution, the critic order and auto-pick with its announcement | research | 30 | **New, split from 109.** It has no as-is behaviour and its own threat rows (R11 T-13 to T-16) |
| 125-adapter-claude | The Claude adapter as proposer and tool-less critic through the CLI; continuation; isolation; permission mode; quota signals; version pin | 028, research | 25 | **New, split from 109.** The first adapter is specified against the seam exactly as the 13x adapters will be, which tests the seam |
| 126-stream-seam-and-invocation | Stream readers and the tap; invocation identity, envelope, reconciliation and retention | 028 | 30 | **New, split from 109.** 173 items of which 171 have no FR |
| 110-config-and-terms | Schema, precedence, trust classes, environment aliases, secret references and resolvers (EP-10), tiers, the terms gate and its data (EP-11) | 028, 011, 002 | 44 | **Narrowed.** At the limit; if it exceeds it after `speckit-specify`, the terms gate leaves first |
| 127-quota-budgets-and-pause | Quota classifier (EP-12), pause and resume, fallback, budgets, alerts and their delivery | 002, research | 35 | **New, split from 110** |
| 111-event-schema-and-projection | The event schema and writer, EV-01 to EV-34, the redaction ingress, the legacy projection and its sink contract (EP-08) | 028, 011, 002 | 44 | **Narrowed.** At the limit; the projection leaves first |
| 128-telemetry-export | The OTLP exporter, Loki sink, metrics, dialects, content capture, the shipped stack | 028, 002 | 32 | **New, split from 111** |
| 129-run-view-and-status | `RunView` (EP-09), reducer, lanes, attention, cursor; `status`, `wait` and `status.line` | 002, research | 22 | **New, split from 111.** It is the UI data contract and the supervision cycle's only input |
| 112-doctor | As §6, as a registry (EP-14) | 002, research | 30 | Unchanged |
| 113-host-claude-code | As §6, against the host port (EP-01) | 011, research | 35 | Unchanged |
| 115-micro-loop-layer | Units and checkpoints, keep, repair and unresolved, caps, the closing check, resume states, the `[LOOP]` line, the router table (EP-06) with escalation, inertness, the tripwire, the experiments that keep or revert the default | research | 38 | **Narrowed** |
| 116-check-integrity-and-unit-evidence | The protected set, fingerprints, taint and the other conditions, toolchain profiles (EP-16), the fact block the critic receives, the integrity rules of the layer | research | 34 | **New, split from 115.** 60 rules do not fit one feature, and this half is what R23v attacked |
| 114-memory | — | — | — | **Not specified.** R12 recommends against it and DP-018 proceeds on that. What a memory feature would have needed from the engine exists as EP-15. The lessons store is a roadmap entry. The number stays unused |
| 120-host-dsh, 121-kanban-ui | As §6 | research, 002 | — | Wave 2, unchanged |
| 13x-adapter-\<harness\> | As §6. Each is a descriptor, optional code hooks and fixtures against 109 | — | — | Wave 3 and later, unchanged. `prime_stream` (41 items) and `dsh_plugin_requests` (11) travel with their adapters |

Wave 1 has 27 features and the umbrella, against 14 and the umbrella in §6 (15 with 114-memory). Nine features of §6 are
split (101, 102, 103, 107, 108, 109, 110, 111, 115) into 21, and one is new (122).

**What this costs.** Thirteen more runs of the five Spec Kit steps in Stage B. More seams between
features, so the cross-feature review of §6 has more to check, and feature 100 must be complete before
the fan-out. The estimates rest on a coarse keyword count; two features sit at the limit and may split
again. **What it buys.** No feature is expected above 44; each split follows a seam that the
architecture has anyway (a package or an extension point), so a feature can be specified, implemented
and tested against its conformance suite without reading its neighbours.

**Dependency order for Stage B** (each feature cites only contracts of feature 100 and of features
earlier in the list): 100; then 104, 110, 111, 109, 122; then 105, 126, 124, 125, 127, 129, 117; then
101, 103, 118, 102; then 116, 115; then 106, 107, 123, 108, 140, 119, 128, 112, 113.

#### A-10 Where the constitution amendment should change

The architecture satisfies draft v3.0.0 except where it proposes a wording.

| Principle | Draft text | Proposed | Why |
|---|---|---|---|
| I | "The detached runtime is one process per run that ends when the run ends; it serves no other process." | "A run has one detached process tree, rooted at one runtime process that ends when the run ends. The engine is its child. The tree serves no other process; an endpoint that carries no data and exists only so that the kernel shows whether its owner lives is not a service." | Q2; the liveness signal of DP-005 |
| I | (absent) | "State the runtime relies on to decide something is kept outside the working tree. Processes outside the runtime tree write requests to an inbox and nothing else." | A-5; LR-3, LR-4 |
| VI | "A new one must not require a change to the core." | Add: "Every extension point has a version, a conformance suite and a sample implementation outside the core, and CI proves with them that the core does not name its implementations." | A-3, common rules |
| XIII | — | Add: "A routing or classification decision is made by a pure table and recorded with its rule id." | LR-7 |
| XVI | "The supervisor never edits run state, removes a lock it does not own, or deletes a run directory. It relaunches only a stop that the run's own records classify as transient, within a declared budget." | "Supervision in the host only reads. Relaunch is done by the runtime root, only for a stop that the run's terminal record classifies as transient, within the declared budget. Nothing removes a lock whose owner lives, and nothing deletes a run directory." | F-03; A-7.2. In the draft the supervisor both "only reads" and relaunches, which was true of a host-side supervisor and cannot be true of one that acts without a host |
| Constraints, "State" | "One unified layout" | "One layout with three roots: user-level state, a control plane per workspace outside the working tree, a workspace part." | A-5.1 |
| Constraints, "Single run per workspace" | names the mechanism | Name the interface (EP-13) and the observable contract; leave the mechanism to the feature | Evolvability; DP-005 may still be ruled otherwise |
| Plan template, gate VI | lists core dependencies | Add "the feature names the extension points it implements or consumes, with versions" | A-3 |

#### A-11 Self-check against the owner decisions

| # | Decision | How the architecture satisfies it, or the tension and the DP that carries it |
|---|---|---|
| 1 | Full-parity rewrite in TypeScript | Every module of R2's port maps has a package (A-4). Process boundaries are kept where a per-process exit code exists (LR-6), so codes and output lines compare as they are |
| 2 | TypeScript first | Every package is TypeScript. The Language Ledger is empty. EP-13 and EP-17 are where a native component could enter, behind an interface (DP-005, DP-043) |
| 3 | Greenfield state | A-5: one new layout, old trees not read (SL-7). Paths are reached through logical names (SL-4) |
| 4 | Differential oracle | The engine, the pipeline entry and `supervise` are commands with today's codes. The engine is substitutable by `PATH` (F-09). Switches are product configuration (LR-10). The legacy projection is a sink (EP-08). **Tension:** a second pipeline on a held workspace now ends at launch with 24 where today it ends with 22 and child exit 5: register row (DP-R15-4) |
| 5 | Hybrid runtime | A-7. Host and runtime share files only (LR-2, LR-3). **Tension:** the relaunch classifier moves from the host to the runtime root (DP-R15-3). **Risk:** detach survival inside a host session is `unverified`; the spike of A-7.4 and EP-17 carry it |
| 6 | Tiered auth, terms gate | Tier is a field of role resolution (EP-02); the gate is data (EP-11); secrets are references (EP-10). Tier 3 is not a valid value. The audience split is DP-042 and DP-057 |
| 7 | Critic independence | Role resolution applies the order of decision 17 once, at launch. The critic is a `completion` call, refused unless its initial record shows no tools and the minted session. The warning is a doctor check that is never launch-blocking |
| 8 | Quotas: pause, optional fallback | `paused-quota` is a state with a live process (A-6); the classifier is EP-12; fallback is re-gated by the terms gate; alerts have one source, the engine (R14:206). DP-028, DP-030, DP-032 |
| 9 | Config precedence | The `config` package implements R16's extended order; the core receives resolved configuration and never reads a file. The extra layers are DP-058 |
| 10 | Recorded versions | A tested adapter declares its range and `verified-on` in its descriptor; each pass records the version; a doctor check compares |
| 11 | One observability contract | One event stream with one writer at a time (LR-5); one exporter as a sink; doctor, `status`, hooks and UI read `RunView` only (EP-09) |
| 12 | Linux and macOS | No native module. Process start time, boot id and group signalling sit behind the kernel package and EP-13, each with a macOS path that is `unverified` until a runner exists (DP-006) |
| 13 | Delivery waves | Wave 1 holds the core, the Claude Code host, the Claude adapter, the doctor and the observability contract. The seam (109) is specified apart from the first adapter (125), so later adapters repeat 125's shape |
| 14 | Doctor on every host | One registry (EP-14), one command, exposed per host through `renderEntry` of EP-01 |
| 15 | Skill-trigger evals | `evalDriver` of EP-01. Claude Code delegates to `claude plugin eval`; dsh needs its own driver (DP-002) |
| 16 | Context budget | LR-2; the CLI protocol is part of EP-01 with budgets per command; `wait` prints nothing on no change; hook shims print a precomputed file. Derivation is split between CLI and host (DP-023) |
| 17 | Harness discovery | EP-02: an open registry, the generic adapter, consumer descriptors. No list of harnesses appears in any interface; enumerations read the registry. Widening entries come from user scope only (DP-009). DP-025, DP-026 |
| 18 | `specstride-run` launches by default | `launch` is the default path and `--dry-run` withholds consent. The comment is stored verbatim before repository text is read and cannot reach a check, the gate or a budget, because no flag for that exists (R11 T-10) |
| 19 | MIT, npm, public later | One published package, no install script, no native code, no proprietary SDK bundled. Nothing in an interface names a path or account of the owner's machines. DP-015 |
| 20 | Routing is open | Q1. The router is a rule table at three decision points in one layer (EP-06). Role choice is role resolution. DP-031 |
| 21 | Micro-loops on by default | One engine; the classic loop is the layer `none` (EP-04). The layer holds no gate writer and no outer counter. Checks run through the runtime's runner (EP-05). The critic's view is the fact block. L1 needs only `proposer` capabilities P1 to P6, so it works on a discovered harness. **Tension:** at C0 "cannot edit a check" is detection (DP-040, DP-046); the 25 % target is not reachable by the layer alone (DP-061) |
| 22 | Session continuation within an attempt | The session directive of `startPass` is `fresh` or `continue`. Session state lives under the attempt and is removed with it. The critic's request type has no `continue`. DP-035, DP-036, DP-038 |
| 23 | Counts survive a resume | Counts live in the ledger of the logical run; `attemptId` is never reused; the reset flag comes from the command line only. DP-037, DP-053 |

## Version/date pins

| Item | Value |
|---|---|
| Date | 2026-09-29 |
| Specstride | `9cab15d`, working tree of `/root/specstride`; lines cited from `orchestrator.sh` were read there |
| mixture-of-loops | `9c88f86`, read with `git show 9c88f86:skills/mixture-of-loops/scripts/<file>` |
| Lisa | Per R1 and DP-013: local `main` `363e6a3` for 18 packages, `76adfdc` for `packages/dashboard`. No Lisa file was re-read for this report |
| Router prototype | `/root/mixture-of-loops_lisa/prototype/router/rules.py` (193 lines), `signals.py` (232 lines); design document dated 2026-09-09 |
| Parallelism note | `stage-parallelism-research.md`, status "Current", findings verified by its author on 2026-09-10 |
| Inventory | `R18-behaviour-inventory.tsv`, 2,783 rows, 255 clusters |
| Integrity rules | IR-01 to IR-60 as in R27 |
| Pending decisions relied on | DP-001 to DP-066 as in `DECISIONS-PENDING.md` on 2026-09-29 |
| Extension-point versions proposed | Every EP at major 1; descriptor `descriptorVersion: 1`; event schema `specstride.event` v1; `specstride.view/1`; `specstride.config/1`; `specstride.doctor/1`; CLI protocol 1 |
| Host and harness versions | As in `research-synthesis.md`; none was run for this report |
| External documentation | None consulted. No claim here is `verified-doc`; claims about hosts and Node rest on R2, R2v, R3, R3v, R4 and R5 |

## Options compared

### O-1 Loop and router

| Criterion | A. Loop only, fixed behaviour | B. Router on top: it picks a mode per phase, as in the prototype | **C. Loop as control structure, router as a table consulted at decision points** |
|---|---|---|---|
| Principle II (every phase is judged by an independent critic) | holds | broken for two of three modes (F-02) | holds |
| Decision 21 (one engine; classic is the layer off) | holds | a second executor per mode | holds |
| A new kind of loop without an engine change | no | a new mode and a new driver | a new layer (EP-04) and rule rows (EP-06) |
| Decisions can be replayed and disputed | nothing to replay | yes | yes, `route.decided` with rule id and signals |
| Evidence for up-front routing on coding work | — | negative or unproven (R25 Q2) | not used; escalation on a deterministic failure only |
| Cost | none | two ungated paths to keep safe | a rule table, a versioned choice set per decision point, one event type |

### O-2 Process model of the merged runtime

| Criterion | A. Three long-lived processes as today (supervisor, pipeline runtime, engine) | B. One process, engine as a library | **C. Runtime root and engine child** | D. A small guardian and one merged runtime |
|---|---|---|---|---|
| Nested locks (R19 C-05) | two locks; needs a rule | one lock | one lock, handed down as a lease | one lock |
| Relaunch without a host session | yes | **no**: an engine fault ends the only process | yes | yes, but every fault ends the whole runtime |
| Crash isolation of the component that parses streams and builds large prompts | yes | none | yes | none inside the runtime |
| Stage timeout and kill (011 FR-015) | signal to a group | needs cooperative cancellation in every engine path | signal to a group | needs cancellation |
| Environment rules per stage (011 FR-016) | a child environment | must be emulated in-process | a child environment | emulated |
| Oracle: per-process codes and lines | as today | codes become return values; the engine stub needs an injection seam (F-09) | as today for the three observed commands | as B |
| Detached runtime of decision 5 | one more process than needed | simplest | one root to detach | two to detach |
| Memory over a run of days | each engine start is a fresh process | one heap for the whole run | each engine start is a fresh process | one heap |
| Event writer (F-10) | three writers | one | two, never at the same time (LR-5) | two |
| Cost | about 100 MB idle, three starts, most process code | least code | about 60 MB idle, one extra start of about 80 ms per stage attempt (R17), a lease hand-down, a terminal record | a guardian that knows nothing about stages |

R19 C-05 leaned toward B with the result record of A. This report takes C with that record. The record
is what R19 wanted from B; the process boundary is what the oracle, the timeout rules and relaunch want
from A.

### O-3 Where the control plane lives

| Criterion | A. Inside the working tree, `.specstride/` as today | B. Inside the working tree, with sandbox rules that deny writes | **C. Outside the working tree, per workspace, in the user's state directory** |
|---|---|---|---|
| Protection where the harness has a sandbox | none | depends on a deny rule per harness, each `unverified` | follows from the sandbox's default scope |
| Protection at C0 and C1 | detection | detection | detection |
| Grounding can be led to control files by a citation | yes (R23:196-202) | yes | no; refused by root |
| State is visible beside the code | yes | yes | no; `specstride status` and the doctor print the path |
| The workspace is moved or renamed | state moves with it | state moves with it | the control plane is orphaned; an explicit adopt command is needed |
| Workspace shared between a host and a container | one state, pids meaningless across the boundary | same | two control planes; neither sees the other's run. The evidence in the workspace part is still shared |
| R26: nothing mutable shared between workspaces | yes | yes | yes |
| `git` hygiene | the whole tree must be ignored | same | only the workspace part |

### O-4 How an implementation is added

| Criterion | A. Branches in the core per harness, format, sink | B. Data only | **C. Data for consumers, registries of first-party code** | D. C plus third-party code loaded from npm |
|---|---|---|---|---|
| A consumer's new harness without a release (decision 17) | no | yes | yes | yes |
| A new stream format, loop kind or sink | core change | not expressible | a package and a registration, no core change, but a product release | a package the consumer installs |
| Code that runs inside the trusted computing base | the product's | the product's | the product's | anyone's (R11 T-13, T-44) |
| Cost | none now, all later | a schema per point | a conformance suite and a sample per point | C plus a loader, a trust model and a support promise |

C is proposed for Wave 1 and D is designed for: the registration call and the conformance suites are the
ones a third-party package would use.

### O-5 Feature decomposition

| Criterion | A. §6 as written | B. Split only what exceeds 40, by size | **C. Split along the seams of the architecture** |
|---|---|---|---|
| Features expected above 40 requirements | 9 of 14 | 0 | 0, two at the limit |
| A feature maps to a package or an extension point | partly | no | yes |
| Stage B runs | 15 | about 25 | 28 |
| Risk | features too large to analyze; items without an owner | seams between features cut through a component | more features to keep consistent; rests on coarse estimates |

## Recommendation

**One recommendation: adopt the architecture of Part II as the draft for `architecture.md`, the
decomposition of A-9 as the draft for `feature-briefs.md`, and sections A-2, A-3, A-5 and A-6 as the
cross-feature contracts of feature 100.** Its fixed points:

1. Loop and router, not peers: loops at every level, one rule table consulted at three decision points
   in the pass-loop layer, role resolution outside routing.
2. One process tree per run: a detached runtime root and an engine child, one workspace lock handed
   down as a lease, a typed terminal record beside the exit code.
3. Seventeen public extension points and one pair of internal seams, each with a version, a
   conformance suite and a sample implementation outside the core. Consumers extend by data in
   Wave 1; code extensions are first-party.
4. A core that imports the contracts and the kernel and nothing else.
5. State in three roots, with the control plane outside the working tree and reached through logical
   names.
6. A run-state machine in which the host writes no transition, a pause is a state, and
   blocked-on-human is a resting state.
7. Relaunch inside the runtime root; the host observes.
8. No parallelism of agents in Wave 1, with six constraints built in.
9. Twenty-seven Wave 1 features and the umbrella; 114-memory not specified.

Confidence: **high** that the router must not replace the gated loop and that role resolution is not
routing (decisions 20 and 21 and Principle II leave no other reading). **Medium-high** on the process
model: the reasons are structural, and the one open fact, detach survival inside a host session, is
behind an extension point. **Medium-high** on the list of extension points; R15v should attack EP-04's
closed directive set and EP-06's choice sets first. **Medium** on the control plane outside the working
tree: it is the stronger design for integrity and the more surprising one for an operator. **Medium**
on the feature decomposition: the need to split is well evidenced (F-08), the exact cuts rest on a
keyword count. **Low** on every estimate of requirements per feature.

**What evolvability costs here.** A conformance suite and a sample implementation for each of 18
points. A registration step and a resolved-registry record at every launch. A second Node process per
run. Interfaces that say less than an implementation could use: EP-04 has a closed directive set and
EP-06 closed choice sets, so a new kind of loop that needs a new directive is a new major of the point
and not a plug-in. Thirteen more features to specify. A control plane the operator does not see beside
the code.

## Matrix rows

None. No harness or host fact was established by this report. Two suggestions for the matrices in
`research-synthesis.md`, neither a new fact: the Host Capability Matrix gains a column **detach strategy
(verified or not)** once the spike of A-7.4 has run; the Harness Capability Matrix keeps the three
columns R27 endorsed (micro level with protection level, session continuation, `tiers`).

## Open questions / risks

### For `DECISIONS-PENDING.md`

| ID | Question | Evidence | Default this report proceeds on | What changes if ruled otherwise |
|---|---|---|---|---|
| DP-R15-1 | Does the engine run as a child of the runtime root, or in one process? | F-01, F-03, F-09; O-2 | Child process, one tree, a lease handed down, a terminal record. Principle I is reworded (A-10) | In one process: a fault in the engine ends the run until a host or the consumer resumes it; stage timeouts need cancellation points; the oracle needs an injection seam for the engine stub; 011 FR-015 and FR-021 become `translated` (R19 open question 3) |
| DP-R15-2 | Is the control plane outside the working tree? | F-06; R11 R-1 and T-02; R23:196-202; O-3 | Yes, in the user's state directory, keyed by the real path of the workspace. `state.dir` of R16 becomes a user-scope key for the control root | Inside the working tree: prevention depends on a deny rule per harness sandbox; grounding needs a refusal list by path; R3's layout (`.specstride/run/<id>/`) stands as written |
| DP-R15-3 | Where does the relaunch classifier run? **This bears on decision 5**, which gives supervision to the host skill | F-03: a host-side classifier acts only while a host session is open; the reference run had no automatic relaunch | In the runtime root. The host observes. `supervise` verbs keep their codes. Principle XVI is reworded | In the host only: aim 3 (automatic relaunch) holds only while a host session supervises, and a run that stops at night waits for the morning |
| DP-R15-4 | One workspace lock in place of the pipeline lock and the workdir lock | F-01; R19 C-05 | One lock per workspace. A second launch of the same pipeline ends with 24 as today. A second pipeline on a held workspace ends with 24 at launch, where today it ends with 22 and child exit 5: a register row with a waiver for that fixture. A foreground `specstride run` on a held workspace ends with 5 as today | Two locks: the nested case stays as today and the launch check only reports it earlier |
| DP-R15-5 | Does "run" mean the logical run? | R14:234-235; decision 23; R19:159 | Yes. One engine process is an "engine start" and projects to the legacy `run_id` | If "run" stays one engine invocation, the identity that survives a resume needs another name, and `runs/<runId>/` in A-5.3 is renamed |
| DP-R15-6 | May consumers load third-party code extensions in Wave 1? | O-4; R11 T-13, T-44 | No. Consumers extend by data; code extensions ship with the product | Yes: a loader, a user-scope trust key and a support promise for the registration call enter feature 100 |
| DP-R15-7 | Is `blocked-on-human` a resting state? | R19 C-12 (b); A-6.1 | Yes in Wave 1: no process, lock released, `resume` by the consumer | A live blocked state needs an answer channel in the inbox and a process that waits, which is part of the deferred approvals feature |
| DP-R15-8 | Do `specstride-reverse` and `run --detach` use the runtime root without a launch contract? | Prompt §0 (both skills run the gated loop; runs last hours); A-7.1 | Yes, through a run request of kind `engine` | If every detached run needs a contract, reverse needs a generated contract and a profile of the validator that waives coverage rules |
| DP-R15-9 | The feature decomposition | F-08; A-9 | 27 Wave 1 features and the umbrella; 114 not specified | With §6 unchanged, nine features are expected above 40 requirements, three of them above 60 |
| DP-R15-10 | Lisa's Agent SDK harness is not extracted in Wave 1 | R5 recommendation 1; R8v open question 2; R1 F-B | Not extracted; `tap.ts` is reference only. This narrows DP-014's list | If extracted, the Agent SDK becomes an optional dependency in Wave 1 and its terms row applies (DP-021) |

None of these is hard evidence that an owner decision is infeasible. DP-R15-3 is the one that reads a
decision (5) more narrowly than its text; the evidence is F-03.

### Rulings on existing items that would change the architecture

| Item | If ruled against its default |
|---|---|
| DP-005 (lock) | Only the default implementation of EP-13 changes; a native module enters the Language Ledger |
| DP-009 (project config narrows only) | A trust prompt per repository enters the launch path, which sits badly with decision 18; EP-02 accepts descriptors from project scope |
| DP-010 (approval record) | `approvals/` holds bare markers; resume trusts presence; relaunch inside the root inherits the forgery path, which weighs more once relaunch needs no host |
| DP-014 (Lisa reuse) | With Lisa as the base, A-4 inverts and EP-04 and EP-18 have to be cut into Lisa's loop (F-07) |
| DP-023 (who reads sources) | If the host reads sources, `pipeline` loses the inventory and the budget of EP-01 cannot be fixed |
| DP-028 (pause is a state) | `paused-quota` becomes a stop with a timed relaunch; the root needs a wake-up and the classifier a new reason |
| DP-040, DP-046 (detect or prevent) | With prevention required, the layer `micro` is offered only where containment is C2 or higher and role resolution must know it at launch |
| DP-044 (gate on a snapshot), DP-056 (commits per unit) | Both need a store of trees owned by the runtime: a new directory under the run and a working directory that is not the workspace, which EP-04 and EP-05 already take as a parameter |
| DP-004 (viewer) | No effect on Wave 1; Wave 2 loses one renderer of EP-09 |
| DP-042, DP-057 (audience) | Data of EP-11 only |
| DP-058 (config layers) | The `config` package only; the core sees resolved values |

### Risks, and where R15v should look first

1. **Detach survival is unproven** (F-05). Everything in A-7 assumes a process can leave the host's
   process tree. The extension point limits the damage; it does not remove the need for the spike.
2. **EP-04 may be too narrow.** Its directive set is closed so that a layer cannot reach the gate. A
   kind of loop that needs to change the tree it works on (`autoresearch` in a scratch copy) has the
   working-directory parameter, but nothing here shows that eight hooks are enough for it. No such
   layer exists to test against.
3. **One writer at a time** (LR-5) holds only because the root does not write while an engine lives.
   A detached job, a hook shim and the CLI all have something to say during that time; they go through
   the inbox or not at all. If a later feature makes the root write while the engine runs, the append
   lock becomes load-bearing and `seq` assignment needs a test under contention.
4. **Learning events.** Today they go to the feature's own event file and carry `ts` without `time`
   (R18:100-103). In A-5 there is one event stream per run. The projection must write the second legacy
   file, or the register needs a row. Not designed here.
5. **The rendered launcher is in the workspace**, where the proposer can write. The bundle hash and the
   launcher's digest are verified at launch and relaunch (R11 T-47); an edit is detected, not
   prevented.
6. **Workspace identity by real path.** A symlinked checkout, a bind mount or a renamed directory gives
   a new identity. The adopt command and the doctor check are named and not designed.
7. **Relaunch parity.** With the classifier in the root, a relaunch is a function call and not a new
   launcher process. `harness-run.json` records a pid per launch today. The projection can write the
   root's pid for every launch; whether any consumer of that file notices is `unverified`.
8. **The environment rule of 011 FR-016** (learning variables stripped from children) is kept because
   the engine is a child. The same rule for a foreground `specstride run` is today's behaviour of the
   engine alone and is untouched.
9. **macOS.** Process start time, boot id, group signals and the keychain existence check are
   `unverified` (DP-006). They sit in two packages, `kernel` and `runtime`, so the first macOS runner
   tests a small surface.
10. **Estimates.** The keyword count assigns an item to the first matching topic. The split of
    `orchestrator.sh` and `proposer.sh` between features will move when the traceability rows are
    assigned per cluster (DP-059).
11. **Feature 100 becomes large.** It owns 18 extension-point contracts, the state names, the state
    machine, the enums and the CLI protocol. If it exceeds what one specification can hold, the
    contracts are split by layer into annexes of feature 100, not into features, so that every other
    feature still cites one source.
12. **No owner decision is contradicted** by anything found here.
