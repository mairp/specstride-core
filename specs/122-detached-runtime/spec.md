# Feature Specification: Detached runtime

**Feature Branch**: `122-detached-runtime` (a label: Spec Kit creates no branch in this repository; the directory is `specs/122-detached-runtime`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 122-detached-runtime of Specstride: the detached runtime mechanism. The runtime root as leader of a detached process tree; detach strategies (EP-17) spawn-detached and foreground; the launch record with its nonce and the handshake (started, attached, refused, launch-abandoned); the workspace lock and liveness provider (EP-13), the lease with heartbeat, hand-down and verification, lock reclaim; the process registry with classes owned and adoptable; the inbox; re-attachment as reading; what happens to the lock when engine or root dies; state export, import and adopt; the advisory marker; the detach spike that comes first."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 18, 21, 22, 23, 28, 29, 67, K2, K6, K7, K8), `architecture.md` (sections 4, 5, 7, 8, 17, 18), `consolidation.md` (sections 1, 5, 6), `feature-briefs.md` (brief 122-detached-runtime, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (Principles I, VI, XII, XVI, XVII), the research reports R15 (A-5, A-7), R15v (A-7, B-9, D-1 to D-8, P-2, P-3, P-6, P-13, P-14), R2v ("Lock design risks"), R11 (T-26, T-27, T-29), R14 (risk 10), R29 (PU-32), R29v (V-12, PU-90), feature 100 (`specs/100-specstride/`, annexes A, B, E, F, G, H, X) and feature 141 (`specs/141-parity-oracle/`, §O.1 to §O.7).

## What this feature is

A run of Specstride lasts hours. The host session that started it does not. This feature is the
mechanism that lets a run outlive its host session: a runtime root that leads a process tree of
its own, a lock that makes sure one run at a time works in a workspace, a lease that tells a live
owner from a dead one, a registry of the processes the run started, and an inbox through which a
process outside the tree can ask for something. It also makes the control plane of a feature
movable, because the control plane lies outside the working tree and a moved tree would otherwise
lose its approvals.

Feature 100 states the interfaces. This feature specifies the behaviour behind them.

**In scope**: the runtime root as the leader of a detached process tree; the detach strategies;
the launch record with its launch nonce, and the handshake; the workspace lock and liveness; the
lease, its heartbeat, its hand-down to the engine and its verification; lock reclaim; the process
registry with the classes `owned` and `adoptable`; the inbox as the only place a process outside
the runtime tree writes after launch; re-attachment as reading; what happens to the lock when the
engine or the root dies; `state export`, `state import` and `state adopt`; the advisory marker in
the workspace part; the spike that comes before this specification freezes.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| What is relaunched and when; both relaunch classifier tables | 123 |
| `stop` and `resume` as commands, and their refusals | 102 |
| The stages the runtime root executes | 123 |
| `status`, the read model and the precomputed status line | 129 |
| The host hook shim that prints the status line | 113 |
| A quota pause as a state of the engine; the pause record | 127 |
| The launch checks other than those about the lock, the marker and unadopted approvals | 107, 112, 123 |
| The approval record and its signature | 101 |
| The event types and their fields | 111 |
| The spelling of every configuration key | 110 |
| A detach strategy that survives a reboot | Roadmap |
| A native kernel lock | Roadmap, on demand, as an entry of the Language Ledger (ruling 23) |
| The worker root and the tree store of parallel units | 142. The process registry of this feature records the worker processes |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A run outlives the host session (Priority: P1)

A consumer starts a run from a host session and closes the session. The run goes on. In a new
session the consumer asks for the state and sees the run.

**Why this priority**: It is the reason the detached runtime exists. Without it every run ends
with its session, and the reference run shows 135 to 143 manual restarts.

**Independent Test**: Start a run through `launch` from the shell of a host, end the process that
started it, by exit and by a signal, and confirm that the runtime root lives, that its log fills,
and that a probe of the lease reports a live owner. On a live host this is the spike.

**Acceptance Scenarios**:

1. **Given** a workspace with no run, **When** the consumer runs `launch`, **Then** the launch record is written first, the runtime root starts as the leader of a process session of its own, the lease carries the launch nonce, and `launch` prints one line `[SPECSTRIDE-LAUNCH]` and exits 0 with the outcome `started`; at the first launch in the workspace the layout version file is written (F122-FR-001, F122-FR-004, F122-FR-005, F122-FR-043).
2. **Given** a run that lives, **When** the process that started it ends or is killed, **Then** the runtime root lives, writes its log, and the lease has a live owner (F122-FR-001).
3. **Given** a run that lives and a new host session, **When** the consumer asks for the state, **Then** the answer comes from reading the lease and the records; no channel to the runtime root is opened (F122-FR-008).
4. **Given** a host where the default detach strategy does not survive the end of the session, **When** the consumer selects the strategy `foreground`, **Then** the run works with the same lock, lease and handshake (F122-FR-002).
5. **Given** a launch whose detach strategy fails or whose lease does not appear in time, **When** the wait ends, **Then** the outcome is `refused`, the line `[SPECSTRIDE-REFUSE]` names the strategy `foreground`, and `launch` exits 4 (F122-FR-005).

---

### User Story 2 - One run per workspace (Priority: P1)

An operator, a script or a second host session starts a run on a workspace where a run lives. The
second start is refused, leaves no trace, and says who holds the workspace.

**Why this priority**: Two runs in one working tree destroy each other's work. The reference
systems guarantee one run, and other programs match the codes 5 and 24.

**Independent Test**: With eight contenders that start at the same moment on one workspace whose
lock is stale, repeated 300 times, every round has exactly one winner. With a live run, a
foreground `run` exits 5 and a second pipeline exits 24.

**Acceptance Scenarios**:

1. **Given** a workspace whose lock is held by a live run, **When** a foreground `run` starts, **Then** it exits 5, prints the as-is line on standard error in compatibility output, and the pointers to the current event file and engine log and the run snapshot of the live run are unchanged (F122-FR-011, F122-FR-012).
2. **Given** a workspace whose lock is held by a live run, **When** a second `launch` arrives, **Then** its outcome is `attached`, it prints the run that lives, and it exits 4 (F122-FR-006).
3. **Given** a lock whose owner is dead and whose owned process groups are gone, **When** eight contenders try to take it at once, **Then** exactly one wins and the others receive a conflict that names the winner (F122-FR-015).
4. **Given** a lock whose owner record names another host name or another pid namespace, **When** any launch arrives, **Then** the probe says `held-foreign`, the launch is refused, and nothing reclaims the lock by itself (F122-FR-016).
5. **Given** a lock whose owner is dead while a process group it owned lives, **When** a launch or `resume` arrives, **Then** it is refused and the survivors are named (F122-FR-017).
6. **Given** a clean end of a run, **When** the runtime root ends, **Then** the lock is released and the advisory marker is removed (F122-FR-020).

---

### User Story 3 - No process of a run is left behind, and none is ended by mistake (Priority: P1)

The engine dies while a harness process works. The runtime root ends that process before it
relaunches or rests. If the root is gone too, the next engine start or `resume` finds the process
by its run token and ends it. A process that does not belong to the run is never signalled.

**Why this priority**: An orphaned harness process edits the tree and spends quota while every
reader says the run is dead (R15v D-1; R29v V-12). A signal to a wrong process harms the
consumer's own work (R11 T-26).

**Independent Test**: Kill the engine by signal while a stub harness process lives; assert that
the process is gone before the next engine start. Kill the root as well; assert that `resume`
finds the holder of the run token and ends it. Plant a registry entry whose pid belongs to an
unrelated process; assert that no signal is sent.

**Acceptance Scenarios**:

1. **Given** an engine that ended by a signal and a live harness process of class `owned`, **When** the runtime root sees the end of the engine, **Then** it ends the process after the identity check and only then relaunches or rests (F122-FR-026).
2. **Given** a dead runtime root and a live holder of the run token, **When** the consumer runs `resume`, **Then** the holder is found in the process table and ended; before that, the operation that reports survivors names it (F122-FR-027).
3. **Given** a registry entry whose pid, start time or run token does not match the live process, **When** a stop asks for the process to be ended, **Then** no signal is sent and the mismatch is recorded (F122-FR-025).
4. **Given** the detached job of an accepted yield, **When** a stop ends the run, **Then** the job lives, the lock is free, and the next engine start adopts the job (F122-FR-028).
5. **Given** a runtime root that died, **When** the engine reaches its next boundary, **Then** verification of the lease fails, and the engine ends as feature 100 annex E F100-FR-147 states (F122-FR-018).

---

### User Story 4 - A moved working tree keeps its approvals (Priority: P2)

A consumer moves, renames or clones a working tree. The new tree has a new workspace identity and
no approval records. The product refuses to start at phase 1 over ticked phases, and tells the
consumer how to bring the control plane along.

**Why this priority**: Without it a moved tree sends the proposer to redo approved phases (R15v
D-7). It is the cost of the control plane outside the tree, which the owner accepted with this
answer (ruling 22).

**Independent Test**: Run two phases to approval, move the tree, run `launch`: it is refused and
names `state export`, `state import` and `state adopt`. Run `state adopt` with the old path, then
`launch`: the run continues at phase 3.

**Acceptance Scenarios**:

1. **Given** a tree whose spec shows ticked phases and whose control plane holds no approval record for them, **When** the consumer runs `launch`, **Then** the launch is refused and the message names the three commands (F122-FR-037).
2. **Given** a control plane at the old path of the same tree and no live run there, **When** the consumer runs `state adopt`, **Then** the control plane of the feature belongs to the new workspace identity and every approval record verifies (F122-FR-035).
3. **Given** an archive written by `state export`, **When** the consumer runs `state import` on another machine, **Then** the archive is verified and installed; an archive that was changed is refused with exit 1 (F122-FR-033, F122-FR-034).
4. **Given** a live run of the feature, **When** any of the three commands runs, **Then** it prints one line `[SPECSTRIDE-REFUSE]`, exits 5 and changes nothing (F122-FR-036).

---

### User Story 5 - A request from outside reaches the run (Priority: P2)

A process outside the runtime tree, the CLI on behalf of the consumer or of a host, asks the run
for something by writing a request to the inbox. It writes nothing else.

**Why this priority**: The inbox is the only way in after launch. It keeps the rule that host and
runtime coordinate through files.

**Independent Test**: Write each of the three request types, a request of an unknown type and a
malformed request; assert what the runtime does with each. Write a stop request while no run is
active, start the engine, and assert that this engine start stops at its first boundary.

**Acceptance Scenarios**:

1. **Given** a live run, **When** a request of a known type appears in the inbox, **Then** the runtime validates it and the reader named for that type acts on it at its next boundary (F122-FR-029).
2. **Given** a request of an unknown type or one that fails validation, **When** the runtime reads it, **Then** it is ignored and reported, and the run goes on (F122-FR-029).
3. **Given** no active run, **When** a stop request is written and the engine is started afterwards, **Then** that engine start honours the request at its first boundary, as at the baseline (F122-FR-030).

---

### User Story 6 - The spike settles what is unverified (Priority: P1)

Before this specification freezes, a spike shows on a live host whether a process started from
the host's shell tool survives the end of the session, and whether the control root can be written.

**Why this priority**: Everything else rests on a fact that no report verified (architecture,
open risk 1). The spike is the first task of the feature.

**Independent Test**: The spike itself: sixteen cases, eight on each of two platforms, each with a recorded
result, and a skip with its reason where no live host is available.

**Acceptance Scenarios**:

1. **Given** a live host on Linux, **When** the spike runs its cases, **Then** each case has the result `survived`, `ended` or `skipped` with its reason, with the host version and the date (F122-FR-040).
2. **Given** no live host or no macOS machine, **When** the spike runs, **Then** the case is a skip with its reason and never a pass (F122-FR-040).
3. **Given** a case in which the default strategy did not survive, **When** the product runs on that host, **Then** the doctor names the strategy in use and what it survives, and the launch message names `foreground` (F122-FR-041).

---

### Edge Cases

- The host session ends while `launch` waits: the launch record has no outcome. Readers derive `launch-abandoned` after the handshake limit; the next launch closes the record (F122-FR-007).
- Two launches start at the same moment: one root takes the lock; the other launch sees a lease with another nonce and ends as `attached`, not as `refused` (F122-FR-006).
- The machine slept: the heartbeat is old and the owner lives. The probe says `held-live`; readers derive `stale`, not `dead`; on wake the root writes a heartbeat at once and recomputes every wait from recorded times (F122-FR-014, F122-FR-032).
- The machine rebooted and a new process has the pid of the old owner: the boot identity differs, so the probe says `stale-owner-dead` (F122-FR-013).
- The owner record cannot be read or lacks a required field: the probe says `unknown`, which counts as held (F122-FR-013).
- The lock provider recorded for the workspace differs from the one configured: the launch is refused with a doctor finding (F122-FR-019).
- The proposer deletes the advisory marker: the runtime root writes it again at the next heartbeat and an integrity event is raised (F122-FR-038).
- A second user or a container starts a run on the same tree: its control plane is empty, the marker names an owner it cannot probe, and the launch is refused with `foreign-owner` (F122-FR-038).
- The host's shell cannot write the control root: the launch is refused with a message that names the key of the control root (F122-FR-039).
- The path of the control root is so long that the liveness endpoint cannot be created: the provider places the endpoint at a short location; where that fails, `acquire` gives `unknown` and the launch is refused (F122-FR-021).
- The runtime root died and the engine lives: the engine is of class `owned`, so a probe says `owner-dead-group-alive` until the engine has ended at its next boundary; after that the probe says `stale-owner-dead` and `resume` may reclaim (F122-FR-013, F122-FR-018).
- A detached job is alive while its engine and root are dead: it never makes the probe say `owner-dead-group-alive` (F122-FR-017).
- A stop request is written by a pass of the proposer into the workspace part: it is not in the inbox and is not read (F122-FR-029).
- `state import` finds approval records for the feature in the target: it refuses and changes nothing (F122-FR-034).
- The working tree holds a directory with the name of the workspace part and no layout version file, for example a tree of an as-is system: nothing in it is read as state, and the first launch writes the layout version file (F122-FR-043).
- The layout version file names a major that the product does not support: the launch is refused and the doctor names the major found and the major supported (F122-FR-043).
- With parallel units on, the engine dies while four worker passes live: each has an entry of class `owned` with its worker id, and the runtime root ends all four (F122-FR-023, F122-FR-026).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. A requirement with an as-is origin names
the test of the traceability files. A new requirement names a characterization test
`CT-122-<n>`, where n is the number of the requirement (`CT-122-43` for F122-FR-043, which was added on 2026-09-30); `CT-122-101` to `CT-122-104` are the
characterization tests of the stop primitives extracted from Lisa. "Feature 100" followed by an
annex and a section names the interface contract through which this feature meets another.

#### Group G1 — Detach strategies, launch record, handshake, re-attachment

- **F122-FR-001**: The runtime root MUST be started so that it outlives the process that started it: as the leader of a process session of its own, with standard input closed, with standard output and standard error appended to the runtime log (`launch:<launchId>:runtime-log`), and with an environment that holds only the names of the environment allow-list. The strategy `foreground` is the one exception to the leadership of a process session (F122-FR-002). After the handshake nothing MUST connect the runtime root to the process that started it or to the host: no pipe, no socket that the host must keep, no parent that waits. Under the `parity` profile the compared launch log and launch record of the as-is detached launch are written by the compatibility projection, through feature 100 annex B §B.5 (F100-FR-054).
  - origin: C-255; B-2764
  - disposition: ported
  - test: PT-122-C-255-detached-start
  - ep: EP-17 `specstride.detach/1` (implements)
  - status: unverified (check: the spike of F122-FR-040, on Linux and macOS; verified-on: —; pin: host versions of the spike)

- **F122-FR-002**: Detach strategies MUST be an open registry with the operations `available`, `start` and `describe` of feature 100 annex F §F.6. Wave 1 MUST ship two strategies: `spawn-detached`, the default, and `foreground`, in which the consumer starts the runtime root in a terminal of their own and the root is not the leader of a new process session. With `foreground` the lock, the lease, the launch record and the handshake MUST be the same as with `spawn-detached`. The strategy MUST be selected by ordinary configuration; an unknown strategy id MUST be a configuration error with exit 3. A sample strategy outside the core MUST pass the conformance suite with no core file changed.
  - test: CT-122-2
  - ep: EP-17 `specstride.detach/1` (implements)
  - parity: `spawn-detached` (row 113 of annex X §X.7)

- **F122-FR-003**: `describe` MUST return the id of the strategy and what it survives, as a subset of the closed set `parent-end`, `session-end`, `reboot`. No Wave 1 strategy MUST claim `reboot`. The id of the strategy in use MUST be written to the launch record, and the doctor MUST be able to show the id and what the strategy survives through a registered check of feature 100 annex G §G.7.
  - test: CT-122-3
  - ep: EP-17 `specstride.detach/1` (implements); EP-14 `specstride.doctor/1` (implements (an entry))

- **F122-FR-004**: `launch`, `resume` and `run --detach` MUST write the launch record of feature 100 annex B §B.7 before the detach strategy is called, with a fresh launch nonce from a secure random source, the id of the detach strategy, and the path and hash of the engine executable, which is resolved once at launch. The launch record MUST be written to a temporary name and renamed. This feature adds no field to the schema of feature 100.
  - test: CT-122-4
  - parity: the oracle sets the key of the engine executable to its engine stub where a fixture needs one (row 41 of annex X §X.7)

- **F122-FR-005**: A launch MUST follow the four steps of feature 100 annex F §F.3. The runtime root MUST take the workspace lock, write the lease with the launch nonce of its launch record, and only then report the launch as an event. The CLI MUST wait for a lease that carries its launch nonce for a bounded time, the handshake limit, and no longer; it MUST record exactly one of the outcomes `started`, `attached`, `refused` in the launch record, print one line, and exit with the code of feature 100 annex F §F.3. In default output the line of the outcomes `started` and `attached` MUST be `[SPECSTRIDE-LAUNCH]` with the keys `run` and `state`, and the line of the outcome `refused` MUST be `[SPECSTRIDE-REFUSE]` with the keys `action`, `reason` and `next`, as feature 100 annex G §G.3 states; under the `parity` profile neither is printed. A strategy that is `unavailable` or `not-ready`, and a lease that does not appear inside the handshake limit, MUST give the outcome `refused`, and the message MUST name the strategy `foreground` as the way to run without detaching. The handshake limit MUST be ordinary configuration.
  - test: CT-122-5
  - ep: EP-17 `specstride.detach/1` (implements)
  - parity: the default value; the limit is not observable in a compared surface (row 114 of annex X §X.7)
  - assumption: CQ-138 (the default of the handshake limit; the sources give "a bounded time" and no value)

- **F122-FR-006**: When a launch finds, before or after it called the detach strategy, that a lease of a live run with another launch nonce exists for the workspace, the outcome MUST be `attached`: the CLI prints the run that lives and exits 4. Two launches that start at the same moment MUST end with one `started` and one `attached`. A runtime root that loses the lock to another root MUST end with the pipeline code 24 and MUST write no run state.
  - test: CT-122-6

- **F122-FR-007**: A launch record that is older than the handshake limit, has no outcome, and has no lease with its launch nonce MUST be derived by every reader as `launch-abandoned`. No process MUST write `launch-abandoned` as a state. The next `launch` or `resume` in the workspace MUST close the record by writing the outcome `refused` with the refusal `launch-abandoned` into it.
  - test: CT-122-7

- **F122-FR-008**: Re-attachment MUST be reading only. This feature MUST give a reader everything it needs through the lease and a probe of the lock: the owner record, the time of the last heartbeat, and `validUntil`, which is the time of the last heartbeat plus the grace. No operation of this feature MUST open a channel to a living runtime root, and a run MUST NOT need any reader to go on.
  - test: CT-122-8
  - ep: EP-13 `specstride.lock/1` (implements)

- **F122-FR-009**: `run --detach` MUST make a run request of kind `engine` and MUST use the same detach strategy, launch record, handshake, lock and lease as a run request of kind `pipeline`. A run request of another kind MUST refuse the launch.
  - test: CT-122-9

#### Group G2 — Lock, liveness, lease, reclaim

- **F122-FR-010**: There MUST be one lock and liveness provider per workspace, with the operations `acquire`, `heartbeat`, `release`, `probe`, `reclaim`, `handDown` and `verify` and the results and errors of feature 100 annex F §F.5. The scope of the lock MUST be the workspace. A provider that fails in `acquire` or `probe` MUST give `unknown`, which counts as held. A sample provider outside the core that keeps locks in memory MUST pass the conformance suite with no core file changed. Wave 1 MUST ship one provider.
  - test: CT-122-10
  - ep: EP-13 `specstride.lock/1` (implements)
  - status: unverified (check: the conformance suite of the provider on macOS; verified-on: —; pin: —)

- **F122-FR-011**: At most one run MUST work in a workspace at any moment. A foreground `run` on a workspace whose lock is held MUST exit 5. In compatibility output it MUST print on standard error the as-is line of a lost lock: the logical component name `engine`, a colon, and the text `another run holds the lock on <workspace> (<lock>). Exiting.`, where the lock is named by its logical name `workspace:lock` and compared through the layout table. `acquire` MUST be atomic: of any number of contenders exactly one receives the lease, and every other receives a conflict that names the holder.
  - origin: 028 FR-004; C-009; B-0119; C-012; B-0192
  - disposition: translated (028 FR-004; C-012); ported (C-009)
  - test: PT-122-028FR004-second-run-refused; PT-122-C-009-exit-5; PT-122-C-012-lost-lock-line
  - divergence: DV-022; DV-066
  - ep: EP-13 `specstride.lock/1` (implements)

- **F122-FR-012**: The lock MUST be acquired before anything of the run is written: before the run record, before the names `workspace:current:events` and `workspace:current:engine-log` resolve to the new engine start, and before the run snapshot is written. A start that loses the lock MUST leave the event file, the engine log and the run snapshot of the live run untouched.
  - origin: C-013; B-0249
  - disposition: ported
  - test: PT-122-C-013-lost-lock-leaves-no-trace

- **F122-FR-013**: `probe` MUST return exactly one of six results. `free`: no lock exists; a lock that is absent MUST count as free. `held-live`: the owner lives. `held-foreign`: the host name or the pid namespace of the owner record differs from the prober's. `stale-owner-dead`: the owner is dead and no process group it owned lives; an owner whose boot identity differs from the present boot MUST count as dead, whatever process now has its pid. `owner-dead-group-alive`: the owner is dead and a process of class `owned` lives. `unknown`: the owner record cannot be read or lacks a required field, or the provider failed. Every result except `free` and `stale-owner-dead` MUST count as held. "A run is active in this workspace" MUST mean, for every reader, that a probe counts as held. In compatibility output a reader that shows the owner of the lock MUST show the as-is owner line: the as-is run id of the engine start, one space, and the time the lock was taken in ISO 8601 form.
  - origin: C-115; B-1565; C-113; B-1509; B-1510; C-255; B-2760
  - disposition: ported (C-115); translated (C-113; C-255)
  - test: PT-122-C-115-lock-held; PT-122-C-113-owner-line; PT-122-C-255-run-directory-free
  - divergence: DV-022; DV-006
  - ep: EP-13 `specstride.lock/1` (implements)
  - status: unverified (check: resolution of process start time and boot identity on macOS; verified-on: —; pin: —)

- **F122-FR-014**: The lock MUST be held from `acquire` to `release` for the whole life of the runtime root, or of the engine in start mode `standalone`, and the owner record MUST be written with the lock, so that a lock never exists without its owner record. Liveness MUST rest on something that the kernel releases when the owner dies, and MUST NOT rest on a process id alone or on the age of a file. The owner MUST write a heartbeat to the lease at a fixed interval, which is ordinary configuration; the lease MUST hold the interval and `validUntil`. An old heartbeat with a live owner MUST NOT make the probe report a dead owner. Liveness MUST never be written as an event.
  - origin: C-011; B-0161; B-0162; C-229; B-2588
  - disposition: translated
  - test: PT-122-C-011-lock-form; PT-122-C-229-pipeline-lock
  - divergence: DV-022; DV-006
  - ep: EP-13 `specstride.lock/1` (implements)
  - parity: the default values of interval and grace; not observable in a compared surface (row 114 of annex X §X.7)
  - assumption: CQ-138 (the defaults of the heartbeat interval and of the grace; the sources give no value)

- **F122-FR-015**: `reclaim` MUST be the only way in which a lock changes its owner, and this feature MUST be its only owner. It MUST succeed only when a probe says `stale-owner-dead`. It MUST be atomic and MUST never be a removal followed by a creation. With 8 contenders that reclaim one stale lock at the same moment, over 300 rounds, every round MUST have exactly one winner; every loser MUST receive `lost-race`. A reclaimed lock MUST carry the owner record of the winner from its first moment.
  - test: CT-122-15
  - divergence: DV-022
  - ep: EP-13 `specstride.lock/1` (implements)

- **F122-FR-016**: A lock whose probe says `held-foreign` or `unknown` MUST never be reclaimed by the product by itself. The refusal and the doctor finding MUST name the logical name of the lock and the host name, the launch and the time of the owner record. Nothing MUST remove a lock whose owner lives.
  - test: CT-122-16
  - ep: EP-13 `specstride.lock/1` (implements)
  - assumption: CQ-140 (how a consumer frees a lock that is foreign or unknown for ever)

- **F122-FR-017**: A start on a workspace whose probe says `owner-dead-group-alive` MUST be refused, and the refusal MUST name every surviving process with its kind and its process id. A process of class `adoptable` MUST never cause this result and MUST never keep the lock held: the detached job of a yield holds nothing of the lock. The as-is variable that handed the descriptor of the lock to child processes is not read and not set; no child process inherits anything of the lock.
  - origin: C-007; B-0061
  - disposition: translated
  - test: PT-122-C-007-job-does-not-hold-lock
  - divergence: DV-022; DV-027
  - ep: EP-13 `specstride.lock/1` (implements)

- **F122-FR-018**: The runtime root MUST hand the lease down to the engine as a token, through `handDown`; the lease MUST hold only the hash of the token. An engine in start mode `child` MUST never take a lock. `verify` MUST answer whether the process that handed the token down still holds the lease, and MUST answer "no" when the provider fails. The engine calls `verify` at every boundary at which it reads the stop request; what the engine does when the owner is lost is stated in feature 100 annex E §E.2 (F100-FR-147).
  - test: CT-122-18
  - ep: EP-13 `specstride.lock/1` (implements)

- **F122-FR-019**: The id and the version of the provider that first acquired the lock of a workspace MUST be recorded in the workspace record of feature 100 annex B §B.6. A launch whose configured provider differs MUST be refused with a doctor finding. The identity of the workspace MUST be derived from the real path of the workspace root and MUST never be read from a file inside the workspace.
  - test: CT-122-19
  - ep: EP-13 `specstride.lock/1` (implements)
  - parity: the shipped provider (row 115 of annex X §X.7)

- **F122-FR-020**: When a run ends or rests (`finished`, `stopped`, `failed`, `blocked-on-human`), the owner MUST release the lock and remove the advisory marker before it exits, on every exit path it controls. After a release a probe MUST say `free`. In the states `paused-quota`, `relaunching` and `stopping` the lock MUST stay held. The as-is lock fallback that stays behind after a clean exit MUST NOT be carried.
  - test: CT-122-20
  - divergence: DV-022

- **F122-FR-021**: Where the liveness of a provider needs an endpoint in the file system, the provider MUST place it so that the length of its path does not grow with the length of the path of the workspace or of the control root, and MUST keep it readable and writable by its owner only. Where the endpoint cannot be created, `acquire` MUST give `unknown` and the doctor MUST name the cause.
  - test: CT-122-21
  - status: unverified (check: the path length limits of the liveness endpoint, measured on Linux and macOS; verified-on: —; pin: —)

- **F122-FR-022**: Every directory and every file that this feature creates in the control plane, the advisory marker in the workspace part excepted, MUST be readable and writable by its owner only. The feature MUST refuse to use a control root that another user can write: a launch MUST be refused with the refusal `control-root-unsafe` (closed set 212), a state command MUST print it under `[SPECSTRIDE-REFUSE]` and exit 3, and the doctor MUST report it.
  - test: CT-122-22

#### Group G3 — Process registry, processes that outlive the engine, inbox

- **F122-FR-023**: The process registry MUST hold one entry for every child process that the runtime tree starts, with the fields of feature 100 annex B §B.10, written by the process that started the child, one file per writer. The entry MUST be written before the child can do any work and MUST be closed with `endedAt` and `endCause` when the child ends. Processes of a pass, of a critic-class call, of a check, of a stage and of a worker MUST be of class `owned`; the detached job of an accepted yield MUST be of class `adoptable`. The entry of the engine (kind `engine`), where the runtime root started it, MUST be of class `owned`. The entry of a worker pass of parallel units MUST hold the worker id beside pid, start time and the hash of the run token.
  - test: CT-122-23

- **F122-FR-024**: Every process that the runtime root or the engine starts MUST carry the run token in its environment. The run token MUST be minted at every launch from a secure random source, MUST be stored nowhere except in the environment of the processes of that launch, and MUST appear in records only as its hash. The hashes of the run tokens of earlier launches of a run stay in its records, so that a process of an earlier launch can be recognised. The rule MUST hold with parallel units on or off.
  - test: CT-122-24

- **F122-FR-025**: A signal MUST be sent to a process only after an identity check: the process id, the start time that the operating system reports, and the run token that the process holds MUST all match the registry entry. On a mismatch no signal MUST be sent, the entry MUST be closed with the end cause `identity-mismatch`, and the mismatch MUST be recorded. A signal MUST go to the process group or process session that the runtime created for the entry, and never to a group the runtime did not create. The stop primitives extracted from Lisa MUST be brought under this rule and MUST find child processes on Linux and on macOS alike.
  - test: CT-122-25; CT-122-101; CT-122-102; CT-122-103; CT-122-104
  - status: unverified (check: how the start time of a process and its children are read on macOS; verified-on: —; pin: —)

- **F122-FR-026**: When the engine exits, for any cause, the runtime root MUST end every live process of class `owned` of that engine start, after the identity check, before it relaunches and before it rests. The rule MUST hold with parallel units on or off; with them on it MUST cover every worker pass.
  - test: CT-122-26

- **F122-FR-027**: This feature MUST offer an operation that searches the process table of the machine for processes that hold a run token whose hash the records of the run hold, and returns them as survivors, each with its process id, its start time and, where an entry exists, its kind and class. Every engine start and every `resume` MUST call it and MUST end the survivors that are not live entries of class `adoptable`, after the identity check, before any pass starts. `status` and the doctor read the survivors through the same operation and report them; they end nothing.
  - test: CT-122-27
  - status: unverified (check: reading the environment of a process of the same user from the process table on macOS; verified-on: —; pin: —)

- **F122-FR-028**: A process of class `adoptable` MUST survive a stop, `stop --now`, the end of the engine and the end of the runtime root. The next engine start MUST adopt it: it checks the identity of every open entry of class `adoptable`, keeps the entries whose process lives, and closes the others with the end cause `gone`. An `adoptable` process MUST be ended only on an explicit request, which is the field `jobs` of a stop request (feature 100 annex B §B.11).
  - test: CT-122-28

- **F122-FR-029**: After launch, the inbox MUST be the only place where a process outside the runtime tree writes, apart from launch records and the supervision record, which the CLI writes. The inbox MUST accept exactly the request types of feature 100 annex B §B.11. A request MUST be written to a temporary name and renamed. The runtime MUST validate every request against its schema before it acts on it, MUST ignore and report a request of an unknown type or one that fails validation, and MUST read requests at boundaries and never be interrupted by one. A request found anywhere else, the workspace part included, MUST NOT be read.
  - test: CT-122-29

- **F122-FR-030**: A stop request MUST be accepted when no run is active, and MUST stay in the inbox until it is honoured: the next engine start MUST read it at its first boundary and stop as at the baseline. An empty stop request MUST be valid and MUST mean a clean stop with every default. The process that honours a request MUST remove it.
  - test: CT-122-30

- **F122-FR-031**: When the runtime root dies or the machine reboots, nothing of this feature MUST relaunch the run by itself. Readers MUST derive `dead` from a run record in a live state and a probe that says `stale-owner-dead`; no process writes `dead`. The next launch or `resume` MUST reclaim the lock and, as the first writer of the event file, MUST write the closing event of the dead launch, `run.ended` marked as synthesized, before any other event.
  - test: CT-122-31

- **F122-FR-032**: No wait of the runtime root MUST depend on a timer that ran through a sleep of the machine. After a gap in its heartbeats the runtime root MUST write a heartbeat at once and MUST compute every remaining wait from the times recorded on disk. A paused run MUST compute its remaining wait from the recorded resume time of the pause record (feature 100 annex B §B.17).
  - test: CT-122-32

- **F122-FR-042**: A reader that asks whether a recorded process lives, without intent to signal it, MUST get "alive" for a process that the asker may not signal for lack of permission, and "not alive" for a process that has exited and was not yet collected by its parent. Where the operating system cannot tell whether a process id was reused, the answer MUST be "alive". Such an answer MUST be used only to refuse a claim that a run is complete, never to make one.
  - origin: C-255; B-2769
  - disposition: ported
  - test: PT-122-C-255-process-alive
  - status: unverified (check: the behaviour on macOS, where the baseline reads a reused process id as alive; verified-on: —; pin: —)

#### Group G4 — Export, import, adopt, the marker, the layout version, the spike

- **F122-FR-033**: `state export` MUST write one archive for one feature that holds its approval records, its ledger and its learning log, with a manifest of the hash of every member, the feature slug, the workspace identity and the product version. The archive MUST be signed, and MUST be readable and writable by its owner only. `state export` MUST refuse to write the archive inside the working tree.
  - test: CT-122-33
  - assumption: CQ-139 (what signs the archive and whether the key of the approval records travels with it)

- **F122-FR-034**: `state import` MUST verify the signature of the archive, the hash of every member and the signature of every approval record before it writes anything. It MUST install the records in the control plane of the workspace in which it runs. It MUST refuse an archive that fails verification, an archive read from inside the working tree, and a target that already holds approval records of the feature; a refusal MUST exit 1 and change nothing.
  - test: CT-122-34
  - assumption: CQ-139

- **F122-FR-035**: `state adopt` MUST take over the control plane that belongs to an old path of the same working tree. It MUST derive the old workspace identity from the old path the consumer gives, MUST verify every approval record found there, and MUST move the state of the feature, so that two workspaces never share a mutable file. It MUST refuse, with exit 1, when no control plane exists for the old path, when a record fails verification, or when a working tree still exists at the old path: a cloned tree is served by `state export` and `state import`, which copy.
  - test: CT-122-35

- **F122-FR-036**: `state export`, `state import` and `state adopt` MUST NOT run while a run of the feature is alive in the workspace they read or write: when a probe counts as held they MUST exit 5 and change nothing. They MUST exit 0 on success, 1 on missing state or a failed verification, and 3 on wrong usage or invalid input. In default output a command that succeeds MUST print one line `[SPECSTRIDE-STATE]` with the keys `action`, `feature`, `approvals` and, where the command has one, `out` or `from`; a command that refuses MUST print one line `[SPECSTRIDE-REFUSE]` with the keys `action`, `reason` and `next` (feature 100 annex G §G.3) and MUST never print a refusal under `[SPECSTRIDE-STATE]`.
  - test: CT-122-36
  - assumption: CQ-023 (the exit codes of commands that have no as-is equivalent)

- **F122-FR-037**: A launch in a workspace whose spec shows ticked phases for which the control plane holds no approval record MUST be refused before the detach strategy is called, and the refusal MUST name the commands `state export`, `state import` and `state adopt`. The run MUST NOT start at the first phase over ticked phases.
  - test: CT-122-37
  - divergence: DV-029

- **F122-FR-038**: While a run is alive the runtime root MUST keep the advisory marker `workspace:active` in the workspace part, with the owner record. A launch that finds a marker whose owner it cannot probe MUST be refused with `foreign-owner`. A marker whose owner is provably dead MUST NOT refuse a launch. The marker MUST decide nothing else. When the marker is missing while the run lives, the runtime root MUST write it again and an integrity event MUST be raised.
  - test: CT-122-38

- **F122-FR-039**: The CLI MUST test that it can write the control root before it writes a launch record, and the runtime root MUST test it before it takes the lock. Where either cannot write, the launch MUST be refused with a message that names the key of the control root. A control root inside the working tree MUST be accepted only under the conditions of feature 100 annex B §B.1 (F100-FR-034). The key of the control root MUST be a widening key.
  - test: CT-122-39
  - ep: EP-01 `specstride.host/1` (consumes)
  - parity: the control root that the fixture sets through the as-is variable of the state directory (alias table of annex X §X.8; row 116 of annex X §X.7)
  - status: unverified (check: the spike of F122-FR-040, cases of writability; verified-on: —; pin: host versions of the spike)

- **F122-FR-040**: Before this specification is frozen a spike MUST run on Linux and on macOS. It starts the runtime root from the host's shell tool in an interactive session and in headless mode, each with the shell sandbox off and on, and ends the session, once by an ordinary exit and once by a kill. For each of these eight cases per platform it MUST record whether the runtime root lives and its log fills afterwards, whether the host's shell tool could write the control root, and whether the detached runtime root could write the control root after the session ended. Every case MUST end as `survived`, `ended` or `skipped` with its reason, with the host version and the date. A case that cannot run MUST be a skip and never a pass.
  - test: CT-122-40
  - status: unverified (check: the spike itself; verified-on: —; pin: host versions of the spike)

- **F122-FR-041**: The results of the spike MUST bind the product as facts with a `verified-on` date and a version pin. Where the default strategy did not survive on a host, or where a case is a skip, the doctor MUST say for that host that survival of the end of a session is unverified, and the launch message of a refused launch MUST name `foreground`. No requirement of the product MUST depend on the outcome of the spike.
  - test: CT-122-41
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F122-FR-043**: At the first launch in a workspace the writer of the workspace record, which is the runtime root, or the engine in start mode `standalone`, MUST write the layout version file `workspace:layout-version` (feature 100 annex B §B.5) into the workspace part, after it took the lock and before it writes the advisory marker. The file MUST hold the layout version that the same process writes into the field `layoutVersion` of the workspace record (feature 100 annex B §B.6), MUST be written to a temporary name and renamed, and MUST have no other writer. At every later launch the same process MUST read it: a file that is missing MUST be written again; a file whose major differs from the major of the layout table of the product MUST refuse the launch as feature 100 annex B §B.4 states for a record of a different major (F100-FR-049), with the logical name, the major found and the major supported, and with a doctor finding. A workspace part that holds no layout version file MUST count as not written by the product: nothing in it MUST be read as state (F100-FR-041). The doctor MUST be able to show the layout version found and the one supported through a registered check of feature 100 annex G §G.7.
  - test: CT-122-43
  - divergence: DV-035
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

### Key Entities

| Entity | What it is | Interface contract |
|---|---|---|
| Runtime root | The one detached process of a launch; owner of the lock and writer of the lease | Feature 100 annex F §F.1 |
| Detach strategy | How the runtime root is started so that it outlives its starter | Annex F §F.6 |
| Launch record | What a launch asked for, with the launch nonce and the outcome of the handshake | Annex B §B.7 |
| Lock | The exclusion of one workspace, with its owner record | Annex F §F.5; annex B §B.9 |
| Lease | Who holds the lock now, with heartbeat, `validUntil` and the hash of the token handed down | Annex B §B.8 |
| Process registry | One entry per child process, of class `owned` or `adoptable` | Annex B §B.10 |
| Run token | A secret of the run that every process of the run holds in its environment | Annex B §B.10 (as its hash) |
| Inbox request | A request from outside the runtime tree | Annex B §B.11 |
| Advisory marker | The sign in the workspace part that a run lives | Annex B §B.2 (F100-FR-042) |
| Layout version file | The file in the workspace part that tells a workspace part of the product from an old tree of the same name | Annex B §B.2, §B.5 (F100-FR-041) |
| State archive | The movable form of the control plane of one feature | Annex B §B.19 |
| Spike result | One case of the spike with its result, host version and date | This specification |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F122-SC-001**: A run survives closing the host session and status re-attaches. After the host session ends, the runtime root lives and its log fills, and `status` in a new session shows the run, in 100 per cent of the spike's cases that ran on Linux with the strategy the doctor names for that host. macOS is `unverified` until a runner exists.
- **F122-SC-002**: One run per workspace. In the contention test, 8 contenders over 300 rounds, 300 of 300 rounds have exactly one winner, for `acquire` and for `reclaim`.
- **F122-SC-003**: A moved working tree is not silently restarted. A launch on a tree with ticked phases and no approval records is refused and names `state adopt` in 100 per cent of the test cases; after `state adopt` the run continues at the first phase without an approval record.
- **F122-SC-004**: No process is left behind. After the engine was killed by a signal, 0 processes of class `owned` live when the next engine start begins, with the runtime root alive and with it dead.
- **F122-SC-005**: No wrong process is signalled. In 100 per cent of the test cases in which pid, start time or run token do not match, 0 signals are sent.
- **F122-SC-006**: The observable codes are kept. Under the `parity` profile the oracle reports no result `different` on the scenarios `second-run-refused` and `lock-form` of FX-11; a second pipeline on a held workspace exits 24.
- **F122-SC-007**: A launch always ends. 100 per cent of launches end with exactly one of the three outcomes within the handshake limit plus the time of the launch checks, and no launch record stays without an outcome after the next launch.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| No native module; nothing compiles at install | Decision 19; ruling 23 |
| Host and runtime coordinate only through files; no pipe or socket that the host must keep | Decision 5; Principle I |
| The lock is a directory lock with liveness backed by the kernel through something the runtime platform ships; the lock code of Lisa is not reused | Ruling 23 |
| The launcher is a file with a Node shebang | Ruling 18 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, the spelling of
internal functions, and what gives the liveness that the kernel backs.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-13 | `specstride.lock/1` | implements (content owner) | The lock and liveness provider: the core side, the registry, the conformance suite, the sample provider, the one Wave 1 provider |
| EP-17 | `specstride.detach/1` | implements (content owner) | The detach strategy: the core side, the registry, the conformance suite, the sample strategy, `spawn-detached` and `foreground` |
| EP-01 | `specstride.host/1` | consumes | The host capabilities `stateRootWritable` and `background` |
| EP-14 | `specstride.doctor/1` | implements (an entry) | This feature registers its checks in the registry that feature 112 owns: the strategy in use, the lock and its holder, survivors, permissions of the control root, the layout version of the workspace part, the results of the spike |
| EP-09 | `specstride.view/1` | consumed by others | The read model takes the result of a probe of the lease as an input; this feature supplies the probe and consumes nothing of the read model |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Layering rules LR-3, LR-4, LR-5 | — | Annex A §A.2 (F100-FR-003 to F100-FR-005) |
| Common rules of extension points | — | Annex A §A.4 |
| Locations of state, rules SL-2, SL-5, SL-7; the layout version file; the advisory marker; permissions | `specstride.layout/1` | Annex B §B.1, §B.2 (F100-FR-034, F100-FR-036, F100-FR-039, F100-FR-041, F100-FR-042, F100-FR-043) |
| Identifiers (`workspaceId`, `runId`, `launchId`, `engineStartId`) | — | Annex B §B.3 |
| The `schema` field, refusal of a different major, one writer per file | — | Annex B §B.4 (F100-FR-049, F100-FR-051) |
| Logical names, among them `workspace:layout-version` | `specstride.layout/1` | Annex B §B.5 (F100-FR-053) |
| Workspace record | `specstride.layout/1` | Annex B §B.6 (F100-FR-059) |
| Launch record | `specstride.launch/1` | Annex B §B.7 (F100-FR-060) |
| Lease; owner record | `specstride.lease/1` | Annex B §B.8, §B.9 (F100-FR-061, F100-FR-062) |
| Process registry | `specstride.procs/1` | Annex B §B.10 (F100-FR-063, F100-FR-064) |
| Inbox request types | `specstride.inbox/1` | Annex B §B.11 (F100-FR-065) |
| Approval record (verified by `adopt`, `import` and at launch) | `specstride.approval/1` | Annex B §B.14 |
| Pause record (the recorded resume time) | `specstride.pause/1` | Annex B §B.17 |
| State export, import and adopt; the state archive | `specstride.state-archive/1` | Annex B §B.19, §B.20 (F100-FR-075) |
| Run-state machine (`created`, `starting`, `dead`, `launch-abandoned`); the engine when the owner is lost | `specstride.run-state/1` | Annex E §E.2 (F100-FR-141, F100-FR-142, F100-FR-147) |
| Exit codes of the engine (5) and engine start modes | — | Annex E §E.4 (F100-FR-151, F100-FR-154) |
| Process model; run requests; handshake outcomes | — | Annex F §F.1 to §F.3 (F100-FR-155 to F100-FR-161) |
| Lock and liveness provider (EP-13) | `specstride.lock/1` | Annex F §F.5 (F100-FR-164) |
| Detach strategy (EP-17) | `specstride.detach/1` | Annex F §F.6 (F100-FR-165) |
| Exit codes of the runtime root (24) | — | Annex F §F.8 |
| CLI protocol; the product lines `[SPECSTRIDE-LAUNCH]` and `[SPECSTRIDE-REFUSE]`; exit codes of `launch` and of the three state commands | protocol 1 | Annex G §G.1, §G.3 (F100-FR-178), §G.4 (F100-FR-186) |
| Doctor check registry | `specstride.doctor/1` | Annex G §G.7 |
| Host capabilities | `specstride.host/1` | Annex H §H.1 |
| Event envelope; liveness is never an event; synthesized closing events | `specstride.event/1` | Annex X §X.1 (F100-FR-200) |
| Config envelope and trust classes | `specstride.config/1` | Annex X §X.2 |
| List of closed sets, rows 17, 21, 22, 23, 24, 82, 209 to 214, 277 | — | Annex X §X.6 |
| The `parity` profile, rows 41 and 113 to 116 | `specstride.profile/1` | Annex X §X.7 |
| Layout table (old side: the two as-is locks), alias table, component-name table | `specstride.oracle-normalization/1` | Annex X §X.8 |
| Threats T-26, T-27, T-28, T-29 | — | Annex X §X.9 |

Fixture families of feature 141 used: FX-11 (scenarios `second-run-refused`, `lock-form`;
`stale-lock` and `orphaned-child` are waived by DV-022), FX-13 (scenario `resume-lock-held`, for
B-0249), FX-35 (scenario `lock-held`, for B-2588), FX-36 (scenario `gate-attach`, for B-2760;
scenario `launch`, for B-2764; the scenarios `observe-<status>`, for B-2769), FX-16 (scenario
`long-job-running`, beside FX-11, for B-0061) and FX-12 (scenario `stop-with-no-run`, for the
characterization test of the inbox). FX-11 runs the Specstride reference and executes no line of
mixture-of-loops, so it proves none of the four items of mixture-of-loops.

## Rows of the `parity` profile

Stated as F100-FR-212 asks. Feature 110 owns the spelling of every key; the spellings below are
confirmed, with their final rows of annex X §X.7.

| Switch or option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Executable of the engine | `engine.executable` | The product's own entry | Set by the oracle to its engine stub where a fixture needs one | 41 | — |
| Detach strategy | `runtime.detach.strategy` | `spawn-detached` | `spawn-detached` | 113 | DV-074 |
| Handshake limit | `runtime.handshake.timeoutSec` | 30 | default; not observable | 114 | — |
| Heartbeat interval of the lease | `runtime.lease.heartbeatSec` | 10 | default; not observable | 114 | — |
| Grace of the lease | `runtime.lease.graceSec` | 30 | default; not observable | 114 | — |
| Lock and liveness provider | `runtime.lock.provider` | The shipped provider | The shipped provider | 115 | DV-022 |
| Control root | `state.dir` | The user's state directory, keyed by the workspace identity | Set by the fixture through the as-is variable of the state directory | 116 | DV-006 |

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 122.

| Closed set | Members | Closed by | Unknown value | Row of annex X §X.6 |
|---|---|---|---|---|
| Handshake outcomes | `started`, `attached`, `refused` | Design | `refused` | 17 |
| Inbox request types | `stop`, `hold-relaunch`, `host-event` | Design | The request is ignored and reported | 21 |
| Classes of the process registry | `owned`, `adoptable` | Design | Class `owned`; the entry is never signalled without the identity check | 22 |
| Kinds of process | `engine`, `stage-child`, `harness-pass`, `critic-call`, `check`, `detached-job`, `worker-pass` | Design | As row 22 | 22 |
| Results of a lock probe | `free`, `held-live`, `held-foreign`, `stale-owner-dead`, `owner-dead-group-alive`, `unknown` | Design | `unknown`, which counts as held | 23 |
| Reasons of a launch | `first`, `resume`, `relaunch`, `manual` | Design | `manual` | 82 |
| Results of `reclaim` | a lease, `lost-race` | Design | `lost-race` | 209 |
| Errors of a detach strategy | `unavailable`, `not-ready` | Design | `not-ready`; the launch is refused | 210 |
| What a detach strategy survives | `parent-end`, `session-end`, `reboot` | Design | Ignored; the strategy is shown as surviving nothing more | 211 |
| Refusals of a launch that this feature writes | `lock-conflict`, `foreign-owner`, `owner-dead-group-alive`, `lock-unknown`, `provider-mismatch`, `detach-unavailable`, `detach-not-ready`, `control-root-not-writable`, `unadopted-approvals`, `launch-abandoned`, `control-root-unsafe` | Design | Shown as text; the launch stays refused | 212 |
| End causes of a registry entry that this feature writes | `exited`, `signalled`, `ended-by-stop`, `ended-by-root`, `ended-as-survivor`, `identity-mismatch`, `gone` | Design | Shown as text | 213 |
| Results of a case of the spike | `survived`, `ended`, `skipped` | Design | `skipped` | 214 |

Open sets: detach strategies (row 24; Wave 1: `spawn-detached`, `foreground`; an unknown id is a
configuration error) and lock and liveness providers (row 277; Wave 1: one; an unknown id is a
configuration error).

## As-is behaviour not carried

Rows of the traceability files that are assigned to feature 122 with the disposition
`superseded-by`. The owner approved each (ruling K8).

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-0163 (C-011) | Without the as-is lock tool the lock is a directory made in the state directory; failure to make it exits 5 | DV-022 |
| B-0164 (C-011) | Under that fallback the owner line is written to a file inside the directory | DV-022 |
| B-0251 (C-013) | The fallback is released by removing the directory, which fails because the owner file is still in it, so the lock stays behind (defect D-06, policy "fix", ruling K7) | DV-022 |

Not carried and not assigned to this feature as a row: the lock of Lisa, whose reclaim let
several contenders win in 297 of 300 rounds (defect D-51, policy "drop", DV-022).

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 FR-004 | translated | F122-FR-011 | PT-122-028FR004-second-run-refused |
| C-007: B-0061 | translated | F122-FR-017 | PT-122-C-007-job-does-not-hold-lock |
| C-009: B-0119 | ported | F122-FR-011 | PT-122-C-009-exit-5 |
| C-011: B-0161, B-0162 | translated | F122-FR-014 | PT-122-C-011-lock-form |
| C-012: B-0192 | translated | F122-FR-011 | PT-122-C-012-lost-lock-line |
| C-013: B-0249 | ported | F122-FR-012 | PT-122-C-013-lost-lock-leaves-no-trace |
| C-113: B-1509, B-1510 | translated | F122-FR-013 | PT-122-C-113-owner-line |
| C-115: B-1565 | ported | F122-FR-013 | PT-122-C-115-lock-held |
| C-229: B-2588 | translated | F122-FR-014 | PT-122-C-229-pipeline-lock (FX-35) |
| C-255: B-2760 | translated | F122-FR-013 | PT-122-C-255-run-directory-free (FX-36, `gate-attach`) |
| C-255: B-2764 | ported | F122-FR-001 | PT-122-C-255-detached-start (FX-36, `launch`) |
| C-255: B-2769 | ported | F122-FR-042 | PT-122-C-255-process-alive (FX-36, `observe-<status>`) |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: How many rows does the divergence register have, given that the brief says 85? → A: More than 85; the register of `consolidation.md` section 6 is the count, and it grows while the features are repaired, so no number is written here. This feature cites DV-006, DV-022, DV-027, DV-029, DV-066 and DV-074, and since 2026-09-30 DV-035 (F122-FR-043), and needs no new row. (Source: `consolidation.md` section 6)
- Q: Where is the detach strategy in use recorded, given that the brief says "in the run record and the doctor" and the run record of feature 100 has no such field? → A: In the launch record, field `detachStrategy`, and in the doctor's output, as feature 100 annex F §F.6 says. Reported to the orchestrator. Integrated in F122-FR-003. (Source: feature 100 annex B §B.7, annex E §E.2, annex F §F.6)
- Q: What does a second `launch` on a live run end with, a refusal or `attached`? → A: `attached`, exit 4, also for the loser of two launches that race. Integrated in F122-FR-006. (Source: R15v D-3; feature 100 annex F §F.3)
- Q: Does a lock that cannot be read count as free, as at the mixture-of-loops baseline, or as held? → A: As held (`unknown`). Only an absent lock is free. The difference is covered by DV-022. Integrated in F122-FR-013. (Source: feature 100 annex F §F.5; R2v risk 5; B-2760)
- Q: Which processes does the search for holders of the run token end at an engine start or a `resume`, given that a detached job holds the run token as well? → A: Every holder except a live entry of class `adoptable`, which is adopted. Integrated in F122-FR-027 and F122-FR-028. (Source: R29v PU-90; R15v P-2; `architecture.md` section 4, "Process registry")
- Q: Does `stop --now` end the detached job of a yield? → A: No. It ends `owned` processes only; a job is ended by the separate, explicit request `jobs` of a stop request. R15 A-7.3 said otherwise and is amended by R15v C-6 and P-2. Integrated in F122-FR-028. (Source: `architecture.md` section 4; feature 100 annex B §B.10, F100-FR-064)
- Q: In which states of a run is the lock held, and in which is it released? → A: Held in `starting` (being taken), `running`, `paused-quota`, `relaunching` and `stopping`; released in `blocked-on-human`, `finished`, `stopped` and `failed`. Integrated in F122-FR-020. (Source: feature 100 annex E §E.2, table of states; `APPROVAL.md` rulings 28 and 29)
- Q: The runtime root died and the engine still lives. May `resume` reclaim the lock? → A: Not while the engine lives: the probe says `owner-dead-group-alive` and the start is refused with the engine named. The engine ends at its next boundary, and then the lock is reclaimable. Integrated under "Edge Cases". (Source: R15v D-1, P-3; R2v risk 3; feature 100 F100-FR-147, F100-FR-158)
- Q: Does `state adopt` serve a cloned tree, where the old tree still exists? → A: No. `adopt` moves the state and is for a moved or renamed tree; it refuses while a working tree exists at the old path. A clone is served by `state export` and `state import`. Integrated in F122-FR-035. (Source: R15v D-7, P-14; feature 100 annex B §B.19 and F100-FR-032, "no mutable file is shared between two workspaces")
- Q: Which fixture family proves B-0249, FX-11 or FX-13? → A: FX-13, as `traceability-items.tsv` says; the test uses the scenario `resume-lock-held` and may use `second-run-refused` of FX-11 as well. (Source: `traceability-items.tsv`; feature 141 §O.2)

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or
reused.

| Requirement or place | Item | What changed |
|---|---|---|
| F122-FR-005 | W-122-01 | The line of `launch` is named: `[SPECSTRIDE-LAUNCH]` with the keys `run`, `state`; a refused launch prints `[SPECSTRIDE-REFUSE]` |
| F122-FR-036 | W-122-01; W-123-02 | The line of a state command that succeeds is `[SPECSTRIDE-STATE]`, which stays the label of this feature; a refusal is printed under `[SPECSTRIDE-REFUSE]` |
| F122-FR-030; User Story 5 | W-X-06 | "the next run" became "the next engine start" (ruling 24) |
| F122-FR-003, F122-FR-041; table "Extension points" | W-X-19 | EP-14: `consumes` became `implements (an entry)` |
| F122-FR-043 (new) | W-X-25 | The runtime root writes `workspace:layout-version` at the first launch and reads it at every later one (F100-FR-041). Test CT-122-43 |
| Clarifications, first answer | W-X-05 | The count of 97 register rows was removed; the register is named without a count |
| Table "Closed sets" | W-X-07 | The six sets marked "new" have the rows 209 to 214 of annex X §X.6 |
| Table "Contracts of feature 100 used" | W-X-11 | The rows of the `parity` profile are 41 and 113 to 116; row 14 belongs to feature 123 and was cited in error |
| "Fixture families", "Assumptions", table of as-is ids | Follow-up of feature 141, section 2.4 | FX-35 for B-2588; FX-36 for B-2760 (`gate-attach`), B-2764 and B-2769; FX-11 is no longer cited for these four items |
| "Closed sets", open sets; `contracts/closed-sets.json` | Re-check B-8.7, pass-on (2026-09-30) | The open registry of lock and liveness providers cites row 277 of annex X §X.6 (`"row": null` became 277); no requirement changed |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection (feature 111) and compatibility output (features 119 and 123) exist when the parity tests of this feature run.
- The traceability files name FX-36 for B-2760, B-2764 and B-2769 and FX-35 for B-2588, after the follow-up of feature 141 (`specs/141-parity-oracle/followup-report.md`, section 2.4). The parity tests of F122-FR-001, F122-FR-013, F122-FR-014 and F122-FR-042 cite these families. The follow-up read the evidence lines; the exercise map of feature 141 has not run and confirms the assignment when it does.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-138 | The defaults of the handshake limit, of the heartbeat interval and of the grace of the lease. The sources say "a bounded time", "a fixed interval" and "heartbeat plus grace" and give no value | 30 seconds, 10 seconds and 30 seconds, as starting values that configuration can change | F122-FR-005, F122-FR-014 |
| CQ-139 | What signs the archive of `state export`, and whether the key that signed the approval records travels with it. Without the key an imported approval record cannot be verified on another machine; with it, whoever holds the archive can sign approvals | The archive holds the approval key and the ledger key of the feature and is signed with the approval key; it is private to its owner, and neither `export` nor `import` accepts a location inside the working tree, which is the proposer's write scope | F122-FR-033, F122-FR-034 |
| CQ-140 | How a consumer frees a lock that is `held-foreign` or `unknown` and will never be released, for example after a container was removed. R2v names "a manual unlock command"; the CLI protocol of feature 100 has none | No command in this specification. The refusal and the doctor finding name the lock by logical name and its holder. A command `state unlock` is proposed to feature 100 | F122-FR-016 |
| CQ-023 | The exit codes of commands that have no as-is equivalent (raised by feature 100) | 0, 1, 3, 5 as in feature 100 annex G §G.4 | F122-FR-036 |

## Owner ruling of 2026-09-30: where the process primitive lives

The package graph of feature 100 gives the process primitive of the kernel (F100-FR-234) to this feature, and eight plans (102, 109, 116, 117, 118, 123, 125, 146) import it from `@specstride/kernel`, but no task built it there: the process code of this feature lived only in `packages/runtime/src/procs/`. The owner ruled that the primitive lives in the kernel and that this feature builds it. `tasks.md` gains T075 (the primitive in `packages/kernel/src/proc/`) and T076 (its unit tests) in phase 3; T010, T040 and T055 now call it; `plan.md` names the directory. The registry, the identity check, survivors and adoption stay in `packages/runtime`. No requirement of this feature changed.

