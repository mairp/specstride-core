# Specification Analysis Report: Detached runtime (feature 122)

Date: 2026-09-29. Artifacts: `spec.md`, `plan.md`, `tasks.md`, with `research.md`,
`data-model.md`, `contracts/` and the constitution v3.0.0. Two runs: the first found the rows
below; the repairs were made; the second run found no row of severity MEDIUM or above that is
open. `python3 docs/ecosystem/check-traceability.py` prints no line that starts with `[h` and
names feature 122 or one of its requirement ids.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|---|---|---|---|---|---|
| E1 | Coverage | MEDIUM | tasks.md T038, T049, T061 | Test names were given as ranges ("CT-122-4 to CT-122-9"), so eight tests named in `spec.md` did not appear in `tasks.md` by name | Repaired: every name is written out |
| E2 | Coverage | MEDIUM | tasks.md T019, T022, T037 | F122-FR-012, F122-FR-042 and F122-SC-006 were proven by a task that named only the as-is ids | Repaired: the ids are in `proves:` |
| F1 | Inconsistency | MEDIUM | spec.md F122-FR-040; research.md D-14 | The spec counted eight cases per platform and listed only four (session × sandbox); the research had the third dimension, how the session ends | Repaired in `spec.md` |
| F2 | Inconsistency | MEDIUM | spec.md F122-FR-024, F122-FR-027; research.md D-9 | The run token was "minted per run" in the spec and per launch in the plan. A token that is never on disk cannot be known to a later launch | Repaired in `spec.md`: minted at every launch; the hashes of earlier launches stay in the records |
| C1 | Underspecification | LOW | tasks.md T071 | The task named no file path | Repaired |
| B1 | Ambiguity | LOW | spec.md F122-FR-021 | "does not grow with the length of the path" has no number in the spec; the number (100 bytes) is in research D-3 and rests on an unmeasured limit | Open by design: T009 measures; status `unverified` |
| F3 | Inconsistency with the brief | LOW | spec.md F122-FR-003; brief heading 4 | The brief puts the strategy in use in the run record; feature 100 has it in the launch record only | Open: reported to the orchestrator; the spec follows feature 100 |
| F4 | Fixture assignment | LOW | tasks.md T025, T026, T036, T037, T059 | Five tests cite a fixture family beside the one the traceability files name (FX-35, FX-16, FX-36, FX-12), because the evidence line is reached there | Open: the exercise map of feature 141 confirms or corrects |
| D1 | Constitution | — | plan.md | No conflict with a principle. Principle I was checked for the liveness endpoint: it carries no data | — |

## Coverage Summary

| Requirement | Has task? | Task ids |
|---|---|---|
| F122-FR-001 to F122-FR-003 | Yes | T035, T036, T040, T041, T047 |
| F122-FR-004 to F122-FR-009 | Yes | T038, T045, T046 |
| F122-FR-010 | Yes | T014, T017 |
| F122-FR-011 | Yes | T018, T019, T020, T021, T028, T033 |
| F122-FR-012 | Yes | T022, T033 |
| F122-FR-013 | Yes | T011, T017, T024, T025, T030, T067 |
| F122-FR-014 | Yes | T023, T025, T029, T039, T042 |
| F122-FR-015 | Yes | T018, T031 |
| F122-FR-016 | Yes | T017, T027 |
| F122-FR-017 | Yes | T017, T026, T030 |
| F122-FR-018 | Yes | T043, T044 |
| F122-FR-019 | Yes | T027, T032 |
| F122-FR-020 | Yes | T027, T046 |
| F122-FR-021 | Yes | T009, T027, T029 |
| F122-FR-022 | Yes | T015, T016 |
| F122-FR-023 to F122-FR-025 | Yes | T049, T050, T053, T054, T055 |
| F122-FR-026, F122-FR-027 | Yes | T051, T056, T057, T058 |
| F122-FR-028 | Yes | T052, T057 |
| F122-FR-029, F122-FR-030 | Yes | T059, T060 |
| F122-FR-031, F122-FR-032 | Yes | T039, T042, T046 |
| F122-FR-033 to F122-FR-036 | Yes | T061, T063, T064 |
| F122-FR-037 | Yes | T062, T065 |
| F122-FR-038 | Yes | T062, T066 |
| F122-FR-039 | Yes | T015, T016 |
| F122-FR-040, F122-FR-041 | Yes | T001 to T005, T047, T048 |
| F122-FR-042 | Yes | T037 |
| F122-SC-001 | Yes | T002 |
| F122-SC-002 | Yes | T018 |
| F122-SC-003 | Yes | T062 |
| F122-SC-004 | Yes | T051 |
| F122-SC-005 | Yes | T050 |
| F122-SC-006 | Yes | T019 |
| F122-SC-007 | Yes | T038 |

As-is coverage:

| As-is id | Requirement | Test task |
|---|---|---|
| 028 FR-004 | F122-FR-011 | T019 |
| C-007 | F122-FR-017 | T026 |
| C-009 | F122-FR-011 | T020 |
| C-011 | F122-FR-014 | T023 |
| C-012 | F122-FR-011 | T021 |
| C-013 | F122-FR-012 | T022 |
| C-113, C-115 | F122-FR-013 | T024 |
| C-229 | F122-FR-014 | T025 |
| C-255 | F122-FR-001, F122-FR-013, F122-FR-042 | T025, T036, T037 |

**Unmapped tasks**: T006 to T008 (setup), T069 (byte budget, Principle XIX), T070 (quickstart).
They serve every requirement and none alone.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 42 |
| Success criteria | 7 |
| Tasks | 71 |
| Requirements with at least one task | 49 of 49 (100 per cent) |
| Ambiguities open | 1 (B1, LOW) |
| Duplications | 0 |
| Critical issues | 0 |
| Repairs made | 2 rounds; 5 findings repaired |

## Split

No split is proposed. `speckit-specify` yielded 42 functional requirements, which is under the
mark of about 45.

| Group | Requirements | Count |
|---|---|---|
| G1 | F122-FR-001 to F122-FR-009 | 9 |
| G2 | F122-FR-010 to F122-FR-022 | 13 |
| G3 | F122-FR-023 to F122-FR-032, F122-FR-042 | 11 |
| G4 | F122-FR-033 to F122-FR-041 | 9 |

If a later change takes the feature above the mark, G4 without the spike (F122-FR-033 to
F122-FR-039, tests CT-122-33 to CT-122-39, no as-is origin) is the group that can leave.

## Next actions

| Action | Owner |
|---|---|
| Run the spike (T001 to T005) before the specification is frozen | The owner; paid cases are logged |
| Add the six rows to annex X §X.7 and the six new closed sets to annex X §X.6 | Orchestrator, in feature 100 |
| Rule on CQ-138 to CQ-140 | Owner, in the clarification round |

## After the cross-feature review

Date: 2026-09-30. Source: `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section of feature 122, the
table "What the other features must follow" of `specs/100-specstride/repair-report.md`, and
section 2.4 of `specs/141-parity-oracle/followup-report.md`. The items and their states are in
`repair-report.md`.

### What changed

| Subject | Files |
|---|---|
| The line of `launch` is `[SPECSTRIDE-LAUNCH]` with `run`, `state`; every refusal, of `launch` and of a state command, is `[SPECSTRIDE-REFUSE]` with `action`, `reason`, `next`; `[SPECSTRIDE-STATE]` stays the line of a state command that succeeded | `spec.md` (F122-FR-005, F122-FR-036, scenarios), `contracts/cli-state-commands.md`, `quickstart.md`, `tasks.md` (T074) |
| New requirement F122-FR-043: the layout version file `workspace:layout-version` | `spec.md`, `plan.md`, `data-model.md`, `quickstart.md`, `tasks.md` (T072, T073) |
| Row XII of the Constitution Check: the spike is a paid, logged task and no test | `plan.md`, `tasks.md` (note at T004, dependency table), `quickstart.md` |
| Fixtures: FX-35 for B-2588; FX-36 for B-2760 (`gate-attach`), B-2764, B-2769; FX-11 no longer cited for the four items of mixture-of-loops | `spec.md`, `tasks.md` (T025, T036, T037), `plan.md`, `quickstart.md` |
| "engine start" for one start of the engine | `spec.md` (F122-FR-030, User Story 5), `tasks.md` (T059), `quickstart.md` |
| EP-14: `implements (an entry)` | `spec.md`, `plan.md` |
| Keys, rows and ids in the contract files: `state.dir`; rows 41, 113 to 116 of §X.7; rows 209 to 214 of §X.6; `$id` of the archive schema | `contracts/parity-rows.json`, `contracts/closed-sets.json`, `contracts/state-archive.schema.json`, `contracts/README.md`, `spec.md` |
| Package and places: `@specstride/runtime` is L5, L4; suites in `packages/testkit/src/conformance/EP-nn/`, samples in `packages/testkit/src/samples/EP-nn/`; CT-122-101 to CT-122-104 in `tests/characterization/122/` | `plan.md`, `tasks.md` (T017, T035, T049) |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F122-FR-043 has T072 (test, `proves:`) and T073 |
| Task without a requirement | None among the new tasks: T072, T073 serve F122-FR-043; T074 serves F122-FR-005 and F122-FR-036 |
| Test name of `spec.md` missing in `tasks.md` | None. CT-122-43 is in T072 |
| Label of a refusal | One spelling in `spec.md`, `contracts/cli-state-commands.md`, `quickstart.md` and `tasks.md` |
| Key of the control root | `state.dir` in `spec.md` and `contracts/parity-rows.json`. `research.md` D-13 keeps `state.controlRoot`: W-X-35 accepts it as history and asks for no change. It is the one place where the files differ |
| Count of requirements | 43 in `spec.md` and in `plan.md`. The metrics table of the first report above (42 requirements, 71 tasks) is the state of 2026-09-29 |
| Paid tasks | T002 and T003 only. No test has them as a precondition: T004 passes on results `skipped` with the reason "not run" |
| Open set "lock and liveness providers" | `contracts/closed-sets.json` kept `"row": null` for it. Resolved on 2026-09-30 (re-check B-8.7): annex X §X.6 row 277 holds the open registry; the file and `spec.md` cite it |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 43 |
| Success criteria | 7 |
| Tasks | 74 |
| Requirements with at least one task | 50 of 50 |

## Run of 2026-09-30 (third run)

24 findings (0 critical, 0 high, 8 medium, 16 low). 20 repaired in `spec.md`, `plan.md` and `tasks.md`; 3 accepted (A1, B1, B2); 1 resolved by an upstream proposal (C2, below), under which this feature is already written.

## Proposed upstream fixes

### C2 — a refusal for a control root that another user can write

F122-FR-022 requires refusing a control root that another user can write, but closed set 212 had no member for it. `control-root-not-writable` means the opposite fault, so it can't be reused. This feature now uses the new member `control-root-unsafe` (`spec.md` F122-FR-022 and "Closed sets", `contracts/closed-sets.json`, `contracts/cli-state-commands.md`, `tasks.md` T016).

| Target | Section | Change |
|---|---|---|
| `specs/100-specstride/annexes/X-cross-layer.md` | §X.6, row 212 | Append `` `control-root-unsafe` `` to the members, after `` `launch-abandoned` ``. The other cells stay as they are |
| `specs/100-specstride/contracts/data/closed-sets.json` | entry `"number": 212` | Append `, \`control-root-unsafe\`` to `members`, and append `"control-root-unsafe"` to `literals` |
| `specs/100-specstride/contracts/annex-tables/X-cross-layer.json` | row `"212"` | Append `` , `control-root-unsafe` `` to the members cell |
| `specs/100-specstride/annexes/F-runtime-root.md` | §F.3, outcome table | No change. Every member of row 212 except `lock-conflict` and `lock-unknown` already exits 4 |

Why: annex B §B.1 (F100-FR-043) requires the control plane to be owner-only. Refusing to use it is the only safe answer, and a refusal written into the launch record has to be a member of the closed set. The exit code 3 for a state command follows F122-FR-036: the control root comes from the key `state.dir`, so an unsafe control root is invalid input.
