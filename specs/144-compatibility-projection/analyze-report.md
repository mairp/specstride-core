# Specification Analysis Report: feature 144-compatibility-projection

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0. The analysis ran twice.

## Findings

| ID | Category | Severity | Location | Summary | State |
|---|---|---|---|---|---|
| C1 | Coverage | LOW | `tasks.md` | A first version left F144-SC-002 without a test task | **Repaired**: T003 |
| C2 | Coverage | LOW | `spec.md` F144-FR-008 | It kept the cluster C-020, which stays with feature 111 (B-0352) | **Repaired**: origin is B-0166 only |
| I1 | Inconsistency | MEDIUM | F100 annex C §C.10 | Snippets of the old vocabulary while capture is off | **Open; reported** (CQ-032) |
| I2 | Inconsistency | MEDIUM | F100 annex B §B.5 | One `events-legacy` name for a logical run; the baseline has one file for each engine start | **Open; reported** (CQ-033) |
| U1 | Underspecification | LOW | data-model.md | Text of the pipeline lines belongs to 123 and 119 | **Open by design** |
| U2 | Underspecification | LOW | `spec.md` F144-FR-002 | The brief says 62 names; the table has 65 | **Open; reported** (CQ-178) |
| K1 | Constitution | — | `plan.md` | Twenty principles answered | No issue; ten are not applicable, with reasons |

No finding is CRITICAL or HIGH.

## Checks

| Check | Result |
|---|---|
| Ids | F144-FR-001 to F144-FR-011, F144-SC-001, F144-SC-002; the table "Ids before the split" gives the old ids |
| Tests | Every requirement has `test:`; `CT-144-<100+n>`, `PT-144-...`, `CT-144-1` |
| Table | 125 rows; every type of the event catalogue of feature 111 has at least one row (checked by script against `event-catalogue.tsv`); 65 old names are targets and equal the inventory names less five |
| Traceability | 002 FR-023; C-007, C-013, C-022, C-052, C-061, C-066; B-0166: each in an `origin:` and a `proves:` of this feature only |
| Citations of the sibling | None. The catalogue is named through annex X §X.6 row 73 and the sink through annex C §C.10 |
| Machine-specific backend | Not named |

## What did not pass

Nothing besides the open readings.

## After the cross-feature review

Date: 2026-09-30. The repair items W-144-01 to W-144-03 and the pointer items of the worklist were applied; the findings were verified against the files first. Changes:

- W-144-01: the conditions of `yield.ended` now use the members of closed set row 112 of annex X §X.6 (`satisfied`, `timeout`, `stop`, `wall_budget`), owner 118, and a `wall_budget` row that projects to nothing was added. Applied in `contracts/projection-table.tsv` and `data-model.md`.
- W-144-02: `run:<runId>:events-legacy:<k>` with the resolution of the bare name, citing F100-FR-229 and annex B §B.5, in `spec.md` (F144-FR-008, the contracts table), `data-model.md`, `plan.md`, `quickstart.md`. The assumption row of CQ-033 now cites annex B §B.5 (was W-X-10).
- W-144-03: the clause "the sink is skipped when slow" was removed from row V of the Constitution Check. No requirement holds it and F100-FR-104 does not state it; the narrowest reading was removal, not a new requirement.
- W-111-02: new requirement F144-FR-012 (test CT-144-112, task T022) names the fifteen catalogue types that feature 111 added after the split; each has a row that projects to nothing. The table went from 125 to 140 rows and now covers all 110 catalogue types (checked against `event-catalogue.tsv`).
- W-111-04: the field maps of `tool.call` and `pass.halted` now use the field names of the catalogue types (`toolId`, `category`, `argsRef`, `resultRef`, `durationMs`, `ok`; `yields`, `killReason`, `killClass`, `jobPid`, `jobLogRef`).
- W-111-05: the conditions of `attempt.ended` and `pass.ended` select on `endCause` with the members of the closed sets of feature 111; the condition of `phase.ended` names the members of "Outcomes of a phase". The unreachable row "pass.ended cause other" was removed.
- W-X-01: package `sink-projection` replaced by `@specstride/observability` in `packages/observability/` (owners 111, 128, 144), the package the graph of feature 100 names, in `plan.md` and `tasks.md`.
- W-X-09: task T021 (macOS result or skip with its reason) added; row XVII of the Constitution Check answered as a pass with its reason.
- W-X-14: the Constitution Check is now in the form of the plan template: gate line, group headings, `Input` line, cited requirements behind the passes, a `## Complexity Tracking` section.
- W-X-30: the absolute path in research D-5 was replaced by "the Lisa baseline at `363e6a3`".

Consistency pass over `spec.md`, `plan.md`, `tasks.md` for the touched places: every requirement has a test and a task (`T003` for FR-001/002, `T013`/`T022` for FR-009/012, and the parity tasks of the ported rows); every task covers or proves at least one requirement; `run:<runId>:events-legacy:<k>`, the closed-set members and the package name are spelled the same in the five files and the contract. The count of requirements in `plan.md` (12) and in `quickstart.md` matches `spec.md`. No discrepancy remains. The coverage check `check-traceability.py --require-all` passes.

## Analyze run of 2026-09-30 (speckit-analyze)

Artifacts read: `spec.md`, `plan.md`, `tasks.md`, the constitution v3.0.1, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`; checked against feature 100's annexes B and X, feature 141 §O.2 and §O.4, feature 111's `event-catalogue.tsv`, the traceability files, and the Specstride baseline at `9cab15d` (`proposer.sh`, `orchestrator.sh`, `lib/agent_stream.py`, `lib/learn.py`). The repairs were applied in the same round, and the follow-up of the same day resolved the four findings first marked deferred.

| ID | Category | Severity | Location | Summary | State |
|---|---|---|---|---|---|
| I7 | Inconsistency | HIGH | `contracts/projection-table.tsv`, `data-model.md` (rows `tool.call`, `pass.halted`) | The field maps named fields of the catalogue type (`category`, `status`, `argsRef`, `resultRef`, `durationMs`, `ok`; `killReason`, `killClass`, `jobPid`, `jobLogRef`), not the keys of the baseline lines | **Repaired**: the maps name the as-is keys (`tool,target,targets,redacted,truncated,original_bytes,retained_bytes,tool_id`; `yields,max` / `kill_reason,consec` / `subtype,kill_reason,kill_class` / `yield,job_pid,job_log` / `consec`); README check and T011 follow |
| I1 | Inconsistency | MEDIUM | spec US1, F144-SC-001; plan; T010 | "FX-01 to FX-36" while the families run to FX-40 | **Repaired** |
| I2 | Terminology | MEDIUM | F144-FR-002 to F144-FR-005 | "class" for the row shape | **Repaired**: "shape" |
| I3 | Inconsistency | MEDIUM | F144-FR-006; T008 | The alias table holds three of the seven names; no test of C-052 and C-061 by name | **Repaired**; alias rows proposed as P3 |
| U1 | Underspecification | MEDIUM | F144-FR-008 | Where a learning line goes | **Repaired** |
| U2 | Underspecification | MEDIUM | T002; `contracts/README.md` | The table check had no file and read `specs/` | **Repaired** (T002 and README) |
| U3 | Coverage | MEDIUM | F144-FR-008 (B-0166) | `run.log` created empty at each engine start is not carried; annex B has one engine log per run | **Proposed upstream P1**; F144-FR-008, T009, plan and data model follow it |
| U4 | Underspecification | MEDIUM | F144-FR-008 | The learning legacy file has no logical name | **Proposed upstream P2**; F144-FR-008, plan and data model follow it |
| U5 | Coverage | MEDIUM | F144-FR-006 (B-0064) | `SPECSTRIDE_SHIP` neither carried nor recorded | **Proposed upstream P4**; F144-FR-006 hands the name with an empty value under `parity` (DV-065); T008 tests it |
| K1 | Constitution | MEDIUM | plan | No version line; IX not re-read against v3.0.1 | **Repaired** |
| E1 | Coverage | MEDIUM | T005, T013, T017 | `learning` shape, field filter, order by writer class untested | **Repaired** |
| F1 | Task order | MEDIUM | T002, T014, T022 | Order and `[P]` | **Repaired**: Dependencies section |
| A1 | Ambiguity | LOW | F144-FR-002 | Count wording | **Repaired** |
| L1 | Inconsistency | LOW | spec, plan | Register length; DV lists | **Repaired** |
| I4 | Inconsistency | LOW | plan | Paths of the tasks missing from the tree | **Repaired** |
| I5 | Inconsistency | LOW | plan | Dependency on `@specstride/kernel` | **Repaired** |
| I6 | Inconsistency | LOW | T007, T010 | Surfaces and families | **Repaired** |
| P1 | Ambiguity | LOW | plan | "Under 1 ms" has no task | **Accepted**: labelled a starting value of low confidence |
| D1 | Duplication | LOW | F144-FR-012 | Restates FR-002 and FR-009 | **Accepted**: deliberate (W-111-02) |
| A2 | Coverage | LOW | F144-FR-003 (B-2465) | `time` fallback not carried | **Accepted**: N-04 replaces every time field |

## Proposed upstream fixes

Ready to apply by the orchestrator. This feature is already written as if each were applied; none changes a behaviour of another feature.

### P1 — the engine log of each engine start (U3)

- **Target**: `specs/100-specstride/annexes/B-state.md` §B.5, the table of logical names, after the row `run:<runId>:events-legacy:<k>`; and F100-FR-054.
- **Row to add**: a row for the per-start form of `run:<runId>:engine-log` (its name with the suffix `:<k>`, which annex B §B.5 does not hold yet) — root `control`, writer the compatibility projection, readers the CLI and the oracle, content "The engine log of the engine start with the ordinal `<k>`, created empty at that start. `run:<runId>:engine-log` resolves to the file of the newest engine start". The name itself is spelled out only once annex B §B.5 carries it (F100-FR-226).
- **F100-FR-054, sentence to add**: the engine log MUST be written once per engine start, under the per-start form of `run:<runId>:engine-log` (its name with the suffix `:<k>`, which annex B §B.5 does not hold yet), and the bare name MUST resolve to the newest engine start, as for `run:<runId>:events-legacy:<k>` (F100-FR-229).
- **Annex X §X.8, layout table old side, row to change**: the as-is run log of the run directory is carried to the per-start form of `run:<runId>:engine-log` (its name with the suffix `:<k>`, which annex B §B.5 does not hold yet).
- **Why**: at the baseline the run directory is per engine start (`orchestrator.sh:627-629`: `: > "$LOG"; : > "$SPECSTRIDE_EVENTS"` under `runs/<run id>/`), so B-0166 creates both files empty at every start. The same case as CQ-033, which annex B already settled for the event file.

### P2 — the learning legacy file (U4)

- **Target**: `specs/100-specstride/annexes/B-state.md` §B.5, after the row `feature:<slug>:learning:events`; annex X §X.8, layout table old side.
- **Row to add in §B.5**: a row for the legacy form of `feature:<slug>:learning:events` (its name with the suffix `-legacy`, which annex B §B.5 does not hold yet) — root `control`, writer the compatibility projection, readers the oracle and consumers, content "The as-is event file of the feature, where the baseline's `learn` command appends its lines". The name itself is spelled out only once annex B §B.5 carries it (F100-FR-226).
- **Row to add in the layout table**: the as-is event file of the feature directory is carried to `feature:<slug>:learning:events`, compared through the legacy form of `feature:<slug>:learning:events` (its name with the suffix `-legacy`, which annex B §B.5 does not hold yet).
- **Why**: `lib/learn.py:977-978` at `9cab15d` appends to `<feature-dir>/events.jsonl` unless `--events-file` is given (B-1260), and F106-FR-021 says the projection writes there; the file has no logical name, so neither 144 nor the oracle can name it. The form follows the existing row for `<state>/events.jsonl`.

### P3 — alias rows for the event context (I3)

- **Target**: `specs/100-specstride/annexes/X-cross-layer.md` §X.8, environment alias table.
- **Row to add**: `| `SPECSTRIDE_EVENTS`, `SPECSTRIDE_RUN_ID`, `SPECSTRIDE_TASK`, `SPECSTRIDE_TRACE_ID` | No key: the event context of the run (annex C §C.10), handed under these names to every process the runtime starts under the `parity` profile (F144-FR-006, F126-FR-011, F128-FR-017) |`
- **Why**: B-0064 and B-0066 export them to proposer and critic; three features name them as aliases of the table, which lacks them.

### P4 — `SPECSTRIDE_SHIP` (U5)

- **Target**: the same table as P3.
- **Row to add**: `| `SPECSTRIDE_SHIP` | No key: under the `parity` profile the name is handed to every process the runtime starts, with an empty value; nothing reads it, because no shipper program exists (DV-065) and delivery is the exporter of feature 128 |`
- **Why**: B-0064 (assigned to 144, `translated`) exports it; the surface `transcript` compares names of environment variables and never values (feature 141, §O.4 S-07), so handing the name keeps parity without inventing a program. A register row is not needed: DV-065 already records that no interpreter-side shipper exists.
