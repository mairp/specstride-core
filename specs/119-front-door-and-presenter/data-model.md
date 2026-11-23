# Data model: Front door

The front door keeps no state of its own (F119-FR-016). These are the shapes it reads and prints.

## Entities

| Entity | Fields | Source |
|---|---|---|
| Call | verb, extras (ordered), workdir, spec (explicit or not), feature slug, flags (`all`, `follow`, `json`, `verbose`, `now`) | F119-FR-007, F119-FR-008 |
| Selection | events location, log location, feature, run | F119-FR-017, F119-FR-018 |
| Product line | label, ordered pairs, text values quoted as JSON | annex G §G.3 |
| Failure | command, reason (closed set of F119-FR-030), fix text | F119-FR-030 |
| Truncation | bytes left | F119-FR-031 |
| Data frame | logical name, byte count, token; the framed text is cut to 16,384 bytes | F119-FR-032 |
| `--json` record | `schema` (`specstride.inspect.<verb>/1`), `cmd`, `ok`, `feature`, and the fields of F119-FR-033; one schema file per verb in `contracts/schemas/` (annex B §B.20) | F119-FR-033 |
| Published package | one bundled ESM file, no install script, no native module, no tool of the build in the manifest | F119-FR-056 |

## Validation rules

- A feature slug outside `A-Za-z0-9._-` is sanitized, never rejected.
- Default output holds no absolute path and no field of free text.
- Every failure reason has exactly one fix text.
