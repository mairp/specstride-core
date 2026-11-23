# Tasks: Check runner (feature 148)

**Input**: Design documents from `specs/148-check-runner/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested for every feature (`STAGE-B-RULES.md` section 3). Parity tests and characterization tests are required tasks. Test tasks of a phase come before its implementation tasks and must fail first. No task calls a model or a paid service; the feature inherits no spike, capture or probe.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- `proves:` as-is ids, or the requirement id for a new requirement; `fixture:` fixture families of feature 141, §O.2

## Phase 1: Setup

- [x] T001 Create the package of the check runner (layer L1) with its manifest, TypeScript configuration and the folders of plan.md in packages/check-runner/
- [x] T002 [P] Register the package in the import-boundary check with the imports `@specstride/contracts` and `@specstride/kernel` only, in tools/import-boundary/
- [x] T003 [P] Write env-allowlist.json (the names a command may see; no provider credential) in packages/check-runner/data/
- [x] T004 [P] Copy the contracts data of specs/148-check-runner/contracts/ into packages/check-runner/data/ and add a test that they equal the specification
- [x] T005 [P] Create the scripted commands (pass, fail at step n, slow, never ending, very large output, prints its environment, writes an undeclared file, changes a protected file) in tests/fixtures/148/commands/
- [x] T006 Extract the executor of the verification package of Lisa at `363e6a3` as source into packages/check-runner/src/command/ and record each extracted file with its licence check in packages/check-runner/EXTRACTED.md
- [x] T007 [P] Characterization test CT-148-2: the extracted Lisa executor behaves as extracted, in tests/characterization/148/CT-148-2.test.ts
  - proves: F148-FR-002 (kept Lisa behaviour; research.md D-1)

---

## Phase 2: Foundational

**Purpose**: the closed sets and the registry that every story uses

**⚠️ CRITICAL**: no story can start before this phase is complete

- [x] T008 Register the closed sets of rows 53, 54, 233 (members `TIMEOUT`, `EXEC_ERROR`), 235 and 236 of annex X §X.6 with their unknown-value branches in packages/check-runner/src/result/closed-sets.ts
- [x] T009 Register the rows 6, 7, 31 and 125 (environment allow-list, `verification.envAllowlist`) of the `parity` profile with their values under `parity` in packages/check-runner/src/registry/switches.ts; the rows 1 (`loop.strategy`, owner 115) and 25 (`sandbox.level`, owner 109) are read from their owners and are not registered here

---

## Phase 3: User Story 1 - A command of a check runs bounded and without credentials (Priority: P1) 🎯 MVP

**Goal**: the operations of EP-05 and the kind `command`.

**Independent Test**: the five scripted commands give the documented results.

### Tests

- [x] T010 [P] [US1] Characterization test CT-148-101 (runner operations and pin) in tests/characterization/148/CT-148-101.test.ts
  - proves: F148-FR-001
- [x] T011 [P] [US1] Parity test PT-148-C-080-command-run (the kind command) in tests/parity/148/PT-148-C-080-command-run.test.ts
  - proves: B-1120; B-1121; B-1124
  - fixture: FX-14, FX-15, FX-16
  - requirement: F148-FR-002
- [x] T012 [P] [US1] Characterization test CT-148-102 (the kind command) in tests/characterization/148/CT-148-102.test.ts
  - proves: F148-FR-002
- [x] T013 [P] [US1] Characterization test CT-148-103 (result conditions and reasons; which owner sets each condition; `interrupted` after `cancel`; conditions of another owner passed through unchanged) in tests/characterization/148/CT-148-103.test.ts
  - proves: F148-FR-003
- [x] T014 [P] [US1] Parity test PT-148-C-080-timeout-and-start-error (runner errors, time limit and start error) in tests/parity/148/PT-148-C-080-timeout-and-start-error.test.ts
  - proves: B-1122
  - fixture: FX-06
  - requirement: F148-FR-004
- [x] T015 [P] [US1] Characterization test CT-148-104 (runner errors, time limit and start error) in tests/characterization/148/CT-148-104.test.ts
  - proves: F148-FR-004
- [x] T016 [P] [US1] Characterization test CT-148-105 (one runner for every check; no check while a pass lives) in tests/characterization/148/CT-148-105.test.ts
  - proves: F148-FR-005
- [x] T017 [P] [US1] Characterization test CT-148-107 (events check.started and check.ended, with the fields of the catalogue) in tests/characterization/148/CT-148-107.test.ts
  - proves: F148-FR-007
- [x] T018 [P] [US1] Test of F148-SC-002 and F148-SC-003, CT-148-303: planted credentials, the time limit and the output cap, in tests/characterization/148/CT-148-303.test.ts
  - proves: F148-FR-002
- [x] T065 [P] [US1] Characterization test CT-148-119 (the environment of the kind command is given to a caller without starting a process, equal to the one a command gets, with no provider credential outside the `parity` profile; the runner starts no detached command) in tests/characterization/148/CT-148-119.test.ts
  - proves: F148-FR-019

### Implementation

- [x] T019 [US1] Implement runner operations and pin (F148-FR-001) in packages/check-runner/src/registry/
- [x] T020 [US1] Implement the kind command (F148-FR-002) in packages/check-runner/src/command/
- [x] T021 [US1] Implement result conditions and reasons (F148-FR-003) in packages/check-runner/src/result/
- [x] T022 [US1] Implement runner errors, time limit and start error (F148-FR-004) in packages/check-runner/src/result/
- [x] T023 [US1] Implement one runner for every check; no check while a pass lives (F148-FR-005) in packages/check-runner/src/guard/
- [x] T024 [US1] Implement events check.started and check.ended (F148-FR-007) in packages/check-runner/src/events/
- [x] T066 [US1] Implement the operation `environment` of the EP-05 interface (proposal P1 of analyze-report.md), used by the kind command itself (F148-FR-019; N-105-1) in packages/check-runner/src/command/ and packages/check-runner/src/registry/

**Checkpoint**: the kind `command` runs the five scripted commands with the documented results.

---

## Phase 4: User Story 2 - A result that was obtained against a changed tree is never a pass (Priority: P1)

**Goal**: the fingerprint bracket and the integrity rules with the layer off.

**Independent Test**: a command that changes a protected file; a changed manifest; a replaced executable.

### Tests

- [x] T025 [P] [US2] Characterization test CT-148-106 (fingerprint readings around gate commands and the protected-set fact; the containment level of a gate command, the one of the proposer or stricter, as at the baseline under `parity`; no count of tests in the fact block) in tests/characterization/148/CT-148-106.test.ts
  - proves: F148-FR-006
- [x] T026 [P] [US2] Characterization test CT-148-110 (integrity rules with the layer off; `integrity.noted` with the kind `manifest-hash`) in tests/characterization/148/CT-148-110.test.ts
  - proves: F148-FR-010
- [x] T027 [P] [US2] Test of F148-SC-005, CT-148-301: 0 results stated as a pass where the protected set, the manifest or a pin changed, in tests/characterization/148/CT-148-301.test.ts
  - proves: F148-FR-006; F148-FR-010

### Implementation

- [x] T028 [US2] Implement fingerprint readings around gate commands, the protected-set fact, the containment level of a gate command (the one of the proposer or stricter, as `start` receives it; row 25) and no count of tests in the fact block (F148-FR-006) in packages/check-runner/src/bracket/ and packages/check-runner/src/command/
- [x] T029 [US2] Implement integrity rules with the layer off (F148-FR-010) in packages/check-runner/src/guard/

---

## Phase 5: User Story 3 - An author adds a kind of runner without touching the core (Priority: P2)

**Goal**: the conformance suite and the sample of EP-05.

**Independent Test**: the sample passes the suite and no core file names it.

### Tests

- [x] T030 [P] [US3] Conformance test CT-148-118: conformance suite of EP-05 (pass, fail at step n, slow, never ending, very large output) in packages/testkit/src/conformance/EP-05/
  - proves: F148-FR-018; F148-FR-001
- [x] T031 [P] [US3] Test of F148-SC-004, CT-148-305: the build with the sample and the build without it differ in 0 core files, in tests/characterization/148/CT-148-305.test.ts
  - proves: F148-FR-018

### Implementation

- [x] T032 [US3] Sample check runner outside the core, registered from the test tree (F148-FR-018), in packages/testkit/src/samples/EP-05/
- [x] T033 [US3] Plainer path for a runner that throws, runs over its time or returns a value outside its sets (F148-FR-018) in packages/check-runner/src/registry/degrade.ts

---

## Phase 6: User Story 4 - Independent commands run side by side, and the result does not change (Priority: P3)

**Goal**: `verification.parallelism`, off by default (value 1).

**Independent Test**: equal results, signatures and fact contributions with the values 1 and 3.

### Tests

- [x] T034 [P] [US4] Characterization test CT-148-111 (parallelism parameter and admission) in tests/characterization/148/CT-148-111.test.ts
  - proves: F148-FR-011
- [x] T035 [P] [US4] Characterization test CT-148-112 (batch formation; every admission and refusal in an event `check.admission`) in tests/characterization/148/CT-148-112.test.ts
  - proves: F148-FR-012
- [x] T036 [P] [US4] Characterization test CT-148-113 (isolation inside a batch) in tests/characterization/148/CT-148-113.test.ts
  - proves: F148-FR-013
- [x] T037 [P] [US4] Characterization test CT-148-114 (fingerprint pair of a batch; the lowered parallelism, the event `check.parallelism_lowered` and the field `verificationParallelism` read at a later engine start; in start mode `child` the value reaches the terminal record, and with a synthesized terminal record it is derived from the event) in tests/characterization/148/CT-148-114.test.ts
  - proves: F148-FR-014
- [x] T038 [P] [US4] Characterization test CT-148-115 (run to the end; order by manifest position) in tests/characterization/148/CT-148-115.test.ts
  - proves: F148-FR-015
- [x] T039 [P] [US4] Characterization test CT-148-116 (second execution alone of a failed command) in tests/characterization/148/CT-148-116.test.ts
  - proves: F148-FR-016
- [x] T040 [P] [US4] Characterization test CT-148-117 (fields `batch`, `slot` and `concurrent` of check events) in tests/characterization/148/CT-148-117.test.ts
  - proves: F148-FR-017
- [x] T041 [P] [US4] Own test CT-148-201: a build that writes a directory and a test that reads it are never in one batch, in tests/characterization/148/CT-148-201.test.ts
  - proves: F148-FR-011
- [x] T042 [P] [US4] Own test CT-148-202: a command without a declaration never shares a batch, in tests/characterization/148/CT-148-202.test.ts
  - proves: F148-FR-011
- [x] T043 [P] [US4] Own test CT-148-203: a command declared free of side effects that writes a file taints the batch and sets the parallelism to 1, in tests/characterization/148/CT-148-203.test.ts
  - proves: F148-FR-014
- [x] T044 [P] [US4] Own test CT-148-204: a batch whose first command fails at once lets the second run to its end, in tests/characterization/148/CT-148-204.test.ts
  - proves: F148-FR-015
- [x] T045 [P] [US4] Own test CT-148-205: two fixtures with opposite completion orders give equal failure signatures, in tests/characterization/148/CT-148-205.test.ts
  - proves: F148-FR-015
- [x] T046 [P] [US4] Own test CT-148-206: two commands that print 10 MB each give two capped captures, in tests/characterization/148/CT-148-206.test.ts
  - proves: F148-FR-013
- [x] T047 [P] [US4] Own test CT-148-207: every fixture gives equal results, signatures and fact contributions with parallelism 1 and 3 (F148-SC-001), in tests/characterization/148/CT-148-207.test.ts
  - proves: F148-FR-015
- [x] T064 [P] [US4] Own test CT-148-208: declarations are taken from the check manifest only; a declaration of reads and writes in a file of the repository is never read, and an entry of the manifest without a declaration runs alone (CQ-190), in tests/characterization/148/CT-148-208.test.ts
  - proves: F148-FR-011

### Implementation

- [x] T048 [US4] Implement parallelism parameter and admission (F148-FR-011) in packages/check-runner/src/batch/
- [x] T049 [US4] Implement batch formation and the event `check.admission` for every admission and refusal (F148-FR-012) in packages/check-runner/src/batch/
- [x] T050 [US4] Implement isolation inside a batch (F148-FR-013) in packages/check-runner/src/batch/
- [x] T051 [US4] Implement fingerprint pair of a batch and the lowered parallelism, with the event `check.parallelism_lowered`, the field `verificationParallelism` of the run record and, for an engine in start mode `child`, of the terminal record (F148-FR-014; CQ-180; proposal P2 of analyze-report.md) in packages/check-runner/src/batch/
- [x] T052 [US4] Implement run to the end; order by manifest position (F148-FR-015) in packages/check-runner/src/batch/
- [x] T053 [US4] Implement the second execution alone of a failed command (F148-FR-016) in packages/check-runner/src/batch/
- [x] T054 [US4] Implement batch fields of check events (F148-FR-017) in packages/check-runner/src/events/

---

## Phase 7: User Story 5 - A long command of many steps stops at its first failed step (Priority: P3)

**Goal**: the option `verification.step_runner`, off by default.

**Independent Test**: a command of 40 steps whose step 35 fails; a resumed execution from step 35 is `partial`.

### Tests

- [x] T055 [P] [US5] Characterization test CT-148-108 (step runner) in tests/characterization/148/CT-148-108.test.ts
  - proves: F148-FR-008
- [x] T056 [P] [US5] Characterization test CT-148-109 (a `partial` run of steps, resumed from a later step) in tests/characterization/148/CT-148-109.test.ts
  - proves: F148-FR-009

### Implementation

- [x] T057 [US5] Implement step runner (F148-FR-008) in packages/check-runner/src/steps/
- [x] T058 [US5] Implement the `partial` run of steps (F148-FR-009) in packages/check-runner/src/steps/

---

## Phase 8: Polish & cross-cutting

- [x] T059 [P] Test of F148-SC-006, PT-148-C-080-suite: 0 results different for the fields of a command result on FX-06, FX-14, FX-15 and FX-16 under the parity profile, in tests/parity/148/PT-148-C-080-suite.test.ts
  - proves: B-1120; B-1121; B-1122; B-1124
  - fixture: FX-06, FX-14, FX-15, FX-16
- [x] T060 [P] Test of F148-SC-007, CT-148-304: every as-is id that moved to this feature is named by a `proves:` of this file, in tests/characterization/148/CT-148-304.test.ts
  - proves: F148-FR-002; F148-FR-004
- [x] T061 Run the conformance suite on the macOS runner and record the `unverified` fact about process groups with date and version in specs/148-check-runner/research.md
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T062 [P] Measure the performance starting values of plan.md in the build and record them in packages/check-runner/README.md
- [x] T063 Run the scenarios of specs/148-check-runner/quickstart.md and record the result

---

## Dependencies & Execution Order

| Phase | Depends on | Note |
|---|---|---|
| 1 Setup | Feature 100 (`contracts`, `kernel`, `testkit` frames) | — |
| 2 Foundational | 1 | Blocks every story |
| 3 US1 | 2 | The MVP. T065 and T066 need the operation that gives the environment in the EP-05 interface of feature 100 (annex C §C.8; the interface types of EP-05 in `@specstride/contracts`); on 2026-09-30 annex C §C.8 states `pin`, `start`, `poll`, `result` and `cancel` only, and proposal P1 of `analyze-report.md` adds `environment`. Until feature 100 has applied P1, T065 is a skip with its reason and T066 stays open; this feature writes no file of `packages/contracts/` |
| 4 US2 | 3; the protected set of its owner, feature 116, through EP-16 | Until that exists the tests use a fake reading |
| 5 US3 | 3 | — |
| 6 US4 | 3, 4; for T037 and T051 in start mode `child`, proposal P2 of `analyze-report.md` applied by feature 100 (until then that case of T037 is a skip with its reason) | The events `check.admission` and `check.parallelism_lowered` and the fields `batch`, `slot`, `concurrent` need their rows in the event catalogue of feature 111; until then the tests that read them are a skip with its reason |
| 7 US5 | 3 | — |
| 8 Polish | All | — |

Parity tests need the stubs and fixture families of feature 141 and a check manifest or a
verification plan from their owner. Until those exist, a parity test is a skip with its reason,
never a pass.

### Parallel opportunities

Every test task marked [P] writes a file of its own. US3, US4 and US5 can be built by different
people once phase 3 is complete.

### Parallel example: User Story 4

```text
Own tests CT-148-201 to CT-148-208 and CT-148-111 to CT-148-117: all [P]
Then: admission → formation → isolation → bracket → order → second execution → events
```

## Implementation Strategy

| Step | Content |
|---|---|
| MVP | Phases 1 to 3: the kind `command` with its bounds |
| Second | Phases 4 and 5: integrity, and the proof of the extension point |
| Third | Phases 6 and 7: the two options that are off by default |
| Last | Phase 8 |

