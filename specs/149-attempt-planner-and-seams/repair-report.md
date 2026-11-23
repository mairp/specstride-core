# Repair Report: 149-attempt-planner-and-seams

Act B-8.6c, 2026-09-30. Repairs from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section
"Feature 149". The feature has no item of its own; it worked its three pointer items and one note
that stands from the repaired feature 101. Every item was verified against the files before it was
applied. No git command, no product code, no model call; writes only inside this directory.

## Item table

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-X-09 | repair | medium | done | `plan.md:78` (row XVII rewritten as a pass that cites the task); `tasks.md:168` (T034 added to Phase 7, the last phase) | Verified: the row XVII of the plan was already marked ✅, but its reason named no task and `tasks.md` held no macOS task — the fault stands as the worklist says. T034 follows the model of T104 of feature 109: run on the macOS runner when it exists, macOS stays `unverified` until then, a missing prerequisite (reference tree, oracle, macOS runner) reports a skip with its reason. Task appended as T034; no id reused |
| W-X-18 | repair | medium | done | `spec.md:207` (`ep:` line added to F149-FR-009) | Verified: the section "Extension points" (`spec.md:271`) names EP-05 `specstride.check-runner/1` as consumed and no requirement had an `ep:` line for it — the fault stands. F149-FR-009 is the requirement that consumes the condition of a result of the verification gate; the id `specstride.check-runner/1` checked against feature 100 annex C §C.8. The rows of EP-18, EP-02 and EP-04 already had their `ep:` lines and needed nothing |
| W-X-28 | repair | low | done | `plan.md:128-132`; `tasks.md:24, :30, :57, :80, :85, :88, :111, :114, :118, :121, :125, :167` (12 paths) | Verified: `tests/own/149/` stood in plan and task paths — the fault stands. Replaced by `tests/characterization/149/`, the rule of feature 100 (its repair report, row 36). This feature has no parity test (no as-is behaviour, §O.7), so `tests/parity/149/` is stated in the plan as the rule but is not used by any task |

Items not applied: none. All three pointer items were verified and applied as written. No item was
found wrong or already done, and no line number had moved enough to matter (plan row XVII at 78 as
stated; the EP-05 row of the spec is at 271 as stated).

## Requirements added or changed in place

No requirement was added; the count stays 10 functional requirements and 4 success criteria. One
requirement was changed in place, listed here as `spec.md` section "Repairs after the
cross-feature review" requires (dated 2026-09-30):

| Date | Requirement | Item / source | What changed |
|---|---|---|---|
| 2026-09-30 | F149-FR-009 | W-X-18 | Gained the line `ep: EP-05 `specstride.check-runner/1` (consumes)`. No other word of the requirement changed; the test CT-149-9 and its task T013 already cover it |
| 2026-09-30 | F149-FR-001 | Note of feature 101; feature 100 repair report row 23 | The sentence on the warning now says "critic-diversity warning", and the warning is due when the result of the diversity test is `same-model` **or** `unverified` (the model of the call is not known). The field name `sameModelWarning` of the catalogue of feature 111 is kept unchanged and is now named in the requirement. The same wording went into acceptance scenario 2 of US1, task T008, `quickstart.md` and the field table of `data-model.md` |

The sentence of F149-FR-001 was wrong as the note of feature 101 says: it raised the warning only
on a match, while the field behind it (`sameModelWarning`, owned by 111) is true for both results
`same-model` and `unverified` of the diversity test. The field name is unchanged; the sentence now
matches the field.

## What another feature or the orchestrator must do

- Feature 110 owns the spelling of `attempt.tier_bump` and `attempt.tier_bump_after` (rows 24 and
  128 of annex X §X.7); nothing in this repair touched them.
- Feature 111 owns the field `sameModelWarning`; the description of that field now carries the
  rule "true for `same-model` and `unverified`" from this side too. If 111 words its catalogue
  entry differently, its wording stands and this feature follows — no edit of 111 is asked.
- The orchestrator commits the changed files (no git command was run here).
- Nothing else: the package of this feature is `@specstride/core` in the graph of feature 100 and
  the plans and tasks already used it; no package rename was needed for W-X-01.

## New questions (each with a recommended answer and its source)

None. The one reading the sources did not settle, the default of K, is already queued as CQ-175
(`CLARIFY-QUEUE.md:184`, recommended answer 2, raised by feature 101) and is marked
`assumption: CQ-175` on F149-FR-003. No `CQ-pending-*` placeholder remains in the feature.

## Register rows needed (with the text)

None. The feature cites DV-076, DV-077 and DV-079, which exist.

## Checks

- No generator or check of this feature exists in `contracts/tools/` (the directory holds only
  `README.md`, `bump-table.json` and `ep18-seams.md`); nothing to run there.
- `python3 docs/ecosystem/check-traceability.py --require-all`: **PASSED** (checks a to h, 41 of 41
  Wave 1 features have a spec). Feature 149 appears in no failure line; it carries no as-is origin.
- The section "After the cross-feature review" (2026-09-30) is appended to `analyze-report.md`,
  with the consistency pass over spec, plan and tasks for the touched places: every requirement
  still has at least one task; T034 is operational and carries no `proves:` because the macOS
  statements it would verify live in the Constraints of the spec, which name no requirement; the
  coverage table of `tasks.md` is unchanged; no `tests/own/149/` and no "same-model warning"
  remains anywhere in the feature.
- No task that calls a model was added; T034 runs tests, and the PAID marking of T027 stands.
