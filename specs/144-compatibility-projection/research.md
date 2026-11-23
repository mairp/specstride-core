# Research: Compatibility projection (feature 144)

| # | Decision | Source |
|---|---|---|
| D-1 | New schema primary; old vocabularies in separate files | `consolidation.md` C-06; ruling K4; R14 |
| D-2 | A row may fan one type out into several old names by a condition on `data`, and several types may target one old name | R18 inventory (a hard-cap kill gives three old lines; `run_stop` has two writers) |
| D-3 | One file for each engine start | R18; reported as CQ-033 |
| D-4 | Snippets of the old vocabulary come through the content accessor, for the projection's own files only | B-2083, B-2084; CQ-032 |
| D-5 | Lisa's idea of one emit and two encodings with a table that a test checks is kept; its code is not | The Lisa baseline at `363e6a3`, `packages/core/src/events/journal.ts` |
| D-6 | The 65 carried names: 70 in the inventory, less `_reopen`, `gate`, `tool_use`, `api_request` (not events of any file) and `gates_migrated` (DV-037) | R18; R14 open question 12 |

Unverified: behaviour of append on macOS; check: the parity oracle on a macOS runner.
