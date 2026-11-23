# Tasks: Parallel engine services (feature 143)

**Input**: Design documents from `specs/143-parallel-engine-services/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested. This feature has no parity test and no characterization test of an as-is
behaviour: no as-is id is assigned to it, and its services are not called under the `parity`
profile. A test task names what it proves.

**Place of tests**: the tests `CT-143-<n>` in `tests/characterization/143/`; `tests/parity/143/`
holds no test; the behaviour cases of the tree-store service (CT-143-129) in the folder of EP-04
of the test kit, `packages/testkit/src/conformance/EP-04/`, beside the contract tests of feature
100. No task of this feature writes a file of a package that another feature owns alone.

**Organization**: by user story of `spec.md`. `[P]` marks a task that touches a file no unfinished
task touches. `rules:` names the rules of R29 and R29v that a test covers.

Stage B writes no product code. These tasks are for the implementation that follows.

## Phase 1: Setup

- [x] T001 Test CT-143-132, the probe of the tree store: a workspace with uncommitted, untracked and ignored files; a store; a snapshot; a worker tree with a repository of its own; hashes of the project's repository directory equal before and after, in tests/characterization/143/ct-143-132-probe.test.ts
  - proves: F143-FR-002; F143-SC-001
  - rules: R29 F-6; PU-20
- [x] T002 Establish the git floor: run the probe of T001 on the floor version of research.md D-3 and record the result in specs/143-parallel-engine-services/research.md
- [x] T003 Create the package packages/tree-store and the directory packages/core/src/parallel, with the import rules of the package graph
- [x] T004 [P] Copy the data of specs/143-parallel-engine-services/contracts/ into packages/tree-store/data/ and add a test that compares it with spec.md, in packages/tree-store/test/data.test.ts
- [x] T005 [P] Add the doctor check for git and its version to the doctor check registry, in packages/tree-store/src/doctor.ts

## Phase 2: Foundational

- [x] T006 Register the thirteen ledger record kinds of the namespace `parallel` with the data of each, in packages/core/src/parallel/ledger-kinds.ts
- [x] T007 [P] Implement the one place that starts git with the fixed environment, in packages/tree-store/src/git.ts
- [x] T008 [P] Build the stub worker of the test tree: scripted edits, checkpoint, yield, commit, left-behind process, quota signal, harness error, in tests/characterization/143/support/stub-worker.ts
- [x] T009 [P] Build the scripted trees for the tree-store conformance, in packages/testkit/src/conformance/EP-04/support/trees.ts
- [x] T010 Test CT-143-129, conformance of the tree-store service with scripted trees: seven operations; no operation writes a workspace path outside `apply`, in packages/testkit/src/conformance/EP-04/ct-143-129-tree-store.test.ts
  - proves: F143-FR-001
  - rules: PU-19

## Phase 3: User Story 1 - The engine runs and integrates a group (P1)

**Goal**: A group runs from `requestPassGroup` to `integrateGroup`: trees, workers, barrier, composition, application, ticks.

**Independent Test**: quickstart.md section 3

### Tests for User Story 1

- [x] T011 [P] [US1] Test CT-143-101 tree-store-operations in tests/characterization/143/ct-143-101-tree-store-operations.test.ts
  - proves: F143-FR-001
  - rules: PU-19, PU-80
- [x] T012 [P] [US1] Test CT-143-105 worker-root-and-opaque-paths in tests/characterization/143/ct-143-105-worker-root-and-opaque-paths.test.ts
  - proves: F143-FR-005
  - rules: PU-22, PU-82
- [x] T013 [P] [US1] Test CT-143-106 worker-tree-is-its-own-repository in tests/characterization/143/ct-143-106-worker-tree-is-its-own-repository.test.ts
  - proves: F143-FR-006
  - rules: PU-23; ruling P6
- [x] T014 [P] [US1] Test CT-143-107 seed-paths in tests/characterization/143/ct-143-107-seed-paths.test.ts
  - proves: F143-FR-007
  - rules: PU-24
- [x] T015 [P] [US1] Test CT-143-108 workspace-part-of-a-worker in tests/characterization/143/ct-143-108-workspace-part-of-a-worker.test.ts
  - proves: F143-FR-008
  - rules: PU-25, PU-94
- [x] T016 [P] [US1] Test CT-143-109 environment-of-a-worker in tests/characterization/143/ct-143-109-environment-of-a-worker.test.ts
  - proves: F143-FR-009
  - rules: PU-28, PU-82, PU-85, PU-97
- [x] T017 [P] [US1] Test CT-143-110 one-process-per-worker in tests/characterization/143/ct-143-110-one-process-per-worker.test.ts
  - proves: F143-FR-010
  - rules: PU-32, PU-26
- [x] T018 [P] [US1] Test CT-143-111 worker-session-rules in tests/characterization/143/ct-143-111-worker-session-rules.test.ts
  - proves: F143-FR-011
  - rules: PU-33, PU-34, PU-35, PU-36
- [x] T019 [P] [US1] Test CT-143-112 worker-outcomes in tests/characterization/143/ct-143-112-worker-outcomes.test.ts
  - proves: F143-FR-012
  - rules: PU-35, PU-50
- [x] T020 [P] [US1] Test CT-143-113 restart-once in tests/characterization/143/ct-143-113-restart-once.test.ts
  - proves: F143-FR-013
  - rules: PU-35
- [x] T021 [P] [US1] Test CT-143-114 killed-work-discarded in tests/characterization/143/ct-143-114-killed-work-discarded.test.ts
  - proves: F143-FR-014
  - rules: PU-27, PU-35; ruling P5
- [x] T022 [P] [US1] Test CT-143-117 barrier in tests/characterization/143/ct-143-117-barrier.test.ts
  - proves: F143-FR-017
  - rules: PU-41, PU-42, PU-96
- [x] T023 [P] [US1] Test CT-143-119 composition in tests/characterization/143/ct-143-119-composition.test.ts
  - proves: F143-FR-019
  - rules: PU-47, PU-80
- [x] T024 [P] [US1] Test CT-143-120 application in tests/characterization/143/ct-143-120-application.test.ts
  - proves: F143-FR-020
  - rules: PU-47, PU-54; ruling P1
- [x] T025 [P] [US1] Test CT-143-121 ticks in tests/characterization/143/ct-143-121-ticks.test.ts
  - proves: F143-FR-021
  - rules: PU-46, PU-94
- [x] T026 [P] [US1] Test CT-143-122 staleness-ignores-ticks in tests/characterization/143/ct-143-122-staleness-ignores-ticks.test.ts
  - proves: F143-FR-022
  - rules: PU-94; ruling K3

### Implementation for User Story 1

- [x] T027 [P] [US1] Offer exactly the seven operations; only `apply` writes the workspace (F143-FR-001), in packages/tree-store/src/index.ts
- [x] T028 [P] [US1] Create worker trees under the worker root with one opaque component, owner only (F143-FR-005), in packages/tree-store/src/materialize.ts
- [x] T029 [US1] Give each worker tree a repository of its own that borrows the store read-only (F143-FR-006), in packages/tree-store/src/materialize.ts
- [x] T030 [US1] Copy seed paths; keep ignored paths absent; keep both out of deltas (F143-FR-007), in packages/tree-store/src/materialize.ts
- [x] T031 [P] [US1] Write the outbox and the handoff of a worker; keep the task list in snapshots and out of deltas (F143-FR-008), in packages/core/src/parallel/group-executor.ts
- [x] T032 [US1] Set the opaque token, the run token and the temporary directory; state `worker-caches` (F143-FR-009), in packages/core/src/parallel/group-executor.ts
- [x] T033 [US1] Start workers in process groups of their own, registered as owned, at most `workers` at a time (F143-FR-010), in packages/core/src/parallel/group-executor.ts
- [x] T034 [US1] Fresh session, base model tier, one proposal, no yield; fresh main-line pass after an applied group (F143-FR-011), in packages/core/src/parallel/group-executor.ts
- [x] T035 [P] [US1] Derive the outcome of a worker from its checkpoint and its end (F143-FR-012), in packages/core/src/parallel/barrier.ts
- [x] T036 [US1] Restart a worker once after an interruption it did not cause (F143-FR-013), in packages/core/src/parallel/group-executor.ts
- [x] T037 [P] [US1] Leave the work of a killed worker out of integration; keep its snapshot until the phase attempt ends (F143-FR-014), in packages/core/src/parallel/integrate.ts
- [x] T038 [US1] Take final snapshots at the end of each worker; fingerprint again at the barrier (F143-FR-017), in packages/core/src/parallel/barrier.ts
- [x] T039 [P] [US1] Compose disjoint deltas in task order; refuse a shared path with `overlap` (F143-FR-019), in packages/tree-store/src/compose.ts
- [x] T040 [P] [US1] Write exactly the paths of audited deltas, write-ahead, onto a workspace equal to the base (F143-FR-020), in packages/tree-store/src/apply.ts
- [x] T041 [US1] Tick the integrated tasks through the spec-format adapter under `ticks_applied` (F143-FR-021), in packages/core/src/parallel/integrate.ts
- [x] T042 [US1] Check staleness of a worker pass on the workspace's files with the hash that ignores checkboxes (F143-FR-022), in packages/core/src/parallel/group-executor.ts
- [x] T073 [P] [US1] Give the delta between two tree ids by name and status, from the files only, with no rename detected (F143-FR-006, F143-FR-019), in packages/tree-store/src/changed.ts

**Checkpoint**: user story 1 can be tested by itself.

## Phase 4: User Story 2 - The project's repository and the store stay untouched (P1)

**Goal**: Nothing is written under the project's repository directory; no worker can write the store; no filter or hook runs.

**Independent Test**: quickstart.md sections 1 and 2

### Tests for User Story 2

- [X] T043 [P] [US2] Test CT-143-102 project-repository-untouched in tests/characterization/143/ct-143-102-project-repository-untouched.test.ts
  - proves: F143-FR-002; F143-SC-001
  - rules: PU-20
- [X] T044 [P] [US2] Test CT-143-103 snapshots-and-store-commits in tests/characterization/143/ct-143-103-snapshots-and-store-commits.test.ts
  - proves: F143-FR-003
  - rules: PU-21, PU-29, PU-100; ruling P1
- [X] T045 [P] [US2] Test CT-143-104 hardened-repository-processes in tests/characterization/143/ct-143-104-hardened-repository-processes.test.ts
  - proves: F143-FR-004
  - rules: PU-81

### Implementation for User Story 2

- [X] T046 [P] [US2] Keep the store in the control plane and write nothing under the project's repository directory (F143-FR-002), in packages/tree-store/src/git.ts
- [X] T047 [P] [US2] Snapshot the fingerprint scope with fixed commit data; copy unreachable objects; verify objects (F143-FR-003), in packages/tree-store/src/snapshot.ts and packages/tree-store/src/verify.ts
- [X] T048 [US2] Run git with the fixed environment and compare the store configuration with its hash (F143-FR-004), in packages/tree-store/src/git.ts

**Checkpoint**: user story 2 can be tested by itself.

## Phase 5: User Story 3 - A run survives a crash, a stop and a pause (P2)

**Goal**: A group survives an interruption in each of its states.

**Independent Test**: quickstart.md sections 4 to 6

### Tests for User Story 3

- [x] T049 [P] [US3] Test CT-143-130, the kill test: the engine killed after each of the thirteen ledger records; every relaunched run ends in the tree and the kept units of work of the uninterrupted run, or rests with the loop layer off for the run and its event, in tests/characterization/143/ct-143-130-kill-matrix.test.ts
  - proves: F143-SC-002; F143-FR-025
  - rules: PU-65, PU-94, PU-95
- [x] T050 [P] [US3] Test CT-143-131, property test of the queue: 4 streams of 10,000 records at random intervals; 40,000 lines, `seq` 1 to 40,000, no torn line, `wseq` rising per worker; the same with the engine killed, in tests/characterization/143/ct-143-131-queue.property.test.ts
  - proves: F143-FR-024
  - rules: PU-57
- [x] T051 [P] [US3] Test CT-143-115 group-pause in tests/characterization/143/ct-143-115-group-pause.test.ts
  - proves: F143-FR-015; F143-SC-003
  - rules: PU-38
- [x] T052 [P] [US3] Test CT-143-116 spending-limit-under-a-hard-cap in tests/characterization/143/ct-143-116-spending-limit-under-a-hard-cap.test.ts
  - proves: F143-FR-016
  - rules: PU-88
- [x] T053 [P] [US3] Test CT-143-118 holders-of-the-run-token in tests/characterization/143/ct-143-118-holders-of-the-run-token.test.ts
  - proves: F143-FR-018
  - rules: PU-90
- [x] T054 [P] [US3] Test CT-143-123 ledger-records-and-one-writer in tests/characterization/143/ct-143-123-ledger-records-and-one-writer.test.ts
  - proves: F143-FR-023
  - rules: PU-55, PU-56, PU-94, PU-98
- [x] T055 [P] [US3] Test CT-143-124 queue-and-pass-ordinal in tests/characterization/143/ct-143-124-queue-and-pass-ordinal.test.ts
  - proves: F143-FR-024
  - rules: PU-57, PU-59, PU-98
- [x] T056 [P] [US3] Test CT-143-125 resume-states in tests/characterization/143/ct-143-125-resume-states.test.ts
  - proves: F143-FR-025; F143-SC-002
  - rules: PU-65, PU-94, PU-95
- [x] T057 [P] [US3] Test CT-143-126 stop-with-a-group-live in tests/characterization/143/ct-143-126-stop-with-a-group-live.test.ts
  - proves: F143-FR-026
  - rules: PU-93
- [x] T058 [P] [US3] Test CT-143-127 clean-up in tests/characterization/143/ct-143-127-clean-up.test.ts: `release` removes the tree and its temporary directory and leaves the store as it was; snapshots leave the store with `sweep` (CQ-237)
  - proves: F143-FR-027
  - rules: PU-27, PU-93
- [x] T059 [P] [US3] Test CT-143-128 counters-of-the-layer in tests/characterization/143/ct-143-128-counters-of-the-layer.test.ts
  - proves: F143-FR-028
  - rules: PU-64

### Implementation for User Story 3

- [x] T060 [P] [US3] Pause the whole group on a quota signal, with one pause record and one event (F143-FR-015), in packages/core/src/parallel/group-executor.ts
- [x] T061 [US3] Pass a process-level spending limit; evaluate the cap on the sum over live workers (F143-FR-016), in packages/core/src/parallel/group-executor.ts
- [x] T062 [P] [US3] End holders of the run token at engine start and `resume`; record lost streams with unknown usage (F143-FR-018), in packages/core/src/parallel/resume.ts
- [x] T063 [P] [US3] Write the thirteen record kinds ahead, through the one writer (F143-FR-023), in packages/core/src/parallel/integrate.ts
- [x] T064 [P] [US3] Pass records of N stream readers through one queue; assign `seq` at the append (F143-FR-024), in packages/core/src/parallel/queue.ts
- [x] T065 [US3] Decide from the last ledger record, in the eight states (F143-FR-025), in packages/core/src/parallel/resume.ts
- [x] T066 [US3] Let a group close before `stop` takes effect; end workers on `stop --now` (F143-FR-026), in packages/core/src/parallel/group-executor.ts
- [x] T067 [P] [US3] Remove stale trees, trees at group close, orphans at engine start, the store at run end (F143-FR-027); stale trees and trees at group close through `release`, the rest through `sweep`, in packages/tree-store/src/release.ts and packages/tree-store/src/sweep.ts
- [x] T068 [P] [US3] Keep the counters in the ledger; continue after resume; reset with the reset flag (F143-FR-028), in packages/core/src/parallel/counters.ts

**Checkpoint**: user story 3 can be tested by itself.

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T069 [P] Register the doctor checks of the feature: holders of the run token, `worker-caches=shared`, the store configuration hash, in packages/tree-store/src/doctor.ts
- [x] T070 Platform run on macOS of tests/characterization/143 and the cases of this feature in packages/testkit/src/conformance/EP-04; every macOS statement stays `unverified` until it passes; record the result in specs/143-parallel-engine-services/research.md D-7
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F143-FR-005; F143-FR-007; F143-FR-010
  - rules: ruling 67
- [x] T071 [P] Add the static test that no file of packages/core/src/parallel starts a process or imports `node:fs` or `node:fs/promises`, and that the tree store is reached only through its interface, in packages/tree-store/test/imports.test.ts
  - proves: F143-FR-001
  - rules: PU-06, PU-07
- [x] T072 Run quickstart.md sections 1 to 6 and record the results in specs/143-parallel-engine-services/quickstart.md

## Dependencies & Execution Order

| Phase | Depends on |
|---|---|
| 1 Setup | Nothing. T001 is the first task |
| 2 Foundational | Phase 1 |
| 3 User Story 1 | Phase 2 |
| 4 User Story 2 | Phase 2; the store operations of User Story 1 for the hardening tests |
| 5 User Story 3 | User Story 1 (a group must run before it can be interrupted) |
| 6 Polish | Every story |

Within a story: tests first, and they fail before the implementation exists. Tasks on one file
run in the order of their numbers.

Outside this feature, each reached through a contract of feature 100: the core side of the group
directives (annex D §D.1), the harness port (annex C §C.1), the spec-format adapter (annex C
§C.7), the process registry (annex B §B.10), the pause record (annex B §B.17), the ledger
(annex B §B.13), the event envelope (annex X §X.1).

## Parallel Example: User Story 1

```text
Tests of different files, together:
  CT-143-105 worker-root-and-opaque-paths
  CT-143-119 composition
  CT-143-121 ticks
Implementation on different files, together:
  packages/tree-store/src/materialize.ts
  packages/tree-store/src/compose.ts
  packages/core/src/parallel/barrier.ts
```

## Implementation Strategy

MVP: phases 1 to 3, a group end to end on stubs through the sample layer of the loop-layer
conformance suite. User Story 2 comes before any run on a real project, since it proves the
conditions of ruling P1. User Story 3 comes before the option is offered to a consumer.

