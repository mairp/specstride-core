# Feature Specification: Stream seam and invocation

**Feature Branch**: `126-stream-seam-and-invocation` (a label: Spec Kit creates no branch in this repository; the directory is `specs/126-stream-seam-and-invocation`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 126-stream-seam-and-invocation: reading what a harness emits. The registry of stream readers by format, the six normalized records, synthesis of init and terminal for a text stream, the data stream mapping, the tap and its pass-through mode, fallbacks when a stream is missing or malformed, truthful and hostile streams, invocation identity, the invocation record and result, reconciliation of a finished invocation, finalization, and retention of streams and transcripts."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 5, 7, 12, 17), `consolidation.md` (D-48, D-54, DV-007, DV-065, DV-083), `feature-briefs.md` (brief 126), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, X), feature 141 (fixture family FX-26), and research R14, R18, R11, R9, R5, R20, R27.

## What this feature is

A harness tells the product what it did through a stream: lines on its output. This feature reads that stream and turns it into a small set of normalized records, whatever the harness. It also keeps the identity and the outcome of every invocation of a harness.

- **The seam.** A registry maps a stream format to a reader. A reader produces six kinds of normalized record: `init`, `text`, `tool`, `usage`, `error`, `terminal`. A text stream gets an `init` and a `terminal` made up by the seam. A format that is only data (a mapping) needs no code.
- **The tap.** It sits between the harness process and the rest of the pass. It reads each line, hands records to the one event writer, prints the human summary, and passes text through when the format is unknown or the reader cannot start.
- **Truth and hostility.** A stream that ends without a terminal record is reported, never guessed. A stream is untrusted text: only the harness's own framing is parsed.
- **The invocation.** Every call of a harness has an identity, an invocation record, a producer status, a provider terminal, and one result written once. Finalization reconciles them into a decision for the breakers. Retention bounds what is kept.

The events that follow from stream records are defined by feature 111 and written by the one event writer; this feature emits them. The harness adapters start and stop the process; this feature reads what the process printed.

**In scope**: the registry of stream readers and the normalized records; the data stream mapping; synthesis of `init` and `terminal`; the tap and its pass-through mode; the fallbacks; truthfulness and hostile-stream rules; usage, tool and session facts taken from records; invocation identity, record, producer status, provider terminal, result, reconciliation, finalization; retention of streams and transcripts.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Starting and stopping the harness process | 109; the harness adapters 125, 130, 131, 134, 138 |
| The event types and their fields; the writer | 111 (this feature emits) |
| Shipping to a collector | 128 |
| The compatibility projection sink and its table: the old vocabulary and the shapes of the old lines | 144 (this feature emits the events; F126-FR-021 states what they project to) |
| Watchdogs that read stream activity; the kill at a ceiling | 118 |
| The JSONL reader for stream schema version 3 and its dialect table | 138 (one row is 134's). The reader registers in this feature's registry |
| The stream mappings of dsh (a text stream) and of Codex (JSONL events), as data | 130, 131 |
| The order of records of several workers | 142 (the fields are 111's) |
| Stream readers for harnesses of later waves | Roadmap |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every harness reads the same way (Priority: P1)

The engine runs a pass on any harness. It gets the same six kinds of record whether the harness prints a structured stream or plain text, and it never asks which harness it is.

**Why this priority**: The engine, the watchdogs, the telemetry and the breakers read these records. A different shape per harness would put harness names into the core.

**Independent Test**: Replay a recorded stream of each format through its reader and check the records; then replay a plain-text stream and check that `init` and `terminal` are synthesized and marked so.

**Acceptance Scenarios**:

1. **Given** a recorded Claude stream, **When** the reader runs, **Then** it yields `init`, `text`, `tool`, `usage` and one `terminal` with the fields of the baseline (F126-FR-003; `usage` as F126-FR-023 says).
2. **Given** a text stream, **When** the pass ends, **Then** one `init` and one `terminal` exist and both are marked synthesized (F126-FR-008).
3. **Given** a stream format that only a data mapping describes, **When** the conformance suite runs, **Then** it passes with no code added (F126-FR-007).

---

### User Story 2 - A stream that lies or stops is seen for what it is (Priority: P1)

A stream ends without a terminal record, or tool output imitates one, or a line is enormous. The operator wants the product to say so, and not to be fooled.

**Why this priority**: Principle XI. A false terminal record would make a failed pass look finished.

**Independent Test**: Feed a stream whose tool output contains a line that looks like a terminal record; feed a line over the size cap; cut a stream before its terminal record.

**Acceptance Scenarios**:

1. **Given** tool output that imitates a terminal record, **When** the reader runs, **Then** no record comes from it (F126-FR-018).
2. **Given** a stream that ends with no terminal record, **When** the pass ends, **Then** `stream.missing_terminal` is emitted and the terminal is synthesized with unknown values as `null` (F126-FR-017).
3. **Given** a line over the cap, **When** it is read, **Then** it is dropped and `stream.diagnostic` says so (F126-FR-018).

---

### User Story 3 - Every pass is accounted for (Priority: P1)

The owner wants to compare strategies on cost. Every pass, a killed one included, must carry its usage or say it has none.

**Why this priority**: No paired run counts until cost is counted for every pass (experiment X0).

**Independent Test**: Kill a stub pass in the middle of a stream that has reported usage twice; check that the pass ends with the partial usage and `usageComplete=false`.

**Acceptance Scenarios**:

1. **Given** a harness that reports usage per model call, **When** a call completes, **Then** `usage.reported` is emitted at once (F126-FR-023).
2. **Given** a pass killed mid-stream, **When** it ends, **Then** the last partial usage is kept and `usageComplete` is false (F126-FR-023).
3. **Given** a harness that reports no usage, **When** a pass ends, **Then** `usage.unavailable` is emitted with the reason (F126-FR-023).

---

### User Story 4 - An invocation is reconciled once (Priority: P1)

When a pass ends, the product joins what the process did (exit code, signal, time) with what the stream said (terminal record, malformed or not) into one result and one decision for the breakers.

**Why this priority**: The breakers act on this decision. Two results for one invocation, or a result that changes later, would break the loop.

**Independent Test**: Reconcile each of the 12 outcomes of F126-FR-033 from prepared records, `missing_terminal` in both of its cases; finalize an invocation a second time and check that nothing changes.

**Acceptance Scenarios**:

1. **Given** a producer that timed out, **When** the invocation is finalized, **Then** the reason code is `timeout` (highest precedence) (F126-FR-033).
2. **Given** a finalized invocation, **When** it is finalized again, **Then** the result record is read as it is and no second result event is written (F126-FR-035).
3. **Given** an active invocation, **When** the retention sweep runs, **Then** it is skipped (F126-FR-037).

---

### User Story 5 - The oracle sees the old stream (Priority: P2)

The parity oracle replays the fixtures of family FX-26 and compares the compatibility projection with the baseline.

**Why this priority**: Parity binds every release.

**Independent Test**: Run FX-26 under the `parity` profile; the results are `equal`.

**Acceptance Scenarios**:

1. **Given** the `parity` profile, **When** a Claude stream is read, **Then** the projection holds the as-is events and the tap prints the as-is lines (F126-FR-013, F126-FR-021).
2. **Given** the `parity` profile and a pass-through, **When** lines with blanks arrive, **Then** blank lines are dropped and whitespace is stripped (F126-FR-015).

---

### Edge Cases

- A reader throws on one line: the line is skipped, the stream is flagged malformed, only the first three faults give a diagnostic (F126-FR-016).
- The reader of a format cannot start: the tap becomes a pass-through and says so (F126-FR-014).
- The consumer of standard output has gone (broken pipe): the read loop ends silently and the final flush still runs (F126-FR-016).
- The local append of an event fails: the event is dropped, counted in `event.dropped`, and reaches no sink; the pass goes on (F126-FR-016).
- A replacement tap cannot be started, fails or does not end: the pass does not fail, and the exit goes to the producer status (F126-FR-011).
- A harness that the consumer declared has the data of a Wave 1 harness under another id: it is read the same way (F126-FR-039).
- A terminal record arrives twice from a wrapped reader: the second is dropped with a warning (F126-FR-009).
- A harness exits 0 after a provider error: the terminal record decides (F126-FR-010).
- An invocation record for a pass already exists: creation is refused (F126-FR-028).
- Under the `parity` profile a pass on the legacy path has no invocation record and no finalization (F126-FR-012, F126-FR-029).

## Requirements *(mandatory)*

### Functional Requirements

#### G1 - Reader registry, normalized records, data mapping

- **F126-FR-001**: There MUST be one registry from `stream.format` to a stream reader. A format name or alias MUST match lower-case letters, digits and hyphens, start with a letter, end with a letter or digit and hold at least two characters. A canonical name or an alias MUST resolve to the same row; an unknown name MUST resolve to nothing. A repeated name or alias, an invalid name, an empty capability reason, a row that declares `synthInit` together with an initial record, a tool name outside the canonical vocabulary of F126-FR-004, and a capability list that is empty, out of order, repeating or holds an unknown signal MUST each refuse the registration with a message that names the fault. A row MUST hold: canonical name, aliases, capability reason, capability signals (default `init,text,tool,evidence,result`), and the options `hasInitRecord` (default true), `synthInit`, `synthTerminal`, `noActivity`, `trackTerminal`, `terminalDecides` (default false), `listedAsIs` (default false; set only on the rows `claude` and `prime-v3`, which the baseline had). The names `claude` (alias `claude-stream-json`) and `prime-v3` MUST stay registered; `prime-v3` resolves to the JSONL reader with the dialect of prime. A format is resolved once per run from the registry field of the harness; an empty value means plain-output parsing with no routing.
  - origin: C-146; B-2118; B-2119; B-2121; B-2389; B-2394; B-2395; B-2396; B-2397; B-2398; B-2399; B-2400; B-2402; B-0675; B-2429; B-2071
  - disposition: ported
  - test: PT-126-C-194-registry
  - ep: EP-02 `specstride.harness/1` (implements, sub-point stream readers)

- **F126-FR-002**: A stream reader MUST produce only the six kinds of normalized record `init`, `text`, `tool`, `usage`, `error`, `terminal`. `init` MUST carry model, the tool list or its count, the session id and, where the stream states them, sandbox mode and network state. `text` MUST carry one non-empty block of assistant text. `tool` MUST carry the canonical tool name, the target, the targets, the tool id where there is one, the category and the duration. `usage` MUST carry the fields of the cost record (input, output, cache read, cache write, reasoning tokens, cost, scope, cumulative flag, `usageId`), with null for a value the harness did not report. `error` MUST carry a code and a message. `terminal` MUST carry status, stop reason, model, duration, number of turns, tokens and cost, with null where unknown. A record of another kind MUST be dropped and a `stream.diagnostic` emitted (closed set row 38 of annex X §X.6).
  - origin: C-149
  - disposition: translated
  - test: PT-126-C-149-records
  - divergence: DV-007
  - ep: EP-02 `specstride.harness/1` (implements)

- **F126-FR-003**: The reader of the `claude` format MUST map a `system`/`init` record to `init` (model, count of the tools list), each non-empty assistant text block to `text`, each `tool_use` block to `tool`, and the `result` record to `terminal`. The terminal MUST take status from `is_error`, stop reason from `subtype`, model from the last model seen, duration, turns, input and output tokens from `usage`, cache read from `usage.cache_read_input_tokens`, cache creation from `usage.cache_creation_input_tokens`, and cost from `total_cost_usd`, which MUST be labelled an estimate. A `result` with `is_error` true MUST give the reason code `provider_error` with the record's `result` text, or `Provider reported an error`. The text of an `agent_text` event MUST be whitespace-collapsed and cut to 160 bytes.
  - origin: C-154 B-2117; B-2116; C-149 B-2082; C-151 B-2094
  - disposition: ported
  - test: PT-126-C-154-claude-reader
  - status: unverified (check: a recorded live stream of the current Claude CLI passes the reader and the shapes of `system/init` and `result` match; verified-on: —; pin: version of the CLI at the capture)

- **F126-FR-004**: The target of a tool call MUST be found in this order: for `Bash` the `command`, else the `description`; otherwise the exact top-level keys `file_path`, `path`, `notebook_path`, `command`, `pattern`, `url`, `query`, `skill`, `description`, `prompt`, `subject`, then their camelCase forms converted to snake_case, then a search of nested values that does not expand a dictionary deeper than 6 levels and stops after 256 values, returning an empty target. A target MUST be collapsed to one line and cut to 120 characters, the last replaced by `…` when cut. The tool name MUST be mapped to the canonical vocabulary `Read`, `Write`, `Edit`, `MultiEdit`, `NotebookEdit`, `Bash`, `Glob`, `Grep`, `Task`, `TodoWrite`, `WebFetch`, `WebSearch`; a name the reader does not map MUST pass through unchanged.
  - origin: C-194 B-2383; B-2384; B-2385; B-2387; B-2390; B-2393
  - disposition: ported
  - test: PT-126-C-194-tool-target
  - ep: EP-02 `specstride.harness/1` (implements)

- **F126-FR-005**: The tap MUST emit `evidence_writing` at most once per pass, and only when an expected evidence path was given. Only a call of the tools `Write`, `Edit`, `MultiEdit`, `NotebookEdit` or `Bash` MAY trigger it, and only when a path extracted from the call as text, or the display target, resolves to exactly the expected evidence path, given as an absolute path with the user's home expanded and links resolved. Nothing from the stream MUST be executed. It MUST carry tool, target (the expected path), `match=exact-expected-target` and the tool id where there is one.
  - origin: C-149 B-2085; C-191 B-2377; C-194 B-2386; B-2391; B-2392; C-147 B-2070; C-166 B-2191
  - disposition: ported
  - test: PT-126-C-194-evidence-writing

- **F126-FR-006**: The seam MUST announce the capability of a format at the start of an invocation: mode `structured` with the signals of the row when the format is registered, mode `raw-text` with reason `structured schema unavailable — parsing plain output` and signals `text,result` when it is not, and mode `degraded` with signals `result` when the reader of the format fails to start or when a diagnostic with code `unsupported_schema` or `absent_schema` arrives while the mode differs. Other diagnostics, such as `malformed_json`, MUST NOT change the mode. The modes are the closed set `structured`, `raw-text`, `degraded`; the signals are `init`, `text`, `tool`, `evidence`, `result`, in that order. The announcement MUST carry mode, reason, provider format, role and supported signals; a registered format whose route falls back MUST also be announced, per pass, with `mode=raw-text`, the route reason, role, provider format and signals `text,result`.
  - origin: C-149 B-2086; B-2087; B-2089; C-151 B-2096; B-2097; C-154 B-2123; C-166 B-2186; C-194 B-2388; C-053 B-0548; B-2425
  - disposition: translated
  - test: PT-126-C-149-observability
  - divergence: DV-007

- **F126-FR-007**: A new stream format MUST be addable as data, through the descriptor fields `stream.mapping` (selector of the record kind and field paths), `stream.usage`, `stream.tolerate` and `stream.dialect`, with no code and no change of a core file. A mapping MUST reach only the six normalized records. The conformance suite MUST replay recorded streams through every registered reader and MUST include a sample reader given as data only, held in the test tree. This feature MUST register the rows `claude`, `text`, `sse-openai` and `sse-anthropic` (F126-FR-040); the JSONL reader for stream schema version 3, its dialect table and the rows `jsonl` and `prime-v3` are feature 138's and MUST register in this registry; the readers of dsh (text) and of Codex (JSONL events) are data of their harness adapters. A stream whose format is unknown MUST fall back as in F126-FR-014.
  - ep: EP-02 `specstride.harness/1` (implements, sub-point stream readers)
  - test: CT-126-1

- **F126-FR-008**: For a text stream the reader MUST synthesize `init` on the first consumed record (model: the invocation model, where one is known, else null; tool list null) and `terminal` at the end of the stream when the format row declares `synthInit` and `synthTerminal`. A synthesized record MUST be marked synthesized. The tap MUST print a synthesized init as `  · init model=<model|?>` with no tools count, and a synthesized terminal for a stream that ended without one as `  ✗ result: missing_terminal (stream ended before result)`. The invocation model MUST reach the wrapper (F126-FR-009) only for a registry-routed pass (F126-FR-039) with a resolvable model. Under the `parity` profile a record synthesized for a text stream MUST project to no as-is event and MUST NOT change what is printed: a pass whose entry of the resolved registry names no stream format runs unpiped, and its raw output goes to the standard output and error of the pass. The condition is read from the entry and never from the name of the harness. Examples under the `parity` profile: the entries of dsh and of Codex, whose harness adapters name no stream format there.
  - origin: C-191 B-2378; C-192 B-2380; C-193 B-2381; B-2382; C-147 B-2072; C-058 B-0748; B-0754
  - disposition: ported
  - test: PT-126-C-191-synthesized
  - parity: text streams are unpiped and synthesized records project to nothing (rows 17 and 18 of annex X §X.7)

- **F126-FR-009**: A reader MUST be wrapped when its format row declares at least one of `synthInit`, `synthTerminal`, `noActivity` and `trackTerminal` (for a format of the JSONL family, `trackTerminal` of the row of the dialect table, F126-FR-039); this is the wrapper. A terminal that a wrapped reader delivers after the pass already had one MUST be dropped and a diagnostic with code `duplicate_terminal`, severity `warning` and message `duplicate terminal dropped: the pass already had one` MUST be emitted; the first decides. A reader that is not wrapped hands every terminal on as it arrives, as at the baseline. Finishing a stream MUST be done at most once per pass and MUST be idempotent; a fault in it MUST be handled as a fault of consuming (F126-FR-016). The wrapper MUST offer raw consumption only where the inner reader does.
  - origin: C-191 B-2379; C-194 B-2403; C-154 B-2142
  - disposition: ported
  - test: PT-126-C-191-duplicate-terminal

- **F126-FR-010**: Where the format row sets `terminalDecides`, or, for a format of the JSONL family, the row of the dialect table that `stream.dialect` names sets it (annex C §C.5), and for every harness whose process exits 0 on a provider error, the outcome of the call MUST be taken from the terminal record and not from the exit code. A provider terminal that reports an error MUST give the reason code the provider gave (for example `provider_auth`), else `provider_error`, with the provider's own text; `provider_auth` MUST carry `Provider authentication failed` when the provider gave no text. A stream without a terminal MUST NOT decide a call.
  - origin: C-164 B-2166; B-2176
  - disposition: ported
  - test: PT-126-C-164-terminal-decides
  - status: unverified (check: the stream of pi in JSON mode gives a terminal record on a provider error and its exit code is captured; verified-on: —; pin: pi version of the fixture capture)

#### G2 - Tap, pass-through, fallbacks, truthfulness

- **F126-FR-011**: The stream tap MUST be an internal function that reads the stream of one pass line by line, hands each record to the event writer, prints the human summary, and returns; it MUST NOT be a public command. It MUST flush its standard output after each processed record so the summary is live. The as-is variable names `SPECSTRIDE_AGENT_STREAM` (default true; false restores raw output), `SPECSTRIDE_EVENTS`, `SPECSTRIDE_BACKEND_LABEL`, `SPECSTRIDE_TASK`, `SPECSTRIDE_ROLE`, `SPECSTRIDE_INVOCATION_ID`, `SPECSTRIDE_AGENT_TAP`, `SPECSTRIDE_RUN_ID` and `SPECSTRIDE_FEATURE` MUST stay as aliases of keys through the alias table of annex X §X.8. The names `SPECSTRIDE_EVENTS`, `SPECSTRIDE_RUN_ID`, `SPECSTRIDE_TASK`, `SPECSTRIDE_FEATURE`, `SPECSTRIDE_BACKEND_LABEL` and `SPECSTRIDE_ROLE` MUST be exported to the processes of a pass only while `compat.legacyEvents` is on. A tap executable given by `stream.tapExecutable` (alias `SPECSTRIDE_AGENT_TAP`) MUST replace the built-in tap and receive the same context; it is a widening key. The replacement tap MUST be started from an argument list with no shell, MUST have the stream of the pass as its only standard input, and MUST never wait for a human: it has no terminal. It is a process of the pass: it MUST be entered in the process registry with class `owned` (annex B F100-FR-063) and MUST end with the pass. A replacement tap that cannot be started, that fails or that does not end MUST never fail the pass: its exit goes to `parser_exit_code` of the producer status (F126-FR-030), and the pass ends as F126-FR-014 and F126-FR-016 say. The switch to turn the tap off is `stream.tap`.
  - origin: C-052 B-0495; B-0496; B-0498; B-0499; B-0502; B-0505; B-0535; C-148 B-2077; B-2078; B-2079; B-2080; B-2081; C-146 B-2059; C-154 B-2141
  - disposition: translated
  - test: PT-126-C-148-aliases; CT-126-10
  - divergence: DV-027
  - parity: `stream.tap` on; `stream.tapExecutable` unset (rows 79 and 80 of annex X §X.7)

- **F126-FR-012**: The context of a tap call MUST hold: event destination, run id, project name (as-is `task`), feature, role, harness label, phase, attempt, iteration, invocation id, expected evidence path, provider format, invocation model, the provider-terminal destination, and the sinks to open. A role MUST be a role of the role registry; under the `parity` profile the roles are `proposer`, `accelerator`, `critic`, and any other value MUST refuse the call with exit code 2 before any input is read. Identity MUST be validated before input is read: phase at least 0, attempt at least 1, iteration at least 1 for a proposer or accelerator and at least 0 for a critic, and integers only, booleans excluded; a failure MUST give the message of the baseline, end the tap without consuming input and never fail the pass. Where all of run id, feature, role, harness label, phase, attempt and iteration are present, the call is correlated: every record carries the eight identity fields and the tap emits no `agent_result` (the finalization does, F126-FR-035). Otherwise the call takes the legacy path: records carry `run_id`, `task` and `backend` where non-empty and the iteration as `iter`, and the tap emits `agent_result` on the terminal; a legacy Claude stream yields exactly `agent_init` to `agent_result` with no observability announcement at the start. Under the `parity` profile the legacy path MUST be taken by a tapped pass that is neither registry-routed nor terminal-tracked (F126-FR-039), and a pass that is registry-routed or terminal-tracked MUST be correlated. A terminal-tracked pass MUST be given as the provider format the canonical name of its format row, or, for a format of the JSONL family, the `providerFormat` of the row of the dialect table that `stream.dialect` names, and the provider-terminal destination. These conditions are read from the format row and from the entry of the resolved registry, never from the name of the harness. Example under the `parity` profile: a pass of prime, whose descriptor names the row `prime` of the dialect table, whose `providerFormat` is `prime-v3` and which sets `trackTerminal` (annex C §C.5, confirmed by the second pass of feature 100, item A31); its tap call carries `--provider-format prime-v3`, as at the baseline.
  - origin: C-147 B-2060; B-2061; B-2062; B-2063; B-2064; B-2065; B-2066; B-2067; B-2068; B-2069; B-2072; B-2073; C-150 B-2092; C-154 B-2124; B-2128; B-2132; B-2133; B-2139; C-166 B-2188; B-2189; B-2192; C-051 B-0478; C-058 B-0746; B-2430
  - disposition: translated
  - test: PT-126-C-147-context
  - divergence: DV-066
  - assumption: CQ-227 (`trackTerminal` is the condition of a terminal-tracked pass; annex C §C.5 puts it on the row of the dialect table, and the row of prime sets it); N-126-1 (for a format of the JSONL family the provider format is the `providerFormat` of the dialect row)

- **F126-FR-013**: The tap MUST print these lines, byte for byte, under the compatibility output: `  · init model=<model|?> tools=<count>` on `init`; `  ✓ result: <subtype>  cost=$<4 decimals>  turns=<n>  out_tok=<n>  <duration>ms` on `terminal`, also when it is an error; the redacted text of each assistant text block with no prefix, its whitespace kept and cut at the policy text limit; `  → <tool> <target>`, or `  → <tool>` without a target, on `tool`; `  ✗ result: missing_terminal (stream ended before result)` on a stream that ends without one. When the destination of a sink cannot be opened it MUST write `agent_stream: Loki disabled (<error>)` or `agent_stream: OTEL disabled (<error>)` to standard error and go on without that sink; when the provider-terminal record cannot be written, `agent_stream: terminal sidecar write failed (<error>)`; on an unexpected fault, `agent_stream: fatal (ignored): <error>`. The listing of formats MUST print the canonical names one per line in registration order, without aliases, and MUST return before reading input; under the `parity` profile it MUST list only the rows that set `listedAsIs` (F126-FR-001), that is `claude` then `prime-v3`, as at the baseline, whatever else is registered.
  - origin: C-153; C-147 B-2076; C-022 B-2432
  - disposition: ported
  - test: PT-126-C-153-lines
  - parity: no line without an as-is equivalent is printed (row 19 of annex X §X.7)

- **F126-FR-014**: The stream route MUST be resolved once per run. A named format MUST be routed only when the stream is on, the format is registered, and its reader can start. Otherwise the pass MUST fall back to parsing plain output, and the route reason MUST be one of `structured capture disabled by SPECSTRIDE_AGENT_STREAM=false — parsing plain output` and `stream format '<fmt>' has no registered adapter — parsing plain output`; the reason is announced per pass for a registered format. When the format is unknown or the reader fails to start, the tap MUST become a pass-through (F126-FR-015). When the reader fails to start, the tap MUST emit, on the legacy and on the correlated path, the announcement of mode `degraded` with reason `stream adapter for '<format>' failed to start — parsing plain output`; for an unknown format the announcement is the one of mode `raw-text` of F126-FR-006, on the correlated path only, as at the baseline. In a structured pipeline the standard output and error of the harness MUST be merged into the tap; the pass MUST end with status 0 whatever the producer and parser exits were, which go to the producer status (F126-FR-030). With neither tap nor shipper, the harness MUST run unpiped. With `invocation.debug` on, the merged output MUST also be kept in the response file of the pass, and the exit of the tap MUST be read from the last stage. A registry-routed pass MUST carry the tap arguments `--expected-evidence`, `--provider-format` and the provider-terminal destination in addition to the always-present ones.
  - origin: C-055 B-0598; B-0600; B-2426; B-2428; C-058 B-0675; B-0750; B-0751; B-0752; B-2429; C-154 B-2136; B-2122
  - disposition: ported
  - test: PT-126-C-055-fallbacks
  - divergence: DV-065

- **F126-FR-015**: Pass-through mode MUST strip leading and trailing whitespace from each line and MUST drop blank lines before anything is printed or parsed, so it is not byte-identical to the harness's output. In pass-through every non-blank line MUST be printed with its surrounding whitespace stripped and no record MUST be derived. In record mode a line that is not JSON MUST be printed raw when the reader has no raw consumption, and given as raw text to the reader that has it. This is a preserved defect (D-54) and MUST hold under every profile.
  - origin: C-154 B-2135; B-2137
  - disposition: ported
  - test: PT-126-C-154-pass-through

- **F126-FR-016**: The tap MUST never fail the pass. Only the first three faults of a reader per pass MUST give a diagnostic with code `adapter_error`, severity `error` and the exception text cut to 200 characters; later faults MUST only be counted. Every fault MUST set the malformed-stream flag and skip the offending line. A diagnostic with code `malformed_json` MUST set the flag. A failure to append an event locally MUST never fail the tap or the pass. It is handled by the one event writer (annex C §C.10, local first; annex X §X.1; feature 111 owns the rule, F111-FR-019): the event is dropped, uses no `seq`, is counted in `event.dropped`, and reaches no sink. The baseline shipped such an event to the remote sinks (B-2112); this is an intended difference. A broken pipe on the output MUST end the read loop silently with the final flush still run. An interrupt MUST be swallowed silently. A termination signal MUST set a stop flag that ends the loop at the next line, after which finishing, the flush and the provider-terminal write still run. The exit of the tap MUST be 0 in every case except an invalid context (F126-FR-012).
  - origin: C-154 B-2134; B-2138; B-2112; B-2143; B-2144; B-2131; C-149 B-2088; C-150 B-2093
  - disposition: translated
  - test: PT-126-C-154-faults; CT-126-11
  - divergence: DV-115
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F126-FR-017**: The stream MUST be truthful. When a stream of a format that has a terminal record ends without one, the seam MUST emit `stream.missing_terminal`, synthesize a terminal with status `error`, reason code `missing_terminal` and reason `Provider stream ended without a terminal result`, marked synthesized, and set every value it does not know to null. Compatibility behaviour for a harness that emits no terminal record at all MUST be kept: a crashed pass reads as clean, and no result is derived (D-48); the new event makes it visible and changes no outcome. A pass that exits 0 having done nothing MUST be flagged (option `stream.noActivityFlag`): when the format opts in or the option is on, a success terminal MUST gain the additive field `noActivity` true if no `tool` and no `evidence_writing` record was seen in the pass, and `status`, reason code and `is_error` MUST NOT change.
  - origin: C-151 B-2095; C-194 B-2404; C-153 B-2104
  - disposition: ported
  - test: PT-126-C-151-truthful
  - divergence: DV-101
  - parity: `stream.noActivityFlag` off (no format opts in at the baseline) (row 82)

- **F126-FR-018**: Hostile streams. A reader MUST parse only the harness's own framing (one document per line from the harness's output). The output of a tool MUST never become a stream record, and a line inside tool output that imitates a terminal record, a cost figure or a tool event MUST produce none. A line over the size cap or over the rate cap MUST be dropped, and a `stream.diagnostic` with code `line_too_long` or `line_rate_exceeded` MUST be emitted; a line dropped MUST count toward the malformed-stream flag. The caps are `stream.limits.lineBytes` (default 1048576) and `stream.limits.linesPerSecond` (default 5000); under the `parity` profile they are off, as at the baseline. Unknown values in a record MUST be null and never guessed.
  - divergence: DV-102
  - parity: caps off (row 81 of annex X §X.7)
  - test: CT-126-2
  - assumption: CQ-104

- **F126-FR-019**: Text from a stream MUST enter through the one ingress: it MUST be redacted and cut to a size cap before any sink, prompt or record sees it (annex A F100-FR-009). Fields named `text`, `message`, `summary`, `result_summary` or `target` MUST go through text redaction and cutting and add `redacted`, `truncated`, `original_bytes`, `retained_bytes` unless present; every other field MUST be sanitized structurally. A field whose value is null MUST be dropped before writing. The policy limits MUST be those of the baseline (the keys `observability.limits.*`, row 44 of annex X §X.7, which feature 111 owns) and no variable or flag of the baseline changes them. A sink that ships remotely MUST receive a second structural sanitization of the already sanitized fields, and the local line MUST NOT be rewritten by it. Event files hold references and no content.
  - origin: C-154 B-2114; B-2115; B-2127; B-2129
  - disposition: ported
  - test: PT-126-C-154-ingress
  - divergence: DV-083

- **F126-FR-020**: Records of a pass MUST reach the sinks through the one event writer, after it has written them (annex C §C.10). The tap MUST NOT own an event file. What a sink receives MUST be the event of annex X §X.1 whole and redacted, as the writer wrote it: with `ts`, with `type`, with the identity fields of the envelope and with the position `seq`. No field of the envelope MUST be removed or renamed on the way to a sink. The as-is form, the written record minus `ts`, `time` and `event` with the position named `sequence`, is the form of the compatibility projection only: under `compat.legacyEvents` a sink that ships the as-is payload builds it from the whole event and from the table of the compatibility projection, which the context of `open` gives it, so that the as-is payload carries the same identity and `sequence` as the projected local line. Where no sink is open, no delivery record MUST be produced. A provider terminal MUST be the completion barrier: all sinks MUST be flushed and their delivery records written when a terminal is seen, and again at the end. The context of `open` for a tapped pass MUST carry the labels `job=ralph` and `task` and `backend` where given (for a Loki sink), and `service.name=ralph` with `task` and `backend` (for an OTLP sink); the sinks are opened only where enabled.
  - origin: C-152 B-2098; C-154 B-2113; B-2130; B-2140; B-2125; B-2126; C-147 B-2074; B-2075; C-058 B-0749; B-2431
  - disposition: translated
  - test: PT-126-C-152-sinks
  - divergence: DV-007
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - assumption: CQ-032; CQ-119

- **F126-FR-021**: Under compatibility output and `compat.legacyEvents`, the records of the seam MUST project to the as-is vocabulary through the table of the compatibility projection: `agent_init`, `agent_text`, `agent_tool`, `evidence_writing`, `agent_observability`, `agent_diagnostic`, `agent_result`. An uncorrelated record MUST have the shape `ts` (epoch seconds), `time` (local ISO-8601 with offset), `event`, then `run_id`, `task`, `backend` when non-empty, then the fields. A correlated record MUST have `ts` (epoch seconds with 9 decimals), `time` (UTC ISO-8601 with offset), `event`, the eight identity fields, `sequence`, then the non-null fields, which may override earlier keys. `sequence` MUST start at 1 and rise by 1 per event for each writer: the tap and the finalization are separate writers, so the finalization's `agent_result` carries `sequence` 1 again. A line that is not a JSON object or lacks `event`, `run_id` or `invocation_id` MUST be rejected on reading. The primary stream is not compared; its projection is (N-12, N-13, N-14).
  - origin: C-154 B-2111; C-166 B-2193; B-2194; B-2195; C-149 B-2090; B-2091; C-191 B-2376
  - disposition: translated
  - test: PT-126-C-149-projection
  - divergence: DV-007

- **F126-FR-022**: Every record inside a pass MUST carry the session id. Activity of a subagent MUST carry the parent session id. The event that ends a pass MUST record a reference to the transcript by path and hash, never its content; where the harness keeps none, the reference is null.
  - test: CT-126-3
  - status: unverified (check: a recorded live stream of the Claude CLI names the session on every record and subagent records name a parent; verified-on: —; pin: version of the CLI at the capture)

- **F126-FR-023**: A `usage.reported` event MUST be emitted for each model call as it completes, with an increment and not a running total; a harness that reports a running total MUST be converted to increments per session id, and a replay MUST be deduplicated by `usageId`. Subagent usage MUST be attributed to its parent. A pass killed before its terminal MUST end with `usageComplete=false` and the last partial usage, or `usage.unavailable` with reason `killed`. A harness whose usage source (`stream`, `trace-plugin`, `none`) is `none` MUST emit `usage.unavailable` with reason `harness-does-not-report` for each pass. A value the harness did not report MUST be null with the reason as a separate field. Cost under a subscription MUST be labelled notional.
  - test: CT-126-4
  - status: unverified (check: a recorded live stream shows usage on each assistant message and a killed live pass keeps its partial usage; verified-on: —; pin: version of the CLI at the capture)

- **F126-FR-024**: A `tool.call` event MUST carry the category (`read`, `edit`, `exec`, `wait`, `search`, `other`) and the duration. The end of a pass MUST carry the time breakdown into model, tool, wait and idle time, and the time of the first productive edit. The values are taken from the stream; where the stream does not give a time, the value is null.
  - test: CT-126-5

- **F126-FR-025**: With parallel units on, several streams MUST be read at once inside the engine process, each by its own reader with its own state. Every record of a worker MUST carry `workerId` and `wseq`, absent on the main line. The order of records between workers is set by the parallel layer and the fields by the event schema.
  - test: CT-126-6
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

#### G3 - Invocation identity, envelope, reconciliation, finalization, retention

- **F126-FR-026**: Every invocation of a harness (proposer, accelerator, critic) MUST have an invocation identity: run id, feature, role, harness label, phase, attempt, iteration and invocation id. A missing invocation id MUST be generated as `inv-<iteration, 6 digits>-<8 hexadecimal characters>`; where `invocation.idBase` (alias `SPECSTRIDE_INVOCATION_ID`, flag `--invocation-id`) is set, the id of pass n MUST be `<base>-iter-<n>`. Each path component MUST have every run of characters outside `A-Za-z0-9_.-` replaced by `-`, leading and trailing `.` and `-` removed, and be cut to 128 characters; an empty result MUST refuse with `identity component is not path-safe`. The expected evidence path MUST be stored absolute, with the home expanded and links resolved. The role MUST be checked as in F126-FR-012, refusing with `role must be proposer, accelerator or critic` under the `parity` profile.
  - origin: C-166 B-2187; B-2190; B-2191; B-2188; C-051 B-0481; B-0478; C-052 B-0505
  - disposition: ported
  - test: PT-126-C-166-identity
  - parity: `invocation.idBase` unset (row 84)

- **F126-FR-027**: The artifacts of an invocation MUST be kept under logical names: `pass:<passId>:invocation` (the record), `pass:<passId>:stream` (the raw stream), `pass:<passId>:producer-status`, `pass:<passId>:provider-terminal`, `pass:<passId>:result`, `pass:<passId>:response` (reply text, prunable), `pass:<passId>:prompt` (prunable) and, for a critic call, `attempt:<N>:<k>:<n>:critic-invocation`. `run:<runId>:current-pass` MUST name the newest pass so the finalization finds it. The as-is layout table maps them to the as-is directory of the invocation, one per pass, whose name has the identity components sanitized, and to `.last-invocation-dir`. The prompt and the response MUST be retained only while `invocation.debug` is on (flag `--debug`), and the raw stream while raw capture is on (`observability.retention.rawCapture`, default off). Under the `parity` profile the layout table of annex X §X.8 applies.
  - origin: C-056 B-0633; B-0634; B-0635; C-165 B-2182; B-2183; C-051 B-0484
  - disposition: translated
  - test: PT-126-C-056-layout
  - divergence: DV-006
  - parity: `invocation.debug` off (row 85)

- **F126-FR-028**: The invocation record MUST be created exclusively and atomically for a pass whose route is structured or registry-routed, and outside the `parity` profile for every pass (F126-FR-029): an existing record MUST refuse the creation with `invocation directory already exists: <dir>`. It MUST hold the schema id, the eight identity fields, the observability mode (`structured`, `raw-text`, `degraded`), the provider format, the expected evidence path, and `createdAt`. The as-is contract string `specstride-invocation/v1` MUST be the schema literal of the compatibility form. The schema id of the record is `specstride.invocation/1` (annex B §B.20); the three other artifacts are `specstride.producer-status/1`, `specstride.provider-terminal/1` and `specstride.invocation-result/1` (annex B §B.20). Every one of the four records MUST carry the field `schema` with its schema id.
  - origin: C-166 B-2184; B-2198; C-056 B-0627; C-160 B-2154
  - disposition: ported
  - test: PT-126-C-166-record
  - assumption: CQ-105

- **F126-FR-029**: Under the `parity` profile only a structured or registry-routed pass MUST have an invocation record, a result and a finalization; a pass on the legacy path MUST have none, and when the record or its directory is missing the finalization MUST be skipped and the pass MUST NOT be counted by any breaker. Outside the `parity` profile every pass MUST have an invocation record and a result, so that every pass is accounted for (option `invocation.recordAllPasses`, default on).
  - origin: C-058 B-0781
  - disposition: ported
  - test: PT-126-C-058-legacy-path
  - divergence: DV-103
  - parity: `invocation.recordAllPasses` off (row 83)
  - assumption: CQ-103

- **F126-FR-030**: The producer status MUST be written atomically at `pass:<passId>:producer-status` with `producer_exit_code`, `producer_signal`, `parser_exit_code`, `timed_out`, `launch_failed`, `duration_ms`, from the observation of the controller of the pass. An exit status 127 MUST set `launch_failed`, 124 `timed_out`, and above 128 `producer_signal` as the status minus 128; in each of these `producer_exit_code` MUST be null. The as-is contract string is `specstride-producer-status/v1`. Duration, exit status and signal MUST come only from it.
  - origin: C-056 B-0626; C-058 B-0698; C-162 B-2164
  - disposition: translated
  - test: PT-126-C-056-producer-status
  - divergence: DV-006

- **F126-FR-031**: The provider terminal MUST be written atomically at the end of the tap at `pass:<passId>:provider-terminal` with `provider_terminal` (the last terminal or null) and `malformed_stream`, and with the as-is contract string `specstride-provider-terminal/v1` in the compatibility form. The tap MUST NOT write the result record. Cost, tokens, model and turns MUST come only from it. The provider-terminal destination MUST be given to the tap for a pass that is terminal-tracked or registry-routed (F126-FR-039); the condition is read from the format row and the route, never from the name of the harness. Example under the `parity` profile: a pass of prime, through the format row `prime-v3`.
  - origin: C-152 B-2099; C-056 B-0636; C-160 B-2156; C-162 B-2164; C-155 B-2145
  - disposition: translated
  - test: PT-126-C-152-provider-terminal
  - divergence: DV-006

- **F126-FR-032**: The result record MUST be written once, atomically and without overwriting: a temporary file in the same directory, sorted keys, 2-space indent, a final line end, then a rename; where overwriting is not allowed, an existing file MUST make the write fail. It MUST hold the schema id, the eight identity fields, `status`, `is_error` (status other than `success`), `reason_code`, `reason`, `source` (`synthesized` when the reason code is `missing_terminal`, else `reconciled`), `provider_status`, `provider_stop_reason`, `producer_exit_code`, `producer_signal`, `parser_exit_code`, `timed_out`, `duration_ms` (whole, at least 0) and `finalized_at` (UTC, with microseconds). Every other non-null key of the provider terminal and of extra metrics (for example `model`, `cost_usd`, `input_tokens`, `num_turns`, `noActivity`, `kill_reason`, `kill_class`) MUST be copied onto it, except `status`, `reason`, `reason_code` and `stop_reason`. The as-is contract string is `specstride-invocation-result/v1`.
  - origin: C-165 B-2179; B-2180; B-2181; C-160 B-2157; C-166 B-2185; B-2196; B-2197
  - disposition: translated
  - test: PT-126-C-165-result-record
  - divergence: DV-006

- **F126-FR-033**: Reconciliation MUST decide the reason code and status in this precedence: (1) `timeout`, status `timeout`, `Invocation timed out`; (2) `cancelled`, status `cancelled`, `Invocation was cancelled`; (3) `launch_failed`, `Provider process could not be launched`; (4) `producer_signaled`, `Provider process terminated by signal`; (5) `producer_nonzero`, when the exit is non-zero and the provider did not claim success, `Provider process exited nonzero`; (6) `status_conflict`, when the provider said success and the exit is non-zero, `Provider and process terminal observations conflict`; (7) `parser_failed`, when the parser exit is non-zero, `Provider stream parser failed`; (8) `unsupported_schema`, status `degraded`, when the caller says so; (9) `malformed_stream`, `Provider stream was malformed or truncated`; (10) the provider-reported error code, default `provider_error`, with the provider's text; (11) `missing_terminal`, when the terminal is absent or not success or success without both exit codes 0, `Provider stream ended without a terminal observation`; (12) `success`, only when the provider terminal is success and both producer and parser exits are exactly 0. All other statuses besides `success`, `timeout`, `cancelled` and `degraded` are `error`. The finalization MUST NOT pass `cancelled` or `unsupported_schema` to reconciliation, so those statuses cannot appear in a result it writes.
  - origin: C-164 B-2167; B-2168; B-2169; B-2170; B-2171; B-2172; B-2173; B-2174; B-2175; B-2177; B-2178; C-162 B-2163
  - disposition: ported
  - test: PT-126-C-164-precedence

- **F126-FR-034**: Finalization MUST reconcile one invocation from the record, the producer status and the provider terminal into the result and a decision. The decision MUST be `cap_halt` when the hard-cap breaker reached its limit (checked first), `halt` when the consecutive-error breaker reached its limit, else `continue`. A kill reason handed in by the controller MUST be carried in, because a kill severs the stream and no artifact can name it; a classifiable reason MUST add `kill_reason` and `kill_class` to the result and to the event, and an unclassified or empty reason MUST add nothing. The result MUST be folded into the breakers: `count`, `cap_count`, `last_invocation_id`, `last_reason_code`, `last_kill_class`, held in the `core` counters of the ledger. The inputs are the invocation record, the event destination, the breaker state, the limit, an optional kill reason and an optional cap limit (default 0); the outputs are six lines, in order: the decision, the reason code, `true` or `false` for `is_error`, the count of consecutive errors, the kill class (possibly empty), the cap count. Finalization ends with exit code 0 whenever reconciliation completes, whatever the decision; it ends with exit code 1 when the invocation record or a required input is missing. Duration, exit status and signal come only from the producer status.
  - origin: C-155 B-2145; C-156 B-2146; B-2147; B-2148; C-158 B-2150; C-159 B-2151; B-2152; B-2153; C-160 B-2155; B-2158; C-161 B-2159; C-162 B-2161; C-058 B-0782; B-0783
  - disposition: translated
  - test: PT-126-C-159-decision
  - divergence: DV-066

- **F126-FR-035**: Finalization MUST emit one `agent_result` event per invocation, with the fields `status`, `is_error`, `reason_code`, `reason`, `source`, `provider_status`, `provider_stop_reason`, `producer_exit_code`, `producer_signal`, `parser_exit_code`, `timed_out`, `duration_ms`, `finalized_at`, plus every result field except the schema and the identity keys. Outside the compatibility projection the event MUST be written by the one event writer, which calls every open sink after the primary write (annex C §C.10), as for every other event of the pass. In the as-is form, the compatibility projection, the event goes to the local event destination only, not to a remote sink by this process, and an empty destination skips it. A result that already exists MUST be consumed as it is: no second reconciliation, no second event, but the breaker still records it. A result MUST be finalized at most once: the step that reconciles and writes the result, called a second time or called when a result already exists, MUST refuse with `invocation result has already been finalized` and write nothing. The finalization reads an existing result before it calls that step, so a repeated finalization meets the sentence before this one and not the refusal.
  - origin: C-157 B-2149; C-163 B-2165; C-162 B-2160; B-2162; C-166 B-2199
  - disposition: translated
  - test: PT-126-C-157-result-event; CT-126-12
  - divergence: DV-007
  - assumption: CQ-228 (outside the compatibility projection the `agent_result` of the finalization reaches the sinks through the one event writer; the as-is rule "local destination only" holds for the as-is form only)

- **F126-FR-036**: A pass MUST end with complete usage or an explicit `usage.unavailable`, and with either a result (F126-FR-029 outside `parity`) or, on the legacy path, the terminal event of the tap. A killed pass that ends with its last partial usage and `usageComplete=false` (F126-FR-023) counts as accounted for. The share of passes so accounted for MUST be reported per run.
  - test: CT-126-7

- **F126-FR-037**: Streams and transcripts MUST be retained for a bounded time. The retention sweep MUST visit every invocation with a record. It MUST skip an invocation without a result as active, with `{"skipped": "active"}`. It MUST remove the raw files first (stream, prompt, response and any transcript the harness adapter copied into the control plane), the record second, and never the result. The age in whole days MUST be taken from `finalized_at` of the result, else from `createdAt` of the record; a missing or unreadable stamp MUST mean age 0. The days come from `observability.retention.rawDays` (default 7) and `observability.retention.metadataDays` (default 30); the same under `parity`. Each sweep MUST be recorded with the number of files removed.
  - origin: C-166 B-2200; B-2201; B-2202
  - disposition: ported
  - test: PT-126-C-166-retention
  - assumption: CQ-102

- **F126-FR-038**: A stream and a transcript that were retained MUST contain no secret: they are written from redacted text where content capture is on, and the raw stream file is 0600 within the control plane.
  - test: CT-126-8

- **F126-FR-039**: The seam, the tap and the invocation code MUST NOT test the name, the id or the label of a harness in control flow (annex A F100-FR-023). Every difference between harnesses MUST be read as data from the resolved registry: the descriptor fields `stream.format`, `stream.dialect`, `stream.mapping`, `stream.usage` and `stream.tolerate` (annex C §C.2); the row of the dialect table that `stream.dialect` names, with `providerFormat`, `terminalDecides` and `limits` (annex C §C.5); and the options of the format row (F126-FR-001). A pass is registry-routed when its entry of the resolved registry names a stream format and the route of F126-FR-014 resolved it to a reader that started. A pass is terminal-tracked when its format row sets `trackTerminal`, or, for a format of the JSONL family, when the row of the dialect table that `stream.dialect` names sets it (annex C §C.5; the row of prime, provider format `prime-v3`, sets it). A pass whose entry names no stream format has no route. The harness label MUST be carried only as a value: in the identity, in labels and in records. A harness that the consumer declared or that was discovered, with the same data under another id, MUST be read exactly as a harness of Wave 1.
  - test: CT-126-9
  - ep: EP-02 `specstride.harness/1` (implements, sub-point stream readers)
  - assumption: CQ-227 (`trackTerminal`, no field of its own; confirmed by the second pass of feature 100, item A31, on the dialect row of annex C §C.5)

- **F126-FR-040**: The stream formats `sse-openai` and `sse-anthropic` (row 31 of annex X §X.6) MUST be registered by this feature. Their framing is server-sent events. The seam MUST read the stream line by line, gather the `event:` and `data:` fields of one event up to a blank line, join several `data:` lines of one event with a line end, and ignore a comment line (one that starts with `:`, such as `: keep-alive`) and a field it does not know. It MUST hand the data of each event, with its event name, to the mapping of the row as one document. Only this framing is parsed (F126-FR-018), and a data field that is not JSON MUST give a diagnostic `malformed_json` and set the malformed-stream flag (F126-FR-016), except the literal `[DONE]`. The two rows MUST be data mappings in the sense of F126-FR-007, shipped with the registry; the framing is the only code. The fragments of text of one content block MUST be joined and handed on as one `text` record when the block ends. The row `sse-openai` declares `hasInitRecord` false and `synthInit`; the row `sse-anthropic` keeps `hasInitRecord` true. Both declare `synthTerminal`, the signals `init,text,result` (no tool: a call of these kinds carries none, F109-FR-017), and a cost of null, since neither stream reports one.
  - `sse-openai` (a chat completion stream): `choices[0].delta.content` gives text; `model` of the first chunk gives the model of the synthesized `init`; an object `usage` gives `usage` (`prompt_tokens` input, `completion_tokens` output, `prompt_tokens_details.cached_tokens` cache read, `completion_tokens_details.reasoning_tokens` reasoning); a non-null `choices[0].finish_reason` gives the stop reason and ends the block; the data `[DONE]` gives `terminal` with status `success` and the last stop reason; an object `error` gives `error` (code `error.code` or `error.type`, message `error.message`) and a terminal with status `error` and reason code `provider_error`.
  - `sse-anthropic` (a messages stream), by event name: `message_start` gives `init` (model from `message.model`, tools null) and `usage` (`message.usage.input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`); `content_block_delta` with `delta.type` `text_delta` gives text, and `content_block_stop` ends the block; `message_delta` gives the stop reason (`delta.stop_reason`) and `usage` (`usage.output_tokens`); `message_stop` gives `terminal` with status `success`; `error` gives `error` (code `error.type`, message `error.message`) and a terminal with status `error` and reason code `provider_error`; `ping` and any other event name give nothing.
  - A stream of either row that ends before its terminal event is a stream without a terminal (F126-FR-017). Under the `parity` profile no fixture selects either row, neither is listed (F126-FR-013) and nothing printed changes.
  - test: CT-126-13
  - ep: EP-02 `specstride.harness/1` (implements, sub-point stream readers)
  - status: unverified (check: a recorded stream of an OpenAI-compatible chat completion endpoint and of an Anthropic messages endpoint passes its row, the event names and field paths above match; verified-on: —; pin: the API version header and the date of the capture)
  - assumption: N-126-2 (the framing and the field paths are those of the providers' published stream formats, as R20 gives the worked example of an OpenAI-format endpoint; no baseline has these formats)

## Key Entities

| Entity | What it is |
|---|---|
| Stream format | An open name (with aliases) that selects a reader |
| Stream reader | Turns a raw stream into normalized records |
| Normalized record | One of `init`, `text`, `tool`, `usage`, `error`, `terminal` |
| Tap | The function between the harness process and the pass |
| Invocation | One call of a harness by a role, with identity |
| Invocation record, producer status, provider terminal, result | The four artifacts of an invocation |
| Decision | `cap_halt`, `halt` or `continue`, handed to the breakers |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F126-SC-001**: Every pass is accounted for. 100 per cent of passes carry complete usage or an explicit `usage.unavailable` (a killed pass as F126-FR-036 counts it), and the sum of `usage.reported` increments is within 2 per cent of the harness's own session total (experiment X0).
- **F126-SC-002**: A new stream format needs no code. A reader given as data only passes the conformance suite, and 0 core files differ between the build with it and the build without it.
- **F126-SC-003**: Parity. Under the `parity` profile the results of FX-26 and of the stream events of FX-01, FX-18 and FX-20 are 0 `different`.
- **F126-SC-004**: Hostile streams. In every own test of a stream that imitates a terminal record, a cost figure or a tool event inside tool output, 0 records come from it; 100 per cent of lines over a cap give a diagnostic.
- **F126-SC-005**: Truthful streams. 100 per cent of streams of a format with a terminal record that end without one emit `stream.missing_terminal`.
- **F126-SC-006**: Once. 100 per cent of finalized invocations have exactly one result record, and a repeated finalization changes 0 files.
- **F126-SC-007**: Retention. 0 active invocations and 0 result records are removed by 100 sweeps of a fixture tree.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1` (sub-point stream readers) | implements | The registry of readers by format, the six normalized records, the data mapping, the conformance suite and the sample reader given as data |
| EP-08 | `specstride.event-sink/1` | consumes | Hands records to the one writer; the sinks receive them after it |
| EP-04 | `specstride.loop-layer/1` | consumes | Several streams inside one process with parallel units |

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| Harness port, stream readers, `stream.format` an open set | C §C.1, §C.5; F100-FR-090 |
| The dialect table, `specstride.stream-dialect/1` (`providerFormat`, `terminalDecides`, `limits`, `trackTerminal`) | C §C.5 (`trackTerminal` on the row of prime: second pass of feature 100, item A31; CQ-227); F100-FR-091 |
| No test of a harness name in control flow; the resolved registry | A F100-FR-023; C §C.6 |
| Schema ids of the four invocation artifacts | B §B.20 |
| Process registry, class `owned` | B F100-FR-063 |
| Harness descriptor fields `stream.*` | C §C.2; F100-FR-084 |
| Event envelope, `specstride.event/1` | X §X.1; F100-FR-198 to F100-FR-200 |
| Redactor, `specstride.redaction/1`; the ingress | X §X.4; F100-FR-205; A F100-FR-009 |
| Layout: logical names of the pass | B §B.5 (`pass:<passId>:stream`, `:invocation`, `:usage`, `:result`, `:response`, `:prompt`, `:producer-status`, `:provider-terminal`, `run:<runId>:current-pass`, `attempt:<N>:<k>:<n>:critic-invocation`) |
| Event sink | C §C.10; F100-FR-104, F100-FR-105 |
| Closed sets, rows 31, 38 and 169 to 177 | X §X.6 |
| The interface through which the engine calls reconciliation, finalization and the retention sweep, a plain function interface of `contracts` handed in by the composition root | A §A.4, proposed as F100-FR-237 (`analyze-report.md`, "Proposed upstream fixes", P1); the precedent is F100-FR-235 |
| Threat T-17 | X §X.9 |
| The `parity` profile | X §X.7 |

## Rows of the `parity` profile

| Switch or option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Stream tap | `stream.tap` | on | on | 79 | DV-065 |
| Tap executable | `stream.tapExecutable` | unset | unset | 80 | none |
| Line size cap and rate cap | `stream.limits.lineBytes`, `stream.limits.linesPerSecond` | 1048576, 5000 | off | 81 | DV-102 |
| Flag of a pass that did nothing | `stream.noActivityFlag` | on | off | 82 | DV-101 |
| Invocation record for every pass | `invocation.recordAllPasses` | on | off | 83 | DV-103 |
| Invocation id base | `invocation.idBase` | unset | unset | 84 | none |
| Debug retention of prompt and response | `invocation.debug` | off | off | 85 | none |
| Compatibility projection (consumed) | `compat.legacyEvents` | off | on | 17 | DV-007 |
| Content capture (consumed) | `telemetry.content` | follows traces | off | 16 | DV-083 |
| Retention of captures (consumed) | `observability.retention.rawCapture`, `.rawDays`, `.metadataDays` | off, 7, 30 | off, 7, 30 | 45 (owners 111, 126) | none |
| Limits of the observability policy (consumed) | `observability.limits.text`, `.toolArguments`, `.toolResult`, `.diagnostic`, `.target`, `.maxTargets`, `.freeText` | 4096, 2048, 4096, 1024, 512, 8, 1024 | the same, as at the baseline | 44 (owner 111) | none |

## Closed sets

Rows 38 and 169 to 177 of annex X §X.6 and the stream-format part of row 31 are owned here.

| Set | Members | Unknown value |
|---|---|---|
| Kinds of normalized stream record (row 38) | `init`, `text`, `tool`, `usage`, `error`, `terminal` | The record is dropped with a diagnostic event |
| Stream formats (row 31) | Open. Registered in Wave 1: `claude` (alias `claude-stream-json`), `prime-v3`, `text`, `jsonl`, `sse-openai`, `sse-anthropic` | The descriptor is refused |
| Observability modes (row 169) | `structured`, `raw-text`, `degraded` | `degraded` |
| Stream signals (row 170) | `init`, `text`, `tool`, `evidence`, `result` | The registration is refused |
| Route reasons (row 171) | the two of F126-FR-014 and `stream adapter for '<format>' failed to start — parsing plain output` | Shown as text |
| Stream diagnostic codes (row 172) | `adapter_error`, `malformed_json`, `unsupported_schema`, `absent_schema`, `duplicate_terminal`, `line_too_long`, `line_rate_exceeded`, `unknown_record_kind` | Shown as text |
| Invocation statuses (row 173) | `success`, `error`, `timeout`, `cancelled`, `degraded` | `error` |
| Reason codes of a result (row 174) | the twelve of F126-FR-033 and any provider code | Shown as text |
| Finalization decisions (row 175) | `cap_halt`, `halt`, `continue` | `continue` |
| Canonical tool names (row 176) | the twelve of F126-FR-004 | Pass through unchanged |
| Result sources (row 177) | `synthesized`, `reconciled` | `reconciled` |

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-0599 (C-055) | Route reason: the tap unavailable because the interpreter or the tap script is missing | DV-065 |
| B-2427 (C-055) | The same route reason, repeated by the stream tap's inventory | DV-065 |
| B-0673 (C-058) | The tap turns itself off silently when the interpreter is absent | DV-065 |

## Clarifications

### Session 2026-09-29

Answered from the sources. No question was put to a person.

- Q: Is the tap a command? -> A: No; it is an internal function of one pass. Only `spec`, `verify` and `learn` are public. (Source: ruling 26; F100-FR-171)
- Q: Does the primary stream have to equal the baseline? -> A: No; the projection is compared. (Source: DV-007; N-12 to N-14)
- Q: What happens to a crashed pass of a harness that emits no terminal record? -> A: It reads clean, as at the baseline (D-48), and `stream.missing_terminal` makes it visible. (Source: brief 126 heading 3; D-48)
- Q: Does pass-through keep whitespace? -> A: No, preserved defect D-54. (Source: consolidation D-54)
- Q: Who decides the outcome for a harness that exits 0 on a provider error? -> A: The terminal record. (Source: R9 F5; F100-FR-091)
- Q: Where do the readers of prime and pi live? -> A: In feature 138, registered here. (Source: brief 126 heading 1)
- Q: Are events content? -> A: No; references only; content passes the redaction point when captured. (Source: DV-083; ruling 43; F100-FR-200)
- Q: Do the legacy and the correlated path both survive? -> A: Yes under `parity`, because the baseline's Claude passes take the legacy path and are not finalized (B-0781); outside `parity` every pass is recorded. (Source: B-0781; B-2430; brief 126 heading 8 success criterion; recorded as CQ-103)
- Q: Which numbers cap a stream line? -> A: The sources give none; 1048576 bytes and 5000 lines a second, off under `parity`. (Source: EV-33 asks for caps; recorded as CQ-104)
- Q: What becomes of the breaker state file of the finalizer? -> A: Its five fields live in the `core` counters of the ledger; the annex has no logical name for a separate file. (Source: F100-FR-069)
- Q: Are the as-is contract strings kept? -> A: Only as literals of the compatibility form. (Source: DV-006; DV-007)
- Q: Does a text stream's synthesized terminal decide an outcome? -> A: No; it is marked synthesized and asserts nothing, so D-48 holds. (Source: brief 126 heading 3)
- Q: Does `usage.reported` change a baseline output? -> A: No; it is new and projects to nothing under `parity`. (Source: R14 EV-03)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register is `consolidation.md` section 6. Its rows DV-101, DV-102 and DV-103 were written for this feature. The row DV-115, of F126-FR-016, was written after the cross-feature review (see "Repairs after the cross-feature review").

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-102 | What "retention of transcripts" covers, since the transcript belongs to the harness | Only what the product wrote or copied; the reference is kept | F126-FR-037 |
| CQ-103 | Which passes have an invocation record | Every pass outside `parity`; under `parity` only structured ones | F126-FR-029 |
| CQ-104 | Values of the line and rate caps | 1048576 bytes and 5000 lines a second | F126-FR-018 |
| CQ-227 | Which data field says that a pass is correlated and gets a provider terminal | `trackTerminal`; annex C §C.5 puts it on the row of the dialect table, and the row of prime sets it (second pass of feature 100, item A31); for a format outside the JSONL family the option of the format row | F126-FR-001, F126-FR-012, F126-FR-031, F126-FR-039 |
| N-126-1 | Which provider format a terminal-tracked pass of the JSONL family is given, when its descriptor names the format `jsonl` and a dialect (feature 138: `jsonl`, dialect `prime`) | The `providerFormat` of the dialect row (`prime-v3` for prime), as at the baseline | F126-FR-012 |
| CQ-105 | Schema ids of the invocation records | `specstride.invocation/1` and its three siblings; the answer is applied in annex B §B.20 | F126-FR-028 |
| N-126-2 | How the formats `sse-openai` and `sse-anthropic` of row 31 are read, which no baseline had | Server-sent-event framing in code and two data mappings over it, with the field paths of the providers' published stream formats, `unverified` until a capture | F126-FR-040 |
| N-126-3 | How the engine, which may not import `@specstride/harness`, reaches reconciliation and finalization | A plain function interface of `contracts`, as F100-FR-235 does for learning; proposed upstream as F100-FR-237 | F126-FR-033 to F126-FR-035, F126-FR-037 |
| CQ-228 | Does the `agent_result` event of the finalization reach the sinks, given annex C §C.10? | Closed on 2026-09-30 (the recommended answer stands): yes outside the compatibility projection, through the one event writer; the as-is rule "local destination only" holds for the as-is form only | F126-FR-035 |
| CQ-032, CQ-119 | What the context of `open` holds, and how a sink learns the as-is name of an event | The four as-is labels named in F126-FR-020, the content accessor and read access to the table of the compatibility projection, as annex C §C.10 says | F126-FR-020 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused.

| Requirement | Item | What changed |
|---|---|---|
| F126-FR-016 | W-126-01 | An event whose local append failed is dropped by the one event writer, is counted in `event.dropped` and reaches no sink. Disposition `translated`; register row `DV-115`; second test CT-126-11 |
| F126-FR-020 | W-126-02; W-X-13 | A sink receives the event of annex X §X.1 whole, with `ts`, `type` and `seq`. The record minus `ts`, `time` and `event` with `sequence` is the as-is form of the compatibility projection only. `CQ-pending-5` is CQ-032 and CQ-119 |
| F126-FR-008 | W-126-03 | The unpiped pass is "a pass whose entry of the resolved registry names no stream format"; the invocation model reaches the wrapper for a registry-routed pass. dsh and Codex are examples |
| F126-FR-012 | W-126-03 | The legacy and the correlated path are chosen by the route and by `trackTerminal` of the format row; prime is an example |
| F126-FR-031 | W-126-03 | The provider-terminal destination is given for a terminal-tracked or registry-routed pass; prime is an example |
| F126-FR-011 | W-126-04; W-X-11 | How a replacement tap is started, and that it never fails the pass; rows 79 and 80 in place of "rows needed"; second test CT-126-10 |
| F126-FR-018 | W-X-11 | Row 81 in place of "rows needed" |
| F126-FR-028 | W-X-26 | The four schema ids are those of annex B §B.20; every record carries `schema` |
| F126-FR-039 (new) | W-126-03 | No test of a harness name in control flow; the terms registry-routed and terminal-tracked; test CT-126-9 |

Other places changed: the table "Closed sets" (the row numbers 169 to 177 of annex X §X.6 in place of "new"), the edge cases (three lines added), the table "Contracts of feature 100 used" (four rows added), the table "Rows of the `parity` profile" (the heading "Key", the owners of row 45), the assumptions (the count of register rows removed by W-X-05; CQ-105; CQ-032 and CQ-119).

### Re-check B-8.7 part F (2026-09-30)

Ripple R-126 of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`, section F (`docs/ecosystem/reviews/B-8.7-F.md`). No id was renumbered or reused.

| Requirement or place | What changed |
|---|---|
| F126-FR-012 | The example cites annex C §C.5 and item A31 of feature 100: the row of prime of the dialect table sets `trackTerminal`; a terminal-tracked pass of the JSONL family gets the `providerFormat` of its dialect row; `assumption: CQ-227; N-126-1` |
| F126-FR-039 | A pass of the JSONL family is terminal-tracked when its dialect row sets `trackTerminal` (annex C §C.5); `assumption: CQ-227` |
| "Contracts of feature 100 used"; "Assumptions"; `data-model.md` (format row) | `trackTerminal` on the dialect row cited; CQ-227 and N-126-1 |

### Answers of the owner, round 1 (2026-09-30)

Clarification round of Stage B (`docs/ecosystem/CLARIFY-QUEUE.md`). No id was renumbered or reused.

| Requirement or place | What changed |
|---|---|
| F126-FR-035 | CQ-228: outside the compatibility projection the `agent_result` of the finalization is written by the one event writer, which calls every open sink (annex C §C.10); "local destination only" holds for the as-is form (the compatibility projection) only. Test CT-126-12 added (task T042); `assumption: CQ-228` |
| "Assumptions" | CQ-228 listed |

### Analyze run (2026-09-30)

Run of `speckit-analyze` over `spec.md`, `plan.md` and `tasks.md`, checked against the baseline code, feature 100 and the register. No id was renumbered or reused.

| Requirement or place | What changed |
|---|---|
| F126-FR-014 | An unknown format and a reader that fails to start both give a pass-through, but only the failed start is announced as `degraded` (both paths, B-2087); an unknown format is announced as `raw-text` on the correlated path (F126-FR-006, B-2086; baseline `lib/agent_stream.py:353` to `:418`) |
| F126-FR-001; F126-FR-010 | `terminalDecides` is an option of the format row (as `data-model.md` holds it) and, for the JSONL family, of the dialect row (annex C §C.5) |
| F126-FR-006; edge cases | "reader" in place of "adapter" of a format |
| F126-FR-027; "Rows of the `parity` profile" | Raw capture is the key `observability.retention.rawCapture` of row 45 |
| F126-FR-028 | Names F126-FR-029 for the passes that have a record outside the `parity` profile |
| User stories 1 and 4; edge cases | Citations: `usage` is F126-FR-023; the skip of the sweep is F126-FR-037; twelve outcomes, reconciled; the legacy path without a record is a rule of the `parity` profile (F126-FR-029) |
| "Contracts of feature 100 used" | The logical names `:prompt` and `attempt:<N>:<k>:<n>:critic-invocation` of F126-FR-027 added |
| "Assumptions" | The register holds DV-115 |
| F126-FR-009; F126-FR-008; edge cases | The drop of a second terminal is the wrapper's, and a reader is wrapped when its row declares one of `synthInit`, `synthTerminal`, `noActivity`, `trackTerminal` (B-2379 "a wrapped adapter"; baseline `lib/stream_seam.py:211` and `:358`; annex C §C.5); a reader that is not wrapped hands every terminal on |
| F126-FR-035 | The refusal `invocation result has already been finalized` is that of the step that reconciles and writes (B-2199); the finalization reads an existing result first (B-2162) |
| F126-FR-036; F126-SC-001 | A killed pass with its last partial usage and `usageComplete=false` counts as accounted for (F126-FR-023; R14 EV-03) |
| F126-FR-019; "Rows of the `parity` profile" | The policy limits are the keys `observability.limits.*` of row 44 |
| "Out of scope"; "Contracts of feature 100 used" | Feature 144 owns the compatibility projection sink and its table; the closed-set rows 169 to 177 cited |

Two items were first left open by this run and are now settled (owner's follow-up of 2026-09-30: resolve every finding with the best proposal):

| Requirement or place | What changed |
|---|---|
| F126-FR-040 (new); F126-FR-001; F126-FR-007; F126-FR-013 | The formats `sse-openai` and `sse-anthropic` of row 31 are this feature's: SSE framing in code, two data mappings over it, test CT-126-13. This feature registers `claude`, `text`, `sse-openai`, `sse-anthropic`; 138 registers `jsonl`, `prime-v3`. The row option `listedAsIs` keeps the listing under `parity` at `claude`, `prime-v3`. Upstream: the owner cell of row 31 (`analyze-report.md`, P2) |
| "Contracts of feature 100 used"; "Assumptions" (N-126-2, N-126-3) | The engine reaches reconciliation, finalization and the sweep through a plain function interface of `contracts`, proposed upstream as F100-FR-237 (`analyze-report.md`, P1) |
