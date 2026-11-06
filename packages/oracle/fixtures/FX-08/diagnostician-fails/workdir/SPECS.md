# Diagnostician and accelerator

The spec of FX-08 `diagnostician-fails`: one phase. A rejection whose unmet-criteria signature
the diagnostician has not seen draws one narrow diagnostician call, which writes
`GATE1-HINT.md`; the next attempt is an accelerator pass with the narrowed prompt.
Every acceptance criterion is a file the proposer stub writes.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
- [ ] T002 A file `two.txt` exists in the working directory.
