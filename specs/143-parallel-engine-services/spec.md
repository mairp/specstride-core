# Feature Specification: Parallel engine services

**Feature Branch**: `143-parallel-engine-services` (a label: Spec Kit creates no branch in this repository; the directory is `specs/143-parallel-engine-services`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 143-parallel-engine-services of Specstride, the second part of the split of 142-parallel-units: the engine services behind the group directives of the loop-layer interface (EP-04) and the tree-store service. The tree store and its hardening, the worker root, worker trees, seed paths, the environment of a worker, the group executor, worker sessions and outcomes, the group pause, the barrier, composition, the application and the ticks, the ledger records of the namespace `parallel`, the single writer and the queue, resume states, stop with a group live, clean-up, workers that outlive the engine. Off by default and off under the `parity` profile."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 56, D2, D3, P1 to P10), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 142-parallel-units, group G-B under heading 7), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (Principle XX), `research/R29-parallel-units-design.md` (rules PU-01 to PU-78) as amended by `research/R29v-parallel-units-red-team.md` (rules PU-79 to PU-104). Where R29v amends R29, R29v stands.

## What this feature is

With the option "parallel units" on, a loop layer may ask the engine to run several passes at the
same time and to bring their work into the workspace. It asks through two directives of the
loop-layer interface, `requestPassGroup` and `integrateGroup` (feature 100, annex D §D.1). This
feature builds what the engine does when it receives them: it makes a tree for every worker,
runs one harness process per worker, waits until all have ended, composes the audited changes,
writes them to the workspace, ticks the tasks, and records every step so that a run survives an
interruption. It also builds the tree store, the repository of the runtime in which the trees
are kept, behind the interface that feature 100 reserves (annex D §D.2).

This feature decides nothing. Which tasks form a group, whether a group may start, which delta
passes an audit and what a merge check means are decided by the loop layer and reach the engine
as directives and as audited deltas.

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
| Audited delta | A delta that the loop layer's audits accepted, as the input of `compose` names it (annex D §D.2) |

**In scope**: the tree store and its hardening; store commits; snapshots; the worker root; worker
trees, seed paths, the workspace part and the environment of a worker, temporary directories and
clean-up; the group executor; worker sessions, outcomes and the one restart; the group pause; the
spending limit under a hard cap; the barrier; composition; the two writes to the workspace; the
staleness check of a worker pass; the ledger records of the namespace `parallel`; the single
writer and the queue; resume states; stop with a group live; workers that outlive the engine; the
counters of a group.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The loop-layer interface itself, the directives and the interface of the tree-store service | 100 (contract), 103 (core side) |
| The layer `parallel`: its switch, preconditions, fallback reasons, the parallel plan, scopes, admission, the reservation, accounting, the `[LOOP]` fields | The content owner of the layer `parallel` (feature 100, annex D §D.1 and §D.3) |
| The audits of a delta, the refusal reasons, the merge check and its outcome, what the critic and the proposer are told, the breach conditions, experiment E6 | The content owner of the layer `parallel` |
| The check runner, the check manifest, the inner check set | 105 |
| Fingerprints as a mechanism, the protected set, toolchain profiles | 116 |
| Watchdogs, kills, the polite stop, yields and detached jobs | 118 |
| The process registry, the lease, what the runtime root does when the engine exits | 122 |
| The quota classifier, the pause record, budgets and hard caps as rules | 127 |
| The event envelope, the names of the `parallel.*` event types | 111 |
| The capabilities of the harness port and their values per harness | 109 and the harness adapter features |
| Grounding refusals of the worker root and the tree store | 117 |
| Integration of a killed worker's work; repairs or checks inside a worker; a model that merges | The roadmap |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The engine runs and integrates a group for a loop layer (Priority: P1)

A loop layer requests a group of passes and then its integration. The engine gives every worker
a tree of its own, runs the workers, and brings the audited work into the workspace.

**Why this priority**: Without it the option has no effect. Every other story rests on a group
that ran.

**Independent Test**: The sample layer of the loop-layer conformance suite requests a group of
two stub passes with scripted edits and integrates them. The workspace then holds both edits,
both tasks are ticked, and the ledger holds the thirteen record kinds in order.

**Acceptance Scenarios**:

1. **Given** a request for a group of two passes, **When** the engine starts it, **Then** each worker has a tree made from the base snapshot, in the worker root, with a repository of its own, and at most `workers` processes run at a time (F143-FR-005, F143-FR-006, F143-FR-010).
2. **Given** both workers ended at a valid checkpoint, **When** the engine integrates the audited deltas, **Then** the workspace holds the content of both final snapshots on the paths of the deltas, and both tasks are ticked through the spec-format adapter (F143-FR-019 to F143-FR-021).
3. **Given** two audited deltas that share a path, **When** composition runs, **Then** the later one in the order of the tasks at launch is refused with the reason `overlap`, and no content is merged (F143-FR-019).
4. **Given** a worker that was killed, **When** the group is integrated, **Then** its work is left out and its snapshot stays in the store until the phase attempt ends (F143-FR-014).

---

### User Story 2 - The project's repository and the store stay untouched by workers (Priority: P1)

The owner of gate integrity relies on two facts: the runtime writes nothing under the project's
repository directory inside a phase attempt, and no worker can write the store.

**Why this priority**: Rulings 50 and P1. It is the condition under which the owner allowed the
option.

**Independent Test**: The hashes of every file under the project's repository directory, and the
reported status of the working tree, are equal before and after every group fixture.

**Acceptance Scenarios**:

1. **Given** a workspace with committed, uncommitted, untracked and ignored files, **When** a group runs and is integrated, **Then** no file under the project's repository directory changed and no reference was made there (F143-FR-002, F143-FR-003).
2. **Given** a worker tree whose attributes file names a filter and a conversion of line ends, **When** a snapshot is taken and applied, **Then** no process was started by it and the bytes are equal (F143-FR-004).
3. **Given** a worker that commits, resets or stashes in its own tree, **When** its delta is taken, **Then** the delta equals the difference of the files (F143-FR-006).
4. **Given** the option off, **When** any run ends, **Then** neither the store nor the worker root exists (F143-FR-005).

---

### User Story 3 - A run survives a crash, a stop and a quota pause in the middle of a group (Priority: P2)

A run is interrupted while a group is live. After `resume` or a relaunch it ends where the
uninterrupted run would have ended.

**Why this priority**: Runs take hours and are unattended. A group adds states that a resume
must handle.

**Independent Test**: The engine is killed after each of the thirteen ledger records of a group.
Each run, relaunched, ends in the same tree and the same kept units of work as the uninterrupted
run, or rests with the loop layer off for the run and the event that says why.

**Acceptance Scenarios**:

1. **Given** a quota signal from one worker while a sibling works, **When** the engine classifies it, **Then** no further worker starts, every live worker gets the polite stop, one pause record and one pause event exist, and after the resume every counter equals its value before the pause (F143-FR-015).
2. **Given** the last ledger record `apply_started`, **When** the engine starts again, **Then** every path of the composed delta is verified to hold the base content or the composed content, the workspace outside the delta is verified against the base, and the application is repeated in full (F143-FR-025).
3. **Given** `stop` with a group live, **When** the request is read, **Then** no further worker starts, live workers finish their pass, integration and the merge check run to `group_closed`, and then the stop takes effect (F143-FR-026).
4. **Given** a worker process that outlived the engine, **When** the engine starts again, **Then** the holder of the run token is ended before any tree is swept (F143-FR-018).

---

### Edge Cases

- A worker writes a yield artifact: it is refused and the outcome of the worker is `refused` (F143-FR-011).
- A worker tree changes after its final snapshot: that worker is refused (F143-FR-017).
- An object of a tree is missing in the store: the group is refused and the loop layer is switched off for the phase attempt (F143-FR-003).
- A path of the workspace holds neither the base nor the composed content after an interrupted application: all writing stops and the loop layer is switched off for the run (F143-FR-025).
- A stale worker tree of the same run, group and worker exists: it is removed before the new one is made (F143-FR-027).
- The stream of a worker pass was lost: the pass is recorded with unknown usage (F143-FR-018).
- A worker was interrupted by a relaunch and its restart is used: its outcome is `killed` (F143-FR-013, F143-FR-025).
- A ledger record inside a group was edited: the loop layer is switched off for the phase attempt (F143-FR-023).
- Four streams write at once: `seq` has no gap and every worker's records keep their order (F143-FR-024).
- The harness adapter declares no process-level spending limit: the engine says so in the view of the phase attempt (F143-FR-016).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. A requirement names the test
`CT-143-<n>`, where n is 100 plus the number of the requirement. The ids these requirements had
before the split are under "Ids before the split". Numeric defaults have low confidence and are
starting values.

#### The tree store

- **F143-FR-001**: The tree store MUST be a service of the engine with exactly the operations `snapshot`, `materialize`, `changed`, `compose`, `apply`, `release` and `sweep`, behind the interface of feature 100. It MUST have no restore, no reset and no checkout of the workspace, and no operation other than `apply` MUST be able to write a path of the workspace. Only what parallel units need MUST be built; nothing is built for `autoresearch`.
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - divergence: DV-080
  - parity: off (no operation is called; row 20 of annex X §X.7)
  - test: CT-143-101

- **F143-FR-002**: The store MUST be a repository of the runtime, one per run, in the control plane. No operation of the store or of the layer MUST write a file under the project's repository directory, create a reference there or change the project's index. The hashes of every file under the project's repository directory and the reported status of the working tree MUST be equal before a group and after it.
  - divergence: DV-084
  - test: CT-143-102

- **F143-FR-003**: Snapshot commits MUST exist only in the store and only under four conditions: outside the project's repository; with a fixed author, date and message; never a parent of a commit of the project and never pushed; removed with the run. The verification gate and grounding MUST still run on the working tree and never on a snapshot. A snapshot MUST cover exactly the fingerprint scope (tracked files with their uncommitted changes, and untracked files that are not ignored), less the workspace part. The base snapshot MUST be taken at group start, after the processes of the main line have been ended. A snapshot MUST copy into the store every object that no reference of the project reaches. Before `materialize` and before the application the store MUST verify that every object of the tree is present; a missing object MUST refuse the group and switch the loop layer off for the phase attempt. A final snapshot MUST use the ignore rules of the base snapshot.
  - test: CT-143-103
  - divergence: DV-080; DV-084

- **F143-FR-004**: Every repository process of the runtime MUST run without the system configuration and the global configuration, with the configuration of the store compared with its recorded hash first, with hooks and the file-system monitor off, and with no filter, no text conversion, no external difference tool and no merge driver. A snapshot MUST store the bytes on disk; the application MUST write the bytes of the stored object. A worker tree whose attributes file names a filter and a conversion of line ends MUST start no process and MUST give equal bytes.
  - test: CT-143-104

#### The worker root and worker trees

- **F143-FR-005**: Worker trees MUST live in the worker root, outside the workspace and outside the control plane, readable and writable by the owner only. The path of a worker tree MUST hold one opaque random component and MUST hold no run, group or worker ordinal. Neither the worker root nor the store MUST exist with the option off.
  - test: CT-143-105
  - status: unverified (check: the place and the permissions of the worker root on macOS; verified-on: —; pin: the macOS runner of the release)

- **F143-FR-006**: A worker tree MUST be a repository of its own, made from the base snapshot: its repository directory lies inside the tree and borrows the objects of the store read-only, so that no worker can write the store. No branch and no reference MUST be made in the project's repository. The snapshot of the runtime MUST exclude the repository directory of the worker tree. A worker's own commits, references or stashes MUST have no effect: the delta is taken from the files.
  - test: CT-143-106
  - divergence: DV-080; DV-084

- **F143-FR-007**: Ignored paths MUST be absent from a worker tree. Seed paths named by a toolchain profile or by user configuration MUST be copied into every worker tree before the pass. A seed path MUST never be linked and never be shared writable. Nothing under a seed path or under an ignored path MUST be part of a delta.
  - ep: EP-16 `specstride.toolchain/1` (consumes)
  - parity: not used (row 95 of annex X §X.7)
  - test: CT-143-107
  - status: unverified (check: a copy-on-write copy of a seed path on macOS; verified-on: —; pin: the macOS runner of the release)

- **F143-FR-008**: Each worker tree MUST receive a workspace part of its own: an empty outbox and a handoff written by the runtime that names the assigned task, the scope and the base fingerprint. The phase evidence, the notebook and the outbox of the main line MUST NOT be copied. The task list MUST be in every snapshot and MUST be dropped from every delta.
  - test: CT-143-108

- **F143-FR-009**: The environment of a worker MUST hold one opaque token, the run token and a temporary directory, and MUST hold no index and no count. The temporary directory MUST lie beside the worker tree in the worker root, inside the write roots of the sandbox, MUST never be part of a snapshot and MUST be removed at group close. A toolchain profile MAY give, per worker, the environment that moves a cache which is unsafe for several writers; for a toolchain without a profile the run record and the `[LOOP]` line MUST say `worker-caches=shared` and the doctor MUST name it. The runtime MUST promise no port.
  - ep: EP-16 `specstride.toolchain/1` (consumes)
  - test: CT-143-109

#### The group executor

- **F143-FR-010**: There MUST be one harness process per worker, in a process group of its own, registered in the process registry with the class `owned` and with pid, start time, run token and worker id. The group executor MUST run at most `workers` processes at a time. A worker MUST run at the strongest containment its harness offers, with its tree as the write root; at C2 and above the sandbox MUST deny writes to the workspace, the trees of its siblings, the control plane and the store.
  - ep: EP-02 `specstride.harness/1` (consumes)
  - test: CT-143-110
  - status: unverified (check: process groups of workers on macOS; verified-on: —; pin: the macOS runner of the release)

- **F143-FR-011**: Every worker pass MUST be a fresh session with a minted id, on the base model tier of the proposer as resolved at launch, and MUST make one proposal: one pass that ends at a checkpoint naming its assigned task. No repair, no check, no escalation and no yield MUST take place in a worker; a yield artifact in the outbox of a worker MUST be refused with an event, and the outcome of that worker MUST be `refused` (R29 PU-36). No session MUST be continued into a worker or out of one. The critic-diversity rule and its warning MUST be evaluated over the models of all passes of the phase attempt, worker passes included. Session state of a worker MUST live under the phase attempt, per worker, and MUST be removed when the group closes. After a group has been applied the next pass of the main line MUST be a fresh session.
  - divergence: DV-010
  - parity: not observable (session continuation is off; row 10 of annex X §X.7)
  - test: CT-143-111

- **F143-FR-012**: The outcome of a worker MUST be one of the closed set `integrated`, `refused`, `killed`, `paused`. A checkpoint that names another task, that is absent, or that was written by a killed pass MUST give the outcome `refused`. A refused worker MUST charge nothing to its task; the task returns to the main line with its counts as they were.
  - test: CT-143-112

- **F143-FR-013**: A worker MUST be restarted at most once, in its tree, in a fresh session, and only after an interruption it did not cause: a crash of the engine, a relaunch, a quota pause.
  - test: CT-143-113

- **F143-FR-014**: The work of a worker that is killed MUST be discarded from integration, and its task MUST return to the main line. Its snapshot MUST stay in the store until the phase attempt ends.
  - test: CT-143-114

- **F143-FR-015**: A pause MUST pause the group. On a quota signal from any worker the engine MUST start no further worker, MUST send the polite stop to every live worker of the group, MUST close their passes with the cause of the pause, MUST keep their trees, MUST write the one pause record and MUST emit one pause event. The pause MUST spend no cycle, no restart of a worker, no time cap and no budget. On resume, and on `resume` after a reboot, each unfinished worker MUST get a new pass in its tree.
  - ep: EP-12 `specstride.quota-classifier/1` (consumes)
  - test: CT-143-115

- **F143-FR-016**: Under a hard cap each worker pass MUST start with a process-level spending limit of the remaining budget of the role divided by the tasks of the group, where the harness adapter declares that capability; where it does not, the engine MUST say so in the view of the phase attempt, so that the loop layer can hold a group to the stricter budget condition of its admission. The cap MUST be evaluated on the sum over live workers at every usage record, and crossing it MUST end every worker of the group.
  - ep: EP-02 `specstride.harness/1` (consumes)
  - test: CT-143-116

- **F143-FR-017**: Barrier. The final snapshot of a worker MUST be taken when the processes of that worker have been ended, and its tree id MUST be recorded in the ledger before any other step. Before the barrier closes every process of every worker of the group that the runtime can identify MUST be ended; where the runtime cannot guarantee that none remains, the run MUST say `protection=detect`. Integration MUST start only when every worker pass of the group has ended. At the barrier every worker tree MUST be fingerprinted again; a tree that differs from its final snapshot MUST refuse that worker, with an event that is not shown to the critic. No check and no command of the verification gate MUST run while a process of a worker is known to live.
  - test: CT-143-117

- **F143-FR-018**: Every process of a worker MUST carry the run token. At engine start and at `resume` the engine MUST search for holders of the run token and MUST end them after the identity check; `status` and the doctor MUST report them. A tree MUST be swept only after its processes are ended. A pass whose stream was lost MUST be recorded with unknown usage, and every cost report that includes it MUST say that it is incomplete.
  - test: CT-143-118

#### Integration

- **F143-FR-019**: Composition MUST replace merge. The integrated tree MUST be the base in which each path of an accepted delta holds the content of the final snapshot of that worker. The path sets of accepted deltas MUST be pairwise disjoint; a delta that shares a path with an earlier one in the order of the tasks at launch MUST be refused with the reason `overlap`. The order of completion MUST have no effect. No content MUST be merged, no rename MUST be detected, and no model MUST take part.
  - ep: EP-04 `specstride.loop-layer/1` (implements)
  - test: CT-143-119

- **F143-FR-020**: The application MUST be one of the two writes that the runtime makes to the workspace inside a phase attempt, and only with the option on. It MUST be forward only; MUST write and delete exactly the paths of audited deltas; MUST run only onto a workspace whose fingerprint equals the base snapshot; MUST write bytes that a proposer wrote; MUST touch no index, no reference and nothing under the repository directory; MUST be recorded in the ledger before it is made; and MUST never be undone. For everything else the runtime MUST never commit to, revert, reset, clean or check out the workspace inside a phase attempt.
  - divergence: DV-085
  - parity: off (row 20 of annex X §X.7)
  - test: CT-143-120

- **F143-FR-021**: The ticks MUST be the other write. After the ledger record `applied` and before the merge check the runtime MUST tick the integrated tasks through the spec-format adapter, under a ledger record that lists the task ids. The ticks MUST be idempotent. Any change a worker made to the task list MUST be dropped; a tick remains the claim of the worker.
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - divergence: DV-085
  - parity: off (row 20 of annex X §X.7)
  - test: CT-143-121

- **F143-FR-022**: The staleness check for a worker pass MUST read the files of the workspace and not those of the worker tree. For the task list it MUST compare the hash that ignores checkboxes, so that a tick of the runtime never makes the run stale.
  - test: CT-143-122

#### Ledger, queue, resume, stop and clean-up

- **F143-FR-023**: A run MUST have one ledger and one writer. The records of a group join the ledger of the run in the namespace `parallel`, written ahead, from the closed set of thirteen kinds: `group_planned`, `group_started`, `worker_started`, `worker_ended`, `group_barrier`, `audit_done`, `merge_done`, `apply_started`, `applied`, `ticks_applied`, `merge_check_started`, `merge_check_finished`, `group_closed`. Every record of a worker MUST carry `workerId`. While a group is open the engine MUST be the only writer of the event file and of the ledger; workers MUST write no file of the control plane. A truncated, reordered or edited ledger inside a group MUST be detected and MUST switch the loop layer off for the phase attempt.
  - test: CT-143-123

- **F143-FR-024**: The records of N stream readers MUST pass one queue inside the engine. `seq` MUST be assigned at the append, rising and without gaps. Within one worker, records MUST keep the order of its stream, with `wseq` rising. The ordinal of a worker pass MUST be the triple of group ordinal, position of the task and restart index, so that it does not depend on timing.
  - test: CT-143-124

- **F143-FR-025**: On `resume` and on a relaunch in the middle of a group the last ledger record MUST decide. (1) `group_planned`: start the group. (2) `group_started`, or `worker_started` without `worker_ended`: end the recorded processes of that worker after the identity check; its pass is lost; restart it if its restart is unused, otherwise its outcome is `killed`. (3) `worker_ended`: verify the tree id of its snapshot against the ledger. (4) `group_barrier`, `audit_done` or `merge_done`: verify the workspace against the fingerprint at group start and repeat from the audits. (5) `apply_started`: every path of the composed delta MUST hold either the base content or the composed content, and the workspace outside those paths MUST equal the fingerprint at group start; then the application is repeated in full. (6) If a path holds neither, or the workspace outside the delta differs: nothing more is written, the engine reports the state in the result of `integrateGroup`, the loop layer is switched off for the run, the integrity kind `tree-changed-outside-pass` is raised, and the micro-loop layer carries on from the tree as it is. (7) `applied` without `ticks_applied`: write the ticks. (8) `ticks_applied` or `merge_check_started`: run the merge check. The records `merge_check_finished` and `group_closed` leave no step of integration open: after `merge_check_finished` the engine closes the group (F143-FR-027) and writes `group_closed`; after `group_closed` nothing of the group is repeated. Every session after a relaunch MUST be fresh.
  - test: CT-143-125

- **F143-FR-026**: With a group live, `stop` MUST start no further worker, MUST let live workers run to the end of their pass, MUST let integration and the merge check run through `group_closed`, and MUST then take effect. `stop --now`, a stop by a budget and a time cap of the run MUST end the workers after the identity check and MUST leave the group to the states of F143-FR-025.
  - test: CT-143-126

- **F143-FR-027**: Clean-up. Before a worker tree is created, a stale tree of the same run, group and worker MUST be removed. At group close every worker tree of the group MUST be removed, on success and on failure. The removal of a worker tree (`release`) MUST remove the tree and its temporary directory and MUST write the worker root only (annex D §D.2); snapshots MUST leave the store with `sweep`. At engine start a sweep MUST remove every worker tree that no open group of the ledger owns. The store and the worker root of the run MUST be removed when the run ends.
  - test: CT-143-127
  - divergence: DV-080
  - assumption: CQ-237 (the words "with its entry in the store", from linked worktrees of R29v PU-93, have no meaning since ruling P6: a worker tree is a repository of its own and the store holds no entry per tree)

- **F143-FR-028**: The counters of the layer MUST live in the ledger and MUST continue after a resume and a relaunch: groups started and failed per phase attempt; per worker, passes started and restarts used; cycles spent. The flag that resets counts MUST reset them with the others.
  - test: CT-143-128

### Key Entities

| Entity | What it is |
|---|---|
| Group | An ordinal, the task ids in the order at launch, a base snapshot, its workers, its fingerprints, its outcome |
| Worker | An opaque id, the assigned task, the scope, a tree, a pass ordinal, an outcome |
| Snapshot | A tree id in the store |
| Delta | The paths that differ between two tree ids, each with its kind |
| Composed tree | The base in which each path of an audited delta holds the content of a final snapshot |
| Ledger record of the namespace `parallel` | One of the thirteen kinds, written ahead |
| Counters of a group | Groups started and failed per phase attempt; per worker, passes started and restarts used; cycles spent |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F143-SC-001**: The project's repository is never written inside a phase attempt. On 100 per cent of the group fixtures the hashes of every file under the project's repository directory are equal before and after the group.
- **F143-SC-002**: A run survives a crash in any state of a group. For each of the thirteen ledger records, a run whose engine was killed after that record ends in the same tree and the same kept units of work as the uninterrupted run, or rests with the loop layer off for the run and its event.
- **F143-SC-003**: A quota pause holds every worker. A quota signal in a group gives exactly 1 pause event, and every counter equals its value before the pause.

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
| The services are called only with parallel units on, an option that is off by default and off under the `parity` profile | Ruling 56 |
| Inside a phase attempt the runtime never commits to, reverts, resets, cleans or checks out the workspace. Two writes are allowed, only with the option on: the application of the composed delta and the ticks of the integrated tasks | Rulings 50, P1 |
| Store commits only under the four conditions of ruling P1 | Ruling P1 |
| Only the part of the tree store that parallel units need is built | Rulings 31, P3 |
| The partial work of a killed worker is discarded | Ruling P5 |
| A worker tree is a repository of its own | Ruling P6 |
| Ruling 39 does not bar the snapshots of the store; the verification gate and grounding run on the working tree | Ruling P7 |
| Integration is deterministic; no model takes part | Decision 21; Principle XX |
| Every numeric default has low confidence | R29 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, the repository commands
behind each operation of the tree store, the physical place of the worker root, and how a
copy-on-write copy is made.

## Extension points

This feature has no extension point of its own.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-04 | `specstride.loop-layer/1` | implements | The engine services behind `requestPassGroup` and `integrateGroup`; the tree-store service `specstride.tree-store/1` |
| EP-02 | `specstride.harness/1` | consumes | `startPass` per worker, the containment level, the write root, the polite stop, `spendLimit` |
| EP-03 | `specstride.spec-format/1` | consumes | `tick`; the task-list hash that ignores checkboxes |
| EP-12 | `specstride.quota-classifier/1` | consumes | The quota signal of a worker |
| EP-16 | `specstride.toolchain/1` | consumes | Seed paths; caches per worker |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Loop-layer interface: the directives `requestPass`, `requestPassGroup`, `integrateGroup`; what is withheld from a layer; `workerId` and `groupId` in the view of the phase attempt | `specstride.loop-layer/1` | Annex D §D.1, F100-FR-114, F100-FR-116, F100-FR-117, F100-FR-119 |
| Tree-store service; the two writes to the workspace | `specstride.tree-store/1` | Annex D §D.2, F100-FR-121 to F100-FR-125 |
| Parallel plan (read: the groups and the worker count) | `specstride.parallel-plan/1` | Annex D §D.3, F100-FR-126, F100-FR-127 |
| Yield artifact (a worker does not yield) | `specstride-pass-yield/v1` | Annex D §D.6, F100-FR-133 |
| No new run state, exit code or stop reason | — | Annex A §A.5, F100-FR-031 |
| Locations of state; the worker root | `specstride.layout/1` | Annex B §B.1, F100-FR-032, F100-FR-033 |
| Identifiers `workerId`, `groupId`, `passId` | — | Annex B §B.3 |
| Logical names `tree-store`, `worker-root`, `run:<runId>:ledger` | `specstride.layout/1` | Annex B §B.5 |
| Process registry; a stop ends owned processes after the identity check | `specstride.procs/1` | Annex B §B.10, F100-FR-064 |
| Ledger; the namespace `parallel`; counters survive | `specstride.ledger/1` | Annex B §B.13, F100-FR-068, F100-FR-069 |
| Pause record | `specstride.pause/1` | Annex B §B.17 |
| Harness port: `startPass`, capabilities, fresh session after an applied group | `specstride.harness/1` | Annex C §C.1, F100-FR-083 |
| Canonical spec model; `tick` | `specstride.spec-format/1` | Annex C §C.7 |
| Quota classifier | `specstride.quota-classifier/1` | Annex C §C.13 |
| Toolchain profile | `specstride.toolchain/1` | Annex C §C.14 |
| Containment levels | — | Annex C §C.15, F100-FR-111, F100-FR-112 |
| Process model: a worker pass is `owned` | — | Annex F §F.1 |
| Event envelope (`workerId`, `wseq`, `seq` at the append) | `specstride.event/1` | Annex X §X.1, F100-FR-198 |
| Canonical hasher: the task-list hash that ignores checkboxes | — | Annex X §X.5 |
| List of closed sets, rows 62, 64 and 184 | — | Annex X §X.6, F100-FR-208 |
| The `parity` profile, rows 10, 20 and 95 | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| Threat T-49 | — | Annex X §X.9 |

Feature 141: this feature has no parity test and cites no fixture family (feature 141, §O.7, "a
behaviour that is new"). The parity suite and the second suite run with the option off.

## Rows of the `parity` profile

This feature introduces no switch of its own. Its services are called only when row 20 of annex
X §X.7 (`loop.parallel.units`) is on; under the `parity` profile the row is off and no operation
is called.

One option of this feature has a row: row 95 of annex X §X.7. The spelling is confirmed; feature
110 owns it.

| Option | Key | Trust class | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| Seed paths | `loop.parallel.seedPaths` | Widening | empty | not used | DV-080 |

A widening key in project configuration is ignored, with a launch message and a doctor warning
(F100-FR-202).

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 143.

| Closed set | Row of annex X §X.6 | Closed by | Members | Unknown value |
|---|---|---|---|---|
| Outcomes of a worker | 62 | Design | `integrated`, `refused`, `killed`, `paused` | `refused` |
| Operations of the tree store | 64 | Design | `snapshot`, `materialize`, `changed`, `compose`, `apply`, `release`, `sweep` | The layer is refused at registration |
| Ledger record kinds of the namespace `parallel` | 184 | Design | The thirteen of F143-FR-023 | The ledger is read as invalid inside the group; the loop layer is switched off for the phase attempt |

Annex X §X.6 names feature 143 as the owner of the three rows. Row 64 is closed by design: ruling
P3 allows the part of the tree store that parallel units need, and the seven operations come from
R29 and R29v. The requirement that needs each operation is listed under "Operations of the tree
store and the requirements that need them".

## Operations of the tree store and the requirements that need them

Ruling P3 allows only the part of the tree store that parallel units need. Each operation of the
closed set is needed by a requirement of this feature (checked on 2026-09-30).

| Operation | Needed by |
|---|---|
| `snapshot` | F143-FR-003 (base and final snapshot), F143-FR-017 (the final snapshot, and the tree fingerprinted again at the barrier) |
| `materialize` | F143-FR-006 (a worker tree made from the base snapshot), F143-FR-007, F143-FR-008 |
| `changed` | F143-FR-006 (the delta is taken from the files), F143-FR-008 (the task list dropped from every delta), F143-FR-019 (the path sets of the deltas) |
| `compose` | F143-FR-019 |
| `apply` | F143-FR-020, F143-FR-025 (the application repeated in full) |
| `release` | F143-FR-027 (a stale tree before creation; every tree at group close; the tree and its temporary directory, the worker root only, as annex D §D.2 gives it), F143-FR-009 (the temporary directory removed at group close) |
| `sweep` | F143-FR-027 (at engine start; snapshots leave the store; the store and the worker root at the end of the run), F143-FR-018 (a tree is swept only after its processes are ended) |

No operation is without a requirement. Nothing of the seven serves `autoresearch`.

## As-is behaviour not carried

The traceability files assign no row to feature 143. No as-is requirement, success criterion,
cluster or behaviour item is carried by this feature, and none is superseded or dropped by it.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

The as-is requirement 002 FR-048 (worktree creation rules of Lisa) stays with the feature that
owns the layer `parallel`, by the orchestrator's decision at the split. Its characterization
test reaches the services of this feature through the tree-store interface of feature 100, annex
D §D.2. The requirements F143-FR-003, F143-FR-006 and F143-FR-027 state the new behaviour and
carry no `origin:`.

Lisa's integration code has no requirement in 002 and is not carried: its merge writes the
project's working tree, index and history, and its failure policy needs a revert.

## Ids before the split

Feature 143 was split from `142-parallel-units` on 2026-09-29. Old ids are never used again.

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

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or
reused, and no requirement was added.

| Item | Place | What changed |
|---|---|---|
| W-X-11 | F143-FR-007, line `parity:` | "rows to be added" became "row 95 of annex X §X.7" |
| W-100-07 | "Closed sets", row 64 | "Closed by" is "Design", not "Owner decision" |
| W-X-12 | "Closed sets" | The ledger record kinds are row 184 of annex X §X.6; the sentence that annex X names feature 142 for rows 62 and 64 is removed |
| W-X-12 | "Contracts of feature 100 used" | Rows 62, 64 and 184 of §X.6; rows 10, 20 and 95 of §X.7 |
| W-100-07 (ruling P3) | New section "Operations of the tree store and the requirements that need them" | Each of the seven operations is named with the requirement that needs it |
| Table of feature 100, rows 1, 4 and 7 | "Out of scope" | The owner of fingerprints, the protected set and toolchain profiles is 116, not 115 |
| — | "Assumptions" | The clarify queue runs to CQ-194 |
| CQ-237, answer of the owner (2026-09-30) | F143-FR-027 (changed in place); "Operations of the tree store", rows `release` and `sweep`; "Assumptions"; `data-model.md` | The words "with its entry in the store" are dropped (twice); `release` removes the tree and its temporary directory and writes the worker root only (annex D §D.2); snapshots leave the store with `sweep`; `assumption: CQ-237` |

## Repairs after the analyze run of 2026-09-30

No id was renumbered or reused, and no requirement was added.

| Finding | Place | What changed |
|---|---|---|
| F1 | F143-FR-011 | A refused yield artifact gives the worker the outcome `refused`, as R29 PU-36 and the edge case say |
| F2 | F143-FR-025 | The records `merge_check_finished` and `group_closed` are stated, so that the kill test after each of the thirteen records has an expected state; the eight numbered states are unchanged |
| F3 | "Assumptions" | The divergence register runs to DV-119 and the clarify queue to CQ-238; the spec already cited CQ-237 |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Does integration merge content? → A: No. It composes disjoint, audited deltas. (Source: R29v PU-80 over R29 PU-47; F100-FR-122)
- Q: Do rulings 31 and 39 bar the tree store and its snapshots? → A: No. Rulings P3 and P7 say so. (Source: `APPROVAL.md`, "Rulings given after the approval")
- Q: Does this feature carry 002 FR-048, whose clauses on a stale worktree and on the base reference describe what its services do? → A: No. The row stays assigned to feature 142 alone and its test stays whole there. The requirements here carry no `origin:`. (Source: the orchestrator's message at the split; `STAGE-B-SPLIT-PROMPT.md` step 7)
- Q: Who audits a delta? → A: The owner of the layer `parallel`. This feature receives audited deltas, as the input of `compose` in annex D §D.2 names them, and records the result of the audits in the ledger record `audit_done`. (Source: feature 100 annex D §D.2; brief 142 heading 7, groups G-B and G-C)

Questions of `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: What does the engine raise when an interrupted application left a path with neither the base nor the composed content, given that R29 PU-65 names the event `apply-incomplete`? → A: It stops all writing and reports the state through the directive result of `integrateGroup`; the loop layer is switched off for the run. The kind that may reach a critic-class call is the neutral `tree-changed-outside-pass`; `apply-incomplete` stays in the event file. Integrated in F143-FR-025. (Source: R29v PU-83, which amends PU-65; feature 100 annex D §D.1, "Failure of an implementation")
- Q: What does the ledger record kind `merge_done` record, given that integration does not merge? → A: The composition: the id of the composed tree and the accepted workers in the order of the tasks. The name is kept because the brief and R29 give it. (Source: brief 142 heading 4; R29v PU-80)
- Q: How does the loop layer learn that a harness adapter declares no process-level spending limit? → A: From the view of the phase attempt, which carries the capabilities of the harness port read at launch. No citation of another feature is needed. Integrated in F143-FR-016. (Source: feature 100 annex C §C.1, capability `spendLimit`; annex D §D.1, "Inputs")
- Q: Which steps of a group does the engine perform by itself, and which on a directive? → A: All on a directive. `requestPassGroup` covers group start to barrier; `integrateGroup` covers composition, application and ticks. The audits and the merge check are decided by the loop layer; the engine records their results under the ledger kinds `audit_done`, `merge_check_started` and `merge_check_finished`. (Source: feature 100 annex D §D.1, directives; F100-FR-114)
- Q: Does this feature add a key for the number of workers or for time limits? → A: No. The worker count comes with the directive as its concurrency limit, and the time limit comes with every `requestPass`. The one option of this feature is the list of seed paths. (Source: feature 100 annex D §D.1, `requestPass` and `requestPassGroup`)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register runs to DV-119 and the clarify queue to CQ-238 (read on 2026-09-30); this specification cites CQ-237.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The three facts of brief 142 heading 8 that are `unverified` are captured by the harness adapter features; this feature reads the capabilities they declare.
- No reading of this specification rests on a question that the sources leave open, beyond CQ-237.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-237 | Does "with its entry in the store" in F143-FR-027 still have a meaning after ruling P6? | Closed on 2026-09-30 (the recommended answer stands): no; the words are dropped; `release` removes the tree and its temporary directory and writes the worker root only (annex D §D.2); snapshots leave the store with `sweep` | F143-FR-027 |
