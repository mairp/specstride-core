# Analyze report: 107-launch-contract

Run 2026-09-29 on spec.md, plan.md, tasks.md. Read-only analysis; two passes, one repair.

## Coverage

| Check | Result |
|---|---|
| Functional requirements | 39 (F107-FR-001 to F107-FR-039), under the limit of about 45; no split proposed |
| Success criteria | 9; each has a test task (T014, T059, T043, T047, T032, T060, T049, T062) |
| As-is ids kept (011 FR-001, 002, 004, 005, 006, 008, 009, 010) | Each in an `origin:` and in a `proves:` |
| Clusters C-209 to C-213, C-216, C-218 to C-224, C-232 to C-236 | Each cited in an `origin:` (items also cited by id) and in a `proves:` |
| Superseded rows (011 FR-027, B-2520, B-2640) | Listed under "As-is behaviour not carried" with DV-038 |
| Constitution gates | All answered in plan.md; no violation |
| `NEEDS CLARIFICATION` markers | None |

## Findings and repairs

| # | Finding | Severity | Repair |
|---|---|---|---|
| 1 | F107-SC-008 and F107-SC-009 had no test task | Medium | Added T062 |
| 2 | One acceptance scenario used "gate" and "check" bare | Low | Written as "launch check, terms gate" |

## Remaining

| # | Item | Note |
|---|---|---|
| 1 | `check-traceability.py` line `[h2] ... still cites a register row to be written (DV-new-n)` for F107-FR-009, 011, 034, 035, 036 | Expected: DV-096 (judgment exchange and delegation) and DV-097 (comment, verification mode, contract fields) await rows from the orchestrator |
| 2 | Two options have no row in annex X §X.7 | `derive.judgment.harness` and the ceilings `supervise.maxRelaunches`, `supervise.wallClockSeconds`; reported |
| 3 | Assumptions CQ-035 to CQ-038 | Reported with recommended answers |

## After the cross-feature review

Dated 2026-09-30. Repairs of act 8.6; the items are in `repair-report.md`.

### What changed

| File | Change |
|---|---|
| `spec.md` | F107-FR-008 and F107-FR-037 follow CQ-190: no declared reads and writes from repository text; the field is `configuration.scopes`; an undeclared command runs alone. New F107-FR-040 with the closed set of ten error classes (CQ-194). F107-FR-034 cites annex B §B.5 and F100-FR-229. F107-FR-030 names no runtime. Defaults of row 48. Section "Repairs after the cross-feature review" |
| `plan.md` | Package `@specstride/pipeline`, layer L5, directory `packages/pipeline/src/contract/`; ports for what the package may not import; validator and hasher by reference; test directories of feature 100; Constitution Check in the form of the template, v3.0.0; section Complexity Tracking |
| `tasks.md` | Every task path renamed (T002 and the paths of 54 further tasks); 16 test names of `spec.md` added to the parity tasks; members of `FX-33/invalid-<class>` named; T061 rewritten; T063 and T064 added |
| `data-model.md`, `research.md`, `quickstart.md`, `contracts/commands.md` | The same terms: `configuration.scopes`, error class, payload check, the comment record |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Functional requirements | 40 (F107-FR-001 to F107-FR-040), under 45; success criteria 9 |
| Tasks | 64 (T001 to T064) |
| Requirement without a task | None. F107-FR-040: T063 (test), T064. F107-FR-008: T013, T019. F107-FR-037: T050, T054 |
| Task without a requirement | None among the changed ones. T061 is a request and proves nothing |
| Test names of `test:` lines against `tasks.md` | 44 names, every one is in a task (a name that ends in `*` is met by a task name with that prefix) |
| Term "payload gate" | None left in the feature; "payload check" in all files |
| Path `packages/launch-contract` | None left, except the sentence of `plan.md` that withdraws the proposal |
| Field name of the declarations | `configuration.scopes` in `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `research.md`, `quickstart.md`; equal to annex G §G.8 |
| Names of the error classes | Equal in `spec.md`, `data-model.md` and `tasks.md`, and equal to the members of `FX-33/invalid-<class>` in `specs/141-parity-oracle/contracts/fixture-catalogue.json` |
| Default of `supervise.maxRelaunches`, `supervise.wallClockSec` | "2; derived", as row 48 of annex X §X.7; F107-FR-024 and F107-FR-025 already gave 2 |
| Paid task | T057 only; a precondition of no task |
| Earlier "Remaining" rows 1 and 2 of this report | Closed: DV-096 and DV-097 exist in the register, rows 47 and 48 exist in annex X §X.7 |

### Remaining

| # | Item | Note |
|---|---|---|
| 1 | No row of annex X §X.6 holds the error classes | Reported for feature 100 |
| 2 | The class `not-promoted` is raised by the renderer at the baseline, and the family FX-33 drives the verb `contract-validate` | Reported for feature 141 |
| 3 | Assumptions CQ-024, CQ-035 to CQ-037, CQ-190, CQ-194 | Open in the queue; the spec proceeds on the recommended answers |

## Second analyze run

Dated 2026-09-30, after the cross-feature review, the constitution patch v3.0.1 and the closure of the clarification round. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/commands.md`, `repair-report.md`, the constitution v3.0.1; of feature 100 the annexes B (§B.4, §B.5, §B.7), C (§C.9), F (§F.7, §F.8), G (whole), H (§H.1) and X (§X.5 to §X.9), the generated record schema `launch-contract.schema.json`, the package graph, the contracts README and the tasks T195, T196; the fixture catalogue and the rules of feature 141; the requirements of features 104, 105, 106, 110, 111, 113, 122 and 123 that touch this feature; the queue `docs/ecosystem/CLARIFY-QUEUE.md`; the divergence register; the behaviour inventory R18 (the 79 rows of this feature) and the traceability tables; and the baseline code, read with `git show 9c88f86:<path>`: `bootstrap_contract.py`, `contract_lib.py`, `validate_contract.py`, `render_launcher.py`, the start of `runtime.py`, `references/derivation.md` and `references/contract.md`.

Coverage before the run: 40 FR, 9 SC, 64 tasks, 100 per cent; every test name of the spec had a task (44 of 44); 77 of 77 kept behaviour items and the 8 kept as-is requirements placed and proved. One CRITICAL finding and four HIGH. 31 of the 33 findings were repaired on the same day at the owner's instruction ("propose and resolve any issue automatically if you find it with the best suggestion"); two are recorded and not changed. The repair record of the spec is the section "Repairs after the analyze run of 2026-09-30". The CRITICAL finding is repaired as far as this directory reaches: the register row and the map entry it needs are the orchestrator's (item 1 below).

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| K1 | Constitution (Principle XVIII) | CRITICAL | F107-FR-005, F107-FR-012 vs the divergence register and annex X §X.8 | The draft carries `schema` with `specstride.launch-contract/1`; the baseline carries `schema_version` with `1.0` and refuses another value with `schema_version must be '1.0'` (`bootstrap_contract.py:344`, `contract_lib.py:663`; B-2488, B-2521). The two requirements cite DV-066 and DV-059, which say nothing of the field, and the key-name map of the launch contract holds the relaunch key only. An intended difference without a register row is found as a test failure on FX-32 and FX-33, which the principle forbids. The same case got DV-116 and N-29 for the inventory of a reverse run | **Repaired here**: both requirements state the pair; the text of the row and of the map entry is in the spec ("Assumptions"); `generated_by` and the stamp keep the member names of the baseline so that no second key differs. **Open upstream** (item 1): the row itself |
| C1 | Coverage | HIGH | F107-FR-005, F107-FR-009, F107-FR-014, F107-FR-017; user story 1; T022; annex B §B.5 | No requirement and no task said who writes the stages, the settled coverage, the preconditions of present prerequisites, the verification-commands document (annex B §B.5 names derivation as its writer; F113-FR-010) or who closes the bootstrap finding. DV-096 takes the writing from the host; the draft has no stage, validation refuses that, and the host may only pick choices. User story 1 "ends in a validated launch contract" could not be reached | **Repaired**: new F107-FR-041 with the table "Judgment items"; CT-107-19; T065, T066, T067 |
| I1 | Inconsistency (control of threat T-09) | HIGH | F107-FR-034, F107-FR-035, user story 3, `contracts/commands.md` vs F113-FR-002 and F107-FR-020 | The comment was an argument of `launch` only and was to be stored "before any repository text is printed". Derivation runs before `launch` and prints excerpts of the repository; and `configuration.comment` must be in the launch contract before promotion freezes it | **Repaired**: `contract derive` takes the comment and records its hash before it prints; `launch` takes it again, compares and stores the text; a difference is refused (`comment-changed`) |
| I2 | Inconsistency (Principle XIX) | HIGH | F107-FR-006 vs F107-FR-009, F107-FR-039; F107-FR-027 | `contract derive` printed the whole draft on standard output by default. The draft holds the text of every task (about 190,000 tokens on the project of R17 F6), the host must never open it, and output must not echo repository text. The commands also took paths of state, which a host may not name | **Repaired**: the draft is printed only in compatibility output; in default output it goes to its logical name with one line; arguments accept logical names |
| I3 | Inconsistency (Principle XVIII) | HIGH | F107-FR-004 | "Fenced blocks of kind plain, `bash`, `sh`, `shell` or `console`" reads as a correct fence parser. The baseline opens a block only at such a fence, so a fence of another kind opens nothing and its closing fence opens a plain block that runs to the next bare fence (`bootstrap_contract.py:161-187`). Every plan of Spec Kit holds a `text` block, so the inventory of a port that follows the sentence differs from the reference. Empty and unclosed blocks were not mentioned | **Repaired**: the reading is stated line by line and the accident is named as preserved; scenario `FX-32/107-plan-with-other-fence` (T001, T011) |
| I4 | Inconsistency | MEDIUM | F107-FR-033, plan (Dry-run), T052 vs annex G §G.1 and F113-FR-002 | "`launch` MUST derive and validate." Annex G §G.1 gives derivation to the launch-contract commands, the host skill calls them before `launch`, and a derivation with judgment items cannot end inside one call. F107-SC-003 forbade a harness start that a delegated judgment of the same sequence makes | **Repaired**: `launch` never derives; `dry-run` validates again, reports, exits 0 (20 without a promoted launch contract, 23 stale); the criterion names `launch` |
| I5 | Inconsistency (with feature 123) | MEDIUM | F107-FR-038, plan (ports), T007 vs F123-FR-006 | Both features printed the parallel plan of a dry run, and the plan of this feature took it through a port | **Repaired**: printed once, by the pipeline entry; no port; EP-04 left the table of extension points |
| I6 | Inconsistency | MEDIUM | `assumption:` lines, Assumptions, `research.md`, this report ("Remaining" row 3) | CQ-024, CQ-035 to CQ-038, CQ-190 and CQ-194 were closed in the queue on 2026-09-30; the files called six of them open | **Repaired** |
| I7 | Inconsistency (Principle XV) | MEDIUM | F107-FR-032, F107-FR-035, Clarifications vs F113-FR-005 | "The mode MUST NOT be chosen from the request's prose" beside "a refusal in the comment MUST beat an invitation" and "the comment MAY select the mode `dry-run`"; the clarification answered "No" | **Repaired**: the CLI reads no prose; the host turns a refusal in the comment into the argument and names the option; prose outside the comment never chooses |
| I8 | Inconsistency (Principle XVIII) | MEDIUM | F107-FR-013 to F107-FR-017, F107-FR-022 vs `contract_lib.py:656-948`, `validate_contract.py:92-112` | Rules that differed from the code or were missing: the total time limit of a recovery read as required (optional); `command_success` had no rule; sources may not be empty; arguments must be non-empty; the provenance rule and the verification-commands file are strict rules only; the nine rules that `--allow-draft` skips were not listed; the lines of a failed validation without `--promote` and of stale sources were not stated | **Repaired** |
| I9 | Inconsistency | MEDIUM | F107-FR-018; plan (Structure Decision) | "When validation recomputes the effective learned values": at the baseline only derivation computes them (`bootstrap_contract.py:403`), and F106-FR-027 owns the rule. The package may not import the package of learning, and nothing said how its rules arrive | **Repaired**: the sentence; a second port for the rules of the binding (plan, T007, T034) |
| I10 | Inconsistency (with feature 100) | MEDIUM | T003, T005, plan (One schema) vs `contracts/README.md`, T195, T196 of feature 100 | T003 added the schema file of the launch contract to `@specstride/contracts`. Feature 100 generates that file from annex G §G.8, forbids its edit, and builds the type and the record-level validator; the generated schema has no rule per item | **Repaired**: this feature writes the schemas of its items in its own package, with internal ids, and joins them by reference; item 7 below |
| I11 | Inconsistency | MEDIUM | F107-FR-026 vs F107-FR-014, F107-FR-016, F107-FR-030; F123-FR-010 | State is to be named by logical name, and every path must lie inside the authorized roots, while the control plane lies outside the working tree. The launcher named the bundle "by relative location", which the same fact forbids | **Repaired**: a logical name is resolved through the layout and is outside the rule of the roots; the launcher names the bundle by logical name. Item 5 below for the stage executor |
| I12 | Underspecification | MEDIUM | F107-FR-029, F107-FR-031, F107-SC-004 vs F123-FR-021, annex G §G.4 | "The hash of the launch bundle" had no definition (the address is a prefix of the hash of the launch contract). Through `launch` an edited launcher is refused by the launch check `launcher-intact` with the refusal code of `launch`, not with 20 | **Repaired**: the bundle has a manifest and its hash is the bundle's; the four assertions; which check refuses where |
| U1 | Underspecification | MEDIUM | F107-FR-035, F107-FR-025, F107-FR-036; T045 | Nothing said how the CLI learns what the comment changed, which options a comment may select, or what a widening value does. "Unless the request or the sources justify a departure" asked a judgment that the CLI cannot make. The reason of the verification mode had no place | **Repaired**: `--comment-selects` with four options and the narrowing check; the relaunch block from the two keys of configuration; the reason is computed and printed |
| U2 | Underspecification | MEDIUM | F107-FR-010; plan (Batching); annex G §G.8; annex B §B.5 | A judged coverage entry was to carry provenance, and annex G §G.8 gives a coverage entry no such member. The plan kept a cursor "in the control plane", a state file with no logical name and no row of annex B §B.5 (F100-FR-051) | **Repaired**: items, answers and provenance live in the draft, `inventory.judgment`; no cursor file |
| U3 | Underspecification | MEDIUM | F107-FR-037 | "Only from user configuration, the environment or a flag" named no key. `loop.parallel.scopes.<taskId>` exists for a task; the list of feature 110 holds no key for the reads and writes of a verification command | **Repaired** for the task scope; item 4 below for the second key |
| U4 | Underspecification (Principle XVIII) | MEDIUM | F107-FR-020, F107-FR-021 vs `validate_contract.py:27-37, 81-98` | The rewrite ends with a line end and puts the stamp last; a set-back removes the stamp; stale sources rewrite nothing. `--promote` on a file that cannot be read replaces it by a record with the status `draft` only: an accident that the spec neither preserved nor fixed | **Repaired**: stated; the accident is preserved (reading 8 below); scenario `FX-33/107-promote-unreadable` |
| U5 | Underspecification | MEDIUM | Naming; `data-model.md` | "Field names are those of annex G §G.8", which names no member of a nested record. FX-32 compares the draft, and F104-FR-008 asks that the inventory equal the reference's | **Repaired**: the member names of the baseline are listed in `data-model.md`; T001 confirms them by capture |
| U6 | Underspecification | MEDIUM | F107-FR-002, `contracts/commands.md` vs F106-FR-027, F106-FR-033 | `contract derive` has the options `--learning-mode` and `--applied-file` (B-2470, B-2471, owner 106); this feature's command did not list them, and nothing wrote the block into the draft | **Repaired** |
| C2 | Coverage | MEDIUM | F107-FR-011, F107-FR-035, F107-SC-002, Clarifications | "Recorded in the digest" and "shown in events and the digest" named no line. Annex G §G.3 now holds `[SPECSTRIDE-DIGEST]` with `comment`, `changed` and `delegated` (F123-FR-043); the clarification still said "feature 100 is asked for a field". The event catalogue of feature 111 has no event that carries the three facts | **Repaired** in the requirements and the clarification; item 3 below for the event |
| C3 | Coverage (tasks) | MEDIUM | T046, T051, T013, T059; "Dependencies" | User story 3 needed `launch` (T051), which stood in the later story; no file was named for the verb wiring of `launch`; T046 cited FX-36, a family that does not list this feature and that a characterization test does not run; no task ran the conformance suite of EP-07 on this source | **Repaired**: T046 and T051 moved to the foundation; `packages/cli/src/commands/launch.ts`; the fixture line left T046; T013 runs the suite |
| A1 | Ambiguity | MEDIUM | F107-FR-009, F107-FR-010 | "A short excerpt" had no cap and did not pass the redactor; a choice had no id; the form of an answer and the code of a refused answer were not said; a draft without items was not covered | **Repaired**: a cap as data (starting value in the plan), redaction, choice ids, answers as arguments, exit 2, the batch of zero items |
| K2 | Constitution (plan) | MEDIUM | plan, Constitution Check | Row XVII answered a rule about prerequisites of a launch contract; the principle is about test tiers and skips. The check named v3.0.0 | **Repaired**: row XVII rewritten; read again against v3.0.1; rows I, III, XI, XIII, XVIII and XIX carry the new reasons |
| L1 | Underspecification | LOW | F107-FR-001, F107-FR-002, F107-FR-003 | The id rule lacked the removal of a hyphen at either end (a draft id could fail F107-FR-013); "each of the two is null" differs from the code; the message lacked its path; the line count and the origin of each hash were not said | **Repaired** |
| L2 | Inconsistency | LOW | "Closed sets"; "Contracts of feature 100 used"; F107-FR-012 | Rows 256 to 261 of annex X §X.6 exist and were not cited; rows 47 and 48 and annex B §B.4 were missing from the table; a key under `x-` is ignored by the common rule | **Repaired**; five sets have no row (item 2 below) |
| L3 | Ambiguity | LOW | F107-SC-003, F107-SC-004, F107-SC-008 | "`dry-run` executions"; "edits of the launch contract" (which copy); "other obligations found" | **Repaired** |
| L4 | Inconsistency (plan) | LOW | plan: Scale, Storage, Performance Goals, tree | "11 as-is requirements" (9 received); the launch record listed as this feature's storage; a budget that no task measures; `ports.ts` and the schemas missing from the tree | **Repaired** |
| L5 | Inconsistency | LOW | `quickstart.md`, `contracts/commands.md` | Steps and rows that followed the old reading (paths, the comment at `launch` only, no completion) | **Repaired**; the product lines of this feature are listed |
| L6 | Underspecification | LOW | F107-FR-008; table of error classes | The three operations of EP-07 were not named; the three rules of the learning variables stand inside the action validator at the baseline and F106-FR-028 gives them the class `learning` | **Repaired** |
| L7 | Inconsistency | LOW | T061; this report, "Remaining" rows 1 and 2 | T061 asked feature 100 for a row of annex X §X.6 that exists (274); feature 141 drives `invalid-not-promoted` through `launcher-render` since its re-check | **Repaired**: T061 hands over the list below |
| D1 | Duplication | LOW | F107-FR-019 (last two sentences) vs F107-FR-020; F107-FR-029 and F107-FR-030 (what the oracle compares) vs rules N-11 and N-17 | The same rule in two places | Not changed: each sentence is the statement its requirement is tested by |
| L8 | Tooling | LOW | `docs/ecosystem/check-traceability.py` | The check fails with 2 errors on the register count (DV-118, DV-119). Feature 107: 79 rows, 77 kept, none named | Not changed: outside this directory |

### Coverage after the repairs

| Requirement keys | Has task? | Task ids | Notes |
|---|---|---|---|
| F107-FR-001 to F107-FR-006 | Yes, each | T009, T010, T011, T016 to T018, T020, T021, T058 | F107-FR-006 also by CT-107-17 |
| F107-FR-007, F107-FR-008 | Yes, each | T012, T013, T019 | T013 runs the conformance suite of EP-07 |
| F107-FR-009 to F107-FR-011 | Yes, each | T014, T015, T022, T023, T055, T056, T057 | — |
| F107-FR-012 to F107-FR-018 | Yes, each | T003, T005, T024, T025, T033, T034 | — |
| F107-FR-019 to F107-FR-022 | Yes, each | T024, T026, T035, T037 | — |
| F107-FR-023 to F107-FR-026 | Yes, each | T027, T031, T033, T036 | — |
| F107-FR-027 to F107-FR-031 | Yes, each | T028 to T030, T032, T038 to T041 | — |
| F107-FR-032, F107-FR-033 | Yes, each | T046, T047, T051, T052 | T046 and T051 are in the foundation |
| F107-FR-034, F107-FR-035 | Yes, each | T042 to T045 | — |
| F107-FR-036 to F107-FR-039 | Yes, each | T048 to T050, T053, T054, T058 | — |
| F107-FR-040 | Yes | T063, T064 | — |
| F107-FR-041 | Yes | T065, T066, T067 | New |
| F107-SC-001 to F107-SC-009 | Yes, each | The last table of `tasks.md` | — |

Constitution alignment: finding K1 touches Principle XVIII and stays open upstream (the register row). Findings I3, I8 and U4 touched the same principle and are repaired in the specification. K2 was a wrong answer of the plan, not a violation. Nothing is justified in Complexity Tracking, which stays empty. All twenty principles are answered against v3.0.1.

Unmapped tasks: T001 (captures and the two added scenarios), T002, T004, T006, T007, T008 (setup and foundation), T060 (the run of the three families), T061 (the hand-over). They map to the plan and to no single requirement.

### Metrics after the repairs

| Metric | Value |
|---|---|
| Functional requirements | 41 (F107-FR-041 added; none renumbered) |
| Success criteria | 9 |
| Tasks | 67 (T065 to T067 added; T046 and T051 moved; 46 changed in place, the two moved ones among them; 18 unchanged) |
| Test names of the spec, each with a task | 45 of 45 (CT-107-19 added) |
| Requirements with at least one task | 100 % |
| Behaviour items and kept as-is requirements placed and proved | 77 of 77; 8 of 8 |
| Ambiguity count | 2 (A1, L3), repaired |
| Duplication count | 1 (D1), kept |
| Critical issues | 1 (K1): repaired in this directory, open upstream |
| Open readings | 0 in the queue (the seven questions were closed on 2026-09-30) |

### Readings this run chose

Each has another answer that the owner may prefer. The rows of `research.md` are 18 to 28.

| # | Reading | Other answer |
|---|---|---|
| 1 | The CLI completes the draft by fixed rules: one `specstride` stage per feature, a precondition per prerequisite answered `mapped`, coverage by fact (F107-FR-041) | More kinds of judgment item, through which the host shapes the stages |
| 2 | What each of the four kinds of item asks, its choices and what an answer writes (the table "Judgment items"). A blocker found by fact can be `accepted`, which leaves the command out | `resolve-blocker` offers only "keep an open blocker", so that every conflict of declarations keeps the launch contract a draft |
| 3 | A derived stage has one stage attempt and the default time limit of 3,600 seconds. **This ends a long run at the stage limit; the owner should rule**, by a key of feature 110 or by taking the wall-clock budget of the run | A default of several hours written by derivation |
| 4 | The comment goes to `contract derive` (hash first) and again to `launch` (compare, store) | The redacted text is kept in the launch contract and `launch` takes no comment |
| 5 | The host names what the comment selected (`--comment-selects`); the CLI checks that it narrows | The CLI compares the options with the defaults and attributes every narrowing to the comment |
| 6 | The relaunch block is written from `supervise.maxRelaunches` and `supervise.wallClockSec` when one differs from its default | Options of `contract derive` of their own |
| 7 | `launch` never derives; `dry-run` exits 0 with the report even when a launch check would refuse | `launch` derives where no item is open; a refusing launch check gives the refusal code |
| 8 | `--promote` on a file that cannot be read keeps the accident of the baseline (the file is replaced by a record with the status `draft`) | A register row that fixes it: nothing is written when the file cannot be read |
| 9 | The draft is printed on standard output only in compatibility output | A flag that selects the old behaviour in default output |
| 10 | The state of the judgment exchange is `inventory.judgment` in the draft | A logical name of its own in annex B §B.5 |
| 11 | The item schemas live in this feature's package and are joined to the generated record schema | Annex G §G.8 gets a table per item and the generator writes one schema |
| 12 | The starting value of the excerpt cap is 480 bytes (plan; low confidence) | Tuned by the payload check of T059 |

### What another feature or the orchestrator must do (after the second run)

1. Orchestrator and feature 100: write the register row for `schema_version` and `schema` (text in `spec.md`, "Assumptions") and add the pair to the key-name map of the launch contract in annex X §X.8, as DV-116 and N-29 did for the inventory of a reverse run. Feature 106 asks the same map for `source_path` (its report, item 8). Until then T010 and T024 cannot read `equal` on that member.
2. Feature 100, annex X §X.6: five closed sets of this feature have no row: the timing of a check; the options a comment may select; the reason of the verification mode; the choices of a judgment item; and the two refusals `unknown-mode` and `comment-changed`, which belong in the closed set of the refusals of a launch (owners 122 and 123).
3. Feature 111 (event catalogue) and feature 123: F123-FR-043 prints `comment`, `changed` and `delegated` "from the events of the run", and no event of the catalogue carries them. This feature supplies the facts: the comment record, `configuration.comment` and the provenance in `inventory.judgment`.
4. Feature 110: a key for the declared reads and writes of a verification command (user file, environment and flag only; widening), which F107-FR-037, F105-FR-020 and F148-FR-011 need; and a key for the time limit of the action of a derived stage, or the owner's ruling of reading 3.
5. Feature 123: F123-FR-010 resolves a condition path by the prefix of the workspace part; F107-FR-026 names state by logical name, and the stage executor must resolve it through the same layout function as validation. The launcher, the pipeline entry and the runtime root call the integrity check of F107-FR-031 before any launch check of the pipeline. `launch` in the mode `dry-run` calls the dry-run plan of F123-FR-005. The launch check `contract-validated` can read the error class of F107-FR-040 in the place of the text of an error.
6. Feature 113: the comment is passed to `contract derive` and to `launch` (F113-FR-007 says "as one argument" and names no command); the skill names what the comment selected with `--comment-selects`; it passes logical names, never paths of state; the order of F113-FR-002 stands.
7. Feature 100, tasks T195 and T196, and the contracts README: the record schema and its validator stay feature 100's; this feature joins its item schemas by reference. If the owner prefers one generated schema, annex G §G.8 needs a table per item (reading 11).
8. Feature 105: the time limit (`timeoutSec`) and the working directory of a command that is declared literally in the plan and mapped to a phase by an answer, which F107-FR-041 (c) writes into the verification-commands document in the shape of F105-FR-016; no requirement of 105 gives a default.
9. Feature 141: register the two scenarios of T001 (`FX-32/107-plan-with-other-fence`, `FX-33/107-promote-unreadable`). The family FX-36 needs no change: this feature no longer cites it.
10. Feature 106: the rules of the binding are handed to this feature as a port by the command wiring (its T049 exports them); nothing to change.
11. Orchestrator: `check-traceability.py` expects 117 register rows and the register has 119.
12. Items 1, 2 and 7 touch annexes of feature 100, whose run is in flight; they are to be settled before this feature is implemented, not during that run.

### Verification of the repairs

| Check | Result |
|---|---|
| Counts | 41 FR and 9 SC in `spec.md` and `plan.md`; 67 tasks, no id twice, no id missing between T001 and T067 |
| Test names | 45 in the spec, each with a task, and no test name of `tasks.md` that the spec lacks |
| Requirements without a task | None |
| As-is coverage | The 79 behaviour items of this feature are each in an `origin:` or under "As-is behaviour not carried"; B-2489 is cited as dropped; no item of another feature is claimed |
| Tasks marked [P] that share a file | None |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Feature 107: 79 rows, 77 kept, no row named. The two errors are the register count of L8 |
| Terms | "cursor" survives only in sentences that say there is none; no sentence gives `launch` the derivation; the comment is an argument of `contract derive` and of `launch` in `spec.md`, `plan.md`, `tasks.md`, `quickstart.md` and `contracts/commands.md`; `inventory.judgment` in `spec.md`, `plan.md`, `tasks.md`, `data-model.md` and `research.md`; EP-04 is named only to say that it is not consumed |
| Records left as written | The sections above this one, `repair-report.md` and `checklists/requirements.md` are records of 2026-09-29 and of the cross-feature review and were not rewritten. "Remaining" rows 1 to 3 of the section before this one are closed by findings L7 and I6 |
| Files touched | Only files under `specs/107-launch-contract/`. Nothing under `packages/`, nothing of feature 100, no file of `docs/` |

## Proposed upstream fixes (second round, 2026-09-30)

Ruled by the owner on 2026-09-30, late evening: the items of "What another feature or the orchestrator must do (after the second run)" go into feature 100 and the other features named, before the run of feature 100 resumes. Each item below gives the target, the text to paste, and why. Text between the lines "Replace" and "With" is quoted from the target as it stands on 2026-09-30. Nothing here names a logical name that annex B §B.5 does not hold, or a physical path. This section changes no other file; the companion changes of this feature, at the end, are applied together with the upstream items.

### Settled before this round (skipped)

- Item 1, the register row for `schema` and `schema_version`: settled, committed as DV-120. Its key-name map entry is not yet in annex X §X.8, and is P-1 below.
- Item 11, the size of the register in `docs/ecosystem/check-traceability.py`: settled (fixed).
- The operation `environment` of EP-05: settled (accepted from feature 148); not an item of this feature.
- Item 10, feature 106: nothing to change; its task T049 already exports the rules of the binding, and the command wiring hands them over as a port.
- Item 12 was a note on timing, not a change; this round settles it.

### P-1 Feature 100, annex X §X.8, paragraph "Further maps of the normalization contract" (item 1, the map entry that DV-120 names)

Why: DV-120 says "Mapped: the key-name map of the launch contract gains the pair `schema_version` and `schema`", and the map still holds the relaunch key only, so FX-32 and FX-33 cannot read `equal`.

Replace:

> the key-name map of the launch contract
> (the as-is relaunch key to `configuration.relaunch`);

With:

> the key-name map of the launch contract
> (the as-is relaunch key to `configuration.relaunch`; the as-is key `schema_version` with the value `1.0` to the key `schema` with the value `specstride.launch-contract/1`, register row DV-120, which also applies to the text of a message of validation that names the key);

And in F100-FR-214, replace `  - divergence: DV-006; DV-027; DV-055; DV-021` with `  - divergence: DV-006; DV-027; DV-055; DV-021; DV-120`.

### P-2 Feature 100, annex X §X.6, table of closed sets: four new rows after row 278, as rows 282 to 285 (item 2)

Why: F100-FR-208 asks for a row for every closed set, and F100-FR-209's static test fails without one; these four are stated in `spec.md`, "Closed sets", and have none. Rows 279 to 281 are left to their present holders.

```
| 282 | Timing of a check of a launch contract | `preflight`, `stage` (default `stage`); a postcondition may not have `preflight` | 107 | Design | The launch contract is invalid |
| 283 | Options that the consumer's comment may select | `features`, `relaunch`, `learning`, `mode` | 107 | Owner decision | The call is refused (F107-FR-035) |
| 284 | Reason of the verification mode that derivation sets | `declared`, `configured` | 107 | Design | The build fails: the reason is computed, never read |
| 285 | Choices of a judgment item | `mapped`, `optional`, `out-of-scope`, `specstride-phase:<n>`, `accepted`, `keep-blocker` | 107 | Design | The answer is refused (F107-FR-010) |
```

### P-3 Feature 100, annex X §X.6, row 212: two members for the refusals that `launch` raises (item 2)

Why: `unknown-mode` and `comment-changed` are refusals of a launch (F107-FR-032, F107-FR-034), and the launch record's field `refusal` takes its values "from the closed sets of the refusals of a launch and of `resume`" (annex B §B.7); a refusal outside the set is unknown to every reader.

Replace:

```
| 212 | Refusals of a launch written by the detached runtime | `lock-conflict`, `foreign-owner`, `owner-dead-group-alive`, `lock-unknown`, `provider-mismatch`, `detach-unavailable`, `detach-not-ready`, `control-root-not-writable`, `unadopted-approvals`, `launch-abandoned` | 122 | Design | Shown as text; the launch stays refused |
```

With:

```
| 212 | Refusals of a launch written by the detached runtime and by `launch` | `lock-conflict`, `foreign-owner`, `owner-dead-group-alive`, `lock-unknown`, `provider-mismatch`, `detach-unavailable`, `detach-not-ready`, `control-root-not-writable`, `unadopted-approvals`, `launch-abandoned`; `unknown-mode`, `comment-changed` (raised by `launch` before the handshake, feature 107) | 122; the last two 107 | Design | Shown as text; the launch stays refused |
```

Note for feature 122: its own table of closed sets names one more member for row 212 than the annex does; that difference is 122's and 100's to reconcile and is not changed here.

### P-4 Feature 111, `contracts/event-catalogue.tsv`, and `spec.md` table of event groups (item 3)

Why: F123-FR-043 prints `comment`, `changed` and `delegated` "from the events of the run", and no event carries them; the runtime root reads the comment record and the launch contract at the start of each launch, so `pipeline.started` is the one event that can carry them without a new writer.

In `contracts/event-catalogue.tsv`, replace the line

```
pipeline.started	open	pipeline.ended	pipelineId,mode,stages,launcherRef	
```

with

```
pipeline.started	open	pipeline.ended	pipelineId,mode,stages,launcherRef,commentHash,comment,changed,delegated	comment:comment
```

In `spec.md`, table of event groups, replace the cell `stage id and kind, reasons, exit codes, decision` of the row "Pipeline and supervisor" with:

> stage id and kind, reasons, exit codes, decision; on `pipeline.started` the hash of the consumer's comment, the comment itself through the ingress class `comment`, the options it changed and the harness a judgment was delegated to (feature 107, F107-FR-035, F107-FR-011)

### P-5 Feature 123, `spec.md`, F123-FR-018 and F123-FR-043 (item 3)

Why: the emitter must fill the four fields of P-4, and F123-FR-043 must name where each key comes from.

In F123-FR-018, after the sentence that names `pipeline.started`, add:

> `pipeline.started` MUST carry, where the launch holds them, `commentHash` (from the launch record), `comment` (from the comment record beside the launch record, through the ingress class `comment`), `changed` (the options of `configuration.comment` of the launch contract, as a list of option names) and `delegated` (the harness ids that the provenance of the judgment answers of the launch contract names with the route `delegated-harness`).

In F123-FR-043, after "from the events of the run and never from text that a host composed.", add:

> The keys `comment`, `changed` and `delegated` MUST be read from the fields `commentHash`, `changed` and `delegated` of the newest `pipeline.started` of the run; `comment` shows the hash and never the text.

### P-6 Feature 110, `spec.md`, the key list (table of the section that holds `derive.judgment.harness`), and F110-FR-019 (item 4)

Why: F107-FR-037, F105-FR-020 and F148-FR-011 need a key from which the declared reads and writes of a verification command enter with the provenance of user configuration, the environment or a flag; and a derived stage of kind `specstride` runs a whole engine start, which the default time limit of 3,600 seconds of a hand-written action would cut (reading 3 of this report, decided here: a key with a default of one day).

Add these rows after the row of `supervise.wallClockSec`:

```
| `derive.stageTimeoutSec` | whole number of seconds, at least 1 | 86400 | F E U; P lowers | N `lo` | t | 107. The time limit of the action of a stage that derivation writes (F107-FR-041) |
| `verification.scopes.<commandId>.reads` | list of path prefixes, or `tree` | none | F E U | W | p | 107; read by 105 and 148 through the launch contract (`configuration.scopes`). Not used under `parity` |
| `verification.scopes.<commandId>.writes` | list of path prefixes | none | F E U | W | p | 107; read by 105 and 148, as above |
| `verification.scopes.<commandId>.sideEffects` | `none`, or unset | unset | F E U | W | p | 107; read by 105 and 148, as above |
```

In F110-FR-019, replace `` `loop.parallel.scopes.<taskId>`, `state.dir`, endpoints and credentials. `` with `` `loop.parallel.scopes.<taskId>`, `verification.scopes.<commandId>.reads`, `.writes` and `.sideEffects`, `state.dir`, endpoints and credentials. ``

### P-7 Feature 123, `spec.md`, F123-FR-010, F123-FR-005 and F123-FR-018 (item 5)

Why: F107-FR-026 names the state of a feature in a condition or evidence path by logical name, and the executor must resolve it as validation does; F107-FR-031 needs its check called before any launch check of the pipeline; F107-FR-033 needs the dry-run plan from `launch`.

In F123-FR-010, replace:

> A condition path that begins with the name of the workspace part MUST be resolved under the workspace part, and the as-is fallback to the state directory of a legacy product MUST NOT be carried;

with:

> A condition path or an evidence path that is a logical name of annex B §B.5 MUST be resolved through the state layout, by the same function that validation of the launch contract uses (F107-FR-026), and is outside the rule of the authorized roots; a condition path that begins with the name of the workspace part MUST be resolved under the workspace part; the as-is fallback to the state directory of a legacy product MUST NOT be carried;

In F123-FR-005, after the first sentence, add:

> The plan MUST also be printed when `launch` in the mode `dry-run` asks for it (F107-FR-033); the call reads and writes as the dry run does.

In F123-FR-018, at its start, add:

> Before any launch check of the pipeline and before any stage, the launcher, the pipeline entry and the runtime root MUST call the integrity check of the launch bundle and the launcher of feature 107 (F107-FR-031), and a failure MUST end the start with exit 20.

The remark of item 5 that `contract-validated` could read the error class instead of the text is withdrawn: the class `structure` also holds the status rule, so the three refusals cannot be told apart by class, and the text rule is the baseline's.

### P-8 Feature 113, `spec.md`, F113-FR-007 and F113-FR-005 (item 6)

Why: F107-FR-034 binds the hash of the comment in `contract derive` before any repository text is printed and compares it at `launch`; F107-FR-035 lets the CLI record what the comment changed only when the skill names it; F107-FR-039 accepts logical names so that a host names no path of state.

Replace F113-FR-007:

> - **F113-FR-007**: The skill MUST pass the consumer's comment to the CLI verbatim as one argument, and MUST capture it before it reads any repository text. It MUST NOT summarize, translate or extend it.

With:

> - **F113-FR-007**: The skill MUST pass the consumer's comment to the CLI verbatim as one argument, `--comment`, to `contract derive` and again, unchanged, to `launch`, and MUST capture it before it reads any repository text. It MUST NOT summarize, translate or extend it. Wherever it names the launch contract, the launcher or the launch bundle, it MUST pass the logical name that the CLI printed and never a path.

In F113-FR-005, after "The skill MUST say what it changed because of the comment.", add:

> For every option it set because of the comment it MUST add `--comment-selects <option>` to the same call (`features`, `relaunch` or `learning` on `contract derive`; `mode` on `launch`; annex X §X.6 row 283), and it MUST relay a refusal of an option as the CLI prints it.

### P-9 Feature 100, annex G §G.8, after the paragraph on error classes (item 7)

Why: feature 100 generates the record schema of the launch contract and forbids its edit, and the table of §G.8 has no row per item; the item schemas that make it the validator (F100-FR-190) belong to the content owner.

Add:

> The records inside the fields of this table (a source, the records of `inventory`, the members of `configuration`, a coverage entry, a finding, a stage with its action, its checks and its recovery) are specified by the content owner, 107, whose package holds their schemas with ids of the internal form. The generated record schema and those item schemas, joined by reference, are the one schema of F100-FR-190; neither states a rule of the other.

### P-10 Feature 105, `spec.md`, F105-FR-015 (item 8)

Why: a command written literally in the plan and mapped to a phase by a judgment answer enters the verification-commands document that derivation writes (F107-FR-041 (c)), and F105-FR-016 asks for `cwd` and `timeoutSec`, which a literal command does not declare.

After "Every command MUST carry its provenance (file and line).", add:

> A command declared literally in the plan or the task list MUST get the repository root as its working directory and, as its time limit, that of the entry point of F105-FR-017 whose kind it runs, else 1800 seconds; the launch contract's derivation writes these values into the verification-commands document it stores for the feature.

### P-11 Feature 141, `spec.md` (table of the scenarios that features add) and `contracts/fixture-catalogue.json` (item 9)

Why: T001 of this feature writes two scenarios inside the scope of FX-32 and FX-33 (§O.1 rule 4); a scenario must be registered before a test cites it.

Add to the table:

```
| family FX-32 | `107-plan-with-other-fence` | 107 | 107 | none | `exit`, `stdout`, `stderr`, `tree`, `state` | In scope: derivation on a plan that holds a fence of another kind before a shell block (the reading of fences of the baseline, F107-FR-004). Registered on 2026-09-30 under the name feature 107 gave it |
| family FX-33 | `107-promote-unreadable` | 107 | 107 | none | `exit`, `stdout`, `stderr`, `state` | In scope: `contract-validate --promote` on a file that is not JSON; the baseline replaces it by a record with the status `draft` (F107-FR-021) |
```

Add to the scenarios of FX-32 and of FX-33 in the catalogue, respectively:

```
{
 "name": "107-plan-with-other-fence",
 "pattern": false,
 "waiver": null,
 "scenarioOf": "107",
 "testOf": "107",
 "stubsAndVerbs": "none",
 "surfacesCompared": "`exit`, `stdout`, `stderr`, `tree`, `state`",
 "note": "In scope: derivation on a plan that holds a fence of another kind before a shell block (F107-FR-004). Registered on 2026-09-30 under the name feature 107 gave it"
}
```

```
{
 "name": "107-promote-unreadable",
 "pattern": false,
 "waiver": null,
 "scenarioOf": "107",
 "testOf": "107",
 "stubsAndVerbs": "none",
 "surfacesCompared": "`exit`, `stdout`, `stderr`, `state`",
 "note": "In scope: `contract-validate --promote` on a file that is not JSON (F107-FR-021). Registered on 2026-09-30 under the name feature 107 gave it"
}
```

### Companion changes in this feature (applied with the items above)

| Where | Text |
|---|---|
| `spec.md`, F107-FR-041 (a), after "Its recovery is one stage attempt" | "; its time limit is the resolved value of `derive.stageTimeoutSec` (default 86,400 seconds)". The sentence "The time limit of the action of a stage has no key of configuration yet; the default of F107-FR-015 stands, the report of `dry-run` prints it, and a key is asked of feature 110 (reported)." becomes "The report of `dry-run` prints the time limit of each stage." (P-6) |
| `spec.md`, F107-FR-037 | "for the reads and writes of a verification command the list of feature 110 holds no key yet, and that feature is asked for one (reported)" becomes "for the reads, the writes and the side effects of a verification command the keys are `verification.scopes.<commandId>.reads`, `.writes` and `.sideEffects` (feature 110)" (P-6) |
| `spec.md`, F107-FR-035 | "events and the digest MUST show the comment (redacted) and what it changed" becomes "the event `pipeline.started` MUST show the comment (redacted and cut) and what it changed, and the digest its hash and what it changed" (P-4, P-5; F123-FR-043 allows no text in the digest line) |
| `spec.md`, "Assumptions", the paragraph and table of the missing register row | Replaced by "The difference `schema` for `schema_version` is register row DV-120, mapped through the key-name map of annex X §X.8." F107-FR-005 and F107-FR-012 gain `divergence: DV-120` (P-1) |
| `spec.md`, "Closed sets" | "(no row yet; reported)" becomes the rows 282 to 285 and, for the two refusals, "row 212" (P-2, P-3) |
| `tasks.md`, T010 and T024 | The sentence on the known difference of the member `schema` is removed once P-1 is applied |
