# Quickstart: validating feature 106

A validation guide, not an implementation. Run these after the package exists. All commands use the fixture trees of the oracle; none calls a paid API.

## Prerequisites

Node 22 or later; the workspace installed with `npm install`; the oracle's reference trees present (feature 141).

## Scenarios

| # | Scenario | Command | Expected |
|---|---|---|---|
| 1 | Show changes nothing | `specstride learn` on the fixture of FX-29 `show` | Suggestion lines, evaluation report, exit 0; learning files identical before and after |
| 2 | No telemetry | `specstride learn` on `advise-no-telemetry` | `learn: no telemetry for any phase` on standard error, exit 1 |
| 3 | Apply, then revert | `learn --apply --phase 3`, then `learn --revert <id>` | One `apply` and one `revert` entry; the value returns; exit 0 |
| 4 | Sample floor and quarantine | `learn --apply` on `below-sample-floor`, then on `quarantined` | Exit 3 and exit 4; nothing written |
| 5 | Off | `learn --off` after applies on two phases | One `revert` entry for each key whose latest decision is an apply (two here); the note about `off` in the environment |
| 6 | Binding | Derive a launch contract with `--learning-mode apply`; change one byte in the bound prefix; validate | Exit 23; an append after the prefix is not refused |
| 7 | Shell cannot set the mode | Export `SPECSTRIDE_LEARNING=apply`; run a pipeline whose stage declares none (FX-35 `106-learning-exported`) | The stage runs as `off`: no learning event, the bracket off; the doctor reports the shadowed value |
| 8 | Selection | `supervise learning --request <text>` with a token, a refusal, an apply phrase, a suggest phrase and none | `[MOL-LEARNING]` with the sources `token`, `refusal`, `prose`, `prose`, `default`; exit 0 |
| 9 | Retrospective | After a run, `supervise retro --run-dir <pipeline run>` | One file under the retrospective name; suggestions marked `(not run)`; exit 0 |
| 10 | Inert | A fixture run with `off` and with `suggest` (FX-01 `106-learning-suggest`) | No difference outside what F106-FR-039 lists: `learning.observed`, the bracket mark of the pass limit, the learning stream, files and lines |
| 11 | Contention | A run and `learn --apply` at once, 1,000 rounds | No lost or torn line |
| 12 | Evaluation after a phase | A run with `suggest` and decisions on two phases; phase 1 is approved | Only the decisions of phase 1 are evaluated; the lines are in the engine log |
| 13 | After a revert | `learn --apply --phase 3` twice, then `learn --revert <second id>`, then a run with `apply` | `learn` shows the first value as current; the run uses the default for phase 3, with the arm `baseline` |

Success criteria F106-SC-001 to F106-SC-010 are measured by these scenarios and the tests of `tasks.md`.
