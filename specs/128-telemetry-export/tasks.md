---
description: "Task list of feature 128-telemetry-export"
---

# Tasks: Telemetry export (feature 128)

**Input**: Design documents from `specs/128-telemetry-export/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks. A test task is written before the task it tests and must fail before that task is done.

**Format**: `[ID] [P?] [Story] Description`. A test task carries `proves:`; a parity test also `fixture:` and `surfaces:`. An implementation task carries `covers:`.

**Stories**: US1 a default run sends nothing; US2 traces show a run with its prompts; US3 no secret reaches a collector; US4 a dead collector changes nothing; US5 old payloads and old dashboards under the profile; US6 the doctor shows what leaves the machine.

**Inherited work**: the first task is a capture: the reference payloads of the two shippers at the stub sink, and the behaviour of Lisa's exporter as extracted. No task is a paid probe and no task calls a model. The canary test on both sinks is a release condition (T066). The end-to-end test against a real collector is skipped, with its reason, where no collector is at hand.

**Order**: phases follow dependencies, not priority. Phase 5 (US5, P2) comes before Phases 6 and 7 (US2 and US3, P1) because the span builder and the traces request (T053, T055) post through the OTLP request and acceptance code of T048, and content (T061 to T067) goes on those spans. Phase 4 (US4) comes before Phase 5 because the Loki sink and the OTLP logs of T042 and T048 fill the delivery record of T030.

## Phase 1: Setup

- [x] T001 Capture: run the two shippers of the baseline `9cab15d` against the telemetry sink stub of feature 141 for the scenarios `loki-payload`, `otlp-payload` and `sink-down` of FX-31, with the fixture events of FX-01, and store the payloads, unmodified and with the baseline's licence notice, under tests/parity/128/reference/; capture the behaviour of `packages/otel` of Lisa at `363e6a3` (labels, logfmt, OTLP shapes, `traceparent`, delta metrics) as recorded expectations under tests/characterization/128/reference/
  - covers: F128-FR-035
  - fixture: FX-31
- [x] T002 Create the directory of the exporter, packages/observability/src/export/, in the package `@specstride/observability` (layer L1, owners 111, 128 and 144 in the package graph of feature 100; it may import `@specstride/contracts` and `@specstride/kernel` only). Where the package does not exist yet, create packages/observability/ with `package.json` (no install script), `tsconfig.json` (strict) and a test script that uses the runner Node ships; where it exists, add nothing to its dependencies
  - covers: F128-FR-008
- [x] T003 [P] Copy `specs/128-telemetry-export/contracts/*.tsv` and the schema into packages/observability/data/export/ and add the consistency test of `contracts/README.md` (every scope, metric, key and form has a requirement, and the reverse) in packages/observability/test/export/data-consistency.test.ts
  - covers: F128-FR-009; F128-FR-014; F128-FR-030
- [x] T004 [P] Check the keys of `contracts/config-keys.tsv` against the key list of feature 110 and the rows 16, 42, 46 and 97 to 106 of annex X §X.7 (spelling, default, value under `parity`), and the seven environment aliases against §K.8 of feature 110, and write every difference into packages/observability/data/export/README.md (a note; no file of another feature is edited)
  - covers: F128-FR-010

## Phase 2: Foundational

- [x] T005 Characterization test CT-128-11 (Lisa's exporter as extracted: best-effort never throws; low-cardinality labels; OTLP built by hand; delta metrics; `traceparent` version 00, ids never all zeros, malformed inbound header ignored) in tests/characterization/128/lisa-exporter.test.ts
  - proves: F128-FR-035
  - fixture: FX-31
- [x] T006 Extract `loki.ts`, `otlp.ts`, `metrics.ts` and `tracer.ts` of Lisa at `363e6a3` into packages/observability/src/export/ as source with the licence notice, so that T005 passes on the extracted code, then rewrite them against the spec in the tasks that follow
  - covers: F128-FR-035
- [x] T007 [P] Test PT-128-C-179-logfmt (one encoder for both sinks: null omitted, booleans, numbers, newline to space, quoting and escaping, dotted keys for nested records) in packages/observability/test/export/logfmt.test.ts
  - proves: C-179; C-186; B-2288; B-2323
  - fixture: FX-31
  - surfaces: telemetry
- [x] T008 Implement the encoder in packages/observability/src/export/forms/logfmt.ts
  - covers: F128-FR-022
- [x] T009 [P] Test CT-128-14 (the two forms of a payload: the form follows `compat.legacyEvents`; the three names that the exporter holds itself, `api_request` from `stream.result`, `tool_use` from `tool.call` and `gate` as the name under which `verdict.recorded` feeds the old metric, with no event named `gate` shipped from a run; in the as-is form an event that projects to nothing is not shipped, opens no span and feeds no old metric; the names come from the table of the compatibility projection) in packages/observability/test/export/forms.test.ts
  - proves: F128-FR-009
- [x] T010 Implement the forms in packages/observability/src/export/forms/forms.ts, reading `data/payload-forms.tsv` and the table of the compatibility projection given in the context of `open`
  - covers: F128-FR-009
- [x] T011 [P] Tests PT-128-C-174-request-limits and PT-128-C-182-request-limits (time limit 2500 ms; body bound 3145728 bytes; a larger batch split into ordered requests; metrics and traces unsplit; flush interval; 0 flushes at every event; the six `RALPH_*` aliases of §K.8 of feature 110, with the two time limits converted from decimal seconds to milliseconds) in packages/observability/test/export/request-limits.test.ts
  - proves: C-174; C-182; B-2275; B-2276; B-2310; B-2311
  - fixture: FX-31
  - surfaces: telemetry
- [x] T012 Implement the request code, the batch splitter, the buffer and the flush interval in packages/observability/src/export/delivery/request.ts and packages/observability/src/export/delivery/buffer.ts
  - covers: F128-FR-010; F128-FR-008
- [x] T013 [P] Conformance test CT-128-9 (the EP-08 suite on both sinks: a slow sink, a throwing sink, a dead collector leave the exit code and the event file unchanged; a full buffer drops the newest events with a record; unknown types and fields are ignored; the sample sink is registered from the test tree) in tests/conformance/eventsink/exporters.test.ts
  - proves: F128-FR-008; C-022; C-200; B-2416; B-2417; B-2418; B-2420
  - fixture: FX-31
  - surfaces: exit, events, telemetry
- [x] T014 Register the two sinks through the registration call of EP-08 and implement `open`, `write`, `flush` and `close` in packages/observability/src/export/index.ts
  - covers: F128-FR-008; F128-FR-011; F128-FR-020

## Phase 3: User Story 1 - A default run sends nothing (P1)

- [x] T015 [P] [US1] Parity test PT-128-028FR022-off-by-default (default configuration: no exporter, no connection, no file of a sink; each sink on by its own switch; only the literal `true`; default addresses) in tests/parity/128/off-by-default.test.ts
  - proves: 028 FR-022; B-0041; B-0043
  - fixture: FX-31
  - surfaces: exit, stderr, telemetry, state
- [x] T016 [P] [US1] Test CT-128-22 (a run with default configuration opens 0 connections for telemetry, counted by an instrumented socket layer) in tests/e2e/128/default-silent.test.ts
  - proves: F128-FR-001
- [x] T017 [US1] Implement enablement and the default addresses in packages/observability/src/export/config.ts
  - covers: F128-FR-001; F128-FR-002
- [x] T018 [P] [US1] Parity test PT-128-C-006-engine-flags (`--telemetry`, `--loki-url`, `--otel`, `--otel-url`; independence of the two switches) in tests/parity/128/engine-flags.test.ts
  - proves: C-006; B-0025; B-0026; B-0027; B-0028
  - fixture: FX-31
  - surfaces: exit, stderr, telemetry, state
- [x] T019 [US1] Make packages/observability/src/export/config.ts take the enablement and the addresses from the resolved keys only, so that the four flags reach the exporter through the short-flag rows of feature 110 at rank 2 (proposal U1 of `analyze-report.md`); the package parses no argument list, since the core never imports it. Record in packages/observability/data/export/README.md, beside the notes of T004, whether feature 110 holds the rows of U1 yet
  - covers: F128-FR-003
- [x] T020 [P] [US1] Parity test PT-128-C-007-env-aliases (the as-is variable names as aliases, with `SPECSTRIDE_OTEL_TRACES`; the resolved values handed to child processes under `parity`; an inbound trace id passed untouched and never invented; `SPECSTRIDE_OTEL_STATE_DIR` accepted with no effect and a launch message) in tests/parity/128/env-aliases.test.ts
  - proves: C-007; B-0041; B-0042; B-0043; B-0044; B-0063; B-0065; B-2338
  - fixture: FX-31
  - surfaces: exit, stderr, transcript, telemetry
- [x] T021 [US1] Implement the alias entries and the export of resolved values in packages/observability/src/export/aliases.ts
  - covers: F128-FR-004
- [x] T022 [P] [US1] Parity tests PT-128-C-051-pass-loop-flags, PT-128-C-052-pass-loop-flags and PT-128-C-058-pass-loop-flags (`-j` alone enables Loki only; a URL flag enables its sink and only those sinks ship; the defaults of the addresses; no exit 1 for a missing module) in tests/parity/128/pass-loop-flags.test.ts
  - proves: C-051; C-052; C-058; B-0476; B-0482; B-0483; B-0493; B-0494; B-0672
  - fixture: FX-31
  - surfaces: exit, stderr, transcript, telemetry
- [x] T023 [US1] Check that packages/observability/src/export/config.ts applies no combination rule of its own: the rule of F128-FR-005 is a flag rule of feature 110 (proposal U1 of `analyze-report.md`), and T022 proves the resolved keys it gives; record in packages/observability/data/export/README.md whether feature 110 holds the rule yet
  - covers: F128-FR-005
- [x] T024 [P] [US1] Parity test PT-128-C-013-engine-to-pass-loop (the flags the engine hands the pass loop; the stream facts reach every enabled sink; both sinks receive the same stream facts; no second pipeline) in tests/parity/128/engine-to-pass-loop.test.ts
  - proves: C-013; B-0316; B-0753
  - fixture: FX-31
  - surfaces: transcript, telemetry
- [x] T025 [US1] Implement the hand-over of the flags and the stream facts in packages/observability/src/export/streamfacts.ts
  - covers: F128-FR-006
- [x] T026 [P] [US1] Parity tests PT-128-C-061-critic-events and PT-128-C-066-critic-events (critic-class events reach the enabled sinks; ids added to the shipped copy only; the default labels `specstride`; `event` and `time` dropped; errors swallowed) in tests/parity/128/critic-events.test.ts
  - proves: C-061; C-066; B-0840; B-0841; B-0842; B-0843; B-0999; B-1000
  - fixture: FX-31
  - surfaces: exit, telemetry, events
- [x] T027 [US1] Implement the shipped copy of critic-class events in packages/observability/src/export/criticevents.ts
  - covers: F128-FR-007

## Phase 4: User Story 4 - A dead collector changes nothing (P1)

- [x] T028 [P] [US4] Parity test PT-128-C-200-delivery (one record for each sink and each flush that had a batch; none for an empty flush; statuses and the rewrite to `unknown`; local first; the recursion guard; no ledger and no spool) in tests/parity/128/delivery.test.ts
  - proves: C-200; C-197; B-2409; B-2415; B-2419
  - fixture: FX-31
  - surfaces: telemetry, events
- [x] T029 [P] [US4] Parity test PT-128-C-197-delivery-event (the event `telemetry.delivery` fields, dropped null values, written to the local events only) in tests/parity/128/delivery-event.test.ts
  - proves: C-197; B-2409
  - fixture: FX-31
  - surfaces: events
- [x] T086 [P] [US4] Characterization test CT-128-23 (the fix of defect D-40, which a comparison with the reference cannot prove: the delivery record of the OTLP exporter carries the sink label `otel` and never `otlp`; a record of an accepted OTLP batch is found by a query for the sink `otel` and raises the receiver state of that sink to `request_accepted`; the record of the Loki sink carries `loki`; the recorded reference of T001 is asserted to carry `otlp`, so that the test documents the difference) in tests/characterization/128/delivery-label.test.ts. Appended on 2026-09-30 after the cross-feature review (W-128-03); it is written before T030 and must fail before T030 is done
  - proves: F128-FR-026; B-2422
  - fixture: FX-31
- [x] T030 [US4] Implement the delivery record, the batch id and the statuses in packages/observability/src/export/delivery/record.ts
  - covers: F128-FR-026
- [x] T031 [P] [US4] Tests PT-128-C-176-reasons, PT-128-C-177-reasons and PT-128-C-184-reasons (`http_<status>`, `transport_error`, `queue_overflow`, `content_withheld`; a sink never exits or throws; the result record with `exit_code` 0 and 2 for a usage error) in packages/observability/test/export/reasons.test.ts
  - proves: C-176; C-177; C-184; B-2280; B-2281; B-2282; B-2314
  - fixture: FX-31
  - surfaces: exit, stderr, telemetry
- [x] T032 [US4] Implement the reasons and the result record in packages/observability/src/export/delivery/reasons.ts
  - covers: F128-FR-027
- [x] T033 [P] [US4] Parity tests PT-128-C-178-warnings and PT-128-C-185-warnings (the prefix `telemetry-loki` and `telemetry-otlp` through N-15; the texts; the excerpt of 200 characters redacted; `trace spans disabled` and `trace span error` still ship logs and metrics) in tests/parity/128/warnings.test.ts
  - proves: C-178; C-185; B-2283; B-2284; B-2315; B-2316; B-2317; B-2318; B-2286
  - fixture: FX-31
  - surfaces: stderr
- [x] T034 [US4] Implement the warnings in packages/observability/src/export/delivery/warnings.ts
  - covers: F128-FR-025
- [x] T035 [P] [US4] Parity tests PT-128-C-195-receiver-state, PT-128-C-196-receiver-state, PT-128-C-198-receiver-state and PT-128-C-199-receiver-state (the four states, the phrases, the lines, the TCP probe with 1.5 s, `--events` tolerance, `--no-probe`, the exit codes as result fields; the label of the delivery record of the OTLP exporter is not compared here, because the scenario `delivery-status` is waived by DV-058 and the fix of defect D-40 is proven by CT-128-23, task T086) in tests/parity/128/receiver-state.test.ts
  - proves: C-195; C-196; C-198; C-199; C-200; B-2421; B-2422; B-2423; B-2424
  - fixture: FX-31
  - surfaces: exit, stdout, telemetry
- [x] T036 [US4] Implement the receiver state and the probe in packages/observability/src/export/probe/state.ts
  - covers: F128-FR-028
- [x] T037 [P] [US4] Parity tests PT-128-C-012-startup-line and PT-128-C-021-startup-line (`telemetry: off (loki export not configured)`; the receiver state when on; the fallback `<sink>: export configured (<url>)`) in tests/parity/128/startup-line.test.ts
  - proves: C-012; C-021; C-022; B-0199; B-0357; B-2433
  - fixture: FX-31
  - surfaces: stdout, stderr
- [x] T038 [US4] Implement the text of the start-up and fallback lines in packages/observability/src/export/probe/lines.ts, as a function that returns the line; the feature that prints the line prints it (CQ-122), and the exporter prints nothing
  - covers: F128-FR-029
- [x] T039 [P] [US4] Parity test PT-128-C-022-independent-sinks (each event reaches each enabled sink independently; the Loki sink and the OTLP exporter are independent) in tests/parity/128/independent-sinks.test.ts
  - proves: C-022; B-0364; B-0365
  - fixture: FX-31
  - surfaces: telemetry
- [x] T040 [US4] Run FX-31 scenario `sink-down` with the stub verbs `refuse` and `down` and check the exit code and the event file against the run with the stub `accept`
  - proves: F128-FR-008
  - fixture: FX-31

## Phase 5: User Story 5 - Old payloads and old dashboards (P2)

- [x] T041 [P] [US5] Parity test PT-128-C-179-loki-push (endpoint, payload shape, acceptance 200 or 204, entry time, no retry, labels, `job`) in tests/parity/128/loki-push.test.ts
  - proves: C-179; B-2289; B-2290; B-2291; B-2292; B-2293; B-2295; B-2298; B-2287
  - fixture: FX-31
  - surfaces: telemetry
- [x] T042 [US5] Implement the Loki sink in packages/observability/src/export/loki/sink.ts and the labels in packages/observability/src/export/loki/labels.ts
  - covers: F128-FR-020; F128-FR-021
- [x] T043 [P] [US5] Parity tests PT-128-C-172-shipped-event, PT-128-C-173-shipped-event, PT-128-C-175-shipped-event, PT-128-C-180-shipped-event, PT-128-C-181-shipped-event and PT-128-C-183-shipped-event (fields of a shipped event; explicit pairs override a JSON object; a bare key is true; `run_id` and `iter` appended last; `api_request` and `tool_use` fields; `gate` with `result`; no `result_preview` under `parity`; a line that is not a record is not shipped) in tests/parity/128/shipped-event.test.ts
  - proves: C-172; C-173; C-175; C-180; C-181; C-183; B-2265; B-2266; B-2299; B-2301; B-2313; B-2296
  - fixture: FX-31
  - surfaces: telemetry, stdout
- [x] T044 [US5] Implement the assembly of a shipped event in packages/observability/src/export/forms/shipped-event.ts
  - covers: F128-FR-023
- [x] T045 [P] [US5] Parity test PT-128-C-178-summary-lines (the four summary lines of the stream in compatibility output only; nothing on standard output from the exporter) in tests/parity/128/summary-lines.test.ts
  - proves: C-178; C-172; B-2285
  - fixture: FX-31
  - surfaces: stdout
- [x] T046 [US5] Implement the text of the four summary lines in packages/observability/src/export/forms/summary.ts, as a formatter that the presenter of feature 119 calls in compatibility output (CQ-121); the exporter itself prints nothing on standard output (F128-FR-024)
  - covers: F128-FR-024
- [x] T047 [P] [US5] Parity test PT-128-C-186-otlp-shape (endpoints, log record shape, attribute typing, resource and scope, acceptance 200 or 202 or 204, the traces request not changing the verdict, no retry, metrics aggregation and bounds) in tests/parity/128/otlp-shape.test.ts
  - proves: C-186; B-2319; B-2320; B-2321; B-2322; B-2324; B-2325; B-2326; B-2327; B-2328; B-2329; B-2330; B-2331; B-2332; B-2333; B-2334; B-2335
  - fixture: FX-31
  - surfaces: telemetry
- [x] T048 [US5] Implement the OTLP logs, the resource and scope names, the acceptance rules and the batch verdict in packages/observability/src/export/otlp/logs.ts and packages/observability/src/export/otlp/post.ts
  - covers: F128-FR-011; F128-FR-012; F128-FR-013
- [x] T049 [US5] Implement the metric recorder (names, aggregation, bounds) in packages/observability/src/export/metrics/recorder.ts
  - covers: F128-FR-030; F128-FR-031
- [x] T050 [P] [US5] Test CT-128-10 (`telemetry.otel.legacyMetricNames` adds the six `ralph.*` metrics from the same records and never instead of the new ones; off by default and under `parity`; no attribute of a new metric renamed) in packages/observability/test/export/legacy-metrics.test.ts
  - proves: F128-FR-032; B-2320; B-2324
- [x] T051 [US5] Implement the opt-in for the old metric names in packages/observability/src/export/metrics/legacy.ts
  - covers: F128-FR-032

## Phase 6: User Story 2 - Traces show a run with its prompts (P1)

- [x] T052 [P] [US2] Parity test PT-128-C-188-spans (each opener and closer of the as-is form gives its span, the scope `yield` opening at `yield_wait` in the as-is form and at `yield.started` in the new form; error closers; the verdict rule; `run_stop` with and without `iter`; point spans of the error events) in tests/parity/128/spans.test.ts
  - proves: C-188; B-2340; B-2341; B-2342; B-2343; B-2344; B-2345; B-2346; B-2347; B-2348; B-2349; B-2350; B-2351; B-2352; B-2353; B-2354; B-2355; B-2356; B-2357; B-2358; B-2359; B-2360; B-2361; B-2362
  - fixture: FX-31
  - surfaces: telemetry
- [x] T053 [US2] Implement the span builder from the pairs at emit time, reading `data/span-scopes.tsv` and the as-is table, in packages/observability/src/export/spans/builder.ts
  - covers: F128-FR-014; F128-FR-015
- [x] T054 [P] [US2] Parity test PT-128-C-190-span-payload (nesting and supersession; point spans and the tool call end; attributes and the cut at 512 characters; resource `service.name`; scope and kind; start time; traces payload shape; no span before its close) in tests/parity/128/span-payload.test.ts
  - proves: C-190; B-2364; B-2365; B-2366; B-2367; B-2368; B-2371; B-2372; B-2373; B-2374; B-2375
  - fixture: FX-31
  - surfaces: telemetry
- [x] T055 [US2] Implement span attributes, the point spans, the traces request and the attribute names in packages/observability/src/export/spans/attributes.ts and packages/observability/src/export/otlp/traces.ts
  - covers: F128-FR-016; F128-FR-019
- [x] T056 [P] [US2] Parity test PT-128-C-187-trace-id (the inbound id of 32 hex characters, dashes ignored, not all zeros; the derivation from the run id; random span ids; the traces switch; no run id, no span) in tests/parity/128/trace-id.test.ts
  - proves: C-187; B-0063; B-2336; B-2337; B-2339; B-2369; B-2370
  - fixture: FX-31
  - surfaces: telemetry
- [x] T057 [US2] Implement the trace identity and the switch in packages/observability/src/export/spans/identity.ts
  - covers: F128-FR-017
- [x] T058 [P] [US2] Parity test PT-128-C-189-span-state (the state file at the logical name, replaced whole under a lock, with the field `schema` of the value `specstride.span-state/1` and no field `v`; the removal of state older than 7 days; an engine start that continues in the same trace and closes what a dead one left open) in tests/parity/128/span-state.test.ts
  - proves: C-189; B-2363; B-2367
  - fixture: FX-13, FX-31
  - surfaces: state, telemetry
- [x] T059 [US2] Implement the span state in packages/observability/src/export/spans/state.ts
  - covers: F128-FR-018
- [x] T060 [P] [US2] Test CT-128-17 (traces on and nothing else set: the spans of a pass and a critic call carry content or its reference; `telemetry.content` off: no span carries content; capture is a widening key; off under `parity`) in tests/security/128/content-follows-traces.test.ts
  - proves: F128-FR-036
- [x] T061 [US2] Implement the capture switch in packages/observability/src/export/content/switch.ts
  - covers: F128-FR-036

## Phase 7: User Story 3 - No secret reaches a collector (P1)

- [x] T062 [P] [US3] Test CT-128-18 (content only through the accessor; a refusal gives the reference and a record with `attempted` and `content_withheld`; the exporter reads no file of the control plane and redacts nothing itself) in tests/security/128/accessor.test.ts
  - proves: F128-FR-037
- [x] T063 [US3] Implement the content attachment through the accessor in packages/observability/src/export/content/attach.ts
  - covers: F128-FR-037
- [x] T064 [P] [US3] Test CT-128-19 (what is attached to which span; the caps and the whole size in the reference; the reasoning never exported; the nonce on no span; the attribute names of the reference of the prompt, of the reference of the reply and of the text) in tests/security/128/content-caps.test.ts
  - proves: F128-FR-038
- [x] T065 [US3] Implement the content policy in packages/observability/src/export/content/policy.ts
  - covers: F128-FR-038
- [x] T066 [US3] Canary test CT-128-13 on both sinks, with capture on and off: plant the canaries of feature 111 (every class of the pattern set and a registered secret) in the prompt, the reply, the tool arguments, the tool output, the phase evidence, the output of a check and the comment, and assert that none appears in any payload at the stub sink, on any span, log record or Loki line. It is a release condition (F100-FR-219) in tests/security/128/canary.test.ts
  - proves: F128-FR-039
  - fixture: FX-31
- [x] T067 [US3] Enforce that no log record and no Loki line carries content in packages/observability/src/export/content/logs.ts
  - covers: F128-FR-039
- [x] T068 [P] [US3] Test CT-128-20 (endpoint keys are widening and ignored in project configuration with a message; no user name or password in an address; https outside loopback; a credential is a reference, resolved at the moment of use, sent to its host only, and never written to an event, a span, a log line or an argument list; an inline value is an error) in tests/security/128/endpoints.test.ts
  - proves: F128-FR-040
- [x] T069 [US3] Implement the endpoint rules and the credential header in packages/observability/src/export/config-rules.ts
  - covers: F128-FR-040

## Phase 8: User Story 6 - The doctor shows what leaves the machine (P2)

- [x] T070 [P] [US6] Test CT-128-21 (the facts: address without credential, sink on, traces on, capture on, receiver state when probed, pattern set version; no connection without an online request) in packages/observability/test/export/doctor-facts.test.ts
  - proves: F128-FR-041
- [x] T071 [US6] Implement the facts for the check `telemetry.endpoint` in packages/observability/src/export/doctor/facts.ts
  - covers: F128-FR-041

## Phase 9: Metrics, dialects, the stack, the real collector

- [x] T072 [P] Verify the attribute names of the conventions for generative-model spans and of OpenInference at their current versions from their public documents and record the versions in packages/observability/data/export/dialects.md; where a name cannot be verified it stays `unverified`
  - covers: F128-FR-033
- [x] T073 [P] Test CT-128-15 (the dialects add attributes and never rename or drop a base attribute; an unknown dialect is a configuration error) in packages/observability/test/export/dialects.test.ts
  - proves: F128-FR-033
- [x] T074 Implement the dialects in packages/observability/src/export/spans/dialects.ts
  - covers: F128-FR-033
- [x] T075 [P] Test CT-128-16 (the three context gauges at run start when the exporter is on and the report is present; nothing and no warning when it is absent) in packages/observability/test/export/context-budget.test.ts
  - proves: F128-FR-034
- [x] T076 Implement the context-budget gauges in packages/observability/src/export/metrics/context-budget.ts
  - covers: F128-FR-034
- [x] T077 [P] Characterization tests CT-128-1, CT-128-2 and CT-128-3 (dashboard `ralph-loops`: uid, title, panels, queries, variables; compose ports and variables, project name, Loki on 3110, anonymous Grafana) in tests/characterization/128/dashboard-compose.test.ts
  - proves: F128-FR-042; F128-FR-043; F128-FR-044; C-201; C-202; C-203
- [x] T078 [P] Characterization tests CT-128-4, CT-128-5, CT-128-6, CT-128-7 and CT-128-8 (Loki configuration; collector receivers, batch, label promotion, raw body, exporter, metrics endpoint, no traces pipeline; Prometheus scrape; dashboard provisioning; datasources) in tests/characterization/128/configs.test.ts
  - proves: F128-FR-045; F128-FR-043; C-204; C-205; C-206; C-207; C-208
- [x] T079 Write the stack as files in packages/observability/assets/telemetry/: the dashboard `ralph-loops` unchanged, the dashboard of the new form, `docker-compose.yml` (project `specstride-telemetry`, ports bound to loopback, no `WIGGUM_*`, the comments about the Loki port and anonymous Grafana), the configurations of Loki, collector and Prometheus, and the provisioning
  - covers: F128-FR-042; F128-FR-043; F128-FR-044; F128-FR-045
- [x] T080 Test (part of CT-128-1) that the package installs with no install script and that nothing in the run, the doctor or the CLI starts the stack, in tests/e2e/128/stack-not-started.test.ts
  - proves: F128-FR-042
- [x] T081 End-to-end test CT-128-12 against a real collector: find a collector binary or image at run time; run one fixture with both sinks and traces on; check that logs, metrics and traces are accepted and that the delivery records say `accepted`; plant the canaries of T066 with capture on and check that none appears in what the collector received (read through its file or debug exporter), for F128-SC-004; skip with the reason when none is at hand, and record the version in tests/e2e/128/real-collector.test.ts
  - out-of-band (owner ruling of 2026-09-30): the live-host part is never run and never faked here. Do the hermetic part on Linux, and record the live-host part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F128-FR-035; F128-FR-039
  - fixture: FX-31
- [x] T082 Check on a macOS runner that the lock and the replace of the span-state file behave as on Linux and that the compose file starts with the container engine of the runner; record the versions (unverified until it runs)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F128-FR-018; F128-FR-044

## Phase 10: Polish

- [x] T083 Run `tests/parity/128` under the `parity` profile with the waivers of DV-058 for `metric-names` and `delivery-status`, and check that the waiver of DV-107 for the absent field `result_preview` is in force on FX-31 (feature 141) and that no result is `different`
  - proves: 028 FR-022
  - fixture: FX-31
- [x] T084 Run the checks of the quickstart and update `quickstart.md` if a step changed
  - covers: F128-FR-001
- [x] T085 Run `python3 docs/ecosystem/check-traceability.py` and repair every line `h1` to `h4` that names feature 128 or a requirement id of this feature
  - covers: F128-FR-001
