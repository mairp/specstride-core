# Research: Reverse inventory and lint (feature 140)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which report settles what and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| Behaviour items | `docs/ecosystem/research/R18-behaviour-inventory.tsv`; `traceability-items.tsv` (245 items of feature 140) | Every requirement |
| As-is requirement | `old/028-as-is-specstride/spec.md` FR-027 | F140-FR-004 |
| Baseline code | The Specstride baseline at `9cab15d`: `lib/reverse.py` (lint), `lib/reverse_inventory.py`, `lib/speckit_templates/` | Byte-exact serializations, message texts, limits |
| Rulings | `APPROVAL.md` rulings 15, K6, K7, K8 | Split; exit codes; defects |
| Layout and logical names | annex B §B.5 | Where the inventory files lie |
| Exit codes | annex G §G.4; `consolidation.md` section 3.6 | F140-FR-001 |
| Oracle | `specs/141-parity-oracle/spec.md` FX-30, §O.4, §O.6 | Tests |
| Architecture | R15 A-9 (sizes), R15v E-6, R2v (hashing speed), R1 (MIT templates) | Plan |

## Decisions

### D-1 Two serializers
- **Decision**: one for documents, one for the fingerprint input.
- **Rationale**: the baseline's `json.dumps` keeps non-ASCII in the document and escapes it in the hashed form; the fingerprint must equal the baseline's (rule N-09).
- **Alternatives considered**: one serializer (rejected: changes the fingerprint for non-ASCII paths).

### D-2 Code-point order
- **Decision**: all sorting by code point.
- **Rationale**: Python sorts by code point; the JavaScript default is UTF-16 order; locale order is excluded by N-27.

### D-3 The lint reads tasks through the adapter
- **Decision**: `tasks.grammar` reports the errors of the `speckit-tasks` validation of the spec-format adapter; the other `tasks.*` rules are the lint's own.
- **Rationale**: Principle IV; the baseline already delegated to the spec validator (B-1678).

### D-4 The inventory format lives here
- **Decision**: `contracts/inventory.schema.json` is the format; other commands read it.
- **Rationale**: the brief says this feature owns the format. Annex B §B.20 of feature 100 gives the schema id `specstride.reverse-inventory/1` and names this feature as owner (F100-FR-227). The document carries the field `schema` with that value and keeps `schema_version` 1 as the as-is field (register row DV-116). The `$id` of the schema file is `urn:specstride:schema:specstride.reverse-inventory/1`.

## Facts that are `unverified`

| Fact | Check |
|---|---|
| Git output forms and case-insensitive file systems on macOS | FX-30 fixtures on a macOS runner |
| Opening files without following links on macOS | A test on a macOS runner |

## Gaps in feature 100, reported at the split and closed since

| # | Gap at the split | State on 2026-09-30 |
|---|---|---|
| 1 | No contract for the inventory format that the guard, the plan and the lint read | Closed: annex B §B.20 holds `specstride.reverse-inventory/1`, owner 140 |
| 2 | No row in annex X §X.7 for the three `reverse.*` limits; no alias for `SPECSTRIDE_CONTEXT_BUDGET` | Closed: row 69 of annex X §X.7; the alias table of §X.8 maps the variable to `spec.contextBudget` and `reverse.contextBudget` |
| 3 | No rows in annex X §X.6 for the closed sets of this feature | Closed: rows 146 to 149 and 151 to 155 |
