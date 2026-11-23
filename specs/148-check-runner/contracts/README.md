# Contracts of feature 148

Feature 100 owns the interface contracts (`specs/100-specstride/annexes/`). The files here are
data of the plan of feature 148. Where a file and `spec.md` differ, `spec.md` stands.

| File | Content | Requirements |
|---|---|---|
| `closed-sets.json` | The closed sets this feature owns | F148-FR-003, F148-FR-004, F148-FR-009, F148-FR-012 |
| `parity-rows.json` | Rows of the `parity` profile read, each with its number of annex X §X.7 | F148-FR-002, F148-FR-006, F148-FR-008, F148-FR-010, F148-FR-011 |
| `batch-rules.json` | The admission rules of a batch, in order, each with its reason | F148-FR-011, F148-FR-012 |
| `as-is-literals.json` | Literals that the compared records reproduce | F148-FR-004 |

Schemas of feature 100 used: `check-manifest.schema.json`, `fact-block.schema.json`,
`event-envelope.schema.json`, `process-registry.schema.json`, `run-record.schema.json`; extension points
`EP-05.check-runner.json`, `EP-16.toolchain.json`.

Schema of feature 116 that the caller writes from the returned results:
`check-result.schema.json` (`specstride.check-result/1`). Event types this feature needs are
listed in `data-model.md`, "Events this feature needs".
