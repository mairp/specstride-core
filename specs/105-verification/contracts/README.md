# Contracts of feature 105

Feature 100 owns the interface contracts (`specs/100-specstride/annexes/`). The files here are
data of the plan of feature 105: what this feature owns inside those contracts. Where a file and
`spec.md` differ, `spec.md` stands.

| File | Content | Requirements |
|---|---|---|
| `closed-sets.json` | The closed sets this feature owns, with members and the rule for an unknown value | F105-FR-001, F105-FR-014, F105-FR-016, F105-FR-035, F105-FR-039 |
| `parity-rows.json` | Rows of the `parity` profile read and owned, each with its row number of annex X §X.7. Rows 6, 7 and 31 are read only, for the rule on when a manifest is written | F105-FR-001, F105-FR-002, F105-FR-020, F105-FR-021, F105-FR-033, F105-FR-037, F105-FR-042 |
| `verify-cli.json` | Sub-commands of `verify`, their arguments and exit codes | F105-FR-039 |
| `as-is-literals.json` | Messages, headings and lines that compatibility output reproduces: those that `spec.md` names or refers to. It is not every line of the baseline; for a line that is not listed the baseline at `9cab15d` is the reference | F105-FR-001, F105-FR-002, F105-FR-004, F105-FR-006 to F105-FR-008, F105-FR-012, F105-FR-013, F105-FR-017 to F105-FR-019, F105-FR-022, F105-FR-023, F105-FR-025, F105-FR-032, F105-FR-034, F105-FR-037, F105-FR-039, F105-FR-042 |

Schemas of feature 100 used: `check-manifest.schema.json`, `fact-block.schema.json`,
`event-envelope.schema.json`, `process-registry.schema.json`, the run snapshot (`specstride.snapshot/1`); extension points
`EP-05.check-runner.json` (as a caller), `EP-07.verification-source.json`, `EP-16.toolchain.json`.
