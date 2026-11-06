# MALFORMED variants and the limit

The spec of FX-05 `duplicate-verdict`: one phase. The critic stub answers with a reply the
verdict grammar cannot read, so the engine scores the attempt MALFORMED and the
critic-outage breaker counts it. Every acceptance criterion is a file the proposer
stub writes.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
