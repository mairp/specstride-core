# Tasks: Spec input

**Input**: Design documents from `specs/104-spec-input/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. Parity tests and characterization tests are tasks, not options (STAGE-B-RULES section 3).

## Format: `[ID] [P?] [Story] Description`

Paths are those of `plan.md`: the package `packages/spec-formats/`, the hasher in `packages/kernel/src/hasher/`, parity tests in `tests/parity/104/`, characterization tests in `tests/characterization/104/`, the conformance cases and the sample of EP-03 in `packages/testkit/src/`. A task may hold several named tests of one file. No task of this feature calls a model.

## Phase 1: Setup and captures

- [x] T001 Confirm with feature 141 that the scenarios of FX-09, FX-10, FX-32 and FX-33 and their golden captures exist for the inputs of this feature; list any scenario that is missing and report it (first task: fixture capture)
  - proves: 028 FR-001; 028 FR-002; 011 FR-007
  - fixture: FX-09, FX-10, FX-32, FX-33
- [x] T002 [P] Create the package `packages/spec-formats/` with strict TypeScript, and the test folders `tests/parity/104/` and `tests/characterization/104/`, per plan.md
- [x] T003 [P] Write characterization test CT-104-1 of Lisa's three adapters, validator and resolver as extracted, before any rename, in tests/characterization/104/lisa-adapters.test.ts
  - proves: 002 FR-028
- [x] T004 [P] Write characterization test CT-104-2 of Lisa's detection order with its environment steps, in tests/characterization/104/lisa-detect.test.ts
  - proves: 002 FR-029
- [x] T005 [P] Write CT-104-3 that pins Lisa's rejection of an explicit `openspec` (R1v V3) before the alias, in tests/characterization/104/lisa-openspec.test.ts
  - proves: 002 FR-029

## Phase 2: Foundational

- [x] T006 Define the canonical model, source record and closed sets from `contracts/` in packages/spec-formats/src/model.ts
- [x] T007 Implement the one hasher (content hash, hash that ignores checkboxes by the rule of F104-FR-022, canonical record hash, phase shape) as a module of `@specstride/kernel` that imports `@specstride/contracts` only, in packages/kernel/src/hasher/index.ts, with its unit tests in packages/kernel/test/hasher/
- [x] T008 Implement the registry with priority and detection order in packages/spec-formats/src/registry.ts

**Checkpoint**: model, hasher and registry exist.

## Phase 3: User Story 1 - Resolution and detection (Priority: P1) MVP

**Goal**: The spec is found and its format detected.

**Independent Test**: FX-09 and FX-10 equal or waived.

### Tests for User Story 1

- [x] T009 [P] [US1] Parity tests PT-104-028FR001-resolution-order, PT-104-C-013-resolution-steps, PT-104-028FR001-not-found-listing, PT-104-C-012-resolution-messages and PT-104-C-009-exit-3 in tests/parity/104/resolution.test.ts
  - proves: 028 FR-001; C-013; C-012; C-009
  - fixture: FX-09
  - surfaces: exit, stdout, stderr, tree
- [x] T010 [P] [US1] Parity tests PT-104-C-006-explicit-spec, PT-104-C-013-launch-directory and PT-104-C-009-not-a-file in tests/parity/104/explicit-spec.test.ts
  - proves: C-006; C-009; C-013
  - fixture: FX-09, FX-10
- [x] T011 [P] [US1] Parity tests PT-104-028FR002-detection-order, PT-104-C-145-detection-steps and PT-104-028FR002-unknown-format in tests/parity/104/detection.test.ts
  - proves: 028 FR-002; C-145
  - fixture: FX-10
- [x] T012 [P] [US1] Parity tests PT-104-C-007-format-feature-keys, PT-104-C-006-format-flag and PT-104-C-061-format-default in tests/parity/104/format-feature-inputs.test.ts
  - proves: C-007; C-061
  - fixture: FX-09, FX-10
- [x] T013 [P] [US1] Parity tests PT-104-C-060-critic-inputs, PT-104-C-063-critic-exit-3, PT-104-C-063-format-invalid and PT-104-C-141-unreadable in tests/parity/104/critic-inputs.test.ts
  - proves: C-060; C-063; C-141
  - fixture: FX-09, FX-10

### Implementation for User Story 1

- [x] T014 [US1] Implement resolution, the explicit path and the listings in packages/spec-formats/src/resolve.ts
- [x] T015 [US1] Implement feature selection and the slug rule in packages/spec-formats/src/slug.ts
- [x] T016 [US1] Implement detection, the alias `openspec`, the unknown-format error and the `spec.format` and `spec.feature` inputs in packages/spec-formats/src/registry.ts
- [x] T017 [US1] Implement the caller errors of F104-FR-018 in packages/spec-formats/src/errors.ts

## Phase 4: User Story 3 - One grammar and the model (Priority: P1)

**Goal**: One reader for every consumer.

**Independent Test**: FX-10 and FX-32 equal; static test finds no second parser.

### Tests for User Story 3

- [x] T018 [P] [US3] Parity tests PT-104-028FR029-one-owner and PT-104-C-022-shims in tests/parity/104/one-owner.test.ts
  - proves: 028 FR-029; C-022
  - fixture: FX-10, FX-32
- [x] T019 [P] [US3] Parity tests PT-104-C-145-native-grammar, PT-104-C-145-speckit-grammar, PT-104-C-145-openspec-grammar, PT-104-C-142-native-errors, PT-104-C-142-speckit-errors and PT-104-C-142-openspec-errors in tests/parity/104/grammar.test.ts
  - proves: C-145; C-142
  - fixture: FX-10
- [x] T020 [P] [US3] Parity tests PT-104-C-213-inventory-grammar and PT-104-C-213-task-grammar in tests/parity/104/inventory.test.ts
  - proves: C-213
  - fixture: FX-32
- [x] T021 [P] [US3] Parity tests PT-104-C-141-validate-exit, PT-104-C-142-validation-errors, PT-104-C-009-invalid-spec and PT-104-C-022-validate-shim in tests/parity/104/validate.test.ts
  - proves: C-141; C-138; C-142; C-009; C-022
  - fixture: FX-10
- [x] T022 [P] [US3] Parity tests PT-104-C-143-atomic-tick, PT-104-C-145-tick-rules and PT-104-C-138-tick-verb in tests/parity/104/tick.test.ts
  - proves: C-143; C-145; C-138
  - fixture: FX-10
- [x] T023 [P] [US3] Static test that no package parses phase headings or task lines outside the spec-format package, and that the hasher of the kernel holds the mark rule of F104-FR-022 and no other part of the grammar (F104-SC-001), in packages/spec-formats/test/static/one-grammar.test.ts
  - proves: 028 FR-029

### Implementation for User Story 3

- [x] T024 [P] [US3] Implement the `native` adapter in packages/spec-formats/src/adapters/native.ts
- [x] T025 [P] [US3] Implement the `speckit-tasks` adapter in packages/spec-formats/src/adapters/speckit-tasks.ts
- [x] T026 [P] [US3] Implement the `openspec-change` adapter in packages/spec-formats/src/adapters/openspec-change.ts
- [x] T027 [US3] Implement structured tasks and the four-field projection in packages/spec-formats/src/model.ts
- [x] T028 [US3] Implement phase access and validation in packages/spec-formats/src/validate.ts
- [x] T029 [US3] Implement context documents and the budget in packages/spec-formats/src/context.ts
- [x] T030 [US3] Implement `tick` in packages/spec-formats/src/tick.ts

## Phase 5: User Story 2 - The staleness verdict (Priority: P1)

**Goal**: Ticks never make a run stale; a real change is named.

**Independent Test**: FX-33 `stale-sources`; property test of tick subsets.

### Tests for User Story 2

- [x] T031 [P] [US2] Parity tests PT-104-011FR007-tick-only-fresh, PT-104-011FR007-changed-named, PT-104-C-218-stale-check and PT-104-C-218-tick-only in tests/parity/104/staleness.test.ts
  - proves: 011 FR-007; C-218
  - fixture: FX-33/stale-sources
  - surfaces: exit, stdout, stderr, state
- [x] T032 [P] [US2] Parity tests PT-104-C-234-exit-23, PT-104-011FR007-stale-lines and PT-104-C-218-unreadable in tests/parity/104/exit-23.test.ts
  - proves: C-234; 011 FR-007; C-218
  - fixture: FX-33/stale-sources
- [x] T033 [P] [US2] Own test: verdict for each of the three files, a task list with ticks only is fresh, a changed task text is stale and named, in packages/spec-formats/test/verdict.test.ts
- [x] T034 [P] [US2] Property test with 1,000 tick and clear subsets in packages/spec-formats/test/property/tick-hash.test.ts; the same test reports the time of parse and hash of a generated task list of 500 tasks against the starting value of plan.md (100 ms, low confidence), as information and not as a gate

### Implementation for User Story 2

- [x] T035 [US2] Implement `inputs` and source records, with the hashes taken from the hasher of the kernel, in packages/spec-formats/src/sources.ts
- [x] T036 [US2] Implement the classification of the staleness verdict (recorded hashes and hashes now give `unchanged`, `ticks-only`, `changed` or `unreadable`, and `fresh` or `stale`) as a pure operation of the hasher of the kernel in packages/kernel/src/hasher/staleness.ts, which reads no file; and the reading of the files, the call of that operation and the lines of F104-FR-025 in packages/spec-formats/src/verdict.ts (F104-FR-024, F104-FR-027; CQ-214). After T007
- [x] T037 [US2] Implement the task-list reading and its comparison, as the content that the engine writes to `run:<runId>:task-list` (annex B §B.5; this feature does not write the record), in packages/spec-formats/src/task-reading.ts

## Phase 6: User Story 4 - The verb `spec` (Priority: P2)

- [x] T038 [P] [US4] Parity tests PT-104-C-138-verb-subcommands and PT-104-C-139-verb-flags in tests/parity/104/verb.test.ts
  - proves: C-138; C-139
  - fixture: FX-10
- [x] T039 [US4] Implement the verb, its flags, exit codes and `--json` in packages/spec-formats/src/verb.ts; `first-unapproved` takes the verification of an approval record (F101-FR-031) as a port that the CLI hands over and verifies no signature itself (F104-FR-019); the package imports `@specstride/contracts` and `@specstride/kernel` only

## Phase 7: User Story 5 - A format from the test tree (Priority: P2)

- [x] T040 [P] [US5] CT-104-4, the behaviour cases of the conformance suite of EP-03: golden models, round trip of `tick`, hash stability, the place of an added format in the detection order, and the sample format registered from the test tree, in packages/testkit/src/conformance/EP-03/behaviour.test.ts, beside the contract-level suite of feature 100
  - proves: 002 FR-028; F104-FR-009
- [x] T041 [US5] Add the sample format in packages/testkit/src/samples/EP-03/sample-format.ts, beside the minimal sample of feature 100, and a static test that no core file names it (F104-SC-006)

## Phase 8: Polish

- [x] T042 Run `python3 docs/ecosystem/check-traceability.py` and fix lines that name feature 104
- [x] T043 Report to the orchestrator the two items of the analyze report of 2026-09-30 that are feature 100's: a schema id for the record `run:<runId>:task-list` in annex B §B.20 (F104-FR-026), and the rule owners of the obligation id (107) and the signature of unmet criteria (101) in the row of annex X §X.5 (F104-FR-021). CQ-039 to CQ-045 and CQ-214 are closed and the rows of annex X exist; nothing else is open

## Phase 9: Tasks added after the cross-feature review (2026-09-30)

Appended so that no task id changes. Each task belongs to the story its label names and is done
with the phase of that story.

- [x] T044 [P] [US1] Parity tests PT-104-C-013-feature-selection, PT-104-C-145-feature-slug and PT-104-C-138-feature-slug in tests/parity/104/feature-slug.test.ts
  - proves: C-013; C-145; C-138
  - fixture: FX-09, FX-10
- [x] T045 [P] [US3] Parity tests PT-104-C-138-phase-access and PT-104-C-145-slice-title in tests/parity/104/phase-access.test.ts
  - proves: C-138; C-145
  - fixture: FX-10
- [x] T046 [P] [US3] Parity tests PT-104-C-145-context-order, PT-104-C-145-context-budget, PT-104-C-144-context-markers and PT-104-C-140-context-budget-key in tests/parity/104/context.test.ts
  - proves: C-145; C-144; C-140
  - fixture: FX-10
- [x] T047 [P] [US3] Own test CT-104-5: a tick changes checkbox bytes only, a second tick changes 0 lines, the file mode is kept, nothing is written when no line changed, and a failed tick leaves the file as it was, in packages/spec-formats/test/tick-round-trip.test.ts
  - proves: F104-FR-017
- [x] T048 [P] [US2] Parity tests PT-104-C-138-shape-hash, PT-104-C-213-hash-equality and PT-104-C-213-checkbox-insensitive-hash: the hasher of the kernel gives the hashes of the reference on the same input, in tests/parity/104/hash.test.ts
  - proves: C-138; C-213
  - fixture: FX-10, FX-32, FX-33
- [x] T049 [P] [US2] Own test CT-104-6: `inputs` lists the sources of each format with kind, logical name, path and hashes; an unknown kind is read as `other`, in packages/spec-formats/test/inputs.test.ts
  - proves: F104-FR-023
- [x] T050 [P] [US2] Own test CT-104-7: the task-list reading per phase; its hash does not change with ticks or line numbers; the comparison reports added, removed, reordered and changed ids; the reading validates as the content of `run:<runId>:task-list` against the schema `specstride.task-list/1` of `@specstride/contracts`, in packages/spec-formats/test/task-reading.test.ts
  - proves: F104-FR-026
- [x] T051 [P] [US2] Own test CT-104-8: the verdict is one function, the classification of the hasher of the kernel, gives the same result whenever it is asked, and the package compares at no check point itself; a static check that no package outside packages/kernel/src/hasher/ classifies recorded hashes against hashes now (the callers of 102, 103 and `@specstride/spec-formats` call the kernel's operation), in packages/spec-formats/test/verdict-one-function.test.ts (CQ-214)
  - proves: F104-FR-027
- [x] T052 [P] [US4] Parity tests PT-104-C-141-verb-exit-codes, PT-104-C-139-usage-errors and PT-104-C-144-missing-number: exit 2 for an unknown subcommand of `spec` and for a missing `--specs`, exit 3 for a missing phase number, exit 1 (not 70) for a phase number that is not a whole number, as the row `spec` of annex G §G.4 gives them, in tests/parity/104/verb-exit.test.ts
  - proves: C-141; C-139; C-144
  - fixture: FX-10
- [x] T053 [P] [US4] Measure the bytes of the default output of every subcommand of `spec` on the fixtures of FX-10 against the figures of row XIX of plan.md, with the helper of T194 of feature 100 (packages/testkit/src/static/budget.ts); a breach fails the build, in packages/spec-formats/test/static/output-budget.test.ts
  - proves: F104-FR-019
- [x] T054 Run the tests of the feature on the macOS runner when it exists and record the result with date and version in specs/104-spec-input/research.md; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

## Dependencies

T001 first; T003 to T005 before T016; Phase 2 before all stories; US1 and US3 share the registry; US2 needs T007 and T027; US4 needs US1, US3 and US2. T007 needs the kernel package of feature 100 (its T-tasks of the atomic write create it). T040 and T041 need the frame of the test kit and T100, T101 of feature 100. T048 needs T007; T053 needs T039 and T194 of feature 100; T054 is last.
