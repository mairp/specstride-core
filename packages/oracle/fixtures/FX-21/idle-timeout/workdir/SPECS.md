# The idle watchdog

The first pass stays alive and uses no processor time at all, which is the one thing the idle watchdog looks at.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
