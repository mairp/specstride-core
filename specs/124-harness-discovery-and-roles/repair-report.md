# Repair report — 124-harness-discovery-and-roles

Written by the repair agent of feature 124 on 2026-09-30, from the section "Feature 124" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` (no item of its own, five pointers), the table "What
the other features must follow" of `specs/100-specstride/repair-report.md`, and the follow-up of
feature 141 (`specs/141-parity-oracle/followup-report.md`). Paths are relative to
`specs/124-harness-discovery-and-roles/` unless they start with `specs/` or `docs/`. Line numbers
are those of the files after the repair. Every item was checked against the file before a change.

## The sentence that the other features cite

F124-FR-045 (`spec.md:282`), the one place that states the trigger:

> The critic-diversity rule is: the critic-diversity warning MUST be raised when, and only when,
> the critic and the proposer of a phase resolve to the same model (F100-FR-024), which is the
> result `same-model` of the diversity test of F124-FR-047, or that test gives the result
> `unverified`. A shared provider alone (the result `same-provider`) and a shared model tier alone
> MUST NOT raise it. A higher effort on the same model MUST NOT count as a different model: it is
> allowed, and the warning MUST be raised. The warning has one name, "critic-diversity warning";
> `same-model` is a result of the diversity test and not a name of the warning.

It follows feature 100: F100-FR-024 (the same model) and annex E §E.1 (raised for the results
`same-model` and `unverified`). The record is the field `criticPick` of the resolved registry.

## Items

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-125-01 (pointer) | repair | high | done | `spec.md:282` (F124-FR-045), `:124` (new acceptance scenario 4 of user story 5), `:286` (F124-FR-046 cites the rule); `tasks.md:152` (T036); `quickstart.md`, scenario 4; `contracts/output-lines.json:38` | The worklist says "no change" for the trigger itself. Verified: the trigger was already "the same model". The order of the orchestrator was to state it exactly; the sentence now also says what does not raise the warning, and names the second result `unverified`, which annex E §E.1 and F124-FR-047 already gave. F124-FR-037 stays, with the name of the warning written in full |
| W-100-14 (pointer) | repair | medium | done | `spec.md:198` (F124-FR-029); `tasks.md:69` (T013); `quickstart.md:58` | Verified: one use of "limit of passes", in F124-FR-029. No use of "iteration" as a counted unit in this feature |
| W-115-02 (pointer) | queue, CQ-191 | medium | done, no change of behaviour | — | F124-FR-045 already allowed a higher effort on the same model with the warning. No requirement is marked `assumption: CQ-191`, because nothing here rests on the answer: escalation never changes a role (F124-FR-020) |
| W-X-11 (pointer) | repair | medium | done | `spec.md:196`, `:270`, `:284` (the three `parity:` lines), `:376`, `:389` to `:401` (one table, rows by number), `:527` (assumption on keys); `plan.md:21`, `:45`; `research.md:10`, `:34`; `contracts/parity-rows.json` (the list `requested` is now `rows`, each with `row` and `status: confirmed`; `owned` holds 35, 36, 90, 91, 92); `contracts/config-keys.json` (rows 90, 91, 92, `confirmed`); `contracts/README.md:11`; `contracts/requirements.json` (generated again) | Verified against annex X §X.7 rows 90, 91, 92 (`specs/100-specstride/annexes/X-cross-layer.md:555` to `:557`) and the key list of feature 110 (`config-keys.tsv:36` to `:38`, `:197`). The default of row 92 was "on" here and is `true` in both; it is `true` now |
| W-100-15 (pointer) | repair | low | done | `spec.md:23`, `:121`, `:242`, `:282`, `:286`, `:290`, `:355`, `:368`, `:397`, `:414`; `plan.md:19`, `:57`; `research.md:14`; `data-model.md:30`; `contracts/parity-rows.json` | One use of "same-model warning" is left on purpose: `spec.md:9`, the quoted user description, which is a record of the input. `same-model` stays as a result of the diversity test, in the key `critic.warnSameModel` and in the field `sameModelWarning` |
| Follow-up of feature 141: B-0575 | repair | — | done | `spec.md:380` to `:383`, `:457`; `tasks.md:69` (T013); `research.md:34` | Proved on `FX-18/unknown-harness-name`, a scenario of feature 141. The `fixture:` line of T013 is unchanged, as the follow-up allows |
| Follow-up of feature 141: B-0996 | repair | — | done | `spec.md:380` to `:383`, `:460`; `tasks.md:73` (T014) | Proved on `FX-07/unknown-harness-name`. On the reference the run ends with engine exit 1, `critic_unavailable`; F124-FR-030 (MALFORMED, never a configuration error) agrees |
| Follow-up of feature 141: B-0640 | repair | — | done | `spec.md:145` to `:147`, `:213` (`test:` line of F124-FR-031), `:455`; `tasks.md:77` (T015 no longer proves C-057 and B-0640), `:81` (new task T041, `CT-124-50`, `proves: C-057; B-0640`); `plan.md:136` to `:145` | `PT-124-C-057-usage-list` keeps its name and stays in T015 as a skip with its reason, until a scenario prints the usage text of the pass loop |
| Row 36 of the table of feature 100: place of parity and characterization tests | repair | low | done | `plan.md:136` to `:145`; `tasks.md:20`, T010 to T015, T041; `quickstart.md:20` | Not in the worklist section of this feature. The plan of feature 100 states the rule "for every feature", and this feature had its parity tests inside the package. `CT-124-20` to `CT-124-49` test new behaviour and stay in the package |
| Row 39 and 40 of the table of feature 100 (counts 236 and 131) | — | — | not applied | — | Nothing to change: this feature writes neither count |

Counts: 9 done (5 pointers, 3 points of the follow-up, 1 rule of feature 100), 1 not applied, 0 open.

## Requirements added or changed in place

No requirement was added. Functional requirements: 30 (F124-FR-020 to F124-FR-049). Success
criteria: 5. Tasks: 41 (T041 appended). The list is also in `spec.md`, section "Repairs after the
cross-feature review".

| Requirement | Item | Change |
|---|---|---|
| F124-FR-045 | W-125-01, W-100-15, W-X-11 | The trigger stated exactly; one name; `parity:` names rows 19 and 92 |
| F124-FR-046 | W-100-15 | Cites "the critic-diversity rule of F124-FR-045" |
| F124-FR-047, F124-FR-037 | W-100-15 | The name of the warning written in full |
| F124-FR-029 | W-100-14 | "pass limit" |
| F124-FR-028, F124-FR-042 | W-X-11 | `parity:` names rows 90 and 91 |
| F124-FR-031 | Follow-up of 141 | `test:` names `CT-124-50` |

## What another feature or the orchestrator must do

| Who | What | Why |
|---|---|---|
| 125 | F125-FR-026 and its acceptance scenario (`specs/125-adapter-claude/spec.md:90`, `:341`): cite F100-FR-024 and F124-FR-045; drop "or on the same model tier". Its rule "a model tier that is not known is null and raises the warning" holds only as the result `unverified` of the diversity test, that is when the model itself is not known | W-125-01 |
| 112 | F112-FR-015: `critic.diversity` warns for the results `same-model` and `unverified`, and informs for `same-provider`; a shared model tier is no result of the diversity test and gives no finding of its own | W-125-01 |
| 100 | F100-FR-024 names the first trigger only ("the same model"); annex E §E.1 names both results. One half sentence in F100-FR-024, "or where the diversity test gives `unverified`", would make the two agree. Reported, not edited | Authority rule |
| 111 and 149 | The field `sameModelWarning` (`specs/111-…/contracts/event-catalogue.tsv:85`, `specs/149-…/data-model.md:50`) is true for both results. This feature kept the name. If the orchestrator wants the name to follow the warning, 111 decides and 124 and 149 follow | W-100-15 |
| 111 | The events `roles.resolved`, `critic.passed-over` and `critic.diversity` of `contracts/output-lines.json` are still proposals; the catalogue holds `critic.selected` only | Found while repairing. Closed on 2026-09-30 (re-check B-8.7): `output-lines.json` cites `critic.selected` and `critic.call` and lists the three as not in the catalogue (CQ-211) |
| 110 or 100 | The flag `--no-critic-autopick` is in no annex of feature 100; its status in `contracts/config-keys.json` stays "proposed (R20, R16)". `--resolve-roles` is in annex G §G.1; CQ-106 is still open on the spelling | Found while repairing |
| 103 or 141 | A scenario that prints the usage text of the pass loop would give `PT-124-C-057-usage-list` its entry point | Follow-up of 141, 2.2 |
| Orchestrator | `docs/ecosystem/traceability.md` still names FX-01 for B-0575, B-0640 and B-0996 (rows C-054.g, C-057.b, C-066.l); `traceability-items.tsv` is corrected | Follow-up of 141 |
| Orchestrator | The coverage check fails on files outside this feature: see "Checks" | — |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Where no model is named for a role, the plan records null (F124-FR-027) and the harness uses the model of its own configuration. Is the result of the diversity test then `unverified`, with the warning, also in the default setup of F124-FR-025? | F124-FR-027, F124-FR-047; F125-FR-026 and its clarification; F100-FR-077 (unknown values are null) | Yes where the harness adapter cannot report the model it resolved; no where it reports it, in which case the reported model is compared. The default setup names its two model tiers, so its models are known | If null never gives `unverified`, a run on one model of the harness's own configuration runs without the warning |

## Register rows needed (with the text)

None. DV-104 exists.

## Checks

| Check | Result |
|---|---|
| Generator or check of this feature in `contracts/tools/` | There is none. `contracts/requirements.json` was generated again from `spec.md` by a script in the scratch directory, which first gave the old file byte for byte |
| Every JSON file of `contracts/` parses | Pass |
| `python3 docs/ecosystem/check-traceability.py --require-all` | **FAILED, 7 errors, none on this feature**: four of check d (the register holds DV-114 to DV-117, beyond the 113 rows expected) and three of check f (`traceability.md` against `traceability-items.tsv`: row C-154.b on B-2112, and the counts of section 4.1 for ported and translated). No line of check h names feature 124. The check passed at the start of this repair; the files it fails on were changed by others during it |
| `grep -rn 'same-model warning'` over this feature | One hit, the quoted user description (`spec.md:9`) |
| `grep` for "limit of passes", "new row", "P-3", "P-4", "P-6" as a name of a row | None left, apart from the sentences that say the labels are retired |
| The name of the machine-specific backend | Absent from every file |
