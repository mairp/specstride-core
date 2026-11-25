# Constitution grounding: 154-concurrency-and-parallelism

**Stage**: 1 of 3 (`prompts/154-concurrency-and-parallelism/1-constitution.md`). This is a check
only: no constitution is amended.
**Date**: 2026-11-25
**Feature input**: `prompts/154-concurrency-and-parallelism/feature-input.md`, re-grounded on
2026-11-25 on `main` @ `a4d2df3c`. Its ledger is `grounding-ledger.md`, rows K, Q, C, M, P, O, E
and R-rows. This file is checked against `main` @ `d1e8587f`, which also holds PR #40 (the report
reads the engine's records) and PR #41 (an approval survives a rebase that kept its change).
"Behaviour n" below means required behaviour n (1–7, with 1a–1c) of that input.

## Constitution checked

- **Checked against**: `/root/specstride-dsh/.specify/memory/constitution.md`, **v3.0.3**,
  ratified 2026-07-27, last amended 2026-11-08 (line 522). It is the newest engine copy. The
  claude copy is 3.0.2 (2026-09-30). The hermes copy is 3.2.0 (2026-11-11) and carries Principles
  I–XX verbatim from dsh 3.0.3 plus its Host Annex H, which binds only that repository (ledger
  R-K9).
- **Baseline of this repository's specs**: specs 142, 143 and 148 to 153 were planned against the
  same v3.0.3 (or 3.0.2, with the licence row as the only delta).

| Change | What changed | Touches spec 154? |
|---|---|---|
| 3.0.2 → 3.0.3 (2026-11-08, PATCH) | The licence: Additional Constraints, Licence row, MIT → Apache-2.0; Principle VI's dependency-licence bullet. "no principle is added, removed or redefined" | No |
| hermes 3.1.1 (2026-11-08, PATCH) | Annex H rules H2 and H8, wording; "no rule is added, removed or redefined" | No (host annex) |
| hermes 3.2.0 (2026-11-11, MINOR) | Annex H rules H2 and H6 expanded; "nothing outside the annex changes" | No (host annex) |

No `CQ-154-01` is raised on the baseline.

Three structural facts this check rests on:

- **Principle XX** ("Deterministic Parallelism", L436-447) is **not** marked NON-NEGOTIABLE. Its
  "adds no exit code and no stop reason" is repeated in a binding row of Additional Constraints
  (L488), and changing it would be MAJOR (Governance L520: "MAJOR for removing or redefining a
  principle").
- **NON-NEGOTIABLE** principles are I, II, III, VI, VII, VIII, IX, XII and XVIII (headings, L128
  to L451). "Principles II, III and XVIII cannot be justified away" (L515).
- Governance gives a path only for deviations from NON-NEGOTIABLE principles (Complexity
  Tracking). It does not say how a deviation from a plain principle is recorded. This check
  therefore treats a plain principle the same way: a deviation is designed out, or raised.

## Principle-by-principle check

Verdicts: **applies** (a MUST for spec 154) · **n/a** (read, and nothing binds it) · **tension**
(see "Tensions"). NN = NON-NEGOTIABLE. II, III and XVIII cannot be justified away: a tension on
them is resolved by design or raised as an amendment, never recorded as a deviation.

| Principle | What it requires of spec 154 (constitution fragment) | Behaviours bound | Tension / conflict | Ruling needed? |
|---|---|---|---|---|
| I. Durable state on disk, no watcher in the control path (NN) | "All progress of a run is coordinated through durable files on disk. No inotify watcher, message queue or service that a run depends on may carry control flow." "A gate is handed an evidence path only after the pass that produced it has exited." "A run has one detached process tree, rooted at one runtime process… The tree serves no other process." "State that the runtime relies on to decide something is kept outside the working tree." Slots, holds, queues and set-aside records are files written atomically. No coordinator service exists | 2, 3, 4, 5, 6, 7 | **T-d**, **T-e**, **T-g**, **T-h** | Yes (via T-e) |
| II. Adversarial, non-self-approving gate (NN) | "The phase gate with the independent critic is the **only** source of a verdict. An inner check… never approves anything, and the full verification gate always runs again before the critic." "The critic sees the final check result for each unit of work. It does not see the history of repairs, retries and escalations." "An approval is a record written by the runtime, bound to the verdict that produced it… Resume verifies the record." A group's check, a slot, a queue position and speculative work never approve | 3, 5, 6, 7 | **T-b**, **T-f**, **T-g**, **T-h** | Yes (via T-f, T-h) |
| III. Grounded, read-only, injection-proof verification (NN) | "Inner checks are deterministic commands, fixed before work starts, and run by the runtime, never by the proposer's own harness… a check run against a changed set is recorded as tainted and never as passed." "Project configuration may narrow a run but never widen it." A group check runs on a set no worker can change, and a gate never runs on a tree that changes under it | 3, 4, 7 | **T-b**, **T-h** | No (by design) |
| IV. Single source of truth for spec grammar | "All spec grammar lives behind one canonical model and one adapter registry… slicing… A new spec format is a new adapter, never a second parser." Phase dependencies (6) and group independence (3) are read through the canonical model, never by a private parser of `tasks.md` | 3, 6 | none | No |
| V. Best-effort observability that never breaks the loop | "A bad line, a full disk, a dead collector or a missing component must never stall or fail a run." "Telemetry describes a run; it is never the workflow's event bus." The report rows and the printed plan are observers; a slot or hold file is control state, not telemetry | 1, 4 | none | No |
| VI. Typed core, replaceable edges, installable with npm (NN) | "Data is validated against a schema at every process, file, network and provider boundary." "The core depends on no provider SDK, no UI framework and no host API." Every new record (slot, hold, queue entry, stage-group declaration, set-aside record) has a schema. Decisions live in core and the layer, and the composition root only wires | all | none | No |
| VII. One open harness registry (NN) | "No requirement, check or control path may assume a closed list of harnesses." "Shared control flow never tests a harness name." `concurrentSessions` and capacity classes are read from adapters and descriptors through the registry | 2, 4 | **T-c** | No (by design) |
| VIII. Unattended, hermetic proposer passes (NN) | "**The operator's configuration is never mutated.** At Tier 1 a pass uses the harness's own logged-in configuration, read-only, because a throwaway home has no login." "Credentials are never copied between homes." "**Fresh session per attempt.**" "**Contained by default.**" N sessions on one Tier 1 configuration must leave it unwritten | 2, 4, 7 | **T-c** | Yes (CQ-154-03) |
| IX. The critic has no tools and a known budget (NN) | "**No tools, by any route.**" The read-only exception: "the runtime moves the proposer's notebook, handoff and outbox out of the working tree and the sandbox denies reads of the workspace part, so the history of repairs stays withheld." Worker trees and speculative trees are withheld from the critic | 3, 6, 7 | **T-h** | Yes (via T-h) |
| X. Recorded harness versions | "Every tested adapter pins a version range with a `verified-on` date." "Each pass records the harness version it ran." The second worker door needs its own pin, and each concurrent session records its version | 2 | **T-c** | No |
| XI. Truthful stream telemetry | "Unknown values are `null`, never invented." Report rows built from partial timed events say "not in the events", never an imputed value (the report already does) | 1 | none | No |
| XII. Verifiable here, lawful everywhere (NN) | "No test and no CI job calls a paid or external model API." "A capability that needs something that cannot be verified is recorded as deferred or unverified with the missing prerequisite named." The cross-account limit and N real sessions are verified by fakes, or marked deferred | 2, 4 | **T-c** | No |
| XIII. Facts and judgment are separated | "A routing or classification decision is made by a pure table and recorded with its rule id." Admission of a group, a slot, a stage of a wide group, a phase and a speculative unit are pure tables with rule ids | 2–7 | none | No |
| XIV. Declared verification is preserved, never invented | "Verification commands come only from an existing verification declaration or from commands literally declared in the plan or tasks." "A unit of work with no resolvable check is recorded as unchecked, never as rejected and never as passed." A group's acceptance check comes from the frozen record, never invented per worker | 3 | **T-b** | No |
| XV. Invocation is consent; dry-run withholds it | "`dry-run`… derives and validates, reports what would be launched, and stops." "No comment, mode or setting bypasses a launch check, the terms gate or a budget." The printed plan is pure: no slot is taken, no record is written | 1, 4 | **T-i** | No |
| XVI. The supervisor only reads | "Supervision in the host only reads." "Nothing removes a lock whose owner lives, and nothing deletes a run directory." "A pause for quota is not a stop and spends no budget of any kind." "Counts and attempt numbers survive a resume or relaunch unless the consumer resets them on purpose." A wait for a slot is a pause; set-aside work moves no count | 4, 5, 7 | **T-d**, **T-h** | No (by design) |
| XVII. Missing prerequisites are skips, never passes | "A missing prerequisite is reported as a skip with its reason, never as a pass." A group check whose prerequisite is absent in the worker tree is a skip, and the group is not kept on it | 3 | none | No |
| XX. Deterministic parallelism | "Work runs in parallel only after deterministic checks of dependency and of write scopes. A claim that two units can run together is a claim… Every decision to run in parallel is recorded with its reason. After every parallel group an integration step and a deterministic merge check run on the merged tree, and the full verification gate runs on it before the critic sees anything. No model merges conflicting work silently. Parallel work never produces a verdict, never spends an outer counter, and adds no exit code and no stop reason. The rules for several workers come from R29 and its red team." This is the charter | all | **T-a**, **T-f**, **T-g**, **T-h**, **T-j**, **T-l** | Yes (via T-a, T-l) |
| XVIII. Parity before capability (NN) | "An intended difference is a row in the divergence register with the owner's ruling. It is never discovered as a test failure." "A second suite runs every fixture with the layer on and stub agents that never complete a unit of work; its output is identical apart from fields the register names." Every switch of 154 is off under `parity` | all | **T-k** | Yes (register rows) |
| XIX. Context is budgeted | "Command output is terse by default; verbose output is opt-in." "The host model never needs to read product source to operate Specstride." The plan printout, the new report rows and slot status are terse by default | 1, 4 | **T-i** | No |
| Additional Constraints | "Single run per workspace: One run per workspace… exactly one winner among contenders, a lock never exists without an owner record, a dead owner is reclaimable and a foreign owner is not." "Micro-loops and parallel units add no exit code and no stop reason." "Stop reasons: A closed, versioned enumeration." "Exit codes 20 to 24 of the pipeline runtime are part of the interface." State: "One layout with three roots… user-level state, a control plane per workspace outside the working tree, and a workspace part." "Project configuration narrows only" | 4, 5, 6, 7 | **T-d**, **T-e**, **T-j** | Yes (via T-j) |
| Development Workflow | "Every code path degrades instead of failing." "Tests are required for every feature. Parity tests and characterization tests are required tasks." A broken slot store degrades to serial with a recorded reason. It never stops the run | all | none | No |
| Governance | "A feature plan's Constitution Check is evaluated against every principle." "A deviation from a non-negotiable principle is recorded in the plan's Complexity Tracking table with its justification, or the plan is rejected." "Amendments are made by the owner." Versioning: MAJOR, MINOR, PATCH | all | **T-l** | Yes (CQ-154-10) |

## Tensions

**T-a. Several groups of one phase at once, and the task group as the parallel unit (XX, I;
behaviours 2, 3).**
XX admits parallel work "only after deterministic checks of dependency and of write scopes".
- **Write scopes:** the parallel layer of 142 checks them, and a 153 task group carries a write
  scope derived from task text, never from the proposer (ledger R-C19).
- **Dependency:** nothing does. 153's slicer cuts in task order with no relation to `[P]`,
  nothing declares two groups independent, and `scopesAreDisjoint` has no caller on groups
  (R-Q23, R-Q21). The `[P]` marker is "a claim" in XX's own words. Disjoint write scopes are
  necessary, but they don't show that group B doesn't read what group A writes.

**Verdict: resolved by design, given a MUST, and the source needs an owner ruling (CQ-154-02).**
Two groups of one phase run at once only if a deterministic, recorded rule finds both of these:
1. Their write scopes are pairwise disjoint.
2. "No dependency" holds by a source the spec names. The options for the ruling:
   - every task of both groups carries `[P]`, and no task of the later group names a path in
     the earlier group's write scope;
   - a machine-declared `depends_on` between groups;
   - both.

Without the rule's positive answer the groups run one after the other, with the reason
recorded. "Every admissible group of a phase in plan order" (behaviour 2) is the same rule
applied to the `[P]` groups of 142, which already satisfy it at one group at a time. Running a
later group at a clean boundary keeps F142-FR-018. Anchor: XX; I; F142-FR-007…-011; F153-FR-054;
ledger R-C3, R-C19, R-Q23.

**T-b. A group's acceptance check in a worker tree (III, II, XIV, XX; behaviour 3).**
- **What it is:** an inner check in II's sense. It can only withhold an integration, so it
  "never approves anything" by construction. It must not release one either: an integrated
  group still goes through the merge check, the full gate and the critic.
- **III, "fixed before work starts":** the check is frozen into the launch contract at
  derivation (R-C19), and the runtime runs it, never the worker's harness.
- **III, taint:** a worker could change the tests the check relies on. That change is detected,
  and the result is recorded as tainted, which withholds.
- **Where it runs today:** in `process.cwd()`, the workspace, with a fixed 300 s limit (R-C19).
  It must move to the worker tree with the declared limit.
- **XIV:** a group with no resolvable check is `unchecked`: it is neither kept nor charged as a
  rejection, and it falls back to the merge check of F142-FR-059.
- **What a failure spends:** what a failed merge check spends today, one repair per task of the
  unit (F142-FR-061), and no outer counter (XX).

**Verdict: resolved by design.**

The live record adds a constraint on the merge check that follows. In feature 153 every one of 28
groups was sent to repair because the merge check runs the phase's whole inner set, which was red
for reasons outside the group (R-M16). XX requires "a deterministic merge check… on the merged
tree". It doesn't require that a suite which was red before the group be charged to the group. A
comparison with a baseline taken on the same tree before the group is still deterministic and
recorded, so it is inside XX. It never touches the gate, which stays full (II, CQ-153-08 A).
Anchor: II L162-164; III L186-189; XIV; XVII; F142-FR-059, -061; ledger R-M16.

**T-c. A second worker door, with N sessions on one logged-in configuration (VIII, VII, X, XII;
behaviour 2).**
- VIII: "The operator's configuration is never mutated. At Tier 1 a pass uses the harness's own
  logged-in configuration, read-only, because a throwaway home has no login."
- N concurrent sessions of one CLI on one home can write it: token refresh, session files, a
  lock in the home. "Credentials are never copied between homes" rules out per-session copies
  at Tier 1. Tier 2 throwaway homes have no login, so they need credentials of their own.

**Verdict: resolved by design, given a MUST; the proof is an owner ruling (CQ-154-03).** An
adapter declares `concurrentSessions` only when all of these hold:
- A test against a fake binary (XII), plus a recorded live check, shows that N sessions leave
  the configuration byte-identical.
- The adapter pins its version with `verified-on` (X).
- The capability is read through the registry, never by name (VII).

Otherwise F142-FR-020 keeps refusing the group, and the reason is recorded. No deviation is
recorded on VIII. Anchor: VIII L280-283; VII L260, L265-266; X; F142-FR-020; ledger C4.

**T-d. Limits shared by several runs on one host and one account (I, XVI, V, Additional
Constraints; behaviour 4).**
- **Where the files live:** files that more than one workspace reads can't live in any one
  run's tree or control plane. The three-root layout has one place for them, **user-level
  state**.
- **I:** coordination through such files is allowed (I's "files on disk"). A slot service or
  daemon is not. "Processes outside the runtime tree write requests to an inbox and nothing
  else" binds writes into another run's state. A slot file belongs to no run. Each run's runtime
  root is the single writer of its own slot record, created by an atomic rename with an owner
  record, as the lock does.
- **Reclaim, XVI:** "Nothing removes a lock whose owner lives". The supervisor only reads, so a
  dead owner's slot is reclaimed by a contending runtime root through the same liveness proof as
  the workspace lock ("a dead owner is reclaimable and a foreign owner is not").
- **Waiting, XVI:** a wait for a slot is a pause. It "spends no budget of any kind", and counts
  survive.
- **Precedence:** host-wide bounds come from user configuration. Project configuration may only
  lower them.

**Verdict: resolved by design.** Anchor: I L130-147; XVI L417-422; Additional Constraints L487,
L490, L491; F122-FR-010, -011; F127-FR-010, -013; ledger O2–O5.

**T-e. A stage group wider than one stage, each stage in its own workspace (Additional
Constraints "Single run per workspace", I, XVI, exit codes 20 to 24; behaviour 5).**
- **One run or three?** "A run has one detached process tree, rooted at one runtime process."
  A pipeline with three stages at once is either one run with three engines, which breaks I's
  one-tree rule, or three runs, one per workspace, each with its own lock, tree and runtime
  root. The second reading keeps every rule: "One run per workspace" holds per workspace, and
  each engine stays the child of its own root.
- **Who coordinates:** the pipeline runtime coordinates the runs only through files (I: "The
  host skill and the detached runtime coordinate only through files").
- **The serial rule:** F123-FR-019 ("one stage at a time") is a requirement, not a principle,
  and amending it is a spec ruling.
- **Exit codes:** a parked stage maps onto the existing code 22, "A stage failed". A wait for
  width is a pause, not an exit. No code is added.

**Verdict: resolved by design (three runs; no new exit code), and the amendment of F123-FR-019
needs an owner ruling (CQ-154-05).** Anchor: I L138-141; Additional Constraints L490, L494;
`packages/contracts/data/exit-codes.json` codes 20–24; F123-FR-019; ledger Q13, C11.

**T-f. Landing a finished stage by a rebase and a fast-forward (II, XX; behaviour 5).**
- **What II binds:** an approval is "bound to the verdict that produced it", and "Resume
  verifies the record". The binding to a commit is the engine's own extra check, not II's.
  PR #41 keeps that check and accepts a commit with the same change after a rebase. Every other
  case still fails closed, and the tree comparison at phase entry stays a non-blocking fact for
  the critic (F149-FR-008).
- **What a rebase adds:** the rebased tree is one "the critic never saw". XX: "After every
  parallel group an integration step and a deterministic merge check run on the merged tree,
  and the full verification gate runs on it before the critic sees anything." Stages side by
  side are parallel work, so the rebase is their integration step.
- **Today's lanes:** they run no gate on the rebased tree (R-O9).

**Verdict: resolved by design, given a MUST, plus one owner ruling (CQ-154-06).**
1. Before the fast-forward, the full gate runs on the rebased tree. A red gate, or a conflict,
   parks that stage only (exit 22 for that stage). No model resolves a conflict.
2. The stage's approval records stay bound to their verdicts (II), and the landing writes the
   patch-id rewrite note of PR #41.
3. The ruling: does a critic judge the rebased tree again? The recommendation is no. II asks for
   the gate before the critic, and the phase-entry mismatch is already a fact for the next
   critic. The alternative is a critic call per landed stage.

Anchor: II L171-173; XX L443-445; PR #41; F149-FR-008; ledger R-C16, R-O9.

**T-g. Phases side by side with one ordered validation queue (I, II, XX; behaviour 6).**
- **I:** the gate reads the evidence of the phase at the head of the queue, and only after the
  pass that produced it has exited. Each phase in its own tree satisfies that.
- **II:** each verdict is bound to its own nonce and its own fresh critic session, so a queue
  never matches a verdict to the wrong phase.
- **XX:** two phases run together only on declared, disjoint write scopes and a declared "no
  dependency". Each phase lands in phase order, rebased onto the last approved phase, with the
  full gate on that tree before its critic.

**Verdict: resolved by design, given those MUSTs. The source of phase dependencies needs an owner
ruling (CQ-154-07).** Spec Kit states the dependency only in prose (ledger E9), and IV forbids a
private parser, so the source is a canonical-model field or a contract declaration. Anchor: I
L135; II L159-166; IV; XX L441-445.

**T-h. Work past an open verdict (I, II, III, IX, XVI, XX; behaviour 7).**
- **III:** the gate runs "on the workspace after the proposer loop has ended" (F142-FR-062). A
  gate over a tree that the next unit is changing is a check "against a changed set", so
  tainted.
- **The one design that fits:** the next unit works in a worker tree branched from the frozen
  snapshot, and the workspace doesn't change. The gate then runs on the workspace, which is
  the snapshot, after the pass has exited (I). On approval the unit integrates like a group:
  merge check, full gate, its own critic. On rejection it is set aside.
- **Setting it aside:** that is discarding a worker tree, not reverting the workspace, so
  F142-FR-061's "Nothing MUST be reverted" isn't touched. It spends no outer counter (XX),
  counts survive (XVI), and its tokens are reported as a cost (behaviour 1b).
- **IX:** the critic must not see the later work, which is withheld like a worker tree.
- **Collision:** **F142-FR-070** ("No worker tree MUST exist when a critic-class call starts")
  forbids exactly this shape, a worker alive while the critic judges.

**Verdict: needs an amendment of F142-FR-070 (a spec, not the constitution) → CQ-154-08.** The
proposed wording: "No worker tree **that the critic could read** MUST exist when a critic-class
call starts. A speculative tree branched from the frozen snapshot may exist if the critic has no
tools, or the read denial of the worker root is confirmed for a read-only critic." If the
amendment is refused, the work starts only after the critic call has returned, which takes it
back to today's order, and behaviour 7 is limited to the gate's share of the time.
- **The grain:** phase grain, because the group is not the unit of commit (Q20).
- **The switch:** behaviour 7 stays off at the measured approval rate of about one in twelve
  (ledger R-M11).

Anchor: I L135; II L162-168; III L186-189; IX L313-318; XVI L421-422; XX L445-446; F142-FR-062,
-064, -070.

**T-i. The printed plan, the new report rows and the trial (V, XI, XIII, XV, XIX; behaviour 1).**
- **XV:** `launch --dry-run` "derives and validates, reports what would be launched, and stops".
  The plan is a pure function: it takes no slot, writes no record and starts no worker.
- **XIX:** it is terse by default, with the table of tasks left serial behind a verbose flag.
- **XI:** a report row whose events are missing prints "not in the events" and never imputes a
  value.
- **XIII:** the trial's pass or fail is a table with a rule id, never a model's judgment.

**Verdict: no conflict.** Behaviour 1b's reader fix shipped in PR #40. Anchor: V; XI L344; XIII
L386-387; XV L406-407; XIX L474.

**T-j. Closed sets (XX, Additional Constraints; behaviours 3–7).** Where each new end state maps:

| End state | Maps to | Anchor |
|---|---|---|
| A refused group | F142's refusal reasons (`overlap`, `path-leak`, …). A new reason, such as `dependency` for T-a, is a closed-set change | F143-FR-012; owner ruling |
| A wait for a slot | No stop reason: it is a pause, as a quota pause is | XVI L421 |
| A parked stage | Pipeline exit code 22 | `exit-codes.json` |
| A set-aside speculative unit | No attempt kind: the attempt that produced the approved unit is the attempt. §E.1 has no row for it, and none is added | annex E §E.1; F153's Complexity Tracking precedent |

**Verdict: needs an owner ruling (CQ-154-09) for any new member of a refusal or admission set
that T-a or T-d need.** No exit code and no stop reason is added. Changing XX's sentence would
be MAJOR and is not proposed. Anchor: XX L446; Additional Constraints L488-489, L494.

**T-k. Every switch under `parity` (XVIII; all behaviours).**
- **Off under `parity`:** every new switch (groups at once; group checks in worker trees; a
  second worker door; shared limits; wide stage groups; phases side by side; work past an
  open verdict).
- **On:** only by a divergence-register row with the owner's ruling.
- **The second suite:** "with the layer on and stub agents that never complete a unit of work"
  must stay identical apart from fields the register names. So every new field must be named in
  the register: report rows, plan lines, slot records, `approval-rebased`.
- **Behaviour 2:** its lines are deliveries of 142's own requirements behind 142's switch
  `loop.parallel.units`. They need no new row (see "Profiles"). One exception: feeding the real
  failed-group count into the switch-off rule changes what `parity` sees only when the layer is
  on.

**Verdict: resolved by design.** Anchor: XVIII L455-464.

**T-l. "The rules for several workers come from R29 and its red team" (XX; behaviours 5–7).**
R29 and R29v cover `[P]` units inside one phase of one run.
- **Inside the sentence:** behaviour 3 (groups as units) and the in-run parts of 2.
- **Outside it:** behaviours 5 (stages in separate workspaces), 6 (phases side by side) and 7
  (work past an open verdict). Their rules have no source the principle names.

**Verdict: needs an owner ruling (CQ-154-10).** Two options:
- **(A) No amendment.** Spec 154 carries a red-team pass of its own for behaviours 5–7, in
  R29v's form, and the owner records it as the source.
- **(B) A MINOR amendment.** Add to XX: "Rules for parallel work across phases, runs or
  workspaces come from the red team of the feature that introduces them, recorded by the
  owner."

The recommendation is A. It needs no constitution change, and XX's first sentences already bind
behaviours 5–7 as principle. Anchor: XX L447; Governance L518, L520.

## Profiles

| Behaviour | `parity` keeps | Turned on by |
|---|---|---|
| 1a printed plan | No plan line in `parity` output | Register row naming the plan lines (read-only output) |
| 1b report rows | Shipped in PR #40. The report is a read verb outside run output, so `parity` runs are untouched | none needed: confirm in stage 2 that no fixture prints it |
| 1c trial | Nothing runs | It is a procedure, not a switch |
| 2 deliveries of 142 | 142's switch `loop.parallel.units` off (row 20 of annex X §X.7) | 142's own rows. These lines are deliveries of F142-FR-016, -018, -020, -023 and need no new row |
| 2 failed-group count fed into the switch-off rule | Off with the layer | 142's row; the effect shows only with the layer on |
| 3 task groups as units | `loop.taskGroups` off (153); groups-at-once off | A new row for groups at once, plus the ruling CQ-154-02 |
| 3 group check in the worker tree | Off | New row |
| 4 shared limits | Off: each run alone, as today | New row; the files are user-level state |
| 5 wide stage groups | Serial stage graph (F123-FR-019) | New row plus the amendment of F123-FR-019 (CQ-154-05) |
| 6 phases side by side | Sequential phases | New row plus CQ-154-07 |
| 7 work past an open verdict | Off | New row plus the amendment of F142-FR-070 (CQ-154-08), and the approval-rate rule |

## The red team's channels

The channels of R29v (`/root/specstride-lanes/107-launch-contract/docs/ecosystem/research/
R29v-parallel-units-red-team.md`) and their rules, with what behaviours 3, 5, 6 and 7 do to each.
"3" means several groups of a phase at once. "7" assumes the design of T-h.

| Channel | Rule | 3 | 5 | 6 | 7 |
|---|---|---|---|---|---|
| V-01 integrity kinds tell the critic a group ran | PU-83 | unchanged | unchanged | widened: phase-order facts must stay neutral | widened: the critic must not learn of the speculative tree, so `tree-changed-outside-pass` stays the only kind |
| V-02 worker path travels into the merged tree | PU-82 | unchanged | unchanged | widened: phase trees also get opaque paths | unchanged (one worker tree) |
| V-03 a group kept with no merge check | PU-79 | unchanged; the baseline comparison of T-b never keeps a group without a merge check | n/a | unchanged | unchanged: integrate only through the merge check |
| V-04 concurrent verification depends on interleaving | PU-101 | widened: N group checks at once fall under F148-FR-011…-017 | widened across runs: the bound on full check-set executions (4) | widened | re-opened: the gate runs while the next unit works; the unit's checks must not share the gate's temp dirs or ports (T-d capacity classes) |
| V-05 runtime git runs worker-chosen code | PU-81 | unchanged | widened: the landing rebase runs under the same git hardening | unchanged | unchanged |
| V-06 worker git dir in the control plane | O-4 (PU-23) | unchanged | n/a (separate workspaces) | unchanged | unchanged |
| V-07 symlinks in the base | PU-84 | unchanged | unchanged | unchanged | unchanged |
| V-08 caches, config home, ports, tmp outside trees | PU-85, PU-97 | widened: more sessions | widened across runs; closed by the temp root per run and capacity classes (4) | widened | widened |
| V-09 write into a sibling's tree | PU-96, O-3 | widened: N workers | n/a | widened | unchanged |
| V-10 composition admits unaudited content | PU-80 | unchanged | n/a: a rebase is not composition, but the gate of T-f covers it | unchanged | unchanged |
| V-11 ticks, a third write | PU-94, O-2 | unchanged | unchanged | widened: ticks of a later phase land only at its approval | widened: ticks of a set-aside unit are never written |
| V-12 workers outlive the engine | PU-90 | unchanged | unchanged | unchanged | widened: a stop ends the speculative worker too |
| V-13 PU-63 holds the critic back | PU-91 | unchanged | unchanged | unchanged | re-opened: F142-FR-070's sweep before the critic; see T-h and CQ-154-08 |
| V-14 a job of an earlier yield voids groups | PU-92 | unchanged | unchanged | unchanged | unchanged |
| V-15 group size against the time cap | PU-86 | widened: N groups share the attempt's cap | n/a | widened | unchanged |
| V-16 cycle accounting against the pause rule | PU-87 | unchanged | widened: a slot wait is a pause (T-d) | unchanged | widened: set-aside spends no outer counter |
| V-17 N workers cross a hard cap unseen | PU-88 | widened | widened across runs: the per-account bound (4) | widened | widened |
| V-18 harness errors in workers pass the breaker | PU-89 | widened | unchanged | widened | unchanged |
| V-19 stop in the middle of a group | PU-93, PU-95 | widened | widened: stop of one stage of a wide group | widened | widened: stop during speculation |
| V-20 off is not quite absent | PU-98 | unchanged | unchanged | unchanged | unchanged |
| V-21 the proposer is a channel | PU-103 | unchanged | unchanged | unchanged | widened: the next unit's prompt carries no verdict-in-progress |
| V-22 task made serial: order undefined | PU-102 | unchanged | n/a | unchanged | unchanged |
| V-23 mtimes cluster at application | O-7 | unchanged | n/a | unchanged | unchanged |
| V-24 PU-56 says more than the architecture allows | PU-98 | unchanged | unchanged | unchanged | unchanged |
| V-25 case-insensitive file systems | PU-99 | unchanged | unchanged | unchanged | unchanged |
| V-26 objects borrowed through alternates vanish | PU-100 | unchanged | n/a | unchanged | unchanged |
| V-27 arithmetic and experiment design | O-8, PU-104 | unchanged | unchanged | unchanged | unchanged |

Re-opened channels: V-04 and V-13, both under behaviour 7. Each is a tension of its own, carried
by T-h. "Widened" means the existing rule must hold for more workers or more runs, and stage 3
shows that it does, row by row.

## Constraints carried into stage 2

1. Two groups of one phase run at once only when a deterministic, recorded rule finds disjoint
   write scopes and "no dependency" by the source CQ-154-02 rules. Otherwise they run one after
   the other, with the reason recorded (XX; T-a).
2. Every admissible group of a phase is worked in plan order, each at a clean boundary. The
   failed-group count of the switch-off rule is read from the ledger, never a constant (XX,
   F142-FR-018, -023; T-a; ledger R-M16).
3. A group's acceptance check is the frozen one, run by the runtime in the worker tree with its
   declared limit. A change to what it reads makes it tainted. It can only withhold an
   integration, and a group with no resolvable check is `unchecked` (II, III, XIV, XVII; T-b).
4. The merge check of a group compares against a baseline taken on the same tree before the
   group, so a suite that was red before is not charged to the group. A group whose apply
   changed no path does not run the merge check. A group whose tasks are already ticked is not
   started again. The gate is never scoped (XX; T-b; CQ-153-08 A).
5. A worker door declares `concurrentSessions` only with a test proving N sessions leave the
   harness configuration byte-identical, a version pin with `verified-on`, and a capability read
   through the registry (VIII, VII, X, XII; T-c).
6. Shared limits are files in user-level state. Each run's runtime root writes only its own slot
   record, atomically, with an owner record. A dead owner's slot is reclaimed through the lock's
   liveness proof, and a foreign live owner never. No service carries control flow (I, XVI; T-d).
7. A wait for a slot is a pause: no stop, no budget of any kind spent, counts unchanged (XVI;
   T-d).
8. Host-wide bounds come from user configuration. Project configuration only lowers them
   (Additional Constraints, config precedence; III).
9. A wide stage group is one run per stage workspace, each with its own lock, tree and runtime
   root. The pipeline coordinates them only through files (I; Additional Constraints; T-e).
10. A finished stage lands by a rebase and a fast-forward only after the full gate has passed on
    the rebased tree. A conflict or a red gate parks that stage alone, with exit 22. No model
    resolves a conflict (XX, II; T-f).
11. Phases run side by side only on declared, disjoint write scopes and a declared dependency
    graph read through the canonical model. Validation stays one queue in phase order, each
    phase on the tree rebased onto the last approved phase, with the full gate before its critic
    (I, II, IV, XX; T-g).
12. Work past an open verdict runs only in a worker tree branched from the frozen snapshot. The
    workspace doesn't change while the gate and the critic judge. A rejection discards the tree,
    and spends no outer counter and no count. The critic never sees the tree (I, II, III, IX,
    XVI, XX; T-h).
13. Work past an open verdict is switched on only against a measured approval rate. The spec
    states the threshold, and what the run does when the rate falls (XX; T-h; ledger R-M11).
14. `launch --dry-run` and the doctor print the plan as a pure function: no slot, no record, no
    worker. It is terse by default (XV, XIX; T-i).
15. No exit code and no stop reason is added. A parked stage is exit 22, a wait is a pause, and a
    set-aside unit has no attempt kind. A new member of a refusal or admission set goes through
    CQ-154-09 (XX; Additional Constraints; T-j).
16. Every new behaviour is off under `parity` and has its own switch. A register row with the
    owner's ruling turns it on, and every new output field is named in the register (XVIII;
    T-k).
17. Every new record has a schema, and every decision is a pure table with a rule id, in core or
    the layer. The composition root only wires (VI, XIII).
18. A broken slot store, an unreadable dependency declaration or a failed landing degrades to
    serial with a recorded reason. It never stops the run (Development Workflow; V).

## Ruling requests raised

| # | Question | Recommendation | Anchor |
|---|---|---|---|
| CQ-154-02 | The deterministic source of "no dependency" between two task groups of one phase | Every task of both groups carries `[P]`, and no task of the later group names a path in the earlier group's write scope; a declared `depends_on` overrides | XX; T-a |
| CQ-154-03 | The proof that makes a second adapter "tested" for `concurrentSessions` at Tier 1 | Fake-binary test of byte-identical configuration plus a recorded live check; refuse otherwise | VIII; T-c |
| CQ-154-05 | Amend F123-FR-019 so that a declared stage group may be wider than one stage, as one run per workspace | Yes, behind its own switch and register row | I; Additional Constraints; T-e |
| CQ-154-06 | After a rebase landing, is the critic called again on the rebased tree? | No: the full gate runs, and the phase-entry mismatch is a fact for the next critic | II; XX; T-f |
| CQ-154-07 | The source of phase dependencies | A field of the canonical model, declared in `tasks.md` and read through the adapter | IV; XX; T-g |
| CQ-154-08 | Amend F142-FR-070 to allow a speculative tree the critic cannot read | Yes, with the wording of T-h; if refused, behaviour 7 waits for the critic call | II; IX; T-h |
| CQ-154-09 | New members of 142's refusal and admission sets (for example `dependency`) | Add as needed by T-a and T-d, versioned | XX; T-j |
| CQ-154-10 | Do behaviours 5–7 fall under "The rules for several workers come from R29 and its red team"? | Option A: no amendment, and 154 carries its own red-team pass for 5–7 | XX L447; T-l |

## Constitution amendments proposed

None is required. Every tension resolves by design, by an amendment of another spec (F123-FR-019,
F142-FR-070), or by an owner ruling on a closed set or a source of rules. One amendment is
offered as option B of CQ-154-10 (MINOR), and it is not recommended.
