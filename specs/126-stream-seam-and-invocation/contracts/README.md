# Contracts of feature 126

Content owned here (feature 100 annex C §C.5 names the sub-point; annex B §B.20 names the four
invocation artifacts and their owner, feature 126).

## Records with a schema id of feature 100

| Contract | Schema id | Named in | Logical name | Schema file | As-is literal of the compatibility form |
|---|---|---|---|---|---|
| Invocation record | `specstride.invocation/1` | Annex B §B.20 | `pass:<passId>:invocation` | `schemas/invocation.schema.json` | `specstride-invocation/v1` |
| Producer status | `specstride.producer-status/1` | Annex B §B.20 | `pass:<passId>:producer-status` | `schemas/producer-status.schema.json` | `specstride-producer-status/v1` |
| Provider terminal | `specstride.provider-terminal/1` | Annex B §B.20 | `pass:<passId>:provider-terminal` | `schemas/provider-terminal.schema.json` | `specstride-provider-terminal/v1` |
| Result | `specstride.invocation-result/1` | Annex B §B.20 | `pass:<passId>:result` | `schemas/invocation-result.schema.json` | `specstride-invocation-result/v1` |

Every schema file requires the field `schema`, whose value is the schema id with its version
(annex B §B.4). The `$id` of a file is `urn:specstride:schema:<schema id>`, as
`specs/100-specstride/contracts/README.md` states. The files are delivered to the `contracts`
package by task T002.

## Content without a schema id of feature 100

| Content | Name used in this feature | State |
|---|---|---|
| Format row of the registry | `specstride.stream-format/1` | No annex of feature 100 names the id. Reported to the orchestrator; until feature 100 names it, no schema file is written and no other feature reads the id. The fields are in `data-model.md` |
| Normalized records | `specstride.stream-record/1` | The same. The kinds are closed set row 38 of annex X §X.6; the fields are F126-FR-002 |

## What this feature reads

| Contract | Owner | Use |
|---|---|---|
| Harness descriptor, fields `stream.*` (annex C §C.2) | 100 | The route and the data mapping |
| Dialect table `specstride.stream-dialect/1` (annex C §C.5) | 138; one row 134 | `providerFormat`, `terminalDecides`, `limits` |
| Event envelope `specstride.event/1` (annex X §X.1) | 100; content 111 | What the one event writer writes and what a sink receives, whole |
| Event sink `specstride.event-sink/1` (annex C §C.10) | 100; content 111 | Local first: a sink is called only after the primary write |

## What this feature offers to the engine

| Contract | Declared in | Implemented in | State |
|---|---|---|---|
| Invocation functions: `reconcile`, `finalize` (six outputs and exit code of F126-FR-034), `sweepRetention` | `@specstride/contracts`, as a plain function interface handed in by the composition root | `packages/harness/src/invocation/` (task T045) | Proposed upstream as F100-FR-237 (`../analyze-report.md`, "Proposed upstream fixes", P1) |

## Stream format rows registered here

`claude`, `text`, `sse-openai`, `sse-anthropic` (F126-FR-040; the two SSE rows are data mappings over the SSE framing). `jsonl` and `prime-v3` are registered by feature 138.
