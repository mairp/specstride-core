
## reconcile-2026-11-01
- a) test coverage: uncovered:CT-128-9,PT-128-C-012-startup-line,PT-128-C-021-startup-line,PT-128-C-022-independent-sinks,PT-128-C-174-request-limits,PT-128-C-182-request-limits
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok

## reconcile-2026-11-01 coverage adjudication
- [CT-128-9] found-unlabeled: tests/conformance/eventsink/exporters.test.ts:385 — "T013: every error is contained in the sink, and the sample is the test tree's" (the EP-08 suite above it, tests/conformance/eventsink/exporters.test.ts:374, iterates the caseId table; slow/throwing/dead sink, full-buffer drop, unknown fields ignored)
- [PT-128-C-012-startup-line] found-unlabeled: tests/parity/128/startup-line.test.ts:41 — "off: `  telemetry: off (loki export not configured)`, two leading spaces" (suite is titled "PT-128-C-190-startup-line — the line the exporter prints at startup", line 40; the C-012 slug does not appear)
- [PT-128-C-021-startup-line] found-unlabeled: tests/parity/128/startup-line.test.ts:46 — "on: the fallback status line `<sink>: export configured (<url>)`" (same PT-128-C-190-startup-line suite; receiver-state-when-on assertions live in tests/parity/128/receiver-state.test.ts)
- [PT-128-C-022-independent-sinks] found-unlabeled: tests/parity/128/independent-sinks.test.ts:30 — "each sink keeps its own sequence and its own record; the labels never mix" (suite titled "PT-128-C-201-independent-sinks — one Loki sink and one OTLP exporter at the same time", line 29; sink-death independence at line 72)
- [PT-128-C-174-request-limits] found-unlabeled: packages/observability/test/export/request-limits.test.ts:43 — "PT-128-C-174: the defaults are the requirement's numbers" (bare "PT-128-C-174:" prefix at lines 43, 52, 66, 91, 106, 114, 134, 152; the "-request-limits" slug never appears)
- [PT-128-C-182-request-limits] found-unlabeled: packages/observability/test/export/request-limits.test.ts:176 — "PT-128-C-182: postJson is best-effort — a slow, throwing or dead collector never throws" (also line 257 "PT-128-C-182: the queue bound holds under flood"; the "-request-limits" slug never appears)

## reconcile-2026-11-01
- a) test coverage: ok
- b) unresolved markers: ok
- c) dangling refs: ok
- d) headers: ok
- e) analyze-report: ok
