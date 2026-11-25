# Data Model: Concurrency and parallelism

Spec: [spec.md](./spec.md) · Plan: [plan.md](./plan.md) · Schemas:
[contracts/schemas/](./contracts/schemas/) (draft 2020-12)

Everything here is **design, not code**. Each entity names its store, its schema (existing or
proposed under `contracts/schemas/`), who writes it, who reads it, and the requirement it serves.
No record adds an exit code, a stop reason or a run state (F154-FR-002; F100-FR-031). Every new
record has a schema and is validated at every boundary (F154-FR-007). Every decision to run work
side by side is made by a pure table with a rule id and recorded with its reason before it takes
effect (F154-FR-003). No model takes or releases a lock, a slot or a hold, merges, or judges
independence (F154-FR-005). A broken store, an unreadable declaration or a failed landing is a
fallback to serial with its reason recorded, never an error (F154-FR-004). Nothing is written
under the project's repository by a run.

## D1 — The printed plan (existing record, extended; P1)

- **Serves**: F154-FR-009, -010, -011. **Schema**: `specstride.parallel-plan/1` (feature 142), unchanged hash. **Printed lines**: `specstride.plan-lines/1` (`contracts/schemas/plan-lines.schema.json`), the bytes the one renderer emits.
- **Store**: control plane, `run:<runId>:parallel-plan`; before a launch, derived by `planAtLaunch` on the same inputs.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.parallel-plan/1` | yes | `planAtLaunch` | F154-FR-007 |
| phases, each with its groups | list | yes | the stored plan of 142 | F154-FR-009 |
| serial tasks with the failed check as reason | list | yes | the planner's admission checks | F154-FR-009 |
| ceiling of the speed-up under equal task cost | number | yes | the planner | F154-FR-009, -011 |
| ceiling statement (`expectedSavingStatement`) | text | yes (printed, not stored) | `printThePlan` | F154-FR-008, -011 |

- **Written by**: the existing planner. **Rendered by**: `printThePlan` only, from the doctor and the dry run.
- The ceiling is printed with the statement that it is a ceiling under equal task cost and not an expectation (F154-FR-011); no line promises a saving (F154-FR-008).
- Same inputs give the same bytes from both callers; terse by default, serial list behind the verbose flag (F154-FR-010).
- Printing takes no slot, writes no record and starts no worker (F154-FR-010). Under `parity` nothing is printed.

## D2 — The report's new rows (derived; no store; P1)

**Output schema**: `specstride.report-rows-154/1` (`contracts/schemas/report-rows-154.schema.json`): the shape of the rows as printed, not a stored record.

- **Serves**: F154-FR-012, -014, -015 (read verbs of `specstride report`; F154-FR-016, -017 hold).

| Row | Computed from | Rule | FR |
|---|---|---|---|
| shares of the window (proposer passes, in-pass checks, gate and critic outside checks, the rest) | the timed events of the run, as a union | computed only from timed events; a bound where the gate is bounded; "not in the events" where none holds | F154-FR-012 |
| time of in-pass checks while no proposer pass ran | timed `check.*` and `pass.*` events | a union; never imputed | F154-FR-014 |
| per group: phase, outcome, applied path count, merge-check result, wall time | the ledger kinds `parallel` and the events | printed only for a run that used a group | F154-FR-015 |
| counts of groups by outcome, of workers by outcome and refusal reason; time of `concurrent` batches on `check.ended` | the events | none | F154-FR-015 |

- **Written by**: nobody. The report writes no file and prints no forecast (F154-FR-017).

## D3 — Trial record (`specstride.trial/1`, new; P1)

- **Serves**: F154-FR-018, -019.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.trial/1` | yes | `scripts/trial.mjs` | F154-FR-007 |
| switch under trial; fixture set; seed of session ids | text, text, integer | yes | the trial's inputs | F154-FR-018 |
| `passMark` (TRI-1 ∧ TRI-2 ∧ TRI-3) | object of three booleans and a result | yes | `pass-mark.ts` | F154-FR-018 |
| rows without a pass mark: groups kept, refusals per reason, cost with every pass counted | numbers | yes | `specstride report` on both arms | F154-FR-018 |
| the 153 replay case: 28 groups, kept 0 of 28 | object | for the P2 and P3 trial | the first case | F154-FR-019 |

- **Store**: `specs/154-concurrency-and-parallelism/trials/<switch>.json`, one per switch.
- **Written by**: `scripts/trial.mjs`. **Read by**: the owner, who records the ruling in the register row (F154-FR-001).
- TRI-1 no breach invariant of F142-FR-071 fails; TRI-2 every test of a rule passes; TRI-3 the sets of exit codes, stop reasons and run states are subsets.

## D4 — Admission decision (`parallel.admission`, existing event; P2, P3)

- **Serves**: F154-FR-024, -025, -026, -032, -033. **Schema**: the event catalogue of feature 111, additive; envelope fields `workerId`, `wseq`.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| event type `parallel.admission` | const | yes | `admissionEvent` (`decide.ts`) | F154-FR-024 |
| subject: a task, or a group as one candidate | id | yes | the caller at `groupGate` | F154-FR-024, -033 |
| verdict of every check, with its detail | list | yes | `groupGate` | F154-FR-024 |
| check `repeat` with detail (RP-1) | rule id | when refused | `repeat.ts` | F154-FR-026 |
| check `dependency` with detail (PG-2, PG-3) | rule id | when refused | `independence.ts` | F154-FR-032 |

- `repeat` and `dependency` are proposed members of the admission checks of 142 (CQ-154-09).
- RP-1: a group over the same task set failed in an earlier attempt of the phase and the fingerprint of the paths its tasks name is unchanged; refused, tasks serial. RP-2: admitted.
- PG-1 scopes disjoint, every task of both groups carries `[P]`, no task of the later group names a path in the earlier group's scope: independent. PG-2 a declared `depends_on`: dependent. PG-3 a declaration overrides PG-1.
- Emitted per task at admission and per group, before the group starts (F154-FR-003). Off under `parity`.

## D5 — Group-as-unit plan record

**Declaration fields (after `speckit-analyze`)**: each frozen group may carry `dependsOn: [group id]` and `independentWith: [group id]` (proposed, CQ-154-02 and -09). A task group carries no `[P]`, so two task groups are independent only through `independentWith`; two `[P]` runs by PG-1. (`specstride.parallel-plan/1`, extended; P3)

- **Serves**: F154-FR-031. **Store**: as D1; built by `planAtLaunch` from the frozen groups (`configuration.taskGroups`).

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| one `PlannedGroup` per frozen group | list | when `groupUnits` is on | `groups.ts` | F154-FR-031 |
| group id, phase, ordered task ids | id, id, list | yes | the frozen record of feature 153 | F154-FR-031 |
| write scope | list of paths | yes | the group's declared scope | F154-FR-031 |
| declared `depends_on` | list of group ids | optional (new optional field of the frozen record) | the launch contract | F154-FR-032 |
| independence rule id (PG-1, PG-2, PG-3) per pair | rule id | when two groups are compared | `independence.ts` | F154-FR-032, -003 |

- One worker per group, tasks in task order inside its worker. The `[P]` groups of 142 stay as they are.
- Printed through D1's renderer; not stored under `parity`.

## D6 — Worker check record

**Binding (after `speckit-analyze`)**: the record holds three fingerprints, `baseFingerprint` (the group's base snapshot), `beforeFingerprint` and `afterFingerprint`. WC-3 reads `tainted` when `afterFingerprint` differs from either; a tainted result withholds and is charged as WC-2. (`specstride.worker-check/1`, new; P3)

- **Serves**: F154-FR-034, -035, -036, -070. **Store**: the ledger kinds `parallel` (proposed as a kind).

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.worker-check/1` | yes | `closeTheGroup` | F154-FR-007 |
| group id, worker id | id | yes | the group and its worker | F154-FR-034 |
| acceptance check (argv, declared limit) | object | yes, or `unchecked` | the frozen group (F153-FR-055) | F154-FR-034, -035 |
| `fingerprintBefore`, `fingerprintAfter` | F116 content fingerprint | yes | `store.snapshot` before and after | F154-FR-035 |
| verdict | `passed`, `failed`, `tainted`, `unchecked` | yes | WC-1…WC-4 | F154-FR-035, -036 |
| rule id | WC-1…WC-4 | yes | `parallel-group.ts` | F154-FR-003 |

- **Written by**: the runtime root in `closeTheGroup`, after the worker's pass has ended and before the barrier closes, through `runEngineCheck` with `cwd: worker.tree`.
- The result only withholds a delta; it approves, keeps and releases nothing, and reaches no gate and no critic (F154-FR-034, -006).
- A group with no resolvable check is `unchecked` and its delta goes on to the merge check (F154-FR-035).

**Transitions (worker check)**: WC-1 `passed` → the delta goes on. WC-2 `failed` → the delta is `refused` with `group-check`, one repair per task of the group, the group counts as failed (F154-FR-036). WC-3 the two fingerprints differ → `tainted`, which withholds. WC-4 no resolvable check → `unchecked`, the delta goes on.

## D7 — Merge baseline comparison (`specstride.merge-baseline/1`, `contracts/schemas/merge-baseline.schema.json`) (MG-1…MG-3; P2)

- **Serves**: F154-FR-027, -028.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| rule id | MG-1, MG-2 or MG-3 | yes | `theMergeCheckOfTheGroup`, `merge-baseline.ts` | F154-FR-028 |
| applied path count | integer | yes (MG-1) | the ledger's application record | F154-FR-027 |
| base snapshot fingerprint; the base result it matched, or none | fingerprint, result id or `none` | yes (MG-2) | `baseResultOfTheInnerSet` | F154-FR-028 |
| failing command ids with failure signatures (F115-FR-019) | list | when the merge check fails | the merge check's result | F154-FR-028 |

- **Store**: recorded with its rule id; the register row of `loop.parallel.mergeBaseline` names "the baseline comparison record". Spec.md names no schema id for it; the plan adds no new condition to a check result.
- MG-1 application of 0 paths: no merge check, no charge, not failed, unit not kept. MG-2 every failing command failed on the base result with the same signature: no charge, not failed, not kept. MG-3 otherwise F142-FR-061 unchanged. With no such result, F142-FR-061 applies unchanged.
- The verification gate is not affected (F154-FR-006).

## D8 — Slot record (`specstride.host-slot/1`, new; P4)

- **Serves**: F154-FR-039, -040, -042, -044, -047.
- **Store**: user-level state, `<user-state>/slots/<bound>/<n>/`, one directory lock per slot (width N), made with `createDirectoryLock`. The record is the lock's lease and owner record.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `bound` (directory name), slot index | text, integer | yes | the slot store | F154-FR-039, -040, -042 |
| lease `schema` | const | yes | the lock (feature 122) | F154-FR-007 |
| lease `runId`, `launchId`, `launchNonce`, `leaseTokenHash` | id, id, nonce, hash | yes | the acquiring runtime root | F154-FR-044 |
| lease `owner` | owner record (below) | yes | `ownerRecordFor` | F154-FR-044 |
| lease `lockProvider` | text | yes | the lock | F154-FR-044 |
| lease `heartbeatAt`, `heartbeatEverySeconds` | time, number | yes | the holder's runtime root | F154-FR-044 |
| lease `validUntil` | time | yes | the lease, compared with boot id and start time | F154-FR-044 |
| owner `pid`, `processGroup`, `startTime` | integer, integer, time | yes | `ownerRecordFor` | F154-FR-044 |
| owner `bootId`, `hostName`, `pidNamespace` | id, text, id | yes | `ownerRecordFor` | F154-FR-044 |
| owner `launchId`, `runTokenHash` | id, hash | yes | `ownerRecordFor` | F154-FR-044 |
| owner `livenessEndpoint`, `acquiredAt`, `runId` | endpoint, time, id | yes | `ownerRecordFor` | F154-FR-044 |

- **Written by**: the holder's runtime root only, atomically. **Read by**: the slot admission table SL-1…SL-5, at the gate, at every merge check and at a pass start.
- Bounds: `host.checks.concurrent` wraps the gate and the merge checks; `host.sessions.<account>` wraps proposer and worker passes; an exclusive resource of a declared capacity is a slot of that width. A project may only lower them (F154-FR-046).
- The bounds are read only through these records; no model is asked whether to wait (F154-FR-047).
- A record whose owner lives is never removed; one whose liveness is unknown counts as held; a slot on another host is `held-foreign` and counts as held (F154-FR-044).
- The runtime root of a run becomes a writer of the user-level state (annex B row proposed).

**Transitions (a slot)**: absent → `free` → taken (SL-1, lease and owner record written). `held-live` → the contender waits as the pause of D14 (SL-2). `stale-owner-dead` → reclaimed by one atomic rename, then SL-1 (SL-3). `held-foreign` or `unknown` → counts as held, wait (SL-4). Store unreadable → proceed unbounded with the reason recorded (SL-5). A held slot → released by its holder, or reclaimed after the liveness proof.

## D9 — Hold record

**Life (after `speckit-analyze`)**: a hold expires at `resetAt` only. It is never reclaimed because its writer died: the window is a fact of the account, not of the run. (`specstride.host-hold/1`, new; P4)

- **Serves**: F154-FR-041, -044, -047. **Store**: user-level state, `<user-state>/holds/<account>.json`, one per harness account.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.host-hold/1` | yes | `enterPause` | F154-FR-007 |
| account | text (the file name) | yes | the quota classifier | F154-FR-041 |
| reset time | time | yes | the `quota_window` classification (F127-FR-010) | F154-FR-041 |
| owner record and liveness proof | as D8 | yes | the holder's runtime root | F154-FR-044 |

- **Written by**: `enterPause` when `host.limits` is on and a run classifies a `quota_window`; written by the holder only, atomically.
- **Read by**: every run of the same account before a pass; it waits until the reset through the pause of D14 (F154-FR-041). A record whose owner is proven dead is reclaimable; one whose owner lives is never removed (F154-FR-044).

## D10 — The temporary root of a run (new; P4)

- **Serves**: F154-FR-043, -072. **Schema**: none; it is a path and a life, and plan.md gives it no schema.
- **Made**: one `mkdtemp` per run at start (`temp-root.ts`). **Removed**: where the runtime root ends the run, for any cause.
- **Used**: exported as `TMPDIR` for checks and `SPECSTRIDE_WORKER_TMPDIR` for workers. Caches, homes, ports and temporary files outside the trees fall under it and under the capacity classes of D8 (F154-FR-072).
- A speculative unit's checks share none of it with the running gate (F154-FR-070). Written nowhere under `parity`.

## D11 — Stage-group declaration, stage workspace and landing (P5)

**Stage-group declaration.** Part of the F107 contract schema (an F107 amendment row). **Serves**: F154-FR-048.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `configuration.stageGroups` | list | optional | the launch contract | F154-FR-048 |
| stages of the group | list of stage ids | yes | the contract | F154-FR-048 |
| `width` | integer ≥ 1 | yes | the contract | F154-FR-048 |
| `never_together`: `{ stages, why }` | list of pairs with a one-line reason | optional | the contract | F154-FR-048 |
| `depends_on` of each stage | list of stage ids | optional (existing per-stage key) | the contract | F154-FR-048 |

- Validated at validation: a cycle, an unknown stage or a `never_together` across groups is refused with the existing exit 20 (F154-FR-048). With `pipeline.stageGroups` off, one stage per group.

**Stage workspace record** (`specstride.stage-workspace/1`, new). **Serves**: F154-FR-049, -055, -079.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.stage-workspace/1` | yes | the pipeline runtime | F154-FR-007 |
| stage id; group | id, id | yes | the stage graph | F154-FR-049 |
| workspace path (a worktree of home) | path | yes | `stage-workspace.ts` | F154-FR-049 |
| run id, lock, runtime root of the stage run | id, path, path | yes | `runStageChild` | F154-FR-049 |
| state | `running`, `landed`, `parked` | yes | the stage loop and the landing | F154-FR-049, -052 |

**Landing record** (`specstride.landing/1`, new). **Serves**: F154-FR-050…-054, -071.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.landing/1` | yes | `landing-run.ts` | F154-FR-007 |
| stage id; landing ordinal in declared order | id, integer | yes | the landing rule | F154-FR-050 |
| rebase result | `clean` or `conflict` | yes | the hardened git (PU-81) | F154-FR-050, -071 |
| fingerprint of the rebased tree; gate result of the full gate on it | fingerprint, result | when the rebase is clean | the check runner | F154-FR-051 |
| fast-forward result | `done` or `not-done` | yes | `merge --ff-only` | F154-FR-050 |
| rewrite note per approval commit | list | after a fast-forward | `approvalCommitStanding` | F154-FR-053 |
| rule id | LD-1…LD-4 | yes | `landing-rule.ts` | F154-FR-003 |

- **Written by**: each stage run and the landing path, through files only (F154-FR-049). No critic is called on the rebased tree (F154-FR-054). The approvals stand bound to their verdicts (F154-FR-053).

**Transitions (stage workspace)**: `running` → `landed` (LD-1: clean rebase and green gate, fast-forward; workspace removed). `running` → `parked` (LD-2 rebase conflict, LD-3 red gate; exit 22 for that stage, home unchanged, no model called; workspace removed). A landing record without a fast-forward resumes the landing at LD-1's rebase (LD-4). Nothing lands during a stop (F154-FR-079).

## D12 — Phase-dependency declaration and validation queue entry (P6)

**Phase-dependency declaration.** Part of the canonical model. **Serves**: F154-FR-056, -057.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `SpecPhase.dependsOn` | `string[]` | optional; the phase before it when absent | the spec-format adapters | F154-FR-056 |
| `SpecPhase.writeScope` | `string[]` | optional | the spec-format adapters | F154-FR-057 |
| source line (Spec Kit) | one comment line under the phase heading of `tasks.md` | optional | the spec format | F154-FR-056 |

- Parsed by the spec-format adapters alone; no private parser of `tasks.md` (F154-FR-004: an unreadable declaration falls back to serial with its reason recorded).
- Two phases are worked at once only when neither depends on the other and their scopes are pairwise disjoint (F154-FR-057).

**Validation queue entry** (`specstride.phase-queue/1`, new). **Serves**: F154-FR-058, -059, -060.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.phase-queue/1` | yes | `validation-queue.ts` | F154-FR-007 |
| phase id; ordinal in phase order | id, integer | yes | the queue | F154-FR-058 |
| phase tree (opaque path; a worker tree from a snapshot) | path | yes | `materialize` (tree store) | F154-FR-057, -069 |
| dependencies and their verdicts | list | yes | the approval store | F154-FR-058, -059 |
| attempt numbers of the phase | integers | yes | the ledger | F154-FR-060 |
| state | `waiting`, `head`, `approved`, `rejected` | yes | PQ-1…PQ-3 | F154-FR-058 |
| entry cause | `declared` (P6) or `speculative` (P7, with depth) | yes | the caller | F154-FR-061 |

- **Store**: control plane, one ordered list per run (a new logical name; an annex B row proposed). At the head the existing path runs unchanged: rebase, full gate once, fresh critic with its own nonce, approval and commit (F154-FR-006, -058). No outer counter moves (F154-FR-060).

**Transitions (queue entry)**: `waiting` → `head` when every dependency is approved (PQ-1). `head` → `approved` → the next phase is rebased onto it. `head` → `rejected` → repaired at the head; a dependent phase goes back to `waiting` (PQ-2) and is rebased again after approval (F154-FR-059). A phase with no declared dependency takes the phase before it as its dependency (PQ-3).

## D13 — Set-aside record

**Not here**: the reasons a speculative unit did not start (`rate`, `depth`, `sweep`) belong to the admission event `loop.speculation.admission`, not to this record. (`specstride.set-aside/1`, new; P7)

- **Serves**: F154-FR-061…-067, -064 in particular.

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| `schema` | const `specstride.set-aside/1` | yes | `run-feature.ts` | F154-FR-007 |
| phase set aside; depth (at most `loop.speculate.depth`) | id, integer | yes | the speculative unit | F154-FR-062 |
| snapshot it was branched from | fingerprint | yes | the frozen snapshot of phase n's evidence | F154-FR-061 |
| cost | tokens, disk, cycles, wall time | yes | the ledger | F154-FR-064 |
| rule id | SP-6 | yes | `speculation-rule.ts` | F154-FR-003 |

- **Store**: the ledger kinds `parallel` (proposed as a kind); one event with it (proposed).
- It records no attempt kind, run state, stop reason or exit code for the discarded unit (F154-FR-064). No outer counter and no count moves; ticks of the unit are never written (F154-FR-073). Discarding the tree is not a revert of the workspace.
- Not started: the reason `rate` (SP-2), `depth` (SP-3) or `sweep` (SP-4) is recorded (F154-FR-066, -067).

**Transitions (a speculative unit)**: not started (SP-2, SP-3 or SP-4; reason recorded) or `started` at the gate of phase n, in a tree from the frozen snapshot, the workspace unchanged (SP-1; F154-FR-061). `started` → `integrated` like a group before phase n+1's own gate (SP-5; F154-FR-063). `started` → `set-aside` on a rejection (SP-6; F154-FR-064). On a stop its workers end as group workers do (F154-FR-074).

## D14 — Pause of class `host_slot`

**Caps and status (after `speckit-analyze`)**: paused time is excluded from every time cap, as a quota pause is; `status` shows the existing pause view with the class `host_slot`. (existing record, one class proposed; P4)

- **Serves**: F154-FR-045, -077. **Schema**: the existing pause record of feature 127, `run:<runId>:pause`; `host_slot` is a proposed member of the class set (CQ-154-09) and spends nothing (`A_QUOTA_CLASS_SPENDS`).

| Field | Type | Required | Source | FR |
|---|---|---|---|---|
| class | `host_slot` | yes | `enterPause` | F154-FR-045 |
| subject: the bound or the account waited for | text | yes | the caller (SL-2, SL-4, or the hold of D9) | F154-FR-045 |
| started at; ended at | time, time | start yes, end at release | `enterPause`; `resume` | F154-FR-045 |

- **Written by**: `enterPause` (emits `run.paused`, sets `paused-quota`); closed by `resume` at release.
- One event when the wait starts and one when it ends; visible in `status`; no stop, no budget of any kind, no count moved, no cycle charged (F154-FR-045, -077).
- No new run state and no stop reason is added (F154-FR-002).

## Switches and keys

| Key | Default | `parity` | Slice |
|---|---|---|---|
| `loop.parallel.units` (142) | off | off | P1, P2 |
| `loop.parallel.noRepeat` | on with the layer | off | P2 |
| `loop.parallel.mergeBaseline` | off | off | P2 |
| `loop.parallel.groupUnits` | off | off | P3 |
| `loop.parallel.groupCheck` | off | off | P3 |
| `host.limits` | off | off | P4 |
| `pipeline.stageGroups` | off | off | P5 |
| `loop.phases.parallel` | off | off | P6 |
| `loop.speculate` | off | off | P7 |
| `loop.parallel.quota_headroom` | 142's own (F154-FR-021) | off | P2 |
| `loop.taskGroups` | feature 153's own; must be on with `groupUnits` (F154-FR-031) | off | P3 |
| `host.checks.concurrent` | 1 when on (user configuration) | off | P4 |
| `host.sessions.<account>` | unset when on (CQ-154-14) | off | P4 |
| `loop.speculate.depth` | 1 (CQ-154-18) | off | P7 |
| `loop.speculate.window` | 20 attempts (CQ-154-18) | off | P7 |
| `loop.speculate.minRate` | 50 % (CQ-154-18) | off | P7 |

The nine switches are the first nine rows. A switch turns on only after a trial record is read by the owner and a divergence register row names its output fields (F154-FR-001, -018). The three host bounds may only be lowered by a project file (F154-FR-046). Defaults marked "when on" are starting values with low confidence.

## Closed sets touched

| Closed set | Change | Ruling | Schema id of the new record |
|---|---|---|---|
| Exit codes, stop reasons, run states (annex E) | none | — | none |
| Admission checks of 142 (row 61) | `repeat` (F154-FR-026), `dependency` (F154-FR-032) proposed | CQ-154-09 | `parallel.admission` carries them (D4) |
| Refusal reasons of a delta (row 63) | `group-check` (F154-FR-036) proposed | CQ-154-09 | `specstride.worker-check/1` (D6) |
| Event types | the slot wait start and end (F154-FR-045), the landing (F154-FR-050…-052), the set-aside (F154-FR-064) proposed | CQ-154-09 | `specstride.host-slot/1`, `specstride.landing/1`, `specstride.set-aside/1` |
| Integrity kinds that reach the critic (row 65) | none | — | none |
| Reasons a speculative unit does not start (new set) | `rate` (F154-FR-066), `depth` (F154-FR-062), `sweep` (F154-FR-067) proposed | CQ-154-09 | `specstride.set-aside/1` (D13) |
| Ledger kinds `parallel` (row 184) | the worker check record, the trial record, the stage workspace, the landing, the set-aside record proposed as kinds | CQ-154-09 | `specstride.worker-check/1`, `specstride.trial/1`, `specstride.stage-workspace/1`, `specstride.landing/1`, `specstride.set-aside/1` |
| Pause classes (§C.13) | `host_slot` proposed | CQ-154-09 | the existing pause record (D14) |
