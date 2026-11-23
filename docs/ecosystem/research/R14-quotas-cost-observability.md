# R14 — Quotas, cost and observability

Accessed 2026-09-29. Tags: `verified-doc`, `verified-local`, `inferred`, `unverified`. Origins are written as `028 FR-nnn`, `011 FR-nnn`, `002 FR-nnn`. Schema requirement ids in this report are `EV-nn`; working names for terms (run, launch, attempt, pass) are placeholders that R8 owns.

## Prior art consulted

| Source | Used for | Reused / extended / contradicted |
|---|---|---|
| `BRIEF-COMMON.md`, `prompts/specstride-ecosystem.md` §0–§2 (decisions 8, 11, 17, 21–23), row R14 | Governing text | Followed |
| R5 (Claude), R6 (Codex, OpenRouter, z.ai), R7 (Gemini, Copilot), R9 (pi, dsh, prime), R10 (opencode) — Findings and Matrix rows | Per-harness signals | Consolidated (section "Quota signal per harness"). One correction below (R5's Q8 is right; a summarising fetch of the SDK page disagrees with it and is wrong) |
| R21 "Telemetry gaps for R14" and `A5-run-time-evidence.md` §7 | The 20 gaps | Each becomes an `EV-` requirement (section "Schema requirements") |
| R13 "What the UI needs from the event schema" | UI contract | Mapped one-to-one (section "UI needs") |
| R11 F-12, F-13, T-32, T-33, R-3 | Redaction | Adopted: content capture off by default, single ingress redactor, fail-closed |
| R3 (Q2, F2 rows on `StopFailure`, `Notification`, `asyncRewake`), R4 (F14, host table) | Alert delivery | Adopted; R3 owns mechanics |
| `/root/specstride` at `9cab15d` (`git archive` to `/tmp/specstride-research/R14/`): `proposer.sh`, `orchestrator.sh`, `lib/agent_stream.py`, `lib/error_breaker.py`, `lib/ralph_otel_ship.py`, `lib/telemetry_delivery.py`; `old/028-as-is-specstride/contracts/{events,telemetry-http}.md` | As-is path and vocabulary | Extended; the as-is contracts say their own event list is incomplete, and a grep of emitters gave the list in Appendix A (R18 owns the inventory) |
| `/root/mixture-of-loops` at `9c88f86`: `references/derivation.md:117-132`, `scripts/contract_lib.py:77-80`, `scripts/supervisor_lib.py:962-1058` | Relaunch classifier | Read; explains the current quota path |
| `/root/lisa/packages/otel/src/{tracer,metrics,otlp,loki}.ts`, `core/src/events/{journal,delivery}.ts`, `scheduler/src/budgets.ts` | Lisa envelope, span names, metrics, budgets | Reconciled |
| `/root/specstride-otel-prompts` (`936afea`), `/root/dsh-trace-otel` (`lib/tracing.js`, README) | Prompt spans, nesting, OpenInference | Reconciled |
| Constitution Principle XI (`.specify/memory/constitution.md:294-304`) | Byte-identity, `null` not invented, `missing_terminal` | Applied |

## Questions answered

**Q1. Usage-window and rate-limit semantics per provider, and detection.** Table in "Quota signal per harness". Short answer: Claude gives a structured, pre-emptive stream event; z.ai and OpenRouter give structured HTTP codes and headers; pi, prime and dsh give in-band error text carrying the provider's message; Codex, Gemini CLI, Copilot and opencode give no confirmed structured signal, so their adapters need a text/status classifier and a stall watchdog, and are marked unverified until probed.

**Q2. Cross-provider cost model.** One `Usage` record (section "Cost model"): input, output, cache-read, cache-write, reasoning tokens, `costUsd` or `null`, a `billing` mode, and an explicit `cumulative` flag. Cost is never computed from a price table by default; a consumer-declared rate table may produce a separately labelled `estimated` figure that is never summed with reported cost.

**Q3. Pause, resume, fallback, and telling a quota error from another proposer error.** Section "Pause, resume and fallback". Today there is no quota handling at all: a quota failure is an `is_error` terminal counted by the consecutive-error breaker.

**Q4. Telemetry gaps to requirements.** Twenty gaps become `EV-01` to `EV-20`; further requirements `EV-21` to `EV-34` come from quota, UI and redaction needs.

**Q5. Budget alerts for the two auth modes and how they reach the consumer.** Section "Budget alerts". The engine is the only source; hooks, digest, status and doctor are readers.

**Q6. One event schema, OTel mapping, compatibility projection.** Sections "The event schema", "OTel mapping", "Compatibility projection".

## Findings

### F-A. Today's path (as-is)

| # | Claim | Tag | Evidence |
|---|---|---|---|
| A1 | Specstride has no quota, rate-limit or 429 handling in product code: grep for `quota|429|rate.limit|usage limit|hit your` over `*.sh` and non-test `lib/*.py` at `9cab15d` returns nothing | verified-local | `git archive 9cab15d` scratch tree; `grep -rn -i` |
| A2 | The Claude stream adapter turns any `result.is_error` into `terminal.reason_code = "provider_error"` with the provider's text in `reason`; nothing separates quota from other provider errors | verified-local | `lib/agent_stream.py:172-190` (`_terminal`) |
| A3 | The proposer counts a pass whose last `agent_result` has `is_error` as a consecutive error; at `SPECSTRIDE_PROPOSER_MAX_ERRORS` (default 2) it emits `run_stop reason=proposer_consecutive_errors` and exits 7 | verified-local | `proposer.sh:119-121`, `:2325-2333` |
| A4 | The orchestrator maps proposer exit 7 to its own `E_BUDGET` (= 4) and emits the same `run_stop` reason | verified-local | `orchestrator.sh:33`, `:1909-1921` |
| A5 | mixture-of-loops treats exit 4 with `run_stop.reason` in `RETRYABLE_STOP_REASONS = ("wall_budget", "proposer_consecutive_errors")` as a relaunchable transient, within a budget of at most 5 relaunches (default 2) | verified-local | `contract_lib.py:77-80`, `:49-50`; `supervisor_lib.py:1034-1058`; `derivation.md:117-132` |
| A6 | Consequence: a 5-hour or weekly window exhaustion is counted as two errors in two passes, exit 4, relaunched immediately, fails again, and burns the relaunch budget in minutes. It then stops with `budget-exhausted`. No hours-long wait exists. The reference run had 0 quota waits (prompt §0), so this path was never exercised on real evidence | inferred | A2 to A5; A5 §7 item 11 says no quota event occurred |
| A7 | Two other budgets also tick during a pause and would fire: the iteration counter (`MAX_ITER`, exit 4 `proposer_max_iter`) and the wall budget (`wall_budget`, `orchestrator.sh:1775`). A pause design must exclude paused time from both | verified-local | `proposer.sh:2365` (`exit 4` after the loop), `orchestrator.sh:1775` |
| A8 | Kill classes exist: `hard_cap` is a budget kill with its own counter and exit 10; `repeat_stall`, `progress_stall`, `idle_timeout` are agent errors. The same split (a signal that is neither a rejection nor an agent error) is the model for quota | verified-local | `lib/error_breaker.py:29-45`, `proposer.sh:119-130` |
| A9 | `agent_result` carries `cost_usd`, `duration_ms`, `num_turns`, input/output/cache tokens, taken from `result.total_cost_usd` and `usage` | verified-local | `lib/agent_stream.py:172-185`, `:486-497` |

### F-B. Signals per harness (consolidated; facts from the cited reports, each tag inherited)

| # | Claim | Tag | Evidence |
|---|---|---|---|
| B1 | Claude: `rate_limit_event` carries `rate_limit_info.status` (`allowed`, `allowed_warning`, `rejected`), `resetsAt` (number), `rateLimitType` (`five_hour`, `seven_day`, `seven_day_opus`, `seven_day_sonnet`, `seven_day_overage_included`, `overage`), `utilization`, `surpassedThreshold`, overage fields, `errorCode: "credits_required"`; documented "for claude's web app subscription users". I re-read the type file | verified-local | `/tmp/specstride-research/R5/sdk/package/sdk.d.ts:5567-5602`; R5 F23, F24 |
| B2 | A summarising fetch of the SDK reference page returned a different, wrong shape (`type: "rate_limit"`, `requests_per_minute`, ISO `resetsAt`). It contradicts the type file and R5. The type file, which ships with the pinned SDK, is authoritative; the adapter must be tested against captured real events | verified-doc / conflict | https://code.claude.com/docs/en/agent-sdk/typescript (summarised fetch, 2026-09-29) vs B1 |
| B3 | Claude: `system/api_retry` (`attempt`, `max_retries`, `retry_delay_ms`, `error_status`, `error` in `rate_limit`, `overloaded`, `billing_error`, `authentication_failed`, `server_error`); the CLI retries internally, so this is a transient signal, not a pause trigger | verified-doc | R5 Q8, F26 |
| B4 | Claude: final `result` has `is_error`, `subtype` (`error_during_execution`, `error_max_budget_usd`, `error_max_turns`); message text `You've hit your session limit · resets 3:45pm`, `weekly limit`, `Opus limit`, `Sonnet limit`; `Credit balance is too low`; 529 "is not your usage limit and doesn't count against your quota" | verified-doc | R5 Q8, F27 (https://code.claude.com/docs/en/errors) |
| B5 | Claude cost fields: `total_cost_usd` is cumulative across turns in streaming sessions ("read the latest result rather than summing"), an "estimate, not a billing statement"; top-level `usage` covers the main loop only and excludes subagents; `modelUsage` is the per-model breakdown to prefer | verified-local | `sdk.d.ts:5616-5626` |
| B6 | Codex: subscription is a 5-hour window plus a weekly cap; `exec --json` events `thread.started`, `turn.started`, `turn.completed` (with `usage.input_tokens`, `cached_input_tokens`, `output_tokens`), `turn.failed`, `item.*`, `error`. What appears on a limit is not documented; I re-fetched the non-interactive page and it does not say | verified-doc / unverified | R6 F2, F6; https://learn.chatgpt.com/docs/non-interactive-mode 2026-09-29 |
| B7 | OpenRouter: 429 with `X-RateLimit-Limit/Remaining/Reset` only on OpenRouter-generated 429s, `Retry-After` on 429/503/402, 402 insufficient credits, `GET /api/v1/key` returns limit, remaining, usage | verified-doc | R6 |
| B8 | z.ai: HTTP 429 with body codes 1302 (request rate), 1305 (overload), 1308 (usage limit, reset time), 1310 (weekly/monthly exhausted), 1309 (plan expired) | verified-doc | R6 |
| B9 | Gemini CLI: typed `TerminalQuotaError` and `RetryableQuotaError` with `retryDelayMs` in source; what reaches the JSON `error` object or exit code 1 is unverified; exit 53 is the turn limit, not quota | verified-doc / unverified | R7 F5, Q6 |
| B10 | Copilot: AI-credit billing; `--max-ai-credits` soft cap; the JSONL event schema, `-p` exit codes and the rate-limit output are undocumented | unverified | R7 F14 |
| B11 | opencode: `error` record `name: APIError`, `data.statusCode`, `data.isRetryable`, `data.message`, `responseHeaders`, rc 1; open bugs where a 429 leaves `run` hanging (#8203) so a terminal record may never arrive; `step_finish` carries `tokens` and `cost`, with cost 0 for custom providers without configured cost | verified-doc (issue titles) / inferred | R10 Q8, F9, F10 |
| B12 | pi/prime: provider error is an assistant message with `stopReason: "error"` and `errorMessage`, preceded by `auto_retry_start/end`; a server-requested delay above `retry.provider.maxRetryDelayMs` (default 60 000) fails at once with the provider text (for example "quota will reset after 5h"). Prime exits 0 on a provider error; pi's exit code is unverified | verified-local | R9 F13–F15; `pi/docs/settings.md:138-147` |
| B13 | dsh: error codes `QUOTA`, `RATE_LIMIT`, `CONTEXT_WINDOW_EXCEEDED`, `INVALID_CREDENTIAL`; headless writes `dsh: <CODE>: <message>` to stderr and exits 1; no tokens or cost on stdout; today's critic notes some failures land on stdout, so scan both | verified-local | R9 F11, F13 |
| B14 | dsh does record tokens per model step, but only through the trace plugin: `llm.token_count.prompt|completion|total` plus cache read/write and reasoning | verified-local | `/root/dsh-trace-otel/lib/tracing.js:419-424` |
| B15 | No harness offers a remaining-allowance query; with a subscription the only trigger is the provider's limit signal (plus Claude's advance `allowed_warning`) | inferred | R9 F15; R5 |
| B16 | In the 989 dsh/prime proposer passes in the population, no token or cost field was ever recorded | verified-local | R21 Matrix rows note (`aggregate.py`) |

### F-C. Observability sources (as-is)

| # | Claim | Tag | Evidence |
|---|---|---|---|
| C1 | Specstride events: `{"ts":"<epoch.nanos>","time":ISO,"event":name,[run_id,task,backend,feature,trace_id],…}`; the bash emitter writes every value as a string; Python emitters (`critic.py`, `learn.py`) write typed values and drop `None` | verified-local | `028 contracts/events.md` (Record shape sections) |
| C2 | Telemetry-http is outbound only: Loki push and OTLP `/v1/logs|metrics|traces`, both off by default; `telemetry_delivery` records never ship to the sink they describe | verified-local | `028 contracts/telemetry-http.md`; `lib/telemetry_delivery.py:1-40` |
| C3 | Specstride OTLP metrics are `ralph.cost_usd`, `ralph.tokens` (attrs `model`, `type`), `ralph.errors`, `ralph.tool_use`, `ralph.gate`, plus duration and counts | verified-local | `lib/ralph_otel_ship.py:17-23` |
| C4 | Spans are reconstructed at ship time from paired flat events (`OPENERS`/`CLOSERS` tables: run, phase, attempt, iter, verification, critic, yield, long_job) and a per-run state file; trace id is `SPECSTRIDE_TRACE_ID` or `sha256("specstride:"+run_id)[:32]`; service `specstride`, scope `specstride.trace` | verified-local | `/root/specstride-otel-prompts/lib/ralph_otel_spans.py:1-100` |
| C5 | Prompt work (`936afea`): `input.value` plus `specstride.prompt.{path,sha256,bytes}` on attempt/critic spans, redacted, capped at 256 KiB; no separate switch (content whenever traces are on); `traceparent(run_id, scope)` for child agents | verified-local | `ralph_otel_spans.py:22-33`; R11 F-13 |
| C6 | dsh-trace-otel emits OpenInference spans `dsh.session` (AGENT), `dsh.turn` (CHAIN), `dsh.llm` (LLM), `dsh.tool` (TOOL); parent from `TRACEPARENT`; content cap 256 KiB; kill switch `DSH_TRACE_OTEL_DISABLED` | verified-local | `/root/dsh-trace-otel/README.md` |
| C7 | Lisa envelope `LisaEvent` = `id` (ULID), `type`, `version`, `occurredAt`, `jobId`, `taskId`, `planRevision`, `traceId`, `spanId`, `causationId`, `correlationId`, `idempotencyKey`, `payload`; 40 event types; every `emit()` also writes a v1-compatible line via a table-driven mapping (`V1_V2_MAPPING`); v2-only events map to `null` and are simply not shown to old consumers | verified-local | `packages/core/src/events/journal.ts:26-100`, `delivery.ts:40-95` |
| C8 | Lisa otel: 15 pinned span names `lisa.<area>.<op>`, hand-built OTLP/HTTP+JSON with no SDK, best-effort, delta-temporality metrics for six families (jobs by state, phase durations, reject rates, tokens and cost, queue depth, approval latency); never constructed by any run (R1 B2) | verified-local | `tracer.ts:85-101`, `metrics.ts:1-25`; R1 B2, RL-OTEL-01..06 |
| C9 | Lisa budgets: four ceilings (tokens, cost, wall-clock minutes, attempts), checked only at safe boundaries, distinct `BUDGET_EXCEEDED` state, resumable, durable usage ledger with atomic write | verified-local | `packages/scheduler/src/budgets.ts:1-60` |

## Quota signal per harness (input for the matrix column)

Classification target for every adapter: `QuotaClass` in {`quota_window`, `quota_credit`, `rate_limit_transient`, `overload`, `auth`, `context_window`, `network`, `provider_other`, `agent_failure`, `budget_cap`}. Only `quota_window` pauses; `quota_credit` blocks (no clock will refill it); everything else keeps its own path.

| Harness / provider | Window semantics | Advance warning | Limit signal (trigger) | Reset time | Transient vs quota |
|---|---|---|---|---|---|
| Claude (subscription) | Rolling 5-hour, weekly, weekly per model family, overage credits (B1) | Yes: `rate_limit_event.status=allowed_warning` with `utilization` and `surpassedThreshold` | `rate_limit_event.status=rejected`, then `result.is_error` with the limit text | `resetsAt` (epoch, structured); text `resets 3:45pm` only as a fallback (timezone ambiguous) | `api_retry.error=rate_limit` is internal retry; `overloaded`/529 is not quota; `billing_error` and `Credit balance is too low` are `quota_credit` |
| Claude (API key) | Per-minute rate limits and spend limits, no plan window | No `rate_limit_event` (documented for subscription users) | `api_retry.error=rate_limit`, final `result` `API Error: Request rejected (429)`; own cap `error_max_budget_usd` | 429 `retry-after` if surfaced; else unknown | 429 short delay is transient |
| Codex (ChatGPT sign-in) | 5-hour plus weekly, token-metered (secondary sources) | None known | Unverified: probably `turn.failed`/`error` event text | Text ("Try again in …") | Classifier by text until probed |
| Codex (API key) | OpenAI account limits | None | HTTP 429 in an `error` event | Header if surfaced | 429 vs `insufficient_quota` body |
| OpenRouter | Credits; free-model per-minute and daily counts | `GET /api/v1/key` remaining | 402 (credits), 429 | `X-RateLimit-Reset`, `Retry-After` | 402 is `quota_credit`; 429 is `rate_limit_transient` unless the daily free cap |
| z.ai | Coding plan: credits per 5 h and per week; pay-as-you-go otherwise | None | 429 with code 1308 or 1310 (window), 1309 (plan expired, `quota_credit`), 1302/1305 transient | Reset time in 1308 body | Code-driven; the cleanest signal after Claude |
| Gemini CLI | Daily per-user request quotas by auth type (F4 of R7) plus per-minute | `/stats model` only (interactive) | Unverified. Typed errors in source carry `retryDelayMs` | `retryDelayMs`; terminal quota errors have none | Source distinguishes `RetryableQuotaError` from `TerminalQuotaError` |
| Copilot CLI | AI credits, plan-bound | `--max-ai-credits` soft cap | Unverified | Unknown | Not classifiable until probed |
| opencode | Depends on provider | None | `error` record `APIError.statusCode=429`, `isRetryable`; may hang | `responseHeaders` (`Retry-After`) if present | Stall watchdog required |
| pi, prime-agent | Depends on provider | None | Assistant `stopReason:"error"` with `errorMessage` (after `auto_retry_*`) | Parsed from message text ("reset after 5h") | Long delays fail fast so a limit is visible at once; prime exit 0, so key on the terminal record |
| dsh | Depends on configured provider | None | `dsh: QUOTA:` / `dsh: RATE_LIMIT:` on stderr (or stdout) | Message text | Code-driven |
| Generic descriptor (decision 17) | Declared | Declared | Declared `quotaSignal` block: `match` (stream path, HTTP status, header, regex on stderr/stdout/result text), `class`, `resetsAt` extractor | Extractor or `null` | Unverified harnesses default to the stall-and-text classifier and run only at Tier 1/2 |

Two rules follow: (1) the classifier order is structured signal, then HTTP status/code, then text pattern from the descriptor, then stall watchdog; each verdict carries `confidence` (`structured`, `status`, `text`, `stall`) and `evidence` (the redacted matched fragment). (2) A `text` or `stall` verdict pauses only with a bounded probe schedule (see below), because a misclassified auth or network failure would otherwise wait for nothing.

## Cost model

One record, used by every adapter and by budgets. Rule: a value the harness did not report is `null`; the reason is a separate field (Principle XI, `constitution.md:304`).

```
Usage {
  usageId        string   // unique per model call or per reported total; dedupes replays (EV-17)
  scope          "call" | "session" | "pass" | "attempt"      // what the numbers cover
  cumulative     boolean  // true if the harness reports a running total for the session
  inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, reasoningTokens   // int | null
  costUsd        number | null
  costSource     "reported" | "estimated" | null   // "estimated" only from a consumer-declared rate table
  billing        "api" | "subscription" | "unknown"  // what a dollar means here (see below)
  model, provider, harness, role
  complete       boolean  // false for a killed pass or a stream with no terminal record
  unavailableReason  string | null   // "harness-does-not-report", "custom-provider-cost-unset", "killed", ...
  parentSessionId    string | null   // subagent attribution (B5: top-level usage excludes subagents)
}
```

Rules:

1. **Counting is the same across providers** (decision 8). Budgets have three dimensions: `tokens` (`input + output`, cache and reasoning reported separately and never folded in silently), `costUsd`, and `wallClock`. The budget tracks all three where available; a cap is declared on one or more.
2. **Incremental is the ledger unit.** Adapters convert cumulative reports to increments (`delta = new - lastSeen` per session id) or drop them in favour of the terminal total. A sum over records with `cumulative=true` is a defect (R21 gap 17; B5 says Claude's `total_cost_usd` is a running total).
3. **`billing=subscription`: cost is notional.** Claude reports `total_cost_usd` for subscription sessions too; it is an API-equivalent estimate. It feeds the observation-based alert and the digest as "value used", never a hard cap, and is never added to real spend. Real spend is the sum of `billing=api` records.
4. **`null` sums as unknown, not zero.** A total carries `coveredPasses` and `totalPasses`, so a budget bar can say "cost known for 45 % of passes" (R21 measured 45 % of passes with cost).
5. **Estimated cost** (consumer-declared per-model rates) is a separate `costEstimatedUsd` field and never merged with reported cost. It is the only way to give dsh, prime and Copilot passes a number, and it is off unless declared.
6. **Killed passes lose nothing**: usage events are emitted as each model call completes (Claude `assistant` messages carry `usage`; Codex `turn.completed`; opencode `step_finish`; pi/prime per message; dsh through the trace plugin, B14). A killed pass ends with `complete=false` and the last known partial. Where a harness reports only at the end, the pass is `unavailableReason="killed"` and the digest counts it as unknown, which is honest and still better than today's missing-record.
7. **Per-provider mapping**: Claude `usage.{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens}` and `modelUsage` (prefer, B5); Codex `usage.{input_tokens,cached_input_tokens,output_tokens}`; opencode `step_finish.tokens/cost` (cost 0 with a custom provider means unset, so map `0` from a provider without configured cost to `null`, `unavailableReason="custom-provider-cost-unset"`); Gemini `result` per-model token stats (field names unverified); OpenRouter and z.ai response `usage` object (OpenAI-compatible) and OpenRouter `/key` usage; pi/prime per-message usage; dsh none in stdout.

## Pause, resume and fallback

### Telling quota apart from other proposer errors

Adapters emit a single `harness.error` event with `class`, `confidence`, `resetsAt|null` and `retryable`. The engine decides:

| Class | Engine action | Counts as | Consumes MAX_ITER / rejects / MALFORMED / consecutive errors / wall budget |
|---|---|---|---|
| `quota_window` | Pause the role; resume at `resetsAt` or on a probe schedule | Neither an error nor a rejection; the pass is `interrupted` | No (all excluded) |
| `quota_credit` (credits, plan expired, billing) | Emit `blocked` (human must add credit or change config); fallback if opted in | Neither | No |
| `rate_limit_transient` (short `retry-after`, per-minute) | Adapter waits and retries inside the pass, up to a cap; beyond the cap it is reclassified `quota_window` | Neither | No |
| `overload` (529, 503) | Retry with backoff; if it persists past a cap, an ordinary provider error | Error only after the cap | After the cap |
| `auth` | `blocked`, no retry | Neither | No |
| `context_window` | Existing path (prompt too large); not quota | Error | Yes |
| `agent_failure`, `provider_other` | Today's consecutive-error path (exit 7 semantics) | Error | Yes |
| `budget_cap` (our own `--max-budget-usd` or role cap) | Budget-class kill like `hard_cap` (`error_breaker.py:29-45`): own counter, escalate, no relaunch | Budget | Cap counter only |

The distinction from today (A3–A6): the consecutive-error breaker sees only `agent_failure` and `provider_other`. Pause is a state of the run, not a stop reason, so mixture-of-loops-style supervision has nothing to relaunch and spends no relaunch budget.

### The pause

1. **Trigger.** A `quota_window` verdict on a pass of role R with `confidence` `structured` or `status` pauses immediately. `text` or `stall` confidence pauses after one confirming probe (below).
2. **State.** The runtime writes `pause.record` in the run state (role, harness, class, `resetsAt`, `since`, `probeIndex`) and emits `quota.signal` then `run.paused`. The run stays alive (lease held, `RunView.runState=paused-quota`); the detached process sleeps, it does not exit. Exiting would hand the decision to a relauncher that cannot know the reason. If the process is killed while paused, the next launch reads `pause.record` and resumes waiting (counts survive, decision 23).
3. **The interrupted pass.** Work in the working tree is kept. The pass is closed with `pass.ended{cause:"quota_pause", usage complete or partial}`; the attempt stays open with `attempt.status="paused"`. On resume the same attempt continues with a new pass (fresh session, or a continued one if the harness supports it, decision 22).
4. **Clocks.** Paused time is excluded from the wall-clock budget (A7), from the pass timeout, and from the stall watchdog. It is recorded as `pausedMs` on the attempt and the run, so alive-time metrics (R21) can separate quota waits from work.
5. **Resume time.** `resumeAt = resetsAt + margin` (margin default 60 s, plus up to 30 s random jitter). If `resetsAt` is `null`: probe schedule 5, 15, 30, 60 minutes, then every 60 minutes. A probe is one minimal real call through the same adapter (cost: negligible but not zero, and it is reported as a `probe` pass); a successful probe emits `run.resumed`. If a `text`-confidence pause never confirms, the classification is downgraded to `provider_other` after 2 probes.
6. **Ceiling.** `pause.maxTotalMs` (default 12 h, user-scope key) bounds a single pause; on expiry the run emits `blocked{reason:"quota-wait-ceiling"}` and stops with a distinct terminal cause `paused_quota_ceiling`. This is a proposed default (`inferred`); the weekly window can be up to 7 days, so users on a weekly limit will raise it or use a fallback.
7. **Not a rejection.** No `reject`, no `iter_done`, no increment to attempt count, iteration count, reject count, MALFORMED streak or error streak. The verdict path is untouched: a quota pause on the critic before it returned a parseable verdict is `critic.call{outcome:"quota_pause"}` and the attempt waits with the same rules, so it never contributes to `critic_unavailable` (`orchestrator.sh:2180`).
8. **Roles pause independently.** A proposer pause does not stall a critic that runs on another provider, but the loop is sequential, so in practice the run waits; the per-role record lets the fallback act on one role only.
9. **Micro-loops** (decision 21): a quota signal during a micro-loop unit pauses like any pass and does not use the inner cap.

### The fallback chain

Off by default; opt in per role with an ordered list (`fallback: [{harness, model?, auth?}, …]`) in user-scope config (R11 T-13: it widens capability, so project config cannot set it).

| Rule | Detail |
|---|---|
| Trigger | A `quota_window` or `quota_credit` verdict on the role's current entry, and `fallback.after` elapsed (default 0 = switch at once; a consumer can set, say, 30 minutes to prefer waiting for short resets). If `resetsAt` is earlier than `fallback.after`, wait rather than switch |
| Granularity | Switch at an attempt boundary where possible; mid-attempt switches start a fresh session (context is carried through files, decision 22) and are recorded in `fallback.switched{from,to,reason,attemptId}` |
| Terms and tier | Every entry is checked by the terms gate (decision 6, R8) before use. Entries a run has no right to use are skipped with an event, never silently |
| Subscription to API key | Allowed only if the entry's spend cap is declared. Emits `alert{level:"loud", kind:"billing-mode-change"}` at the switch, shows in `RunView.attention[]`, the digest and the launch/resume announcement. Never automatic without a cap (a hard cap is what makes the switch safe) |
| Critic independence | A fallback that would make critic and proposer the same model emits the decision-7 warning event; it does not block |
| Return | At the next attempt boundary after the primary's `resetsAt` has passed, the role returns to the primary entry (`fallback.restored`). Configurable to stay |
| Exhaustion | If every entry is limited, the role pauses until the earliest `resetsAt` |
| Recording | Each usage record carries `harness`, `provider`, `billing`, so spend per fallback entry is visible |

### Pause across the two relaunch layers

The supervisor's relaunch classifier must treat `paused-quota` as a live state (not `stopped`, not `failed`) so relaunch budget is untouched. A run that exits while paused (host crash) is relaunched as any crash, and resumes the pause from `pause.record`. `proposer_consecutive_errors` stops retain their relaunch treatment only for `provider_other`. This is a divergence-register row (prompt §2, "A quota pause replaces …").

## Budget alerts

### API-key mode: hard caps

- Caps are declared per role and per run (`budget.role.<r>.costUsd`, `.tokens`; `budget.run.costUsd`). Only `billing=api` spend counts against `costUsd`.
- Enforcement is at safe boundaries, as Lisa does (`budgets.ts:14-24`): before a pass, before an attempt, between micro-loop units. In-pass cap where the harness offers it: Claude `--max-budget-usd` (R5 F7), Copilot `--max-ai-credits` (soft). Overshoot is therefore bounded by one pass (or one in-pass cap) and the alert says so.
- Thresholds (proposed, `inferred`): 50 %, 75 %, 90 % emit `alert{level:"info"|"warn"|"warn"}`; 100 % emits `budget.exceeded`, the run pauses in a `budget_exceeded` state that is resumable by raising the cap (Lisa's resumable `BUDGET_EXCEEDED`), and is not a rejection.
- Loudness: with an API key configured, `warn` and above use `level:"loud"` from the first threshold, and the launch announcement states "API key in use, cap $X". Loud alerts reach every channel below; info alerts reach only status and the doctor.

### Subscription mode: observation-based alerts

- The allowance is unknown until the provider signals it (decision 8). The engine tracks what it observes: tokens per role per window, `notional cost`, count of passes, and the provider's own utilization where offered (Claude `utilization`, `allowed_warning`, `surpassedThreshold`).
- Optional soft budget declared by the consumer (`budget.role.<r>.softTokens` per window): alerts at 50/75/90 % of the declared figure.
- Provider warnings pass through as `alert{kind:"provider-warning", utilization, rateLimitType, resetsAt}`.
- The provider limit signal is the only pause trigger.
- A consumer sharing the account with an interactive Claude session should know the detached run drains the same window; the digest shows `windowUse` per rate-limit type, and the doctor explains it (R3 conflation risk).

### Delivery

The engine is the only source. It writes `alert` events and updates `RunView.attention[]` and `RunView.budget[]`. Everything else reads.

| Channel | Mechanism | Claude Code | dsh |
|---|---|---|---|
| Status | `specstride status` (`--line`, `--json`) reading `RunView` | yes | yes |
| Digest | `alerts` and `budget` fields in the digest line and file at end and at each supervision cycle | yes | yes |
| Doctor | Run section lists open alerts, the caps in force, billing mode, fallback in force, same-model warning | yes | yes |
| Push to the model | `asyncRewake` watcher started at `SessionStart` exits 2 with one line on `loud` alert, `paused-quota`, `blocked`, finished (R3 row; lifetime `unverified`, fallback is the monitor) | yes | no hooks (R4 F14) |
| Re-attach | `SessionStart` prints alerts still open (about 100 tokens, zero when none) | yes | no |
| Delta on prompt | `UserPromptSubmit` prints only alerts new since last shown, deduplicated | yes | no |
| Host-observed quota | `StopFailure` matcher `rate_limit` and `Notification` `quota_auto_resume_*` append `host.quota_observed` events; informational only, they never pause the detached run. Under Tier 1 they share the account, so they raise the `windowUse` estimate | yes | no |
| Supervision cycle | The skill's cycle reads `status` and reports alerts to the consumer | yes | yes (the only channel on dsh) |

Alert deduplication key: `(kind, role, threshold)`, so a threshold fires once per window and once more if it re-arms after a reset.

## The event schema (`specstride.event`, version 1)

One JSON object per line in `events.jsonl` of the run. Typed values (no string coercion); unknown values are `null`; absent means not applicable.

### Envelope (every record)

| Field | Type | Notes |
|---|---|---|
| `schema` | `"specstride.event"` | constant |
| `v` | int | schema major version (1). Additive changes keep `v`; readers ignore unknown fields and unknown `type`s (evolvability) |
| `seq` | int | monotonic per run, gapless, assigned by the single writer (EV-21) |
| `ts` | string | RFC 3339 UTC with millisecond precision, on every record from every writer including the supervisor (EV-01) |
| `type` | string | dotted, `<area>.<verb>`, lower snake segments |
| `runId` | string | the logical run, stable across relaunches |
| `launchId` | string | one per process start of the detached runtime (increments on relaunch and resume) |
| `featureId`, `phaseId` | string | when applicable |
| `attemptId`, `attempt` | string, int | stable across relaunch and yield resume (EV-07); `attempt` is the ordinal, carried over resume (decision 23) |
| `passId`, `pass` | string, int | `passId` unique per session start (EV-14) |
| `sessionId`, `parentSessionId` | string | harness session ids (EV-02) |
| `role` | `proposer` `critic` `diagnostician` `accelerator` `supervisor` `host` | |
| `harness`, `provider`, `model` | string | as known, else `null` |
| `strategy` | `classic` `micro` | recorded per attempt and on every pass event (decision 21) |
| `traceId`, `spanId` | string | W3C ids; deterministic trace id per run (C4) |
| `cause` | string | causation: the `seq` or `id` of the event that led to this one |
| `data` | object | typed per `type`; contains no prompt or reply content (EV-32) |

A `v2` jump is reserved for breaking changes; readers such as `RunView` declare the range they accept and the doctor warns on mismatch.

### Event catalogue (new vocabulary)

Legacy column: the old name it projects to (see "Compatibility projection"), or `none` (new-only).

| Type | Opens/closes | Key `data` | Legacy |
|---|---|---|---|
| `run.started` / `run.ended` | run | `cause` (`all_approved`, `max_rejects`, `budget`, `operator_stop`, `supervisor_timeout`, `crash`, `blocked`, `paused_quota_ceiling`, …), `causedBy` (`self`, `operator`, `supervisor`, `host`, `crash`), `synthesized` bool | `run_start`, `run_end`/`run_stop` |
| `run.launched` | launch | `launchId`, `reason` (`first`, `resume`, `relaunch`, `manual`), `countsCarried{attempts,rejects}`, `countsReset` bool | none (`run_start` on first) |
| `run.paused` / `run.resumed` | pause | `class`, `role`, `resetsAt`, `resumeAt`, `pausedMs`, `probeIndex` | none |
| `quota.signal` | | `class`, `confidence`, `rateLimitType`, `utilization`, `resetsAt`, `resetsAtSource` (`structured`, `header`, `parsed_text`), `status`, redacted `evidence` | none |
| `harness.error` | | `class`, `retryable`, `status`, redacted `message` | `iter_error` (partly) |
| `fallback.switched` / `fallback.restored` | | `from`, `to`, `reason`, `billingChange` | none |
| `alert` | | `kind`, `level` (`info`,`warn`,`loud`), `role`, `threshold`, `value`, `limit`, `channel` hints | none |
| `budget.exceeded` | | `dimension`, `limit`, `used`, `role`, resumable | `run_stop` (partly) |
| `usage.reported` | | `Usage` record | `agent_result` (partly) |
| `usage.unavailable` | | `unavailableReason` | `pass_cost_unknown` |
| `stage.started` / `stage.ended` | stage | `stageId`, `launchId`, `outcome` | none |
| `phase.started` / `phase.ended` | phase | `outcome` | `phase_start`, `phase_done` |
| `attempt.started` / `attempt.ended` | attempt | `strategy`; ended: `cause`, `workProducts[]{path,sha256,kept,carriedInto}` (EV-20) | `proposer_start`, `reject`/`phase_done` |
| `pass.started` / `pass.ended` | pass | `passId`, `sessionId`, `continued` bool, ended: `cause` (`completed`, `evidence`, `killed:<reason>`, `error`, `quota_pause`, `yield`, `no_progress`), `timeBreakdown{modelMs,toolMs,waitMs,idleMs}`, `usageComplete`, `firstEditAt` | `iter_start`, `iter_done`/`iter_error`/`iter_cap`/`iter_no_progress`, `pass_killed` |
| `prompt.built` | | `blocks[]{id,bytes,tokensEst,dropped}`, `totalTokensEst`, `path`, `sha256`, `bytes` (no content) | `prompt_block_dropped`, `prompt_block_protected` (partly) |
| `tool.call` | | `tool`, `category` (`read`,`edit`,`exec`,`wait`,`search`,`other`), `target` (redacted), `durationMs`, `ok` | `agent_tool` |
| `check.started` / `check.ended` | check | `checkId`, `command`, `runner` (`runtime`,`proposer`), `result`, `durationMs`, `unit` | `verification_*` |
| `microloop.unit` | unit | `unitId`, `check`, `result` (`keep`,`repair`,`escalate`), `layerOff` reason | none |
| `job.started` / `job.step` / `job.first_failure` / `job.ended` | long job | `jobId`, `resource`, `cycle`, `stepTs`, `failedAt`, `msAfterFirstFailure` | `long_job_start`, `long_job_ended`, `yield_*` |
| `resource.wait` | | `resource`, `holder`, `ms` | none |
| `critic.selected` | | `harness`, `model`, `why`, `sameModelWarning` | none (decision 17) |
| `critic.call` | span | `promptRef`, latency, usage, `outcome` | `critic_start` |
| `critic.grounding_gap` | | `unresolved[]`, `globs[]` | `grounding_gap` |
| `verdict.recorded` | | `verdictId`, `result`, `nonceOk`, `malformedStreak` | `verdict` |
| `verdict.adjudicated` | | `verdictId`, `falseNegative` bool, `by` | none |
| `blocked` / `unblocked` | blocked span | `reason`, `question`, `options[]`, `since`; unblocked: `by`, `answerRef`, `latencyMs` | `run_stop reason=proposer_no_progress` (partly) |
| `task.planned` / `task.ticked` | | `taskId`, `estimateMs`, `elapsedMs`, `attemptId` | `tasks_ticked` |
| `supervisor.observed` / `supervisor.relaunch` / `supervisor.stopped` | | exit code, child exit, stop reason, relaunch budget left | none (MoL `[MOL-*]` lines) |
| `counters.reset` | | `which[]`, `by` | none |
| `alert.host` / `host.quota_observed` | | host-observed | none |
| `telemetry.delivery` | | sink, status | `telemetry_delivery` |
| `stream.missing_terminal`, `stream.diagnostic` | | Principle XI | `agent_diagnostic`, `missing_terminal` |

Extension: types prefixed `x.` are free for third parties; they are never projected and never affect `RunView`.

### Schema requirements (each telemetry gap becomes one)

Origin: A5 §7 items 1–13 and R21 items 14–20.

| ID | Gap it closes | Requirement |
|---|---|---|
| EV-01 | A5 1: MoL logs have no timestamps; a stop records no reason | Every record from every writer (engine, adapters, supervisor, launcher) carries `ts`. The supervisor writes `supervisor.*` events into the same stream, each stop with `cause`, `causedBy` and the classified reason. Launcher/supervisor text lines are a rendering of these events, not a separate log |
| EV-02 | A5 2: no link event to transcript; subagent events mixed with parent | `pass.started` records `sessionId`; every record inside a pass carries it; subagent activity carries `parentSessionId`; `pass.ended` records `transcriptRef{path, sha256|null}` (local path only, never content) |
| EV-03 | A5 3: killed passes have no cost or tokens | `usage.reported` is emitted per model call as it completes, not only at the terminal record; a killed pass ends with `usageComplete=false` and the last partial, or `usage.unavailable{reason:"killed"}` |
| EV-04 | A5 4: no record of what a pass did | `tool.call` carries `category` and `durationMs`; `pass.ended.timeBreakdown` splits model, tool, wait, idle time; `pass.firstEditAt` marks the first productive edit |
| EV-05 | A5 5: no step timing inside long jobs | `job.step` (timestamped per step or cycle), `job.first_failure` with the step, and `job.ended{msAfterFirstFailure}`; also the signal a fail-fast policy acts on |
| EV-06 | A5 6: no blocked-on-human event | `blocked{reason, question, options}` emitted when the runtime (no-progress breaker, harness question, credit or auth failure) or the proposer's own declaration decides the run needs a human; `unblocked` on the answer. `RunView.attention[]` derives from it |
| EV-07 | A5 7: no stable attempt identity across relaunches; no per-unit cumulative time or cost | `attemptId` is minted once and persisted; `attempt` ordinal is carried over resume/relaunch (decision 23); `counters.reset` is the only way it changes. Per-unit cumulative time and cost are folds over `attemptId`/`phaseId` |
| EV-08 | A5 8: no critic-side cost, latency, grounding-failure event, or false-negative flag | `critic.call` carries usage and latency; `critic.grounding_gap` is emitted when a glob or path in the snapshot fails to resolve; `verdict.adjudicated{falseNegative}` is appended later by the diagnostician or the consumer and references `verdictId` |
| EV-09 | A5 9: no per-pass prompt size by block | `prompt.built` for every pass and every critic call: per-block bytes and token estimate, drops, and total. The input-token figure comes from `usage.reported` |
| EV-10 | A5 10: no shared-resource contention signal | `resource.wait{resource, holder, ms}` when a check or job waits on a declared exclusive resource; jobs declare `resource` |
| EV-11 | A5 11: no quota/rate-limit event | `quota.signal`, `run.paused`, `run.resumed`, `harness.error` (this report) |
| EV-12 | A5 12: no planned-vs-actual per task | `task.planned` (with estimate where the plan has one) and `task.ticked{taskId, elapsedMs, attemptId}` per task, not per phase |
| EV-13 | A5 13: no human-in-the-loop latency | `unblocked.latencyMs` = time from `blocked.since` to the answer, plus `run.launched{reason:"resume"}` linking the resume to the answer |
| EV-14 | R21 14: `iter` is reused after a yield resume | `passId` unique per session start; a yield resume starts a new pass with a new `passId` carrying the same `attemptId`. The ordinal `pass` is monotonic per attempt and never reused |
| EV-15 | R21 15: 51 of 172 runs have no terminal event; stop causes look alike | Every exit path emits `run.ended{cause, causedBy}`. When the process dies without emitting it, the supervisor (or the next launch, after finding a dead lease) writes `run.ended{synthesized:true, cause:"crash"|"host_exit"|"operator_stop"}` and the reader treats a run without one as `open` only while its lease is live |
| EV-16 | R21 16: dsh/prime passes and killed passes have no cost | Adapters declare `usageSource` (`stream`, `trace-plugin`, `none`); a harness with `none` emits `usage.unavailable{reason:"harness-does-not-report"}` per pass so gaps are explicit, not silent. dsh gains usage through the trace plugin route (B14) or optional estimate (cost model rule 5) |
| EV-17 | R21 17: cost repeated, not attributed | `Usage.cumulative` flag; `usageId` for dedupe; adapters produce increments; `parentSessionId` attributes subagent cost; the reducer sums only increments |
| EV-18 | R21 18: `state.json` keeps only the last launch of a stage | `stage.started`/`stage.ended` appended per launch with `launchId`; state files hold current state only, history is the event stream |
| EV-19 | R21 19: verification inside a pass invisible | `check.started`/`check.ended` for every check whoever runs it (`runner:"runtime"|"proposer"`), with command, duration and result; micro-loop checks use the same events |
| EV-20 | R21 20: no record of what carried over from a failed attempt | `attempt.ended{cause, workProducts[]{path, sha256, kept, carriedInto}}` |
| EV-21 | R13: monotonic `seq`, schema version, typed values | Envelope fields `seq`, `v`; a single writer assigns `seq` under the run's append lock; torn last line tolerated by readers |
| EV-22 | R13: stable ids on everything | `runId`, `featureId`, `phaseId`, `attemptId`, `passId`, `role` on every record that has them |
| EV-23 | R13: lifecycle events with explicit open and close | Every `*.started` has a matching `*.ended`; the OTel span is built from the pair at emit time (not reconstructed at ship time as today, C4) |
| EV-24 | R13, decision 8: cost events | `usage.reported` with `usd`, tokens, `billing`, `role`, `model` |
| EV-25 | R13: quota and resume | `quota.signal`, `run.paused` with `resumeAt`, `run.resumed` |
| EV-26 | R13, decision 23: restart marker carrying surviving counts; counter reset | `run.launched{countsCarried, countsReset}`, `counters.reset` |
| EV-27 | R13, decision 21: strategy per attempt, layer-off reason | `strategy` in the envelope; `microloop.unit.layerOff` |
| EV-28 | R13, decision 17: critic selection | `critic.selected{harness, model, why, sameModelWarning}` at launch |
| EV-29 | R13: liveness not an event | Liveness comes from the lease/pid file; no heartbeat events. `run.ended` synthesis (EV-15) depends on the lease |
| EV-30 | Decision 8: alerts and fallback are recorded | `alert`, `budget.exceeded`, `fallback.switched|restored` |
| EV-31 | Principle XI: truthful stream | `stream.missing_terminal` when a stream ends without a terminal record; a pass that exits 0 having done nothing is flagged (`pass.ended.cause="no_progress"`); unknown values `null` |
| EV-32 | R11 R-3, T-32: no content in events | No prompt, reply, tool-argument body or command output in any event. Content is referenced by `path`, `sha256`, `bytes`. Free-text fields (`message`, `evidence`, `target`, `question`) pass the ingress redactor and are size-capped |
| EV-33 | R11 T-17: hostile streams | Adapters parse only the harness's own framing; tool output never becomes a stream record; per-line size and rate caps; a violation emits `stream.diagnostic` |
| EV-34 | Decision 11: dual view | The event stream is the only input to `RunView`; the snapshot cache is disposable |

## OTel mapping

### Reconciling the four sources

| Concern | Lisa `@lisa/otel` | Specstride telemetry-http | Prompts work `936afea` | dsh-trace-otel | Decision |
|---|---|---|---|---|---|
| Transport | Hand-built OTLP/HTTP+JSON, no SDK, best-effort, Loki forwarder | Python stdlib OTLP `/v1/logs|metrics|traces`, Loki push | same | Node `http`, 2 s timeout, 3 s shutdown | One exporter in TypeScript reusing Lisa's design (zero dependency, best-effort, never throws into the loop; R1 recommends extracting the package). Loki push kept as an optional sink |
| Span naming | Fixed `lisa.<area>.<op>` set of 15 | Scope names (`run`, `phase`, `attempt`, `iter`, `verification`, `critic`, `yield`, `long_job`), built at ship time | same plus content | `dsh.session/turn/llm/tool` | `specstride.<area>.<op>`; built by the runtime from the open/close events (EV-23) so spans are emitted at close with true start time and survive a shipper restart |
| Trace id | From correlation | `sha256("specstride:"+run_id)[:32]` or `SPECSTRIDE_TRACE_ID` | same | `TRACEPARENT` | Keep the deterministic run trace id; relaunches join the same trace |
| Correlation ids | `jobId`, `taskId`, `planRevision`, `correlationId`, `causationId` | `run_id`, `task`, `feature`, `backend` | | `session.id`, `session.parent_id` | Envelope ids (`runId`, `attemptId`, `passId`, `sessionId`, `cause`) become span attributes `specstride.*` |
| Child nesting | none | none | `traceparent(run_id, scope)` for `claude -p` and dsh | Reads `TRACEPARENT` | Runtime exports `TRACEPARENT` of the open pass span to the harness process env; harnesses that honour it nest (dsh verified; others `unverified`). A harness that ignores it loses nothing |
| Span kinds | internal | internal | internal | OpenInference `AGENT`/`CHAIN`/`LLM`/`TOOL` | Optional dialect: `otel.dialects` contains `specstride` (always), `genai`, `openinference`. Enabled dialects add attributes; they never rename the base ones |
| Tokens/cost | metrics counter by kind + cost | `ralph.cost_usd`, `ralph.tokens{model,type}` | | `llm.token_count.*` on LLM spans | `specstride.cost.usd`, `specstride.tokens`; on spans `gen_ai.usage.*` (genai dialect, attribute names `unverified`: the GenAI semantic conventions were reported as moved, R11 F-14) and `llm.token_count.*` (openinference dialect) |
| Content | none | none | `input.value`, `specstride.prompt.*`, always on with traces | full prompts on LLM spans | Off by default (below) |
| Metrics temporality | Delta | Sums | | none | Delta sums and gauges |

### Signals

- **Traces.** Hierarchy `specstride.run` → `specstride.phase` → `specstride.attempt` → `specstride.pass` → {`specstride.tool`, `specstride.check`, `specstride.job`, `specstride.microloop.unit`}; `specstride.critic.call` under the attempt; `specstride.pause` spans the quota wait (start at `run.paused`, end at `run.resumed`) so waits show on the trace instead of as gaps; `specstride.blocked` likewise. Span status error for `pass.ended` with `error`/`killed`, not for `quota_pause`.
- **Logs.** Every event record is an OTLP log record: `body` = the event JSON minus content, `eventName` = `type`, severity from `alert.level` and error classes, attributes = envelope ids. This replaces the Loki path's logfmt line.
- **Metrics** (delta): `specstride.cost.usd` (Sum; attrs `role`, `model`, `provider`, `billing`, `cost_source`), `specstride.tokens` (Sum; `type` = `input|output|cache_read|cache_write|reasoning`), `specstride.pass.duration` (histogram), `specstride.attempt.outcome` (Sum by `cause`), `specstride.verdict` (Sum by `result`), `specstride.quota.utilization` (gauge by `rate_limit_type`), `specstride.pause.duration` (histogram), `specstride.blocked.duration` (histogram), `specstride.check.duration` (histogram by result), `specstride.run.state` (gauge). Lisa's six families map to these (jobs by state to `run.state`, phase durations to a phase histogram, reject rate to `verdict`, tokens to `tokens`/`cost`, approval latency to `blocked.duration`; queue depth is not in Wave 1).
- **Waiver.** The existing dashboard (`telemetry/dashboards/ralph-loops.json`) keys on `ralph_*` metric names. With greenfield state (decision 3) the names change; `otel.legacyMetricNames: true` additionally emits `ralph.cost_usd`, `ralph.tokens`, `ralph.errors`, `ralph.tool_use`, `ralph.gate` from the same records for consumers who keep the old dashboard. Off by default.

### Content and redaction rule (R11)

1. Events contain no content (EV-32). Local files keep full text under `0600`: the prompt for each pass and critic call is written to `prompts/<passId>.txt`; the event carries `path`, `sha256`, `bytes`.
2. OTel content capture is a **separate switch**, `telemetry.content: off | redacted`, **off by default**, independent of "traces on", and a user-scope key only (R11 T-13, T-32, T-36). With `off`, spans carry `specstride.prompt.{path,sha256,bytes}` only; that reverses `936afea`, where content follows traces.
3. With `redacted`: content is read from the local file at span close, passed through the same redactor as everything else (registered secret values by exact match, versioned pattern set, R-3), capped (default 256 KiB prompt, 16 KiB agent text as in C5), and dropped with `content_dropped=true` if the redactor cannot run (fail-closed). Thinking content is never exported.
4. The critic's nonce never leaves the host before the call returns; afterwards only its hash (R-3 item 9). This removes the `936afea` prompt-file exposure (R11 F-05).
5. Redaction happens once at ingress (stream adapter, check output capture, critic reply capture); every sink (event log, OTel, digest, kanban, status) receives the redacted form.
6. The doctor shows the collector endpoint and whether content capture is on. dsh's own trace plugin has its own content switch; the doctor warns when it is on while Specstride's is off.
7. Harness self-telemetry is disabled for launched subprocesses (`PI_TELEMETRY=0`, `PRIME_AGENT_TELEMETRY=0`, `DO_NOT_TRACK=1`; R9), since the consumer did not opt in.

## Compatibility projection

**What Principle XI requires.** "Each backend stream MUST be translated by one adapter behind a single seam into the existing event vocabulary (`agent_init`, `agent_tool`, `evidence_writing`, `agent_result`). Existing backends' output must stay byte-identical" (`constitution.md:299-301`). Decision 3 (greenfield) and decision 11 (one schema) mean the primary stream is no longer that vocabulary. Byte-identity is therefore achieved only for the **oracle projection**, and waived elsewhere.

**Design (modelled on Lisa's `V1_V2_MAPPING`, C7).**

1. The projection is a pure function `project(event) -> LegacyLine | null` over the new events, table-driven, in its own module, with one row per new type: `{ new type, legacy name, field map, emitter: "bash" | "python", value coercion }`. `emitter: bash` rows stringify every value; `python` rows keep types and drop `None` (C1). Field order and `ts` format (`epoch.nanos` string plus ISO `time`) are reproduced per row. The table is generated from the same source as the schema, and a consistency test (as in `verifyMappingConsistency`) fails if a new type has no row, even a `null` row.
2. New-only events (quota, pause, alerts, blocked, fallback, `prompt.built`, `tool.call` categories, and so on) map to `null`: old consumers never see them, exactly as Lisa does. New fields on projected events (`passId`, `seq`, `category`) are not in the projection.
3. The projection is written by a separate optional sink to `events.legacy.jsonl`. It is always on under the parity oracle and under `compat.legacyEvents: true`; off otherwise. The primary stream is never derived from it.
4. **Where byte-identity holds:** for the oracle fixtures (classic strategy, continuation off, stub agents), the projected file equals the Python baseline's `events.jsonl` after the oracle's normalization of `ts`, `time`, ids and paths. The stream-golden fixtures (`lib/fixtures/stream-golden/*`) carry `legacy.events.golden` and `correlated.events.golden` expectations, which become the projection's golden tests. This satisfies Principle XI's letter for the four named events and every other event the oracle compares.
5. **Where it is waived (register rows):** (a) path and layout of the live stream (decision 3); (b) primary event names; (c) any event the old system emitted twice or with inconsistent value types where the new schema is typed (projection reproduces the quirk only for the oracle, so a real user reading `events.legacy.jsonl` gets the same quirk); (d) events with two old shapes, such as the two `agent_result` variants with and without `reason_code`; (e) with micro-loops on, the extra fields that record the active layer (decision 21); (f) telemetry to Loki/OTLP uses the new signals (metric renames, see waiver above); (g) `pass_cost_unknown` becomes `usage.unavailable` and projects back to it.
6. Principle XI's other clauses are kept natively, not just projected: `stream.missing_terminal`, a flagged do-nothing pass, and `null` for unknown values are schema rules (EV-31). The constitution amendment (feature 111) should reword the first bullet to "into the event schema; the legacy vocabulary is a projection kept byte-identical for the parity fixtures".

**Cost of this choice.** Two vocabularies to keep in step (mitigated by the generated table and its consistency test) and a legacy sink that carries bash-quirk typing forever if a consumer depends on it. The alternative (keep the old vocabulary as primary) would freeze the schema to string-typed bash records and block EV-01 to EV-34.

## UI needs (R13 checklist)

| R13 need | Where satisfied |
|---|---|
| `seq`, `schemaVersion`, typed events | Envelope `seq`, `v`; EV-21 |
| Stable ids on everything | EV-22 |
| Lifecycle open/close: pass, unit, check, job start/cycle/first-failure/end, critic call, verdict | Catalogue rows `pass.*`, `microloop.unit`, `check.*`, `job.*`, `critic.call`, `verdict.recorded`; EV-23 |
| Cost events with `usd?`, tokens, `billing`, `role`, `model` | `usage.reported`; EV-24 |
| `quota_signal`, `resume_at`, `run_paused`, `run_resumed` | `quota.signal`, `run.paused{resumeAt}`, `run.resumed`; EV-25 |
| `blocked` with reason and question | `blocked`; EV-06 |
| Restart marker with surviving counts, counter reset | `run.launched`, `counters.reset`; EV-26 |
| `strategy` per attempt, `layer_off` | Envelope `strategy`, `microloop.unit.layerOff`; EV-27 |
| Critic selection | `critic.selected`; EV-28 |
| Liveness not an event | Lease/pid file; EV-29 |
| Canonical serialization, stable key order, golden tests | Events serialize with fixed key order (envelope first, `data` keys sorted); torn last line tolerated |

`RunView` derived fields this report adds to R13's list: `pause{role, class, resumeAt, pausedMs}`, `alerts[]`, `budget[]{dimension, used, limit, coveredPasses, billing}`, `fallback{active, index}`, `windowUse[]`.

## Version/date pins

| Item | Pin | Verified on |
|---|---|---|
| Claude Code CLI | 2.1.259–2.1.284 (from R5) | 2026-09-29 |
| `@anthropic-ai/claude-agent-sdk` | 0.3.284, type file read locally | 2026-09-29 |
| Codex CLI | `>=0.153.4 <0.154` (from R6); limit behaviour unverified | 2026-09-29 |
| Gemini CLI | `>=0.61.0 <0.62.0` (R7, docs only) | 2026-09-29 |
| Copilot CLI | `>=1.0.89 <1.1.0` (R7, docs only) | 2026-09-29 |
| opencode | `>=1.18.32 <1.19` (R10) | 2026-09-29 |
| pi / dsh / prime | 0.80.6 / 0.1.0-rc.8 / no version flag (R9) | 2026-09-29 |
| Specstride baseline | `9cab15d`; OTel prompts `936afea` | 2026-09-29 |
| mixture-of-loops baseline | `9c88f86` | 2026-09-29 |
| Lisa | `/root/lisa` checked-out branch `feat/dashboard-trajectory-redesign` (R1 rules on the tree) | 2026-09-29 |
| Event schema | `specstride.event` v1 (this report) | proposal |

## Options compared

**O-1. What a quota event does to the run.**

| Option | Pause without relaunch (recommended) | Stop and let supervisor relaunch after a delay | Treat as provider error (today) |
|---|---|---|---|
| Correct counts (not a rejection) | Yes | Yes if classified | No (A6) |
| Relaunch budget preserved | Yes | No, each wait spends one | No |
| Host session dependence | None (detached process waits) | Supervisor must outlive the wait | None |
| Survives crash while waiting | Yes with `pause.record` | Yes | n/a |
| Complexity | Runtime owns a wait state | Simple runtime, complex supervisor | Lowest |

**O-2. Cost accounting.**

| Option | Reported only, `null` otherwise (recommended, with optional labelled estimate) | Price table always | Tokens only |
|---|---|---|---|
| Truthful (Principle XI) | Yes | No (invented for unreported harnesses) | Yes |
| Cross-provider comparable | Tokens yes, USD partial | Yes but wrong for subscriptions | Yes |
| Decision 21 "cost no worse" test | Needs coverage figure | Would hide gaps | Usable but not money |

**O-3. Alert delivery.**

| Option | Engine-sourced, hooks as readers (recommended) | Hooks as source | Poll only |
|---|---|---|---|
| Works on dsh (no hooks) | Yes | No | Yes |
| Push to the model | Claude Code via `asyncRewake` | Same | No |
| Host-quota conflation | Avoided (host events are informational) | Present | Avoided |

**O-4. Legacy compatibility.**

| Option | New primary plus optional oracle projection (recommended) | Old vocabulary primary | Both always on |
|---|---|---|---|
| Schema can be typed, versioned, extended | Yes | No | Yes |
| Byte-identity for the oracle | Yes | Yes | Yes |
| Ongoing cost | One generated table | Blocks the schema | Double writes always |

**O-5. Span construction.** At emit time from explicit open/close events (recommended) versus at ship time from paired flat events (today). The first survives shipper restarts and gives true start times without a side state file (`STATE_TTL_SEC`, `<state>.<span_id>.content.json` from C4/F-13); the second needs no change to producers but is the source of orphaned scopes.

## Recommendation

1. Adopt `specstride.event` v1 as specified: one typed, sequenced, timestamped envelope; open/close lifecycle events; no content in events; the 34 requirements EV-01 to EV-34 as acceptance criteria of feature 111-observability.
2. Make quota a first-class classification (`QuotaClass`) produced by adapters and consumed by the engine; pause as a run state that spends no counter and no wall clock; fallback opt-in, user-scope, terms-gated, with a loud alert on any subscription-to-API-key switch.
3. Cost: report only what the harness reports, `null` otherwise; increments, not cumulatives; `billing` mode on every record; subscription cost is notional.
4. Budgets: hard caps enforced at safe boundaries for API keys; observation-based alerts plus the provider signal for subscriptions; the engine is the only alert source and hooks, digest, status and doctor are readers.
5. OTel: one TypeScript exporter reusing Lisa's zero-dependency OTLP design; `specstride.*` names; spans built at emit time; optional `genai` and `openinference` dialects; content capture off by default as a separate user-scope switch.
6. Projection: new stream primary, table-driven legacy projection kept byte-identical for the parity fixtures and waived elsewhere with register rows.

Confidence: high on the schema requirements (each traces to a measured gap) and on the pause design's shape; medium on the default numbers (thresholds, probe schedule, 12 h ceiling, margin) which are proposals to tune; medium-low on the non-Claude quota signals until probes are run (Codex, Gemini, Copilot, opencode, pi exit code).

## Matrix rows

Quota-signal column for the Harness Capability Matrix (other columns are in R5, R6, R7, R9, R10):

| harness | quota signal |
|---|---|
| Claude | Structured: `rate_limit_event` (`status`, `resetsAt`, `rateLimitType`, `utilization`, `surpassedThreshold`) with advance `allowed_warning`; `api_retry.error=rate_limit` is transient; `result.is_error` plus limit text; `billing_error` is credit; 529 is not quota. Usage per message and `modelUsage`; `total_cost_usd` cumulative and notional on subscription |
| Codex | Unverified event text on limit (5 h + weekly window); API key: HTTP 429 in an `error` event. Usage from `turn.completed.usage` |
| OpenRouter | HTTP 429 with `X-RateLimit-*` and `Retry-After`; 402 credits; `GET /api/v1/key` for remaining; response `usage` |
| z.ai | HTTP 429 body codes 1302/1305 transient, 1308 window with reset time, 1310 weekly/monthly, 1309 plan expired; response `usage` |
| Gemini CLI | Unverified surfacing; typed `RetryableQuotaError`/`TerminalQuotaError` with `retryDelayMs` in source; `result` per-model token stats |
| Copilot CLI | Unverified; AI-credit billing, `--max-ai-credits` soft cap; no documented error/exit contract |
| opencode | `error` record `APIError.statusCode=429`, `isRetryable`, `responseHeaders`; hang risk needs stall watchdog; `step_finish.tokens/cost` (cost 0 means unset for custom providers) |
| pi / prime | Assistant `stopReason:"error"` + `errorMessage` after `auto_retry_*`; reset time in message text; prime exits 0, pi exit unverified; per-message usage |
| dsh | `dsh: QUOTA|RATE_LIMIT: msg` on stderr/stdout, exit 1; no usage on stdout (tokens via the trace plugin) |
| Generic descriptor | Declared `quotaSignal` block (match, class, resetsAt extractor); default stall-and-text classifier |

Host Capability Matrix: none.

## Open questions / risks

1. **DECISIONS-PENDING candidate: pause is a run state, not a stop.** Today's path (exit 4, `proposer_consecutive_errors`, relaunch) would make decision 8 impossible for windows longer than the relaunch budget (A6). Default: pause in the detached runtime; the mixture-of-loops supervisor never sees a stop. If the owner prefers stop-and-relaunch-after-delay, the supervisor needs a `paused-quota` reason and a timed relaunch that spends no budget, and the process cannot hold a lease while waiting.
2. **DECISIONS-PENDING candidate: content capture default reverses `936afea`.** The prompts work captures content whenever traces are on. R11 recommends off by default; this report follows R11. If the owner wants the old behaviour, it becomes a user-scope switch set to `redacted` in his own config.
3. **DECISIONS-PENDING candidate: notional cost on subscriptions.** Claude reports a dollar figure for subscription sessions. Treating it as notional (never real spend) is a design choice; if the owner wants it counted against a dollar cap, the cap would trip on money never charged.
4. **Unverified non-Claude quota surfaces.** Codex, Gemini, Copilot and opencode need one small probe each (a deliberately exhausted low-tier key or a mocked stream), and a captured real `rate_limit_event` for Claude. No probes were run here; no paid calls.
5. **Claude `rate_limit_event` on the CLI stream** is inferred from the SDK type and binary strings (R5 F25), and a summarising documentation fetch contradicted the type file (B2). The adapter must be tested on a captured real stream before the classifier is trusted.
6. **`resetsAt` for Claude API-key sessions and for text-only harnesses** is often `null`; the probe schedule costs small real calls, and a wrong text classification could wait for nothing (mitigated by confirming probes and the ceiling).
7. **`asyncRewake` lifetime and whether hook stdin carries `rate_limits`** remain unverified (R3 open question 2); if it fails, push alerts fall back to the monitor and to `UserPromptSubmit`.
8. **GenAI semantic-convention attribute names** are unverified (the spec moved, R11 F-14); the `genai` dialect is optional for that reason.
9. **Lisa otel is unwired in any run** (R1 B2), so its behaviour is proven by unit tests only; the exporter needs an end-to-end test against a real collector.
10. **Detached-run pause vs host lifetime.** A paused run holds a live process for up to the ceiling; on hosts where the machine sleeps, the wait may overshoot. The resume path must recompute from `resumeAt` on wake, not from a sleep timer alone.
11. **Concurrency of interactive and detached use of one subscription** cannot be measured by the product beyond its own tokens; the digest must say "observed by Specstride only".
12. **R18 (as-is event inventory) was not finished**; Appendix A is a grep, not an authoritative list. Projection rows must be reconciled with R18 before feature 111 is specified.

## Appendix A. Event names found by grep at `9cab15d` (not authoritative; R18 owns)

`run_start`, `run_end`, `run_stop`, `phase_start`, `phase_done`, `proposer_start`, `accelerator_start`, `diagnostician_trigger`, `iter_start`, `iter_done`, `iter_error`, `iter_cap`, `iter_no_progress`, `iter_short_pass`, `pass_killed`, `pass_yield`, `pass_cost_unknown`, `proposer_cap`, `yield_wait`, `yield_resume`, `yield_timeout`, `yield_invalid`, `yield_job_start`, `long_job_start`, `long_job_ended`, `verification_start`, `verification_passed`, `verification_failed`, `verification_release_passed`, `verdict`, `reject`, `critic_malformed`, `gate_oscillation`, `evidence_written`, `evidence_present`, `tasks_ticked`, `progress_swept`, `prestage_done`, `prompt_block_dropped`, `prompt_block_protected`, `git_checkpoint`, `attempt_archived`, `learning_observed`, `knob_adjusted`, `acceleration_note`, `plugin_installed`, `plugin_install_failed`, `plugin_install_denied`, `gates_migrated`, `events_tampered`, `agent_init`, `agent_text`, `agent_tool`, `agent_result`, `agent_diagnostic`, `agent_observability`, `telemetry_delivery`. Sources: `proposer.sh`, `orchestrator.sh`, `lib/*.py` emitters.
