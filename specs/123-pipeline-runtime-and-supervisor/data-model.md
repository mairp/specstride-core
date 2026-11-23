# Data model: Pipeline runtime and supervisor (feature 123)

Entities of the specification and the records this feature writes. Field lists of the records of
feature 100 are cited, not repeated. Logical names are those of feature 100, annex B §B.5.

| Entity | Fields, in words | Writer | Readers |
|---|---|---|---|
| Pipeline state record (`pipeline:<pipelineId>:state`) | `pipeline`, launch contract hash, `state`, `updated_at`, `stages`, `last_stage`, `exit_reason`, superseded hash | Runtime root | CLI, supervisor |
| Stage entry (inside the state record) | `status`, `started_at`, `finished_at`, `child_exit_code`, `reason`, `evidence` | Runtime root | Supervisor |
| Pipeline log (`pipeline:<pipelineId>:launcher-log`) | Every labelled line, plain | Compatibility projection | CLI, oracle, supervisor |
| Launch log (`pipeline:<pipelineId>:launch-log`) | Headers `=== launch … ===` and `=== relaunch … ===`; both streams of the launched process | The launched process; the header by the CLI | CLI, oracle |
| Report log (`pipeline:<pipelineId>:report-log`) | Every supervisor line once | Compatibility projection | Oracle, CLI |
| Launch record of the pipeline (`pipeline:<pipelineId>:harness-run`) | The as-is fields listed in spec §R.9 | Compatibility projection of the supervision record | Oracle, CLI |
| Supervision record (`launch:<launchId>:supervision`, `specstride.supervision/1`) | Cadence (`interval`, `unchanged`, `signature`), `stopRequested`, and under `relaunch.owner: supervise` the budget and the relaunches | CLI | CLI, run view |
| Launch record (`launch:<launchId>:record`, `specstride.launch/1`) | Annex B §B.7 | CLI (`launch`, `supervise launch`); root for its own relaunch | Root, CLI, doctor |
| Terminal record (`run:<runId>:terminal`, `specstride.terminal/1`) | Annex B §B.15; the root writes a synthesized one after a crash, with `retryable: false` and no blocked reason. Both tables read `retryable` and `blocked` from it | Engine; root | Root, both tables (table 1 through `supervise observe`), CLI |
| Inbox request `hold-relaunch` (`inbox:hold-relaunch`) | `hold`, optional `reason` | CLI (`supervise hold`, `release`) | Root |
| Pipeline events (`pipeline.started`, `pipeline.ended`, `launch.checked`, `digest.written`) | The fields of the event catalogue of feature 111 | Root | Event stream, compatibility projection |
| Relaunch decision (an event `supervisor.observed`) | Table id, table version, rule id, the signals read, the literal | Root; `supervise observe` under `supervise` | Event stream |
| Relaunch (an event `supervisor.relaunch`) | Attempt, maximum, remaining, reason | Root | Event stream, `supervise` |
| Relaunch budget | Maximum (0 to 5, default 2), wall-clock seconds, deadline, declared pipeline seconds, source (`declared` or `default`), remaining | Root or CLI | Supervisor |
| Observation | Status, run state, stage id and index, stage reason, detail, launcher exit, child exit, stop reason, elapsed times, anomalies; for the classifier also `blocked` and `retryable` of the terminal record | Computed by `supervise` | `supervise` |

## States

| Machine | States | Transitions written by this feature |
|---|---|---|
| Pipeline (§R.4) | `preflight` → `ready` → `running` → `completed`, `failed` or `stopped` | The runtime root |
| One stage | `running` → `completed`, `failed` or `stopped` | The runtime root |
| Run (annex E §E.2) | `starting`, `running`, `relaunching`, `failed`, `finished`, `stopped` | T4, T5, T10, T11, T12, T14, T15, T16 by the root |

## Relations

- One pipeline has one state record and one launch contract hash; a change of the hash resets the stage entries.
- One launch has one launch record and at most one supervision record; a relaunch by the root mints a new launch id and keeps the run.
- One relaunch decision has exactly one rule id of one table; a table has exactly one default row.
