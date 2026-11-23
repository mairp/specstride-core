# Data model: Presenter

| Entity | Fields | Source |
|---|---|---|
| Timeline event | as-is name, fields read, detail level | F145-FR-003 to F145-FR-005 |
| Rail | list of states `A`, `R`, `C`, `P`, approved count, total | F145-FR-007 |
| Totals | cost, tokens out, tokens in, passes | F145-FR-008 |
| Card | rail, phase, attempt, title, activity, totals, feed (at most 200 lines), footer, outcome | F145-FR-009 |
| Colour decision | depth, background, glyph set | F145-FR-012 to F145-FR-014 |
| Banner call | states, phases, plain, bg, color, motion, rail-only, cols, rows | F145-FR-015 |
| Start-up record | labelled lines | F145-FR-018 |

## State transitions

- Rail: `P` to `C` at `phase_start`; `C` to `R` at a REJECTED verdict; `R` or `C` to `A` at `phase_done`; all to `A` at `run_end`.
- Live view: idle, then heartbeat after 2.0 seconds without a line; a pending stop changes the heartbeat status.

## Validation rules

- An unknown event name produces no line unless `--debug` is set.
- An invalid `--mode` or `--detail` is a usage error with code 2.
- A line that is not JSON is skipped.
