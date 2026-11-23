---
description: "Task list of feature 115-micro-loop-layer"
---

# Tasks: Micro-loop layer (feature 115)

**Input**: Design documents from `specs/115-micro-loop-layer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required (`STAGE-B-RULES.md` section 3). This feature has no as-is behaviour, so it has no parity test of its own; every test is a characterization test `CT-115-<n>`. A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. Experiment X0 is the first task, because no paired run counts before it has passed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US6)
- Every task names its file
- A test task carries `proves:` with the requirement, and the integrity rule where it is the test of one
- An implementation task carries `covers:` with the requirements it serves
- A task marked **PAID** spends money on model calls. It is run by a person, never by a build job, and its cost is logged

## Path Conventions

Packages of the npm workspace, as in `plan.md` and in the package graph of feature 100: `packages/layer-micro/` (core; no import of `node:fs`), two directories of `packages/integrity/` (edge; the package is of feature 116), port interfaces in `packages/contracts/src/ports/`, data in `packages/contracts/data/`, the conformance suite in `packages/testkit/src/conformance/EP-06/` and the sample in `packages/testkit/src/samples/EP-06/`, the experiment kit in `experiments/115/`. Files of this feature in `packages/contracts/data/` and `packages/contracts/schemas/` end in `-115` (proposal U1 of `analyze-report.md`).

Tasks T139 to T141 were added on 2026-09-30, after the cross-feature review. The paths of T003, T015, T036, T041, T043, T081, T108 and T114 changed then; no task id was renumbered. T142 was added after the analyze run of the same day.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the precondition of every experiment, then the packages

- [x] T001 Build the stub part of experiment X0 (cost accounting): stub agents that emit usage and are killed mid-pass; measure the share of passes whose usage is complete or explicitly unavailable, in experiments/115/x0/
  - covers: F115-FR-066
  - proves: F115-FR-066 (precondition X0, stub part; pass mark 100 per cent of passes accounted for)
- [x] T002 Create the package `@specstride/layer-micro` in packages/layer-micro/ with `package.json` (no install script), `tsconfig.json` (strict) and a `test` script; imports are `@specstride/contracts` and `@specstride/kernel` only, and no file-system module (`node:fs`, `node:fs/promises`)
  - covers: F115-FR-002
- [x] T003 [P] Declare the interfaces of the two ports (claim reader of a checkpoint, tripwire store) in packages/contracts/src/ports/layer-micro.ts, and create the directories packages/integrity/src/checkpoint/ and packages/integrity/src/tripwire/ in the edge package `@specstride/integrity`, which feature 116 creates; no package of this feature's own is created
  - covers: F115-FR-010; F115-FR-041
- [x] T004 [P] Copy the files of specs/115-micro-loop-layer/contracts/ that no other task writes: `ledger-micro.json` and `integrity-rules.json` into packages/contracts/data/ as `ledger-micro-115.json` and `integrity-rules-115.json` (the second is read by T142), and `schemas/checkpoint.schema.json` into packages/contracts/schemas/ as `checkpoint-115.schema.json`; validate each against its schema in the build. The closed sets, the parity rows and the router table are written by T006, T007 and T078. Every file of this feature in packages/contracts/data/ and packages/contracts/schemas/ ends in `-115`, so that the sync of feature 100 keeps it (proposal U1 of `analyze-report.md`, "Proposed upstream fixes"), and none takes the name of a file of feature 100 (`closed-sets.json` is feature 100's)
  - covers: F115-FR-009; F115-FR-030
- [x] T005 [P] Create the experiment kit in experiments/115/ (layer `dev`, never shipped) with a cost log in experiments/115/cost-log.md that every PAID task appends to
  - covers: F115-FR-066

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what every story needs: the closed sets, the ledger namespace, the test proposer

**⚠️ CRITICAL**: no story can start before this phase is done

- [x] T006 Declare the 10 closed sets of `spec.md` with their rule for an unknown value in packages/contracts/data/closed-sets-115.json, and add them to the static test of closed sets
  - covers: F115-FR-005; F115-FR-011; F115-FR-030; F115-FR-034; F115-FR-039
- [x] T007 [P] Declare the rows of the `parity` profile that this feature owns (rows 1, 2, 3, 64 and 65 of annex X §X.7, with the key names of that annex) in packages/contracts/data/parity-rows-115.json, so that the profile test finds a value for every switch
  - covers: F115-FR-001; F115-FR-022; F115-FR-023; F115-FR-028; F115-FR-033; F115-FR-034
- [x] T008 [P] Build the test proposer that writes checkpoints, phase evidence and files from a script, in tests/layer/115/test-proposer/; it uses the stub library of feature 141 and is never part of the oracle's proposer stub
  - covers: F115-FR-009
- [x] T009 [P] Build the fixtures of units (four tasks and two commands; always fails; no command; one task) in tests/layer/115/fixtures/
  - covers: F115-FR-016; F115-FR-021
- [x] T010 Implement the skeleton of the eight call points, each returning `none`, in packages/layer-micro/src/callpoints/index.ts
  - covers: F115-FR-002

**Checkpoint**: the layer registers and is inert


---

## Phase 3: User Story 1 - Work is kept unit by unit (Priority: P1) (MVP)

**Goal**: Work is kept unit by unit

**Independent Test**: A fixture phase with four tasks and two inner commands, driven by the test proposer, ends with four kept units, four cycles spent, no pass counted towards the pass limit, and the rows of four units handed over at the phase gate

### Tests for User Story 1

> Write these tests first; each must fail before the implementation

- [x] T011 [P] [US1] Characterization test CT-115-2: registration, declared directives, no state outside the namespace, in packages/layer-micro/test/unit/fr-002.test.ts
  - proves: F115-FR-002
- [x] T012 [P] [US1] Characterization test CT-115-3: level L1 on a harness that is only declared, in packages/layer-micro/test/unit/fr-003.test.ts
  - proves: F115-FR-003
- [x] T013 [P] [US1] Characterization test CT-115-8: checkpoint contract block: protected, byte-stable, content, in packages/layer-micro/test/unit/fr-008.test.ts
  - proves: F115-FR-008
- [x] T014 [P] [US1] Characterization test CT-115-9: ids and bounded note read, other fields ignored, in packages/layer-micro/test/unit/fr-009.test.ts
  - proves: F115-FR-009
- [x] T015 [P] [US1] Characterization test CT-115-10: checkpoint file handling: regular file, no links, newer than the pass, size, two reads, stale removal, in packages/integrity/test/checkpoint/fr-010.test.ts
  - proves: F115-FR-010
- [x] T016 [P] [US1] Characterization test CT-115-11: one test case per refusal reason of a checkpoint, in packages/layer-micro/test/unit/fr-011.test.ts
  - proves: F115-FR-011
- [x] T017 [P] [US1] Characterization test CT-115-12: validation against the task list as read at launch (`run:<runId>:task-list`); a difference at the phase gate is given to the builder of the fact block as `task-list-changed`, in packages/layer-micro/test/unit/fr-012.test.ts
  - proves: F115-FR-012
- [x] T018 [P] [US1] Characterization test CT-115-13: every command of the inner set runs in every check, in packages/layer-micro/test/unit/fr-013.test.ts
  - proves: F115-FR-013
- [x] T019 [P] [US1] Characterization test CT-115-14: manifest hash and pins verified before a check, in packages/layer-micro/test/unit/fr-014.test.ts
  - proves: F115-FR-014
- [x] T020 [P] [US1] Characterization test CT-115-15: processes of the pass ended before a check; result is the observed exit status, in packages/layer-micro/test/unit/fr-015.test.ts
  - proves: F115-FR-015
- [x] T021 [P] [US1] Characterization test CT-115-16: outcomes kept, repair, unresolved, in packages/layer-micro/test/unit/fr-016.test.ts
  - proves: F115-FR-016
- [x] T022 [P] [US1] Characterization test CT-115-17: no commit, no reference, no write under the repository directory, in packages/layer-micro/test/unit/fr-017.test.ts
  - proves: F115-FR-017
- [x] T023 [P] [US1] Characterization test CT-115-21: unchecked is never a pass and never fails a unit, in packages/layer-micro/test/unit/fr-021.test.ts
  - proves: F115-FR-021
- [x] T024 [P] [US1] Characterization test CT-115-26: stop request, wall-clock budget and quota pause during a check; accelerated phase attempt, in packages/layer-micro/test/unit/fr-026.test.ts
  - proves: F115-FR-026
- [x] T025 [P] [US1] Characterization test CT-115-27: outer counters unchanged; the three exemptions; bound on passes, in packages/layer-micro/test/unit/fr-027.test.ts
  - proves: F115-FR-027
- [x] T026 [P] [US1] Characterization test CT-115-101 of integrity rule IR-01 (no writer of the phase gate in the layer) in packages/layer-micro/test/unit/ir-01.test.ts
  - proves: IR-01; F115-FR-002
- [x] T027 [P] [US1] Characterization test CT-115-106 of integrity rule IR-06 (inner events change no counter of the outer loop) in packages/layer-micro/test/unit/ir-06.test.ts
  - proves: IR-06; F115-FR-027
- [x] T028 [P] [US1] Characterization test CT-115-108 of integrity rule IR-08 (manifest hash verified before every check; exclusions by the runtime only) in packages/layer-micro/test/unit/ir-08.test.ts
  - proves: IR-08; F115-FR-014
- [x] T029 [P] [US1] Characterization test CT-115-109 of integrity rule IR-09 (a checkpoint is a claim) in packages/layer-micro/test/unit/ir-09.test.ts
  - proves: IR-09; F115-FR-009
- [x] T030 [P] [US1] Characterization test CT-115-110 of integrity rule IR-10 (the runtime runs each check itself) in packages/layer-micro/test/unit/ir-10.test.ts
  - proves: IR-10; F115-FR-015
- [x] T031 [P] [US1] Characterization test CT-115-113 of integrity rule IR-13 (output of a test the proposer ran is never a result) in packages/layer-micro/test/unit/ir-13.test.ts
  - proves: IR-13; F115-FR-015
- [x] T032 [P] [US1] Characterization test CT-115-115 of integrity rule IR-15 (unchecked) in packages/layer-micro/test/unit/ir-15.test.ts
  - proves: IR-15; F115-FR-021
- [x] T033 [P] [US1] Characterization test CT-115-123 of integrity rule IR-23 (pass given back; bound on passes) in packages/layer-micro/test/unit/ir-23.test.ts
  - proves: IR-23; F115-FR-027
- [x] T034 [P] [US1] Characterization test CT-115-132 of integrity rule IR-32 (end the processes of the pass before a check) in packages/layer-micro/test/unit/ir-32.test.ts
  - proves: IR-32; F115-FR-015
- [x] T035 [P] [US1] Characterization test CT-115-148 of integrity rule IR-48 (checkpoint passes leave the consecutive breakers) in packages/layer-micro/test/unit/ir-48.test.ts
  - proves: IR-48; F115-FR-027
- [x] T036 [P] [US1] Characterization test CT-115-155 of integrity rule IR-55 (handling of the checkpoint file) in packages/integrity/test/checkpoint/ir-55.test.ts
  - proves: IR-55; F115-FR-010
- [x] T037 [P] [US1] Characterization test CT-115-156 of integrity rule IR-56 (task list read at launch) in packages/layer-micro/test/unit/ir-56.test.ts
  - proves: IR-56; F115-FR-012
- [x] T038 [P] [US1] Characterization test CT-115-160 of integrity rule IR-60 (no commit, no revert) in packages/layer-micro/test/unit/ir-60.test.ts
  - proves: IR-60; F115-FR-017

### Implementation for User Story 1

- [x] T039 [US1] Implement registration of the layer with its declared directives and services in packages/layer-micro/src/register.ts
  - covers: F115-FR-002
- [x] T040 [US1] Implement the checkpoint contract block as a prompt block provider in packages/layer-micro/src/callpoints/contribute-prompt.ts
  - covers: F115-FR-008
- [x] T041 [P] [US1] Implement reading of a checkpoint as a claim (no links, no blocking, size, two reads, move into the control plane with the atomic write of the kernel, stale removal) behind the port of T003, in packages/integrity/src/checkpoint/read.ts
  - covers: F115-FR-009; F115-FR-010
- [x] T042 [US1] Implement validation and refusal of a checkpoint with the closed set of refusal reasons in packages/layer-micro/src/unit/validate.ts
  - covers: F115-FR-009; F115-FR-011
- [x] T043 [P] [US1] Implement the reading of `run:<runId>:task-list` through the read-only view of the phase attempt, and the comparison with the task list at the phase gate; the layer writes no task list; in packages/layer-micro/src/unit/task-list.ts
  - covers: F115-FR-012
- [x] T044 [US1] Implement the call point afterPass (accept, refuse, none) in packages/layer-micro/src/callpoints/after-pass.ts
  - covers: F115-FR-003; F115-FR-011
- [x] T045 [US1] Implement the inner check in the call point betweenPasses: verify manifest hash and pins, end the processes of the pass through the engine, run every command through the check runner, in packages/layer-micro/src/callpoints/between-passes.ts
  - covers: F115-FR-013; F115-FR-014; F115-FR-015
- [x] T046 [US1] Implement the outcomes kept, repair, unresolved and unchecked with their directives in packages/layer-micro/src/unit/outcome.ts
  - covers: F115-FR-016; F115-FR-017; F115-FR-021
- [x] T047 [US1] Implement the exemptions (giveIterationBack, exemptShortPass, exemptRepeatCounter) and the cycle count in packages/layer-micro/src/caps/exemptions.ts
  - covers: F115-FR-027
- [x] T048 [US1] Implement the call point contributeCriticInput: declare the builder of the fact block as a service, give it the units, the check results and the task list as read at launch, and return the rows it gives (feature 100, annex D §D.1 and §D.7), in packages/layer-micro/src/callpoints/contribute-critic-input.ts
  - covers: F115-FR-002; F115-FR-012
- [x] T049 [US1] Implement the handling of a stop request, the wall-clock budget and a quota pause around a check, and the accelerated phase attempt, in packages/layer-micro/src/callpoints/between-passes.ts
  - covers: F115-FR-026

**Checkpoint**: the independent test of user story 1 passes

---

## Phase 4: User Story 2 - A failed check is repaired inside the phase attempt (Priority: P1)

**Goal**: A failed check is repaired inside the phase attempt

**Independent Test**: A command that fails until the third proposal gives a kept unit after two repairs; a command that always fails gives an unresolved unit and an untouched tree

### Tests for User Story 2

> Write these tests first; each must fail before the implementation

- [x] T050 [P] [US2] Characterization test CT-115-18: failure block on the current tree with the marker token; fresh session for repair 2, in packages/layer-micro/test/repair/fr-018.test.ts
  - proves: F115-FR-018
- [x] T051 [P] [US2] Characterization test CT-115-19: failure signature; continued session dropped on a repeated signature and tree, in packages/layer-micro/test/repair/fr-019.test.ts
  - proves: F115-FR-019
- [x] T052 [P] [US2] Characterization test CT-115-20: flaky: one re-run, both results, excluded, still at the verification gate, in packages/layer-micro/test/repair/fr-020.test.ts
  - proves: F115-FR-020
- [x] T053 [P] [US2] Characterization test CT-115-22: one test case per cap: repairs, proposal time, unit time, cycles, unresolved units, in packages/layer-micro/test/repair/fr-022.test.ts
  - proves: F115-FR-022
- [x] T054 [P] [US2] Characterization test CT-115-23: check time limit and the 15 per cent share: exclusions slow and budget, in packages/layer-micro/test/repair/fr-023.test.ts
  - proves: F115-FR-023
- [x] T055 [P] [US2] Characterization test CT-115-24: interrupted check: first and second interruption, in packages/layer-micro/test/repair/fr-024.test.ts
  - proves: F115-FR-024
- [x] T056 [P] [US2] Characterization test CT-115-25: one test case per cause that switches the layer off for the phase attempt; a taint does not, in packages/layer-micro/test/repair/fr-025.test.ts
  - proves: F115-FR-025
- [x] T057 [P] [US2] Characterization test CT-115-28: closing check: when it runs, two returns, cycles spent, in packages/layer-micro/test/repair/fr-028.test.ts
  - proves: F115-FR-028
- [x] T058 [P] [US2] Characterization test CT-115-29: no stop once phase evidence exists; evidence set aside; evidence-predates-tree, in packages/layer-micro/test/repair/fr-029.test.ts
  - proves: F115-FR-029
- [x] T059 [P] [US2] Characterization test CT-115-33: router table: golden decisions, one row fires, invalid table, switch, in packages/layer-micro/test/repair/fr-033.test.ts
  - proves: F115-FR-033
- [x] T060 [P] [US2] Characterization test CT-115-34: escalation: trigger, target, caps, one test case per skip reason (`critic-collision` on a rung equal in model and in effort), in packages/layer-micro/test/repair/fr-034.test.ts
  - proves: F115-FR-034
- [x] T061 [P] [US2] Characterization test CT-115-35: escalation and the model-tier bump have separate counts, in packages/layer-micro/test/repair/fr-035.test.ts
  - proves: F115-FR-035
- [x] T062 [P] [US2] Characterization test CT-115-36: tools orders and excludes only; loop never switches on; no decision unless engaged, in packages/layer-micro/test/repair/fr-036.test.ts
  - proves: F115-FR-036
- [x] T063 [P] [US2] Characterization test CT-115-105 of integrity rule IR-05 (an inner result delays and never skips the phase gate) in packages/layer-micro/test/repair/ir-05.test.ts
  - proves: IR-05; F115-FR-028
- [x] T064 [P] [US2] Characterization test CT-115-107 of integrity rule IR-07 (no exit code and no stop reason) in packages/layer-micro/test/repair/ir-07.test.ts
  - proves: IR-07; F115-FR-025
- [x] T065 [P] [US2] Characterization test CT-115-114 of integrity rule IR-14 (flaky) in packages/layer-micro/test/repair/ir-14.test.ts
  - proves: IR-14; F115-FR-020
- [x] T066 [P] [US2] Characterization test CT-115-120 of integrity rule IR-20 (marker token on failure blocks) in packages/layer-micro/test/repair/ir-20.test.ts
  - proves: IR-20; F115-FR-018
- [x] T067 [P] [US2] Characterization test CT-115-147 of integrity rule IR-47 (the escalation target equals no critic-class call in model and in effort) in packages/layer-micro/test/repair/ir-47.test.ts
  - proves: IR-47; F115-FR-034
- [x] T068 [P] [US2] Characterization test CT-115-149 of integrity rule IR-49 (no stop once phase evidence exists) in packages/layer-micro/test/repair/ir-49.test.ts
  - proves: IR-49; F115-FR-029
- [x] T069 [P] [US2] Characterization test CT-115-150 of integrity rule IR-50 (interrupted checks; counts per task id) in packages/layer-micro/test/repair/ir-50.test.ts
  - proves: IR-50; F115-FR-024
- [x] T070 [P] [US2] Characterization test CT-115-153 of integrity rule IR-53 (limits of the router; the failure signature) in packages/layer-micro/test/repair/ir-53.test.ts
  - proves: IR-53; F115-FR-019; F115-FR-036

### Implementation for User Story 2

- [x] T071 [US2] Implement the failure block with the marker token of the run and the repair note in packages/layer-micro/src/callpoints/next-pass-block.ts
  - covers: F115-FR-018
- [x] T072 [P] [US2] Implement the failure signature and the rule for dropping a continued session in packages/layer-micro/src/unit/signature.ts
  - covers: F115-FR-019
- [x] T073 [P] [US2] Implement the re-run of a failed command and the condition flaky in packages/layer-micro/src/unit/flaky.ts
  - covers: F115-FR-020
- [x] T074 [US2] Implement the counters and caps (repairs per task id, proposal time, unit time, cycles, unresolved units) in packages/layer-micro/src/caps/caps.ts
  - covers: F115-FR-022
- [x] T075 [US2] Implement the exclusions slow and budget and the record of every exclusion in packages/layer-micro/src/caps/exclusions.ts
  - covers: F115-FR-023
- [x] T076 [US2] Implement the interrupted check in packages/layer-micro/src/caps/interrupted.ts
  - covers: F115-FR-024
- [x] T077 [US2] Implement layerOffForAttempt for every cause of F115-FR-025 in packages/layer-micro/src/caps/disengage.ts
  - covers: F115-FR-025
- [x] T078 [P] [US2] Write the shipped router table as data in packages/contracts/data/router-table-115.json from specs/115-micro-loop-layer/contracts/router-table.json, with every predicate in the nine operators of the table evaluator
  - covers: F115-FR-033
- [x] T079 [US2] Implement the signals and the calls of the table evaluator at the three decision points, with one event per decision and the rule id config-off for an invalid table, in packages/layer-micro/src/router/route.ts
  - covers: F115-FR-033; F115-FR-036
- [x] T080 [US2] Implement escalation as the second repair (trigger, target, caps, skip reasons, fresh session; the signals `targetIsCriticModel` and `targetSharesCriticModel`, and the critic-diversity warning for a rung that shares the model alone) in packages/layer-micro/src/router/escalation.ts
  - covers: F115-FR-034; F115-FR-035
- [x] T081 [P] [US2] Build the conformance suite of EP-06 (golden decisions, the one-row property) in packages/testkit/src/conformance/EP-06/ and the sample decision point in packages/testkit/src/samples/EP-06/
  - covers: F115-FR-033
- [x] T082 [US2] Implement the call point onEvidence with the closing check, the two returns, and phase evidence set aside in packages/layer-micro/src/closing/closing-check.ts
  - covers: F115-FR-028; F115-FR-029

**Checkpoint**: the independent test of user story 2 passes

---

## Phase 5: User Story 3 - The layer changes nothing when it is not used (Priority: P1)

**Goal**: The layer changes nothing when it is not used

**Independent Test**: The second suite of feature 141: no difference outside the layer allowlist and equal counters

### Tests for User Story 3

> Write these tests first; each must fail before the implementation

- [x] T083 [P] [US3] Characterization test CT-115-1: strategy pinned at launch and replayed on resume, in packages/layer-micro/test/inert/fr-001.test.ts
  - proves: F115-FR-001
- [x] T084 [P] [US3] Characterization test CT-115-4: fallback gate-not-executing in verification modes plan and off, in packages/layer-micro/test/inert/fr-004.test.ts
  - proves: F115-FR-004
  - fixture: the second suite of feature 141 (F141-FR-039 to F141-FR-042), every active family FX-01 to FX-40
- [x] T085 [P] [US3] Characterization test CT-115-5: one test case per fallback reason: gate-not-executing, config, harness, tripwire, no-check, single-unit, in packages/layer-micro/test/inert/fr-005.test.ts
  - proves: F115-FR-005
- [x] T086 [P] [US3] Characterization test CT-115-6: nothing executed and nothing recorded without a declared unit, in packages/layer-micro/test/inert/fr-006.test.ts
  - proves: F115-FR-006
  - fixture: the second suite of feature 141 (F141-FR-039 to F141-FR-042), every active family FX-01 to FX-40
- [x] T087 [P] [US3] Characterization test CT-115-7: time limits and runtime commands equal the classic loop until engaged, in packages/layer-micro/test/inert/fr-007.test.ts
  - proves: F115-FR-007
- [x] T088 [P] [US3] Characterization test CT-115-127 of integrity rule IR-27 (strategy pinned at launch; fallback announced) in packages/layer-micro/test/inert/ir-27.test.ts
  - proves: IR-27; F115-FR-001
- [x] T089 [P] [US3] Characterization test CT-115-134 of integrity rule IR-34 (the layer only where the verification gate executes) in packages/layer-micro/test/inert/ir-34.test.ts
  - proves: IR-34; F115-FR-004
- [x] T090 [P] [US3] Characterization test CT-115-152 of integrity rule IR-52 (inertness) in packages/layer-micro/test/inert/ir-52.test.ts
  - proves: IR-52; F115-FR-006
- [x] T091 [P] [US3] Characterization test CT-115-158 of integrity rule IR-58 (no difference until engaged) in packages/layer-micro/test/inert/ir-58.test.ts
  - proves: IR-58; F115-FR-007

### Implementation for User Story 3

- [x] T092 [US3] Implement the selection of the strategy at launch, its record per run and per phase attempt, and the replay on resume in packages/layer-micro/src/strategy/select.ts
  - covers: F115-FR-001
- [x] T093 [US3] Implement the fallback reasons and their announcement at launch and when they occur in packages/layer-micro/src/strategy/fallback.ts
  - covers: F115-FR-004; F115-FR-005
- [x] T094 [US3] Implement the state inert: every call point returns none and writes nothing until a checkpoint was accepted, in packages/layer-micro/src/strategy/engaged.ts
  - covers: F115-FR-006; F115-FR-007
- [x] T095 [US3] Report to feature 141 the logical name that the layer allowlist needs for F115-FR-012, `run:<runId>:task-list`, in specs/115-micro-loop-layer/analyze-report.md
  - covers: F115-FR-006

**Checkpoint**: the independent test of user story 3 passes

---

## Phase 6: User Story 4 - A run is resumed inside the life of a unit (Priority: P2)

**Goal**: A run is resumed inside the life of a unit

**Independent Test**: For each of the five resume states a fixture stops and resumes; action and counts equal the table

### Tests for User Story 4

> Write these tests first; each must fail before the implementation

- [x] T096 [P] [US4] Characterization test CT-115-30: record kinds of the namespace, written ahead, in packages/layer-micro/test/resume/fr-030.test.ts
  - proves: F115-FR-030 (F115-SC-009, the 11 record kinds)
- [x] T097 [P] [US4] Characterization test CT-115-31: one test case per resume state, in packages/layer-micro/test/resume/fr-031.test.ts
  - proves: F115-FR-031 (F115-SC-009, the 5 resume states)
- [x] T098 [P] [US4] Characterization test CT-115-32: counts continue after resume and relaunch; reset flag; invalid ledger, in packages/layer-micro/test/resume/fr-032.test.ts
  - proves: F115-FR-032
- [x] T099 [P] [US4] Characterization test CT-115-125 of integrity rule IR-25 (the ledger is chained and validated) in packages/layer-micro/test/resume/ir-25.test.ts
  - proves: IR-25; F115-FR-030
- [x] T100 [P] [US4] Characterization test CT-115-126 of integrity rule IR-26 (counts of the layer survive a resume) in packages/layer-micro/test/resume/ir-26.test.ts
  - proves: IR-26; F115-FR-032

### Implementation for User Story 4

- [x] T101 [US4] Implement the record kinds of the namespace micro, written ahead, in packages/layer-micro/src/ledger/records.ts
  - covers: F115-FR-030
- [x] T102 [US4] Implement the call point resume with the five resume states in packages/layer-micro/src/callpoints/resume.ts
  - covers: F115-FR-031
- [x] T103 [US4] Implement the counters read from the ledger, the reset, and the effect of an invalid ledger in packages/layer-micro/src/ledger/counters.ts
  - covers: F115-FR-032

**Checkpoint**: the independent test of user story 4 passes

---

## Phase 7: User Story 5 - The operator sees what the layer did, and a breach reverts it (Priority: P2)

**Goal**: The operator sees what the layer did, and a breach reverts it

**Independent Test**: A test build with a changed reject count raises the tripwire; the next launch is classic; tripwire clear exits 0

### Tests for User Story 5

> Write these tests first; each must fail before the implementation

- [x] T104 [P] [US5] Characterization test CT-115-37: every recordable fact of the layer is an event of the type that the table "Events of the layer" names, and no type is written that the catalogue does not hold; no output in events; inner cap marked as time limit, in packages/layer-micro/test/report/fr-037.test.ts
  - proves: F115-FR-037
- [x] T105 [P] [US5] Characterization test CT-115-38: the [LOOP] line: keys, order, values, absence under the parity profile, in packages/layer-micro/test/report/fr-038.test.ts
  - proves: F115-FR-038
- [x] T106 [P] [US5] Characterization test CT-115-39: one test case per breach kind; a refused act is no breach, in packages/layer-micro/test/report/fr-039.test.ts
  - proves: F115-FR-039
- [x] T107 [P] [US5] Characterization test CT-115-40: on a breach: layer off for the run, approval void, phase gated again, in packages/layer-micro/test/report/fr-040.test.ts
  - proves: F115-FR-040
- [x] T108 [P] [US5] Characterization test CT-115-41: tripwire record, later launches classic, tripwire clear exit codes 0, 1, 3; the events `tripwire.raised` and `tripwire.cleared`, the second in the next engine start; in packages/integrity/test/tripwire/fr-041.test.ts
  - proves: F115-FR-041
- [x] T109 [P] [US5] Characterization test CT-115-128 of integrity rule IR-28 (breach of the integrity of the phase gate) in packages/layer-micro/test/report/ir-28.test.ts
  - proves: IR-28; F115-FR-039

### Implementation for User Story 5

- [x] T110 [US5] Emit the facts of F115-FR-037 through the engine under the types of the table "Events of the layer" of `spec.md`; the types and their fields are those of the event catalogue of feature 111; in packages/layer-micro/src/report/events.ts
  - covers: F115-FR-037
- [x] T111 [US5] Implement the call point report with the fields of the [LOOP] line in packages/layer-micro/src/callpoints/report.ts
  - covers: F115-FR-038
- [x] T112 [US5] Implement the invariants of the integrity of the phase gate and the breach kinds as a reader of the event file and the ledger in packages/layer-micro/src/breach/invariants.ts
  - covers: F115-FR-039
- [x] T113 [US5] Implement the report of a breach to the engine with layerOffForRun in packages/layer-micro/src/breach/report.ts
  - covers: F115-FR-040
- [x] T114 [US5] Implement the tripwire record behind the port of T003, written with the atomic write of the kernel, and the fallback of later launches, in packages/integrity/src/tripwire/record.ts
  - covers: F115-FR-041
- [x] T115 [P] [US5] Implement the command tripwire clear with exit codes 0, 1 and 3 in packages/cli/src/commands/tripwire-clear.ts
  - covers: F115-FR-041
- [x] T116 [P] [US5] Implement the doctor checks for the tripwire and for the invariants in packages/doctor/src/checks/tripwire.ts
  - covers: F115-FR-039; F115-FR-041

**Checkpoint**: the independent test of user story 5 passes

---

## Phase 8: User Story 6 - The owner decides with data whether the default stays (Priority: P2)

**Goal**: The owner decides with data whether the default stays

**Independent Test**: The report of experiment X5 states the four measures for both arms and both strata

### Tests for User Story 6

> Write these tests first; each must fail before the implementation

- [x] T117 [P] [US6] Characterization test CT-115-64: records per check and the paired-run design, in experiments/115/test/fr-064.test.ts
  - proves: F115-FR-064
- [x] T118 [P] [US6] Characterization test CT-115-65: evaluation window, the 50:50 mix, the revert of the default, what counts as killed, in experiments/115/test/fr-065.test.ts
  - proves: F115-FR-065
- [x] T119 [P] [US6] Characterization test CT-115-66: order of experiments and the precondition X0, in experiments/115/test/fr-066.test.ts
  - proves: F115-FR-066

### Implementation for User Story 6

- [x] T120 [US6] Implement the record of every check (command id, duration, result) and the report of check time and fingerprint time per phase in packages/layer-micro/src/report/check-times.ts
  - covers: F115-FR-064
- [x] T121 [US6] Build the paired runner (ABBA order, same snapshot per phase, void pairs, pass time and wait time apart) in experiments/115/paired/runner.ts
  - covers: F115-FR-064; F115-FR-065
- [x] T122 [US6] Build experiment X1 (retrospective, two readers, no model call) in experiments/115/x1/
  - covers: F115-FR-066
- [x] T123 [US6] Build experiment X12 parts (i) to (iii) with stubs and the seeded tamperings in experiments/115/x12/; the seeded tamperings are read as data from the tamper fixtures of the owner of the result conditions (feature 100, annex C §C.8)
  - covers: F115-FR-066
- [x] T124 [US6] PAID, to be logged: run the live part of experiment X0 (20 live passes, 5 killed on purpose) and write cost and result to experiments/115/x0/report.md. Not run by a build job
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-066
- [x] T125 [US6] PAID, to be logged: run experiments X5 and X6 on the fixed 50:50 mix (about 100 hours alive and about 1,342 dollars notional per arm) and write experiments/115/x5/report.md and experiments/115/x6/report.md. Not run by a build job
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-065; F115-FR-066 (the reports are the four measures of F115-SC-001 for X5 and of F115-SC-002 for X6)
- [x] T126 [US6] PAID, to be logged: run the ablations X9, X10, X11 and the arm for the model-tier bump after critic rejections, and write experiments/115/ablations/report.md. Not run by a build job
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-066
- [x] T127 [US6] PAID, to be logged: run experiments X7 and X8 at unit level and write experiments/115/x7-x8/report.md. Not run by a build job
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-066
- [x] T128 [US6] PAID, to be logged: run experiment X12 part (iv) with live critic calls and write experiments/115/x12/critic-report.md. Not run by a build job
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-066
- [x] T129 [US6] Write the decision record of the evaluation window (targets shown or not; a breach recorded since the last release; the result of X12 parts (i) and (ii); the default of the next release, `classic` on a breach or a target not shown) in experiments/115/window/decision.md
  - covers: F115-FR-065; F115-FR-041; F115-FR-066

**Checkpoint**: the independent test of user story 6 passes

---

## Phase 9: Beneath a stacked layer, and polish

**Purpose**: what this layer does beneath the layer of parallel units; cross-cutting checks

- [x] T130 [P] Characterization test CT-115-42: integrated group as one kept unit; failed merge check charges one repair per task; nothing changes with parallel units off, in packages/layer-micro/test/stacked/fr-042.test.ts
  - proves: F115-FR-042
- [x] T131 Implement the entry of an integrated group as one kept unit and of a failed merge check into the repair path, with one repair charged to every task of the unit, in packages/layer-micro/src/unit/integrated-group.ts
  - covers: F115-FR-042
- [x] T132 [P] Static test: the package graph of packages/layer-micro/ imports no writer of the phase gate, starts no process, opens no connection and imports neither `node:fs` nor `node:fs/promises`, in packages/layer-micro/test/static/imports.test.ts
  - proves: IR-01; F115-FR-002
- [x] T133 [P] Test that asserts on the event file of every fixture run that no approval exists without a critic reply that matches the nonce, made after the full verification gate executed in the same phase attempt, in packages/layer-micro/test/static/never-approves.test.ts
  - proves: F115-FR-039 (F115-SC-003); F115-FR-041 (a breach on a fixture run fails the build, so it blocks the release)
- [x] T134 [P] Test that over all fixtures with the layer on the sets of exit codes, stop reasons and run states are subsets of those with the layer off, in packages/layer-micro/test/static/no-new-end.test.ts
  - proves: F115-FR-025 (F115-SC-007)
- [x] T135 [P] Test that the layer at L1 completes the descriptor-only fixture on a harness that is only declared, in tests/layer/115/descriptor-only.test.ts
  - proves: F115-FR-003 (F115-SC-005)
- [x] T136 Run the second suite of feature 141 against the layer and record the result in specs/115-micro-loop-layer/quickstart.md scenario 9
  - proves: F115-FR-006 (F115-SC-006)
  - fixture: the second suite of feature 141, every active family
- [x] T137 Run every scenario of specs/115-micro-loop-layer/quickstart.md on Linux and on a macOS runner and record which statements marked `unverified` now hold
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F115-FR-010; F115-FR-015
- [x] T138 Measure the size of the `[LOOP]` line (at most 300 bytes) and of the checkpoint contract block (at most 1,500 bytes) in the build, in packages/layer-micro/test/static/budget.test.ts
  - covers: F115-FR-008; F115-FR-038

### Added after the cross-feature review (2026-09-30)

Each test is written before the task it tests: T139 before T080, T140 before T043.

- [x] T139 [P] [US2] Characterization test CT-115-161: a rung that shares the model of a critic-class call and differs in effort is used, `targetSharesCriticModel` is recorded in `route.decided` and the critic-diversity warning is raised and recorded; a rung equal in model and in effort is skipped with `critic-collision`; stub agents only, in packages/layer-micro/test/repair/fr-034-critic-model.test.ts
  - proves: F115-FR-034; IR-47
- [x] T140 [P] [US1] Characterization test CT-115-162: the layer reads `run:<runId>:task-list` and writes no task list: after a fixture run the control plane holds no other file with a task list and no logical name of the layer for one, in packages/layer-micro/test/unit/fr-012-task-list.test.ts
  - proves: F115-FR-012
- [x] T141 [P] Static test: every key of packages/contracts/data/parity-rows-115.json is a key of row 1, 2, 3, 64 or 65 of the `parity` profile of feature 100 in its spelling (`proposalMin`, `unitMin`, `checkMin` included), and every closed set of packages/contracts/data/closed-sets-115.json carries its row number of annex X §X.6, in packages/layer-micro/test/static/contract-data.test.ts
  - covers: F115-FR-022; F115-FR-023; F115-FR-033

### Added after the analyze run (2026-09-30)

- [x] T142 [P] Static test: every integrity rule that packages/contracts/data/integrity-rules-115.json marks as owned by this feature names its test `CT-115-<n>`, every named test has a task in this file, and the number of owned rules is 28, so that the completeness claim of F115-SC-010 ("28 of 28 integrity rules owned here have a passing test") is proven mechanically beside the caps of T053 and the fallback reasons of T085, in packages/layer-micro/test/static/ir-coverage.test.ts
  - proves: F115-SC-010

---

## Dependencies & Execution Order

| Phase | Depends on | Note |
|---|---|---|
| 1 Setup | — | T001 (experiment X0, stub part) is first |
| 2 Foundational | 1 | Blocks every story |
| 3 US1 | 2; the call points, the check runner, the check manifest, fingerprints and the conditions of a result (feature 100, annex D §D.1, annex C §C.8, annex D §D.8) | The MVP |
| 4 US2 | US1 | Repairs need units |
| 5 US3 | 2 | Can be built beside US1; its proof needs the second suite of feature 141 |
| 6 US4 | US1, US2 | — |
| 7 US5 | US1; the event catalogue for event names; the approval record (annex B §B.14) for the voiding of an approval | — |
| 8 US6 | US1 to US5 for the live experiments; X1 and X12 (i) to (iii) need US3 and the tamper fixtures | PAID tasks run after X0 passed |
| 9 Stacked layer and polish | US1, US2; the layer of parallel units for the group | T139 and T140 are written with the tests of US2 and US1 |

Inside a story: tests first, then data, then logic, then call points.

## Parallel Example: User Story 2

```text
Tests of US2 marked [P] can be written together: each is a file of its own under packages/layer-micro/test/repair/.
Then, together: unit/signature.ts, unit/flaky.ts, the router table as data, the conformance suite of EP-06.
```

## Implementation Strategy

| Step | Content |
|---|---|
| MVP | Phases 1 to 3: a unit is declared, checked and kept |
| Then | US2 (repairs, router, escalation, closing check); US3 with the second suite |
| Then | US4, US5 |
| Last | The PAID experiments, inside the evaluation window |

