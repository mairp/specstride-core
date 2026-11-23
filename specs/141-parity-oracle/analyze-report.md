# Specification Analysis Report: feature 141-parity-oracle

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0.

The analysis ran twice: a first run, and one run after repairs. The mechanical checks are scripts
(`contracts/tools/generate.py --check`, `docs/ecosystem/check-traceability.py`, and searches); the
checks of meaning were made by reading. The table gives every finding with its state after the
last run.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| T1 | Coverage | HIGH | `tasks.md`; F141-FR-016, F141-FR-018 | Two requirements had a test task and no implementation task: the `covers:` lines of the family tasks for FX-32, FX-35 and FX-36 named the general requirements only | **Repaired.** The three tasks now name F141-FR-018 and F141-FR-016 |
| G1 | Terminology | LOW | `spec.md` F141-FR-037, F141-FR-038, F141-FR-015, FX-16, "Constraints", "Closed sets" | Bare "tiers", "job", "adapter features", "long jobs" | **Repaired**: "test tiers", "build job", "harness adapter features", "long detached jobs" |
| G2 | Terminology | LOW | `spec.md` §O.2: the family name "Iteration limit"; scenario names such as `accelerated-attempt`, `bundle-reused`, `gate-<refusal>`; "evidence line" | Words that the glossary qualifies | **Accepted.** The family name is R18's and is cited by the traceability files; scenario names are identifiers; "evidence line" is the column `evidence` of the behaviour inventory; "breach of gate integrity" is the term of ruling 42 |
| I1 | Inconsistency | LOW | `spec.md`, Clarifications | One answer named F141-FR-002 as a place where "no reference tree in the repository" is stated; only F141-FR-025 states it | **Repaired** |
| D1 | Duplication | LOW | F141-FR-035 and F141-FR-036 | Both speak of macOS and of `unverified` | **Accepted.** One is what is compared on macOS, the other is the release condition of ruling 67 |
| D2 | Duplication | LOW | F141-FR-005 and F141-FR-038 | Both forbid a model call | **Accepted.** One binds the stubs, the other makes it checkable for a whole run |
| U1 | Underspecification | MEDIUM | 4 requirements with `assumption:` (F141-FR-012, F141-FR-029, F141-FR-030, F141-FR-040) | Four readings that the sources do not settle, CQ-027 to CQ-030 | **Open by design.** Each proceeds on the recommended answer |
| U2 | Underspecification | MEDIUM | `spec.md` §O.2, scenario table | 21 scenario names are patterns (`lint-<code>`, `predicate-<kind>`, `<command>-<case>`): the members come from closed sets that other features own (105, 108, 118, 119, 123) or from the as-is assets | **Open.** The catalogue is completed when those specifications list their members; the ids of families do not change |
| U3 | Underspecification | MEDIUM | F141-FR-023; `contracts/register-map.json` | The column "Oracle handling" of the register is prose. The map classifies it; 12 rows have more than one handling, and row DV-056 asks for a waiver that could never match | **Open.** The classification is data with the text of the register beside it, and the check fails when that text changes. DV-056 is reported |
| V1 | Ambiguity | LOW | 4 requirements with `status: unverified` (F141-FR-015, F141-FR-031, F141-FR-035, F141-FR-036) and the plan's performance goals | Facts that no run has shown | **Open by design.** Each names its check (`research.md`, "Facts that are `unverified`") |
| F1 | Inconsistency | MEDIUM | Feature 100 F100-FR-211 against register row DV-034 | They disagree on the output mode of the second suite | **Open; reported.** This feature follows feature 100 and R27 D1.1 (CQ-028) |
| F2 | Coverage | MEDIUM | Feature 100, annex X §X.8, component-name table | No row for a registry entry that is not carried; none for the stream tap, the shippers, the overlay tool and the plugin request processor | **Open; reported.** N-15 compares a prefix outside the table as written (CQ-029) |
| F3 | Inconsistency | MEDIUM | `docs/ecosystem/check-traceability.py` check g; the proof column of the traceability files | Check g accepts FX-01 to FX-37 only; 27 items name FX-17 and FX-18, 59 name FX-26 and part of 122 name FX-28 where this feature opens FX-38, FX-39 and FX-40 | **Open; reported.** Both citations are valid until the files are corrected (`spec.md` §O.2) |
| S1 | Size | LOW | `spec.md` | 45 functional requirements: the split mark of "about 45" is reached and not passed | **No split proposed**; see "Split" |
| K1 | Constitution | — | `plan.md`, Constitution Check | Twenty principles answered | **No issue.** Nineteen pass; XX is not applicable, with its reason |

No finding is CRITICAL. No HIGH finding stays open.

## Additional checks asked for this feature

| Check | Result |
|---|---|
| Directory | Exactly `specs/141-parity-oracle`. No other `specs/1NN-*` directory appeared besides `specs/100-specstride` |
| `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` | `checked: 40 families, 39 active, 193 scenarios named, 94 register rows, 55 requirements`, exit 0. It compares the catalogue, the surfaces and the verbs with `spec.md`, the register map with the register, and every cited DV, FX, N, F141 and F100 id with its source |
| `python3 docs/ecosystem/check-traceability.py` | `PASSED: checks a to h`, exit 0. No line that starts with `[h` names feature 141 |
| Requirement ids | F141-FR-001 to F141-FR-045 and F141-SC-001 to F141-SC-010, sequential, none twice |
| Every requirement has `test:` | Yes. 44 name `CT-141-<100 + n>`; F141-FR-018 names `PT-141-011SC008-*` |
| As-is rows of the traceability files | One: 011 SC-008, `translated`, in the `origin:` of F141-FR-018 and the `proves:` of T038. No behaviour item is assigned to this feature |
| Subjects of brief 141, heading 4 | All 22 have a requirement. The count of 85 register rows in the brief is replaced by 94 |
| Work inherited (the five rows of the assignment) | Fixtures of dsh, Codex and prime: F141-FR-015, T120 to T129; the plugin protocol: F141-FR-014, FX-38, T130; the two inventory rows: F141-FR-017, T075, T080, `contracts/inventory-supplement.tsv`; the macOS runner: F141-FR-036, T067, T073, T074; the second suite: F141-FR-039 to F141-FR-042, T136 to T144; the coverage script and the exercise map: F141-FR-031 to F141-FR-034, T076 to T086 |
| Placeholders | No `[NEEDS CLARIFICATION]`, no `DV-new`. Four `CQ-pending` markers, by design |
| The machine-specific backend name | Not present in any file of the feature. Written "the locally registered backend" |
| Every register row cited exists | Yes, all within DV-001 to DV-094 |
| Source repositories | Read with `git show` and `git ls-tree` at the pinned commits only. Nothing was written, no branch or worktree was made |

## Coverage Summary

45 requirements; each has at least one test task and one implementation task.

| Requirements | Has task? | Tasks | Notes |
|---|---|---|---|
| F141-FR-001 to F141-FR-003, F141-FR-005, F141-FR-038 | Yes | T005 to T015 | Foundational |
| F141-FR-012, F141-FR-013, F141-FR-027, F141-FR-028, F141-FR-030 | Yes | T016 to T024 | US1 |
| F141-FR-004, F141-FR-006 to F141-FR-009, F141-FR-011, F141-FR-018 to F141-FR-024, F141-FR-044 | Yes | T025 to T063 | US2; PT-141-011SC008 is T038 |
| F141-FR-025, F141-FR-026, F141-FR-035 to F141-FR-037 | Yes | T064 to T074 | US3 |
| F141-FR-017, F141-FR-031 to F141-FR-034; the families that need no further harness | Yes | T075 to T114 | US4 |
| F141-FR-010, F141-FR-014 to F141-FR-016, F141-FR-029 | Yes | T115 to T135 | US6 |
| F141-FR-039 to F141-FR-043 | Yes | T136 to T145 | US5; needs the layer of feature 115 |
| F141-FR-045 | Yes | T001, T047, T146 | Packaging and order |
| F141-SC-001 to F141-SC-010 | Yes | T148 | Measured by the validation run |

Task numbers in the rows above are ranges of `tasks.md` as generated; `tasks.md` holds the ids in
`proves:` and `covers:`.

**Constitution Alignment Issues:** none.

**Unmapped Tasks:** T002, T003 (setup), T147 (performance goals of the plan). Each serves the
plan and no single requirement.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 45 |
| Success criteria | 10 |
| Tasks | 149 (110 marked [P]) |
| Coverage (requirements with at least one task) | 100 per cent |
| Ambiguity count | 1 (V1) |
| Duplication count | 2, both accepted |
| Critical issues | 0 |
| Findings open by design or reported | U1, U2, U3, V1, F1, F2, F3 |

## Split

`speckit-specify` gave 45 functional requirements. The rule asks for a split only above about 45,
so none is proposed. If the orchestrator wants the feature smaller, the cut that the requirement
groups of heading 7 of the brief allow is this:

| Part | Groups | Requirements | As-is origins | Tests |
|---|---|---|---|---|
| `141-parity-oracle` (stays) | G1, G2 | F141-FR-001 to F141-FR-030 (30) | 011 SC-008 | CT-141-101 to CT-141-130; PT-141-011SC008-* |
| A second part on the next free number (143, or 144 if 142 was split), for example `143-oracle-coverage-and-inertness` | G3, G4 | F141-FR-031 to F141-FR-045 (15) | none | CT-141-131 to CT-141-145 |

The second part would cite the first only through §O.2 to §O.6. The section "How a feature cites
the oracle" stays whole in 141 in either case, so the thirty other features are not affected.

## Next Actions

- No CRITICAL or open HIGH finding: the feature can go to implementation planning.
- The orchestrator decides on CQ-027 to CQ-030 and on F1, F2 and F3.
- When features 105, 108, 118, 119 and 123 have listed the members of their closed sets, the pattern scenarios of U2 are expanded in `contracts/fixture-catalogue.json`.

## Follow-up after the fan-out

Date: 2026-09-29. The analysis of `speckit-analyze` was run again after the follow-up that
`followup-report.md` describes. Artifacts read: `spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/`, `tasks.md`, `followup/`, the constitution v3.0.0. The prerequisite
script was called as `SPECIFY_FEATURE_DIRECTORY=specs/141-parity-oracle bash
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` and named this
directory. The analysis ran three times: a first run, and one run after each of two repairs. The
analysis itself wrote nothing; the repairs were made between the runs.

### Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| FI1 | Inconsistency | HIGH | `spec.md` §O.2, FX-07; F141-FR-015; `tasks.md` T126 | The family stated engine exit 3 and `critic_config` for six scenarios that end with engine exit 1 and `critic_unavailable` on the reference | **Repaired** before the first run: the scope of the family, the table "Ends on the reference", F141-FR-013, F141-FR-015, T126, the catalogue |
| FC1 | Coverage | HIGH | `spec.md` §O.2, FX-07; traceability rows B-0135, B-0151, B-0226, 028 FR-010 | No scenario of the first set executed the lines of the engine that map critic exit 3 | **Repaired** before the first run: `phase-not-found` and the five scenarios that drive the critic; T153 |
| FI2 | Inconsistency | MEDIUM | `spec.md` §O.2, FX-18; `tasks.md` T127 | The family stated pass-loop exit 7 for a pass that fails before the harness starts. On the plain-output path the reference ends with pass-loop exit 8 | **Repaired** before the first run |
| FI3 | Inconsistency | MEDIUM | F141-FR-023; `contracts/register-map.json`; `data-model.md`; `tasks.md` T035 | The register has 113 rows; the map and four texts said 94. `generate.py --check` failed on it before the follow-up | **Repaired** before the first run: 19 entries, DV-095 to DV-113 |
| FI4 | Inconsistency | MEDIUM | `tasks.md` T126 | The task pointed to T152 for the scenarios that reach engine exit 3; they are built by T153 | **Repaired** in repair 1 |
| FU1 | Underspecification | MEDIUM | `spec.md` "What this feature is" | "Thirty other features" is out of date after the splits | **Repaired** in repair 1 |
| FU2 | Underspecification | MEDIUM | F141-FR-033 | The reading CQ-pending-141-1 was in the table of assumptions and in no requirement | **Repaired** in repair 1: `assumption:` on F141-FR-033 |
| FU3 | Underspecification | MEDIUM | `spec.md` §O.6, `fixture:`; F141-FR-027 | Features cite a pattern name (`FX-36/observe-<status>`) and scenarios of their own; the rule did not say whether the declaration check accepts them | **Repaired** in repair 2: a pattern name stands for all its members; a scenario is one the catalogue holds |
| FU4 | Underspecification | MEDIUM | `spec.md` §O.2, FX-26 `fallback-tap-unavailable`, `fallback-no-adapter`; FX-18 `dsh-overlay-cannot-build` | Three scenarios whose evidence line runs only when a file of the reference is missing or cannot be written. No fixture reached them | **Open.** CQ-pending-141-1. If the exercise map shows no execution, the items go to the correction list (F141-FR-033) |
| FU5 | Underspecification | MEDIUM | `spec.md` §O.2, FX-33 `invalid-<class>` | No closed set holds the error classes of the validation of a launch contract; the ten members are the validators of the baseline | **Open.** CQ-pending-141-2; feature 107 is asked |
| FU6 | Underspecification | LOW | `spec.md` §O.2, table "Ends on the reference" | 9 of the 34 ends were read from the code and not run | **Open by design.** Each row says `read`; T150 and T161 compare every end with the capture |
| FF1 | Inconsistency | MEDIUM | Register row DV-112 | The row names FX-18 for a waiver; no scenario of FX-18 starts the prime stub, so a waiver there would match nothing | **Open; reported.** No waiver is written for FX-18 (`register-map.json`, note of DV-112) |
| FF2 | Coverage | LOW | Feature 100, annex X §X.8, component-name table | No row for the presenter, the banner and the theme tool, which FX-40 drives | **Open; reported.** A prefix outside the table is compared as written |
| FF3 | Inconsistency | MEDIUM | The proof column of the traceability files | 185 rows name FX-17, FX-18, FX-26, FX-28 and others where FX-38, FX-39 and FX-40 hold the scenario; 17 more name a family that cannot execute the item | **Open; reported** as two lists in `followup/`. Finding F3 of the first report is now itemized |
| FS1 | Size | LOW | `spec.md` | 45 functional requirements, unchanged. Five were amended (F141-FR-013, F141-FR-014, F141-FR-015, F141-FR-023, F141-FR-030), one gained a waiver row (F141-FR-022), one gained an assumption (F141-FR-033); none was added | **No split proposed**, as before |
| FU7 | Underspecification | MEDIUM | First report, finding U2 | "21 scenario names are patterns" | **Closed.** The table holds 13 pattern names; all are resolved, with 175 members. The figure 21 cannot be reproduced |

No finding is CRITICAL. No HIGH finding stays open.

### Checks

| Check | Result |
|---|---|
| `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` | `checked: 40 families, 39 active, 248 scenarios named (13 of them patterns with 175 members; 14 of other features), 34 with an end on the reference, 113 register rows, 55 requirements`, exit 0. Before the follow-up it failed on the register map |
| `python3 docs/ecosystem/check-traceability.py --require-all` | `PASSED: checks a to h`, 41 of 41 features, exit 0 |
| Requirement ids | F141-FR-001 to F141-FR-045 and F141-SC-001 to F141-SC-010; none renumbered, none added |
| Task ids | T001 to T162, in order, none twice; T001 to T149 keep their numbers; T150 to T162 are new |
| Every requirement has a test task and an implementation task | Yes, all 45 |
| Every test name of `spec.md` is in `tasks.md` and the reverse | Yes. New: CT-141-146 (F141-FR-013), CT-141-147 (F141-FR-030), CT-141-148 (F141-FR-014) |
| Every scenario of this feature is named by a build task; every scenario a task names is in the catalogue | Yes |
| Placeholders | No `[NEEDS CLARIFICATION]`, no `DV-new`. Two new readings, CQ-pending-141-1 and CQ-pending-141-2 |
| The machine-specific backend name | The entry was found at run time in an output of the reference; its name is in no file of the feature |
| Source repositories | Read with `git show` and `git archive` at the pinned commits. Nothing was written, no branch or worktree was made. The reference ran in scratch from a read-only copy, with stub agents and no model |

### Coverage of the changed requirements

| Requirement | Test tasks | Implementation tasks |
|---|---|---|
| F141-FR-013 | T017, T150 | T125 to T127, T153, T154, T155, T161, and the family tasks that named it before |
| F141-FR-014 | T116, T152 | T130 to T133, T155, T157, T158 |
| F141-FR-015 | T117 | T124 to T131, T153, T154 |
| F141-FR-023 | T035 | unchanged |
| F141-FR-030 | T020, T151 | T156, T160, and the tasks that named it before |
| F141-FR-033 | unchanged | T149, T162 |

### Metrics

| Metric | Value | Before the follow-up |
|---|---|---|
| Functional requirements | 45 | 45 |
| Success criteria | 10 | 10 |
| Tasks | 162 (120 marked [P]) | 149 (110) |
| Scenario names of this feature | 234, of them 13 patterns with 175 members | 193 |
| Scenario names of other features, registered | 14 | 0 |
| Ends on the reference stated | 34, of them 25 run and 9 read | 0 |
| Register rows mapped | 113 | 94 |
| Coverage (requirements with at least one task) | 100 per cent | 100 per cent |
| Critical issues | 0 | 0 |
| Findings open or reported | FU4, FU5, FU6, FF1, FF2, FF3, and U1, U3, V1, F1, F2 of the first report | |

### Next Actions

- No CRITICAL or open HIGH finding.
- The orchestrator applies `followup/proof-column-changes.tsv` and decides on `followup/proof-column-corrections-other.tsv`.
- The orchestrator queues CQ-pending-141-1 and CQ-pending-141-2 and closes CQ-116 and CQ-141.
- The changes that other features need are in `followup-report.md`, section 5.

## After the cross-feature review (2026-09-30)

The repair of act B-8.6c applied the items of feature 141 in section 2 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the pointer items that change files of this
feature. The full record is in `repair-report.md`. The counts now: 45 functional requirements
(10 success criteria, unchanged), 162 tasks, 40 family ids (39 active), 248 scenario names,
117 register rows in the register map.

### What changed

- W-141-01 and W-X-13: the two `CQ-pending-141-*` placeholders are CQ-193 and CQ-194. F141-FR-002
  gained the rule that no fixture may change the reference tree or shadow the interpreter to reach
  a line; the changed requirements carry `assumption: CQ-193` and `assumption: CQ-194`.
- W-141-02: the FX-33 pattern source states the ten validators as the error classes
  (`assumption: CQ-194`); feature 107 is asked to state them as a closed set.
- W-141-03: `gate:<N>:approved` in the register-map entry of DV-029.
- W-100-26 (CQ-186): the plan states that Python 3 is a requirement of development and that no
  Python file is in a published package.
- W-X-05: the counts that moved were written as they hold today (register 117 rows, inventory
  2,785 items, `parity` profile rows 1 to 131); the register map gained the entries DV-114 to
  DV-117, which F141-FR-023 requires. The entry of DV-034 follows the register of 2026-09-30.
- W-X-06: "a second engine start" where one start of the engine is meant (FX-11, F141-FR-035).
- W-X-18: `ep:` lines on F141-FR-010 (EP-02), F141-FR-019 (EP-08) and F141-FR-039 (EP-04).
- W-100-16: the schema ids took the form `urn:specstride:schema:internal:141:<name>/<major>`.
- DV-116: F141-FR-012 cites the row and confirms its proposed handling; feature 108 consumes the
  row (F108-FR-027).

### Consistency pass over spec, plan and tasks

- Requirement without a task: none. Every requirement of the consistency pass has a task; the
  changed requirements (F141-FR-002, F141-FR-010, F141-FR-012, F141-FR-019, F141-FR-023,
  F141-FR-030, F141-FR-033, F141-FR-035, F141-FR-039) keep their tests and tasks.
- Task without a requirement: none found in the places touched.
- Terms and values: the register count is 117 in `spec.md`, `plan.md` and `contracts/README.md`;
  the inventory count is 2,785 in both files; the schema id form is the same in every data file and
  schema file. `research.md:80` keeps "2,783 ids" as a record of what R18 counted at the time and
  was left, as an earlier report is left.
- The check of the feature itself (`generate.py --check`) reports one remaining FAIL: "DV-029: the
  text of the register changed". The cause is in `consolidation.md`, which this feature does not
  write: the register row DV-029 still carries `gate:<phase>:approved` where annex B §B.5 writes
  `gate:<N>:approved`. The map of the feature is corrected; the register needs the orchestrator.
  `check-traceability.py --require-all` passes.

## Analyze run of 2026-09-30 (third run), with auto-repair

Artifacts read: `spec.md`, `plan.md`, `tasks.md`, the constitution v3.0.1, `contracts/`, the
divergence register (119 rows), the clarification queue, feature 100's data (closed sets, `parity`
profile, normalization, layout, annex D §D.8), and the analyze reports of the features that cite
this one (106, 107, 111, 115, 116, 117). Before the run `generate.py --check` failed: the register
map lacked DV-118 and DV-119. After the repairs it passes: 40 families, 39 active, 255 scenario
names (13 patterns with 175 members; 21 of other features), 34 ends on the reference, 119 register
rows, 55 requirement ids. Coverage: 45 FR and 10 SC, 162 tasks, 100 per cent. No CRITICAL finding.

| ID | Severity | Summary | State |
|---|---|---|---|
| C1 | HIGH | Register map without DV-118 and DV-119; counts said 117 (T035: 113) | Repaired |
| C2 | HIGH | Seven scenarios of 106 and 107 not registered in the catalogue | Repaired |
| U1 | HIGH | No way to change a file of state by logical name on both sides (`106-learning-tampered`); state in templates unspecified | Repaired: argument `state` of `write`; FR-012 |
| A1 | MEDIUM | "Replaces nothing" undefined for rules that assert or compare as written | Repaired (FR-020) |
| C3 | MEDIUM | SC-010 over the catalogue had no dependency | Repaired |
| D1 | MEDIUM | Principle IX not re-read against v3.0.1 | Repaired (plan) |
| I1 | MEDIUM | FR-013 asked an end for scenarios that have none | Repaired (FR-013, T099, T101) |
| I2-I12, U2, O1-O4, C4 | LOW-MEDIUM | Terminology, stale counts, surfaces of tasks, ordering of tests and waivers, dependencies, assumptions | Repaired |
| X1 | MEDIUM | `check-traceability.py` expects 117 register rows | Proposed upstream: P1 |
| X2 | MEDIUM | DV-016 and DV-020 name events that the catalogue of 111 names otherwise | Proposed upstream: P2; the allowlist follows it |
| X3 | MEDIUM | DV-052 not widened as CQ-084 answered | Proposed upstream: P3; the allowlist and FR-040 follow it |
| X4, X5 | LOW | Requests of 106 and 117 | Accepted (capture by T111; the exercise map corrects the columns) |

### Proposed upstream fixes

Each proposal is ready to apply by the owner of the file. This feature is already correct under it.

**P1. `docs/ecosystem/check-traceability.py`, check [d] (owner: the orchestrator).**
Replace line 59 `N_REGISTER = 117` by nothing, and replace line 465
`    wanted_rows = set("DV-%03d" % n for n in range(1, N_REGISTER + 1))` by

```python
    n_register = max(int(dv[3:]) for dv in dv_rows) if dv_rows else 0
    wanted_rows = set("DV-%03d" % n for n in range(1, n_register + 1))
```

and in line 469 `N_REGISTER` by `n_register`. Why: the register grows with every analyze run
(DV-118 and DV-119 on 2026-09-30) and the constant fails check [d] repo-wide on each new row; the
number of rows is a fact of the register, while the check's purpose, no gap in the numbering,
stays. If the orchestrator prefers the constant, the one-line fix is `N_REGISTER = 119`. Feature
141: T086 carries it; quickstart scenario 15 expects `PASSED`.

**P2. `docs/ecosystem/consolidation.md` section 6, rows DV-016 and DV-020, column "New"
(owner: the orchestrator).** DV-016: replace ``Events `loop_strategy_selected` and
`micro_inert` `` by ``Events `strategy.selected` and `microloop.inert` (catalogue of feature 111,
F111-FR-050)``. DV-020: replace ``and `prompt_block_dropped` or `prompt_block_protected` events
when the budget is tight`` by ``and `prompt.block_dropped` or `prompt.block_protected` events
when the budget is tight (catalogue of feature 111)``. The column "Oracle handling" does not
change, so the register map stays equal to the register. Why: the second suite matches event
types on the primary event file of the port, which holds the catalogue's types (reported by
feature 111); an entry with the old names would match nothing and fail the suite (F141-FR-040).
Feature 141: `contracts/layer-allowlist.json` already names the catalogue's types.

**P3. `docs/ecosystem/consolidation.md` section 6, row DV-052, column "New" (owner: the
orchestrator; CQ-084, closed 2026-09-30 with "DV-052 is worded wider").** Replace
`Files in the control plane that exist only with the layer on: the check manifest and the record of its derivation`
by
``Files in the control plane that exist only with the layer on: the check manifest `phase:<N>:manifest` with the record of its derivation and the pins it holds (annex D §D.8), and the fingerprints of the protected set `phase:<N>:protected-set` (F116-FR-004). The task list as read at launch, `run:<runId>:task-list`, is written in every run and is not covered``.
The column "Oracle handling" does not change. Why: CQ-084's answer widened the row for features
115 and 116, and the row was not changed. Annex D §D.8 shows that the derivation and the pins are
fields of the manifest (`entries[].provenance`, `entries[].pin`) with no logical name of their
own, and annex B §B.5 and F115-FR-012 show that the engine writes the task list at launch in every
run, so an allowlist entry for it would match nothing and fail the suite. Feature 115 should
drop "also the task list as read at launch" from its reading of CQ-084 (its `spec.md`,
Assumptions). Feature 141: `layer-allowlist.json`, F141-FR-040 and T137/T142 follow this text.
