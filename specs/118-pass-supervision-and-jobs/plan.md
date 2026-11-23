# Implementation Plan: Pass supervision and detached jobs

**Branch**: `118-pass-supervision-and-jobs` (a label) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/118-pass-supervision-and-jobs/spec.md`

## Summary

Feature 118 supervises one pass of the proposer and the jobs that a pass leaves behind. It ports the watchdogs, the hard cap, the kill note, the yield artifact with its seven predicates, the long job and the failure ledger of the Specstride baseline, all reproduced under the `parity` profile. It adds three switchable behaviours: the polite stop (`carry.polite_stop`), the adoption of detached jobs by the next engine start, and the first-failure predicate (`verification.failfast`). The approach: one module of the core that holds all the decisions as pure functions over a clock, a process list and a file reader that are handed in, so that every watchdog is tested with a fake clock and no real process; and a thin edge that starts jobs and sends signals through the process primitive of the kernel (owned by feature 122). Research is summarized in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, profile), `@specstride/kernel` (atomic write, file reading, hasher, and the process primitive that feature 122 owns). The one ingress with the redactor (F100-FR-009, content owner 111) is handed in as a port. No other runtime dependency; no native module

**Storage**: files in the control plane, named by logical name (feature 100 annex B §B.5): `pass:<passId>:kill-note`, `job:<jobId>:yield`, `job:<jobId>:record`, `job:<jobId>:log`, `feature:<slug>:failure-ledger`, and the entries of `run:<runId>:procs`

**Testing**: the Node.js test runner; stub proposers, stub jobs and stub verification commands of feature 141 (verbs `yield`, the stub job of family FX-22); a fake clock and a fake process list for the unit tests; the parity oracle for FX-16, FX-20 to FX-23; no paid call

**Target Platform**: Linux and macOS. macOS is `unverified` until a runner passes the oracle. Windows and WSL are unvalidated

**Project Type**: a module of `@specstride/core` (layers L3 and L4) with one edge module; no CLI command of its own

**Performance Goals**: the watchdogs cost less than 1 per cent of one core with a pass tree of 200 processes at the default tick; a first failure ends a wait within three poll intervals (F118-SC-005)

**Constraints**: the core may not import `node:child_process`, `node:net`, `node:http` or `node:https`, and may not import `node:fs` or `node:fs/promises` (F100-FR-012, `contracts/data/package-graph.json`; `assumption: CQ-185`): every file this feature reads or writes (the yield artifact, the kill note and its sidecars, the job record, the log of a job, the failure ledger, the files that a predicate reads) goes through the kernel and the ports of the edge packages; text from outside the runtime is written only after the ingress (F118-FR-044); a signal is sent only after the pid, start time and run-token check (F100-FR-064); no closed list of harnesses; no machine-specific name; all macOS statements `unverified`

**Scale/Scope**: 44 requirements (43 before the repairs of 2026-09-30), 2 as-is requirements, 181 behaviour items in 27 clusters, 5 fixture families cited (FX-16, FX-20 to FX-23), 5 own experiments or spikes (the tasks T001 to T003, T059 and T072)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: unchanged. The constitution in force at the gate was `.specify/memory/constitution.md` v3.0.0. Re-checked on 2026-09-30 after the cross-feature review: rows VI, XI, XVII and XVIII rewritten; no violation.*

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I-V)**

- [x] I. Coordination is through files only; writes are atomic; nothing a run depends on is a watcher or service. The watchdogs run inside the engine process during a pass; the wait on a job polls files and processes; the host coordinates with the runtime through files (F118-FR-002, F118-FR-020, F118-FR-026). No service, no socket.
- [x] II. Only the phase gate produces a verdict. Nothing here approves. A `first_failure` stop ends a wait; it changes no verdict and no check result (F118-FR-038, F118-FR-040).
- [x] III. Outside text is data. The yield artifact is a claim (F118-FR-016); a matched line is a claim (F118-FR-038); the critic is told a fact and no counts (F118-FR-040). The project config does not widen: the `command` predicate is a widening key that the consumer allows (F118-FR-015).
- [x] IV. N/A: this feature reads no spec grammar.
- [x] V. Observability is best-effort. The events are written by the one event writer; a failure to write an event never ends a pass or a wait. The failure-ledger component always ends with 0 (F118-FR-036).

**The product and its edges (VI-XII)**

- [x] VI. Strict TypeScript; boundaries validated by the schema of the yield artifact; the module sits in `@specstride/core`, reaches processes only through the kernel's process primitive and files only through the kernel and the ports of the edge packages (it imports neither `node:child_process` nor `node:fs`); no native module; the extension points are named with versions in the spec.
- [x] VII. The watchdogs read normalized stream records; no code tests a harness name. The polite step is the operation `stop` of the port, whose signal each harness adapter declares.
- [x] VIII. A pass never waits for a human; the watchdogs end one that does. Fresh session after a kill and after an adoption (owner ruling 55). Contained by default: the runtime starts a detached job at the containment level of the proposer or stricter.
- [x] IX. N/A: the critic is not supervised here. The critic is told a fact about a stopped job and nothing else.
- [x] X. The interrupt's effect on a harness's session is a documented fact: `unverified`, with a probe task per tested harness adapter (T002 in tasks.md). No `verified-on` is claimed.
- [x] XI. Events in the one envelope; the compatibility projection carries the as-is events byte for byte on the oracle's fixtures (F118-FR-027); unknowns are `null`; every text from outside the runtime (the detail of a kill, tool calls and text blocks of the kill note, the texts and the argument list of a yield, the command of a long job, the slice of a job log, the lines of the failure ledger) enters through the one ingress and its redactor before it reaches a sink or a prompt (F118-FR-044).
- [x] XII. No paid call in tests; the probe of the interrupt is a paid probe, logged, not run by this specification.

**The host skill (XIII-XVII, XX)**

- [x] XIII. N/A for judgment; the runtime records facts (kill record, job events) and the model adds none.
- [x] XIV. N/A: this feature declares no verification command. A long job is named by the consumer.
- [x] XV. N/A: no launch consent is touched.
- [x] XVI. The supervisor's relaunch is not touched. Counts survive a resume: the yield index and the cap-kill count continue (F118-FR-021, F100-FR-069).
- [x] XVII. A missing prerequisite is a skip with its reason: where no macOS runner exists, the macOS part of the spike of T001 and every macOS check of a `status:` line is skipped, the skip and its reason are written into the record of the spike, and the statement stays `unverified`; no test is reported as passed that did not run.
- [x] XX. Parallel units: a worker pass may not yield (F118-FR-016); the exemptions never apply to a worker pass.

**The rewrite (XVIII-XIX)**

- [x] XVIII. Every carried behaviour cites its origin, disposition and proving test; the intended differences are the register rows in the `divergence:` fields of `spec.md` (DV-006, DV-007, DV-011, DV-012, DV-013, DV-014, DV-015, DV-022, DV-025, DV-027, DV-051, DV-066, DV-093, DV-098); the polite stop and the first-failure predicate are off under `parity`, and adoption is not observable on its fixtures.
- [x] XIX. The blocks this feature adds to prompts are the as-is ones under `parity`. The resume block and the kill block are bounded by the log slice size (head 40, tail 80) and by the kill note's 25 tool calls and 5 text blocks. No host-facing output of its own.

## Project Structure

### Documentation (this feature)

```text
specs/118-pass-supervision-and-jobs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── yield-predicates.md
│   └── supervision-events.md
├── checklists/requirements.md
├── spec.md
├── tasks.md
├── repair-report.md
└── analyze-report.md
```

### Source Code (repository root)

The package graph of feature 100 puts this feature in `@specstride/core`, layers L3 and L4, with the owners 101, 149, 103, 117, 118 and 102. The folder below is a proposal that the plan of feature 103 (owner of the pass loop) may rename.

```text
packages/core/src/pass-supervision/
├── watchdogs/           # idle, progress, repetition (process and tool level), hard cap; pure functions
├── stop-ladder/         # polite, terminate, kill; the record of the steps
├── kill-note/           # the note, the sidecars, the prompt block
├── yield/
│   ├── schema/          # validation of specstride-pass-yield/v1 (from @specstride/contracts)
│   ├── predicates/      # pid, exit_code_file, file_exists, file_stable, grep, command, first_failure
│   ├── wait/            # the wait loop and its outcomes
│   └── resume-block/    # the block for the next pass, the log slice
├── jobs/                # launch, adopt, registry entries, adoption at engine start, long job
├── failure-ledger/      # signatures, section, file
└── failfast/            # the first-failure reader, the stop of a job, the fact for the critic
packages/kernel/         # not built here: the process primitive (feature 122) is consumed through a port
tests/parity/118/        # PT-118-*
tests/characterization/118/   # CT-118-*
```

**Structure Decision**: one folder in `@specstride/core`, with all system access injected as ports (clock, process list, file reader, file writer, signal sender, process launcher, ingress). The launcher and the signal sender are provided by the kernel's process primitive, because the core may not import `node:child_process`. The file reader and the file writer are provided by the kernel (atomic write, read of bytes after an offset, identity and modification time of a file), because the core may not import `node:fs` (CQ-185).

## Complexity Tracking

No violation of the Constitution Check: the table has no row.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|

## Phase 0 and Phase 1 outputs

| File | Content |
|---|---|
| [research.md](research.md) | Decisions, with the sources, and what stays `unverified` |
| [data-model.md](data-model.md) | Records this feature writes or reads, with fields in words |
| [contracts/](contracts/) | The predicate table and the event table this feature offers |
| [quickstart.md](quickstart.md) | How to run each behaviour on the stubs |
