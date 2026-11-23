# Contracts of feature 117

Feature 117 exposes no interface to another feature beyond the contracts of feature 100. The files
here are data of the plan. Where a file and `spec.md` differ, `spec.md` stands.

| File | Content | Requirements |
|---|---|---|
| `as-is-literals.json` | Headings, lines and markers that parity compares byte for byte | F117-FR-007, F117-FR-011, F117-FR-014, F117-FR-017, F117-FR-021, F117-FR-023, F117-FR-031 |
| `budgets.json` | The numbers of the as-is budgets, and the two new values | F117-FR-002, F117-FR-003, F117-FR-011, F117-FR-012, F117-FR-023, F117-FR-034, F117-FR-035 |
| `closed-sets.json` | The eight closed sets of `spec.md`, rows 115 to 122 of annex X §X.6 | "Closed sets" |
| `parity-rows.json` | Rows 52 to 58 of the `parity` profile (annex X §X.7), status confirmed | "Rows of the `parity` profile" |
| `schemas/hidden-files.schema.json` | The record `specstride.hidden-files/1` of annex B §B.20, which this feature owns; `schema` is required | F117-FR-040 |
| `critic-block-set.json` | The two block sets and the protected blocks | F117-FR-026, F117-FR-029 |
| `excluded-vocabulary.json` | Excluded fields and the word list | F117-FR-027, F117-FR-038 |

Schemas used from feature 100: `fact-block.schema.json`, `withheld-paths.schema.json`.
