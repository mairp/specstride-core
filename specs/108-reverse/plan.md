# Implementation Plan: Reverse specification (feature 108)

**Branch**: `108-reverse` (a label; the directory is `specs/108-reverse`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/108-reverse/spec.md`

## Summary

Feature 108 builds `specstride-reverse` as a capability of the CLI: the wrapper, the verbs `plan` and `guard`, the driver spec and verification-commands document of a reverse run, and the call into the inventory command. The source inventory, the lint and the shipped templates moved to another feature and are reached through the CLI commands `reverse inventory` and `reverse lint` of feature 100 (annex G §G.1). It builds no gated loop, no host skill text, no detach mechanism and no hasher.

| Deliverable | Requirements |
|---|---|
| Wrapper: entry, flags, pass-through, refusals, dry run, launch, commit switch, `--detach`, comment | F108-FR-001 to F108-FR-010 |
| Plan: tasks mode, verbs, arguments, files, plan JSON | F108-FR-011 to F108-FR-015 |
| Driver spec and verification-commands document | F108-FR-016 to F108-FR-023 |
| Output naming and refusals; run collision | F108-FR-024 to F108-FR-026 |
| Guard | F108-FR-027 to F108-FR-032 |
| Micro-loop rule; terse output | F108-FR-033, F108-FR-034 |

Approach: a port of the wrapper, plan and guard of `lib/reverse.py` at `9cab15d`, with the paths of state replaced by logical names of feature 100 (annex B §B.5). Every message and printed line is reproduced byte for byte.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), ECMAScript modules, on Node.js 22 or later.

**Primary Dependencies**: `@specstride/contracts` (logical names, exit codes, closed sets, profile), `@specstride/kernel` (atomic write, canonical hasher of feature 104), `@specstride/spec-formats` (the native adapter, EP-03). No other dependency; git is called as a process by the guard.

**Storage**: files only, named by logical name: `reverse:<slug>:verification-commands` (and the inventory, written through the inventory command) in the control plane; `:inventory-summary`, `:driver` and `:analysis` in the workspace part; `:output` in the working tree.

**Testing**: the test runner that Node ships; fake `git`; fixtures of family FX-30 of the oracle; no model call, no network. Parity tests in `tests/parity/108/`, own tests in `tests/characterization/108/`.

**Target Platform**: Linux and macOS; every macOS statement `unverified` until a runner passes the oracle (ruling 67).

**Project Type**: one package of the npm workspace, `@specstride/reverse`, layer L6 (`package-graph.json`), imported by `@specstride/cli`.

**Performance Goals**: starting values, low confidence: a guard over 10,000 files under 5 s.

**Constraints**: no native module; no path, account or name of the owner's machines; the source is never written; the guard opens files without following links.

**Scale/Scope**: 34 functional requirements, 3 success criteria, 158 behaviour items in 8 whole clusters and 6 divided clusters, 3 as-is requirements and criteria (028 FR-025, 028 FR-026, 028 SC-006), fixture family FX-30.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Plan files are written atomically (F108-FR-014); the run is detached and coordinates through files (F108-FR-009); nothing is a watcher or a service.
- [x] II. ✅ Reverse produces no verdict; the lint and the guard are commands of the verification gate and approve nothing. The critic is untouched.
- [x] III. ✅ Lint and guard are deterministic, fixed at plan time, and run by the runtime. The guard reads the tree as a claim (F108-FR-032). The driver policy treats source text as evidence, not instruction. The consumer's comment is data (F108-FR-010).
- [x] IV. ✅ The driver is validated through the spec-format adapter (F108-FR-021); the package has no second parser.
- [x] V. ✅ Nothing in this feature observes a run.

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the verification-commands document is validated against schemas in `contracts/`; extension points consumed: EP-01, EP-03, EP-04, EP-07, EP-17; none implemented.
- [x] VII. ✅ No harness is named or enumerated; pass-through flags name roles, not harnesses.
- [x] VIII. N/A for the implementation; the driver policy forbids network, installs and services for the proposer.
- [x] IX. N/A: the critic is not touched.
- [x] X. N/A: no harness adapter.
- [x] XI. ✅ No event schema here; the run's events are written by the engine. Default output names state by logical name.
- [x] XII. ✅ Tests use fixtures and stubs; no paid call; no secret is read.

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The driver requires claims with kind, confidence, evidence, contradiction and validation, and forbids mixing as-is and to-be (F108-FR-017); the checking is done by the lint.
- [x] XIV. ✅ The verification-commands document holds only the commands the plan generates from the driver's own phases (`discovery: none`); no command is invented for the source.
- [x] XV. ✅ `--dry-run` withholds the launch (F108-FR-005); no comment or flag bypasses a check (F108-FR-010).
- [x] XVI. ✅ A relaunch of the run is the runtime root's, through the engine request (F108-FR-009); this feature adds none.
- [x] XVII. ✅ Missing git, a missing live host and a missing macOS runner are skips with their reasons, never a pass; the tests run on the macOS runner of the build workflow when it exists, and until then every macOS statement is `unverified` (task T032).
- [x] XX. N/A: the feature runs no work in parallel.

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every kept as-is requirement, criterion and item of this feature has an `origin:`, a disposition and a `PT-108-*` test; `superseded-by` rows are listed with DV-036; intended differences carry DV-006, DV-027, DV-034, DV-036, DV-066; the strategy is `classic` under the oracle (F108-FR-033).
- [x] XIX. ✅ Default output is terse; a command of the skill prints at most 1,120 bytes (F108-FR-034); the byte measure is a test.

Result: every gate passes; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/108-reverse/
├── spec.md
├── checklists/requirements.md
├── plan.md            # this file
├── research.md        # Phase 0
├── data-model.md      # Phase 1
├── quickstart.md      # Phase 1
├── contracts/         # Phase 1: verification-commands.schema.json, plan-output.schema.json
├── tasks.md           # speckit-tasks
└── analyze-report.md  # speckit-analyze
```

### Source Code (repository root)

```text
packages/reverse/                      # @specstride/reverse, layer L6
├── src/
│   ├── wrapper/       # entry, flags, refusals, dry run, launch, --detach
│   ├── plan/          # slug, output naming and refusals, plan JSON, driver, commands document
│   └── guard/         # baseline comparison, testautomation, git checks
└── data/              # the schemas copied from specs/108-reverse/contracts/ (T002)
tests/
├── parity/108/            # PT-108-* on FX-30
└── characterization/108/  # CT-108-* (the two test directories of feature 100)
```

**Structure Decision**: one package, as `package-graph.json` names it.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Logical names to locations | Through the layout table of `@specstride/contracts`; the package names no physical path |
| File reads by the guard and the walk | `lstat` first; open regular files with the no-follow flag where the platform offers it; never `stat` through a link |
| Git | `git status --porcelain=v1 -z --untracked-files=all` and `git rev-parse --verify -q HEAD` as processes with the as-is time limits |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The gated loop over the driver spec; the phase gate | 101, 103 |
| Skill text and its byte budget | 113 |
| The detach strategy and the handshake line | 122 |
| The hasher | 104 |
| The source inventory, the lint and the shipped templates | 140 |
| Compatibility output lines of the front door | 119 |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
