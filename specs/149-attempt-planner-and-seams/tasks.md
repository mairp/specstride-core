# Tasks: Attempt planner and seams (feature 149)

**Input**: Design documents from `specs/149-attempt-planner-and-seams/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: requested. This feature carries no as-is behaviour, so it has no parity test; its
tests are the characterization tests CT-149-1 to CT-149-10. Every test task names what it proves
and the fixture it runs on. Tests are written first and fail before the code exists.

**Organization**: by user story of the spec. No spike, fixture capture or live probe is assigned
to this feature.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: the user story of the spec (US1 to US4)
- `proves:` and `fixture:` under a test task; `criterion:` names a success criterion of the spec that the test measures
- "Port side only" marks a test that uses the stubs and fixtures of feature 141 without the reference; it is never counted as a parity test

## Path Conventions

Paths are those of plan.md: `packages/core/src/{ep18,integrity}/`,
`packages/testkit/src/{conformance,samples}/EP-18/`, `tests/characterization/149/`, and for the
set-up and closing tasks `packages/contracts/`, `tools/import-boundary/` and `tests/release/149/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create the directories packages/core/src/ep18/ and packages/core/src/integrity/ with an index file each, and the test directory tests/characterization/149/
- [x] T002 [P] Check that the three closed sets of the spec (rows 9, 253 and 254 of annex X §X.6: kinds of phase attempt, outcomes of the bump rule, reasons of a skipped bump) are exported by packages/contracts/src/enums/sets-145-149.ts (feature 100, its T256), each with the members and the unknown-value rule of the section "Closed sets" of the spec, and define no set a second time, in packages/contracts/test/closed-sets-149.test.ts
- [x] T003 [P] Write the bump table as a frozen constant equal to specs/149-attempt-planner-and-seams/contracts/bump-table.json in packages/core/src/ep18/bump-table.ts (not in packages/contracts/data/, which the sync script of feature 100 clean-copies), and validate it against `specstride.table/1` with the load check of the table evaluator of the kernel in tests/characterization/149/bump-table-load.test.ts; the same test asserts equality with the JSON file of the spec when it is present and reports a skip with its reason when it is not
- [x] T004 [P] Define the TypeScript types of the plan of the next phase attempt and of the outcome of one critic call (data-model.md), with a guard for each that applies the validation rule of data-model.md, in packages/contracts/src/ep/ep18-values.ts. Neither value is written as a record or crosses a process or file boundary, so neither gets a schema file or a schema id; the engine applies the guard to what a strategy or a planner returns

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user story can start before this phase is done

- [x] T005 Implement the read-only history of a phase, built from the records of phase attempts, the verdict records, the recovery markers and the ledger, in packages/core/src/ep18/history.ts (F149-FR-002)
- [x] T006 [P] Implement the registry of critic strategies and the registry of attempt planners, filled at process start and read-only after launch, in packages/core/src/ep18/critic-strategy.ts and packages/core/src/ep18/attempt-planner.ts (F149-FR-001, F149-FR-002)
- [x] T007 [P] Register the import-boundary rule "no package of a loop layer, no router, no critic strategy and no planner imports a writer of the phase gate" in tools/import-boundary/rules/gate-writers-149.json, copied from specs/149-attempt-planner-and-seams/contracts/gate-writers-rule.json, in the rule form of proposal P2 of analyze-report.md (F149-FR-007). Until `check:imports` reads rule files, T011 applies the same file itself: it reads the imports of every source file that `from` matches with the TypeScript compiler and fails with the file, the import and the rule id on an import that `forbid` matches. Done when that assertion fails on a test import of a writer of the phase gate from a package of a loop layer

**Checkpoint**: a seam can be registered and a history can be read

---

## Phase 3: User Story 1 - The critic never judges in a session of the proposer (Priority: P1) 🎯 MVP

**Goal**: every phase gate is judged through the seam, by one critic, in a fresh session

**Independent Test**: CT-149-1 over every fixture that reaches a critic call

### Tests for User Story 1 ⚠️

- [x] T008 [P] [US1] Own test CT-149-1: every critic call is a fresh session that no pass of the phase attempt used, holds no tools or the proven read-only form, and records its proof; the critic-diversity warning is raised, recorded and does not block; a strategy that throws and a verdict outside the closed set give MALFORMED; a strategy never sees a nonce, in tests/characterization/149/ct-149-01-critic-strategy.test.ts
  - proves: F149-FR-001
  - criterion: F149-SC-001
  - fixture: FX-01 to FX-08 and FX-14, every fixture that reaches a critic call (port side only)
  - surfaces: transcript.critic, events-primary

### Implementation for User Story 1

- [x] T009 [US1] Implement the seam of the critic strategy with the call function that the engine hands to a strategy in packages/core/src/ep18/critic-strategy.ts (F149-FR-001)
- [x] T010 [US1] Implement the strategy with one critic, and the comparison of the model of a call with the models that produced passes, in packages/core/src/ep18/critic-strategy.ts (F149-FR-001)

**Checkpoint**: a phase gate is judged through the seam

---

## Phase 4: User Story 2 - Nothing but the phase gate can approve (Priority: P1)

**Goal**: the invariants hold with every loop layer and the bump on

**Independent Test**: the static test on the package graph, the fuzz of the verdict parser, equal counts in the second suite

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Own test CT-149-7: fuzz of the verdict parser with every kind of ledger record and every kind of row of the fact block gives no verdict; the package graph shows one writer of the records of the phase gate, and no source file that `from` of tools/import-boundary/rules/gate-writers-149.json matches imports a module that its `forbid` matches (T007); no event of a loop layer changes a count of the phase gate; the sets of exit codes and stop reasons with a loop layer and the bump on are subsets of those with them off; the loop layer is called at `onEvidence` before the phase gate and at `contributeCriticInput` before the critic prompt is assembled, and the whole verification gate runs afterwards whatever the layer returned; a layer that fails at either call is off for the phase attempt and the phase gate runs in full, in tests/characterization/149/ct-149-07-invariants.test.ts
  - proves: F149-FR-007
  - criterion: F149-SC-002
  - fixture: FX-01 to FX-08 (port side only, with the layer on and stub agents that never declare a unit of work)
  - surfaces: counters, exit, events-primary
- [x] T012 [P] [US2] Own test CT-149-8: a tree that differs at phase entry from the fingerprint of the approval record of the phase before is an integrity event and a fact for the critic, and never blocks; off under the `parity` profile, in tests/characterization/149/ct-149-08-phase-entry.test.ts
  - proves: F149-FR-008
  - fixture: FX-01/three-phases (port side only), with a write between two phases
- [x] T013 [P] [US2] Own test CT-149-9: with the protected set changed without authority the verification gate runs, its result carries the condition, the critic is told through the fact block and an approval stays possible; an integrity event never halts and is never read as a verdict; off under the `parity` profile (row 31), in tests/characterization/149/ct-149-09-protected-set.test.ts
  - proves: F149-FR-009
  - fixture: FX-01 (port side only)

### Implementation for User Story 2

- [x] T014 [US2] Implement the guard that hands the writers of the phase gate to the phase gate only in packages/core/src/integrity/gate-writers-guard.ts (F149-FR-007)
- [x] T015 [US2] Implement the calls of the loop layer at `onEvidence` and `contributeCriticInput`, with the layer off for the phase attempt (the classic loop) when it fails at either call, in packages/core/src/integrity/layer-calls.ts (F149-FR-007)
- [x] T016 [P] [US2] Implement the comparison of the tree at phase entry, behind the switch of row 32 of the `parity` profile, in packages/core/src/integrity/phase-entry.ts (F149-FR-008)
- [x] T017 [P] [US2] Implement the phase gate with a changed protected set: the condition of the result is handed to the fact block and nothing halts, in packages/core/src/integrity/protected-set.ts (F149-FR-009)

**Checkpoint**: no path but the phase gate approves

---

## Phase 5: User Story 3 - A consumer switches the model-tier bump on (Priority: P2)

**Goal**: the option does what it says and nothing else; off, it changes nothing

**Independent Test**: CT-149-2 to CT-149-6 with stub agents

### Tests for User Story 3 ⚠️

- [X] T018 [P] [US3] Own test CT-149-2: a planner is a pure function of the history; a planner that throws and an unknown kind give `plain`; the two planners are called in their order; no exit code or stop reason comes from a planner, in tests/characterization/149/ct-149-02-planner.test.ts
  - proves: F149-FR-002
  - fixture: none; histories of the test tree
- [X] T019 [P] [US3] Own test CT-149-3: with the option off no surface of any fixture differs from a run of a build without the option (the same engine with the planner of the bump not registered); with it on and K rejections by the critic the next phase attempt runs on the rung above the model tier of the role plan, in tests/characterization/149/ct-149-03-bump-option.test.ts
  - proves: F149-FR-003
  - criterion: F149-SC-003
  - fixture: FX-01 to FX-08 (port side only, run twice)
- [X] T020 [P] [US3] Own test CT-149-4: K − 1 rejections bump nothing; K bump once; a failed verification gate, a MALFORMED verdict and a phase attempt without a verdict add nothing; a phase is bumped at most once; the next phase starts on the base model tier; limits and halts are unchanged; a phase attempt due for both is `accelerated` on the bumped model tier; the count is kept per phase in the ledger, survives a resume and is reset with the other counts on a reset on purpose, in tests/characterization/149/ct-149-04-bump-count.test.ts
  - proves: F149-FR-004
  - criterion: F149-SC-003
  - fixture: FX-03/reject-limit, FX-05, FX-08, FX-14/mode-required-fail (port side only)
- [X] T021 [P] [US3] Own test CT-149-5: a target equal to a critic-class call in model and in effort, a target with exhausted quota and the top of the ladder are skipped and recorded with the rule id; every bump and every skip is an event that carries the rule id, the version of the table and, for a skip, its reason; a bump stays on the harness of the proposer; after a skip the rule is evaluated again; a target that shares only the model of a critic-class call is used and raises and records the critic-diversity warning; no call is made to find out the quota; the phase attempt after a bump starts a fresh session; nothing of it is in the critic prompt, the fact block or the feedback, in tests/characterization/149/ct-149-05-bump-guards.test.ts
  - proves: F149-FR-005
  - fixture: FX-03 (port side only)
  - surfaces: transcript.critic, transcript.proposer, events-primary
- [X] T022 [P] [US3] Own test CT-149-6: golden decisions per row of the bump table; exactly one row fires for every vector of signals; an invalid table switches the bump off for the run, announced, and the planner gives the kind the recovery cycle gives; the count of the bump and the count of the escalation never read each other, in tests/characterization/149/ct-149-06-bump-table.test.ts
  - proves: F149-FR-006
  - fixture: none; vectors of signals of the test tree

### Implementation for User Story 3

- [X] T023 [US3] Implement the seam of the attempt planner with the fixed order of the planners in packages/core/src/ep18/attempt-planner.ts (F149-FR-002)
- [X] T024 [US3] Implement the planner of the recovery cycle, which gives `diagnosed` and `accelerated` from the facts `diagnosisMade` and `accelerationDue` of the history (data-model.md), as feature 100 annex E §E.1 states, in packages/core/src/ep18/planner-recovery.ts (F149-FR-002)
- [X] T025 [US3] Implement the planner of the model-tier bump over the bump table and the table evaluator of the kernel, with the signals of data-model.md, in packages/core/src/ep18/planner-tier-bump.ts (F149-FR-003, F149-FR-004, F149-FR-006)
- [X] T026 [US3] Implement the count of rejections by the critic in the ledger through the engine, the events of a bump and of a skip, and the fresh session of the phase attempt after a bump, in packages/core/src/ep18/planner-tier-bump.ts (F149-FR-004, F149-FR-005)
- [X] T027 [US3] Define the ablation arm of the bump for the experiments of the product (the default configuration against the default configuration with `attempt.tier_bump` on, same fixtures, measures and pass marks) in specs/149-attempt-planner-and-seams/contracts/ablation-tier-bump.md (F149-FR-006). The arm is not run here: every live run of it is PAID and MUST be logged with its cost before it starts

**Checkpoint**: the option is safe to switch on

---

## Phase 6: User Story 4 - An author adds a critic strategy or an attempt planner (Priority: P3)

**Goal**: the seams hold

**Independent Test**: the conformance suite of EP-18 on the samples; no core file differs

### Tests for User Story 4 ⚠️

- [x] T028 [P] [US4] Conformance test CT-149-10: the suite of specs/149-attempt-planner-and-seams/contracts/ep18-seams.md on the sample strategy, the sample planner and both planners of Wave 1; the build with and without the samples differs in no core file; the build fails when a core file names a sample, in packages/testkit/src/conformance/EP-18/ep18.conformance.test.ts
  - proves: F149-FR-010
  - criterion: F149-SC-004
  - fixture: FX-01, FX-02 (port side only)

### Implementation for User Story 4

- [x] T029 [P] [US4] Write the sample critic strategy that makes two calls and the sample attempt planner in packages/testkit/src/samples/EP-18/ (F149-FR-010)
- [x] T030 [US4] Write the conformance suite of both seams and register it in the frame of the test kit in packages/testkit/src/conformance/EP-18/ (F149-FR-010)

**Checkpoint**: EP-18 passes its suite

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T031 [P] Add the rows of this feature to the test of the `parity` profile (rows 24 and 128) in packages/contracts/test/profile.test.ts
- [x] T032 [P] Run the static vocabulary review of the test kit over specs/149-attempt-planner-and-seams/ and the sources of this feature: no bare term, no harness name in control flow, no physical path of state
- [x] T033 Run quickstart.md from section 1 to section 3 and record the results in tests/characterization/149/README.md
- [x] T034 Run the tests of this feature on the macOS runner when it exists and record the results in tests/release/149/macos.md; until a runner passes, every macOS statement stays `unverified` (the Constraints of `spec.md`). A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason, never a pass
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on | Blocks |
|---|---|---|
| 1 Setup | The workspace of feature 100 | Everything |
| 2 Foundational | Phase 1 | Every user story |
| 3 US1 | Phase 2 | US4 |
| 4 US2 | Phase 2; the assertions of T011 with the bump on pass once T025 and T026 are done | — |
| 5 US3 | Phase 2 | US4 |
| 6 US4 | T009 and T023 (the seams); T024 and T025 (the planners of Wave 1 that T028 runs the suite on) | — |
| 7 Polish | Every user story | — |

Outside this feature, through interface contracts of feature 100: the loop that calls `judge`
and `next`, the verdict parser and the records of a phase attempt (annex E §E.1, annex B §B.5);
the ledger (annex B §B.13); the approval record (annex B §B.14); the harness port and the role
plan (annex C §C.1, §C.6); the loop-layer interface and the fact block (annex D §D.1, §D.7); the
table evaluator (annex X §X.3). Until they exist, the tests of this feature use the samples of the
test kit.

### Within Each User Story

- Tests first; they fail before the code exists
- The seam before its implementations
- A checkpoint closes every story

### Parallel Opportunities

- T002 to T004 together; T006 and T007 together
- Every test task of one story together: each has a file of its own
- US1, US2 and US3 beside each other, once Phase 2 is done

## Parallel Example: User Story 3

```text
Together, before any code of the story:
T018 CT-149-2   T019 CT-149-3   T020 CT-149-4   T021 CT-149-5   T022 CT-149-6

Then, in order: T023 → T024 → T025 → T026
Beside them:    T027
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 and Phase 2
2. Phase 3: the seam of the critic strategy and the strategy with one critic
3. Stop and validate: CT-149-1 passes; F149-SC-001 holds

### Incremental Delivery

| Step | Adds | Proof |
|---|---|---|
| US1 | Judging through the seam | CT-149-1 |
| US2 | The invariants | CT-149-7 to CT-149-9 |
| US3 | The planner seam and the bump, off by default | CT-149-2 to CT-149-6 |
| US4 | The seams proven | CT-149-10 |

## Coverage of tests

| Test | Task | Test | Task |
|---|---|---|---|
| CT-149-1 | T008 | CT-149-6 | T022 |
| CT-149-2 | T018 | CT-149-7 | T011 |
| CT-149-3 | T019 | CT-149-8 | T012 |
| CT-149-4 | T020 | CT-149-9 | T013 |
| CT-149-5 | T021 | CT-149-10 | T028 |

## Notes

- No task calls a paid API. T027 defines an experiment and runs nothing
- A scenario that a test needs and the first set of feature 141 lacks is added inside the scope of its family, with the stub verbs and surfaces of feature 141 only
- Upstream (analyze run of 2026-09-30, follow-up): T003 and T004 place nothing in packages/contracts/data/ or packages/contracts/schemas/, so the sync script of feature 100 cannot remove a file of this feature. T007 writes its rule in the form of proposal P2 of analyze-report.md and T011 applies it until feature 100 adopts P2; once `check:imports` reads rule files, the assertion of T011 stays as a second check
