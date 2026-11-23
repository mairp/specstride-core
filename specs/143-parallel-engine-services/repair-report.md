# Repair report — 143-parallel-engine-services

Written on 2026-09-30 by the repair agent of feature 143, from the section of feature 143 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the table "What the other features must follow" of
`specs/100-specstride/repair-report.md`. Paths are relative to
`specs/143-parallel-engine-services/` unless they start with `specs/`, `docs/` or `packages/`.
Line numbers are those after the repair. Every item was checked against the file first.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-143-01 | repair | medium | done | `tasks.md:197` (T068); `plan.md:127` | Verified: T068 named `packages/layer-parallel/src/decide.ts`, a file of feature 142. It now names `packages/core/src/parallel/counters.ts`, the side the worklist gives. The task stays in 143, because F143-FR-028 is a requirement of 143. The counters are ledger records written through the ledger interface; the file imports no `node:fs` |
| W-100-07 | repair | medium | done | `spec.md:389`, `:392` to `:395`, `:397` to `:413`; `contracts/closed-sets.json:19`; `data-model.md:73` | "Design". A new section of `spec.md` names the requirement that needs each of the seven operations. Result of the check below: all seven are needed |
| W-X-07 | repair | medium | done | `plan.md:38`, `:86` to `:88`; `research.md:40` | Verified against `specs/100-specstride/contracts/data/package-graph.json`: `@specstride/tree-store`, layer L1, owner 143. The two sentences that the graph lacks the package are replaced by the present state |
| W-X-11 | repair | medium | done | `spec.md:185` (F143-FR-007); `plan.md:44` | Row 95 of annex X §X.7 verified (`loop.parallel.seedPaths`, owner 143, DV-080). The section "Rows of the `parity` profile" already named row 95 |
| W-X-12 | repair | medium | done | `spec.md:390`, `:392`, `:359`, `:360`; `contracts/closed-sets.json:33`; `plan.md:44` | Row 184 of annex X §X.6 verified, with the same thirteen members. The sentence on the owner 142 is removed |
| W-X-28 | repair | low | done | `plan.md:34`, `:129` to `:134`; `tasks.md:11` to `:14` and 33 task paths; `quickstart.md:15`, `:24`, `:33`, `:42`, `:52`, `:60` | `tests/parallel/143/` became `tests/characterization/143/`. `tests/parity/143/` is named and is empty: the feature has no parity test. See the choice on the conformance test below |
| Table of feature 100, rows 1, 4, 7 | — | — | done | `spec.md:59` | "Out of scope" named 115 as owner of fingerprints, the protected set and toolchain profiles; it is 116 |
| Table of feature 100, row 13 (CQ-185) | — | — | done | `plan.md:62`; `tasks.md:207` (T071) | The plan states that the modules of this feature in the core import neither `node:fs` nor `node:fs/promises`; T071 tests it. No requirement changed, so no requirement carries the mark `assumption: CQ-185` |
| Table of feature 100, row 35 | — | — | done | `plan.md:129` to `:131`; `tasks.md:36`, `:37` (T009, T010); `quickstart.md:24` | A choice of this agent, not asked by an item: `tests/conformance/143/` became `packages/testkit/src/conformance/EP-04/`, the folder in which feature 100 places its contract tests of the tree-store service (`specs/100-specstride/tasks.md:381`, T128). Test name CT-143-129 unchanged |

Counts: 6 items done, 0 not applied, 0 open. Three further changes follow the table of feature 100.

## Requirements added or changed in place

| Requirement | Item | Change |
|---|---|---|
| F143-FR-007 | W-X-11 | The line `parity:` reads "not used (row 95 of annex X §X.7)". The text of the requirement is unchanged |

No requirement was added. 28 functional requirements, 3 success criteria, 72 tasks. No id and no
test name was renumbered or reused. The section "Repairs after the cross-feature review" is at
`spec.md:482`.

## Closed set 64 and ruling P3: is each operation needed?

Yes, all seven. No operation is without a requirement.

| Operation | Requirement of 143 | Requirement of 142 that relies on it |
|---|---|---|
| `snapshot` | F143-FR-003, F143-FR-017 | F142-FR-063 (fingerprints (a) and (c)) |
| `materialize` | F143-FR-006, F143-FR-007, F143-FR-008 | F142-FR-074 |
| `changed` | F143-FR-006, F143-FR-008, F143-FR-019 | F142-FR-054 to F142-FR-057 (the audits read the delta) |
| `compose` | F143-FR-019 | F142-FR-058 (reason `overlap`) |
| `apply` | F143-FR-020, F143-FR-025 | F142-FR-059 (the merge check follows the application) |
| `release` | F143-FR-027, F143-FR-009 | — |
| `sweep` | F143-FR-027, F143-FR-018 | F142-FR-070 (the sweep before a critic-class call) |

The column of feature 142 is in this report only. `spec.md` cites requirements of 143 alone,
as `STAGE-B-RULES.md` section 5 asks.

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | Orchestrator, feature 100 | The package graph names the owners "101, 149, 103, 117, 118, 102" for `@specstride/core`. Features 143 and 142 both plan modules in `packages/core/src/parallel/`, and the worklist moves T068 there. Either the owner list of `@specstride/core` names 142 and 143, or the graph says that a module group of the core may belong to a feature that is no owner of the package | `specs/100-specstride/contracts/data/package-graph.json`, entry `@specstride/core`; `plan.md:120` to `:128`; `specs/142-parallel-units/plan.md`, "Source Code" |
| 2 | Orchestrator, feature 100 | Annex D §D.1 still names neither of the two results that the engine gives to the loop layer: that the harness adapter declares no spending limit (F143-FR-016), and that an application could not be completed (F143-FR-025). Rows of 143 in `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:217` | `grep` for `spendLimit` and "not completed" in `specs/100-specstride/annexes/D-pass-loop.md`: no hit |
| 3 | Orchestrator, feature 100 | Annex D does not say that `integrateGroup` carries, per worker, accepted or the refusal reason | `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:216` |
| 4 | Orchestrator | `docs/ecosystem/STAGE-B-F100-AMENDMENTS.md:215`, `:218`, `:219`: the rows of 143 on the owner of rows 62 and 64, on the row of the ledger kinds and on the package are applied by feature 100 and still say "no" | Annex X §X.6 rows 62, 64, 184; the package graph |
| 5 | Feature 142 | Nothing from W-143-01: the task did not move to 142, and `specs/142-parallel-units/plan.md:124` needs no change | — |
| 6 | Feature 100 (observation) | Annex D §D.2 says that `release` writes the worker root only. F143-FR-027 removes a worker tree "with its entry in the store", a wording of R29v PU-93 that comes from linked worktrees. Since ruling P6 a worker tree is a repository of its own and the store holds no entry per tree. F143-FR-014 keeps the snapshot of a killed worker in the store until the phase attempt ends, so "entry" cannot mean the snapshot. Not changed, because no item names it | `spec.md:214`, `:265`; `specs/100-specstride/annexes/D-pass-loop.md`, table of operations |
| 7 | Orchestrator | The rule of feature 100 for `tests/characterization/<n>/` speaks of a test "that pins as-is behaviour against the reference". The 31 tests of feature 143 in that directory pin new behaviour; the feature carries no as-is id. The directory was taken as the worklist and the order say | `specs/100-specstride/plan.md`, "Place of parity and characterization tests" |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-143-1 | Does "with its entry in the store" in F143-FR-027 still have a meaning after ruling P6? | R29v PU-93; ruling P6; annex D §D.2 (`release` writes the worker root) | No. The words are dropped from F143-FR-027 in a later repair; `release` removes the tree and its temporary directory, and snapshots leave the store with `sweep` | `release` writes the store as well, and the table of annex D §D.2 changes |

## Register rows needed (with the text)

None. The feature cites DV-010, DV-080, DV-084 and DV-085, which exist.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | The feature has none |
| `contracts/closed-sets.json` | Parses as JSON; equal to the table "Closed sets" of `spec.md` |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with 1 error, of another feature: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)`. No error names feature 143 |
| Words left in the feature: `tests/parallel`, `tests/conformance/143`, `layer-parallel`, "none yet", "to be added", "Owner decision" | None, apart from the quotations in the table of repairs of `spec.md` and in the record of 2026-09-29 of `analyze-report.md` |
| `analyze-report.md` | Section "After the cross-feature review" appended |
