# Specification Analysis Report: 154-concurrency-and-parallelism

**Run**: 2026-11-25, `speckit-analyze` over `spec.md`, `plan.md` and `constitution-grounding.md`, with `data-model.md`, `quickstart.md`, `research.md`, `contracts/` and `checklists/requirements.md` as supporting artefacts. This repository has no `.specify/` and no `tasks.md` yet, so task coverage was assessed against the change map of `plan.md`. Constitution v3.0.3 (`/root/specstride-dsh/.specify/memory/constitution.md`), non-negotiable inside the run.

**Result**: 1 critical, 8 high, 15 medium, 3 low. Every one was resolved the same day in the artefacts; the resolution is in the last column. Nothing was weakened to clear a finding: the three amendments that carry a cost stay in Complexity Tracking (F143-FR-012, F142-FR-070, the `host_slot` pause class).

## Findings

| ID | Category | Severity | Location(s) | Summary | Recommendation | Resolution |
|----|----------|----------|-------------|---------|----------------|------------|
| A1 | Constitution (III) | CRITICAL | plan.md Shared-limits/Group-unit design; data-model.md D6; spec.md F154-FR-035 | Two snapshots bracket the acceptance check, so a change made before the check is not seen; a check against a changed set could pass | Compare the after-reading with the group's base snapshot as well | Resolved: F154-FR-035 binds three fingerprints (base snapshot, before, after); WC-3 reads `tainted` on either difference; D6 holds the three fields |
| A2 | Constitution (XVIII) | HIGH | spec.md F154-FR-012, -014, -015 | "The report is not run output" let a new row print `not in the events` under `parity` with no register field | Suppress every new row under `parity`, or name a field | Resolved: F154-FR-012 states every new row of G1 is absent under `parity`; the parity table names "the report's new rows" |
| A3 | Constitution (XVIII) | HIGH | spec.md F154-FR-009, CQ-154-19 | A labelled plan printed with the option off is a behaviour on by default, against F154-FR-001 | Put it behind a switch or a flag | Resolved: the option-off print sits behind the verbose flag of F154-FR-010 only; the amendment row of F142-FR-017 says so |
| A4 | Constitution (XVI) | MEDIUM | spec.md F154-FR-041, -045; data-model.md D9, D14 | A hold reclaimed on its writer's death re-opens the window; the cap and `status` behaviour of a slot wait were unstated | Expire at reset only; state cap exclusion and the status view | Resolved in F154-FR-041, -045, D9, D14 and the plan's shared-limits design |
| A5 | Constitution (IX) | HIGH | spec.md F154-FR-067; plan.md phase-tree design | "Read denial confirmed" had no procedure; SC-004 was untestable | Name the proofs and their record | Resolved: the two proofs F142-FR-070 names (the harness's initial record, IX; the sweep before a critic-class call); SC-004 reworded |
| B1 | Inconsistency | HIGH | closed-set-deltas.md row 8 vs spec.md | `loop.parallel.noRepeat` "default off" in the deltas, "on with the layer" in the spec | Fix the delta | Resolved: "on with `loop.parallel.units`" |
| B2 | Inconsistency | HIGH | contracts/rule-tables/independence-table.json | `PG-3a`/`PG-3b` and an unconditional `PG-2` made `PG-1` unreachable and every undeclared pair independent | Rewrite in the plan's order | Resolved: PG-2, PG-3, PG-1, then PG-0 (dependent) |
| B3 | Inconsistency | MEDIUM | fixtures-154.json; spec.md SC-001; plan.md; README.md; quickstart.md | `FX-154-DOOR` and the trial were not in the "six fixtures" | Name them everywhere | Resolved: SC-001 names FX-154-DOOR; plan, README and quickstart say "six, plus the door fixture and the trial" |
| B4 | Inconsistency | MEDIUM | plan.md Scale/Scope | "11 new schemas" (10), "13 amendment rows" (16) | Correct the counts | Resolved: 11 schemas (with `merge-baseline`), 17 amendment rows |
| B5 | Inconsistency | MEDIUM | spec.md F154-FR-006, -058 | The gate "on the workspace" against the gate on a rebased phase tree; workspace advancement unstated | State when the workspace advances | Resolved: F154-FR-006 says "the tree the critic judges"; F154-FR-058 states the advance at approval |
| B6 | Terminology | MEDIUM | spec.md, plan.md, quickstart.md | One check, four nouns | Use one in prose | Resolved: plan.md "Terminology"; prose says "acceptance check", ids stay |
| B7 | Inconsistency | MEDIUM | spec.md, quickstart.md, fixtures | "Replay" meant an engine re-run and a report read | Name both | Resolved: "engine replay" (SC-010) and "recorded read" (SC-009) in plan.md |
| B8 | Inconsistency | MEDIUM | spec.md F154-FR-043 | An unconditional "every run" behind a switch | Add the condition | Resolved: "With `host.limits` on" |
| B9 | Inconsistency | MEDIUM | plan.md change map, shared-limits design | SL-5 was a layer fallback; the hold was "written by `enterPause`" though files are written by the runtime root | Move SL-5; name the port | Resolved in plan.md |
| B10 | Inconsistency | LOW | spec.md "Where the spec already requires it" | F142-FR-023 missing from the table | Add the row | Resolved |
| C1 | Underspecification | HIGH | spec.md F154-FR-048; plan.md | No rule set for admitting a stage into a wide group | Add an SG table | Resolved: SG-1…SG-4 in plan.md, `stage-admission-table.json`, `stage-admission.ts` in the change map |
| C2 | Underspecification | HIGH | spec.md F154-FR-042, -028 | No key or schema for capacity classes; no schema for the merge baseline | Add both | Resolved: `host.resources.<name>.capacity` (a slot of that width); `specstride.merge-baseline/1` schema and D7 |
| C3 | Ambiguity | MEDIUM | spec.md F154-FR-032; plan.md PG | Task groups of 153 carry no `[P]`, so "at once" was unreachable for them | State the rule or add a field | Resolved: `independentWith` declared on the frozen record (PG-3); deltas row 21 and the spec's amendment row |
| C4 | Ambiguity | MEDIUM | data-model.md D13 | Not-started reasons sat in the set-aside record; no event for a refused unit | Name one admission event per unit kind | Resolved: `host.slot.admission`, `pipeline.stage.admission`, `loop.speculation.admission` (spec "Closed sets", deltas row 3, D13) |
| C5 | Ambiguity | MEDIUM | spec.md F154-FR-015, -064 | Set-aside cost had no report row | Add the row | Resolved in F154-FR-015 and the `loop.speculate` register row |
| C6 | Ambiguity | MEDIUM | spec.md F154-FR-035, -036 | The charge of a tainted result was unstated | Decide | Resolved: tainted is charged as a failed check (WC-3 as WC-2) |
| C7 | Ambiguity | MEDIUM | spec.md F154-FR-020 | Whether several `[P]` groups overlap in time was unstated | One sentence | Resolved: `[P]` groups run one after the other; only units and phases run at once |
| C8 | Style | LOW | spec.md status; plan.md validation heading; amendments table | Stale status, a duplicated heading, a split table | Tidy | Resolved |
| D1 | Duplication | MEDIUM | spec.md, plan.md, data-model.md, deltas | Rule text in three or four copies; `host_slot` missing from the spec's closed sets | Make the spec the source | Resolved: the §C.13 row added to spec.md; F154-FR-045 names the class |
| D2 | Duplication | LOW | spec.md G8 | F154-FR-075 ≈ -067; -077 ⊂ -045; -037 ⊂ -006; -065 ⊂ -061 | Fold | Kept: each is one requirement per channel of stage 1, as the stage prompt asks |
| E1 | Coverage | MEDIUM | spec.md amendments; deltas row 21 | A schema amendment with no spec row | Add it | Resolved |
| E2 | Coverage | MEDIUM | spec.md user stories | 14 requirements with no acceptance scenario | Add scenarios | Resolved: five scenarios added (the trial; sessions and a resource; a hold; a rejected head; an integration), covering F154-FR-018, -019, -040, -042, -041, -059, -063 |

## Coverage Summary

| Requirement key | Change-map row? | Slice | Notes |
|---|---|---|---|
| F154-FR-001…-081 | yes, 81 of 81 | P1–P7, G0, G8 | every row names a file and a symbol, or a test |

No requirement is without a design.

## Constitution Alignment Issues

None open. II, III and XVIII: no deviation (A1, A2, A3 resolved by design). The deviations with a cost are in plan.md Complexity Tracking: the charge exception of F143-FR-012, the amended wording of F142-FR-070, and the `host_slot` pause class.

## Metrics

- Total requirements: 81 (plus 14 success criteria)
- Change-map rows: 36, covering 81 of 81 (100 %)
- Requirements with an acceptance scenario: 72 of 81 (the other 9 are invariants and deliveries carried by the stories' other scenarios)
- Ambiguity count after resolution: 0
- Duplication count: 1 deliberate (D2)
- Critical issues open: 0

## Next Actions

1. Write `tasks.md` by hand with `speckit-tasks` (`prompts/154-concurrency-and-parallelism/4-tasks-or-script.md`): one phase per slice, every requirement in a task, `[P]` only on disjoint named paths.
2. Re-run `speckit-analyze` once `tasks.md` exists: the skill's own precondition, and the task-coverage pass it could not make here.
3. Run the trial of `loop.parallel.units` first; no switch turns on before its record is read.

## Second run (2026-11-25, after `tasks.md`)

`speckit-analyze` over `spec.md`, `plan.md` and `tasks.md` (then 168 tasks): 1 critical, 4 high, 8 medium, 3 low. All resolved; `tasks.md` now holds 172 tasks.

| ID | Severity | Summary | Resolution |
|---|---|---|---|
| E1 | CRITICAL | F154-FR-013 and -016 (delivered by PR #40) had no task | Two guard tests added in Phase 4 (`report-pr40-154.test.ts`) |
| E2 | HIGH | F154-FR-046 had a test and no implementation | Task added in Phase 11 (`register.ts`, the config envelope only lowers) |
| E3 | HIGH | The coverage map was stale | Regenerated from the citations, 81 FRs and 14 SCs, each with its tasks |
| E7 | HIGH | A task named a file that does not exist (`validate/compose.ts`) | `contract/commands/validate.ts` `validateContract` |
| E8 | HIGH | The trial's first case was the recorded read, not the replay | The engine replay of the 28 groups first, then the recorded read |
| E9 | HIGH | Stage runs were bounded by the check slot only | Every host limit of G4 (checks, sessions, resources) |
| E4, E5, E6 | MEDIUM | FR-065 cited by a range only; `pipeline.stage.admission` never emitted; eleven tasks without an id | Cited, emitted on take, reclaim and wait, ids added |
| E10 | MEDIUM | The fake-binary test file differed from the plan | The plan now names the new file and keeps the live capture |
| E11 | MEDIUM | `ownerRecordFor` anchored at :543-562 | :514, in `lock/directory-lock.ts` |
| E12 | LOW | The plan's PG row had no PG-0; a symbol in the wrong file | Fixed |
| E13 | LOW | Stray backticks | Fixed |
| F2-1 | MEDIUM | Eight implementation tasks preceded their failing test; three embedded it | Swapped and split (pass-mark, merge-baseline, the door) |
| C1 to C4 | MEDIUM/LOW | A parser without a file; an unrecorded baseline; a bare `doctor.ts`; an overwritten report | `adapters/speckit-tasks.ts`; a baseline-recording task in Phase 1; the path; a dated section |

Coverage after resolution: 81 of 81 requirements and 14 of 14 success criteria have a task; 0 critical, 0 high open.
