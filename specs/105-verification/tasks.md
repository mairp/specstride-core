# Tasks: Verification (feature 105)

**Input**: Design documents from `specs/105-verification/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested for every feature (`STAGE-B-RULES.md` section 3). Parity tests and characterization tests are required tasks. A test task names what it proves; a parity test names its fixture families of feature 141. Test tasks of a phase come before its implementation tasks and must fail first.

**Organization**: by user story of `spec.md`. The brief names no spike, no fixture capture and no paid probe for this feature; no task calls a model or a paid service.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- `proves:` as-is ids, or the requirement id for a new requirement; `fixture:` fixture families of feature 141, §O.2

## Phase 1: Setup

**Purpose**: the package and its data

- [x] T001 Create the package `@specstride/verification` (layer L1) with its manifest, TypeScript configuration and the folders of plan.md in packages/verification/
- [x] T002 [P] Register the package in the import-boundary check with the imports `@specstride/contracts` and `@specstride/kernel` only, in tools/import-boundary/
- [x] T003 [P] Write the data files discovery.json and word-lists.json from the baseline at `9cab15d` (read with `git show`) in packages/verification/data/
- [x] T004 [P] Copy the contracts data of specs/105-verification/contracts/ (closed sets, parity rows, as-is literals, verify-cli) into packages/verification/data/ and add a test that they equal the specification; the `specs/` tree is local and outside the git index since 2026-09-30, so where it is absent the test is a skip with its reason, never a pass (Principle XVII)
- [x] T005 [P] Create the fixture tree of verification-commands documents, plans and result records in tests/fixtures/105/
- [x] T006 Extract the hash, renderer and discovery of the verification package of Lisa at `363e6a3` as source into packages/verification/src/ and record each extracted file with its licence check in packages/verification/EXTRACTED.md
- [x] T007 [P] Characterization test CT-105-2: the extracted Lisa store, hash, renderer and discovery behave as extracted, in tests/characterization/105/CT-105-2.test.ts
  - proves: F105-FR-011; F105-FR-017; F105-FR-022 (kept Lisa behaviour of the hash, of discovery and of the renderer; research.md D-1)

---

## Phase 2: Foundational

**Purpose**: the closed sets, the switches, and the call of the check runner that every story uses

**⚠️ CRITICAL**: no story can start before this phase is complete

- [x] T008 Register the closed sets of rows 52 and 228 to 234 of annex X §X.6 (of row 233 the member `DEADLINE`) with their unknown-value branches in packages/verification/src/mode/closed-sets.ts
- [x] T009 Register the rows 1, 15 and 33 of the `parity` profile, the switches of rows 6, 7 and 31 as read only (for the rule of F105-FR-020 on when a manifest is written), and the six keys of the rows 123, 124 and 126 with their values under `parity` in packages/verification/src/mode/switches.ts
- [x] T010 Write the one call site of the check runner (feature 100, annex C §C.8: pin at launch; start, poll, result, cancel per command) and a fake runner for tests, in packages/verification/src/gate/run-command.ts

---

## Phase 3: User Story 1 - A failed command rejects a phase before any critic is asked (Priority: P1) 🎯 MVP

**Goal**: the three modes; the verification gate before the critic; the feedback written by the engine.

**Independent Test**: FX-14 with a command that fails once and then passes: one critic call, a feedback file written by the engine, exit 0.

### Tests

- [x] T011 [P] [US1] Parity test PT-105-028FR020-modes (modes and the invalid-mode error) in tests/parity/105/PT-105-028FR020-modes.test.ts
  - proves: 028 FR-020
  - fixture: FX-14
  - requirement: F105-FR-001
- [x] T012 [P] [US1] Parity test PT-105-C-006-flags (modes and the invalid-mode error) in tests/parity/105/PT-105-C-006-flags.test.ts
  - proves: B-0021
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-001
- [x] T013 [P] [US1] Parity test PT-105-C-007-variables (modes and the invalid-mode error) in tests/parity/105/PT-105-C-007-variables.test.ts
  - proves: B-0051
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-001
- [x] T014 [P] [US1] Parity test PT-105-C-009-invalid-mode (modes and the invalid-mode error) in tests/parity/105/PT-105-C-009-invalid-mode.test.ts
  - proves: B-0112
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-001
- [x] T015 [US1] Parity test PT-105-C-006-flags (settings of plan place, commands document and scaffold directory), added to the file of T012, after T012, in tests/parity/105/PT-105-C-006-flags.test.ts
  - proves: B-0022; B-0023; B-0024
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-002
- [x] T016 [US1] Parity test PT-105-C-007-variables (settings of plan place, commands document and scaffold directory), added to the file of T013, after T013, in tests/parity/105/PT-105-C-007-variables.test.ts
  - proves: B-0052; B-0053; B-0054
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-002
- [x] T017 [P] [US1] Parity test PT-105-C-009-path-errors (settings of plan place, commands document and scaffold directory) in tests/parity/105/PT-105-C-009-path-errors.test.ts
  - proves: B-0113; B-0114; B-0121
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-002
- [x] T018 [P] [US1] Parity test PT-105-C-011-default-places (settings of plan place, commands document and scaffold directory) in tests/parity/105/PT-105-C-011-default-places.test.ts
  - proves: B-0158; B-0159
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-002
- [x] T019 [P] [US1] Parity test PT-105-C-013-upgrade-off-to-plan (settings of plan place, commands document and scaffold directory) in tests/parity/105/PT-105-C-013-upgrade-off-to-plan.test.ts
  - proves: B-0238; B-0268
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-002
- [x] T020 [P] [US1] Parity test PT-105-C-013-mode-effects (effect of each mode) in tests/parity/105/PT-105-C-013-mode-effects.test.ts
  - proves: B-0322; B-1150; B-1146
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-003
- [x] T021 [P] [US1] Parity test PT-105-C-013-plan-before-loop (derivation before the first phase attempt and the preflight error) in tests/parity/105/PT-105-C-013-plan-before-loop.test.ts
  - proves: B-0267
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-004
- [x] T022 [P] [US1] Parity test PT-105-C-009-preflight (derivation before the first phase attempt and the preflight error) in tests/parity/105/PT-105-C-009-preflight.test.ts
  - proves: B-0122
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-004
- [x] T023 [P] [US1] Parity test PT-105-C-010-preflight-halt (derivation before the first phase attempt and the preflight error) in tests/parity/105/PT-105-C-010-preflight-halt.test.ts
  - proves: B-1140
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-004
- [x] T024 [P] [US1] Parity test PT-105-C-013-gate-before-critic (gate before the critic; rejection without a critic call) in tests/parity/105/PT-105-C-013-gate-before-critic.test.ts
  - proves: B-0319; B-0320
  - fixture: FX-03, FX-14, FX-15, FX-16
  - requirement: F105-FR-005
- [x] T025 [P] [US1] Parity test PT-105-C-013-gate-failure-counts (gate before the critic; rejection without a critic call; a verification gate that ends with the code 3 is the same rejection, and the event carries that code) in tests/parity/105/PT-105-C-013-gate-failure-counts.test.ts
  - proves: B-0319; B-0320
  - fixture: FX-03, FX-14, FX-15, FX-16
  - requirement: F105-FR-005
- [x] T026 [P] [US1] Parity test PT-105-C-011-synthetic-feedback (feedback written by the engine) in tests/parity/105/PT-105-C-011-synthetic-feedback.test.ts
  - proves: B-0182; B-1144
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-006
- [x] T027 [P] [US1] Parity test PT-105-C-012-summary-unavailable (feedback written by the engine) in tests/parity/105/PT-105-C-012-summary-unavailable.test.ts
  - proves: B-1145
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-006
- [x] T028 [P] [US1] Parity test PT-105-C-008-gate-events (events and log lines around the gate) in tests/parity/105/PT-105-C-008-gate-events.test.ts
  - proves: B-0087; B-0099; B-0100; B-0101; B-1136; B-1137; B-1138; B-1139
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-007
- [x] T029 [P] [US1] Parity test PT-105-C-012-gate-log-lines (events and log lines around the gate) in tests/parity/105/PT-105-C-012-gate-log-lines.test.ts
  - proves: B-0222
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-007
- [x] T030 [P] [US1] Parity test PT-105-C-080-no-events-from-runner (events and log lines around the gate) in tests/parity/105/PT-105-C-080-no-events-from-runner.test.ts
  - proves: B-1135
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-007
- [x] T031 [P] [US1] Parity test PT-105-C-011-result-records (result records, written once) in tests/parity/105/PT-105-C-011-result-records.test.ts
  - proves: B-0160; B-0181; B-1143
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-009
- [x] T032 [P] [US1] Parity test PT-105-C-078-write-once (result records, written once) in tests/parity/105/PT-105-C-078-write-once.test.ts
  - proves: B-1071
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-009
- [x] T033 [P] [US1] Parity test PT-105-C-080-record-fields (result records, written once) in tests/parity/105/PT-105-C-080-record-fields.test.ts
  - proves: B-1123; B-1134
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-009
- [x] T034 [P] [US1] Characterization test CT-105-110 (in the modes `plan` and `off` the run snapshot holds `verification.mode`; after the change of F105-FR-002 it holds `plan`; this feature writes nothing to the run record and switches no loop layer) in tests/characterization/105/CT-105-110.test.ts
  - proves: F105-FR-010
  - requirement: F105-FR-010
- [x] T035 [P] [US1] Parity test PT-105-C-080-every-command-runs (every command runs; gate summary line) in tests/parity/105/PT-105-C-080-every-command-runs.test.ts
  - proves: B-1133
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-032
- [x] T036 [P] [US1] Parity test PT-105-C-079-gate-summary-line (every command runs; gate summary line) in tests/parity/105/PT-105-C-079-gate-summary-line.test.ts
  - proves: B-1074
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-032
- [x] T037 [P] [US1] Parity test PT-105-C-069-summary-entry (failure summary) in tests/parity/105/PT-105-C-069-summary-entry.test.ts
  - proves: B-1027
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-037
- [x] T038 [P] [US1] Parity test PT-105-C-070-tail-lines (failure summary) in tests/parity/105/PT-105-C-070-tail-lines.test.ts
  - proves: B-1028; B-1029
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-037
- [x] T039 [P] [US1] Parity test PT-105-C-071-summary-codes (failure summary) in tests/parity/105/PT-105-C-071-summary-codes.test.ts
  - proves: B-1030; B-1031
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-037
- [x] T040 [P] [US1] Parity test PT-105-C-072-summary-lines (failure summary) in tests/parity/105/PT-105-C-072-summary-lines.test.ts
  - proves: B-1032; B-1033; B-1034; B-1035
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-037
- [x] T041 [P] [US1] Parity test PT-105-C-073-failing-lines-first (failure summary) in tests/parity/105/PT-105-C-073-failing-lines-first.test.ts
  - proves: B-1036
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-037
- [x] T146 [P] [US1] Characterization test CT-105-154 (a planted canary in the output of a command appears redacted in the result record, the record of staged commands, the event, the failure summary, the feedback and the block of `prestage-report`; the raw log of a detached command is read only through the ingress; when the redactor cannot run the text is dropped and the record says so) in tests/characterization/105/CT-105-154.test.ts
  - proves: F105-FR-054
  - requirement: F105-FR-054

### Implementation

- [x] T042 [US1] Implement modes and the invalid-mode error (F105-FR-001) in packages/verification/src/mode/
- [x] T043 [US1] Implement settings of plan place, commands document and scaffold directory (F105-FR-002) in packages/verification/src/mode/
- [x] T044 [US1] Implement effect of each mode (F105-FR-003) in packages/verification/src/mode/
- [x] T045 [US1] Implement derivation before the first phase attempt and the preflight error (F105-FR-004) in packages/verification/src/mode/
- [x] T046 [US1] Implement gate before the critic; rejection without a critic call; any result code of the verification gate other than 0 is the same rejection with the result code 10 (F105-FR-005) in packages/verification/src/gate/
- [x] T147 [US1] Implement the path of command output through the one ingress (F105-FR-054) in packages/verification/src/gate/ and packages/verification/src/prestage/
- [x] T047 [US1] Implement feedback written by the engine (F105-FR-006) in packages/verification/src/gate/
- [x] T048 [US1] Implement events and log lines around the gate (F105-FR-007) in packages/verification/src/gate/
- [x] T049 [US1] Implement result records, written once (F105-FR-009) in packages/verification/src/gate/
- [x] T050 [US1] Implement the resolution of the mode in force that the command line calls before it writes the run snapshot: the change of F105-FR-002 is applied first, so that the key `verification.mode` of the snapshot holds the mode in force; no write to the run record, no reading for a loop layer, which its owner does (F105-FR-010) in packages/verification/src/mode/
- [x] T051 [US1] Implement every command runs; gate summary line (F105-FR-032) in packages/verification/src/gate/
- [x] T052 [US1] Implement failure summary (F105-FR-037) in packages/verification/src/summary/

**Checkpoint**: FX-14 compares `equal` on every surface.

---

## Phase 4: User Story 2 - Declared verification is found and frozen, never invented (Priority: P1)

**Goal**: plan sources, the verification plan, the check manifest, the outputs for people and prompts.

**Independent Test**: the conformance suite of EP-07 on fixtures with declared commands, with a conflict and with none.

### Tests

- [x] T053 [P] [US2] Conformance test CT-105-153: conformance suite of EP-07 (declared commands, conflicts, none) in packages/testkit/src/conformance/EP-07/
  - proves: F105-FR-053; F105-FR-015
- [x] T054 [P] [US2] Sample plan source outside the core, whose command appears in the manifest with provenance, in packages/testkit/src/samples/EP-07/
  - proves: F105-FR-053
- [x] T055 [P] [US2] Parity test PT-105-C-078-plan-record (plan record, ids and hashes) in tests/parity/105/PT-105-C-078-plan-record.test.ts
  - proves: B-1063
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-011
- [x] T056 [P] [US2] Parity test PT-105-C-080-ids-and-hashes (plan record, ids and hashes) in tests/parity/105/PT-105-C-080-ids-and-hashes.test.ts
  - proves: B-1081; B-1082; B-1094; B-1097; B-1108
  - fixture: FX-11, FX-14, FX-15, FX-16
  - requirement: F105-FR-011
- [x] T057 [P] [US2] Parity test PT-105-C-080-source-binding (binding to source hashes and the projection) in tests/parity/105/PT-105-C-080-source-binding.test.ts
  - proves: B-1095; B-1107; B-1112; B-1113
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-012
- [x] T058 [P] [US2] Parity test PT-105-C-080-plan-validation (validation of a loaded plan) in tests/parity/105/PT-105-C-080-plan-validation.test.ts
  - proves: B-1109; B-1110; B-1111; B-1115
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-013
- [x] T059 [P] [US2] Parity test PT-105-C-080-obligations (verification obligations) in tests/parity/105/PT-105-C-080-obligations.test.ts
  - proves: B-1077; B-1098; B-1099
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-014
- [x] T060 [P] [US2] Characterization test CT-105-115 (plan-source registry and the blocker rules) in tests/characterization/105/CT-105-115.test.ts
  - proves: F105-FR-015
  - requirement: F105-FR-015
- [x] T061 [P] [US2] Parity test PT-105-C-078-commands-document (the verification-commands document as a source) in tests/parity/105/PT-105-C-078-commands-document.test.ts
  - proves: B-1062
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-016
- [x] T062 [P] [US2] Parity test PT-105-C-080-declared-commands (the verification-commands document as a source) in tests/parity/105/PT-105-C-080-declared-commands.test.ts
  - proves: B-1079; B-1083; B-1084; B-1085; B-1086; B-1087; B-1096; B-1101
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-016
- [x] T063 [P] [US2] Parity test PT-105-C-013-phase-timeouts (the verification-commands document as a source) in tests/parity/105/PT-105-C-013-phase-timeouts.test.ts
  - proves: B-0269
  - fixture: FX-20
  - requirement: F105-FR-016
- [x] T064 [P] [US2] Parity test PT-105-C-080-discovery (discovery of toolchain entry points) in tests/parity/105/PT-105-C-080-discovery.test.ts
  - proves: B-1078; B-1088; B-1089; B-1090; B-1091; B-1092; B-1093; B-1100; B-1105
  - fixture: FX-11, FX-14, FX-15, FX-16, FX-22
  - requirement: F105-FR-017
- [x] T065 [P] [US2] Parity test PT-105-C-080-suites-and-gates (suites and gates) in tests/parity/105/PT-105-C-080-suites-and-gates.test.ts
  - proves: B-1102; B-1103; B-1104; B-1116; B-1131; B-1132
  - fixture: FX-14, FX-15, FX-16, FX-22
  - requirement: F105-FR-018
- [x] T066 [P] [US2] Parity test PT-105-C-077-required-blocked (refusal of an ambiguous plan in the mode required) in tests/parity/105/PT-105-C-077-required-blocked.test.ts
  - proves: B-1059
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-019
- [x] T067 [P] [US2] Parity test PT-105-C-075-required-flag (refusal of an ambiguous plan in the mode required) in tests/parity/105/PT-105-C-075-required-flag.test.ts
  - proves: B-1051
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-019
- [x] T068 [P] [US2] Characterization test CT-105-120 (derivation of the check manifest: its entries are the commands of the phase itself, `SUITE-phase-<N>`, and a cumulative verification gate selects from the manifests the same commands as from the plan; every entry has `inner` true, `pin` and `searchPath` are set at launch, the hash is the canonical record hash; reads and writes enter only from the launch contract with the provenance user configuration, the environment or a flag, and an entry without them is undeclared) in tests/characterization/105/CT-105-120.test.ts
  - proves: F105-FR-020
  - requirement: F105-FR-020
- [x] T069 [P] [US2] Characterization test CT-105-121 (comparison of the manifest on relaunch and resume) in tests/characterization/105/CT-105-121.test.ts
  - proves: F105-FR-021
  - requirement: F105-FR-021
- [x] T070 [P] [US2] Characterization test CT-105-1 (plan for people) in tests/characterization/105/CT-105-1.test.ts
  - proves: 002 FR-038
  - requirement: F105-FR-022
- [x] T071 [P] [US2] Parity test PT-105-C-078-plan-for-people (plan for people) in tests/parity/105/PT-105-C-078-plan-for-people.test.ts
  - proves: B-1060
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-022
- [x] T072 [P] [US2] Parity test PT-105-C-078-safe-writes (safe and atomic writes) in tests/parity/105/PT-105-C-078-safe-writes.test.ts
  - proves: B-1061; B-1064; B-1065
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-023
- [x] T073 [P] [US2] Parity test PT-105-C-078-scaffolds (test scaffolds) in tests/parity/105/PT-105-C-078-scaffolds.test.ts
  - proves: B-1066; B-1067; B-1068
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-024
- [x] T074 [P] [US2] Parity test PT-105-C-080-scaffold-notice (test scaffolds) in tests/parity/105/PT-105-C-080-scaffold-notice.test.ts
  - proves: B-1119
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-024
- [x] T075 [P] [US2] Parity test PT-105-C-075-scaffold-flag (test scaffolds) in tests/parity/105/PT-105-C-075-scaffold-flag.test.ts
  - proves: B-1052
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-024
- [x] T076 [P] [US2] Parity test PT-105-C-074-scaffold-command (test scaffolds) in tests/parity/105/PT-105-C-074-scaffold-command.test.ts
  - proves: B-1040
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-024
- [x] T077 [P] [US2] Parity test PT-105-C-079-phase-context (phase context) in tests/parity/105/PT-105-C-079-phase-context.test.ts
  - proves: B-1072
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-025
- [x] T078 [P] [US2] Parity test PT-105-C-080-phase-context (phase context) in tests/parity/105/PT-105-C-080-phase-context.test.ts
  - proves: B-1117; B-1118
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-025
- [x] T079 [P] [US2] Parity test PT-105-C-074-slice-command (phase context) in tests/parity/105/PT-105-C-074-slice-command.test.ts
  - proves: B-1039
  - fixture: FX-16
  - requirement: F105-FR-025
- [x] T080 [P] [US2] Parity test PT-105-C-060-plan-argument (plan check at critic start under the parity profile) in tests/parity/105/PT-105-C-060-plan-argument.test.ts
  - proves: B-0803
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-042
- [x] T081 [P] [US2] Parity test PT-105-C-061-plan-variable (plan check at critic start under the parity profile) in tests/parity/105/PT-105-C-061-plan-variable.test.ts
  - proves: B-0849
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-042
- [x] T082 [P] [US2] Parity test PT-105-C-063-critic-code-3 (plan check at critic start under the parity profile) in tests/parity/105/PT-105-C-063-critic-code-3.test.ts
  - proves: B-0864
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-042
- [x] T083 [P] [US2] Parity test PT-105-C-080-stale-plan (plan check at critic start under the parity profile) in tests/parity/105/PT-105-C-080-stale-plan.test.ts
  - proves: B-1114
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-042
- [x] T084 [P] [US2] Characterization test CT-105-142 (plan check at critic start under the parity profile; under the profile a stale plan in the mode `required` is met at the verification gate and rejects the phase attempt without a critic call; outside the profile the verification gate makes no staleness check) in tests/characterization/105/CT-105-142.test.ts
  - proves: F105-FR-042
  - requirement: F105-FR-042
- [x] T085 [P] [US2] Characterization test CT-105-143 (plan stays bound to its sources) in tests/characterization/105/CT-105-143.test.ts
  - proves: F105-FR-043
  - requirement: F105-FR-043
- [x] T086 [P] [US2] Characterization test CT-105-145 (narrowing rule for verification in project configuration) in tests/characterization/105/CT-105-145.test.ts
  - proves: F105-FR-045
  - requirement: F105-FR-045
- [x] T145 [P] [US2] Characterization test CT-105-116 (a field `reads`, `writes` or `sideEffects` in the verification-commands document is ignored with a finding, and the command is undeclared and runs alone) in tests/characterization/105/CT-105-116.test.ts
  - proves: F105-FR-016
  - requirement: F105-FR-016

### Implementation

- [x] T087 [US2] Implement plan record, ids and hashes, each hash over the text form of the baseline (no final line end) with the content hash of a text of the hasher, not with its canonical record hash (F105-FR-011) in packages/verification/src/plan/
- [x] T088 [US2] Implement binding to source hashes and the projection `tasks-v2`, built from the canonical spec model (F105-FR-012) in packages/verification/src/plan/
- [x] T089 [US2] Implement validation of a loaded plan (F105-FR-013) in packages/verification/src/plan/
- [x] T090 [US2] Implement verification obligations (F105-FR-014) in packages/verification/src/plan/
- [x] T091 [US2] Implement plan-source registry and the blocker rules: a blocker is recorded among the `ambiguities` and its command does not enter the plan (F105-FR-015) in packages/verification/src/sources/
- [x] T092 [US2] Implement the verification-commands document as a source; the stage `pre` is stored as `prestage`; a field that is not named is ignored with a finding (F105-FR-016) in packages/verification/src/sources/
- [x] T093 [US2] Implement discovery of toolchain entry points (F105-FR-017) in packages/verification/src/sources/
- [x] T094 [US2] Implement suites and gates (F105-FR-018) in packages/verification/src/plan/
- [x] T095 [US2] Implement refusal of an ambiguous plan in the mode required (F105-FR-019) in packages/verification/src/plan/
- [x] T096 [US2] Implement derivation of the check manifest: entries of `SUITE-phase-<N>`, the cumulative verification gate reading the manifests of the phases it covers, `inner` true, `pin`, `searchPath`, canonical record hash (F105-FR-020) in packages/verification/src/manifest/
- [x] T148 [US2] Implement the refusal of `reads`, `writes` and `sideEffects` from repository text and the intake of declared reads and writes from the launch contract (F105-FR-016, F105-FR-020) in packages/verification/src/sources/ and packages/verification/src/manifest/
- [x] T097 [US2] Implement comparison of the manifest on relaunch and resume (F105-FR-021) in packages/verification/src/manifest/
- [x] T098 [US2] Implement plan for people (F105-FR-022) in packages/verification/src/render/
- [x] T099 [US2] Implement safe and atomic writes (F105-FR-023) in packages/verification/src/render/
- [x] T100 [US2] Implement test scaffolds (F105-FR-024) in packages/verification/src/render/
- [x] T101 [US2] Implement phase context; it takes the block of commands staged before as an optional last part, which T128 supplies in phase 6 (F105-FR-025) in packages/verification/src/render/
- [x] T102 [US2] Implement plan check at critic start under the parity profile, and under that profile the same check where the verification gate, release verification, the phase context and the step of commands staged before load the plan; none of them outside the profile (F105-FR-042) in packages/verification/src/staleness/
- [x] T103 [US2] Implement plan stays bound to its sources (F105-FR-043) in packages/verification/src/staleness/
- [x] T104 [US2] Implement narrowing rule for verification in project configuration (F105-FR-045) in packages/verification/src/mode/
- [x] T105 [US2] Implement the source "commands declared literally in the plan or the task list" on the canonical spec model in packages/verification/src/sources/literal.ts

**Checkpoint**: a phase without declared commands has an empty manifest and the result `unchecked`.

---

## Phase 5: User Story 3 - A release is verified as a whole (Priority: P2)

**Goal**: release verification with exit 2 and the stop reason `release_verification`.

**Independent Test**: FX-15, both scenarios.

### Tests

- [x] T106 [P] [US3] Parity test PT-105-C-013-release-verification (release verification) in tests/parity/105/PT-105-C-013-release-verification.test.ts
  - proves: B-0274
  - fixture: FX-15
  - requirement: F105-FR-008
- [x] T107 [P] [US3] Parity test PT-105-C-009-release-exit (release verification) in tests/parity/105/PT-105-C-009-release-exit.test.ts
  - proves: B-0124
  - fixture: FX-15
  - requirement: F105-FR-008
- [x] T108 [P] [US3] Parity test PT-105-C-010-release-stop-reason (release verification) in tests/parity/105/PT-105-C-010-release-stop-reason.test.ts
  - proves: B-0140; B-1141
  - fixture: FX-15
  - requirement: F105-FR-008
- [x] T109 [P] [US3] Parity test PT-105-C-012-release-log-lines (release verification) in tests/parity/105/PT-105-C-012-release-log-lines.test.ts
  - proves: B-0202; B-0203
  - fixture: FX-15
  - requirement: F105-FR-008
- [x] T110 [P] [US3] Parity test PT-105-C-011-release-record (release verification) in tests/parity/105/PT-105-C-011-release-record.test.ts
  - proves: B-0172; B-1142
  - fixture: FX-15
  - requirement: F105-FR-008
- [x] T111 [P] [US3] Parity test PT-105-C-080-release-gate (release verification) in tests/parity/105/PT-105-C-080-release-gate.test.ts
  - proves: B-1106
  - fixture: FX-15
  - requirement: F105-FR-008

### Implementation

- [x] T112 [US3] Implement release verification (F105-FR-008) in packages/verification/src/gate/

---

## Phase 6: User Story 4 - Long commands are staged before the verification gate (Priority: P2)

**Goal**: staged commands, detached ones, and the reuse rules.

**Independent Test**: FX-16, the four scenarios.

### Tests

- [x] T113 [P] [US4] Parity test PT-105-C-080-reuse-rules (reuse rules) in tests/parity/105/PT-105-C-080-reuse-rules.test.ts
  - proves: B-1128; B-1129; B-1130
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-033
- [x] T114 [P] [US4] Parity test PT-105-C-075-attempt-default (reuse rules) in tests/parity/105/PT-105-C-075-attempt-default.test.ts
  - proves: B-1045
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-033
- [x] T149 [P] [US4] Characterization test CT-105-133 (with a loop layer engaged in the phase attempt the verification gate takes over no staged result and executes every command; without one the as-is rules hold) in tests/characterization/105/CT-105-133.test.ts
  - proves: F105-FR-033
  - requirement: F105-FR-033
- [x] T115 [P] [US4] Parity test PT-105-C-022-prestage-step (commands staged before a phase attempt) in tests/parity/105/PT-105-C-022-prestage-step.test.ts
  - proves: B-0375
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T116 [P] [US4] Parity test PT-105-C-021-prestage-log-line (commands staged before a phase attempt) in tests/parity/105/PT-105-C-021-prestage-log-line.test.ts
  - proves: B-0359
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T117 [P] [US4] Parity test PT-105-C-019-prestage-event (commands staged before a phase attempt) in tests/parity/105/PT-105-C-019-prestage-event.test.ts
  - proves: B-0351
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T118 [P] [US4] Parity test PT-105-C-080-prestage-record (commands staged before a phase attempt) in tests/parity/105/PT-105-C-080-prestage-record.test.ts
  - proves: B-1080; B-1126
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T119 [P] [US4] Parity test PT-105-C-078-prestage-files (commands staged before a phase attempt) in tests/parity/105/PT-105-C-078-prestage-files.test.ts
  - proves: B-1069
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T120 [P] [US4] Parity test PT-105-C-079-prestage-lines (commands staged before a phase attempt) in tests/parity/105/PT-105-C-079-prestage-lines.test.ts
  - proves: B-1073; B-1076
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T121 [P] [US4] Parity test PT-105-C-076-prestage-code (commands staged before a phase attempt) in tests/parity/105/PT-105-C-076-prestage-code.test.ts
  - proves: B-1056
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T122 [P] [US4] Parity test PT-105-C-075-prestage-directory (commands staged before a phase attempt) in tests/parity/105/PT-105-C-075-prestage-directory.test.ts
  - proves: B-1044
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T123 [P] [US4] Parity test PT-105-C-074-prestage-command (commands staged before a phase attempt) in tests/parity/105/PT-105-C-074-prestage-command.test.ts
  - proves: B-1042
  - fixture: FX-16
  - requirement: F105-FR-034
- [x] T124 [P] [US4] Parity test PT-105-C-080-detached-prestage (detached staged commands) in tests/parity/105/PT-105-C-080-detached-prestage.test.ts
  - proves: B-1127
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-035
- [x] T125 [P] [US4] Parity test PT-105-C-078-detached-files (detached staged commands) in tests/parity/105/PT-105-C-078-detached-files.test.ts
  - proves: B-1070
  - fixture: FX-16
  - requirement: F105-FR-035
- [x] T126 [P] [US4] Parity test PT-105-C-080-build-artifacts (build artifacts record) in tests/parity/105/PT-105-C-080-build-artifacts.test.ts
  - proves: B-1125
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-036

### Implementation

- [x] T127 [US4] Implement reuse rules: the search over the records of the run, the most recent first; no result taken over when the engine reports a loop layer engaged in the phase attempt (F105-FR-033) in packages/verification/src/prestage/
- [x] T128 [US4] Implement commands staged before a phase attempt, and the block of `prestage-report`, which the phase context of T101 then ends with where a record exists (F105-FR-034, F105-FR-039, F105-FR-025) in packages/verification/src/prestage/
- [x] T129 [US4] Implement detached staged commands (F105-FR-035) in packages/verification/src/prestage/: started by the process primitive of `@specstride/kernel` (F100-FR-234), which the composition root hands in as an argument, and not through the check runner, whose time limit ends a command; no import of `node:child_process`; the environment is the one a command of the check runner gets, handed in by the composition root; the log is a file that the engine opens under `attempt:<N>:<k>:<n>:prestage` and gives to the process as its two output streams
- [x] T130 [US4] Implement build artifacts record (F105-FR-036) in packages/verification/src/prestage/

---

## Phase 7: User Story 5 - An operator uses `verify` by hand (Priority: P3)

**Goal**: the public command with seven sub-commands and the exit codes 0, 3, 10, 11.

**Independent Test**: each sub-command compares `exit`, `stdout` and `stderr` with the reference on FX-14 to FX-16.

### Tests

- [x] T131 [P] [US5] Parity test PT-105-C-074-sub-commands (the command verify) in tests/parity/105/PT-105-C-074-sub-commands.test.ts
  - proves: B-1037; B-1038; B-1041; B-1043
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-039
- [x] T132 [P] [US5] Parity test PT-105-C-075-create-arguments (the command verify) in tests/parity/105/PT-105-C-075-create-arguments.test.ts
  - proves: B-1046; B-1047; B-1048; B-1049; B-1050; B-1053; B-1054
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-039
- [x] T133 [P] [US5] Parity test PT-105-C-076-exit-codes (the command verify) in tests/parity/105/PT-105-C-076-exit-codes.test.ts
  - proves: B-1055; B-1057; B-1058
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-039
- [x] T134 [P] [US5] Parity test PT-105-C-079-valid-line (the command verify) in tests/parity/105/PT-105-C-079-valid-line.test.ts
  - proves: B-1075
  - fixture: FX-14, FX-15, FX-16
  - requirement: F105-FR-039

### Implementation

- [x] T135 [US5] Implement the command verify (F105-FR-039) in packages/verification/src/cli/
- [x] T136 [US5] Mount the sub-command module of `verify` in the CLI through the command table of feature 100 (annex G §G.1) in packages/verification/src/cli/mount.ts

---

## Phase 8: Polish & cross-cutting

- [x] T137 [P] Test of F105-SC-001 and F105-SC-002: counts of manifest entries without provenance and of commands run per phase attempt over all fixtures, in tests/characterization/105/CT-105-301.test.ts
  - proves: F105-FR-020; F105-FR-032
- [x] T138 [P] Test of F105-SC-006: outside the `parity` profile no critic call is refused for a stale plan, in tests/characterization/105/CT-105-302.test.ts
  - proves: F105-FR-042
- [x] T139 [P] Test of F105-SC-004 and F105-SC-005: the oracle reports 0 results different on FX-14, FX-15 and FX-16 under the parity profile, and the critic transcript holds 0 calls for a phase attempt whose verification gate failed, in tests/parity/105/PT-105-028FR020-suite.test.ts
  - proves: 028 FR-020; C-013; B-0320
  - fixture: FX-14, FX-15, FX-16
- [x] T140 [P] Test of F105-SC-009: the build with the sample plan source and the build without it differ in 0 core files, in tests/characterization/105/CT-105-305.test.ts
  - proves: F105-FR-053
- [x] T141 [P] Test of F105-SC-010: every as-is id of the traceability rows of this feature is named by a `proves:` of this file, in tests/characterization/105/CT-105-304.test.ts; where the local `specs/` tree is absent the test is a skip with its reason, never a pass
  - proves: F105-SC-010
- [x] T142 Run the parity tests of this feature on the macOS runner and record the `unverified` fact about process sessions with date and version in specs/105-verification/research.md
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T143 [P] Measure the performance starting values of plan.md and the bytes of the gate summary line in the build, and record them in packages/verification/README.md
- [x] T144 Run the scenarios of specs/105-verification/quickstart.md and record the result

### Tasks added after the first numbering

T145 to T148 were added after the cross-feature review of 2026-09-30 and T149 by the second analyze run of the same day. Each stands in the phase it belongs to: T146 and T147 in phase 3, T145 and T148 in phase 4, T149 in phase 6. Their ids are out of numeric order on purpose; no id was renumbered. No task of this feature calls a model or a paid service.

---

## Dependencies & Execution Order

| Phase | Depends on | Note |
|---|---|---|
| 1 Setup | Feature 100 (`contracts`, `kernel`, `testkit` frames) | — |
| 2 Foundational | 1 | Blocks every story. Until a check runner exists, the fake runner of the tests serves |
| 3 US1 | 2; for a whole run also US2 (the plan) | The MVP is US1 with US2 |
| 4 US2 | 2 | Independent of US1 in its tests |
| 5 US3 | 3, 4 | — |
| 6 US4 | 3, 4 | — |
| 7 US5 | 3, 4, 6 | — |
| 8 Polish | All | — |

Parity tests need the stubs and fixture families of feature 141, the compatibility projection
and compatibility output of their owners, and an implementation of the check runner (feature
100, annex C §C.8). Until those exist, a parity test is a skip with its reason, never a pass.

### Parallel opportunities

Every test task marked [P] writes a file of its own; T015 and T016 add to the files of T012 and T013 and are not marked. Inside a story all tests can be written
side by side, then the implementation tasks in the order given. US3, US4 and US5 can be built by
different people once phases 2 to 4 are complete.

### Parallel example: User Story 2

```text
The conformance suite of EP-07, the sample source and the tests of F105-FR-011 to F105-FR-025: all [P]
Then: sources → plan → suites and gates → manifest → outputs for people and prompts
```

## Implementation Strategy

| Step | Content |
|---|---|
| MVP | Phases 1 to 4: the modes and the gate, the plan and the manifest. Validated by FX-14 |
| Second | Phases 5 to 7: release verification, staged commands, `verify`. Validated by FX-15 and FX-16 |
| Last | Phase 8 |

