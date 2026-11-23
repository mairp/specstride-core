# Specification Analysis Report: feature 111-event-schema-and-projection (after the split)

Date: 2026-09-29. Group G5 left for `144-compatibility-projection`. Artifacts read: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0. The analysis ran twice, before and after the repairs below.

## Findings

| ID | Category | Severity | Location | Summary | State |
|---|---|---|---|---|---|
| G1 | Terminology | LOW | `spec.md` | Bare "contract", "attempt", "tier" | **Repaired** |
| S1 | Split | LOW | all files | Text and tasks of the projection remained after the split | **Repaired**: removed; `## Requirements moved to 144-compatibility-projection` explains the gap (F111-FR-039 to F111-FR-049, F111-SC-005, F111-SC-006) |
| S2 | Coverage | LOW | `tasks.md` | A task proved success criteria in a `proves:` line, which the coverage script reads as clusters | **Repaired**: `measures:` |
| I1 | Inconsistency | MEDIUM | F100 annex C §C.10 | Content reaches a sink only while capture is on; the accessor of the sink must also serve snippets of the old vocabulary | **Open; reported** (CQ-032) |
| I3 | Inconsistency | LOW | F100 threat T-31 | No chain in the envelope | **Open; reported** (CQ-034) |
| U1 | Underspecification | MEDIUM | `spec.md` | Limits, retention and sink time limit have no row in annex X §X.7 | **Open; reported** (CQ-177) |
| R1 | Register | — | F111-FR-023, F111-FR-029 | The widened pattern set | Row DV-095 |
| K1 | Constitution | — | `plan.md` | Twenty principles answered | No issue. IV, XIV, XV are not applicable |

No finding is CRITICAL or HIGH.

## Checks

| Check | Result |
|---|---|
| Directory | `specs/111-event-schema-and-projection` and `specs/144-compatibility-projection` only |
| Ids | F111-FR-001 to F111-FR-038 and F111-SC-001 to F111-SC-004, F111-SC-007 to F111-SC-009; the gap is explained in the table |
| Requirements | 38; success criteria 7 |
| Tests | Every requirement has `test:` |
| Traceability | Kept rows that remain: C-020 (B-0352) and C-167 (21 items), each in an `origin:` and a `proves:`. The coverage script prints `[h1]` and `[h3]` lines for 002 FR-023, C-007, C-011, C-013, C-022, C-052, C-061 and C-066: they moved to 144 and the orchestrator moves the rows. My own script found each of the 38 items and 002 FR-023 in exactly one of the two parts, in `origin:` and in `proves:` |
| Citations of the sibling | None. Feature 144 is named only in the out-of-scope table and in the table of moved ids |
| Machine-specific backend | Not named |

## What did not pass

Nothing besides the open readings.

## After the cross-feature review

Date: 2026-09-30. Items W-111-01 to W-111-09 and the pointers of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, and six points that the orchestrator passed on from the repairs of features 102, 124, 126, 128 and 142. The detail is in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Catalogue | 124 types (109 before). Fifteen added: ten of the micro-loop layer and the check runner, three of run control, fallback and the terms gate, two of the critic pick | `spec.md`, `data-model.md`, `contracts/event-catalogue.tsv` |
| Fields | `cause` of `data` is `endCause` in `run.ended`, `pass.ended`, `attempt.ended`; six fields added to `tool.call`; `taskId` to `parallel.admission`; `step`, `pathCount` to `parallel.integration`; `sameModelWarning` is `diversityWarning`, with the new field `diversity` | the same |
| Closed sets | End causes of a pass, end causes of a phase attempt, outcomes of a phase; the relation of rows 5 and 96 of annex X §X.6 | `spec.md`, `data-model.md` |
| Free text | Marked for each type, with the ingress class; 71 marks | `data-model.md`, `contracts/event-catalogue.tsv`, F111-FR-016 |
| Requirements | 17 changed in place; F111-FR-050, F111-FR-051, F111-FR-052 added | `spec.md` |
| Packages | `@specstride/observability` and the redactor in `@specstride/kernel`; suite and sample of EP-08 in the test kit | `plan.md`, `tasks.md` |
| Plan | Rows VIII, XVII and XVIII; the two lines of the projection package removed; no core package imports `node:fs` | `plan.md` |
| Tasks | T067 to T075 appended; T028 has its `proves:`; T065 reads rows 44 to 46 | `tasks.md` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. Each of the 41 requirements is named in `tasks.md` |
| Test without a task | None. Every test name of `spec.md` is in a test task |
| Task without a requirement | None. T067 to T075 each carry `proves:` or `covers:` |
| Catalogue against `spec.md` and `data-model.md` | 124 rows; every partner is a type; every type is written in both files; every marked field is a field of its type; no `data` field is named `cause` |
| Counts | 41 requirements, 7 success criteria, 58 tasks, 124 types in `plan.md`, `checklists/requirements.md`, `contracts/README.md`, `data-model.md` |
| Terms | No "same-model warning", no bare "tier bump", no package `events`, no `tests/conformance/` |
| Finding S1 of 2026-09-29 | It said the text of the projection was removed. Three places had remained in `plan.md` (rows VIII and XVIII, two lines of the tree). They are removed now |
| Finding U1 of 2026-09-29 | Closed in the text: rows 44, 45 and 46 of annex X §X.7 exist. CQ-177 stays in the queue until the owner answers |

### What remains open

| Subject | State |
|---|---|
| The three new closed sets have no row in annex X §X.6 | Reported for item W-100-18 of feature 100; closed on 2026-09-30: rows 271, 272, 273 (re-check B-8.7) |
| The fifteen new types have no row in the projection table of feature 144 | Reported |
| The register names two events `loop_strategy_selected` and `micro_inert` (DV-016), and the layer allowlist of feature 141 holds these names as event types | Reported; the catalogue types are `strategy.selected` and `microloop.inert` |
| 41 requirements | Below 45; no split is proposed |

## Second pass after the cross-feature review (2026-09-30)

Items C1 to C10 of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`, section C. Every item was verified
against the current files before a change was made; the premises of C3 and C8 were stale, because the
first pass had already applied what they ask (see `repair-report.md`, same dated section).

### What changed

- C2, done: `check.started` gained `batch` and `slot`, `check.ended` those and `concurrent`
  (`contracts/event-catalogue.tsv`, `data-model.md`, F111-FR-008). The two types `check.admission` and
  `check.parallelism_lowered` were already in the catalogue from the first pass, with the fields of
  148's `data-model.md`.
- C6, done: F111-FR-012 now says `escalation.skipped` is written for every skip, with a reason of
  annex X §X.6 row 140, as the report of feature 115 recommends.
- C8, done as a question: `critic.passed_over` and `critic.diversity` were removed again; the
  catalogue keeps `critic.selected` only among the four proposed types (C8 of the list found them not
  yet in the catalogue; the first pass had added two of them). The id F111-FR-052, the test
  CT-111-152 and the tasks T071 and T072 are retired, never reused. The per-call record of feature
  124 rides `critic.call`, which gained `diversity` and `sameModelWarning`.
- C9, done: the warning field is named `sameModelWarning` again (the first pass had renamed it to
  `diversityWarning`); features 124 and 149 keep `sameModelWarning`, and the catalogue entry says it
  is true for the results `same-model` and `unverified` and for no other.
- C1, C3, C4, C5, C10, not applied: C1 and C3 were already in the catalogue and the requirements from
  the first pass, verified against 102's and 142's data models and annex X §X.6 row 50; C4 needs no
  change here, because F111-FR-015 already states "in `data` only" for the two `parallel.worker.*`
  types (the one sentence that F142-FR-025 needs is delivered in the repair report); C5 needs no
  change, because `by` of `unblocked` is no closed set (F111-FR-009, catalogue mark `by:free-text`);
  C10 finds no `data` field named `cause` left in the files of this feature.
- C7, done: the signal table of feature 129 was checked against the catalogue as it stands now; see
  the repair report.

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a test or a task | None of the 40; F111-FR-052 retired with its test and its two tasks |
| Catalogue against `spec.md` and `data-model.md` | 122 rows; every partner is a type; every type is written in both files; every marked field is a field of its type; no `data` field is named `cause` |
| Counts | 40 requirements, 7 success criteria, 56 tasks, 122 types, consistent in `spec.md`, `plan.md`, `data-model.md`, `checklists/requirements.md`, `contracts/README.md`, `quickstart.md` |
| Terms | `sameModelWarning` in `spec.md`, `data-model.md`, `contracts/event-catalogue.tsv`, `research.md`, `tasks.md`; no `diversityWarning` left outside the historical record of the first pass |
| Pairs | Unchanged; the critic-call pair stays `critic.started` and `critic.call` |

## Analyze run of 2026-09-30 (speckit-analyze)

Artifacts read: `spec.md`, `plan.md`, `tasks.md`, the constitution v3.0.1, `data-model.md`,
`contracts/event-catalogue.tsv` (122 rows), the git history of the split (`4773856`). Read-only in
analysis; the three findings below were repaired in the same round at the consumer's request.

| ID | Category | Severity | Location | Summary | State |
|---|---|---|---|---|---|
| D1 | Constitution | MEDIUM | `plan.md` | The Constitution Check was answered against v3.0.0 and deferred the re-read of Principle IX against the weaker-proof sentence (CQ-182) to this analyze run | **Repaired**: the version line now says v3.0.1, the note records the re-read, and the IX row says why the Pass stands (the weaker proof is an adapter duty, feature 130; this feature ships no critic path) |
| E1 | Coverage | MEDIUM | `spec.md` (F111-SC-009); `tasks.md` | SC-009 was the only success criterion with no task that measures it | **Repaired**: T076 extends the consistency check of T002 and T074 — every requirement names its test, every named test has a `proves:` task |
| F1 | Inconsistency | LOW | `tasks.md` | The task ids T048 to T064 vanished with the split with no note, while `spec.md` explains its own id gap | **Repaired**: a "Retired ids" line beside "Inherited work" |
| A1 | Duplication | LOW | F111-FR-001; F111-FR-020 | The invalid-type drop rule is stated in both | Kept: a deliberate cross-reference of W-111-02 |

No finding is CRITICAL or HIGH. Coverage after the repair: 40 of 40 requirements, 7 of 7 success
criteria, 59 task entries (57 actionable, T071 and T072 tombstones). Counts elsewhere unchanged.
