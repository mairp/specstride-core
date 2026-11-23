# Analyze report: 113-host-claude-code

Date: 2026-09-29. Read-only pass over spec.md, plan.md and tasks.md, after `check-traceability.py`.

## Result

| # | Category | Severity | Finding | Status |
|---|---|---|---|---|
| 1 | Coverage | Low | Requirements 003, 004, 007, 009, 010, 012, 022, 023 are covered by task ranges, not by id | Accepted |
| 2 | Underspecification | Medium | The guardrail host hook needs a CLI command that evaluates launch checks without launching; annex G lists none | Reported as a gap of feature 100 |
| 3 | Underspecification | Medium | Annex G names no CLI command that writes a `host-event` inbox request | Reported as a gap of feature 100 |
| 4 | Underspecification | Low | No marker tells a host hook that it runs in a child of a run (F113-FR-027) | Reported; narrow reading: adapter switches customizations off |
| 5 | Constitution | None | All twenty gates answered, no violation | Pass |
| 6 | Traceability | None | No `[h` line names feature 113; 8 kept items and 20 superseded rows placed | Pass |

Requirements: 40. Success criteria: 5. Split: none proposed (40 is under 45).

## Remaining after two repairs

Findings 2 to 4, all owned by feature 100 and reported to the orchestrator.

## After the cross-feature review

Date: 2026-09-30. Repairs of the items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section "Feature 113", on the rules of `docs/ecosystem/STAGE-B-REPAIR-PROMPT.md`. The items and their states are in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Principle XII (CQ-188, recommended answer) | The trigger suite, the behaviour smoke and the with-and-without report left the build. They are paid tasks that a person starts, logged. The suite is a release check that reads the log. The per-change build checks the suite files, the eval driver on a stub runner and the token budgets, without a model call. The model comes from the configuration of the run. F113-FR-038 to F113-FR-040 changed in place, F113-FR-041 added; all four carry `assumption: CQ-188` | spec, plan (row XII, Testing, design points), tasks (T001, T027 to T031, T033 to T035, T037), research, data-model, quickstart, contract |
| Threat T-43 | F113-FR-042 added; it cites F100-FR-236. A table "Threats" with seven threats | spec, plan, tasks (T036, T038), research |
| Markers of the host | Stated as state of the host, read by nothing of the product; no logical name exists in annex B §B.5 | spec (F113-FR-016, F113-FR-021), plan (row I, Storage), data-model, research |
| Logical names | `workspace:current:status-line` and `inbox:host-events:<launchId>` named in the requirements | spec (F113-FR-021, F113-FR-024), plan, tasks (T016) |
| Terms | "host hook" for every bare "hook"; "check" for a check of the build; "a start of the runtime platform" | every file |
| Owner of row 34 | 147 in place of 110 | spec |
| Constitution Check | Form of the template, v3.0.0, a reason and a requirement per row, section Complexity Tracking (empty) | plan |
| Package and places | `@specstride/host-claude-code`; the conformance suite and sample in the published test kit; tests under `tests/parity/113/` and `tests/characterization/113/` | plan, tasks |

### Consistency pass over the places touched

| # | Category | Severity | Finding | Status |
|---|---|---|---|---|
| 7 | Coverage | None | F113-FR-038: T027, T028, T035, T037. F113-FR-039: T027, T028, T035, T037. F113-FR-040: T029, T030. F113-FR-041: T033, T034. F113-FR-042: T036, T038. Every new or changed requirement has an implementation task and a test task with `proves:` | Pass |
| 8 | Coverage | None | New tasks T033 to T038 each name a requirement | Pass |
| 9 | Paid tasks | None | T001, T029 and T037 are marked PAID. No test task depends on one: T028, T030 and T034 run on recorded logs and a stub runner; T017 no longer waits for T001 | Pass |
| 10 | Terms and values | None | Threshold 0.8, three runs and no ablation are the same in spec, plan and tasks. The doctor body is 800 tokens (2,240 bytes) in plan and research. "Seven checks" in spec, plan, tasks, research, data-model and quickstart. No bare "hook" is left outside the literals `hooks` and `renderStatusHooks` | Pass |
| 11 | Constitution | None | Twenty rows answered; no row is a violation; row XII passes on the recommended answer of CQ-188 | Pass |
| 12 | Underspecification | Low | The bundling task of feature 119 was cited by its review item, because feature 119 had no such task yet | Resolved 2026-09-30: T064 of feature 119 cited |
| 13 | Underspecification | Low | The place of the log of the paid tasks (`evals-log/113/`) and the form of the configuration of a run are proposals of the plan; no contract of feature 100 names them | Reported |
| 14 | Traceability | None | `check-traceability.py --require-all`: passed | Pass |

Requirements: 42. Success criteria: 5. Tasks: 38. Split: none proposed (42 is under 45).

Findings 2 to 4 of the first report stand: they are gaps of feature 100 and were not part of the worklist of this feature.

## Second consistency pass

Date: 2026-09-30, after the cross-feature review and its repairs. Read-only pass of `/speckit-analyze` over spec.md, plan.md and tasks.md; the repairs it proposed were applied on the explicit approval of the user given with the request, and are recorded in `repair-report.md`, "Repairs of the second analyze pass".

| # | Category | Severity | Finding | Status |
|---|---|---|---|---|
| 15 | Inconsistency | Medium | The contracts table of the spec lacked annex F §F.3 (launch outcomes of F113-FR-003) and annex F §F.4 (`relaunch.owner` of F113-FR-013, F113-SC-004); the fixtures row lacked FX-35, cited by T015, T019, T024 and T026 | Repaired |
| 16 | Coverage | Medium | Four requirements with live-host `unverified` checks had no capture task: F113-FR-016, F113-FR-028, F113-FR-030, F113-FR-039 (T001 named seven ids only) | Repaired: T001 names them |
| 17 | Inconsistency | Low | `plan.md` said "8 kept behaviour items"; the spec carries 7 (the checker agrees: "27 items, 7 kept") | Repaired |
| 18 | Inconsistency | Low | The priority line of User Story 2 omitted the `relaunch.owner` `root` condition of F113-FR-013 | Repaired |
| 19 | Underspecification | Low | The 500-line limit of a skill body (F113-FR-036) appeared in no design point and no task wording | Repaired: design point "Skill body size" and T025 |
| 20 | Underspecification | Low | `checklists/requirements.md` is listed in the plan and absent (the directory is empty) | Open: left to the checklist workflow |
| 21 | Constitution | None | Twenty rows answered, no violation, Complexity Tracking empty; v3.0.1 noted with no answer change | Pass |
| 22 | Coverage | None | 42 of 42 requirements have at least one implementation task and one test task; every `test:` id of the spec maps to a task | Pass |

Requirements: 42. Success criteria: 5 (each with tasks). Tasks: 38. Split: none proposed (42 is under 45).

Findings 2 to 4 of the first report still stand: they are gaps of feature 100 (no command that evaluates the launch checks without launching; no command that writes a `host-event` request; no marker of a child of a run) and were not part of any worklist of this feature.

