# Repair report — 142-parallel-units

Written by the repair agent of feature 142 on 2026-09-30, from the section of feature 142 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the table "What the other features must follow"
of `specs/100-specstride/repair-report.md`. Paths are relative to `specs/142-parallel-units/`.
Line numbers are those after the repair. Every item was checked against the file first.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-142-01 | repair | low | done | `spec.md:287` (F142-FR-022); `tasks.md:276` (T096); `data-model.md:30`; `contracts/loop-fields.json:16`, `:17` | Verified: the list held six keys. `wall-hours=` and `agent-hours=` added; the note of the contract file no longer asks feature 100 for fields that annex G §G.3 holds |
| W-111-03 | repair (pointer) | high | not applied (no change asked) | `plan.md:173`; `tasks.md:140` (T040, cases) | F142-FR-025 is unchanged. Verified on 2026-09-30: the catalogue of feature 111 still gives `groupId, check, result` and `groupId, result, refusal` (`specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:105`, `:110`). The plan and the test task name the fields that feature 111 adds |
| W-100-06 | repair (pointer) | medium | done | `spec.md:275`, `:278` (F142-FR-019), `:433`, `:501`, `:503`, `:486`; `plan.md:48`, `:155` to `:157`; `tasks.md:62` (T013), `:79` (T022); `data-model.md:13`; `contracts/loop-fields.json:16` | The ceiling is the key `loop.parallel.workersMax` (row 130, default 4, F100-FR-127). Test name CT-142-119 unchanged |
| W-100-14 | repair (pointer) | medium | done | `spec.md:284` (F142-FR-021) | "pass loop", "spends no pass", "pass count" |
| W-100-23 | queue (pointer) | medium | done (CQ-183) | `spec.md:208` to `:213` (F142-FR-003), `:431`, `:503`, `:649`; `tasks.md:109` (T030), `:147` (T043) | The question is queued as CQ-183. User configuration only; `assumption: CQ-183` |
| W-143-01 | repair (pointer) | medium | not applied (no change asked) | — | T068 of feature 143 does not move to this feature: the task list stays at 109. On 2026-09-30 T068 of 143 still names `packages/layer-parallel/src/decide.ts` (`specs/143-parallel-engine-services/tasks.md:192`); feature 143 changes it |
| W-X-11 | repair (pointer) | medium | done | `spec.md:239` (F142-FR-010), `:256` (F142-FR-015), `:506`, `:507`; `plan.md:48` | Rows 93, 94 and 96. No contract file of this feature held a row status |
| W-X-12 | repair (pointer) | medium | done | `spec.md:529`, `:530`, `:532`, `:486`; `contracts/closed-sets.json:54`, `:74`, `:86`; `plan.md:48`; `research.md:30` | Rows 185 and 186 verified in annex X §X.6 (`specs/100-specstride/annexes/X-cross-layer.md:356`, `:357`), owner 142. Row 65: owner 116 |
| W-X-18 | repair (pointer) | medium | done | `spec.md:291` (F142-FR-022), `:316` (F142-FR-055), `:457` | `ep: EP-16 specstride.toolchain/1 (consumes)` on both requirements that the row names |
| W-111-09 | repair (pointer) | low | not applied (no change asked) | — | See "What another feature or the orchestrator must do", point 2 |
| W-X-34 | accept | low | not applied (no change asked) | — | `analyze-report.md:13` is a record of the split |
| Table of feature 100, rows 1, 3, 4, 7 (owner 116) and the split 105/148 | — | — | done | `spec.md:54` to `:57`; `plan.md:166` to `:169` | The section "Out of scope" and the plan named 115 and 105 for what 116 and 148 own |
| Table of feature 100, rows 10 to 12 (owner 143) | — | — | done | `plan.md:36`; `data-model.md:17` | Verified by reading: no sentence claims the engine services of EP-04, the tree-store service or the ledger kinds. Two sentences that could be read so were made plain |
| Table of feature 100, row 13 (CQ-185) | — | — | done | `plan.md:46`, `:66`, `:145` to `:147`, `:155`, `:156`; `tasks.md:155` (T051), `:315` (T108) | No import of `node:fs` or `node:fs/promises` in the layer package and in the module group in the core |
| `CQ-pending-*` placeholders | — | — | not applied | — | None existed (`grep -rn CQ-pending` finds only the sentence of the analyze report that says so) |

Counts: 9 done; 5 not applied (4 of them "no change asked", 1 with nothing to change); 0 open.

## Requirements added or changed in place

None added. Changed in place, all listed in `spec.md`, "Repairs after the cross-feature review":
F142-FR-003, F142-FR-010, F142-FR-015, F142-FR-019, F142-FR-021, F142-FR-022, F142-FR-055.
Functional requirements: 46 (above 45, as before the repair; no split proposed). Success
criteria: 7. Tasks: 109; none added, removed or renumbered. Tasks changed in wording: T013, T022,
T030, T040, T043, T051, T096, T108.

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | 111 | Add `taskId` to `parallel.admission`, and `step` and `pathCount` to `parallel.integration` (W-111-03). Not yet in the catalogue on 2026-09-30 | `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv:105`, `:110` |
| 2 | 111 | W-111-09: F142-FR-025 says "every event of a worker MUST carry `workerId` and `wseq`"; F111-FR-015 says the `parallel.*` types carry `workerId` in `data` only. This feature was told not to change; if feature 111 keeps "in `data` only" for the two `parallel.worker.*` types, F142-FR-025 and T053 need one sentence | `spec.md:299`; `specs/111-event-schema-and-projection/spec.md:169` |
| 3 | 143 | Move T068 out of `packages/layer-parallel/` (W-143-01) | `specs/143-parallel-engine-services/tasks.md:192` |
| 4 | Orchestrator, feature 100 | The package graph names the owners 101, 149, 103, 117, 118 and 102 for `@specstride/core`. The plans of 142 and 143 both place a module group in `packages/core/src/parallel/`, and W-143-01 sends a task there. Either the graph adds 142 and 143 to the owners of `@specstride/core`, or the two plans move the code. Nothing was moved | `specs/100-specstride/contracts/data/package-graph.json`; `plan.md:128`; `specs/143-parallel-engine-services/plan.md:120` |
| 5 | Orchestrator, feature 100 | `loop.parallel.workersMax` is a widening key. F100-FR-202 says a widening key in project configuration is ignored; the repair report of feature 100 says project configuration "may lower it and never raise it". F142-FR-019 cites F100-FR-127 and F100-FR-202 and states neither reading | `specs/100-specstride/repair-report.md:131`; `specs/100-specstride/annexes/X-cross-layer.md:99` |
| 6 | 110 | The key list gives `loop.parallel.workers` the range "1 to 4" and has no line for `loop.parallel.workersMax` | `specs/110-config-and-terms/contracts/config-keys.tsv:86` |
| 7 | Orchestrator | The coverage check fails on files of the orchestrator, see "Checks" | — |
| 8 | Orchestrator | The ledger count of tasks of feature 142 is 109 (W-ORC-08) | `tasks.md` |

## New questions (each with a recommended answer and its source)

None of this feature. Point 5 above is question N-1 of feature 100 seen from the other side:
recommended answer, the rule of F100-FR-202 (ignored in project configuration), because it is a
requirement and the other sentence is a report.

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | The feature has none |
| The four JSON files of `contracts/` | Parse |
| `grep -cE '^\s*- \[[ xX]\] T[0-9]+' tasks.md` | 109 |
| `grep -c '^- \*\*F142-FR-' spec.md` | 46 |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED, exit 1, 7 errors, none on feature 142 and none of check h: four of check d (the divergence register holds DV-114 to DV-117, beyond the 113 rows the script expects) and three of check f (`traceability.md` against `traceability-items.tsv`: row C-154.b on B-2112, and the counts of section 4.1 for ported and translated). `docs/ecosystem/consolidation.md` and `docs/ecosystem/traceability-items.tsv` are changed in the working tree and not by this agent |
