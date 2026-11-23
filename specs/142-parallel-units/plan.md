# Implementation Plan: Parallel units (feature 142)

**Branch**: `142-parallel-units` (a label; the directory is `specs/142-parallel-units`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/142-parallel-units/spec.md`

## Summary

Feature 142 builds the option "parallel units": the loop layer `parallel`, the parallel plan,
the audits of a delta and the merge check. The option is off by default and off under the
`parity` profile (ruling 56). The engine services behind the group directives left this feature
at the split of 2026-09-29; the layer reaches them through contracts of feature 100.

| Deliverable | What it is | Requirements |
|---|---|---|
| The layer `parallel` | Registration, preconditions, fallback reasons, inertness, decisions at the call points of EP-04 | F142-FR-001 to F142-FR-006, F142-FR-023, F142-FR-024 |
| Planner | Candidates, scopes, the eight admission checks, groups, the stored plan | F142-FR-007 to F142-FR-017, F142-FR-019, F142-FR-020 |
| Reservation and prompt blocks | The reserved-tasks block, the worker block, the neutral handoff | F142-FR-018, F142-FR-069 |
| Accounting and reporting | Cycles, time, killed passes, the `[LOOP]` fields, the events | F142-FR-021, F142-FR-022, F142-FR-025 |
| Audits | Scope, protected set, path leak, single-writer files, refusal reasons | F142-FR-054 to F142-FR-058 |
| The consumed services | Worker trees and writes to the workspace only through the contracts of feature 100 | F142-FR-074 |
| Merge check and its outcome | The check, the empty set, the kept unit of work, the verification gate | F142-FR-059 to F142-FR-064 |
| What the critic and the proposer are told | The fact block rows, neutral kinds, vocabulary, the sweep before a critic-class call | F142-FR-065 to F142-FR-070 |
| Breach conditions and experiment E6 | Invariants for the doctor and the build; FX-PAR-S and FX-PAR-L | F142-FR-071 to F142-FR-073 |

Approach: the layer is a pure decision component that returns directives; the engine executes
them. The audits read deltas through the tree-store operation `changed` and decide which delta
is accepted; the merge check runs through the check runner.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` and `@specstride/kernel`. No dependency from npm is added. git is reached only through the tree-store service

**Storage**: files only, and none written by the layer itself. The parallel plan under `run:<runId>:parallel-plan`; the counters and decisions of the layer in `run:<runId>:ledger`, both written by the engine. The record kinds of the ledger namespace `parallel` are row 184 of annex X §X.6 and are not defined here. All by logical name (feature 100, annex B §B.5)

**Testing**: the test runner that Node ships (`node:test`); stub harnesses of the test kit and of feature 141, §O.3. No test calls a model. FX-PAR-L is a paid experiment, run by a person and logged

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): a file system that ignores case

**Project Type**: one package of the npm workspace (`@specstride/layer-parallel`) and one module group inside `@specstride/core` (audits, merge check, breach invariants)

**Performance Goals**: starting values with low confidence. The plan of a feature of 200 tasks under 1 s; the audits of a group under 1 s. All group overhead counts inside the 15 per cent budget of inner check time

**Constraints**: nothing is written under the project's repository directory; no native module; no paid call in tests; the layer package and the module group in the core start no process, open no connection and import neither `node:fs` nor `node:fs/promises`: files are read and written through the kernel and through the ports of the edge packages (F100-FR-012; assumption: CQ-185); no name of a harness in shared control flow; no path or name of the owner's machines

**Scale/Scope**: 46 functional requirements in two groups (G-A 25, G-C 20, and 1 added at the split) and 7 success criteria; 1 as-is requirement carried (002 FR-048, three clauses); 5 closed sets of annex X §X.6 (rows 60, 61, 63, 185 and 186); 8 rows of the `parity` profile (20 to 23, 93, 94, 96 and 130); 0 parity tests of its own

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1.

*v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182). The row of Principle IX was re-read against that sentence at the analyze run of 2026-09-30: this feature makes no critic-class call and proves no tool-less form, so the row stands unchanged.*

**The gate and the loop (I–V)**

- [x] I. ✅ The plan is a file with its hash; the decisions and counters of the layer are ledger records written through the engine; the layer holds no state outside its ledger namespace (F142-FR-017, F142-FR-006). Workers and the engine share no channel but files
- [x] II. ✅ The layer holds no writer of the phase gate (F142-FR-006). The merge check never approves; the verification gate runs in full on the workspace and the critic is called after it (F142-FR-062). The critic sees one unit per group and no history (F142-FR-065, F142-FR-067)
- [x] III. ✅ The merge check is the inner check set, fixed at launch and run by the runtime (F142-FR-059). Scopes come from the consumer or the text of the task at launch, never from the proposer (F142-FR-010). Project configuration narrows only. The protected-set audit is stricter than `tainted` (F142-FR-055)
- [x] IV. ✅ The marker `[P]`, task ids and ticks come through the spec-format adapter (F142-FR-007; feature 100, F100-FR-124). The planner parses no task list by itself
- [x] V. ✅ The `parallel.*` events go through the one writer of the engine; a sink that fails does not reach the group (F142-FR-025)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the plan and the closed sets have schemas in `contracts/`; the layer package imports `contracts` and `kernel` only and no file-system module (assumption: CQ-185); plain `npm install`; no native module; extension points: implements EP-04 (the layer) and EP-15, consumes EP-02, EP-03, EP-05, EP-12, EP-16, each at major 1
- [x] VII. ✅ The option reads `concurrentSessions`, the containment ceiling and `spendLimit` from the registry (F142-FR-020). No requirement names a harness. A discovered harness never runs a group
- [x] VIII. ✅ The layer requests a worker pass as a fresh session on the base model tier and asks for no yield and no repair in it (feature 100, F100-FR-083, F100-FR-133). What a proposer is told is minimal and neutral (F142-FR-069)
- [x] IX. ✅ No critic-class call is made by this feature. It guarantees that no worker tree exists when one starts, and that a critic with read-only tools is called only with confirmed read denial (F142-FR-070)
- [x] X. ✅ Every worker pass records the harness version through the harness port. The three facts this feature rests on are `unverified` with their checks (F142-FR-003, F142-FR-020, F142-FR-070)
- [x] XI. ✅ Events of the layer carry `workerId` and `wseq` where they concern a worker; usage is counted per model call per worker and never invented (F142-FR-022, F142-FR-025). The events project to nothing in the compatibility projection
- [x] XII. ✅ Tests use stubs. FX-PAR-L is a paid experiment: a task that says so, logged, not run in Stage B (F142-FR-072). No model id in any rule

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Admission is a pure function and every verdict is recorded with its check and detail (F142-FR-011). The plan is frozen with its hash (F142-FR-017)
- [x] XIV. ✅ The merge check runs declared commands only. An empty inner set gives `unchecked`, never a pass and never a rejection (F142-FR-012, F142-FR-060)
- [x] XV. N/A. The feature adds no launch path. The dry run prints the plan and starts nothing (F142-FR-017)
- [x] XVI. ✅ A worker pass spends no outer counter; paused time is excluded from every time cap (F142-FR-021). Nothing removes a lock
- [x] XVII. ✅ A failed precondition is a fallback with its reason, never an error and never a silent pass (F142-FR-002). macOS is `unverified`
- [x] XX. ✅ This feature implements the principle. A marker is a claim (F142-FR-007); scopes are declared and disjoint (F142-FR-009 to F142-FR-011); every admission is recorded; each worker has a tree of its own and no model merges (feature 100, F100-FR-122, F100-FR-123; F142-FR-074); the merge check and the full verification gate run on the integrated tree before the critic (F142-FR-059, F142-FR-062); no verdict, no outer counter, no exit code, no stop reason (F142-FR-004, F142-FR-021)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ 002 FR-048 is carried with origin, disposition and test `CT-142-1`. The intended differences are DV-080, DV-084, DV-085, DV-086, DV-088, DV-010. The option is off under the `parity` profile, so the oracle is untouched; the inertness tests prove it
- [x] XIX. ✅ Host-facing output of the feature is the fields of one `[LOOP]` line and the fallback reason in the launch message: at most 120 bytes added to a line that exists. The plan is printed only by the dry run and the doctor, on request

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no package and no dependency.

## Project Structure

### Documentation (this feature)

```text
specs/142-parallel-units/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities and the states of a group
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/
│   ├── README.md
│   ├── closed-sets.json         # the five closed sets of the feature
│   ├── loop-fields.json         # the fields of the [LOOP] line and of the run record
│   ├── vocabulary.json          # the list of the vocabulary test
│   └── fx-par.json              # the fixtures of FX-PAR-S and FX-PAR-L
├── tasks.md                 # speckit-tasks
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/layer-parallel/             # @specstride/layer-parallel (L3, core rule: contracts and kernel only)
├── src/
│   ├── types.ts                     # plan, scope, group, audit verdicts, the five closed sets
│   ├── register.ts                  # registration, declared directives and services
│   ├── preconditions.ts             # fallback reasons
│   ├── scope.ts                     # normalisation, comparison, sources
│   ├── admission.ts                 # the eight checks, greedy grouping
│   ├── plan.ts                      # the plan and its hash
│   ├── decide.ts                    # call points: betweenPasses, resume, report
│   ├── blocks.ts                    # reserved-tasks block, worker block
│   ├── facts.ts                     # contributeCriticInput: one unit per group
│   └── doctor.ts                    # doctor checks: the plan, unchecked resources, breach invariants
├── data/                            # copy of contracts/ of this feature
└── test/
packages/core/src/parallel/          # inside @specstride/core, behind interfaces
├── audits.ts                        # scope, protected set, path leak
├── merge-check.ts
├── fingerprints.ts                  # the fingerprints of a group and the frozen workspace
├── before-critic.ts                 # the sweep before a critic-class call
└── breach.ts                        # invariants for the doctor and the build
tests/
├── characterization/142/            # CT-142-1
├── inertness/142/                   # three ways per micro-loop fixture
├── conformance/142/                 # EP-04 group sample
├── parallel/142/                    # CT-142-101 to CT-142-125, CT-142-154 to CT-142-173
└── experiment/E6/                   # FX-PAR-S; the harness of FX-PAR-L
```

**Structure Decision**: the layer is its own package under the core import rule, as the package
graph of feature 100 names it. The audits, the merge check and the breach invariants are engine
code that the layer directs; they live in the core and reach the tree store, the check runner
and the ledger through interfaces. Neither place imports a file-system module: the sweep before
a critic-class call, the reading of stored objects and the storing of the plan are done behind
ports of the edge packages (F100-FR-012; assumption: CQ-185).

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Plan hash | The canonical record hash of feature 100, annex X §X.5 |
| Scope from the text of a task | Path-like tokens of the task line as read at launch: a token with a separator or a file extension, inside the workspace |
| Case folding | Unicode simple case folding and normalisation form C, applied only where a probe at launch finds that the file system ignores case. The probe is made behind a port of an edge package; the layer receives its result as a value |
| Path-leak search | A byte search for the real paths and the token, in the stored objects of added and changed paths, read through the tree-store service |
| Ceiling of workers | The value of `loop.parallel.workersMax` in force at launch (default 4), read from configuration; no constant in the code |
| Vocabulary test | A word-boundary search, case-insensitive, with the serial run of the same fixture as baseline |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The loop-layer interface, the core side of the group directives, the sample layer | 100, 103 |
| The tree store, worker trees, the group executor, composition, the application and the ticks, the ledger records of a group, resume states | The content owner of the engine services (feature 100, annex D §D.2) |
| The inner check set and the check manifest | 105 |
| The check runner | 148 |
| Fingerprints, the protected set, toolchain profiles, the content of the fact block | 116 |
| The micro-loop layer | 115 |
| Watchdogs, kills and the polite stop | 118 |
| The process registry and the run token | 122 |
| The pause record and the quota classifier | 127 |
| The `parallel.*` event types and their fields, among them `taskId` of `parallel.admission` and `step` and `pathCount` of `parallel.integration`, which F142-FR-025 needs | 111 |
| The capabilities per harness, and the three `unverified` facts | 109 and the harness adapter features |
| Grounding refusal of the worker root and the store | 117 |
| The spelling of the configuration keys | 110 |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | Scope, admission, plan; golden decisions | The canonical spec model |
| 2 | Preconditions, fallback reasons, registration, inertness tests | The micro-loop fixtures |
| 3 | Decisions at the call points, reservation, prompt blocks, accounting | The core side of the group directives |
| 4 | Audits, merge check, outcome, fact rows, vocabulary test | The tree-store service; the check runner; the fact block |
| 5 | Characterization test, breach invariants | The engine services |
| 6 | FX-PAR-S; then FX-PAR-L by a person | Everything above |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
