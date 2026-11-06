# No progress is not evaluated on the structured path

The proposer is on the structured path: a pass that wrote nothing goes straight to the next pass, so the no-progress breaker is never reached and the loop ends on the iteration limit instead.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
