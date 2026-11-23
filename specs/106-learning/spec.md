# Feature Specification: Learning

**Feature Branch**: `106-learning` (a label: Spec Kit creates no branch in this repository; the directory is `specs/106-learning`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 106-learning: learning as the across-runs layer: metrics from events, the allowlisted knobs and their bounds, the modes `off`, `suggest` and `apply`, the decision log with its byte format, sample floors and quarantine, `show`, `advise`, `apply`, `revert`, `evaluate`; the binding of the decision log into the launch contract; the rule that a supervised run receives the learning mode from the launch contract and not from the shell; selection of the learning mode from the request; the retrospective per launch contract hash."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 10, 17, 26, 68, K6, K8), `architecture.md` (sections 2, 10, 14; LR-5, LR-6), `consolidation.md` (sections 1, 3.7, 3.8, 4.2, 6), `feature-briefs.md` (brief 106-learning), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles I, V, XIII, XVIII), feature 100 (annexes B, E, G, X), feature 141 (fixture families FX-29, FX-33, FX-35, FX-36), research R12, R16 (F5.6, F5.8), R15v (C-7), R18, R19, R27 (IR-06).

## What this feature is

Specstride can get better at running one feature by looking at how earlier runs of the same feature
went. This feature is that across-runs layer. It is called learning. It is not memory: memory is
context carried forward into a prompt, and this product has no memory feature in Wave 1.

Learning is small on purpose. It reads the events of past runs, computes numbers, and may change
exactly two knobs: the time a proposer pass may take in one phase (`proposer_timeout`) and the
interval at which the engine polls a detached job (`yield_poll_interval`). It changes them only
inside hard bounds, only after enough samples, only when the consumer asks, and every change is a
line in a decision log that can be undone. Nothing learned may change what the critic reads or what
a verdict means.

The layer has three modes: `off`, `suggest` and `apply`. In `off` nothing is observed and nothing
is changed. In `suggest` the layer observes runs and evaluates decisions, and applies nothing. In
`apply` a learned value that the consumer recorded earlier is used at run time.

This feature owns: the metrics, the knobs and their bounds, the modes, the decision log and its byte
format, the sample floors, the quarantine, the public command `learn`, the binding of the decision
log into the launch contract, the rule that a supervised run takes the learning mode from the launch
contract and not from the shell, the selection of the mode from the request (the verb `learning` of
`supervise`), and the retrospective per launch contract hash (the verb `retro` of `supervise`). It owns the learning writer domain and its files. It owns no extension
point.

It does not own: memory (not specified), the validation of the launch contract that holds the
binding (feature 107 validates; the rule is here), the act of stripping a variable from a child's
environment (the pipeline runtime executes it; the rule is here), the rank of a learned value among
the layers of configuration (annex X §X.2 fixes the rank), and harness-native memory.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An operator reads what learning would do, and nothing changes (Priority: P1)

An operator has a feature with recorded runs. They run `learn` with no mode. They see, for each
phase, a suggested value for a knob, or the reason why there is none, and then the last recorded
evaluation of every active decision. Nothing under the learning files changes.

**Why this priority**: Suggest before apply is the first invariant of the layer. A reading command
that writes would break trust in the rest.

**Independent Test**: Run `learn` on a fixture with recorded runs and compare the learning files
before and after (fixture family FX-29, scenarios `show` and `advise-no-telemetry`). Nothing differs,
and the exit code is 0, or 1 when there is no telemetry.

**Acceptance Scenarios**:

1. **Given** recorded runs with at least three usable samples for a phase, **When** the operator runs `learn`, **Then** one suggestion line per phase is printed with the sample count, the percentiles, the current value, the suggested value and the bounds, and no file changes (F106-FR-023, F106-FR-026).
2. **Given** a feature with no telemetry, **When** the operator runs `learn`, **Then** it prints `learn: no telemetry for any phase` on standard error and exits 1 (F106-FR-025).
3. **Given** a phase with two samples, **When** the operator asks for advice, **Then** the line says there is no suggestion and that at least three samples are needed (F106-FR-014).

---

### User Story 2 - An operator applies, reverts and turns off a decision (Priority: P1)

The operator applies the current suggestion for one phase. One decision line is appended to the
decision log and one event is recorded. Later they revert exactly that decision, or turn every
decision off. The value in effect goes back to what it was before.

**Why this priority**: Bounded, logged and reversible are the invariants that make it safe to let a
number change at all.

**Independent Test**: FX-29 scenarios `apply`, `revert`, `off` and `below-sample-floor`: the
decision log, the events, the printed lines and the exit codes equal the reference (through the
mapping of the layout table and the compatibility projection). The quarantine needs an automatic
revert and is tested with user story 4.

**Acceptance Scenarios**:

1. **Given** a suggestion, **When** the operator applies it, **Then** one entry with the action `apply` is appended, one `knob_adjusted` event is recorded, and the line `learn: applied <knob>[<phase>] <previous>s -> <value>s (samples=<n>, run_id=<id>) -> <applied file>` is printed (F106-FR-015, F106-FR-026).
2. **Given** an active decision, **When** the operator reverts its run id, **Then** an entry with the action `revert` restores the value that was current before it; a decision that a later one has overtaken is refused (F106-FR-016).
3. **Given** a phase below the sample floor, **When** the operator applies, **Then** nothing is written and the command exits 3 (F106-FR-014).

---

### User Story 3 - A supervised run gets the learning mode from the launch contract, not from the shell (Priority: P1)

A consumer has `SPECSTRIDE_LEARNING=apply` exported in their shell. A pipeline run from a promoted
launch contract does not see it. Each stage runs with the mode the launch contract declares, and
`off` where it declares none. The doctor tells the consumer that the exported value is shadowed.

**Why this priority**: The launch contract says what runs. A value from the shell that changes a
timeout in an unattended run would make the launch contract untrue.

**Independent Test**: FX-35, scenario `106-learning-exported`, and FX-33, scenarios `valid`,
`invalid-learning` and `learning-decisions-changed` (validation of the learning binding, exits 20
and 23): a stage with an exported mode and no declaration runs as `off`; a changed decision-log
prefix is refused with 23.

**Acceptance Scenarios**:

1. **Given** an exported learning mode and a stage that declares none, **When** the pipeline runs, **Then** the stage's environment holds `off` (F106-FR-030).
2. **Given** a launch contract that binds decisions up to a run id and a decision log whose prefix has changed, **When** it is validated, **Then** it is refused with exit 23 (F106-FR-028).
3. **Given** an exported mode that differs from the launch contract's, **When** the doctor runs, **Then** it reports the shadowed value (F106-FR-031).

---

### User Story 4 - An applied decision is evaluated and can be undone by the layer itself (Priority: P2)

After an approved phase the layer evaluates every active decision of that phase against the
baseline recorded when it was applied. The label is `helped`, `neutral`, `regressed` or `insufficient`. If a guardrail is
breached the layer reverts the decision by itself, and the reverted value is quarantined until new
samples exist.

**Why this priority**: The evaluation is what makes learning more than a tuning tool. It is P2
because a run is correct without it.

**Independent Test**: FX-29 scenarios `evaluate`, `quarantined` and `106-apply-forced`.

**Acceptance Scenarios**:

1. **Given** an applied decision and runs in both arms with at least six samples each, **When** the layer evaluates, **Then** the label follows the rule of effect against the minimum detectable effect (F106-FR-018).
2. **Given** a breached guardrail, **When** a non-dry evaluation runs, **Then** the decision is reverted automatically, once, and the entry says why (F106-FR-019).
3. **Given** a value that an automatic revert quarantined, **When** the operator applies without `--force`, **Then** nothing is written and the command exits 4; with `--force` the entry carries `force` and `forced_over` (F106-FR-020, F106-FR-015).

---

### User Story 5 - The request selects the mode, and a retrospective is written after the run (Priority: P2)

The consumer's request says something about learning, or nothing. A fixed table of tokens and
phrases selects `off`, `suggest` or `apply`; the default is `off`. After the run, a retrospective
per launch contract hash reports what learning says about each stage and may suggest, never run, a
revert.

**Why this priority**: It closes the loop for the supervised path.

**Independent Test**: FX-36 scenarios `learning-selection` and `retro`.

**Acceptance Scenarios**:

1. **Given** a request that says nothing about learning, **When** the mode is selected, **Then** it is `off` with source `default` (F106-FR-032).
2. **Given** a completed run, **When** the retrospective is written, **Then** one file exists under the pipeline run and every suggestion is printed as `suggestion (not run)` (F106-FR-034, F106-FR-035).

---

### User Story 6 - The layer changes no observation and no other writer's file (Priority: P2)

A run with the layer on has the same events, verdicts and counts as a run with the layer off, apart
from the learning files. Learning writes only its own files, under its own lock.

**Why this priority**: One writer per event file is a rule of the architecture, and the layer must
not change what it measures.

**Independent Test**: An own test runs the same fixture with the mode `off` and `suggest` and
compares the event streams outside the learning files; a contention test runs a run and the
`learn` command at once.

**Acceptance Scenarios**:

1. **Given** the mode `suggest`, **When** a run completes, **Then** its event stream and its verdicts equal those of the run with `off`, apart from what F106-FR-039 lists.
2. **Given** a run in progress and a `learn` command that applies a decision, **When** both write, **Then** each writes only its own file and neither loses a line (F106-FR-038).

---

### Edge Cases

- A decision recorded under another phase shape, or under none, resolves to the default (F106-FR-011).
- A decision log with a half-written last line, blank lines or lines that are not JSON: they are skipped when read (F106-FR-007).
- The learning mode is not `off`, and the events file shrank during a pass: the run is marked tampered and excluded from every baseline and evaluation (F106-FR-037).
- A newer decision overtook the decision that is being evaluated when a guardrail breaches: nothing is reverted and the evaluation says so (F106-FR-019).
- The spec cannot be read for phase shapes: a notice on standard error, and the command continues without a shape restriction (F106-FR-024).
- A value of the learning mode that is not one of the three: it is read as `off` (F106-FR-009).
- `learn` is run while a run of the feature is alive: it may read, and any write goes to the learning writer domain only (F106-FR-038).
- The consumer's comment says "learn from everything": it cannot widen the mode beyond what the selector table gives (F106-FR-033).
- Two decisions were applied to one knob, phase and shape, and the newer one is reverted: the replay gives the value of the older one as the current value of `advise`, and a run still uses the default, because the latest decision is a revert (F106-FR-011).
- The shape of a phase cannot be read at run time: the phase runs on the default and the decision log is not read for it (F106-FR-011).

## Requirements *(mandatory)*

### Functional Requirements

#### G1 - Knobs, bounds, modes, metrics, decisions, quarantine

- **F106-FR-001**: Learning MUST be able to change exactly two knobs: the proposer timeout of a phase (`proposer_timeout`) and the poll interval of a detached job (`yield_poll_interval`). The set MUST be locked: a knob outside it MUST be refused with the message `learn: '<knob>' is not in the adjustable-knob allowlist (<members>) — refusing` and exit 2, where `<members>` is the sorted list in the form of the baseline, `['proposer_timeout', 'yield_poll_interval']`; on the command `learn` the check of the option `--knob` refuses such a name before that, as a usage error with exit 2; and a test MUST fail when a name is added to the set without a change of this specification. The former third knob (a hint about the yield artifact schema) MUST NOT exist. No breaker, no grounding cap, no critic setting and no verification command MUST ever be adjustable.
  - origin: 028 FR-024; C-095; C-088; C-091
  - disposition: ported
  - test: PT-106-028FR024-allowlist; PT-106-C-095-allowlist-lock; PT-106-C-088-knob-choices
  - parity: not a switch; the set is fixed

- **F106-FR-002**: Every adjustable knob MUST have hard bounds and a step cap. `proposer_timeout`: minimum 900 seconds, maximum twice the default in force when the value is computed. `yield_poll_interval`: minimum 10 seconds, maximum 300 seconds. A value MUST move by at most 50 per cent per step, from the value in effect, or from the default when none is applied. When the step window and the hard bounds do not overlap, the hard bounds alone MUST decide. The bounds MUST NOT be options.
  - origin: 028 FR-024; C-095
  - disposition: ported
  - test: PT-106-028FR024-bounds; PT-106-C-095-bounds-step
  - parity: not a switch; the constants are those of the baseline

- **F106-FR-003**: Nothing that learning writes MUST change what the critic reads or what a verdict means. A learned value MUST be read only at the places that assemble a pass's time limit and a job's poll interval. A test MUST lock these read sites, and MUST fail when another place reads a learned value. The phase gate MUST be out of scope of learning entirely. A learned decision MUST be logged, bounded and reversible, MUST rest on an evidence floor, and MUST be applied only when the consumer opts in.
  - origin: 028 FR-024; C-095; C-013
  - disposition: ported
  - test: CT-106-1; PT-106-C-013-read-sites
  - assumption: the invariants of the self-improving loop plan (R12 part 3) are carried in as this requirement and F106-FR-001, F106-FR-002, F106-FR-014, F106-FR-015, F106-FR-009

- **F106-FR-004**: The metrics MUST be computed from the event streams of past runs. The input MUST be an event file, a directory that holds one, or a directory of run directories in name order. The summary MUST be a document with the fields `schema`, `inputs`, `runs`, `attempts`, `phases` and `totals`, its schema id MUST be `specstride.learn.summary/7`, and it MUST be written to the logical name `feature:<slug>:learning:summary` when an output is asked for. An event that has no run id MUST be attributed to the run id last seen in the same file; an event seen before any run id in a file MUST be dropped. The events read MUST be, with the fields read from each: the start of a run, of a phase, of a pass and of the proposer; tool calls and results of the agent; the resume of a yield; the kill of a pass; the end of a pass; the end of a phase and the archiving of a phase attempt (each closes a phase attempt that has no end time yet); the writing of evidence; verification passed and failed; the start of the critic and the verdict; the diagnostician; grounding gaps; the cap of the proposer; tampering; the stop of a run. The fields read from each are those listed by the items of cluster C-090, read from the event stream through the compatibility projection where the as-is name is used. A summary MUST also be able to take, per attempt, the duration and the live share of the verification gate, the size of the critic prompt, and the count of live invocations of the proposer from the run log.
  - origin: C-090; C-093; C-088; C-095
  - disposition: translated (C-090, C-093, C-088); ported (C-095)
  - test: PT-106-C-090-events-read; PT-106-C-093-summary-document; PT-106-C-088-summary-inputs; PT-106-C-095-attribution
  - divergence: DV-007; DV-006; DV-066

- **F106-FR-005**: The metrics MUST be defined as the baseline defines them. A tool call is a wait call when its target matches one of the wait shapes of the baseline or declares sleep seconds; declared sleep seconds are summed. Kill classes: a kill at the hard cap is budget, a kill for a repeated stall or a stall of progress is futility, a kill for idleness is hang, any other reason is unknown. A pass outcome is `budget_kill`, `worker_error`, `open`, `productive` or `clean_no_progress`, in that order of test. A pass is billed when it is closed and its result carried a cost. The work of an attempt is the sum of the elapsed time of its passes less the declared sleep seconds, never below zero, and an attempt with any futility kill MUST NOT count in the work samples of its phase. Percentiles MUST use linear interpolation between sorted samples, rounded to one decimal. With phase shapes given, the figures of a phase MUST use only attempts recorded under that shape; a phase with none is omitted, and the count of attempts left out is reported.
  - origin: C-095
  - disposition: ported
  - test: PT-106-C-095-wait-kill-outcome; PT-106-C-095-percentiles; PT-106-C-095-shape-restriction

- **F106-FR-006**: After each approved phase, when the mode is not `off`, the layer MUST write one observation of that phase to the logical name `feature:<slug>:learning:observation:<N>`. The document MUST hold `schema` (`specstride.learn.observation/1`), `phase`, `shape`, `generated_at`, `observation` and `inputs`, and MUST be overwritten whole on each call. A phase with no telemetry MUST NOT be an error: the observation is null. The operation has no command (F106-FR-022); it MUST return the line `learn: phase <N> observation — <a> attempt(s), work p50=<x>s p90=<y>s → <out>` or `learn: no telemetry for phase <N> yet → <out>`, which in a run goes to the engine log and not to standard output (F106-FR-036). After an observation was written, the engine MUST record the event `learning.observed`, with the phase and the logical name, in the event stream of the run (F106-FR-021); a failed observation MUST record no event.
  - origin: C-011; C-087; C-093; C-094; C-008
  - disposition: translated (C-011, C-087, C-093, C-008); ported (C-094)
  - test: PT-106-C-011-observe-after-phase; PT-106-C-093-observation-document; PT-106-C-008-learning-observed
  - divergence: DV-006; DV-007; DV-066

- **F106-FR-007**: The decision log MUST be an append-only file of lines, one entry per line, at the logical name `feature:<slug>:learning:decisions`, and its byte format MUST be kept exactly, because the binding of F106-FR-027 hashes its bytes. An entry MUST be one JSON object on one line, with the members in the order of F106-FR-008, a comma and one space between members, a colon and one space between a name and its value, every character outside ASCII written as an escape of four hexadecimal digits in lower case, a numeric value written as the baseline writes it (a whole number that the baseline writes with a fraction keeps the fraction), and one line feed at the end. The directory MUST be created on demand and existing lines MUST never be rewritten. A reader MUST skip blank lines, lines that are not JSON, and values that are not objects, so that a half-written last line does not stop a read. Event files MUST be read as leniently: a JSON value without an event name MUST be skipped. An entry of the schema `specstride.learn.applied/1` MUST still be read and MUST never match a shape.
  - origin: C-093; C-087
  - disposition: translated
  - test: PT-106-C-093-log-bytes; PT-106-C-093-lenient-read; CT-106-2
  - divergence: DV-006
  - assumption: byte-identity of numbers is a claim on the two runtimes; a test compares the bytes of every entry of FX-29 with the reference

- **F106-FR-008**: The entries of the decision log MUST have these members, in this order, under the schema id `specstride.learn.applied/2`. An `apply` entry: `schema`, `action` (`apply`), `run_id`, `knob`, `phase`, `shape`, `value`, `previous`, `samples`, `source_runs`, `metric`, `applied_at`, `baseline`, and `force` and `forced_over` only when the entry was forced over a quarantine. A `revert` entry: `schema`, `action` (`revert`), a new `run_id`, `reverts_run_id`, `knob`, `phase`, `shape`, `value` (the previous of the apply), `previous` (the value of the apply), `applied_at`; an automatic revert MUST add `auto`, `guardrail` (a list), `evaluated_from`, `quarantined_value`, `backend` and `reverted_ts`. An `evaluate` entry: the members of the evaluation result first, in the order that `data-model.md` lists, then `action_taken` where the evaluation took an action, then `schema`, `action` (`evaluate`), a new `run_id` and `evaluated_at`, as the baseline writes them; it MUST never change an apply entry. The `baseline` of an apply entry MUST hold `backend`, `shape`, `runs`, the samples of `cost` and `wall` as pairs of run and value, and the counts of `guardrails`, whose members and order `data-model.md` lists; runs under another harness label and runs flagged as tampered MUST be left out. `applied_at` MUST be UTC to the second. A decision run id MUST be `learn-` followed by twelve hexadecimal characters, unless the consumer gives one. The `metric` of an apply MUST be `work_sec_p90` for `proposer_timeout` and `job_duration_p50` for `yield_poll_interval`.
  - origin: C-093; C-095; C-092
  - disposition: translated (C-093); ported (C-095, C-092)
  - test: PT-106-C-093-entry-fields; PT-106-C-095-run-id-form
  - divergence: DV-006

- **F106-FR-009**: The learning mode MUST be a closed set with the members `off`, `suggest` and `apply`, and the default MUST be `off`. A value that is not a member MUST be read as `off`. In `off` the layer MUST observe nothing and change nothing. In `suggest` the layer MUST observe, evaluate and print, and MUST NOT let any learned value take effect. In `apply` a recorded decision MUST take effect at run time under F106-FR-010. The mode MUST be the configuration key `learning.mode`, with the as-is variable `SPECSTRIDE_LEARNING` as its alias (annex X §X.8) and `learning.through` for `SPECSTRIDE_LEARNING_THROUGH`; both keys MUST be pinnable by the launch contract. No other option of learning MUST exist: floors, bounds and bands are constants.
  - origin: C-089; C-007; C-095
  - disposition: translated (C-089, C-007); ported (C-095)
  - test: PT-106-C-089-mode-values; PT-106-C-007-layer-on; CT-106-3
  - divergence: DV-027; DV-105
  - parity: `learning.mode` as the fixture sets it (row 43 of annex X §X.7)
  - assumption: CQ-113 (unknown values of the mode read as `off`; closed on 2026-09-30, the recommended answer stands)

- **F106-FR-010**: At the start of each pass the layer MUST resolve, per knob and per phase, the value in force, and MUST return the value and an arm (`applied` or `baseline`). The value MUST be a learned one only when the mode is exactly `apply` and the latest bound decision for the knob, the phase and the phase shape is an `apply` entry, whose value MUST be clamped into the hard bounds at read time and returned as a whole number. Otherwise the value MUST be the default handed in, the arm MUST be `baseline`, and the decision log MUST NOT be opened. The arm MUST be `applied` when such a decision exists even if its value equals the default. The source of the value MUST be recorded as `learned`, per applied value, and MUST otherwise be the source of the rank that gave it. A learned pass ceiling MUST rank under a per-phase setting and above the timeouts declared in the verification commands and above every setting that is not per phase (rank 7 of annex X §X.2, kept from the baseline). The layer MUST print the notice about decisions recorded without a phase shape on standard error only under the mode `apply`. When a decision is bound through a run id (F106-FR-027), every `apply` entry after that entry MUST be ignored, reverts after it MUST still count, and a run id that names no entry MUST mean that no apply counts.
  - origin: C-013; C-007; C-089; C-095; C-087; C-093
  - disposition: ported (C-013, C-095); translated (C-007, C-089, C-087)
  - test: PT-106-C-013-resolve-cap; PT-106-C-089-through-bound; PT-106-C-095-arm-and-clamp; PT-106-C-087-resolve
  - divergence: DV-025; DV-027; DV-066
  - parity: none needed; same as the baseline (FX-29)

- **F106-FR-011**: A decision MUST apply only to the phase shape it was learned under. A decision recorded under another shape, or under none, MUST resolve to the default. The shape of a phase MUST be taken from the canonical spec model of the spec-format contract (annex C §C.7), or be given explicitly and then override it. The effective value MUST be the last-one-wins replay of the decision entries (`apply`, `revert`, and entries with no `action`); an `evaluate` entry, or any other action, MUST never move a value. The replayed value and the value in force at run time differ in one state, and the difference MUST be kept as the baseline has it: when the latest decision of a knob, phase and shape is a `revert`, the replay gives the value that the revert recorded (the `previous` of the reverted apply, which may be an older learned value), while a run uses the default handed in (F106-FR-010). `advise` and `apply` MUST take the replayed value as the current value (the base of the step window, the `current` of a suggestion line and the `previous` of a new entry), and the default only where the key has no decision. At run time a phase whose shape is not known MUST run on the default, and the decision log MUST NOT be read for it.
  - origin: C-095; C-088; C-093
  - disposition: ported (C-095); translated (C-088, C-093)
  - test: PT-106-C-095-shape-key; PT-106-C-095-replay; PT-106-C-088-phase-shape
  - divergence: DV-006

- **F106-FR-012**: The suggestion for `proposer_timeout` MUST be made only with at least three samples of the work of the phase. The target MUST be 1.25 times the 90th percentile of the work (the median where the 90th is missing), clamped to the step window and the hard bounds, rounded to the nearest 60 seconds, and clamped to the hard bounds again. Below the floor the value MUST be null with the reason `fewer than 3 non-futility-killed samples (have <n>)`.
  - origin: C-095; C-092
  - disposition: ported
  - test: PT-106-C-095-suggest-timeout; PT-106-C-092-floor-reason

- **F106-FR-013**: The suggestion for `yield_poll_interval` MUST be made only with at least three job-duration samples. The target MUST be 0.1 times the median job duration of the phase, clamped to the step window and to 10 to 300 seconds, rounded to a whole second. Below the floor the value MUST be null with the reason `fewer than 3 non-futility-killed job-duration samples (have <n>)`.
  - origin: C-095; C-092
  - disposition: ported
  - test: PT-106-C-095-suggest-poll; PT-106-C-092-floor-reason-poll

- **F106-FR-014**: An `apply` MUST be refused, with nothing written, when the phase has no telemetry (`no telemetry for phase <N>`) or when a sample floor is not met, and the command MUST exit 3 with `learn: refusing to apply — <reason>`. The sample unit of an evaluation MUST be a billed pass that was not killed for futility. `advise` below the floor MUST print `learn: phase <N> <knob>: <n> sample(s) — <reason>; no suggestion (need >=3)`.
  - origin: C-092; C-094; C-091; C-095
  - disposition: ported
  - test: PT-106-C-092-refusal-reasons; PT-106-C-091-apply-exit-3; PT-106-C-094-below-floor-line

- **F106-FR-015**: `apply` MUST append one `apply` entry to the decision log and one `knob_adjusted` event to the learning stream (F106-FR-021), for one knob and one phase, and MUST return the entry. The event reason MUST be `learned_from_work_sec_p90` for `proposer_timeout` and `learned_from_job_duration_p50` for `yield_poll_interval`. `--force` MUST apply a value that an automatic revert quarantined, and the entry MUST then carry `force: true` and `forced_over` with the run id of the automatic revert. A knob outside the allowlist, a missing input, or no way to find the decision log MUST exit 2.
  - origin: 028 FR-024; C-087; C-088; C-092; C-091
  - disposition: ported (028 FR-024, C-092, C-091); translated (C-087, C-088)
  - test: PT-106-028FR024-apply-entry; PT-106-C-087-apply; PT-106-C-088-force; PT-106-C-092-apply-reasons
  - divergence: DV-066

- **F106-FR-016**: `revert <run id>` MUST undo exactly one earlier `apply`, restoring the value that was current before it, by a new `revert` entry and one `knob_adjusted` event with the reason `revert`. Only the entry that is currently on top of its knob, phase and shape MAY be reverted; any other MUST be refused with `run_id '<id>' is not the active decision for <knob>[<phase>] — nothing to revert`, and a run id that names no `apply` MUST be refused with `no applied entry with run_id '<id>'`, both with exit 2. A revert MUST print `learn: reverted <run-id> — <knob>[<phase>] back to <value>s`.
  - origin: 028 FR-024; C-087; C-092; C-094
  - disposition: ported (028 FR-024, C-092, C-094); translated (C-087)
  - test: PT-106-028FR024-revert; PT-106-C-087-revert; PT-106-C-092-revert-refusal
  - divergence: DV-066

- **F106-FR-017**: `off` MUST revert every knob, phase and shape whose latest decision is an `apply`, one `revert` entry and one event each, and MUST print one `learn: reverted ...` line per reverted decision, or `learn: nothing was applied — already at defaults`. It MUST always end with the note that the mode `off`, or unset, in the environment of a run is what makes learned values ignored, and that the command only clears recorded decisions. It MUST exit 0, or 2 when no decision log can be found.
  - origin: C-087; C-094; C-091
  - disposition: translated (C-087); ported (C-094, C-091)
  - test: PT-106-C-087-off; PT-106-C-094-off-lines; PT-106-C-091-off-exit
  - divergence: DV-066

- **F106-FR-018**: `evaluate` MUST label every active decision `helped`, `neutral`, `regressed` or `insufficient` against the baseline recorded when it was applied. The unit MUST be the log of the cost and of the wall time per pass, clustered by phase episode. A primary MUST be `insufficient` unless both arms have at least six samples. The minimum detectable effect MUST be 2.80 times the larger of the sample deviation and 0.50, times the square root of one over the applied count plus one over the baseline count, times the square root of (one plus half of (the mean passes per episode less one)). Values MUST be floored before the log: cost at 0.0001, wall time at 1.0 second. The effect MUST be the difference of the mean log values, applied less baseline; the label MUST be `helped` when the effect is at most minus the minimum detectable effect, `regressed` when it is at least the minimum detectable effect, and otherwise `neutral`. The combined label MUST be `regressed` if either primary regressed, else `helped` if either helped, else `neutral` if either is neutral, else `insufficient`. `evaluate` MUST run no significance test. `--dry-run` MUST print the evaluation and write no entry, emit no event and revert nothing; `--report` MUST be read-only and print the last recorded evaluation of every active decision, `learn: no active decisions`, or `...: not evaluated yet`. An evaluation MUST be recorded, as an entry and an event, only when its signature (the label, the reset, `action_taken`, the two arm sizes of each primary, and the guardrail records with their counts, probabilities and states) differs from the last one of the same decision.
  - origin: 028 FR-024; C-087; C-088; C-092; C-095; C-094
  - disposition: ported (C-092, C-095, C-094); translated (C-087, C-088)
  - test: PT-106-028FR024-evaluate; PT-106-C-095-mde-and-label; PT-106-C-088-dry-run-report; PT-106-C-087-evaluate; PT-106-C-092-evaluate-reasons
  - divergence: DV-066

- **F106-FR-019**: The arms of an evaluation MUST be decided as follows. A run belongs to the applied arm of a decision when its record of the pass limit shows the arm `applied` with the decision's value and the tamper bracket on; with no arm recorded, when the source of the value is `learned` at that value. The runs that a decision was learned from MUST never be in its applied arm. A baseline reset MUST be recorded and the label MUST be `insufficient` when the shape of the phase changed since the decision (`reset=shape`) or when the latest run of the phase is not one of the runs of the baseline and used another harness label than the baseline (`reset=backend`, and the applied-arm samples are discarded); a decision applied before evaluations existed MUST be `insufficient` with the reason `no baseline recorded (applied before evaluate existed)`. Without a spec or an explicit shape, each decision's own recorded shape MUST count as the current shape. For `proposer_timeout` a counterfactual MUST be recorded (`censored` for a longer cap, `shorter_cap_wall_only` for a shorter one, `none` otherwise) and MUST never feed the label. A guardrail MUST have the state `ok`, `breach` or `unknown`. The guardrails MUST be `grounding_gap_rate`, `malformed_rate`, `verification`, `diagnostician_grounding_share`, `critic_input_size`, `arbitration_proxy` and `first_attempt_approval` (two-sided). A rate guardrail MUST be `unknown` below ten applied-arm trials, and when the baseline has no trial; otherwise the baseline rate MUST be shrunk to (k + 0.5) / (n + 1), and the guardrail MUST breach when the exact one-sided binomial tail against that rate is below 0.01 (for the two-sided guardrail, the smaller of the two tails). The trials and the counted cases of each rate guardrail, and the statistic of the rank test, are those of the baseline, listed in `data-model.md`. `verification` MUST breach at any count when the applied arm has a failed verification and the baseline had none, and be `unknown` with no applied attempts. `critic_input_size` MUST need six prompt sizes per arm and breach on an exact rank test below 0.01. The arbitration proxy MUST count the episodes whose run stopped at the phase with one of the stop reasons `max_rejects`, `gate_oscillation`, `critic_config` or `proposer_no_progress` (stop-reason enumeration of annex E §E.3). A breach in a non-dry evaluation MUST revert the decision automatically, with the reason `auto_revert`, an entry (F106-FR-008), the events `knob_adjusted` and then `knob_auto_reverted`, and the line `learn: auto-reverted <run-id> — guardrail <names>; <knob>[<phase>] back to <value>s`; it MUST be the only automatic write to a decision. When a newer decision has overtaken the evaluated one, the breach MUST be recorded with `action_taken=skipped_superseded` and nothing reverted; after a manual revert or `off` it MUST be a silent no-op. The values of `action_taken` of an evaluation MUST be `evaluated`, `auto_reverted` and `skipped_superseded`; the event of the evaluation carries it as `action`.
  - origin: C-095; C-092; C-093; C-094; C-087
  - disposition: ported (C-095, C-092, C-094); translated (C-093, C-087)
  - test: PT-106-C-095-arms; PT-106-C-095-guardrails; PT-106-C-095-auto-revert; PT-106-C-092-reset-reasons; PT-106-C-094-auto-revert-line
  - divergence: DV-006

- **F106-FR-020**: After an automatic revert, a suggested value within 10 per cent of the reverted value, for the same knob, phase, shape and harness label, MUST be refused until six new samples, from runs of the same harness label started after the revert and not killed for futility, exist. `advise` MUST then print, before the suggestion line of the same phase, `learn: phase <N> <knob>: suggestion <v> is QUARANTINED — auto-reverted by <run-id> (<guardrails>); <k>/6 new samples since; --apply refuses without --force`. `apply` without `--force` MUST write nothing and exit 4 with `learn: refusing to apply — quarantined: <detail>`, where `<detail>` is `<v> is within ±10% of <q>, auto-reverted by <run-id> (reverting <run-id>, guardrail <names>); <k> of 6 new samples since — pass --force to apply anyway`. A primary below its floor MUST print `<name> n=<a>/<b> (need 6/6)`.
  - origin: C-095; C-091; C-094
  - disposition: ported
  - test: PT-106-C-095-quarantine; PT-106-C-091-apply-exit-4; PT-106-C-094-quarantine-line

- **F106-FR-021**: Learning MUST record its events in its own stream at the logical name `feature:<slug>:learning:events`, as events of the envelope `specstride.event/1` (annex X §X.1), with the timestamp of the envelope. The stream MUST pass the one ingress before anything is written to it (F106-FR-040). The event types of the learning stream MUST be the three that the event catalogue (annex X §X.6 row 73) files under the learning stream: `learning.knob_adjusted` (apply, revert and their reasons, with `from`, `to`, `reason`, `metric`, `samples` and the run id; a revert carries `samples` and `metric` null and the id of the reverted run), `learning.knob_auto_reverted` (with the guardrail names, `from`, `to`, the run id and the id of the reverted run, recorded after the `learning.knob_adjusted` of the same revert) and `learning.knob_evaluated` (with `label`, `action`, `reset`, the cost and wall effects and their minimum detectable effects, the arm sizes, the run id and the id of the evaluated run). The fourth type of the catalogue with the prefix `learning.`, `learning.observed` (the observation of a phase, F106-FR-006), MUST be an event of the event stream of the run: the engine, the one writer of that stream, records it after the observation was written, as the baseline does, and learning MUST NOT write it. The field names are those of the catalogue (`data-model.md`). The as-is names of these events are `learning_observed`, `knob_adjusted`, `knob_auto_reverted` and `knob_evaluated`; they are the names of the compatibility projection only. The as-is event of a tampered file is in the catalogue under `integrity.events_changed` (F106-FR-037); it is an event of the run's stream as well and is not a learning event. The compatibility projection MUST write the as-is line of each event of the learning stream with the as-is fields (`run_id`, `reverts_run_id`, `evaluates_run_id` and the others of the baseline), with `ts` as the string of epoch seconds and no `time` field, to the place where the baseline writes it: the as-is event file of the feature for an event that the command `learn` recorded, and the as-is event file of the engine start for an event that a call of the engine recorded (the evaluation after an approved phase and its automatic revert, F106-FR-036). Both as-is places map to the learning stream in the layout table (annex X §X.8, old side).
  - origin: C-090; C-093; C-092
  - disposition: translated (C-090, C-093); ported (C-092)
  - test: PT-106-C-090-knob-events; PT-106-C-093-events-location; PT-106-C-092-event-reasons; CT-106-10
  - divergence: DV-007; DV-006

#### G2 - Commands and their exit codes

- **F106-FR-022**: The command `learn` MUST be a public command of the CLI with the exit codes of the baseline (annex G §G.1, F100-FR-171). It MUST take one mode and pass every further argument through to the operation. The mode is the first argument that the front door does not take as one of its own options (the working directory, the spec, the feature and the others of annex G §G.1), whatever its spelling, and the default mode is `--show`. The modes MUST be `--show`, `--apply`, `--revert <run id>`, `--off`, `--summarize` and `--evaluate`. The operations behind them (summarize, advise, apply, revert, off, resolve, observe, evaluate) MUST be internal calls that return a result record whose `exit_code` carries the as-is code (F100-FR-006); only `learn` MUST be a command, and the two that an engine calls (resolve, observe) MUST have no command. A mode that is not known MUST print `specstride learn: unknown option '<mode>' (expected --show|--apply|--revert <run-id>|--off|--summarize|--evaluate)` and exit 1; `--revert` without a run id MUST print `usage: specstride learn --revert <run-id>` on standard error and exit 1. An argument error inside an operation, including a missing subcommand of the module, MUST exit 2.
  - origin: C-108; C-109; C-111; C-087
  - disposition: ported (C-108, C-109, C-111); translated (C-087)
  - test: PT-106-C-108-dispatch; PT-106-C-109-modes; PT-106-C-111-usage-errors; PT-106-C-087-operations
  - divergence: DV-066

- **F106-FR-023**: `learn --show` (the default) MUST run the advice and then the read-only report of the last evaluations, and its exit code MUST be that of the advice; a failure of the report MUST be ignored. `--apply [--phase N ...]` MUST apply with the feature directory and the events and specs, passing further arguments. `--summarize` MUST print the summary as JSON on standard output and be read-only. `--evaluate` MUST run the evaluation as a dry run and write nothing. `--revert <run id>` and `--off` MUST run the operations of F106-FR-016 and F106-FR-017 on the feature. Advice MUST print one suggestion line per phase and write nothing unless an output is asked for, in which case it MUST write the rows as indented JSON.
  - origin: C-109; C-087; C-088; C-094
  - disposition: ported (C-109, C-094); translated (C-087, C-088)
  - test: PT-106-C-109-show-exit; PT-106-C-109-mode-passthrough; PT-106-C-088-advise-out
  - divergence: DV-066

- **F106-FR-024**: `learn` MUST select its inputs as the baseline does. It MUST read every run of the feature when the runs exist, and otherwise the single newest event stream. It MUST pass the spec, when the file exists, and the spec format from the saved settings of the run, so that samples are keyed on the current phase shape; a spec that cannot be read MUST print `learn: cannot read phase shapes from <specs>: <error>` on standard error and continue with no shape restriction. The paths of the decision log and of the learning events MUST derive from the feature; explicit paths win. A summary given as input MUST win over events given at the same time. The directory of verdicts MUST default to the verdicts of the feature when it exists. The default for the knobs handed in when none is given MUST be the value of the key that the alias `SPECSTRIDE_PROPOSER_TIMEOUT` (default 1800) or `SPECSTRIDE_YIELD_POLL` (default 30) stands for (annex X §X.8). The options MUST be spelled as at the baseline: `--events` (repeatable), `--summary`, `--out`, `--pretty`, `--specs`, `--spec-format`, `--phase-shape`, `--verification-dir`, `--verdicts-dir`, `--run-log`, `--live-regex` (default `runners/live`), `--feature-dir`, `--applied-file`, `--events-file`, `--knob`, `--phase`, `--default`, `--run-id`, `--force`, `--dry-run`, `--report`.
  - origin: C-115; C-088; C-110
  - disposition: ported (C-115); translated (C-088, C-110)
  - test: PT-106-C-115-input-selection; PT-106-C-088-flags; PT-106-C-110-default-injection
  - divergence: DV-027; DV-066; DV-006
  - assumption: the keys behind the two defaults are `roles.proposer.timeoutSec` and `loop.yield.pollSec`, both confirmed by feature 110 (annex X §X.8 gives the prefix `loop.yield.*`)

- **F106-FR-025**: The exit codes of `learn` MUST be as follows. 0: success (`summarize`; `advise` with at least one row printed, rows without a suggestion included; `off`; `observe`, also when a phase has no telemetry; `evaluate`, also with no active decisions). 1: `advise` with no telemetry (`learn: no telemetry for phase <N>` or `learn: no telemetry for any phase`, on standard error); wrong usage through `learn`. 2: no event file (`learn: no events.jsonl found under: <paths>`); neither events nor summary given to `advise` (`learn: one of --events or --summary is required`); a knob outside the allowlist; a missing input; no decision log derivable; a run id that is not an active `apply`; `evaluate` with neither events nor `--report` (`learn: --events is required (or --report)`). 3: `apply` refused for no telemetry or below a floor. 4: `apply` refused as quarantined. These are the codes of annex G §G.4 and of `consolidation.md` §3.7.
  - origin: C-091
  - disposition: ported
  - test: PT-106-C-091-exit-codes; PT-106-C-091-exit-2-messages
  - parity: not a switch

- **F106-FR-026**: The lines that `learn` prints MUST be those of the baseline, byte for byte under compatibility output, and MUST print no new line under the `parity` profile. That covers the notice about decisions that predate phase shapes (`learn: notice — <n> decision(s) for <knob>[<phase>] predate phase-shape keys and are not applied; re-derive with `specstride learn --apply` under the current spec`), the suggestion lines for the two knobs (each ending `[not applied — run `specstride learn --apply` to take effect]`), the applied line, the evaluation line (`learn: phase <N> <knob> <prev>s→<value>s [<run-id>]: <label>[ (baseline reset: shape|backend) | (<reason>)] — cost r=... (MDE ±..., n=a/b); wall ...; guardrails ok (<k> unknown below their minimum n) | guardrails: BREACH <names>[ [<action>]]`) and the digest line of `summarize --out` (`learn: <r> run(s), <a> attempt(s), <p> pass(es), $<cost>, kills=<dict> → <out>`). A message that names state MUST name it by logical name in default output, and be compared through the layout table under the `parity` profile.
  - origin: C-094; C-093; C-087
  - disposition: ported (C-094); translated (C-093, C-087)
  - test: PT-106-C-094-output-lines; PT-106-C-094-no-new-line
  - divergence: DV-066; DV-033
  - parity: no new line (row 19 of annex X §X.7)

#### G3 - Binding with the launch contract, mode selection, contract pin

- **F106-FR-027**: Derivation of a launch contract MUST bind the decision log into `configuration.learning` (annex G §G.8) when a decision log with a run id exists, and MUST omit the block when the file is absent or no line has a run id. The block MUST hold exactly `mode`, `decisions_through`, `decisions_sha256`, `effective` and `source_path`. `decisions_through` MUST be the run id of the last line of the log that has a text `run_id`, whatever the action of that line. `decisions_sha256` MUST be the content hash of the hasher (annex X §X.5: SHA-256 over the bytes as they are, written as 64 hexadecimal digits in lower case; not the canonical record hash) of the bytes of the log up to and including the first line whose `run_id` equals `decisions_through`, its line end included. `effective` MUST be a map from the knob to a map from the phase number, written as text, to the value: for each knob, phase and shape, the last line of the bound prefix that is an `apply`, a `revert` or an entry with no `action`, kept only where that line is not a `revert`; the value is the recorded one and is not clamped. `source_path` MUST name the decision log by its logical name, `feature:<slug>:learning:decisions` with the slug filled in, because the log lies in the control plane and not under the repository root; it MUST NOT be an absolute path, and a reader resolves it through the state layout (annex B §B.5). Under the `parity` profile the field is compared through the layout table, whose old side is the path of the as-is log relative to the repository root. The derivation MUST take the mode by an option `--learning-mode off|suggest|apply`, default `off`, and the path of the log by an option `--applied-file`, whose default MUST be the log of the feature only when exactly one feature is in scope. The block MUST be fields of the launch contract of feature 107 to write; this feature owns the rule.
  - origin: 011 FR-003; C-210; C-213
  - disposition: translated (011 FR-003, C-210); ported (C-213)
  - test: PT-106-011FR003-binding; PT-106-C-210-derivation-options; PT-106-C-213-through-rule
  - divergence: DV-006; DV-066
  - parity: `learning.mode` as the fixture sets it (row 43 of annex X §X.7); the hash is the hash of the bytes of the as-is log
  - assumption: that `source_path` holds the logical name is the reading of this specification (`research.md` D-12); the baseline writes a path relative to the repository root, which the new layout cannot give

- **F106-FR-028**: Validation of a launch contract MUST apply these rules of the binding, and refuse a violation with the code of annex G §G.4. The hash of the prefix of the decision log up to `decisions_through` MUST equal `decisions_sha256`; a difference MUST be refused as a stale source, with exit 23 and the reason `LearningDecisionsChanged`. A log that cannot be read, or that holds no line with the bound run id any more, MUST be refused in the same way. `configuration.learning` MUST hold exactly the five keys of F106-FR-027: a `mode` of the closed set, a `decisions_through` that is a non-empty text, a `decisions_sha256` of 64 hexadecimal digits in lower case, an `effective` of the form of F106-FR-027, and a `source_path` that is not an absolute path. Every stage of kind `specstride` MUST declare, in its action and in its action on resume, the same learning mode and the same bound of decisions as the block. Without a `configuration.learning` block, a stage MUST NOT declare a bound of decisions and MUST NOT declare the mode `apply`. Appending to the log after the binding MUST NOT change the hash of the bound prefix, and the append-only rule of F106-FR-007 MUST be what keeps it so. A violation of a rule of structure (the keys and their forms, the declarations of the stages, and the rules of F106-FR-029) MUST be an error of the class `learning` of the validation (annex X §X.6 row 274) and MUST end validation with exit 20. The two refusals with exit 23 MUST be checked only when no structural error exists, and only where validation compares the sources with their hashes.
  - origin: C-218
  - disposition: ported
  - test: PT-106-C-218-prefix-hash; PT-106-C-218-block-keys; PT-106-C-218-stage-env-consistency

- **F106-FR-029**: The environment that a stage declares for learning MUST follow these rules. A declared bound of decisions MUST be a literal, non-empty run id. A declared learning mode MUST be a literal in `off`, `suggest` or `apply`, and MUST NOT be taken from the environment of the shell. A declaration of the retired legacy variable of the old product name MUST NOT be carried: the check that refused it is not kept (register row DV-038).
  - origin: C-214
  - disposition: translated
  - test: PT-106-C-214-literal-declarations
  - divergence: DV-066; DV-038

- **F106-FR-030**: A supervised run MUST receive the learning mode from the launch contract and never from the shell. The mode and the bound of decisions MUST be removed from the environment of every child of the runtime root, of a stage and of a check of kind command-success, and a stage of kind `specstride` MUST then receive the mode `off` unless its action declares a value. The retired legacy variable MUST be removed as well, with no other effect. The pin of the launch contract is rank 1 of the order of configuration (the pin, F100-FR-167), and that rank applies to children of the runtime root only; this strip is how the rank is carried out for the learning mode, the bound of decisions and live output in a run without a terminal, and for no other key. The pipeline runtime executes it. At the baseline only the learning mode and the retired legacy variable are removed (B-2561); the removal of the bound of decisions comes with the pin (F100-FR-167) and cannot be observed, because a bound takes effect only under the mode `apply`, which a stage has to declare together with its own bound. Under the `parity` profile only the two as-is pins are honoured, the learning mode and live output (row 38 of annex X §X.7), and an inherited bound is left as the baseline leaves it.
  - origin: 011 FR-016; C-226; C-007
  - disposition: ported (011 FR-016); translated (C-226, C-007)
  - test: PT-106-011FR016-strip-and-force-off; PT-106-C-226-child-env; PT-106-C-007-alias
  - divergence: DV-026; DV-038; DV-027
  - parity: pins of the launch contract: the two as-is keys only, the learning mode and live output (row 38 of annex X §X.7)

- **F106-FR-031**: The doctor MUST report a learning mode, or a bound of decisions, that is set in the environment of the shell and differs from the value the launch contract pins, as a shadowed value, and MUST show the source of the value in force as `contract`. The report MUST hold no secret value.
  - test: CT-106-4
  - divergence: DV-026
  - assumption: the check is the configuration-precedence check of the doctor (annex G §G.7); the name of the check belongs to feature 112. The baselines have no doctor, so this requirement carries no as-is behaviour and has no parity test (feature 141, §O.1 rule 8); 011 FR-016 and C-226 are carried by F106-FR-030

- **F106-FR-032**: The learning mode of a supervised run MUST be selected from the request by a fixed rule, and the default MUST be `off`. The selection MUST be the verb `learning` of `supervise`, with the options `--request <text>` (default: empty) and `--token <token>` (repeatable), as at the baseline. An explicit token MUST win: `--learning-off`, `--learning-suggest`, `--learning-apply`, given or found as a flag in the request (a word of the request that starts with two hyphens, at the start of the text or after white space; the tokens given by option are tried first, and the first word that is one of the three tokens wins). Then a refusal phrase MUST give `off`. Then a phrase that says to use applied or learned values MUST give `apply`; `apply` MUST never be inferred from a vague wish. Then a phrase that asks to enable, or learn from runs, or record observations, MUST give `suggest`. The result MUST carry its source (`token`, `refusal`, `prose`, `default`) and the matched evidence. The phrases MUST be data of the product with the members of the baseline (refusal: no, without, disable, turn off or skip the learning, self-improvement or self-tuning, and learning off; apply: learning apply, apply the learned values, use the learned or applied values, with the applied or learned decisions; suggest: learning suggest, enable, turn on or with the learning, self-improving, self-tuning, learn from the runs, record observations), matched in lower case. The result MUST print `[MOL-LEARNING] mode=<mode> source=<source> evidence=<json text>`; for the mode `apply` it MUST also print a `[MOL-NEXT]` line that says to derive with `--learning-mode apply` and that, when no `configuration.learning` block results, there are no decisions to bind, so `suggest` is to be used and said. The verb MUST exit 0.
  - origin: 011 FR-018; C-255; C-254; C-246
  - disposition: ported (011 FR-018, C-255, C-254); translated (C-246)
  - test: PT-106-011FR018-selection; PT-106-C-255-token-refusal-apply-suggest; PT-106-C-254-learning-line; PT-106-C-246-learning-command
  - divergence: DV-033; DV-007; DV-066
  - assumption: the closed set of the verbs of `supervise` (annex X §X.6 row 111) names `retro` with owner 106 and does not name `learning`; this requirement proceeds on `learning` being a verb of that set with owner 106, as the baseline has it (B-2670; reported to feature 100)

- **F106-FR-033**: The consumer's comment MUST NOT widen the learning mode. The comment MAY select only among the modes that F106-FR-032 gives from the request and that validation of the launch contract accepts. A comment MUST NOT turn `off` into `apply`, MUST NOT add a decision, and MUST NOT change a bound; when the derivation is asked for the mode `apply` and no decision can be bound (no `configuration.learning` block results, F106-FR-027), the launch contract it writes MUST carry `suggest`, and the derivation MUST say so in a line that names the reason; it MUST never write `apply` without a block. Validation stays the backstop (F106-FR-028).
  - origin: 011 FR-018
  - disposition: ported
  - test: PT-106-011FR018-comment-no-widen; CT-106-5
  - assumption: decision 18 (the comment selects among options that validation accepts; F100-FR-174). At the baseline the host is told to use `suggest` and to say so (the `[MOL-NEXT]` line of F106-FR-032), and validation refuses `apply` without a block; that the derivation makes the change itself is the reading of this specification (Principle XIII; `research.md` D-13)

#### G4 - Retrospective

- **F106-FR-034**: After a run, the retrospective MUST be a read-only document, one per launch contract hash, at the logical name `pipeline:<pipelineId>:retrospective:<hash>` (annex B §B.5), written atomically. It MUST be produced by the verb `retro` of `supervise` (annex X §X.6 row 111, owner 106), which takes the pipeline by `--launcher <path>` or by `--run-dir <path>`, exactly one of the two. This feature builds the document and the lines; the command writes the file, as the writer that annex B §B.5 names for this logical name, through the atomic write of the kernel, and learning itself writes nothing outside its own writer domain (F106-FR-038). It MUST hold `schema`, `pipeline`, the launch contract hash, `generated_at` and `stages`. It MUST be written only there: a retrospective MUST write nothing outside the pipeline run. Because the pipeline run is reused across relaunches and re-derivations, each retrospective MUST be filed under the hash of its launch contract. Missing data MUST be reported as `unavailable` with a reason, and MUST NOT be fatal. The schema id MUST be `specstride.retrospective/1` (annex B §B.20, in place of the as-is `mol.retrospective/1`); the fields are listed in `data-model.md` and the schema file is `contracts/schemas/retrospective.schema.json`. The verb MUST exit 0 whatever it finds.
  - origin: 011 FR-024; C-253; C-246
  - disposition: translated
  - test: PT-106-011FR024-retro-file; PT-106-C-253-retro-path; PT-106-C-246-retro-exit
  - divergence: DV-006; DV-066
  - assumption: CQ-114 (the recommended answer is applied in annex B §B.20: `specstride.retrospective/1`, owner 106; closed on 2026-09-30, the applied answer is confirmed)

- **F106-FR-035**: The retrospective MUST cover each stage of kind `specstride` of the launch contract. For each it MUST locate the feature from the first of: the reason record of recovery, the first evidence path, or a postcondition path that names a feature directory of the state layout. It MUST run `learn --summarize` and `learn --evaluate` for that feature, after probing that each is offered with `--help`, with a time limit of 120 seconds and with the learning variables removed from the environment (F106-FR-030). Any failure MUST give the status `unavailable` with a reason. It MUST derive its suggestions from the lines of the evaluation that match `[<id>]: regressed`, sorted and each once, and MUST print each only as `[MOL-NEXT] suggestion (not run): <argv0> learn -w <workdir> --feature <slug> --revert <id>`; it MUST NOT apply or revert anything. It MUST print `[MOL-RETRO] pipeline=<id> stage=<id> status=<ok|unavailable> detail=<json> path=<file>` per stage, each evaluation line as `[MOL-RETRO]   <line>`, and `[MOL-RETRO] status=unavailable reason="the contract behind the launcher cannot be read"` or `... reason="no specstride stage"` when it cannot start or finds no stage; the lines follow the grammar of annex G §G.3, and under the `parity` profile they MUST be the as-is lines.
  - origin: 011 FR-024; C-249; C-255; C-246
  - disposition: translated (011 FR-024, C-249, C-246); ported (C-255)
  - test: PT-106-011FR024-retro-stages; PT-106-C-249-retro-lines; PT-106-C-255-retro-suggestion; PT-106-C-246-retro-command
  - divergence: DV-007; DV-033; DV-066
  - parity: as-is lines under compatibility output (row 18 of annex X §X.7)

#### G5 - The layer inside a run

- **F106-FR-036**: When the mode is not `off`, the engine MUST, after each approved phase, write the observation of that phase (F106-FR-006), record `learning.observed` when it was written, and then run the evaluation of the active decisions of that phase only, under the current shape of the phase and not as a dry run, with its events going to the learning stream (F106-FR-021), and MUST at exit print each line of the last recorded evaluations, to standard output and to the engine log, when a decision log exists. A failure of the observation or of the evaluation MUST be logged as `#   (learning: … failed — continuing; the run is unaffected)` and MUST NEVER undo the approval or change the result of the run. The record of the pass limit that the run writes MUST carry the source, the arm and whether the tamper bracket was on, so that F106-FR-019 can assign the run to an arm. The lines that the observation, the evaluation and an automatic revert print in a run, and the notice of F106-FR-010, MUST go to the engine log and not to standard output; only the lines at exit go to both. The calls are those of the function interface of F100-FR-235 (`resolve`, `observe`, `evaluate`); the read-only report of the last evaluations that the exit lines need, and the two calls of the bracket of F106-FR-037, are offered by this feature in the same way.
  - origin: C-011; C-013; C-007; C-008
  - disposition: translated (C-011, C-007, C-008); ported (C-013)
  - test: PT-106-C-011-observe; PT-106-C-013-evaluate-at-phase-done; PT-106-C-013-exit-summary; PT-106-C-007-layer-on
  - divergence: DV-006; DV-007; DV-027
  - assumption: F100-FR-235 names three calls; the report for the exit lines and the bracket are not among them (reported to feature 100)

- **F106-FR-037**: When the mode is not `off`, the engine MUST record, before each pass, the size and the hash of the leading bytes of the event stream, of the decision log and of the observation file, and MUST check after the pass that those leading bytes are unchanged; appends are allowed. A shrunk file or changed leading bytes MUST give one event, catalogue type `integrity.events_changed` with the as-is name `events_tampered` in the compatibility projection, with the phase, the attempt and the file, and the line `!!! learning: <file> lost or rewrote bytes that predate this pass — run excluded from every evaluation`. A run so marked MUST be excluded from every baseline and every evaluation.
  - origin: C-013; C-008; C-012; C-090
  - disposition: ported (C-013, C-012); translated (C-008, C-090)
  - test: PT-106-C-013-tamper-bracket; PT-106-C-012-tamper-line; PT-106-C-008-events-tampered; PT-106-C-090-tampered-run
  - divergence: DV-007
  - assumption: CQ-115 (the recommended answer, which annex B F100-FR-228 applies: the engine executes the bracket at the call points of learning and the rule belongs to this feature; closed on 2026-09-30, the recommended answer stands). F100-FR-228 words the check as one around a reading by learning; the rule of this requirement is the baseline's, a bracket around each proposer pass (reported to feature 100)

- **F106-FR-038**: Learning MUST have its own writer domain, its own lock and its own event file, so that the event file of a run keeps one writer at any moment (annex A F100-FR-005, LR-5). The domain MUST cover the decision log, the learning events, the observations and the summary (annex B §B.5), and its lock MUST be at the logical name `feature:<slug>:learning:lock` (annex B §B.5). The `learn` command MUST NEVER write to the event file of a run, to run state, or to a file of another writer, also while a run is alive. The rule MUST be tested under contention in Wave 1: a run and a `learn` command that both write, with no lost line, no torn line and no line in the wrong file. The lock MUST be held from the read that decides an entry to the append of that entry, so that two commands cannot act on the same top decision; a contender waits and this adds no exit code. `state export` MUST include the decision log (F100-FR-075).
  - lr: LR-5
  - test: CT-106-6; CT-106-7
  - assumption: settled — annex B §B.5 now holds `feature:<slug>:learning:lock`; the lock provider is the one of annex F

- **F106-FR-039**: The layer MUST be inert. Events of a loop layer that run inside a phase attempt (inner events of the micro-loop layer, and of parallel units) MUST change no learning observation: no count of passes, attempts, kills, rejects or samples that learning reads MUST change because of them. A run with the mode `suggest` MUST have the same event stream, verdicts, counts and exit code as the run with `off`, apart from: the learning stream and the learning files; the events `learning.observed` and `integrity.events_changed` in the event stream of the run; the field of the record of the pass limit that says the tamper bracket was on (F106-FR-036); and the lines that learning prints.
  - test: CT-106-8; CT-106-9
  - assumption: IR-06 (inner events change no outer counter); `loop.strategy` is row 1 of annex X §X.7

- **F106-FR-040**: Text that comes from outside the runtime and that learning writes — the free-text `reason` of a learning event, the free-text members of a decision entry, and every evaluation line the retrospective copies — MUST pass the one ingress (the redaction point of annex A F100-FR-009, F100-FR-205, LR-9) before it is written to the learning stream or to any file of the learning writer domain. The learning stream is one sink of F100-FR-205: it receives only the redacted form, and the ingress fails closed as F100-FR-205 requires. No text of a decision entry, of an event or of a retrospective line is written that has not passed it.
  - test: CT-106-10
  - status: unverified (check: a planted secret in a decision entry never appears in the learning stream or in a retrospective line; verified-on: —; pin: —)

### Key Entities

- **Knob**: one of the two adjustable settings, `proposer_timeout` and `yield_poll_interval`, with its hard bounds and its step cap.
- **Learning mode**: `off`, `suggest` or `apply`; a key that the launch contract can pin.
- **Metric summary**: numbers computed from the events of past runs, per run, attempt, pass and phase.
- **Observation**: the summary of one approved phase, overwritten whole.
- **Decision**: one entry of the decision log with the action `apply`, `revert` or `evaluate`; `apply` and `revert` move a value, `evaluate` never does.
- **Decision log**: the append-only file of decisions, in the byte format of F106-FR-007; the input of the binding.
- **Baseline**: the samples, the harness label and the guardrail counts recorded with an `apply`, against which it is evaluated.
- **Quarantine**: the refusal of a value near one that an automatic revert removed, until new samples exist.
- **Binding**: the block `configuration.learning` of the launch contract: mode, the run id the decisions are bound through, the hash of that prefix of the log, the effective values and the source.
- **Retrospective**: the read-only document per launch contract hash that says what learning reports for each stage.
- **Learning writer domain**: the files of learning and their one lock, with one writer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F106-SC-001**: Bounded. Over every scenario of FX-29 and 10,000 generated summaries and decision logs, the number of applied decisions with a knob outside the allowlist, a value outside the hard bounds, or a step above 50 per cent is 0, proved by a test on every build.
- **F106-SC-002**: The launch contract says what runs. In 100 per cent of the scenarios of FX-35 in which a learning mode is exported in the shell (`106-learning-exported`, run as `@engine-stub` and as `@full-stack`), the mode in the environment of every stage equals the launch contract's, or `off` where none is declared; and in 100 per cent of seeded mismatches the doctor reports the shadowed value.
- **F106-SC-003**: Parity of the command. 100 per cent of the scenarios of FX-29 (`show`, `advise-no-telemetry`, `apply`, `revert`, `off`, `evaluate`, `below-sample-floor`, `quarantined`, `106-apply-forced`) give `equal` or `waived` on `exit`, `stdout`, `stderr`, `state` and `events`, and the bytes of every decision-log line equal the reference's.
- **F106-SC-004**: Reversible. After `off` in 100 per cent of the fixtures of FX-29, the value in effect for every knob, phase and shape is the default, and the bytes of every earlier log line are unchanged.
- **F106-SC-005**: The binding holds. On 100 per cent of the inputs of FX-33 the hash of the bound prefix equals the reference's, and in 100 per cent of 1,000 seeded one-byte changes inside the bound prefix the launch contract is refused with exit 23, while an append after it is not refused.
- **F106-SC-006**: Selection is deterministic and cannot widen. 100 per cent of the token, refusal and prose scenarios of FX-36 give `equal`, and over 1,000 generated comments the number that yield `apply` without an explicit token or an apply phrase is 0.
- **F106-SC-007**: The layer is inert. Over every fixture, a run with `suggest` differs from the run with `off` in 0 events, verdicts, counts and exit codes outside what F106-FR-039 lists.
- **F106-SC-008**: Read sites are locked. The number of places that read a learned value outside the two permitted sites is 0 on every build, and the test fails when a third is added.
- **F106-SC-009**: One writer. In 1,000 rounds in which a run and a `learn` command write at once, 0 lines are lost or torn and 0 lines are in a file of another writer.
- **F106-SC-010**: The retrospective is read-only. In 100 per cent of the scenarios of FX-36 (`retro`) the files written outside the retrospective are 0 and the suggestions run are 0.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 (ruling 18) |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Learning and memory are never mixed: learning tunes allowlisted knobs from past runs; memory is context carried forward and is not specified in Wave 1 | Ruling 17; glossary term 28 |
| The allowlist stays at two knobs | R12 part 3; ruling 17 |
| The launch contract beats the shell for the learning mode: rank 1 of the order of configuration (the pin, F100-FR-167), which applies to children of the runtime root only | Ruling 10; DV-026 |
| The byte format of the decision log is kept, because the binding hashes its bytes | Brief 106, merge rule |
| `learn` is a public verb | Ruling 26 |

## Extension points

This feature implements no extension point and consumes none. It is reached through the command
`learn`, the engine's calls at the phase and pass boundaries, and the derivation and validation of
the launch contract; it registers nothing.

| EP | Id and version | Relation | What for |
|---|---|---|---|
| — | — | none | — |

## Contracts of feature 100 used

| Contract | Version | Where |
|---|---|---|
| Launch-contract schema, block `configuration.learning`; exit codes 20 and 23 | `specstride.launch-contract/1` | Annex G §G.8, F100-FR-190; §G.4 |
| Config envelope and ranks (rank 1 pin, rank 7 learned value); the alias table | `specstride.config/1` | Annex X §X.2, F100-FR-201, F100-FR-203; §X.8 |
| Event envelope (input of the metrics; the learning stream) | `specstride.event/1` | Annex X §X.1, F100-FR-198, F100-FR-199 |
| Stop reasons (the four arbitration signals) | `specstride.stop-reason/1` | Annex E §E.3, F100-FR-148 |
| State layout: the learning writer domain and its logical names | `specstride.layout/1` | Annex B §B.5, F100-FR-051, F100-FR-053 |
| One writer of an event file; learning has its own domain | — | Annex A, F100-FR-005 |
| Pinned keys are stripped from children | — | Annex F §F.7, F100-FR-167 |
| The public verbs and the exit codes of `learn` | — | Annex G §G.1, §G.4, F100-FR-171 |
| Line grammar; output modes; the lines `MOL-LEARNING`, `MOL-RETRO`, `MOL-NEXT` | — | Annex G §G.2, §G.3, F100-FR-175, F100-FR-176, F100-FR-178 |
| The parity profile; closed sets | `specstride.profile/1` | Annex X §X.6 (rows 77, 187 to 196), §X.7 (rows 18, 19, 38, 43), F100-FR-208, F100-FR-210, F100-FR-212 |
| The event catalogue: the three types of the learning stream, `learning.observed` and `integrity.events_changed` of the run's stream | `specstride.event/1` | Annex X §X.6 row 73 |
| The calls of the engine into learning (`resolve`, `observe`, `evaluate`) | — | Annex A §A.4, F100-FR-235 |
| The check of files that learning reads while a run writes them (the tamper bracket) | — | Annex B §B.2, F100-FR-228 |
| The process primitive of the kernel (the child processes of the retrospective) | — | Annex A, F100-FR-234 |
| Canonical hasher: the content hash (the hash of the bound prefix) | — | Annex X §X.5, F100-FR-207 |
| The one ingress and the redactor | — | Annex A, F100-FR-009; annex X §X.4, F100-FR-205 |
| Further schema ids; delivery of the schema file of the retrospective | `specstride.retrospective/1` | Annex B §B.20, F100-FR-227 |
| The archive of `state export` | `specstride.state-archive/1` | Annex B, F100-FR-075 |
| Verbs of `supervise` (`retro`, owner 106; `learning` is reported as missing) | — | Annex X §X.6 row 111 |
| Error classes of the validation of a launch contract (the class `learning`) | — | Annex X §X.6 row 274 |
| Canonical spec model (the phase shape) | `specstride.spec-format/1` | Annex C §C.7 |
| Process boundaries and result records | — | Annex A, F100-FR-006 |
| Normalization rules N-01, N-02, N-12 to N-15, N-20, N-28; component name `learning` | `specstride.oracle-normalization/1` | Annex X §X.8 |

Fixture families of feature 141 cited: FX-01, FX-29, FX-33, FX-35, FX-36 (§O.2). The scenarios of
the catalogue that the tests of this feature run: FX-29 `show`, `advise-no-telemetry`, `apply`,
`revert`, `off`, `evaluate`, `below-sample-floor`, `quarantined`; FX-33 `valid`, `invalid-learning`,
`learning-decisions-changed`; FX-36 `learning-selection`, `retro`.

Scenarios added by this feature inside the scope of a family (feature 141, §O.1 rule 4). Each
carries the number of the feature in its name until the catalogue holds it. They are needed because
FX-29 drives the learning module and the command `learn` with no stub: it executes nothing of what
learning does inside a run, and a test may claim a behaviour item only if its fixture executed the
evidence line of that item on the reference (§O.1 rule 6).

| Family | Scenario | Stubs and verbs | What it executes | Task of the tests |
|---|---|---|---|---|
| FX-01 | `106-learning-suggest` | P `evidence`; CH `approve` | A run with the learning mode `suggest` and a decision log in the template: the observation after each approved phase, `learning.observed`, the evaluation of the decisions of the phase, the lines at exit, the bracket taken and found intact, the record of the pass limit with the bracket on (B-0079, B-0104, B-0186, B-0305, B-0317, B-0325) | T069, T070 |
| FX-01 | `106-learning-apply` | P `evidence`; CH `approve` | A run with the mode `apply`, a decision log with two applies for phase 1, and a bound of decisions that names the first: the learned pass limit, the source `learned`, the arm `applied`, the clamp at read time, the bound (B-0077, B-0303, B-1174, B-1204, B-1205, B-1307, B-1325) | T029, T030 |
| FX-01 | `106-learning-tampered` | P `write` on a file of the state tree | A pass during which the leading bytes of the decision log change: `integrity.events_changed`, the line of F106-FR-037, the run left out of every evaluation (B-0097, B-0214, B-1223). Asked of feature 141 (§O.1 rule 5): the proposer stub writes inside the working directory, and the state tree of the port lies outside it, so the scenario needs a way to change a state file by its logical name on both sides. Until feature 141 answers, the tests of T071 that need it are reported as a skip with this reason | T071 |
| FX-35 | `106-learning-exported` | E `succeed`; as `@engine-stub` and as `@full-stack` | A pipeline started with `SPECSTRIDE_LEARNING=apply` exported, with one stage of kind `specstride` that declares no mode and one check of kind command-success: the stage runs as `off` (B-2561, 011 FR-016). The transcript holds the names of environment variables and never their values, so the mode is read from what the engine does under `@full-stack`: no learning event, the bracket off | T045 |
| FX-29 | `106-apply-forced` | none | `learn --apply --force` over a quarantined value: the entry with `force` and `forced_over` (B-1187) | T055 |

## Rows of the `parity` profile

| Switch | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Learning mode | `learning.mode` | `off` | As the fixture sets it | 43 (exists) | DV-026 |
| Pins of the launch contract | — | The pinnable keys | The two as-is keys only | 38 (owner 123) | DV-026 |
| Output mode | `output.compat` | default output | compatibility output | 18 (owners 119, 123) | DV-033 |

This feature introduces one further key, `learning.through` (the bound of decisions, alias of
`SPECSTRIDE_LEARNING_THROUGH`). Only the launch contract sets it: a stage declares it, and no fixture
sets it in another way. It needs no row: under `parity` its value is the one the stage declares, as
at the baseline, and it is not honoured as a pin there (row 38: only the learning mode and live
output are). No other option is introduced.

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Learning modes (row 77 of annex X §X.6) | `off`, `suggest`, `apply` | 106 | Design | `off` |
| Adjustable knobs (row 187) | `proposer_timeout`, `yield_poll_interval` | 106 | Owner decision (ruling 17) | Refused, exit 2 |
| Actions of a decision entry (row 188) | `apply`, `revert`, `evaluate` | 106 | Design | The entry is not a decision (it moves no value); an entry with no action is a decision |
| Arms (row 189) | `applied`, `baseline` | 106 | Design | `baseline` |
| Labels of an evaluation (row 190) | `helped`, `neutral`, `regressed`, `insufficient` | 106 | Design | `insufficient` |
| Actions taken by an evaluation (row 191) | `evaluated`, `auto_reverted`, `skipped_superseded` | 106 | Design | `evaluated` |
| Causes of a baseline reset (row 192) | `shape`, `backend` | 106 | Design | The label is `insufficient` |
| Guardrails and their states (row 193) | `grounding_gap_rate`, `malformed_rate`, `verification`, `diagnostician_grounding_share`, `critic_input_size`, `arbitration_proxy`, `first_attempt_approval`; `ok`, `breach`, `unknown` | 106 | Design | `unknown` |
| Counterfactuals of the proposer timeout (row 194) | `censored`, `shorter_cap_wall_only`, `none` | 106 | Design | `none` |
| Kill classes (annex X §X.6 row 280) | budget (`hard_cap`), futility (`repeat_stall`, `progress_stall`), hang (`idle_timeout`) | 106 | Design | unknown, and counted as neither budget nor futility |
| Pass outcomes (row 195) | `budget_kill`, `worker_error`, `open`, `productive`, `clean_no_progress` | 106 | Design | `clean_no_progress` |
| Sources of a selected mode (annex X §X.6 row 281) | `token`, `refusal`, `prose`, `default` | 106 | Design | `default` |
| Statuses of a retrospective stage (row 196) | `ok`, `unavailable` | 106 | Design | `unavailable` |

The rows are those of annex X §X.6. Two sets have no row there: the kill classes and the sources of
a selected mode (reported to feature 100).

## As-is behaviour not carried

| As-is id | Behaviour (short) | Disposition | Register row |
|---|---|---|---|
| B-2493 | The legacy variable of the old product name may not be declared beside the learning variable in a stage's environment | superseded-by DV-038 | DV-038 |
| Part of 011 FR-016 | The legacy variable of the old product name is stripped with a warning about old spellings | Not carried, but its stripping stays without effect | DV-038 (decision 3) |
| Lisa `@lisa/memory` | The memory package with no requirement and no caller in a run | Nothing is taken | Ruling 17; glossary term 28 |
| The third knob of the design | A hint about the yield artifact schema as an adjustable knob | Removed at the baseline; not carried | none (already absent at the baseline) |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Do learning and memory share anything? → A: No. Learning tunes two knobs from numbers; memory is context carried forward and is not specified. Lisa's memory package is not taken. (Source: ruling 17; glossary term 28; R12 F7)
- Q: What is the default learning mode and what does each mode do? → A: `off` by default (row 43 of annex X §X.7). `suggest` observes and evaluates and applies nothing; `apply` lets a recorded decision take effect. The design document called `suggest` the default; the baseline and the profile say `off`, and the profile stands. (Source: annex X §X.7 row 43; R16 F5.8; `orchestrator.sh:1661`, `:1819` at `9cab15d`)
- Q: Where does a learned value rank among the layers of configuration? → A: Rank 7, below the user configuration and above the default, with the baseline's exception: a learned pass ceiling ranks under a per-phase setting and above the timeouts declared in the verification commands and above every setting that is not per phase. (Source: annex X §X.2, F100-FR-201; DV-025; R16 F5.6)
- Q: Where does learning write its events, given that the baseline appended them to the feature's event file? → A: To its own stream at `feature:<slug>:learning:events`, so that a run's event file keeps one writer; the compatibility projection writes the as-is lines. (Source: LR-5; F100-FR-005; R15v C-7; B-1260)
- Q: Is the byte format of the decision log kept or replaced by a typed record? → A: Kept, because the binding hashes the bytes of the log. (Source: brief 106 merge rule; R19 011 FR-003 row; B-2515)
- Q: Which stop reasons does learning read? → A: The four of B-1313 as arbitration signals; no other and no new reason. (Source: `consolidation.md` §4.2; annex E §E.3)
- Q: What does the consumer's comment do to the learning mode? → A: It selects among options that validation accepts and cannot widen. (Source: decision 18; F100-FR-174)
- Q: Which requirements of the as-is specification of mixture-of-loops that mention learning are not here? → A: 011 FR-021 (the relaunch classifier, which refuses when bound decisions changed) belongs to the pipeline runtime and supervisor; here the rule is only that the bound prefix stays hash-stable (F106-FR-028). (Source: `traceability-frs.tsv`; R12 recommendation 3)

### Session 2026-09-29 (speckit-clarify)

- Q: Does the pin of the launch contract apply to a manual `specstride run` on the shell? → A: No. It applies to children of the runtime root only; a manual run reads the mode from configuration (the flag, then the environment alias, and so on), as at the baseline. (Source: R16 F5.8; annex X §X.2 rank 1)
- Q: What does `suggest` do at run time? → A: It turns the layer on for observation, the tamper bracket and evaluation, and lets no learned value take effect. (Source: B-0079; B-1204)
- Q: Who reads a learned value, and how many places may? → A: Two read sites: the assembly of a pass's time limit and the poll interval of a detached job; a test locks them. (Source: R12 recommendation 3; B-0303; B-1174)
- Q: What if two `learn` commands write at once? → A: The lock of the learning writer domain is held from the deciding read to the append; a contender waits; no new exit code. (Source: F100-FR-005; F100-FR-051; the baseline has no lock)
- Q: Is a phase edited after a decision still governed by it? → A: No; the phase shape changes and the decision resolves to the default; an evaluation reports `reset=shape`. (Source: B-1302; B-1250)
- Q: Does the retrospective read the decision log directly? → A: No; it runs `learn` for each stage, as the baseline does, so that it reads only what the command reports. (Source: B-2783)
- Q: Are floors and bands options? → A: No. They are constants; the only option is the mode and its bound. (Source: brief 106 heading 4; F100-FR-212)
- Q: Under the mode `apply` with no decision bound in the launch contract, what does a stage get? → A: The mode it declares; without a bound the block is absent and validation refuses `apply` (F106-FR-028). (Source: B-2517)

### Session 2026-09-30 (second analyze run)

Questions of the second run of `speckit-analyze`, answered from the baseline code and from feature 100. No question was put to a person.

- Q: In which stream is the event of an observation? → A: In the event stream of the run, written by the engine after the observation was written. The learning stream holds three types. (Source: `orchestrator.sh:2106-2108` at `9cab15d`; annex X §X.6 row 73, where the catalogue files `learning.observed` beside the integrity events; B-0104)
- Q: Which decisions does the engine evaluate after an approved phase? → A: Only the active decisions of that phase, under the current shape of the phase, and not as a dry run. The command `learn --evaluate` covers every active decision as a dry run. (Source: `orchestrator.sh:2123-2124`; B-0325, B-1203)
- Q: Which commands carry the selection of the mode and the retrospective? → A: The verbs `learning` and `retro` of `supervise`, with the options of the baseline. (Source: `supervise.py:73`, `:162`, `:227-231` at `9c88f86`; B-2670, B-2678; annex X §X.6 row 111)
- Q: Which value does a run use when the latest decision of a key is a revert? → A: The default handed in: the engine takes a learned value only with the arm `applied`. `advise` and `apply` still read the replayed value, which is the value the revert recorded. (Source: `orchestrator.sh:1666`; `learn.py:1016-1030`, `:1148`, `:1166`, `:2027`; B-0303, B-1300)
- Q: Which hash binds the decision log, and what is `effective`? → A: SHA-256 over the bytes of the prefix, as 64 hexadecimal digits in lower case; `effective` maps the knob to a map from the phase, as text, to the value of the applies still active. (Source: `bootstrap_contract.py:380-405`, `contract_lib.py:426-462`, `:511-524` at `9c88f86`; B-2515, B-2516)
- Q: Does the runtime remove the bound of decisions from a child's environment? → A: At the baseline it removes the mode and the legacy variable only. The pin of feature 100 adds the bound outside the `parity` profile; under the profile the two as-is pins are the learning mode and live output. (Source: `runtime.py:115-125` at `9c88f86`; B-2561; F100-FR-167; row 38 of annex X §X.7)
- Q: Is a run with the mode `suggest` identical to a run with `off` in the events of the run? → A: No. It has `learning.observed`, the mark that the bracket was on in the record of the pass limit, and `integrity.events_changed` where a file changed. F106-FR-039 lists the differences. (Source: `orchestrator.sh:1819-1823`, `:1866-1867`, `:2108`)
- Q: Who writes the file of the retrospective? → A: The command, as the writer that annex B §B.5 names (the CLI); learning builds the document and writes nothing outside its own writer domain. (Source: annex B §B.5; F106-FR-038)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. The divergence register runs to DV-119 (2026-09-30); this specification cites rows up to DV-105.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection, the layout table and the normalization contract exist when the fixtures that compare them run.
- The constants of the baseline (floors, bands, minimum detectable effect, bounds) are carried unchanged; the two guardrails that the baseline lacks an event for stay out.

Readings that the sources do not settle. Each is marked in its requirement and reported. The three queue rows were closed on 2026-09-30 by the owner's instruction to go with the recommended answers (`docs/ecosystem/CLARIFY-QUEUE.md`).

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-113 | What do unknown values of the learning mode do? | Read as `off`, as annex X §X.6 row 77 says; the baseline turned the layer on without applying. Closed 2026-09-30 | F106-FR-009 |
| CQ-114 | What is the schema id of the retrospective, and its logical name's field list? | `specstride.retrospective/1`; settled — annex B §B.20 holds the row with owner 106. Closed 2026-09-30 | F106-FR-034 |
| CQ-115 | Which feature performs the tamper bracket, and where is it specified? | The engine executes it at the call points of learning; the rule and its thresholds are here (annex B F100-FR-228). Closed 2026-09-30 | F106-FR-037 |
| — | Event types of the learning stream (was the placeholder `CQ-pending-4`) | Settled: the event catalogue holds four types with the prefix `learning.` (annex X §X.6 row 73; catalogue rows 96 to 99). Three are of the learning stream; `learning.observed` and the as-is tamper event, `integrity.events_changed`, are events of the run's stream (second analyze run). No question stays open | F106-FR-021 |
| — | What does `source_path` of the binding hold, now that the log lies outside the repository? | The logical name of the log; a reader resolves it through the state layout (`research.md` D-12) | F106-FR-027 |
| — | Who turns a request for `apply` into `suggest` when no decision can be bound? | The derivation, in the launch contract it writes, with a line that says why; validation stays the backstop (`research.md` D-13) | F106-FR-033 |
| — | Is `learning` a verb of `supervise`? | Yes, with owner 106, as the baseline has it; annex X §X.6 row 111 does not name it yet (reported) | F106-FR-032 |
| — | Where does the projection write the as-is line of a learning event? | To the as-is event file of the feature for the command, and to the as-is event file of the engine start for a call of the engine, as the baseline does (`research.md` D-14) | F106-FR-021 |

## Repairs after the cross-feature review

Dated 2026-09-30 (act B-8.6c). Requirement ids are never renumbered; new ids are appended.

| Item | Requirement | What changed |
|---|---|---|
| W-106-02, W-X-13 | F106-FR-021 | The events are named by the catalogue of annex X §X.6 row 73 (`learning.observed`, `learning.knob_adjusted`, `learning.knob_auto_reverted`, `learning.knob_evaluated`); the as-is names are the projection; four types, not five; the placeholder `CQ-pending-4` is replaced |
| W-106-02 (carried) | F106-FR-037 | The tamper event is named by its catalogue type `integrity.events_changed`, with `events_tampered` as the projection |
| W-106-03 | F106-FR-030; Constraints | The launch contract's precedence is rank 1 of the order of configuration (the pin), not "an exception"; it applies to children of the runtime root only |
| W-100-14 | F106-FR-019, F106-FR-036 | "pass cap" is written "pass limit" |
| W-X-23 | F106-FR-040 (new) | Text from outside the runtime passes the one ingress (F100-FR-205) before it is written |
| W-X-25 | F106-FR-038 | The lock is named by its logical name `feature:<slug>:learning:lock` (annex B §B.5) |
| W-X-26 | F106-FR-034 | The schema id `specstride.retrospective/1` is stated as settled (annex B §B.20); "proposed" removed |
| B-8.7 | F106-FR-021 | The path to the catalogue file of feature 111 removed (annex X §X.6 row 73 is the contract cited); the fields are the catalogue's camel-case names (`runId`, `revertsRunId`, `evaluatesRunId`, ...), and the as-is snake-case names are written only by the compatibility projection; `data-model.md` follows |
| B-8.7 | F106-FR-034 | The schema file uses the baseline's field names (`contract_digest`, `generated_at`, and the stage fields of the baseline), which the spec and the data model name; it had `launchContractSha256` and `generatedAt` |
| B-8.7 | F106-FR-034, F106-FR-037 | CQ-114 and CQ-115 are cited as assumptions whose recommended answers feature 100 applies, not as closed: both queue rows stay open for the owner's round |
| B-8.7 | F106-FR-021, F106-FR-040 | The test of the ingress is a characterization test, CT-106-10, not a parity test: the requirement carries no as-is behaviour |

## Repairs after the analyze run of 2026-09-30

Dated 2026-09-30, second analyze run, after the cross-feature review, the constitution patch v3.0.1
and the closure of the clarification round. Requirements changed in place; none added, none
renumbered. The feature keeps 40 functional requirements and 10 success criteria. One test name
left: the parity test of the doctor's report, `doctor-shadow` of 011 FR-016 (the baselines have no doctor). The findings and their ids are
in `analyze-report.md`, "Second analyze run".

| Requirement or section | Finding | What changed |
|---|---|---|
| F106-FR-021, F106-FR-006, F106-FR-036 | I1 | The learning stream holds three event types. `learning.observed` is an event of the run's stream, recorded by the engine after the observation was written, as the baseline does. The two as-is places of the projected lines are named |
| F106-FR-036, user story 4 | I2 | After an approved phase the engine evaluates the active decisions of that phase only, under the current shape, not as a dry run |
| Fixture families; user stories 2 to 4; F106-SC-002, F106-SC-003 | C1, I7 | Five scenarios added by this feature (FX-01, FX-35, FX-29), because FX-29 executes nothing of a run; the scenarios each story cites are named; the quarantine moved from user story 2 to user story 4 |
| F106-FR-032, F106-FR-034, F106-FR-035 | U1, I4 | The verbs `learning` and `retro` of `supervise` with their options; the command writes the file of the retrospective (annex B §B.5), learning builds it; suggestions sorted and each once |
| F106-FR-039, F106-SC-007, user story 6 | I3 | The differences between a run with `suggest` and a run with `off` are listed: two event types of the run's stream and one field of the record of the pass limit, beside the learning stream, files and lines |
| F106-FR-009, F106-FR-034, F106-FR-037; Assumptions | I5, L6, L9 | CQ-113, CQ-114 and CQ-115 are closed (2026-09-30); the register count; the bracket of F106-FR-037 is around a proposer pass, which F100-FR-228 words differently (reported) |
| F106-FR-030; "Rows of the `parity` profile" | I8 | At the baseline only the mode and the legacy variable are removed; the bound comes with the pin outside `parity`; the two as-is pins are named |
| F106-FR-031 | I10 | No as-is origin and no parity test: the baselines have no doctor. CT-106-4 stays |
| F106-FR-008 | U2 | The order of the members of an `evaluate` entry (result first, then `schema`, `action`, `run_id`, `evaluated_at`); the members of the guardrail counts are in `data-model.md` |
| F106-FR-027, F106-FR-028 | U3, U4 | The hash is the content hash (SHA-256, 64 hexadecimal digits); the form of `effective`; a lost bound id is refused with 23; the forms of the five keys; structural errors end with exit 20 and the class `learning`; `source_path` holds the logical name |
| F106-FR-033 | U5 | The derivation writes `suggest` where `apply` was asked and nothing can be bound, and says why |
| F106-FR-011; Edge Cases | U6 | The replayed value and the value in force at run time differ when the latest decision is a revert; a phase without a known shape runs on the default |
| F106-FR-018, F106-FR-019 | U7 | The signature of an evaluation holds the guardrail records; a rate guardrail is `unknown` without a baseline trial; the condition of the reset `backend`; the definitions are in `data-model.md` |
| F106-FR-022 | A1 | The mode is the first argument that the front door does not take itself |
| F106-FR-006, F106-FR-036 | L1 | The lines of an observation, of an evaluation and of an automatic revert go to the engine log in a run; `observe` has no command |
| F106-FR-001, F106-FR-020 | L2 | The literal of the allowlist members; the literal of the quarantine detail; the order of the two lines of `advise` |
| F106-FR-004 | L3 | The end of a phase and the archiving of a phase attempt are among the events read (B-1221) |
| F106-FR-032 | L4 | The phrase "with the learning" is a member of the suggest phrases, as the contract file says |
| "Closed sets"; "Contracts of feature 100 used" | L5 | Rows 187 to 196 of annex X §X.6 are cited; two sets without a row are reported; ten contracts added to the table |
