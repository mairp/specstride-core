# Implementation Plan: Launch contract

**Branch**: `107-launch-contract` (a label; no branch is created) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/107-launch-contract/spec.md`

## Summary

The feature adds to the package `@specstride/pipeline` the part that turns existing Spec Kit features into a promoted launch contract, a launcher and a content-addressed launch bundle. The CLI inventories and pages judgment items (`specstride.judgment/1`); the host, or a delegated harness, answers with choices; the CLI completes the draft from the facts and the answers (stages, coverage, the verification-commands document); validation is the one writer of `validated`; rendering refuses anything that was edited. The hash of the comment is recorded by `contract derive` before repository text is printed, `launch` compares it and stores the text, and the comment steers only through options that validation accepts. Parity is proven on fixture families FX-32, FX-33 and FX-34.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (the generated record schema of the launch contract with its type and record-level validator, tasks T195 and T196 of feature 100; closed sets; logical names; the schema validator: feature 100 chose Ajv, `specs/100-specstride/research.md` D-2; this plan chooses none and names none as a dependency of its own), `@specstride/kernel` (the canonical hasher of feature 104, the redactor of feature 111, the atomic write), `@specstride/spec-formats` (the canonical spec model of feature 104, EP-03), `@specstride/config`; the registries of feature 123 (EP-19), which are in the same package. This feature reads no YAML; the one YAML parser is that of the configuration loader of feature 110. No new runtime dependency from npm

**Storage**: files in the control plane by logical name, each with the CLI as its one writer (annex B §B.5): `pipeline:<pipelineId>:contract` (the draft holds the judgment exchange in `inventory.judgment`; no cursor file exists), `pipeline:<pipelineId>:bundle:<hash>`, `feature:<slug>:verification:commands`, and the comment beside the launch record (`launch:<launchId>:comment`); the launcher in the working tree (`pipeline:<pipelineId>:launcher`). The launch record is written by feature 122; this feature hands it the hash of the comment

**Testing**: the Node.js test runner; the parity oracle families FX-32, FX-33, FX-34 through the stub verbs of feature 141; fake harness for delegation; a synthetic feature generator for the payload check; parity tests in `tests/parity/107/` and characterization tests in `tests/characterization/107/`, at the root of the repository; no paid call

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: a part of the package `@specstride/pipeline` (layer L5, owners 107 and 123), which `specs/100-specstride/contracts/data/package-graph.json` names for this feature, in the directory `packages/pipeline/src/contract/`; and the command wiring of `contract` (`packages/cli/src/commands/contract.ts`) and of `launch` (`packages/cli/src/commands/launch.ts`: mode, comment, the dry-run report; it calls the handshake of feature 122) in `@specstride/cli` (layer L6). The package may import `@specstride/contracts`, `@specstride/kernel`, `@specstride/spec-formats` and `@specstride/config`, and nothing else

**Performance Goals**: every judgment batch at most 8,400 bytes; the total printed by derivation constant in the size of the sources (both measured by T059). `contract validate` on a 200-task feature under one second is a design aim, read on the build runner; no task gates on it

**Constraints**: no native module; no install script; no Bash; the host reads no launch contract and no source; output terse and by logical name

**Scale/Scope**: 41 functional requirements, 9 success criteria; 9 as-is requirements received (8 kept, 1 superseded), 18 clusters and 79 items received (77 kept, 2 superseded)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Each gate is answered ✅, ❌ or N/A with a one-line reason, against `.specify/memory/constitution.md` (v3.0.1; read again on 2026-09-30 in the second analyze run).

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). Principle IX is N/A here, so that sentence changes nothing. Rows I, III, XI, XIII, XVII, XVIII and XIX carry the reasons of the second analyze run.*

**The gate and the loop (I–V)**

- I. ✅ Derive, validate and render write files atomically (temporary name, rename); the host and the runtime meet in files only; no watcher; the judgment exchange keeps its state in the draft, a file with a logical name and one writer, and in no cursor of its own (F107-FR-006, F107-FR-009, F107-FR-020, F107-FR-029, F107-FR-030)
- II. N/A This feature produces no verdict and approves no phase; promotion of a launch contract is not approval
- III. ✅ The comment and repository text are data (framed, capped, redacted); the CLI reads no prose of the comment, and an option that the host sets because of it is refused when it widens; project configuration never widens; declarations of scope never come from repository text (F107-FR-009, F107-FR-010, F107-FR-011, F107-FR-035, F107-FR-037)
- IV. ✅ Tasks, phases and hashes are read only through the canonical spec model; no grammar here (F107-FR-007)
- V. N/A No observability code; the events of a launch are written by their owner

**The product and its edges (VI–XII)**

- VI. ✅ Strict TypeScript; the launch contract is validated by its one schema (F107-FR-012); `@specstride/pipeline` imports only what the package graph allows; plain `npm install`; no native module; the extension points are named with versions in the spec
- VII. ✅ Delegation resolves a harness through the registry, discovered ones included; no harness name is tested in control flow (F107-FR-011)
- VIII. N/A No proposer pass; delegated judgment is one completion call through the harness port, whose owner keeps the hermetic conditions
- IX. N/A No critic; a harness that answers judgment items is never the critic of a run by that fact
- X. N/A No adapter is tested here; the delegation through real adapters is `unverified` (F107-FR-011)
- XI. ✅ This feature defines no event; the comment and every excerpt of a source pass the redaction point before they are kept, recorded or printed (F107-FR-009, F107-FR-034)
- XII. ✅ Tests call no paid API; the probe of delegation is a task marked paid, run by nobody in this feature and a precondition of no unpaid test (T057)

**The host skill (XIII–XVII, XX)**

- XIII. ✅ The CLI writes facts and completes the draft; the host adds choices only, and every answer carries provenance; only validation promotes (F107-FR-010, F107-FR-019, F107-FR-041)
- XIV. ✅ Commands come only from declarations; conflicts are blockers; empty phases stay empty (F107-FR-008, F107-FR-036)
- XV. ✅ `run` by default, `dry-run` withholds; no flag bypasses a launch check, the terms gate or a budget (F107-FR-032, F107-FR-033, F107-FR-035)
- XVI. N/A Supervision belongs to feature 123; this feature only bounds the values derivation sets (F107-FR-025)
- XVII. ✅ The tests of this feature are of the hermetic tier and run on their own; the paid probe T057 is of the live tier and a precondition of no test; a test whose capture or stub of feature 141 is absent is reported as a skip with its reason, never as a pass; every statement about macOS is `unverified` until a macOS runner passes the oracle (F107-FR-001, F107-FR-011, F107-FR-031)
- XX. N/A This feature runs no work in parallel; it carries and validates declared scopes, which features 142 and 105 use (F107-FR-037)

**The rewrite (XVIII–XIX)**

- XVIII. ✅ with one item open upstream. Every kept as-is id is in an `origin:` and has a test; differences have register rows (DV-006, DV-008, DV-009, DV-036, DV-038, DV-054, DV-055, DV-059, DV-060, DV-061, DV-066, DV-096, DV-097); the accidents of the baseline that the oracle can see are preserved and stated (the reading of fences, F107-FR-004; `--promote` on a file that cannot be read, F107-FR-021); no micro-loop and no continuation is part of this feature. Open: the field `schema` in the place of `schema_version` has no register row and no entry of the key-name map; the text of both is in `spec.md`, "Assumptions", and the row is the orchestrator's to write (analyze report, finding K1). It is no deviation to justify: Principle XVIII cannot be justified away, and the row is a precondition of the parity tests of F107-FR-005 and F107-FR-012
- XIX. ✅ Batches at most 8,400 bytes; total printed constant; the draft never reaches a host in default output; the share of the budget of `specstride-run` is measured by the judgment payload check in CI (F107-FR-006, F107-FR-009, F107-FR-039, F107-SC-001)

Post-design re-check, and re-check after the cross-feature review of 2026-09-30: unchanged. Re-check in the second analyze run of 2026-09-30, against v3.0.1: no gate is ❌; row XVII answered the wrong rule and is rewritten; row XVIII names the one item that is open upstream.

## Complexity Tracking

No row: no gate fails.

## Project Structure

### Documentation (this feature)

```text
specs/107-launch-contract/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── commands.md
├── checklists/requirements.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

```text
packages/pipeline/                  # @specstride/pipeline, layer L5 (owners 107, 123)
└── src/
    └── contract/                   # this feature; the other directories of src/ are of feature 123
        ├── schemas/                # item schemas of this feature (internal `$id`), joined to the generated record schema
        ├── ports.ts                # the two ports the command wiring hands over
        ├── inventory/              # sources, candidates, verification-plan source (EP-07)
        ├── draft/                  # draft builder, obligation ids, finding, verification mode; completion; the verification-commands document
        ├── judgment/               # items, batching, answers in `inventory.judgment`, delegation through a port
        ├── validate/               # the composed validator; post-schema rules; error classes
        ├── promote/                # stamp, canonical bytes, rewrite
        ├── render/                 # launcher, bundle with manifest, edited-launcher check
        ├── launch/                 # modes, dry-run report, comment, what the comment selected, integrity check at start
        └── commands/               # derive, validate, render as functions: lines and exit codes
packages/cli/src/commands/contract.ts   # verb wiring of `contract`; hands the ports to the library
packages/cli/src/commands/launch.ts     # verb wiring of `launch`: mode, comment, dry-run report; calls the handshake of feature 122
tests/parity/107/                   # PT-107-* on FX-32, FX-33, FX-34
tests/characterization/107/         # CT-107-*; payload-check/ holds the synthetic feature generator
```

**Structure Decision**: no package of its own. The package graph of feature 100 names `@specstride/pipeline` (layer L5) for features 107 and 123; the earlier proposal `packages/launch-contract` is withdrawn. This feature's code is in `packages/pipeline/src/contract/`, with one directory per subject. The package imports `contracts`, `kernel`, `spec-formats` and `config` only. What it needs from a package it may not import reaches it as a port that the command wiring in `@specstride/cli` hands over, because the CLI is a composition root and may import every package. There are two ports: the harness registry with the `completion` call (delegated judgment, EP-02); and the rules of the learning binding (the block of F106-FR-027 at derivation, the structural rules and the two refusals of F106-FR-028 at validation), which feature 106 exports from its package. The parallel plan needs no port: the pipeline entry, in this same package, prints it (F123-FR-006). The record schema of the launch contract is generated by feature 100 into `@specstride/contracts` and is never edited here; this feature writes the schemas of its items in `packages/pipeline/src/contract/schemas/`, each with an `$id` of the internal form (`urn:specstride:schema:internal:107:<name>/1`), and joins them to the record schema by reference, so that one composed schema is the validator's input. The canonical hasher comes from `@specstride/kernel` (owner 104); this feature writes no hasher.

## Design points

| Point | Decision |
|---|---|
| One schema | The generated record schema of `specstride.launch-contract/1` and the item schemas of this feature are composed by reference and compiled into the validator; no hand-written rule duplicates them. Rules that a schema cannot state (paths inside roots, unique ids, ordering of dependencies, secrets) are functions that run after it and are listed in `research.md` |
| Batching | No cursor file. The first `--next-batch` writes the items into the draft (`inventory.judgment`); the batch boundaries follow from the items and the byte limit, so they are computed again at each call; `--answer` takes the batch id and, per item, the id of a choice, and writes the answer with its provenance into the draft |
| Excerpt | Redacted first, cut second, at a line end; the cap is data of the product, starting value 480 bytes (low confidence; the payload check of T059 is where it is tuned) |
| Completion | A pure function of the draft, the answers and the resolved configuration, called by the `--answer` that closes the last item or by the first `--next-batch` of a draft without items. It writes stages, preconditions, the verification-commands document, coverage and findings (F107-FR-041) |
| Output modes | Compatibility output prints the as-is lines and the draft on standard output; default output writes the draft to its logical name and prints the product lines of `contracts/commands.md`. The mode is that of annex G §G.2; no flag of this feature selects it |
| Constant total | Tasks are settled by fact; items are grouped by question. The generator of the payload check builds features of 20 and 200 tasks with the same questions |
| Order of writes | `contract derive` reads the comment from the argument and hashes it first; it then reads the repository, writes the draft with the hash in `configuration.comment`, and only then prints. `launch` compares the hash with the promoted launch contract before anything else, and in the mode `run` writes the comment record before the launch record is written |
| What the comment selected | The host names an option with `--comment-selects`; the CLI checks that the value narrows and records option and value in `configuration.comment`. The CLI parses no prose |
| Promotion write | Rewrite keeps key order (preserved defect D-43); the stamp hashes the canonical form, so order does not matter to the hash |
| Bundle | `bundle:<hash>` holds the canonical launch contract, the implementation artifacts and a manifest of every other file with its hash; the hash of the launch bundle is the hash of the manifest; the launcher names the bundle by logical name, the hash of the launch contract and the hash of the launch bundle |
| Integrity at start | The launcher, the pipeline entry and the runtime root call the check of `src/contract/launch/` before any launch check of the pipeline and before any stage; the same check runs at every relaunch. Through `launch` the launch check `launcher-intact` of feature 123 stands in front of it |
| Error classes | Every post-schema rule and every schema error is mapped to one of the ten classes by a table in `src/contract/validate/`; a rule without a class fails a static test (F107-FR-040) |
| Declarations | `configuration.scopes` is filled only from user configuration, the environment or a flag; the verification-plan source drops `reads`, `writes` and `sideEffects` of repository files (CQ-190) |
| Dry-run | `launch` derives nothing. It validates the promoted launch contract again, prints the report, evaluates the launch checks without launching, and shows the read-only plan of the pipeline entry, which holds the parallel plan only with row 20 on. Exit 0; 20 without a promoted launch contract; 23 on stale sources |
| Relaunch block | Written from the resolved values of `supervise.maxRelaunches` and `supervise.wallClockSec` only when one differs from its default; validation checks the ceilings and the bound of the stages |
