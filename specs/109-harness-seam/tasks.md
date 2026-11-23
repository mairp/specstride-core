---
description: "Task list of feature 109-harness-seam"
---

# Tasks: Harness seam (feature 109)

**Input**: Design documents from `specs/109-harness-seam/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. The order of construction of `plan.md` is kept inside the phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- Every task names its file
- A test task carries `proves:` with what it proves; a parity test also `fixture:`, `surfaces:` (feature 141, §O.6) and `requirement:` with the requirement of `spec.md` it serves. One task may hold several named tests of one file
- An implementation task carries `covers:` with the requirements it serves

## What this feature inherits, and what it does not run

This feature inherits no spike and no fixture capture of its own. Three facts it rests on are
captured or probed by the features of the harness adapters, and no task here runs them:

| Fact | Kind | Run by | Requirement that waits for it |
|---|---|---|---|
| The flag combination of a tool-less critic shows an empty tool list in the initial record | **Paid probe**, one live call per role, must be logged | 125 | F109-FR-038 |
| The read-only sandbox denies reads of the withheld paths | Fixture capture | 131 | F109-FR-039 |
| Several headless processes under one home and one login | Fixture capture, per harness adapter | 125, 130, 131, 134, 138 | F109-FR-004 |

T001 records them, so that the status fields of `spec.md` can be closed when the captures exist.

## Path Conventions

The package `@specstride/harness` in `packages/harness/` (directories of this feature only; see
`plan.md`). The conformance suite in `packages/testkit/src/conformance/EP-02/` and the sample
outside the core in `packages/testkit/src/samples/EP-02/`, both in the published test kit. Parity
tests in `tests/parity/109/`, characterization tests that need no package of their own in
`tests/characterization/109/`. The descriptor-only fixture in
`tests/conformance/harness/descriptor-only/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the directories, the data and the list of facts that wait for a capture

- [x] T001 Write the list of the three inherited facts, with the feature that captures each and the status field it closes, in packages/harness/test/unverified-facts.json; no probe is run by this feature
  - covers: F109-FR-004; F109-FR-038; F109-FR-039
- [x] T002 Create the directories of `plan.md` under packages/harness/src/ and packages/harness/test/, and the entry packages/harness/src/index.ts that exports nothing of features 124 and 126
  - covers: F109-FR-001
- [x] T003 [P] Copy the data files of specs/109-harness-seam/contracts/ into packages/harness/data/plan/ and add a build check that compares `closed-sets.json` with the closed sets of `@specstride/contracts`
  - covers: F109-FR-014
- [x] T004 [P] Create the fake binary (a Node-shebang file that records argument list, standard input, environment, working directory and process group, and plays a script) in packages/testkit/src/conformance/EP-02/fake-binary.mjs
  - covers: F109-FR-042
- [x] T005 [P] Create the fake endpoint (a server on loopback that answers in the two request shapes, can redirect, fail and hang) in packages/testkit/src/conformance/EP-02/fake-endpoint.ts
  - covers: F109-FR-042
- [x] T006 [P] Add the scenarios this feature needs to the families of feature 141, inside the scope of each family and with its stub verbs and surfaces only (feature 141, §O.1 rule 4): `FX-26/registry-queries`, `FX-26/root-sandbox-assertion`, `FX-06/cli-timeout`, `FX-39/invalid-scope-value`, `FX-39/scope-without-declaration`, `FX-39/stale-overlay-swept`, `FX-39/removal-fails`, `FX-39/critic-overlay`, `FX-39/executable-missing`; as data in tests/parity/109/scenarios/. The nine names are those that the catalogue of feature 141 registers for this feature. `FX-26/help-list-unavailable` is no scenario: feature 141 refused it, and T107 proves the line by a characterization test. `FX-26/root-sandbox-assertion` declares its prerequisite, the effective user id 0
  - covers: F109-FR-005; F109-FR-010; F109-FR-020; F109-FR-027; F109-FR-031; F109-FR-035; F109-FR-036

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the registry, the descriptor loader, the port and the environment, which every story needs

**⚠️ CRITICAL**: no story can start before this phase is done

- [x] T007 [P] Test CT-109-2 (levels P1 to P6 and C1 to C6; the missing capability is recorded) in packages/harness/test/registry/levels.test.ts
  - proves: F109-FR-002
- [x] T008 Implement capability levels and the check of registration in packages/harness/src/registry/levels.ts
  - covers: F109-FR-002
- [x] T009 [P] Characterization test CT-109-101 (characterization of Lisa's provider seam: a declared level without its operation fails registration) in packages/harness/test/registry/lisa-registration.test.ts
  - proves: F109-FR-002
- [x] T010 [P] Test CT-109-14 (descriptor validation: unknown top-level key, `x-` keys, version range, shell text, placeholder, duplicate id of one origin, open sets through registries, precedence of sources, optional `tiers` and `session`) in packages/harness/test/descriptor/validate.test.ts
  - proves: F109-FR-014
- [x] T011 Implement the descriptor loader with validation, `origin` and the precedence of sources in packages/harness/src/descriptor/loader.ts
  - covers: F109-FR-014
- [x] T012 [P] Test CT-109-15 (a harness declaration, an endpoint and a secret reference in project configuration are ignored with a launch message and a doctor warning) in packages/harness/test/descriptor/sources.test.ts
  - proves: F109-FR-015
- [x] T013 Implement the accepted sources of a descriptor in packages/harness/src/descriptor/sources.ts
  - covers: F109-FR-015
- [x] T014 [P] Test CT-109-13 (an unverified harness has no pin and runs at auth tier 1 or 2; auth tier 3 refuses the descriptor) in packages/harness/test/registry/unverified.test.ts
  - proves: F109-FR-013
- [x] T015 Implement the rules of an unverified harness in packages/harness/src/registry/unverified.ts
  - covers: F109-FR-013
- [x] T016 [P] Test CT-109-3 (the eight operations: time limit, degradation on a throw, on a time-out and on an unknown value; the terms gate is asked before every call) in packages/harness/test/port/operations.test.ts
  - proves: F109-FR-003
- [x] T017 Implement the core side of the port with time limits, degradation and the call of the terms gate in packages/harness/src/port/port.ts
  - covers: F109-FR-003
- [x] T018 [P] Test CT-109-4 (capabilities: provenance or null, `unverified`, the smaller window, `concurrentSessions` and spending limit null unless a tested harness adapter declares them, `fresh` without continuation) in packages/harness/test/port/capabilities.test.ts
  - proves: F109-FR-004
- [x] T019 Implement the capability map in packages/harness/src/port/capabilities.ts
  - covers: F109-FR-004
- [x] T020 [P] Test CT-109-28 (the environment of a call holds the allow-list and nothing else; the credentials of one role never reach the other; under `parity` the variables of the baseline) in packages/harness/test/environment/allow-list.test.ts
  - proves: F109-FR-028
- [x] T021 Implement the builder of the environment of a call in packages/harness/src/environment/allow-list.ts
  - covers: F109-FR-028
- [x] T022 [P] Test CT-109-12 (process group of its own; `stop` with its three modes; `betweenPasses` with its three outcomes and `continue` on failure) in packages/harness/test/port/stop.test.ts
  - proves: F109-FR-012
- [x] T023 Implement `stop` and `betweenPasses` on the process primitive of the kernel in packages/harness/src/port/stop.ts
  - covers: F109-FR-012

**Checkpoint**: a descriptor loads into the registry and the port can be called on the fake binary

---

## Phase 3: User Story 1 - The engine runs any harness through one port (Priority: P1) 🎯 MVP

**Goal**: every pass and every critic-class call goes through the port; the invocation equals the baseline's

**Independent Test**: FX-01 and FX-26 under the `parity` profile give equal transcripts

### Tests and implementation for User Story 1

- [x] T024 [P] [US1] Parity tests PT-109-028FR021-registry and PT-109-C-035-claude-entry (one registry; the entries of the stub executables with roles, qualifier form, stream format and overlay declaration of the baseline; every listing reads the registry) in tests/parity/109/registry.parity.test.ts
  - proves: 028 FR-021; C-035; B-0427
  - requirement: F109-FR-001
  - fixture: FX-26, FX-01/harness-claude, FX-01/harness-generic
  - surfaces: exit, stdout, stderr, transcript
- [x] T025 [US1] Implement the registry: entries, order, the entries under `parity` in packages/harness/src/registry/registry.ts
  - covers: F109-FR-001
- [x] T026 [P] [US1] Parity tests PT-109-C-032-queries and PT-109-C-033-role-required (names per role in registry order, stream format, invocation model; unknown entry gives 1; the role is required) in tests/parity/109/queries.parity.test.ts
  - proves: C-032; C-033; B-0418; B-0419; B-0420; B-0421
  - requirement: F109-FR-005
  - fixture: FX-26
  - surfaces: exit, stdout, stderr
- [x] T027 [US1] Implement the three queries with result records in packages/harness/src/registry/queries.ts
  - covers: F109-FR-005
- [x] T028 [P] [US1] Parity tests PT-109-C-034-display and PT-109-C-035-spelling (spelling per qualifier form; the display line) in tests/parity/109/display.parity.test.ts. The test PT-109-C-021-list-unavailable, which stood here, is withdrawn and its name is not used again: no fixture reaches the line, and T107 proves it
  - proves: C-034; B-0422; B-0431
  - requirement: F109-FR-006
  - fixture: FX-26
  - surfaces: exit, stdout, stderr
- [x] T029 [US1] Implement spelling, display and the line for an unreadable registry (tested by T028 and T107) in packages/harness/src/registry/display.ts
  - covers: F109-FR-006
- [x] T030 [P] [US1] Parity test PT-109-C-035-entry-defaults (no stream format means raw text; no overlay by default; the rule of the invocation model) in tests/parity/109/entry-defaults.parity.test.ts
  - proves: C-035; B-0423; B-0424; B-0432
  - requirement: F109-FR-007
  - fixture: FX-26
  - surfaces: exit, stdout, transcript
- [x] T031 [US1] Implement the defaults of an entry and the invocation model in packages/harness/src/registry/invocation-model.ts
  - covers: F109-FR-007
- [x] T032 [P] [US1] Parity tests PT-109-028FR021-dispatch, PT-109-C-058-dispatch and PT-109-C-066-dispatch (a reference is resolved through the registry; a qualifier on the form `none` matches no entry; no fallback between transports) in tests/parity/109/dispatch.parity.test.ts
  - proves: 028 FR-021; C-058; C-066; B-0685; B-0993
  - requirement: F109-FR-008
  - fixture: FX-26, FX-01, FX-06
  - surfaces: exit, stderr, transcript
- [x] T033 [US1] Implement the resolution of a harness reference in packages/harness/src/registry/resolve.ts
  - covers: F109-FR-008
- [x] T034 [P] [US1] Test CT-109-8 (the text search and the import-boundary check find no id of an entry, a bundled descriptor or a sample in the core packages) in tests/boundary/no-harness-name.test.ts
  - proves: F109-FR-008; F109-SC-002
- [x] T035 [P] [US1] Test CT-109-9 (`classify`: the closed vocabulary, structured code before text, unknown is `agent_failure`, the `failures` map as the only source for a declared harness, an authentication failure names what to fix) in packages/harness/test/failures/classify.test.ts
  - proves: F109-FR-009
- [x] T036 [US1] Implement `classify` and the reader of the `failures` map in packages/harness/src/failures/classify.ts
  - covers: F109-FR-009
- [x] T037 [P] [US1] Characterization test CT-109-102 (characterization of Lisa's failure classification: typed kinds, structured codes win) in packages/harness/test/failures/lisa-classify.test.ts
  - proves: F109-FR-009
- [x] T038 [P] [US1] Parity tests PT-109-C-066-critic-call, PT-109-C-060-timeout-flag and PT-109-C-061-timeout-alias (one call and no retry; the three detail texts; the time limit of 300 s and its key with the as-is alias) in tests/parity/109/critic-call.parity.test.ts
  - proves: C-066; C-060; C-061; B-0989; B-1012; B-1013; B-1014; B-0800; B-0846
  - requirement: F109-FR-010
  - fixture: FX-06, FX-05
  - surfaces: exit, stderr, state, events, transcript
- [x] T039 [US1] Implement the critic-class call: one call, time limit, reports in packages/harness/src/critic-call/call.ts
  - covers: F109-FR-010
- [x] T040 [P] [US1] Test CT-109-11 (transports: the closed set, a missing optional dependency makes one transport unavailable with a doctor line, the choice comes from the consumer only) in packages/harness/test/transports/transports.test.ts
  - proves: F109-FR-011
- [x] T041 [US1] Implement transports as a property of an entry in packages/harness/src/transports/transports.ts
  - covers: F109-FR-011
- [x] T042 [P] [US1] Parity tests PT-109-C-054-executable and PT-109-C-058-executable (resolution with the real search path before an overlay; refusals; result code 127 and its message) in tests/parity/109/executable.parity.test.ts
  - proves: C-054; C-058; B-0570; B-0683
  - requirement: F109-FR-020
  - fixture: FX-26, FX-39, FX-21
  - surfaces: exit, stderr, transcript
- [x] T043 [US1] Implement the resolution of an executable, the refusals, the warning and the recorded version in packages/harness/src/executable/resolve.ts
  - covers: F109-FR-020

**Checkpoint**: User Story 1 passes its parity tests with the stub executables

---

## Phase 4: User Story 2 - A consumer brings a harness as data (Priority: P1)

**Goal**: a harness runs from a descriptor alone

**Independent Test**: the descriptor-only fixture completes a run as proposer and as critic with no product file changed

### Tests and implementation for User Story 2

- [x] T044 [P] [US2] Test CT-109-16 (kind `cli`: the argument list of the descriptor and nothing added; no guessed flag; prompt by standard input, file or bounded argument; files written and removed; empty directory for a critic of the first form) in packages/harness/test/generic/cli.test.ts
  - proves: F109-FR-016
- [x] T045 [US2] Implement the generic harness adapter for the kind `cli` in packages/harness/src/generic/cli.ts
  - covers: F109-FR-016
- [x] T046 [P] [US2] Characterization test CT-109-103 (characterization of Lisa's completion call: no tools and no shell) in packages/harness/test/generic/lisa-no-tools.test.ts
  - proves: F109-FR-017
- [x] T047 [P] [US2] Characterization test CT-109-104 (characterization of the two completion clients as extracted: request and reply shapes; no machine-specific name; no fixed variable name; usage null where none is reported) in packages/harness/test/generic/lisa-clients.test.ts
  - proves: F109-FR-017
- [x] T048 [P] [US2] Test CT-109-17 (kinds `openai-chat` and `anthropic-messages`: one prompt, one reply, no tool in the request, values from the descriptor) in packages/harness/test/generic/endpoints.test.ts
  - proves: F109-FR-017
- [x] T049 [US2] Extract the two completion clients from Lisa at `363e6a3`, remove every machine-specific name, and drive them from the descriptor in packages/harness/src/generic/openai-chat.ts and packages/harness/src/generic/anthropic-messages.ts
  - covers: F109-FR-017
- [x] T050 [P] [US2] Test CT-109-18 (a secret goes to its bound host only; a plain address is refused unless loopback; a redirect is refused; the model list is a read request of at most 3 s; no secret in an argument list) in packages/harness/test/endpoint/safety.test.ts
  - proves: F109-FR-018
- [x] T051 [US2] Implement the endpoint guard in packages/harness/src/endpoint/guard.ts
  - covers: F109-FR-018
- [x] T052 [P] [US2] Test CT-109-19 (the raw stream goes to the reader registered for `stream.format`; `stream.mapping` is handed over as data; an unknown format refuses the descriptor) in packages/harness/test/generic/stream-handover.test.ts
  - proves: F109-FR-019
- [x] T053 [US2] Implement the hand-over of the stream to the reader registry of feature 126 in packages/harness/src/generic/stream-handover.ts
  - covers: F109-FR-019
- [x] T054 [P] [US2] Test CT-109-21 (the telemetry of the harness is switched off where the switch is named) in packages/harness/test/generic/telemetry-off.test.ts
  - proves: F109-FR-021
- [x] T055 [US2] Implement the telemetry switch in packages/harness/src/generic/switches.ts
  - covers: F109-FR-021
- [x] T056 [P] [US2] Test CT-109-22 (native memory: off for the critic, off for the proposer without opt-in, recorded; a harness that cannot switch it off is no critic) in packages/harness/test/generic/memory.test.ts
  - proves: F109-FR-022
- [x] T057 [US2] Implement the memory switch and its record in packages/harness/src/generic/memory.ts
  - covers: F109-FR-022
- [x] T058 [P] [US2] Test CT-109-23 (bundled descriptors: read by the logical name `package:harness:<id>`, validated, conformant, free of machine-specific names, removable without a code change) in packages/harness/test/descriptor/bundled.test.ts
  - proves: F109-FR-023
- [x] T059 [US2] Write the bundled descriptors as data and their loader in packages/harness/data/descriptors/ and packages/harness/src/descriptor/bundled.ts
  - covers: F109-FR-023
- [x] T060 [P] [US2] Test CT-109-43 (the descriptor-only fixture: a run completes with the fake CLI as proposer and the fake endpoint as critic, and with the fake CLI as critic; no product file differs) in tests/conformance/harness/descriptor-only/descriptor-only.test.ts
  - proves: F109-FR-043; F109-SC-001
- [x] T061 [US2] Write the two descriptors of the fixture in tests/conformance/harness/descriptor-only/fake-cli.yaml and tests/conformance/harness/descriptor-only/fake-endpoint.yaml
  - covers: F109-FR-043

**Checkpoint**: User Stories 1 and 2 work; a declared harness completes a run

---

## Phase 5: User Story 3 - No critic can act (Priority: P1)

**Goal**: every critic-class call proves its form before its reply counts

**Independent Test**: with the proof the call passes; without it the run ends with engine exit 3 and `critic_config`

### Tests and implementation for User Story 3

- [x] T062 [P] [US3] Test CT-109-37 (two forms; the form is fixed before the call; the second form and the pinned proof are refused for a harness that is not tested; no flag that allows all tools; no default context window) in packages/harness/test/proof/forms.test.ts
  - proves: F109-FR-037
- [x] T063 [US3] Implement the forms and their admission in packages/harness/src/proof/forms.ts
  - covers: F109-FR-037
- [x] T064 [P] [US3] Test CT-109-38 (first form: proven by an empty tool list and the minted session id; refused on a tool or another session; the proof by pinned configuration is recorded as the weaker proof for every call that rests on it, and is refused for a harness that is not tested; the reply of a refused call is not read) in packages/harness/test/proof/first-form.test.ts
  - proves: F109-FR-038
- [x] T065 [US3] Implement the proof of the first form in packages/harness/src/proof/first-form.ts
  - covers: F109-FR-038
- [x] T066 [P] [US3] Test CT-109-39 (second form: proven by sandbox mode, network off and the confirmation; a configured critic is refused and a picked one is passed over without it; a write and a reach for the network are recorded as refused) in packages/harness/test/proof/second-form.test.ts
  - proves: F109-FR-039
- [x] T067 [US3] Implement the proof of the second form in packages/harness/src/proof/second-form.ts
  - covers: F109-FR-039
- [x] T068 [P] [US3] Test CT-109-40 (the record of the proof in the invocation record of every critic-class call; the containment level of each role per run) in packages/harness/test/proof/record.test.ts
  - proves: F109-FR-040; F109-SC-003
- [x] T069 [US3] Implement the record of the proof in packages/harness/src/proof/record.ts
  - covers: F109-FR-040
- [x] T070 [P] [US3] Test CT-109-44 (the part of the conformance suite for the second form, with a fake binary that declares a read-only sandbox) in packages/testkit/src/conformance/EP-02/second-form.test.ts
  - proves: F109-FR-044
- [x] T071 [US3] Implement the second-form part of the suite in packages/testkit/src/conformance/EP-02/second-form.ts
  - covers: F109-FR-044

**Checkpoint**: no reply of a critic is read without a proof

---

## Phase 6: User Story 4 - A pass is contained and leaves the consumer's environment as it was (Priority: P2)

**Goal**: containment by default, the overlay with the behaviour of the baseline, nothing left behind

**Independent Test**: after a run and after a killed pass no overlay tree is left, the real home is unchanged

### Tests and implementation for User Story 4

- [x] T072 [P] [US4] Test CT-109-26 (containment: ceiling with provenance, default C2 else C1, C0 only by opt-in in user configuration, the same value from the environment, from a flag and from project configuration gives no opt-in, refusal at launch, C3 detected, the record and `protection=detect`) in packages/harness/test/containment/levels.test.ts
  - proves: F109-FR-026
- [x] T073 [US4] Implement containment levels and ceilings in packages/harness/src/containment/levels.ts
  - covers: F109-FR-026
- [x] T074 [P] [US4] Parity tests PT-109-C-007-sandbox-assertion and PT-109-C-052-sandbox-assertion (under `parity` and as root with the variable unset or empty, the harness receives the as-is variable and the log carries the note; outside `parity` never) in tests/parity/109/sandbox-assertion.parity.test.ts
  - proves: C-007; C-052; B-0067; B-0497
  - requirement: F109-FR-027
  - fixture: FX-26/root-sandbox-assertion, FX-26, FX-01
  - surfaces: stdout, state, transcript
  - prerequisite: the effective user id 0, for the capture of the reference and for the run of the port. Without it the scenario `FX-26/root-sandbox-assertion` is a skip with its reason, never a pass, and a skip blocks a release (feature 141, F141-FR-037). The half "outside `parity` never" has no prerequisite
- [x] T075 [US4] Implement the as-is assertion under the `parity` profile in packages/harness/src/containment/as-is.ts
  - covers: F109-FR-027
- [x] T076 [P] [US4] Parity tests PT-109-028FR028-overlay-policy and PT-109-C-058-scope-none (scope `none`: every overlay operation does nothing and the harness runs with the given environment; auth tier 1 never writes the real home; auth tier 2 uses the overlay) in tests/parity/109/overlay-policy.parity.test.ts
  - proves: 028 FR-028; C-058; B-0680
  - requirement: F109-FR-029
  - fixture: FX-01, FX-39
  - surfaces: exit, transcript, home
- [x] T077 [US4] Implement the policy of the configuration home per auth tier in packages/harness/src/overlay/policy.ts
  - covers: F109-FR-029
- [x] T078 [P] [US4] Parity tests PT-109-028FR028-declaration and PT-109-C-031-declaration (the rules of a declaration: key, fields, variables, reserved names, seeds, credential-like content, the refusal by a harness adapter with an overlay of its own, the empty table when the declarations cannot be read) in tests/parity/109/overlay-declaration.parity.test.ts
  - proves: 028 FR-028; C-031; B-0402; B-0403; B-0405; B-0406; B-0407; B-0408
  - requirement: F109-FR-030
  - fixture: FX-39/invalid-declaration, FX-39
  - surfaces: exit, stderr
- [x] T079 [US4] Implement the validation of an overlay declaration in packages/harness/src/overlay/declaration.ts
  - covers: F109-FR-030
- [x] T080 [P] [US4] Parity tests PT-109-028FR028-scope, PT-109-C-007-scope, PT-109-C-009-scope-exit, PT-109-C-027-scope-alias, PT-109-C-030-scope-warning, PT-109-C-031-scope, PT-109-C-052-scope and PT-109-C-058-scope-once (the scope: key and alias, validation for every entry, exit 3 before spec resolution and lock, `none` without a declaration and its warning, `pass` by default, resolved once with sweep and validation) in tests/parity/109/overlay-scope.parity.test.ts
  - proves: 028 FR-028; C-007; C-009; C-027; C-030; C-031; C-052; C-058; B-0059; B-0115; B-0392; B-0399; B-0409; B-0410; B-0511; B-0758
  - requirement: F109-FR-031
  - fixture: FX-39, FX-11
  - surfaces: exit, stderr, state, home
- [x] T081 [US4] Implement the resolution of the overlay scope and the start-up in packages/harness/src/overlay/scope.ts
  - covers: F109-FR-031
- [x] T082 [P] [US4] Parity tests PT-109-C-029-build, PT-109-C-031-build, PT-109-C-052-tmpdir and PT-109-C-056-env-record (the build of a tree: marker first, directories, seeds, unset base directories, global git configuration, git identity, the order and the kinds of the environment record, the temporary directory) in tests/parity/109/overlay-build.parity.test.ts
  - proves: C-029; C-031; C-052; C-056; B-0395; B-0396; B-0397; B-0398; B-0404; B-0412; B-0413; B-0512; B-0623
  - requirement: F109-FR-032
  - fixture: FX-39/scope-pass, FX-39/scope-attempt
  - surfaces: home, transcript
- [x] T083 [US4] Implement the build of an overlay tree, the marker and the environment record in packages/harness/src/overlay/build.ts
  - covers: F109-FR-032
- [x] T084 [P] [US4] Parity tests PT-109-C-056-lifecycle and PT-109-C-058-lifecycle (the lifecycle per scope: fresh per pass, one per invocation, the environment reaches the harness only, a failed populate, release always succeeds, the clean-up at the end) in tests/parity/109/overlay-lifecycle.parity.test.ts
  - proves: C-056; C-058; B-0622; B-0681; B-0682; B-0684; B-0759; B-0767
  - requirement: F109-FR-033
  - fixture: FX-39/scope-pass, FX-39/scope-attempt, FX-39/populate-fails, FX-21
  - surfaces: exit, stderr, home, processes, transcript
- [x] T085 [US4] Implement the lifecycle of an overlay in packages/harness/src/overlay/lifecycle.ts
  - covers: F109-FR-033
- [x] T086 [P] [US4] Parity tests PT-109-C-026-operations, PT-109-C-028-codes, PT-109-C-054-codes and PT-109-C-057-mktemp (the six overlay operations as result records; the codes 3, 1 and 0; the messages; the codes of the pass loop on a failed start-up and a failed overlay; 130 and 143 with scope `attempt` only) in tests/parity/109/overlay-operations.parity.test.ts
  - proves: C-026; C-028; C-054; C-057; B-0386; B-0387; B-0388; B-0389; B-0390; B-0391; B-0393; B-0394; B-0579; B-0580; B-0581; B-0582; B-0583; B-0641
  - requirement: F109-FR-034
  - fixture: FX-39, FX-39/scope-attempt-signal, FX-39/populate-fails
  - surfaces: exit, stderr, home
- [x] T087 [US4] Implement the overlay operations and their result codes in packages/harness/src/overlay/operations.ts
  - covers: F109-FR-034
- [x] T088 [P] [US4] Parity tests PT-109-C-030-sweep and PT-109-C-031-sweep (sweep and reap: which trees are looked at, liveness of an owner, the line per stale tree, removal with one more try, links unlinked, one warning line) in tests/parity/109/overlay-sweep.parity.test.ts
  - proves: C-030; C-031; B-0400; B-0401; B-0411; B-0415; B-0416; B-0417
  - requirement: F109-FR-035
  - fixture: FX-39
  - surfaces: stderr, home
- [x] T089 [US4] Implement sweep, reap, liveness and removal in packages/harness/src/overlay/sweep.ts
  - covers: F109-FR-035
- [x] T090 [P] [US4] Parity tests PT-109-C-031-critic-overlay and PT-109-C-066-critic-overlay (a critic-class call of an entry with an overlay: a tree of its own with the scope word `critic`, removed also on failure; the configured scope is not read; an overlay error is a failure of the call) in tests/parity/109/critic-overlay.parity.test.ts
  - proves: C-031; C-066; B-0414; B-0992
  - requirement: F109-FR-036
  - fixture: FX-39, FX-06
  - surfaces: exit, stderr, home, transcript
- [x] T091 [US4] Implement the overlay of a critic-class call in packages/harness/src/overlay/critic.ts
  - covers: F109-FR-036
- [x] T092 [P] [US4] Test CT-109-106 (no variable outside the allow-list, no changed file in the real home at auth tier 1, no overlay tree after a run or a killed pass, over all fixtures of this feature) in tests/parity/109/environment-untouched.test.ts
  - proves: F109-SC-006

**Checkpoint**: the overlay passes FX-39 and leaves nothing behind

---

## Phase 7: User Story 5 - An author proves a harness adapter or a descriptor (Priority: P2)

**Goal**: one conformance suite, the sample outside the core, `harness verify`, recorded versions

**Independent Test**: the suite passes on the sample and on every bundled descriptor; adding or removing the sample changes no core file

### Tests and implementation for User Story 5

- [x] T093 [P] [US5] Test CT-109-42 (the conformance suite: the cases HC-01 to HC-17 of `contracts/conformance-cases.json` on the sample outside the core; no paid and no external call) in packages/testkit/src/samples/EP-02/sample.test.ts
  - proves: F109-FR-042; F109-SC-005
- [x] T094 [US5] Implement the conformance suite and the sample outside the core in packages/testkit/src/conformance/EP-02/suite.ts and packages/testkit/src/samples/EP-02/
  - covers: F109-FR-042
- [x] T095 [P] [US5] Test CT-109-24 (three doctor checks per harness with stable ids; no pin for a harness that is not tested; no paid call and no secret value) in packages/harness/test/doctor/checks.test.ts
  - proves: F109-FR-024
- [x] T096 [US5] Implement and register the three doctor checks in packages/harness/src/doctor/checks.ts
  - covers: F109-FR-024
- [x] T097 [P] [US5] Test CT-109-25 (`harness verify`: exits 0, 2 and 3; refuses without a budget; stores the result at `user:harness-verify:<id>` as the record `specstride.harness-verify/1` with exactly the fields `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`, and the record validates against the schema of its owner; a changed version or hash ends the validity) in packages/harness/test/verify/verify.test.ts
  - proves: F109-FR-025
- [x] T098 [US5] Implement the command `harness verify` and the stored result, with the field names of `data-model.md`, in packages/harness/src/verify/verify.ts
  - covers: F109-FR-025
- [x] T099 [P] [US5] Test CT-109-41 (versions: a tested harness adapter has a range and a date; the version is recorded per pass and call, null where none; warnings outside the range and on a change; nothing is installed or downloaded) in packages/harness/test/versions/versions.test.ts
  - proves: F109-FR-041
- [x] T100 [US5] Implement recorded versions and their warnings in packages/harness/src/versions/versions.ts
  - covers: F109-FR-041

**Checkpoint**: all five stories work

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: what spans the stories

- [x] T101 Test CT-109-105 (every `PT-109-*` gives `equal` or `waived` with a register row on FX-01, FX-05, FX-06, FX-11, FX-21, FX-26 and FX-39) in tests/parity/109/all-parity.test.ts
  - proves: F109-SC-004
- [x] T102 [P] Test CT-109-107 (every kept row of `contracts/traceability.json` is the origin of a requirement and is named by the `proves:` of a test task). The test reads the recorded result of the traceability check, which the build of the specification writes, and compares the lines of this feature with `contracts/traceability.json`. It starts no `python3` and no other interpreter; a result that is missing is a skip with its reason, never a pass. In tests/parity/109/coverage.test.ts
  - proves: F109-SC-007
- [x] T103 [P] Test CT-109-108 (no file of packages/harness/, of the bundled descriptors or of the fixtures holds a path, an account, a model, a gateway or a name of the owner's machines) in tests/boundary/no-machine-name.test.ts
  - proves: F109-FR-023; F109-FR-017
- [x] T104 Run the conformance suite and the parity tests of this feature on the macOS runner and record the results against the four `status: unverified` fields of `spec.md` that name macOS, in tests/release/109/macos.md; a missing runner is a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F109-FR-026; F109-FR-032; F109-FR-035
- [x] T105 [P] Measure the starting values of `plan.md` (registry build, overlay build, sweep, suite run time) and record them in packages/harness/test/perf/baseline.json
  - covers: F109-FR-031; F109-FR-042
- [x] T106 Run every scenario of specs/109-harness-seam/quickstart.md and record the outcome in tests/release/109/quickstart.md
  - covers: F109-FR-042; F109-FR-043

### Added by the repairs after the cross-feature review (2026-09-30)

- [x] T107 [P] [US1] Characterization test CT-109-109 (the registry cannot be read while help is printed: compatibility output shows the as-is line `(backend list unavailable: could not run lib/backends.py; see README "Configuration")`, default output a line of the same meaning that names the registry, and help succeeds). No reference run: the expected line is the literal of the baseline at `9cab15d`, and the test makes the registry of the port unreadable. Written before T029. In tests/characterization/109/help-list-unavailable.test.ts
  - proves: C-021; B-0356
  - requirement: F109-FR-006
- [x] T108 [P] [US5] Test CT-109-110 (the bytes of host-facing output, measured with the budget helper of feature 100, `packages/testkit/src/static/budget.ts`: every doctor finding of this feature is at most 200 bytes; the default output of `harness verify` is at most 200 bytes per line and 4,096 bytes for one harness; the build fails on a breach). Written after T096 and T098. In packages/harness/test/budget/host-output.test.ts
  - proves: F109-FR-024; F109-FR-025

---

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Depends on |
|---|---|
| 1 Setup | Nothing |
| 2 Foundational | Phase 1; `@specstride/contracts` and the kernel of feature 100 |
| 3 US1 | Phase 2. The parity tests also need the engine (101, 103), the stream readers (126) and the oracle (141) |
| 4 US2 | Phase 2. The descriptor-only run needs US1 |
| 5 US3 | Phase 2, and the critic-class call of US1 |
| 6 US4 | Phase 2, and the resolution of the executable of US1 |
| 7 US5 | US1 to US4 for the full suite; the doctor registry of feature 112 |
| 8 Polish | Every story. T107 belongs to US1 and comes before T029; T108 needs T096, T098 and the budget helper of feature 100 |

### Within a story

- A test task comes before its implementation task and fails first
- Inside US4 the order is: declaration, scope, build, lifecycle, operations, sweep, critic overlay

### Parallel opportunities

- Every task marked [P] of one phase: the test tasks are in files of their own
- US2, US3 and US4 can be built side by side after Phase 2, by three people
- The tasks of Phase 1 after the first

## Parallel Example: User Story 4

```text
Task: "Parity tests PT-109-028FR028-declaration and PT-109-C-031-declaration in tests/parity/109/overlay-declaration.parity.test.ts"
Task: "Parity tests PT-109-C-029-build to PT-109-C-056-env-record in tests/parity/109/overlay-build.parity.test.ts"
Task: "Parity tests PT-109-C-030-sweep and PT-109-C-031-sweep in tests/parity/109/overlay-sweep.parity.test.ts"
```

## Implementation Strategy

### MVP first (User Story 1)

1. Phases 1 and 2
2. Phase 3: the registry and the port, proven by FX-01 and FX-26 with the stub executables
3. Stop and validate: the five harness adapters can now be built against the seam

### Incremental delivery

1. US1: the engine runs the stubs through the port
2. US2: a declared harness completes a run (the criterion of section D.5)
3. US3: no critic can act
4. US4: containment and the overlay
5. US5: the suite, `harness verify`, versions

## Notes

- No task of this feature calls a model, and none is marked paid. The paid probe of the critic's flag combination is a task of feature 125 and must be logged there; it is a precondition of no test of this feature: the tests of the proof run on fake binaries
- No test of this feature starts `python3` or another interpreter (T102)
- A test whose prerequisite is missing is a skip with its reason and never a pass: the macOS runner (T104), a sandbox of the operating system (T070), the effective user id 0 (T074)
- The name of the locally registered backend of the baseline appears in no file of this feature
- Where the traceability files name FX-26 for an overlay item, the test cites FX-39 (feature 141, §O.2)

