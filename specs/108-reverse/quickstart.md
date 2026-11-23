# Quickstart: validating reverse specification (feature 108)

How to see that the feature works. Commands are as the plan names them; the package does not exist before implementation. Schemas and lists: `contracts/`. Entities: `data-model.md`. The inventory and the lint are called as CLI commands.

## Prerequisites

| For | Needed |
|---|---|
| Every test tier | Node 22 or later; `npm install` in the workspace |
| Git fixtures | `git` on the path; a missing `git` is a skip with its reason, never a pass |
| The parity tests | The oracle of feature 141 with the golden captures of FX-30 |
| macOS | A macOS runner (`unverified` until one passes) |

## Scenarios of validation

| # | Do | Expect | Requirement |
|---|---|---|---|
| 1 | `specstride reverse --dry-run <fixture>` | The labelled plan lines and the engine command; exit 0; the engine stub records no call | F108-FR-005 |
| 2 | `specstride reverse <fixture>` with the stub engine | One engine call with the documented arguments; `reverse: launching ...` | F108-FR-007 |
| 3 | The same with `--out` at the source root, outside it, in `.git`, in `.specify`, non-empty | Exit 3 with the matching message; nothing written | F108-FR-025 |
| 4 | Change one file of the source, then `reverse guard` | `changed: <path>`, the failure line, exit 3 | F108-FR-028, F108-FR-031 |
| 5 | A source larger than the total limit, `reverse plan` | `oversize` true; one unit phase per unit first | F108-FR-018 |
| 6 | `reverse --detach <fixture>` from a host shell, end the session | The run lives; `status` shows it (skip with reason where no live host) | F108-FR-009 |

Expected results of the parity scenarios are the golden captures of FX-30 (`plan`, `lint-<code>`, `guard-refuses`, `refused-flag`).
