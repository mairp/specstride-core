# Repair report — 118-pass-supervision-and-jobs

Date: 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 118", and the table "What the other features must follow" of `specs/100-specstride/repair-report.md`. Every item was checked against the files before a change. Paths are relative to `specs/118-pass-supervision-and-jobs/`.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-118-01 | repair | medium | done | `spec.md` F118-FR-006; `research.md` row 13; `tasks.md` T013 | Verified: the old order was operator override, learned value, `phaseTimeouts`, global ceiling. Now the order of annex X §X.2 and F110-FR-015: an explicit per-phase setting, the learned value, the value declared by the verification-commands document, the role key. `assumption: CQ-158` added |
| W-110-02 | repair | high | done in 118; open for 100 and 110 | `spec.md` F118-FR-025, F118-FR-036, table "Options, switches and configuration keys", section "Repairs after the cross-feature review"; `tasks.md` T008, T078; `research.md` row 15 | Verified at the baseline `9cab15d`: all six variables are read, so none is removed. "proposals" and "(proposed)" dropped. The keys that feature 110 lists are cited from its key table. Feature 110 does not list the six keys or their variables yet (checked in its `spec.md` §K.5, §K.8 and `contracts/config-keys.tsv`); see "What another feature or the orchestrator must do" |
| W-X-03 | repair | high | done | `tasks.md` T009, T074; `spec.md` "Contracts of feature 100 used"; `checklists/requirements.md` | Verified in annex X §X.7: row 50 is `carry.politeStopGraceSec`, row 51 is `verification.failfastGraceSec`; rows 44 and 45 belong to feature 111. `spec.md` already said 50 and 51 |
| W-100-14 | repair | medium | done | `spec.md` acceptance scenario 1 of user story 2, F118-FR-024, F118-FR-025; `research.md` row 12 | "pass limit", "pass count", "the pass is given back", "spends no pass". The literals stay |
| W-100-25 | queue | medium | done | `plan.md` Technical Context, row VI, Structure Decision; `research.md` row 9; `tasks.md` T005, T071 | On the recommended answer of CQ-185: the core imports neither `node:fs` nor `node:fs/promises`; files go through the kernel and the ports of the edge packages |
| W-X-08 | repair | medium | done | `plan.md` row XVIII | The row names "the rows in the `divergence:` fields of `spec.md`" and the complete list of 14 rows |
| W-X-14 | repair | medium | done | `plan.md` gate line, row XVII, Complexity Tracking | v3.0.0 named; row XVII cites the macOS spike of T001 and the skip; the row "None" removed |
| W-X-20 | repair | medium | done | `tasks.md` T013, T014, T016, T017, T018, T040, T041, T042, T059, T075 | Verified: 13 patterns of `test:` lines had no named test in a task, and `PT-118-FX16-long-job` had no task. 13 new test names added to the tasks that hold them; T075 added. No existing test name was changed |
| W-X-21 | repair | medium | done | `tasks.md` T002, T059 | T059 held a test name beside the id; T002 held free text. Both hold ids only |
| W-X-22 | repair | medium | done | `spec.md` section "Threats" | T-25 is the only threat of annex X §X.9 that names feature 118 |
| W-X-23 | repair | medium | done | `spec.md` F118-FR-044 (new), "Contracts of feature 100 used"; `plan.md` row XI; `tasks.md` T076, T077; `data-model.md`; `contracts/supervision-events.md`; `quickstart.md` | The requirement cites F100-FR-009 and F100-FR-205 and not F111-FR-023, because a tier 2 feature cites feature 100 (`STAGE-B-RULES.md` section 5). F111-FR-023 is the same ingress |
| Table of feature 100, row 33 (alias table) | — | — | done | `spec.md` table of options | `loop.watchdogTickSec` and the other keys without "(proposed)" |
| Table of feature 100, rows of closed sets | — | — | done | `spec.md` table "Closed sets"; `research.md` row 3; `data-model.md`; `contracts/yield-predicates.md` | Annex X §X.6 row 10 now says `futility`; rows 112, 113 and 114 exist and are cited. The stale note on annex D §D.6 (fields `stable_sec`, `pid`, `argv`) is removed: the annex holds them |
| Placeholders `CQ-pending-*` | — | — | done | `analyze-report.md`, `checklists/requirements.md` | `spec.md` already held CQ-054 to CQ-058 |
| Paid probes | — | — | done | `tasks.md` T002, Dependencies | T002 is marked paid and is a precondition of no task |

Counts: 11 worklist items done, 0 not applied, 0 open inside feature 118. One item (W-110-02) waits on features 100 and 110.

## Requirements added or changed in place

| Requirement | Kind | Item | Change |
|---|---|---|---|
| F118-FR-006 | changed | W-118-01 | Order of the pass ceiling; `assumption: CQ-158` |
| F118-FR-024 | changed | W-100-14 | Wording "spends no pass of the pass limit", "the pass is given back" |
| F118-FR-025 | changed | W-110-02, W-100-14 | The six keys named with their variables; the failure pattern added to the list; cites the alias table |
| F118-FR-036 | changed | W-110-02 | The three `SPECSTRIDE_FAILURE_*` variables are aliases of keys; an empty pattern reads as unset, as at the baseline |
| F118-FR-031 | changed | — | `parity:` line: no row of annex X §X.7, register row DV-098 (was "row to be written") |
| F118-FR-044 | new | W-X-23 | Text from outside the runtime enters through the one ingress. Test CT-118-10, tasks T076 and T077 |

Now: 44 functional requirements, 6 success criteria, 78 tasks. Under the limit of 45.

## What another feature or the orchestrator must do

### The members of the ending of a yield (for feature 144)

Closed set row 112 of annex X §X.6, owner 118. The members are exactly:

`satisfied`, `timeout`, `stop`, `wall_budget`

An unknown value is read as `timeout`. Feature 144 uses `satisfied`, `timeout` and `stop` in place of `resumed`, `timeout` and `stopped`, and adds a row for `wall_budget` (W-144-01).

### The six keys and the six variables (for features 110 and 100)

All are read by the Specstride baseline at `9cab15d`. None is removed.

| Variable | Evidence at the baseline | Default | Key | Source of the spelling |
|---|---|---|---|---|
| `SPECSTRIDE_YIELD_WAIT_EVERY` | `proposer.sh:1221` (default), `:1542` (the event `yield_wait` every N ticks; 0 disables) | 10 | `loop.yield.waitEvery` | Annex X §X.8: "each of the others the key of the same meaning under `loop.yield.*`" |
| `SPECSTRIDE_YIELD_LOG_HEAD` | `proposer.sh:1223`, `:1570` to `:1573` | 40 | `loop.yield.logHead` | Annex X §X.8, the same row |
| `SPECSTRIDE_YIELD_LOG_TAIL` | `proposer.sh:1224`, `:1570` to `:1576` | 80 | `loop.yield.logTail` | Annex X §X.8, the same row |
| `SPECSTRIDE_FAILURE_LEDGER` | `proposer.sh:1227`, `:1584` (must be exactly `true`) | `true` | `loop.yield.failureLedger` | W-110-02; annex X §X.8 has no row for it |
| `SPECSTRIDE_FAILURE_LEDGER_MAX` | `proposer.sh:1228`, `:1588` (passed as `--max`) | 150 | `loop.yield.failureLedgerMax` | W-110-02; no row in annex X §X.8 |
| `SPECSTRIDE_FAILURE_PATTERN` | `lib/failure_ledger.py:102` (default of `--pattern`; an empty value reads as unset) | the default pattern of F118-FR-037 | `loop.yield.failurePattern` | W-110-02; no row in annex X §X.8 |

| Who | What |
|---|---|
| Feature 110 | Add the six keys to §K.5 and to `contracts/config-keys.tsv` (owner 118, neutral, snapshot class `t`, under `parity` "as default"), and the six variables by name to §K.8. Until then an unknown key refuses the launch (F100-FR-203) and F110-FR-020 is not met for these variables |
| Feature 100 | Add a row to the alias table of annex X §X.8 for `SPECSTRIDE_FAILURE_LEDGER`, `SPECSTRIDE_FAILURE_LEDGER_MAX` and `SPECSTRIDE_FAILURE_PATTERN`: the row of `SPECSTRIDE_YIELD_*` does not cover them by name. If feature 100 or 110 prefers another prefix than `loop.yield.*` for the three, feature 118 follows the spelling of feature 110 |
| Feature 144 | The four members above |
| Feature 111 | Still requested from the first round: type names in the catalogue for the stop of a job and for the steps of the end of a pass (`contracts/supervision-events.md`) |
| Orchestrator | None of the repairs needs a register row. CQ-054 to CQ-058 stay open |

### Noted, no action asked

W-X-23 tells every feature to cite F111-FR-023. Feature 118 cites F100-FR-009 and F100-FR-205, the contract of feature 100 for the same ingress.

## New questions (each with a recommended answer and its source)

None.

## Register rows needed (with the text)

None. DV-098 exists in `docs/ecosystem/consolidation.md`.

## Requests handed to the other features (phase 8, 2026-10-05, task T074)

The requests of this report are restated where they must land, with the one
addition this phase brings (`job.resource`). Every one is also visible in the
table "What another feature or the orchestrator must do" above.

| To | Request | Source in this feature |
|---|---|---|
| 111 | Type names in the catalogue for the five new events `job.started`, `job.step`, `job.first_failure`, `job.ended` (field `msAfterFirstFailure`) and `resource.wait` (`resource`, `holder`, `ms`), and for the stop of a job and the steps of the end of a pass. They are requested from the catalogue, not invented here | `contracts/supervision-events.md`; `packages/core/src/pass-supervision/failfast/events.ts` (`JOB_EVENT_TYPES`) |
| 100 | The optional field `job.resource` of CQ-057: the yield schema `specstride-pass-yield/v1` grows the optional field in a later minor, so that a job may declare the exclusive resource it needs. Until the field exists, `resource.wait` is emitted only for resources declared out of band | `data-model.md` (yield artifact); CQ-057; `packages/core/src/pass-supervision/failfast/resources.ts` (`resourcesForTheDoctor`) |
| 100 and 110 | The six keys `loop.yield.waitEvery` (10), `.logHead` (40), `.logTail` (80), `.failureLedger` (`true`), `.failureLedgerMax` (150), `.failurePattern` (the default pattern of F118-FR-037) with their variables `SPECSTRIDE_YIELD_WAIT_EVERY`, `SPECSTRIDE_YIELD_LOG_HEAD`, `SPECSTRIDE_YIELD_LOG_TAIL`, `SPECSTRIDE_FAILURE_LEDGER`, `SPECSTRIDE_FAILURE_LEDGER_MAX`, `SPECSTRIDE_FAILURE_PATTERN`, as in the table "The six keys and the six variables" above | `packages/core/src/pass-supervision/yield/settings.ts` |

Confirmed present in annex X (checked 2026-10-05,
`specs/100-specstride/annexes/X-cross-layer.md`):

- §X.6 closed-set rows 112 (`satisfied`, `timeout`, `stop`, `wall_budget`),
  113 (`polite`, `terminate`, `kill`) and 114 (0 satisfied, 1 not yet,
  2 cannot be satisfied), owner 118 — lines 286 to 288.
- §X.7 profile rows 50 (`carry.politeStopGraceSec`, default 10) and 51
  (`verification.failfastGraceSec`, default 10), owner 118.

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h; feature 118: 181 of 181 items |
| Test names of `test:` lines against `tasks.md` | Every name and every pattern has a named test in a task |
| `proves:` lines | Ids only |
| Stale terms (`iteration`, rows 44 and 45, `CQ-pending`, "(proposed)") | None left in the requirements, plan or tasks; the analyze report of 2026-09-29 keeps its finding 3 as a record |
