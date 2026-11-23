---
description: "Task list of feature 103-proposer-pass"
---

# Tasks: Proposer pass (feature 103)

**Input**: Design documents from `specs/103-proposer-pass/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md` (US1 to US5). The order of construction of `plan.md` is kept.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md`
- A test task carries `proves:`; a parity test also `fixture:` (`specs/141-parity-oracle/spec.md` §O.6)
- An implementation task carries `covers:` with the requirements it serves
- No task runs a paid probe. This feature inherits no spike, no fixture capture and no live probe; the experiments X3, X4, X9 and X11 are run by the experiment plan of the micro-loop feature on the switches of this feature (T081)

## Path Conventions

Modules: `packages/core/src/{pass-loop,layers,prompt,carry}/` as in `plan.md`. Tests: `tests/parity/103/`, `tests/characterization/103/`, `packages/testkit/src/conformance/EP-04/`, `packages/testkit/src/conformance/EP-15/` (W-X-02).

## Phase 1: Setup

- [x] T001 Create the module directories of `plan.md` under packages/core/src/ and the test directories; add them to the import-boundary check so that the core imports `contracts` and `kernel` only
  - covers: F103-FR-028
- [x] T002 [P] Add the closed sets of this feature (directives, returns of `afterPass`, kinds of record of the namespace `core`, reasons for a fresh session, block sets, values of the session directive) to `@specstride/contracts` with their rule for an unknown value
  - covers: F103-FR-025; F103-FR-022; F103-FR-039; F103-FR-042
- [x] T003 [P] Copy the request and result schemas of specs/103-proposer-pass/contracts/ into packages/core/src/pass-loop/ (internal: the pass loop is a call, not a command); add the schema of the handoff to packages/contracts/schemas/handoff.schema.json (a file boundary, F103-FR-041); validate all three in the build and compare the two copies against specs/103-proposer-pass/contracts/
  - covers: F103-FR-001; F103-FR-041
- [x] T004 [P] Rows 59 and 60 of annex X §X.7 confirmed present (verified 2026-09-30 against `specs/100-specstride/annexes/X-cross-layer.md`, rows `loop.noProgressStructured` and the carry-over parameters); nothing to report
  - covers: F103-FR-018
- [x] T005 [P] Run the claim check of the exercise map (F141-FR-032) for the 106 items and 028 FR-018 once the oracle holds the families; give every item that no fixture executes to the orchestrator as a correction, and add scenarios named `103-<name>` inside the scope of FX-17 to FX-20 and FX-24 only with the stub verbs of feature 141 (F141-FR-030), for the usage failures and the empty prompt, and one scenario `103-usage-text` that asks the pass loop for its usage text (a request with `help`), which gives the parity test PT-124-C-057-usage-list of feature 124 its entry point (SECOND-PASS-LIST D27)
  - covers: F103-FR-002; F103-FR-006

## Phase 2: US1 and US2 foundation, the classic loop

**Goal**: a run halts at the right limit with the right code; a changed source costs at most one pass.

**Independent test**: FX-17 to FX-20 and FX-24 under the profile `parity`; an edit of the task list between two passes stops the run with the file named.

- [x] T010 [P] [US3] Characterization test CT-103-108 in tests/characterization/103/startup-linear.test.ts: start-up measured with prompts from 20 kB to 320 kB grows no faster than the prompt
  - proves: F103-FR-008; F103-SC-004
- [x] T011 [P] [US1] Characterization test CT-103-110 in tests/characterization/103/between-passes.test.ts: `continue`, `stop` with 4, `stop` with 7, a failure and an unknown value
  - proves: F103-FR-010
- [x] T012 [P] [US1] Characterization test CT-103-118 in tests/characterization/103/blocked-declared.test.ts: the no-progress breaker on the structured path off under `parity`, on otherwise; a firing with a declaration of the proposer or a question of the harness seen gives the `blocked` result and `blocked-on-human`, a firing without one gives `proposer_no_progress` with `retryable: false` and the state `failed` (W-103-01)
  - proves: F103-FR-018
- [x] T013 [P] [US1] Characterization test CT-103-120 in tests/characterization/103/quota-carve-out.test.ts: a quota class changes no counter and gives the pass number back
  - proves: F103-FR-020; F103-SC-008
- [x] T014 [P] [US2] Characterization test CT-103-121 in tests/characterization/103/source-check.test.ts: an edit of the text of the task list stops the run before the next pass with the file named; a tick does not; under `parity` no check
  - proves: F103-FR-021; F103-SC-005
- [x] T015 [US1] Implement the request record, its defaults and the usage and set-up failures in packages/core/src/pass-loop/request.ts
  - covers: F103-FR-001; F103-FR-002
- [x] T016 [P] [US1] Implement the linear empty-prompt test in packages/core/src/pass-loop/empty-prompt.ts
  - covers: F103-FR-006; F103-FR-008
- [x] T017 [P] [US1] Implement the progress measurement in packages/core/src/pass-loop/progress.ts (it emits no `progress.swept`, which is the sweep of feature 100, F100-FR-058)
  - covers: F103-FR-016
- [x] T018 [P] [US1] Implement the invocation ids and the debug retention switch in packages/core/src/pass-loop/invocation-id.ts
  - covers: F103-FR-009
- [x] T019 [P] [US1] Implement the announcements as compatibility output in packages/core/src/pass-loop/announce.ts
  - covers: F103-FR-004

## Parity tests of the as-is behaviour

- [ ] T020 [P] [US1] Parity test PT-103-028FR018-breakers-and-exit-map in tests/parity/103/028fr018-breakers-and-exit-map.test.ts
  - proves: 028 FR-018
  - fixture: FX-17, FX-18, FX-19, FX-20
  - covers: F103-FR-015, F103-FR-019
- [ ] T021 [P] [US1] Parity test PT-103-C-006-flags in tests/parity/103/c-006-flags.test.ts
  - proves: C-006
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-003, F103-FR-009
- [ ] T022 [P] [US1] Parity test PT-103-C-007-settings in tests/parity/103/c-007-settings.test.ts
  - proves: C-007
  - fixture: FX-08, FX-17, FX-22
  - covers: F103-FR-003, F103-FR-033
- [ ] T023 [P] [US1] Parity test PT-103-C-008-events in tests/parity/103/c-008-events.test.ts
  - proves: C-008
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-004, F103-FR-033
- [ ] T024 [P] [US1] Parity test PT-103-C-009-exit-map in tests/parity/103/c-009-exit-map.test.ts
  - proves: C-009
  - fixture: FX-17, FX-18, FX-19, FX-21, FX-24
  - covers: F103-FR-019
- [ ] T025 [P] [US1] Parity test PT-103-C-010-stop-lines in tests/parity/103/c-010-stop-lines.test.ts
  - proves: C-010
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-011, F103-FR-014, F103-FR-017, F103-FR-019
- [ ] T026 [P] [US1] Parity test PT-103-C-011-prompt-file in tests/parity/103/c-011-prompt-file.test.ts
  - proves: C-011
  - fixture: FX-08
  - covers: F103-FR-007
- [ ] T027 [P] [US1] Parity test PT-103-C-012-log-lines in tests/parity/103/c-012-log-lines.test.ts
  - proves: C-012
  - fixture: FX-03, FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-004, F103-FR-011, F103-FR-014, F103-FR-017, F103-FR-019, F103-FR-033
- [ ] T028 [P] [US1] Parity test PT-103-C-013-prompt-and-invocation in tests/parity/103/c-013-prompt-and-invocation.test.ts
  - proves: C-013
  - fixture: FX-08, FX-17, FX-18, FX-19, FX-22, FX-24
  - covers: F103-FR-001, F103-FR-005, F103-FR-009, F103-FR-032, F103-FR-033
- [ ] T029 [P] [US1] Parity test PT-103-C-041-kill-classes in tests/parity/103/c-041-kill-classes.test.ts
  - proves: C-041
  - fixture: FX-20
  - covers: F103-FR-015
- [ ] T030 [P] [US1] Parity test PT-103-C-042-result-by-identity in tests/parity/103/c-042-result-by-identity.test.ts
  - proves: C-042
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-013
- [ ] T031 [P] [US1] Parity test PT-103-C-043-error-breaker in tests/parity/103/c-043-error-breaker.test.ts
  - proves: C-043
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-013, F103-FR-015
- [ ] T032 [P] [US1] Parity test PT-103-C-050-entry in tests/parity/103/c-050-entry.test.ts
  - proves: C-050
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-001
- [ ] T033 [P] [US1] Parity test PT-103-C-051-request-fields in tests/parity/103/c-051-request-fields.test.ts
  - proves: C-051
  - fixture: FX-17, FX-18, FX-19, FX-22, FX-24
  - covers: F103-FR-001, F103-FR-002, F103-FR-003
- [ ] T034 [P] [US1] Parity test PT-103-C-052-settings in tests/parity/103/c-052-settings.test.ts
  - proves: C-052
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-001, F103-FR-003, F103-FR-014, F103-FR-017
- [ ] T035 [P] [US1] Parity test PT-103-C-053-events in tests/parity/103/c-053-events.test.ts
  - proves: C-053
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-004, F103-FR-005, F103-FR-006, F103-FR-012, F103-FR-017
- [ ] T036 [P] [US1] Parity test PT-103-C-054-exit-codes in tests/parity/103/c-054-exit-codes.test.ts
  - proves: C-054
  - fixture: FX-13, FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-002, F103-FR-005, F103-FR-006, F103-FR-011, F103-FR-014, F103-FR-017
- [ ] T037 [P] [US1] Parity test PT-103-C-055-stop-literals in tests/parity/103/c-055-stop-literals.test.ts
  - proves: C-055
  - fixture: FX-17, FX-18, FX-19, FX-21, FX-24
  - covers: F103-FR-012, F103-FR-013, F103-FR-014, F103-FR-017
- [ ] T038 [P] [US1] Parity test PT-103-C-056-state in tests/parity/103/c-056-state.test.ts
  - proves: C-056
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-002, F103-FR-040
- [ ] T039 [P] [US1] Parity test PT-103-C-057-output-lines in tests/parity/103/c-057-output-lines.test.ts
  - proves: C-057
  - fixture: FX-17, FX-18, FX-19, FX-24
  - covers: F103-FR-002, F103-FR-004, F103-FR-006, F103-FR-011, F103-FR-014, F103-FR-017
- [ ] T040 [P] [US1] Parity test PT-103-C-058-loop-behaviour in tests/parity/103/c-058-loop-behaviour.test.ts
  - proves: C-058
  - fixture: FX-08, FX-17, FX-18, FX-19, FX-20, FX-21, FX-22, FX-24
  - covers: F103-FR-003, F103-FR-007, F103-FR-012, F103-FR-016, F103-FR-018, F103-FR-031

- [ ] T041 [US1] Implement the accounting after a pass (error counter on both paths, cap counter, no-progress counter, quota carve-out, one counter per invocation) in packages/core/src/pass-loop/accounting.ts
  - covers: F103-FR-012; F103-FR-013; F103-FR-014; F103-FR-015; F103-FR-017; F103-FR-020
- [ ] T042 [US1] Implement the table from result to engine exit and stop reason in packages/core/src/pass-loop/result-map.ts, checked against contracts/result-map.json and annex E
  - covers: F103-FR-011; F103-FR-019
- [ ] T043 [US1] Implement the loop (numbering, pause, evidence rules, standing prompt fixed per phase attempt, `startPass` and `betweenPasses`, the no-progress breaker and the blocked result) in packages/core/src/pass-loop/loop.ts
  - covers: F103-FR-003; F103-FR-005; F103-FR-007; F103-FR-010; F103-FR-017; F103-FR-018
- [ ] T044 [US2] Implement the source check before every pass in packages/core/src/pass-loop/source-check.ts using the kernel hasher
  - covers: F103-FR-021

## Phase 3: US5 loop-layer call points

**Goal**: a layer that does nothing changes nothing; a stacked layer may ask for passes.

**Independent test**: the conformance suite of EP-04 with the sample layers.

- [x] T050 [P] [US5] Conformance test CT-103-122 in packages/testkit/src/conformance/EP-04/call-points.test.ts: the eight call points, the fixed order after a pass, the closed returns of `afterPass`, the router consulted at `loop`
  - proves: F103-FR-022
- [x] T051 [P] [US5] Conformance test CT-103-123 in packages/testkit/src/conformance/EP-04/inertness.test.ts: the layer `none` and a sample layer `noop` pass the whole oracle; the second suite shows equal counters
  - proves: F103-FR-023; F103-SC-007
- [x] T052 [P] [US5] Conformance test CT-103-124 in packages/testkit/src/conformance/EP-04/stacking.test.ts: a sample layer above `noop` requests a group of two stub passes and integrates them; the whole oracle passes with it unregistered
  - proves: F103-FR-024; F103-FR-026
- [x] T053 [P] [US5] Conformance test CT-103-125 in packages/testkit/src/conformance/EP-04/registration.test.ts: a layer that declares a directive or service the engine does not offer is refused; a group is refused where `concurrentSessions` is not declared
  - proves: F103-FR-025
- [x] T054 [P] [US5] Conformance test CT-103-127 in packages/testkit/src/conformance/EP-04/layer-failure.test.ts: a thrown error, an invalid ledger, a spent cap and an unknown return each switch the layer off, with no run state, exit code or stop reason
  - proves: F103-FR-027
- [x] T055 [P] [US5] Static test CT-103-128 in packages/testkit/src/conformance/EP-04/module-graph.test.ts: no layer imports a writer of the phase gate; no core file names `micro` or `parallel`
  - proves: F103-FR-028
- [x] T056 [P] [US5] Characterization tests CT-103-126 and CT-103-129 in packages/testkit/src/conformance/EP-04/directives.test.ts: execution and accounting of the eleven directives; the tree-store service reserved and refused when no implementation is registered
  - proves: F103-FR-026; F103-FR-029
- [x] T057 [US5] Implement the call points, the layer `none`, the registry, the directives (the eleven, `keep`, `repair` and `unresolved` recorded in the layer's namespace with no counter changed) and the read-only view of the phase attempt in packages/core/src/layers/
  - covers: F103-FR-022; F103-FR-023; F103-FR-024; F103-FR-025; F103-FR-026; F103-FR-027; F103-FR-028; F103-FR-029
- [x] T058 [P] [US5] Implement the sample layers outside the core in packages/testkit/src/samples/EP-04/: `noop` (returns `none` at every call point, declares no directive) and `stacked` (declares `requestPassGroup` and `integrateGroup`, requests a group of two stub passes and integrates them); registered as first-party code by the conformance suite only, never by a core file
  - covers: F103-FR-023; F103-FR-024; F103-FR-025

## Phase 4: US3 the assembler and its blocks

**Goal**: a pass starts at once, with a small prompt.

**Independent test**: golden prompts (N-24) under `parity`; `prompt.built` names every block and drop.

- [x] T060 [P] [US3] Parity test PT-103-C-058-golden-prompts in tests/parity/103/golden-prompts.test.ts: the prompt equals the baseline's byte for byte under the block set `as-is`
  - proves: C-058; C-013
  - fixture: FX-08, FX-17, FX-22, FX-24
- [x] T061 [P] [US3] Conformance test CT-103-130 in packages/testkit/src/conformance/EP-15/prompt-provider.test.ts: a sample provider adds a block that shows in `prompt.built`; a failing provider leaves its block out; a failing provider of a protected block is an error of the pass
  - proves: F103-FR-030; F103-FR-034
- [x] T062 [P] [US3] Characterization tests CT-103-131 and CT-103-138 in tests/characterization/103/block-order.test.ts: the five blocks in their order; the layer protocol block is protected
  - proves: F103-FR-031; F103-FR-038
- [x] T063 [P] [US3] Characterization test CT-103-135 in tests/characterization/103/lisa-context.test.ts, taken from Lisa `proposer-context.test.ts` at `363e6a3`: the refusal of an immutable prompt over the budget, the priority of the optional sources, the deterministic compaction of progress
  - proves: F103-FR-035
- [x] T064 [P] [US3] Characterization tests CT-103-136 and CT-103-137 in tests/characterization/103/stable-start-and-index.test.ts: the hash of the stable start is equal across the passes of a phase attempt; the index regenerated from the plan equals the stored one and does not reach the critic
  - proves: F103-FR-036; F103-FR-037; F103-SC-009
- [x] T088 [P] [US3] Characterization test CT-103-145 in tests/characterization/103/feedback-provider.test.ts: under the block set `current` the feedback block holds only the criterion ids and the text after each, cut to the declared size; the verdict line and any other text of the critic's reply are absent (threat T-08); under `as-is` the feedback is the baseline's full text
  - proves: F103-FR-030
- [x] T065 [US3] Implement the assembler, the as-is set, the budget, the protected blocks, `prompt.built` and the shipped providers (spec context, handoff, feedback with the T-08 filter, hint, acceleration note, yield schema, layer protocol, plugin protocol slot) in packages/core/src/prompt/ and packages/core/src/prompt/providers/
  - covers: F103-FR-030; F103-FR-031; F103-FR-032; F103-FR-033; F103-FR-034; F103-FR-038
- [x] T066 [P] [US3] Extract Lisa's context policy into packages/core/src/prompt/context-policy.ts (MIT-compatible; source `363e6a3`), with the window of the harness converted from tokens to characters at the ratio of the plan and recorded in `prompt.built`
  - covers: F103-FR-035
- [x] T067 [P] [US3] Implement the index of verification obligations in packages/core/src/carry/index.ts (`carry.indexTitleChars` starts at 80, the plan's value)
  - covers: F103-FR-037
- [x] T068 [P] [US3] Implement the sample block provider outside the core in packages/testkit/src/samples/EP-15/: one provider that adds a volatile, unprotected block, and a variant that fails, for the conformance suite of EP-15
  - covers: F103-FR-030
- [x] T069 [US3] Implement the current set (stable blocks first, volatile last, the hash of the stable start) in packages/core/src/prompt/current-set.ts; needs T074 and T075 (the ledger and the handoff that its blocks read)
  - covers: F103-FR-036

## Phase 5: US4 carry-over

**Goal**: a killed pass leaves a trail.

**Independent test**: kill a pass of a fixture with a unit in progress; the next handoff names it and the tree is unchanged.

- [x] T070 [P] [US4] Characterization test CT-103-139 in tests/characterization/103/ledger-core.test.ts: chain, signature, one record per phase attempt with every layer off; an edited, truncated or reordered ledger switches the layers off and stops nothing
  - proves: F103-FR-039; F103-SC-009
- [x] T071 [P] [US4] Characterization test CT-103-140 in tests/characterization/103/counts.test.ts: counts continue across a resume; `--reset-counts` recorded; no per-run breaker-state file
  - proves: F103-FR-040
- [x] T072 [P] [US4] Characterization test CT-103-141 in tests/characterization/103/handoff.test.ts: at most 6 KB, regenerated, never read back, the tree fingerprint and the line that the tree wins, the unit in progress after a kill
  - proves: F103-FR-041; F103-SC-002
- [x] T073 [P] [US4] Characterization tests CT-103-142 and CT-103-143 in tests/characterization/103/session-directive.test.ts: a continued session is dropped at each of the eleven rules; a harness without continuation is always fresh; no continuation argument under `parity`
  - proves: F103-FR-042; F103-FR-043
- [x] T074 [US4] Implement the ledger records of the namespace `core` and the counters in packages/core/src/carry/ledger-core.ts and counters.ts
  - covers: F103-FR-039; F103-FR-040
- [x] T075 [P] [US4] Implement the handoff writer in packages/core/src/carry/handoff.ts
  - covers: F103-FR-041
- [x] T076 [US4] Implement the session directive and its drop rules in packages/core/src/carry/session-directive.ts, reading contracts/fresh-session-reasons.json
  - covers: F103-FR-042; F103-FR-043

## Phase 6: Polish and release checks

- [x] T080 Run the second suite (profile `parity` with the strategy `micro` and nothing else) and the inertness suite; the counters are equal
  - proves: F103-SC-007
- [x] T081 Expose the switches `carry.index`, `carry.continuation`, `carry.ledger_handoff` and the fields of `prompt.built` that experiments X3, X4, X9 and X11 need; the experiments are run by the plan of the micro-loop feature and are not run here; any paid run is logged there
  - covers: F103-SC-001
- [x] T082 Measure the start-up of a pass with prompts from 20 kB to 320 kB on Linux and record the result; the same measurement on macOS is `unverified` until a macOS runner exists
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F103-SC-004
- [x] T083 Check that `prompt.built` names every dropped or omitted block in all fixtures
  - covers: F103-SC-003
- [x] T084 Run `python3 docs/ecosystem/check-traceability.py` and repair every line that starts with `[h` and names this feature
  - covers: F103-SC-006
- [x] T085 [P] [US3] Characterization test CT-103-134 in tests/characterization/103/prompt-built-record.test.ts: every block of a pass appears in `prompt.built` with id, bytes, hash, writer, `protected` and `stable`; every block dropped or left out has its entry there; `prompt_block_protected` and `prompt_block_dropped` derive from the same record (W-X-20)
  - proves: F103-FR-034
- [x] T086 [P] Characterization test CT-103-144 in tests/characterization/103/task-events.test.ts: `task.planned` once per task of the phase slice at the open of the attempt; `task.ticked` per checkbox newly ticked after a pass, with `elapsedMs`; no tick written by the loop; the events are emitted under the `parity` profile too and project to nothing (W-X-24; B-8.7)
  - proves: F103-FR-044
- [x] T087 Run the parity tests, the characterization tests and the measurement of T082 of this feature on the macOS runner of the build workflow when it exists, and record the result per test with the version of the system in tests/characterization/103/macos.md; until then every macOS statement of this feature stays `unverified`. A test whose prerequisite is missing (the reference tree, the oracle of feature 141, a macOS runner) reports a skip with its reason and never a pass (W-X-09)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F103-SC-004

## Dependencies

Setup (T001 to T005) first. T010 to T019 and T041 to T044 (US1, US2) need T001 to T003. The parity tests T020 to T040 need T041 to T043 and the stubs of feature 141. The layer tasks (T050 to T058) need T043; T051 and T052 need the sample layers of T058. The assembler tasks (T060 to T068, T088) need T043; T061 needs the sample provider of T068. The carry-over tasks (T070 to T076) need T043 and T057. T069 (the current set) needs T065, T067, T074 and T075. T080 to T087 last.

## Implementation strategy

First the accounting, the result map and the loop with the reference on both sides, so that FX-17 to FX-20 and FX-24 pass early; then the as-is prompt set with the golden prompts; then the layer interface, then carry-over and the current set. The current set stays off under `parity` throughout.
