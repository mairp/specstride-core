# Quickstart: validating the parity oracle (feature 141)

How to see that the feature works. Commands are given as the plan names them; the package does
not exist before implementation. Schemas and lists: `contracts/`. Entities: `data-model.md`.

## Prerequisites

| For | Needed |
|---|---|
| Every test tier | Node 22 or later; `npm install` in the workspace |
| The reference test tier and the capture job | Linux; bash 4 or later, `flock`, `setsid`, GNU `stat` and `date`; Python 3.10 to 3.13; local clones of the two baselines, named by `ORACLE_REF_SPECSTRIDE` and `ORACLE_REF_MOL`. The clones may be on any branch and in any state: only the pinned commits are read |
| The platform test tier | A macOS runner |
| Never | A harness, a login, a key, a network |

## Test tiers

| Test tier | Command | What it proves | Missing prerequisite |
|---|---|---|---|
| Hermetic | `npm test -w @specstride/oracle` and `npm run oracle -- --tier hermetic` | The oracle's own tests; the port against the golden captures | — |
| Reference | `npm run oracle -- --tier reference` | The live differential run, both suites, the exercise map | A skip with its reason; at the release check a skip blocks |
| Platform | `npm run oracle -- --tier platform` | The port on macOS against the Linux captures and the per-OS expectations | As above |

## Scenarios of validation

| # | Do | Expect | Requirement |
|---|---|---|---|
| 1 | `python3 specs/141-parity-oracle/contracts/tools/generate.py --check` | `checked: 40 families, 39 active, …`, exit 0 | the data agrees with `spec.md` |
| 2 | `npm run oracle -- fetch` | Two trees in scratch, each equal to its pinned tree hash, read-only. `git status` and `git rev-parse HEAD` in both clones give what they gave before | F141-FR-001, F141-FR-002; F141-SC-007 |
| 3 | `npm run oracle -- run FX-01/three-phases --sides reference,reference` | Every surface `equal` | F141-FR-044 |
| 4 | The same with `--seed-difference stdout` | `stdout` is `different`, the other surfaces `equal` | F141-FR-044; F141-SC-004 |
| 5 | Scenario 3 twice, then compare the two normalized captures | Equal | F141-SC-005 |
| 6 | `npm run oracle -- probe` | The Specstride reference runs three phases with one rejection against the stubs, exit 0, the same tree twice | F141-FR-044 |
| 7 | `npm run oracle -- run FX-38/installed-then-restart --sides reference,reference` | The transcript of the installer holds the as-is argument list; a receipt exists under its logical name; a second pass ran | F141-FR-014 |
| 8 | Add a waiver that matches nothing; run the suite | The suite fails and names the waiver | F141-FR-022 |
| 9 | Run the suite on a set of fixtures in which no value of one rule occurs (the self-test gives the normalizer a rule table with one rule that can match nothing) | The suite fails and names the rule that replaced nothing | F141-FR-020 |
| 10 | Run any scenario with a stub that connects to a public address | The run fails at the network guard | F141-FR-038; F141-SC-006 |
| 11 | `npm run oracle -- check-declarations` on a test that cites FX-37 | Refused: the family is retired | F141-FR-013, F141-FR-027 |
| 12 | `npm run oracle -- claims` with a test that claims an item its fixture did not execute | Fails and names the test and the item | F141-FR-032 |
| 13 | `npm run oracle -- suite2` on a port build whose layer writes one unnamed field | Fails; the report says "possible breach of gate integrity" | F141-FR-040 |
| 14 | `npm run oracle -- release-check` with one surface `different`, or one skip, or no macOS result | "blocked", with the cause | F141-FR-026, F141-FR-036 |
| 15 | `python3 docs/ecosystem/check-traceability.py` | `PASSED`; no line that starts with `[h` names feature 141 | F141-FR-034 |

## What "done" looks like

| Measure | Value |
|---|---|
| Results `different` on the build to be released | 0 |
| Claims that pass the exercise map | 100 per cent |
| Differences outside the layer allowlist | 0, with equal counters |
| Rules, waivers and allowlist entries that match nothing | 0 |
| Connections beyond loopback | 0 |
| Changes in the source repositories | 0 |
| macOS | One passing run of the platform test tier on the build |
