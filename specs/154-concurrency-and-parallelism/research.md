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

---

## Appended by stage 3 (plan, 2026-11-25)

### Decisions

| Subject | Decision | Rationale | Alternatives considered |
|---|---|---|---|
| The parallel unit under `groupUnits` | CQ-154-02 C with (iii): both units behind separate switches — the `[P]` run of 142 stays as it is, and 153's frozen task groups become candidates (`groups.ts` maps one to a `PlannedGroup` with its write scope); independence by the marker rule with a declared `depends_on` overriding | The groups carry a write scope and an acceptance check already (F153-FR-054, -055); one overturned ruling changes one slice, not the design | A: G3 not built (`groupCandidatesOfThePhase` returns nothing). B: the `[P]` groups stay alone and `independence.ts` is not called for them. A new attempt kind per group is closed (§E.1, F100-FR-031) |
| Independence of two groups (PG) | PG-1: every task of both carries `[P]`, `scopesAreDisjoint` says the scopes are disjoint, and no task of the later group names a path in the earlier one's scope; PG-2 a declared `depends_on` makes them dependent; PG-3 a declaration overrides PG-1 | The marker alone is "a claim" in XX's words; disjoint scopes alone do not show that B does not read what A writes (T-a) | The marker alone; scopes alone |
| Where a group's check runs | CQ-154-04 A: the acceptance check only, in the worker tree after the pass, bracketed by two fingerprints; `NO_CHECK_RUNS_IN_A_WORKER_TREE` narrowed to the merge check | The result reaches no gate and no critic — an inner check that can only withhold (II, III) | B: the whole inner set in the tree (spends the suite per group, a second validator). C: no check, the group's failure is repaired on the workspace (today's cost, R-C19) |
| What shares limits across runs | CQ-154-14 A: files in user-level state with an owner record; a slot is a directory lock under `<user-state>/slots/<bound>/`, width N, made with `createDirectoryLock`; reclaim by a contending runtime root through the lock's liveness proof; defaults 1 and unset; the wait is a pause | I forbids a service a run depends on; two runtime roots could not update a counter file atomically without a lock, so the lock is the design; the owner record names the host (F154-FR-044) | A daemon or socket that hands out slots (breaks I); a file with a counter |
| Stage isolation | CQ-154-05 A: a workspace (a worktree of home) per stage, one run each with its own lock, process tree and runtime root; coordinated only through files | "Single run per workspace" then holds per stage workspace (T-e); the pipeline touches files and processes only through the two composition roots | A lock per feature in one workspace (one writer per workspace would not hold for two stages of a feature) |
| How a stage lands | Rebase onto home with the hardened git (PU-81), the full gate on the rebased tree under the P4 slot, then `merge --ff-only`; no critic after a landing (CQ-154-06 A); approvals stand bound to their verdicts, the rewrite noted by patch-id (PR #41) | The lanes land with no gate today (R-O9); a landing spends no critic call for a fact the next critic already reads | A merge commit (breaks the serial history); one critic call per landed stage (`landing-run.ts` calls the critic after LD-1's gate) |
| Order of validation across phases | CQ-154-07 A with an ordered validation queue: one list per run, the head is the first phase whose dependencies are all approved (PQ-1…PQ-3); at the head the existing gate, critic and approval path run unchanged | F154-FR-058: a fresh critic with its own nonce per phase; the queue is ordered by phase so the order of completion changes no decision (determinism analysis) | Per-phase gates in any order (a gate out of phase order would validate a tree that the next phase must rebase onto anyway); B: the dependency declared in the launch contract — a second grammar for one fact (IV); C: G6 not built |
| When work may start past an open verdict | CQ-154-18 A: depth 1, window 20, 50 % — the rate is approvals over attempts started over the last 20 attempts, read from the ledger, at or above 50 % and depth below 1 (SP-1) | On every measured run the rate is 29 of 336 and 10 of 121, so the switch stays off by design; a measured rule cannot be talked into a default | A fixed depth regardless of rate; any other values (the three keys of `loop.speculate.*`, the rule the same) |
| Where the lanes live | CQ-154-05 A: wide stage groups in the launch contract, built in the pipeline (`declareStageGraph`, `stage-loop.ts`, `stage-workspace.ts`, `landing-run.ts`); `lanes.py` stays in the campaign driver until P5's trial passes | The lanes rebase and fast-forward with no gate (R-O9); the product's landing is the only one with the gate on the rebased tree; the driver calling the product is a follow-up out of scope | Leaving the lanes in the campaign driver (B: G5 not built, `declareStageGraph` ignores `stageGroups`) |
| The plan renderer | One renderer, two callers: `printThePlan` (`plan.ts:543`) is the only renderer, pure and terse with the serial list behind a verbose flag; the doctor and both dry-run paths call it (CQ-154-19 A: printed, labelled, with the option off) | Two renderers disagree today (one stored on a doctor observation and never printed, one printed from the contract's flags); F154-SC-002 asks for the same bytes | Keeping the dry run's renderer and adding the doctor's beside it — two can drift; B: print only with the option on |
| The phase dependency | CQ-154-07 A: `SpecPhase` gains `dependsOn` and `writeScope` in the canonical model, parsed by the spec-format adapters from one comment line under the phase heading; no line ⇒ the phase before it | Read through the canonical model (IV); no private parser of `tasks.md` | A declaration in the launch contract — a second grammar for one fact |
| The merge check | CQ-154-17 A: all three rules — no repeat (RP), no merge check on an empty application (MG-1), and a merge baseline (MG-2) that is a recorded comparison with the base result by failure signature (F115-FR-019); the unit is never kept | A suite red before the group sends every group to repair; the gate is not touched | Scoping the merge check to the group's paths — it would weaken XX's "deterministic merge check on the merged tree"; B: no merge baseline (`merge-baseline.ts` not built) |
| How a run waits for a slot | A pause of the class `host_slot` (proposed in §C.13, CQ-154-09) through the existing `enterPause`/`resume`; `A_QUOTA_CLASS_SPENDS` says it spends nothing; counts survive (XVI) | The wait must be a pause, and the pause record's class is a closed set | A new run state — F154-FR-002 forbids one; a new pause state likewise |
| How a switch is turned on | CQ-154-15 A: a trial (`scripts/trial.mjs`, new) runs a fixture set twice with stub agents, diffs the reports and the closed sets, writes `specstride.trial/1` and the pass mark TRI-1…TRI-3; the owner reads it and writes the register row | No runner of fixtures exists: `FX-PAR-S` names an `experiment:e6` script that is not in `package.json`; deliberately stricter than register rows 134 and 137, which shipped default on | A fixture runner that does not exist (`experiment:e6`); a model's judgment as the pass mark (XIII) |
| No repeat (RP-1) | At `groupGate`, `repeat.ts` reads the ledger of earlier attempts of the phase for a group over the same task set that failed and compares the content fingerprint (feature 116) of the named paths through the tree store's `changed`; unchanged ⇒ refused with `repeat`, tasks serial | 153's phase 23 started `g-23-1` on 21 attempts (R-M16); a per-phase memory in the process would not survive a relaunch, and 153 spanned many | A bound of N groups per attempt (CQ-154-13 B — "always the first group" under another name); a constant (`failedGroupsBefore: 0`) |
| No empty merge check (MG-1) | `theMergeCheckOfTheGroup` reads the applied path count after `apply`; at 0 no check, no charge, not failed; F142-FR-060 stands (the unit is not kept) | 22 of 28 groups of 153 applied nothing and each paid a merge check of the whole inner set, 4.74 h (R-M16) | Keeping the unit on an empty application; running the check anyway |
| The merge baseline (MG-2) | `baseResultOfTheInnerSet` finds the in-pass result set whose before/after fingerprint (`runCheckCommand`, F116-FR-005) equals the group's base snapshot; failing commands matching it by failure signature charge nothing and the group is not failed; with no such result F142-FR-061 applies unchanged | The merge check runs the phase's whole inner set, the same as the gate, so a suite red before the group sends every group to repair | A scoped merge check on the group's paths (weakens XX); CQ-154-17 B: no baseline |
| Closed-set members | CQ-154-09 A: new versioned members (`repeat`, `dependency`, `group-check`, `host_slot`, the slot-wait, landing and set-aside events) | No existing member carries the meaning; the nearest, `follows-writer`, belongs to the check-runner's batch admission set and must not be reused across sets | B: map onto existing members — no existing refusal reason is honest for `group-check`, which is why B is not built |
| What carries the red-team pass for behaviours 5 to 7 | CQ-154-10 A: G8 (F154-FR-068…-081) is the red team's pass, each requirement landing with the behaviour that re-opens its channel | Behaviours 5 to 7 fall outside R29's red team | A MINOR amendment of XX |
| What happens when the sweep's wording is not amended | CQ-154-08 A: F142-FR-070 amended (T-h wording); if refused, SP-4: no speculative unit starts before the critic call returns (B) | A speculative tree may exist only if the critic has no tools or the read denial of the worker root is confirmed | No amendment and speculation started anyway (would breach F154-SC-004) |
| What is out of scope | CQ-154-16 A: in-pass check batching stays out (feature 115's; no measured gain, L-4); also N-candidate selection, a model that merges, multi-host runs, `events`/`tail` on the control root, the attempt loop in `core` | Each has a seam in the plan (the named seams, the reader of PR #40, the amendment row of F153-FR-042) | B: in — feature 115 |

- Decision: the acceptance check is bound to three fingerprints, not two. Rationale: `speckit-analyze` found that two readings around the check miss a change made before it (III). Alternatives: the before/after pair alone (rejected); a scoped re-run of the suite in the tree (rejected: spends the suite per group).
- Decision: a task group of 153 is independent only when declared `independentWith`; a `[P]` run by the marker rule. Rationale: task groups carry no marker, so the marker rule cannot reach them. Alternatives: the marker alone (a claim); disjoint scopes alone (do not show that B does not read what A writes).
- Decision: the option-off plan print sits behind the verbose flag only. Rationale: a print on by default is a behaviour on by default (XVIII). Alternatives: a new switch (one more to turn on); always printing (rejected for the same reason).
- Decision: a hold record expires at its reset time and is never reclaimed on its writer's death. Rationale: the window is the account's fact. Alternatives: the slot's reclaim rule (would re-open the window).

### Anchors re-pinned by the code readers (2026-11-25)

Read on `aafb367f` by four read-only code readers; every line number verified with grep or sed (plan.md, "Anchors re-pinned").

- `theGroupOfThePhase` `groups[0]`: `parallel-wiring.ts:100-102`, also `parallel-group.ts:140` and `groupOrdinal: 1` at `:558`, `:667`.
- The inner set `["check"]`: `run-feature.ts:2914` (was `:2913`), and the manifest entry at `:4721-4730`.
- `failedGroupsBefore: 0`: `run-feature.ts:4692` (was `:4674`); the unused ledger count is `decide.ts:1640`.
- `utilisationPerCent: []`: `parallel-launch.ts:252`.
- `groupGate`, no caller: `admission.ts:939-957`.
- The group check today: `micro-layer.ts:552-575` (`cwd: process.cwd()`, `300_000`), was `run-feature.ts:3237`.
- The worker check seam: `parallel-group.ts:658-736`, between `:592` and `:707`.
- The refusal reasons: `audits.ts:58-67`.
- The landing of the lanes: `lanes.py:117-171`, no gate.
- The approval standing: `approval-commit.ts:67-85` (PR #41).
- The stage graph: `graph.ts:12-29`, serial by design; the probe outcomes: `probe.ts:120-128`, six.
- The user-level root: `layout.json:8`, `roots.ts` `userStateRoot:113-115`.
- The plan renderers: `plan.ts:543` never printed, `contract/launch/dry-run.ts:167-205`; the doctor handler `handlers.ts:580-631` with literal findings; the report `inspect/report.ts:113-145`, `select.ts:138-158` (PR #40).

### Route C to its dry-run (2026-11-25)

- `contract derive` read `tasks.md` through the canonical model: `tasks=172`, the count the file
  holds. One judgment item asked which phase "the command on plan.md:354" belongs to; its excerpt
  is the Source Code tree of the plan, a documentation block, so the answer was `out-of-scope`.
- **A defect on `main`, fixed in `52cb20e5`**: every `contract validate` failed with
  `sources/0/kind: must be equal to one of the allowed values`. Feature 152's T144 (phase 6,
  approved 2026-11-13) made the inventory add `commit-gate-rules` to every contract's sources,
  and the closed set of row 256 kept its ten members. The member is now in the constant, the
  schema and the annex row, with a test that refuses the drift in either direction.
- The shim runs an installed CLI; the fixed code ran through `SPECSTRIDE_BIN`, the shim's first
  resolution rule (F120-FR-011), pointing at `packages/cli/bin/specstride`.
- `contract promote` → `validated`; `contract render` → launcher and bundle under the product's
  state root; `launch --mode dry-run` → `stages=1 limits=86400 verification=required
  reason=configured changed=0`, exit 0. Nothing was launched.
- **A gap of this spec, not of the product**: no verification command is declared
  (`declarations=0 commands=0`). The gate of every phase would read `unchecked` (XIV) until a
  declaration exists. Features 142 and 153 declared none either, so it is the house form, but it
  is stated here as a finding: `verification-undeclared`, open.
- `mixture-of-loops` in `generate` mode: the draft held 172 implementation obligations, every one
  `unclassified/unresolved`, and no stage. It was completed in the form of feature 153's
  validated contract: one `specstride` stage, `run-154-concurrency-and-parallelism`, to which all
  172 obligations are mapped; the engine reads the 18 phases of `tasks.md` in order. Promoted to
  `validated`; the launcher passed `bash -n` and `--dry-run` (`command available: specstride:
  pass`). The verification plan beside the contract is empty and says so.
- Noted, not fixed: the launcher's first line is a Node script and must be started through the
  launch command or with `node`; started with `bash` it hangs on its comment lines, and started
  bare it crashes in `integrity.ts:79` (`join` of an undefined path) instead of printing a
  refusal. A refusal line would be the product's own rule (F107-FR-031: a refusal is exit 20 and
  one line).

### Bugs found by the run (2026-11-25)

- The first launch through the `mixture-of-loops` launcher failed at once: `child-exit=3`,
  `engine: unknown arg: --spec-format`. The stage's argv followed the skill's reference example and
  the house contracts of 142, which call the as-is engine (`/root/specstride/specstride run -s …
  --feature … --proposer … --critic …`). This product's `run` verb has another grammar (`run [-w
  DIR] [--detach] [--new-run] [--reset-counts] [--verbose]`) and reads its roles from
  `~/.config/specstride/config.yaml` and `SPECSTRIDE_CRITIC`; its designed start is
  `specstride launch --mode run` from the validated contract, supervised by its own `wait` and
  `status` verbs. Not a defect of the product: the launch went through the product's own route
  below, and the mismatch is recorded as a finding of the `mixture-of-loops` contract (its stage
  form does not fit this product's `run` verb). No PR: a skill reference is not this repository.
- The first fix of row 256 (`52cb20e5`) was incomplete: `closed-sets.test.ts` pins the constant
  against `packages/contracts/data/closed-sets.json`, a fourth home of the set, and CI refused it
  (PR #42). Fixed in `079093cf`.

### The run (2026-11-25 19:17 to 2026-11-27 06:33 UTC, `launch-mwwi9xc3` then `launch-mwwptgmr`)

- **Result**: 18 of 18 phases approved, 18 approval commits, `DIGEST exit=0 stop=none`. Proposer
  `dsh:zai/glm-5.3-flash` at `reasoningEffort: max`; critic `dsh:compass-gpt5-high/gpt-5`; every
  configurable ceiling off. Phase 18 wrote nine trial records under `trials/`, each `TRI-pass`
  and each switch still off until ruled (`verified.md`).
- **Attempts per phase**: 1:5, 2:8, 3:2, 4:3, 5:3, 6:2, 7:2, 8:2, 9:2, 10:3, 11:4, 12:2, 13:2,
  14:3, 15:3, 16:5, 17:2, 18:4. The critic's UNMET set shrank on almost every attempt; the
  rejections were on the merits, with two exceptions below.
- **Bugs found by the run, each a merged PR**: row 256 lacked `commit-gate-rules` (#42); a quota
  line from the critic was read as `MALFORMED` (#44); `specstride stop` bound its request to a
  dead run's registry entry (#45).
- **Lessons for whoever drives the next run**:
  - Never commit inside a live phase. The critic judges the attempt's uncommitted change; a
    commit made to "save" in-flight work hides it. The engine commits only at approval.
  - The `mixture-of-loops` launcher's stage example assumes the as-is engine's `run` grammar
    (`-s … --feature … --proposer …`); this product's `run` has another grammar, and its designed
    start is `launch --mode run` from the validated contract.
  - The critic route reads a very long prompt unreliably (a 158 KB probe did not answer in three
    minutes). `critic.evidence.perTask` is on by default and bounds this; a phase whose change is
    large still gets shallow verdicts late in the diff.
  - A file committed in an earlier phase never appears in a later attempt's change. When the critic
    needs to see one, the evidence must show it (`git ls-files` output was not enough; a README
    added to the fixture directory was).
  - The first sign of a stuck loop was the proposer's own evidence claiming work the critic could
    not see; read the critic's UNMET lines against `git diff HEAD` before touching the run.
  - `verification-undeclared` stays open: the gate ran the repository's `npm test` as it does for
    153, and every phase's gate was green before its critic was called.
