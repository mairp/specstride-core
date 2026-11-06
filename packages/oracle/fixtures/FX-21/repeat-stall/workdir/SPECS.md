# The repetition watchdog

The first pass issues the same tool call over and over and then waits. The repetition watchdog reads the events of THIS pass and kills it.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
