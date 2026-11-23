# Specification Analysis Report: feature 100-specstride

Date: 2026-09-29, after the amendments that followed the fan-out. This first part is the current
report. The earlier reports follow under "History" and are unchanged.

## Analysis after the amendments

Artifacts read: `spec.md` with the section "Amendments after the fan-out", the nine annexes,
`plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`,
`amendments-worklist.md`, the constitution v3.0.0.

### Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| A1 | Terminology | LOW | F100-FR-232 | A bare "gate" | **Repaired** |
| A2 | Inconsistency | LOW | The analysis script | It knew 94 register rows and looked for schema ids in one file only | **Repaired** in the script; the register has 113 rows |
| A3 | Terminology | LOW | `plan.md` lines 47, 52, 203 | Bare "gate" in the words of the plan template and in a directory name | **Accepted**, as before |
| A4 | Underspecification | MEDIUM | 26 requirements with `assumption:` | They rest on open questions of the queue (CQ-017 to CQ-175) | **Open by design**; each proceeds on the recommended answer |
| A5 | Inconsistency | MEDIUM | Annex X §X.7 row 90 against the key list of feature 110 | The default of `roles.refuseUnknown` is "on" here (feature 124, DV-104) and "off" in the key list | **Open**; listed in `spec.md`, "Where features proceeded on different readings" |
| A6 | Coverage | LOW | Annex X §X.7 rows 44 to 129 | No requirement of feature 100 names them with `parity:` | **Accepted**: they belong to the features named as owner, which state the value in their own requirements (F100-FR-212) |
| A7 | Underspecification | LOW | Annex X §X.6 rows 171, 266; annex B §B.20 | Two rows give part of the members and point to the owner; the fields of fourteen records are with their owners | **Accepted**: the as-is texts and the verbs of one stub are long and used by one feature; F100-FR-227 states the rule for the records |
| A8 | Inconsistency | MEDIUM | Owners in annex X §X.6, §X.7, §X.9 and in the package graph | The splits of 115 (to 116) and of 142 (to 143) are not applied | **Open**, waiting for the final owners |
| A9 | Coverage | LOW | Annex X §X.9, threat model | The owners of the threats were not changed for the seven finished splits, because the amendments file names no threat | **Open**; to be set with the final owners |

No finding is CRITICAL or HIGH.

### Checks

| Check | Result |
|---|---|
| Index counts of `spec.md` against the annexes | Equal: A 33, B 47, C 41, D 24, E 17, F 15, G 24, H 5, X 29; total 235. Ids 001 to 226 sequential in annex order; 227 to 235 unique, without a gap, each named in the index |
| Every `parity:` field against its profile row | 57 requirements carry `parity:`; each names rows that exist, or is the profile itself. Rows 1 to 43: all named but row 42 |
| Every closed set named in an annex against annex X §X.6 | Every `enum` of the 30 schema files is covered by a row; 270 rows |
| Every file of `contracts/` against its annex section | `generate.py --check`: checked 82 files, 0 differ. 125 logical names each with a path; 199 `file` items of the inventory each with a logical name or a rule |
| Coverage of requirements by tasks | 235 of 235 have a task; 235 of 235 are named by a test task |
| As-is coverage | Unchanged: every kept id is in an `origin:` and in a `proves:` |
| `python3 docs/ecosystem/check-traceability.py` | `PASSED: checks a to h`; 41 of 41 features have a spec; no line starting with `[h` names feature 100 |
| The amendments worklist | 208 lines, all ticked: every row of the amendments file is applied, needs no change, or is listed as not applied with its reason |
| Placeholders; the machine-specific backend name | None |

### Metrics

| Metric | Value |
|---|---|
| Functional requirements | 235 |
| Success criteria | 9 |
| Tasks | 223 |
| Coverage | 100 % |
| Critical issues | 0 |

### Next Actions

- The orchestrator sends the final owners after the splits of 115 and 142; then the owner columns of annex X §X.6, §X.7, §X.9, of the tables of `spec.md` and of the package graph are set.
- Feature 110 and feature 124 settle the default of `roles.refuseUnknown`.
- The owner answers the queue. An answer that differs from the recommendation changes the requirement that carries the `assumption:`.

---

# History

## Report after plan and tasks

Date: 2026-09-29. Artifacts read: `spec.md`, the nine annexes, `plan.md`, `research.md`,
`data-model.md`, `quickstart.md`, `contracts/`, `tasks.md`, the constitution v3.0.0.

The analysis ran three times: a first run, and two runs after repairs. The mechanical checks are
a script; the checks of meaning were made by reading. The table gives every finding with its state
after the last run.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| P1 | Inconsistency | HIGH | 8 requirements with `parity:` (F100-FR-054, 110, 119, 131, 137, 173, 183, 210) | The `parity:` field could not be tied to a row of the profile (annex X §X.7) | **Repaired.** Every `parity:` field now names its row or rows. F100-FR-210 is the profile itself |
| P2 | Coverage | MEDIUM | Profile rows 27, 36, 40, 41 | A row of the profile was named by no `parity:` field | **Repaired.** Row 27 joined F100-FR-081; F100-FR-078, F100-FR-008 and F100-FR-154 gained a `parity:` field (F100-FR-078 also `divergence: DV-004`) |
| P3 | Coverage | LOW | Profile row 42 (as-is names of metrics) | No requirement of feature 100 names it | **Accepted.** The switch belongs to feature 128 alone; the row is in the profile because the profile holds every switch |
| C1 | Inconsistency | MEDIUM | `contracts/schemas/harness-descriptor.schema.json` (`auth.scheme`), `overlay.schema.json` (`scope`), `launch-contract.schema.json` (`status`) | A closed set named in an annex had no row, or no members, in annex X §X.6 | **Repaired.** Rows 87 and 88 added; row 79 now gives the members of the status. The kinds of process and the predicates of a yield were covered by rows 22 and 69, which point to their section |
| T1 | Coverage | HIGH | `tasks.md`, F100-FR-055, F100-FR-058 | Three parity tests were attached to the wrong requirement, so two requirements had no test task and the table "As-is coverage" gave wrong ids | **Repaired** |
| L1 | Coverage | MEDIUM | Annex B §B.5; `contracts/data/layout-old-side.json` | The table of logical names lacked 33 names that the old side of the layout table needs | **Repaired** during planning: the names were added to the table. No requirement text changed. Recorded in `spec.md`, Clarifications |
| G1 | Terminology | LOW | `plan.md` lines 50, 84, 222; `tasks.md` T205 | Bare uses of "gate" and "tier" in text of this feature | **Repaired** |
| G2 | Terminology | LOW | `plan.md` lines 47 and 52 (text of the plan template); `plan.md` line 203 (a directory name); `research.md` line 27 (the file name of a report) | Bare "gate" | **Accepted.** None is text of a requirement; the first two are the template's words, the others are names |
| N1 | Coverage | MEDIUM | `plan.md`, "Performance Goals" | No task measured the three performance goals | **Repaired.** T209 added |
| D1 | Duplication | LOW | F100-FR-151 and F100-FR-152 | Both state that every cause of a halt maps to one code of 0 to 6 | **Accepted.** They carry different as-is origins with different dispositions and tests (028 SC-003 by parity test; 002 FR-015 and 002 SC-004 by characterization tests) |
| D2 | Duplication | LOW | F100-FR-067, F100-FR-145, F100-FR-183 | The refusal of `resume` for a changed source is stated three times: as a check point, as a transition, as an exit code | **Accepted.** Each is cited by a different feature (102 and 103; 129; 119). The three agree |
| D3 | Duplication | LOW | F100-FR-009 and F100-FR-205; F100-FR-004 and F100-FR-217 | A layering rule and its cross-layer interface contract say the same | **Accepted.** The layering rule is the rule; the other requirement states the interface and the test |
| U1 | Underspecification | MEDIUM | 14 requirements with `assumption:` | Ten readings that the sources do not settle (CQ-017 to CQ-026) | **Open by design.** Each proceeds on the recommended answer; the owner answers the queue in one round |
| U2 | Underspecification | MEDIUM | Annex X §X.6 rows 13, 14, 53, 60, 63, 65 | The members of six closed sets are in the specification of their owner and not here | **Open.** The owner features (123, 105, 142, 115) must list them; F100-FR-208 requires it |
| U3 | Underspecification | LOW | Annex X §X.7, column "Key (as proposed)" | The keys are proposals that feature 110 has not fixed; 3 rows have no key of their own | **Open.** Rows are identified by number; feature 110 owns the spelling |
| V1 | Ambiguity | LOW | 14 requirements with `status: unverified` | Facts about macOS, hosts and harnesses that no run has shown | **Open by design.** Each names its check and its owner (`research.md`, last table) |
| K1 | Constitution | — | `plan.md`, Constitution Check | Twenty principles checked | **No issue.** Every check passes; Principles III and IX hold with the stated exception of the critic with read-only tools, which the constitution itself contains |

No finding is CRITICAL. No HIGH finding stays open.

## Additional checks asked for this feature

| Check | Result |
|---|---|
| Index counts of `spec.md` against the annexes | Equal: A 31, B 44, C 38, D 24, E 17, F 15, G 23, H 5, X 29; total 226; ids F100-FR-001 to F100-FR-226, sequential in annex order, none twice |
| Every `parity:` field against its profile row | 55 requirements carry `parity:`; 54 name rows that exist, one is the profile itself. 42 of 43 rows are named by a field (row 42: finding P3). Every requirement whose text names a key of the profile carries `parity:` |
| Every closed set named in an annex against annex X §X.6 | Every `enum` of the 30 schema files is a subset of the members of a row or lies in a section that a row points to; every sentence "… are a closed set: …" of the annexes has a row. 88 rows |
| Every schema file in `contracts/` against its annex section | `python3 specs/100-specstride/contracts/tools/generate.py --check`: checked 80 files, 0 differ. The three hand-written source files pass their checks: 109 logical names each with a path, 199 `file` items of the inventory each with a logical name or a rule |
| `python3 docs/ecosystem/check-traceability.py` | `PASSED: checks a to h`, exit 0. No line that starts with `[h` names feature 100 |
| Every cited requirement id and annex section exists | Yes, in `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `tasks.md`, `contracts/README.md` and the annexes |
| Placeholders | None. No `[NEEDS CLARIFICATION]`, no `DV-new`, no `CQ-pending` |
| The machine-specific backend name | Not present in any file of the feature |
| Every register row cited exists | Yes, all within DV-001 to DV-094 |

## Coverage Summary

226 requirements; each has at least one task. The table is by annex section; `tasks.md` holds
the ids in `proves:` and `covers:`.

| Requirements | Has task? | Tasks | Notes |
|---|---|---|---|
| F100-FR-001 to F100-FR-012 (annex A §A.2, §A.3) | Yes | T008 to T016 | The import-boundary check |
| F100-FR-013 to F100-FR-031 (§A.4, §A.5) | Yes | Frame of the test kit and static checks of the product-wide rules (US3, US1); T001 to T006 | |
| F100-FR-032 to F100-FR-075 (annex B) | Yes | US1: a test task and an implementation task per section, and five parity tests | |
| F100-FR-076 to F100-FR-113 (annex C) | Yes | US3 for the nine extension points (suite, sample, interface types); US4 for the descriptor and what travels with it | |
| F100-FR-114 to F100-FR-137 (annex D) | Yes | US3 (EP-04, tree store, EP-06, EP-15); US5 (parallel plan, yield artifact, fact block, check manifest) | |
| F100-FR-138 to F100-FR-154 (annex E) | Yes | US3 (EP-18); US2 (state machine, stop reasons, codes), with PT-100-028SC003, CT-100-1, CT-100-2 and the table-level tests | |
| F100-FR-155 to F100-FR-169 (annex F) | Yes | US5, US2, US3, with PT-100-011SC004 | |
| F100-FR-170 to F100-FR-192 (annex G) | Yes | US5, US2, US3, with PT-100-011SC007 | |
| F100-FR-193 to F100-FR-197 (annex H) | Yes | US3 (EP-01) | |
| F100-FR-198 to F100-FR-226 (annex X) | Yes | US1, US5, Foundational (table evaluator), Polish (acceptance) | |

| Success criterion | Task |
|---|---|
| F100-SC-001 Evolvability | The acceptance run over the nineteen points (US3) |
| F100-SC-002 Integration; F100-SC-005 Time use is reported | T205 (at release; `unverified` until then) |
| F100-SC-003 One vocabulary; F100-SC-004 No closed list | The static tests (US1) |
| F100-SC-006 Complete profile; F100-SC-007 Complete closed sets | The tests of annex X §X.6 and §X.7 and the static tests (US1) |
| F100-SC-008 No leaked secret | The canary test (US5); the release condition is the run of feature 111 |
| F100-SC-009 Codes are stable | The table-level tests (US2) |

As-is coverage: the five as-is requirements and success criteria and the eight kept behaviour
items of clusters C-008, C-011, C-012 and C-013 are each in an `origin:` of a requirement and in
the `proves:` of a test task (`tasks.md`, "As-is coverage").

## Constitution Alignment Issues

None.

## Unmapped Tasks

Five tasks serve no single requirement, by design: T003 (package skeletons), T007 (linting),
T207 (port of the generator), T209 (performance goals of the plan), T210 (run of the quickstart).

## Metrics

| Metric | Value |
|---|---|
| Functional requirements | 226 |
| Success criteria | 9 |
| Tasks | 210 |
| Coverage (requirements with at least one task) | 100 % |
| Requirements named by a test task | 100 % |
| Findings, first run | 28 by script (8 P1, 5 P2 and P3, 5 C1, 2 T1, 8 G1 and G2), and 8 by reading |
| Findings open after the last run | 0 CRITICAL, 0 HIGH, 2 MEDIUM (U1, U2), 3 LOW (P3, U3, V1); accepted: G2, D1, D2, D3 |
| Ambiguity count | 14 requirements `unverified`; 14 requirements with an assumption |
| Duplication count | 3, all accepted |
| Critical issues | 0 |

## Next Actions

- Nothing blocks the implementation of this feature or the start of the other features.
- The owner answers CQ-017 to CQ-026, and CQ-028 and CQ-029. An answer that differs from the recommendation changes the annex section named in `spec.md`, "Assumptions"; the contract files follow by running the generator.
- Features 123, 105, 142 and 115 list the members of the closed sets of finding U2 under a heading "Closed sets".
- Feature 110 fixes the spelling of the keys of the profile (finding U3).
- After any change of an annex: `python3 specs/100-specstride/contracts/tools/generate.py`, then `--check` in the build.

## Repairs after feature 141

Made on 2026-09-29, on three points that feature 141 raised. No section number, requirement id,
table row number or logical name changed; nothing was renumbered.

| # | Where | Change |
|---|---|---|
| 1 | Annex X §X.8, component-name table | Five rows appended: `stream-tap`, `telemetry-loki`, `telemetry-otlp`, `overlay`, `plugin-requests`. A sentence says that a prefix outside the table is compared as written |
| 2 | Annex X §X.8, under the component-name table; F100-FR-214 | The rule for a registry entry of the baseline that the port does not carry (DV-064): rule N-15, found at run time, taken out before storage and comparison, named in no stored capture. F100-FR-214 gained the sentence and `assumption: CQ-029` beside CQ-026 |
| 3 | Annex X §X.7, F100-FR-211 | The second suite compares compatibility output; only row 1 of the profile changes. Gained `divergence: DV-034; DV-018` and `assumption: CQ-028` |
| 4 | `spec.md`, Clarifications and Assumptions | CQ-028 and CQ-029 added |
| 5 | `tasks.md`, T204 | The fixture range reads FX-01 to FX-40 |

Counts: feature 100 states the number of items of the inventory nowhere. The old side of the
layout table still has 199 rows: the two new items, B-2784 and B-2785, are of the kind
`stop-reason`, not `file`. The stop-reason enumeration is unchanged (15 members); the two write
sites were already named in the source of annex E §E.3.

Checks after the repairs: `generate.py --check`: 80 files, 0 differ. The traceability check:
`PASSED`, no line starting with `[h` names feature 100. The analysis script: the same four
accepted findings as before (G2), none new.

## Second pass after the cross-feature review (2026-09-30)

Made from section A of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`. The item-by-item report is in
[repair-report.md](repair-report.md), section of the same date; the requirement changes are listed
in `spec.md`, "Second pass after the cross-feature review (2026-09-30)".

| What changed | Where |
|---|---|
| Closed sets: rows 271 to 277 appended (end causes and outcomes of 111; error classes of the validation of a launch contract, 107; kinds and states of dsh customisations, 130; open registry of lock and liveness providers, 122); row 14 reworded; row 85 names N-29 | `annexes/X-cross-layer.md` §X.6 |
| Profile rows 132 (DV-114, 123) and 133 (DV-117, 101) appended | `annexes/X-cross-layer.md` §X.7 |
| N-29 appended (DV-116); F100-FR-213 and §X.6 row 85 follow; the seven as-is telemetry variables of 128 joined the alias table | `annexes/X-cross-layer.md` §X.8 |
| Writer of `workspace:layout-version` named; the session row keeps nothing in the configuration home at auth tier 1; the two internal schema ids of 130 added to §B.20 | `annexes/B-state.md` |
| `trackTerminal` confirmed on the dialect row (`prime-v3`); CQ-190 reading stated in §C.9; F100-FR-088 covers the diagnostician | `annexes/C-ports-and-edges.md` |
| `integrateGroup` carries the verdict per worker; the four engine reports named; the widening-key reading of `loop.parallel.workersMax` stated in F100-FR-127 | `annexes/D-pass-loop.md` |
| A missing credential of the critic is a failed call under `parity` | `annexes/E-engine.md` §E.1 |
| F100-FR-009 parity cap floor; F100-FR-024 `unverified` half sentence; F100-FR-234 session and standard input | `annexes/A-foundations.md` |
| `[SPECSTRIDE-STATE]` keys; row `spec` exit-3 cause; F100-FR-182 unknown first argument; `pipeline.terminalTool` in §G.7; error classes cited in §G.8 | `annexes/G-cli.md` |
| The build and the eval driver per the proposal of 113 (CQ-188) | `annexes/H-hosts.md` |
| Owners of `@specstride/integrity` and the module groups of 142 and 143 in `@specstride/core` | `contracts/sources/package-graph.json` |
| The second heading numbered D-8 (conformance suites) renumbered to D-10 | `research.md` |
| Counts: 277 closed sets, 133 profile rows, 29 normalization rules | `spec.md`, `plan.md`, `tasks.md`, `data-model.md` |

Nine questions were raised and are not queued (N-5 to N-13 of the repair report of this date, plus
the first-pass questions N-1 to N-4, which still stand). Three decisions were taken in place: the
writer of `workspace:layout-version`, the reading of the widening key `loop.parallel.workersMax`,
and the owner note for the module groups of 142 and 143 in the core.

Checks: `generate.py`: 82 files, `--check`: 0 differ. `check-traceability.py --require-all`:
PASSED, checks a to h, over all features.

## Analyze of 2026-09-30 (owner's request) and repairs

A `speckit-analyze` run on 2026-09-30, at the owner's request, raised 17 findings. The fixes follow
the orchestrator's decision per finding and were checked against the files. Nothing was
renumbered; no requirement, task id, closed-set row or profile row was added. The requirements
changed in place are listed in `spec.md`, "Repairs after the cross-feature review", subsection
"Analyze of 2026-09-30, requirements changed in place".

| Finding | State | What was done |
|---|---|---|
| K1 (critical) | Recorded as deviation | Principle IX under `parity`: no proof of the critic mode (F100-FR-230, profile row 117). F100-FR-230, F100-FR-231 and the profile rows are unchanged (owner rulings CQ-145, CQ-182). `plan.md`: row IX "passes outside the `parity` profile; deviation under `parity` recorded"; one Complexity Tracking row for Principle IX under `parity` with justification (Principle XVIII; `profile` is a widening key, F110-FR-013), the rejected alternative (removing the parity clauses would fail FX-07 and FX-25) and the rulings. The `assumption:` line of F100-FR-230 names the deviation |
| K2 (critical) | Recorded as deviation | Same row as K1, second relaxation: the as-is fallback window and the over-window prompt under `parity` (F100-FR-231; rows 28, 55, 57). The `parity:` field of F100-FR-231 names the deviation with `assumption: CQ-145` (CQ-145 was already on its `assumption:` line) |
| K3 (critical) | Fixed | T225 fails, and publishes nothing, unless CT-141-126 and T204 pass (F100-FR-223), the canary run of T203 with the real redactor of 111 passes (F100-SC-008), and `verified.md` holds an entry of the live run T205 (F100-FR-224). `covers: F100-FR-236; F100-FR-223`, `checks: F100-SC-008`. A row in "Dependence on other features" names 141 and 111 |
| K4 | Fixed | `plan.md` names constitution v3.0.1; row IX cites the weaker proof as passing under v3.0.1 (CQ-182 closed) and the `parity` deviation; the Complexity Tracking row of the weaker proof records the ruling. `spec.md` ("Sources", CQ-182 in "Assumptions") and annex X §X.6 row 128 follow |
| K5 | Fixed | One end rule for the deviation rows: they stay until the first implementation slice removes them (Sync Impact Report of v3.0.1); the `assumption:` line of F100-FR-230 says so. Row VI states the answer of CQ-186 in place of the conditional; the re-check paragraph and `research.md` D-5 follow |
| K6 | Fixed | Row VIII states that selecting `parity` is the consumer's explicit opt-in (a widening key, F110-FR-013) and cites F100-FR-210 |
| I1 | Fixed | Summary and Source Code tree list four kernel modules (`notebook-sweep/`, `stable-read/` added), `packages/contracts/scripts/`, `tests/release/100/`, `.github/workflows/` and `tools/contracts-gen/`; the Structure Decision follows. T034 names both files it writes (not split) |
| B1 | Fixed | 32 sentences in 29 requirements rewritten from "No X MUST …" / "Neither … MUST …" / "nothing MUST …" to "X MUST NOT …", meaning unchanged. The analyzer counted 24; a scan of every requirement sentence of `spec.md` and `annexes/` found 29 requirements, all changed. Two sentences that match the pattern but are positive or already negative ("a capability that no run has shown MUST be reported", F100-FR-077; "It MUST run nothing …", F100-FR-129) were left as they are |
| B2 | Fixed | `profile` added to the widening list of annex X §X.2, citing F110-FR-013; `contracts/data/config-ranks.json` regenerated |
| D1 | Fixed | F100-FR-218 cites F100-FR-143 for the three per-run fields instead of restating them; both tests (CT-100-243, CT-100-318) kept |
| E1 | Fixed | `checks:` added: F100-SC-001 to T158; F100-SC-003 to T075, T076; F100-SC-004 to T018; F100-SC-006 to T071, T072, T226; F100-SC-007 to T069, T070; F100-SC-008 to T203 and T225 |
| E2 | Fixed | A row in "Dependence on other features" of `tasks.md`: each Wave 1 content owner runs the conformance suite of its point on its own implementation (F100-FR-222), with the owners of the table "Extension points" |
| I2 | Fixed | "Thirty-one other features" reads "Forty other features (41 specifications after the splits, this one included)" |
| I3 | Fixed | The divergence register has 117 rows (DV-001 to DV-117): `spec.md` "Clarifications" and "Assumptions", `plan.md` row XVIII |
| I4 | Fixed | `plan.md`: 22 data files (counted in `contracts/data/`) |
| I5 | Fixed | W-100-18 marked applied by the second pass (A1): rows 271 to 273 of annex X §X.6 |
| I6 | Fixed | Stated, not reordered: a sample is written against the JSON contract of its extension point, so it may precede the interface types (head of Phase 5 and "Within Each User Story" of `tasks.md`) |

Checks after the repairs: `generate.py`: 82 files written; `generate.py --check`: 82 files, 0
differ. `check-traceability.py --require-all`: PASSED, checks a to h.

### Second run

A second `speckit-analyze` run of 2026-09-30, after the repairs above, found 7 findings: 2 medium
and 5 low. **The second run found no critical or high finding.** All seven were repaired on the
same date; nothing was renumbered. The requirements and tables changed in place are listed in
`spec.md`, "Second analyze of 2026-09-30, requirements and tables changed in place".

| Id | Severity | State | Repair |
|---|---|---|---|
| F1 | medium | Fixed | The deviation holds for every harness: F100-FR-230 says that under `parity` no proof is made, as at the baseline; row 28 of annex X §X.7 keeps the as-is transport and mode of each harness, which made no proof, and row 117 sets `harnesses.dsh.critic.proof` to `none`. The `parity:` and `assumption:` lines of F100-FR-230, `plan.md` Constitution Check IX and Complexity Tracking relaxation (1), and CQ-182 under "Clarifications" of `spec.md` now cite rows 28 and 117 |
| F2 | medium | Fixed | Annex X §X.9: the row "T-38 to T-42" split into five rows T-38 to T-42, with the same control; owner 129 for the read model (Wave 1), the viewer in Wave 2. `contracts/data/threat-model.json` regenerated: 49 threats, every id of T201 (CT-100-316) present |
| F3 | low | Fixed | `spec.md`, row "Package graph": 26 packages before, 29 after |
| F4 | low | Fixed | `plan.md` source tree: `packages/kernel/test/` (T014, T022, T213), `packages/contracts/README.md` and `packages/testkit/README.md` (T208), `packages/contracts/DEPENDENCIES.md` (T005) |
| F5 | low | Fixed | `tasks.md` "Phase Dependencies": one line for Phase 9 (T211 to T223; T214 `stable-read` foundational for the features that read files while a run writes them) and one for Phase 10 (T224 to T228) |
| F6 | low | Fixed | T075 `proves:` drops F100-FR-209 and F100-FR-211; T069 and T071 still prove them (CT-100-309, CT-100-311), so the coverage check passes |
| F7 | low | Fixed | `repair-report.md`: W-100-18 is closed by the second pass (A1), in the state table and in its row |

Checks after the repairs: `generate.py`: 82 files written; `generate.py --check`: 82 files, 0
differ. `check-traceability.py --require-all`: PASSED, checks a to h.

### Third run (2026-09-30, read-only, on `opus`)

F1 to F7 resolved (evidence in the run's report). No critical, high or medium finding. Two low findings, both fixed by the orchestrator: I1, the second Principle IX relaxation cited row 28 only where the plan cites rows 28, 55 and 57 and DV-099 (F100-FR-231's `parity:` and `divergence:` lines widened); F1-3, the Phase 10 dependency line now names T203, T204 and T205 as the inputs of T225's release conditions. Citation check after the move of the as-is specifications to `old/`: no `specs/002-`, `specs/011-` or `specs/028-` path remains in feature 100. Metrics: 245 requirements, 228 tasks, coverage 100 %, ambiguity 0, duplication 0, critical 0. Generator 82 files 0 differ; coverage check passes. The analysis of feature 100 is closed on this run.

### Fourth run (2026-09-30, on unchanged artifacts)

A fourth `speckit-analyze` run, on the artifacts as committed after the third run, re-derived
every check instead of reusing the third run's result. **No critical, high or medium finding.**
Seven low findings, all repaired on the same date at the owner's request; the changes are listed
in `spec.md`, "Fourth analyze of 2026-09-30, changed in place".

| Id | Category | State | Where |
|---|---|---|---|
| I1 | Inconsistency | Fixed | `tasks.md` head ("two modules" → four, with the build and release pieces) and Path Conventions (three directories added) |
| I2 | Inconsistency | Fixed | Annex C §C.3, proof of the first form: "and the flag set of the call" (F100-FR-230 case 3, Principle IX) |
| I3 | Inconsistency | Fixed | Annex B §B.1, "Who writes" of the control plane: the list of F100-FR-217 |
| T1 | Terminology | Fixed | §X.7 column "Key" (generator follows); §X.6 row 157 and T223 wording |
| B1 | Ambiguity | Fixed | Five negated-subject MUST sentences rewritten as "MUST NOT" (F100-FR-067, 075, 118, 120, 148) |
| U1 | Underspecification | Fixed | Annex E §E.4: each cause of codes 1, 2 and 3 paired with its stop reason or "no member", from `consolidation.md` section 3 |
| U2 | Underspecification | Fixed | T017/T018: `checks:` lines for F100-FR-024, 026, 031; two static checks added to T018 |

Mechanical checks of the run (before and after the repairs): 236 requirements, all in the index
counts; 228 tasks; 236 of 236 requirements named by a test task, 234 by an implementation task
(F100-FR-222 and F100-FR-224 are acceptance requirements with test tasks only); 229 CT ids in the
annexes = 229 in `tasks.md`, the rule CT-100-(100+n) holding for every new requirement; every
`parity:` row exists, rows 1–43 all cited but row 42 (accepted); counts of the data files equal
those of `plan.md`, `tasks.md` and `data-model.md`; no placeholder; twenty principles evaluated,
no conflict. After the repairs: `generate.py`: 82 files written; `--check`: 82 files, 0 differ;
`check-traceability.py --require-all`: PASSED, checks a to h; `parity-profile.json` unchanged.

### Fifth run (2026-09-30, after the split of `tasks.md` into context-sized slices)

Between the fourth run and this one `tasks.md` was re-sliced: 228 tasks became 296 (T229 to T296
carry `slice of:`; every task carries `reads:`). The spec, plan and annexes were unchanged but for
the fourth run's repairs, so this run concentrated on the split. **No critical or high finding.**
Five medium and ten low findings, all repaired on the same date at the owner's request; the
changes are listed in `spec.md`, "Fifth analyze of 2026-09-30, changed in place".

| Id | Category | Severity | State | Where |
|---|---|---|---|---|
| I1 | Inconsistency | Medium | Fixed | T272 `reads:`: the supervision outcomes are the `supervise` row of `perCommand`, not `wait` |
| I2 | Inconsistency | Medium | Fixed | T233: LR-6 restated as "a process boundary is a package boundary"; now the two halves of F100-FR-006, with `process-model.json` in `reads:` |
| U1 | Underspecification | Medium | Fixed | T236: the forbidden set was "layer L1"; now every non-core package of the graph (F100-FR-012). With it T012/T013: a core package is marked `core: true` in the graph, not `nodeBuiltins: false`; T013 names FR-012's forbidden imports |
| C1 | Ordering | Medium | Fixed | T263 (US1) read T078 and T080 of US2; it now reads the data files, so US1 stands alone as the dependency table says |
| S1 | Systemic | Medium | Fixed | Every one of the 68 slices read against its annex sections and data keys (14 sampled first, then the other 54); 32 slice texts or `reads:` lines corrected, see `spec.md` |
| U2 | Underspecification | Low | Fixed | T246, T269: "two product versions" → `productVersions`, one list |
| I3 | Inconsistency | Low | Fixed | T243: a symbolic link is refused inside the control plane only (F100-FR-043) |
| U3 | Underspecification | Low | Fixed | T244: event stream and repository directory added (F100-FR-037); `prevent` only when the adapter confirmed (F100-FR-040) |
| U4 | Underspecification | Low | Fixed | T249: "unknown key" at any level; §X.8 and the late-read alias rule (F100-FR-203) |
| U5 | Underspecification | Low | Fixed | T234 (LR-9 cap, LR-11 major refusal), T248 (narrowing accepted only if stricter), T268 (FR-144 lock release and `blocked` event; FR-145 `source-changed` and the synthesized event) |
| I4 | Inconsistency | Low | Fixed | "no id changed its file": T015, T076, T094 and T202 did; the four exceptions are now stated in "Task ids after the split", "Within Each User Story" and the Split map. No document outside `tasks.md` names the old paths |
| I5 | Inconsistency | Low | Fixed | Slices "stand directly after their parent": T288 to T293 stand before T207; stated as the second exception |
| F1 | Format | Low | Fixed | The `requirement:` key of the eleven parity and characterization tasks is documented; the coverage count reads both keys |
| A1 | Fact | Low | Fixed | "600 KB of contract files" → about 1.1 MB, with what is never read whole |
| X1 | Count | Low | Fixed | `docs/ecosystem/PROGRESS.md`: 296 tasks after the split beside the 228 |

The sweep S1, by slice (all fixed): T232 (`validatorFor` keyed by the record's `schema` value,
F100-FR-048); T240 (no compile step, exact versions, no legacy names; the audience key
`distribution.audience` is in row 34 of the profile, not in `config-ranks.json`); T241
(MIT-compatible dependencies, F100-FR-029); T242 (`protection` is `detect` or `prevent`, never
`os`; the root value is `workspace`, not `workspace-part`); T245 (the as-is suffix rule, F100-FR-047);
T247 (the newer file wins and the as-is log line, F100-FR-057; the two stray places are in the
requirement, not in `layout-old-side.json`); T258 (`parity` value, register row and the owner rule of
F100-FR-212; the doctor is not named in §X.7); T260 (control-plane names only; §B.20 rows, the EP-09
view schema and the empty stop request as the stated exceptions); T261 (the roots of §B.5 and the
three places that are not roots); T263 (the three remaining vocabularies read from data files);
T266 (the approval marker → `gate:<N>:approved`, F100-FR-056; rule N-15); T267 (the behaviours of
F100-FR-145 to 147 asserted); T270 (the launch-check and relaunch refusals, `classified-transient`,
`all_approved` and the four arbitration literals, F100-FR-149 and 150; rows 13 and 14); T271 (the
transitions of the root, never a lock in `child`, the pinned executable, F100-FR-154); T280 (the core
packages are those marked `core: true`, not `contracts` and `kernel`); T281 (the four further
effects of `--accept-source-change` and exit 3 without it, F100-FR-173); T282 (never under `parity`,
F100-FR-179; the `[LOOP]` line is the `Loop line` row of `families`); T283 (§X.8 and F100-FR-178 in
`reads:`); T286 (F100-FR-143 in `reads:`); T292 (two hand-written sources are checked, the package
graph is copied); T293 (`--check` names every differing file and prints the count); T295 (the sixteen
names are rows 110 to 125 of the layout table; the hash-only rule and the status-line place of
F100-FR-229); T296 (the edge packages carry `note`, not `nodeBuiltins`; a core package reaches an
edge package only through its interface in `contracts`, F100-FR-234). Found sound: T229 to T231,
T235, T237 to T239, T250 to T257, T259, T262, T264, T265, T273 to T279, T284, T285, T287 to T291,
T294 (36 of 68).

Mechanical checks of the run (before and after the repairs): 296 tasks, T001 to T296 without gap;
236 requirements, 236 named by a test task (229 through `proves:`, 7 through `requirement:`),
234 by an implementation task (F100-FR-222 and F100-FR-224 acceptance-only, as before); 229 CT ids
in `tasks.md` = 229 in `requirements.json`; all nine success criteria under `checks:`; the union of
each parent's slices against the committed parent loses no requirement (six parents gained one);
every annex section, data file and schema file named by a `reads:` line exists; no task reads a
later task; no placeholder; twenty principles evaluated, no conflict (Principle XIX binds host
skills, not task lists). `generate.py --check`: 82 files, 0 differ; `check-traceability.py
--require-all`: PASSED, checks a to h. No annex, requirement, closed-set row, profile row or
generated file changed in this run. The analysis of feature 100 is closed on this run.
