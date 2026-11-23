# Specification Analysis Report: feature 124-harness-discovery-and-roles (after the split)

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `data-model.md`,
`research.md`, `quickstart.md`, `contracts/`, the constitution v3.0.0. This report replaces the
one written before the split. Groups G1 and G2 are now feature 146-harness-discovery.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| F1 | Coverage | MEDIUM | spec.md F124-FR-026 | The rule that a selection of the critic in project configuration is ignored stood in a requirement that left | Repaired: the rule is in F124-FR-026 and in its test task |
| F2 | Inconsistency | MEDIUM | tasks.md, quickstart.md | Tasks and scenarios of discovery, and references to them, stood in the files of this part | Repaired: taken out; tasks and scenarios numbered again; the references follow |
| F3 | Underspecification | MEDIUM | spec.md F124-FR-022, F124-FR-035 | Two readings rest on an open question of the queue (CQ-106, CQ-107) | Open by design |
| F4 | Coverage | MEDIUM | tasks.md, parity tests of C-054 and C-066 | The traceability files name FX-01 for B-0575 and B-0996; FX-01 approves every phase at the first try and cannot execute either line of the baseline. The tasks cite FX-01 and the scenario that does execute it | Open: a correction of the traceability files is reported |
| F5 | Coverage | LOW | spec.md F124-FR-031 | B-0640 is the usage text of the pass loop, which is no command of the port (ruling 26). The list is proven where the port prints it | Open: reported |
| F6 | Underspecification | LOW | spec.md "Rows of the `parity` profile" | Three rows are requested that annex X §X.7 does not hold (P-3, P-4, P-6) | Open: reported |
| F7 | Underspecification | LOW | spec.md "Contracts of feature 100 used" | Feature 100 holds no contract for the hand-over of the list of harnesses in memory; this part reads the list in the form of the field `harnesses` of annex C §C.6 | Open: reported |

No CRITICAL and no HIGH finding. No conflict with the constitution. The finding of the first
report on the register row is closed: the row is DV-104.

## Coverage summary

| Requirement key | Has task? | Task IDs |
|---|---|---|
| F124-FR-020 | Yes | T008, T021 |
| F124-FR-021 | Yes | T005, T006, T022 |
| F124-FR-022 | Yes | T034, T035 |
| F124-FR-023 | Yes | T008, T021 |
| F124-FR-024 | Yes | T004, T009, T020 |
| F124-FR-025 | Yes | T009, T010, T020 |
| F124-FR-026 | Yes | T019 |
| F124-FR-027 | Yes | T020 |
| F124-FR-028 | Yes | T016, T021, T038 |
| F124-FR-029 | Yes | T021 |
| F124-FR-030 | Yes | T021 |
| F124-FR-031 | Yes | T019 |
| F124-FR-032 | Yes | T017, T021 |
| F124-FR-033 | Yes | T017, T021 |
| F124-FR-034 | Yes | T018, T021 |
| F124-FR-035 | Yes | T018, T021, T022 |
| F124-FR-036 | Yes | T017, T021 |
| F124-FR-037 | Yes | T004, T023, T032 |
| F124-FR-038 | Yes | T002, T003, T004, T024, T030 |
| F124-FR-039 | Yes | T024, T030 |
| F124-FR-040 | Yes | T002, T003, T025, T031 |
| F124-FR-041 | Yes | T026, T032 |
| F124-FR-042 | Yes | T024, T030, T038 |
| F124-FR-043 | Yes | T027, T033 |
| F124-FR-044 | Yes | T027, T032 |
| F124-FR-045 | Yes | T036, T037 |
| F124-FR-046 | Yes | T036, T037 |
| F124-FR-047 | Yes | T004, T036, T037 |
| F124-FR-048 | Yes | T026, T032 |
| F124-FR-049 | Yes | T028, T033, T039 |
| F124-SC-001 | Yes | T001, T029 |
| F124-SC-004 | Yes | T036 |
| F124-SC-005 | Yes | T009 |
| F124-SC-006 | Yes | T008, T034 |
| F124-SC-008 | Yes | T007 |

As-is ids with a kept disposition, and the requirement that carries each. All seven stay in
this part; a script confirmed that each is in the `origin:` of a requirement and in the
`proves:` of a test task of exactly one of the two parts.

| As-is id | Requirement | Test |
|---|---|---|
| C-012; B-0188 | F124-FR-031 | PT-124-C-012-usage-list |
| C-057; B-0640 | F124-FR-031 | PT-124-C-057-usage-list |
| C-051; B-0467 | F124-FR-027 | PT-124-C-051-model-unset |
| C-054; B-0575 | F124-FR-029 | PT-124-C-054-unknown-proposer |
| C-060; B-0799 | F124-FR-026 | PT-124-C-060-critic-name |
| C-061; B-0845 | F124-FR-026 | PT-124-C-061-critic-variable |
| C-066; B-0996 | F124-FR-030 | PT-124-C-066-unknown-critic |

## Unmapped tasks

The tasks that create directories and closed sets, and the run of the quickstart, serve the
feature as a whole.

## Checks run

| Check | Result |
|---|---|
| Every requirement id unique; every id cited exists, apart from the moved ids in the table "Requirements moved to 146-harness-discovery" and in the notes that explain the gap | Pass |
| Every functional requirement has a `test:` field; every requirement with `origin:` has `disposition:` | Pass |
| Every test named in `spec.md` is a task of `tasks.md` | Pass |
| Every task follows the checklist format; ids run in order | Pass |
| No requirement, test or task of the other part is cited | Pass. Its ids appear only in the table of moved ids |
| Terms marked "never bare" | Pass. What is left are as-is literals and "a locally registered backend" |
| The name of the machine-specific registry entry | Absent from every file |
| `python3 docs/ecosystem/check-traceability.py` | No line `[h` names this feature |
| Twenty gates of the Constitution Check answered | Pass: 17 pass, 3 not applicable (IV, XIV, XX) |

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 30 (F124-FR-020 to F124-FR-049) |
| Success criteria | 5 (F124-SC-001, 004, 005, 006, 008) |
| Tasks | 40 |
| Coverage (requirements with at least one task) | 100 per cent |
| Ambiguity count | 2 (CQ-106, CQ-107) |
| Duplication count | 0 |
| Critical issues | 0 |

## Next actions

The work may proceed. Open points are for the orchestrator and are listed in the final report.

## After the cross-feature review

Date: 2026-09-30. Written by the repair agent of this feature from its section of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` (no item of its own, five pointers), the table "What
the other features must follow" of `specs/100-specstride/repair-report.md` and the follow-up of
feature 141. The details are in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Trigger of the critic-diversity warning (W-125-01) | F124-FR-045 states it once: the result `same-model` (both roles resolve to the same model, F100-FR-024) or the result `unverified`, and no other; a shared provider or model tier alone does not raise it | `spec.md`, `tasks.md` (T036), `quickstart.md`, `contracts/output-lines.json` |
| Name of the warning (W-100-15) | "critic-diversity warning" everywhere; `same-model` stays as a result of the diversity test, in the key `critic.warnSameModel` and in the field `sameModelWarning` | `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/parity-rows.json` |
| Pass limit (W-100-14) | "limit of passes" is "pass limit" in F124-FR-029 | `spec.md`, `tasks.md` (T013), `quickstart.md` |
| Profile rows (W-X-11) | Rows 90, 91 and 92 by number; the labels P-3, P-4 and P-6 are gone; the three keys are `confirmed` with their row | `spec.md`, `plan.md`, `research.md`, `contracts/parity-rows.json`, `contracts/config-keys.json`, `contracts/requirements.json`, `contracts/README.md` |
| Proofs of the carried items | B-0575 on `FX-18/unknown-harness-name`, B-0996 on `FX-07/unknown-harness-name`; B-0640 by the new characterization test `CT-124-50` (task T041), named in the `test:` line of F124-FR-031 | `spec.md`, `tasks.md`, `plan.md`, `quickstart.md` |
| Place of parity and characterization tests | `tests/parity/124/` and `tests/characterization/124/`, the rule of the plan of feature 100 | `plan.md`, `tasks.md` (T010 to T015, T041), `quickstart.md` |

Findings F4, F5 and F6 of the table above are closed by these changes. F3 and F7 stand.

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F124-FR-031 has T019 and the tests T015 and T041; F124-FR-045 has T036, T037 and T038 |
| Task without a requirement | None new. T041 proves C-057 and B-0640, which F124-FR-031 carries |
| Every test named in `spec.md` is a task | Pass: `CT-124-50` is T041. `PT-124-C-057-usage-list` stays in T015 as a skip with its reason |
| Every kept as-is id is in the `proves:` of a test task | Pass: B-0188 (T015), B-0640 (T041), B-0467 (T012), B-0575 (T013), B-0799 and B-0845 (T011), B-0996 (T014) |
| Terms | "critic-diversity warning" in every file; "same-model warning" is left in one place, the quoted user description in the head of `spec.md`, which is a record. "pass limit" in `spec.md`, `tasks.md` and `quickstart.md` |
| Values | Row 92: default `true` in `spec.md` and in `contracts/parity-rows.json`, as annex X §X.7 and the key list of feature 110 give it (it was "on") |
| Ids | No id renumbered or reused. T041 is appended and stands among the tests of US3, so the ids of `tasks.md` no longer run in order in that one place |
| `contracts/requirements.json` | Generated again from `spec.md`; the same script gave the file of before the repair byte for byte |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 30 (F124-FR-020 to F124-FR-049) |
| Success criteria | 5 |
| Tasks | 41 |
| Coverage (requirements with at least one task) | 100 per cent |
| Open questions of the queue | 2 (CQ-106, CQ-107); CQ-191 is read on its recommended answer and changes nothing here |
