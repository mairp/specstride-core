# Research: Telemetry export (feature 128)

Decisions for the plan. The reports live in `docs/ecosystem/research/`; this file summarizes them and links to them.

## Sources read

| Source | Used for |
|---|---|
| R14 quotas, cost and observability | The OTel mapping, the event pairs (EV-23), the span hierarchy, the metric families, the legacy-names waiver, the content rule (superseded on capture by ruling 43) |
| R11 threat model | R-3, T-32 (content on spans), T-36 (endpoints), T-37 (an exporter that blocks), F-12 (widened patterns) |
| R1, R1v Lisa reuse | The package `otel` is extracted whole; it was never called by a run (B2); RL-OTEL-01 to RL-OTEL-08 |
| R16 doctor and config | Check 42 `telemetry.endpoint`; the keys `telemetry.enabled`, `telemetry.lokiUrl`, `telemetry.otel.*` |
| R17 context efficiency | The context-budget report (`context-budget.json`) |
| R2v non-code assets | The `telemetry/` directory is data, carried as files |
| R18 behaviour inventory | The 191 items assigned to this feature, read as `B-nnnn` text |
| Baseline `9cab15d` | `lib/ralph_loki_ship.py`, `lib/ralph_otel_ship.py`, `lib/telemetry_delivery.py`, `telemetry/` (read with `git show`) |
| Lisa `363e6a3` | `packages/otel` (`loki.ts`, `otlp.ts`, `metrics.ts`, `tracer.ts`) |
| Feature 100 | Annex C §C.10 (EP-08), annex X §X.1, §X.2, §X.4, §X.6, §X.7 (rows 16, 17, 42), §X.8 (aliases, component names, N-26), §X.9 (T-32, T-36, T-37), annex B §B.5 |
| Feature 141 | FX-31, the telemetry sink stub (verbs `accept`, `refuse`, `down`), the surface `telemetry` |

## Decisions

**D1. Start from Lisa's package.** Decision 11 says one exporter and R1 says extract the package whole: it has no SDK, is best-effort, and builds OTLP by hand. Because no run ever called it, the first task writes characterization tests of its behaviour at `363e6a3`, and the last proves it against a real collector. Alternatives: rewrite from the Python shippers (loses Lisa's tested encoder); adopt the OpenTelemetry SDK (a dependency surface that Principle VI keeps small, and hard to keep best-effort).

**D2. Two forms of a payload, following `compat.legacyEvents`.** FX-31 compares payload shapes with the baseline, in which every event has an as-is name and a logfmt line. Under `parity` the compatibility projection is on, so the as-is form follows that switch and no new switch is needed. Alternative: a switch of its own (`telemetry.payloadForm`); rejected because F100-FR-211 fixes the profile rows and one more row would need feature 100 to change.

**D3. One logfmt line for both sinks.** As in both baselines, the Loki entry and the OTLP log body are the same string from one encoder. R14 proposed a JSON body; the shipped dashboard unwraps logfmt fields, and a collector with a logfmt parser reproduces them.

**D4. Spans are built at emit time.** EV-23: the span is built from the pair when the closing event arrives and sent at close, with the start time of the opening event. The open scopes are kept at `run:<runId>:span-state`, so that a relaunch joins the same trace. This replaces the baseline's reconstruction at ship time in a per-run file under a cache directory. The trace id rule (`sha256("specstride:" + run id)`, first 32 hex characters, or the inbound id) is kept so that every launch lands in one trace.

**D5. Sink labels `loki` and `otel`.** Defect D-40: the baseline's OTLP record said `otlp` while every status surface asked for `otel`, so no record ever raised the displayed state. The record now carries the label that is queried. FX-31 waives the scenario `delivery-status` under DV-058. A comparison with the reference cannot prove a fix, so the label is proven by the characterization test CT-128-23 (added 2026-09-30).

**D6. Content through the accessor only.** The exporter does not read files of the control plane and does not redact. It attaches what the accessor of the core returns; where the accessor returns nothing, the reference goes in its place and a delivery record with the reason `content_withheld` says so. This keeps one redaction point (F100-FR-205).

**D7. The old metric names are an opt-in that adds, never replaces.** R14's waiver: `otel.legacyMetricNames` sends the six `ralph.*` metrics from the same records beside the new ones. Row 42 of annex X §X.7 says off under `parity`; the scenario `metric-names` is waived.

**D8. Delta metrics, one recorder.** Sums are monotonic delta with the exporter start as start time; the histogram bounds are the baseline's eight (ms). The metric families of R14 are the new names; Lisa's six families map onto them (jobs by state to `specstride.run.state`, phase durations to the phase span, verdicts to `specstride.verdict`, tokens and cost to `specstride.tokens` and `specstride.cost.usd`, approval latency to `specstride.blocked.duration`; queue depth is not in Wave 1).

**D9. The stack is data.** Nine files under `assets/telemetry/`, carried as they are with the changes of the spec: the project name, the removed `WIGGUM_*` fallbacks, ports bound to loopback, a second dashboard for the new form. Nothing starts it. Alternative: a `specstride telemetry up` command; rejected because feature 100 has no such verb and the stack is optional.

**D10. Buffer, flush and time limits.** `write` only buffers. A flush interval of 2000 ms batches in normal use; the value 0 flushes at every event and reproduces the baseline's one-event-per-request payload shape under `parity`. The buffer is bounded and drops the newest events with a record when full.

## Open points (all proceed on a recommendation; see `spec.md` "Assumptions")

| Id | Point | Recommendation |
|---|---|---|
| CQ-119 | A sink needs the as-is name of an event | Read access to the table of the compatibility projection in the context of `open` |
| CQ-120 | `SPECSTRIDE_OTEL_STATE_DIR` against the logical name of span state | Accepted, no effect, launch message |
| CQ-121 | Who prints the four summary lines of the stream | The presenter, in compatibility output |
| CQ-122 | Label of the start-up telemetry line | The as-is text; the printer owns the label |
| CQ-123 | Logical name of the context-budget report | `package:context-budget` (annex B §B.5 holds it since 2026-09-30) |
| CQ-128 | DV-083 against the `result_preview` of the baseline | The field is content; register row DV-107 carries the waiver |
| CQ-124 | Masking of the nonce in critic content | Export after the call returned, nonce replaced by its hash |
| CQ-125 | https outside loopback for telemetry endpoints | Yes, as T-16 |
| CQ-126 | Who registers the doctor check | Feature 112; the facts are given here |
| CQ-127 | A traces pipeline in the shipped collector | No, as the baseline |

## Facts that stay `unverified`

- The attribute names of the `genai` and `openinference` dialects (the conventions were reported as moved, R11 F-14).
- That a collector without a traces pipeline answers the traces request in a way that does not change the batch verdict, at the collector version of the stack.
- Every macOS statement: the lock and the replace of the span-state file, and the container engine.
- The versions of the images in the compose file (Loki 3.1.1, the OpenTelemetry collector contrib 0.109.0, Prometheus v2.54.1, Grafana 11.2.0 at the baseline): kept as the baseline names them; the end-to-end task records the versions it ran. These are the pins that row X of the Constitution Check of `plan.md` cites. The versions of the two attribute conventions of the dialects are not pinned yet: task T072 records them.
