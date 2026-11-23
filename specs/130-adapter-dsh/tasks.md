---
description: "Task list of feature 130-adapter-dsh"
---

# Tasks: dsh harness adapter (feature 130)

**Input**: Design documents from `specs/130-adapter-dsh/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US5), after a first phase that holds the captures and the setup.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md`
- Every task names its file
- A test task carries `proves:` with what it proves; a parity test also `fixture:`. One task may hold several named tests of one file
- An implementation task carries `covers:` with the requirements it serves

## What this feature inherits, and what it does not run

Six captures precede the freeze of the specification (F130-FR-042). They are the first tasks of
this feature. Each is a scripted probe that a person authorizes and logs. This feature and CI run
none of them; a task here writes the script, the log form and the fixture format, and closes the
status field when a result exists.

| Capture | Question | Paid | Requirement that waits |
|---|---|---|---|
| 1 | Approval mode `ask` in a headless run, standard input closed | **Paid probe**: one small call per permission mode; must be logged | F130-FR-017 |
| 2 | Enforcement of the permission mode by the operating system | **Paid probe**: one small call in `read-only`; must be logged | F130-FR-018 |
| 3 | Tool ids of the pinned version and how to list them | Not paid | F130-FR-023, F130-FR-024, F130-FR-025 |
| 4 | Rejoining of several task arguments; size of one argument | **Paid probe**: one small call; must be logged | F130-FR-011 |
| 5 | Message forms of a limit; telemetry variable and its off value; trace parent | Not paid, unless a live limit message is wanted | F130-FR-038, F130-FR-040 |
| 6 | What the composed profile loads into a call; whether a native memory exists; whether a patch overlay or a setting switches each off | Not paid: the configuration dump of the launcher makes no model call. A check that a switch takes effect in a live call is a **paid probe**, a task of its own, and must be logged | F130-FR-003, F130-FR-043, F130-FR-044, F130-FR-045 |

No paid probe is a precondition of an unpaid test: the tests of this feature run on the fake
binary and the stubs, and a fact that waits for a paid probe stays `unverified`.

## Path Conventions

The package `@specstride/adapter-dsh` in `packages/adapter-dsh/` (see `plan.md`). Parity tests in
`tests/parity/130/`. The conformance suite, the classifier fixtures and the replay of recorded
streams in `tests/conformance/adapter-dsh/`. The captures and the installer scenarios in
`tests/fixtures/adapter-dsh/`.

## Phase 1: Captures and setup

**Purpose**: the captures as the first tasks, then the directories and the data. Capture 6 is T072 in Phase 9, added by the repair of 2026-09-30; it depends on no task and is scheduled with the captures of this phase

- [ ] T001 Capture 3 (not paid): write the script that lists the tool ids of the pinned version and the introspection that yields them, and the fixture format tests/fixtures/adapter-dsh/capture-3-tool-ids.json that holds the result with the version; the script is not run by this task
  - covers: F130-FR-042; F130-FR-024
- [ ] T002 Capture 1 (paid probe, one small call per permission mode, must be logged): write the script and the log form for what approval mode `ask` does in a headless run with standard input closed, in tests/fixtures/adapter-dsh/capture-1-approval.md; the script is not run by this task
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F130-FR-042; F130-FR-017
- [ ] T003 [P] Capture 2 (paid probe, one small call in `read-only`, must be logged): write the script for the enforcement check (write outside and inside the workspace, network) in tests/fixtures/adapter-dsh/capture-2-enforcement.md; not run by this task
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F130-FR-042; F130-FR-018
- [ ] T004 [P] Capture 4 (paid probe, one small call, must be logged): write the script for the rejoining of task arguments and the accepted size of one argument in tests/fixtures/adapter-dsh/capture-4-arguments.md; not run by this task
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F130-FR-042; F130-FR-011
- [ ] T005 [P] Capture 5 (not paid; a live limit message is a paid probe of its own and must be logged): write the script for the message forms of a limit, the telemetry variable and its off value, and the trace parent in tests/fixtures/adapter-dsh/capture-5-signals.md; not run by this task
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F130-FR-042; F130-FR-038; F130-FR-040
- [ ] T006 Create the directories of `plan.md` under packages/adapter-dsh/src/ and packages/adapter-dsh/test/, and the entry packages/adapter-dsh/src/index.ts that exports the descriptor and the hooks
  - covers: F130-FR-001
- [ ] T007 [P] Copy contracts/descriptor-dsh.json, critic-patch.json, classifier-entries.json and argument-table.json into packages/adapter-dsh/data/ and add a build check that validates each against the schemas of `@specstride/contracts`
  - covers: F130-FR-001; F130-FR-023; F130-FR-038
- [ ] T008 [P] Add the scenarios this feature needs to the families of feature 141, inside the scope of each family and with its stub verbs and surfaces only (feature 141, §O.1 rule 4): in FX-38 the scenarios of `spec.md` User Story 4; in FX-39 `dsh-settings-overlay` and `dsh-reasoning-effort`; report any verb that is missing
  - covers: F130-FR-014; F130-FR-031; F130-FR-032; F130-FR-036
- [ ] T009 [P] Write the fake binary script for dsh (records argument list, standard input, environment, working directory and process group; plays a script for reply, exit code and the two streams; lists a configurable set of tool ids) in packages/testkit/src/conformance/EP-02/fake-dsh.mjs, the suite of the harness port (`plan.md`, Source Code)
  - covers: F130-FR-007; F130-FR-024

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the descriptor, the registry entry and the detection, which every story needs

- [ ] T010 [P] [US1] Parity test PT-130-C-035-registry-entry: the entry serves proposer and critic with an optional qualifier and no stream and no overlay under `parity`, in tests/parity/130/registry-entry.test.ts
  - proves: C-035; B-0426
  - fixture: FX-26; FX-01
  - requirement: F130-FR-001
- [ ] T011 [P] Characterization tests CT-130-2 and CT-130-3: detection, pin, version recorded per pass, warning on version change; capabilities with provenance in packages/adapter-dsh/test/detect.test.ts
  - proves: F130-FR-002; F130-FR-003
- [ ] T012 Implement the loader of the descriptor and the statement of capabilities with provenance in packages/adapter-dsh/src/descriptor/index.ts
  - covers: F130-FR-001; F130-FR-003
- [ ] T013 Implement detection, resolution of the executable to an absolute path (F100-FR-080), the exact pin and the version record in packages/adapter-dsh/src/detect/index.ts
  - covers: F130-FR-002
- [ ] T014 [P] Characterization test CT-130-4: the terms row is absent, the launch that names dsh states unknown terms; under the audience `personal` and under `distributed`, dsh is never the default proposer and never picked, and is passed over with `terms-unknown`, in packages/adapter-dsh/test/terms.test.ts
  - proves: F130-FR-004
- [ ] T015 Implement the supply of the facts of the terms row and the rule that the harness is never a default and never picked, for both roles and under every audience, in packages/adapter-dsh/src/descriptor/terms.ts
  - covers: F130-FR-004; F130-FR-030

**Checkpoint**: the entry exists in the registry and is detected.

---

## Phase 3: User Story 1 - A proposer pass runs on dsh (Priority: P1)

**Goal**: the proposer invocation, settings, model rules, overlay and home.

**Independent Test**: FX-01, FX-18 and FX-26 through the stub named `dsh`.

### Tests for User Story 1

- [ ] T016 [P] [US1] Parity test PT-130-C-058-invocation: the argument list, the environment names and the prompt equal the reference, no allow-all flag, one positional argument, in tests/parity/130/proposer-invocation.test.ts
  - proves: C-058; B-0688
  - fixture: FX-01; FX-26
  - requirement: F130-FR-007
- [ ] T017 [P] [US1] Parity test PT-130-C-052-settings: the as-is variables reach the keys; default profile `headless`; permission mode default `workspace-write`; the model precedence, in tests/parity/130/proposer-settings.test.ts
  - proves: C-052; B-0508; B-0509; B-0510; B-0513; B-0514; B-0515; B-0516
  - fixture: FX-01; FX-26
  - requirement: F130-FR-008
- [ ] T018 [P] [US1] Parity test PT-130-C-054-not-found: the pass returns 127 and no overlay remains, in tests/parity/130/proposer-not-found.test.ts
  - proves: C-054; B-0571
  - fixture: FX-18
  - requirement: F130-FR-009
- [ ] T019 [P] [US1] Parity test PT-130-C-058-model: precedence, conflicting providers, no provider, invalid reference, qualifier together with the flag (result 1 and the message), in tests/parity/130/proposer-model.test.ts
  - proves: C-058; B-0676; B-0678; B-0679; B-0686; B-0687
  - fixture: FX-18; FX-26; FX-07
  - requirement: F130-FR-012
- [ ] T020 [P] [US1] Parity tests PT-130-C-058-bare-ids and PT-130-C-066-bare-ids: the table of bare ids, with the row supplied by the fixture configuration and the one built-in row, in tests/parity/130/bare-ids.test.ts
  - proves: C-058; C-066; B-0677; B-0984
  - fixture: FX-01; FX-26; FX-06; FX-07
  - requirement: F130-FR-013
- [ ] T021 [P] [US1] Parity test PT-130-C-056-overlay: the throwaway home holds links and one new settings file with the block first, the real block removed, removal after the pass; and PT-130-C-057-overlay-fails: the one stderr line and result 1, in tests/parity/130/overlay.test.ts
  - proves: C-056; C-057; B-0621; B-0624; B-0642
  - fixture: FX-26; FX-39; FX-18
  - requirement: F130-FR-014
- [ ] T022 [P] [US1] Parity test PT-130-C-058-block-order: the order of prompt blocks with the protocol section after the standing prompt, in tests/parity/130/block-order.test.ts
  - proves: C-058; B-0764
  - fixture: FX-16; FX-20; FX-22; FX-24
  - requirement: F130-FR-020
- [ ] T023 [P] [US1] Parity test PT-130-C-053-iter-done: `iter_done` with `evidence=missing` and the plugin variant `plugin_restart=true` through the projection, in tests/parity/130/iter-done.test.ts
  - proves: C-053; B-0563
  - fixture: FX-19; FX-22
  - requirement: F130-FR-019
- [ ] T024 [P] [US1] Characterization tests CT-130-10, CT-130-11, CT-130-15, CT-130-16, CT-130-17, CT-130-18: permission mode always stated and no `danger-full-access` without the opt-in, which user configuration alone gives; prompt bound and split; real home byte-identical; no continuation and the switch without effect; standard input closed and no wait; containment C1 `unverified` with `protection=detect`, and `loop.parallel.allow_detect` accepted from user configuration only, in packages/adapter-dsh/test/proposer.test.ts
  - proves: F130-FR-010; F130-FR-011; F130-FR-015; F130-FR-016; F130-FR-017; F130-FR-018

### Implementation for User Story 1

- [ ] T025 [US1] Implement the argument table and the argument list of the proposer, standard input closed, the working directory, the status 127 in packages/adapter-dsh/src/proposer/index.ts
  - covers: F130-FR-007; F130-FR-009
- [ ] T026 [US1] Implement the settings and their aliases (keys of F130-FR-008) in packages/adapter-dsh/src/proposer/settings.ts
  - covers: F130-FR-008
- [ ] T027 [US1] Implement the permission mode policy in packages/adapter-dsh/src/proposer/permission.ts
  - covers: F130-FR-010
- [ ] T028 [US1] Implement the prompt bound and the split at spaces (shared with the critic) in packages/adapter-dsh/src/proposer/chunks.ts
  - covers: F130-FR-011; F130-FR-027
- [ ] T029 [US1] Implement the reference rules, the precedence and the table of bare ids in packages/adapter-dsh/src/model/index.ts
  - covers: F130-FR-012; F130-FR-013
- [ ] T030 [US1] Implement the throwaway home (links, new settings block, removal also on kill, failure line) in packages/adapter-dsh/src/overlay/index.ts
  - covers: F130-FR-014; F130-FR-015
- [ ] T031 [US1] Implement the statements of no continuation, of the approval behaviour and of the containment ceiling in the descriptor and in packages/adapter-dsh/src/descriptor/statements.ts
  - covers: F130-FR-016; F130-FR-017; F130-FR-018
- [ ] T032 [US1] Implement the `iter_done` plugin variant fields and the prompt block order for the section of the protocol in packages/adapter-dsh/src/plugins/prompt-block.ts
  - covers: F130-FR-019; F130-FR-020

**Checkpoint**: US1 passes on the stub.

---

## Phase 4: User Story 2 - dsh is the critic and cannot act (Priority: P1)

**Goal**: the critic call, the patch, the coverage check, the proof, the window.

**Independent Test**: FX-01, FX-06, FX-07, FX-25, and the conformance suite with one more tool id.

### Tests for User Story 2

- [ ] T033 [P] [US2] Parity test PT-130-C-066-invocation: the argument list with `--patch` and `--`, the working directory of the baseline under `parity`, stdout as the reply, the patch of 18 ids removed after the call, in tests/parity/130/critic-invocation.test.ts
  - proves: C-066; B-0988; B-0987
  - fixture: FX-01; FX-06
  - requirement: F130-FR-021; F130-FR-023
- [ ] T034 [P] [US2] Parity test PT-130-C-061-settings: the critic variables (executable, profile, model, provider, reasoning effort, home) and the permission mode `read-only` exported to every call, in tests/parity/130/critic-settings.test.ts
  - proves: C-061; B-0817; B-0818; B-0819; B-0820; B-0821; B-0822; B-0823; B-0824; B-0825; B-0826
  - fixture: FX-01; FX-06; FX-07
  - requirement: F130-FR-022
- [ ] T035 [P] [US2] Parity test PT-130-C-066-errors: non-zero exit with the first 300 characters of stderr or of stdout, empty stdout, in tests/parity/130/critic-errors.test.ts
  - proves: C-066; B-0990
  - fixture: FX-06; FX-07
  - requirement: F130-FR-026
- [ ] T036 [P] [US2] Parity test PT-130-C-066-chunks: the split at spaces, no chunk starting with a dash, a token over 120 KiB is an error, in tests/parity/130/critic-chunks.test.ts
  - proves: C-066; B-0983
  - fixture: FX-06; FX-07
  - requirement: F130-FR-027
- [ ] T037 [P] [US2] Parity test PT-130-C-066-model-overlay: the reference rules and the throwaway home for the critic, in tests/parity/130/critic-model.test.ts
  - proves: C-066; B-0985; B-0986
  - fixture: FX-01; FX-06; FX-07
  - requirement: F130-FR-028
- [ ] T038 [P] [US2] Parity test PT-130-C-066-window: the lookup by the part after the last `/`, the bare name gets 98,304, in tests/parity/130/critic-window.test.ts
  - proves: C-066; B-0912
  - fixture: FX-25
  - requirement: F130-FR-029
- [ ] T039 [P] [US2] Characterization tests CT-130-24, CT-130-25, CT-130-37: a fake binary with one more tool id refuses the critic; a version other than the pin refuses it; the record holds the four facts and says weaker; the check runs again after an install; the value `none` under `parity`, in packages/adapter-dsh/test/critic-proof.test.ts
  - proves: F130-FR-024; F130-FR-025; F130-FR-037
  - fixture: FX-01

### Implementation for User Story 2

- [ ] T040 [US2] Implement the critic invocation, the empty working directory outside `parity`, the process group and the time limit in packages/adapter-dsh/src/critic/index.ts
  - covers: F130-FR-021
- [ ] T041 [US2] Implement the critic settings and their aliases in packages/adapter-dsh/src/critic/settings.ts
  - covers: F130-FR-022
- [ ] T042 [US2] Implement the patch file, its hash and its removal in packages/adapter-dsh/src/critic/patch.ts
  - covers: F130-FR-023
- [ ] T043 [US2] Implement the coverage check, the proof record, the switch `harnesses.dsh.critic.proof` and the refusal `critic_not_toolless` in packages/adapter-dsh/src/coverage/index.ts
  - covers: F130-FR-024; F130-FR-025; F130-FR-037
- [ ] T044 [US2] Implement the critic errors and the critic model overlay in packages/adapter-dsh/src/critic/errors.ts and packages/adapter-dsh/src/critic/model.ts
  - covers: F130-FR-026; F130-FR-028
- [ ] T045 [US2] Implement the window rule and the override in packages/adapter-dsh/src/critic/window.ts
  - covers: F130-FR-029

**Checkpoint**: US2 passes on the stub and the fake binary.

---

## Phase 5: User Story 3 - A limit or an error of the provider is understood (Priority: P1)

- [ ] T046 [P] [US3] Characterization test CT-130-38: each of the four codes on each of the two streams, a reset time parsed or null, `CONTEXT_WINDOW_EXCEEDED` never MALFORMED, no match gives `provider_other`, in tests/conformance/adapter-dsh/classifier.test.ts
  - proves: F130-FR-038
- [ ] T047 [P] [US3] Characterization tests CT-130-39, CT-130-40, CT-130-41: `usage.unavailable` with the reason for every pass; telemetry off and the trace parent; the environment allow-list and no secret in an argument list, in packages/adapter-dsh/test/environment.test.ts
  - proves: F130-FR-039; F130-FR-040; F130-FR-041
- [ ] T048 [US3] Implement the classifier entries as a pure table in packages/adapter-dsh/src/classifier/index.ts
  - covers: F130-FR-038
- [ ] T049 [US3] Implement the environment allow-list, the telemetry mode, the trace parent and the usage statement in packages/adapter-dsh/src/environment/index.ts
  - covers: F130-FR-039; F130-FR-040; F130-FR-041

---

## Phase 6: User Story 4 - A proposer asks for a plugin and gets it, or is refused (Priority: P2)

### Tests for User Story 4

- [ ] T050 [P] [US4] Parity test PT-130-C-036-processor: the flags and their defaults, and PT-130-C-037-exit: exit 2 with the line `dsh plugin request: <cause>` and exit 0 with the JSON result, in tests/parity/130/plugin-processor.test.ts
  - proves: C-036; C-037; B-0433; B-0434
  - fixture: FX-38; FX-17; FX-18
  - requirement: F130-FR-031
- [ ] T051 [P] [US4] Parity test PT-130-C-038-lock-receipt: the exclusive lock and the receipt fields, in tests/parity/130/plugin-receipt.test.ts
  - proves: C-038; B-0435; B-0436
  - fixture: FX-38
  - requirement: F130-FR-031
- [ ] T052 [P] [US4] Parity tests PT-130-C-039-no-request and PT-130-C-040-validation: no file gives the none result; a link, a size over 16,384, a fourth key, a range, a duplicate, a reason over 2,048 bytes and an entry outside the allowlist are refused; the installer argument list, in tests/parity/130/plugin-validation.test.ts
  - proves: C-039; C-040; B-0437; B-0438; B-0439; B-0440; B-0441; B-0442; B-0443
  - fixture: FX-38
  - requirement: F130-FR-032
- [ ] T053 [P] [US4] Parity tests PT-130-C-056-artifacts and PT-130-C-052-plugin-settings: the request and archive names, the allowlist and time limit settings, in tests/parity/130/plugin-artifacts.test.ts
  - proves: C-056; C-052; B-0618; B-0619; B-0536; B-0542
  - fixture: FX-38
  - requirement: F130-FR-033
- [ ] T054 [P] [US4] Parity tests PT-130-C-057-protocol-section and PT-130-C-058-handling: the section only for the bare name and a non-empty allowlist, the request handled before the evidence check, the restart pass exempt from breakers and short-pass counter, a qualified name never processed, in tests/parity/130/plugin-handling.test.ts
  - proves: C-057; C-058; B-0650; B-0757; B-0768; B-0769
  - fixture: FX-38; FX-17; FX-18
  - requirement: F130-FR-035
- [ ] T055 [P] [US4] Parity tests PT-130-C-053-events, PT-130-C-054-exits and PT-130-C-057-lines: the three events, the results 7 and 4, the three stderr lines, in tests/parity/130/plugin-ends.test.ts
  - proves: C-053; C-054; C-057; B-0551; B-0552; B-0553; B-0585; B-0586; B-0587; B-0653; B-0654
  - fixture: FX-38; FX-17; FX-18
  - requirement: F130-FR-036
- [ ] T056 [P] [US4] Characterization test CT-130-34: outside `parity` the allowlist from project configuration, the environment or a flag is ignored with a launch message and a doctor warning, and under `parity` the as-is variable is its alias (CQ-233); the consent, the record in the run record and in the receipt; the protocol off under `distributed` unless the allowlist is set; a real-home write only for listed plugins, in packages/adapter-dsh/test/plugin-consent.test.ts
  - proves: F130-FR-034

### Implementation for User Story 4

- [ ] T057 [US4] Implement the processor: read as a claim, validate, lock, installer as a fixed argument list with a time limit, receipt and archive in packages/adapter-dsh/src/plugins/request.ts and install.ts
  - covers: F130-FR-031; F130-FR-032; F130-FR-033
- [ ] T058 [US4] Implement `betweenPasses` for the results 7 and 4, the three events and the three lines, and the capability `pluginRequests` in packages/adapter-dsh/src/plugins/between-passes.ts
  - covers: F130-FR-035; F130-FR-036
- [ ] T059 [US4] Implement the consent record and the refusal of the allowlist from any source but user configuration outside `parity` in packages/adapter-dsh/src/plugins/consent.ts
  - covers: F130-FR-034

---

## Phase 7: User Story 5 - Facts are dated (Priority: P2)

- [ ] T060 [P] [US5] Characterization tests CT-130-5 and CT-130-6: every check of the doctor reads and never writes, makes no paid call, closes standard input; the warnings for customisations and native memory and the launch-blocking check of the critic role are registered; every fact has a date and the pin or the mark, in packages/adapter-dsh/test/doctor.test.ts
  - proves: F130-FR-005; F130-FR-006
- [ ] T061 [US5] Implement the doctor checks in packages/adapter-dsh/src/doctor/index.ts
  - covers: F130-FR-005; F130-FR-006
- [ ] T062 [P] [US5] Characterization test CT-130-42: each capture is stored as a fixture with the version, or its requirement is listed as `unverified`, in tests/conformance/adapter-dsh/captures.test.ts
  - proves: F130-FR-042

---

## Phase 8: Polish and cross-cutting

- [ ] T063 Run the adapter conformance suite of feature 109 with the fake binary of T009 and the sample outside the core, in tests/conformance/adapter-dsh/conformance.test.ts
  - proves: F130-FR-001; F130-FR-041
- [ ] T064 Replay the recorded stdout and stderr through the text reader of feature 126 and compare with the synthesized `init` and `terminal`, in tests/conformance/adapter-dsh/replay.test.ts
  - proves: F130-FR-001; F130-FR-039
- [ ] T065 Static check that no name of a model, provider, launcher or gateway of the owner's machines appears in any file of the package or its tests, in tests/conformance/adapter-dsh/naming.test.ts
  - proves: F130-FR-013
- [ ] T066 Update the status fields of `spec.md` from the captures that exist and write the list of the still `unverified` facts for the release notes
  - covers: F130-FR-006; F130-FR-042
- [ ] T067 Confirm against feature 100 and the register that the rows this feature cites exist (DV-108 to DV-111; rows 117, 118 and 131 of annex X §X.7; rows 215 to 217, 275 and 276 of annex X §X.6; the aliases of annex X §X.8; the logical name `pass:<passId>:critic-patch`)
  - covers: F130-FR-013; F130-FR-024

---

## Phase 9: After the cross-feature review (2026-09-30)

**Purpose**: the tasks of the requirements added by the repair, and the test that had no task. Test tasks first. No task of this phase calls a model.

- [ ] T068 [P] [US2] Characterization test CT-130-30: with no critic configured dsh is never picked, in any step of the critic order and under both audiences, and is never the default critic; a consumer who names it gets the unknown-terms warning; naming it does not lift the refusals of F130-FR-024, F130-FR-025, F130-FR-029 and F130-FR-045; the critic-diversity warning is raised and never blocks, in packages/adapter-dsh/test/critic-pick.test.ts
  - proves: F130-FR-030
- [ ] T069 [P] [US1] Characterization test CT-130-43: `capabilities` reports the switch of each kind of customisation as null; with `harnesses.dsh.proposerCustomisations` at `off` the state is `not-switchable`, the launch states the kinds and the doctor warns; with `on` the state is `opted-in` and no warning is raised; the run record and the record of every pass hold the value asked and the state; `off` and `absent` are never recorded without a capture; under `parity` the state is `as-is`, no flag is passed and no line is printed, in packages/adapter-dsh/test/customisations.test.ts
  - proves: F130-FR-043; F130-FR-003
- [ ] T070 [P] [US1] Characterization test CT-130-44: the descriptor declares native memory as unknown with a null switch; the run record holds the value asked and the state for the proposer and for the critic-class calls; the opt-in is read from user configuration only; under `parity` no flag about memory is passed, in packages/adapter-dsh/test/memory.test.ts
  - proves: F130-FR-044
- [ ] T071 [P] [US2] Characterization test CT-130-45: outside `parity` the critic role is refused with `memory-not-off` and `capability_absent` while the state of native memory is neither `off` nor `absent`, and the doctor check is launch-blocking; a fixture capture that shows `absent` admits the role; a fixture capture that shows a customisation loaded into a critic-class call that the patch does not cover refuses the role with `memory-not-off` (CQ-232); `harnesses.dsh.proposerCustomisations` has no effect on a critic-class call; the record of every critic-class call holds the state of each kind; under `parity` no check is made, in packages/adapter-dsh/test/critic-memory.test.ts
  - proves: F130-FR-045
- [ ] T072 Capture 6 (not paid): write the script that reads the composed profile of the pinned version with the configuration dump of the launcher, lists what it loads by kind and whether a memory is kept, and store the result as tests/fixtures/adapter-dsh/capture-6-profile.json with the version; the script is not run by this task. A check that a switch takes effect in a live call is a paid probe, is a separate run that a person authorizes and logs, and is no precondition of T069 to T071
  - covers: F130-FR-042; F130-FR-043; F130-FR-044; F130-FR-045
- [ ] T073 [US1] Implement the kinds and states, the customisation record per run and per call, the launch line and the reading of `harnesses.dsh.proposerCustomisations` and `memory.native.proposer` in packages/adapter-dsh/src/customisations/index.ts
  - covers: F130-FR-003; F130-FR-043; F130-FR-044
- [ ] T074 [US2] Implement the refusal of the critic role on native memory and on a customisation shown to be loaded into a critic-class call (CQ-232), with the reason `memory-not-off`, and the record of the states for a critic-class call in packages/adapter-dsh/src/customisations/critic.ts
  - covers: F130-FR-045
- [ ] T075 [US5] Register the doctor checks for customisations, native memory and the critic role in packages/adapter-dsh/src/doctor/index.ts
  - covers: F130-FR-005; F130-FR-043; F130-FR-044; F130-FR-045
- [ ] T076 [P] [US3] Characterization test CT-130-41, second part: a secret of a call at auth tier 2 is resolved through the secret resolver at the moment of use and reaches the process in its environment only; no credential file is read; over all fixtures, 0 planted key values appear in any argument list, event, log, receipt or record of the adapter (F130-SC-009), in packages/adapter-dsh/test/secret.test.ts
  - proves: F130-FR-041; F130-SC-009
