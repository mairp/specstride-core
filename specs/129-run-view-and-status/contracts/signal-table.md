# Signal table

The view does not name event types in its reducer. It reads a table of rows `event type -> signal -> what the view holds`. The table is data. The event types are those of the event catalogue (row 73 of annex X §X.6; the catalogue file is `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`, re-read on 2026-10-01 with 123 types). Where a name here and the catalogue differ, the catalogue stands.

## Confirmation with feature 111 (T003)

The table was first built against the catalogue of 2026-09-30, which held 122 types after the second pass of feature 111. On 2026-10-01 the catalogue holds 123. The one type it gained is `critic.citation_unresolved` (F117-FR-015, proposal P1 of feature 117's analyze run; feature 111 records the addition in its `data-model.md`: "123 types. Fourteen types were added on 2026-09-30 … and `critic.citation_unresolved`"). It carries the mark `ignored` below, for the reason feature 117 and feature 144 both give: the event "projects to nothing" and has no as-is equivalent, so no field of the view reads it. Its three siblings `critic.grounding_gap`, `critic.grounding_carried` and `critic.malformed` carry the same mark.

| Confirmed | Against | Result |
|---|---|---|
| Every type of the catalogue has a row or the mark, and no type has both | The catalogue file, by the test of T003 | Holds for all 123 types |
| The critic-class call is opened by `critic.started` and closed by `critic.call` | The columns `kind` and `partner` of the catalogue: `critic.started` is `open` with the partner `critic.call`, `critic.call` is `close` with the partner `critic.started` | Confirmed |
| The retired types `critic.passed_over` and `critic.diversity` are in neither list | The catalogue file (F111-FR-052) | Confirmed: neither is in the catalogue |
| A type the catalogue gains later | Reported here, and caught by the test | One type: `critic.citation_unresolved`, taken into the marked list |

A type the catalogue gains after 2026-10-01 is reported the same way: the test of T003 (`tests/characterization/129/t003-signal-table-coverage.test.ts`) fails with the name of the type, and the type is given a row or the mark. At run time such a type is ignored under rule 3 until then, so the gain never breaks a run.

## Rules

| # | Rule |
|---|---|
| 1 | Every type of the catalogue has a row in "Types the view reads" or the mark `ignored` in "Types marked `ignored`". No type has both |
| 2 | A test of the build (CT-129-5) compares the catalogue with this table and fails when a type of the catalogue, or a type of a fixture log that does not start with `x.`, has neither a row nor the mark. The failure is a failure of the build, never of a run |
| 3 | At run time a type that the table does not hold (a type added to the catalogue after this table was built, a type of a later minor, a type that starts with `x.`) is ignored: it changes no field of the view, it moves the cursor, and it never makes `project`, `reduce`, `status` or `wait` fail (F100-FR-199, F129-FR-005) |
| 4 | A type marked `ignored` is treated at run time as rule 3 says. The mark says that the omission is a decision and not an oversight |
| 5 | A field of an event that the row does not read is ignored |

## Types the view reads

| Event type | Kind in the catalogue | Opens or closes | Signal | The view holds |
|---|---|---|---|---|
| `run.started`, `run.ended` | open, close | run | run start; run end with `endCause` and `causedBy` | Start of the elapsed time; end of the run; `synthesized` |
| `run.launched` | instant |  | launch, reason, counts carried or reset | Launch, engine start ordinal, the counts that survive |
| `run.paused`, `run.resumed` | open, close | pause | pause open and close | State cross-check with the pause record; the timeline |
| `quota.signal` | instant |  | quota signalled | Quota state of the budget row |
| `fallback.switched`, `fallback.restored` | instant |  | billing change | Cost class of later budget rows |
| `alert` | instant |  | alert with kind, level, role, threshold | Level of the budget row; the item `budget-alert` |
| `budget.exceeded` | instant |  | cap exceeded | Level `over` |
| `usage.reported`, `usage.unavailable` | instant |  | spend, tokens; spend unknown | Budget rows |
| `strategy.selected` | instant |  | strategy, level, reason of a fallback | `strategy`; the fallback reason of the group `parallel` |
| `phase.started`, `phase.ended` | open, close | phase | phase open with `title` and `total`; phase end with `outcome` | Current phase; number of phases; `phases[]` title; approved (`outcome` approved) |
| `attempt.started`, `attempt.ended` | open, close | phase attempt | phase attempt open, close, `strategy` | Phase attempt ordinal; strategy |
| `pass.started`, `pass.ended` | open, close | pass | pass open; close with `endCause` | Pass ordinal; lane `proposing`; agent hours |
| `yield.started`, `yield.ended` | open, close | yield | yield open, close | The flag `yielded` of the card; the timeline |
| `evidence.present`, `evidence.written` | instant |  | phase evidence exists | `phases[]`: evidence exists |
| `verification.started`, `verification.ended` | open, close | verification gate | verification open, close | Lane `verifying` |
| `check.started`, `check.ended` | open, close | check | check open, close | Lane `verifying` |
| `job.started`, `job.step`, `job.first_failure`, `job.ended` | open, close, instant | job | job open, step, first failure, close | Lane `verifying`; the timeline |
| `microloop.unit` | instant |  | unit result, `layerOff` reason | Units done; reason a layer is off |
| `critic.selected` | instant |  | critic chosen | The timeline |
| `critic.started`, `critic.call` | open, close | critic call | critic call open (`critic.started`), close (`critic.call`) | Lane `reviewing` |
| `verdict.recorded` | instant |  | verdict | The reject count, the MALFORMED count, `phases[]`: feedback exists, the timeline |
| `blocked`, `unblocked` | open, close | blocked | blocked with reason, question, options; unblocked | The item `blocked-on-human` or `source-changed`; the need |
| `supervisor.observed`, `supervisor.relaunch`, `supervisor.stopped` | instant |  | supervision | Relaunch counts; the timeline |
| `counters.reset` | instant |  | counts reset | The counts |
| `tool.call` | instant |  | latest tool | `activity.latestTool` |
| `stream.mode` | instant |  | observability mode and reason | `activity`: observability mode and reason |
| `stream.missing_terminal`, `stream.diagnostic` | instant |  | diagnostics | The timeline |
| `telemetry.delivery` | instant |  | delivery state | `telemetry[]` |
| `parallel.plan`, `parallel.admission`, `parallel.group.started`, `parallel.group.ended`, `parallel.worker.started`, `parallel.worker.ended`, `parallel.integration` | open, close, instant | group, worker | parallel units | The group `parallel`; worker passes count as passes |

54 types in 29 rows.

Open and close pairs follow F100-FR-200: an event that opens something has an event that closes it, and a pair whose process died is closed by a synthesized event of the next writer. The critic-class call is opened by `critic.started` and closed by `critic.call`. A pair that is still open when the run is `dead` is shown as open in `--json` and counts for nothing in the lane (row L-03 fires first).

## Types marked `ignored`

The view holds nothing from these types. Each is a type of the catalogue.

| Event type | Kind in the catalogue | Mark |
|---|---|---|
| `harness.error` | instant | `ignored` |
| `host.quota_observed` | instant | `ignored` |
| `pipeline.started` | open | `ignored` |
| `pipeline.ended` | close | `ignored` |
| `stage.started` | open | `ignored` |
| `stage.ended` | close | `ignored` |
| `launch.checked` | instant | `ignored` |
| `digest.written` | instant | `ignored` |
| `attempt.archived` | instant | `ignored` |
| `attempt.acceleration_note` | instant | `ignored` |
| `attempt.tier_bumped` | instant | `ignored` |
| `attempt.tier_bump_skipped` | instant | `ignored` |
| `escalation.skipped` | instant | `ignored` |
| `recovery.triggered` | instant | `ignored` |
| `recovery.diagnosis_started` | open | `ignored` |
| `recovery.diagnosis_done` | close | `ignored` |
| `recovery.diagnosis_failed` | close | `ignored` |
| `gate.oscillation` | instant | `ignored` |
| `pass.limits_set` | instant | `ignored` |
| `pass.killed` | instant | `ignored` |
| `pass.short` | instant | `ignored` |
| `pass.halted` | instant | `ignored` |
| `prompt.built` | instant | `ignored` |
| `prompt.block_dropped` | instant | `ignored` |
| `prompt.block_protected` | instant | `ignored` |
| `progress.swept` | instant | `ignored` |
| `commit.made` | instant | `ignored` |
| `plugin.installed` | instant | `ignored` |
| `plugin.install_failed` | instant | `ignored` |
| `plugin.install_denied` | instant | `ignored` |
| `stream.init` | instant | `ignored` |
| `stream.text` | instant | `ignored` |
| `stream.result` | instant | `ignored` |
| `stream.evidence_writing` | instant | `ignored` |
| `verification.release_passed` | instant | `ignored` |
| `verification.prestaged` | instant | `ignored` |
| `yield.waiting` | instant | `ignored` |
| `yield.refused` | instant | `ignored` |
| `resource.wait` | instant | `ignored` |
| `task.planned` | instant | `ignored` |
| `task.ticked` | instant | `ignored` |
| `tasks.ticked` | instant | `ignored` |
| `critic.grounding_gap` | instant | `ignored` |
| `critic.grounding_carried` | instant | `ignored` |
| `critic.malformed` | instant | `ignored` |
| `verdict.adjudicated` | instant | `ignored` |
| `route.decided` | instant | `ignored` |
| `integrity.noted` | instant | `ignored` |
| `integrity.events_changed` | instant | `ignored` |
| `learning.observed` | instant | `ignored` |
| `learning.knob_adjusted` | instant | `ignored` |
| `learning.knob_auto_reverted` | instant | `ignored` |
| `learning.knob_evaluated` | instant | `ignored` |
| `event.dropped` | instant | `ignored` |
| `redaction.commit_blocked` | instant | `ignored` |
| `redaction.dropped` | instant | `ignored` |
| `microloop.inert` | instant | `ignored` |
| `checkpoint.accepted` | instant | `ignored` |
| `checkpoint.refused` | instant | `ignored` |
| `checkpoint.removed` | instant | `ignored` |
| `check.excluded` | instant | `ignored` |
| `check.admission` | instant | `ignored` |
| `check.parallelism_lowered` | instant | `ignored` |
| `tripwire.raised` | instant | `ignored` |
| `tripwire.cleared` | instant | `ignored` |
| `source.change_accepted` | instant | `ignored` |
| `fallback.skipped` | instant | `ignored` |
| `terms.override_used` | instant | `ignored` |
| `critic.citation_unresolved` | instant | `ignored` |
| `x.*` (any type with the prefix) | — | `ignored` |

69 types of the catalogue carry the mark. 54 with a row and 69 with the mark are the 123 types of the catalogue. The types `critic.passed_over` and `critic.diversity` were retired by feature 111 before the catalogue took them (F111-FR-052) and are not listed; an event of either type, should one appear, is ignored under rule 3.

A type that leaves this list and gets a row is an additive change of the view inside the major (F129-FR-007).
