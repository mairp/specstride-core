# Data model: Roles (feature 124, after the split)

Records are described in words. The schema of the resolved registry is feature 100's
(`specstride.registry/1`, annex C §C.6); this file says what this feature puts into its fields.
Fields that are not in annex C are additive inside the major and are reported to the orchestrator.
The entries of the field `harnesses` are read as annex C §C.6 describes them.

## Role plan entry

The fields of annex C §C.6, and:

| Field | Meaning | Rule |
|---|---|---|
| `source` | For the proposer: `flag`, `environment`, `configuration`, `default` | F124-FR-024 |
| `model` | Model id, or null for the harness's own model | F124-FR-027 |
| `kind` | `primary`, `fallback`, `runner-up` | F124-FR-033, F124-FR-041 |
| `regate` | True for a fallback: the terms gate is asked again when it is used | F124-FR-032 |
| `terms` | The decision and the row it rests on | F124-FR-032 |

## Critic pick (`criticPick`)

| Field | Meaning |
|---|---|
| `step` | `configured`, `gateway`, `discovered`, `default-model-tier` |
| `automatic` | Whether the pick was automatic |
| `harness`, `model`, `state`, `form` | What was picked |
| `window`, `windowSource` | Tokens and source |
| `cap` | The spending cap of a metered pick, or null |
| `diversity` | `diverse`, `same-provider`, `same-model`, `unverified` |
| `sameModelWarning` | Whether the critic-diversity warning was raised: true for the results `same-model` and `unverified` of `diversity`, false for the others. The field keeps its name, as the event `critic.selected` of the catalogue carries it |
| `runnersUp` | Ranked list, each with harness, model and rank keys |
| `notQualified` | Per candidate the first condition that failed |
| `passedOver` | Per pass-over: candidate, reason, time of the decision |
| `table` | Id and version of the ranking table; rule ids of the decisions |

## Validation rules

| Rule | Requirement |
|---|---|
| No value of the record is a secret value | F100-FR-052 |
| No informational entry of the field `harnesses` appears in the plan | F124-FR-023 |
| The proposer entry has a source of the closed set | F124-FR-024 |
| No entry with unknown terms appears in the plan unless the consumer named it | F124-FR-036 |
| No unverified harness of kind `cli` is an automatic pick | F124-FR-039 |
| An automatic pick of cost class `metered` has a cap | F124-FR-042 |
| The record carries `schema` with the value `specstride.registry/1` | F100-FR-048 |
