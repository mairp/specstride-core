# Contracts of feature 116

Data and schemas of check integrity and unit evidence. **Where a file here and `spec.md` differ,
`spec.md` stands.** Where `spec.md` and an annex of feature 100 differ, the annex stands and the
difference is reported.

| File | Content | Mirrors |
|---|---|---|
| `closed-sets.json` | The 5 closed sets this feature states | `spec.md`, "Closed sets"; feature 100 annex X §X.6 rows 27, 65, 66, 142, 143 |
| `parity-rows.json` | Row 32 of the profile | `spec.md`, "Rows of the `parity` profile"; annex X §X.7 |
| `integrity-rules.json` | The 18 integrity rules owned here: requirements, test | `spec.md`, "Integrity rules and their tests" |
| `tamperings.json` | The 7 seeded tamperings and the condition each must give | F116-SC-001 |
| `fact-block-content.md` | What the fact block holds and what it never holds | F116-FR-016 to F116-FR-021; annex D §D.7 |
| `schemas/toolchain-profile.schema.json` | `specstride.toolchain/1`, the content of EP-16 | F116-FR-013; annex C §C.14 |
| `schemas/protected-set.schema.json` | `specstride.protected-set/1` | F116-FR-001 to F116-FR-004, F116-FR-023; annex B §B.20 |
| `schemas/check-result.schema.json` | `specstride.check-result/1` | F116-FR-005, F116-FR-008, F116-FR-023; annex B §B.20 |
| `deliver.json` | The files above that go into `packages/contracts/data/` and `packages/contracts/schemas/`, with their target names | F116-FR-023; `analyze-report.md`, "Proposed upstream fixes", P-1 |

The JSON files were generated from the tables of `spec.md`. The schema of the fact block itself
is owned by feature 100 (`specs/100-specstride/contracts/schemas/fact-block.schema.json`) and is
not repeated here.

The schema ids `specstride.protected-set/1` and `specstride.check-result/1` are fixed by feature
100, annex B §B.20, with this feature as owner; F100-FR-227 asks the owner to list the fields
(`spec.md`, "Records owned by this feature") and to deliver the schema files to the `contracts`
package. The schema file of `specstride.toolchain/1` is the one that annex C §C.14 of feature 100
names.

The `$id` of a schema file has the form `urn:specstride:schema:<schema id>`, with the version
(`specs/100-specstride/contracts/README.md`).
