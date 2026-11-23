# Implementation Plan: Quota, budgets and pause (feature 127)

**Branch**: `127-quota-budgets-and-pause` (a label; the directory is `specs/127-quota-budgets-and-pause`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/127-quota-budgets-and-pause/spec.md`

## Summary

Feature 127 builds the classification of provider limits, the quota pause as a run state, the opt-in fallback, and everything about money: budgets, the one spend ledger, hard caps, alerts and notional cost. It also ports the whole-run wall-clock budget of the baseline.

| Deliverable | What it is | Requirements |
|---|---|---|
| Classifier (EP-12) | Pure table, pattern set, probe rules, host source, limit-window state, conformance suite and sample | F127-FR-001 to F127-FR-009 |
| Pause | State entry, no-spend rule, clocks, resume time, ceiling, wake and reboot, stop, blocked cases | F127-FR-010 to F127-FR-017 |
| Fallback | Opt-in list, trigger, terms gate, billing-mode alert, switch and return | F127-FR-018 to F127-FR-023 |
| Budgets | Ceilings, hard and soft, the wall-clock budget and its checks | F127-FR-024 to F127-FR-027 |
| Spend | Counting, notional cost, estimated cost, ledger, unreadable ledger, enforcement, hard cap, unmeasurable spend, metered critic cap | F127-FR-028 to F127-FR-036 |
| Alerts | Thresholds, provider warnings, sole source and delivery, events, announcement | F127-FR-037 to F127-FR-041 |

Approach: the classifier and the alert rules are data for the evaluator of feature 100; the ledger, the evaluation of ceilings and the pause clock are pure functions over injected ports (clock, random source, file writer, event writer, harness port), so that each rule has a fake-clock test. The engine calls these through interfaces of `contracts`; it imports no implementation (LR-1).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) on Node.js 22 or later; ECMAScript modules

**Primary Dependencies**: `@specstride/contracts` (closed sets, schemas, events), `@specstride/kernel` (table evaluator, atomic write, canonical hasher, redactor call). No new runtime dependency from npm

**Storage**: files only, by logical name: `run:<runId>:pause`, `run:<runId>:spend` (annex B §B.5), `run:<runId>:registry`, `run:<runId>:terminal`, `inbox:host-events:<launchId>`, `run:<runId>:events`. Physical paths come from the layout table

**Testing**: the test runner that Node ships (`node:test`); a fake clock, a fake random source and a fake file writer; harness stubs of feature 141, including the generic stub `stub-harness` with a descriptor that declares a limit signal; recorded streams from the adapter features. Parity tests `PT-127-*` in `tests/parity/127/`; characterization tests `CT-127-*` in `packages/policy/test/`. No test calls a model or a paid service; a paid probe is a task that says so and is not run in Stage B

**Target Platform**: Linux and macOS. Every macOS statement is `unverified`, notably the clock after a wake of the machine

**Project Type**: two directories of the package `@specstride/policy` (layer L1, owners 110, 127 and 147): `src/quota/` and `src/budget/`. The engine wiring is owned by the engine features

**Performance Goals**: starting values with low confidence. One classification under 1 ms. One update of the ledger under 5 ms. The pause wakes to read a stop request at least once a minute

**Constraints**: no native module; no shell; no paid call in tests; the core imports no implementation of this feature; project configuration may only narrow: ceilings and `pause.maxTotalMs` are narrowing keys, fallback keys are widening; alert text passes the redactor

**Scale/Scope**: 41 functional requirements, 11 success criteria, 5 clusters of behaviour items (6 items) and 2 Lisa requirements; fixture families FX-23 and FX-18

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v3.0.1.

*Re-read against v3.0.1 at the analyze run of 2026-09-30: the added sentence of Principle IX (the weaker proof, CQ-182) binds a tested harness adapter; this feature pins no adapter and adds no critic route, so the row of Principle IX below stands unchanged.*

**The gate and the loop (I–V)**

- [x] I. ✅ The pause record and the ledger are files written atomically; a pause is recomputed from the record after a wake or a `resume`, never from memory (F127-FR-015, F127-FR-031). A host event arrives only through the inbox (F127-FR-007). No service carries control
- [x] II. ✅ This feature produces no verdict and approves nothing. A pause on the critic repeats the call with a new nonce (F127-FR-011); a fallback never puts the critic in the session of the proposer (F127-FR-022)
- [x] III. ✅ Alert text and evidence pass the redactor (F127-FR-002, F127-FR-037). No comment, flag, mode or project key bypasses a budget or the terms gate (F127-FR-020, F127-FR-034). Ceilings are narrowing keys
- [x] IV. N/A. No spec grammar here
- [x] V. ✅ An alert never stalls or fails a run (F127-FR-039); a failing classifier gives `provider_other` and the as-is path (F127-FR-003); sinks receive events after the local file (F127-FR-040)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; tables and the ledger validated against schemas at the boundary (`contracts/`); EP-12 implemented with a conformance suite and a sample outside the core; EP-02, EP-11 and EP-08 consumed; no native module
- [x] VII. ✅ No harness is named in control flow; classifier entries come from adapters and descriptors (F127-FR-008); the fallback list reads the registry's role plan (F127-FR-018)
- [x] VIII. ✅ A run blocked on a human says so with the distinct signal and rests (F127-FR-017); a fallback starts a fresh session (F127-FR-022); the operator's configuration is not written
- [x] IX. ✅ The pause of a critic-class call repeats it with the same tool-less form; no tool is added by a fallback (F127-FR-011, F127-FR-022). The critic's budget is a cap the engine enforces (F127-FR-036)
- [x] X. N/A. No adapter is pinned here; every usage record carries harness, provider and billing mode (F127-FR-023)
- [x] XI. ✅ Unknown values are `null` and sum as unknown; notional cost is labelled and kept apart (F127-FR-028, F127-FR-029); events carry no content (F127-FR-040)
- [x] XII. ✅ Tests use stubs and recorded streams; no paid call; the terms gate is evaluated at every switch (F127-FR-020); secrets are never in alerts

**The host skill (XIII–XVII)**

- [x] XIII. ✅ Classification and alerts are pure tables with rule ids recorded (F127-FR-003, F127-FR-037); the host reads alerts and never computes them (F127-FR-039)
- [x] XIV. N/A. No verification command is declared or invented here
- [x] XV. ✅ No flag switches off a budget or the terms gate (F127-FR-034); the announcement of caps is part of launch (F127-FR-041)
- [x] XVI. ✅ A pause is not a stop and spends no budget; it gives the relaunch classifier nothing (F127-FR-011, F127-FR-015); counts survive a resume and the reset flag does not reset spend (F127-FR-031)
- [x] XVII. ✅ A signal that is not captured is `unverified`, and a weak classification pauses only after a probe (F127-FR-006); a missing measurement is reported, not passed (F127-FR-035)
- [x] XX. N/A. No work runs in parallel here; the hard cap is evaluated on the sum of live processes so that feature 142 can use it (F127-FR-033)

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour has an origin, a disposition and a test in `spec.md` (002 FR-041, 002 FR-042, C-007, C-009, C-010, C-012, C-013); the intended differences have rows (DV-005, DV-027, DV-049, DV-063); FX-23 and FX-18 run under the `parity` profile; Lisa behaviours have characterization tests CT-127-1 and CT-127-2
- [x] XIX. ✅ The announcement and the alerts are terse; the summary of the ledger is one record read by the digest; nothing here adds to the token budgets of the host skills

Every check passes. Complexity Tracking is empty.

**Re-check after Phase 1 design**: unchanged. The design adds no dependency from npm and no source of alerts besides the engine.

## Project Structure

### Documentation (this feature)

```text
specs/127-quota-budgets-and-pause/
├── spec.md                  # the specification; reference sections §Q.1 to §Q.5
├── checklists/requirements.md
├── plan.md                  # this file
├── research.md              # Phase 0
├── data-model.md            # Phase 1
├── quickstart.md            # Phase 1
├── contracts/               # Phase 1: data forms of the reference sections
│   ├── README.md
│   ├── classifier.table.json  text-patterns.json
│   ├── closed-sets.json       spend-ledger.schema.json
├── tasks.md                 # Phase 2 (speckit-tasks)
└── analyze-report.md        # speckit-analyze
```

### Source Code (repository root)

```text
packages/policy/                         # @specstride/policy, layer L1 (owners 110, 127, 147)
├── data/
│   ├── classifier.table.json            # from contracts/
│   └── text-patterns.json               # from contracts/
├── src/
│   ├── quota/                           # classify, observe, probe rules, limit-window state, pause clock
│   └── budget/                          # ceilings, evaluation, ledger, rebuild, alerts, fallback walk
└── test/                                # CT-127-*: conformance of EP-12, ledger, ceilings, alerts, pause on a fake clock
tests/parity/127/                        # PT-127-C-007-*, -C-009-*, -C-010-*, -C-012-*, -C-013-* on FX-23
packages/testkit/                        # the conformance suite of EP-12 and its sample classifier, from the test tree
```

**Structure Decision**: the code lives in `@specstride/policy`, which `specs/100-specstride/contracts/data/package-graph.json` names as the L1 package of features 110, 127 and 147. It may import `contracts` and `kernel` only. The engine (`@specstride/core`) reaches it through interfaces of `contracts`.

## Physical choices behind the specification

| Subject | Choice |
|---|---|
| Time | Every module takes `now()` and `sleep(ms)` as ports. The wake of a machine is tested by moving the fake clock forward past `resumeAt` |
| Jitter | A random source port; the test fixes it |
| Ledger write | The kernel's atomic write; the previous generation is a second file written before the rename |
| Rebuild | A replay of the usage records of the event file after the generation of the previous ledger |
| Deduplication | A bounded list of `usageId` in the ledger; the oldest is dropped |
| Pattern matching | Case-insensitive substring; the group order is data; the first group that matches names the signal |
| Alert key | The string `kind:role:threshold` |
| Stop of a pass at a cap | The stop operation of the harness port, polite first (annex C §C.1) |
| Probe | One call through the same harness adapter with the smallest prompt the adapter offers |
| Wall clock | Whole minutes from the engine start, as `over_budget` of the baseline, with time in a pause taken out |

## What is planned elsewhere

| Subject | Where |
|---|---|
| A harness's classifier entries and the `failures` map | 125, 130, 131, 134, 138; 109 |
| The pause of a group of parallel units and the headroom check | 142 |
| The terms data and `evaluate` | 147 |
| The usage and event schemas | 111 |
| The display of budget levels and attention items | 129 |
| Host hooks that show an alert | 113 |
| The engine wiring: where a boundary is tested, how a pass is stopped | 101, 103, 118 |
| The escalation and the model-tier bump that ask for the limit-window state | 115, 101 |
| The stubs and fixtures | 141 |

## Order of construction

| Step | Content | Needs |
|---|---|---|
| 1 | Confirm the captured limit signals of the five adapter features; the conformance suite of EP-12 with a fake harness | Adapters, feature 141 |
| 2 | The wall-clock budget and FX-23 | The engine |
| 3 | The classifier table, patterns, the probe rules | Step 1 |
| 4 | The ledger, counting, deduplication, rebuild | Usage records |
| 5 | Ceilings and hard-cap enforcement | Step 4 |
| 6 | The pause: record, clocks, resume, ceiling, wake | Steps 3, 4 |
| 7 | Alerts and delivery | Steps 4, 5 |
| 8 | The fallback walk | Steps 3, 6, the terms gate |
| 9 | FX-23 and FX-18 under the `parity` profile | Everything above |

## Complexity Tracking

Every check of the Constitution Check passes. Nothing to justify.
