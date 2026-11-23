# Implementation Plan: Learning (feature 106)

**Branch**: `106-learning` (a label; the directory is `specs/106-learning`) | **Date**: 2026-09-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/106-learning/spec.md`

## Summary

Feature 106 is the across-runs layer. It computes metrics from events, suggests and applies values
for two allowlisted knobs inside hard bounds, keeps the decision log in its as-is byte format,
evaluates decisions and reverts them on a guardrail breach, binds the decision log into the launch
contract, keeps the learning mode out of the shell's reach in supervised runs, selects the mode from
the request, and writes the retrospective per launch contract hash. It owns the learning writer
domain and no extension point.

| Deliverable | Requirements |
|---|---|
| Allowlist, bounds, invariants | F106-FR-001 to F106-FR-003 |
| Metrics, summary, observation | F106-FR-004 to F106-FR-006 |
| Decision log, entries, modes, resolution, shape | F106-FR-007 to F106-FR-011 |
| Suggestions, floors, apply, revert, off | F106-FR-012 to F106-FR-017 |
| Evaluation, guardrails, quarantine, events | F106-FR-018 to F106-FR-021 |
| The verb `learn`, inputs, exit codes, lines | F106-FR-022 to F106-FR-026 |
| Binding, validation rules, strip, pin, doctor, selection (the verb `learning` of `supervise`) | F106-FR-027 to F106-FR-033 |
| Retrospective (the verb `retro` of `supervise`) | F106-FR-034, F106-FR-035 |
| The layer inside a run, tamper bracket, writer domain, inertness | F106-FR-036 to F106-FR-039 |
| The one ingress for text from outside the runtime | F106-FR-040 |

Approach: a port of `lib/learn.py` (2,221 lines at `9cab15d`), the `learn` branch of the front door,
the learning parts of `orchestrator.sh`, and the learning parts of `bootstrap_contract.py`,
`contract_lib.py`, `runtime.py`, `supervise.py` and `supervisor_lib.py` (`9c88f86`). Nothing is taken
from Lisa: its memory package has no caller and is a different thing. The oracle families FX-01,
FX-29, FX-33, FX-35 and FX-36 are the proof, with five scenarios that this feature adds for what
learning does inside a run and inside a pipeline (`spec.md`, the table of added scenarios). Where the port moves a file (events to the learning stream,
paths to logical names) the comparison is through the layout table and the compatibility projection.

## Technical Context

**Language/Version**: TypeScript 5.x, `strict`, ES modules, Node.js 22 or later

**Primary Dependencies**: `@specstride/contracts` (schemas, closed sets, exit codes, logical names, and validation through the one validator of feature 100 — the JSON Schema validator for draft 2020-12 that feature 100 chose, Ajv, `specs/100-specstride/research.md` D-2; this plan names no validator of its own); `@specstride/kernel` (the atomic write of feature 100; the canonical hasher of feature 104, which is built in `@specstride/kernel` — annex X §X.5 — and of which this feature uses the content hash for the bound prefix; the redactor behind the one ingress — annex X §X.4, F100-FR-205; the process primitive — F100-FR-234 — for the two child processes that the retrospective starts per stage, so that `node:child_process` is not imported). No other runtime dependency. This feature reads no YAML file, so it names no YAML parser; the one parser of the workspace is the npm package `yaml`, a dependency of the configuration loader of feature 110 only (`specs/100-specstride/research.md` D-8). No statistics library: the exact binomial tail and the exact rank test are small functions of this package, tested against reference values computed from the baseline

**Storage**: the learning writer domain of the control plane, by logical name: `feature:<slug>:learning:decisions`, `...:events`, `...:observation:<N>`, `...:summary` (annex B §B.5), and its lock. The retrospective is `pipeline:<pipelineId>:retrospective:<hash>`; this package builds the document and the command writes the file, as the writer that annex B §B.5 names. Reads events, verdicts and verification records by logical name

**Testing**: the Node test runner; the parity oracle (FX-01, FX-29, FX-33, FX-35, FX-36); property tests for bounds, replay and the hash of the prefix; a static test that locks the read sites of learned values; a contention test of the writer domain; a byte test of the decision log against reference captures

**Target Platform**: Linux and macOS (macOS `unverified` until a runner passes the oracle)

**Project Type**: package `@specstride/learning` of the npm workspace, at layer L1 (the package graph of feature 100: layer L1, owner 106, may import `@specstride/contracts` and `@specstride/kernel` only), called by the engine (L4, through the function interface of F100-FR-235), by the verbs `learning` and `retro` of `supervise` (L5) and by the CLI (L6: the command `learn`, and the derivation and the validation of the launch contract). The runtime root calls nothing here. The front door routes the command `learn` to the handler that this package exports

**Performance Goals**: a summary of 100 runs in under 2 seconds on the build runner of feature 100; `resolve` at pass start in under 50 ms with the log opened only under the mode `apply`. Both are budgets of the plan, not requirements of the spec, and no task measures them

**Constraints**: no native module; no paid call in tests; no other option than the mode and its bound; the bytes of the decision log equal the reference's; no write outside the learning writer domain (the file of the retrospective is written by the command, not by this package); no edit of a file of another feature

**Scale/Scope**: 40 functional requirements and 10 success criteria; 197 behaviour items in 29 clusters and 5 as-is requirements carried; fixture families FX-01, FX-29, FX-33, FX-35, FX-36 cited, five scenarios added; 115 test names, ten of them own tests (CT-106-1 to CT-106-10); 88 tasks; no Lisa behaviour is kept

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design: unchanged. Answered against `.specify/memory/constitution.md` v3.0.1 (2026-09-30), read again in the second analyze run of 2026-09-30.*

*Constitution v3.0.1 differs from v3.0.0 by one sentence of Principle IX, the weaker proof (CQ-182); Principle IX is N/A for this feature. The rows I, XI, XIII and XVIII carry the reasons of the second analyze run; no result changed.*

**The gate and the loop (I–V)**

- [x] I. ✅ The decision log, the learning events and the observations are files written atomically or by append under one lock; the retrospective is written by the command through the atomic write of the kernel. Nothing is a watcher or a service. The mode reaches a run through the launch contract, a file
- [x] II. N/A The layer produces no verdict and approves nothing; F106-FR-003 keeps learned values out of everything the critic reads
- [x] III. ✅ Learning reads only events, verdicts' sizes and verification records; it writes nothing the critic can ground on (the learning files are in the control plane, which grounding refuses)
- [x] IV. N/A The phase shape comes from the canonical spec model; learning reads no spec grammar
- [x] V. ✅ A failed observation or evaluation is logged and never undoes an approval (F106-FR-036); a torn line or a missing file is skipped (F106-FR-007)

**The product and its edges (VI–XII)**

- [x] VI. ✅ Strict TypeScript; the entries and the summary are validated against schemas at the boundary; no native module; the extension points are none, named as such in the spec
- [x] VII. ✅ Nothing here names a harness; the harness label of a baseline is read as an opaque text from events
- [x] VIII. N/A No proposer pass is started by this feature
- [x] IX. N/A No critic call is made by this feature
- [x] X. N/A No harness adapter
- [x] XI. ✅ The three event types of the learning stream, and `learning.observed` and `integrity.events_changed` in the run's stream, are `specstride.event/1` events; the as-is lines come from the compatibility projection, at the two places where the baseline writes them; unknowns are null
- [x] XII. ✅ No test calls a paid API; no secret is read or written; there is no model id

**The host skill (XIII–XVII, for features that touch a host skill, the contract or supervision)**

- [x] XIII. ✅ The mode selector is deterministic and the request only selects among accepted options; the comment cannot widen (F106-FR-033); where `apply` is asked and nothing can be bound, the derivation writes `suggest` and says why, so no judgment of a host is needed; only validation promotes the launch contract that holds the binding
- [x] XIV. N/A No verification command is declared or invented here
- [x] XV. ✅ Invocation stays consent: `apply` needs an explicit token or phrase, and no flag switches off a launch check or a cap (F100-FR-174)
- [x] XVI. ✅ The retrospective reads and suggests, and never applies or reverts; it relaunches nothing
- [x] XVII. ✅ The tests are tiered (hermetic, discovery, execution, live) and a missing prerequisite is a skip with its reason, never a pass (task T085); every statement about macOS is `unverified` with the check that would verify it (research.md), until a macOS runner passes
- [x] XX. N/A No work is run in parallel; F106-FR-039 states that parallel and inner events change no observation

**The rewrite (XVIII–XIX)**

- [x] XVIII. ✅ Every carried behaviour has origin, disposition and test; the intended difference of the unknown mode value has register row DV-105 (in `consolidation.md`, written for this feature); micro-loops and continuation are off under the oracle. The second analyze run put four statements back on the baseline code, so that no difference is found as a test failure: the stream of `learning.observed`, the scope of the evaluation after a phase, the variables the runtime strips, and the value in force after a revert. F106-FR-031 (the doctor) carries no as-is behaviour and has no parity test
- [x] XIX. ✅ The verb `learn` prints terse lines; the default output of `learn --show` for one feature stays under 2,000 bytes, measured against the token-budget helper of feature 100 (T086, annex G §G.5); it is not a host skill and adds no resident tool; the doctor check adds one finding line

## Project Structure

### Documentation (this feature)

```text
specs/106-learning/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output: decision-log, learn-verb, binding, mode-selector
├── analyze-report.md    # Output of speckit-analyze (two runs)
├── repair-report.md     # Repairs after the cross-feature review
├── checklists/requirements.md
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
packages/learning/
├── src/
│   ├── knobs.ts            # allowlist, bounds, step cap (F106-FR-001, 002)
│   ├── events-reader.ts    # lenient readers, attribution (F106-FR-004, 007)
│   ├── metrics.ts          # summary, wait calls, kill classes, percentiles (F106-FR-004, 005)
│   ├── observation.ts      # per-phase observation (F106-FR-006)
│   ├── decision-log.ts     # byte format, append, replay, bound (F106-FR-007, 008, 010, 011)
│   ├── suggest.ts          # two suggestion engines (F106-FR-012, 013)
│   ├── apply.ts  revert.ts  off.ts   # F106-FR-014 to 017
│   ├── evaluate.ts         # arms, effect, label, counterfactual (F106-FR-018, 019)
│   ├── guardrails.ts       # states, counts, auto-revert (F106-FR-019)
│   ├── stats.ts            # percentile, exact binomial tail, exact rank test (F106-FR-005, 019)
│   ├── quarantine.ts       # F106-FR-020
│   ├── stream.ts           # the three event types, writer domain, lock, ingress (F106-FR-021, 038, 040)
│   ├── resolve.ts          # value and arm at pass start (F106-FR-010)
│   ├── hooks.ts            # observe, evaluate and the exit report behind F100-FR-235 (F106-FR-036)
│   ├── binding.ts          # configuration.learning, prefix hash, rules (F106-FR-027 to 029)
│   ├── selector.ts         # tokens and phrase table as data; the verb `learning` (F106-FR-032, 033)
│   ├── retro.ts            # retrospective document and lines; the verb `retro` (F106-FR-034, 035)
│   ├── tamper.ts           # bracket: take and check (F106-FR-037)
│   ├── mode.ts             # the closed set and the keys (F106-FR-009)
│   ├── lines.ts            # message texts (F106-FR-026)
│   └── verb.ts             # the verb `learn` (F106-FR-022 to 025)
├── data/
│   └── mode-phrases.json   # refusal, apply and suggest phrases, as data
├── schemas/                # decision entry, summary, observation, advice rows, selector result (T010)
```

Tests live at the root of the repository, in the two directories feature 100 fixes (row 36 of the
table "What the other features must follow"): `tests/parity/106/` and
`tests/characterization/106/`. The own tests of the package (CT-106-*) run in
`tests/characterization/106/`; the read-site and allowlist locks are there too, as static
characterization tests.

```text
tests/
├── parity/106/            # PT-106-*
└── characterization/106/  # CT-106-*, the read-site and allowlist locks, the contention tests
```

**Structure Decision**: one package at layer L1. The engine calls `resolve`, `observe` and `evaluate`
through the plain function interface of the `contracts` package that F100-FR-235 defines and that the
composition root hands to the engine. The read-only report of the last evaluations, which the lines
at exit need, and the two functions of the tamper bracket are offered in the same way; F100-FR-235
does not name them, which is reported to feature 100. The front door routes the command `learn` to
the handler of this package; the derivation and the validation of the launch contract call `binding`;
the verbs `learning` and `retro` of `supervise` call `selector` and `retro`. The runtime root calls
nothing here: it only strips the variables (F106-FR-030). This package edits no file of another
feature, and its only writes are those of the learning writer domain.

## Complexity Tracking

Empty. Every gate is answered ✅ or N/A.
