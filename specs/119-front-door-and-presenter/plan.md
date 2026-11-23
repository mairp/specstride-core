# Implementation Plan: Front door

**Branch**: `119-front-door-and-presenter` (a label) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/119-front-door-and-presenter/spec.md`

## Summary

Build the router of the `specstride` binary and the inspection verbs with their two output modes. Compatibility output reproduces the baseline byte for byte through tables; default output is terse and built from closed fields. The presenter, banner and theme moved to `145-presenter`. Nothing here writes state.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts`, `@specstride/kernel` (redactor, table evaluator), `@specstride/view` (read model), `@specstride/spec-formats` (canonical spec model); the presenter module of `145-presenter` in the same package, reached only through the presenter interface of annex G §G.10 (F100-FR-233).

**Storage**: none written. Reads by logical name (feature 100 annex B §B.5): events, engine log, phase records, run snapshot, workspace record.

**Testing**: the Node.js test runner; parity tests on the oracle (FX-28); characterization tests CT-119-1 to CT-119-15, CT-119-18 and CT-119-19; the golden output gate; the startup check (macOS result or skip recorded with its reason, Principle XVII).

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: package `@specstride/cli` (router, inspection verbs) in the npm workspace

**Performance Goals**: cold start of a read command at or below 150 ms p90; default output within 1,120 and 2,240 bytes

**Build**: the bundle of the published package (F119-FR-056, review item W-119-01; feature 113 packs its plugin directory, this feature bundles) is built by the bundler `rollup`, a development dependency of this feature only. Licence: MIT. Native part: none (pure JavaScript). Version and licence are `unverified` until the build pins them. It never enters the manifest of the packed package (F119-FR-056).

**Constraints**: one bundled ESM file, built by the build with the bundler above and never at install; lazy imports, no native module, no install script; no file written by an inspection verb

**Scale/Scope**: 34 requirements, 8 success criteria, the kept behaviour items of clusters C-006, C-009, C-012, C-013, C-108, C-109, C-111 to C-115, 7 as-is requirements

## Constitution Check

Answers to the twenty gates (v3.0.0).

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**The gate and the loop (I-V)**

- [x] I. Coordination is through files only; the front door reads files and writes none; no watcher carries control flow (a follower is a reader, allowed by Principle I)
- [x] II. N/A: the front door never approves; it shows records
- [x] III. Outside text is data: never echoed into default output; `--verbose` frames it (F119-FR-032)
- [x] IV. Phases come from the canonical spec model; the front door has no parser (F119-FR-020)
- [x] V. Inspection verbs are read-only and best-effort; a failing section is left out (F119-FR-012, F119-FR-016)

**The product and its edges (VI-XII)**

- [x] VI. Strict TypeScript; consumes EP-01, EP-02, EP-03, EP-08 (sink status), EP-09 by version; implements none. Every record read at a file boundary is validated against its schema of `@specstride/contracts`; a record that does not validate leaves its section out (F119-FR-012)
- [x] VII. No harness name in usage, messages or control flow (F119-FR-014)
- [x] VIII. N/A: no pass is run here
- [x] IX. N/A: no critic call
- [x] X. N/A: no adapter
- [x] XI. Free text passes the redactor before printing (F119-FR-032)
- [x] XII. No paid API in tests; no secret read; the macOS statements are `unverified`

**The host skill (XIII-XVII)**

- [x] XIII. Facts only: the front door records nothing and judges nothing
- [x] XIV. N/A: no verification command is derived or run here
- [x] XV. N/A: `run` is invoked by the consumer; no launch check is bypassed
- [x] XVI. N/A: read-only verbs only
- [x] XVII. Pass: the startup check of R17 (150 ms, CT-119-8) and the plain-install test CT-119-19 run on Linux and, with the other tests of this feature, on the macOS runner of the build workflow when it exists; until then every macOS statement is `unverified`, and a test whose prerequisite is missing reports a skip with its reason, never a pass (F119-FR-015, F119-FR-056; task T066)
- [x] XX. N/A: no parallel work

**The rewrite (XVIII-XIX)**

- [x] XVIII. Every carried item cites origin, disposition and test; the divergence rows named are exactly the rows in the `divergence:` fields of `spec.md`; the oracle runs compatibility output
- [x] XIX. Byte limits per command, measured by the golden output gate; the host reads no file

Post-design re-check: no gate changed; no Complexity Tracking row.

## Project Structure

### Documentation (this feature)

```text
specs/119-front-door-and-presenter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/front-door.md
├── contracts/schemas/    # one schema file per `specstride.inspect.<verb>/1` (F119-FR-033)
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/cli/
├── src/
│   ├── router/          # verb table, argument resolution, usage, unknown verb, exit 70
│   ├── inspect/         # tail, events, verdicts, feedback, phases, watch, status (compatibility)
│   └── output/          # modes, product lines, byte cap, data frame, failure reasons
└── test/
tests/
├── parity/119/          # PT-119-*
├── characterization/119/# CT-119-*, the startup check CT-119-8 and the plain install CT-119-19 included
└── budget/119/          # golden output gate and canary (no test id)
```

**Structure Decision**: the router and the inspection verbs live in `@specstride/cli`, the composition root for commands (feature 100 package graph); the presenter is the module of `145-presenter`. Every literal line of the baseline is data in a table, so that a byte-level review reads data and not code.

## Complexity Tracking

No violation.
