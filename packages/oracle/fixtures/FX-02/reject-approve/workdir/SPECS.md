# Reject then approve

The spec of FX-02 `reject-approve`: three phases, of which the first is rejected
once and approved on the second attempt. The archive of the rejected attempt, the
feedback file and the numbering of the attempts are what this scenario exercises.
Every acceptance criterion is a file the proposer stub writes, so the critic stub
can judge on the evidence and nothing of the host is read.

## Phase 1 — The first file

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] A file `one.txt` exists in the working directory.

## Phase 2 — The second file

Write `two.txt` into the working directory.

### Acceptance criteria

- [ ] A file `two.txt` exists in the working directory.

## Phase 3 — The third file

Write `three.txt` into the working directory.

### Acceptance criteria

- [ ] A file `three.txt` exists in the working directory.
