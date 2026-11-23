# Implementation Plan: Spec input (feature 104)

**Branch**: `104-spec-input` (a label; the directory is `specs/104-spec-input`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/104-spec-input/spec.md`

## Summary

Feature 104 is the one reader of specifications. It resolves the spec when none is named, detects
the format, builds the canonical model, validates, ticks, hashes, and gives the staleness verdict.
It is the content owner of EP-03 `specstride.spec-format/1`, the canonical spec model and the
canonical hasher of feature 100, which it builds as a module of `@specstride/kernel`.

| Deliverable | Requirements |
|---|---|
| Resolver (order, listings, explicit path, feature slug) | F104-FR-001 to F104-FR-004 |
| Format detection, alias, inputs `spec.format`, `spec.feature` | F104-FR-005 to F104-FR-007 |
| Registry and the three adapters; the canonical model | F104-FR-008 to F104-FR-013 |
| Phase access, validation, context documents, tick | F104-FR-014 to F104-FR-017 |
| Caller errors and the verb `spec` | F104-FR-018 to F104-FR-020 |
| Hasher, sources, staleness verdict, task-list reading | F104-FR-021 to F104-FR-027 |

Approach: a port of `specstride_spec.py` (9cab15d) and the resolution steps of `orchestrator.sh`,
merged with the hash rules of `bootstrap_contract.py` and `contract_lib.py` (9c88f86), with Lisa's
`resolve.ts` and its adapters extracted where they are sound. The oracle fixtures FX-09, FX-10,
FX-32 and FX-33 are the proof.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, exit codes, logical names, the interface types of EP-03, and validation through the validators of `@specstride/contracts`: feature 100 chose the JSON Schema validator, `specs/100-specstride/research.md` D-2; this plan chooses none and names none as a dependency of its own); `@specstride/kernel` (the atomic write of feature 100; the canonical hasher, which this feature builds there). No other runtime dependency. This feature reads no YAML file: `.specify/feature.json` is JSON, and the keys `spec.*` come through the configuration loader of feature 110, which holds the one YAML parser. Node built-ins for hashing and file access

**Storage**: none of its own. Reads the workspace files; rewrites checkboxes of the spec file in place through the atomic write of the kernel (a temporary file and a rename). State is named by logical name (feature 100 annex B §B.5)

**Testing**: the Node test runner; parity tests on the oracle (FX-09, FX-10, FX-32, FX-33) in `tests/parity/104/`; characterization tests of Lisa's extracted code in `tests/characterization/104/`; the behaviour cases of the conformance suite of EP-03 and the sample format in `packages/testkit/src/conformance/EP-03/` and `packages/testkit/src/samples/EP-03/`; contract and property tests of this feature's own requirements in the `test/` directory of the package; a static test for one grammar. A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: package `@specstride/spec-formats` of the npm workspace (layer L1 with the port in L2; it may import `@specstride/contracts` and `@specstride/kernel`), called by the CLI as the verb `spec`; and the module `hasher` of `@specstride/kernel`, of which the package graph of feature 100 names this feature the owner. `@specstride/core` may import `contracts` and `kernel` only, so the hasher cannot live in `spec-formats`

**Performance Goals**: starting values, low confidence: parse and hash of a task list of 500 tasks under 100 ms

**Constraints**: no native module; no shell out; no paid call in tests; hashes equal the baseline's

**Scale/Scope**: 27 functional requirements, 8 success criteria; 117 behaviour items in 20 clusters (116 kept, 1 superseded); 6 as-is requirements; 4 fixture families cited

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Each gate is answered ✅, ❌ or N/A with a one-line reason, against `.specify/memory/constitution.md`
(v3.0.1, re-read on 2026-09-30). Every ❌ needs a row in *Complexity Tracking*.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182), which binds the features that start a critic; Principle IX is N/A for this feature, so no answer changed at the re-read.*

**The gate and the loop (I-V)**

- [x] I. ✅ Files only. The only write is the atomic rewrite of checkboxes (F104-FR-017); no watcher, no service
- [x] II. N/A. The feature produces no verdict of a critic; the staleness verdict is a fact and approves nothing (F104-FR-024). `first-unapproved` reads approval records, verified by the engine's verification of F101-FR-031 handed in as a port, and writes none (F104-FR-019)
- [x] III. ✅ Spec text is data; the reader executes nothing from it; the context block is marked "NOT a gate" (F104-FR-016)
- [x] IV. ✅ This feature is the principle: one grammar and one registry (F104-FR-008, F104-SC-001). The hasher in the kernel reads no phase heading and holds only the mark rule of F104-FR-022, which this feature owns (F104-FR-021)
- [x] V. N/A. No observability code of its own

**The product and its edges (VI-XII)**

- [x] VI. ✅ Strict TypeScript; schema-validated model and verdict (`contracts/`); the one file this feature's records cross into, `run:<runId>:task-list`, is validated against the schema `specstride.task-list/1` of `@specstride/contracts` (annex B §B.20 of feature 100; F104-FR-026); no native module; packages as in the package graph of feature 100; EP-03 `specstride.spec-format/1` implemented; sample format outside the core (F104-FR-009, F104-SC-006)
- [x] VII. ✅ No harness is named. Formats are an open registry, not a harness list (F104-FR-008, F104-FR-009)
- [x] VIII. N/A. No proposer pass
- [x] IX. N/A. No critic call
- [x] X. N/A. No adapter of a harness
- [x] XI. N/A. No event of its own; results are records returned to callers
- [x] XII. ✅ Tests call no paid API; no task of this feature calls a model; nothing reads a secret or a credential file

**The host skill (XIII-XVII)**

- [x] XIII. ✅ The verdict and the hashes are facts of deterministic code (F104-FR-021, F104-FR-024, F104-FR-027)
- [x] XIV. ✅ The feature reads verification commands from nowhere and invents none; it only exposes the task list (F104-FR-010)
- [x] XV. N/A. No launch
- [x] XVI. N/A. No supervision or relaunch
- [x] XVII. ✅ A test whose prerequisite is missing (the reference tree, the oracle fixtures of feature 141, a macOS runner) reports a skip with its reason and never a pass; T001 lists missing captures, and T054 runs the tests on the macOS runner when it exists. Until then every macOS statement is `unverified`
- [x] XX. N/A. No parallel work; `tick` for an applied group is called by its owner

**The rewrite (XVIII-XIX)**

- [x] XVIII. ✅ Every kept row has an origin, a disposition and a test (spec.md), and every test name has a task (tasks.md); DV-006, DV-027, DV-036, DV-060, DV-066, DV-073, DV-082 cited
- [x] XIX. ✅ `spec` prints the as-is lines. Share of host-facing output, as starting values: at most 200 bytes for one call of `feature-slug`, `detect`, `validate` (success), `tick`, `title`, `shape` or `first-unapproved`; at most 200 bytes per finding line of `validate`; at most 16 bytes per phase for `numbers`. `slice`, `context` and `render-context` print text of the specification, are bounded by the file and by `spec.contextBudget` (24,000 characters), and belong to the budget of the skill that asks for them. Parity binds the text, so nothing is cut: a breach fails the build. Measured in the build by T053 with the helper of T194 of feature 100 (F100-FR-187)

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged.

**Re-check after the cross-feature review (2026-09-30)**: unchanged in result. Rows IV, XVII and XIX
have new reasons; the passes cite their requirements.

**Re-check after the analyze run of 2026-09-30**: unchanged in result, against v3.0.1. Rows II and VI
have new reasons (the verification port of `first-unapproved`; the schema of the task-list record).

## Project Structure

### Documentation (this feature)

```text
specs/104-spec-input/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── spec-verb.md          # command schema of `specstride spec`
│   └── verdict.md            # shapes of the source record and the verdict
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/kernel/
├── src/hasher/               # the one hasher (owner: this feature): content hash, task-list hash
│                             #   that ignores checkboxes, canonical record hash, phase shape,
│                             #   classification of the staleness verdict (CQ-214)
└── test/hasher/              # unit tests of the hasher
packages/spec-formats/
├── src/
│   ├── registry.ts           # adapters, priority, detection order
│   ├── resolve.ts            # resolution of the spec (F104-FR-001 to 004)
│   ├── adapters/native.ts  speckit-tasks.ts  openspec-change.ts
│   ├── model.ts              # canonical model and structured tasks
│   ├── validate.ts  context.ts  tick.ts  slug.ts  errors.ts
│   ├── sources.ts  verdict.ts  task-reading.ts   # they call the hasher of the kernel; verdict.ts
│   │                         #   reads the files and builds the lines, the classification is the kernel's
│   └── verb.ts               # the verb `spec`
└── test/                     # own tests: contract, property, static; fixtures/
packages/testkit/
└── src/
    ├── conformance/EP-03/    # behaviour cases of this feature, beside the contract-level suite
    │                         #   of feature 100
    └── samples/EP-03/        # the sample format, beside the minimal sample of feature 100
tests/
├── parity/104/               # PT-104-*
└── characterization/104/     # CT-104-1, CT-104-2, CT-104-3: Lisa's extracted code as it is
```

**Structure Decision**: one package of its own, `@specstride/spec-formats`, and one module of
`@specstride/kernel`, as the package graph of feature 100 gives them
(`specs/100-specstride/contracts/data/package-graph.json`). The verb lives in the package and is
registered by the CLI; the CLI imports it and never a parser. What the verb needs from a package it
may not import reaches it as a port that the command wiring of the CLI hands over, the CLI being the
composition root: for `first-unapproved`, the verification of an approval record of feature 101
(F101-FR-031, in `@specstride/core`); the verb verifies no signature itself (F104-FR-019). The hasher
is in the kernel because
`@specstride/core` and the loop layers may import `contracts` and `kernel` only, and features 102,
103, 105, 106, 107 and 108 take the hasher from there. What the task-list hash covers is the rule
of F104-FR-022; the hasher holds that rule and no other part of the grammar. The classification of the
staleness verdict (recorded hashes and hashes now give `unchanged`, `ticks-only`, `changed` or
`unreadable`) is a pure operation of the same module (annex X §X.5; F104-FR-024, F104-FR-027;
assumption: CQ-214), so that features 102 and 103 reach the one verdict function through the kernel;
`@specstride/spec-formats` reads the files and builds the lines, and EP-03 gains no operation.

**Place of tests**: the rule of feature 100 (`specs/100-specstride/plan.md`, "Place of parity and
characterization tests"). Parity tests are in `tests/parity/104/`; the characterization tests that
pin as-is behaviour are in `tests/characterization/104/`; the tests of this feature's own
requirements (CT-104-5 to CT-104-8, the property test, the static test) are unit and contract tests
and stay in `packages/spec-formats/test/`; CT-104-4 is the conformance suite and is in the test kit.

## Complexity Tracking

Empty.
