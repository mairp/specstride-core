---
description: "Task list of feature 124-harness-discovery-and-roles"
---

# Tasks: Harness roles and the critic order (feature 124, after the split)

**Input**: Design documents from `specs/124-harness-discovery-and-roles/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. User stories 2 and 6 left with the split, and their tasks with them; the tasks that stay were numbered again. Role resolution (US3) is built before the critic order (US1), because the pick is an entry of the role plan; both are priority P1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1, US3, US4, US5)
- Every task names its file. Paths are relative to the repository root
- Parity tests live in tests/parity/124/ and the characterization test that pins as-is behaviour against the reference (CT-124-50) in tests/characterization/124/, as the plan of feature 100 rules. The tests of new behaviour stay in the package
- A test task carries `proves:` with what it proves; a parity test also `fixture:` and `surfaces:` (feature 141, §O.6)
- An implementation task carries `covers:` with the requirements it serves

## Phase 1: Setup

- [ ] T001 Extend the descriptor-only fixture of the harness port in packages/harness/tests/conformance/fixtures/descriptor-only/: add a harness descriptor for the fake endpoint in the fixture's user configuration, with a declared context window and a cost class that is not `metered`, configure no critic, and add the expected announcement line, event and digest field. This is the inherited fixture work and comes first
  - covers: F124-SC-001
- [ ] T002 [P] Build the fixture lists of harnesses in packages/harness/tests/roles/fixtures/harnesses/: entries in the form of the field `harnesses` of feature 100, annex C §C.6, with every state, both forms of the `completion` level, every cost class, known and unknown windows, known and unknown terms
  - covers: F124-FR-038; F124-FR-040
- [ ] T003 [P] Create the directories packages/harness/src/roles/ and packages/harness/data/, and copy specs/124-harness-discovery-and-roles/contracts/ranking-table.json and qualification.json to packages/harness/data/
  - covers: F124-FR-038; F124-FR-040
- [ ] T004 [P] Add the four closed sets of specs/124-harness-discovery-and-roles/contracts/closed-sets.json to packages/contracts/src/closed-sets/harness-roles.ts, each with its branch for an unknown value
  - covers: F124-FR-024; F124-FR-037; F124-FR-038; F124-FR-047

## Phase 2: Foundational (blocks every user story)

- [ ] T005 [P] Characterization test CT-124-21 in packages/harness/tests/roles/registry-writer.test.ts: the record at `run:<runId>:registry` validates against `specstride.registry/1`, is written by a temporary name and a rename, and holds no secret value
  - proves: F124-FR-021
- [ ] T006 Implement the registry writer in packages/harness/src/roles/registry-writer.ts and the types of candidate, plan entry and critic pick in packages/harness/src/roles/types.ts
  - covers: F124-FR-021
- [ ] T007 [P] Static test in packages/harness/tests/static/no-harness-names.test.ts: no file under packages/harness/src/roles/ tests a harness name in control flow or holds a list of harnesses
  - proves: F124-SC-008

**Checkpoint**: the record can be written.

## Phase 3: User Story 3 - The proposer is what the consumer said (P1)

**Goal**: role resolution, the plan, names, the guarantee, the refusals, the carried as-is behaviour.

**Independent test**: quickstart scenarios 2 and 6.

### Tests

- [ ] T008 [P] [US3] Characterization tests CT-124-20 and CT-124-23 in packages/harness/tests/roles/resolve.test.ts: the same inputs give the same plan; every registered role is resolved for every phase with per-phase settings; an import check shows that no loop layer and no router imports role resolution
  - proves: F124-FR-020; F124-FR-023; F124-SC-006
- [ ] T009 [P] [US3] Characterization tests CT-124-24 and CT-124-25 in packages/harness/tests/roles/proposer.test.ts: the four sources; discovery never changes the proposer; an absent proposer refuses and names the candidates; the default roles on different model tiers
  - proves: F124-FR-024; F124-FR-025; F124-SC-005
- [ ] T010 [P] [US3] Characterization test CT-124-25-waiver in tests/parity/124/defaults-waived.test.ts: the scenario `FX-01/defaults-no-role-named` gives `waived (DV-004)` and no other difference
  - proves: F124-FR-025
  - fixture: FX-01/defaults-no-role-named
- [ ] T011 [P] [US3] Parity tests PT-124-C-060-critic-name and PT-124-C-061-critic-variable in tests/parity/124/critic-name.test.ts: the critic is named by flag and by its as-is variable; a name is not refused when arguments are parsed; a selection of the critic in project configuration is ignored with a message
  - proves: C-060; B-0799; C-061; B-0845
  - fixture: FX-01
  - surfaces: exit, transcript, events
- [ ] T012 [P] [US3] Parity test PT-124-C-051-model-unset in tests/parity/124/model.test.ts: with no model named no model argument is passed; with one named it is passed
  - proves: C-051; B-0467
  - fixture: FX-01
  - surfaces: transcript
- [ ] T013 [P] [US3] Parity test PT-124-C-054-unknown-proposer in tests/parity/124/unknown-proposer.test.ts: every pass ends with 127 and the as-is message; the loop goes on until a breaker or the pass limit ends it. The scenario `FX-18/unknown-harness-name` is a scenario of feature 141 and is the proof of B-0575; FX-01 cannot execute the line
  - proves: C-054; B-0575
  - fixture: FX-01, FX-18/unknown-harness-name
  - surfaces: exit, stderr, state, events
- [ ] T014 [P] [US3] Parity test PT-124-C-066-unknown-critic in tests/parity/124/unknown-critic.test.ts: the call fails with the as-is message and is scored MALFORMED with the result 10. The scenario `FX-07/unknown-harness-name` is a scenario of feature 141 and is the proof of B-0996; FX-01 cannot execute the line
  - proves: C-066; B-0996
  - fixture: FX-01, FX-07/unknown-harness-name
  - surfaces: exit, stderr, state, events
- [ ] T015 [P] [US3] Parity tests PT-124-C-012-usage-list and PT-124-C-057-usage-list in tests/parity/124/usage-list.test.ts: the usage text lists the harnesses of each role from the registry, in the as-is spelling, joined by ` | `. PT-124-C-057-usage-list has no entry point until a scenario prints the usage text of the pass loop; until then it is a skip with that reason, and B-0640 is proved by CT-124-50 (T041)
  - proves: C-012; B-0188
  - fixture: FX-01
  - surfaces: stdout, stderr
- [ ] T041 [P] [US3] Characterization test CT-124-50 in tests/characterization/124/pass-loop-usage-list.test.ts: the list of the harnesses of the proposer role, rendered from the registry as F124-FR-031 says, equals byte for byte the list that the usage text of the pass loop of the Specstride baseline at `9cab15d` shows in the place of its placeholder for the registry's display line; the expected text is a capture of the reference, read as data and made by no run of a model; an entry added to the registry appears in the list without a change of the test's code. The id is appended after the split; the task stands here because it is a test of US3
  - proves: C-057; B-0640
- [ ] T016 [P] [US3] Characterization test CT-124-28 in packages/harness/tests/roles/refuse-unknown.test.ts: with the default settings an unknown role name refuses the launch with the rendered list; with the switch off the name is carried into the run
  - proves: F124-FR-028
- [ ] T017 [P] [US3] Characterization tests CT-124-32, CT-124-33 and CT-124-36 in packages/harness/tests/roles/terms-fallbacks.test.ts: the terms gate is asked for every entry; a refused entry never enters the plan; fallbacks only by opt-in from user scope; unknown terms are usable when named and never otherwise
  - proves: F124-FR-032; F124-FR-033; F124-FR-036
- [ ] T018 [P] [US3] Characterization tests CT-124-34 and CT-124-35 in packages/harness/tests/roles/preflight-refusal.test.ts: a failed preflight of a primary refuses and names what is missing; `launch` ends `refused` with exit 4, a foreground `run` with exit 3; no run state is written
  - proves: F124-FR-034; F124-FR-035

### Implementation

- [ ] T019 [P] [US3] Implement names and the rendered list in packages/harness/src/roles/names.ts
  - covers: F124-FR-026; F124-FR-031
- [ ] T020 [P] [US3] Implement the proposer guarantee and the default roles in packages/harness/src/roles/proposer.ts
  - covers: F124-FR-024; F124-FR-025; F124-FR-027
- [ ] T021 [US3] Implement role resolution in packages/harness/src/roles/resolve.ts: the plan per phase and role, terms decisions, fallbacks, preflight, the refusals, the switch for unknown names and the two as-is results
  - covers: F124-FR-020; F124-FR-023; F124-FR-028; F124-FR-029; F124-FR-030; F124-FR-032; F124-FR-033; F124-FR-034; F124-FR-035; F124-FR-036
- [ ] T022 [US3] Wire role resolution into `launch` and `run` in packages/cli/src/commands/launch-roles.ts: the composition root hands in the list of harnesses, the resolved configuration and the terms gate
  - covers: F124-FR-021; F124-FR-035

**Checkpoint**: a launch has a plan; the proposer guarantee holds; six of the seven carried items pass their parity tests, and B-0640 passes its characterization test.

## Phase 4: User Story 1 - A run gets a diverse critic without configuration (P1)

**Goal**: the critic order, qualification, ranking, the pick, the pass-over, the announcement, the switch.

**Independent test**: quickstart scenarios 1 and 3.

### Tests

- [ ] T023 [P] [US1] Table test CT-124-37 in packages/harness/tests/roles/critic-order.test.ts: the four steps in order; a configured critic is never overridden; one pick per launch; one model tier only gives the same model with the warning; no critic at all refuses the launch
  - proves: F124-FR-037
- [ ] T024 [P] [US1] Table tests CT-124-38, CT-124-39 and CT-124-42 in packages/harness/tests/roles/qualify.test.ts: one case per condition Q1 to Q10 and per reason; an unverified harness of kind `cli` never qualifies; an unverified endpoint may; read-only tools only through a tested harness adapter; a metered candidate without a cap does not qualify
  - proves: F124-FR-038; F124-FR-039; F124-FR-042
- [ ] T025 [P] [US1] Table test CT-124-40 in packages/harness/tests/roles/rank.test.ts: candidates of both forms; every tool-less candidate before every candidate with read-only tools; each of the six keys decides once; the decision carries rule id and table version
  - proves: F124-FR-040
- [ ] T026 [P] [US1] Characterization tests CT-124-41 and CT-124-48 in packages/harness/tests/roles/pass-over.test.ts: a candidate whose read denial is not confirmed is passed over; a worker root that is not empty after one sweep passes over a candidate with read-only tools; a first call that does not prove the form passes over and produces no verdict; a first call proved by the weaker proof (a tested harness adapter whose stream carries no initial record; exact version pin, flag set and preflight — constitution v3.0.1, CQ-182) is believed and not passed over; each is announced and recorded; a configured critic is refused and not passed over
  - proves: F124-FR-041; F124-FR-048
- [ ] T027 [P] [US1] Characterization tests CT-124-43 and CT-124-44 in packages/harness/tests/roles/announce.test.ts: the line, the field `criticPick`, the event `critic.selected`; nothing printed under the `parity` profile; at most 3 lines and 600 bytes; with the automatic pick off steps 2 and 3 are skipped
  - proves: F124-FR-043; F124-FR-044
- [ ] T028 [P] [US1] Characterization test CT-124-49 in packages/harness/tests/roles/dry-pick.test.ts: the reading for the doctor gives the pick and the reason per losing candidate and writes nothing
  - proves: F124-FR-049
- [ ] T029 [US1] Conformance test in packages/harness/tests/conformance/autopick.test.ts on the fixture of T001: the announcement line, the event `critic.selected` and the digest field name the fake endpoint
  - proves: F124-SC-001

### Implementation

- [ ] T030 [P] [US1] Implement qualification from data in packages/harness/src/roles/qualify.ts
  - covers: F124-FR-038; F124-FR-039; F124-FR-042
- [ ] T031 [P] [US1] Implement the ranking through the table evaluator in packages/harness/src/roles/rank.ts
  - covers: F124-FR-040
- [ ] T032 [US1] Implement the critic order, the runners-up in the plan and the pass-over rule in packages/harness/src/roles/critic-order.ts
  - covers: F124-FR-037; F124-FR-041; F124-FR-044; F124-FR-048
- [ ] T033 [P] [US1] Implement the lines of this feature in packages/harness/src/roles/announce.ts and the reading for the doctor in packages/harness/src/roles/dry-pick.ts
  - covers: F124-FR-043; F124-FR-049

**Checkpoint**: the success criterion of `feature-briefs.md` section D.5 that this feature owns is met on the fixture.

## Phase 5: User Story 4 - A run resumes with the same roles (P2)

**Independent test**: quickstart scenario 5.

- [ ] T034 [P] [US4] Characterization test CT-124-22 in packages/harness/tests/roles/replay.test.ts: a resume and a relaunch read the record and rank nothing; a new resolution only by flag or when a harness of the plan no longer exists; a changed version or descriptor hash warns and keeps the pick
  - proves: F124-FR-022; F124-SC-006
- [ ] T035 [US4] Implement replay in packages/harness/src/roles/replay.ts
  - covers: F124-FR-022

## Phase 6: User Story 5 - A same-model setup warns and runs (P2)

**Independent test**: quickstart scenario 4.

- [ ] T036 [P] [US5] Characterization tests CT-124-45, CT-124-46 and CT-124-47 in packages/harness/tests/roles/diversity.test.ts: the critic-diversity warning at launch for the results `same-model` and `unverified` and for no other result, recorded, never blocking and never a launch check; a shared provider alone and a shared model tier alone do not warn; a higher effort on the same model warns; the rule applied before a critic-class call against the models of the passes of the phase attempt; identity from the host of the endpoint; an unknown real model is `unverified` and eligible
  - proves: F124-FR-045; F124-FR-046; F124-FR-047; F124-SC-004
- [ ] T037 [US5] Implement the critic-diversity rule in packages/harness/src/roles/diversity.ts, exported for the critic strategy seam
  - covers: F124-FR-045; F124-FR-046; F124-FR-047

## Phase 7: Polish and cross-cutting

- [ ] T038 [P] Profile test in packages/harness/tests/static/parity-rows.test.ts: every switch of this feature has a row in the `parity` profile (rows 35, 36, 90, 91 and 92 of annex X §X.7) with the value of specs/124-harness-discovery-and-roles/contracts/parity-rows.json
  - proves: F124-FR-028; F124-FR-042; F124-FR-045
- [ ] T039 Run every test of this feature on a macOS runner and record the result in packages/harness/data/verified-facts.json; until then every macOS statement stays `unverified`
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F124-FR-049
- [ ] T040 Run the scenarios of specs/124-harness-discovery-and-roles/quickstart.md and record the result
  - proves: F124-SC-001; F124-SC-004; F124-SC-005; F124-SC-006

## Dependencies

| Phase | Needs |
|---|---|
| Foundational | Setup |
| US3 | Foundational |
| US1 | US3 |
| US4 | US3 |
| US5 | US3 |
| Polish | all |

Outside this feature: the list of harnesses of the resolved registry (feature 100, annex C
§C.6), the harness port with `preflight` (annex C §C.1), the terms gate (annex C §C.12), the
table evaluator (annex X §X.3) and the event writer (annex X §X.1) must exist before the tests
of role resolution can pass on a real machine; on fixture lists they pass without. The digest
field needs the digest line of its owner.

## Parallel example

```text
Tests of US1, all at once, then qualification and ranking together, then the critic order.
```

## Implementation strategy

1. Setup, Foundational and US3 give a launch with a role plan and the proposer guarantee: the smallest useful increment, and the one the parity tests need.
2. US1 adds the automatic pick and meets the owned success criterion.
3. US4 and US5 add replay and the warning, each testable alone.
