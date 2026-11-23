# Implementation Plan: Compatibility projection (feature 144)

**Branch**: `144-compatibility-projection` (a label; the directory is `specs/144-compatibility-projection`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/144-compatibility-projection/spec.md`

## Summary

Feature 144 builds the projection sink: a pure function from an event to zero or more old lines, driven by one table, written to files of its own. Approach after Lisa's `V1_V2_MAPPING` (extracted as an idea, rewritten for the new schema).

| Deliverable | Requirements |
|---|---|
| Sink, on/off, table and its checks | F144-FR-001, F144-FR-002 |
| Line shapes (Bash, Python, learning) and quirks | F144-FR-003 to F144-FR-005 |
| Ambient fields, halt path, files | F144-FR-006 to F144-FR-008 |
| Rows that write nothing; pipeline files; one emit, two encodings; types added after the split | F144-FR-009 to F144-FR-012 |

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later
**Primary Dependencies**: `@specstride/contracts` (envelope, layout names, normalization tables) and, as the package graph of feature 100 allows, `@specstride/kernel`; no third-party runtime dependency
**Storage**: files: `run:<runId>:events-legacy:<k>` for each engine start (annex B §B.5; F100-FR-229), the learning legacy file, four pipeline files; all by logical name. The engine log of each engine start, `run:<runId>:engine-log:<k>`, is created empty at the engine start and takes the halt rail of F144-FR-007 (F100-FR-054; proposed upstream fix P1 of `analyze-report.md`); the learning legacy file is `feature:<slug>:learning:events-legacy` (proposed upstream fix P2)
**Testing**: Node's test runner; parity tests on FX-01 to FX-40 through the surface `events`; one characterization test of Lisa's pattern; no model call
**Target Platform**: Linux and macOS; every macOS statement is `unverified` (ruling 67)
**Project Type**: one package of the npm workspace, `@specstride/observability` in `packages/observability/` (layer L1, owners 111, 128, 144, as the package graph of feature 100 names it); the projection is an edge and is never imported by the core
**Performance Goals**: starting values, low confidence: under 1 ms per event; no effect on the run when the sink fails
**Constraints**: best effort; no throw into the loop; no line without an as-is equivalent under `parity`; no name or path of the owner's machines; the locally registered backend is never named
**Scale/Scope**: 12 requirements, 2 success criteria, 138 table rows, 65 carried old names

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30 and stands: this feature calls no critic.*

**The gate and the loop (I–V)**

- [x] I. Pass (F144-FR-008: durable files by logical name, appended; nothing reads them to decide anything)
- [x] II. N/A. No verdict, no approval is produced
- [x] III. Pass (F144-FR-001 with CQ-032: text written is the redacted snippet of the old vocabulary; nothing is executed)
- [x] IV. N/A. No spec grammar
- [x] V. Pass (F144-FR-011: best effort; a failing write is swallowed)

**The product and its edges (VI–XII)**

- [x] VI. Pass (F144-FR-002: strict TypeScript; the table is data validated at load; the core names no sink; the sample of EP-08 lives outside the core)
- [x] VII. Pass (F144-FR-006: no harness is named in a rule; backend labels come from the registry)
- [x] VIII. N/A. No proposer pass is started
- [x] IX. N/A. No critic is called
- [x] X. N/A. No harness version is involved
- [x] XI. Pass (F144-FR-001: the projection is byte-identical on the oracle's fixtures after normalization, and no promise elsewhere)
- [x] XII. Pass. No paid call; no secret is handled beyond redacted snippets

**The host skill (XIII–XVII, for features that touch a host skill, the contract or supervision)**

- [x] XIII. Pass (F144-FR-002: rows are data; each line is a fact of deterministic code)
- [x] XIV. N/A. No verification command
- [x] XV. N/A. No consent involved
- [x] XVI. Pass (F144-FR-010: `[MOL-RELAUNCH]` is a rendering of the root's event, not a decision)
- [x] XVII. Pass (T021: the parity suite is skipped on macOS until a macOS runner passes the oracle, and the task records the skip with its reason, ruling 67)
- [x] XX. Pass (F144-FR-009: `parallel.*` events project to nothing)

**The rewrite (XVIII–XIX)**

- [x] XVIII. Pass (every as-is row of this feature is in an `origin:` and a `proves:`; the differences are DV-006, DV-007, DV-016, DV-027, DV-037, DV-067, DV-074, DV-088)
- [x] XIX. Pass. Nothing is printed into a host session

## Complexity Tracking

No deviation. Re-check after design: unchanged.

## Project Structure

```text
specs/144-compatibility-projection/
├── spec.md  plan.md  research.md  data-model.md  quickstart.md  tasks.md  analyze-report.md
├── checklists/requirements.md
└── contracts/{README.md,projection-table.tsv}

packages/observability/src/projection/index.ts                 # the sink, its files, the ambient fields, the halt path (T012)
packages/observability/src/projection/{table,bash-line,python-line,learning-line,pipeline-files}/
packages/observability/data/projection/                        # the copy of contracts/projection-table.tsv (T002)
packages/observability/test/projection/                        # CT-144-101, -102, -109, -110, -112 and the table check of T002
tests/parity/144/
tests/characterization/144/          # CT-144-1, the Lisa pattern (feature 100, place of parity and characterization tests)
tests/conformance/eventsink/         # the EP-08 conformance run on the projection (T019)
```

**Structure Decision**: the projection lives in the package `@specstride/observability` (owners 111, 128, 144) as an edge of layer L1; the table is data read at start.
