# Quickstart results: feature 108 (Reverse specification)

**Task**: T030 · **Covers**: F108-FR-001 to F108-FR-034 · **Date**: 2026-10-02 ·
**System**: Linux 7.0.14-15-pve, Node.js 22.23.2 · **macOS**: `unverified`
(`tests/characterization/108/macos.md`).

The six scenarios of `specs/108-reverse/quickstart.md` were run. The run is
`tests/characterization/108/quickstart.test.ts`, which also holds THIS record
to account: a scenario whose row disappears, or whose row claims a pass the run
did not produce, fails that test.

Commands are driven through the package's own entry points
(`wrapper.runReverse`, `reversePlan.plan`, `guard.runGuard`) rather than
through a shell, because the CLI front door belongs to feature 100 and is not
built here; the arguments are the ones the quickstart writes. The engine is a
stub that records its calls, and the inventory is the stub of
`tests/parity/108/harness.ts` (F140-FR-015), because the verb `reverse
inventory` belongs to feature 140.

## Results

| # | Scenario | Requirement | Result | What was observed |
|---|---|---|---|---|
| 1 | `specstride reverse --dry-run <fixture>` | F108-FR-005 | **pass** | Exit 0. The heading `specstride reverse — dry run (no LLM call, nothing launched)`, every labelled line of F108-FR-005 (`source`, `inventory`, `languages`, `frameworks`, `constitution`, `output dir`, `tasks mode`, `driver`, `commands`), the `phases:` heading, `  orchestrator (not executed):` and the engine command prefixed `SPECSTRIDE_GIT_COMMITS=off`. The engine stub recorded **no call**, and the submitter of a run request threw where it was reachable at all. |
| 2 | `specstride reverse <fixture>` with the stub engine | F108-FR-007 | **pass** | Exit 0 and **exactly one** engine call. Its flags are `--workdir`, `--specs`, `--spec-format`, `--feature`, `--verification-commands`, `--test-plan`, `--generate-tests`, `--set`, in that order; `--workdir` carries the source; `--set loop.gitCommits=off` sets the commit switch off at the rank of a flag (F108-FR-008). The engine ran with the source as its working directory and `SPECSTRIDE_GIT_COMMITS=off` in its environment. Standard output opens with `reverse: launching <the shell-quoted command>`, printed before the start. |
| 3 | the same with `--out` at the source root, outside it, in `.git`, in `.specify`, non-empty | F108-FR-025 | **pass** | Five refusals, each exit 3 with its own as-is message (`--out cannot be the source root itself; …`, `--out must be inside the source tree …`, `--out cannot be inside the project's .git directory: …`, `--out cannot be inside .specify/ (the run never touches it): …`, `--out already exists and is not empty: …`). For every one of the five: no plan was made, the inventory was never asked (the recorder held zero calls), and the engine was never reached. |
| 4 | change one file of the source, then `reverse guard` | F108-FR-028, F108-FR-031 | **pass** | Exit 3. One problem, `changed: src/index.ts`, and the two lines `guard: changed: src/index.ts` and `guard: FAILED — 1 change(s) outside specs/001-as-is-fixture and the state dir`, byte for byte. |
| 5 | a source larger than the total limit, `reverse plan` | F108-FR-018 | **pass** | `oversize` is `true` in the plan JSON. Eight phases: one unit phase per inventory unit **first**, in the inventory's order, numbered contiguously from 1 and titled `Investigate unit <unit> (1<letter>)`, then the five phases of a plain run. |
| 6 | `reverse --detach <fixture>` from a host shell, end the session | F108-FR-009 | **skip, with its reason** | Not run and not faked. The scenario ends a LIVE host session and then reads the run's state with `status`; no live host exists in this checkout, and a live-host probe is out of band (the owner's ruling of 2026-09-30). The mechanism that keeps the run alive is feature 122's, whose spike has not landed. A skip is never read as a pass (the constitution, principle XVII). The **hermetic half** was run: `--detach` makes a run request of kind `engine` and starts no foreground process. What stays `unverified` is recorded in `specs/108-reverse/verification-record.md` (T010). |

## Summary

| Result | Scenarios |
|---|---|
| pass | 1, 2, 3, 4, 5 |
| skip, with its reason | 6 (live host; out of band) |
| fail | none |

## What this record does not claim

- It claims nothing about macOS: every macOS statement of this feature stays
  `unverified` (T032, `tests/characterization/108/macos.md`).
- It claims no comparison with feature 141's golden captures. The parity route
  of every FX-30 scenario is recorded in
  `tests/characterization/108/fx30-exits.md`, where all 41 are `waived`.
- Scenario 6's live half is `unverified`, never a pass.
