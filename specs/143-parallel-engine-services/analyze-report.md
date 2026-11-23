# Specification Analysis Report: Parallel engine services (feature 143)

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`,
`data-model.md`, `contracts/`, the constitution v3.0.0. Runs: 1. No repair was needed: the
requirements came from a specification that had been analyzed and repaired before the split.

## Findings

| ID | Category | Severity | Location | Summary | Recommendation |
|---|---|---|---|---|---|
| C1 | Contract of feature 100 | MEDIUM | `plan.md`, structure decision | The package graph of feature 100 holds no package for the tree store, which must start a process and so cannot live in the core | Feature 100 adds an edge package for the tree store, owner 143 |
| C2 | Contract of feature 100 | MEDIUM | "Closed sets"; annex X §X.6 rows 62, 64 | Annex X names feature 142 as the owner of the outcomes of a worker and of the operations of the tree store | Feature 100 names 143 |
| C3 | Contract of feature 100 | LOW | "Closed sets" | The ledger record kinds of the namespace `parallel` have no row in annex X §X.6. Annex B §B.13 names feature 142 as the owner of the namespace | Feature 100 adds the row and names 143 in annex B §B.13 |
| C4 | Contract of feature 100 | LOW | "Rows of the `parity` profile" | The option for seed paths has no row in annex X §X.7 | Feature 100 adds the row, "not used" under `parity`; feature 110 fixes the spelling |
| C5 | Contract of feature 100 | MEDIUM | F143-FR-016, F143-FR-025; annex D §D.1 | Two results go from the engine to the loop layer that annex D does not name: that the harness adapter declares no spending limit, and that an application could not be completed. The specification places the first in the view of the phase attempt and the second in the result of `integrateGroup` | Feature 100 names both in annex D §D.1 |
| C6 | Contract of feature 100 | LOW | F143-FR-017, F143-FR-020; annex D §D.2 | The engine receives "audited deltas", as the input of `compose` says. Annex D does not say by which directive the verdicts of the audits reach the engine | Feature 100 states that `integrateGroup` carries, per worker, accepted or the refusal reason |
| U1 | Unverified | LOW | F143-FR-005, F143-FR-007, F143-FR-010; `research.md` D-3 | macOS statements and the git floor are `unverified` | Tasks T070 and T002 |
| T1 | Terminology | LOW | F143-FR-023 | The record kind `merge_done` records a composition | Kept: the brief and R29 name the kind |
| O1 | Origin | LOW | F143-FR-003, F143-FR-006, F143-FR-027 | These state what 002 FR-048 translated to and carry no `origin:`, because the row stays with the first part of the split | None; decided by the orchestrator |

No CRITICAL and no HIGH finding. No conflict with a principle of the constitution. No marker
that asks for clarification, no placeholder, no open question and no register row to be written.

## Coverage Summary

| Requirement keys | Has task? | Test tasks | Implementation tasks |
|---|---|---|---|
| F143-FR-001 to F143-FR-028 | Yes, all 28 | CT-143-101 to CT-143-128, one each | One each |
| F143-SC-001 | Yes | CT-143-102; CT-143-132 (the probe) | — |
| F143-SC-002 | Yes | CT-143-130 (the kill test); CT-143-125 | — |
| F143-SC-003 | Yes | CT-143-115 | — |
| The tree-store interface | Yes | CT-143-129 (conformance) | — |
| The queue | Yes | CT-143-131 (property test) | — |

**Unmapped tasks**: none.

**As-is ids**: none assigned, none cited. `proves:` of every test task names requirement ids of
this feature only.

**Citations of the other part of the split**: none in a requirement, a success criterion, a
task, the plan or the data model. The other part is named only in the table "Ids before the
split", in the input line and in the notes on the split.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 28 |
| Success criteria | 3 |
| Tasks | 72 |
| Requirements with at least one task | 100 per cent |
| As-is ids carried | 0 |
| Findings | 9: 0 critical, 0 high, 3 medium, 6 low |
| Ambiguity count | 0 |
| Duplication count | 0 |

## Next Actions

- No critical issue. The specification can go to the clarification round.
- The orchestrator takes C1 to C6 to feature 100.

## After the cross-feature review

Date: 2026-09-30. Source: the section of feature 143 in
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the table "What the other features must follow"
of `specs/100-specstride/repair-report.md`. The details are in `repair-report.md`.

### What changed

| Item | Change |
|---|---|
| W-143-01 | Task T068 writes `packages/core/src/parallel/counters.ts`; the plan lists the file. No task writes in `packages/layer-parallel` |
| W-100-07 | Closed set 64 is closed by design, in `spec.md` and in `contracts/closed-sets.json`. New section of `spec.md` that names, per operation, the requirement that needs it |
| W-X-07 | The plan and `research.md` D-5 state that the package graph holds `@specstride/tree-store`, owner 143 |
| W-X-11 | F143-FR-007: row 95 of annex X §X.7 |
| W-X-12 | The ledger record kinds are row 184 of annex X §X.6; the sentence on the old owner is removed |
| W-X-28 | Tests in `tests/characterization/143/`; `tests/parity/143/` is empty; the behaviour cases of the tree-store service in `packages/testkit/src/conformance/EP-04/` |

### State of the findings of 2026-09-29

| Finding | State |
|---|---|
| C1 (no package for the tree store) | Closed by feature 100: the package graph holds `@specstride/tree-store`, owner 143 |
| C2 (owner of rows 62 and 64) | Closed by feature 100: annex X §X.6 names 143 |
| C3 (no row for the ledger record kinds; owner of the namespace) | Closed by feature 100: row 184 of annex X §X.6; annex B §B.13 names 143 |
| C4 (no row for seed paths) | Closed by feature 100: row 95 of annex X §X.7 |
| C5 (two results of the engine that annex D §D.1 does not name) | Open. Annex D names neither; reported again |
| C6 (the directive that carries the verdicts of the audits) | Open. Annex D does not say it; reported again |
| U1, T1, O1 | Unchanged |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. 28 requirements, each with one test task and one implementation task |
| Task without a requirement | None. T068 still names F143-FR-028 |
| New requirement | None; no new test and no new test task was needed |
| Closed sets: `spec.md`, `data-model.md`, `contracts/closed-sets.json` | Equal: rows 62, 64, 184, each closed by design, the same members |
| Profile rows: `spec.md` F143-FR-001, F143-FR-007, F143-FR-011, F143-FR-020, F143-FR-021 and the section on rows | Rows 10, 20 and 95; no row "to be added" is left |
| Test paths: `plan.md`, `tasks.md`, `quickstart.md` | One spelling each: `tests/characterization/143/` and `packages/testkit/src/conformance/EP-04/`. `tests/parallel/` and `tests/conformance/143/` occur nowhere |
| Package names: `plan.md`, `tasks.md`, `research.md` | `packages/tree-store` and `packages/core/src/parallel` only |
| Placeholders `CQ-pending-*`, `DV-new-*` | None in this feature |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 28 |
| Success criteria | 3 |
| Tasks | 72 |
| Findings that stay | C5, C6 (medium, low; with feature 100); two observations in `repair-report.md` |
