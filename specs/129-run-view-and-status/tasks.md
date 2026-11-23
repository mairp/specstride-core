---
description: "Task list of feature 129-run-view-and-status"
---

# Tasks: Run view and status

**Input**: Design documents from `specs/129-run-view-and-status/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). No as-is requirement and no behaviour item with a kept disposition is assigned to this feature, so no parity test with `proves:` of an as-is id exists; the data behind `status` on FX-28 is proved by a characterization test that uses the fixture family. A test task is written before the task it tests and must fail before that task is done.

**Organization**: Grouped by the user stories of `spec.md` (US1 to US6), after the first tasks and the foundation. Every task names its file where it has one. A test task carries `proves:` and, where it uses the stubs of the oracle, `fixture:`. An implementation task carries `covers:`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: US1 re-attach, US2 wait, US3 attention, US4 renderer and lanes, US5 status line, US6 budget and parallel hours

## Path Conventions

`packages/view/src/` for the pure read model; `packages/cli/src/status/` for the commands and the readers; `tests/characterization/129/` for `CT-129-*`; `packages/testkit/` for the samples. The runtime package (feature 122) calls the writers and is not built here.


## Phase 1: First tasks (measurement, captures, confirmations)

- [x] T001 [US1] Measurement: time `status`, a full projection and a projection from a valid cached view on a generated event file of 100,000 events on the reference machine of CI (Linux; macOS when a runner exists); record the result in `tests/characterization/129/spike-read-cost.md`. Local, no model call. It confirms or corrects the target of F129-SC-001 and the plan's target of 0.5 second from a cached view
  - out-of-band (owner ruling of 2026-09-30): the live-host part is never run and never faked here. Do the hermetic part on Linux, and record the live-host part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F129-SC-001
- [x] T002 [US5] Capture on a live host, unverified until done: the host hook shim of feature 113 prints the precomputed line at the start of a session without starting the product, and a line past its `validUntil` is printed as unknown. If the capture needs a model call it is paid, and must be logged in the cost record; this specification does not run it. Record the result in `tests/characterization/129/capture-host-hook-shim.md` and update the `status:` of F129-FR-028
  - out-of-band (owner ruling of 2026-09-30): the live-host part is never run and never faked here. Do the hermetic part on Linux, and record the live-host part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F129-FR-028
- [x] T003 [US1] Confirm with feature 111 that `contracts/signal-table.md` covers the event catalogue (row 73 of annex X §X.6; 122 types after the second pass of feature 111, re-checked on 2026-09-30: every type has a row in "Types the view reads" or the mark `ignored`, and the critic-call pair is opened by `critic.started` and closed by `critic.call`), and report any type that the catalogue gains later. Output: the corrected signal table. The test of the table is CT-129-5
  - proves: F129-FR-011
- [x] T004 [US1] Confirm with feature 122 and feature 123 that the caller can supply the observations of F129-FR-001 (lease with `validUntil`, newest launch record, supervision record, process-table search, handshake limit), and report the form of the `refusal` of a launch record (CQ-166). Output: the corrected list of observations
  - proves: F129-FR-001; F129-FR-018

## Phase 2: Setup and foundation (G1: projection, reducer, cursor, serialization)

- [x] T005 Create `packages/view/` with the folders of plan.md and an `index.ts` that exports only `project`, `reduce`, `renderView`, `renderLine`, `expiry`, `signature` and the types. Set its import rule to `@specstride/contracts` only and no Node built-in module (covers: all)
- [x] T006 [P] Schema of `specstride.view/1` in `@specstride/contracts` from `contracts/run-view.md`, with the bounds of the collections, and the closed sets of the section "Closed sets" of the spec (covers: F129-FR-007, F129-FR-035)
- [x] T007 [P] Requests to feature 100, written in the report and in `contracts/README.md`: the closed-set rows 243 to 250 of annex X §X.6 and the profile row 127 of annex X §X.7 were granted on 2026-09-30 and are cited, not requested again; the request that stays open is the schema of the view in `contracts/schemas/` (covers: F129-FR-034, F129-FR-035)
- [x] T008 [P] Key spellings confirmed by feature 110: `status.precompute` (row 127 of annex X §X.7), `status.staleEventSec`, `status.timelineRows`, `wait.pollSec`, `wait.timeoutSec`, with the defaults of the spec (covers: F129-FR-034)
- [x] T009 [P] Testkit samples in `packages/testkit`: a fake clock, a sample renderer that takes the JSON of a view and no file handle, and a second implementation of the read model that is registered from the test tree (covers: F129-FR-036)
- [x] T010 [P] Fixture logs: extract the primary event files of the runs of FX-01, FX-02, FX-03, FX-04, FX-11, FX-12, FX-13, FX-22, FX-23 and FX-28 from the second suite of the oracle (surface `events-primary`), and hand-make the logs with a torn last line, a gap in `seq`, a complete line that is not a record, an unknown event type, an unknown field and an unknown major, in `tests/characterization/129/logs/` (covers: F129-FR-004, F129-FR-005, F129-FR-036)
- [x] T011 [P] [US4] Characterization test CT-129-1 in tests/characterization/129/ct-01.test.ts: `project` has exactly the inputs of F129-FR-001, does no input or output and reads no clock (a call with a frozen clock and a fake file system that throws)
  - proves: F129-FR-001
  - fixture: FX-01
- [x] T012 [P] [US4] Characterization test CT-129-2 in tests/characterization/129/ct-02.test.ts: the prefix property, for every prefix of every fixture log, with the state files, observations and time fixed
  - proves: F129-FR-002; F129-SC-004
  - fixture: FX-01; FX-02; FX-03; FX-12; FX-13; FX-22
- [x] T013 [P] [US2] Characterization test CT-129-3 in tests/characterization/129/ct-03.test.ts: the cursor; a cached view plus the events after its cursor equals a projection from the first event; a shortened file, a wrong next `seq` and another run make the projection start again; two cursors do not consume each other's changes
  - proves: F129-FR-003
  - fixture: FX-13
- [x] T014 [P] [US4] Characterization test CT-129-4 in tests/characterization/129/ct-04.test.ts: a torn last line, a complete line that is no record, and a gap in `seq` (the diagnostics say so; nothing else changes)
  - proves: F129-FR-004
- [x] T015 [P] [US4] Characterization test CT-129-5 in tests/characterization/129/ct-05.test.ts: an event of a major outside the range is not folded, the view is `stale` with the reason `event-major-out-of-range`; unknown types and fields are ignored; a type without a row of the signal table fails the test
  - proves: F129-FR-005
- [x] T016 [P] [US4] Characterization test CT-129-6 in tests/characterization/129/ct-06.test.ts: canonical serialization; key order; equal bytes on two runs and on two operating systems (macOS `unverified`)
  - proves: F129-FR-006
  - fixture: FX-01; FX-03
- [x] T017 [P] [US4] Characterization test CT-129-7 in tests/characterization/129/ct-07.test.ts: schema id and major; a view of another major is refused with the message of F100-FR-049; an unknown field is ignored
  - proves: F129-FR-007
- [x] T018 [P] [US1] Characterization test CT-129-8 in tests/characterization/129/ct-08.test.ts: the cached view is ignored when older than the newest event, when its cursor does not match and when it is of another major; deleting it changes no output
  - proves: F129-FR-008
- [x] T019 [P] [US4] Characterization test CT-129-9 in tests/characterization/129/ct-09.test.ts: free text; redaction with the recorded version, control characters removed, size cap, mark of a cut field, a field dropped when the redactor cannot run, no physical path
  - proves: F129-FR-009
- [x] T020 Signal table and reducer in `packages/view/src/signals/` and `packages/view/src/reduce/`: the table as data, one function per signal, unknown types ignored (covers: F129-FR-002, F129-FR-005)
- [x] T021 `project` in `packages/view/src/index.ts`: the fold, the settle of the fields that come from files and observations, the cursor (covers: F129-FR-001, F129-FR-002, F129-FR-003)
- [x] T022 [P] Text safety in `packages/view/src/text/`: the injected redaction function, control characters, size cap, marks (covers: F129-FR-009)
- [x] T023 [P] Canonical serialization in `packages/view/src/serialize/` (covers: F129-FR-006, F129-FR-007)
- [x] T024 Event reader in `packages/cli/src/status/event-reader.ts`: the only reader of the event file; byte cursor; torn last line; skipped lines; gaps (covers: F129-FR-003, F129-FR-004, F129-FR-032)
- [x] T025 Cached view: the writer function `renderView` for the runtime and the validity rules for a reader, in `packages/view/src/` and `packages/cli/src/status/` (covers: F129-FR-008)

## Phase 3: User Story 1 - A new session learns the state of a run from files alone (P1) MVP

- [x] T026 [P] [US1] Characterization test CT-129-10 in tests/characterization/129/ct-10.test.ts: the position of the run in the view for each fixture; nulls where no event states a value; counts survive a resume
  - proves: F129-FR-010
  - fixture: FX-01; FX-13
- [x] T027 [P] [US1] Characterization test CT-129-11 in tests/characterization/129/ct-11.test.ts: every fact that the compatibility output of `status` prints for a scenario of FX-28 is in the view; the compatibility lines themselves are compared by feature 119
  - proves: F129-FR-011; F129-SC-009
  - fixture: FX-28
- [x] T028 [P] [US1] Characterization test CT-129-12 in tests/characterization/129/ct-12.test.ts: the table of liveness, five live states times six results of `probe`, the resting states, `created`, and a run in `starting` before and after the handshake limit
  - proves: F129-FR-012; F129-SC-005
  - fixture: FX-11
- [x] T029 [P] [US1] Characterization test CT-129-13 in tests/characterization/129/ct-13.test.ts: `stale` with the reason `heartbeat-and-events-old`, and with `event-major-out-of-range`; a quota pause with a live heartbeat is not stale
  - proves: F129-FR-013
- [x] T030 [P] [US1] Characterization test CT-129-14 in tests/characterization/129/ct-14.test.ts: `launch-abandoned`, with and without a lease that carries the launch nonce, before and after the handshake limit
  - proves: F129-FR-014
- [x] T031 [P] [US1] Characterization test CT-129-15 in tests/characterization/129/ct-15.test.ts: `status` and `wait` write no file: the hash of every file of the control plane is equal before and after, for every fixture state
  - proves: F129-FR-015; F129-SC-005
  - fixture: FX-12; FX-13
- [x] T032 [P] [US1] Characterization test CT-129-24 in tests/characterization/129/ct-24.test.ts: `status` resolves the current run, prints from the view only, exits 0 with no run and 1 with no state, and starts no process
  - proves: F129-FR-024
- [x] T033 [P] [US1] Characterization test CT-129-25 in tests/characterization/129/ct-25.test.ts: default output; the first line, the item lines with `need` and `next` quoted as in JSON (a command with a flag stays one value), the caps of 120 and 420 bytes, the last line `more=<n>`, no echo of free text, compatibility output under `parity`
  - proves: F129-FR-025
  - fixture: FX-28
- [x] T034 [P] [US1] Characterization test CT-129-26 in tests/characterization/129/ct-26.test.ts: `status --json` prints the view in the canonical serialization, bounded, with the counts of what was cut
  - proves: F129-FR-026
- [x] T035 [P] [US1] Characterization test CT-129-27 in tests/characterization/129/ct-27.test.ts: `status --line` grammar, the fixed order of keys, at most 170 bytes, the drop order, `run`, `st` and `validUntil` intact, nothing printed under `parity`
  - proves: F129-FR-027
  - fixture: FX-28
- [x] T036 [P] [US1] Characterization test CT-129-37 in tests/characterization/129/ct-37.test.ts: re-attachment; for each of the ten written states and `dead`, `stale`, `launch-abandoned`, delete every process and run `status` in an empty environment; the state, the phase and the attention kinds equal the row; the time on 100,000 events
  - proves: F129-SC-001
  - fixture: FX-01; FX-03; FX-11; FX-12; FX-13
- [x] T037 [P] [US1] Characterization test CT-129-45 in tests/characterization/129/ct-45.test.ts: under the `parity` profile `status` takes its facts from the view on every scenario of FX-28 and `status --line`, `status --json` and `wait` print 0 bytes
  - proves: F129-SC-009
  - fixture: FX-28
- [x] T038 Position and phase list in `packages/view/src/reduce/` (covers: F129-FR-010, F129-FR-011)
- [x] T039 [P] Liveness table, `dead`, `stale`, `launch-abandoned` in `packages/view/src/conditions/` (covers: F129-FR-012, F129-FR-013, F129-FR-014, F129-FR-015)
- [x] T040 [P] State readers and probes in `packages/cli/src/status/state-readers.ts` and `probes.ts`: run record, terminal record, pause record, the newest launch record, supervision record, lease probe through EP-13, and the handshake limit in the form T004 confirms (covers: F129-FR-001, F129-FR-012, F129-FR-024)
- [x] T041 `status` in `packages/cli/src/status/status.ts` and the output functions in `output.ts`: text, `--json`, `--line`, exit codes, compatibility output through the presenter interface of annex G §G.10 of feature 100 (implemented by feature 119) from the same view (covers: F129-FR-024, F129-FR-025, F129-FR-026, F129-FR-027)
- [x] T042 [P] Status line renderer in `packages/view/src/line/` with the drop order (covers: F129-FR-027)
- [x] T043 [P] Elapsed time and the suggested seconds in `packages/view/src/reduce/progress.ts` (covers: F129-FR-010, F129-FR-027)

## Phase 4: User Story 2 - A host waits without spending context (P1)

- [x] T044 [P] [US2] Characterization test CT-129-29 in tests/characterization/129/ct-29.test.ts: `wait --until-change`; nothing while nothing changes; one line on a change; exit codes 0, 1 and 3; the time limit; the poll interval; a call without `--until-change`; nothing under `parity`; two cursors
  - proves: F129-FR-029
  - fixture: FX-13
- [x] T045 [P] [US2] Characterization test CT-129-30 in tests/characterization/129/ct-30.test.ts: the change signature; equal exactly when its fields are equal; progress inside a phase attempt does not change it; the token of 8 characters
  - proves: F129-FR-030
- [x] T046 [P] [US2] Characterization test CT-129-31 in tests/characterization/129/ct-31.test.ts: the byte check; 0 bytes unchanged, at most one line of 170 bytes changed, at 2.8 bytes per token; the build fails on a breach
  - proves: F129-FR-031
- [x] T047 [P] [US2] Characterization test CT-129-38 in tests/characterization/129/ct-38.test.ts: silence; a run of 10,000 events that change no field of the signature prints 0 bytes; one appended rejection prints one line of at most 170 bytes; the same for each of the nine kinds of attention item
  - proves: F129-SC-002
  - fixture: FX-02; FX-13
- [x] T048 Change signature and cursor token in `packages/view/src/signature/` (covers: F129-FR-003, F129-FR-030)
- [x] T049 `wait` in `packages/cli/src/status/wait.ts`: the poll loop, the comparison, the single line with `cur=`, the exit codes, the time limit (covers: F129-FR-029, F129-FR-031)
- [x] T050 [P] Byte check in the build: fixtures of the budget test and the check on bytes (covers: F129-FR-031)

## Phase 5: User Story 3 - What needs the consumer is shown, with what to do (P1)

- [x] T051 [P] [US3] Characterization test CT-129-17 in tests/characterization/129/ct-17.test.ts: the nine kinds of attention item, their keys, their order, their fixed next commands, and that an item disappears when its cause is gone
  - proves: F129-FR-017
- [x] T052 [P] [US3] Characterization test CT-129-18 in tests/characterization/129/ct-18.test.ts: an item for a blocked run names what the run needs; `source-changed` names the file and the command with its flag; a refused `resume` shows as `blocked-on-human`; an unknown blocked reason stays blocked
  - proves: F129-FR-018
  - fixture: FX-13
- [x] T053 [P] [US3] Characterization test CT-129-19 in tests/characterization/129/ct-19.test.ts: the item `quota-pause` with the role, the class, the resume time and the ceiling; absent without a pause record
  - proves: F129-FR-019
- [x] T054 [P] [US3] Characterization test CT-129-21 in tests/characterization/129/ct-21.test.ts: processes that hold the run token of a run without an engine are listed and raise the item; an `adoptable` process is listed without one; nothing is ended
  - proves: F129-FR-021
  - fixture: FX-11; FX-22
- [x] T055 Attention items in `packages/view/src/attention/` with the fixed table of next commands (covers: F129-FR-017, F129-FR-018, F129-FR-019, F129-FR-021)
- [x] T056 [P] Process observation in `packages/cli/src/status/probes.ts`: the registry and the search of the process table for the run token; report only (covers: F129-FR-021)

## Phase 6: User Story 4 - A renderer takes the view and opens no file (P2)

- [x] T057 [P] [US4] Characterization test CT-129-16 in tests/characterization/129/ct-16.test.ts: the lane table; every row L-01 to L-08 on a fixture; the rule id on every card; a micro-loop cycle owns no lane; `dead` and `stopped` in `blocked`; a renderer that hides lanes derives none
  - proves: F129-FR-016
  - fixture: FX-01; FX-03; FX-12; FX-22
- [x] T058 [P] [US4] Characterization test CT-129-32 in tests/characterization/129/ct-32.test.ts: one reader; the static check finds no renderer or command that imports the event reader or a state reader in place of the view; the sample renderer is given no file handle; a failing renderer prints one line that names `status --json`
  - proves: F129-FR-032
- [x] T059 [P] [US4] Characterization test CT-129-35 in tests/characterization/129/ct-35.test.ts: closed sets; every member; the rule for an unknown value; an unknown state is `unknown` with the item `unknown-state`
  - proves: F129-FR-035
- [x] T060 [P] [US4] Characterization test CT-129-36 in tests/characterization/129/ct-36.test.ts: the conformance suite of EP-09; golden views, the prefix property, the table of liveness, the sample renderer and the canary test, run on the shipped implementation and on the second one registered from the test tree
  - proves: F129-FR-036
  - fixture: FX-01; FX-02; FX-03; FX-04; FX-11; FX-12; FX-13; FX-22; FX-23
- [x] T061 [P] [US4] Characterization test CT-129-39 in tests/characterization/129/ct-39.test.ts: one read model; 0 imports of the event reader or a state reader in the doctor, `status`, `wait`, the shim and the sample renderer; every lane, item and level of every golden view is rendered from the JSON alone
  - proves: F129-SC-003
- [x] T062 [P] [US4] Characterization test CT-129-40 in tests/characterization/129/ct-40.test.ts: golden views are equal byte for byte on two projections, and the prefix property holds for 100 per cent of the prefixes
  - proves: F129-SC-004
  - fixture: FX-01; FX-02; FX-03; FX-04; FX-12; FX-13
- [x] T063 Lane table as data and its use of the injected evaluator in `packages/view/src/lanes/` (covers: F129-FR-016)
- [x] T064 [P] Import-boundary rules for the renderers and the commands in the build (covers: F129-FR-032)
- [x] T065 Conformance suite of EP-09 in `packages/testkit/conformance/view/` (covers: F129-FR-036)

## Phase 7: User Story 5 - A session that starts later reads a precomputed line and knows when it is stale (P2)

- [x] T066 [P] [US5] Characterization test CT-129-28 in tests/characterization/129/ct-28.test.ts: the precomputed line; `validUntil` equal to that of the lease for a live state; `none` for a resting state; rewritten before expiry; a line past `validUntil` gives the answer "unknown" that names `status`
  - proves: F129-FR-028
- [x] T067 [P] [US5] Characterization test CT-129-42 in tests/characterization/129/ct-42.test.ts: no line exceeds 170 bytes on any fixture; the longest possible line is cut in the fixed order with `run`, `st` and `validUntil` intact; a live line has the `validUntil` of its lease
  - proves: F129-SC-006
  - fixture: FX-01; FX-13
- [x] T068 Function `renderLine` and `expiry` in `packages/view/src/line/` for the runtime and the host hook shim of feature 113, and the writer call for `run:<runId>:status-line` in the runtime package through the port that feature 122 provides (covers: F129-FR-028)

## Phase 8: User Story 6 - Spend and parallel hours are shown when they exist (P3)

- [x] T069 [P] [US6] Characterization test CT-129-20 in tests/characterization/129/ct-20.test.ts: budget rows; cost classes; a notional cost never added to a metered cost; no alert of the read model's own; the level is the engine's, plus `over`; the item `budget-alert`; the quota of a row
  - proves: F129-FR-020
  - fixture: FX-23
- [x] T070 [P] [US6] Characterization test CT-129-22 in tests/characterization/129/ct-22.test.ts: with parallel units on the group `parallel` with wall hours and agent hours (the sum of the passes); off: no field of the layer
  - proves: F129-FR-022
- [x] T071 [P] [US6] Characterization test CT-129-23 in tests/characterization/129/ct-23.test.ts: the strategy is a field of the view and the key of the line, present when the run record pins a strategy
  - proves: F129-FR-023
- [x] T072 [P] [US6] Characterization test CT-129-44 in tests/characterization/129/ct-44.test.ts: with parallel units off the view holds 0 fields of the layer on every fixture; on, both hour figures, and the agent hours equal the sum of the passes
  - proves: F129-SC-008
- [x] T073 Budget rows and levels in `packages/view/src/budget/` (covers: F129-FR-020)
- [x] T074 [P] The group `parallel` and the strategy in `packages/view/src/reduce/` (covers: F129-FR-022, F129-FR-023)

## Phase 9: Polish and cross-cutting

- [x] T075 Characterization test CT-129-33 in tests/characterization/129/ct-33.test.ts: no network listener, no route and no write path in the read model, `status` or `wait`; a command ends by its own limit and leaves no process; the view holds no content, no physical path and no secret
  - proves: F129-FR-033
- [x] T076 [P] Characterization test CT-129-34 in tests/characterization/129/ct-34.test.ts: the options; the defaults, the values under `parity`, profile row 127 (`status.precompute`); under `parity` the runtime writes neither the cached view nor the line
  - proves: F129-FR-034; F129-FR-008; F129-FR-028
- [x] T077 [P] Characterization test CT-129-41 in tests/characterization/129/ct-41.test.ts: for the table of derived conditions (34 cases) the result is as the table says and no file of the control plane changed
  - proves: F129-SC-005
  - fixture: FX-11; FX-12
- [x] T078 [P] Characterization test CT-129-43 in tests/characterization/129/ct-43.test.ts: canary strings planted in a title, in feedback, in a blocked question, in a file name and in the summary of a tool (an escape sequence, a markup tag, a registered secret, a token pattern); none reaches the view unredacted or with a control character; no physical path
  - proves: F129-SC-007; F129-FR-009; F129-FR-033
- [x] T079 [P] Import-boundary rules that forbid `node:net`, `node:http`, `node:https` and any listener in `packages/view/` and in `packages/cli/src/status/`, and the time limit of `wait` (covers: F129-FR-033)
- [x] T080 Options and the profile row in the configuration schema through feature 110 and the profile data through feature 100 (covers: F129-FR-034)
- [x] T081 Second suite (profile `parity` with row 1 set to `micro`), a run of CT-129-23 and CT-129-25 and no new test: confirm that `status` in compatibility output is unchanged with the layer on and that the view holds the strategy
  - proves: F129-FR-023; F129-FR-025
  - fixture: FX-01; FX-28
- [x] T082 Run `python3 docs/ecosystem/check-traceability.py` and repair the lines that name this feature
- [x] T083 Report to feature 100 and to feature 111 the requests of the analyze report that stay open: the schema of the view, the fields of a launch record, the fields of the cursor. The closed-set rows (243 to 250 of annex X §X.6) and the profile row 127 of annex X §X.7 were granted on 2026-09-30 and need no request

## Dependencies

Phase 1 first (T001 and T002 need no code). Phase 2 before all others; inside it the tests are written before the tasks they test. US1 needs the foundation. US2 needs the change signature, which needs US1's view. US3 needs the conditions of US1. US4 needs the lane table and the conformance suite, which need the foundation. US5 needs the line renderer of US1. US6 needs the reducer. Polish last. The signal table is frozen after T003, and the list of observations after T004. T002 must be done, or its result recorded as `unverified`, before F129-FR-028 is frozen.
