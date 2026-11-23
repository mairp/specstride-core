# R15v — architecture red team

Written 2026-09-29 by verifier R15v. Independent review of
`docs/ecosystem/research/R15-ecosystem-architecture.md` (the draft architecture). Read-only work.
No paid model call, no harness CLI invoked, no subagent, nothing executed against a source repository.
Baseline code was read with `git show <commit>:<path>` only.

Tags: `verified-local` = read by me at the cited line or produced by the cited command.
`inferred` = reasoned from the facts named beside it. `unverified` = could not be confirmed.
"R15:<n>" is a line of the R15 report. "B-nnnn" is a row of `R18-behaviour-inventory.tsv`.

Severity: **blocks** (the specification cannot be written correctly, or an owner decision or the oracle
fails, until it is resolved), **weakens** (works, but an aim is only partly met or a later change
reaches the core), **cosmetic**.
Route: **adopt** (a change the synthesis can make without the owner) or **owner** (a decision).

## Method

1. Read `BRIEF-COMMON.md`, prompt §0, §2 (decisions 1–23, known tensions) and §6 in full; R15 in full
   (1,173 lines); `DECISIONS-PENDING.md` in full (DP-001 to DP-079); `consolidation.md` §3, §4 and §6
   (exit tables, stop reasons, DV-001 to DV-073); R18 O-1 to O-12 and Appendix B.
2. Queried the inventory with `grep`/`awk` (never read whole): areas, kinds, the 90 `cli-command`
   rows, and the items cited below.
3. Read baseline code where a finding depends on it: `supervisor_lib.py:440-560` and `:940-1056`,
   `contract_lib.py:10-100` at `9c88f86`; `orchestrator.sh` stop-flag lines and `specstride:551-575`
   at `9cab15d`.
4. Read parts of R20 (descriptor, auto-pick), R3, R3v, R4 (detach, sandbox), R11 (T-02, T-26, T-47),
   R14 (envelope, EV-01, EV-15, EV-21).
5. For (a) walked ten plug-ins through the interfaces of R15 A-3 and A-4 and listed what has to change.
   For (b) went through decisions 1–23 against A-11. For (c) took 26 items or clusters. For (d) walked
   five failure scenarios through A-6 and A-7. For (e) checked owners, order and size of A-9.

Not done: no fixture was run, no host session was started, R27 was read only where R15 cites it. The
macOS statements are `inferred`.

## Findings

Count: 52 distinct findings. **blocks 11, weakens 34, cosmetic 7.** Entries that only point at
another finding (B-7, B-10, C-2, C-14, C-15) are not counted.

| Group | blocks | weakens | cosmetic |
|---|---|---|---|
| (a) extension points | 2 (A-6, A-7) | 12 | 2 |
| (b) owner decisions | 2 (B-1, B-6) | 4 | 2 |
| (c) parity | 3 (C-1, C-6, C-12) | 8 | 1 |
| (d) process model | 2 (D-1, D-7) | 6 | 1 |
| (e) decomposition | 2 (E-1, E-5) | 4 | 1 |

### (a) Extension points that would force a core change

**A-1. A loop with parallel units cannot be written as an EP-04 layer.** *weakens · adopt*
Scenario: a layer runs `[P]` units in worktrees. The layer's inputs are the attempt view, a ledger
namespace, the working directory, the check runner and the router handle (R15:315). It receives no
harness handle and no directive that asks the engine for a pass; the directive set is closed (R15:316).
Only the pass loop in `@specstride/core` calls `startPass`. `inferred`: N concurrent passes change the
pass loop, the watchdogs (one per pass), the counters, `passId` accounting and LR-5 (one event writer).
R15 A-8 (R15:824) says this is "a later addition to one component"; by its own interface it is a change
to core, contracts and the event writer.
Change: add to EP-04 (a) a `requestPass` directive (block, working directory, session directive) that
the engine executes and accounts for, so the layer never holds a harness; (b) capability negotiation:
a layer declares the directives it uses and the engine refuses at registration what it does not know,
which makes a new directive a minor version and not a new major; (c) state now that the append lock of
LR-5 is tested under contention in Wave 1.

**A-2. An autoresearch loop is excluded by construction.** *weakens · owner*
Scenario: a loop that changes the tree, measures, and keeps or reverts by the measurement. IR-60
withholds reset, clean and commit from every layer (R15:318) and DP-056 defaults to "no commit and no
revert inside an attempt". The defining operation of that loop is therefore forbidden. R15 names
`autoresearch` as a roadmap implementation of EP-04 twice (R15:53, R15:319) and admits only that
"nothing here shows that eight hooks are enough" (R15:1140).
Change: a runtime-owned tree store (snapshot, restore) offered to layers as a service, never as raw
git. It is the same store DP-044 and DP-056 would need (R15:1131). Owner: whether Wave 1 reserves the
service in the interface or the roadmap accepts that `autoresearch` means `specstride.loop-layer/2`.

**A-3. A model as inner reviewer touches five core contracts.** *weakens · adopt*
Walk-through: (1) the event envelope's `role` is a closed list of six,
`proposer critic diagnostician accelerator supervisor host` (R14:240, `verified-local`); (2) role
resolution outputs proposer and critic only and "runs at launch only" (R15:294, LR-8); (3) budgets and
the quota pause are per role (decision 8); (4) the check result of EP-05 is an exit code with
conditions (R15:328), not findings; (5) `run` of EP-05 has no access to a `completion` port, a budget
or the quota classifier. Decision 21 rules the reviewer out for Wave 1 only, so the seam matters.
Change: make **role** an open registry in the contracts package (role id, capability level required,
independence constraints against other roles, budget key). Proposer and critic are the two entries of
Wave 1. Role resolution resolves every registered role. EP-05 results gain an optional `findings[]`.

**A-4. A remote check runner (CI) does not fit EP-05.** *weakens · adopt*
`prepare` "resolves the executable to an absolute path with size and hash" (R15:327); `run` is
synchronous with a time limit; `cancel` "ends the process group". A remote runner submits, polls and
fetches; its identity is a workflow definition and a ref; it needs a secret with a bound host and a
pushed tree, and the taint fingerprints assume a local tree. A second mechanism for long checks exists
beside EP-05: the detached jobs of a yield (feature 118), which hold 64 % of the reference run's time.
Change: EP-05 becomes handle-based: `pin(entry)` returns an identity record of a declared kind;
`start` returns a handle; `poll`, `result`, `cancel`. The `command` runner implements it trivially.
Runtime-launched jobs of a yield use the same port, so fail-fast (DV-051) has one place to act.

**A-5. Stage kinds and precondition checks of the launch contract are closed and are not an extension
point.** *weakens · adopt*
`KINDS = {"setup", "decision", "command", "specstride", "smoke"}` and
`CHECKS = {file_exists, dir_exists, env_set, command_available, command_success, json_field_equals}`
(`contract_lib.py:16`, `:31-38` at `9c88f86`, `verified-local`). R15 ports the stage executor
(feature 123) and lists 18 points, none for stage kinds. A new kind (a remote deploy, a second engine
such as a later loop strategy at pipeline level) changes the schema, the validator and the executor.
Change: EP-19 "stage kind" and "precondition check" as registries inside `@specstride/pipeline`, with
the five and six of today as the built-in entries; the contract schema names the kind by id.

**A-6. A third host without a model (a CI runner) cannot complete `specstride-run`.** *blocks for that
host · owner*
Derivation leaves items "the inventory could not settle" to the host model in batches (R15:777,
DP-023). EP-01's operations (R15:276) are about rendering skills and entries; the judgment exchange,
which is the real coupling between host and product, is not named as a contract. `host-shell`, the
test host, has no model either; the conformance suite must script the answers.
Change: name the exchange as a versioned part of the CLI protocol (`derive --next-batch`,
`derive --answer`, schema `specstride.judgment/1`). Owner: whether a model-less host may delegate the
judgment to a configured harness through `completion` (a third role, see A-3), which reads decision 5
("the host skill does … derivation") more widely than its text.

**A-7. Control plane outside the tree against a sandboxed host.** *blocks until the spike covers it ·
adopt*
R15 argues that a sandbox confining writes to the working directory protects the control plane
(R15:570). The same sandbox confines the CLI that the host's shell tool starts: it must write
`inbox/` and `launches/` under `$XDG_STATE_HOME` (R15:567), and the root it spawns inherits the
confinement. R4 states it for dsh: "writes outside the workspace (state home, telemetry) need either
`danger-full-access` … or a workspace-local state directory" (R4:40, R4:140). For Claude Code the
behaviour with the Bash sandbox on is `unverified` (R3:97). The spike of A-7.4 (R15:809) tests
survival of the process only.
Change: the spike gains two cases per host: the CLI writes the control root from inside the host's
shell tool, and the detached root writes it after the session ends. EP-01 `describe` gains
`stateRootWritable`. The fallback is declared now: a control root the host permits, set in user scope.

**A-8. A harness with an unknown stream format, or one that needs a handshake.** *weakens · owner*
The port itself holds: a code adapter may do anything inside `startPass`. For consumers it does not:
code extensions are not loaded in Wave 1 (DP-075), descriptor kinds are three, and placeholders are
"a closed set" (R20:425). A harness that speaks a bidirectional protocol (R20:158 names the Agent
Client Protocol as "the natural third kind later") or a structured stream no shipped reader knows
waits for a product release, which is what decision 17 says must not happen. The degraded path is
`stream: {format: text}`: it works as proposer, loses usage and quota signals, and cannot pass the
critic's check of the initial record (R15:295), so a consumer-configured CLI critic on a text stream
halts the run with `critic_not_toolless`.
Change: a data-class stream mapping in the descriptor (record selector and field paths to the six
normalized records), so a new JSONL dialect is data. Owner: whether DP-075 stays "no" given this.

**A-9. A harness-specific behaviour sits inside the pass loop's exit table.** *weakens · adopt*
The pass loop exits 7 and 4 on plugin requests of one harness (B-0585, B-0586, B-0587,
`proposer.sh:2051-2070`). R15 sends the module with its adapter to Wave 3 (R15:913), but EP-02 has no
operation through which an adapter can act between passes and return a pass-loop outcome.
Change: an optional `betweenPasses` hook on the harness port with a closed outcome set (continue,
stop with the existing results 4 or 7). Specify it in feature 109 in Wave 1.

**A-10. A new quota signal that is not a failure.** *weakens · adopt*
EP-12 classifies "what the adapter saw" (R15:403) with a closed confidence set
`structured, status, text, stall`. Two signals of decision 8 have no entry: a polled allowance gauge
("warns as usage grows") and a host-observed limit from `inbox/host-events.jsonl` (R15:613), which no
adapter saw.
Change: split EP-12 into `classify(failure)` and `observe(gauge)`; add the source `host` to the
confidence set with the rule that it never pauses without a confirming probe.

**A-11. Two lock providers on one workspace give no exclusion.** *weakens · adopt*
EP-13 lets a native provider replace the default. A host configured for one and a host configured for
the other both acquire. Change: `workspace.json` records the provider id and version at first
acquire; a different provider refuses with a doctor line.

**A-12. A new secret store.** *cosmetic · owner*
EP-10 is a scheme registry, but decision 6 names three schemes and DP-075 loads no consumer code, so a
fourth store is a product release. Owner: whether decision 6's list is a minimum or a boundary.

**A-13. A new spec format.** *weakens · adopt*
(1) "Detection order is the registry's order and is 028's" (R15:306): a new format has no defined
place, and if it claims a file a built-in claims, today's `ambiguous-candidates` exit 3 changes for
existing users. (2) `inputs()` returns files with hashes and `tick` edits checkboxes: a format whose
source is not a file has neither. (3) `@specstride/pipeline` imports `spec-formats` directly
(R15:496) and derivation inventories Spec Kit artifacts, so a new format runs under `specstride run`
and not under the `specstride-run` skill.
Change: a `priority` field with the rule that built-ins win and a new format is detected only where
they decline or on an explicit name; `inputs()` returns sources of a declared kind; derivation
consumes the canonical model and EP-07 only.

**A-14. The contracts are not installable by a third party.** *weakens · owner*
Workspace packages "are private and are bundled into one published package" (R15:476). A renderer,
host or adapter written outside the repository cannot type against `@specstride/contracts` or run a
conformance suite. The proof of "no core change" is then a proof for first-party code only.
Owner: publish `contracts` and `testkit` as public packages (a compatibility promise) or state that
extension by code is first-party until DP-075 changes.

**A-15. State files without a schema field; upgrade in the middle of a run.** *weakens · adopt*
Only `workspace.json` has a layout version (R15:609). `launch.json`, `run.json`, `lease.json`,
`pause.record`, `ledger.jsonl`, the approval record, `manifest.json`, `checkpoint.json`, `procs/`,
`stop.request` and `host-events.jsonl` have none stated. Runs last days; `npm update` between launch
and `resume` gives a new CLI, an old root and old files.
Change: every control-plane file carries `schema: <name>/<major>`; a reader refuses an unknown major;
`run.json` records the product version; `resume` with a different major refuses with a doctor line.

**A-16. Closed sets without a stated rule for an unknown value.** *cosmetic · adopt*
Run states (11), stage kinds, launch checks, descriptor placeholders, descriptor kinds, detach
strategies, containment C0–C3, audience, confidence, EP-04 directives, router choice sets, event
`role`. R15's common rule covers results of an extension only (R15:263). Change: feature 100 lists
every closed set with its owner, whether it is closed by an owner decision (stop reasons, tiers) or by
design, and what a reader does with an unknown value.

### (b) Owner decisions satisfied in words only

**B-1. Decision 5 and the relaunch classifier: "ported unchanged" is not possible inside the root.**
*blocks · owner (DP-072) plus adopt*
R15 moves the classifier into the runtime root and says it is "ported unchanged (011 FR-021, FR-022),
including every named refusal" (R15:789). The classifier's input is an observation of a **terminated
launcher** (`supervisor_lib.py:962-1056`, `verified-local`): `still-running`, `unknown-terminal`
("the launcher process is gone without a terminal state"), `unknown-launcher-exit` ("no DIGEST line
recorded a launcher exit"), `signal-stop` (launcher exit ≥ 128), `lock-conflict`, `state-not-failed`,
`launcher-edited`. Inside a living root none of the first five can occur, and the launcher exit 22 is
never emitted as a process exit because the root stays alive in `relaunching`. Three consequences:
(1) the oracle's FX-35 expects exit 22 from the pipeline process and FX-36 expects `[MOL-RELAUNCH]` on
the stdout of `supervise observe` (B-2675, B-2746); in the port the line would go to `runtime.log`
from another process; (2) a crash of the engine is relaunched "within budget" (R15:803), but the
ported rule refuses a child exit outside `retry_exit_codes` and a stop reason outside
`wall_budget`, `proposer_consecutive_errors` (B-2496), so crash relaunch is new behaviour with no
register row; (3) the host can no longer apply the consumer's comment to "supervision emphasis"
(decision 18).
Change: a configuration key `relaunch.owner` with values `root` and `supervise`. With `supervise` the
root exits with the pipeline code at a failed stage and `supervise observe` classifies and relaunches
as today; that value is part of the parity configuration and is also the literal reading of
decision 5. With `root` the classifier is a **second table** with its own rows (crash included) and a
register row. The inbox gains `hold-relaunch`. The owner rules the default.

**B-2. Decision 16: the supervision budget holds only because supervision left the host.**
*weakens · owner*
DP-024 proposes 150 tokens per cycle and 3,000 for a whole run, which is 20 cycles. `inferred`: a
cycle is one tool call of the host, bounded by the host's command time limit, so 20 cycles cover
hours, not the 188 hours of the reference run. The budget is met because the host stops watching.
That couples DP-072 and DP-024: if the owner rules the classifier back into the host, the whole-run
budget cannot hold. Also: "may read a named feedback file when the consumer asks" (R15:782)
contradicts LR-2, since the file is in the control plane. Change: state the coupling in both DP
entries; diagnosis reads through `specstride feedback <N>` with a byte cap.

**B-3. Decision 17: "discovery never changes the proposer" has no guarantee and no test.**
*weakens · adopt*
Role resolution outputs "proposer, critic, runners-up" from "config, the resolved registry, the terms
gate" (R15:294). Row 17 of A-11 (R15:964) does not mention the proposer. Nothing says what happens
when the default proposer is absent and a discovered harness is present.
Change: a core guarantee in EP-02: the proposer comes from flag, environment, configuration or the
shipped default only; an absent proposer refuses the launch and names the discovered candidates; the
descriptor-only fixture asserts it.

**B-4. Decisions 8 and 9 against LR-8.** *weakens · adopt*
LR-8: role resolution "runs once at launch … No loop and no router calls it". Decision 9 has
per-phase overrides and decision 8 a per-role fallback that switches during a run; R15 itself says
the terms gate is evaluated "at every fallback switch" (R15:395). Change: role resolution produces a
**plan** at launch: per phase, per role, the ordered fallback list, each entry already gated. The
engine walks the plan; nothing is resolved after launch.

**B-5. Decision 21: "classic" is not one switch.** *weakens · adopt*
With the layer `none` a default run still has fail-fast (its own switch, R15:889), carry-over, the
obligations index, the closing check, escalation, containment C2, the accept-edits mode, terse output
and, per B-1, relaunch in the root. The parity configuration is a set of at least twelve switches
spread over eight features. R15 has the rule (LR-10) and no owner for the set.
Change: feature 100 owns a named, versioned profile `parity` as data, one line per switch with its DV
row. The second suite is `parity` plus the layer. A switch that exists and is missing from the
profile fails CI.

**B-6. Decision 23: when does a launch start a new logical run?** *blocks · owner*
`runId` "ends when all phases are approved or when the consumer starts a new run" (R15:586). The
state machine has `resume` out of `failed`, `stopped`, `blocked-on-human` and `dead` (R15:718) and no
rule for `launch` on a feature whose run ended with `max_rejects`. If `launch` mints a new `runId`,
counts start at zero and the limit is bypassed by launching again, which is what each of the manual
restarts of the reference run did. If it does not, the consumer needs the reset flag to try again.
Owner: the rule. Proposed default: `launch` on a feature with an unfinished run continues that run
and its counts, and says so in one line; a new run needs `--new-run`, recorded in events.

**B-7. Decision 3 against decision 4: three places where the layout cannot express the reference.**
*weakens · adopt* See C-4, C-5 and C-9 below. R15 row 3 and row 4 of A-11 rest on SL-4 (logical
names); the table has no entries for five compared files and no rule for names that collide.

**B-8. Decision 11 and DV-058.** *cosmetic · adopt*
EP-08 and feature 128 keep a Loki sink beside the OTLP exporter (R15:362, R15:905). DV-058 says the
two shippers become "one OTel exporter". Either the Loki sink is `ported` (FX-31 compares it) and
DV-058 is reworded, or it is `superseded` and leaves 128.

**B-9. Decision 12: path length of the liveness endpoint.** *cosmetic · adopt*
`inferred`: a Unix socket path is limited to about 104 bytes on macOS and 108 on Linux. The lock
lives under `$XDG_STATE_HOME/specstride/workspaces/<readable prefix + hash>/lock/` (R15:610), and
the oracle gives every run a fresh `HOME` under the temp directory (R18 O-2). Change: the endpoint
sits in a short per-user runtime directory and the lock directory holds a reference to it.

**B-10. Decisions with no finding.** 1, 2, 6, 7, 10, 13, 14, 15, 19, 20 and 22 hold as R15 states
them. Decision 18 holds apart from the point in B-1 (3).

### (c) Parity behaviours the architecture cannot express or the oracle cannot observe

Twenty-six items or clusters were taken, across engine, pass loop, critic, spec module, learning,
front door, contract tools, launcher, pipeline runtime and supervisor. Those that hold are listed
under "What held".

**C-1. Module entry points that no longer exist.** *blocks · owner*
LR-6 says every boundary with a per-process exit code stays a process boundary (R15:243). Q2 folds in
"everything … without a separately observed exit code" and names `proposer.sh` and `lib/critic.py`
(R15:65-67). Both have exit tables (`consolidation.md` §3.2, §3.3; R18 Appendix B) and both are entry
points (B-0462, B-0793). So are `verification_plan.py` with seven subcommands (B-1037 to B-1043),
`specstride_spec.py` with eleven (B-1978 to B-1988), `learn.py resolve` (B-1174), `backends.py`
(B-0418 to B-0420) and `finalize_invocation.py` (B-2145). The CLI of L6 (R15:193-194) has no verb for
any of them. Codes that then have no observer: critic 2 on usage, proposer 130 and 143 on a signal
(B-0582, B-0583), verification 11.
Owner: which of these are public verbs of the new CLI (then LR-6 holds for them and the oracle calls
them) and which get `translated` or `superseded` per cluster. Change to adopt: LR-6 is reworded to
"every boundary that a fixture observes", and A-6.3 lists the result-record codes with the fixture
that reads each.

**C-2. `[MOL-RELAUNCH]`, launcher exit 22 and the order of events from two processes.** *blocks*
See B-1. Reference order: launcher prints `[DIGEST] … exit=22`, exits; `supervise observe` prints
`[MOL-DIGEST]`, then `[MOL-RELAUNCH]`, exits 0 (B-2675). With the classifier in the root there is no
second process and no exit.

**C-3. `supervise` is a writer today.** *weakens · adopt*
`observe` persists `interval`, `unchanged` and `signature` in `harness-run.json` after every reading
(B-2779); `stop` writes `stop_requested` before it signals (B-2768). R15 makes the verbs "readers"
(R15:790) and lets the CLI write `inbox/` and `launches/` only (R15:567). The cadence state that
011 SC-005 depends on has no home. Change: `launches/<launchId>/supervision.json`, written by the
CLI, named in the writer rules.

**C-4. Compared files with no place in the layout.** *weakens · adopt*
R18 O-5 captures `state.json`, `harness-run.json` and three logs. A-5.3 has `state.json` and
`runtime.log`. It has no `launcher.log` (B-2587: receives every labelled line and the engine's output
with escape sequences stripped; B-2750: the digest is parsed from it), no `harness-report.log`
(B-2734), no `harness-launch.log`, no `harness-run.json` (B-2733) and no engine run log, which
`specstride tail` follows (B-1433). R15 risk 7 names one of the five.
Change: five logical names in the SL-4 table, and the legacy projection writes them as files, not
only `events.legacy.jsonl`.

**C-5. Attempt names collide under the oracle.** *weakens · adopt*
In the reference the attempt counter restarts in every process and a collision is archived as
`attempt<M>-<run-id>` (B-0306, B-0292); a halted rejection is archived as `attemptresume-<run-id>`
(B-0307). Under the oracle the reset flag is passed (DV-011), so the port numbers from 1 again. R15
says "no `-<run-id>` suffix rule is needed" (R15:589); DV-011 says "the suffix rule stays". The
logical name `attempt:<phase>:<n>:evidence` (R15:670) is then not unique.
Change: the logical name carries the engine-start ordinal, `attempt:<phase>:<k>:<n>`, and R15:589 is
corrected to agree with DV-011.

**C-6. Detached jobs of a yield are killed or block a resume.** *blocks · adopt*
Reference: on a stop during a yield the job "is specstride-owned and is LEFT RUNNING" (B-0658); the
engine exports the lock descriptor "so child processes can close their inherited copy before
backgrounding a detached job" (B-0061), so a later run takes the lock while the job lives and adopts
it (`job.mode` adopt, B-0545; long-job files keyed by run id, B-0353). `stop --now` kills the
in-flight pass recorded in `proposer.pid` only (`specstride:558-566`, `verified-local`).
R15: `stop --now` signals every recorded group, "the detached jobs included" (R15:802); with the
owner dead and a recorded group alive, "`resume` refuses and names the survivors" (R15:805). A
verification job of hours, the largest cost in the reference run, would have to be killed before the
run may continue. No register row covers either change.
Change: the process registry has two classes. `owned` (passes, checks, critic calls) are orphans when
the owner dies. `adoptable` (jobs of a yield) never make `probe` return `owner-dead-group-alive`, are
left running by `stop` and `stop --now` unless `--jobs` is given, and are adopted by the next engine
start. FX-12 and FX-22 compare "processes left behind" (R18 O-5).

**C-7. Learning commands write events and state outside the runtime tree.** *weakens · adopt*
`learn.py apply` appends a decision to `applied.json` and a `knob_adjusted` event with `ts` and no
`time` (B-1178, B-1225), from a CLI the consumer runs, possibly while a run is alive. That breaks
LR-3, LR-4, LR-5 and SL-5 as written. R15 risk 4 sees the second events file and not the writer.
The refusal `learning-decisions-changed` of the classifier depends on exactly this write.
Change: the learning store is a fourth writer domain with its own lock and its own stream
(`features/<slug>/learning/events.jsonl`); the projection writes the legacy lines from it.

**C-8. Two writers of `run.json`.** *weakens · adopt*
The engine writes the terminal record "into `run.json`" (R15:739) and the pause transitions
(R15:708); the root writes the other transitions (R15:706-717) and `stop --now` arrives while the
engine lives. Write-then-rename of a whole file by two processes loses updates. LR-5 covers the event
file only. Change: one file per writer: `run.json` (root), `engine.terminal.json` and `pause.record`
(engine). `RunView` reads the three.

**C-9. Output lines that carry physical state paths or tell the operator to touch one.**
*weakens · adopt*
Fifteen `output-line` rows name a layout path (command in Method 2), among them
`stop requested → <state>/stop.flag` (B-1548), `stop with: touch <path>` (`orchestrator.sh:946`),
`no .specstride/ state dir in <workdir>` (B-1523), the status text "pointing at
`.specstride/features/*/yield-jobs/`" (B-1503), and "changed nothing outside .specstride" (B-0665).
N-01 and N-02 normalize paths in captured trees; applying N-02 inside message text, including a glob,
is not stated in R18 or R15. Change: the normalization contract of feature 100 says N-02 applies to
text surfaces, with the list of message templates that carry a logical name.

**C-10. The engine in the foreground has no owner for its state transitions.** *weakens · adopt*
Fixtures FX-01 to FX-31 run `specstride run` in the foreground. A-6.2 gives `starting → running`,
the lease, `run.launched`, the terminal digest and the synthesized `run.ended` to the root. Who
writes them when no root exists is not said; "a child never takes a second lock" (R15:416) needs the
complement. Change: the engine has two start modes, `standalone` (takes the lock, owns the
transitions of the root) and `child` (verifies the lease); A-6.2 gains the column.

**C-11. The engine is found by `PATH`.** *weakens · adopt*
The oracle substitutes the engine by `PATH` (R15:170) and LR-10 forbids an oracle mode. In
production a stage argument list that starts with `specstride` then resolves to whatever is first on
`PATH`, which may be another version. Change: the executable of the kind `specstride` is resolved at
launch, pinned by path and hash in the run record (as EP-05 does for checks), from a configuration
key whose default is the product's own entry. The oracle sets the key.

**C-12. Wave 1 parity depends on harnesses of Wave 3.** *blocks · owner*
The stubs are named `claude`, `codex`, `dsh` and `prime-agent` (R18 O-3) and FX-26 compares stream
formats through the seam. The as-is default proposer is `dsh` (DV-004). Invocation argument lists are
per harness (B-0689 to B-0697). R15 sends `prime_stream` (41 items) and the plugin requests (11) to
Wave 3 (R15:913). Inventory rows that name a harness: dsh 70, prime 80, codex 16 (`awk` over the
item text, `verified-local`). Decision 4 blocks a release until every parity test passes.
Owner: either those clusters are `deferred <wave>` and the Wave 1 release gate is "every parity test
of Wave 1", or Wave 1 ships the stream readers and argument tables of the as-is harnesses as data
without the tested adapters. R15 does not choose.

**C-13. A-6.3 differs from `consolidation.md` §3.** *cosmetic · adopt*
`supervise` loses code 1 (R15:733 against §3.10). Engine 70 is stated for the engine (R15:731); §3.12
gives it to "any command". Align on the consolidation tables.

**C-14. `wait` and the cursor.** *weakens · adopt* See D-4.

**C-15. No feature owns stale `created` records.** See D-2.

### (d) Process model and failure

**D-1. The root dies, the engine lives.** *blocks · adopt*
The root heartbeats the lease (R15:800). After SIGKILL of the root the engine, in its own group, goes
on: it edits the tree, spends quota and writes events, while every reader derives `dead`. `probe`
returns `owner-dead-group-alive`; the only exits R15 offers are `stop --now` or waiting
(R15:805). `verify(token)` exists (R15:412) but nothing says when the engine calls it. A paused
engine wakes as an orphan.
Change: the engine verifies the lease at every boundary at which it reads the stop request. On
failure it finishes the current pass, writes its terminal record with the cause `owner-lost`, runs no
gate and exits with the stop code 6 and the existing reason `stop_flag` plus a `causedBy` field
(no new code, no new reason). The reverse case (engine dies, root lives) is covered by R15:803 once
B-1 (2) is settled.

**D-2. The host session ends during `launch`.** *weakens · adopt*
Claude Code ends the process tree of a running command (R3:94-97). If the CLI dies after
`launch.json` and before the spawn, the state is `created` for ever: `dead` is derived only from "a
live state" with a dead lease (R15:693). If it dies after the spawn, the run lives and nobody was
told; re-attachment covers that. Change: `created` older than the handshake limit without a lease is
derived as `launch-abandoned`, an attention item, and the next launch closes it.

**D-3. Two hosts attach to one run.** *weakens · adopt*
(1) Two launches race: both pass the probe, both mint a `runId`, one root loses with 24. The losing
CLI sees no lease with its nonce and prints a refusal; the reference would say `attach` with exit 4
(B-2672). (2) Supervision state is shared (C-3). (3) `host-events.jsonl` has two appenders.
Change: the handshake ends in one of three outcomes, `started`, `attached` (another launch holds the
lease; print its run) or `refused`; host events are one file per launch id.

**D-4. The cursor of `wait --until-change`.** *weakens · adopt*
The cursor `{file, offset, lastSeq}` (R15:371) has no stated home. In the control plane it breaks
LR-3 and one host consumes the change the other waits for. Change: the caller holds the cursor;
`wait` prints it and takes it back as an argument.

**D-5. A pause that outlives a reboot.** *weakens · owner*
`paused-quota` needs a live tree (R15:686). After a reboot "nothing relaunches by itself in Wave 1"
(R15:804), so the run does not resume when the window resets, which is what decision 8 promises. A
weekly window is longer than the 24-hour ceiling of DP-068 and longer than most uptimes of a laptop,
and macOS is first-class. Owner: either the `service` strategy of EP-17 moves into Wave 1 for paused
runs, or decision 8 is stated as "resumes while the runtime lives; otherwise the next `status` offers
the resume".

**D-6. The status shim prints a precomputed line.** *weakens · adopt*
The `SessionStart` shim prints `status.line` "without starting Node" (R15:801) and is said to report
a dead run (R15:804). A dead root cannot rewrite the file, so the shim prints `running`. Change:
`status.line` carries `validUntil` (heartbeat plus grace); the shim compares it with the clock and
prints `state unknown, run specstride status` when it has passed.

**D-7. The working tree is moved or cloned.** *blocks for a fleet or CI · owner (DP-071)*
The workspace id is a hash of the real path (R15:572). Approval records, the approval key, the ledger
and the learning log are in the control plane (R15:622-636). After a move, a clone to another machine
of the fleet, or a CI job with an empty state directory: no approval is found, `resume` starts at
phase 1, while the task boxes in the spec are ticked in the tree (`tick` edits in place). The
proposer is sent to redo approved phases. The "adopt command" is "named and not designed" (R15:1155).
Change: `specstride state export` and `import` (a signed archive of approvals, ledger and learning
for one feature) and `adopt --from <old path>` are designed in Wave 1 in feature 122; a launch that
finds ticked phases without approval records refuses and names the three commands. Owner: DP-071
should be ruled with this cost in view.

**D-8. One run per workspace no longer holds across users and containers.** *weakens · adopt*
Today the lock is a kernel lock on a file in the tree (B-0161), seen by every user and every
container that shares the kernel and the directory. With the lock under `$XDG_STATE_HOME` a second
user, a root shell, or a container with a bind mount has its own control plane and starts a second
run on the same tree. R15 O-3 notes the two control planes (R15:1030) and not the broken invariant.
Change: an advisory marker in the workspace part, `.specstride/active`, written by the root with the
owner record and removed at the end. A launch that finds a marker whose owner it cannot probe refuses
with `foreign-owner`. It is safety, not security: the proposer can delete it, which the integrity
rules report.

**D-9. The harness session directory sits in the control plane.** *cosmetic · adopt*
`attempts/<attemptId>/session/` (R15:644) is written by the harness process, which at C2 is confined
to the working directory. Either the sandbox gets one more writable path or the directory moves; say
which.

### (e) Feature decomposition

**E-1. No feature owns the parity oracle.** *blocks · adopt*
`@specstride/oracle` and `@specstride/testkit` are packages (R15:502) with 37 fixture families, stubs,
the normalizer, the comparator, the exercise map and the second suite (R18 O-1 to O-12). None of the
27 features has them in scope; feature 100 owns the normalization rules only. Decision 4 makes the
oracle the release gate. Change: a feature `141-parity-oracle` in Wave 1, specified right after 100.

**E-2. Contracts used by several features without an owner.** *weakens · adopt*
The ledger (used by 101, 102, 103, 115, 116; "carry-over: ledger" is in 103), the approval record
(101, 102, 122), the terminal record (101, 123), the inbox request types (102, 122, 123, 113), the
process registry (118, 122, 102), the table evaluator of LR-7 (115, 127, 123, 129, 110), the redactor
(111, 110), and the parity profile (B-5). Change: each is added to the list of feature 100's
contracts with its schema id.

**E-3. Behaviours with two or three owners.** *weakens · adopt*

| Behaviour | Owners in A-9.2 | Proposed single owner |
|---|---|---|
| `specstride status` | 119 (inspection commands, B-1431), 129 (`status`, `wait`) | 129 owns the data and default output; 119 owns the compatibility output |
| What happens after the engine or root dies | 122 (crash recovery), 123 (relaunch classifier), 102 (resume) | 123 the classifier, 102 the `resume` command, 122 lock reclaim only |
| Stop | 102 (stop), 122 (inbox, `--now`), 123 (`supervise stop`) | 102 |
| The event schema, the config schema | 100 (§6) and 111, 100 and 110 | 100 owns envelope and versioning rules; 111 and 110 own the content |
| Fingerprints and the protected set | 105 (IR-33 at the gate), 116 | 116; 105 consumes |
| The step runner | 105 (EP-05), 118 ("as an option") | 105 |
| The digest and output lines | 123, 119, 115 (`[LOOP]`) | 100 owns the line grammar; each feature its lines |

**E-4. The stated order for Stage B does not hold.** *weakens · adopt*
"Each feature cites only contracts of feature 100 and of features earlier in the list" (R15:925).
122 (tier 2) cites the classifier of 123 (last tier); 102 (tier 4) cites 123; 105 and 117 (tier 3)
cite the fingerprints and the fact block of 116 (tier 5). Prompt §6 step 4 fans the features out in
parallel, which a six-tier order does not allow. Change: after E-2 and E-3 every cross-feature
contract is in feature 100 and the order is two tiers: 100 and 141, then all others in parallel.

**E-5. Feature 100 is the feature that is too large.** *blocks · owner*
It owns 18 extension-point contracts, the layout, the identifiers, the state machine, the enums, the
CLI protocol, and after E-2 eight more schemas. `inferred` at five to eight requirements per point:
well above 150, against a guide of 40. It must be "specified alone and completely" before anything
else (§6 step 3). R15 risk 11 proposes annexes. Owner: annexes of one feature (one source to cite,
one very large specification), or the contract of each port moves to the feature that implements its
core side with 100 as the index and version table.

**E-6. Is 27 justified?** *weakens · owner (DP-078)*
The need to split is evidenced (F-08). The estimates are not: R15 rates them "low" confidence
(R15:1084). Cuts that follow a real seam: 101/117, 103/118, 107/123, 109/124/125/126, 111/128/129,
110/127. Cuts that look artificial: **115/116** (one threat model of 60 rules; every requirement of
115 cites the protected set of 116), **108/140** (the guard in one, the lint in the other, one
module pair), **102/119** where `status` is split again by 129. Proposal: specify 115+116 and
108+140 as one feature each with two requirement groups, and split only if `speckit-specify` yields
more than about 45. With 141 added that gives 26 Wave 1 features and the umbrella.

**E-7. No Wave 1 feature depends on a Wave 2 feature**, apart from C-12 (parity items of Wave 3
harnesses). The renderers `watch` and the web viewer are named in 129's scope (R15:906) and belong
to 121; remove them from 129's scope text. *cosmetic · adopt*

## What held

| Subject | Why it holds |
|---|---|
| Router and loop are not peers; role choice is not routing | Decisions 20 and 21 and Principle II leave no other reading. The prototype's ungated modes are correctly rejected |
| Engine as a child of the root | Stage timeout (124), the environment rule (B-2561), signals (128+N) and the engine stub are process semantics. `runtime.py` spawns children whatever is decided (R15:112) |
| One event writer at a time | Holds for the event file once C-7 (learning) is taken out |
| Two `run_stop` lines for one stop | The projection can write the pass-level line with `iter` and the engine's line after it (B-0608, B-0610, B-0615) |
| Stop flag at workspace level | `STOP_FLAG="$STATE_DIR/stop.flag"` (`orchestrator.sh:687`); `inbox/stop.request` per workspace matches, also "written when no run is active" (`specstride:551-556`) |
| Launcher exit 22 with state `stopped` on child exit 6 | B-2570; A-6.2 has the transition |
| `[STALE]` and `[INVALID]` on stderr with a digest | B-2605, B-2606; the foreground pipeline entry keeps them |
| `[MOL-HOLD]` on every unchanged poll | Compatibility output (DV-033) |
| Front door replaces itself with the engine | B-1428; one binary gives the same code |
| Critic exit 10 for rejected and malformed | Result record with two results (§3.3) |
| Glob expansion, the `mkdir` lock that is never released, `child-exit=None` | Register rows exist (DV-019, DV-022, DV-070) |
| Decisions 1, 2, 6, 7, 10, 13, 14, 15, 19, 20, 22 | As stated in A-11 |
| EP-08, EP-09, EP-11, EP-14, EP-15, EP-16 | A sample outside the core is plausible for each; no closed set blocks a new implementation |
| The import rule for `core` and `layer-micro` | Checkable over the package graph |

## Proposed changes to the architecture

Changes the synthesis can adopt. Order by severity.

| # | Change | From |
|---|---|---|
| P-1 | `relaunch.owner` as configuration, `supervise` in the parity profile; with `root`, a second classifier table with a crash row and a register row; inbox request `hold-relaunch` | B-1, C-2 |
| P-2 | Process registry with classes `owned` and `adoptable`; jobs of a yield survive stop and are adopted | C-6 |
| P-3 | The engine verifies the lease at every boundary and ends cleanly when the owner is lost | D-1 |
| P-4 | Feature `141-parity-oracle`; feature 100 owns the ledger, approval record, terminal record, inbox, process registry, table evaluator and the `parity` profile | E-1, E-2, B-5 |
| P-5 | Single owners per E-3; Stage B order in two tiers | E-3, E-4 |
| P-6 | The spike of A-7.4 also tests writes to the control root from the host's shell tool and from the detached root; `stateRootWritable` in EP-01 | A-7 |
| P-7 | LR-6 reworded to observed boundaries; A-6.3 aligned with `consolidation.md` §3 | C-1, C-13 |
| P-8 | Layout: five logical names for the compared logs and records; `supervision.json`; one state file per writer; attempt names with the engine-start ordinal; a learning writer domain; N-02 on text surfaces | C-3, C-4, C-5, C-7, C-8, C-9 |
| P-9 | Engine start modes `standalone` and `child`; the engine executable pinned at launch from a configuration key | C-10, C-11 |
| P-10 | EP-04: `requestPass`, capability negotiation of directives. EP-05: handle-based, `pin`. EP-02: `betweenPasses`, a data stream mapping, the proposer guarantee. EP-12: `observe`, source `host`. EP-03: `priority`. EP-13: provider recorded per workspace. New EP-19 for stage kinds and precondition checks. Roles as an open registry | A-1, A-3, A-4, A-5, A-8, A-9, A-10, A-11, A-13, B-3 |
| P-11 | Role resolution produces a plan per phase and role with gated fallbacks | B-4 |
| P-12 | `schema` field in every control-plane file; product version in the run record; refusal on a different major | A-15 |
| P-13 | Handshake outcomes `started`, `attached`, `refused`; `launch-abandoned`; caller-held cursor; `validUntil` in `status.line`; the advisory marker `.specstride/active`; a short path for the liveness endpoint | D-2, D-3, D-4, D-6, D-8, B-9 |
| P-14 | `state export`, `import` and `adopt` designed in feature 122; refusal when ticked phases have no approval record | D-7 |
| P-15 | A list of closed sets with owner and unknown-value rule in feature 100 | A-16 |

## Items for the owner

| # | Question | Default proposed | Bears on |
|---|---|---|---|
| O-1 | Where does relaunch run by default, given that the classifier cannot be ported unchanged into the root? | `root` with its own table; `supervise` stays available and is the parity setting | DP-072, decisions 5, 16, 18 |
| O-2 | When does a launch start a new logical run? | It continues an unfinished run and its counts; `--new-run` starts one | Decision 23 |
| O-3 | Which module entry points become public verbs? | `spec`, `verify`, `learn` yes; pass loop and critic no, with `translated` per cluster | Decisions 1, 4; LR-6 |
| O-4 | Parity of Wave 3 harnesses in the Wave 1 release gate | `deferred <wave>` per cluster; the gate is "every Wave 1 parity test" | Decisions 4, 13 |
| O-5 | Control plane outside the tree, with the costs of D-7 and D-8 | Keep, with P-13 and P-14 | DP-071, decision 3 |
| O-6 | A pause that outlives a reboot | Decision 8 stated as "while the runtime lives"; `service` strategy on the roadmap | Decision 8, 12 |
| O-7 | May a model-less host delegate derivation judgment to a harness? | Yes, by user-scope configuration, recorded in the digest | Decision 5 |
| O-8 | Feature 100: annexes or contracts owned by the implementing feature | Annexes by layer, specified as separate documents of one feature | Prompt §6 |
| O-9 | 27, or 26 with 115+116 and 108+140 merged and 141 added | 26 and the umbrella | DP-078 |
| O-10 | `autoresearch` inside EP-04 major 1 (tree store reserved) or as a later major | Reserve the service in the interface, build nothing | Decision 20, DP-044, DP-056 |
| O-11 | Consumer code extensions, the three secret schemes, public `contracts` package | No change in Wave 1; publish `contracts` and `testkit` | DP-075, decisions 6, 17, 19 |

None of these is hard evidence that an owner decision is infeasible. O-1 and O-2 are the two where
the decision as written and the architecture as drafted cannot both hold without a ruling.

## Open questions / risks

1. **Not executed.** Every parity statement here comes from reading. The exercise map of R18 O-8 will
   show whether the items of C-1 are reached by any fixture.
2. **`stop --now` and detached jobs** (C-6): whether today's tree kill reaches a job that called
   `setsid` while its parent lives is `unverified`; B-0658 is the evidence for the intended behaviour.
3. **Sandbox and state root** (A-7) is `unverified` on both hosts. If the host's sandbox blocks the
   control root and no writable path can be configured, DP-071 falls back to a root inside the tree.
4. **The supervision budget arithmetic** (B-2) assumes one tool call per cycle bounded by the host's
   command time limit; the limit was not re-read in the host documentation for this report.
5. **Socket path limits** (B-9) are from general knowledge of the two platforms, not measured.
6. **R27 was not read in full.** Findings A-1, A-2 and B-5 rest on R15's account of IR-52, IR-60 and
   D1.x. If R27 already defines a tree store or a parity profile, P-4 and O-10 shrink.
7. **Requirement estimates** in E-5 and E-6 are as coarse as R15's.
8. Naming rule kept: no machine-specific backend or project name appears in this report.
