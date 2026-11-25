# Feature Specification: Concurrency and parallelism

**Feature Branch**: `154-concurrency-and-parallelism` (a label: Spec Kit creates no branch in this repository; the directory is `specs/154-concurrency-and-parallelism`)

**Created**: 2026-11-25

**Status**: Rulings answered (2026-11-25; 3 by the owner, 16 by research-backed recommendation, see Clarifications). Ready for planning.

**Input**: User description: "Let the loop do more than one thing at a time where a deterministic check says it is safe: several task groups of a phase, several features of a pipeline, and several runs on one host and one account. Validation stays one ordered stream and governance stays as it is. Private copies, one writer, one validator, a serial history." (`prompts/154-concurrency-and-parallelism/feature-input.md`, grounded 2026-11-14, re-grounded 2026-11-25 on `main` @ `a4d2df3c`.)

**Sources**:
- `prompts/154-concurrency-and-parallelism/feature-input.md`: the feature, the measurements, levels L0 to L5, required behaviours 1 to 7.
- Its ledger `grounding-ledger.md`: rows K, Q, C, M, P, O, E; the re-ground rows R-C1 to R-C9 and R-C12 to R-C19, R-Q0, R-Q18, R-Q19, R-Q21 to R-Q23, R-Q25, R-M1 to R-M16, R-P13, R-O2, R-O3, R-O8, R-O9, R-K9, R-E1 to R-E16; and the resolution rows of 2026-11-25.
- `specs/154-concurrency-and-parallelism/constitution-grounding.md`: constitution v3.0.3, tensions T-a to T-l, 18 constraints carried into this stage, CQ-154-02 to CQ-154-10.
- Specs 100 (annexes A, B, E, X), 101, 107, 115, 116, 118, 122, 123, 127, 142, 143, 148, 149, 153.
- `docs/options/parallel-units.md`.
- The research of September: R26, R29, R29v.
- https://ghuntley.com/ralph/ (ledger E1).

Code read on `main` @ `d1e8587f` (paths in Assumptions only).

**Platform**: Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated, and every statement about macOS is `unverified` (feature 100, Decision 12; F100-FR-025).

## What this feature is

Parallel units are specified (142), built and wired (143), and they ran live in feature 153: 28 groups in three phases. None of the 28 landed (ledger R-M9, R-M16).
- **Why none landed:** each group's merge check runs the phase's whole inner check set, and that set was red for reasons outside the group. Nothing stopped the same finished group from starting again on every attempt, because F142-FR-023 counts failed groups only inside one phase attempt.
- **Several features at once** happens only above the product, in a campaign script's lanes. It has no gate on the rebased tree, and until PR #41 every approval was voided by the rebase (R-O9, R-C16).
- **Limits between runs** on one host and account live in scripts outside the product (O2–O5).

This feature turns that into product behaviour, in seven slices, in this order:
1. **Measure.** Print the plan, report what ran side by side and what it cost, and define the trial that turns a switch on.
2. **Deliver 142 in full in the engine path.** Every admissible group of a phase, headroom from observation, the halving, the cycle charge, the admission event, and a second tested worker door. Add three new rules the live record showed are needed: no restart of a group that already failed, no merge check on an empty application, and a merge check compared with a baseline.
3. **Make task groups the parallel unit.** 153's frozen groups become units, and their acceptance check runs in the worker tree.
4. **Keep one validation stream, and share limits across runs.** Bound full check-set executions, live sessions per account, one quota hold, capacity classes, and a temporary root per run.
5. **Run features side by side in the pipeline.** A stage group wider than one stage, a workspace per stage, and landing by rebase and fast-forward after a full gate.
6. **Run phases side by side.** A declared phase dependency, and one ordered validation queue.
7. **Start work past an open verdict.** The next unit starts in a tree of its own while the gate and the critic judge, and it is set aside on a rejection.

Slices 1 to 3 are the core. Slice 4 serves anything that runs twice on a host. Slice 5 is the first slice across runs. Slices 6 and 7 are built last and stay off until the measurement of slice 1 supports them (owner, 2026-11-15).

### In scope

| In scope | Behaviour | Stories |
|---|---|---|
| Printed plan, report rows, the trial | 1 | P1 |
| The parallel layer delivered in full in the engine path, and the three rules from the live record | 2 | P2 |
| Task groups as the parallel unit, acceptance check in the worker tree | 3 | P3 |
| Shared limits across runs on one host and account | 4 | P4 |
| Stage groups wider than one stage; landing | 5 | P5 |
| Phases side by side with one validation queue | 6 | P6 |
| Work past an open verdict | 7 | P7 |

### Out of scope

| Out of scope | Why (one line) | Seam this spec leaves |
|---|---|---|
| Selection among N candidates for one unit | At about one approval in twelve attempts it buys little for 1.5× the cost (P11, R-M11) | The worker door of P2 and the per-group cost rows of P1 |
| A model that merges; integrating a killed worker's partial work | Principle XX; F143-FR-014 | Composition stays disjoint-only (F143-FR-019) |
| The harness's own agent teams or subagents inside one pass | One pass stays one writer; inside the session is the harness's business (E8) | none |
| Reuse of an earlier result at the gate; scoped selection at the gate | Refused: CQ-153-02 B, CQ-153-08 A | none |
| Moving the attempt loop into `core` as a pure state machine | 153's follow-up | Every decision here is a pure table with a rule id (F154-FR-003) |
| Runs spread over more than one host | One host measured | Slot and hold records name their host (F154-FR-044) |
| The other inspection verbs reading the engine's control root (`events`, `tail`) | It changes the stop and resume guards and is a fix of its own | The reader of PR #40 |
| In-pass check batching (the follow-up 153 handed to feature 115) | No measurement shows a gain (L-4); it is feature 115's to deliver | The amendment row of F153-FR-042 (CQ-154-16) |

## Rationale

These figures are from two finished runs of the engine on its own repository (ledger R-M2…R-M13), with shares computed as a union.
- **Proposer share:** 42.9 % of the window for feature 152 and 43.7 % for feature 153. Parallel proposers act on this share and nothing else.
- **Checks:** 274 of 386 in-pass checks failed in 153.
- **Approvals per attempt started:** 10 of 121 for 152 and 29 of 336 for 153, about one in twelve. Four phases of 153 took 223 of its 336 attempts.
- **The `[P]` marker:** a marker-only ceiling of 2.04 over this repository's task lists. Once order, a named path and no overlap are required, it is 1.25 at two workers by script, and 1.10 for 153's own list (R-M12, R-M13).
- **153's live groups:** 28 groups, 11.65 h in groups, none kept (R-M9).

The principle, in Huntley's words (ledger E1, read first-hand): "only a single subagent should be used for validation, but Ralph can use as many subagents as he likes for searching the file system and for writing files." Principle XX says the same for this engine.

Limits of the evidence:
- One host and two runs.
- Timed gate and critic events cover only part of 153's run, so the gate share is a bound (R-M7).
- The admissible-group count is a script, not the planner.
- The cold-start cost per worker, "65 to 108 k first-turn tokens", is inferred (P6).
- The lanes' speed-up is not derivable (O8).

## Where the spec already requires it

These behaviours are required by an existing requirement that the engine path does not deliver. They are written as "deliver F142-FR-nnn" and stay behind 142's own switch, `loop.parallel.units`.

| Existing requirement | Today (anchor) | Here |
|---|---|---|
| F142-FR-017: with the option on, the doctor and the dry run print the plan | Library only, no caller; `docs/options/parallel-units.md` :36, :108 promise it (R-C7) | F154-FR-009 |
| F142-FR-008, F142-FR-018: every group of the plan, at a clean boundary | Only `groups[0]`, one group per attempt (R-C3) | F154-FR-020 |
| F142-FR-016 (a), headroom from observed quota utilisation | A stub, `utilisationPerCent: []` (R-C6) | F154-FR-021 |
| F142-FR-019, the halving after two transient rate limits | Library only (R-C6) | F154-FR-022 |
| F142-FR-021, one cycle charged per admitted worker task | Library only (R-C6) | F154-FR-023 |
| F142-FR-011 and F142-FR-025, the admission per task with the verdict of every check | `admissionEvent` has no caller (R-C8) | F154-FR-024 |
| F142-FR-020, a tested adapter that declares `concurrentSessions` | The `claude` path has no worker door (C4) | F154-FR-029 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The loop measures what could run side by side (Priority: P1)

Before any switch is turned on, the operator sees the plan: which groups each phase would have, which tasks stay serial and why, and the ceiling under equal task cost. After a run, the report shows where the time went, how many attempts ended in an approval, and what each group did.

**Why this priority**: every other slice is switched on by reading this. 153 ran 28 groups and nobody could see that none landed until the records were read by script (R-M9, R-C17).

**Independent Test**: on the plan fixtures, `specstride doctor` and `launch --dry-run` print byte-identical plans, and nothing is written; on a frozen copy of feature 153's events, `specstride report` reproduces the counts of the feature input's table.

**Acceptance Scenarios**:
1. **Given** a task list with two runs of consecutive `[P]` tasks with disjoint named paths and `loop.parallel.units` on, **When** the operator runs `launch --dry-run`, **Then** the plan per phase names the groups, every task left serial with its reason, and the ceiling under equal task cost with the statement that it is a ceiling and not an expectation, and no slot, record or worker exists afterwards (F154-FR-009, -010, -011).
2. **Given** the same task list, **When** the operator runs `specstride doctor`, **Then** it prints the same bytes as the dry run (F154-FR-010).
3. **Given** a frozen copy of feature 153's event files, **When** the operator runs `specstride report`, **Then** it prints 336 attempts started, 29 approvals, 274 of 386 in-pass checks failed, and per group the outcome `repair` 28 times, and changes no file (F154-FR-012…-017; delivered in part by PR #40).
4. **Given** a run with a group, **When** the report is printed, **Then** each group shows its outcome, its applied path count, its merge-check result and its wall time, and the time of checks that ran while no pass ran (F154-FR-014, -015).

### User Story 2 - The parallel layer works as specified (Priority: P2)

With parallel units on, a phase works every admissible group of its plan, admits each one against the quota it observes, records why each task ran where it did, and doesn't start again a group that already failed over the same tasks.

**Why this priority**: the layer is built, and in its one live use it spent 11.65 h landing nothing (R-M9, R-M16).

**Independent Test**: on the stub fixtures, a phase with three admissible groups starts all three in plan order. On the replay of 153's phase 23, the group `g-23-1` starts once, not on every attempt.

**Acceptance Scenarios**:
1. **Given** a phase whose plan holds three groups, **When** the attempt runs, **Then** each group starts at its clean boundary in plan order, and every task of the phase is in exactly one group or the serial list (F154-FR-020; F142-FR-008, -011).
2. **Given** a group that failed in attempt n of a phase, **When** attempt n+1 starts and the tree its tasks read is unchanged, **Then** the group does not start, its tasks run serially, and the admission records the reason (F154-FR-026).
3. **Given** a group whose application changed no path, **When** integration ends, **Then** no merge check runs, its tasks return to the main line with no repair charged, and the group does not count as failed (F154-FR-027).
4. **Given** a group whose merge check fails only on commands that failed with the same failure signature on the base tree, **When** the outcome is decided, **Then** no repair is charged to its tasks, the group does not count as failed, and the unit is not kept (F154-FR-028).
5. **Given** the last observed utilisation of a quota window at or above `loop.parallel.quota_headroom`, **When** a group is due, **Then** it is not admitted, with the check `headroom` and its detail recorded (F154-FR-021).
6. **Given** a harness adapter that declares `concurrentSessions` without the proof of F154-FR-030, **When** a launch reads the registry, **Then** the layer is off for the run with the reason `harness` (F154-FR-029, -030).

### User Story 3 - Task groups are the parallel unit (Priority: P3)

When 153's task groups and parallel units are both on, a phase's frozen groups are the candidates for workers. Two groups run at once only when a recorded rule finds them independent. Each group's acceptance check runs in its own worker tree, and a group whose check fails is not integrated.

**Why this priority**: groups carry a write scope and an acceptance check already (F153-FR-054, -055). They are the natural unit, and nothing yet relates them to each other (R-Q23).

**Independent Test**: on the group fixtures, two groups with disjoint scopes and the independence of CQ-154-02 run at once. Two groups whose later one names a path in the earlier one's scope run one after the other, with the reason recorded.

**Acceptance Scenarios**:
1. **Given** two frozen groups of one phase with disjoint write scopes and independent by the rule of CQ-154-02, **When** the phase attempt reaches them, **Then** both are worked at once, one worker each, and the admission records the rule id (F154-FR-031, -032).
2. **Given** two groups where the later group names a path inside the earlier group's write scope, **When** admission runs, **Then** they run one after the other and the reason is recorded (F154-FR-032).
3. **Given** a worker whose pass has ended, **When** its group has a declared acceptance check, **Then** the runtime runs that check in the worker tree with its declared limit, and a failure withholds that worker's delta from integration (F154-FR-034, -036).
4. **Given** a worker that changed a file the acceptance check reads, **When** the check runs, **Then** its result is `tainted` and withholds the delta (F154-FR-035).

### User Story 4 - One validation stream, and limits shared across runs (Priority: P4)

Several runs on one host share a bound on full check-set executions, a bound on live proposer sessions per harness account, one quota hold per account, capacity classes for exclusive resources and a temporary root each. A run that waits for a slot is paused, not stopped.

**Why this priority**: four lanes ran into each other on this host. `/tmp` ran out of inodes and "every concurrent gate failed with ENOSPC", and the account's quota hold was known only to a script (O1–O5).

**Independent Test**: on the two-run fixture with a bound of 1, no two full check-set executions overlap in the event files of the two runs. A run whose slot owner died reclaims the slot only after the liveness proof.

**Acceptance Scenarios**:
1. **Given** two runs on one host with `host.checks.concurrent` 1, **When** both reach a gate at once, **Then** one gate runs and the other run waits as a pause, spending no budget and moving no count (F154-FR-039, -045).
2. **Given** a run that observed a quota window, **When** another run of the same account is about to start a pass, **Then** it reads the hold and waits until the reset (F154-FR-041).
3. **Given** a slot record whose owner is dead, **When** a contender probes it, **Then** it reclaims the slot atomically; a slot whose owner lives is never removed (F154-FR-044).
4. **Given** a run, **When** it ends, for any cause, **Then** its temporary root is removed (F154-FR-043).

### User Story 5 - Features side by side in the pipeline (Priority: P5)

A launch contract may declare a stage group wider than one stage. Each stage runs in a workspace of its own, and a finished stage lands home in the declared order, by a rebase and a fast-forward, after the full gate passed on the rebased tree.

**Why this priority**: the lanes do this today outside the product, with no gate on the rebased tree (R-O9).

**Independent Test**: on the pipeline fixture with two independent stages, both run at once. A landing conflict parks exactly that stage, with exit 22, and makes no model call.

**Acceptance Scenarios**:
1. **Given** a contract with a stage group `{A, B}`, width 2, and no `never_together` between them, **When** the pipeline runs, **Then** A and B run at once, each in its own workspace with its own lock (F154-FR-048, -049).
2. **Given** A finished first, **When** it lands, **Then** the full gate runs on A rebased onto home, and on a pass home fast-forwards (F154-FR-050, -051).
3. **Given** a rebase conflict, or a red gate on the rebased tree, **When** B lands, **Then** B is parked with exit 22, home is unchanged, A's landing stands, and no model is called (F154-FR-052).
4. **Given** a landed stage, **When** a later run reads its approvals, **Then** they stand, with the rewrite noted (F154-FR-053; PR #41).

### User Story 6 - Phases side by side (Priority: P6)

Phases with a declared dependency graph and disjoint write scopes are worked at once in trees of their own, and validated one at a time in phase order.

**Why this priority**: it is in scope by the owner's decision of 2026-11-15. It is built last and stays off until P1's measurement supports it.

**Independent Test**: on the phase-graph fixture, phases 2 and 3 declared independent are worked at once. Gate, critic, approval and commit run per phase in order, phase 3's gate on the tree rebased onto approved phase 2.

**Acceptance Scenarios**:
1. **Given** phases 2 and 3 declared independent with disjoint write scopes, **When** phase 1 is approved, **Then** both are worked at once (F154-FR-056, -057).
2. **Given** both finished, **When** validation runs, **Then** phase 2 is gated, judged and committed first, then phase 3 is rebased onto it and gated, judged and committed (F154-FR-058).
3. **Given** a phase with no declared dependency, **When** the plan is computed, **Then** it depends on the phase before it (F154-FR-056).

### User Story 7 - Work past an open verdict (Priority: P7)

While the gate and the critic judge one phase on a frozen workspace, the next phase is worked in a tree of its own. On an approval it lands like a group. On a rejection it is set aside, at no counter.

**Why this priority**: it is in scope by the owner's decision of 2026-11-15. At about one approval in twelve attempts most of this work would be set aside (R-M11), so it is built last and switched on only against a measured approval rate.

**Independent Test**: on the speculation fixture with a stub critic that approves, phase n+1's tree exists while phase n is judged, the critic's inputs hold none of it, and on the approval it integrates. With a stub critic that rejects, the tree is discarded and no count moves.

**Acceptance Scenarios**:
1. **Given** the switch on and a measured approval rate at or above the threshold, **When** phase n's gate starts, **Then** phase n+1 starts in a tree branched from the frozen snapshot and the workspace does not change (F154-FR-061, -066).
2. **Given** a rejection of phase n, **When** the verdict lands, **Then** the tree of phase n+1 is discarded, no outer counter and no count moves, and its cost is reported (F154-FR-064).
3. **Given** the measured rate falls below the threshold, **When** the next gate starts, **Then** no speculative unit starts and the reason is recorded (F154-FR-066).

### Edge Cases

- **Base tree with no current check result** (F154-FR-028): the merge check charges as F142-FR-061 does today.
- **Group's tasks ticked by the main line before the group starts:** the ticked tasks leave its group, and a group left with fewer than 2 tasks is cancelled (F142-FR-018).
- **Slot store unreadable:** the run proceeds unbounded with the reason recorded, and never stops (F154-FR-004).
- **Stage group whose `never_together` names a stage of another group:** the contract is refused at validation (F154-FR-048).
- **Stop in the middle of a wide stage group:** each stage run stops by its own lock, and nothing lands (F154-FR-079).
- **Speculative tree alive when a critic-class call is due and the amendment of F142-FR-070 is refused:** no speculative unit is started (F154-FR-067).

## Requirements *(mandatory)*

### Functional Requirements

#### G0 — Across every slice

- **F154-FR-001**: Every new behaviour of this feature MUST have its own switch, MUST be off by default, MUST be off under the `parity` profile, and MUST be turned on only by a row of the divergence register with the owner's ruling. Every new output field (a report row, a plan line, a slot or hold record, a new event, the rewrite note of a landed approval) MUST be named in that register row, so that the parity suite can allow it. *Why: Principle XVIII, parity before capability.*
  - anchor: XVIII; constraint 16; T-k
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-002**: No behaviour of this feature MUST add an exit code, a stop reason or a run state. Every failure inside it MUST end in one of: the work returns to the serial path; the behaviour is off for the phase attempt; the behaviour is off for the run; for a stage of a wide group, that stage is parked with the existing exit 22. *Why: Principle XX and F100-FR-031, closed vocabularies.*
  - anchor: XX; F100-FR-031, -148; Additional Constraints; T-j; constraint 15
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-003**: Every decision to run work side by side (a group, a slot, a stage, a phase, a speculative unit) MUST be made by a pure table with a rule id. The table MUST live in core, kernel or the layer; the composition root only wires it. It MUST be recorded with its reason before it takes effect, and the same inputs MUST give the same decision. *Why: Principles XIII and XX, "Every decision to run in parallel is recorded with its reason".*
  - anchor: XIII; XX; F142-FR-011; constraint 17
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-004**: A broken slot store, an unreadable dependency declaration, a failed landing or any failed precondition of this feature MUST be a fallback to serial with its reason recorded. It MUST never be an error that stops a run. *Why: Development Workflow, "every code path degrades instead of failing".*
  - anchor: Development Workflow; F142-FR-002; constraint 18
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-005**: No model MUST take or release a lock or a slot, merge content, resolve a conflict, or decide whether two units are independent. *Why: Principle XX, "No model merges conflicting work silently"; models propose, the engine disposes (II).*
  - anchor: XX; II; ledger E6
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-006**: Governance MUST stay as it is: one critic per phase in a fresh session; verdicts bound to a per-call nonce; signed approval records bound to their verdict; one approval and one commit per approved phase; the full verification gate on the workspace before the critic, never scoped and never replaced by a result from a group, a worker, a stage or a snapshot. *Why: Principle II cannot be justified away; CQ-153-02 B, CQ-153-07 A, CQ-153-08 A.*
  - anchor: II; F101-FR-011, -029, -031, -035; F142-FR-062
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-007**: Every new record (slot, hold, queue entry, stage-group declaration, phase-dependency declaration, set-aside record) MUST have a schema and MUST be validated at every boundary. *Why: Principle VI.*
  - anchor: VI
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged
- **F154-FR-008**: No requirement, report row or printed line of this feature MUST promise a saving. It MAY print a ceiling under stated assumptions, a share, a count or an invariant. *Why: the evidence supports no forecast (ruling P10, `expectedSavingStatement`).*
  - anchor: feature input, constraints; F153-FR-040
  - switch: every switch of this feature (an invariant); parity: off under every switch, and the rule itself holds unchanged

#### G1 — Measure (P1)

- **F154-FR-009**: Delivers F142-FR-017 in the engine path. With `loop.parallel.units` on, `specstride doctor` and `launch --dry-run` MUST print the stored plan: per phase the groups, every task made serial with the failed check as its reason, and the ceiling of the speed-up under equal task cost. Under ruling CQ-154-19 they MAY also print it with the option off, labelled as the plan the option would produce. *Why: the option's page promises it (R-C7), and no switch can be judged without it.*
  - switch: `loop.parallel.units` (142); parity: off (no plan line, with the option on or off: under `parity` the print follows the profile and prints nothing)
- **F154-FR-010**: The plan printed by the doctor and by `launch --dry-run` MUST be the same bytes for the same inputs. Printing it MUST take no slot, write no record and start no worker. It MUST be terse by default, with the serial list behind the verbose flag. *Why: Principles XV (a dry run withholds consent) and XIX (terse output).*
  - switch: as F154-FR-009; parity: off
- **F154-FR-011**: The ceiling MUST be printed with the statement of `expectedSavingStatement` that it is a ceiling under equal task cost and not an expectation. *Why: F154-FR-008.*
  - switch: as F154-FR-009; parity: off
- **F154-FR-012**: `specstride report` MUST print the shares of the window (proposer passes, in-pass checks, gate and critic outside checks, the rest) computed as a union so that no time counts twice. Each share MUST be computed only from timed events. It MUST be printed as a bound where the gate is bounded by `evidence_written` and the attempt's close, and as "not in the events" where no event holds it. *Why: the feature input's table, reproduced by the product instead of a script (R-M8).*
  - anchor: F153-FR-040; XI; ledger R-M7, R-M8
  - switch: none (a read verb); parity: the report is not run output
- **F154-FR-013**: Delivered by PR #40, recorded here. The report MUST print the approvals, the phases approved and the approvals per attempt started, counting a `phase.ended` of the old vocabulary as an approval. *Why: behaviour 7 is switched on against this rate (R-M11).*
  - anchor: F153-FR-040; ledger R-C17
  - switch: none (a read verb); parity: as F154-FR-012
- **F154-FR-014**: The report MUST print the total time of in-pass checks that ran while no proposer pass of the run ran. *Why: it is the time an overlap could hide (M10).*
  - anchor: ledger M10
  - switch: none (a read verb); parity: the row is not printed, because the events it reads do not exist under `parity`
- **F154-FR-015**: For a run that used a group, the report MUST print per group its phase, its outcome, the path count of its application, the result of its merge check and its wall time. Over the run it MUST print the counts of groups by outcome, of workers by outcome and refusal reason, and the time of batches flagged `concurrent` on `check.ended`. *Why: 153's 28 groups were visible only by script (R-M9).*
  - anchor: F142-FR-022, -025; F148-FR-017; ledger R-M9
  - switch: none (a read verb); parity: the row is not printed, because the events it reads do not exist under `parity`
- **F154-FR-016**: Delivered by PR #40, recorded here. The report MUST read every run file of the feature that the engine wrote, in time order. *Why: a finished feature spans many relaunches (R-C17).*
  - switch: none (a read verb); parity: as F154-FR-012
- **F154-FR-017**: The report MUST print no forecast and MUST write no file. *Why: F153-FR-040 as written.*
  - switch: none (a read verb); parity: as F154-FR-012
- **F154-FR-018**: A switch of this feature MUST be turned on only after a trial. A trial is one run of a fixture set with only that switch changed, read with `specstride report`. Its pass mark MUST be safety:
  - no breach invariant of F142-FR-071;
  - every test of a rule passes;
  - the sets of exit codes, stop reasons and run states are subsets of those with the switch off.

  It MUST report, without a pass mark, the share of groups kept, refusals per reason, and cost with every pass counted. The owner MUST read it and record the ruling in the register row. *Why: ruling P10 made E6 a safety experiment, and "a default cannot be shown at this size".*
  - anchor: F142-FR-072; ledger P12; CQ-154-15
  - switch: none (a trial is one run with one switch changed); parity: not run output
- **F154-FR-019**: The trial of P2 and P3 MUST include the replay of feature 153's 28 groups as its first case (kept 0 of 28) and MUST report the same rows for the switch on. *Why: it is the only live record of the layer (R-M9).*
  - anchor: ledger R-M9, R-M16
  - switch: none (a trial is one run with one switch changed); parity: not run output

#### G2 — The parallel layer delivered in the engine path (P2)

- **F154-FR-020**: Delivers F142-FR-008 and F142-FR-018 in the engine path. A phase attempt MUST work every group of the stored plan, in plan order, each started at its clean boundary. It MUST NOT be limited to the first group of the plan. A group left with fewer than 2 tasks after the main line ticked some of them MUST be cancelled (F142-FR-018). *Why: today one group per attempt, always the first (R-C3).*
  - switch: `loop.parallel.units`; parity: off
- **F154-FR-021**: Delivers F142-FR-016 (a). The check `headroom` MUST read the last observed utilisation of every quota window of the proposer's account from the window facts of F127-FR-009. With no observation in the run a group MUST have 2 workers. *Why: today the input is an empty list (R-C6).*
  - switch: as F154-FR-020; parity: off
- **F154-FR-022**: Delivers F142-FR-019's halving: two rate limits classified as transient in one group MUST halve the worker count for the rest of the phase attempt. *Why: library code with no caller (R-C6).*
  - switch: as F154-FR-020; parity: off
- **F154-FR-023**: Delivers F142-FR-021's charge: one cycle of the micro-loop layer MUST be charged per admitted worker task at its first start, and the check of F142-FR-016 (d) MUST read the remaining cycles. *Why: library code with no caller (R-C6).*
  - switch: as F154-FR-020; parity: off
- **F154-FR-024**: Delivers F142-FR-011 and F142-FR-025. The admission of every task MUST be an event `parallel.admission` with the verdict of every check and its detail. *Why: Principle XX, "Every decision… is recorded with its reason" (R-C8).*
  - switch: as F154-FR-020; parity: off (the `parallel.*` event types are row 74 of annex X §X.6; register row DV-088 names the envelope fields `workerId` and `wseq`)
- **F154-FR-025**: Delivers F142-FR-023 with several groups per attempt. The count of failed groups of a phase attempt MUST be read from the ledger of the attempt, never from a constant. When that count reaches the bound of F142-FR-023, no further group of the attempt MUST start (CQ-154-13: all groups in plan order, no separate bound). *Why: today the count passed in is the constant 0 (R-C5).*
  - switch: as F154-FR-020; parity: off
- **F154-FR-026**: A group MUST NOT start when a group over the same task set failed in an earlier attempt of the same phase and the fingerprint of the paths its tasks name is unchanged since that failure. Its tasks MUST be serial, with the admission reason of CQ-154-09 (`repeat` is proposed). *Why: F142-FR-023 counts per attempt, so in 153 the same finished group started on all 21 attempts of phase 23 (R-M16).*
  - anchor: ledger R-M16; constraint 2; CQ-154-17
  - switch: `loop.parallel.noRepeat`, default on with the layer; parity: off
- **F154-FR-027**: A group whose application changed no path MUST run no merge check. Its tasks MUST return to the main line with no repair charged, and it MUST NOT count as a failed group. Its unit MUST NOT be kept (F142-FR-060 stands). *Why: 22 of 28 groups of 153 applied nothing and each paid a merge check of the whole inner set (R-M16).*
  - anchor: F142-FR-059, -060; ledger R-M16; CQ-154-17 (amends F142-FR-059)
  - switch: as F154-FR-026; parity: off
- **F154-FR-028**: Where a result of the inner check set exists whose recorded tree fingerprint (F116-FR-005) equals the fingerprint of the group's base snapshot, a merge check that fails only on commands that failed on that result with the same failure signature (F115-FR-019) MUST NOT charge a repair and MUST NOT count as a failed group. The unit MUST NOT be kept. With no such result, F142-FR-061 applies unchanged. The comparison MUST be recorded with its rule id. No condition of a check result is added: the result keeps the condition F116 gives it, and the comparison is a rule of this feature, not a new state. The verification gate is not affected. Under answer B of CQ-154-17 this requirement is not built and F142-FR-061 applies unchanged. *Why: in 153 every merge check failed on a suite that was red before the group (R-M16); XX's "deterministic merge check" is kept, and the comparison is recorded.*
  - anchor: XX; F142-FR-061; F116-FR-005; F115-FR-019; CQ-154-17 (amends F142-FR-061)
  - switch: `loop.parallel.mergeBaseline`; parity: off
- **F154-FR-029**: Delivers F142-FR-020. A group MUST run on a harness adapter only when the registry records `concurrentSessions` for that adapter as tested under F154-FR-030. No rule MUST name a harness. *Why: Principle VII; today only the dsh path has a worker door (C4).*
  - switch: as F154-FR-020; parity: off
- **F154-FR-030**: An adapter MUST be recorded as tested for `concurrentSessions` only when all of these hold:
  - a test against a fake binary shows that N concurrent sessions on one configuration home leave every file of that home byte-identical;
  - a recorded live check of the same holds;
  - the adapter pins its version range with a `verified-on` date.

  Otherwise the adapter is unverified for groups. *Why: Principle VIII, "The operator's configuration is never mutated" (T-c).*
  - anchor: VIII; X; XII; CQ-154-03
  - switch: as F154-FR-029; parity: off

#### G3 — Task groups as the parallel unit (P3)

- **F154-FR-031**: With `loop.taskGroups` and `loop.parallel.groupUnits` both on, the frozen task groups of the launch contract (F153-FR-054) MUST be the candidates of the planner for a phase, one worker per group, each group's tasks in task order inside its worker. Under answer A of CQ-154-02 this group is not built and the unit stays the `[P]` task; under B, the `[P]` groups of G2 stay as they are and nothing changes for them. *Why: groups already carry a write scope and an acceptance check (F153-FR-055).*
  - switch: `loop.parallel.groupUnits`, default off; parity: off
- **F154-FR-032**: Two groups of one phase MUST be worked at once only when their write scopes are pairwise disjoint (F142-FR-009) and they are independent by the source CQ-154-02 rules. Otherwise they MUST run one after the other, with the admission check `dependency` (proposed, CQ-154-09) and its detail recorded. Where independence rests on the marker rule (i) alone, no declaration is read: every task of both groups MUST carry `[P]`, and no task of the later group MAY name a path in the earlier group's write scope. Under answer B of CQ-154-09 the reason is the detail of the existing check `check`. *Why: Principle XX, "only after deterministic checks of dependency and of write scopes" (T-a).*
  - anchor: XX; CQ-154-02; constraint 1
  - switch: `loop.parallel.groupUnits`, default off; parity: off
- **F154-FR-033**: A group MUST be admitted only through the admission checks of F142-FR-011, applied to the group as one candidate whose scope is the group's write scope. *Why: one admission rule for both kinds of unit.*
  - anchor: F142-FR-011
  - switch: `loop.parallel.groupUnits`, default off; parity: off
- **F154-FR-034**: Under ruling CQ-154-04, after a worker's pass has ended and before the barrier closes, the runtime MUST run the group's frozen acceptance check in that worker's tree, through the check runner, with the check's declared limit. Its result MUST only be able to withhold that worker's delta. It MUST NOT approve, keep or release anything. If the amendment is refused (answer C), this requirement is not built and the acceptance check runs on the workspace after the application, as today (R-C19). *Why: Principles II ("An inner check… never approves anything") and III (run by the runtime); today the check runs in the workspace with a fixed 300 s limit (R-C19).*
  - anchor: II; III; I; F153-FR-056; CQ-154-04 (amends F142-FR-059, F143-FR-011)
  - switch: `loop.parallel.groupCheck`; parity: off
- **F154-FR-035**: A change by the worker to a path that the acceptance check reads MUST make its result `tainted`, which withholds. A group with no resolvable check MUST be `unchecked`, and its delta goes on to the merge check. *Why: Principles III and XIV.*
  - anchor: III; XIV; F116-FR-005; F153-FR-055
  - switch: as F154-FR-034; parity: off
- **F154-FR-036**: A worker whose acceptance check failed MUST be `refused` with the reason of CQ-154-09 (`group-check` is proposed). Its tasks return to the main line's repair path, and one repair MUST be charged to every task of the group: a charge rule of its own under CQ-154-04, with the merge-check rule of F142-FR-061 as its precedent, and the one exception to F143-FR-012 ("a refused worker charges nothing"). No outer counter MUST move. The group counts as failed (F142-FR-023). *Why: a failed check spends what a failed merge check spends, and no outer counter (XX).*
  - anchor: XX; F142-FR-061, -023; F143-FR-012 (amended, see "Cross-spec amendments"); CQ-154-04
  - switch: as F154-FR-034; parity: off
- **F154-FR-037**: The unit of approval and commit MUST stay the phase. No group approval MUST exist. *Why: CQ-153-07 A and CQ-153-03 B.*
  - switch: none (an invariant of G3); parity: off

#### G4 — One validation stream and shared limits (P4)

- **F154-FR-038**: Inside a run, nothing about validation MUST change: the merge checks, the full gate and the critic run one at a time on the merged tree. *Why: Principle XX, one validator.*
  - switch: none (an invariant); parity: unchanged
- **F154-FR-039**: With `host.limits` on, at most `host.checks.concurrent` full executions of a check set (a gate or a merge check) MUST run at once across the runs of one host. The value comes from user configuration, with the default 1 when the switch is on. *Why: concurrent gates on this host failed with ENOSPC (O4).*
  - switch: `host.limits`, default off; parity: off
- **F154-FR-040**: With `host.limits` on, at most `host.sessions.<account>` proposer sessions of one harness account MUST be live at once across the runs of one host, worker sessions included. *Why: the account's limits are shared by every run (Q15, O5).*
  - anchor: F127-FR-033; switch: as F154-FR-039; parity: off
  - switch: `host.limits`, default off; parity: off
- **F154-FR-041**: With `host.limits` on, a run that classifies a `quota_window` (F127-FR-010) MUST write one hold record for its harness account with the reset time. Before starting a pass, every run of the same account on the host MUST read it and wait until the reset. *Why: today only the campaign driver knows the hold (O5).*
  - anchor: F127-FR-010, -013; switch: as F154-FR-039; parity: off
  - switch: `host.limits`, default off; parity: off
- **F154-FR-042**: With `host.limits` on, an exclusive resource declared in user configuration with a capacity MUST be held by at most that many runs of the host at once. *Why: ports and labs are shared (F142-FR-015; P9).*
  - switch: as F154-FR-039; parity: off
- **F154-FR-043**: Every run MUST get a temporary root of its own, used for the temporary directories of its checks, and removed when the run ends, for any cause. *Why: one shared `/tmp` ran out of inodes (O4); Principle VIII's Tier 2 rule, "removed afterwards, even when the pass is killed".*
  - switch: as F154-FR-039; parity: off
- **F154-FR-044**: Slot and hold records MUST be files in user-level state, one record per holder. Each MUST be written by its holder's runtime root only, atomically, with an owner record that names the host, the run and the process, and a liveness proof as the workspace lock has. A record whose owner is proven dead MUST be reclaimable by a contending runtime root. A record whose owner lives MUST never be removed, and one whose liveness is unknown counts as held. No service and no watcher MUST carry the coordination. *Why: Principles I and XVI; the lock interface of F122-FR-010…-016.*
  - anchor: I; XVI; F122-FR-013, -015, -016; F100-FR-032; constraint 6
  - switch: `host.limits`, default off; parity: off
- **F154-FR-045**: A wait for a slot or a hold MUST be a pause: no stop, no budget of any kind spent, no count moved. It MUST be one event when it starts and one when it ends, and MUST be visible in `status`. *Why: Principle XVI, "A pause for quota is not a stop and spends no budget of any kind".*
  - anchor: XVI; F143-FR-015; constraint 7; CQ-154-14
  - switch: `host.limits`, default off; parity: off
- **F154-FR-046**: Project configuration MUST only lower the host bounds, never raise them or turn `host.limits` off. *Why: Principle III, "Project configuration may narrow a run but never widen it".*
  - switch: `host.limits`, default off; parity: off
- **F154-FR-047**: The bounds and the hold MUST be read only through the records of F154-FR-044. No model MUST be asked whether to wait. *Why: F154-FR-005.*
  - switch: `host.limits`, default off; parity: off

#### G5 — Features side by side in the pipeline (P5)

- **F154-FR-048**: Under ruling CQ-154-05, a launch contract MAY declare a stage group wider than one stage: its stages, the stages each depends on, the pairs that never run together with a one-line reason, and the width. A declaration with a cycle, an unknown stage, or a `never_together` across groups MUST be refused at validation. *Why: today's lanes carry this as `width` and `never_together` (O2, O3); F123-FR-019 makes the stage graph serial.*
  - anchor: F123-FR-019; F107; CQ-154-05 (amends F123-FR-019 and F107's `stages`)
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-049**: Each stage of a wide group MUST run in a workspace of its own, made by the pipeline runtime from home before the stage starts and removed after it lands or is parked, as one run with its own lock, process tree and runtime root. The pipeline MUST coordinate the stage runs only through files. *Why: Principle I and "Single run per workspace" (T-e).*
  - anchor: I; F122-FR-010, -011; constraint 9
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-050**: A finished stage MUST land home in the declared order, by a rebase onto home and a fast-forward of home, and by nothing else. *Why: a serial history; no model merges (XX).*
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-051**: Before the fast-forward, the full verification gate of the stage's last phase MUST run on the rebased tree, and home MUST fast-forward only on a pass. *Why: Principle XX, the full gate on the merged tree; today's lanes run none (R-O9).*
  - anchor: XX; constraint 10
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-052**: A rebase conflict, or a red gate on the rebased tree, MUST park that stage alone, with exit 22 for that stage. Home MUST be unchanged and the other stages MUST go on. No model MUST resolve the conflict. *Why: Principle XX; exit codes 20 to 24 are interface.*
  - anchor: XX; Additional Constraints; `exit-codes.json` code 22
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-053**: After a landing, the approval records of the stage MUST stand, bound to their verdicts, and the rewrite of each approval commit MUST be noted (delivered by PR #41). *Why: Principle II binds an approval to its verdict (T-f).*
  - anchor: II; F101-FR-031; ledger R-C16
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-054**: Under ruling CQ-154-06, no critic MUST be called again on the rebased tree. The difference at phase entry stays a fact for the next critic (F149-FR-008). Under answer B, one critic call per landed stage runs after the gate of F154-FR-051, in a fresh session with its own nonce. *Why: Principle II asks for the full gate before the critic, and the gate runs (F154-FR-051).*
  - anchor: II; F149-FR-008; CQ-154-06
  - switch: `pipeline.stageGroups`, default off; parity: off
- **F154-FR-055**: The stage runs of a wide group MUST be subject to the host limits of G4 when `host.limits` is on. *Why: they are runs on one host.*
  - switch: `pipeline.stageGroups`, default off; parity: off

#### G6 — Phases side by side (P6)

- **F154-FR-056**: Under ruling CQ-154-07, the dependencies between phases MUST be read through the canonical model from a declaration of the spec format. A phase with no declared dependency MUST depend on the phase before it. Under answer B the declaration sits in the launch contract instead and is read from there; under C this group is not built and phases stay serial. *Why: Principle IV, one source of spec grammar; Spec Kit states the dependency only in prose (E9).*
  - anchor: IV; CQ-154-07
  - switch: `loop.phases.parallel`, default off; parity: off
- **F154-FR-057**: Two phases MUST be worked at once only when neither depends on the other and their declared write scopes are pairwise disjoint. Each MUST be worked in a tree of its own. *Why: Principle XX (T-g).*
  - anchor: XX; constraint 11
  - switch: `loop.phases.parallel`, default off; parity: off
- **F154-FR-058**: Validation MUST be one queue in phase order. For the phase at its head: rebase its tree onto the last approved phase, run the full gate on it, call a fresh critic with its own nonce, write the approval and the commit. A later phase MUST wait at the queue until every earlier phase is approved. *Why: Principles I, II and XX: one validator, a serial history.*
  - anchor: I; II; XX
  - switch: `loop.phases.parallel`, default off; parity: off
- **F154-FR-059**: A rejected phase MUST be repaired at the head of the queue. A later phase that depends on it MUST be rebased again after its approval. *Why: a serial history.*
  - switch: `loop.phases.parallel`, default off; parity: off
- **F154-FR-060**: Working phases at once MUST spend no outer counter, and each phase's attempt numbers MUST survive a resume or relaunch. *Why: Principles XX and XVI.*
  - switch: `loop.phases.parallel`, default off; parity: off

#### G7 — Work past an open verdict (P7)

- **F154-FR-061**: With `loop.speculate` on, while the gate and the critic judge phase n on the workspace, the next phase MAY be worked only in a worker tree branched from the frozen snapshot of phase n's evidence. The workspace MUST NOT change until the verdict lands. *Why: Principle III, a gate against a changed set is tainted (T-h).*
  - anchor: III; I; F142-FR-062, -064; constraint 12
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-062**: The depth MUST be at most `loop.speculate.depth` units, with the default 1. *Why: a bounded window (E11).*
  - anchor: CQ-154-18
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-063**: On an approval of phase n, the speculative tree MUST be integrated like a group: the audits, composition, the application and the merge check, before phase n+1's own gate. *Why: one integration path (F142-FR-054…-061).*
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-064**: On a rejection of phase n, the speculative tree MUST be discarded. No outer counter and no count MUST move, and its cost MUST be reported. No attempt kind, run state, stop reason or exit code MUST be recorded for the discarded unit (T-j). Discarding a tree MUST NOT be a revert of the workspace. *Why: Principles XX and XVI; F142-FR-061 forbids a revert of the workspace, not a discarded tree.*
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-065**: The grain MUST be the phase. *Why: 153 does not make the group the unit of commit (Q20, CQ-153-07 A).*
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-066**: A speculative unit MUST start only when the approvals per attempt started over the last `loop.speculate.window` attempts of the run are at or above `loop.speculate.minRate`. Under CQ-154-18 the defaults are a window of 20 attempts and a rate of 50 %, with the depth of F154-FR-062 at 1. Below the rate, no speculative unit MUST start, and the reason `rate` MUST be recorded. On every measured run (29 of 336 and 10 of 121) no window reaches the default, so the switch stays off by design until a trial shows otherwise. *Why: the measured rate is about one in twelve (R-M11); prior art speculates only where success is likely (E11, E12).*
  - switch: `loop.speculate`, default off; parity: off
- **F154-FR-067**: Under ruling CQ-154-08, no speculative tree that the critic could read MUST exist when a critic-class call starts. The critic MUST have no tools, or the read denial of the worker root MUST be confirmed for a read-only critic. If the amendment of F142-FR-070 is refused, a speculative unit MUST start only after the critic call has returned. *Why: Principles II and IX; F142-FR-070.*
  - anchor: II; IX; F142-FR-070; CQ-154-08
  - switch: `loop.speculate`, default off; parity: off

#### G8 — The red team's channels

Each requirement closes or narrows a channel that stage 1 marked re-opened or widened. "Narrowed and not closed" is said in the words of `docs/options/parallel-units.md` §4. Under answer A of CQ-154-10 this group is the red-team pass for behaviours 5, 6 and 7, in R29v's form, and the owner records it as their source; under B the MINOR amendment of Principle XX is proposed instead and this group stands as its evidence.

- **F154-FR-068** (V-01): Every kind that reaches a critic-class call MUST stay neutral under every new behaviour. The vocabulary test of F142-FR-066 MUST run over every fixture of this feature. *Why: PU-83.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-069** (V-02, V-09): Phase trees and speculative trees MUST have opaque paths and MUST pass the path-leak audit of F142-FR-056. *Why: PU-82, PU-96.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-070** (V-04): N acceptance checks at once MUST follow F148-FR-011…-017. A speculative unit's checks MUST NOT share a temporary directory, port or exclusive resource with the running gate. *Why: PU-101; re-opened by P7.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-071** (V-05): The landing rebase MUST run under the runtime's git hardening of PU-81: no system or global configuration, no hooks, no filters. *Why: PU-81.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-072** (V-08): Caches, configuration homes, ports and temporary files outside the trees MUST be covered by the temporary root per run and the capacity classes of G4. *Why: PU-85, PU-97.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-073** (V-11): Ticks of a later phase MUST be written only at its approval, and ticks of a set-aside unit MUST never be written. *Why: PU-94.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-074** (V-12): A stop MUST end speculative workers as it ends group workers (F143-FR-026). *Why: PU-90.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-075** (V-13): The sweep before a critic-class call MUST hold under P7, as F154-FR-067 states. *Why: PU-91; re-opened by P7.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-076** (V-15, V-17): The time cap of an attempt and the hard ceilings MUST count every worker of every group of the attempt, and across runs the per-account bound of F154-FR-040. *Why: PU-86, PU-88.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-077** (V-16): A wait for a slot MUST charge no cycle (F154-FR-045). *Why: PU-87.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-078** (V-18): A harness error in any worker of any group MUST switch the layer off for the phase attempt (F142-FR-023). *Why: PU-89.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-079** (V-19): A stop in the middle of a wide stage group, a phase queue or a speculative unit MUST leave each to its own resume states. Nothing lands during a stop. *Why: PU-93, PU-95.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-080** (V-21): The prompt of a speculative unit MUST carry no word of the open verdict. The channel through the proposer's own evidence is narrowed and not closed, as §4 says of the proposer. *Why: PU-103.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged
- **F154-FR-081**: The two channels of `docs/options/parallel-units.md` §4 MUST stay "narrowed and not closed" under every new behaviour, and the option's page MUST say so for groups as units, phases side by side and speculation. *Why: the page's own rule.*
  - switch: every switch of G1 to G7 (an invariant); parity: unchanged

### Key Entities

| Entity | What it is | Schema |
|---|---|---|
| Printed plan (the stored plan) | Per phase the groups, the serial tasks with their reason, and the ceiling; the same bytes from two callers | `specstride.parallel-plan/1` (existing, feature 142) |
| Trial record | One run of a fixture set with one switch changed: the rows read, the pass mark, its result | `specstride.trial/1` |
| Admission decision | One `parallel.admission` event per task, later per group, with the verdict of every check and its detail | the event catalogue of feature 111 |
| Group-as-unit plan record | The stored plan with groups taken from the frozen task groups, each with its write scope and its independence rule id | `specstride.parallel-plan/1`, extended |
| Worker check record | The result of a group's acceptance check in its worker tree, bound to the tree's fingerprint before and after | `specstride.worker-check/1` |
| Owner record | Who holds a slot or a hold: host, run, process, start time, boot id, liveness endpoint | the existing owner record of the lock |
| Slot record | One holder of one host bound (check-set executions, sessions of an account, an exclusive resource), with owner record and liveness | `specstride.host-slot/1` |
| Hold record | One quota hold of one harness account, with the reset time | `specstride.host-hold/1` |
| Stage-group declaration | Stages, dependencies, `never_together` with reasons, width, in the launch contract | part of the F107 contract schema |
| Stage workspace record | One stage run of a wide group: its workspace, its run, its state (`running`, `landed`, `parked`) | `specstride.stage-workspace/1` |
| Landing record | One landing of a stage: the rebase, the gate on the rebased tree, the fast-forward, the approvals rewritten | `specstride.landing/1` |
| Phase-dependency declaration | Per phase, the phases it depends on and its write scope, read through the canonical model | part of the canonical model |
| Validation queue entry | One finished phase waiting for its gate, in phase order | `specstride.phase-queue/1` |
| Set-aside record | One speculative unit discarded after a rejection, with its cost | `specstride.set-aside/1` |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F154-SC-001**: Closed sets hold. Over every fixture of this spec (quickstart.md, FX-154-PLAN, -GROUPS, -SLOTS, -STAGES, -PHASES, -SPEC) and of FX-PAR-S, the sets of exit codes, stop reasons and run states with every switch of this feature on are subsets of the sets with them off.
- **F154-SC-002**: The plan is deterministic. The same inputs give a byte-identical plan and hash on 100 % of repeated derivations, and the doctor and `launch --dry-run` print the same bytes.
- **F154-SC-003**: Completion order is inert. Over a property test of every permutation of worker completion on the group fixtures, 0 bytes of the applied tree differ.
- **F154-SC-004**: The critic is isolated. 0 critic-class calls start while a worker tree, a phase tree or a speculative tree that the critic could read exists, over every fixture.
- **F154-SC-005**: One gate. The full gate executes exactly once per phase attempt, on the merged tree, over every fixture.
- **F154-SC-006**: Every decision is recorded. On FX-154-GROUPS, -SLOTS, -STAGES, -PHASES and -SPEC, every admitted and every refused group, slot, stage and speculative unit has exactly one event with its reason.
- **F154-SC-007**: One validator per host. With `host.checks.concurrent` 1 and two runs on one host, 0 pairs of full check-set executions overlap in the event files.
- **F154-SC-008**: A conflict parks one stage. On the landing-conflict fixture, exactly that stage is parked with exit 22, home is unchanged, and 0 model calls are made for the landing.
- **F154-SC-009**: The report reproduces the measurements. On a frozen copy of feature 153's events, the report prints 336 attempts started, 29 approvals over 29 phases, 274 of 386 in-pass checks failed, 28 groups ended `repair`, and changes 0 files.
- **F154-SC-010**: No group starts again for nothing. On the replay of 153's phase 23, its group `g-23-1` starts at most once while the paths its tasks name are unchanged (against 21 starts on record, R-M16).
- **F154-SC-011**: No empty merge check. Over every fixture, 0 merge checks run after an application of 0 paths (against 22 of 28 in 153, R-M16).
- **F154-SC-012**: Parity is untouched. Under `parity`, no file, event or call of this feature exists, over every fixture of FX-PAR-S and of this spec.
- **F154-SC-013**: No speculation at a low rate. On the fixture with a stub critic that approves 1 attempt in 12, no speculative unit starts at the default threshold.
- **F154-SC-014**: The configuration is unwritten. On the fake-binary test of F154-FR-030 with N = 4, the configuration home's bytes are identical before and after.

## Rows of the `parity` profile

| Switch | Default | Parity | Register row to turn on, and the fields it names |
|---|---|---|---|
| `loop.parallel.units` (142) | off | off | 142's own rows; carries F154-FR-009…-011, -020…-025, -029; fields: the plan lines, the `parallel.admission` event, the `[LOOP]` parallel field |
| `loop.parallel.noRepeat` | on with the layer | off | new row (amends F142-FR-023's scope); fields: the admission reason `repeat`, the merge-check skip |
| `loop.parallel.mergeBaseline` | off | off | new row (amends F142-FR-061); fields: the baseline comparison record |
| `loop.parallel.groupUnits` | off | off | new row, CQ-154-02; fields: the admission reason `dependency`, the group plan record |
| `loop.parallel.groupCheck` | off | off | new row, CQ-154-04; fields: the refusal reason `group-check`, the worker check record |
| `host.limits` | off | off | new row, CQ-154-14; fields: the slot and hold records, the slot-wait events, the pause |
| `pipeline.stageGroups` | off | off | new row, CQ-154-05; fields: the stage-group declaration, the landing record and events, the approval rewrite note |
| `loop.phases.parallel` | off | off | new row, CQ-154-07; fields: the phase-dependency declaration, the queue entry |
| `loop.speculate` | off | off | new row, CQ-154-08 and -18; fields: the set-aside record and event, the skip reason |

The empty-application rule of F154-FR-027 rides `loop.parallel.noRepeat`.

## Closed sets

| Closed set | Change | Ruling |
|---|---|---|
| Exit codes, stop reasons, run states (annex E) | none | — |
| Admission checks of 142 (row 61) | `repeat` (F154-FR-026), `dependency` (F154-FR-032) proposed | CQ-154-09 |
| Refusal reasons of a delta (row 63) | `group-check` (F154-FR-036) proposed | CQ-154-09 |
| Event types | the slot wait start and end (F154-FR-045), the landing (F154-FR-050…-052), the set-aside (F154-FR-064) proposed | CQ-154-09 |
| Integrity kinds that reach the critic (row 65) | none | — |
| Reasons a speculative unit does not start (new set) | `rate` (F154-FR-066), `depth` (F154-FR-062), `sweep` (F154-FR-067) proposed | CQ-154-09 |
| Ledger kinds `parallel` (row 184) | the worker check record, the trial record, the stage workspace, the landing, the set-aside record proposed as kinds | CQ-154-09 |

## Cross-spec amendments

| Spec / requirement | Amendment (proposed text or delta) | Why | Ruling? |
|---|---|---|---|
| F142-FR-017 | "…MAY print, with the option off, the plan the option would produce, labelled as such" | F154-FR-009 | CQ-154-19 |
| F142-FR-023 | Add: a group over a task set that failed in an earlier attempt of the phase is not started again while its paths are unchanged | F154-FR-026 | CQ-154-17 |
| F142-FR-059 | "once per group" becomes "once per group whose application changed at least one path"; and admit the group's acceptance check in the worker tree | F154-FR-027, -034 | CQ-154-17, CQ-154-04 |
| F142-FR-061 | Add the baseline rule of F154-FR-028 | F154-FR-028 | CQ-154-17 |
| F142-FR-070 | "No worker tree **that the critic could read** MUST exist when a critic-class call starts…" (stage 1, T-h) | F154-FR-067 | CQ-154-08 |
| F143-FR-011 | Admit the runtime's run of the group's frozen acceptance check after the worker pass has ended | F154-FR-034 | CQ-154-04 |
| F123-FR-019 | "The stage graph MUST be serial unless the contract declares a stage group under F154-FR-048; each stage of a wide group is a run of its own" | F154-FR-048, -049 | CQ-154-05 |
| F107 (`stages`) | Stage-group fields: `depends_on`, `never_together` with reason, `width` | F154-FR-048 | CQ-154-05 |
| F100 annex B | User-level state gains the slot and hold records | F154-FR-044 | CQ-154-14 |
| F100 annex X §X.6, §X.7 | The closed-set members of "Closed sets"; the switches of "Rows of the `parity` profile" | F154-FR-001 | CQ-154-09 |
| F127-FR-010 | Add: with `host.limits` on, the pause also writes the account's hold record | F154-FR-041 | CQ-154-14 |
| F153-FR-042 | State that the inner path's batching is the follow-up L-4 names, or deliver it (R-Q25) | consistency | CQ-154-16 |
| canonical model (F100 / spec-format adapter) | A per-phase dependency and write-scope declaration | F154-FR-056 | CQ-154-07 |

| F143-FR-012 | Add the one exception: a worker refused with `group-check` charges one repair to every task of its group | F154-FR-036 | CQ-154-04 |
| F100 annex D (events) | The slot-wait pair, the landing events and the set-aside event of "Closed sets" | F154-FR-045, -050…-052, -064 | CQ-154-09 |
| F100 annex E (§E.1–§E.4) | None: no attempt kind, stop reason, exit code or run state | F154-FR-002 | — |

No change to F101, F105, F116, F122, F148 or F149 is proposed. F154-FR-044 reuses F122's liveness rules without amending them.

## Clarifications

### Session 2026-11-25 (ruling requests)

`CQ-154-01` was not raised: stage 1 found the constitution baseline right (v3.0.3, the newest engine copy).

The rows marked *Answered (autonomous, 2026-11-25)* were resolved by research-backed recommendation, as the owner asked, so that no ruling waits on a person. Each keeps its alternative in the requirement text as the branch under the other answer, and the owner may overturn any of them.

| Id | Question | Options | Recommended | Status | Anchors |
|---|---|---|---|---|---|
| CQ-154-11 | One spec, or in-run and cross-run work split in two? | A: one spec. B: split | — | Answered (owner, 2026-11-15): A | feature input, "Scope decided by the owner" |
| CQ-154-20 | The spec number | 154, the next free one across the repositories read | — | Answered (owner, 2026-11-25, relayed by another session): 154 | feature input README |
| CQ-154-12 | Are behaviours 6 and 7 in scope? | A: in, built last, off until measured. B: out | — | Answered (owner, 2026-11-15): A | same |
| CQ-154-02 | The parallel unit, and the source of "independent" between two groups | A: the `[P]` task of 142 only. B: 153's task group only. C: both, behind separate switches. For independence: (i) every task of both groups carries `[P]`, and no task of the later group names a path in the earlier group's scope; (ii) a declared `depends_on` in the contract; (iii) both, with the declaration overriding | C with (iii). Under A, G3 is not built. Under B, G2's `[P]` groups stay as they are. Under (i) alone, no declaration is read | Answered (autonomous, 2026-11-25): C with (iii) | XX; T-a; R-Q23; slicer.ts:132-154; layer-parallel scope.ts:168-178, :285-295; F142-FR-009 |
| CQ-154-03 | What makes an adapter "tested" for `concurrentSessions`, and may N sessions share one Tier 1 configuration? | A: the fake-binary test plus a recorded live check plus a pin (F154-FR-030). B: Tier 2 only | A. Under B, no Tier 1 group runs | Answered (autonomous, 2026-11-25): A | VIII; T-c; adapter-dsh descriptor/index.ts:267-276 (status verified, CT-130-46); adapter-claude detect.ts:373-405 (null until capture B); F125-FR-019 |
| CQ-154-04 | A check inside a worker tree (amends F142-FR-059, F143-FR-011) | A: the group's acceptance check only, after the pass. B: the inner set. C: none | A. Under C, F154-FR-034 is not built and the check stays on the workspace | Answered (autonomous, 2026-11-25): A | II; III; T-b; F142-FR-059 :327; F143-FR-011 :203; micro-layer.ts:552-575 (cwd and 300 s) |
| CQ-154-05 | Stage groups wider than one stage (amends F123-FR-019, F107) | A: yes, as F154-FR-048…-049. B: no | A. Under B, G5 is not built and the lanes stay outside the product | Answered (autonomous, 2026-11-25): A | I; T-e; pipeline executor/graph.ts:19-27 (serial by design); stage.schema.json:20 (`depends_on` exists per stage); lanes.py:117-171 (no gate) |
| CQ-154-06 | After a landing, does a critic judge the rebased tree again? | A: no, the gate runs. B: yes, one critic call per landed stage | A. Under B, F154-FR-054 becomes a critic call after F154-FR-051 | Answered (autonomous, 2026-11-25): A | II; XX; T-f; constitution II L162-173; XX L443-445; commit 6198dc3d; F149-FR-008 |
| CQ-154-07 | The source of phase dependencies | A: a declaration in the spec format, read by the adapter. B: a declaration in the launch contract. C: none, phases stay serial | A. Under C, G6 is not built | Answered (autonomous, 2026-11-25): A, corrected: a new per-phase dependency and write-scope field of the canonical model and of its spec-format adapter; a phase with none depends on the one before it | IV; T-g; canonical-spec-model.ts:49-63 (no dependency field); F107-FR-005; ledger R-E9 |
| CQ-154-08 | Work past an open verdict against F142-FR-070 | A: amend F142-FR-070 as in T-h. B: no amendment; speculation starts after the critic call | A. Under B, F154-FR-067's fallback applies | Answered (autonomous, 2026-11-25): A | II; IX; T-h; F142-FR-070 :364; F142-FR-062 :337; constitution IX L313-318 |
| CQ-154-09 | New closed-set members (`repeat`, `dependency`, `group-check`, the slot-wait, landing and set-aside events) | A: add them, versioned. B: map onto existing members | A; no exit code and no stop reason either way | Answered (autonomous, 2026-11-25): A: add, versioned; no exit code and no stop reason | XX; T-j; closed-sets.json sets "Admission checks of a parallel group", "Refusal reasons of a delta", "`parallel.*` event types" |
| CQ-154-10 | Do behaviours 5–7 fall under "The rules for several workers come from R29 and its red team"? | A: no amendment; this feature carries its own red-team pass (G8). B: a MINOR amendment of XX | A | Answered (autonomous, 2026-11-25): A | XX; T-l; constitution XX L447; R29v L1-16; spec 142 :65 (roadmap) |
| CQ-154-13 | Several groups in one attempt: all in plan order or a bound; what a failed group does to the later ones | A: all, in plan order; after 2 failed groups the layer is off for the attempt (F142-FR-023). B: a bound of N groups | A | Answered (autonomous, 2026-11-25): A | F142-FR-008, -023; F142-FR-023 :293; decide.ts:1775; run-feature.ts:4692 |
| CQ-154-14 | Shared limits: files in user-level state, defaults when on (check sets 1; sessions per account unset), reclaim by a contender, a wait is a pause | A: as F154-FR-039…-047. B: a host service | A; B breaks Principle I | Answered (autonomous, 2026-11-25): A | I; XVI; T-d; layout.json:8, :20-26; F122-FR-013 to -016; constitution I L130-147 |
| CQ-154-15 | What turns each switch on | A: the trial of F154-FR-018, read by the owner, recorded in the register row | A | Answered (autonomous, 2026-11-25): A; deliberately stricter than register rows 134 and 137, which shipped default on | XVIII; P10; parity-profile.json rows 134, 137; F153-FR-054; spec 153 amendments.md:82, :95 |
| CQ-154-16 | In-pass check batching (the follow-up 153 handed to 115; R-Q25) | A: out; F153-FR-042 is read as the gate path. B: in | A: no measurement shows a gain (L-4) | Answered (autonomous, 2026-11-25): A | F153-FR-042; L-4; F153-FR-042 :581; spec 153 L-4 :807; ledger R-C14, R-C18, R-Q25 |
| CQ-154-17 | The three rules from the live record (no repeat, no empty merge check, merge baseline) | A: all three. B: no repeat and no empty merge check only | A | Answered (autonomous, 2026-11-25): A | R-M16; F142-FR-023, -059, -061; run-feature.ts:2914; core merge-check.ts:283; ledger R-M16 |
| CQ-154-18 | Speculation: depth, window and threshold | A: depth 1; window 20 attempts; threshold 50 % | A; at 8.6 % it never starts | Answered (autonomous, 2026-11-25): A: depth 1, window 20 attempts, 50 %. At 29 of 336 and 10 of 121 no window of 20 reaches 50 %, so behaviour 7 stays off on every measured run, by design, until a trial shows otherwise | R-M11; E11; ledger R-M11, R-M8; E11 |
| CQ-154-19 | Print the plan with the option off? | A: yes, labelled. B: only with the option on (F142-FR-017 as written) | A: it is read-only, and the option's page asks the operator to read it before switching on | Answered (autonomous, 2026-11-25): A | XV; R-C7; F142-FR-017 :105; docs/options/parallel-units.md:36, :108; constitution XV L406-407 |
## Constraints carried from stage 1

| # | Constraint | Where |
|---|---|---|
| 1 | Groups at once only on disjoint scopes and declared independence | F154-FR-032 |
| 2 | Every group in plan order; no restart of a failed group over unchanged paths | F154-FR-020, -026 |
| 3 | The frozen check, run by the runtime in the worker tree; withholds only; tainted; unchecked | F154-FR-034, -035 |
| 4 | Merge-check baseline; no merge check on an empty application; ticked groups not started | F154-FR-027, -028; F142-FR-018 |
| 5 | Worker door only with the configuration proof | F154-FR-029, -030 |
| 6 | Slot files in user-level state, single writer, liveness, reclaim | F154-FR-044 |
| 7 | A wait is a pause | F154-FR-045 |
| 8 | Project configuration only lowers | F154-FR-046 |
| 9 | One run per stage workspace; coordination through files | F154-FR-049 |
| 10 | Full gate on the rebased tree; park on conflict, exit 22 | F154-FR-051, -052 |
| 11 | Phases on declared graph and disjoint scopes; one queue | F154-FR-056…-058 |
| 12 | Speculation only in a tree from the frozen snapshot the critic cannot read | F154-FR-061, -064, -067 |
| 13 | Speculation only against a measured rate | F154-FR-066 |
| 14 | The printed plan is pure and terse | F154-FR-010 |
| 15 | No exit code, no stop reason | F154-FR-002 |
| 16 | Every behaviour off under `parity` | F154-FR-001 |
| 17 | Schemas and pure tables | F154-FR-003, -007 |
| 18 | Degrade to serial | F154-FR-004 |

## Assumptions

- Code anchors on `main` @ `d1e8587f`:
  - `packages/cli/src/engine/parallel-wiring.ts` `theGroupOfThePhase` :100-102 (`groups[0]`);
  - `packages/cli/src/engine/run-feature.ts` :2914 (the merge check's inner set `["check"]`), :4692 (`failedGroupsBefore: 0`);
  - `packages/core/src/parallel/merge-check.ts` :283;
  - `packages/layer-parallel/src/decide.ts` :1775;
  - `packages/layer-parallel/src/plan.ts` `printThePlan` :543;
  - `packages/core/src/spec-groups/slicer.ts` :121;
  - `packages/runtime/src/lock/directory-lock.ts`.
- 153's live groups ran with `loop.parallel.units: true` and `loop.parallel.allow_detect: true` on the dsh path (archived campaign prompt of 2026-11-18).
- Default values marked "when on" are starting values with low confidence, set by ruling.
- The report's shares are bounds wherever the gate is bounded, until every attempt carries timed gate and critic events.
