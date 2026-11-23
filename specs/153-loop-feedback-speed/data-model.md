# Data Model: Loop feedback speed

Spec: [spec.md](./spec.md) · Plan: [plan.md](./plan.md) · Schemas:
[contracts/schemas/](./contracts/schemas/)

Everything here is **design, not code**. Each entity names its store, its schema (existing or
proposed under `contracts/schemas/`), who writes it, who reads it, and the requirement it serves.
No new entity adds run state, an exit code or a stop reason (F100-FR-031, F153-FR-004). Decision
logic never reads events (F153-FR-006): every reader below reads a control-plane record or the
launch-time frozen data.

## D1 — Gate command binding (new)

- **Serves**: F153-FR-010, -011, -012; the closing-check skip (P1a); reuse eligibility if CQ-153-02 A.
- **Store**: control plane, `features/<slug>/gate/phase<N>.<ordinal>.binding.json`, written with
  the kernel's atomic write (a temporary file, then a rename; Principle I). **Schema**: `contracts/schemas/gate-command-binding.schema.json` (proposal).
- **Fields**: phase id; the command list of the gate (id + frozen argv, the commands the F105
  gate's `selectCommands` picks for `GATE-phase-<N>` of the frozen plan); the runner binding; the
  tree fingerprint the gate runs on (`workingTreeFingerprint`, the F116 fingerprint); per-command
  outcomes (exit code, signal — `TIMEOUT` for a limit kill); a `schema` const; the rule id that
  decided the closing-check skip (CS-1…CS-4), where one was asked.
- **Written by**: the gate path once per gate run; its command list and runner are known from the
  frozen plan before the gate runs, which is what the closing check compares against.
  **Read by**: the closing-check-skip table (D1 against the closing check's own command set and
  tree), and — only under the ruled amendment — the reuse table (D12).
- The commands' results themselves stay in the gate result record of F105-FR-009
  (`attempt:<N>:<k>:<n>:verification`, `verification/src/gate/records.ts` `gateResultRecord`); D1
  repeats no output.
- **Not** part of the F101-FR-029 approval hash (that binds the verification record as today);
  the binding is referenced by it.

## D2 — Micro result records (existing, read-only for this feature)

- **Serves**: F153-FR-012 (and F153-FR-013/-014 if ruled).
- **Store**: the existing micro ledger `micro/phase<N>.json` (F115). **No schema change.**
- **Read by**: the closing-check skip and (ruled) reuse — command set, runner binding, result,
  fingerprint, taint and condition come from here. **Written by**: unchanged paths.

## D3 — Red-gate counter (new; gate: CQ-153-05 answered A on 2026-11-13)

- **Serves**: F153-FR-020…-023 (P1c). **Store**: control plane, one record per (run, phase).
  **Schema**: `contracts/schemas/red-gate-budget.schema.json` (proposal).
- **Fields**: count; per-increment source (the gate result record reference + ordinal); the
  configuration value it counts against.
- **Written by**: the budget table after each red gate (budget A — the ruled answer). **Read by**: the same
  table and `afterARejection` (`core/src/gate/limits.ts:424-462`) to decide the halt.
- Survives resume and relaunch because it derives from and points at durable records (F153-FR-021);
  no event is read (F153-FR-006).

## D4 — Timed events (existing envelope; one new pair proposed)

- **Serves**: F153-FR-034…-037 (P2).
- **Store**: the existing event store, through the single ingress
  (`core/src/gate/events.ts` `emit` / `emitThroughTheIngress`). **Schema**: the existing event
  envelope; the ruled pair (CQ-153-09 A, answered 2026-11-13) uses `contracts/schemas/commit-gate-timing.schema.json` (proposal)
  for its data fields (ids, codes, durations — no content, F111-FR-016).
- **Written by**: the composition root around gate, critic, diagnostician and scan calls;
  `attempt.ended` on every closing path. **Read by**: `specstride report` only (D6); no decision.

## D5 — End-cause mapping table (new, pure)

- **Serves**: F153-FR-037, -038. **Store**: none — a frozen table in
  `core/src/gate/end-cause.ts`; every mapping carries a rule id and is echoed into the synthesised
  or emitted `attempt.ended`.
- **Inputs**: the attempt's outcome records (approval, parsed rejection kind, verification
  failure, commit-gate block join, death). **Output**: one member of row 272's closed set; a
  process death yields a closer marked `synthesized: true` (F111-FR-004). A member outside the
  set is a blocker; CQ-153-09 was answered A on 2026-11-13 and adds none.

## D6 — Report rows (derived, no store)

- **Serves**: F153-FR-039…-041. **Store**: none; `core/src/report/rows.ts` projects events (D4)
  and control-plane records into rows; the command prints them (terse default, `--json`).
- **Guarantees**: unclosed attempts shown as unclosed; unknowns null; no imputed duration; no
  manual critic split (L-3); exit codes per CQ-153-16 A (0 on any readable state, 1 without).

## D7 — Per-task evidence bundle (ephemeral)

- **Serves**: F153-FR-051…-053 (P4). **Store**: none — prompt input, built per critic call by
  `core/src/critic-input/evidence/per-task.ts`.
- **Inputs**: a task→paths map the composition root computes from the canonical model's task texts
  with the existing extractor `pathsNamedByTheTextOfATask` (a task carries no paths field; no
  second parser, IV); the contents of those paths in the tree after the pass has exited; the
  F117-FR-011 grounding budget scaled by the F117-FR-025 window. The unit is pure: it reads no
  file itself.
- **Shape**: per task — the named files and tests, excerpted within budget; then the
  outside-all-tasks changes shown or named `NOT-SHOWN`. Nothing is taken from the checkpoint note
  or the handoff (F153-FR-053). Under `parity`: off — the capped whole diff (`changeOf`,
  `run-feature.ts:536-557`).

## D8 — Verdict pins (existing store, now wired)

- **Serves**: F153-FR-048, -049 (P4). **Store**: the existing pins store under the logical name
  `phase:<N>:verdict-pins` (`core/src/critic-input/pins/store.ts`; `VERDICT_PINS_SCHEMA` :31; the
  record's envelope `schema` marker is not content).
- **Lifecycle**: written only on a parsed REJECTED that carries a computed hash and ≥ 1 criterion
  id; removed on APPROVED; a read failure degrades to `W9 pin load skipped`. A pin is shown only
  while its backing hash is unchanged (a deleted file hashes `MISSING` and hides the pin).
- **Read by**: the existing `core/src/critic-input/pins/block.ts` (`pinStepBeforeCall`) for the
  critic prompt block, called by the composition root; the backing hash is over the priority paths
  — the paths the task texts of the phase cite (`pathsNamedByTheTextOfATask`);
  content = the F117-FR-032 fields only — the phase that keys them, the backing hash, the
  confirmed criterion ids (F153-FR-049).

## D9 — Task-group records (new; gate: CQ-153-07 A and CQ-153-15 A, answered 2026-11-13)

- **Serves**: F153-FR-054…-057 (P5b). **Store**: the launch contract (frozen at derive time,
  XIII); the slicing hash goes into the contract. **Schema**:
  `contracts/schemas/task-group.schema.json` (proposal).
- **Fields**: group id; phase; ordered task ids (never split); declared write scope; the resolved
  acceptance check or `unchecked`; the size rule id (TG-1, TG-2 or TG-3). **Switch**:
  `loop.taskGroups`, default off — on only after one trial run with groups on has been read with
  `specstride report`; size key `loop.taskGroups.size`, integer ≥ 1, default 5 (CQ-153-15 A: a
  starting value with low confidence; a project file may lower it, not raise it).
- **Read by**: the group review (critic-class call, pins the only durable effect) and the phase gate
  (which stays the unit of approval — CQ-153-07 A, answered 2026-11-13).

## D10 — Pass handoff (existing schema, now written)

- **Serves**: F153-FR-058, -059 (P5a). **Store**: control plane, one file per pass, regenerated
  fresh (never appended). **Schema**: the existing handoff record of
  `core/src/carry/handoff.ts` (`buildHandoff` :268) via `writeHandoffForAPass` :508; the content
  is F103-FR-041's list as written (the counters; the remaining units of work — the plan less the
  ledger, read from the canonical model; the pointers to the feedback files; the tree fingerprint
  and the tree-wins line), and the F153-FR-016 feedback enters as one of those **pointers**
  (CQ-153-14 A, answered 2026-11-13).
- **Written at**: `features/<slug>/handoff.md` of the control plane (the place of the logical name
  `feature:<slug>:handoff`), at the start of every pass, in `runPass` of the composition root — not through the
  `onHandoff` callback of the parallel-units wiring. **Ledger tail**: the signed pass ledger of
  F103-FR-039/-040 is not written by the engine path today; CQ-153-19 was answered B on
  2026-11-13, so the tail is empty (tracked limitation L-6).
- **Cap**: `carry.handoffMaxBytes` (6 KB, F103-FR-041). **Read by**: grounding refuses it
  (F103-FR-042); it is written for the next pass's proposer context only. Under `parity`: not
  written (every pass fresh).

## D11 — Commit-scan unit result (new; gate: CQ-153-06 A and CQ-153-17 A, answered 2026-11-13)

- **Serves**: F153-FR-024…-028 (P1d). **Store**: none required for the pre-critic step (in-memory
  per attempt); the in-pass command prints the result and exits by code. **Schema**:
  `contracts/schemas/commit-scan-result.schema.json` (proposal) for the record shape shared by
  all three call sites.
- **Fields**: tree hash; the pinned rule-set reference (launch data only, F153-FR-027); hits
  (rule id, reason, quoted escaped capped path, line); verdict. One result for one tree —
  computed by `core/src/commit-scan/scan.ts`, never by the callers (F153-FR-026).
- **Never** enters a critic input (F153-FR-028). The commit-time step and F152's void rule keep
  their existing behaviour (F153-FR-025).

## D12 — Reuse decision (specified; **not built** — CQ-153-02 answered B, refused, 2026-11-13)

- **Serves**: F153-FR-013, -014. **Store**: control plane, beside the gate result record of the
  phase attempt. **Schema**: `contracts/schemas/reuse-decision.schema.json` (proposal).
- **Key of a reusable result** (what the table compares): the runner that produced it; the pinned
  argv and command set; whether it is the full declared set; its tree fingerprint and protected
  set; its pins; its conditions and signal; what came after it (a parallel merge, a runtime
  write); whether it passed.
- **Fields**: phase, attempt; the source result (`reusedFrom`: the logical name of the in-pass
  result record and its hash); the rule id that decided (RE-1…RE-10); the outcome (`execute`,
  `reuse`); the tree fingerprint compared.
- **Written by**: the reuse table's caller, once per gate run with the switch on. **Read by**: the
  F105 gate through its `reuse` port; the gate result record then carries `reused: true` and
  `reusedFrom` for each taken-over command (F105-FR-009, in the form F105-FR-033 gives a
  `prestage` result), and the approval record binds that record's hash (F101-FR-029). L-1 is
  stated wherever the switch is on.

## D13 — Red-gate notice (existing feedback record, now with the summary)

- **Serves**: F153-FR-016…-019 (P1b). **Store**: the feedback of the phase attempt
  (`attempt:<N>:<k>:<n>:feedback`; on disk `features/<slug>/feedback/phase<N>.<ordinal>.md`, the
  engine's feedback writer). **Schema**: `contracts/schemas/red-gate-notice.schema.json`
  (proposal) for the **inputs** the text is rendered from; the text itself is F105-FR-006's.
- **Inputs**: phase; the gate's own result code (10 or 3); per failed command its id, exit code,
  argv, working directory and the two streams **after** the ingress — the document path of the one
  ingress, capped per stream, because the class `check-output` keeps only the first 1,024 bytes —
  (text, or the drop note); the
  logical names of the plan and of the gate result record.
- **Rendered by**: `renderFailureSummary` and `renderFeedback` of `packages/verification`.
- **Never** part of the hashed verification record (F153-FR-018) and never a critic-class input
  (F153-FR-019); read only by the next attempt's proposer prompt.

## D14 — Check end (existing result of the check runner)

- **Serves**: F153-FR-029…-032 (P1e). **Store**: the result the check runner returns
  (`RunnerResult`, `check-runner/src/result/result.ts`); **no new schema**.
- **A command ended at its limit**: no exit code; signal `TIMEOUT`; `command timed out` appended
  to standard error; never a pass; counted failed at the gate. The escalation taken (SIGTERM, then
  SIGKILL after the grace of 2,000 ms) is the runner's and is not a field.
- **A command ended by `cancel` or a stop request**: the condition `interrupted` beside the exit
  result it had (F148-FR-003) — a different thing from a limit.

## D15 — Workspace selection (new)

- **Serves**: F153-FR-045…-047 (P3). **Store**: control plane,
  `features/<slug>/micro/phase<N>.selection.<seq>.json`, one record per in-pass check, written
  with the kernel's atomic write. **Schema**:
  `contracts/schemas/workspace-selection.schema.json` (proposal).
- **Fields**: phase, attempt; the hash of the package graph taken at phase entry and at the
  selection; the changed files' workspaces; the dependents found by the reverse walk; the command
  ids selected; the rule id (WS-1…WS-7); or, where the full set ran, the reason (the rule id says
  which).
- **Written by**: the selection table's caller. **Read by**: a person or a test; no decision
  reads it back, and `specstride report` prints only the rows of F153-FR-040. A scoped result is never eligible for reuse (RE-4).

## Switches and keys (the plan's configuration surface)

| Key | Default | `parity` | Slice |
|---|---|---|---|
| `verification.timeLimit.enforce` | on | CQ-153-13 (default off) | P1e |
| `verification.inner.scoped` | on | off | P3 |
| `verification.parallelism` | 1 (F148) | holds | P3 |
| `loop.micro.closingCheck.skipWhenEqualToGate` | on | off | P1a |
| `events.commitGateTiming` | on | off (proposal) | P2 |
| `critic.evidence.perTask` | on | off | P4 |
| `carry.ledger_handoff` | on | off | P5a |
| `carry.handoffMaxBytes` | 6,144 | holds | P5a |
| `verification.gate.reuse` | not built (CQ-153-02 answered B, 2026-11-13) | off | ruled |
| `verification.redGate.ownBudget` | on; built under CQ-153-05 A (answered 2026-11-13) | off | P1c |
| `verification.redGate.limit` | 3 (CQ-153-05 budget A, the ruled answer); the size of the budget, not a switch | holds | P1c |
| `commit.gate.beforeCritic` | on; built under CQ-153-06 A (answered 2026-11-13) | off | P1d |
| `commit.scan.inPass` | on; the command `scan` (proposed, confirmed by feature 110), codes per CQ-153-17 A | off | P1d |
| `commit.backpressure` | off (F152's own); gates the pre-critic step under CQ-153-06 A | holds | P1d |
| `loop.taskGroups` | off until one trial run is read (CQ-153-15 A, 2026-11-13) | off | P5b |
| `loop.taskGroups.size` | 5 (a starting value with low confidence; a project may lower it, not raise it; CQ-153-15 A) | holds (a lower value holds) | P5b |

All keys narrow only (F153-FR-009): none can raise parallelism above F148's ceiling, turn reuse
on, remove a gate command or lift a limit. Spellings are proposals; feature 110 owns them.

## State transitions

- **Attempt closure** (D5): started → ended with one `endCause` — `approved`, a parsed rejection
  kind, `verification-failed` (gate red or check killed), a commit-gate block (joined from
  `commit_gate.blocked`), or `synthesized` after a process death. Every started attempt ends
  exactly once (F153-FR-037).
- **Pins** (D8): absent → written (parsed REJECTED with hash + ids) → removed (APPROVED); shown
  only while the backing hash is unchanged.
- **Red-gate counter** (D3, ruled): 0 → incremented per red gate → halt at the limit
  (non-transient); reset only with the phase.
- **Handoff** (D10): written fresh at each pass start; absent under `parity`.
