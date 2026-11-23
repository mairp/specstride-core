# Repair report — 122-detached-runtime

Written on 2026-09-30 from the section of feature 122 in
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`. Paths are relative to `specs/122-detached-runtime/`
unless they start with `specs/` or `docs/`. Every item was checked against the file before a
change. Nothing was renumbered. Nothing outside `specs/122-detached-runtime/` was written.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-122-01 | repair | medium | done | `spec.md` F122-FR-005, F122-FR-036, scenarios 1 and 5 of User Story 1, scenario 4 of User Story 4; `contracts/cli-state-commands.md:13` and the new table of the line of `launch`; `tasks.md` T074; `quickstart.md` scenario 3 | Verified: the contract printed a refusal under `[SPECSTRIDE-STATE]` with a key `refused`, and no file named the label of `launch`. The value of `action` for the state commands (`state-export`, `state-import`, `state-adopt`) is a choice of this feature |
| W-122-02 | repair | medium | done | `plan.md` row XII and "Testing"; `tasks.md` note at T004, dependency table; `quickstart.md` scenario 1 | Verified. Beyond the item: T004 (unpaid test) read the results of the paid tasks T002 and T003; it now passes on results `skipped` with the reason "not run" |
| W-123-02 (pointer) | repair | high | done, no change asked | — | `[SPECSTRIDE-STATE]` stays the line of the three state commands. Annex G §G.3 does not list the label; it leaves the keys to the feature that prints the line. F122-FR-036 now states the keys. Feature 123 still prints the label at `specs/123-pipeline-runtime-and-supervisor/spec.md:278` and `contracts/supervise-verbs.json:72` |
| W-X-04 (pointer) | repair | high | done | `contracts/parity-rows.json` | `state.controlRoot` became `state.dir` (`specs/110-config-and-terms/contracts/config-keys.tsv:6`). The other six keys agree with that file |
| W-X-05 (pointer) | repair | medium | done | `spec.md`, "Clarifications", first answer | The register grew from 113 to 117 rows while this repair ran, so the register is named without a count |
| W-X-06 (pointer) | repair | medium | done | `spec.md` F122-FR-030, User Story 5; `tasks.md` T059; `quickstart.md` scenario 9 | No file of the feature held "engine invocation" |
| W-X-07 (pointer) | repair | medium | done | `plan.md` "Project Type", source tree; "Scale/Scope"; `spec.md` table "Closed sets" | The plan said "L5 and L1"; the graph says "L5, L4". The six closed sets marked "new" have rows 209 to 214 of annex X §X.6 |
| W-X-11 (pointer) | repair | medium | done | `contracts/parity-rows.json` (`row`, `status: confirmed`, note); `contracts/README.md`; `plan.md` "Scale/Scope"; `spec.md` table "Contracts of feature 100 used" | Rows 41, 113, 114, 115, 116. The spec cited "rows 14 and 41"; row 14 is `relaunch.owner` of feature 123 |
| W-X-19 (pointer) | repair | medium | done | `spec.md` F122-FR-003, F122-FR-041, F122-FR-043, table "Extension points"; `plan.md` row VI | `implements (an entry)`. The rule of W-ORC-06 is not yet in `STAGE-B-RULES.md` |
| W-X-25 (pointer) | repair | medium | done | `spec.md` F122-FR-043 (new), two edge cases, "Key Entities"; `plan.md`; `data-model.md`; `quickstart.md` scenario 13; `tasks.md` T072, T073 | See below |
| W-100-16 (pointer) | repair | low | done | `contracts/state-archive.schema.json:3` | `urn:specstride:schema:specstride.state-archive/1`; the id is in annex B §B.20, owner 122 |
| W-X-35 (pointer) | accept | low | not applied | — | No change asked. `research.md:90` (D-13) keeps `state.controlRoot`. The sentence reads as a decision in force and not as history; the orchestrator may want it changed to `state.dir` |
| Follow-up of feature 141, section 2.4 | repair | — | done | `tasks.md` T025, T036, T037; `spec.md` "Fixture families", "Assumptions", table of as-is ids; `plan.md`; `quickstart.md` | T025: B-2588 on `FX-35/lock-held@engine-stub`, B-2760 on `FX-36/gate-attach@engine-stub`. FX-11 removed from T025, T036, T037 |
| Rows 35 and 36 of the table of feature 100 (W-X-02) | repair | high | done | `plan.md` source tree; `tasks.md` T017, T035, T049 | Feature 122 is not named in W-X-02, but its paths lacked `src/` and `EP-nn`. Only CT-122-101 to CT-122-104 pin as-is behaviour against a reference and moved to `tests/characterization/122/`; the other CT-122 tests are tests of the package and stay |

Counts: 13 done (one of them "no change asked"), 1 not applied, 0 open.

## Requirements added or changed in place

| Requirement | Kind | What |
|---|---|---|
| F122-FR-005 | changed | Names `[SPECSTRIDE-LAUNCH]` (`run`, `state`) and `[SPECSTRIDE-REFUSE]` (`action`, `reason`, `next`) |
| F122-FR-036 | changed | Success line `[SPECSTRIDE-STATE]` with its keys; a refusal under `[SPECSTRIDE-REFUSE]` |
| F122-FR-030 | changed | "the next engine start" |
| F122-FR-003, F122-FR-041 | changed | `ep:` EP-14 `implements (an entry)` |
| F122-FR-043 | added | The writer of the workspace record writes `workspace:layout-version` at the first launch, after the lock and before the marker, equal to `layoutVersion` of the workspace record; reads it at every later launch; a missing file is written again; another major refuses the launch as F100-FR-049 states; a workspace part without the file is not read as state. Test CT-122-43, tasks T072 and T073, register row DV-035 |

Functional requirements: 43. Success criteria: 7. Tasks: 74 (T072, T073, T074 appended). The
feature stays under 45 requirements.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Feature 123 | Rename its observation line `[SPECSTRIDE-STATE]` (`spec.md:278`, `contracts/supervise-verbs.json:72`), as W-123-02 says |
| Feature 100 | Annex B §B.5 names "Runtime" as the writer of `workspace:layout-version`. F122-FR-043 reads it as the writer of the workspace record (runtime root; engine in start mode `standalone`). If another process is meant, F122-FR-043 changes |
| Feature 100 | Annex G §G.3 could list `[SPECSTRIDE-STATE]` (`action`, `feature`, `approvals`, optional `out`, `from`; printed by the state commands, 122), since two features claimed the label |
| Feature 100 | Done: annex X §X.6 row 277 holds the open registry of lock and liveness providers; `contracts/closed-sets.json` and the open sets of `spec.md` cite it (re-check B-8.7, 2026-09-30) |
| Orchestrator | W-ORC-06: the rule `implements (an entry)` in `STAGE-B-RULES.md` |
| Orchestrator | Decide on `research.md:90` (W-X-35) |

## New questions (each with a recommended answer and its source)

None. No `CQ-pending-*` placeholder was in the feature. CQ-138, CQ-139, CQ-140 and CQ-023 stay
as they were.

One reading without a question: a launch refused for a layout version of another major uses the
refusal of F100-FR-049 and adds no member to closed set 212.

## Register rows needed (with the text)

None. F122-FR-043 cites DV-035, the row that F100-FR-041 cites.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | The feature has none |
| The three JSON files of `contracts/` parse | Yes |
| `python3 docs/ecosystem/check-traceability.py --require-all`, before the repair | PASSED: checks a to h |
| The same, after the repair | PASSED: checks a to h. Feature 122: 16 items, 13 kept, as before. One run in between failed with 7 errors of checks d and f on `docs/ecosystem/consolidation.md` and `traceability.md`, which others were changing at that moment (register rows DV-114 to DV-117); none named feature 122, and the next run passed |
| Paid tasks | None was run. No model was called, no credential read |
