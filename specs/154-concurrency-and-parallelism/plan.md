# Implementation Plan: Concurrency and parallelism (feature 154)

**Branch**: `154-concurrency-and-parallelism` (a label; the directory is `specs/154-concurrency-and-parallelism`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md) | **Stage 1**: [constitution-grounding.md](constitution-grounding.md)

**Input**: `specs/154-concurrency-and-parallelism/spec.md` (81 requirements, G0 to G8), `prompts/154-concurrency-and-parallelism/feature-input.md` and its ledger (rows C1–C16, O1–O9 and the re-ground rows). Code read on `feat/154-concurrency-and-parallelism` @ `aafb367f`, which holds `main` @ `d1e8587f` (PR #39, #40, #41).

## Summary

Feature 154 makes parallel work a measured, bounded and recorded part of the product, in seven slices: measure what could run side by side (P1); deliver the parallel layer of 142 in the engine path, with three rules the live record of 153 showed are missing (P2); make 153's task groups the parallel unit, with their acceptance check in the worker tree (P3); keep one validation stream per host and share limits across runs (P4); run features side by side in the pipeline and land them in order (P5); run phases side by side behind one ordered validation queue (P6); start the next phase past an open verdict (P7). Every switch is off by default and off under `parity`; the ruling rows are answered (3 by the owner, 16 by research-backed recommendation on 2026-11-25), and each alternative stays planned as the fallback branch.

| Deliverable | What it is | Requirements |
|---|---|---|
| Measure | One printed plan from two callers, the report's shares and per-group rows, the trial and its record | F154-FR-009…-019 |
| The layer in full | Every group of a phase in plan order, headroom from observation, the halving, the cycle charge, the admission event, no restart of a failed group, no merge check on an empty application, a merge baseline, a second tested worker door | F154-FR-020…-030 |
| Groups as units | Frozen task groups as candidates, the independence rule, the acceptance check in the worker tree | F154-FR-031…-037 |
| Shared limits | Slot and hold records in user-level state, the wait as a pause, a temporary root per run | F154-FR-038…-047 |
| Stage groups | A wide stage graph, a workspace per stage, landing by rebase, gate and fast-forward | F154-FR-048…-055 |
| Phase trees and one queue | Declared phase dependencies, trees of their own, the validation queue | F154-FR-056…-060 |
| Work past an open verdict | A speculative tree from the frozen snapshot, the rate rule, set aside on a rejection | F154-FR-061…-067 |
| The red team's channels | One requirement per channel of R29v that a new behaviour re-opens or widens | F154-FR-068…-081 |
| Across every slice | Switches, closed sets, pure tables, schemas, no saving promised, governance kept | F154-FR-001…-008 |

Approach: every decision is a pure table with a rule id, living in `core`, `kernel` or the layer; the CLI engine only wires it; the pipeline runtime and the runtime root are the only composition roots that touch files and processes. What exists is wired before anything new is built: six functions of the layer have no caller today (`groupGate`, `printThePlan`, `workersForTheRestOfTheAttempt`, `chargeCyclesPerAdmittedTask`, `admissionEvent`, `scopesAreDisjoint`), and the quota module of feature 127 has no engine caller at all.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later (the baseline ran on v22.23.2). One script of the trial is Node (`scripts/trial.mjs`, new). The Language Ledger stays empty.

**Primary Dependencies**: `@specstride/contracts` and `@specstride/kernel` for every pure table; `@specstride/policy` for the quota window facts (feature 127); the tree-store, check-runner, lock and harness ports of feature 100. No dependency from npm is added. git is reached only through the tree-store service and, for landing, through the runtime's hardened git (PU-81).

**Storage**: files only, written by the runtime root. In the control plane: the parallel plan under `run:<runId>:parallel-plan` (existing), the ledger kinds `parallel` (row 184, five kinds proposed), the pause record `run:<runId>:pause` (existing, one class proposed), the queue and set-aside records (new logical names, annex B rows proposed). In user-level state (`<user-state>` of `layout.json:8`): the slot directories and the hold record (new; the runtime root becomes a writer of that root, annex B row proposed). Nothing is written under the project's repository directory by a run.

**Testing**: `node:test` through `tests/isolate.ts`, stub harnesses of the test kit (`stubClaude` of `packages/cli/test/engine/loop-speed-helpers.ts:23`; the injected `startDoor` and `runner` seams of `ParallelWiringInput`), fake binaries (XII). No test calls a model. The fixtures are named FX-154-PLAN, -GROUPS, -SLOTS, -STAGES, -PHASES and -SPEC (quickstart.md). The frozen events of feature 153 are the first case of every trial (F154-FR-019). The full suite is never run from this plan's tasks in parallel with a live run: `scripts/ci-test.mjs` takes `--parallel <n>`, and the default stays serial on a shared host.

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (feature 100, Decision 12): the atomic rename of a slot directory and the liveness socket behave as the lock's do, and no more is claimed.

**Project Type**: one module group inside `@specstride/core` (`host-limits/`, `phase-queue/`, `speculation/`, `landing/`, `trial/`, and additions to `parallel/` and `report/`), one module group inside `@specstride/layer-parallel` (`groups.ts`, `repeat.ts`, `independence.ts`), one edge module inside `@specstride/runtime` (`limits/`), changes in `@specstride/pipeline` (the stage graph, the workspace of a stage, the landing) and in `@specstride/cli` (wiring, the doctor and report callers).

**Terminology**: the *acceptance check* is the group's check of F153-FR-055; when it runs in the worker tree its record is the *worker check record* (`specstride.worker-check/1`, rule set WC), its refusal reason is `group-check` and its switch is `loop.parallel.groupCheck`. Prose says "acceptance check"; ids stay as they are. A *recorded read* is `specstride report` over a frozen copy of events; an *engine replay* is a fixture that re-runs a phase with its ledger.

**Performance Goals**: starting values with low confidence. The printed plan of a feature of 200 tasks under 1 s (as 142's). The report over the frozen events of 153 under 2 s. A slot acquisition under 50 ms when free. No goal is a saving.

**Constraints**: core and layer import neither `node:fs` nor `node:child_process` (`packages/contracts/data/package-graph.json`); no daemon, socket or watcher carries a decision (I); no model takes or releases a lock, a slot or a hold, merges, or judges independence (F154-FR-005); no new exit code, stop reason or run state (F154-FR-002); no paid call in tests; no name of a harness in shared control flow.

**Scale/Scope**: 81 functional requirements in nine groups (G0 8, G1 11, G2 11, G3 7, G4 10, G5 8, G6 5, G7 7, G8 14), 14 success criteria, 19 ruling rows (all answered), 9 switches (one existing), 7 closed-set deltas proposed (none for exit codes, stop reasons or run states), 17 cross-spec amendment rows, 11 new schemas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.3 of 2026-11-08, `/root/specstride-dsh/.specify/memory/constitution.md`, the newest engine copy (stage 1, "Constitution checked"; the hermes 3.2.0 copy binds only that repository). Each row is built from [constitution-grounding.md](constitution-grounding.md); "T-x" names its tension.

**The gate and the loop (I–V)**

- [x] I. ✅ PASS. Coordination is through files: slot and hold records in user-level state, written by one runtime root each through an atomic rename, with an owner record and a liveness proof as the lock has (T-d). No service carries a decision. The gate reads a phase's evidence only after its pass has exited, in a tree of its own for P6 and P7 (T-g, T-h). The landing rebase and gate run inside the stage's own runtime root (T-e, T-f).
- [x] II. ✅ PASS. No inner check approves: the group's acceptance check can only withhold a delta (F154-FR-034), and its result reaches neither the gate nor the critic. The full gate runs once per phase attempt on the merged tree (F154-FR-006, -038), and on the rebased tree before a landing fast-forwards (F154-FR-051). An approval stays bound to its verdict across a landing (F154-FR-053; PR #41). Each phase of the queue gets a fresh critic and its own nonce (F154-FR-058).
- [x] III. ✅ PASS. Every check is run by the runtime: the acceptance check in the worker tree through `runEngineCheck` with the check runner, bound to three fingerprints (the group's base snapshot, and the tree before and after the check) so that a change before or during the check reads `tainted` (F154-FR-034, -035). The merge baseline is a recorded comparison, not a scoped gate (F154-FR-028). The speculative unit works in a tree while the workspace, the gate's set, does not change (F154-FR-061). Project configuration only lowers the host bounds (F154-FR-046).
- [x] IV. ✅ PASS. Phase dependencies are read through the canonical model from one new field, parsed by the spec-format adapters alone (F154-FR-056; CQ-154-07 A). No private parser of `tasks.md` is added. The alternative, a declaration in the launch contract, is a second grammar and is rejected (research.md).
- [x] V. ✅ PASS. Every event of this feature goes through the engine's one writer; a sink that fails does not reach the group. The report reads events and prints "not in the events" where none holds a value (F154-FR-012).

**The product and its edges (VI–XII)**

- [x] VI. ✅ PASS. Strict TypeScript; every new record has a schema (F154-FR-007; contracts/); no package and no npm dependency is added; the extension points consumed are EP-02 (tree store), EP-03 (check runner), EP-12 (lock), EP-15 (the loop layer) and the harness port, each at major 1; core and layer stay free of file-system modules.
- [x] VII. ✅ PASS. `concurrentSessions` is read from the registry (`concurrentSessionsOf`, `packages/layer-parallel/src/preconditions.ts:156-178`), never by a harness's name; no rule names a harness (F154-FR-029). A discovered harness runs no group.
- [x] VIII. ✅ PASS. The operator's configuration is never mutated: the worker door opens for an adapter only on the proof of F154-FR-030, whose first item is the fake-binary test that N sessions leave the configuration home byte-identical. A worker pass is a fresh session (T-c). The temporary root of a run is removed when the run ends, for any cause (F154-FR-043).
- [x] IX. ✅ PASS. The critic has no tools, or the read denial of a worker root is confirmed before a read-only critic is called. The sweep before a critic-class call holds under P7 with the amended wording of F142-FR-070 (T-h, CQ-154-08 A); under a refusal no speculative unit starts before the critic returns (F154-FR-067).
- [x] X. ✅ PASS. "Tested" for `concurrentSessions` requires a pinned version with `verified-on` (F154-FR-030). The dsh adapter pins `0.1.0-rc.8`, verified-on 2026-09-29, and declares `3` from a recorded live check (CT-130-46); the claude adapter declares none until its capture B.
- [x] XI. ✅ PASS. New events are additive inside the major and off under `parity`; the compatibility projection is byte-identical on the oracle fixtures. The report computes a share only from timed events and never imputes a value (F154-FR-012).
- [x] XII. ✅ PASS. Tests use stubs and fake binaries; no test calls a paid API; the trial runs on fixtures with stub agents (F154-FR-018); no model id is written in a rule.

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ PASS. Every decision is a pure table with a rule id, recorded with its reason before it takes effect (F154-FR-003; the rule-id sets below). The trial's pass mark is a table, never a model's judgment (T-i).
- [x] XIV. ✅ PASS. Declared verification is preserved: the acceptance check is the group's frozen check of the launch contract (F153-FR-055); a group with no resolvable check is `unchecked` and goes on to the merge check (F154-FR-035). Nothing is invented.
- [x] XV. ✅ PASS. `launch --dry-run` derives, prints the plan and stops; printing takes no slot, writes no record and starts no worker (F154-FR-010). With the option off the plan may be printed, labelled, under `parity` never (F154-FR-009; CQ-154-19 A).
- [x] XVI. ✅ PASS. A wait for a slot or a hold is a pause of the class `host_slot`, which spends nothing; counts survive it (F154-FR-045). Nothing removes a record whose owner lives; one whose owner is proven dead is reclaimed by a contending runtime root through the lock's own liveness proof; one whose liveness is unknown counts as held (F154-FR-044). The supervisor only reads.
- [x] XVII. ✅ PASS. A missing prerequisite (an unreadable dependency declaration, a broken slot store, a landing failure) is a fallback to serial with its reason recorded, never an error that stops a run (F154-FR-004).
- [x] XX. ✅ PASS. This feature extends the principle's reach. Parallel work starts only after deterministic checks of write scopes and of dependency (F154-FR-032, -057), every decision is recorded, the merge check and the full gate run on the merged tree before the critic, no model merges, and no behaviour adds a verdict, an outer counter, an exit code or a stop reason (F154-FR-002, -005, -006). Behaviours 5 to 7 fall outside R29's red team and carry their own pass (G8; CQ-154-10 A).

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ PASS. Every behaviour is off under `parity` and turns on only by a register row that names its output fields (F154-FR-001; the spec's "Rows of the `parity` profile"). The deliveries of 142's own requirements ride 142's switch and need no new row, except the no-repeat rule (T-k). The register's top row today is DV-120 in `docs/ecosystem/consolidation.md` (its map file runs to DV-122: a drift recorded, not fixed here).
- [x] XIX. ✅ PASS. Host-facing output is terse: the plan is terse by default with the serial list behind the verbose flag (F154-FR-010); the report adds rows only where events hold them; the `[LOOP]` line gains no field.

**Governance, Workflow and Additional Constraints**

- [x] Governance. ✅ PASS. Every deviation is in Complexity Tracking (none), every ruling is a row of the spec, and the closed vocabularies change only by the answered ruling CQ-154-09.
- [x] Development Workflow. ✅ PASS. Every failed precondition degrades to serial (F154-FR-004).
- [x] Additional Constraints. ✅ PASS. "Single run per workspace" holds per stage workspace: each stage of a wide group is one run with its own lock, process tree and runtime root (T-e). A parked stage is the existing exit 22. Micro-loops and parallel units add no exit code and no stop reason.

**Re-check after Phase 1 design**: unchanged. The design adds no package and no dependency; it adds one edge module (`runtime/src/limits/`) and one new writer of the user-level state root, both recorded as annex B proposals.

## Delivery slices

Each slice ships alone, in this order. "Acts on" uses the feature input's own measures; no slice promises a saving.

| Slice | What lands | Switch | `parity` | Acts on |
|---|---|---|---|---|
| P1 Measure | The plan printed by the doctor and the dry run from one renderer; the report's shares, in-pass time outside passes and per-group rows; the trial script and its record | none (read verbs); the trial changes one switch | nothing printed under `parity` | the proposer share, 42.9 % (152) and 43.7 % (153) of the two measured windows; the 28 groups of 153 that were visible only by script |
| P2 The layer in full | Every group of the plan in plan order; `groupGate` wired; quota observation, halving and cycle charge; the admission event; no repeat, no empty merge check, merge baseline; the dsh door's fake-binary test | `loop.parallel.units` (142), `loop.parallel.noRepeat`, `loop.parallel.mergeBaseline` | off | the 21 starts of `g-23-1`, the 22 empty applications, the 4.74 h of merge checks of 153 (R-M16) |
| P3 Groups as units | Frozen groups as candidates, the independence rule, the acceptance check in the worker tree, the `group-check` refusal | `loop.parallel.groupUnits`, `loop.parallel.groupCheck` | off | the task groups of 153 that carry a scope and a check and relate to nothing (R-Q23) |
| P4 Shared limits | Slot and hold records, the `host_slot` pause, the temporary root per run | `host.limits` | off | the four lanes that collided on inodes, heat, memory and the quota account (O1–O5) |
| P5 Stage groups | Wide groups in the stage graph, a workspace per stage, the landing | `pipeline.stageGroups` | off | the lanes' `width` and `never_together`, with no gate on the rebased tree (R-O9) |
| P6 Phase trees and one queue | The dependency field, trees of their own, the validation queue | `loop.phases.parallel` | off | phases 2 and 3 of a feature declared independent, both worked while phase 1 is judged |
| P7 Work past an open verdict | The speculative tree, the rate rule, set aside | `loop.speculate` | off | the gate and critic share, at most 15.9 % of the window as a bound (R-M8); off on every measured run at 50 % (R-M11) |
| G8 and G0 | Carried inside every slice: the channel requirements, the invariants, the closed-set proposals, the register rows | every switch | unchanged | the 15 channels of R29v marked re-opened or widened |

Slices 1 to 3 are the core. Slice 4 serves anything that runs twice on a host. Slice 5 is the first across runs. Slices 6 and 7 are built last and stay off until the trial of P1 supports them (owner, 2026-11-15). G8 is not a slice of its own: each of its requirements lands with the behaviour that re-opens its channel (the change map says which).

## Slice order and dependencies

| Order | Slice | Needs |
|---|---|---|
| 1 | P1 | The stored plan of 142 (`planAtLaunch`), the two existing renderers to replace, the report reader of PR #40 |
| 2 | P2 | P1's plan (the groups are printed from it); the policy quota module (feature 127); the ledger counters of 143 |
| 3 | P3 | P2 (every group in plan order); the frozen groups of 153; `closeTheGroup` of 143 |
| 4 | P4 | The lock's probe and reclaim (feature 122); the pause record (feature 127); no other slice |
| 5 | P5 | The pipeline's stage graph and stage loop (feature 123); the gate of the engine (feature 101); P4's slot for the per-host check bound |
| 6 | P6 | The canonical model and the spec-format adapters (feature 104); the tree store (feature 143); the gate, critic and approval path of the engine; P5's landing code for the rebase |
| 7 | P7 | P6 (a phase tree and the queue); the sweep before a critic-class call (feature 142); the approval-rate row of PR #40 |

## Change map

"Wired" means: exists today, no non-test caller; the caller named is added. "Changed" means: exists with a caller and is modified. "New" is justified in its design section. Anchors are `path:symbol` at `aafb367f`.

| F154-FR | Lands in (file:symbol) | Port / lock consumed | Package | New, changed, or wired |
|---|---|---|---|---|
| F154-FR-001, -002 | `packages/contracts/data/parity-profile.json` `switches[]` (9 rows, fields named); `closed-sets.json` (proposals in contracts/) | — | contracts | changed (data) |
| F154-FR-003, -007 | Every rule table below, each `specstride.table/1` under `contracts/` and mirrored by a constant | — | core, layer-parallel | new |
| F154-FR-004 | `packages/layer-parallel/src/preconditions.ts` fallback reasons (`harness`…; `dependency-unreadable` proposed; the unreadable slot store is SL-5 of `host-limits/`, not a layer fallback) | — | layer-parallel | changed |
| F154-FR-005, -006, -008, -037, -038 | No code: invariants, each with a test in `tests/inertness/154/` (the governance rows of F154-FR-006; one validation stream, F154-FR-038; the phase as the unit, F154-FR-037) | — | — | new (tests) |
| F154-FR-009, -010, -011 | `packages/layer-parallel/src/plan.ts` `printThePlan:543` (one renderer, terse; verbose flag) | — | layer-parallel | wired |
| F154-FR-009, -010, -011 | Callers: `packages/cli/src/engine/handlers.ts` `doctorHandler:580-630` (replaces the literal list for the plan line); `packages/pipeline/src/contract/launch/dry-run.ts:355-356` and `packages/pipeline/src/entry/dry-run.ts:160-162` (replace `parallelPlanLines:167-205`) | the plan record read from the launch contract | cli, pipeline | changed |
| F154-FR-012, -014, -015 | `packages/core/src/report/rows.ts` (shares as a union; in-pass time outside passes; per-group rows) and `packages/cli/src/inspect/report.ts` `reportHandler:113-145` | `select.ts` `engineEventFilesOf:138-158` | core, cli | changed |
| F154-FR-013, -016, -017 | Delivered by PR #40 (`rows.ts`, `select.ts`); recorded by a test | — | core, cli | delivered |
| F154-FR-018, -019 | `scripts/trial.mjs` (new: runs a fixture set twice, diffs the reports and the closed sets, writes the trial record); `packages/core/src/trial/pass-mark.ts` (new: TRI-1…TRI-3) | the engine's launch with stub agents | core, scripts | new |
| F154-FR-020 | `packages/cli/src/engine/parallel-wiring.ts` `theGroupOfThePhase:100-102` → `theGroupsOfThePhase`; `startIfTheBoundaryIsClean:529-772` loops over groups; `groupOrdinal` from the loop (`:558`, `:667`); `parallel-group.ts` `membersOfTheGroup:132-140` | `cleanPassBoundary` (`decide.ts:104`) | cli | changed |
| F154-FR-021 | `packages/cli/src/engine/parallel-launch.ts:252` (`utilisationPerCent` from `readLimitWindow`/`headroomOf`, `packages/policy/src/quota/windows.ts:158, :318`) and per group before `groupGate`; `packages/layer-parallel/src/admission.ts` `groupGate:939` `headroomVerdicts:814` | policy quota EP | cli, layer-parallel | wired |
| F154-FR-022 | `admission.ts` `workersForTheRestOfTheAttempt:202`, `halvedAfterTransientRateLimits:189`, called at each group start of the attempt | — | layer-parallel | wired |
| F154-FR-023 | `packages/layer-parallel/src/decide.ts` `chargeCyclesPerAdmittedTask:1055`, `cyclesSufficeForTheGroup:1101`, called at group start; `groupGate`'s `checkQuotaBudgetDiskAndCycles:908` | the micro-loop counters | layer-parallel | wired |
| F154-FR-024 | `decide.ts` `admissionEvent:686`, emitted per task at admission and per group (F154-FR-033) | the engine's `emit` | layer-parallel, cli | wired |
| F154-FR-025 | `decide.ts` `countFailedGroups:1640`, `attemptCountersAfter:1645`; `run-feature.ts:4692` `failedGroupsBefore: 0` → the ledger count | the ledger | cli, layer-parallel | wired |
| F154-FR-026 | `packages/layer-parallel/src/repeat.ts` (new: RP-1, RP-2 over the ledger's failed groups and the fingerprint of the paths a group's tasks name); `groupGate` admits it as the check `repeat` | the ledger, the tree store's `changed` | layer-parallel | new |
| F154-FR-027 | `packages/cli/src/engine/parallel-drive.ts` `theMergeCheckOfTheGroup:560-574`: no merge check when the applied path count is 0 | the ledger's application record | cli | changed |
| F154-FR-028 | `packages/core/src/parallel/merge-baseline.ts` (new: MG-2, the comparison; record `specstride.merge-baseline/1`); `merge-check.ts` `outcomeOfTheMergeCheck:283` reads it; `packages/cli/src/engine/parallel-attempt.ts:628-632` passes the base result | the ledger's in-pass check results with their fingerprints (`micro-layer.ts` `runCheckCommand:407-447`) | core, cli | new, changed |
| F154-FR-029, -030 | `packages/layer-parallel/src/preconditions.ts` `concurrentSessionsOf:156-178` reads a new `testedUnder` fact of the descriptor; `packages/adapter-dsh/test/concurrent-sessions.test.ts` (fake-binary, N = 4); `packages/adapter-claude/src/detect.ts:373-405` after capture B; `run-feature.ts` `parallelEntryOfTheRun:2855-2877` | the harness registry | layer-parallel, adapter-dsh, adapter-claude | changed, new (test) |
| F154-FR-031 | `plan.ts` `planAtLaunch:380` takes the frozen groups of `run-feature.ts` `frozenGroupsOfThePhase:3240` as candidates when `groupUnits` is on; `packages/layer-parallel/src/groups.ts` (new: a group → one `PlannedGroup` with its write scope) | the launch record's `configuration.taskGroups` | layer-parallel, cli | new, changed |
| F154-FR-032, -033 | `packages/layer-parallel/src/independence.ts` (new: PG-1…PG-3, reusing `scope.ts` `scopesAreDisjoint:168` and `pathsNamedByTheTextOfATask:285`); the check `dependency` in `types.ts` `ADMISSION_CHECKS:87-96` (proposed) | — | layer-parallel | new, wired |
| F154-FR-034, -035, -036 | `packages/cli/src/engine/parallel-group.ts` `closeTheGroup:658-736`, between `:592` and `:707`: `runEngineCheck` (`check-run.ts:65-90`) with `cwd: worker.tree`, the declared limit, `store.snapshot` before and after; the verdict feeds `endRefusalOf` (`parallel-drive.ts:401`); `packages/core/src/parallel/audits.ts` `DELTA_REFUSAL_REASONS:58-67` gains `group-check` (proposed); `counters.ts` charges one repair per task of the group | the check runner, the tree store | cli, core | changed |
| F154-FR-037 | No code: the unit of approval stays the phase (a test) | — | — | new (test) |
| F154-FR-039…-042 | `packages/core/src/host-limits/slot-admission.ts` (new: SL-1…SL-5); `packages/runtime/src/limits/slot-store.ts` (new: one directory lock per slot under `<user-state>/slots/<bound>/`, width N, on `createDirectoryLock` `directory-lock.ts:266`); callers at the gate (`run-feature.ts:1270`), the merge check (`parallel-drive.ts:583`) and the proposer pass start | the lock EP (`acquire`, `probe`, `release`) | core, runtime, cli | new |
| F154-FR-041 | `packages/runtime/src/limits/hold-record.ts` (new: written by `enterPause` `packages/policy/src/quota/pause.ts:322-397` when `host.limits` is on; read before a pass) | the quota classifier EP | runtime, policy, cli | new, changed |
| F154-FR-043 | `packages/runtime/src/limits/temp-root.ts` (new: `mkdtemp` at run start, `TMPDIR` for checks and `SPECSTRIDE_WORKER_TMPDIR` for workers, removed at run end); `run-feature.ts:1273` uses it | — | runtime, cli | new, changed |
| F154-FR-044, -045, -046, -047 | `slot-store.ts` reuses `ownerRecordFor:543-562` and `probeLock` (`probe.ts:469`); the wait is `enterPause` with the class `host_slot` (proposed in §C.13); `resume` (`resume.ts:266-296`) at release | the lock EP, the pause record | runtime, policy | new, changed |
| F154-FR-046 | `packages/layer-parallel/src/register.ts` and the config envelope: project values may only lower | — | layer-parallel | changed |
| F154-FR-048 | `packages/pipeline/src/executor/stage-admission.ts` (new: SG-1…SG-4); `packages/pipeline/src/executor/graph.ts` `declareStageGraph:24-29` builds groups of `width` from `configuration.stageGroups` (new key; the contract schema `launch-contract.schema.json:158` is closed, so the key is an F107 amendment); validation of cycles, unknown stages, cross-group `never_together` | — | pipeline, contracts | changed |
| F154-FR-049, -055 | `packages/pipeline/src/executor/stage-loop.ts:255` runs a wide group's stages at once; `packages/pipeline/src/executor/stage-workspace.ts` (new: a worktree of home per stage through a port, removed after landing or park); each child launched by `child.ts` `runStageChild:106` with its own workspace; the P4 slot bounds them | the tree store, the lock EP | pipeline, runtime | new, changed |
| F154-FR-050…-054 | `packages/core/src/landing/landing-rule.ts` (new: LD-1…LD-4); `packages/pipeline/src/executor/landing-run.ts` (new: rebase, the full gate through the check runner, `--ff-only`, the landing record, the rewrite note of `approval-commit.ts` `approvalCommitStanding:67-85`) | the check runner, the hardened git of PU-81 | core, pipeline | new |
| F154-FR-056 | `packages/contracts/src/records/generated/canonical-spec-model.ts` `SpecPhase:49-63` gains `dependsOn` and `writeScope`; `packages/spec-formats/src/*` parse one comment line under a phase heading | — | contracts, spec-formats | changed |
| F154-FR-057…-060 | `packages/core/src/phase-queue/validation-queue.ts` (new: PQ-1…PQ-3); `run-feature.ts` admits the next phase tree through `materialize` (`tree-store/src/index.ts:187`) and the queue's head through the existing gate, critic and approval path | the tree store, the gate, the critic, the approval store | core, cli | new, changed |
| F154-FR-061…-067 | `packages/core/src/speculation/speculation-rule.ts` (new: SP-1…SP-6, the rate over the ledger's attempts); `run-feature.ts` starts a speculative tree at the gate's start, integrates it through `integrateGroup` (`integrate.ts:288`) on an approval, discards it on a rejection; `before-critic.ts` sweep with the amended F142-FR-070 wording | the tree store, the ledger, the approval rate row | core, cli | new, changed |
| F154-FR-068…-081 | Each lands with its slice: V-01 with the vocabulary test of F142-FR-066 over the new fixtures; V-02/-09 with `materialize`; V-04 with the worker check; V-05 with `landing-run.ts`; V-08 with the temp root; V-11/-13/-21 with speculation; V-12/-19 with stop and resume; V-15/-17/-16 with the slot; V-18 with `layerOffDecision` | — | as the slice | as the slice |

Core purity: every rule table (`repeat.ts`, `independence.ts`, `groups.ts`, `slot-admission.ts`, `merge-baseline.ts`, `landing-rule.ts`, `validation-queue.ts`, `speculation-rule.ts`, `pass-mark.ts`) lives in core, kernel or the layer and imports neither a file-system module nor a process. The composition roots (`run-feature.ts`, `parallel-*.ts`, `pipeline-main.ts`, `stage-loop.ts`) only wire: they read the inputs through ports, call the table, record the decision and act on it.

## Seams added to `runFeature`

Every seam is a parameter of `parallelWiringOfTheAttempt` (`parallel-wiring.ts:384-453`) or of the launch call (`run-feature.ts:2887-2919`), so that the out-of-scope move of the attempt loop into `core` gets easier: the loop keeps reading the same inputs by name.

| Seam | Type | Read from | Set by | Serves |
|---|---|---|---|---|
| `groupsOfThePhase(plan, phase)` | `() => PlannedGroup[]` (replaces `theGroupOfThePhase`) | the stored plan | P2 | F154-FR-020 |
| `groupGateOfTheAttempt(group)` | `(inputs: AdmissionInputs) => GroupVerdict` | `groupGate:939` | P2 | F154-FR-021…-024, -033 |
| `quotaObservationOf(account)` | `() => QuotaObservation` | `readLimitWindow`, `headroomOf` | P2 | F154-FR-021 |
| `failedGroupsBeforeOfTheLedger(phase)` | `() => number` | `countFailedGroups:1640` | P2 | F154-FR-025 |
| `repeatVerdictOf(group)` | `(group) => AdmissionVerdict` | `repeat.ts` | P2 | F154-FR-026 |
| `appliedPathCountOf(group)` | `() => number` | the ledger's application record | P2 | F154-FR-027 |
| `baseResultOfTheInnerSet(snapshotFingerprint)` | `(fp) => CheckResult \| null` | the ledger's in-pass results | P2 | F154-FR-028 |
| `acceptanceCheckOfTheGroup(worker)` | `(tree, check) => WorkerCheckVerdict` | `runEngineCheck` + two snapshots | P3 | F154-FR-034, -035 |
| `groupCandidatesOfThePhase(phase)` | `() => TaskGroup[]` | `frozenGroupsOfThePhase:3240` | P3 | F154-FR-031 |
| `hostSlots(bound)` | `{acquire, probe, release}` | the slot store | P4 | F154-FR-039…-042 |
| `holdOfTheAccount(account)` | `() => HoldRecord \| null` | the hold record | P4 | F154-FR-041 |
| `tempRootOfTheRun()` | `() => string` | the temp root | P4 | F154-FR-043 |
| `phaseDependenciesOf(phase)` | `() => string[]` | the canonical model | P6 | F154-FR-056 |
| `validationQueue` | `{admit, head, pop}` | the queue record | P6, P7 | F154-FR-058, -059 |
| `speculationVerdictAt(phase)` | `() => SpeculationVerdict` | `speculation-rule.ts`, the ledger | P7 | F154-FR-062, -066, -067 |

## Rule-id sets fixed by this plan

Each set is a `specstride.table/1` file in `contracts/` (`*-table.json`), mirrored by a constant in the code that imports it. Every rule has its reason as a member of a closed set (the deltas are proposals under CQ-154-09).

| Set | Members | Where |
|---|---|---|
| PG, independence of two groups | PG-2 a declared `dependsOn` → dependent. PG-3 a declared `independentWith` → independent. PG-1 every task of both groups carries `[P]`, scopes disjoint and no task of the later group names a path in the earlier group's scope → independent. Otherwise dependent | `independence.ts` |
| SG, admission of a stage into a wide group | SG-1 a cycle, an unknown stage or a `never_together` across groups → refused at validation (exit 20). SG-2 dependencies all in earlier groups or the same group, and no `never_together` with a member → the same group. SG-3 the group is at `width` → a new group, in declared order. SG-4 otherwise → its own group | `stage-admission.ts` |
| RP, no repeat | RP-1 a group over the same task set failed in an earlier attempt of the phase and the fingerprint of the paths its tasks name is unchanged → refused with `repeat`. RP-2 otherwise → admitted | `repeat.ts` |
| MG, outcome of a merge check | MG-1 application of 0 paths → no merge check, no charge, not failed. MG-2 the failing commands all failed on the base result with the same failure signature → no charge, not failed, not kept. MG-3 otherwise → F142-FR-061 unchanged | `merge-baseline.ts`, `theMergeCheckOfTheGroup` |
| WC, the worker check | WC-1 passed, three fingerprints equal → the delta goes on. WC-4 no resolvable check → `unchecked`, the delta goes on. WC-3 the after-reading differs from the base snapshot or the before-reading → `tainted`, which withholds and is charged as WC-2. WC-2 failed → refused with `group-check`, one repair per task of the group, the group counts as failed | `parallel-group.ts` `closeTheGroup` |
| SL, slot admission | SL-1 a free slot → take it. SL-2 every slot held by a live owner → wait (pause `host_slot`). SL-3 a slot whose owner is proven dead (`stale-owner-dead`) → reclaim, then SL-1. SL-4 `held-foreign` or `unknown` → counts as held, wait. SL-5 the store is unreadable → proceed unbounded, reason recorded | `slot-admission.ts` |
| LD, landing | LD-1 clean rebase and green gate → fast-forward. LD-2 rebase conflict → park. LD-3 red gate → park. LD-4 a landing record without a fast-forward → resume the landing | `landing-rule.ts` |
| PQ, the validation queue | PQ-1 every dependency approved → the phase is the head. PQ-2 a dependency rejected → wait. PQ-3 no declared dependency → the phase before it | `validation-queue.ts` |
| SP, speculation | SP-1 rate at or above the minimum and depth below the bound → start. SP-2 rate below → `rate`. SP-3 depth reached → `depth`. SP-4 the sweep cannot be confirmed → `sweep`. SP-5 the verdict approves → integrate like a group. SP-6 the verdict rejects → set aside | `speculation-rule.ts` |
| TRI, the trial's pass mark | TRI-1 no breach invariant of F142-FR-071 fails. TRI-2 every test of a rule passes. TRI-3 the sets of exit codes, stop reasons and run states are subsets. Pass = TRI-1 ∧ TRI-2 ∧ TRI-3 | `pass-mark.ts` |

## Designs

### Measurement design (P1)

- **One renderer, two callers.** `printThePlan` (`plan.ts:543`) is the only renderer; it is pure (lines in, lines out), terse by default, with the serial list behind a verbose flag, and ends with `expectedSavingStatement` (`:656`). Today two renderers disagree: `printThePlan` is stored on a doctor observation and never printed, and the dry run prints `parallelPlanLines` (`contract/launch/dry-run.ts:167-205`) from the contract's flags. Rejected: keeping the dry run's renderer and adding the doctor's beside it — two renderers can drift, and F154-SC-002 asks for the same bytes.
- **The callers.** The doctor: `doctorHandler` (`handlers.ts:580-630`) calls the plan observation (`doctor.ts` `planObservation:214`) and prints its lines; the hard-coded findings list stays for the other checks. The dry run: `contract/launch/dry-run.ts:355` and `entry/dry-run.ts:160` call `printThePlan` instead of `parallelPlanLines`. Both compute the plan from the same stored record or, before a launch, from `planAtLaunch` on the same inputs, so the bytes are the same (F154-SC-002).
- **With the option off** (CQ-154-19 A): the line is printed only behind the verbose flag of F154-FR-010, labelled `plan the option would produce`; by default nothing is printed with the option off, so no behaviour is on by default (F154-FR-001). Under `parity` nothing is printed (F154-SC-012). The first case of every trial is the *recorded read* of 153's events (F154-SC-009); SC-010 is an *engine replay* of phase 23 with its ledger.
- `docs/options/parallel-units.md:36` is corrected in the same change: it tells the operator to read the plan before switching on, and then says the doctor prints none with the option off.
- **The report's rows** (in `core/src/report/rows.ts`, printed by `report.ts`): the shares of the window as a union over `pass.*`, `check.*`, gate and critic timed events, so that no time counts twice; the in-pass check time while no pass ran (M10); per group its phase, outcome, applied path count, merge-check result and wall time; the counts of groups and workers by outcome. A share whose events are missing prints `not in the events` (XI). Under `parity` every new row of G1 is absent, as the events it reads are (F154-FR-012); the rows that existed before this feature print as before. The definition of *approvals per attempt started* is the one PR #40 wrote: approvals, counting `phase.ended` of the old vocabulary, over attempts started, per phase and for the run. On the frozen events of 153 the report must print 336, 29, 274 of 386 and 28 `repair` (F154-SC-009); the expected values live in the recorded fixture of PR #40 (`packages/cli/test/.../fixtures/loop-speed/recorded-152/`) and a new `recorded-153/`.
- **The trial** (`scripts/trial.mjs`, new, because no runner of fixtures exists: `FX-PAR-S` names an `experiment:e6` script that is not in `package.json`). Arms: the fixture set with the switch off and with only that switch changed, stub agents, the same seed of session ids. It runs `specstride report` on both, compares the sets of exit codes, stop reasons and run states, runs the rule tests, and evaluates TRI-1…TRI-3 in `pass-mark.ts`. The result is written as a trial record (`specstride.trial/1`) under `specs/154-concurrency-and-parallelism/trials/<switch>.json`, with the rows it reports without a pass mark (groups kept, refusals per reason, cost with every pass counted). Its first case is the replay of 153's 28 groups (F154-FR-019). The trial shows safety, not a default: a switch turns on only when the owner reads the record and writes the register row (CQ-154-15 A), a rule deliberately stricter than register rows 134 and 137, which shipped default on.

### Layer-completion design (P2)

- **Every group, in plan order.** `theGroupsOfThePhase` returns the plan's groups; `startIfTheBoundaryIsClean` loops: for each group, the resume join, `cleanPassBoundary`, `groupGate`, then `runTheGroupOfTheAttempt` with `groupOrdinal` from the loop. A refused group's tasks stay serial with the reason recorded. The `[P]` groups of one attempt run one after the other; only groups as units (F154-FR-032) and phases (F154-FR-057) run at once. A group left with fewer than 2 tasks after ticks is cancelled (F142-FR-018). After the count of failed groups reaches F142-FR-023's bound (2), `layerOffDecision` switches the layer off for the attempt and no further group starts (CQ-154-13 A). Rejected: a bound of N groups per attempt — it would bring back "always the first group" under another name.
- **`groupGate` wired.** It is called once per group before its start, with: the quota observation of the proposer's account (`readLimitWindow`, `headroomOf`; today `utilisationPerCent: []` at `parallel-launch.ts:252`), the budget, the disk, the remaining cycles, the inner check set (non-empty) and the adoptable jobs. Its verdicts are recorded through `admissionEvent` per task and per group. With no observation in the run a group has 2 workers (F154-FR-021).
- **The halving and the cycle charge.** `workersForTheRestOfTheAttempt` is read at each group start after a group ended with two transient rate limits (`halvedAfterTransientRateLimits`); `chargeCyclesPerAdmittedTask` is called at a worker's first start, and `cyclesSufficeForTheGroup` feeds `groupGate`'s `cycles` check.
- **No repeat (RP).** At `groupGate`, `repeat.ts` looks up the ledger of earlier attempts of the same phase for a group over the same task set that failed, compares the fingerprint of the paths its tasks name (through the tree store's `changed` against the base of that attempt) and refuses with `repeat` when unchanged. The fingerprint is the existing content fingerprint of feature 116 over the named paths. Rejected: a per-phase memory in the process — it would not survive a relaunch, and 153 spanned many.
- **No empty merge check (MG-1).** `theMergeCheckOfTheGroup` reads the applied path count from the ledger after `apply`; at 0 it runs no check, charges nothing, and the group is not failed. The unit is not kept (F142-FR-060 stands).
- **The merge baseline (MG-2).** The in-pass checks of the main line already record a before/after fingerprint (`micro-layer.ts` `runCheckCommand:407-447`). `baseResultOfTheInnerSet` finds the latest result set whose fingerprint equals the group's base snapshot; `merge-baseline.ts` compares the merge check's failing commands with it by the failure signature of F115-FR-019 (the ordered ids and exit codes). A match charges nothing and the group is not failed; the unit is not kept; the comparison is recorded with its rule id. With no such result F142-FR-061 applies unchanged. The verification gate is not touched. Rejected: scoping the merge check to the group's paths — it would weaken XX's "deterministic merge check on the merged tree".
- **The second worker door.** The descriptor gains a `testedUnder` fact naming the three proofs of F154-FR-030; `concurrentSessionsOf` reads it with the capability. The dsh adapter has the live check (CT-130-46) and the pin; its fake-binary test is added (`test/concurrent-sessions.test.ts`, N = 4, the home byte-identical). The claude adapter declares none until its capture B (`detect.ts:373-405`), then the same test; until then `parallelEntryOfTheRun` keeps `{state: "declared"}` for it and F142-FR-020 refuses the group with `harness`. Rejected: a per-session copy of the configuration at Tier 1 — VIII's "credentials are never copied between homes".

### Group-unit design (P3)

- **Candidates.** With `groupUnits` on, `planAtLaunch` receives the phase's frozen groups (`configuration.taskGroups`, `specstride.task-groups-frozen/1`) and `groups.ts` maps each to one `PlannedGroup` whose scope is the group's write scope (`slicer.ts` `writeScopeOf`, task text at derivation). The `[P]` groups of 142 stay as they are (CQ-154-02 C).
- **Independence (PG).** Two groups run at once only when `scopesAreDisjoint` says their scopes are disjoint and PG-1 holds: every task of both carries `[P]` and no task of the later group names a path inside the earlier group's scope (`pathsNamedByTheTextOfATask`). A declared `depends_on` between two groups (a new optional field of the frozen record, read at derivation) decides the other way (PG-2) and overrides PG-1 (PG-3); a declared `independentWith` decides for independence without the marker rule (PG-3), which is the only way two task groups of 153 are independent, since they carry no `[P]`. Otherwise they run one after the other with the check `dependency`. Rejected: the marker alone — it is "a claim" in XX's words; disjoint scopes alone — they do not show that B does not read what A writes (T-a).
- **The acceptance check in the worker tree (WC).** The seam is `closeTheGroup` (`parallel-group.ts:658-736`) after `Promise.allSettled` (`:592`) and before `closeTheBarrier` (`:707`): for each worker tree whose group has a resolvable check, the runtime reads the group's base snapshot fingerprint (`baseTreeId`), takes a snapshot, runs `acceptanceCheck.argv` with `runEngineCheck` (`cwd: worker.tree`, the declared limit — today a fixed 300 s on the workspace), takes a second snapshot, and records a worker check record bound to all three. A difference between the after-reading and either the base snapshot or the before-reading reads `tainted`, which withholds and is charged as a failed check (III; F154-FR-035, -036). A failure refuses the delta with `group-check` through `endRefusalOf` (`parallel-drive.ts:401`), charges one repair to every task of the group (the one exception to F143-FR-012, CQ-154-04 A) and counts the group as failed. The result reaches no gate and no critic: it is an inner check that can only withhold (II). `merge-check.ts`'s guard (`NO_CHECK_RUNS_IN_A_WORKER_TREE:58`) is narrowed to the merge check, which still never runs there. Rejected: the whole inner set in the worker tree — it spends the suite per group and makes the worker a second validator; no check at all — a failed group would be applied first and repaired on the workspace, which is today's cost (R-C19).
- **Unit of approval.** The phase (F154-FR-037): no group approval exists.

### Shared-limits design (P4)

- **A slot is a directory lock.** The slot store (`runtime/src/limits/slot-store.ts`) holds, per bound, N lock directories under `<user-state>/slots/<bound>/`, made with `createDirectoryLock` (`directory-lock.ts:266`), each with the owner record (`ownerRecordFor:543-562`: host, run, pid, start time, boot id, liveness endpoint) and a lease. `acquire` tries each in order; the verdict is `slot-admission.ts` over the probe outcomes P1 to P6 (`probe.ts:120-128`; the table also holds a default predicate P7 that is never a slot verdict): free → take; `held-live` → wait; `stale-owner-dead` → `reclaimByOneAtomicRename` then take; `held-foreign` or `unknown` → counts as held. Rejected: a daemon or socket that hands out slots — I forbids a service a run depends on; a file with a counter — two runtime roots could not update it atomically without a lock, so the lock is the design.
- **The bounds.** `host.checks.concurrent` (default 1 when on) wraps the gate (`run-feature.ts:1270`) and every merge check (`parallel-drive.ts:583`); `host.sessions.<account>` wraps proposer and worker passes at `startPass`; an exclusive resource declared in user configuration as `host.resources.<name>.capacity` is a slot of that width (the record is `specstride.host-slot/1`). Project configuration may only lower them (III).
- **The wait is a pause.** `enterPause` (`pause.ts:322-397`) is called with the class `host_slot` (a §C.13 member proposed under CQ-154-09; `A_QUOTA_CLASS_SPENDS` says it spends nothing), which writes the existing pause record, emits `run.paused` and sets `paused-quota`, shown by `status` with its class; `resume` (`resume.ts:266-296`) at release. Counts survive (XVI), and paused time is excluded from every time cap, as a quota pause is. A refused slot is one admission event (`host.slot.admission`, proposed), never only a pause. Rejected: a new pause state — it would be a run state, which F154-FR-002 forbids.
- **The hold record.** When `host.limits` is on and a run classifies a `quota_window`, the pause writer of the runtime root (the port `enterPause` writes through) also writes `<user-state>/holds/<account>.json` (`specstride.host-hold/1`, the reset time). A hold expires at its reset time only and is never reclaimed because its writer died: the window is a fact of the account. Before a pass, a run of the same account reads it and waits until the reset through the same pause. Today only the campaign driver knows the hold (`campaign.py` `enter_hold:460-505`).
- **The temporary root.** `temp-root.ts` makes one `mkdtemp` per run at start, exports it as `TMPDIR` for checks (`environment.ts:145`) and `SPECSTRIDE_WORKER_TMPDIR` for workers (`group-executor.ts:186`), and removes it where the runtime root ends a run, for any cause. Today the gate makes one per batch (`run-feature.ts:1273`) and nothing removes them on a kill.
- **Failure analysis.** A holder that dies: its slot's liveness endpoint stops answering, a contender's probe says `stale-owner-dead`, the contender reclaims. A clock that jumps: the lease's `validUntil` is compared with the boot id and start time, as the lock does. Two hosts that see one home directory: the owner record names the host; a slot held on another host is `held-foreign` and counts as held (the feature does not spread runs over hosts). A full disk: the store is unreadable → SL-5, proceed unbounded with the reason recorded, never an error.

### Stage-graph design (P5)

- **The declaration** sits in the launch contract under `configuration.stageGroups`: `{ width, never_together: [{ stages, why }] }`, beside the existing per-stage `depends_on` (`stage.schema.json:20`). The contract's schema is closed (`launch-contract.schema.json:158`), so the key is the F107 amendment row. Validation refuses a cycle, an unknown stage and a `never_together` across groups; the refusal is the existing exit 20 at validation.
- **The admission of a stage** is the rule set SG (below): a pure table over the declaration, with one admission event per stage.
- **The graph.** `declareStageGraph` builds groups: with `pipeline.stageGroups` off, one stage per group as today; on, stages whose dependencies are all in earlier groups or the same group and that share no `never_together` form a group of at most `width`. `StageGraph.mode` gains `wide`; `resumeGroup` already works over groups.
- **A workspace per stage.** For a wide group the pipeline runtime makes, through a port in `stage-workspace.ts`, one worktree of home per stage under the control root, and launches each stage as its own run (`runStageChild`, `detached: true`) with `--workspace <that worktree>`: its own lock, process tree and runtime root (T-e). The pipeline coordinates the runs only through files: each writes its landing record; nothing lands during a stop.
- **The landing** (`landing-run.ts`, LD): when a stage's last phase is approved, in declared order: rebase its branch onto home with the runtime's hardened git (PU-81); on a conflict, abort and park (exit 22 for that stage, home unchanged, no model called); run the full verification gate of the stage on the rebased tree through the check runner under the P4 slot; on red, park; on green, `merge --ff-only`, then write the landing record with the rewrite note of every approval commit (`approvalCommitStanding:67-85` returns `rebased` by patch-id, PR #41). The approvals stand bound to their verdicts (II); no critic is called again (CQ-154-06 A); the base change is a non-blocking phase-entry fact (F149-FR-008). Resume of a half-landed group: a landing record without a fast-forward resumes at LD-1's rebase. Rejected: a merge commit — it breaks the serial history; a critic per landing — it spends a critic call for a fact the next critic already reads.
- **What the lanes are.** `lanes.py` `merge_home:117-171` rebases and fast-forwards with no gate (R-O9); it stays in the campaign driver until this slice's trial passes, then the driver calls the product (complexity tracking: none; it is a follow-up of the campaign, out of scope).

### Phase-tree and open-verdict designs (P6, P7)

- **One mechanism, two entries.** A phase worked outside the main line is a *phase tree*: a worker tree materialized from a snapshot (`materialize`, `tree-store/src/index.ts:187`), with its own pass, and a *validation queue entry* (`specstride.phase-queue/1`) that holds its place in phase order. P6 enters the queue when the phase's declared dependencies are approved and its scope is disjoint from the phases being worked (PG applied to phases, with the phase's declared scope). P7 enters it at the start of the gate of phase n, from the frozen snapshot of n's evidence, at depth 1, when SP-1 holds.
- **The dependency field** (CQ-154-07 A): `SpecPhase` gains `dependsOn: string[]` and `writeScope: string[]`, parsed by the spec-format adapters from one comment line directly under the phase heading of `tasks.md` (`<!-- specstride: depends-on: [2] scope: packages/x/ -->` for Spec Kit); a phase with no line depends on the phase before it (PQ-3). Rejected: the launch contract — a second grammar for one fact (IV).
- **The queue** (`validation-queue.ts`): one ordered list per run; the head is the first phase whose dependencies are all approved (PQ-1); a dependency rejected sends it back to wait (PQ-2). At the head, the existing path runs unchanged on the phase tree: rebase onto the last approved phase, the full gate once, a fresh critic with its own nonce, the approval record and the commit (F154-FR-058). The workspace does not change until then; at the approval the workspace advances to that phase's tree, so the next phase is branched from it and its gate reads the approved tree. Each phase's attempt numbers survive a resume (F154-FR-060).
- **Speculation** (`speculation-rule.ts`): the rate is approvals over attempts started of the run (the PR #40 row) over the last 20 attempts; at or above 50 % and depth below 1, SP-1 starts phase n+1's tree at the gate of n; below, `rate` is recorded (SP-2). On approval the tree integrates like a group (`integrateGroup`), before phase n+1's own gate; on a rejection it is set aside: the tree is discarded, no counter moves, a set-aside record holds its cost (SP-6). Discarding a tree is not a revert of the workspace (F142-FR-061 forbids that revert only). On every measured run the rate is 29 of 336 and 10 of 121, so the switch stays off by design until a trial shows otherwise.
- **The critic's isolation.** F142-FR-070 is amended with the T-h wording: no worker tree *that the critic could read* exists when a critic-class call starts; a speculative tree may exist if the critic has no tools or the read denial of the worker root is confirmed. "Confirmed" is what F142-FR-070 already names: the harness's initial record showing that the critic has no tools (IX), or the sweep before a critic-class call (`before-critic.ts`) recording that every tree outside the adapter's confirmed read denial is gone; a tree the critic could read is one the sweep finds outside a confirmed denial. A speculative unit that does not start has one admission event (`loop.speculation.admission`, proposed) with `rate`, `depth` or `sweep`. If the amendment is refused, SP-4: no speculative unit starts before the critic call returns (CQ-154-08 B).

### Integrity and leak analysis

| Channel (R29v) or invariant (F142-FR-071) | P2 | P3 | P4 | P5 | P6 | P7 |
|---|---|---|---|---|---|---|
| V-01 neutral vocabulary (PU-83) | narrowed, as today | narrowed, as today | unchanged | re-opened → F154-FR-068 (the landing line) | re-opened → F154-FR-068 | re-opened → F154-FR-068, -080 |
| V-02, V-09 opaque paths (PU-82, PU-96) | narrowed, as today | narrowed, as today | unchanged | unchanged | re-opened → F154-FR-069 | re-opened → F154-FR-069 |
| V-04 N checks at once (PU-101) | unchanged | widened → F154-FR-070 | unchanged | unchanged | unchanged | re-opened → F154-FR-070 |
| V-05 hardened git (PU-81) | unchanged | unchanged | unchanged | widened → F154-FR-071 | unchanged | unchanged |
| V-08 shared scratch (PU-85, PU-97) | narrowed, as today | narrowed, as today | widened → F154-FR-072 | widened → F154-FR-072 | re-opened → F154-FR-072 | re-opened → F154-FR-072 |
| V-11 ticks (PU-94) | unchanged | unchanged | unchanged | widened → F154-FR-073 | widened → F154-FR-073 | re-opened → F154-FR-073 |
| V-12 stop (PU-90) | unchanged | unchanged | widened → F154-FR-074 | widened → F154-FR-074 | re-opened → F154-FR-074, -079 | re-opened → F154-FR-074 |
| V-13 sweep before the critic (PU-91) | unchanged | unchanged | unchanged | unchanged | re-opened → F154-FR-075 | re-opened → F154-FR-075 |
| V-15, V-17 time cap and ceilings (PU-86, PU-88) | widened → F154-FR-076 | widened → F154-FR-076 | widened → F154-FR-076 | widened → F154-FR-076 | widened → F154-FR-076 | widened → F154-FR-076 |
| V-16 a cycle per worker (PU-87) | unchanged | unchanged | widened → F154-FR-077 | unchanged | unchanged | unchanged |
| V-18 harness error (PU-89) | narrowed, as today | widened → F154-FR-078 | unchanged | widened → F154-FR-078 | widened → F154-FR-078 | widened → F154-FR-078 |
| V-19 resume states (PU-93, PU-95) | unchanged | unchanged | unchanged | widened → F154-FR-079 | widened → F154-FR-079 | widened → F154-FR-079 |
| V-21 the prompt carries no verdict (PU-103) | unchanged | unchanged | unchanged | unchanged | widened → F154-FR-080 | widened → F154-FR-080 |
| Breach: the critic sees one unit | closed | closed (the check withholds only) | closed | closed | closed | closed by the sweep |
| Breach: no model merges | closed | closed | closed | closed | closed | closed |
| Breach: no outer counter | closed | closed | closed | closed | closed | closed (SP-6) |
| Breach: the gate runs once, in full | closed | closed (the baseline never touches it) | closed | closed (LD-3) | closed | closed |
| Breach: the workspace has one writer | closed | closed | closed | closed per stage workspace | closed (the phase tree) | closed (the speculative tree) |

Failure modes the external sources report, and the design answer:

| Mode | Source | Answer |
|---|---|---|
| Every worker stuck on one failure | E4 | `layerOffDecision` after 2 failed groups (F142-FR-023, wired by F154-FR-025); the group check refuses at the worker, so one stuck worker withholds its own delta only |
| Locks held by agents | E6 | No model takes or releases a lock, a slot or a hold (F154-FR-005); a dead owner's slot is reclaimed by a runtime root only |
| Patches that pass alone and fail together | E10 | Disjoint scopes and the independence rule before any parallel work; the merge check and the full gate on the merged tree before the critic |
| A mis-speculation that costs more than it saved | E11, E12 | The rate rule with a measured default that keeps P7 off on every measured run; a set-aside unit's cost is reported (F154-FR-064) |

### Determinism analysis

- Every new decision is a pure function with a rule id (the sets above) over inputs read from records: the plan, the ledger, the slot probes, the dependency declaration, the approval counts. The same inputs give the same decision (F154-SC-002, -006).
- What is hashed: the plan (`specstride.parallel-plan/1` hash, unchanged); the worker check record binds the two tree fingerprints; the landing record binds the rebased tree's fingerprint and the gate result; a slot record is the lock's lease and owner record.
- What the order of completion can change: nothing in the applied tree (composition stays disjoint-only, F143-FR-019) and nothing in a decision (the queue is ordered by phase, the landing by declaration). It can change only the order of events between workers, which carry `workerId` and `wseq`.
- Property tests (planned): every permutation of worker completion on FX-154-GROUPS gives 0 bytes of difference (F154-SC-003); a kill at each step of the landing, the queue and speculation leaves a resume state from which the next run reaches the same end (F154-FR-079); the plan over 100 repeated derivations is byte-identical (F154-SC-002).

### Cost design

| Unit | Tokens | Disk | Quota | Recorded in |
|---|---|---|---|---|
| A worker of a group | its own usage, per model call (`workerId`) | its worker tree, released after the barrier | one cycle per admitted task at first start (F142-FR-021, wired) | the ledger kinds `parallel`; the report's per-group row |
| The acceptance check | none (a command) | the two snapshots in the store | its time, inside the attempt's cap (F154-FR-076) | the worker check record |
| A stage workspace | the stage run's own | one worktree per stage, removed after landing or park | bounded by the P4 slots | the stage workspace record |
| A speculative unit | the phase's proposer passes, in full | one tree, discarded on a rejection | no outer counter; its cycles are reported as cost | the set-aside record; the report |
| A slot wait | none | none | none (`host_slot` spends nothing) | the pause record and the two events |

Admission rules that refuse work the host cannot carry: `groupGate`'s headroom, budget, disk and cycles checks (wired by P2); SL-2 and SL-4 (P4); the width of a stage group under the per-host check bound (P5); SP-2 (P7).

### Ruling dependencies

Every row is answered; the plan builds the recommended answer and keeps the other as a branch, so that an overturned ruling changes one slice, not the design.

| CQ | Answer built | The other answer | Where the branch lives |
|---|---|---|---|
| CQ-154-02 | C with (iii): both units, separate switches; independence by the marker rule with a declared `depends_on` overriding | A: G3 not built. B: the `[P]` groups stay as they are | `groupCandidatesOfThePhase` returns nothing under A; under B `independence.ts` is not called for `[P]` groups |
| CQ-154-03 | A: three proofs | B: Tier 2 only | `concurrentSessionsOf` reads no `testedUnder`; the door stays shut |
| CQ-154-04 | A: the acceptance check only, after the pass | B: the inner set in the tree. C: none, the check stays on the workspace | `acceptanceCheckOfTheGroup` takes the set from the group (A) or the phase (B); under C it is not called |
| CQ-154-05 | A: wide stage groups in the contract | B: G5 not built; the lanes stay outside | `declareStageGraph` ignores `stageGroups` under B |
| CQ-154-06 | A: no critic after landing | B: one critic call per landed stage | `landing-run.ts` calls the critic after LD-1's gate under B |
| CQ-154-07 | A: a field of the canonical model and its adapters | B: a declaration in the contract. C: G6 not built | `phaseDependenciesOf` reads the model (A) or the contract (B); under C the queue holds one phase |
| CQ-154-08 | A: F142-FR-070 amended | B: no amendment; speculation starts after the critic returns | SP-4 under B |
| CQ-154-09 | A: new members, versioned | B: map onto existing members | The deltas file marks each member; under B `repeat` and `dependency` are details of `check`, and no existing refusal reason is honest for `group-check`, which is why B is not built |
| CQ-154-10 | A: G8 is the red-team pass for 5–7 | B: a MINOR amendment of XX | none in code |
| CQ-154-13 | A: all groups in plan order, the bound of F142-FR-023 | B: a bound of N groups | `theGroupsOfThePhase` takes a bound under B |
| CQ-154-14 | A: files in user-level state, defaults 1 and unset, reclaim by a contender, a wait is a pause | B: a host service | not built (breaks I) |
| CQ-154-15 | A: the trial, read by the owner | — | the trial record and the register row |
| CQ-154-16 | A: out of scope | B: in | feature 115 |
| CQ-154-17 | A: all three rules | B: no merge baseline | `merge-baseline.ts` not built under B |
| CQ-154-18 | A: depth 1, window 20, 50 % | any other values | the three keys of `loop.speculate.*`; the rule is the same |
| CQ-154-19 | A: with the option off, behind the verbose flag only | B: only with the option on | the two callers check the option and the flag |

## Project Structure

### Documentation (this feature)

```text
specs/154-concurrency-and-parallelism/
├── spec.md                      # stage 2
├── constitution-grounding.md    # stage 1
├── checklists/requirements.md   # stage 2
├── research.md                  # learnings (stage 2) and decisions (stage 3)
├── plan.md                      # this file
├── data-model.md                # D1…D14
├── quickstart.md                # how to see each slice on a fixture
├── contracts/
│   ├── README.md
│   ├── closed-set-deltas.md     # ALL PROPOSALS, tied to CQ-154-09 and -14
│   ├── rule-tables/             # PG, RP, MG, WC, SL, LD, PQ, SP, TRI (specstride.table/1)
│   ├── fixtures-154.json        # FX-154-PLAN, -GROUPS, -SLOTS, -STAGES, -PHASES, -SPEC
│   └── schemas/                 # 11 new records (draft 2020-12)
└── trials/                      # written by scripts/trial.mjs, one record per switch
```

### Source Code (repository root)

```text
packages/core/src/
├── host-limits/slot-admission.ts        # SL-1…SL-5 (pure)
├── phase-queue/validation-queue.ts      # PQ-1…PQ-3 (pure)
├── speculation/speculation-rule.ts      # SP-1…SP-6 (pure)
├── landing/landing-rule.ts              # LD-1…LD-4 (pure)
├── trial/pass-mark.ts                   # TRI-1…TRI-3 (pure)
├── parallel/
│   ├── merge-baseline.ts                # new: MG-2
│   ├── audits.ts                        # `group-check` in DELTA_REFUSAL_REASONS
│   ├── merge-check.ts                   # outcomeOfTheMergeCheck reads the baseline
│   └── counters.ts                      # the group-check charge
└── report/rows.ts                       # shares, in-pass time, per-group rows
packages/layer-parallel/src/
├── groups.ts                            # new: a frozen group → a PlannedGroup
├── independence.ts                      # new: PG-1…PG-3
├── repeat.ts                            # new: RP-1, RP-2
├── plan.ts                              # printThePlan wired; planAtLaunch takes group candidates
├── admission.ts                         # groupGate wired; `repeat`, `dependency` checks
└── decide.ts                            # admissionEvent, countFailedGroups, cycle charge wired
packages/runtime/src/limits/
├── slot-store.ts                        # new: one directory lock per slot; owner record; reclaim
├── hold-record.ts                       # new
└── temp-root.ts                         # new
packages/pipeline/src/
├── executor/graph.ts                    # wide groups from configuration.stageGroups
├── executor/stage-admission.ts           # new: SG-1…SG-4
├── executor/stage-loop.ts               # a wide group's stages at once
├── executor/stage-workspace.ts          # new: a worktree per stage, through a port
├── executor/landing-run.ts              # new: rebase, gate, fast-forward, record
├── contract/launch/dry-run.ts           # printThePlan replaces parallelPlanLines
└── entry/dry-run.ts                     # same
packages/cli/src/
├── engine/parallel-wiring.ts            # the groups loop, groupGate, repeat
├── engine/parallel-group.ts             # the acceptance check in closeTheGroup
├── engine/parallel-drive.ts             # no merge check on an empty application; `group-check`
├── engine/parallel-launch.ts            # the quota observation
├── engine/run-feature.ts                # temp root, slots, the queue, speculation
├── engine/handlers.ts                   # the doctor prints the plan
└── inspect/report.ts                    # the new rows
packages/spec-formats/src/               # the phase dependency line
packages/contracts/                      # schemas, closed-set proposals, parity rows, the model field
packages/adapter-dsh/test/concurrent-sessions.test.ts   # the fake-binary test
scripts/trial.mjs                        # new
tests/
├── inertness/154/                       # every switch off changes nothing; under `parity`
├── parallel/154/                        # the rule tests, the property tests
└── fixtures/154/                        # the six fixtures with stub agents
```

**Structure Decision**: no package is added. The pure tables live in `core` and `layer-parallel` under the core import rule; the files and processes live in the two existing composition roots, `runtime` (the slot, hold and temp root) and `cli`/`pipeline` (the wiring). This keeps the out-of-scope move of the attempt loop into `core` a step nearer: the loop already reads every input through a named seam.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| None against the constitution | — | — |
| Two spec amendments with a cost: F143-FR-012 (the `group-check` charge) and F142-FR-070 (the sweep's wording) | CQ-154-04 A and CQ-154-08 A, each with its fallback planned | Keeping both texts would leave the group check on the workspace and P7 limited to the gate's share of the time |
| One closed-set class for a pause, `host_slot` | The wait must be a pause (XVI), and the pause record's class is a closed set | A new run state would break F154-FR-002 |

## Out of scope (the feature input's tracked follow-ups)

| Follow-up | Why out | The seam it gets |
|---|---|---|
| Selection among N candidates for one unit | About one approval in twelve attempts; 1.5× the cost (P11, R-M11) | the worker door and the per-group cost rows |
| A model that merges; a killed worker's partial work | Principle XX; F143-FR-014 | composition stays disjoint-only |
| The harness's own agent teams inside one pass | one pass stays one writer (E8) | none |
| Reuse at the gate; scoped selection at the gate | refused: CQ-153-02 B, CQ-153-08 A | none |
| The attempt loop moved into `core` | 153's follow-up | the seams above |
| Runs over more than one host | one host measured | the owner record names the host |
| `events` and `tail` on the engine's control root | a fix of its own | the reader of PR #40 |
| In-pass check batching | feature 115's follow-up; no measured gain (L-4) | F153-FR-042 amendment row |
| The campaign driver calling the product's landing | the lanes are outside the product until P5's trial passes | `landing-run.ts` |

## Anchors re-pinned

Read on `aafb367f` by four read-only code readers; every line number was verified with grep or sed.

| Anchor | Was | Is |
|---|---|---|
| `theGroupOfThePhase` `groups[0]` | `parallel-wiring.ts:100-102` | same; also `parallel-group.ts:140` and `groupOrdinal: 1` at `:558`, `:667` |
| The inner set `["check"]` | `run-feature.ts:2913` | `:2914`, and the manifest entry at `:4721-4730` |
| `failedGroupsBefore: 0` | `run-feature.ts:4674` | `:4692`; the unused ledger count is `decide.ts:1640` |
| `utilisationPerCent: []` | — | `parallel-launch.ts:252` |
| `groupGate`, no caller | — | `admission.ts:939-957` |
| The group check today | `run-feature.ts:3237` | `micro-layer.ts:552-575` (`cwd: process.cwd()`, `300_000`) |
| The worker check seam | — | `parallel-group.ts:658-736`, between `:592` and `:707` |
| The refusal reasons | — | `audits.ts:58-67` |
| The landing of the lanes | — | `lanes.py:117-171`, no gate |
| The approval standing | PR #41 | `approval-commit.ts:67-85` |
| The stage graph | — | `graph.ts:12-29`, serial by design |
| The probe outcomes | — | `probe.ts:120-128`, six |
| The user-level root | — | `layout.json:8`; `roots.ts` `userStateRoot:113-115` |
| The plan renderers | — | `plan.ts:543` never printed; `contract/launch/dry-run.ts:167-205` |
| The doctor handler | — | `handlers.ts:580-631`, literal findings |
| The report | PR #40 | `inspect/report.ts:113-145`, `select.ts:138-158` |

## Validation pass

Filled by the single validation subagent of stage 3 after the design artefacts exist (one agent: parallel validators give "bad form back pressure", ledger E1).

## Validation pass

Run on 2026-11-25 after the design artefacts existed. The mechanical checks ran in one pass over
the artefacts; the semantic pass is `speckit-analyze` (its report is `analyze-report.md`).

| Check | Result |
|---|---|
| Baseline: the existing tests of `layer-parallel` (`node tests/isolate.ts <node> --test test/*.test.ts`, serial) | 41 of 41 pass on Node v22.23.2 |
| Rule tables: members equal the sets of this plan; every decision is a declared choice | 10 tables, after `speckit-analyze` rewrote the independence table and added the stage admission table |
| Schemas: every `$id` is named in data-model.md; none holds an exit code, stop reason, run state or attempt kind | 11 schemas, all named |
| Change map: every F154-FR-001…-081 has a row | 81 of 81 |
| Success criteria: every F154-SC-001…-014 is served by a fixture of `contracts/fixtures-154.json` and a section of quickstart.md | 14 of 14 |
| Switches: the same nine names and defaults in spec.md, plan.md and data-model.md | 9 of 9 |
| Anchors of "Anchors re-pinned" and the change map, re-read on the tree | all stand |
| Numbers against the ledger and the feature input | unchanged from stage 2: 19 numbers verified |
| Markdown tables of the seven artefacts | 0 column breaks |

`speckit-analyze` (2026-11-25) then reported 1 critical, 8 high and 15 medium findings over the artefacts; every one was resolved in the artefacts the same day (the report is `analyze-report.md`). The critical one was the taint of the acceptance check: it compared two readings around the check, so a change before the check went unseen; the record now binds three fingerprints.

One correction came out of the mechanical pass: `contracts/` was finished by hand after its writer stalled,
in the house `specstride.table/1` op-tree shape of feature 153.

## Open after planning

None. Every ruling is answered; the owner may overturn any of the sixteen autonomous answers, and the branch under the other answer is planned above.
