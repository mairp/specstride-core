---
description: "Task list of feature 138-adapter-prime"
---

# Tasks: Prime harness adapter (feature 138)

**Input**: Design documents from `specs/138-adapter-prime/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US6). The order of construction of `plan.md` is kept inside the phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md`
- Every task names its file
- A test task carries `proves:` with what it proves; a parity test also `fixture:` (feature 141, §O.6) and `requirement:`. An implementation task carries `covers:` with the requirements it serves

## What this feature inherits

This feature inherits five fixture captures and two live probes (brief 138, heading 8; F138-FR-042).
They come first, because the specification freezes only after them. **No task here runs a paid call.**
T001 prepares them and marks each as paid where it is; the owner authorizes each one and it is logged
in `docs/ecosystem/PROGRESS.md` (paid probes) by the orchestrator.

| Capture | Kind | Requirement that waits for it |
|---|---|---|
| (1) One recorded stream of a proposer pass and one of a critic call on the pinned version | **Paid probe**, one live call per role, must be logged | F138-FR-002, F138-FR-026, F138-FR-020, F138-FR-035 |
| (2) The record and the exit code when a provider limit is reached | Scripted capture, or one small **paid** call, logged | F138-FR-038, F138-FR-039 |
| (3) Whether the initial record states the tool list | Read from capture (1); no extra call | F138-FR-021 |
| (4) The resume flag inside a session directory in print mode | One small **paid** call, logged | F138-FR-014 |
| (5) The configuration directory follows the home variable; no write to the real home; none of the four kinds of auto-loaded context is loaded | The first by a scripted check that calls no model, not paid; the other two read from capture (1); no extra call | F138-FR-044, F138-FR-045, F138-FR-046 |

## Path Conventions

The package `@specstride/adapter-prime` in `packages/adapter-prime/` (see `plan.md`). Parity tests
in `tests/parity/138/` and characterization tests in `tests/characterization/138/`, at the root of
the repository (the rule of the plan of feature 100). Inside the package: the run of the conformance
suite in `tests/conformance/`, the replay suite in `tests/reader/`, fixtures in `tests/fixtures/streams/`.

## Phase 1: Setup and captures (Shared Infrastructure)

**Purpose**: the captures that gate the freeze, the directories, and the recorded streams

- [x] T001 Prepare the five captures and the two live probes as scripts with their expected outputs, each marked paid or not, in specs/138-adapter-prime/contracts/capture-plan.json and packages/adapter-prime/tests/fixtures/streams/capture-plan.md; the captures are run and logged by the owner's authorization, not by this task
  - covers: F138-FR-042
  - paid: yes, for captures (1), (2) where not scripted, and (4); must be logged
- [x] T002 Create the directories of `plan.md` under packages/adapter-prime/src/ and packages/adapter-prime/tests/, and packages/adapter-prime/src/index.ts that exports the descriptor, the reader and the dialect table
  - covers: F138-FR-001; F138-FR-023
- [x] T003 [P] Copy the ten as-is input streams of prime (read from the Specstride baseline at `9cab15d`) into packages/adapter-prime/tests/fixtures/streams/asis/, unchanged, with the licence notice of the baseline (oracle assets, never published)
  - covers: F138-FR-043
- [x] T004 [P] Add the scenarios this feature needs to the families of feature 141 inside their scope, with the stub verbs and surfaces only (feature 141, §O.1 rule 4): none beyond the catalogue is expected; a need is reported, not invented
  - covers: F138-FR-008; F138-FR-010; F138-FR-011
- [x] T005 [P] Create the schema checks that load `contracts/descriptor-prime.json` against `harness-descriptor.schema.json` and `contracts/dialect-row-prime.json` against `stream-dialect-row.schema.json` of feature 100, in packages/adapter-prime/tests/conformance/schema.test.ts
  - covers: F138-FR-001; F138-FR-024

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the descriptor, the dialect table and the reader skeleton that every story uses

- [x] T006 Write the test CT-138-24 that the row `prime` holds the fields of annex C §C.5 and no path or machine name, in tests/characterization/138/dialect-row.test.ts
  - proves: F138-FR-024
  - requirement: F138-FR-024
- [x] T007 Write the dialect table and its validation (unknown dialect refuses the stream) in packages/adapter-prime/src/reader/dialect.ts and packages/adapter-prime/data/dialects/prime.json
  - covers: F138-FR-023; F138-FR-024
- [x] T008 Write the descriptor as data in packages/adapter-prime/data/descriptor.prime.json and its loader in packages/adapter-prime/src/descriptor/index.ts
  - covers: F138-FR-001; F138-FR-004
- [x] T009 Write the six normalized record types in packages/adapter-prime/src/reader/records.ts
  - covers: F138-FR-037
- [x] T010 Write the test CT-138-23 that one reader serves two dialects without a branch on a dialect name (a static search of the reader source for the names `prime` and `pi`), in tests/characterization/138/one-reader.test.ts
  - proves: F138-FR-023
  - requirement: F138-FR-023

**Checkpoint**: descriptor and dialect row validate; the reader skeleton loads a row.

---

## Phase 3: User Story 1 - A pass runs on prime as the engine expects (Priority: P1)

**Goal**: the proposer call, the qualifier, the not-found results, the announcements.

**Independent Test**: FX-01 `harness-prime`, `harness-prime-variant`; FX-18 `harness-missing-prime`, `harness-missing-prime-launcher`, `prime-variant-with-model`, `prime-empty-variant`.

### Tests for User Story 1

- [x] T011 [P] [US1] Parity test PT-138-C-035-registry-entry in tests/parity/138/c035-registry.test.ts
  - proves: C-035; B-0430
  - fixture: FX-26, FX-01
  - requirement: F138-FR-001
- [x] T012 [P] [US1] Parity test PT-138-C-052-executable-names in tests/parity/138/c052-names.test.ts
  - proves: C-052; B-0517; B-0518
  - fixture: FX-01, FX-26
  - requirement: F138-FR-003
- [x] T013 [P] [US1] Parity test PT-138-C-058-proposer-call in tests/parity/138/c058-proposer.test.ts
  - proves: C-058; B-0692; B-0693; B-0694; B-0695; B-0696; B-0747
  - fixture: FX-01, FX-18, FX-26
  - requirement: F138-FR-008; F138-FR-009; F138-FR-010; F138-FR-013
- [x] T014 [P] [US1] Parity test PT-138-C-054-not-found in tests/parity/138/c054-not-found.test.ts
  - proves: C-054; B-0572; B-0573
  - fixture: FX-18
  - requirement: F138-FR-011
- [x] T015 [P] [US1] Parity test PT-138-C-053-raw-text-announcement in tests/parity/138/c053-announce.test.ts
  - proves: C-053; B-0547
  - fixture: FX-01, FX-26
  - requirement: F138-FR-012
- [x] T016 [P] [US1] Parity test PT-138-C-154-format-row in tests/parity/138/c154-format-row.test.ts
  - proves: C-154; B-2120
  - fixture: FX-26
  - requirement: F138-FR-013
- [x] T017 [P] [US1] Characterization test CT-138-2 for detection and version (agent executable, not the launcher; range warning; a version change between two calls of one run is a warning) in tests/characterization/138/detect.test.ts
  - proves: F138-FR-002
  - requirement: F138-FR-002
- [x] T018 [P] [US1] Characterization tests CT-138-14 and CT-138-16 (continuation by session id in the attempt's session directory, never the latest; allow-list) in tests/characterization/138/continuation-tools.test.ts
  - proves: F138-FR-014; F138-FR-016
  - requirement: F138-FR-014; F138-FR-016

### Implementation for User Story 1

- [x] T019 [US1] Write detection and the version read in packages/adapter-prime/src/detect/index.ts
  - covers: F138-FR-002
- [x] T020 [US1] Write the settings and aliases for the agent executable and the launcher in packages/adapter-prime/src/proposer/names.ts
  - covers: F138-FR-003
- [x] T021 [US1] Write the argument table loader and the proposer argument builder (modes, qualifier, order of refusals, no process on refusal) in packages/adapter-prime/src/proposer/argv.ts
  - covers: F138-FR-008; F138-FR-009; F138-FR-010
- [x] T022 [US1] Write the not-found results with the as-is messages in packages/adapter-prime/src/proposer/not-found.ts
  - covers: F138-FR-011
- [x] T023 [US1] Write the announcements (raw-text; structured with the literal `prime-v3` and five signals) in packages/adapter-prime/src/proposer/announce.ts
  - covers: F138-FR-012; F138-FR-013
- [x] T024 [US1] Write continuation by session id inside the attempt's session directory, and the tool allow-list, both off under `parity`, in packages/adapter-prime/src/proposer/continuation.ts
  - covers: F138-FR-014; F138-FR-016

**Checkpoint**: US1 parity tests pass with the stub.

---

## Phase 4: User Story 3 - One reader serves prime and pi (Priority: P1)

**Goal**: the JSONL reader for schema version 3 with every as-is behaviour. Placed before US2 because the terminal rule uses it.

**Independent Test**: the replay suite with the dialects `prime` and `pi`.

### Tests for User Story 3

- [x] T025 [P] [US3] Parity test PT-138-C-168-events in tests/parity/138/c168-events.test.ts
  - proves: C-168; B-2224; B-2225; B-2226; B-2227; B-2228; B-2229; B-2230; B-2231; B-2232; B-2233; B-2234; B-2235; B-2236; B-2237; B-2238; B-2239; B-2240
  - fixture: FX-26
  - requirement: F138-FR-025 to F138-FR-036
- [x] T026 [P] [US3] Parity test PT-138-C-169-terminals in tests/parity/138/c169-terminals.test.ts
  - proves: C-169; B-2241; B-2242; B-2243
  - fixture: FX-26
  - requirement: F138-FR-025; F138-FR-032
- [x] T027 [P] [US3] Parity test PT-138-C-170-output-lines in tests/parity/138/c170-lines.test.ts
  - proves: C-170; B-2244; B-2245; B-2246; B-2247; B-2248
  - fixture: FX-26
  - requirement: F138-FR-027; F138-FR-028; F138-FR-029; F138-FR-036
- [x] T028 [P] [US3] Parity test PT-138-C-171-behaviours in tests/parity/138/c171-behaviours.test.ts
  - proves: C-171; B-2249; B-2250; B-2251; B-2252; B-2253; B-2254; B-2255; B-2256; B-2257; B-2258; B-2259; B-2260; B-2261; B-2262; B-2263; B-2264
  - fixture: FX-26
  - requirement: F138-FR-026 to F138-FR-035
- [x] T029 [P] [US3] Replay suite test CT-138-43: the ten as-is streams with expected records, lines and projected events, and the same suite with the dialect `pi` on the streams of feature 134, in packages/adapter-prime/tests/reader/replay.test.ts
  - proves: F138-FR-043
  - requirement: F138-FR-043
- [x] T030 [P] [US3] Characterization tests CT-138-37 (six normalized kinds only; projection byte-equal on FX-26) and CT-138-40 (usage as increments; killed pass keeps partial usage; null not zero) in tests/characterization/138/records-usage.test.ts
  - proves: F138-FR-037; F138-FR-040
  - requirement: F138-FR-037; F138-FR-040

### Implementation for User Story 3

- [x] T031 [US3] Write the reader state machine and the schema gate in packages/adapter-prime/src/reader/reader.ts
  - covers: F138-FR-023; F138-FR-025; F138-FR-026
- [x] T032 [US3] Write the caps on line size and rate and the rule that tool output is never a record in packages/adapter-prime/src/reader/framing.ts
  - covers: F138-FR-023
- [x] T033 [US3] Write session, model and message handling and the text accumulation in packages/adapter-prime/src/reader/messages.ts
  - covers: F138-FR-027; F138-FR-028
- [x] T034 [US3] Write tool handling, argument summaries, targets and the lexical evidence detection in packages/adapter-prime/src/reader/summarize.ts
  - covers: F138-FR-029; F138-FR-030; F138-FR-031
- [x] T035 [US3] Write provider errors, the auth class, the held error and the terminal, and the retry diagnostic in packages/adapter-prime/src/reader/terminal.ts
  - covers: F138-FR-032; F138-FR-033; F138-FR-034
- [x] T036 [US3] Write usage names, sums, maximum, derivation, and the increments in packages/adapter-prime/src/reader/usage.ts
  - covers: F138-FR-035; F138-FR-040
- [x] T037 [US3] Write the diagnostics and the display lines in packages/adapter-prime/src/reader/display.ts
  - covers: F138-FR-036
- [x] T038 [US3] Register the reader in the registry of stream readers of feature 100 annex C §C.5, and write the projection rows for the as-is events, in packages/adapter-prime/src/reader/register.ts
  - covers: F138-FR-037

**Checkpoint**: the ten as-is streams replay equal; the pi streams pass with the row `pi`.

---

## Phase 5: User Story 2 - The terminal record decides (Priority: P1)

**Goal**: the outcome rule, the quota entries.

**Independent Test**: replay `stock-auth-error` and `empty` with exit 0.

### Tests for User Story 2

- [x] T039 [P] [US2] Characterization test CT-138-38 (exit 0 with an error terminal fails; no terminal is `stream.missing_terminal`; success terminal with exit non-zero is not a success) in tests/characterization/138/terminal-decides.test.ts
  - proves: F138-FR-038
  - requirement: F138-FR-038
- [x] T040 [P] [US2] Characterization test CT-138-39 (classifier entries; a captured limit stream gives `quota_window` and no counter moves) in tests/characterization/138/quota.test.ts
  - proves: F138-FR-039
  - requirement: F138-FR-039

### Implementation for User Story 2

- [x] T041 [US2] Write the outcome rule over the terminal record and the exit status in packages/adapter-prime/src/classifier/outcome.ts
  - covers: F138-FR-038
- [x] T042 [US2] Write the classifier entries in packages/adapter-prime/src/classifier/entries.ts and packages/adapter-prime/data/classifier-entries.json
  - covers: F138-FR-039

---

## Phase 6: User Story 4 - The critic can take no action (Priority: P2)

**Goal**: the critic call, its announcement, its proof, its window.

**Independent Test**: FX-01, FX-06, FX-07 with the prime critic stub; the planted tool record.

### Tests for User Story 4

- [x] T043 [P] [US4] Parity test PT-138-C-066-critic-call in tests/parity/138/c066-critic.test.ts
  - proves: C-066; B-0991; B-0994; B-0995
  - fixture: FX-01, FX-06, FX-07, FX-26
  - requirement: F138-FR-017; F138-FR-018
- [x] T044 [P] [US4] Parity test PT-138-C-061-critic-names-announcement in tests/parity/138/c061-critic.test.ts
  - proves: C-061; B-0827; B-0828; B-0829; B-0839
  - fixture: FX-01, FX-06, FX-26
  - requirement: F138-FR-003; F138-FR-017; F138-FR-019
- [x] T045 [P] [US4] Parity test PT-138-C-062-critic-observability in tests/parity/138/c062-critic-obs.test.ts
  - proves: C-062; B-0856
  - fixture: FX-01, FX-26
  - requirement: F138-FR-019
- [x] T046 [P] [US4] Characterization tests CT-138-20, CT-138-21, CT-138-22 (JSON critic outside `parity`; proof and `critic_not_toolless` on a planted tool record, on an initial record with a non-empty or absent tool list, and on a session id that a pass of the run used; window rules) in tests/characterization/138/critic.test.ts
  - proves: F138-FR-020; F138-FR-021; F138-FR-022
  - requirement: F138-FR-020; F138-FR-021; F138-FR-022

### Implementation for User Story 4

- [x] T047 [US4] Write the critic argument builder for both modes and the failure reports in packages/adapter-prime/src/critic/argv.ts
  - covers: F138-FR-017; F138-FR-018
- [x] T048 [US4] Write the critic announcement in packages/adapter-prime/src/critic/announce.ts
  - covers: F138-FR-019
- [x] T049 [US4] Write the JSON-mode critic: visible-text reply, outcome from the terminal, reason from the first error diagnostic, in packages/adapter-prime/src/critic/json-mode.ts
  - covers: F138-FR-020
- [x] T050 [US4] Write the proof of the critic's form and the halt on a tool record in packages/adapter-prime/src/critic/proof.ts
  - covers: F138-FR-021
- [x] T051 [US4] Write the context window statement in packages/adapter-prime/src/critic/window.ts
  - covers: F138-FR-022

---

## Phase 7: User Story 5 - No containment on purpose, terms unknown (Priority: P2)

**Independent Test**: launch with and without the C0 opt-in; once per audience; the doctor.

### Tests for User Story 5

- [x] T052 [P] [US5] Characterization tests CT-138-4, CT-138-5, CT-138-15 (terms row, never a default of a role and never picked automatically under each audience, Tier 3 refused; key by environment from a reference, allow-list; C0 refusal, an opt-in from the environment, a flag or project configuration is no opt-in, `protection=detect`, parallel off) in tests/characterization/138/tier-containment.test.ts
  - proves: F138-FR-004; F138-FR-005; F138-FR-015
  - requirement: F138-FR-004; F138-FR-005; F138-FR-015
- [x] T053 [P] [US5] Characterization tests CT-138-6, CT-138-7 (doctor checks, ids, `lb` flags, timeout is a warning; the known failure is classified, not guessed) in tests/characterization/138/doctor.test.ts
  - proves: F138-FR-006; F138-FR-007
  - requirement: F138-FR-006; F138-FR-007

### Implementation for User Story 5

- [x] T054 [US5] Write the tier and terms data and the auth handling in packages/adapter-prime/src/descriptor/tier.ts and packages/adapter-prime/src/environment/auth.ts
  - covers: F138-FR-004; F138-FR-005
- [x] T055 [US5] Write the containment ceiling and the refusal without the opt-in in packages/adapter-prime/src/descriptor/containment.ts
  - covers: F138-FR-015
- [x] T056 [US5] Write the doctor checks in packages/adapter-prime/src/doctor/index.ts
  - covers: F138-FR-006; F138-FR-007

---

## Phase 8: User Story 6 - The harness reports nothing about the consumer (Priority: P2)

### Tests for User Story 6

- [x] T057 [P] [US6] Characterization test CT-138-41 (both switches in the environment of every process the adapter starts: pass, critic, version probe, doctor probe) in tests/characterization/138/telemetry-off.test.ts
  - proves: F138-FR-041
  - requirement: F138-FR-041

### Implementation for User Story 6

- [x] T058 [US6] Write the environment builder with the allow-list and the telemetry switches from the dialect row in packages/adapter-prime/src/environment/index.ts
  - covers: F138-FR-005; F138-FR-041

---

## Phase 9: Polish and Cross-Cutting Concerns

- [x] T059 [P] Conformance test CT-138-43: the adapter passes the conformance suite of feature 109 with the fake binary, in packages/adapter-prime/tests/conformance/suite.test.ts
  - proves: F138-FR-043
  - requirement: F138-FR-043
- [x] T060 [P] Characterization test CT-138-42: every fact of `spec.md` with a status has a fixture or is listed as waiting for a capture, in tests/characterization/138/facts.test.ts
  - proves: F138-FR-042
  - requirement: F138-FR-042
- [x] T061 Turn the results of the captures into recorded fixtures with their `verified-on` date and version, and close the `status` fields of `spec.md` that they verify, after T001 has been run by the owner's authorization
  - out-of-band (owner ruling of 2026-09-30): the part that needs the output of an out-of-band task is never run and never faked here. Do the hermetic part on Linux, and record the part that needs the output of an out-of-band task as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F138-FR-042
- [x] T062 [P] Report to the orchestrator the wording that register row `DV-112` needs (no scenario of FX-18 starts the prime stub), the first launcher variable `SPECSTRIDE_PRIME_FLEET_BIN` and the order of the two (F138-FR-003), the ids of the doctor checks and the package of the reader
  - covers: F138-FR-041; F138-FR-006; F138-FR-003
- [x] T063 Run the quickstart of `quickstart.md` and record the result
  - covers: F138-FR-043

---

## Phase 10: Repairs after the cross-feature review (2026-09-30)

**Purpose**: the requirements F138-FR-044 to F138-FR-047 and the macOS task. The ids continue the list. No task here calls a model.

### Tests

- [x] T064 [P] [US1] Characterization test CT-138-44 (outside `parity` the proposer call on bare prime and on a variant carries the four switches; with the opt-in in user configuration it carries none; the opt-in in project configuration is ignored; the value is in the run record; under `parity` no such flag is passed; no key removes a switch of the critic) in tests/characterization/138/proposer-customisations.test.ts
  - proves: F138-FR-044
  - requirement: F138-FR-044
- [x] T065 [P] [US1] Characterization test CT-138-45 (auth tier 1: the process sees the real home and the home is unchanged after the call; auth tier 2: the process sees a home that is not the real home, no credential file is in it, and it is gone after the call, after a kill and after a time limit; an overlay that cannot be built starts no process; while the descriptor's statement that the agent executable follows the home variable is null, a call at auth tier 2 is refused before a process starts with the reason; under `parity` no overlay) in tests/characterization/138/home.test.ts
  - proves: F138-FR-045
  - requirement: F138-FR-045
- [x] T066 [P] [US4] Characterization test CT-138-46 (native memory off for every critic-class call and for the proposer by default; the opt-in from user configuration only; the setting of both roles in the run record; the goal flag is in no argument list; a descriptor that reports a memory as null is refused as critic) in tests/characterization/138/native-memory.test.ts
  - proves: F138-FR-046
  - requirement: F138-FR-046
- [x] T067 [P] [US5] Characterization test CT-138-47 (prime is never picked automatically as critic and never the default, under each audience; a variant gives a null identity and the result `unverified`; the same model on both sides gives `same-model`; both raise the critic-diversity warning, recorded, and the run goes on; no null is replaced by a guess) in tests/characterization/138/critic-diversity.test.ts
  - proves: F138-FR-047
  - requirement: F138-FR-047

### Implementation

- [x] T068 [US1] Add the four switches to the proposer argument builder, with the key `harnesses.prime.proposerCustomisations` and its record, in packages/adapter-prime/src/proposer/argv.ts
  - covers: F138-FR-044
- [x] T069 [US1] Write the home per auth tier: the declaration of the overlay (the home variable and the session directory variable, no seed of a credential), its removal, and the refusal of auth tier 2 while the statement that the agent executable follows the home variable is null (set by T061 from capture (5)), in packages/adapter-prime/src/environment/home.ts and packages/adapter-prime/data/descriptor.prime.json
  - covers: F138-FR-045; F138-FR-005
- [x] T070 [US4] Write the statement of native memory in the descriptor and the record of the setting per run in packages/adapter-prime/src/descriptor/memory.ts
  - covers: F138-FR-046
- [x] T071 [US5] Write the identity of each role for the diversity test in packages/adapter-prime/src/descriptor/identity.ts
  - covers: F138-FR-047; F138-FR-004
- [x] T072 Run the tests of the feature on the macOS runner when it exists and record the result; until then every macOS statement stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner, a capture) reports a skip with its reason
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F138-FR-042

---

## Dependencies and Execution Order

- T001 first. T002 to T005 next. Phase 2 blocks every story.
- US3 (the reader) before US2, which uses the terminal. US1 needs only Phase 2.
- US4 needs US3 (JSON mode) and US1 (names). US5 and US6 need Phase 2.
- Test tasks before their implementation tasks. Captures before the freeze (T061).
- Phase 10 needs US1 (the argument builder) and Phase 2; T064 to T067 before T068 to T071. No unpaid test waits for a paid capture: the tests of Phase 10 run with the stub. Auth tier 2 on prime stays refused until T061 records capture (5) in the descriptor (F138-FR-045).

## Implementation Strategy

MVP: Phase 1, Phase 2, US1 and US3, then US2. Then US4, US5, US6, and the polish tasks.
