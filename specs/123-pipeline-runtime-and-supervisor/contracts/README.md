# Contracts of feature 123

Machine-readable forms of the reference sections of `../spec.md`. The spec stands where a file and the spec differ.

| File | Content | Spec |
|---|---|---|
| `relaunch-observe.table.json` | Table 1, `relaunch-observe`, in the form of feature 100 annex X §X.3 | §R.6 |
| `relaunch-root.table.json` | Table 2, `relaunch-root` | §R.6 |
| `launch-checks.json` | The six launch checks, their refusal reasons and decisions | §R.5 |
| `pipeline-lines.json` | The lines of the pipeline entry in compatibility output, and what default output prints | §R.2 |
| `supervise-verbs.json` | The verbs of `supervise`, the lines of default output and the byte limits | §R.7, §R.8 |
| `closed-sets.json` | The closed sets that this feature owns | "Closed sets" |
| `schemas/relaunch-table.schema.json` | The schema of a classifier table | — |
| `tools/generate.py` | Writes the files above from `spec.md`; `--check` fails when a file differs from the spec, when a row has no predicate, when the last row has one, when a literal is in no row, when the rows O-33 and O-34 do not stand between O-24 and O-25, when a table does not refuse a blocked run, or when a line of default output takes a label of another command |  |

Operators of a predicate: `equal`, `notEqual`, `less`, `greater`, `memberOf`, `present`, `and`, `or`, `not`
(annex X §X.3). A predicate is a JSON object with one operator key; `equal`, `notEqual`, `less` and
`greater` take a pair `[signal, value]`, `present` takes a signal name, `not` takes a predicate, `and` and `or`
take a list of predicates. A row with no `when` is the default row and is the last.

Run `python3 tools/generate.py --check` from this directory.
