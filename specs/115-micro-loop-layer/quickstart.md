# Quickstart: validating the micro-loop layer (feature 115)

How to see that the feature works. Commands are given as the plan names them; the packages do
not exist before implementation. Data and schemas: `contracts/`. Entities: `data-model.md`.

## Prerequisites

| For | Needed |
|---|---|
| Every test | Node 22 or later; `npm install` in the workspace; `git` |
| Tests of units and checks | The stub kit of feature 141 (critic stub, verification command stubs) and the test proposer of this feature, which writes checkpoints. Fingerprints and the builder of the fact block, as the engine offers them (feature 100, annex D §D.1); until they exist, test doubles of those two services |
| Inertness | The second suite of feature 141 |
| Experiments X5 to X11, X12 part (iv), and the live part of X0 | Harnesses with a login or a key of the person who runs them. **Paid.** Each run is logged with its cost. No build job runs them |
| Never in a test or a build job | A model call, a login, a network connection beyond loopback |

## Scenarios of validation

| # | Do | Expect | Requirement |
|---|---|---|---|
| 1 | `npm test -w @specstride/layer-micro` | Every `CT-115-*` of the layer passes | F115-SC-010 |
| 2 | `npm run conformance -- ep06` | Golden decision per row of the shipped table; for 10,000 generated vectors of signals exactly one row fires per decision point; the sample decision point adds two rows with no core file changed | F115-FR-033 |
| 4 | Run the fixture "four tasks, two commands" with the test proposer | Four kept units, four cycles, no pass counted towards the pass limit; the rows of four units returned at `contributeCriticInput`; no commit and no reference in the repository of the fixture | F115-FR-016, F115-FR-017, F115-FR-027 |
| 5 | Run the fixture "always fails" | Three proposals, the third in a fresh session; the unit `unresolved`; the tree untouched by the runtime; after the second such unit the layer is off for the phase attempt and the run goes on | F115-FR-022, F115-FR-025 |
| 8 | For each resume state, stop the engine in that state and resume | The action of the table of `data-model.md`; counts continue | F115-FR-031; F115-SC-009 |
| 9 | `npm run oracle -- suite2` | 0 differences outside the layer allowlist; equal counters | F115-SC-006 |
| 10 | Run any fixture in verification mode `plan` | The classic loop; the announcement `gate-not-executing` | F115-FR-004 |
| 11 | Run the descriptor-only fixture with a harness that is only declared | The phase completes at L1; `protection=detect` | F115-SC-005 |
| 12 | Run a test build in which an inner event changes the reject count, then `specstride doctor` | The breach `outer-counter-changed`; the tripwire record exists; the next launch prints `strategy=classic reason=tripwire` | F115-FR-039, F115-FR-041 |
| 13 | `specstride tripwire clear`, twice | Exit 0, then exit 1 | F115-FR-041 |
| 14 | Run any fixture with the layer on, in default output | One `[LOOP]` line before the digest, with the fourteen keys in order | F115-FR-038 |
| 15 | The same under the `parity` profile | No `[LOOP]` line | F115-FR-038 |
| 16 | `python3 docs/ecosystem/check-traceability.py` | No line that starts with `[h` names feature 115 | — |
| 17 | Run the fixture "always fails" on a ladder whose next rung has the model of the critic at another effort, then at the same effort | First: the second repair runs on that rung and the critic-diversity warning is recorded. Second: the escalation is skipped with `critic-collision` and the repair runs on the base model tier | F115-FR-034 |
| 18 | After scenario 4, list the files of the control plane | `run:<runId>:task-list` exists once, written by the engine; no other file holds a task list | F115-FR-012 |

The numbers 3, 6 and 7 are not used: those scenarios moved with requirement group G-B at the split.

### Record of the runs (T136, T137 — Linux, 2026-10-06)

Scenario 9 (T136, F115-SC-006): `npm run oracle -- suite2` was run against the layer over every
active family of the second suite of feature 141. Result: **suite2: OK — no difference outside
the layer allowlist; counters equal**. For every fixture and every verification mode:
0 differences outside the layer allowlist, equal counters, the subset property holds, and the
classic fallback was announced. Allowlist entries: 7; not reachable (not entries): DV-018, DV-052.
The macOS runner part of T137 is `unverified` — see `verification-record.md`.

## Experiments

| Experiment | Command | Cost | Pass mark |
|---|---|---|---|
| X0, stub part | `npm run experiment -- x0 --stubs` | None | 100 per cent of passes accounted for |
| X0, live part | `npm run experiment -- x0 --live 20` | Paid: 20 live passes, 5 of them killed on purpose | Totals within 2 per cent |
| X1 | `npm run experiment -- x1` | None | A share is reported by two readers |
| X12 (i) to (iii) | `npm run experiment -- x12 --stubs` | None | (i) no difference beyond the named layer fields; (ii) every seeded tampering recorded as its condition; (iii) reported |
| X5, X6 | `npm run experiment -- x5`, `x6` | Paid: about 100 hours alive and about 1,342 dollars notional per arm | F115-SC-001, F115-SC-002 |
| X7 to X11, the arm for the model-tier bump | `npm run experiment -- x7` … | Paid, smaller | As F115-FR-066 |
| X12 (iv) | `npm run experiment -- x12 --critic` | Paid: live critic calls | Detection falls by no more than 5 points |

## What "done" looks like

| Measure | Value |
|---|---|
| Integrity rules owned here with a passing test | 28 of 28 |
| Differences outside the layer allowlist | 0 |
| Exit codes, stop reasons and run states that exist only with the layer on | 0 |
| Breaches found by the invariant check on any run of the build | 0 |
| Experiment X0 | Passed before the first pair counts |
