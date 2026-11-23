# Feature Specification: Loop feedback speed

**Feature Branch**: `153-loop-feedback-speed` (a label: Spec Kit creates no branch in this repository; the directory is `specs/153-loop-feedback-speed`)

**Created**: 2026-11-12

**Status**: Ready for implementation

**Input**: User description: "Feature 153-loop-feedback-speed of Specstride: make the propose → verify → review → commit loop materially faster without giving up its governance, by fixing the feedback path first — (1) cheap, early, specific deterministic feedback; (2) the loop reports on itself; (3) parallel and scoped checks with an enforced time limit; (4) per-task critic evidence with carried-over confirmations; (5) task-group units with a real handoff between passes (`docs/loop-feedback-speed-prompt.md`, grounded 2026-11-12)."

**Sources**: `docs/loop-feedback-speed-prompt.md` (the feature, the measurements, code anchors A1 to A17, required behaviours 1 to 5) and its ledger `docs/prompts/2026-11-12-loop-speed-grounding-ledger.md` (rows M1 to M11, C1 to C15, T1 to T8, R1 to R6); `specs/153-loop-feedback-speed/constitution-grounding.md` (constitution v3.0.3, tensions T-a to T-j, 28 constraints carried into this stage, CQ-153-01 to CQ-153-04); feature 100 annexes A (F100-FR-009, -031), C (§C.8, F100-FR-232), E (§E.1 to §E.4, F100-FR-148), G (§G.4) and X (§X.6 rows 7, 272, 273; §X.7 rows 1, 7, 8, 126, 134; F100-FR-212); features 101 (F101-FR-005, -011, -014, -017, -029, -031, -033, -035, -052), 103 (F103-FR-003, -041, -042), 105 (F105-FR-005, -006, -007, -009, -015, -017, -018, -020, -032, -033, -037), 111 (F111-FR-001, -004, -010, -016, -019; `contracts/event-catalogue.tsv`), 115 (F115-FR-009, -013, -018, -022, -023, -027), 116 (F116-FR-003, -005, -006, -008, -016 to -019), 117 (F117-FR-003 to -012, -018, -021, -027, -029, -030 to -032), 118 (F118-FR-006, -007, -011), 129 (F129-FR-001, -015), 148 (F148-FR-001 to -005, -007, -011 to -017), 149 (F149-FR-004), 152 (F152-FR-001 to -024); `docs/prompts/2026-11-08-huntley-grounding-ledger.md` row E3; https://ghuntley.com/ralph/. Code read on `main` @ `efe8897f` (paths in Assumptions only).

**Platform**: Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated, and every statement about macOS is `unverified` (feature 100, Decision 12; ruling 67; F100-FR-025).

## What this feature is

A phase of a feature goes through a loop: the proposer works in passes, the runtime runs the
verification gate, an independent critic judges, the engine writes the approval record, ticks the
tasks and commits. On the engine's own feature 152 that loop needed 11 to 13 phase attempts per
approved phase (ledger M1), and of at least 36 rejections at most 7 were the critic finding work
that was really missing or wrong (M4). The rest were loop mechanics: a red gate whose notice said
only "- npm test FAILED" (17 notices, all 212 bytes, M5), a critic that could not see the work (8),
and a deterministic commit check that ran after an opinion (4).

This feature removes the measured losses of the loop — red gates that name no failure, a critic
that cannot see the work, a deterministic check that runs after an opinion, a suite that runs
twice on one tree — without giving up its governance, in the order of work of the feature input:

1. **Cheap, early, specific deterministic feedback.** The gate runs the declared commands through
   the one check runner; a red gate tells the proposer what failed; a red gate spends its own
   bounded budget rather than a critic rejection; the commit scan runs before the critic and can be
   run by the proposer in its pass; every check has an enforced time limit. Reuse of a green in-pass
   result at the gate is specified only behind a constitution amendment.
2. **The loop reports on itself.** Timed events for the gate, the critic and the commit gate, an
   `attempt.ended` for every started attempt, and a read-only `specstride report`.
3. **Parallel and scoped checks.** Parallel workspaces with isolation kept, scoped in-pass
   selection, the full declared suite at the approval gate.
4. **Per-task critic evidence and carried confirmations** through the verdict pins.
5. **Task-group units** with a declared acceptance check per group, and the pass handoff.

Several of these are already required by a spec and not delivered by the engine (see "Where the
spec already requires it"). Those are written as "deliver F1xx-FR-nnn in the engine path".

Governance stays: one separate critic, nonce-bound verdicts, signed approval records, the single
ingress, closed vocabularies changed only by ruling, and every new behaviour off under `parity`
until a register row turns it on. Nothing in this feature grants an approval; everything in it can
only withhold one or inform.

**In scope**: groups G0 (governance restated) to G6 below; the parity rows, closed sets,
cross-spec amendments and ruling requests of this feature.

**Out of scope**:

| Out of scope | Why (one line) | Seam this spec leaves |
|---|---|---|
| Moving the attempt loop into `core` as a pure state machine (A17) | the engine's feature loop is one function of 2,705 lines with 52 cross-package imports (C3, C4); the move is a refactor of its own | Every decision this feature adds is a pure table with a rule id or a typed unit with a schema (F153-FR-008): gate-command resolution, reuse eligibility, red-gate budget, commit-scan unit, `endCause` mapping, workspace selection, group slicing, the report reader. Each is callable from a pure loop unchanged |
| Running the critic and the full suite alongside the next group, with a roll-back to the group's commit | Only safe once groups are small and checks are scoped; it needs the group as the unit of commit (CQ-153-07) | Groups with a declared write scope and acceptance check (G5); the group-approval routes of CQ-153-07 |
| Calling the diagnostician on repetition only (A14) | It costs 0.4 h in the sample (24 calls, median 54 s, M10), small against the rest | The report prints diagnostician calls and their durations from `recovery.diagnosis_started` and its closers (F153-FR-040) |
| The rest of the critic assembler of feature 117 in the engine path (role line F117-FR-021, block set F117-FR-029) | The engine's critic prompt is its own today (tracked defect D-2); this feature wires only the pins and the F117-FR-027 rule | F153-FR-048 to F153-FR-053 go through the critic assembler of feature 117, so wiring the rest of it later changes no requirement here |

## Rationale

Measured on feature 152 (the engine building itself), 9 to 12 November 2026, re-measured
2026-11-12 at about 17:50 while phase 4 was live; "≥" marks a number that moves with the live run
(feature input, Background; ledger M1 to M11):

| Measure | Value |
| --- | --- |
| Phases approved | 3 of 7, on attempts 12, 11 and 13 |
| Closed attempts | 37 of 84 started (47 have no closing event); 20.8 h; median 26.7 min |
| In-pass `npm test` checks (`check.ended`) | ≥ 56, 28 failed, median 365 s, 7.56 h; 279–706 s plus one of 6,421 s (107 min) |
| Passes that ran the full 45 minutes (from `runtime.log` banners) | 23 passes, 17.3 h |
| Rejection notices | ≥ 36 |
| … red gate, critic never called | 17, all the same 212 bytes ("- npm test FAILED") |
| … critic: the work is missing or wrong | 7 |
| … critic: "no diff shows it" / "no evidence" | 8 |
| … commit gate blocked a critic-approved attempt | 4 (`cg-sk-prefix` ×2 in `tasks.md`, `cg-url-embedded-credentials` ×2 in a test fixture) |
| Tasks per phase | 8, 39, 41, 26, 29, 17, 13 |
| Phase 2 critic verdicts, rejections 4 / 6 / 7 | 38 MET 1 UNMET / 1 MET 38 UNMET / 38 MET 1 UNMET |
| Diagnostician | 24 calls, median 54 s |

The split: of the ≥ 36 rejections, 17 were a red gate whose notice carried no failure, 8 a critic
that could not see the work, 4 a deterministic commit check that ran after the critic approved,
and at most 7 the critic finding real missing or wrong work. The repository's own suite is part of
every attempt: CI run 43131798853 spent 5 min 43 s in `npm test` (T4), running 32 workspaces one
after another on a 22-core host (T1, T2).

The principle, in Huntley's words (verified in `docs/prompts/2026-11-08-huntley-grounding-ledger.md`
row E3, on https://ghuntley.com/ralph/): "Anything can be wired in as back pressure to reject
invalid code generation… But the key collective sum is that the wheel has got to turn fast." Here
the wheel is slow because the unit of work is a whole phase and every form of feedback on that unit
is slow, late or blind.

**Limits of the evidence.** One large feature on the engine's own repository, the worst case for
suite time, plus ledgers of features 150 and 151 (151 phase 2 at ≥ 15 rejections; 150 phase 10 in
4 attempts, M11). The live runs use the installed build, which is behind `main` (T8). The critic
split between "missing or wrong" and "no evidence" is a manual reading, with two borderline cases
(M4). The split of gate time and critic time is not in the records (A13). Small trial features on
this host mostly pass in zero to three rejections. So every success criterion below is a count on a
fixture or on recorded events, never a speed-up estimate.

## Where the spec already requires it

These behaviours are demanded by an existing requirement and not delivered by the engine path on
`main` @ `efe8897f`. This feature delivers them; it does not re-specify them. Their value under
`parity` is the wired, as-is behaviour (constitution grounding, "Profiles"; Principle XVIII,
"Code outranks prose **within the baseline**").

| Delivered requirement | What the engine does today | Delivered by |
|---|---|---|
| F105-FR-006, F105-FR-037 (failure summary in the red-gate feedback) | A heading and "- npm test FAILED"; the summary exists as library code and is not used (A5, A6, M5, C14) | F153-FR-016 |
| F117-FR-030 to F117-FR-032 (verdict pins) | Library code exists; the engine never calls it (A10, C13) | F153-FR-048 |
| F117-FR-027 (no check output in a critic-class input) | The engine's critic prompt holds the redacted gate output under "# The check the engine ran itself" (A5) | F153-FR-050; tracked defect D-1 |
| F103-FR-041 (the pass handoff) | The writer exists; nothing in the engine calls it (confirmed by search; constitution grounding T-i) | F153-FR-058 |
| F105-FR-007 (events around every run of the verification gate) | No `verification.started` or `verification.ended` is emitted by the engine (A13) | F153-FR-034 |
| F105-FR-015, -018, -032 and F148-FR-005 (the gate runs the plan's commands through the one runner) | The gate runs the literal `npm test` when `package.json` has `scripts.test`, through a shell, outside the runner (A1, A2) | F153-FR-010, F153-FR-011 (parity value: on, CQ-153-11 A) |
| F148-FR-002, F148-FR-004 (own process group and time limit; `TIMEOUT`) | The gate and the check-runner service have no time limit; the micro path sends SIGTERM to the direct child only (A2, A4) | F153-FR-029 (parity value: on, CQ-153-13 A) |
| F111-FR-004, F111-FR-010 (every opener has a closer; `attempt.ended` carries `endCause`) | 84 `attempt.started`, 37 `attempt.ended` (M2); the engine emits `attempt.ended` only on the rejection path (A13) | F153-FR-037 |

## User Scenarios & Testing *(mandatory)*

### User Story 1a - A red gate says what failed (Priority: P1)

The proposer of attempt 5 broke two tests. Today it receives a heading and "- npm test FAILED" and
has to rerun the whole suite to learn which. With this story it receives the engine's red-gate
feedback with the failure summary: the failing command and its exit code, the failing test lines
first, then the ends of stdout and stderr, all redacted and capped.

**Why this priority**: 17 of the ≥ 36 rejections in feature 152 were red gates with a 212-byte
notice (M4, M5). It is a ported requirement the engine does not wire, so it needs no ruling.

**Independent Test**: With a stub proposer whose change makes two named tests fail, assert that the
next attempt's feedback starts with `# Phase <N> deterministic verification gate rejected`, holds
`### <commandId> — exit <code>` and both failing lines under `Failing assertions / tests:`, and that
a planted secret in the test output is absent from the feedback.

**Acceptance Scenarios**:

1. **Given** a failing gate, **When** the feedback is written, **Then** it has the F105-FR-006 frame and the F105-FR-037 summary (F153-FR-016).
2. **Given** test output that holds a credential-shaped string, **When** the feedback is written, **Then** the string is redacted by the single ingress and the drop is marked (F153-FR-017).
3. **Given** a summary that cannot be produced, **When** the feedback is written, **Then** it holds `(failure digest unavailable — read the evidence document below)` (F153-FR-016).
4. **Given** the critic call of a later attempt, **When** its prompt is built, **Then** it holds no part of the summary (F153-FR-019, F153-FR-050).

---

### User Story 1b - The gate runs what was declared, once (Priority: P1)

A consumer declares the phase's verification commands in the plan. The gate runs exactly those, through
the same runner as the in-pass checks, with their declared time limits. When the micro-loop layer
would run a closing check identical to the gate on the same tree, it runs once. If the owner rules
reuse in (CQ-153-02), a green in-pass result of the same pinned commands on an equal, untainted,
`current` tree stands for the gate and is recorded as reused.

**Why this priority**: the gate repeats a suite whose median in-pass run is 365 s (M3); the gate
command today is not the declared one (A1). The reuse part needs an amendment of Principle II.

**Independent Test**: With a plan that declares commands differing from `package.json`, assert the
gate runs the plan's commands through the check runner and emits one `check.started` and
`check.ended` per command. With reuse off, assert the gate executes every attempt. With reuse ruled
in and on, assert an unchanged tree after a green run gives 0 executions at the gate and a result
record carrying `reused` and `reusedFrom`; any change, taint or scoped run gives a fresh execution.

**Acceptance Scenarios**:

1. **Given** a verification plan, **When** the gate runs, **Then** it runs the commands of the phase's gate from the frozen plan, through the one check runner, and nothing from `package.json` by itself; a conflict is a blocker (F153-FR-010, F153-FR-011).
2. **Given** the micro layer on and a closing check equal to the gate on the same tree, **When** the phase gate is reached, **Then** the commands run once (F153-FR-012).
3. **Given** reuse ruled in and on, and a green runtime result whose binding equals the tree at the gate, **When** the gate is reached, **Then** the gate stands on it, records it as reused and binds its hash into the approval record (F153-FR-013, F153-FR-014).
4. **Given** the same, but the result is scoped, tainted, `superseded`, from the proposer's own shell, or followed by a parallel merge, **When** the gate is reached, **Then** the gate executes (F153-FR-013).

---

### User Story 1c - A red gate does not burn a critic rejection (Priority: P1)

A phase hits two red gates and one critic rejection. With the switch on, the reject limit has 1 of
3 spent, and the red-gate budget 2 of its limit. The run cannot loop: when the red-gate budget is
spent, the run halts with a distinct stop that no supervisor relaunches.

**Why this priority**: red gates spent 17 of the rejections in feature 152 (M4); the reject limit is
there to bound the critic's judgments. It needs a ruling against F101-FR-014 and F105-FR-005.

**Independent Test**: With a stub whose gate fails on every attempt, assert the run halts after
exactly the red-gate limit's attempts, with the stop reason and exit code of CQ-153-05, is
relaunched 0 times, and the reject count is unchanged. Kill and resume between two red gates;
assert the count survives.

**Acceptance Scenarios**:

1. **Given** the switch on, **When** the gate fails, **Then** the attempt ends `verification-failed`, spends one unit of the red-gate budget and none of the reject limit (F153-FR-020).
2. **Given** the red-gate budget spent, **When** the next gate fails, **Then** the run halts with the ruled stop reason and exit code and is not relaunched (F153-FR-022).
3. **Given** a resume, **When** the counts are read, **Then** they come from durable records (F153-FR-021).
4. **Given** the switch off, **When** the gate fails, **Then** the rejection counts toward the reject limit as today (F105-FR-005).

---

### User Story 1d - The commit scan runs before the critic, and in the pass (Priority: P1)

The proposer embeds a credential in a test fixture. With the switch on, the commit scan finds it
after the gate passed and before the critic is called; the attempt ends with F152's corrective
block, and no critic time is spent on it. During its pass the proposer can run the same scan as a
command and fix the file before it ends the pass.

**Why this priority**: 4 critic-approved attempts were then blocked by the commit gate (M4); 2 of
them were in a test fixture of the candidate change. Builds on F152; needs the ruling CQ-153-06.

**Independent Test**: With a stub proposer that plants a secret in a fixture and a stub critic that
counts calls, assert 0 critic calls on the blocked attempt, the F152 corrective block in the next
attempt, and an in-pass scan output holding the rule id and quoted path and no match text.

**Acceptance Scenarios**:

1. **Given** both switches on and a passed gate, **When** the scan blocks, **Then** the critic is not called, the attempt ends as F152-FR-002 says, and no critic prompt of a later attempt holds the scan's result (F153-FR-024, F153-FR-028).
2. **Given** a candidate that passes the pre-critic scan, **When** the critic approves and the tasks are ticked, **Then** the commit-time scan still runs and F152-FR-001 still voids a blocked approval (F153-FR-025).
3. **Given** the proposer runs the in-pass scan, **When** it reports a hit, **Then** the output holds rule ids, quoted capped paths and lines and no match text, and the result enters no gate, record or count; it equals the result the engine's own scan gives on the same tree (F153-FR-026, F153-FR-027).

---

### User Story 1e - A hung check is ended, and nothing of it stays behind (Priority: P1)

A test spawns a server that never exits and holds the output pipes. Today the gate waits forever
(one in-pass check ran 6,421 s, M3). With this story every check path ends the command's whole
process group at its declared limit, escalates to SIGKILL after a grace, and records a failed
result with the signal `TIMEOUT`.

**Why this priority**: a check without a bound stalls every attempt behind it. Needs the rulings
CQ-153-04 and CQ-153-13.

**Independent Test**: With a fake command that forks a grandchild ignoring SIGTERM and keeping the
pipes open, assert that on each path (gate, micro layer, check-runner service) the check ends
within its limit plus the grace, 0 processes of its group remain, the result has no exit code and
the signal `TIMEOUT`, and no process outside the group was signalled. Skip with the reason where
process groups are unavailable.

**Acceptance Scenarios**:

1. **Given** a command over its limit, **When** the limit passes, **Then** its group gets SIGTERM, then SIGKILL after the grace (F153-FR-029, F153-FR-030).
2. **Given** `SPECSTRIDE_LIMITS=off`, **When** a check hangs, **Then** it is still ended as CQ-153-04 rules, and the run records that limits are off (F153-FR-031).
3. **Given** a killed check, **When** a supervisor observes the run, **Then** the kill is not a transient stop (F153-FR-032).

---

### User Story 2 - The loop reports on itself (Priority: P2)

An operator wants to know where the hours of a run went. Every gate, critic call and commit scan
has a timed open and close event; every started attempt has an `attempt.ended` with its cause; and
`specstride report` prints the measurements table of this spec from the event stream alone, writing
no file, marking what the events cannot hold instead of estimating it.

**Why this priority**: the split of gate and critic time is not in the records today (A13), and the
ledger had to pair events by hand and could not reproduce two of the evaluation's figures (M2).

**Independent Test**: Run a recorded fixture with this feature on; assert every `attempt.started`
has one `attempt.ended`, gate and critic pairs exist with durations, and `specstride report`
prints the rows of F153-FR-040 with the counts computed independently from the same event file;
assert the file system is unchanged by the report.

**Acceptance Scenarios**:

1. **Given** any attempt, **When** it ends by any path, a process death included, **Then** exactly one `attempt.ended` with an `endCause` of row 272 closes it (F153-FR-037).
2. **Given** an event file, **When** `specstride report` runs, **Then** it prints the rows, shows unclosed attempts as unclosed and unknowns as null, and writes no file (F153-FR-039, F153-FR-040).
3. **Given** a row that no event holds (the manual critic split, the verdict MET/UNMET counts), **When** the report prints it, **Then** it says it is not in the events (F153-FR-040).
4. **Given** a gate run, a critic call and a commit scan, **When** each runs, **Then** it has a timed open and close event holding no content (F153-FR-033 to F153-FR-036); a block also emits `commit_gate.blocked`, and no new `endCause` is used (F153-FR-038).

---

### User Story 3 - Checks run in parallel and in-pass checks are scoped (Priority: P3)

A change touches one package. In the pass, the in-pass check runs the declared commands of the
workspaces that depend on it, by a walk of the static package graph; the approval gate still runs
the full declared suite. Where commands declare disjoint scopes they run in parallel, each in its
own isolation.

**Why this priority**: the suite runs 32 workspaces one after another on 22 cores (T1, T2); scoping
the in-pass check narrows only what is advice to the proposer.

**Independent Test**: With a fixture graph and declared per-workspace commands, assert the selected
set equals the reverse-dependency closure of the changed workspaces; a changed graph or an unmapped
file selects the full set; the gate runs the full set in 100 % of attempts.

**Acceptance Scenarios**:

1. **Given** the switch on and a change in one workspace, **When** an in-pass check runs, **Then** it runs only declared commands of that workspace and its dependents (F153-FR-045).
2. **Given** a changed file that maps to no workspace, **When** the selection is made, **Then** the full inner set runs (F153-FR-046).
3. **Given** the approval gate, **When** it runs, **Then** it runs the full declared suite (F153-FR-047).
4. **Given** two commands with declared, disjoint reads and writes and `verification.parallelism` 2, **When** they run, **Then** they run in one batch, each in its own process group, and the admission is recorded (F153-FR-042).
5. **Given** the repository's own suite with workspaces run in parallel, **When** one workspace fails, **Then** the suite fails, results are reported in workspace order, and each workspace ran in its own PID namespace (F153-FR-043, F153-FR-044).

---

### User Story 4 - The critic sees each task's work, and what it confirmed stays confirmed (Priority: P4)

In phase 2 of feature 152, rejection 6 went from 38 MET to 1 MET and back (M8). With the pins
wired, criteria confirmed earlier against the same file hash are shown to the critic as previously
confirmed; with per-task evidence, the critic sees the files and tests each task names instead of a
whole diff cut at 200,000 bytes (A9).

**Why this priority**: 8 rejections were "no diff shows it" (M4). The pins are a ported requirement;
per-task evidence is new.

**Independent Test**: Property test: for random edits between attempts, a pin is shown only for
criteria whose backing hash is unchanged; pins are removed on APPROVED. For per-task evidence,
assert every changed file is shown or named.

**Acceptance Scenarios**:

1. **Given** a parsed REJECTED with criteria confirmed, **When** the next critic call is built and the priority files are unchanged, **Then** the block `PREVIOUSLY CONFIRMED (W9 verdict pins)` holds them, as criterion ids only, and the critic still judges every criterion (F153-FR-048, F153-FR-049).
2. **Given** a changed file under a pin, **When** the call is built, **Then** that pin is not shown (F153-FR-048).
3. **Given** the switch on, **When** the evidence is built, **Then** each task's named files and tests are excerpted within the critic's window, and every other change is shown or named; nothing is taken from the checkpoint note or the handoff (F153-FR-051 to F153-FR-053).

---

### User Story 5 - A phase is worked in task groups, with a handoff between passes (Priority: P5)

A phase of 41 tasks (M7) is sliced at derivation into groups of a few tasks, each with a write scope
and an executable acceptance check. Each group is checked and reviewed on its own; the next pass
gets the handoff of F103-FR-041, which carries among the rest its counters, the remaining units
of work (this phase's tasks done and open, the plan less the ledger) and the pointers to the
feedback files. Whether a group is also the unit of approval and commit is the owner's ruling.

**Why this priority**: a unit today is whatever the proposer claims (A12); 23 passes ran to the
limit (M6) without a carried state. It depends on rulings CQ-153-07 and CQ-153-15.

**Independent Test**: Derive a fixture phase; assert the slicing is deterministic and hashed in the
launch contract; every group has a declared acceptance check or is `unchecked`; a group review
writes no approval; the handoff is at most 6 KB, regenerated each pass and never read back.

**Acceptance Scenarios**:

1. **Given** the switch on, **When** a contract is derived, **Then** each phase has groups with a write scope and an acceptance check or `unchecked` (F153-FR-054, F153-FR-055).
2. **Given** a group whose acceptance check passed, **When** it is reviewed, **Then** the only durable effect is pins, unless CQ-153-07 rules otherwise (F153-FR-056, F153-FR-057).
3. **Given** `carry.ledger_handoff` on, **When** a pass starts, **Then** the handoff is written fresh and grounding refuses it; under `parity` every pass stays a fresh session (F153-FR-058, F153-FR-059).

---

### Edge Cases

- **The gate could not run** (plan refused, code 3). It counts as a red gate (F105-FR-005), so it spends the red-gate budget with the switch on (F153-FR-023).
- **A red gate on the last allowed attempt of the reject limit** with the switch on. The reject limit is not touched; only the red-gate budget decides.
- **A pre-critic block and a commit-time block in one attempt.** Not possible: a pre-critic block ends the attempt before the critic.
- **The proposer edits `tasks.md`** so that the commit-time scan blocks after the tick (M4, `cg-sk-prefix`). The commit-time scan and F152's void rule stay (F153-FR-025).
- **The in-pass scan is run with another rule file.** Refused: it reads only the rule data pinned at launch (F153-FR-027).
- **A check is killed while its result would have been reused.** A killed result has the signal `TIMEOUT` and is never eligible (F153-FR-013).
- **Grandchildren that leave the process group** (`setsid`). Not covered by a group kill; the PID-namespace isolation of the repository's own suite (A16) covers that suite; recorded as tracked limitation L-2.
- **The package graph changes in the pass.** The in-pass selection is the full set (F153-FR-046).
- **A task names no file.** Its evidence is the snapshot of the tree's changes outside every task (F153-FR-052).
- **A pin over a file that was deleted.** The hash entry is `MISSING` (F117-FR-031), so the backing hash changes and the pin is not shown.
- **A process dies mid-attempt.** The next writer synthesizes `attempt.ended` with `synthesized: true` and the cause of the death (F111-FR-004).
- **An event cannot be written.** No decision changes (F153-FR-006); the report shows the gap as `event.dropped` counts (F111-FR-019).

## Requirements *(mandatory)*

### Functional Requirements

Each requirement names its switch and its value under `parity`, its anchor, and a characterization
test `CT-153-<n>` with the same number. "Delivers" marks a requirement that an existing spec already
demands. "Ruling" marks one that waits on a `CQ-153-nn` row; under each answer, the row says what
the requirement becomes. Proposed key spellings are confirmed by feature 110.

#### G0 — Governance stays (restated)

- **F153-FR-001**: Only the critic's APPROVED, reached through the phase gate, MUST grant an approval. The verification gate, a reused result, the red-gate budget, the pre-critic and in-pass commit scans, the pins, group checks and group reviews MUST only withhold an approval or inform. *Why: Principle II, "The phase gate with the independent critic is the only source of a verdict"; "Models propose; the engine disposes."*
  - anchor: Principle II; constitution grounding constraint 6
  - switch: none; parity: holds under every profile
  - test: CT-153-1

- **F153-FR-002**: Verdicts MUST stay bound to the nonce of their call, approval records MUST stay signed and verified wherever the engine reads whether a phase is approved, and the critic MUST stay a separate call with no tools. This feature MUST add no source of a verdict and no field that a verifier of an approval record skips. *Why: a faster loop that weakens the record would trade governance for speed, which the feature forbids.*
  - anchor: Principles I, II, IX; F101-FR-011, -029, -031
  - switch: none; parity: holds
  - test: CT-153-2

- **F153-FR-003**: Every text of this feature that comes from outside the runtime (test output, file paths, task titles, rule hits) MUST enter through the one ingress of F100-FR-009, be redacted with fail-closed dropping and the mark of dropped content, be capped, and be framed as engine-labelled data. This feature MUST hold no redactor of its own. *Why: Principle III, text from outside is data; Principle XII, secrets never appear in prompts, events or a UI.*
  - anchor: F100-FR-009; F101-FR-052; constraints 8, 26
  - switch: none; parity: holds
  - test: CT-153-3

- **F153-FR-004**: Closed vocabularies (stop reasons of §E.3, exit codes of §E.4 and §G.4, attempt kinds of §E.1, blocked reasons of §E.2, `endCause` of §X.6 row 272, kill reasons of F118-FR-007, check conditions of F148-FR-003) MUST change only by the owner rulings named in "Closed sets". Task groups, scoped and parallel checks MUST add no run state, no exit code and no stop reason, and MUST spend no outer counter. *Why: codes are part of the interface; F100-FR-031 and Principle XX.*
  - anchor: F100-FR-031, -148; Principle XX; Additional Constraints; constraints 14, 22
  - switch: none; parity: holds
  - test: CT-153-4

- **F153-FR-005**: Every new behaviour of this feature MUST have its own switch, a default, a value under `parity` that reproduces the as-is behaviour, and a register row, as the table "Rows of the `parity` profile" states. A behaviour that delivers a ported requirement MUST be on under `parity`. This feature MUST NOT change a row of another feature. *Why: Principle XVIII; F100-FR-212.*
  - anchor: F100-FR-212; constraint 1, 2
  - switch: n/a; parity: as the table
  - test: CT-153-5

- **F153-FR-006**: No decision of the engine (reuse, the red-gate count, a halt, a selection, a group's state) MUST read an event. Decisions MUST read control-plane records. *Why: Principle V, telemetry describes a run and is never its event bus.*
  - anchor: Principle V; F111-FR-019; constraint 13
  - switch: none; parity: holds
  - test: CT-153-6

- **F153-FR-007**: Shared control flow of every behaviour of this feature MUST test no harness name. *Why: Principle VII.*
  - anchor: Principle VII; constraint 24
  - switch: none; parity: holds
  - test: CT-153-7

- **F153-FR-008**: Every record this feature adds MUST have a schema and MUST be validated when it is read. Every decision it adds MUST be a pure table with a rule id, recorded with that id. Its logic MUST live in core packages behind typed units, with the CLI as wiring, and each unit MUST be named as a seam in the plan. *Why: Principle VI and XIII; it keeps the move of A17 no harder.*
  - anchor: Principles VI, XIII; A17; constraint 25
  - switch: none; parity: holds
  - test: CT-153-8

- **F153-FR-009**: New configuration keys MUST follow the precedence of the Additional Constraints. Project configuration MUST only narrow: it MUST NOT raise `verification.parallelism` above its ceiling, turn reuse on, remove or replace a gate command, enlarge the red-gate budget beyond the consumer's setting, or lift a time limit. *Why: Principle III, "Project configuration may narrow a run but never widen it."*
  - anchor: Principle III; Additional Constraints; constraint 28
  - switch: none; parity: holds
  - test: CT-153-9

#### G1a — The gate command, one runner, and reuse

- **F153-FR-010**: Delivers F105-FR-015, -018 and -032 in the engine path. The verification gate of a phase MUST run the commands of the phase's gate `GATE-phase-<N>` of the frozen verification plan, in plan order, with their declared time limits, and nothing else. A test script of the project MUST reach the gate only through a plan source of F105-FR-015 (discovery included, F105-FR-017). A conflict between the declaration and the project, or a command that cannot be expressed as fixed argv, MUST be a blocker and never a guess. *Why: today the gate runs the literal `npm test` when `package.json` has `scripts.test` (A1); Principle XIV, verification is declared, never invented; reuse needs the gate and the in-pass check to be the same object.*
  - anchor: A1; F105-FR-015, -017, -018, -032; Principle XIV; constraint 5
  - switch: none (delivery); parity: on, as the delivered requirement — confirmed by CQ-153-11
  - test: CT-153-10

- **F153-FR-011**: Delivers F148-FR-005 and F148-FR-007 in the engine path. The verification gate MUST run its commands through the one check runner that serves inner checks and the closing check, without a shell, with one `check.started` and one `check.ended` per execution. *Why: one runner gives one result record with a tree fingerprint and conditions, which F116 binds and reuse needs (A2, A3).*
  - anchor: A2, A3; F148-FR-005, -007; F116-FR-005, -008
  - switch: none (delivery); parity: on — CQ-153-11
  - test: CT-153-11

- **F153-FR-012**: With the switch on and the micro-loop layer engaged, the runtime MUST NOT run its closing check when the closing check's command set and runner equal the gate's and the tree fingerprint at the closing check equals the tree at the phase gate; the gate's execution is then the one run. The gate itself MUST still execute. *Why: Principle I makes the closing check a "may", so dropping a duplicate run needs no amendment and leaves the gate standing on nothing earlier (constitution grounding T-a, fallback).*
  - anchor: Principle I; A3; constitution grounding T-a; constraint 3
  - switch: `loop.micro.closingCheck.skipWhenEqualToGate`, default on; parity: off (the closing check runs whenever the layer is on)
  - test: CT-153-12

- **F153-FR-013**: Ruling CQ-153-02. Only if the owner adopts the amendment of Principle II (CQ-153-02) and the amendments of F101-FR-005, F105-FR-033 and F100-FR-232: with the switch on, the verification gate MAY stand on an earlier result of the same phase attempt only when every one of these holds — the runtime's check runner produced it, never the proposer's harness; its pinned argv and command set are the gate's (F153-FR-010); it is the full declared set, not a scoped or partial run; its tree fingerprint and protected set equal the tree at the phase gate, so it reads `current` (F116-FR-003, -005, -008); the executable pins verify; it carries no condition of F148-FR-003 (`tainted`, `cached`, `flaky`, `interrupted`, `unchecked`) and no signal `TIMEOUT`; no parallel merge and no write by the runtime came after it. Eligibility MUST be decided by a pure table with a rule id. *Why: a green result that is provably of this tree spares a whole suite run (median 365 s, M3) while keeping "run by the runtime" (Principle III); every other case keeps the execution.*
  - anchor: Principles II, III, XX; F101-FR-005; F105-FR-033; F100-FR-232; F116-FR-005, -006, -008; F148-FR-003; constraint 4
  - switch: `verification.gate.reuse`, **not built** — CQ-153-02 answered B on 2026-11-13 (the gate executes every time; reuse only of `prestage` results, none with a loop layer engaged, DV-012)
  - test: CT-153-13

- **F153-FR-014**: Ruling CQ-153-02. A reused result MUST be recorded in the result record of the gate with `reused` and `reusedFrom` (F105-FR-009), its hash MUST be bound into the approval record (F101-FR-029), and the tracked limitation L-1 (the residual risk of the fingerprint inside ignored paths) MUST be stated wherever reuse is on. *Why: Principle II's amendment text requires the result to be recorded as reused and bound by hash; Principle III's CQ-197 sentence records the fingerprint's gap as a residual risk.*
  - anchor: F105-FR-009; F101-FR-029; Principle III (CQ-197); constraint 4
  - switch: as F153-FR-013; parity: off
  - test: CT-153-14

- **F153-FR-015**: Ruling CQ-153-02, answered B (refused) on 2026-11-13: the gate MUST execute on every phase attempt; F153-FR-013 and F153-FR-014 MUST NOT be built, and F153-FR-010 to F153-FR-012 stand as written. *Why: Principle II cannot be justified away; the fallback keeps the speed that needs no amendment.*
  - anchor: Governance; constitution grounding CQ-153-02 "If refused"; constraint 3
  - switch: n/a; parity: n/a
  - test: CT-153-15

#### G1b — The red-gate notice carries the failure

- **F153-FR-016**: Delivers F105-FR-006 and F105-FR-037 in the engine path. On a failed verification gate the engine MUST write the feedback of the phase attempt with the frame of F105-FR-006 and, under `## What actually failed`, the failure summary of F105-FR-037: per failed command `### <commandId> — exit <code>` and its argument list with `(cwd: <dir>)`, the failing lines first under `Failing assertions / tests:` (at most 40, then `… <n> more`), then `stdout (last <n> lines):` and `stderr (last <n> lines):` with 80 and 40 lines. When the summary cannot be produced, the section MUST hold `(failure digest unavailable — read the evidence document below)`. *Why: 17 red-gate notices of feature 152 were the same 212 bytes and named no failure (M5); the proposer must learn what failed without rerunning the suite.*
  - anchor: A5, A6; F105-FR-006, -037; §X.7 row 126; ledger M5, C14; constraint 2, 8
  - switch: none (delivery); parity: on (row 126: 80 and 40 under `parity`)
  - test: CT-153-16

- **F153-FR-017**: The summary MUST pass the ingress of F153-FR-003 before it enters the feedback; a part the redactor cannot clear MUST be dropped and marked. *Why: test output can hold planted secrets — feature 152 was blocked twice on `cg-url-embedded-credentials` in a test fixture (M4); Principle XII.*
  - anchor: F100-FR-009; F101-FR-052; Principles XI, XII; ledger M4
  - switch: none; parity: on
  - test: CT-153-17

- **F153-FR-018**: Writing the feedback MUST NOT change the result record of the verification gate (F105-FR-009) or its hash that the approval record binds. *Why: the notice is advice to the proposer; the record the approval binds must be the same whatever the notice holds (A5).*
  - anchor: A5; F105-FR-009; F101-FR-029
  - switch: none; parity: on
  - test: CT-153-18

- **F153-FR-019**: The red-gate feedback MUST go to the proposer of the next attempt only and MUST NOT reach a critic-class input. *Why: F117-FR-027, no critic input holds the output of a check or feedback of earlier attempts; Principle II.*
  - anchor: F117-FR-027; Principle II; constraint 9
  - switch: none; parity: on
  - test: CT-153-19

#### G1c — A red gate spends its own budget

- **F153-FR-020**: Ruling CQ-153-05. With the switch on, a failed verification gate MUST end the phase attempt as not approved with `endCause` `verification-failed`, MUST spend one unit of the red-gate budget of the phase, and MUST NOT count toward the reject limit. It MUST still consume a phase-attempt ordinal, keep the kind `gate-failed` in the ledger, run the post-rejection order of F101-FR-017 (the diagnostician included) and stay outside K of the model-tier bump (F149-FR-004). *Why: 17 of ≥ 36 rejections of feature 152 were red gates (M4); the reject limit is meant to bound the critic's judgments, and a red gate is a deterministic result like F149-FR-004 already treats it.*
  - anchor: A7; F101-FR-014, -017; F105-FR-005; F149-FR-004; ledger M4, C7; constraint 7
  - switch: `verification.redGate.ownBudget`, default on; parity: off (a red gate is a rejection with code 10 that counts toward the reject limit)
  - test: CT-153-20

- **F153-FR-021**: The red-gate budget MUST be a finite integer from configuration with a default (CQ-153-05), MUST be derived from durable control-plane records and never from a count held in memory, MUST survive a resume and a relaunch, and MUST be set aside with the other counts by a reset of the ledger. No setting, `SPECSTRIDE_LIMITS=off` included, MUST make it unbounded. The phase attempts of a phase MUST stay bounded by the reject limit plus the red-gate limit. *Why: Principles I, VIII ("it does not loop"), XV ("no setting bypasses a budget") and XVI ("counts survive a resume").*
  - anchor: Principles I, VIII, XV, XVI; F152-FR-015 (precedent); constraint 7
  - switch: as F153-FR-020; parity: off
  - test: CT-153-21

- **F153-FR-022**: When a failed gate would exceed the red-gate budget, the engine MUST halt the run with the halt banner and rejection trail of F101-FR-014, the stop reason `max_rejects` and exit code 2 that CQ-153-05 A rules, and the cause `verification-failed` in the terminal record. The stop MUST be non-transient and MUST NOT be relaunched by a supervisor. *Why: Principle XVI, a relaunch happens only for a classified transient; a spent budget is not one.*
  - anchor: F101-FR-014; F100-FR-148; §E.3, §E.4; Principle XVI; constraint 7
  - switch: as F153-FR-020; parity: off
  - test: CT-153-22

- **F153-FR-023**: Ruling CQ-153-05. A gate that could not run (code 3, F105-FR-013) MUST spend the red-gate budget like a failed command, as F105-FR-005 counts it failed. *Why: F105-FR-005 makes both codes a failed gate; splitting them would add a third path with no bound of its own.*
  - anchor: F105-FR-005, -013
  - switch: as F153-FR-020; parity: off
  - test: CT-153-23

#### G1d — The commit scan before the critic, and in the pass

This group depends on F152-FR-001 to F152-FR-024 as requirements. It does not re-specify them.

- **F153-FR-024**: Ruling CQ-153-06. With the switch on (and, per CQ-153-06 A answered 2026-11-13, `commit.backpressure` of F152-FR-021 on), after a passed verification gate and before the critic is called, the engine MUST run the commit scan of F100-FR-206 with the rule data pinned at launch (F152-FR-016, -017) over the candidate change: the files the approval commit would hold, as they stand at that point. A block MUST end the phase attempt not approved with no critic call, and MUST then be handled as F152-FR-002 to F152-FR-015 handle a block: the corrective block, its record, its counting toward the reject limit, its signature halt, its exclusion from K. *Why: 4 critic-approved attempts of feature 152 were then blocked (M4); a deterministic check must come before an opinion, so the critic is never spent on a candidate that cannot be committed.*
  - anchor: A8; F100-FR-206; F152-FR-002, -005, -006, -007, -016, -017; ledger M4, C8; constraint 10
  - switch: `commit.gate.beforeCritic`, default on; parity: off (the scan runs at the approval commit only)
  - test: CT-153-24

- **F153-FR-025**: The commit-time scan of F101-FR-035 and the void rule of F152-FR-001 and F152-FR-014 MUST stay unchanged, whether or not the pre-critic scan ran or passed. *Why: the engine ticks the tasks after the approval (F101-FR-033), and 2 of the 4 blocks of feature 152 were in `tasks.md` (M4); a pre-critic pass does not prove the commit clean.*
  - anchor: F101-FR-033, -035; F152-FR-001, -014; ledger M4; constraint 10
  - switch: none; parity: holds
  - test: CT-153-25

- **F153-FR-026**: The scan MUST be one typed unit with one result for one tree and one pinned rule set, used by the pre-critic step, the commit-time step and the in-pass command. *Why: a second implementation could disagree with the gate it advises on; today the scan is a closure inside the engine that no proposer can reach (A8); Principle VI.*
  - anchor: A8; Principle VI; F152-FR-016
  - switch: none; parity: holds
  - test: CT-153-26

- **F153-FR-027**: The product MUST offer a read-only command that the proposer can run in its pass to scan its candidate change with the rule data pinned at launch. It MUST NOT accept another rule set or a path to one. Its output MUST hold, per hit, the rule id, the rule's reason, the file as a quoted, escaped, capped value and the line, and MUST hold no matched text and no file content. Its result is advice: it MUST NOT enter the verification gate, an approval record, a critic-class input or any count, and its absence or failure MUST change nothing in the loop. The prompt of a pass MAY name the command only with the switch on. Its exit codes are ruled by CQ-153-17. *Why: the proposer can fix a block in the pass instead of spending an attempt; Principle III makes any check the proposer runs advice only; F152-FR-010 and -011 for the rendering.*
  - anchor: A8; Principles III, XII; F152-FR-010, -011, -017; constraint 11
  - switch: `commit.scan.inPass`, default on; parity: off (no such command is named to the proposer)
  - test: CT-153-27

- **F153-FR-028**: No critic-class input MUST hold a result of the pre-critic or the commit-time scan. *Why: F152-FR-009 rested this on the scan running after the critic; with the scan before the critic, the rule must be stated directly (Principle II).*
  - anchor: F152-FR-009; F117-FR-027; Principle II
  - switch: none; parity: holds
  - test: CT-153-28

#### G1e — Every check has an enforced time limit

- **F153-FR-029**: Delivers F148-FR-002 and F148-FR-004 in the engine path. On every check path — the verification gate, the inner and closing checks of the micro-loop layer, and the check-runner service — each command MUST run in a process group of its own with the time limit its declaration gives. At the limit the group MUST be ended, and the result MUST have no exit code, the signal `TIMEOUT` and `command timed out` added to its standard error, and MUST count as failed at the verification gate. *Why: the gate and the service have no limit and the micro path signals only the direct child, so grandchildren keep the pipes open (A2, A4); one in-pass check ran 6,421 s (M3).*
  - anchor: A2, A4; F148-FR-002, -004; ledger M3, C9; constraint 12
  - switch: `verification.timeLimit.enforce`, default on; parity: on (CQ-153-13 answered A on 2026-11-13: the enforced limit is a defect fix, register row)
  - test: CT-153-29

- **F153-FR-030**: Ending a group MUST send SIGTERM to that group, and SIGKILL to the same group after a grace stated by the plan if any member is still alive. A signal MUST target only the group created for that command; it MUST NOT target `-1`, `0` or any other group. After the end, no process of the group MUST remain. *Why: SIGTERM alone does not end a member that ignores it; a kill aimed wider than the group can end the host's own processes, which the PID-namespace isolation of the suite exists to prevent (A16).*
  - anchor: A4, A16; F148-FR-001, -002; constraint 12
  - switch: as F153-FR-029; parity: on (CQ-153-13 A)
  - test: CT-153-30

- **F153-FR-031**: Ruling CQ-153-04, answered A on 2026-11-13. Under `SPECSTRIDE_LIMITS=off`, a check MUST still be bounded: the declared time limit of the command applies unchanged; the run records that limits are off. Either way the run MUST record, once, that limits are off and which bound applied. *Why: Principle XV, no setting bypasses a budget; today the variable drops the micro path's timeout (A4), and no spec defines it (constitution grounding T-j).*
  - anchor: A4; Principle XV; constitution grounding T-j, CQ-153-04
  - switch: as F153-FR-029; parity: on (CQ-153-13 A)
  - test: CT-153-31

- **F153-FR-032**: A check ended at its limit MUST NOT be a transient stop and MUST NOT by itself cause a relaunch, and it MUST NOT add a kill reason to F118-FR-007, which is for passes. The condition `interrupted` MUST stay for a command ended by `cancel` or a stop request (F148-FR-003). Tests that need process groups MUST skip with their reason where these are missing, and the group kill on macOS MUST be marked unverified until observed. *Why: Principles XVI and XVII; a timed-out check is a failed result, not an infrastructure fault.*
  - anchor: F148-FR-003, -004; F118-FR-007; Principles XVI, XVII; constraint 12, 27
  - switch: as F153-FR-029; parity: on (CQ-153-13 A)
  - test: CT-153-32

#### G2 — The loop reports on itself

- **F153-FR-033**: Every event of this group MUST be a type of the F111 catalogue, MUST hold no content (F111-FR-016), MUST be best effort (F111-FR-019), and any free-text field MUST be marked and pass the ingress. Durations MUST be measured by the runtime. *Why: Principles V and XI; F111-FR-001.*
  - anchor: F111-FR-001, -016, -019; Principles V, XI; constraint 13
  - switch: none; parity: holds
  - test: CT-153-33

- **F153-FR-034**: Delivers F105-FR-007 in the engine path. Around every run of the verification gate the engine MUST emit `verification.started` and `verification.ended` (with `result` and `rc`), which the compatibility projection renders as the as-is events of F105-FR-007. *Why: the gate's time is not in the records today (A13), and F105-FR-007 already requires the events.*
  - anchor: A13; F105-FR-007; F111 catalogue `verification.started`, `verification.ended`
  - switch: none (delivery); parity: on
  - test: CT-153-34

- **F153-FR-035**: Around every critic-class call of the engine path (critic, diagnostician) the engine MUST emit the catalogue pair `critic.started` and `critic.call` (with `latencyMs` and `outcome`), and around a diagnosis `recovery.diagnosis_started` and its closer. *Why: the critic's share of an attempt is not in the records (A13); the types and the pairs already exist (F111-FR-004).*
  - anchor: A13; F111-FR-004; F111 catalogue `critic.started`, `critic.call`, `recovery.diagnosis_started`
  - switch: none; parity: on (CQ-153-09 answered A on 2026-11-13: additive catalogue types)
  - test: CT-153-35

- **F153-FR-036**: Ruling CQ-153-09. Around every run of the commit scan by the engine (pre-critic and commit-time) the engine MUST emit a timed pair, proposed `commit_gate.started` and `commit_gate.ended`, with the phase, the attempt, the step (`pre-critic`, `commit`), the duration, the outcome (`clear`, `blocked`) and the number of hits; a block MUST also emit `commit_gate.blocked` as F111-FR-031 states. The new types MUST be additive entries of the catalogue. *Why: behaviour 2 asks for timed events of the commit gate, and the catalogue has only the instant `commit_gate.blocked`.*
  - anchor: F111-FR-001, -004, -031; F111 catalogue `commit_gate.blocked`
  - switch: `events.commitGateTiming`, default on; parity: off (the projection drops the new types)
  - test: CT-153-36

- **F153-FR-037**: Delivers F111-FR-004 and F111-FR-010 in the engine path. Every `attempt.started` MUST be closed by exactly one `attempt.ended` carrying an `endCause` of §X.6 row 272, whatever path ended the attempt; a process that died MUST get synthesized closers marked `synthesized: true`. The cause MUST come from a pure table with a rule id: approved → `approved`; critic REJECTED → `rejected`; MALFORMED → `malformed`; failed gate, red-gate halt, timed-out gate → `verification-failed`; pre-critic or commit-time block → `rejected`, with the `commit_gate.blocked` of the same phase and attempt; and the other causes of row 272 as they stand. *Why: 47 of 84 started attempts of feature 152 have no closing event (M2), so no reader can time an attempt.*
  - anchor: A13; F111-FR-004, -010; §X.6 row 272; ledger M2; constraint 14
  - switch: none (delivery); parity: on
  - test: CT-153-37

- **F153-FR-038**: This feature MUST add no member to `endCause` (row 272) unless CQ-153-09 rules one. *Why: closed sets change only by ruling; the mapping of F153-FR-037 covers every cause of this feature.*
  - anchor: §X.6 row 272; F111-FR-010; constraint 14
  - switch: none; parity: holds
  - test: CT-153-38

- **F153-FR-039**: The product MUST offer a command `specstride report` that reads the event stream and the control-plane records of one feature's runs and writes no file of any kind. It MUST launch nothing, take no lock that a run waits on, and make no decision for a run. *Why: F129-FR-015 precedent — readers write no file; Principle I lets a reader poll files.*
  - anchor: F129-FR-001, -015; Principle I; constraint 15
  - switch: none; parity: not used (the command is observable by no fixture of the oracle)
  - test: CT-153-39

- **F153-FR-040**: `specstride report` MUST print, from the events alone: the phases approved and the attempt ordinal of each; the attempts started, closed and unclosed, and the total and median duration of the closed ones, paired on (run, phase, attempt); the in-pass checks, failed checks, their median, total, minimum and maximum duration; the passes ended by `hard_cap` and their total time; the phase attempts by `endCause` and the commit-gate blocks by rule; the tasks per phase where the events carry them; the diagnostician calls and their median duration; and, where the events of F153-FR-034 to F153-FR-036 exist, the total and median time of the gate, the critic and the commit scan. A row that the events cannot hold (the manual critic split; the MET and UNMET counts of a verdict; pass-limit banners of a log) MUST be printed as not in the events, never estimated. Unclosed attempts MUST be shown as unclosed, unknowns as null, and no duration MUST be imputed. It MUST print no speed-up estimate and no judgment as fact. *Why: the measurements of this spec had to be paired by hand and two of the evaluation's figures could not be reproduced (M2); Principles XI and XIII.*
  - anchor: A13; ledger M2, M3, M4, M6, M8, M10; Principles XI, XIII; constraint 15
  - switch: none; parity: not used
  - test: CT-153-40

- **F153-FR-041**: The output of `specstride report` MUST be terse by default and structured on request (`--json`, §G.1), and its exit codes are those CQ-153-16 A rules: 0 on any readable state; 1 without state or without the feature. *Why: Principle XIX, command output is terse by default; §G.4 lists codes per command.*
  - anchor: Principle XIX; §G.1, §G.4
  - switch: none; parity: not used
  - test: CT-153-41

#### G3 — Parallel and scoped checks

- **F153-FR-042**: Concurrent verification commands on the gate path and the inner path MUST follow F148-FR-011 to F148-FR-017 as written: `verification.parallelism` with the default 1 and the ceiling 4; batches only from reads and writes declared in the frozen manifest; every admission and refusal recorded; a process group, temporary directory, output cap and time limit per command; a taint lowering the parallelism to 1 for the rest of the run; a failure in a batch re-run alone; durations measured in a batch flagged `concurrent`. *Why: Principle XX, parallel work only after deterministic checks of write scopes.*
  - anchor: F148-FR-011 to -017; Principle XX; §X.7 row 7; constraint 17
  - switch: `verification.parallelism` (row 7, DV-080); parity: 1
  - test: CT-153-42

- **F153-FR-043**: The repository's own test command MAY run its workspaces in parallel. Each workspace MUST keep its PID-namespace isolation and its output buffer, the degree of parallelism MUST be bounded and fixed by the command, the results MUST be reported in workspace order and never by completion, and the command MUST fail when any workspace fails. *Why: the suite runs 32 workspaces one after another on a 22-core host (T1, T2) and is part of every attempt (T4); the isolation exists so that a test can never signal the host (A16).*
  - anchor: A16; ledger T1, T2, T4; Principles XII, XVII
  - switch: none (a change of this repository's test command, not of engine behaviour); parity: n/a
  - test: CT-153-43

- **F153-FR-044**: The parity of F153-FR-043 for the oracle: the oracle and the fixtures MUST NOT depend on the order in which workspaces finish. *Why: Principle XVIII; a result ordered by completion would make the suite's output differ run to run.*
  - anchor: Principle XVIII; F148-FR-015 (order rule, by analogy)
  - switch: none; parity: holds
  - test: CT-153-44

- **F153-FR-045**: With the switch on, an in-pass check MAY run a subset of the inner check set: the declared commands whose workspace a changed file belongs to, and the declared commands of every workspace that depends on one of them by a reverse-dependency walk of the static package graph. The graph MUST be read as data, taken at phase entry. Only declared fixed-argv commands MUST be selected; no command MUST be synthesised from the graph. The selection MUST be a pure table with a rule id, recorded. *Why: Principle XIV, scoping selects among declared commands and never invents one; the graph is the seam for scoped tests (A15).*
  - anchor: A15; Principles III, XIV; F115-FR-013; ledger R5, T3; constraint 16
  - switch: `verification.inner.scoped`, default on; parity: off (every command of the inner set runs, F115-FR-013)
  - test: CT-153-45

- **F153-FR-046**: The full inner set MUST be selected when the package graph changed since phase entry, cannot be read, or fails its schema; when a changed file maps to no workspace; or when a declared command maps to no workspace. *Why: uncertainty must widen the in-pass set and never narrow it (constitution grounding T-g).*
  - anchor: Principle III; constitution grounding T-g; constraint 16
  - switch: as F153-FR-045; parity: off
  - test: CT-153-46

- **F153-FR-047**: Ruling CQ-153-08. The verification gate of the phase MUST run the full declared set of its gate; scoped selection MUST apply to in-pass checks only. A scoped result MUST never be eligible for reuse (F153-FR-013). *Why: the gate is what approval rests on; narrowing it would let a change escape the suite.*
  - anchor: F105-FR-032; constitution grounding T-g; constraint 16
  - switch: none; parity: holds
  - test: CT-153-47

#### G4 — Per-task critic evidence and carried confirmations

- **F153-FR-048**: Delivers F117-FR-030 to F117-FR-032 in the engine path. Before each critic call the runtime MUST hash the priority files, append the pin block `PREVIOUSLY CONFIRMED (W9 verdict pins)` for criteria confirmed earlier against the same backing hash, update the pins only on a parsed REJECTED with a computed hash and at least one criterion id, never on MALFORMED, and remove the pins of the phase on APPROVED; a failure MUST only give the warning `W9 pin load skipped`. A pin MUST never be shown for a file set whose backing hash changed. *Why: in phase 2 of feature 152 the critic went from 38 MET to 1 MET and back with no carried confirmation (M8); the pins are ported, as-is behaviour.*
  - anchor: A10; F117-FR-030, -031, -032; ledger M8, C13; constraint 2, 19
  - switch: none (delivery); parity: on
  - test: CT-153-48

- **F153-FR-049**: Ruling CQ-153-12. The pins MUST be the one sanctioned carry-over of a critic-class input across phase attempts. They MUST carry only the phase that keys them, the backing hash and the confirmed criterion ids (F117-FR-032), and no count, repair, retry, escalation, feedback or check output. A pin MUST inform the critic and MUST NOT approve; the critic MUST still judge every criterion. *Why: F117-FR-027 makes two runs of one final state give byte-identical prompts; the pins are the exception that F117-FR-030 itself defines, and Principle II forbids the history of repairs in a critic input.*
  - anchor: F117-FR-027, -030; Principle II; constitution grounding T-e; constraint 19
  - switch: none; parity: on
  - test: CT-153-49

- **F153-FR-050**: Delivers F117-FR-027 in the engine path. No critic-class input MUST hold the output of a check, an earlier result of a check, a count of cycles, repairs, passes or checks, a time or duration of work, a model tier, a session or a routing decision. The output of the verification gate that the engine's critic prompt holds today MUST be removed. The final result of each unit MUST reach the critic only through the fact block (F116-FR-016 to F116-FR-019). *Why: the engine places the redacted gate output under "# The check the engine ran itself" in the critic prompt (A5), which F117-FR-027 forbids (tracked defect D-1).* F153-FR-019 and F153-FR-028 state the same rule for two named sources, the red-gate feedback and the commit scan; each keeps its own test.
  - anchor: A5; F117-FR-027; F116-FR-016 to -019; Principle II; constraint 9
  - switch: none (conformance); parity: on under every profile — CQ-153-10
  - test: CT-153-50

- **F153-FR-051**: With the switch on, the critic's evidence MUST be built per task: for each task of the phase (or of the group, G5), the files and tests the task names, mapped through the canonical model, excerpted from the tree after the pass has exited within the grounding budget of F117-FR-011 scaled by the window of the critic model actually used (F117-FR-025), in place of the whole diff capped at 200,000 bytes. *Why: 8 rejections were "no diff shows it" (M4), and new files over 40,000 bytes are named but not shown (A9); Principle IX sizes the budget from the window actually used.*
  - anchor: A9; F117-FR-007 to -012, -025; Principles III, IV, IX; ledger M4, C2; constraint 18
  - switch: `critic.evidence.perTask`, default on; parity: off (the capped whole diff of A9)
  - test: CT-153-51

- **F153-FR-052**: With per-task evidence on, every change of the candidate outside the files of every task MUST still be shown or named, and a path left out by a cap MUST be named NOT-SHOWN, never missing (F117-FR-008). *Why: narrowing the evidence must never hide work; "disk beats prose" (Principle III).*
  - anchor: F117-FR-008, -009; Principle III; constraint 18
  - switch: as F153-FR-051; parity: off
  - test: CT-153-52

- **F153-FR-053**: Evidence selection MUST be the engine's: it MUST read the tree and the canonical model, never the proposer's checkpoint note (F115-FR-009) or the handoff (F117-FR-018), and per unit it MUST hold only the final check result through the fact block. *Why: Principle II, the critic does not see the history of repairs; F115-FR-009, the note never reaches a critic.*
  - anchor: F115-FR-009; F117-FR-018; F116-FR-016, -017; Principle II; constraint 18
  - switch: as F153-FR-051; parity: off
  - test: CT-153-53

#### G5 — Task groups and the pass handoff

- **F153-FR-054**: With the switch on, the canonical model MUST slice each phase into task groups at derivation, by a pure table with the rule ids TG-1 to TG-3 and the group size that CQ-153-15 A rules — a group of at most `loop.taskGroups.size` tasks, an integer ≥ 1 whose default 5 is a starting value with low confidence that a project file may lower but not raise — in task order; the slicing MUST be frozen and hashed in the launch contract, and changing the sources MUST change the hash. *Why: a unit today is the proposer's checkpoint claim, not a derive-time slice (A12, T6); Principles IV and XIII.*
  - anchor: A12; Principles IV, XIII; ledger M7, T6; constraint 20
  - switch: `loop.taskGroups`, default off — on only after one trial run with groups on has been read with `specstride report` (CQ-153-15 answered A on 2026-11-13); size key `loop.taskGroups.size`, default 5; parity: off (a unit is a checkpoint claim, F115-FR-009)
  - test: CT-153-54

- **F153-FR-055**: Each group MUST carry a declared write scope and a declared acceptance check of fixed argv taken from the declarations (F105-FR-015). A group without a resolvable check MUST be recorded `unchecked`, never rejected and never passed. *Why: Principle XIV; Principle XX needs declared write scopes before anything runs beside it.*
  - anchor: Principles XIV, XX; F148-FR-003; constraint 20
  - switch: as F153-FR-054; parity: off
  - test: CT-153-55

- **F153-FR-056**: When the proposer's checkpoint completes a group, the runtime MUST run the group's acceptance check through the one runner and MAY make a group review, a critic-class call with a fresh session, a nonce and no tools. Under ruling CQ-153-07 A (answered 2026-11-13), the review's only durable effect MUST be pins (F117-FR-030); it MUST write no approval, spend no outer counter, and add no exit code or stop reason. *Why: Principle II keeps the phase gate the only source of a verdict; F100-FR-031.*
  - anchor: Principles II, XX; F100-FR-031; F117-FR-030; constitution grounding T-f; constraint 21, 22
  - switch: as F153-FR-054; parity: off
  - test: CT-153-56

- **F153-FR-057**: Ruling CQ-153-07, answered A on 2026-11-13: approval and commit MUST stay per phase — the phase gate runs the full verification gate and a fresh critic call over the whole phase. No group-approval route is taken (CQ-153-03 was refused on 2026-11-13), so no group approval, no per-group void rule and no FX-27 register row exists in this feature. *Why: one approval and one commit per approved phase is F101-FR-011, -029, -035 and FX-27; changing it is the owner's.*
  - anchor: F101-FR-011, -029, -035; F101-SC-005 (FX-27); CQ-153-03; constraint 21
  - switch: as F153-FR-054; parity: off
  - test: CT-153-57

- **F153-FR-058**: Delivers F103-FR-041 in the engine path. With `carry.ledger_handoff` on, the engine MUST write the handoff `feature:<slug>:handoff` at the start of every pass, regenerated and never appended, at most 6 KB (`carry.handoffMaxBytes`), never read back by the runtime, written by no model, and refused by grounding. Its content MUST be F103-FR-041's list as written, which names more besides — among it the remaining units of work (the plan less the ledger) and the pointers to the feedback files — with the task ids read from the canonical model, never from the proposer's checkpoint claim; the last failing output MUST be carried by a pointer to the feedback of F153-FR-016 (CQ-153-14 answered A on 2026-11-13: a pointer); the ledger tail is empty — CQ-153-19 answered B on 2026-11-13, tracked limitation L-6. It MUST NOT be merged into a critic prompt the way the handoff of parallel units is. *Why: every pass is a fresh session (A11), and context is to be "carried through files" (Principle VIII); the writer exists and is not called.*
  - anchor: A11; F103-FR-041; Principles VIII, IX, XVI; §X.7 row 8; constitution grounding T-i; constraint 23
  - switch: `carry.ledger_handoff` (row 8, DV-092); parity: off
  - test: CT-153-58

- **F153-FR-059**: Under the `parity` profile every pass MUST stay a fresh session (F103-FR-003). This feature MUST NOT change the session rules of F103-FR-042. *Why: the oracle runs with session continuation off (Principle XVIII).*
  - anchor: F103-FR-003, -042; Principle XVIII
  - switch: none; parity: holds
  - test: CT-153-59

#### G6 — Tests and parity

- **F153-FR-060**: Every switch of this feature MUST have a parity test and a characterization test. Tests MUST use fake binaries, stub agents and recorded fixtures, with no call to a paid or external model API. *Why: Principle XII; Development Workflow, "Parity tests and characterization tests are required tasks."*
  - anchor: Principles XII, XVIII; Development Workflow; constraint 27
  - switch: n/a; parity: n/a
  - test: CT-153-60

- **F153-FR-061**: Under the `parity` profile, with this feature present, the oracle MUST report 0 results `different` other than rows the divergence register holds with the owner's ruling; each delivered requirement (F153-FR-010, -011, -016, -034, -037, -048, -050, -058 with its row) MUST be checked against the as-is behaviour it restores. *Why: Principle XVIII, an intended difference is a register row, never a test failure.*
  - anchor: Principle XVIII; F100-FR-212
  - switch: n/a; parity: as stated
  - test: CT-153-61

### Key Entities

- **Gate binding**: the commands, runner, argv pins and tree fingerprint of one verification gate run; the key that reuse compares (F153-FR-013).
- **Reuse decision**: the record of an eligibility check: the source result, the rule id, the outcome; bound into the approval record when used.
- **Red-gate count**: the durable count of red gates of a phase, derived from the ledger; with its limit, the bound of F153-FR-021.
- **Commit-scan result**: rule ids, files, lines and the signature of one scan of one tree, from one typed unit; for the pre-critic step, the commit step and the in-pass command.
- **Check end**: the result of a command ended at its limit: no exit code, signal `TIMEOUT`, the escalation taken.
- **Workspace selection**: the changed workspaces, the dependents found, the commands selected, the rule id; or the reason the full set ran.
- **Per-task evidence**: per task, the files and tests named, their excerpts or presence lines, and the list of changes outside every task.
- **Task group**: a derive-time slice of a phase: task ids, write scope, acceptance check or `unchecked`, its hash in the launch contract.
- **Report**: a read-only projection of the events into the rows of F153-FR-040.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Derived from the measurements; none is a speed-up estimate.

- **F153-SC-001**: Specific red gates. On the fixture "two named tests fail", the red-gate feedback names each failing line the F105-FR-037 summary lists and each failed command with its exit code in 100 % of attempts; the number of red-gate notices that hold no failure while a summary could be produced is 0 (against 17 of 17 in feature 152, M5).
- **F153-SC-002**: No leak in a notice. Over a property test with at least 1,000 planted secrets of every pattern of the scan and of registered secrets in test output, the number of bytes of a secret found in any feedback, event or report output is 0 (the measure of F152-SC-004).
- **F153-SC-003**: The critic is not spent on a blocked candidate. With both switches of F153-FR-024 on, the number of critic calls made in an attempt whose candidate change the scan blocks is 0. On the fixture "credential in a test fixture" (the shape of 2 of the 4 blocks of feature 152, M4), the blocked attempt makes 0 critic calls.
- **F153-SC-004**: One suite run per attempt on an unchanged tree. With the micro layer on and a closing check equal to the gate on the same tree, the declared commands execute once per phase attempt at the phase gate (F153-FR-012). With reuse ruled in and on, they execute 0 times at the gate when the tree is unchanged since a green, eligible in-pass run, and once in every other case.
- **F153-SC-005**: Every attempt closes. Over every fixture of this feature, killing the engine at each step included, the number of `attempt.started` without exactly one `attempt.ended` is 0 (against 47 of 84 in feature 152, M2).
- **F153-SC-006**: No hung check survives. On a fixture whose command forks a grandchild that ignores SIGTERM and holds the pipes, on each of the three check paths, the check ends within its limit plus the grace, with 0 processes of its group left and 0 signals sent outside the group, in 100 % of runs where process groups are available.
- **F153-SC-007**: Pins never lie. Over a property test of random edits between attempts, the number of pins shown for a file set whose backing hash changed is 0, and the number of pins left after APPROVED is 0.
- **F153-SC-008**: The report reproduces the measurements. On a fixture made from a copy of feature 152's event file (CQ-153-18), `specstride report` gives the same counts as the ledger method applied to the same copy for every row of F153-FR-040 the events hold, prints every other row as not in the events, and changes 0 files (a file-system comparison before and after).
- **F153-SC-009**: Red gates are bounded and do not burn critic rejections. On the fixture "the gate fails every attempt" with the switch on, the run halts after exactly the red-gate limit's red gates, with the ruled stop reason, is relaunched 0 times, and the reject count stays 0; on a fixture shaped like phase 2 of feature 152 (red gates and critic rejections interleaved), the reject count equals the number of critic REJECTED and MALFORMED verdicts.
- **F153-SC-010**: No check output reaches the critic. Two runs that reach the same final tree and phase evidence with different check outputs and different red-gate histories give byte-identical critic prompts apart from the nonce, the boundary token and the pins.
- **F153-SC-011**: The gate is never scoped. Across every fixture, the verification gate runs the full declared set of its gate in 100 % of attempts; a changed graph or an unmapped changed file selects the full inner set in 100 % of cases.
- **F153-SC-012**: Narrowed evidence hides nothing. Across every fixture with per-task evidence on, the number of changed files neither shown nor named in the critic prompt is 0.
- **F153-SC-013**: Parity holds. Under the `parity` profile the oracle reports 0 results `different` beyond register rows with the owner's ruling, with this feature present.
- **F153-SC-014**: The handoff stays out of judgment. Across every fixture with `carry.ledger_handoff` on, the handoff is at most 6 KB, is rewritten at every pass, is read back by the runtime 0 times, and appears in 0 critic prompts.
- **F153-SC-015**: Groups stay honest. Across every fixture with task groups on, every group has a declared acceptance check or is recorded `unchecked`, and the number of approval records written by a group review is 0 under ruling CQ-153-07 A (answered 2026-11-13).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. Keys are proposals; feature 110 confirms the spelling. Rows marked
"new" get the next free numbers at approval (on 2026-11-12 in this checkout: §X.7 ends at row 134,
§X.6 at row 286, the register at DV-122).

| Behaviour | Key | Default | Under `parity` | Owner | Register row | Row of §X.7 |
|---|---|---|---|---|---|---|
| 1a′ gate runs the plan's commands through the runner (F153-FR-010, -011) | none (delivery) | on | on (CQ-153-11 A) | 153 | none if confirmed; else new | none if confirmed; else new |
| 1a″ skip a closing check equal to the gate (F153-FR-012) | `loop.micro.closingCheck.skipWhenEqualToGate` | on | off | 153 | new | new |
| 1a reuse a green in-pass result (F153-FR-013, -014) | `verification.gate.reuse` | not built (CQ-153-02 B) | off | 153 | none (CQ-153-02 answered B on 2026-11-13) | none |
| 1b failure summary (F153-FR-016) | none (delivery) | on | on | 105 | — | 126 (exists) |
| 1c red-gate budget (F153-FR-020 to -023) | `verification.redGate.ownBudget` | on | off | 153 | new | new |
| 1d scan before the critic (F153-FR-024) | `commit.gate.beforeCritic` | on | off | 153 | new | new (row 134 unchanged) |
| 1d′ in-pass scan named to the proposer (F153-FR-027) | `commit.scan.inPass` | on | off | 153 | new | new |
| 1e enforced time limit (F153-FR-029 to -032) | `verification.timeLimit.enforce` | on | on (CQ-153-13 answered A on 2026-11-13: a defect fix) | 153 | new — the defect-fix row | new |
| 2 gate and attempt events (F153-FR-034, -037) | none (delivery) | on | on | 105, 111 | — | — |
| 2 critic pair (F153-FR-035) | none | on | on (CQ-153-09 A) | 111 | — | — |
| 2 commit-gate timed pair (F153-FR-036) | `events.commitGateTiming` | on | off | 153 | new | new |
| 2 `specstride report` (F153-FR-039 to -041) | none | — | not used | 153 | — | — |
| 3 concurrent commands (F153-FR-042) | `verification.parallelism` | 1 (ceiling 4) | 1 | 148 | DV-080 | 7 (exists) |
| 3 scoped in-pass selection (F153-FR-045, -046) | `verification.inner.scoped` | on | off | 153 | new | new |
| 4 verdict pins (F153-FR-048, -049) | none (delivery) | on | on | 117 | — | — |
| 4 no check output to the critic (F153-FR-050) | none (conformance) | on | on — CQ-153-10 | 117 | — | — |
| 4 per-task evidence (F153-FR-051 to -053) | `critic.evidence.perTask` | on | off | 153 | new | new |
| 5 task groups (F153-FR-054 to -057) | `loop.taskGroups` | off until one trial run is read (`loop.taskGroups.size` default 5, CQ-153-15 A) | off | 153 | new | new |
| 5 handoff (F153-FR-058) | `carry.ledger_handoff` | on | off | 103 | DV-092 | 8 (exists) |

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Change | Owner | Closed by | Row of §X.6 |
|---|---|---|---|---|
| Stop reasons (§E.3) | None under the recommended answer of CQ-153-05 | 100 | Owner decision | 3 |
| Exit codes of the engine (§E.4) | None under the recommended answer of CQ-153-05 | 100 | Owner decision | 3 |
| Exit codes per command (§G.4) | Add `specstride report` (CQ-153-16) and the in-pass scan command (CQ-153-17) | 100 | Owner decision | 7 |
| Kinds of phase attempt (§E.1) | None | 149 | Design | 9 |
| End causes of a phase attempt (row 272) | None under the recommended answer of CQ-153-09 | 111 | Design | 272 |
| Event catalogue (F111-FR-001) | Add the pair of F153-FR-036 (additive inside the major) | 111 | Design, CQ-153-09 | — |
| Conditions of a check result (F148-FR-003) | None | 148 | Design | — |
| Kill reasons (F118-FR-007) | None | 118 | Design | — |
| Rule ids of reuse eligibility (F153-FR-013) | New set; members fixed by the plan | 153 | Design | new |
| Rule ids of workspace selection (F153-FR-045, -046) | New set; members fixed by the plan | 153 | Design | new |
| Steps of the commit scan (F153-FR-036) | `pre-critic`, `commit` (new set) | 153 | Design | new |
| Rows of the report that the events cannot hold (F153-FR-040) | `not-in-events` marking (new set of one value plus `null`) | 153 | Design | new |

## Cross-spec amendments

Proposed here; made only by the owner of each spec. This feature edits no other spec.

| Spec / requirement | Amendment (proposed text or delta) | Why | Ruling? |
|---|---|---|---|
| Constitution, Principle II | The text of CQ-153-02 (constitution grounding, "Constitution amendments proposed") | F153-FR-013 | Yes, CQ-153-02 |
| Constitution, Principle II (conditional) | The text of CQ-153-03 | F153-FR-057, route ii | Yes, CQ-153-03 (only with CQ-153-07 C) |
| F101-FR-005 | After "No result of an earlier run of a check MUST stand in for the verification gate" add: "except a result that F153-FR-013 makes eligible, with the switch `verification.gate.reuse` on; it is recorded as reused and bound into the approval record." | F153-FR-013 | Yes, CQ-153-02 |
| F105-FR-033 | Add: "With `verification.gate.reuse` on, a result of the runtime's check runner that F153-FR-013 makes eligible is accepted; no other result of an inner check is." The loop-layer clause names F153-FR-013 as its exception | F153-FR-013 | Yes, CQ-153-02 |
| F100-FR-232 (annex C §C.8) | Add the same exception to "With a loop layer engaged… the verification gate MUST reuse nothing" | F153-FR-013 | Yes, CQ-153-02 |
| F101-FR-014 | Add: "With the switch `verification.redGate.ownBudget` on, a failed verification gate uses one attempt of the red-gate budget of F153-FR-021 instead of the reject limit." | F153-FR-020 | Yes, CQ-153-05 |
| F105-FR-005 | Replace "and the rejection MUST count toward the reject limit" by "and the rejection MUST count toward the reject limit, or, with the switch of F153-FR-020 on, toward the red-gate budget" | F153-FR-020 | Yes, CQ-153-05 |
| F101-FR-011, -029, -035 | None under CQ-153-07 A. Under B or C: approval and commit per task group | F153-FR-057 | Yes, CQ-153-07 |
| F101-FR-033 | None: the post-approval order is unchanged; the pre-critic scan comes before the critic | F153-FR-024 | No |
| F103-FR-041 | None under CQ-153-14 A. Under B: add "the last failing output, capped" to the content list | F153-FR-058 | Yes, CQ-153-14 |
| F111 catalogue (F111-FR-001) | Add `commit_gate.started` (open, partner `commit_gate.ended`) and `commit_gate.ended` (close) with `phase`, `attempt`, `step`, `durationMs`, `outcome`, `hits`, `synthesized`; add the pair to "Pairs" | F153-FR-036 | Yes, CQ-153-09 |
| F111-FR-031 | Add: `commit_gate.blocked` names the step (`pre-critic`, `commit`) | F153-FR-036 | No |
| F115 (closing check) | Add: with the switch of F153-FR-012 on, a closing check equal to the gate on the same tree is not run | F153-FR-012 | No (design) |
| F115-FR-013 | Add: with `verification.inner.scoped` on, an in-pass check runs the selection of F153-FR-045 | F153-FR-045 | No (design) |
| F116 | None: reuse reads F116-FR-005, -006, -008 as written | — | No |
| F117-FR-027 | Add a note: "The pins of F117-FR-030 are the sanctioned carry-over across phase attempts." | F153-FR-049 | Yes, CQ-153-12 |
| F117-FR-030 to -032 | None (delivered) | — | No |
| F118-FR-007 | None: a check kill is not a pass kill | F153-FR-032 | No |
| F129 | None; `specstride report` follows F129-FR-015 as a reader | F153-FR-039 | No |
| F148-FR-004 | Add: "A group still alive after SIGTERM and a grace is sent SIGKILL; a signal targets only the group of the command." | F153-FR-030 | No (design) |
| F149-FR-004 | Add "a commit-gate block before the critic" to what does not count toward K | F153-FR-024 | No (follows CQ-152-03 A) |
| F152-FR-008 | Replace "act once per phase attempt" by "act at most once before the critic (F153-FR-024) and once at the approval commit per phase attempt" | F153-FR-024 adds a second act | Yes, CQ-153-06 |
| F152-FR-009 | Replace the reason "the gate runs only after the critic's APPROVED, so no critic prompt can hold one" by "no critic prompt holds a result of the commit gate (F153-FR-028)" | F153-FR-028 | Yes, CQ-153-06 |
| Annex E §E.3, §E.4 | None under CQ-153-05 A; under B a new member and its code | F153-FR-022 | Yes, CQ-153-05 |
| Annex G §G.4 | Add rows for `specstride report` and the in-pass scan command | F153-FR-041, F153-FR-027 | Yes, CQ-153-16, CQ-153-17 |
| Annex X §X.6 | New rows for the sets of "Closed sets" marked new | F153-FR-013, -036, -040, -045 | No |
| Annex X §X.7 and the divergence register | New rows of "Rows of the `parity` profile" marked new | F153-FR-005 | Yes, at approval |

## Tracked limitations and defects

- **L-1 Reuse inherits the fingerprint's gap.** Inside an ignored path from which a check executes, only a metadata listing detects a change (Principle III, CQ-197). A reused result carries that risk into the approval (F153-FR-014).
- **L-2 Processes that leave their group.** A grandchild that calls `setsid` escapes a group kill. The repository's own suite keeps its PID-namespace isolation (A16, F153-FR-043); for other projects this is a residual risk. *Implementation pass (2026-11-13):* the enforced limit was re-checked on each of the three engine paths — the verification gate (`loop-speed-limit-gate.test.ts`), the micro layer (`loop-speed-limit-micro.test.ts`) and the check-runner service (`loop-speed-limit-service.test.ts`) — and each kills a grandchild that inherits the group at the declared limit; the fixtures spawn no `setsid` grandchild, so that case stays a residual risk, untested on all three paths.
- **L-3 The critic split is a reading.** "Missing or wrong" against "no evidence" is a manual reading of verdicts (M4); the report never prints it (F153-FR-040). *Implementation pass (2026-11-13):* confirmed — the report rows of `contracts/schemas/report-rows.schema.json` carry no critic-split column and `specstride report` prints none.
- **L-4 The inner path runs one command at a time.** Feature 115's call point hands the layer the inner set and a runner of one command, so `verification.parallelism` above 1 batches the commands of the verification gate only (F153-FR-042 constrains concurrent commands; it does not require them). Batching in-pass checks is a follow-up of feature 115. Raised by the analysis of the tasks. *Implementation pass (2026-11-13):* confirmed as delivered — the engine's inner path still runs one command at a time (`verification.parallelism` batches the gate's commands only, `loop-speed-parallelism.test.ts` T292); no in-pass check of the fixtures ran in a batch and no measurement was taken, so the implementation records no evidence that any in-pass check would have gained from one.
- **L-5 The marker prefixes do not know `node --test`'s failing lines.** `MARKER_PREFIXES` (`FAILED `, `ERROR `, `E   `, `packages/verification/src/summary/failure-summary.ts` :60) lists none of the `not ok` lines that `node --test` prints (a suite prints its failures last), so the `Failing assertions / tests:` section of F153-FR-016 is empty for a suite run through `node --test`; the tail still carries the lines. Reported to the owner of feature 105 (amendments.md); the prefixes are feature 105's closed vocabulary. Raised by the analysis (finding G1), 2026-11-13.
- **L-6 The handoff's ledger tail is empty.** The engine path writes no signed pass ledger of F103-FR-039/-040, so the handoff of F153-FR-058 carries an empty ledger tail (CQ-153-19 answered B on 2026-11-13); wiring the ledger stays a follow-up of feature 103.
- **D-1 Check output in the critic prompt.** The engine's critic prompt held the redacted gate output under "# The check the engine ran itself" (A5), against F117-FR-027. REMOVED (T181): the block and the variable that captured the output are gone from the engine path (`loop-speed-critic-input.test.ts`), CQ-153-10 answered A on 2026-11-13: no baseline origin carries it, and the guards `ct-153-1-153.test.ts` and `ct-153-7-153.test.ts` hold the rule.
- **D-2 The engine's critic prompt is not the assembler of feature 117.** Its role line and blocks differ from F117-FR-021 and F117-FR-029 (Assumptions). This feature wires only the pins (F153-FR-048), through the pins module of feature 117 and beside the assembler (plan.md, "Critic design"), and F117-FR-027 (F153-FR-050); adopting the assembler is a follow-up of feature 117. *Implementation pass (2026-11-13):* what the engine path still does not use of the assembler — the role line of F117-FR-021, the `as-is` block set of F117-FR-029, and the assembler's own composition in `packages/core/src/critic-input/` (the guard `ct-153-1-153.test.ts` holds the no-import rule).

## Clarifications

### Session 2026-11-12 (ruling requests); CQ-153-01 answered in stage 1, CQ-153-02 to -19 answered by the owner on 2026-11-13

| Id | Question | Options | Recommended | Status | Anchors |
|---|---|---|---|---|---|
| CQ-153-01 | Is v3.0.3 the constitution baseline? | — | Not raised: no engine Sync Impact Report after 2026-11-08 exists | **Answered** (stage 1) | constitution grounding, "Constitution checked" |
| CQ-153-02 | May the gate stand on a green in-pass result (amends Principle II, F101-FR-005, F105-FR-033, F100-FR-232), and with which equality? | A: yes, with the full equality of F153-FR-013 (runner, pinned argv and command set, full set, fingerprint and protected set equal so `current`, pins verify, no condition, no `TIMEOUT`, no later merge or runtime write), recorded `reused` and bound into the approval record; the bump PATCH or MAJOR as the owner reads it. B: no; the gate executes every attempt | B for now, A as the owner's choice: II "cannot be justified away", and the fallback (F153-FR-010 to -012) keeps most of the gain without it. Under A, F153-FR-013 and -014 are built behind `verification.gate.reuse`; under B, F153-FR-015 applies | Answered (owner, 2026-11-13): B | Principle II; T-a; F101-FR-005; F105-FR-033; F100-FR-232 |
| CQ-153-03 | (Conditional on CQ-153-07 C.) May a task group inside a phase get its own approval? | A: adopt the MAJOR amendment of Principle II of stage 1. B: refuse | B unless the owner wants group commits now: route i (CQ-153-07 B) needs no constitution change | Answered (owner, 2026-11-13): B (refused) | Principle II; T-f |
| CQ-153-04 | Is `SPECSTRIDE_LIMITS=off` a sanctioned setting, and may it lift a check's time limit? | A: it never lifts a check's declared time limit; the run records that limits are off. B: it lifts it to a hang ceiling whose value the owner sets. C: it lifts it, recorded | A: Principle XV; the number comes from the declaration, so no new number is needed. Under A or B, F153-FR-031 holds as written; under C, F153-FR-031 is withdrawn and recorded as a register row | Answered (owner, 2026-11-13): A | Principle XV; T-j; A4 |
| CQ-153-05 | A red gate's budget, its stop reason and exit code; and how a pre-critic commit-gate block counts | Budget: A: its own limit `verification.redGate.limit`, default 3 (the reject limit's default, F101-FR-014); B: the reject limit, with the ordinal kind `gate-failed` only (no new budget). Stop: A: `max_rejects`, exit 2, with the cause `verification-failed` in the terminal record (no change of §E.3 or §E.4); B: a new member of §E.3 with exit 2. Pre-critic block: A: counts as F152-FR-005 (reject limit, signature halt); B: counts toward the red-gate budget | Budget A, stop A, block A. Stop A matches the limit it mirrors and adds no member; note that pin CT-101-18 forbids a halt sharing the stop reason of a *blocked reason*, which a limit halt is not. Block A keeps F152 uncontradicted. Under budget B, F153-FR-020 to -023 shrink to a ledger kind and the reject count is unchanged | Answered (owner, 2026-11-13): A (budget A, stop A, block A) | F101-FR-014; F105-FR-005; F149-FR-004; F152-FR-005; §E.3, §E.4; T-b |
| CQ-153-06 | Does the commit scan run before the critic always, or only with F152's switch on? And may F152-FR-008 and -009 be amended for it? | A: only with `commit.backpressure` on; amend F152-FR-008 and -009 as the cross-spec table says. B: always, with a block before the critic handled as a rejection of its own when F152 is off | A: with F152 off, a block is only reported, the run goes on, and the run exits 1 at its end (F152-FR-022), so a pre-critic block would leave the attempt with no defined effect. Under B, a new rejection path is needed | Answered (owner, 2026-11-13): A | F152-FR-008, -009, -021, -022; T-d |
| CQ-153-07 | The unit of approval and commit (F101-FR-011, -029, -035; FX-27) | A: stays the phase; groups are checked and reviewed only. B: route i — groups are phases of the canonical model, with a register row for FX-27. C: route ii — groups inside a phase get their own approvals (needs CQ-153-03) | A: smallest change; groups still give per-group checks, reviews and pins. B is the seam for the "alongside" follow-up | Answered (owner, 2026-11-13): A | F101-FR-011, -029, -035; F101-SC-005; T-f |
| CQ-153-08 | May the approval gate ever run a scoped selection? | A: never. B: under an explicit consumer declaration | A: the gate is what approval rests on (F153-FR-047); under B, a declaration of the consumer (never the project) and a register row | Answered (owner, 2026-11-13): A | F105-FR-032; T-g |
| CQ-153-09 | New event types and `endCause` members; the catalogue version | A: add the pair `commit_gate.started`/`commit_gate.ended` (additive); no new `endCause` (F153-FR-037 maps every cause); `critic.started`/`critic.call` on under `parity`. B: also a new `endCause` `commit-blocked` | A: the report tells a block from a critic rejection by joining `commit_gate.blocked`. Under B, F153-FR-037 maps a block to the new member and F153-FR-038 names it. The catalogue's version string was not found in spec 111 or its contracts; the plan states the bump | Answered (owner, 2026-11-13): A | F111-FR-001, -004, -010; §X.6 row 272 |
| CQ-153-10 | The gate output in the engine's critic prompt (A5): remove it under every profile? | A: remove under every profile as F117-FR-027 conformance (tracked defect D-1). B: keep under `parity` if a baseline origin carries it, with a register row | A: no ported requirement found carries check output into the critic; F117-FR-029's `as-is` block set holds exactly the F117-FR-021 blocks. Open only for the owner to confirm no baseline origin exists. Under B, F153-FR-050 is off under `parity` with a register row | Answered (owner, 2026-11-13): A | F117-FR-027, -029; A5 |
| CQ-153-11 | Is the gate running the plan's commands through the runner (F153-FR-010, -011) a restoration, on under `parity`? | A: yes, delivery of F105-FR-015, -018, -032 and F148-FR-005. B: the literal `npm test` is as-is; a register row turns the change on | A: discovery of a Node project gives the script `test` through the plan (F105-FR-017), so the declared command is the as-is one; the literal path outside the plan has no requirement behind it. Under B, a new row, off under `parity` | Answered (owner, 2026-11-13): A | A1; F105-FR-015, -017, -018, -032; F148-FR-005 |
| CQ-153-12 | Are the pins the sanctioned carry-over across attempts against F117-FR-027's byte identity? | A: yes, add the note to F117-FR-027. B: F117-FR-027 forbids them; pins are dropped | A: F117-FR-030 is in the same spec and its plan passed pins under Principle II | Answered (owner, 2026-11-13): A | F117-FR-027, -030; T-e |
| CQ-153-13 | The value of the enforced time limit under `parity` | A: on under `parity`, ruled a defect fix by a register row (a hang is not baseline behaviour the oracle compares). B: off under `parity` (as-is: SIGTERM to the child on the micro path, no limit on the gate) | A: F148-FR-002 and -004 already require the group and the limit; without a ruling, B applies and F153-FR-029 to -032 are off under `parity` | Answered (owner, 2026-11-13): A | F148-FR-002, -004; A2, A4; constitution grounding "Profiles" |
| CQ-153-14 | Does the handoff carry the last failing output, or a pointer to it? | A: a pointer to the feedback (F103-FR-041 already lists "the pointers to the feedback files"). B: the capped output, amending F103-FR-041 | A: no amendment, within 6 KB | Answered (owner, 2026-11-13): A | F103-FR-041; T-i |
| CQ-153-15 | The slicing rule and group size of task groups | A: the owner sets a default size (no number is in the sources); groups follow task order and never split a task. B: groups by declared write scope only | Open: the feature input says "a few tasks" and gives no number; `loop.taskGroups` stays off until answered. Under A, F153-FR-054 uses the ruled size; under B, a group is a class of tasks with one declared write scope | Answered (owner, 2026-11-13): A — a group of at most `loop.taskGroups.size` tasks, default 5 (a starting value with low confidence; a project file may lower it, not raise it) | A12; ledger M7 |
| CQ-153-16 | Exit codes and the §G.4 row of `specstride report` | A: 0; 1 on missing state or feature, as `status` and `events`. B: other | A: the precedent row of §G.4 | Answered (owner, 2026-11-13): A | §G.4 |
| CQ-153-17 | Name and exit codes of the in-pass scan command | A: a subcommand of the CLI; 0 no hit; 2 at least one hit; 1 no state; 3 usage. B: other | A, with the name fixed by feature 110 | Answered (owner, 2026-11-13): A (name `scan`, proposed, confirmed by feature 110) | §G.4; F152-FR-010 |
| CQ-153-18 | Which copy of feature 152's events is the fixture of F153-SC-008? | A: a frozen copy taken at an end of phase, kept as a recorded fixture; acceptance values computed by the ledger method on it. B: a synthetic fixture only | A: the live run moves the "≥" numbers; the 17:50 snapshot of the ledger was not kept as a file. Under B, F153-SC-008 runs on a synthetic fixture with the same row shapes | Answered (owner, 2026-11-13): A | ledger M2, M3 |
| CQ-153-19 | The handoff of F153-FR-058 holds "the last lines of the ledger" (F103-FR-041), and the engine path writes no ledger of F103-FR-039/-040. Does this feature also write it? | A: yes — with `carry.ledger_handoff` on, the engine appends the `pass-closed` records of the signed pass ledger, and the handoff reads them. B: no — the handoff is written with an empty ledger tail, and wiring the ledger stays a follow-up of feature 103 | B until the owner rules: A delivers a second ported requirement that "Where the spec already requires it" does not list. Under A, F153-FR-058 gains the ledger write and its tests; under B it stands as written with an empty tail | Answered (owner, 2026-11-13): B | F103-FR-039, -040, -041; `packages/core/src/carry/ledger-core.ts`; plan.md R8 |

## Constraints carried from stage 1

Every item of "Constraints carried into stage 2" of `constitution-grounding.md` and where it is
stated.

| # | Constraint (short) | Stated in |
|---|---|---|
| 1 | Own switch, default, parity value, rows | F153-FR-005; "Rows of the `parity` profile" |
| 2 | Summary and pins are parity restorations | F153-FR-016, F153-FR-048; "Where the spec already requires it" |
| 3 | Reuse only behind CQ-153-02; fallback stated | F153-FR-012, -013, -015; CQ-153-02 |
| 4 | Reuse eligibility and recording | F153-FR-013, -014 |
| 5 | Gate command from the declaration | F153-FR-010 |
| 6 | Only APPROVED grants | F153-FR-001 |
| 7 | Red-gate budget finite, durable, distinct stop | F153-FR-020 to -023; CQ-153-05 |
| 8 | Notice: F105 frame, ingress, caps, proposer only, out of the record | F153-FR-016 to -019 |
| 9 | No check output in a critic input; :2932 decided | F153-FR-019, -050; D-1; CQ-153-10 |
| 10 | Pre-critic scan depends on F152; commit-time scan stays | F153-FR-024, -025; CQ-153-06 |
| 11 | In-pass scan is advice | F153-FR-027 |
| 12 | Time limit on every path, group kill, SIGKILL | F153-FR-029 to -032; CQ-153-04, -13 (see Assumptions on `TIMEOUT`) |
| 13 | Events additive, no content, best effort, read by no decision | F153-FR-006, -033, -036 |
| 14 | `attempt.ended` for every attempt; new members by ruling | F153-FR-037, -038; CQ-153-09 |
| 15 | Report read-only, facts only, terse | F153-FR-039 to -041 |
| 16 | Scoped selection among declared commands, in-pass only | F153-FR-045 to -047 |
| 17 | Parallel per F148; isolation kept | F153-FR-042, -043 |
| 18 | Per-task evidence by the runtime, within the window, nothing hidden | F153-FR-051 to -053 |
| 19 | Pins as written; the sanctioned carry-over | F153-FR-048, -049; CQ-153-12 |
| 20 | Groups sliced by the canonical model, declared check or `unchecked` | F153-FR-054, -055 |
| 21 | Group approval only by ruling | F153-FR-056, -057; CQ-153-07, -03 |
| 22 | No run state, exit code, stop reason, counter from groups or parallel units | F153-FR-004, -056 |
| 23 | Handoff per F103-FR-041 | F153-FR-058; CQ-153-14 |
| 24 | No harness name in shared control flow | F153-FR-007 |
| 25 | Schemas, core logic, named seams | F153-FR-008 |
| 26 | No secret in a notice, event, record or report | F153-FR-003, -017; F153-SC-002 |
| 27 | Fake binaries, parity and characterization tests, skips | F153-FR-032, -060 |
| 28 | Precedence; project config narrows only | F153-FR-009 |

## Assumptions

- Code facts are from `main` @ `efe8897f` (this checkout): the gate command `checkCommandOf` (`packages/cli/src/engine/run-feature.ts:601-606`); the gate run `runVerificationGate` (:2819-2841); the critic prompt `assemble` (:2925-2932), whose line "# The check the engine ran itself" carries `redacted(checkOutput)`; the failure summary `packages/verification/src/summary/failure-summary.ts`; the pins `packages/core/src/critic-input/pins/store.ts`; the handoff writer `packages/core/src/carry/handoff.ts` (`renderHandoff` :400, `writeHandoff` :483) with no caller in the engine; the micro path's timeout `packages/check-runner/src/command/lisa-executor.ts:75-90`; the static graph `packages/contracts/data/package-graph.json`; the suite runner `scripts/ci-test.mjs:16-42`.
- The engine path imports nothing from `packages/core/src/critic-input/`; its critic prompt opens "You are an independent critic." and not with the role line of F117-FR-021 (D-2).
- The engine on this checkout emits `commit_gate.blocked` (`run-feature.ts:3132`), against the feature input's anchor A13 and ledger row C12, which say no such event exists on `main`. PR #22 (`feat/152-commit-backpressure`, merge `b9e21809`) brought feature 152's phases 2 and 3 to `main`. This spec still builds on F152's requirements only, as the feature input asks.
- On this checkout the contracts data list a 16th stop reason `commit_gate` (`packages/contracts/data/exit-codes.json:21-22`, commit `b6d26882`, citing pin CT-101-18), while annex E §E.3 and F100-FR-148 still state 15 members and spec 152 records CQ-152-01 A (`max_rejects`). This spec cites the annex; the plan reconciles.
- The engine emits `attempt.ended` only on its rejection path (`run-feature.ts:3466`), and emits no `verification.*` or `critic.*` events. Pass events come from the pass loop's announcements (`packages/core/src/pass-loop/announce.ts:104-123`).
- The F111 catalogue (`specs/111-event-schema-and-projection/contracts/event-catalogue.tsv`) already holds `verification.started`/`ended`, `critic.started`/`critic.call`, `check.started`/`ended`, `attempt.started`/`ended`, `recovery.diagnosis_started` and `commit_gate.blocked`; its version string was not found (CQ-153-09).
- Constraint 12 of stage 1 says a killed check is failed "with `interrupted`". F148-FR-003 sets `interrupted` for `cancel` or a stop request, and F148-FR-004 gives a timed-out command no exit code and the signal `TIMEOUT`. This spec follows F148 (F153-FR-029, -032).
- The divergence register is `docs/ecosystem/consolidation.md` on the private `main` (spec 152, Assumptions); its last row in this checkout's specs is DV-122.
- The reject limit's default (3) and its configuration are unchanged.
- Switch keys are proposals; feature 110 owns the spelling.
- The engine constitution v3.0.3 is the baseline (`constitution-grounding.md`).
- Added by the plan's reconciliation and the analysis of the tasks (2026-11-12/13; plan.md, "Reconciliation against the stage prompt and the code"): the delivered requirements this spec names exist as library code that the engine path does not call — the gate, its plan, feedback and summary (`packages/verification/src/`), the group-killing and batch runner (`packages/check-runner/src/command/kind-command.ts`, `batch/`), the pins (`packages/core/src/critic-input/pins/block.ts`) and the handoff (`packages/core/src/carry/handoff.ts`); `lisa-executor.ts` is the baseline executor pinned by CT-148-2, and "the micro path's timeout" above is that file's. A task of the canonical model carries no list of paths: "the files and tests the task names" (F153-FR-051) and the priority files of the pins (F153-FR-048) are read from the task's text. The ingress class `check-output` cuts a text to its first 1,024 bytes by default, so the summary of F153-FR-016 passes the one ingress on its document path (F153-FR-017 holds as written).
