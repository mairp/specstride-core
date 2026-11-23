# Verification record: feature 148 (Check runner)

This is the verification record of feature 148, written for task **T061**.

T061 reads: *run the conformance suite on the macOS runner and record the
`unverified` fact about process groups with date and version in
`specs/148-check-runner/research.md`.*

The **macOS runner half is out of band** (the owner's ruling of 2026-09-30):
no macOS runner exists in this checkout, and a macOS task is out of band by the owner's ruling of 2026-09-30: it is never run here and never faked.
Every macOS statement of this feature therefore stays `unverified`, with its
reason, in the table below and in `research.md`. The hermetic half — running
the conformance suite of EP-05 on this platform — is done, and its result is
below.

Nothing in this record is remembered. `tests/release/148/verification.ts` runs
the conformance suite again on every `npm test`, and
`tests/release/148/verification-record.test.ts` holds both tables below against
that fresh run. A record that no longer reproduces fails the build.

- Runner: `tests/release/148/verification.ts`
- Test that runs it and holds this record to it: `tests/release/148/verification-record.test.ts`
- The suite run: `packages/testkit/src/conformance/EP-05/` — `commands.test.ts`
  (CT-148-118, this feature's behaviour half), `contract.test.ts` (feature
  100's half) and `prestage.test.ts`
- Run on **2026-10-02**, Linux `7.0.14-15-pve` (x64), Node.js **v22.23.2**,
  `@specstride` 0.0.0, constitution **v3.0.2**, no network

## The run

<!-- verification-run:begin -->

| Field | Value |
|---|---|
| platform | linux |
| node | v22 |
| exit | 0 |
| tests | 27 |
| pass | 27 |
| fail | 0 |
| skipped | 0 |

<!-- verification-run:end -->

The conformance suite of EP-05 passes on Linux: **27 tests, 27 pass, 0 fail, 0
skipped.** The eleven behaviour cases of CT-148-118 run on the sample runner of
`packages/testkit/src/samples/EP-05/`, which serves a kind of identity the core
does not know; the kind `command` of this feature is run through the same five
scripted commands by scenario 1 of `build-report.md`, and every one of them
gave the documented result of the "Proving test" of the point.

Beside the suite, two measurements of this feature bear on the same behaviour
on Linux:

- the end of a process group after a time limit, read from the operating system
  itself (`kill(-group, 0)` reporting `ESRCH`): a median of **0.12 ms** against
  the starting value of 5 s — `packages/check-runner/README.md`, task T062;
- the time limit and `cancel` of the kind `command`, each ending the whole
  group and never the leader alone — CT-148-104 and the effect-witness half of
  `PT-148-C-080-timeout-and-start-error`.

Neither of those is evidence about macOS. They are what Linux shows.

## macOS statements — all `unverified`

Every statement of this feature about macOS, with the status it has and the
reason it has it. `Source` names the file the statement stands in, and `Phrase`
is the text the build checks is there, so a row cannot quietly stop being a
statement of this feature.

| # | Source | Phrase | Status | What it is |
|---|---|---|---|---|
| 1 | `specs/148-check-runner/spec.md` | "status: unverified (check: on macOS a command started in a process group of its own is ended with all its children by one signal to the group; verified-on: —; pin: the macOS runner of the release build)" | `unverified` | the `status:` line of F148-FR-002 itself |
| 2 | `specs/148-check-runner/spec.md` | "Every statement about macOS is `unverified`" | `unverified` | the constraint of the feature, from decision 12 and ruling 67 |
| 3 | `specs/148-check-runner/plan.md` | "Process groups on macOS are `unverified` until a macOS runner has passed the oracle (ruling 67)" | `unverified` | the Target Platform of the plan |
| 4 | `specs/148-check-runner/plan.md` | "macOS statements are `unverified`" | `unverified` | Principle XVII in the constitution check of the plan |
| 5 | `specs/148-check-runner/research.md` | "A signal to a process group ends all children of a command on macOS" | `unverified` | the item of "What is `unverified`", with its date and version (T061) |

**The check that would verify them**: the conformance suite of EP-05 run on a
macOS runner. Until one exists, the status stays `unverified` and
`verified-on` stays `—`. The owner holds the list of out-of-band tasks of this
campaign; T061 is on it.

## What else stays `unverified`

| Item | Check that would verify it | Status | Date |
|---|---|---|---|
| Whether Lisa's verification tests pass | Run them once after extraction (R1 O5) | `unverified` | 2026-10-02 |

Lisa's tree is read at `363e6a3` and is read-only (`STAGE-B-RULES.md`), and its
own verification tests were not run in this lane. What the extraction does have
instead is recorded and checked: `packages/check-runner/EXTRACTED.md` pins each
extracted file by the sha256 of its source and carries the licence check, and
`tests/characterization/148/CT-148-2.test.ts` holds the extracted executor to
the behaviour it was extracted with. Neither is a substitute for R1 O5, and
this row says so rather than closing it.

## Prerequisites that are missing, and what skips because of them

A test whose prerequisite is missing is a skip with its reason and never a pass
(the constitution, Principle XVII).

| Prerequisite | What skips |
|---|---|
| The parity oracle of feature 141 (`packages/oracle`, `tests/parity/reference`) | the reference half of each of the three parity tests of this feature: `PT-148-C-080-command-run`, `PT-148-C-080-timeout-and-start-error` and `PT-148-C-080-suite`. Their differential halves run against the Specstride baseline's own `_execute_command` at `9cab15d` and are not skipped |
| A macOS runner | the conformance suite of EP-05 on macOS (T061, out of band) |
