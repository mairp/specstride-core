# Contracts of the plan: Harness seam (feature 109)

Data of the plan. `spec.md` stands where a file and the specification differ. The interface of
the harness port, the schema of the descriptor and the schema of the overlay are owned by
feature 100 (`specs/100-specstride/contracts/`) and are not copied here.

| File | Content | Requirements |
|---|---|---|
| `closed-sets.json` | The 12 closed sets of annex X §X.6 that this feature owns, with every member; the 9 sets it introduced, which are rows 123 to 131 of annex X §X.6; the open sets | F109-FR-009, F109-FR-011, F109-FR-014, and the section "Closed sets" of `spec.md` |
| `capability-levels.json` | P1 to P6 and C1 to C6 | F109-FR-002 |
| `overlay-rules.json` | The rules of a declaration, the scope values, the order of the environment record, the messages and the result codes | F109-FR-030 to F109-FR-035 |
| `overlay-marker.schema.json` | The marker of an overlay tree, a part of `specstride-overlay/v1`; `$id` `urn:specstride:schema:specstride-overlay/v1:marker`, in the form of the README of the contracts of feature 100 (CQ-064) | F109-FR-032, F109-FR-036 |
| `conformance-cases.json` | The cases of the conformance suite | F109-FR-042, F109-FR-044 |
| `parity-rows.json` | The rows of the `parity` profile this feature reads, and its settings | The section "Rows of the `parity` profile" of `spec.md` |
| `traceability.json` | Per as-is id of this feature: disposition, requirements, test, fixture families, register row | F109-SC-007 |

`traceability.json` is generated from `docs/ecosystem/traceability-items.tsv` and the mapping of
items to requirements of `spec.md`. Items of a declared overlay name FX-39 (feature 141, §O.2).

The stored result of `harness verify` (`specstride.harness-verify/1`) has no schema file here: the
schema file is delivered by the owner that feature 100, annex B §B.20 names. `data-model.md` lists
the fields this feature writes, under the owner's names.
