---
description: "Task list of feature 131-adapter-codex"
---

# Tasks: Codex harness adapter (feature 131)

**Input**: Design documents from `specs/131-adapter-codex/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- A test task carries `proves:`; a parity test also `fixture:` and `surfaces:` (feature 141, §O.6). An implementation task carries `covers:`

## What this feature inherits, and what it does not run

Five fixture captures and three paid probes. The captures are the first tasks of the list. **This feature runs none of them**, and CI runs none: each is made by an authorized person and logged (date, command, harness version, result). Every task that calls a model says PAID in its text. There is no other paid call (F131-FR-038).

| Task | What | Paid | Requirements whose status waits |
|---|---|---|---|
| T001 | Capture 1: record and exit code at a login limit | **Paid**: a run of `exec` against the provider, on a login | F131-FR-032, F131-FR-034 |
| T002 | Capture 2: first record of the stream; approval policy in force | **Paid**: one small run of `exec` | F131-FR-009, F131-FR-020, F131-FR-036 |
| T003 | Capture 3: read denial of named paths | Not paid: the harness's own sandbox command on planted files, no model call. That the result holds under `exec` is shown by the seeded read of T044, which is paid | F131-FR-011, F131-FR-019 |
| T004 | Capture 4: session files outside the home; what the harness writes to its home | **Paid**: one small run of `exec` with a session | F131-FR-013 |
| T005 | Capture 5: several headless processes under one home | **Paid**: two small runs of `exec` side by side | F131-FR-004 |
| T044 | Live probe, critic form (a) | **Paid** | F131-FR-017, F131-FR-038 |
| T050 | Live probe, critic form (b) | **Paid** | F131-FR-038 |
| T060 | Live probe, proposer | **Paid** | F131-FR-038 |

No paid task is a precondition of a test that is not paid, or of an implementation task. The tests run on the fake binary, the fake endpoint and hand-written streams. A test that would use a captured fixture is a skip with its reason until the fixture exists, never a pass, and a fact that waits for a capture or a probe stays `unverified`.

## Path Conventions

Package `@specstride/adapter-codex` in `packages/adapter-codex/`. Parity tests in `tests/parity/131/`. Conformance scripts in `tests/conformance/codex/`. Fixtures in `packages/adapter-codex/fixtures/`.

## Phase 1: Setup — the captures come first in the list and block nothing

- [ ] T001 Capture 1 (PAID, logged, authorized, not run by this feature; record and exit code at a login limit): scripted capture or one small call, explicitly authorized and logged; store the stream and the exit code as a fixture with the harness version in packages/adapter-codex/fixtures/capture-1/
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-032; F131-FR-034; F131-FR-037
- [ ] T002 Capture 2 (PAID, logged, authorized, not run by this feature; first record: sandbox mode and session; the approval policy in force under `exec`); fixture in packages/adapter-codex/fixtures/capture-2/
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-009; F131-FR-020; F131-FR-036; F131-FR-037
- [ ] T003 Capture 3 (not paid: no model call; logged, authorized, not run by this feature; can the read-only sandbox deny reads of named paths, inside and outside the working tree, read with the harness's own sandbox command); fixture in packages/adapter-codex/fixtures/capture-3/
  - out-of-band (owner ruling of 2026-09-30): the part a person runs is never run and never faked here. Do the hermetic part on Linux, and record the part a person runs as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-011; F131-FR-019; F131-FR-037
- [ ] T004 Capture 4 (PAID, logged, authorized, not run by this feature; session files outside the home while the login stays; what the harness writes to its home without persisting sessions); fixture in packages/adapter-codex/fixtures/capture-4/
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-013; F131-FR-037
- [ ] T005 Capture 5 (PAID, logged, authorized, not run by this feature; several headless processes under one home and one login); fixture in packages/adapter-codex/fixtures/capture-5/
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-004; F131-FR-037
- [ ] T006 Update the `status:` field of every requirement that a capture closes and the file specs/131-adapter-codex/contracts/captures.json, for each capture that was made; a capture that was not made leaves its status `unverified`; record the result in the report of the feature
  - covers: F131-FR-007; F131-FR-037
- [ ] T007 Create the package directories of `plan.md` and packages/adapter-codex/src/index.ts
  - covers: F131-FR-001
- [ ] T008 [P] Fake `codex` executable (Node-shebang file: records argument list, standard input, environment, working directory and process group; plays a script) in tests/conformance/codex/fake-codex.mjs, with hand-written JSONL streams from the documented record names, which serve every test until a captured fixture exists
  - covers: F131-FR-039
- [ ] T009 [P] Fake endpoint on loopback (chat shape; can fail, hang, redirect, return empty choices, 429 with and without the credit code) in tests/conformance/codex/fake-endpoint.ts
  - covers: F131-FR-039
- [ ] T010 [P] Add scenarios inside the scope of the families of feature 141 (§O.1 rule 4), as data in tests/parity/131/scenarios/: `FX-01/codex-model-named`, `FX-06/codex-empty-choices`, `FX-25/codex-model-listed`, `FX-25/codex-model-unlisted`
  - covers: F131-FR-025; F131-FR-029

## Phase 2: Foundational

- [ ] T011 [P] Test CT-131-2 (detection: version, absolute path, range warning, version per pass, no download) in packages/adapter-codex/test/detect.test.ts
  - proves: F131-FR-002
- [ ] T012 Implement detection and the version range in packages/adapter-codex/src/detect.ts
  - covers: F131-FR-002
- [ ] T013 [P] Test CT-131-3 (login check reads no credential: a planted credential file has 0 reads; unknown exit code gives `unprobed`; no model call) in packages/adapter-codex/test/preflight.test.ts
  - proves: F131-FR-003; F131-SC-007
- [ ] T014 Implement the preflight in packages/adapter-codex/src/preflight.ts
  - covers: F131-FR-003
- [ ] T015 [P] Test CT-131-7 (every fact of the descriptor, fixtures and terms rows has a date and a pin or an `unverified` mark) in packages/adapter-codex/test/facts.test.ts
  - proves: F131-FR-007; F131-SC-005
- [ ] T016 Write packages/adapter-codex/data/descriptor.json and the descriptor test packages/adapter-codex/test/descriptor.test.ts that validates it against the schema (kind `cli`, roles, transports, containment, memory, `concurrentSessions` null)
  - covers: F131-FR-001; F131-FR-004
- [ ] T017 [P] Test CT-131-4 (capabilities with provenance, nulls, `betweenPasses` continue) in packages/adapter-codex/test/capabilities.test.ts
  - proves: F131-FR-004
- [ ] T018 [P] Test CT-131-5 (terms rows: both audiences, Tier 3 refused, default auth tier 2 for `distributed`, no login token handled) in packages/adapter-codex/test/terms.test.ts
  - proves: F131-FR-005
- [ ] T019 Write packages/adapter-codex/data/terms-rows.json
  - covers: F131-FR-005
- [ ] T020 [P] Test CT-131-6 (six doctor checks: no write, no paid call, no secret; launch-blocking for executable and credential, a warning for version, sandbox, read denial and unverified facts) in packages/adapter-codex/test/doctor.test.ts
  - proves: F131-FR-006
- [ ] T021 Implement the doctor checks in packages/adapter-codex/src/doctor.ts
  - covers: F131-FR-006
- [ ] T022 [P] Test CT-131-15 (environment allow-list; keys never in argument lists; critic key not in proposer environment) in packages/adapter-codex/test/environment.test.ts
  - proves: F131-FR-015; F131-SC-007
- [ ] T023 Implement the environment builder call in packages/adapter-codex/src/environment.ts
  - covers: F131-FR-015

## Phase 3: User Story 1 — the proposer pass (P1)

- [ ] T024 [P] [US1] Parity test PT-131-C-035-registry-entry in tests/parity/131/entry.test.ts
  - proves: C-035; B-0428
  - fixture: FX-26
  - surfaces: exit, stdout, stderr, state, events, transcript
- [ ] T025 [P] [US1] Parity test PT-131-C-058-proposer-argument-list in tests/parity/131/proposer.test.ts
  - proves: C-058; B-0690; B-0691
  - fixture: FX-01/harness-codex, FX-26/codex-text
  - surfaces: exit, stdout, stderr, tree, state, events, transcript
- [ ] T026 [P] [US1] Test CT-131-9 (default invocation: sandbox mode, approvals, stdin, no argument prompt, mode recorded) in packages/adapter-codex/test/arguments-default.test.ts
  - proves: F131-FR-009
- [ ] T027 [P] [US1] Test CT-131-10 (allow-all flag only under `parity` or a C0 opt-in in user configuration; `C0` from the environment, a flag or project configuration gives no flag and the pass runs contained; never on a critic path; no sandbox assertion) in packages/adapter-codex/test/allow-all.test.ts
  - proves: F131-FR-010
- [ ] T028 [P] [US1] Test CT-131-11 (ceiling C2; sandbox cannot start gives `capability_absent`, no fallback; read-denial fact null until capture 3) in packages/adapter-codex/test/containment.test.ts
  - proves: F131-FR-011
- [ ] T029 [US1] Implement the argument builder (parity, default) in packages/adapter-codex/src/arguments.ts; data in specs/131-adapter-codex/contracts/argument-table.json copied to packages/adapter-codex/data/argument-table.json
  - covers: F131-FR-001; F131-FR-008; F131-FR-009; F131-FR-010; F131-FR-011
- [ ] T030 [P] [US1] Test CT-131-12 (continuation by the first record's id; never the latest; fresh in the listed cases; off under `parity`) in packages/adapter-codex/test/continuation.test.ts
  - proves: F131-FR-012
- [ ] T031 [P] [US1] Test CT-131-13 (session state per phase attempt and removed; at auth tier 1 the adapter writes and removes nothing in a planted home, continuation is off and nothing is persisted while the fact of capture 4 is null; ephemeral where not continuing) in packages/adapter-codex/test/session-state.test.ts
  - proves: F131-FR-013
- [ ] T032 [P] [US1] Test CT-131-14 (memory and customisations off; the opt-ins `memory.native.proposer` and `harnesses.codex.proposerCustomisations` load into a proposer pass only, never into a critic-class call, and are recorded per run; null and doctor warning where no switch; no flag under `parity`) in packages/adapter-codex/test/memory.test.ts
  - proves: F131-FR-014
- [ ] T033 [US1] Implement resume, session state and the memory switches in packages/adapter-codex/src/session.ts
  - covers: F131-FR-012; F131-FR-013; F131-FR-014

## Phase 4: User Story 2 — the critic under the read-only sandbox (P1)

- [ ] T034 [P] [US2] Test CT-131-16 (form (a) invocation; time limit ends the process group; no allow-all flag) in packages/adapter-codex/test/critic-readonly.test.ts
  - proves: F131-FR-016
- [ ] T035 [P] [US2] Test CT-131-17 (mode and network setting asserted on every call; seeded write and network attempts by the stub are refused by the mode) in packages/adapter-codex/test/critic-cannot-act.test.ts
  - proves: F131-FR-017; F131-SC-001
- [ ] T036 [P] [US2] Test CT-131-18 (fixture tree: notebook, handoff and outbox exist before, are absent during, are back after, also after a failed or killed call; refusal while a moved file is in the tree) in packages/adapter-codex/test/withheld.test.ts
  - proves: F131-FR-018; F131-SC-002
- [ ] T037 [P] [US2] Test CT-131-19 (an unconfirmed read denial moves the critic order on with the announcement; a configured critic is refused with `critic_not_toolless`) in packages/adapter-codex/test/read-denial.test.ts
  - proves: F131-FR-019
- [ ] T038 [P] [US2] Test CT-131-20 (proof: five facts and their sources, and case 2 of F100-FR-230 named in the record; every other result refuses a configured critic with `critic_not_toolless`, exit 3, `critic_config`, and passes over an automatically picked one with the announcement) in packages/adapter-codex/test/proof.test.ts
  - proves: F131-FR-020
- [ ] T039 [P] [US2] Test CT-131-21 (fresh session; no session id equal to one a pass used) in packages/adapter-codex/test/session-fresh.test.ts
  - proves: F131-FR-021; F131-SC-003
- [ ] T040 [P] [US2] Test CT-131-22 (snapshot and fact block in the prompt on stdin; reply is the final message; non-zero exit or failed turn gives no verdict) in packages/adapter-codex/test/critic-reply.test.ts
  - proves: F131-FR-022
- [ ] T041 [P] [US2] Test CT-131-23 (exception and residual risk stated in `capabilities`, descriptor and doctor) in packages/adapter-codex/test/residual-risk.test.ts
  - proves: F131-FR-023
- [ ] T042 [P] [US2] Test CT-131-24 (form by auth tier; announced; recorded per call; form (b) under `parity`) in packages/adapter-codex/test/form-choice.test.ts
  - proves: F131-FR-024
- [ ] T043 [US2] Implement form (a): checks, denial probe, proof in packages/adapter-codex/src/critic-readonly.ts
  - covers: F131-FR-016; F131-FR-017; F131-FR-018; F131-FR-019; F131-FR-020; F131-FR-021; F131-FR-022; F131-FR-023; F131-FR-024
- [ ] T044 [US2] Live probe, form (a) (PAID, logged, authorized, not run by this feature): one critic call with a seeded write, a seeded network attempt and a seeded read of a planted file at a withheld location; store the log. No test waits for it
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-017; F131-FR-038

## Phase 5: User Story 3 — the direct call (P1)

- [ ] T045 [P] [US3] Parity test PT-131-C-066-direct-call in tests/parity/131/critic-call.test.ts
  - proves: C-066; B-0981; B-0910
  - fixture: FX-06, FX-07, FX-25
  - surfaces: exit, stderr, state, events, transcript
- [ ] T046 [P] [US3] Parity test PT-131-C-061-critic-settings in tests/parity/131/critic-settings.test.ts; the scenario `FX-07/codex-missing-key` is expected as the code of the baseline ends it: a failed critic call per phase attempt, engine exit 1, `critic_unavailable` (CQ-187)
  - proves: C-061; B-0831; B-0832; B-0833
  - fixture: FX-01, FX-06, FX-07, FX-25
  - surfaces: exit, stderr, state, events, transcript
- [ ] T047 [P] [US3] Test CT-131-30 (outside `parity`: order of window sources, smaller wins, unknown model does not qualify for an automatic pick and a configured critic on it is refused, no fallback, both forms) in packages/adapter-codex/test/window.test.ts
  - proves: F131-FR-030
- [ ] T048 [P] [US3] Test CT-131-31 (cap: estimate, refusal with `quota_exhausted` and `budget_cap`, cap without prices refused, null cap, output limit outside `parity`) in packages/adapter-codex/test/cap.test.ts
  - proves: F131-FR-031
- [ ] T049 [US3] Write packages/adapter-codex/data/window-table.json and the descriptor part of form (b) (address, key reference, model default, prices with date)
  - covers: F131-FR-025; F131-FR-026; F131-FR-027; F131-FR-028; F131-FR-029; F131-FR-030; F131-FR-031
- [ ] T050 [US3] Live probe, form (b) (PAID, logged, authorized, not run by this feature): one critic call with a key; store the log. No test waits for it
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-038

## Phase 6: User Story 4 — quota and usage (P2)

- [ ] T051 [P] [US4] Test CT-131-32 (login limit text to `quota_window`, `text`, resetsAt, retryable; text found in error record, standard error or reply) in packages/adapter-codex/test/classify-login.test.ts
  - proves: F131-FR-032
- [ ] T052 [P] [US4] Test CT-131-33 (429, credit code, 401, no match; `retryable` has a value for each of the nine classes, `provider_other` true, and no entry lacks it) in packages/adapter-codex/test/classify-api.test.ts
  - proves: F131-FR-033
- [ ] T053 [P] [US4] Test CT-131-34 (no `structured` confidence while no fixture of capture 1 exists; entries change as data; the case that replays the captured record is a skip with its reason until the fixture exists) in packages/adapter-codex/test/classify-structured.test.ts
  - proves: F131-FR-034
- [ ] T054 [P] [US4] Test CT-131-35 (usage per turn; null not zero; killed pass; notional cost under a login) in packages/adapter-codex/test/usage.test.ts
  - proves: F131-FR-035
- [ ] T055 [P] [US4] Test CT-131-36 (hand-written streams through the mapping, and captured ones where they exist; `missing_terminal`; dropped records with a diagnostic; a case that needs a fixture of capture 1 or 2 is a skip with its reason until the fixture exists) in packages/adapter-codex/test/mapping.test.ts
  - proves: F131-FR-036
- [ ] T056 [US4] Write packages/adapter-codex/data/classifier.json, packages/adapter-codex/data/stream-mapping.json and packages/adapter-codex/src/login-text.ts
  - covers: F131-FR-032; F131-FR-033; F131-FR-034; F131-FR-035; F131-FR-036

## Phase 7: User Story 5 — dated facts, captures, probes, conformance (P2)

- [ ] T057 [P] [US5] Test CT-131-37 (every capture of contracts/captures.json is marked paid or not paid; a capture that was made has a logged record and a fixture with the version; for a capture that was not made the case is a skip with the reason "capture <n> not made", never a pass, and the status of its requirements is `unverified`) in packages/adapter-codex/test/captures.test.ts
  - proves: F131-FR-037; F131-SC-008
- [ ] T058 [P] [US5] Test CT-131-38 (every task that calls a model, the three probes and the four paid captures, is marked paid and no others exist; a probe that was made is logged, one that was not is a skip with its reason; no test or CI job makes a paid call; no unpaid test names a paid task as its precondition) in packages/adapter-codex/test/probes.test.ts
  - proves: F131-FR-038
- [ ] T059 [P] [US5] Conformance run CT-131-39 of the harness port suite with the fake binary, the fake endpoint, recorded streams and classifier fixtures in tests/conformance/codex/suite.test.ts
  - proves: F131-FR-039
- [ ] T060 [US5] Live probe, proposer (PAID, logged, authorized, not run by this feature): one pass; store the log. No test waits for it
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F131-FR-038
- [ ] T061 [P] [US5] Traceability test CT-131-100: every requirement of `spec.md` has a test task and every kept item and cluster has a parity test in tests/parity/131/traceability.test.ts
  - proves: F131-SC-006; F131-SC-004

## Phase 8: Critic diversity (added by the repair of 2026-09-30)

- [ ] T062 [P] [US2] Test CT-131-40 (identity of provider and model for both forms, null where unknown, provider of form (b) from the host of the endpoint; the critic-diversity warning for the same model, for the same model with a higher effort and for an unknown model; no warning for a shared provider or a shared model tier alone; the identity handed to the engine's comparison with the models of the passes of the phase attempt before a call, the warnings above asserted through the diversity test of feature 100 (F100-FR-024) fed with that identity; the call proceeds; the record and the event stay when the line is silenced; not printed under `parity`) in packages/adapter-codex/test/critic-diversity.test.ts
  - proves: F131-FR-040
- [ ] T063 [US2] Implement the identity for the diversity test and the fields of the call record in packages/adapter-codex/src/identity.ts, after T062
  - covers: F131-FR-040; F131-FR-004

## Dependencies

T006 follows each capture that was made, and only the closing of a `status:` field waits for a capture. No test task and no implementation task waits for a capture or a probe (T001 to T005, T044, T050, T060): the code is built and tested on the fake binary, the fake endpoint and hand-written streams, and a test that would use a captured fixture is a skip with its reason until the fixture exists. T043 does not wait for T003: the denial probe of F131-FR-019 runs before every call, calls no model and decides by itself; capture 3 closes the status of the fact only. T008 and T009 before all tests. Test tasks before their implementation task; T017 before T016, which it tests. T049 needs the endpoint client of the harness seam.
