# Implementation Plan: Run view and status

**Branch**: `129-run-view-and-status` (a label) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/129-run-view-and-status/spec.md`

## Summary

Feature 129 gives extension point EP-09 its content: the read model `RunView` of schema `specstride.view/1`. It is a pure projection of the event stream, three named state files and a few observations that the caller supplies, with a reducer, a cursor held by the caller and a canonical serialization. Lanes, attention items and budget levels are derived in it. On top of it are the first two consumers: `status` (text, `--json`, `--line`) and `wait --until-change`, and the precomputed status line with its `validUntil`. There is no renderer here. The approach is one pure package with no operating-system access, injected ports for everything it may not do itself, and thin command code in the CLI package that reads files and calls it.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` only, for the pure package. The package graph of feature 100 lets `@specstride/view` import nothing else and no Node built-in module (`contracts/data/package-graph.json`). The table evaluator, the redaction patterns and the canonical hasher live in `@specstride/kernel` and are therefore injected into the read model as functions by its caller. No other runtime dependency; no native module

**Storage**: none of its own. It reads, by logical name (feature 100 annex B §B.5): `run:<runId>:events`, `run:<runId>:record`, `run:<runId>:terminal`, `run:<runId>:pause`, `run:<runId>:lease`, `launch:<launchId>:record`, `launch:<launchId>:supervision`, `run:<runId>:procs`. The runtime writes `run:<runId>:view` (disposable), `run:<runId>:status-line` and the pointer `workspace:current:status-line` (annex B §B.5, F100-FR-229)

**Testing**: the Node.js test runner; golden views from the primary event files of the fixture runs of feature 141 (FX-01, FX-02, FX-03, FX-04, FX-11, FX-12, FX-13, FX-22, FX-23, FX-28) and from hand-made logs (torn line, gap, unknown major); a fake clock; a sample renderer in the test tree that takes the JSON of a view and no file handle; a second implementation of the read model registered from the test tree; canary strings; the byte check of the budget test. No paid call

**Target Platform**: Linux and macOS. macOS is `unverified` until a runner passes the oracle. Windows and WSL are unvalidated

**Project Type**: one pure library package (`@specstride/view`, layer L6) and two commands in the CLI package (`status`, `wait`); the writers of the cache and of the line are called by the runtime package (feature 122)

**Performance Goals**: `status` finishes within 2 seconds on an event file of 100,000 events (F129-SC-001, a target), and within 0.5 second from a valid cached view (a target of this plan, not a success criterion; measured by T001); `wait` costs at most one file stat per poll while nothing has been appended and the state files are unchanged

**Constraints**: the pure package imports only `@specstride/contracts` and no Node built-in module; the view holds no content, no physical path, no secret and no control character; a reader writes nothing; the line has at most 170 bytes and the default output at most 420 bytes; no closed list of harnesses; no machine-specific name; every macOS statement `unverified`

**Scale/Scope**: 36 requirements, 9 success criteria, 0 as-is requirements and 0 behaviour items with a kept disposition (one `superseded-by` row), 10 fixture families cited, 1 own table (the lanes), 1 signal table, 1 extension point owned (EP-09)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: unchanged.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I-V)**

- [x] I. ✅ Coordination is through files only. `status` and `wait` are read-only processes that the consumer or the host starts; no run depends on them; `wait` polls files and ends by its time limit; it is not a service (F129-FR-024, F129-FR-029, F129-FR-033; ruling 63). The cached view and the status line are written atomically by the runtime and are disposable (F129-FR-008, F129-FR-028).
- [x] II. ✅ Nothing here approves. The fact "approved" in the view is what an event states; the view verifies no approval and decides nothing (clarification 19).
- [x] III. ✅ Text from outside the runtime is data. Every free-text field of the view is redacted, stripped of control characters, cut, and never echoed except as the need of an attention item (F129-FR-009, F129-FR-025). The view holds no content and no physical path.
- [x] IV. N/A: this feature reads no spec grammar. Phase titles come from events.
- [x] V. ✅ Observability is best-effort. A torn line, a gap, an unknown event, an unknown major, a missing state file and a dead runtime degrade the view and never fail a run or a command that only reads (F129-FR-004, F129-FR-005, F129-FR-035).

**The product and its edges (VI-XII)**

- [x] VI. ✅ Strict TypeScript; the pure package has no dependency and no built-in module; boundaries validated by the schema of the view; no native module; the extension point is named with its version.
- [x] VII. N/A for harness names: the view reads the role registry through events and enumerates no harness. Lanes and budget rows carry role and harness as text from the record.
- [x] VIII. N/A: this feature runs no pass. `wait` is never a step of a run.
- [x] IX. N/A: the critic is not touched. The view shows a critic-class call as an open pair of events.
- [x] X. ✅ The lifetime and output of a host hook that prints the line are documented facts: `unverified`, with a task that captures them on a live host (T002). No `verified-on` is claimed.
- [x] XI. ✅ The view says `null` for a value that no event states, and never a guess (F129-FR-010). A stream that ended without a terminal record is shown through the events of feature 111, not invented.
- [x] XII. ✅ No paid call in any test. The probe of the host hook is a capture on a live host, not a paid call.

**The host skill (XIII-XVII)**

- [x] XIII. ✅ The view separates facts from judgment: it records what events and files state; a lane is a pure table with a rule id; no model adds a status.
- [x] XIV. N/A: no verification command is declared here.
- [x] XV. N/A: no launch consent is touched. `status` and `wait` start nothing.
- [x] XVI. ✅ The supervisor only reads: `status` and `wait` write nothing, end nothing and relaunch nothing; processes that hold the run token are reported and never ended (F129-FR-015, F129-FR-021).
- [x] XVII. ✅ A missing prerequisite is a skip with a reason: no state gives one line and exit 1; state without a run gives "no run" and exit 0; an unknown probe result is `unknown`, not a pass (F129-FR-012, F129-FR-024).
- [x] XX. ✅ Parallel units: the view holds no field of the layer when the option is off, and the wall hours and agent hours when it is on (F129-FR-022).

**The rewrite (XVIII-XIX)**

- [x] XVIII. ✅ There is no as-is behaviour with a kept disposition; `002 FR-017` is `superseded-by DV-042`. Every new command and line is off or silent under the `parity` profile (F129-FR-025, F129-FR-027, F129-FR-029); the compatibility output is compared by feature 119 on FX-28 from the same view (F129-SC-009).
- [x] XIX. ✅ The status line is 170 bytes (60 tokens), the default output 420 bytes (150 tokens), an unchanged `wait` cycle 0 bytes; the build measures bytes and fails on a breach (F129-FR-031).

Every check passes. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/129-run-view-and-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── README.md
│   ├── run-view.md
│   ├── signal-table.md
│   ├── lane-and-attention.md
│   └── status-line.md
├── checklists/requirements.md
├── spec.md
├── tasks.md
└── analyze-report.md
```

### Source Code (repository root)

The package graph of feature 100 puts the read model in `@specstride/view` (layer L6, owner 129). The folder names below are a proposal.

```text
packages/view/src/
├── index.ts             # exports project, reduce, renderView, renderLine, expiry, signature, types
├── model/               # the RunView type, generated from the schema in @specstride/contracts
├── signals/             # the signal table (data) and the mapping from an event to a signal
├── reduce/              # the fold: one small function per signal
├── conditions/          # liveness table, dead, stale, launch-abandoned
├── lanes/               # the lane table (data) and its use of the injected table evaluator
├── attention/           # the nine kinds, keys, order, the fixed table of next commands
├── budget/              # rows, levels, notional
├── text/                # control characters, size cap, the injected redaction function
├── signature/           # the change signature and the cursor token
├── line/                # the status line, the drop order, the expiry test
└── serialize/           # the canonical serialization (key order)
packages/cli/src/status/
├── status.ts            # the command; text, --json, --line
├── wait.ts              # the command; the poll loop
├── event-reader.ts      # the only reader of the event file; cursor; torn line
├── state-readers.ts     # run record, terminal, pause, launch record, supervision record
├── probes.ts            # lease probe through EP-13, process-table search for the run token
└── output.ts            # default output, the caps of 120 and 420 bytes
packages/runtime/src/    # not built here: the writer of run:<runId>:view and run:<runId>:status-line calls renderLine
packages/testkit/        # sample renderer, second implementation of the read model, fake clock
tests/parity/129/        # none: no as-is item is assigned; FX-28 data check is a characterization test
tests/characterization/129/   # CT-129-*
```

**Structure Decision**: one pure package with every effect injected (the table evaluator, the redaction function, the canonical hasher, and all inputs as values), so that the same code runs in a host hook, a terminal, a test and, in Wave 2, a browser. The file readers and the two commands are in the CLI package, which the package graph lets import everything.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| None | | |

## Phase 0 and Phase 1 outputs

| File | Content |
|---|---|
| [research.md](research.md) | Decisions, with the sources, and what stays `unverified` |
| [data-model.md](data-model.md) | The fields of the view and the records this feature reads, in words |
| [contracts/](contracts/) | The view, the signal table, the lane and attention tables, the status line |
| [quickstart.md](quickstart.md) | How to see each behaviour on the fixtures |
