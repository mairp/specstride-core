---
description: "Task list of feature 110-config-and-terms"
---

# Tasks: Configuration and terms (feature 110)

**Input**: Design documents from `specs/110-config-and-terms/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US3). The probe of the keychain is the first task, because F110-FR-031 rests on it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: US1 to US3
- A test task carries `proves:`; a parity test also `fixture:`
- An implementation task carries `covers:`
- No task here is a paid probe: no task calls a model or a provider API

## Phase 1: Setup and probes

- [x] T001 Probe the keychain existence query on Linux and on a macOS runner: create a test entry, query its existence with the output discarded, remove it; record the result in `research.md`. The probe never reads a real credential and prints no value
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F110-FR-031
  - status: unverified until run on both platforms
- [x] T002 Check every baseline default of `contracts/config-keys.tsv` against the built-in defaults of the Specstride baseline at `9cab15d` (`git -C <baseline checkout> show 9cab15d:orchestrator.sh`; `.env.example` counts only where it repeats a built-in default, F110-FR-006); list any difference for the orchestrator
  - covers: F110-FR-006
- [x] T003 Create the package `packages/config` per plan.md
- [x] T004 [P] Write the generator and check that derives `contracts/config-keys.tsv` from the tables of `spec.md` §K.3 to §K.6b and fails when they differ (the file holds exactly those 259 keys; the old spelling of every correction and withdrawal of §K.9 lives in the `confirmed_or_corrected` column of the standing key)
  - covers: F110-FR-001, F110-FR-009
- [x] T005 [P] Complete `contracts/alias-table.tsv` from the 226 items of kind `env` of `docs/ecosystem/research/R18-behaviour-inventory.tsv`: one row per variable, or a row in "not carried"; the locally registered backend's variables are omitted (DV-064)
  - covers: F110-FR-020

## Phase 2: Foundational (schema, profile, files)

- [x] T006 [P] Static tests CT-110-108 and CT-110-109 in packages/config/tests/unit/catalogue.test.ts: every key has class, snapshot class, owner, and a default of its own type; a key read by any package is in the catalogue
  - proves: F110-FR-009; F110-FR-010
- [x] T007 [P] Test CT-110-102 in packages/config/tests/unit/spelling.test.ts: unknown key refused with the nearest key ignoring case and underscores; `x-` ignored; environment names by rule 3; `--set` reaches every key
  - proves: F110-FR-002
- [x] T008 [P] Test CT-110-101 and CT-110-106 in packages/config/tests/unit/types.test.ts: type and range errors name key, value, layer, range; workers and parallelism above 4 are errors
  - proves: F110-FR-001; F110-FR-007
- [x] T009 Implement the schema types, the catalogue data and the validators in packages/config/src/schema/
  - covers: F110-FR-001, F110-FR-002, F110-FR-005, F110-FR-007, F110-FR-009, F110-FR-010
- [x] T010 [P] Test CT-110-107 and CT-110-112 in packages/config/tests/unit/profile.test.ts: every switch has a profile row, no row without a key, the literals, selecting `parity` sets only switches, explicit settings beat it, a project file cannot select it; then implement packages/config/data/profile-parity.json
  - proves: F110-FR-008; F110-FR-013
  - covers: F110-FR-008, F110-FR-013
- [x] T011 Test CT-110-103, CT-110-104, CT-110-110 and implement the file loader: `schema` major, locations of `user:config` and `project:config`, no search above the workspace, the install-root `.env` never read, `state.dir`
  - proves: F110-FR-003; F110-FR-004; F110-FR-011
  - covers: F110-FR-003, F110-FR-004, F110-FR-011

## Phase 3: User Story 1 - Values with a source (Priority: P1)

- [x] T012 [P] [US1] Test CT-110-113 and CT-110-114 in packages/config/tests/unit/precedence.test.ts: eight ranks, last flag wins, lists replace, `harnesses` merge by id
  - proves: F110-FR-014; F110-FR-016
- [x] T013 [P] [US1] Parity test PT-110-DV025-pass-ceiling in packages/config/tests/parity/learned.test.ts
  - proves: F110-FR-015; DV-025
  - fixture: FX-29
- [x] T014 [P] [US1] Tests CT-110-115, CT-110-116, CT-110-117 in packages/config/tests/unit/trust.test.ts: widening keys ignored with one message and one finding each; narrowing accepted only if stricter (each direction of the catalogue); task eligibility and scope narrowing
  - proves: F110-FR-017; F110-FR-018; F110-FR-019
- [x] T015 [P] [US1] Tests CT-110-118, CT-110-119, CT-110-120, CT-110-121 in packages/config/tests/unit/provenance.test.ts: `--set`, the source of every value, `config show` with `--all`, shadowed values, exit codes 0 and 3, no secret value printed
  - proves: F110-FR-021; F110-FR-024; F110-FR-025; F110-FR-026
- [x] T016 [US1] Implement the merge through the eight ranks in packages/config/src/load/merge.ts
  - covers: F110-FR-014, F110-FR-016
- [x] T017 [US1] Implement per-phase inheritance, the declared default and the learned place in packages/config/src/load/phase.ts
  - covers: F110-FR-015
- [x] T018 [US1] Test CT-110-111 and implement `config schema` and the token-budget check of `config show` and `config schema` in CI
  - proves: F110-FR-012
  - covers: F110-FR-012
- [x] T019 [US1] Implement the trust filter in packages/config/src/load/trust.ts
  - covers: F110-FR-017, F110-FR-018, F110-FR-019
- [x] T020 [US1] Implement provenance and `config show` in packages/config/src/load/provenance.ts and packages/config/src/cli/show.ts
  - covers: F110-FR-021, F110-FR-024, F110-FR-025, F110-FR-026

## Phase 4: User Story 2 - The oracle drives both systems (Priority: P1)

- [x] T021 [P] [US2] Parity test PT-110-alias-env in packages/config/tests/parity/alias.test.ts through the alias table
  - proves: F110-FR-020
  - fixture: FX-01; FX-13; FX-14
- [x] T022 [P] [US2] Parity test PT-110-DV024-resume in packages/config/tests/parity/resume.test.ts: pinned keys replay, tunable keys follow the environment
  - proves: F110-FR-022; DV-024
  - fixture: FX-13
- [x] T023 [P] [US2] Parity test PT-110-DV026-pins in packages/config/tests/parity/pins.test.ts
  - proves: F110-FR-023; DV-026
  - fixture: FX-35; FX-36
- [x] T024 [P] [US2] Parity test PT-110-defaults-baseline in packages/config/tests/parity/defaults.test.ts
  - proves: F110-FR-006
  - fixture: FX-01
- [x] T025 [P] [US2] Test CT-110-105 in packages/config/tests/unit/launch-defaults.test.ts: default roles, verification `required`, absent proposer refuses and names candidates
  - proves: F110-FR-005
- [x] T026 [US2] Implement the aliases and the conflict error in packages/config/src/load/alias.ts and data/alias-table.json
  - covers: F110-FR-020
- [x] T027 [US2] Implement snapshot classes and the pins in packages/config/src/load/snapshot.ts
  - covers: F110-FR-022, F110-FR-023

## Phase 5: User Story 3 - Secrets (Priority: P1)

- [x] T028 [P] [US3] Tests CT-110-122 to CT-110-126 in packages/config/tests/unit/resolvers.test.ts: inline secrets, the four operations, `env:`, `file:` (workspace path, mode bits, links), `keychain:` with a fake tool
  - proves: F110-FR-027; F110-FR-028; F110-FR-029; F110-FR-030; F110-FR-031
- [x] T029 [P] [US3] Canary test CT-110-127 in packages/config/tests/conformance/canary.test.ts: canaries behind `env:`, `file:`, `keychain:` in every artifact, sink and argument list
  - proves: F110-FR-032
- [x] T030 [P] [US3] Tests CT-110-128, CT-110-129, CT-110-130 in `packages/testkit/src/conformance/EP-10/` (this feature's cases beside the frame and the minimal sample of feature 100; the sample in `packages/testkit/src/samples/EP-10/`): bound host, missing secret, open registry, the `test:` sample
  - proves: F110-FR-033; F110-FR-034; F110-FR-035
- [x] T031 [US3] Implement the three resolvers in packages/config/src/secrets/
  - covers: F110-FR-028, F110-FR-029, F110-FR-030, F110-FR-031, F110-FR-032
- [x] T032 [US3] Implement the registry, the bound host, the missing-secret handling and inline detection through the redactor
  - covers: F110-FR-027, F110-FR-033, F110-FR-034, F110-FR-035

## Phase 6: Polish

Tasks T033 to T039 (user story 4, the terms gate) moved to feature 147-terms-gate with the group G4; their numbers are not reused.

- [x] T040 Run the EP-10 conformance suite on the sample and the three Wave 1 resolvers; check that no core file names them
- [x] T041 Run the alias, profile and defaults parity tests on the macOS runner when it exists; every macOS result stays `unverified` until then
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T042 Run `python3 docs/ecosystem/check-traceability.py` and repair lines that name this feature
- [x] T043 Send the orchestrator the keys and rows that other features and annex X §X.7 need (spec "Assumptions")
- [x] T044 Pin the YAML parser of the loader to one version of the npm package `yaml` and record its licence in `research.md`; check that the parser is used in a mode that constructs no code (the decision D of feature 100 that names it for the configuration loader)
  - covers: F110-FR-003

## Dependencies

T001 and T002 first. T003 before all packages. T004 and T005 in parallel. Phase 2 before phases 3 to 5. Phases 3 to 5 are independent after phase 2; T031 needs T009. A test task precedes the task it tests and fails first.
