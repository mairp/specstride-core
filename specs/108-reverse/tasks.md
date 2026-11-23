---
description: "Task list of feature 108-reverse"
---

# Tasks: Reverse specification (feature 108)

**Input**: Design documents from `specs/108-reverse/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US4). Group G-B moved to feature 140; the inventory and the lint are reached through the CLI commands of feature 100.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US4)
- A test task carries `proves:` with what it proves; a parity test also `fixture:` and `surfaces:` (feature 141, §O.6)
- An implementation task carries `covers:` with the requirements it serves
- A paid or live probe is marked as such; none is part of this feature

## What feature 108 builds, and what it does not

It builds the package `@specstride/reverse` for the wrapper, the plan, the driver spec and the guard. The inventory, the lint and the shipped templates belong to another feature and are called through the CLI. It builds no gated loop, no skill text, no detach mechanism and no hasher. The parity tests use the fixture family FX-30 of feature 141; a scenario may be added inside its scope with the stub verbs of feature 141 only.

## Path Conventions

Package: `packages/reverse/src/<area>/` as in `plan.md`. Own tests: `tests/characterization/108/`. Parity tests: `tests/parity/108/`.


## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create the package `@specstride/reverse` in packages/reverse/ with `package.json` (no install script, layer L6), `tsconfig.json` (strict) and `src/index.ts`, importing only contracts, kernel and spec-formats
  - covers: F108-FR-001
- [x] T002 [P] Copy the schemas of `specs/108-reverse/contracts/` into packages/reverse/data/
  - covers: F108-FR-015; F108-FR-022
- [x] T003 [P] Register `@specstride/reverse` in the package graph check (layer L6; may import contracts, kernel and spec-formats only) in packages/contracts/data/package-graph.json
  - covers: F108-FR-001

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the one call that the plan and the guard make into the inventory

**CRITICAL**: no story can start before this phase is done

- [x] T004 Write the adapter through which the plan obtains the inventory as a call of the CLI command `reverse inventory`, and the reader of the inventory fields that the plan and the guard use (`fingerprint`, `files`, `skipped`, `excludes`, `walk`, `git_head`, `git_status`, `testautomation`, `oversize`, `units`, `project`, `specify`), in packages/reverse/src/plan/inventory-call.ts
  - covers: F108-FR-014; F108-FR-027

## Phase 3: User Story 1 - Reverse-engineer a repository into an as-is specification (Priority: P1)

**Goal**: the plan, the driver spec, the commands document, the launch and the run request.

**Independent Test**: `specstride reverse <fixture>` with the stub engine gives one engine call with the documented arguments and an untouched source.

- [x] T005 [P] [US1] Parity test PT-108-C-108-entry in tests/parity/108/wrapper.test.ts: the entry, the flags, the pass-through, the refusals, the commit switch, the dry-run lines and the launch line on FX-30/refused-flag and FX-30/plan. Test cases: PT-108-C-108-entry, PT-108-C-109-wrapper-flags, PT-108-C-109-passthrough, PT-108-C-110-commits-off, PT-108-C-111-refusals, PT-108-C-114-launching-line, PT-108-C-115-engine-invocation
  - proves: C-108; C-109; C-110; C-111; C-114; C-115
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T006 [P] [US1] Parity test PT-108-C-116-verbs in tests/parity/108/plan.test.ts: the verbs, the plan arguments, the tasks mode and the settings on FX-30/plan. Test cases: PT-108-C-116-verbs, PT-108-C-115-plan-keys, PT-108-C-117-plan-args, PT-108-C-117-tasks-flag, PT-108-C-118-tasks-env
  - proves: C-116; C-117; C-118
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T007 [P] [US1] Parity test PT-108-028FR025-naming in tests/parity/108/output.test.ts: default output naming, the slug and every refusal of an output directory on FX-30/plan. Test cases: PT-108-028FR025-naming, PT-108-028FR025-refusals, PT-108-C-120-out-refusals, PT-108-C-121-default-out, PT-108-C-123-slug
  - proves: 028 FR-025; C-120
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T008 [P] [US1] Parity test PT-108-C-121-plan-files in tests/parity/108/plan-files.test.ts: the files of the plan, the plan JSON, the driver spec, the phases, the commands document and the gate-state refusal, compared through the layout table. Test cases: PT-108-C-121-plan-files, PT-108-C-122-plan-json, PT-108-C-121-commands-document, PT-108-C-123-commands, PT-108-C-121-driver-structure, PT-108-C-123-phases, PT-108-C-123-policy, PT-108-C-123-phase-work, PT-108-C-123-criteria, PT-108-C-123-driver-structure, PT-108-C-123-driver-valid, PT-108-C-123-template-dir, PT-108-C-123-plan-inputs, PT-108-C-123-gate-state-refusal, PT-108-C-119-plan-exit, PT-108-C-111-plan-failure, PT-108-C-121-analysis-location
  - proves: C-121; C-122; C-123
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T009 [P] [US1] Characterization test CT-108-121 in tests/characterization/108/driver.test.ts: the generated driver parses in the native adapter and a driver edited after launch is detected through the source hash
  - proves: F108-FR-021
- [x] T010 [US1] Own test CT-108-109 in tests/characterization/108/detach.test.ts: a reverse run through the run request of kind `engine` survives the end of the host session, and the source tree is byte-identical before and after (a skip with its reason where no live host exists; `unverified` until the spike of feature 122 passes). Test cases: CT-108-109, PT-108-028SC006-source-untouched
  - out-of-band (owner ruling of 2026-09-30): the live-host part is never run and never faked here. Do the hermetic part on Linux, and record the live-host part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F108-FR-009; F108-SC-001
- [x] T018 [P] [US1] Characterization test CT-108-133 of the micro-loop rule: the plan of a reverse run holds a verification command in every phase and the profile sets `classic` in tests/characterization/108/loop-rule.test.ts
  - proves: F108-FR-033
- [x] T019 [P] [US1] Characterization test CT-108-110 in tests/characterization/108/comment.test.ts: the comment is stored with its hash before any repository text is printed, an explicit flag wins over prose, and a comment that asks to skip a check changes no check
  - proves: F108-FR-010
- [x] T020 [P] [US1] Characterization test CT-108-142 in tests/characterization/108/detach-flag.test.ts: `--detach` makes a run request of kind `engine`, and without it the engine runs in the foreground with its exit code. Test cases: CT-108-142, CT-108-162 (the handshake outcomes of a held lock, annex F §F.3)
  - proves: F108-FR-009
- [x] T011 [US1] Implement the slug, the default output naming and the output refusals in packages/reverse/src/plan/output.ts
  - covers: F108-FR-024; F108-FR-025; F108-FR-013
- [x] T012 [P] [US1] Implement the gate-state refusal in packages/reverse/src/plan/collision.ts
  - covers: F108-FR-026
- [x] T013 [US1] Implement the driver spec generator (structure, policy, phases, work, criteria) and its native validation in packages/reverse/src/plan/driver.ts
  - covers: F108-FR-016; F108-FR-017; F108-FR-018; F108-FR-019; F108-FR-020; F108-FR-021; F108-FR-023
- [x] T014 [P] [US1] Implement the verification-commands document in packages/reverse/src/plan/commands.ts, validated against `contracts/verification-commands.schema.json`
  - covers: F108-FR-022
- [x] T015 [US1] Implement `plan`: the writes, the plan JSON validated against `contracts/plan-output.schema.json`, and the verb dispatch in packages/reverse/src/plan/plan.ts
  - covers: F108-FR-011; F108-FR-012; F108-FR-014; F108-FR-015
- [x] T016 [US1] Implement the wrapper: flags, pass-through, refusals, the launch, the commit switch, `--detach` and the comment in packages/reverse/src/wrapper/wrapper.ts
  - covers: F108-FR-001; F108-FR-002; F108-FR-003; F108-FR-004; F108-FR-006; F108-FR-007; F108-FR-008; F108-FR-009; F108-FR-010
- [x] T017 [US1] Wire the oversize inventory into the driver: one unit phase per unit in packages/reverse/src/plan/driver.ts
  - covers: F108-FR-018

## Phase 4: User Story 2 - Know that the source was not touched (Priority: P1)

**Goal**: the guard.

**Independent Test**: a changed file gives `changed: <path>` and exit 3; a clean run gives `guard: ok`.

- [x] T021 [P] [US2] Parity test PT-108-028FR026-guard-walk in tests/parity/108/guard.test.ts: the comparison, the problems and their order, `testautomation/`, the git checks, the output lines and the exit codes on FX-30/guard-refuses. Test cases: PT-108-028FR026-guard-walk, PT-108-C-117-guard-args, PT-108-C-119-guard-exit, PT-108-C-122-guard-lines, PT-108-C-122-guard-problems, PT-108-C-122-guard-git, PT-108-C-122-guard-testautomation, PT-108-C-123-guard-compare, PT-108-C-123-guard-order, PT-108-C-123-guard-git, PT-108-C-123-guard-testautomation
  - proves: 028 FR-026; 028 SC-006; C-119; C-122
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T022 [P] [US2] Characterization test CT-108-132 in tests/characterization/108/guard-links.test.ts: a link swapped in after the inventory is not followed, and stub counters and the control plane never count as a change
  - proves: F108-FR-032
- [x] T023 [US2] Implement the guard in packages/reverse/src/guard/guard.ts, with the comparison, the problems, `testautomation/`, the git checks, the printing and the exit codes
  - covers: F108-FR-027; F108-FR-028; F108-FR-029; F108-FR-030; F108-FR-031; F108-FR-032

## Phase 5: User Story 3 - See the plan without launching (Priority: P2)

**Goal**: the dry run.

**Independent Test**: `reverse --dry-run` prints the plan lines and launches nothing.

- [x] T024 [P] [US3] Parity test PT-108-C-114-dry-run in tests/parity/108/dry-run.test.ts: the dry-run lines and exit 0 in compatibility output on FX-30/plan. Test cases: PT-108-C-114-dry-run, PT-108-C-111-dry-run-exit
  - proves: C-114; C-111
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T025 [US3] Implement the dry run: the plan lines and the engine command in packages/reverse/src/wrapper/dry-run.ts
  - covers: F108-FR-005


## Phase 6: User Story 4 - Be refused before anything is written (Priority: P2)

**Goal**: refusals write nothing.

**Independent Test**: one fixture per refusal.

- [x] T026 [US4] Own test CT-108-160 in tests/characterization/108/refusals.test.ts: each refusal of F108-FR-004, F108-FR-013, F108-FR-025 and F108-FR-026 leaves the source and the plan files unchanged
  - proves: F108-FR-004; F108-FR-013; F108-FR-025; F108-FR-026

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T027 [P] Own tests CT-108-134 and CT-108-140, the measure of F108-FR-034 and F108-SC-006: default output of every command that the skill calls stays within 1,120 bytes, 2,240 on failure, in tests/characterization/108/budget.test.ts
  - proves: F108-FR-034; F108-SC-006
- [x] T028 Own test CT-108-138: run the FX-30 scenarios of the first set with the profile `parity`, assert exits 0, 2 and 3 as F108-SC-004 says, and record every result other than `equal`; report any needed scenario to feature 141
  - proves: F108-SC-004
- [x] T029 Add the rows of "Rows of the `parity` profile" and "Closed sets" of `spec.md` to the data of feature 100 through the orchestrator (a report, not an edit)
  - covers: F108-FR-011
- [x] T030 Run `specs/108-reverse/quickstart.md` scenarios 1 to 6 and record the results
  - covers: F108-FR-001 to F108-FR-034
- [x] T031 [P] [US2] Characterization test CT-108-161 in tests/characterization/108/baseline-schema.test.ts: a baseline without the field `schema`, or with a schema id or a major that the guard does not know, is refused with exit 3 and the compatibility line `not an inventory: <path>` (F100-FR-049)
  - proves: F108-FR-027
- [x] T032 Run the parity tests and the characterization tests of this feature on the macOS runner of the build workflow of feature 100 when it exists, and record the result per test with the version of the system in tests/characterization/108/macos.md; until then every macOS statement of this feature stays `unverified`. A test whose prerequisite is missing (git, the reference tree, the oracle, a live host for CT-108-109, a macOS runner) reports a skip with its reason and never a pass (Principle XVII)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F108-FR-009; F108-FR-027

## Dependencies

Phase 1 then Phase 2. Stories 1 and 2 need Phase 2; story 3 needs story 1; story 4 needs story 1. Test tasks come before the implementation they test; T026, the acceptance test of story 4, follows the refusal tasks T011, T012 and T016.

## Parallel opportunities

Tasks marked [P] in one phase touch different files.

## Implementation strategy

MVP is story 1 with story 2: a plan, a launch and a guard. Then the dry run (story 3) and the refusals (story 4).

