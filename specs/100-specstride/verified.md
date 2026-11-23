# Verified: feature 100

What has been **run**, with what result, and what stays **`unverified`** and why. One section per
task that records a result here: T205 (the live integration run), T206 (the macOS runner), T209
(the three performance goals), T210 (the scenarios of the quickstart), T224 (the attestation of a
published version) and T225 (the publishing workflow and its three release conditions).

Rule of this file: **nothing is written here that was not run.** A measure that could not be taken
is recorded as `unverified` with its reason, never as a pass, and never estimated
(quickstart.md: "a test whose prerequisite is missing reports a skip with its reason, never a
pass").

## The machine of the recorded runs

| Fact | Value |
|---|---|
| Date | 2026-10-01 |
| Tree | `b2dffb6` plus the working tree of phase 8 (the port of the generator, T288 to T293 and T207; T204, T205, T208, T294, T209, T210) |
| Platform | Linux 7.0.14-15-pve, x86-64, Debian GNU/Linux 13 (trixie) |
| Node | v22.23.2 |
| npm | 10.9.8 |
| git | 2.47.3 |
| Processor | 22 x Intel(R) Core(TM) Ultra 7 155H |

---

## T210 — the scenarios 1 to 8 of `quickstart.md`

All eight hermetic and parity scenarios were run on the tree and the machine above. The transcript
is `.specstride/features/100-specstride/gates/proofs/quickstart-scenarios.log`.

| Scenario | Command | Result | Status |
|---|---|---|---|
| Prerequisites | `node --version`, `npm --version`, `git --version` | v22.23.2, 10.9.8, 2.47.3 | **passed** |
| Set-up | `npm install --ignore-scripts` | succeeded, 0 vulnerabilities, nothing compiled (F100-FR-027) | **passed** |
| 1 — the contract files equal the annexes | `npm run contracts:check` | `checked 82 files, 0 differ` | **passed** |
| 1 — the same by the retired Python oracle | `python3 specs/100-specstride/contracts/tools/generate.py --check` | `checked 82 files, 0 differ` | **passed** |
| 1 — negative control | one cell of annex E changed, then `npm run contracts:check` | named `annex-tables/E-engine.json` and `data/stop-reasons.json`, `checked 82 files, 2 differ`, status 1; the annex was restored and the check returned to `0 differ` | **passed** |
| 2 — every record validates, a different major is refused | `npm test --workspace @specstride/contracts` | 291 tests, 291 passed, 0 failed | **passed** |
| 3 — the static tests | `npm run test:static --workspace @specstride/testkit` | 14 checks, 14 passed (closed sets, schema field, profile, logical names, physical paths, vocabulary, no closed list, the product rules, the threat model, no listener, the scope) | **passed** |
| 4 — table-level tests | `npm run test:tables --workspace @specstride/testkit` | 122 tests, 122 passed: one per row of `exit-codes.json`, per stop reason (15) and per transition (18) | **passed** |
| 5 — a sample outside the core passes, and the core does not change | `npm run conformance --workspace @specstride/testkit`; `… -- EP-08`; `npm run check:imports` | `19 point(s) of 19, 149 case(s), 0 failure(s)`; `EP-08 … 10/10 cases passed`; `5 packages, 222 files, 694 imports checked; 0 violation(s)`; and CT-100-322 (second part) proved the core builds byte-identical with the samples removed and that a core file naming a sample makes the check fail | **passed** |
| 6 — the table evaluator | `npm test --workspace @specstride/kernel -- table` | 24 tests, 24 passed | **passed** |
| 7 — the canary test | `npm run test:canary --workspace @specstride/testkit` | 5 tests, 5 passed; 0 of the 7 planted canaries in any sink, with the negative control failing as it must | **passed**, against the **stub** redactor |
| 8 — parity, table level | `npm run test:parity -- --feature 100` | 33 tests: 22 passed, **11 recorded skips**, 0 failed | **partly `unverified`** |
| 8 — characterization | `npm run test:characterization -- --feature 100` | 6 tests, 6 passed (CT-100-1, CT-100-2) | **passed** |
| 9 — integration acceptance | not run | live tier: see T205 below | **`unverified`** |

### What scenario 8 leaves `unverified`

The reference half of every parity test, 11 skips, each naming its reason: the parity oracle of
feature 141 (`packages/oracle` and `tests/parity/reference`) is not built, so no fixture family can
be run against a reference tree. The table-level half of each test ran and passed.

| Skipped half | Fixture families |
|---|---|
| CT-100-323, the oracle reports no result `different` (T204) | FX-01 to FX-40 |
| CT-100-323, the second suite passes with equal counters (T204) | FX-01 to FX-40 |
| `PT-100-028SC003-engine-codes` | FX-03, FX-04, FX-05, FX-07, FX-11, FX-12, FX-17 |
| `PT-100-011SC004-pipeline-codes` | FX-33, FX-35 |
| `PT-100-011SC007-supervision-outcomes` | FX-36 |
| `PT-100-C-008-sweep-event`, `PT-100-C-011-current-names`, `PT-100-C-011-roots`, `PT-100-C-012-sweep-line`, `PT-100-C-013-notebook-sweep`, `PT-100-C-013-run-id` | FX-01 |

`unverified`: F100-FR-223 and F100-SC-002 wait on feature 141. No skip is read as a pass.

### What scenario 7 leaves `unverified`

The canary harness of feature 100 runs against the **stub** redactor, which replaces exact
registered values and holds no pattern of its own, so the run proves **routing**, not coverage.
F100-SC-008 is `unverified` until feature 111 has run the same harness against the real redactor;
that run is a release condition (T225).

---

## T209 — the three performance goals of `plan.md`

Measured by `packages/testkit/test/performance.test.ts` on the machine above. The values and the
rule are recorded in `packages/testkit/data/performance-goals.json`.

| Goal | Limit | Measured | Verdict |
|---|---|---|---|
| Loading the `contracts` package adds to the start of a command | under 30 ms | **226.9 ms** | **breach, reported as a WARNING** |
| A decision of the table evaluator on a table of 100 rows | under 1 ms | **0.010 ms** (median of 1000 vectors) | within the goal |
| The import-boundary check on the whole workspace | under 10 s | **637 ms** (5 packages, 222 files, 694 imports) | within the goal |

**Why the breach is a warning and not a failure.** `plan.md` marks the confidence of these goals
low ("starting values, measured in the build"), and T209 states that a breach is a warning until
the values have been measured on **three builds**. One build has recorded them (this one), so the
test prints the breach as a warning and passes. From the third recorded build on,
`performance-goals.json` makes the same breach fail.

**What the breached value is made of.** In the same run, loading **one small module** of the same
package took 54.6 ms. The package ships TypeScript and the platform strips the types of every
source file at load, so most of the 226.9 ms is the module loader of the platform and not work of
the package. `unverified`: whether the goal of 30 ms is reachable at all without a compile step is
a question for the owner, since "nothing compiled at install" is a constraint of `plan.md`. Two
further builds must record the values before the goal is read as broken.

---

## T205 — CT-100-324, the live integration run

**Status: `unverified`. The run has not been made.**

Reason: the tier is **live**. The script is `tests/release/100/integration-run.md`; it is run at
release, on request, **by a person under the owner's login**, on the release build. It is never a
job of the build, the build makes no paid call, and no automated pass may make it or fake its
result. The publishing workflow of T225 reads the entry below and never makes the run.

What stays `unverified` until the run is logged here: **F100-FR-224**, **F100-SC-002** and
**F100-SC-005**.

### The prerequisite check of the script, run on this build (2026-10-01)

`tests/release/100/integration-run.md` line 40 rules that **"a missing prerequisite is a skip with
its reason, never a pass"**, and lines 15 to 16 that a pass which cannot make the run **"records
`unverified: <reason>` and stops; it never fakes a result"**. The five prerequisites of the script
were therefore checked on this build. Transcript:
`.specstride/features/100-specstride/gates/proofs/T205-prerequisites.txt`.

| # | Prerequisite (script line) | Checked | Result |
|---|---|---|---|
| 1 | The release build, installed from the published packages (34) | `which specstride` | **not met.** What is on `PATH` is `/root/specstride/specstride`, the **orchestrator** driving this campaign — a separate repository, out of bounds by `prompts/specstride-campaign.md` §7. The product CLI `@specstride/cli` is not on this tree |
| 2 | The host package for Claude Code, registered as the host (35) | `ls -1 packages/`; `test -d packages/host-claude-code` | **not met.** `packages/` holds `contracts`, `kernel`, `testkit` and nothing else; the directory is absent |
| 3 | A live harness with a login of the owner (36) | — | **not met.** No product CLI, and the call is a **paid** live call under the owner's login, reserved by the script to a person at release |
| 4 | A reference project (37) | `test -d tests/parity/reference` | **not met.** Absent; it is built by feature 141 |
| 5 | The measured baseline of the stage times (38) | `docs/ecosystem/` | **met.** `docs/ecosystem/research/R21-time-use-baseline.md`, measured 2026-09-29, carries the per-stage figures (F-12, appendix B); recomputed by `R21v-baseline-recompute.md` |

**1 of 5 met, 4 of 5 not met → the scripted check is a `skip` with its reason, which is this entry.**

### Why no pass of phase 8 can close this task

The run goes **through artefacts that feature 100 does not build.** Feature 100's own
`specs/100-specstride/contracts/data/package-graph.json` assigns every one of them to a later
feature:

| Package the run needs | Layer | Owner in the package graph |
|---|---|---|
| `@specstride/host-claude-code` — the host package the run starts through | L7 | **113** |
| `@specstride/cli` — the released CLI the run is started with | L6 | **119**, 145 |
| `@specstride/oracle`, `tests/parity/reference` — the same-build oracle of lines 24–28 | dev | **141** |

Feature 100 owns exactly `@specstride/contracts`, `@specstride/kernel` and `@specstride/testkit` —
the three directories present in `packages/`. So three of the four missing prerequisites cannot
exist until features 113, 119 and 141 are built, and the fourth is a paid live call. This is the
`live` tier working as designed, not an omission of this phase: the script itself places the run at
**release**, after those features, under the owner's login.

The disposition follows the owner's ticked policy box of 2026-09-30
(`prompts/specstride-campaign.md`, OPERATOR SLOT, "Out-of-band policy"): paid, live and person-run
tasks "are left unchecked and recorded as `unverified` with a reason", and the driver keeps them for
the owner to run by hand later. `specs/100-specstride/tasks.md` accordingly carries `- [ ] T205`.

Where that disposition is written down, by file and line:

| Where | What it says |
|---|---|
| `prompts/specstride-campaign.md`:434-435 | "**Out-of-band tasks** (paid captures, live-host probes, tasks run by a person, macOS runner; list in C1 §5) are never run and never faked." |
| `prompts/specstride-campaign.md`:457-459 (ticked by the owner) | "Paid, live, person-run and macOS tasks are left unchecked and recorded as `unverified` with a reason, and a phase whose only open tasks are of that kind counts as complete." |
| `prompts/analysis/C1-dependency-waves.md`:278 | names this task in the out-of-band list: "100 │ T205 live integration run by a person under the owner's login (1142)" |
| `specs/100-specstride/tasks.md`:1174 | `- [ ] T205` — unchecked, as the policy requires |

Slice: `.specstride/features/100-specstride/gates/proofs/T205-T206-attempt8-authority.txt`.

### What was added on this build, 2026-10-01: the eight fields became machine-checked

The run is still out of band. What changed is that the half of T205 this phase owns is no longer
prose. `packages/testkit/test/release-integration.test.ts` (four tests, in the test kit's `test`
script, so it runs on both runners of the build workflow) now asserts on every build:

1. `tests/release/100/integration-run.md` exists and names the **eight fields in order**, the tier
   `live`, who makes the run ("by a person under the owner's login"), that it is "never a job of the
   build", that a pass "never fakes a result", that the run goes **through the host package for
   Claude Code**, that the outcome is "every phase gate approved" and that the stage times are
   reported "beside the measured baseline".
2. **No workflow of `.github/workflows/`** runs the script, names `secrets.`, or names a model or a
   paid service — so "the build makes no paid call" is checked, not asserted.
3. This section is the logging location and carries all **eight field labels**, so the eight fields
   have somewhere to be written, and it names the script the run follows.
4. The **two-way rule** with the new machine-readable half
   `tests/release/100/integration-verified.json`: while that record is absent this section must
   record `unverified` and **every cell of the eight-row table below must be an em dash**; once the
   record is present this section must drop the `unverified` mark, both halves must name the same
   date, build and reference project, every entry of `gates` must carry the verdict `approved`
   (F100-SC-002) and every entry of `stages` must carry `measuredMs` beside `baselineMs`
   (F100-SC-005).

Neither half can be written without the other, so the entry cannot be fabricated, and T225 cannot
publish on an entry that lacks a field. Two negative controls of this build show the rule bites: a
fabricated `integration-verified.json` fails the build, and so does filling the `Date` cell below
while the record is absent
(`.specstride/features/100-specstride/gates/proofs/negative-controls-phase8-attempt7.log`, NC-4 and
NC-5).

### What was added on this build, 2026-10-01 (second pass): the acceptance rule became executable and tested

One hole was left in the mechanical half above. Rule 4, the two-way rule, judges a *present* record —
and while the record is absent that branch of the test never runs. So the logic meant to catch an
incomplete, inconsistent or fabricated record was itself never executed, on any build.

That is now closed. The rule by which a record of CT-100-324 is judged lives in one executable place,
`tests/release/100/integration-record.ts`, as `validateIntegrationRecord(record)`, which returns one
refusal per fault and an empty list for a record that conforms. The two-way rule of
`packages/testkit/test/release-integration.test.ts` calls that function instead of carrying its own
copy, and `packages/testkit/test/release-records.test.ts` (10 tests for T205) **runs it over
fixtures**, so the accept-and-refuse behaviour is proven on every build while the record is still
absent:

| Fixture | Expected |
|---|---|
| A conforming record of a release whose every gate was approved | accepted, no refusal |
| Not an object (`null`, a number, a string, a list, absent) | refused |
| Any of the five text fields missing, empty or not a string | refused, naming that field |
| `harnessVersions` absent, empty, a list, a string, or a blank version | refused |
| A gate whose `verdict` is not exactly `approved` | refused, naming **F100-SC-002** |
| `gates` absent or empty, or a gate without `phase` or `attempt` | refused |
| A stage whose `measuredMs` or `baselineMs` is absent, a string, negative, `NaN` or infinite | refused, naming **F100-SC-005** |
| `stages` absent or empty, or a stage that is not named | refused |
| An empty record | all eight faults reported at once |

The fixtures are fixtures: they are held inside the test file, are never written to
`tests/release/100/`, and name no build, project or harness that exists. A guard test of the same file
asserts that `tests/release/100/integration-verified.json` and `tests/release/100/macos-verified.json`
are **still absent**, so nothing in this work can be read as a recorded run.

What this does and does not change: the run is still **`unverified`**. The rule that will judge the
run's record is now written, executable and tested; the run itself still waits on a person, at
release, under the owner's login.

### The entry, when the run has been made

Eight fields, in this order, as `tests/release/100/integration-run.md` sets them out:

| Field | Value |
|---|---|
| Date | — |
| Build | — |
| Host | — |
| Harness versions | — |
| Reference project | — |
| Result per phase gate | — |
| Time per stage, beside the baseline | — |
| Oracle on the same build | — |

---

## T206 — every test of this feature on the macOS runner

**Status: `unverified`. No macOS runner has run them.**

Reason: this machine is Linux, and an automated pass cannot start a macOS runner. The hermetic part
of the task is done: `.github/workflows/build.yml` runs the matrix `ubuntu-latest, macos-latest`,
and on both runners it now runs **every** test of the feature — `npm run test` (every package, the
parity suite and the characterization suite), the static tests, the table-level tests, the canary
test, the nineteen conformance suites, the import-boundary check, the generator check, the
type-check, the lint and the formatting check. What is missing is a **run** of that workflow on the
macOS runner, with its result.

Why no pass of this campaign can make the run: this host is Linux (`uname -sm` -> `Linux x86_64`),
this working tree has no git remote and no upstream on `main` (`git remote -v` prints nothing;
`git rev-parse @{u}` fails), so there is no repository on which
`.github/workflows/build.yml` can be dispatched, and creating one would publish the owner's
unreleased specification corpus. `research.md`, "Facts that stay `unverified`", line 103, lists
"Everything about macOS" against F100-FR-025 and names "A macOS runner that passes the oracle and
the conformance suites" as what would verify it; `docs/ecosystem/DECISIONS-PENDING.md` DP-006,
closed on 2026-09-29 by ruling 67, requires that runner **before any release**, not before this
phase.

A fifth fact was established on 2026-10-01, and it is the decisive one: **no repository for this
product exists to dispatch on.** `gh` is authenticated as the owner, with `repo` and `workflow`
scopes, so the obstacle is neither a missing credential nor a missing job — the macOS job exists and
is dispatchable by hand. But a listing of every repository of the owner's account finds no
repository for this product. The one near-match is the **orchestrator** that drives this campaign —
the tool checked out at `/root/specstride`, which `prompts/specstride-campaign.md` §7 puts out of
bounds — and not the product built here. Reaching a `macos-latest` runner would therefore mean
creating a repository, **committing** this working tree (§7, "commit nothing yourself") and
**publishing** the owner's unreleased specification corpus, which cannot be undone. The transcript
of all five checks is
`.specstride/features/100-specstride/gates/proofs/T206-dispatch-reachability.txt`.

How the run is made, step by step, and in what form its result is written here: the scripted
procedure `tests/release/100/macos-run.md` (release tier, run by a person under the owner's login).

Until the result is recorded here, and the record
`tests/release/100/macos-verified.json` written, **every statement about macOS in every
specification of this feature carries `unverified`** (F100-FR-025). The static check
"Product-wide rules: the critic session and the platform marks" enforces that mark while the record
is absent, and it passed on this tree.

The obligation is machine-checked, not prose: `packages/testkit/test/macos-runner.test.ts` asserts
on every build that the macOS job of the workflow runs **every** test of the feature, that the
scripted procedure defines the six fields below, and the two-way rule — while the record is absent
this section says `unverified` and names no workflow run; once the record is present it must be a
well-formed, non-empty run record with `failed: 0`, this section must drop the `unverified` mark,
and both must name the same run and the same runner. A fabricated half fails the build.

### What was done on this build instead of the run (2026-10-01)

Three things that do not need macOS, and that the person who dispatches the job will want:

1. **Every run-step of the matrix job was executed in order on this host, and every one exits 0.**
   The eleven `run:` steps of `.github/workflows/build.yml` — the job whose matrix is
   `[ubuntu-latest, macos-latest]`, so the macOS runner runs exactly this list — were extracted from
   the workflow and run in file order. Transcript, with the extracted list beside the exit code of
   each step: `.specstride/features/100-specstride/gates/proofs/T206-job-steps-executed.txt`. Totals
   of step 4: **766 tests, 755 pass, 0 fail, 11 recorded skips** (on the tree of attempt 7; 760 and 749 before the six tests this attempt added). This proves the step list is
   complete and green; it does **not** prove it on macOS, which is the one variable this host cannot
   supply.
2. **A Darwin-sensitivity survey of the tree**, naming every construct whose behaviour can differ on
   macOS, so that no platform risk is unexamined when the job is dispatched:
   `.specstride/features/100-specstride/gates/proofs/T206-darwin-sensitivity.txt`. Findings: no
   `process.platform` branch anywhere; no `/proc` and no GNU-only tool flag; no two paths of the tree
   differ only in case (so a case-insensitive volume, the macOS default, holds the tree); the
   temporary roots go through `mkdtempSync(join(tmpdir(), …))`, which on macOS resolves under
   `/private/var`, and the path guard compares a real path against a **real** root
   (`packages/kernel/src/atomic-write/path-guard.ts`, `requireInsideRoot` resolves both sides), so
   the symbolic link of `/var` is handled; the wall-clock readings of
   `packages/testkit/test/performance.test.ts` are the one place where a different runner changes the
   value, and T209's rule already treats a breach as a warning until three builds have measured.
3. **One real cross-platform dependency was removed.** `packages/contracts/scripts/sync.mjs` still
   ran the retired Python generator and exited 2 with "no python3 interpreter found (Python 3 is a
   requirement of development until T207)". It now runs the generator of the workspace with the
   running Node (`tools/contracts-gen/src/main.ts --check`), so no path of development needs a second
   language on any runner. Proof:
   `.specstride/features/100-specstride/gates/proofs/T207-python-free.txt`; pinned by the test
   `T207: no path of development still needs Python 3` in `packages/testkit/test/setup.test.ts`.

None of the three is the run. **T206 stays `unverified`.**

Where that disposition is written down, by file and line:

| Where | What it says |
|---|---|
| `prompts/specstride-campaign.md`:433 | "**Git:** commit nothing yourself." — so a pass may not commit the tree a dispatch would need |
| `prompts/specstride-campaign.md`:434-435 | "**Out-of-band tasks** (… macOS runner; list in C1 §5) are never run and never faked." |
| `prompts/specstride-campaign.md`:457-459 (ticked by the owner) | "Paid, live, person-run and macOS tasks are left unchecked and recorded as `unverified` with a reason, and a phase whose only open tasks are of that kind counts as complete." |
| `prompts/analysis/C1-dependency-waves.md`:272-273 | "An unattended run can only record them as `unverified` or skip" — and the list at :272 names "100 T206" |
| `specs/100-specstride/tasks.md`:1178 | `- [ ] T206` — unchecked, as the policy requires |

One earlier statement is corrected here: the GitHub API *is* reachable from this sandbox and `gh` *is*
authenticated as the owner with the `repo` and `workflow` scopes (`gh api /user` returns `mairp`); only
the GraphQL endpoint times out. So neither a credential nor connectivity is the blocker. The blocker is
that **no repository exists for this product**: this tree has no remote, and the one repository of the
owner's account whose name resembles the product, `mairp/specstride`, is the **orchestrator** checked
out at `/root/specstride` (its `origin`), which `prompts/specstride-campaign.md`:430 puts out of bounds.
Re-checked transcript:
`.specstride/features/100-specstride/gates/proofs/T206-dispatch-reachability-attempt8.txt`.

### What was added on this build, 2026-10-01 (second pass): the acceptance rule became executable and tested

The two-way rule of `packages/testkit/test/macos-runner.test.ts` had the same hole as T205's: the
branch that judges a *present* `tests/release/100/macos-verified.json` never runs while the record is
absent, so the logic meant to refuse an incomplete or fabricated record was never executed.

It is now one executable function, `validateMacosRecord(record)` of
`tests/release/100/macos-record.ts`, called by that two-way rule and exercised over fixtures by
`packages/testkit/test/release-records.test.ts` (8 tests for T206):

| Fixture | Expected |
|---|---|
| A conforming record of a macOS run in which nothing failed | accepted, no refusal |
| Not an object | refused |
| `task` not `T206`, or `requirement` not `F100-FR-025` | refused |
| `date`, `workflowRun`, `runner` or `node` missing, empty or not a string | refused, naming that field |
| `runner` naming the image but not the version of the system | refused, naming **F100-FR-025** |
| `tests.failed` above 0, or `tests.passed` 0 | refused: a record is written only for a passing run |
| A count missing, a string, fractional or negative | refused |
| The record `buildRecord` produces from a green TAP log | accepted — the writer and the rule agree |

The last row is the one that matters most: it proves the record the macOS step of
`.github/workflows/build.yml` writes is one this rule accepts, so the two halves of T206 cannot drift.
Every ingredient of the task is now mechanized and tested **except the macOS runner itself**, which no
pass on this Linux build can supply.

T206 stays **`unverified`**, and every macOS statement of the specification keeps its mark.

### The entry, when the runner has passed

| Field | Value |
|---|---|
| Date | — |
| Workflow run | — |
| Runner image and version of the system | — |
| Node version on the runner | — |
| Result per step | — |
| Tests passed, failed, skipped | — |

---

### What was added on this build, 2026-10-01: the macOS job now records its own run

The run is still out of band: this host is Linux and no pass can start a macOS runner. What changed
is that the **recording** half of the task — steps 4 to 6 of `tests/release/100/macos-run.md`, which
were hand-transcription — is now done by the job itself, so the record cannot drift from the run it
claims and the only ingredient still missing is the runner:

1. `.github/workflows/build.yml` captures the output of the test step
   (`npm run test | tee "$RUNNER_TEMP/test-output.txt"`, under `shell: bash`, which GitHub runs with
   `-o pipefail`, so a failing test still fails the step).
2. The new step **"Record the macOS run (T206)"**, `if: matrix.os == 'macos-latest'`, runs
   `tests/release/100/macos-record.ts` after every check of the job has passed. That module takes the
   runner image from the matrix entry, the version of the system from `sw_vers -productVersion` on
   the runner, the Node version from `process.version` and the three counts from the captured TAP
   summary lines, and writes `macos-verified.json`. It **invents nothing**: an unset input is an
   error, a run with a failing test gets no record, and a log with no TAP summary is an error.
3. The step **"Upload the record of the macOS run (T206)"** uploads it as the artifact
   `macos-verified`, with `if-no-files-found: error`. The build **never commits** it: a person
   commits it beside the entry above, and the two-way rule then holds both halves together.

`packages/testkit/test/macos-runner.test.ts` gained two tests for this (the test kit now runs 331
tests): one over the workflow (the step exists, is macOS-only, passes the four environment values,
reads `sw_vers -productVersion`, captures the test output, uploads with `if-no-files-found: error`
and runs no `git commit`), and one that **executes the record writer** on a TAP fixture and asserts
the record it produces is exactly the shape the two-way rule demands, then asserts it throws for each
of the four unset inputs, for a run with a failing test and for a log without a summary line.

Three negative controls of this build show these bite: removing the recording step fails the build;
a fabricated `macos-verified.json` fails the build and also fails CT-100-125; a secret added to the
workflow fails three tests
(`.specstride/features/100-specstride/gates/proofs/negative-controls-phase8-attempt7.log`, NC-1 to
NC-3).

**None of this is the run. T206 stays `unverified`, and every macOS statement keeps its mark.**

## T224 — CT-100-336, the attestation of a published version

**The hermetic half: run, and passing.** The release check of F100-FR-236 is
`tests/release/100/publish-attestation.test.ts`, and it runs on every build, with no network and no
release. Its subject is the recorded attestations of `tests/release/100/attestations/`, whose README
states that they are recorded shapes and no claim that a version was published (every value in them
carries the prefix `recorded-`).

| Case | File of `tests/release/100/attestations/` | Result |
|---|---|---|
| A version published by the build from the protected branch | `published-by-the-build.json` | **passes**, 0 refusals |
| A version without an attestation | `without-an-attestation.json` | **refused**, naming F100-FR-236 and threat T-43 |
| An attestation that names another repository | `another-repository.json` | **refused** |
| An attestation that names another branch | `another-branch.json` | **refused**, also naming the protected branch |
| An attestation that names another commit | `another-commit.json` | **refused** |
| A version published from a working copy or by hand | `published-by-hand.json` | **refused** |

**What stays `unverified`: the read-back from the package registry.** F100-FR-236 carries the status
`unverified` in annex X §X.9 with the check "the attestation of a published version is read back from
the package registry and names the repository, the branch and the commit of the build". No version of
any package of this product has been published, so there is nothing to read back, and no automated
pass may publish one. Reason: **no release has been made; publishing is an owner action at release,
and the build of this repository publishes nothing.**

When a release is made, the publishing job of `.github/workflows/release.yml` writes the attestation
of every version it published and runs the same check over it; a person commits the read-back as
`tests/release/100/publish-attestation-verified.json`. The last test of
`publish-attestation.test.ts` is the two-way rule that holds the two halves together: while the file
is absent it requires this section to say `unverified`, and once the file is present it refuses a
record made of the recorded values and runs the full rule over it.

---

## T225 — the publishing workflow, and its three release conditions

**The hermetic half: written, and checked by a test.** `.github/workflows/release.yml` exists. It
runs on the protected branch only, it fails before it publishes unless the three release conditions
of T225 hold on the same build, it publishes the three packages of `published` of
`data/package-graph.json` with an attestation, and it then runs the release check of T224 on what it
published. No job of it calls a model and no job requests a model secret.
`packages/testkit/test/release-workflow.test.ts` reads the file and asserts each of those clauses,
and `tests/release/100/release-conditions.ts` holds the rule of the three conditions as executable
code, exercised by the same suite.

| Release condition | What proves it | State |
|---|---|---|
| 1 — the parity release check of feature 141 (CT-141-126) and T204 pass; no result `different`, the second suite with equal counters, every parity test of every feature passing, a skip counting as a failure (F100-FR-223) | `npm run test:parity` and `tests/parity/100/acceptance-oracle.test.ts` in the job `release-conditions` | **`unverified`**: the oracle of feature 141 is not built, so the parity tests of this tree report 11 recorded skips (T210, scenario 8). Under this condition a skip is a failure, so the workflow would refuse to publish today — which is the intended behaviour, not a pass |
| 2 — the canary run of T203 with the real redactor of feature 111: with content capture on, 0 of the seven planted secrets in any sink (F100-SC-008, F100-FR-219) | `npm run test:canary --workspace @specstride/testkit` with the real redactor in the same job | **`unverified`**: feature 111 is not built. The canary run of this tree passes against the **stub** redactor (T210, scenario 7) |
| 3 — `specs/100-specstride/verified.md` holds an entry of the logged live run T205 for this build, with every phase gate approved (F100-FR-224); the workflow reads that entry and never makes the live run | `node tests/release/100/release-conditions.ts` in the job `release-conditions`, over this file | **`unverified`**: the live run of T205 has not been made (see the section T205). The rule is executable and tested: a file without the entry, an entry of another build and an entry with a gate that is not `approved` are each refused |

**What stays `unverified`: the release-time part of T225, and it was never run and never faked.**
Owner ruling of 2026-09-30 (OPERATOR SLOT): a paid, live, person-run or release-time task is never
run and never faked by an automated pass; the hermetic part is done on Linux and the rest is recorded
here as `unverified` with its reason. Reason for each part: **no release has been made; the three
release conditions each wait on a feature that is not built (141, 111) or on a live run that only a
person may make (T205); and this repository has no remote, so no workflow of it has ever run.**

---

## Summary of what stays `unverified` after phase 10

| Subject | Requirement or criterion | Waits on |
|---|---|---|
| The oracle reports no result `different`; the second suite with equal counters | F100-FR-223 | feature 141 (`packages/oracle`, `tests/parity/reference`) |
| The live integration run, every phase gate approved, the time per stage | F100-FR-224, F100-SC-002, F100-SC-005 | a person, at release, under the owner's login (T205) |
| Every test on macOS | F100-FR-025 | a run of the build workflow on the macOS runner (T206) |
| No leaked secret, against the real redactor | F100-SC-008 | feature 111 (T225, release condition 2) |
| The goal of 30 ms for the load of the `contracts` package | `plan.md`, "Performance Goals" | two further builds that record the values (T209) |
| The attestation of a published version, read back from the package registry | F100-FR-236 | a release: a version published by the build from the protected branch (T224) |
| The three release conditions of the publishing workflow, on a release build | F100-FR-223, F100-FR-224, F100-SC-008 | features 141 and 111, the live run of T205, and a release run of the workflow (T225) |
