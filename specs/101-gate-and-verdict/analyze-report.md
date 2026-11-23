# Specification Analysis Report: Gate and verdict (feature 101), after the split

**Date**: 2026-09-29. **Artifacts**: spec.md, plan.md, tasks.md, with research.md, data-model.md,
contracts/ and quickstart.md. **Constitution**: v3.0.0.

This report replaces the report of the feature before the split. Group G4 left for
`149-attempt-planner-and-seams`; the table "Requirements moved to 149-attempt-planner-and-seams"
of the spec holds the ids. One run after the split found S1 to S3, which were repaired; a second
run found nothing new.

Coverage of as-is ids was checked by a script of this feature, as the split asks: each of the 27
as-is requirements and success criteria and of the 157 behaviour items that the traceability
files assign to feature 101 is in an `origin:` and in a `proves:` of exactly one part of the
split, and that part is this one. `python3 docs/ecosystem/check-traceability.py` prints no line
`[h…]` that names feature 101.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| S1 | Inconsistency | MEDIUM | spec.md F101-FR-009, F101-FR-031 | Two requirements that stay named requirements that left | Repaired: they name feature 100 annex E §E.1 and F100-FR-136 |
| S2 | Underspecification | MEDIUM | spec.md F101-FR-017, F101-FR-024; tasks.md T065, T085 | With the planner gone, nothing said who plans the next phase attempt and how the planner learns that an accelerated phase attempt is due | Repaired: the engine calls `next` of annex E §E.1 and hands two facts to it |
| S3 | Inconsistency | LOW | tasks.md, `proves:` of five test tasks | A success criterion id inside `proves:` reads to the coverage script as a cluster id (`SC-005` holds `C-005`) | Repaired: success criteria stand in a field `criterion:` |
| G1 | Gap in feature 100 | MEDIUM | spec.md F101-FR-024; annex E §E.1 "Inputs" of `next` | The inputs of `next` do not name the two facts (a diagnosis was made; an accelerated phase attempt is due) through which the two parts of the split meet | Open: reported |
| U1 | Underspecification | MEDIUM | spec.md F101-FR-035 | What the approval commit holds of the state | Open: CQ-171 |
| U2 | Underspecification | MEDIUM | spec.md F101-FR-032 | Whether the refusal for ticked phases is active under the `parity` profile | Open: CQ-172; a row of the profile is needed |
| C1 | Conflict with feature 100 | MEDIUM | spec.md F101-FR-012; F100-FR-139 | The as-is verdict record and feedback hold the nonce in clear after the return | Open: CQ-173 |
| C2 | Conflict with feature 100 | MEDIUM | spec.md F101-FR-036; F100-FR-148 | Exits 1 (internal), 3 (invalid input), 5 and 70 have no member of the enumeration of stop reasons | Open: CQ-174 |
| G2 | Gap in feature 100 | LOW | spec.md "Closed sets" | Three closed sets of this feature have no row in annex X §X.6 | Open: reported |
| G3 | Gap in feature 100 | LOW | spec.md F101-FR-022; register row DV-100 | The switch of the block set of the critic prompt has no row number in annex X §X.7 that this feature could name | Open: reported |
| D1 | Brief against the split | LOW | `feature-briefs.md` D.5; spec.md Success Criteria | The criterion "the critic never approves its own session", which the brief assigns to 101, left with the requirement of the critic strategy | Open: reported; the orchestrator moves the assignment |
| A1 | Ambiguity | LOW | plan.md Performance Goals | The two time values are starting values with low confidence | Accepted |

No finding is CRITICAL or HIGH. No duplication was found.

## Coverage Summary

A test task is mapped to a requirement either because it names the requirement, or because its
`proves:` names an as-is id that the `origin:` of the requirement holds.

| Requirement | Has task? | Task ids |
|---|---|---|
| F101-FR-001 | Yes | T026, T037, T047 |
| F101-FR-002 | Yes | T019, T031, T032, T036, T073, T075 |
| F101-FR-003 | Yes | T019, T037, T053 |
| F101-FR-004 | Yes | T031, T038 |
| F101-FR-005 | Yes | T031, T035, T039 |
| F101-FR-006 | Yes | T007, T013, T020 |
| F101-FR-007 | Yes | T008, T011, T020, T030 |
| F101-FR-008 | Yes | T009, T023, T035 |
| F101-FR-009 | Yes | T027, T028, T040 |
| F101-FR-010 | Yes | T040, T051, T059, T069 |
| F101-FR-011 | Yes | T031, T040, T070 |
| F101-FR-012 | Yes | T014, T021, T029, T042, T061 |
| F101-FR-013 | Yes | T028, T029, T039 |
| F101-FR-014 | Yes | T048, T049, T058, T062, T065, T068 |
| F101-FR-015 | Yes | T051, T065 |
| F101-FR-016 | Yes | T050, T066 |
| F101-FR-017 | Yes | T065, T080 |
| F101-FR-018 | Yes | T022, T037 |
| F101-FR-019 | Yes | T014, T080 |
| F101-FR-020 | Yes | T081, T084 |
| F101-FR-021 | Yes | T077, T079, T083, T084 |
| F101-FR-022 | Yes | T081, T082, T084 |
| F101-FR-023 | Yes | T029, T084 |
| F101-FR-024 | Yes | T078, T079, T083, T085 |
| F101-FR-025 | Yes | T080, T082, T085 |
| F101-FR-026 | Yes | T057, T085 |
| F101-FR-027 | Yes | T052, T060, T067 |
| F101-FR-028 | Yes | T005, T010, T012, T101 |
| F101-FR-029 | Yes | T021, T033, T043, T073 |
| F101-FR-030 | Yes | T043, T071 |
| F101-FR-031 | Yes | T070, T074, T075 |
| F101-FR-032 | Yes | T072, T076, T104 |
| F101-FR-033 | Yes | T033, T044 |
| F101-FR-034 | Yes | T024, T045 |
| F101-FR-035 | Yes | T025, T046 |
| F101-FR-036 | Yes | T016, T062 |
| F101-FR-037 | Yes | T053, T062, T068 |
| F101-FR-038 | Yes | T017, T055 |
| F101-FR-039 | Yes | T018, T056 |
| F101-FR-040 | Yes | T015, T063 |
| F101-FR-041 | Yes | T064, T069 |
| F101-SC-002 | Yes | T035 |
| F101-SC-003 | Yes | T062 |
| F101-SC-004 | Yes | T070 |
| F101-SC-005 | Yes | T107 |
| F101-SC-008 | Yes | T102 |
| F101-SC-009 | Yes | T101 |

As-is coverage: 27 of 27 as-is requirements and success criteria; 17 of 17 clusters; 157 of 157
behaviour items (142 by their own id, 15 by their cluster alone).

## Citations of the other part of the split

The ids of the second part appear only in the table "Requirements moved to
149-attempt-planner-and-seams", which the split asks for. No requirement, task or contract of
this feature names a requirement or a test of the second part.

## Constitution Alignment

No issue. The plan answers all twenty gates; none is ❌.

## Unmapped Tasks

None that lacks a requirement. T001 to T004, T006, T105 and T106 are set-up and review tasks.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 41 (F101-FR-001 to F101-FR-041) |
| Success criteria | 6 (F101-SC-002 to -005, -008, -009) |
| Tasks | 89 (T001 to T107 with gaps) |
| Tasks with `proves:` | 50 |
| Requirements with at least one task | 47 of 47 (100 per cent) |
| Ambiguities | 1 (A1) |
| Duplications | 0 |
| Critical issues | 0 |
| Findings repaired | 3 |
| Findings open, reported | 8 |

## Next Actions

- No CRITICAL finding. The feature is below the limit of about 45 requirements and can go to implementation.
- If an answer differs from the recommendation: CQ-171 changes F101-FR-035 and T025; CQ-172 changes F101-FR-032 and T072; CQ-173 changes F101-FR-012, the verdict record of data-model.md and T029; CQ-174 changes F101-FR-036 and T062.

## After the cross-feature review

Dated 2026-09-30. Written by the repair agent of feature 101 from its section of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md`, the table "What the other features must follow" of
`specs/100-specstride/repair-report.md`, and the follow-up report of feature 141. The items and
their states are in `repair-report.md`.

### What changed

| File | Change |
|---|---|
| `spec.md` | F101-FR-010 (a missing credential of the critic, `assumption: CQ-187`), F101-FR-020 (the form of the diagnostician, the hiding of the proposer's files, the critic-diversity warning), F101-FR-009 and F101-FR-017 (`ep:` lines of EP-18), F101-FR-007 and F101-FR-008 (test CT-101-32), F101-FR-032 (row 129); F101-FR-052 added (the one ingress); the row of exit 0 of the table of halts; user story 2, three edge cases, F101-SC-003; the sections "Threats" and "Repairs after the cross-feature review"; rows 251, 252 and 255 in "Closed sets"; one row in "Rows of the `parity` profile"; CQ-187 in "Assumptions" |
| `contracts/gate-halts.json`, `contracts/README.md` | `retryable` is false for exit 0; the scenarios of FX-07 are named one by one |
| `plan.md` | The version of the constitution; rows III, IX, XVII and XVIII; the count of requirements; the place of the own tests; no import of `node:fs`; the note under Complexity Tracking |
| `tasks.md` | T108 to T114 appended; T006 without a path of a machine; `proves:` of T102; T053, T084 and T104 reworded; the own tests moved from `tests/own/101/` to `packages/core/test/101/` |
| `data-model.md`, `quickstart.md`, `research.md` | The end of `FX-07/missing-key`; the record of the call of the diagnostician; the new tests; the risk row of CQ-187 |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F101-FR-052: T110 (test), T112. F101-FR-010: T109 (test), T111, beside T040, T059 and T069. F101-FR-020: T113 (test), T084 |
| Task without a requirement | None. T108 proves F101-FR-007 and F101-FR-008; T114 covers F101-FR-030 and F101-SC-005 (Principle XVII) |
| New test without a task | None: CT-101-30 (T109), CT-101-31 (T113), CT-101-32 (T108), CT-101-33 (T110); each is named in the `test:` line of its requirement and in the table "Coverage of tests" |
| Values that differ between the files | None found. Exit 1 and `critic_unavailable` for `FX-07/missing-key` under the `parity` profile stand in `spec.md`, `contracts/gate-halts.json`, `quickstart.md`, `data-model.md` and T109; `retryable` false for exit 0 stands in the spec, the contract and the quickstart |
| Terms | "critic-diversity warning" only; no "same-model warning". The counted unit "pass" was not touched; the word "iteration" stands once, in `contracts/as-is-literals.md`, as the name of an as-is variable |
| Tier 2 rule | F101-FR-020 and F101-FR-052 cite feature 100 (F100-FR-088, F100-FR-024, F100-FR-009, F100-FR-205) and no requirement of features 117 or 111, although the worklist names F117-FR-040 and F111-FR-023 |
| Register rows | `divergence:` lines name existing rows only (DV-081 and DV-095 are new here). The row that F101-FR-010 needs is named in its `assumption:` line and in the table of the profile as "DV-117, reported", because the coverage check refuses `DV-new` in a `divergence:` line |
| Paid calls | No new task calls a model. `preflight` makes no paid call |

### Metrics after the repair

| Metric | Value |
|---|---|
| Functional requirements | 42 (F101-FR-001 to F101-FR-041, F101-FR-052) |
| Success criteria | 6 |
| Tasks | 96 (T001 to T114 with gaps) |
| Tasks with `proves:` | 55 |

### Open

- The register row and the row of the profile for F101-FR-010 (CQ-187) do not exist yet.
- `checklists/requirements.md` and the earlier sections of this report are records of earlier steps and keep the count 41.

## Analyze run of 2026-09-30, after the repair

Constitution v3.0.1. Checked against the sources, not inferred: every `F100-FR-*` and `DV-*` id
that this feature cites exists; every logical name of `data-model.md` is in the layout of feature
100; the rows of annex X §X.6 and §X.7 that the spec names exist; `check-traceability.py` gives
157 of 157 items for feature 101; every `CT-101-*` and `PT-101-*` of a `test:` line has a task.
No finding is CRITICAL or HIGH. All nineteen findings were fixed in the same run at the owner's
request; the traceability check was run again afterwards and still gives 157 of 157.

| ID | Category | Severity | Location(s) | Summary | Fix |
|----|----------|----------|-------------|---------|-----|
| I1 | Inconsistency | MEDIUM | spec F101-FR-010, table of the profile; plan XVIII; T104 | DV-117 and its profile row were still "reported" or "needed"; both exist (register DV-117; annex X §X.7 row 133; annex E §E.1) | `divergence: DV-117` added to F101-FR-010; row 133 named in the `parity:` and `assumption:` lines, the profile table, the contracts table, plan XVIII and T104 |
| I2 | Inconsistency | MEDIUM | spec F101-FR-028 vs data-model.md | The list of files this feature writes omitted the record of a phase attempt, the accelerator snapshot, the archive at approval and the approval key | The four added to the list |
| U1 | Underspecification | MEDIUM | data-model.md; T002 | The accelerator snapshot and the archive at approval had no fields and no schema task | Field table of the snapshot and a description of the archive added; T002 names the snapshot and says the archive needs no schema |
| I3 | Inconsistency | MEDIUM | plan (technology choices, T046, T085) vs spec EP table | The plan runs the version-control tool through EP-05; the spec declared EP-05 for result records only | The EP-05 row and the contracts table name the fixed-argv calls for F101-FR-026 and F101-FR-035; the plan has a row for the approval commit |
| I4 | Inconsistency | MEDIUM | plan source tree vs T001, T002 to T005, T017, T018, T047, T104, T112 | Files of the tasks were missing from the tree (`gate/events.ts`, `gate/lines.ts`, `engine/index.ts`, index files) or outside it (`packages/contracts/`, `tools/import-boundary/`) | Tree and Structure Decision extended |
| I5 | Inconsistency | MEDIUM | T036 (US1) needed T074 (US3) | The start position reads verified records; the verification was a task of user story 3, which depends on user story 1 | T074 moved to user story 1 after T043, id kept; T075 and the tables of dependencies and of the parallel example follow |
| A1 | Ambiguity | MEDIUM | F101-SC-002, user story 1, T035 vs F101-FR-005 | The criterion assumed that the verification gate ran on every phase attempt; F101-FR-005 binds only mode `required` | "ran, or was not required by the verification mode of the run" in the three places |
| I6 | Inconsistency | LOW | plan.md, spec.md sources | Constitution v3.0.0 cited; v3.0.1 is current | Citations bumped |
| I7 | Inconsistency | LOW | F101-FR-039 | The `disposition:` line named items that the `origin:` line did not | The five items of cluster C-065 added to `origin:` |
| I8 | Inconsistency | LOW | tasks.md dependency table | "9 Polish" for phase 7 | Renumbered |
| I9 | Inconsistency | LOW | F101-FR-022; "Rows this feature reads" | "The row that register row DV-100 names" is row 58 of annex X §X.7 | Row 58 named (closes G3 of the earlier run) |
| I10 | Inconsistency | LOW | data-model.md vs spec "Closed sets" | The `outcome` of the record of a phase attempt is a closed set the spec did not list (F100-FR-208) | Row added to the spec; row 278 of annex X §X.6 added the same day, contracts regenerated |
| A2 | Ambiguity | LOW | F101-FR-021, F101-FR-024 | "Enabled by default; only the value that means true enables it" read as contradictory | "The default of its setting is the literal that means true, and any other literal disables it" |
| A3 | Ambiguity | LOW | F101-FR-038 vs the as-is fields `reason`, `error`, `note` | "No event holds a reply" against fields that carry excerpts of a reply | "A reply in full; the excerpts pass the one ingress first (F101-FR-052)" |
| U2 | Underspecification | LOW | F101-FR-018 | The failing branch of release verification was stated only in F101-FR-003 and the table | One sentence added |
| U3 | Underspecification | LOW | F101-FR-032; CQ-174 | The refusal had no row of the table of halts and no stop reason | F101-FR-032 says it is no halt of the phase gate and its terminal record carries no stop reason; CQ-174 lists it |
| U4 | Underspecification | LOW | F101-FR-010; out-of-scope table | Principle VIII asks that a missing credential fail before the first pass; the launch-time preflight is feature 124's and was not named | Out-of-scope row of 124 extended; F101-FR-010 says the check at the phase gate is the last line |
| U5 | Underspecification | LOW | F101-FR-022 | Caps scale by a context window that Principle IX allows no default for; nothing said why it is known | F101-FR-022 says role resolution (feature 124) admits no candidate whose window is unknown; the out-of-scope row of 124 names the rule |
| D1 | Duplication | LOW | F101-FR-010, edge case, halts table, profile table | The missing-credential rule was restated four times | The halts row now cites F101-FR-010 instead of restating the rule |
| A4 | Ambiguity | LOW | plan Performance Goals | Starting values of low confidence (A1 of the earlier run) | The plan says they are pinned after the first run of the oracle (T107) |

Of the earlier run: G1 is closed (annex E §E.1 gives `next` the two facts), G2 is closed (rows
251, 252, 255), G3 is closed by I9. CQ-171, CQ-172, CQ-173 and CQ-174 stay open assumptions of
the spec, as before. D1 of the earlier run (the brief) is unchanged.

Nothing is open for feature 100: row 278 of annex X §X.6 (I10) was added in the same run.

### Coverage after the run

48 of 48 requirements and success criteria have at least one task (42 functional requirements,
6 success criteria); 96 tasks (T001 to T114 with gaps), 54 test tasks with `proves:`. The
coverage table of the earlier run holds, with T108 (F101-FR-007, F101-FR-008), T109 and T111
(F101-FR-010, F101-SC-003), T110 and T112 (F101-FR-052), T113 (F101-FR-020), T114
(F101-FR-030, F101-SC-005), and T074 now in user story 1.
