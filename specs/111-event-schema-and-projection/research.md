# Research: Event schema (feature 111)

Decisions of Phase 0. The decisions on the compatibility projection are in feature 144. Sources stay in `docs/ecosystem/`; this file summarises and links.

| # | Decision | Reason | Source |
|---|---|---|---|
| D-1 | One typed schema is primary | Decision 11; ruling K4; Lisa's mixed file is not kept | `consolidation.md` C-06; R14; R19 C-06 |
| D-2 | The catalogue is R14's, extended by one type for each old event that is a distinct fact | The baseline emits several old lines for one fact (a hard-cap kill gives `pass_killed`, `iter_cap` and `pass_cost_unknown`), and one old name for several facts (`run_stop`) | R14; R18 inventory, 174 event items |
| D-3 | The engine start, not the logical run, is what `run.started` and `run.ended` bracket | Ruling 24 makes the as-is run id the engine start id; feature 100 already uses `run.ended` for a dead predecessor | `APPROVAL.md` ruling 24; F100 annex E §E.2 T4, T9, T15 |
| D-6 | The redactor is one function; the pattern set is data; the baseline set is contained in the widened set | Ruling 43; R11 F-12, R-3 | R11 |
| D-7 | Redact first, cut second, and measure `original_bytes` before redaction | B-2216 | `lib/observability_policy.py` at `9cab15d` |
| D-8 | Delivery statuses are the baseline's four: `attempted`, `accepted`, `failed`, `unknown`; `telemetry.delivery` is local only | Recursion guard of the baseline | `lib/telemetry_delivery.py` at `9cab15d` |
| D-9 | The sink queue is bounded and drops the oldest event of that sink | A dead sink must not grow memory without bound; the primary file is authoritative | R14 O-4; Principle V |
| D-10 | Tamper detection is by `seq` only | The envelope of feature 100 has no `prev` | F100 annex X §X.1; R11 T-31 |
| D-13 | The `data` field of an end is `endCause`; the causes of a pass and of a phase attempt and the outcome of a phase are closed sets | The envelope field `cause` means the link to another event; the projection and the exporter select by the members | R14 (the causes of `pass.ended`); `proposer.sh` at `9cab15d` (`iter_done`, `iter_error`, `iter_cap`, `iter_no_progress`); F101-FR-014; annex X §X.6 rows 5, 10 and 96 |
| D-14 | A fact that a feature must record gets a type of its own, not a `kind` of `integrity.noted` | The writer drops an event without a type; a type has a schema that a test can check | Review finding B-8.2d-006 |
| D-15 | The warning field of `critic.selected` and of `critic.call` is `sameModelWarning` (the name that features 124 and 149 keep), with the result in `diversity` | The field is true for `same-model` and for `unverified`; the warning has one name. Renamed back from the first-pass `diversityWarning` on 2026-09-30 (second pass, item C9) | Feature 100 repair report, row 23; annex X §X.6 row 183; second-pass list C9 |
| D-12 | Retention is a pure decision function; applying it belongs to invocation retention | `apply_retention_sweep` lives in `lib/invocation_result.py` at the baseline | `lib/invocation_result.py` at `9cab15d` |

## Facts that are `unverified`

| Fact | Check |
|---|---|
| Behaviour of the append and of a torn line on macOS | The parity oracle and the conformance suite on a macOS runner |
| The fields that the stream of a harness other than Claude supplies for `usage.reported` | The fixture captures of the adapter features |
| Whether a collector honours the time limit of a sink call | The dead-collector fixture on both platforms |
