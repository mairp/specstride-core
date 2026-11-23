# Analyze report: feature 104-spec-input

Run 1 of at most 3. Non-destructive. Files read: spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/.

## Findings

| # | Severity | Where | Finding | Action |
|---|---|---|---|---|
| 1 | Low | F104-FR-007, F104-FR-016 | Two keys, `spec.contextBudget` and the alias of `SPECSTRIDE_CONTEXT_BUDGET`, have no row in annex X §X.8 | Reported to the orchestrator as a needed alias row |
| 2 | Medium | F104-FR-020 | Annex G §G.4 gives the verb `spec` no exit 1, and the baseline gives 1 for a non-numeric phase number | `assumption: CQ-042`; reported |
| 3 | Medium | F104-FR-026 | Feature 100 holds no logical name for the launch reading of the task lists | `assumption: CQ-044`; reported |
| 4 | Low | F104-FR-023 | Files standing for `spec` and `plan` of an OpenSpec change are not in the sources | `assumption: CQ-043`; reported |
| 5 | Low | F104-FR-022 | The hash rule for OpenSpec task lines goes beyond the baseline, whose rule knows T-ids only; no fixture reaches it | Recorded in research.md D-4; reported as a possible register row |
| 6 | Info | Scale | 27 requirements against an estimate of 24; below the split threshold of about 45 | None |

## Coverage

| Check | Result |
|---|---|
| Every kept as-is requirement (028 FR-001, 028 FR-002, 028 FR-029, 011 FR-007, 002 FR-028, 002 FR-029) in an `origin:` | Yes |
| Every kept cluster (C-006, C-007, C-009, C-012, C-013, C-022, C-060, C-061, C-063, C-138 to C-145, C-213, C-218, C-234) in an `origin:` | Yes |
| The one superseded item (B-1999) listed in "As-is behaviour not carried" with DV-073 | Yes |
| Every requirement with an origin has disposition and test | Yes |
| Every kept row named by a `proves:` of a test task | Yes (`check-traceability.py`: no line for 104) |
| First task is the fixture capture check | Yes (T001) |
| Constitution gates answered | Yes, 20 principles |
| Placeholders or `[NEEDS CLARIFICATION]` | None |
| No library or file layout in spec.md | Yes; constraints are in `## Constraints` |

## Split

None proposed.

## Remaining after repairs

Nothing. `python3 docs/ecosystem/check-traceability.py` gives no line that starts with `[h` and names feature 104.

## After the cross-feature review

Dated 2026-09-30. Repairs of the worklist `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 104. The items and their states are in `repair-report.md`.

### What changed

| File | Change |
|---|---|
| `spec.md` | F104-FR-020, F104-FR-021, F104-FR-026 and F104-SC-001 changed in place; one edge case; the tables "Contracts of feature 100 used", "Key Entities" and the rows CQ-042 and CQ-044 of the assumptions; new section "Repairs after the cross-feature review". No requirement added: 27 functional requirements, 8 success criteria |
| `plan.md` | The hasher is a module of `@specstride/kernel`; `@specstride/kernel` is a dependency; no validator and no YAML parser of its own; Constitution Check names v3.0.0, cites the requirement behind each pass, and has new reasons for rows IV, XVII and XIX; test directories and the test kit in the source tree |
| `tasks.md` | T007 moved to `packages/kernel/src/hasher/`; every test path moved; every one of the 67 test names of `spec.md` is in a task; T044 to T054 appended (54 tasks); T040 and T041 in the test kit |
| `research.md` | D-9, D-10, D-11; the macOS statement |
| `data-model.md`, `quickstart.md`, `contracts/README.md`, `contracts/spec-verb.md`, `contracts/verdict.md`, `checklists/requirements.md` | The logical name `run:<runId>:task-list`, the place of the hasher, the exit codes as annex G §G.4 gives them, the numbers of the questions |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Test names of `spec.md` that are in no task | 0 of 67 (before: 52) |
| Test names of `tasks.md` that are not in `spec.md` | 0 |
| Requirement without a task | None. F104-FR-009 (T040, T041), F104-FR-017 (T022, T030, T047), F104-FR-023 (T035, T049), F104-FR-026 (T037, T050), F104-FR-027 (T036, T051) have an own test now |
| Task without a requirement | None. T053 measures row XIX (F100-FR-187) on the verb of F104-FR-019; T054 is the task of Principle XVII |
| Place of the hasher | `packages/kernel/src/hasher/` in plan.md, tasks.md (T007), research.md (D-9), data-model.md and contracts/README.md; no file names `packages/spec-formats/src/hash.ts` |
| Logical name of the launch reading | `run:<runId>:task-list` in spec.md (F104-FR-026), tasks.md (T037, T050), data-model.md and contracts/verdict.md; no sentence says that annex B has no name |
| Exit codes of the verb | 0, 1, 2, 3 in F104-FR-020, contracts/spec-verb.md and T052, equal to the row `spec` of annex G §G.4. One difference stays: that row does not name the missing phase number among the causes of exit 3 (reported) |
| Test directories | `tests/parity/104/` for all PT-104-*; `tests/characterization/104/` for CT-104-1 to CT-104-3; the package's `test/` for the own tests; the test kit for CT-104-4 |
| `CQ-pending-*` placeholders | None |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |

### Remaining

| # | Severity | Finding |
|---|---|---|
| 1 | Medium | The verdict of F104-FR-024 is in `@specstride/spec-formats`, which a core package cannot import. Feature 103 compares hashes itself through the hasher. Reported as a new question |
| 2 | Low | Finding 3 of run 1 (no logical name for the launch reading) is closed by annex B §B.5. Finding 2 (exit 1) is in annex G §G.4 now; CQ-042 stays open |

## Second analyze run

Dated 2026-09-30, after the cross-feature review, the constitution patch v3.0.1 and the closure of the clarification round. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `contracts/`, the constitution v3.0.1, the annexes B, C, G and X of feature 100 with their data files (closed sets, parity profile, exit codes, package graph, layout, schema ids), the fixture families of feature 141, the queue `docs/ecosystem/CLARIFY-QUEUE.md` and the divergence register. Coverage before the run: 27 FR, 8 SC, 54 tasks, 100 per cent; every test name of the spec has a task and every task's test name is in the spec (67 of 67); `check-traceability.py` names no row. No CRITICAL finding; one HIGH. All 15 findings were repaired on the same day at the owner's instruction ("resolve any issue automatically with the best suggestion"); the repair record of the spec is the section "Repairs after the analyze run of 2026-09-30".

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| I1 | Inconsistency | HIGH | F104-FR-024 vs F104-FR-025 | FR-024 made every source named outside `spec`, `plan`, `tasks` stale, while FR-025 compares every source of a launch contract, whose kinds (row 256: constitution, research, checklist…) lie outside the three: every contract with a research file would have been stale | **Repaired**: the name rule is scoped to the verdict of a run (row 50); a contract's sources are compared by index and path, any kind, same classification |
| I2 | Inconsistency | MEDIUM | F104-FR-023 | "The launch contract takes its hashes from `inputs`", but `inputs` lists three files and the contract records up to ten kinds | **Repaired**: the three from `inputs`, the rest with the content hash of the hasher, no hash of 107's own |
| I3 | Inconsistency | MEDIUM | F104-FR-021 vs annex X §X.5 | The requirement said "the operations of §X.5" and listed four; the annex row also names the obligation id (rule of 107, `OBL-` + 12 hex), the signature of unmet criteria (rule of 101, F101-FR-019) and the classification | **Repaired**: the operations built here are named one by one; the two others are formed by their owners over the content hash of a text. Row wording of §X.5 handed to feature 100 |
| I4 | Inconsistency | MEDIUM | FR-020 assumption; Assumptions; T043; checklist | CQ-039 to CQ-045 and CQ-214 were closed in the queue on 2026-09-30; the spec still said "open in the queue", "reported", "the register has 94 rows"; T043 reported readings that are closed and "missing rows of annex X" that exist (alias row 18, profile row 49) | **Repaired**: the table records each closure; T043 now carries the two items that are feature 100's |
| I5 | Inconsistency | MEDIUM | F104-FR-016; research D-7; finding 1 of run 1 | Annex X §X.8 holds the alias row for `SPECSTRIDE_CONTEXT_BUDGET` since amendment 18; the spec did not name the alias and D-7 still said the table lacked it | **Repaired**: alias named, with the note that the variable feeds `reverse.contextBudget` too |
| U1 | Underspecification | MEDIUM | F104-FR-019; plan Project Type | `first-unapproved` needs the verification of an approval record (F101-FR-031), which lives in `@specstride/core`; `@specstride/spec-formats` may import `contracts` and `kernel` only, and nothing said how the verb reaches it | **Repaired**: a port handed over by the CLI, the composition root, as plan 107 does; the verb verifies no signature (spec, plan, T039, D-12, `spec-verb.md`) |
| U2 | Constitution VI / Underspecification | MEDIUM | F104-FR-026; T050 | `run:<runId>:task-list` is a file boundary; annex B §B.20 gives it no schema id, and T050 "validates" against nothing named | **Repaired**: FR-026 asks the schema of `@specstride/contracts`, shape of `contracts/verdict.md`; the id is feature 100's (T043, D-13). Same class as the handoff schema of feature 103 |
| C1 | Coverage | MEDIUM | CQ-045; F104-FR-008; F104-FR-022 | CQ-045 was closed on "yes, two register rows, not observable"; no row existed and the spec cited none, so two intended differences stood as notes (Principle XVIII) | **Repaired**: DV-118 (OpenSpec dotted-id task lines in the hash rule) and DV-119 (lower-case `## phase N:` is no heading) written in `docs/ecosystem/consolidation.md`; cited by FR-022 and FR-008 |
| F1 | Inconsistency | LOW | T010, T022 | `proves:` named C-012 for a C-013 test, and C-144, C-140, C-139 for tests of C-143, C-145, C-138 | **Repaired** |
| K1 | Constitution | LOW | plan Constitution Check | Answered against v3.0.0 with a note on v3.0.1 | **Repaired**: re-read against v3.0.1; rows II and VI carry the new reasons; result unchanged |
| L1 | Inconsistency | LOW | Closed sets; Contracts of feature 100 used | Rows 97 to 100 of annex X §X.6 exist for the kinds, states, errors and subcommands; the spec cited rows 49 and 50 only | **Repaired** |
| L2 | Terminology | LOW | Rows of the `parity` profile vs row 49 | `spec.feature` "unset" here, "the last active" in row 49 and feature 110 | **Repaired**: the two readings are stated as one |
| L3 | Ambiguity | LOW | F104-FR-018 vs F104-FR-015 | `specs not found` and `spec not found` looked like drift; both are as-is (the critic's `lib/critic.py:2479`, B-0795, and the spec module's) | **Repaired**: named as the critic's text |
| L4 | Coverage | LOW | plan Performance Goals | The starting value (500 tasks under 100 ms) had no measurement | **Repaired**: T034 reports it, as information, not a gate |
| L5 | Inconsistency | LOW | `docs/ecosystem/FINAL-SUMMARY.md:17` | Says 117 register rows; now 119 | Not changed: a dated summary of Stage B; noted here |

Constitution alignment: no issue; all twenty principles answered against v3.0.1. Count now: 27 functional requirements, 8 success criteria, 54 tasks (none added; T010, T022, T034, T039, T043, T050 changed in place); 67 test names, coverage 100 per cent; `check-traceability.py` names no row of feature 104.

### What another feature or the orchestrator must do (after this run)

1. Feature 100, annex B §B.20: a schema id for the record `run:<runId>:task-list` (shape: `contracts/verdict.md` of this feature), so that T050 validates against it (U2). The directory `contracts/schemas/` is generated by feature 100's tool, so this feature adds no file there.
2. Feature 100, annex X §X.5, row "Phase shape, obligation id, signature of unmet criteria": name the rule owners (phase shape 104; obligation id 107; signature of unmet criteria 101), so that the row and F104-FR-021 read the same (I3).
3. `docs/ecosystem/FINAL-SUMMARY.md` §1 counts 117 register rows; the register has 119 (L5).

## Proposed upstream fixes (second round, 2026-09-30)

The three items of "What another feature or the orchestrator must do (after this run)", written ready to apply; the owner ruled on 2026-09-30 that they go in now. Nothing outside this report was edited. Regenerate the contracts of feature 100 (`contracts/tools/generate.py`) after P-1 and P-2, and apply the two rows of P-1 together: the static test "Schema field" (T260 of feature 100) passes once `data/further-schema-ids.json` holds the id that the §B.5 row names.

### P-1 (item 1, U2): a schema id for the task list read at launch

- **Target 1**: `specs/100-specstride/annexes/B-state.md`, §B.20 "Further schema ids", table; insert after the row `specstride.span-state/1` (the last `specstride.*` row, before the two internal rows of feature 130):

  > | `specstride.task-list/1` | The task list as read at launch: per phase its tasks (id, markers, text) in order and the canonical record hash of the phase | `run:<runId>:task-list` | 104 |

- **Target 2**: the same file, §B.5, row `run:<runId>:task-list`, last column. Replace `The task list as read at launch` with:

  > The task list as read at launch, with the record `specstride.task-list/1` (fields: feature 104, annex B §B.20)

- **Target 3**: `specs/100-specstride/spec.md`, table of contracts near the top, row "Further schema ids, fields with their owners". Replace `fourteen ids` with `eighteen ids`; and `specs/100-specstride/contracts/README.md`, row `data/further-schema-ids.json`: replace `fifteen schema ids` with `eighteen schema ids`. Both counts are stale today (the table has 17 rows) and become 18.
- **Target 4**: `specs/100-specstride/spec.md`, end of the file, a new subsection that records P-1 and P-2:

  > ### Upstream fixes of the analyze run of feature 104 (2026-09-30)
  >
  > Applied at the owner's ruling of 2026-09-30. Nothing was renumbered; no requirement was added. The contracts were regenerated.
  >
  > | Where | Before | After | Why |
  > |---|---|---|---|
  > | Further schema ids, annex B §B.20 | 17 | 18 (`specstride.task-list/1`, logical name `run:<runId>:task-list`, owner 104) | Principle VI: the record is a file boundary and had no schema id (F104-FR-026) |
  > | Annex B §B.5, row `run:<runId>:task-list` | The task list as read at launch | Names the record `specstride.task-list/1` | Same |
  > | Annex X §X.5, row "Phase shape, obligation id, signature of unmet criteria" | "As at the baseline" in both cells | Names the rule owner of each of the three hashes (104, 107, 101) and what the hasher builds | The row read as three operations of the hasher; F104-FR-021, F107-FR-004 and F101-FR-019 give two of them to their owners |

- **Why**: F104-FR-026 and T050 validate the reading against a schema of `@specstride/contracts` whose id is feature 100's to give (F100-FR-227, D-13); the fields are already listed by the owner in `contracts/verdict.md`, so §B.20 (id, logical name, owner) is the one place that fits, as for `specstride.span-state/1` of feature 128.
- **This feature under P-1**: the owner delivers the schema file (F100-FR-227) through a `contracts/deliver.json` of its own, the manifest proposed by feature 116 (its P-1), in place of the sentence of D-13 that this feature adds no file; the parentheses "(none in annex B §B.20 yet; T043)" of `contracts/verdict.md` and the clause "once feature 100 gives it an id (T043), and against the shape of contracts/verdict.md until then" of T050 name `specstride.task-list/1`; T043 is done.

### P-2 (item 2, I3): the rule owners in the row of the hasher

- **Target**: `specs/100-specstride/annexes/X-cross-layer.md`, §X.5 "Canonical hasher", row "Phase shape, obligation id, signature of unmet criteria". Keep the first cell (the operation name that `data/kernel-operations.json` and the hasher contract key on); replace the row with:

  > | Phase shape, obligation id, signature of unmet criteria | For the phase shape: the number, title and criteria of a phase; for the obligation id and the signature of unmet criteria: the text that each owner forms | As at the baseline; equal to the baseline's on the same input. The phase shape is built by the hasher (16 hexadecimal characters; rules: feature 104, F104-FR-021). The obligation id (rules: feature 107, F107-FR-004) and the signature of unmet criteria (rules: feature 101, F101-FR-019) are formed by their owners over the content hash of a text; the hasher holds no rule of theirs |

- **Why**: "As at the baseline" in both cells reads as three operations built by the hasher, while F104-FR-021 builds the phase shape only and F107-FR-004 and F101-FR-019 form the other two over the content hash of a text; the row and the three requirements now say the same, in the form of the row "Classification of the staleness verdict" (rules: feature 104).

### P-3 (item 3, L5): the register count of the final summary

- **Target 1**: `docs/ecosystem/FINAL-SUMMARY.md`, §1 "What exists now", row "Divergence register". Replace the second cell with:

  > 120 rows, DV-001 to DV-120 (DV-118 to DV-120 added after Stage B, on 2026-09-30, by the analyze runs of features 104 and 107); DV-001 to DV-119 cited by at least one spec; DV-120 cited by none yet (its citation is owed by feature 107, F107-FR-005 and F107-FR-012, with the map entry of annex X §X.8 owed by feature 100)

- **Target 2**: `docs/ecosystem/reviews/FINAL-SUMMARY-FACTS.md`, §3 "Register", the three count lines. Replace with:

  > - Rows: 120 (DV-001 to DV-120)
  > - Cited by at least one spec: 119
  > - Uncited rows (1): DV-120
  > - Cited but not a row: none

- **Why**: the summary says every count comes from the facts file by a stated rule; by that rule (rows `^| DV-nnn |` of `consolidation.md`, citations in `specs/1*/spec.md` and the annexes of 100) the register has 120 rows and DV-120 has no citation, so the old "every row cited" would be false as well as the count. Both lines return to "every row cited" once feature 107 cites DV-120.
