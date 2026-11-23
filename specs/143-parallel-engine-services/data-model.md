# Data model: Parallel engine services (feature 143)

Schemas owned by feature 100 are cited and not repeated. Field names that feature 100 does not
fix are proposals of this plan.

## Entities

| Entity | Fields | Rules | Schema |
|---|---|---|---|
| Group | `groupId`; `ordinal`; `phase`; `attemptId`; `tasks` in the order at launch; `baseTree`; `workers`; `outcome` (closed, failed) | Given by the directive `requestPassGroup` | ledger records |
| Worker | `workerId` (opaque); `task`; `scope`; `tree` (path with one opaque component); `token` (opaque); `passOrdinal` (group ordinal, task position, restart index); `restartUsed`; `outcome` | One process at a time; one restart at most; its tree is a repository of its own under the worker root, and `release` removes it with its temporary directory and writes the worker root only (annex D §D.2; F143-FR-027; CQ-237) | ledger records; process registry |
| Snapshot | `treeId`; `kind` (base, final) | Final snapshots use the ignore rules of the base; a snapshot leaves the store with `sweep`, never with `release` (F143-FR-027; CQ-237) | the store |
| Delta | `paths`, each with `kind` (added, changed, deleted, mode changed) | The task list is dropped; seed and ignored paths never inside | result of `changed` |
| Composed tree | `treeId`; accepted workers in the order of the tasks | Path sets pairwise disjoint | result of `compose` |
| Counters | Groups started and failed per phase attempt; per worker passes started and restarts used; cycles spent | Continue after resume and relaunch; reset by the reset flag | ledger |

## Ledger records of the namespace `parallel`

Envelope: feature 100, annex B §B.13. `data` per kind:

| Kind | Carries `workerId` | `data` |
|---|---|---|
| `group_planned` | No | `groupId`, `tasks`, hash of the plan |
| `group_started` | No | `baseTree`, fingerprint of the workspace |
| `worker_started` | Yes | `task`, `passId`, `passOrdinal`, fingerprint of the tree, pid and start time |
| `worker_ended` | Yes | End cause, final `treeId`, fingerprint, usage or `unknown` |
| `group_barrier` | No | Fingerprint of the workspace; per worker the fingerprint taken again |
| `audit_done` | No | Per worker: accepted, or the refusal reason as the loop layer gave it |
| `merge_done` | No | Composed `treeId`; accepted workers in the order of the tasks |
| `apply_started` | No | The paths to write, each with base and composed object id |
| `applied` | No | Fingerprint of the workspace |
| `ticks_applied` | No | The task ids |
| `merge_check_started` | No | Fingerprint; hash of the check manifest |
| `merge_check_finished` | No | Fingerprint; result per command; conditions |
| `group_closed` | No | Outcome of the group; per worker its outcome; trees removed |

The kind `merge_done` keeps its name from R29; it records a composition.

## States of a group

```text
group_planned → group_started → worker_started* → worker_ended* → group_barrier
   → audit_done → merge_done → apply_started → applied → ticks_applied
   → merge_check_started → merge_check_finished → group_closed
```

| Last record at a start of the engine | Action (F143-FR-025) |
|---|---|
| `group_planned` | Start the group |
| `group_started`, `worker_started` | End recorded processes after the identity check; restart or `killed` |
| `worker_ended` | Verify the tree id |
| `group_barrier`, `audit_done`, `merge_done` | Verify the workspace against the fingerprint at group start; repeat from the audits |
| `apply_started` | Verify every path and the rest of the workspace; repeat the application, or stop writing |
| `applied` | Write the ticks |
| `ticks_applied`, `merge_check_started` | Run the merge check |
| `merge_check_finished` | Close the group |

## States of a worker

| From | Event | To |
|---|---|---|
| planned | Process started | running |
| running | Valid checkpoint, processes ended | ended |
| running | Time limit or watchdog | `killed` |
| running | Quota signal in the group | `paused` |
| running | Interruption it did not cause, restart unused | running (restart index 1) |
| ended | Accepted by the audits, no overlap | `integrated` |
| ended | Not accepted, overlap, tree changed after its end | `refused` |
| `paused` | Resume | running, new pass |

## Closed sets

In `contracts/closed-sets.json`, as the section "Closed sets" of `spec.md` lists them: rows 62,
64 and 184 of annex X §X.6, each closed by design.
