# Iteration returned by a yield

The first pass declares a yield. Yield and resume are ONE logical pass, so the iteration is given back and the resumed pass is still pass 1.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
