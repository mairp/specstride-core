# Feature Specification: Micro-loop layer

**Feature Branch**: `115-micro-loop-layer` (a label: Spec Kit creates no branch in this repository; the directory is `specs/115-micro-loop-layer`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 115-micro-loop-layer: the micro-loop layer of Specstride as the implementation `micro` of the loop-layer interface (EP-04): unit of work and checkpoint, micro level L1, inner checks on the per-phase check manifest, keep/repair/unresolved, caps, closing check, resume states, router rule table (EP-06) with three decision points, model-tier escalation as second repair, fallback to the classic loop, the [LOOP] line, protected set and fingerprints, toolchain profiles (EP-16), the fact block, integrity rules, tripwire and three-level revert, experiments X0 to X12."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` section 9, `consolidation.md` (glossary and divergence register), `feature-briefs.md` (brief 115-micro-loop-layer, requirement group G-A), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, D, E, G, X), feature 141 (§O.1 to §O.7), and the research reports R27, R23, R23v, R25 and R29.

## What this feature is

The micro-loop layer is one implementation of the loop-layer interface of the one engine. Inside
one phase attempt the proposer works one unit of work, declares it in a checkpoint and ends its
pass. The runtime validates the claim, runs the inner check set of the phase, and keeps the unit,
sends it to repair, or leaves it unresolved. The layer never approves anything. The phase gate,
with the full verification gate and the independent critic, stays the only source of a verdict.

This feature has no as-is behaviour (decision 21). Everything in it is new.

The feature was split after `speckit-specify` gave 66 requirements. Requirement group G-B of the
brief (check integrity and unit evidence) is now feature `116-check-integrity-and-unit-evidence`.
This feature keeps group G-A. The two parts cite each other only through contracts of feature 100.
The ids that moved are listed under "Requirements moved to 116-check-integrity-and-unit-evidence";
they are not reused, so the sequence of ids of this feature has gaps.

**In scope**: the unit of work and the checkpoint; micro level L1; inner checks on the check
manifest of the phase; keep, repair and unresolved; the caps; the closing check; the resume
states; the router rule table and its three decision points; escalation of the model tier as the
second repair; the fallback to the classic loop and its announcement; the `[LOOP]` line; the
integrity rules of the layer; the tripwire and the revert at three levels; the experiments that
keep or revert the default.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The call points the layer plugs into, the envelope of the ledger, the handoff, session directives | 103 |
| The check runner and the derivation of the check manifest | 105 |
| The protected set, the fingerprints, `protection`, the result conditions `tainted` and `cached`, toolchain profiles, the content of the fact block | 116 |
| Fail-fast and the first-failure predicate | 118 |
| The step runner | 105 |
| The slot and the escaping of the fact block in the critic prompt; grounding refusals; removal of marked lines from phase evidence | 117 |
| The phase gate, the verdict, the approval record | 101 |
| Parallel units | 142, a layer stacked above this one, off by default |
| The model-tier bump after K critic rejections | 149 |
| Micro levels L2 and L3 beyond continuation, check selection per unit, a model as inner reviewer | Roadmap |
| The event types and their fields; the spelling of config keys | 111; 110 |

Requirements: F115-FR-001 to F115-FR-042 and F115-FR-064 to F115-FR-066, 45 in all.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work is kept unit by unit (Priority: P1)

A consumer starts a run on a project whose verification gate executes. The proposer works one
task, declares it in a checkpoint and ends its pass. The runtime runs the inner check set. When
every command passes on an unchanged protected set, the unit is kept as a record. The next pass
takes the next task. A pass that is ended by a time limit loses one unit at most. At the phase
gate the critic gets the results of the units as facts, and nothing about how they came to be.

**Why this priority**: Aim 2 of the product: units small enough that no pass is killed by a time
limit, and work that was done is kept. It is the reason the layer exists.

**Independent Test**: A fixture phase with four tasks and two inner commands, driven by a test
proposer that declares one task per pass, ends with four kept units, four cycles spent, no
pass counted towards the pass limit, and the phase gate reached with the rows of four units handed over for the fact block.

**Acceptance Scenarios**:

1. **Given** a phase attempt with the layer on, **When** a pass ends at a valid checkpoint that names one task of the phase, **Then** the runtime runs every command of the inner check set and records the unit as kept when all exit 0 and no result carries a condition (F115-FR-013, F115-FR-016).
2. **Given** a kept unit, **When** the ledger is read, **Then** it holds a record bound to the tree fingerprint, and the project's repository holds no new commit and no new reference (F115-FR-016, F115-FR-017).
3. **Given** a pass with a valid checkpoint and a changed tree, **When** the pass is accounted, **Then** the pass is given back and does not raise the pass count, one cycle is spent, and the short-pass counter is as it was (F115-FR-027).
4. **Given** a checkpoint written by a pass that was killed, **When** the runtime reads the outbox, **Then** the checkpoint is refused and the kill is accounted as in the classic loop (F115-FR-011).

---

### User Story 2 - A failed check is repaired inside the phase attempt (Priority: P1)

An inner command fails on a unit. The proposer gets the output of the check on the current tree
and repairs. The second repair runs in a fresh session and, where the harness declares a model-tier
ladder, on the next model tier. When the repairs are spent the unit stays unresolved and the tree
stays as it is. After two unresolved units the layer goes off for the phase attempt and the classic
loop carries on.

**Why this priority**: Rework caught inside the phase attempt is the second saving the layer is
expected to bring, and the caps are what bound its cost.

**Independent Test**: A fixture whose inner command fails until the third proposal: the unit is
kept after two repairs, the second in a fresh session; with a command that always fails, the unit
is unresolved after three proposals and no file of the tree was changed by the runtime.

**Acceptance Scenarios**:

1. **Given** a failed inner check and repairs left, **When** the next pass starts, **Then** its prompt carries the output of the check on the current tree, with the marker token of the run (F115-FR-018).
2. **Given** the same failure signature on two consecutive proposals and a declared model-tier ladder, **When** the second repair starts, **Then** it runs on the next model tier of the same harness, in a fresh session, and never on a rung that equals a critic-class call of the run in model and in effort; a rung that shares the model alone is used with the critic-diversity warning (F115-FR-034).
3. **Given** an escalation target whose quota is exhausted, **When** the second repair is due, **Then** the escalation is skipped, the repair runs on the base model tier, and the skip is recorded (F115-FR-034).
4. **Given** two unresolved units in one phase attempt, **When** the second is recorded, **Then** the layer is off for the rest of the phase attempt, no exit code and no stop reason results, and the classic loop carries on from the tree as it is (F115-FR-025).

---

### User Story 3 - The layer changes nothing when it is not used (Priority: P1)

A proposer that never declares a unit of work, or a run whose verification gate does not execute,
gets the classic loop. Output is the same as with the layer off, apart from the fields the
divergence register names.

**Why this priority**: Inertness is the clause of decision 21 that lets the parity suite speak
for the default configuration. Principle XVIII binds it.

**Independent Test**: The second suite of feature 141 on every fixture family: no difference
outside the layer allowlist and equal counters.

**Acceptance Scenarios**:

1. **Given** the layer on and no checkpoint in a phase attempt, **When** the phase attempt runs, **Then** the layer executes no command, takes no fingerprint, consults no router table, and adds nothing to any prompt but the checkpoint contract block (F115-FR-006).
2. **Given** a run in verification mode `plan` or `off`, **When** it launches, **Then** the classic loop runs and the fallback is announced with the reason `gate-not-executing` (F115-FR-004).
3. **Given** the layer on and not yet engaged in a phase attempt, **When** a pass runs, **Then** its time limit and every command of the runtime equal those of the classic loop (F115-FR-007).
4. **Given** the `parity` profile, **When** any run ends, **Then** no `[LOOP]` line is printed (F115-FR-038).

---

### User Story 4 - A run is resumed inside the life of a unit (Priority: P2)

A run stops or is relaunched while a unit is declared, while a check runs, or after a check
ended. On resume the layer continues from the ledger. Counts continue.

**Why this priority**: Decision 23. Without it a relaunch would reset the caps and a run could
loop for ever.

**Independent Test**: For each of the five resume states a fixture stops the engine in that state
and resumes; the action and the counts equal the table of F115-FR-031.

**Acceptance Scenarios**:

1. **Given** the last ledger record `check-started`, **When** the run resumes, **Then** the check runs again, the interrupted run is recorded as `interrupted`, and neither a cycle nor a failure is counted (F115-FR-031).
2. **Given** a ledger that is truncated, reordered or edited, **When** the run resumes, **Then** the layer is off for the phase attempt, an integrity event is raised, and the run does not stop (F115-FR-032).
3. **Given** a resume with another configured strategy, **When** the run continues, **Then** the recorded strategy applies and a warning is printed (F115-FR-001).

---

### User Story 5 - The operator sees what the layer did, and a breach reverts it (Priority: P2)

At the end of a run the operator reads one `[LOOP]` line before the digest. On a breach of the
integrity of the phase gate the layer goes off for the run, the approval concerned is void, a tripwire record makes
every later launch on the machine run the classic loop until the operator clears it, and the
breach blocks the release.

**Why this priority**: Decision 21 asks for an immediate revert on a breach. Ruling 42 fixed the
three levels.

**Independent Test**: A test build in which an inner event changes a reject count: the invariant
check finds the breach, the tripwire record is written, the next launch announces the classic
loop, and `tripwire clear` exits 0 and removes the record.

**Acceptance Scenarios**:

1. **Given** a run with the layer on, **When** it ends in default output, **Then** one `[LOOP]` line with the keys of F115-FR-038 stands before the digest (F115-FR-038).
2. **Given** a breach, **When** it is found, **Then** the layer is off for the rest of the run, the approval concerned is void and the phase is gated again (F115-FR-040).
3. **Given** a tripwire record, **When** any run launches on the machine, **Then** it runs with every loop layer off and says so, until `tripwire clear` (F115-FR-041).
4. **Given** no tripwire record, **When** the operator runs `tripwire clear`, **Then** the command exits 1 (F115-FR-041).

---

### User Story 6 - The owner decides with data whether the default stays (Priority: P2)

The owner gets the results of the experiments X0 to X12 inside an evaluation window of 48 valid
paired phases or 6 weeks. If the targets are not shown, the default returns to `classic`.

**Why this priority**: Decision 21: the layer stays the default only if it earns it.

**Independent Test**: The report of experiment X5 states the four measures of F115-SC-001 for both
arms and both strata, with the number of valid pairs.

**Acceptance Scenarios**:

1. **Given** cost that is not counted for every pass, **When** a paired run is offered, **Then** it does not count (F115-FR-066, precondition X0).
2. **Given** the window closed with a target of X5 not shown, **When** the next release is prepared, **Then** the default of `loop.strategy` is `classic` (F115-FR-065).

---

### Edge Cases

- A pass writes a checkpoint and a yield artifact: the yield is taken, the checkpoint is refused with an event (F115-FR-011).
- A checkpoint is present when a pass starts: it is removed with an event (F115-FR-010).
- A pass writes a valid checkpoint and phase evidence: the checkpoint is accepted and the closing check is its check (F115-FR-028).
- A checkpoint names a task that an earlier unit named: it is accepted, and the counts per task id continue (F115-FR-022).
- A checkpoint names a task of another phase: refused with the reason `foreign-id` (F115-FR-011).
- The phase has no inner command: every unit is `unchecked`, no cycle fails; after two consecutive such units the layer goes off with the reason `no-check` (F115-FR-021, F115-FR-025).
- The phase has one task, or the first unit names every task: the layer goes off for the phase attempt with the reason `single-unit` (F115-FR-005).
- A command passes on the second run after a failure: `flaky`, both results stated, excluded for the phase attempt, still run at the verification gate (F115-FR-020).
- A command runs longer than its time limit: excluded for the phase with the reason `slow`; its result reads `unchecked`, not failed (F115-FR-023).
- A limit or breaker of the pass loop fires during a repair after the closing check: the repair ends and the phase attempt goes to the phase gate (F115-FR-029).
- The router table is invalid: routing is off for the run, announced; the loop runs in manifest order, on the base model tier, with the pinned layer (F115-FR-033).
- A stop request arrives while a check runs: it is seen at the next poll; `stop --now` ends the process group of the check (F115-FR-026).
- A quota pause begins at a check boundary: the paused cycle is not counted (F115-FR-026).
- The harness of the proposer was discovered and never tested: the layer runs at L1; `protection` reads `detect` (F115-FR-003, F115-FR-015).
- With parallel units off, nothing of F115-FR-042 applies and no output differs.

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. This feature has no as-is origin, so no
requirement carries `origin:` or `disposition:`. A test `CT-115-<n>` with n below 100 is the
test of requirement n. A test `CT-115-<n>` with n from 101 to 160 is the test of integrity rule
IR-(n minus 100); the table "Integrity rules and their tests" lists them. A test `CT-115-<n>`
with n from 161 was added after the cross-feature review and names its requirement in the
`test:` line. Ids and tests of the requirements that moved are not reused.

##### Strategy, level, fallback, inertness

- **F115-FR-001**: The loop strategy MUST be a switch with the members `micro` and `classic`, and `micro` MUST be the default. The strategy, the micro level and the hash of each check manifest MUST be chosen at launch, written to the run record and the run snapshot, recorded per phase attempt, and left unchanged by a resume or a relaunch. A resume that finds another configured strategy MUST use the recorded one and print a warning.
  - divergence: DV-012; DV-017
  - parity: `classic` (row 1 of annex X §X.7)
  - test: CT-115-1; CT-115-127
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-002**: The layer MUST register as the implementation `micro` of the loop-layer interface and MUST declare at registration the directives `keep`, `repair`, `unresolved`, `layerOffForAttempt`, `layerOffForRun`, `giveIterationBack`, `exemptShortPass`, `exemptRepeatCounter` and `requestPass`, and the services check runner, router, ledger namespace, fingerprints and the builder of the fact block, as the engine offers them (annex D §D.1, "Inputs"). It MUST hold no state outside its ledger namespace `micro`. At the call point `contributeCriticInput` it MUST return the rows of the fact block as annex D §D.7 defines them, and nothing else. It MUST hold no writer of an approval, a verdict, feedback, a hint or a recovery marker, and the set of writes to the records of the phase gate over every fixture MUST equal that of the same fixture with the layer off.
  - test: CT-115-2; CT-115-101
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-003**: The layer MUST work at micro level L1 on every harness of the resolved registry, whatever its state: the pass ends at the checkpoint, and the layer needs no capability of the harness beyond the `proposer` level of the harness port. It MUST NOT test a harness name. Where a harness adapter declares continuation and continuation is switched on, the first repair of a unit MAY continue the session; the second repair MUST start a fresh session. The recorded level MUST be `L1`.
  - parity: not used (the layer is off; rows 1 and 10 of annex X §X.7)
  - test: CT-115-3
  - ep: EP-02 `specstride.harness/1` (consumes)
  - status: unverified (check: the descriptor-only fixture completes a phase at L1 on a harness that no run has verified; verified-on: —; pin: —)

- **F115-FR-004**: In a run whose verification gate does not execute (verification mode `plan` or `off`) the classic loop MUST run for the whole run, and the fallback MUST be announced at launch with the reason `gate-not-executing`. Such a run MUST still get every technique that has a switch of its own.
  - divergence: DV-053
  - parity: `classic` (row 1 of annex X §X.7)
  - test: CT-115-4; CT-115-134
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-005**: A fallback to the classic loop MUST carry exactly one reason of the closed set of fallback reasons (section "Closed sets"): `gate-not-executing`, `config`, `harness` and `tripwire` for a run, decided at launch; `no-check` and `single-unit` for a phase attempt, decided when they occur. `config` MUST apply when the configuration in force selects the strategy `classic` (the profile `parity` included); `harness` MUST apply when the harness of the proposer does not offer the `proposer` level of the harness port that L1 needs (F115-FR-003; R25 RT-C, rows `loop.off` and `loop.harness`). `single-unit` MUST apply when the phase holds one task in the reading at launch or when the first accepted checkpoint names every task of the phase. Every fallback MUST be announced at launch or when it happens and MUST appear in the events, in the status, in the doctor and in the `[LOOP]` line.
  - parity: not printed (rows 1 and 19 of annex X §X.7)
  - test: CT-115-5
  - assumption: CQ-080 (the member `tripwire`; annex X §X.6 row 59 lists it since the amendments); CQ-081 (the moment at which `single-unit` and `no-check` are decided)

- **F115-FR-006**: In a phase attempt in which no unit of work was declared the layer MUST execute nothing and MUST add nothing to any prompt but the checkpoint contract block: no inner check, no closing check, no fingerprint, no fact block, no decision of the router and no record in its ledger namespace. The surfaces that may differ from a run with the layer off MUST be exactly those the divergence register names as layer fields.
  - divergence: DV-012; DV-016; DV-017; DV-020; DV-052
  - parity: `classic` (row 1 of annex X §X.7)
  - test: CT-115-6; CT-115-152
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-007**: Until the layer is engaged in a phase attempt, that is until the first checkpoint of the phase attempt was accepted, no time limit of a pass and no command of the runtime MUST differ from the classic loop.
  - test: CT-115-7; CT-115-158
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-008**: With the layer on, the layer MUST contribute one protected block to the prompt of every pass, the checkpoint contract block. The block MUST say how a unit of work is declared, MUST ask for one task per unit sized at 5 to 15 minutes of work, MUST allow a group of tasks where they cannot be checked apart, and MUST say that the pass ends after the checkpoint. The block MUST be byte-stable inside a run.
  - divergence: DV-020
  - parity: not present (row 1 of annex X §X.7)
  - test: CT-115-8
  - ep: EP-15 `specstride.prompt-block/1` (implements)

##### Unit of work and checkpoint

- **F115-FR-009**: A unit of work MUST be declared by the proposer in a checkpoint that names one or more task ids of the current phase; for a spec format without task ids it names criterion indexes of the phase. The runtime MUST read from a checkpoint the ids and a note of bounded length and MUST ignore every other field. The note MUST NOT reach a critic-class call.
  - test: CT-115-9; CT-115-109
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F115-FR-010**: A checkpoint is a claim. The runtime MUST read it only after the pass has exited, as a regular file inside the outbox, opened without following links and without blocking, newer than the start of the pass, not larger than 16 kilobytes, and unchanged between two reads. Of the note at most 512 bytes MUST be kept. A checkpoint that was read MUST be moved into the control plane under the logical name `unit:<unitId>:checkpoint`. A checkpoint that is present when a pass starts MUST be removed with an event of the type `checkpoint.removed`.
  - test: CT-115-10; CT-115-155
  - assumption: CQ-086 (the size limit of a checkpoint and of its note; the sources say "bounded" and give no number)
  - status: unverified (check: opening without following links and without blocking behaves the same on macOS; verified-on: —; pin: —)

- **F115-FR-011**: A checkpoint MUST be refused, with an event of the type `checkpoint.refused` that carries one reason of the closed set of checkpoint refusals (annex X §X.6 row 138), when the pass was killed (`pass-killed`), when an id is not a task of the current phase (`foreign-id`), when a yield artifact was written in the same pass (`yield-in-pass`; the yield is taken), when the file fails a rule of F115-FR-010 (`not-regular`, `stale`, `too-large`, `changed-while-read`), or when it holds no id (`empty`). A refused checkpoint MUST change no counter of the layer, and the pass MUST be accounted as in the classic loop.
  - test: CT-115-11

- **F115-FR-012**: The task list of each phase as read at launch, with its order, its ids and its hash, is the record `run:<runId>:task-list` of annex B §B.5, which the engine writes at launch from the canonical spec model. The layer MUST read that record and MUST NOT store the reading, or a copy of it, under a name of its own. Validation of a checkpoint MUST use that reading, and the reading MUST be given to the builder of the fact block with the rows of the units. A difference between that reading and the task list at the phase gate, other than ticked checkboxes, MUST be given to the builder of the fact block as the further fact `task-list-changed` (annex D §D.7; annex X §X.6 row 66).
  - divergence: DV-052
  - parity: not read (the layer is off; row 1 of annex X §X.7)
  - test: CT-115-12; CT-115-156; CT-115-162
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - assumption: CQ-084 (that register row DV-052 covers this file); CQ-181 (the logical name of the task list as read at launch; the answer is applied in annex B §B.5 as `run:<runId>:task-list`)

##### Inner checks and outcomes

- **F115-FR-013**: The inner check set of a phase MUST be the entries of the check manifest of the phase that are marked as inner, less the entries excluded by the runtime. Every command of the set MUST run in every check, and a check MUST NOT stop at a failed command. Inner checks MUST be deterministic commands only, run by the runtime through the check runner; no model MUST act as an inner reviewer.
  - parity: not used (row 1 of annex X §X.7)
  - test: CT-115-13
  - ep: EP-05 `specstride.check-runner/1` (consumes)

- **F115-FR-014**: Before every check the runtime MUST verify the hash of the check manifest and the pin of every executable of the inner set. On a mismatch the check MUST NOT run, the layer MUST go off for the phase attempt, and an integrity event of the kind `manifest-mismatch` or `pin-mismatch` MUST be raised, as an event of the type `integrity.noted`. The kinds are members of the closed set of integrity kinds (annex X §X.6, row 65).
  - test: CT-115-14; CT-115-108

- **F115-FR-015**: Before every check the runtime MUST end every process of the pass that it can identify, except a detached job held by an accepted yield. Where it cannot guarantee that no process of the pass remains, `protection` MUST read `detect`. A result MUST be the exit status the runtime observed; it MUST never be read from a file, and output of a test that the proposer ran MUST never be recorded as a result.
  - test: CT-115-15; CT-115-110; CT-115-113; CT-115-132
  - ep: EP-05 `specstride.check-runner/1` (consumes)
  - status: unverified (check: ending the process group and the session of a pass on macOS; verified-on: —; pin: —)

- **F115-FR-016**: The outcome of a check on a unit MUST be one of `kept`, `repair` and `unresolved`. `kept`: every command exits 0 and no result carries a condition, which the check runner sets when the fingerprints before and after a check differ (annex C §C.8); the layer returns the directive `keep`, and the record is bound to the tree fingerprint. `repair`: a command failed, or a result carries `tainted` or `cached`, and repairs remain. `unresolved`: the repairs are spent or the time cap of the unit is reached; the tree stays as it is.
  - test: CT-115-16
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-017**: Inside a phase attempt the runtime MUST never commit to, revert, reset, clean or check out the working tree on behalf of this layer, MUST create no reference in the project's repository, and MUST write nothing under the project's repository directory. A kept unit is a ledger record and nothing else. The two writes that ruling P1 allows belong to the layer of parallel units and exist only with that option on.
  - divergence: DV-085
  - parity: off (rows 1 and 20 of annex X §X.7)
  - test: CT-115-17; CT-115-160

- **F115-FR-018**: For a repair the proposer MUST get the output of the check on the current tree and never an earlier one. Every failure block MUST carry a marker token that is random per run. For a taint the block MUST name the protected path that changed. The second repair MUST run in a fresh session with a note built by the runtime.
  - test: CT-115-18; CT-115-120

- **F115-FR-019**: The failure signature MUST be the ordered list of the ids of the failed commands with their exit codes, in manifest order. No output of a check MUST be parsed for a decision. When the signature and the tree fingerprint both equal those of the proposal before, a continued session MUST be dropped and the repair MUST run in a fresh session.
  - test: CT-115-19; CT-115-153

- **F115-FR-020**: A failed command MUST be run once more on the same fingerprint. When the second result differs, the command MUST be recorded as `flaky` with both observed results, MUST be excluded from the inner set for the phase attempt, and MUST still run at the verification gate.
  - test: CT-115-20; CT-115-114

- **F115-FR-021**: A unit with no command to run MUST be `unchecked`. A task that no checkpoint named MUST be `unchecked`. `unchecked` MUST never be shown as a pass, and an empty inner set MUST never fail a unit.
  - test: CT-115-21; CT-115-115

##### Caps and counting

- **F115-FR-022**: The layer MUST enforce these caps, each a configuration key of the class narrowing, with these defaults: repairs 2 per task id; time per proposal 20 minutes, applied only once the layer is engaged; time per unit 30 minutes, proposals, repairs and checks together; cycles per phase attempt the number of tasks of the phase plus 6, and at least 12; unresolved units before the layer goes off 2. The repair count of a unit MUST be the highest among its tasks, and a new grouping of tasks MUST NOT reset a count. Every default has low confidence and is a starting value for the experiments.
  - parity: not used (the layer is off; row 65 of annex X §X.7)
  - test: CT-115-22
  - assumption: CQ-160 (the unit suffix of the two time keys: `.proposalMin`, `.unitMin`)

- **F115-FR-023**: A command of the inner set MUST have a time limit of 5 minutes by default. A command whose measured duration exceeds it MUST be excluded for the phase with the reason `slow`, and its result MUST read `unchecked` and not failed. From the third cycle of a phase attempt the time spent in inner checks MUST NOT exceed 15 per cent of the elapsed time of the phase attempt; on a breach the slowest command MUST be excluded with the reason `budget`. Only the runtime MUST exclude a command, every exclusion MUST carry a reason and MUST be recorded as an event of the type `check.excluded`, and every exclusion MUST be given to the builder of the fact block (annex D §D.7).
  - parity: not used (the layer is off; row 65 of annex X §X.7)
  - test: CT-115-23
  - assumption: CQ-160 (the unit suffix of the time key: `.checkMin`)

- **F115-FR-024**: A check that was interrupted MUST be recorded as `interrupted` and run again. The first interruption MUST count neither as a cycle nor as a failure. The second interruption of the same check in a phase attempt MUST count as a cycle.
  - test: CT-115-24; CT-115-150

- **F115-FR-025**: The layer MUST return `layerOffForAttempt` when a cap of cycles is spent, when two units are unresolved, when two consecutive units are `unchecked` and the inner set is empty, when a check cannot start, when its own code fails, or on an integrity event other than a taint. The classic loop MUST then carry on from the tree as it is. No exit code, no stop reason and no run state MUST result. A taint MUST NOT switch the layer off.
  - test: CT-115-25; CT-115-107
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-026**: A stop request MUST be checked before a check starts and at every poll while it runs; `stop --now` MUST end the process group of the check. The wall-clock budget MUST be checked during a check as it is during the wait of a yield. A quota pause MUST be entered at a boundary of a pass or of a check, and the paused cycle MUST NOT be counted. An accelerated phase attempt MUST get the layer with the same check manifest.
  - test: CT-115-26

- **F115-FR-027**: Inner events MUST change none of: the reject count, the number of the phase attempt, the MALFORMED streak, the input of the oscillation halt, the signature of the diagnostician, the verdict pins, the learning observations, the yield index and the consecutive breakers. A pass that ends at a valid checkpoint MUST leave the short-pass counter and the consecutive breakers as they were. A pass with a valid checkpoint and a tree fingerprint that differs from that of the checkpoint before MUST be given back (directive `giveIterationBack`), so that it does not raise the pass count, and MUST spend one cycle. The exact argument lists of the inner check set MUST be exempt from the process-level repeat counter. The passes of a phase attempt MUST be bounded by the pass limit plus the cycle cap plus the yield cap.
  - divergence: DV-013; DV-014; DV-015
  - parity: not observable (the layer is off; row 1 of annex X §X.7)
  - test: CT-115-27; CT-115-106; CT-115-123; CT-115-148
  - ep: EP-04 `specstride.loop-layer/1` (implements)

##### Closing check

- **F115-FR-028**: The closing check MUST be a switch of its own, on by default. When phase evidence appears in a phase attempt in which a unit was declared, the runtime MUST run the inner check set on the final tree, unless the last check passed on the same tree fingerprint. A failure MUST return the proposer to work at most twice and only while cycles remain; when they are spent the phase evidence MUST go to the phase gate unchanged. An inner result MAY delay the phase gate and MUST never skip or replace it. In a phase attempt without a declared unit the closing check MUST NOT run. A valid checkpoint written in the pass that also wrote phase evidence MUST be accepted as a declaration, and the closing check MUST serve as its check.
  - divergence: DV-046
  - parity: off (row 2 of annex X §X.7)
  - test: CT-115-28; CT-115-105
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-029**: From the moment phase evidence exists in a phase attempt, no limit and no breaker of the pass loop MUST stop the run. When one fires during a repair after a closing check, the repair MUST end and the phase attempt MUST go to the phase gate. Phase evidence that was set aside MUST be kept in the control plane with its hash; the phase gate MUST take the newer of it and the phase evidence the proposer wrote again. When the tree changed and the phase evidence did not, the further fact `evidence-predates-tree` (annex D §D.7; annex X §X.6 row 66) MUST be given to the builder of the fact block.
  - divergence: DV-046
  - parity: off (row 2 of annex X §X.7)
  - test: CT-115-29; CT-115-149

##### Resume

- **F115-FR-030**: The layer MUST write its records to the ledger in the namespace `micro`, through the engine, and each record MUST be appended before the act it describes. The record kinds MUST be the closed set of the section "Closed sets": `unit-declared`, `check-started`, `check-finished`, `unit-kept`, `unit-repair`, `unit-unresolved`, `command-excluded`, `escalation`, `closing-check`, `disengaged`, `integrity`.
  - test: CT-115-30; CT-115-125

- **F115-FR-031**: At a start of the engine inside a phase attempt the layer MUST act by the last record of its namespace: after `unit-declared`, run the check on the current tree, and when the fingerprint differs from the declared one, mark the declaration `superseded` and bind the result to the current fingerprint; after `check-started`, run the check again under F115-FR-024; after `check-finished` whose result was not delivered, deliver it in the first pass when the fingerprint still matches and run the check again otherwise; after `disengaged`, stay off for the rest of the phase attempt. A pass that was running is lost as in the classic loop and counts no cycle.
  - test: CT-115-31
  - ep: EP-04 `specstride.loop-layer/1` (implements)

- **F115-FR-032**: The cycle count, the repair and escalation counts per task id, the count of unresolved units and the disengaged state MUST be in the ledger and MUST continue after a resume and a relaunch. The reset flag of the run MUST reset them. The ledger MUST be validated at resume and before the fact block is built; when it is invalid the layer MUST be off for the phase attempt and an integrity event of the kind `ledger-invalid` (annex X §X.6, row 65) MUST be raised, as an event of the type `integrity.noted`.
  - divergence: DV-011
  - parity: resume fixtures pass the reset flag (row 13 of annex X §X.7)
  - test: CT-115-32; CT-115-126

##### Router and escalation

- **F115-FR-033**: The product MUST ship one router rule table as versioned data, with the decision points `tools`, `loop` and `escalation`, the signals, the choice sets and the rows of the section "The shipped router table". For every vector of signals exactly one row MUST fire. Every decision MUST be recorded as an event of the type `route.decided` with the rule id, the signals read and the version of the table, a decision that changes nothing included. No decision MUST reach a critic-class call. An invalid table MUST switch routing off for the run, announced, with the rule id `config-off`; the loop then runs in manifest order, on the base model tier, with the pinned layer. Routing MUST have a switch of its own, on by default.
  - parity: not used (the layer is off; row 64 of annex X §X.7)
  - test: CT-115-33
  - ep: EP-06 `specstride.router-rules/1` (implements)

- **F115-FR-034**: Escalation MUST be a switch of its own, on by default. It MUST act only as the second repair of a unit, after the same failure signature on two consecutive proposals, and never on a taint, another integrity event, a flaky command, a quota or rate error, a time limit or a crash of a harness. The target MUST be the next model tier of the ladder of the same harness, pinned at launch, in a fresh session. The target MUST NOT be a rung that equals a critic-class call of the run, that is a call of the critic, the diagnostician or release verification, in model and in effort: the signal `targetIsCriticModel` is true only when both are equal, and the escalation is then skipped with the reason `critic-collision`. A rung that shares the model of a critic-class call and differs from it in effort is not a collision: it MUST be used when no other rule skips it, and the critic-diversity warning MUST be raised and recorded with the escalation (signal `targetSharesCriticModel`). Escalations MUST be capped at 1 per task id and 2 per phase attempt, inside the repairs and never in addition. A skip MUST carry a reason of the closed set of skip reasons (annex X §X.6 row 140) and MUST be recorded as an event of the type `escalation.skipped`; when the quota of the target is exhausted the reason is `quota` and the repair MUST run on the base model tier.
  - divergence: DV-050
  - parity: off (row 3 of annex X §X.7)
  - test: CT-115-34; CT-115-147; CT-115-161
  - assumption: CQ-191 (ruling 49 is read to allow a rung on the critic's model at another effort, with the warning, as F100-FR-130 does)
  - ep: EP-06 `specstride.router-rules/1` (implements)

- **F115-FR-035**: Escalation and the model-tier bump after critic rejections MUST be separate rules with separate counts. Escalation acts inside a phase attempt on a failed inner check; the model-tier bump acts between phase attempts. An escalation MUST NOT change the model tier on which the next phase attempt starts, and the layer MUST read the model tier in force for a phase attempt from the read-only view of the phase attempt.
  - divergence: DV-050; DV-079
  - parity: off (rows 3 and 24 of annex X §X.7)
  - test: CT-115-35

- **F115-FR-036**: The decision point `tools` MUST only order and exclude among the entries of the check manifest. It MUST add no command and MUST build no argument list. The decision point `loop` MUST be able to switch a registered layer off for a phase attempt and MUST never switch a layer on. The router MUST be consulted only in a phase attempt in which the layer is engaged.
  - test: CT-115-36; CT-115-153
  - ep: EP-06 `specstride.router-rules/1` (implements)

##### Reporting

- **F115-FR-037**: The layer MUST make the following recordable as events, each under the type of the event catalogue that the table "Events of the layer" names: the strategy selected for a run and for a phase attempt, with the manifest hashes and the fallback reason; a phase attempt that ended without a declared unit; a checkpoint accepted, refused or removed; each inner check; the outcome of a unit; an exclusion of a command; every decision of the router; an escalation and a skip; the layer going off, with the cause of its ledger record `disengaged` and, where one applies, the fallback reason; an integrity event with its kind; the tripwire raised and cleared. The layer MUST write no event of a type that the catalogue does not hold. An event MUST hold no output of a command and no note of a checkpoint. A pass that an inner time cap ended MUST be marked as ended by a time limit, so that it counts as a killed pass in every measurement.
  - divergence: DV-016
  - parity: the events project to nothing (row 1 of annex X §X.7)
  - test: CT-115-37
  - assumption: N-111-1 (the causes of the record `disengaged`: `caps`, `integrity`, `check-error`, `no-check`, `single-unit`, `layer-error`, `breach`; feature 111, F111-FR-008)

- **F115-FR-038**: With the layer on, the engine MUST print one `[LOOP]` line before the digest, in default output only, with the keys in this order: `strategy`, `level`, `containment`, `protection`, `units`, `pass`, `fail`, `unchecked`, `tainted`, `cycles`, `disengaged`, `escalations`, `failfast-stops`, `fallback`. `fallback` MUST be `none` or a fallback reason; `protection` MUST be the value of the run record (annex E §E.2, field `containment`), `prevent` or `detect`, followed by `,basic` when a detected toolchain has no profile (annex C §C.14). With the layer off by rule the line MUST read `strategy=classic reason=<fallback reason>`. The status line MUST carry the strategy. Neither MUST be printed under the `parity` profile.
  - divergence: DV-018
  - parity: not printed (row 19 of annex X §X.7)
  - test: CT-115-38
  - assumption: CQ-082 (how the `[LOOP]` line says that a toolchain has the basic protection only)

##### Tripwire and revert

- **F115-FR-039**: A breach of the integrity of the phase gate MUST be one of the closed set of breach kinds: `approval-without-gate` (an approval without a critic reply that matches the nonce, made after the pass loop ended and after the full verification gate executed in the same phase attempt); `outer-counter-changed` (a counter of F115-FR-027 changed by an inner event); `critic-input-excluded-field` (an input of a critic-class call that holds a field which annex D §D.7 lists as never in the fact block); `false-pass` (a pass recorded for a check that did not run, ran tainted, or whose fingerprints differed). An act that the runtime detected and refused is an integrity event and not a breach. The invariants MUST be checked on the event file of every run by the doctor and in the build.
  - test: CT-115-39; CT-115-128
  - ep: EP-14 `specstride.doctor/1` (consumes)

- **F115-FR-040**: On a breach the layer MUST return `layerOffForRun`, the approval concerned MUST be void and the phase MUST be gated again, and the breach MUST be in the digest. The layer itself MUST NOT void the approval: it reports the breach, and the engine acts through the contract of the approval record.
  - test: CT-115-40

- **F115-FR-041**: On a breach the runtime MUST write the tripwire record to the user-level state of the consumer who runs the product, which is what "the machine" means here, with the kind of the breach and the id of the rule that found it. While the record exists every launch on the machine MUST run with every loop layer off, announced with the fallback reason `tripwire`. The writing of the record MUST be recorded as an event of the type `tripwire.raised`. The command `tripwire clear` MUST remove the record, exit 0, and be recorded as an event of the type `tripwire.cleared` in the next engine start; it MUST exit 1 when no record exists and 3 on wrong usage. A breach MUST block the release, and the next release MUST ship `classic` as the default strategy; no result of an experiment offsets it.
  - test: CT-115-41
  - ep: EP-14 `specstride.doctor/1` (consumes)
  - assumption: CQ-083 (the field `kind` of the tripwire record takes a breach kind; annex B §B.18 draws it from annex X §X.6 row 141 since the amendments)

##### Beneath a stacked layer

- **F115-FR-042**: With the layer of parallel units stacked above this one, a group that was integrated MUST be one kept unit of this layer, produced by integration and not by a checkpoint of the main line, bound to the fingerprint of the workspace. A failed merge check MUST enter the repair path of this layer as a failed check of that unit and MUST charge one repair to every task of the unit. The decision point `loop` MAY switch the layer of parallel units off for a phase attempt and never on. Nothing else of this layer MUST change, and with parallel units off nothing MUST change at all.
  - divergence: DV-080
  - parity: off (row 20 of annex X §X.7)
  - test: CT-115-42
  - ep: EP-04 `specstride.loop-layer/1` (implements)

##### Experiments

- **F115-FR-064**: Every run MUST record each check with the id of its command, its duration and its result, and MUST report per phase the share of time spent in inner checks and the time spent on fingerprints. Paired runs MUST follow this design: the same commit, spec, harness version, model, effort and budgets in every arm; the product run from an installed copy whose identity is recorded; verification mode `required` in every arm; the phase as the unit of pairing, started in every arm from the approved tree of the phase before; arms alternating in the order ABBA; pass time and wait time separated; quota pauses and time blocked on a person excluded; a pair void when either side met an outage of a harness.
  - test: CT-115-64

- **F115-FR-065**: The evaluation window MUST open at the first valid pair after experiment X0 passed and MUST close at 48 valid paired phases or after 6 weeks, whichever comes first. The targets of decision 21 MUST be judged on the default configuration against the parity configuration, on a mix fixed before the first run at 50:50 between the stratum of long verification jobs and the stratum of ordinary phases, both reported apart (experiment X5). The layer MUST separately earn its place against the same configuration without it (experiment X6). When the window closes with a target of X5 not shown, the default strategy of the next release MUST be `classic`. Every pass ended by a time limit or a watchdog, inner caps included, MUST count as killed in both arms, with hours beside the count.
  - test: CT-115-65

- **F115-FR-066**: The experiments MUST be run in this order and with these rules. X0 (cost accounting) comes first and is the precondition: no paired run counts until usage is complete or explicitly unavailable for 100 per cent of passes and totals agree within 2 per cent. Then the experiments that need no live run: X1 (share of past rejections that a deterministic command would have caught; below 20 per cent X5 is run for killed passes and quality only) and X12 parts (i) to (iii). Then X5 and X6, and the ablations by the paired design: X9 (continuation off), X10 (escalation off), X11 (obligations index off), and one arm for the model-tier bump after critic rejections. X7 (repair cap and repair context) and X8 (unit size and units per pass) change a default only on a difference larger than the noise at unit level. X12 parts (i) and (ii) MUST block a release; part (iv) MUST be repeated before the default ships when detection by the critic falls by more than 5 points. A live experiment is paid, MUST be logged with its cost, and is never run by a build job.
  - test: CT-115-66

### The shipped router table

Content of EP-06, owned by this feature. Rows are tried in order; the first whose predicate holds
fires (feature 100, annex X §X.3).

Signals. All come from the ledger, the check manifest and the read-only view of the phase
attempt. None is task prose, output of a check or anything a model wrote.

| Signal | Meaning |
|---|---|
| `routingOn`, `escalationOn` | The two switches |
| `engaged` | A checkpoint was accepted in the phase attempt |
| `innerCount` | Commands left in the inner set |
| `phaseTasks`, `unitTasks` | Tasks of the phase at launch; tasks the unit named |
| `cyclesLeft`, `unresolvedUnits`, `uncheckedStreak` | Counters of the layer |
| `integrityKind` | Kind of the newest integrity event of the phase attempt, or absent |
| `checkError` | Error of the check runner, or absent |
| `commandFlaky`, `commandDuration`, `checkShare`, `cycle` | Per command: flagged flaky; measured duration. Per phase attempt: share of time in inner checks; ordinal of the cycle |
| `signatureRepeated` | The failure signature equals that of the proposal before |
| `conditions` | Conditions of the failed result |
| `repairsUsed`, `escalationsTask`, `escalationsAttempt` | Counts per task id and per phase attempt |
| `nextTier`, `targetIsCriticModel`, `targetSharesCriticModel`, `targetQuotaExhausted`, `budgetAllows` | The next rung of the pinned ladder or absent; whether it equals a critic-class call of the run in model and in effort (true only when both are equal); whether it shares the model of a critic-class call and differs in effort; whether its quota is exhausted; whether the budget of the role allows it |
| `parallelOn` | The layer of parallel units is registered and on |

Decision point `tools`. Choice set: `run`, `exclude:flaky`, `exclude:slow`, `exclude:budget`.
Evaluated per command, in manifest order; the commands with the choice `run` run in manifest order.

| Rule id | Predicate | Choice |
|---|---|---|
| `tools.flaky` | `commandFlaky` | `exclude:flaky` |
| `tools.slow` | `commandDuration` greater than the time limit of the command | `exclude:slow` |
| `tools.budget` | `cycle` greater than 2, `checkShare` greater than the cap, and the command is the slowest of the set | `exclude:budget` |
| `tools.default` | — | `run` |

Decision point `loop`. Choice set: `stay`, `off:<registered layer>`.

| Rule id | Predicate | Choice |
|---|---|---|
| `loop.integrity` | `integrityKind` present and not `changed-during-check` | `off:micro` |
| `loop.check-error` | `checkError` is `cannot-start` | `off:micro` |
| `loop.caps` | `cyclesLeft` equal 0, or `unresolvedUnits` not less than the cap | `off:micro` |
| `loop.no-check` | `innerCount` equal 0 and `uncheckedStreak` not less than 2 | `off:micro` |
| `loop.single-unit` | `phaseTasks` equal 1, or `unitTasks` equal `phaseTasks` at the first unit | `off:micro` |
| `loop.default` | — | `stay` |

The rows that switch the layer of parallel units off are contributed by feature 142, which
consults this decision point for its own layer.

Decision point `escalation`. Choice set: `next-tier`, `skip:<skip reason>`.

| Rule id | Predicate | Choice |
|---|---|---|
| `esc.off` | not `escalationOn` | `skip:off` |
| `esc.integrity` | `conditions` holds `tainted` or `cached`, or `integrityKind` present | `skip:integrity` |
| `esc.flaky` | `commandFlaky` for a failed command | `skip:flaky` |
| `esc.not-due` | not `signatureRepeated`, or `repairsUsed` not equal 1 | `skip:not-due` |
| `esc.cap` | `escalationsTask` not less than 1, or `escalationsAttempt` not less than 2 | `skip:cap` |
| `esc.no-ladder` | `nextTier` absent | `skip:no-ladder` |
| `esc.critic-collision` | `targetIsCriticModel` (equal in model and in effort) | `skip:critic-collision` |
| `esc.quota` | `targetQuotaExhausted` | `skip:quota` |
| `esc.budget` | not `budgetAllows` | `skip:budget` |
| `esc.default` | — | `next-tier` |

The choice `next-tier` on a rung for which `targetSharesCriticModel` is true raises the
critic-diversity warning (F115-FR-034; F100-FR-130; `assumption: CQ-191`). The signal is recorded
with the decision and changes no choice.

### Events of the layer

The types are those of the event catalogue of feature 111, which owns the names and the fields
(F115-FR-037). Every type of the table is in the catalogue
(`specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`, read on 2026-09-30). Eight
of them were added by feature 111 after the cross-feature review (item W-111-02). Where feature
111 changes a name, this table follows. The eight project to nothing in the compatibility
projection (DV-016).

| Fact | Event type | In the catalogue |
|---|---|---|
| The strategy selected for a run, with the manifest hashes and the fallback reason | `strategy.selected` | Yes, added after the review; the register names it `loop_strategy_selected` (DV-016) |
| The strategy of a phase attempt | `attempt.started`, field `strategy` | Yes |
| A phase attempt that ended without a declared unit | `microloop.inert` | Yes, added after the review; the register names it `micro_inert` (DV-016) |
| A checkpoint accepted | `checkpoint.accepted` | Yes, added after the review |
| A checkpoint refused, with the reason (annex X §X.6 row 138) | `checkpoint.refused` | Yes, added after the review |
| A checkpoint removed at the start of a pass | `checkpoint.removed` | Yes, added after the review |
| Each inner check and each closing check | `check.started`, `check.ended`, with `unitId` and `runner` `runtime` | Yes |
| The outcome of a unit (annex X §X.6 row 136); the layer going off, with the cause of the record `disengaged` (field `layerOff`) and, where one applies, the fallback reason of annex X §X.6 row 59 (field `fallbackReason`) | `microloop.unit` | Yes |
| An exclusion of a command, with the reason | `check.excluded` | Yes, added after the review |
| A decision of the router; an escalation made (point `escalation`, choice `next-tier`); the signal `targetSharesCriticModel` that carries the critic-diversity warning of an escalation | `route.decided` | Yes |
| An escalation skipped, with the reason (annex X §X.6 row 140) | `escalation.skipped`, beside the `route.decided` of the decision | Yes |
| An integrity event, with its kind (annex X §X.6 row 65): `ledger-invalid`, `manifest-mismatch`, `pin-mismatch` | `integrity.noted` | Yes |
| The tripwire raised, with the breach kind (annex X §X.6 row 141) and the rule id | `tripwire.raised` | Yes, added after the review |
| The tripwire cleared, written in the next engine start | `tripwire.cleared` | Yes, added after the review |

### Integrity rules and their tests

IR-01 to IR-30 are of R23 as amended by R23v; IR-31 to IR-57 of R23v; IR-58 to IR-60 of R27.
"Owned here" means that this feature specifies the rule and its test. A rule owned elsewhere
is named with the contract of feature 100 through which this feature meets it; its test belongs
to the owner named by feature 100.

| Rule | Subject | Owned here | Requirement | Test |
|---|---|---|---|---|
| IR-01 | No writer of the phase gate in the layer | Yes | F115-FR-002 | CT-115-101 |
| IR-02 | Conditions of an approval | No: annex E §E.1, annex B §B.14 | F115-FR-039 (as a breach kind) | — |
| IR-03 | The verification gate runs every command; no inner result replaces an execution | No: annex C §C.8 | F115-FR-028 | — |
| IR-04 | Inner results have a grammar of their own; no nonce while the pass loop runs | No: annex E §E.1 | — | — |
| IR-05 | An inner result delays and never skips the phase gate | Yes | F115-FR-028 | CT-115-105 |
| IR-06 | Inner events change no counter of the outer loop | Yes | F115-FR-027 | CT-115-106 |
| IR-07 | No exit code and no stop reason | Yes | F115-FR-025 | CT-115-107 |
| IR-08 | Manifest hash verified before every check; exclusions by the runtime only | Yes, for the verification and the exclusions; the derivation: annex D §D.8 | F115-FR-014, F115-FR-023 | CT-115-108 |
| IR-09 | A checkpoint is a claim | Yes | F115-FR-009 | CT-115-109 |
| IR-10 | The runtime runs each check itself | Yes, for the result; the runner: annex C §C.8 | F115-FR-015 | CT-115-110 |
| IR-11 | Two classes, fingerprint at phase entry, `tainted` | No: annex C §C.8 (guarantees of the core), annex C §C.14 | — | — |
| IR-12 | Authorisation from the task text at launch | No: annex D §D.7 (field `protected`) | — | — |
| IR-13 | Output of a test the proposer ran is never a result | Yes | F115-FR-015 | CT-115-113 |
| IR-14 | Flaky | Yes | F115-FR-020 | CT-115-114 |
| IR-15 | `unchecked` | Yes | F115-FR-021 | CT-115-115 |
| IR-16 | Results bound to the fingerprint | No: annex D §D.7 (field `units`) | — | — |
| IR-17 | The fact block is built from the control plane | No: annex D §D.7 | — | — |
| IR-18 | The same final state gives the same block | No: annex D §D.7 | — | — |
| IR-19 | Grounding refuses the control plane | No: annex B §B.2, F100-FR-037 | — | — |
| IR-20 | Marker token on failure blocks | Yes, for the token; the removal before the critic: annex D §D.7 owner of the slot | F115-FR-018 | CT-115-120 |
| IR-21 | The critic is a fresh session without tools | No: annex C §C.1, annex A §A.5 | — | — |
| IR-22 | The fact block inside the budget of the critic | No: annex D §D.7 owner of the slot | — | — |
| IR-23 | Pass given back; bound on passes | Yes | F115-FR-027 | CT-115-123 |
| IR-24 | The no-progress test excludes the outbox | No: annex D §D.1 (classic accounting) | — | — |
| IR-25 | The ledger is chained and validated | Yes, for the namespace and the effect; the envelope: annex B §B.13 | F115-FR-030, F115-FR-032 | CT-115-125 |
| IR-26 | Counts of the layer survive a resume | Yes | F115-FR-032 | CT-115-126 |
| IR-27 | Strategy pinned at launch; fallback announced | Yes | F115-FR-001, F115-FR-005 | CT-115-127 |
| IR-28 | Breach of the integrity of the phase gate | Yes | F115-FR-039 | CT-115-128 |
| IR-29, IR-30 | First-failure predicate; partial step runs | No: annex D §D.6, annex C §C.8 | — | — |
| IR-31 | Fingerprint before and after | No: annex C §C.8, F100-FR-097, F100-FR-098 | — | — |
| IR-32 | End the processes of the pass before a check | Yes | F115-FR-015 | CT-115-132 |
| IR-33 | Tree at phase entry equals the approved tree | No: annex D §D.7, F100-FR-136 | — | — |
| IR-34 | The layer only where the verification gate executes | Yes | F115-FR-004 | CT-115-134 |
| IR-35 | Scope of the fingerprint | No: annex C §C.8, annex C §C.14 | — | — |
| IR-36 | Executables, search path, configuration of the toolchain | No: annex D §D.8 (pins), annex C §C.14 | — | — |
| IR-37 | Caches; `cached` is not a pass | No: annex C §C.8 (condition `cached`), annex C §C.14 | — | — |
| IR-38 | Class A as patterns | No: annex C §C.14 | — | — |
| IR-39 | Suppression markers | No: annex C §C.14, annex D §D.7 | — | — |
| IR-40 | Exit result and conditions in separate fields | No: annex C §C.8, F100-FR-097 | — | — |
| IR-41 | Authorisation covers class A | No: annex D §D.7 (field `protected`) | — | — |
| IR-42 | Integrity events reach the critic | No: annex D §D.7 (field `integrity`) | — | — |
| IR-43 | Results per command and tree | No: annex D §D.7 | — | — |
| IR-44 | Escaping inside a data boundary | No: annex D §D.7, F100-FR-135 | — | — |
| IR-45 | Grounding refusals | No: F100-FR-037 | — | — |
| IR-46 | No fingerprint value per row | No: annex D §D.7 | — | — |
| IR-47 | The escalation target equals no critic-class call in model and in effort; a rung that shares the model alone raises the critic-diversity warning | Yes, for the target and the warning of an escalation; the warning at the phase gate: annex A §A.5, F100-FR-024 | F115-FR-034 | CT-115-147 |
| IR-48 | Checkpoint passes leave the consecutive breakers | Yes | F115-FR-027 | CT-115-148 |
| IR-49 | No stop once phase evidence exists | Yes | F115-FR-029 | CT-115-149 |
| IR-50 | Interrupted checks; counts per task id | Yes, for (a) and (d); (b) and (c): annex B §B.13 | F115-FR-024, F115-FR-022 | CT-115-150 |
| IR-51 | First-failure predicate | No: annex D §D.6 | — | — |
| IR-52 | Inertness | Yes | F115-FR-006 | CT-115-152 |
| IR-53 | Limits of the router; the failure signature | Yes | F115-FR-019, F115-FR-036 | CT-115-153 |
| IR-54 | Manifest compared on a relaunch | No: annex D §D.8, row 33 of annex X §X.7 | — | — |
| IR-55 | Handling of the checkpoint file | Yes | F115-FR-010 | CT-115-155 |
| IR-56 | Task list read at launch | Yes | F115-FR-012 | CT-115-156 |
| IR-57 | Separate keys | No: annex B §B.13 | — | — |
| IR-58 | No difference until engaged | Yes | F115-FR-007 | CT-115-158 |
| IR-59 | Grounding refuses the event stream | No: F100-FR-037 | — | — |
| IR-60 | No commit, no revert | Yes, in its old words | F115-FR-017 | CT-115-160 |

Owned here: 28 rules. Owned elsewhere: 32 rules, 18 of which moved with the split.

### Threats of the threat model owned here

Feature 100, annex X §X.9 names this feature as an owner of these threats.

| Threat | Control | Requirements |
|---|---|---|
| T-19 The proposer edits what a check reads (with the owner of the protected set, annex C §C.14) | The hash of the check manifest and the pins verified before every check | F115-FR-014 |
| T-21 A check runs repository code with the runtime's environment | The check runner's environment, containment and time limit (annex C §C.8); the layer passes the containment level of the proposer or a stricter one | F115-FR-013, F115-FR-015 |
| T-22 An inner result is taken for a verdict | No writer of the phase gate; the tripwire | F115-FR-002, F115-FR-039 to F115-FR-041 |
| T-23 Repair history reaches the critic | Records in the control plane; the marker token; the note of a checkpoint never reaches a critic-class call | F115-FR-009, F115-FR-010, F115-FR-018 |
| T-49 Several workers on one phase (with 142 and 117) | An integrated group is one unit | F115-FR-042 |

### Key Entities

| Entity | What it is |
|---|---|
| Unit of work | One or more tasks of the current phase, declared in a checkpoint. It has an id, the tasks it named, and an outcome |
| Checkpoint | The file in which a pass declares a unit of work. A claim |
| Inner check | One run of the inner check set on a unit. It has a result per command with its conditions |
| Cycle | One unit declared and checked. Counted against the cycle cap |
| Tree fingerprint | The fingerprint of the working tree that a kept unit is bound to. An input of the layer (annex D §D.1) |
| Router rule table | Versioned data: decision points, signals, rows |
| Integrity event | A detected and refused act, or a detected difference. It reaches the critic by kind |
| Breach | A broken invariant of the integrity of the phase gate. It raises the tripwire |
| Tripwire record | The record in user-level state that keeps every loop layer off until it is cleared |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F115-SC-001**: Time from launch to all phase gates approved on a reference project, reported per stage against the measured baseline. In experiment X5, on the fixed 50:50 mix, the default configuration against the parity configuration shows: alive hours per approved phase at least 25 per cent lower (baseline 1.22 hours at the median), with a one-sided 90 per cent interval that excludes 0; passes ended by a time limit or a watchdog, and runs stopped by the pass limit, at least 50 per cent lower (baseline 37 of 515 passes); first-attempt approval within 5 points; cost per approved phase no higher. Both strata are reported apart.
- **F115-SC-002**: The layer earns its place. In experiment X6, against the same configuration without the layer, killed passes are at least 50 per cent lower, and time, quality and cost are no worse.
- **F115-SC-003**: The layer never approves. On 100 per cent of runs, no approval exists without a critic reply that matches the nonce, made after the full verification gate executed in the same phase attempt. The invariant is asserted on every run.
- **F115-SC-005**: It works on every harness. The layer at L1 completes the descriptor-only fixture on a harness that no run has verified.
- **F115-SC-006**: Inertness. On every fixture family of the second suite, 0 differences outside the layer allowlist, and equal counters for every phase.
- **F115-SC-007**: No new way to end. Over all fixtures with the layer on, the sets of exit codes, stop reasons and run states are subsets of those with the layer off.
- **F115-SC-009**: Resume is complete. For each of the 5 resume states and each of the 11 record kinds, a fixture stops and resumes, and the counts after the resume equal the counts before it.
- **F115-SC-010**: Every rule has a test. 28 of 28 integrity rules owned here have a passing test; every cap and every fallback reason has a passing test.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Micro-loops are on by default in Wave 1 and can be turned off in configuration | Decision 21 |
| In Wave 1 inner checks are deterministic commands only; no model acts as inner reviewer | Decision 21 |
| This layer works units one after the other. Agent parallelism is an option of feature 142, off by default | Ruling 56 |
| Every numeric default has low confidence and is a starting value for the experiments | R27 |
| One engine; the layer never approves; the critic sees final results and no repair history; inner cycles count against their own caps only; the layer works on every harness; every run records its strategy; the layer stays the default only if it earns it | Decision 21, fixed points |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, how a fingerprint
is computed, and the spelling of internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-04 | `specstride.loop-layer/1` | implements | The implementation `micro` |
| EP-06 | `specstride.router-rules/1` | implements (content owner) | The shipped router table, its conformance suite and its sample |
| EP-15 | `specstride.prompt-block/1` | implements | The checkpoint contract block; the failure block of a repair |
| EP-05 | `specstride.check-runner/1` | consumes | Inner checks and the closing check |
| EP-03 | `specstride.spec-format/1` | consumes | Task ids of the canonical spec model |
| EP-02 | `specstride.harness/1` | consumes | The model-tier ladder, the continuation capability, the containment level |
| EP-14 | `specstride.doctor/1` | consumes | The checks of the tripwire and of the invariants |

Conformance, as the brief sets it. EP-06: golden decisions per row, and the property that exactly
one row fires for every vector of signals.

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Loop-layer interface: call points, directives, guarantees | `specstride.loop-layer/1` | Annex D §D.1, F100-FR-114 to F100-FR-120 |
| Router rule table | `specstride.router-rules/1` | Annex D §D.4, F100-FR-129, F100-FR-130 |
| Table evaluator | `specstride.table/1` | Annex X §X.3, F100-FR-204 |
| Prompt block provider | `specstride.prompt-block/1` | Annex D §D.5, F100-FR-131 |
| Fact block (content owner 116): the rows the layer returns; the further facts; what is never in the block | `specstride.fact-block/1` | Annex D §D.7, F100-FR-135 |
| Check manifest | `specstride.manifest/1` | Annex D §D.8, F100-FR-137 |
| Check runner; the conditions of a result; fingerprints before and after a check | `specstride.check-runner/1` | Annex C §C.8, F100-FR-097 |
| Toolchain profile (content owner 116), read only for the value `basic` of the `[LOOP]` line | `specstride.toolchain/1` | Annex C §C.14 |
| Canonical spec model | `specstride.spec-format/1` | Annex C §C.7, F100-FR-095 |
| Harness port; sessions; containment levels | `specstride.harness/1` | Annex C §C.1, F100-FR-077, F100-FR-083; §C.15, F100-FR-111 |
| Ledger | `specstride.ledger/1` | Annex B §B.13, F100-FR-068, F100-FR-069 |
| Tripwire record | `specstride.tripwire/1` | Annex B §B.18, F100-FR-074 |
| Rules of the layout; logical names | `specstride.layout/1` | Annex B §B.2, F100-FR-035, F100-FR-040; §B.5 |
| Identifiers (`unitId`) | — | Annex B §B.3, F100-FR-044 |
| Approval record | `specstride.approval/1` | Annex B §B.14 |
| Run record (`loop`, `containment`) | `specstride.run-state/1` | Annex E §E.2, F100-FR-143 |
| No run state, exit code or stop reason from a layer | — | Annex A §A.5, F100-FR-031 |
| CLI protocol (`tripwire clear`); line grammar (`[LOOP]`); exit codes | protocol 1 | Annex G §G.1; §G.3, F100-FR-178, F100-FR-179; §G.4, F100-FR-186 |
| Doctor check registry | `specstride.doctor/1` | Annex G §G.7 |
| Event envelope (`strategy`) | `specstride.event/1` | Annex X §X.1, F100-FR-198 |
| Kernel: the atomic write and what the core may not import; the ports of the edge packages | — | Annex A §A.3, F100-FR-012, F100-FR-234 |
| Config envelope and trust classes | `specstride.config/1` | Annex X §X.2, F100-FR-202 |
| List of closed sets | — | Annex X §X.6, rows 55, 56, 59, 67 and 136 to 141 (owned); rows 27, 53, 65, 66 (read) |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, rows 1, 2, 3, 64, 65 (owned); rows 10, 13, 19, 20, 24 (read) |
| Threat model | — | Annex X §X.9, T-19, T-21, T-22, T-23, T-49 |

Logical names used: `phase:<N>:manifest`, `unit:<unitId>:checkpoint`, `unit:<unitId>:check:<i>`,
`attempt:<N>:<k>:<n>:evidence`, `run:<runId>:ledger`, `run:<runId>:record`,
`feature:<slug>:outbox`, `user:tripwire`, and `run:<runId>:task-list`, which the engine writes at
launch and this layer reads (annex B §B.5). The layer stores no task list of its own.

Fixture families of feature 141 cited: none for a parity test, since this feature has no as-is
behaviour (feature 141, §O.7). The second suite (F141-FR-039 to F141-FR-042) proves inertness on
every family FX-01 to FX-40 other than the retired FX-37.

## Rows of the `parity` profile

Rows that exist (feature 100, annex X §X.7):

| Row | Switch | Key | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 1 | Loop strategy | `loop.strategy` | `micro` | `classic` | DV-012 | F115-FR-001 |
| 2 | Closing check | `loop.micro.closing_check` | on | off | DV-046 | F115-FR-028 |
| 3 | Escalation of the model tier as the second repair | `loop.escalation` | on | off | DV-050 | F115-FR-034 |

Further rows of annex X §X.7 that this feature owns: row 64 and the ten keys of row 65. The
spelling of each key is that of annex X §X.7. The three keys that carry minutes end in `Min`
(`assumption: CQ-160`). Register row of row 64: none; of row 65: DV-012.

| Switch | Key | Default | Under `parity` | Class | Row | Requirement |
|---|---|---|---|---|---|---|
| Routing | `loop.routing` | on | not used | Narrowing | 64 | F115-FR-033 |
| Repairs per task id | `loop.micro.caps.repairs` | 2 | not used | Narrowing | 65 | F115-FR-022 |
| Escalations per task id | `loop.micro.caps.escalationsPerTask` | 1 | not used | Narrowing | 65 | F115-FR-034 |
| Escalations per phase attempt | `loop.micro.caps.escalationsPerAttempt` | 2 | not used | Narrowing | 65 | F115-FR-034 |
| Time per proposal | `loop.micro.caps.proposalMin` | 20 | not used | Narrowing | 65 | F115-FR-022 |
| Time per unit | `loop.micro.caps.unitMin` | 30 | not used | Narrowing | 65 | F115-FR-022 |
| Time per check command | `loop.micro.caps.checkMin` | 5 | not used | Narrowing | 65 | F115-FR-023 |
| Share of inner check time | `loop.micro.caps.checkSharePercent` | 15 | not used | Narrowing | 65 | F115-FR-023 |
| Cycles per phase attempt, added to the number of tasks | `loop.micro.caps.cyclesExtra` | 6 | not used | Narrowing | 65 | F115-FR-022 |
| Cycles per phase attempt, least value | `loop.micro.caps.cyclesMin` | 12 | not used | Narrowing | 65 | F115-FR-022 |
| Unresolved units before the layer goes off | `loop.micro.caps.unresolvedUnits` | 2 | not used | Narrowing | 65 | F115-FR-022 |

The re-run of a flaky check (one) and the returns after a closing check (two) are fixed and are
not options.

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 115.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 55 | Loop strategies | `classic`, `micro` | Owner decision | Configuration error |
| 56 | Micro levels | L0 (no layer), L1 (the pass ends at the checkpoint), L2 (a check inside the pass), L3 (several units in a continued session). Wave 1 uses L1 | Design | Configuration error |
| 59 | Fallback reasons of the layer `micro` | `gate-not-executing`, `no-check`, `single-unit`, `harness`, `config`, `tripwire` | Design | Shown as text |
| 67 | Decision points of the router and their choice sets | `tools`: `run`, `exclude:flaky`, `exclude:slow`, `exclude:budget`. `loop`: `stay`, `off:<registered layer>`. `escalation`: `next-tier`, `skip:<skip reason>`. `attempt-tier` (of the attempt planner, owner 149; listed here because the row holds it, not specified here): `bump`, `skip`, `none`. A layer may register a point | Design | The table is invalid |
| 136 | Outcomes of a unit of work | `kept`, `repair`, `unresolved` | Design | Read as `unresolved` |
| 137 | Status of a unit or task without a result | `unchecked` | Design | Read as `unchecked` |
| 138 | Refusal reasons of a checkpoint | `pass-killed`, `foreign-id`, `yield-in-pass`, `not-regular`, `stale`, `too-large`, `changed-while-read`, `empty` | Design | The checkpoint is refused |
| 139 | Record kinds of the ledger namespace `micro` | `unit-declared`, `check-started`, `check-finished`, `unit-kept`, `unit-repair`, `unit-unresolved`, `command-excluded`, `escalation`, `closing-check`, `disengaged`, `integrity` | Design | The ledger is invalid for the layer; the layer is off for the phase attempt |
| 140 | Skip reasons of an escalation | `off`, `integrity`, `flaky`, `not-due`, `cap`, `no-ladder`, `critic-collision`, `quota`, `budget` | Design | Read as a skip; shown as text |
| 141 | Breach kinds of the integrity of the phase gate | `approval-without-gate`, `outer-counter-changed`, `critic-input-excluded-field`, `false-pass` | Owner decision (decision 21; ruling 42) | Treated as a breach |

Sets this feature reads and does not own. Row 27 (`protection`), row 65 (integrity kinds that
reach the critic) and row 66 (further facts of the fact block) belong to feature 116, which owns
the fact block and the protected set, as do row 142 (classes of the protected set) and row 143
(freshness of a result), of which this feature lists no member. The causes of the ledger record `disengaged` are a set of this feature without a row of annex X §X.6: `caps`, `integrity`, `check-error`, `no-check`, `single-unit`, `layer-error`, `breach` (feature 111, `data-model.md`, and its question N-111-1); a fallback reason goes with `no-check` and `single-unit` only. This feature raises integrity events of the kinds
`ledger-invalid`, `manifest-mismatch` and `pin-mismatch`, and gives the further facts
`evidence-predates-tree` and `task-list-changed`. Row 53 (result conditions of a check, and the
reasons of `unchecked`) belongs to the feature that owns the check runner; this feature reads
the conditions `tainted`, `cached`, `flaky`, `interrupted` and `unchecked`, and excludes commands
with the reasons `slow` and `budget`.

Row 63 (refusal reasons of a delta) names feature 142 as owner in annex X §X.6. This feature
lists no member of it.

Rule for an unknown value, for every set above: a reader does what the column says; a writer
never writes a value outside the set.

## As-is behaviour not carried

The traceability files assign no row to feature 115: no as-is requirement, no success criterion
and no behaviour item, with any disposition. The README's old use of "micro-loop" is the recovery
cycle and belongs to feature 101.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

Three existing mechanisms are touched by exemption. Their behaviour items stay with features 103
and 118; this feature changes them only with the layer engaged.

| Mechanism | Items (owned elsewhere) | Register row | Requirement |
|---|---|---|---|
| Short-pass nudge | B-0540, B-0541, B-0558 | DV-013 | F115-FR-027 |
| Pass limit (as-is: the iteration limit, `MAX_ITER`) | B-0040, B-0775 | DV-014 | F115-FR-027 |
| Repeat-stall watchdog | B-0491, B-0492, B-0602 | DV-015 | F115-FR-027 |

## Requirements moved to 116-check-integrity-and-unit-evidence

Requirement group G-B left this feature at the split. The old ids and the old test names are
not reused here. Nothing in this specification cites a requirement of the other part; where the
two meet, the contract of feature 100 is named.

| Old id | New id | Old tests | New tests |
|---|---|---|---|
| F115-FR-043 | F116-FR-001 | CT-115-43; CT-115-111 | CT-116-1; CT-116-111 |
| F115-FR-044 | F116-FR-002 | CT-115-44; CT-115-138 | CT-116-2; CT-116-138 |
| F115-FR-045 | F116-FR-003 | CT-115-45; CT-115-135 | CT-116-3; CT-116-135 |
| F115-FR-046 | F116-FR-004 | CT-115-46; CT-115-111 | CT-116-4; CT-116-111 |
| F115-FR-047 | F116-FR-005 | CT-115-47; CT-115-131 | CT-116-5; CT-116-131 |
| F115-FR-048 | F116-FR-006 | CT-115-48; CT-115-111 | CT-116-6; CT-116-111 |
| F115-FR-049 | F116-FR-007 | CT-115-49 | CT-116-7 |
| F115-FR-050 | F116-FR-008 | CT-115-50; CT-115-116; CT-115-140 | CT-116-8; CT-116-116; CT-116-140 |
| F115-FR-051 | F116-FR-009 | CT-115-51; CT-115-136; CT-115-137 | CT-116-9; CT-116-136; CT-116-137 |
| F115-FR-052 | F116-FR-010 | CT-115-52; CT-115-112; CT-115-141 | CT-116-10; CT-116-112; CT-116-141 |
| F115-FR-053 | F116-FR-011 | CT-115-53; CT-115-139 | CT-116-11; CT-116-139 |
| F115-FR-054 | F116-FR-012 | CT-115-54; CT-115-133 | CT-116-12; CT-116-133 |
| F115-FR-055 | F116-FR-013 | CT-115-55 | CT-116-13 |
| F115-FR-056 | F116-FR-014 | CT-115-56 | CT-116-14 |
| F115-FR-057 | F116-FR-015 | CT-115-57 | CT-116-15 |
| F115-FR-058 | F116-FR-016 | CT-115-58; CT-115-117 | CT-116-16; CT-116-117 |
| F115-FR-059 | F116-FR-017 | CT-115-59; CT-115-140; CT-115-146 | CT-116-17; CT-116-140; CT-116-146 |
| F115-FR-060 | F116-FR-018 | CT-115-60; CT-115-143 | CT-116-18; CT-116-143 |
| F115-FR-061 | F116-FR-019 | CT-115-61 | CT-116-19 |
| F115-FR-062 | F116-FR-020 | CT-115-62; CT-115-118 | CT-116-20; CT-116-118 |
| F115-FR-063 | F116-FR-021 | CT-115-63; CT-115-142; CT-115-144 | CT-116-21; CT-116-142; CT-116-144 |
| F115-SC-004 | F116-SC-001 | — | — |
| F115-SC-008 | F116-SC-002 | — | — |

F115-SC-010 stays, for the 28 integrity rules that stayed. As-is origins that moved: none.

What moved with the requirements, and is owned by feature 116 in feature 100 since the repair of
2026-09-30: the content of EP-16 `specstride.toolchain/1`; the content of the fact block
`specstride.fact-block/1`; closed set rows 27, 65 and 66 of annex X §X.6 and rows 142 ("classes
of the protected set") and 143 ("freshness of a result"); row 32 of the `parity` profile; the
schema ids `specstride.protected-set/1` and `specstride.check-result/1` and the schema of the
toolchain profile; the package `@specstride/integrity`; the questions CQ-085 and, for the record
of the protected set, CQ-084. This feature claims none of them.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Does fail-fast belong to this feature, as R27 places it? → A: No. The first-failure predicate is its own switch and belongs to feature 118; nothing rides on the switch of the layer. The `[LOOP]` line only reports `failfast-stops`. (Source: `architecture.md` section 14; brief 115 heading 1; F100-FR-134)
- Q: How many repairs and proposals does a unit get, given that R25 allows up to six proposals? → A: Two repairs, three proposals; the escalated proposal is the second repair and never an addition. Integrated in F115-FR-022 and F115-FR-034. (Source: `APPROVAL.md` ruling 46; R27 D-03)
- Q: What happens when the quota of the escalation target is exhausted, given that R25 pauses the run? → A: The escalation is skipped, the repair runs on the base model tier, the skip is recorded. Integrated in F115-FR-034. (Source: `APPROVAL.md` ruling 47)
- Q: Does a change of a protected file switch the layer off, as R22 and R25 say? → A: No. The result carries `tainted`, the unit is not kept, the failure counts against the repairs; the layer goes off only through the ordinary caps and through integrity events other than a taint. Integrated in F115-FR-025. (Source: `APPROVAL.md` rulings 38, 41; R27 D-18)
- Q: Does the runtime commit kept units or revert unresolved ones? → A: No. Integrated in F115-FR-017. (Source: `APPROVAL.md` ruling 50; rule IR-60)
- Q: Do inner checks stop at the first failed command? → A: No. Every command runs in every check, so that the failure signature is complete. Integrated in F115-FR-013. (Source: `APPROVAL.md` ruling 51)
- Q: Does the closing check run in every phase attempt? → A: Only where a unit was declared, inside the cycle cap, with at most two returns to work. Integrated in F115-FR-028. (Source: `APPROVAL.md` ruling 45)
- Q: Does rule IR-60 name the two writes of ruling P1 in this feature? → A: No. For this layer the rule holds in its old words; the two writes belong to feature 142 and exist only with its option on. Integrated in F115-FR-017. (Source: brief 115 heading 4, last row; DV-085)
- Q: Is the router consulted in a phase attempt in which no unit was declared? → A: No. Annex D §D.4 says that every decision is an event; the inertness rule says that the layer executes nothing without a declared unit, and the layer allowlist of the second suite holds no routing event. So the router is consulted only once the layer is engaged, and the fallbacks of a run are decided at launch by the selection of the strategy. Integrated in F115-FR-006 and F115-FR-036. (Source: rule IR-52; DV-016; feature 141, F141-FR-040)
- Q: Does the router randomise between escalating and staying during the evaluation, as R25 proposes for its ablation? → A: No. The router is a pure function without randomness (F100-FR-129, F100-FR-204). Experiment X10 compares arms by the paired design. (Source: annex D §D.4; annex X §X.3)
- Q: Is the micro level a configuration option in Wave 1? → A: No. Wave 1 uses L1 on every harness, and the level is recorded. Continuation inside a phase attempt has its own switch, row 10 of the profile, which this feature does not own. Integrated in F115-FR-003. (Source: brief 115 headings 1 and 4; R27 D1.3)
- Q: Are counts of tests shown to the critic? → A: No, only counts of suppression markers; the unit id stays and no fingerprint value stands per row. The rule now stands with the content of the fact block (annex D §D.7). (Source: `APPROVAL.md` ruling 53)
- Q: What are the targets measured on? → A: On the default configuration against the parity configuration, on the fixed 50:50 mix, with every pass ended by any time limit counted as killed; the layer earns its place in its own ablation. Integrated in F115-FR-065. (Source: `APPROVAL.md` rulings 3, 4, 5)
- Q: How many rows does the divergence register have? → A: 113, DV-001 to DV-113. None of DV-095 to DV-113 bears on this feature. (Source: `consolidation.md` section 6; `STAGE-B-SPLIT-PROMPT.md`)
- Q: Who stores the task list as read at launch? → A: Its consumer, in the control plane (the recommended answer of CQ-044). This feature stores it in the control plane; the logical name is asked of feature 100 (CQ-181). Integrated in F115-FR-012. (Source: `CLARIFY-QUEUE.md` CQ-044; rule IR-56) Replaced on 2026-09-30: see the session below.
- Q: Who owns closed set row 63, which the assignment gives to this feature? → A: Annex X §X.6 names feature 142, and the set is the refusal reasons of a delta of a parallel worker. The annex stands; this feature lists no member. Reported. (Source: feature 100, annex X §X.6 row 63)
- Q: To which feature does a cap on continued passes belong? → A: Not to this feature. R27 D1.5 lists it; it is a drop rule of session continuation, whose content owner is named by row 10 of the profile. (Source: F100-FR-083; annex X §X.7 row 10)
- Q: How large may a checkpoint and its note be? → A: The sources say "bounded" and give no number. Starting values: 16 kilobytes for the file, 512 bytes kept of the note. Fixed values, not options; reported as CQ-086. Integrated in F115-FR-010. (Source: rule IR-09; R27 D1.2)
- Q: What happens when one pass writes a valid checkpoint and phase evidence? → A: Phase evidence ends the pass loop as in the classic loop; the checkpoint is accepted as a declaration and the closing check is its check. Integrated in F115-FR-028 and in the edge cases. (Source: R23 F-15, rows "Evidence" and "Yield"; R27 D1.7)
- Q: May a checkpoint name a task that an earlier unit named? → A: Yes. The final rows of a task are those of the last check whose unit included it; the counts per task id continue. Integrated in the edge cases. (Source: R23 F-16; rule IR-50 d)
- Q: Which calls are critic-class calls for the target rule of escalation? → A: The critic, the diagnostician and release verification. Integrated in F115-FR-034. (Source: `consolidation.md` glossary row 18; rule IR-47) When a rung equals such a call was settled on 2026-09-30: see the session below.
- Q: What is "the machine" of the tripwire? → A: The user-level state of the consumer who runs the product; the record has the logical name `user:tripwire`. Integrated in F115-FR-041. (Source: feature 100, annex B §B.1 and §B.18; `APPROVAL.md` ruling 42)
- Q: After the split, how does the layer get fingerprints and hand over the fact block without citing the other part? → A: Fingerprints are an input of a layer and the fact block is what the layer returns at `contributeCriticInput`; both are in annex D §D.1 and §D.7 of feature 100. The engine offers the builder of the fact block as a service that the layer declares. Integrated in F115-FR-002. (Source: feature 100, annex D §D.1, §D.7; `STAGE-B-SPLIT-PROMPT.md` step 4)
- Q: After the split, which breach kind names the fields a critic-class input must not hold? → A: `critic-input-excluded-field`, by the list "Never in the block" of annex D §D.7. Integrated in F115-FR-039. (Source: feature 100, annex D §D.7)
- Q: After the split, which part runs experiment X12? → A: This feature, with the other experiments. The seeded tamperings are fixtures of the feature that owns the conditions; the experiment uses them as data. Integrated in F115-FR-066. (Source: brief 115 heading 8; `STAGE-B-SPLIT-PROMPT.md`)
- Q: Which questions could the sources not answer? → A: Seven before the split, CQ-080 to CQ-086; CQ-085 moved with its requirements. One is new after the split, CQ-181. All are listed under "Assumptions".

### Session 2026-09-30, after the cross-feature review

Answered from feature 100 as repaired (`specs/100-specstride/repair-report.md`, table "What the
other features must follow") and from the repair worklist. No question was put to a person.

- Q: Under which logical name is the task list as read at launch kept, and who writes it? → A: `run:<runId>:task-list`, one per run, written by the engine at launch, read by the engine and the loop layers. The layer reads it and stores nothing under a name of its own. Integrated in F115-FR-012. (Source: feature 100, annex B §B.5; CQ-044 and CQ-181, answers applied; W-115-01)
- Q: Is an escalation rung on the model of a critic-class call always skipped? → A: No. `targetIsCriticModel` is true only when the rung equals a critic-class call in model and in effort. A rung that shares the model alone is used, and the critic-diversity warning is raised and recorded. Integrated in F115-FR-034, the signal table and rule IR-47. (Source: F100-FR-130 as repaired; `APPROVAL.md` rulings 46 and 49; CQ-191; W-115-02)
- Q: How are the three keys of row 65 that carry minutes spelled? → A: `loop.micro.caps.proposalMin`, `.unitMin`, `.checkMin`. (Source: feature 100, annex X §X.7 row 65; CQ-160; W-110-11)
- Q: Under which event types are the facts of F115-FR-037 written? → A: Under the types of the table "Events of the layer". The catalogue holds all of them; eight were added by feature 111 after the review (corrected from "seven" at the analyze run of 2026-09-30, evening). (Source: W-111-02; W-X-24; `specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`)
- Q: Which feature owns EP-16, the fact block, the protected set, the check result and closed set rows 142 and 143? → A: Feature 116. This feature claims none of them and reads the fact block and the conditions of a result through annex D §D.7 and annex C §C.8. (Source: `specs/100-specstride/repair-report.md`, rows 1, 3, 4, 7, 9)
- Q: What is the name of the limit on the passes of a phase attempt? → A: "Pass limit", counted by the "pass count"; a pass "is given back". The word "iteration" stays only in literals (`giveIterationBack`, `MAX_ITER`, `iter_*`, `loop.maxIter`). (Source: `specs/100-specstride/repair-report.md`, row 24; W-100-14)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register has 119 rows (DV-001 to DV-119, `consolidation.md` read on 2026-09-30); none of DV-095 to DV-119 adds a `divergence:` field to a requirement of this feature. The brief's figure is out of date.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The open questions of `CLARIFY-QUEUE.md` (to CQ-175 at the first reading; CQ-181 and CQ-191 of this feature since) are read with their recommended answers. CQ-023 (exit codes of `tripwire clear`), CQ-025 (first-match order of a rule table), CQ-028 (the second suite keeps compatibility output) and CQ-044 (where the task list as read at launch is stored) bear on this feature.
- The event catalogue of feature 111 holds the types of the table "Events of the layer". The register names two of the facts, `loop_strategy_selected` and `micro_inert` (DV-016).
- The harness port gives the model-tier ladder, the continuation capability and the containment level with their provenance; a value that no run has shown is `unverified`.
- The budget of a role and the state of a quota are given to the layer as signals of the read-only view of the phase attempt.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-080 | With which fallback reason does a run announce the classic loop while the tripwire record exists? Annex X §X.6 row 59 had five members and none fitted | A sixth member, `tripwire`; row 59 holds it since the amendments | F115-FR-005, F115-FR-041 |
| CQ-081 | When are the fallbacks `single-unit` and `no-check` decided? R25 decides them per phase before work starts; inertness forbids any act of the layer before a unit is declared | At engagement and after a unit, never before the first accepted checkpoint | F115-FR-005 |
| CQ-082 | How does the `[LOOP]` line say that a toolchain has the basic protection only? Annex G §G.3 fixes the keys and has none for it | As a suffix of the value of `protection`: `detect,basic` | F115-FR-038 |
| CQ-083 | Which set does the field `kind` of the tripwire record draw from? Annex B §B.18 named the integrity kinds; a breach is by definition not an integrity event | The breach kinds of this specification; annex B §B.18 names row 141 since the amendments | F115-FR-041 |
| CQ-084 | Does register row DV-052 cover every file of the control plane that exists only with the layer on? Its text names the check manifest and the record of its derivation | Yes, for the check manifest with the record of its derivation and its pins, and for the fingerprints of the protected set. Not for the task list as read at launch: `run:<runId>:task-list` is written in every run (annex B §B.5, F115-FR-012), so an allowlist entry for it would match nothing (feature 141, proposal P3 of its analyze run of 2026-09-30) | F115-FR-012 |
| CQ-086 | How large may a checkpoint and its note be? The sources say "bounded" | 16 kilobytes for the file; 512 bytes kept of the note; fixed values | F115-FR-010 |
| CQ-181 | Under which logical name is the task list as read at launch stored? | `run:<runId>:task-list` of annex B §B.5, written by the engine at launch and read by the layer. The answer is applied in feature 100; the name `phase:<N>:tasks-at-launch`, which this feature had asked for, is withdrawn | F115-FR-012 |
| CQ-160 | How are config keys spelled that carry a unit? | The three keys of row 65 that carry minutes end in `Min` | F115-FR-022, F115-FR-023 |
| CQ-191 | Does ruling 49 allow an escalation rung that is the critic's model at another effort? | Yes, with the critic-diversity warning, as F100-FR-130 reads | F115-FR-034 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items are those of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was
renumbered or reused. The test names CT-115-161 and CT-115-162 are new.

| Requirement | Item | What changed |
|---|---|---|
| F115-FR-005 | — | The remark on CQ-080 says that row 59 of annex X §X.6 now lists `tripwire`. No change of behaviour |
| F115-FR-010 | W-111-02 | The event of a removed checkpoint is named: `checkpoint.removed` |
| F115-FR-011 | W-111-02 | The event of a refusal is named: `checkpoint.refused`; the closed set is cited by its row, 138 |
| F115-FR-012 | W-115-01 | The task list as read at launch is `run:<runId>:task-list`, written by the engine; the layer reads it and stores no copy. The request for `phase:<N>:tasks-at-launch` is withdrawn. The difference at the phase gate goes to the builder of the fact block as `task-list-changed`. New test CT-115-162 |
| F115-FR-014, F115-FR-032 | W-X-24 | The integrity events are written as `integrity.noted` |
| F115-FR-022, F115-FR-023 | W-X-11; W-110-11 | The `parity:` lines cite row 65 of annex X §X.7 in place of "rows proposed". `assumption: CQ-160` for the keys that end in `Min` |
| F115-FR-023 | W-111-02 | The event of an exclusion is named: `check.excluded`. An exclusion is given to the builder of the fact block; the content of the block is of feature 116 |
| F115-FR-027 | W-100-14 | "Is given back", "pass count", "pass limit" in place of "iteration" and "iteration limit". The literal `giveIterationBack` stays |
| F115-FR-029 | — | The further fact goes to the builder of the fact block, which feature 116 owns; row 66 is cited |
| F115-FR-033 | W-X-11; W-111-02 | The `parity:` line cites row 64; the event of a decision is named: `route.decided` |
| F115-FR-034 | W-115-02 (CQ-191) | The target rule follows F100-FR-130 as repaired: a collision needs equal model and equal effort; a rung that shares the model alone is used with the critic-diversity warning. New signal `targetSharesCriticModel`. The event of a skip is named: `escalation.skipped`. New test CT-115-161 |
| F115-FR-037 | W-111-02; W-X-24 | The types are named in the new table "Events of the layer"; each inner check is added to the list; the layer writes no type that the catalogue does not hold |
| F115-FR-039 | W-X-18 | `ep:` line for EP-14 (consumes) |
| F115-FR-041 | W-X-06; W-111-02; W-X-18 | "In the next engine start" in place of "in the next run"; the events are named: `tripwire.raised`, `tripwire.cleared`; `ep:` line for EP-14 (consumes); the remark on CQ-083 says that annex B §B.18 now names row 141 |
| F115-SC-001 | W-100-14 | "Pass limit" |

Changed outside the requirements:

| Place | Item | What changed |
|---|---|---|
| Out of scope | — | The model-tier bump belongs to feature 149 (rows 24 and 128 of annex X §X.7), not to 101 |
| User stories 1 and 2 | W-100-14; W-115-02 | "Pass limit", "is given back"; the second scenario of user story 2 follows F115-FR-034 |
| The shipped router table | W-115-02 | `targetIsCriticModel` defined; `targetSharesCriticModel` added; the sentence on the warning under the table of `escalation` |
| Integrity rules | W-100-14; W-115-02 | Subjects of IR-23 and IR-47 |
| Contracts of feature 100 used | W-X-12; W-X-11; W-115-01 | Rows 136 to 141 and rows 64 and 65 are listed as owned; the kernel and the ports are listed; `run:<runId>:task-list` is a logical name read |
| Rows of the `parity` profile | W-X-11; W-110-11 | Rows 64 and 65 are rows of annex X §X.7 and no longer "needed"; `proposalMin`, `unitMin`, `checkMin` |
| Closed sets | W-X-12 | Rows 136 to 141 in place of "new"; row 67 lists the point `attempt-tier` of feature 149, as annex X §X.6 does; rows 142 and 143 are named as sets of feature 116 |
| Requirements moved | — | The list of what moved names the fact block, the two schema ids, rows 142 and 143 and the package `@specstride/integrity` |

### Re-check B-8.7 part F (2026-09-30)

Ripple R-115 of `docs/ecosystem/reviews/SECOND-PASS-LIST.md`, section F (`docs/ecosystem/reviews/B-8.7-F.md`). No id was renumbered or reused.

| Requirement or place | What changed |
|---|---|
| F115-FR-037 | The layer going off is recorded with the cause of its ledger record `disengaged` and, where one applies, the fallback reason (fields `layerOff` and `fallbackReason` of `microloop.unit`, F111-FR-008); `assumption: N-111-1` |
| Table "Events of the layer"; "Closed sets"; `data-model.md` (record `disengaged`) | The same wording; the seven causes named |
