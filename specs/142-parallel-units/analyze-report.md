# Specification Analysis Report: Parallel units (feature 142)

Date: 2026-09-29. Second analysis, after the split. It replaces the report of the first
analysis. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`,
`contracts/`, the constitution v3.0.0. Runs after the split: 1.

## What the split changed

| Subject | Before | After |
|---|---|---|
| Functional requirements | 73 | 46: F142-FR-001 to F142-FR-025, F142-FR-054 to F142-FR-073, and F142-FR-074, added at the split |
| Success criteria | 10 | 7: F142-SC-001, 003, 004, 005, 008, 009, 010 |
| Left | — | F142-FR-026 to F142-FR-053; F142-SC-002, 006, 007. The table is in `spec.md`, "Requirements moved to 143-parallel-engine-services" |
| As-is ids | 002 FR-048 | 002 FR-048, unchanged; `CT-142-1` whole |
| Tasks | 173 | 109, numbered anew |

## Findings

| ID | Category | Severity | Location | Summary | Recommendation |
|---|---|---|---|---|---|
| S1 | Size | LOW | `spec.md` | 46 functional requirements, one above the split mark of about 45. F142-FR-074 was added so that the two clauses of 002 FR-048 whose work left still have a requirement here | None; the mark is "about 45" |
| C1 | Contract of feature 100 | MEDIUM | F142-FR-022; annex G §G.3 | The `[LOOP]` line of annex G lacks `worker-caches=`, wall hours and agent hours | Feature 100 adds the three fields |
| C2 | Contract of feature 100 | LOW | "Closed sets" | Two closed sets have no row in annex X §X.6: reasons for which the layer is switched off inside a run; sources of a scope | Feature 100 adds the rows |
| C3 | Contract of feature 100 | LOW | "Rows of the `parity` profile" | Three options have no row in annex X §X.7: declared scopes, excluded tasks, capacity of a resource | Feature 100 adds the rows, all "not used" under `parity` |
| C4 | Contract of feature 100, seam of the split | MEDIUM | F142-FR-023, F142-FR-016; annex D §D.1 | The layer acts on four reports of the engine that annex D does not name: a missing object, a changed ledger, an application that could not be completed, a harness adapter without a spending limit | Feature 100 names them in the result of the group directives and in the view of the phase attempt |
| C5 | Contract of feature 100, seam of the split | MEDIUM | F142-FR-054 to F142-FR-058; annex D §D.2 | The audits decide which delta is accepted. Annex D does not say how the verdicts reach the engine | Feature 100 states that `integrateGroup` carries, per worker, accepted or the refusal reason |
| C6 | Contract of feature 100, seam of the split | LOW | F142-SC-003; F142-FR-063 | The success criterion and the fingerprints name ledger record kinds of a group (`group_barrier`, `merge_check_finished`). The kinds have no row in feature 100 | Feature 100 lists the thirteen kinds, as C3 of the other part asks |
| A1 | Ambiguity | LOW | F142-FR-016 | The condition on remaining cycles has no admission check of its own in the sources | `assumption: CQ-111`; recorded under `headroom` |
| A2 | Ambiguity | LOW | F142-FR-056 | The path-leak audit searches by text and cannot find an encoded path | Accepted by R29v open question 3; the requirement says so |
| U1 | Unverified | MEDIUM | F142-FR-003, F142-FR-020, F142-FR-070 | Three facts about harness sandboxes and logins are `unverified` | Captured by the harness adapter features; task T107 updates the fields |
| U2 | Unverified | LOW | F142-FR-009 | Scope comparison on a file system that ignores case, on macOS | Task T106 |
| T1 | Terminology | LOW | F142-FR-021 | "iteration" is used as feature 100 uses it in F100-FR-119 | None |

No CRITICAL and no HIGH finding. No conflict with a principle of the constitution. No marker
that asks for clarification, no placeholder, no `CQ-pending` and no `DV-new`.

## Coverage Summary

| Requirement keys | Has task? | Test tasks | Implementation tasks |
|---|---|---|---|
| F142-FR-001 to F142-FR-025 | Yes, all 25 | CT-142-101 to CT-142-125 | One each |
| F142-FR-054 to F142-FR-073 | Yes, all 20 | CT-142-154 to CT-142-173 | One each |
| F142-FR-074 | Yes | CT-142-1 (T006) | One |
| 002 FR-048 | Yes | CT-142-1 (T006); CT-142-102 | With F142-FR-002 and F142-FR-074 |
| F142-SC-001 | Yes | Inertness test | — |
| F142-SC-003 | Yes | Event test "no model merges" | — |
| F142-SC-004 | Yes | CT-142-160 | — |
| F142-SC-005 | Yes | CT-142-165; vocabulary test | — |
| F142-SC-008 | Yes | CT-142-172; the paid task T103 | — |
| F142-SC-009 | Yes | Subset test | — |
| F142-SC-010 | Yes | Fallback fixtures | — |

**Unmapped tasks**: none.

**As-is ids across the split**, checked by a script of this analysis: 002 FR-048 is in the
`origin:` of 2 requirements and in the `proves:` of 2 test tasks of feature 142, and in none of
feature 143. The traceability files assign no other id to feature 142.
`python3 docs/ecosystem/check-traceability.py` prints no line that starts with `[h` and names
feature 142 or 143.

**Citations of the other part of the split**: none in a requirement, a success criterion, a
task, the plan or the data model. The other part is named only in the table "Requirements moved
to 143-parallel-engine-services" and in the notes on the split. Where a requirement named a
requirement that left, it now names feature 100: F100-FR-122 (composition), F100-FR-123 (store
and worker trees), F100-FR-124 (the two writes), F100-FR-133 (a worker does not yield),
F100-FR-083 (fresh session).

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 46 |
| Success criteria | 7 |
| Tasks | 109 |
| Requirements with at least one task | 100 per cent |
| As-is ids carried | 1 (002 FR-048) |
| Findings | 12: 0 critical, 0 high, 4 medium, 8 low |
| Ambiguity count | 2 |
| Duplication count | 0 |

## Next Actions

- No critical issue. The specification can go to the clarification round.
- The orchestrator takes C1 to C6 to feature 100, together with the points of the other part.

## After the cross-feature review

Date: 2026-09-30. Repairs from the section of feature 142 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and from the table "What the other features must
follow" of `specs/100-specstride/repair-report.md`. The items are in `repair-report.md`.

### What changed

| Subject | Before | After |
|---|---|---|
| Ceiling of workers (F142-FR-019, T013, T022) | The constant 4 | The key `loop.parallel.workersMax`, default 4, row 130 of annex X §X.7 (ruling P5; F100-FR-127) |
| `loop.parallel.allow_detect` (F142-FR-003, T030, T043) | User configuration, the environment or a flag | User configuration only; `assumption: CQ-183` |
| Keys of the `[LOOP]` line (F142-FR-022, T096, `contracts/loop-fields.json`) | Six keys; wall hours and agent hours in prose | Eight keys, `wall-hours` and `agent-hours` included, as annex G §G.3 lists them |
| The counted unit (F142-FR-021) | "iteration loop", "takes no iteration" | "pass loop", "spends no pass" |
| Rows of the `parity` profile (F142-FR-010, F142-FR-015) | "rows to be added" | Rows 93, 94 and 96 |
| Closed sets | Two sets with "none yet"; row 65 with feature 115 | Rows 185 and 186; row 65 with feature 116 |
| EP-16 | In the section "Extension points" only | `ep:` lines in F142-FR-022 and F142-FR-055 |
| Owners named | 115 for the protected set, fingerprints, toolchain profiles and the fact block; 105 for the check runner | 116; 148 |
| File system in core packages (`plan.md`, T108) | "no write call of the file system" | No import of `node:fs` or `node:fs/promises`; `assumption: CQ-185` |

Findings of the report of 2026-09-29 that are closed by feature 100: C1 (annex G §G.3 holds the
three fields), C2 (rows 185 and 186), C3 (rows 93, 94 and 96), C6 (row 184). T1 is closed by the
change of F142-FR-021. C4 and C5 were not checked again; no item of the worklist names them.

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. The 46 requirements are unchanged in number; every changed requirement keeps its test task and its implementation task (F142-FR-003: T030, T043; F142-FR-010: T010, T019; F142-FR-015: T036, T049; F142-FR-019: T013, T022; F142-FR-021: T091, T095; F142-FR-022: T092, T096; F142-FR-055: T059, T076) |
| Task without a requirement | None. No task was added or removed: 109 tasks |
| New requirement without a test | No requirement was added |
| Ceiling of workers | `spec.md` (F142-FR-019, "Constraints", row 130), `plan.md` ("Physical choices"), `tasks.md` (T013, T022), `data-model.md` (group) and `contracts/loop-fields.json` name the key; no file states 4 as a constant. The arm "4 workers" of FX-PAR-L is an arm of an experiment and stays |
| `loop.parallel.allow_detect` | `spec.md` (F142-FR-003, acceptance scenario 2 of User Story 2, "Constraints", row 23) and `tasks.md` (T030, T043) say user configuration only |
| Keys of the `[LOOP]` line | F142-FR-022, T096, `data-model.md` and `contracts/loop-fields.json` hold the same eight keys and the fallback reason |
| Rows of annex X | §X.6: 60, 61, 63, 185, 186 in `spec.md` and `contracts/closed-sets.json`; §X.7: 20 to 23, 93, 94, 96, 130 in `spec.md` and `plan.md` |
| Owners after the splits | No sentence names this feature as owner of the engine services of EP-04, of the tree-store service or of a ledger record kind of the namespace `parallel`. `data-model.md` no longer reads as if the layer kept its counters in the ledger |
| Word "iteration" | In no requirement, task or plan line of this feature |

### What remains

| # | Finding | Severity |
|---|---|---|
| R1 | The plan places a module group in `@specstride/core` (`packages/core/src/parallel/`). The package graph of feature 100 lists the owners 101, 149, 103, 117, 118 and 102 for that package and not 142 | MEDIUM; reported |
| R2 | F142-FR-025 says every event of a worker carries `workerId` and `wseq`; F111-FR-015 says the seven `parallel.*` types carry `workerId` in `data` only. The worklist settles it in feature 111 (W-111-09) and asks no change here | LOW; reported |
| R3 | 46 functional requirements, one above the mark of 45, as before | LOW |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 46 |
| Success criteria | 7 |
| Tasks | 109 |
| Requirements with at least one task | 100 per cent |
