---
description: "Task list of feature 147-terms-gate"
---

# Tasks: Terms gate (feature 147)

**Input**: Design documents from `specs/147-terms-gate/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. A test task is written before the task it tests and must fail before that task is done.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel
- **[Story]**: US1, US2
- A test task carries `proves:`; an implementation task `covers:`
- No task is a paid probe

## Phase 1: Setup

- [x] T001 Create the directory `packages/policy/src/terms/` in the package `@specstride/policy` per plan.md

## Phase 2: User Story 1 - The gate decides (Priority: P1)

- [x] T002 [P] [US1] Tests CT-147-101 to CT-147-106 in packages/policy/tests/unit/terms.test.ts: Tier 3, audience, row validation, `evaluate`, evaluation points, no bypass (every comment, flag, mode and project key of the configuration catalogue set, 0 `refused` decisions changed, F147-SC-001); `evaluate` under 1 ms per call (plan.md Performance Goals)
  - proves: F147-FR-001; F147-FR-002; F147-FR-003; F147-FR-004; F147-FR-005; F147-FR-006
- [x] T003 [P] [US1] Tests CT-147-107 to CT-147-113 in packages/policy/tests/unit/rows.test.ts: front harness, unknown terms, distributed default and opt-in with the event `terms.override_used`, tier default, shipped rows, SDK transport, replacement of data
  - proves: F147-FR-007; F147-FR-008; F147-FR-009; F147-FR-010; F147-FR-011; F147-FR-012; F147-FR-013
- [x] T004 [P] [US1] Conformance test CT-147-114 in packages/testkit/src/conformance/EP-11/ (frame of feature 100, cases of this feature): table tests generated from the matrix, one for each of the 42 cells and 0 decisions that differ (F147-SC-002); no Tier 3 row `allowed` in the shipped data (F147-SC-003); a fictional provider in a test overlay
  - proves: F147-FR-014
- [x] T005 [US1] Generate `packages/policy/src/terms/data/terms.json` from R8v's corrected matrix (42 cells), carrying the pi facts of R8v rows 37 to 40 from `terms-facts.json` of feature 134, and complete `contracts/terms-rows.tsv`
  - covers: F147-FR-003, F147-FR-007, F147-FR-009, F147-FR-010, F147-FR-011, F147-FR-012
- [x] T006 [US1] Read every cited provider page again and compare the quoted sentence with the row; record the date in the row (free, no login; OpenAI pages from the archive copy if the live page refuses)
  - covers: F147-FR-011
  - status: unverified until run
- [x] T007 [US1] Implement `evaluate` as a table for the table evaluator in packages/policy/src/terms/, with the default tier per audience, the refusal of a harness with no Tier 2 credential, and the gate call that records each decision and emits `terms.override_used` (plan.md Constraints)
  - covers: F147-FR-001, F147-FR-002, F147-FR-004, F147-FR-005, F147-FR-006, F147-FR-007, F147-FR-008, F147-FR-009, F147-FR-010, F147-FR-014

## Phase 3: User Story 2 - Data kept current (Priority: P2)

- [x] T008 [US2] Implement the loader of `user:terms` with replacement, ignore and doctor findings, and the data for the 30-day warning, in packages/policy/src/terms/
  - covers: F147-FR-013

## Phase 4: Polish

- [x] T009 Run the EP-11 conformance suite on the sample and the shipped data; check that no core file names them
- [x] T010 Confirm that "Assumptions" of spec.md still names no gap (the earlier gap was withdrawn on 2026-09-30); send the orchestrator any gap found then, else record that nothing was sent
- [x] T011 Record the macOS result and the skips: run the unit and conformance suites of this feature on a macOS runner where one exists and record the result; every test whose prerequisite is missing (a macOS runner, a networkless archive fetch) is a skip with its reason written down, never a pass (ruling 67; principle XVII)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

## Dependencies

T001 first. Test tasks before implementation tasks; T005 before T007. Across features: T025 of feature 134 (`terms-facts.json` for R8v rows 37 to 40) comes before T005 of this feature, which reads that file.
