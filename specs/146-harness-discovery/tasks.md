---
description: "Task list of feature 146-harness-discovery"
---

# Tasks: Harness discovery (feature 146)

**Input**: Design documents from `specs/146-harness-discovery/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Characterization tests are required tasks (`STAGE-B-RULES.md` section 3). This feature has no parity test, because discovery has no reference (feature 141, §O.7). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US3)
- Every task names its file. Paths are relative to the repository root
- A test task carries `proves:` with what it proves
- An implementation task carries `covers:` with the requirements it serves

## Phase 1: Setup

- [ ] T001 Build the canary fixture home in packages/harness/tests/canary/fixtures/home/: planted credential files in known configuration homes, a fake CLI named by a bundled harness descriptor, one executable that no harness descriptor names, and a fake endpoint whose model list answers with a redirect to a second loopback port. This is the inherited fixture work and comes first
  - covers: F146-SC-002
- [ ] T002 [P] Add to the descriptor-only fixture of the harness port in packages/harness/tests/conformance/fixtures/descriptor-only/ the expected list of candidates: the fake CLI and the fake endpoint, both unverified, every value with its provenance
  - covers: F146-SC-001
- [ ] T003 [P] Create the directory packages/harness/src/discovery/ and copy specs/146-harness-discovery/contracts/probe-limits.json to packages/harness/data/probe-limits.json; create the directory packages/harness/data/descriptors/ (files `<id>.yaml`, shipped at `<package>/harnesses/`, read as `package:harness:<id>`) that the source `binary` reads; write the schema packages/harness/data/verified-facts.schema.json (date, subject, check, result) of the records that T027, T028 and T029 add
  - covers: F146-FR-014
- [ ] T004 [P] Add the three closed sets of specs/146-harness-discovery/contracts/closed-sets.json to packages/contracts/src/closed-sets/harness-discovery.ts, each with its branch for an unknown value
  - covers: F146-FR-002; F146-FR-013; F146-FR-017

## Phase 2: Foundational (blocks every user story)

- [ ] T005 [P] Characterization test CT-146-4 in packages/harness/tests/discovery/guarded-reader.test.ts: the reader offers presence and existence only, refuses every path of the deny-list, and asks the secret resolver for `exists` only
  - proves: F146-FR-004
- [ ] T006 Implement the guarded reader in packages/harness/src/discovery/guarded-reader.ts
  - covers: F146-FR-004
- [ ] T007 [P] Characterization test CT-146-14 in packages/harness/tests/discovery/probe-runner.test.ts: standard input closed, time limit, output cap, no terminal, parallel runs; a failed probe yields null and a finding and never makes discovery itself fail, so that only the reader of a harness that plays a role of the run can fail the launch; with one probe that never ends among twenty, the run ends within the limit plus one second
  - proves: F146-FR-014; F146-SC-003
- [ ] T008 Implement the bounded probe runner in packages/harness/src/discovery/probes/runner.ts and the type of a candidate in packages/harness/src/discovery/types.ts
  - covers: F146-FR-014
- [ ] T009 [P] Static test in packages/harness/tests/static/no-harness-names-discovery.test.ts: no file under packages/harness/src/discovery/ tests a harness name in control flow or holds a list of harnesses
  - proves: F146-FR-002; constitution Principle VII

**Checkpoint**: the ports to the machine exist and are traced; quickstart scenario 3 passes.

## Phase 3: User Story 1 - Discovery finds a harness and touches nothing (P1)

**Goal**: the seven sources, the two passes, the switches and the safety rules.

**Independent test**: quickstart scenarios 1, 2 and 6.

### Tests

- [ ] T010 [P] [US1] Characterization tests CT-146-1 and CT-146-2 in packages/harness/tests/discovery/discover.test.ts: two passes; no model call and no paid call; every candidate records its source, a member of the closed set; no candidate is marked a default or picked for a role, and `termsRef` is null where the terms are unknown (ruling P14, every audience)
  - proves: F146-FR-001; F146-FR-002
- [ ] T011 [P] [US1] Characterization test CT-146-3 in packages/harness/tests/discovery/sources-binary.test.ts: only the argument lists of `detect` are run; an executable that no harness descriptor names is never executed
  - proves: F146-FR-003
- [ ] T012 [P] [US1] Characterization test CT-146-5 in packages/harness/tests/discovery/sources-host.test.ts: names and types only; an entry of the source `host` is marked informational
  - proves: F146-FR-005
- [ ] T013 [P] [US1] Characterization tests CT-146-6 and CT-146-7 in packages/harness/tests/discovery/sources-endpoint-gateway.test.ts: candidate by presence of the variable; the user part of an address is removed; a gateway is asked for its model list only; one candidate per model, of an endpoint kind
  - proves: F146-FR-006; F146-FR-007
- [ ] T014 [P] [US1] Canary test CT-146-8 in packages/harness/tests/canary/redirect.test.ts: GET only; a redirect is refused and the second host sees no request; the credential appears in no record, log or event
  - proves: F146-FR-008; F146-SC-002
- [ ] T015 [P] [US1] Canary test CT-146-9 in packages/harness/tests/canary/no-read-no-write.test.ts: tracing over discovery on the fixture home of T001 shows no open of a planted file and no write; the operating-system trace is a skip with its reason where the tool is absent
  - proves: F146-FR-009; F146-FR-004; F146-SC-002
- [ ] T016 [P] [US1] Characterization tests CT-146-10 and CT-146-11 in packages/harness/tests/discovery/declared-precedence.test.ts: a harness entry in project configuration is ignored with one line of at most 200 bytes and a doctor warning; precedence of four origins for one harness id
  - proves: F146-FR-010; F146-FR-011
- [ ] T017 [P] [US1] Characterization test CT-146-12 in packages/harness/tests/discovery/switches.test.ts: with discovery off no probe runs and no request is made; with the metadata pass off no request is made; under the `parity` profile both are off and nothing is printed
  - proves: F146-FR-012
- [ ] T018 [US1] Conformance test in packages/harness/tests/conformance/discovered-unverified.test.ts on the fixture of T002: the fake harness is in the list as unverified, and no value lacks a provenance unless it is null
  - proves: F146-SC-001

### Implementation

- [ ] T019 [P] [US1] Implement the seven source readers in packages/harness/src/discovery/sources/ (harness-adapter.ts, binary.ts, config-home.ts, host.ts, endpoint.ts, gateway.ts, declared.ts)
  - covers: F146-FR-002; F146-FR-003; F146-FR-005; F146-FR-006; F146-FR-007; F146-FR-010
- [ ] T020 [P] [US1] Implement the metadata client in packages/harness/src/discovery/metadata-client.ts
  - covers: F146-FR-008
- [ ] T021 [US1] Implement the two passes, the switches and the precedence in packages/harness/src/discovery/discover.ts and packages/harness/src/discovery/precedence.ts
  - covers: F146-FR-001; F146-FR-009; F146-FR-011; F146-FR-012

**Checkpoint**: discovery yields candidates and is proven to touch nothing.

## Phase 4: User Story 2 - Every value says where it came from (P2)

**Independent test**: quickstart scenario 4.

- [ ] T022 [P] [US2] Characterization tests CT-146-13, CT-146-15 and CT-146-16 in packages/harness/tests/discovery/ladder-window.test.ts: provenance per ladder step; nothing guessed; a flag missing from the help text makes the role unsupported; precedence of the window, the smaller of two, the margin on a catalogue value, no default window
  - proves: F146-FR-013; F146-FR-015; F146-FR-016
- [ ] T023 [US2] Implement the ladder steps in packages/harness/src/discovery/probes/, the catalogue reader in packages/harness/src/discovery/catalogue.ts and the window rule in packages/harness/src/discovery/window.ts; add the dated snapshot packages/harness/data/catalogue/catalogue.snapshot.json (shipped under the root `package` and read only as `package:catalogue`) and its schema packages/harness/data/catalogue.schema.json, against which the snapshot and a file at `user:catalogue` are validated on read
  - covers: F146-FR-013; F146-FR-015; F146-FR-016

## Phase 5: User Story 3 - A consumer promotes a harness they verified (P3)

**Independent test**: quickstart scenario 5.

- [ ] T024 [P] [US3] Characterization tests CT-146-17, CT-146-18 and CT-146-19 in packages/harness/tests/discovery/state.test.ts: the four states and the rule for an unknown value; `locally-verified` only with a passed result of the same version and hash; nothing but a shipped tested harness adapter gives `tested`
  - proves: F146-FR-017; F146-FR-018; F146-FR-019
- [ ] T025 [US3] Implement the state resolver in packages/harness/src/discovery/state.ts
  - covers: F146-FR-017; F146-FR-018; F146-FR-019

## Phase 6: Polish and cross-cutting

- [ ] T026 [P] Profile test in packages/harness/tests/static/parity-rows-discovery.test.ts: every switch of this feature has a row in the `parity` profile with the value of specs/146-harness-discovery/contracts/parity-rows.json
  - proves: F146-FR-012; F146-FR-016
- [ ] T027 [P] Live probe, logged, run by a person and not by the build: one GET of the model list of a provider the consumer uses, to learn whether it is unbilled and takes the credential as declared. Not paid; uses a real credential. Record date, provider and result in packages/harness/data/verified-facts.json
  - out-of-band (owner ruling of 2026-09-30): the part a person runs is never run and never faked here. Do the hermetic part on Linux, and record the part a person runs as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F146-FR-008
- [ ] T028 [P] Live probe, logged, run by a person and not by the build: one GET of the model list of a gateway, to learn whether it lists models of other providers. Not paid. Record in packages/harness/data/verified-facts.json
  - out-of-band (owner ruling of 2026-09-30): the part a person runs is never run and never faked here. Do the hermetic part on Linux, and record the part a person runs as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F146-FR-007
- [ ] T029 Run every test of this feature on a macOS runner and record the result in packages/harness/data/verified-facts.json; until then every macOS statement stays `unverified`
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F146-FR-014; constitution Principle XVII; the edge case "macOS"
- [ ] T030 Run the scenarios of specs/146-harness-discovery/quickstart.md and record the result
  - covers: F146-SC-001; F146-SC-002; F146-SC-003

## Dependencies

| Phase | Needs |
|---|---|
| 2 Foundational | 1 |
| 3 US1 | 2 |
| 4 US2 | 2; T020 for the ladder step `metadata` |
| 5 US3 | 3 |
| 6 Polish | all |

Outside this feature: the harness port and the generic harness adapter (feature 100, annex C
§C.1, §C.2), the secret resolver (annex C §C.11) and the redactor (annex X §X.4) must exist
before Phase 3 can pass.

## Parallel example

```text
Phase 3 tests, all at once: T010 T011 T012 T013 T014 T015 T016 T017
Phase 3 implementation:     T019 T020 together, then T021
```

## Implementation strategy

1. Phases 1 to 3 give a list of candidates that is proven to touch nothing: the smallest useful increment.
2. Phase 4 adds the ladder and the window; phase 5 adds promotion. Each is testable alone.
