# Specification Analysis Report: feature 117-critic-grounding-and-prompt

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `data-model.md`, `research.md`,
`contracts/`, and the constitution v3.0.0. Two runs were made. The report shows the findings of
run 1, what was repaired, and what run 2 still finds.

## Findings

| ID | Category | Severity | Location(s) | Summary | State after run 2 |
|----|----------|----------|-------------|---------|-------------------|
| D1 | Duplication | MEDIUM | spec.md F117-FR-016, F117-FR-017 | The two debug lines were stated in both requirements | Repaired: F117-FR-017 states them, F117-FR-016 refers to it |
| A1 | Ambiguity | MEDIUM | spec.md F117-FR-005 | "the last two state directories named" did not say which directories | Repaired: the directory of the phase evidence and its proofs directory |
| A2 | Ambiguity | MEDIUM | spec.md F117-FR-034 | "a fixed length" without a number | Repaired by clarification: 256 bytes, marked `assumption: CQ-062` |
| U1 | Underspecification | MEDIUM | spec.md F117-FR-040 | No rule for a file found at the place of a hidden file | Repaired by clarification |
| U2 | Underspecification | LOW | spec.md F117-FR-018 | The words of the refusal line were open | Repaired by clarification; the exact words are data of the plan |
| I1 | Inconsistency | LOW | spec.md, Assumptions | The table of open readings was not in the order of its ids; the register count said 94 | Repaired: order; 97 rows |
| C1 | Constitution (XVIII) | HIGH | spec.md F117-FR-024, F117-FR-029, F117-FR-035 | Two intended differences have no register row: `DV-099` (a prompt still over the window is refused by default) and `DV-100` (the block set of the critic's prompt, with data boundaries). Principle XVIII asks for a row per intended difference | **Remains.** Only the orchestrator writes the register. Both are switches with the as-is value under `parity`, so no parity test fails. The coverage check prints three `[h2]` lines for them |
| C2 | Contract gap | MEDIUM | spec.md "Rows of the `parity` profile" | Seven switches have no row in feature 100 annex X §X.7; the alias table of annex X §X.8 lacks the two as-is variables of the grounding caps | **Remains.** Reported; feature 117 does not edit feature 100 |
| C3 | Contract gap | MEDIUM | plan.md "Physical paths" | Three logical names are missing in feature 100 annex B §B.5: the record of the withheld paths, the hidden files of a call, the proofs directory beside the phase evidence | **Remains.** Reported; working names in the plan only, none in `spec.md` |
| C4 | Contract gap | LOW | spec.md "Closed sets" | Eight closed sets have no row in annex X §X.6 | **Remains.** Stated under "Closed sets" as F100-FR-208 asks |
| F1 | Fixture | LOW | tasks.md, the tests that cite FX-02, FX-05, FX-08 | The catalogue of feature 141 lists feature 117 under "features covered" for FX-25 only. The brief names FX-02 and FX-05; the prompt of the diagnostician needs FX-08 | **Remains.** The exercise map of feature 141 confirms or corrects (F141-FR-033). Reported |
| I2 | Inconsistency with feature 100 | LOW | spec.md F117-FR-002 | At the baseline a cap of presence lines that is not a whole number makes the critic fail before any verdict; F100-FR-203 validates configuration at launch. Through the as-is alias the as-is failure is kept; through a config key the value is a configuration error at launch | **Remains** as a note. No text contradicts; the parity test drives the alias |
| I3 | Reading | LOW | spec.md F117-FR-018 | "Carry-over files" is read as the handoff and the proposer's notebook. F100-FR-037 does not list them. A fixture whose phase evidence cites the notebook falls under the waiver of DV-032 | **Remains** as a note. Reported |
| S1 | Size | LOW | spec.md | 43 functional requirements against an estimate of 33; under the limit of about 45 | No split proposed |

## Coverage Summary

| Requirement | Has task? | Test tasks | Other tasks |
|---|---|---|---|
| F117-FR-001 | Yes | T005, T006 | T008 |
| F117-FR-002 | Yes | T007 | T008 |
| F117-FR-003 | Yes | T012 | T034 |
| F117-FR-004 | Yes | T013 | T035 |
| F117-FR-005 | Yes | T014 | T036, T087 |
| F117-FR-006 | Yes | T015 | T036 |
| F117-FR-007 | Yes | T016, T017 | T003, T004, T038, T090 |
| F117-FR-008 | Yes | T018 | T004, T038 |
| F117-FR-009 | Yes | T030 | T001, T091 |
| F117-FR-010 | Yes | T019 | T038 |
| F117-FR-011 | Yes | T020, T021 | T003, T037, T089 |
| F117-FR-012 | Yes | T022 | T038 |
| F117-FR-013 | Yes | T023 | T035 |
| F117-FR-014 | Yes | T024, T025 | T004, T039 |
| F117-FR-015 | Yes | T026, T031 | T042 |
| F117-FR-016 | Yes | T027, T049, T050 | T039, T060 |
| F117-FR-017 | Yes | T028, T029 | T009, T040 |
| F117-FR-018 | Yes | T010 | T009, T011, T036, T086, T090 |
| F117-FR-019 | Yes | T032 | T041 |
| F117-FR-020 | Yes | T033 | T038 |
| F117-FR-021 | Yes | T043 | T004, T057 |
| F117-FR-022 | Yes | T045 | T058 |
| F117-FR-023 | Yes | T046, T047 | T003, T059, T089 |
| F117-FR-024 | Yes | T048, T051 | T008, T059, T086, T088 |
| F117-FR-025 | Yes | T052 | T059 |
| F117-FR-026 | Yes | T053 | T002, T057 |
| F117-FR-027 | Yes | T061 | T070 |
| F117-FR-028 | Yes | T054 | T060 |
| F117-FR-029 | Yes | T044, T055 | T008, T057, T086, T088 |
| F117-FR-030 | Yes | T080 | T085 |
| F117-FR-031 | Yes | T081 | T004, T083, T085 |
| F117-FR-032 | Yes | T082 | T084 |
| F117-FR-033 | Yes | T062 | T068 |
| F117-FR-034 | Yes | T063 | T068 |
| F117-FR-035 | Yes | T064 | T069, T088 |
| F117-FR-036 | Yes | T065 | T069 |
| F117-FR-037 | Yes | T066 | T068 |
| F117-FR-038 | Yes | T067 | T070 |
| F117-FR-039 | Yes | T072 | T071, T079 |
| F117-FR-040 | Yes | T073 | T076, T087, T090 |
| F117-FR-041 | Yes | T074 | T077 |
| F117-FR-042 | Yes | T075 | T071, T078, T087 |
| F117-FR-043 | Yes | T056 | T060 |
| F117-SC-001 to F117-SC-007 | Yes | Measured by the tests above | Last task of `tasks.md` runs the coverage check |

Task numbers are those of `tasks.md` at the time of run 2; the field `covers:` of each task is the authority.

## Constitution Alignment

All twenty gates of `plan.md` are answered. Finding C1 is the one open point, under Principle
XVIII. Principles II and III are met by F117-FR-018, F117-FR-027, F117-FR-035 and F117-FR-039.

## Unmapped Tasks

None. Every task carries `covers:` or `proves:`.

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 43 |
| Success criteria | 7 |
| Tasks | 91 |
| Requirements with at least one task | 43 of 43 (100 per cent) |
| Test names of `spec.md` with a task | 54 of 54 |
| Behaviour items in an `origin:` and in a `proves:` | 102 of 102 |
| As-is requirements in an `origin:` and in a `proves:` | 1 of 1 |
| Ambiguity findings open | 0 |
| Duplication findings open | 0 |
| Critical issues | 0 |
| Findings that remain | C1, C2, C3, C4, F1, I2, I3 (all need a change outside `specs/117-critic-grounding-and-prompt/`) |

## Split

None proposed: 43 requirements. Should the limit be read strictly, group G4 (F117-FR-039 to
F117-FR-042, tests CT-117-39 to CT-117-42, no as-is origin) can leave as one unit.

## Next Actions

- The orchestrator writes two register rows and the rows of annexes B §B.5, X §X.6, X §X.7 and X §X.8; then task T088 of `tasks.md` replaces the placeholders.
- No CRITICAL finding. Implementation may start with phases 1 to 4, which depend on none of the open points.

## After the cross-feature review

Date: 2026-09-30. Feature 117 had no item of its own and ten pointers, plus the rows of the table
"What the other features must follow" of feature 100 and one item the orchestrator named (W-X-23).

### What changed

| File | Change |
|---|---|
| `spec.md` | `parity:` fields name rows 52 to 58 of annex X §X.7; `ep:` lines for EP-03, EP-04 and EP-18; the logical names `attempt:<N>:<k>:<n>:hidden-files`, `attempt:<N>:<k>:<n>:withheld-paths` and `gate:<N>:proofs` in F117-FR-004, F117-FR-005, F117-FR-040 and F117-FR-042; F117-FR-043 names the one ingress; F117-FR-044 is new; the closed sets carry rows 115 to 122; the profile rows carry the values of annex X §X.7; the owner of the content of the fact block is 116; the register is named without a count; the section "Repairs after the cross-feature review" |
| `plan.md` | No import of `node:fs`: a file-reading port and a file-moving port (`assumption: CQ-185`); row XVIII names every register row of the spec; the gate line; Complexity Tracking is empty; the working names are replaced by the logical names; owner list of the core; 44 requirements |
| `tasks.md` | T001 and T004 without a path of the owner's machine; T008, T009, T056, T060, T076 to T078, T086 to T088, T090 and T091 reworded; T092 to T097 appended |
| `data-model.md`, `research.md`, `quickstart.md` | The hidden-files record cites annex B §B.20; D-6, D-7 and D-11 state the present state; D-16 and D-17 are new; two scenarios of the quickstart |
| `contracts/` | `parity-rows.json` has `row` and the status `confirmed`; `schemas/hidden-files.schema.json` is new |

### State of the findings of 2026-09-29

| Finding | State |
|---|---|
| C1 (register rows) | Closed: DV-099 and DV-100 exist |
| C2 (profile rows, aliases) | Closed: rows 52 to 58 of annex X §X.7; the alias table of annex X §X.8 holds the two variables of the grounding caps |
| C3 (logical names) | Closed: the three names are rows of annex B §B.5 |
| C4 (closed sets) | Closed: rows 115 to 122 of annex X §X.6 |
| F1 (fixtures) | Remains: the catalogue of feature 141 lists feature 117 for FX-25 only |
| I2, I3 | Remain as notes |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None: 44 of 44 have a `covers:` |
| New requirement without a test and a test task | None: F117-FR-044 has CT-117-44 and T096 with `proves:` |
| Test name of `spec.md` without a task | None: 55 of 55 |
| Task without a requirement | None: T092 to T097 carry `covers:` |
| Terms and values between the files | Rows 52 to 58: `spec.md`, `parity-rows.json` and annex X §X.7 agree. Closed sets: `spec.md`, `closed-sets.json` and annex X §X.6 agree in the members. The hidden-files record: `data-model.md` and the schema file agree in fields and states |
| Placeholders | No `CQ-pending-*`, no `DV-new-*`, no label P-n, no working name, no path of the owner's machine |
| Open point | The place of the implementation of the two file ports (`packages/runtime/src/ports/`) is a choice of this plan, reported to the orchestrator |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 44 |
| Success criteria | 7 |
| Tasks | 97 |
| Coverage check | No line names feature 117. The check as a whole fails on `[h2] F126-FR-016` (feature 126, `DV-new-1`) |

## Analyze run of 2026-09-30, after the cross-feature review

Artifacts read: `spec.md`, `plan.md`, `tasks.md`, the constitution v3.0.1, and the sources the
findings cite. 23 findings: 21 repaired inside this feature, 2 accepted, none left open. The
repairs are listed in `spec.md`, "Repairs after the analyze run of 2026-09-30". Two findings (I2,
A5) first needed a decision outside this feature; this feature now follows the proposals below.

| ID | Severity | State |
|---|---|---|
| I1, I2, I3, U1 | HIGH | Repaired (I2 needs P1 upstream, I1 needs P2 and P3) |
| U2, A1, A2, I4, I5, I6, C1, I7 | MEDIUM | Repaired |
| A3, I8, I9, U3, I10, G1, I11, I12, A5 | LOW | Repaired |
| A4 | LOW | Accepted: under `parity` row 28 keeps the as-is mode, so block set `as-is` and the second form never meet on the oracle |
| D1 | LOW | Accepted: F117-FR-043 and F117-FR-044 overlap on the kept prompt without a conflict |

Coverage after the repairs: 44 of 44 requirements with a task, 55 of 55 test names with a task, 103
of 103 origins in a `proves:`. `check-traceability.py --require-all` names nothing of feature 117.

## Proposed upstream fixes

Ready to apply. Feature 117 already reads as if each were applied.

### P1 — the event of a citation that does not resolve (finding I2)

Why: R14 EV-08 asks for an event when a cited path or glob does not resolve. The brief calls it
`critic.grounding_gap`, but the catalogue gives that type to the as-is gap event, which projects to
`grounding_gap`. One type cannot carry both, and the catalogue has no type for the new event.

1. `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`, after the row
   `critic.grounding_carried`, add (tab-separated):
   `critic.citation_unresolved	instant		phase,attempt,paths	paths:target`
2. `specs/111-event-schema-and-projection/data-model.md`, event table, after the row
   `critic.grounding_carried`, add:
   `` | `critic.citation_unresolved` | instant |  | phase, attempt, paths | `paths` (target) | ``;
   in line 109 change "122 types. The thirteen types" to "123 types. The fourteen types".
3. `specs/111-event-schema-and-projection/spec.md`, "Types added on 2026-09-30": change
   "Thirteen types were added" to "Fourteen types were added", and add before the row
   `critic.passed_over`:
   `` | `critic.citation_unresolved` | `phase`, `attempt`, `paths` | `paths`: the cited paths and wildcards that did not resolve, at most the first 20, of the ingress class `target`; a path outside the workspace is `outside:<16 hex of its canonical hash>` (F117-FR-043). Not the as-is `grounding_gap`, which `critic.grounding_gap` carries | F117-FR-015 | ``
4. `specs/144-compatibility-projection/contracts/projection-table.tsv`, after the row
   `critic.grounding_carried`, add:
   `critic.citation_unresolved		-	none	critic	no as-is equivalent`
   and the matching row in `specs/144-compatibility-projection/data-model.md`.

### P2 — the vocabulary test of feature 142 (finding I1)

Why: F142-FR-066 runs the same vocabulary test over every critic-class input with no exemption, but
the as-is grounding texts that FX-25 compares byte for byte hold the word `snapshot`. Without the
exemption, CT-142-166 fails on every parallel fixture that grounds a file.

`specs/142-parallel-units/spec.md`, F142-FR-066: replace "MUST find none of: group, worker,
parallel, merge, integrat-, refus-, snapshot, and the opaque tokens." with "MUST find none of:
group, worker, parallel, merge, integrat-, refus-, snapshot, and the opaque tokens, in text that the
runtime wrote; the word `snapshot` in the as-is literals that F117-FR-038 names is exempt, and
nothing else is."

### P3 — the scope of the closed answer to CQ-061 (finding I1)

Why: the answer was closed on "the as-is heading is exempt". The baseline shows the same word in
the rules, the lines under the heading, the gap section and the pin block (`lib/critic.py`,
`lib/verdict_pins.py` at `9cab15d`). Parity keeps all of them byte for byte, so the exemption must
cover them.

`docs/ecosystem/CLARIFY-QUEUE.md`, row CQ-061, last column: append "; scope widened 2026-09-30 by
the analyze run of 117: the exemption covers the word `snapshot` in the as-is literals of
F117-FR-038 (heading and its lines, rules, gap section, pin block), nothing else".

### Not proposed

A5 (paths outside the workspace in events) needs no upstream change. F117-FR-043 now hashes such a
path in the events that have no as-is equivalent. It keeps the as-is form in the two projected
events, so no fixture changes and no register row is needed.
