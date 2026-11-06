# Reject limit of three

The spec of FX-03 `reject-limit`: one phase that the critic stub rejects on every attempt,
so the engine reaches the reject limit. Every acceptance criterion is a file the
proposer stub writes, so nothing of the host is read.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] A file `one.txt` exists in the working directory.
