# Feature Specification: Run view and status

**Feature Branch**: `129-run-view-and-status` (a label: Spec Kit creates no branch in this repository; the directory is `specs/129-run-view-and-status`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 129-run-view-and-status of Specstride: the UI read model `RunView` (extension point EP-09, schema `specstride.view/1`), a pure projection of the event stream and named state files, with its reducer, the cursor held by the caller and the canonical serialization; lanes, attention items and budget levels derived in the read model; the derived states `dead` and `stale`; `specstride status` with text, `--json` and `--line`; `wait --until-change`; the precomputed status line with its `validUntil`. Threats T-38 to T-42 of the threat model: what the read model guarantees."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 129), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes B, E, F, G, X), feature 141, and the research reports R13, R14, R17, R15, R15v, R11, R29 and R29v.

## Vision and aims

A run works for hours without its consumer. Every consumer surface that shows the run must show the same facts: the state, the phase, what needs the consumer, what the run has spent. This feature is the one read model that all of them read. It is a pure function of the event stream and a few state files. It has no renderer of its own. It has two first users: the command `status`, and `wait --until-change`, which lets a host wait without spending its context.

| # | Aim |
|---|---|
| 1 | A consumer in a new session, who knows nothing of the run, learns its state, its phase and what it needs from files alone |
| 2 | A host that waits spends no context while nothing changes |
| 3 | The doctor, `status`, the host hook shim and every later renderer show the same facts, because they read the same view and nothing else |
| 4 | A run that is dead, stale, blocked on a human, paused for a quota, or over a budget says so, and says what to do |
| 5 | A reader never writes: a dead run is recognised by reading, not by a note that nobody can write |

This feature specifies the data and the two commands. Every renderer (the terminal follower, the web viewer, the static export) belongs to Wave 2. The compatibility output of `status` belongs to another feature; this feature is the single owner of the data behind it and of the default output.

**In scope**: the read model `RunView`; its two operations `project` and `reduce`; the cursor; the canonical serialization; lanes, attention items and budget levels; the derived conditions `dead`, `stale` and `launch-abandoned`; `status` with text, `--json` and `--line`; `wait --until-change`; the precomputed status line with its `validUntil`; what the read model guarantees against the threats T-38 to T-42.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Every renderer: the terminal follower, the web viewer, the static export | 121, Wave 2 |
| The compatibility output of `status` | 119 |
| The host hook shim that prints the status line | 113 |
| The events and state files the read model reads | 111, 122, 127 |
| Lisa's server and dashboard; Lisa's trajectory paging (002 FR-051, 002 SC-007) | The roadmap; 121 |

## Constraints

Owner-set constraints, from heading 11 of the brief.

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
| Wave 1 specifies the read model and `status`; renderers and the kanban are Wave 2 | Decision 13 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A new session learns the state of a run from files alone (Priority: P1)

A consumer opens a new host session in a workspace where a run started hours ago from another session. The consumer, or the host on their behalf, runs `status`. The answer says whether the run lives, which phase it is in, and what needs the consumer. Nothing but files was read.

**Why this priority**: It is the reading half of the re-attachment criterion of the product. Without it a detached run is a run nobody can trust.

**Independent Test**: Take the state of a fixture run that was ended at each of the ten written states and at the three derived conditions. Delete every process. Run `status` in an empty environment with no other input. The printed state, phase and attention items equal the row of the fixture (F129-SC-001).

**Acceptance Scenarios**:

1. **Given** a run whose run record says `running` and whose lease has a live owner, **When** the consumer runs `status`, **Then** the first line names the run, the state `running`, the phase and the number of phases (F129-FR-024, F129-FR-027).
2. **Given** a run whose run record says `running` and whose lease has no live owner, **When** the consumer runs `status`, **Then** the state is `dead`, one attention item says so, and no file was written (F129-FR-012, F129-FR-015).
3. **Given** a workspace that holds state and no run, **When** the consumer runs `status`, **Then** the command prints that there is no run and exits 0; **Given** a workspace with no state at all, **Then** it exits 1 (F129-FR-024).

---

### User Story 2 - A host waits without spending context (Priority: P1)

A host has launched a run. It starts `wait --until-change` in the background and does nothing else. While the run works and nothing that matters changes, the command prints nothing. When something changes, it prints one short line and the host is woken.

**Why this priority**: The baseline reference run had 801 polls of which 98 per cent found nothing new. Every poll cost context. It is the aim "a host skill that uses little of the host's context".

**Independent Test**: With a fake clock, feed a run with 10,000 progress events that change no phase, no state, no attention item and no budget level. `wait --until-change` prints 0 bytes. Then append one event that ends the phase attempt with a rejection. It prints one line of at most 170 bytes (F129-SC-002).

**Acceptance Scenarios**:

1. **Given** a cursor from the last print and an unchanged run, **When** the time limit passes, **Then** nothing was printed and the exit code is 0 (F129-FR-029).
2. **Given** two hosts that attached to one run, **When** each holds its own cursor, **Then** a change that one host has consumed is still printed to the other (F129-FR-003, F129-FR-029).
3. **Given** a run that becomes `dead` while the command waits, **When** the next poll finds no live owner, **Then** the command prints the changed line (F129-FR-030).

---

### User Story 3 - What needs the consumer is shown, with what to do (Priority: P1)

A run that rests, is asleep or has died needs the consumer to know. The view holds attention items. Each says what the run needs, and the command that goes on.

**Why this priority**: It is aim 3 of the product: a clear signal when a run is blocked on the consumer.

**Independent Test**: For each of the nine kinds of attention item, a fixture produces exactly that item, with the fields of F129-FR-017, and `status` prints it in one line.

**Acceptance Scenarios**:

1. **Given** a run that rests blocked on a human because a source changed, **When** the consumer runs `status`, **Then** an attention item of the kind `source-changed` names the file and the command `resume` with its flag (F129-FR-018).
2. **Given** a run in a quota pause, **When** the consumer runs `status`, **Then** an item gives the resume time and the ceiling of the wait (F129-FR-019).
3. **Given** a run whose engine is gone and a process that still holds the run token, **When** the consumer runs `status`, **Then** an item reports the process and nothing ends it (F129-FR-021).

---

### User Story 4 - A renderer takes the view and opens no file (Priority: P2)

The author of a renderer, now or in Wave 2, wants one record and no file handle. The record says everything, including the lane of every card, so that the renderer derives nothing.

**Why this priority**: The threats of a viewer (T-38 to T-42) are met partly by what the read model does not do.

**Independent Test**: A sample renderer in the test tree is given the JSON of golden views and no file handle. It prints every lane, every attention item and every budget level, and its output does not change when the event file is deleted (F129-SC-003).

**Acceptance Scenarios**:

1. **Given** an event log, **When** the view is projected in one batch and, separately, by folding the events one at a time, **Then** the two views are equal for every prefix of the log (F129-FR-002).
2. **Given** an event file whose last line is torn, **When** the view is projected, **Then** the torn line is ignored and the cursor stops before it (F129-FR-004).
3. **Given** a task title that holds markup or an escape sequence, **When** it reaches the view, **Then** it is present as text with the control characters removed (F129-FR-009).

---

### User Story 5 - A session that starts later reads a precomputed line and knows when it is stale (Priority: P2)

A host hook shim prints one line at the start of a session, without starting the product. The line was computed by the runtime and carries the time until which it holds. When that time has passed, the shim says that the state is unknown.

**Why this priority**: A dead runtime cannot rewrite its own line. Without an expiry the shim would print `running` for ever.

**Independent Test**: A precomputed line of a live state carries a `validUntil` equal to that of the lease. A reader with a clock after that time is told the line has expired (F129-FR-028).

**Acceptance Scenarios**:

1. **Given** a live run, **When** the runtime writes the line, **Then** it is at most 170 bytes and carries `validUntil` (F129-FR-027, F129-FR-028).
2. **Given** a run that rests, **When** the runtime writes the line, **Then** the line says so and does not expire (F129-FR-028).

---

### User Story 6 - Spend and parallel hours are shown when they exist (Priority: P3)

The consumer wants to see what the run has spent, kept apart by kind of billing. With parallel units on, the consumer also wants wall hours and agent hours.

**Why this priority**: Budgets and hours are what the consumer judges the run by after the first day. They add nothing to the first three stories.

**Independent Test**: A fixture with parallel units on gives a view with both hour figures; the same fixture with the option off gives a view that holds no field of the layer (F129-SC-008).

**Acceptance Scenarios**:

1. **Given** a run under a subscription, **When** its view is projected, **Then** its cost is marked notional and is never added to metered spend (F129-FR-020).
2. **Given** a run with parallel units off, **When** its view is projected, **Then** no field of the layer of parallel units is present (F129-FR-022).

---

### Edge Cases

- The event file does not exist yet, or holds no complete line: the view has state `none` for the events and takes what the state files say.
- The event file holds a line that is complete but not a record of the schema: the line is skipped, counted in the diagnostics, and the projection goes on.
- The sequence number has a gap: the view records it in the diagnostics. It changes nothing else (F129-FR-004).
- The run record names a state that is not one of the ten written states: the view shows `unknown` and an attention item (F129-FR-035).
- The lease probe answers `held-foreign` or `unknown`: the run is not called dead, and the view says the liveness cannot be judged (F129-FR-012).
- The consumer started a new run in the same workspace while an older host still waits: the cursor of the older host does not match; the projection restarts and the command prints the new run (F129-FR-003).
- A run rests in `blocked-on-human` and its terminal record was written by the runtime root after a crash: the record says `synthesized`; the view shows it as it is (F129-FR-018).
- A listing over several features (the as-is `status --all`) is one view per feature; there is no second read model. Its text belongs to feature 119.
- A free-text field is longer than its cap: it is cut at a character boundary and marked cut (F129-FR-009).
- Two events have the same `ts`: order is by `seq` alone.

## Requirements *(mandatory)*

Each requirement is in the written form of `STAGE-B-RULES.md` section 4. No behaviour item and no as-is requirement with a kept disposition is assigned to this feature (see "As-is behaviour not carried"); the requirements are therefore new, with tests of the form `CT-129-<n>`. Options that this feature introduces are collected in the table "Rows of the `parity` profile" below.

### Functional Requirements

#### G1. `RunView`: projection, reducer, cursor, serialization

- **F129-FR-001**: The read model MUST offer the pure operation `project`. Its inputs MUST be exactly these: the event stream of the run; the named state files, which are the run record, the terminal record and the pause record; the observations that the caller supplies, which are the result of a probe of the lease with the lease's own fields, the newest launch record, the supervision record, the result of a search of the process table for holders of the run token, and the limit of the handshake; and the time now. It MUST have no other input. It MUST do no input or output, read no clock and use no randomness. Its output MUST be one `RunView` of schema `specstride.view/1`.
  - test: CT-129-1
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-161 (annex G §G.6 names three state files and the result of a lease probe; the brief names the run record, the lease and the pause record; the launch record, the supervision record, the process search and the handshake limit are needed by rules of feature 100 and are read here as observations of the caller)

- **F129-FR-002**: The read model MUST offer the pure operation `reduce`, which takes a view and one event and returns the next view. For every prefix of every event stream, with the state files, the observations and the time held fixed, the view that `project` gives for the prefix MUST equal the view that folding `reduce` over the prefix gives. The fields that come from the state files and the observations MUST be recomputed by `project` at every call and never by `reduce`.
  - test: CT-129-2
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-003**: The cursor MUST be held by the caller and never be stored in the control plane. It MUST name the event file, a byte offset and the last `seq`. `project` MUST accept a cached view and the events after its cursor, and MUST then give the same view as a projection from the first event. When the file does not continue at the cursor (the file is shorter than the offset, or the next event does not have the `seq` that follows the last one, or the run is another), the projection MUST start again from the first event and MUST NOT fail. `wait` MUST print the cursor and take it back as an argument, so that two hosts never consume each other's changes. The token that `wait` prints (F129-FR-029) is the compact form of the cursor: it names no file, because the event file is always that of the current run (F129-FR-024), and a change of run is seen through the run id in the change signature (F129-FR-030).
  - test: CT-129-3
  - ep: EP-09 `specstride.view/1` (implements)
  - ep: EP-01 `specstride.host/1` (consumes)

- **F129-FR-004**: A torn last line of the event file (a last line without its line end, or one that is not a complete record) MUST be ignored, and the cursor MUST stop before it. A complete line in the middle that is not a record of the schema MUST be skipped and counted in the diagnostics of the view. A gap in the sequence of `seq` MUST be recorded in the diagnostics with the numbers on both sides. Neither MUST change any other field of the view or make any command fail.
  - test: CT-129-4
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-005**: The read model MUST declare the range of event majors it accepts. An event whose major lies outside the range MUST NOT be folded. The view MUST then be marked `stale` with the reason `event-major-out-of-range`, the major found and the range accepted, and the doctor MUST be able to read that mark and give its warning. An event type and a field that the read model does not know MUST be ignored. A rule that names an event type by its dotted name MUST ignore an event type it does not hold, as F100-FR-199 requires.
  - test: CT-129-5
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-006**: The canonical serialization of a view MUST have a stable order of keys, one record, no colour escape sequences, no wall-clock field other than `now`, and no secret value, account identifier or token. Two projections of the same inputs MUST be equal byte for byte, on every platform.
  - test: CT-129-6
  - status: unverified (check: golden views compared on a macOS runner that passes the oracle; verified-on: —; pin: —)

- **F129-FR-007**: Fields of the view MUST be added only in an additive way inside the major. The view MUST carry the field `schema` with the value `specstride.view/1`. A consumer that is given a view of another major MUST refuse it with a message that names the major found and the major supported, as F100-FR-049 requires; a consumer MUST ignore a field it does not know.
  - test: CT-129-7
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-008**: A cached view MUST be disposable. It is kept under the logical name `run:<runId>:view`, written by the runtime. Deleting it MUST lose nothing. A cached view MUST be ignored when its cursor does not match the event file, when it is older than the newest event, or when it is of another major. No reader MUST need it, and no run MUST depend on it.
  - test: CT-129-8
  - ep: EP-09 `specstride.view/1` (implements)
  - parity: off with the switch `status.precompute` (row 127 of annex X §X.7)

- **F129-FR-009**: Every free-text field of the view (the need of an attention item, a title, a message, the text of a timeline row, the summary of the latest tool) MUST be a value that has passed the redactor: it comes from an event or a record that was redacted at the ingress, and the view MUST apply the patterns of the recorded version of the pattern set again and cut the field to a size cap of 240 bytes (`contracts/run-view.md`). Where the redactor cannot run, the field MUST be dropped and the view MUST say so. Control characters, escape sequences included, MUST be removed from every free-text field. The view MUST hold no prompt, no reply, no body of a tool argument and no output of a command, and it MUST name state by logical name and never by physical path. A field that was cut MUST be marked cut.
  - test: CT-129-9
  - ep: EP-09 `specstride.view/1` (implements)

#### G2. Lanes, attention items, budget levels, derived states

- **F129-FR-010**: The view MUST hold the position of the run: the run id, the feature, the state of the run record (or `none` when the run has no record), the time of the last transition, the current phase and the number of phases, the ordinal of the current phase attempt, the ordinal of the current pass, the reject count and the MALFORMED count of the current phase (which survive a resume), the strategy (`classic` or `micro`) with the micro level, the units of work done and declared for the current phase attempt, and the elapsed time of the run. A value that no event states MUST be null.
  - test: CT-129-10
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-011**: The view MUST hold a list of the phases, each with its number, its title where an event states it, and three facts: whether phase evidence exists, whether the phase is approved, and whether feedback exists. It MUST hold the latest tool activity of the run, the observability mode with its reason, the state of each telemetry delivery that an event reports, and a bounded tail of the newest rows of the timeline (the number of rows is `status.timelineRows`). Each row MUST have `seq`, time, a kind and a text. When rows were left out, the view MUST say how many. These fields carry the data that the compatibility output of `status` prints.
  - test: CT-129-11
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-167 (the facts of the list of phases and the telemetry deliveries must be carried by events, because the closed inputs of F129-FR-001 hold no other source; the spelling of the event types is the catalogue of feature 111)

- **F129-FR-012**: The view MUST derive the liveness of the run from the result of a probe of the lease. For a run record in a live state (`starting`, `running`, `paused-quota`, `relaunching`, `stopping`) the table below MUST apply, and the condition `dead` MUST be derived when the owner is gone. A result the read model does not know MUST be read as `unknown`. A run record in a resting state (`blocked-on-human`, `finished`, `stopped`, `failed`) has the liveness `not-applicable`. The state `created` has no lease and is judged by F129-FR-014. Where the lease shows a live owner of the run, the view MUST NOT show `dead`, whatever the age of the newest event. A run in `starting` with no lease yet MUST NOT be `dead` before the handshake limit has passed since the launch record was written. The as-is rule that a lock directory that exists means RUNNING MUST NOT be carried.

  | Result of `probe` | Liveness in the view | Condition |
  |---|---|---|
  | `held-live` | `alive` | none; `stale` is judged by F129-FR-013 |
  | `free` | `dead` | `dead` |
  | `stale-owner-dead` | `dead` | `dead` |
  | `owner-dead-group-alive` | `dead` | `dead`; the survivors are reported by F129-FR-021 |
  | `held-foreign` | `foreign` | none; the view says the liveness cannot be judged from here |
  | `unknown` and any other value | `unknown` | none; counts as held, as EP-13 says |

  - divergence: DV-042
  - test: CT-129-12
  - ep: EP-13 `specstride.lock/1` (consumes)
  - status: unverified (check: the probe of the lock provider on macOS, by the conformance suite of the provider on a macOS runner; verified-on: —; pin: —)

- **F129-FR-013**: The condition `stale` MUST be derived in one case of liveness: when the owner lives (`alive`), the heartbeat of the lease is past its `validUntil`, and the newest event is older than `status.staleEventSec`. In that case the reason is `heartbeat-and-events-old`. The view MUST also be marked `stale` with the reason `event-major-out-of-range` in the case of F129-FR-005. The field `stale` MUST carry the reason, so that a reader can tell the two cases apart, and the view MUST raise the attention item `stale-run` in both.
  - test: CT-129-13
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-162 (annex E §E.2 says `stale` when both are "old" without a value; annex G §G.6 uses `stale` for a view with an event major out of range; one field with a reason covers both)

- **F129-FR-014**: The condition `launch-abandoned` MUST be derived when the newest launch record has no `outcome`, is older than the handshake limit, and no lease carries its launch nonce. The view MUST show it as an attention item. Closing the launch record belongs to the next launch and never to a reader.
  - test: CT-129-14
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-015**: Readers MUST derive `dead`, `stale` and `launch-abandoned` and MUST NOT write them, into any file, event or record. The commands `status` and `wait` MUST write no file of any kind. Only the runtime writes the cached view and the precomputed status line.
  - test: CT-129-15
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-016**: The lane of every card MUST be derived in the read model by a pure table of schema `specstride.table/1`, evaluated by the one table evaluator, with the first matching row firing, a default row, and the rule id and the table version recorded with every card. A card is one phase; cards are grouped by feature. The lanes are a closed set in this order: `queued`, `proposing`, `verifying`, `reviewing`, `approved`, `blocked`, `paused`, `failed`. The rows MUST be these, in this order:

  | Rule | Lane | When |
  |---|---|---|
  | L-01 | `approved` | An event states that the phase is approved |
  | L-02 | `failed` | The phase is the current one and the run state is `failed` |
  | L-03 | `blocked` | The phase is the current one and the run state is `blocked-on-human` or `stopped`, or the condition is `dead` |
  | L-04 | `paused` | The phase is the current one and the run state is `paused-quota` |
  | L-05 | `reviewing` | A critic-class call of the phase attempt is open |
  | L-06 | `verifying` | A verification job or an inner check of the phase attempt is open |
  | L-07 | `proposing` | A pass of the phase attempt is open, or a unit of work of a micro-loop is open, a worker pass included |
  | L-08 | `queued` | Default |

  A cycle of a micro-loop MUST own no lane; it is a part of `proposing`. No state of the run, no exit code and no stop reason MUST be added for the layer. A renderer MAY hide or merge lanes and MUST NOT derive one.
  - test: CT-129-16
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-170 (the lane names and the order of the rows are the proposal of R13 with the rows for `stopped` and `dead` placed in `blocked`; no source fixes them)

- **F129-FR-017**: The view MUST hold attention items. An item MUST have a kind from the closed set below, a stable key, the time since when it holds, a one-line text, what the run needs (or null), and the command that goes on, taken from a fixed table by kind and never from text of the run. The kinds MUST be, in the order in which items are listed: `blocked-on-human`, `source-changed`, `dead-run`, `launch-abandoned`, `quota-pause`, `budget-alert`, `stale-run`, `orphan-processes`, `unknown-state`. Items of one kind MUST be ordered by the time since when they hold. An item MUST disappear when its cause is gone. The set of kinds is a closed set, row 244 of annex X §X.6 (see "Closed sets").
  - test: CT-129-17
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-018**: An attention item for a run that is blocked on a human MUST name what the run needs, taken from the `blocked` field of the terminal record or from the event `blocked`, with the blocked reason of the closed set of annex E §E.2 (`declared-block`, `quota-credit`, `auth`, `budget-cap`, `quota-wait-ceiling`, `source-changed`). For the reason `source-changed` the item MUST have the kind `source-changed` and MUST name the file (`spec`, `plan` or `tasks`) and, as the command that goes on, `resume` with its flag `--accept-source-change` (F100-FR-173). A reader MUST show a run whose newest launch record has the outcome `refused` because a source changed as `blocked-on-human` with the item `source-changed`, although the run record was not written (F100-FR-145). A blocked reason that the read model does not know MUST be shown as text and the run MUST stay shown as blocked.
  - test: CT-129-18
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-166, granted on 2026-10-01 (the assumption was that the `refusal` of the launch record is free text in annex B §B.7 while the read model needs the blocked reason and the file as separate values; feature 100 amended §B.7, where `refusal` is now a member of the closed sets of the refusals of a launch and of `resume` and `refusalFile` carries the file, so the two values are separate; reported in `contracts/observations.md`, confirmed by T004)

- **F129-FR-019**: While the run is in the state `paused-quota`, the view MUST hold the attention item `quota-pause` with the role and the harness that wait, the class of the quota, the time since when the pause holds, the time at which the run will try again (`resumeAt`, or null), the time at which the wait ends (`ceilingAt`), and the note that the pause spends no budget. These values MUST be taken from the pause record. The item MUST be absent when the pause record does not exist.
  - divergence: DV-005
  - test: CT-129-19
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-020**: The view MUST hold budget rows, one for each pair of scope (`run`, `phase`) and role of the role registry, and for each cost class that occurred. A row MUST have the cost class, the spent amount (null where a harness reports none), the tokens, the cap (or null), the fraction (only where the cap is above zero and the spent amount is known), a level, and, for the cost class `subscription`, the mark `notional`. A notional cost MUST never be added to a metered cost. The level MUST be a member of the closed set `unknown`, `ok`, `info`, `warn`, `loud`, `over`. The read model MUST raise no alert of its own, because the engine is the only source of alerts: the level is the highest level of the alerts of the engine that are still in force for the row, and `over` is added only when the fraction is above 1 or the engine has reported that the cap was exceeded. A level of `warn` or higher MUST give the attention item `budget-alert`, keyed by kind, role and threshold. The quota of a row MUST show whether it is `ok`, `signalled` or `paused`, with the reset time where one is known.
  - divergence: DV-005
  - test: CT-129-20
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-021**: When the caller's search of the process table finds processes that hold the run token of a run whose engine is gone (the run is `dead`, `relaunching` or at rest), the view MUST list them, each with its kind, its class and its process id, and MUST raise the attention item `orphan-processes`. The read model and the commands `status` and `wait` MUST report such processes and MUST NEVER end them. A process of the class `adoptable` MUST be listed without the item, because it is expected to outlive a stop.
  - test: CT-129-21
  - ep: EP-09 `specstride.view/1` (implements)
  - status: unverified (check: the search of the process table for the run token on macOS, on a macOS runner that passes the oracle; verified-on: —; pin: —)

- **F129-FR-022**: With parallel units on, the view MUST hold a group of fields for the layer: the workers, the groups, the group failures, the refusals, the reason of a fallback, the wall hours and the agent hours. Wall hours MUST be the elapsed time of the run. Agent hours MUST be the sum of the durations of every pass of the run, the passes of workers included. With parallel units off, the view MUST hold no field of that group, and it MUST differ in no other field from a view that never heard of the layer.
  - divergence: DV-084; DV-088
  - parity: off (row 20 of annex X §X.7)
  - test: CT-129-22
  - ep: EP-09 `specstride.view/1` (implements)
  - assumption: CQ-168 (the sources say that both hours are reported and do not define them; a quota pause and a dead interval are counted in wall hours here)

- **F129-FR-023**: The strategy of the run MUST be a field of the view, as a field of the layer, so that the status line can carry it. The fields of the layer MUST be present only where the run record pins a strategy.
  - divergence: DV-018
  - test: CT-129-23
  - ep: EP-09 `specstride.view/1` (implements)

#### G3. `status`, `wait`, the status line

- **F129-FR-024**: The command `status` MUST take its facts from one `RunView` and from nothing else. It MUST show the current run, which is the run of the newest launch record of the workspace. It MUST write no file and start no process. It MUST exit 0 when it printed, also for a workspace that holds state and no run (it then says that no run is recorded yet), and 1 when there is no state for the workspace or for the feature, as annex G §G.4 says. A workspace with state and without an event file is a workspace with no run: the baseline prints that no run is recorded yet and exits 0 (B-1484). It MUST be safe to call at any moment, whether or not a run lives.
  - test: CT-129-24
  - ep: EP-09 `specstride.view/1` (consumes)
  - ep: EP-01 `specstride.host/1` (consumes)

- **F129-FR-025**: The default output of `status` MUST be terse. It MUST print the status line of F129-FR-027 as its first line, and then one line for each attention item, in order, in the form `[SPECSTRIDE-ATTENTION] kind=<kind> need=<text> next=<command>`. The values of `need` and `next` are text and MUST be quoted as in JSON, as annex G §G.3 does for a text value of the supervisor lines, so that a value with a space (`next="resume --accept-source-change"`) stays one value; `kind` and `more` are bare. A line for an item MUST have at most 120 bytes; text that does not fit MUST be cut at a character boundary and end with `...` inside the quotes. The whole output MUST have at most 420 bytes, which is the budget of one supervision cycle of 150 tokens at 2.8 bytes per token. Items that do not fit MUST be replaced by one last line `[SPECSTRIDE-ATTENTION] more=<n>`. A state that holds nothing that needs the consumer MUST print the status line alone. Free text MUST NOT be echoed except as the need of an item; it MUST refer to state by logical name. Under compatibility output (annex G §G.2) the command MUST print the lines that the presenter interface of annex G §G.10 defines, and nothing else, from the same view.
  - divergence: DV-033; DV-034
  - parity: compatibility output (row 18 of annex X §X.7); no new line (row 19)
  - test: CT-129-25
  - assumption: CQ-165 (the two caps are derived from the budget of one supervision cycle; the sources give the budget and no per-line cap)
  - assumption: a text value of a product line is quoted as in JSON; the row "Product lines" of annex G §G.3 does not say so yet (proposed upstream in `analyze-report.md`, section "Proposed upstream fixes")

- **F129-FR-026**: `status --json` MUST print one record with the field `schema`, in the canonical serialization of F129-FR-006, and it MUST be the `RunView` itself. It MUST be opt-in. Every collection in the view MUST be bounded (the timeline by `status.timelineRows`, the attention items (50), the budget rows (64) and the listed processes (50) by fixed limits recorded in the schema, `contracts/run-view.md`), and a collection that was cut MUST say how many entries were left out, so that the output has a byte cap by construction.
  - test: CT-129-26
  - ep: EP-09 `specstride.view/1` (consumes)

- **F129-FR-027**: `status --line` MUST print the status line: one line of pairs `key=value` separated by one space, beginning with `run=` and `st=`. The keys MUST be a closed set, in this order: `run` (the run id), `st` (the state; `dead`, `stale` or `launch-abandoned` where that derived condition holds; `unknown` for a state that is not one of the ten written states, F129-FR-035; where more than one of these holds, the first in the order of the kinds of F129-FR-017: `dead`, `launch-abandoned`, `stale`, `unknown`), `ph` (`<current>/<total>`), `unit` (`<done>/<declared>`), `rej` (the reject count), `el` (the elapsed time, written `<h>h<mm>m`, or `<m>m` below one hour), `next` (the seconds until the next reading that the supervision record advises, written `<seconds>s`), `strategy`, `attn` (the number of attention items), `cur` (the cursor token of `wait`) and `validUntil`. A key whose value is null MUST be left out. The line MUST have at most 170 bytes, which is 60 tokens at 2.8 bytes per token. Where the full line is longer, keys MUST be left out in this order until it fits: `cur`, `next`, `attn`, `unit`, `strategy`, `el`, `rej`, `ph`; the keys `run`, `st` and `validUntil` MUST never be left out. `validUntil` MUST be present only in the precomputed line of F129-FR-028. Under the `parity` profile the command MUST print nothing and exit with its code.
  - divergence: DV-018; DV-034
  - parity: not printed (row 19 of annex X §X.7)
  - test: CT-129-27
  - assumption: CQ-169 (F100-FR-176 says that a line without an as-is equivalent is printed on no stream under `parity`)

- **F129-FR-028**: The runtime MUST write the precomputed status line, under the logical name `run:<runId>:status-line`, atomically, whenever the change signature of F129-FR-030 changes and at every heartbeat, so that the line is rewritten before its `validUntil` passes, for as long as the lease lives. The runtime MUST also keep the pointer `workspace:current:status-line` of annex B §B.5, which names the `run:<runId>:status-line` of the current run at a place that depends on the workspace only, so that a shell shim finds the line without starting the product (F100-FR-229). The line of a live state (`starting`, `running`, `paused-quota`, `relaunching`, `stopping`) MUST carry `validUntil` with the value of the `validUntil` of the lease. The line of a resting state (`blocked-on-human`, `finished`, `stopped`, `failed`) MUST carry the value `none` and MUST NOT expire. A reader that finds a `validUntil` that has passed MUST NOT print the state; it MUST print that the state is unknown and name the command `status` (F100-FR-161). A dead runtime cannot rewrite the line; the expiry is what makes that visible.
  - test: CT-129-28
  - ep: EP-09 `specstride.view/1` (implements)
  - ep: EP-01 `specstride.host/1` (consumes)
  - parity: off with the switch `status.precompute` (row 127 of annex X §X.7)
  - status: unverified (check: a live host runs the host hook shim at the start of a session and the shim prints the line without starting the product, and a line past its `validUntil` is printed as unknown; the hermetic half of the capture is done on Linux and recorded in `tests/characterization/129/capture-host-hook-shim.md`, which names the three facts, the four that only the live capture can show, and why the live half is never run by an automated pass (T002, owner ruling of 2026-09-30); verified-on: —; pin: host version of the capture)
  - assumption: CQ-163 (F100-FR-161 says the line MUST carry `validUntil`; a resting run has no lease, so the value `none` is used and the shim of feature 113 must read it)

- **F129-FR-029**: `wait --until-change` MUST print nothing while nothing changes. It MUST compare the change signature of F129-FR-030 with the one in the cursor token that the caller passed (or, without a token, with the signature at the time of the call), poll the files at the interval `wait.pollSec`, and print exactly one line as soon as the signatures differ: the status line with the key `cur=<offset>.<seq>.<signature>` as its last key, at most 170 bytes as a whole. It MUST end without printing when `wait.timeoutSec` (or the value of `--timeout`) has passed. The exit code MUST be 0 when a line was printed and when the time limit passed with nothing printed, 1 when there is no state, and 3 for a usage error, including a call without `--until-change`. A workspace that holds state and no run has a change signature like any other (run id and state `none`), so the first run that appears is a change. The command MUST hold no state between calls, MUST NOT be a service, and MUST end by its time limit. No run MUST depend on it. Under the `parity` profile it MUST print nothing.
  - divergence: DV-034
  - parity: not printed (row 19 of annex X §X.7)
  - test: CT-129-29
  - ep: EP-01 `specstride.host/1` (consumes)
  - ep: EP-09 `specstride.view/1` (consumes)
  - assumption: CQ-164 (the cursor of annex G §G.6 names file, offset and last `seq`; a change of the derived conditions or of the state files does not move any of the three, so the token carries a short hash of the signature; exit codes are those of CQ-023)

- **F129-FR-030**: The change signature MUST be a record with these fields and no others: the run id, the state, the liveness, the conditions with their reasons, the current phase, the number of approved phases, the reject count, the kinds and keys of the attention items, the levels of the budget rows, and the strategy. Progress inside a phase attempt (the ordinal of a pass, the units of work, the elapsed time, the timeline, the suggested seconds until the next reading) MUST NOT be part of it. Two views MUST have the same signature exactly when these fields are equal. The signature MUST be hashed with the canonical record hash of annex X §X.5, and the token MUST carry the first 8 hexadecimal characters.
  - test: CT-129-30
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-031**: The output of `status` and of `wait` MUST stay inside the budgets of annex G §G.5. An unchanged state MUST cost zero bytes on `wait`. A changed state MUST cost at most one line of at most 170 bytes on `wait`. The build MUST measure bytes at 2.8 bytes per token and MUST fail on a breach, with the fixtures of the budget test: a long run with no change, and a change of each kind of attention item.
  - test: CT-129-31
  - ep: EP-01 `specstride.host/1` (consumes)

- **F129-FR-032**: The doctor, `status`, `wait`, the host hook shim and every later renderer MUST read `RunView` and nothing else to learn the state of a run. Only the event reader, a component outside the pure core, MAY open the event file, and no renderer MUST. A renderer MUST take a `RunView` as its only input and MUST be given no file handle. A renderer that fails MUST print one line that names the command `status --json` and MUST change no state. A static check MUST fail the build when a renderer or a command imports the event reader or a state reader in place of the view.
  - test: CT-129-32
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-033**: The read model MUST guarantee, against the threats T-38 to T-42 of annex X §X.9, that no component of Wave 1 opens a network listener and that no route, write path or request handler exists in the read model, `status` or `wait`; that every text of a run reaches a consumer as text, redacted, without control characters and cut (F129-FR-009); that the view holds no content, no physical path and no secret, so that any later export of the view carries nothing that a sink of telemetry could not carry; and that a command ends by its own limit and leaves no process behind. The requirements of a later viewer on origins, tokens, content-security policy and the record of its process belong to feature 121.
  - test: CT-129-33
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-034**: The options of this feature MUST be ordinary configuration with the spellings and values of the table "Options, switches and configuration keys". Each MUST have a value under the `parity` profile, and the switch `status.precompute` is row 127 of annex X §X.7; the values that are not switches MUST be recorded with the value "not used" or their default, as the table says.
  - test: CT-129-34
  - parity: see the table "Rows of the `parity` profile"

- **F129-FR-035**: Every closed set that this feature owns MUST be listed with every member, its owner, and its rule for an unknown value, in the section "Closed sets", with its row of annex X §X.6 (F100-FR-208). A reader MUST apply the rule of the row to an unknown value. An unknown state of the run MUST be shown as `unknown` with the attention item `unknown-state`; an unknown lane, kind of attention item or level MUST be shown as text and MUST NOT stop the reader.
  - test: CT-129-35
  - ep: EP-09 `specstride.view/1` (implements)

- **F129-FR-036**: The conformance suite of EP-09 MUST hold: golden views projected from the primary event files of fixture runs, those of the oracle included, and one whose last line is torn; the property of F129-FR-002 on every prefix of every one of them; the derived conditions on every row of the table of F129-FR-012; a sample renderer in the test tree that takes the JSON of a view and is given no file handle; and the canary test of F129-FR-009. A second implementation of the read model that is registered from the test tree MUST pass the same suite.
  - test: CT-129-36
  - ep: EP-09 `specstride.view/1` (implements)

### Key Entities

- **RunView**: the record of schema `specstride.view/1` that holds everything a renderer shows about one run: identity, position, conditions, cards and lanes, attention items, budget rows, phases, timeline, processes, the strategy, the fields of parallel units when they are on, the diagnostics, and the cursor.
- **Cursor**: file, byte offset and last `seq`, held by the caller.
- **Cursor token**: the compact form of the cursor that `wait` prints and takes back, with a short hash of the change signature.
- **Card**: one phase of one feature, with its lane and the rule id that gave the lane.
- **Lane**: one of eight columns of the board. A lane is derived, never chosen by a renderer.
- **Attention item**: something the run needs from the consumer, or something the consumer must know, with what to do.
- **Budget row**: spend, cap, fraction, level and quota of one role in one scope, for one cost class.
- **Derived condition**: `dead`, `stale` or `launch-abandoned`. Derived by readers, never written.
- **Observation**: a value that the caller supplies to the pure read model because the read model does no input: the probe of the lease, the newest launch record, the supervision record, the process search, the handshake limit.
- **Change signature**: the small record whose change makes `wait` print.
- **Status line**: the one-line form of the view, at most 170 bytes; precomputed by the runtime with `validUntil`.

### Options, switches and configuration keys

Feature 110 owns the spelling of every key. The spelling of annex X §X.7 is used where a row exists; the other spellings are proposals.

| Option | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Precomputation of the cached view and of the status line by the runtime | `status.precompute` | on | off | 127 | DV-034 |
| Age of the newest event after which a run whose heartbeat is also late is `stale` | `status.staleEventSec` | 1800 | not used | none: a value, not a switch | — |
| Rows of the timeline in the view | `status.timelineRows` | 20 | 20 | none: a value, not a switch | — |
| Interval at which `wait` polls the files | `wait.pollSec` | 5 | not used | none: a value, not a switch | — |
| Time limit of `wait` | `wait.timeoutSec` | 600 | not used | none: a value, not a switch | — |
| Output mode of `status` | `output.compat` | default output | compatibility output | 18 | DV-033 |

### Rows of the `parity` profile

| Switch | Default | Value under `parity` | Row | Register row |
|---|---|---|---|---|
| `status.precompute` | on | off | 127 | DV-034 |
| `output.compat` | default output | compatibility output | 18 (exists) | DV-033 |
| Lines with no as-is equivalent (`status --line`, `wait`) | printed when their feature is on | never printed | 19 (exists) | DV-034; DV-018 |
| `loop.parallel.units` (read, not owned) | off | off | 20 (exists) | DV-084; DV-088 |

### Closed sets

| Set | Members | Owner | Rule for an unknown value |
|---|---|---|---|
| Lanes of the view (row 243) | `queued`, `proposing`, `verifying`, `reviewing`, `approved`, `blocked`, `paused`, `failed` | 129 | Shown as text; the card is not moved |
| Kinds of attention item (row 244) | `blocked-on-human`, `source-changed`, `dead-run`, `launch-abandoned`, `quota-pause`, `budget-alert`, `stale-run`, `orphan-processes`, `unknown-state` | 129 | Shown as text with the next command `status --json` |
| Budget levels (row 245) | `unknown`, `ok`, `info`, `warn`, `loud`, `over` | 129 | Read as `unknown` |
| Liveness values of the view (row 246) | `alive`, `dead`, `foreign`, `unknown`, `not-applicable` | 129 | Read as `unknown` |
| Reasons of `stale` (row 247) | `heartbeat-and-events-old`, `event-major-out-of-range` | 129 | Shown as text; the view stays `stale` |
| Keys of the status line (row 248) | `run`, `st`, `ph`, `unit`, `rej`, `el`, `next`, `strategy`, `attn`, `cur`, `validUntil` | 129 | A parser ignores a key it does not know |
| Quota states of a budget row (row 249) | `ok`, `signalled`, `paused` | 129 | Read as `ok` |
| Rows of the lane table (row 250) | L-01 to L-08 of F129-FR-016 | 129 | The default row L-08 fires |

The run states (row 1), the derived conditions (row 2), the blocked reasons (row 4), the results of a lock probe (row 23), the alert levels (row 48) and the event types (row 73) are used and are not owned here.

## Contracts of feature 100 used

| Contract | Schema id | Annex and section | Used for |
|---|---|---|---|
| UI read model (EP-09) | `specstride.view/1` | G §G.6, F100-FR-188 | The interface this feature gives its content to |
| Event envelope and versioning | `specstride.event/1` | X §X.1, F100-FR-198 to F100-FR-200 | The stream the view reads: `seq`, `ts`, `runId`, the open and close pairs, the rule for unknown types and a torn line |
| Run record; run-state machine; blocked reasons | `specstride.run-state/1` | E §E.2, F100-FR-141, F100-FR-143, F100-FR-145 | The ten states, the derived conditions, the blocked reasons |
| Terminal record | `specstride.terminal/1` | B §B.15, F100-FR-071 | The `blocked` field, the stop reason, `synthesized` |
| Pause record | `specstride.pause/1` | B §B.17, F100-FR-073 | The quota pause item |
| Lease; owner record | `specstride.lease/1` | B §B.8, §B.9, F100-FR-061, F100-FR-062 | `heartbeatAt`, `validUntil`, liveness |
| Launch record | `specstride.launch/1` | B §B.7, F100-FR-060 | `launch-abandoned`, the refused resume |
| Supervision record | `specstride.supervision/1` | B §B.16, F100-FR-072 | The suggested seconds until the next reading |
| Process registry | `specstride.procs/1` | B §B.10, F100-FR-063, F100-FR-064 | Classes, holders of the run token |
| Lock and liveness provider (EP-13) | `specstride.lock/1` | F §F.5, F100-FR-164 | The results of `probe` |
| Re-attachment | — | F §F.3, F100-FR-161 | The precomputed line and its `validUntil` |
| CLI protocol, output modes, line grammar | protocol 1 | G §G.1, §G.2, §G.3, F100-FR-170 to F100-FR-178 | `status`, `wait`, the two output modes, the status line and product lines |
| Exit codes per command | — | G §G.4, F100-FR-182, F100-FR-186 | `status` 0 and 1, `wait` 0, 1 and 3 |
| Token budgets | — | G §G.5, F100-FR-187 | The 60-token line and the 150-token cycle |
| Table evaluator | `specstride.table/1` | X §X.3, F100-FR-204 | Lane derivation |
| Redactor | `specstride.redaction/1` | X §X.4, F100-FR-205 | Free text in the view |
| Canonical hasher | — | X §X.5, F100-FR-207 | The change signature |
| Logical names | `specstride.layout/1` | B §B.5 | `run:<runId>:view`, `run:<runId>:status-line`, `workspace:current:status-line`, `run:<runId>:events`, `run:<runId>:record`, `run:<runId>:terminal`, `run:<runId>:pause`, `run:<runId>:lease`, `launch:<launchId>:record`, `launch:<launchId>:supervision`, `run:<runId>:procs` |
| Closed sets | — | X §X.6, F100-FR-208 | Rows 1, 2, 4, 23, 48, 73; the rows owned here are 243 to 250 |
| The `parity` profile | `specstride.profile/1` | X §X.7, F100-FR-210, F100-FR-212 | Rows 18, 19, 20, 127 |
| Threat model | — | X §X.9, F100-FR-219 | T-33, T-38 to T-42 |
| Fixture families | — | Feature 141 §O.2 | FX-01, FX-02, FX-03, FX-04, FX-11, FX-12, FX-13, FX-22, FX-23, FX-28 |

## Extension points

| Point | Version | Role | Requirements |
|---|---|---|---|
| EP-09 UI read model | `specstride.view/1` | implements: content owner. `project`, `reduce`, the cursor, lanes, attention items, budget levels, the derived conditions | F129-FR-001 to F129-FR-023, F129-FR-028, F129-FR-030, F129-FR-032, F129-FR-033, F129-FR-035, F129-FR-036 |
| EP-01 host port | `specstride.host/1` | consumes: the commands `status` and `wait` of the CLI protocol (annex G §G.1); consumes the host hook shim that prints the precomputed line (annex B §B.5, `workspace:current:status-line`) | F129-FR-003, F129-FR-024, F129-FR-028, F129-FR-029, F129-FR-031 |
| EP-13 lock and liveness provider | `specstride.lock/1` | consumes: `probe` | F129-FR-012 |

This feature owns the content of EP-09. It is the single owner of the data behind `status` and of its default output.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F129-SC-001**: In a new session, with no knowledge of the run and with every process of the run ended, `status` gives the state, the phase and the attention items of the run from files alone: in 100 per cent of the fixture states (each of the ten written states, and each of `dead`, `stale` and `launch-abandoned`), the printed `st=`, `ph=` and the kinds of the attention items equal the row of the fixture, and on an event file of 100,000 events `status` finishes within 2 seconds. It is the reading half of the criterion that the feature of the detached runtime carries.
  - test: CT-129-37
  - origin-note: criterion of brief 129; the limit of 2 seconds is a target of this feature and not a value of the sources

- **F129-SC-002**: `wait --until-change` prints 0 bytes on an unchanged state, in 100 per cent of the runs of the budget fixtures, including a run of 10,000 events that change no field of the change signature; and on a changed state it prints exactly one line of at most 170 bytes, in 100 per cent of the fixtures for the nine kinds of attention item and for the state changes.
  - test: CT-129-38
  - origin-note: criterion of brief 129

- **F129-SC-003**: The doctor, `status`, `wait`, the host hook shim and a sample renderer read `RunView` and nothing else: the static check finds 0 imports of the event reader or of a state reader in any renderer or command, and the sample renderer, given no file handle, renders every lane, attention item and budget level of every golden view.
  - test: CT-129-39
  - origin-note: criterion of brief 129 ("one read model")

- **F129-SC-004**: On the golden views of the fixture event logs, two projections of the same inputs are equal byte for byte in 100 per cent of the logs, and the property of F129-FR-002 holds for 100 per cent of the prefixes of every log, torn log included.
  - test: CT-129-40

- **F129-SC-005**: For the table of derived conditions (five live states and the six results of a probe of the lease) and for the resting states, `dead`, `stale` and `launch-abandoned` come out as the table says in 100 per cent of the 34 cases, and the hash of every file of the control plane is the same before and after `status` and `wait`, in 100 per cent of the runs.
  - test: CT-129-41

- **F129-SC-006**: Under the default profile, no status line of any fixture exceeds 170 bytes, and the status line with every key at its longest value is cut to at most 170 bytes by the fixed order of F129-FR-027 with `run`, `st` and `validUntil` intact, in 100 per cent of the cases. A precomputed line of a live state has a `validUntil` equal to that of its lease in 100 per cent of the fixtures.
  - test: CT-129-42

- **F129-SC-007**: With canary strings planted in a task title, in feedback, in a blocked question, in a file name and in the summary of a tool (an escape sequence, a markup tag, a registered secret, a token pattern), 0 canaries reach the view unredacted or with a control character, and 0 physical paths appear in it.
  - test: CT-129-43

- **F129-SC-008**: With parallel units off, the view of every fixture of the layer-off suite holds 0 fields of the layer; with the option on, the view holds both hour figures and the agent hours equal the sum of the passes.
  - test: CT-129-44

- **F129-SC-009**: Under the `parity` profile, `status` in compatibility output takes its facts from the view in 100 per cent of the scenarios of FX-28, and `status --line`, `status --json` and `wait` print 0 bytes.
  - test: CT-129-45
  - origin-note: the data behind `status` on FX-28; the compatibility lines themselves are compared by feature 119

## Assumptions

- The view is computed from events and files by a pure function. Everything it may not do itself (read a file, probe a lease, search the process table, read the clock) is done by the caller and handed in as an observation (CQ-161).
- The run that `status` and `wait` show is the run of the newest launch record. There is no flag to show an older run.
- The handshake limit is a value the caller passes. Its length belongs to the feature of the detached runtime.
- The default age after which an event is old is 1,800 seconds. It is twice the longest watchdog of a pass (900 seconds); a run in a long verification job that emits no event for that time and whose heartbeat is also late is `stale` (CQ-162).
- The event types that the lane table and the attention items read are those of the catalogue of feature 111. The plan lists the names that research report R14 proposes; the names of the catalogue win.
- The launch record has the outcome and the reason of a refusal in a form the read model can read (CQ-166, granted on 2026-10-01: annex B §B.7 gives `refusal` as a member of the closed sets of rows 13, 51 and 212 of annex X §X.6 and `refusalFile` as the file of row 50; `contracts/observations.md`).
- The status line of a resting run carries `validUntil=none` (CQ-163).
- The cursor token carries a short hash of the change signature in addition to the offset and the last `seq` (CQ-164).
- The caps of the default output of `status` are derived from the budget of one supervision cycle (CQ-165).
- Under the `parity` profile `status --line`, `status --json` and `wait` print nothing, because they have no as-is equivalent (CQ-169).
- macOS statements are `unverified` (owner ruling 67). So are the statements about the lifetime and the output of host hooks, which rest on documentation only.
- Requirements are 36, under the estimate limit of about 45; no split is proposed.

## As-is behaviour not carried

The traceability files assign to this feature 1 requirement and no behaviour item. The row has the disposition `superseded-by`.

| As-is id | Behaviour | Disposition | Register row |
|---|---|---|---|
| 002 FR-017 | `status` reports RUNNING whenever the lock directory exists | `superseded-by DV-042` | DV-042 |

Lisa's `status` is replaced by the probe of the lock that Specstride's `status` makes (D-07). No characterization test is carried for the Lisa side (DV-042). The requirement that carries the new rule is F129-FR-012.

Behaviour of the baseline that this feature does not carry, because it is not part of the data behind `status`: the lines of the compatibility output (feature 119), the telemetry lines that need the configuration of the last run (see the clarification 9), and the trajectory paging of Lisa (deferred to Wave 2, 002 FR-051 and 002 SC-007).

## Clarifications

### Session 2026-09-29

| # | Question | Answer | Source |
|---|---|---|---|
| 1 | Which state files does the read model take, given that R15 names the run record, the lease and the pause record, and annex G names the run record, the terminal record and the pause record? | The three state files of annex G, and the lease as the result of a probe. Four more values are observations that the caller supplies, because rules of feature 100 need them: the newest launch record (`launch-abandoned`, a refused resume), the supervision record (the suggested seconds until the next reading), the search of the process table (processes that hold the run token), the handshake limit. The function stays pure | F100 annex G §G.6; annex B §B.7, §B.16; R29v PU-90; R15v C-8 (CQ-161) |
| 2 | Is `stale` one condition or two? | One field with a reason. Annex E §E.2 defines it as: the owner lives and the heartbeat and the newest event are both old. Annex G §G.6 also marks a view `stale` for an event major out of range. Both are in the field, told apart by the reason | F100 annex E §E.2, annex G §G.6; F129-FR-013 (CQ-162) |
| 3 | Does the precomputed line of a run that rests carry `validUntil`? | Yes, with the value `none`, and it does not expire. F100-FR-161 says the line carries `validUntil`; a resting run has no lease and no heartbeat | F100-FR-161; R15v D-6 (CQ-163) |
| 4 | What is a change for `wait --until-change`? | A change of the change signature: state, liveness, conditions, current phase, approved phases, reject count, attention items, budget levels, strategy. Not progress inside a phase attempt. Reason: in the reference run 98 per cent of the polls found nothing new; a wake for every pass would bring the cost back | R17 F14; brief 129 heading 8 |
| 5 | What does the cursor hold? | File, offset and last `seq` as annex G says, and a short hash of the signature in the token, because a change of a state file or of the time moves none of the three | F100 annex G §G.6; R15v D-4 (CQ-164) |
| 6 | Which run does `status` show? | The run of the newest launch record of the workspace | F100 annex B §B.7, §B.3 |
| 7 | Who derives the alert level of a budget row? | The engine, through its alert events. The view adds only `over`, from the fraction or from the event that the cap was exceeded. A second source of alerts would make the doctor and `status` disagree | `architecture.md` section 12 ("Alerts"); R14 (alerts) |
| 8 | Is a run that is `dead` shown in the lane `blocked`? | Yes. The phase that was in flight rests until the consumer resumes. The lane `failed` is kept for a run that failed | R13 (lane derivation); F129-FR-016 (CQ-170) |
| 9 | Where do the per-phase table, the telemetry lines and the latest tool of the baseline's `status` come from? | From events. The view holds a list of phases with three facts (evidence, approved, feedback), the latest tool, the observability mode and the state of each telemetry delivery that events report. The line that says whether telemetry is configured reads the configuration of the last run, which is not an input of the read model; that line is feature 119's | Baseline `status` at `9cab15d` (B-1431); F129-FR-011 (CQ-167) |
| 10 | What do "wall hours" and "agent hours" mean? | Wall hours: the elapsed time of the run. Agent hours: the sum of the durations of every pass, worker passes included | R29 PU-72; R29v PU-98 (CQ-168) |
| 11 | How long may the default output of `status` be? | 420 bytes: 150 tokens at 2.8 bytes per token, the budget of one supervision cycle. The status line has 170 bytes, 60 tokens | F100 annex G §G.5; ruling 65; R17 (CQ-165) |
| 12 | Which lines print under the `parity` profile? | Only the lines of the baseline, in compatibility output. `status --line`, `status --json` and `wait` have no as-is equivalent, so they print nothing | F100-FR-176; ruling 68 (CQ-169) |
| 13 | Who writes the cached view and the precomputed line? | The runtime, as annex B §B.5 says. This feature specifies their content and the rule for `validUntil`. The `status` command writes nothing | F100 annex B §B.5, LR-4 |
| 14 | Does a process that only reads state fit Principle I? | Yes. `status` and `wait` are started by the consumer or the host, no run depends on them, and `wait` ends by its time limit | Ruling 63 (DP-004); the constitution, Principle I |
| 15 | Who owns `status`? | This feature owns its data and its default output; feature 119 owns the compatibility output | R15v E-3; brief 129 heading 1 |
| 16 | What of Lisa's `status` that reports RUNNING for any lock directory? | Superseded. `status` probes the lock and reports `dead` when the owner is gone. No characterization test is carried for the Lisa side | Register row DV-042; D-07 |
| 17 | Does the read model guard against the viewer threats T-38 to T-42? | It guarantees what a pure read model can: no listener, no route, redacted text without control characters, no content and no physical path, and commands that end by their own limit. Origin checks, tokens, content-security policy and the process record are the viewer's, feature 121 | F100 annex X §X.9; R11 T-38 to T-42 |
| 18 | How is the elapsed time written in the status line? | `<h>h<mm>m`, and `<m>m` below one hour. The example of R17 is `el=5h12m` | R17 F13; F129-FR-027 |
| 19 | Does the view verify an approval? | No. The fact "approved" is what an event states. Verification of the approval record, its signature and its bindings belongs to `resume` and to the engine (F100-FR-070); the view is a display and decides nothing | F100 annex B §B.14; Principle II |
| 20 | Which event types open and close a pass, a critic-class call, a verification job and a unit of work? | The pairs of the catalogue of feature 111, by the rule that every event that opens something has an event that closes it (F100-FR-200); a pair that died with its process is closed by a synthesized event of the next writer. The plan lists the names of R14 as a proposal; a test fails when an event type of a fixture log has neither a row in the signal table nor the mark "ignored" | F100-FR-200; R14 EV-23 |
| 21 | What does `st` show when the run record says `running` and the condition is `stale`? | `stale`. A derived condition replaces the written state in `st`; the written state stays in `--json` | F100 annex E §E.2; F129-FR-027 |

## Repairs after the cross-feature review

Dated 2026-09-30. Item ids are those of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`.

| Requirement | Item | What changed |
|---|---|---|
| F129-FR-008 | W-X-11 | The `parity` line cites row 127 of annex X §X.7 in place of "row to be added" |
| F129-FR-017 | W-X-11 | The closed set of the kinds is row 244 of annex X §X.6, in place of "a row to be added" |
| F129-FR-024 | W-X-19 | `ep: EP-01` reads `consumes`, per `STAGE-B-RULES.md` (`ep:` row, 2026-09-30) |
| F129-FR-025 | W-X-33 | The compatibility-output line cites annex G §G.2 and §G.10 of feature 100, not feature 119 in prose |
| F129-FR-028 | W-X-11; W-X-25 | The `parity` line cites row 127 of annex X §X.7; the requirement names the pointer `workspace:current:status-line` of annex B §B.5 (F100-FR-229) |
| F129-FR-029 | W-X-19 | `ep: EP-01` reads `consumes` |
| F129-FR-034 | W-X-11 | `status.precompute` is row 127 of annex X §X.7, in place of "a new row" |
| F129-FR-035 | W-X-11 | The section "Closed sets" states the row of annex X §X.6 in place of "a row can be added" |

The signal table `contracts/signal-table.md` was rebuilt against the catalogue of feature 111 (124 types as read on 2026-09-30: 54 with a row, 70 marked `ignored`; after the second pass of feature 111 the catalogue holds 122 types, 54 with a row and 68 marked `ignored`, re-check B-8.7; the critic-call pair opens with `critic.started`) under W-129-01; T003 of `tasks.md` was rewritten to match. No requirement id, task id or test name was renumbered.
