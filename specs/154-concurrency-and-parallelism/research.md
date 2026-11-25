# Research: Concurrency and parallelism

## Learnings

- `specstride report` read `<workdir>/.specstride` and `features/<slug>/…`, while the engine writes
  `~/.specstride/workspaces/<sha16>/runs/<run>/events.jsonl`. Fixed by PR #40. Other inspection
  verbs (`events`, `tail`) still resolve the old root.
- F142-FR-023 counts failed groups **per phase attempt**. With one group per attempt the layer is
  never switched off, which is how one finished group ran on 21 attempts of 153's phase 23. The
  constant `failedGroupsBefore: 0` follows the spec. It isn't the bug.
- F142-FR-059 and F143-FR-011 forbid any check in a worker tree. A group's own check there is an
  amendment, not a delivery.
- The merge check runs the phase's whole inner set (`["check"]`, `npm test`), the same as the gate,
  so a suite that is red before the group sends every group to repair.
- An approval is bound to its verdict (II, F101-FR-031). The binding to a commit is the engine's
  extra check, relaxed by patch-id in PR #41. The tree comparison at phase entry never blocks
  (F149-FR-008).
- Spec 153 has no `constitution-grounding.md`, and spec 142 has no V-nn → FR table: R29v maps
  V-01…V-27 to PU-79…PU-104, so its own file is the source.
- The integrity kinds are not one closed set: row 65 lists only the kinds that reach the critic,
  and the engine already emits unregistered kinds (`state-restored`).
- Pipeline exit 22 ("A stage failed") is the existing member for a parked stage. No exit code is
  needed.
- The canonical model has no phase-dependency field (`SpecPhase` in
  `packages/contracts/src/records/generated/canonical-spec-model.ts`), and the launch contract's
  `depends_on` is a stage key only. CQ-154-07's field is new in both the model and the adapter.
- No existing closed-set member carries the meaning of `repeat`, `dependency`, `group-check` or
  the slot-wait, landing and set-aside events; the nearest, `follows-writer`, belongs to the
  check-runner's batch admission set and must not be reused across sets (CQ-154-09 A).
- Parallel admission today: the launch passes `utilisationPerCent: []`
  (`packages/cli/src/engine/parallel-launch.ts:252`), and `groupGate`
  (`packages/layer-parallel/src/admission.ts:939`) has no caller anywhere, so headroom from
  observation, the halving and the cycle charge are unreached together.
- Two plan renderers exist today: `printThePlan` (`packages/layer-parallel/src/plan.ts:543`) is
  stored on a doctor observation and never printed, while the dry run prints `parallelPlanLines`
  (`packages/pipeline/src/contract/launch/dry-run.ts:167-205`) from the contract's flags. The
  doctor handler (`packages/cli/src/engine/handlers.ts:580-631`) is a hard-coded list of findings
  that does not read the doctor registry. P1's "one renderer, two callers" replaces both.
- `concurrentSessions`: the dsh adapter declares `3, status: verified` from a live capture
  (CT-130-46); the claude adapter declares `null` until its "capture B". Neither has the
  fake-binary test of F154-FR-030.
- The quota module of feature 127 (`packages/policy/src/quota/`) has no engine caller today:
  `enterPause`, `observe*` and `resume` are reached only from its own tests. F154-FR-041's hold
  record is written where that module's pause record is, once the engine calls it.
- No run-scoped temporary root exists: the gate makes one `mkdtemp` per batch
  (`packages/cli/src/engine/run-feature.ts:1273`); `tempRoot` is not found in `packages/`.
- `FX-PAR-S` is declared in `specs/142-parallel-units/contracts/fx-par.json` and pinned by a
  data test, but the `experiment:e6` runner its quickstart names is not in `package.json`.
- The divergence register (`docs/ecosystem/consolidation.md`) ends at DV-120 while
  `specs/141-parity-oracle/contracts/register-map.json` carries rows to DV-122: a drift to
  record, not to fix here.

### Stage 2 validation (2026-11-25)

Four read-only validators checked the spec: anchors (118 ids and 19 numbers), constitution
coverage (18 constraints, 15 channels, 12 tensions), internal consistency (ids, closed sets,
tables) and the evidence for each open ruling. All sixteen recommendations stood; three were
tightened (CQ-154-07's wording, CQ-154-18's "off on every measured run", CQ-154-15's note that
the trial rule is stricter than register rows 134 and 137).
