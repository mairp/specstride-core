# Feature Specification: Telemetry export

**Feature Branch**: `128-telemetry-export` (a label: Spec Kit creates no branch in this repository; the directory is `specs/128-telemetry-export`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 128-telemetry-export: the one OTLP exporter and the Loki sink as implementations of the event sink; spans built from lifecycle pairs at emit time; metrics and their names; optional attribute dialects; delivery status; content capture, which is on whenever traces are on, can be switched off, and always passes the redaction point; the shipped telemetry stack (dashboard, compose file, collector configuration) as optional assets; the opt-in for the old metric names."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; ruling 43), `architecture.md` sections 12, 17 and 18, `consolidation.md` (glossary; DV-058, DV-069, DV-083, DV-095, DV-107; D-40, D-41), `feature-briefs.md` (brief 128), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (Principles V, VI, XI, XII), feature 100 (annexes A, B, C, G, X), feature 141 (fixture family FX-31, the telemetry sink stub), and research R14, R11, R16, R17, R1, R1v, R2v, R18. The Specstride baseline at `9cab15d` is the reference for parity. The exporter of Lisa (`363e6a3`, package `otel`) is the starting point and is extracted whole.

## What this feature is

A run tells what it does by writing events. This feature sends copies of those events, and figures derived from them, to a collector that the consumer runs. It is the only exporter of the product. It has two parts that are sinks of the event sink contract of feature 100: an OTLP exporter (logs, metrics and traces) and a Loki sink (log lines). It also ships an optional telemetry stack, as data files, for consumers who have no collector yet.

Three things are fixed by the owner.

- **Off by default.** A run with default configuration opens no network connection for telemetry.
- **Content follows traces.** Prompt and reply text is put on the spans whenever traces are on. The consumer can switch it off, in user configuration. It always passes the single redaction point, which fails closed (ruling 43).
- **A sink never breaks the loop.** The local event file is written first and is authoritative. A slow, failing or dead collector changes neither the outcome of a run nor the event file.

Two baselines meet here. Specstride shipped events to Loki and to an OTLP collector by two small programs, one process per event. Lisa has an exporter package that no run ever called. Decision 11 says one exporter. It starts from Lisa's package. Specstride's two shippers are the parity side: what they put on the wire is compared at a local stub sink (fixture family FX-31).

**In scope**: the OTLP exporter; the Loki sink; spans built from open and close pairs at emit time; metrics and their names; the optional attribute dialects; delivery records and the receiver state; content capture and its policy; the shipped telemetry stack; the opt-in for the old metric names; the facts that the doctor shows about the exporter; the context-budget report as an observability artifact.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The event schema, the primary writer, the redactor with its patterns and their canary test, the sink contract, the content accessor | 111 |
| The compatibility projection and its switch `compat.legacyEvents` | 144 |
| Usage and cost as events | 111 (definition), 126 (emission) |
| Budgets and alerts | 127 |
| Stream telemetry of a pass | 126 |
| The doctor and its catalogue | 112 |
| The read model and `status` | 129 |
| Printing of lines on standard output and standard error | The feature that prints the line (119, 123) |
| Configuration loading, precedence and the spelling of every key | 110 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A default run sends nothing (Priority: P1)

A consumer installs the product and runs a feature with no telemetry configuration. Nothing leaves the machine for telemetry: no connection, no request, no file of a sink.

**Why this priority**: Principle XII and ruling 43 together mean that content leaves the machine only when the consumer turned traces on. The default must be provably silent.

**Independent Test**: Run a fixture with default configuration under a check that counts the network connections the process opens. The count for telemetry is 0.

**Acceptance Scenarios**:

1. **Given** default configuration, **When** a run starts, **Then** no exporter is registered and no connection is opened (F128-FR-001).
2. **Given** only the Loki switch on, **When** the run emits events, **Then** Loki receives lines and the OTLP collector receives nothing (F128-FR-001, F128-FR-008).
3. **Given** a project configuration that sets a telemetry endpoint, **When** the run starts, **Then** the endpoint is ignored with a launch message and a doctor warning (F128-FR-040).

---

### User Story 2 - Traces show a run with its prompts (Priority: P1)

A consumer turns traces on and points them at a collector. They see one trace per logical run: run, phase, phase attempt, pass, verification, critic call, with the prompt and reply text on the spans where that helps them find out why a phase attempt failed.

**Why this priority**: This is the reason the exporter exists, and ruling 43 made content part of it.

**Independent Test**: Turn traces on and set nothing else. Run a fixture. The spans of the pass and of the critic call carry the redacted prompt and reply. Switch capture off: no span carries content.

**Acceptance Scenarios**:

1. **Given** traces on and no other setting, **When** a pass ends, **Then** its span carries the prompt and the reply after they passed the redaction point (F128-FR-037, F128-FR-038).
2. **Given** capture switched off in user configuration, **When** the same run is exported, **Then** no span carries content, only the reference (path, hash, size) (F128-FR-036).
3. **Given** a redactor that cannot run, **When** a span closes, **Then** the content is replaced by its reference and a delivery record says so (F128-FR-037).
4. **Given** a phase attempt in which a critic call ran, **When** its span is exported, **Then** the span was built from the started and ended events when the second arrived, and it survives an engine start that was cut off (F128-FR-014, F128-FR-018).

---

### User Story 3 - No secret reaches a collector (Priority: P1)

The consumer's prompts and tool output can hold a secret. With capture on, the risk is the redaction point. A release is blocked until the widened patterns pass the canary test on both sinks.

**Why this priority**: Threat T-32. Passing the canary test is a release condition of feature 100.

**Independent Test**: Plant canary secrets in the prompt, the reply, tool arguments, tool output, phase evidence, the output of a check and the consumer's comment, with capture on. Read every payload at the stub sink. No canary appears on any span, log record or Loki line.

**Acceptance Scenarios**:

1. **Given** capture on and planted canaries, **When** the run is exported to both sinks, **Then** no canary appears in any payload (F128-FR-039).
2. **Given** a text that the redaction point refuses, **When** it would go on a span, **Then** the reference is sent in its place (F128-FR-037).

---

### User Story 4 - A dead collector changes nothing (Priority: P1)

A collector is down, slow or answers with an error. The run goes on, ends with the same exit code, and leaves the same event file. The consumer can see afterwards that delivery failed and why.

**Why this priority**: Principle V, threat T-37, EP-08.

**Independent Test**: Run one fixture three times: collector up, refusing, down. The exit code and the primary event file are equal. The delivery records differ.

**Acceptance Scenarios**:

1. **Given** a stub sink that refuses with a status code, **When** events are flushed, **Then** each batch has a record with status `failed` and the reason `http_<status>` (F128-FR-026, F128-FR-027).
2. **Given** a stub sink that is down, **When** events are flushed, **Then** each batch has a record with the reason `transport_error`, and the batch is not retried (F128-FR-026, F128-FR-013).
3. **Given** the OTLP exporter delivers a batch, **When** a status surface asks for the sink `otel`, **Then** the record it finds elevates the state above "endpoint reachable" (F128-FR-026, F128-FR-028).

---

### User Story 5 - Old dashboards and old payloads still work under the profile (Priority: P2)

A maintainer runs the parity oracle. The payloads that the exporter puts on the wire, in the as-is form, equal those of the two shippers of the baseline after normalization, apart from the metric names and the delivery status, which are waived. A consumer who kept the old dashboard switches on the old metric names and the as-is form.

**Why this priority**: Constitution Principle XVIII. Parity binds this feature; the new names are the default.

**Independent Test**: Fixture scenarios `loki-payload`, `otlp-payload` and `sink-down` of FX-31: 0 results `different`.

**Acceptance Scenarios**:

1. **Given** the `parity` profile, **When** a fixture run ships to the stub sink, **Then** the Loki body and the OTLP log and trace bodies equal the reference after N-26 (F128-FR-009, F128-FR-011, F128-FR-020).
2. **Given** `telemetry.otel.legacyMetricNames` on, **When** metrics are exported, **Then** the as-is metric names are sent as well (F128-FR-032).

---

### User Story 6 - The doctor shows what leaves the machine (Priority: P2)

A consumer runs the doctor and reads which endpoint receives telemetry, whether content capture is on, and which version of the redaction pattern set is in force.

**Why this priority**: Threat T-32 names the doctor as part of the control.

**Independent Test**: With traces on, the facts of F128-FR-041 are present and equal the configuration; with everything off they say so.

**Acceptance Scenarios**:

1. **Given** traces on with capture on, **When** the doctor runs, **Then** the facts show the endpoint, capture on and the pattern set version (F128-FR-041).

---

### Edge Cases

- A collector without a traces pipeline answers the traces request with an error. The delivery status of the batch is not changed by it (F128-FR-013).
- An engine start is cut off while spans are open. The next engine start of the run joins the same trace and closes what the dead one left open with a mark that says so (F128-FR-018).
- Two events open the same scope type in a row. The first span is closed and marked superseded (F128-FR-015).
- An event has no pair and no `run` scope is open. It becomes a point span at the top of the trace of the run, or is kept as a log record only if no run id exists (F128-FR-015, F128-FR-017).
- The endpoint is written with a user name and password inside the URL. The configuration is refused (F128-FR-040).
- A text longer than its cap is cut before it is sent; the reference carries the full size (F128-FR-038).
- Standard output is not a channel of the exporter. A warning goes to standard error and nothing else is printed by it (F128-FR-024, F128-FR-025).
- A queue that is full drops the newest events for that sink and records the drop; the run is not slowed (F128-FR-008).
- The shipped stack listens for Loki on a port other than the default address of the sink. The consumer passes the address explicitly (F128-FR-002, F128-FR-044).
- Windows and WSL are unvalidated; every macOS statement below is `unverified` (F100-FR-025).

## Requirements *(mandatory)*

The requirements are in five groups. The brief's four groups are G1 (OTLP exporter), G2 (Loki sink), G3 (metrics) and G4 (content and the stack). G0 holds what both sinks share: enablement, inputs and the delivery record.

### Functional Requirements

#### G0 - Enablement, inputs, the sink contract, delivery

- **F128-FR-001**: Loki shipping and OTLP shipping MUST both be off by default. A run with default configuration MUST register no exporter, open no network connection for telemetry and write no file of a sink. Each sink MUST be switched on by its own switch, and only the literal value `true` MUST switch the Loki sink on through the as-is variable. The OTLP exporter, its metrics and its traces MUST not be started by the Loki switch, and the Loki sink MUST not be started by the OTLP switch.
  - origin: 028 FR-022; B-0041; B-0043
  - disposition: translated
  - test: PT-128-028FR022-*; PT-128-C-007-*; CT-128-22
  - divergence: DV-058
  - parity: `telemetry.enabled` off and `telemetry.otel.enabled` off unless the fixture sets them (row 97 and row 98 of annex X §X.7)

- **F128-FR-002**: The default address of the Loki sink MUST be `http://localhost:3100` and the default address of the OTLP exporter MUST be `http://localhost:4318`, each used when the sink is on and no address is given. A given address MUST be written without a trailing slash. The default Loki address MUST be kept although the shipped stack publishes Loki on another port. The as-is names `SPECSTRIDE_LOKI_URL` and `SPECSTRIDE_OTEL_URL` MUST stay as aliases of the address keys through the alias table of annex X §X.8, and the names `RALPH_LOKI_URL` and `RALPH_OTEL_URL`, which the standalone shippers of the baseline read, MUST be aliases of the same keys at the rank of the environment through §K.8 of feature 110.
  - origin: B-0042; B-0044; B-2277; B-2312; B-2267; B-2302; C-052; C-174; C-182
  - disposition: translated
  - test: PT-128-C-007-*; PT-128-C-052-*; PT-128-C-173-*; PT-128-C-181-*
  - divergence: DV-058; DV-027
  - parity: `telemetry.loki.url` `http://localhost:3100`, `telemetry.otel.url` `http://localhost:4318`, the same under `parity` (row 97 and row 98 of annex X §X.7)

- **F128-FR-003**: The engine MUST accept the flags `--telemetry` (Loki on), `--loki-url URL` (Loki base address), `--otel` (OTLP on, independent of `--telemetry`) and `--otel-url URL` (OTLP base address), with the as-is meaning and the as-is defaults of F128-FR-002. A flag MUST rank above the environment and below the pin of the launch contract, as annex X §X.2 fixes. The four flags are short flags of the key catalogue of feature 110 (§K.2 rule 4): the flag layer maps each to its key at rank 2 (proposal U1 of `analyze-report.md`), and the exporter reads the resolved keys only and parses no argument list.
  - origin: C-006; B-0025; B-0026; B-0027; B-0028
  - disposition: ported
  - test: PT-128-C-006-*
  - parity: the four flags reproduce the as-is behaviour (`--telemetry` and `--otel` off, addresses as F128-FR-002)

- **F128-FR-004**: The as-is names `SPECSTRIDE_TELEMETRY_ENABLED`, `SPECSTRIDE_LOKI_URL`, `SPECSTRIDE_OTEL_ENABLED` and `SPECSTRIDE_OTEL_URL` MUST stay as aliases of the keys of this feature through the alias table of annex X §X.8, and the as-is name `SPECSTRIDE_OTEL_TRACES` MUST stay as an alias of `telemetry.otel.traces` through §K.8 of feature 110. The name `SPECSTRIDE_OTEL_STATE_DIR` MUST be accepted and MUST have no effect on where spans keep state: that place is the logical name `run:<runId>:span-state`; the launch message says so. The engine MUST hand to every process it starts, and under the `parity` profile, the resolved values under the as-is names `SPECSTRIDE_TELEMETRY`, `SPECSTRIDE_LOKI_URL`, `SPECSTRIDE_OTEL_ENABLED` and `SPECSTRIDE_OTEL_URL`. An inbound distributed-trace id in `SPECSTRIDE_TRACE_ID` MUST be passed through untouched and MUST NOT be invented when absent.
  - origin: C-007; B-0041; B-0042; B-0043; B-0044; B-0063; B-0065; B-2338
  - disposition: translated
  - test: PT-128-C-007-*; PT-128-C-187-*
  - divergence: DV-027; DV-006
  - assumption: CQ-120 (the variable `SPECSTRIDE_OTEL_STATE_DIR` against the place of span state that annex B fixes in the control plane; annex X §X.8 now says: accepted and without effect, with a message at launch)

- **F128-FR-005**: The entry of the pass loop MUST accept the flags `-j` or `--stream-json` (the telemetry add-on), `--loki-url` and `--otel-url` with the as-is combination rule. `-j` alone MUST enable the Loki sink only. A URL flag MUST enable its own sink, and when either URL flag is given only the sinks whose URL flag is given MUST ship. The defaults of the two addresses MUST be those of F128-FR-002. The as-is exits 1 for a missing shipper module and for a missing `python3` MUST NOT exist. The flags and the combination rule belong to the flag layer of feature 110, which sets `telemetry.enabled` and `telemetry.otel.enabled` at rank 2 from them (proposal U1 of `analyze-report.md`); the exporter reads the resolved keys only.
  - origin: C-051; C-052; C-058; B-0476; B-0482; B-0483; B-0493; B-0494; B-0672
  - disposition: translated; ported
  - test: PT-128-C-051-*; PT-128-C-052-*; PT-128-C-058-*
  - divergence: DV-066; DV-065; DV-027
  - parity: the flags and the combination rule reproduce the as-is behaviour

- **F128-FR-006**: When the Loki sink is on, the engine MUST hand the pass loop the flags `--stream-json` and `--loki-url <address>`. When the OTLP exporter is on, it MUST hand `--stream-json` and `--otel-url <address>`. With `--debug` it MUST hand `--debug`. Stream facts of a pass (one usage fact per model result, one tool call per tool use) MUST reach every enabled sink as events of the one event flow; the port MUST have no second pipeline that pipes a stream to a shipper. When both sinks are on, both MUST receive the same stream facts.
  - origin: C-013; C-058; B-0316; B-0753
  - disposition: ported
  - test: PT-128-C-013-*; PT-128-C-058-*
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F128-FR-007**: Events of the critic-class calls (critic, diagnostician, release verification) MUST reach the enabled sinks by the same flow, under the same switches, and telemetry MUST never affect a verdict. The shipped copy of such an event MUST carry the run, the project (as-is: `task`), the feature and the trace id as fields, and the event file MUST NOT gain them from the shipping. The label `backend` of a shipped critic event MUST default to `specstride` and the label `task` MUST default to `specstride`. Shipping MUST use the labels `job`, `task` and `backend` on Loki and the resource attributes `service.name`, `task` and `backend` on OTLP, as F128-FR-021 and F128-FR-012 fix, and MUST drop `event` and `time` from the shipped field set. Any error MUST be swallowed.
  - origin: C-061; C-066; B-0840; B-0841; B-0842; B-0843; B-0999; B-1000
  - disposition: translated; ported
  - test: PT-128-C-061-*; PT-128-C-066-*
  - divergence: DV-027; DV-058
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F128-FR-008**: The Loki sink and the OTLP exporter MUST be implementations of the event sink of annex C §C.10. A sink MUST receive an event only after the primary writer wrote it, already redacted, MUST deliver every event to each enabled sink independently of the other, and MUST never block the writer beyond `telemetry.sinkTimeoutMs`: `write` MUST only buffer, and the network request MUST be made by the sink's own flush. An exception, a timeout or a full buffer of one sink MUST NOT stop the event reaching the other sink, and MUST NOT change the outcome of the run, the exit code or the event file. A sink MUST ignore an event type and a field it does not know, and MUST declare the range of event schema majors it accepts. `telemetry.delivery` events MUST never be delivered to a remote sink. The buffer of a sink MUST be bounded by `telemetry.queueMaxEvents`; when it is full the newest events MUST be dropped for that sink and the drop MUST be recorded with the reason `queue_overflow`.
  - origin: C-022; B-0364; B-0365; B-2416; B-2417; B-2418; B-2420; C-200
  - disposition: ported; translated
  - test: PT-128-C-022-*; PT-128-C-200-*; CT-128-9
  - divergence: DV-058
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - parity: `telemetry.queueMaxEvents` 10000, not used under `parity` (flush at every event); `telemetry.sinkTimeoutMs` 2000, not used under `parity` (row 105 and row 46 of annex X §X.7; the owner of row 46 is feature 111)

- **F128-FR-009**: The payloads MUST have two forms. In the **as-is form** the event names, the field names, the labels, the resource names and the times are those of the Specstride baseline. In the **new form** they are the types of the event catalogue (annex X §X.6 row 73), the fields of the event envelope (annex X §X.1) and the names `specstride.*`. The as-is form MUST be used when `compat.legacyEvents` is on, which is the case under the `parity` profile, and the new form otherwise. In the as-is form an event whose row of the compatibility projection projects to nothing MUST NOT be shipped to any sink, MUST NOT open or close a span and MUST NOT feed a metric of the old names. The as-is names of the events MUST be read from the table of the compatibility projection. Three as-is names were used by the shippers of the baseline only, are events of no file and have no row in that table; the exporter MUST hold them itself, each for one type of the catalogue: `api_request` is the as-is name of the usage fact of F128-FR-006 and is made from `stream.result` (one per result record of a stream); `tool_use` is the as-is name of the tool call fact of F128-FR-006 and is made from `tool.call` (one per tool call); `gate` is the as-is name under which a verdict, `verdict.recorded`, feeds the metric of the old name. No caller of the baseline ships an event named `gate`, so a run MUST ship no log record and no Loki line of that name; the verdict is shipped under the name that the table gives (`verdict`). Whether the names that the table gives for `stream.result` and `tool.call` (`agent_result`, `agent_tool`) are shipped as well follows the table and not this requirement. The three names MUST exist in the as-is form only. The table "Forms of a payload" states the differences.
  - test: CT-128-14
  - divergence: DV-058; DV-007
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - parity: the form follows `compat.legacyEvents` (row 17 of annex X §X.7); no row of its own
  - assumption: CQ-119 (annex C §C.10 does not say that the context of `open` gives a sink the as-is name of an event)

- **F128-FR-010**: A request to a collector MUST have a time limit, default 2500 milliseconds. The body of a Loki push and of an OTLP logs request MUST be bounded, default 3145728 bytes; a larger batch MUST be split into several ordered requests. Metrics and traces requests MUST be sent unsplit. The flush interval MUST be `telemetry.flush.intervalMs`, default 2000; the value 0 MUST flush at every event, one event to one request, as the baseline shipped one event per process. The as-is names `RALPH_LOKI_TIMEOUT`, `RALPH_OTEL_TIMEOUT` (seconds, decimal, converted to milliseconds), `RALPH_LOKI_MAX_BATCH_BYTES` and `RALPH_OTEL_MAX_BATCH_BYTES` MUST stay as aliases of the four keys through §K.8 of feature 110. `close` MUST flush once, bounded by the time limit.
  - origin: C-174; C-182; B-2275; B-2276; B-2310; B-2311
  - disposition: translated
  - test: PT-128-C-174-*; PT-128-C-182-*
  - divergence: DV-027; DV-058
  - parity: `telemetry.loki.timeoutMs` 2500, `telemetry.otel.timeoutMs` 2500, `telemetry.loki.maxBatchBytes` 3145728, `telemetry.otel.maxBatchBytes` 3145728, the same under `parity`; `telemetry.flush.intervalMs` 2000, 0 under `parity` (rows 102, 103 and 104 of annex X §X.7)

#### G1 - The OTLP exporter: spans, attributes, delivery

- **F128-FR-011**: The OTLP exporter MUST post logs to `<base>/v1/logs`, metrics to `<base>/v1/metrics` and traces to `<base>/v1/traces`. Every event MUST become one log record: `timeUnixNano`, `observedTimeUnixNano`, `severityNumber` 9, `severityText` `INFO`, a body that is the logfmt line of F128-FR-022, attributes that are the event name and every non-null field, and `traceId` and `spanId` when spans are active. An attribute MUST be typed: a boolean as a boolean value, a whole number as an integer value written as text, a fractional number as a double value, everything else as a string value. In the as-is form the time MUST be the clock of the exporter; in the new form it MUST be the `ts` of the event.
  - origin: C-186; B-2321; B-2322; B-2323; B-2329
  - disposition: translated
  - test: PT-128-C-186-*
  - divergence: DV-058
  - ep: EP-08 `specstride.event-sink/1` (implements)

- **F128-FR-012**: The instrumentation scope of logs and metrics MUST be `specstride.ralph` in the as-is form and `specstride.export` in the new form. The resource attributes of logs and metrics MUST be `service.name`, `task` and `backend` in the as-is form, with `service.name` `ralph`, and `service.name`, `project` and `harness` in the new form, with `service.name` `specstride`. The resource attributes of traces MUST keep the others and MUST set `service.name` to `specstride` in both forms. The instrumentation scope of traces MUST be `specstride.trace` and every span MUST have the kind INTERNAL.
  - origin: C-186; C-190; B-2319; B-2335; B-2364; B-2365; B-1000; B-2303; B-2304
  - disposition: translated
  - test: PT-128-C-186-*; PT-128-C-190-*; PT-128-C-181-*
  - divergence: DV-058

- **F128-FR-013**: An OTLP request MUST count as accepted only on HTTP 200, 202 or 204. A batch MUST be marked failed when the logs request or the metrics request fails. The traces request MUST NOT change the verdict of a batch: a collector without a traces pipeline MUST NOT mark the batch failed, and a failed traces request MUST give one warning. Nothing MUST be retried or kept for later: after a flush, whether or not the push succeeded, the buffered logs, sums and histograms MUST be cleared.
  - origin: C-186; B-2331; B-2332; B-2333; B-2334
  - disposition: translated
  - test: PT-128-C-186-*
  - divergence: DV-058
  - status: unverified (check: an OTLP collector without a traces pipeline answers the traces request with an error; verified-on: —; pin: collector version of the shipped stack)

- **F128-FR-014**: A span MUST be built at the moment the event that closes it arrives, from the pair of events that bracket it, and not reconstructed at shipping time. A span MUST be sent when it closes, with the true start time taken from the opening event. The opening and closing types of every scope MUST be those of the table "Scopes of a span". In the as-is form the scope `yield` MUST open at the first event shipped as `yield_wait` (the type `yield.waiting`), as at the baseline, and not at `yield.started`, which the baseline ships as `pass_yield` and does not treat as an opener; in the new form it MUST open at `yield.started`. An event that closes a scope with a failed result MUST give the span the status error with a message that is the reason or the event name; the status code MUST be 2. A pause for quota and a blocked state MUST end their spans without the status error.
  - origin: C-188; B-2340; B-2341; B-2342; B-2343; B-2344; B-2345; B-2346; B-2347; B-2348; B-2349; B-2350; B-2351; B-2352; B-2353; B-2354; B-2355; B-2356; B-2357; B-2358; B-2359; B-2361; B-2362; B-2368
  - disposition: translated
  - test: PT-128-C-188-*
  - divergence: DV-007; DV-058
  - ep: EP-08 `specstride.event-sink/1` (implements)

- **F128-FR-015**: Opening a scope type that is already open MUST close that span and everything nested above it, marked `specstride.closed_by` `superseded`. Closing a scope MUST close everything nested above it. Every event that neither opens nor closes a scope MUST become a zero-length point span under the innermost open scope, carrying the event name in `specstride.event`; the name of the span MUST be `tool <tool>` for a tool call and the event name otherwise. A point span of a tool call MUST stay open until the next event that the process sees, or the flush, and take that time as its end. The events that the as-is form knows as `critic_malformed`, `pass_killed`, `yield_invalid` and `plugin_install_failed` MUST give their point spans the status error with the reason or the event name as message. A `run` closer of a stop MUST give the `run` span the status error, except a stop from inside a pass, which MUST give a point span.
  - origin: C-188; C-190; B-2360; B-2362; B-2372; B-2373; B-2374
  - disposition: translated
  - test: PT-128-C-188-*; PT-128-C-190-*
  - divergence: DV-007; DV-058

- **F128-FR-016**: A scope span MUST have as attributes the fields of its opening event, the fields of its closing event that do not collide, `specstride.scope` and `specstride.closed_by`. The keys `ts`, `time` and `event` MUST never be attributes. A string attribute MUST be cut to 512 characters, and a value that is not a scalar MUST be written as JSON before the cut. Every attribute name that this feature introduces MUST start with `specstride.`, except the text attributes `input.value` and `output.value` of F128-FR-038, which keep the names of the OpenInference convention. The ids of the envelope (`runId`, `featureId`, `phaseId`, `attemptId`, `passId`, `sessionId`, `cause`) MUST be attributes of the span under the names of the table "Attribute names".
  - origin: C-190; B-2366; B-2371
  - disposition: translated
  - test: PT-128-C-190-*
  - divergence: DV-058

- **F128-FR-017**: The trace of a run MUST have one trace id for every launch of the run. An inbound `SPECSTRIDE_TRACE_ID` of 32 hexadecimal characters, dashes ignored and not all zeros, MUST be that id and MUST take precedence over the trace id of an event. Otherwise the id MUST be the first 32 hexadecimal characters of the SHA-256 hash of `specstride:` followed by the run id, so that every process of one run lands in one trace. A span id MUST be 8 random bytes written as 16 hexadecimal characters. Span derivation and the correlation of logs with traces MUST be switched off by `telemetry.otel.traces` set to false, `0`, `no` or `off` in any case, and MUST be on by default when the OTLP exporter is on. With no run id, no span MUST be produced.
  - origin: C-187; C-190; B-0063; B-2336; B-2337; B-2339; B-2369; B-2370
  - disposition: translated
  - test: PT-128-C-187-*; PT-128-C-190-*
  - divergence: DV-027; DV-058
  - parity: `telemetry.otel.traces` on under `parity`, as the baseline's default (row 99 of annex X §X.7)

- **F128-FR-018**: The spans that are open MUST be kept at the logical name `run:<runId>:span-state`, of which the exporter is the only writer, with the trace id and the stack of open scopes. It MUST be written by replacing the file whole, under an exclusive lock of its own, and MUST carry the field `schema` with the value `specstride.span-state/1`, the schema id with its major of annex B §B.20 (F100-FR-048), and no separate version field. Before a run starts, span state of another run older than 7 days MUST be removed. An engine start that finds open spans of a dead engine start MUST close them from the events that the next writer synthesizes, marked as synthesized, and MUST continue in the same trace.
  - origin: C-189; B-2363; B-2367
  - disposition: translated
  - test: PT-128-C-189-*; PT-128-C-190-*
  - divergence: DV-006; DV-058
  - status: unverified (check: the exclusive lock and the replace behave alike on macOS and on Linux; verified-on: —; pin: macOS version of the runner)

- **F128-FR-019**: A traces request MUST have the shape `resourceSpans[0].resource.attributes`, `scopeSpans[0].scope.name` and `spans[]` with `traceId`, `spanId`, `parentSpanId`, `name`, `kind`, `startTimeUnixNano`, `endTimeUnixNano`, `attributes` and, on error, `status.code` 2 with `message`. The start time MUST come from the `ts` of the opening event, and where an event has none, from the clock of the exporter. Scope spans MUST be sent only when they close.
  - origin: C-190; B-2368; B-2371; B-2375
  - disposition: translated
  - test: PT-128-C-190-*
  - divergence: DV-058

#### G2 - The Loki sink

- **F128-FR-020**: The Loki sink MUST push to `<base without trailing slash>/loki/api/v1/push` with `POST` and `Content-Type: application/json`, in the shape `{"streams": [{"stream": {labels}, "values": [["<ns>", "<logfmt line>"], ...]}]}`. A push MUST count as accepted only on HTTP 200 or 204. The entry time MUST be the clock of the sink in nanoseconds, as a string, in the as-is form, and the `ts` of the event in the new form. After a flush the buffered streams MUST be cleared even when the push failed.
  - origin: C-179; B-2289; B-2291; B-2292; B-2293; B-2295
  - disposition: translated
  - test: PT-128-C-179-*
  - divergence: DV-058

- **F128-FR-021**: Loki stream labels MUST be low in cardinality: in the as-is form `job` `ralph`, `task`, `backend` and `event`, plus the label `model` on the events shipped as `api_request` and `tool_use` only, and plus the label `role`, and nothing else, on an event that comes from the stream tap. In the new form the labels MUST be `job` `specstride`, `feature`, `harness`, `event` (the event type) and `role`, with `model` on usage and tool events. Every other value MUST stay in the logfmt line, and `run_id`, `invocation_id`, `sequence`, cost and tokens MUST never be labels.
  - origin: C-179; C-175; B-2278; B-2279; B-2287; B-2290; B-2298
  - disposition: translated
  - test: PT-128-C-179-*; PT-128-C-175-*
  - divergence: DV-058

- **F128-FR-022**: The line of a Loki entry and the body of an OTLP log record MUST be the same string, made by one encoder. A field whose value is null MUST be omitted, a boolean MUST be `true` or `false`, a number MUST be written in its shortest decimal form, a newline MUST become a space, and a string that is empty or contains a space, a double quote, `=` or a backslash MUST be double-quoted with the backslash and the quote escaped. Nested records MUST be flattened with dotted keys.
  - origin: C-179; C-186; B-2288; B-2323
  - disposition: translated
  - test: PT-128-C-179-*; PT-128-C-186-*
  - divergence: DV-058

- **F128-FR-023**: A shipped event MUST be assembled from the fields of the event, and MUST have the low-cardinality identity `task` and `backend` as labels (as-is form). `run_id` and `iter` MUST be fields and never labels, and when they are given in addition to the fields of the event they MUST be appended after them, the last value winning. Fields given as explicit pairs MUST override the fields of a JSON object; a bare key MUST mean the value true; a JSON object that cannot be read MUST be ignored; the keys `event` and `time` MUST never be fields. An event with no name MUST ship nothing and give one warning. The event `api_request` MUST have the fields `run_id`, `iter`, `model`, `is_error`, `subtype`, `cost_usd`, `duration_ms`, `duration_api_ms`, `num_turns`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, and `result_preview` only while content capture is on, and the event `tool_use` MUST have `run_id`, `iter`, `tool` and `model`. The event `gate` MUST carry the field `result`.
  - origin: C-172; C-173; C-175; C-180; C-181; C-183; B-2265; B-2268; B-2269; B-2270; B-2271; B-2272; B-2273; B-2274; B-2278; B-2279; B-2286; B-2299; B-2300; B-2303; B-2304; B-2305; B-2306; B-2307; B-2308; B-2309; B-2313; B-2297
  - disposition: translated
  - test: PT-128-C-172-*; PT-128-C-173-*; PT-128-C-175-*; PT-128-C-180-*; PT-128-C-181-*; PT-128-C-183-*
  - divergence: DV-058; DV-007; DV-066; DV-083; DV-107
  - parity: `result_preview` absent under `parity`, since content capture is off (row 16 of annex X §X.7); the absent field is waived on FX-31 by DV-107
  - assumption: CQ-128 (DV-083 says the baseline captures no content, while it ships `result_preview`; DV-107 carries the waiver)

- **F128-FR-024**: A line of a stream that is not a record MUST NOT be shipped. The exporter MUST print nothing on standard output. Under compatibility output and with the telemetry add-on on, the presenter MUST print for the stream facts the four summary lines `  · init model=<model|?> tools=<n>`, the text of the model, `  → tool: <name>` and `  ✓ result: <subtype>  cost=$<4 decimals>  turns=<n>  out_tok=<n>  <ms>ms`. In default output none of them MUST be printed.
  - origin: C-172; C-178; C-180; B-2266; B-2285; B-2296; B-2301
  - disposition: translated
  - test: PT-128-C-172-*; PT-128-C-178-*; PT-128-C-180-*
  - divergence: DV-058; DV-066
  - assumption: CQ-121 (which component prints the summary lines; feature 126 owns the stream and feature 119 the presenter)

- **F128-FR-025**: The warnings of a sink MUST be lines on standard error that start with the logical component name of the sink, `telemetry-loki` or `telemetry-otlp`, and a colon and a space. The messages MUST be: `Loki push HTTP <status>`, `Loki push failed HTTP <code> <first 200 characters of the body>`, `Loki push error: <exception>`, `OTLP push HTTP <status> to <url>`, `OTLP push failed HTTP <code> <first 200 characters>`, `OTLP push error: <exception>`, `trace spans disabled (<error>)` when span derivation cannot start (the logs and the metrics MUST still ship), `trace span error: <error>` when a span cannot be derived (the log record MUST still be buffered), `event mode needs --event NAME` in the as-is form when an event has no name, and `fatal (ignored): <error>` for an unexpected error. The excerpt of a response body and the text of an exception MUST pass the redaction point and the cut to their size before they are printed.
  - origin: C-178; C-185; B-2283; B-2284; B-2315; B-2316; B-2317; B-2318
  - disposition: translated
  - test: PT-128-C-178-*; PT-128-C-185-*
  - divergence: DV-066; DV-065; DV-058

#### G0 (continued) - Delivery, sink labels, receiver state

- **F128-FR-026**: Every flush that had a batch MUST give one delivery record for each sink: the sink label, a batch id of the form `<sink>-<time in nanoseconds>-<sequence>`, the number of events, the status, the HTTP status and the reason. A flush with nothing buffered MUST give no record. A sink whose flush raises MUST give a record with the status `failed` and the reason `transport_error`. The status MUST be one of `attempted`, `accepted`, `failed`, `unknown`, and a status outside the set MUST be written as `unknown`. The record MUST reach the run as the event `telemetry.delivery` through the writer of the run, and MUST never be delivered to a remote sink; there MUST be no other ledger and no spool. The sink label of a record MUST be the label the status surfaces query: `loki` for the Loki sink and `otel` for the OTLP exporter, so that a record of an accepted OTLP batch is found by a query for `otel`. This fixes defect D-40 of the baseline, whose record said `otlp`; because a comparison with the reference cannot prove a fix, the label MUST be proven by the characterization test CT-128-23.
  - origin: C-200; C-179; C-186; C-197; B-2294; B-2332; B-2409; B-2415; B-2419; B-2420; B-2422; B-2423
  - disposition: translated
  - test: PT-128-C-200-*; PT-128-C-197-*; PT-128-C-179-*; PT-128-C-186-*; CT-128-23
  - divergence: DV-058
  - ep: EP-08 `specstride.event-sink/1` (implements)

- **F128-FR-027**: A delivery reason MUST be `http_<status>` for a rejection at the level of HTTP, `transport_error` for any failure that is not HTTP (connection refused, timeout), `queue_overflow` for a dropped event of a full buffer, or `content_withheld` for content that was replaced by its reference. A sink MUST never exit or throw in a way that the caller sees: every runtime failure of a sink MUST end in a record and a warning, and a component call that stands for the as-is shipper commands MUST return the as-is exit code 0 as the field `exit_code` of its result record, and 2 for a usage error of that call.
  - origin: C-176; C-177; C-184; B-2280; B-2281; B-2282; B-2314
  - disposition: translated
  - test: PT-128-C-176-*; PT-128-C-177-*; PT-128-C-184-*
  - divergence: DV-058; DV-065

- **F128-FR-028**: The receiver state of a sink MUST be the highest state that can be proved among `configured`, `reachable`, `request_accepted` and `query_verified`. `configured` MUST hold when the sink is on. `reachable` MUST hold when a plain TCP connection to the host and port of the address (default port 443 for `https`, else 80) succeeds within 1.5 seconds; any failure means not reachable. `request_accepted` MUST hold when a delivery record of the sink with the status `accepted` exists, and `query_verified` when that record has a true `query_verified` field, which nothing in this feature sets. The probe MUST be skipped on request, so that the state starts at `configured`, and MUST read delivery records from the events of the run, tolerating a missing file and malformed lines. The phrases MUST be `export configured`, `endpoint reachable`, `events accepted` and `query-verified`; a state line MUST be `<sink>: <phrase>` and a probe line `<sink>: <phrase> (<url>)`. A call with the wrong number of arguments or an unknown state MUST return the `exit_code` 2 in its result record, and every other call 0, even when the endpoint cannot be reached.
  - origin: C-195; C-196; C-198; C-199; C-200; B-2405; B-2406; B-2407; B-2408; B-2410; B-2411; B-2412; B-2413; B-2414; B-2421; B-2423; B-2424
  - disposition: translated
  - test: PT-128-C-195-*; PT-128-C-196-*; PT-128-C-198-*; PT-128-C-199-*; PT-128-C-200-*
  - divergence: DV-058; DV-065; DV-066
  - parity: the probe reproduces the as-is behaviour under `parity`

- **F128-FR-029**: With telemetry off, the start-up record of a run MUST say `  telemetry: off (loki export not configured)`. With it on, the line MUST carry the receiver state of F128-FR-028. When the probe cannot run, the status line and the start-up line MUST fall back to `<sink>: export configured (<url>)`. The lines MUST be printed in compatibility output; in default output the rule of annex G §G.3 for terse lines holds and no line is added under the `parity` profile.
  - origin: C-012; C-021; C-022; B-0199; B-0357; B-2433
  - disposition: ported
  - test: PT-128-C-012-*; PT-128-C-021-*; PT-128-C-022-*
  - assumption: CQ-122 (the label family of the start-up telemetry line in annex G §G.3)

#### G3 - Metrics, dialects, the old names as an opt-in

- **F128-FR-030**: The exporter MUST record these metrics, with the names `specstride.*` and delta temporality: `specstride.cost.usd` (sum; attributes `role`, `model`, `provider`, `billing`, `cost_source`), `specstride.tokens` (sum; `type` of `input`, `output`, `cache_read`, `cache_write`, `reasoning`, plus `model`), `specstride.pass.duration` (histogram, unit `ms`, attribute `model`), `specstride.errors` (sum, `model`), `specstride.tool.calls` (sum, `tool`), `specstride.verdict` (sum, `result`), `specstride.attempt.outcome` (sum, `cause`), `specstride.check.duration` (histogram, `result`), `specstride.pause.duration` (histogram), `specstride.blocked.duration` (histogram), `specstride.quota.utilization` (gauge, `rate_limit_type`) and `specstride.run.state` (gauge, `state`). An error counter MUST be incremented when `is_error` is true or the text `true`, `1` or `yes`. A tool counter MUST be incremented once per tool call, and a verdict counter once per verdict.
  - origin: C-186; B-2313; B-2324; B-2325; B-2326; B-2327; B-2328
  - disposition: translated
  - test: PT-128-C-186-*
  - divergence: DV-058
  - status: unverified (check: the metric names are read by a collector and a metrics store in the end-to-end test; verified-on: —; pin: collector version of the shipped stack)

- **F128-FR-031**: Every metric sum MUST be monotonic with delta aggregation temporality, with the start time of the exporter start. The histogram of durations MUST have the explicit bounds 100, 500, 1000, 5000, 10000, 30000, 60000 and 120000 milliseconds. No unit MUST be set on a cost metric.
  - origin: C-186; B-2320; B-2330
  - disposition: translated
  - test: PT-128-C-186-*
  - divergence: DV-058

- **F128-FR-032**: The option `telemetry.otel.legacyMetricNames`, off by default and off under the `parity` profile, MUST additionally send the as-is metrics `ralph.iter.duration_ms` (histogram, `model`), `ralph.cost_usd` (sum, `model`), `ralph.tokens` (sum, `model` and `type` of `input`, `output`, `cache_read`, `cache_creation`), `ralph.errors` (sum, `model`), `ralph.tool_use` (sum, `tool`) and `ralph.gate` (sum, `result`), from the same records as the new metrics and never instead of them. It MUST never rename an attribute of a new metric.
  - origin: C-186; B-2320; B-2324; B-2325; B-2326; B-2327; B-2328
  - disposition: translated
  - test: PT-128-C-186-*; CT-128-10
  - divergence: DV-058
  - parity: off (row 42 of annex X §X.7)

- **F128-FR-033**: The option `telemetry.otel.dialects` MUST name optional sets of attribute names for generative-model conventions: `specstride` (always on), `genai` and `openinference`. An enabled dialect MUST add attributes to a span and MUST never rename or drop a base attribute. Under `genai` the attributes MUST be the token and model attributes of the generative-model conventions, and under `openinference` the span kinds and the token count attributes of that convention. An unknown dialect name MUST be a configuration error. The attribute names of both dialects MUST be marked `unverified`, since the conventions were reported as moved.
  - test: CT-128-15
  - parity: `telemetry.otel.dialects` empty, so that only `specstride` applies, under `parity` (row 100 of annex X §X.7)
  - status: unverified (check: read the attribute names of the generative-model conventions and of OpenInference at the version pinned in the plan; verified-on: —; pin: convention versions)

- **F128-FR-034**: The exporter MUST offer the figures of the context-budget report of the build (per host skill: measured bytes, tokens by the pinned ratio, and the limit) as gauge metrics `specstride.context.bytes`, `specstride.context.tokens` and `specstride.context.limit` with the attribute `skill`, once at the start of a run, when the OTLP exporter is on and the report is present. When the report is absent nothing MUST be emitted and no warning MUST be given.
  - test: CT-128-16
  - parity: off, since the OTLP exporter is off unless the fixture sets it and the report is not part of the fixtures
  - assumption: CQ-123 (the logical name of the report is `package:context-budget`, annex B §B.5)

- **F128-FR-035**: The exporter MUST start from the OTLP and Loki package of Lisa as extracted, and MUST keep these properties of it: every forwarder is best-effort and never throws into the caller; Loki streams carry low-cardinality labels only; OTLP is built by hand as OTLP over HTTP with JSON and no SDK; metrics have delta temporality; the trace context follows the W3C `traceparent` version 00, span ids are random and never all zeros, and a malformed inbound header is ignored. The trace id is the one exception: it follows F128-FR-017 (the inbound id, or the id derived from the run id), and not Lisa's random trace id. Because no run of Lisa ever called it, the exporter MUST be proven by an end-to-end delivery to a real collector and by characterization tests of the extracted behaviour.
  - divergence: DV-058
  - test: CT-128-11; CT-128-12
  - status: unverified (check: delivery to a real collector at the version pinned in the plan; verified-on: —; pin: collector version)

#### G4 - Content capture, policy, the doctor, the shipped stack

- **F128-FR-036**: Prompt and reply content MUST be captured for export whenever traces are on, and the consumer MUST be able to switch capture off with `telemetry.content` in user configuration. The values of the key MUST be `auto`, the default, which means captured whenever traces are on, and `off`. Traces MUST stay off by default, so that a run with default configuration sends nothing. `telemetry.content` MUST be a widening key: project configuration cannot set it. Under the `parity` profile capture MUST be off.
  - test: CT-128-17
  - divergence: DV-083; DV-069
  - parity: `telemetry.content` `off`; the default is `auto` (row 16 of annex X §X.7)
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F128-FR-037**: The exporter MUST attach content to a span only after the content passed the redaction point of feature 100, and only through the content accessor that the core gives a sink. It MUST NOT read a file of the control plane and MUST NOT redact by itself. Content that the redaction point refuses MUST be replaced by its reference (path, hash, size), and the refusal MUST be a delivery record with the status `attempted` and the reason `content_withheld`, with the number of items withheld as the event count.
  - test: CT-128-18
  - divergence: DV-083
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F128-FR-038**: The content of a span MUST be: on the span of a pass and of a phase attempt, the prompt of the pass; on the span of a critic call, the prompt of the call and the reply; on the span of a pass, the text of the reply. The prompt MUST be cut to `telemetry.contentMaxPromptBytes` (default 262144) and the reply to `telemetry.contentMaxReplyBytes` (default 16384); the reference MUST always name the whole size. The reasoning of a model MUST never be exported. The nonce of a critic call MUST NOT appear on any span: the critic prompt MUST be sent only after the call has returned and with the nonce replaced by its hash. The names of the attributes MUST be `specstride.prompt.path`, `specstride.prompt.sha256`, `specstride.prompt.bytes` for the reference of the prompt, `specstride.reply.path`, `specstride.reply.sha256`, `specstride.reply.bytes` for the reference of the reply, and `input.value` and `output.value` for the text.
  - test: CT-128-19
  - divergence: DV-083
  - parity: `telemetry.contentMaxPromptBytes` 262144 and `telemetry.contentMaxReplyBytes` 16384, not used under `parity` since capture is off (row 101 of annex X §X.7)
  - assumption: CQ-124 (how the nonce is masked in the content that the accessor returns; threat T-05 names features 101 and 111)

- **F128-FR-039**: No log record and no Loki line MUST carry prompt or reply content, whatever the capture setting is. A release MUST be blocked until the pattern set of the redactor of annex X §X.4 (F100-FR-205) passes the canary test of annex X §X.9 (F100-FR-219) on both sinks with capture on: canaries of every class of the pattern set and a registered secret, planted in the prompt, the reply, the tool arguments, the tool output, the phase evidence, the output of a check and the consumer's comment, MUST not appear in any payload at the stub sink, on any span or on any log line.
  - divergence: DV-083; DV-095
  - test: CT-128-13
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F128-FR-040**: The keys of the endpoints of both sinks MUST be widening keys of the user scope: a project configuration MUST be ignored for them, with a launch message and a doctor warning. An endpoint address MUST NOT hold a user name or a password. An address that is not on the loopback interface MUST use `https`, otherwise the configuration MUST be refused. A credential for a collector MUST be a reference of the secret resolver, resolved at the moment of use, sent only to the host of the address, and never written to an event, a span, a log line, a launch contract or an argument list; an inline value MUST be a configuration error.
  - test: CT-128-20
  - parity: `telemetry.loki.auth` and `telemetry.otel.auth` not set under `parity` (row 106 of annex X §X.7)
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - assumption: CQ-125 (the rule of https outside loopback of threat T-16 is read to cover telemetry endpoints)

- **F128-FR-041**: The exporter MUST give the doctor the facts of its configuration, and the doctor MUST NOT open a connection unless the consumer asked for an online check: for each sink the address with no credential, whether the sink is on, whether traces are on, whether content capture is on, the receiver state of F128-FR-028 when probed, and the version of the redaction pattern set in force. The check `telemetry.endpoint` of the doctor MUST be able to present them with the severity `info`, and `warn` when capture is on.
  - test: CT-128-21
  - divergence: DV-083
  - ep: EP-14 `specstride.doctor/1` (consumes)
  - assumption: CQ-126 (whether this package registers the check or the catalogue of feature 112 does)

- **F128-FR-042**: The product MUST ship the telemetry stack as optional data files in the package: one dashboard for the as-is form, one dashboard for the new form, a compose file, a collector configuration, a Loki configuration, a Prometheus configuration and the provisioning of datasources and dashboards. Nothing MUST start the stack: no install script, no command of the product, no run. No run and no check MUST need it.
  - origin: C-201; C-202; C-203; C-204; C-205; C-206; C-207; C-208
  - disposition: translated
  - test: CT-128-1; CT-128-2; CT-128-3; CT-128-4; CT-128-5; CT-128-6; CT-128-7; CT-128-8
  - divergence: DV-058

- **F128-FR-043**: The dashboard of the as-is form MUST have the uid `ralph-loops` and the title `Ralph Loops` and keep the panels of the baseline: run and iteration counts from `run_start` and `iter_start`; errors from `api_request` or `agent_result` lines with `is_error="true"` or `status="error"`; cost, token, duration and request panels from `api_request` or `agent_result` with the logfmt fields `cost_usd`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `duration_ms`; tool panels from `tool_use` or `agent_tool` grouped by `tool`; a panel of verdicts from `gate` grouped by `result`. Every query MUST select streams by `job="ralph"`, `event`, `task`, `backend` and `role`, then filter the logfmt fields `run_id` and `invocation_id`. The variables MUST be `task`, `backend`, `role` (label values of `{job="ralph"}`) and free text `run` and `invocation` with the default `.*`. The dashboard of the new form MUST have the same panels reading the names of the new form, the uid `specstride-runs` and the variables `feature`, `harness`, `role`, `run`. Both MUST be provisioned into the folder `Specstride`, from the directory of dashboards, and the Loki datasource MUST have the uid `loki`, be the default, use the address `http://loki:3100` and read at most 2000 lines. The Prometheus datasource MUST have the uid `prometheus`, use `http://prometheus:9090` and not be the default.
  - origin: C-201; C-207; C-208; B-2434; B-2435; B-2436; B-2437; B-2438; B-2439; B-2440; B-2441; B-2460; B-2461; B-2462; C-206
  - disposition: translated
  - test: CT-128-1; CT-128-6; CT-128-7; CT-128-8
  - divergence: DV-058

- **F128-FR-044**: The compose file MUST publish the host ports through the variables `SPECSTRIDE_LOKI_PORT` (default 3110, for the container port 3100), `SPECSTRIDE_OTEL_PORT` (4318), `SPECSTRIDE_OTEL_GRPC_PORT` (4317, unused by the exporter), `SPECSTRIDE_PROMETHEUS_PORT` (9091, for 9090) and `SPECSTRIDE_GRAFANA_PORT` (3010, for 3000). The `WIGGUM_*` fallbacks of these variables MUST NOT be read. The shipped Loki MUST be published on port 3110, which differs from the default Loki address of the sink; the consumer MUST pass the address to reach it, and the file MUST say so in a comment. The compose project MUST be named `specstride-telemetry`. Every published port MUST be bound to the loopback interface. Grafana MUST allow anonymous access with the role `Admin` and no login form, for use on a machine of one person, and the file MUST say so in a comment.
  - origin: C-202; C-203; B-2442; B-2443; B-2444; B-2445; B-2446; B-2447; B-2448; B-2449
  - disposition: translated
  - test: CT-128-2; CT-128-3
  - divergence: DV-058; DV-036
  - status: unverified (check: the stack starts with a container engine on Linux and on macOS and the ports are bound to loopback; verified-on: —; pin: container engine version)

- **F128-FR-045**: The Loki configuration MUST use no authentication, keep logs for 168 hours (7 days) and limit ingestion to 16 MB per second with a burst of 32 MB. The collector configuration MUST receive OTLP over HTTP on `0.0.0.0:4318` and over gRPC on `0.0.0.0:4317` inside its container; batch every 5 seconds; promote the resource attributes `task` and `backend` and the log attributes `event` and `model` to Loki stream labels, and not `role`; forward the log body raw so that the logfmt line reaches Loki unchanged; push to `http://loki:3100/loki/api/v1/push` with the default `job` label on and the `exporter` label off; and expose metrics on `0.0.0.0:8889` with resource attributes converted to metric labels. The collector MUST define the pipelines `logs` and `metrics` only, so that traces posted by the exporter are not accepted by the shipped stack. Prometheus MUST scrape the job `otel-collector` at `otel-collector:8889` every 15 seconds.
  - origin: C-204; C-205; C-206; B-2450; B-2451; B-2452; B-2453; B-2454; B-2455; B-2456; B-2457; B-2458; B-2459
  - disposition: translated
  - test: CT-128-4; CT-128-5; CT-128-6
  - divergence: DV-058
  - assumption: CQ-127 (whether the shipped collector gains a traces pipeline now that content goes on spans; this feature proceeds on the baseline: no)

### Key Entities *(include if feature involves data)*

- **Sink**: a destination that receives events after the primary write. Here: the Loki sink and the OTLP exporter.
- **Batch**: the events that one flush of one sink sends. It has a batch id.
- **Delivery record**: the record, one for each sink and each batch, of what came of the flush. It is the event `telemetry.delivery`.
- **Receiver state**: the highest of `configured`, `reachable`, `request_accepted`, `query_verified` that can be proved for a sink.
- **Span**: a scope of the run (run, phase, phase attempt, pass, verification, critic call and more) built from a started and an ended event, or a point in time under a scope.
- **Span state**: the open spans of a logical run, kept so that spans survive an engine start.
- **Content**: prompt and reply text. It is on a span only after the redaction point, and only while traces and capture are on.
- **Form of a payload**: the as-is form (baseline names, followed by `compat.legacyEvents`) or the new form.
- **Telemetry stack**: the optional data files (dashboards, compose file, configurations) that a consumer may run.

### Forms of a payload

| Subject | As-is form | New form |
|---|---|---|
| Event names and field names | The names of the baseline, read from the compatibility projection; `api_request` (made from `stream.result`), `tool_use` (made from `tool.call`) and `gate` (the name under which `verdict.recorded` feeds the old metric; never shipped as an event of a run), which the exporter holds itself | The types of the event catalogue (annex X §X.6 row 73) and the fields of the envelope (annex X §X.1); `data` flattened with dotted keys |
| Loki label `job` | `ralph` | `specstride` |
| Loki labels | `task`, `backend`, `event`, `model` on `api_request` and `tool_use`, `role` on an event of the stream tap | `feature`, `harness`, `event`, `role`, `model` on usage and tool events |
| Log scope; resource attributes | `specstride.ralph`; `service.name` `ralph`, `task`, `backend` | `specstride.export`; `service.name` `specstride`, `project`, `harness` |
| Time of an entry or record | Clock of the sink | `ts` of the event |
| Span names | `run <feature or task or run id>`, `phase <n>: <title>`, and the others of the table below | `specstride.<scope>` |
| Metric names | `specstride.*`; `ralph.*` in addition with `telemetry.otel.legacyMetricNames` | `specstride.*`; `ralph.*` in addition with `telemetry.otel.legacyMetricNames` |
| Events that project to nothing | Not shipped | Shipped |

### Scopes of a span

The opening and closing types are the types of the event catalogue of annex X §X.6 row 73. The as-is name is the span name of the baseline. A scope that has no as-is name exists in the new form only.

| Scope | Opens | Closes | Span name, new form | Span name, as-is form |
|---|---|---|---|---|
| `run` | `run.started` | `run.ended` | `specstride.run` | `run <feature, task or run id>` |
| `phase` | `phase.started` | `phase.ended` | `specstride.phase` | `phase <n>: <title>` or `phase <n>` |
| `attempt` | `attempt.started` | `attempt.ended` | `specstride.attempt` | `attempt p<phase>#<attempt>` |
| `pass` | `pass.started` | `pass.ended` | `specstride.pass` | `iter <iter>` |
| `verification` | `verification.started` | `verification.ended` | `specstride.verification` | `verification p<phase>` |
| `critic` | `critic.started` | `critic.call` and `verdict.recorded` | `specstride.critic.call` | `critic p<phase>#<attempt>` |
| `yield` | `yield.started`; in the as-is form `yield.waiting`, shipped as `yield_wait`, as the baseline | `yield.ended` | `specstride.yield` | `yield` |
| `long_job` | `job.started` | `job.ended` | `specstride.job` | `long_job` |
| `check` | `check.started` | `check.ended` | `specstride.check` | none |
| `pause` | `run.paused` | `run.resumed` | `specstride.pause` | none |
| `blocked` | `blocked` | `unblocked` | `specstride.blocked` | none |
| `stage` | `stage.started` | `stage.ended` | `specstride.stage` | none |
| `pipeline` | `pipeline.started` | `pipeline.ended` | `specstride.pipeline` | none |
| `diagnosis` | `recovery.diagnosis_started` | `recovery.diagnosis_done` and `recovery.diagnosis_failed` | `specstride.recovery.diagnosis` | none |
| `group` | `parallel.group.started` | `parallel.group.ended` | `specstride.parallel.group` | none |
| `worker` | `parallel.worker.started` | `parallel.worker.ended` | `specstride.parallel.worker` | none |

The hierarchy is `run` under `pipeline` and `stage` where they exist, `phase` under `run`, `attempt` under `phase`, `pass` under `attempt`, and `check`, `job`, `yield` and the point spans under `pass`; `critic` under `attempt`; `diagnosis` under `phase`; `group` under `attempt` and `worker` under `group`; `pause` and `blocked` under `run`. In the as-is form only the first eight scopes exist.

### Attribute names

| Envelope id | Attribute |
|---|---|
| `runId`, `featureId`, `phaseId` | `specstride.run.id`, `specstride.feature.id`, `specstride.phase.id` |
| `attemptId`, `attempt` | `specstride.attempt.id`, `specstride.attempt.ordinal` |
| `passId`, `pass` | `specstride.pass.id`, `specstride.pass.ordinal` |
| `sessionId`, `parentSessionId` | `specstride.session.id`, `specstride.session.parent_id` |
| `cause` | `specstride.cause` |
| `role`, `harness`, `provider`, `model`, `strategy` | `specstride.role`, `specstride.harness`, `specstride.provider`, `specstride.model`, `specstride.strategy` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F128-SC-001**: Off by default. On a run with default configuration, 0 network connections are opened for telemetry and 0 files of a sink are written, in 100 per cent of the fixtures of the suite that has telemetry off.
- **F128-SC-002**: Delivery is visible. 100 per cent of the delivery attempts of both sinks have a delivery record whose sink label (`loki` or `otel`) equals the label a status surface queries, and a batch accepted by the stub sink raises the receiver state of that sink above `reachable` in 100 per cent of the cases.
- **F128-SC-003**: A sink never breaks the loop. In the 3 conformance fixtures (slow, throwing, dead) the exit code and the primary event file equal those of the run without the failing sink, byte for byte after normalization, on both sinks.
- **F128-SC-004**: No planted canary reaches a collector. On the release candidate with capture on, 0 of the canaries (every class of the pattern set, seven places) appear on any span, log record or Loki line at the stub sink and at a real collector.
- **F128-SC-005**: Content follows traces. With traces on and nothing else set, 100 per cent of the spans of a pass and of a critic call carry content or its reference; with capture off, 0 spans carry content.
- **F128-SC-006**: The payloads equal the baseline. On the scenarios `loki-payload`, `otlp-payload` and `sink-down` of FX-31 under the `parity` profile, 0 results `different` after N-26; the scenarios `metric-names` and `delivery-status` are `waived (DV-058)`.
- **F128-SC-007**: Spans are built at emit time. In 100 per cent of the runs of the fixtures with traces on, every closed pair has one span with the start time of its opening event, and no span is built from a file read at shipping time.
- **F128-SC-008**: A real collector receives the run. In the end-to-end test against a real collector, the logs, the metrics and the traces of one fixture run are accepted, and the delivery records say `accepted`.
- **F128-SC-009**: Every kept as-is item has a proof. The 14 ported items, the 175 translated items and the 2 items of F128 with the disposition superseded are each named by a requirement or by the table "As-is behaviour not carried"; 100 per cent of the requirements have a named test.
- **F128-SC-010**: The doctor facts are complete. In 100 per cent of the configurations tested, the facts of F128-FR-041 (address, traces, capture, pattern set version) are present and equal the configuration.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| One OTel exporter for the whole product | Decision 11 |

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-08 | `specstride.event-sink/1` | implements | The OTLP exporter and the Loki sink: the two Wave 1 implementations that feature 100 assigns to this feature. Both pass the conformance suite of the point |
| EP-08 | `specstride.event-sink/1` | consumes | The content accessor and the table of the compatibility projection that the core gives a sink |
| EP-10 | `specstride.secret-resolver/1` | consumes | Credentials of a collector, resolved at the moment of use |
| EP-14 | `specstride.doctor/1` | consumes | The facts for the check `telemetry.endpoint` |

This feature owns no extension point of its own.

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| Event sink, `specstride.event-sink/1` | C §C.10; F100-FR-104 to F100-FR-106 |
| Event envelope and versioning, `specstride.event/1` | X §X.1; F100-FR-198 to F100-FR-200 |
| Redactor, `specstride.redaction/1` | X §X.4; F100-FR-205, F100-FR-219 |
| Ingress | A §A.2; F100-FR-009 |
| Config envelope, ranks and trust classes, `specstride.config/1` | X §X.2; F100-FR-201 to F100-FR-203 |
| Secret resolver, `specstride.secret-resolver/1` | C §C.11; F100-FR-107 |
| Doctor check registry, `specstride.doctor/1` | G §G.7; F100-FR-189 |
| The `parity` profile | X §X.7; F100-FR-210 to F100-FR-212; rows 16, 17, 42, 46 and 97 to 106 |
| Alias table, component-name table, rule N-26 | X §X.8; F100-FR-213, F100-FR-214. Seven as-is names of this feature are rows of §K.8 of feature 110, which completes that table (see "Repairs after the cross-feature review") |
| Logical name `run:<runId>:span-state` and its schema id `specstride.span-state/1` | B §B.5, §B.20; F100-FR-048, F100-FR-053 |
| Logical name `package:context-budget` | B §B.5 |
| Closed sets | X §X.6, rows 73 and 197 to 204; F100-FR-208 |
| Threats T-32, T-36, T-37 | X §X.9; F100-FR-216 |
| Release condition: the canary test | X §X.9; F100-FR-219 |
| Fixture family FX-31, stub sink (feature 141) | The section "How a feature cites the oracle", §O.2, §O.3, §O.4 (`telemetry`) |

## Rows of the `parity` profile

The rows of annex X §X.7 that this feature owns are 16, 42 and 97 to 106. The spellings are confirmed by feature 110.

| Switch or option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Content capture in telemetry | `telemetry.content` | `auto` (captured whenever traces are on) | `off` | 16 | DV-083 |
| As-is names of metrics | `telemetry.otel.legacyMetricNames` | off | off | 42 | DV-058 |
| Loki sink on | `telemetry.enabled` | off | off unless the fixture sets it | 97 (with the address) | DV-058 |
| Loki address | `telemetry.loki.url` | `http://localhost:3100` | the same | 97 | DV-058 |
| OTLP exporter on | `telemetry.otel.enabled` | off | off unless the fixture sets it | 98 (with the address) | DV-058 |
| OTLP address | `telemetry.otel.url` | `http://localhost:4318` | the same | 98 | DV-058 |
| Traces on when the exporter is on | `telemetry.otel.traces` | on | on | 99 | DV-058 |
| Attribute dialects | `telemetry.otel.dialects` | empty | empty | 100 | none |
| Content limits | `telemetry.contentMaxPromptBytes`, `telemetry.contentMaxReplyBytes` | 262144, 16384 | not used | 101 | DV-083 |
| Request time limit | `telemetry.loki.timeoutMs`, `telemetry.otel.timeoutMs` | 2500, 2500 | the same | 102 | DV-027 |
| Batch bound | `telemetry.loki.maxBatchBytes`, `telemetry.otel.maxBatchBytes` | 3145728, 3145728 | the same | 103 | DV-027 |
| Flush interval | `telemetry.flush.intervalMs` | 2000 | 0 (flush at every event) | 104 | DV-058 |
| Buffer of a sink | `telemetry.queueMaxEvents` | 10000 | not used | 105 | none |
| Collector credential | `telemetry.loki.auth`, `telemetry.otel.auth` | not set | not set | 106 | none |
| Form of a payload | follows `compat.legacyEvents` | new form | as-is form | 17 (owned by 144) | DV-007; DV-058 |

Row 46 of annex X §X.7, `telemetry.sinkTimeoutMs`, is owned by feature 111 and is used here.

## Closed sets

The sets below are rows 197 to 204 of annex X §X.6, owner 128.

| Set | Members | Unknown value |
|---|---|---|
| Sink labels of a delivery record | `loki`, `otel` | The record is not attributed to a sink; readers show `unknown` |
| Receiver states | `configured`, `reachable`, `request_accepted`, `query_verified` | Read as `configured` |
| Delivery reasons | `http_<status>`, `transport_error`, `queue_overflow`, `content_withheld` | Read as `transport_error` |
| OTLP signals | `logs`, `metrics`, `traces` | The signal is not sent |
| Attribute dialects | `specstride`, `genai`, `openinference` | Configuration error (the launch is refused) |
| Scopes of a span | The sixteen of "Scopes of a span" | An event of a type that opens an unknown scope is a point span |
| Metric names | The twelve of F128-FR-030, the six of F128-FR-032, the three of F128-FR-034 | A metric is not exported |
| Forms of a payload | as-is, new | The new form |

Delivery statuses (`attempted`, `accepted`, `failed`, `unknown`) are owned by feature 111.

## As-is behaviour not carried

| As-is id | Behaviour | Disposition | Register row |
|---|---|---|---|
| B-0568 | `proposer.sh` exits 1 when `-j` is given and the Loki shipper module is missing | superseded-by DV-065 | DV-065 (no interpreter and no shipper file exists in a Node product; the exit code does not exist) |
| B-0569 | `proposer.sh` exits 1 when `-j` is given and `python3` is not on the search path | superseded-by DV-065 | DV-065 |

Parts of carried items that are not carried:

| Part | Item | Register row |
|---|---|---|
| The fallback names `WIGGUM_LOKI_PORT`, `WIGGUM_OTEL_PORT`, `WIGGUM_OTEL_GRPC_PORT`, `WIGGUM_PROMETHEUS_PORT`, `WIGGUM_GRAFANA_PORT`, and the project name `wiggum-telemetry` | B-2442 to B-2446; B-2448 | DV-036 |
| The exit code 2 of a usage error of the standalone shippers, their argument parser text and their interpreter messages | B-2280; B-2314 | DV-065 |
| The unredacted `result_preview` of 300 characters on every `api_request` | B-2297 | DV-107 (it is content: only while capture is on, redacted; a consequence of DV-083) |
| The rule that the events `agent_tool` of the tap do not feed the tool counter (two event names for one tool call) | B-2327 | DV-058 (one event type per tool call; the metric names are waived) |
| The status `otlp` of the delivery record of the OTLP shipper against the label `otel` that the status surfaces query | B-2422 | DV-058 (defect D-40 fixed; proven by CT-128-23) |

## Clarifications

### Session 2026-09-29

Answered from the sources. No question was put to a person.

- Q: Are traces on by default? -> A: No. The exporter is off by default, and traces are on only when the OTLP exporter is on and the traces signal is not switched off. A run with default configuration sends nothing. (Source: ruling 43; brief 128 heading 4; F100-FR-106)
- Q: Is content capture a separate switch or does it follow traces? -> A: It follows traces and can be switched off in user scope with `telemetry.content`; the research draft R14 that made it a separate opt-in is superseded by ruling 43. (Source: ruling 43; DV-083; F100 annex X §X.7 row 16)
- Q: What does content capture do under `parity`? -> A: It is off, so that the payloads at the stub sink compare with the baseline's. (Source: DV-083; LR-10; F100 annex X §X.7 row 16)
- Q: Under the `parity` profile the row for the old metric names says off. Do the parity payloads carry the old names? -> A: No. Row 42 says off, and the scenarios `metric-names` and `delivery-status` of FX-31 are waived by DV-058. F100-FR-212 asks for the value that reproduces the baseline where one exists; row 42 is read as written and the waiver carries the difference. (Source: F100 annex X §X.7 row 42; feature 141 §O.2; DV-058)
- Q: What does the content accessor of feature 100 allow the compatibility projection and this feature? -> A: Content reaches a sink only while capture is on (annex C §C.10). The projection reads its own snippets through the accessor (CQ-032). The exporter follows the switch, so under `parity` the field `result_preview` of the event `api_request` is absent from the payload. The baseline sends that field; the difference is register row DV-107, a consequence of DV-083, which carries the waiver on the two scenarios of FX-31 that feed a result record. (Source: F100 annex C §C.10; CQ-032; DV-083; DV-107; B-2279, B-2297)
- Q: Which names do the Loki lines, the log bodies and the spans use? -> A: Two forms. The as-is form follows the compatibility projection (`compat.legacyEvents`, which the `parity` profile turns on), so that the payloads compare with the baseline; the new form uses the schema and `specstride.*`. (Source: brief 128 heading 3; DV-058; F100 annex X §X.7 row 17)
- Q: Is the OTLP log body JSON, as R14 proposes, or the logfmt line of the baseline? -> A: The logfmt line, in both forms, so that one encoder feeds both sinks as at the baseline and in Lisa's package; a collector with a logfmt parser keeps working. (Source: B-2323; Lisa `packages/otel`; R14 OTel mapping)
- Q: How does OTLP delivery show as delivered? -> A: The delivery record of the OTLP exporter carries the label `otel`, the same as the status surfaces ask for. At the baseline the record said `otlp` and no record ever raised the displayed state. (Source: brief 128 heading 3, D-40; B-2422)
- Q: Where do spans keep their open state? -> A: At the logical name `run:<runId>:span-state`, in the control plane, written only by the exporter. (Source: F100 annex B §B.5)
- Q: Does the shipped stack gain a traces pipeline? -> A: No, on the baseline; recorded as CQ-127. Content then goes on spans that the shipped collector does not accept, and a consumer who wants traces uses a collector of their own. (Source: B-2458; brief 128 heading 1)
- Q: The shipped Loki listens on 3110 and the default address is 3100. Which one changes? -> A: Neither. The default address is preserved and the consumer passes the address of the stack. (Source: D-41; B-2447)
- Q: Are the compose ports published on all interfaces, as at the baseline? -> A: No. They are bound to loopback, because Grafana allows anonymous `Admin` and Loki has no authentication; the assets are not compared by the oracle. (Source: threats T-16 and T-32; R-3; B-2449, B-2450)
- Q: Does the exporter set `TRACEPARENT` in the environment of a harness process? -> A: Not here. A sink has no output that the run depends on (annex C §C.10); nesting of a harness's own spans belongs to the harness layer. Recorded for feature 109. (Source: F100 annex C §C.10; R14 OTel mapping)
- Q: Does the exporter warn when a harness has its own trace plugin with content on? -> A: Not here; that check belongs to the doctor and to the harness adapter of that harness. (Source: R14 content rule 6; R16 check 42)
- Q: Is more than one process ever the exporter of one run at the same time? -> A: No. One process writes the event file of a run at any moment, and the exporter is a sink of that writer, so it is the only writer of `run:<runId>:span-state`. After a relaunch the next engine start takes over the state. (Source: F100-FR-005 and annex C §C.10; annex B §B.5)
- Q: Is a failed batch retried or spooled? -> A: No. The baseline clears the buffers after a flush whether or not the push succeeded, and no ledger or spool file exists; the delivery record is the only evidence. (Source: B-2295, B-2334, B-2419; brief 128 heading 3)
- Q: Does a failed traces request change the delivery status of a batch? -> A: No. A collector without a traces pipeline must not mark the batch failed; it gives one warning. (Source: B-2333)
- Q: Where is a refusal of content recorded? -> A: As a delivery record with the status `attempted` and the reason `content_withheld`, because the four statuses are owned by feature 111 and the refusal is neither a transport failure nor a rejection. (Source: brief 128 heading 4; R11 R-3, T-32; feature 111 closed set of delivery statuses)
- Q: Where does the exporter get its spelling of keys? -> A: Annex X §X.7 where a row exists (`telemetry.content`, `telemetry.otel.legacyMetricNames`); otherwise the keys of R16 and the alias table of annex X §X.8, which feature 110 confirms. (Source: STAGE-B-TIER2-PROMPT)
- Q: How is the context-budget report an observability artifact? -> A: The figures of the build's report are offered as three gauge metrics at run start when the OTLP exporter is on and the report is present. (Source: brief 128 heading 4; R17, the startup check and the report)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary; no definition is repeated.
- The divergence register had 113 rows (DV-001 to DV-113) and the clarification queue ran to CQ-194 when this specification was written; on 2026-09-30 the register reaches DV-119 and the queue CQ-238. No row or question after DV-113 and CQ-194 is cited here.
- The behaviour of dsh, Codex, pi and prime is not visible here: their streams reach the exporter as events of the one flow.
- The exporter is a Node component. Its libraries and its file layout are in `plan.md`.
- The estimate of about 33 requirements is exceeded: this specification has 45. `analyze-report.md` proposes no split and names the group that would leave if one were wanted (F128-FR-042 to F128-FR-045).

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-119 | Annex C §C.10 does not say that a sink learns the as-is name of an event | The core gives a sink, in the context of `open`, read access to the table of the compatibility projection; annex C needs one sentence | F128-FR-009 |
| CQ-120 | Annex X §X.8 mapped `SPECSTRIDE_OTEL_STATE_DIR` to `telemetry.*`, and annex B fixes the place of span state | The variable is accepted and has no effect; the launch message says so. Annex X §X.8 now holds this reading | F128-FR-004 |
| CQ-121 | Which component prints the four summary lines of the stream (B-2285) | The presenter prints them in compatibility output from the events | F128-FR-024 |
| CQ-122 | Which label family of annex G §G.3 carries the start-up telemetry line | The as-is line text; the label is the printer's | F128-FR-029 |
| CQ-123 | Which logical name the context-budget report has | `package:context-budget`, annex B §B.5 | F128-FR-034 |
| CQ-128 | DV-083 says the baseline captures no content, while the baseline ships `result_preview` unredacted | The field is content: absent under `parity`; register row DV-107 carries the waiver on FX-31 | F128-FR-023 |
| CQ-124 | How the nonce of a critic call is masked in the content that the accessor returns | The critic prompt is exported only after the call returned, with the nonce replaced by its hash; features 101 and 111 own the mechanism | F128-FR-038 |
| CQ-125 | Threat T-16 (https outside loopback) is written for harness endpoints | It covers telemetry endpoints as well | F128-FR-040 |
| CQ-126 | Who registers the check `telemetry.endpoint` | The facts are given here; feature 112 registers the check | F128-FR-041 |
| CQ-127 | The shipped collector has no traces pipeline, while content goes on spans | No traces pipeline in the shipped stack | F128-FR-045 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place, by item of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused. No requirement was added: the count stays 45. One test name was added, CT-128-23.

| Requirement | Item | What changed |
|---|---|---|
| F128-FR-002 | W-110-03 | `RALPH_LOKI_URL` and `RALPH_OTEL_URL` are aliases through §K.8 of feature 110; the two `SPECSTRIDE_*` names through annex X §X.8 |
| F128-FR-004 | W-110-03 | `SPECSTRIDE_OTEL_TRACES` is an alias through §K.8 of feature 110, and no longer through annex X §X.8, which does not hold it; the text of `assumption: CQ-120` follows annex X §X.8 as it reads now |
| F128-FR-008 | W-X-11 | The `parity:` line names row 105 and row 46 of annex X §X.7 in place of "to be added" |
| F128-FR-009 | W-128-04 | "The event schema of feature 100" is the event catalogue (annex X §X.6 row 73) and the envelope (annex X §X.1); the catalogue type behind each of `api_request`, `tool_use` and `gate` is stated, and the exporter holds the three names, because the compatibility projection has no row for them; `gate` is shipped by no caller of the baseline (`lib/ralph_otel_ship.py:211` recognises it only) |
| F128-FR-010 | W-110-03; W-X-11 | The four `RALPH_*` names are aliases through §K.8 of feature 110, the two time limits converted from seconds to milliseconds; the `parity:` line names rows 102 to 104 |
| F128-FR-014 | W-128-04 | The as-is opener of the scope `yield` is `yield_wait` (`yield.waiting`), as the baseline; the new form opens at `yield.started` |
| F128-FR-018 | W-128-01 | The field `schema` holds `specstride.span-state/1` (annex B §B.20, F100-FR-048); there is no field `v` |
| F128-FR-023 | W-128-02 | `divergence:` gains DV-107; the `parity:` line names the waiver; `assumption: CQ-128` |
| F128-FR-026 | W-128-03 | The fix of defect D-40 is proven by the characterization test CT-128-23 (task T086) |
| F128-FR-034 | W-X-10 | The assumption cites annex B §B.5 for `package:context-budget` |
| F128-FR-036 | W-X-04 | The values of `telemetry.content` are `auto` (the default) and `off` |
| F128-FR-039 | W-X-33 | The pattern set and the canary test are cited by their contracts of feature 100 (annex X §X.4 and §X.9) in place of "feature 111" |
| F128-FR-040 | W-X-11 | The `parity:` line names row 106 of annex X §X.7 |

## Repairs after the analyze run of 2026-09-30

Requirements changed in place by the analyze run of 2026-09-30 (`analyze-report.md`, "Second analyze run"). No id was renumbered or reused, and no requirement or test name was added: the count stays 45.

| Requirement | Finding | What changed |
|---|---|---|
| F128-FR-003 | C6 | The four flags are short flags of feature 110; the exporter reads the resolved keys only (proposal U1) |
| F128-FR-005 | C6 | The flags and the combination rule belong to the flag layer of feature 110 (proposal U1) |
| F128-FR-016 | C14 | `input.value` and `output.value` are named as the exception to the prefix `specstride.` |
| F128-FR-023 | C10 | `origin:` gains the cluster C-183 |
| F128-FR-030 | C7 | `specstride.run.state` carries the attribute `state` |
| F128-FR-035 | C1 | Span ids are random; the trace id follows F128-FR-017 |
| F128-FR-038 | C4 | The reference of the reply is named: `specstride.reply.path`, `specstride.reply.sha256`, `specstride.reply.bytes` |
