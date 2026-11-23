# Data model: Quota, budgets and pause (feature 127)

Entities of the specification and the records this feature writes. Field lists of the records of feature 100 are cited, not repeated. Logical names are those of feature 100 annex B §B.5.

| Entity | Fields, in words | Writer | Readers |
|---|---|---|---|
| Quota classification (in memory; carried by `quota.signal`) | Class, confidence, `resetsAt` or null, source of `resetsAt`, `retryable`, rate-limit type, utilization, redacted evidence, rule id, table version | Classifier (called by the engine) | Engine |
| Pause record (`run:<runId>:pause`, `specstride.pause/1`) | Annex B §B.17: `role`, `harness`, `class`, `confidence`, `since`, `resetsAt`, `resumeAt`, `probeIndex`, `ceilingAt` | Engine | RunView, CLI, doctor, engine after a restart |
| Pause episode | Start time, kept in the spend ledger under `windows.episodeStart`; ends at the next successful call of the role | Engine | Engine |
| Spend ledger (`run:<runId>:spend` of annex B §B.5; `specstride.spend/1`, annex B §B.20) | Per role and billing mode: tokens (input, output, cache read, cache write, reasoning), real cost, notional cost, estimated cost, calls, passes with known cost, passes total; probe spend; phase attempts started; `pausedMs`; limit-window facts per harness and model tier; episode start; alert keys fired; the generation; the flag `partial` | Engine | Engine, RunView, doctor (annex B §B.5) |
| Previous generation of the ledger | The last good copy, kept beside the ledger | Engine | Engine |
| Limit-window fact | Harness, model tier, class, `resetsAt`, utilization, rate-limit type, time observed | Engine | Engine (escalation skip, headroom check of 142) |
| Fallback entry | Harness, model, auth tier, billing mode, cap, decision of the terms gate; comes from the role plan (`run:<runId>:registry`) | CLI at launch | Engine |
| Budget ceiling | Dimension, scope, limit, hard or soft; from configuration | Config | Engine |
| Alert (event `alert`) | Kind, level, role, threshold, value, limit, deduplication key | Engine | Read model, digest, doctor, host hooks |
| Events | `quota.signal`, `harness.error`, `run.paused`, `run.resumed`, `fallback.switched`, `fallback.restored`, `fallback.skipped`, `alert`, `budget.exceeded`, and `blocked` for the blocked reasons `quota-credit`, `auth`, `budget-cap`, `quota-wait-ceiling` | Engine | Sinks, RunView |

## State transitions used

| Transition | Trigger here |
|---|---|
| T6 `running` to `paused-quota` | `quota_window` with confidence `structured` or `status`, or a confirmed weaker one |
| T7 `paused-quota` to `running` | `resumeAt` reached, or a probe succeeded |
| T8 `paused-quota` to `blocked-on-human` | `pause.maxTotalMs` reached (`paused_quota_ceiling`) |
| T9 `running` to `blocked-on-human` | `quota_credit` or `auth` with no fallback left; a hard ceiling (`budget-cap`) |
| T13 to `stopping` | A stop request read during a pause |

## Rules of the ledger

| Rule | Content |
|---|---|
| Increment | A cumulative report becomes a delta per session; a record is deduplicated by `usageId` |
| Null | A value not reported is `null` and sums as unknown |
| Apart | Real, notional and estimated cost are never summed together |
| Never reset | An unreadable ledger is rebuilt from the previous generation and the events; if that fails, hard ceilings read as reached |
