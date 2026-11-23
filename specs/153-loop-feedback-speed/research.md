# Research: 153-loop-feedback-speed

## Learnings

- **152 is partly on `main`.** PR #22 (`feat/152-commit-backpressure`, merge `b9e21809`) brought
  phases 2 and 3 of feature 152 to `main`. The engine emits `commit_gate.blocked`
  (`packages/cli/src/engine/run-feature.ts:3132`), so anchor A13 and ledger C12 ("no
  `commit_gate.blocked` event on `main`") are wrong on `efe8897f`. Spec 153 still builds on F152's
  requirements only.
- **Spec and code disagree on the stop reasons.** `packages/contracts/data/exit-codes.json:21-22`
  lists a 16th stop reason `commit_gate` (commit `b6d26882`, citing pin CT-101-18: a halt never
  shares the stop reason of a blocked reason). Annex E §E.3 and F100-FR-148 still say 15, and spec
  152 records CQ-152-01 A (`max_rejects`). Read both before ruling on CQ-153-05.
- **The catalogue already has most of the "new" events.** `verification.started`/`ended`,
  `critic.started`/`critic.call`, `check.*`, `attempt.*`, `recovery.diagnosis_started` and
  `commit_gate.blocked` are in `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`.
  The engine just does not emit them (it emits `attempt.ended` only on the rejection path,
  `run-feature.ts:3466`). Only a timed commit-gate pair is really new. The catalogue's version
  string is not in spec 111 or its contracts.
- **F105-FR-007 already requires gate events**, so part of behaviour 2 is a delivery, on under
  `parity`.
- **F148 already requires a process group and a time limit per command** (F148-FR-002, -004), with
  the signal `TIMEOUT`. `interrupted` is for `cancel` or a stop request (F148-FR-003). Stage 1's
  constraint 12 ("failed with `interrupted`") is corrected to `TIMEOUT` in the spec. SIGKILL
  escalation is in no spec.
- **The engine's critic prompt is its own.** `run-feature.ts` imports nothing from
  `packages/core/src/critic-input/` (assembler, grounding, pins). Its role line differs from
  F117-FR-021. Wiring the pins means going through that module, not adding a line to the engine's
  prompt.
- **The gate command question has a baseline answer.** F105-FR-017 discovery of a Node project
  yields the script `test` through the plan, with a time limit of 1,800 s. So "run the plan's
  commands" is a delivery, not a divergence (CQ-153-11 asks for confirmation).
- **The handoff writer is unused.** `renderHandoff` (:400) and `writeHandoff` (:483) of
  `packages/core/src/carry/handoff.ts` have no non-test caller. The `onHandoff: () => {}` at
  `run-feature.ts:2094` is a no-op, and :2862 is the parallel-units handoff for the critic, a
  different thing.
- **F152-FR-008 ("act once per phase attempt") and F152-FR-009 (its reason rests on the scan
  running after the critic)** conflict with a pre-critic scan. Both need an amendment row, not a
  silent reading.
- **A §G.4 row is needed for every new command.** Exit codes per command are an owner-decision
  closed set (§X.6 row 7).
- **Next free numbers in this checkout:** §X.7 ends at row 134, §X.6 at row 286, DV at DV-122. The
  register itself (`docs/ecosystem/consolidation.md`) is not in this checkout.

### Reconciliation pass (stage 2 re-run, 2026-11-12)

- **Quote the delivered requirement's own words.** F103-FR-041's content list says "the remaining
  units of work, which are the plan less the ledger"; "tasks done / tasks open" is the feature
  input's and stage 1's gloss, not the requirement's text. Same trap in F117-FR-032: the pin record
  holds `phase`, `hash` and `confirmed` (sorted ids) — "only criterion ids and a hash"
  under-states it.
- **F152-FR-022's "is not a rejection" belongs to the switch-ON text.** With the switch OFF, a
  block is "reported, the run goes on, and the run exits 1 at its end" (`commits_blocked=N`).
  Attribute reasons to the branch that states them.
- **Two closed sets are easy to conflate.** The check conditions are F148-FR-003's five
  (`tainted`, `cached`, `flaky`, `interrupted`, `unchecked`); `current`/`superseded` are
  F116-FR-008's result currency, keyed on the tree fingerprint at the check equal to the tree at
  the phase gate.
- **The commit-gate pair is genuinely new.** Only `commit_gate.blocked` exists in spec 111
  (catalogue row :104) — no `commit_gate.started`/`.ended` anywhere in 111. And annex E §E.2
  already carries the `commit-gate` blocked reason (152's amendment) while §E.3 keeps 15 members
  (`max_rejects` is member 13, exit 2; no `commit_gate`).
- **The CT-101-18 gloss has two layers.** The test header (`ct-101-18-blocked.test.ts`) says
  blocked paths end with the stop reason of the blocked-reasons table and a limit halt is never
  relaunched; commit `b6d26882` states the pin's rule in its own words ("the stop reason of a halt
  is never the stop reason of a blocked reason"). Cite the layer you mean.
- **§X.6 row 272 (endCause) and row 273 (outcome) are owned by feature 111.** All four causes the
  report maps (`approved`, `rejected`, `malformed`, `verification-failed`) are row 272 members, so
  F153-FR-037's mapping invents nothing.


---

## Appended by stage 3 (plan, 2026-11-12)

### Decisions

| Subject | Choice | Reason |
|---|---|---|
| Reuse vs closing-check skip | Build only the closing-check skip now; reuse specified, not built (CQ-153-02) | Principle II "cannot be justified away"; the fallback F153-FR-015 plus the skip keeps most of the measured gain. Rejected: always re-run but in parallel — the duplicate work stays (T-a) |
| Where the failure summary is built | On the CLI side with the existing `packages/verification` module, ingressed into the core feedback builder | `core/src/gate/` imports nothing from `packages/verification/` today; forking a second summariser would fork the F105-FR-037 contract. Rejected: a core-side port of the module |
| How checks are killed | One async, detached executor in the check runner replaces three `spawnSync` call sites; grace = `SPECSTRIDE_KILL_GRACE_MS` (default 5,000 ms, `run-feature.ts:1905`) | `spawnSync` cannot escalate and grandchildren hold the pipes (A4, M3); one knob already tunes both kills. Rejected: per-path timers |
| Where pins are mounted | A pure seam beside the F117 assembler (`core/src/critic-input/pins/block.ts`) over the pins store's own API | D-2: the engine's prompt is its own and assembler adoption is 117's follow-up, but pin data must come from its owning module. Rejected: injecting text into the engine's prompt string |
| Per-task evidence vs a bigger diff cap | A per-task evidence builder within the F117-FR-011/-025 budget | 8 rejections were "no diff shows it" (M4) and 40,000-byte files were hidden (A9); a bigger cap hides work past the cap. Rejected: raising `CHANGE_CAP_BYTES` |
| How the catalogue version is stated | No version field exists in the TSV; the proposal bumps `tableVersion` (data row :94) if the owner wants a marker | CQ-153-09 says "the plan states the bump"; inventing a header field would fabricate structure the file does not have |
| How the report gets its rows | Re-derivation from events + control-plane records at read time; no summary record is persisted | F153-FR-006 (no decision reads events) and F129-FR-015 precedent; works on old event files. Rejected: a persisted run summary |
| How groups are formed | Derive-time pure table, frozen and hashed in the launch contract | A run-time slice would be a second source of spec grammar (IV) and would rest on the proposer's checkpoint claim (A12), which the 41-task claims of feature 152 show cannot bound a unit (M7). Rejected: a new attempt kind per group (§E.1 is closed, F100-FR-031) |
| How a red gate is counted | Its own durable budget (`verification.redGate.limit`, default 3, CQ-153-05 A) derived from ledger records; never the reject limit | The reject limit bounds the critic's judgments (Principle I's budget is per-counter); 17 of ≥ 36 rejections of 152 were red gates (M4), so sharing the counter conflates opinion with mechanism. Rejected: counting a red gate as a rejection — it would spend the critic's budget on deterministic results, and the F149-FR-004 precedent already treats a red gate outside K |
| The unit of commit | The phase stays the unit of approval and commit (CQ-153-07 A); groups are checked and reviewed only | The phase gate's APPROVED is the only grant (F153-FR-001); groups as phases would need the FX-27 row plus rulings on F101-FR-011/-029/-035 and would multiply approval records without removing a measured loss. Rejected: the group as the unit of commit (CQ-153-07 B/C) — planned only as the amendment route |
| Workspace parallelism of the repo suite | Command-controlled degree (`--parallel <n>`), serial default, order preserved | The repository's own command stays explicit; isolation already exists (`tests/isolate.ts`). Rejected: intra-package parallelism |

### Baseline (2026-11-12, `main` @ `efe8897f`, Node v22.23.2)

One test subagent; no engine started; no install; no build (tests run from source).

- `node --test packages/core/test/critic-input/logical-names.test.ts` — 5 pass (imports
  `verdictPinsStateKey` from `core/src/critic-input/pins/store.ts`)
- `node --test packages/core/test/phase2-shared-parts-101.test.ts` — 36 pass (imports
  `core/src/gate/events.ts`)
- `node --test packages/core/test/ct-152-20-152.test.ts` — 1 pass (same)
- `node --test packages/core/test/101/ct-101-18-blocked.test.ts` — 6 pass (same)
- `node --test packages/verification/test/performance-105.test.ts` — 4 pass (imports
  `failure-summary` via `packages/verification/src/index.ts`)

**Total: 52 pass, 0 fail, 0 skipped.** Runner: `node --test` (node:test); packages wrap it with
`tests/isolate.ts`. Note: no dedicated test files exist for `pins/store.ts` or
`failure-summary.ts`; these are the closest importing tests. The stage-3 cut-off run's baseline
(also green, counts unrecorded) is superseded by the counts above.

### Reconciliation (stage 3 re-run, 2026-11-12)

Stage 2's reconciliation pass had re-worded F153-FR-049, F153-FR-058 and the CQ-153-06
recommendation after this plan's first writing; the plan artefacts were aligned to the current
wording (pins fields as F117-FR-032 has them everywhere they are stated; the handoff content as
F103-FR-041's list as written, with "tasks done / open" kept only as the canonical-model reading;
the `rulings.md` cell re-synced). The baseline stands: `main` is still `efe8897f` and no source
file changed since the run above, so it was not re-spent.

Four read-only subagents re-pinned the plan's anchors; corrections written back into
`plan.md`: the check-runner service spawn is `run-feature.ts:1966-1967` (was :1971-1975);
`commitPorts` :3274-3277 (was :3274-3279); `runCheckCommand` `micro-layer.ts:313-352` and
`closingCheck` :551-575 with the fingerprint skip at :556 (was :313-350 / :551-573); the
checkpoint-claim wiring is :383-440 (`createCheckpointClaimReader` :386, task ids from the claim
:409; was "around :425"); `mintSessionId` :49-51 (was :49-52). One mis-attribution fixed:
`maxBuffer: 1 << 30` lives in `scripts/ci-test.mjs:35`, not in `tests/isolate.ts` (PID namespace
only). One new code fact: today's executor timeout surfaces as `SIGTERM` — no `TIMEOUT` literal
exists in `lisa-executor.ts`; the `TIMEOUT` shape (no exit code, signal `TIMEOUT`) is what
F148-FR-004 requires and slice P1e delivers, not what the code holds today. A second pass over the
feature input's own A1–A17 table, locks and out-of-scope list, and over F152's plan, added one
fact: 152's gate unit already declares the scan port's result type (`core/src/post-approval/
commit-gate.ts` `CommitGateScanResult` :70 — "the hits, and never the match text") while the
port's implementation is still the `run-feature.ts` closure that mutates `commitsBlocked`
(:1785-1807); P1d's extracted unit must satisfy that type so the gate consumes it unchanged.
Everything else the
plan cites confirmed as written, including `ORDER_AFTER_AN_APPROVAL` :36-43, the EP-18 planner
registry `specstride.attempt-planner/1`, row 272's ten `endCause` members, §E.2's `commit-gate`
blocked reason (→ `max_rejects`, exit 2), the catalogue rows with no `commit_gate.started`/
`.ended`, and no `report` verb or module in the CLI.

### Reconciliation against the stage prompt and the code (2026-11-12)

A later pass checked the plan against the stage-3 prompt and the code before the tasks were
written. Its corrections are recorded in `plan.md`, "Reconciliation against the stage prompt and
the code" (R1–R13). The decisions it changed or added, each with what was rejected:

| Subject | Choice | Reason, and what was rejected |
|---|---|---|
| How checks are killed (**supersedes** the row "How checks are killed" above) | The three engine paths call the check runner feature 148 already built (`check-runner/src/command/kind-command.ts` `startCommand` :162) through one adapter; the grace is that runner's `GRACE_MS`, 2,000 ms | The group, the runner's timer, the escalation and the `TIMEOUT` result exist and have no engine caller. Rejected: a detached spawn added to `lisa-executor.ts` `execute` — that module is pinned as extracted by CT-148-2; `SPECSTRIDE_KILL_GRACE_MS` (5,000 ms) as the grace — it is the pass watchdog's knob, and a constant of feature 148 would become an environment setting |
| Where the red-gate feedback is rendered (**supersedes** "Where the failure summary is built") | With feature 105's own renderer and ingress (`verification/src/gate/feedback.ts` `renderFeedback`, `gate/ingress.ts` `throughTheIngress`), called by the composition root | F153-FR-016 asks for the F105-FR-006 frame, whose heading is `# Phase <N> deterministic verification gate rejected`; that renderer exists. Rejected: a new parameter on the core `feedbackOfTheVerificationGate` — a second renderer of one requirement with another heading |
| How the gate gets its commands | By wiring the F105 plan and gate (`derivePlan`, `persistPlan`, `deriveEveryManifest`, `runGateOrCode3`) into launch and the gate call | The selection (`gateOf`, `selectCommands`), the code 0/10/3, the every-command rule and the result record are delivered code with one caller, the `verify` verb. Rejected: a new `command-resolution` table in core — it would re-implement F105-FR-032 |
| Where the pins come from (**supersedes** "Where pins are mounted") | The existing `pins/block.ts` (`pinStepBeforeCall`, `updatePinsAfterVerdict`, `clearPins`), called beside the F117 assembler | The module the plan called new exists. Rejected: writing it again |
| Where the task→paths map comes from | The composition root reads it from the task texts with feature 142's extractor (`pathsNamedByTheTextOfATask`) and hands it to the pure evidence unit; the same paths are the pins' priority paths | A `SpecTask` has no paths field and the engine path has no grounding pass (D-2). Rejected: a paths field in the canonical model (a grammar change of feature 104); a second extractor |
| Where the pass handoff is written | In `runPass`, at the start of the pass | `onHandoff` (:2094) is the parallel-units callback and its text reaches the critic request. Rejected: reusing that callback — F153-FR-058 forbids exactly that merge |
| The handoff's ledger tail | Empty until CQ-153-19 is answered | The engine path writes no F103 ledger. Rejected: wiring the signed pass ledger inside P5a unasked — it delivers F103-FR-039/-040, which the spec does not list |
| Where `specstride report` lives | `cli/src/inspect/report.ts` with a row in `router/verbs.ts` | That is where every read-only verb is (`events`, `verdicts`, `phases`, `status`). Rejected: `cli/src/commands/` — it holds the verbs that change a run |
| How engine parallelism is delivered | By calling `runTheCheckManifest` with the run's `RunParallelism` | F148-FR-011…-016 are implemented there and called by no engine path. Rejected: batching logic in the composition root |
| The size of a task and of a phase in `tasks.md` | One task changes one file and does one thing; a phase holds one sub-slice and at most 20 tasks | The measured loss of feature 152 is the size of the unit: phases of 39 and 41 tasks, a largest checkpoint claim of 41 tasks (M7), 23 passes at the 45-minute limit (M6). Rejected: one phase per user story — P1 alone would be a phase of more than 150 tasks |

Learnings of this pass:

- **"The symbol exists" is not "the plan is right about it".** The validation pass confirmed all
  34 cited symbols and still missed a module called new that exists (`pins/block.ts`), a module
  that may not be edited (`lisa-executor.ts`, pinned by a characterization test), and a callback
  that belongs to another layer (`onHandoff`). Check the header comment of a file before planning
  an edit to it, and search for the file before calling it new.
- **Most of this feature is wiring.** Features 105, 117, 148 and 103 delivered the gate, the
  summary, the feedback, the group-killing runner, the batch runner, the pins and the handoff as
  library code; the engine's attempt loop calls none of it. The spec says so requirement by
  requirement ("Delivers … in the engine path"); the plan must then name the call, not a new unit.
- **Another writer was active on this folder** while this pass ran (`plan.md` gained "Out of scope"
  and this file one paragraph at 22:35). Its text is kept; this pass wrote on top of it.

