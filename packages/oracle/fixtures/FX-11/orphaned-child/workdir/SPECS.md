# A child of a run that is gone

A previous run left a stale lock and the recorded process id of its proposer. That process is gone; the run takes the lock and goes on.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
