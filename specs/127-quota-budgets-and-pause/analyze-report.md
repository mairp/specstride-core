# Analyze report: feature 127-quota-budgets-and-pause

Date: 2026-09-29. Read-only analysis of `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `research.md`, `contracts/`. Passes run: 1 (no repair needed).

## Coverage

| Check | Result |
|---|---|
| Functional requirements | 41 (F127-FR-001 to F127-FR-041); success criteria 11 |
| Every requirement has a test name that a task in `tasks.md` writes | Yes: CT-127-1 to CT-127-39 all appear in both files; PT-127-C-007, C-009, C-010, C-012, C-013 appear in both |
| Every as-is id assigned to this feature is in an `origin:` | Yes: 002 FR-041, 002 FR-042, clusters C-007, C-009, C-010, C-012, C-013 and items B-0049, B-0068, B-0127, B-0143, B-0210, B-0270 |
| Rows with `superseded-by` or `dropped` | None assigned; stated in the spec |
| Every option or switch has a value under `parity` | Yes; rows 39 and 40 exist; five rows are "new" and reported |
| Closed sets listed with members and the unknown-value rule | Yes: rows 46, 47, 48 and four new sets |
| Constitution Check answers all twenty principles | Yes; N/A for IV, X, XIV, XX with reasons |
| `check-traceability.py` lines `[h` for this feature | None |
| No `[NEEDS CLARIFICATION]` marker | None |
| Requirement count under about 45 | 41; no split proposed |

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | The spend ledger has no logical name in annex B §B.5 of feature 100 | Reported; the spec proposes `run:<runId>:spend` |
| 2 | Medium | Annex X §X.7 has no rows for `loop.maxWallMin`, the budget keys, the alert thresholds and the rate table | Reported; the spec lists them as "new" rows |
| 3 | Medium | Annex D §D.4 gives the router no quota signal, although F100-FR-130 and F100-FR-140 need a skip on a limited target | Reported; the spec offers a query of the limit-window state (`CQ-136`) |
| 4 | Low | The pause record of annex B §B.17 is removed at resume, so the start of a pause episode cannot live in it | The spec keeps the episode start in the ledger; reported |
| 5 | Low | The brief lists four confidence values and R14 has a class `network`; annex C §C.13 has five and nine | The annex stands; recorded under Clarifications |
| 6 | Low | Four closed sets have no row in annex X §X.6 | Reported |
| 7 | Info | Nine readings are `CQ-129` to `CQ-137`, none blocks planning | Reported with recommendations |
| 8 | Info | Every provider limit signal and every macOS statement is `unverified` | Marked in the requirements |

No finding remains open inside this feature. Findings 1 to 4 and 6 need a change in feature 100.

## Split

Not proposed. The groups of heading 7 of the brief are G1 (9 requirements), G2 (8), G3 (6) and G4 (18).

## After the cross-feature review

Dated 2026-09-30. Repairs of `docs/ecosystem/reviews/REPAIR-WORKLIST.md` section "Feature 127" and its pointer list. A previous agent had already repaired `spec.md` (items W-127-01, W-127-02 in the spec, W-111-02, W-111-05, W-X-03, W-100-14, W-110-06, W-X-05, W-X-10 at `spec.md:567`, and three further faults found while repairing); this pass verified that edit and carried the changes into the remaining artifacts.

| Change | Items | Files |
|---|---|---|
| Per-class `retryable` carried into the default classifier table | W-127-02 | `contracts/classifier.table.json` (each classify row) |
| Logical name and schema id cited from annex B, not "to be added" / "proposed" | W-X-10 | `plan.md` (Storage), `data-model.md` (ledger row, readers engine/RunView/doctor), `contracts/spend-ledger.schema.json` (title), `contracts/README.md` |
| `$id` in the form `urn:specstride:schema:<schema id>` | W-100-16 | `contracts/spend-ledger.schema.json` |
| Owners of `@specstride/policy` are 110, 127, 147 | W-X-07 | `plan.md` (Technical Context, Project Structure, Structure Decision) |
| "tier bump" → "model-tier bump" | W-110-12 | `plan.md` (What is planned elsewhere) |
| Events and wall-clock wording carried into tasks | W-111-02, W-127-01 | `tasks.md` (T012 `fallback.skipped`; T075 `retryable: true`, no blocked reason) |
| "same-model warning" → "critic-diversity warning" | Table of feature 100 in W-127-02's area | `tasks.md` (T047) |

Consistency pass over the touched places: every requirement keeps its test and task (41 FRs, 11 SCs, unchanged; no id renumbered or reused); the events named in `tasks.md` T012 now match F127-FR-040; the ledger readers in `data-model.md` now match annex B §B.5 and the spec's clarification; the retryable values of `classifier.table.json` match the §Q.1 column. The features named in the pointer items (125, 131, 134, 138 and their classifier tables) are outside this feature's directory and were not edited.

`python3 docs/ecosystem/check-traceability.py --require-all` passes after the repairs (checks a to h).
