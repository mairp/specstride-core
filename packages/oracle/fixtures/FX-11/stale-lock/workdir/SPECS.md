# A stale lock is no lock

A lock file of a run that is gone is in the tree, and no process holds it. The run takes it and goes on.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
