# Data model: Run view and status

Fields are described in words. The schemas of the records that feature 100 owns are cited, not restated. Field names below are proposals; they become the schema of `specstride.view/1` in `@specstride/contracts`.

## The view (`specstride.view/1`, annex G §G.6)

Written by nobody as a source of truth. Produced by `project`; cached by the runtime at `run:<runId>:view`; printed by `status --json`. See `contracts/run-view.md` for the full table. Groups:

| Group | Content | Requirement |
|---|---|---|
| `schema`, `now` | The schema id; the time of the projection, the only wall-clock field | F129-FR-006, F129-FR-007 |
| Identity | Run id, workspace id, feature slug | F129-FR-010 |
| `cursor` | File, byte offset, last `seq` | F129-FR-003 |
| State | The written state or `none`, since when, the transition number; the display state `st` | F129-FR-010, F129-FR-012 |
| Conditions | `liveness`; `dead`; `stale` with its reason; `launch-abandoned` | F129-FR-012 to F129-FR-014 |
| Position | Current phase and total, phase attempt ordinal, pass ordinal, reject count, MALFORMED count, units done and declared, elapsed seconds | F129-FR-010 |
| Strategy | `classic` or `micro`, micro level, reason a layer is off | F129-FR-023 |
| Phases, cards, lanes | The list of phases with evidence, approved and feedback; one card per phase with its lane and rule id; lanes in order with card ids | F129-FR-011, F129-FR-016 |
| Attention items | Kind, key, since, text, need, next command, and fields of the kind | F129-FR-017 to F129-FR-021 |
| Budget rows | Scope, role, cost class, spent, tokens, cap, fraction, level, notional, quota | F129-FR-020 |
| Processes | Holders of the run token by class, with a count of those cut | F129-FR-021 |
| Supervision | Suggested seconds until the next reading; unchanged count; relaunch budget where the supervise owner keeps one | F129-FR-027 |
| Activity | Latest tool; observability mode and reason; telemetry deliveries | F129-FR-011 |
| Timeline | The newest rows, with a count of the rows left out | F129-FR-011 |
| Parallel | Present only with parallel units on: workers, groups, group failures, refusals, fallback reason, wall hours, agent hours | F129-FR-022 |
| Diagnostics | Skipped lines, gaps of `seq`, majors seen and accepted, torn last line, fields cut, fields dropped by the redactor | F129-FR-004, F129-FR-005, F129-FR-009 |
| Signature | The change signature and its 8-character token | F129-FR-030 |

## Observations supplied by the caller

| Observation | Made by | Used for |
|---|---|---|
| Lease observation | The caller reads the lease and calls `probe` of EP-13: the result, `heartbeatAt`, `validUntil`, the owner record, the launch nonce | Liveness, `dead`, `stale`, `validUntil` of the line |
| Launch observation | The newest launch record: `launchId`, `createdAt`, `outcome`, `refusal` | `launch-abandoned`; a refused resume |
| Supervision observation | The supervision record: `interval`, `unchanged`, `relaunchBudget` | `next=`; the relaunch budget |
| Process observation | The registry `run:<runId>:procs` and a search of the process table for the run token: kind, class, process id | `orphan-processes` |
| Handshake limit | The configured limit in seconds | `launch-abandoned`, a run in `starting` without a lease |
| Redaction function | The redactor of feature 111, with the recorded version of the pattern set | Free text |
| Table evaluator | The one evaluator of feature 100 | Lanes |
| Canonical hasher | The hasher of feature 104 | The change signature |

## Records this feature reads

| Record | Logical name | Owner | Used for |
|---|---|---|---|
| Event file | `run:<runId>:events` | 111 | Everything event-derived |
| Run record | `run:<runId>:record` | 100; 122 writes | State, strategy, caps, relaunch owner, parallel option |
| Terminal record | `run:<runId>:terminal` | 101 | The blocked field, the stop reason, `synthesized` |
| Pause record | `run:<runId>:pause` | 127 | The quota pause item |
| Lease | `run:<runId>:lease` | 122 | Liveness and the expiry |
| Launch record | `launch:<launchId>:record` | 122 | `launch-abandoned`; a refused resume |
| Supervision record | `launch:<launchId>:supervision` | 123 | The suggested seconds |
| Process registry | `run:<runId>:procs` | 122 | Orphan processes |

## Records this feature writes the content of

| Record | Logical name | Writer | Note |
|---|---|---|---|
| Cached view | `run:<runId>:view` | Runtime | Disposable; off under `parity` |
| Precomputed status line | `run:<runId>:status-line` | Runtime | One line with `validUntil`; off under `parity` |
| Pointer to the line of the current run | `workspace:current:status-line` | Runtime | Names `run:<runId>:status-line` of the current run, at a place that depends on the workspace only (annex B §B.5, F100-FR-229) |
