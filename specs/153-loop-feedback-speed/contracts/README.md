# Contracts: 153-loop-feedback-speed

Layout follows `specs/100-specstride/contracts/` (a `schemas/` directory beside the feature's
documents); that directory itself is untouched. Everything in this directory is **design**, and
every file here is a **proposal** of spec 153: nothing is normative until feature 153's tasks are
implemented and the owner's rulings (`rulings.md`) are answered. No schema of another feature and
no file of `specs/100-specstride/contracts/` is changed (F100-FR-212).

- `schemas/*.schema.json` — one JSON Schema (draft 2020-12) per **new** record the plan's slices
  create; `$id` pattern `specstride.<name>/1`, as in feature 152's contracts. Each `description`
  cites the `F153-FR` it serves and points into [data-model.md](../data-model.md):
  - `gate-command-binding.schema.json` — D1 (F153-FR-010…-012; ready)
  - `red-gate-budget.schema.json` — D3 (F153-FR-020…-023; blocked on CQ-153-05 A)
  - `commit-gate-timing.schema.json` — D4 (F153-FR-036; blocked on CQ-153-09)
  - `commit-scan-result.schema.json` — D11 (F153-FR-024…-028; blocked on CQ-153-06/-17)
  - `task-group.schema.json` — D9 (F153-FR-054…-057; blocked on CQ-153-07/-15)
  - `report-rows.schema.json` — D6 (F153-FR-039…-041; exit codes per CQ-153-16)
  - `reuse-decision.schema.json` — D12 (F153-FR-013, -014; specified, built only under CQ-153-02 A)
  - `red-gate-notice.schema.json` — D13 (F153-FR-016…-019; ready — the inputs of feature 105's renderer)
  - `workspace-selection.schema.json` — D15 (F153-FR-045…-047; ready)
- Existing records are **not** re-schematised here: the event envelope (feature 111), the verdict
  pins (`VERDICT_PINS_SCHEMA`, `core/src/critic-input/pins/store.ts`), the micro ledger records
  (feature 115), the handoff record (`core/src/carry/handoff.ts`) and the failure-summary record
  (`packages/verification`) already carry schemas in their owning features.
- `*-table.json` — written by the tasks: one `specstride.table/1` copy per rule-id set of plan.md
  ("Rule-id sets fixed by this plan"), mirrored by a constant in the code.
- `closed-set-deltas.md` — the proposed rows for closed vocabularies and registers, each marked
  proposal and tied to its ruling.
