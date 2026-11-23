# Implementation Plan: Proposer pass (feature 103)

**Branch**: `103-proposer-pass` (a label; the directory is `specs/103-proposer-pass`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/103-proposer-pass/spec.md`

## Summary

Feature 103 builds the pass loop of one phase attempt, the call points of the loop-layer interface with the built-in layer `none`, the assembler of the proposer's prompt, and the carry-over files that the runtime writes (ledger records of the namespace `core`, the handoff, the index of verification obligations). It ports the baseline's `proposer.sh` and the pass-related parts of `orchestrator.sh` and `lib/error_breaker.py` for parity, fixes the quadratic start-up (ruling K7), and adds the check of the source hashes at every pass start (ruling K3).

| Deliverable | What it is | Requirements |
|---|---|---|
| Request and result of the pass loop | One typed call from the engine, one result record with the code table of annex E §E.4; usage and set-up failures; defaults | F103-FR-001, F103-FR-002 |
| Loop core | Pass numbering, pause, announcements, evidence rules, prompt fixed per phase attempt, invocation ids, `betweenPasses` | F103-FR-003 to F103-FR-007, F103-FR-009, F103-FR-010 |
| Start-up in linear time | The empty-prompt test and everything before the harness process starts | F103-FR-006, F103-FR-008 |
| Breakers and limits | Pass limit, error breaker on both paths, cap breaker, progress measurement, no-progress breaker, blocked on a human | F103-FR-011 to F103-FR-018 |
| Result mapping and quota carve-out | One table from result to engine exit and stop reason; quota classes not counted | F103-FR-019, F103-FR-020 |
| Source check at pass start | The kernel's classification of the staleness verdict (F100-FR-207, rules of feature 104; CQ-214) over the three hashes; a stop before the pass | F103-FR-021 |
| Layer call points | Eight call points in a fixed order, layer `none`, stacking, registration, directives, failure, withheld capabilities, reserved tree-store service | F103-FR-022 to F103-FR-029 |
| Prompt assembler and blocks | Provider operation `blocks`, the as-is set and its order and contents, the budget, `prompt.built`, Lisa's policy, cache-stable start, the index, the layer protocol block | F103-FR-030 to F103-FR-038 |
| Carry-over | Ledger records of the namespace `core`, counts across a resume, the handoff, the session directive and its drop rules | F103-FR-039 to F103-FR-043 |

Approach: the pass loop is a deterministic state machine over `(pass number, counters, last result)` that runs on the ports of feature 100. Every rule that the baseline scatters over the shell script, the orchestrator and the breaker module is one function with a table test: the accounting after a pass, the mapping of results, the drop rules of continuation. Everything that changes the prompt is a provider behind EP-15, so that the as-is block set and the current block set are two selections of the same assembler and the golden prompts can pin the first.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, logical names, exit codes, stop reasons); `@specstride/kernel` (the atomic write, the table evaluator, the hasher of feature 104, the redactor). The Node built-in `node:crypto` for the signature of ledger records and `node:timers/promises` for the pause between passes. Files are read, walked and renamed through the kernel (the atomic write) and the ports of the edge packages, never through `node:fs`, which the package graph forbids to `@specstride/core` (CQ-185). No dependency from npm beyond the schema validator that `contracts` already uses. The package imports no harness adapter, sink or config loader, and neither `node:child_process` nor a network module (`architecture.md` section 6; F100-FR-012)

**Storage**: files only, named by logical name (feature 100, annex B §B.5): `run:<runId>:ledger`, `run:<runId>:ledger-key`, `run:<runId>:snapshot` (read), `feature:<slug>:handoff`, `pass:<passId>:prompt`, `pass:<passId>:result`, `pass:<passId>:response` (debug). Physical paths are resolved through the layout table; this plan names none

**Testing**: the test runner that Node ships (`node:test`); the parity oracle of feature 141 for FX-17 to FX-20 and FX-24 and the golden prompts; the conformance suites of EP-04 and EP-15 in `packages/testkit/src/conformance/EP-04/` and `EP-15/`, with the samples in `packages/testkit/src/samples/EP-04/` and `EP-15/`; table tests for the accounting, the mapping and the drop rules; property tests for the ledger chain. No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67)

**Project Type**: modules of `@specstride/core` (layers L4 and L3, owners 101, 149, 103, 117, 118, 102 in `contracts/data/package-graph.json`) that belong to this feature; the conformance suites and the samples live in `packages/testkit/src/` (W-X-02)

**Performance Goals**: starting values with low confidence, measured in the build. The reference machine is the Linux runner of the build workflow of feature 100; the baseline's figure is measured again on it by T082 (its 548 s came from the owner's machine, R28). Start of a pass under 1 s of processor time on the reference machine with a prompt of 320 kB, and linear growth from 20 kB to 320 kB. Assembly of a prompt linear in its size. The handoff at most 6 KB. One append to the ledger per pass. The progress measurement stops at the first file that shows progress

**Constraints**: no native module; no process started from the core; no paid call in tests; the handoff and the ledger are refused by grounding; the baseline's text is kept byte for byte under the block set `as-is`; no path, account or name of the owner's machines

**Scale/Scope**: 44 functional requirements, 9 success criteria; 1 as-is requirement (028 FR-018) and 106 behaviour items in 20 clusters carried; 5 fixture families cited (FX-17 to FX-20, FX-24) and 5 more for single items (FX-03, FX-08, FX-13, FX-21, FX-22); 2 closed sets of feature 100 completed (rows 57 and 58) and 4 more stated; 2 rows of the `parity` profile owned (rows 59 and 60 of annex X §X.7)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1. The binding principles named by the brief are I, VIII, XI, V, VI and XVIII. All twenty are answered.

*Re-read against v3.0.1 on 2026-09-30: the sentence added to Principle IX (the weaker proof of a tool-less critic by a tested harness adapter, CQ-182) binds the features that start a critic; this feature starts none, and the row of Principle IX stands as answered.*

**The gate and the loop (I–V)**

- [x] I. ✅ The loop coordinates through files and the ports of feature 100. The ledger, the handoff and the prompt are written to a temporary name and renamed. The handoff is never read back by the runtime, so no control flow rests on it. Phase evidence is examined only after the pass has exited (F103-FR-005). The pause between passes is a timer, not a watcher
- [x] II. ✅ The pass loop produces no verdict and approves nothing. No layer can write an approval, a verdict, feedback, a hint or a recovery marker (F103-FR-028), and the build proves it by the module graph. A model never changes workflow state: a checkpoint is a claim that the runtime validates
- [x] III. ✅ The ledger, the handoff, the outbox and the control plane are refused by grounding (F100-FR-037; F103-FR-039, F103-FR-041). Text from the workspace that enters the handoff or a block is data (F103-FR-030, F103-FR-041). The source hashes are compared by the runtime, not by a model (F103-FR-021). The layer `none` adds no tool and no check
- [x] IV. ✅ The loop parses no spec. It reads the phase slice, the format's heading and the task list through the spec-format adapter port, and hashes through the one hasher (F100-FR-207)
- [x] V. ✅ A block whose provider fails is left out and the pass runs (F103-FR-030). `prompt.built` and the other events are best-effort and never stop a loop. The pass loop stops only through the rules of F103-FR-011 to F103-FR-021. The ledger is state, not observability: an invalid ledger switches the layers off and stops nothing (F103-FR-039)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every file boundary has a schema in `@specstride/contracts`: the ledger record (`specstride.ledger/1`, feature 100), the handoff (`handoff.schema.json`, T003) and every closed set (T002); the request and the result of the pass loop cross no process or file boundary (the pass loop is a call, not a command, F100-FR-171) and their schemas live with the module in `packages/core/src/pass-loop/` (T003); the core imports `contracts` and `kernel` and nothing else; plain `npm install`; no native module. Extension points implemented: EP-04 `specstride.loop-layer/1` and EP-15 `specstride.prompt-block/1`; consumed: EP-02 `specstride.harness/1`, EP-06 `specstride.router-rules/1`, EP-12 `specstride.quota-classifier/1`. A conformance suite and a sample outside the core exist for EP-04 and EP-15, in `packages/testkit/src/conformance/` (tasks T050 to T056, T061) and `packages/testkit/src/samples/` (tasks T058, T068)
- [x] VII. ✅ The loop starts every pass through `startPass` and reads capabilities; it tests no harness name (F103-FR-010, F103-FR-043). A harness that cannot continue a session is a capability value, not a name
- [x] VIII. ✅ The prompt reaches the harness through the port, and the adapter puts it on standard input where the harness accepts it. The loop never waits for a human: a changed source and a declared block end in the state `blocked-on-human` (F103-FR-018, F103-FR-021). A new phase attempt, a relaunch and a kill start a fresh session; a pass may continue only under the drop rules (F103-FR-042). Containment and the configuration home belong to the harness layer
- [x] IX. ✅ The critic has its own assembler (feature 117); no block of the proposer's assembler reaches it (F103-FR-030). This feature adds no critic input except the fact block's call point (`contributeCriticInput`), which feature 115 fills
- [x] X. N/A. Version pins of tested harness adapters belong to the harness adapters. The loop records the pass and its ids; it does not read a harness version
- [x] XI. ✅ Events are rendered by the compatibility projection in the as-is vocabulary; `prompt.built` holds sizes, hashes and ids and never content (F100-FR-200). A stream without a terminal record reads as clean in the accounting, with the flag of the stream seam beside it (F103-FR-012). Unknown values are null
- [x] XII. ✅ No test calls a paid API. The one paid activity that the brief inherits (experiments X3, X4, X9, X11) is run by the experiment plan of the micro-loop feature on the switches of this feature, and no task of this feature runs it. Secrets are never in a prompt or a record

**The host skill (XIII–XVII, for features that touch a host skill, the interface contracts or supervision)**

- [x] XIII. ✅ The handoff, the ledger and the index are facts that deterministic code writes; no model writes any part (F103-FR-037, F103-FR-041). The layer's declarations are claims that the runtime validates
- [x] XIV. N/A. This feature declares no verification command
- [x] XV. N/A. This feature is not a host skill and no consent step
- [x] XVI. ✅ Counts survive a resume and a relaunch (F103-FR-040); a quota pause spends no budget and quota classes are not counted (F103-FR-020). The loop relaunches nothing
- [x] XVII. ✅ This feature adds no prerequisite check of its own; a source that cannot be read is a stop, not a skip (F103-FR-021). The tests of this feature and the one measurement that depends on the operating system (T082) run on the macOS runner of the build workflow of feature 100 when it exists; until then every macOS statement stays `unverified`, and a test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason and never a pass (T087)
- [x] XX. ✅ Deterministic parallelism is not built here. The interface reserves the tree-store service and the group directives (F103-FR-029, F103-FR-026); with parallel units off no directive of a group is issued, and a worker pass changes no counter of the outer loop

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour cites its origin, disposition and proving test (spec: 028 FR-018 and 106 items). Three preserved defects (D-44, D-45, D-48) are stated and tested. The fixed defect has DV-087. Intended differences have register rows (DV-005, DV-007, DV-010, DV-011, DV-045, DV-067, DV-082, DV-092, DV-094 and others). Under the `parity` profile the layer, continuation, the ledger records after every pass, the handoff, the index and the source check at pass start are off
- [x] XIX. ✅ The feature prints nothing into a host session in default output; the lines it carries are compatibility output and are as the baseline prints them. The budget of host-facing output of this feature is 0 bytes in default output

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency and no process. The one design choice that touches a principle is the signature of the ledger by a key that is not the approval key (F100-FR-068); it uses `node:crypto` and adds no dependency.

## Project Structure

### Documentation (this feature)

```text
specs/103-proposer-pass/
├── spec.md                  # the specification
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, relations, the states of one pass
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1: internal interfaces and data tables of this feature
│   ├── README.md
│   ├── pass-loop-request.schema.json   pass-loop-result.schema.json
│   ├── result-map.json                 # the mapping table of F103-FR-019
│   ├── accounting-order.json           # the order after a pass (F103-FR-022)
│   ├── fresh-session-reasons.json      # the eleven drop rules and their parameters
│   └── core-ledger-kinds.json          # the closed set of F103-FR-039
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

The modules belong to `@specstride/core` (`contracts/data/package-graph.json` lists 103 among its owners). Directories are proposals; the feature names no file of another feature.

```text
packages/core/src/
├── pass-loop/                       # feature 103
│   ├── request.ts                   # the request record; defaults; validation of F103-FR-002
│   ├── loop.ts                      # the state machine of one phase attempt
│   ├── accounting.ts                # the accounting after a pass: errors, caps, no progress, pass limit
│   ├── progress.ts                  # the measurement of disk progress
│   ├── result-map.ts                # result to engine exit and stop reason (one table)
│   ├── source-check.ts              # the hash comparison at every pass start
│   ├── empty-prompt.ts              # the linear test for an empty prompt
│   ├── announce.ts                  # events and lines of the pass loop, as compatibility output
│   └── invocation-id.ts
├── layers/                          # feature 103: the core side of EP-04
│   ├── call-points.ts               # the eight call points and their fixed order
│   ├── none.ts                      # the built-in layer
│   ├── registry.ts                  # registration, negotiation, stacking, refusal
│   ├── directives.ts                # execution and accounting of the eleven directives
│   └── attempt-view.ts              # the read-only view, with workerId and groupId
├── prompt/                          # feature 103: EP-15 for the proposer
│   ├── assembler.ts                 # one assembler; the budget; protected blocks; prompt.built
│   ├── providers/                   # spec-context, index, handoff, feedback, hint, acceleration,
│   │                                #   yield-schema, layer-protocol, plugin-protocol slot
│   ├── as-is-set.ts                 # the five blocks in their fixed order
│   ├── current-set.ts               # stable first, the stable start hash
│   └── context-policy.ts            # Lisa's per-source budgeting, extracted
├── carry/                           # feature 103
│   ├── ledger-core.ts               # the namespace `core`: kinds, counters, chain check on resume
│   ├── counters.ts                  # counts across a resume; the reset record
│   ├── handoff.ts                   # the writer of the handoff
│   ├── index.ts                     # the index of verification obligations
│   └── session-directive.ts         # the drop rules; the directive per pass
└── (other directories: features 101, 102, 117, 118, 149)
tests/
├── parity/103/                        # PT-103-*: parity tests through the oracle
├── characterization/103/              # CT-103-*: own tests, the Lisa extraction
packages/testkit/src/
├── conformance/EP-04/                 # the conformance suite of EP-04 `specstride.loop-layer/1`
├── conformance/EP-15/                 # the conformance suite of EP-15 `specstride.prompt-block/1`
├── samples/EP-04/                     # sample layers `noop` and `stacked`
└── samples/EP-15/                     # the sample block provider
```

**Structure Decision**: the modules live in `@specstride/core` because the pass loop, the layer registry and the assembler run in the engine process and may import only `contracts` and `kernel`. The sample layers and the sample provider live in `packages/testkit/src/samples/EP-04/` and `packages/testkit/src/samples/EP-15/`, outside the core, so that a core file cannot name them (F100-FR-018). The layer packages `layer-micro` and `layer-parallel` are other features' packages; this feature ships the interface and the layer `none`.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Result of the pass loop | A typed record; `exit_code` from the closed table of annex E §E.4; an optional field `blocked` (reason and file); no process boundary (LR-6). A test asserts that no other value occurs |
| Accounting after a pass | One function over `(counters, pass outcome)` that returns the new counters and the decision; the kill check, the yield check and the layer run before it (F103-FR-022). The table of the accounting is data in `contracts/accounting-order.json` and is checked against F103-FR-012 to F103-FR-017 |
| Disk progress | A pruned walk of the progress roots; the walk skips the repository directory, the workspace part, `node_modules` and `.venv`; it stops at the first file with a modification time later than the start stamp minus one second. Modification times are compared as whole seconds, as `find -newermt` does |
| Empty prompt | A single scan for one non-white-space character in the set of the baseline's C locale (space, tab, newline, vertical tab, form feed, carriage return). The scan stops at the first one. It replaces the expansion at `proposer.sh:1807` |
| Source check | The kernel's hasher over the three files and the kernel's classification of the staleness verdict (`unchanged`, `ticks-only`, `changed`, `unreadable`; F100-FR-207, rules of feature 104, CQ-214) against `sourceHashes` of the run snapshot; the hash that ignores checkboxes for the task list; run before the prompt is built and before `startPass` |
| Ledger record signature | HMAC-SHA-256 over the canonical record hash with the ledger key; the chain field `prev` is the canonical hash of the record before. Verification on resume reads the whole file once |
| Handoff | Rendered from the ledger, the plan and the last kill note by one function; truncated at the last complete line under 6 KB with a marker; written to a temporary name and renamed |
| Index | A pure function of the verification plan; `id`, title cut to `carry.indexTitleChars` characters (starting value 80, low confidence; experiment X3 of feature 115 may change it; the same in every pass of a run), the logical name of the full text; sorted as the plan sorts its obligations |
| Context window in characters | The harness gives its window in tokens (annex C §C.2, record `models`); Lisa's caps are in characters. Starting ratio 4 characters per token, a constant of `context-policy.ts` with low confidence; window, ratio and character budget are recorded in `prompt.built` (F103-FR-035) |
| Schemas | The request and the result of the pass loop: `packages/core/src/pass-loop/*.schema.json`, internal (no process or file boundary). The handoff: `packages/contracts/schemas/handoff.schema.json`, a file boundary. The copies in `specs/103-proposer-pass/contracts/` are the design record; the build compares them |
| Prompt assembly | Blocks are byte strings with metadata; the assembler concatenates in one pass and computes the hash of each block and of the stable start; no quadratic operation on the prompt |
| Session directive | A pure function of the phase attempt's record of sessions (continued passes, last observed context, last request time), the capabilities and the configuration; the reason is one member of the closed set of F103-FR-042 |
| Layer registration | A registration call that validates the declaration against the directives and services the engine offers; the module graph check is a build step of feature 100 |

## What is planned elsewhere

| Subject | Where |
|---|---|
| Watchdogs, kills, kill notes, the polite stop, yield and detached jobs, the short-pass counter and its nudge block, fail-fast | 118 |
| The micro-loop layer, its ledger kinds, the router table, escalation, the fact block | 115 |
| The layer `parallel`, the group executor, the tree store, integration | 142 |
| The hasher, the staleness verdict, the spec-format adapters | 104 |
| Launch and resume checks of the hashes; `--reset-counts`; `--accept-source-change` | 102 |
| Starting a harness, its arguments, the continuation flags of each harness | 109; 125, 130, 131, 134, 138 |
| Reading the stream; invocation identity and retention | 126 |
| The critic's assembler and prompt | 117 |
| Quota classification, the pause and the wait | 127 |
| The event types and their fields; the compatibility projection | 111 |
| Config key spelling and defaults | 110 |
| The parity oracle and the fixture families | 141 |
| Experiments X3, X4, X9 and X11 | 115's experiment plan, on the switches of this feature |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | The request and result records, the accounting table, the result map, the empty-prompt test, the progress measurement; table tests | `contracts` |
| 2 | The pass loop on stub ports; the announcements as compatibility output; parity tests FX-17 to FX-20, FX-24 with the reference on both sides until the port exists | Feature 141 stubs |
| 3 | The assembler with the as-is set; golden prompts (N-24) | Feature 141 |
| 4 | The layer `none`, the call points, the registry, the conformance suite with the sample layers | Step 2 |
| 5 | The ledger records of the namespace `core`, counts across a resume, the source check | Step 2, feature 104's hasher |
| 6 | The current set: stable start, the index, Lisa's policy, the handoff | Steps 3 and 5 |
| 7 | The session directive and its drop rules | Step 5 |
| 8 | The second suite and the inertness suite | The micro-loop layer |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
