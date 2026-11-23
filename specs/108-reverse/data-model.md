# Data model: Reverse specification (feature 108)

Phase 1 of the plan. Entities, fields, relations, states. Schemas are in `contracts/`.

## Entities

| Entity | Fields | Identity | Validation | Logical name |
|---|---|---|---|---|
| Reverse run | `slug`, `feature` (`reverse-<slug>`), `src`, `out`, `tasksMode`, `oversize` | `slug` per source | `slug` in `[a-z0-9-]`, at most 40 characters | — |
| Driver spec | Title, `## Run boundaries`, phases with four subsections | The run | Valid native spec | `reverse:<slug>:driver` |
| Phase | `n`, `title`, `level`, `kind` (`unit`, `spec`, `plan`, `design`, `tasks`, `analysis`), `unit` | `n` | Contiguous from 1 | in the driver |
| Verification command | `id` (`lint-N`, `guard-N`), `phase`, `executable`, `cwd`, `args`, `timeoutSec` | `id` | Fixed argument list | `reverse:<slug>:verification-commands` |
| Plan output | The keys of F108-FR-015 | The run | Schema in `contracts/plan-output.schema.json` | printed |
| Guard problem | A line of `deleted`, `added`, `changed`, `fingerprint differs`, `git HEAD moved`, `git status` | — | First seen, de-duplicated | printed |
| Analysis report | Findings with resolutions | The run | Exists at the last phase | `reverse:<slug>:analysis` |

## Relations

The plan obtains the inventory through the CLI command `reverse inventory` and derives the driver and the commands document from it. The guard reads the inventory as its baseline. The driver names the lint and guard commands that the commands document holds.

## States of a plan

| State | Meaning | Next |
|---|---|---|
| refused | A refusal of F108-FR-004, F108-FR-013, F108-FR-025, F108-FR-026 or an invalid limit; nothing written | — |
| planned | The four files written | launched, or dry-run ended |
| launched | The engine start happened (foreground, or a run request) | The engine's states (feature 100 annex E) |

No new run state, exit code or stop reason (F100-FR-031).
