# The snapshot cannot be written

The file the run writes its settings to is read-only, so the snapshot cannot be written. The run must not fail for it.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
