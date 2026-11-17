# recorded-152 — the frozen events of feature 152 (F153-SC-008)

The events file of the newest run of feature `152-commit-backpressure` in the
workspace `~/.specstride/workspaces/94f747a310013d36`, copied **read only**
once, at an end of phase: the copy ends with `phase.ended` (phase 7),
`commit.made` and `run.ended` (`outcome: all_approved`). The source file was
never modified; nothing writes here.

- Frozen on: 2026-11-14 (the file's own last timestamp is
  `2026-11-13T21:28:03.398Z`)
- Phase of the run at the freeze: 7 of 7, approved (the end of the run)
- Byte size: 4359
- SHA-256: a68faf4722fbec207b9212f9a85163ba54c3535ff8e82bffd7c3359b4cfd296b
- Commit scan: the engine's commit scan (`scanCommitFiles` of
  `@specstride/kernel/redactor/scan`, the same redactor the ingress uses) ran
  over the copy before it was written here: 0 hits, not blocked.

The file stays byte-frozen: the replay test
(`packages/cli/test/inspect/report.test.ts`, F153-SC-008) compares two
runs of `specstride report` over a workdir holding this copy and requires
identical bytes and no changed file.
