# Feature Specification: Event schema

**Feature Branch**: `111-event-schema-and-projection` (a label: Spec Kit creates no branch in this repository; the directory is `specs/111-event-schema-and-projection`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 111-event-schema-and-projection: the content of the one event schema (event types, fields, lifecycle pairs, ids), the primary file writer, the redaction ingress with the widened patterns and their canary test, the observability policy of the baseline, and the event-sink interface contract. The compatibility projection was group G5 and is now feature 144-compatibility-projection."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` sections 12 and 17, `consolidation.md` (C-06, DV-007, DV-016, DV-067, DV-083), `feature-briefs.md` (brief 111), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, E, X), feature 141, and research R14, R13, R11, R18, R19, R21.

## What this feature is

Every part of the product tells what it does by writing events. This feature defines what those events are: one versioned schema, with its types, its fields, its ids and its open-and-close pairs. It also owns three things around the schema.

- The primary file writer. It is part of the core and cannot be replaced. It gives every event its `seq`.
- The redaction ingress. All text that enters from outside the runtime is redacted and cut to a size cap there, and nowhere else.
- The event-sink interface contract, with which a sink receives events after the writer has written them.

Feature 100 owns the envelope and the rules of versioning. This feature owns the content. The feature that owns a behaviour emits the events of that behaviour; this feature only defines them.

**In scope**: the content of the schema (types, `data` fields, pairs, ids); the primary writer, ordering and best-effort emission; the redaction ingress, the widened pattern set, the observability policy of the baseline and the canary test; the sink interface contract with its conformance tests.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The envelope and the rules of versioning | 100 |
| The OTLP exporter, the Loki sink, metrics, the switch of content capture. The redaction of what is captured is here | 128 |
| The read model and `status` | 129 |
| Compatibility output lines on standard output and standard error | 119, 123 |
| The emission of each event | The feature that owns the behaviour |
| The compatibility projection, a sink that renders the old vocabularies into separate files | 144 |
| The event delivery dispatcher | Roadmap (`deferred`) |
| Applying the retention policy to files (the sweep) | The feature that owns invocation retention |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One stream tells the whole run (Priority: P1)

The author of the read model, of the doctor and of a later viewer needs one typed, ordered, complete stream per run, in which everything that opens also closes and every id is stable.

**Why this priority**: Every reader of the product, and the twenty telemetry gaps of the time-use baseline, depend on it.

**Independent Test**: Run a fixture with a relaunch and a crash. Read the event file of the run. Every event validates against its type, `seq` rises by one without gaps, every `*.started` has its closer (synthesized where a process died), and the last event of every engine start is `run.ended`.

**Acceptance Scenarios**:

1. **Given** a finished run, **When** a reader folds the events, **Then** it finds a terminal event for each engine start, written by that engine start or synthesized by the next launch (F111-FR-004, F111-FR-005).
2. **Given** a process killed in the middle of a pass, **When** the next writer starts, **Then** it closes the open pass, phase attempt, phase and engine start with events marked `synthesized`, innermost first (F111-FR-004).
3. **Given** the twenty gaps of the time-use baseline, **When** a fixture runs, **Then** each gap has an event that the fixture produces (F111-SC-001).

---

### User Story 2 - A failing sink never breaks the loop (Priority: P1)

A consumer sends events to a collector that is slow, throws, or is not there.

**Why this priority**: Principle V. A run must never stall or fail because of what only observes it.

**Independent Test**: Run one fixture three times with a sample sink that is slow, that throws, and that is dead, and once with no such sink. The exit code and the primary event file are equal in all four.

**Acceptance Scenarios**:

1. **Given** a sink that blocks beyond its time limit, **When** the writer delivers an event, **Then** the sink is skipped for that event, the failure is recorded as `telemetry.delivery`, and the writer goes on (F111-FR-035).
2. **Given** a sink that throws, **When** an event is delivered, **Then** nothing reaches the loop (F111-FR-035).
3. **Given** the sample sink that keeps events in memory, **When** the conformance suite runs, **Then** it passes from the test tree with no core file changed (F111-FR-036).

---

### User Story 3 - No secret reaches a sink (Priority: P1)

A consumer switches traces on. Content is captured. A secret sits in the prompt, in the reply, in a tool argument, in tool output, in the output of a check, in phase evidence and in the comment.

**Why this priority**: The owner ruled that content follows traces (ruling 43). The redaction point carries the whole risk. Passing the canary test is a release condition.

**Independent Test**: Plant canaries of every pattern class in the seven places, with capture on. Search every sink. None appears.

**Acceptance Scenarios**:

1. **Given** the canaries, **When** the run ends, **Then** none is in the event file, the projection files, any exporter payload, the digest, the status output or the read model (F111-FR-033).
2. **Given** a redactor that cannot run, **When** text enters, **Then** the content is dropped, the record says so, and the reference is delivered in its place (F111-FR-024, F111-FR-032).
3. **Given** a secret that the runtime resolved, **When** it is used, **Then** it is registered with the redactor at that moment, and its exact value never appears (F111-FR-030).

---

### User Story 4 - An author adds an event type without a break (Priority: P2)

A third party adds `x.` events. An author of a feature adds a type in a later minor.

**Why this priority**: Evolvability of the schema (F100-FR-199).

**Independent Test**: A reader fed with events of an unknown type, with unknown fields and with a torn last line reads the rest without failure.

**Acceptance Scenarios**:

1. **Given** an event of type `x.audit`, **When** any reader or sink sees it, **Then** it is ignored and never projected (F111-FR-037).
2. **Given** a torn last line, **When** a reader reads, **Then** it skips that line, and the next writer continues after the last complete line (F111-FR-018).

---

### Edge Cases

- The event file cannot be written (full disk): the event is dropped, no `seq` is used, the run goes on, and the next event that is written is preceded by `event.dropped` with the count (F111-FR-019).
- A `data` value does not fit its type: the event is not written, and `event.dropped` with the reason `invalid` is written later (F111-FR-020).
- The event file shows a gap or a repeated `seq`: readers report it; the doctor warns; the run is not stopped (F111-FR-021).
- A critic call is in flight: the nonce is in no event before the call returns (F111-FR-011).
- The redactor's pattern set is invalid: it counts as a redactor that cannot run (F111-FR-024).
- An event outside the accepted range of majors reaches a reader: it gives a doctor warning and never a failure of a run (F111-FR-037).

## Requirements *(mandatory)*

The written form of `STAGE-B-RULES.md` section 4 is used. Every test of a requirement with no as-is origin is named `CT-111-<100 + n>`, where n is the number of the requirement. Terms follow the glossary. The word "run" is the logical run; the type names `run.started` and `run.ended` keep the spelling that feature 100 uses, and they bracket one engine start (see "Assumptions", CQ-176).

### Functional Requirements

#### G1 - Schema content: types, ids, lifecycle, typed values

- **F111-FR-001**: The product MUST have one catalogue of event types, the one of "Event catalogue" below, held as versioned data in the `contracts` package. A type name MUST be lower-case, in dotted segments of lower-case letters, digits and underscores. Every type MUST have a schema for its `data`. Every event of the product MUST have a type of the catalogue or a type that starts with `x.`. An event whose type is neither MUST NOT be written and MUST be counted in `event.dropped` with the reason `invalid` (F111-FR-020); so a feature that must record a fact names the catalogue type that carries it, and a fact without a type gets a type here first. Adding a type inside a major MUST be additive.
  - parity: not a switch
  - test: CT-111-101
  - assumption: CQ-176

- **F111-FR-002**: Every event MUST carry the envelope of annex X §X.1 with typed values, null for an unknown value and absence for a value that does not apply. The identity of the feature in an event MUST be `featureId` and the working-directory name MUST be `project` in `data` where a type needs it; the as-is field name `task` MUST NOT appear in the primary stream. `ts` MUST be on every event of every writer, the supervisor's included, in UTC to the millisecond. `strategy` MUST be present on every event of a phase attempt and of a pass.
  - divergence: DV-007
  - test: CT-111-102

- **F111-FR-003**: Ids MUST be stable and MUST be on every event that has them, as in annex B §B.3. `attemptId` MUST be minted once and never change across a relaunch or a resume; the ordinal `attempt` MUST be carried over a resume and changes only through `counters.reset`. `passId` MUST be unique per start of a session; a resume after a yield MUST give a new `passId` with the same `attemptId`; the ordinal `pass` MUST rise per phase attempt and never be reused.
  - test: CT-111-103

- **F111-FR-004**: Every event whose type opens something MUST have a partner that closes it, as in the table "Pairs" of the catalogue. The span of an exporter MUST be built from the pair at the moment of emission. Where a process died before it wrote a closer, the next writer MUST write the closers, marked `synthesized: true` with the cause of the death, innermost first, before any new event.
  - test: CT-111-104

- **F111-FR-005**: Every engine start MUST end on record: the engine writes `run.ended` on every exit path, and where it could not, the next writer (the runtime root, or the next engine start) writes `run.ended` with `synthesized: true` and an `endCause` of `crash`, `host_exit` or `operator_stop` (annex X §X.6 row 96). A `run.ended` that the engine start wrote itself MUST carry as `endCause` the `cause` of its terminal record, a member of `normal`, `crash`, `owner-lost` (annex X §X.6 row 5, annex B §B.15). The two sets do not compete: row 5 is what an engine says of its own end, row 96 is what the next writer found of an end that left no `run.ended`; the flag `synthesized` tells which set applies, and `crash` means the same in both. `run.ended` MUST carry the stop reason and the exit code of the terminal record. The `data` field is named `endCause` and not `cause`, because the envelope field `cause` is the link to the event that led to this one. Liveness MUST never be an event: no heartbeat is written, and a reader treats a run without `run.ended` as open only while its lease is live.
  - test: CT-111-105

- **F111-FR-006**: Usage MUST be counted for every model call. `usage.reported` MUST be written as each call completes, not only at the terminal record of a pass. A record MUST carry a `usageId` (a replay is deduplicated by it), a `scope`, a `cumulative` flag, the counts of input, output, cache-read, cache-write and reasoning tokens (null when the harness did not report), `costUsd` or null, `costSource`, `billing` (`api`, `subscription`, `unknown`), and the harness, provider, model and role. An adapter MUST convert a cumulative report to an increment. A reader MUST sum increments only. Cost under a subscription MUST be labelled notional. A killed pass MUST end with `usageComplete` false and the last partial usage, or with `usage.unavailable` naming the reason; a harness that reports nothing MUST give `usage.unavailable` with the reason `harness-does-not-report` for each pass.
  - test: CT-111-106

- **F111-FR-007**: A pass MUST be explained by its events. `pass.started` MUST carry the `sessionId`; every event inside the pass MUST carry it; the activity of a subagent MUST carry `parentSessionId`. `pass.ended` MUST carry `endCause`, a member of the closed set "End causes of a pass" of "Closed sets" (annex X §X.6 row 271: `evidence`, `completed`, `yield`, `no_progress`, `error`, `killed`, `hard_cap`, `quota_pause`, `stopped`, `crash`), the split of time into model, tool, wait and idle time, `firstEditAt`, `usageComplete` and a reference to the raw transcript by logical name, hash and size. `tool.call` MUST carry a category (`read`, `edit`, `exec`, `wait`, `search`, `other`) and a duration, the references `argsRef` and `resultRef` to the arguments and to the result (logical name, hash and size, never the body), and the four marks `redacted`, `truncated`, `originalBytes` and `retainedBytes`, as `stream.text` does. `prompt.built` MUST be written for every pass and every critic-class call, with the bytes and the token estimate of each block, the blocks dropped, and the total, and never the text.
  - test: CT-111-107

- **F111-FR-008**: Verification and long work MUST be visible. `check.started` and `check.ended` MUST be written for every check whoever runs it (`runner`: `runtime` or `proposer`), with the command by reference, the duration and the result; `check.started` MUST also carry the verification batch and the slot of the command (`batch`, `slot`), and `check.ended` those two and `concurrent`, which says whether the command ran beside another because the parallelism was lowered. The checks of the micro-loop layer MUST use the same events. `job.step`, `job.first_failure` and `job.ended` with `msAfterFirstFailure` MUST be written for a long job. `resource.wait` MUST be written when a check or a job waits on a declared exclusive resource. `microloop.unit` MUST carry the unit, the result (`kept`, `repair`, `unresolved`, row 136 of annex X §X.6) and, where the layer went off, in `layerOff` the cause that the ledger record `disengaged` of feature 115 carries (`caps`, `integrity`, `check-error`, `no-check`, `single-unit`, `layer-error`, `breach`) and in `fallbackReason` the fallback reason of annex X §X.6 row 59 where one applies (`no-check`, `single-unit`), else null. While the layer stays on, both fields MUST be null.
  - test: CT-111-108
  - assumption: N-111-1 (the causes of the record `disengaged` are the seven named here, after the rules of the decision point `loop` of feature 115 and F115-FR-025, F115-FR-032, F115-FR-040; they have no row of annex X §X.6 yet)

- **F111-FR-009**: A run that needs a human MUST be told by `blocked`, with a reason of the six of annex E §E.2, what is needed, and, for `source-changed`, which of `spec`, `plan` or `tasks` changed and its logical name. `unblocked` MUST carry who answered, in the field `by`, and `latencyMs`, the time from `blocked` to the answer. `by` is no closed set: it is kept as text and is a marked free-text field; an answer through `resume` writes `operator`. `answerRef` MUST be null where no record of an answer exists. A `blocked` written for a refused `resume` MUST be marked `synthesized`, and the `run.launched` with the reason `resume` that follows MUST link to it through `cause`.
  - divergence: DV-067; DV-082
  - parity: `blocked` projects to nothing (row 17 of annex X §X.7)
  - test: CT-111-109

- **F111-FR-010**: The units of work of a run MUST be told by events. `attempt.started` MUST carry the kind of the phase attempt (`plain`, `diagnosed`, `accelerated`, `bumped`) and the strategy; `attempt.ended` MUST carry `endCause`, a member of the closed set "End causes of a phase attempt" of "Closed sets" (annex X §X.6 row 272: `approved`, `rejected`, `malformed`, `verification-failed`, `no-evidence`, `budget`, `blocked`, `stopped`, `error`, `crash`), and `workProducts`, each with path, hash, whether kept, and where carried. `phase.ended` MUST carry `outcome`, a member of the closed set "Outcomes of a phase" (annex X §X.6 row 273: `approved`, `halted`, `blocked`, `stopped`, `crash`). `task.planned` and `task.ticked` MUST be written per task with planned and elapsed time where known. `run.launched` MUST carry the reason of its launch (`first`, `resume`, `relaunch`, `manual`), the counts carried and whether they were reset. `counters.reset` MUST be written when `--reset-counts` is used.
  - test: CT-111-110

- **F111-FR-011**: A critic-class call MUST be told by `critic.selected` (harness, model, why, the result of the diversity test in the field `diversity`, a member of annex X §X.6 row 183, and the critic-diversity warning in the field `sameModelWarning`, which is true for the results `same-model` and `unverified` and for no other) once at launch, `critic.started`, and `critic.call` when it returns. `critic.call` MUST carry the form of the `completion` level in force (`tool-less` or `read-only-tools`), the outcome, the latency and the usage; where the critic-diversity rule was applied before the call and the warning was raised, `critic.call` MUST also carry the result of the test in `diversity` and the warning in `sameModelWarning`, whether or not the line is silenced. `verdict.recorded` MUST carry the verdict, whether the nonce matched, and the MALFORMED streak. `verdict.adjudicated` MAY be appended later and MUST refer to the verdict by `verdictId`. The nonce MUST be in no event before its call has returned; afterwards only its hash MUST be recorded.
  - test: CT-111-111

- **F111-FR-012**: The decisions of the owner's rulings MUST be recorded. `route.decided` MUST be written for every decision of the router, including one that changes nothing, with the table id, the table version, the decision point, the rule id, the signals read and the choice. A model-tier bump MUST be recorded as `attempt.tier_bumped` and its skip as `attempt.tier_bump_skipped` with the reason; an escalation that was skipped MUST be recorded as `escalation.skipped` with the reason, a member of annex X §X.6 row 140, whatever the reason of the skip is; when the quota of the target had none left, the reason is `quota`. No routing decision MUST reach a critic-class call through an event.
  - divergence: DV-079; DV-050
  - parity: off (row 24 of annex X §X.7 for the bump)
  - test: CT-111-112

- **F111-FR-013**: Quota, pause, fallback and alerts MUST be defined here and emitted by their owners: `quota.signal` (class, confidence, limit type, utilization, `resetsAt` and its source, the status, the evidence redacted), `harness.error`, `run.paused` and `run.resumed` (a pair, with `pausedMs`), `fallback.switched` and `fallback.restored`, `alert` (kind, level `info`, `warn` or `loud`, role, threshold, value, limit), `budget.exceeded`, and `host.quota_observed` for what a host reports through the inbox. A quota pause MUST add no count to any event that counts a reject, an iteration, a MALFORMED reply, an error or a relaunch.
  - test: CT-111-113

- **F111-FR-014**: A stream MUST be told truthfully. `stream.missing_terminal` MUST be written when a stream ends with no terminal record; a pass that exits successfully and did nothing MUST end with the `endCause` `no_progress`; an unknown value MUST be null. A violation of the framing of a stream (a record too long, too fast, or tool output in the form of a stream record) MUST give `stream.diagnostic` and MUST NOT give any other record.
  - test: CT-111-114

- **F111-FR-015**: The seven types `parallel.plan`, `parallel.admission`, `parallel.group.started`, `parallel.group.ended`, `parallel.worker.started`, `parallel.worker.ended` and `parallel.integration` MUST be defined here. They are events of the main line about a group or a worker: the engine writes them on the main line, so they MUST carry `groupId` and `workerId` in `data` only, and the envelope fields `workerId` and `wseq` MUST be absent on them, as on every event of the main line. This holds for `parallel.worker.started` and `parallel.worker.ended` as well: the engine writes them about a worker, and they name the worker in `data`. "Every event of a worker" (annex X §X.1) is an event that was produced inside the stream of one worker, such as the `pass.*`, `tool.call` and `usage.reported` of its passes: it is none of the seven, and it MUST carry the envelope fields `workerId` and `wseq`. `parallel.admission` MUST carry `taskId`, the check and its result, one event for each check of each task; `parallel.integration` MUST carry `step` and `pathCount`, a count of paths and never a path. They MUST project to nothing. A reader that does not know them MUST ignore them.
  - divergence: DV-088
  - parity: off (row 20 of annex X §X.7)
  - test: CT-111-115

- **F111-FR-016**: No event MUST hold content. A prompt, a reply, the body of a tool argument and the output of a command MUST be referred to by logical name, hash and size. Every free-text field of an event MUST have passed the redaction ingress and MUST be cut to the cap of its class. The free-text fields are those that the catalogue marks, in the column "Free-text fields" of `data-model.md` and the column `free_text_fields` of `contracts/event-catalogue.tsv`, each with its ingress class; the mark is the only list, and `message`, `evidence`, `target`, `question`, `detail`, `reason`, `title`, `error`, `summary`, `cmd`, `argv`, `why`, `needs` and `options` are among the marked. A type that is added with a field of free text MUST mark it.
  - test: CT-111-116

#### G2 - The primary writer, ordering, best effort

- **F111-FR-017**: The primary file writer MUST be part of the core and MUST NOT be replaceable. At any moment exactly one process MUST write the event file of a run, as in F100-FR-005. The writer MUST give `seq` at the append, under the append lock of the run, and MUST write the event to the primary file before it calls any sink.
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-111-117

- **F111-FR-018**: `seq` MUST rise by one, without gaps, from 1 for each run. A writer that starts MUST read the last complete line of the file and continue after it, whatever writer wrote it. Each event MUST be one line with a final line end, written in one append. A reader MUST tolerate a torn last line. A writer that finds a last line without a line end MUST begin its first event on a new line.
  - test: CT-111-118

- **F111-FR-019**: Emission MUST be best effort. A failed write, a full disk or a missing file MUST never fail or stall a run. The failed event is dropped, MUST NOT use a `seq` and MUST reach no sink: a sink receives only events that are in the primary file. The next event that is written MUST be preceded by `event.dropped` with the count and the reason (`write-failed`, `invalid`, `too-large`). An empty destination MUST switch emission off without an error.
  - origin: C-020
  - disposition: translated
  - test: PT-111-C-020-*
  - divergence: DV-006; DV-115

- **F111-FR-020**: The writer MUST check the `data` of every event against the schema of its type before it writes it. An event that fails, and an event whose type is neither in the catalogue nor starts with `x.`, MUST NOT be written and MUST be counted in `event.dropped` with the reason `invalid`. The `data` of a type that starts with `x.` is not checked. The check MUST never throw into the loop.
  - test: CT-111-120

- **F111-FR-021**: The event file MUST be in the control plane, in the location that the logical name `run:<runId>:events` names. Tampering MUST be detected and not prevented: a reader MUST find a gap, a repeat or a fall of `seq` and report it, the doctor MUST warn, and the run MUST NOT be stopped.
  - test: CT-111-121
  - assumption: CQ-034

- **F111-FR-022**: Learning MUST have its own writer domain, its own `seq` and its own event file, `feature:<slug>:learning:events`, written by the learning feature under the same envelope and the same ingress. The projection MUST read that file as its own writer class.
  - test: CT-111-122

#### G3 - The redaction ingress, the widened patterns, the canary test

- **F111-FR-023**: Text from outside the runtime (a harness stream, the output of a check, a critic reply, the consumer's comment) MUST enter through one ingress with a class from the closed set of "Closed sets", where it is redacted first and cut second. `original_bytes` MUST be measured before redaction. Every sink, every prompt and every record MUST receive only the result. No code outside the ingress MUST redact.
  - divergence: DV-095
  - test: CT-111-123

- **F111-FR-024**: The redaction point MUST fail closed. When the redactor cannot run, or its pattern set is invalid, the content MUST be dropped, the record MUST say so by a mark of the closed set of "Closed sets", and the reference MUST be delivered in its place. A sink MUST never see the unredacted text.
  - test: CT-111-124

- **F111-FR-025**: The redaction of the baseline MUST be kept. The placeholder MUST be `[REDACTED]`. The keys `thinking`, `reasoning`, `chain_of_thought` and `chainofthought`, in any case, MUST be dropped and counted as a redaction. The value of a key equal, in any case, to `api_key`, `apikey`, `authorization`, `cookie`, `credential`, `password`, `secret`, `token`, `access_token`, `refresh_token` or `client_secret` MUST be replaced. In any text, `bearer` with 8 or more token characters, `sk-` with 8 or more of letters, digits, hyphen and underscore, `ghp_`, `gho_`, `ghu_`, `ghs_` and `ghr_` with 8 or more alphanumerics, and `api_key`, `api-key`, `apikey`, `token`, `secret` or `password` followed by `=` or `:` and a value (the whole, key name included) MUST be replaced.
  - origin: C-167; B-2203; B-2204; B-2205; B-2206; B-2207; B-2208; B-2209
  - disposition: ported
  - test: PT-111-C-167-redaction-rules

- **F111-FR-026**: The observability policy MUST treat targets as the baseline does. The string values of the keys `file`, `file_path`, `filename`, `notebook_path`, `path`, `paths`, `target`, `targets`, `destination` and `source` (also in camel case) MUST be taken as paths. The values of `command`, `cmd` and `script` MUST be split as a shell would split them (on a quoting error, at white space) to find paths. Extraction MUST be lexical: tokens that start with `-`, `http://` or `https://`, shell operators and tokens not shaped as paths MUST be discarded and duplicates removed. At most 8 targets MUST be kept. A tool argument MUST be summarised as `targets`, `summary` (the redacted JSON cut to the argument limit), `redacted`, `truncated`, `original_bytes` and `retained_bytes`.
  - origin: C-167; B-2210; B-2211; B-2217; B-2218
  - disposition: ported
  - test: PT-111-C-167-target-extraction

- **F111-FR-027**: Limits and truncation MUST be as at the baseline. The metadata fields of a sanitised value MUST be `redacted`, `truncated`, `original_bytes` and `retained_bytes`. The default limits in bytes MUST be: text 4096, tool arguments 2048, tool result 4096, diagnostic 1024, target 512; and 8 target paths. A limit that is not a positive integer MUST be refused with the message `observability limits must be positive integers`. Truncation MUST be by UTF-8 bytes, MUST drop a partial trailing character and MUST add no marker. Redaction MUST run before truncation.
  - origin: C-167; B-2212; B-2213; B-2214; B-2215; B-2216
  - disposition: ported
  - parity: the limits are the baseline's (row 44 of annex X §X.7)
  - assumption: CQ-177
  - test: PT-111-C-167-limits

- **F111-FR-028**: The retention policy MUST be kept as at the baseline: the version string `specstride-retention/v1`; raw capture disabled by default; raw retention 7 days; metadata retention 30 days; the tool result limit 4096 bytes. A metadata retention shorter than the raw retention MUST be refused with `metadata retention must not be shorter than raw retention`; a negative or non-integer number of days MUST be refused with `<name> must be a non-negative integer`. The metadata of the policy MUST be `policy_version`, `raw_capture_enabled`, `raw_retention_days` and `metadata_retention_days`. The decision MUST be a pure function: raw content is removed when its age in days is greater than the raw retention, metadata when greater than the metadata retention, and the removal of metadata MUST force the removal of raw content. Applying the decision to files is not part of this feature. This policy governs raw content that is retained in the control plane (row 45 of annex X §X.7) and is independent of `telemetry.content` (F111-FR-032), which governs what content reaches a sink: raw capture off does not switch content for telemetry off, and the reverse.
  - parity: the same as the default (row 45 of annex X §X.7)
  - assumption: CQ-177
  - origin: C-167; B-2219; B-2220; B-2221; B-2222; B-2223
  - disposition: ported
  - test: PT-111-C-167-retention

- **F111-FR-029**: The pattern set of the redactor MUST be wider than the baseline's and MUST contain it. It MUST be versioned data with the fields of annex X §X.4. Key names MUST match as a suffix or a substring (`*_token`, `*_key`, `*_secret`, `*password*`). Value patterns MUST cover private-key blocks, signed tokens, access key ids of clouds, addresses with embedded credentials and the prefixes of provider keys. The version of the set MUST be recorded in the run record and MUST change with every change of the set. On the fixtures of the oracle, no text MUST match a pattern that the baseline set does not match.
  - divergence: DV-095
  - test: CT-111-129

- **F111-FR-030**: A secret that the runtime resolved MUST be registered with the redactor at the moment of its use, and its exact value MUST be replaced in every text that enters the ingress from then on. The value MUST never be written to any state, event, log or contract.
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - test: CT-111-130

- **F111-FR-031**: The consumer's comment MUST pass the ingress before it is recorded. Before the runtime makes a commit, the files of the commit that the runtime wrote MUST be scanned with the same redactor for registered secrets and for the patterns; a hit MUST block the commit and raise `redaction.commit_blocked`, which names the files and the counts and never the matches. With the switch of F152-FR-021 on, the engine also raises `commit_gate.blocked`, which names the phase, the attempt ordinal, the rule ids of the block's signature, the number of files and the hash of the signature, and never a file name or a match (F152-FR-020).
  - test: CT-111-131

- **F111-FR-032**: Prompt and reply content for telemetry MUST be captured whenever traces are on, and the consumer MUST be able to switch it off. The primary event file MUST still hold references and no content. Content MUST reach a sink only through the content accessor that the core gives the sink at `open`, which reads by reference, redacts, and returns nothing when the redactor cannot run; a text that the point cannot treat MUST NOT be delivered and its reference MUST be delivered in its place. The compatibility projection MUST get the sanitised snippets that the old vocabulary shows (`text`, targets, summaries, result summaries, diagnostic messages) through the same accessor, only for its own files.
  - divergence: DV-083; DV-069
  - parity: `telemetry.content` off (row 16 of annex X §X.7)
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-111-132
  - assumption: CQ-032

- **F111-FR-033**: Before a release, a canary test MUST plant canaries of every class of the pattern set and a registered secret in the prompt, the reply of the model, the tool arguments, the tool output, the output of a check, the phase evidence and the comment, with content capture on and again with it off, and MUST assert that none appears in the event file, the projection files, any exporter payload, the digest, the status output or the read model. Passing MUST be a release condition.
  - test: CT-111-133

#### G4 - The sink interface contract

- **F111-FR-034**: The core MUST offer the sink interface contract of annex C §C.10: `open` with the context of the run and the content accessor, `write` with one event in the order of `seq`, `flush` and `close`. A sink MUST declare the range of event majors it accepts. The core MUST call a sink only after the primary write, only with the redacted event, which is the envelope of annex X §X.1 whole with its `data`, and MUST refuse a sink whose range does not hold the current major, with a doctor finding.
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-111-134

- **F111-FR-035**: A sink that is slow, throws or is dead MUST be skipped for the event. The core MUST bound the time of every call by `telemetry.sinkTimeoutMs`, MUST bound the queue of every sink, MUST record the failure as `telemetry.delivery` (sink, batch, event count, status `attempted`, `accepted`, `failed` or `unknown`, HTTP status, reason) and MUST go on. `telemetry.delivery` MUST NOT be delivered to a remote sink. The outcome of the run, the exit code and the primary event file MUST be unchanged.
  - parity: `telemetry.sinkTimeoutMs` 2000, not used (no other sink runs) (row 46 of annex X §X.7)
  - assumption: CQ-177
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-111-135

- **F111-FR-036**: The conformance suite of EP-08 MUST hold a slow sink, a throwing sink and a dead collector, and MUST assert equal exit code and equal event file with and without the failing sink. A sample sink that keeps events in memory MUST be registered from the test tree. No core file MUST name the sample.
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-111-136

- **F111-FR-037**: A reader and a sink MUST ignore a field and a type they do not know and MUST tolerate a torn last line. Types that start with `x.` MUST be free for third parties, MUST never be projected and MUST never change the read model. An event whose major is outside the accepted range MUST give a doctor warning and never a failure of a run.
  - test: CT-111-137

- **F111-FR-038**: The roles in events MUST come from the role registry of the run, and `supervisor` and `host`. An unknown role MUST be kept as text. A sink MUST enumerate no harness by name: it reads the registry.
  - test: CT-111-138

#### G6 - Types added after the cross-feature review

- **F111-FR-050**: The catalogue MUST hold the types with which the micro-loop layer and the check runner record their facts, each with the `data` of the table "Types added on 2026-09-30": `strategy.selected` (the strategy selected for a run, with the manifest hashes and the fallback reason), `microloop.inert` (a phase attempt that ended without a declared unit), `checkpoint.accepted`, `checkpoint.refused` (with a reason of annex X §X.6 row 138), `checkpoint.removed`, `check.excluded` (with its reason), `check.admission`, `check.parallelism_lowered`, `tripwire.raised` (with the breach kind of annex X §X.6 row 141 and the rule id) and `tripwire.cleared`. None of them MUST hold the output of a command, the note of a checkpoint or a path beyond what the redactor allows. They MUST project to nothing. The feature that owns the behaviour emits them.
  - divergence: DV-016
  - parity: the events project to nothing (rows 1 and 7 of annex X §X.7)
  - test: CT-111-150

- **F111-FR-051**: The catalogue MUST hold the types `source.change_accepted` (an intended change of a source that the consumer accepted, one event for each file: which of `spec`, `plan` or `tasks`, its logical name, the old hash, the new hash and the time), `fallback.skipped` (a fallback entry that was not used, with the entry and a reason of the set of feature 127) and `terms.override_used` (a use of an entry of `distribution.termsOverride`: the provider whose row gates, the auth tier and the audience), each with the `data` of the table "Types added on 2026-09-30". No count and no detail of how a change was accepted MUST be in `source.change_accepted`. They MUST project to nothing. The feature that owns the behaviour emits them.
  - divergence: DV-091; DV-048
  - parity: not observable: the flag, the fallback chain and the override are not used under `parity` (rows 15, 40 and 34 of annex X §X.7); the events project to nothing
  - test: CT-111-151

## Requirements moved to 144-compatibility-projection

Group G5 became feature `144-compatibility-projection`. The old ids are never reused; the sequence here has a gap from F111-FR-039 to F111-FR-049 and at F111-SC-005 and F111-SC-006.

| Old id | New id | Test before | Test after |
|---|---|---|---|
| F111-FR-039 | F144-FR-001 | CT-111-139 | CT-144-101 |
| F111-FR-040 | F144-FR-002 | CT-111-140 | CT-144-102 |
| F111-FR-041 | F144-FR-003 | PT-111-C-022-bash-line | PT-144-C-022-bash-line |
| F111-FR-042 | F144-FR-004 | PT-111-C-066-critic-line | PT-144-C-066-critic-line |
| F111-FR-043 | F144-FR-005 | PT-111-C-013-quirks | PT-144-C-013-quirks |
| F111-FR-044 | F144-FR-006 | PT-111-C-007-ambient-fields | PT-144-C-007-ambient-fields |
| F111-FR-045 | F144-FR-007 | PT-111-C-013-run-stop | PT-144-C-013-run-stop |
| F111-FR-046 | F144-FR-008 | PT-111-C-011-legacy-file | PT-144-C-011-legacy-file |
| F111-FR-047 | F144-FR-009 | CT-111-147 | CT-144-109 |
| F111-FR-048 | F144-FR-010 | CT-111-148 | CT-144-110 |
| F111-FR-049 | F144-FR-011 | CT-111-1 | CT-144-1 |
| F111-SC-005 | F144-SC-001 | — | — |
| F111-SC-006 | F144-SC-002 | — | — |

Moved as-is ids: 002 FR-023; the clusters C-007, C-013, C-022, C-052, C-061, C-066; the item B-0166 of C-011.

### Key Entities

| Entity | What it is |
|---|---|
| Event | One typed record of the stream: the envelope of feature 100 and a `data` of its type |
| Event type | A name of the catalogue with its `data` schema |
| Pair | An opening type and its closing type |
| Primary writer | The one process that appends to the event file of a run |
| Ingress | The one place where outside text is redacted and cut |
| Pattern set | Versioned data: key names and value patterns of the redactor |
| Sink | A destination that receives events after the primary write |

## Event catalogue

This is the content that feature 100 leaves to this feature. Every `data` also holds the ids of annex B §B.3 that apply. The full field lists are in `data-model.md` and `contracts/event-catalogue.tsv`.

| Area | Types | Key `data` |
|---|---|---|
| Run and launch | `run.launched`, `run.started`, `run.ended` | reason, counts carried and reset; workdir, phases, proposer, critic, resume, verification mode; outcome, stop reason, exit code, `endCause`, `causedBy`, `synthesized` |
| Pause, quota, alerts | `run.paused`, `run.resumed`, `quota.signal`, `harness.error`, `fallback.switched`, `fallback.restored`, `alert`, `budget.exceeded`, `host.quota_observed` | class, role, `resetsAt`, `pausedMs`, level, threshold |
| Blocked | `blocked`, `unblocked`, `counters.reset` | reason, needs, changed source; `by`, `latencyMs` |
| Pipeline and supervisor | `pipeline.started`, `pipeline.ended`, `stage.started`, `stage.ended`, `launch.checked`, `supervisor.observed`, `supervisor.relaunch`, `supervisor.stopped`, `digest.written` | stage id and kind, reasons, exit codes, decision; on `pipeline.started` the hash of the consumer's comment, the comment itself through the ingress class `comment`, the options it changed and the harness a judgment was delegated to (feature 107, F107-FR-035, F107-FR-011) |
| Phase and phase attempt | `phase.started`, `phase.ended`, `attempt.started`, `attempt.ended`, `attempt.archived`, `attempt.acceleration_note`, `attempt.tier_bumped`, `attempt.tier_bump_skipped`, `escalation.skipped`, `recovery.triggered`, `recovery.diagnosis_started`, `recovery.diagnosis_done`, `recovery.diagnosis_failed`, `gate.oscillation` | phase, title, kind, `endCause`, `outcome`, work products |
| Pass | `pass.started`, `pass.ended`, `pass.limits_set`, `pass.killed`, `pass.short`, `pass.halted`, `prompt.built`, `prompt.block_dropped`, `prompt.block_protected`, `evidence.present`, `evidence.written`, `progress.swept`, `commit.made`, `plugin.installed`, `plugin.install_failed`, `plugin.install_denied` | session, `endCause`, time split, bytes per block |
| Stream | `tool.call`, `stream.init`, `stream.text`, `stream.result`, `stream.diagnostic`, `stream.mode`, `stream.evidence_writing`, `stream.missing_terminal` | tool, category, status, `argsRef`, `resultRef`, the four marks, reason code |
| Usage | `usage.reported`, `usage.unavailable` | usage record, reason |
| Verification and jobs | `verification.started`, `verification.ended`, `verification.release_passed`, `verification.prestaged`, `check.started`, `check.ended`, `job.started`, `job.step`, `job.first_failure`, `job.ended`, `yield.started`, `yield.waiting`, `yield.ended`, `yield.refused`, `resource.wait`, `microloop.unit`, `task.planned`, `task.ticked`, `tasks.ticked` | check, result, `batch`, `slot`, `concurrent`, kind, predicate, unit |
| Critic and verdict | `critic.selected`, `critic.started`, `critic.call`, `critic.grounding_gap`, `critic.grounding_carried`, `critic.citation_unresolved`, `critic.malformed`, `verdict.recorded`, `verdict.adjudicated` | form, outcome, verdict, nonce match, `diversity`, `sameModelWarning` |
| Routing and integrity | `route.decided`, `integrity.noted`, `integrity.events_changed`, `learning.observed` | table, rule, kind |
| Learning stream | `learning.knob_adjusted`, `learning.knob_auto_reverted`, `learning.knob_evaluated` | knob, from, to |
| Delivery and redaction | `telemetry.delivery`, `event.dropped`, `redaction.commit_blocked`, `commit_gate.blocked`, `redaction.dropped` | sink, status, count; phase, attempt, rule ids, file count, signature hash |
| Parallel units | the seven `parallel.*` types of F111-FR-015 | group, worker, `taskId`, `step`, `pathCount` |
| Loop layer and check runner (F111-FR-050) | `strategy.selected`, `microloop.inert`, `checkpoint.accepted`, `checkpoint.refused`, `checkpoint.removed`, `check.excluded`, `check.admission`, `check.parallelism_lowered`, `tripwire.raised`, `tripwire.cleared` | strategy, manifest hashes, fallback reason; unit, task ids; reason; breach kind, rule id |
| Run control, fallback, terms (F111-FR-051) | `source.change_accepted`, `fallback.skipped`, `terms.override_used` | file, old and new hash; entry, reason; provider, auth tier, audience |

Pairs: `run.started` and `run.ended`; `run.paused` and `run.resumed`; `blocked` and `unblocked`; `pipeline.started` and `pipeline.ended`; `stage.started` and `stage.ended`; `phase.started` and `phase.ended`; `attempt.started` and `attempt.ended`; `pass.started` and `pass.ended`; `verification.started` and `verification.ended`; `check.started` and `check.ended`; `job.started` and `job.ended`; `yield.started` and `yield.ended`; `critic.started` and `critic.call`; `recovery.diagnosis_started` and `recovery.diagnosis_done` or `recovery.diagnosis_failed`; `parallel.group.started` and `parallel.group.ended`; `parallel.worker.started` and `parallel.worker.ended`.

### Types added on 2026-09-30

Fourteen types were added on 2026-09-30; all are of the kind `instant`, have no partner and project to nothing. Two more rows of this table record types that were proposed on the same day and retired before the catalogue took them (second pass, item C8); they are not in the catalogue. "Emitted by" names the requirement that the fields were taken from. A field that takes the name of a closed set holds a member of it.

| Type | `data` fields | Sets and meaning | Emitted by |
|---|---|---|---|
| `strategy.selected` | `strategy`, `level`, `manifestHashes`, `fallbackReason` | `strategy`: annex X §X.6 row 55. `level`: row 56. `manifestHashes`: a list of logical name and hash, the check manifest among them. `fallbackReason`: row 59, or null when the layer is on. Written once for each engine start, at launch. The strategy of a phase attempt is the field `strategy` of `attempt.started`; a layer that goes off inside a phase attempt is told by `microloop.unit`, fields `layerOff` and `fallbackReason` | F115-FR-005, F115-FR-037 |
| `microloop.inert` | `phase`, `attempt` | A phase attempt with the layer on ended and no unit was declared | F115-FR-037 |
| `checkpoint.accepted` | `unitId`, `taskIds`, `checkpointRef` | `taskIds`: the task ids, or the criterion indexes, that the checkpoint names (free text, marked). `checkpointRef`: `unit:<unitId>:checkpoint` with hash and size. The note is never in the event | F115-FR-009, F115-FR-010 |
| `checkpoint.refused` | `reason`, `bytes` | `reason`: annex X §X.6 row 138. `bytes`: the size of the file, or null when it could not be read | F115-FR-011 |
| `checkpoint.removed` | `bytes` | A checkpoint that was present when a pass started | F115-FR-010 |
| `check.excluded` | `checkId`, `reason`, `scope`, `durationMs`, `ruleId` | `reason`: `flaky`, `slow`, `budget` (the three exclusions of the decision point `tools`, annex X §X.6 row 67). `scope`: `attempt` or `phase`, for how long the command is excluded. `durationMs`: the measured duration, or null. `ruleId`: the router rule, or null when routing is off | F115-FR-020, F115-FR-023 |
| `check.admission` | `checkId`, `batch`, `slot`, `result`, `reason` | `slot`: null for a refusal. `result`: `admitted`, `refused`. `reason`: annex X §X.6 row 236 | F148-FR-012 |
| `check.parallelism_lowered` | `from`, `to`, `batch`, `phase`, `attempt`, `reason` | `to` is 1. `reason`: a reason of `tainted` (annex X §X.6 row 53); today `changed-during-check` | F148-FR-014 |
| `tripwire.raised` | `kind`, `ruleId` | `kind`: annex X §X.6 row 141. The fields of the tripwire record (annex B §B.18) | F115-FR-041 |
| `tripwire.cleared` | `clearedAt` | Written in the first engine start after `tripwire clear`; `clearedAt` is the time of the command, or null when it is not known | F115-FR-041 |
| `source.change_accepted` | `file`, `changedRef`, `oldHash`, `newHash`, `acceptedAt` | One event for each file accepted. `file`: `spec`, `plan` or `tasks` (annex X §X.6 rows 50 and 135), a member of a set and no path. `changedRef`: the logical name, as in `blocked`. `acceptedAt`: the time recorded in the run snapshot. No text of the source | F102-FR-019, F102-FR-020, F102-FR-036 |
| `fallback.skipped` | `entry`, `entryHarness`, `entryProvider`, `authTier`, `audience`, `reason` | `entry`: the position of the entry in the fallback list of the role. `reason`: the set "Reasons that skip a fallback entry" of feature 127 (`terms-refused`, `no-cap`, `not-in-plan`, `limited`). The role is the envelope field `role`; the envelope fields `harness` and `provider` name the entry in use, not the skipped one | F127-FR-020, F127-FR-021, F147-FR-009 |
| `critic.citation_unresolved` | `phase`, `attempt`, `paths` | `paths`: the cited paths and wildcards that did not resolve, at most the first 20, of the ingress class `target`; a path outside the workspace is `outside:<16 hex of its canonical hash>` (F117-FR-043). Not the as-is `grounding_gap`, which `critic.grounding_gap` carries | F117-FR-015 |
| `critic.passed_over` | retired | Retired on 2026-09-30 (second pass, item C8): the type is not in the catalogue. The pass-over reasons of an automatic pick stay on the announcement line and in the field `criticPick` of the resolved registry (feature 124); the catalogue keeps `critic.selected` only among the four proposed types | F124-FR-041, F124-FR-048 |
| `critic.diversity` | retired | Retired on 2026-09-30 (second pass, item C8): the type is not in the catalogue. The warning rides `critic.selected` at launch and `critic.call` before a call (F111-FR-011), whether or not the line is silenced | F124-FR-045, F124-FR-046, F124-FR-047 |
| `terms.override_used` | `termsProvider`, `authTier`, `audience` | `termsProvider`: the provider whose row of the terms table gated the call. `authTier`: annex X §X.6 row 40. `audience`: row 41. One event for each launch and each switch that relies on the entry | F147-FR-006, F147-FR-009 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F111-SC-001**: The twenty telemetry gaps are closed. Each of the 20 gaps of the time-use baseline (EV-01 to EV-20) has an event that a named fixture produces: 20 of 20.
- **F111-SC-002**: Every run ends on record. 100 per cent of the engine starts of the fixtures, those that end by a kill included, have a terminal event, written by the engine start or synthesized by the next launch.
- **F111-SC-003**: A sink never breaks the loop. In the 3 conformance fixtures (slow, throwing, dead) the exit code and the primary event file equal those of the run without the failing sink, byte for byte after normalization.
- **F111-SC-004**: No planted canary reaches a sink. On the release candidate, with capture on and off, 0 of the canaries (every pattern class, seven places) appear in any sink.
- **F111-SC-007**: `seq` is intact. In 100 per cent of the event files of the fixtures, `seq` rises by one without a gap or a repeat, including after a relaunch.
- **F111-SC-008**: Redaction fails closed. In 100 per cent of the test cases in which the redactor is made unavailable, 0 items of content are delivered and the reference is delivered.
- **F111-SC-009**: Every requirement has a test. The 34 requirements EV-01 to EV-34 each have a named test, and 100 per cent of the requirements of this specification have one.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| One event schema and one exporter for the whole product | Decision 11 |

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-08 | `specstride.event-sink/1` | implements | The core side of the sink interface contract, the primary writer, the conformance suite and the sample sink |
| EP-10 | `specstride.secret-resolver/1` | consumes | Registers each resolved secret with the redactor at the moment of use |

The OTLP exporter and the Loki sink of EP-08 belong to feature 128, the compatibility projection sink to feature 144.

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| Event envelope and versioning, `specstride.event/1` | X §X.1; F100-FR-198 to F100-FR-200 |
| Event sink, `specstride.event-sink/1` | C §C.10; F100-FR-104 to F100-FR-106 |
| Redactor, `specstride.redaction/1` | X §X.4; F100-FR-205, F100-FR-206, F100-FR-219 |
| Identifiers | B §B.3 |
| Writer of the event file; learning writer domain | A §A.2; F100-FR-005 |
| Ingress | A §A.2; F100-FR-009 |
| Layout, `specstride.layout/1` (events, learning events) | B §B.5 |
| Blocked reasons | E §E.2 |
| Terminal record | B §B.15 |
| The `parity` profile | X §X.7 |
| Closed sets | X §X.6. Owned here: rows 72, 73, 74, 89, 90, 93, 94, 95, 96, 271, 272, 273. Cited: rows 5, 10, 40, 41, 50, 53, 55, 56, 59, 67, 135, 136, 138, 140, 141, 183, 236 |
| Threats T-05, T-17, T-31, T-32, T-33, T-37 | X §X.9 |

## Rows of the `parity` profile

| Switch or option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Content capture in telemetry (consumed, owned by 128) | `telemetry.content` | follows traces | off | 16 | DV-083 |
| Limits of the observability policy | `observability.limits.text`, `.toolArguments`, `.toolResult`, `.diagnostic`, `.target`, `.maxTargets`, `.freeText` | 4096, 2048, 4096, 1024, 512, 8, 1024 | the same (the baseline's) | 44 | DV-095 does not apply |
| Retention policy | `observability.retention.rawCapture`, `.rawDays`, `.metadataDays` | off, 7, 30 | the same | 45 | none |
| Time limit of a sink call | `telemetry.sinkTimeoutMs` | 2000 | not used | 46 | none |

## Closed sets

Rows 72, 73, 74, 89, 90, 93, 94, 95, 96, 271, 272 and 273 of annex X §X.6 are owned here. The three sets added on 2026-09-30 are rows 271, 272 and 273, appended by the second pass of feature 100 (item W-100-18), with these members and these rules for an unknown value. The meaning of each member is in `data-model.md`, section "End causes and outcomes".

| Set | Members | Unknown value |
|---|---|---|
| Event roles (row 72) | The role registry of the run, and `supervisor`, `host` | Kept as text |
| Event types (row 73) | The catalogue above; the prefix `x.` is free | Ignored by readers |
| `parallel.*` types (row 74) | The seven of F111-FR-015 | Ignored by readers; they project to nothing |
| Ingress classes (row 89) | `stream-text`, `tool-arguments`, `tool-result`, `diagnostic`, `target`, `check-output`, `critic-reply`, `comment`, `free-text` | Treated as `free-text` |
| Marks of dropped content (row 90) | `redactor-unavailable`, `pattern-set-invalid` | Read as `redactor-unavailable` |
| Delivery statuses (row 93) | `attempted`, `accepted`, `failed`, `unknown` | `unknown` |
| Reasons of `event.dropped` (row 94) | `write-failed`, `invalid`, `too-large` | `write-failed` |
| Categories of a tool call (row 95) | `read`, `edit`, `exec`, `wait`, `search`, `other` | `other` |
| Causes of a synthesized `run.ended` (row 96), field `endCause` where `synthesized` is true | `crash`, `host_exit`, `operator_stop` | `crash` |
| End causes of a pass (row 271), field `endCause` of `pass.ended` | `evidence`, `completed`, `yield`, `no_progress`, `error`, `killed`, `hard_cap`, `quota_pause`, `stopped`, `crash` | Read as `error` |
| End causes of a phase attempt (row 272), field `endCause` of `attempt.ended` | `approved`, `rejected`, `malformed`, `verification-failed`, `no-evidence`, `budget`, `blocked`, `stopped`, `error`, `crash` | Read as `error` |
| Outcomes of a phase (row 273), field `outcome` of `phase.ended` | `approved`, `halted`, `blocked`, `stopped`, `crash` | Read as `halted` |

The members with an underscore (`no_progress`, `hard_cap`, `quota_pause`, `host_exit`, `operator_stop`) and the member `verification-failed` keep the spelling under which other features and the projection table already select them. The field `endCause` of a `run.ended` that is not synthesized takes row 5 of annex X §X.6 (owner 101): `normal`, `crash`, `owner-lost`.

## As-is behaviour not carried

No row of the traceability files that is assigned to this feature has the disposition `superseded-by` or `dropped`. 

## Clarifications

### Session 2026-09-29

Answered from the sources. No question was put to a person.

- Q: Does the compatibility projection get the text that the old `agent_text` and `agent_tool` events carry, given that no event holds content and content reaches a sink only while capture is on? -> A: Yes, through the content accessor, only for its own files and only redacted; the projection carries the baseline's local snippets and is not telemetry content. (Source: F100 annex C §C.10; DV-007; DV-083; B-2083, B-2084; recorded as CQ-032)
- Q: Is the event file tamper-evident by a hash chain, as R11 T-31 proposes? -> A: No. Feature 100 fixes the envelope without a `prev` hash and names `seq` without gaps; tampering is detected by `seq`. (Source: F100 annex X §X.1, threat T-31; R11 T-31; recorded as CQ-034)
- Q: Where does the parity default of the content switch stand? -> A: Off, as row 16 of annex X §X.7; content follows traces otherwise. (Source: ruling 43; DV-083)
- Q: Does the pattern set change under `parity`? -> A: No. The widened set contains the baseline's, and no fixture text matches a widened-only pattern; the divergence is row DV-095. (Source: ruling 43; R11 F-12)
- Q: Is the retention decision applied here? -> A: No. This feature ports the policy and its pure decision; the sweep belongs to the feature that owns invocation retention. (Source: brief 111 heading 1; B-2219 to B-2223)
- Q: Which spelling does a key get? -> A: Annex X §X.7 where a row exists (`compat.legacyEvents`, `telemetry.content`); otherwise the keys of the table "Rows of the `parity` profile" (rows 44, 45 and 46 of annex X §X.7); feature 110 owns the spelling. (Source: STAGE-B-TIER2-PROMPT)
- Q: Does an event of a killed process get a closer? -> A: Yes, synthesized by the next writer. (Source: F100-FR-200; EV-15, EV-23)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary; no definition is repeated.
- The specification was split: group G5 (11 requirements) is feature 144. The divergence register is `consolidation.md` section 5; this specification cites its rows by id and states no count.
- No type of the catalogue is named `gate`. The verdict is `verdict.recorded`. The as-is names `api_request`, `tool_use` and `gate` of the telemetry export are made by the exporter of feature 128 from `stream.result`, `tool.call` and `verdict.recorded`; they are no types and have no row here.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-032 | Feature 100 annex C §C.10 says that content reaches a sink only while capture is on, but the projection must write the snippets of the old vocabulary while capture is off under `parity` | The projection is a sink with access to the sanitised snippets of the old vocabulary for its own files; every other sink follows the switch | F111-FR-032 |
| CQ-034 | R11 T-31 asks for a hash of the previous record; the envelope of feature 100 has none | Detection by `seq` only | F111-FR-021 |
| N-111-1 | The ledger record `disengaged` of feature 115 carries a cause and, where one applies, a fallback reason; no source closes the set of causes, and row 59 of annex X §X.6 holds the fallback reasons only | Seven causes: `caps` (a cap of cycles spent, or the cap of unresolved units reached), `integrity` (an integrity event other than a taint, `ledger-invalid` among them), `check-error` (a check cannot start), `no-check`, `single-unit` (the two fallbacks of a phase attempt), `layer-error` (the code of the layer failed, or it returned a value the engine does not know), `breach` (`layerOffForRun`); owner 115; a row of annex X §X.6 to be appended by feature 100 | F111-FR-008 |
| CQ-176 | The type names `run.started` and `run.ended` say "run" and bracket an engine start | The spelling of feature 100 is kept; the ids tell the logical run and the engine start apart | F111-FR-001 |
| CQ-177 | The limits, the retention and the sink time limit have no row in annex X §X.7 | Rows 44, 45 and 46 of annex X §X.7 hold them; the value under `parity` equals the default, and the time limit of a sink is not used | F111-FR-027, F111-FR-028, F111-FR-035 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused.

| Requirement or section | Item | What changed |
|---|---|---|
| F111-FR-001 | W-111-02 | An event whose type is neither in the catalogue nor starts with `x.` is not written and is counted; a fact without a type gets a type here first |
| F111-FR-005 | W-111-05 | The `data` field is `endCause`; how row 96 relates to row 5 of annex X §X.6 |
| F111-FR-007 | W-111-05; W-111-04 | `endCause` of `pass.ended` is a closed set of ten members; `tool.call` carries `argsRef`, `resultRef` and the four marks |
| F111-FR-008 | W-111-01 | The result of `microloop.unit` is `kept`, `repair`, `unresolved` (row 136) |
| F111-FR-010 | W-111-05 | `endCause` of `attempt.ended` and `outcome` of `phase.ended` are closed sets |
| F111-FR-009 | report of feature 102 | `by` of `unblocked` is text and no closed set; `operator` for `resume`; `answerRef` may be null |
| F111-FR-011 | row 23 of the table of feature 100's repair report; report of feature 124 | "critic-diversity warning" in place of "same-model warning"; the field `sameModelWarning` of `critic.selected` is renamed `diversityWarning`; new field `diversity` |
| F111-FR-014 | W-111-05 | `endCause` in place of "cause" |
| F111-FR-015 | W-111-09; W-111-03 | The seven types are events of the main line about a group or a worker; `taskId` on `parallel.admission`; `step` and `pathCount` on `parallel.integration` |
| F111-FR-019 | report of feature 126 (DV-115) | A dropped event reaches no sink |
| F111-FR-034 | report of feature 126 | A sink receives the envelope whole |
| F111-FR-016 | W-111-06 | The free-text fields are those the catalogue marks |
| F111-FR-020 | W-111-02 | An event without a catalogue type is counted with the reason `invalid`; the `data` of an `x.` type is not checked |
| F111-FR-027, F111-FR-035 | W-X-11 | Rows 44 and 46 of annex X §X.7 by number; `assumption: CQ-177` |
| F111-FR-028 | W-111-08; W-X-11 | The retention policy is independent of `telemetry.content`; row 45 |
| F111-FR-050 (new) | W-111-02 | Ten types of the micro-loop layer and of the check runner; test CT-111-150 |
| F111-FR-051 (new) | W-111-02 | Three types of run control, fallback and the terms gate; test CT-111-151 |
| F111-FR-052 (new) | report of feature 124 | Two types of the critic pick; test CT-111-152 |
| "Event catalogue" | W-111-02 to W-111-05 | Two rows and the table "Types added on 2026-09-30" |
| "Closed sets" | W-111-05 | Three new sets; the rows 89, 90 and 93 to 96 named by number |
| "Rows of the `parity` profile", "Assumptions", "Clarifications" | W-X-11; W-X-05 | "Key" in place of "Key (proposed)"; rows 44 to 46 exist; no count of the register |

### Second pass after the cross-feature review (2026-09-30)

Items C1 to C10 of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`, section C. No id was renumbered or reused.

| Requirement or section | Item | What changed |
|---|---|---|
| F111-FR-008 | C2 | `check.started` carries `batch` and `slot`; `check.ended` those and `concurrent` (the fields of 148's `data-model.md`, "Events this feature needs") |
| F111-FR-011 | C9; C8 | The warning field is named `sameModelWarning` again (the first pass had renamed it `diversityWarning`; features 124 and 149 keep `sameModelWarning`, which stands); the field is true only for `same-model` and `unverified`. `critic.call` carries `diversity` and `sameModelWarning` for a call at which the warning was raised, so that the per-call record of feature 124 has a catalogue event without the retired type |
| F111-FR-012 | C6 | `escalation.skipped` is written for every skip, with a reason of annex X §X.6 row 140; `quota` when the target had no quota (the wording the report of feature 115 recommends) |
| F111-FR-052 | C8 | Retired: the types `critic.passed_over` and `critic.diversity` are not in the catalogue; the facts ride `critic.selected` and `critic.call`. The id and the test name CT-111-152 are retired, never reused. Reported as a question for the owner |
| "Event catalogue" | C2; C8; C9 | The two new fields of the check pair; the row "Critic pick" removed; the retired rows keep their note in "Types added on 2026-09-30" |

### Re-check B-8.7 (2026-09-30)

Made by the re-check of act B-8.7 (`docs/ecosystem/reviews/B-8.7-D.md`). No requirement id, test or
task changed in number.

| Requirement or place | What changed | Why |
|---|---|---|
| F111-FR-007, F111-FR-010 | The closed sets of `endCause` and `outcome` name their rows of annex X §X.6 (271, 272, 273); the members are unchanged | Feature 100 appended the rows in its second pass (W-100-18); the text still said they had no row |
| "Closed sets"; "Contracts of feature 100 used" | Rows 271 to 273 named as owned here | As above |

Verified in this pass and unchanged: the members and the unknown-value rules of rows 271, 272 and
273 of annex X §X.6 equal this feature's sets, and the relation of rows 5 and 96 stated after that
table equals the table of `run.ended` in `data-model.md`; every dotted event type that another
specification names as emitted is in `contracts/event-catalogue.tsv`, except `critic.diversity` and
`critic.passed_over`, which the second pass retired (CQ-211) and which features 124, 129 and 144
still name; the fields that the emitting requirements of 102, 142, 148 and 127 state are fields of
their types in the catalogue.

### Re-check B-8.7 part F (2026-09-30)

Ripple R-111b of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`, section F (`docs/ecosystem/reviews/B-8.7-F.md`). No id was renumbered or reused.

| Requirement or place | What changed | Why |
|---|---|---|
| F111-FR-008 | `layerOff` of `microloop.unit` holds the cause of the ledger record `disengaged` (seven causes); the new field `fallbackReason` holds the member of row 59 where one applies; `assumption: N-111-1` | The layer also goes off for a spent cap, two unresolved units and an integrity event, which are no fallback reasons (report of feature 115) |
| "Types added on 2026-09-30" (`strategy.selected`); "Assumptions"; `data-model.md`; `contracts/event-catalogue.tsv` | The field `fallbackReason` of `microloop.unit`; the question N-111-1; the meaning of the causes | As above |
