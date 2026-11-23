# Feature Specification: Commit backpressure

**Feature Branch**: `152-commit-backpressure` (a label: Spec Kit creates no branch in this repository; the directory is `specs/152-commit-backpressure`)

**Created**: 2026-11-08

**Status**: Draft

**Input**: User description: "Feature 152-commit-backpressure of Specstride: when a deterministic check blocks the approval commit of a phase, the engine defers the approval and feeds a corrective, template-only block into the next phase attempt — bounded by the existing reject limit, crash-safe, enforced by the engine and never by a hook the agent owns — instead of carrying uncommitted work silently to the end of the run (`docs/huntley-backpressure-prompt.md`, grounded 2026-11-08)."

**Sources**: `docs/huntley-backpressure-prompt.md` (the feature, its background and anchors) and its grounding ledger `docs/prompts/2026-11-08-huntley-grounding-ledger.md`; `specs/152-commit-backpressure/constitution-grounding.md` (constitution v3.0.3, tensions T-a to T-f, constraints 1 to 18); feature 100 annexes A (§A.5), E (§E.1 to §E.4) and X (§X.4, §X.6, §X.7); features 101 (F101-FR-021, -029, -031, -033, -035), 111 (F111-FR-031), 115 (F115-FR-008), 123 (§R.6), 149 (F149-FR-002, -004); owner ruling 2026-11-04 (commit-gate false positive; commits `621cd1ff`, `087a6101`); https://ghuntley.com/ralph/.

**Platform**: Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated, and every statement about macOS is `unverified` (feature 100, Decision 12; ruling 67; F100-FR-025).

## What this feature is

The engine makes one approval commit per approved phase, and the pre-commit scan of feature 100
(F100-FR-206) blocks that commit when a file the runtime wrote holds a registered secret or a
pattern. Today a block changes nothing in the loop. The phase stays approved, the run goes on, and
the only signal is at the end of the run: since the owner's ruling of 2026-11-04 the run exits 1
instead of 0, and the digest says `commits_blocked=N`. The work of the blocked phase sits
uncommitted, and the proposer that produced it never learns why.

This feature closes that gap. A blocked approval commit becomes the input of the next phase
attempt: the approval does not count, the phase gets a new attempt, and the proposer is told —
by the engine, in a fixed template that carries no secret — which rule blocked which file. The
retries are bounded by the reject limit that already exists, and a block that repeats unchanged
halts for a human instead of burning attempts. The enforcement stays in the engine; nothing the
proposer can edit takes part in it.

It also makes the rules of the commit gate owned, versioned data that is pinned at launch, so
that the carve-out for ordinary code (the pattern `key-name-then-value`, today a constant of the
composition root) has an owner, a reason and a version.

**In scope**: the outcome of a blocked approval commit with the switch on (group G1); the bounds,
the halt on a repeated block and how the block counts (G2); the corrective block given to the
proposer (G3); durability and resume (G4); the rule data of the commit gate and its pinning (G5);
the switch, the `parity` profile and the interface rulings (G6); the tracked limitations.

**Out of scope**:

| Out of scope | Owner, reached through |
|---|---|
| The scan itself, its patterns and the redactor | 111; annex X §X.4 (F100-FR-205, F100-FR-206) |
| The verdict grammar, the critic call, the approval record's fields and signature | 101, 149; annex B §B.14, annex E §E.1 |
| The relaunch classifier tables | 123; §R.6 (reads the outcome of this feature, unchanged rows) |
| Project-declared commands run as commit checks (lint, type checks) through EP-05 | The roadmap. This feature's rule data holds patterns only; the seam is left open (see Tracked limitations, L-4) |
| An in-pass warning of the micro-loop layer before the gate | 115, as a later option. It may only repair; it adds no count, exit code or stop reason (F100-FR-031) |
| Masking vectors the syntactic scan cannot see | The critic (intent); recorded here as tracked limitations L-1 to L-3 |

## Why (rationale)

Huntley's loop technique puts the engineering in what rejects bad output, not in what generates
it: "As code generation is easy now, what is hard is ensuring that Ralph has generated the right
thing" (https://ghuntley.com/ralph/, section "phase two: backpressure"). "Anything can be wired in
as back pressure to reject invalid code generation. That could be security scanners, it could be
static analysers, it could be anything. But the key collective sum is that the wheel has got to
turn fast." A rejection only teaches when it re-enters the loop — "loop back is everything" — and
prose rules are signs a model may ignore ("Do not be dismayed if, in the early days, Ralph ignores
this sign … the reward function is compiling code"), so the verifier must be strict and the loop
must feed its verdict back. External, deterministic feedback is what reliably drives a model's
self-correction (Self-Debug, arXiv:2304.05128; Reflexion, arXiv:2303.11366), while self-correction
without it can make results worse (Huang et al., arXiv:2310.01798).

Huntley's own loop feeds failures back through the agent's test run and its plan file; he
describes no commit gate. Turning a blocked *commit* into the next attempt's input is Specstride's
extension of the idea, fitted to an engine in which only the engine commits.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A blocked commit re-enters the loop (Priority: P1)

A consumer runs a feature unattended. In phase 3 the proposer writes a file holding what the scan
reads as a credential, and the critic approves. The commit gate blocks the approval commit. The
consumer comes back to a run that did not drift: phase 3 got a new attempt, the proposer was told
which rule blocked which file, it removed the credential, and the phase was approved and
committed on the next attempt.

**Why this priority**: This is the gap. Without it, a run can end with every later phase built on
uncommitted work, and the agent that caused the block never pays for it.

**Independent Test**: With a stub proposer that plants a secret in attempt 1 and removes it in
attempt 2, and a stub critic that approves both, assert: attempt 1 ends not approved; attempt 2
receives the corrective block; attempt 2 is approved and committed; the run exits 0 with
`commits_blocked=1` in the digest and no uncommitted work.

**Acceptance Scenarios**:

1. **Given** the switch on and a critic that approved, **When** the commit gate blocks the approval commit, **Then** the phase is not approved, no approval of it counts anywhere, and the next phase attempt of the same phase starts (F152-FR-001, F152-FR-002).
2. **Given** a blocked attempt, **When** the next attempt starts, **Then** its prompt holds the corrective block naming the rule id, the rule's reason and the file of each hit, and nothing else of the scan (F152-FR-010).
3. **Given** the next attempt, **When** it is judged, **Then** the full verification gate runs and a fresh critic call is made; the earlier APPROVED does not carry over (F152-FR-003).
4. **Given** the switch off, **When** the commit gate blocks, **Then** the behaviour is today's: the run goes on and exits 1 at its end with `commits_blocked=N` (F152-FR-022).

---

### User Story 2 - A block that does not change halts for a human (Priority: P1)

The proposer cannot or will not remove what blocks the commit — the file is a fixture that must
hold a credential-shaped string, say. The run does not loop: after the same block twice it halts,
blocked on a human, with a signal that says why, and no supervisor relaunches it.

**Why this priority**: Backpressure that cannot be satisfied must become a judgment call for a
human, not a churn of attempts ("a check that cannot pass fast must be a halt").

**Independent Test**: With a stub proposer that plants the same secret in every attempt, assert:
two blocked attempts with the same signature, then the run ends `blocked-on-human` with the
blocked reason of F152-FR-006, a non-transient stop reason, no relaunch by either classifier table,
and 2 phase attempts spent.

**Acceptance Scenarios**:

1. **Given** two consecutive blocked attempts of one phase with the same signature, **When** the second block is seen, **Then** the run halts blocked on a human and names the phase, the rules and the files (F152-FR-005, F152-FR-006).
2. **Given** blocked attempts whose signatures differ, **When** the reject limit is reached, **Then** the run ends as any run whose rejects were exceeded (`max_rejects`, exit 2) (F152-FR-004).
3. **Given** the halted run, **When** a supervisor observes it, **Then** it is not relaunched (F152-FR-006; feature 123, row O-33).
4. **Given** the halted run, **When** the consumer fixes the file and resumes, **Then** the counts survive and the phase continues with its next attempt, if the reject limit allows one (F152-FR-015). Resume of a run blocked on a human is the existing transition T17 of feature 102 (F102-FR-023); only a supervisor's relaunch is refused.

---

### User Story 3 - A crash between the block and the retry loses nothing (Priority: P2)

The engine dies after the commit gate blocked phase 4 and before attempt 2 started. On resume the
run knows that phase 4 is not approved, was blocked by rule R on attempt 1 of 3, and starts
attempt 2 with the corrective block — and it never honours the approval of attempt 1.

**Why this priority**: The engine already treats a phase as approved once its approval record
exists and does not re-run the steps after it (F101-FR-033). Without this story a crash turns a
blocked phase back into an approved one.

**Independent Test**: Kill the engine at each step between the block and the start of the next
attempt; resume; assert the phase is not approved, the attempt count is right, and the next
attempt holds the same corrective block.

**Acceptance Scenarios**:

1. **Given** a block written to disk and a killed engine, **When** the run resumes, **Then** the phase is not approved and the next attempt holds the corrective block (F152-FR-013, F152-FR-014).
2. **Given** an engine killed after an approval and before its commit, with the switch on, **When** the run resumes, **Then** the commit gate runs over the pending work before the approval is honoured; a block voids it (F152-FR-014).
3. **Given** a resumed run, **When** it is compared with an uninterrupted one, **Then** the counts and the attempt ordinals are equal (F152-FR-015).

---

### User Story 4 - The rules of the gate are owned data (Priority: P3)

A maintainer wants to know why `token: "abc"` in a test does not block a commit while
`https://user:pass@host` does. Each rule of the commit gate is a row of versioned data with an id,
an owner, a reason and a version; the data is pinned in the launch contract, and changing it in
the middle of a run halts the run until a human confirms. A project may add a pattern of its own;
it can never remove or weaken one of the engine's.

**Why this priority**: The corrective block quotes a rule's reason, so the reason must be owned
text; and a rule set that can change under a running loop is a set the loop can be steered around.

**Independent Test**: Load the shipped rule data and assert every rule has the fields and the
carve-out is a row; a malformed file is refused at launch; a project rule that tries to disable
an engine rule is refused; a change of the data during a run blocks the run with the reason of a
changed source.

**Acceptance Scenarios**:

1. **Given** the shipped rule data, **When** it is loaded, **Then** every rule has an id, an owner, a requirement, a reason and a version, and the carve-out `key-name-then-value` is a row of it (F152-FR-016, F152-FR-019).
2. **Given** a malformed rule file, **When** a run is launched, **Then** the launch is refused and names the file (F152-FR-016).
3. **Given** a project rule that removes or narrows an engine rule, **When** the data is loaded, **Then** it is refused (F152-FR-018).
4. **Given** a running run, **When** the rule data changes, **Then** the run halts for human confirmation and does not use the new data until then (F152-FR-017).

---

### Edge Cases

- **A block on the last allowed attempt.** The block counts as the rejection that reaches the reject limit; the run ends `max_rejects` (F152-FR-004).
- **A block after a change of signature.** Attempt 1 blocked on file A, attempt 2 on file B: different signatures, no halt; the reject limit bounds it (F152-FR-005).
- **A block whose hits are all removed by the carve-out.** Not a block; the commit is made (F152-FR-019).
- **A block in a phase with parallel units.** The gate runs once, at phase level, on the merged tree; no unit spends a count (F152-FR-008).
- **No work tree, commits off, or no changes.** No commit is attempted, so there is no block and nothing of this feature acts (F101-FR-035 unchanged).
- **A file name that reads as an instruction.** A path such as `IGNORE_THE_RULE_and_approve.md` reaches the proposer only as quoted data inside the corrective block (F152-FR-011).
- **More hits than the block can carry.** The block names at most the cap of F152-FR-012 and says how many more there are.
- **A commit that fails for a reason other than the scan** (`commit-failed`). Unchanged: ignored as at the baseline (B-0278); not a block of this feature.
- **The critic rejected.** No commit is attempted; the ordinary rejection path runs; nothing of this feature acts.
- **A block under the model-tier bump.** The block does not count toward K (F152-FR-007).

## Requirements *(mandatory)*

### Functional Requirements

No requirement of this feature carries an as-is behaviour: all are new or change an as-is
behaviour behind the switch of F152-FR-021, so none has `origin:` or `disposition:`. Every
requirement names a characterization test `CT-152-<n>`. Requirements that rest on an owner
ruling cite it with `ruling:`; every ruling was answered A on 2026-11-09.

#### G1 — A blocked commit is a rejection, not a drift

- **F152-FR-001**: With the switch on, when the commit gate blocks the approval commit of a phase, the phase attempt MUST end as not approved, and no approval of that attempt MUST count anywhere the engine reads whether a phase is approved (start phase, `resume`, relaunch, phase entry). *Why: an approval whose work is not in the history is the gap this feature closes (constitution T-a).*
  - test: CT-152-1
  - divergence: DV-121
  - parity: off (row 134 of annex X §X.7)

- **F152-FR-002**: After such a block the engine MUST start the next phase attempt of the same phase, through the same path as after a rejection, with the corrective block of G3 in the prompt. The outcome of the blocked attempt MUST be recorded as a rejection whose cause is the commit gate, with no critic call made for its feedback. *Why: the block must re-enter the loop as input ("loop back is everything"); reusing the rejection path adds no new loop.*
  - test: CT-152-2
  - ruling: CQ-152-02 A (2026-11-09) (the kind of the next attempt)

- **F152-FR-003**: The next phase attempt MUST be a new attempt in every respect: a fresh session, the full verification gate, and a fresh critic call. No verdict of the blocked attempt MUST carry over, and only the critic MUST grant an approval; the commit gate MUST only withhold one. *Why: Principle II — the phase gate with the critic is the only source of a verdict; Principle VIII — fresh session per attempt.*
  - test: CT-152-3

- **F152-FR-004**: After a block, the state of the phase that a later attempt and a reader see MUST be that of a rejected attempt: the tasks of the phase are not ticked, the feedback of the phase is the corrective block, and learning records no approval of the phase. *Why: the post-approval order (F101-FR-033) ticks the tasks and lets learning observe before the commit; a block must not leave a ticked, "learned" phase whose approval does not count.*
  - test: CT-152-4

#### G2 — Bounds, halt and counting

- **F152-FR-005**: A blocked attempt MUST consume one phase-attempt ordinal and MUST count toward the reject limit like any rejection. No retry beyond the reject limit MUST be made. *Why: the backpressure must be bounded by the bound that already exists; no new unbounded loop.*
  - test: CT-152-5

- **F152-FR-006**: The signature of a block MUST be the set of pairs (rule id, file) of its hits. When two consecutive blocked attempts of one phase have the same signature, the engine MUST halt the run blocked on a human with the blocked reason `commit-gate` and what it needs (the phase, the rules, the files), and MUST NOT start another attempt. The decision MUST be made by a pure table with a rule id and recorded with it. *Why: an unchanged block will not change by retrying; Principle VIII asks for a distinct signal for a run blocked on a human, Principle XIII for a pure table.*
  - test: CT-152-6
  - ruling: CQ-152-01 A (2026-11-09) (blocked reason `commit-gate` mapped to an existing stop reason)

- **F152-FR-007**: A blocked attempt MUST NOT count toward K of the model-tier bump. *Why: F149-FR-004 counts only a REJECTED of the critic; a block is a deterministic gate result like a failed verification gate, which also does not count.*
  - test: CT-152-7
  - ruling: CQ-152-03 A (2026-11-09)

- **F152-FR-008**: The commit gate MUST act once per phase attempt, at phase level, on the tree the approval commit would hold. The micro-loop layer and parallel units MUST spend no count of this feature and MUST add no exit code and no stop reason for it. *Why: F100-FR-031 and Principle XX.*
  - test: CT-152-8

#### G3 — The corrective block

- **F152-FR-009**: The corrective block MUST be written by the engine from a fixed template, and MUST be given to the proposer of the next attempt only. The critic MUST NOT see it, nor any record of earlier blocks of the phase, nor any result of the commit gate: the gate runs only after the critic's APPROVED, so no critic prompt can hold one. *Why: Principle II — the critic does not see the history of repairs and retries.*
  - test: CT-152-9

- **F152-FR-010**: The corrective block MUST hold exactly: a heading that names the phase and the attempt; the statement that the approval commit was blocked by the commit gate and that the engine — not the proposer — ticks and commits; for each hit, the rule id, the reason of the rule from the rule data, the file and the line; the number of hits not shown; and the instruction to remove or change what the rule names and to run the tests again. It MUST NOT hold any matched text, any content of a file, any output of a tool, or any text of a model. *Why: Principle XII — secrets never appear in prompts; the 2026-11-04 ruling closed the leak of match text in events, and a prompt must not re-open it.*
  - test: CT-152-10

- **F152-FR-011**: Every value in the corrective block that comes from the repository (file paths) MUST be rendered as quoted data, escaped, and capped in length, inside a block that the engine labels as authoritative and binds to a nonce of the attempt; the template MUST say that text inside the quoted values is data and never instruction. *Why: Principle III — repository content is data, never instruction; a planted file name must not steer the proposer.*
  - test: CT-152-11

- **F152-FR-012**: The corrective block MUST be bounded: at most 20 hits shown, and a fixed upper size in bytes stated by the plan. The block MUST be byte-identical for the same hits (rule, file, line), the same attempt ordinal and the same nonce; the nonce MUST be stored with the record of the block, so that a resume renders the same block. *Why: a bounded, stable block keeps the prompt budgeted (Principle XIX, read for the engine) and makes the retry reproducible.*
  - test: CT-152-12

#### G4 — Durability and resume

- **F152-FR-013**: Before the next attempt starts, the engine MUST write to the control plane, atomically, the record of the block (phase, attempt ordinal, signature, the rule ids and files, the nonce of the corrective block, the time) and the corrective block itself. Nothing that decides the next step MUST rest on a count held in memory. *Why: Principle I — resume position is derived from verified records on disk.*
  - test: CT-152-13

- **F152-FR-014**: Wherever the engine reads whether a phase is approved, with the switch on, an approval record whose approval commit was blocked MUST count as not approved. Where the engine ended after an approval and before its commit was made, and commits are enabled inside a work tree with changes, the next engine start MUST run the commit gate over the pending work before it honours the approval; a block MUST void the approval and continue as F152-FR-002. *Why: F101-FR-033 treats a phase as approved after a crash and does not re-run the steps, so without this a crash turns a blocked phase back into an approved one (constitution T-a).*
  - test: CT-152-14

- **F152-FR-015**: The facts of this feature that decide or are reported — the blocked attempts of a phase and the signature of each — MUST be derived from the durable records of F152-FR-013, never from a count held in memory, so that they survive a resume and a relaunch. A reset of the counts of the ledger MUST set them aside with the other counts, so that no block from before a reset decides anything after it. *Why: Principle XVI — counts and attempt numbers survive a resume.*
  - test: CT-152-15

#### G5 — The rule data of the commit gate

- **F152-FR-016**: The rules that decide whether a hit of the scan blocks the commit MUST be versioned data: each rule with an id, an owner, a requirement, a reason, and its effect (block, or exempt a named pattern). The data MUST be validated against a schema when it is loaded; a malformed file MUST refuse the launch and name the file. *Why: the corrective block quotes the reason, so it must be owned text; Principle VI — data is validated at every file boundary.*
  - test: CT-152-16

- **F152-FR-017**: The hash of the rule data in use MUST be pinned in the launch contract and fixed before work starts. A change of the rule data during a run MUST halt the run as a changed source does, until a human confirms. *Why: Principle III — checks are fixed before work starts; a rule set that changes under a running loop can be steered around.*
  - test: CT-152-17
  - ruling: CQ-152-06 A (2026-11-09) (reuse of the blocked reason `source-changed`)

- **F152-FR-018**: Project rule data MAY add rules that block; it MUST NOT remove, exempt or weaken a rule of the engine. A project rule that would MUST be refused at load. *Why: Principle III — project configuration narrows a run, never widens it.*
  - test: CT-152-18

- **F152-FR-019**: The exemption of the pattern `key-name-then-value` from blocking, which the composition root holds today, MUST become a rule of the engine's rule data with an owner, a requirement and a reason. With it, the outcome of the gate on every existing fixture MUST be unchanged. *Why: the carve-out decides what blocks; it must be owned and versioned like every other rule.*
  - test: CT-152-19

#### G6 — The switch, parity and the interface

- **F152-FR-020**: Every event this feature raises MUST carry no matched text, no prompt and no output of a tool, and MUST pass the single ingress. The retry decision MUST NOT depend on the delivery of any event. *Why: F111; Principle V — observation never carries control.*
  - test: CT-152-20

- **F152-FR-021**: The behaviour of G1 to G4 MUST be behind one switch, on by default. Under the `parity` profile the switch MUST be off. *Why: Principle XVIII and F100-FR-212 — the value under `parity` reproduces the as-is behaviour.*
  - test: CT-152-21
  - divergence: DV-121
  - parity: off (row 134 of annex X §X.7)

- **F152-FR-022**: With the switch off, the behaviour MUST be today's: a block is reported, the run goes on, and a run that would otherwise exit 0 exits 1 with `commits_blocked=N` in the digest. With the switch on, the same end-of-run rule MUST stay as a safety net, and it MUST count only blocks that left the work of a phase uncommitted: a block that F152-FR-002 turned into a new attempt is not one of them, though the digest still counts it in `commits_blocked`. Over every fixture of this feature, with the switch on, the safety net MUST never fire. *Why: the 2026-11-04 ruling stays in force where this feature does not act; with the switch on, no run reaches its end with blocked work.*
  - test: CT-152-22
  - ruling: CQ-152-05 A (2026-11-09)

- **F152-FR-023**: The enforcement MUST stay in the engine. No file the proposer's tools can write — a git hook, a script, a configuration of the repository — MUST take part in deciding whether the approval commit is blocked, and the outcome MUST NOT depend on whether such a file exists. *Why: the proposer could edit or bypass such a file (`--no-verify`); the boundary is the harness, not a file the agent owns.*
  - test: CT-152-23

- **F152-FR-024**: Shared control flow of this feature MUST test no harness name. *Why: Principle VII.*
  - test: CT-152-24

### Key Entities

- **Commit-gate block**: the outcome of one blocked approval commit — phase, attempt ordinal, signature, hits (rule id, file, line), the nonce of its corrective block, time. Kept in the control plane; the facts of F152-FR-015 are read from it.
- **Block signature**: the set of (rule id, file) pairs of a block; the key of the halt decision.
- **Corrective block**: the engine-written, template-only text given to the next attempt's proposer; bound to a nonce; bounded in size.
- **Commit-gate rule**: one row of the rule data — id, owner, requirement, reason, effect, version. Engine rules and project rules; project rules only add.
- **Rule-data pin**: the hash of the rule data in the launch contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F152-SC-001**: No drift. Over every fixture of this feature with the switch on, the number of runs that end with an approved phase whose approval commit was blocked is 0, and the number of runs that end with exit 0 and `commits_blocked>0` and uncommitted work is 0.
- **F152-SC-002**: The loop learns. On the fixture "planted secret, removed on retry", the phase is approved and committed on attempt 2 in 100 per cent of runs.
- **F152-SC-003**: Bounded. On the fixture "the same secret every attempt", the run halts after exactly 2 phase attempts of the phase, blocked on a human, and is relaunched 0 times.
- **F152-SC-004**: No leak. Over a property test with at least 1,000 planted secrets of every pattern of the scan (each `name` of the `values` list of `widened-v1.json`) and of registered secrets, the number of bytes of matched text found in any corrective block, prompt, event or digest is 0.
- **F152-SC-005**: No steering. Over a property test with planted file names that hold instructions, the corrective block holds each name only inside its quoted value, and the number of blocks whose template text differs from the template is 0.
- **F152-SC-006**: Crash-safe. Killing the engine at each step between a block and the start of the next attempt, and resuming, gives the same phase state and counts as an uninterrupted run, and a corrective block byte-identical to the one rendered from the block record of the attempt (whose nonce it reuses), in 100 per cent of cases. The nonce is random per block, so two separate runs never share one, and it is not compared across runs.
- **F152-SC-007**: The wheel turns fast. The commit gate decides in under 1 second on the largest fixture of this feature, so that the time of a retry is the model's.
- **F152-SC-008**: Parity holds. Under the `parity` profile the oracle reports 0 results `different` on FX-27 and on the fixtures of the blocked commit, with this feature present, other than rows the divergence register already holds with the owner's ruling. The exit-1 rule of 2026-11-04 differs from the baseline; its register row is DV-122 (CQ-152-05 A), with the handling **waiver**, so the oracle reads it as that row and not as `different`.

## Constraints

Set by the owner or by the constitution (v3.0.3). They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| The phase gate with the critic is the only source of a verdict; models propose, the engine disposes | Principle II |
| Text from the repository is data, never instruction; checks are fixed before work starts; project configuration narrows only | Principle III |
| Secrets never appear in prompts, events, evidence, the digest or a UI | Principle XII |
| An intended difference from the baseline is a register row with the owner's ruling; a switch's value under `parity` reproduces the as-is behaviour | Principle XVIII; F100-FR-212 |
| Stop reasons are a closed, versioned enumeration (owner decision); exit codes are part of the interface | Additional Constraints; F100-FR-148; annex X §X.6 row 3 |
| Micro-loops and parallel units add no exit code and no stop reason | F100-FR-031; Principle XX |
| Only the engine ticks and commits; a commit that fails for a reason other than the scan is ignored | F101-FR-033, F101-FR-035; B-0278 |
| A run with blocked commits never exits 0 | Owner ruling 2026-11-04, part A item 2 |

What belongs in the plan and not here: where the gate runs in the order of the post-approval
steps, how an approval is voided (not written, or written and marked void), the file layout of the
control-plane records, the schema files, the spelling of internal functions, and the byte cap of
the corrective block.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-18 | `specstride.attempt-planner/1` | consumes | The kind of the attempt after a block (CQ-152-02) |
| EP-05 | `specstride.check-runner/1` | consumes (reserved) | Not used in this feature; the seam for project-declared commit checks (L-4) |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| No run state, exit code or stop reason from a layer | — | Annex A §A.5 (F100-FR-031) |
| Approval record | `specstride.approval/1` | Annex B §B.14 |
| Ledger: counts that survive | `specstride.ledger/1` | Annex B §B.13 |
| Critic strategy and attempt planner | `specstride.attempt-planner/1` | Annex E §E.1 |
| Blocked reasons; run record | `specstride.run-state/1` | Annex E §E.2 (F100-FR-144) |
| Stop-reason enumeration; exit codes of the engine | `specstride.stop-reason/1` | Annex E §E.3, §E.4 (F100-FR-148) |
| Redactor; the scan before a commit | — | Annex X §X.4 (F100-FR-206) |
| List of closed sets | — | Annex X §X.6, rows 3, 4, 9 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7 (F100-FR-210, F100-FR-212) |

Fixture families of feature 141 used: FX-27 (parity, F101-SC-005), and new own fixtures of the
blocked commit (planted secret removed on retry; the same secret every attempt; a planted
instruction in a file name; a crash between block and retry).

## Rows of the `parity` profile

Stated as F100-FR-212 asks.

| Switch | Key (proposed; feature 110 confirms the spelling) | Default | Under `parity` | Owner | Register row | Row of annex X §X.7 |
|---|---|---|---|---|---|---|
| A blocked approval commit becomes the next phase attempt | `commit.backpressure` | on | off | 152 | DV-121 | 134 |

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Change | Owner | Closed by | Row of annex X §X.6 |
|---|---|---|---|---|
| Blocked reasons (annex E §E.2) | Add `commit-gate` → stop reason per CQ-152-01, `retryable` No. When: two consecutive blocked approval commits of one phase with the same signature (F152-FR-006), or a voided approval whose task list a human changed beyond its ticks, so the pre-tick bytes cannot be restored (plan, "Ticks in the void paths") | 100 | Design | 4 |
| What failed in an approval record (annex X §X.6 row 255) | Add `voided`: an approval whose commit the commit gate blocked (F152-FR-014). The integrity note keeps its kind `approval-invalid` and names `failed: voided`, so no new integrity kind is added | 101 | Design | 255 |
| Effects of a commit-gate rule | `block`, `exempt` (new set) | 152 | Design | 286 |
| Stop reasons (annex E §E.3) | No change under the recommended answer of CQ-152-01 | 100 | Owner decision | 3 |
| Kinds of phase attempt (annex E §E.1) | No change under the recommended answer of CQ-152-02 | 149 | Design | 9 |

## Cross-spec amendments

Proposed here; made only by the owner of each spec. This feature edits no other spec.

| Spec / requirement | Amendment (approved 2026-11-09; final text in `amendments.md`) | Why | Ruling? |
|---|---|---|---|
| F101-FR-033 | Add: "With the switch of F152-FR-021 on, an approval whose commit was blocked is not approved, and the next start does not treat it as approved (F152-FR-001, F152-FR-014)." | The crash rule of FR-033 otherwise honours a blocked approval | No (design) |
| F101-FR-035 | Add: "With the switch on, a commit blocked by the scan ends the phase attempt as F152-FR-002 states; a commit that fails for any other reason is still ignored." | Separates the block from B-0278 | No (design) |
| F101-FR-031 | Add a case: an approval record whose commit was blocked counts as not approved | Resume path | No (design) |
| F111-FR-031 | Add: the event names the attempt ordinal and the signature's rule ids; still no matches | The reader needs to link the block to the attempt | No |
| Annex E §E.2 | Add the blocked reason `commit-gate`. When: two consecutive blocks with the same signature (F152-FR-006), or a voided approval whose task list a human changed beyond its ticks | F152-FR-006, F152-FR-014 | Yes, CQ-152-01 |
| Annex E §E.3 / §E.4 | None, unless CQ-152-01 is answered with option B | — | Yes, CQ-152-01 |
| Annex E §E.1 (`next`) | None, unless CQ-152-02 is answered with option B | — | Yes, CQ-152-02 |
| F149-FR-004 | Add "a blocked approval commit" to what does not count toward K | F152-FR-007 | Yes, CQ-152-03 |
| Annex X §X.7 | Row 134: `commit.backpressure`, on, `parity` off, DV-121 | F152-FR-021 | Yes, CQ-152-04 |
| Divergence register (section 6.6) | DV-121 (the switch) and DV-122 (the 2026-11-04 exit-1 rule, handling **waiver**) | F152-FR-021, F152-FR-022, F152-SC-008 | Yes, CQ-152-04, CQ-152-05 |
| Oracle register map (feature 141, `packages/oracle/data/register-map.json`) | One entry each for DV-121 (`off`) and DV-122 (`waiver`) | F141-FR-023: one entry per register row | No |
| Annex X §X.6 | Row 286: effects of a commit-gate rule | F152-FR-016 | No |
| Annex X §X.6 row 255 (owner 101) | Add `voided` to what failed in an approval record: an approval whose commit the commit gate blocked. The integrity note keeps the kind `approval-invalid` | F152-FR-014 | No (design) |
| Feature 123 §R.6 | None: row O-33 (`blocked` → refuse) already refuses the halt | — | No |
| Feature 115 | None in this feature; a later in-pass warning must follow F100-FR-031 | — | No |

## Tracked limitations

Recorded residual risks, in the form of the Principle III sentence of CQ-197. Each has a follow-up.

- **L-1 Line-split secrets.** The scan reads line by line; a secret split over two lines or built at run time is not seen. Implementation (2026-11-13): confirmed — the gate scans the same line-based set the step-6 scan reads, so it inherits this limit unchanged; the fallback rule `cg-unmatched-hit` holds a commit back when the pattern set grows a name the rule data does not carry yet, so an unknown pattern fails closed rather than passing silently. Follow-up: the critic's grounding names files the gate touched; a multi-line pattern set is a roadmap item of feature 111.
- **L-2 Indirection.** `await import()` and computed paths escape a syntactic import check; the commit gate does not claim to see intent. Implementation (2026-11-13): confirmed — the gate decides on the scan's hits only, and the corrective block names only rule, file and line, so it gives the proposer no false sense of coverage. Follow-up: intent stays with the critic.
- **L-3 Existence-filtered paths.** The gate scans only files that exist at the time of the commit; a file written and removed in the same attempt is not scanned. Decision (plan, "Technology choices"): the scan input is the would-be commit, not the runtime's write list. A file that no longer exists is not in the commit, so nothing of it enters the history. Implementation (2026-11-13): the would-be commit is computed, not staged, and the ticked task list is scanned through the overlay, so the pre-scan and the step-6 scan read the same bytes. The residual risk is a secret that stood in the work tree during the attempt; that is not a commit risk and stays with feature 111.
- **L-4 No project commands.** Project-declared commands (lint, type checks) as commit checks are out of scope; when added, they must come from declarations (Principle XIV) through EP-05. Implementation (2026-11-13): the seam stays reserved — the rule data holds patterns only and no code path of the gate runs a command, so EP-05 can be consumed later without changing the gate's contract.

## Clarifications

### Session 2026-11-08 (owner rulings requested; answered 2026-11-09: all A)

The owner answered every ruling with its recommended answer A on 2026-11-09. The requirements
below are written to A, so no requirement changes. The rows that A names are fixed: DV-121 (the switch), DV-122 (the
2026-11-04 exit-1 rule), row 134 of §X.7 and rows 255 and 286 of §X.6. Their final text, and every
other cross-spec amendment, is in `amendments.md`.

| Id | Question | Options | Recommended | Status | Anchors |
|---|---|---|---|---|---|
| CQ-152-01 | How does the halt on a repeated block end the run? | A: a new blocked reason `commit-gate` in §E.2, mapped to the existing non-transient stop reason `max_rejects` (engine exit 2); no new stop reason. B: a 16th literal `commit_gate_blocked` added to §E.3 (`transient` No, an exit code of §E.4). C: no dedicated halt; only the reject limit | A: §E.2 already maps a blocked reason to an existing stop reason (`source-changed` → `critic_config`); blocked reasons are closed by design, stop reasons by owner decision; row O-33 already refuses the relaunch. The same reason also covers the halt of a void that cannot restore a task list a human edited (spec, "Closed sets") | **A** (owner, 2026-11-09) | F100-FR-144, -148; §E.2, §E.3; annex X §X.6 rows 3, 4 |
| CQ-152-02 | Of which kind is the attempt after a block? | A: `plain`, with the corrective block in the feedback slot. B: a new kind `commit-retry` in §E.1 | A: the kind decides model tier and recovery, not the feedback; a new kind changes a closed set for no behaviour | **A** (owner, 2026-11-09) | §E.1; F149-FR-002 |
| CQ-152-03 | Does a block count toward K of the model-tier bump? | A: no. B: yes | A: as a failed verification gate (F149-FR-004) | **A** (owner, 2026-11-09) | F149-FR-004 |
| CQ-152-04 | The switch, its default and the register row | A: `commit.backpressure`, default on, `parity` off, DV-121. B: default off | A: the gap is a correctness gap, not an option | **A** (owner, 2026-11-09) | F100-FR-212; §X.7 |
| CQ-152-05 | Is the 2026-11-04 exit-1 rule itself a register row, and does it stay with the switch on? | A: it stays as a safety net under both values; its register row is added with DV-121 if none exists. B: it is removed with the switch on | A. The answer blocks F152-SC-008: the parity test cannot pass until the row exists (Principle XVIII) | **A** (owner, 2026-11-09) | commit `621cd1ff`; F152-FR-022 |
| CQ-152-06 | How does a mid-run change of rule data halt? | A: as the blocked reason `source-changed` (exit 3). B: a separate reason | A: rule data is a pinned source of the launch contract | **A** (owner, 2026-11-09) | F100-FR-145; §E.2 |

## Assumptions

- The divergence register is `docs/ecosystem/consolidation.md`, kept on the private `main` only.
  On 2026-11-09 it ends at DV-120, §X.6 ends at row 285 and §X.7 at row 133, so this feature's rows
  are DV-121, DV-122, §X.6 row 286 and §X.7 row 134, approved by the owner on 2026-11-09
  (`amendments.md`).
- The scan of feature 111 already returns, for each hit, the file, the line, the kind of match
  (`matched`: `pattern`, `registered-secret` or `unreadable`) and, where a pattern matched, the
  pattern's name (`packages/kernel/src/redactor/scan.ts:38-52`). The rule of a hit is chosen by its
  kind: a `pattern` hit by its pattern name, a `registered-secret` hit by the engine's rule for
  registered secrets, and an `unreadable` hit (a file the scan could not read, `line` 0) by the
  engine's rule `cg-unreadable`, so that the gate keeps the scan's fail-closed rule (F111-FR-024).
  This feature needs nothing else from the scan.
- The reject limit's default (3) and its configuration are unchanged.
- The switch's key is a proposal; feature 110 owns the spelling.
- The engine constitution v3.0.3 is the baseline of this feature
  (`constitution-grounding.md`).
