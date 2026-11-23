# Implementation Plan: Parallel engine services (feature 143)

**Branch**: `143-parallel-engine-services` (a label; the directory is `specs/143-parallel-engine-services`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/143-parallel-engine-services/spec.md`

## Summary

Feature 143 builds what the engine does behind the group directives of the loop-layer interface,
and the tree store behind the interface that feature 100 reserves. It is called only with
parallel units on, an option that is off by default and off under the `parity` profile.

| Deliverable | What it is | Requirements |
|---|---|---|
| Tree store | Seven operations, store commits, snapshots, hardened repository processes | F143-FR-001 to F143-FR-004 |
| Worker root and worker trees | Opaque paths, a repository per tree, seed paths, workspace part, environment | F143-FR-005 to F143-FR-009 |
| Group executor | Processes, sessions, outcomes, restart, killed work, pause, spending limit, barrier, holders of the run token | F143-FR-010 to F143-FR-018 |
| Integration | Composition, application, ticks, staleness | F143-FR-019 to F143-FR-022 |
| Ledger, queue, resume, stop, clean-up, counters | Thirteen record kinds, one writer, eight resume states | F143-FR-023 to F143-FR-028 |

Approach: the tree store is an edge that runs git as a child process with a fixed environment.
The group executor and integration are modules of the engine that reach the harness port, the
spec-format adapter and the ledger through interfaces. Integration is composition of disjoint
deltas, never a merge.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` and `@specstride/kernel`. The tree store uses the `git` executable of the machine, which is already a platform dependency of the product (architecture section 6), floor 2.31 as a starting value (see `research.md` D-3). No dependency from npm is added

**Storage**: files only. Group and worker records in `run:<runId>:ledger`, namespace `parallel`; the store under `tree-store`; worker trees under `worker-root`. All by logical name (feature 100, annex B §B.5)

**Testing**: the test runner that Node ships (`node:test`); stub harnesses of the test kit; scripted trees for the tree-store conformance; a property test for the queue. No test calls a model. The tests `CT-143-<n>` live in `tests/characterization/143/`; the directory `tests/parity/143/` holds no test, because the feature has no parity test; the behaviour cases of the tree-store service live in the folder of EP-04 of the test kit (feature 100, `plan.md`, "Place of parity and characterization tests" and the place of conformance suites)

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): copy-on-write copies, process groups, the place of the worker root

**Project Type**: one package of the npm workspace (`@specstride/tree-store`, layer L1, owner 143 in the package graph of feature 100) and one module group inside `@specstride/core` (group executor, integration)

**Performance Goals**: starting values with low confidence. A snapshot of a tree of 10,000 files under 2 s; the creation of a worker tree under 3 s without seed paths; composition of a group under 1 s; the queue keeps order at 4 streams of 10,000 records

**Constraints**: nothing is written under the project's repository directory; no native module; no paid call in tests; no name of a harness in shared control flow; no path or name of the owner's machines

**Scale/Scope**: 28 functional requirements and 3 success criteria; no as-is id carried; 3 closed sets of annex X §X.6 (rows 62, 64 and 184); no switch of its own and 1 option (row 95 of annex X §X.7); 0 parity tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Group and worker state is the ledger and the store on disk; every record is written ahead; resume derives its position from the last ledger record (F143-FR-023, F143-FR-025). The application writes by temporary name and rename. The queue of stream records is inside the engine process and is no service
- [x] II. ✅ No service of this feature writes an approval, a verdict or feedback. The services execute directives and return results; they decide nothing (F143-FR-001). The critic-diversity rule covers the models of worker passes (F143-FR-011)
- [x] III. ✅ No check runs in a worker tree (F143-FR-011). The verification gate and grounding run on the working tree and never on a snapshot (F143-FR-003). Seed paths come from a toolchain profile or user configuration, never from project configuration
- [x] IV. ✅ Ticks go through the spec-format adapter; the staleness check uses the canonical hasher (F143-FR-021, F143-FR-022). No task list is parsed here
- [x] V. ✅ Events of workers go through the one writer and the one queue; a sink that fails does not reach the group (F143-FR-024). `status` and the doctor only report holders of the run token (F143-FR-018)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; ledger records and closed sets have schemas in `contracts/`; the core keeps its import rule, since the process that the store starts lives in an edge package, and the modules of this feature in the core import neither `node:fs` nor `node:fs/promises`: the outbox, the handoff and the session state of a worker are written through the atomic write of the kernel and the port of the tree store (F100-FR-012, F100-FR-234; assumption: CQ-185); plain `npm install`; no native module; extension points: implements EP-04 (engine services, tree store), consumes EP-02, EP-03, EP-12, EP-16, each at major 1
- [x] VII. ✅ The executor reads capabilities from the harness port and tests no harness name (F143-FR-010, F143-FR-016)
- [x] VIII. ✅ A worker pass is a pass of the harness port: prompt as the harness adapter takes it, never waiting for a human, fresh session, strongest containment, tree as write root (F143-FR-010, F143-FR-011). Session state of a worker is removed at group close. The operator's configuration is not written
- [x] IX. N/A. This feature makes no critic-class call and builds no input of one
- [x] X. ✅ Every worker pass records the harness version through the harness port. Facts about macOS are `unverified` with their checks (F143-FR-005, F143-FR-007, F143-FR-010)
- [x] XI. ✅ Events of a worker carry `workerId` and `wseq`; `seq` is given at the append; a lost stream is recorded with unknown usage and never an invented figure (F143-FR-018, F143-FR-024)
- [x] XII. ✅ Tests use stubs only. No model id in any rule. No secret is read or written by the store

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Composition is deterministic and every step is a ledger record (F143-FR-019, F143-FR-023)
- [x] XIV. N/A. This feature declares and runs no verification command
- [x] XV. N/A. The feature adds no launch path
- [x] XVI. ✅ A quota pause pauses the group and spends nothing (F143-FR-015). Counters survive a resume (F143-FR-028). Nothing removes a lock
- [x] XVII. ✅ macOS is `unverified`; a test that needs a missing prerequisite is a skip with its reason
- [x] XX. ✅ Each worker has a tree of its own (F143-FR-006); no model merges and no content is merged (F143-FR-019); only audited deltas are applied (F143-FR-020); one writer (F143-FR-023); a worker pass spends no outer counter (feature 100, F100-FR-119)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ No as-is behaviour is carried. The intended differences are DV-080, DV-084, DV-085 and DV-010. The services are not called under the `parity` profile
- [x] XIX. ✅ The feature prints nothing into a host session. Its share of host-facing output is 0 bytes

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The package graph of feature 100 holds the package
of this feature: `@specstride/tree-store`, layer L1, owner 143, which may import
`@specstride/contracts` and `@specstride/kernel` and may start a process.

## Project Structure

### Documentation (this feature)

```text
specs/143-parallel-engine-services/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/
│   ├── README.md
│   ├── closed-sets.json         # the three closed sets of the feature
│   └── ledger-kinds.json        # the thirteen record kinds
├── tasks.md                 # speckit-tasks
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/tree-store/                 # @specstride/tree-store (L1 edge)
├── src/
│   ├── index.ts                     # the seven operations
│   ├── git.ts                       # the one place that starts git, with the fixed environment
│   ├── snapshot.ts  materialize.ts  changed.ts  compose.ts  apply.ts  release.ts  sweep.ts
│   ├── verify.ts                    # objects present (the configuration hash is compared in git.ts, T048)
│   └── doctor.ts
└── test/
packages/core/src/parallel/          # inside @specstride/core, behind interfaces
├── ledger-kinds.ts
├── group-executor.ts                # requestPassGroup
├── barrier.ts
├── integrate.ts                     # integrateGroup: compose, apply, ticks
├── queue.ts                         # N stream readers, one append
├── counters.ts                      # the counters of a group, kept in the ledger
└── resume.ts                        # the eight states; holders of the run token
packages/testkit/src/conformance/EP-04/   # the folder of feature 100; this feature adds
├── ct-143-129-tree-store.test.ts         #   the behaviour cases of the tree-store service
└── support/trees.ts                      #   the scripted trees
tests/
├── parity/143/                      # empty: the feature has no parity test
└── characterization/143/            # CT-143-101 to CT-143-128, CT-143-130 to CT-143-132
```

**Structure Decision**: the tree store must start a process, which the core may not do, so it is
an edge package behind the interface `specstride.tree-store/1`; the core receives it as a
service. The group executor and integration are part of the engine (R29 PU-07) and live in the
core, where they reach the harness port, the spec-format adapter and the ledger through
interfaces.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Store | A bare repository per run in the control plane. It reads the project's objects through an alternates entry and writes none there |
| Snapshot | A temporary index; all paths added with the workspace part excluded; a tree written; a commit with fixed author, date and message. Objects that no reference of the project reaches are copied into the store (PU-100) |
| Worker tree | A directory in the worker root with a repository directory of its own, whose alternates entry points at the store; the store is read-only for the worker by permissions and, at C2, by the sandbox |
| Fixed environment of git | System and global configuration off; hooks path set to an empty directory; file-system monitor off; attributes that name a filter, a conversion, a difference tool or a merge driver are not honoured; bytes are written by the store code from the stored object and not by a checkout |
| `changed` | The difference of two trees by name and status |
| `compose` | A new tree built from the base by replacing entries; no three-way operation is used |
| `apply` | For each path of the composed delta: write the bytes of the object to a temporary name and rename; delete for a deletion; set the mode. No index, no reference, no file times set |
| Worker root | `$XDG_CACHE_HOME/specstride/workers/<workspace-id>/<opaque>/`, mode 0700. On macOS the cache directory of the user; `unverified` |
| Seed paths | Copied by reflink where the file system offers it, otherwise by a plain copy |
| Opaque token | 128 random bits, hexadecimal |
| Queue | One array-backed queue in the engine; each stream reader pushes whole records; the appender is the only consumer |
| git floor | 2.31 as a starting value; the doctor check states the version found |

## What is planned elsewhere

| Subject | Where |
|---|---|
| The loop-layer interface and the core side of the group directives | 100, 103 |
| The layer `parallel`, its plan, its audits, the merge check, the fact rows | The content owner of the layer `parallel` (feature 100, annex D §D.1) |
| Watchdogs, kills and the polite stop | 118 |
| The process registry and the run token | 122 |
| The pause record and the quota classifier | 127 |
| The `parallel.*` event types and their fields | 111 |
| The capabilities per harness | 109 and the harness adapter features |
| The spelling of the configuration keys | 110 |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | The tree-store probe as a test: snapshot, worker tree, project repository untouched (F143-FR-002) | git |
| 2 | Tree store, hardened; conformance with scripted trees | Step 1 |
| 3 | Ledger kinds, queue, resume states on stubs | The ledger of feature 103 |
| 4 | Group executor, barrier, composition, application, ticks | The harness port; steps 2 and 3 |
| 5 | Pause, stop, clean-up, holders of the run token; the kill test | Step 4 |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
