# Oscillation

The spec of FX-04 `oscillation-halt`: two acceptance criteria. The critic stub rejects every
attempt and names a different unmet set each time, so one criterion is cleared and
re-rejected across attempts — the flip-flop the oscillation detector of the engine
looks for (the engine script, the oscillation detector).

## Phase 1 — Two criteria

Write `one.txt` and `two.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
- [ ] T002 A file `two.txt` exists in the working directory.
