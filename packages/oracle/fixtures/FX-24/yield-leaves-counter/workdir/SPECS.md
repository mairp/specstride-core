# A yield leaves the short-pass counter where it was

A short pass raises the counter; the pass that declares a yield is not a short pass, and the pass that resumes writes the evidence.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
