# Implementation Plan: Configuration and terms (feature 110)

**Branch**: `110-config-and-terms` (a label; the directory is `specs/110-config-and-terms`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/110-config-and-terms/spec.md`

## Summary

Feature 110 builds the configuration package of the product: the schema (the catalogue of keys), the loader that merges the eight ranks with trust filtering, the provenance record and `config show` and `config schema`, and the three secret resolvers. It builds no behaviour that another feature owns; it spells, types and classifies their keys.

| Deliverable | Requirements |
|---|---|
| Schema and catalogue, spelling, defaults, profile | F110-FR-001 to F110-FR-013 |
| Loader, precedence, per-phase inheritance, trust filter, aliases, `--set`, snapshot classes, pins, provenance, `config show` | F110-FR-014 to F110-FR-026 |
| Secret references, resolvers, canary and conformance | F110-FR-027 to F110-FR-035 |

Size: 35 requirements after the split. Group G4 (the terms gate) left as feature 147-terms-gate.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schema types, the redactor interface); the JSON Schema validator that feature 100 chose (Ajv, draft 2020-12, pure JavaScript, MIT) validating the parsed value; one YAML parser, named here: the npm package `yaml`, pure JavaScript, no native module, used in a mode that constructs no code; no other runtime dependency

**Storage**: the files of logical names `user:config`, `project:config`, and the package's shipped profile data (`package` place); the run snapshot is written by feature 102

**Testing**: the Node.js test runner; fake keychain tool binaries; the oracle of feature 141 for alias and profile parity; the canary test; the conformance suite of EP-10 in `packages/testkit/src/conformance/EP-10/` (feature 100 builds the frame and a minimal sample; this feature adds its cases in the same folder)

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: package of the npm workspace, layer L1 in the package graph of feature 100 (`@specstride/config`, owner 110; imports `@specstride/contracts` and `@specstride/kernel` only)

**Performance Goals**: loading and merging under 50 ms on the catalogue of this feature; `config show` within the token budget of annex G §G.5

**Constraints**: no network call in a resolver; no secret in any artifact; no install script; strict on unknown keys

**Scale/Scope**: 259 rows of the catalogue (patterns counted once, `contracts/config-keys.tsv`; task T004 of 2026-10-01 derived the file from the tables of §K.3 to §K.6b and found that §K.6 also lists four keys of feature 107 — `derive.stageTimeoutSec` and the three `verification.scopes.<commandId>.*` — which the catalogue of 259 does not carry: T004's acceptance fixes the count at 259 and no owner ruling amends it, so the four stay in feature 107's contract and are named in `EXCLUDED_KEYS` of the generator, which fails when one of them enters the file. Reported to the orchestrator with the register rows W-ORC-01 to W-ORC-03), the 131 rows of annex X §X.7, 226 as-is items of kind `env` to place, which name 160 distinct variables after DV-064 (159 rows of `contracts/alias-table.tsv`)

## Constitution Check

*GATE: the constitution v3.0.0, passed before Phase 0. Re-checked after Phase 1: no change.*

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I to V)**

- [x] I. Config files are read, never written by a run; the snapshot is written atomically by feature 102; no watcher
- [x] II. N/A: this feature produces no verdict; it never approves anything
- [x] III. Project configuration is narrow-only (F110-FR-017, F110-FR-018); text of a project file is data
- [x] IV. N/A: no spec grammar here
- [x] V. `config show` and doctor findings are best-effort

**The product and its edges (VI to XII)**

- [x] VI. Strict TypeScript; schema-validated files; the configuration package is outside `core`; no native module; extension points named (EP-10 implemented; EP-02 consumed)
- [x] VII. Harness ids come from the registry; no closed list
- [x] VIII. N/A for passes; a missing credential fails fast before the first pass (F110-FR-034); operator configuration is never written
- [x] IX. N/A: the critic's tools are not in scope; a critic selection key is widening
- [x] X. N/A: no tested harness adapter
- [x] XI. Nothing is emitted as an event by this feature except through 111; secrets never reach a sink
- [x] XII. No paid call in tests; secrets by reference; model ids are configuration (keys, never rules)

**The host skill (XIII to XVII, XX)**

- [x] XIII. N/A
- [x] XIV. N/A
- [x] XV. The catalogue holds no key that switches off a launch check or a budget
- [x] XVI. N/A
- [x] XVII. A missing keychain query is `unprobed`, never a pass; skips carry their reason
- [x] XX. N/A (parallel keys are spelled here; behaviour is 142)

**The rewrite (XVIII to XIX)**

- [x] XVIII. Every switch has a profile value and a register row; the as-is rows are listed with their register rows; parity tests run through the alias table
- [x] XIX. `config show` and `config schema` are terse by default; the share of the budget is measured in CI by task T018

No violation; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/110-config-and-terms/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/           config-keys.tsv, alias-table.tsv, baseline-defaults.tsv,
│                        tools/baseline-defaults-extract.ts (T002)
├── analyze-report.md
├── repair-report.md
├── baseline-defaults-report.md   the difference list of task T002
└── tasks.md
```

### Source Code (repository root)

```text
packages/config/
├── src/
│   ├── schema/          catalogue data, types, validators
│   ├── load/            layers, trust filter, merge, provenance
│   ├── secrets/         env, file, keychain resolvers; registry
│   └── cli/             config show, config schema
├── data/                profile-parity.json, alias-table.json, config-keys-sources.json
├── tools/               the generators, checks and probes of phase 1: keychain-probe.sh
│                        (T001), config-keys-gen.ts (T004), alias-coverage.ts (T005);
│                        never run by the product at run time
└── tests/
    ├── unit/
    └── parity/          alias and profile parity through the oracle

tests/characterization/110/
└── baseline-defaults.test.ts   T002, against the baseline at `9cab15d`. It lives outside
                                `packages/` because F100-FR-026 lets no file of a package
                                carry a legacy file name of an as-is system.
```

The conformance suite of EP-10 and its sample live outside this package: the suite in
`packages/testkit/src/conformance/EP-10/` and the sample in `packages/testkit/src/samples/EP-10/`
(the rule of feature 100 on the place of suites and samples; feature 100 builds the frame and a
minimal sample, this feature adds its cases in the same folder). The canary test stays in
`packages/config/tests/`.

**Structure Decision**: one package `packages/config`, imported by the CLI and the runtime root, never by `core` or `layer-micro`. Data files are validated against schemas of `contracts`.

## Complexity Tracking

Empty.
