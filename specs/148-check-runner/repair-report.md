# Repair report — 148-check-runner

Written on 2026-09-30 from the section of feature 148 in
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`. Paths are relative to `specs/148-check-runner/` unless
they start with `specs/` or `docs/`. Every item was checked against the file before a change.
No id was renumbered or reused.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-148-01 | repair | medium | done | `data-model.md` (row "Result"; new section "Mapping to the stored record"); `spec.md` (Key Entities, row "Result"; "Contracts of feature 100 used"; the paragraph of logical names); `plan.md` ("Storage"); `research.md` (D-14); `contracts/README.md` | Verified: `data-model.md:10` gave a second field list for `unit:<unitId>:check:<i>`. The result is now a returned value; the stored record is `specstride.check-result/1` of feature 116; the mapping `commandId` to `id` and `exitCode` to `exit` is stated |
| W-100-02 (pointer) | repair | high | done | `spec.md`, "Out of scope" (row of fingerprints), "Assumptions"; `data-model.md` (row "Fingerprint readings"); `tasks.md` (table of dependencies) | Verified: `spec.md:37` named 115. The row "Inner checks, the closing check and the merge check as decisions: 115; 142" was left: those decisions belong to the loop layers |
| W-111-02 (pointer) | repair | high | done | `spec.md` F148-FR-007, F148-FR-010, F148-FR-012, F148-FR-014, F148-FR-017; `data-model.md` ("Events this feature needs"); `plan.md`; `tasks.md` T017, T026, T035, T037, T040, T049, T051; `quickstart.md`; `contracts/batch-rules.json` | Types named: `check.parallelism_lowered`, `check.admission`, `integrity.noted`. The worklist names the lowering only; two more demands of an event without a named type were found. No requirement of this feature demands an event of the exclusion of a command (`grep -n -i exclu`): the exclusions `slow` and `flaky-excluded` belong to the loop layer |
| W-X-04 (pointer) | repair | high | done | `contracts/parity-rows.json` | `verification.env_allowlist` became `verification.envAllowlist`. `verification.step_runner` and `integrity.gate_fingerprint` are the confirmed spellings of `config-keys.tsv:103`, `:122` and were left |
| W-X-06 (pointer) | repair | medium | done | `spec.md` User Story 5, F148-FR-007, F148-FR-009, F148-FR-016, one clarification; `tasks.md` T039, T053, T056, T058; `quickstart.md`; `research.md` D-5; `contracts/batch-rules.json` | "execution" for one execution of a command. "Run of steps" is kept, because feature 100 names row 235 of annex X §X.6 and F100-FR-100 so; it is defined as never the logical run |
| W-X-07 (pointer) | repair | medium | done | `plan.md` ("Project Type", the source tree, "Structure Decision") | Verified against `package-graph.json`: `@specstride/check-runner`, L1, owner 148 |
| W-X-11 (pointer) | repair | medium | done | `spec.md` F148-FR-002 (`parity:`), "Rows of the `parity` profile"; `contracts/parity-rows.json` (row 125, status `confirmed`; the list `requested` removed); `contracts/README.md`; `tasks.md` T009; `checklists/requirements.md` | — |
| W-X-12 (pointer) | repair | medium | done | `spec.md` "Closed sets"; `contracts/closed-sets.json`; `tasks.md` T008; `plan.md` ("Scale/Scope") | Rows 233, 235, 236. The worklist names two lines (`:394`, `:395`); the third line "new" (reasons of an admission) is row 236. Row 233 has the member `DEADLINE` of feature 105, now named |
| W-105-03, CQ-190 (named by the orchestrator) | queue | medium | done | `spec.md` F148-FR-011, "Assumptions"; `data-model.md`; `plan.md` row XX; `research.md` D-13; `tasks.md` T064; `quickstart.md`; `contracts/batch-rules.json` | `assumption: CQ-190`; new test CT-148-208 |
| CQ-180 | queue | low | open | `spec.md` F148-FR-014, "Assumptions", one clarification; `data-model.md`; `research.md` D-12; `plan.md` row XVI | The question stays open. Its premise was stale: annex E §E.2 has the field `verificationParallelism`. What is open is who writes it when the engine is a child |

Re-verification of 2026-09-30 (second agent): every `done` row above was checked again against the
files. All hold. Line numbers in the worklist had moved for W-X-06 (now `spec.md:127` to `:129`
and `:132`), W-X-07 (`plan.md:43` and `:140` to `:142`), W-X-11 (`spec.md:176` and `:384` to `:388`)
and W-X-12 (`spec.md:390` to `:402`); the changes are in place at the new lines. W-X-11's
dependency W-X-03 is satisfied: every row this feature cites was found in annex X (§X.6 rows 53,
54, 233, 235, 236 at `annexes/X-cross-layer.md:224`, `:225`, `:404`, `:406`, `:407`; §X.7 rows 1,
6, 7, 25, 31, 125 at `:466`, `:471`, `:472`, `:490`, `:496`, `:590`).

## Requirements added or changed in place

No requirement was added and none was renumbered. Changed in place (all dated 2026-09-30, table
"Repairs after the cross-feature review" of `spec.md`):

| Requirement | Item | Change in one line |
|---|---|---|
| F148-FR-002 | W-X-11 | `parity:` names row 125 of annex X §X.7 |
| F148-FR-007 | W-111-02 | The fields of `check.started` and `check.ended` are named as the catalogue spells them |
| F148-FR-009 | W-X-06 | "execution" for one execution of a command; "run of steps" defined as never the logical run |
| F148-FR-010 | W-111-02 | The event type `integrity.noted` with the `kind` `manifest-hash` is named |
| F148-FR-011 | W-105-03 (CQ-190) | Declarations come from the frozen check manifest only and never from repository text; `assumption: CQ-190`; test CT-148-208 added |
| F148-FR-012 | W-111-02 | The event type `check.admission` with its fields is named |
| F148-FR-014 | W-111-02, W-X-06, W-100-02 | The event type `check.parallelism_lowered` with its fields and the field `verificationParallelism` of the run record are named |
| F148-FR-016 | W-X-06 | "executed once more alone" in place of wording around "run" |
| F148-FR-017 | W-111-02 | The fields `batch`, `slot`, `concurrent` are named as the catalogue spells them |

New test name appended: `CT-148-208` (task T064). No task id was reused; T064 was appended.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Feature 111 | Add the event types `check.admission` and `check.parallelism_lowered` to the catalogue with the fields of `data-model.md`, "Events this feature needs"; add the fields `batch` and `slot` to `check.started` and `batch`, `slot`, `concurrent` to `check.ended` (W-111-02) |
| Feature 116 | Nothing new. It owns `specstride.check-result/1`; the mapping of the returned results of 148 to `commands[]` is stated in `data-model.md`, "Mapping to the stored record", and takes the spelling of 116 where they differ. If 116 disagrees with the mapping, 148 follows and the mapping is corrected here |
| Orchestrator | Answer CQ-180 (narrowed: who writes `verificationParallelism` when the engine is a child of the runtime root) and CQ-190, and the standing open questions CQ-153 and CQ-154 |
| Orchestrator | Nothing else: the package, the closed-set rows and the profile row this feature needs exist in feature 100 (the "Next Actions" 1 and 2 of the earlier analyse pass are done — the traceability rows were moved and the check passes) |

## New questions (each with a recommended answer and its source)

None raised by this repair. CQ-180 stays open by design: its premise was stale (annex E §E.2 has
the field `verificationParallelism` since the amendments of feature 100), so the question was
narrowed in `spec.md`, "Assumptions", to who writes the field when the engine is a child of the
runtime root. The specification proceeds on the recommended answer already in the queue (source:
`CLARIFY-QUEUE.md`, row CQ-180): the run record holds the field, and where the engine cannot write
it, a later engine start derives the value from the event `check.parallelism_lowered`.

## Register rows needed (with the text)

None. Every divergence this feature states exists: DV-052, DV-076, DV-080, DV-113. No `DV-new-<n>`
was introduced.

## Checks

| Check | Result |
|---|---|
| Generator or check of this feature in `contracts/tools/` | None exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | Passed: "PASSED: checks a to h". Feature 148: 4 items, 4 kept, "(added 2026-09-29)" |
| Own consistency pass | Done, in `analyze-report.md`, "After the cross-feature review": 18 of 18 functional requirements and 7 of 7 success criteria have tasks; no id renumbered or reused; terms and values equal across `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `quickstart.md`, `research.md` and `contracts/` |
| Counts | 18 functional requirements, 7 success criteria, 64 tasks |
