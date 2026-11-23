# Tasks: Learning

**Input**: Design documents from `specs/106-learning/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. Parity tests and characterization tests are tasks, not options (STAGE-B-RULES section 3). No task calls a paid API; there is no paid probe in this feature.

## Format: `[ID] [P?] [Story] Description`

Paths are those of `plan.md`: the package is `packages/learning/`; the tests are in `tests/parity/106/` (every `PT-106-*`) and `tests/characterization/106/` (every `CT-106-*`, the locks, the property tests and the contention tests) (row 36 of the table "What the other features must follow" of feature 100). The stories are those of `spec.md`: US1 reading, US2 apply, revert, off, US3 binding and the launch contract's rule, US4 evaluation and quarantine, US5 selection and retrospective, US6 inertness and the writer domain.

This feature edits no file of another feature. Where a task hands something to the CLI, the engine, the pipeline runtime, the doctor or validation of the launch contract, it exports a function from `packages/learning/` and the other side calls it through the contract of feature 100 that the task names.

Task ids are never renumbered. T041, T029, T030 and T084 moved to the phase whose code they precede (second analyze run, 2026-09-30); T087 and T088 are new.

## Phase 1: Setup and captures

- [x] T001 Confirm with feature 141 that the scenarios of FX-29 (`show`, `advise-no-telemetry`, `apply`, `revert`, `off`, `evaluate`, `below-sample-floor`, `quarantined`), FX-33 (`valid`, `invalid-learning`, `learning-decisions-changed`) and FX-36 (`learning-selection`, `retro`) and their golden captures exist for the inputs of this feature; list every scenario that is missing and report it (first task: fixture capture). The scenarios that the catalogue lacks for the behaviour of learning inside a run and inside a pipeline are written by T088
  - proves: 028 FR-024; 011 FR-003; 011 FR-018; 011 FR-024
  - fixture: FX-29, FX-33, FX-36
- [x] T088 Capture on the reference the five scenarios that this feature adds (`FX-01/106-learning-suggest`, `FX-01/106-learning-apply`, `FX-01/106-learning-tampered`, `FX-35/106-learning-exported`, `FX-29/106-apply-forced`; `spec.md`, the table under "Contracts of feature 100 used"), which feature 141 registers in its table "Scenarios added after the first set", with the stub verbs of feature 141 §O.3 only. `106-learning-tampered` changes a state file on both sides through the proposer verb `write` with the argument `state: <logical name>` (§O.3)
  - proves: C-007; C-008; C-011; C-012; C-013; 011 FR-016
  - fixture: FX-01, FX-29, FX-35
- [x] T002 [P] Create the package `packages/learning/` with strict TypeScript and the data folder per plan.md; create `tests/parity/106/` and `tests/characterization/106/` for the tests
- [x] T003 [P] Capture from the reference the bytes of every decision-log line and every event line of the FX-29 scenarios, with the order of members of each entry type; store them as golden captures through feature 141
  - proves: C-093; C-090
  - fixture: FX-29
- [x] T004 [P] Capture from the reference the member order of an `evaluate` entry, of the guardrail counts and records, and the text form of every number in an entry (a whole-valued number that the baseline writes with a fraction); compare them with the orders that `data-model.md` and `contracts/decision-log.md` state from the baseline code, and correct the two files where a capture differs
  - proves: C-093; C-095
  - fixture: FX-29

## Phase 2: Foundational

- [x] T005 Implement the allowlist, the hard bounds and the step cap in packages/learning/src/knobs.ts (F106-FR-001, F106-FR-002)
- [x] T006 Implement the lenient readers of event files and of the decision log, with attribution of events without a run id, in packages/learning/src/events-reader.ts (F106-FR-004, F106-FR-007)
- [x] T007 Implement the decision log: byte format, append, replay, bound through a run id, shape keying, in packages/learning/src/decision-log.ts (F106-FR-007, F106-FR-008, F106-FR-010, F106-FR-011)
- [x] T008 Implement the learning writer domain: its stream with the three event types, its lock held from the deciding read to the append, in packages/learning/src/stream.ts (F106-FR-021, F106-FR-038)
- [x] T009 [P] Implement percentile, the exact one-sided binomial tail and the exact rank test in packages/learning/src/stats.ts, tested against reference values from the baseline
- [x] T010 [P] Write the schema files of the three records that annex B §B.20 lists for this feature (`specstride.learn.applied/2`, the decision entry; `specstride.learn.summary/7`, the summary; `specstride.learn.observation/1`, the observation), each with the `$id` `urn:specstride:schema:<schema id>`, and deliver them to the `contracts` package through this feature's `contracts/deliver.json` (the delivery of the sync of feature 100, T008), not in packages/learning/schemas/ (F100-FR-227). Write the schema files of the records that annex B §B.20 does not list (the advice rows, the result of the mode selector) in packages/learning/schemas/, each with an `$id` of the internal form (row 32 of the table "What the other features must follow" of feature 100). The closed sets are read from the data that feature 100 generates into the `contracts` package (annex X §X.6 rows 77, 187 to 196) and are not written a second time; the block of the binding is validated by the schema of the launch contract (annex G §G.8)
- [x] T011 Implement the summary and the metric definitions (wait calls, kill classes, outcomes, work seconds, billing) in packages/learning/src/metrics.ts (F106-FR-004, F106-FR-005)
- [x] T041 Implement the mode as the key `learning.mode` and its bound `learning.through`, with the aliases of annex X §X.8 and the closed set, in packages/learning/src/mode.ts (F106-FR-009)

**Checkpoint**: knobs, readers, decision log, writer domain, statistics, metrics and the mode exist.

## Phase 3: User Story 1 - Reading what learning would do (Priority: P1) MVP

**Goal**: `learn` prints suggestions and the report and changes nothing.

**Independent Test**: FX-29 `show` and `advise-no-telemetry` equal or waived.

### Tests for User Story 1

- [x] T012 [P] [US1] Parity test PT-106-028FR024-allowlist and PT-106-C-095-allowlist-lock and PT-106-C-088-knob-choices in tests/parity/106/allowlist.test.ts
  - proves: 028 FR-024; C-095; C-088
  - fixture: FX-29
  - surfaces: exit, stdout, stderr, state
- [x] T013 [P] [US1] Parity test PT-106-028FR024-bounds and PT-106-C-095-bounds-step in tests/parity/106/bounds.test.ts
  - proves: 028 FR-024; C-095
  - fixture: FX-29
- [x] T014 [P] [US1] Parity test PT-106-C-090-events-read and PT-106-C-093-summary-document and PT-106-C-088-summary-inputs and PT-106-C-095-attribution in tests/parity/106/summary.test.ts
  - proves: C-090; C-093; C-088; C-095
  - fixture: FX-29
  - surfaces: exit, stdout, state, events
- [x] T015 [P] [US1] Parity test PT-106-C-095-wait-kill-outcome and PT-106-C-095-percentiles and PT-106-C-095-shape-restriction in tests/parity/106/metrics.test.ts
  - proves: C-095
  - fixture: FX-29
- [x] T016 [P] [US1] Parity test PT-106-C-095-suggest-timeout and PT-106-C-092-floor-reason and PT-106-C-095-suggest-poll and PT-106-C-092-floor-reason-poll in tests/parity/106/suggest.test.ts
  - proves: C-095; C-092
  - fixture: FX-29
- [x] T017 [P] [US1] Parity test PT-106-C-094-below-floor-line and PT-106-C-094-output-lines and PT-106-C-094-no-new-line in tests/parity/106/lines.test.ts
  - proves: C-094
  - fixture: FX-29
  - surfaces: stdout, stderr
- [x] T018 [P] [US1] Parity test PT-106-C-108-dispatch and PT-106-C-109-modes and PT-106-C-111-usage-errors and PT-106-C-087-operations and PT-106-C-109-show-exit and PT-106-C-109-mode-passthrough in tests/parity/106/verb.test.ts
  - proves: C-108; C-109; C-111; C-087
  - fixture: FX-29
  - surfaces: exit, stdout, stderr, state
- [x] T019 [P] [US1] Parity test PT-106-C-115-input-selection and PT-106-C-088-flags and PT-106-C-088-advise-out and PT-106-C-110-default-injection in tests/parity/106/inputs.test.ts
  - proves: C-115; C-088; C-110
  - fixture: FX-29
- [x] T020 [P] [US1] Parity test PT-106-C-091-exit-codes and PT-106-C-091-exit-2-messages in tests/parity/106/exit-codes.test.ts
  - proves: C-091
  - fixture: FX-29
  - surfaces: exit, stderr
- [x] T021 [P] [US1] Characterization test CT-106-1 that locks the read sites of learned values, in tests/characterization/106/read-sites.test.ts, and the parity test PT-106-C-013-read-sites in tests/parity/106/read-sites.test.ts
  - proves: C-013; 028 FR-024
  - fixture: FX-01/106-learning-apply
- [x] T022 [P] [US1] Parity test PT-106-C-093-log-bytes and PT-106-C-093-lenient-read in tests/parity/106/log-bytes.test.ts, and CT-106-2 (bytes of every log line against the captures of T003 and T004) in tests/characterization/106/log-bytes.test.ts
  - proves: C-093
  - fixture: FX-29
  - surfaces: state
- [x] T029 [P] [US1] Parity test PT-106-C-089-mode-values and PT-106-C-089-through-bound in tests/parity/106/mode.test.ts, and CT-106-3 (an unknown value of the mode reads as `off`) in tests/characterization/106/mode.test.ts
  - proves: C-089; C-095
  - fixture: FX-29, FX-01/106-learning-apply
- [x] T030 [P] [US1] Parity test PT-106-C-013-resolve-cap and PT-106-C-095-arm-and-clamp and PT-106-C-087-resolve in tests/parity/106/resolve.test.ts
  - proves: C-013; C-095; C-087; C-093
  - fixture: FX-01/106-learning-apply
  - surfaces: exit, state, events

### Implementation for User Story 1

- [x] T023 [US1] Implement the two suggestion engines in packages/learning/src/suggest.ts (F106-FR-012, F106-FR-013)
- [x] T024 [US1] Implement the observation document in packages/learning/src/observation.ts (F106-FR-006)
- [x] T025 [US1] Implement the message texts in packages/learning/src/lines.ts (F106-FR-026)
- [x] T026 [US1] Implement the input selection and the options in packages/learning/src/verb.ts and export the handler of the command `learn` with the modes `--show` and `--summarize`; the front door routes the command to the handler (annex G §G.1) (F106-FR-022 to F106-FR-025)
- [x] T027 [US1] Implement `resolve` (value and arm, clamp, through, provenance) in packages/learning/src/resolve.ts, behind the function interface of F100-FR-235; the two read sites are the assembly of the pass limit and of the poll interval of a detached job, which call it and which CT-106-1 locks (F106-FR-010, F106-FR-003)

**Checkpoint**: `learn`, `learn --summarize` and the resolution work; nothing is written by them.

## Phase 4: User Story 2 - Apply, revert, off (Priority: P1)

**Goal**: Decisions are appended, undone, and cleared.

**Independent Test**: FX-29 `apply`, `revert`, `off`, `below-sample-floor`.

### Tests for User Story 2

- [x] T028 [P] [US2] Parity test PT-106-C-093-entry-fields and PT-106-C-095-run-id-form in tests/parity/106/entries.test.ts
  - proves: C-093; C-095
  - fixture: FX-29
  - surfaces: state
- [x] T031 [P] [US2] Parity test PT-106-C-095-shape-key and PT-106-C-095-replay and PT-106-C-088-phase-shape in tests/parity/106/shape.test.ts
  - proves: C-095; C-088; C-093
  - fixture: FX-29
- [x] T032 [P] [US2] Parity test PT-106-C-092-refusal-reasons and PT-106-C-091-apply-exit-3 in tests/parity/106/apply-refusal.test.ts
  - proves: C-092; C-091; C-094
  - fixture: FX-29
  - surfaces: exit, stderr, state
- [x] T033 [P] [US2] Parity test PT-106-028FR024-apply-entry and PT-106-C-087-apply and PT-106-C-092-apply-reasons in tests/parity/106/apply.test.ts
  - proves: 028 FR-024; C-087; C-092
  - fixture: FX-29
- [x] T034 [P] [US2] Parity test PT-106-028FR024-revert and PT-106-C-087-revert and PT-106-C-092-revert-refusal in tests/parity/106/revert.test.ts
  - proves: 028 FR-024; C-087; C-092; C-094
  - fixture: FX-29
- [x] T035 [P] [US2] Parity test PT-106-C-087-off and PT-106-C-094-off-lines and PT-106-C-091-off-exit in tests/parity/106/off.test.ts
  - proves: C-087; C-094; C-091
  - fixture: FX-29
- [x] T036 [P] [US2] Parity test PT-106-C-090-knob-events and PT-106-C-093-events-location and PT-106-C-092-event-reasons in tests/parity/106/knob-events.test.ts
  - proves: C-090; C-093; C-092
  - fixture: FX-29
  - surfaces: events, state

### Implementation for User Story 2

- [x] T037 [US2] Implement `apply` with the floors and the refusals in packages/learning/src/apply.ts (F106-FR-014, F106-FR-015); the quarantine check and `--force` are added by T059
- [x] T038 [US2] Implement `revert` and `off` in packages/learning/src/revert.ts and packages/learning/src/off.ts (F106-FR-016, F106-FR-017)
- [x] T039 [US2] Implement the records of the three event types of the learning stream (`learning.knob_adjusted`, `learning.knob_auto_reverted`, `learning.knob_evaluated`) with the fields of the event catalogue in packages/learning/src/stream.ts, and name for each event which as-is place its projected line goes to (the feature, or the engine start); the rows of the compatibility projection are not written here: a missing row of the class `learning` is reported (F106-FR-021)
- [x] T040 [US2] Add the modes `--apply`, `--revert` and `--off` to the handler of the command in packages/learning/src/verb.ts (F106-FR-022, F106-FR-023)

**Checkpoint**: decisions can be applied, reverted and cleared; the bytes equal the captures.

## Phase 5: User Story 3 - The launch contract says what runs (Priority: P1)

**Goal**: The decision log is bound into the launch contract, and a supervised run gets its mode from it.

**Independent Test**: FX-33 `valid`, `invalid-learning` and `learning-decisions-changed`; FX-35 `106-learning-exported`; the doctor reports a shadowed value.

### Tests for User Story 3

- [x] T042 [P] [US3] Parity test PT-106-011FR003-binding and PT-106-C-210-derivation-options and PT-106-C-213-through-rule in tests/parity/106/binding.test.ts
  - proves: 011 FR-003; C-210; C-213
  - fixture: FX-33
  - surfaces: exit, stdout, stderr, state
- [x] T043 [P] [US3] Parity test PT-106-C-218-prefix-hash and PT-106-C-218-block-keys and PT-106-C-218-stage-env-consistency in tests/parity/106/binding-validation.test.ts
  - proves: C-218
  - fixture: FX-33
- [x] T044 [P] [US3] Parity test PT-106-C-214-literal-declarations in tests/parity/106/stage-env.test.ts
  - proves: C-214
  - fixture: FX-33
- [x] T045 [P] [US3] Parity test PT-106-011FR016-strip-and-force-off and PT-106-C-226-child-env and PT-106-C-007-alias in tests/parity/106/strip.test.ts
  - proves: 011 FR-016; C-226; C-007
  - fixture: FX-35/106-learning-exported
  - surfaces: exit, stdout, stderr, state, events, pipeline
- [x] T046 [P] [US3] Characterization test CT-106-4 (the doctor reports a learning mode and a bound of decisions that the launch contract shadows, with the source `contract`; no secret value in the report) in tests/characterization/106/doctor-shadow.test.ts
  - proves: F106-FR-031
- [x] T047 [P] [US3] Test of the property of F106-SC-005: 1,000 seeded one-byte changes inside the bound prefix are refused with 23 and appends are not, in tests/parity/106/prefix-property.test.ts
  - proves: C-218; 011 FR-003
  - fixture: FX-33

### Implementation for User Story 3

- [x] T048 [US3] Implement the binding block and the prefix hash in packages/learning/src/binding.ts (F106-FR-027, F106-FR-028)
- [x] T049 [US3] Export the rules of F106-FR-028 and F106-FR-029 from packages/learning/src/binding.ts as one function that returns the structural findings with the error class `learning` (exit 20) and the two refusals of a changed or lost prefix (exit 23); validation of the launch contract calls it (annex G §G.8)
- [x] T050 [US3] Check that the pinned keys of feature 100 (F100-FR-167) hold `learning.mode` and `learning.through`, and that under the `parity` profile only the learning mode and live output are honoured (row 38 of annex X §X.7); report a difference. The pipeline runtime executes the strip; this feature writes no file for it (F106-FR-030)
- [x] T051 [US3] Hand the two keys `learning.mode` and `learning.through` to the configuration-precedence check of the doctor as keys whose shadowing by the launch contract is reported (annex G §G.7); this feature registers no check of its own; CT-106-4 (T046) proves the report (F106-FR-031)

**Checkpoint**: the binding is derived, validated, stripped and reported.

## Phase 6: User Story 4 - Evaluation, automatic revert and quarantine (Priority: P2)

**Goal**: Applied decisions are labelled and undone on a breach; a reverted value is quarantined.

**Independent Test**: FX-29 `evaluate`, `quarantined` and `106-apply-forced`.

### Tests for User Story 4

- [x] T052 [P] [US4] Parity test PT-106-028FR024-evaluate and PT-106-C-095-mde-and-label and PT-106-C-088-dry-run-report and PT-106-C-087-evaluate and PT-106-C-092-evaluate-reasons in tests/parity/106/evaluate.test.ts
  - proves: 028 FR-024; C-095; C-088; C-087; C-092; C-094
  - fixture: FX-29
- [x] T053 [P] [US4] Parity test PT-106-C-095-arms and PT-106-C-092-reset-reasons in tests/parity/106/arms.test.ts
  - proves: C-095; C-092; C-093
  - fixture: FX-29
- [x] T054 [P] [US4] Parity test PT-106-C-095-guardrails and PT-106-C-095-auto-revert and PT-106-C-094-auto-revert-line in tests/parity/106/guardrails.test.ts
  - proves: C-095; C-094; C-093; C-087
  - fixture: FX-29
- [x] T055 [P] [US4] Parity test PT-106-C-095-quarantine and PT-106-C-091-apply-exit-4 and PT-106-C-094-quarantine-line and PT-106-C-088-force in tests/parity/106/quarantine.test.ts
  - proves: C-095; C-091; C-094; C-088
  - fixture: FX-29, FX-29/106-apply-forced
  - surfaces: exit, stdout, stderr, state, events
- [x] T056 [P] [US4] Test that the arbitration proxy reads exactly the four stop reasons `max_rejects`, `gate_oscillation`, `critic_config` and `proposer_no_progress` of annex E §E.3, and no new reason, in tests/characterization/106/stop-reasons.test.ts
  - proves: C-095

### Implementation for User Story 4

- [x] T057 [US4] Implement `evaluate`: arms, baseline, effect, minimum detectable effect, label, counterfactual, the signature that decides whether an evaluation is recorded, in packages/learning/src/evaluate.ts (F106-FR-018, F106-FR-019)
- [x] T058 [US4] Implement the guardrails, with the counts and the records of `data-model.md`, and the automatic revert in packages/learning/src/guardrails.ts (F106-FR-019)
- [x] T059 [US4] Implement the quarantine in packages/learning/src/quarantine.ts and add its check and `--force` to `apply` in packages/learning/src/apply.ts (F106-FR-020, F106-FR-015)
- [x] T060 [US4] Add the mode `--evaluate` (dry run) to the handler of the command in packages/learning/src/verb.ts (F106-FR-022, F106-FR-023)

**Checkpoint**: evaluation, guardrails and quarantine equal the reference on FX-29.

## Phase 7: User Story 5 - Selection and retrospective (Priority: P2)

**Goal**: The request selects the mode; a read-only retrospective follows the run.

**Independent Test**: FX-36 `learning-selection` and `retro`.

### Tests for User Story 5

- [x] T061 [P] [US5] Parity test PT-106-011FR018-selection and PT-106-C-255-token-refusal-apply-suggest and PT-106-C-254-learning-line and PT-106-C-246-learning-command in tests/parity/106/selection.test.ts
  - proves: 011 FR-018; C-255; C-254; C-246
  - fixture: FX-36
  - surfaces: exit, stdout, stderr
- [x] T062 [P] [US5] Parity test PT-106-011FR018-comment-no-widen in tests/parity/106/comment.test.ts, and CT-106-5 (1,000 generated comments; none yields `apply` without a token or an apply phrase; a derivation asked for `apply` with nothing to bind writes `suggest` and says why) in tests/characterization/106/comment.test.ts
  - proves: 011 FR-018; C-255
  - fixture: FX-36
- [x] T063 [P] [US5] Parity test PT-106-011FR024-retro-file and PT-106-C-253-retro-path and PT-106-C-246-retro-exit in tests/parity/106/retro-file.test.ts
  - proves: 011 FR-024; C-253; C-246
  - fixture: FX-36
  - surfaces: exit, stdout, state, pipeline
- [x] T064 [P] [US5] Parity test PT-106-011FR024-retro-stages and PT-106-C-249-retro-lines and PT-106-C-255-retro-suggestion and PT-106-C-246-retro-command in tests/parity/106/retro-stages.test.ts
  - proves: 011 FR-024; C-249; C-255; C-246
  - fixture: FX-36
  - surfaces: exit, stdout, stderr, state

### Implementation for User Story 5

- [x] T065 [US5] Copy the phrases and the tokens of the baseline's selector into packages/learning/data/mode-phrases.json, one entry per pattern, and compare them member by member with the reference (`contracts/mode-selector.md`)
- [x] T066 [US5] Implement the selector, its lines and the handler of the verb `learning` of `supervise` (options `--request`, `--token`) in packages/learning/src/selector.ts, and the rule that a derivation asked for `apply` with nothing to bind writes `suggest` (F106-FR-032, F106-FR-033)
- [x] T067 [US5] Implement the retrospective in packages/learning/src/retro.ts: the document, the lines and the handler of the verb `retro` of `supervise` (options `--launcher`, `--run-dir`). The two `learn` commands of a stage run as child processes through the process primitive of the kernel (F100-FR-234), with a time limit of 120 seconds. The handler returns the document, and the command writes the file with the atomic write of the kernel, as the writer that annex B §B.5 names (F106-FR-034, F106-FR-035)
- [x] T068 [US5] Deliver the schema file `contracts/schemas/retrospective.schema.json` to the `contracts` package and hand the logical name `pipeline:<pipelineId>:retrospective:<hash>` to the layout data (F106-FR-034, F100-FR-227); the schema id is settled (annex B §B.20)

**Checkpoint**: selection and retrospective equal the reference on FX-36.

## Phase 8: User Story 6 - The layer changes nothing else (Priority: P2)

**Goal**: The layer is inert and writes only its own files.

**Independent Test**: The own tests below; FX-01 `106-learning-suggest` and `106-learning-tampered`.

### Tests for User Story 6

- [x] T069 [P] [US6] Parity test PT-106-C-011-observe-after-phase and PT-106-C-011-observe and PT-106-C-093-observation-document and PT-106-C-008-learning-observed in tests/parity/106/observe.test.ts
  - proves: C-011; C-008; C-093; C-094
  - fixture: FX-01/106-learning-suggest
  - surfaces: exit, stdout, state, events
- [x] T070 [P] [US6] Parity test PT-106-C-013-evaluate-at-phase-done and PT-106-C-013-exit-summary and PT-106-C-007-layer-on in tests/parity/106/run-integration.test.ts
  - proves: C-013; C-007; C-011; C-008
  - fixture: FX-01/106-learning-suggest
  - surfaces: exit, stdout, state, events
- [x] T071 [P] [US6] Parity test PT-106-C-013-tamper-bracket and PT-106-C-012-tamper-line and PT-106-C-008-events-tampered and PT-106-C-090-tampered-run in tests/parity/106/tamper.test.ts; the bracket taken and found intact is proved on `106-learning-suggest`, the changed file on `106-learning-tampered` (T088)
  - proves: C-013; C-012; C-008; C-090
  - fixture: FX-01/106-learning-suggest, FX-01/106-learning-tampered
  - surfaces: exit, stdout, state, events
- [x] T072 [P] [US6] Characterization test CT-106-6 (contention: a run and `learn` write at once, 1,000 rounds, no lost line, no torn line, no line in another writer's file) in tests/characterization/106/writers.test.ts
  - proves: 028 FR-024
- [x] T073 [P] [US6] Characterization test CT-106-7 (the lock is held from the deciding read to the append; two `apply` at once cannot both act on the same top decision) in tests/characterization/106/lock.test.ts
  - proves: 028 FR-024
- [x] T074 [P] [US6] Characterization test CT-106-8 (inner events of the micro-loop layer and of parallel units change no count that learning reads) in tests/characterization/106/inner-events.test.ts
  - proves: 028 FR-024
- [x] T075 [P] [US6] Characterization test CT-106-9 (a run with `suggest` equals the run with `off` outside the differences that F106-FR-039 lists) in tests/characterization/106/inert.test.ts
  - proves: 028 FR-024
- [x] T084 [P] [US6] Characterization test CT-106-10 in tests/characterization/106/ingress.test.ts: a planted secret in the free-text `reason` of a learning event and in a decision entry never appears in the learning stream, in a learning file or in a retrospective line; the ingress fails closed as F100-FR-205 requires (F106-FR-040)
  - proves: F106-FR-040
  - fixture: FX-29
  - surfaces: state, events, stdout
- [x] T078 [P] [US6] Characterization test that the archive of `state export` holds the decision log byte for byte, in tests/characterization/106/state-export.test.ts; a missing entry is reported to the owner of the command (F106-FR-038, F100-FR-075)
  - proves: F106-FR-038

### Implementation for User Story 6

- [x] T076 [US6] Implement the calls that the engine makes through the function interface of F100-FR-235 in packages/learning/src/hooks.ts: `observe` after an approved phase, `evaluate` for the active decisions of that phase, and the read-only report of the last evaluations for the lines at exit. A failure is returned as a result and never raised into the run; the lines go to the engine log. The engine makes the calls and records `learning.observed` (F106-FR-036)
- [x] T077 [US6] Implement the tamper bracket in packages/learning/src/tamper.ts as two functions (take the size and the hash of the leading bytes of the three files before a pass; check them after it) and offer them beside the calls of T076; the engine executes them and records `integrity.events_changed` (F106-FR-037, F100-FR-228)
- [x] T087 [US6] Pass every text from outside the runtime through the one ingress (the redactor of annex X §X.4) before it is written: the free-text `reason` of an event in packages/learning/src/stream.ts, the free-text members of an entry in packages/learning/src/decision-log.ts, and the evaluation lines that packages/learning/src/retro.ts copies; a failure of the ingress writes nothing (F106-FR-040, F106-FR-021)

## Phase 9: Polish

- [x] T079 [P] Static test, in tests/characterization/106/boundary.test.ts, that no source outside `packages/learning/` reads the decision log or a learned value, and that the package imports only `@specstride/contracts` and `@specstride/kernel` — the import set of the package graph of feature 100, layer L1 — refusing what the import-boundary check of feature 100 refuses (LR-1); `node:child_process` is not imported
  - proves: C-013
- [x] T080 [P] Test of F106-SC-001 in tests/characterization/106/bounds-property.test.ts: 10,000 generated summaries and decision logs; no applied decision outside the allowlist, the bounds or the step cap
  - proves: 028 FR-024; C-095
  - fixture: FX-29
- [x] T081 [P] Test of F106-SC-004 in tests/characterization/106/off-reversible.test.ts: after `off` every value in effect at run time is the default and no earlier byte changed
  - proves: 028 FR-024; C-093
  - fixture: FX-29
- [x] T085 [P] Tier the tests of this feature (hermetic, discovery, execution, live) and run the parity and characterization tests of this feature on the macOS runner of the build workflow of feature 100 when it exists; record the result per test with the version of the system in tests/characterization/106/macos.md. Until then every macOS statement of this feature stays `unverified`; a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner, a scenario that feature 141 has not yet made possible) is reported as a skip with its reason, never as a pass (Principle XVII)
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
- [x] T086 [P] Measure, in tests/characterization/106/budget.test.ts, the default output of `learn --show` for one feature with the byte-measure helper of feature 100 (`packages/testkit/src/static/budget.ts`, its task T194): it stays under 2,000 bytes (annex G §G.5, F100-FR-187)
  - covers: F106-FR-022
  - fixture: FX-29
- [x] T082 Run the coverage script `docs/ecosystem/check-traceability.py`, read the lines of feature 106, and repair them
- [x] T083 Walk through `quickstart.md` on the fixtures and record the result

## Dependencies

- T001 and T088 first; T003 and T004 before T022, T028 and T007's byte test.
- T005 to T011 and T041 before every story. Within a story: tests, then implementation.
- US1 and US2 are independent after Phase 2. US3 needs T007 and T041. US4 needs T057 after T037, and T059 extends the `apply` of T037. US5 needs T041. US6 needs T007 and T008; T087 changes the files of T007, T008 and T067 and comes after them.
- The tests of T021, T029, T030, T045 and T069 to T071 need the scenarios of T088.

## Coverage of success criteria and of the requirements that no task names singly

| Id | Measured or built by |
|---|---|
| F106-FR-024 | T019 (parity), T026 (implementation) |
| F106-FR-031 | T046 (characterization), T051 |
| F106-FR-039 | T074, T075 (characterization), T076 (implementation) |
| F106-FR-040 | T084 (characterization), T087 (implementation) |
| F106-SC-001 | T080, T012, T013 |
| F106-SC-002 | T045, T046 |
| F106-SC-003 | T014 to T020, T022, T028 to T036, T055 |
| F106-SC-004 | T081, T035 |
| F106-SC-005 | T047, T042, T043 |
| F106-SC-006 | T061, T062 |
| F106-SC-007 | T075 |
| F106-SC-008 | T021, T079 |
| F106-SC-009 | T072 |
| F106-SC-010 | T063, T064 |
