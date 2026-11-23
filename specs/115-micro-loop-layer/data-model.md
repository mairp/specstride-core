# Data model: Micro-loop layer (feature 115)

Phase 1 of the plan. Records whose schema feature 100 owns are named with their annex and are not
repeated. Field names of records this feature owns are proposals of the plan.

## Entities

| Entity | Logical name | Owner of the schema | Writer |
|---|---|---|---|
| Check manifest | `phase:<N>:manifest` | 100, annex D §D.8 | Engine at launch |
| Task list as read at launch | `run:<runId>:task-list` | 100, annex B §B.5; the reading: feature 104 | Engine at launch; read by this layer, which stores no copy |
| Checkpoint | `feature:<slug>:outbox`, then `unit:<unitId>:checkpoint` | 115, `contracts/schemas/checkpoint.schema.json` | Proposer; moved by the engine |
| Check result | `unit:<unitId>:check:<i>` | The owner of the result conditions (feature 100, annex C §C.8); read here | Engine |
| Ledger record of the namespace `micro` | `run:<runId>:ledger` | Envelope: 100, annex B §B.13. Kinds and `data`: 115, `contracts/ledger-micro.json` | Engine, for the layer |
| Fact block | `attempt:<N>:<k>:<n>:fact-block` | 100, annex D §D.7; content owner 116 | Engine; the layer returns its rows at `contributeCriticInput` |
| Router rule table | Data of the package | Envelope: 100, annex X §X.3. Content: 115, `contracts/router-table.json` | The product |
| Tripwire record | `user:tripwire` | 100, annex B §B.18 | Runtime |
| Run record, field `loop` | `run:<runId>:record` | 100, annex E §E.2 | Runtime root |

## Checkpoint

| Field | Meaning | Rule |
|---|---|---|
| `schema` | `specstride.checkpoint/1` | Required |
| `tasks` | Task ids of the current phase, or criterion indexes | Required; at least one; each must be in the task list as read at launch |
| `note` | Free text of the proposer | Optional; 512 bytes kept; never shown to a critic-class call |
| Any other field | — | Ignored |

The file is at most 16 kilobytes. It is a claim (F115-FR-010).

## Task list as read at launch

The record `run:<runId>:task-list` is not a record of this feature. The engine writes it at
launch (feature 100, annex B §B.5). This layer reads from it, per phase, what the table names,
and writes nothing.

| What the layer reads | Meaning |
|---|---|
| The phase | Phase number |
| The task ids | Task ids of the phase in order |
| The hash | Hash of the list, by the hash that ignores checkboxes |

## Ledger records of the namespace `micro`

| Kind | Written before | `data` |
|---|---|---|
| `unit-declared` | The check of a unit starts | Task ids; the tree fingerprint at declaration; the logical name of the checkpoint |
| `check-started` | A check runs | Ordinal; inner or closing |
| `check-finished` | The result is delivered | Logical name of the check result; signature; whether delivered |
| `unit-kept` | The directive `keep` | Tree fingerprint |
| `unit-repair` | A repair pass is requested | Ordinal of the repair; session directive; model tier |
| `unit-unresolved` | The directive `unresolved` | Cause: repairs spent, or unit time |
| `command-excluded` | A command leaves the inner set | Command id; reason; scope (phase attempt or phase) |
| `escalation` | An escalated pass, or a skip | Rule id; target tier or skip reason; whether the critic-diversity warning was raised |
| `closing-check` | A closing check, or a return to work | Ordinal of the return |
| `disengaged` | The directive `layerOffForAttempt` or `layerOffForRun` | Cause: `caps`, `integrity`, `check-error`, `no-check`, `single-unit`, `layer-error`, `breach` (N-111-1); fallback reason of annex X §X.6 row 59 where one applies (`no-check`, `single-unit`) |
| `integrity` | An integrity event or a breach is recorded | Kind |

Counters, carried in every record of the namespace as they stand after it: cycles used; per task
id repairs and escalations; escalations of the phase attempt; unresolved units; consecutive
`unchecked` units; returns after the closing check.

## The life of a unit

```text
                 checkpoint accepted
  (none) ───────────────────────────────▶ declared
                                             │ check
                 ┌───────────────────────────┼───────────────────────────┐
                 ▼                           ▼                           ▼
               kept                       repair 1                   unchecked
        (all exit 0, no             (failed, tainted or          (no command to run)
         condition)                  cached; repairs left)
                                             │ check
                                 ┌───────────┴───────────┐
                                 ▼                       ▼
                               kept                   repair 2
                                              (fresh session; next model
                                               tier when the router says so)
                                                         │ check
                                             ┌───────────┴───────────┐
                                             ▼                       ▼
                                           kept                  unresolved
```

A unit also becomes `unresolved` when its time cap is reached. A unit of an integrated group of
the layer of parallel units enters at `kept` or at `repair 1`, without a checkpoint.

## Resume states

| Last record of the namespace | State | On resume |
|---|---|---|
| None since the pass started | A pass was running | The pass is lost as in the classic loop; no cycle is counted |
| `unit-declared` | Checkpoint accepted, check not started | Run the check on the current tree; a differing fingerprint marks the declaration `superseded` |
| `check-started` | A check was running | Run it again; the interrupted run is `interrupted` |
| `check-finished`, not delivered | Result not delivered | Deliver it when the fingerprint matches; otherwise run the check again |
| `disengaged` | The layer is off for the phase attempt | It stays off |

## States of the layer in a phase attempt

| State | Meaning | Leaves by |
|---|---|---|
| `inert` | The layer is on and no checkpoint was accepted | The first accepted checkpoint |
| `engaged` | At least one checkpoint was accepted | `layerOffForAttempt`, `layerOffForRun`, the end of the phase attempt |
| `off-for-attempt` | The classic loop carries on | The end of the phase attempt |
| `off-for-run` | A breach, or a fallback decided at launch | The end of the run |

These are states of the layer in its ledger namespace. They are no run states.

## Validation rules

| Rule | Requirement |
|---|---|
| A checkpoint names only tasks of the current phase | F115-FR-011 |
| A unit is kept only when every command exits 0 and no result carries a condition | F115-FR-016 |
| The repair count of a unit is the highest among its tasks | F115-FR-022 |
| Escalations are inside the repairs | F115-FR-034 |
| An escalation is skipped as `critic-collision` only when the rung equals a critic-class call in model and in effort | F115-FR-034 |
| The layer writes no task list; it reads `run:<runId>:task-list` | F115-FR-012 |
| Exactly one row of the router table fires per vector of signals | F115-FR-033 |
| At `contributeCriticInput` the layer returns the rows of the fact block and nothing else | F115-FR-002 |
| A writer never writes a value outside a closed set | `spec.md`, "Closed sets" |
