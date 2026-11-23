---
description: "Task list of feature 140-reverse-inventory-and-lint"
---

# Tasks: Reverse inventory and lint (feature 140)

**Input**: Design documents from `specs/140-reverse-inventory-and-lint/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US3)
- A test task carries `proves:`; a parity test also `fixture:` and `surfaces:` (feature 141, §O.6)
- An implementation task carries `covers:` with the requirements it serves

## What feature 140 builds, and what it does not

It builds the inventory, the lint and the shipped templates in the package of the reverse capability. It builds no wrapper, plan, driver spec, guard or run request. Parity tests use the fixture family FX-30 of feature 141; a scenario may be added inside its scope with the stub verbs of feature 141 only.

## Path Conventions

`packages/reverse/src/<area>/` as in `plan.md`. Own tests: `packages/reverse/test/`. Parity tests: `tests/parity/140/`.


## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create the directories `src/inventory/`, `src/lint/` and `templates/` in packages/reverse/ (the package `@specstride/reverse`, owners 108 and 140 in `package-graph.json`; the package itself is created by the wrapper feature's setup task; where it does not exist yet, create `package.json` there with no install script)
  - covers: F140-FR-015
- [x] T002 [P] Copy the five Spec Kit templates of the baseline unchanged, with their MIT notice and a text file that records the upstream commit, into packages/reverse/templates/
  - covers: F140-FR-026
- [x] T003 [P] Copy `contracts/finding-codes.json` and `contracts/inventory.schema.json` into packages/reverse/data/ and add a check that `src/codes.ts` equals `finding-codes.json` to the build
  - covers: F140-FR-003; F140-SC-001

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: byte-exact helpers and the finding type

**CRITICAL**: no story can start before this phase is done

- [x] T004 Write the test `CT-140-4` first: code-point comparator, document serializer (sorted keys, one space, non-ASCII kept) and fingerprint serializer (compact, non-ASCII escaped, surrogate pairs) against strings that Python produced at `9cab15d`, in packages/reverse/test/serialize.test.ts
  - proves: F140-FR-021
  - fixture: FX-30
- [x] T005 Implement the code-point comparator and the two serializers in packages/reverse/src/inventory/serialize.ts
  - covers: F140-FR-021
- [x] T006 Implement `src/codes.ts` from `contracts/finding-codes.json` and the finding type with the text and JSON printers in packages/reverse/src/lint/findings.ts
  - covers: F140-FR-003

## Phase 3: User Story 1 - Check a produced specification with the lint (Priority: P1)

**Goal**: the lint with its 38 finding codes and its levels.

**Independent Test**: one fixture per code raises exactly that code; a clean directory exits 0.

- [x] T007 [P] [US1] Parity tests PT-140-028FR027-levels, PT-140-C-123-levels, PT-140-C-117-lint-args, PT-140-C-119-exit-codes, PT-140-C-122-lint-output, PT-140-C-123-lint-order and PT-140-C-120-evidence-skipped in tests/parity/140/lint-levels.test.ts: the levels, the ownership, the arguments, the output, the order and the exit codes of the lint on the 38 scenarios of the pattern `lint-<code>` of FX-30
  - proves: 028 FR-027; C-119; C-117; C-122; C-123; C-120
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T008 [P] [US1] Parity tests PT-140-C-120-template-rules, PT-140-C-123-template-rules, PT-140-C-120-placeholder, PT-140-C-123-placeholder-set, PT-140-C-120-structure and PT-140-C-123-contracts in tests/parity/140/lint-templates.test.ts: template, placeholder and structure findings on FX-30/lint-template-mandatory, FX-30/lint-template-family, FX-30/lint-template-expected, FX-30/lint-placeholder, FX-30/lint-structure-extra, FX-30/lint-structure-contracts and FX-30/lint-structure-required
  - proves: C-120; C-123
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T009 [P] [US1] Parity tests PT-140-C-120-evidence-fields, PT-140-C-123-evidence-grammar, PT-140-C-120-evidence-missing, PT-140-C-123-claim-block, PT-140-C-120-citations and PT-140-C-123-citation-resolution in tests/parity/140/lint-evidence.test.ts: evidence format, kind, confidence, validation, citations and missing comments on FX-30/lint-evidence-format, FX-30/lint-evidence-kind, FX-30/lint-evidence-confidence, FX-30/lint-evidence-validation, FX-30/lint-evidence-disproved, FX-30/lint-evidence-citation, FX-30/lint-evidence-contradicts, FX-30/lint-evidence-missing, FX-30/lint-evidence-skipped and FX-30/lint-unknowns-placement
  - proves: C-120; C-123
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T010 [P] [US1] Parity tests PT-140-C-120-spec-rules, PT-140-C-123-spec-grammar, PT-140-C-120-design-rules, PT-140-C-123-design-claims, PT-140-C-120-tasks-rules, PT-140-C-123-tasks-grammar, PT-140-C-120-coverage-claims and PT-140-C-123-coverage in tests/parity/140/lint-spec.test.ts: the rules of `spec.md`, the design artifacts, `tasks.md`, coverage and claims on FX-30/lint-spec-fr-format, FX-30/lint-spec-sc-format, FX-30/lint-spec-fr-unique, FX-30/lint-spec-sc-unique, FX-30/lint-spec-story-format, FX-30/lint-spec-story-numbers, FX-30/lint-spec-story-parts, FX-30/lint-spec-clarifications, FX-30/lint-research-decisions, FX-30/lint-data-model-entities, FX-30/lint-checklist-items, FX-30/lint-tasks-grammar, FX-30/lint-tasks-line-format, FX-30/lint-tasks-ids, FX-30/lint-tasks-phase-order, FX-30/lint-tasks-story-labels, FX-30/lint-tasks-story-exists, FX-30/lint-tasks-parallel-files, FX-30/lint-tasks-mode, FX-30/lint-coverage-fr and FX-30/lint-claims-missing
  - proves: C-120; C-123; C-122
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T011 [P] [US1] Parity tests PT-140-C-132-templates-shipped, PT-140-C-136-spec-template-rules and PT-140-C-137-tasks-template-rules in tests/parity/140/templates.test.ts: the shipped templates equal the baseline's bytes, and their rules give the as-is findings
  - proves: C-132; C-133; C-134; C-135; C-136; C-137
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T012 [P] [US1] Own tests CT-140-1 and CT-140-2 in packages/reverse/test/lint-codes.test.ts: every output line of the lint over all fixtures carries a code of the closed family, and every code is raised by at least one fixture
  - proves: F140-SC-001; F140-SC-002
- [x] T013 [US1] Implement the lint frame: arguments, levels, ownership, template loading and the finding sort in packages/reverse/src/lint/lint.ts
  - covers: F140-FR-001; F140-FR-002; F140-FR-003; F140-FR-004
- [x] T014 [P] [US1] Implement the template, placeholder and structure rules in packages/reverse/src/lint/templates.ts
  - covers: F140-FR-005; F140-FR-006; F140-FR-007
- [x] T015 [P] [US1] Implement the evidence grammar, claim blocks and citation resolution in packages/reverse/src/lint/evidence.ts
  - covers: F140-FR-008; F140-FR-009; F140-FR-010
- [x] T016 [P] [US1] Implement the rules of `spec.md`, the design artifacts and the checklist in packages/reverse/src/lint/spec.ts
  - covers: F140-FR-011; F140-FR-012
- [x] T017 [P] [US1] Implement the rules of `tasks.md` through the spec-format adapter, the coverage rule and the claims file in packages/reverse/src/lint/tasks.ts
  - covers: F140-FR-013; F140-FR-014
- [x] T018 [US1] Ship the templates through the loader and check the notice in packages/reverse/src/lint/shipped.ts
  - covers: F140-FR-026

## Phase 4: User Story 2 - Inventory a source tree deterministically (Priority: P1)

**Goal**: the inventory, its fingerprint and its summary.

**Independent Test**: two runs over one tree give byte-identical inventories.

- [x] T019 [P] [US2] Parity tests PT-140-C-124-inventory-verb, PT-140-C-125-inventory-flags, PT-140-C-130-inventory-path, PT-140-C-126-limits, PT-140-C-128-integer-error, PT-140-C-118-context-budget, PT-140-C-127-inventory-exit, PT-140-C-128-git-error, PT-140-C-129-inventory-document and PT-140-C-129-summary in tests/parity/140/inventory.test.ts: the inventory verb, flags, limits, exit codes, the inventory document and the summary on FX-30/plan; the inventory is compared after the key `schema` is removed (DV-116)
  - proves: C-124; C-125; C-126; C-127; C-128; C-129; C-130; C-118
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T020 [P] [US2] Parity tests PT-140-C-131-git-walk, PT-140-C-131-file-walk, PT-140-C-131-classification, PT-140-C-131-entries, PT-140-C-131-fingerprint, PT-140-C-131-manifests, PT-140-C-131-specify-facts and PT-140-C-131-summary-budget in tests/parity/140/inventory-walk.test.ts: the walks, the ignore rules, the entries, the manifests, the entry points, the units, the fingerprint and the summary on FX-30/plan, with a non-ASCII path and an oversize tree
  - proves: C-131; C-129
  - fixture: FX-30
  - surfaces: exit, stdout, stderr, tree, state
- [x] T021 [P] [US2] Own test CT-140-3 in packages/reverse/test/determinism.test.ts: two runs over one tree give byte-identical inventories and the fingerprint equals the baseline's
  - proves: F140-SC-003
- [x] T022 [US2] Implement the inventory walk core: the git mode and the file-system mode with the ignore rules, exclusions and state names in packages/reverse/src/inventory/walk.ts
  - covers: F140-FR-017; F140-FR-018
- [x] T023 [P] [US2] Implement file entries, classification of language and role, hashing through the kernel hasher, links and skip reasons in packages/reverse/src/inventory/entries.ts
  - covers: F140-FR-019; F140-FR-020
- [x] T024 [US2] Implement the inventory document with the field `schema` (`specstride.reverse-inventory/1`) and the as-is field `schema_version` 1, totals, `oversize`, the fingerprint and the `testautomation` snapshot in packages/reverse/src/inventory/document.ts, validated against `contracts/inventory.schema.json`; the test T034 of Phase 6 is written first and must fail before this task is done
  - covers: F140-FR-021
- [x] T025 [P] [US2] Implement the limits and their settings with the positive-integer error in packages/reverse/src/inventory/limits.ts
  - covers: F140-FR-016
- [x] T026 [P] [US2] Implement the manifest readers, frameworks and the Spec Kit facts in packages/reverse/src/inventory/project.ts
  - covers: F140-FR-022; F140-FR-024
- [x] T027 [P] [US2] Implement the inventory summary renderer with the budget rule and atomic writes in packages/reverse/src/inventory/summary.ts
  - covers: F140-FR-025
- [x] T028 [US2] Implement the verb `inventory` and its exit codes in packages/reverse/src/inventory/cli.ts
  - covers: F140-FR-001; F140-FR-015

## Phase 5: User Story 3 - Reverse a large repository unit by unit (Priority: P2)

**Goal**: `oversize`, workspaces, units and entry points.

**Independent Test**: a fixture over the total limit gives `oversize` true and the units.

- [x] T029 [P] [US3] Parity test PT-140-C-131-entry-points-units in tests/parity/140/units.test.ts: a fixture over the total limit and a fixture with workspaces give the units, the entry points and `oversize` as the reference
  - proves: C-131
  - fixture: FX-30/plan
  - surfaces: exit, stdout, stderr, tree, state
- [x] T030 [US3] Implement entry points, workspaces and units in packages/reverse/src/inventory/units.ts
  - covers: F140-FR-023

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T031 Check that the rows of "Rows of the `parity` profile" and "Closed sets" of `spec.md` equal row 69 of annex X §X.7 and rows 146 to 149 and 151 to 155 of annex X §X.6 in the data of feature 100; report a difference to the orchestrator (a report, not an edit)
  - covers: F140-FR-016
- [x] T032 Run the FX-30 scenarios of the first set with the profile `parity` and record every result other than `equal`; report any needed scenario to feature 141
  - covers: F140-FR-001
- [x] T033 Run `specs/140-reverse-inventory-and-lint/quickstart.md` scenarios 1 to 8 and record the results
  - covers: F140-FR-001 to F140-FR-026
- [x] T034 [P] Own test CT-140-5 in packages/reverse/test/inventory-schema.test.ts, written before T024 is done: the inventory carries `schema` `specstride.reverse-inventory/1` and `schema_version` 1; the fingerprint is the same with and without the key; the file validates against `contracts/inventory.schema.json`, whose `$id` is `urn:specstride:schema:specstride.reverse-inventory/1`; the lint's `--baseline` refuses an inventory without the key, with an unknown id or with another major (`not an inventory: <path>`, exit 3); the inventory with the key removed equals the baseline's bytes
  - proves: F140-FR-021
- [x] T035 Run the parity tests and the own tests of this feature on the macOS runner when it exists, a case-insensitive file system included, and record the result per test in tests/parity/140/README.md; until then every macOS statement stays `unverified` (the `status:` line of F140-FR-017 and the target platform of plan.md). A test whose prerequisite is missing (`git`, the reference tree, the oracle of feature 141, a macOS runner) reports a skip with its reason and never a pass
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F140-FR-017
- [x] T036 [P] Measure the default output of `reverse inventory` (within 1,120 bytes, 2,240 on a failure) and record the size of the output of `reverse lint` per scenario of FX-30, with the byte helper of T194 of feature 100 (`packages/testkit/src/static/budget.ts`), in packages/reverse/test/output-bytes.test.ts
  - covers: F140-FR-001; F140-FR-003; F140-FR-015

## Dependencies

Phase 1 then Phase 2. Story 1 needs the templates of Phase 1 and the finding type of Phase 2; story 2 needs the serializers of Phase 2; story 3 needs story 2. Test tasks come before the implementation they test; T034 of the last phase is written before T024 is done. No task of this feature calls a model.

## Parallel opportunities

Tasks marked [P] in one phase touch different files. The lint tasks of story 1 can be split among workers by file; so can the inventory tasks of story 2.

## Implementation strategy

MVP is story 1 (the lint) with story 2 (the inventory). Then the unit view of story 3.

