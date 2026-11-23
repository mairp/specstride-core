# Data Model: Attempt planner and seams (feature 149)

Phase 1 of the plan. This feature writes no record of its own. It reads records that feature 100
names and returns values to the engine, which writes them.

## What the seams read and return

| Entity | Logical name or place | Read or returned | Defined by |
|---|---|---|---|
| History of a phase | Built from `attempt:<N>:<k>:<n>:record`, `attempt:<N>:<k>:<n>:verdict`, `phase:<N>:recovery-markers` and the ledger | Read by a planner, frozen | Below |
| Plan of the next phase attempt | Returned by `next` | Returned | Below |
| Verdict record | `attempt:<N>:<k>:<n>:verdict` | Returned by `judge`; written by the engine | Feature 100 annex E §E.1, annex B §B.5 |
| Outcome of one critic call | Returned by the call function | Read by a strategy | Below |
| Count of rejections by the critic | `run:<runId>:ledger`, namespace `core`, field `counters` | Appended through the engine | Feature 100 annex B §B.13 |
| Bump table | Product data: `contracts/bump-table.json`, in the product the constant `packages/core/src/ep18/bump-table.ts` | Read | `contracts/bump-table.json` |
| Fingerprint of the approved tree | `gate:<N>:approved`, field `treeFingerprint` | Read at phase entry | Feature 100 annex B §B.14 |

## History of a phase

| Field | Meaning | Type in words |
|---|---|---|
| `phase` | Phase number | Whole number |
| `attempts` | Per phase attempt, in the order of the ordinals: kind, outcome, verdict or none, signature of unmet criteria or none, model tier | List of records |
| `counters` | Reject count, MALFORMED streak, rejections by the critic, as the ledger holds them | Record of whole numbers |
| `markers` | The signatures recorded as diagnosed and as accelerated | Record |
| `hintExists`, `feedbackExists` | Whether a hint and feedback of the phase exist | Truth values |
| `diagnosisMade`, `accelerationDue` | Whether a diagnosis was made after the last rejection, and whether an accelerated phase attempt is due. Both are facts that the owner of the recovery cycle works out and the engine puts into the history; a planner does not work them out again | Truth values |
| `bumped` | Whether the phase was bumped | Truth value |

## Plan of the next phase attempt

| Field | Meaning | Type in words |
|---|---|---|
| `kind` | `plain`, `diagnosed`, `accelerated`, `bumped` | Member of a closed set |
| `modelTier` | The model tier of the proposer for the phase attempt | Text |
| `freshSession` | True after a bump; a new phase attempt starts a fresh session in every case | Truth value |
| `decision` | Where a table was evaluated: table id, table version, decision point, rule id, signals, choice | Record, or absent |
| `skipReason` | For a skip: `critic-model`, `quota-exhausted`, `ladder-top` | Member of a closed set, or absent |

Neither the plan nor the outcome of a critic call is written as a record, so neither has a schema
file; each has a type and a guard in the contracts package (task T004).

Validation: `kind` is `bumped` only when `decision.choice` is `bump` and the kind the recovery
cycle gave was `plain`; `skipReason` is present exactly when `decision.choice` is `skip`.

## Outcome of one critic call

| Field | Meaning |
|---|---|
| `verdict` | APPROVED, REJECTED or MALFORMED |
| `sessionId` | The session the engine minted for the call |
| `form`, `proof` | The form of the `completion` level and the result of its proof |
| `sameModelWarning` | Whether the critic-diversity warning was raised; true for the results `same-model` and `unverified` of the diversity test (field name unchanged; feature 111 owns it) |
| `usage`, `latency` | As the harness reported them, or null |

No nonce and no hash of a nonce is in it.

## Signals of the bump table

| Signal | From |
|---|---|
| `optionOn` | Configuration, `attempt.tier_bump` |
| `criticRejections` | The ledger |
| `k` | Configuration, `attempt.tier_bump_after` |
| `alreadyBumped` | The history |
| `hasHigherTier` | The model-tier ladder of the proposer's harness in the resolved registry |
| `targetIsCriticModel` | The models and efforts of the critic-class calls of the role plan: true only when the target equals one of them in model and in effort (F149-FR-005; CQ-204); a target that shares only the model gives false, and the critic-diversity warning is raised |
| `targetQuotaExhausted` | What the run recorded about the quota of the target; false where nothing is recorded |

## State of the bump of a phase

```text
not bumped ──(critic rejections < K)──────────────► not bumped
not bumped ──(≥ K, guard fails)── skip, recorded ──► not bumped   (evaluated again at the next rejection)
not bumped ──(≥ K, guards pass)── bump, recorded ──► bumped       (stays until the phase is approved or counts are reset)
bumped ─────(phase approved; next phase)───────────► not bumped, count 0
```

## Closed sets of this feature

As in the section "Closed sets" of the spec: kinds of phase attempt (row 9 of annex X §X.6),
outcomes of the bump rule, reasons of a skipped bump.
