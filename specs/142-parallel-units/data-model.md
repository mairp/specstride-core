# Data model: Parallel units (feature 142)

Schemas owned by feature 100 are cited and not repeated. Field names that feature 100 does not
fix are proposals of this plan.

## Entities

| Entity | Fields | Rules | Schema |
|---|---|---|---|
| Parallel plan | As feature 100, annex D §D.3 | Computed at launch; frozen with its hash; never computed again | `specstride.parallel-plan/1` |
| Candidate task (in the plan) | `id`; `scope` (list of prefixes); `scopeSource` (`consumer`, `task-text`); `checks` (per check: verdict, detail) | Every task of a phase is in exactly one group or in the serial list | part of the plan |
| Serial task (in the plan) | `id`; `reason` (the failed admission check) | — | part of the plan |
| Group (in the plan) | `ordinal`; `phase`; `tasks` in the order at launch | 2 to `workers` tasks; consecutive and admitted. `workers` is at most the value of `loop.parallel.workersMax` in force (default 4) | part of the plan |
| Verdict of the audits | Per worker: accepted, or one refusal reason | One reason per refused delta | given to the engine with `integrateGroup` |
| Delta | `paths`, each with `kind` (added, changed, deleted, mode changed) | Read through the tree-store operation `changed`; single-writer files dropped | feature 100, annex D §D.2 |
| Kept unit of work of a group | `unitId` (hash of the sorted task ids); `tasks`; `treeHash` | Bound to the fingerprint of the workspace after the merge check | ledger, namespace of the micro-loop layer |
| Counters of the layer | Groups failed per phase attempt; cycles charged; the worker count in force | Read by the layer in the view of the phase attempt. They are kept in the ledger by the engine services (feature 100, annex B §B.13); this feature defines no ledger record kind | ledger (read) |

## Decisions of the layer

| Call point of EP-04 | Decision | Directive returned |
|---|---|---|
| `contributePrompt` | The reserved-tasks block while a group waits | — |
| `betweenPasses` | A group may start | `requestPassGroup` |
| `betweenPasses`, after the group | The verdicts of the audits | `integrateGroup` |
| `betweenPasses`, after integration | Merge check passed without condition | `keep` |
| `betweenPasses`, after integration | Merge check failed or carries a condition | `repair` |
| `betweenPasses` | Two failed groups, a harness error, an empty inner check set, a report of the engine | `layerOffForAttempt` or `layerOffForRun` |
| `contributeCriticInput` | One unit per integrated group | — |
| `report` | The fields of the `[LOOP]` line, `wall-hours` and `agent-hours` included | — |

## Closed sets

In `contracts/closed-sets.json`, as the section "Closed sets" of `spec.md` lists them.
