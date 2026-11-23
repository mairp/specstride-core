# Tasks: Adapter for pi (feature 134)

**Input**: Design documents from `specs/134-adapter-pi/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Requested for every feature. Conformance tests, classifier fixtures and characterization tests (`CT-134-<n>`) are required tasks. No parity test exists for this feature (feature 141 §O.7).

**Organization**: Phase 1 holds the four fixture captures, which come first. Then setup, then one phase per user story, then polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency)
- **[Story]**: US1 to US5 of `spec.md`
- A paid probe says so, is logged, and is never run by the specification agent.

Paths are those of `plan.md`: `packages/adapter-pi/src/`, `packages/adapter-pi/data/dialects/pi.json`, `tests/characterization/134/`.

## Phase 1: Fixture captures (first tasks; the specification is not frozen until they are logged)

**Purpose**: settle the four facts that block the freeze. Each is an explicitly authorized probe, logged in `tests/characterization/134/fixtures/capture-log.md`.

- [x] T001 Write the capture log template and the authorization record (who authorized, which capture, paid or not, pi version) in tests/characterization/134/fixtures/capture-log.md
  - proves: F134-FR-027
- [x] T002 CAP-1 (not paid): script a loopback endpoint that returns a provider error, run pi against it once, record the exit code and the stream in tests/characterization/134/fixtures/error-exit-code/
  - proves: F134-FR-025
  - fixture: none (capture)
- [x] T003 CAP-2 (PAID, logged, needs the C0 opt-in and an explicit authorization): one live call as proposer and one as critic; save both streams as tests/characterization/134/fixtures/proposer-pass.jsonl and critic-call.jsonl with the pi version and the date
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F134-FR-023; F134-FR-027
  - paid: yes; the only paid calls of the feature, one per role
- [x] T004 CAP-3: read from the critic stream of CAP-2 whether the initial record states the tool list and an identity; write the result into contracts/captures.json and the capture log
  - out-of-band (owner ruling of 2026-09-30): the part that needs the output of an out-of-band task is never run and never faked here. Do the hermetic part on Linux, and record the part that needs the output of an out-of-band task as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F134-FR-019
- [x] T005 CAP-4: in the proposer call of CAP-2 give the exact session id; read the session left under that id; record whether the option works with print mode and JSON output (no further paid call)
  - out-of-band (owner ruling of 2026-09-30): the part that needs the output of an out-of-band task is never run and never faked here. Do the hermetic part on Linux, and record the part that needs the output of an out-of-band task as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F134-FR-013; F134-FR-014
- [x] T006 Replace every value marked captured or unverified in contracts/descriptor.pi.json, dialect-row.pi.json and classifier-entries.pi.json by the value of the captures, with verified-on and the pin; leave the mark where no capture settled it
  - proves: F134-FR-003; F134-FR-027

**Checkpoint**: 4 captures on disk with logs, or each still marked `unverified` with the reason.

## Phase 2: Setup and foundation

- [x] T007 Create the directories of plan.md and the empty registration call in packages/adapter-pi/src/index.ts
- [x] T008 [P] Validate contracts/descriptor.pi.json against the descriptor schema of feature 100 and refuse unknown top-level keys, in a schema test in tests/characterization/134/conformance.test.ts
  - proves: F134-FR-001
- [x] T009 [P] Validate contracts/dialect-row.pi.json against the dialect-row schema in tests/characterization/134/reader-dialect.test.ts
  - proves: F134-FR-023
- [x] T010 [P] Add the pi stub of feature 141 §O.3 (port side) to the test setup and the fake executable that records argument list, standard input and environment
  - fixture: FX-01 stub verbs only, port side

## Phase 3: User Story 1 - pi as proposer with the consent to C0 (P1)

- [x] T011 [P] [US1] Conformance test CT-134-1: pi is a new registry entry, state tested, origin adapter; no core file names it
  - proves: F134-FR-001
- [x] T012 [P] [US1] Characterization tests CT-134-2 and CT-134-3: detection and version pin, doctor warning outside the range, warning on a change of version between passes
  - proves: F134-FR-002; F134-FR-003
- [x] T013 [P] [US1] Characterization test CT-134-4: the key reaches the fake by environment only; a missing credential fails before the first pass
  - proves: F134-FR-004
- [x] T014 [P] [US1] Characterization tests CT-134-8 and CT-134-9: no opt-in gives a refusal with the reason and the doctor line and no pass; opt-in gives protection=detect; parallel units off without allow_detect; an opt-in to C0 or `allow_detect` given in the environment, as a flag or in project configuration is not accepted (CQ-183)
  - proves: F134-FR-008; F134-FR-009
- [x] T015 [P] [US1] Characterization tests CT-134-11 and CT-134-12: the proposer invocation, prompt on standard input, working directory, environment allow-list, tool allow-list in the invocation record
  - proves: F134-FR-011; F134-FR-012
- [x] T016 [P] [US1] Characterization tests CT-134-13 and CT-134-14: continuation by the minted id, session directory per phase attempt removed at its end, the fresh-session cases, no session kept under the parity profile
  - proves: F134-FR-013; F134-FR-014
- [x] T017 [P] [US1] Characterization tests CT-134-15, CT-134-16 and CT-134-29: home and overlay rules, telemetry off, customisations and native memory off by default with a recorded opt-in
  - proves: F134-FR-015; F134-FR-016; F134-FR-029
- [x] T018 [US1] Implement the proposer part of descriptor.json and the hook that refuses a launch without the C0 opt-in (packages/adapter-pi/src/descriptor.json, hooks.ts)
- [x] T019 [US1] Implement the environment allow-list table by provider and the overlay declaration in descriptor.json
- [x] T040 [US1] Fill the registration call in packages/adapter-pi/src/index.ts: register descriptor.json and the hooks of hooks.ts as a new entry of the open registry through EP-02 (state tested, origin adapter); no core file and no other entry changes (F134-FR-001, made green by T011)

## Phase 4: User Story 2 - pi as a critic that can take no action (P1)

- [x] T020 [P] [US2] Characterization tests CT-134-17 and CT-134-18: project-local resources untrusted; the full critic flag set; no flag that allows a tool
  - proves: F134-FR-017; F134-FR-018
- [x] T021 [P] [US2] Characterization tests CT-134-19 and CT-134-20: proof accepted from the initial record; a listed tool gives critic_not_toolless and exit 3; unstated list gives the weaker proof only with the exact version pin, a passed preflight and the flag set, and critic_not_toolless when any of the three is missing; no critic call shares a session id with a pass
  - proves: F134-FR-019; F134-FR-020
  - fixture: recorded critic streams of Phase 1
- [x] T022 [P] [US2] Characterization tests CT-134-21 and CT-134-22: only the form tool-less; automatic pick only as a tested adapter with the provider's row; window is the smaller of the two; no default for an unknown model
  - proves: F134-FR-021; F134-FR-022
- [x] T039 [P] [US2] Characterization test CT-134-30: the critic-diversity warning is raised and recorded for pi as critic on the same model as the proposer and where the diversity test gives `unverified`, and does not block the run; a shared provider or model tier alone raises no warning; the provider and model of every call are recorded
  - proves: F134-FR-030
- [x] T023 [US2] Implement the critic part of descriptor.json and the proof function in hooks.ts as a pure function of the initial record and the call record

## Phase 5: User Story 3 - the subscription path is refused (P1)

- [x] T024 [P] [US3] Characterization tests CT-134-5, CT-134-6 and CT-134-7: the provider's row decides; unknown provider warns and is never a default; the OAuth path of a Claude subscription is refused for both audiences with the explanation and no process of pi starts; no login and no trust file written
  - proves: F134-FR-005; F134-FR-006; F134-FR-007
- [x] T025 [US3] Write terms-facts.json for R8v rows 37 to 40 with dates and pin and hand it to the terms file of feature 147; add the hook that refuses a subscription-login path

## Phase 6: User Story 4 - one reader, two harnesses (P2)

- [x] T026 [P] [US4] Conformance test CT-134-23 and CT-134-28 (reader part): the recorded streams of pi and of prime pass the same reader; only the dialect row differs; header version 2 ends in the unsupported-schema terminal; a stream with no terminal record gives missing_terminal
  - proves: F134-FR-023; F134-FR-028
  - fixture: recorded streams; the reader suite of feature 138
- [x] T027 [P] [US4] Characterization tests CT-134-25 and CT-134-26: the terminal record decides whatever the exit code; usage as increments; cost null when absent
  - proves: F134-FR-025; F134-FR-026
- [x] T028 [US4] Write packages/adapter-pi/data/dialects/pi.json from the captures and register the row with the reader of feature 138 and confirm the reader has no branch for pi

## Phase 7: User Story 5 - a provider limit makes a run wait (P2)

- [x] T029 [P] [US5] Classifier fixtures CT-134-24: an error message with a reset time and one without; the class, the confidence text, resetsAt; an unmatched text gives provider_other
  - proves: F134-FR-024
  - fixture: error-with-reset.json, error-without-reset.json
- [x] T030 [US5] Implement classifier.ts as a pure table with the duration parser; no I/O, no clock

## Phase 8: Doctor, conformance and polish

- [x] T031 [P] Characterization test CT-134-10: five doctor checks read and write nothing, make no paid call, keep to the time limit
  - proves: F134-FR-010
- [x] T032 Implement doctor.ts with the five checks and register them through EP-14
- [x] T033 [P] Conformance test CT-134-28 (port part): the adapter suite of feature 109 with the fake executable; the check that no test calls a paid or external API
  - proves: F134-FR-028
- [x] T034 [P] Success criteria tests CT-134-101 to CT-134-107: one reader two harnesses; Tier 3 refused; no shared session; facts dated; no launch without consent; conformance without spend; captures on disk
  - proves: F134-SC-001; F134-SC-002; F134-SC-003; F134-SC-004; F134-SC-005; F134-SC-006; F134-SC-007
- [x] T035 [P] Test CT-134-27: the four captures are on disk with logs or marked unverified with the reason
  - proves: F134-FR-027
- [x] T036 [P] Scan every file of the feature for names, paths and models of the owner's machines and for a list of harnesses; fix any hit
- [x] T037 [P] Mark every macOS statement in the descriptor, the docs and the doctor text as unverified; list the checks that a macOS runner must pass before release
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T038 Run quickstart.md end to end on the fake executable and record the result

## Dependencies

- Phase 1 first. T003 is paid and needs an explicit authorization; T004 and T005 read its output.
- Phase 2 before Phases 3 to 7. Phases 3 to 7 are independent of each other after Phase 2, apart from Phase 4 and Phase 6 needing the recorded streams of T003.
- Phase 8 last.
- Outside this feature: the seam (109), the reader (138), the classifier (127), the terms file (147) and the doctor (112) must exist when Phases 3 to 8 integrate; each is reached through its contract of feature 100.
