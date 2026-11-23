---
description: "Task list of feature 118-pass-supervision-and-jobs"
---

# Tasks: Pass supervision and detached jobs

**Input**: Design documents from `specs/118-pass-supervision-and-jobs/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Grouped by the user stories of `spec.md` (US1 to US5). Every task names its file. A test task carries `proves:` and, for a parity test, `fixture:`. An implementation task carries `covers:`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: US1 stuck pass, US2 yield, US3 fail fast, US4 adoption, US5 polite stop

## Path Conventions

`packages/core/src/pass-supervision/` for code (plan.md); `tests/parity/118/` for `PT-118-*`; `tests/characterization/118/` for `CT-118-*`. The process primitive is feature 122's and is consumed through a port.

## Phase 1: First tasks (spike and capture)

**Purpose**: What this feature inherits that must exist before the code is written.

- [x] T001 [US4] Characterization spike on the baseline `9cab15d`: does the tree kill of a pass reach a job started in its own process session, on Linux (and on macOS when a runner exists)? Record the result in `tests/characterization/118/spike-tree-kill.md`. Local, no model call
  - proves: C-058; C-022
  - fixture: FX-22
- [x] T002 [US5] Paid probe, logged, not run by the specification: one live call per tested harness adapter that ends a pass with the interrupt and records whether the turn ends cleanly and the session is resumable. Task text says "paid"; the probe is logged in the cost record. Output: `tests/characterization/118/probe-interrupt.md`
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F118-FR-009
  - paid: yes; never a precondition of an unpaid test (CT-118-1 runs on stubs); not run by the specification
- [x] T003 [US4] Confirm the result of the spike of feature 122 (detach survival inside a host session) before the adoption requirement is frozen; write the outcome as `unverified` or `verified-on` in spec.md F118-FR-031
  - proves: C-022

## Phase 2: Setup and foundation

- [x] T004 Create `packages/core/src/pass-supervision/` with the folders of plan.md and an `index.ts` that exports only the pass-supervision surface (covers: all)
- [x] T005 [P] Ports in `packages/core/src/pass-supervision/ports.ts`: clock, process list (pid, group, session, start time, command line, CPU time), file reader (bytes after an offset, identity, modification time), file writer (atomic), signal sender, process launcher, event writer, registry access, ingress (the one point of redaction). No port is implemented with `node:fs` or `node:child_process` inside the core (covers: F118-FR-002, F118-FR-031, F118-FR-044)
- [x] T006 [P] Fake clock and fake process list in `packages/testkit` samples for `tests/**/118` (covers: all)
- [x] T007 [P] Add the closed sets to `@specstride/contracts` through feature 100's process: kill reasons and classes (row 10), predicates and actions (row 69), job modes (row 70), outcomes of a wait (row 112), steps of the end of a pass (row 113), results of a predicate (row 114) (covers: F118-FR-007, F118-FR-016, F118-FR-018, F118-FR-020)
- [x] T008 [P] Alias table entries for the settings of F118-FR-014 and F118-FR-025 as data, with the keys of the key table of feature 110; the six keys `loop.yield.waitEvery`, `.logHead`, `.logTail`, `.failureLedger`, `.failureLedgerMax`, `.failurePattern` enter only after feature 110 lists them (covers: F118-FR-014, F118-FR-025, F118-FR-034)
- [x] T009 Configure the profile rows 4, 5, 11, 50 (`carry.politeStopGraceSec`) and 51 (`verification.failfastGraceSec`) of annex X §X.7 in the test fixtures of the `parity` profile (covers: F118-FR-041)

## Phase 3: User Story 1 - A stuck pass is ended and the next pass is told why (P1) MVP

**Goal**: Watchdogs, kill reasons, hard cap, kill note, result 10.

**Independent Test**: FX-20 and FX-21 under `parity`.

### Tests for User Story 1

- [x] T010 [P] [US1] Parity test PT-118-028FR017-watchdog-defaults in tests/parity/118/watchdog-defaults.test.ts
  - proves: 028 FR-017
  - fixture: FX-21
- [x] T011 [P] [US1] Parity test PT-118-C-058-watchdog-order-and-tick in tests/parity/118/watchdog-order.test.ts
  - proves: C-058
  - fixture: FX-21
- [x] T012 [P] [US1] Parity test PT-118-C-055-kill-reasons-and-classes in tests/parity/118/kill-reasons.test.ts
  - proves: C-055
  - fixture: FX-21
- [x] T013 [P] [US1] Parity tests PT-118-C-006-pass-ceiling-flags and PT-118-C-009-ceiling-resolution-order (the order of F118-FR-006) in tests/parity/118/pass-ceiling.test.ts
  - proves: C-006; C-009; C-013
  - fixture: FX-20
- [x] T014 [P] [US1] Parity tests PT-118-C-007-ceiling-and-yield-env, PT-118-C-051-watchdog-flags and PT-118-C-052-watchdog-and-yield-env in tests/parity/118/env-aliases.test.ts
  - proves: C-007; C-051; C-052
  - fixture: FX-20; FX-21
- [x] T015 [P] [US1] Parity test PT-118-C-008-proposer-cap-event in tests/parity/118/proposer-cap-event.test.ts
  - proves: C-008; C-053
  - fixture: FX-20
- [x] T016 [P] [US1] Parity tests PT-118-C-010-cap-exhausted-stop and PT-118-C-054-results-and-statuses in tests/parity/118/cap-exhausted.test.ts
  - proves: C-010; C-054; C-009
  - fixture: FX-20
- [x] T017 [P] [US1] Parity tests PT-118-C-012-ceiling-lines and PT-118-C-021-long-job-lines in tests/parity/118/ceiling-lines.test.ts
  - proves: C-012; C-021
  - fixture: FX-20
- [x] T018 [P] [US1] Parity tests PT-118-C-056-kill-note-and-files and PT-118-C-011-pass-in-flight-entry in tests/parity/118/kill-note.test.ts
  - proves: C-056; C-011
  - fixture: FX-20
- [x] T019 [P] [US1] Parity test PT-118-C-057-prompt-blocks-and-lines in tests/parity/118/prompt-blocks.test.ts
  - proves: C-057
  - fixture: FX-20; FX-21; FX-22
- [x] T020 [P] [US1] Characterization test CT-118-2 (checkpoint pass leaves counters as they were; exact argv exempt) in tests/characterization/118/checkpoint-exemptions.test.ts
  - proves: F118-FR-013
- [x] T021 [P] [US1] Test of the unknown kill reason (class `futility`) in tests/parity/118/unknown-kill-reason.test.ts
  - proves: C-055
  - fixture: FX-21

### Implementation for User Story 1

- [x] T022 [P] [US1] Idle and progress watchdogs in packages/core/src/pass-supervision/watchdogs/idle-progress.ts (covers: F118-FR-003)
- [x] T023 [P] [US1] Process-level repetition with the default ignore expression in packages/core/src/pass-supervision/watchdogs/repeat-process.ts (covers: F118-FR-004)
- [x] T024 [P] [US1] Tool-level repetition in packages/core/src/pass-supervision/watchdogs/repeat-tool.ts (covers: F118-FR-005)
- [x] T025 [US1] Tick loop and order in packages/core/src/pass-supervision/watchdogs/tick.ts (covers: F118-FR-001, F118-FR-002)
- [x] T026 [US1] Hard cap and resolution of the ceiling in packages/core/src/pass-supervision/watchdogs/hard-cap.ts (covers: F118-FR-006)
- [x] T027 [P] [US1] Kill reasons and classes in packages/core/src/pass-supervision/watchdogs/reasons.ts (covers: F118-FR-007)
- [x] T028 [US1] Kill by termination, 3 s, kill in packages/core/src/pass-supervision/stop-ladder/parity-ladder.ts (covers: F118-FR-008)
- [x] T029 [P] [US1] Kill note, sidecars and the previous-pass block in packages/core/src/pass-supervision/kill-note/ (covers: F118-FR-010, F118-FR-026)
- [x] T030 [US1] Consecutive cap kills and result 10 in packages/core/src/pass-supervision/watchdogs/cap-breaker-report.ts (covers: F118-FR-011, F118-FR-028)
- [x] T031 [US1] Short-pass counter, nudge block and checkpoint exemptions in packages/core/src/pass-supervision/watchdogs/short-pass.ts (covers: F118-FR-012, F118-FR-013)
- [x] T032 [US1] Settings, aliases and events of the pass in packages/core/src/pass-supervision/settings.ts and events.ts (covers: F118-FR-014, F118-FR-027, F118-FR-029, F118-FR-030)

**Checkpoint**: FX-20 and FX-21 compare `equal` under `parity`.

## Phase 4: User Story 2 - A pass yields to a job and no session waits (P1)

**Independent Test**: FX-22 under `parity`, FX-23 and FX-16.

### Tests for User Story 2

- [x] T033 [P] [US2] Parity test PT-118-028FR019-yield-defaults in tests/parity/118/yield-defaults.test.ts
  - proves: 028 FR-019
  - fixture: FX-22
- [x] T034 [P] [US2] Parity test PT-118-C-058-yield-validation-and-refusal in tests/parity/118/yield-validation.test.ts
  - proves: C-058
  - fixture: FX-22
- [x] T035 [P] [US2] Parity test PT-118-C-058-predicate-<kind> for the six as-is kinds in tests/parity/118/predicates.test.ts
  - proves: C-058; 028 FR-019
  - fixture: FX-22
- [x] T036 [P] [US2] Parity test PT-118-C-053-yield-events in tests/parity/118/yield-events.test.ts
  - proves: C-053; C-054
  - fixture: FX-22
- [x] T037 [P] [US2] Parity test PT-118-C-055-yield-stop-reasons in tests/parity/118/yield-stop-reasons.test.ts
  - proves: C-055; C-010
  - fixture: FX-22; FX-23
- [x] T038 [P] [US2] Parity test PT-118-C-013-yield-poll-resolution in tests/parity/118/poll-resolution.test.ts
  - proves: C-013
  - fixture: FX-22
- [x] T039 [P] [US2] Own test CT-118-9 (a yield beside a checkpoint refuses the checkpoint) in tests/characterization/118/yield-with-checkpoint.test.ts
  - proves: F118-FR-043
- [x] T040 [P] [US2] Parity tests PT-118-C-022-long-job-lifecycle, PT-118-C-018-long-job-log-variable, PT-118-C-019-long-job-events and PT-118-C-020-long-job-state in tests/parity/118/long-job.test.ts
  - proves: C-022; C-006; C-018; C-019; C-020; C-021
  - fixture: FX-16
- [x] T041 [P] [US2] Parity tests PT-118-C-044-failure-ledger-records, PT-118-C-045-failure-ledger-parameters, PT-118-C-046-failure-ledger-status and PT-118-C-047-failure-ledger-file in tests/parity/118/failure-ledger-records.test.ts
  - proves: C-044; C-045; C-046; C-047
  - fixture: FX-22
- [x] T042 [P] [US2] Parity tests PT-118-C-048-failure-ledger-section and PT-118-C-049-failure-signatures in tests/parity/118/failure-ledger-section.test.ts
  - proves: C-048; C-049
  - fixture: FX-22

### Implementation for User Story 2

- [x] T043 [P] [US2] Yield validation from the schema of `@specstride/contracts` in packages/core/src/pass-supervision/yield/schema/ (covers: F118-FR-015, F118-FR-016, F118-FR-017)
- [x] T044 [P] [US2] The six as-is predicates in packages/core/src/pass-supervision/yield/predicates/ (covers: F118-FR-018)
- [x] T045 [US2] Launch and adopt modes in packages/core/src/pass-supervision/jobs/launch-adopt.ts (covers: F118-FR-019)
- [x] T046 [US2] Wait loop and outcomes in packages/core/src/pass-supervision/yield/wait/ (covers: F118-FR-020, F118-FR-022)
- [x] T047 [US2] Yield limit and result 9 in packages/core/src/pass-supervision/yield/limit.ts (covers: F118-FR-021)
- [x] T048 [P] [US2] Resume block and log slice in packages/core/src/pass-supervision/yield/resume-block/ (covers: F118-FR-023)
- [x] T049 [US2] Counters after a yield in packages/core/src/pass-supervision/yield/accounting.ts (covers: F118-FR-024)
- [x] T050 [P] [US2] Yield settings and aliases in packages/core/src/pass-supervision/yield/settings.ts (covers: F118-FR-025)
- [x] T051 [US2] Yield beside a checkpoint in packages/core/src/pass-supervision/yield/with-checkpoint.ts (covers: F118-FR-043)
- [x] T052 [P] [US2] Long job in packages/core/src/pass-supervision/jobs/long-job.ts (covers: F118-FR-032, F118-FR-033, F118-FR-034, F118-FR-035)
- [x] T053 [P] [US2] Failure ledger in packages/core/src/pass-supervision/failure-ledger/ (covers: F118-FR-036, F118-FR-037)

**Checkpoint**: FX-16 (long-job scenarios), FX-22 and FX-23 compare `equal`; user story 1 still passes.

## Phase 5: User Story 3 - A failed long job stops early (P1)

**Independent Test**: Experiment X2 on the replay and the synthetic fixture.

### Tests for User Story 3

- [x] T054 [P] [US3] Own test CT-118-4 (predicate: stale failed line, skipped row, negative test that fails by design, torn last line, replaced file, two polls) in tests/characterization/118/first-failure-predicate.test.ts
  - proves: F118-FR-038; F118-SC-005; F118-SC-006
- [x] T055 [P] [US3] Own test CT-118-5 (stop only a launched job that declared `stop`; never `adopt`; process group; grace; event) in tests/characterization/118/first-failure-stop.test.ts
  - proves: F118-FR-039
- [x] T056 [P] [US3] Own test CT-118-6 (fact for the critic without counts) in tests/characterization/118/stopped-job-fact.test.ts
  - proves: F118-FR-040
- [x] T057 [P] [US3] Own test CT-118-7 (switch, default action, `first-failure-off` refusal, parity value) in tests/characterization/118/failfast-switch.test.ts
  - proves: F118-FR-041
- [x] T058 [P] [US3] Own test CT-118-8 (events `job.*`, `resource.wait`) in tests/characterization/118/job-events.test.ts
  - proves: F118-FR-042
- [x] T059 [US3] Test PT-118-X2-failfast: experiment X2, replay and synthetic fixture, switch on against off, in tests/experiments/118/x2-failfast.md
  - proves: F118-SC-001

### Implementation for User Story 3

- [x] T060 [US3] First-failure reader in packages/core/src/pass-supervision/failfast/reader.ts (covers: F118-FR-038)
- [x] T061 [US3] Stop of a launched job in packages/core/src/pass-supervision/failfast/stop-job.ts (covers: F118-FR-039)
- [x] T062 [P] [US3] Row for the critic's fact block in packages/core/src/pass-supervision/failfast/fact.ts (covers: F118-FR-040)
- [x] T063 [P] [US3] Switches and defaults in packages/core/src/pass-supervision/failfast/switches.ts (covers: F118-FR-041)
- [x] T064 [P] [US3] Events and resource declaration in packages/core/src/pass-supervision/failfast/events.ts (covers: F118-FR-042)

**Checkpoint**: X2 pass mark reached or reported.

## Phase 6: User Story 4 - A stop does not kill the job; the next start adopts it (P2)

### Tests for User Story 4

- [x] T065 [P] [US4] Own test CT-118-3 (job survives stop and `stop --now`; adopted; identity mismatch treated as ended, nothing signalled; a job in its own session survives the kill of the pass) in tests/characterization/118/adoption.test.ts
  - proves: F118-FR-031; F118-SC-004

### Implementation for User Story 4

- [x] T066 [US4] Registry entries of class `adoptable` in packages/core/src/pass-supervision/jobs/registry.ts (covers: F118-FR-031)
- [x] T067 [US4] Adoption at engine start in packages/core/src/pass-supervision/jobs/adopt-at-start.ts (covers: F118-FR-031)

## Phase 7: User Story 5 - A killed pass is polite first (P2)

### Tests for User Story 5

- [x] T068 [P] [US5] Own test CT-118-1 (three stubs: ends on interrupt, on termination, on kill only; the record shows every step) in tests/characterization/118/polite-stop.test.ts
  - proves: F118-FR-009; F118-SC-002

### Implementation for User Story 5

- [x] T069 [US5] Stop ladder with the record of steps in packages/core/src/pass-supervision/stop-ladder/polite-ladder.ts (covers: F118-FR-009)

## Phase 8: Polish

- [x] T070 [P] Doctor input: the list of resources that jobs declared, in packages/core/src/pass-supervision/failfast/resources.ts (covers: F118-FR-042)
- [x] T071 [P] Import-boundary check: the module imports no `node:child_process`, `node:net`, `node:http`, `node:https`, `node:fs` or `node:fs/promises` (F100-FR-012, CQ-185); run `tools/import-boundary` (covers: all)
- [x] T072 Second suite (profile `parity` with row 1 set to `micro`): confirm the three watchdog fixtures stay `equal` with the layer on and no unit declared
  - proves: F118-FR-013
  - fixture: FX-20; FX-21; FX-22
- [x] T073 Run `python3 docs/ecosystem/check-traceability.py --require-all` and repair the lines that name this feature
- [x] T074 Report to feature 100 and 111 the requests of the report (event type names; the optional field `job.resource` of CQ-057) and to feature 100 and 110 the six keys of `loop.yield.*` with their variables (`repair-report.md`). The closed-set rows 112 to 114 and the profile rows 50 and 51 exist in annex X

## Phase 9: Added after the cross-feature review (2026-09-30)

- [x] T075 [P] [US2] Parity test PT-118-FX16-long-job (scenarios `long-job-running` and `long-job-finished` of FX-16: ensure before every attempt and every pass, never relaunched within the attempt, the live job of another run, the ended marker) in tests/parity/118/fx16-long-job.test.ts
  - proves: C-006; C-013; C-022
  - fixture: FX-16
- [x] T076 [P] [US1] Own test CT-118-10 (a planted canary secret in the command line of a killed pass, in the target of a tool record, in `reason`, `on_resume` and `job.argv` of a yield, in the command of a long job and in a line of a job log: no sink and no prompt holds it; the redactor made unavailable: the text is dropped, the record says so, and the kill, the wait and the resume go on) in tests/characterization/118/ingress.test.ts
  - proves: F118-FR-044
- [x] T077 [US1] Pass every text from outside the runtime through the ingress port before it is written: kill note, sidecars, line on standard error, `pass_killed.detail`, yield events and lines, `job.started`, `long_job_start.cmd`, resume block, failure ledger, in packages/core/src/pass-supervision/ingress.ts and the writers that call it (covers: F118-FR-044)
- [x] T078 [P] [US2] The six settings `loop.yield.waitEvery`, `.logHead`, `.logTail`, `.failureLedger`, `.failureLedgerMax`, `.failurePattern` and their variables in packages/core/src/pass-supervision/yield/settings.ts, after feature 110 lists the keys (covers: F118-FR-025, F118-FR-036)

## Dependencies

Phase 1 first. Phase 2 before all others. US1 before US2 (the kill note and counters are used by the wait). US3 needs US2 (predicates, launch and adopt). US4 needs US2 and T001. US5 needs T025 and T028. T059 needs US3 complete. T076 before T077; T077 needs T029, T048, T052 and T053. T075 before T052. T078 needs T050 and the key list of feature 110. T002 is paid and is a precondition of no other task.
