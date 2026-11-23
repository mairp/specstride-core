# Tasks: Run control (feature 102)

**Input**: `specs/102-run-control/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: the workspace root, `@specstride/contracts`, `@specstride/kernel` and the oracle frame exist (created by the first tasks of features 100 and 141). Tests are required: parity tests and characterization tests are required tasks.

**Format**: `[ID] [P?] [Story] Description`. `[P]` means a different file and no dependency. `US1` to `US5` are the user stories of the spec.

No spike, fixture capture, live probe, experiment or paid probe is inherited by this feature (research.md, "Open items"). The first task is therefore the setup.

## Phase 1: Setup

- [x] T001 Create the module folders `packages/core/src/run-control/`, `packages/cli/src/run-control/`, `tests/parity/102/`, `tests/characterization/102/`, as in plan.md
- [x] T002 [P] Add the schema-validated readers for `specstride.inbox/1` (type `stop`), `specstride.snapshot/1` and `specstride.launch/1` from `@specstride/contracts` in `packages/cli/src/run-control/records.ts`
- [x] T003 [P] Add the closed set of refusals of `resume` and their exit codes in `packages/cli/src/run-control/refusals.ts`; the exit 1 of a workspace without state is not a member and comes before them (F102-FR-012 to F102-FR-016, F102-FR-024)

## Phase 2: Foundation (blocks every story)

- [x] T004 Write the stop-request writer (temporary name, rename; empty and unreadable read as clean) in `packages/cli/src/run-control/stop-request-writer.ts` (F102-FR-001)
- [x] T005 Write the snapshot writer with classes, ranks and secret references in `packages/cli/src/run-control/snapshot-writer.ts` (F102-FR-025, F102-FR-026)
- [x] T006 Write the counts reader from the ledger in `packages/core/src/run-control/counts.ts`, reading through the kernel and never through a file module of Node.js (F102-FR-032; F100-FR-012)
- [x] T007 Write the source-hash comparison over the canonical hasher, with the task-list hash that ignores checkboxes, in `packages/cli/src/run-control/source-compare.ts` (F102-FR-015, F102-FR-017)

## Phase 3: User Story 1 - The consumer stops a run (P1)

- [x] T008 [P] [US1] Parity test PT-102-028FR015-stop-check-points in `tests/parity/102/stop-check-points.test.ts`
  - proves: 028 FR-015
  - fixture: FX-12
  - surfaces: exit, stdout, stderr, state, events, processes
- [x] T009 [P] [US1] Parity test PT-102-C-009-exit-6 in `tests/parity/102/c009-exit-6.test.ts`
  - proves: C-009
  - fixture: FX-12
- [x] T010 [P] [US1] Parity test PT-102-C-010-stop-reason in `tests/parity/102/c010-stop-reason.test.ts`
  - proves: C-010
  - fixture: FX-12
- [x] T011 [P] [US1] Parity test PT-102-C-011-state-names in `tests/parity/102/c011-state-names.test.ts`
  - proves: C-011
  - fixture: FX-12, FX-13
- [x] T012 [P] [US1] Parity test PT-102-C-012-engine-stop-lines in `tests/parity/102/c012-stop-lines.test.ts`: the two as-is lines as the presenter renders them from the compatibility projection of the stop event, one for each value of `foundAt` (F102-FR-004, F102-FR-010)
  - proves: C-012
  - fixture: FX-12
- [x] T013 [P] [US1] Parity test PT-102-C-054-pass-loop-exit-6 in `tests/parity/102/c054-pass-loop-exit-6.test.ts`
  - proves: C-054
  - fixture: FX-12, FX-22
- [x] T014 [P] [US1] Parity test PT-102-C-057-yield-stop-line in `tests/parity/102/c057-yield-stop-line.test.ts`
  - proves: C-057
  - fixture: FX-22
- [x] T015 [P] [US1] Parity test PT-102-C-108-commands in `tests/parity/102/c108-commands.test.ts`
  - proves: C-108
  - fixture: FX-12, FX-13
- [x] T016 [P] [US1] Parity test PT-102-C-109-now-flag in `tests/parity/102/c109-now-flag.test.ts`
  - proves: C-109
  - fixture: FX-12
- [x] T017 [P] [US1] Parity test PT-102-C-113-state-files in `tests/parity/102/c113-state-files.test.ts`
  - proves: C-113
  - fixture: FX-12, FX-13
- [x] T018 [P] [US1] Parity test PT-102-C-114-output-lines in `tests/parity/102/c114-output-lines.test.ts`
  - proves: C-114
  - fixture: FX-12, FX-13, FX-08
- [x] T019 [P] [US1] Parity test PT-102-C-115-behaviours in `tests/parity/102/c115-behaviours.test.ts`
  - proves: C-115
  - fixture: FX-12, FX-13, FX-03, FX-16
- [x] T020 [P] [US1] Parity test PT-102-C-013-stop-boundaries-and-saved-settings in `tests/parity/102/c013-boundaries-settings.test.ts`
  - proves: C-013
  - fixture: FX-12, FX-13, FX-23, FX-27
- [x] T021 [P] [US1] Characterization test CT-102-2 (Lisa: the stop request is written atomically; empty or unparseable means a clean stop) in `tests/characterization/102/ct-2.test.ts`
  - proves: 002 FR-046
- [x] T022 [P] [US1] Characterization tests CT-102-3 (reused pid: no signal), CT-102-4 (`--jobs` and adoptable jobs), CT-102-5 (stop in a quota pause and in a relaunch backoff) in `tests/characterization/102/ct-3-5.test.ts`
  - proves: F102-SC-002
- [x] T023 [US1] Implement the engine-side read of the stop request at the boundaries and the honouring (exit 6, `stop_flag`, request removed, the terminal record, the event `run.ended` with `phase`, `cause`, `causedBy` and `foundAt`) in `packages/core/src/run-control/stop-request.ts` (F102-FR-003, F102-FR-004, F102-FR-005, F102-FR-009 for the engine's boundaries, F102-FR-036). The waits of the backoff and the quota pause are features 123's and 127's; CT-102-5 (T022) tests them
- [x] T024 [US1] Implement `stop` in `packages/cli/src/commands/stop.ts`: request, warning with no run, exit codes, compatibility lines and the default line (F102-FR-001, F102-FR-002, F102-FR-010)
- [x] T025 [US1] Implement `--now` and `--jobs` with the identity check through the process primitive in `packages/cli/src/run-control/signal-owned.ts` (F102-FR-006, F102-FR-007, F102-FR-008)

## Phase 4: User Story 2 - The consumer resumes a run (P1)

- [x] T026 [P] [US2] Parity test PT-102-028FR016-resume in `tests/parity/102/resume.test.ts`
  - proves: 028 FR-016
  - fixture: FX-13
  - surfaces: exit, stdout, stderr, state, events, transcript
- [x] T027 [P] [US2] Parity test PT-102-C-110-git-commits-env in `tests/parity/102/c110-git-commits-env.test.ts`
  - proves: C-110
  - fixture: FX-13, FX-27
- [x] T028 [P] [US2] Parity test PT-102-C-111-exit-codes in `tests/parity/102/c111-exit-codes.test.ts` through the exit-code map of DV-021
  - proves: C-111
  - fixture: FX-13, FX-11
- [x] T029 [P] [US2] Characterization test CT-102-1 (Lisa: refusals of `resume`) in `tests/characterization/102/ct-1.test.ts`
  - proves: 002 FR-016
- [x] T030 [P] [US2] Characterization tests CT-102-6 (survivors, reclaim), CT-102-14 (approval records: wrong signature, bare marker), CT-102-15 (states left by `resume`), CT-102-16 (unsupported record, invalid replayed values) in `tests/characterization/102/ct-6-14-16.test.ts`
  - proves: F102-SC-006
- [x] T049 [P] [US2] Characterization test CT-102-26 (`resume` on a workspace without state exits 1 and runs no other check; with state and no run snapshot it exits 3) in `tests/characterization/102/ct-26.test.ts`
  - proves: F102-FR-012
  - fixture: FX-13
- [x] T031 [US2] Implement `resume`: the state check of annex G §G.4 first (exit 1), then the selection of the run, the six refusals in the order of F102-FR-024, the route of the continued run, the launch record with the two flags in `packages/cli/src/commands/resume.ts` (F102-FR-011 to F102-FR-014, F102-FR-023, F102-FR-024)
- [x] T032 [US2] Implement the verification of approval records on resume, with the event `integrity.noted` for a record that fails or a bare marker, in `packages/cli/src/run-control/verify-approvals.ts` (F102-FR-022)
- [x] T033 [US2] Implement the compatibility messages and the default refusal lines in `packages/cli/src/run-control/refusals.ts` (F102-FR-012, F102-FR-013, F102-FR-021: the three ways out)

## Phase 5: User Story 3 - A source changes in the middle of a run (P1)

- [x] T034 [P] [US3] Characterization tests CT-102-7 (the spec, the plan and the task text each changed: exit 3, file named), CT-102-8 (launch record, derived state, synthesized event), CT-102-9 (only checkboxes changed) in `tests/characterization/102/ct-7-9.test.ts`
  - proves: F102-SC-003
- [x] T035 [P] [US3] Characterization tests CT-102-10 (profile `parity`: no refusal), CT-102-11 (accept: new hashes, counts kept), CT-102-12 (fact for every critic), CT-102-13 (blocked run needs the flag or `--new-run`) in `tests/characterization/102/ct-10-13.test.ts`
  - proves: F102-FR-019
- [x] T036 [US3] Implement the refusal record and the derived state (launch record only; the synthesized `blocked` is written by the next writer of the event file, not by the CLI) in `packages/cli/src/run-control/refuse-source-changed.ts` (F102-FR-015, F102-FR-016, F102-FR-021, F102-FR-036)
- [x] T037 [US3] Implement `--accept-source-change` on the CLI side: derive the verification plan and the check manifest again through EP-07, write `acceptedChanges` and the new hashes into the snapshot before the engine starts, in `packages/cli/src/run-control/accept-source-change.ts` and `packages/cli/src/run-control/snapshot-writer.ts` (F102-FR-019)
- [x] T051 [US3] Implement the engine side of an accepted change: read `acceptedChanges` of the snapshot, emit `source.change_accepted` (one for each file; written by the process that becomes the writer of the event file), supply the fact of annex D §D.7 to every critic of the run, in `packages/core/src/run-control/accepted-change.ts` (F102-FR-020, F102-FR-036)
- [x] T038 [US3] Wire the profile `parity` so that neither check point is active, in `packages/cli/src/run-control/source-compare.ts` (the switch `staleness.check_points`) and `packages/cli/src/run-control/continue-or-new.ts` (F102-FR-018)

## Phase 6: User Story 4 - A limit means what it says (P1)

- [x] T039 [P] [US4] Characterization tests CT-102-20 (reject limit 3 across two resumes), CT-102-21 (reset flag: command line only, not replayed), CT-102-22 (continued or new run), CT-102-23 (suffix rule), CT-102-24 (events), CT-102-25 (operations of the run-state machine) in `tests/characterization/102/ct-20-25.test.ts`
  - proves: F102-SC-001; F102-SC-007
- [x] T040 [US4] Implement the counts: from the ledger at every engine start; `--reset-counts` from the command line only, resetting the counts of every loop layer through EP-04 `specstride.loop-layer/1`, recorded in the ledger; the events `run.launched` (counts carried or reset), `counters.reset` and `unblocked` (`by`, `latencyMs`), in `packages/core/src/run-control/counts.ts` and `packages/cli/src/commands/resume.ts` (F102-FR-032, F102-FR-033, F102-FR-036). `run.ended` for a stop is T023's; the synthesized `blocked` is T036's; `source.change_accepted` is T051's
- [x] T052 [US4] Write the continuation module that `launch`, `run` and `resume` call: select the unfinished run of the feature, `--new-run` (new `runId`, snapshot and counts; the old records stay), the hash check of F102-FR-015 at a continuing launch, the rank of the snapshot as at `resume` (annex X §X.2), the line `[SPECSTRIDE-CONTINUE]` with `run` and `counts`, not printed under `parity`, in `packages/cli/src/run-control/continue-or-new.ts`; call it from `resume.ts` and name the call for `launch` and `run` to feature 100 (F102-FR-015, F102-FR-034)
- [x] T041 [US4] Implement the suffix rule after a reset (phase number, ordinal of the engine start, ordinal of the phase attempt; the run id appended where the directory exists) in `packages/core/src/run-control/attempt-names.ts` (F102-FR-035)
- [x] T042 [US4] Implement the launch records behind T1, T2, T3 and T17 in `packages/cli/src/run-control/launch-record.ts`, and a test in `tests/characterization/102/ct-20-25.test.ts` (CT-102-25) that the CLI writes no run state and no other transition (F102-FR-037)

## Phase 7: User Story 5 - Saved settings replay (P2)

- [x] T043 [P] [US5] Characterization tests CT-102-17 (snapshot write fails: launch error), CT-102-18 (class of a key; none is `pinned`), CT-102-19 (a tunable key in the environment wins; a pinned one does not) in `tests/characterization/102/ct-17-19.test.ts`
  - proves: F102-FR-025, F102-FR-026, F102-FR-027
- [x] T053 [P] [US5] Characterization test CT-102-27 (every resolved key of a run is in the snapshot with value, source and class; a canary secret planted in the configuration appears only as its reference and in no event) in `tests/characterization/102/ct-27.test.ts`
  - proves: F102-SC-005
- [x] T044 [US5] Implement the replay with ranks (the pin of the launch contract above every flag; pinned above the environment; tunable below it) and the re-validation against the schema and the trust classes in `packages/cli/src/run-control/snapshot-replay.ts` (F102-FR-027, F102-FR-028, F102-FR-029, F102-FR-024)
- [x] T045 [US5] Implement the engine executable rule and the `resuming:` line in `packages/cli/src/commands/resume.ts` (F102-FR-030, F102-FR-031)

## Phase 8: Polish

- [x] T046 Run FX-12 and FX-13 under the `parity` profile with the reset flag on resume fixtures; confirm the only waivers are those of the spec (F102-SC-008)
- [x] T047 Measure in CI the byte size of the default output of `stop` and of a refusal (research.md D-9), and the time to a refusal of `resume` and to the return of `stop` on a fixture workspace of 50 phases (plan.md, Performance Goals: reported, not gated)
- [x] T048 Confirm that annex X §X.6 (rows 51 and 76) and annex X §X.7 (rows 62 and 63) hold what the spec cites (spec, "Closed sets" and "Rows of the `parity` profile"), that the catalogue of feature 111 holds `source.change_accepted` (F111-FR-051), and whether the row for `foundAt` and its field of `run.ended` have been granted (spec, "Closed sets"); report a difference to the orchestrator
- [x] T050 Run the parity tests and the characterization tests of this feature on the macOS runner when it exists, and record the results against the two `status: unverified` fields of `spec.md` that name macOS (F102-FR-001, F102-FR-007) in `tests/release/102/macos.md`; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason and never a pass
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F102-FR-001; F102-FR-007

## Dependencies

T001 before all. T002 to T007 before the story phases. Within a story the tests come first and must fail before the implementation. US1 before US2 (the request and the process registry are used by resume for survivors). US3 needs T031 and T007; T051 needs T037. US4 needs T006 and T031; T052 needs T007 and T005. US5 needs T005 and T031. T049 is written with the tests of US2 and fails before T031. T046 and T050 last.

T051, T052 and T053 were added on 2026-09-30 after the analysis (`analyze-report.md`, findings I1, G1, G2); ids were not renumbered, so each sits in the phase of its story. Tasks: 53. Characterization tests: 27.
