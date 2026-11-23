---
description: "Task list of feature 116-check-integrity-and-unit-evidence"
---

# Tasks: Check integrity and unit evidence (feature 116)

**Input**: Design documents from `specs/116-check-integrity-and-unit-evidence/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required (`STAGE-B-RULES.md` section 3). This feature has no as-is behaviour, so it has no parity test of its own; every test is a characterization test `CT-116-<n>`. A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. This feature inherits no spike, no fixture capture and no paid probe.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US3)
- Every task names its file
- A test task carries `proves:` with the requirement, and the integrity rule where it is the test of one
- An implementation task carries `covers:` with the requirements it serves

## Path Conventions

One package of the npm workspace, as in `plan.md`: `packages/integrity/` (`@specstride/integrity`, edge, owner 116 in the package graph of feature 100), data in `packages/contracts/data/`, the cases of the conformance suite in `packages/testkit/src/conformance/EP-16/`, the sample profile in `packages/testkit/src/samples/EP-16/`, fixtures in `tests/integrity/116/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the package

- [x] T001 Create the package `@specstride/integrity` in packages/integrity/ (edge, L1) with `package.json` (no install script), `tsconfig.json` (strict) and a `test` script that runs packages/integrity/test/ and the fixtures' tests under tests/integrity/116/ (T066 to T068), so that `npm test` of the workspace reaches them
  - covers: F116-FR-001
- [x] T002 [P] Deliver `integrity-rules.json`, `tamperings.json` and the three schema files of specs/116-check-integrity-and-unit-evidence/contracts/ through the manifest contracts/deliver.json, which the sync script of feature 100 reads after its clean copy (proposal P-1 of analyze-report.md): into packages/contracts/data/ as integrity-rules-116.json and tamperings-116.json, into packages/contracts/schemas/ as toolchain.schema.json, protected-set.schema.json and check-result.schema.json (no file of feature 100 or 115 of the same name is overwritten; the closed sets and the profile row are T003 and T004); validate each against its schema in the build. No file is copied by hand
  - covers: F116-FR-013

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what every story needs: the closed sets, the profile row, the fixtures

**⚠️ CRITICAL**: no story can start before this phase is done

- [x] T003 Declare the 5 closed sets of `spec.md` with their rule for an unknown value in packages/contracts/data/closed-sets-116.json, delivered from contracts/closed-sets.json through contracts/deliver.json, and add them to the static test of closed sets, which also checks that each equals its row of annex X §X.6 in packages/contracts/data/closed-sets.json
  - covers: F116-FR-007; F116-FR-008; F116-FR-021
- [x] T004 [P] Declare row 32 of the `parity` profile in packages/contracts/data/parity-rows-116.json, delivered from contracts/parity-rows.json through contracts/deliver.json, so that the profile test finds a value for the switch
  - covers: F116-FR-012
- [x] T005 [P] Build the tamper fixtures, one per seeded tampering of contracts/tamperings.json, in tests/integrity/116/tamper/
  - covers: F116-FR-005; F116-FR-006; F116-FR-009
- [x] T006 [P] Build the fixtures of check results and ledger records with two histories and one final state in tests/integrity/116/two-histories/
  - covers: F116-FR-020

**Checkpoint**: data and fixtures are in place


---

## Phase 3: User Story 1 - A changed check is detected and never counts as a pass (Priority: P1) (MVP)

**Goal**: A changed check is detected and never counts as a pass

**Independent Test**: For each seeded tampering of the tamper fixtures the recorded condition is the expected one and never a pass

### Tests for User Story 1

> Write these tests first; each must fail before the implementation

- [x] T007 [P] [US1] Characterization test CT-116-1: two classes of the protected set, in packages/integrity/test/protected/fr-001.test.ts
  - proves: F116-FR-001
- [x] T008 [P] [US1] Characterization test CT-116-2: class A as patterns; a new matching file taints, in packages/integrity/test/protected/fr-002.test.ts
  - proves: F116-FR-002
- [x] T009 [P] [US1] Characterization test CT-116-3: scope of the tree fingerprint and its exclusions; protected files inside the scope hashed by content whatever the metadata cache says, in packages/integrity/test/protected/fr-003.test.ts
  - proves: F116-FR-003
- [x] T010 [P] [US1] Characterization test CT-116-4: fingerprints at launch and at phase entry, kept across phase attempts and resumes, in packages/integrity/test/protected/fr-004.test.ts
  - proves: F116-FR-004
- [x] T011 [P] [US1] Characterization test CT-116-5: fingerprints before and after a check; changed-during-check, in packages/integrity/test/protected/fr-005.test.ts
  - proves: F116-FR-005
- [x] T012 [P] [US1] Characterization test CT-116-6: tainted keeps the exit result, the unit is not recorded as kept, the verification gate still runs, in packages/integrity/test/protected/fr-006.test.ts
  - proves: F116-FR-006
- [x] T013 [P] [US1] Characterization test CT-116-7: protection prevent and detect, in packages/integrity/test/protected/fr-007.test.ts
  - proves: F116-FR-007
- [x] T014 [P] [US1] Characterization test CT-116-8: results bound to the tree; current and superseded; conditions in fields of their own, in packages/integrity/test/protected/fr-008.test.ts
  - proves: F116-FR-008
- [x] T015 [P] [US1] Characterization test CT-116-9: pins, search path, effective configuration, caches and cached, in packages/integrity/test/protected/fr-009.test.ts
  - proves: F116-FR-009
- [x] T016 [P] [US1] Characterization test CT-116-10: authorisation from the task text at launch, in packages/integrity/test/protected/fr-010.test.ts
  - proves: F116-FR-010
- [x] T017 [P] [US1] Characterization test CT-116-11: suppression markers per file; no test counts, in packages/integrity/test/protected/fr-011.test.ts
  - proves: F116-FR-011
- [x] T018 [P] [US1] Characterization test CT-116-12: comparison at phase entry: switch, event, facts, no block, in packages/integrity/test/protected/fr-012.test.ts
  - proves: F116-FR-012
- [x] T019 [P] [US1] Characterization test CT-116-111 of integrity rule IR-11 (two classes, fingerprint at phase entry, tainted) in packages/integrity/test/protected/ir-11.test.ts
  - proves: IR-11; F116-FR-001; F116-FR-004; F116-FR-006
- [x] T020 [P] [US1] Characterization test CT-116-112 of integrity rule IR-12 (authorisation from the task text at launch) in packages/integrity/test/protected/ir-12.test.ts
  - proves: IR-12; F116-FR-010
- [x] T021 [P] [US1] Characterization test CT-116-116 of integrity rule IR-16 (results bound to the fingerprint) in packages/integrity/test/protected/ir-16.test.ts
  - proves: IR-16; F116-FR-008
- [x] T022 [P] [US1] Characterization test CT-116-131 of integrity rule IR-31 (fingerprint before and after, for the checks of a loop layer) in packages/integrity/test/protected/ir-31.test.ts
  - proves: IR-31; F116-FR-005
- [x] T023 [P] [US1] Characterization test CT-116-133 of integrity rule IR-33 (tree at phase entry equals the approved tree) in packages/integrity/test/protected/ir-33.test.ts
  - proves: IR-33; F116-FR-012
- [x] T024 [P] [US1] Characterization test CT-116-135 of integrity rule IR-35 (scope of the fingerprint) in packages/integrity/test/protected/ir-35.test.ts
  - proves: IR-35; F116-FR-003
- [x] T025 [P] [US1] Characterization test CT-116-136 of integrity rule IR-36 (executables, search path, configuration of the toolchain) in packages/integrity/test/protected/ir-36.test.ts
  - proves: IR-36; F116-FR-009
- [x] T026 [P] [US1] Characterization test CT-116-137 of integrity rule IR-37 (caches; cached is not a pass) in packages/integrity/test/protected/ir-37.test.ts
  - proves: IR-37; F116-FR-009
- [x] T027 [P] [US1] Characterization test CT-116-138 of integrity rule IR-38 (class A as patterns) in packages/integrity/test/protected/ir-38.test.ts
  - proves: IR-38; F116-FR-002
- [x] T028 [P] [US1] Characterization test CT-116-139 of integrity rule IR-39 (suppression markers) in packages/integrity/test/protected/ir-39.test.ts
  - proves: IR-39; F116-FR-011
- [x] T029 [P] [US1] Characterization test CT-116-140 of integrity rule IR-40 (exit result and conditions in separate fields) in packages/integrity/test/protected/ir-40.test.ts
  - proves: IR-40; F116-FR-008; F116-FR-017
- [x] T030 [P] [US1] Characterization test CT-116-141 of integrity rule IR-41 (authorisation covers class A) in packages/integrity/test/protected/ir-41.test.ts
  - proves: IR-41; F116-FR-010

### Implementation for User Story 1

- [x] T031 [US1] Implement the tree fingerprint with its scope, exclusions and metadata cache in packages/integrity/src/fingerprint/tree.ts
  - covers: F116-FR-003
- [x] T032 [US1] Implement the protected set: classes A and B, patterns evaluated at every comparison, listings of ignored paths, in packages/integrity/src/protected/set.ts
  - covers: F116-FR-001; F116-FR-002; F116-FR-003
- [x] T033 [US1] Implement fingerprints at launch and at phase entry and their storage under phase:<N>:protected-set in packages/integrity/src/protected/entry.ts
  - covers: F116-FR-004
- [x] T034 [US1] Implement the comparison before and after a check and the conditions tainted and changed-during-check in packages/integrity/src/protected/compare.ts
  - covers: F116-FR-005; F116-FR-006
- [x] T035 [P] [US1] Implement the value of protection from the containment level and the confirmation of the harness adapter, and hand it to the run record, in packages/integrity/src/protected/protection.ts
  - covers: F116-FR-007
- [x] T036 [P] [US1] Implement the binding of a result to its tree and the derivation of current and superseded in packages/integrity/src/result/freshness.ts
  - covers: F116-FR-008
- [x] T037 [P] [US1] Implement verification of pins, the search path at launch, the effective configuration and the handling of caches in packages/integrity/src/pins/verify.ts
  - covers: F116-FR-009
- [x] T038 [P] [US1] Implement authorisation from the task text at launch in packages/integrity/src/protected/authorise.ts
  - covers: F116-FR-010
- [x] T039 [P] [US1] Implement the count of suppression markers per file in packages/integrity/src/protected/markers.ts
  - covers: F116-FR-011
- [x] T040 [US1] Implement the comparison of the tree at phase entry with the approved tree, behind its switch, in packages/integrity/src/protected/phase-entry.ts
  - covers: F116-FR-012
- [x] T041 [US1] Offer fingerprints and comparisons to a loop layer as inputs of annex D §D.1 of feature 100, through the engine, in packages/integrity/src/index.ts
  - covers: F116-FR-001; F116-FR-005

**Checkpoint**: the independent test of user story 1 passes

---

## Phase 4: User Story 2 - The critic sees results, and nothing about how they came to be (Priority: P1)

**Goal**: The critic sees results, and nothing about how they came to be

**Independent Test**: Two fixtures with the same final tree and different histories give byte-identical fact blocks

### Tests for User Story 2

> Write these tests first; each must fail before the implementation

- [x] T042 [P] [US2] Characterization test CT-116-16: fact block built from the control plane; present only with a declared unit or an independent fact, in packages/integrity/test/factblock/fr-016.test.ts
  - proves: F116-FR-016
- [x] T043 [P] [US2] Characterization test CT-116-17: fields of the fact block per unit and command, in packages/integrity/test/factblock/fr-017.test.ts
  - proves: F116-FR-017
- [x] T044 [P] [US2] Characterization test CT-116-18: tasks as the proposer's declaration; unnamed tasks; the fixed sentence, in packages/integrity/test/factblock/fr-018.test.ts
  - proves: F116-FR-018
- [x] T045 [P] [US2] Characterization test CT-116-19: one test case per excluded field of the fact block, in packages/integrity/test/factblock/fr-019.test.ts
  - proves: F116-FR-019
- [x] T046 [P] [US2] Characterization test CT-116-20: byte-identical fact blocks for the same final state, in packages/integrity/test/factblock/fr-020.test.ts
  - proves: F116-FR-020
- [x] T047 [P] [US2] Characterization test CT-116-21: protected-set facts, integrity kinds, further facts, invalid ledger, marking of workspace values, in packages/integrity/test/factblock/fr-021.test.ts
  - proves: F116-FR-021
- [x] T048 [P] [US2] Characterization test CT-116-117 of integrity rule IR-17 (the fact block is built from the control plane) in packages/integrity/test/factblock/ir-17.test.ts
  - proves: IR-17; F116-FR-016
- [x] T049 [P] [US2] Characterization test CT-116-118 of integrity rule IR-18 (the same final state gives the same block) in packages/integrity/test/factblock/ir-18.test.ts
  - proves: IR-18; F116-FR-020
- [x] T050 [P] [US2] Characterization test CT-116-142 of integrity rule IR-42 (integrity events reach the critic) in packages/integrity/test/factblock/ir-42.test.ts
  - proves: IR-42; F116-FR-021
- [x] T051 [P] [US2] Characterization test CT-116-143 of integrity rule IR-43 (results per command and tree) in packages/integrity/test/factblock/ir-43.test.ts
  - proves: IR-43; F116-FR-018
- [x] T052 [P] [US2] Characterization test CT-116-144 of integrity rule IR-44 (escaping inside a data boundary) in packages/integrity/test/factblock/ir-44.test.ts
  - proves: IR-44; F116-FR-021
- [x] T053 [P] [US2] Characterization test CT-116-146 of integrity rule IR-46 (no fingerprint value per row) in packages/integrity/test/factblock/ir-46.test.ts
  - proves: IR-46; F116-FR-017

### Implementation for User Story 2

- [x] T054 [US2] Implement the builder of the fact block as a pure function of the final state in packages/integrity/src/factblock/build.ts
  - covers: F116-FR-016; F116-FR-017; F116-FR-020
- [x] T055 [P] [US2] Implement the rows of tasks as the proposer's declaration, the unnamed tasks and the fixed sentence in packages/integrity/src/factblock/tasks.ts
  - covers: F116-FR-018
- [x] T056 [P] [US2] Implement the protected-set facts, the integrity kinds, the further facts, the rows before an invalid ledger record, and the marking of workspace values in packages/integrity/src/factblock/facts.ts
  - covers: F116-FR-021
- [x] T057 [US2] Implement the static guard that no excluded field is a field of the builder's output in packages/integrity/src/factblock/excluded.ts
  - covers: F116-FR-019
- [x] T058 [US2] Offer the builder to a loop layer for its call point contributeCriticInput (annex D §D.1 of feature 100), through the engine, in packages/integrity/src/factblock/index.ts
  - covers: F116-FR-016

**Checkpoint**: the independent test of user story 2 passes

---

## Phase 5: User Story 3 - A consumer describes a toolchain as data (Priority: P2)

**Goal**: A consumer describes a toolchain as data

**Independent Test**: A profile for a fictional toolchain in a test overlay changes the protected set of a fixture

### Tests for User Story 3

> Write these tests first; each must fail before the implementation

- [x] T059 [P] [US3] Characterization test CT-116-13: toolchain profile: content, validation, unknown field, in packages/integrity/test/toolchain/fr-013.test.ts
  - proves: F116-FR-013
- [x] T060 [P] [US3] Characterization test CT-116-14: shipped and consumer profiles; the key `toolchains.<id>` accepted from user configuration only; project configuration, the environment and a flag ignored; the fictional toolchain, in packages/integrity/test/toolchain/fr-014.test.ts
  - proves: F116-FR-014
- [x] T061 [P] [US3] Characterization test CT-116-15: basic protection without a profile; the doctor names the toolchain, in packages/integrity/test/toolchain/fr-015.test.ts
  - proves: F116-FR-015

### Implementation for User Story 3

- [x] T062 [US3] Implement loading (shipped profiles; consumer profiles of the key `toolchains.<id>`, read under `user:toolchain:<id>`), validation and detection of toolchain profiles in packages/integrity/src/toolchain/load.ts
  - covers: F116-FR-013; F116-FR-014
- [x] T063 [P] [US3] Write the shipped toolchain profiles as data in packages/integrity/profiles/
  - covers: F116-FR-014
- [x] T064 [US3] Implement the basic protection in packages/integrity/src/toolchain/basic.ts, and the doctor check that names the toolchains a run detected and which have no profile, and warns of a profile given in project configuration, in packages/integrity/src/toolchain/doctor-check.ts, registered through the registration call of the kernel (F100-FR-234; annex G §G.7) and not in the package of the doctor (F112-FR-033)
  - covers: F116-FR-014; F116-FR-015
- [x] T065 [P] [US3] Add the cases of this feature to the conformance suite of EP-16 in packages/testkit/src/conformance/EP-16/, beside the contract-level suite of feature 100, with the sample profile of the fictional toolchain in packages/testkit/src/samples/EP-16/, given in a test overlay
  - covers: F116-FR-014

**Checkpoint**: the independent test of user story 3 passes

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: the success criteria and the checks across stories

- [x] T066 [P] Test that runs every tamper fixture and asserts the expected condition and never a pass, in tests/integrity/116/tamper/tamper.test.ts
  - proves: F116-FR-005; F116-FR-006; F116-FR-009 (F116-SC-001, part ii)
- [x] T067 [P] Test that with no unit of work declared no file, no event and no fingerprint of this feature exists beyond the layer allowlist, in tests/integrity/116/inert.test.ts
  - proves: F116-FR-004; F116-FR-016 (F116-SC-001, part i)
  - fixture: the second suite of feature 141 (F141-FR-039 to F141-FR-042)
- [x] T068 [P] Test that builds the fact block for every pair of the two-histories fixtures and compares bytes, in tests/integrity/116/two-histories/identical.test.ts
  - proves: F116-FR-020 (F116-SC-002)
- [x] T069 [P] Build check that every integrity rule of contracts/integrity-rules.json has a test file that names it, in packages/integrity/test/static/rules-have-tests.test.ts
  - proves: F116-FR-001 (F116-SC-003)
- [x] T070 Run every scenario of specs/116-check-integrity-and-unit-evidence/quickstart.md on Linux and on a macOS runner and record which statements marked `unverified` now hold
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F116-FR-007

---

## Phase 7: Repairs after the cross-feature review (2026-09-30)

**Purpose**: the tasks of what the review added. Task ids are appended; no earlier id changed. No task of this phase calls a model.

- [x] T071 [P] [US1] Characterization test CT-116-3, cases of an ignored path from which a check executes: the listing holds name, kind, size, mode, modification time and the time of the last change of status; a change of content that restores size and modification time changes the listing; a pinned executable and a file matched by a class A pattern are hashed by content; the record names the path and the files hashed by content, in packages/integrity/test/protected/fr-003-ignored.test.ts
  - proves: F116-FR-003; IR-35
- [x] T072 [P] [US1] Characterization test CT-116-22: one event `integrity.noted` with `kind` and `detail` per integrity event of the four kinds; no content and no output in `detail`; no event with no loop layer on and the switch of the comparison at phase entry off, in packages/integrity/test/events/fr-022.test.ts
  - proves: F116-FR-022
- [x] T073 [P] [US1] Characterization test CT-116-23: both records validate against their schema files and carry their schema id; an entry of `commands` has `id` and `exit`, written from `commandId` and `exitCode` of the value that the check runner returns; the `$id` of each of the three schema files is `urn:specstride:schema:<schema id>`, in packages/integrity/test/result/fr-023.test.ts
  - proves: F116-FR-023
- [x] T074 [US1] Implement the listing of an ignored path of class A and the content hashes inside it in packages/integrity/src/protected/listing.ts
  - covers: F116-FR-003
- [x] T075 [US1] Implement the emission of `integrity.noted` for the kinds this feature raises, through the engine, in packages/integrity/src/events/noted.ts
  - covers: F116-FR-022
- [x] T076 [US1] Implement the writers of the records `specstride.protected-set/1` and `specstride.check-result/1` and the mapping from the value of the check runner in packages/integrity/src/result/record.ts
  - covers: F116-FR-023
- [x] T077 Run the test of T071 on Linux and on a macOS runner and record whether the statement of F116-FR-003 on the time of the last change of status holds on each; until then it stays `unverified`, and a missing runner is a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F116-FR-003

---

## Dependencies & Execution Order

| Phase | Depends on | Note |
|---|---|---|
| 1 Setup | — | — |
| 2 Foundational | 1; proposal P-1 applied in feature 100 (T002 to T004) | Blocks every story |
| 3 US1 | 2; the check runner and the check manifest (feature 100 annex C §C.8, annex D §D.8) | The MVP |
| 4 US2 | US1 for the check results; the ledger (annex B §B.13) | — |
| 5 US3 | 2 | Can be built beside US1; US1 uses the profiles for class A |
| 6 Polish | US1 to US3; the second suite of feature 141 for the inertness test | — |
| 7 Repairs | 2; T071 to T076 belong to US1 and are done with phase 3, tests first; T077 with T070 | — |

Inside a story: tests first, then data, then logic, then the offer to the engine.

Delivery into the `contracts` package (analyze run of 2026-09-30): the sync script of feature 100 (its T008, `packages/contracts/scripts/sync.mjs`) clean-copies packages/contracts/data/ and packages/contracts/schemas/ from specs/100-specstride/contracts/, so a file placed there by hand is removed at the next sync. T002, T003 and T004 therefore deliver through contracts/deliver.json, which the sync reads after its clean copy under proposal P-1 of analyze-report.md ("Proposed upstream fixes"). Each of the three is done only when a sync keeps its files; until feature 100 applies P-1 they wait on it, and phase 2 of this feature with them.

## Parallel Example: User Story 1

```text
Tests of US1 marked [P] can be written together: each is a file of its own under packages/integrity/test/protected/.
Then, together: protection.ts, result/freshness.ts, pins/verify.ts, authorise.ts, markers.ts.
```

## Implementation Strategy

| Step | Content |
|---|---|
| MVP | Phases 1 to 3: a check that ran against a changed set is `tainted` |
| Then | US3, so that class A comes from profiles |
| Then | US2, the fact block |
| Last | Phase 6 |

