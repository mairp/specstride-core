# A crash reads clean

The first pass ends with a non-zero status and no watchdog killed it. On the plain-output path that is not an error: the pass reads CLEAN and the loop goes on.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
