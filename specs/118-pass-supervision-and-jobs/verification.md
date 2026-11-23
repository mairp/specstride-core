# Verification record — feature 118 (pass supervision and detached jobs)

The verification obligations of the phase-1 gate, with their status and evidence. The
paid part of T002 is recorded `unverified` here per the owner ruling of 2026-09-30
(a paid, live call is never run and never faked by the specification; a phase whose
only open work is of that kind counts as complete).

## VO-239c47eaf2cbb5068cd0 — T001 (US4): characterization spike on baseline `9cab15d`

- **Status**: done on Linux. **macOS part: `unverified`** — no macOS runner exists in
  this environment; the check that would verify it is recorded in the spike document.
- **Evidence**: `tests/characterization/118/spike-tree-kill.md` (the result: **no** kill
  path of the baseline reaches a job in its own process session — measured for the
  watchdog's single-pid TERM/KILL, for GNU `timeout`'s process-group tree kill, and for
  an explicit `kill -- -PGID`); reproducible script
  `tests/characterization/118/spike-tree-kill.sh`; raw run log
  `.specstride/features/118-pass-supervision-and-jobs/gates/proofs/spike-tree-kill-run.txt`
  (run 2026-10-04T18:56:45Z, Linux 7.0.14-15-pve, under `node tests/isolate.ts`).
  Local, no model call, no paid call.

## VO-df0a69378e7893472b28 — T002 (US5): paid interrupt probe per tested harness adapter

- **Status**: hermetic part done on Linux; **the paid part is `unverified`**.
- **Reason**: the probe requires one live, paid call per tested harness adapter; the
  owner ruling of 2026-09-30 forbids running or faking it here and reserves it for the
  owner's out-of-band slot (out-of-band task list: "T002 (paid, phase 1)").
- **Evidence**: `tests/characterization/118/probe-interrupt.md` — the hermetic
  mechanism check (an interrupt ends a stub turn cleanly, exit 130, session mark
  written; a deaf stub stays alive and drives the step to `terminate`), the run log at
  `.specstride/features/118-pass-supervision-and-jobs/gates/proofs/probe-interrupt-run.txt`,
  the exact live check that would verify the paid part per adapter, and the cost-record
  log inside that file (paid part: not incurred, 0, to be logged by the owner when run).

## VO-bc80931335dd721f7c9f — T003 (US4): confirm the spike of feature 122 before F118-FR-031 freezes

- **Status**: done — outcome recorded in spec.md F118-FR-031 as **`unverified`**.
- **Evidence**: `specs/118-pass-supervision-and-jobs/spec.md`, F118-FR-031 `status:`
  line (updated this phase). The spike of feature 122 (detach survival inside a host
  session) was not run: two of its spike tasks are marked paid and were skipped
  (`docs/ecosystem/PROGRESS.md`, entry of 2026-09-29 for 122-detached-runtime), so the
  host-session fact stays `unverified` with its check. The Linux half of the question
  (the pass-tree kill) is now measured by this feature's T001 spike and is cited in the
  same status line.

## Gate commands

- `npm run test` (root) — run 2026-10-04 after this phase's files were added; result
  recorded in GATE1-EVIDENCE.md.
- `TESTKIT_STATIC_SCOPE=118-pass-supervision-and-jobs npm run test:static --workspace
  @specstride/testkit` — same.
