# Tasks: Claude harness adapter

**Input**: Design documents from `specs/125-adapter-claude/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. Parity tests, characterization tests and the conformance suite are tasks, not options (STAGE-B-RULES section 3). No test calls a paid API. A task marked **paid** makes a live call, must be logged (date, version of the CLI, cost, what it confirmed) and is not run by the specification.

## Format: `[ID] [P?] [Story] Description`

Paths are those of `plan.md`: `packages/adapter-claude/`. Stories: US1 proposer pass, US2 critic, US3 isolation, US4 quota and usage, US5 SDK transport, US6 doctor and version.

## Phase 1: Captures, extraction and setup

Each capture is **paid**, logged, and never run by the specification. A capture blocks only the freeze of the status of its requirement: until it is done the requirement stays `unverified`. No test task and no implementation task waits for a capture; a test that would use a captured fixture is a skip with its reason until the fixture exists.

- [ ] T001 [P] Fixture capture A (**paid**, logged): whether the sandbox for shell commands confines the harness's own file tools to a write root other than the workspace; record the result in packages/adapter-claude/test/fixtures/capture-a-write-root.md
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F125-FR-019
- [ ] T002 [P] Fixture capture B (**paid**, logged): whether several headless processes may run under one configuration home and one login with separate session stores; decides `concurrentSessions`; packages/adapter-claude/test/fixtures/capture-b-concurrent-sessions.md
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F125-FR-019
- [ ] T003 [P] Fixture capture C (**paid**, logged): a real limit event on the CLI stream and the retry, overload and credit errors, with their reset values and units; the recorded stream goes to packages/adapter-claude/test/fixtures/limit-event.ndjson
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F125-FR-031
- [ ] T004 [P] Fixture capture D and E (**paid**, logged): what the initial record lists about plugins, hooks, servers and capabilities under the customisation-off mode; where session state is kept at auth tier 1, whether it can be kept outside the real configuration home, whether a pass that persists nothing leaves no session file there, and which files the harness writes in the home by itself; the initial record goes to packages/adapter-claude/test/fixtures/capture-d-initial-record.ndjson and the findings and the file list of capture E to packages/adapter-claude/test/fixtures/capture-e-home-writes.md
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F125-FR-016; F125-FR-014; F125-FR-015
- [ ] T005 Confirm with feature 141 that the scenarios `harness-claude` of FX-01, `reject-approve` of FX-02, the five scenarios of FX-05, the scenarios `http-error`, `http-hang`, `cli-nonzero-exit`, `cli-empty-output` of FX-06 and the scenarios `claude-<name>` of FX-26 exist for the inputs of this feature; list any that is missing and report it
  - proves: C-052; C-056; C-058; C-061; C-066
  - fixture: FX-01, FX-02, FX-05, FX-06, FX-26
- [ ] T006 Create the package `packages/adapter-claude/` with strict TypeScript, the test folders of plan.md, the SDK under optional peer dependencies only, and no install script
- [ ] T007 Extract `harness.ts` and `tap.ts` of Lisa at `363e6a3` as source into packages/adapter-claude/src/sdk/, then bring them to the seam of F125-FR-041 (accept-edits mode, session directive, no evidence polling, no retry of its own) before any characterization test is written
  - proves: F125-FR-041
- [ ] T008 [P] Write the characterization test CT-125-30 of the kept usage accounting and the failure kinds (structured codes first, text second, prose stays success, unknown figures null) in packages/adapter-claude/test/characterization/lisa-usage-failures.test.ts
  - proves: F125-FR-039
- [ ] T009 [P] Write the characterization test CT-125-31 of the tap mapping (initial, assistant text and tool blocks with the 200-character target, final message, ignored kinds, a failing tap never breaks the loop, raw fallback) in packages/adapter-claude/test/characterization/lisa-tap.test.ts
  - proves: F125-FR-040
- [ ] T010 [P] Write the characterization test CT-125-32 of the four behaviours brought to the seam and the two kept options (idle cutoff off unless set; sub-agent tool refused on request) in packages/adapter-claude/test/characterization/lisa-seam.test.ts
  - proves: F125-FR-041

## Phase 2: Foundational

- [ ] T011 Write the descriptor data (`descriptor.json`), the model data (`models.json`: ladder, context windows, default critic model) and validate them against the descriptor schema of feature 100 at load, in packages/adapter-claude/data/ and src/index.ts
- [ ] T012 Implement detection: executable resolution to an absolute path, refusal of a path inside the workspace or in a world-writable directory, version read, home presence, in packages/adapter-claude/src/detect.ts
- [ ] T013 Implement the argument table as data with builders for the profiles `parity` and default and the roles, in packages/adapter-claude/data/argument-table.json and src/invoke-proposer.ts
- [ ] T014 Implement minted session ids, the per-run set of proposer session ids, the rule that no session state is persisted at auth tier 1, and the end of session state with the throwaway home at auth tier 2, in packages/adapter-claude/src/session.ts
- [ ] T015 Implement the environment allow-list and the process group of every call in packages/adapter-claude/src/invoke-proposer.ts

**Checkpoint**: descriptor, detection, argument table, sessions and environment exist.

## Phase 3: User Story 1 - A proposer pass on the installed CLI (Priority: P1) MVP

**Goal**: The proposer runs on Claude with the as-is list under `parity` and the contained list by default.

**Independent Test**: FX-01 `harness-claude` and FX-26 `claude-<name>` equal or waived.

### Tests for User Story 1

- [ ] T016 [P] [US1] Parity test PT-125-C-052-stdin-file in packages/adapter-claude/test/parity/stdin-file.test.ts
  - proves: C-052; B-0522
  - fixture: FX-01
  - surfaces: transcript, exit, state
- [ ] T017 [P] [US1] Parity test PT-125-C-056-prompt-file in packages/adapter-claude/test/parity/prompt-file.test.ts
  - proves: C-056; B-0625
  - fixture: FX-01, FX-06
  - surfaces: transcript, state
- [ ] T018 [P] [US1] Parity test PT-125-C-058-argument-table in packages/adapter-claude/test/parity/argument-table.test.ts, with the default list mapped through the table
  - proves: C-058; B-0689; B-0740; B-0742
  - fixture: FX-01, FX-26
  - surfaces: transcript
- [ ] T019 [P] [US1] Parity test PT-125-C-052-skills-switch and PT-125-C-058-skills-flag in packages/adapter-claude/test/parity/skills-switch.test.ts
  - proves: C-052; C-058; B-0534; B-0741
  - fixture: FX-01
  - surfaces: transcript
- [ ] T020 [P] [US1] Parity test PT-125-C-058-tap-label and PT-125-C-058-no-metadata in packages/adapter-claude/test/parity/tap-label.test.ts
  - proves: C-058; B-0744; B-0745
  - fixture: FX-01, FX-26
  - surfaces: events, state, stdout
- [ ] T021 [P] [US1] Parity test PT-125-C-058-permission-mode in packages/adapter-claude/test/parity/permission-mode.test.ts
  - proves: C-058; B-0689
  - fixture: FX-01
  - surfaces: transcript
- [ ] T022 [P] [US1] Characterization test CT-125-4: the mode is stated on every call; an empty session id is refused; the prompt is never a positional argument; the minimal mode is never used at auth tier 1 in packages/adapter-claude/test/characterization/mode-stated.test.ts
  - proves: F125-FR-004
- [ ] T023 [P] [US1] Characterization test CT-125-7: the session directive, the fresh cases and the parity assertion that no invocation carried a continuation argument in packages/adapter-claude/test/characterization/session-directive.test.ts
  - proves: F125-FR-013
  - fixture: FX-01, FX-02
- [ ] T024 [P] [US1] Characterization test CT-125-8: continuation needs persistence, the per-pass instructions stay out of the system prompt, at auth tier 1 continuation is off and no session state is persisted, at auth tier 2 session state ends with the throwaway home of the attempt, the delta of a continued session in packages/adapter-claude/test/characterization/continuation.test.ts
  - proves: F125-FR-014
- [ ] T025 [P] [US1] Characterization test CT-125-15: the three stops, the process group, the polite-stop signal, exit 143 is not a provider failure in packages/adapter-claude/test/characterization/stop.test.ts
  - proves: F125-FR-021
- [ ] T026 [P] [US1] Characterization test CT-125-16: the prompt is handed on unchanged and nothing volatile precedes it; the git-instructions switch stays unset in packages/adapter-claude/test/characterization/prompt-stability.test.ts
  - proves: F125-FR-022
- [ ] T027 [P] [US1] Characterization test CT-125-14: the environment is an allow-list; no other provider key; credentials of the critic never in the proposer's environment; the scrub option in packages/adapter-claude/test/characterization/environment.test.ts
  - proves: F125-FR-020

### Implementation for User Story 1

- [ ] T028 [US1] Implement the prompt file and its removal on every ending, and the variable `SPECSTRIDE_STDIN_FILE` under `parity`, in packages/adapter-claude/src/invoke-proposer.ts
- [ ] T029 [US1] Implement the parity argument list and the skills switch in packages/adapter-claude/src/invoke-proposer.ts
- [ ] T030 [US1] Implement the default argument list and the permission mode; the bypass mode is used only when the consumer set it in `sandbox.permissionMode` in user configuration, the harness adapter only checks the precondition (a sandbox detected by the doctor, a user other than root) and refuses the launch where it fails, and never selects the mode by itself (F125-FR-012, CQ-183), in packages/adapter-claude/src/invoke-proposer.ts
- [ ] T031 [US1] Implement the label given to the reader and the invocation directory without a metadata record in packages/adapter-claude/src/invoke-proposer.ts
- [ ] T032 [US1] Implement the session directive, continuation by id and the fresh cases in packages/adapter-claude/src/session.ts
- [ ] T033 [US1] Implement the three stops and the polite-stop signal in packages/adapter-claude/src/stop.ts
- [ ] T034 [US1] Implement the model and effort arguments of the model-tier ladder and the refusal to pass a fallback model in packages/adapter-claude/src/invoke-proposer.ts

## Phase 4: User Story 2 - The tool-less critic (Priority: P1)

**Goal**: The critic has no tools, proves it, and never shares the proposer's session.

**Independent Test**: FX-05 and FX-06 equal or waived; the proof refuses every bad initial record.

### Tests for User Story 2

- [ ] T035 [P] [US2] Parity test PT-125-C-066-messages-call in packages/adapter-claude/test/parity/messages-call.test.ts
  - proves: C-066; B-0980
  - fixture: FX-01, FX-06
  - surfaces: transcript, stdout, exit
- [ ] T036 [P] [US2] Parity test PT-125-C-061-key-base-model in packages/adapter-claude/test/parity/key-base-model.test.ts
  - proves: C-061; B-0811; B-0812; B-0813; B-0814; B-0830
  - fixture: FX-01, FX-05, FX-06
  - surfaces: transcript, exit, stdout
- [ ] T037 [P] [US2] Parity test PT-125-C-066-context-window in packages/adapter-claude/test/parity/context-window.test.ts
  - proves: C-066; B-0911
  - fixture: FX-01, FX-06
  - surfaces: stdout, state
- [ ] T038 [P] [US2] Characterization test CT-125-17: the auth tier 1 critic command has no tools, no persistence, one turn, a permission mode that denies, no allow-all flag, no CLI at auth tier 2 in packages/adapter-claude/test/characterization/critic-cli.test.ts
  - proves: F125-FR-023
  - fixture: FX-06
- [ ] T039 [P] [US2] Characterization test CT-125-18: the proof refuses a recorded initial record with a tool, a server, a foreign session id, a proposer session id, a plugin, and no record; the result is in the call record in packages/adapter-claude/test/characterization/critic-proof.test.ts
  - proves: F125-FR-024
  - fixture: FX-05
- [ ] T040 [P] [US2] Characterization test CT-125-19: the critic invocation type has no resume, continue or fork parameter; empty temporary directory; no persistence in packages/adapter-claude/test/characterization/critic-session.test.ts
  - proves: F125-FR-025
- [ ] T041 [P] [US2] Characterization test CT-125-20: the critic runs on the model the role plan names; the same model raises the critic-diversity warning (F100-FR-024); an unknown model is reported as null; a higher effort on the same model raises the warning; never launch-blocking in packages/adapter-claude/test/characterization/critic-tier.test.ts
  - proves: F125-FR-026
- [ ] T042 [P] [US2] Characterization test CT-125-21: a failed critic call gives no verdict and a typed failure; a refused terms gate refuses the call in packages/adapter-claude/test/characterization/critic-failure.test.ts
  - proves: F125-FR-030
  - fixture: FX-06

### Implementation for User Story 2

- [ ] T043 [US2] Implement the auth tier 1 critic call in packages/adapter-claude/src/critic-cli.ts
- [ ] T044 [US2] Implement the proof from the initial record and the per-run set of proposer session ids in packages/adapter-claude/src/critic-cli.ts
- [ ] T045 [US2] Implement the direct call, the resolution of key, base address and model through aliases, and the refusal of a plain address and of redirects in packages/adapter-claude/src/critic-direct.ts
- [ ] T046 [US2] Implement the context-window table with its fallback and the consumer's override, and the budget caps, in packages/adapter-claude/src/critic-direct.ts and data/models.json

## Phase 5: User Story 3 - The configuration home is never written (Priority: P1)

**Goal**: Customisations off, real home at auth tier 1, throwaway home at auth tier 2.

**Independent Test**: No file written by the harness adapter in the home; recorded initial records with a plugin give a finding.

### Tests for User Story 3

- [ ] T047 [P] [US3] Characterization test CT-125-9: at auth tier 1 the harness adapter writes nothing and removes nothing in the home; the files the harness keeps by itself are left out of the comparison by the list of capture E, and without that list the comparison of those files is a skip with its reason, in packages/adapter-claude/test/characterization/home-untouched.test.ts
  - proves: F125-FR-015
- [ ] T048 [P] [US3] Characterization test CT-125-10: the initial-record assertions (a proposer warning, a critic refusal), managed settings, no host hook of Specstride's own plugin in a child in packages/adapter-claude/test/characterization/init-assertions.test.ts
  - proves: F125-FR-016
- [ ] T049 [P] [US3] Characterization test CT-125-11: auth tier 2 uses a key by reference and a throwaway home, removed even after a kill; the minimal mode only at auth tier 2; no subscription token in the environment in packages/adapter-claude/test/characterization/tier2-subprocess.test.ts
  - proves: F125-FR-017
  - fixture: FX-39
- [ ] T050 [P] [US3] Characterization test CT-125-12: native memory off for the critic, off by default for the proposer with an opt-in, nothing passed under `parity` in packages/adapter-claude/test/characterization/memory.test.ts
  - proves: F125-FR-018
- [ ] T051 [P] [US3] Characterization test CT-125-13: the containment ceiling (C2 where the sandbox is offered, else C1), `concurrentSessions` null, parallel units off with the reason in packages/adapter-claude/test/characterization/containment.test.ts
  - proves: F125-FR-019

### Implementation for User Story 3

- [ ] T052 [US3] Implement the customisation-off mode, the memory switch and the assertions on the initial record in packages/adapter-claude/src/isolation.ts
- [ ] T053 [US3] Implement the throwaway home from an overlay of `specstride-overlay/v1`, its scope and its removal in packages/adapter-claude/src/isolation.ts
- [ ] T054 [US3] Implement the containment ceiling detection and the `concurrentSessions` capability in packages/adapter-claude/src/detect.ts

## Phase 6: User Story 4 - Quota signals, usage and the ladder (Priority: P2)

**Goal**: A limit is a pause; usage is honest; the ladder is data.

**Independent Test**: Every row of `contracts/classifier-table.md` has a recorded stream and its class.

### Tests for User Story 4

- [ ] T055 [P] [US4] Characterization test CT-125-22: every row of the classifier table, with `retryable`, on recorded streams written from the documented shapes; overload is never quota; a text reset time is null. The case on the captured limit event of T003 is a skip with the reason "capture C absent" until the fixture exists, and the test does not wait for T003, in packages/adapter-claude/test/characterization/classifier.test.ts
  - proves: F125-FR-031
- [ ] T056 [P] [US4] Characterization test CT-125-23: usage increments, the delta of a continued session, a killed pass, notional cost, null for an unknown figure in packages/adapter-claude/test/characterization/usage.test.ts
  - proves: F125-FR-032
- [ ] T057 [P] [US4] Characterization test CT-125-24: the ladder is data pinned at launch; the model and effort are stated; no fallback model; a rung the plan lacks is unknown in packages/adapter-claude/test/characterization/ladder.test.ts
  - proves: F125-FR-033

### Implementation for User Story 4

- [ ] T058 [US4] Implement the pure classifier from `data/classifier.json` and the codes it cannot state in packages/adapter-claude/src/classify.ts
- [ ] T059 [US4] Implement usage increments and the notional label in packages/adapter-claude/src/usage.ts
- [ ] T060 [US4] Implement the ladder read and the pin in packages/adapter-claude/src/index.ts

## Phase 7: User Story 5 - The SDK transport (Priority: P2)

**Goal**: Optional, auth tier 2 only, API keys only, never bundled, equal to the subprocess.

**Independent Test**: The own tests below and the conformance suite on both transports.

### Tests for User Story 5

- [ ] T061 [P] [US5] Characterization test CT-125-25: the transport is chosen by the consumer (user configuration, the environment or a flag), never automatically, not under `parity`; the SDK at auth tier 1 is refused; a project cannot choose in packages/adapter-claude/test/characterization/transport-choice.test.ts
  - proves: F125-FR-034
- [ ] T062 [P] [US5] Own test CT-125-26: with a subscription credential in the environment the SDK transport does not use it; no call carries a credential other than the key of its secret reference in packages/adapter-claude/test/characterization/sdk-auth.test.ts
  - proves: F125-FR-035
- [ ] T063 [P] [US5] Own test CT-125-27: with the SDK absent the transport is unavailable, the doctor names it, and a run on the subprocess is unchanged; and the CI check that the packed package and everything it installs hold no file of the SDK in packages/adapter-claude/test/characterization/sdk-absent.test.ts and the build workflow
  - proves: F125-FR-036
- [ ] T064 [P] [US5] Characterization test CT-125-28: the terms row of the SDK transport, the version range and the warning outside it, only the call that starts a session with options in packages/adapter-claude/test/characterization/sdk-terms-range.test.ts
  - proves: F125-FR-037
- [ ] T065 [US5] Conformance suite of EP-02 (feature 100, annex C §C.1) on both transports, with recorded streams replayed and the classifier fixtures (the case on the captured limit event is a skip until capture C exists), and the critic proof on the SDK transport (CT-125-29) in packages/adapter-claude/test/conformance/both-transports.test.ts
  - proves: F125-FR-038
  - fixture: FX-26

### Implementation for User Story 5

- [ ] T066 [US5] Implement the loader of the optional dependency (dynamic import from the consumer's installation, structural type, injected fake for tests) in packages/adapter-claude/src/sdk/load.ts
- [ ] T067 [US5] Wire the SDK transport into the descriptor, the availability states and the terms row in packages/adapter-claude/src/index.ts and data/terms-rows.json
- [ ] T068 [US5] Add the SDK critic call (empty tool list, no settings source, no persistence, minted session, one turn, budget, empty directory) in packages/adapter-claude/src/sdk/harness.ts

## Phase 8: User Story 6 - Doctor, version and terms (Priority: P2)

### Tests for User Story 6

- [ ] T069 [P] [US6] Characterization test CT-125-1: executable resolution, refusal of a workspace path, a changed path warns in packages/adapter-claude/test/characterization/detect.test.ts
  - proves: F125-FR-001
- [ ] T070 [P] [US6] Characterization test CT-125-2: the descriptor validates and every capability names its provenance or is null in packages/adapter-claude/test/characterization/descriptor.test.ts
  - proves: F125-FR-002
- [ ] T071 [P] [US6] Characterization test CT-125-3: the range, the recorded version, the warning outside it, the capability list before the version comparison, the hidden flags gated by the floor in packages/adapter-claude/test/characterization/version.test.ts
  - proves: F125-FR-003
- [ ] T072 [P] [US6] Characterization test CT-125-5: the terms rows of Claude for each tier and audience, the default of the audience `distributed`, and the row of the SDK transport in packages/adapter-claude/test/characterization/terms-rows.test.ts
  - proves: F125-FR-005
- [ ] T073 [P] [US6] Characterization test CT-125-6: every check of the harness adapter with a stub for each state (absent, out of range, no login, managed settings, no sandbox, SDK absent) and no paid call, no secret read in packages/adapter-claude/test/characterization/doctor-checks.test.ts
  - proves: F125-FR-006

### Implementation for User Story 6

- [ ] T074 [US6] Implement the doctor checks and register them as entries of the doctor check registry (feature 100, annex G §G.7) in packages/adapter-claude/src/checks.ts
- [ ] T075 [US6] Implement the terms rows data and hand them to the terms file of feature 147 in packages/adapter-claude/data/terms-rows.json

## Phase 9: Release probe and polish

- [ ] T076 **Paid**, logged: one live call per role (proposer and critic) with the flag combination of `contracts/argument-table.md`, to confirm that the flags combine without conflict, that the session id is echoed with nothing persisted, that the budget cap holds under a subscription and what the default cap of the critic is (CQ-146); no other paid call; the log goes to packages/adapter-claude/test/fixtures/probe-log.md
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F125-FR-023; F125-FR-027
- [ ] T077 When a capture (T001 to T004) or the probe (T076) has been logged, fill the flag combinations, the default cap and the pins of `data/` from it and re-run the doctor checks; this task blocks no other task
- [ ] T078 Run `python3 docs/ecosystem/check-traceability.py` and fix lines that name feature 125
- [ ] T079 Report to the orchestrator: the readings of CQ-143 to CQ-148, CQ-183 and CQ-191, and the alias and key names this feature proposes (rows 119 to 122 of annex X §X.7 exist)
- [ ] T080 [P] [US1] Characterization test CT-125-33: under the default profile the bypass mode is used only when `sandbox.permissionMode` names it in user configuration; the same value from the environment, a flag or project configuration is not taken; with the value set and no sandbox detected, or with the user root, the launch is refused with the reason; the harness adapter never selects the mode by itself, in packages/adapter-claude/test/characterization/bypass-precondition.test.ts
  - proves: F125-FR-012
- [ ] T081 [P] [US2] Characterization test CT-125-34: outside the `parity` profile an unlisted model without a declared window does not qualify and the critic-class call is refused with the model and the key named; a declared window wins; under `parity` the fallback is 200,000, in packages/adapter-claude/test/characterization/critic-window.test.ts
  - proves: F125-FR-027

## Dependencies

The captures T001 to T004 and the probe T076 are paid: each blocks only the freeze of the status of its requirement and the task T077, and no test task and no implementation task waits for one. A test that would use a captured fixture is a skip with its reason until the fixture exists (Principle XVII). T005 and T006 first; T007 before T008 to T010; Phase 2 before all stories; US1 needs T013 to T015; US2 needs T012, T014 and T011; US3 needs T014; US4 needs T011; US5 needs T007, T066 and the conformance suite of feature 109; US6 needs T011 and T012; T080 with US1 and T081 with US2; T076 after every story; T078 last.
