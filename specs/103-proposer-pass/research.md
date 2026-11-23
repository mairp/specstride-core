# Research: Proposer pass (feature 103)

Phase 0 of the plan. The research of this effort stays in `docs/ecosystem/`; this file says which report settles what, records the decisions of the plan, and lists what is `unverified`.

## Sources

| Subject | Source | Used for |
|---|---|---|
| The baseline's pass loop | `proposer.sh`, `orchestrator.sh` (lines 1388 to 1640 and 1785 to 1990), `lib/error_breaker.py`, read at `9cab15d` | F103-FR-001 to F103-FR-020, F103-FR-031 to F103-FR-033 |
| Behaviour items | `docs/ecosystem/research/R18-behaviour-inventory.tsv`; `traceability-items.tsv` (106 items of feature 103) | The `origin:` of every requirement of G1 and of F103-FR-031 to F103-FR-033 |
| Warm start and carry-over | `research/R24-warm-start-context-carry-over.md` F-1 to F-8 | Handoff, ledger, drop rules, session directive |
| Run acceleration | `research/R27-run-acceleration-synthesis.md` D1.1, D1.10, D1.11 | Switches, carry-over, the index |
| The stuck run | `research/R28-netops-run-stuck-diagnosis.md` | The start-up defect and the check of the hashes at every pass start |
| Memory and the index | `research/R12-memory-compression.md` F1, F2, Recommendation | The index of verification obligations |
| Parallel units | `research/R29-parallel-units-design.md` PU-05, PU-33 | Stacking, negotiation, the eleventh drop rule |
| The layer interface | `specs/100-specstride/annexes/D-pass-loop.md` §D.1, §D.2, §D.5 | Call points, directives, provider operation |
| Result codes and stop reasons | `specs/100-specstride/annexes/E-engine.md` §E.2 to §E.4 | The mapping table, blocked reasons |
| Ledger and snapshot | `specs/100-specstride/annexes/B-state.md` §B.12, §B.13 | The core namespace, the source hashes |
| Profile and closed sets | `specs/100-specstride/annexes/X-cross-layer.md` §X.6, §X.7 | Switches and closed sets |
| Fixture families | `specs/141-parity-oracle/spec.md` §O.2, §O.4, §O.6 | The parity tests |
| Lisa's context budgeting | `packages/core/src/engine/proposer-context.ts` and its test at `363e6a3` | F103-FR-035 |
| Defects | `consolidation.md` section 5: D-44, D-45, D-48 preserved; the start-up fixed (DV-087) | F103-FR-011, F103-FR-012, F103-FR-018, F103-FR-008 |

## Decisions

### D-1 The pass loop is a call with a request record and a result record

- **Decision**: the engine calls the pass loop as a function. The flags of `proposer.sh` become fields of the request; the exit codes become `exit_code` of the result (F103-FR-001).
- **Rationale**: layering rule LR-6 keeps a process boundary only where the oracle observes one; F100-FR-171 says the pass loop is not a public command. The oracle drives the front door and reads the result through the surfaces of feature 141.
- **Alternatives considered**: a child process per phase attempt as at the baseline (a process boundary that no fixture observes; it would need a launcher and cost a second start-up).

### D-2 The accounting after a pass is one table

- **Decision**: after a pass the loop applies, in this order: the harness port's `betweenPasses`, the kill check, the yield check, the layer, then the accounting: evidence, quota carve-out, error accounting (legacy or structured), the cap counter, the short-pass counter, the no-progress measurement, the stop flag, the pause. The order is data in `contracts/accounting-order.json`.
- **Rationale**: the baseline's order is fixed by the shape of the script and is not written anywhere. Reading `proposer.sh:2050` to `2360` gives it: the plugin request, the kill sidecar, the yield, the evidence, the short-pass counter, the structured path or the legacy path, the no-progress check, the stop flag. The evidence check sits before the short-pass counter and before every breaker, which is why phase evidence wins outright.
- **Alternatives considered**: keeping the accounting inside the loop body (untestable per rule).

### D-3 The empty-prompt test scans for one character outside a fixed set

- **Decision**: one scan for a character outside space, tab, newline, vertical tab, form feed and carriage return; it stops at the first one (F103-FR-008).
- **Rationale**: R28 measured 20 kB at 2.07 s, 40 kB at 8.78 s, 80 kB at 32.68 s and, with the C locale, 80 kB at 0.06 s. The baseline's expansion `${PROMPT//[[:space:]]/}` is quadratic in a UTF-8 locale. A scan that stops at the first non-space character is linear in the worst case and constant in the usual one. The set is the ASCII white space of the C locale; the fixtures hold no other white space.
- **Alternatives considered**: `trim()` of the language (removes Unicode spaces such as the no-break space that the baseline's C locale does not; a difference on non-ASCII input). `unverified`: whether a fixture of the oracle contains a prompt that is empty in a UTF-8 locale and not in the C locale; feature 141 is asked to hold none.

### D-4 Progress is measured by a pruned walk that stops at the first hit

- **Decision**: the walk prunes the repository directory, the workspace part, `node_modules` and `.venv`, and returns at the first file with a modification time later than the start stamp less one second (F103-FR-016).
- **Rationale**: the baseline uses `find -newermt` with the same prunes. The comparison is strictly greater and whole seconds, so the stamp is taken one second earlier (B-0762). A new pass must not pay a full walk of a large tree when the first file already shows progress.
- **Alternatives considered**: a file-system watcher (a service; against Principle I).

### D-5 Two paths of error accounting stay two

- **Decision**: the legacy path reads the last `agent_result` record; the structured path takes the result of its own invocation by identity (F103-FR-012, F103-FR-013). The port keeps both, because they are two behaviours of the reference and the oracle compares both (FX-18 scenarios `consecutive-errors-legacy` and `consecutive-errors-structured`).
- **Rationale**: the choice between them is not a harness name; it is a property of the stream reader that the harness adapter declares. The core never tests a harness name (F100-FR-023).
- **Alternatives considered**: one path with the structured rules for all (changes D-48: a crashed pass of a harness with no terminal record would no longer read as clean; that defect is preserved).

### D-6 The no-progress breaker on the structured path is a switch, off under `parity`

- **Decision**: `loop.noProgressStructured`, default on, off under `parity`; row 59 of annex X §X.7 (F103-FR-018).
- **Rationale**: defect D-44 is preserved under the oracle. The brief and DV-067 ask that a declared block ends the run on every path outside the oracle. The table of blocked reasons (annex E §E.2) has the reason `declared-block` and says the no-progress breaker fired.
- **Alternatives considered**: always evaluating the breaker (breaks FX-19 scenario `no-progress-structured-not-evaluated`); never evaluating it (the run keeps the defect and loops until another breaker fires).

### D-7 The source check runs before the prompt is built

- **Decision**: at the start of every pass, before the assembler is called (F103-FR-021).
- **Rationale**: R28: a change to the task list made the critic refuse a 44-hour attempt 22 hours after the edit. A check before the pass costs one hash of three files. A check after the prompt is built would waste the assembly. The task list hash that ignores checkboxes is the one compared, so a tick made inside a phase attempt by the runtime or the proposer never stops the run (ruling K3, D.8 row 2).
- **Alternatives considered**: checking only at the start of a phase attempt (misses an edit during a 44-hour attempt).

### D-8 The ledger is always written at the boundaries of a phase attempt

- **Decision**: records of the kinds `attempt-open`, `attempt-closed` and `counts-reset` are always written; `pass-closed` and the handoff belong to the switch `carry.ledger_handoff` (F103-FR-039; CQ-066).
- **Rationale**: F100-FR-068 requires one record per phase attempt with every layer off; F100-FR-069 requires counts to survive a resume; row 8 of annex X §X.7 puts the ledger and the handoff off under `parity`, with the reset flag in the resume fixtures. The reading that satisfies all three keeps the boundary records.
- **Alternatives considered**: no ledger under `parity` (counts could not survive a resume in a default run that shares the store; the run record would carry them alone, against one writer per file).

### D-9 The core namespace has four record kinds

- **Decision**: `attempt-open`, `attempt-closed`, `pass-closed`, `counts-reset` (F103-FR-039). A layer owns the kinds of its own namespace.
- **Rationale**: annex B §B.13 gives feature 103 the envelope and the namespace `core`. The counters of the envelope are what a resume needs; four kinds are enough to write them at the moments that matter.
- **Alternatives considered**: one record kind with a type field (no closed set for a reader to refuse).

### D-10 The handoff is regenerated from the ledger, the plan and the last kill note

- **Decision**: a pure function of files the runtime holds; no model writes any part (F103-FR-041).
- **Rationale**: R24 F-8: each carried item must be regenerable from plan, git and events, so it can be checked byte for byte; the risk of a stale handoff is answered by the tree fingerprint and the line that the tree wins.
- **Alternatives considered**: a summary written by the proposer (self-conditioning; R24 F-4 risk table).

### D-11 Drop rules of continuation as data

- **Decision**: eleven reasons in `contracts/fresh-session-reasons.json`; a session is continued only when the switch is on, the capability is set and no reason holds (F103-FR-042).
- **Rationale**: R24 F-6 gives ten rules; R29 PU-33 adds the eleventh. Thresholds are parameters with starting values of low confidence (R22:212; R27 D1.5), measured by experiments X9 (continuation off) and X11 (index off).
- **Alternatives considered**: hard-coded thresholds (the experiments need to vary them).

### D-12 Lisa's policy is a provider under the current set

- **Decision**: the six sources and their caps are extracted from `proposer-context.ts` at `363e6a3` and run behind the provider operation; the baseline's own budgeting stays under the as-is set (F103-FR-035).
- **Rationale**: the brief asks for it. Lisa's characterization tests (the observed 434 kB immutable prompt, the priority order, the deterministic compaction of progress) become tests CT-103-135.
- **Alternatives considered**: taking Lisa's policy for the as-is set (breaks byte-for-byte prompts).

### D-13 The index title length is a parameter, its value set by the build

- **Decision**: `carry.indexTitleChars`, starting value 80 characters with low confidence (F103-FR-037, row 60 of annex X §X.7; set on 2026-09-30 at the analyze run, finding U3).
- **Rationale**: R12 and R27 say "a title cut to a fixed length" and give no number. Experiment X3 measures how much prompt the index removes; X3 may replace the starting value. The value must be the same in every pass of a run.
- **Alternatives considered**: a number in the spec (no source for it).

### D-14 Layers are registered as data or first-party code

- **Decision**: the registry accepts a layer declaration validated against the offered directives and services, and refuses third-party code (F103-FR-025; F100-FR-014).
- **Rationale**: ruling 30: data only; publish the interface contracts. The layer `micro` and the layer `parallel` are first-party code in packages of their own.
- **Alternatives considered**: loading a layer from a path in configuration (not Wave 1).

## Facts that are `unverified`

| Fact | Where | Check |
|---|---|---|
| The start-up of the port is under 1 s of processor time at 320 kB on the reference machine, and every figure on macOS | F103-FR-008, F103-SC-004 | The start-up measured with prompts from 20 kB to 320 kB on both systems |
| The cache-stable start turns the first-turn write into a read | F103-FR-036 | Experiment X4 on a tested harness adapter |
| A continued session finds its session on each tested harness adapter that declares continuation, and the age rule uses the harness's own cache lifetime | F103-FR-042 | A paired run per harness adapter |
| Whether the quota signal of each tested harness reaches the loop as a class | F103-FR-020 | The fixtures of the harness adapters |
| The saving of the index on the first-turn tokens (40 per cent or more) | F103-SC-001 | Experiment X3 |
| Any statement about macOS | all | A macOS runner passes the oracle (ruling 67) |

## Questions that the sources do not answer

| Id | Question | Recommended answer | Reported in |
|---|---|---|---|
| CQ-066 | Does `carry.ledger_handoff` off stop the whole ledger? | Only the carry-over parts; boundary records stay | The final message |
| CQ-067 | With which result does the pass loop report a stop for a changed source? | `exit_code` 3 with the field `blocked` | Closed 2026-09-30: annex E §E.4, table "Pass loop", row 3 |
| CQ-068 | Where is the cache lifetime of a session declared? | A field of the record `continuation` or `session` of the descriptor; 300 s where none | Closed 2026-09-30: `continuation.cacheTtlSec` of annex C §C.2 |
| CQ-069 | Where does the path of an index entry point? | To `feature:<slug>:verification:test-plan` | The final message |
