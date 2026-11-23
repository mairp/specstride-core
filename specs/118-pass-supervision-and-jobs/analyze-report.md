# Analyze report: 118-pass-supervision-and-jobs

Date: 2026-09-29. Read-only analysis across spec.md, plan.md, tasks.md. Runs: 1 (no repair needed).

## Coverage

| Check | Result |
|---|---|
| Requirement ids unique, form of `STAGE-B-RULES.md` section 4 | 43 requirements and 6 success criteria, all F118, no duplicate |
| Every id referenced in the spec, plan and tasks is defined | Yes |
| Every requirement has an implementation task (`covers:`) | Yes (43 of 43) |
| Every own test CT-118-1 to CT-118-9 has a task | Yes |
| As-is rows: 028 FR-017, 028 FR-019 | Placed (F118-FR-001, F118-FR-015); proved by T010, T033 |
| Behaviour items | All 181 (180 and B-2784 of C-055) named in the text; all 27 clusters in a `proves:` |
| `check-traceability.py`, lines for this feature | h1, h3, h4: none. h2: F118-FR-031 cites `DV-098`, which is the form the rules ask for; the orchestrator adds the row |
| Terms, harnesses, machine-specific names, `[NEEDS CLARIFICATION]` | None found |
| Constitution Check | 20 gates answered; no violation |

## Findings

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | Medium | Annex X §X.6 row 10 says an unknown kill reason has the class `budget`; B-0606 says `futility`. Spec follows the baseline | Reported |
| 2 | Medium | Annex D §D.6 lacks the fields `resume_when.stable_sec`, `resume_when.pid`, `resume_when.argv`, `job.resource`, which the baseline (B-0727, B-0724, B-0723) or the brief (resources) need | Reported; spec proceeds on the narrowest reading |
| 3 | Low | Two options need new rows in annex X §X.7 (44, 45) and three closed sets need rows in §X.6 | Reported |
| 4 | Low | The spec is at 43 requirements, under the limit of about 45 | No split |

## Remaining after analysis

Nothing that blocks. Open assumptions are the five marks CQ-054 to CQ-058.

## After the cross-feature review

Date: 2026-09-30. Repairs of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 118. The items and their states are in `repair-report.md`.

### What changed

| File | Change |
|---|---|
| `spec.md` | F118-FR-006: order of the pass ceiling as annex X §X.2 and F110-FR-015, `assumption: CQ-158`. F118-FR-024, F118-FR-025: "pass limit", "pass count", "the pass is given back". F118-FR-025, F118-FR-036: the six keys and their variables named one by one. New F118-FR-044 (the one ingress), test CT-118-10. New sections "Threats" and "Repairs after the cross-feature review". Table of options: "(proposed)" dropped. Closed sets: rows 112 and 114 cited, the note on row 10 removed. Contracts used: rows 50 and 51, the ingress, the config envelope, the threat model |
| `plan.md` | Constitution v3.0.0 named; rows VI, XI, XVII, XVIII rewritten; `node:fs` among the forbidden modules (CQ-185); file writer and ingress as ports; the row "None" removed from Complexity Tracking; 44 requirements; owners of the package as in the package graph |
| `tasks.md` | Rows 44 and 45 are 50 and 51 (T009, T074). `proves:` of T002 and T059 hold ids only. T002 marked paid. Thirteen test names added to the tasks that hold them (T013, T014, T016, T017, T018, T040, T041, T042). New tasks T075 (PT-118-FX16-long-job), T076 (CT-118-10), T077, T078 |
| `data-model.md`, `research.md`, `quickstart.md`, `contracts/`, `checklists/requirements.md` | The same values carried: row 112 and its four members, the ingress, `node:fs`, the pass limit, rows 50 and 51, the count of 44 |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F118-FR-044 has T076 (test) and T077; all 44 requirements are in a `covers:` or a `proves:` |
| Task without a requirement | None. T075 to T078 name their requirement or their clusters |
| Test of a `test:` line without a task name | None. Every pattern `PT-118-<cluster>-*` has at least one named test in a task; `PT-118-FX16-long-job` is T075; CT-118-1 to CT-118-10 each have a task |
| `proves:` lines | Hold as-is ids, cluster ids and requirement ids only |
| Profile rows | 4, 5, 11, 50, 51 in `spec.md`, `tasks.md` and the checklist; no 44 or 45 is left |
| Members of the ending of a yield | `satisfied`, `timeout`, `stop`, `wall_budget` in F118-FR-020, the closed-set table, `data-model.md` and both contract files |
| Term of the limit | "pass limit" only; "iteration" is left in no sentence; the literals `SPECSTRIDE_YIELD_COUNTS_AS_ITER`, `loop.yield.countsAsIter`, `giveIterationBack`, `iter`, `iter_*` stay |
| Forbidden modules | `node:child_process` and `node:fs` in `plan.md`, `research.md` and T071 |
| Order of the pass ceiling | The same four steps in F118-FR-006, `research.md` row 13 and T013 |
| Count | 44 functional requirements, 6 success criteria, 78 tasks |
| `check-traceability.py --require-all` | Passed, checks a to h; feature 118: 181 of 181 items |

### What stays open

| # | Severity | Finding |
|---|---|---|
| 1 | High | The six keys `loop.yield.waitEvery`, `.logHead`, `.logTail`, `.failureLedger`, `.failureLedgerMax`, `.failurePattern` and their six variables are in no list of feature 110, and the alias table of annex X §X.8 has no row for `SPECSTRIDE_FAILURE_*`. The baseline reads all six. Reported to features 100 and 110 |
| 2 | Low | W-X-23 names F111-FR-023 as the ingress. F118-FR-044 cites F100-FR-009 and F100-FR-205, because a tier 2 feature cites feature 100 (`STAGE-B-RULES.md` section 5) |
