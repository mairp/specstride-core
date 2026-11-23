# Research: Quota, budgets and pause (feature 127)

Phase 0 of `speckit-plan`. The research of Stage A lives in `docs/ecosystem/research/`; this file summarizes what this feature took from it and links to it. Nothing here was measured by this feature. Every provider fact rests on documentation or on a type file and is `unverified` until a harness adapter feature captures it. Every macOS statement is `unverified` (ruling 67).

## Sources read

| Source | What it gave |
|---|---|
| `docs/ecosystem/research/R14-quotas-cost-observability.md` | The classes, the confidence order, the pause design (clocks, resume time, probe schedule, ceiling), the fallback chain, the cost model, the alert rules and their delivery |
| `docs/ecosystem/research/R15-ecosystem-architecture.md` A-6 | The run-state machine; a quota pause on the critic is the same state |
| `docs/ecosystem/research/R19-consolidation-map.md` C-23 | The pause is a state; one new stop reason at the ceiling |
| `docs/ecosystem/research/R25-routing-cascades.md` RT-E | Escalation spend counts against the proposer's budget; the owner ruled "skip" on a limited target (ruling 47) |
| `docs/ecosystem/research/R11-security-threat-model.md` T-18 | A harness with unknown cost: wall clock and counts; the doctor says so |
| `docs/ecosystem/research/R1-lisa-reuse-audit.md`, `R1v-lisa-gap-verification.md` | `budgets.ts` is extracted; it needs a new state input because Lisa's job state is not taken |
| `docs/ecosystem/research/R3-claude-code-host.md`, `R3v` | Host hooks as a mechanism of delivery; their lifetime is `unverified` |
| `docs/ecosystem/research/R8v-terms-verification.md` | The terms gate applies to every fallback entry |
| Lisa `363e6a3`, `packages/scheduler/src/budgets.ts` | Four ceilings, 0 is off, safe boundaries, atomic ledger, the unreadable ledger that loads as zero (fixed here) |
| Specstride `9cab15d`, `orchestrator.sh:224, 888-896, 1765-1780`; `proposer.sh:1518-1540, 2158-2163` | The whole-run wall-clock budget: default 0, whole minutes, at the top of a phase attempt and inside a yield wait |
| `feature-briefs.md` D.8, `CLARIFY-QUEUE.md` CQ-020 | The blocked reasons and their stop reasons |

## Decisions

### D-1 One pure classifier table plus a pattern set

The classifier is a table for the evaluator of feature 100 (LR-7). Text patterns are data that produce a named signal; the table then has no regular expressions. Rows are ordered structured, status, text, stall, and every decision records its rule id. Why: LR-7 asks for pure tables, and a harness adapter can add signals without code (`failures` map). Alternative rejected: code per harness in the core, which breaks the open registry.

### D-2 The confirming probe is a single call made before the pause

R14 says both "one confirming probe" and "downgraded after 2 probes". A pause on weak evidence cannot exist without a confirmation, so the second rule has nothing to apply to. Why: fewer states. Cost: one small real call, written to the ledger. Marked `CQ-137`.

### D-3 The ceiling bounds an episode

A resumed call that is limited again must not restart the 24 hours. The start of the episode is kept in the ledger, because the pause record is removed at resume. Marked `CQ-129`.

### D-4 One ledger, three billing modes

The ledger keeps real spend, notional cost and estimated cost apart, per role and per billing mode. Hard ceilings read real spend only. The ledger has two generations and can be rebuilt from the event stream, so that an unreadable file never means zero (DV-063). Alternative rejected: rebuild from events only, which is slow and depends on the sinks.

### D-5 Every usage record is a boundary

A hard ceiling is evaluated at every usage record, on the sum of live processes, and the engine ends the pass through the stop operation of the harness port. This is what makes "not more than one model call over the cap" true. Where a harness declares a process-level spending limit, the remaining headroom is handed to it as well.

### D-6 The wall-clock budget is ported unchanged

It stays a whole-minute count from the engine start, tested after the stop request at each phase-boundary step and at each tick of a yield wait. Paused time is excluded (new, not observable in parity). It keeps the key of the alias table, `loop.maxWallMin`.

### D-7 The escalation skip asks a query, not a signal

Annex D §D.4 gives the router no quota signal. This feature offers a query of the limit-window state; the skip itself is decided by the owner of escalation. Reported to feature 100.

### D-8 Alerts have one source

The engine writes alert events; every other channel reads. Levels: `info`, `warn`, `loud`. An alert never stalls a run (Principle V).

## Open items

| Item | Where |
|---|---|
| Captures of the limit signal of Claude (CLI stream), dsh, Codex, pi and prime | The adapter features 125, 130, 131, 134, 138, before their specifications freeze |
| A logical name for the spend ledger | Closed: `run:<runId>:spend` of annex B §B.5, schema id `specstride.spend/1` (§B.20) |
| Rows of annex X §X.7 for the budget, pause-tuning and wall-clock keys | Closed: rows 107 to 112 of annex X §X.7 |
| Whether a watcher started by a host hook lives long enough | `unverified` (R3, R14 open question 7) |
