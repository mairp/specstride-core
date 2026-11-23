# Research: Learning (feature 106)

Phase 0 of `speckit-plan`. It summarizes the research of `docs/ecosystem/research/` and links to it. Nothing here is new research; no paid call was made.

## Decisions

| # | Decision | Rationale | Alternatives considered | Source |
|---|---|---|---|---|
| 1 | Learning is ported unchanged as the across-runs layer; no memory feature | The one layer that exists is numeric, locked and audited; self-built memory did not beat memory-off; Lisa's memory package has no caller | Extract Lisa's memory package (rejected: it mines critic feedback and adds critic addenda, against the rule that nothing learned reaches the critic) | R12 F5, F7, recommendation 3; ruling 17 |
| 2 | The allowlist stays at two knobs | Narrowing the allowlist can never weaken the gate; the third knob was removed at the baseline because nothing was left to switch | Add knobs for breakers or caps (rejected: a breaker must not relax itself) | `learn.py:895-907`; design note §5.5 |
| 3 | The decision log keeps its byte format | The launch contract binds the hash of the log's bytes; a new format would change every bound hash | A typed record with a new file (rejected: breaks the binding and FX-33) | R19 011 FR-003 row; B-2515; brief 106 merge rule |
| 4 | Learning has its own writer domain, lock and event file | The `learn` command writes from a process the consumer starts, possibly while a run is alive; that broke one-writer-per-file | Let `learn` append to the run's event file (rejected: LR-5) | R15v C-7; F100-FR-005 |
| 5 | The mode reaches a supervised run only through the launch contract | The launch contract says what runs; an exported value would change an unattended run | Let the shell win (rejected: baseline strips it) | 011 FR-016; DV-026; R16 F5.8 |
| 6 | A learned value ranks 7th, with the baseline exception for per-phase settings | Keeps today's order: per-phase explicit, then learned, then the verification document, then global | Strict rank 7 for the pass ceiling (rejected: DV-025 keeps the baseline) | R16 F5.6; annex X §X.2 |
| 7 | Evaluation labels by effect against the minimum detectable effect and runs no significance test | At the sample sizes of the corpus a test cannot reach significance; the baseline's Corrections say so | McNemar or Wilcoxon (rejected in the plan's Corrections) | `self-improving-loop-plan.md` Corrections |
| 8 | Guardrail tests are small exact functions in the package | The baseline computes the exact one-sided binomial tail and an exact rank test; a library adds a dependency for two functions | A statistics dependency (rejected: Principle VI, nothing to compile or trust) | `learn.py:1559-1631` |
| 9 | Package `@specstride/learning` at layer L1 | The package graph of feature 100 gives the layer: L1, owner 106, may import `@specstride/contracts` and `@specstride/kernel` only; it is called from the engine, the runtime root, the supervisor and the CLI, all above it | L4 with the engine (rejected: the CLI and the derivation call it without an engine) | `specs/100-specstride/contracts/data/package-graph.json`; annex A §A.1, F100-FR-001 |
| 10 | The phrase table of the mode selector is data | A table is versioned data that is tested; it is the baseline's regular expressions expressed as data | Keep regular expressions in code (kept as the matching form; the members are data) | LR-7 spirit; B-2758 |
| 11 | The retrospective runs `learn` per stage, as the baseline does | It reads only what the command reports; it never opens the decision log. The two commands are child processes started through the process primitive of the kernel | Read the log directly (rejected: a second reader of the byte format) | B-2783; F100-FR-234 |
| 12 | `source_path` of the binding holds the logical name of the decision log | The log lies in the control plane, outside the repository, so a path relative to the repository root does not exist; the layout table maps the as-is path to the logical name | An absolute path (rejected: validation refuses one, and no path of a machine belongs in a launch contract) | `contract_lib.py:516-519` at `9c88f86`; annex B §B.5; DV-006 |
| 13 | The derivation writes `suggest` when `apply` is asked and no decision can be bound, and says why | The baseline tells the host to "use suggest and say so"; a value of the launch contract that rests on a host's judgment is against Principle XIII; validation stays the backstop | Leave the change to the host (rejected); refuse the derivation (rejected: the baseline derives) | `supervise.py:76-79`, `contract_lib.py:500-502` at `9c88f86`; Principle XIII |
| 14 | A projected line of a learning event goes to the as-is place of the baseline: the event file of the feature for the command, the event file of the engine start for a call of the engine | The baseline writes to these two files (B-1260), and the layout table maps both to the learning stream; the one-writer rule forbids the port to write them into the run's stream | One as-is file for every line (rejected: not what the reference holds) | `learn.py:970-979`, `orchestrator.sh:2123-2124` at `9cab15d`; annex X §X.8 |
| 15 | `learning.observed` is an event of the run's stream, written by the engine; the learning stream has three types | The baseline emits it from the engine after a successful observation; the catalogue files it beside the integrity events | Four types in the learning stream (the reading of the repair of 2026-09-30; rejected: it differs from the baseline and from the catalogue) | `orchestrator.sh:2106-2108`; annex X §X.6 row 73 |
| 16 | The scenarios for what learning does inside a run and inside a pipeline are added by this feature to FX-01 and FX-35 | FX-29 has no stub and drives the command `learn` only; a test may claim an item only if its fixture executed the evidence line of the item (feature 141 §O.1 rule 6) | Cite FX-29 for every item (rejected: rule 6); a new family (rejected: a feature adds no family, rule 5) | Feature 141 §O.1, §O.2 |
| 17 | After an approved phase the engine evaluates the decisions of that phase only | The baseline passes the phase to the evaluation; evaluating every decision would append entries that the reference does not hold | Every active decision (the first text of the spec; rejected) | `orchestrator.sh:2123-2124`; B-0325, B-1203 |

## Open readings (marked in the spec)

| Id | Question | Reading |
|---|---|---|
| CQ-113 | Unknown values of the learning mode | `off` (closed 2026-09-30: the recommended answer stands) |
| CQ-114 | Schema id of the retrospective | `specstride.retrospective/1` (settled: annex B §B.20 holds the row, owner 106; closed 2026-09-30) |
| CQ-115 | Who owns the tamper bracket | The engine executes; the rule is in this feature (settled: annex B F100-FR-228; closed 2026-09-30) |
| — | Event types of the learning stream (was `CQ-pending-4`) | The event catalogue holds four types with the prefix `learning.` (annex X §X.6 row 73; catalogue rows 96 to 99); three are of the learning stream, `learning.observed` is of the run's stream (decision 15); the as-is tamper event is `integrity.events_changed`. No question stays open |

## Facts that are `unverified`

| Fact | Check that would verify it |
|---|---|
| Any macOS behaviour of the lock of the writer domain | A macOS runner passes the contention test |
| Byte-identical numbers between the two runtimes (a whole number written with a fraction) | The byte test against reference captures of FX-29 |
| The orders of members of an `evaluate` entry and of the guardrail records, read from the baseline code into `data-model.md` | The capture of task T004 |
| That the oracle can change a state file during a pass on both sides (the scenario `106-learning-tampered`) | The answer of feature 141 to the request of task T088 |

## Links

`docs/ecosystem/research/R12-memory-compression.md`, `R16-doctor-config.md` (F5.6, F5.8), `R15v-architecture-red-team.md` (C-7), `R18-behaviour-inventory.tsv`, `R19-consolidation-map.md`, `R27-run-acceleration-synthesis.md` (IR-06).
