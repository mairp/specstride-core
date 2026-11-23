# Implementation Plan: Terms gate (feature 147)

**Branch**: `147-terms-gate` (a label; the directory is `specs/147-terms-gate`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/147-terms-gate/spec.md`

## Summary

Feature 147 builds the terms gate: the data file with its schema, the table for the table evaluator, the function `evaluate`, the loader that lets a newer file in user-level state replace the shipped one, and the conformance suite of EP-11.

| Deliverable | Requirements |
|---|---|
| Auth tiers, audience, row schema | F147-FR-001 to F147-FR-003 |
| `evaluate`, evaluation points, no bypass | F147-FR-004 to F147-FR-006 |
| Front harnesses, unknown terms, defaults per audience | F147-FR-007 to F147-FR-010 |
| Shipped rows, SDK transport, replacement, conformance | F147-FR-011 to F147-FR-014 |

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schema types, the interface of EP-11) and `@specstride/kernel` (the table evaluator); the JSON Schema validator that feature 100 chose (Ajv, draft 2020-12, pure JavaScript, MIT; `specs/100-specstride/research.md` D-2). The terms data is JSON, so no YAML parser is used. Role resolution and the doctor receive `evaluate` from the composition root through the interface of EP-11 in `@specstride/contracts`, as plan 124 states: the package graph lets `@specstride/harness` and `@specstride/doctor` import neither `@specstride/config` nor `@specstride/policy` (rule LR-1). No other runtime dependency; no native module

**Storage**: the shipped data file (`package` place) and `user:terms`

**Testing**: the Node.js test runner; table tests generated from the matrix; conformance suite of EP-11 with a fictional provider in a test overlay

**Target Platform**: Linux and macOS (macOS `unverified`)

**Project Type**: the package `@specstride/policy` of the npm workspace (owners 110, 127 and 147, per the package graph of feature 100); this feature owns the directory `src/terms/` in it. The composition root hands `evaluate` to role resolution and the doctor through the interface of EP-11 in `@specstride/contracts`; neither imports the package, and `core` never does

**Performance Goals**: `evaluate` under 1 ms per call

**Constraints**: `evaluate` is a pure function, no I/O, no clock; no network call. It returns the decision with its row, rule id, table version, warnings and whether an entry of `distribution.termsOverride` was relied on. The gate call of `src/terms/`, which role resolution and the fallback switch reach through the interface of EP-11, records the decision and emits `terms.override_used` (catalogue of feature 111, F111-FR-051) for each launch and switch that relies on an entry; `fallback.skipped` is emitted by the owner of the fallback switch (feature 127)

**Scale/Scope**: 42 provider cells, 14 requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1 (2026-09-30). It differs from v3.0.0 by one sentence of Principle IX, the weaker proof of a tool-less critic (CQ-182); the row of Principle IX was re-read against that sentence at the analyze run of 2026-09-30 and stands, because this feature starts no critic.

**The gate and the loop (I–V)**

- [x] I. ✅ Data files are read only; the loader writes nothing and watches nothing (F147-FR-013)
- [x] II. ✅ The feature produces no verdict; it is an input to role resolution, which the phase gate judges (F147-FR-004)
- [x] III. ✅ A project key cannot change the audience or acknowledge a path (F147-FR-002, F147-FR-006); the text of a consumer comment is data
- [x] IV. ✅ This feature parses no spec: it reads its own dated data file and nothing of the spec grammar (F147-FR-003)
- [x] V. ✅ A broken replacement file degrades to the shipped one and raises a doctor finding; it never breaks the run (F147-FR-013)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every row validated against the schema of the data file with the one validator of feature 100; the code sits in `@specstride/policy`, outside `core`; EP-11 implemented, EP-02 consumed (F147-FR-001 to F147-FR-014, spec.md "Extension points")
- [x] VII. ✅ Rows are keyed by provider, never by harness name; a front harness reads the row of the provider in use (F147-FR-007)
- [x] VIII. ✅ The gate runs unattended inside a pass: no consumer interaction can change a decision (F147-FR-006)
- [x] IX. ✅ The feature mints no session and calls no model; `evaluate` is a pure table (F147-FR-004)
- [x] X. ✅ Rows carry the access date and `verified-on`; the shipped rows carry the access date of R8v (F147-FR-003, F147-FR-011)
- [x] XI. ✅ Every decision is recorded with its rule id and the version of the table (F147-FR-004); no content is captured
- [x] XII. ✅ No paid call in any test; both audiences respected; Tier 3 empty in the shipped data (F147-FR-001, F147-SC-003, tasks "No task is a paid probe")

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ The decision is a pure table with the rule id recorded; the facts of a row and the decision are kept apart (F147-FR-003, F147-FR-004)
- [x] XIV. ✅ The feature invents no verification command and changes none; it reads terms data only (F147-FR-003)
- [x] XV. ✅ No comment, mode or setting bypasses the terms gate (F147-FR-006, F147-SC-001)
- [x] XVI. ✅ The feature supervises no process and relaunches nothing (F147-FR-004)
- [x] XVII. ✅ Every `unverified` fact names its check (F147-FR-011, task T006); a test whose prerequisite is missing is a skip with its reason, and the macOS result is recorded (task T011)
- [x] XX. ✅ The feature runs no parallel unit and writes no workspace path; the data file is read only (F147-FR-013)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ This feature carries no as-is id: every row of the parent feature is `superseded-by` (spec.md, "As-is behaviour not carried"); intended differences cite the register rows DV-003 and DV-048; under `parity` the audience is `personal` (row 34 of annex X §X.7)
- [x] XIX. ✅ The feature prints no host-facing line of its own; the reason of a decision is shown by the consumer that asked for it (F147-FR-004)

No violation; Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged.

## Complexity Tracking

No deviation and no stated reading. This table stays empty.

## Project Structure

```text
specs/147-terms-gate/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/           terms-rows.tsv
├── analyze-report.md
└── tasks.md
```

```text
packages/policy/src/terms/
├── table.ts        table, evaluate
├── loader.ts       data loader
└── data/terms.json shipped rows
```

Tests: `packages/policy/tests/unit/` for the unit tests; the conformance suite and the sample of EP-11 in `packages/testkit/src/conformance/EP-11/` and `packages/testkit/src/samples/EP-11/` (feature 100 builds the frame, this feature adds its cases in the same folders).

**Structure Decision**: one package `@specstride/policy` (owners 110, 127 and 147); this feature owns the directory `src/terms/` in it. The composition root hands `evaluate` to role resolution and the doctor through the interface of EP-11.
