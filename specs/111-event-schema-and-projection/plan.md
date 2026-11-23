# Implementation Plan: Event schema (feature 111)

**Branch**: `111-event-schema-and-projection` (a label; the directory is `specs/111-event-schema-and-projection`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/111-event-schema-and-projection/spec.md`

## Summary

Feature 111 builds the one event schema of the product with its writer, its redaction ingress and its sink interface contract. The compatibility projection is feature 144.

| Deliverable | What it is | Requirements |
|---|---|---|
| Catalogue and schemas | 123 types with `data` schemas, pairs, closed sets, marked free-text fields | F111-FR-001 to F111-FR-016, F111-FR-050, F111-FR-051 |
| Primary writer | Append under a lock, `seq`, torn line, best effort, validation, tamper check, learning domain | F111-FR-017 to F111-FR-022 |
| Redaction ingress | One ingress, fail closed, baseline policy, widened pattern set, registered secrets, commit scan, content accessor, canary test | F111-FR-023 to F111-FR-033 |
| Sink contract | Dispatcher, time limit, queue, conformance suite, sample sink | F111-FR-034 to F111-FR-038 |

Approach: the catalogue is data (`contracts/event-catalogue.tsv`), read by the writer and by a consistency test.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (envelope, closed sets, layout names, the pattern-set schema); the JSON Schema validator that feature 100 chose; `@specstride/kernel` (the atomic write; the redactor of this feature lives there); no other runtime dependency. Neither package of this feature is marked `core` in the package graph of feature 100. A core package does not import `node:fs` or `node:fs/promises` (F100-FR-012, `assumption: CQ-185`): it reaches the writer and the redactor through interfaces typed in `@specstride/contracts`, and the file calls of the writer are in `@specstride/observability`, an edge package of layer L1

**Storage**: files. The event file of a run (`run:<runId>:events`) and the learning events file; the event file is appended. Names are logical; the physical paths are the table of feature 100

**Testing**: the test runner that Node ships. Parity tests of the redaction policy run on the fixture families of feature 141. Conformance suite of EP-08 in the published test kit, `packages/testkit/src/conformance/EP-08/`, with the sample in `packages/testkit/src/samples/EP-08/`. The canary test is a release test. No test calls a model

**Target Platform**: Linux and macOS; every macOS statement is `unverified` (ruling 67). The append and the lock are the same on both; the check is the parity oracle on a macOS runner. Task T075 runs the tests of the feature on the macOS runner when it exists and records the result; a test whose prerequisite is missing reports a skip with its reason

**Project Type**: two packages of the npm workspace, as the package graph of feature 100 names them (`specs/100-specstride/contracts/data/package-graph.json`): `@specstride/observability` (layer L1, owners 111, 128, 144) holds the catalogue, the writer, the ingress, the dispatcher and the content accessor; `@specstride/kernel` holds the redactor (owner "111 (redactor)"). The core imports interfaces only

**Performance Goals**: starting values with low confidence. The writer adds under 1 ms to an event on a local disk; a sink call is bounded by 2000 ms; the queue of a sink holds 1000 events, after which the oldest are dropped for that sink and counted

**Constraints**: best effort; no throw into the loop; no content in events; one ingress; no native module; MIT-compatible dependencies; no name or path of the owner's machines; the locally registered backend is never named

**Scale/Scope**: 40 functional requirements, 7 success criteria, 123 event types, 9 ingress classes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30 and stands.*

**The gate and the loop (I-V)**

- [x] I. Pass. The event file and the learning file are durable files; the writer appends and readers poll files. No watcher, queue or service carries control flow. Appends are single lines, a torn last line is tolerated; the state files this feature writes use a temporary name and a rename
- [x] II. Pass. Events never approve anything. `verdict.recorded` records a verdict and never makes one; the nonce is in no event before the call returns (F111-FR-011). A sink cannot write a verdict, an exit code or a stop reason
- [x] III. Pass. Outside text passes one ingress and is data everywhere. The event stream is a path grounding refuses (F100-FR-037)
- [x] IV. N/A. The feature parses no spec grammar
- [x] V. Pass. This is the principle of the feature: local file first and authoritative; a slow, throwing or dead sink is skipped; a failed write drops the event and never fails the run (F111-FR-019, F111-FR-035)

**The product and its edges (VI-XII)**

- [x] VI. Pass. Strict TypeScript; every event is validated against the schema of its type at the writer; the core names no sink; EP-08 has a sample sink outside the core, a conformance suite and a version; no install script
- [x] VII. Pass. No requirement lists harnesses; roles come from the registry (F111-FR-038)
- [x] VIII. Pass. Nothing in the feature waits for a human; the environment handed to a process is the allow-list of feature 109 plus, under `parity`, the event context names (annex C §C.10; the compatibility projection)
- [x] IX. Pass. `critic.call` records the form of the `completion` level; no event gives a critic a tool. Re-read against v3.0.1 (2026-09-30): the weaker proof of the tool-less form is an adapter duty, recorded for every call in the record of the call (feature 130, CQ-182, the deviation in its plan); this feature ships no critic path and no adapter, and the field `form` of `critic.call` says which form was in force whatever proof established it
- [x] X. Pass. The versions of the product of each engine start are in the run record (F100-FR-050); the schema has a major and readers declare their range
- [x] XI. Pass. This is the principle of the feature: one versioned schema; `stream.missing_terminal`, the flagged do-nothing pass and null for unknown values; content follows traces and always passes the redaction point, which fails closed (F111-FR-014, F111-FR-024, F111-FR-032)
- [x] XII. Pass. No test calls a paid API; secrets appear as references and are registered by value only in memory at use (F111-FR-030); the canary test uses fake secrets; facts about providers are `unverified` where documentation only

**The host skill (XIII-XVII)**

- [x] XIII. Pass. Events are facts recorded by deterministic code; `route.decided` records the rule id and the table version
- [x] XIV. N/A. No verification command is declared or invented here
- [x] XV. N/A. No launch consent is involved
- [x] XVI. Pass. Supervisor events only record what the supervisor read or did
- [x] XVII. Pass. The tests of the feature run on Linux and on the macOS runner when it exists; task T075 records the macOS result, and until then every macOS statement stays `unverified`. A test whose prerequisite is missing (a macOS runner, the fixtures of the oracle, a collector) reports a skip with its reason and never a pass; the conformance test for a dead collector uses a closed port
- [x] XX. Pass. The seven `parallel.*` types are defined; they carry `groupId` and `workerId` only in `data`; no event of a group reaches the critic; they project to nothing

**The rewrite (XVIII-XIX)**

- [x] XVIII. Pass. Every as-is item of the traceability rows that remains here (C-020, C-167) is in the `origin:` of a requirement and in the `proves:` of a test task; intended differences are the rows in the `divergence:` fields of `spec.md`; the sources are read with `git show` only
- [x] XIX. Pass. The feature prints nothing into a host session. Events are read through the CLI by readers with a byte cap

Every gate passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The content accessor (CQ-032) is the only point that reads near a rule of feature 100 and is reported.

## Project Structure

### Documentation (this feature)

```text
specs/111-event-schema-and-projection/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   └── event-catalogue.tsv
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/observability/          # @specstride/observability: catalogue, writer, ingress, sink dispatcher, accessor
├── data/                        # event-catalogue.tsv
├── src/{catalogue,writer,ingress,dispatcher,accessor}/
└── test/
packages/kernel/
├── data/patterns/               # the pattern sets of the redactor
├── src/redactor/                # @specstride/kernel: the redactor (owner 111)
└── test/redactor/
packages/testkit/src/conformance/EP-08/   # the cases of this feature in the EP-08 suite
packages/testkit/src/samples/EP-08/       # the sample sink that keeps events in memory
tests/parity/111/                # parity tests on the fixtures of feature 141
tests/security/111/              # the canary test
```

**Structure Decision**: two packages, both given by the package graph of feature 100. The writer and the redactor are imported by every layer through `contracts`-typed interfaces. The suite of EP-08 and the sample sink live in the published test kit, in the folders that feature 100 names; feature 100 builds the contract-level suite and a minimal sample, and this feature adds its cases in the same folder.

## Phase 0 and Phase 1 outputs

`research.md` holds the decisions. `data-model.md` holds the entities and the catalogue. `contracts/` holds the catalogue file that the build checks against `spec.md`. `quickstart.md` says how to check the feature.

## Complexity Tracking

Empty.
