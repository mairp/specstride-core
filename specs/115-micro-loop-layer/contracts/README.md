# Contracts of feature 115

Data and schemas of the micro-loop layer. **Where a file here and `spec.md` differ, `spec.md`
stands.** Where `spec.md` and an annex of feature 100 differ, the annex stands and the difference
is reported.

| File | Content | Mirrors |
|---|---|---|
| `router-table.json` | The shipped router rule table: signals, choice sets, 20 rows | `spec.md`, "The shipped router table"; feature 100 annex D §D.4, annex X §X.3 |
| `closed-sets.json` | The 10 closed sets this feature states | `spec.md`, "Closed sets"; annex X §X.6 |
| `parity-rows.json` | The rows of the profile that this feature owns: rows 1, 2, 3, 64 and the ten keys of row 65, each with the status `confirmed` | `spec.md`, "Rows of the `parity` profile"; annex X §X.7 |
| `integrity-rules.json` | IR-01 to IR-60: owner (28 owned here), requirements, test | `spec.md`, "Integrity rules and their tests" |
| `ledger-micro.json` | Record kinds of the ledger namespace `micro`, counters, resume states | F115-FR-030 to F115-FR-032; annex B §B.13 |
| `experiments.json` | X0 to X12 and the arm for the model-tier bump: question, metric, fixture, rule, cost | F115-FR-064 to F115-FR-066 |
| `loop-line.md` | Keys and values of the `[LOOP]` line | F115-FR-038; annex G §G.3 |
| `schemas/checkpoint.schema.json` | `specstride.checkpoint/1` | F115-FR-009, F115-FR-010 |

The JSON files were generated from the tables of `spec.md`. Schemas that feature 100 owns (fact
block, check manifest, ledger envelope, tripwire record, rule table) are in
`specs/100-specstride/contracts/schemas/` and are not repeated here. The schemas of the toolchain
profile, of the protected set and of the check result moved with requirement group G-B at the
split and belong to feature 116.

In `@specstride/contracts` the files take the suffix `-115` (`router-table-115.json`, `closed-sets-115.json`, `parity-rows-115.json`, `ledger-micro-115.json`, `integrity-rules-115.json`, `checkpoint-115.schema.json`), so that the sync of feature 100 keeps them (`analyze-report.md`, proposal U1). The names in this directory stay as they are.

Schema id of this feature: `specstride.checkpoint/1` (feature 100, annex B §B.20, owner 115). The
`$id` of its schema file is `urn:specstride:schema:specstride.checkpoint/1`, by the rule of
`specs/100-specstride/contracts/README.md`.

The four data files `closed-sets.json`, `parity-rows.json`, `ledger-micro.json` and
`integrity-rules.json` carry a `schema` field of this feature (`specstride.closed-sets-115/1` and
so on). These are no contracts of feature 100 and have no schema file.

Changed on 2026-09-30, after the cross-feature review: the key names of `parity-rows.json`
(lowerCamelCase; `proposalMin`, `unitMin`, `checkMin`), the row numbers of `closed-sets.json` (136
to 141), the signal `targetSharesCriticModel` and the meaning of `targetIsCriticModel` in
`router-table.json`, the subjects of IR-23 and IR-47, and the `$id` of the schema.
