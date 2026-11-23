# Content of the fact block

Schema: `specstride.fact-block/1`, feature 100, annex D §D.7. Content owner after the split:
this feature. Slot and escaping in the critic prompt: the owner that annex D §D.7 names.

## Present only when

At least one unit of work was declared in the phase attempt, or an integrity rule that is
independent of a loop layer found a fact (F116-FR-016).

## Holds

| Field of annex D §D.7 | Content | Requirement |
|---|---|---|
| `manifestHash`, `commands` | Hash of the check manifest; its commands by id | F116-FR-017 |
| `treeFingerprint` | Fingerprint of the tree at the phase gate, once | F116-FR-017 |
| `units` | Per unit: id; tasks named, headed as the proposer's declaration; per command the exit result and, in fields of their own, `tainted`, `flaky` with both observed results, `superseded` or `current`, `cached` | F116-FR-017, F116-FR-018 |
| `unnamedTasks` | Tasks of the phase that no unit named | F116-FR-018 |
| `notice` | The fixed sentence: a result is evidence about the tree and not about a task | F116-FR-018 |
| `protected` | Paths changed since phase entry and which were authorised; protected paths changed since launch in phases already approved; suppression markers added and removed, per file | F116-FR-021 |
| `integrity` | Integrity events by kind, without counts | F116-FR-021 |
| `facts` | Further facts from their closed set | F116-FR-021 |
| `excluded` | Commands excluded from the inner set, each with the reason | F116-FR-017 |

## Never holds

| Excluded | Requirement |
|---|---|
| Counts of cycles, repairs, retries or failures | F116-FR-019 |
| The order in which units were declared | F116-FR-019 |
| Times and durations | F116-FR-019 |
| Output of a command | F116-FR-019 |
| Earlier results | F116-FR-019 |
| A fingerprint value per row | F116-FR-019 |
| Model tiers, sessions, routing decisions | F116-FR-019 |
| Whether a result came from the closing check | F116-FR-019 |
| The note of a checkpoint | F116-FR-019 |
| Anything about groups or workers | F116-FR-019 |
| Counts of tests | F116-FR-011 |

The only counts in the block are those of suppression markers.

## Order

Units and tasks in the order of the tasks at launch; commands in manifest order. Never the order
of events (F116-FR-020).
