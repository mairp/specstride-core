# Data model: Adapter for pi (feature 134)

Entities in words. Schemas are those of feature 100 (annex C §C.2, §C.5, §C.13); this feature holds data conforming to them.

| Entity | Fields that matter here | Owner of the schema | Written by | Read by |
|---|---|---|---|---|
| Harness descriptor of pi | `id` = `pi`; `kind` = `cli`; `provider.id` set from the provider in use; `provider.termsRef`; `auth.tiers` = 1, 2; `auth.credential` = secret reference; `roles` (proposer supported; critic `toolless: flag`, `readOnlyTools` not supported, `freshSession`); `invoke` per role; `stream.format` = `jsonl`; `stream.dialect` = `pi`; `continuation`; `session`; `failures`; `cost` class `unknown`; `isolation.envAllow`, `isolation.configHome`; `containment.ceiling` = C0 with provenance `adapter`; `memory`; `telemetry.off`; `concurrentSessions` null; `spendLimit` null; `transports` one `subprocess`; `versionRange`, `verifiedOn` | 100 (annex C §C.2), 109 | Product data | Loader of 109, doctor |
| Dialect row `pi` | `dialect`, `schemaVersions` = 3, `providerFormat`, `telemetryOff`, `sessionControl`, `extraRecords`, `usageNames`, `terminalDecides` = true | 100 (annex C §C.5), 138 | Product data | The JSONL reader, the adapter, the doctor |
| Classifier entry | Pattern over the message text, class, whether a reset time is parsed, confidence `text` | 100 (annex C §C.13), 127 | Product data and code | The quota classifier |
| Proof record of a critic call | Identity minted; identity seen; tool list seen or not stated; kind of proof (`initial-record` or `flags-and-pin`); outcome | 109 (call record) | The adapter, per critic call | The call record, the doctor, the digest |
| Terms facts of pi | Software, tier, audience, status, source, access date, quoted sentence, `verified-on` | 147 (terms data) | Handed over as data | The terms gate |
| Recorded fixture | Stream or message text, pin, capture date, the log of the capture | 141 (§O.7) | Capture task | Conformance suites |
| Capture log | Which capture, when, which pi version, paid or not, by whose authorization, result | This feature | The person who authorizes the probe | Review |

Relations: a descriptor names one dialect row; a critic call has one proof record; a fixture belongs to a capture; a classifier entry produces a class of the closed set of annex X §X.6 row 46.

State transitions: a fact of the descriptor is `unverified` until a capture or a probe logs it, and then carries `verified-on` and the pin. A version outside the range does not change the descriptor; it raises a doctor warning.
