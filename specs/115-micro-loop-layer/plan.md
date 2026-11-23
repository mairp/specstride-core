# Implementation Plan: Micro-loop layer (feature 115)

**Branch**: `115-micro-loop-layer` (a label; the directory is `specs/115-micro-loop-layer`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/115-micro-loop-layer/spec.md`

## Summary

Feature 115 builds the implementation `micro` of the loop-layer interface, the content of one
extension point that is data (the router rule table), the tripwire, and the experiments that
decide whether the layer stays the default. Requirement group G-B (the protected set, the
fingerprints, toolchain profiles with EP-16, the fact block, the check result) left at the split
and is feature `116-check-integrity-and-unit-evidence`; this plan claims none of it and meets it
only through contracts of feature 100.

| Deliverable | What it is | Requirements |
|---|---|---|
| Layer `micro` | The eight call points of EP-04; strategy, level, fallback, inertness | F115-FR-001 to F115-FR-008 |
| Units and checkpoints | Reading a checkpoint as a claim; refusals; the task list as read at launch | F115-FR-009 to F115-FR-012 |
| Inner checks and outcomes | The inner set, keep, repair, unresolved, flaky, unchecked | F115-FR-013 to F115-FR-021 |
| Caps and counting | The caps, exclusions, the exemptions of the outer loop | F115-FR-022 to F115-FR-027 |
| Closing check | The check at phase evidence; evidence set aside | F115-FR-028, F115-FR-029 |
| Resume | The ledger namespace `micro`, the resume states | F115-FR-030 to F115-FR-032 |
| Router and escalation | The shipped table, its conformance suite and sample; escalation | F115-FR-033 to F115-FR-036 |
| Reporting | Events under the types of the catalogue; the `[LOOP]` line | F115-FR-037, F115-FR-038 |
| Tripwire and revert | Breach kinds, the invariant check, the record, `tripwire clear` | F115-FR-039 to F115-FR-041 |
| Beneath a stacked layer | The integrated group as one unit | F115-FR-042 |
| Experiments | Records per check, the paired design, the window, X0 to X12 | F115-FR-064 to F115-FR-066 |

Approach: the layer is pure logic over the read-only view of the phase attempt and its ledger
namespace. It starts no process, reads no file and does not import `node:fs` or
`node:fs/promises` (F100-FR-012; `assumption: CQ-185`). Two things of this feature touch the file
system: reading a checkpoint as a claim, and the tripwire record. Both stand behind a port whose
interface is in `@specstride/contracts`; the code is in the edge package `@specstride/integrity`
(F100-FR-234) and writes with the atomic write of `@specstride/kernel`. The composition root hands
the ports to the engine. The task list as read at launch is `run:<runId>:task-list`, which the
engine writes at launch; the layer reads it through the read-only view and stores nothing of its
own. Fingerprints and the builder of the fact block are inputs and services of annex D §D.1 of
feature 100, owned by feature 116. The router table, the closed sets and the rows of the profile
are data in `contracts/`.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, the `parity` profile, line grammar) and `@specstride/kernel` (table evaluator, canonical hasher, atomic write). No dependency from npm of its own beyond the JSON Schema validator that feature 100 chose. The layer itself uses no tool of the platform

**Storage**: files of the control plane, named by logical name (feature 100, annex B §B.5): `unit:<unitId>:checkpoint`, the namespace `micro` of `run:<runId>:ledger`; read and never written: `run:<runId>:task-list` (the task list as read at launch, written by the engine), `phase:<N>:manifest`, `unit:<unitId>:check:<i>`; `user:tripwire` in user-level state

**Testing**: the test runner that Node ships (`node:test`); stub agents and verification command stubs of feature 141 with a test proposer of this feature that writes checkpoints; property tests for the router table; the second suite of feature 141 for inertness. No test calls a model or a paid service. The live experiments are tasks of their own, paid and logged

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: one package of the npm workspace (`@specstride/layer-micro`, core, L3, as the package graph of feature 100 names it), two directories of the edge package `@specstride/integrity` (L1), two port interfaces and data files of `@specstride/contracts`, the conformance suite and the sample of EP-06 in `@specstride/testkit`, and an experiment kit in the layer `dev`

**Performance Goals**: starting values with low confidence, measured in the build and in experiment X5. One decision of the router: under 1 ms. One call point of the layer, without the check it asks for: under 10 ms. Inner check time is bounded by the 15 per cent cap of the specification, not by this plan

**Constraints**: the core package imports `contracts` and `kernel` only, starts no process, opens no connection and does not import `node:fs` or `node:fs/promises` (F100-FR-012; `assumption: CQ-185`); no native module; MIT-compatible dependencies; no paid call in any test or build job; no path, account or name of the owner's machines; the layer holds no writer of the phase gate

**Scale/Scope**: 45 functional requirements (F115-FR-001 to F115-FR-042 and F115-FR-064 to F115-FR-066; 21 moved at the split), 8 success criteria; 28 integrity rules owned; 3 decision points with 20 shipped rows; 10 closed sets stated (rows 55, 56, 59, 67 and 136 to 141 of annex X §X.6); 5 rows of the `parity` profile owned (1, 2, 3, 64 and 65, the last with ten keys); 13 experiments (X0 to X12), of which this feature runs X0, X1, X5 to X12; no as-is item carried; no parity test of its own

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. The brief names Principles II, III, I, VIII, XIII, XVIII and XIV as binding;
every gate is answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX below was re-read against that sentence at the analyze run of 2026-09-30: the sentence binds a tested harness adapter that starts a critic-class call (features 100, 109, 130 and 134), and this feature builds no adapter and starts no critic-class call, so the row stands unchanged in result.*

**The gate and the loop (I–V)**

- [x] I. ✅ The layer keeps all state in the ledger and in files of the control plane, written by a temporary name and a rename through the engine. A checkpoint is read only after the pass has exited (F115-FR-010). Resume is derived from the last ledger record (F115-FR-031). The closing check is the one the principle allows, bounded by the inner caps and off when the layer is off (F115-FR-028)
- [x] II. ✅ The layer holds no writer of the phase gate (F115-FR-002). An inner result delays and never replaces the phase gate (F115-FR-028). At `contributeCriticInput` the layer returns the rows of the fact block and nothing else (F115-FR-002); the note of a checkpoint never reaches a critic-class call (F115-FR-009). A breach raises the tripwire (F115-FR-039 to F115-FR-041)
- [x] III. ✅ Inner checks are deterministic commands of the manifest frozen at launch, run by the runtime (F115-FR-013, F115-FR-015). A result that carries `tainted` or `cached` never keeps a unit (F115-FR-016). The manifest hash and the pins are verified before every check (F115-FR-014)
- [x] IV. ✅ Task ids come from the canonical spec model through EP-03 (F115-FR-009, F115-FR-012). The layer parses no spec
- [x] V. ✅ Events of the layer go through the engine to the one writer. A failure of the layer switches it off for the phase attempt and never stops a run (F115-FR-025)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the router table and the checkpoint are validated against schemas; the core package imports `contracts` and `kernel` only and no file-system module (F100-FR-012; F115-FR-002); no native module; the extension points are named with versions (`spec.md`, "Extension points")
- [x] VII. ✅ L1 works on every harness of the registry and tests no harness name (F115-FR-003). The ladder of model tiers and the containment level are capabilities read from the harness port
- [x] VIII. ✅ The second repair and every escalation start a fresh session (F115-FR-018, F115-FR-034); the layer changes no way in which a prompt is passed, never waits for a human, and writes nothing to the operator's configuration. The tripwire is the one write of the runtime to user-level state, which annex B §B.1 allows
- [x] IX. ✅ The layer gives the critic a block of facts and no tool, and starts no critic-class call (F115-FR-002). An escalation never targets a rung that equals a critic-class call in model and in effort; a rung that shares the model alone raises the critic-diversity warning (F115-FR-034; `assumption: CQ-191`)
- [x] X. N/A. The feature builds no harness adapter, so it pins no version range of a harness and records no harness version. The model-tier ladder it reads is pinned at launch by the harness port (F115-FR-034)
- [x] XI. ✅ Every fact of the layer is written under a type of the event catalogue, named in the table "Events of the layer" of `spec.md`; the layer writes no type that the catalogue does not hold (F115-FR-037). Unknown values are absent or null. No event holds output of a command
- [x] XII. ✅ No test calls a paid API. The live experiments are tasks that are paid, logged and never run by a build job (F115-FR-066). Model tiers are configuration of the harness adapter

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Every routing decision is made by a pure table and recorded with its rule id (F115-FR-033). The layer reads from a checkpoint the task ids only and treats them as a claim (F115-FR-009)
- [x] XIV. ✅ The inner set is a subset of the declared manifest; the router adds no command and builds no argument list (F115-FR-036). A unit without a command is `unchecked`, never rejected and never passed (F115-FR-021)
- [x] XV. N/A. The layer takes no part in launch consent. It bypasses no launch check, no terms gate and no budget: an escalation is skipped when the budget does not allow it
- [x] XVI. ✅ Counts of the layer survive a resume and a relaunch (F115-FR-032). A quota pause at a check boundary counts no cycle (F115-FR-026)
- [x] XVII. ✅ A unit without a command is `unchecked` and never a pass (F115-FR-021). An experiment whose precondition X0 has not passed counts no pair (F115-FR-066)
- [x] XX. N/A. This layer works units one after the other. It states only what it does beneath the layer of parallel units (F115-FR-042)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ No as-is behaviour is carried, so no requirement has an origin. Every intended difference cites its register row: the rows in the `divergence:` fields of `spec.md` (DV-011 to DV-018, DV-020, DV-046, DV-050, DV-052, DV-053, DV-079, DV-080, DV-085). Every switch is off or not used under the `parity` profile. Inertness is proven by the second suite (F115-FR-006)
- [x] XIX. ✅ Host-facing output of this feature is the `[LOOP]` line, one line per run, at most 300 bytes, and one line of `tripwire clear`. The checkpoint contract block is part of the proposer's prompt and is budgeted by the assembler of feature 103; its size is at most 1,500 bytes

Seventeen gates pass and three are not applicable (X, XV, XX). Complexity Tracking is empty.

**Re-check after Phase 1 design**, after the split, and after the cross-feature review
(2026-09-30): unchanged in result. The design adds no package: the edge package that this plan
had proposed, `@specstride/layer-micro-io`, is withdrawn, and its two directories stand in
`@specstride/integrity`. It adds no dependency from npm.

## Project Structure

### Documentation (this feature)

```text
specs/115-micro-loop-layer/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, relations, the life of a unit
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1
│   ├── README.md
│   ├── router-table.json            # the shipped table of EP-06
│   ├── closed-sets.json             # the closed sets of this feature
│   ├── parity-rows.json             # rows of the profile that this feature owns
│   ├── ledger-micro.json            # record kinds of the namespace and the resume states
│   ├── integrity-rules.json         # IR-01 to IR-60: owner, requirement, test
│   ├── experiments.json             # X0 to X12: metric, fixture, arms, rule, cost
│   ├── loop-line.md                 # keys and values of the [LOOP] line
│   └── schemas/
│       └── checkpoint.schema.json
├── tasks.md                 # Phase 2 (speckit-tasks)
├── analyze-report.md        # speckit-analyze
└── repair-report.md         # the repairs after the cross-feature review
```

### Source Code (repository root)

```text
packages/layer-micro/                # @specstride/layer-micro (core, L3)
├── src/
│   ├── register.ts                  # registration: directives and services declared
│   ├── strategy/                    # selection at launch, fallback reasons, level
│   ├── callpoints/                  # contributePrompt, afterPass, betweenPasses, nextPassBlock,
│   │                                # onEvidence, contributeCriticInput, resume, report
│   ├── unit/                        # unit id, validation of ids against run:<runId>:task-list,
│   │                                # the comparison of the task list at the phase gate, outcomes
│   ├── caps/                        # counters, caps, exclusions
│   ├── closing/                     # the closing check
│   ├── ledger/                      # record kinds, write-ahead, resume states
│   ├── router/                      # signals, the call of the table evaluator, escalation
│   ├── breach/                      # the invariants and the breach kinds
│   └── report/                      # the fields of the [LOOP] line
└── test/                            # CT-115-*
packages/integrity/                  # @specstride/integrity (edge, L1; the package is of feature 116)
├── src/
│   ├── checkpoint/                  # of this feature: reading a checkpoint as a claim
│   └── tripwire/                    # of this feature: the record and its clearing
└── test/
    ├── checkpoint/                  # CT-115-10, CT-115-155
    └── tripwire/                    # CT-115-41
packages/contracts/src/ports/        # the interfaces of the two ports: claim reader, tripwire store
packages/contracts/data/             # *-115.json: router table, closed sets, profile rows, ledger kinds, integrity rules
packages/contracts/schemas/          # checkpoint-115.schema.json
packages/testkit/src/conformance/EP-06/   # golden decisions, the one-row property
packages/testkit/src/samples/EP-06/       # the sample decision point
packages/cli/src/commands/tripwire-clear.ts
packages/doctor/src/checks/          # tripwire, invariants
experiments/115/                     # dev layer, never shipped: X0 to X12, the paired runner, reports
tests/
└── layer/115/                       # the test proposer that writes checkpoints; fixtures of units
```

**Structure Decision**: the layer is the package `@specstride/layer-micro` that
`specs/100-specstride/contracts/data/package-graph.json` names (core, L3, owner 115; it may
import `contracts` and `kernel` only, and `node:fs` and `node:fs/promises` are forbidden to it).
The reading of a checkpoint and the tripwire record need the file system. A core package reads
and writes files through the kernel and through the ports of the edge packages (F100-FR-012,
F100-FR-234; `assumption: CQ-185`), so both stand behind a port: the interface is in
`@specstride/contracts`, the code is in two directories of `@specstride/integrity`, the edge
package for the integrity of checks, and every write is the atomic write of `@specstride/kernel`.
The composition root hands the ports to the engine, which reads the checkpoint after a pass has
exited and gives the layer what it read at the call point `afterPass`. The task list as read at
launch needs no code of this feature that touches a file: the engine writes
`run:<runId>:task-list` at launch and the layer reads it through the read-only view.

The package `@specstride/layer-micro-io` of the first plan is withdrawn (item W-X-01): F100-FR-234
names three edge packages in Wave 1 and no fourth. The package graph names feature 116 as the
only owner of `@specstride/integrity`; that this feature owns two directories of it is reported
in `repair-report.md`.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Checkpoint | A JSON file in the outbox, name `checkpoint.json`; schema in `contracts/schemas/checkpoint.schema.json`. Opened with the flags for no link following and no blocking; `fstat` must say regular file; read twice and compared |
| Marker token | 16 hexadecimal characters from the random source of the platform, once per run, kept in the control plane |
| Files of this feature in `@specstride/contracts` | Every file in `data/` and `schemas/` ends in `-115` (`router-table-115.json`, `closed-sets-115.json`, `parity-rows-115.json`, `ledger-micro-115.json`, `integrity-rules-115.json`, `checkpoint-115.schema.json`). The sync of feature 100 (`packages/contracts/scripts/sync.mjs`) replaces both directories with the files of `specs/100-specstride/contracts/`; under proposal U1 of `analyze-report.md` it keeps a file whose name ends in `-<NNN>` for a feature other than 100 |
| Router table | One JSON file of `@specstride/contracts`, `router-table-115.json`, validated against `rule-table.schema.json` of feature 100 |
| Invariant check | A reader of the event file and of the ledger that the doctor and a build job share |
| Experiment kit | Scripts of the layer `dev`; results as JSON and a report in Markdown per experiment; costs written to a log file of the experiment |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The call points, the engine side of directives, the envelope of the ledger, the prompt assembler | 103 |
| The check runner, the derivation of the check manifest, the pins at launch | 105 |
| The protected set, the fingerprints, toolchain profiles (EP-16), the check result, the builder of the fact block, the package `@specstride/integrity` itself | 116 |
| The writing of `run:<runId>:task-list` at launch | The engine (feature 100, annex B §B.5), from the reading that feature 104 gives |
| The slot and the escaping of the fact block; removal of lines that carry the marker token | 117 |
| The approval record and its voiding | 101 |
| The model-tier bump after critic rejections | 149 |
| The names and fields of events, the eight types included that feature 111 added after the cross-feature review | 111 |
| The spelling of config keys | 110 |
| The doctor's registry | 112 |
| The second suite | 141 |
| The rows of the `loop` point for the layer of parallel units | 142 |
| Usage counted per model call, which X0 measures | 111 |

## Complexity Tracking

No violation. The table is empty.
