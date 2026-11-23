---
description: "Task list of feature 119-front-door-and-presenter"
---

# Tasks: Front door (feature 119)

**Input**: Design documents from `specs/119-front-door-and-presenter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/front-door.md, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task comes before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US3). The feature has no spike and no fixture capture of its own; the fixture family FX-28 belongs to feature 141.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel
- **[Story]**: US1 to US3
- A test task carries `proves:`; a parity test also `fixture:` and `surfaces:`
- An implementation task carries `covers:`

## Path Conventions

Package `packages/cli/` (router, inspect, output); tests in `tests/parity/119/`, `tests/characterization/119/` (every `PT-119-*` and `CT-119-*`), and `tests/budget/119/` for the golden output gate and the canary, which carry no test id. The `present/` module moved to `145-presenter` (feature 119 does not create it).

## Phase 1: Setup

- [ ] T001 Create the module layout of `packages/cli/src/{router,inspect,output}/` and the three test directories, with no install script and no native module
  - covers: F119-FR-056
- [ ] T002 [P] Add the startup check, characterization test CT-119-8 (30 cold starts, p90 at or below 150 ms) for `status`, `phases`, `events` in tests/characterization/119/ct-8-startup.test.ts
  - proves: F119-FR-015; F119-SC-003

## Phase 2: Foundational

**CRITICAL**: no story starts before this phase is done.

- [ ] T003 Write the verb table (annex G §G.1) as data in packages/cli/src/router/verbs.ts and the closed sets of the spec in packages/cli/src/output/closed-sets.ts
  - covers: F119-FR-001; F119-FR-013
- [ ] T004 [P] Write the product-line writer with JSON-quoted text values and the byte cap with the `[SPECSTRIDE-TRUNCATED]` line in packages/cli/src/output/lines.ts
  - covers: F119-FR-030; F119-FR-031
- [ ] T005 [P] Write the data-frame writer (fresh 64-bit token, redactor call) in packages/cli/src/output/frame.ts
  - covers: F119-FR-032
- [ ] T006 Write the mode selector (`output.compat`, profile `parity`) in packages/cli/src/output/mode.ts
  - covers: F119-FR-029

## Phase 3: User Story 3 - A caller relies on the exit code (Priority: P1)

**Goal**: routing, usage, unknown verbs and flags, exit codes.

**Independent Test**: every row of annex G §G.4 that belongs to this feature ends with its code.

### Tests

- [ ] T007 [P] [US3] Parity test PT-119-028FR023-verbs in tests/parity/119/verbs.test.ts
  - proves: 028 FR-023
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T008 [P] [US3] Characterization test CT-119-1 (unknown verb exits 1) in tests/characterization/119/ct-1.test.ts
  - proves: 002 FR-001
- [ ] T009 [P] [US3] Characterization test CT-119-2 (usage and exit 0 on no argument or help) in tests/characterization/119/ct-2.test.ts
  - proves: 002 FR-002
- [ ] T010 [P] [US3] Characterization test CT-119-3 (`run`, `start`, a leading flag launch) in tests/characterization/119/ct-3.test.ts
  - proves: 002 FR-003
- [ ] T011 [P] [US3] Characterization test CT-119-4 (exit with the called command's code, 70 on an uncaught error) in tests/characterization/119/ct-4.test.ts
  - proves: 002 FR-005
- [ ] T012 [P] [US3] Characterization test CT-119-5 (strict run-flag parser) in tests/characterization/119/ct-5.test.ts
  - proves: 002 FR-007
- [ ] T013 [P] [US3] Parity test PT-119-C-006-engine-flags in tests/parity/119/engine-flags.test.ts
  - proves: B-0009; B-0034; B-0187; B-0235; C-009
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T014 [P] [US3] Parity test PT-119-C-108-routing in tests/parity/119/routing.test.ts
  - proves: C-108; C-109
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T015 [P] [US3] Parity test PT-119-C-111-exit-codes in tests/parity/119/exit-codes.test.ts
  - proves: C-111
  - fixture: FX-28
  - surfaces: exit, stderr
- [ ] T016 [P] [US3] Parity test PT-119-C-115-resolution in tests/parity/119/resolution.test.ts
  - proves: C-115
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T017 [P] [US3] Characterization tests CT-119-6 (routing of `spec` and `verify`, the exit codes of their rows) and CT-119-7 (no harness name in usage, messages or control flow; enumeration only through the resolved registry) in tests/characterization/119/ct-6-7.test.ts
  - proves: F119-FR-013; F119-FR-014; F119-SC-008
- [ ] T059 [P] [US3] Parity test PT-119-C-109-arguments in tests/parity/119/arguments.test.ts (flag parsing, pass-through extras, workdir and feature resolution)
  - proves: C-109
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T060 [P] [US3] Parity test PT-119-C-009-engine-call in tests/parity/119/engine-call.test.ts (arguments handed to the engine unchanged; workdir errors)
  - proves: C-009
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T061 [P] [US3] Parity test PT-119-C-012-engine-usage in tests/parity/119/engine-usage.test.ts (`-h`, `--help`, unknown argument of the engine call)
  - proves: C-012
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T062 [P] [US3] Parity test PT-119-C-013-engine-flag-values in tests/parity/119/engine-flag-values.test.ts (a value-taking flag without a value ends with the baseline's status)
  - proves: C-013
  - fixture: FX-28
  - surfaces: exit, stderr
- [ ] T063 [P] [US3] Characterization test CT-119-18 (`resume` on a workspace without state exits 1 before the refusals of its row in annex G §G.4) in tests/characterization/119/ct-18.test.ts
  - proves: F119-FR-009; B-1482

### Implementation

- [ ] T018 [US3] Implement the router: routing, leading flag, `start`, `--reverse`, `--protocol` (the handler of feature 100, mounted), the `reverse --mode` refusal in packages/cli/src/router/route.ts
  - covers: F119-FR-001; F119-FR-002
- [ ] T019 [US3] Implement usage, help and the unknown-verb message in packages/cli/src/router/usage.ts
  - covers: F119-FR-003; F119-FR-004; F119-FR-014
- [ ] T020 [US3] Implement the engine call's argument handling and workdir errors in packages/cli/src/router/engine-args.ts
  - covers: F119-FR-005; F119-FR-006
- [ ] T021 [US3] Implement the inspection argument parser and resolution of workdir, spec and feature in packages/cli/src/router/inspect-args.ts
  - covers: F119-FR-007; F119-FR-008
- [ ] T022 [US3] Implement the state guard and the missing-input exits in packages/cli/src/router/guards.ts
  - covers: F119-FR-009; F119-FR-010; F119-FR-012
- [ ] T023 [US3] Implement the exit path: the called command's code, 70 on an uncaught error in packages/cli/src/router/exit.ts
  - covers: F119-FR-011

## Phase 4: User Story 1 - A host asks about a run and pays little context (Priority: P1) MVP

**Goal**: inspection verbs in default output within the byte limits.

**Independent Test**: golden output gate on FX-28 success and failure fixtures.

### Tests

- [ ] T024 [P] [US1] Golden output gate in tests/budget/119/golden-output.test.ts (each command, success and failure; no absolute path)
  - proves: F119-SC-001
  - fixture: FX-28
- [ ] T025 [P] [US1] Read-only test CT-119-9 (tree snapshots before and after) in tests/characterization/119/ct-9.test.ts
  - proves: F119-FR-016; F119-SC-002
  - fixture: FX-28
- [ ] T026 [P] [US1] Characterization tests CT-119-12 (default lines), CT-119-13 (byte cap), CT-119-14 (data frame, the 16,384-byte cap of the framed text) and CT-119-15 (`--json` against the schema files of `contracts/schemas/`) in tests/characterization/119/ct-12-15.test.ts
  - proves: F119-FR-030; F119-FR-031; F119-FR-032; F119-FR-033
- [ ] T027 [P] [US1] Canary test: planted secrets and instruction text never reach default output in tests/budget/119/canary.test.ts
  - proves: F119-SC-006
- [ ] T028 [P] [US1] Parity test PT-119-C-113-state-names in tests/parity/119/state-names.test.ts
  - proves: C-113
  - fixture: FX-28
  - surfaces: stdout, stderr, state

### Implementation

- [ ] T029 [US1] Implement the selection of events, log and feature by logical name in packages/cli/src/inspect/select.ts
  - covers: F119-FR-016; F119-FR-017
- [ ] T030 [P] [US1] Implement `tail` and `events` in packages/cli/src/inspect/tail-events.ts
  - covers: F119-FR-018
- [ ] T031 [P] [US1] Implement `verdicts` and `feedback` in packages/cli/src/inspect/verdicts.ts
  - covers: F119-FR-019
- [ ] T032 [P] [US1] Implement `phases` through the canonical spec model in packages/cli/src/inspect/phases.ts
  - covers: F119-FR-020
- [ ] T033 [US1] Implement default-output lines, failure reasons and fix texts in packages/cli/src/output/default.ts
  - covers: F119-FR-030; F119-FR-031; F119-FR-033
- [ ] T034 [US1] Implement the free-text rule for every verb in packages/cli/src/output/free-text.ts
  - covers: F119-FR-032

- [ ] T058 [US1] Implement `watch`: the state guard, `--feature` ignored, a call to the presenter's card mode, in packages/cli/src/inspect/watch.ts
  - covers: F119-FR-021

## Phase 5: User Story 2 - The port prints what the baseline printed (Priority: P1)

**Goal**: compatibility output of `status` and of every inspection verb (T038 and T042 moved).

**Independent Test**: FX-28 `<command>-<case>` scenarios report `equal`.

### Tests

- [ ] T035 [P] [US2] Parity test PT-119-C-112-halted-texts in tests/parity/119/halted-texts.test.ts
  - proves: C-112
  - fixture: FX-28
  - surfaces: stdout
- [ ] T036 [P] [US2] Parity test PT-119-C-114-status-lines in tests/parity/119/status-lines.test.ts
  - proves: C-114
  - fixture: FX-28
  - surfaces: exit, stdout, stderr
- [ ] T037 [P] [US2] Characterization tests CT-119-10 and CT-119-11 (state mapping from the read model; no new line under `parity`) in tests/characterization/119/ct-10-11.test.ts
  - proves: F119-FR-028; F119-FR-029
### Implementation

- [ ] T039 [US2] Implement the state headline and the halted-text table in packages/cli/src/inspect/status-state.ts
  - covers: F119-FR-022; F119-FR-023; F119-FR-028
- [ ] T040 [P] [US2] Implement the phase table, telemetry section and observability sections in packages/cli/src/inspect/status-sections.ts
  - covers: F119-FR-024; F119-FR-025; F119-FR-026
- [ ] T041 [P] [US2] Implement `status --all` in packages/cli/src/inspect/status-all.ts
  - covers: F119-FR-027
## Phase 6: Presenter, banner and theme

Moved to `145-presenter` with tasks T043 to T054 (numbers not reused).

## Phase 7: Polish

- [ ] T055 Wire the parity gate for FX-28 into the build (F119-SC-004) and the exit-code table test (F119-SC-005) in tests/parity/119/gate.test.ts
  - proves: F119-SC-004; F119-SC-005
- [ ] T056 [P] Add the closed-set and profile rows of the spec to the report for features 100 and 110 in specs/119-front-door-and-presenter/contracts/front-door.md
  - covers: F119-FR-029; F119-FR-030
- [ ] T057 Run `quickstart.md` end to end and record the result

## Phase 8: The published package (added by the repairs after the cross-feature review)

- [ ] T064 Build the bundle of the published package with the bundler of the plan (a development dependency): one ESM file, lazy imports, no install script, no native module, and the manifest of the packed package names no tool of the build
  - covers: F119-FR-015; F119-FR-056; F119-SC-009
- [ ] T065 [P] Plain-install test CT-119-19 in tests/characterization/119/ct-19-plain-install.test.ts: install the packed package in an empty directory with install scripts ignored, run `specstride --protocol`, expect exit 0; runs on Linux and on the macOS runner, and reports a skip with its reason on a platform without a runner
  - proves: F119-FR-056; F119-SC-009
- [ ] T066 Run the parity and characterization tests of this feature, the startup check CT-119-8 and the plain-install test CT-119-19 included, on the macOS runner of the build workflow of feature 100 when it exists, and record the result per test with the version of the system in tests/characterization/119/macos.md; until then every macOS statement of this feature stays `unverified`. A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason, never a pass (Principle XVII)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F119-FR-015; F119-FR-056

## Dependencies

Phase 2 blocks all. US3 (routing) precedes US1 and US2. Tests of a phase come before its implementation. The foundational writers T004 to T006 print through the verbs that use them and are tested there: T026 proves T004 and T005, T037 proves T006; each of those tests is written and fails before T033, T034 and T039 are done, and T004 to T006 count as done only when those tests pass.

## Implementation strategy

MVP: Phase 1, Phase 2, US3, US1. Then US2 for parity.
