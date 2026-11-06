# Two runs archive the same attempt number

A run is rejected and archives attempt 1. A second run of the same feature is rejected too; its attempt 1 cannot overwrite the audit history of the first, so it is archived under the run that made it.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
