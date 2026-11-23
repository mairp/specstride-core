# Repair report — 119-front-door-and-presenter (act B-8.6c)

Written by the repair agent of feature 119 on 2026-09-30, from the section "Feature 119" of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` (1 own item, 10 pointers). All paths are relative to
`specs/119-front-door-and-presenter/` unless they start with `specs/` or `docs/`. Line numbers are
those of the files after the repair.

A previous agent was cut off; its partial edit is committed as `80394a0` and touched `spec.md` only.
It was verified against the worklist and found correct in what it did: W-119-01 (spec side: F119-FR-056,
F119-SC-009, CT-119-19), W-100-24 (CQ-184), W-X-06, W-X-26 (spec side), W-X-31 and W-X-05 (the
register count). Its plan-side and task-side work was missing; this repair added it.

Every item was checked against the files before it was applied; the worklist's line numbers had
moved (the spec grew by the partial edit) and the cited text was located by its content.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-119-01 | `repair` | medium | done | `plan.md:24` (Build), `:29` (Constraints), `:35` (Testing); `research.md` D-10; `tasks.md` T064, T065; `quickstart.md:11` | Bundler `rollup` named as a development dependency, licence MIT, no native part, version and licence `unverified` until pinned. Build task T064; plain-install test CT-119-19 as T065 on Linux and the macOS runner, skip with reason where no runner. Feature 100's plan assigns the bundling to 119 and 113; 113 already cites "the bundling task of feature 119" without an id — feature 113 may now cite T064 |
| W-100-24 | `queue` (CQ-184) | medium | done by the partial edit, verified | `spec.md` F119-FR-009 (state check of `resume` first, exit 1; CT-119-18; `assumption: CQ-184`) | Task T063 added for CT-119-18 (this repair, under W-X-20). Matches annex G §G.4 as feature 100 repaired it |
| W-X-05 | `repair` | medium | done by the partial edit, verified | `spec.md`, Assumptions: the register named without a count | No other stale count found; plan Scale/Scope updated to the new counts (34 requirements, 8 success criteria) as part of W-119-01's carry-through |
| W-X-06 | `repair` | medium | done by the partial edit, verified | `spec.md` F119-FR-017, F119-FR-018 | "engine start" throughout; resolution of `workspace:current:*` cited to F100-FR-055. Plan and tasks never wrote "engine invocation" |
| W-X-08 | `repair` | medium | done | `plan.md:70` (row XVIII) | Verified: the spec's `divergence:` fields name DV-006, DV-007, DV-027, DV-033, DV-034, DV-036, DV-042, DV-062, DV-066; the plan listed only DV-033, DV-036, DV-042, DV-062. List replaced by "the rows in the `divergence:` fields of `spec.md`" |
| W-X-09 | `repair` | medium | done | `plan.md` row XVII (answered as a pass with its reason); `tasks.md` T066; `plan.md:24` (Testing) | Verified: row XVII said N/A while the feature has the 150 ms startup check and macOS `unverified`. T066 records the macOS result or the skip with its reason for CT-119-8 and CT-119-19 |
| W-X-14 | `repair` | medium | done | `plan.md:39` (the GATE line of the plan template); `tasks.md:24`, T001 | Verified: T001 created `present/`, which moved to `145-presenter`; removed. The Constitution Check now carries "*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*" |
| W-X-20 | `repair` | medium | done | `tasks.md` T059 to T063 | The four test names of the cited `test:` lines without a task: PT-119-C-109-*, PT-119-C-009-*, PT-119-C-012-*, PT-119-C-013-* (now T059 to T062, fixture FX-28). CT-119-18, appended by W-100-24, also had no task: T063 |
| W-X-26 | `repair` | medium | done | `contracts/front-door.md:23` to `:25`; `contracts/schemas/inspect-{phases,feedback,verdicts,events,tail}.schema.json` (new); `data-model.md` | Verified: the contract still called the id "proposal". Five schema files written, `schema` required, `$id` `urn:specstride:schema:specstride.inspect.<verb>/1` (the rule of feature 100's `contracts/README.md`), citing annex B §B.20 and F100-FR-227 |
| W-X-31 | `repair` | low | done by the partial edit, verified; carried through | `spec.md` F119-FR-015; `plan.md:24`, `:103`; `tasks.md` T002; `quickstart.md:8`; `research.md` (reports line) | "startup check" for the check of the build; "verification gate" was never written bare in this feature |
| W-X-34 | `accept` | low | not applied (no change asked) | — | The worklist's rule is "No change"; `analyze-report.md:9` was left as it is |

## Requirements added or changed in place

Added by the partial edit (verified): **F119-FR-056** (the bundle and the plain install, CT-119-19),
**F119-SC-009** (plain install). Changed in place: F119-FR-003, F119-FR-009, F119-FR-015,
F119-FR-017, F119-FR-018, F119-FR-033. No id was renumbered or reused; the gap F119-FR-034 to
F119-FR-055 stays (the move to `145-presenter`). All changes are recorded in the dated section
"Repairs after the cross-feature review" of `spec.md`.

## What another feature or the orchestrator must do

| Who | What |
|---|---|
| Feature 113 | Its `plan.md:25` and `tasks.md:64` say "the bundling task of feature 119 … no task id can be cited". It may now cite T064 of this feature |
| Orchestrator | Add `contracts/schemas/` of this feature to the delivery of the `contracts` package when it collects schema files (five files, `$id` `urn:specstride:schema:specstride.inspect.<verb>/1`) |
| Orchestrator | If the divergence register gains rows, nothing is needed here: plan row XVIII now names the rows by reference |
| Orchestrator | The bundler decision (`rollup`, MIT, no native part) is this feature's, taken under W-119-01; it is `unverified` until the build pins the version, like the YAML parser of D-8 |

## New questions (each with a recommended answer and its source)

None new. The bundler choice could have been one; it is answered in `research.md` D-10 with the
alternatives and the reason, on the pattern of feature 100's D-8, and is reported above instead.

## Register rows needed (with the text)

None. The repairs cite only rows that exist (DV-006, DV-007, DV-027, DV-033, DV-034, DV-036,
DV-042, DV-062, DV-066).

## Checks

| Check | Result |
|---|---|
| Generator or check of this feature in `contracts/tools/` | none exists; nothing to run |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h (41 of 41 Wave 1 features have a spec) |
| Test names of `spec.md` against `tasks.md` | every family and CT name has a task |
| Counts in spec, plan, tasks, quickstart, data-model | 34 functional requirements, 8 success criteria, consistent |
