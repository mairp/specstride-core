# Performance of the oracle (T147)

Measured in phase 9 of the build, on this lane's Linux machine, with
`performance.now()` around the library calls themselves. The probe is
`.specstride/features/141-parity-oracle/gates/proofs/phase9-tools/perf.ts`; its
record of this run is `gates/proofs/phase9-perf.json` under
`.specstride/features/141-parity-oracle/`. The goals are the starting values of
`specs/141-parity-oracle/plan.md` (Performance Goals), "measured in the build" —
which is what this file is.

The scenario measured on the reference is `FX-01/three-phases`, the reference
`specstride` at the pin `9cab15d2d08f6c54644985f7251700bbdbcab282`, the tick at
1, the critic stub at a loopback address that refuses, as everywhere in the
oracle. The scenario measured on the port is `FX-32/greeting-ready` — the
scenario whose port command `specstride contract derive` this build HAS
(`packages/cli` declares it in `specstride.commands` of its manifest and
provides `packages/cli/bin/specstride`), so the port side is measured by a real
drive and not estimated.

| Goal (plan.md) | Goal | Measured | Verdict |
| --- | --- | --- | --- |
| One three-phase scenario, reference side | < 15 s | **7.65 s** (`referenceDriveSeconds`) | meets the goal |
| One scenario, port side | < 5 s | **0.16 s** (`portDriveSeconds`, FX-32/greeting-ready) | meets the goal |
| Hermetic test tier (port against golden captures, all families) | < 15 min on four workers | **52.19 s** single process (`hermeticTierSeconds`) | meets the goal |
| Reference test tier (live differential, both suites, with tracing) | < 60 min | **2.49 s** end to end (`referenceTierSeconds`) — 432 scenarios planned, 4 run, 428 skips with their reasons | meets the goal; see below |
| Normalization and comparison of one capture | < 1 s | **275.7 ms** normalize, **0.40 s** full judged differential (`normalizeMs`, `differentialOfOneScenarioSeconds`) | meets the goal |

## What each number is

- **Reference drive, 7.65 s** — one `driveSide` of `FX-01/three-phases` on the
  live reference tree: the whole three-phase scenario, installer, proposer and
  critic stubs included, against the real `specstride` baseline. R18 measured
  about 10 s for the same thing; the oracle adds the guard install and the
  sixteen-surface capture and still stays under it. The fetch of both trees
  before it took 0.16 s (`fetchSeconds`).
- **Port drive, 0.16 s** — one `driveSide` of `FX-32/greeting-ready` with
  `side: "port"`: the hermetic environment, the workdir template, the port's
  `stub-bin` and `product-bin`, the search-path guard, the state layout of the
  port's side and the capture of every declared surface, plus the product's own
  command `specstride contract derive`, which exits 0 as the scenario declares
  (`portExitCode: 0`, `portExpectedExit: 0`). The normalized capture of that
  run is compared with the committed golden capture of the reference on the
  five declared surfaces (`exit`, `stdout`, `stderr`, `tree`, `state`) and all
  five read equal (`portSurfacesNotEqual: []`) — the number records a real
  port run of the scenario, not a bare spawn.
- **Hermetic tier, 52.19 s** — the whole oracle test suite
  (`npm test -w @specstride/oracle`, 423 tests, all passing, exit 0), timed
  wall-clock. Honest caveats, both of which make the real number smaller, not
  bigger: the measurement is one process, not four workers, and the suite holds
  far more than the hermetic tier alone (live differential runs included). The
  goal of 15 minutes on four workers is met with two orders of magnitude to
  spare.
- **Reference tier, 2.49 s, measured end to end** — the tier is planned with
  `planTier("reference", …)` (the tier module of T071) over every scenario the
  workspace holds a fixture for (432, planning itself 0.15 s), and every step
  the plan says `run` for is RUN inside the same timing: the reference driven
  LIVE with the line-tracing overlay of `installTracers` (F141-FR-031), the
  port driven TWICE — capture A and capture B of the two suites
  (F141-FR-039, row 1 set to `micro`), both holding S-14 to S-16 — and the two
  sides compared surface by surface. This build can run the port half on the
  four `FX-32` scenarios, whose port command `contract derive` the product's
  command line has; the other 428 are SKIPs with their reasons, exactly as
  F141-FR-037 requires — the scenarios whose port command belongs to a command
  line that another feature owns has not shipped yet. Nothing is extrapolated:
  every second in the record is a real drive inside the tier's own timing. The
  per-scenario costs are in `referenceTierPerScenario` of the record (largest
  whole scenario 0.68 s).
- **Normalization, 275.7 ms** — `normalize()` of the 16-surface capture of the
  scenario above, all 29 rules. The number includes the first-call module init
  of the normalizer; a second capture in the same process costs a fraction of
  it. The judged comparison of the two normalized sides of the self-proof,
  `selfProofOfCaptures`, took 0.29 s end to end — inside the "under 1 s" goal
  for normalization and comparison of one capture.
- **The differential of the self-proof** — reference against reference, 9
  surfaces, every one `equal` (`differentialSurfacesEqual: 9`,
  `differentialSurfacesNotEqual: []`), exit code 0.

## What is measured and what is a skip

Every goal of plan.md now carries a measurement taken in this build. What the
build cannot run is not estimated anywhere: the 428 scenarios of the reference
tier whose port half needs a command of the product this build does not ship
are skips with their reasons (`referenceTierScenariosSkipped: 428`), never
runs and never invented numbers. The tier's measured cost grows only by
running those scenarios once the features that own their commands land them;
the measurement machinery of this file needs no change for that — it already
plans the whole tier and runs every step the plan says `run` for.

## Re-measuring

    node tests/isolate.ts node .specstride/features/141-parity-oracle/gates/proofs/phase9-tools/perf.ts \
      packages/oracle/fixtures/FX-01/three-phases <hermeticTierSeconds>

prints the record again as JSON. The hermetic tier alone re-times as

    time npm test -w @specstride/oracle

from the repository root.
