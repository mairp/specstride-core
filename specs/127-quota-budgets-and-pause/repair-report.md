# Repair report — 127-quota-budgets-and-pause

Date: 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md` section "Feature 127" (2 own) and its list "Items owned elsewhere that change files of feature 127" (11 pointers). A previous agent's partial commit (`80394a0`) had already repaired `spec.md` for most items; this pass verified it and did the rest. The table "What the other features must follow" of `specs/100-specstride/repair-report.md` was read; nothing in it contradicts the worklist on these items.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-127-01 | queue | medium | done | `spec.md` §Q.3, F127-FR-017, -025, -027, -034, US4, Assumptions CQ-192 (by the partial commit, verified) | CQ-192 taken on its recommended answer: `wallClock` is not a cap of spend; a trip ends as at the baseline with `retryable: true` and no blocked reason |
| W-127-02 | repair | medium | done (this feature's side) | `spec.md` §Q.1, F127-FR-001 (by the partial commit, verified); `contracts/classifier.table.json` (each classify row now carries `retryable`) | Values per §Q.1; the four adapter tables (125, 131, 134, 138) are theirs to align — see below |
| W-123-01 | repair | critical | not applied | — | The worklist itself rules: "No change in this feature"; `spec.md` near F127-FR-017 is the source of the blocked states and needs nothing |
| W-111-02 | repair | high | done | `spec.md` F127-FR-020, -021, -040 (partial commit, verified); `tasks.md` T012 | Event `fallback.skipped` named; F127-FR-040 now lists every event type as one of the catalogue of 111 |
| W-X-03 | repair | high | done | `spec.md` F127-FR-004, -013, -019, -023, profile-row table (partial commit, verified) | Rows 39/40 "(shared)" are rows 111 and 112 |
| W-100-14 | repair | medium | done | `spec.md` §Q.1–§Q.3, F127-FR-005, -006, -011, -013, -034, F127-SC-001, US1 (partial commit, verified) | "pass limit"/"pass count"; "iteration" survives only in literals |
| W-110-06 | repair | medium | done | `spec.md` profile-row table row 108 (partial commit, verified) | Default "none"; `budget.run.phaseAttempts` added |
| W-111-05 | repair | medium | done | `spec.md` F127-FR-010, -011 (partial commit, verified) | `quota_pause` is the `endCause` of `pass.ended` and the `outcome` of `critic.call` |
| W-X-05 | repair | medium | done | `spec.md` Assumptions (partial commit, verified) | Register cited by row, without a count |
| W-X-07 | repair | medium | done | `plan.md:28` (storage), `:34` (Technical Context), `:107` (Project Structure), `:119` (Structure Decision) | `run:<runId>:spend` cited from annex B §B.5; owners of `@specstride/policy` are 110, 127, 147, as `specs/100-specstride/contracts/data/package-graph.json` states |
| W-X-10 | repair | medium | done | `spec.md:570` area (partial commit, verified); `data-model.md:3`, `:10`; `contracts/spend-ledger.schema.json` (title); `contracts/README.md:10` | Name cited from annex B §B.5, schema id from §B.20; readers are Engine, RunView, doctor; the CLI is not named a reader, per the partial commit's clarification |
| W-100-16 | repair | low | done | `contracts/spend-ledger.schema.json` | `$id` added: `urn:specstride:schema:specstride.spend/1` |
| W-110-12 | repair | low | done | `plan.md:147` | "model-tier bump" |

Carried in addition (same faults, into artifacts the items reach): `tasks.md` T075 states the wall-clock terminal record (`retryable: true`, no blocked reason); T047 says "critic-diversity warning", matching F127-FR-022 as repaired.

## Requirements added or changed in place

No requirement was added and no id was renumbered or reused: 41 functional requirements (F127-FR-001 to F127-FR-041) and 11 success criteria, as before. Requirements changed in place are listed in `spec.md` under "Repairs after the cross-feature review" (dated 2026-09-30), with item ids. This pass changed no requirement; it carried existing changes into `plan.md`, `tasks.md`, `data-model.md` and `contracts/`, and updated that table's coverage in `analyze-report.md`.

## What another feature or the orchestrator must do

- Feature 125 (`specs/125-adapter-claude/contracts/classifier-table.md:12`): add the `retryable` column, with the values of §Q.1 of this feature.
- Feature 131 (`specs/131-adapter-codex/contracts/classifier-entries.json:6`): give `provider_other` `retryable: true`.
- Feature 134 (`specs/134-adapter-pi/contracts/classifier-entries.pi.json:51`): give `provider_other`, `agent_failure`, `quota_window`, `rate_limit_transient` `retryable: true` and the others false, per §Q.1.
- Feature 138 (`specs/138-adapter-prime/contracts/classifier-entries.json:7`): `provider_other` `retryable: false` becomes `true`.
- Feature 109: an entry of a `failures` map that states a `retryable` other than the constant of its class is invalid (stated in §Q.1); nothing to change there unless 109's schema allows the field.
- Orchestrator: nothing beyond committing this directory. CQ-020 and CQ-192 stay open in the queue; the specs proceed on the recommended answers.

## New questions (each with a recommended answer and its source)

None raised. CQ-192 was this feature's queued question and is applied with its recommended answer (B-8.2b, its first repair), as `CLARIFY-QUEUE.md` records.

## Register rows needed (with the text)

None. The feature cites only DV-005, DV-027, DV-049 and DV-063, all of which exist.

## Checks

1. Generator or check in `contracts/tools/`: none for this feature (`contracts/README.md` states no generator is planned).
2. `python3 docs/ecosystem/check-traceability.py --require-all`: **passed** (checks a to h; exit 0).
3. `analyze-report.md`: dated section "After the cross-feature review" appended; consistency pass found no requirement without a task and no task without a requirement among the touched places; the retryable values, event names and ledger readers agree across spec, plan, tasks, data model and contracts.
