# Contract: event journal (v2 records and v1 `events.jsonl` lines)

**Surface**: every call to `Journal.emit()` writes a v2 `LisaEvent` record. For types that have a v1 mapping, it also writes a v1 line. Consumers are:

- `lisa events`
- `GET /events/stream` (SSE)
- `lisa.events.subscribe@v1`
- the dashboard trajectory

Each section cites its source in an evidence comment. This describes current behavior only.

## Where the lines land

<!-- evidence: packages/cli/src/journal-sink.ts:14-28, packages/cli/src/commands/run.ts:503-506, packages/cli/src/layout.ts:77-94, packages/cli/src/commands/serve-services.ts:100-105 | kind=observed | confidence=0.85 | contradicts=none | validation=verified -->

- **Run journal**:
  - A CLI run builds `FileEventSink(layout.eventsPath, layout.eventsPath)`.
  - Both the v2 JSON records and the v1 lines are therefore appended to the same `<featureDir>/runs/<runId>/events.jsonl`, one complete line per write.
  - `.lisa/events.jsonl` and `.lisa/run.log` are relative symlinks to the active run's files.
- **Daemon journal**: the `lisa serve` daemon uses `.lisa/daemon-journal.jsonl`.

## v2 record

<!-- evidence: packages/core/src/events/journal.ts:26-95 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Envelope fields**:

- `id`, `type`, `version` (default 1), `occurredAt`, `jobId`
- `taskId?`, `planRevision`
- `traceId?`, `spanId?`, `causationId?`, `correlationId`
- `idempotencyKey?`
- `payload`

**Types** (`LISA_EVENT_TYPES`), grouped by prefix:

- **job**: `job.created`, `job.started`, `job.paused`, `job.completed`, `job.failed`, `job.budget_exceeded`
- **specification and reverse**: `specification.normalized`, `reverse_spec.generated`
- **plan**: `plan.generated`, `plan.approval_requested`, `plan.approved`, `plan.revised`
- **critic**: `critic.protocol_repair`, `critic.approved`, `critic.rejected`
- **proposer**: `proposer.context_built`, `proposer.context_invalid`, `proposer.context_overflow`, `proposer.no_progress`, `proposer.transient_retry`
- **task**: `task.ready`, `task.started`, `task.completed`, `task.failed`
- **approval**: `approval.requested`, `approval.decided`
- **integration**: `integration.started`, `integration.completed`
- **platform**:
  - `schedule.fired`, `hook.blocked`, `scheduler.decision`, `mode.changed`
  - `memory.promoted`, `memory.retired`
  - `plugin.enabled`, `plugin.disabled`, `plugin.failed`
  - `run.imported`

## v1 line

<!-- evidence: packages/core/src/events/journal.ts:100-145 | kind=observed | confidence=0.90 | contradicts=none | validation=verified -->

**Field order**: `ts`, `time`, `event`, then the optional `run_id`, `task` and `backend`, then the payload keys. Unset optional fields are omitted.

**v1 `event` names**, grouped by emitter:

- **lifecycle**:
  - run: `run_start`, `run_end`, `run_stop`
  - phase: `phase_start`, `phase_done`, `reject`, `attempt_archived`
  - repository: `git_checkpoint`, `gates_migrated`, `progress_swept`
  - proposer iterations: `proposer_start`, `iter_start`, `iter_done`
  - evidence: `evidence_present`, `evidence_written`
- **critic**: `critic_start`, `grounding_gap`, `verdict`
- **agent tap**: `agent_init`, `agent_tool`, `agent_text`, `agent_result`, `evidence_writing`

## Mapping and delivery rules

<!-- evidence: packages/core/src/events/journal.ts:170-200, packages/core/src/events/journal.ts:345-378 | kind=observed | confidence=0.85 | contradicts=README.md:6-6 | validation=verified -->

- A v2 type that is not in the mapping table is v2-only, and no v1 line is written for it.
- `critic.approved` and `critic.rejected` map to the v1 `verdict` event, carrying a `result` field.
- The `job.*` halt types map to `run_stop`, with a `reason`.
- Emission is best-effort, and sink errors are swallowed.
- The README calls the journal "CloudEvents-compatible". The envelope has no `specversion` or `source` field, so that claim is recorded as a contradiction.
