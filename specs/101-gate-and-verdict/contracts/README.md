# Contracts of feature 101

Feature 101 exposes nothing to a host beyond the command `run` of CLI protocol 1, which feature
100 defines. What it exposes inside the product is below. Where a file here and the spec differ,
the spec stands; where the spec and feature 100 differ, feature 100 stands.

| File | Content | Requirements |
|---|---|---|
| `verdict-grammar.md` | The grammar of a verdict, the details of MALFORMED and their as-is texts | F101-FR-006 to F101-FR-008, F101-FR-012 |
| `gate-halts.json` | The table "Halts of the phase gate" as data, for the table test. `fixtures` holds a family where every scenario of the family ends in the row, and a scenario (`FX-07/phase-not-found`) where the scenarios of one family end in different rows; the ends are those that feature 141 states for the reference. The rows hold the ends under the `parity` profile: a missing credential of the critic is in the row `malformed-limit` (F101-FR-010, CQ-187). The five scenarios `FX-07/critic-*` drive the critic alone, end with the result code 3 and are no halt of the engine, so no row names them | F101-FR-010, F101-FR-037 |
| `as-is-literals.md` | As-is events, lines and file texts, each with its behaviour item | F101-FR-012, F101-FR-038, F101-FR-039 |

Schema files of the records of `data-model.md` are made by the tasks, in the `contracts` package
of the workspace, beside the schemas of feature 100.
