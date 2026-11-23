# Analysis report: Front door (feature 119, after the split)

Run 1 after the split. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`.

## Findings

| ID | Category | Severity | Location | Summary | Action |
|---|---|---|---|---|---|
| A1 | Gap in ids | none | spec.md | F119-FR-034 to F119-FR-055 and F119-SC-007 are moved; the table "Requirements moved to `145-presenter`" explains the gap | — |
| A2 | Ambiguity | MEDIUM | F119-FR-030 to F119-FR-032 | Default-output lines, follow-mode cap and data frame are readings (CQ-094 to CQ-096) | Reported |
| A3 | Inconsistency | LOW | F119-FR-033 | F100-FR-172 (`--json` is one record) against the baseline's `events --json` | Compatibility output keeps the baseline; reported |
| A4 | Underspecification | MEDIUM | F119-FR-024 | "Approved" as marker or verified record (CQ-041, feature 104) | Proceeds on CQ-041's recommendation |
| A5 | Citation | LOW | F119-FR-021 | The card is specified by the sibling feature; feature 100 holds no contract for the presenter | Named without citing a requirement; reported |
| A6 | Constitution | none | plan.md | Twenty gates answered; no violation | — |

## Coverage

33 requirements (F119-FR-001 to F119-FR-033, no gap inside) and 7 success criteria; every one appears in a task. Every kept as-is id that stays (7 requirement rows, clusters C-009, C-108, C-109, C-111 to C-115, items B-0009, B-0034, B-0187, B-0235) is in an `origin:` and a `proves:`, checked by my own script. `check-traceability.py` still lists the moved clusters as missing from 119 until the rows are moved; expected.

Ambiguities 2, duplications 0, critical issues 0.

## Remaining

Nothing.

## After the cross-feature review

Dated 2026-09-30. Repairs from the section of feature 119 of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, after the partial edit committed as `80394a0` (spec.md only). Changed: F119-FR-056 and F119-SC-009 added (W-119-01); F119-FR-009 (CQ-184), F119-FR-003, F119-FR-017, F119-FR-018, F119-FR-033, F119-FR-015 changed in place (W-100-24, W-X-06, W-X-26, W-X-31); plan rows XVII and XVIII repaired, the GATE line added, the bundler named (W-X-08, W-X-09, W-X-14, W-119-01); tasks T001 repaired and T059 to T066 appended (W-X-09, W-X-14, W-X-20, W-119-01); five schema files written under `contracts/schemas/` (W-X-26). W-X-34 asks no change.

Consistency pass over the touched places:

- Every requirement of `spec.md` (34 functional, 8 success criteria) appears in a task with `proves:` or `covers:`; the two new requirements have CT-119-19, T064, T065 and F119-SC-009.
- Every `test:` name of `spec.md` has a task: the four parity families that had none (PT-119-C-109, PT-119-C-009, PT-119-C-012, PT-119-C-013) have T059 to T062; CT-119-18 has T063.
- The term "startup check" and the counts (34 requirements, 8 success criteria) are the same in spec, plan, tasks, quickstart and data-model. The divergence rows of the plan's row XVIII are now by reference, so no list can go stale.
- The schema ids of `contracts/front-door.md`, the table of F119-FR-033 and the five `$id` values of `contracts/schemas/` agree; `status` and `watch` are stated as not records of this feature.
- One deliberate gap in ids stays (F119-FR-034 to F119-FR-055): the ids of the move to `145-presenter` (finding A1 of run 1).


## Proposed upstream fixes

Dated 2026-09-30, from the analyze run of that day (finding F16). This feature is already correct under the proposal: F119-FR-032, `data-model.md` and task T026 carry the cap.

| Target | Section | Change (ready to apply) | Why |
|---|---|---|---|
| `docs/ecosystem/CLARIFY-QUEUE.md` | row CQ-096 (feature 119) | Append to the recommended answer: "The framed text is cut to 16,384 bytes per frame, the cap the front door hands to `redact` (annex X §X.4); the begin line's `bytes=<n>` gives the size before the cut. Applied 2026-09-30 in F119-FR-032." | `redact` takes the cap as an input from its caller and no source gives the front door a value, so F119-FR-032 was not testable (CT-119-14). 16,384 bytes (about 5,850 tokens at the 2.8 bytes per token of R17) lets a host read a whole feedback or verdict on request, is under the parity cap on the ingress (F100-FR-009: 60,000 characters of evidence), and keeps an opt-in `--verbose` call bounded. No change to feature 100 is needed: the cap is a value its caller supplies |
