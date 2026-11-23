# Specification Analysis Report: Learning (feature 106)

Run 1 of `speckit-analyze` on 2026-09-29, by reading `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `contracts/` and the constitution v3.0.0. Read-only for the analysis; the repairs below were made afterwards. One repair pass was needed; the second run found nothing further.

## Coverage

| Check | Result |
|---|---|
| Functional requirements / success criteria | 39 / 10 |
| Requirements with an `origin:` and a `test:` | 37 of 39; F106-FR-038 and F106-FR-039 are new requirements, each with tests CT-106-6 to CT-106-9 |
| As-is requirements kept (028 FR-024; 011 FR-003, FR-016, FR-018, FR-024) in an `origin:` | 5 of 5 |
| Clusters with kept items in an `origin:` | 29 of 29 (C-007, C-008, C-011 to C-013, C-087 to C-095, C-108 to C-111, C-115, C-210, C-213, C-214, C-218, C-226, C-246, C-249, C-253 to C-255) |
| Kept items with a test task naming their id or cluster in `proves:` | 196 of 196 (`check-traceability.py`, checks h1 to h3, no line for feature 106) |
| Superseded item in "As-is behaviour not carried" | B-2493 with DV-038 |
| Test names of the spec that appear in `tasks.md` | 115 of 115 |
| Requirements with a task | 39 of 39 (T019, T026, T074 to T076 for the two that no task names singly, in the last table of `tasks.md`) |
| Success criteria with a measuring task | 10 of 10 (last table of `tasks.md`) |
| Fixture-capture tasks first | T001, T003, T004 |
| Paid probe | None in this feature |
| Constitution gates | 20 answered; 0 violations |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Estimate | 29 in the brief; 39 written. Under the limit of about 45, so no split |

## Findings and repairs

| # | Severity | Finding | Repair |
|---|---|---|---|
| 1 | Medium | Acceptance scenarios cited requirement ids that were placed before the numbering was fixed | Every reference re-pointed and re-read against the text of the requirement |
| 2 | Medium | The evaluation signature and the event used `action` for what the entry calls `action_taken` | F106-FR-018, F106-FR-019 and `data-model.md` corrected from the baseline's code |
| 3 | Low | Bare glossary terms: "gate", "contract", "backend", "yield contract" | Replaced by "phase gate", "launch contract", "harness label" (the literal field `backend` kept where it is a member name), "yield artifact schema" |
| 4 | Low | `contracts/mode-selector.md` and `data-model.md` named tasks that did not exist under those numbers | Re-pointed to T065 and T004 |
| 5 | Low | `plan.md` tree lacked `mode.ts` | Added |
| 6 | Low | Two requirements and seven success criteria had no task that names them | Table "Coverage of success criteria" added to `tasks.md` |
| 7 | Info | The requirement F106-FR-009 needs a register row that does not exist (unknown value of the learning mode) | Written as "row needed, reported" and not as `DV-new-<n>`, because `check-traceability.py` fails on the second form; reported to the orchestrator |

## Remaining, not repaired

| # | Point | Owner |
|---|---|---|
| A | Feature 100 holds no contract for the tamper bracket (F106-FR-037), the logical name of the learning lock, the schema id of the retrospective (F106-FR-034), or the names of the learning event types (F106-FR-021). The spec proceeds on the narrowest reading and marks `CQ-114` to `CQ-pending-4` | Orchestrator |
| B | The spelling of two config keys behind `--default` (`roles.proposer.timeoutSec` exists in annex X §X.8; `loop.yield.poll` is proposed) | Feature 110 |
| C | Byte identity of numbers written by two runtimes is a claim tested by T004 and T022 | Task T004 |

## Split

No split. 39 requirements.

## After the cross-feature review

Append of 2026-09-30 (act B-8.6c), after the repairs of `repair-report.md`. The counts are now
40 functional requirements (F106-FR-040 appended) and 10 success criteria; 86 tasks (T084, T085 and
T086 appended). `check-traceability.py --require-all` passes after the repairs.

Consistency pass over the places touched:

| Check | Result |
|---|---|
| Requirement without a task | None: F106-FR-040 has T084 (and its coverage-table row); the pass-limit wording touches no task text |
| Task without a requirement | None: T085 records the tiering and skip rule of Principle XVII (plan row XVII); T086 measures the XIX budget of the plan |
| Test names of the spec absent from `tasks.md` | None: `PT-106-FR040-ingress` is in T084 |
| Terms or values that differ between the files | Event types: `spec.md` F106-FR-021, `data-model.md` and `research.md` all name the four catalogue types with the as-is projection; the tamper event is `integrity.events_changed` (`events_tampered`) everywhere. Layer: `plan.md`, `research.md`, `tasks.md` (T079) all say L1 with the imports `@specstride/contracts` and `@specstride/kernel`. Retrospective: `spec.md`, `data-model.md`, `contracts/README.md` and the schema file all say `specstride.retrospective/1` (annex B §B.20). Lock: `feature:<slug>:learning:lock` in F106-FR-038. Pass limit: "pass cap" survives nowhere |
| Register rows | Plan row XVIII now states DV-105 in `consolidation.md` as the existing row for the unknown mode value; no new row needed |
| Remaining from run 1 | Item A of "Remaining" is closed: annex B §B.5 and §B.20 and F100-FR-228 now hold the lock name, the schema id and the tamper-bracket contract; the event names are settled by the catalogue. Items B and C stand |

## Second analyze run

Dated 2026-09-30, after the cross-feature review, the constitution patch v3.0.1 and the closure of the clarification round. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `repair-report.md`, the constitution v3.0.1, the annexes A, B, F, G and X of feature 100 with their data files (closed sets, layout and its old side, exit codes, config ranks, package graph, kernel operations, parity profile), the fixture catalogue and the rules of feature 141, the queue `docs/ecosystem/CLARIFY-QUEUE.md`, the divergence register, the behaviour inventory R18 (the 197 rows of this feature), and the baseline code, read with `git show`: `lib/learn.py`, `orchestrator.sh` and the front door `specstride` at `9cab15d`; `bootstrap_contract.py`, `contract_lib.py`, `runtime.py`, `supervise.py` and `supervisor_lib.py` at `9c88f86`. Coverage before the run: 40 FR, 10 SC, 86 tasks, 100 per cent; every test name of the spec had a task (116 of 116); 196 of 196 kept behaviour items and the five kept as-is requirements placed and proved. No CRITICAL finding; four HIGH. 31 of the 33 findings were repaired on the same day at the owner's instruction ("propose and resolve any issue automatically with the best suggestion"); two are recorded and not changed. The repair record of the spec is the section "Repairs after the analyze run of 2026-09-30".

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| I1 | Inconsistency (Principle XVIII) | HIGH | F106-FR-021, F106-FR-006, F106-FR-036 vs annex X §X.6 row 73 and the baseline | The spec put four event types into the learning stream, `learning.observed` among them. The baseline emits `learning_observed` from the engine into the run's stream after a successful observation (`orchestrator.sh:2106-2108`; B-0104); the event catalogue files it beside the integrity events, and the projection counts three names of the learning stream. The events surface would have differed from the reference. Which as-is file a projected learning line goes to was not said either, and the baseline has two (B-1260) | **Repaired**: three types in the learning stream; `learning.observed` is of the run's stream, written by the engine; the two as-is places are named (D-14, D-15) |
| I2 | Inconsistency (Principle XVIII) | HIGH | F106-FR-036, user story 4 | "After an approved phase the layer evaluates every active decision." The baseline passes the phase and its shape to the evaluation (`orchestrator.sh:2123-2124`; B-0325, B-1203): only the decisions of the approved phase are evaluated. Evaluating all would append `evaluate` entries that the reference does not hold | **Repaired**: the decisions of that phase only, under the current shape, not as a dry run (D-17) |
| C1 | Coverage (untestable criteria) | HIGH | T021, T029, T030, T045, T069 to T071; F106-SC-002; "Scenarios added: none" | FX-29 drives the learning module and the command `learn` with no stub. Ten behaviour items of learning inside a run (C-007, C-008, C-011, C-012, C-013) and the strip of 011 FR-016 have evidence lines that no scenario of FX-29 or FX-35 executes, and rule 6 of feature 141 §O.1 forbids such a claim. F106-SC-002 counted "scenarios in which a learning mode is exported", and the catalogue has none | **Repaired**: five scenarios added by this feature (`FX-01/106-learning-suggest`, `-apply`, `-tampered`, `FX-35/106-learning-exported`, `FX-29/106-apply-forced`), new task T088, `fixture:` lines changed. The tamper scenario needs an answer of feature 141 and is a skip with its reason until then |
| U1 | Underspecification | HIGH | F106-FR-032, F106-FR-034, F106-FR-035 vs annex X §X.6 row 111 | "The command MUST exit 0" named no command. At the baseline the selection is `supervise learning --request --token` and the retrospective is `supervise retro --launcher or --run-dir` (B-2670, B-2678). Row 111 holds `retro` (owner 106) and not `learning`; an unknown verb is a usage error with exit 2, so `FX-36/learning-selection` could not pass | **Repaired** in this feature: both verbs and their options are named. Row 111 is feature 100's (item 1 below) |
| I3 | Inconsistency | MEDIUM | F106-FR-039, F106-SC-007, user story 6 | "The same event stream … apart from the learning events and files" is not true at the baseline, and less so after I1: a run with `suggest` has `learning.observed`, the mark of the bracket in the record of the pass limit, and `integrity.events_changed` in the run's stream (`orchestrator.sh:1819-1823`, `:1866-1867`). The criterion "0 events differ" would fail | **Repaired**: F106-FR-039 lists the differences; the criterion and the story refer to the list |
| I4 | Inconsistency | MEDIUM | plan (Constraints), T067 vs annex B §B.5 | The plan allowed no write outside the learning writer domain, T067 implemented "its file" in the learning package, and annex B §B.5 names the CLI as the writer of the retrospective | **Repaired**: the package builds the document and the lines; the command writes the file through the atomic write of the kernel |
| I5 | Inconsistency | MEDIUM | `assumption:` lines of F106-FR-009, F106-FR-034, F106-FR-037; Assumptions; `research.md` | CQ-113, CQ-114 and CQ-115 were closed in the queue on 2026-09-30; the spec said the rows "stay open for the owner's round" | **Repaired** |
| I6 | Inconsistency (tasks) | MEDIUM | T027, T029, T030, T041 | `resolve` (T027, user story 1) needs the mode (T041, user story 2), and its tests stood in the later story, after the code; "US1 and US2 are independent" was false | **Repaired**: T041 moved to the foundation; T029 and T030 moved before T027; ids kept |
| I7 | Inconsistency | MEDIUM | user story 2 (independent test, scenario 3); T033, T037 | The quarantine and `--force` were tested and built in user story 2, but a quarantine exists only after an automatic revert, which is user story 4 | **Repaired**: moved to user story 4 (scenario 3, T055, T059); T037 builds `apply` without it |
| I8 | Inconsistency | MEDIUM | F106-FR-030; "Rows of the `parity` profile" | "The mode and the bound MUST be removed" was tagged as ported. The baseline removes the mode and the legacy variable only (`runtime.py:115-125`; B-2561). The bound comes with the pin of F100-FR-167; "the two as-is keys" of row 38 are the learning mode and live output. The paragraph on `learning.through` said its value under `parity` is unset, while a stage declares it | **Repaired**: both sides stated; T050 checks the pinned keys |
| I9 | Inconsistency (plan) | MEDIUM | plan: Structure Decision, Project Type, tree, Summary | "If feature 100 offers no L2 interface …" while F100-FR-235 exists; "called by the runtime root" against "the runtime root calls nothing here"; `stats.ts` of T009 missing from the tree; F106-FR-040 missing from the table; how the retrospective starts its two commands was not said | **Repaired**: F100-FR-235 cited; the process primitive of the kernel (F100-FR-234); the tree gains `stats.ts`, `hooks.ts`, `schemas/` |
| I10 | Inconsistency (Principle XVIII) | MEDIUM | F106-FR-031; T046 | The doctor's report of a shadowed value carried `origin: 011 FR-016; C-226`, the disposition `ported` and a parity test. 011 FR-016 is the strip only, and the baselines have no doctor: a behaviour with no reference has no parity test (feature 141 §O.1 rule 8) | **Repaired**: no origin; CT-106-4 only; the parity test name is withdrawn; 011 FR-016 and C-226 stay with F106-FR-030 |
| C2 | Coverage | MEDIUM | F106-FR-040; T084 | The requirement of the one ingress had a test and no task that builds it, and the test stood in the last phase | **Repaired**: T087 builds it; T084 moved to the tests of user story 6 |
| C3 | Underspecification (tasks) | MEDIUM | T010, T026, T040, T049 to T051, T060, T076 to T081, T086; T021, T022, T029, T046, T062 | Tasks without a file path, tasks that wrote data into the `contracts` package that feature 100 generates (closed sets, pinned keys, rules of validation), tasks that "register" in the CLI or the doctor, and own tests placed in the parity directory against the plan | **Repaired**: every task names its file in `packages/learning/` or `tests/`; hand-overs are exported functions; `CT-106-*` in `tests/characterization/106/`, `PT-106-*` in `tests/parity/106/` |
| U2 | Underspecification | MEDIUM | F106-FR-008 with F106-FR-007; `data-model.md` | The byte format depends on the order of members, and for an `evaluate` entry the text read as "`schema` first"; the baseline writes the result first (`learn.py:1736`). The members of the guardrail counts, of a primary and of a guardrail record were not listed | **Repaired**: F106-FR-008 corrected; `data-model.md` lists the orders from the baseline code; T004 confirms them by capture |
| U3 | Underspecification | MEDIUM | F106-FR-027, F106-FR-028; `contracts/` | The hash was "the hash of the bytes" in the spec and "the canonical hasher" in the contract file (the canonical record hash would give another value, as in feature 105). The form of `effective`, the refusal when the bound id left the log, the forms of the five keys and the exit code of structural errors (20) were not stated (`contract_lib.py:426-536`) | **Repaired** |
| U4 | Ambiguity | MEDIUM | F106-FR-027, F106-FR-028 | `source_path` "MUST be relative, and be given as the logical name … with the path behind it": the log lies outside the repository, so no relative path exists | **Repaired**: the logical name; compared through the layout table under `parity` (reading D-12) |
| U5 | Ambiguity | MEDIUM | F106-FR-033 | "A request for `apply` where no decision can be bound MUST yield `suggest`" named no actor; at the baseline the host is told to do it | **Repaired**: the derivation writes `suggest` and says why; validation is the backstop (reading D-13) |
| U6 | Underspecification | MEDIUM | F106-FR-010 vs F106-FR-011, F106-FR-002 | Two values were not told apart. When the latest decision is a revert, a run uses the default (`orchestrator.sh:1666`), while `advise` and `apply` read the replayed value, which is what the revert recorded and may be an older learned value (`learn.py:1016-1030`, `:1148`). A phase without a known shape was not covered | **Repaired**: F106-FR-011 states both; two edge cases; a table in `data-model.md`; quickstart row 13 |
| U7 | Underspecification | MEDIUM | F106-FR-018, F106-FR-019 | The trials and counted cases of the rate guardrails and the statistic of the rank test were not defined; a rate guardrail is also `unknown` without a baseline trial; the reset `backend` needs the latest run to be outside the baseline's runs; the signature holds the whole guardrail records, not "states" (`learn.py:1426-1448`, `:1531`, `:1580-1633`, `:1723`) | **Repaired** in the two requirements and in `data-model.md` |
| A1 | Ambiguity | MEDIUM | F106-FR-022 | "The mode is the first argument that is not a flag or is not known" | **Repaired**: the first argument that the front door does not take itself (`specstride:199-213`, `:640`) |
| L1 | Inconsistency | LOW | F106-FR-006, F106-FR-010, F106-FR-019 vs F106-FR-022 | "The command line form MUST print" for an operation that has no command; in a run these lines and the automatic-revert line go to the engine log (`orchestrator.sh:2107`, `:2124`) | **Repaired** |
| L2 | Underspecification | LOW | F106-FR-001, F106-FR-020 | `<members>` and `<detail>` were placeholders for literals the baseline fixes; the QUARANTINED line precedes the suggestion line | **Repaired** |
| L3 | Coverage | LOW | F106-FR-004 | The end of a phase and the archiving of a phase attempt are read (B-1221) and were not in the list; the summary's member order | **Repaired** |
| L4 | Inconsistency | LOW | F106-FR-032 vs `contracts/mode-selector.md` | The suggest phrase "with the learning" was in the contract file only | **Repaired** |
| L5 | Inconsistency | LOW | "Closed sets"; "Contracts of feature 100 used" | Rows 187 to 196 of annex X §X.6 exist and were not cited; ten contracts the feature uses were not in the table | **Repaired**; two sets have no row (item 5 below) |
| L6 | Inconsistency | LOW | Assumptions | "The divergence register runs to DV-100" beside a citation of DV-105 | **Repaired** |
| L7 | Constitution | LOW | plan, Constitution Check | Answered against v3.0.0 with a note on v3.0.1 | **Repaired**: read again against v3.0.1; rows I, XI, XIII and XVIII carry the new reasons; result unchanged |
| L8 | Inconsistency | LOW | `quickstart.md` rows 5, 8, 9; T001; T039; phase 9 | "Two revert entries after two applies" holds for two keys only; "the retro verb"; `invalid-learning` missing from T001; T039 could not be read; T084 to T086 stood before T080 | **Repaired**; three quickstart rows reworded, two added |
| L9 | Inconsistency (with feature 100) | LOW | F106-FR-037 vs F100-FR-228 | F100-FR-228 words the check as one around a reading by a command of learning; the rule of the baseline, which this feature owns, is a bracket around each proposer pass | **Repaired** here (assumption line); item 3 below |
| L10 | Coverage | LOW | plan, Performance Goals | Two budgets on "the reference machine", measured by no task | **Repaired**: the plan says that no task measures them and names the build runner |
| D1 | Duplication | LOW | F106-FR-003 (last sentence) vs F106-FR-001, -002, -009, -014, -015; F106-FR-028 (append) vs F106-FR-007 | The invariants are stated twice | Not changed: F106-FR-003 is the statement of the invariants as one rule, with its own tests |
| L11 | Tooling | LOW | `docs/ecosystem/check-traceability.py`; `traceability-items.tsv` | The check fails with 2 errors on the register count (DV-118, DV-119). The proof column names FX-29 for all 197 rows of this feature, also for the 21 items of mixture-of-loops and the 10 items of the engine | Not changed: outside this directory; item 9 below |

### Coverage after the repairs

| Requirement keys | Has task? | Task ids | Notes |
|---|---|---|---|
| F106-FR-001 to F106-FR-003 | Yes, each | T005, T012, T013, T021, T027, T079 | — |
| F106-FR-004 to F106-FR-006 | Yes, each | T006, T011, T014, T015, T024, T069 | — |
| F106-FR-007 to F106-FR-011 | Yes, each | T006, T007, T022, T027 to T031, T041 | T041 is in the foundation now |
| F106-FR-012 to F106-FR-017 | Yes, each | T016, T023, T032 to T038 | — |
| F106-FR-018 to F106-FR-021 | Yes, each | T008, T036, T039, T052 to T059 | The quarantine is built by T059 |
| F106-FR-022 to F106-FR-026 | Yes, each | T017 to T020, T025, T026, T040, T060, T086 | — |
| F106-FR-027 to F106-FR-031 | Yes, each | T042 to T051 | F106-FR-031: T046 (CT-106-4), T051 |
| F106-FR-032, F106-FR-033 | Yes, each | T061, T062, T065, T066 | — |
| F106-FR-034, F106-FR-035 | Yes, each | T063, T064, T067, T068 | — |
| F106-FR-036 to F106-FR-039 | Yes, each | T069 to T078 | T078 is a test of the archive now |
| F106-FR-040 | Yes | T084, T087 | T087 is new |
| F106-SC-001 to F106-SC-010 | Yes, each | The last table of `tasks.md` | — |

Constitution alignment: no issue left. The three findings that touched a non-negotiable principle (I1, I2 and I10: XVIII) are repaired in the specification; none is justified in Complexity Tracking, which stays empty. All twenty principles are answered against v3.0.1.

Unmapped tasks: T001 to T004 and T088 (captures and scenarios), T002, T009, T010 (setup and foundation), T082, T083, T085 (the coverage script, the quickstart, the tiers and the macOS run). They map to the plan and to no single requirement.

### Metrics after the repairs

| Metric | Value |
|---|---|
| Functional requirements | 40 (none added, none renumbered) |
| Success criteria | 10 |
| Tasks | 88 (T087 and T088 added; T029, T030, T041, T084 moved; 41 changed in place, three of the moved ones among them) |
| Test names of the spec, each with a task | 115 of 115 (one parity name withdrawn, I10) |
| Requirements with at least one task | 100 % |
| Behaviour items and kept as-is requirements placed and proved | 196 of 196; 5 of 5 |
| Ambiguity count | 3 (A1, U4, U5), repaired |
| Duplication count | 1 (D1), kept |
| Critical issues | 0 |
| Open readings | 0 in the queue (CQ-113 to CQ-115 closed on 2026-09-30) |

### Readings this run chose

Each has another answer that the owner may prefer.

| # | Reading | Other answer |
|---|---|---|
| 1 | `source_path` of the binding holds the logical name of the decision log (D-12) | A path relative to the control plane; or the field leaves the block |
| 2 | The derivation writes `suggest` when `apply` is asked and nothing can be bound (D-13) | The host makes the change, as at the baseline, and validation refuses what is left |
| 3 | The scenarios of learning inside a run are scenarios of FX-01, added by this feature (D-16) | Feature 141 widens FX-29 to the entry point `run` with stubs, or opens a family |
| 4 | Until the oracle can change a state file during a pass on both sides, the parity tests of the changed file are a skip with its reason | They become characterization tests at once, and the four items get the proof "own test" |
| 5 | The doctor's report has no parity test (I10) | Keep the test name and waive it with a register row |
| 6 | `state export` is another feature's command; this feature tests that the archive holds the decision log (T078) | This feature builds the entry of the archive |

### What another feature or the orchestrator must do (after this run)

1. Feature 100, annex X §X.6 row 111 (owner of the set: the supervisor feature): add the verb `learning` with owner 106. The baseline has it (`supervise.py:227-231`), F106-FR-032 needs it, and the rule of the row for an unknown verb is a usage error.
2. Feature 100, F100-FR-235: it names `resolve`, `observe` and `evaluate`. The lines at exit need a read-only report of the last evaluations, and the engine needs the two functions of the tamper bracket; F106-FR-036 offers all five.
3. Feature 100, F100-FR-228: it describes a comparison "before and after its reading" by a command of learning. The baseline's rule is a bracket around each proposer pass on three files, and a changed file marks the run as left out of every evaluation (F106-FR-037).
4. Feature 100, annex G §G.3: the keys of `[MOL-RETRO]` are given as `pipeline`, `stage`, `status`, `reason`; the as-is line also carries `detail` and `path` (B-2692; F106-FR-035).
5. Feature 100, annex X §X.6: two closed sets of this feature have no row (the kill classes; the sources of a selected learning mode). Annex B §B.20: decide whether `specstride.learn.applied/2`, `specstride.learn.summary/7` and `specstride.learn.observation/1` get rows; this feature treats them as its own records and writes their schema files in its package (T010).
6. Feature 141: register the five scenarios of T088; say how a fixture changes a state file during a pass on both sides (the scenario `106-learning-tampered`); confirm the captures of `FX-33/invalid-learning` for this feature.
7. The owners of the event catalogue and of the compatibility projection: confirm that a projected learning line goes to the as-is event file of the feature for the command and to the as-is event file of the engine start for a call of the engine (F106-FR-021, D-14), and that `learning.observed` is a row of the engine class.
8. The owner of the launch contract: the derivation options `--learning-mode` and `--applied-file` and the rule of F106-FR-033 (D-13); `source_path` as a logical name in the key-name map of the launch contract under `parity` (D-12).
9. Orchestrator: `docs/ecosystem/traceability-items.tsv` names FX-29 as the proof of all 197 rows of this feature; the 21 items of clusters C-210 to C-255 are exercised by FX-33, FX-35 and FX-36, and the 10 items of C-007, C-008, C-011, C-012 and C-013 by the scenarios of FX-01. `check-traceability.py` expects 117 register rows and the register has 119.
10. Items 1 to 5 touch annexes of feature 100, whose run is in flight; they are to be settled before this feature is implemented, not during that run.

### Verification of the repairs

| Check | Result |
|---|---|
| Counts | 40 FR and 10 SC in `spec.md` and `plan.md`; 88 tasks, no id twice, no id missing between T001 and T088 |
| Test names | 115 in the spec, each with a task, and no test name of `tasks.md` that the spec lacks |
| As-is coverage | Every `origin:` id of the spec is in a `proves:` of a test task; the three `proves:` that name a requirement (F106-FR-031, F106-FR-038, F106-FR-040) are own tests |
| Tasks marked [P] that share a file | None |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Feature 106: 197 rows, 196 kept, no row named. The two errors are the register count of L11 |
| Terms | Three types of the learning stream in `spec.md`, `data-model.md`, `research.md`, `tasks.md` and the plan; `learning.observed` in the run's stream everywhere; the verbs `learning` and `retro` of `supervise` in the spec, the contract files, the tasks and the quickstart; no requirement of another tier 2 feature is cited |
| Records left as written | The sections above this one, `repair-report.md` and `checklists/requirements.md` are records of 2026-09-29 and of the cross-feature review and were not rewritten |
| Files touched | Only files under `specs/106-learning/`. Nothing under `packages/`, and nothing of feature 100 |

## Proposed upstream fixes (second round, 2026-09-30)

The owner ruled on 2026-09-30 that the items of "What another feature or the orchestrator must do (after this run)" go into feature 100 and the other features named now, before the run of feature 100 resumes. Each proposal below gives the target, the text to paste, and why. This feature is correct under every proposal as written; where a proposal is not applied, the requirement named in it stays as the feature states it. Numbers of the list above are kept in brackets.

Settled before this round, not proposed again:

- The EP-05 operation `environment`: settled (accepted from feature 148); it does not concern this feature.
- The register row for `schema` and `schema_version` of the launch contract: settled (committed as DV-120).
- The size of the register in `docs/ecosystem/check-traceability.py` (the second half of item 9): settled (fixed).
- Feature 141 (item 6): settled. The five scenarios of this feature are registered in the table "Scenarios added after the first set", and §O.3 gives the proposer verb `write` the argument `state: <logical name>`, which answers how `106-learning-tampered` changes a state file on both sides. `FX-33/invalid-learning` is a member of the pattern `invalid-<class>`. The skip that `tasks.md` T071 and T088 foresee for the tamper scenario is therefore no longer needed; T088 reduces to capturing the five registered scenarios.

### P1 [item 1] — annex X §X.6 row 111: the verb `learning` of `supervise`

Target: `specs/100-specstride/annexes/X-cross-layer.md`, §X.6, row 111 (and the generated `contracts/data/closed-sets.json` through `contracts/tools/generate.py`).

Replace the row with:

```markdown
| 111 | Verbs of `supervise` | `mode`, `resolve`, `gate`, `launch`, `watch`, `observe`, `auto`, `stop`, `hold`, `release`, and `learning` and `retro` (owner 106) | 123 | Design | Usage error, exit 2 |
```

Why: the baseline has the verb (`supervise.py:227-231` at `9c88f86`, B-2670); without the member `FX-36/learning-selection` ends as a usage error and F106-FR-032 cannot pass.

Follow-on in feature 123 (`specs/123-pipeline-runtime-and-supervisor/spec.md`, table "Closed sets", row "Verbs of `supervise`"): replace `(and `retro`, owned by 106)` with `(and `learning` and `retro`, owned by 106)`.

### P2 [item 2] — F100-FR-235: the five calls of the engine into learning

Target: `specs/100-specstride/annexes/A-foundations.md`, §A.4, F100-FR-235.

Replace the requirement text with:

```markdown
- **F100-FR-235**: The calls of the engine into learning MUST be a plain function interface of the `contracts` package at layer L2, which the composition root hands to the engine. The interface MUST have five operations: `resolve` a value and its arm for a knob and a phase at the start of a pass; `observe` an approved phase; `evaluate` the applied decisions of an approved phase; `report` the last recorded evaluation of every active decision, read-only, for the lines printed at exit; and the tamper bracket as two operations, `bracketTake` before a proposer pass and `bracketCheck` after it (F100-FR-228). It is no extension point in Wave 1. A failure of a call MUST leave the run on the value it would have had without learning, and MUST never undo an approval.
```

Why: the lines at exit (B-0305) and the bracket (B-0317) are made by the engine through learning at the baseline, and F106-FR-036 and F106-FR-037 need the two operations that the requirement did not name.

### P3 [item 3] — F100-FR-228: the bracket around a proposer pass

Target: `specs/100-specstride/annexes/B-state.md`, §B.2, F100-FR-228.

Replace the requirement text with:

```markdown
- **F100-FR-228**: When the learning mode is not `off`, the engine MUST, before each proposer pass, record the size and the hash of the leading bytes of three files that the proposer could reach: the event stream of the run, the decision log of learning and the observation of the current phase; and MUST check after the pass that those leading bytes are unchanged. Appends are allowed. A file that shrank, or whose leading bytes changed, MUST give one event `integrity.events_changed` with the phase, the phase attempt and the file, and MUST mark the run as left out of every baseline and every evaluation of learning. The engine executes the bracket through the calls of F100-FR-235; the rule and its thresholds belong to feature 106 (F106-FR-037).
```

Why: the baseline brackets each proposer pass, not a reading by a command of learning (`orchestrator.sh:1849-1868` at `9cab15d`; B-0317, B-0097, B-1223).

### P4 [item 4] — annex G §G.3: the keys of `[MOL-RETRO]` and the free form of `[MOL-NEXT]`

Target: `specs/100-specstride/annexes/G-cli.md`, §G.3, table "Keys of the supervisor lines" (and the generated `contracts/data/line-grammar.json`).

Replace the two rows with:

```markdown
| `[MOL-NEXT]` | `next`, or `poll-in`; after a retrospective, the free text `suggestion (not run): <command>` in place of the pairs |
| `[MOL-RETRO]` | Per stage: `pipeline`, `stage`, `status`, `detail`, `path`; when no stage can be read: `status`, `reason`, and `pipeline` and `path` where known; a copied evaluation line: the label, three spaces, and the line as `learn` printed it |
```

Why: these are the three as-is forms of the baseline (`supervise.py:175-190` at `9c88f86`; B-2691 to B-2693), which F106-FR-035 prints and the oracle compares.

### P5 [item 5, first half] — annex X §X.6 rows 280 and 281: two closed sets of learning

Target: `specs/100-specstride/annexes/X-cross-layer.md`, §X.6, after row 279 (and the generated `contracts/data/closed-sets.json`).

Add:

```markdown
| 280 | Kill classes read by learning | `budget` (`hard_cap`), `futility` (`repeat_stall`, `progress_stall`), `hang` (`idle_timeout`) | 106 | Design | `unknown`, counted as neither budget nor futility |
| 281 | Sources of a selected learning mode | `token`, `refusal`, `prose`, `default` | 106 | Design | `default` |
```

Why: both sets are stated in the table "Closed sets" of this feature (F100-FR-208 asks for a row), and they are the only two of its twelve sets without one.

### P6 [item 5, second half] — annex B §B.20: the three records of learning

Target: `specs/100-specstride/annexes/B-state.md`, §B.20, the table of further schema ids (and the generated `contracts/data/further-schema-ids.json`).

Add, after the row of `specstride.retrospective/1`:

```markdown
| `specstride.learn.applied/2` | An entry of the decision log of learning, one per line, byte format kept (as-is id the same; entries of `/1` are read) | `feature:<slug>:learning:decisions` | 106 |
| `specstride.learn.summary/7` | The metric summary of the runs of a feature (as-is id the same) | `feature:<slug>:learning:summary` | 106 |
| `specstride.learn.observation/1` | The observation of an approved phase (as-is id the same) | `feature:<slug>:learning:observation:<N>` | 106 |
```

Why: the three records have logical names in §B.5 and readers outside learning (validation reads the decision log, the CLI the summary), so F100-FR-227 applies. Under this proposal `tasks.md` T010 delivers these three schema files to the `contracts` package instead of `packages/learning/schemas/`; the advice rows and the result of the mode selector have no logical name and stay internal to the package with the internal form of `$id`.

### P7 [item 7] — feature 144: where a projected line of the learning stream goes

`learning.observed` is already a row of the engine class (`specs/144-compatibility-projection/contracts/projection-table.tsv`, row of `learning.observed`, shape `bash`, class `engine`): settled. What is left is the destination of the rows of the class `learning`.

Target 1: `specs/144-compatibility-projection/spec.md`, F144-FR-008. Append to the requirement text:

```markdown
A line of the writer class `learning` MUST go where the baseline writes it: to the file of the engine start when the event was recorded through a call of the engine (the evaluation after an approved phase and its automatic revert, F100-FR-235), and to the compatibility file of the learning stream of the feature when the command `learn` recorded it. Both are compared with the reference through the old side of the layout table (annex X §X.8), which maps the two as-is files to `feature:<slug>:learning:events`.
```

Target 2: `specs/100-specstride/annexes/B-state.md`, §B.5, the table of logical names (and the generated `contracts/data/layout.json`). Add one row, beside the row of the learning events, for the compatibility file of the learning stream of a feature, with these cells: the logical name that feature 100 chooses in the namespace of the feature, next to the learning events; root `control`; writer "Compatibility projection"; readers "Oracle, CLI"; content "The as-is lines of the learning stream, written only with the projection on". The name is not spelled here, because §B.5 does not hold it yet (F100-FR-226).

Why: the baseline writes learning events to the event file of the feature for the command and to the event file of the run when the engine calls learning (`learn.py:970-979`, `orchestrator.sh:2123-2124`; B-1260); F106-FR-021 depends on both places.

### P8 [item 8] — feature 107: the derivation options of learning, and `source_path` under `parity`

Target 1: `specs/107-launch-contract/spec.md`, section of the derivation requirements. Append a new requirement after F107-FR-041:

```markdown
- **F107-FR-042**: `contract derive` MUST take `--learning-mode off|suggest|apply` (default `off`) and `--applied-file <path>`. The default of `--applied-file` MUST be the decision log of learning of the feature in scope when exactly one feature is in scope, and none otherwise. Derivation MUST call the binding of the owner of learning (F106-FR-027) with the mode and the log, and MUST write the block `configuration.learning` it returns, or no block when it returns none. Every stage of kind `specstride` MUST then declare, in its action and in its action on resume, the learning mode and the bound of decisions of the block. When the mode `apply` was asked and no block results, derivation MUST write the mode `suggest` in the stages, and MUST print one line on standard error that names the reason: there are no decisions to bind (F106-FR-033). Derivation MUST NOT write `apply` without a block.
  - test: PT-106-C-210-derivation-options (the test of the owner of learning, `specs/106-learning/tasks.md` T042; this requirement carries no `origin:`, because the traceability files assign cluster C-210 to feature 106)
```

Target 2: `specs/100-specstride/annexes/X-cross-layer.md`, §X.8, the paragraph "Further maps of the normalization contract". Replace `the key-name map of the launch contract (the as-is relaunch key to `configuration.relaunch`);` with:

```markdown
the key-name map of the launch contract (the as-is relaunch key to `configuration.relaunch`; the value of `configuration.learning.source_path`, which the baseline writes relative to the repository root, to the logical name of the decision log through the old side of the layout table);
```

Why: 107 holds no derivation option for learning, although B-2470 and B-2471 are rows it calls; and the log now lies in the control plane, so `source_path` holds a logical name that the oracle must map (F106-FR-027, reading D-12).

### P9 [item 9, first half] — `docs/ecosystem/traceability-items.tsv`: the families that prove the items of this feature

Target: `docs/ecosystem/traceability-items.tsv`, column `proof`, the rows of feature `106-learning` named below. Replace `FX-29` with the family given, keeping the test pattern of the row:

| Rows (behaviour items) | Clusters | New proof |
|---|---|---|
| B-0077, B-0079, B-0097, B-0104, B-0186, B-0214, B-0303, B-0305, B-0317, B-0325 | C-007, C-008, C-011, C-012, C-013 | `FX-01; PT-106-<cluster>-*` |
| B-2470, B-2471, B-2491, B-2494, B-2495, B-2515, B-2516, B-2517 | C-210, C-213, C-214, C-218 | `FX-33; PT-106-<cluster>-*` |
| B-2561 | C-226 | `FX-35; PT-106-C-226-*` |
| B-2670, B-2678, B-2691, B-2692, B-2693, B-2735, B-2737, B-2758, B-2781, B-2782, B-2783 | C-246, C-249, C-253, C-254, C-255 | `FX-36; PT-106-<cluster>-*` |

Example of one changed line (tab-separated as in the file): `B-2561	C-226	MOL	translated	106-learning	FX-35; PT-106-C-226-*	DV-026; DV-027; DV-038`.

Why: FX-29 drives only the command `learn` with no stub; a test may claim an item only if its fixture executed the evidence line (feature 141 §O.1 rule 6). The families above are those that `tasks.md` names for the tests of these items.

### P10 [item 10] — timing

No text. Proposals P1 to P6 and P8 (second target) touch generated data of feature 100 and are applied before the run of feature 100 resumes, as the owner ruled; after each, `contracts/tools/generate.py` regenerates the data files and `npm run test:static --workspace @specstride/testkit` stays green.
