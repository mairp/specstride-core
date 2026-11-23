# Repair report — 102-run-control

Written by the repair agent of feature 102 on 2026-09-30, from the section "Feature 102" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the table "What the other features must follow" of
`specs/100-specstride/repair-report.md`. Paths are relative to `specs/102-run-control/` unless they
start with `specs/` or `docs/`. Line numbers are those of the files after the repair. The feature
has no item of its own; all eleven items are pointers. Every item was checked against the file
before a change.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-111-02 | repair | high | done | `spec.md:264`, `:267` (F102-FR-020), `:350` (F102-FR-036); `data-model.md` ("Events this feature asks for"); `tasks.md:101` (T037), `:108` (T040); `quickstart.md:9`; `research.md` (D-19) | Verified: the requirement said "emitted as an event" and named no type. The type is `source.change_accepted`, the example of B-8.2d, spelled as annex X §X.1 asks. It is not yet in the catalogue of feature 111; see "What another feature must do" |
| W-123-02 | repair | high | not applied | none | Nothing to change, as the pointer says. Verified: F102-FR-010 (`spec.md:200`) prints `[SPECSTRIDE-STOP]` with `request`, `now`, `ended`, `next`; annex G §G.3 (`specs/100-specstride/annexes/G-cli.md:141`) has the same keys. `[SPECSTRIDE-CONTINUE]` (`run`, `counts`) equals `:142` as well |
| W-X-03 | repair | high | done | `spec.md:194` (F102-FR-008), `:343` (F102-FR-034), `:431`, `:437`, `:444`, `:445`, `:447`; `tasks.md:123` (T048); `checklists/requirements.md:35` | Verified against `specs/100-specstride/annexes/X-cross-layer.md:527` (row 62, `--new-run`) and `:528` (row 63, `--jobs` of `stop`); rows 44 and 45 are keys of feature 111. The sentence "three command-line options" was wrong as well (the table has four) and is corrected |
| W-100-14 | repair | medium | done | `spec.md:303` (F102-FR-028) | "iteration limit" became "pass limit". No other use of "iteration" in the feature. "Pass ceiling" in the same requirement was left: it is the time ceiling of a pass (B-1591, B-1592; annex X §X.2), not the limit of passes |
| W-100-24 | queue (CQ-184) | medium | done | `spec.md:74`, `:76`, `:140`, `:215` to `:221` (F102-FR-012), `:455`, `:515`, `:537`; `plan.md:15`; `tasks.md:15` (T003), `:90` (T031), `:124` (T049); `data-model.md` ("Refusals of `resume`"); `quickstart.md:8`; `research.md` (D-2); `contracts/resume-refusals.md:3` | The state check of annex G §G.4 comes first and exits 1; F102-FR-012 then exits 3. `assumption: CQ-184`. New test CT-102-26 and task T049. The requirement names annex G §G.4 as the contract and F119-FR-009 as the owner of the check |
| W-X-06 | repair | medium | done | `spec.md:57`, `:131`, `:158` (F102-FR-002); `quickstart.md:6` | "the next engine start". F102-FR-002 also said "a starting run will honour the request"; it follows. The as-is warning of compatibility output (B-1578) keeps its words, because the oracle compares bytes. No "second run" in the feature |
| W-X-09 | repair | medium | done | `plan.md:72`, `:80`; `tasks.md:127` (T050) | Row XVII was "N/A: no prerequisite is checked here" (the worklist says it was a ✅ with the reason of plan 101; it was not). It is now a pass with its reason. T050 is in the last phase, after the model of T104 of feature 109 |
| W-X-18 | repair | medium | done | `spec.md:338` (F102-FR-033) | The line `ep: EP-04 specstride.loop-layer/1 (consumes)` is added to the requirement that the row of the section names. EP-13 and EP-07 already had their lines |
| W-X-22 | repair | medium | done | `spec.md:459` to `:467` | New table "Threats". The pointer names T-02 only; `specs/100-specstride/contracts/data/threat-model.json` names 102 as an owner of T-26 and T-28 as well, so all three are in the table |
| W-X-24 | repair | medium | done | `spec.md:350` (F102-FR-036), `:517`; `data-model.md`; `tasks.md:108` (T040); `research.md` (D-20) | `unblocked` is written when `resume` leaves `blocked-on-human` (T17), by the process that becomes the writer of the event file, with `by` and `latencyMs`. The CLI writes no event (F102-FR-016), so the CLI is not the writer |
| W-X-33 | repair | low | done | `spec.md:293` (F102-FR-026), `:350` (F102-FR-036), `:423` to `:425`; `contracts/snapshot-classes.md:8` | F102-FR-026 names annex X §X.2 and row 76 of §X.6; F102-FR-036 names annex X §X.1 and row 73 of §X.6. The worklist gives "annex X §X.2 for the event catalogue" as an example; the event envelope is §X.1, and §X.1 is cited |

Counts: 10 done, 1 not applied (nothing to change), 0 open.

Points of the table of feature 100 that name 102:

| # of the table | State | Note |
|---|---|---|
| 13 (core packages: no `node:fs`) | done | `plan.md:20`, `:38`, `:58`, `:107`; `tasks.md:21` (T006); `research.md` (D-21). The engine-side module reads the inbox and the ledger through the kernel |
| 24 ("pass limit") | done | W-100-14 above |
| 28 (`resume` without state) | done | W-100-24 above |
| 30 (F100-FR-143, "no tools or only read-only tools") | not applied | Feature 102 does not cite F100-FR-143 and does not write about the tools of the critic: `grep -n -i "FR-143\|no tools"` over the feature finds nothing |
| 39, 40 (counts of requirements and profile rows of feature 100) | not applied | The feature writes neither count. It wrote "The divergence register has 97 rows"; the count is removed (`spec.md:521`), as W-X-05 asks of others |

Not found in the feature, so nothing to change: "same-model warning", "engine invocation", "tripwire", `CQ-pending-*`, `DV-new-*`.

## Requirements added or changed in place

None added. The feature has 37 functional requirements and 8 success criteria, as before.

| Requirement | Item | What changed |
|---|---|---|
| F102-FR-002 | W-X-06 | "the next engine start" |
| F102-FR-008 | W-X-03 | `parity:` row 63 |
| F102-FR-012 | W-100-24 | State check first, exit 1; test CT-102-26; `assumption: CQ-184` |
| F102-FR-020 | W-111-02 | Type `source.change_accepted`, fields, writer |
| F102-FR-026 | W-X-33 | Contract of feature 100 named |
| F102-FR-028 | W-100-14 | "pass limit" |
| F102-FR-033 | W-X-18 | `ep:` line for EP-04 |
| F102-FR-034 | W-X-03 | `parity:` row 62 |
| F102-FR-036 | W-X-33, W-X-24, W-111-02 | Contract named; emitter of `unblocked`; `source.change_accepted` |

Tasks: 50 (48 before). New: T049 (test CT-102-26, `proves: F102-FR-012`), T050 (macOS result or skip). Changed in place: T003, T006, T031, T037, T040, T048.

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Feature 111 (W-111-02) | Add the type `source.change_accepted` to the event catalogue. Kind: instant, no partner. Fields of `data` that feature 102 needs: `file` (one of `spec`, `plan`, `tasks`, row 50 of annex X §X.6), `changedRef` (the logical name of the file, the name `blocked` already uses), `oldHash`, `newHash`, `acceptedAt` (the time recorded in `acceptedChanges` of the run snapshot). One event for each file accepted. No text of the source and no count. If feature 111 spells the type or a field otherwise, F102-FR-020, F102-FR-036 and `data-model.md` follow |
| 2 | Feature 144 (W-111-02) | One row for `source.change_accepted` in the projection table, which projects to nothing (F100-FR-199) |
| 3 | Feature 111 | `unblocked` has the fields `by`, `answerRef`, `latencyMs`. Feature 102 writes `by: operator` for every `resume` (CQ-078) and no `answerRef`. If `by` is a closed set, `operator` must be a member |
| 4 | Feature 111 | Nothing else is asked. `run.launched` (`countsCarried`, `countsReset`), `counters.reset` (`which`, `by`), `run.ended` (`cause`, `causedBy`, `phase`) and `blocked` (`reason`, `changedSource`, `changedRef`, `synthesized`) already hold what F102-FR-036 needs. Feature 102 demands no event for a tripwire |
| 5 | Feature 119 | F102-FR-012 relies on the state check of F119-FR-009 as the first check of `resume`, exit 1. Nothing to change if F119-FR-009 stands |
| 6 | Feature 141 | The fixture of CT-102-26 (a workspace without state, `resume`) is cited under FX-13. The as-is code 1 of that fixture is not mapped by the oracle; the baseline item is B-1482, which belongs to feature 119 (FX-28). If FX-13 has no such fixture, FX-28 is the family and T049 changes its `fixture:` line |
| 7 | Orchestrator | `python3 docs/ecosystem/check-traceability.py --require-all` fails on files that are not of this feature; see "Checks" |
| 8 | Orchestrator | `docs/ecosystem/CLARIFY-QUEUE.md`: CQ-072 (fields of the launch record), CQ-079 (class of a key without a class) and the rows that the first analyze report asked for are answered by feature 100 as it stands (annex B §B.7, `specs/100-specstride/annexes/B-state.md:347`; annex X §X.6 rows 51 and 76; annex X §X.7 rows 62 and 63). The two questions can be closed if the owner agrees |

## New questions (each with a recommended answer and its source)

None. The one reading that was made is inside CQ-078: `by` of `unblocked` is `operator`, as `causedBy` of a stop.

## Register rows needed (with the text)

None.

## Checks

| Check | Result |
|---|---|
| Generator or check of the feature in `contracts/tools/` | The feature has none |
| `python3 docs/ecosystem/check-traceability.py --require-all`, before the repair | FAILED, 1 error: `[h2] F126-FR-016: still cites a register row to be written (DV-new-1)` (feature 126) |
| The same, after the repair | FAILED, 7 errors, none on feature 102: four `[d]` (the divergence register holds DV-114 to DV-117, beyond the 113 rows expected) and three `[f]` (`traceability.md` disagrees with `traceability-items.tsv` on B-2112 and on two totals). These files are the orchestrator's and changed while this repair ran. The row of feature 102 reads 56 items, 54 kept, as before |
| Placeholders | No `CQ-pending-*`, no `DV-new-*` |
| Size | 37 functional requirements; under 45 |
| Analyze report | Section "After the cross-feature review" appended to `analyze-report.md` |
| Other features and feature 100 | Not edited. No git command that changes the repository was run. No subagent, no model call |
