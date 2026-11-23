# Annex A — Foundations

Part of the specification of feature `100-specstride`. Normative.

This annex holds the rules that bind every layer: the layers and their rules, the common rules of
every extension point, the import rule for the core, and the product-wide rules on vocabulary,
harnesses, platforms and packaging. Terms follow the glossary of `docs/ecosystem/consolidation.md`
section 1. "Run" is the logical run of one feature; one start of the engine process is an
"engine start".

How to cite: "annex A, §A.2 Layering rules, F100-FR-001".

## §A.1 Layers

The product has eight layers. A lower number is a lower layer.

| Layer | Name | What it holds | Lifetime |
|---|---|---|---|
| L0 | State | The user-level state, the control plane of a workspace, the workspace part, the worker root | Files |
| L1 | Edges | Implementations of ports: harness adapters, stream adapters, sink adapters, check runners, secret resolvers, detach strategies | Called by higher layers through ports |
| L2 | Ports | Interfaces owned by the core. No implementation lives in this layer | — |
| L3 | Pass loop | The pass loop, watchdogs, breakers, yield and detached jobs, the loop layer, the router, the prompt assembler, carry-over | Inside the engine process |
| L4 | Engine | Run, phase, phase attempt; verification gate, critic, approval record; recovery cycle; attempt planner | One engine process per engine start |
| L5 | Runtime root | The pipeline stage executor, lock and lease, the relaunch classifier, the owner of run state, the terminal digest | One detached process per launch |
| L6 | CLI | Short-lived commands. Readers of run state | One process per command |
| L7 | Hosts | Host packages: host skills, host hook shims, the entry shim, skill-trigger eval suites | Inside the host |

Across all layers: the `contracts` package, which holds schemas, closed sets and logical state names
and is published for authors of descriptors and of later implementations.

## §A.2 Layering rules

- **F100-FR-001**: A layer MUST import only from layers below it and from the `contracts` package. The engine (L4) and the pass loop (L3) MUST import interfaces of L2 and never an implementation of L1. The build MUST fail when an import-boundary check over the package graph finds a violation. (LR-1)
  - test: CT-100-101

- **F100-FR-002**: A host MUST reach the product only through the CLI protocol of annex G. A host MUST NOT read a state file, an event file, a launch contract or a log. Diagnosis by a host MUST go through a CLI command whose output has a byte cap. (LR-2)
  - test: CT-100-102
  - ep: EP-01 `specstride.host/1` (consumes)

- **F100-FR-003**: Between the CLI (L6) and the runtime root (L5) there MUST be only files, one start of the runtime root at launch, and signals for `stop --now`. The CLI MUST write only the files that the table of annex B §B.5 gives it as writer: requests to the inbox, launch records, the supervision record, and the records of a launch and of a reverse plan that are written before a runtime exists. It MUST NOT write run state. (LR-3)
  - test: CT-100-103

- **F100-FR-004**: Only the runtime tree (the runtime root and the engine) MUST write the control plane, with the exceptions of F100-FR-003. A reader MUST derive the conditions `dead`, `stale` and `launch-abandoned`; no process writes them as a state. (LR-4)
  - test: CT-100-104

- **F100-FR-005**: At any moment exactly one process MUST be the writer of a run's event file: the runtime root while no engine is alive, the engine while it is alive. Learning MUST have its own writer domain, its own lock and its own event file. The rule MUST be tested under contention in Wave 1. (LR-5)
  - test: CT-100-105

- **F100-FR-006**: Every process boundary that the parity oracle observes at the baselines MUST stay a process boundary. Every other boundary MUST be a call that returns a result record whose `exit_code` field carries the same code number as the as-is process. The tables of annex E §E.4 and annex G §G.4 are the authority on which is which. (LR-6)
  - test: CT-100-106

- **F100-FR-007**: The router, the quota classifier, the relaunch classifier, lane derivation and the terms gate MUST each be a pure table: versioned data, evaluated by the one table evaluator of annex X §X.3, with the rule id and the table version recorded with every decision. (LR-7)
  - test: CT-100-107

- **F100-FR-008**: Role resolution MUST belong to the harness layer. It MUST run at launch and produce a plan per phase and per role, with the fallbacks the consumer opted into, each entry checked by the terms gate again at the moment it is used. A loop layer or a router MUST NOT call role resolution. (LR-8)
  - test: CT-100-108
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: off: no fallback is configured (row 40 of annex X §X.7)

- **F100-FR-009**: Text from outside the runtime (a harness stream, the output of a check, a critic reply, the consumer's comment) MUST enter through one ingress, where it is redacted by the redactor of annex X §X.4 and cut to a size cap. Sinks and prompts MUST receive only the result. Under the `parity` profile the cap MUST NOT be below the as-is sizes that reach the critic prompt (phase evidence up to 60000 characters; a grounding budget of 327680 bytes at a window of 200000 tokens), or FX-25 differs. (LR-9)
  - test: CT-100-109

- **F100-FR-010**: Every switch of the product MUST be ordinary product configuration. The parity configuration MUST be the named profile `parity` of annex X §X.7, which sets every switch the oracle needs. The product MUST have no oracle mode and no code path that exists only for the oracle, other than the compatibility projection, which consumers may also switch on. (LR-10)
  - test: CT-100-110

- **F100-FR-011**: Every closed set MUST be listed in annex X §X.6 with its owner and its rule for an unknown value. Every file of the control plane MUST carry a `schema` field, and a reader MUST refuse a file whose major differs from the one it supports. (LR-11)
  - test: CT-100-111

## §A.3 The import rule for the core

- **F100-FR-012**: The core packages (the engine with the pass loop, and every loop-layer package) MUST import the `contracts` package and the kernel package of shared pure helpers and nothing else from the product. They MUST NOT import a harness adapter, a sink adapter, a config loader, a host package, a UI package or a provider SDK, and they MUST NOT start a process or open a network connection directly. They MUST NOT import the file-system module of the platform: a core package reads and writes files through the kernel and through the ports of the edge packages (F100-FR-234). The import-boundary check MUST enforce this, and MUST fail when a core file names a sample implementation or a Wave 1 implementation of any extension point.
  - test: CT-100-112
  - assumption: CQ-185 (whether a core package may import the file-system module; read as no)

- **F100-FR-234**: The kernel package MUST offer to the core what the core may not import: a process primitive with the operations start a process in a group and a session of its own, with standard input closed and, where the caller names them, two files as its standard output and standard error; start such a process detached with a status record, in which the kernel starts a waiter of its own in the new session, with no shell, and the waiter starts the command, waits for its end and writes its exit code or signal, its duration and its times of start and end atomically to a file the caller names, so that the record exists when the process that started it has ended (the baseline does the same with a wrapper, B-1127, B-1070); signal a group (polite, terminate, kill), read the start time of a process, search the process table for a run token, and wait for an end; a clock; the registration call of the doctor's checks; and the atomic write. The core and every loop layer MUST receive these as arguments from the composition root. An edge package MAY touch the file system or start a process on behalf of a core package, behind an interface of the `contracts` package: in Wave 1 one for the integrity of checks (owner 116), one for the tree store (owner 143) and one for the check runner (owner 148).
  - test: CT-100-334

## §A.4 Common rules of every extension point

These rules hold for EP-01 to EP-19. The interface of each point is in the annex of its layer, under
the same thirteen sub-headings: Id and version; Purpose; Caller and time; Inputs; Outputs; Errors;
Guarantees of the core; Guarantees of an implementation; Failure of an implementation;
Unknown-value rule; Wave 1 implementations; Content owner; Proving test.

| EP | Id and version | Annex and section |
|---|---|---|
| EP-01 | `specstride.host/1` | H §H.1; the CLI protocol in G §G.1 |
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | C §C.1 |
| EP-03 | `specstride.spec-format/1` | C §C.7 |
| EP-04 | `specstride.loop-layer/1` | D §D.1 |
| EP-05 | `specstride.check-runner/1` | C §C.8 |
| EP-06 | `specstride.router-rules/1` | D §D.4 |
| EP-07 | `specstride.verification-source/1` | C §C.9 |
| EP-08 | `specstride.event-sink/1` | C §C.10 |
| EP-09 | `specstride.view/1` | G §G.6 |
| EP-10 | `specstride.secret-resolver/1` | C §C.11 |
| EP-11 | `specstride.terms/1` | C §C.12 |
| EP-12 | `specstride.quota-classifier/1` | C §C.13 |
| EP-13 | `specstride.lock/1` | F §F.5 |
| EP-14 | `specstride.doctor/1` | G §G.7 |
| EP-15 | `specstride.prompt-block/1` | D §D.5 |
| EP-16 | `specstride.toolchain/1` | C §C.14 |
| EP-17 | `specstride.detach/1` | F §F.6 |
| EP-18 | `specstride.critic-strategy/1` and `specstride.attempt-planner/1` (internal seams) | E §E.1 |
| EP-19 | `specstride.stage-kind/1` | F §F.7 |

- **F100-FR-013**: Each extension point MUST have an id of the form `specstride.<name>/<major>`. A change inside a major MUST be additive. An implementation MUST declare the majors it supports; the registry MUST refuse an implementation outside the supported range and the doctor MUST report it. The core MUST support the current major and the one before it.
  - test: CT-100-113

- **F100-FR-014**: An implementation MUST be of one of three classes: data (a file validated against a schema), first-party code (a package of the product that registers through the registration call), or third-party code (a package named in user configuration). Wave 1 MUST accept data from consumers and first-party code from the product. Third-party code MUST be refused at registration in Wave 1, with a message that names the class; its interface is designed and not enabled.
  - test: CT-100-114

- **F100-FR-015**: An implementation that widens capability MUST be accepted from user configuration, the environment or flags only, and never from project configuration. A widening entry in project configuration MUST be ignored with a launch message and a doctor warning.
  - test: CT-100-115

- **F100-FR-016**: Each extension point MUST have one registry, filled at process start and read-only after launch. What a run resolved from a registry MUST be written to the run's records and replayed on resume; a resume MUST NOT resolve again unless the consumer asks for it by flag.
  - test: CT-100-116

- **F100-FR-017**: Each extension point MUST have a conformance suite in the published test kit. Every Wave 1 implementation MUST pass its suite in the build. A data implementation MUST be validated when it is loaded, and the consumer MUST be able to run the conformance suite on it on request.
  - test: CT-100-117

- **F100-FR-018**: For each extension point EP-01 to EP-19 the test tree MUST hold a sample implementation outside the core. The build MUST run the conformance suite on the sample and MUST fail if any core file names the sample. Adding or removing the sample MUST change no core file.
  - test: CT-100-118

- **F100-FR-019**: An implementation that throws, exceeds its time limit or returns a value outside the closed result set of its point MUST be degraded to the plainer path that the section of that point documents. A failing implementation MUST NOT produce a verdict, an exit code or a stop reason of its own. The degradation MUST be recorded as an event.
  - test: CT-100-119

- **F100-FR-020**: EP-01 to EP-17 and EP-19 MUST be public interface contracts with a compatibility promise per major. EP-18 MUST be an internal seam: versioned and tested in the same way, with a conformance suite and a sample, and with no promise to implementers outside the product's repository in Wave 1.
  - test: CT-100-120

- **F100-FR-021**: Every extension point MUST state what the core does with a value it does not know. Where the section of a point states nothing more specific, the rule MUST be: an unknown field is ignored by a reader and kept by a writer that copies the record; an unknown member of a closed set refuses the record with a message that names the set and the value; an unknown member of an open set is resolved through the registry and refused only if no entry matches.
  - test: CT-100-121

- **F100-FR-235**: The calls of the engine into learning MUST be a plain function interface of the `contracts` package at layer L2, which the composition root hands to the engine. The interface MUST have five operations: `resolve` a value and its arm for a knob and a phase at the start of a pass; `observe` an approved phase; `evaluate` the applied decisions of an approved phase; `report` the last recorded evaluation of every active decision, read-only, for the lines printed at exit; and the tamper bracket as two operations, `bracketTake` before a proposer pass and `bracketCheck` after it (F100-FR-228). It is no extension point in Wave 1. A failure of a call MUST leave the run on the value it would have had without learning, and MUST never undo an approval.
  - test: CT-100-335

- **F100-FR-237**: The calls of the engine into the invocation code of feature 126 (`reconcile` the observations of one invocation into a result, `finalize` one invocation into the result, its event and a decision of the closed set of row 175 of annex X §X.6, `sweepRetention` of the invocations of a run) MUST be a plain function interface of the `contracts` package at layer L2, which the composition root hands to the engine. It is no extension point in Wave 1. `finalize` takes the invocation identity, the breaker state, the limit, an optional kill reason and an optional cap limit, and returns the decision, the reason code, `is_error`, the count of consecutive errors, the kill class and the cap count (F126-FR-034). The implementation is in `@specstride/harness` (feature 126); the caller is the pass loop (feature 103, F103-FR-013).
  - test: CT-100-337

## §A.5 Product-wide rules

- **F100-FR-022**: Every specification of the product MUST use the terms of the glossary with one meaning each. A term that the glossary marks "never bare" MUST be written in its qualified form: phase gate, launch check, verification gate, phase attempt, stage attempt, launch contract, launch bundle, spec bundle, engine hook, host hook, harness adapter, auth tier, model tier. The old use of "micro-loop" for diagnosis and acceleration MUST be written "recovery cycle".
  - test: CT-100-122

- **F100-FR-023**: A requirement of any feature MUST NOT assume a closed list of harnesses. Anything that enumerates harnesses MUST read the resolved registry, which includes discovered harnesses and harnesses the consumer declared. The core MUST NOT test a harness name in control flow.
  - divergence: DV-064
  - test: CT-100-123
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F100-FR-024**: The critic MUST never approve its own session. Every critic call MUST run in a fresh session. Where the critic and the proposer resolve to the same model, the critic-diversity warning MUST be raised and recorded, and it MUST NOT block a run. The warning MUST also be raised where the diversity test gives `unverified`.
  - test: CT-100-124

- **F100-FR-025**: The product MUST behave the same on Linux and on macOS for every requirement of this specification. Windows and WSL MUST be reported by the doctor as unvalidated. Every statement about macOS in every feature is `unverified` until a macOS runner has passed the parity oracle, which is a release condition.
  - divergence: DV-071
  - test: CT-100-125
  - status: unverified (check: the parity oracle and every conformance suite pass on a macOS runner; verified-on: —; pin: macOS version of the runner, to be recorded)

- **F100-FR-026**: The product MUST NOT read state written by the three as-is systems. An old state tree found in a workspace MUST be reported by the doctor and left untouched. Legacy command names, legacy variable names and migrations of a pre-v2 layout MUST NOT be carried.
  - divergence: DV-035; DV-036; DV-037
  - test: CT-100-126

- **F100-FR-027**: The product MUST be delivered as one published package that holds the CLI, the entry of the runtime and the host package for Claude Code. The `contracts` package and the test kit MUST be published as well. Installing any of them MUST run no install script and MUST compile nothing. Every dependency of a published package MUST be declared at an exact version, never a range (the control of threat T-44).
  - test: CT-100-127
  - assumption: CQ-206 (the "exact versions" part of the control of T-44 is anchored in this requirement; no requirement id is spent on it)

- **F100-FR-028**: The package as shipped MUST have the audience `distributed`. The audience MUST change only through user configuration, and never through the environment, a flag, project configuration or the consumer's comment (ruling 2).
  - divergence: DV-048
  - assumption: CQ-205 (ruling 2 is read to name user configuration as the one source of the audience)
  - parity: `personal` (the fixtures declare the audience) (row 34 of annex X §X.7)
  - test: CT-100-128

- **F100-FR-029**: The licence of the product MUST be MIT, with the copyright line "Copyright (c) 2026 mairp". A published file MUST NOT hold a path, an account or a name that is specific to the owner's machines. Every dependency MUST be compatible with MIT; a proprietary dependency MUST be optional and never bundled.
  - test: CT-100-129

- **F100-FR-030**: Every component of the product MUST be written in the one language the owner ruled. A component in another language MUST enter only through an entry in the Language Ledger, which is empty at the start of Wave 1.
  - divergence: DV-054; DV-065
  - test: CT-100-130

- **F100-FR-031**: The micro-loop layer, the layer of parallel units and concurrent verification commands MUST add no run state, no exit code and no stop reason. Every failure inside them MUST end in one of: the work returns to the serial path; the layer is off for the phase attempt; the layer is off for the run.
  - test: CT-100-131
  - ep: EP-04 `specstride.loop-layer/1` (consumes)
