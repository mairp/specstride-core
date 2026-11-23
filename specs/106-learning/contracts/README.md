# Contracts of feature 106

Interface text that this feature owns as content. Each file states one contract in words; the machine-readable form is written with the implementation (task T010 and later). The orders of members and the definitions of the guardrail counts are in `../data-model.md`. Where a contract touches feature 100, the annex is named and this feature never edits it.

| File | Contract | Requirements |
|---|---|---|
| `decision-log.md` | Byte format and entry fields of the decision log | F106-FR-007, F106-FR-008 |
| `learn-verb.md` | The command `learn`: modes, options, exit codes, lines | F106-FR-022 to F106-FR-026 |
| `binding.md` | The block `configuration.learning` and its validation rules | F106-FR-027 to F106-FR-030 |
| `mode-selector.md` | Tokens, phrases, result and lines of the mode selector; the verb `learning` of `supervise` | F106-FR-032, F106-FR-033 |
| `schemas/retrospective.schema.json` | The schema file of `specstride.retrospective/1` (annex B §B.20, owner 106), delivered to the `contracts` package (F100-FR-227) | F106-FR-034 |

No extension point is defined or consumed.
