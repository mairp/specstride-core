# Feature Specification: Parallel units

**Feature Branch**: `142-parallel-units` (a label: Spec Kit creates no branch in this repository; the directory is `specs/142-parallel-units`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 142-parallel-units of Specstride: the loop layer `parallel`, stacked above `micro` behind the loop-layer interface (EP-04), off by default and off under the `parity` profile (owner rulings 56, D2, P1 to P10). Tasks marked [P] with declared, disjoint write scopes are worked by several workers, each in a worker tree of its own; the engine composes the audited deltas, applies them to the workspace, ticks the integrated tasks, and runs the merge check before any critic-class call."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 56, D2, D3, P1 to P10), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 142-parallel-units), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (Principle XX), `research/R29-parallel-units-design.md` (rules PU-01 to PU-78) as amended by `research/R29v-parallel-units-red-team.md` (rules PU-79 to PU-104). Where R29v amends R29, R29v stands.

## What this feature is

A phase is worked today one task after the other. This feature adds an option, off by default:
tasks that the task list marks `[P]`, and whose write scopes are declared and disjoint, are worked
at the same time by several workers. Each worker has a tree of its own. When all workers have
ended, the engine audits what each one changed, composes the audited changes, writes them to the
workspace, ticks the tasks, and runs the inner check set of the phase once on the result. The
verification gate and the critic then judge the phase as they always do.

Terms used here, beside the glossary of `consolidation.md` section 1:

| Term | Meaning |
|---|---|
| Main line | The ordinary serial pass loop of a phase attempt in the workspace |
| Worker | One harness process working one assigned task in a tree of its own |
| Group | The workers started together and integrated together |
| Worker tree | The directory a worker works in |
| Worker root | The place of all worker trees, outside the workspace and outside the control plane (logical name `worker-root`) |
| Tree store | A repository the runtime owns, outside the project's repository (logical name `tree-store`) |
| Base snapshot | The snapshot of the workspace taken at group start |
| Final snapshot | The snapshot of a worker tree taken when that worker's processes have been ended |
| Delta | The difference between a group's base snapshot and a worker's final snapshot |
| Integration | Audits, composition, application to the workspace, ticks |
| Merge check | The inner check set of the phase, run on the workspace after integration |

**In scope**: the loop layer `parallel`; its switch, preconditions and fallback reasons; inertness;
the parallel plan, write scopes, admission and the reservation of tasks; accounting; the events
and the `[LOOP]` fields of the layer; the three audits; the merge check and its outcome;
fingerprints of a group and the frozen workspace; what the critic and the proposer are told; the
sweep before a critic-class call; the breach conditions; experiment E6.

This feature was split on 2026-09-29. The engine services behind the group directives and the
tree store left it; the layer reaches them only through contracts of feature 100 (annex D §D.1
and §D.2).

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The loop-layer interface itself: stacking, the group directives, capability negotiation, the interface of the tree-store service | 100 (contract), 103 (core side) |
| What the engine does behind `requestPassGroup` and `integrateGroup`: the tree store, the worker root, worker trees, the group executor, worker sessions, the group pause, the barrier, composition, the application and the ticks, the ledger records of a group, resume states, stop with a group live, clean-up | The content owner of the engine services (feature 100, annex D §D.2) |
| The micro-loop layer, the tripwire | 115 |
| The protected set, fingerprints as a mechanism, toolchain profiles, the content of the fact block | 116 |
| The check manifest | 105 |
| The check runner, concurrent verification commands (PU-73 to PU-78, PU-101) | 148 |
| Watchdogs, kills, the polite stop, yields and detached jobs | 118 |
| The process registry, the lease, what the runtime root does when the engine exits | 122 |
| The quota classifier, the pause record, budgets and hard caps as rules | 127 |
| The event envelope, the names of the `parallel.*` event types, the redactor | 111 |
| The capabilities `concurrentSessions` and `spendLimit` of the harness port, and their values per harness | 109 and the harness adapter features |
| Grounding refusals of the worker root and the tree store; the slot of the fact block; withheld paths of a critic with read tools | 117 |
| The session directive and the other drop rules of session continuation | 103 |
| Feature parallelism across workspaces, a phase graph, selection among N candidates, repairs or checks inside a worker, integration of a killed worker's work, a model that merges, the rest of Lisa's scheduler | The roadmap |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer switches parallel units on for a phase with independent tasks (Priority: P1)

A consumer has a phase whose task list marks several consecutive tasks `[P]`, each naming files
of its own. The consumer sets the option on. The run works those tasks at the same time, brings
the work into the workspace, checks it, and carries on as a serial run would.

**Why this priority**: It is the whole purpose of the option (ruling 56).

**Independent Test**: A fixture with three consecutive `[P]` tasks with disjoint scopes and stub
workers. The run ends with the same tree and the same kept units of work as the serial run of the
same fixture, and the elapsed time of the phase attempt grew by the longest worker pass and not
by the sum.

**Acceptance Scenarios**:

1. **Given** the option on, a tested harness adapter that declares `concurrentSessions`, containment C2 and a plan with a group of two tasks, **When** the main line reaches the group at a pass boundary, **Then** two workers start, each in a tree of its own, and no pass runs in the workspace until the group is closed (F142-FR-018, F142-FR-064).
2. **Given** both workers ended at a valid checkpoint with deltas inside their scopes, **When** integration runs, **Then** the workspace holds the work of both, both tasks are ticked, the merge check ran every command of the inner check set once, and the ledger holds one kept unit of work that names both tasks (feature 100, F100-FR-122 and F100-FR-124; F142-FR-059, F142-FR-061).
3. **Given** a group whose merge check fails, **When** the next pass starts, **Then** it is a serial repair pass on the main line with the output of the check, and the workspace still holds the integrated work (F142-FR-061).
4. **Given** a task marked `[P]` whose text names no path and for which the consumer declared no scope, **When** the plan is computed, **Then** the task is serial and no worker ever receives it (F142-FR-009, F142-FR-011).

---

### User Story 2 - An operator sees why the option did not run (Priority: P1)

An operator set the option on and the run worked serially. The operator must learn why, from the
plan printed before launch and from one line of the run.

**Why this priority**: The option has many preconditions. Without a stated reason it looks broken.

**Independent Test**: One fixture per fallback reason and per admission check. Each prints its
reason and completes as the same run with the option off.

**Acceptance Scenarios**:

1. **Given** the option on and a workspace that is not inside a git work tree, **When** the run launches, **Then** the layer is off for the run with the reason `not-git`, the reason is in the `[LOOP]` line, and the run completes (F142-FR-002).
2. **Given** the option on and a harness whose containment ceiling is below C2, **When** the run launches without `loop.parallel.allow_detect`, **Then** the layer is off with the reason `containment`; **Given** the key set in user configuration, **Then** groups run and the run says `protection=detect` (F142-FR-003).
3. **Given** the option on, **When** the operator runs the dry run of the launch, **Then** the plan is printed per phase: the groups, the tasks made serial with the failed check, and the ceiling of the speed-up under equal task cost (F142-FR-017).
4. **Given** the option off, **When** any command runs, **Then** no plan is printed and no file, event or prompt block of the layer exists (F142-FR-005).

---

### User Story 3 - The owner of gate integrity relies on the phase gate as before (Priority: P1)

The phase gate must mean the same with the option on. No unaudited delta is accepted,
no model merges, no group is kept unchecked, and the critic cannot tell a group from serial work.

**Why this priority**: Principle II and Principle XX. A saving of a few per cent is worth nothing
if the phase gate weakens.

**Independent Test**: Two fixtures that end in the same tree and the same
kept units of work, one serial and one through a group with a refused third worker, give
byte-identical critic prompts.

**Acceptance Scenarios**:

1. **Given** a worker whose delta holds a path outside its scope, **When** the scope audit runs, **Then** the worker is refused, nothing of its delta reaches the workspace, and its task returns to the main line with its counts as they were (F142-FR-054, F142-FR-061).
2. **Given** two accepted deltas that share a path, **When** composition runs, **Then** the later one in the order of the tasks at launch is refused with the reason `overlap`, and no content is merged (feature 100, F100-FR-122; F142-FR-058).
3. **Given** a group with an empty inner check set when the merge check is due, **When** the group closes, **Then** the unit is `unchecked`, is not kept, and the layer is off for the phase attempt (F142-FR-060).
4. **Given** any parallel fixture, **When** a critic-class call is assembled, **Then** its input holds none of the words of the vocabulary list and no worker tree exists (F142-FR-066, F142-FR-070).

---

### User Story 4 - An operator reads what a group cost (Priority: P2)

An operator reads the report of a run that used groups and must see what they cost: no outer
count was spent by a worker, time was counted once, and killed passes are counted as killed.

**Why this priority**: The option is judged by its cost. Figures that hide worker passes would
make it look cheaper than it is.

**Independent Test**: The counters of the outer loop are read before and after every group
fixture and are equal; a group of four stub workers of ten minutes each makes the elapsed time of
the phase attempt grow by about ten minutes.

**Acceptance Scenarios**:

1. **Given** a group of three workers, **When** it has closed, **Then** no pass of the pass loop was counted, no reject count and no breaker changed, and three cycles of the micro-loop layer were charged (F142-FR-021).
2. **Given** a worker pass ended by a time limit, **When** the run reports, **Then** the pass counts as killed, and the report gives wall hours and agent hours (F142-FR-022).
3. **Given** two failed groups in a phase attempt, **When** a third group is due, **Then** no worker starts and the micro-loop layer carries on serially (F142-FR-023).

---

### User Story 5 - The release owner runs experiment E6 (Priority: P3)

Before a release candidate the release owner runs the safety experiment and reads what it
measured.

**Why this priority**: The option stays in the product only while it is shown safe.

**Independent Test**: FX-PAR-S runs on stubs at no cost and reports zero breaches of gate
integrity and the counts per failure class.

**Acceptance Scenarios**:

1. **Given** a release candidate, **When** FX-PAR-S runs, **Then** every test of a rule passes and the report states zero breaches (F142-FR-072).
2. **Given** the report of FX-PAR-L, **When** it is read, **Then** it holds the three arms and carries no pass mark for a default (F142-FR-072).

---

### Edge Cases

- A run of five consecutive admitted tasks with two workers: three successive groups, each with its own base snapshot, barrier and merge check (F142-FR-008).
- The main line works a reserved task anyway: the task leaves its group; a group left with fewer than 2 tasks is cancelled (F142-FR-018).
- A worker writes a yield artifact: it is refused and the worker's outcome is `refused` (feature 100, F100-FR-133; reason `yield`, F142-FR-058).
- A worker tree changes after its final snapshot: that worker is refused (reason `tree-changed-after-end`, F142-FR-058).
- The workspace changed during the group: nothing is applied and every worker is refused (F142-FR-064).
- A delta carries the real path of the worker root: refused with the reason `path-leak` (F142-FR-056).
- The base snapshot holds a symbolic link that leaves the tree: the tasks behind it are serial (F142-FR-013).
- A detached job of an earlier yield is alive at group start: no group starts (F142-FR-014).
- The stored plan was changed by one byte: the layer is off for the run with an integrity event (F142-FR-017).
- The engine reports that an object of a tree is missing in the store: the layer is off for the phase attempt, reason `missing-object` (F142-FR-023).
- The worker root is not empty after one sweep before a critic-class call: the call is not delayed further (F142-FR-070).
- A path of the workspace holds neither the base nor the composed content after an interrupted application: the engine stops all writing and the layer is off for the run, reason `apply-incomplete` (F142-FR-023).
- No quota observation exists in the run: a group has 2 workers whatever is configured (F142-FR-016).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. A new requirement names the test
`CT-142-<n>`, where n is 100 plus the number of the requirement. `CT-142-1` is the
characterization test of the traceability files. Numeric defaults have low confidence and are
starting values.

#### Group G-A: the layer and its plan

- **F142-FR-001**: The layer `parallel` MUST be registered only when `loop.parallel.units` is `on`. The default MUST be `off`. With the value `off` the resolved stack of loop layers MUST hold no `parallel`, and the run record MUST say `loop.parallel.units=off`.
  - divergence: DV-080
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - parity: off (row 20 of annex X §X.7)
  - test: CT-142-101

- **F142-FR-002**: The layer MUST run only stacked above `micro`. It MUST be off for the run, announced with its reason in the launch message and in the `[LOOP]` line, when a precondition fails. The reasons are the closed set of fallback reasons: `classic` (the loop strategy is not `micro`), `gate-not-executing` (the verification gate does not execute), `not-git` (the workspace is not inside a git work tree), `submodules` (the workspace has submodules), `git-version` (the installed git is older than what a snapshot needs), `harness` (F142-FR-020), `containment` (F142-FR-003), `no-group` (the plan holds no group). A failed precondition MUST be a fallback and never an error: the run completes as the same run with the option off.
  - origin: 002 FR-048
  - disposition: translated
  - test: CT-142-1
  - divergence: DV-080
  - parity: not used (the option is off; row 20 of annex X §X.7)

- **F142-FR-003**: Groups MUST run only at containment C2 or above. On a harness that cannot enforce C2 the layer MUST be off for the run with the reason `containment`, unless the consumer set `loop.parallel.allow_detect` in user configuration. With that key set, groups MAY run at C0 and C1, and the run record and the `[LOOP]` line MUST say `protection=detect`. The environment, a flag and project configuration MUST NOT set the key: a value from one of them MUST be ignored, with a launch message and a doctor warning.
  - divergence: DV-080
  - parity: off (row 23 of annex X §X.7)
  - test: CT-142-103
  - assumption: CQ-183 ("user config" in ruling P2 is read as the user configuration only, as F100-FR-112 reads it)
  - status: unverified (check: the sandbox of a tested harness adapter confines the harness's own file tools to a write root other than the workspace; verified-on: —; pin: harness versions of the capture, made by the harness adapter features; recorded-on: 2026-10-02 by T107 in `.specstride/features/142-parallel-units/VERIFICATION-RECORD.md`, fact 1 of 3; captured-by: the harness adapter features, not this one — feature 142 reads the containment level from the registry and names no harness)

- **F142-FR-004**: The layer MUST add no exit code, no stop reason and no run state. Every failure inside a group MUST end in exactly one of: the task returns to the main line; the layer is off for the phase attempt; the layer is off for the run. Over all parallel fixtures the sets of exit codes, stop reasons and run states MUST be subsets of the sets over the same fixtures with the option off.
  - test: CT-142-104

- **F142-FR-005**: Inertness. With the option off no service of the tree store MUST be called, and no file, event or prompt block of the layer MUST exist. With the option on and no group started in a phase attempt, prompts, time limits, commands of the runtime, events and files MUST equal those of the option off, apart from the named fields of register row DV-088: the run record fields `loop.parallel.*`, the plan file and its hash event, the reserved-tasks block, the event `parallel.admission`, and the `parallel=` fields of the `[LOOP]` line.
  - divergence: DV-088
  - parity: off (row 20 of annex X §X.7)
  - test: CT-142-105

- **F142-FR-006**: The layer MUST decide and the engine MUST execute. The engine MUST own the group executor, the tree store and integration. Withheld from the layer by construction: every writer of the phase gate, every counter of the outer loop, a harness handle, the event writer and the ledger writer, direct access to a repository, and any path of the workspace or of a worker tree as a writable handle. A run with the option on MUST still record the loop strategy `micro`.
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - test: CT-142-106

- **F142-FR-007**: A task MUST be a candidate only if the reading of the task list at launch carries the marker `[P]` on it. The marker is necessary and never sufficient. A task without the marker MUST never be assigned to a worker, whatever configuration says.
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - test: CT-142-107

- **F142-FR-008**: A group MUST be a run of consecutive admitted tasks in the order of the tasks at launch, inside one phase, with no heading and no other task between them. A candidate that admission makes serial MUST end the run at its position. A group MUST hold at least 2 and at most `workers` tasks. A longer run MUST give successive groups, each with its own base snapshot, barrier and merge check. Groups MUST never cross a phase.
  - test: CT-142-108

- **F142-FR-009**: A write scope MUST be a list of path prefixes relative to the root of the workspace, normalised: no leading current-directory segment, no parent segment, no absolute path, no trailing separator. A path with a parent segment MUST be refused. Two scopes overlap when a prefix of one equals or is an ancestor of a prefix of the other, compared at path boundaries, so that `src/a` does not match `src/ab`. An empty or absent list MUST mean the whole tree and MUST overlap everything. On a file system that ignores case, scopes and the paths of a delta MUST be compared after case folding and Unicode normalisation.
  - test: CT-142-109
  - status: unverified (check: scope comparison on a file system that ignores case, on macOS; verified-on: —; pin: the macOS runner of the release)

- **F142-FR-010**: A scope MUST come from one of two sources, in this order: a declaration by the consumer, keyed by task id, in user configuration or in the promoted launch contract; otherwise the paths that the text of the task itself names, as read at launch. Project configuration MAY remove a task from eligibility and MAY narrow a scope; it MUST NOT add or widen one, and such a declaration MUST be refused with a doctor line. Nothing the proposer writes MUST be a source of a scope.
  - parity: not used (rows 93 and 94 of annex X §X.7)
  - test: CT-142-110

- **F142-FR-011**: Admission MUST be a pure function, greedy in the order of the tasks with the worker cap. Its checks are the closed set `marker`, `scope`, `protected`, `resource`, `headroom`, `check`, `links`, `jobs`. `marker`: the task is a candidate. `scope`: the scope is present and disjoint from the scope of every task admitted before it in the group. `protected`: the scope holds no single-writer file of F142-FR-057. Each check MUST be recorded per task with its verdict and its detail. A task that fails a check MUST be serial, with the failed check as the reason; it MUST never be dropped. Every task of a phase MUST appear in exactly one of a group or the serial list. The same inputs MUST give the same plan.
  - test: CT-142-111

- **F142-FR-012**: Check `check`: a group MUST be admitted only if the inner check set of the phase, after every exclusion in force, holds at least one command. Otherwise its tasks are serial with the reason `check`.
  - ep: EP-05 `specstride.check-runner/1` (consumes)
  - test: CT-142-112

- **F142-FR-013**: Check `links`: when the base snapshot holds a symbolic link that is absolute or resolves outside the tree, a task whose scope contains the link or lies behind it MUST be serial. At containment C0 and C1 such a phase MUST have no group.
  - test: CT-142-113

- **F142-FR-014**: Check `jobs`: no group MUST start while a detached job of the run with the class `adoptable` is alive in the process registry.
  - test: CT-142-114

- **F142-FR-015**: Check `resource`: a phase in which a command of the check manifest, a declared detached job or the launch contract names an exclusive resource MUST have no group, unless user configuration gives that resource a capacity of at least the worker count. The doctor MUST name the resources it cannot check.
  - parity: not used (row 96 of annex X §X.7)
  - test: CT-142-115

- **F142-FR-016**: Check `headroom`: a group MUST be admitted only when all of these hold: (a) the last observed utilisation of every quota window of the proposer's account is below `loop.parallel.quota_headroom`, default 70 per cent; (b) under a hard cap, the remaining budget of the role is at least the worker count times the cost of a pass at the 90th percentile of the passes so far, and twice that where the harness adapter declares no process-level spending limit; (c) the free space of the file system of the worker root is at least twice the size of the base snapshot plus the seed paths, times the worker count; (d) the remaining cycles of the micro-loop layer are at least the number of tasks of the group. With no quota observation in the run a group MUST have 2 workers whatever is configured.
  - ep: EP-12 `specstride.quota-classifier/1` (consumes)
  - parity: not used (row 22 of annex X §X.7)
  - test: CT-142-116
  - assumption: CQ-111 (R29v PU-87 makes the remaining cycles a condition of admission and names no check for it; it is recorded here under `headroom`, with the detail `cycles`)

- **F142-FR-017**: The plan of every phase MUST be computed at launch as a pure function of the task list as read at launch and of configuration, MUST be stored in the control plane under `run:<runId>:parallel-plan` with its hash, and the hash MUST be an event. It MUST never be computed again inside a run. A relaunch that derives another plan MUST announce the difference and use the stored plan. A stored plan whose hash does not match MUST start no group and MUST switch the layer off for the run with an integrity event. The dry run of a launch and the doctor MUST print the plan only with the option on: per phase the groups, the tasks made serial with the reason, and the ceiling of the speed-up under equal task cost.
  - divergence: DV-088
  - parity: off (no plan file exists; row 20 of annex X §X.7)
  - test: CT-142-117

- **F142-FR-018**: A group MUST start only at a pass boundary of the main line, with no session open, no yield wait open and no phase evidence present in the phase attempt, and only when every task of the phase that precedes the group is named by a kept unit of work in the ledger. Until then the prompt of the main line MUST hold the reserved-tasks block, which asks the proposer to end its pass before the reserved tasks. The reservation is a request: a task that a serial pass names in a checkpoint, or that is ticked in the task list as read at the boundary, MUST leave its group, and a group left with fewer than 2 tasks MUST be cancelled.
  - ep: EP-15 `specstride.prompt-block/1` (implements)
  - divergence: DV-088
  - test: CT-142-118

- **F142-FR-019**: `loop.parallel.workers` MUST default to 2. Its ceiling MUST be the value of the key `loop.parallel.workersMax`, a whole number of 1 or more that defaults to 4 and is a widening key (feature 100, F100-FR-127 and F100-FR-202). The ceiling is no constant: the consumer can set it. A configured value of `loop.parallel.workers` above the ceiling in force MUST be a configuration error at launch. Two rate limits classified as transient in one group MUST halve the worker count, to no less than 1, for the rest of the phase attempt; at 1 no group starts.
  - parity: not used (rows 21 and 130 of annex X §X.7)
  - test: CT-142-119

- **F142-FR-020**: A group MUST run only on a tested harness adapter that declares `concurrentSessions`. A harness that was discovered, declared or is unverified MUST never run a group; the layer is off for the run with the reason `harness`, announced. No rule of this feature names a harness: the capability is read from the registry.
  - ep: EP-02 `specstride.harness/1` (consumes)
  - test: CT-142-120
  - status: verified for dsh (check: several headless processes of one harness run at once under one configuration home and one login, with separate session stores; verified-on: 2026-11-03 for dsh `0.1.0-rc.8` — three `zai/glm-5.3-flash` headless sessions at once through `startPass`, one home, one login, three separate stores, pinned as CT-130-46 in `packages/adapter-dsh/test/concurrent-sessions.test.ts`, by the owner's ruling of 2026-11-03; recorded-on: 2026-11-03 in the par-1 marker of the parallel-units campaign, fact 2 of 3; captured-by: the harness adapter features, not this one — feature 142 reads `concurrentSessions` and the state of the harness from the registry through EP-02; every harness beside dsh stays `unverified`)

- **F142-FR-021**: A worker pass MUST be outside the pass loop: it spends no pass and adds nothing to the pass count, changes no reject count, no ordinal of a phase attempt, no MALFORMED streak and no input of the oscillation window, and leaves every breaker of the pass loop as it was, whatever its end. One cycle of the micro-loop layer MUST be charged per admitted worker task, at its first start; a pass started again after a quota pause or an interruption the worker did not cause charges none. Time caps MUST count wall time once, whatever the worker count, with paused time excluded. The time of snapshots, fingerprints, audits, composition, application and the merge check MUST count inside the budget of inner check time of the phase attempt; when group overhead breaks that budget no further group is admitted in the phase attempt, and group overhead MUST never exclude a command from the inner check set.
  - test: CT-142-121

- **F142-FR-022**: A worker pass ended by any time limit or watchdog MUST count as a killed pass for the target of decision 21, in every arm. With the option on, every report and the `[LOOP]` line MUST give both wall hours and agent hours (the sum over passes). The `[LOOP]` line MUST gain, only with the option on: `parallel=`, `workers=`, `groups=`, `group-failures=`, `refused=`, `worker-caches=`, `wall-hours=`, `agent-hours=` and the fallback reason (feature 100, annex G §G.3, row "Loop line"). Usage MUST be counted per model call per worker.
  - divergence: DV-088
  - parity: never printed (rows 19, 20 of annex X §X.7)
  - test: CT-142-122
  - ep: EP-16 `specstride.toolchain/1` (consumes)

- **F142-FR-023**: A group in which a worker was refused or killed, or whose merge check failed, MUST count as one failed group. After 2 failed groups in a phase attempt the layer MUST be off for the phase attempt and the micro-loop layer carries on serially. A worker pass that ends with a harness error (no checkpoint, no kill by a cap, no quota signal) MUST close the group at the barrier and MUST switch the layer off for the phase attempt; its task goes to the main line, where the breakers count as they always do. When the engine reports a missing object of a tree, a ledger that was changed inside a group, or group overhead that broke the budget of inner check time, the layer MUST be off for the phase attempt. When the engine reports an application that could not be completed, or the stored plan does not match its hash, the layer MUST be off for the run. Each is an event with its reason, from the closed set of reasons for which the layer is switched off inside a run; none stops a run.
  - test: CT-142-123

- **F142-FR-024**: The layer MUST request for every worker pass the time limits of a proposal of the micro-loop layer. A group MUST have the cap of a unit of work, as wall time from group start to the end of the merge check, quota pauses excluded. The starting values are 20 minutes for a worker pass and 30 minutes for a group; this feature adds no key for them. When the cap is hit, live workers are ended, the workers that ended are integrated, and the group counts as failed.
  - test: CT-142-124

- **F142-FR-025**: The layer MUST emit, through the engine, the events of the closed set of `parallel.*` event types (row 74 of annex X §X.6): the plan with its hash, the admission per task with the verdict of every check, the start and end of a group with its outcome, the start and end of a worker with its outcome, and every step of integration with counts of paths and no path text beyond what the redactor allows. Every event of a worker MUST carry `workerId` and `wseq`. In the compatibility projection these events MUST project to nothing.
  - divergence: DV-088
  - parity: not observable (the option is off; row 20 of annex X §X.7)
  - test: CT-142-125

#### Group G-B: the engine services

The 28 requirements of this group, F142-FR-026 to F142-FR-053, left this feature at the split.
Their ids are not used again. See "Requirements moved to 143-parallel-engine-services".

#### Group G-C: integrity of integration

- **F142-FR-054**: Scope audit. Every path of a delta (added, changed, deleted, mode changed) MUST lie inside the scope of the worker. A symbolic link whose target resolves outside the tree MUST be a violation. One violation MUST refuse the worker. The audit MUST read the store and nothing in the directory of a worker.
  - test: CT-142-154

- **F142-FR-055**: Protected-set audit. A delta that changes, adds or deletes a path of the protected set without authorisation from the text, as read at launch, of the task assigned to that worker MUST be refused. An authorised change MUST be integrated and becomes a fact for the critic as on the serial path.
  - test: CT-142-155
  - ep: EP-16 `specstride.toolchain/1` (consumes)

- **F142-FR-056**: Path-leak audit. Before integration every added or changed object of a delta MUST be searched for the real path of the worker root, of the store and of the control plane, and for the opaque token of the worker. A hit MUST refuse the delta with the reason `path-leak`. The search is by text: it narrows the leak and does not close it, and the documentation of the option MUST say so.
  - test: CT-142-156

- **F142-FR-057**: Single-writer files MUST never be part of a delta: the task list, the phase evidence, the notebook, the handoff, and anything under the workspace part. They MUST be left out of the snapshot or dropped from the delta. A change to one by a worker MUST NOT be a violation.
  - test: CT-142-157

- **F142-FR-058**: The reason for which a delta is refused MUST be one of the closed set: `scope`, `protected`, `overlap`, `path-leak`, `checkpoint`, `yield`, `tree-changed-after-end`, `workspace-changed`. The reason MUST be recorded in the ledger and in the event of the worker and MUST never reach a critic-class call.
  - test: CT-142-158

- **F142-FR-059**: The merge check. After the application and the ticks the engine MUST run the inner check set of the phase on the workspace: every command, none skipped at a failure, with fingerprints before and after, through the check runner, once per group whatever the worker count. It MUST run where the application put the work. No check MUST run in a worker tree.
  - ep: EP-05 `specstride.check-runner/1` (consumes)
  - test: CT-142-159

- **F142-FR-060**: If the inner check set is empty when the merge check is due, the unit MUST be `unchecked`, MUST NOT be kept, and the layer MUST be off for the phase attempt. No group MUST ever be kept without a merge check that executed at least one command.
  - test: CT-142-160

- **F142-FR-061**: Outcome of the merge check. A pass without a condition MUST make the integrated tasks one kept unit of work: a ledger record bound to the fingerprint of the workspace, naming the tasks that the integrated workers named. A failure or a condition MUST send the same unit to the repair path of the micro-loop layer on the main line and MUST charge one repair to every task of the unit. Nothing MUST be reverted.
  - test: CT-142-161

- **F142-FR-062**: No result obtained in a worker tree and no merge check MUST replace an execution at the verification gate. The verification gate MUST run in full on the workspace after the proposer loop has ended, with no result reused from a group, and the critic MUST be called after it.
  - test: CT-142-162

- **F142-FR-063**: The fingerprints of a group MUST all be recorded in the ledger: (a) the workspace at group start, equal to the base snapshot; (b) each worker tree after creation, equal to (a) in the scope of the snapshot; (c) each worker tree at its end, which is its final snapshot; (d) the workspace at the barrier; (e) the workspace after the application, equal to the integrated tree apart from the single-writer files; (f) and (g) the workspace before and after the merge check. The protected set MUST be compared at (d) against (a).
  - test: CT-142-163

- **F142-FR-064**: The workspace MUST be frozen during a group: no pass of the main line, no check and no job of the runtime runs in it between group start and the barrier. If the workspace at the barrier differs from the workspace at group start, nothing MUST be applied, every worker of the group MUST be refused, the group counts as failed, and the integrity kind `tree-changed-outside-pass` MUST be raised.
  - test: CT-142-164

- **F142-FR-065**: What the critic sees. An integrated group MUST appear in the fact block as one unit of work, whose id is the hash of its sorted task ids, with the results of the merge check. The block MUST hold no worker, no group, no count, no outcome of a worker, no order, and no word that tells a group from a serial unit that named the same tasks. Two runs that end in the same tree and the same kept units of work, one serial and one through a group, MUST give byte-identical critic prompts.
  - test: CT-142-165

- **F142-FR-066**: The integrity kinds that this feature adds and that reach the critic MUST be neutral and MUST carry no count: `tree-changed-outside-pass`, and `protected-change-not-applied` for a change of the protected set that was refused. A vocabulary test over every input of a critic-class call of every parallel fixture MUST find none of: group, worker, parallel, merge, integrat-, refus-, snapshot, and the opaque tokens, in text that the runtime wrote; the word `snapshot` in the as-is literals that F117-FR-038 names is exempt, and nothing else is.
  - test: CT-142-166

- **F142-FR-067**: A delta refused for scope alone, an overlap, a path leak, a killed worker and a failed merge check are scheduling and repair history. They MUST be withheld from every critic-class call and MUST stay in the event file and the ledger.
  - test: CT-142-167

- **F142-FR-068**: The application MUST set no file times. That the files of an applied delta carry nearly the same modification time is accepted and named in the divergence register.
  - divergence: DV-086
  - parity: off (the option is off; row 20 of annex X §X.7)
  - test: CT-142-168

- **F142-FR-069**: What the runtime tells a proposer about parallel work MUST be minimal and neutral. The prompt of a worker MUST name its task and its scope and MUST name no sibling, count, index or group. The reserved-tasks block of the main line MUST say up to which task to work and MUST NOT say why. After a group the handoff MUST list the integrated tasks as kept units of work in the words used for a serial unit. A proposer can still describe its work in the phase evidence: that channel is narrowed and not closed, and the documentation of the option MUST say so.
  - ep: EP-15 `specstride.prompt-block/1` (implements)
  - test: CT-142-169

- **F142-FR-070**: No worker tree MUST exist when a critic-class call starts. Before such a call the engine MUST end the processes of workers and sweep once, and the call MUST never be delayed beyond that. If the worker root is still not empty: a critic without tools MUST be called and the kind `tree-changed-outside-pass` MUST be raised; a critic with read-only tools MUST be called only if its harness adapter confirmed the read denial of the worker root and the store, and otherwise the next critic of the critic order MUST be used, announced.
  - test: CT-142-170
  - status: unverified (check: the sandbox of a harness can deny reads of paths outside the working tree; verified-on: —; pin: harness versions of the capture, made by the harness adapter features; recorded-on: 2026-10-02 by T107 in `.specstride/features/142-parallel-units/VERIFICATION-RECORD.md`, fact 3 of 3; captured-by: the harness adapter features, not this one — feature 142 calls a critic with read-only tools only where its harness adapter confirmed the read denial, and otherwise takes the next critic of the critic order)

- **F142-FR-071**: A breach of gate integrity, for the tripwire and for the rule of immediate return, MUST also be each of: a delta applied that did not pass the audits; a workspace after the application that differs from the integrated tree; an integrated tree that holds a path or an object of no audited delta; a kept unit of work for a merge check that ran while a process of a worker was known to live; an input of a critic-class call that holds a withheld field. An act that was detected and refused MUST be an event and not a breach. Each condition MUST be checked on the event file of every run by the doctor and in the build.
  - test: CT-142-171

- **F142-FR-072**: Experiment E6 MUST be a safety experiment. Its pass mark is: no breach of gate integrity, and every test of a rule passes. It MUST measure and report the share of failed groups per class (`scope`, `protected`, `overlap`, `path-leak`, kill, failed merge check), cost with every pass counted, and killed passes by count and hours. The fixture set FX-PAR-S (stubs, no cost) MUST run once per release candidate. The fixture set FX-PAR-L (live, paid, logged) MUST have the arms serial, 2 workers and 4 workers and MUST carry no pass mark for a default. The option MUST stay off by default until a corpus with phase ceilings of 1.28 or more and at least 71 pairs exists.
  - test: CT-142-172

- **F142-FR-073**: The documentation of the option and the printed plan MUST state the expected saving as it is: a ceiling of about 3 to 4 per cent of alive time at 2 workers before any cost, against one cold start per worker; the option is worth switching on for single phases and not for a run.
  - test: CT-142-173

#### Added at the split

- **F142-FR-074**: The layer MUST obtain every worker tree and every write to the workspace only through the group directives and the tree-store service of feature 100, annex D §D.1 and §D.2, and through nothing else. A group that the layer requests MUST therefore have these properties, which the characterization test observes from outside: on a workspace that is not inside a git work tree no group is requested; a stale worker tree of the same run, group and worker is gone before a new one exists; a worker tree holds the content of the base snapshot of the group; and no branch, no reference and no worktree entry exists in the project's repository after the group.
  - origin: 002 FR-048
  - disposition: translated
  - test: CT-142-1
  - divergence: DV-080; DV-084
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

### Key Entities

| Entity | What it is |
|---|---|
| Parallel plan | Per phase: the groups, the candidate tasks with scope, scope source and the verdict of every admission check, the serial tasks with the reason; with its hash. Schema `specstride.parallel-plan/1` |
| Write scope | A list of normalised path prefixes of one task, with its source |
| Group | An ordinal, the task ids in the order at launch, its fingerprints, its outcome |
| Worker | The assigned task, the scope, the outcome that the engine reports and, when refused, a reason |
| Delta | The paths that a worker changed, each with its kind, as the tree-store operation `changed` returns them |
| Kept unit of work of a group | A ledger record bound to the fingerprint of the workspace, naming the integrated tasks |

## Success Criteria *(mandatory)*

### Measurable Outcomes

F142-SC-002, F142-SC-006 and F142-SC-007 left this feature at the split; their ids are not used
again.

- **F142-SC-001**: Off means absent. With the option off, 0 files, 0 events and 0 prompt blocks of the layer exist, on every fixture of the oracle and of the micro-loop layer.
- **F142-SC-003**: No model merges. In the events of every run, 0 model calls lie between `group_barrier` and `merge_check_finished`.
- **F142-SC-004**: No group is kept unchecked. 100 per cent of the kept units of work that came from a group have a merge check with at least one executed command.
- **F142-SC-005**: The critic cannot tell. The byte-identity test of F142-FR-065 and the vocabulary test of F142-FR-066 pass on every parallel fixture.
- **F142-SC-008**: No breach. Experiment E6 ends with 0 breaches of gate integrity.
- **F142-SC-009**: Nothing new can stop a run. Over all parallel fixtures the sets of exit codes, stop reasons and run states are subsets of the sets with the option off.
- **F142-SC-010**: Every fallback is explained. For each of the 8 fallback reasons and each of the 8 admission checks a fixture prints the reason and completes as the same run with the option off.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Parallel units are an option that is off by default and off under the `parity` profile | Ruling 56 |
| Inside a phase attempt the runtime never commits to, reverts, resets, cleans or checks out the workspace. Two writes are allowed, only with the option on: the application of the integrated delta and the ticks of the integrated tasks | Rulings 50, P1 |
| Containment C2 or above, unless the consumer sets `loop.parallel.allow_detect` in user configuration | Ruling P2; CQ-183 |
| The merge check runs on the workspace after the application; a failure goes to serial repair | Ruling P4 |
| 2 workers by default, at most 4, both configurable: the count is `loop.parallel.workers`, the ceiling is `loop.parallel.workersMax` | Ruling P5 |
| A refused protected change is told to the critic by a neutral kind, without a count | Ruling P8 |
| Clustered modification times are accepted, with a register row | Ruling P9 |
| E6 is a safety experiment | Ruling P10 |
| Integration is deterministic; no model takes part; the phase critic is the only critic | Decision 21; Principle XX |
| The rest of Lisa's scheduler stays deferred: 002 FR-039, 002 FR-040, 002 FR-043 to 002 FR-045 and 002 FR-047 | Ruling D2 |
| Every numeric default has low confidence | R29 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, and the spelling of
internal functions.

## Extension points

This feature has no extension point of its own.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-04 | `specstride.loop-layer/1` | implements | The layer `parallel`. It consumes the group directives and the tree-store service of the same extension point |
| EP-15 | `specstride.prompt-block/1` | implements | The reserved-tasks block and the worker block |
| EP-02 | `specstride.harness/1` | consumes | The capabilities `concurrentSessions`, containment ceiling and `spendLimit`, read from the registry |
| EP-03 | `specstride.spec-format/1` | consumes | Task ids, the marker `[P]`, the text of a task as read at launch |
| EP-05 | `specstride.check-runner/1` | consumes | The merge check |
| EP-12 | `specstride.quota-classifier/1` | consumes | Observed utilisation of quota windows; the class of a rate limit |
| EP-16 | `specstride.toolchain/1` | consumes | The protected set (F142-FR-055); whether a profile moves caches per worker (F142-FR-022) |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Loop-layer interface: stacking, directives, negotiation, `workerId` and `groupId` in the view of the phase attempt | `specstride.loop-layer/1` | Annex D §D.1, F100-FR-114 to F100-FR-119 |
| Tree-store service (consumed): the operations, composition, store commits, the two writes to the workspace, the merge check on the workspace | `specstride.tree-store/1` | Annex D §D.2, F100-FR-121 to F100-FR-125 |
| Parallel plan; the keys of the option; what reaches a critic-class call | `specstride.parallel-plan/1` | Annex D §D.3, F100-FR-126 to F100-FR-128 |
| Prompt block provider | `specstride.prompt-block/1` | Annex D §D.5 |
| Yield artifact (a worker does not yield) | `specstride-pass-yield/v1` | Annex D §D.6, F100-FR-133 |
| Fact block | `specstride.fact-block/1` | Annex D §D.7, F100-FR-135 |
| Check manifest (`inner`, `resource`) | `specstride.manifest/1` | Annex D §D.8 |
| No new run state, exit code or stop reason | — | Annex A §A.5, F100-FR-031 |
| Locations of state; the worker root | `specstride.layout/1` | Annex B §B.1, F100-FR-032, F100-FR-033 |
| Identifiers `workerId`, `groupId`, `unitId` | — | Annex B §B.3 |
| Logical names `run:<runId>:parallel-plan`, `worker-root` (read: empty or not, before a critic-class call) | `specstride.layout/1` | Annex B §B.5 |
| Process registry (read: adoptable detached jobs alive, for the admission check `jobs`) | `specstride.procs/1` | Annex B §B.10 |
| Ledger; the namespace `parallel`; counters survive | `specstride.ledger/1` | Annex B §B.13, F100-FR-068, F100-FR-069 |
| Harness port: capabilities, `startPass`, fresh session after an applied group | `specstride.harness/1` | Annex C §C.1, F100-FR-083 |
| Canonical spec model | `specstride.spec-format/1` | Annex C §C.7 |
| Check runner | `specstride.check-runner/1` | Annex C §C.8 |
| Quota classifier | `specstride.quota-classifier/1` | Annex C §C.13 |
| Toolchain profile | `specstride.toolchain/1` | Annex C §C.14 |
| Containment levels; C2 for parallel units | — | Annex C §C.15, F100-FR-111, F100-FR-112 |
| Run record fields `loop.parallel.*` | `specstride.run-state/1` | Annex E §E.2 |
| CLI protocol and line grammar, the `[LOOP]` line | protocol 1 | Annex G §G.3, F100-FR-179 |
| Event envelope (`workerId`, `wseq`) | `specstride.event/1` | Annex X §X.1, F100-FR-198 |
| Trust classes of configuration | `specstride.config/1` | Annex X §X.2, F100-FR-202 |
| List of closed sets, rows 60, 61, 63, 65, 74, 184, 185 and 186 | — | Annex X §X.6, F100-FR-208 |
| The `parity` profile, rows 10, 19, 20 to 23, 93, 94, 96 and 130 | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| Threat T-49 | — | Annex X §X.9 |

Feature 141: this feature has no parity test of its own and cites no fixture family for one
(feature 141, §O.7, "a behaviour that is new"). The parity suite and the second suite run with
the option off. The inertness tests of this feature use the stubs of feature 141, §O.3.

## Rows of the `parity` profile

Rows that exist in annex X §X.7 and belong to this feature:

| # | Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| 20 | Parallel units | `loop.parallel.units` | off | off | DV-080; DV-084; DV-085; DV-086; DV-088 |
| 21 | Workers of a group | `loop.parallel.workers` | 2; the ceiling is the key of row 130 | not used | DV-080 |
| 22 | Quota headroom for a group | `loop.parallel.quota_headroom` | 70 per cent | not used | DV-080 |
| 23 | Parallel units at detection only | `loop.parallel.allow_detect` (user configuration only) | off | off | DV-080 |
| 130 | Ceiling of the workers of a group | `loop.parallel.workersMax` | 4 | not used | DV-080 |

Options that this feature introduces, with their rows of annex X §X.7 (93, 94 and 96). The
spelling is confirmed; feature 110 owns it.

| Option | Key | Trust class | Default | Under `parity` | Row | Register row |
|---|---|---|---|---|---|---|
| Declared write scope of a task | `loop.parallel.scopes.<taskId>` | Widening in user configuration and the launch contract; narrowing in project configuration | none | not used | 93 | DV-080 |
| Tasks removed from eligibility | `loop.parallel.exclude` | Narrowing | empty | not used | 94 | DV-080 |
| Capacity of an exclusive resource | `loop.parallel.resources.<name>.capacity` | Widening | 1 | not used | 96 | DV-080 |

A widening key in project configuration is ignored, with a launch message and a doctor warning
(F100-FR-202).

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 142. All are closed by design. The outcomes of a
worker (row 62), the operations of the tree store (row 64) and the ledger record kinds of the
namespace `parallel` left this feature at the split.

| Closed set | Row of annex X §X.6 | Members | Unknown value |
|---|---|---|---|
| Fallback reasons of the layer `parallel` | 60 | `classic`, `gate-not-executing`, `not-git`, `submodules`, `git-version`, `harness`, `containment`, `no-group` | Shown as text; the layer is off |
| Admission checks of a parallel group | 61 | `marker`, `scope`, `protected`, `resource`, `headroom`, `check`, `links`, `jobs` | The task is serial |
| Refusal reasons of a delta | 63 | `scope`, `protected`, `overlap`, `path-leak`, `checkpoint`, `yield`, `tree-changed-after-end`, `workspace-changed` | The delta is refused |
| Reasons for which the layer is switched off inside a run | 185 | For the phase attempt: `group-failures`, `harness-error`, `unchecked`, `missing-object`, `ledger`, `check-budget`. For the run: `plan-hash`, `apply-incomplete` | Shown as text; the layer is off for the run |
| Sources of a scope | 186 | `consumer`, `task-text` | The scope is read as absent, which is the whole tree |

Integrity kinds that reach the critic (row 65) belong to feature 116. This feature contributes
two members: `tree-changed-outside-pass` and `protected-change-not-applied`.

## As-is behaviour not carried

The traceability files assign no row to feature 142 with the disposition `superseded-by` or
`dropped`, and no behaviour item.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

As-is ids carried, and where:

| As-is id | Clause | Disposition | Requirement | Test |
|---|---|---|---|---|
| 002 FR-048 | Refuse a workspace that is not a git repository: kept as a fallback, reason `not-git` | translated | F142-FR-002 | CT-142-1 |
| 002 FR-048 | Remove a stale worktree of the same identity: kept, keyed by run, group and worker | translated | F142-FR-074 | CT-142-1 |
| 002 FR-048 | Create the worktree with a branch from a base reference: the worker tree is made from the base snapshot in the store of the runtime; no branch and no reference in the project's repository (DV-080, DV-084) | translated | F142-FR-074 | CT-142-1 |

002 FR-048 stays assigned to this feature alone. The characterization test `CT-142-1` stays whole
here and observes the second and third clause from outside, through a group that the layer
requests (F142-FR-074); the services that do the work are reached through the tree-store
interface of feature 100, annex D §D.2.

Lisa's integration code has no requirement in 002 and is not carried: its merge writes the
project's working tree, index and history, its failure policy needs a revert, and a model judges
between merge and phase critic. Lisa's defect in scope comparison (two tasks with empty scope
lists are reported disjoint) is not carried either (F142-FR-009).

## Requirements moved to 143-parallel-engine-services

This feature was split on 2026-09-29. Group G-B left. Old ids are never used again, so the
sequence of this feature has a gap from F142-FR-026 to F142-FR-053. F142-FR-074 was added at the
split.

| Old id | New id | Old test | New test |
|---|---|---|---|
| F142-FR-026 | F143-FR-001 | CT-142-126 | CT-143-101 |
| F142-FR-027 | F143-FR-002 | CT-142-127 | CT-143-102 |
| F142-FR-028 | F143-FR-003 | CT-142-128 | CT-143-103 |
| F142-FR-029 | F143-FR-004 | CT-142-129 | CT-143-104 |
| F142-FR-030 | F143-FR-005 | CT-142-130 | CT-143-105 |
| F142-FR-031 | F143-FR-006 | CT-142-131 | CT-143-106 |
| F142-FR-032 | F143-FR-007 | CT-142-132 | CT-143-107 |
| F142-FR-033 | F143-FR-008 | CT-142-133 | CT-143-108 |
| F142-FR-034 | F143-FR-009 | CT-142-134 | CT-143-109 |
| F142-FR-035 | F143-FR-010 | CT-142-135 | CT-143-110 |
| F142-FR-036 | F143-FR-011 | CT-142-136 | CT-143-111 |
| F142-FR-037 | F143-FR-012 | CT-142-137 | CT-143-112 |
| F142-FR-038 | F143-FR-013 | CT-142-138 | CT-143-113 |
| F142-FR-039 | F143-FR-014 | CT-142-139 | CT-143-114 |
| F142-FR-040 | F143-FR-015 | CT-142-140 | CT-143-115 |
| F142-FR-041 | F143-FR-016 | CT-142-141 | CT-143-116 |
| F142-FR-042 | F143-FR-017 | CT-142-142 | CT-143-117 |
| F142-FR-043 | F143-FR-018 | CT-142-143 | CT-143-118 |
| F142-FR-044 | F143-FR-019 | CT-142-144 | CT-143-119 |
| F142-FR-045 | F143-FR-020 | CT-142-145 | CT-143-120 |
| F142-FR-046 | F143-FR-021 | CT-142-146 | CT-143-121 |
| F142-FR-047 | F143-FR-022 | CT-142-147 | CT-143-122 |
| F142-FR-048 | F143-FR-023 | CT-142-148 | CT-143-123 |
| F142-FR-049 | F143-FR-024 | CT-142-149 | CT-143-124 |
| F142-FR-050 | F143-FR-025 | CT-142-150 | CT-143-125 |
| F142-FR-051 | F143-FR-026 | CT-142-151 | CT-143-126 |
| F142-FR-052 | F143-FR-027 | CT-142-152 | CT-143-127 |
| F142-FR-053 | F143-FR-028 | CT-142-153 | CT-143-128 |

| Old success criterion | New success criterion | Old test | New test |
|---|---|---|---|
| F142-SC-002 | F143-SC-001 | CT-142-127 | CT-143-102 |
| F142-SC-006 | F143-SC-002 | The kill test over the ledger records | CT-143-130 |
| F142-SC-007 | F143-SC-003 | CT-142-140 | CT-143-115 |

| Old test without an id | New test |
|---|---|
| Conformance test of the tree-store service with scripted trees | CT-143-129 |
| Kill test: the engine killed after each of the thirteen ledger records | CT-143-130 |
| Property test of the queue (4 streams of 10,000 records) | CT-143-131 |
| Probe of the tree store, as a test | CT-143-132 |

`CT-142-1` does not move.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Are CQ-003 to CQ-011 still open, as the brief says? → A: No. Rulings P3 to P10 closed them, each with the recommended answer. The specification cites the rulings. (Source: `APPROVAL.md`, "Rulings given after the approval"; `CLARIFY-QUEUE.md`)
- Q: Do the three register rows that the brief calls "to be written" exist? → A: Yes: DV-088 (named fields of the layer), DV-089 (grounding refuses the worker root and the store), DV-086 (modification times). No new row is needed for them. (Source: `consolidation.md` section 6; `feature-briefs.md` D.8)
- Q: Does integration merge content? → A: No. It composes disjoint, audited deltas. (Source: R29v PU-80 over R29 PU-47; F100-FR-122)
- Q: Which git floor holds, given that R29 PU-02 names a version for a merge operation? → A: What a snapshot needs; the number is a matter of the plan. (Source: R29v PU-80)
- Q: How is the feature split, and what stays? → A: Group G-B, the engine services, left as `143-parallel-engine-services`. Groups G-A and G-C stay. 002 FR-048 stays assigned to this feature alone, and `CT-142-1` stays whole here. Each part reaches the other only through contracts of feature 100. (Source: `STAGE-B-SPLIT-PROMPT.md`; the orchestrator's message at the split)
- Q: Who owns closed set row 63, which the Stage B prompt lists with feature 115? → A: Feature 142, as annex X §X.6 says; the members are listed here. Reported to the orchestrator. (Source: feature 100 annex X §X.6 row 63)

Questions of `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Which reason does a task carry that is serial because the inner check set is empty: `no-check` (R29v PU-79) or the name of the failed check? → A: The name of the failed check, `check`. `no-check` is a fallback reason of the layer `micro` (row 59 of annex X §X.6) and is not a member of any set of this feature. Integrated in F142-FR-011 and F142-FR-012. (Source: feature 100 annex X §X.6 rows 59 and 61; annex D §D.3, field `phases[].serial`)
- Q: Which kind does the critic see when the engine reports an application that could not be completed, given that R29 PU-65 names the event `apply-incomplete`? → A: The neutral kind `tree-changed-outside-pass`. `apply-incomplete` is the reason for which the layer is switched off for the run; it stays in the event file and never reaches a critic-class call. Integrated in F142-FR-023 and F142-FR-066. (Source: R29v PU-83, which amends PU-65)
- Q: Which time limits hold for a worker pass and for a group? → A: Those of the micro-loop layer: the cap of a proposal for a worker pass and the cap of a unit of work for a group, with the starting values 20 and 30 minutes. The values belong to the owner of the micro-loop layer; this feature adds no key for them. Integrated in F142-FR-024. (Source: R29 section F, "Kills and watchdogs"; `architecture.md` section 9, caps)
- Q: May project configuration declare a scope or the capacity of a resource? → A: No. Both widen what a run does, so they are widening keys and are ignored in project configuration with a launch message and a doctor warning. Integrated in the table of options. (Source: ruling 35; F100-FR-202; R29 PU-24, PU-37)
- Q: Does this feature specify that grounding refuses the worker root and the tree store? → A: No. The refusal belongs to the owner of grounding and holds with the option on or off (DV-089). Both places are reached through their logical names of feature 100, annex B §B.5. (Source: brief 142 heading 1, "Out of scope"; `consolidation.md` DV-089)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register has 119 rows (DV-001 to DV-119) and the clarify queue runs to CQ-238, as of 2026-09-30. The brief's figure of 85 is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The fixture sets FX-PAR-S and FX-PAR-L are fixtures of this feature's own tests and of experiment E6. They are not fixture families of the parity oracle.
- The three facts of brief heading 8 that are `unverified` are captured by the harness adapter features; this feature reads the capabilities they declare.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-111 | Under which admission check is the condition on remaining cycles (PU-87) recorded? | Under `headroom`, with the detail `cycles` | F142-FR-016 |
| CQ-183 | Does "user config" in ruling P2 mean the user configuration only? | Yes: the environment, a flag and project configuration do not set `loop.parallel.allow_detect` | F142-FR-003 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or
used again, and no requirement was added: the count stays 46.

| Requirement or place | Item | What changed |
|---|---|---|
| F142-FR-003 | W-100-23 (CQ-183) | `loop.parallel.allow_detect` is accepted from user configuration only; "the environment or a flag" removed; `assumption: CQ-183` |
| F142-FR-010 | W-X-11 | `parity:` names rows 93 and 94 of annex X §X.7 in place of "rows to be added" |
| F142-FR-015 | W-X-11 | `parity:` names row 96 of annex X §X.7 in place of "rows to be added" |
| F142-FR-019 | W-100-06 | The ceiling of workers is the key `loop.parallel.workersMax` (default 4, row 130), not the constant 4; `parity:` names rows 21 and 130 |
| F142-FR-021 | W-100-14 | "iteration loop" and "takes no iteration" became "pass loop" and "spends no pass" |
| F142-FR-022 | W-142-01; W-X-18 | `wall-hours=` and `agent-hours=` added to the list of keys of the `[LOOP]` line; `ep:` line for EP-16 |
| F142-FR-055 | W-X-18 | `ep:` line for EP-16 (consumes) |
| "Out of scope" | W-X-12; rows 1, 3 and 7 of the table of feature 100's repair report | The protected set, fingerprints, toolchain profiles and the fact block are named with feature 116; the check runner with feature 148 |
| "Constraints" | W-100-06; W-100-23 | Rows of rulings P2 and P5 |
| "Rows of the `parity` profile" | W-100-06; W-X-11 | Row 21 points to row 130; row 130 added; the separator line of the second table corrected |
| "Closed sets" | W-X-12 | Rows 185 and 186 in place of "none yet"; row 65 belongs to feature 116 |
| "Contracts of feature 100 used" | W-X-12; W-100-06 | Rows 185 and 186 of §X.6; rows 93, 94, 96 and 130 of §X.7 |

Not changed: F142-FR-025 (W-111-03, W-111-09). The fields that it needs are added by the owner
of the event types: `taskId` on `parallel.admission`, `step` and `pathCount` on
`parallel.integration` (feature 100, annex X §X.6 row 74 names the types).
