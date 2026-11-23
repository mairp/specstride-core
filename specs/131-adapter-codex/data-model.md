# Data model: Codex harness adapter (feature 131)

| Entity | Fields | Rules |
|---|---|---|
| Descriptor | `descriptorVersion` 1; `id`; `kind` `cli`; `provider.id` `openai`; `provider.termsRef`; `auth.tiers` [1, 2]; `roles`; `invoke`; `stream.format` `jsonl`; `stream.mapping`; `continuation`; `session`; `failures`; `cost`; `isolation`; `containment.ceiling` C2; `memory`; `concurrentSessions` null; `spendLimit` null; `transports`; `versionRange`; `verifiedOn` | Data only; argument lists are lists (F131-FR-001) |
| Stream mapping | Rows of {record kind selector, normalized kind, field paths} | Six normalized kinds; other records dropped with a diagnostic (F131-FR-036) |
| Classifier entry | {source, pattern or status, class, confidence, retryable, resetsAt rule} | Entries for login text, 429, exhausted credit, 401 and no match. `retryable` follows the class: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure`, `provider_other`; false for `quota_credit`, `auth`, `context_window`, `budget_cap` (F131-FR-032, F131-FR-033) |
| Terms row | provider, auth tier, audience, status, source, access date, quoted sentence, `verified-on` | Two tiers by two audiences |
| Window table | model id → tokens, provenance `adapter`, date | Parity fallback 128,000 is not in the table |
| Call record of form (a) | mode, network setting, ephemeral flag, session id, `confirmed`, source of each fact | Written by the engine (F131-FR-020) |
| Identity of a critic-class call | provider, model id sent, or null; result of the diversity test (`same-model`, `same-provider`, `unverified` or none); whether the critic-diversity warning was raised | Both forms; the provider of form (b) comes from the host of the endpoint (F131-FR-040) |
| Opt-ins of the proposer | `memory.native.proposer`; `harnesses.codex.proposerCustomisations` (`off`, `on`; default `off`); `sandbox.level: C0` from user configuration only | Recorded per run; never loaded into a critic-class call (F131-FR-010, F131-FR-014) |
| Capture | number 1 to 5, paid (true for 1, 2, 4, 5; false for 3), command, date, harness version, result, fixture file | Logged; blocks the closing of a status only (F131-FR-037) |
| Probe | role or form, paid (always true), cost, date, command, version, result | Logged; no test waits for it (F131-FR-038) |

State transitions: a form (a) call is `refused` (record, moved files, denial or proof fails), `made`, or `failed`; only `made` may give a reply.
