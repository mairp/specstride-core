# Tasks: Detached runtime (feature 122)

**Input**: Design documents from `specs/122-detached-runtime/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: required for every feature (`STAGE-B-RULES.md` section 3). Parity tests and
characterization tests are required tasks. A test task names what it proves.

**Organization**: by user story. The spike (User Story 6) comes first, before anything else, as
the brief and `architecture.md` section 4 ask. Paths follow plan.md, "Project Structure".

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of spec.md (US1 to US6)

---

## Phase 1: The spike (User Story 6, Priority P1) — comes first

**Goal**: settle whether a process started from the host's shell tool survives the end of the
session, and whether the control root can be written.

**Independent Test**: sixteen cases, each with a recorded result; a case that cannot run is a
skip with its reason.

- [x] T001 [US6] Write the spike driver and the stand-in for the runtime root in spikes/122-detach/run.js and spikes/122-detach/root-stand-in.js, from the cases of specs/122-detached-runtime/contracts/spike-cases.json (research D-14); the stand-in writes one line per second to its log and tries to write a file in the control root
  - proves: F122-FR-040
- [x] T002 [US6] Run the eight Linux cases of the spike on a live host and store one result per case in spikes/122-detach/results/linux-*.json. **Paid**: a headless case and every case that needs a model turn of the host costs money; log date, host version and cost in spikes/122-detach/results/LOG.md. Not run by a specification agent. An agent of an unattended run starts no paid case of T002 or T003 either: a case that the owner has not run stays `skipped` with the reason "not run" (T001, T004), the task is complete for that run with those results, and the run that the owner owes is reported to the orchestrator
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F122-FR-040; F122-SC-001
- [x] T003 [US6] Run the eight macOS cases of the spike, or record each as `skipped` with the reason "no macOS machine", in spikes/122-detach/results/macos-*.json. **Paid** as T002; logged in the same file
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F122-FR-040
- [x] T004 [US6] Characterization test CT-122-40 in packages/runtime/test/characterization/spike-results.test.ts: every case of contracts/spike-cases.json has a result file that validates; a skip has a reason; no result without host version and date
  - proves: F122-FR-040
  - note: the test does not wait for T002 or T003. For a case that was not run, the driver of T001 writes a result `skipped` with the reason "not run", and the test passes on it
- [x] T005 [US6] Write the facts of the spike, each with `verified-on` and version pin, into packages/runtime/src/doctor/spike-facts.json, and report to the orchestrator any case that ended as `ended`, so that spec.md is confirmed or amended before it is frozen

**Checkpoint**: the results of the spike exist. The specification is confirmed or amended.

---

## Phase 2: Setup

- [x] T006 Create the directories of plan.md in packages/runtime/src/ (root, detach, lock, lease, procs, inbox, state, doctor) and packages/runtime/test/ (unit, characterization, contention, crash), with the package manifest packages/runtime/package.json that has no dependency outside the workspace
- [x] T007 [P] Copy the data of specs/122-detached-runtime/contracts/ (closed-sets.json, parity-rows.json, probe-decision-table.json) into packages/runtime/src/data/ and add a test packages/runtime/test/unit/data-sync.test.ts that fails when a copy differs from its source
- [x] T008 [P] Add the test helpers in packages/runtime/test/helpers/: stub-process.ts (a process that holds a given environment and sleeps), scratch-control-root.ts (an empty control root per test), kill.ts (end a process without warning)

---

## Phase 3: Foundational (blocks every user story)

- [x] T009 Measure the path length limit of a local stream socket on Linux and on macOS with packages/runtime/test/characterization/socket-path-limit.test.ts and record the values in specs/122-detached-runtime/research.md under D-3; macOS is a skip with its reason where no machine exists
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F122-FR-021
- [x] T075 Implement the process primitive of the kernel (F100-FR-234; owner ruling of 2026-09-30: the primitive lives in `@specstride/kernel`, built by this feature) in packages/kernel/src/proc/: `start` (a process in a group and a session of its own, standard input closed, standard output and standard error to the two files the caller names), `startDetached` (the same, detached, with a status record: the kernel starts a waiter of its own in the new session, with no shell, which starts the command, waits for its end and writes exit code or signal, duration and the times of start and end with the atomic write of the kernel to the file the caller names), `signalGroup` (polite, terminate, kill), `startTimeOf` (the start time of a process), `findByRunToken` (search the process table of the user for a run token), `waitForEnd`, and a clock; export them from the index of `@specstride/kernel`. The kernel holds no run policy: the registry, the identity check, survivors and adoption stay in packages/runtime/src/procs/ and call the primitive
  - covers: F100-FR-234
  - reads: annex A of feature 100, F100-FR-234; research D-6, D-7, D-8; the kernel package as feature 100 left it (its index and `atomic-write/`)
- [x] T076 [P] Unit tests packages/kernel/test/proc.test.ts for T075, with a stub child: the group and the session are new, standard input is closed, the two outputs land in the named files; the status record of `startDetached` exists after the starter has ended and carries exit code, signal, duration, start and end; `signalGroup` reaches every member of the group; `findByRunToken` finds a child by its token; macOS is a skip with its reason where no machine exists
  - proves: F100-FR-234
- [x] T010 Implement the platform readers in packages/runtime/src/procs/platform.ts, reading the start time of a process and the list of processes of the user through the kernel primitive of T075 (`startTimeOf`, `findByRunToken`) and not on their own: start time of a process, boot identity, host name, identity of the pid namespace, environment of a process of the same user, the list of processes of the user (research D-6, D-8), and whether a recorded process lives as F122-FR-042 states it (alive where the asker may not signal it, not alive where it has exited and was not yet collected, alive where a reuse of the process id cannot be told); Linux and macOS branches, macOS marked `unverified`
- [x] T011 [P] Unit test packages/runtime/test/unit/platform.test.ts for T010 with recorded outputs of `ps` and of the process file system as fixtures
  - proves: F122-FR-025; F122-FR-013
- [x] T012 [P] Implement the owner record (build, validate against the schema of feature 100, compare with the present process) in packages/runtime/src/lock/owner-record.ts
- [x] T013 [P] Implement the run token and the lease token (mint, hash, place in an environment) in packages/runtime/src/procs/run-token.ts
- [x] T014 Implement the registries of EP-13 and EP-17 (register, resolve by id, refuse an unknown id with a configuration error, read-only after launch) in packages/runtime/src/lock/registry.ts and packages/runtime/src/detach/registry.ts
- [x] T015 Implement the writability test and the owner-only check of the control root in packages/runtime/src/root/control-root.ts (research D-13; the key of the control root is `state.dir`, as F122-FR-039 and row 116 of the `parity` profile state), and register the doctor check of the permissions of the control root (F122-FR-022) in packages/runtime/src/doctor/control-root-checks.ts
- [x] T016 [P] Characterization tests CT-122-22 and CT-122-39 in packages/runtime/test/characterization/control-root.test.ts: a control root that another user can write is refused with `control-root-unsafe` (launch exit 4, state command exit 3) and a doctor finding; a control root that cannot be written refuses the launch with `control-root-not-writable` and names the key
  - proves: F122-FR-022; F122-FR-039

**Checkpoint**: platform readers, registries and tokens exist.

---

## Phase 4: User Story 2 - One run per workspace (Priority: P1)

**Goal**: one lock per workspace with liveness backed by the kernel, atomic reclaim, and the
as-is codes 5 and 24.

**Independent Test**: the contention test (300 of 300 rounds with one winner) and FX-11.

### Tests for User Story 2

- [x] T017 [P] [US2] Conformance suite of EP-13 in packages/testkit/src/conformance/EP-13/suite.ts: one winner per round; the owner killed without warning; the owner dead with a live child; a reused pid after a changed boot identity; a foreign host name; with the sample provider in memory in packages/testkit/src/samples/EP-13/memory-provider.ts (CT-122-10)
  - proves: F122-FR-010; F122-FR-013; F122-FR-016; F122-FR-017
- [x] T018 [P] [US2] Contention test CT-122-15 in packages/runtime/test/contention/acquire-reclaim.test.ts: 8 contenders, 300 rounds, for `acquire` on a free lock and for `reclaim` on a stale lock; exactly one winner per round; every loser gets a conflict that names the holder, or `lost-race`
  - proves: F122-FR-011; F122-FR-015; F122-SC-002
- [x] T019 [P] [US2] Parity test PT-122-028FR004-second-run-refused in tests/parity/122/second-run-refused.test.ts
  - proves: 028 FR-004; F122-FR-011; F122-SC-006
  - fixture: FX-11/second-run-refused
  - surfaces: exit, stderr, state
- [x] T020 [P] [US2] Parity test PT-122-C-009-exit-5 in tests/parity/122/exit-5.test.ts
  - proves: C-009; B-0119
  - fixture: FX-11/second-run-refused
  - surfaces: exit
- [x] T021 [P] [US2] Parity test PT-122-C-012-lost-lock-line in tests/parity/122/lost-lock-line.test.ts: the as-is line on standard error, compared through N-15 and N-02
  - proves: C-012; B-0192
  - fixture: FX-11/second-run-refused
  - surfaces: stderr
- [x] T022 [P] [US2] Parity test PT-122-C-013-lost-lock-leaves-no-trace in tests/parity/122/lost-lock-leaves-no-trace.test.ts: event file, engine log and run snapshot of the live run are unchanged after a refused start
  - proves: C-013; B-0249; F122-FR-012
  - fixture: FX-13/resume-lock-held, FX-11/second-run-refused
  - surfaces: state, events
- [x] T023 [P] [US2] Parity test PT-122-C-011-lock-form in tests/parity/122/lock-form.test.ts: the lock by logical name, its owner line, held for the life of the owner
  - proves: C-011; B-0161; B-0162; F122-SC-006
  - fixture: FX-11/lock-form
  - surfaces: state
- [x] T024 [P] [US2] Parity test PT-122-C-115-lock-held and PT-122-C-113-owner-line in tests/parity/122/lock-held.test.ts: a reader sees the run as active while the lock is held, and compatibility output shows the owner line
  - proves: C-115; B-1565; C-113; B-1509; B-1510
  - fixture: FX-11/lock-form, FX-11/second-run-refused
  - surfaces: stdout, state
- [x] T025 [P] [US2] Parity test PT-122-C-229-pipeline-lock and PT-122-C-255-run-directory-free in tests/parity/122/pipeline-lock.test.ts: the lock of a pipeline run is held for the life of the runtime root; the question "could a launcher take the lock now" is answered without changing anything. B-2588 is proven on FX-35/lock-held; B-2760 is the launch check of the supervisor and is proven on FX-36/gate-attach (follow-up of feature 141, section 2.4)
  - proves: C-229; B-2588; C-255; B-2760; F122-SC-006
  - fixture: FX-35/lock-held@engine-stub, FX-36/gate-attach@engine-stub
  - surfaces: exit, state, pipeline
- [x] T026 [P] [US2] Parity test PT-122-C-007-job-does-not-hold-lock in tests/parity/122/job-does-not-hold-lock.test.ts: with a detached job alive after the end of the run, the lock is free on both sides
  - proves: C-007; B-0061
  - fixture: FX-11/lock-form, FX-16/long-job-running
  - surfaces: state, processes
- [x] T027 [P] [US2] Characterization tests CT-122-16, CT-122-19, CT-122-20, CT-122-21 in packages/runtime/test/characterization/lock-rules.test.ts: a foreign or unknown lock is never reclaimed and the refusal names the holder; a different provider refuses; after a release the probe says `free` and the marker is gone, in every resting state; an endpoint that cannot be created gives `unknown`
  - proves: F122-FR-016; F122-FR-019; F122-FR-020; F122-FR-021

### Implementation for User Story 2

- [x] T028 [US2] Implement `acquire` and `release` of the shipped provider (temporary directory with the owner record, renamed into place) in packages/runtime/src/lock/directory-lock.ts (research D-1)
- [x] T029 [US2] Implement the liveness endpoint (listen, accept and close, short path, owner-only) in packages/runtime/src/lock/liveness.ts (research D-2, D-3)
- [x] T030 [US2] Implement `probe` from the decision table packages/runtime/src/data/probe-decision-table.json in packages/runtime/src/lock/probe.ts (research D-5)
- [x] T031 [US2] Implement `reclaim` by one atomic rename in packages/runtime/src/lock/reclaim.ts (research D-4)
- [x] T032 [US2] Record the provider in the workspace record and refuse a different one, and derive the workspace identity from the real path, in packages/runtime/src/lock/workspace-record.ts
- [x] T033 [US2] Wire the conflict of `acquire` to engine exit 5 with the as-is line in compatibility output (start mode `standalone`) and to pipeline code 24 (runtime root), acquiring before anything of the run is written, in packages/runtime/src/root/start.ts
- [x] T034 [US2] Register the doctor checks of the lock (holder, result of the probe, a lock without a live holder, the provider, the cause where the liveness endpoint cannot be created) in packages/runtime/src/doctor/lock-checks.ts

**Checkpoint**: one run per workspace holds; FX-11 compares.

---

## Phase 5: User Story 1 - A run outlives the host session (Priority: P1)

**Goal**: the runtime root starts detached, the handshake confirms it, and readers re-attach by
reading.

**Independent Test**: the conformance suite of EP-17 and the handshake tests.

### Tests for User Story 1

- [x] T035 [P] [US1] Conformance suite of EP-17 in packages/testkit/src/conformance/EP-17/suite.ts: start; end the parent; the child lives and the lease is valid; the same with the parent killed by a signal; with the sample strategy in packages/testkit/src/samples/EP-17/sample-strategy.ts (CT-122-2, CT-122-3)
  - proves: F122-FR-001; F122-FR-002; F122-FR-003
- [x] T036 [P] [US1] Parity test PT-122-C-255-detached-start in tests/parity/122/detached-start.test.ts: standard input closed, output appended to the launch log, a process session of its own, the launch record of the supervisor
  - proves: C-255; B-2764
  - fixture: FX-36/launch@engine-stub
  - surfaces: pipeline, processes
- [x] T037 [P] [US1] Parity test PT-122-C-255-process-alive in tests/parity/122/process-alive.test.ts: a recorded launcher process reads as alive or not as at the baseline
  - proves: C-255; B-2769; F122-FR-042
  - fixture: FX-36/observe-<status>@engine-stub
  - surfaces: exit, stdout, pipeline
- [x] T038 [P] [US1] Characterization tests CT-122-4, CT-122-5, CT-122-6, CT-122-7, CT-122-8, CT-122-9 in packages/runtime/test/characterization/handshake.test.ts: the launch record exists before the strategy is called; `started` exit 0; a strategy failure and a missing lease give `refused`, exit 4, with `foreground` named; two racing launches give one `started` and one `attached`; an abandoned record is derived and then closed by the next launch; no reader opens a channel; `run --detach` uses the same path
  - proves: F122-FR-004; F122-FR-005; F122-FR-006; F122-FR-007; F122-FR-008; F122-FR-009; F122-SC-007
- [x] T039 [P] [US1] Characterization tests CT-122-31 and CT-122-32 in packages/runtime/test/crash/root-dies.test.ts: after the root was killed nothing restarts, readers derive `dead`, the next launch reclaims and writes the synthesized closing event first; after a gap in heartbeats the owner is not read as dead and waits are recomputed from recorded times
  - proves: F122-FR-031; F122-FR-032; F122-FR-014

### Implementation for User Story 1

- [x] T040 [US1] Implement the strategy `spawn-detached` in packages/runtime/src/detach/spawn-detached.ts on top of `startDetached` of the kernel primitive (T075) (research D-7): detached start without a shell, null device on standard input, the runtime log on both outputs, the environment allow-list, the run token and the launch id in the environment
- [x] T041 [P] [US1] Implement the strategy `foreground` in packages/runtime/src/detach/foreground.ts: print the command line of the runtime entry and wait for the handshake
- [x] T042 [US1] Implement the lease (write with the launch nonce, heartbeat at the interval, `validUntil`, heartbeat at once after a gap) in packages/runtime/src/lease/lease.ts
- [x] T043 [US1] Implement `handDown` and `verify` in packages/runtime/src/lease/hand-down.ts; `verify` answers "no" when the provider fails
- [x] T044 [P] [US1] Characterization test CT-122-18 in packages/runtime/test/characterization/hand-down.test.ts: an engine in start mode `child` takes no lock; `verify` fails after the root was killed
  - proves: F122-FR-018
- [x] T045 [US1] Implement steps 1, 2 and 4 of the handshake (launch record, call of the strategy, bounded wait, outcome, one line, exit code, closing of an abandoned record) in packages/cli/src/commands/launch-handshake.ts, for a run request of kind `pipeline` and of kind `engine` (`run --detach`) alike and with a refusal of a run request of another kind (F122-FR-009), with the refusals of specs/122-detached-runtime/contracts/cli-state-commands.md
- [x] T046 [US1] Implement step 3 of the handshake and the end of the root (lock, lease, event of the launch, synthesized closing event for a dead predecessor, release and removal of the marker on every exit path) in packages/runtime/src/root/start.ts and packages/runtime/src/root/end.ts
- [x] T047 [US1] Register the doctor checks of the detach strategy (id, what it survives, the facts of the spike for this host) in packages/runtime/src/doctor/detach-checks.ts
- [x] T048 [P] [US1] Characterization test CT-122-41 in packages/runtime/test/characterization/doctor-detach.test.ts: on a host without a fact of the spike the doctor says that survival is unverified
  - proves: F122-FR-041

**Checkpoint**: a run starts detached and is found again by reading.

---

## Phase 6: User Story 3 - No process left behind, none ended by mistake (Priority: P1)

**Goal**: the process registry, the identity check, the end of `owned` processes, survivors, adoption.

**Independent Test**: the crash tests and the planted-entry test.

### Tests for User Story 3

- [x] T049 [P] [US3] Characterization tests CT-122-101, CT-122-102, CT-122-103, CT-122-104 of the stop primitives extracted from Lisa (`packages/scheduler/src/stop.ts`, `stop-now.ts` at `363e6a3`) in tests/characterization/122/lisa-stop-primitives.test.ts: the stop request is written and removed after a clean halt; a forced stop signals the recorded group; children are found; the run stays resumable. Written against the extracted source before it is changed
  - proves: F122-FR-025
- [x] T050 [P] [US3] Characterization tests CT-122-23, CT-122-24, CT-122-25 in packages/runtime/test/characterization/registry.test.ts: one entry per child, written before the child works; the entry of the engine is of class `owned`; the worker id in the entry of a worker pass; the run token in the environment of every child and only its hash in records; a planted entry gets 0 signals and the end cause `identity-mismatch`
  - proves: F122-FR-023; F122-FR-024; F122-FR-025; F122-SC-005
- [x] T051 [P] [US3] Crash tests CT-122-26 and CT-122-27 in packages/runtime/test/crash/engine-killed.test.ts: the engine killed by a signal while a stub harness process lives, the root ends the process before it relaunches; the same with the root gone, the survivor is reported and `resume` ends it; with four worker entries all four are ended
  - proves: F122-FR-026; F122-FR-027; F122-SC-004
- [x] T052 [P] [US3] Characterization test CT-122-28 in packages/runtime/test/characterization/adoptable.test.ts: a detached job survives a stop, `stop --now` and the end of the root; the next engine start adopts it or closes its entry as `gone`; only a stop request with `jobs` ends it
  - proves: F122-FR-028

### Implementation for User Story 3

- [x] T053 [US3] Implement the process registry (open, close, one file per writer, read of open entries) in packages/runtime/src/procs/registry.ts
- [x] T054 [US3] Implement the identity check and the guarded signal in packages/runtime/src/procs/identity.ts
- [x] T055 [US3] Extract the stop primitives of Lisa into packages/runtime/src/procs/stop-primitives.ts, put them under the identity check, and add the walk of children on macOS; the signal itself goes through `signalGroup` of the kernel primitive (T075)
- [x] T056 [US3] Implement the end of every `owned` process when the engine exits in packages/runtime/src/root/end-owned.ts
- [x] T057 [US3] Implement the search for survivors and the adoption of `adoptable` entries in packages/runtime/src/procs/survivors.ts and packages/runtime/src/procs/adopt.ts
- [x] T058 [US3] Register the doctor check that reports survivors in packages/runtime/src/doctor/survivor-checks.ts, and the checks that probe the platform tools `ps` and, on macOS, `sysctl` (plan.md, "Primary Dependencies") in packages/runtime/src/doctor/platform-checks.ts

**Checkpoint**: no orphan, no wrong signal.

---

## Phase 7: User Story 5 - A request from outside reaches the run (Priority: P2)

- [x] T059 [P] [US5] Characterization tests CT-122-29 and CT-122-30 in packages/runtime/test/characterization/inbox.test.ts: each of the three types; an unknown type and a malformed request are ignored and reported; a request in the workspace part is not read; a stop request written with no run active stops the next engine start at its first boundary; an empty stop request is valid; the honoured request is removed
  - proves: F122-FR-029; F122-FR-030
  - fixture: FX-12/stop-with-no-run
- [x] T060 [US5] Implement the inbox (atomic write for the CLI, validation, reading at boundaries, removal when honoured) in packages/runtime/src/inbox/inbox.ts

---

## Phase 8: User Story 4 - A moved working tree keeps its approvals (Priority: P2)

### Tests for User Story 4

- [x] T061 [P] [US4] Characterization tests CT-122-33, CT-122-34, CT-122-35, CT-122-36 in packages/runtime/test/characterization/state-commands.test.ts: export writes a signed, owner-only archive and refuses a location in the working tree; import refuses a changed archive and a target with records, with exit 1 and nothing written; adopt moves the state, verifies every approval record and refuses while a tree exists at the old path; each command exits 5 while a run is alive
  - proves: F122-FR-033; F122-FR-034; F122-FR-035; F122-FR-036
- [x] T062 [P] [US4] Characterization tests CT-122-37 and CT-122-38 in packages/runtime/test/characterization/moved-tree.test.ts: a launch over ticked phases without approval records is refused and names the three commands; after `state adopt` the run continues at the first phase without a record; a marker with an owner that cannot be probed refuses with `foreign-owner`; a removed marker is written again and an integrity event is raised
  - proves: F122-FR-037; F122-FR-038; F122-SC-003

### Implementation for User Story 4

- [x] T063 [US4] Implement the archive (manifest, members, signature, compression) in packages/runtime/src/state/archive.ts, from specs/122-detached-runtime/contracts/state-archive.schema.json (research D-11)
- [x] T064 [US4] Implement `state export`, `state import` and `state adopt` in packages/runtime/src/state/commands.ts and packages/cli/src/commands/state.ts, with the lines and exit codes of specs/122-detached-runtime/contracts/cli-state-commands.md
- [x] T065 [US4] Implement the launch refusal `unadopted-approvals` in packages/cli/src/commands/launch-handshake.ts, reading the ticked phases through the canonical spec model
- [x] T066 [US4] Implement the advisory marker (write, check at launch, rewrite at a heartbeat, integrity event) in packages/runtime/src/root/marker.ts

---

## Phase 9: Polish & cross-cutting

- [x] T067 [P] Test packages/runtime/test/unit/closed-sets.test.ts: every closed set of contracts/closed-sets.json has a branch for an unknown value in its reader
  - proves: F122-FR-013; F122-FR-029
- [x] T068 [P] Test packages/runtime/test/unit/parity-rows.test.ts: every option of this feature has its value under the `parity` profile, and the profile of feature 100 holds a row for it
  - proves: F122-FR-002; F122-FR-005; F122-FR-014; F122-FR-019; F122-FR-039
- [x] T069 [P] Byte measurement in packages/cli/test/budget/launch-state-lines.test.ts: every line of `launch` and of the state commands is under 200 bytes
- [x] T070 Run the scenarios of specs/122-detached-runtime/quickstart.md and record what stays `unverified`; record beside it the measured times of `probe`, of `acquire`, of the contention test and of a launch against the starting values of plan.md, "Performance Goals"
- [x] T071 Run the whole suite on a macOS runner when one exists, and replace each `unverified` status of specs/122-detached-runtime/spec.md by a `verified-on` date and a version pin; where no macOS runner exists the task is a skip with that reason, and every status stays `unverified` (Principle XVII)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

### Added after the cross-feature review (2026-09-30)

T072 and T073 belong to User Story 1 and depend on phase 4 (the lock) and on T046 (`root/start.ts`). T072 comes before T073. T074 belongs to User Stories 1 and 4 and depends on T045 and T064.

- [x] T072 [P] [US1] Characterization test CT-122-43 in packages/runtime/test/characterization/layout-version.test.ts: the first launch writes `workspace:layout-version` after the lock and before the marker, with the value of `layoutVersion` of the workspace record, by a temporary name and a rename; a later launch writes a missing file again; a file with another major refuses the launch with the logical name, the major found and the major supported, and with a doctor finding; a workspace part without the file is not read as state
  - proves: F122-FR-043
- [x] T073 [US1] Implement the layout version file (write at the first launch, read at every later one, refusal of another major) in packages/runtime/src/root/layout-version.ts, called from packages/runtime/src/root/start.ts, and register the doctor check in packages/runtime/src/doctor/layout-checks.ts
- [x] T074 [P] [US1] Characterization tests of the lines in packages/cli/test/characterization/launch-state-lines.test.ts, as part of CT-122-5 and CT-122-36: `launch` prints `[SPECSTRIDE-LAUNCH]` with `run` and `state`; every refusal of `launch` and of a state command prints `[SPECSTRIDE-REFUSE]` with `action`, `reason`, `next`; `[SPECSTRIDE-STATE]` is printed only by a state command that succeeded; nothing is printed under the `parity` profile
  - proves: F122-FR-005; F122-FR-036

---

## Dependencies & Execution Order

| Phase | Depends on | Blocks |
|---|---|---|
| 1 The spike (US6) | Nothing. T004 and T005 write into `packages/runtime/`, whose manifest T006 creates: they create the directories they need, and CT-122-40 first runs with the package, after T006 | The freeze of spec.md. It does not block the code, because the detach strategy is an extension point. T002 and T003 are paid and are a precondition of no test |
| 2 Setup | Nothing | 3 |
| 3 Foundational | 2 | 4 to 8 |
| 4 US2 lock | 3 | 5, 6, 8 |
| 5 US1 detach and handshake | 4 | 6, 8 |
| 6 US3 processes | 4, 5 | — |
| 7 US5 inbox | 3 | — |
| 8 US4 state commands | 4, 5 | — |
| 9 Polish | All | — |

Phase 8 needs phase 5 because T065 changes the file of T045, T066 writes the marker again at the
heartbeat of T042, and T062 launches a run. The marker itself is written by T066: until then the
marker clauses of T027 (CT-122-20) and of T046 act on a marker that does not yet exist.

Inside a story: tests first, and they fail before the implementation; then the implementation in
the order listed.

## Parallel Example: User Story 2

```text
T017 conformance suite of EP-13      T018 contention test
T019 to T026 parity tests            T027 characterization of the lock rules
```

All are different files and none depends on another.

## Implementation Strategy

| Step | Content |
|---|---|
| First | The spike, T001 to T005 |
| MVP | Phases 2 to 5: one run per workspace, and a run that outlives its session |
| Then | Phase 6 (no orphan), phase 7 (inbox), phase 8 (moved tree), each testable alone |
| Last | Phase 9, and the macOS runner |
