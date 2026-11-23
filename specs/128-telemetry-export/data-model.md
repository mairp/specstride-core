# Data model: Telemetry export (feature 128)

Entities in words and field lists. Fields follow the conventions of feature 100 (`schema` field, typed values, null for unknown, absence for not applicable).

## Sink

A destination that receives events after the primary write. Two implementations: the Loki sink (label `loki`) and the OTLP exporter (label `otel`).

| Field | Meaning |
|---|---|
| `label` | `loki` or `otel`; the label of every delivery record of the sink |
| `enabled` | From `telemetry.enabled` or `telemetry.otel.enabled` |
| `address` | Base address without a trailing slash; never holds a user name or a password |
| `acceptsMajors` | The range of event schema majors the sink accepts |
| `buffer` | Events not yet flushed; bounded by `telemetry.queueMaxEvents` |
| `timeoutMs`, `maxBatchBytes` | From the keys of F128-FR-010 |

## Batch and delivery record

One batch is what one flush sends. It has one delivery record, the event `telemetry.delivery` (fields defined by feature 111; this feature fills them).

| Field | Content |
|---|---|
| `sink` | `loki` or `otel` |
| `batchId` | `<sink>-<time in nanoseconds>-<sequence>`; the sequence rises within the exporter start |
| `eventCount` | Number of events of the batch; for `content_withheld` the number of items withheld |
| `status` | `attempted`, `accepted`, `failed`, `unknown` |
| `httpStatus` | The HTTP status; absent when there was none |
| `reason` | `http_<status>`, `transport_error`, `queue_overflow`, `content_withheld`; absent on `accepted` |
| `queryVerified` | Only ever read; nothing here sets it |

Rules: no record for a flush with nothing buffered; a raising flush gives `failed` with `transport_error`; a status outside the set is written `unknown`; a record is never delivered to a remote sink; an OTLP batch is `failed` when the logs request or the metrics request fails, and the traces request never changes the verdict.

## Receiver state

| State | Holds when | Phrase |
|---|---|---|
| `configured` | The sink is on | `export configured` |
| `reachable` | A TCP connection to host and port succeeds within 1.5 s (443 for https, else 80) | `endpoint reachable` |
| `request_accepted` | A record of the sink with the status `accepted` exists | `events accepted` |
| `query_verified` | That record has a true `queryVerified` | `query-verified` |

The displayed state is the highest that is proved. Lines: `<sink>: <phrase>`; with the probe `<sink>: <phrase> (<url>)`; fallback `<sink>: export configured (<url>)`.

## Span

| Field | Content |
|---|---|
| `scope` | One of the sixteen of `contracts/span-scopes.tsv` |
| `traceId` | 32 hex characters; the inbound id, or the first 32 hex characters of the SHA-256 hash of `specstride:` and the run id |
| `spanId`, `parentSpanId` | 16 hex characters; 8 random bytes |
| `name` | Span name of the form in force |
| `kind` | INTERNAL (1) |
| `startTimeUnixNano`, `endTimeUnixNano` | The start from the opening event, the end from the closing event |
| `attributes` | Fields of the opener and of the closer that do not collide; `specstride.scope`, `specstride.closed_by`; envelope ids under the names of `contracts/attribute-names.tsv`; content attributes only while capture is on |
| `status` | Unset, or code 2 with a message on error |

A point span has the scope of its innermost open scope as parent, carries `specstride.event`, and has zero length, except a tool call, which ends at the next event of the process or at the flush.

## Span state

The file `run:<runId>:span-state` (schema in `contracts/span-state.schema.json`): `schema` with the value `specstride.span-state/1` (the schema id with its major, annex B §B.20 of feature 100; there is no field `v`), `runId`, `traceId`, `stack` of open scopes. One writer (the exporter). Replaced whole under a lock of its own. Removed with the run, and removed when older than 7 days at the start of another run.

## Metric

See `contracts/metrics.tsv`. Sums are monotonic with delta temporality and the exporter start as start time; the histogram bounds are 100, 500, 1000, 5000, 10000, 30000, 60000, 120000 ms.

## Content

| Field | Content |
|---|---|
| `reference` | Path (logical name), SHA-256 hash, size in bytes; always present |
| `text` | The redacted text, cut to the cap; present only while traces and capture are on and the accessor returned it |
| Attributes | Reference of the prompt: `specstride.prompt.path`, `specstride.prompt.sha256`, `specstride.prompt.bytes`; reference of the reply: `specstride.reply.path`, `specstride.reply.sha256`, `specstride.reply.bytes`; text: `input.value`, `output.value` |

## Form of a payload

`contracts/payload-forms.tsv`. Chosen once per exporter start from `compat.legacyEvents`.

## Closed sets

The sets of the spec's section "Closed sets": sink labels, receiver states, delivery reasons, OTLP signals, attribute dialects, scopes of a span, metric names, forms of a payload.
