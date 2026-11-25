# Contracts: 154-concurrency-and-parallelism

Layout follows `specs/100-specstride/contracts/` and `specs/153-loop-feedback-speed/contracts/` (a
`schemas/` directory beside the feature's documents); neither of those directories is touched.
**Everything here is a proposal of spec 154** until its rulings are implemented: no file in this
directory is normative, and no schema, table or row lands in a package before feature 154's tasks
carry it there. The closed-set members and register rows are proposals under CQ-154-09 (and
CQ-154-14 for the slot and hold records); see [closed-set-deltas.md](closed-set-deltas.md).

- `schemas/*.schema.json` — one JSON Schema (draft 2020-12) per **new** record the plan's slices
  create; `$id` pattern `specstride.<name>/1`. Each `description` cites the `F154-FR` it serves and
  points into [data-model.md](../data-model.md). Records are closed (`additionalProperties: false`);
  enums are members of plan.md's rule-id sets and spec.md's "Closed sets" only.
  - `plan-lines.schema.json` — D1, the printed plan: the lines of the one renderer and the ceiling
    statement (F154-FR-009…-011). The stored plan itself is the existing `specstride.parallel-plan/1`
    of feature 142 and is not re-schematised here.
  - `report-rows-154.schema.json` — the report rows the feature adds (F154-FR-012, -014, -015, -017).
  - `trial.schema.json` — D3, the trial record `specstride.trial/1` (F154-FR-018, -019).
  - `worker-check.schema.json` — D6, the worker check record (F154-FR-034…-036).
  - `host-slot.schema.json` — D8, the slot record in user-level state (F154-FR-039…-042, -044).
  - `host-hold.schema.json` — D9, the hold record of one account (F154-FR-041, -044).
  - `stage-workspace.schema.json` — D11, one stage run of a wide group (F154-FR-049, -055).
  - `landing.schema.json` — D11, one landing of a stage (F154-FR-050…-054).
  - `merge-baseline.schema.json` — D7, the comparison a merge check was judged by (F154-FR-028).
  - `phase-queue.schema.json` — D12, the validation queue entry (F154-FR-056…-060).
  - `set-aside.schema.json` — D13, a speculative unit discarded after a rejection (F154-FR-064).
- Two declarations of the spec's "Key Entities" are **not** schema files of this directory, because
  each extends a record owned by another feature; both are proposal rows in
  [closed-set-deltas.md](closed-set-deltas.md):
  - the stage-group declaration is part of the F107 contract schema (`configuration.stageGroups`:
    `width`, `never_together: [{ stages, why }]`; F154-FR-048; CQ-154-05);
  - the phase-dependency declaration is part of the canonical model schema (`SpecPhase.dependsOn`,
    `SpecPhase.writeScope`; F154-FR-056; CQ-154-07).
- `rule-tables/*.json` — nine `specstride.table/1` files, one per rule-id set of plan.md ("Rule-id
  sets fixed by this plan"), to be mirrored by a constant in the code that imports it (F154-FR-003):
  `independence-table.json` (PG-1…PG-3), `repeat-table.json` (RP-1, RP-2),
  `merge-check-outcome-table.json` (MG-1…MG-3), `worker-check-table.json` (WC-1…WC-4),
  `slot-admission-table.json` (SL-1…SL-5), `landing-table.json` (LD-1…LD-4),
  `validation-queue-table.json` (PQ-1…PQ-3), `stage-admission-table.json` (SG-1…SG-4), `speculation-table.json` (SP-1…SP-6),
  `trial-pass-mark-table.json` (TRI-1…TRI-3). Each row carries its rule id, the member text copied
  verbatim from plan.md, its `when`, its decision and the `F154-FR` it serves.
- `fixtures-154.json` — the six fixtures FX-154-PLAN, -GROUPS, -SLOTS, -STAGES, -PHASES and -SPEC
  (plan.md "Testing"; quickstart.md), keyed by id as `specs/142-parallel-units/contracts/fx-par.json`
  is.
- `closed-set-deltas.md` — ALL PROPOSALS: every closed-set member, parity-register row, spec
  amendment and schema amendment the feature asks for, each tied to its ruling.
