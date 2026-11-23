# Implementation Plan: Detached runtime (feature 122)

**Branch**: `122-detached-runtime` (a label; the directory is `specs/122-detached-runtime`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/122-detached-runtime/spec.md`

## Summary

Feature 122 builds the mechanism that lets a run outlive its host session and keeps one run per
workspace. It is the content owner of two extension points (EP-13, EP-17) and of four records of
feature 100 (launch record, lease, process registry, inbox).

| Deliverable | What it is | Requirements |
|---|---|---|
| The spike | Sixteen cases on a live host, with recorded results; first task of the feature | F122-FR-040, F122-FR-041 |
| Detach strategies | The registry, `spawn-detached`, `foreground`, the sample, the conformance suite | F122-FR-001 to F122-FR-003 |
| Launch and handshake | The launch record, the launch nonce, the bounded wait, the three outcomes, `launch-abandoned`, `run --detach` | F122-FR-004 to F122-FR-009 |
| Lock and liveness provider | The registry, the shipped provider, the sample in memory, the conformance suite with the contention test | F122-FR-010 to F122-FR-017, F122-FR-019 to F122-FR-022 |
| Lease | Heartbeat, `validUntil`, hand-down and verification | F122-FR-008, F122-FR-014, F122-FR-018, F122-FR-032 |
| Process registry | Entries, the run token, the identity check, ending of `owned` processes, survivors, adoption | F122-FR-023 to F122-FR-028, F122-FR-042 |
| Inbox | Atomic write, validation, reading at boundaries | F122-FR-029, F122-FR-030 |
| Death of the root | Derived `dead`, reclaim, the synthesized closing event | F122-FR-031 |
| State commands | `state export`, `state import`, `state adopt`; the refusal of a launch over unadopted approvals | F122-FR-033 to F122-FR-037 |
| Marker and control root | The advisory marker; the writability test and the fallback | F122-FR-038, F122-FR-039 |
| Layout version file | `workspace:layout-version`, written at the first launch and read at every later one | F122-FR-043 |

Approach: a directory as the mutex, the owner record renamed into place, a listening local
socket as the liveness that the kernel backs, reclaim by one atomic rename (R2v, "Recommended
shape"). The runtime root is started by the process API of the runtime platform in detached
mode. All of it is in `research.md`.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, on Node.js 22 or later. The Language Ledger stays empty

**Primary Dependencies**: `@specstride/contracts` (schemas of the launch record, the lease, the owner record, the process registry, the inbox request, the workspace record; closed sets; exit codes); `@specstride/kernel` (atomic file write, canonical hasher, the process supervisor primitive, clock). Modules of the runtime platform only: `node:child_process`, `node:net`, `node:fs`, `node:crypto`, `node:zlib`. Other packages of the workspace, which `mayImport` of the package graph allows to `@specstride/runtime` and `@specstride/cli` ("every package above"), through their ports: the event writer (`@specstride/observability`, feature 111; T046, T066), the verification of approval records (`@specstride/core`, feature 101; T061, T064), the canonical spec model (`@specstride/spec-formats`, feature 104; T065) and the configuration keys (`@specstride/config`, feature 110). No dependency from npm. Platform tools outside npm: `ps`, and `sysctl` on macOS; both are probed by doctor checks

**Storage**: files in the control plane, named by logical name (feature 100, annex B §B.5): `workspace:lock`, `workspace:record`, `run:<runId>:lease`, `run:<runId>:procs`, `launch:<launchId>:record`, `launch:<launchId>:runtime-log`, `inbox:*`; `workspace:active` and `workspace:layout-version` in the workspace part. The liveness endpoint lies in a short private directory (research D-3)

**Testing**: the test runner that Node ships (`node:test`); fake binaries and stub processes; the conformance suites of EP-13 and EP-17 in `@specstride/testkit`; the parity oracle for FX-11, FX-13, FX-16, FX-35 and FX-36, and FX-12 for the characterization test of the inbox. No test calls a model or a paid service. The spike runs on a live host and is a paid, logged task (T002, T003); it is no test and no CI job, and no test waits for it: where it has not run, every case is a skip with its reason

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` until a macOS runner has passed (ruling 67)

**Project Type**: part of the package `@specstride/runtime` of the npm workspace (layers L5 and L4, owner 122, a composition root, as `specs/100-specstride/contracts/data/package-graph.json` states), with the three state commands and the launch handshake in `@specstride/cli`

**Performance Goals**: starting values, low confidence, measured in the build. `probe`: under 50 ms. `acquire` without contention: under 100 ms. The contention test of 300 rounds with 8 contenders: under 5 minutes. A launch without launch checks, from the launch record to the outcome `started`: under 2 s; the handshake limit is 30 s. A heartbeat costs one atomic write every 10 s

**Constraints**: no native module; nothing compiles at install; host and runtime share files only, and the liveness endpoint carries no data; owner-only permissions; no paid call in tests; no path, account or name of the owner's machines; signals only after the identity check

**Scale/Scope**: 43 functional requirements, 7 success criteria; 1 as-is requirement and 13 behaviour items in 9 clusters carried, 3 items superseded by DV-022; 6 fixture families cited; 2 extension points implemented as content owner, 1 implemented as an entry (EP-14), 1 consumed (EP-01); 12 closed sets stated, rows 17, 21 to 23, 82 and 209 to 214 of annex X §X.6; rows 41 and 113 to 116 of the `parity` profile (annex X §X.7)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0. The brief names Principles I, VI, XII, XVI and XVII as binding; every gate is
answered.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Host and runtime share files only (F122-FR-001, F122-FR-029). Every record is written by a temporary name and a rename (F122-FR-004, F122-FR-029). The liveness endpoint carries no data and exists only so that the kernel shows whether its owner lives, which Principle I names as not a service (research D-2). Nothing a run depends on is a watcher: re-attachment is reading (F122-FR-008)
- [x] II. ✅ The feature produces no verdict and writes no approval. `state import` and `state adopt` install approval records only after the signature of each was verified (F122-FR-034, F122-FR-035); a launch over ticked phases without records is refused (F122-FR-037)
- [x] III. ✅ Inbox requests and the advisory marker are data from outside the runtime: validated before use, and the marker decides nothing but a refusal (F122-FR-029, F122-FR-038). The key of the control root is a widening key, so project configuration cannot move the control plane (F122-FR-039)
- [x] IV. ✅ The feature parses no spec. Whether a phase is ticked is read through the canonical spec model of EP-03 (F122-FR-037)
- [x] V. ✅ Liveness is never an event (F122-FR-014). A failing doctor check or reader does nothing to a run (F122-FR-008)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; every record is validated against the schema of feature 100 when read; no dependency from npm and no native module (the Language Ledger stays empty); EP-13 `specstride.lock/1` and EP-17 `specstride.detach/1` implemented, EP-01 `specstride.host/1` consumed, entries registered in EP-14 `specstride.doctor/1` (implements (an entry)); each implemented point has a sample outside the core and a conformance suite (F122-FR-002, F122-FR-010)
- [x] VII. ✅ The feature names no harness. The process kinds `harness-pass` and `critic-call` hold for every entry of the registry of harnesses
- [x] VIII. N/A for the pass itself. The runtime root starts with standard input closed and an environment allow-list (F122-FR-001); the run token is added to the environment of every child and nothing of the operator's configuration is touched (F122-FR-024)
- [x] IX. N/A. The feature starts no critic. It records the process of a critic-class call as `owned`
- [x] X. ✅ The facts of the spike carry a `verified-on` date and the host version (F122-FR-040, F122-FR-041)
- [x] XI. ✅ The feature writes three events through the one event writer, the report of a launch, the synthesized closing event and the integrity event of a missing marker (F122-FR-005, F122-FR-031, F122-FR-038); unknown values are null
- [x] XII. ✅ Tests use stub processes and fake binaries. The spike runs on a live host and is a paid, logged task (T002, T003); it is no test and no CI job, and no test waits for it. The run token and the launch nonce appear in records only as the value the schema allows (nonce) or as a hash (token). Secrets are not read

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The outcome of a launch, the result of a probe and the result of a case of the spike are facts of deterministic code, each from a closed set
- [x] XIV. N/A. The feature declares and runs no verification command
- [x] XV. ✅ `launch` is called by an invocation; the feature adds no flag that bypasses a launch check. The refusals it adds (lock, marker, unadopted approvals, control root) cannot be switched off
- [x] XVI. ✅ Nothing removes a lock whose owner lives (F122-FR-016); reclaim needs `stale-owner-dead` (F122-FR-015). Readers only read (F122-FR-008, F122-FR-027). The feature relaunches nothing; when the root dies nothing restarts by itself (F122-FR-031). A quota pause keeps the lock and recomputes from recorded times (F122-FR-020, F122-FR-032)
- [x] XVII. ✅ A case of the spike that cannot run is a skip with its reason, never a pass (F122-FR-040); the macOS statements are `unverified`
- [x] XX. N/A. The feature runs no work in parallel. It records worker passes with their worker id and ends them with every other `owned` process (F122-FR-023, F122-FR-026)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ 028 FR-004 and the nine clusters have origin, disposition and test in seven requirements; the three superseded items are listed with DV-022; the intended differences cite DV-006, DV-022, DV-027, DV-029, DV-035, DV-066 and DV-074. No new register row is needed
- [x] XIX. ✅ Host-facing output of this feature: one line of `launch` per outcome and one line per refusal of a state command, each under 200 bytes (about 70 tokens), measured in the build. Readers print nothing for an unchanged state

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency. The liveness
endpoint was checked against Principle I again: it accepts a connection and closes it, reads and
writes no byte, and no process of the run waits on it.

## Project Structure

### Documentation (this feature)

```text
specs/122-detached-runtime/
├── spec.md
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, relations, life cycles
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1
│   ├── README.md
│   ├── closed-sets.json         # the twelve closed sets of the spec
│   ├── parity-rows.json         # the rows of the parity profile, with their numbers
│   ├── probe-decision-table.json# inputs of a probe to its result
│   ├── spike-cases.json         # the sixteen cases and the schema of a result
│   ├── state-archive.schema.json
│   └── cli-state-commands.md    # arguments, lines and exit codes of the three commands
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/kernel/src/proc/             # the process primitive of F100-FR-234, owned by this feature (T075, T076; owner ruling of 2026-09-30)
packages/runtime/                     # @specstride/runtime (L5, L4)
├── src/
│   ├── root/                         # entry of the runtime root: lock, lease, heartbeat, marker, layout version, end of owned processes
│   ├── detach/                       # registry of EP-17; spawn-detached.ts; foreground.ts
│   ├── lock/                         # registry of EP-13; directory-lock provider; probe; reclaim; liveness endpoint
│   ├── lease/                        # write, heartbeat, handDown, verify
│   ├── procs/                        # process registry; run token; identity check; survivors; adoption
│   ├── inbox/                        # atomic write (used by the CLI), validation, reading at boundaries
│   ├── state/                        # export, import, adopt; archive format
│   ├── data/                         # copies of the contract data of this feature (T007)
│   └── doctor/                       # the checks this feature registers
└── test/
    ├── helpers/                      # stub process, scratch control root, kill (T008)
    ├── unit/
    ├── characterization/             # CT-122-* of new behaviour
    ├── contention/                   # 8 contenders, 300 rounds
    └── crash/                        # engine killed, root killed, both

packages/cli/src/commands/            # @specstride/cli (L6)
├── launch-handshake.ts               # steps 1, 2 and 4 of the handshake
└── state.ts                          # state export | import | adopt

packages/cli/test/
├── budget/                           # byte measurement of the lines (T069)
└── characterization/                 # the lines of `launch` and of the state commands (T074)

packages/testkit/src/
├── conformance/EP-13/                # the cases of the lock suite
├── conformance/EP-17/                # the cases of the detach suite
├── samples/EP-13/                    # sample provider in memory
└── samples/EP-17/                    # sample strategy

tests/parity/122/                     # PT-122-* on FX-11, FX-13, FX-16, FX-35, FX-36
tests/characterization/122/           # CT-122-101 to CT-122-104: the stop primitives of Lisa, pinned against the reference
spikes/122-detach/                    # the spike: driver, cases, results as data
```

**Structure Decision**: the feature lives inside `@specstride/runtime`, as R15 A-4 places the
detach strategies and the lock provider, with its commands in `@specstride/cli` and its
conformance suites in `@specstride/testkit`. The spike has a directory of its own outside the
packages, because it runs before the packages exist and is never shipped.

## Complexity Tracking

No violation. The table is empty.
