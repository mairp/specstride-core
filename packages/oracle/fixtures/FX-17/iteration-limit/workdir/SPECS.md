# Iteration limit

Every pass writes a file, so the no-progress breaker never fires; no pass writes the evidence, so the pass loop runs out of iterations.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
