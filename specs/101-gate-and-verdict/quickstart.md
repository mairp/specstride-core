# Quickstart: validating feature 101

How to see that the phase gate works, once the tasks are done. Commands are those of the
workspace that feature 100 creates; names of scripts are proposals of this plan.

## Prerequisites

| Need | For |
|---|---|
| Node.js 22 or later; `npm install` at the root of the workspace | Everything |
| The version-control tool of the project | FX-27 and the state of the tree around an accelerated phase attempt |
| The reference tree of the Specstride baseline, made by the oracle (feature 141) | The live differential run. Without it the parity tests compare with the golden captures |

A missing prerequisite is reported as a skip with its reason, never as a pass.

## 1. The phase gate under the `parity` profile

```text
npm run test:parity -- --feature 101
```

Expected: every test `PT-101-*` reports `equal`, or `waived (DV-029)` for the content of the
approval record and for the scenario `FX-13/planted-approval-marker`. No result `different`.

| Scenario | What to look at |
|---|---|
| `FX-01/three-phases` | Exit 0; three approvals; tasks ticked; the end event with `all_approved` |
| `FX-02/reject-approve` | The archive of the first phase attempt; ordinal 2 approved |
| `FX-03/reject-limit` | Exit 2, `max_rejects`; the last phase attempt not archived; the halt banner |
| `FX-04/oscillation-halt` | Exit 2, `gate_oscillation`; archived before the halt |
| `FX-05/malformed-limit` | Exit 1, `critic_unavailable`; the three details of MALFORMED in the feedback |
| `FX-06/http-error` | The failed call scored MALFORMED |
| `FX-07/missing-key` | Exit 1, `critic_unavailable`, after three phase attempts scored MALFORMED, as on the reference (F101-FR-010, CQ-187) |
| `FX-07/phase-not-found` | Exit 3, `critic_config`, in the first phase attempt; no count changes |
| `FX-08/new-signature-hint`, `FX-08/accelerated-attempt` | One diagnosis per signature; one accelerated phase attempt |
| `FX-15/release-verification-fails` | Exit 2, `release_verification` |
| `FX-27/commit-per-phase` | One commit per approved phase, the as-is message, no push |

## 2. The Lisa side

```text
npm run test:characterization -- --feature 101
```

Expected: `CT-101-1` to `CT-101-12` pass.

## 3. Own tests

```text
npm run test:own -- --feature 101
```

| Test | Expected |
|---|---|
| CT-101-14 | A forged, wrongly signed, missing or re-bound approval record counts as not approved; an integrity event names what failed; a planted marker approves nothing |
| CT-101-16 | Every exit path leaves a terminal record that validates against `specstride.terminal/1` |
| CT-101-17 | With the owner of the lease lost, no phase gate runs and the engine exits 6 |
| CT-101-29 | Outside the `parity` profile the prompts of the recovery cycle hold outside text as data |
| CT-101-30 | Outside the `parity` profile a missing credential of the critic halts with exit 3 before the first call; under it the run ends with exit 1 at the MALFORMED limit |
| CT-101-31 | The diagnostician runs in the form of its entry of the role plan, with the proof recorded; the critic-diversity warning is recorded and blocks nothing |
| CT-101-32 | Only a reply with exactly one whole line that carries the exact nonce gives a verdict, over generated replies |
| CT-101-33 | A canary secret in a reply reaches no line, no field of an event and no span |

## 4. The table of halts

```text
npm run test:tables -- --table gate-halts
```

Expected: for every row of `contracts/gate-halts.json` a fixture ends the engine in that way, and
exit code, stop reason and `retryable` of the terminal record equal the row. `retryable` is false
in every row, the row of exit 0 included. The scenarios of FX-07 are mapped one by one.

## 5. Reading a run by hand

| Question | Command of CLI protocol 1 |
|---|---|
| Which phases are approved? | `specstride phases` |
| Why was the phase rejected? | `specstride feedback`, `specstride verdicts` |
| How did the run end? | `specstride status --json`: exit code, stop reason, `retryable` |

References: [spec.md](spec.md), [data-model.md](data-model.md), [contracts/](contracts/README.md).
