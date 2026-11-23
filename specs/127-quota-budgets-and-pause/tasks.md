---

description: "Task list of feature 127-quota-budgets-and-pause"
---

# Tasks: Quota, budgets and pause

**Input**: Design documents from `specs/127-quota-budgets-and-pause/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Requested for every feature (constitution, Development Workflow). Parity tests and characterization tests are required tasks. A parity test names what it proves (`proves:`) and its fixture (`fixture:`), as `STAGE-B-RULES.md` section 4 says.

**Organization**: Tasks are grouped by user story. Stage B writes no product code: these tasks are for the implementation stage.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on an unfinished task)
- **[Story]**: US1 a quota exhaustion pauses the run; US2 the loudest alert is the switch to an API key; US3 a hard cap holds; US4 the whole-run wall-clock budget is as before; US5 a limit signal declared as data

## Path Conventions

`packages/policy/src/quota/`, `packages/policy/src/budget/`, `packages/policy/data/`, `packages/policy/test/` (characterization tests), `tests/parity/127/` (parity tests), `packages/testkit/` (conformance suite of EP-12 and its sample). Fixture families FX-23 and FX-18 of feature 141.

Spikes, fixture captures, live probes and experiments: this feature inherits none of its own. The captures of the limit signal of Claude, dsh, Codex, pi and prime belong to the adapter features 125, 130, 131, 134 and 138; T001 confirms them first. No paid probe is planned; a probe of the confirming kind is a real call and is only made against stubs in tests.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Confirm which captured limit signals exist (Claude CLI stream, dsh, Codex, pi, prime) from the five adapter features, and list every classifier row that stays `unverified` until a capture exists; record the list in `packages/policy/test/captures.md`
- [x] T002 Create the directories `packages/policy/src/quota/`, `packages/policy/src/budget/`, `packages/policy/data/`, `packages/policy/test/` and `tests/parity/127/`, with the imports the package graph allows and no others
- [x] T003 [P] Add the test frame: a fake clock and fake sleep, a fixed random source, a fake file writer and event writer in `packages/policy/test/support/`
- [x] T004 Confirm with feature 141 that the stubs and the scenarios of FX-23 (`wall-budget`) and FX-18 exist and that the generic stub `stub-harness` can declare a limit signal; list the scenarios this feature adds inside those families (F141-FR-030)

**Checkpoint**: the directories build, the test frame runs a fake-clock test, the capture list is agreed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: the data files, the closed sets, the ledger and the counting rules that every story needs.

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Copy `contracts/classifier.table.json` and `contracts/text-patterns.json` into `packages/policy/data/` and validate them at load against the table schema of feature 100 (F127-FR-003)
- [x] T006 [P] Confirm that the closed sets this feature owns (rows 46, 47, 48 and 205 to 208 of annex X §X.6) are present, with the members and unknown-value rules of the section "Closed sets" of the spec, in the sets that feature 100 generates into `packages/contracts/src/enums/`; write nothing into `packages/contracts/` and report a difference to feature 100; the static test of F100-FR-209 then finds a branch for every unknown value
- [x] T007 [P] Implement the spend ledger: atomic write, previous generation, deduplication by `usageId`, conversion of cumulative to increment, null as unknown, coverage counters, three billing modes kept apart, estimated cost from a declared rate table in its own field and off unless declared, in `packages/policy/src/budget/ledger.ts` (F127-FR-028, F127-FR-029, F127-FR-030, F127-FR-031)
- [x] T008 Implement the rebuild of an unreadable ledger from the previous generation and the event stream, and the unknown state in `packages/policy/src/budget/rebuild.ts` (F127-FR-032)
- [x] T009 [P] Implement the evaluation of ceilings: dimensions, scopes, hard and soft, 0 or non-finite is off, all exhausted ceilings reported in `packages/policy/src/budget/ceilings.ts` (F127-FR-024, F127-FR-025)
- [x] T010 [P] Implement the classifier: pattern signals, the table evaluation, rule id, default row, failure to `provider_other`, the unknown-value rules in `packages/policy/src/quota/classify.ts` (F127-FR-001 to F127-FR-003)
- [x] T011 Implement the action per class of §Q.1 and the counting rule for the error counter in `packages/policy/src/quota/actions.ts` (F127-FR-004, F127-FR-005)
- [x] T012 [P] Emit the events `quota.signal`, `harness.error`, `run.paused`, `run.resumed`, `alert`, `budget.exceeded`, `fallback.switched`, `fallback.restored`, `fallback.skipped`, `blocked` through the event port, redacted and cut, in `packages/policy/src/quota/events.ts` (F127-FR-040)

**Checkpoint**: the ledger, the ceilings and the classifier pass their unit tests on the fake clock

---

## Phase 3: User Story 1 - A quota exhaustion pauses the run (Priority: P1)

**Goal**: a limit pauses the run, spends nothing, and the run goes on at the reset.

**Independent Test**: the conformance fixture of the acceptance scenarios of US1

- [x] T013 [P] [US1] Characterization test CT-127-3 in packages/policy/test/ for the operations `classify` and `observe`, the nine classes, the five confidence values, the value of `retryable` per class of §Q.1 (an entry that states another value is invalid) and the unknown-value rules
  - proves: F127-FR-001
- [x] T014 [P] [US1] Characterization test CT-127-4 in packages/policy/test/ for the fields of a classification and the order of evidence
  - proves: F127-FR-002
- [x] T015 [P] [US1] Characterization test CT-127-5 in packages/policy/test/ for the table: exactly one row fires for every vector of signals, the default row, a failing classifier
  - proves: F127-FR-003
- [x] T016 [P] [US1] Characterization test CT-127-6 in packages/policy/test/ for the action of each class of §Q.1 and the bounds of the pass-level retries
  - proves: F127-FR-004
- [x] T017 [US1] Characterization test CT-127-7 in packages/policy/test/ that a failure of no quota class still counts as a consecutive error, exit 4, `proposer_consecutive_errors`
  - proves: F127-FR-005
  - fixture: FX-18
- [x] T018 [US1] Implement the confirming probe: one call, confirm or refute, recorded as real spend, never a pass or a call, not made at a reached cap in `packages/policy/src/quota/probe.ts` (F127-FR-006)
- [x] T019 [P] [US1] Characterization test CT-127-8 in packages/policy/test/ for a confirming and a refuting probe and for a probe at a reached cap
  - proves: F127-FR-006
- [x] T020 [US1] Implement the source `host`: read of the inbox request `host-event`, the confirming probe, the window-use estimate in `packages/policy/src/quota/host.ts` (F127-FR-007)
- [x] T021 [P] [US1] Characterization test CT-127-9 in packages/policy/test/ for a host event that informs, never pauses by itself, and is probed
  - proves: F127-FR-007
- [x] T022 [US1] Implement the limit-window state and the query used by the escalation skip and by feature 142 in `packages/policy/src/quota/windows.ts` (F127-FR-009)
- [x] T023 [P] [US1] Characterization test CT-127-11 in packages/policy/test/ for a limited escalation target being skipped while the base model runs
  - proves: F127-FR-009
- [x] T024 [US1] Implement the pause: state entry, record, events, the pass ended with `quota_pause`, the tree kept, one record for several live processes in `packages/policy/src/quota/pause.ts` (F127-FR-010, F127-FR-011)
- [x] T025 [P] [US1] Characterization test CT-127-12 in packages/policy/test/ for the pause record and the events on a `structured` classification
  - proves: F127-FR-010
- [x] T026 [P] [US1] Characterization test CT-127-13 in packages/policy/test/ for the six counts unchanged, and for a limited critic with the MALFORMED streak unchanged
  - proves: F127-FR-011
- [x] T027 [US1] Implement the pause clocks: exclusion from the wall clock, the pass timeout and the stall watchdog; `pausedMs` in `packages/policy/src/quota/clocks.ts` (F127-FR-012)
- [x] T028 [P] [US1] Characterization test CT-127-14 in packages/policy/test/ for the excluded time and for a signal inside a unit of work
  - proves: F127-FR-012
- [x] T029 [US1] Implement the resume time (reset, margin, jitter), the probe schedule and the resume in `packages/policy/src/quota/resume.ts` (F127-FR-013)
- [x] T030 [P] [US1] Characterization test CT-127-15 in packages/policy/test/ on a fake clock, for a known and an unknown reset time
  - proves: F127-FR-013
- [x] T031 [US1] Implement the pause episode and the ceiling, ending in `blocked-on-human` with `paused_quota_ceiling` in `packages/policy/src/quota/ceiling.ts` (F127-FR-014)
- [x] T032 [P] [US1] Characterization test CT-127-16 in packages/policy/test/ for the ceiling of 24 hours and for a resumed call that is limited again
  - proves: F127-FR-014
- [x] T033 [US1] Implement the wake, the crash and the reboot paths: recompute from the record; and the read of a stop request at least once a minute during a pause, passing to `stopping` and `stopped`, in `packages/policy/src/quota/recover.ts` (F127-FR-015, F127-FR-016)
- [x] T034 [P] [US1] Characterization test CT-127-17 in packages/policy/test/ for a clock jump, a killed engine and `resume`
  - proves: F127-FR-015
- [x] T035 [P] [US1] Characterization test CT-127-18 in packages/policy/test/ for a stop request read during a pause
  - proves: F127-FR-016
- [x] T036 [US1] Implement the blocked cases `quota-credit`, `auth` and `budget-cap`: the event, the one-line need, the terminal record values in `packages/policy/src/quota/blocked.ts` (F127-FR-017)
- [x] T037 [P] [US1] Characterization test CT-127-19 in packages/policy/test/ for the three blocked reasons and their stop reasons and exit codes
  - proves: F127-FR-017
- [x] T038 [US1] Conformance suite of EP-12 in `packages/testkit/` (the sample classifier outside the core is added by T082); a fixture run pauses on a declared map (F127-FR-001, F127-FR-008)
  - proves: F127-FR-008
- [x] T039 [P] [US1] Characterization test CT-127-10 in packages/policy/test/ for a declared map on a fake harness that pauses the run with the reject count unchanged, and without the map takes the error path
  - proves: F127-FR-008

**Checkpoint**: US1 passes on the fake clock; the six counts are unchanged in every pause fixture

---

## Phase 4: User Story 2 - The loudest alert is the switch to an API key (Priority: P1)

**Goal**: a fallback is opt-in, gated, recorded and announced; a switch to an API key is the loudest alert.

**Independent Test**: the event order of US2

- [x] T040 [US2] Implement the fallback walk: list from the role plan, trigger and delay, skip reasons in `packages/policy/src/budget/fallback.ts` (F127-FR-018, F127-FR-019)
- [x] T041 [P] [US2] Characterization test CT-127-20 in packages/policy/test/ for the widening key, off by default, refused in project configuration
  - proves: F127-FR-018
- [x] T042 [P] [US2] Characterization test CT-127-21 in packages/policy/test/ for the trigger, the delay and the wait when the reset comes first
  - proves: F127-FR-019
- [x] T043 [US2] Call the terms gate `evaluate` at every switch and skip a refused entry with an event in `packages/policy/src/budget/fallback-gate.ts` (F127-FR-020)
- [x] T044 [P] [US2] Characterization test CT-127-22 in packages/policy/test/ for an allowed and a refused entry and for no bypass
  - proves: F127-FR-020
- [x] T045 [US2] Implement the cap requirement and the `loud` alert `billing-mode-change` before the first call on the key in `packages/policy/src/budget/fallback-billing.ts` (F127-FR-021)
- [x] T046 [P] [US2] Characterization test CT-127-23 in packages/policy/test/ for the order of events and for an entry without a cap
  - proves: F127-FR-021
- [x] T047 [US2] Implement what a switch does: boundary, fresh session, `fallback.switched`, the critic-diversity warning, no critic in the proposer's session in `packages/policy/src/budget/fallback-switch.ts` (F127-FR-022)
- [x] T048 [P] [US2] Characterization test CT-127-24 in packages/policy/test/ for a switch at a boundary and inside a phase attempt, and for an escalation that is not a fallback
  - proves: F127-FR-022
- [x] T049 [US2] Implement the return, `stay`, and the exhaustion pause in `packages/policy/src/budget/fallback-return.ts` (F127-FR-023)
- [x] T050 [P] [US2] Characterization test CT-127-25 in packages/policy/test/ for the return, `stay`, and every entry limited
  - proves: F127-FR-023
- [x] T051 [US2] Implement the alert rules: thresholds, levels by billing mode, deduplication, re-arm in `packages/policy/src/budget/alerts.ts` (F127-FR-037)
- [x] T052 [P] [US2] Characterization test CT-127-35 in packages/policy/test/ for the thresholds, the levels, the deduplication and the redaction
  - proves: F127-FR-037
- [x] T053 [US2] Implement provider warnings and the observation-based alerts of a subscription in `packages/policy/src/budget/observed.ts` (F127-FR-038)
- [x] T054 [P] [US2] Characterization test CT-127-36 in packages/policy/test/ for a provider warning and for soft tokens
  - proves: F127-FR-038
- [x] T055 [P] [US2] Characterization test CT-127-37 in packages/policy/test/ for the engine as the only source and the delivery without host hooks
  - proves: F127-FR-039
- [x] T056 [P] [US2] Characterization test CT-127-38 in packages/policy/test/ for the events under the envelope, no content, and the pair `run.paused` and `run.resumed`
  - proves: F127-FR-040
- [x] T057 [US2] Implement the announcement of caps, billing mode and fallback entries at launch and at `resume` in `packages/policy/src/budget/announce.ts` (F127-FR-041)
- [x] T058 [P] [US2] Characterization test CT-127-39 in packages/policy/test/ for the text of the announcement with and without a cap
  - proves: F127-FR-041

**Checkpoint**: US2 passes; the `loud` alert precedes the first call on the key

---

## Phase 5: User Story 3 - A hard cap holds (Priority: P1)

**Goal**: a hard ceiling stops the run at a safe boundary, spend is never forgotten, and spend is counted the same way for every provider.

**Independent Test**: the cost cap of 10 units and the unreadable ledger of US3

- [x] T059 [P] [US3] Characterization test CT-127-1 in packages/policy/test/ of Lisa's budget evaluation as extracted, through the mapping to budgets per role and per run
  - proves: 002 FR-041
- [x] T060 [P] [US3] Characterization test CT-127-2 in packages/policy/test/ of Lisa's ledger as extracted, with the fixed unreadable case, the one ledger kept across a `resume`, and the reset flag of `resume` that does not reset it
  - proves: 002 FR-042
- [x] T061 [P] [US3] Characterization test CT-127-26 in packages/policy/test/ for hard and soft ceilings, the `api` records only, and `unknown` billing
  - proves: F127-FR-025
- [x] T062 [P] [US3] Characterization test CT-127-27 in packages/policy/test/ for increments, deduplication, cumulative conversion, null as unknown and a killed pass
  - proves: F127-FR-028
- [x] T063 [P] [US3] Characterization test CT-127-28 in packages/policy/test/ for notional cost kept apart, never in real spend, and the "observed by Specstride only" mark
  - proves: F127-FR-029
- [x] T064 [P] [US3] Characterization test CT-127-29 in packages/policy/test/ for estimated cost from a declared rate table
  - proves: F127-FR-030
- [x] T065 [P] [US3] Characterization test CT-127-30 in packages/policy/test/ for an unreadable ledger: previous generation, replay, unknown, and no hard ceiling set
  - proves: F127-FR-032
- [x] T066 [US3] Implement the enforcement at every usage record and at the boundaries, on the sum of live processes, ending the pass through the stop operation and passing the headroom as a spending limit in `packages/policy/src/budget/enforce.ts` (F127-FR-033)
- [x] T067 [P] [US3] Characterization test CT-127-31 in packages/policy/test/ for the overshoot of at most one call per live process, with one and with several live processes
  - proves: F127-FR-033
- [x] T068 [US3] Implement the hard-cap stop: `budget.exceeded`, `blocked` with `budget-cap`, no rejection, no bypass in `packages/policy/src/budget/cap-stop.ts` (F127-FR-034)
- [x] T069 [P] [US3] Characterization test CT-127-32 in packages/policy/test/ for the stop, the resume after raising the ceiling, the comment that cannot switch a cap off, and a tripped `wallClock` that emits no `blocked` and writes `retryable: true` (CQ-192)
  - proves: F127-FR-034
- [x] T070 [US3] Implement the unmeasurable-spend handling: announcement, doctor input, the `warn` alert, the remaining ceilings in `packages/policy/src/budget/unmeasurable.ts` (F127-FR-035)
- [x] T071 [P] [US3] Characterization test CT-127-33 in packages/policy/test/ for a harness that reports no cost
  - proves: F127-FR-035
- [x] T072 [US3] Implement the cap requirement for an automatically picked metered critic and the reason `no-cap` in `packages/policy/src/budget/critic-cap.ts` (F127-FR-036)
- [x] T073 [P] [US3] Characterization test CT-127-34 in packages/policy/test/ for a metered candidate with and without a cap
  - proves: F127-FR-036

**Checkpoint**: US3 passes; the ledger never resets

---

## Phase 6: User Story 4 - The whole-run wall-clock budget is as before (Priority: P1)

**Goal**: the baseline's wall-clock budget, byte for byte on FX-23.

**Independent Test**: FX-23 `wall-budget`

- [x] T074 [US4] Implement the wall-clock budget: the key `loop.maxWallMin` and its alias, the whole-minute test, 0 and non-numeric never trip, the start and the limit handed to the pass loop in `packages/policy/src/budget/wall-clock.ts` (F127-FR-026)
- [x] T075 [US4] Implement the checks at each phase-boundary step after the stop request, and the exit 4 path with the as-is line and `run_stop` `wall_budget`, with a terminal record that carries `retryable: true` and no blocked reason, in `packages/policy/src/budget/wall-boundary.ts` (F127-FR-027)
- [x] T076 [US4] Parity test PT-127-C-007-wall-budget-inputs in tests/parity/127/ for the variable, its default and the values that never trip
  - proves: C-007; B-0049; B-0068
  - fixture: FX-22, FX-23
  - surfaces: exit, stdout, stderr, events, state
- [x] T077 [US4] Parity test PT-127-C-009-wall-budget-exit in tests/parity/127/ for engine exit 4 at the top of a phase attempt
  - proves: C-009; B-0127
  - fixture: FX-23
  - surfaces: exit, stderr, events
- [x] T078 [US4] Parity test PT-127-C-010-wall-budget-reason in tests/parity/127/ for the stop reason `wall_budget` with the field `phase`
  - proves: C-010; B-0143
  - fixture: FX-23
  - surfaces: events
- [x] T079 [US4] Parity test PT-127-C-012-wall-budget-line in tests/parity/127/ for the line `>>> wall-clock budget (<m>min) exceeded — halting (exit 4).`
  - proves: C-012; B-0210
  - fixture: FX-23
  - surfaces: stdout, stderr
- [x] T080 [US4] Parity test PT-127-C-013-wall-budget-rule in tests/parity/127/ for the rule: ignored when non-numeric or 0, else tripped at whole minutes greater than or equal to the limit
  - proves: C-013; B-0270
  - fixture: FX-23
  - surfaces: exit, events
- [x] T081 [US4] Parity run of FX-18 (`consecutive-errors-legacy`, `consecutive-errors-structured`) under the `parity` profile to show that other classes still take the old path
  - proves: F127-FR-005
  - fixture: FX-18

**Checkpoint**: FX-23 and FX-18 report 0 results `different`

---

## Phase 7: User Story 5 - A limit signal declared as data (Priority: P2)

**Goal**: any harness can pause a run by data alone.

**Independent Test**: the fake harness of US5

- [x] T082 [US5] Add the sample classifier and the fake-harness descriptor with a declared limit signal to the test tree; run the conformance suite of EP-12; remove the sample and show 0 core files differ
  - proves: F127-SC-011
- [x] T083 [US5] Add one classifier fixture per tested harness that has a captured signal, from the captures of T001; mark the rest `unverified`
  - proves: F127-FR-002

---

## Phase 8: Polish and Cross-Cutting Concerns

- [x] T084 [P] Check the four files of `contracts/` against the spec: the table rows against §Q.1 and §Q.2, the closed sets against the section "Closed sets", the ledger schema against F127-FR-031
- [x] T085 [P] Send feature 100 the one need still open: the quota signal of annex D §D.4, or its confirmation that the router asks the limit-window state (CQ-136). The logical name `run:<runId>:spend` (annex B §B.5), rows 107 to 112 of annex X §X.7 and rows 205 to 208 of annex X §X.6 already exist
- [x] T086 Run the measurable outcomes F127-SC-001 to F127-SC-011 on the fake clock and record the results
- [x] T087 Run `python3 docs/ecosystem/check-traceability.py` and repair any line that starts with `[h` and names this feature

## Dependencies

- Phase 1 first (T001 is the capture check). Phase 2 blocks every story.
- US1 before US2 (the fallback uses the pause and the classifier). US3 needs the ledger of Phase 2. US4 needs only the engine boundary and is independent. US5 needs the conformance suite.
- Parity tests come after the code they prove; characterization tests may be written first.
