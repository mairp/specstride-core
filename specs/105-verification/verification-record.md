# Verification record: feature 105 (Verification)

This is the verification record of feature 105, written for task **T142**.

T142 reads: *run the parity tests of this feature on the macOS runner and
record the `unverified` fact about process sessions with date and version in
`specs/105-verification/research.md`.*

The **macOS runner half is out of band** (the owner's ruling of 2026-09-30):
no macOS runner exists in this checkout, and a macOS task is out of band by the owner's ruling of 2026-09-30: it is never run here and never faked.
Every macOS statement of this feature therefore stays `unverified`, with its
reason, in the table below and in `research.md`. The hermetic half — running
the parity tests of this feature on this platform — is done, and its result is
below.

Nothing in this record is remembered. `tests/release/105/verification.ts` runs
the process-session parity tests again on every `npm test`, and
`tests/release/105/verification-record.test.ts` holds both tables below against
that fresh run. A record that no longer reproduces fails the build.

- Runner: `tests/release/105/verification.ts`
- Test that runs it and holds this record to it: `tests/release/105/verification-record.test.ts`
- The run: the two parity tests of this feature whose subject **is** a process
  session — `tests/parity/105/PT-105-C-080-detached-prestage.test.ts` (item
  B-1127, F105-FR-035: a detached staged command started in a session of its
  own, with its standard input closed, never killed at its deadline) and
  `tests/parity/105/PT-105-C-078-detached-files.test.ts` (its log and its
  status record). They are the **port side** of the fixture `long-job-running`
  of FX-16, which is the check the `unverified` row of `research.md` names.
- Run on **2026-10-03**, Linux `7.0.14-15-pve` (x64), Node.js **v22.23.2**,
  `@specstride` 0.0.0, constitution **v3.0.2**, no network

## The run

<!-- verification-run:begin -->

| Field | Value |
|---|---|
| platform | linux |
| node | v22 |
| exit | 0 |
| tests | 15 |
| pass | 13 |
| fail | 0 |
| skipped | 2 |

<!-- verification-run:end -->

The process-session parity tests pass on Linux: **15 tests, 13 pass, 0 fail, 2
skipped.** The two skips are the reference halves of those two files, which
compare whole runs of FX-16 against the reference trees of feature 141; feature
141 is not built, so each skips with its reason and never passes (the
constitution, Principle XVII). The differential half of both files ran against
the Specstride baseline's own bytes at `9cab15d`.

## The whole parity suite of this feature, on Linux

The parity suite of this feature is run in full by `npm run test:parity` of the
same `npm test`, so this statement is reproduced by the build and is not a
remembered number either. Captured on 2026-10-03 on the platform above:

| Field | Value |
|---|---|
| files | 78 |
| suites | 109 |
| tests | 564 |
| pass | 486 |
| fail | 0 |
| skipped | 78 |
| exit | 0 |

All 78 skips are the same one: the reference half of a parity test, whose
prerequisite — the parity oracle of feature 141 (`packages/oracle`,
`tests/parity/reference`) — is not built. The capture of this run is kept with
the gate evidence of the phase that made it; `npm run test:parity` reproduces
it.

Beside the suite, two observations of this feature bear on process sessions on
Linux:

- a detached staged command is started by the **process primitive of
  `@specstride/kernel`** (F100-FR-234), in a session of its own with its
  standard input closed, and never through the check runner and never by
  `node:child_process` — read off the recorded calls of the primitive and off
  every file of `packages/verification/src/prestage/`, in
  `PT-105-C-080-detached-prestage`;
- a command whose deadline passed is reported `deadline_exceeded` with the
  signal `DEADLINE` and **its process is still there afterwards**, read out of
  the process table of the host — the same file.

Neither of those is evidence about macOS. They are what Linux shows.

## macOS statements — all `unverified`

Every statement of this feature about macOS, with the status it has and the
reason it has it. `Source` names the file the statement stands in, and `Phrase`
is the text the build checks is there, so a row cannot quietly stop being a
statement of this feature.

| # | Source | Phrase | Status | What it is |
|---|---|---|---|---|
| 1 | `specs/105-verification/spec.md` | "status: unverified (check: on macOS a process started in a session of its own survives the end of the engine; verified-on: —; pin: the macOS runner of the release build)" | `unverified` | the `status:` line of F105-FR-035 itself |
| 2 | `specs/105-verification/spec.md` | "Every statement about macOS is `unverified`" | `unverified` | the constraint of the feature, from decision 12 and ruling 67 |
| 3 | `specs/105-verification/plan.md` | "Process sessions on macOS are `unverified` until a macOS runner has passed the oracle (ruling 67)" | `unverified` | the Target Platform of the plan |
| 4 | `specs/105-verification/plan.md` | "macOS statements are `unverified`" | `unverified` | Principle XVII in the constitution check of the plan |
| 5 | `specs/105-verification/research.md` | "A process started in a session of its own survives the end of the engine on macOS" | `unverified` | the item of "What is `unverified`", with its date and version (T142) |

**The check that would verify them**: the parity tests of this feature, and the
fixture `long-job-running` of FX-16 in particular, run on a macOS runner. Until
one exists, the status stays `unverified` and `verified-on` stays `—`. The
owner holds the list of out-of-band tasks of this campaign; T142 is on it.

## What else stays `unverified`

| Item | Check that would verify it | Status | Date |
|---|---|---|---|
| Whether Lisa's verification tests pass | Run them once after extraction (R1 O5) | `unverified` | 2026-10-03 |
| Who records the exit code of a detached command whose engine has ended | Whether the process primitive of F100-FR-234 can start the wrapper the baseline's `_DETACHED_SHIM` starts; reported to feature 100 by the second analyze run | `unverified` | 2026-10-03 |

Lisa's tree is read at `363e6a3` and is read-only (`STAGE-B-RULES.md`), and its
own verification tests were not run in this lane. What the extraction does have
instead is recorded and checked: `packages/verification/EXTRACTED.md` pins each
extracted file by the sha256 of its source and carries the licence check, and
`tests/characterization/105/CT-105-2.test.ts` holds the extracted hash,
renderer, store and discovery to the behaviour they were extracted with.
Neither is a substitute for R1 O5, and this row says so rather than closing it.

## Prerequisites that are missing, and what skips because of them

A test whose prerequisite is missing is a skip with its reason and never a pass
(the constitution, Principle XVII).

| Prerequisite | What skips |
|---|---|
| The parity oracle of feature 141 (`packages/oracle`, `tests/parity/reference`) | the reference half of each of the 78 parity tests of this feature that have one (the suite has 78 files and 109 suites), `PT-105-028FR020-suite` included. Their differential halves run against the Specstride baseline's own bytes at `9cab15d` and are not skipped |
| The local `specs/` tree (outside the git index since 2026-09-30) | the four tests of T004 that compare `packages/verification/data/` with `specs/105-verification/contracts/`, the five tests of `CT-105-304` (F105-SC-010), and the scenario-list test of `PT-105-028FR020-suite` |
| A macOS runner | the parity tests of this feature on macOS (T142, out of band) |
