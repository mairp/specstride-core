# Specification Analysis Report: Harness seam (feature 109)

**Date**: 2026-09-29. **Artifacts**: `spec.md`, `plan.md`, `tasks.md`, with `research.md`,
`data-model.md`, `quickstart.md` and `contracts/`. **Constitution**: v3.0.0.

The analysis ran three times: the first run, and one run after each of two repairs. The third run
found nothing of severity MEDIUM or above. Afterwards `python3 docs/ecosystem/check-traceability.py`
printed no line `[h…]` that names feature 109 or an id `F109-…`.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|---|---|---|---|---|---|
| E1 | Coverage | HIGH | `spec.md` F109-FR-005, -006, -010, -027, -031, -032, -033, -034; `tasks.md` | 13 test names of `test:` fields (for example `PT-109-C-033-*`, `PT-109-C-009-*`) had no test task of that name: one task per requirement carried one name only | Repaired in round 1: a task names every test it holds, one name per origin |
| E2 | Coverage | MEDIUM | `tasks.md`, 15 parity test tasks | A parity test named as-is ids in `proves:` and did not say which requirement it serves | Repaired in round 1: field `requirement:` |
| F1 | Inconsistency | MEDIUM | `spec.md` F109-FR-017, F109-FR-039, F109-FR-044, Assumptions; `plan.md`; `research.md`; `data-model.md`; `quickstart.md` | Terms marked "never bare" were written bare: "adapter" (2), "attempt" in the sense of a try (6), "contract" (1), "gate" (1) | Repaired in round 1 |
| F2 | Inconsistency | MEDIUM | `tasks.md`, the task of the overlay policy | The test cited FX-26 together with the surface `home`, which FX-26 does not have (feature 141, §O.2) | Repaired in round 2: FX-01 and FX-39 |
| C1 | Underspecification | MEDIUM | `tasks.md` | Ten scenarios that the parity tests need (for example a stale overlay, an invalid scope value, a missing executable) are not in the first set of feature 141 | Repaired in round 2: task T006 adds them inside the scope of their families (CQ-027 of the clarify queue, recommended answer) |
| F3 | Inconsistency | LOW | `spec.md` Clarifications | The number of rows of the divergence register was given as 94; it is 97 | Repaired before round 1 |
| B1 | Ambiguity | LOW | `spec.md` F109-FR-023 | "A small set" of bundled descriptors has no number. The brief says the same; the set is data and the requirement is tested per descriptor | Open, accepted |
| B2 | Ambiguity | LOW | `plan.md` Performance Goals | The values are starting values with low confidence; task T105 measures them | Open, accepted |
| D1 | Constitution | — | `plan.md` | No conflict. The critic with read-only tools is the exception that Principle IX itself states | — |
| A1 | Duplication | LOW | `spec.md` F109-FR-003 to F109-FR-041 and feature 100, annex C | 16 requirements restate a rule of feature 100 from the side of the content owner (the core side, the generic harness adapter). Each cites the section. No text contradicts the annex | Open, accepted: the brief assigns the content of EP-02 to this feature |

## Coverage Summary

| Requirement key | Has task? | Test tasks | Implementation tasks |
|---|---|---|---|
| F109-FR-001 | Yes | PT-109-028FR021-registry, PT-109-C-035-claude-entry | The task after the test; T002 |
| F109-FR-002 | Yes | CT-109-2, CT-109-101 | The task after the test |
| F109-FR-003, F109-FR-004 | Yes | CT-109-3, CT-109-4 | The task after each test; T001 |
| F109-FR-005 to F109-FR-008 | Yes | The parity tests of queries, display, entry defaults and dispatch; CT-109-8 | The task after each test |
| F109-FR-009, F109-FR-010 | Yes | CT-109-9, CT-109-102; the parity tests of the critic-class call | The task after each test |
| F109-FR-011, F109-FR-012, F109-FR-013 | Yes | CT-109-11, CT-109-12, CT-109-13 | The task after each test |
| F109-FR-014, F109-FR-015 | Yes | CT-109-14, CT-109-15 | The task after each test |
| F109-FR-016 to F109-FR-023 | Yes | One test per requirement, and CT-109-103, CT-109-104 | The task after each test |
| F109-FR-024, F109-FR-025 | Yes | CT-109-24, CT-109-25 | The task after each test |
| F109-FR-026 to F109-FR-036 | Yes | CT-109-26, CT-109-28 and the parity tests of the overlay | The task after each test |
| F109-FR-037 to F109-FR-040 | Yes | CT-109-37 to CT-109-40 | The task after each test |
| F109-FR-041 to F109-FR-044 | Yes | CT-109-41 to CT-109-44 | The task after each test |
| F109-SC-001 to F109-SC-007 | Yes | CT-109-43, CT-109-8, CT-109-40, CT-109-105, CT-109-42, CT-109-106, CT-109-107 | — |

The fields `proves:`,
`requirement:` and `covers:` of `tasks.md` are the authority.

As-is coverage, from the coverage script and from `contracts/traceability.json`:

| Subject | Assigned | Kept | In an `origin:` | In a `proves:` |
|---|---|---|---|---|
| As-is requirements and criteria | 3 | 2 | 2 | 2 |
| Clusters | 21 | 21 | 21 | 21 |
| Behaviour items | 94 | 75 | 75 | 75 |
| Not carried (`superseded-by`) | 1 criterion, 19 items | — | Listed in "As-is behaviour not carried" | — |

## Constitution Alignment Issues

None.

## Unmapped Tasks

None. Every task carries `proves:` or `covers:`.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 44 |
| Success criteria | 7 |
| Tasks | 106 (US1 20, US2 18, US3 10, US4 21, US5 8, setup 6, foundational 17, polish 6) |
| Requirements with at least one task | 51 of 51 (100 per cent) |
| Functional requirements with a test task and an implementation task | 44 of 44 |
| Ambiguities open | 2, LOW |
| Duplications open | 1, LOW |
| Critical issues | 0 |

## Split

Not proposed. The specification holds 44 functional requirements, which is below the threshold
of about 45 (`STAGE-B-RULES.md` section 5). If the orchestrator wants the feature smaller, the cut
that the groups of heading 7 of the brief allow is G3 without the critic forms, that is the
overlay: F109-FR-029 to F109-FR-036, with the origins 028 FR-028, C-007 (B-0059), C-009, C-026 to
C-031, C-052 (B-0511, B-0512), C-054 (B-0579 to B-0583), C-056, C-057, C-058 (all but B-0683 and
B-0685) and C-066 (B-0992), and with the parity tests of the overlay on FX-39.

## What did not pass after two repairs

Nothing of severity MEDIUM or above. The three LOW findings B1, B2 and A1 stay as they are.

## Next Actions

- The orchestrator decides on CQ-063 to CQ-065 of `spec.md` and on the points the final report lists for feature 100.
- No CRITICAL issue: the feature may go to implementation when its turn comes.

## After the cross-feature review

**Date**: 2026-09-30. Source: the section of feature 109 of
`docs/ecosystem/reviews/REPAIR-WORKLIST.md` (no item of its own, 17 pointers), the table "What the
other features must follow" of `specs/100-specstride/repair-report.md`, and section 5 of
`specs/141-parity-oracle/followup-report.md`. The items and their state are in `repair-report.md`.

### What changed

| Subject | Change | Files |
|---|---|---|
| Weaker proof of a tool-less critic | Row IX of the Constitution Check is unticked and is a stated deviation; Complexity Tracking has one row that names CQ-182; F109-FR-038 carries `assumption: CQ-182`. Finding D1 of the first analysis ("No conflict") no longer holds for the proof by pinned configuration; it holds for the critic with read-only tools | `plan.md`, `spec.md`, `research.md` |
| Opt-in to containment C0 | From user configuration only; the clarification that named the environment and a flag is corrected; `assumption: CQ-183` | `spec.md`, `plan.md`, `tasks.md` (T072), `research.md`, `quickstart.md`, `contracts/parity-rows.json` |
| Stored result of `harness verify` | Field names of the owner of `specstride.harness-verify/1`: `harness`, `version`, `at`, `outcome` in place of `id`, `harnessVersion`, `date`, `result`; `schema`, `descriptorHash`, `cases`, `budget` unchanged | `spec.md` (F109-FR-025), `data-model.md`, `tasks.md` (T097, T098), `quickstart.md`, `plan.md` |
| T102 | Reads the recorded result of the traceability check; starts no `python3` | `tasks.md` |
| Line for a registry that cannot be read | Characterization test CT-109-109, task T107; the scenario `FX-26/help-list-unavailable` left T006; the parity test PT-109-C-021-list-unavailable is withdrawn | `spec.md`, `tasks.md`, `plan.md`, `research.md`, `contracts/traceability.json` |
| `FX-26/root-sandbox-assertion` | Prerequisite: effective user id 0, else a skip | `spec.md`, `tasks.md` (T006, T074), `plan.md`, `quickstart.md` |
| Places of suite and sample | `packages/testkit/src/conformance/EP-02/`, `packages/testkit/src/samples/EP-02/` | `plan.md`, `tasks.md` (T004, T005, T070, T071, T093, T094), `quickstart.md` |
| Constitution Check | Heading "The product and its edges (VI–XII)"; row XIX with figures in bytes and task T108 | `plan.md`, `tasks.md` |
| Present state of feature 100 | Owners of the package (109, 124, 126, 146); `package:harness:<id>`; rows 123 to 131 of annex X §X.6; key of profile row 30; terms gate in 147; validator and YAML parser by reference | `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| Threats | Table with T-07, T-13 to T-16, T-34, T-48 | `spec.md` |
| `$id` of the marker schema | `urn:specstride:schema:specstride-overlay/v1:marker` | `contracts/overlay-marker.schema.json` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. 44 functional requirements, each with a test task and an implementation task, as before. No requirement was added |
| Task without a requirement | None. T107 names F109-FR-006 (`proves: C-021; B-0356`); T108 names F109-FR-024 and F109-FR-025 |
| Test named in a `test:` field without a task | None. F109-FR-006 named `PT-109-C-021-*` until row B-0356 of the traceability files was corrected; since the re-check B-8.7 part F (2026-09-30, ripple R-109) the field names CT-109-109 only |
| Kept as-is ids in a `proves:` | C-021 and B-0356 moved from T028 to T107. The coverage check passes |
| Field names of the verification result | The same eight names in `spec.md`, `data-model.md`, `tasks.md` and `quickstart.md`. The old names stand only in the column "Name before the repair" of `data-model.md` |
| Source of the opt-in to C0 | "user configuration only" in F109-FR-026, the settings table, the clarification, row VIII of the plan, T072, research D-4 and `contracts/parity-rows.json`. F109-FR-011 (transport) and F109-FR-015 (descriptor) keep "user configuration, the environment or a flag": ruling 35 covers them, and CQ-183 does not |
| Paths of suite and sample | No file names `harness-conformance` or `tests/conformance/harness/sample` any more. The descriptor-only fixture stays in `tests/conformance/harness/descriptor-only/` in plan and tasks |
| Weaker proof | "recorded as the weaker proof", deviation and CQ-182 agree between F109-FR-038, row IX, Complexity Tracking, research D-5, T064 and the field `weaker` of `data-model.md` |
| Counts | 44 functional requirements, 7 success criteria, 108 tasks (106 before; T107, T108 appended) |

### Metrics after the repair

| Metric | Value |
|---|---|
| Functional requirements | 44 (7 changed in place, none added) |
| Success criteria | 7 |
| Tasks | 108 |
| Tests added | CT-109-109, CT-109-110 |
| Deviations from the constitution, recorded | 1 (Principle IX, CQ-182) |
| Critical issues open | 0 in the specification; the deviation waits for the owner |

## Fourth run (after the constitution patch v3.0.1)

**Date**: 2026-09-30, after `speckit-analyze` was run again at the owner's request. Trigger: the
constitution was patched to v3.0.1 (2026-09-30), which names the weaker proof of Principle IX and
closes CQ-182 ("closed 2026-09-30 by the owner", `CLARIFY-QUEUE.md`); the artifacts of this feature
still spoke of the question as open. Constitution in force for this run: v3.0.1.

### Findings and repairs (applied in place; no id renumbered or reused)

| ID | Category | Severity | Location(s) | Summary | State |
|---|---|---|---|---|---|
| G1 | Inconsistency | MEDIUM | `spec.md` F109-FR-038; `spec.md` Assumptions CQ-182 | The requirement and the assumption still called the proof by pinned configuration "a recorded deviation" and said "Until the owner answers", although the owner ruled on CQ-182 on 2026-09-30 and Principle IX v3.0.1 names the weaker proof | Repaired: the requirement names the ruling and the patch; the assumption row is marked answered (the style of CQ-065) |
| G2 | Inconsistency | MEDIUM | `research.md` D-5 | "No ruling names the weaker proof … the owner decides in CQ-182" was false since the ruling | Repaired: D-5 records the ruling and keeps the plan's row until the first implementation slice |
| G3 | Inconsistency | MEDIUM | `plan.md` Constitution Check, introduction | The v3.0.1 note was inserted inside the sentence "all … twenty are answered", leaving broken prose | Repaired: the sentence is whole again and the note stands alone |
| G4 | Inconsistency | MEDIUM | `plan.md` row IX; `plan.md` Complexity Tracking | "The question is CQ-182" / "The owner decides in CQ-182" were stale; the sync note of v3.0.1 sanctions keeping the deviation row until the first implementation slice | Repaired in place: both places record the ruling; the row itself stays, as the constitution's sync note directs |
| G5 | Coverage | MEDIUM | `spec.md` F109-FR-008 `test:`; `tasks.md` T034 | CT-109-8 (the text search and import-boundary check, "the core names no harness") proves F109-FR-008 and SC-002 but stood in no `test:` field, against the precedent of F109-FR-006, which names CT-109-109 beside its origin tests | Repaired: `test:` gains CT-109-8 |
| G6 | Coverage | LOW | `spec.md` Requirements preamble; `tasks.md` T092, T101, T102, T103 | CT-109-105 to CT-109-108 were used by tasks but no sentence of `spec.md` resolved them (the preamble named 101 to 104, 109 and 110 only) | Repaired: the preamble names 105 to 107 (success criteria) and 108 (machine-specific names) |
| G7 | Inconsistency | LOW | `spec.md` fixture citation; `tasks.md` T084 | The list of cited surfaces of §O.4 omitted `processes`, which T084 compares on FX-39 and FX-21 (S-08; both families hold it) | Repaired: the list gains `processes` |
| G8 | Inconsistency | LOW | `contracts/capability-levels.json` C2 | "a declared mechanism proven per call" vs "a declared mechanism that is proven per call" in `spec.md` | Open, accepted: the contract's own note says `spec.md` stands where the two differ |

Verified while repairing, with no finding: every test name of every `test:` field has a task
(the repair of E1 holds); every requirement and success criterion has at least one task; the
108 task ids are unique and contiguous; the nine scenario names of T006 are all registered in the
catalogue of feature 141, and the sub-scenarios that the parity tests cite (FX-39 `scope-pass`,
`scope-attempt`, `scope-attempt-signal`, `invalid-declaration`, `populate-fails`) are the first
set of feature 141 (its T131); every `surfaces:` claim of a parity task is a member of the
surfaces of its family in the catalogue; the eight field names of `specstride.harness-verify/1`
agree between `spec.md`, `data-model.md`, `tasks.md` and `quickstart.md`.

### Checks after this run

| Check | Result |
|---|---|
| `python3 docs/ecosystem/check-traceability.py --require-all` | Checks h1 to h4 pass for all 41 features, among them every check of feature 109. Checks d fail on two rows that no feature owns: the divergence register holds DV-118 and DV-119, beyond the 117 that the script's constant `N_REGISTER` expects. Pre-existing, outside this feature; the orchestrator updates the constant or trims the register (the register grows while Stage B runs, as `spec.md` states) |
| Stale phrasing | `grep` for "Until the owner answers", "No ruling names", "The owner decides in CQ-182", "The question is CQ-182": no hit in this feature |
| Constitution | No conflict. The substance of F109-FR-038 matches Principle IX v3.0.1 exactly; the deviation row of `plan.md` stays until the first implementation slice, as the sync note of v3.0.1 directs |

### Metrics after the fourth run

| Metric | Value |
|---|---|
| Functional requirements | 44 (F109-FR-008 `test:` and F109-FR-038 wording changed in place; none added, none renumbered) |
| Success criteria | 7 |
| Tasks | 108 |
| Requirements with at least one task | 51 of 51 (100 per cent) |
| Critical issues open | 0 |
| Findings this run | 7 repaired (4 MEDIUM, 2 LOW, 1 MEDIUM/LOW), 1 LOW accepted |

