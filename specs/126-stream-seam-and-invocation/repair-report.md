# Repair report — 126-stream-seam-and-invocation

Written on 2026-09-30 from the section "Feature 126" of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`.
Paths are relative to `specs/126-stream-seam-and-invocation/`. Line numbers are those after the repair.
Every item was checked against the file before anything was changed. No id was renumbered or reused.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-126-01 | repair | high | done; the register row is open | `spec.md` F126-FR-016 (`:228` to `:233`), edge cases; `tasks.md` T039, T041; `research.md`; `quickstart.md` step 8; `data-model.md` | Verified: the sentence ported B-2112 (`lib/agent_stream.py:59` of the baseline). Now the one event writer drops the event, counts it in `event.dropped`, and no sink is called. Disposition `translated`. The register holds 113 rows and none describes this, so the requirement cites `DV-115` (W-ORC-02 proposes the row as DV-115) |
| W-126-02 | repair | high | done | `spec.md` F126-FR-020 (`:254`); `tasks.md` T039; `data-model.md`, "What a sink receives" | Verified: the sentence ported B-2113. A sink receives the envelope of annex X §X.1 whole, with `ts`, `type` and `seq`. The form without `ts`, `time`, `event` and with `sequence` is the as-is form of the compatibility projection only |
| W-126-03 | repair | medium | done, with one difference from the wording of the worklist | `spec.md` F126-FR-008, F126-FR-012, F126-FR-031, new F126-FR-039; `tasks.md` T037, T040; `data-model.md`, "Where a difference between harnesses is read" | Verified at the three places. The conditions are now: "entry of the resolved registry names no stream format" (F126-FR-008), "registry-routed or terminal-tracked" (F126-FR-012, F126-FR-031). The harnesses are examples under the `parity` profile. Difference: see "What another feature or the orchestrator must do", point 3 |
| W-126-04 | repair | low | done | `plan.md` rows V and VIII of the Constitution Check, "Constraints"; `spec.md` F126-FR-011; `tasks.md` T038 | Verified: row VIII said "N/A: no process is started here". The requirement now states how a replacement tap is started and that it never fails the pass |
| W-X-01 | repair | high | done | `plan.md` "Primary Dependencies", "Project Type", "Source Code", "Structure Decision"; `tasks.md` header, T002, T003, T009, T010, T014 | Package `@specstride/harness`, directories `src/stream/` and `src/invocation/`. No package of its own is asked for |
| W-X-05 | repair | medium | done | `spec.md`, "Assumptions" | The count "97 rows" is removed; the register is named without a count |
| W-X-07 | repair | medium | done | `plan.md` row XVIII | DV-101, DV-102, DV-103 exist (`docs/ecosystem/consolidation.md:1000` to `:1002`); "three to be written" removed |
| W-X-11 | repair | medium | done | `spec.md` F126-FR-011 (rows 79 and 80), F126-FR-018 (row 81); heading "Key" of the profile table | Verified against annex X §X.7 rows 79 to 85 and `specs/110-config-and-terms/contracts/config-keys.tsv:215` to `:222` |
| W-X-13 | repair | medium | done | `spec.md` F126-FR-020 (`assumption: CQ-032; CQ-119`), table of assumptions | `CQ-pending-5` is CQ-032 and CQ-119 |
| W-X-14 | repair | medium | done | `plan.md`, "Constitution Check", "Complexity Tracking" | Gate line, version of the constitution, one row per principle (20), a mark, a reason and a requirement on every row, the two re-checks. Row XVIII is ❌ with a row in Complexity Tracking |
| W-X-15 | repair | medium | done | `tasks.md` header, T001 (now in Phase 8, same id), T024, "Dependencies" | No task waits for a paid task. The stub part of X0 is T021 and T025 |
| W-X-26 | repair | medium | done | `contracts/schemas/invocation.schema.json`, `producer-status.schema.json`, `provider-terminal.schema.json`, `invocation-result.schema.json`; `contracts/README.md`; `spec.md` F126-FR-028, CQ-105 | `$id` in the form `urn:specstride:schema:<schema id>`; `schema` required in each |

Counts: 12 items done (one of them with an open register row), 0 not applied, 0 open.

## Requirements added or changed in place

| Requirement | State | Item | What |
|---|---|---|---|
| F126-FR-008 | changed | W-126-03 | Condition on the entry of the resolved registry; dsh and Codex are examples |
| F126-FR-011 | changed | W-126-04; W-X-11 | Start of a replacement tap; rows 79 and 80; second test CT-126-10 |
| F126-FR-012 | changed | W-126-03 | Legacy and correlated path by route and `trackTerminal`; prime is an example |
| F126-FR-016 | changed | W-126-01 | Failed append reaches no sink; `translated`; `DV-115`; `ep:` EP-08; second test CT-126-11 |
| F126-FR-018 | changed | W-X-11 | Row 81 |
| F126-FR-020 | changed | W-126-02; W-X-13 | The envelope whole; CQ-032, CQ-119 |
| F126-FR-028 | changed | W-X-26 | Schema ids of annex B §B.20; `schema` in every record |
| F126-FR-031 | changed | W-126-03 | Provider-terminal destination by data |
| F126-FR-039 | added | W-126-03 | No harness name in control flow; the terms registry-routed and terminal-tracked; test CT-126-9, task T037 |

Functional requirements: 39. Success criteria: 7. Tasks: 41 (T037 to T041 added). Under 45, no split.

## What another feature or the orchestrator must do

| # | Who | What | Evidence |
|---|---|---|---|
| 1 | Orchestrator | Write the register row of W-ORC-02, then replace `DV-115` in `spec.md` (F126-FR-016, "Assumptions", "Repairs"), in `plan.md` (row XVIII, which becomes ✅, and the row of Complexity Tracking, which goes) and in `research.md` | The register has 113 rows (`docs/ecosystem/consolidation.md:1037`) |
| 2 | Orchestrator | `docs/ecosystem/traceability-items.tsv`: B-2112 is `ported` with an empty register column; it becomes `translated` with the new row. B-2113 stays `ported`: the as-is form lives on in the compatibility projection | `grep -P "^B-2112\t"` |
| 3 | Feature 138 (and the orchestrator to confirm) | The format row `prime-v3` must set `trackTerminal`. The worklist names `trackTerminal` as the condition, and this feature took it. At the baseline the option has another use (it wraps the reader so that `terminal_seen` is exposed, `lib/stream_seam.py:206`), no production row sets it, and the correlated path of prime is chosen by a test of the harness name (`proposer.sh:1705`). With the row set, a second terminal of a prime stream is dropped with `duplicate_terminal`; F126-FR-009 already asks that for every pass. If the orchestrator prefers a field of its own (for example `correlated` on the format row), F126-FR-039, -012 and -031 change in one word each | Baseline `9cab15d` |
| 4 | Features 125, 130, 131, 138 | Under the `parity` profile the entry of the resolved registry of a harness whose baseline pass is unpiped (dsh, Codex) names no stream format for the route, and that of a harness whose baseline pass takes the legacy path (Claude) names none either, so that the tap takes the `claude` format by default, as at the baseline. `specs/130-adapter-dsh/contracts/descriptor-dsh.json:16` uses a field `parityFormat` for this, which the descriptor of annex C §C.2 does not hold | Annex C §C.2: `stream.format` is required |
| 5 | Feature 100 | Annex C §C.2 has no way to say "no stream format under the `parity` profile" (point 4). Either `stream.format` may be null in the resolved entry, or a field is added. This feature reads "the entry names no stream format" and does not fix the spelling | Annex C §C.2 |
| 6 | Feature 100 | No annex names a schema id for the format row of the registry and for the normalized records. This feature used `specstride.stream-format/1` and `specstride.stream-record/1`; features 130, 131 and 138 register rows, so the ids cannot be internal ones. Recommended: two rows in annex B §B.20 or in annex C §C.5, owner 126 | `grep -rn "stream-format\|stream-record" specs/100-specstride` finds nothing |
| 7 | Feature 100 | The plan states that the engine reaches reconciliation and finalization through an interface of `@specstride/contracts`. No annex declares that interface yet | `grep -n -i "reconcil\|finaliz" specs/100-specstride/annexes/*.md` finds the closed sets only |
| 8 | Feature 128 | No change asked. Its payload forms take the time of an entry from `ts` of the event, which a sink now receives | `specs/128-telemetry-export/contracts/payload-forms.tsv:8` |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| N-1 | Which data field says that a pass is correlated and gets a provider terminal: `trackTerminal` of the format row, which has another use at the baseline, or a field of its own? | Worklist W-126-03; baseline `lib/stream_seam.py:206`, `proposer.sh:1705`; F100-FR-023 | `trackTerminal`, as the worklist says; the specs proceed on it | A new option of the format row; F126-FR-001, -012, -031, -039 and `data-model.md` change the name |
| N-2 | F126-FR-035 sends the `agent_result` of the finalization "to the local event destination only, not to a remote sink by this process" (as-is, B-2149 and others). Under annex C §C.10 the one event writer calls every open sink after the primary write. Does the result event of the finalization reach the sinks? | F126-FR-035; annex C §C.10; F111-FR-034 | Yes outside the compatibility projection: the event is written by the one writer, which calls the sinks. The as-is rule holds for the as-is form only. Not changed now, because no item names it | F126-FR-035 stays, and feature 111 needs a way to write an event that no sink receives |

## Register rows needed (with the text)

`DV-115`, cited by F126-FR-016. The text is that of W-ORC-02; this feature confirms the as-is column against the baseline (B-2112, `lib/agent_stream.py:59`).

| Id | As-is | New | Source | Oracle handling | Owner's ruling |
|---|---|---|---|---|---|
| DV-115 (proposed DV-115) | A failure to append an event to the local file is swallowed, and the event is still shipped to the remote sinks (B-2112) | The event writer drops the event, counts it in `event.dropped` and calls no sink: a sink receives only events that have a `seq` and are in the primary file | Annex X §X.1; annex C §C.10; F111-FR-017, F111-FR-019, F111-FR-034; review finding B-8.2d-002 | To be confirmed by feature 141. Proposed: **not observable**, since no fixture makes the local append fail; own test CT-126-11 | Row proposed by the repair worklist; put to the owner in the clarification round |

## Checks

| Check | Result |
|---|---|
| Generator or check of its own in `contracts/tools/` | none in this feature |
| The four schema files parse as JSON; `$id` and `schema` | yes |
| `python3 docs/ecosystem/check-traceability.py --require-all` | FAILED with one line: `[h2] F126-FR-016: still cites a register row to be written (DV-115)`. Checks a to g, h1, h3 and h4 pass. The cause is outside what a feature agent may write (the register, item W-ORC-02). The check passes when the row is written and the citation carries its number |
| Test names of `spec.md` against `tasks.md`, both ways | 0 missing |
| Placeholders `CQ-pending-*` | none |
| Each changed requirement read again at the end | done; see `analyze-report.md`, "After the cross-feature review" |
