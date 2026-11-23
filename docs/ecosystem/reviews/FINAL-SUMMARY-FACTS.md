# FINAL-SUMMARY-FACTS

Computed 2026-09-30 from the working tree by scripts (scratch: the session scratchpad `facts/t.py`). Read-only gathering.

## 1. Per feature

Rules: FR = lines matching `^- \*\*F\d{3}-FR-\d{3}\*\*` in spec.md (for 100 also annexes/*.md). SC = distinct `^- \*\*F\d{3}-SC-\d{3}\*\*` definitions in the same files. Tasks = `^- \[[ xX]\] T\d+` in tasks.md. Paid = task lines containing `PAID` or `paid`. Unverified / assumption / divergence = requirement blocks (the FR line plus its indented continuation lines) containing `status: unverified`, `assumption: CQ-`, `divergence: DV-` (blocks counted once, not citations).

| Feature | FR | SC | Tasks | Paid tasks | unverified | assumption CQ | divergence DV |
|---|--:|--:|--:|--:|--:|--:|--:|
| 100-specstride | 236 | 9 | 228 | 1 | 15 | 36 | 94 |
| 101-gate-and-verdict | 42 | 6 | 96 | 1 | 1 | 5 | 32 |
| 102-run-control | 37 | 8 | 50 | 0 | 3 | 10 | 23 |
| 103-proposer-pass | 44 | 9 | 71 | 1 | 3 | 4 | 36 |
| 104-spec-input | 27 | 8 | 54 | 0 | 0 | 6 | 19 |
| 105-verification | 37 | 7 | 148 | 0 | 1 | 4 | 22 |
| 106-learning | 40 | 10 | 86 | 0 | 1 | 3 | 26 |
| 107-launch-contract | 40 | 9 | 64 | 1 | 3 | 7 | 24 |
| 108-reverse | 34 | 3 | 32 | 0 | 2 | 7 | 14 |
| 109-harness-seam | 44 | 7 | 108 | 2 | 6 | 6 | 19 |
| 110-config-and-terms | 35 | 6 | 37 | 0 | 2 | 6 | 18 |
| 111-event-schema-and-projection | 40 | 7 | 58 | 0 | 0 | 6 | 10 |
| 112-doctor | 33 | 9 | 68 | 0 | 9 | 1 | 5 |
| 113-host-claude-code | 42 | 5 | 38 | 4 | 13 | 4 | 10 |
| 115-micro-loop-layer | 45 | 8 | 141 | 6 | 3 | 8 | 15 |
| 116-check-integrity-and-unit-evidence | 23 | 3 | 77 | 0 | 2 | 3 | 2 |
| 117-critic-grounding-and-prompt | 44 | 7 | 97 | 0 | 1 | 4 | 17 |
| 118-pass-supervision-and-jobs | 44 | 6 | 78 | 1 | 8 | 6 | 23 |
| 119-front-door-and-presenter | 34 | 8 | 52 | 0 | 2 | 8 | 12 |
| 122-detached-runtime | 43 | 7 | 74 | 0 | 9 | 6 | 8 |
| 123-pipeline-runtime-and-supervisor | 44 | 10 | 90 | 0 | 5 | 14 | 38 |
| 124-harness-discovery-and-roles | 30 | 5 | 41 | 0 | 2 | 2 | 17 |
| 125-adapter-claude | 41 | 10 | 81 | 6 | 15 | 7 | 19 |
| 126-stream-seam-and-invocation | 39 | 7 | 41 | 2 | 4 | 7 | 18 |
| 127-quota-budgets-and-pause | 41 | 11 | 87 | 0 | 7 | 13 | 9 |
| 128-telemetry-export | 45 | 10 | 86 | 0 | 6 | 10 | 39 |
| 129-run-view-and-status | 36 | 9 | 83 | 1 | 3 | 9 | 7 |
| 130-adapter-dsh | 45 | 9 | 76 | 6 | 13 | 9 | 29 |
| 131-adapter-codex | 40 | 8 | 63 | 11 | 20 | 5 | 22 |
| 134-adapter-pi | 30 | 7 | 39 | 6 | 18 | 5 | 9 |
| 138-adapter-prime | 47 | 11 | 72 | 1 | 12 | 7 | 36 |
| 140-reverse-inventory-and-lint | 26 | 3 | 36 | 0 | 1 | 0 | 8 |
| 141-parity-oracle | 45 | 10 | 162 | 1 | 4 | 7 | 19 |
| 142-parallel-units | 46 | 7 | 109 | 1 | 4 | 2 | 10 |
| 143-parallel-engine-services | 28 | 3 | 72 | 0 | 3 | 0 | 8 |
| 144-compatibility-projection | 12 | 2 | 22 | 0 | 0 | 3 | 9 |
| 145-presenter | 22 | 3 | 25 | 0 | 1 | 2 | 12 |
| 146-harness-discovery | 19 | 3 | 30 | 3 | 2 | 0 | 4 |
| 147-terms-gate | 14 | 3 | 11 | 0 | 1 | 0 | 8 |
| 148-check-runner | 19 | 7 | 66 | 0 | 1 | 4 | 11 |
| 149-attempt-planner-and-seams | 10 | 4 | 34 | 1 | 0 | 2 | 6 |
| **Total (41 features)** | 1643 | 284 | 2983 | 56 | 206 | 248 | 767 |

## 2. Analyze reports

Rule: the last `## ` section of each `analyze-report.md` (most reports date it by the wording "After the cross-feature review" or by a date in the heading; the heading is quoted), through its `###` subsections to the end of the file; lines in that section containing CRITICAL or HIGH are listed with a crude cue tag: "open" if the line has no "0 ", "none", "no ", "closed", "resolved", "fixed" cue. Lines are quoted so the reader can judge.

| Feature | Last dated section heading | CRITICAL/HIGH lines in that section |
|---|---|---|
| 100-specstride | ## Second pass after the cross-feature review (2026-09-30) | none |
| 101-gate-and-verdict | ## After the cross-feature review | none |
| 102-run-control | ## After the cross-feature review | none |
| 103-proposer-pass | ## After the cross-feature review | none |
| 104-spec-input | ## After the cross-feature review | none |
| 105-verification | ## After the cross-feature review | none |
| 106-learning | ## After the cross-feature review | none |
| 107-launch-contract | ## After the cross-feature review | none |
| 108-reverse | ## After the cross-feature review | none |
| 109-harness-seam | ## After the cross-feature review | none |
| 110-config-and-terms | ## Second pass after the cross-feature review (2026-09-30) | none |
| 111-event-schema-and-projection | ## Second pass after the cross-feature review (2026-09-30) | none |
| 112-doctor | ## After the cross-feature review | none |
| 113-host-claude-code | ## After the cross-feature review | none |
| 115-micro-loop-layer | ## After the cross-feature review | none |
| 116-check-integrity-and-unit-evidence | ## After the cross-feature review | none |
| 117-critic-grounding-and-prompt | ## After the cross-feature review | none |
| 118-pass-supervision-and-jobs | ## After the cross-feature review | none |
| 119-front-door-and-presenter | ## After the cross-feature review | none |
| 122-detached-runtime | ## After the cross-feature review | none |
| 123-pipeline-runtime-and-supervisor | ## After the cross-feature review | none |
| 124-harness-discovery-and-roles | ## After the cross-feature review | none |
| 125-adapter-claude | ## After the cross-feature review | none |
| 126-stream-seam-and-invocation | ## After the cross-feature review (2026-09-30) | none |
| 127-quota-budgets-and-pause | ## After the cross-feature review | none |
| 128-telemetry-export | ## After the cross-feature review | none |
| 129-run-view-and-status | ## Re-check B-8.7 | none |
| 130-adapter-dsh | ## After the cross-feature review | none |
| 131-adapter-codex | ## After the cross-feature review | none |
| 134-adapter-pi | ## After the cross-feature review | none |
| 138-adapter-prime | ## After the cross-feature review | none |
| 140-reverse-inventory-and-lint | ## After the cross-feature review | none |
| 141-parity-oracle | ## After the cross-feature review (2026-09-30) | none |
| 142-parallel-units | ## After the cross-feature review | none |
| 143-parallel-engine-services | ## After the cross-feature review | none |
| 144-compatibility-projection | ## After the cross-feature review | none |
| 145-presenter | ## After the cross-feature review | none |
| 146-harness-discovery | ## After the cross-feature review | none |
| 147-terms-gate | ## After the cross-feature review | none |
| 148-check-runner | ## Re-check B-8.7 | none |
| 149-attempt-planner-and-seams | ## After the cross-feature review | none |

## 3. Register

Rule: rows `^| DV-nnn |` in section 6 of consolidation.md; cited = `DV-nnn` appearing in specs/1*/spec.md (+ 100 annexes), any occurrence.

- Rows: 120 (DV-001 to DV-120)
- Cited by at least one spec: 120
- Uncited rows (0): none
- Cited but not a row: none

## 4. Queue

Rule: table rows `^| CQ-` in CLARIFY-QUEUE.md; classes by substring in the row, checked in the order given in the task (own answer, blanket, other "closed" in the Status column, else open).

| Class | Rows |
|---|--:|
| Total rows | 238 |
| Closed by the owner's own answer | 25 |
| Closed by the owner's blanket instruction | 187 |
| Closed before the round (other "closed") | 17 |
| Open | 9 |

Own-answer ids: CQ-017, CQ-020, CQ-021, CQ-023, CQ-024, CQ-032, CQ-035, CQ-041, CQ-110, CQ-117, CQ-135, CQ-142, CQ-143, CQ-145, CQ-182, CQ-186, CQ-188, CQ-189, CQ-197, CQ-199, CQ-202, CQ-220, CQ-221, CQ-234, CQ-238
Open ids: CQ-052, CQ-080, CQ-094, CQ-111, CQ-112, CQ-154, CQ-194, CQ-215, CQ-229

## 5. Extension points

Rule: id/version from index.json `ids` (`specstride.x/N`); content owner = first line of the "Content owner" section of each EP json; counts = lines `- ep: EP-nn ... (implements)` / `(consumes)` in specs/1*/spec.md (+100 annexes). A line with both words counts for both.

| EP | Id / version | Content owner | implements | consumes |
|---|---|---|--:|--:|
| EP-01 | specstride.host/1 | 113. | 25 | 14 |
| EP-02 | specstride.harness/1 | 109 (registry, port, generic harness adapter, conformance suite, sample). Sub-point stream readers: 126. Sub-point role resolution: 124. The harness adapters ar | 180 | 67 |
| EP-03 | specstride.spec-format/1 | 104. | 12 | 23 |
| EP-04 | specstride.loop-layer/1 | 103. The implementation `micro`: 115. The implementation `parallel`: 142. The engine services behind the group directives: 143. | 33 | 18 |
| EP-05 | specstride.check-runner/1 | 148. Feature 105 consumes the runner and keeps EP-07. | 15 | 13 |
| EP-06 | specstride.router-rules/1 | 115. | 4 | 2 |
| EP-07 | specstride.verification-source/1 | 105. The inventory of the launch contract as a source: 107. | 8 | 6 |
| EP-08 | specstride.event-sink/1 | 111 (core side, writer, conformance suite, sample sink). The compatibility projection sink: 144. The OTLP exporter and the Loki sink: 128. | 13 | 17 |
| EP-09 | specstride.view/1 | 129. | 28 | 12 |
| EP-10 | specstride.secret-resolver/1 | 110. | 14 | 16 |
| EP-11 | specstride.terms/1 | 147. The harness adapters supply the facts of their rows. | 16 | 13 |
| EP-12 | specstride.quota-classifier/1 | 127. The classifier entries of a harness: its harness adapter. | 21 | 6 |
| EP-13 | specstride.lock/1 | 122. | 12 | 12 |
| EP-14 | specstride.doctor/1 | 112. | 30 | 10 |
| EP-15 | specstride.prompt-block/1 | 103. The critic's own assembler: 117. | 17 | 5 |
| EP-16 | specstride.toolchain/1 | 116. Consumed by 105, 148, 142, 143 and 112. The schema file of `specstride.toolchain/1` is written by feature 116, in the contracts of its specification (`spec | 5 | 8 |
| EP-17 | specstride.detach/1 | 122. | 5 | 4 |
| EP-18 | specstride.critic-strategy/1, specstride.attempt-planner/1 | 149. Feature 101 consumes both seams. | 6 | 5 |
| EP-19 | specstride.stage-kind/1 | 123. | 4 | 10 |

## 6. Paid probes and captures

Rule: task lines `^- \[[ xX]\] T\d+` in every tasks.md containing `PAID` or `paid`.

| Feature | Paid task lines | Checked |
|---|--:|--:|
| 100-specstride | 1 | 0 |
| 101-gate-and-verdict | 1 | 0 |
| 103-proposer-pass | 1 | 0 |
| 107-launch-contract | 1 | 0 |
| 109-harness-seam | 2 | 0 |
| 113-host-claude-code | 4 | 0 |
| 115-micro-loop-layer | 6 | 0 |
| 118-pass-supervision-and-jobs | 1 | 0 |
| 125-adapter-claude | 6 | 0 |
| 126-stream-seam-and-invocation | 2 | 0 |
| 129-run-view-and-status | 1 | 0 |
| 130-adapter-dsh | 6 | 0 |
| 131-adapter-codex | 11 | 0 |
| 134-adapter-pi | 6 | 0 |
| 138-adapter-prime | 1 | 0 |
| 141-parity-oracle | 1 | 0 |
| 142-parallel-units | 1 | 0 |
| 146-harness-discovery | 3 | 0 |
| 149-attempt-planner-and-seams | 1 | 0 |
| **Total** | 56 | 0 |

Caveat: the literal rule also catches lines that say a task is NOT paid or that a test checks for paid calls (for example 130 T001, T060, T072; 131 T003, T020, T057, T058). Lines with none of "not paid", "no paid", "no model call", "paid or not": 37. All 56 unchecked either way.

Paid task lines (id, first 110 chars):

- 100-specstride: - [ ] T205 Release check CT-100-324, scripted in `tests/release/100/integration-run.md`: on the release build,
- 101-gate-and-verdict: - [ ] T111 [US2] Implement the check of the credential of the critic before the call, behind the switch of F10
- 103-proposer-pass: - [ ] T081 Expose the switches `carry.index`, `carry.continuation`, `carry.ledger_handoff` and the fields of `
- 107-launch-contract: - [ ] T057 [US5] Paid probe (paid, must be logged, not run by the specification): one delegated batch through 
- 109-harness-seam: - [ ] T093 [P] [US5] Test CT-109-42 (the conformance suite: the cases HC-01 to HC-17 of `contracts/conformance
- 109-harness-seam: - [ ] T095 [P] [US5] Test CT-109-24 (three doctor checks per harness with stable ids; no pin for a harness tha
- 113-host-claude-code: - [ ] T001 **PAID** Live capture on Claude Code 2.1.284 (a paid probe: model calls; a person starts it; it MUS
- 113-host-claude-code: - [ ] T029 [US5] **PAID** Behaviour smoke with a stub CLI and with-and-without report: a person starts them; n
- 113-host-claude-code: - [ ] T035 Implement the release check of the trigger suite, which reads the log of the paid runs and matches 
- 113-host-claude-code: - [ ] T037 [US5] **PAID** Run the trigger suite on the built package: a person starts it, with the model from 
- 115-micro-loop-layer: - [ ] T005 [P] Create the experiment kit in experiments/115/ (layer `dev`, never shipped) with a cost log in e
- 115-micro-loop-layer: - [ ] T124 [US6] PAID, to be logged: run the live part of experiment X0 (20 live passes, 5 killed on purpose) 
- 115-micro-loop-layer: - [ ] T125 [US6] PAID, to be logged: run experiments X5 and X6 on the fixed 50:50 mix (about 100 hours alive a
- 115-micro-loop-layer: - [ ] T126 [US6] PAID, to be logged: run the ablations X9, X10, X11 and the arm for the model-tier bump after 
- 115-micro-loop-layer: - [ ] T127 [US6] PAID, to be logged: run experiments X7 and X8 at unit level and write experiments/115/x7-x8/r
- 115-micro-loop-layer: - [ ] T128 [US6] PAID, to be logged: run experiment X12 part (iv) with live critic calls and write experiments
- 118-pass-supervision-and-jobs: - [ ] T002 [US5] Paid probe, logged, not run by the specification: one live call per tested harness adapter th
- 125-adapter-claude: - [ ] T001 [P] Fixture capture A (**paid**, logged): whether the sandbox for shell commands confines the harne
- 125-adapter-claude: - [ ] T002 [P] Fixture capture B (**paid**, logged): whether several headless processes may run under one conf
- 125-adapter-claude: - [ ] T003 [P] Fixture capture C (**paid**, logged): a real limit event on the CLI stream and the retry, overl
- 125-adapter-claude: - [ ] T004 [P] Fixture capture D and E (**paid**, logged): what the initial record lists about plugins, hooks,
- 125-adapter-claude: - [ ] T073 [P] [US6] Characterization test CT-125-6: every check of the harness adapter with a stub for each s
- 125-adapter-claude: - [ ] T076 **Paid**, logged: one live call per role (proposer and critic) with the flag combination of `contra
- 126-stream-seam-and-invocation: - [ ] T024 [US3] PAID, must be logged, not run by the specifier, precondition of no task and of no test: the l
- 126-stream-seam-and-invocation: - [ ] T001 [US1] PAID, must be logged, not run by the specifier, precondition of no task and of no test: captu
- 129-run-view-and-status: - [ ] T002 [US5] Capture on a live host, unverified until done: the host hook shim of feature 113 prints the p
- 130-adapter-dsh: - [ ] T001 Capture 3 (not paid): write the script that lists the tool ids of the pinned version and the intros
- 130-adapter-dsh: - [ ] T002 Capture 1 (paid probe, one small call per permission mode, must be logged): write the script and th
- 130-adapter-dsh: - [ ] T003 [P] Capture 2 (paid probe, one small call in `read-only`, must be logged): write the script for the
- 130-adapter-dsh: - [ ] T004 [P] Capture 4 (paid probe, one small call, must be logged): write the script for the rejoining of t
- 130-adapter-dsh: - [ ] T060 [P] [US5] Characterization tests CT-130-5 and CT-130-6: every check of the doctor reads and never w
- 130-adapter-dsh: - [ ] T072 Capture 6 (not paid): write the script that reads the composed profile of the pinned version with t
- 131-adapter-codex: - [ ] T001 Capture 1 (PAID, logged, authorized, not run by this feature; record and exit code at a login limit
- 131-adapter-codex: - [ ] T002 Capture 2 (PAID, logged, authorized, not run by this feature; first record: sandbox mode and sessio
- 131-adapter-codex: - [ ] T003 Capture 3 (not paid: no model call; logged, authorized, not run by this feature; can the read-only 
- 131-adapter-codex: - [ ] T004 Capture 4 (PAID, logged, authorized, not run by this feature; session files outside the home while 
- 131-adapter-codex: - [ ] T005 Capture 5 (PAID, logged, authorized, not run by this feature; several headless processes under one 
- 131-adapter-codex: - [ ] T020 [P] Test CT-131-6 (six doctor checks: no write, no paid call, no secret, launch-blocking flags) in 
- 131-adapter-codex: - [ ] T044 [US2] Live probe, form (a) (PAID, logged, authorized, not run by this feature): one critic call wit
- 131-adapter-codex: - [ ] T050 [US3] Live probe, form (b) (PAID, logged, authorized, not run by this feature): one critic call wit
- 131-adapter-codex: - [ ] T057 [P] [US5] Test CT-131-37 (every capture of contracts/captures.json is marked paid or not paid; a ca
- 131-adapter-codex: - [ ] T058 [P] [US5] Test CT-131-38 (every task that calls a model, the three probes and the four paid capture
- 131-adapter-codex: - [ ] T060 [US5] Live probe, proposer (PAID, logged, authorized, not run by this feature): one pass; store the
- 134-adapter-pi: - [ ] T001 Write the capture log template and the authorization record (who authorized, which capture, paid or
- 134-adapter-pi: - [ ] T002 CAP-1 (not paid): script a loopback endpoint that returns a provider error, run pi against it once,
- 134-adapter-pi: - [ ] T003 CAP-2 (PAID, logged, needs the C0 opt-in and an explicit authorization): one live call as proposer 
- 134-adapter-pi: - [ ] T005 CAP-4: in the proposer call of CAP-2 give the exact session id; read the session left under that id
- 134-adapter-pi: - [ ] T031 [P] Characterization test CT-134-10: five doctor checks read and write nothing, make no paid call, 
- 134-adapter-pi: - [ ] T033 [P] Conformance test CT-134-28 (port part): the adapter suite of feature 109 with the fake executab
- 138-adapter-prime: - [ ] T001 Prepare the five captures and the two live probes as scripts with their expected outputs, each mark
- 141-parity-oracle: - [ ] T012 [P] Test CT-141-138 (no paid or external call: a connection beyond loopback fails the run; a creden
- 142-parallel-units: - [ ] T103 [US5] PAID, must be logged, not run in Stage B: run FX-PAR-L live with the arms serial, 2 workers a
- 146-harness-discovery: - [ ] T010 [P] [US1] Characterization tests CT-146-1 and CT-146-2 in packages/harness/tests/discovery/discover
- 146-harness-discovery: - [ ] T027 [P] Live probe, logged, run by a person and not by the build: one GET of the model list of a provid
- 146-harness-discovery: - [ ] T028 [P] Live probe, logged, run by a person and not by the build: one GET of the model list of a gatewa
- 149-attempt-planner-and-seams: - [ ] T027 [US3] Define the ablation arm of the bump for the experiments of the product (the default configura

## 7. Checks

- `python3 docs/ecosystem/check-traceability.py --require-all` (exit 0): `PASSED: checks a to h`
- `python3 specs/100-specstride/contracts/tools/generate.py --check` (exit 0): `checked 82 files, 0 differ`
- `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` (exit 1): `checked: 40 families, 39 active, 248 scenarios named (13 of them patterns with 175 members; 14 of other features), 34 with an end on the reference, 117 register rows, 55 requirements`
  - 3 FAIL lines above the last line: FAIL DV-112: the text of the register changed; FAIL DV-114: the text of the register changed; FAIL DV-115: the text of the register changed

## 8. Splits

Requirement counts = table 1 FR column. Pairs from feature-briefs.md A.1a.

| Parent | FR now | Split part | FR now | SC parent / part |
|---|--:|---|--:|---|
| 115-micro-loop-layer | 45 | 116-check-integrity-and-unit-evidence | 23 | 8 / 3 |
| 108-reverse | 34 | 140-reverse-inventory-and-lint | 26 | 3 / 3 |
| 142-parallel-units | 46 | 143-parallel-engine-services | 28 | 7 / 3 |
| 111-event-schema-and-projection | 40 | 144-compatibility-projection | 12 | 7 / 2 |
| 119-front-door-and-presenter | 34 | 145-presenter | 22 | 8 / 3 |
| 124-harness-discovery-and-roles | 30 | 146-harness-discovery | 19 | 5 / 3 |
| 110-config-and-terms | 35 | 147-terms-gate | 14 | 6 / 3 |
| 105-verification | 37 | 148-check-runner | 19 | 7 / 7 |
| 101-gate-and-verdict | 42 | 149-attempt-planner-and-seams | 10 | 6 / 4 |

Features above 45 requirements: 100-specstride (236), 138-adapter-prime (47), 142-parallel-units (46)

## 9. Roadmap

Rule: table rows of every section of roadmap.md after "## Wave 2" (Wave 2; Wave 3 and later adapters; run acceleration; memory; platform features; packaging). Wave column: stated for the first two and the Lisa table; otherwise the section heading is quoted. Auth tier only for harness rows (tier P / tier D columns). Missing = empty or dash in a required cell.

| Section | Item | Wave | Auth tier (P / D) | Research | Flags |
|---|---|---|---|---|---|
| Wave 2 | 120-host-dsh | 2 |  | R4, R17 |  |
| Wave 2 | 121-kanban-ui | 2 |  | R13, R1, R1v |  |
| Wave 3 and later: one harness adapter per feature | 132-adapter-gemini-cli | 3+ | 2 / 2 | R7, R8v |  |
| Wave 3 and later: one harness adapter per feature | 133-adapter-copilot | 3+ | 1, 2 / 1, 2 | R7, R8v |  |
| Wave 3 and later: one harness adapter per feature | 135-adapter-opencode | 3+ | 2 / 2 | R10, R8v |  |
| Wave 3 and later: one harness adapter per feature | 136-adapter-openrouter | 3+ | 2 / 2 | R6 |  |
| Wave 3 and later: one harness adapter per feature | 137-adapter-zai | 3+ | 1 through a listed tool, 2 / 2 | R6, R8v |  |
| Wave 3 and later: one harness adapter per feature | 139-adapter-specstride | 3+ | — / — | — | no research cited; no tier |
| Run acceleration after Wave 1 | A check tool inside the pass (level L2) | (section: Run acceleration after Wave 1) |  | R23, R27 | wave not stated in row |
| Run acceleration after Wave 1 | Check selection per unit | (section: Run acceleration after Wave 1) |  | R23, R27 D-07 | wave not stated in row |
| Run acceleration after Wave 1 | Test counts before and after a check | (section: Run acceleration after Wave 1) |  | R23v O-4 | wave not stated in row |
| Run acceleration after Wave 1 | The gate and grounding on an immutable snapshot of the tree | (section: Run acceleration after Wave 1) |  | R23v O-1 | wave not stated in row |
| Run acceleration after Wave 1 | Commits or snapshots per kept unit | (section: Run acceleration after Wave 1) |  | R23v O-13, R24 | wave not stated in row |
| Run acceleration after Wave 1 | A model as inner reviewer | (section: Run acceleration after Wave 1) |  | R22 | wave not stated in row |
| Run acceleration after Wave 1 | A second harness as an escalation rung; up-front routing; learned routers | (section: Run acceleration after Wave 1) |  | R25 | wave not stated in row |
| Run acceleration after Wave 1 | `autoresearch` as a kind of loop | (section: Run acceleration after Wave 1) |  | R25, R15 | wave not stated in row |
| Run acceleration after Wave 1 | Feature parallelism in separate workspaces | (section: Run acceleration after Wave 1) |  | R26 | wave not stated in row |
| Run acceleration after Wave 1 | A phase graph (parallel independent phases) | (section: Run acceleration after Wave 1) |  | R26 | wave not stated in row |
| Run acceleration after Wave 1 | `[P]` units in worktrees as a **default** | (section: Run acceleration after Wave 1) |  | R26, R29 | wave not stated in row |
| Run acceleration after Wave 1 | Selection among N candidates on one phase attempt | (section: Run acceleration after Wave 1) |  | R26 | wave not stated in row |
| Memory | Lessons store: operator-approved, process-only, never sourced from critic feedba | (section: Memory) |  | R12 | wave not stated in row |
| Memory | Cross-project content memory | (section: Memory) |  | R12 | wave not stated in row |
| Memory | Feature 114-memory | (section: Memory) |  | R12 | wave not stated in row |
| Platform features from Lisa | Human approvals of plan revisions, the approvals webhook, and a live blocked-on- | 3+ |  | R19 C-12, R15 |  |
| Platform features from Lisa | Event delivery dispatcher | 3+ |  | R14 |  |
| Platform features from Lisa | Critic ensemble | 3+ |  | R19 C-11, R15 |  |
| Platform features from Lisa | Spec bundle import and verification plans bound to a spec bundle | 3+ |  | R19, R15 |  |
| Platform features from Lisa | Engine hooks | 3+ |  | R19 |  |
| Platform features from Lisa | Scheduler queue and cron | 3+ |  | R26 |  |
| Platform features from Lisa | Scheduler safety predicate and batch admission | 3+ |  | R26 |  |
| Platform features from Lisa | Server mode and the index database | 3+ |  | R13, R19 C-20 |  |
| Platform features from Lisa | Dashboard trajectory | 2 |  | R13, R1 |  |
| Packaging and platforms | A service detach strategy (systemd user unit, launchd agent) that survives a reb | (section: Packaging and platforms) |  | R15, R3 | wave not stated in row |
| Packaging and platforms | Third-party code extensions loaded by consumers | (section: Packaging and platforms) |  | R15, R11 | wave not stated in row |
| Packaging and platforms | A native kernel lock | (section: Packaging and platforms) |  | R2, R2v | wave not stated in row |
| Packaging and platforms | Windows and WSL | (section: Packaging and platforms) |  | — | no research cited; wave not stated in row |
| Packaging and platforms | macOS verification | (section: Packaging and platforms) |  | R2, R18 | wave not stated in row |

## 10. Git

- Commits since `b5d7bc7` (`git rev-list --count b5d7bc7..HEAD`): 292
- Commits touching `specs/` on 2026-09-30 (`git log --since=2026-09-30T00:00 --until=2026-10-01T00:00 --oneline -- specs/ | wc -l`, author dates in the repository's local time zone): 40
- Note: the working tree has uncommitted changes: `M specs/123-pipeline-runtime-and-supervisor/contracts/relaunch-observe.table.json;  M specs/123-pipeline-runtime-and-supervisor/contracts/tools/generate.py;  M specs/123-pipeline-runtime-and-supervisor/plan.md;  M specs/123-pipeline-runtime-and-supervisor/research.md;  M specs/123-pipeline-runtime-and-supervisor/spec.md`
