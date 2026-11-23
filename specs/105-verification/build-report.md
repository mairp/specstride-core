# Report of the build: feature 105 (Verification)

This is the report of the build of feature 105. It records the result of running
`specs/105-verification/quickstart.md` end to end on the fixtures (task
**T144**).

The result below is **not** a remembered one. The build runs the same eleven
scenarios on every `npm test`, from `tests/release/105/quickstart.test.ts`
through `tests/release/105/quickstart.ts`, and that test compares the recorded
table with the fresh run, row for row and byte for byte. A report that no
longer reproduces fails the build.

- Runner: `tests/release/105/quickstart.ts`
- Test that runs it and holds this report to it: `tests/release/105/quickstart.test.ts`
- Run on 2026-10-03, Linux `7.0.14-15-pve` (x64), Node.js v22.23.2, `python3`
  3.13, `bash`, no network. The eleven scenarios take about 25 s.

## Result

<!-- quickstart-result:begin -->

| # | Scenario | What `quickstart.md` asks for | Outcome |
|---|---|---|---|
| 1 | The three modes | 0 results `different`; in `mode-required-fail` the critic transcript has no call for the failed phase attempt | pass |
| 2 | Invalid mode | Exit 3; the as-is message | pass |
| 3 | Release verification | Exit 2 and stop reason `release_verification` in `release-verification-fails` | pass |
| 4 | Staged commands | `pre-staged-reused` shows `reused: true`; `pre-staged-stale` executes the command | pass |
| 5 | The command `verify` | Codes 0, 0, 0 or 10, 0 or 10; `valid` printed by `validate` | pass |
| 6 | Conformance of the plan source | Declared commands appear with provenance; a conflict is a blocker; no declaration gives an empty manifest | pass |
| 7 | Staleness | With the profile, in the mode `plan`, the critic call ends with result code 3; without it no critic call is refused | pass |
| 8 | Reads and writes from repository text | A finding names the command; the manifest entry has neither field; the command runs alone | pass |
| 9 | Mode in the snapshot | The key `verification.mode` is `plan`; the run record has no field of this feature | pass |
| 10 | No reuse with a loop layer engaged | Without a unit the result shows `reused: true`; with one the verification gate executes the command | pass |
| 11 | The stage `pre` and the hashes of the plan | A command declared `pre` is stored and staged as `prestage`; `contentHash` and the source hash equal the baseline's | pass |

<!-- quickstart-result:end -->

The quickstart passed end to end: **11 of 11 scenarios pass, 0 fail.**

Five of the eleven are carried out against the product's own modules in the
process of the test. Six are run as child `node --test` processes, because the
quickstart words those six **by test id or by suite** ("Run the parity tests of
FX-14 …", "Run CT-105-116 …", "Run the conformance suite of EP-07 …"); running
them as anything else would not be running what the quickstart asks for.

## What each scenario observed

### Scenario 1 — the three modes

`tests/parity/105/PT-105-028FR020-suite.test.ts`, the suite-level parity test
of FX-14, FX-15 and FX-16, run as one child: **exit 0, 8 tests, 7 pass, 0 fail,
1 skipped.** The skip is the reference half against the reference trees of
feature 141, which is not built; it skips with its reason and never passes (the
constitution, Principle XVII).

Inside it, over the eleven scenarios of the three families: **202 surfaces
compared, 0 results `different`**, measured against the Specstride baseline's
own bytes at `9cab15d`. And the critic transcript of a failed verification gate:
**18 phase attempts with a failed gate, 0 critic calls**, over the result codes
1, 2, 3, 10, 11 and 70 — with the control that a *passed* gate records one
call, so the 0 is not the count of a run in which nothing could be recorded.

### Scenario 2 — an invalid mode

The quickstart words this as `specstride run --verification sometimes`.
`specstride run` is the command of feature 102; the **refusal** it asks for is
this feature's, so it is carried out on the mode resolution this feature owns —
which is what the command line calls before it writes the run snapshot
(F105-FR-001, F105-FR-010).

`resolveVerificationMode({ flag: "sometimes" })` refuses with the **exit code
3** and the as-is message
`engine: --verification must be off, plan, or required (got: sometimes)`. The
component name in front is the logical one of annex X §X.8 (the baseline names
its script instead); rule N-15 binds the text after the name, and that text is
the baseline's byte for byte. All three members of the closed set are accepted,
so what was refused is the value and not the check.

### Scenario 3 — release verification

The six parity tests of release verification (FX-15), run as one child: **exit
0, 67 tests, 61 pass, 0 fail, 6 skipped** — the six reference halves of those
files. `release-verification-fails` gives the **exit code 2** and the stop
reason **`release_verification`**, compared against the baseline's own
`run_release_verification` and its `emit_run_stop`.

### Scenario 4 — commands staged before the verification gate

The three parity tests of the staged commands (FX-16), run as one child: **exit
0, 23 tests, 20 pass, 0 fail, 3 skipped**. `pre-staged-reused` shows
`reused: true` with its `reusedFrom`, and `pre-staged-stale` — the same fixture
with a dirty working tree — **executes** the command, on both sides.

### Scenario 5 — the command `verify`

The four calls the quickstart lists, through the port's `runVerify` on a
project with two phases and a `test` script:

| Call | Exit code | What was observed |
|---|---|---|
| `verify create --workdir … --specs … --output … --json-output …` | 0 | the plan is on disk |
| `verify validate --plan … --specs …` | 0 | `valid` on standard output |
| `verify run --plan … --phase 1 --evidence-output …` | 0 | the gate of phase 1 ran |
| `verify run --plan … --phase release --evidence-output …` | 0 | the release gate ran |

The quickstart allows 0 **or** 10 for the two `run` calls; both were 0 here,
because the discovered command of the fixture project passes.

### Scenario 6 — conformance of the plan source

The conformance suite of EP-07 — `declared.test.ts` (CT-105-153, this feature's
behaviour half, on the sample plan source of
`packages/testkit/src/samples/EP-07/`) and `contract.test.ts` (feature 100's
contract half) — run as one child: **exit 0, 13 tests, 13 pass, 0 fail, 0
skipped**. Declared commands appear with their provenance, a conflict is a
blocker whose command does not enter the plan, and no declaration gives an
empty manifest with the result `unchecked`.

### Scenario 7 — staleness

A project whose task list is rewritten **between the verification gate and the
critic** of one phase attempt, in the mode `plan`, run twice:

- under the `parity` profile, the critic call ends with the result code
  **3** (`invalid verification plan: verification plan is stale …`);
- outside it, **no critic call is refused**: the check is not made at all, and
  the reason the step gives is "the staleness check of the verification plan
  stays under the `parity` profile only (F105-FR-042, ruling K3); this run is
  outside it". The plan is still loaded for the step that needs it.

### Scenario 8 — reads and writes from repository text

`tests/characterization/105/CT-105-116.test.ts`, run as one child: **exit 0, 5
tests, 5 pass, 0 fail.** A verification-commands document that declares `reads`
and `writes` has them ignored with a finding that names the command; the
manifest entry carries neither field, which makes the command undeclared — and
undeclared means serial, so it runs alone.

### Scenario 9 — the mode in the run snapshot

`resolveModeInForce` with the flag `plan` gives the snapshot key
`verification.mode` the value `plan`, under the logical name
`run:<runId>:snapshot`. The fragment handed to the snapshot is
`{"verification.mode":{"value":"plan","source":2,"class":"pinned"}}` — one key
and no more. This feature writes **no field of the run record**
(`WRITES_THE_RUN_RECORD` is `false`), which is F105-FR-010.

### Scenario 10 — no reuse with a loop layer engaged

`tests/characterization/105/CT-105-133.test.ts`, run as one child: **exit 0, 5
tests, 5 pass, 0 fail.** Without a declared unit of work the staged result is
taken over and shows `reused: true`; with a loop layer engaged in the phase
attempt the verification gate takes over nothing and **executes** every command
it selected.

### Scenario 11 — the stage `pre` and the hashes of the plan

`PT-105-C-080-declared-commands` and `PT-105-C-080-ids-and-hashes`, run as one
child: **exit 0, 16 tests, 14 pass, 0 fail, 2 skipped** (the two reference
halves). A command declared `pre` is **stored and staged as `prestage`**, and
the plan's `contentHash` and its source hash equal the baseline's, computed by
the baseline's own `canonical_json`, `sha256_text` and `spec_projection_hash`.

## Prerequisites the quickstart names

| Prerequisite | State |
|---|---|
| The workspace built | yes: every test above ran from source through the loader of the workspace |
| The stubs and fixture families of feature 141 | **absent**: `packages/oracle` and `tests/parity/reference` are not built. Every reference half therefore skips with its reason and never passes; the differential half of each runs against the Specstride baseline's own bytes at `9cab15d` and is not skipped. 12 of the scenarios' 137 child tests are such skips |
| No network | yes: nothing above reaches the network, and no test of this feature calls a model or a paid service |
