# Specification Analysis Report: feature 140-reverse-inventory-and-lint

Date: 2026-09-29. Artifacts read: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/`, the constitution v3.0.0. This feature is group G-B of the split of `108-reverse`. The analysis ran twice: on the first version and after repairs.

## Findings

| ID | Category | Severity | Location(s) | Summary | State |
|----|----------|----------|-------------|---------|-------|
| C1 | Coverage | MEDIUM | `tasks.md` | The old test `CT-108-141` (byte-exact helpers) and the three tests of the criteria needed new names | **Repaired**: CT-140-1 to CT-140-4, in `tasks.md` and in the table "Ids before the split" |
| C2 | Coverage | MEDIUM | B-1623, B-1621 | The exit-code requirement mixed the plan with the lint and the inventory | **Repaired**: B-1623 stayed in `108-reverse`; F140-FR-001 carries B-1621, B-1622, B-1624, B-1871, B-1872 |
| S1 | Inconsistency | HIGH | annex B of feature 100 | The inventory format is read by the guard, the plan and the lint and has no contract in feature 100; this feature specifies it | **Open; reported** |
| S2 | Underspecification | MEDIUM | F140-FR-016 | `reverse.*` limits have no row in annex X §X.7; `SPECSTRIDE_CONTEXT_BUDGET` has no alias row | **Open; reported** |
| S3 | Underspecification | MEDIUM | Annex X §X.6 | No rows for the closed sets of this feature | **Open; reported** |
| S4 | Design | LOW | `plan.md` | The package graph names one package for the reverse capability, owned by 108; this feature's code lies in its directories | **Open; reported** |
| G1 | Terminology | LOW | F140-FR-011 | The literal `[NEEDS CLARIFICATION` is the marker the lint counts | **Accepted**: behaviour |
| V1 | Ambiguity | LOW | F140-FR-017, F140-FR-026 | Git and file-system behaviour on macOS are `unverified` | **Open by design** |
| K1 | Constitution | — | `plan.md` | Twenty principles answered | **No issue**: N/A for VIII, IX, X, XI, XIV, XV, XVI, XX with reasons |

No finding is CRITICAL. No open question of this feature beyond the reported gaps.

## Additional checks

| Check | Result |
|---|---|
| Directory | Exactly `specs/140-reverse-inventory-and-lint` |
| Requirement ids | F140-FR-001 to F140-FR-026, F140-SC-001 to F140-SC-003, none twice; the table "Ids before the split" maps them |
| Every requirement has `test:` and a task | Yes |
| Own script over both parts | 245 items and 1 as-is requirement here; each in one `origin:` and one `proves:`; none in both parts |
| Citations between the parts | None of a requirement id |
| The machine-specific backend | Not named |

## Coverage summary

- Functional requirements: 26, each with a task. Success criteria: 3, each with a test task. Tasks: 33.

## After the cross-feature review

Date: 2026-09-30. Repairs of act 8.6, from the section of feature 140 in `docs/ecosystem/reviews/REPAIR-WORKLIST.md`, the table "What the other features must follow" of feature 100 and the follow-up report of feature 141. The full list is in `repair-report.md`.

### What changed

| Item | Change | Files |
|---|---|---|
| W-140-01 | The inventory carries `schema` `specstride.reverse-inventory/1`; `schema_version` 1 stays as the as-is field; a reader refuses an inventory without the field; register row DV-116; new test CT-140-5 and task T034 | `spec.md` (F140-FR-021, "Closed sets", "Contracts of feature 100 used"), `contracts/inventory.schema.json`, `data-model.md`, `plan.md`, `tasks.md` (T019, T024, T034), `quickstart.md`, `research.md` |
| W-100-16 | `$id` `urn:specstride:schema:specstride.reverse-inventory/1` | `contracts/inventory.schema.json` |
| W-X-07 | The stale sentence on the package graph is replaced; the gaps of `research.md` are marked closed | `plan.md`, `research.md`, `tasks.md` (T001, T031) |
| W-X-09 | Row XVII names the skip rule and task T035 | `plan.md`, `tasks.md` |
| W-X-11 | Row 69 of annex X §X.7 in the `parity:` line of F140-FR-016 | `spec.md` |
| W-X-20 | Every test name of a `test:` line is named by a task; three names that only `tasks.md` held are replaced by the names of `spec.md` | `tasks.md` (T007 to T011, T019, T020, T029), `spec.md` (CT-140-4) |
| W-X-29 | Row XIX states the share in bytes; task T036 measures it | `plan.md`, `tasks.md` |
| W-X-30 | The baseline is named without a path | `research.md` |
| Follow-up of feature 141 | Scenario names without a dot, each group cited by its members | `tasks.md` (T007 to T010), `quickstart.md` |
| W-X-05 | The register is named without a count | `spec.md` ("Assumptions") |

### State of the earlier findings

| ID | State now |
|---|---|
| S1 | Closed: annex B §B.20 holds the schema id, and the inventory carries it |
| S2 | Closed: row 69 of annex X §X.7; the alias of `SPECSTRIDE_CONTEXT_BUDGET` is in §X.8 |
| S3 | Closed: rows 146 to 149 and 151 to 155 of annex X §X.6 |
| S4 | Closed: the package graph names 108 and 140 as owners of `@specstride/reverse` |

### Consistency pass over the places touched

| Check | Result |
|---|---|
| Requirement without a task | None. F140-FR-021 has T004, T005, T019, T020, T024 and T034 |
| Task without a requirement | None. T034 proves F140-FR-021; T035 and T036 carry `covers:` |
| Test names of `spec.md` and of `tasks.md` | Equal: 54 names (49 parity tests, CT-140-1 to CT-140-5) |
| Scenario names | No name with a dot in `tasks.md` or `quickstart.md`; the names are those of the catalogue of feature 141 |
| The value of `schema` | `specstride.reverse-inventory/1` in `spec.md`, `data-model.md`, `plan.md`, `tasks.md`, `quickstart.md`, `research.md` and the schema file |
| Paid tasks | None; no task calls a model |
| Coverage check | `python3 docs/ecosystem/check-traceability.py --require-all` passes (checks a to h) |

### What stays open

| Subject | State |
|---|---|
| The normalization rule that removes the key `schema` before the inventory is compared on FX-30 (DV-116) | To be confirmed by feature 141; T019 assumes it |
| The output of `reverse lint` called by hand has no byte cap | The as-is output is one line per finding; T036 records the sizes. Reported in `repair-report.md` |
| macOS | `unverified` until T035 passes on a runner |

### Coverage summary

- Functional requirements: 26, each with a task. Success criteria: 3, each with a test task. Tasks: 36.

## Third analysis run

Date: 2026-09-30. Full analysis of `spec.md`, `plan.md` and `tasks.md` against the constitution v3.0.1; every finding is resolved in this feature or proposed upstream.

| ID | Category | Severity | Location | Summary | State |
|----|----------|----------|----------|---------|-------|
| I1 | Inconsistency | MEDIUM | `spec.md` "Rows of the `parity` profile" | `SPECSTRIDE_CONTEXT_BUDGET` was said to have no alias row in annex X §X.8; the row exists | Repaired |
| O1 | Ordering | MEDIUM | `tasks.md` T024, T034 | Test T034 (Phase 6) must fail before T024 (Phase 4) is done | Repaired: T024 names T034 as written first |
| C1 | Coverage | MEDIUM | `tasks.md` T033 | Quickstart scenarios 1 to 7 of 8 were run | Repaired: 1 to 8 |
| I2 | Inconsistency | LOW | `spec.md` "Clarifications" | "feature 100 holds no contract" is stale since annex B §B.20 | Repaired: dated superseded note |
| I3 | Inconsistency | LOW | `spec.md` "Closed sets", codes by level | `structure.required` listed at level 0, which owns no artifact | Repaired |
| U1 | Underspecification | LOW | `plan.md` source tree | `data/` (T003) and `units` (T030) missing | Repaired |
| U2 | Underspecification | LOW | `plan.md` documentation tree | `repair-report.md` missing | Repaired |
| I4 | Inconsistency | LOW | `plan.md` "Physical choices" | The removal of `schema` named no rule | Repaired: N-29, F141-FR-012 |
| D1 | Inconsistency | LOW | `quickstart.md` last paragraph | The rule was "to be confirmed by feature 141"; F141-FR-012 confirmed it as N-29 | Repaired |
| D2 | Coverage | MEDIUM | `plan.md` row XIX; F108-FR-034 | The output of `reverse lint` has no byte cap, while F108-FR-034 caps commands the host skill calls | Proposed upstream: P-1; `spec.md` "Assumptions" states the rule |
| D3 | Tooling | LOW | `docs/ecosystem/check-traceability.py` | Check d fails: the register holds DV-118 and DV-119, the script expects 117 rows | Proposed upstream: P-2 |
| T1 | Terminology | LOW | F140-SC-003, F140-FR-021 | "Two plans" against "two inventory runs" | Accepted: a plan runs the same inventory path; no contradiction |
| V1 | Ambiguity | LOW | F140-FR-017 | macOS `unverified` | Accepted: by design (Principle XVII); T035 |

## Proposed upstream fixes

| # | Target file and section | Exact change | Why |
|---|---|---|---|
| P-1 | `specs/108-reverse/spec.md`, F108-FR-034 | After "... or 2,240 bytes on a failure." add: "`reverse lint` is not called by the host skill between invocation and launch; it runs as a verification command of a phase inside the engine, and its output (one as-is line per finding and a summary line, feature 140, F140-FR-003) is outside this cap. `reverse inventory` is inside it." | A cap on the lint would change as-is output under `parity` (F140-FR-003, row 19 of annex X §X.7); the lint's share of a host session is 0 bytes (plan row XIX of feature 140); T036 of feature 140 records its sizes. Feature 140 states the rule in "Assumptions" |
| P-2 | `docs/ecosystem/check-traceability.py`, line 59 | `N_REGISTER = 117` becomes `N_REGISTER = 119` | `docs/ecosystem/consolidation.md` holds DV-001 to DV-119; DV-118 and DV-119 are real rows, and the constant is stale. Feature 140 cites none of them, so it needs no change |
