# Data model: Reverse inventory and lint (feature 140)

Phase 1 of the plan. Entities, fields, relations. Schemas are in `contracts/`.

## Entities

| Entity | Fields | Identity | Validation | Logical name |
|---|---|---|---|---|
| Inventory | `schema` (`specstride.reverse-inventory/1`, annex B §B.20), `schema_version` 1 (the as-is field), `files[]`, `skipped[]`, `src`, `walk`, `excludes`, `limits`, `totals`, `oversize`, `project`, `git_head`, `git_status`, `testautomation`, `specify`, `units`, `fingerprint` | The source and its exclusions | Object with `schema`, `fingerprint` and `files`; an inventory without `schema`, or with an unknown id or another major, is refused (F100-FR-049); schema in `contracts/inventory.schema.json` | `reverse:<slug>:inventory` |
| File entry | `path`, `bytes`, `lines`, `sha256`, `language`, `role`; for a link `symlink`, `target` | `path` | Sorted by code point | in the inventory |
| Skipped entry | `path`, `bytes`, `sha256`, `reason` (`binary`, `oversize`, `symlink-escape`), `limit` for `oversize` | `path` | Counts in the fingerprint | in the inventory |
| Project facts | `manifests[]`, `languages`, `frameworks`, `entry_points[]`, `workspaces[]` | The inventory | Empty values dropped | in the inventory |
| Unit | `path`, `files`, `bytes` | `path` | Sorted by path | in the inventory |
| Inventory summary | Title, bullets, sections, table | The inventory | At most the budget; project facts never dropped | `reverse:<slug>:inventory-summary` |
| Finding | `code`, `severity`, `file`, `line`, `message` | — | `code` in `contracts/finding-codes.json` | printed |
| Template | Heading rules from `*(mandatory)*`, `*(optional)*`, brackets, phase family | The file name | Loaded from the source first, else shipped | `package:templates:<name>` |
| Evidence comment | Citations, `kind`, `confidence`, `contradicts`, `validation` | Its line | Five fields in order | in the artifact |

## Relations

The inventory is built once per source and read by the summary renderer and, through `--baseline`, by the lint (citations resolve against its file list and line counts). The lint reads templates, the source and the inventory; it writes nothing.

No new run state, exit code or stop reason.
