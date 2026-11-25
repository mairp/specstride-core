# Quickstart: 154-concurrency-and-parallelism

How a reviewer sees each slice work **without a live run**: fixtures, stub agents and recorded
state only — no model is called (F154-FR-005; the owner's quota is shared with live runs). Every
switch is off by default and off under `parity`; nothing here is switched on by a test. Commands
are the shape of the validation `speckit-tasks` spells out; this stage writes no code. Designs and
anchors are in [plan.md](./plan.md); requirements and success criteria in [spec.md](./spec.md).

Prerequisites: a built workspace (tests run from source on Node ≥ 22; per-package runner
`node tests/isolate.ts node --test <file>`); stub agents of the test kit (`stubClaude` of
`packages/cli/test/engine/loop-speed-helpers.ts`, the `startDoor` and `runner` seams, fake
binaries); the six fixtures of `contracts/fixtures-154.json` under
`tests/fixtures/154/`; and the frozen events of feature 153 as `recorded-153/` beside PR #40's
`recorded-152/` (the first case of every trial, F154-FR-019).

## P1 — Measure: one plan, two callers; the report; the trial (FX-154-PLAN)

1. Fixture: a task list with two runs of consecutive `[P]` tasks with disjoint named paths; and
   `recorded-153/`.
2. Run `node --test packages/layer-parallel/test/`, `packages/cli/test/engine/`,
   `packages/pipeline/test/`; then by hand on the fixture `node packages/cli/bin/specstride doctor`
   and `launch --dry-run` (verbose flag off, then on).
3. Expected: the plan "names the groups, every task left serial with its reason, and the ceiling
   under equal task cost with the statement that it is a ceiling and not an expectation, and no
   slot, record or worker exists afterwards" (F154-FR-009, -010, -011); the doctor "prints the
   same bytes as the dry run" (F154-SC-002: byte-identical plan and hash on 100 % of repeated
   derivations). With the option off the plan is printed, labelled `plan the option would produce`.
   On `recorded-153/`: `node packages/cli/bin/specstride report` prints "336 attempts started, 29
   approvals over 29 phases, 274 of 386 in-pass checks failed, 28 groups ended `repair`, and
   changes 0 files" (F154-SC-009); a missing share prints `not in the events`; no forecast.
4. Not observed: a file written by either verb, a slot taken, a worker started, a second renderer,
   any plan line under `parity` (F154-SC-012).

## P2 — The layer in full (FX-154-PLAN with the phase-23 replay)

Switches: `loop.parallel.units`, `loop.parallel.noRepeat`, `loop.parallel.mergeBaseline`.

1. Fixture: a phase whose plan holds three admissible groups; 153's phase 23 with its ledger of
   failed groups; a group that applies 0 paths; a base tree with a red inner check.
2. Run `node --test tests/parallel/154/` (rule tests: RP-1/RP-2, MG-1…MG-3) and
   `node --test packages/cli/test/engine/` (the loop over groups, `groupGate`, the admission
   event, the cycle charge); the door: `node --test packages/adapter-dsh/test/concurrent-sessions.test.ts`.
3. Expected: "each group starts at its clean boundary in plan order, and every task of the phase
   is in exactly one group or the serial list" (F154-FR-020); on the replay "its group `g-23-1`
   starts at most once while the paths its tasks name are unchanged (against 21 starts on record)"
   (F154-SC-010, RP-1); "0 merge checks run after an application of 0 paths (against 22 of 28 in
   153)" (F154-SC-011, MG-1); a merge check failing only on commands with the base's failure
   signature "MUST NOT charge a repair and MUST NOT count as a failed group" (F154-FR-028, MG-2);
   with N = 4 fake sessions "the configuration home's bytes are identical before and after"
   (F154-SC-014).
4. Not observed: a group limited to `groups[0]`; `utilisationPerCent: []` reaching `groupGate`;
   the verification gate touched by the baseline; a check run in a worker tree other than P3's;
   an untested adapter (`claude` before capture B) opening the door — reason `harness` instead.

## P3 — Task groups are the parallel unit (FX-154-GROUPS)

Switches: `loop.parallel.groupUnits`, `loop.parallel.groupCheck`.

1. Fixture: two frozen groups of one phase with disjoint write scopes (independent by CQ-154-02);
   a pair whose later group names a path inside the earlier one's scope; a worker whose declared
   acceptance check fails; one whose tree changes during the check.
2. Run `node --test tests/parallel/154/` (PG-1…PG-3, WC-1…WC-4; the property test of every
   worker-completion permutation) and `node --test packages/cli/test/engine/`
   (`closeTheGroup` with `runEngineCheck`, `cwd: worker.tree`).
3. Expected: "both are worked at once, one worker each, and the admission records the rule id";
   the dependent pair "run one after the other and the reason is recorded" (`dependency`). The
   failed check "withholds that worker's delta from integration", refuses it with `group-check`,
   "charges one repair to every task of the group and counts the group as failed" — the repair is
   serial on the main line. Over every permutation "0 bytes of the applied tree differ"
   (F154-SC-003). The unit of approval stays the phase (F154-FR-037).
4. Not observed: the whole inner set run in the worker tree; the merge check in a worker tree;
   the worker check's result reaching the gate or the critic; a group approval; a second full gate
   (F154-SC-005).

## P4 — Shared limits across runs (FX-154-SLOTS)

Switch: `host.limits`.

1. Fixture: two runs on one host with `host.checks.concurrent` 1; a slot whose owner is dead and
   one whose owner lives; a quota window above headroom; a run that ends and one that is killed.
2. Run `node --test tests/parallel/154/` (SL-1…SL-5 over the probe outcomes),
   `packages/cli/test/engine/` and `packages/runtime/test/` (slot store, hold record, temp root).
3. Expected: "With `host.checks.concurrent` 1 and two runs on one host, 0 pairs of full check-set
   executions overlap in the event files" (F154-SC-007) — the second run "waits as a pause,
   spending no budget and moving no count", class `host_slot`, `run.paused` and `paused-quota`;
   the dead owner's slot "reclaims the slot atomically; a slot whose owner lives is never removed"
   (F154-FR-044); "its temporary root is removed" for any cause (F154-FR-043). The quota window
   case of P2: "it is not admitted, with the check `headroom` and its detail recorded", so the
   group's tasks stay serial.
4. Not observed: a model taking or releasing a slot or hold; a new run state, exit code or stop
   reason; an error from an unreadable store (SL-5: proceed unbounded, reason recorded); a
   project value raising a bound; a hold written when `host.limits` is off.

## P5 — Features side by side in the pipeline (FX-154-STAGES)

Switch: `pipeline.stageGroups`.

1. Fixture: a contract with a stage group `{A, B}`, width 2, no `never_together`; and the same
   with a rebase conflict (or a red gate on the rebased tree) when B lands after A.
2. Run `node --test packages/pipeline/test/` (the wide graph, a workspace per stage,
   `landing-run.ts` with LD-1…LD-4) and `node --test tests/parallel/154/` (the landing table).
3. Expected: "A and B run at once, each in its own workspace with its own lock"; "the full gate
   runs on A rebased onto home, and on a pass home fast-forwards"; A lands before B, in declared
   order; "exactly that stage is parked with exit 22, home is unchanged, and 0 model calls are
   made for the landing" (F154-SC-008) while "A's landing stands" (F154-FR-052); each approval
   "stands, with the rewrite noted" (`rebased` by patch-id, F154-FR-053).
4. Not observed: a merge commit; a critic call after a landing; a landing during a stop; a new
   exit code for a parked stage; a stage worktree left after landing or park; a cycle or unknown
   stage accepted (the existing exit 20 at validation).

## P6 — Phase trees and one validation queue (FX-154-PHASES)

Switch: `loop.phases.parallel`.

1. Fixture: a task list whose comment lines declare phases 2 and 3 independent with disjoint
   write scopes (`<!-- specstride: depends-on: … scope: … -->`), phase 4 with no line.
2. Run `node --test tests/parallel/154/` (PQ-1…PQ-3, the adapters' line) and
   `node --test packages/cli/test/engine/` (the queue head through the existing gate, critic and
   approval path on a phase tree).
3. Expected: "phase 2 is gated, judged and committed first, then phase 3 is rebased onto it and
   gated, judged and committed" (F154-FR-058); "a phase with no declared dependency … depends on
   the phase before it" (PQ-3); "every … refused … phase has exactly one event with its reason"
   (F154-SC-006); each phase's attempt numbers survive a resume (F154-FR-060).
4. Not observed: the workspace changing before a phase's own gate; a second critic nonce reuse; a
   private parser of `tasks.md`; a dependency read from the launch contract; a gate out of order.

## P7 — Work past an open verdict (FX-154-SPEC)

Switch: `loop.speculate` (depth 1, window 20, 50 %, CQ-154-18).

1. Fixture: a stub critic that approves; one that rejects; one that approves 1 attempt in 12.
2. Run `node --test tests/parallel/154/` (SP-1…SP-6) and
   `node --test packages/cli/test/engine/` (`materialize`, `integrateGroup`, the sweep).
3. Expected: with the rate at or above the threshold "phase n+1 starts in a tree branched from
   the frozen snapshot and the workspace does not change" and on approval it integrates like a
   group; on a rejection "the tree of phase n+1 is discarded, no outer counter and no count
   moves, and its cost is reported" (SP-6). On the 1-in-12 fixture "no speculative unit starts at
   the default threshold" (F154-SC-013), reason `rate`.
4. Not observed: a speculative tree readable by the critic (F154-SC-004: 0 such critic-class
   calls); a unit started when the sweep cannot be confirmed (SP-4); a revert of the workspace.

## The trial, and `parity`

1. Per switch: `node scripts/trial.mjs --switch <name> --fixtures fixtures-154.json` (arms: the
   fixture set with the switch off, and with only that switch changed; stub agents; the same seed
   of session ids). Expected: a record under `trials/<name>.json` (`specstride.trial/1`) with
   TRI-1 (no breach invariant of F142-FR-071 fails), TRI-2 (every rule test passes) and TRI-3
   (the sets of exit codes, stop reasons and run states are subsets, F154-SC-001); 153's 28
   groups replayed as the first case (F154-FR-019). The trial shows safety, not a default.
2. With the `parity` profile on: `node --test tests/inertness/154/` — "no file, event or call of
   this feature exists" (F154-SC-012); no plan printed, no slot, hold, queue or set-aside record
   written, no new event type emitted.

## One pass over everything

1. `node --test tests/parallel/154/` — every rule table and the property tests.
2. `node --test tests/inertness/154/` — each switch off, and `parity`, change nothing.
3. `node --test packages/layer-parallel/test/` — the plan, admission, halving, cycle charge.
4. `node --test packages/core/test/` — the pure tables in `core` (merge baseline, slots, queue,
   speculation, landing, pass mark) and the report rows on `recorded-153/`.
5. `node --test packages/runtime/test/` — the slot store, the hold record, the temporary root.
6. `node --test packages/pipeline/test/` — the wide graph, a workspace per stage, the landing.
7. `node --test packages/cli/test/engine/` — the wiring of every seam on the stub fixtures.
8. `node --test packages/adapter-dsh/test/concurrent-sessions.test.ts` — the door's proof, N = 4.
9. `node scripts/trial.mjs --switch <name> --fixtures fixtures-154.json` for each of the nine
   switches; then `node packages/cli/bin/specstride doctor` and `report` on FX-154-PLAN and
   `recorded-153/`. The full suite is never run in parallel with a live run: `node scripts/ci-test.mjs`
   keeps its serial default on a shared host (`--parallel <n>` is opt-in).
