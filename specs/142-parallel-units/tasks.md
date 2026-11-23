# Tasks: Parallel units (feature 142)

**Input**: Design documents from `specs/142-parallel-units/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested. Characterization tests are required tasks. This feature has no parity test
of its own: the as-is systems have no parallel work inside a phase, and the option is off under
the `parity` profile. A test task names what it proves.

**Organization**: by user story of `spec.md`. `[P]` marks a task that can run at the same time as
the other `[P]` tasks of its phase: no two of them touch the same file. A later task on the same
file runs after it, in the order of their numbers. `rules:` names the rules of R29 and R29v that a
test covers.

The feature was split on 2026-09-29. The tasks of the engine services left with group G-B; task
numbers were assigned anew. Stage B writes no product code. These tasks are for the
implementation that follows.

## Phase 1: Setup

- [x] T001 Create the package packages/layer-parallel and the directory packages/core/src/parallel, with the import rules of the package graph
- [x] T002 [P] Copy the data of specs/142-parallel-units/contracts/ into packages/layer-parallel/data/ and add a test that compares it with spec.md, in packages/layer-parallel/test/data.test.ts

## Phase 2: Foundational

- [x] T003 Define the types of the plan, scope, group, verdict of the audits and the five closed sets, in packages/layer-parallel/src/types.ts
- [x] T004 [P] Build the stub worker of the test tree: scripted edits, checkpoint, yield, commit, quota signal, harness error, in tests/parallel/142/support/stub-worker.ts
- [x] T005 Conformance test of EP-04: the sample layer stacked above `noop` requests a group of two stub passes and integrates them; the oracle passes with the sample unregistered, in tests/conformance/142/loop-layer.test.ts
  - proves: F142-FR-006
  - rules: PU-05

## Phase 3: User Story 1 - A consumer switches parallel units on (P1)

**Goal**: A group is planned, requested, audited and checked: plan, reservation, request, merge check, one kept unit of work.

**Independent Test**: quickstart.md section 2

### Tests for User Story 1

- [x] T006 [P] [US1] Characterization test CT-142-1: the fallback on a workspace that is not a git repository, reason `not-git`; the removal of a stale worker tree of the same run, group and worker; the worker tree made from the base snapshot with no branch and no reference in the project's repository; observed through a group that the layer requests, in tests/characterization/142/ct-142-1.test.ts
  - proves: 002 FR-048; F142-FR-002; F142-FR-074
  - rules: PU-18, PU-27, PU-93, PU-23
- [x] T007 [P] [US1] Test CT-142-107 marker-is-necessary in tests/parallel/142/ct-142-107-marker-is-necessary.test.ts
  - proves: F142-FR-007
  - rules: PU-09
- [x] T008 [P] [US1] Test CT-142-108 groups-of-consecutive-admitted-tasks in tests/parallel/142/ct-142-108-groups-of-consecutive-admitted-tasks.test.ts
  - proves: F142-FR-008
  - rules: PU-10, PU-14, PU-86, PU-102
- [x] T009 [P] [US1] Test CT-142-109 scope-form-and-comparison in tests/parallel/142/ct-142-109-scope-form-and-comparison.test.ts
  - proves: F142-FR-009
  - rules: PU-11, PU-12, PU-99
- [x] T010 [P] [US1] Test CT-142-110 scope-sources in tests/parallel/142/ct-142-110-scope-sources.test.ts
  - proves: F142-FR-010
  - rules: PU-12; ruling 35
- [x] T011 [P] [US1] Test CT-142-111 admission-is-pure in tests/parallel/142/ct-142-111-admission-is-pure.test.ts
  - proves: F142-FR-011
  - rules: PU-13
- [x] T012 [P] [US1] Test CT-142-118 group-start-and-reservation in tests/parallel/142/ct-142-118-group-start-and-reservation.test.ts
  - proves: F142-FR-018
  - rules: PU-16, PU-17, PU-40
- [x] T013 [P] [US1] Test CT-142-119 workers-default-ceiling-halving in tests/parallel/142/ct-142-119-workers-default-ceiling-halving.test.ts
  - proves: F142-FR-019
  - cases: the default ceiling 4; a ceiling set to 6 with 5 workers is accepted; a ceiling set to 3 with 4 workers is a configuration error
  - rules: PU-31, PU-39
- [x] T014 [P] [US1] Test CT-142-159 merge-check in tests/parallel/142/ct-142-159-merge-check.test.ts
  - proves: F142-FR-059
  - rules: PU-48
- [x] T015 [P] [US1] Test CT-142-161 outcome-of-the-merge-check in tests/parallel/142/ct-142-161-outcome-of-the-merge-check.test.ts
  - proves: F142-FR-061
  - rules: PU-49, PU-50

### Implementation for User Story 1

- [x] T016 [P] [US1] Read candidates from the task list as read at launch (F142-FR-007), in packages/layer-parallel/src/admission.ts
- [x] T017 [US1] Form groups of 2 to `workers` consecutive admitted tasks (F142-FR-008), in packages/layer-parallel/src/admission.ts
- [x] T018 [P] [US1] Normalise scopes and compare them at path boundaries, with case folding where the file system ignores case (F142-FR-009), in packages/layer-parallel/src/scope.ts
- [x] T019 [US1] Take scopes from the consumer's declaration or the text of the task; refuse widening by project configuration (F142-FR-010), in packages/layer-parallel/src/scope.ts
- [x] T020 [US1] Run the eight checks greedily in task order and record each verdict (F142-FR-011), in packages/layer-parallel/src/admission.ts
- [x] T021 [P] [US1] Start a group only at a clean pass boundary; shrink or cancel a group when a reserved task was worked serially (F142-FR-018), in packages/layer-parallel/src/decide.ts
- [x] T022 [P] [US1] Default 2; the ceiling is the value of `loop.parallel.workersMax` in force (default 4), and a worker count above it is a configuration error at launch; halve after two transient rate limits (F142-FR-019), in packages/layer-parallel/src/plan.ts
- [x] T023 [P] [US1] Run the inner check set once per group on the workspace (F142-FR-059), in packages/core/src/parallel/merge-check.ts
- [x] T024 [US1] Keep one unit of work, or send it to the repair path and charge one repair per task (F142-FR-061), in packages/core/src/parallel/merge-check.ts
- [x] T025 [US1] Request worker trees and writes to the workspace only through the group directives and the tree-store service (F142-FR-074), in packages/layer-parallel/src/decide.ts

**Checkpoint**: user story 1 can be tested by itself.

## Phase 4: User Story 2 - An operator sees why the option did not run (P1)

**Goal**: Every fallback and every admission verdict is stated; the option off is absent.

**Independent Test**: quickstart.md sections 1 and 3

### Tests for User Story 2

- [x] T026 [P] [US2] Inertness test: every micro-loop fixture three ways (option off; on with a task list without `[P]`; on with stubs that tick every `[P]` task serially); outputs equal after the named fields of DV-088 are removed, in tests/inertness/142/inertness.test.ts
  - proves: F142-FR-005; F142-SC-001
  - rules: PU-04, PU-98
  - fixture: the stubs of feature 141, §O.3
- [x] T027 [P] [US2] One fixture per fallback reason and per admission check, each printing its reason and completing as the run with the option off, in tests/parallel/142/fallbacks.test.ts
  - proves: F142-SC-010
  - rules: PU-02, PU-13
- [x] T028 [P] [US2] Test CT-142-101 switch-and-registration in tests/parallel/142/ct-142-101-switch-and-registration.test.ts
  - proves: F142-FR-001
  - rules: PU-01
- [x] T029 [P] [US2] Test CT-142-102 preconditions-and-fallback-reasons in tests/parallel/142/ct-142-102-preconditions-and-fallback-reasons.test.ts
  - proves: F142-FR-002; 002 FR-048
  - rules: PU-02, PU-18, PU-80
- [x] T030 [P] [US2] Test CT-142-103 containment-and-allow-detect in tests/parallel/142/ct-142-103-containment-and-allow-detect.test.ts
  - proves: F142-FR-003
  - cases: the key in user configuration is accepted; the key from the environment, from a flag and from project configuration is ignored, each with a launch message (assumption: CQ-183)
  - rules: PU-26; ruling P2
- [x] T031 [P] [US2] Test CT-142-104 no-new-code-reason-or-state in tests/parallel/142/ct-142-104-no-new-code-reason-or-state.test.ts
  - proves: F142-FR-004
  - rules: PU-03
- [x] T032 [P] [US2] Test CT-142-105 inertness in tests/parallel/142/ct-142-105-inertness.test.ts
  - proves: F142-FR-005
  - rules: PU-04, PU-98
- [x] T033 [P] [US2] Test CT-142-112 check-check in tests/parallel/142/ct-142-112-check-check.test.ts
  - proves: F142-FR-012
  - rules: PU-79
- [x] T034 [P] [US2] Test CT-142-113 check-links in tests/parallel/142/ct-142-113-check-links.test.ts
  - proves: F142-FR-013
  - rules: PU-84
- [x] T035 [P] [US2] Test CT-142-114 check-jobs in tests/parallel/142/ct-142-114-check-jobs.test.ts
  - proves: F142-FR-014
  - rules: PU-92
- [x] T036 [P] [US2] Test CT-142-115 check-resource in tests/parallel/142/ct-142-115-check-resource.test.ts
  - proves: F142-FR-015
  - rules: PU-37
- [x] T037 [P] [US2] Test CT-142-116 check-headroom in tests/parallel/142/ct-142-116-check-headroom.test.ts
  - proves: F142-FR-016
  - rules: PU-30, PU-39, PU-87, PU-88
- [x] T038 [P] [US2] Test CT-142-117 plan-frozen-and-printed in tests/parallel/142/ct-142-117-plan-frozen-and-printed.test.ts
  - proves: F142-FR-017
  - rules: PU-15, PU-98
- [x] T039 [P] [US2] Test CT-142-120 tested-harness-adapter-with-concurrent-sessions in tests/parallel/142/ct-142-120-tested-harness-adapter-with-concurrent-sessions.test.ts
  - proves: F142-FR-020
  - rules: PU-40
- [x] T040 [P] [US2] Test CT-142-125 events-of-the-layer in tests/parallel/142/ct-142-125-events-of-the-layer.test.ts
  - proves: F142-FR-025
  - cases: `parallel.admission` carries `taskId` and the verdict of every check; `parallel.integration` carries `step` and `pathCount` and no path text
  - rules: PU-58

### Implementation for User Story 2

- [x] T041 [P] [US2] Register the layer only with `loop.parallel.units` on; record the value in the run record (F142-FR-001), in packages/layer-parallel/src/register.ts
- [x] T042 [P] [US2] Evaluate the eight preconditions and announce the fallback reason (F142-FR-002), in packages/layer-parallel/src/preconditions.ts
- [x] T043 [US2] Require containment C2 unless `loop.parallel.allow_detect` is set in user configuration; ignore the key from the environment, a flag and project configuration; state `protection=detect` (F142-FR-003), in packages/layer-parallel/src/preconditions.ts
- [x] T044 [P] [US2] Map every failure inside a group to one of the three ends (F142-FR-004), in packages/layer-parallel/src/decide.ts
- [x] T045 [US2] Call no service and write no file with the option off or with no group started (F142-FR-005), in packages/layer-parallel/src/register.ts
- [x] T046 [P] [US2] Admit a group only with a non-empty inner check set (F142-FR-012), in packages/layer-parallel/src/admission.ts
- [x] T047 [US2] Make tasks behind a link that leaves the tree serial (F142-FR-013), in packages/layer-parallel/src/admission.ts
- [x] T048 [US2] Start no group while an adoptable detached job lives (F142-FR-014), in packages/layer-parallel/src/admission.ts
- [x] T049 [US2] Allow no group in a phase that names an exclusive resource without capacity (F142-FR-015), in packages/layer-parallel/src/admission.ts
- [x] T050 [US2] Check quota utilisation, budget, disk and cycles (F142-FR-016), in packages/layer-parallel/src/admission.ts
- [x] T051 [P] [US2] Compute and hash the plan at launch and hand it to the engine, which stores it; print it in the dry run and the doctor (F142-FR-017), in packages/layer-parallel/src/plan.ts
- [x] T052 [US2] Read `concurrentSessions` and the state of the harness from the registry (F142-FR-020), in packages/layer-parallel/src/preconditions.ts
- [x] T053 [US2] Ask the engine to emit the `parallel.*` events with `workerId` and `wseq` (F142-FR-025), in packages/layer-parallel/src/decide.ts

**Checkpoint**: user story 2 can be tested by itself.

## Phase 5: User Story 3 - Gate integrity holds (P1)

**Goal**: No group is kept unchecked, no unaudited delta is accepted, and the critic cannot tell.

**Independent Test**: quickstart.md section 4

### Tests for User Story 3

- [x] T054 [P] [US3] Vocabulary test over every input of a critic-class call of every parallel fixture, against contracts/vocabulary.json, in tests/parallel/142/vocabulary.test.ts
  - proves: F142-FR-066; F142-SC-005
  - rules: PU-83
- [x] T055 [P] [US3] Event test: no model call lies between the barrier of a group and the end of its merge check in the events of any parallel fixture, in tests/parallel/142/no-model-merges.test.ts
  - proves: F142-SC-003
  - rules: PU-47, PU-80
- [x] T056 [P] [US3] Subset test: exit codes, stop reasons and run states over all parallel fixtures against the same fixtures with the option off, in tests/parallel/142/subsets.test.ts
  - proves: F142-FR-004; F142-SC-009
  - rules: PU-03
- [x] T057 [P] [US3] Test CT-142-106 withheld-from-the-layer in tests/parallel/142/ct-142-106-withheld-from-the-layer.test.ts
  - proves: F142-FR-006
  - rules: PU-06, PU-07, PU-08
- [x] T058 [P] [US3] Test CT-142-154 scope-audit in tests/parallel/142/ct-142-154-scope-audit.test.ts
  - proves: F142-FR-054
  - rules: PU-43
- [x] T059 [P] [US3] Test CT-142-155 protected-set-audit in tests/parallel/142/ct-142-155-protected-set-audit.test.ts
  - proves: F142-FR-055
  - rules: PU-44
- [x] T060 [P] [US3] Test CT-142-156 path-leak-audit in tests/parallel/142/ct-142-156-path-leak-audit.test.ts
  - proves: F142-FR-056
  - rules: PU-82
- [x] T061 [P] [US3] Test CT-142-157 single-writer-files in tests/parallel/142/ct-142-157-single-writer-files.test.ts
  - proves: F142-FR-057
  - rules: PU-45
- [x] T062 [P] [US3] Test CT-142-158 refusal-reasons in tests/parallel/142/ct-142-158-refusal-reasons.test.ts
  - proves: F142-FR-058
  - rules: PU-43 to PU-47, PU-82, PU-96
- [x] T063 [P] [US3] Test CT-142-160 empty-inner-set in tests/parallel/142/ct-142-160-empty-inner-set.test.ts
  - proves: F142-FR-060; F142-SC-004
  - rules: PU-79
- [x] T064 [P] [US3] Test CT-142-162 gate-is-not-replaced in tests/parallel/142/ct-142-162-gate-is-not-replaced.test.ts
  - proves: F142-FR-062
  - rules: PU-51
- [x] T065 [P] [US3] Test CT-142-163 fingerprints-of-a-group in tests/parallel/142/ct-142-163-fingerprints-of-a-group.test.ts
  - proves: F142-FR-063
  - rules: PU-53, PU-94
- [x] T066 [P] [US3] Test CT-142-164 frozen-workspace in tests/parallel/142/ct-142-164-frozen-workspace.test.ts
  - proves: F142-FR-064
  - rules: PU-54
- [x] T067 [P] [US3] Test CT-142-165 critic-sees-one-unit in tests/parallel/142/ct-142-165-critic-sees-one-unit.test.ts
  - proves: F142-FR-065; F142-SC-005
  - rules: PU-60
- [x] T068 [P] [US3] Test CT-142-166 neutral-kinds-and-vocabulary in tests/parallel/142/ct-142-166-neutral-kinds-and-vocabulary.test.ts
  - proves: F142-FR-066
  - rules: PU-61, PU-83
- [x] T069 [P] [US3] Test CT-142-167 history-withheld in tests/parallel/142/ct-142-167-history-withheld.test.ts
  - proves: F142-FR-067
  - rules: PU-61
- [x] T070 [P] [US3] Test CT-142-168 no-file-times-set in tests/parallel/142/ct-142-168-no-file-times-set.test.ts
  - proves: F142-FR-068
  - rules: ruling P9
- [x] T071 [P] [US3] Test CT-142-169 what-a-proposer-is-told in tests/parallel/142/ct-142-169-what-a-proposer-is-told.test.ts
  - proves: F142-FR-069
  - rules: PU-103
- [x] T072 [P] [US3] Test CT-142-170 no-worker-tree-at-a-critic-call in tests/parallel/142/ct-142-170-no-worker-tree-at-a-critic-call.test.ts
  - proves: F142-FR-070
  - rules: PU-63, PU-91
- [x] T073 [P] [US3] Test CT-142-171 breach-conditions in tests/parallel/142/ct-142-171-breach-conditions.test.ts
  - proves: F142-FR-071
  - rules: PU-66, PU-80

### Implementation for User Story 3

- [x] T074 [P] [US3] Declare directives and services; hold no writer, handle or writable path (F142-FR-006), in packages/layer-parallel/src/register.ts
- [x] T075 [P] [US3] Refuse a worker whose delta leaves its scope (F142-FR-054), in packages/core/src/parallel/audits.ts
- [x] T076 [US3] Refuse an unauthorised change of the protected set (F142-FR-055), in packages/core/src/parallel/audits.ts
- [x] T077 [US3] Search added and changed objects for real paths and the token (F142-FR-056), in packages/core/src/parallel/audits.ts
- [x] T078 [US3] Drop single-writer files from every delta (F142-FR-057), in packages/core/src/parallel/audits.ts
- [x] T079 [US3] Record one refusal reason of the closed set (F142-FR-058), in packages/core/src/parallel/audits.ts
- [x] T080 [P] [US3] Record `unchecked`, keep nothing, switch the layer off for the phase attempt (F142-FR-060), in packages/core/src/parallel/merge-check.ts
- [x] T081 [US3] Offer no result of a group for reuse at the verification gate (F142-FR-062), in packages/core/src/parallel/merge-check.ts
- [x] T082 [P] [US3] Record fingerprints (a) to (g) and assert the equalities (F142-FR-063), in packages/core/src/parallel/fingerprints.ts
- [x] T083 [US3] Apply nothing when the workspace changed during the group (F142-FR-064), in packages/core/src/parallel/fingerprints.ts
- [x] T084 [P] [US3] Contribute one unit per integrated group to the fact block (F142-FR-065), in packages/layer-parallel/src/facts.ts
- [x] T085 [US3] Raise the two neutral integrity kinds without a count (F142-FR-066), in packages/layer-parallel/src/facts.ts
- [x] T086 [US3] Withhold refusals, kills and failed merge checks from critic-class calls (F142-FR-067), in packages/layer-parallel/src/facts.ts
- [x] T087 [US3] Accept that the application sets no file times; assert it on the result of a group (F142-FR-068), in packages/core/src/parallel/audits.ts
- [x] T088 [P] [US3] Write the worker block, the reserved-tasks block and the neutral handoff (F142-FR-069), in packages/layer-parallel/src/blocks.ts
- [x] T089 [P] [US3] End processes and sweep once before a critic-class call (F142-FR-070), in packages/core/src/parallel/before-critic.ts
- [x] T090 [P] [US3] Check the five breach conditions on the event file (F142-FR-071), in packages/core/src/parallel/breach.ts

**Checkpoint**: user story 3 can be tested by itself.

## Phase 6: User Story 4 - An operator reads what a group cost (P2)

**Goal**: No outer count is spent by a worker, time is counted once, killed passes count as killed.

**Independent Test**: the counters of the outer loop before and after every group fixture

### Tests for User Story 4

- [x] T091 [P] [US4] Test CT-142-121 accounting in tests/parallel/142/ct-142-121-accounting.test.ts
  - proves: F142-FR-021
  - rules: PU-67, PU-69, PU-70, PU-79, PU-87
- [x] T092 [P] [US4] Test CT-142-122 killed-passes-and-loop-fields in tests/parallel/142/ct-142-122-killed-passes-and-loop-fields.test.ts
  - proves: F142-FR-022
  - rules: PU-71, PU-72, PU-97
- [x] T093 [P] [US4] Test CT-142-123 group-failures-and-harness-error in tests/parallel/142/ct-142-123-group-failures-and-harness-error.test.ts
  - proves: F142-FR-023
  - rules: PU-52, PU-89
- [x] T094 [P] [US4] Test CT-142-124 time-limits-of-worker-and-group in tests/parallel/142/ct-142-124-time-limits-of-worker-and-group.test.ts
  - proves: F142-FR-024
  - rules: R29 section F, kills and watchdogs

### Implementation for User Story 4

- [x] T095 [P] [US4] Charge cycles per admitted task, count wall time once, count group overhead in the inner-check budget (F142-FR-021), in packages/layer-parallel/src/decide.ts
- [x] T096 [US4] Report the keys `parallel`, `workers`, `groups`, `group-failures`, `refused`, `worker-caches`, `wall-hours`, `agent-hours` and the fallback reason at the call point `report` (F142-FR-022), in packages/layer-parallel/src/decide.ts
- [x] T097 [US4] Count failed groups; switch the layer off for the phase attempt after 2 or on a harness error (F142-FR-023), in packages/layer-parallel/src/decide.ts
- [x] T098 [US4] Request the proposal cap per worker pass and hold the unit cap per group (F142-FR-024), in packages/layer-parallel/src/decide.ts

**Checkpoint**: user story 4 can be tested by itself.

## Phase 7: User Story 5 - Experiment E6 (P3)

**Goal**: The safety experiment runs and reports.

**Independent Test**: quickstart.md section 6

### Tests for User Story 5

- [x] T099 [P] [US5] Test CT-142-172 experiment-e6-stubs in tests/parallel/142/ct-142-172-experiment-e6-stubs.test.ts
  - proves: F142-FR-072; F142-SC-008
  - rules: PU-104; ruling P10
- [x] T100 [P] [US5] Test CT-142-173 saving-stated in tests/parallel/142/ct-142-173-saving-stated.test.ts
  - proves: F142-FR-073
  - rules: R29 F-2, F-8; R29v V-27

### Implementation for User Story 5

- [x] T101 [P] [US5] Run FX-PAR-S and report failure classes, cost and killed passes (F142-FR-072), in tests/experiment/E6/run.ts
- [x] T102 [P] [US5] Print the ceiling and the statement of the expected saving with the plan (F142-FR-073), in packages/layer-parallel/src/plan.ts
- [x] T103 [US5] PAID, must be logged, not run in Stage B: run FX-PAR-L live with the arms serial, 2 workers and 4 workers on the phases fixed before the first run; log harness, model, passes, tokens and cost per arm in tests/experiment/E6/LOG.md; report without a pass mark for a default
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F142-FR-072; F142-SC-008
  - rules: PU-104; ruling P10

**Checkpoint**: user story 5 can be tested by itself.

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T104 [P] Register the doctor checks of the feature: the plan with the option on, resources it cannot check, the breach invariants, in packages/layer-parallel/src/doctor.ts
- [x] T105 [P] Write the documentation of the option: when it is worth switching on, the expected saving, the two channels that are narrowed and not closed (path leak, phase evidence), in docs/options/parallel-units.md
- [x] T106 Platform run on macOS of tests/parallel/142, tests/inertness/142 and tests/conformance/142; every macOS statement stays `unverified` until it passes; record the result in specs/142-parallel-units/research.md
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F142-FR-009
  - rules: ruling 67
- [x] T107 Record the three facts that the harness adapter features capture (file tools confined to a write root; several processes under one login; read denial outside the working tree) and update the `status:` fields of F142-FR-003, F142-FR-020 and F142-FR-070 in specs/142-parallel-units/spec.md
- [x] T108 [P] Add the static test that the layer package imports `contracts` and `kernel` only, that neither the layer package nor packages/core/src/parallel imports `node:fs` or `node:fs/promises`, and that no core file names the layer package `@specstride/layer-parallel`, in packages/layer-parallel/test/imports.test.ts
  - proves: F142-FR-006
  - rules: PU-06, PU-07
- [x] T109 Run quickstart.md sections 1 to 6 and record the results in specs/142-parallel-units/quickstart.md

## Dependencies & Execution Order

| Phase | Depends on |
|---|---|
| 1 Setup | Nothing |
| 2 Foundational | Phase 1 |
| 3 User Story 1 | Phase 2 |
| 4 User Story 2 | Phase 2; the planner of User Story 1 for the admission checks |
| 5 User Story 3 | User Story 1 (a group must run before its integrity can be tested) |
| 6 User Story 4 | User Story 1 |
| 7 User Story 5 | User Stories 1 to 4 |
| 8 Polish | Every story |

Within a story: tests first, and they fail before the implementation exists. Tasks on one file
run in the order of their numbers.

Outside this feature, each reached through a contract of feature 100: the engine services behind
the group directives and the tree store (annex D §D.1, §D.2), the inner check set and the check
runner (annex C §C.8, annex D §D.8), the process registry (annex B §B.10), the quota classifier
(annex C §C.13), the event envelope (annex X §X.1), the capabilities of the harness port
(annex C §C.1).

## Parallel Example: User Story 1

```text
Tests of different files, together:
  CT-142-107 marker-is-necessary
  CT-142-109 scope-form-and-comparison
  CT-142-159 merge-check
Implementation on different files, together:
  packages/layer-parallel/src/scope.ts
  packages/layer-parallel/src/admission.ts
  packages/core/src/parallel/merge-check.ts
```

## Implementation Strategy

MVP: phases 1 to 3, a group end to end on stubs, with the option reachable only in tests. The
option is offered to a consumer only after User Stories 2 and 3, since a group without its
audits and its fallbacks is not safe. User Story 5 comes before every release candidate.

