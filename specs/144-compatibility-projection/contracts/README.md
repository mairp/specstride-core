# Contracts of feature 144

| File | Content |
|---|---|
| `projection-table.tsv` | One row per event type and condition: the old name it renders (`-` for nothing), the shape (`bash`, `python`, `learning`, `none`), the writer class, the field map |

Checks: every type of the event catalogue has at least one row (the catalogue types are read from the copy of the event catalogue in `packages/observability/data/`, the catalogue of annex X §X.6 row 73; the check never reads `specs/`); every field map names the keys of the as-is line, never a field of the catalogue type that the baseline line lacks; every one of the 65 carried names of the behaviour inventory is the target of a row. The conditions select on the fields of the catalogue type: `endCause` of `attempt.ended` and of `pass.ended` (the closed sets of feature 111), `outcome` of `phase.ended`, and `outcome` of `yield.ended` (row 112 of annex X §X.6: `satisfied`, `timeout`, `stop`, `wall_budget`).
