# Implementation Plan: Pipeline runtime and supervisor (feature 123)

**Branch**: `123-pipeline-runtime-and-supervisor` (a label; the directory is `specs/123-pipeline-runtime-and-supervisor`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/123-pipeline-runtime-and-supervisor/spec.md`

## Summary

Feature 123 builds what the runtime root does around the engine and what the host does to watch it: the pipeline stage executor, the registries of stage kinds and precondition checks (EP-19), the six launch checks, `supervise launch` and the record it leaves, both relaunch classifier tables with the relaunch budget and the `hold-relaunch` request, the `supervise` verbs with their poll backoff, the digest and the labelled lines in two output modes.

| Deliverable | What it is | Requirements |
|---|---|---|
| Pipeline entry | Arguments, start-up refusals, dry-run plan, lock, preflight, stage loop, state record, signals, digest | F123-FR-001 to F123-FR-009, F123-FR-013, F123-FR-014, F123-FR-016, F123-FR-017 |
| Stage kinds and checks | The two open registries, five kinds, six checks, the conformance suite and the sample | F123-FR-010, F123-FR-011, F123-FR-015 |
| In-stage retry | Attempts, backoff, deadline, reason rule | F123-FR-012 |
| Events, request kind `engine` | `pipeline.*`, `stage.*`, `supervisor.*`, `launch.checked` and `digest.written` events; the engine request | F123-FR-018 to F123-FR-020 |
| Launch checks and launch | Six ordered checks, registered as doctor checks; `supervise launch`; handshake exits; mode selection; launcher resolution | F123-FR-021 to F123-FR-026 |
| Relaunch | Table 1 with its two rows for a blocked run and a stop that is not retryable, table 2, budget, `relaunch.owner`, `hold-relaunch`, the relaunch procedure | F123-FR-027 to F123-FR-033, F123-FR-042 |
| Supervision | Verbs, cadence, observation, exit map, labelled lines, terse lines, record, budgets of output, the product line `[SPECSTRIDE-DIGEST]` | F123-FR-034 to F123-FR-041, F123-FR-043 |
| Terminal tool | The fallback to the pipe and the doctor check of the tool | F123-FR-011, F123-FR-044 |

Approach: the two classifier tables are data of feature 100's table evaluator, generated into `contracts/` from the spec and checked against it; the stage executor is a pure sequence over injected ports (clock, process starter, state writer, event writer, registries) so that every rule has a fake-clock test; output lines are data-driven from one line table so that compatibility output and default output cannot drift.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later; ECMAScript modules; the launcher is a Node-shebang file (feature 107 renders it)

**Primary Dependencies**: `@specstride/contracts` (closed sets, exit codes, line grammar, schemas), `@specstride/kernel` (table evaluator, atomic write, canonical hasher, the process primitive of 122), `@specstride/spec-formats` (the staleness verdict of 104), `@specstride/config`. No new runtime dependency from npm. Platform tool outside npm: `script` (the `script(1)` of util-linux on Linux and of the base system on macOS), used only to give the child of a `specstride` stage a terminal. It is optional: where it is absent the child runs through a pipe (F123-FR-011), and a doctor check that is not launch-blocking probes it (F123-FR-044)

**Storage**: files only, named by logical name (feature 100 annex B §B.5): `pipeline:<pipelineId>:state`, `:launcher-log`, `:report-log`, `:launch-log`, `:harness-run`, `launch:<launchId>:supervision`, `launch:<launchId>:record`, `run:<runId>:terminal`, `inbox:hold-relaunch`. Physical paths come from the layout table

**Testing**: the test runner that Node ships (`node:test`); fake clock and fake sleep; the engine stub of feature 141 (`@engine-stub`) and the real engine with agent stubs (`@full-stack`); golden decisions per classifier row; an exhaustive property test over the finite domains of the signals; parity tests `PT-123-*` in `tests/parity/123/` and characterization tests `CT-123-*` in `tests/characterization/123/`, the two directories of feature 100; conformance test for EP-19 in `packages/testkit/src/conformance/EP-19/` with a sample kind and a sample check in `packages/testkit/src/samples/EP-19/`. No test calls a model or a paid service

**Target Platform**: Linux and macOS. Every macOS statement is `unverified` (ruling 67): terminals for stage children, signal forwarding, process groups

**Project Type**: two places in the npm workspace: the package `@specstride/pipeline` (layer L5, owners 107 and 123) and the command wiring of `supervise` in `@specstride/cli` (layer L6)

**Performance Goals**: starting values with low confidence, measured in the build. A dry run of a launch contract of 20 stages under 1 s. One evaluation of a classifier table under 1 ms. One `observe` reading under 100 ms. Supervision output: the byte limits of F123-FR-041 (420, 700 and 8,400 bytes)

**Constraints**: no native module; no shell in any spawned command; no paid call in tests; core packages are not imported; no file of the workspace part is decided on; only the runtime tree writes the control plane, the CLI writing the launch record, the supervision record and the inbox only

**Scale/Scope**: 44 functional requirements, 10 success criteria, 19 clusters of behaviour items (177 kept items) and 13 as-is requirements and success criteria, fixture families FX-35 and FX-36 in two variants each

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.0.

*Constitution v3.0.1 (2026-09-30) differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature, so no answer changes.*

**The gate and the loop (I–V)**

- [x] I. ✅ Coordination is through files: the CLI writes the launch record, the supervision record and the inbox; the root reads them and writes the state. No service or watcher carries control; `supervise` polls files and no run depends on it (F123-FR-030, F123-FR-040). The state record and the digest are written atomically. `hold-relaunch` and `stop` are inbox files
- [x] II. ✅ This feature produces no verdict. It reads the terminal record and never a verdict. No classifier row approves anything; a relaunch starts a new engine start whose gate judges from the start (F123-FR-033)
- [x] III. ✅ Text from a run is never echoed into default output (F123-FR-039); the consumer's request text only selects among options that validation accepts and bypasses no launch check (F123-FR-025). Project configuration cannot set `relaunch.owner` above its rank: the key is not widening, and an unknown value is a configuration error (F123-FR-027)
- [x] IV. ✅ No spec grammar here. The hash that ignores checkboxes comes from feature 104 through the canonical hasher (F123-FR-009)
- [x] V. ✅ Output lines and events are best-effort: a write failure to the report log is ignored (F123-FR-038); the events do not hold output (F123-FR-018)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the two tables are data validated against the schema in `contracts/schemas/`, and the line table and the registry entries against schemas that the package holds in `packages/pipeline/data/schemas/` (T005); `@specstride/pipeline` imports only the packages the graph allows; no native module. One system tool outside npm, `script`, is named in Technical Context, is optional, has a fallback (F123-FR-011) and a doctor check (F123-FR-044), so no system requirement is undocumented (`research.md` D-6); extension points: EP-19 `specstride.stage-kind/1` implemented; EP-14 `specstride.doctor/1`, EP-13 `specstride.lock/1`, EP-17 `specstride.detach/1` consumed (`spec.md`, "Extension points")
- [x] VII. ✅ No harness is named in control flow: the stage kind `specstride` runs the engine, whatever harness the engine resolved. Nothing here enumerates harnesses
- [x] VIII. ✅ A run that rests blocked on a human is relaunched by neither owner under any profile, the `parity` profile included: table 1 refuses it at row O-33, which is active under every profile, and table 2 at R-03 (F123-FR-030, F123-FR-042; question CQ-238, answered by the owner on 2026-09-30). A stage child gets standard input closed and a process session of its own; nothing waits for a human; a relaunch starts a fresh session (F123-FR-011, F123-FR-033). The operator's configuration is not written
- [x] IX. N/A. This feature calls no critic. It only reads the terminal record of the engine
- [x] X. N/A. No adapter is pinned here. The version of the product of each engine start is in the run record of feature 100
- [x] XI. ✅ The supervisor events are typed events in the one stream (F123-FR-018); the compatibility projection renders the as-is lines; a stage that ends with no terminal record is a crash and is written as such (F123-FR-015); unknown values are `null`. No event holds output; text fields pass the redactor
- [x] XII. ✅ Tests call no paid API. The engine stub and agent stubs come from feature 141. No secret is read: the launch environment carries names and never values in lines (F123-FR-003)

**The host skill (XIII–XVII)**

- [x] XIII. ✅ The digest is produced by the runtime from events; the host prints it verbatim (F123-FR-016); the classifier is a pure table with the rule id recorded (F123-FR-028, F123-FR-029). Mode selection reads text and can only select among validated options (F123-FR-025)
- [x] XIV. N/A. No verification command is declared or invented here
- [x] XV. ✅ `launch` is invocation and `--dry-run` withholds it and writes nothing (F123-FR-005). No flag switches off a launch check (F123-FR-021, feature 100 F100-FR-174)
- [x] XVI. ✅ Relaunch only for classified transients within the budget (F123-FR-028 to F123-FR-031): both tables read `retryable` and the blocked reason from the terminal record, table 1 by the rows O-33 and O-34 and table 2 by R-03 and R-14, so a run that rests blocked on a human is relaunched by neither owner under any profile (F123-FR-042; CQ-238). Under the `parity` profile only the row O-34 is inactive (annex X §X.7 row 132; register row DV-114), so a stop that is not retryable and not blocked is classified as the baseline does, by the listed exit codes and the allowed reasons; a quota pause gives the classifier nothing (F123-FR-030); counts survive from the ledger (F123-FR-033); the host observes and asks: `hold` and `release` write inbox requests and no state (F123-FR-032); `supervise` writes only the supervision record (F123-FR-040)
- [x] XVII. ✅ A missing prerequisite is a skip with its reason: `existing-prerequisite`, the `[SKIP]` lines, the `deferred` result of a command check in a dry run (F123-FR-005, F123-FR-010). A missing terminal record is a crash, never a pass
- [x] XX. N/A. No work runs in parallel. The stage graph is serial (F123-FR-019). The dry run prints the parallel plan only when feature 142 is on (F123-FR-006)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour has its origin, disposition and test in `spec.md`; the intended differences have their rows (DV-005, DV-006, DV-007, DV-009, DV-022, DV-026, DV-027, DV-028, DV-033, DV-034, DV-036, DV-038, DV-054, DV-055, DV-066, DV-067, DV-070, DV-074, DV-075, DV-080, DV-082, DV-088, DV-114); the `parity` profile sets `relaunch.owner: supervise`, compatibility output, and no new line. FX-35 and FX-36 run in both variants (F141-FR-016)
- [x] XIX. ✅ Host-facing output is terse: one cycle 420 bytes, a terminal digest 700 bytes, a whole run 8,400 bytes (F123-FR-041), measured in CI; an unchanged reading prints nothing (F123-FR-039)

Every check passes. Complexity Tracking is empty.

**Re-check after the cross-feature review (2026-09-30)**: row XVI was marked as passed while table 1 could relaunch a blocked run; the spec changed so that it passes (item W-123-01). Row VI named `script(1)` without a requirement; the requirement, the fallback, the doctor check and the tasks exist now (item W-123-03).

**Re-check B-8.7, pass-on (2026-09-30)**: rows VIII and XVI said passed, although the rows O-33 and O-34 are inactive under the `parity` profile (annex X §X.7 row 132; DV-114), so that there a run that rests blocked on a human can be relaunched. Both rows now state the deviation, and Complexity Tracking records it with question CQ-238, as feature 100 does (`specs/100-specstride/plan.md`, row VIII and Complexity Tracking).

**Answer of the owner on CQ-238 (2026-09-30)**: row O-33 of table 1 is active under every profile, the `parity` profile included; row O-34 stays inactive under `parity` (register row DV-114, narrowed to O-34). A run that rests blocked on a human is therefore never relaunched, and rows VIII and XVI pass under every profile. The deviation and its Complexity Tracking row are removed.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency from npm. It adds one generator and check script in the standard library of Python, as the tool of a specification, and the product carries none (see `contracts/tools/generate.py`, which is a specification tool like that of feature 141 and is not a component of the product).

## Project Structure

### Documentation (this feature)

```text
specs/123-pipeline-runtime-and-supervisor/
├── spec.md                  # the specification; the reference sections §R.1 to §R.9
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions, with links to docs/ecosystem/
├── data-model.md            # Phase 1: entities, records, states
├── quickstart.md            # Phase 1: how to validate the feature
├── contracts/               # Phase 1: machine-readable forms of the reference sections
│   ├── README.md
│   ├── relaunch-observe.table.json   relaunch-root.table.json
│   ├── launch-checks.json            pipeline-lines.json
│   ├── supervise-verbs.json          closed-sets.json
│   ├── schemas/relaunch-table.schema.json   # the schema of a classifier table; the only schema here
│   └── tools/generate.py             # generates the tables from spec.md and checks all files
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/pipeline/                       # @specstride/pipeline, layer L5 (owners 107, 123)
├── data/
│   ├── relaunch-observe.table.json      # table 1, from contracts/
│   ├── relaunch-root.table.json         # table 2, from contracts/
│   ├── lines.json                       # the line table: label, form, hue, stream, default-output flag
│   ├── stage-kinds.json                 # the five built-in kinds and six checks, as registry entries; written by T005, contracts/ holds no such file
│   └── schemas/                         # the schemas of lines.json and stage-kinds.json, added by T005
├── src/
│   ├── entry/                           # arguments, start-up order, dry run, exit codes, signals
│   ├── executor/                        # stage loop, skip and reset, state record, in-stage retry, timeouts
│   ├── kinds/                           # registries; setup, decision, command, specstride, smoke
│   ├── checks/                          # the six precondition checks
│   ├── output/                          # line table, colour, redaction of an action, the digest, default output
│   ├── launch-checks/                   # the six checks as registered doctor checks; the decision
│   ├── relaunch/                        # signals, the two tables' evaluation, budget, hold, the root's relaunch procedure
│   └── supervisor/                      # mode, resolve, observe, cadence, supervision record, exit map, supervisor lines
└── test/                                # unit tests of the modules only; CT-123-* live in tests/characterization/123/
packages/cli/src/commands/supervise.ts   # verb wiring; owner 123 (the package is owned by 119)
tests/parity/123/                        # PT-123-011FR011-* … PT-123-C-255-*, on FX-35 and FX-36, two variants each
tests/characterization/123/              # CT-123-*: tables, cadence, budgets, output limits, blocked runs, the terminal tool
packages/testkit/src/conformance/EP-19/  # the cases of this feature in the conformance suite of EP-19
packages/testkit/src/samples/EP-19/      # the sample kind and the sample check
```

**Structure Decision**: the executor, the tables and the supervisor library live in `@specstride/pipeline`, which `specs/100-specstride/contracts/data/package-graph.json` names as the L5 package of features 107 and 123. It may import `contracts`, `kernel`, `spec-formats` and `config`, not the runtime package (122, which imports it). Starting the runtime root through a detach strategy is done by the command wiring in `@specstride/cli`, which may import every package: the CLI passes the strategy to the library as a port. The registration of the six launch checks and of the check of the terminal tool in the doctor registry uses the registration call of doctor checks in `@specstride/kernel`, which the package graph gives to feature 100 (`package-graph.json`, owner of `kernel`: "100 (table evaluator, atomic write, registration call of doctor checks)"). `pipeline` may import `kernel` and does not import `doctor`.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Child process | `spawn` with an argument array, `shell: false`, `detached: true` (a new process session), standard input `ignore`. The process group is signalled with a negative pid |
| Timeout | A timer per attempt; the termination signal to the group; after 5 seconds the kill signal; child code 124 |
| Terminal for a `specstride` stage when colour is on and standard output is not a terminal | `script(1)`, with the flags of the platform; no native module. `unverified` on macOS. Found once per run on the search path; absent, or failing to start: the pipe of the next row, and one `[WARN]` line |
| Doctor check of the terminal tool | Id `pipeline.terminalTool`, `lb` false, severity `warn` when absent; the probe is injected and only looks the tool up on the search path, as the check `command_available` does; it starts no shell and no process |
| Output when colour is off | A pipe with merged streams; bytes echoed and logged with escape sequences removed by a fixed pattern |
| Atomic write of the state record | The kernel primitive: temporary file in the same directory, `fsync`, rename. Content: sorted keys, indent 2, as the baseline |
| Fake clock | Every module takes `now()` and `sleep(ms)` as ports; the cadence, the budget deadline and the timeouts are tested without waiting |
| Table evaluation | The kernel's table evaluator over the two JSON files; the signals are built by one function per table, so that a signal has one definition. `blocked` and `retryable` are built from the terminal record by one function that both tables share |
| Classification of a stage reason | One function: the literal to a class (`transient`, the deliberate names, `exec-error` by prefix, `other`) |
| Line table | One file, `lines.json`, read by the output module; the compatibility form and the default form of a line are two entries with the same key, so that a test can compare the sets |
| Digest | Built from the events of the run by the output module; the host prints it verbatim |
| Byte limits | A test counts bytes of default output on a simulated 24-hour run with a fake clock: 420, 700, 8,400 |
| Relaunch by the root | The stage loop is a function of the state record; a relaunch is a second call of the same function after preflight, under a new launch id |

## What is planned elsewhere

| Subject | Where |
|---|---|
| Deriving, validating, promoting, rendering the launch contract; the validator of `configuration.relaunch` and of the reason rule | 107 |
| The detach strategies, the lock provider, the lease, the handshake mechanism, the inbox mechanism | 122 |
| The `stop` command and `resume` | 102 |
| The compatibility projection (the as-is event file, the five compared logs) and the events' content | 111 |
| The doctor registry | 112. Its registration call is in `@specstride/kernel`, owner feature 100 (Structure Decision) |
| `status`, `wait` and the run view | 129 |
| The `supervise retro` verb | 106 |
| The parallel plan and its lines | 142 |
| The engine and the terminal record | 101, 103 |
| The stubs, fixtures, normalizer and comparator | 141 |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | The dry run of FX-35, with the engine stub: arguments, colour, start-up refusals, the plan lines, the digest | The data of feature 100; the stubs of 141 |
| 2 | The two registries of EP-19 with their built-in kinds and checks, which validation, preflight and the stage loop reach; the lock, the state record, preflight, the stage loop with skipping and reset, timeouts, signals, in-stage retry; FX-35 in full | The lock provider (122) |
| 3 | The sample of EP-19 and its conformance suite | Step 2 |
| 4 | The six launch checks, `supervise launch`, mode, resolve, observe, cadence, exit map, the supervisor lines; FX-36 | The launch record and the detach strategy (122) |
| 5 | Table 1 with its golden decisions; the relaunch by `supervise observe` | Step 4 |
| 6 | Table 2, the relaunch procedure of the root, `hold-relaunch`, the crash row | The terminal record (101), the ledger (103) |
| 7 | Default output, the terse lines, the byte limits | Steps 4 to 6 |
| 8 | FX-35 and FX-36 in both variants under the `parity` profile | Everything above; the real engine |

## Complexity Tracking

Every check of the Constitution Check passes, after the answer of the owner on CQ-238 (2026-09-30). Nothing to justify.
