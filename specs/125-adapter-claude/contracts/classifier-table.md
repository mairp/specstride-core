# Classifier entries of Claude (F125-FR-031)

Pure table, no I/O, no clock, no model. Classes and confidences are the closed sets of annex C §C.13. The
port's typed failure (annex C §C.1) is in the last column of the first table.

`retryable` is a value of the class, not of the row: true for `quota_window`, `rate_limit_transient`,
`overload`, `agent_failure` and `provider_other`; false for `quota_credit`, `auth`, `context_window` and
`budget_cap`. The values are those that the cross-feature review gives for the class table of the quota
classifier (annex C §C.13 of feature 100; feature 127, §Q.1) and agree with annex E §E.3 of feature 100,
where a stop by `provider_other` errors is `retryable: true`. If the class table states another value,
this table follows it.

Every row is `unverified` until fixture capture C has a real limit event on the CLI stream. The capture
is paid and no test waits for it: the tests replay streams written from the shapes below. Sources:
R5 Q8 and F23 to F27; R14 B1 to B5. The shapes of the limit event rest on the type file of the SDK and
on strings of the binary.

## From the stream of the CLI and of the SDK

| # | Signal | Class | Confidence | `resetsAt` | `retryable` | Port failure |
|---|---|---|---|---|---|---|
| 1 | Limit event, status `rejected` | `quota_window` | `structured` | The value of the event; unit fixed by capture C | true | `quota_exhausted` |
| 2 | Limit event, status `allowed_warning` | none: an `observe` gauge with `utilization` | — | — | — | none |
| 3 | Limit event with the code `credits_required` | `quota_credit` | `structured` | null | false | `quota_exhausted` |
| 4 | Retry event, category `rate_limit` | `rate_limit_transient` | `structured` | null | true | `rate_limited` |
| 5 | Retry event or error, category `overloaded` (status 529) | `overload` | `structured` | null | true | `transport_failed` |
| 6 | Retry event or error, category `billing_error` | `quota_credit` | `structured` | null | false | `quota_exhausted` |
| 7 | Retry event or error, category `authentication_failed` | `auth` | `structured` | null | false | `authentication_failed` |
| 8 | Retry event or error, category `server_error` | `provider_other` | `structured` | null | true | `transport_failed` |
| 9 | Final record, subtype `error_max_budget_usd` | `budget_cap` | `structured` | null | false | `agent_failure` |
| 10 | Final record, subtype `error_max_turns` | `agent_failure` | `structured` | null | true | `agent_failure` |
| 11 | Result text "session limit", "weekly limit", "Opus limit", "Sonnet limit" | `quota_window` | `text` | null (the time in the text is local and ambiguous) | true | `quota_exhausted` |
| 12 | Result text "Credit balance is too low", a spend-limit variant | `quota_credit` | `text` | null | false | `quota_exhausted` |
| 13 | Result text "Request rejected (429)" | `rate_limit_transient` | `text` | null | true | `rate_limited` |
| 14 | Result text "Server is temporarily limiting requests (not your usage limit)" | `rate_limit_transient` | `text` | null | true | `rate_limited` |
| 15 | Result text "Prompt is too long" | `context_window` | `text` | null | false | `context_window_exceeded` |
| 16 | Exit 143 | none: a stop the caller asked for | — | — | — | none |
| 17 | Any other non-zero exit, or a stream without a terminal record | `agent_failure` | `status` | null | true | `agent_failure` |
| 18 | Anything else | `provider_other` | `text` | null | true | `agent_failure` |

Rows 11 to 15 are the fallback that Lisa's harness kept as text patterns after native codes
(F125-FR-039). A quota class with the confidence `text` pauses only after the confirming probe of the
engine (annex C §C.13).

## From the direct call at auth tier 2

| Status | Class | Confidence | `resetsAt` | `retryable` |
|---|---|---|---|---|
| 401, 403 | `auth` | `status` | null | false |
| 402, or a billing error in the body | `quota_credit` | `status` | null | false |
| 429 | `rate_limit_transient` | `status` | The value of `retry-after` where present, else null | true |
| 529 | `overload` | `status` | null | true |
| 400 with a too-long prompt in the body | `context_window` | `status` | null | false |
| Other 4xx and 5xx | `provider_other` | `status` | null | true |
| No reply (hang, reset, refused redirect) | none: `transport_failed` | — | — | — |

## Usage (F125-FR-032)

| Source | Field | Use |
|---|---|---|
| Assistant record | per-call usage | An increment per model call, as it completes |
| Final record | per-model breakdown | Preferred to the top-level usage, which covers the main loop only |
| Final record | total cost | An estimate; cumulative for a continued session, so the delta per session id is recorded; notional at auth tier 1; null for a killed pass |
| Messages call | `usage` | Input, output and cache tokens; cost null (the messages call reports none) |
