# Repair report — 140-reverse-inventory-and-lint

Date: 2026-09-30. Every item was checked against the files before a change.

| Item | Class | Severity | State (`done`, `not applied`, `open`) | Files and lines changed | Note |
|---|---|---|---|---|---|
| W-140-01 | repair | high | done | `spec.md` F140-FR-021 (text, `test:`, `divergence: DV-006; DV-116`), "Contracts of feature 100 used" (new row and the paragraph under the table), "Closed sets" (line "Schema of the inventory"); `contracts/inventory.schema.json` (`schema` in `required` and `properties`); `data-model.md` (row Inventory); `plan.md` (row XVIII, "Physical choices"); `tasks.md` T019, T024, T034; `quickstart.md` scenario 8; `research.md` D-4 | Verified: the document had `schema_version` 1 and no `schema`. `schema_version` 1 stays. The field is no input of the fingerprint |
| W-100-16 (pointer) | repair | low | done | `contracts/inventory.schema.json` | The file had no `$id`. Now `urn:specstride:schema:specstride.reverse-inventory/1`. `contracts/finding-codes.json` is a data file, not a schema file, and is unchanged |
| W-X-07 (pointer) | repair | medium | done | `plan.md` "Project Type"; `research.md` "Gaps in feature 100"; `tasks.md` T001, T031; `spec.md` "Closed sets", introduction | Verified: `package-graph.json` gives `@specstride/reverse`, layer L6, owner "108, 140". The three gaps reported at the split are closed in feature 100 |
| W-X-09 (pointer) | repair | medium | done | `plan.md` "Target Platform", row XVII; `tasks.md` T035 | |
| W-X-11 (pointer) | repair | medium | done | `spec.md` F140-FR-016, `parity:` line | Row 69 of annex X §X.7. The table "Rows of the `parity` profile" already named row 69 |
| W-X-20 (pointer) | repair | medium | done | `tasks.md` T007 to T011, T019, T020, T029; `spec.md` F140-FR-021 `test:` (CT-140-4) | Verified: 44 of the names of `test:` lines were in no task. Three names existed in `tasks.md` only (`PT-140-C-124-inventory`, `PT-140-C-131-inventory-behaviour`, `PT-140-C-131-units`); they were group names of a task and are replaced by the names of `spec.md`, which are those of the traceability files. Now 54 names on both sides |
| W-X-29 (pointer) | repair | low | done | `plan.md` row XIX; `tasks.md` T036 | See "What another feature or the orchestrator must do", point 3 |
| W-X-30 (pointer) | repair | low | done | `research.md` "Sources", row "Baseline code" | |
| W-X-34 (pointer) | accept | low | not applied | — | The rule is "No change" |
| Follow-up of feature 141, row 140 | repair | — | done | `tasks.md` T007 to T010; `quickstart.md` last paragraph | Names taken from `specs/141-parity-oracle/contracts/fixture-catalogue.json`; each group is cited by its members |
| W-X-05 (count of the register) | repair | medium | done | `spec.md` "Assumptions" | "113 rows" removed; the register is named without a count |

Counts: 10 done, 1 not applied, 0 open.

## Requirements added or changed in place

| Requirement | Change |
|---|---|
| F140-FR-021 | Changed in place: field `schema`, refusal by the reader, `divergence: DV-116`, tests CT-140-4 and CT-140-5 in the `test:` line |
| F140-FR-016 | Changed in place: the `parity:` line names row 69 |

No requirement was added. The feature has 26 functional requirements, 3 success criteria and 36 tasks (T034, T035 and T036 are new). New test: CT-140-5 (task T034).

## What another feature or the orchestrator must do

| # | Who | What |
|---|---|---|
| 1 | Feature 141 | Confirm the oracle handling of DV-116: a normalization rule that removes the key `schema` before the inventory is compared on FX-30. T019 and `quickstart.md` assume it |
| 2 | Feature 141 | In `contracts/fixture-catalogue.json` the scenario `lint-<code>` of FX-30 has `members: ["lint-claims-missing"]` near line 2211, while a second list near line 2216 holds all 38 names. This feature used the 38 names |
| 3 | Orchestrator, feature 108 | The output of `reverse lint` is one as-is line per finding and has no byte cap, while F108-FR-034 caps every command that the host skill calls at 1,120 bytes (2,240 on a failure). This feature states the cap for `reverse inventory` and records the lint's sizes (T036); it adds no cap, since a cap would change as-is output under `parity` |
| 4 | Feature 108 | The guard and the plan read the inventory: they read it through the schema id and may meet the refusal of F100-FR-049. The worklist says feature 108 needs no change; no requirement of 108 was checked by this agent |

## New questions (each with a recommended answer and its source)

None. CQ-091 stays the one question this feature depends on; no `CQ-pending-*` placeholder was in the feature.

## Register rows needed (with the text)

None. DV-116 exists in `docs/ecosystem/consolidation.md` and is cited.

## Checks

| Check | Result |
|---|---|
| Generator or check in `contracts/tools/` | None exists in this feature |
| `contracts/inventory.schema.json` parses as JSON | Yes |
| Test names of `spec.md` against `tasks.md` | Equal, 54 names |
| Scenario names with a dot | None |
| `python3 docs/ecosystem/check-traceability.py --require-all` | PASSED: checks a to h |
| Files written outside `specs/140-reverse-inventory-and-lint/` | None, except scratch files in the scratch directory of this agent |
| Git commands that change the repository, subagents, model calls | None |
