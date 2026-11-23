# Lanes and attention items

## The lane table (`specstride.table/1`), evaluated by the one table evaluator of annex X §X.3

Point: `lane`. Signals read: `phaseApproved`, `isCurrentPhase`, `runState`, `dead`, `criticCallOpen`, `verificationOpen`, `passOpen`, `unitOpen`, `workerPassOpen`. Choice set: the eight lanes. The first matching row fires; the default row is L-08; the rule id is stored on the card.

| Rule | When | Lane |
|---|---|---|
| L-01 | `phaseApproved` | `approved` |
| L-02 | `isCurrentPhase` and `runState` = `failed` | `failed` |
| L-03 | `isCurrentPhase` and (`runState` in `blocked-on-human`, `stopped`, or `dead`) | `blocked` |
| L-04 | `isCurrentPhase` and `runState` = `paused-quota` | `paused` |
| L-05 | `criticCallOpen` | `reviewing` |
| L-06 | `verificationOpen` | `verifying` |
| L-07 | `passOpen` or `unitOpen` or `workerPassOpen` | `proposing` |
| L-08 | default | `queued` |

The states `created`, `starting`, `relaunching` and `stopping` have no row of their own; a card falls through to the row that its open pairs give. A cycle of a micro-loop owns no lane.

## Attention items

An item has: `kind`, `key`, `since`, `oneLine`, `need`, `next`, and fields of its kind. `next` comes from the fixed table and never from text of the run. Items are listed in the order of the table, then by `since`.

| # | Kind | Raised when | Key | Fields of the kind | `next` |
|---|---|---|---|---|---|
| 1 | `blocked-on-human` | The run rests blocked and the reason is not `source-changed` | Blocked reason | `reason` (`declared-block`, `quota-credit`, `auth`, `budget-cap`, `quota-wait-ceiling`), `question`, `options` | `resume` |
| 2 | `source-changed` | The reason is `source-changed`, or the newest launch record was refused for a changed source | File | `file` (`spec`, `plan`, `tasks`) | `resume --accept-source-change` |
| 3 | `dead-run` | The condition `dead` | Run id | `survivors` (count) | `resume` |
| 4 | `launch-abandoned` | The condition `launch-abandoned` | Launch id | none | `launch` |
| 5 | `quota-pause` | The state is `paused-quota` and a pause record exists | Role | `role`, `harness`, `class`, `since`, `resumeAt`, `ceilingAt` | `wait` |
| 6 | `budget-alert` | A budget row has level `warn`, `loud` or `over` | Kind, role, threshold | `role`, `level`, `fraction` | `status --json` |
| 7 | `stale-run` | The condition `stale` | Reason | `reason` | `doctor` |
| 8 | `orphan-processes` | Holders of the run token of `owned` class and no engine | Run id | `count`, `kinds` | `resume` |
| 9 | `unknown-state` | The run record names a state outside the ten | The value | `value` | `doctor` |

For an item `need` is text taken from the terminal record or the event `blocked`, redacted and cut. For `source-changed` it is the file name and the need to accept the change or restore the file.
