# Implementation Plan: Doctor (feature 112)

**Branch**: `112-doctor` (a label; the directory is `specs/112-doctor`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/112-doctor/spec.md`

## Summary

Feature 112 builds the doctor, the package `@specstride/doctor` of the package graph of feature 100: the registry of checks (EP-14), the core catalogue of 45 checks, the runner with injected probes, the text and `--json` renderers, the exit codes, and the invariants of gate integrity on the event log.

| Deliverable | What it is | Requirements |
|---|---|---|
| Registry and runner | Registration, order, injected probes, time limit, output cap, `--quick` | F112-FR-001 to F112-FR-010 |
| Core catalogue | 45 checks as data (`contracts/check-catalogue.tsv`) plus probe code for the checks the core supplies; no code of a check that another feature registers | F112-FR-011 to F112-FR-022, F112-FR-033 |
| Output, flags, exit codes | Text renderer, `--json` renderer, flag parser, entry points | F112-FR-023 to F112-FR-029 |
| Launch subset and integrity | The `lb` subset called by `launch`; the log invariants | F112-FR-030 to F112-FR-032 |

Approach: a check is a small object: id, group, `lb`, order, severity rule, message template, fix hint and an async probe that receives a probe bag. The catalogue file is read by the build and checked against the spec. The finding model is extracted in idea from Lisa's doctor and written new for the registry.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (findings schema, severities, closed sets, logical names), `@specstride/kernel` (the registration call, F100-FR-234), `@specstride/config` and `@specstride/view`, as the package graph of feature 100 allows. Records are validated by the one schema validator that feature 100 chose (Ajv, `specs/100-specstride/research.md` D-2), through `@specstride/contracts`. YAML is read through the loader of feature 110, whose parser is the npm package `yaml` (`specs/100-specstride/research.md` D-8); the doctor names no parser and no validator as a dependency of its own. No other runtime dependency. The doctor lives in the CLI layer (L6) and imports ports, never adapters and never the package of an owner of a registered check

**Storage**: none written. Reads through logical names: `user:config`, `project:config`, `workspace:lock`, `run:<runId>:record`, `run:<runId>:events`, `run:<runId>:registry`, `user:tripwire`, and the others of annex B §B.5 that list the doctor as a reader

**Testing**: the test runner that Node ships. Injected probes make every check a pure function of a fixture. A file-access trace test proves no write and no credential-store read. Golden output check on healthy and worst case. Conformance suite of EP-14 in the published test kit, `packages/testkit/src/conformance/EP-14/`, with the sample check in `packages/testkit/src/samples/EP-14/`; feature 100 builds the contract-level suite and a minimal sample, and this feature adds its cases in the same folders. No test calls a model

**Target Platform**: Linux and macOS; every macOS statement is `unverified` (ruling 67)

**Project Type**: one package of the npm workspace, `@specstride/doctor` in `packages/doctor/`, at layer L6, with checks registered by other packages, whose code lives in those packages

**Performance Goals**: `--quick` median at most 300 ms (starting value; `unverified`); default run bounded by the 5 s probe limit with probes in parallel

**Constraints**: read-only; no model; no secret value; stdin closed, 5 s, 64 KiB per subprocess; output at most 1,700 bytes worst case; no harness name in control flow; no name or path of the owner's machines; the locally registered backend is never named

**Scale/Scope**: 33 functional requirements, 9 success criteria, 45 checks, 19 groups, 4 severities, 4 exit codes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1.

*Written against v3.0.0 on 2026-09-29 and read again against v3.0.1 on 2026-09-30 (second analyze run). v3.0.1 differs by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below was re-read against that sentence and stands.*

**The gate and the loop (I-V)**

- [x] I. Pass. The doctor reads files and writes none; no process depends on it; it is a status-like reader the consumer starts (F112-FR-004, F112-FR-008)
- [x] II. Pass. The doctor never approves and never blocks; it tests the invariants that keep the phase gate honest (F112-FR-032) and reports the critic-independence facts (F112-FR-015)
- [x] III. Pass. Project configuration and repository text are read as untrusted data by a loader that runs no code (F112-FR-010); findings name logical names and never echo outside text (F112-FR-024)
- [x] IV. N/A. The doctor parses no spec grammar
- [x] V. Pass. The doctor never breaks a run; a throwing check gives exit 1 for the doctor only; a timed-out probe is a warning (F112-FR-007, F112-FR-008)

**The product and its edges (VI-XII)**

- [x] VI. Pass. Strict TypeScript; findings validated against `specstride.doctor/1`; the core names no check; EP-14 has a sample outside the core and a conformance suite; no install script (F112-FR-002)
- [x] VII. Pass. Per-harness checks read the registry; no list of harnesses; unverified harnesses shown (F112-FR-009, F112-FR-013)
- [x] VIII. Pass. Nothing waits for a human; a missing credential is a `fail` before any pass; the doctor never writes a configuration home (F112-FR-004, F112-FR-014)
- [x] IX. Pass. `critic.independence` and `sandbox.critic` fail when a critic path allows all tools (F112-FR-015, F112-FR-019). Re-read against v3.0.1 (2026-09-30): the weaker proof of the tool-less form is an adapter duty, recorded for every call in the record of the call (features 109, 130 and 134; CQ-182); the doctor makes and accepts no proof, and `critic.independence` judges only whether the critic path can call tools, which the weaker proof establishes it cannot, so no requirement of this feature changes
- [x] X. Pass. `harness.version.<id>` warns outside the tested range and informs when `verified-on` is old (F112-FR-013)
- [x] XI. Pass. `telemetry.endpoint` shows whether content capture is on; evidence passes the redactor (F112-FR-020, F112-FR-025)
- [x] XII. Pass. No paid call, no model; secrets by reference and never read; the terms gate is shown; unavailable checks are `unprobed` or skipped, never passed (F112-FR-005, F112-FR-006, F112-FR-016)

**The host skill (XIII-XVII)**

- [x] XIII. Pass. Findings are facts from deterministic probes; the host model relays them
- [x] XIV. N/A. No verification command is declared or invented
- [x] XV. N/A. The doctor is not a launch and needs no consent; it writes nothing
- [x] XVI. Pass. The doctor only reads; nothing removes a lock (F112-FR-004, F112-FR-019)
- [x] XVII. Pass. A missing prerequisite is `unprobed`, skipped or `info`, never `ok`; macOS statements are `unverified` (F112-FR-006, F112-FR-011)
- [x] XX. N/A for behaviour. Parallel units register their own checks through the registry (F112-FR-022)

**The rewrite (XVIII-XIX)**

- [x] XVIII. Pass. No reference exists, so no parity test; characterization tests for the finding model and the exit codes; the divergence rows are DV-041, DV-048, DV-056, DV-068, DV-071; the sources are read with `git show` only
- [x] XIX. Pass. Healthy output one line; worst case 1,700 bytes; the skill within 1,500 tokens, measured in bytes (F112-FR-023, F112-FR-024)

Every gate passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/112-doctor/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   └── check-catalogue.tsv
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/doctor/                 # registry, runner, renderers, core checks (L6)
├── data/                        # check-catalogue.tsv
├── src/{registry,runner,probes,render,checks,integrity}/
└── test/
packages/testkit/src/conformance/EP-14/   # the EP-14 suite: the cases of this feature, beside the contract-level suite of feature 100
packages/testkit/src/samples/EP-14/       # the sample check
tests/security/112/              # file-access trace, canary test
tests/budget/112/                # golden output check
```

**Structure Decision**: one package at L6. A check that another feature registers lives in the package of that feature and is registered through the registration call of the kernel package (F112-FR-033; F100-FR-234): the toolchain check in `packages/integrity/` (owner of EP-16), the checks of a harness adapter in the package of the adapter, the host probes in the host package, the launch checks and the check of the terminal tool in the package of the pipeline runtime. `packages/doctor/src/checks/` holds only the checks whose probe the catalogue marks `core`. The sample check lives in the published test kit.

## Phase 0 and Phase 1 outputs

`research.md` holds the decisions. `data-model.md` holds the entities. `contracts/` holds the catalogue that the build checks against `spec.md`. `quickstart.md` says how to check the feature.

## Complexity Tracking

Empty.
