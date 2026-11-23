# Data model: Prime harness adapter (feature 138)

Entities of `spec.md`, with fields, relations and rules. Names of fields of records that feature 100
owns are those of feature 100; nothing is invented that would bind another feature.

## Prime descriptor (`descriptorVersion: 1`)

| Field (annex C §C.2) | Value |
|---|---|
| `id` | `prime` |
| `kind` | `cli` |
| `provider.id` | `prime`; `provider.termsRef` null (unknown terms) |
| `origin` | `adapter` (a tested harness adapter) |
| `detect` | the agent executable, its version flag; the launcher is not probed for a version |
| `auth.tiers` | 1, 2; `auth.credential` a secret reference chosen by the consumer |
| `roles` | proposer supported; critic supported, `toolless: flag`, `readOnlyTools` not supported, `freshSession` |
| `invoke` | the argument table of `plan.md`, per role and mode; prompt on standard input |
| `stream.format` | `jsonl`; `stream.dialect` `prime` |
| `continuation` | supported, by session id inside a session directory (unverified) |
| `failures` | the entries of `contracts/classifier-entries.json` |
| `cost` | class `unknown`, no prices |
| `isolation.envAllow` | the allow-list of F138-FR-005 |
| `isolation.configHome` | the overlay of auth tier 2: the home variable and the session directory variable, no seed; scope `none` under `parity` (F138-FR-045) |
| `containment.ceiling` | C0, provenance: the harness's own statement |
| `memory` | the parts the adapter treats as native memory, each with its switch; off for the critic always, off for the proposer by default; recorded per run; no flag under `parity` (F138-FR-046) |
| customisations | the four kinds of auto-loaded context; off for the critic always, off for the proposer by default (F138-FR-044) |
| identity for the diversity test | the named model on bare prime, null on a variant (F138-FR-047) |
| `telemetry.off` | from the dialect row |
| `concurrentSessions`, `spendLimit` | null |
| `versionRange`, `verifiedOn` | `>=0.7.3 <0.8`, 2026-09-29 |

## Dialect row `prime` (`specstride.stream-dialect/1`)

| Field | Value |
|---|---|
| `dialect` | `prime` |
| `schemaVersions` | [3] |
| `providerFormat` | `prime-v3` |
| `telemetryOff` | the harness variable and the do-not-track variable, with value 0 and 1 |
| `sessionControl` | no-session flag; session-directory flag and variable; resume by id |
| `extraRecords` | none (the row of pi adds its own) |
| `usageNames` | the two spellings of F138-FR-035 |
| `terminalDecides` | true |
| further data (allowed by `additionalProperties`) | line cap and rate cap (values proposed in `contracts/dialect-row-prime.json`) |

## Reader state (per stream)

| Field | Meaning |
|---|---|
| `schemaVersion` | version of the session record, or none |
| `schemaDiagnosed` | whether the schema diagnostic was given (once) |
| `sessionId`, `cwd`, `model`, `provider` | from the session record and message starts |
| `messages` | map message id to content blocks (text, closed) |
| `tools` | map tool id to name, arguments, started, ended |
| `usage` | running totals; `turns` |
| `heldTerminal` | an error recorded before the end of the agent |
| `evidenceTools` | tools that matched the expected evidence path |
| `finished` | whether the end of the stream was processed |

Rules: a stream is read once, in order; `finish` runs once; a record with no accepted schema in force
is ignored (F138-FR-025); a closed text block is never reopened; a terminal that the end of the agent
delivers replaces a held error (F138-FR-033).

## Normalized records produced (six kinds, feature 100 annex C §C.5)

| Kind | Projected as-is event | Fields |
|---|---|---|
| `init` | `agent_init` | schema version, session id, working directory, provider, model, `update` |
| `text` | `agent_text` | message key, message id, content index, text, `final_fragment`, redaction metadata |
| `tool` | `agent_tool`; `evidence_writing` | tool id, tool, status, targets, summary, `is_error`, duration, result summary, redaction metadata; for evidence: the expected path and the match |
| `usage` | (typed; projected only inside the terminal) | increments, usage id, `complete` |
| `error` | `agent_diagnostic` | code, severity, message, record type, redaction metadata, extras |
| `terminal` | the terminal of the invocation | status, reason code, reason, stop reason, model, usage fields |

## Call record additions (written by the engine at the names of annex B §B.5)

| Field | Where |
|---|---|
| Version and resolved path of the agent executable | `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:critic-invocation` |
| Mode of the call (`text`, `json`) | the same |
| Flag set of a critic call | the critic invocation record |
| Proof of the critic's form (outside `parity`; none under `parity`, F100-FR-230): kind (case 2 of F100-FR-230), session id from the initial record, equal to no pass's session id, and the tool list, which must be stated and empty | the critic invocation record |
| Tool allow-list in force | the pass invocation record |
| Containment level and `protection=detect` | the run record |
| Setting of the customisations of the proposer; setting of native memory for both roles | the run record |
| Home of the call: `real` or `throwaway` | `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:critic-invocation` |
| Provider and model identity of each role, or null; result of the diversity test | the run record |

## State transitions

- Pass: not started → refused (empty variant, launcher missing, model with variant, C0 without opt-in, overlay that cannot be built) → started → stream read → terminal → outcome by F138-FR-038.
- Critic call: not started → refused (`critic_not_toolless` before the call, window unknown) → started → stream read (JSON) → proof checked → reply or failure.
