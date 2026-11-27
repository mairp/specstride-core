# Evals of spec 154 — before any stage, and at every stage

**Written**: 2026-11-25, before the run. Every eval names its input, its pass mark and where its
result is recorded. No eval promises a saving (F154-FR-008). The model routes are those of
`specstride.yaml` and `~/.config/specstride/config.yaml`: proposer `dsh:zai/glm-5.3-flash` at
effort max, critic `dsh:compass-gpt5-high/gpt-5`.

## Reconciliation with the evals that already exist

| Existing | What it is | How 154 uses it |
|---|---|---|
| `packages/oracle/` (feature 141): fixtures FX-01 to FX-19, `suite2/`, the golden and the waivers | The parity oracle: the compatibility projection must be byte-identical on oracle fixtures with every switch off, and the second suite runs every fixture with the layer on | E3 before phase 1; the inertness tasks of `tasks.md` Phase 1 (T013 to T015) add FX-154 to it |
| `packages/layer-parallel/data/fx-par.json` (FX-PAR-S, spec 142) | The layer's fixture set, pinned by a data test | E4; the trial of P2 runs it |
| `packages/cli/test/fixtures/loop-speed/recorded-152/` (PR #40) | The recorded read of feature 152's events with expected counts | E2 beside `recorded-153/` (a task of Phase 4) |
| `/root/specstride-hermes-evals/evals/suites/specstride-run.suite.json` | Routing evals of the hermes host skill: a prompt must load the right skill | Not a gate of this run. Reconciled by `specstride-154.suite.json` beside it: the requests a person makes about this feature route to the same skills |
| `contracts/fixtures-154.json` and `contracts/rule-tables/` | The six fixtures, the door fixture and the trial of this spec; the rule-id sets | Created by the tasks of Phases 1 to 16; the trial of each switch (T165 of Phase 18) is the eval that turns a switch on |

## Before any stage

| Id | Eval | Pass mark | Result |
|---|---|---|---|
| E1 | Both model routes answer through the adapter's own overlay (`packages/adapter-dsh/test/probe-routes.ts`: `buildOverlay`, the headless profile, one task) | status 0 and the answer `OK`, for the proposer and the critic | **pass, 2026-11-25**: proposer 10.9 s, critic 9.3 s |
| E2 | The recorded read of 153 reproduces the counts of the feature input (`specstride report` on the frozen events) | 336 attempts, 29 approvals, 274 of 386 in-pass checks failed, 28 groups `repair` | the row exists since PR #40; the frozen copy `recorded-153/` is a task of Phase 4 |
| E3 | The parity oracle over the repository with every switch of this feature off (`packages/oracle` tests, serial) | 0 failures; the projection byte-identical on the oracle fixtures | **pass, 2026-11-25**: 385 of 385 |
| E4 | The existing tests of the layer (`packages/layer-parallel/test/*.test.ts`, serial) | all pass | **pass, 2026-11-25**: 41 of 41 on Node v22.23.2 |
| E5 | The contracts of the run validate and promote; the launchers pass `--dry-run` | `validated`, exit 0 | **pass, 2026-11-25** (product route and `mixture-of-loops`), after `52cb20e5` |

## At every stage

| Id | Eval | Pass mark |
|---|---|---|
| S1 | The gate of the phase: the repository's own suite, `npm test`, as the engine declares it from `package.json` (`checkCommandOf`) and runs it through the check runner | green, once, on the merged tree; a check against a changed set reads `tainted`, never passed |
| S2 | The critic: a fresh session, its own nonce, no tools, the evidence of the phase only | a verdict bound to its nonce; an approval is a signed record |
| S3 | The inertness tests of `tasks.md` Phase 1 after every later phase | green: no file, event or call of this feature under `parity`, and none with the switches off |
| S4 | The vocabulary test of F142-FR-066 over the fixtures of the phase | 0 new words in any critic prompt |
| S5 | A stop, a relaunch or a resume at the phase's checkpoint | counts survive; nothing lands during a stop |

## After the implementation: the trials

Each switch turns on only after its trial (`scripts/trial.mjs`, a task of Phase 4) passes
TRI-1 to TRI-3 of `plan.md` and a person reads the record under `trials/` (CQ-154-15 A). The
first case of every trial is the engine replay of feature 153's 28 groups. The records are the
evals the owner reads; none of them is a default.

## Ceilings of this run

Every configurable ceiling is off, as the owner asked on 2026-11-25: `loop.maxRejects`,
`loop.maxIter` and `loop.maxWallMin` at a large safe integer (a value of 0 falls back to the
default, so 0 is not "unlimited"), `verification.timeLimit.enforce` false, no `budget.run.*`
key, and the proposer's breakers `SPECSTRIDE_PROPOSER_MAX_ERRORS`, `SPECSTRIDE_PROPOSER_MAX_NOPROGRESS`
and `SPECSTRIDE_PROPOSER_TIMEOUT_SEC` at large values. What stays, because the constitution makes
it non-removable and the engine enforces it: the terms gate, the launch checks (integrity, lock,
stale sources), and the quota pause, which spends nothing (XVI).
