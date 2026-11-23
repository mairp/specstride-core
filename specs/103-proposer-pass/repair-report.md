# Repair report — 103-proposer-pass

Date: 2026-09-30. Agent of act B-8.6c. Worked from the section "Feature 103" of `docs/ecosystem/reviews/REPAIR-WORKLIST.md` (1 own item, 10 pointers). Every item was verified against the files before it was applied; line numbers had moved in several places and are given here as found.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-103-01 | repair | medium | done | `spec.md` (F103-FR-018); `contracts/result-map.json` (row of result 8, entry `declared-block`); `tasks.md` T012; `analyze-report.md` | Verified first: the worklist's citation of `result-map.json:14` matches (the file has 17 lines; `declared-block` is on line 14). Annex E §E.2 confirmed as authority: `declared-block` holds when the proposer declared that it needs a human, or a harness asked a question, and the breaker fired. The result map now carries the condition on the `declared-block` entry and a `state: failed` on the row of result 8 |
| W-X-02 | repair | high | done | `plan.md` (Testing, Project Type, project tree, Structure Decision); `tasks.md` (line 25, T050–T056, T061); `quickstart.md` | The suites went to `packages/testkit/src/conformance/EP-04/` and `EP-15/`, the samples to `packages/testkit/src/samples/EP-04/` and `EP-15/`, as row 35 of the table of feature 100 gives it |
| W-X-03 | repair | high | done | `spec.md` (F103-FR-018 parity line; Configuration keys table); `research.md` (D-6, and the carry-over decision "row 45" → row 60); `tasks.md` T004 | Verified against `specs/100-specstride/annexes/X-cross-layer.md`: rows 59 and 60 exist with the keys and owners the worklist names. The table "Rows of the `parity` profile" of the spec already held 59 and 60 — it is the table the worklist calls right. "is needed" dropped. T004 closed as verified, not deleted (ids are never reused) |
| W-100-14 | repair | medium | not applied | — | Verified: already conforming. The only uses of "iteration" outside the literals are the assumption line that states the rule itself; "pass limit" and "pass count" are the names in use |
| W-X-05 | repair | medium | done | `spec.md` (Assumptions) | The count "94 rows, DV-001 to DV-094" replaced by a reference to `consolidation.md` section 6 without a count (117 rows today; the count moves with the repairs of other features, so no count is stated). The dependency on W-ORC-01/02/03 is thereby removed |
| W-X-07 | repair | medium | done | `plan.md` (Project Type; project tree) | The package graph gives the owners of `@specstride/core` today as "101, 149, 103, 117, 118, 102"; both plan places now state that, 149 included |
| W-X-09 | repair | medium | done | `plan.md` (row XVII); `tasks.md` (T087 new) | Row XVII was "N/A" with a reason not about tests (the worklist said "✅, not N/A"; the text had changed since). It is now a pass with its reason, and T087 records the macOS result of T082 as `unverified` with its reason and every skip with its reason |
| W-X-20 | repair | medium | done | `tasks.md` (T085 new) | Verified: CT-103-134 (`spec.md`, F103-FR-034) had no task. Every other `test:` name of the spec appears in a task of `tasks.md` (checked mechanically; the parity names match without the `-*` suffix) |
| W-X-22 | repair | medium | done | `spec.md` (new section "Threats") | Depends on W-100-17: done by feature 100 (its repair report, F100-FR-236 with CT-100-336). T-08 → F103-FR-030 (the assembler frames outside text as data); T-31 → F103-FR-039 (the ledger is chained, signed and validated on resume), both as annex X §X.9 names the owners 103 |
| W-X-24 | repair | medium | done | `spec.md` (F103-FR-016 changed in place; F103-FR-044 new); `tasks.md` (T017 extended, T086 new) | Verified: the three catalogue types appeared nowhere in the feature (finding B-8.2d-016 assigns `progress.swept` and `task.*` to 103). `progress.swept` is emitted after every pass with `from` and `to`; `task.planned` and `task.ticked` are emitted at the open of a phase attempt and after a pass that ticked a checkbox, with no edit of the task list by the loop, and never under `parity`. New test CT-103-144, new task T086 |
| W-100-16 | repair | low | done | `contracts/pass-loop-request.schema.json`, `contracts/pass-loop-result.schema.json` | `$id` was `specstride.internal/<name>`; now `urn:specstride:schema:internal:103:<name>/1`, the internal form of the rule of feature 100 |

## Requirements added or changed in place

- **F103-FR-018** — changed in place (W-103-01, W-X-03): the `declared-block` condition; the parity row is row 59 of annex X §X.7.
- **F103-FR-016** — changed in place (W-X-24): names the event `progress.swept` after every pass.
- **F103-FR-044** — new (W-X-24): the events `task.planned` and `task.ticked`, their fields, the rule that the loop ticks nothing, and their absence under `parity`. Test CT-103-144, task T086.
- The section "Repairs after the cross-feature review" (dated 2026-09-30) at the end of `spec.md` lists every change with its item id.

No id was renumbered or reused. New ids: F103-FR-044, CT-103-144, T085, T086, T087.

## What another feature or the orchestrator must do

- Feature 111: the catalogue rows `progress.swept` (fields `from`, `to`), `task.planned`, `task.ticked` now name feature 103 as an emitter; nothing to change in the catalogue itself.
- Feature 141: fixtures for CT-103-144 (`task.planned`, `task.ticked`) and for the two outcomes of the no-progress breaker of W-103-01 belong in the families that cover the pass loop (FX-17 to FX-20, FX-24); the events project to nothing at the baseline, so no compared surface changes.
- Feature 110: no new key. `loop.noProgressStructured` and the `carry.*` keys are already in annex X §X.7 rows 59 and 60.
- The orchestrator: nothing new. No `CQ-pending-*` placeholder existed in this feature.

## New questions (each with a recommended answer and its source)

None raised. All 11 items could be specified from the sources: annex E §E.2 decides W-103-01, annex X §X.7 decides W-X-03, annex X §X.9 and F100-FR-216 decide W-X-22, and B-8.2d-016 decides the emitters of W-X-24.

## Register rows needed (with the text)

None. W-103-01 needs no new row: DV-067 already carries the structured-path breaker, and the `failed` outcome is the ordinary stop `proposer_no_progress` with `retryable: false`, not an intended difference.

## Checks

- `contracts/tools/`: this feature owns no generator or check there; its contract files were validated as JSON after the edits.
- `python3 docs/ecosystem/check-traceability.py --require-all`: **PASSED**, checks a to h (110 requirements, 23 success criteria, 255 clusters, 2785 items; register rows cited 60 of 117).
- `analyze-report.md`: dated section "After the cross-feature review" appended, with the consistency pass over the touched places.
- Counts now: 44 functional requirements (F103-FR-001 to F103-FR-044), 9 success criteria, 71 tasks. Below the split mark of about 45; no split proposed.
