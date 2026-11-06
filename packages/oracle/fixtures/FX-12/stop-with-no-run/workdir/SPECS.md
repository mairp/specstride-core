# `stop` with no run active

The front door is asked to stop and the lock is free. It says so and writes the request anyway, so that a run about to start honours it.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
