# Repair report — 111-event-schema-and-projection

Date: 2026-09-30. Every item was checked against the files before a change was made.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-111-01 | repair | high | done | `spec.md:144` (F111-FR-008) | Verified: the text had `keep`, `repair`, `escalate`. Now `kept`, `repair`, `unresolved`, row 136 of annex X §X.6 |
| W-111-02 | repair | high | done | `spec.md:120` (F111-FR-001), `:192` (F111-FR-020), `:280` to `:293` (F111-FR-050 to F111-FR-052), `:355` to `:375` (table of the new types); `data-model.md:206` to `:220`; `contracts/event-catalogue.tsv:111` to `:125`; `tasks.md:152` to `:163` | Verified against F115-FR-005, -009, -010, -011, -020, -023, -037, -041; F102-FR-019, -020, -036; F127-FR-020, -021; F147-FR-006, -009; F148-FR-012, -014; F124-FR-041, -045, -046. Fifteen types, four more than the examples of the worklist: `microloop.inert` (asked by 115), `check.admission` (asked by 148), `critic.passed_over` and `critic.diversity` (asked by 124) |
| W-111-03 | repair | high | done | `contracts/event-catalogue.tsv:105`, `:110`; `data-model.md`; `spec.md:169` (F111-FR-015) | `taskId`; `step`, `pathCount` |
| W-111-04 | repair | medium | done in part | `contracts/event-catalogue.tsv:56`; `data-model.md`; `spec.md:141` (F111-FR-007) | Six fields added to `tool.call`. `pass.halted`: nothing to change here, the type had `yields` already (`event-catalogue.tsv:45`); the row of feature 144 that renders `yield` changes |
| W-111-05 | repair | medium | done | `spec.md:135` (F111-FR-005), `:141` (F111-FR-007), `:152` (F111-FR-010), `:166` (F111-FR-014), `:440` ff. ("Closed sets"); `data-model.md:34` to `:89`; `contracts/event-catalogue.tsv:4`, `:29`, `:41`; `tasks.md` (T073) | The field is `endCause` in all three types that had `cause`, `run.ended` included. The members are under "What another feature or the orchestrator must do" |
| W-111-06 | repair | medium | done | `spec.md:174` (F111-FR-016); `data-model.md:28` to `:32` and the fifth column of the catalogue; `contracts/event-catalogue.tsv` (column `free_text_fields`); `tasks.md` (T026, T074) | 71 marks on 48 types, each with its ingress class. A `reason` that takes a member of a closed set is not marked |
| W-111-07 | repair | medium | done | `plan.md:58`, `:75`, `:104` to `:113` | Verified: the three places were there, against what `analyze-report.md:10` said |
| W-111-08 | repair | low | done | `spec.md:228` (F111-FR-028) | One sentence; ruling 43 untouched |
| W-111-09 | repair | low | done | `spec.md:169` (F111-FR-015) | Says also which holds for `parallel.worker.*` (point 2 of the orchestrator) |
| W-X-01 | repair | high | done | `plan.md:24`, `:32`, `:104` to `:118`; `tasks.md:21` and 45 paths | `@specstride/observability`; the redactor and its pattern sets in `@specstride/kernel`. "The writer and the redactor are core" is dropped |
| W-X-02 | repair | high | done | `plan.md:28`, `:112`, `:113`; `tasks.md:95`, `:100` | `packages/testkit/src/conformance/EP-08/`, `packages/testkit/src/samples/EP-08/` |
| W-100-25 | queue (CQ-185) | medium | done | `plan.md:24`; `tasks.md:21` | No core package imports `node:fs`; the file calls of the writer are in the edge package |
| W-X-05 | repair | medium | done | `spec.md:481` ("Assumptions") | The line "94 rows" is removed; the register is named without a count |
| W-X-08 | repair | medium | done | `plan.md:75` | "the rows in the `divergence:` fields of `spec.md`" |
| W-X-09 | repair | medium | done | `plan.md:30`, `:70`; `tasks.md:168` (T075) | |
| W-X-11 | repair | medium | done | `spec.md:221` to `:233`, `:262` to `:266`, `:433`, `:490` | Rows 44, 45, 46 by number; "Key" in place of "Key (proposed)" |
| W-X-21 | repair | medium | done | `tasks.md:86` | `proves: F111-SC-001` |
| W-110-12 | repair | low | done | `tasks.md:77` | One bare "tier bump", in T024. `spec.md` had none |
| W-X-34 | accept | low | not applied | — | No change is asked |

Counts: 17 done, 1 done in part (W-111-04, the rest is of feature 144), 1 not applied (W-X-34), 0 open.

## Points passed on by the orchestrator

| # | From | Verified against | What was done |
|---|---|---|---|
| 1 | 102 | F102-FR-020, F102-FR-036 | `source.change_accepted` has the fields asked: `file`, `changedRef`, `oldHash`, `newHash`, `acceptedAt`; one event for each file. `by` of `unblocked` is no closed set: text, marked as free text; `operator` for `resume`; `answerRef` may be null (F111-FR-009). No tripwire event is asked of 102 |
| 2 | 142 | F142-FR-025; annex X §X.1 | Fields added. `parallel.worker.started` and `parallel.worker.ended` are events of the main line about a worker: `workerId` in `data`, the envelope fields `workerId` and `wseq` absent. The envelope fields are on the events produced inside the stream of a worker (F111-FR-015). F142-FR-025 does not change |
| 3 | 124 | F124-FR-041, -043, -045 to -048 | `critic.passed_over` and `critic.diversity` added (F111-FR-052). The hyphen of `critic.passed-over` is not allowed in a type name; the underscore is used. `roles.resolved` is **not added**: no requirement of 124 demands an event of role resolution, the facts are recorded in the resolved registry, and `run.started` carries proposer and critic. Field name decided: `diversityWarning`, with the result in the new field `diversity` |
| 4 | 128 | F128-FR-009, `spec.md:471` of 128 | No type `gate` exists or is added. Stated under "Assumptions" |
| 5 | 126 | F126-FR-016; DV-115 | F111-FR-019 says that a dropped event reaches no sink and cites DV-115. F111-FR-034 says that a sink receives the envelope whole |
| 6 | register | `consolidation.md` | Named without a count |

## Event types added and fields changed

All new types are of the kind `instant`, without partner, and project to nothing.

| Type | Change | `data` fields after the change | Sets | Who follows |
|---|---|---|---|---|
| `strategy.selected` | new | `strategy`, `level`, `manifestHashes`, `fallbackReason` | rows 55, 56, 59 of annex X §X.6; `fallbackReason` null when the layer is on | 115, 144, 141 |
| `microloop.inert` | new | `phase`, `attempt` | — | 115, 144, 141 |
| `checkpoint.accepted` | new | `unitId`, `taskIds`, `checkpointRef` | `taskIds` is free text | 115, 144 |
| `checkpoint.refused` | new | `reason`, `bytes` | row 138 | 115, 144 |
| `checkpoint.removed` | new | `bytes` | — | 115, 144 |
| `check.excluded` | new | `checkId`, `reason`, `scope`, `durationMs`, `ruleId` | `reason`: `flaky`, `slow`, `budget`; `scope`: `attempt`, `phase` | 115, 144 |
| `check.admission` | new | `checkId`, `batch`, `slot`, `result`, `reason` | `result`: `admitted`, `refused`; `reason`: row 236 | 148, 144 |
| `check.parallelism_lowered` | new | `from`, `to`, `batch`, `phase`, `attempt`, `reason` | `reason`: a reason of `tainted`, row 53 | 148, 144 |
| `tripwire.raised` | new | `kind`, `ruleId` | row 141 | 115, 144 |
| `tripwire.cleared` | new | `clearedAt` | — | 115, 144 |
| `source.change_accepted` | new | `file`, `changedRef`, `oldHash`, `newHash`, `acceptedAt` | `file`: `spec`, `plan`, `tasks` | 102, 144 |
| `fallback.skipped` | new | `entry`, `entryHarness`, `entryProvider`, `authTier`, `audience`, `reason` | `reason`: `terms-refused`, `no-cap`, `not-in-plan`, `limited` (set of 127) | 127, 147, 144 |
| `terms.override_used` | new | `termsProvider`, `authTier`, `audience` | rows 40, 41 | 147, 144 |
| `critic.passed_over` | new | `candidateHarness`, `candidateModel`, `reason`, `next` | row 182 | 124, 144 |
| `critic.diversity` | new | `result`, `point`, `proposerModel`, `criticModel`, `lineSilenced` | `result`: `same-model`, `unverified` (row 183); `point`: `launch`, `call` | 124, 112, 144 |
| `run.ended` | `cause` renamed | `endCause` in place of `cause` | row 5 when not synthesized, row 96 when synthesized | 101, 102, 122, 128, 129 |
| `pass.ended` | `cause` renamed; closed set | `endCause` in place of `cause` | the ten members below | 103, 118, 127, 128, 129, 144, 106 |
| `attempt.ended` | `cause` renamed; closed set | `endCause` in place of `cause` | the ten members below | 101, 149, 128, 129, 144 |
| `phase.ended` | closed set; no field renamed | `outcome` | the five members below | 101, 129, 144 |
| `microloop.unit` | members of `result` | unchanged | `kept`, `repair`, `unresolved` | 115, 129 |
| `tool.call` | six fields added | `tool`, `toolId`, `status`, `category`, `target`, `targets`, `argsRef`, `resultRef`, `durationMs`, `ok`, `redacted`, `truncated`, `originalBytes`, `retainedBytes` | — | 126, 144, 128 |
| `parallel.admission` | one field added | `groupId`, `taskId`, `check`, `result` | — | 142 |
| `parallel.integration` | two fields added | `groupId`, `step`, `pathCount`, `result`, `refusal` | — | 142, 143 |
| `critic.selected` | one field renamed, one added | `harness`, `model`, `why`, `diversity`, `diversityWarning` | `diversity`: row 183 | 124, 149, 101 |
| every type | new column | free-text fields marked, with the ingress class | — | every emitter of a marked field |

## Requirements added or changed in place

Added: F111-FR-050 (CT-111-150, T067, T068), F111-FR-051 (CT-111-151, T069, T070), F111-FR-052 (CT-111-152, T071, T072).

Changed in place: F111-FR-001, -005, -007, -008, -009, -010, -011, -014, -015, -016, -019, -020, -027, -028, -034, -035. Each is listed in `spec.md`, section "Repairs after the cross-feature review".

Counts now: 41 functional requirements, 7 success criteria, 58 tasks. Below 45; no split.

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Feature 100 (W-100-18) | Append three rows to annex X §X.6, owner 111, closed by design. **End causes of a pass** (`pass.ended`, field `endCause`): `evidence`, `completed`, `yield`, `no_progress`, `error`, `killed`, `hard_cap`, `quota_pause`, `stopped`, `crash`; unknown value read as `error`. **End causes of a phase attempt** (`attempt.ended`, field `endCause`): `approved`, `rejected`, `malformed`, `verification-failed`, `no-evidence`, `budget`, `blocked`, `stopped`, `error`, `crash`; unknown value read as `error`. **Outcomes of a phase** (`phase.ended`, field `outcome`): `approved`, `halted`, `blocked`, `stopped`, `crash`; unknown value read as `halted`. The meaning of each member is in `data-model.md:34` to `:82` |
| 2 | Feature 100 (W-100-18) | State the relation of rows 5 and 96: the field `endCause` of `run.ended` takes row 5 (the `cause` of the terminal record, copied) when the engine start wrote the event, and row 96 when the event is synthesized by the next writer; `crash` means the same in both |
| 3 | Feature 100 | Row 74 of §X.6 is unchanged. Row 73 needs no change. Optional: name `endCause` where an annex names the `data` field `cause` of an event |
| 4 | Feature 144 | Fifteen rows that project to nothing, one for each new type. The conditions of the rows of `pass.ended` and `attempt.ended` select by `endCause`. The row of `iter_done` selects `endCause` `completed` or `yield`; `iter_error` selects `error` or `killed`; `iter_cap` selects `hard_cap`; `iter_no_progress` selects `no_progress`; `evidence`, `quota_pause`, `stopped` and `crash` project to nothing. The row of `pass.halted` renders `yields`. The row of `tool.call` reads the snippets through `argsRef` and `resultRef`, and `is_error` from `ok` |
| 5 | Features 115, 148, 102, 127, 147, 124 | Use the type names and fields of the table above. 115: the marks "To be added" of its table "Events of the layer" become "Yes". 148: the same in `data-model.md:68`, `:69`. 124: `critic.passed_over` with an underscore; no `roles.resolved`; the field is `diversityWarning` (`data-model.md:30` of 124, and its schema `critic-pick.schema.json` if the record is to carry the same name) |
| 6 | Feature 149 | `data-model.md:50`: `diversityWarning` in place of `sameModelWarning`, if the field is the one of the event |
| 7 | Features 127, 128, 129, 101, 102, 103, 106, 118 | Where a text names the `data` field `cause` of `run.ended`, `pass.ended` or `attempt.ended`, the field is `endCause`. 127 writes `quota_pause`, a member. 128: the span status of a pass is an error for `error`, `killed`, `hard_cap` and `crash` |
| 8 | Feature 141 and the orchestrator | Register row DV-016 and `specs/141-parity-oracle/contracts/layer-allowlist.json` name the event types `loop_strategy_selected` and `micro_inert`. The catalogue types are `strategy.selected` and `microloop.inert`. The allowlist must hold the catalogue names, and more than two: all ten types of F111-FR-050 appear in the primary stream with the layer on |
| 9 | Orchestrator | `check-traceability.py` passes. CQ-177 can be closed when the owner confirms rows 44 to 46 |

## New questions (each with a recommended answer and its source)

None that needs the owner. Two choices were made here and are reported, not queued:

| Choice | Made | Source |
|---|---|---|
| The field of the warning on `critic.selected` | `diversityWarning`, because the field is true for `unverified` as well; the key `critic.warnSameModel` keeps its name | Row 23 of the table of feature 100's repair report; report of feature 124 |
| The spelling of the members of the new sets | Members that other features already write keep their spelling (`no_progress`, `hard_cap`, `quota_pause`, `verification-failed`); new members of several words take a hyphen | R14; `projection-table.tsv` of 144; F127-FR-010 |

## Register rows needed (with the text)

None. F111-FR-019 cites DV-115, which exists. F111-FR-052 cites DV-034, F111-FR-051 DV-091 and DV-048, F111-FR-050 DV-016.

## Checks

| Check | Result |
|---|---|
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h. Feature 111: 22 of 22 |
| Generator or check in `contracts/tools/` | The feature has none. The checks of `contracts/README.md` were run by a script in the scratch directory: 124 rows, every partner is a type, every type is in `spec.md` and `data-model.md`, every marked field is a field of its type, no `data` field is named `cause` |
| Requirement without a test or a task | None of 41 |
| Paid probes | None. No task calls a model |
| Other features | None was edited |

## Second pass after the cross-feature review (2026-09-30)

Section C of `docs/ecosystem/reviews/SECOND-PASS-LIST.md` (items C1 to C10). Every item was verified
against the current files first; the premises of C3 and C8 were stale, because the first pass (written
after the reports that asked for them) had already applied what they ask.

| Item | State | Files and lines changed | Note |
|---|---|---|---|
| C1 | not applied (already in place, verified) | — | `source.change_accepted` is in the catalogue (`contracts/event-catalogue.tsv:121`) since the first pass, kind `instant`, no partner, with exactly the fields 102 names: `file` (rows 50 and 135 of annex X §X.6), `changedRef`, `oldHash`, `newHash`, `acceptedAt`. Verified against `specs/102-run-control/data-model.md:45` and F102-FR-020. One event for each file; no text of the source, no count |
| C2 | done | `contracts/event-catalogue.tsv:70`, `:71`; `data-model.md:165`, `:166`; `spec.md` (F111-FR-008, table "Event catalogue") | The two types `check.admission` and `check.parallelism_lowered` were already in the catalogue from the first pass, with the fields of 148's `data-model.md` ("Events this feature needs"). What was missing: `batch` and `slot` on `check.started`; `batch`, `slot`, `concurrent` on `check.ended`. Added in the three places |
| C3 | not applied (already in place, verified) | — | `taskId` on `parallel.admission` and `step`, `pathCount` on `parallel.integration` are in the catalogue (`:105`, `:110`) and in F111-FR-015 since the first pass (W-111-03); verified against `specs/142-parallel-units/spec.md` (F142-FR-025) |
| C4 | done (no change needed here) | — | The catalogue keeps `workerId` in `data` only for the two `parallel.worker.*` types, and F111-FR-015 already states this. The one sentence that F142-FR-025 needs is under "What another feature or the orchestrator must do"; 142 follows this wording |
| C5 | not applied (nothing to state) | — | `by` of `unblocked` is no closed set: the catalogue marks it `by:free-text` and F111-FR-009 says so. There is no closed set for `operator` to be a member of. Feature 102 writes `operator` for every `resume`, which the text of F111-FR-009 already allows |
| C6 | done | `spec.md` (F111-FR-012) | The wording the report of feature 115 recommends: `escalation.skipped` is written for an escalation that was skipped, whatever the reason, with a reason of the closed set annex X §X.6 row 140 (nine members); `quota` when the target had no quota |
| C7 | done | — (129's file was checked, not changed) | T003 is a task of feature 129, not of this feature. `specs/129-run-view-and-status/contracts/signal-table.md` covers the catalogue as it stands now, with two stale rows and a stale count: it still has the rows of `critic.passed_over` and `critic.diversity` (its lines 127 and 128) and says "124 types"; the catalogue holds 122. The gained fields (`batch`, `slot`, `concurrent`) touch no row of the table, which maps types to lanes |
| C8 | question (applied as the recommendation) | `contracts/event-catalogue.tsv` (two rows removed); `data-model.md` (two rows removed, intro); `spec.md` (F111-FR-052 retired, table "Event catalogue", "Types added on 2026-09-30", second-pass section); `tasks.md` (T071, T072 retired); `plan.md`; `quickstart.md`; `checklists/requirements.md`; `contracts/README.md` | The premise of the item was stale: the first pass had already added `critic.passed_over` and `critic.diversity` (W-111-02, from F124-FR-041 to F124-FR-048). The recommendation is applied: the catalogue is the closed list and keeps `critic.selected` only among the four proposed types; `roles.resolved` was never added. So that the per-call record of F124-FR-046 keeps a catalogue event, `critic.call` carries `diversity` and `sameModelWarning`. Reported as a question; the owner decides whether the three types come back (they would be appended) |
| C9 | done | `contracts/event-catalogue.tsv:85`, `:87`; `data-model.md:180`, `:182`; `spec.md` (F111-FR-011, table "Event catalogue", second-pass section); `research.md` (D-15); `tasks.md` (T023) | The name `sameModelWarning` stands (the orchestrator's ruling; features 124 and 149 keep it). The first pass had renamed it `diversityWarning`; that is undone. The catalogue entry and F111-FR-011 state that the field is true for both results of the diversity test, `same-model` and `unverified`, and for no other. No divergence is left: 111, 124 and 149 now hold the same name |
| C10 | not applied (nothing to rename) | — | No file of this feature names a `data` field `cause` any more; the remaining words "cause" in `spec.md` are the envelope field `cause` of annex X §X.1 and the `cause` of the terminal record, both owned elsewhere and both correct. The build check of T073 fails on a `data` field named `cause` |

The first pass had told feature 149 to follow its rename of `sameModelWarning` (first report, item 6).
That instruction is withdrawn: 149 keeps the name, as it already does.

## Requirements added or changed in place

Changed in place on 2026-09-30 (second pass), each also in the dated section of `spec.md`:

| Requirement | Item | What changed |
|---|---|---|
| F111-FR-008 | C2 | `check.started` carries `batch` and `slot`; `check.ended` those and `concurrent` |
| F111-FR-011 | C9; C8 | The warning field is `sameModelWarning`, true only for `same-model` and `unverified`; `critic.call` also carries `diversity` and `sameModelWarning` where the warning was raised |
| F111-FR-012 | C6 | `escalation.skipped` for every skip, with a reason of annex X §X.6 row 140 |
| F111-FR-052 | C8 | Retired with its test CT-111-152 and its tasks T071 and T072; the id is never reused |

No new requirement, no new test, no new task. Counts now: 40 functional requirements, 7 success
criteria, 56 tasks, 122 types.

## What another feature or the orchestrator must do

| # | Feature | What |
|---|---|---|
| 1 | 129 | `contracts/signal-table.md`: remove or mark "not in the catalogue" the rows of `critic.passed_over` and `critic.diversity` (its lines 127 and 128) and change the count "124 types" to 122, with the date. The catalogue lost those two types on 2026-09-30 (second pass, C8); every one of the 122 is otherwise covered |
| 2 | 144 | The row of F144-FR-012 and `contracts/projection-table.tsv`: the list of types that project to nothing loses `critic.diversity` and `critic.passed_over` (fifteen become thirteen). The two rows of the table project to nothing and are harmless, but they name types that no longer exist |
| 3 | 148 | `data-model.md`, "Events this feature needs": the column "State in the catalogue" of `check.admission` and `check.parallelism_lowered` still says "to be added by feature 111"; they are in the catalogue since 2026-09-30, with the fields as asked, and `check.started` and `check.ended` now carry `batch`, `slot` and `concurrent` |
| 4 | 142 | The one sentence that F142-FR-025 needs (W-111-09, item C4), with this wording: "The events `parallel.worker.started` and `parallel.worker.ended` are events of the main line about a worker: they are written by the engine and name the worker in their `data` field `workerId`; the envelope fields `workerId` and `wseq` are absent on them (F111-FR-015). 'Every event of a worker' is an event produced inside the stream of one worker, which must carry both envelope fields." |
| 5 | 124 | The catalogue is the closed list: `critic.selected` only, among `critic.selected`, `roles.resolved`, `critic.passed_over`, `critic.diversity`. The launch record of F124-FR-045 is `critic.selected`; the per-call record of F124-FR-046 is `critic.call`, which carries `diversity` and `sameModelWarning`. The pass-over reasons stay on the announcement line and in the field `criticPick` of the resolved registry. `spec.md:525` of 124 ("The other events this feature needs are named by feature 111") stays true |
| 6 | 149 | Nothing; the earlier instruction to rename `sameModelWarning` is withdrawn |
| 7 | 115 (note) | The same report that asked C6 also asks that `layerOff` of `microloop.unit` take the cause of the ledger record `disengaged` rather than only a fallback reason of row 59. This is outside section C of the second-pass list and was not applied; it needs a line in a later pass |
| 8 | Orchestrator | Annex X §X.6 row 182 (pass-over reasons) is no longer cited by any requirement of this feature; feature 124 still selects it. The orchestrator may leave the row as it is |

## New questions (each with a recommended answer and its source)

| Question | Recommended answer | Source |
|---|---|---|
| Which of the four proposed types of the critic pick stand in the catalogue: `critic.selected` only, or also `roles.resolved`, `critic.passed_over` and `critic.diversity`? | Keep `critic.selected` only, as the catalogue stands after this pass. The launch facts ride `critic.selected`, the per-call warning rides `critic.call`, the pass-over reasons stay on the announcement line and in `criticPick` of the resolved registry. If the owner wants one of the three back, they are appended as new catalogue rows and the projection table of 144 gets rows for them (additive inside the major) | Second-pass list C8; report of feature 124; the catalogue of this feature is the closed list (annex X §X.6 row 73, owner 111) |

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED, checks a to h. Feature 111: 22 of 22 |
| Generator or check in `contracts/tools/` | The feature has none. The checks of `contracts/README.md` were re-run: 122 rows, every partner is a type, every type is in `spec.md` and `data-model.md`, every marked field is a field of its type, no `data` field is named `cause` |
| Requirement without a test or a task | None of the 40; the retired F111-FR-052 left no test or task behind |
| Paid probes | None. No task calls a model |
| Other features | None was edited; 129, 144, 148, 124, 142 and 149 are only reported to |
