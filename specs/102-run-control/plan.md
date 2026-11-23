# Implementation Plan: Run control (feature 102)

**Branch**: `102-run-control` (a label; the directory is `specs/102-run-control`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/102-run-control/spec.md`

## Summary

Feature 102 gives the consumer two verbs over a run that exists, `stop` and `resume`, and the records behind them: the stop request, the run snapshot, the source hashes and the counts that survive. It builds no loop. It is small and touches four places.

| Deliverable | What it is | Requirements |
|---|---|---|
| Stop request writer and honouring | The CLI writes the request; the engine reads it at its boundaries and ends with exit 6 | F102-FR-001 to F102-FR-005, F102-FR-009 |
| `stop --now` | Signals owned process groups after the identity check; `--jobs` for adoptable jobs | F102-FR-006 to F102-FR-008 |
| `resume` | The refusals in fixed order after the state check of annex G §G.4 (exit 1), the hash comparison, the acceptance flag, approval verification, the route of the continued run | F102-FR-011 to F102-FR-024 |
| Run snapshot and replay | Writing at launch, classes, ranks on resume, replay of the baseline's settings | F102-FR-025 to F102-FR-031 |
| Counts and continuation | Counts from the ledger, the reset flag, one continuation module for `launch`, `run` and `resume` (continued or new run), suffix rule, events (among them `source.change_accepted` and `unblocked`) | F102-FR-032 to F102-FR-037 |
| Output lines | Compatibility lines of `stop` and `resume` as literals; two product lines. The engine's as-is stop lines are rendered by the presenter from the compatibility projection of the stop event (features 144, 145); the event carries `foundAt` | F102-FR-004, F102-FR-010, F102-FR-031, F102-FR-034 |

Approach: behaviour is data-driven from the contracts of feature 100 (schemas, run-state machine, exit codes, ranks). The engine-side code is a module of the core package that reads the inbox, the ledger and the run snapshot, returns results, and writes only events and the ledger; every record of the snapshot, among them `acceptedChanges`, is written by the CLI (F102-FR-019, F102-FR-025). It reads and writes files through the kernel and the ports of the edge packages, because the core packages may not import `node:fs` or `node:fs/promises` (F100-FR-012, `assumption: CQ-185`). Everything that starts a process or sends a signal lives in the CLI or the runtime, because the core may not start processes (F100-FR-012). The waits that a stop request ends during a relaunch backoff and a quota pause are built by features 123 and 127; this feature tests them (F102-FR-009).

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ECMAScript modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas for `specstride.inbox/1`, `specstride.snapshot/1`, `specstride.launch/1`, `specstride.terminal/1`, run-state machine, exit codes, ranks); `@specstride/kernel` (atomic write, canonical hasher of feature 104, process primitive of feature 122 with the identity check). No other runtime dependency

**Storage**: files in the control plane, named by logical name: `inbox:stop`, `run:<runId>:snapshot`, `launch:<launchId>:record`, `run:<runId>:ledger`, `gate:<N>:approved`. Physical paths are those of `contracts/data/layout.json` of feature 100 (for example the stop request and `config.resolved.json`); this plan does not restate them

**Testing**: the Node.js test runner; fake binaries for the stub agents of feature 141; parity tests on FX-12 and FX-13; characterization tests `CT-102-n`; a fake process table for the identity check; no test calls a model

**Target Platform**: Linux and macOS. Every macOS statement is `unverified`; the process start time and boot identity on macOS are the open item (F100-FR-062)

**Project Type**: modules in the npm workspace: `@specstride/core` (engine side: read of the stop request, counts from the ledger, honouring), `@specstride/cli` (commands `stop` and `resume`, the comparison, the snapshot writer), `@specstride/runtime` (transitions T13 and T14, `--now` for the root's part). No package of its own

**Performance Goals**: `stop` and `resume` refusals answer in under 1 s on a workspace of 50 phases (starting value, low confidence; measured by task T047 in CI, reported and not gated until the value has a basis); `resume` output within the byte cap that feature 119 derives from the token budget of annex G §G.5

**Constraints**: no native module; no paid call in tests; the CLI writes no run state (LR-3, LR-4); nothing deletes a run directory; the core imports only `contracts` and `kernel`, and no file module of Node.js (F100-FR-012)

**Scale/Scope**: 37 functional requirements, 8 success criteria; 4 as-is requirements and 56 behaviour items (54 kept, 2 not carried) in 14 clusters; fixture families FX-12 and FX-13 with FX-11, FX-22, FX-23, FX-27, FX-03, FX-16, FX-08 as secondary; 27 characterization tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Stop is a file in the inbox, written by a temporary name and a rename; `resume` derives its position from records (approval records, the ledger, the snapshot), never from memory (F102-FR-001, F102-FR-011, F102-FR-022). No watcher or service; the host and the runtime share files only
- [x] II. ✅ Run control produces no verdict. `resume` verifies signed approval records and treats a bare marker as not approved (F102-FR-022). The accepted change reaches the critic as a fact and changes no verdict rule (F102-FR-020)
- [x] III. ✅ The stop request, the snapshot and the replayed settings are inputs that the runtime validates again; project configuration cannot widen a replayed key (F102-FR-001, F102-FR-024, T-28). The accepted change is a fact, and the critic sees no count of how it came about
- [x] IV. ✅ No spec grammar is parsed here. Hashes come from the one hasher (F102-FR-015, F102-FR-017)
- [x] V. ✅ The compatibility lines and the two product lines observe only; a failure to print one changes no state. Stop and resume never depend on an exporter

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the records are validated against schemas of feature 100 at every read; the core module imports no process, network or file API; extension points consumed: EP-13 `specstride.lock/1`, EP-07 `specstride.verification-source/1`, EP-04 `specstride.loop-layer/1` (spec, "Extension points")
- [x] VII. ✅ Nothing here names a harness. Pinned keys such as the harness of a role are keys of the snapshot; the registry is read at launch and not at resume (F100-FR-016)
- [x] VIII. ✅ A relaunch and a resume start a fresh session; only counts and files carry over (F102-FR-032). No pass waits for a human; a block rests (F102-FR-023)
- [x] IX. N/A: no critic call is made by this feature
- [x] X. N/A: no adapter is pinned here. The snapshot records the product version through the run record (F100-FR-050)
- [x] XI. ✅ Events carry references and no content (F102-FR-036); the as-is stop lines are rendered by the compatibility projection from the stop event, which carries `foundAt` for the choice of line (F102-FR-004, F102-FR-010); the engine writes no line of its own
- [x] XII. ✅ No paid API in any test. Secrets appear only as references in the snapshot (F102-FR-025, F102-SC-005); the canary test plants a secret in configuration

**The host skill (XIII–XVII, XX)**

- [x] XIII. ✅ Deterministic code records the facts: hashes, the refusal, the accepted change. A host model does not decide a refusal
- [x] XIV. ✅ Accepting a change derives the verification plan again from declared sources only (F102-FR-019); nothing is invented
- [x] XV. ✅ The flag is explicit consent to a changed source; no flag switches off a launch check, and a comment cannot set it (F100-FR-174)
- [x] XVI. ✅ The supervisor is not touched. Counts and phase attempt numbers survive a resume or relaunch unless the consumer resets them on purpose (F102-FR-032, F102-FR-033); a quota pause spends no budget and a stop ends it (F102-FR-009)
- [x] XVII. ✅ A test whose prerequisite is missing (the reference tree, the oracle, a macOS runner) reports a skip with its reason and never a pass; task T050 runs the tests of this feature on the macOS runner and records the result, and until then every statement about macOS stays `unverified` (F102-FR-001, F102-FR-007)
- [x] XX. N/A: the counters of the layer `parallel` are reset and carried with the others; nothing runs in parallel here

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour cites origin, disposition and test; intended differences have rows (DV-011, DV-021, DV-024, DV-029, DV-082, DV-091); the oracle passes the reset flag on resume fixtures and the profile turns the new checks off (F102-FR-018, F102-FR-032)
- [x] XIX. ✅ Default output of `stop` is one line, of a refused `resume` the failing item with its fix. The feature's share of the token budget is stated in `research.md` (D-9) and measured in CI

**Additional Constraints**

- [x] Config precedence ✅ Ranks of annex X §X.2 as F102-FR-027 restates them, with the pin of the launch contract above every flag. The constitution's row reads "run snapshot (on resume only)"; annex X §X.2 extends the snapshot's rank to a launch that continues a run (CQ-075, settled), which is a resume in all but the verb, and F102-FR-034 follows the annex. The wording of the constitution's row is reported to the owner; no principle is touched
- [x] Exit codes, stop reasons, single run per workspace ✅ Codes 1, 3, 5, 6 and `stop_flag` are those of annex G §G.4 and annex E §E.3; the lock is reached only through EP-13 (F102-FR-014)
- [x] State ✅ Greenfield; the control plane holds the records; nothing under an old state root is read

Result: no violation; Complexity Tracking is empty. Re-checked after Phase 1: unchanged. Re-checked on 2026-09-30 after the cross-feature review: row XVII is a pass with its reason and task T050 (W-X-09); row VI follows F100-FR-012 as repaired. Re-checked on 2026-09-30 after the analysis: row XI names the projection as the renderer of the as-is stop lines; the Additional Constraints are answered.

## Project Structure

### Documentation (this feature)

```text
specs/102-run-control/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
│   ├── README.md
│   ├── stop-request.md
│   ├── resume-refusals.md
│   └── snapshot-classes.md
├── checklists/requirements.md
├── tasks.md             # Phase 2 (speckit-tasks)
└── analyze-report.md    # speckit-analyze
```

### Source Code (repository root)

```text
packages/
├── core/src/run-control/            # engine side, no process or network API; writes only events and the ledger
│   ├── stop-request.ts              #   read, validate, remove (through the kernel); boundaries F102-FR-003; the stop event with foundAt
│   ├── counts.ts                    #   counts from the ledger; reset record; run.launched, counters.reset, unblocked
│   ├── accepted-change.ts           #   reads acceptedChanges of the snapshot; emits source.change_accepted; supplies the fact
│   └── attempt-names.ts             #   logical names of a phase attempt after a reset; the suffix rule (F102-FR-035)
├── cli/src/commands/
│   ├── stop.ts                      #   writes the request; --now and --jobs signal owned groups
│   └── resume.ts                    #   state check, refusals in order, replay, route, engine executable, the resuming: line
├── cli/src/run-control/
│   ├── records.ts                   #   schema-validated readers of the inbox, snapshot and launch records
│   ├── stop-request-writer.ts       #   the request by temporary name and rename
│   ├── signal-owned.ts              #   --now and --jobs after the identity check (process primitive of the kernel)
│   ├── refusals.ts                  #   the closed set, the order, the messages
│   ├── source-compare.ts            #   hashes over the canonical hasher; checkboxes ignored; parity switch
│   ├── refuse-source-changed.ts     #   the launch record with outcome refused; readers derive blocked-on-human
│   ├── accept-source-change.ts      #   --accept-source-change: derive again through EP-07; write acceptedChanges
│   ├── verify-approvals.ts          #   signature and bindings of every approval record
│   ├── snapshot-writer.ts           #   at launch and at an accepted change; classes; secret references
│   ├── snapshot-replay.ts           #   ranks on resume; re-validation
│   ├── launch-record.ts             #   the launch records behind T1, T2, T3, T17; the CLI writes no other transition
│   └── continue-or-new.ts           #   one module for launch, run and resume: unfinished run, --new-run, hash check, [SPECSTRIDE-CONTINUE]
└── runtime/src/                     #   transitions T13, T14 (owned by 122, 123); not written by this feature
tests/
├── parity/102/                      # PT-102-*: FX-12, FX-13 and secondary families
├── characterization/102/            # CT-102-1 to CT-102-27
└── release/102/macos.md             # the macOS result or the skip (T050)
```

**Structure Decision**: modules in existing packages of feature 100's package graph (`@specstride/core`, `@specstride/cli`); the core module holds only what the engine does at its boundaries, the CLI holds everything that touches processes. This keeps the import-boundary check of F100-FR-012 satisfied.

## Complexity Tracking

No violations.
