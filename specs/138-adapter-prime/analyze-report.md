# Analysis report: Prime harness adapter (feature 138)

Run of `speckit-analyze` on `spec.md`, `plan.md` and `tasks.md`, read only. Passes: 1. Repairs: 0
needed after the first pass. `python3 docs/ecosystem/check-traceability.py` was run and its lines
were read for this feature only.

## Coverage

| Check | Result |
|---|---|
| Functional requirements | 43 (F138-FR-001 to F138-FR-043); below the split threshold of about 45 |
| Success criteria | 9 (F138-SC-001 to F138-SC-009) |
| Requirements with a test line | 43 of 43 |
| Requirements named by at least one task (`covers:` or `requirement:`) | 43 of 43 |
| Behaviour items assigned to this feature | 62 of 62 are in the `origin:` of a requirement |
| Behaviour items named in a `proves:` line of a test task | 62 of 62 |
| Clusters | 13 of 13 (C-035, C-052, C-053, C-054, C-058, C-061, C-062, C-066, C-154, C-168 to C-171) |
| Rows not carried (`superseded-by`, `dropped`) | 0 |
| `[NEEDS CLARIFICATION]` markers | 0 |
| Names specific to the owner's machines | 0 found by text search |
| Closed sets: row 39 owned, with members and the rule for an unknown value | yes |
| First task is the capture | yes (T001) |

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Low | F138-FR-041 cites `DV-112`, a register row that does not exist yet. The traceability check reports it as `[h2]`. It is reported to the orchestrator with the text of the row | Open, expected |
| 2 | Low | Four readings are marked `CQ-149` to `CQ-152`; each has a recommended answer under "Assumptions" | Open, reported |
| 3 | Low | Six settings have keys proposed here, and one (`stream.capture`) has no row in annex X §X.7 | Open, reported |
| 4 | Info | The reader sits in the package of the prime adapter and pi imports it; the package graph of feature 100 leaves this to feature 138 and needs no change | Decided in `plan.md` |
| 5 | Info | Several facts stay `unverified` until the captures of T001 (record set, limit record, tool list in the initial record, resume flag, extra critic flags, allow-list flag, cost unit). Each has its check in its requirement | By design |
| 6 | Info | F138-FR-033 and the critic path: an earlier held error is replaced by a later success terminal, as at the baseline. The critic function of the baseline says the opposite in a comment but behaves as stated here | Recorded in Clarifications |

## Consistency

- Terms follow the glossary: "phase attempt", "phase gate" and "harness adapter" are written in their qualified forms.
- The spec cites contracts of feature 100 and fixture families of feature 141 only; no requirement of another tier 2 feature is cited.
- The plan's argument table and `contracts/argument-table.json` agree with F138-FR-008, F138-FR-010, F138-FR-017 and F138-FR-020.
- The success criteria are measurable and name no library.

## Split

None proposed. If the count rose above 45, group G4 (F138-FR-023 to F138-FR-037, 15 requirements with the origins C-168 to C-171 and the tests `PT-138-C-168-*` to `PT-138-C-171-*`, `CT-138-23`, `CT-138-24`, `CT-138-37`) would leave first, as the reader of the family.

## What did not pass after repairs

Nothing that a repair can fix. The open items are findings 1 to 3.

## After the cross-feature review

Dated 2026-09-30. Repairs of the items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, section
"Feature 138", and of its pointers. The detail is in `repair-report.md`.

### What changed

| Subject | Change |
|---|---|
| Ruling P14 | F138-FR-004: the default and the automatic pick are barred under every audience and for both roles. F138-FR-047 bars the automatic pick as critic |
| Principle VIII | New F138-FR-044 (auto-loaded context off for the proposer by default), F138-FR-045 (the home per auth tier), F138-FR-046 (native memory, recorded per run). Row VIII of the plan is unticked: the throwaway home rests on an unverified fact |
| Containment | F138-FR-015: the opt-in to C0 and `loop.parallel.allow_detect` from user configuration only (CQ-183) |
| Critic | New F138-FR-047: the critic-diversity rule, the warning, the identity |
| Citations, keys, counts | F138-FR-022, F138-FR-043, F138-FR-003; `stream.tap` in `contracts/parity-rows.json`; `provider_other` is retryable; the register is cited without a count; the terms gate belongs to feature 147 |
| Tasks | T064 to T072 added; 14 `proves:` lines hold requirement ids; parity and characterization tests at the root of the repository |

### Counts

| Check | Result |
|---|---|
| Functional requirements | 47 (F138-FR-001 to F138-FR-047); above the threshold of about 45; no split is made, the count is reported |
| Success criteria | 11 |
| Tasks | 72 (T001 to T072) |
| Requirements with a test line | 47 of 47 |
| Requirements named by at least one task | 47 of 47 |
| New requirements with a test task that carries `proves:` | 4 of 4 (T064 to T067) |
| Behaviour items in an `origin:` and in a `proves:` line | 62 of 62, unchanged |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None |
| Task without a requirement | None; T072 serves F138-FR-042 and Principle XVII |
| The four switches | The same four in F138-FR-044, the argument table of `plan.md`, `contracts/argument-table.json` and `contracts/descriptor-prime.json` |
| The home | F138-FR-045, the row "Home" of the argument table, `isolation.configHome` of the descriptor and `data-model.md` agree; F138-FR-005 names the home and the session directory variable |
| Number of captures | Five in `spec.md`, `plan.md`, `tasks.md`, `research.md`, `quickstart.md`, `contracts/capture-plan.json` and `contracts/README.md` |
| Keys | `harnesses.prime.proposerCustomisations` (row 131), `memory.native.proposer` (row 29), `harnesses.prime.overlay` (row 30), `stream.tap` (rows 79, 86): the spellings of feature 100 and of `config-keys.tsv` of feature 110. The first is not yet in the key list of feature 110 |
| Placeholders | No `CQ-pending-<n>` of the first run remains. Three new questions were marked `CQ-234` to `-3` and reported; the re-check B-8.7 (2026-09-30) renamed them `CQ-234` to `CQ-236` |
| Names specific to the owner's machines | None found by text search; no variant and no default name of the launcher is written |

### Open

| # | Finding |
|---|---|
| 1 | Row VIII of the Constitution Check is not passed until capture (5) shows that the agent executable follows the home variable |
| 2 | `SPECSTRIDE_PRIME_FLEET_BIN` and the order of the two variables are in no alias table yet; F138-FR-003 cites the tables that are to hold them |
| 3 | Register row DV-112 names FX-18, in which no scenario starts the prime stub |
| 4 | The split proposed in the first report stands as the proposal if a split is wanted: group G4 leaves first |

## Analyze run of 2026-09-30 (constitution v3.0.1)

| ID | Severity | Finding | State |
|---|---|---|---|
| C1 | Critical | Principle VIII: tier 2 could run on an unverified throwaway home | Repaired: F138-FR-045 refuses auth tier 2 until capture (5); plan row VIII passed |
| C2 | Critical | Principle IX: JSON-mode proof took the tool list only "where stated" and never checked the session id | Repaired: F138-FR-021 (F100-FR-230 case 2); `data-model.md`; T046 |
| C3 | Medium | Plan named v3.0.0; row IX not re-read against v3.0.1 | Repaired |
| U1 | Medium | Principle X: no warning on a version change between passes | Repaired: F138-FR-002, T017 |
| I1 | Medium | Weaker proof under `parity` contradicted F100-FR-230 ("under `parity` no proof is made") | Repaired: F138-FR-021, US4 scenario 1, F138-SC-007 follow F100-FR-230; plan row IX and Complexity Tracking record the inherited deviation |
| I2 to I6 | Low | Counts, register rows, fixture names, audience, T062 wording | Repaired |
| I7, D1, E1 | Low | Continuation tests with the stub; CT-138-43 on two tasks; T072 mapped to F138-FR-042 | Accepted |

Open item 1 of the section above (row VIII) is closed by C1.

### Proposed upstream fixes

None needed. I1 was resolved inside this feature by following F100-FR-230 and the Principle IX
row of the plan of feature 100, which already rules "no proof under `parity`, for any harness".
