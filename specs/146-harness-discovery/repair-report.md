# Repair report — feature 146 (146-harness-discovery)

Date 2026-09-30. Act B-8.6c. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section
"Feature 146" (one own item, W-146-01, and five pointer items). Every item was verified against
the files before it was applied; line numbers of the worklist had moved and are restated here.

## Item table

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-146-01 | repair | high | done | `spec.md` (Key Entities, row "Result of harness verification"); `data-model.md` ("Result of harness verification"); `contracts/schemas/harness-verify-result.schema.json` (rewritten) | Verified first: the files held five fields (`harness`, `version`, `descriptorHash`, `at`, `outcome`), no `schema`, `cases` or `budget`, and no `$id`. Now eight fields, `schema` required, `$id urn:specstride:schema:specstride.harness-verify/1`. The sentence "Feature 100 gives the logical name and no schema" is dropped from `data-model.md`. Depends on W-100-16: done by feature 100 (its repair report, table row 32: the `$id` rule stands in `contracts/README.md`). Feature 109, the writer, took the same eight names on 2026-09-30 (`specs/109-harness-seam/data-model.md:88` to `:97`); the confirmation of feature 109 in the brief is carried out |
| W-100-13 | repair | medium | verified, not applied | — (no change) | Verified: all `ep:` lines of `spec.md` (12 of them, F146-FR-001 to F146-FR-004, -006 to -008, -010, -013, -015 to -018) say `consumes`; none names a sub-point "discovery: 146". The worklist itself says "no change: all 11 `ep:` lines say `consumes`" |
| W-X-07 | repair | medium | done | `plan.md:143` to `:144` | Verified against `specs/100-specstride/contracts/data/package-graph.json`: the package `@specstride/harness` names the owners "109, 124, 126, 146". The stale sentence ("after the split 146 joins them, which is reported") replaced by the present state |
| W-X-11 | repair | medium | done | `spec.md` (parity line of F146-FR-016; table "Rows of the `parity` profile"; Assumptions); `contracts/config-keys.json`; `contracts/parity-rows.json`; `contracts/requirements.json`; `research.md` (table of R16) | Verified: rows 87, 88 and 89 of annex X §X.7 exist (`X-cross-layer.md:552` to `:554`) and are confirmed in the key list of feature 110 (`config-keys.tsv:146`, `:147`, `:207`). Labels P-1 to P-3, "proposed" and "requested" removed; `row` set and status "confirmed" in both contract files. `owned` in `parity-rows.json` set to 87, 88, 89. The register of row 89 aligned to DV-049, as annex X §X.7 and the table of `spec.md` already had it (DV-106 stays the divergence of F146-FR-016 itself). Depends on W-X-03: that item names no file of this feature, and no row of this feature was cited by a wrong number — F146-FR-012 already said "rows 87 and 88"; only the labels stood in the way, and they are removed |
| W-X-18 | repair | medium | done | `spec.md` (F146-FR-014); `contracts/requirements.json` | Verified: the row EP-14 of "Extension points" had no `ep:` line behind it. Added `- ep: EP-14 `specstride.doctor/1` (consumes)` to F146-FR-014, the requirement that yields the doctor findings of probes. EP-02 and EP-10 already had their lines |
| W-X-25 | repair | medium | done | `spec.md` (F146-FR-016; step `catalogue` of the probe ladder); `plan.md` (Storage); `research.md` (D-7) | Verified against annex B §B.5 (`B-state.md:251`): `package:catalogue` exists; also `package:harness:<id>` (`:250`). The requirement that reads the catalogue names it; the plan and the research no longer say the names are "requested from feature 100" |

Counts: 5 items done, 1 verified and correctly not applied (W-100-13), 0 open.

## Requirements added or changed in place

No requirement was added; the count stays 19 functional requirements and 3 success criteria.
No id was renumbered or reused. Changed in place, listed in `spec.md` under
"Repairs after the cross-feature review" (2026-09-30):

| Requirement | Item | What changed |
|---|---|---|
| F146-FR-014 | W-X-18 | Gained the line `- ep: EP-14 specstride.doctor/1 (consumes)` |
| F146-FR-016 | W-X-11, W-X-25 | Parity line cites row 89 of annex X §X.7 (was "new row P-3"); names the logical name `package:catalogue` for the catalogue window source |

The Key Entities row "Result of harness verification" changed with W-146-01 (field list of
`specstride.harness-verify/1`); it is not a requirement.

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Feature 109 | Nothing new. W-146-01 is now done on the reader side with the same eight field names and the same `$id` that 109 already carries. Its repair report, "What another feature must do" point 1, is settled |
| 2 | Orchestrator | Nothing of the register: no new divergence row is needed (DV-049, DV-064, DV-106, DV-068 exist). No `CQ-pending-*` placeholder was in this feature, so no number had to be filled in |

## New questions (each with a recommended answer and its source)

None. Every item of this feature was decidable from the sources; no question is queued.

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of the feature in `contracts/tools/` | None exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Pass (checks a to h; exit 0), run after the repairs |
| JSON of `contracts/` parses | Pass, all eight files and both schema files |
| Consistency pass over spec, plan and tasks | Pass; recorded in `analyze-report.md`, section "After the cross-feature review" |
| Requirement and task counts | 19 functional requirements, 3 success criteria, 30 tasks (unchanged; under the split bound) |
| No `CQ-pending`, no `DV-new`, no `[NEEDS CLARIFICATION]` left | Pass |
| Machine-specific backend named nowhere | Pass (only "a locally registered backend", in the constraints the plan repeats) |
