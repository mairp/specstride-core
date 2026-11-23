# Tasks: Stream seam and invocation

**Input**: `specs/126-stream-seam-and-invocation/` (spec.md, plan.md, data-model.md, contracts/)

Tests are required: parity and characterization tests are tasks, not options. Format: `[ID] [P?] [Story] Description`. Fixture families are those of feature 141 (FX-26, FX-01, FX-18, FX-20).

Package: `@specstride/harness` (`packages/harness/src/stream/`, `packages/harness/src/invocation/`). Parity tests are in `tests/parity/126/`, own tests in `packages/harness/test/`, conformance cases and the sample in `packages/testkit/src/conformance/EP-02/` and `packages/testkit/src/samples/EP-02/`.

Paid tasks: T001 and T024. A paid task calls a model, is logged, is never run by the specifier, and is never a precondition of another task or of a test. A test whose fixture is absent is a skip with its reason.

## Phase 1: Setup

- [ ] T002 Create the directories `packages/harness/src/stream/` and `packages/harness/src/invocation/` in the package `@specstride/harness`; no new package. Deliver the four schema files of `contracts/schemas/` to `@specstride/contracts`
- [ ] T003 [P] Collect the recorded as-is input streams of FX-26 (Claude, ten prime streams) from the oracle, unchanged, into `tests/parity/126/streams/`

## Phase 2: Foundation (blocks all stories)

- [ ] T004 Bind the closed sets this feature owns from the data of `@specstride/contracts` (annex X §X.6, rows 38 and 169 to 177: kinds of record, modes, signals, route reasons, diagnostic codes, statuses, reason codes, decisions, canonical tool names, result sources) with the unknown-value rule of each; no second list of members is written, and the as-is texts of the route reasons are those of F126-FR-014; F126-FR-002
- [ ] T005 Implement the registry with the validation of F126-FR-001
- [ ] T006 Implement the identity, the path-safe components and the id generator; F126-FR-026
- [ ] T007 Implement the atomic and the exclusive writers used by the artifacts; F126-FR-032

## Phase 3: US1 Every harness reads the same way

- [ ] T008 [P] [US1] Conformance test and parity tests PT-126-C-149-records and PT-126-C-149-observability: replay every recorded stream through its reader (F126-FR-002, F126-FR-006, F126-FR-007)
  - proves: C-149
  - fixture: FX-26
- [ ] T009 [P] [US1] Parity test PT-126-C-194-registry in tests/parity/126/registry.test.ts
  - proves: C-194; C-146
  - fixture: FX-26
- [ ] T010 [P] [US1] Parity test PT-126-C-154-claude-reader in tests/parity/126/claude-reader.test.ts
  - proves: C-154; C-151
  - fixture: FX-26
- [ ] T011 [P] [US1] Parity test PT-126-C-194-tool-target and PT-126-C-194-evidence-writing
  - proves: C-194
  - fixture: FX-26
- [ ] T012 [P] [US1] Parity test PT-126-C-191-synthesized and PT-126-C-191-duplicate-terminal
  - proves: C-191; C-192; C-193
  - fixture: FX-26
- [ ] T013 [US1] Implement the six records, the `claude` reader, the mapping reader and the text reader; F126-FR-002 to F126-FR-010
- [ ] T014 [P] [US1] Own test CT-126-1: a sample reader given as data only, from `packages/testkit/src/samples/EP-02/`, passes the conformance suite of `packages/testkit/src/conformance/EP-02/` and no core file differs
  - proves: F126-FR-007
- [ ] T015 [P] [US1] Parity test PT-126-C-164-terminal-decides (prime provider error with exit 0)
  - proves: C-164
  - fixture: FX-26

## Phase 4: US2 A stream that lies or stops

- [ ] T016 [P] [US2] Own test CT-126-2: tool output that imitates a terminal record, a cost figure or a tool event gives no record; a line over the size cap and over the rate cap is dropped with `stream.diagnostic`
  - proves: F126-FR-018
- [ ] T017 [P] [US2] Parity test PT-126-C-151-truthful (missing terminal, D-48 kept)
  - proves: C-151
  - fixture: FX-26
- [ ] T018 [P] [US2] Parity test PT-126-C-154-ingress, PT-126-C-154-pass-through and PT-126-C-154-faults (D-54 kept; faults never fail a pass)
  - proves: C-154; C-150
  - fixture: FX-26
- [ ] T019 [P] [US2] Parity test PT-126-C-055-fallbacks (the fallbacks and the announcements)
  - proves: C-055; C-053; C-058
  - fixture: FX-26
- [ ] T020 [US2] Implement the tap: line loop, pass-through, faults, caps, announcements, the ingress of stream text (redaction and cut through the redactor port); F126-FR-011 to F126-FR-019

## Phase 5: US3 Every pass is accounted for

- [ ] T021 [P] [US3] Own test CT-126-4: a pass killed mid-stream keeps its partial usage and ends with `usageComplete=false`; a harness with no usage gives `usage.unavailable`
  - proves: F126-FR-023
- [ ] T022 [P] [US3] Own tests CT-126-3, CT-126-5, CT-126-6: session and parent session on every record; tool categories and times; two streams read at once carry `workerId` and `wseq`
  - proves: F126-FR-022; F126-FR-024; F126-FR-025
- [ ] T023 [US3] Implement usage increments, deduplication, session and tool facts, and the share of accounted passes per run; F126-FR-022 to F126-FR-025, F126-FR-036
- [ ] T024 [US3] PAID, must be logged, not run by the specifier, precondition of no task and of no test: the live part of experiment X0, 20 live passes, 5 of them killed on purpose. Pass mark: 100 per cent of passes accounted for, totals within 2 per cent. Measures F126-SC-001 on a live harness. The part of X0 with stub agents killed mid-pass is unpaid and is T021 and T025
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [ ] T025 [P] [US3] Own test CT-126-7: the share of passes with complete usage or an explicit unavailable is reported per run; a killed pass with its partial usage and `usageComplete=false` counts as accounted for
  - proves: F126-FR-036

## Phase 6: US4 An invocation is reconciled once

- [ ] T026 [P] [US4] Parity test PT-126-C-164-precedence (each reason code and status) and PT-126-C-165-result-record
  - proves: C-164; C-165; C-162
  - fixture: FX-18
- [ ] T027 [P] [US4] Parity test PT-126-C-159-decision (six output lines, breaker fields, exit codes 0 and 1) and PT-126-C-157-result-event
  - proves: C-155; C-156; C-157; C-158; C-159; C-160; C-161; C-163
  - fixture: FX-18; FX-20
- [ ] T028 [P] [US4] Parity test PT-126-C-166-identity, PT-126-C-166-record, PT-126-C-058-legacy-path
  - proves: C-166; C-051; C-056; C-058
  - fixture: FX-01
- [ ] T029 [P] [US4] Parity test PT-126-C-056-layout, PT-126-C-056-producer-status, PT-126-C-152-provider-terminal, PT-126-C-152-sinks through the layout table
  - proves: C-152; C-056
  - fixture: FX-26
- [ ] T030 [US4] Implement the artifacts, reconciliation, finalization and the decision; F126-FR-026 to F126-FR-035; the `agent_result` of the finalization goes through the one event writer outside the compatibility projection (CQ-228)

## Phase 7: US5 The oracle sees the old stream; retention; aliases

- [ ] T031 [P] [US5] Parity test PT-126-C-153-lines and PT-126-C-149-projection on the compatibility projection (N-12, N-13, N-14)
  - proves: C-153; C-149; C-022
  - fixture: FX-26; FX-01
- [ ] T032 [P] [US5] Parity test PT-126-C-147-context and PT-126-C-148-aliases (the as-is variable names through the alias table)
  - proves: C-148; C-147; C-052
  - fixture: FX-26
- [ ] T033 [P] [US5] Parity test PT-126-C-166-retention (active skipped; raw first, record second, result never; 100 sweeps of a fixture tree remove 0 active invocations and 0 result records, F126-SC-007)
  - proves: C-166
  - fixture: FX-26
- [ ] T034 [P] Own test CT-126-8: retained streams contain no secret; planted canaries in stream text do not reach any sink
  - proves: F126-FR-038; F126-FR-019
- [ ] T035 [US5] Implement retention and the aliases, the file mode and the redacted source of a retained stream, and what F126-FR-021 asks of this feature (the events of the seam carry what the projection rows of feature 144 render; a bad as-is line is rejected on reading); F126-FR-011, F126-FR-020, F126-FR-021, F126-FR-037, F126-FR-038
- [ ] T036 Run the second suite (profile `parity` with the micro-loop layer on) and check that no stream fixture changes; F126-SC-003

## Phase 8: Repairs after the cross-feature review (2026-09-30)

- [ ] T037 [P] [US1] Own test CT-126-9 in packages/harness/test/no-harness-name.test.ts: (a) a static test finds no id, name or label of a harness in a condition of the sources of `packages/harness/src/stream/` and `packages/harness/src/invocation/`; (b) a sample harness that holds the data of a Wave 1 harness under another id gives the same records, the same route, the same path (legacy or correlated) and the same artifacts; (c) a format row with `trackTerminal` makes the pass correlated and gives the tap the provider-terminal destination, and a row without it does not
  - proves: F126-FR-039; F126-FR-008; F126-FR-012; F126-FR-031
- [ ] T038 [P] [US2] Own test CT-126-10 in packages/harness/test/replacement-tap.test.ts: a replacement tap executable is started from an argument list with no shell and with the stream as its only standard input; a stub that cannot be started, one that exits 3 and one that never ends do not fail the pass, and the exit is in `parser_exit_code` of the producer status; the process is entered as `owned` and is gone when the pass has ended
  - proves: F126-FR-011
- [ ] T039 [P] [US2] Own test CT-126-11 in packages/harness/test/failed-append.test.ts: with a stub writer whose local append fails for one event, no sink is called for that event, the next written event is preceded by `event.dropped`, and the tap and the pass do not fail; with a stub sink, every event received holds `ts`, `type` and `seq` and equals the local line
  - proves: F126-FR-016; F126-FR-020
- [ ] T042 [P] [US4] Own test CT-126-12 in packages/harness/test/result-event-sinks.test.ts: outside the compatibility projection, with a stub writer and a stub sink, the finalization writes one `agent_result` through the one event writer and the stub sink receives it after the primary write, whole with `ts`, `type` and `seq`; in the compatibility projection the as-is event goes to the local destination only and the stub sink receives no as-is copy from this process; an empty destination skips it; a second finalization writes no second event (CQ-228)
  - proves: F126-FR-035
- [ ] T040 [US1] Implement the conditions of F126-FR-039 as data read from the resolved registry (route, `trackTerminal`, the dialect row); remove no as-is behaviour under the `parity` profile; F126-FR-008, F126-FR-012, F126-FR-031, F126-FR-039
- [ ] T041 [US2] Implement the start of a replacement tap executable and the hand-over of events to the one event writer without a sink call of the tap's own; F126-FR-011, F126-FR-016, F126-FR-020
- [ ] T043 [P] [US1] Own test CT-126-13 in packages/harness/test/sse-readers.test.ts: hand-written SSE streams from the providers' published formats (marked `unverified`), comment lines, multi-line `data:`, `[DONE]`, a `ping`, an error event and a cut stream; expect the records, one `text` per content block, null cost, a `missing_terminal` on the cut stream, and a listing under the `parity` profile of `claude` then `prime-v3` only
  - proves: F126-FR-040; F126-FR-013
- [ ] T044 [US1] Implement the SSE framing reader, the data rows `sse-openai` and `sse-anthropic`, the registration of `claude`, `text`, `sse-openai`, `sse-anthropic`, and the row option `listedAsIs`; F126-FR-001, F126-FR-007, F126-FR-013, F126-FR-040
- [ ] T045 [US4] Implement in `packages/harness/src/invocation/` the function interface of `@specstride/contracts` through which the engine calls reconciliation, finalization and the retention sweep (F100-FR-237 as proposed in `analyze-report.md`, P1); where feature 100 has not declared the type yet, the task is blocked, never replaced by an import of `@specstride/harness` from the core; F126-FR-033 to F126-FR-035, F126-FR-037
- [ ] T001 [US1] PAID, must be logged, not run by the specifier, precondition of no task and of no test: capture one live stream of the Claude CLI (a short pass, and one pass killed mid-stream) into `tests/parity/126/streams/claude-live/`; record the CLI version and the date as the pin. Resolves the `unverified` status of F126-FR-003, F126-FR-022, F126-FR-023. Until it is done, the three requirements stay `unverified`, and a test that would replay the live capture is a skip with the reason "live capture absent"; every other test runs on the recorded streams of FX-26 and on stub agents
  - out-of-band (owner ruling of 2026-09-30): the paid part (a live call or capture that costs money) is never run and never faked here. Do the hermetic part on Linux, and record the paid part (a live call or capture that costs money) as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.

## Dependencies

No task waits for a paid task: T001 and T024 are paid, are run by a person who logs them, and nothing depends on them. T002 to T007 before every story. Stories US1 to US4 can proceed in parallel after Phase 2; US5 needs the tap (T020) and the artifacts (T030). T037 to T039 are written before T040 and T041. T042 is written before T030. T043 before T044. T045 after T030 and after feature 100 declares the interface of F100-FR-237. Parity tests are written before their implementation tasks. A test whose fixture is absent is a skip with its reason.

Other features: the replays of the ten prime streams (in T008 and T015), and the `prime-v3` row in T009 and in the listing of T031, need the JSONL reader that feature 138 registers in this registry (its task T038); until it is registered each of them is a skip with the reason "reader of feature 138 not registered", never a pass. T031 compares the compatibility projection, which the sink of feature 144 renders (F126-FR-021); without that sink it is a skip with its reason. The `unverified` status of F126-FR-010 is settled by the captures of feature 134 (its dialect row, F134-FR-023), not by a task here.
