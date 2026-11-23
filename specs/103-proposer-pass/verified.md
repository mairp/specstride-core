# Verified: feature 103

What has been **run**, with what result, and what stays **`unverified`** and why. One section per
task of this feature that records a result here: **T082** (the start-up of a pass, measured from
20 kB to 320 kB) and **T087** (every test of this feature on the macOS runner).

Rule of this file, which is feature 100's: **nothing is written here that was not run.** A measure
that could not be taken is recorded as `unverified` with its reason, never as a pass and never
estimated. A test whose prerequisite is missing — the reference tree, the oracle of feature 141, a
macOS runner — reports a **skip with its reason** and never a pass (W-X-09,
`quickstart.md` section 6).

## The machine of the recorded runs

| Fact | Value |
|---|---|
| Date | 2026-10-03 |
| Tree | `09eb721` (phase 5 approved) plus the working tree of phase 6 |
| Platform | Linux 7.0.14-15-pve, x86-64 |
| Node | v22.23.2 |
| npm | 10.9.8 |
| git | 2.47.3 |
| Processor | 22 x Intel(R) Core(TM) Ultra 7 155H |
| Memory | 94 GiB |

The host carried the rest of the campaign throughout, so every figure below was measured under
load and the load average of the run is recorded with it.

---

## T082 — the start-up of a pass, 20 kB to 320 kB

### On Linux: **run**, with the figures below

The measurement is the one CT-103-108 makes
(`tests/characterization/103/startup-linear.test.ts`), run on its own so that its FIGURES can be
recorded. The clock is `process.cpuUsage()`; it starts at the decision to start a pass and stops
at the moment `startPass` is entered, which is the start of the harness process. Nine runs per
size, and the **minimum** is reported, which is the least noisy estimator of processor time on a
loaded host. No harness is started, no model is called and no disk is touched.

The script is `.specstride/features/103-proposer-pass/gates/tools/measure-startup.ts` and the
unedited transcript is
`.specstride/features/103-proposer-pass/gates/proofs/T082-startup-measured.txt`:

```text
T082 — the start-up of a pass, measured on Linux

date (UTC)        2026-10-03T17:00:47.876Z
platform          linux 7.0.14-15-pve x64
node              v22.23.2
processors        22 x Intel(R) Core(TM) Ultra 7 155H
memory            94 GiB
load average      9.07 18.86 22.50
runs per size     9 (the MINIMUM is reported: the least noisy
                  estimator of processor time on a loaded host)

prompt    start-up, microseconds of processor time      baseline   ratio to
          text prompt     white-space worst case        (seconds)  20 kB
-------------------------------------------------------------------------
20 kB             27               160               2.0      1.00
40 kB             10               430                 —      0.37
80 kB              9               708              33.0      0.33
160 kB             8              1419                 —      0.30
320 kB             8              2705             548.0      0.30
-------------------------------------------------------------------------
the prompt grew 16.0x from 20 kB to 320 kB
  the text-prompt start-up grew 0.30x
  the worst-case start-up grew 16.91x  (the scan must read every byte)
320 kB, worst case: 2705 us of processor time, against a budget of 1 s (1 000 000 us) and the baseline's 548 s at 319 kB

macOS: UNVERIFIED — no macOS runner exists in the build workflow (T082, T087).
```

**What the figures say.**

| Claim of F103-SC-004 | Measured | Status |
|---|---|---|
| At 320 kB the start-up takes under 1 s of processor time | 2 705 µs in the worst case (0.0027 s), 8 µs for a text prompt | **passed** |
| From 20 kB to 320 kB the time grows no faster than the prompt | the prompt grew 16.0×; the worst-case start-up grew 16.91× and the text-prompt start-up 0.30× | **passed** |
| Against the baseline's cost at the same size | the baseline's 548 s at 319 kB (R28), against 0.0027 s here | **passed** |

The worst case is a prompt of white space for all but its last byte: the scan must read every byte
before it can answer, so it is the series that shows the growth. A text prompt answers at its first
byte, which is why its series is flat and its 20 kB figure is the largest — that reading is the
first run of the process and carries the warm-up of the code path, not the cost of the prompt.

**Confidence.** F103-SC-004 itself records "The figure has low confidence", and two limits hold
here. (1) The reference machine of the criterion is the **Linux runner of the build workflow**
(`spec.md`, assumption A1), and this is the campaign host, not that runner; the margin is three
orders of magnitude, so the conclusion is not sensitive to the machine, but the figure is not the
runner's. (2) The baseline's 548 s is R28's measurement on another machine and was **not measured
again here**: `proposer.sh` at `9cab15d` is not in this tree, which `research.md` already
records.

### On macOS: **`unverified`**

Reason: **no macOS runner has run it.** This host is Linux (`uname -sm` → `Linux x86_64`), this
working tree has no remote (`git remote -v` prints nothing) and no upstream
(`git rev-parse @{u}` → `fatal: no upstream configured for branch
'campaign/103-proposer-pass'`), so there is no repository on which
`.github/workflows/build.yml` can be dispatched. The macOS **job** exists — the matrix of that
workflow is `os: [ubuntu-latest, macos-latest]` — and what is missing is a **run** of it.

This is the owner's out-of-band ruling of 2026-09-30: the macOS part is never run here and never
faked. The hermetic part on Linux is done and recorded above; the macOS part is recorded as
`unverified` with its reason, here and, per test, in
`tests/characterization/103/macos.md`.

---

## T087 — every test of this feature on the macOS runner

**Status: `unverified`. No macOS runner has run any test of this feature.**

The per-test record is `tests/characterization/103/macos.md`, which T087 names as its location.
It lists every parity test, every characterization test, every conformance suite of this feature
and the three measures of T082, each with the result `unverified` and the same reason, and it
carries the empty header table (date, runner, `sw_vers -productVersion`, `uname -sm`, Node,
recorder) that a real run must fill.

The reason is the one above: the macOS job of `.github/workflows/build.yml` exists and is
declared, the host of this campaign is Linux, and there is no repository to dispatch the workflow
on. Creating one would mean publishing the owner's unreleased specification corpus. Feature 100
recorded the identical obstacle for its own T206
(`specs/100-specstride/verified.md`, "T206 — every test of this feature on the macOS runner",
status `unverified`).

**Until that run is recorded, every macOS statement of this feature stays `unverified`.** That is
already the state of the specification: `checklists/requirements.md` records "no machine-specific
name; every macOS statement is `unverified`", and F103-SC-004 carries the same.

### W-X-09 — a missing prerequisite is a skip with its reason, never a pass

Three prerequisites of this feature are missing, and each is reported as a skip or as
`unverified` with its reason rather than as a pass:

| Prerequisite | What is missing | How it is reported |
|---|---|---|
| A macOS runner | no macOS host and no repository to dispatch on | `unverified` in this file and per test in `tests/characterization/103/macos.md` |
| The oracle of feature 141 | `packages/oracle/src/` holds the campaign skeleton; no family of FX-17 to FX-20 or FX-24 has run on the reference | the one case of `tests/characterization/103/setup-103.test.ts` that needs the real exercise map **skips with its reason**, and fails the moment a map exists and leaves a claim of this feature unexecuted (phase 1) |
| The reference tree (the baseline `9cab15d`) | `proposer.sh` is not in this repository | the parity tests compare against the **recorded bytes** of `tests/parity/103/baseline/`, whose provenance is stated in `tests/parity/103/baseline/README.md`; an absent baseline is a **failure** of the test and never a skip |

No test of this feature reports a pass for any of the three.
