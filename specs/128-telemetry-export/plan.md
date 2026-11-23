# Implementation Plan: Telemetry export (feature 128)

**Branch**: `128-telemetry-export` (a label; the directory is `specs/128-telemetry-export`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/128-telemetry-export/spec.md`

## Summary

Feature 128 builds the one exporter of the product: an OTLP exporter and a Loki sink, both implementations of the event sink of feature 100, and the optional telemetry stack as data files.

| Deliverable | What it is | Requirements |
|---|---|---|
| Enablement and inputs | Off by default, addresses, flags, aliases, tuning, forms of a payload | F128-FR-001 to F128-FR-010 |
| OTLP exporter | Logs, spans built at emit time, span state, trace identity, delivery of a batch | F128-FR-011 to F128-FR-019 |
| Loki sink | Push, labels, logfmt, the fields of a shipped event, summary lines, warnings | F128-FR-020 to F128-FR-025 |
| Delivery and status | Delivery record, reasons, receiver state, start-up line | F128-FR-026 to F128-FR-029 |
| Metrics | Names, aggregation, old names as an opt-in, dialects, context-budget gauges, Lisa extraction | F128-FR-030 to F128-FR-035 |
| Content and the stack | Capture policy, accessor, canary, endpoints and credentials, doctor facts, assets | F128-FR-036 to F128-FR-045 |

Approach. The exporter starts from Lisa's package `otel` (`363e6a3`), extracted as source and rewritten where the specification differs: characterization tests first (CT-128-11), then the port of the Specstride payload rules on top. The wire formats are built by hand, as in both baselines, with no OpenTelemetry SDK. The span table, the metric table, the attribute names and the keys are data files (`contracts/`) that the exporter reads and that a consistency test checks against `spec.md`. The as-is form of a payload takes its names from the table of the compatibility projection, so the exporter holds no second copy of the old vocabulary except the three names only the shippers used (`api_request`, `tool_use`, `gate`).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (envelope, closed sets, logical names, the sink interface, the secret-resolver interface); `@specstride/kernel` (the redaction point, through which the text of a warning passes, F128-FR-025; the atomic write of the span-state file). These two are all that the package graph of feature 100 lets `@specstride/observability` import. The JSON Schema validator that feature 100 chose, for the span-state file. No OpenTelemetry SDK and no other runtime dependency: HTTP is the `fetch` that Node ships, timeouts are `AbortSignal.timeout`, hashing and random bytes are `node:crypto`, the probe is `node:net`. The exporter imports interfaces only and is registered through the registration call of EP-08

**Storage**: one file, `run:<runId>:span-state` (control plane, written by replacing the file whole, under a lock of its own). The delivery evidence is the events `telemetry.delivery` in the event file; there is no other ledger and no spool. Assets are files in the package (`package:` root)

**Testing**: the test runner that Node ships. Parity tests on FX-31 at the telemetry sink stub of feature 141 (surface `telemetry`, rule N-26). Characterization tests CT-128-1 to CT-128-8 on the assets, CT-128-11 on Lisa's exporter as extracted, CT-128-23 on the sink label of the delivery record (the fix of defect D-40, which a comparison with the reference cannot prove). The conformance suite of EP-08 on both sinks (CT-128-9). An end-to-end test against a real collector (CT-128-12): the collector binary or image is found at run time and the test is skipped with its reason where none is available (Principle XVII); no paid call. The canary test on both sinks (CT-128-13) is a release test

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): the span-state lock and replace, and the container engine of the stack, are checked on a macOS runner

**Project Type**: one directory, `src/export/`, of the package `@specstride/observability` of the npm workspace (layer L1; owners 111, 128 and 144 in `specs/100-specstride/contracts/data/package-graph.json`), with `src/export/loki`, `otlp`, `spans`, `metrics`, `delivery`, `content`, `forms`, `probe` and `doctor`, plus data in `data/export/` and assets in `assets/telemetry/`. The core never imports it

**Performance Goals**: starting values with low confidence. `write` adds under 1 ms and never touches the network; a request is bounded by 2500 ms; a buffer holds 10000 events; the flush interval is 2000 ms

**Constraints**: best effort; no throw into the loop; nothing on standard output; content only through the accessor; one exporter; no native module; MIT-compatible dependencies; no name or path of the owner's machines; a locally registered backend is never named

**Scale/Scope**: 45 functional requirements, 10 success criteria, 16 span scopes, 12 metrics and 6 old-named metrics, 9 asset files of the stack

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I-V)**

- [x] I. Pass. The only state is the span-state file and the events; readers and writers coordinate through files. The exporter is a sink called by the event writer; it carries no control flow and no watcher
- [x] II. Pass. The exporter never approves and never gives a verdict, an exit code or a stop reason. The nonce of a critic call is on no span (F128-FR-038)
- [x] III. Pass. Text from a collector (a response body, an exception) passes the redaction point before it is printed (F128-FR-025); content reaches a span only through the accessor (F128-FR-037). The span-state file is a path that grounding refuses (F100-FR-037)
- [x] IV. N/A. The feature parses no spec grammar
- [x] V. Pass. This is the principle of the feature: local file first; a slow, failing or dead collector is skipped; a full buffer drops events for that sink and records it (F128-FR-008, F128-FR-013, F128-FR-026)

**The product and its edges (VI-XII)**

- [x] VI. Pass. Strict TypeScript; the wire formats are built by hand with no SDK; the exporter is an edge behind EP-08, has a conformance suite and a sample sink outside the core, and no install script; the assets are data
- [x] VII. Pass. No requirement lists harnesses; the label `harness` and the attribute `specstride.harness` carry the value the run recorded
- [x] VIII. N/A. The exporter starts no proposer pass. The environment names it reads are the aliases of the alias table of annex X §X.8 and of §K.8 of feature 110 (F128-FR-002, F128-FR-004, F128-FR-010)
- [x] IX. N/A. The exporter gives no tool to a critic. The critic prompt reaches a span only after the call returned
- [x] X. Pass. The versions of the images of the stack, the collector among them, are pinned in `research.md` ("Facts that stay `unverified`"), as the baseline names them. The versions of the attribute conventions of the dialects are not pinned yet: task T072 records them, and until then the attribute names of both dialects are `unverified` and the dialects are off by default (F128-FR-033). Every such fact is `unverified` until the checks of `tasks.md` run
- [x] XI. Pass. Content follows traces and always passes the redaction point, which fails closed; unknown values are null; the cost of a subscription stays labelled `billing` (F128-FR-030, F128-FR-036, F128-FR-037)
- [x] XII. Pass. No test calls a paid API; collector credentials are references, resolved at the moment of use and bound to the host (F128-FR-040); provider and convention facts are `unverified`

**The host skill (XIII-XVII)**

- [x] XIII. Pass. The exporter reports facts of the run; it judges nothing
- [x] XIV. N/A. No verification command is declared or invented
- [x] XV. N/A. No launch consent is involved
- [x] XVI. N/A. The exporter neither relaunches nor supervises
- [x] XVII. Pass. A missing collector binary, a missing container engine or a missing macOS runner is a skip with its reason, never a pass
- [x] XX. Pass. The events `parallel.*` are spans of a group and of a worker; the exporter adds nothing to the decisions of a group and reports no count that could reach the critic

**The rewrite (XVIII-XIX)**

- [x] XVIII. Pass. Every kept as-is item and requirement of the traceability rows is in the `origin:` of a requirement and in the `proves:` of a test task; the payloads are compared at the stub sink through N-26; intended differences are the rows DV-058, DV-083 and DV-107, with waivers on the scenarios `metric-names` and `delivery-status` and on the absent field `result_preview`; the fix of defect D-40 has a characterization test (CT-128-23); the sources are read with `git show` only
- [x] XIX. Pass. The exporter prints nothing into a host session; the doctor facts are short

Every gate passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. Points that read near a rule of feature 100 are reported, not worked around: the as-is names for a sink (CQ-119) and the content accessor. The logical name of the context-budget report is in annex B §B.5 since 2026-09-30 (CQ-123).

**Re-check after the cross-feature review (2026-09-30)**: unchanged. No principle was reported as marked passed against the text. Row X now says where the versions are pinned and which are not.

## Project Structure

### Documentation (this feature)

```text
specs/128-telemetry-export/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── span-scopes.tsv
│   ├── as-is-openers-closers.tsv
│   ├── metrics.tsv
│   ├── attribute-names.tsv
│   ├── config-keys.tsv
│   ├── payload-forms.tsv
│   └── span-state.schema.json
├── tasks.md
├── analyze-report.md
└── repair-report.md
```

### Source Code (repository root)

```text
packages/observability/             # @specstride/observability, L1; shared with features 111 and 144; never imported by the core
├── data/export/                    # span-scopes.tsv, metrics.tsv, attribute-names.tsv, config-keys.tsv, payload-forms.tsv, the schema
├── src/export/                     # the exporter of this feature
│   └── {loki,otlp,spans,metrics,delivery,content,forms,probe,doctor}/
├── assets/telemetry/               # the stack as data: docker-compose.yml, dashboards/, loki/, otel/, prometheus/, provisioning/
└── test/export/
tests/parity/128/                   # parity tests on FX-31 at the telemetry sink stub
tests/characterization/128/         # CT-128-1 to CT-128-8 (assets), CT-128-11 (Lisa's exporter as extracted), CT-128-23 (sink label)
tests/conformance/eventsink/        # the EP-08 suite; the sample sink lives in the test tree
tests/e2e/128/                      # delivery to a real collector
tests/security/128/                 # the canary test on both sinks
```

**Structure Decision**: one directory of the package `@specstride/observability`, which the package graph of feature 100 gives this feature together with features 111 and 144. No package of its own is created. The two sinks share the encoder (`forms`), the buffer, the delivery record and the request code; splitting them would duplicate the encoder that both baselines share by import. The span builder and the metric recorder are used by the OTLP exporter only. The stack lives under `assets/` as plain files, so that nothing compiles or starts at install.

## Phase 0 and Phase 1 outputs

`research.md` holds the decisions. `data-model.md` holds the entities and the tables. `contracts/` holds the data files that the exporter reads and that the build checks against `spec.md`. `quickstart.md` says how to check the feature.

## Complexity Tracking

Empty.
