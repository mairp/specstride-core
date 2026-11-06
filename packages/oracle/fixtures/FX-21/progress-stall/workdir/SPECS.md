# The disk-progress watchdog

The first pass is busy — it keeps using processor time, so the idle watchdog never sees it — and writes nothing at all under the working directory, which is the disk-progress watchdog.

## Phase 1 — The only phase

Write `one.txt` into the working directory.

### Acceptance criteria

- [ ] T001 A file `one.txt` exists in the working directory.
