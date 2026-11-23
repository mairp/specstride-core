# Verification record of feature 129

What was verified, where, and what stays `unverified`. One row per obligation of
[`tasks.md`](tasks.md) whose answer is not simply "its test passes"; everything else is in the
tests themselves and in the records they write.

Written on 2026-10-01, on Linux `x86_64` (kernel `7.0.14-15-pve`) with Node `v22.23.2`.

## Phase 1 — the first tasks

| Task | Hermetic half, on Linux | What stays `unverified` |
|---|---|---|
| T001 | Done and recorded: [`tests/characterization/129/spike-read-cost.md`](../../tests/characterization/129/spike-read-cost.md), asserted by `tests/characterization/129/t001-read-cost.test.ts` | The macOS reading, and the reading on the Linux runner of CI; see T001 below |
| T002 | Done and recorded: [`tests/characterization/129/capture-host-hook-shim.md`](../../tests/characterization/129/capture-host-hook-shim.md), asserted by `tests/characterization/129/t002-capture-host-hook-shim.test.ts` | The capture on a live host; see T002 below |
| T003 | Done in full. Nothing of T003 is out of band: `contracts/signal-table.md` is corrected and `tests/characterization/129/t003-signal-table-coverage.test.ts` holds the confirmation against the catalogue of feature 111 | — |
| T004 | Done in full. Nothing of T004 is out of band: `contracts/observations.md` is the corrected list and `tests/characterization/129/t004-observations.test.ts` holds the confirmation against annex B, feature 122 and feature 123 | — |

## T001 — the measurement on the reference machine of CI, and on macOS

**`unverified`, in two parts.**

**The macOS reading.** No macOS runner has taken the readings of the read cost.

*Reason*: this working tree has no git remote and has never been pushed, so
`.github/workflows/build.yml`, whose matrix holds `macos-latest` beside `ubuntu-latest`, cannot be
dispatched; and the record that a macOS runner has passed,
`tests/release/100/macos-verified.json`, is absent. The owner's policy of 2026-09-30 puts a macOS
task out of band: it is never run and never faked by an automated pass.

**The reading on the Linux runner of CI.** The same missing remote means CI has never run at all.

*What was done instead, and why no further task is needed*: the measurement is a test of the build,
`tests/characterization/129/t001-read-cost.test.ts`, which `npm test` runs through
`test:characterization`. The first run of `build.yml` therefore takes the reading on
`ubuntu-latest` — the reference machine of CI — with no further step, and a regression past either
target fails the build. What the record holds today is this Linux host, named in full (processor,
kernel, memory, Node version) so that the two readings can be compared when CI first runs.

**What the hermetic half proved.** On a generated event file of 100,000 events (52,647,177 bytes),
median of nine walls: `status` 6.8 ms, a full projection 726.0 ms, a projection from a valid cached
view 9.8 ms. F129-SC-001 (2 seconds) and the 0.5 second of `plan.md` are both confirmed and neither
is corrected. The read model timed is the stand-in of
`tests/characterization/129/spike/stand-in-view.ts`, which does the work any implementation of
F129-FR-001 to F129-FR-008 must do and no more, so the figures are a floor; the record says so, and
says that the thin margin is the one on the full projection, 2.8 times.

## T002 — the capture of the host hook shim on a live host

**`unverified`.** No live host has run the host hook shim of feature 113 against a precomputed
status line of this feature.

*Reason*, in three parts, each enough on its own: the owner's policy of 2026-09-30 puts a
live-host task out of band; `packages/host-claude-code/src/index.ts` is a skeleton and holds no
shim, so there is nothing to capture; and `packages/runtime` is a skeleton too, so nothing writes
`run:<runId>:status-line` yet. **No model call was made and no paid step was run**, so there is
nothing to log in a cost record.

*Who runs it, and when*: the owner, by hand, on a host with the published plugin installed, after
feature 113 ships its shim and feature 122 ships the writer of the line. If that capture needs a
model call it is paid and its cost is logged before it starts. Nothing in this repository starts
it.

**What the hermetic half proved.** The decision this feature owns — whether a line may be printed
at a given time — over two files and a fake clock, with no host and no model call: the line is
found through the pointer `workspace:current:status-line` and nothing else; a line of each of the
five live states carries the `validUntil` of the lease and prints before it; a line past it is
printed as `st=unknown` naming the command `status`, and the stale state is not printed; a line of
each of the four resting states carries `none` and prints at every clock. Recorded in
[`tests/characterization/129/capture-host-hook-shim.md`](../../tests/characterization/129/capture-host-hook-shim.md),
which also names the four things only the live capture can show: that a real host calls the shim at
the start of a session, that the shim keeps inside the host's time limit, that it prints again
after a compaction only when the state changed, and that no part of the product was started.

**Where the `unverified` is also recorded**: the `status:` of F129-FR-028 in [`spec.md`](spec.md),
which now cites the capture record.

## The requirements of this feature that carry `status: unverified`

Four, and phase 1 changes the text of one of them (F129-FR-028) and none of their verdicts:

| Requirement | What is `unverified` |
|---|---|
| F129-FR-006 | Golden views compared on a macOS runner that passes the oracle |
| F129-FR-012 | The probe of the lock provider on macOS |
| F129-FR-021 | The search of the process table for the run token on macOS |
| F129-FR-028 | The capture on a live host (T002). The `status:` now cites the record of the hermetic half |

**Until a macOS runner has passed**, every statement of this feature about macOS stays
`unverified` (the Constraints of [`spec.md`](spec.md); the Assumptions, row "macOS statements are
`unverified`"; ruling 67).

## What needs no verification record

No as-is requirement and no behaviour item with a kept disposition is assigned to this feature
([`tasks.md`](tasks.md), "Tests"), so this feature has no parity test and needs no reference tree
and no oracle of its own. Nothing of phase 1 is paid: the whole of it is files of `specs/` and one
generated event file in a temporary directory.
