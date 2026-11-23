# Feature Specification: Compatibility projection

**Feature Branch**: `144-compatibility-projection` (a label: Spec Kit creates no branch in this repository; the directory is `specs/144-compatibility-projection`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 144-compatibility-projection: the table-driven sink that renders the new events in the old vocabularies of Specstride and mixture-of-loops into files of their own, byte-identical to the baselines on the oracle's fixtures after normalization. It was group G5 of feature 111 and is split from it."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` section 12, `consolidation.md` (C-06, DV-006, DV-007, DV-016, DV-027, DV-037, DV-067, DV-074, DV-088), `feature-briefs.md` (brief 111, group G5), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes B, C, G, X), feature 141, and research R14, R18, R19.

## What this feature is

The primary event stream is typed and new. The parity oracle compares the port with baselines that write another vocabulary: Specstride's v1 lines with string values, duplicate keys and two `run_stop` lines for one stop, and the labelled files of mixture-of-loops. The compatibility projection is a sink of the event-sink interface contract (annex C §C.10) that renders each event in the old vocabulary, or in nothing, through one table with a row for every event type. It writes only to files of its own. It is always on under the `parity` profile and under `compat.legacyEvents`, and off otherwise.

The event catalogue, the primary writer, the redaction ingress and the sink dispatcher are not here. The projection consumes them through the contracts of feature 100: the event envelope (annex X §X.1), the event catalogue (annex X §X.6, row 73), the sink contract (annex C §C.10) and the redactor (annex X §X.4).

**In scope**: the projection sink; its table; the shapes of the old lines (the Bash emitter, the Python emitters, the learning emitter); the quirks that are kept; the ambient fields and the event context; the halt path with two `run_stop` lines; the files of the projection; rows that project to nothing; the compared logs of the pipeline runtime and the supervisor as far as the projection writes them.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The event catalogue, the envelope, the primary writer, redaction, the sink dispatcher | 111 (content), 100 (envelope) |
| Compatibility output lines on standard output and standard error, and the text of each `[MOL-*]` and `[DIGEST]` line | 119, 123 |
| The OTLP exporter, the Loki sink, metrics | 128 |
| The oracle itself, the normalizer and the comparator | 141 |
| Emission of each event | The feature that owns the behaviour |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The oracle compares the old vocabulary (Priority: P1)

The parity oracle compares the port with the baselines. The old event vocabulary has string-typed values, duplicate keys and two `run_stop` lines for one stop.

**Why this priority**: Every parity test of every feature that names the surface `events` depends on the projection.

**Independent Test**: On every fixture family FX-01 to FX-40 that names the surface `events`, the projection file of the port equals the reference's file after the rules N-12, N-13 and N-14.

**Acceptance Scenarios**:

1. **Given** the `parity` profile, **When** a fixture runs, **Then** the projection is on and the primary stream is not compared (F144-FR-001).
2. **Given** the events of a fixture, **When** the projection renders them, **Then** duplicate keys, string typing and the two `run_stop` lines are as at the baseline (F144-FR-005, F144-FR-007).
3. **Given** an event with no as-is equivalent, **When** the projection meets it, **Then** it writes nothing (F144-FR-009).

---

### Edge Cases

- Two engine starts belong to one run: the projection writes one file for each engine start (F144-FR-008).
- The projection is off: no projection file exists (F144-FR-008).
- A type is added to the catalogue without a row: the consistency test fails (F144-FR-002).
- A write to a projection file fails: it is ignored and the run goes on (F144-FR-008; F144-FR-011).
- A stop that both the engine and the pass loop report: two `run_stop` lines (F144-FR-007).

## Requirements *(mandatory)*

### Functional Requirements

The written form of `STAGE-B-RULES.md` section 4 is used. A requirement without an as-is origin has the test `CT-144-<100 + n>`, where n is the number of the requirement. The words "type" and "event catalogue" mean the catalogue of annex X §X.6, row 73.

#### The compatibility projection

- **F144-FR-001**: The compatibility projection MUST be a sink of EP-08 that writes to files of its own and never to the primary stream. It MUST be on under the `parity` profile and under `compat.legacyEvents`, and off otherwise. On the fixtures of the oracle its output MUST be byte-identical to the baseline's after the rules N-12, N-13 and N-14. There MUST be no such promise elsewhere.
  - divergence: DV-007
  - parity: on (row 17 of annex X §X.7)
  - ep: EP-08 `specstride.event-sink/1` (implements)
  - test: CT-144-101
  - assumption: CQ-032

- **F144-FR-002**: The projection MUST be table-driven. The table MUST have one row for every event type of the event catalogue (annex X §X.6, row 73), a row that projects to nothing included, and MUST be generated from the same source as the event catalogue. A test MUST fail when a type has no row, and when a name of the old vocabulary is the target of no row. Every one of the 66 names of events of a file, among the 70 names that the behaviour inventory holds in items of kind `event` (the other four, `_reopen`, `gate`, `tool_use` and `api_request`, are events of no file), MUST be the target of a row, apart from `gates_migrated` (not carried, DV-037); the three names of the learning stream MUST be rows of the shape and of the writer class `learning`.
  - divergence: DV-007; DV-037
  - test: CT-144-102
  - assumption: CQ-178

- **F144-FR-003**: A row of the shape `bash` MUST write one JSON object per line with `ts` (seconds, a point, and nanoseconds, as a string), `time` (ISO 8601 with the offset), `event`, then `run_id`, `task`, `backend`, `feature` and `trace_id` where the run's event context holds them, then the pairs of the row, all values as JSON strings. Escaping MUST turn backslash, double quote, tab and newline into their escapes, MUST delete carriage returns and MUST leave other control characters raw. A trailing key without a value MUST be dropped. Where the platform cannot give nanoseconds, `ts` MUST be whole seconds.
  - origin: C-022; B-0361; B-0362; B-0363; B-2465; B-2466
  - disposition: ported
  - test: PT-144-C-022-bash-line

- **F144-FR-004**: A row of the shape `python` (the critic and the tap) MUST write `ts` with six decimals as a string, `time` in the form `%Y-%m-%dT%H:%M:%S%z` and `event`, keep the JSON types of the other values and drop the fields whose value is null. Emission MUST be best effort: a failed write is swallowed and an empty destination switches emission off. A row of the shape `learning` MUST write `event` first and `ts`, and no `time`.
  - origin: C-066; B-0997; B-0998
  - disposition: ported
  - test: PT-144-C-066-critic-line

- **F144-FR-005**: The projection MUST reproduce the quirks of the old vocabulary as the baseline has them: `run_start` with the key `feature` twice, `proposer_start` with the key `backend` twice and with two different values (the ambient label and the proposer), values written as strings where the row is of the shape `bash` and typed where it is not. The oracle reads lines as ordered pairs of key and value with types kept. The new schema stays typed.
  - origin: C-013; B-2463; B-2464
  - disposition: ported
  - divergence: DV-007
  - test: PT-144-C-013-quirks

- **F144-FR-006**: The projection MUST write the ambient fields from the event context of the run: `run_id` in the as-is form of annex B F100-FR-046 (date and time of the engine start, a hyphen, the process id), `task` the name of the working directory, `backend` the label `prop:<proposer>/crit:<critic>`, `feature` the slug and `trace_id`. Under the `parity` profile the processes the runtime starts MUST receive the event context under the as-is variable names `SPECSTRIDE_EVENTS`, `SPECSTRIDE_RUN_ID`, `SPECSTRIDE_TASK`, `SPECSTRIDE_BACKEND_LABEL`, `SPECSTRIDE_FEATURE`, `SPECSTRIDE_TRACE_ID` and `SPECSTRIDE_MAX_REJECTS`. Under the `parity` profile those processes MUST also receive `SPECSTRIDE_SHIP`, the as-is name of the shipper program, with an empty value: no shipper program exists (DV-065), nothing reads the variable, and the transcript compares names only. The environment alias table of annex X §X.8 holds `SPECSTRIDE_BACKEND_LABEL`, `SPECSTRIDE_FEATURE` and `SPECSTRIDE_MAX_REJECTS`; the rows of the other four and of `SPECSTRIDE_SHIP` are proposed upstream fixes P3 and P4 of `analyze-report.md`, and until they exist this requirement fixes the names. The run id that a component generates for itself MUST have the form `<YYYYmmdd-HHMMSS>-<pid>`.
  - origin: C-007; C-052; C-061
  - disposition: translated
  - test: PT-144-C-007-ambient-fields; PT-144-C-052-run-id-form; PT-144-C-061-events-destination
  - divergence: DV-027; DV-006; DV-065

- **F144-FR-007**: Every halt of the engine MUST go through one path that writes the halt event and then appends the halt rail to the engine log, with the phase of the event in flight. Where the engine and the pass loop both write a reason for one stop, the projection MUST write two `run_stop` lines with different fields, the engine's being the newer. The `iter` field MUST tell the pass-level line from the engine-level line.
  - origin: C-013; B-0263
  - disposition: ported
  - divergence: DV-007
  - test: PT-144-C-013-run-stop

- **F144-FR-008**: The projection MUST write one file for each engine start, at the location of the logical name `run:<runId>:events-legacy:<k>`, where `<k>` is the ordinal of the engine start; the name without `<k>` resolves to the file of the newest engine start (F100-FR-229, annex B §B.5). It MUST create the file empty at the start of the engine start, and with it the engine log of the engine start, empty, at `run:<runId>:engine-log:<k>` (the bare name resolves to the newest engine start; proposed upstream fix P1 of `analyze-report.md`), to which the halt rail of F144-FR-007 appends. With the projection off the projected event files MUST NOT exist. A write that fails MUST be ignored. Where nothing names a destination, nothing MUST be written. A line of the writer class `learning` MUST go where the baseline writes it: to the file of the engine start when the event was recorded through a call of the engine (the evaluation after an approved phase and its automatic revert, F100-FR-235), and to the compatibility file of the learning stream of the feature, the learning legacy file at `feature:<slug>:learning:events-legacy` (annex B §B.5), when the command `learn` recorded it. Both are compared with the reference through the old side of the layout table (annex X §X.8), which maps the two as-is files to `feature:<slug>:learning:events`.
  - origin: B-0166
  - disposition: translated
  - divergence: DV-006
  - test: PT-144-C-011-legacy-file
  - assumption: CQ-033

- **F144-FR-009**: An event with no as-is equivalent MUST project to nothing: the layer events (DV-016), `blocked` (DV-067), the seven `parallel.*` types and every `x.` type. A field of a projected event that the old vocabulary lacks (`seq`, `passId`, `category`, `strategy`) MUST NOT be projected. The projection MUST write no line that has no as-is equivalent.
  - divergence: DV-016; DV-067; DV-088
  - parity: no new line (row 19 of annex X §X.7)
  - test: CT-144-109

- **F144-FR-010**: The projection MUST write the compared logs and records of the pipeline runtime and the supervisor, named by F100-FR-054, from the events `pipeline.*`, `stage.*`, `launch.checked`, `supervisor.*` and `digest.written`, with the text of the lines of annex G §G.3. With `relaunch.owner: root` it MUST render `[MOL-RELAUNCH]` from the root's `supervisor.relaunch` event. The text of each line belongs to the feature that prints it.
  - divergence: DV-074; DV-007
  - test: CT-144-110

- **F144-FR-011**: One call to emit MUST give the primary line and, where the projection is on, the projected lines: one fact, two encodings, one emit path. The published table MUST be readable as data, so that a reader can tell which old name a type reaches and which types lie behind an old name. Sink errors of the projection MUST be swallowed, and the projected lines MUST be in the order of `seq` inside each class of writer (`engine`, `stream-tap`, `critic`, `learning`).
  - origin: 002 FR-023
  - disposition: translated
  - test: CT-144-1
  - divergence: DV-007

- **F144-FR-012**: The table MUST have a row that projects to nothing for every type that the event catalogue gained when feature 111 completed it after the split: `check.admission`, `check.excluded`, `check.parallelism_lowered`, `checkpoint.accepted`, `checkpoint.refused`, `checkpoint.removed`, `fallback.skipped`, `microloop.inert`, `source.change_accepted`, `strategy.selected`, `terms.override_used`, `tripwire.raised`, `tripwire.cleared`. These are the thirteen types of F111-FR-050 and F111-FR-051; the two proposed types `critic.passed_over` and `critic.diversity` were retired by feature 111 before the catalogue took them (F111-FR-052 retired) and have no row. None of the thirteen is named by a requirement of this feature; a later feature that gives one of them an as-is equivalent changes the row here.
  - test: CT-144-112
  - parity: no new line (row 19 of annex X §X.7)

## Key Entities

| Entity | What it is |
|---|---|
| Projection row | One row of the table that renders one type, under one condition, in an old name or in nothing |
| Writer class | The class of the old writer (`engine`, `stream-tap`, `critic`, `learning`) inside which order is compared |
| Event context | Run id (engine start id), project, backend label, feature slug, trace id |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F144-SC-001**: The projection is equal to the baseline. On the fixture families FX-01 to FX-40 that name the surface `events`, 0 results `different` after N-12, N-13 and N-14.
- **F144-SC-002**: The table is complete. 100 per cent of the types of the event catalogue have a projection row, and 100 per cent of the 65 carried names of the old vocabulary are the target of at least one row.

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
| EP-08 | `specstride.event-sink/1` | implements | The compatibility projection sink: its table, its files, its conformance run on the sample events |

The core side of EP-08, the writer, the conformance suite of failing sinks and the sample sink are not here.

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| Event envelope and versioning, `specstride.event/1` | X §X.1; F100-FR-198 to F100-FR-200 (F100-FR-199: a row for every type, a row that projects to nothing included) |
| The event catalogue, an open closed set | X §X.6, row 73 |
| Event sink, `specstride.event-sink/1` | C §C.10; F100-FR-104, F100-FR-105, F100-FR-106 |
| Redactor and the single point of redaction | X §X.4; A §A.2, F100-FR-009 |
| Layout, `specstride.layout/1`: `run:<runId>:events-legacy:<k>`, the pipeline logs and records, `workspace:current:events` | B §B.5; F100-FR-054, F100-FR-055, F100-FR-229 |
| Identifiers; the as-is run id | B §B.3; F100-FR-046 |
| Normalization, `specstride.oracle-normalization/1`: N-12, N-13, N-14, N-01 to N-08 | X §X.8 |
| Stop reasons, `specstride.stop-reason/1` | E §E.3 |
| Line grammar | G §G.3 |
| Environment alias table | X §X.8 |
| The `parity` profile | X §X.7 |

## Rows of the `parity` profile

| Switch or option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Compatibility projection of events | `compat.legacyEvents` | off | on | 17 | DV-007 |

## Closed sets

| Set | Members | Unknown value |
|---|---|---|
| Writer classes of the projection (new) | `engine`, `stream-tap`, `critic`, `learning` | `engine` |
| Row shapes of the projection (new) | `bash`, `python`, `learning`, `none` | The table is invalid |

The catalogue of event types (row 73 of annex X §X.6) is owned by feature 100's list and specified by the owner named there; this feature holds only the projection row of each type.

## As-is behaviour not carried

No row of the traceability files that is assigned to this feature has the disposition `superseded-by` or `dropped`. The as-is event `gates_migrated` (B-0084) is not carried (DV-037); the table has no row for it. The synthetic event `_reopen` of the follower and the names `gate`, `tool_use` and `api_request` are not events of any file and have no row: `api_request` and `tool_use` are made by the exporter of feature 128 from `stream.result` and `tool.call`, and `gate` is the name under which `verdict.recorded` feeds the old metric, which no caller ships as an event of a run (feature 128, table of the two forms; F111 "No type of the catalogue is named `gate`").

## Ids before the split

This specification was group G5 of feature `111-event-schema-and-projection`.

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

The behaviour items that moved: 002 FR-023; the clusters C-007, C-013, C-022, C-052, C-061, C-066; the item B-0166 of C-011.

## Repairs after the cross-feature review

Dated 2026-09-30. Each line names the item of the repair worklist and what changed.

- W-144-02: F144-FR-008 changed in place — the logical name is `run:<runId>:events-legacy:<k>`, the bare name resolves to the file of the newest engine start, F100-FR-229 and annex B §B.5 cited.
- W-111-02: F144-FR-012 added — a row that projects to nothing for each of the fifteen types the event catalogue gained after the split; test CT-144-112.
- B-8.7 (2026-09-30): F144-FR-012 changed in place — thirteen types, not fifteen: `critic.passed_over` and `critic.diversity` were retired by feature 111 (second pass, C8) and are no types of the catalogue; their rows left the table and the data model (138 rows). The sentence on `gate`, `tool_use` and `api_request` follows feature 128: the exporter makes the first two, and no caller ships `gate`.

## Repairs after the analyze run of 2026-09-30

Each line names the finding of the run and what changed. No id and no number changed.

- I1: the fixture families run to FX-40 (feature 141, §O.2), so the user story and F144-SC-001 say FX-01 to FX-40; FX-38 and FX-39 name the surface `events` too.
- I2: F144-FR-003, F144-FR-004 and F144-FR-005 say "shape" for `bash`, `python` and `learning`, as the table "Closed sets" does; "class" is the writer class only. F144-FR-002 says "the shape and the writer class `learning`".
- I3: F144-FR-006 no longer says that the alias table of annex X §X.8 holds all seven names; it holds three. The test names `PT-144-C-052-run-id-form` and `PT-144-C-061-events-destination` were added, so that each cluster has a test of its own name, as the traceability files expect.
- U1: F144-FR-008 says where a line of the writer class `learning` goes, as the baseline does (the engine start's file for a call of the engine, the as-is event file of the feature for the learning command).
- A1: F144-FR-002 words the count as the clarification does (70 names, 66 of a file, 65 carried).
- Follow-up of the same day (the owner: resolve every finding): I7 repaired in `contracts/projection-table.tsv` and `data-model.md` (the field maps of `tool.call` and `pass.halted` name the as-is keys); U3, U4, U5 made correct under the proposed upstream fixes P1 to P4 of `analyze-report.md` (F144-FR-006: `SPECSTRIDE_SHIP` with an empty value, DV-065; F144-FR-008: the engine log of each engine start, the learning legacy file).
- L1: the register runs to DV-119; the line "Sources" names the rows DV-006, DV-027 and DV-037 that the requirements cite.

## Clarifications

### Session 2026-09-29

Answered from the sources. No question was put to a person.

- Q: Does the projection get the text that the old `agent_text` and `agent_tool` events carry, given that no event holds content and content reaches a sink only while capture is on? -> A: Yes, through the content accessor of the sink, only for its own files and only redacted; the projection carries the baseline's local snippets and is not telemetry content. (Source: F100 annex C §C.10; DV-007; DV-083; B-2083, B-2084; CQ-032)
- Q: How many event names does the projection table cover? -> A: The inventory holds 70 names in items of kind `event`. Four are not events of any file (`_reopen`, `gate`, `tool_use`, `api_request`). Of the 66 left, `gates_migrated` is not carried and three are of the learning stream, so the run stream carries 62. The table has a row for each of the 65 that are carried. (Source: R18 inventory; R14 open question 12; brief 111 heading 2; CQ-178)
- Q: Which id does the projection write as the as-is run id? -> A: The engine start id in the as-is form. (Source: ruling 24; DP-074; F100-FR-046)
- Q: One projection file for a logical run or one for each engine start? -> A: One for each engine start, told apart by the ordinal of the engine start. (Source: R18 layout of the baseline; CQ-033)
- Q: Does a run of `relaunch.owner: root` print `[MOL-RELAUNCH]`? -> A: The projection renders it from the root's event; the text is the line of feature 123. (Source: DV-074; annex G §G.3)
- Q: Does an event with no as-is equivalent appear in the projection? -> A: No; it projects to nothing. (Source: DV-016; DV-067; N-12)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register runs to DV-119 on 2026-09-30; this specification cites rows up to DV-088.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-032 | Annex C §C.10 says content reaches a sink only while capture is on, but the projection must write the snippets of the old vocabulary under `parity` | The projection is a sink with access to the sanitised snippets of the old vocabulary for its own files | F144-FR-001 |
| CQ-033 | Annex B names one `run:<runId>:events-legacy` for a logical run, the baseline has one file for each engine start | One file for each engine start, told apart by the ordinal `<k>`; the name `run:<runId>:events-legacy:<k>` is held by annex B §B.5 (applied 2026-09-30) and by F100-FR-229 | F144-FR-008 |
| CQ-178 | The brief counts 62 event names; the inventory gives 70 names, of which 65 are carried | The 65 have rows; the count of 62 is the run stream alone | F144-FR-002 |
