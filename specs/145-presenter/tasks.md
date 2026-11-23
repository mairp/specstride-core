---
description: "Task list of feature 145-presenter"
---

# Tasks: Presenter (feature 145)

**Input**: Design documents from `specs/145-presenter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/presenter.md, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task comes before the task it tests and must fail before that task is done.

**Organization**: Grouped by the user stories of `spec.md` (US1 to US3). No spike and no fixture capture of its own; FX-01, FX-02, FX-28 and FX-40 belong to feature 141.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel
- **[Story]**: US1 to US3
- A test task carries `proves:`; a parity test also `fixture:` and `surfaces:`
- An implementation task carries `covers:`

## Path Conventions

Module `packages/cli/src/present/`; tests in `tests/parity/145/` and `tests/characterization/145/`.

## Phase 1: Setup

- [ ] T001 Create packages/cli/src/present/ and the two test directories, loaded lazily, no native module
  - covers: F145-FR-001

## Phase 2: Foundational

**CRITICAL**: no story starts before this phase is done.

- [ ] T002 Write the tables as data in packages/cli/src/present/tables.ts: glyphs, ASCII substitutions, colour roles and codes, tool glyphs, timeline lines per event
  - covers: F145-FR-003; F145-FR-004; F145-FR-005; F145-FR-010; F145-FR-012; F145-FR-014
- [ ] T003 [P] Write the reader of one events file with skipping of bad lines and following with reopen in packages/cli/src/present/follow.ts
  - covers: F145-FR-006; F145-FR-011; F145-FR-022

## Phase 3: User Story 1 - A person watches a run in a terminal (Priority: P1) MVP

**Goal**: presenter, theme and banner on a terminal.

**Independent Test**: FX-40 scenarios on a pseudo-terminal.

### Tests

- [ ] T004 [P] [US1] Parity tests PT-145-C-096-* PT-145-C-097-* PT-145-C-098-* PT-145-C-100-* (options, detail levels, quiet mode) in tests/parity/145/options.test.ts
  - proves: C-096; C-097; C-098; C-100
  - fixture: FX-28, FX-40
  - surfaces: exit, stdout
- [ ] T005 [P] [US1] Parity tests PT-145-C-099-* (timeline and agent lines) and PT-145-C-101-* (totals) in tests/parity/145/timeline.test.ts
  - proves: C-099; C-101
  - fixture: FX-40, FX-01, FX-02, FX-28
  - surfaces: stdout
- [ ] T006 [P] [US1] Parity tests PT-145-C-102-* (rail, plain, card) and PT-145-C-103-* (presenter behaviour) in tests/parity/145/presenter.test.ts
  - proves: C-102; C-103
  - fixture: FX-28, FX-40
  - surfaces: stdout
- [ ] T007 [P] [US1] Parity tests PT-145-C-105-* PT-145-C-106-* PT-145-C-107-* (colour rules), PT-145-C-104-* (background) and PT-145-C-007-* (live flags of the theme) in tests/parity/145/colour.test.ts
  - proves: C-104; C-105; C-106; C-107; C-007; F145-SC-001
  - fixture: FX-01, FX-28, FX-40
  - surfaces: stdout, stderr
- [ ] T008 [P] [US1] Parity tests PT-145-C-081-* PT-145-C-082-* PT-145-C-083-* PT-145-C-084-* PT-145-C-085-* PT-145-C-086-* (banner) in tests/parity/145/banner.test.ts
  - proves: C-081; C-082; C-083; C-084; C-085; C-086
  - fixture: FX-01, FX-40
  - surfaces: stdout
- [ ] T009 [P] [US1] Characterization tests CT-145-1 and CT-145-2 (colour in modes; the presenter's source stream) in tests/characterization/145/ct-1-2.test.ts
  - proves: F145-FR-021; F145-FR-022
- [ ] T010 [P] [US1] Best-effort test: the presenter killed, absent, on a closed pipe in tests/characterization/145/best-effort.test.ts
  - proves: F145-SC-003; F145-FR-001

### Implementation

- [ ] T011 [P] [US1] Implement colour depth, background and ASCII resolution in packages/cli/src/present/theme.ts
  - covers: F145-FR-012; F145-FR-013; F145-FR-014; F145-FR-021
- [ ] T012 [P] [US1] Implement the banner, its options, environment, tiers and animation in packages/cli/src/present/banner.ts
  - covers: F145-FR-015; F145-FR-016; F145-FR-017
- [ ] T013 [US1] Implement the presenter core: modes, options, detail levels in packages/cli/src/present/presenter.ts
  - covers: F145-FR-001; F145-FR-002; F145-FR-003; F145-FR-004; F145-FR-005; F145-FR-006
- [ ] T014 [P] [US1] Implement the rail, totals, heartbeat and helpers in packages/cli/src/present/rail.ts
  - covers: F145-FR-007; F145-FR-008; F145-FR-010
- [ ] T015 [US1] Implement the card in packages/cli/src/present/card.ts
  - covers: F145-FR-009

## Phase 4: User Story 2 - The port prints the lines of the baseline (Priority: P1)

**Goal**: the engine's start-up record, halt banners and live mode.

**Independent Test**: FX-01 and FX-02 compare the engine's lines.

### Tests

- [ ] T016 [P] [US2] Parity tests PT-145-C-006-* and PT-145-C-013-* (live-mode flags; the live timeline and the run log in live mode) in tests/parity/145/live.test.ts
  - proves: B-0029; B-0030; B-0261; B-0262; B-0264; B-0265; B-0266
  - fixture: FX-28, FX-01, FX-02
  - surfaces: stdout, stderr, state
- [ ] T017 [P] [US2] Parity tests PT-145-C-012-* (start-up record lines) in tests/parity/145/startup.test.ts
  - proves: B-0195; B-0196; B-0197; B-0198; B-0200; B-0201
  - fixture: FX-28, FX-01, FX-02
  - surfaces: stdout, stderr, state
- [ ] T018 [P] [US2] Parity tests PT-145-C-012-* and PT-145-C-013-* (halt banners: B-0229 and B-0230 of C-012, B-0335 of C-013) in tests/parity/145/halt.test.ts
  - proves: B-0229; B-0230; B-0335
  - fixture: FX-28, FX-01, FX-02
  - surfaces: stdout, stderr

### Implementation

- [ ] T019 [US2] Implement the start-up record and the plain rail in the run log in packages/cli/src/present/startup.ts
  - covers: F145-FR-018
- [ ] T020 [US2] Implement the halt banners and the hypothesis in packages/cli/src/present/startup.ts
  - covers: F145-FR-019
- [ ] T021 [US2] Implement live-mode resolution and the background presenter with its 0.6 second grace in packages/cli/src/present/startup.ts
  - covers: F145-FR-020

## Phase 5: User Story 3 - The engine tells why it halted (Priority: P2)

**Goal**: the halt banners are checked on the halt scenarios.

- [ ] T022 [P] [US3] Scenario test of each halt cause in tests/parity/145/halt-scenarios.test.ts
  - proves: F145-FR-019
  - fixture: FX-01, FX-02

## Phase 6: Polish

- [ ] T023 Wire the parity gate for FX-01, FX-02, FX-28, FX-40 into the build (F145-SC-002) in tests/parity/145/gate.test.ts
  - proves: F145-SC-002
- [ ] T024 Run `quickstart.md` end to end and record the result
- [ ] T025 Run the tests of this feature on the macOS runner when it exists; until then every macOS statement of the feature (F145-FR-013) stays `unverified`; a test whose prerequisite is missing (the oracle of feature 141, the pseudo-terminal harness, a macOS runner) reports a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F145-FR-013; F145-SC-003
  - rules: Principle XVII; ruling 67

## Dependencies

Phase 2 blocks all. US1 precedes US2 (the start-up record calls the banner). Tests of a phase come before its implementation. T015 follows T013 and T014 (the card draws the rail and the totals and is a mode of the presenter). T022 is written with the tests of US2, before T020, and must fail before T020 is done; Phase 5 runs it on the halt scenarios.

## Implementation strategy

MVP: Phase 1, Phase 2, US1. Then US2 for the engine's lines.
