# Implementation Plan: Harness seam (feature 109)

**Branch**: `109-harness-seam` (a label; the directory is `specs/109-harness-seam`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/109-harness-seam/spec.md`

## Summary

Feature 109 builds the seam between the engine and every harness: the one open registry, the core
side of the harness port (EP-02), the generic harness adapter that a harness descriptor drives,
and what every call has in common (containment, overlay, environment allow-list, proof of the
critic's form). It also builds the conformance suite that the five harness adapters of Wave 1 and
every descriptor pass.

| Deliverable | What it is | Requirements |
|---|---|---|
| Registry | Entries, capability levels, qualifier forms, queries, display, precedence of sources | F109-FR-001, F109-FR-002, F109-FR-005 to F109-FR-008, F109-FR-013 |
| Port, core side | The eight operations with time limits, degradation, the terms gate before every call, capabilities with provenance | F109-FR-003, F109-FR-004, F109-FR-012 |
| Typed failures and critic-class call | `classify`; one call, time limit, as-is detail texts | F109-FR-009, F109-FR-010 |
| Transports | The closed set, availability, choice by the consumer | F109-FR-011 |
| Descriptor loader | Validation, sources, precedence, bundled descriptors | F109-FR-014, F109-FR-015, F109-FR-023 |
| Generic harness adapter | Kind `cli`; kinds `openai-chat` and `anthropic-messages` (the two completion clients extracted from Lisa); endpoint safety; stream hand-over; executable resolution; telemetry and memory switches | F109-FR-016 to F109-FR-022 |
| Doctor checks and `harness verify` | Three checks per harness; the command and its stored result, the record `specstride.harness-verify/1` with the field names of its owner (feature 100, annex B §B.20) | F109-FR-024, F109-FR-025 |
| Containment | Levels, ceilings, default, opt-in, record; the as-is assertion under `parity` | F109-FR-026, F109-FR-027 |
| Environment allow-list | One builder of the environment of a call | F109-FR-028 |
| Overlay | Policy per auth tier, declaration rules, scope, build, lifecycle, result codes, sweep and reap, the overlay of a critic-class call | F109-FR-029 to F109-FR-036 |
| Critic forms and proofs | Two forms; three kinds of proof; the record | F109-FR-037 to F109-FR-040 |
| Versions | Pins, recorded versions, warnings | F109-FR-041 |
| Conformance suite | The suite in the test kit; the descriptor-only fixture; the part for the second form; the sample outside the core | F109-FR-042 to F109-FR-044 |

Approach: R20's option D. A tested harness adapter is a descriptor plus optional code; the
generic harness adapter is the same port driven by the descriptor alone. The overlay is a port of
the baseline's overlay tool, function by function, because 51 of the 75 kept behaviour items of
this feature are overlay behaviour.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (schemas of the descriptor and the overlay, closed sets, the `parity` profile, the alias and component tables), `@specstride/kernel` (atomic write, table evaluator, the process primitive of feature 122, the redactor of feature 111). The one JSON Schema validator of the workspace, which feature 100 chose (`specs/100-specstride/research.md` D-2) and which this package reaches through `@specstride/contracts`; this plan names no validator of its own. Harness descriptors are YAML files (`user:harness:<id>`, `package:harness:<id>`): they are read with the one YAML parser of the workspace (MIT-compatible, pure JavaScript), which feature 100 records in its research D-8 and which is a dependency of the configuration loader of feature 110 only. This package receives the parsed value through a port that the CLI fills at process start, and names no parser of its own. No provider SDK: the two endpoint clients use the HTTP client that Node ships. The Agent SDK is an optional dependency of `@specstride/adapter-claude` (feature 125) and none of this package

**Storage**: files only, named by logical name (feature 100, annex B §B.5): `user:harness:<id>`, `package:harness:<id>`, `user:harness-verify:<id>` (schema id `specstride.harness-verify/1`, annex B §B.20), `overlay:<id>:tree` in the temporary directory, `pass:<passId>:prompt-transfer`. The seam writes facts into `pass:<passId>:invocation` and `attempt:<N>:<k>:<n>:critic-invocation` through the engine, which is their one writer. Bundled descriptors are files of the package, read by the logical name `package:harness:<id>`

**Testing**: the test runner that Node ships. Fake binaries (Node-shebang files) and a fake endpoint on loopback. Parity tests through the oracle of feature 141 (FX-01, FX-05, FX-06, FX-11, FX-21, FX-26, FX-39). The scenario `FX-26/root-sandbox-assertion` needs the effective user id 0 and is a skip with its reason without it. Six characterization tests: four of behaviour extracted from Lisa, one of the as-is line for a registry that cannot be read (no fixture reaches it), one that measures the bytes of host-facing output. No test calls a model or a paid service, and no test of the product starts an interpreter of another language

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed the oracle (ruling 67): file modes of an overlay, the start time of a process, the sandbox of a harness

**Project Type**: one package of the npm workspace, `@specstride/harness` (layer L1; owners 109, 124, 126 and 146 by the package graph of feature 100), each feature in its own directory; the conformance suite in `@specstride/testkit`; interfaces and schemas in `@specstride/contracts`

**Performance Goals**: starting values with low confidence, measured in the build. Building the registry from 20 descriptors: under 50 ms without probes. Building an overlay: under 50 ms. The sweep at start-up with 100 trees in the temporary directory: under 200 ms. The conformance suite on one harness adapter: under 60 s. The seam adds under 20 ms to the start of a pass

**Constraints**: no native module; no paid call in tests; plain `npm install`; MIT-compatible dependencies; the core imports nothing of this package; no name, path, model or gateway of the owner's machines in any file; the product never installs or downloads a harness; secrets never in an argument list

**Scale/Scope**: 44 functional requirements (unchanged by the repairs of 2026-09-30), 7 success criteria; 2 as-is requirements and 75 kept behaviour items in 21 clusters carried, 1 success criterion and 19 items not carried; 5 extension points (1 implemented, 4 consumed); 21 closed sets of annex X §X.6 owned (rows 26, 28 to 30, 32, 33, 35 to 37, 43, 87, 88, and rows 123 to 131, which this feature introduced); 5 rows of the `parity` profile; 7 fixture families cited; 6 characterization tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0. Brief 109 names Principles VI, VII, VIII, IX, X and XII as binding; all
twenty are answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); the row of Principle IX below already records it.*

**The gate and the loop (I–V)**

- [x] I. ✅ The seam holds no state between calls beyond the registry of the process, which is read-only after launch. Overlay markers, environment records and verification results are files, written atomically. Nothing watches
- [x] II. ✅ The seam produces no verdict. A failed critic-class call is reported; the phase gate scores it (F109-FR-010). Every critic-class call is a fresh session with a minted session id (F109-FR-038)
- [x] III. ✅ With one exception that the principle itself states. The first form has no tools; the second form (owner rulings 57, 57a, D1) holds read-only tools in a sandbox, limited to reading project files, with the withheld paths denied and confirmed (F109-FR-039). A descriptor is data: argument lists are lists, never shell text (F109-FR-014). Project configuration cannot declare a harness (F109-FR-015)
- [x] IV. N/A The seam reads no spec
- [x] V. ✅ Doctor checks and the recording of versions and proofs are best-effort, apart from the proof of the critic's form, which blocks the call and is not observability

**The product and its edges (VI–XII)**

- [x] VI. ✅ On the reading of CQ-186 (a tool of the build that is never shipped is no component of the Language Ledger): the coverage script of the specification is written in Python and is run by the orchestrator, outside the product; no test of this feature starts it (T102). Strict TypeScript; every descriptor, overlay declaration, marker and endpoint reply is validated against a schema; the core imports only the interface of the port from `contracts`; no provider SDK in this package; extension points named with versions in `spec.md`
- [x] VII. ✅ This feature is the registry. No closed list: bundled descriptors are data, the text search of F109-FR-008 fails the build on a harness name in the core, unverified harnesses run at auth tier 1 or 2 only (F109-FR-013)
- [x] VIII. ✅ Prompt by standard input where the harness takes it, else a file, else a bounded argument (F109-FR-016); no prompt is suppressed by a guessed flag; the real home is never written at auth tier 1 and a throwaway home is used at auth tier 2 (F109-FR-029); auto-loaded context and native memory off (F109-FR-022); strongest containment by default, and no containment (C0) only by opt-in in user configuration, not from the environment, a flag or project configuration (F109-FR-026, `assumption: CQ-183`)
- [ ] IX. ❌ Deviation, recorded in Complexity Tracking. What passes: the proof from the initial record (empty tool list and the minted session id) for the first form, and the read-only sandbox for the second form, which the principle states (F109-FR-037 to F109-FR-040); no default context window (F109-FR-037); an authentication failure is named (F109-FR-009). The deviation: for a tested harness adapter whose stream has no initial record, F109-FR-038 accepts the proof by pinned configuration (the exact version pin, the preflight and the flag set of the call), recorded for every call as the weaker proof, where the principle asks that the adapter verifies from the harness's own initial record that the tool list is empty and the session is the one it minted. The question CQ-182 was answered by the owner on 2026-09-30 (the recommended answer stands; Principle IX v3.0.1 names the weaker proof); this row stays until the first implementation slice removes it
- [x] X. ✅ F109-FR-041
- [x] XI. ✅ The seam reads no stream itself and hands it to the reader of feature 126 (F109-FR-019); unknown values are null (F109-FR-004, F109-FR-017, F109-FR-041)
- [x] XII. ✅ Fake binaries and a fake endpoint only; the terms gate is asked before every call (F109-FR-003); auth tier 3 is not a valid value (F109-FR-013); secrets by reference, resolved at the moment of use (F109-FR-018); no model id in code. `harness verify` is the one live path; it runs only on request and inside a stated budget (F109-FR-025)

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ Every capability carries its provenance (F109-FR-004); the classification of a failure by a descriptor is a table
- [x] XIV. N/A The seam declares no verification command
- [x] XV. ✅ Nothing in the seam bypasses the terms gate or a launch check; a comment of the consumer never reaches the seam
- [x] XVI. N/A The seam relaunches nothing. It hands typed failures to the quota classifier unchanged (F109-FR-009)
- [x] XVII. ✅ A test that lacks its prerequisite (a sandbox of the operating system, a macOS runner, the effective user id 0 for `FX-26/root-sandbox-assertion`) is a skip with its reason, never a pass; a skip blocks a release
- [x] XX. N/A The seam runs nothing in parallel. It reports `concurrentSessions` as declared, or null (F109-FR-004)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ 23 requirements carry an origin, a disposition and a test; the 20 rows not carried are listed with their register rows; divergences DV-001, DV-002, DV-004, DV-006, DV-027, DV-030, DV-047, DV-064, DV-066, DV-068, DV-081 are named; the rows 25, 27 to 30 of the `parity` profile set the as-is behaviour
- [x] XIX. ✅ The seam prints to a host only through `harness verify` and through doctor findings. The figures: a doctor finding of this feature is at most 200 bytes; the default output of `harness verify` is one line per result of at most 200 bytes, and at most 4,096 bytes for one harness (`--json` on request is outside the figure). Starting values; the limit in force is the one that the owner of the command derives from feature 100, annex G §G.5 (F100-FR-187). Task T108 (test CT-109-110) measures the bytes with the budget helper of feature 100 (its task T194, `packages/testkit/src/static/budget.ts`) and fails the build on a breach. The seam has no share of a host skill's budget of its own

**Re-check after Phase 1 design, and after the cross-feature review (2026-09-30)**: nineteen rows
pass or do not apply. Row IX does not pass against the text of the principle: the proof by pinned
configuration is a deviation from a NON-NEGOTIABLE principle, recorded in Complexity Tracking
with the question CQ-182. The critic with read-only tools is no deviation: Principles III and IX
state it themselves.

## Project Structure

### Documentation (this feature)

```text
specs/109-harness-seam/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1
│   ├── README.md
│   ├── closed-sets.json
│   ├── capability-levels.json
│   ├── overlay-marker.schema.json
│   ├── overlay-rules.json
│   ├── conformance-cases.json
│   ├── parity-rows.json
│   └── traceability.json
├── checklists/requirements.md
├── tasks.md                 # speckit-tasks
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/contracts/src/harness/        # interface of the port, types of the closed sets (owner 100; this feature fills the content)
packages/harness/                      # @specstride/harness (L1; owners 109, 124, 126, 146)
├── data/descriptors/                  # bundled descriptors, as data
├── src/
│   ├── registry/                      # entries, levels, qualifier forms, queries, display, precedence
│   ├── port/                          # the core side: calls with time limits, degradation, terms gate
│   ├── descriptor/                    # loader, validation, sources
│   ├── generic/
│   │   ├── cli.ts                     # kind cli
│   │   ├── openai-chat.ts             # extracted from Lisa, names removed
│   │   └── anthropic-messages.ts      # extracted from Lisa, names removed
│   ├── endpoint/                      # bound host, refusal of plain addresses and redirects
│   ├── failures/                      # classify; the failures map of a descriptor
│   ├── critic-call/                   # one call, time limit, detail texts
│   ├── transports/
│   ├── executable/                    # resolution, refusals, version
│   ├── containment/                   # levels, ceilings, default, opt-in, the as-is assertion
│   ├── environment/                   # the allow-list
│   ├── overlay/                       # declaration, scope, build, lifecycle, sweep, reap, marker, env record
│   ├── proof/                         # three kinds of proof and their record
│   ├── versions/
│   ├── doctor/                        # the three checks
│   ├── verify/                        # harness verify
│   ├── discovery/                     # features 124 and 146, not this feature
│   └── stream/                        # feature 126, not this feature
└── test/                              # CT-109-*
packages/testkit/src/conformance/EP-02/     # the suite, the fake binary, the fake endpoint (published test kit)
packages/testkit/src/samples/EP-02/         # the sample outside the core (published test kit)
tests/
├── parity/109/                        # PT-109-*
├── characterization/109/              # CT-109-109, the line for a registry that cannot be read
├── conformance/harness/
│   └── descriptor-only/               # the descriptor-only fixture: fake CLI, fake endpoint
└── boundary/                          # the text search for harness names in the core
```

**Structure Decision**: the package `@specstride/harness` of
`specs/100-specstride/contracts/data/package-graph.json`, which may import `contracts` and
`kernel` only. The graph names four owners of the package: 109, 124, 126 and 146. Features 124
and 146 own the directory `discovery/`, feature 126 the directory `stream/`. The conformance
suite and the sample live in the published test kit, in `packages/testkit/src/conformance/EP-02/`
and `packages/testkit/src/samples/EP-02/`, so that a descriptor author can run them (F100-FR-017).
Feature 100 builds the contract-level suite and a minimal sample in the same folders; this
feature, the content owner of EP-02, adds its cases there. The descriptor-only fixture is a test
of a whole run and no part of the suite; it stays in `tests/conformance/harness/descriptor-only/`.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Registry queries | Functions of `registry/` that return `{exit_code, stdout, stderr}`; the oracle compares them with the as-is commands through the component-name table |
| Overlay tree name | `specstride-overlay.<key>.<random>` in the real temporary directory, as at the baseline |
| Marker, environment record, git configuration | `specstride-overlay.json`, `specstride-overlay.env` (records separated by the NUL byte), `specstride-overlay.gitconfig`, as at the baseline |
| Owner of an overlay | The process id of the engine, since the pass loop is no process of its own in the port; the oracle maps process ids (N-07) |
| Start time of a process | `/proc/<pid>/stat` on Linux; `ps -o lstart= -p <pid>` on macOS (`unverified`) |
| Signals with scope `attempt` | Handlers for interrupt and terminate are installed only while an overlay of scope `attempt` exists; the result codes 130 and 143 are fields of the result record of the pass loop |
| Fake binary | A Node-shebang file that writes argument list, standard input, environment and working directory to a transcript, and plays a script |
| Fake endpoint | A server on `127.0.0.1` with a free port that answers in the two request shapes |
| Text search of the core | A test that reads the ids of every registry entry, bundled descriptor and sample and searches the sources of the core packages |
| Time limits of operations | `detect` 5 s, `capabilities` 5 s, `preflight` 3 s per request, `stop` 10 s per step. The key list of feature 110 holds no key for them today; the spelling is feature 110's (reported) |
| Stored result of `harness verify` | One file per harness at `user:harness-verify:<id>`, resolved through the layout table; field names of the owner of `specstride.harness-verify/1` (`data-model.md`) |
| Line for a registry that cannot be read | The expected text is the literal of the baseline (`specstride-lib.sh` at `9cab15d`, the function that prints the display of a role); the characterization test makes the registry of the port unreadable and compares the line and the exit |

## What is planned elsewhere

| Subject | Where |
|---|---|
| Discovery sources, probing, role resolution, the critic order | 124, 146 |
| Stream readers, the invocation record and its retention | 126 |
| Argument tables, ceilings, version pins and fixture captures of the Wave 1 harness adapters | 125, 130, 131, 134, 138 |
| The keys and their spelling; secret resolvers; the YAML parser | 110 |
| The terms gate, the terms data, the audience | 147 |
| The state `locally-verified` that a stored result of `harness verify` gives; the schema `specstride.harness-verify/1` | 146 |
| The withheld paths and the moving of the proposer's files | 117 |
| The scenarios of FX-01, FX-26 and FX-39 | 141; this feature may add scenarios inside their scope (feature 141, §O.1 rule 4) |
| The paid probe of the critic's flag combination | 125, as a task that is logged; not run here |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | Fake binary, fake endpoint, the frame of the conformance suite | Nothing of the product |
| 2 | Registry, descriptor loader, closed sets | `contracts` of feature 100 |
| 3 | Environment allow-list, executable resolution, the generic harness adapter for `cli` | Step 2 |
| 4 | Overlay: declaration, scope, build, lifecycle, sweep and reap | Step 3 |
| 5 | The two endpoint kinds, endpoint safety, typed failures, the critic-class call | Step 2; the secret resolver of 110 (a test resolver until then) |
| 6 | Containment, the proofs of the critic's form | Step 3 and step 5 |
| 7 | Descriptor-only fixture; parity tests | The engine (101, 103), stream readers (126), the oracle (141) |
| 8 | Doctor checks, `harness verify`, recorded versions | 112 |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Principle IX (NON-NEGOTIABLE): proof by pinned configuration for a tested harness adapter whose stream has no initial record (F109-FR-038, second and third sentence; feature 100, annex C §C.3, first form, and F100-FR-230, third way; annex X §X.6 row 128, member `pinned-configuration`) | Needed because a text stream emits no initial record (brief 130), so the adapter cannot verify the empty tool list and the minted session from the harness's own record. The proof is the exact version pin together with the preflight of the tested harness adapter and the flag set of the call, is open to a tested harness adapter only (F109-FR-037), and is recorded for every call as the weaker proof (F109-FR-040, field `weaker`) | Alternative rejected: refuse such a harness as critic. A harness with a text stream could then be a critic only under the `parity` profile, against the as-is behaviour that Wave 1 carries (rulings 32, 32b). The owner ruled on CQ-182 (2026-09-30): the weaker proof is allowed, and the PATCH of Principle IX (v3.0.1) names it; per the sync note of that patch this row stays until the first implementation slice removes it. Had the owner ruled against, the second and third sentence of F109-FR-038 and the member `pinned-configuration` would have been removed, and test CT-109-38 would prove the refusal |

The critic with read-only tools is no row of this table: Principles III and IX state it
themselves, by the owner's rulings 57, 57a and D1.
