# Repair report — 115-micro-loop-layer

Written by the repair agent of feature 115 on 2026-09-30, from the section "Feature 115" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and from the table "What the other features must
follow" of `specs/100-specstride/repair-report.md`. All paths are relative to
`specs/115-micro-loop-layer/` unless they start with `specs/` or `docs/`. Line numbers are those
of the files after the repair.

Every item was checked against the file before it was changed. No requirement id, task id or
test name was renumbered or reused. Nothing outside `specs/115-micro-loop-layer/` was written.
No model was called and no paid task was run.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-115-01 | repair | medium | done | `spec.md:272` (F115-FR-012), `:716` (logical names), `:887`, `:915`; `plan.md:30` to `:40`, `:48`, `:172` to `:187`; `data-model.md:11`, `:31` to `:43`; `tasks.md` T017, T043, T095, T140; `quickstart.md` scenario 18 | Verified: annex B §B.5 holds `run:<runId>:task-list` (`specs/100-specstride/annexes/B-state.md:254`), written by the engine at launch. The layer reads it and stores nothing under a name of its own. The request for `phase:<N>:tasks-at-launch` is withdrawn. The file `tasks-at-launch.ts` is gone from the plan. New test CT-115-162 |
| W-115-02 | queue (CQ-191) | medium | done | `spec.md:98`, `:377` (F115-FR-034), `:460`, `:497`, `:502` to `:504`, `:586` (IR-47), `:885`; `contracts/router-table.json:68`, `:69`, `:164`, `:181`; `contracts/integrity-rules.json:418`, `:420`; `research.md` D-11; `data-model.md:50`; `plan.md` row IX; `tasks.md` T060, T067, T080, T139; `quickstart.md` scenario 17 | Follows F100-FR-130 as repaired (`specs/100-specstride/annexes/D-pass-loop.md:282`). `targetIsCriticModel` is true only when model and effort are both equal. A rung that shares the model alone is used with the critic-diversity warning. `assumption: CQ-191`. One signal was added to the table that this feature owns: `targetSharesCriticModel`; see "What another feature or the orchestrator must do". New test CT-115-161 |
| W-115-03 | repair | low | done | `analyze-report.md:61` to `:63` | Verified: the three rows gave the old ids. They now give F116-FR-019, F116-FR-007, F116-FR-005, with the old id as a remark. `speckit-analyze` was not run again; a dated section was appended, as the repair prompt asks |
| W-111-02 | repair (pointer) | high | done | `spec.md:264`, `:269`, `:286`, `:322`, `:365`, `:372`, `:377`, `:395`, `:415`, and the new table "Events of the layer", `:506` to `:530`; `plan.md` row XI; `tasks.md` T104, T108, T110 | Verified against `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv` as it stood on 2026-09-30, after feature 111 had added its types: `strategy.selected`, `microloop.inert`, `checkpoint.accepted`, `checkpoint.refused`, `checkpoint.removed`, `check.excluded`, `tripwire.raised`, `tripwire.cleared` are in it (lines 111 to 120). Every fact of F115-FR-037 has a type |
| W-X-01 | repair (pointer) | high | done | `plan.md:30` to `:40`, `:54`, `:58`, `:101` to `:106`, `:150` to `:164`, `:172` to `:188`; `research.md` D-1, D-9; `tasks.md:26` to `:28`, T002, T003, T015, T036, T041, T043, T108, T114 | The package `@specstride/layer-micro-io` is withdrawn. The reading of a checkpoint and the tripwire record stand in two directories of `@specstride/integrity`, behind ports whose interfaces are in `@specstride/contracts`, and write with the atomic write of `@specstride/kernel`. One point is reported: the owner field of the package |
| W-X-02 | repair (pointer) | high | done | `plan.md:163`, `:164`; `tasks.md:26`, T081 | `packages/testkit/src/conformance/EP-06/` and `packages/testkit/src/samples/EP-06/` |
| W-X-04 | repair (pointer) | high | done | `contracts/parity-rows.json` (whole file) | Verified: nine keys had underscores. They now have the spelling of row 65 of annex X §X.7 |
| W-100-14 | repair (pointer) | medium | done | `spec.md:69`, `:75`, `:337`, `:559` (IR-23), `:633` (F115-SC-001), `:802`; `tasks.md:72`, T033; `quickstart.md` scenario 4; `contracts/integrity-rules.json:210`; `contracts/experiments.json:76` | "Pass limit", "pass count", "is given back". "Pass limit" is the one name of the limit. "Iteration" stays in the literals `giveIterationBack` and `MAX_ITER` and in the as-is name of the exempted mechanism |
| W-100-25 | queue (CQ-185, pointer) | medium | done | `plan.md:30` to `:40`, `:58`, row VI, `:172` to `:183`; `research.md` D-1; `tasks.md` T002, T132 | The core package `@specstride/layer-micro` imports neither `node:fs` nor `node:fs/promises`; the static test T132 asserts it |
| W-X-06 | repair (pointer) | medium | done | `spec.md:415` (F115-FR-041) | "In the next engine start" |
| W-X-08 | repair (pointer) | medium | done | `plan.md` row XVIII | Points to the `divergence:` fields of `spec.md` and lists all sixteen rows, DV-011, DV-079, DV-080 and DV-085 included |
| W-X-11 | repair (pointer) | medium | done | `spec.md:319`, `:324`, `:374` (`parity:` lines), `:733` to `:735`; `contracts/parity-rows.json`; `contracts/README.md:11`; `plan.md:60`, `:124`; `research.md` D-7; `tasks.md` T007 | Rows 64 and 65 of annex X §X.7 are cited by number. In the contract file every row has `Row` and `Status: confirmed`; the list `proposed` is gone |
| W-X-12 | repair (pointer) | medium | done | `spec.md:763` to `:769`; `contracts/closed-sets.json` | Rows 136, 137, 138, 139, 140, 141. The worklist names five rows; row 139 (record kinds of the ledger namespace `micro`) exists too (`specs/100-specstride/annexes/X-cross-layer.md:310`) and was written as well. Row 67 now lists the point `attempt-tier` of feature 149, as annex X §X.6 does |
| W-X-14 | repair (pointer) | medium | done | `plan.md` row X, and the closing sentence of the check | Row X is "N/A" with the reason that the feature builds no harness adapter. The count is 17 passes and 3 not applicable |
| W-X-18 | repair (pointer) | medium | done | `spec.md:410` (F115-FR-039), `:417` (F115-FR-041) | `ep: EP-14 specstride.doctor/1 (consumes)` on both; the row of the section "Extension points" stays |
| W-X-24 | repair (pointer) | medium | done | `spec.md:286` (F115-FR-014), `:365` (F115-FR-032), table "Events of the layer" | This feature emits `integrity.noted` for the kinds `ledger-invalid`, `manifest-mismatch` and `pin-mismatch` |
| W-100-16 | repair (pointer) | low | done | `contracts/schemas/checkpoint.schema.json:3`; `contracts/README.md:24` to `:26` | `urn:specstride:schema:specstride.checkpoint/1` |
| W-110-11 | queue (CQ-160, pointer) | low | done | `spec.md:320`, `:326`, `:743` to `:745`; `contracts/parity-rows.json`; `research.md` D-7 | `.proposalMin`, `.unitMin`, `.checkMin`, with `assumption: CQ-160` |
| W-110-12 | repair (pointer) | low | not applied | — | Nothing to change in the specification: `grep -rn 'tier bump' specs/115-micro-loop-layer \| grep -v 'model-tier bump'` found no bare use before the repair. Two labels "tier-bump arm" (`quickstart.md:47`, `contracts/README.md:14`, `contracts/experiments.json:154`) were written out as "the arm for the model-tier bump" all the same |
| W-X-34 | accept (pointer) | low | not applied | — | No change asked (`analyze-report.md:20`) |

Counts: 18 done, 2 not applied, 0 open.

## Requirements added or changed in place

None was added. Changed in place, each listed in `spec.md`, section "Repairs after the
cross-feature review" (`spec.md:919`):

| Requirement | Item | Change |
|---|---|---|
| F115-FR-005 | — | Remark on CQ-080 only |
| F115-FR-010, F115-FR-011 | W-111-02 | Event types named |
| F115-FR-012 | W-115-01 | Reads `run:<runId>:task-list`, stores nothing; test CT-115-162 added |
| F115-FR-014, F115-FR-032 | W-X-24 | `integrity.noted` |
| F115-FR-022, F115-FR-023 | W-X-11, W-110-11, W-111-02 | Row 65; `assumption: CQ-160`; `check.excluded`; an exclusion goes to the builder of the fact block |
| F115-FR-027 | W-100-14 | Pass limit, pass count, given back |
| F115-FR-029 | — | The further fact goes to the builder of the fact block (owner 116) |
| F115-FR-033 | W-X-11, W-111-02 | Row 64; `route.decided` |
| F115-FR-034 | W-115-02 | The target rule; `assumption: CQ-191`; test CT-115-161 added |
| F115-FR-037 | W-111-02, W-X-24 | Types by the table "Events of the layer" |
| F115-FR-039 | W-X-18 | `ep:` line |
| F115-FR-041 | W-X-06, W-111-02, W-X-18 | Engine start; event types; `ep:` line; remark on CQ-083 |
| F115-SC-001 | W-100-14 | Pass limit |

Now: 45 functional requirements, 8 success criteria, 141 tasks (T139 to T141 are new), 5 of them
PAID. The feature stays at 45 requirements, not above.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Orchestrator (feature 100) | The package graph names feature 116 as the only owner of `@specstride/integrity`. By item W-X-01 this feature places two directories there: `packages/integrity/src/checkpoint/` (reading a checkpoint as a claim, F115-FR-010) and `packages/integrity/src/tripwire/` (the tripwire record, F115-FR-041). Recommended: the owner field becomes "116; 115 (checkpoint reading, tripwire record)", and the note of the package names them. If the orchestrator wants the two elsewhere, the plan and eight task paths change and nothing else |
| 116 | Its plan (`specs/116-check-integrity-and-unit-evidence/plan.md`, source tree) does not show the two directories of this feature. No conflict of paths: 116 uses `fingerprint/`, `protected/`, `toolchain/`, `pins/`, `result/`, `factblock/` |
| Orchestrator (feature 100) | This feature added the signal `targetSharesCriticModel` to the shipped router table, which it owns as content of EP-06, so that the critic-diversity warning of an escalation is recorded with the decision. Feature 100 names only `targetIsCriticModel` (annex D §D.4). Nothing in feature 100 has to change; if the orchestrator wants no second signal, the sentence on the warning stays and the signal leaves `spec.md:460`, `:502` and `contracts/router-table.json` |
| 110 | `specs/110-config-and-terms/contracts/config-keys.tsv:59` to `:61` still hold `loop.micro.caps.proposalMinutes`, `.unitMinutes`, `.checkMinutes`. Feature 100 (row 65) and this feature write `proposalMin`, `unitMin`, `checkMin` |
| 111 | F111-FR-012 says that `escalation.skipped` is written for "an escalation whose target had no quota". F115-FR-034 writes it for every skip, with a reason of closed set row 140 (nine members). Recommended: F111-FR-012 says "an escalation that was skipped, with the reason of row 140". Also: `microloop.unit` has the field `layerOff`, which F111-FR-008 fills from row 59 (fallback reasons); the layer also goes off for a spent cap, two unresolved units and an integrity event, which are no fallback reasons. Recommended: `layerOff` takes the cause of the ledger record `disengaged`, and the fallback reason only where one applies |
| 141 | The layer allowlist (`specs/141-parity-oracle/contracts/layer-allowlist.json:10`, `:11`) names the events `loop_strategy_selected` and `micro_inert`, the names of register row DV-016. The catalogue types are `strategy.selected` and `microloop.inert`. The allowlist also needs the logical name `run:<runId>:task-list`, if the engine writes it only with the layer on (CQ-084) |
| Orchestrator | Register row DV-016 names the two events by their old names; the catalogue names are `strategy.selected` and `microloop.inert` |
| Orchestrator | The divergence register holds 117 rows (DV-114 to DV-117 were added on 2026-09-30). `spec.md:868` and `:897` say 113, as feature 100 does (row 40 of its table gives no new count of the register). Not changed here; to be changed with feature 100 |
| Orchestrator | CQ-080 and CQ-083 are open in the queue, and feature 100 already holds their recommended answers (annex X §X.6 row 59 lists `tripwire`; annex B §B.18 draws `kind` from row 141). They can be marked as applied. CQ-084 and CQ-085 name feature 115 in the queue; the owner is 116 for CQ-085 and shared for CQ-084 |
| 112, orchestrator | Task T116 places the doctor checks of the tripwire and of the invariants in `packages/doctor/src/checks/`, a package of feature 112. Feature 116 reports the same point for its own check. Not named by a review item; not changed |

## New questions (each with a recommended answer and its source)

| # | Question | Sources looked at | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | F100-FR-140 (model-tier bump) skips a target equal to a model of a critic-class call whatever the effort; F100-FR-130 (escalation) now needs equal model and equal effort. Experiment X10 and the arm for the model-tier bump compare the two rules. Is ruling 49 read in the same way for both? | `specs/100-specstride/repair-report.md`, "Found while repairing", point 2; rulings 46, 48, 49; F115-FR-035 | Yes, once CQ-191 is answered; it is a point of features 100 and 149, and this feature changes nothing | Nothing changes here: F115-FR-035 keeps the two rules apart |

No requirement of this feature carries a `CQ-pending-*` placeholder.

## Register rows needed (with the text)

None. No requirement cites `DV-new-<n>`.

## Found while repairing

| # | Finding | Evidence | What was done |
|---|---|---|---|
| 1 | The table "Out of scope" gave the model-tier bump to feature 101; rows 24 and 128 of annex X §X.7 name 149 | `specs/100-specstride/annexes/X-cross-layer.md:489`, `:593` | Changed to 149 in `spec.md:48`, `plan.md` and `contracts/experiments.json` |
| 2 | F115-FR-012, F115-FR-023 and F115-FR-029 said that a fact "is in the fact block" or "is given to the critic". The content of the fact block is of feature 116 | `specs/100-specstride/repair-report.md`, row 3 | Reworded: the layer gives the fact to the builder of the fact block |
| 3 | The line "Input" of `spec.md:9` quotes the first description of the feature, which names EP-16, the protected set and the fact block | — | Left: it is a record of the input. The paragraph under "What this feature is" and the table "Out of scope" say that they are of feature 116 |
| 4 | The Constitution Check counted 18 passes and 2 "N/A" | `analyze-report.md:50` | Now 17 and 3; the old sentence of the analyze report is a record and stays |

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | None exists in this feature |
| JSON files of `contracts/` parse | 7 of 7 |
| `python3 docs/ecosystem/check-traceability.py --require-all` | First run: failed with 7 errors, none on this feature (`[d]` register rows DV-114 to DV-117 beyond the 113 expected; `[f]` three differences of `traceability.md`). Last run, after the orchestrator's files had changed: `PASSED: checks a to h`. No line of either output names feature 115 |
| Consistency pass | `analyze-report.md`, section "After the cross-feature review" |
| Greps | No old key spelling, no `layer-micro-io` and no `tasks-at-launch` outside the sentences that record their withdrawal; no bare "tier bump"; no "iteration" as a counted unit |
