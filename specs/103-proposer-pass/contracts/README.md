# Contracts of feature 103

Development data of this feature. They are internal to the core: the pass loop is not a public command (F100-FR-171), so the request and the result are not an interface contract of the product. The interface contracts of the product are in `specs/100-specstride/`; where a file here and an annex of feature 100 differ, the annex stands.

| File | What it holds | Requirement |
|---|---|---|
| `pass-loop-request.schema.json` | The request record of one phase attempt | F103-FR-001, F103-FR-002 |
| `pass-loop-result.schema.json` | The result record | F103-FR-001, F103-FR-019, F103-FR-021 |
| `result-map.json` | The table from a result of the pass loop to the engine's exit and stop reason | F103-FR-019 |
| `accounting-order.json` | The order of the steps after a pass | F103-FR-022 |
| `fresh-session-reasons.json` | The eleven drop rules and their parameters; the reasons `no-continuation` and `layer-requested` of a session that is always fresh | F103-FR-042, F103-FR-043 |
| `core-ledger-kinds.json` | The closed set of record kinds of the namespace `core` | F103-FR-039 |
| `closed-sets.json` | The six closed sets this feature owns or uses, with their members and their rule for an unknown value; delivered into the package as `data/closed-sets-103.json` (T002) | F103-FR-022, F103-FR-025, F103-FR-039, F103-FR-042 |
| `schemas/handoff.schema.json` | The handoff, the one carry-over file that crosses a FILE boundary; delivered into the package as `schemas/handoff.schema.json` (T003) | F103-FR-041 |
| `deliver.json` | What the sync script of feature 100 delivers from this directory into `packages/contracts/` (its T299) | F103-FR-041 |
| `core-modules-rule.json` | The import-boundary rule of the module groups of this feature; copied to `tools/import-boundary/rules/core-modules-103.json` (T001) | F103-FR-028 |
| `scenarios.json` | The nine scenarios `103-<name>` this feature adds to the families FX-17, FX-18 and FX-19 of feature 141 (T005) | F103-FR-002, F103-FR-006 |
| `claim-check.json` | The 107 claims of this feature for the claim check of the exercise map, each with its evidence line at the baseline (T005) | F103-FR-002, F103-FR-006 |

The build checks each file against `spec.md`: every stop reason exists in annex E §E.3, every code in annex E §E.4, every reason of a fresh session in the closed set of the spec.

The two schemas of the pass loop are copied into `packages/core/src/pass-loop/` and compared against the copies here byte for byte by `packages/core/test/pass-loop-schemas-103.test.ts`; the handoff schema and `closed-sets.json` are delivered into `@specstride/contracts` and compared the same way. `closed-sets.json` is checked against the section "Closed sets" of `spec.md` and against annex X §X.6 by `packages/contracts/test/closed-sets-103.test.ts`, `core-modules-rule.json` by `tools/import-boundary/test/core-modules-103.test.ts`, and `scenarios.json` and `claim-check.json` by `tests/characterization/103/setup-103.test.ts`.

What this directory asks of another feature is in `../orchestrator-report.md`: the exercise map of feature 141, the nine rows of its catalogue, and the thirteenth member of row 133 of annex X §X.6.
