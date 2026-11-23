# Data model: Configuration and terms

| Entity | Fields | Rules |
|---|---|---|
| Key entry (catalogue) | key, type and range, default, layers (F E P U C), trust class, direction, snapshot class, owner, alias, profile row | Unique key; class required (F110-FR-010) |
| Layer value | key, rank, place, value or reference, shadowed flag | Rank of annex X §X.2 |
| Provenance record | key, value or reference, source rank, place, learned decision id, profile name, shadowed list | Same in `config show` and the run record (F110-FR-024) |
| Profile row | number, key, default, value under `parity` or a literal, register row | Literals `off`, `not used`, `baseline`, `as-is`, `(fixture)` |
| Alias row | as-is variable, key list | One variable may feed several keys |
| Secret reference | scheme, target, declared host | No value stored anywhere |

State transitions: A key value is `accepted`, `ignored (widening)`, `ignored (not stricter)` or `error`.
