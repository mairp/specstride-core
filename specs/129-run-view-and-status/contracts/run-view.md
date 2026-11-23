# The view record, `specstride.view/1`

Field names are proposals. Types are in words. "Source" is where the value comes from: `event` (the fold), `file` (a named state file), `obs` (an observation of the caller). A value that no source states is null. Fields are added only in an additive way inside the major.

| Field | Meaning | Type in words | Source | Requirement |
|---|---|---|---|---|
| `schema` | `specstride.view/1` | Text | constant | F129-FR-007 |
| `now` | Time of the projection | Timestamp, UTC | obs | F129-FR-006 |
| `runId`, `workspaceId`, `feature` | Identity | Text | file (run record) | F129-FR-010 |
| `cursor` | File, byte offset and last `seq` after the last complete line read | Record | event | F129-FR-003 |
| `state` | A written state of annex E §E.2, or `none` | Member of a closed set | file (run record) | F129-FR-010 |
| `stateSince`, `transition` | Time and number of the last transition | Timestamp, text | file | F129-FR-010 |
| `display` | The `st` value: the written state, or `dead`, `stale`, `launch-abandoned` or `unknown` where a derived condition holds | Text | derived | F129-FR-027 |
| `liveness` | `alive`, `dead`, `foreign`, `unknown`, `not-applicable` | Member of a closed set | obs (lease) | F129-FR-012 |
| `conditions.dead` | The owner is gone | Truth value | derived | F129-FR-012 |
| `conditions.stale` | Null, or the reason `heartbeat-and-events-old` or `event-major-out-of-range`, with the major found and the range accepted for the second | Record or null | derived | F129-FR-013 |
| `conditions.launchAbandoned` | A launch without an outcome and without a lease past the handshake limit | Truth value | derived | F129-FR-014 |
| `launch` | Launch id, reason, outcome, engine start ordinal | Record | event, obs | F129-FR-014 |
| `progress.phase`, `progress.phases` | Current phase, number of phases | Whole numbers or null | event | F129-FR-010 |
| `progress.phaseAttempt`, `progress.pass` | Ordinals | Whole numbers or null | event | F129-FR-010 |
| `progress.rejects`, `progress.malformed` | Counts of the current phase; they survive a resume | Whole numbers | event | F129-FR-010 |
| `progress.units` | Units of work done and declared for the current phase attempt | Record or null | event | F129-FR-010 |
| `progress.elapsedSeconds` | From the first launch to `now`, or to the end | Whole number | event, obs | F129-FR-010 |
| `strategy` | `classic` or `micro`, the micro level, the reason a layer is off | Record | file (run record), event | F129-FR-023 |
| `phases[]` | Number, title or null, evidence exists, approved, feedback exists | List of records | event | F129-FR-011 |
| `cards[]` | Card id, feature, phase, lane, rule id of the lane, flags (`dead`, `stale`, `yielded`) | List of records | derived | F129-FR-016 |
| `lanes[]` | The eight lanes in order, each with the ids of its cards | List of records | derived | F129-FR-016 |
| `laneTable` | Id and version of the table used | Record | constant | F129-FR-016 |
| `attention[]` | See `lane-and-attention.md` | List of records | derived | F129-FR-017 |
| `budget[]` | Scope, role, cost class, spent, tokens, cap, fraction, level, notional, quota | List of records | event, file (run record caps) | F129-FR-020 |
| `processes` | Holders of the run token: kind, class, process id; count of entries cut | Record | obs | F129-FR-021 |
| `supervision` | Suggested seconds until the next reading; unchanged count; relaunch budget | Record or null | obs | F129-FR-027 |
| `activity` | Latest tool with a summary; observability mode and reason | Record | event | F129-FR-011 |
| `telemetry[]` | Sink and delivery state | List of records | event | F129-FR-011 |
| `timeline` | The newest rows (`seq`, time, kind, text) and the number of rows left out | Record | event | F129-FR-011 |
| `parallel` | Present only with parallel units on: workers, groups, group failures, refusals, fallback reason, wall hours, agent hours | Record | file (run record), event | F129-FR-022 |
| `diagnostics` | Skipped lines, gaps of `seq`, majors seen and accepted, torn last line, fields cut, fields dropped | Record | event | F129-FR-004, F129-FR-005, F129-FR-009 |
| `signature` | The change signature record and its 8-character token | Record, text | derived | F129-FR-030 |
| `stream` | The marks of the fold: the first and the newest event folded (`seq`, time, type), and the times of `run.started` and `run.ended` | Record | event | F129-FR-010, F129-FR-013 |
| `settled` | The values `project` settled from the state files and the observations that the derivation re-reads: whether the heartbeat of the lease is late, and the age in seconds after which the newest event counts as old (`status.staleEventSec`) | Record | file, obs | F129-FR-002, F129-FR-013 |

Collections are bounded. The limits (timeline rows: `status.timelineRows`; attention items 50; budget rows 64; listed processes 50) are recorded in the schema; a collection that was cut has a field with the number of entries left out.

Text fields: the need of an attention item, `oneLine`, a title, a timeline text, the summary of the latest tool, a reason of a refusal. Each is redacted, has no control character, and has a size cap of 240 bytes, except the line of an attention item printed by `status`, which has 120 (F129-FR-025).

The rows `stream` and `settled` were added by task T021 (2026-10-01). It holds no new fact: it is the place in the
record where the fold keeps the marks that `project` needs to recompute the age of the newest event
(F129-FR-013) and the elapsed time (F129-FR-010) from a view alone. `settled` is the other half of the same mechanism: F129-FR-002 requires that the fields that come
from the state files and the observations be recomputed by `project` at every call and NEVER by
`reduce`, so `project` settles them once and the derivation re-reads them from the record. Without
the two rows, folding `reduce` event by event could not give the same view as one batch
(F129-FR-002). It is an additive field
inside the major (F129-FR-007).
