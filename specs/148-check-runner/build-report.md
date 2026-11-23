# Report of the build: feature 148 (Check runner)

This is the report of the build of feature 148. It records the result of running
`specs/148-check-runner/quickstart.md` end to end on the fixtures (task
**T063**).

The result below is **not** a remembered one. The build runs the same seven
scenarios on every `npm test`, from `tests/release/148/quickstart.test.ts`
through `tests/release/148/quickstart.ts`, and that test compares the recorded
table with the fresh run, row for row and byte for byte. A report that no
longer reproduces fails the build.

- Runner: `tests/release/148/quickstart.ts`
- Test that runs it and holds this report to it: `tests/release/148/quickstart.test.ts`
- Run on 2026-10-02, Linux `7.0.14-15-pve` (x64), Node.js v22.23.2, `python3`
  3.13, no network. The seven scenarios take about 60 s.

## Result

<!-- quickstart-result:begin -->

| # | Scenario | What `quickstart.md` asks for | Outcome |
|---|---|---|---|
| 1 | Conformance of the runner | Pass, fail at step n, slow, never ending and very large output give the documented results | pass |
| 2 | Parity of the four carried items | 0 results `different` | pass |
| 3 | No credential | None is printed outside the `parity` profile; all are printed under it | pass |
| 4 | Taint | `tainted`, reason `changed-during-check`; not a pass | pass |
| 5 | Integrity | The check does not run and `integrity.noted` is written (`kind` `manifest-hash`); `tainted` with `pin-mismatch` | pass |
| 6 | Concurrent commands | Equal results, signatures and fact contributions; a taint of a batch writes `check.parallelism_lowered`; an entry without a declaration in the manifest runs alone | pass |
| 7 | Step runner | Stops at step 35; the resumed execution is `partial` | pass |

<!-- quickstart-result:end -->

The quickstart passed end to end: **7 of 7 scenarios pass, 0 fail.**

Five of the seven are carried out against the product's own modules in the
process of the test. Scenarios 2 and 6 are run as child `node --test`
processes, because the quickstart words those two **by test id** ("Run
`PT-148-C-080-command-run` …", "Run the own tests CT-148-201 to CT-148-208 …");
running them as anything else would not be running what the quickstart asks
for.

## What each scenario observed

### Scenario 1 — conformance of the runner

The conformance suite of EP-05 (`packages/testkit/src/conformance/EP-05/`) was
run **on the sample runner**, case by case: **11 cases, 0 failed**. The five
scripted commands were then run **on the kind `command`** through
`theCheckRunner`, and each gave the documented result of the "Proving test" of
the point:

| Scripted command | exitCode | signal | passed | characters of standard output |
|---|---|---|---|---|
| pass | 0 | — | true | 20 |
| fail at step n | 35 | — | false | 396 |
| slow | 0 | — | true | 46 |
| never ending | — | `TIMEOUT` | false | 0 |
| very large output | 0 | — | true | 64000 (the cap) |

`poll` straight after `start` reported `running` in every case.

### Scenario 2 — parity of the four carried items

`tests/parity/148/PT-148-C-080-command-run.test.ts` and
`tests/parity/148/PT-148-C-080-timeout-and-start-error.test.ts`, run as one
child: **exit 0, 12 tests, 10 pass, 0 fail, 2 skipped**. The two skips are the
reference halves against the reference trees of feature 141, which is not
built; each skips with its reason and never passes (the constitution, Principle
XVII). **0 results `different`** over the fields of a command result, measured
against the baseline's own `_execute_command` at `9cab15d`. The suite-level
measurement of F148-SC-006 over all four fixture families is
`tests/parity/148/PT-148-C-080-suite.test.ts` (T059), which compares 99 fields
over 12 scenarios and reports 0 different.

### Scenario 3 — no credential

Four provider variables were planted in the environment of the runtime —
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GITHUB_TOKEN`,
`AWS_SECRET_ACCESS_KEY` — and the scripted command that prints its environment
was run twice on the same pinned identity.

- Outside the `parity` profile: **0 of the 4** are printed, neither by name nor
  by value, and `credentialNames` of the computed environment is empty.
- Under the `parity` profile: **all 4** are printed with their values, as at the
  baseline (row 125 of annex X §X.7, register row DV-113).

### Scenario 4 — taint

The scripted command that changes a protected file ran inside the fingerprint
bracket. The command exited 0, and the result is **`tainted` with the reason
`changed-during-check`** and is **not a pass** (`statedAsPass` false). The
bracket named the one path that changed, and an independent read of the file on
disk confirms it: its sha256 went from `b40dedde6082…` to `eb68e78070a1…`, and
the two readings of the bracket hold exactly those two hashes.

### Scenario 5 — integrity

- **One byte of the stored manifest changed between two checks** (the phase went
  from 1 to 2): the hash no longer verifies, `mayRunTheCheck` is **false** — the
  check does not run — and `integrity.noted` was written with the `kind`
  **`manifest-hash`**.
- **A pinned executable replaced after launch**: the pin differs in `hash`, the
  recorded hash is the one `pin` took at launch and the fresh hash is the bytes
  now on disk. The command **ran** (exit code 1, the replacement's own result),
  and its result is **`tainted` with the reason `pin-mismatch`** and is never a
  pass.

### Scenario 6 — concurrent commands

The eight own tests CT-148-201 to CT-148-208, run as one child: **exit 0, 33
tests, 33 pass, 0 fail, 0 skipped**. Inside them: CT-148-207 is the equality of
results, failure signatures and fact contributions at `verification.parallelism`
1 and 3 (F148-SC-001); CT-148-203 is the taint of a batch, which writes
`check.parallelism_lowered` and sets the parallelism to 1; CT-148-202 and
CT-148-208 are the entry of the manifest without a declaration, which runs
alone.

### Scenario 7 — step runner

A command of **40 steps whose step 35 fails**:

- the run stopped at `step-35`; **35 steps ran, 5 are `not-run`**, and all 40
  carry a result;
- the effect witness is the marker file the steps themselves write: it holds
  `start 1` to `end 34` and **no `start 36`**, so no step after the failed one
  was started.

The same command **resumed from step 35**, with every remaining step passing:
state **`partial`**, `unchecked` true with the reason `partial`, exit code 0,
and `statedAsPass` **false** — a `partial` run never satisfies the verification
gate, whatever its exit result.

## What this report does not cover

The conformance suite on a **macOS runner** is out of band and is never run and
never faked here (the owner's ruling of 2026-09-30). The statement about process
groups on macOS stays `unverified`, with its reason, in
`specs/148-check-runner/research.md` and in
`specs/148-check-runner/verification-record.md`.
