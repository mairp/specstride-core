# Quickstart: validating reverse inventory and lint (feature 140)

Commands are as the plan names them; the package does not exist before implementation. Schemas and lists: `contracts/`. Entities: `data-model.md`.

## Prerequisites

| For | Needed |
|---|---|
| Every test tier | Node 22 or later; `npm install` in the workspace |
| Git fixtures | `git` on the path; a missing `git` is a skip with its reason |
| Parity tests | The oracle of feature 141 with the golden captures of FX-30 |
| macOS | A macOS runner (`unverified` until one passes) |

## Scenarios of validation

| # | Do | Expect | Requirement |
|---|---|---|---|
| 1 | `specstride reverse inventory <fixture> --out <file>` twice | Two byte-identical files; the fingerprint equals the baseline's | F140-SC-003 |
| 2 | The same on a tree with a non-ASCII path | Order and fingerprint equal the reference's | F140-FR-021 |
| 3 | The same on a tree with a binary file, an oversize file and an escaping link | Each skipped with its reason and still fingerprinted | F140-FR-020 |
| 4 | The same on a subdirectory of a git work tree | Walk mode `walk` | F140-FR-017 |
| 5 | `reverse lint <feature dir> --json` on one fixture per finding code | The code appears; exit 3; on a clean directory exit 0 | F140-SC-001, F140-SC-002 |
| 6 | `reverse lint <dir> --upto 6` | Exit 3 with the message of the levels | F140-FR-002 |
| 7 | `reverse lint <dir>` without `--src` | The warning `evidence.skipped` | F140-FR-003 |
| 8 | Read the file of scenario 1; then `reverse lint <dir> --baseline <file>` with the key `schema` removed from the file | The file carries `schema` `specstride.reverse-inventory/1` and `schema_version` 1; without the key the lint exits 3 with `not an inventory: <path>` | F140-FR-021 |

Expected results of the parity scenarios are the golden captures of FX-30 (`plan`, and the 38 scenarios of the pattern `lint-<code>`, in which the dot of a code is written as a hyphen: `lint-template-mandatory`). The inventory is compared after the key `schema` is removed (register row DV-116; rule N-29 of annex X §X.8 of feature 100, confirmed by F141-FR-012).
