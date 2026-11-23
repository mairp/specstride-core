# Repair report — 123-pipeline-runtime-and-supervisor

Written by the repair agent of feature 123 on 2026-09-30, from the section of feature 123 in
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` and the orchestrator's message of the same day. Paths are
relative to `specs/123-pipeline-runtime-and-supervisor/`. Line numbers are those after the repair. Every
item was checked against the file before it was changed. No id was renumbered or reused. Nothing outside
this directory was written.

| Item | Class | Severity | State | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-123-01 | repair | critical | done | `spec.md:157` to `:208` (§R.6: signals, rows O-33 and O-34 at `:187`, `:188`, table of signals at `:200`); `:593` (F123-FR-030); `:664` (F123-FR-042, new); `:873` (the answer on CQ-020); F123-SC-010; User Story 1, scenario 3; Edge Cases; `contracts/relaunch-observe.table.json` (rows at `:336`); `contracts/tools/generate.py`; `plan.md:77`, `:84`; `tasks.md:260`, `:262`, T084; `research.md` D-1; `data-model.md`; `quickstart.md` | Verified: table 1 had no such signal, and a blocked run with a stage that lists exit 4 and allows the reason reached O-32. The rows carry the ids O-33 and O-34 and stand between O-24 and O-25, because a rule id is never renumbered. Both are inactive under `parity`, as register row DV-114 says, through a signal `parityProfile`, so the table stays pure. Cited as `divergence: DV-114` |
| W-123-02 | repair | high | done | `spec.md:282` to `:297` (§R.8); `:647` (F123-FR-039); `:616` (F123-FR-034); `:658` (F123-FR-041); `:670` (F123-FR-043, new); `contracts/supervise-verbs.json:67` to `:107`; T085, T086 | Verified against annex G §G.3 `:139` to `:141`. The observation line is `[SPECSTRIDE-SUPERVISE-STATE]`, as the orchestrator's point 2 asks |
| W-123-03 | repair | medium | done | `spec.md:474` (F123-FR-011); `:676` (F123-FR-044, new); `plan.md:28`, `:62`, `:144`, `:145`; `research.md` D-6; T087, T088, T089 | Verified: no requirement, check or task named the tool |
| W-123-04 | repair | low | done | `spec.md:415` (F123-FR-002) | Verified against the inventory: B-2563 (any value) and B-1411 (set and non-empty). The part of features 110 and 145 is theirs |
| W-127-01 (CQ-192) | queue | medium | done | `spec.md:198`, `:208`, `:593`, `:664` | The recommended answer is stated and tested (T022, T083): `wall_budget` with `retryable: true` is relaunched by both tables |
| W-X-05 | repair | medium | done | `spec.md:908` | The register is named without a count |
| W-X-06 | repair | medium | done | `spec.md:525` (F123-FR-020) | "engine start", twice |
| W-X-07 | repair | medium | done | `plan.md:136` | The registration call is in `@specstride/kernel`, owner feature 100, as the package graph says |
| W-X-13 | repair | medium | done | `research.md:80` | CQ-046 to CQ-053 and CQ-192 named. Two new readings carry `CQ-222` and `-2` and are reported below |
| W-X-19 | repair | medium | done | `spec.md:532`, `:539` (the `ep:` lines), `:731` | `implements (an entry)` |
| W-X-20 | repair | medium | done | `tasks.md` T050, T051, T052, T056, T057, T059, T060, T061, T066, T069 | Verified: 13 `PT-123-*` patterns and CT-123-117 were in no task. The names were added to the tasks that prove the same origin |
| W-X-22 | repair | medium | done | `spec.md:761` | Table "Threats": T-11, T-47 |
| W-X-24 | repair | medium | done | `spec.md:516` (F123-FR-018); T090; `data-model.md`; `plan.md:16` | The four types are named with their emitter. `launch.checked` rests on a reading (CQ-222) |
| W-100-15 | repair | low | not applied | — | Already done: `spec.md:539` says "critic-diversity warning", and `grep -rn "same-model"` over the directory finds nothing |
| W-X-33 | repair | low | done | `spec.md:598` (F123-FR-031); `:616` (F123-FR-034) | Annex G §G.8 with F100-FR-190; annex G §G.1 and annex B §B.11 |
| Follow-up of feature 141 | — | — | done | `tasks.md:34` (T004), T056, `:205` (T068) | `gate-<refusal>` has 10 members, and `gate-attach` is the eleventh refusal |
| Orchestrator, point 3 | — | — | done | `plan.md:31`, `:115` to `:135`; `tasks.md` (every `CT-123-*` path) | `tests/characterization/123/`; the conformance suite and the sample of EP-19 in `packages/testkit/src/conformance/EP-19/` and `packages/testkit/src/samples/EP-19/` |
| Orchestrator, point 4 | — | — | not applied | — | Nothing to change: the rules of `configuration.relaunch` in F123-FR-031 are kept |

Counts: 16 done, 2 not applied, 0 open.

## Requirements added or changed in place

| Requirement | Kind | Item | Test |
|---|---|---|---|
| F123-FR-042 | new | W-123-01 | CT-123-142 (T082, T083) |
| F123-FR-043 | new | W-123-02 | CT-123-143 (T085) |
| F123-FR-044 | new | W-123-03 | CT-123-145 (T088) |
| F123-FR-030 | changed | W-123-01, W-127-01 | CT-123-130, CT-123-142 |
| F123-FR-011 | changed | W-123-03 | CT-123-144 (T087) added |
| F123-FR-018 | changed | W-X-24 | CT-123-118 (T078, T090) |
| F123-FR-039, F123-FR-034, F123-FR-041 | changed | W-123-02 | CT-123-139, CT-123-143 |
| F123-FR-002 | changed | W-123-04 | unchanged |
| F123-FR-020 | changed | W-X-06 | unchanged |
| F123-FR-021, F123-FR-022 | changed (`ep:` line) | W-X-19 | unchanged |
| F123-FR-031 | changed | W-X-33 | unchanged |

Functional requirements: 44 (41 before). Success criteria: 10. Tasks: 90 (81 before).

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Orchestrator, owner | Register row DV-114 sets the rows O-33 and O-34 off under the `parity` profile, and the spec follows it. So under that profile a run that rests blocked is classified as at the baseline. No fixture of FX-35 or FX-36 ends with a blocked reason, so the row O-33 could be active under every profile without a change of compared output, which would make F100-FR-163 hold without exception. Recommended: decide this with the owner; if taken, the predicate of O-33 loses `parityProfile` and the oracle handling of DV-114 reads "O-33: not observable; O-34: off" |
| 2 | Feature 100 | Annex X §X.6 row 14 says `blocked-on-human` and `stop-not-retryable` are "added by the table `relaunch-root`". Table 1 now uses both. The members do not change; the sentence does |
| 3 | Feature 100 | Annex X §X.7 has no row for the switch of the rows O-33 and O-34. The spec binds them to the profile itself and adds no key. A row without a key, register row DV-114, owner 123, would record it |
| 4 | Orchestrator (W-ORC-04) | CQ-050: the lines of `supervise` are `[SPECSTRIDE-SUPERVISE-LAUNCH]`, `-STATE`, `-STOP`, `-DIGEST`; `[SPECSTRIDE-DIGEST]` has the keys of annex G §G.3 |
| 5 | Feature 112 | One more registered check from this feature: `pipeline.terminalTool`, not launch-blocking, severity `warn`. The id is a proposal of the plan |
| 6 | Features 111 and 144 | F123-FR-018 says the runtime root emits `launch.checked` only for the checks it verifies itself; the checks of the CLI before launch are no events. The projection table of feature 144 writes `[MOL-GATE]` from `launch.checked`; under `relaunch.owner: supervise` the lines of `supervise gate` are printed by the verb itself (F123-FR-038) |
| 7 | Features 110 and 145 | Their part of W-123-04 |

## New questions (each with a recommended answer and its source)

| # | Question | Sources | Recommended answer | If answered otherwise |
|---|---|---|---|---|
| CQ-222 | Which process emits `launch.checked`? The CLI evaluates the launch checks and does not write the event file; the launch record (annex B §B.7) holds the outcome and the refusal, not each check | Annex X §X.6 row 73; annex B §B.7; the catalogue of feature 111; F144-FR-010 | The runtime root, once for each check it verifies itself at its start and before every relaunch (launcher, launch contract, workspace lock) | If the CLI's checks must be events: the launch record gains a list of check results (feature 122), and the root writes them as events marked synthesized |
| CQ-223 | Is `[SPECSTRIDE-DIGEST]` printed when the run holds none of the six facts, and are keys without a fact printed? | Annex G §G.3 (the paragraph before the table of product lines); Principle XIX | A key without a fact is left out; a line that would hold `run` only is not printed | Always printed with seven keys: F123-FR-043 and CT-123-143 change, and the line costs bytes on every run |

## Register rows needed (with the text)

None. Register row DV-114 exists and is cited in F123-FR-030 and F123-FR-042. A change of its oracle handling is proposed in point 1 above, not needed.

## Checks

| Check | Result |
|---|---|
| `python3 specs/123-pipeline-runtime-and-supervisor/contracts/tools/generate.py --check` | ok. The check now also fails when O-33 or O-34 is not between O-24 and O-25, when a table does not refuse a blocked run, and when a line of default output takes a label of another command |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |
| Exhaustive evaluation of both generated tables (scratch script, not kept) | 0 vectors with a blocked run reach a relaunch row: table 1 outside `parity` (16,384 vectors), table 2 (36,864). A stop with `retryable: true` and no blocked reason reaches one in both |
| Every `CT-123-*` and `PT-123-*` name of `spec.md` is in `tasks.md` | Yes |
| Model calls, paid probes, git commands that change the repository, files outside the directory | None |
