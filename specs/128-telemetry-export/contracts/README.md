# Contracts of feature 128

Data files that the exporter reads and that a build test compares with `spec.md`. They hold behaviour, not layout: the physical paths are those of the package.

| File | Content | Requirements |
|---|---|---|
| `span-scopes.tsv` | The sixteen scopes of a span: opening and closing types, span names in both forms, parent, error closers | F128-FR-014, F128-FR-015 |
| `as-is-openers-closers.tsv` | The as-is events that open, close or mark errors on a span (the baseline's tables) | F128-FR-014, F128-FR-015 |
| `metrics.tsv` | The metrics with kind, unit, attributes, source and as-is name | F128-FR-030 to F128-FR-034 |
| `attribute-names.tsv` | The attribute names of the envelope ids and of the span marks | F128-FR-016, F128-FR-038 |
| `config-keys.tsv` | The keys of this feature in the spelling of the key list of feature 110, with default, value under `parity`, trust class, aliases, the row of annex X §X.7 and the status `confirmed` | Many |
| `payload-forms.tsv` | The differences of the two forms of a payload | F128-FR-009 |
| `span-state.schema.json` | The file `run:<runId>:span-state`, schema id `specstride.span-state/1` (annex B §B.20); `$id` in the form `urn:specstride:schema:<schema id>` | F128-FR-018 |

A test fails when a scope, a metric, a key or a form of the files has no requirement in `spec.md`, or a requirement names one that the files do not hold.
