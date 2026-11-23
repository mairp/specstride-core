# Data model: Stream seam and invocation

Fields in words. Every record carries `schema`. Unknown values are null.

## Format row

| Field | Meaning |
|---|---|
| `name`, `aliases` | Lower-case names; unique across the registry |
| `reason` | Non-empty capability reason |
| `signals` | Ordered subset of `init,text,tool,evidence,result` |
| `hasInitRecord`, `synthInit`, `synthTerminal`, `noActivity`, `trackTerminal` | Options; defaults true, false, false, false, false |
| `trackTerminal` | The terminal of the pass is tracked: the pass is terminal-tracked (F126-FR-039), so it is correlated and the tap is given the provider-terminal destination (F126-FR-012, F126-FR-031). For a format of the JSONL family the value is that of the row of the dialect table (annex C §C.5, which the row of prime sets; CQ-227) |
| `terminalDecides` | The outcome comes from the terminal record. For a format of the JSONL family the value is that of the row of the dialect table (annex C §C.5) |
| `listedAsIs` | Default false. Set only on `claude` and `prime-v3`: the listing of formats under the `parity` profile shows only these rows (F126-FR-013) |
| `reader` | A code reader, or a mapping (`selector`, field paths, `usage` paths, `tolerate`, `dialect`) |

## Normalized record

| Field | Meaning |
|---|---|
| `kind` | `init`, `text`, `tool`, `usage`, `error`, `terminal` |
| `sessionId`, `parentSessionId` | Session of the record; parent for subagent activity |
| `synthesized` | True for a record the seam made up |
| kind fields | As F126-FR-002 |

## Invocation identity and artifacts

| Record | Fields |
|---|---|
| Identity | run id, feature, role, harness label, phase, attempt, iteration, invocation id. In the schema files: `runId`, `feature`, `role`, `harness`, `phase`, `attempt`, `iteration`, `invocationId`. The harness label is a value only (F126-FR-039) |
| Invocation record | `schema`, identity, `observabilityMode`, `providerFormat`, `expectedEvidence`, `createdAt` |
| Producer status | `schema`, `producer_exit_code`, `producer_signal`, `parser_exit_code`, `timed_out`, `launch_failed`, `duration_ms` |
| Provider terminal | `schema`, `provider_terminal` or null, `malformed_stream` |
| Result | `schema`, identity, `status`, `is_error`, `reason_code`, `reason`, `source`, `provider_status`, `provider_stop_reason`, the producer fields, `finalized_at`, copied provider fields |
| Breaker fields (in the ledger `core` counters) | `count`, `cap_count`, `last_invocation_id`, `last_reason_code`, `last_kill_class` |

## States of an invocation

created (record written) -> stream read -> producer status and provider terminal written -> finalized (result written once) -> pruned (raw files, then record; never the result).

## Where a difference between harnesses is read

No code of this feature tests a harness name (F126-FR-039). The data is read from the resolved registry.

| Condition | Read from |
|---|---|
| The pass has a route | The entry of the resolved registry names a stream format (descriptor field `stream.format`, annex C §C.2) |
| Registry-routed | The route of F126-FR-014 resolved the format to a reader that started |
| Terminal-tracked | `trackTerminal` of the format row, or, for a format of the JSONL family, of the row of the dialect table (annex C §C.5; CQ-227) |
| Provider format | The canonical name of the format row; for the JSONL family `providerFormat` of the row of the dialect table that `stream.dialect` names |
| The terminal decides | `terminalDecides` of the format row or of the dialect row |
| Caps of a line | `stream.limits.*`, or `limits` of the dialect row |

## What a sink receives

The event of annex X §X.1, whole and redacted, after the primary write: `schema`, `v`, `seq`, `ts`, `type`, the identity fields, `data`. An event whose local append failed has no `seq` and reaches no sink (F126-FR-016). The as-is form (no `ts`, `time`, `event`; position `sequence`) exists only in the compatibility projection (F126-FR-020, F126-FR-021).
