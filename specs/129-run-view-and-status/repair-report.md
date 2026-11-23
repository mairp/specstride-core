# Repair report — 129-run-view-and-status

Dated 2026-09-30. Written by the repair agent of act B-8.6c, from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 129" (with the list "Items owned elsewhere that change files of feature 129"), and the table "What the other features must follow" of `specs/100-specstride/repair-report.md`. No row of that table contradicts an item below. A previous agent was cut off after it had rebuilt `contracts/signal-table.md` (committed in `80394a0`) and opened the item table; the rebuild was verified and kept, and the items were finished from there.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-129-01 | repair | medium | done | `contracts/signal-table.md` (rebuilt, committed in `80394a0`); `tasks.md:31` (T003) | Verified against the catalogue of feature 111: 124 types as read on 2026-09-30; 54 types in 29 rows, 70 marked `ignored`; `critic.started` opens and `critic.call` closes the critic-call pair. The rebuilt table kept. T003 rewritten: it no longer names as missing what the catalogue holds |
| W-X-11 | repair | medium | done | `spec.md:205`, `:332` (parity lines), `:360` (F129-FR-034), `:269` (F129-FR-017), `:364` (F129-FR-035), `:408` to `:421` (closed sets), `:443` to `:447` (contracts table); `tasks.md:40` (T007), `:193` (T076), `:206` (T083) | Row 127 of annex X §X.7 cited for `status.precompute`; closed-set rows 243 to 250 of annex X §X.6 cited. Three places beyond the worklist's three carried the same fault (F129-FR-017, F129-FR-035, the lane-table row of "Closed sets") and were fixed under the same rule |
| W-X-14 | repair | medium | not applied (already done) | — | `plan.md:33` to `:65` is already in the form of the plan template: the *GATE* line, the four group headings, a `[x]` mark and a one-line reason with a requirement citation per gate, `Complexity Tracking` at `plan.md:122`. The file is unchanged since its first commit `fbf1024`; the reviewed text already carried the marks. Every reason bears on its principle |
| W-X-19 | repair | medium | done | `spec.md:310` (F129-FR-024), `:340` (F129-FR-029), `:455` (EP-01 row of "Extension points") | For EP-01 the feature writes `consumes`, per the `ep:` row of `STAGE-B-RULES.md` updated 2026-09-30 (W-ORC-06 applied). A second `ep: EP-01 (implements)` at `:340`, not listed in the worklist, carried the same fault and was fixed. The feature registers no doctor check, so `implements (an entry)` appears nowhere. The other `ep:` lines are EP-09, which this feature owns, and stay `implements` |
| W-X-25 | repair | medium | done | `spec.md:331` (F129-FR-028), `:444` (row "Logical names"); `plan.md:17`; `data-model.md:60`; `contracts/status-line.md:33` | F129-FR-028 names the pointer `workspace:current:status-line` of annex B §B.5 (F100-FR-229); the row is repeated in the artifacts that state the writer |
| W-X-33 | repair | medium | done | `spec.md:312` (F129-FR-025); `spec.md:455` (EP-01 row) | F129-FR-025 cites annex G §G.2 (output modes) and §G.10 (presenter interface) of feature 100 in place of "the lines of feature 119". The feature-boundary table at `spec.md:34` and the prose of `plan.md:64` and `quickstart.md:15` name 119 outside a requirement line and were left |

State: 5 done, 1 not applied (W-X-14, already done), 0 open. 6 items owned in total (1 own, 5 pointers).

## Requirements added or changed in place

No requirement was added; none was renumbered. Changed in place, listed in `spec.md` in the section "Repairs after the cross-feature review" (dated 2026-09-30): F129-FR-008, F129-FR-017, F129-FR-024, F129-FR-025, F129-FR-028, F129-FR-029, F129-FR-034, F129-FR-035. The count stays 36 functional requirements and 9 success criteria; tasks stay 83, tests stay CT-129-1 to CT-129-45. T003 of `tasks.md` was rewritten in place.

## What another feature or the orchestrator must do

- Feature 111: run T003 — confirm that the rebuilt `contracts/signal-table.md` covers the catalogue, and report any type the catalogue gains (an additive change inside the major).
- Feature 113 (or the owner of the host hook shim): the shim finds the line through `workspace:current:status-line` (annex B §B.5, F100-FR-229), as W-X-25 now says in F129-FR-028.
- Feature 119: nothing changes for it; its compatibility output is consumed through annex G §G.2 and §G.10, and its rendering is compared on FX-28 (F129-SC-009) as before.
- The orchestrator: commit the six changed files; no register row is needed.
- W-129-01's dependency W-111-02 (events without a catalogue type) concerns feature 111; the table here proceeds on the catalogue as it stands on 2026-09-30.

## New questions (each with a recommended answer and its source)

None new. No `CQ-pending-*` placeholder remains in the feature. The open questions of the feature keep their CQ numbers (CQ-161 to CQ-170); CQ-182 to CQ-195 change nothing here, and the specs proceed on the recommended answers.

## Register rows needed (with the text)

None. The divergences of the feature (DV-018, DV-033, DV-034) exist; no new row is cited.

## Checks

| Check | Result |
|---|---|
| `contracts/tools/` of this feature | Does not exist; no generator or check to run |
| Signal table against `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv` | 124 catalogue types, 0 missing a row or the mark `ignored`; no type named that the catalogue does not hold |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED (checks a to h) |
| Leftovers of the repaired faults | None: no "row to be added", no "rows requested", no `EP-01 (implements)` in the feature |
