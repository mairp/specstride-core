# Repair report: feature 144-compatibility-projection

Date: 2026-09-30. Agent of act B-8.6c, feature 144. Worked from the section "Feature 144" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`, with its three own items and its eight pointer items.
Every finding was verified against the files before it was applied; deviations from the worklist
are marked below.

## The items

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-144-01 | repair | high | done | `contracts/projection-table.tsv` (rows of `yield.ended`); `data-model.md` (same rows) | Verified: row 112 of annex X §X.6 (`specs/100-specstride/annexes/X-cross-layer.md`, "112 Outcomes of a wait on a yield") and `specs/118-pass-supervision-and-jobs/spec.md` §Closed sets give `satisfied`, `timeout`, `stop`, `wall_budget`. Conditions renamed; a `wall_budget` row that projects to nothing was added. The table has 140 rows |
| W-144-02 | repair | medium | done | `spec.md` (F144-FR-008; the table "Contracts of feature 100 used"; the assumption row of CQ-033); `data-model.md` (Projection file); `plan.md` (Storage); `quickstart.md` step 3 | Verified: annex B §B.5 holds `run:<runId>:events-legacy:<k>` and the resolution of the bare name; F100-FR-229 states it. Cited. The assumption row of CQ-033 now cites annex B §B.5 in place of "to be added" (this also closes W-X-10 for this feature) |
| W-144-03 | repair | low | done | `plan.md` (row V of the Constitution Check) | Verified: no requirement of `spec.md` holds "the sink is skipped when slow" and F100-FR-104 (`specs/100-specstride/annexes/C-ports-and-edges.md`) does not state it. The clause was removed, which the item allows as its first option; no new requirement was invented |
| W-111-02 (pointer) | repair | high | done | `spec.md` (new F144-FR-012); `contracts/projection-table.tsv` (15 rows); `data-model.md` (15 rows); `tasks.md` (T013, T014, T022) | Verified by diffing the table against `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`: fifteen catalogue types had no row (`check.admission`, `check.excluded`, `check.parallelism_lowered`, `checkpoint.accepted`, `checkpoint.refused`, `checkpoint.removed`, `critic.diversity`, `critic.passed_over`, `fallback.skipped`, `microloop.inert`, `source.change_accepted`, `strategy.selected`, `terms.override_used`, `tripwire.raised`, `tripwire.cleared`). One row each that projects to nothing, named in F144-FR-012, test CT-144-112, task T022 |
| W-X-01 (pointer) | repair | high | done | `plan.md` (Project Type; Project Structure); `tasks.md` (T001, 11 paths) | The package graph of feature 100 names `@specstride/observability` (layer L1, owners 111, 128, 144). Package name and all task paths changed to `packages/observability/`. Shared package: the projection is an additional part of it, beside the parts of 111 and 128 |
| W-111-04 (pointer) | repair | medium | done | `contracts/projection-table.tsv` (rows of `tool.call`, `pass.halted`); `data-model.md` (same rows) | Settled against `event-catalogue.tsv`: `tool.call` carries `tool`, `toolId`, `status`, `category`, `target`, `targets`, `argsRef`, `resultRef`, `durationMs`, `ok` and the four marks — the row now renders those names (it named `summary`, `result_summary`, `is_error`, `duration_ms`, which the type does not have); `pass.halted` carries `yields` (not `yield`), `killReason`, `killClass`, `jobPid`, `jobLogRef` |
| W-111-05 (pointer) | repair | medium | done | `contracts/projection-table.tsv` (rows of `attempt.ended`, `pass.ended`, `phase.ended`); `data-model.md` (same rows) | Conditions select on `endCause` with the members of the closed sets "End causes of a phase attempt" and "End causes of a pass", and on `outcome` with the members of "Outcomes of a phase" (`specs/111-event-schema-and-projection/spec.md`, "Closed sets"). The row "pass.ended cause other" became unreachable once the ten members were distributed and was removed. Note: feature 111 states that the members with an underscore keep their spelling, so `hard_cap` and `no_progress` stay as the worklist expected |
| W-X-09 (pointer) | repair | medium | done | `plan.md` (row XVII); `tasks.md` (T021) | T021 runs the parity suite on macOS or records the skip with its reason (ruling 67); row XVII is answered as a pass with the reason and names T021 |
| W-X-10 (pointer) | repair | medium | done | `spec.md` (the assumption row of CQ-033) | Closed together with W-144-02; see above |
| W-X-14 (pointer) | repair | medium | done | `plan.md` (Constitution Check) | Now in the form of the plan template: the `Input` line, the gate line, the three group headings, the requirement cited behind each pass and each not-applicable answer that cites one, and a `## Complexity Tracking` section with the statement that no deviation exists |
| W-X-30 (pointer) | repair | low | done | `research.md` (D-5) | The absolute path was replaced by "the Lisa baseline at `363e6a3`" (and the Specstride baseline was never named by path here) |

No own item and no pointer item was found wrong or already done; all were applied as verified above.

## Requirements added or changed in place

| Requirement | Change | Item |
|---|---|---|
| F144-FR-008 | Changed in place: the logical name is `run:<runId>:events-legacy:<k>`, the bare name resolves to the newest engine start, F100-FR-229 and annex B §B.5 cited | W-144-02 |
| F144-FR-012 | New: a row that projects to nothing for each of the fifteen catalogue types added after the split, named one by one; test CT-144-112; `parity: no new line (row 19 of annex X §X.7)` | W-111-02 |

Section "Repairs after the cross-feature review" (dated 2026-09-30), with the item ids and the
lines above, is in `spec.md` after the table "Ids before the split".

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Feature 111 | None. The fifteen types were read from its `event-catalogue.tsv`; its closed sets were adopted as they stand. No contract of 111 was contradicted |
| Feature 123 | None. The `[MOL-*]` line texts stay with 123, as `spec.md` already says |
| Feature 118 | None. Row 112 of annex X §X.6 was adopted as it stands |
| Feature 100 | Nothing contradicted. One remark: the field maps of the projection table that the items did not name (for example the rows of `yield.ended`, `stream.result`, `pass.ended`) still write the catalogue fields in the snake_case of the old vocabulary (`waited_sec`, `job_rc`, `cost_usd`). They are the names the old line carries, so they were left; if feature 111 or a review wants the catalogue spelling on every row, that is a further pass over the table |
| Orchestrator | Commit the changed files; no register row is needed |

## New questions (each with a recommended answer and its source)

None raised. CQ-032 stays open for the queue; this feature proceeds on the recommended answer
recorded in `spec.md` ("Assumptions"). CQ-033 is answered and applied (annex B §B.5); its row in
`spec.md` records the applied answer. CQ-178 stays open as recorded; no change was asked.

## Register rows needed (with the text)

None. The divergences the feature cites (DV-006, DV-007, DV-016, DV-027, DV-037, DV-050, DV-067,
DV-074, DV-079, DV-083, DV-088) all exist; no `DV-new-<n>` was introduced.

## Checks

| Check | Result |
|---|---|
| Generator or check of the feature in `contracts/tools/` | None exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED (checks a to h). Feature 144: 16 items assigned, 16 kept, none unplaced |
| Table against the catalogue | All 110 types of `event-catalogue.tsv` have at least one row; 140 rows; 65 carried old names are targets (unchanged) |
| Requirement and task coverage | 12 requirements, each with `test:`; every test name appears in a task with `proves:` or `covers:`; every task covers or proves at least one requirement |
| Size | 12 functional requirements and 2 success criteria; below the split threshold of 45; no split |
| Terms | "engine start" where one start of the engine is meant; the machine-specific backend is not named; no absolute path of the owner's machines remains (`grep` over the feature directory) |
| Git | No git command that changes the repository was run; the source repositories were read through the documented baselines only |
