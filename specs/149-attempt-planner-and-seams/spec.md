# Feature Specification: Attempt planner and seams

**Feature Branch**: `149-attempt-planner-and-seams` (a label: Spec Kit creates no branch in this repository; the directory is `specs/149-attempt-planner-and-seams`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 149-attempt-planner-and-seams of Specstride, the second part of the split of 101-gate-and-verdict (group G4): the two internal seams of EP-18 (critic strategy with one critic, attempt planner with the recovery-cycle planner and the model-tier bump), the model-tier bump after K rejections by the critic as an option that is off by default, the invariants IR-01 to IR-07 of the phase gate against loop layers, the comparison of the tree at phase entry, the phase gate when the protected set changed, and the conformance suite and samples of EP-18."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 2, 5, 9, 17), `consolidation.md` (sections 1, 4, 6), `feature-briefs.md` (brief 101-gate-and-verdict, headings 4, 7 and 8, group G4; sections D.5 and D.8), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`, annexes A, B, C, D, E, X), feature 141 (`specs/141-parity-oracle/`, §O.3, §O.4, §O.7), and the research reports R23, R23v, R25 and R27.

## What this feature is

The phase gate of a run is judged by a critic and, after a rejection, followed by a new phase
attempt. Two decisions in that loop are made behind seams, so that a later way of judging or of
planning needs no change of the loop: how a phase gate is judged (the critic strategy), and of
which kind the next phase attempt is (the attempt planner). This feature owns both seams, which
together are extension point EP-18.

It also owns one option behind the second seam: the model-tier bump. After K rejections of one
phase by the critic, the next phase attempt runs on the next model tier of the same harness. The
option is off by default and off under the `parity` profile.

Last, it owns the rules that keep everything else away from the phase gate: no loop layer, no
router and no planner can write a verdict or an approval, nothing but a reply of the critic is
ever parsed as a verdict, and a finding about the integrity of the tree is told to the critic and
never halts a run.

This feature is the second part of a split. The first part holds the loop over phases, the
verdict grammar, the limits, the recovery cycle and the approval record. The two parts meet only
through interface contracts of feature 100.

**In scope**: the seam of the critic strategy and the strategy with one critic; the seam of the
attempt planner, the planner of the recovery cycle and the planner of the model-tier bump; the
bump option, its count, its guards and its rule table; the invariants IR-01, IR-04, IR-06 and
IR-07 as the phase gate sees them; the comparison of the tree at the entry of a phase; the phase
gate when the protected set was changed; the conformance suite and the samples of EP-18.

**Out of scope**:

| Out of scope | Owner, reached through |
|---|---|
| The loop over phases and phase attempts; the nonce and the verdict grammar; the limits and halts; the rules of the recovery cycle (when the diagnostician runs, when an accelerated phase attempt is due); the approval record; the terminal record | The first part of the split; feature 100 annex E §E.1, §E.3, §E.4, annex B §B.14, §B.15 |
| Grounding snapshot, critic prompt, the slot of the fact block | 117; annex D §D.7 |
| The transport of a critic call and the form of the critic | 109 and the harness adapters; annex C §C.1, §C.3 |
| Which harness and model play the critic; the model-tier ladder | 124, 109; annex C §C.6 |
| The escalation of the model tier inside a phase attempt | 115; annex D §D.4 |
| Fingerprints and the protected set; the content of the fact block | 116, 148; annex D §D.7, annex C §C.8 |
| The critic ensemble and human approvals | The roadmap; the seam exists here |
| The event types and their fields; the spelling of configuration keys | 111; 110 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The critic never judges in a session of the proposer (Priority: P1)

A consumer relies on the verdict of a phase. Whatever strategy judges the phase gate, every call
it makes is a fresh session without tools, and the record of the call proves it.

**Why this priority**: The owner's success criterion "the critic never approves its own session"
is carried here. Without it an approval means nothing.

**Independent Test**: Over every fixture of feature 141 that reaches a critic call, on the port
side, assert from the record of each call: a fresh session, no tools or the proven read-only
form, and a session id that no pass of the phase attempt used.

**Acceptance Scenarios**:

1. **Given** a run with one critic, **When** a phase gate is judged, **Then** the strategy makes one call, in a session whose id no pass of the phase attempt used, and returns one verdict record (F149-FR-001).
2. **Given** a critic whose model equals a model that produced passes in the phase attempt, or whose model is not known, **When** the call is about to be made, **Then** the critic-diversity warning is raised and recorded and the call is made (F149-FR-001).
3. **Given** a strategy that throws, **When** the phase gate is judged, **Then** the verdict is MALFORMED and the MALFORMED limit counts it (F149-FR-001).

---

### User Story 2 - Nothing but the phase gate can approve (Priority: P1)

An operator switches the micro-loop layer, parallel units or the bump on. None of them can
write a verdict, change a count of the phase gate or halt a run with a code of its own.

**Why this priority**: Decision 21 allows inner loops only if the phase gate stays the only
source of a verdict. A breach here voids every approval of the run.

**Independent Test**: A static test on the package graph shows one writer of the records of the
phase gate. A fuzz test feeds the verdict parser every kind of ledger record and fact-block row.
The second suite of feature 141 shows equal counters with the layer on.

**Acceptance Scenarios**:

1. **Given** any ledger record or row of the fact block, **When** it is given to the verdict parser, **Then** no verdict is returned (F149-FR-007).
2. **Given** the micro-loop layer on and stub agents that never declare a unit of work, **When** any fixture runs, **Then** the reject count, the ordinals of phase attempts and the MALFORMED streak equal those of the run with the layer off (F149-FR-007).
3. **Given** a tree that differs at the entry of phase 2 from the tree bound in the approval of phase 1, **When** phase 2 starts, **Then** the difference is an integrity event and a fact for the critic, and the phase starts (F149-FR-008).
4. **Given** a protected set that was changed without authority, **When** the phase gate runs, **Then** the verification gate runs, the critic is told, and an approval stays possible (F149-FR-009).

---

### User Story 3 - A consumer switches the model-tier bump on (Priority: P2)

A consumer sets the option. After K rejections of one phase by the critic, the next phase
attempt of that phase runs on the next model tier of the same harness. Nothing else changes.

**Why this priority**: The owner ruled the option into Wave 1, off by default (ruling 48). It
must be safe and measurable before it can become a default.

**Independent Test**: Own tests with stub agents: K − 1 rejections bump nothing; K rejections
bump once; a failed verification gate and a MALFORMED reply do not count; with the option off no
output differs.

**Acceptance Scenarios**:

1. **Given** the option on and K = 2, **When** the critic has rejected a phase twice, **Then** the third phase attempt runs on the next model tier of the proposer's harness, in a fresh session, and an event records the rule id (F149-FR-003, F149-FR-005).
2. **Given** a target that equals a critic-class call of the run in model and in effort, **When** the bump is due, **Then** it is skipped, the skip is recorded with its reason, and the phase attempt runs on the model tier it would have had; a target that shares only the model is used, and the critic-diversity warning is raised and recorded (F149-FR-005).
3. **Given** two rejections of which one came from a failed verification gate, **When** the next phase attempt is planned, **Then** no bump is made (F149-FR-004).
4. **Given** the option off, **When** any fixture runs, **Then** no output differs from a run of a build without the option (F149-FR-003).

---

### User Story 4 - An author adds a critic strategy or an attempt planner (Priority: P3)

The author of a later critic strategy (for example an ensemble) or of a later attempt planner
registers it behind the seam of EP-18. The loop does not change.

**Why this priority**: The owner deferred the ensemble and asked for the seam (ruling K5). The
sample outside the core is the only proof that the seam holds.

**Independent Test**: The conformance suite of EP-18 runs a sample critic strategy and a sample
attempt planner from the test tree on a fixture; no core file differs between the build with the
samples and the build without them.

**Acceptance Scenarios**:

1. **Given** a sample critic strategy that makes two calls, **When** a fixture runs with it, **Then** each call has its own nonce and its own fresh session, and the strategy returns one verdict record (F149-FR-001, F149-FR-010).
2. **Given** an attempt planner that throws, **When** the next phase attempt is planned, **Then** its kind is `plain` and no exit code or stop reason comes from the planner (F149-FR-002).

---

### Edge Cases

- One call of a strategy is MALFORMED and another approves: the verdict is not APPROVED (F149-FR-001).
- A strategy returns a verdict outside the closed set: it is read as MALFORMED (F149-FR-001).
- A planner returns a kind outside the closed set: it is read as `plain` (F149-FR-002).
- A phase attempt is due for acceleration and for a bump at once: it is `accelerated` and runs on the bumped model tier (F149-FR-004).
- The ladder of the harness has no higher model tier: the bump is skipped with the reason `ladder-top` (F149-FR-005).
- The quota of the target model tier is exhausted: the bump is skipped and recorded; at the next rejection of the phase the rule is evaluated again (F149-FR-005).
- Nothing is recorded about the quota of the target: the quota counts as not exhausted, and no call is made to find out (F149-FR-005).
- A phase was bumped and is rejected again: the model tier stays; a phase is bumped at most once (F149-FR-004).
- The counts are reset on purpose: the count of rejections by the critic is reset with them (F149-FR-004).
- The bump table is invalid: the bump is off for the run, announced, and the planner gives the kind the recovery cycle gives (F149-FR-006).
- The first phase of a run has no phase before it: no comparison at phase entry is made (F149-FR-008).
- A loop layer fails at `onEvidence` or at `contributeCriticInput`: the layer is off for the phase attempt and the phase gate runs in full (F149-FR-007).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. No requirement of this feature carries
an as-is behaviour: all are new, so none has `origin:` or `disposition:`. Every requirement names
a characterization test `CT-149-<n>`. The ids before the split are in the section "Ids before
the split".

#### G1 — The seams of EP-18

- **F149-FR-001**: Every phase gate MUST be judged through the critic strategy, by the operation `judge` of feature 100, annex E §E.1, once per phase gate and after the verification gate. Wave 1 MUST ship one strategy, with one critic. A strategy MUST return exactly one verdict record and MUST never approve when any of its calls was MALFORMED. Every call of a strategy MUST be a fresh session whose id no pass of the phase attempt used, MUST hold no tools or only the read-only tools of the second form of the `completion` level, and MUST record the proof of it; the critic MUST never run in a session of the proposer and MUST never approve its own session. A strategy MUST make a call only through the call function that the engine hands to it, and MUST never see a nonce. Before every critic-class call the model of the call MUST be compared with the models that produced passes in the phase attempt; when the result of that diversity test is `same-model`, or `unverified` because the model is not known, the critic-diversity warning MUST be raised (recorded in the field `sameModelWarning` of the event catalogue of feature 111; the field name is unchanged), MUST be recorded and MUST NOT block. A strategy that fails, and a verdict outside the closed set, MUST give MALFORMED, counted by the MALFORMED limit.
  - test: CT-149-1
  - ep: EP-18 `specstride.critic-strategy/1` (implements)

- **F149-FR-002**: After every rejection the next phase attempt MUST be planned through the attempt planner, by the operation `next` of feature 100, annex E §E.1. A planner MUST be a pure function of the history of the phase attempts of the phase (verdicts, signatures of unmet criteria, counts of the ledger, recovery markers) and of configuration, and MUST return one kind of the closed set `plain`, `diagnosed`, `accelerated`, `bumped`. Wave 1 MUST ship two planners: the planner of the recovery cycle as at the baseline, which is always on and gives `diagnosed` after a diagnosis and `accelerated` when an accelerated phase attempt is due, as annex E §E.1 states; and the planner of the model-tier bump of F149-FR-003. The planners MUST be called in this order, and the second MUST change only the model tier and turn a `plain` phase attempt into `bumped`. A planner that fails, and an unknown kind, MUST give `plain`. A planner MUST change no count, no limit and no halt, and MUST produce no exit code and no stop reason.
  - test: CT-149-2
  - ep: EP-18 `specstride.attempt-planner/1` (implements)

#### G2 — The model-tier bump

- **F149-FR-003**: The model-tier bump MUST be an option that is off by default. With the option on, after K rejections of one phase by the critic the next phase attempt of that phase MUST run on the next model tier of the ladder of the proposer's harness. K MUST come from configuration, with the default 2, and the ladder MUST be the model-tier ladder of that harness in the resolved registry. The next model tier MUST be the rung above the model tier that the role plan gives the proposer for the phase. With the option off, no output of any kind MUST differ from a product without the option.
  - test: CT-149-3
  - divergence: DV-079
  - parity: off (row 24 of annex X §X.7); K is not used (row 128 of annex X §X.7)
  - assumption: CQ-175 (the default of K; no source gives a value)

- **F149-FR-004**: Only a verdict REJECTED of the critic MUST count towards K. A failed verification gate, a MALFORMED verdict, a phase attempt that ended without a verdict, and a phase attempt whose approval commit the commit gate blocked (F152-FR-007) MUST NOT count. The count MUST be kept per phase in the ledger and MUST follow the rules of the other counts on a resume and on a reset. A bump MUST change the model tier of the proposer for the later phase attempts of that phase only; the next phase MUST start on the base model tier with a count of 0. A phase MUST be bumped at most once: after a bump, further rejections by the critic leave the model tier as it is. The reject count, the reject limit, the MALFORMED limit, the oscillation halt and the recovery cycle MUST stay as they are with the option off; where a phase attempt is both due for acceleration and due for a bump, it MUST be `accelerated` and run on the bumped model tier.
  - test: CT-149-4
  - divergence: DV-079
  - parity: off (row 24 of annex X §X.7)

- **F149-FR-005**: A bump MUST never target the model and effort of a critic-class call of the run and MUST never move to another harness. It MUST be skipped when the target equals a critic-class call of the run in model and in effort, when the quota of the target is exhausted, and when the ladder has no higher model tier; a skipped bump runs the phase attempt on the model tier it would have had. The state of the quota of the target MUST be taken from what the run has recorded; no call MUST be made to find it out. After a skip the rule MUST be evaluated again at the next rejection of the phase, as long as the phase was not bumped. The phase attempt after a bump MUST start a fresh session. Every bump and every skip MUST be an event that carries the rule id, the version of the table, and for a skip its reason. Nothing about a bump or a skip MUST reach the critic: not in the prompt, not in the fact block, not in the feedback. A target that shares the model of a critic-class call and differs from it in effort is not a collision (ruling 49; feature 100, F100-FR-140): it MUST NOT be skipped for that reason, and the critic-diversity warning MUST be raised and recorded, as for escalation.
  - test: CT-149-5
  - divergence: DV-079
  - parity: off (row 24 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (consumes)
  - assumption: CQ-204 (only a target equal to a critic-class call in model and in effort is skipped; a shared model is used with the critic-diversity warning)

- **F149-FR-006**: The rule of the bump MUST be a row of a pure table in the form of feature 100, annex X §X.3, evaluated by the one table evaluator from recorded signals only: whether the option is on, the count of rejections by the critic, K, whether the phase was bumped, the place on the ladder, the models and efforts of the critic-class calls, the state of the quota. A table that is invalid MUST switch the bump off for the run, announced. The bump and the escalation of the micro-loop layer MUST be separate rules with separate counts; neither MUST read or change the count of the other. The option MUST have an ablation arm of its own in the experiments of the product, and tests of its own.
  - test: CT-149-6
  - divergence: DV-079
  - parity: off (row 24 of annex X §X.7)

#### G3 — The invariants of the phase gate

- **F149-FR-007**: The writers of the phase gate (approval record, verdict record, feedback, hint, recovery markers) MUST be handed to the phase gate only. No loop layer, no router, no critic strategy and no planner MUST hold one. The verdict parser MUST accept no ledger record, no row of the fact block and no result of an inner check as a verdict. No event of a loop layer MUST change the reject count, the ordinal of a phase attempt, the MALFORMED streak, the input of the oscillation halt, the signature of the diagnostician, or the count of the bump. The loop layer MUST be called at `onEvidence` before the phase gate and at `contributeCriticInput` before the critic prompt is assembled, and the whole verification gate MUST run afterwards whatever the layer returned. A seam, a loop layer and the bump MUST add no exit code and no stop reason.
  - test: CT-149-7
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

- **F149-FR-008**: At the entry of a phase the tree MUST be compared with the fingerprint of the tree that the approval record of the phase before binds. A difference MUST be an integrity event and a fact for the critic of the phase that starts, and MUST never block.
  - test: CT-149-8
  - divergence: DV-077
  - parity: off (row 32 of annex X §X.7)

- **F149-FR-009**: When the protected set was changed without authority, the phase gate MUST still run: the verification gate runs, its result carries the condition, the critic is told through the fact block, and an approval stays possible. An integrity event MUST never halt the run and MUST never be read as a verdict.
  - test: CT-149-9
  - ep: EP-05 `specstride.check-runner/1` (consumes)
  - divergence: DV-076
  - parity: off (row 31 of annex X §X.7)

- **F149-FR-010**: Both seams of EP-18 MUST have a conformance suite and a sample outside the core: a sample critic strategy that makes two calls and a sample attempt planner, registered from the test tree, run a fixture with no change to the loop. Both planners of Wave 1 MUST pass the suite of the planner. The build MUST fail when a core file names a sample.
  - test: CT-149-10
  - ep: EP-18 `specstride.critic-strategy/1`, `specstride.attempt-planner/1` (implements)

### Key Entities

| Entity | What it is | Interface contract |
|---|---|---|
| Critic strategy | The seam that decides how a phase gate is judged | Feature 100 annex E §E.1 |
| Attempt planner | The seam that decides the kind and the model tier of the next phase attempt | Annex E §E.1 |
| Kind of a phase attempt | `plain`, `diagnosed`, `accelerated`, `bumped` | Annex E §E.1; annex X §X.6 row 9 |
| History of a phase | The phase attempts of a phase with kind, outcome, verdict and signature, and the counts | Ledger, annex B §B.13; logical names `attempt:<N>:<k>:<n>:record`, `phase:<N>:recovery-markers` |
| Bump table | The rule table of the model-tier bump | `specstride.table/1`, annex X §X.3 |
| Count of rejections by the critic | The count towards K, per phase | Ledger, namespace `core`, annex B §B.13 |
| Model-tier ladder | The ordered model tiers of a harness | Resolved registry, annex C §C.6 |
| Fingerprint of the tree | What an approval record binds and what phase entry compares | Annex B §B.14; logical names `gate:<N>:approved` (field `treeFingerprint`, what the approval record binds) and `phase:<N>:protected-set` (the fingerprints at phase entry) |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F149-SC-001**: The critic never approves its own session. In 100 per cent of the records of critic calls, over every fixture and every own test, the call shows a fresh session, no tools or the proven read-only form, and a session id that no pass of the phase attempt used.
- **F149-SC-002**: The verdict parser cannot be fed. Fuzzed with every kind of ledger record and every kind of row of the fact block, the parser returns 0 verdicts.
- **F149-SC-003**: The bump does what the option says and nothing else. With the option on, K − 1 rejections by the critic give 0 bumps and K give exactly 1; a failed verification gate and a MALFORMED verdict add 0 to the count; with the option off, the number of surfaces that differ from a run without the option is 0.
- **F149-SC-004**: The seam holds. The number of core files that differ between the build with the two samples of EP-18 and the build without them is 0.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The engine is one engine; the classic loop is the engine with the loop layer off | Decision 21 |
| One critic in Wave 1; the critic ensemble and human approvals are deferred, and the seam is in place | Ruling K5 |
| The model-tier bump is a Wave 1 option: off by default, off under the `parity` profile, with a register row, its own tests and an ablation arm | Ruling 48 |
| A move up the model-tier ladder stays on the same harness, starts a fresh session, never targets the model and effort of a critic-class call (a target that shares only the model is used, with the critic-diversity warning), and is skipped when the quota of the target is exhausted | Rulings 46, 47, 49, 55 |
| An integrity event is reported to the critic and does not halt | Ruling 41 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, and the spelling
of internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-18 | `specstride.critic-strategy/1` | implements (content owner) | The strategy with one critic; the conformance suite; the sample |
| EP-18 | `specstride.attempt-planner/1` | implements (content owner) | The planner of the recovery cycle and the planner of the model-tier bump; the conformance suite; the sample |
| EP-02 | `specstride.harness/1` | consumes | The model-tier ladder of a harness; the facts of a critic-class call (session id, tool list); `classify` for the state of the quota of a target |
| EP-04 | `specstride.loop-layer/1` | consumes | The call points `onEvidence` and `contributeCriticInput` |
| EP-05 | `specstride.check-runner/1` | consumes | The condition of a result of the verification gate when the protected set changed |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Common rules of extension points; failure of an implementation; EP-18 as an internal seam | — | Annex A §A.4 (F100-FR-018, F100-FR-019, F100-FR-020) |
| The critic never approves its own session; no new run state, exit code or stop reason from a layer | — | Annex A §A.5 (F100-FR-024, F100-FR-031) |
| Logical names | `specstride.layout/1` | Annex B §B.5 |
| Ledger: counts that survive | `specstride.ledger/1` | Annex B §B.13 (F100-FR-068, F100-FR-069) |
| Approval record: the fingerprint of the tree | `specstride.approval/1` | Annex B §B.14 (F100-FR-070) |
| Harness port; fresh sessions; forms of the `completion` level | `specstride.harness/1` | Annex C §C.1, §C.3 (F100-FR-083, F100-FR-087) |
| Resolved registry and role plan; the model-tier ladder | `specstride.registry/1` | Annex C §C.6 (F100-FR-092) |
| Check runner: fingerprints around the verification gate | `specstride.check-runner/1` | Annex C §C.8 (F100-FR-098) |
| Quota classifier: the state of the quota of a target | `specstride.quota-classifier/1` | Annex C §C.13 |
| Loop-layer interface; what is withheld from a layer | `specstride.loop-layer/1` | Annex D §D.1 (F100-FR-114, F100-FR-117) |
| Router rule table: the escalation, as the rule the bump is kept apart from | `specstride.router-rules/1` | Annex D §D.4 (F100-FR-130) |
| Fact block; protected set and phase entry | `specstride.fact-block/1` | Annex D §D.7 (F100-FR-135, F100-FR-136) |
| Critic strategy and attempt planner; the verdict grammar and the recovery cycle as the core guarantees them | `specstride.critic-strategy/1`, `specstride.attempt-planner/1` | Annex E §E.1 (F100-FR-138, F100-FR-139, F100-FR-140) |
| Stop-reason enumeration; exit codes of the engine | `specstride.stop-reason/1` | Annex E §E.3, §E.4 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| Table evaluator | `specstride.table/1` | Annex X §X.3 (F100-FR-204) |
| List of closed sets | — | Annex X §X.6, row 9 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, rows 24, 31, 32 |
| Threat model | — | Annex X §X.9: T-22 |

Fixture families of feature 141 used, on the port side only, by own tests: FX-01 to FX-08 and
FX-14 (§O.2), with the stubs P, CH, CC, D and V (§O.3). This feature has no parity test, because
it carries no as-is behaviour (§O.7).

## Rows of the `parity` profile

Stated as F100-FR-212 asks.

| Switch | Key (confirmed in the key list of feature 110) | Default | Under `parity` | Owner | Register row | Row of annex X §X.7 |
|---|---|---|---|---|---|---|
| Model-tier bump after K rejections by the critic | `attempt.tier_bump` | off | off | 149 | DV-079 | 24 |
| K of the bump | `attempt.tier_bump_after` | 2 | not used | 149 | DV-079 | 128 |

Rows this feature reads and does not own: 31 (fingerprints around the verification gate) and 32
(comparison of the tree at phase entry).

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Members | Owner | Closed by | Unknown value | Row of annex X §X.6 |
|---|---|---|---|---|---|
| Kinds of phase attempt | `plain`, `diagnosed`, `accelerated`, `bumped` | 149 | Design | `plain` | 9 |
| Outcomes of the bump rule | `bump`, `skip`, `none` | 149 | Design | `none` | 253 |
| Reasons of a skipped bump | `critic-model`, `quota-exhausted`, `ladder-top` | 149 | Design | Shown as text; the bump is skipped | 254 |

The decision point of the bump table is `attempt-tier`, with the choice set "Outcomes of the
bump rule". It is a point of the attempt planner and not of the router.

The closed set of verdicts (row 8) is read here and owned by the part of the split that holds the
verdict grammar.

## As-is behaviour not carried

The traceability files assign no row to this feature. It carries no as-is requirement, no as-is
success criterion and no behaviour item: every requirement is new.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

Intended differences from the baseline that this feature introduces, each off under the
`parity` profile:

| As-is behaviour | New behaviour | Register row |
|---|---|---|
| The attempt planner runs the recovery cycle only | Option: after K rejections by the critic the next phase attempt runs on the next model tier | DV-079 |
| Edits between an approval and the next phase entry are not noticed | The tree at phase entry is compared with the approved tree of the phase before; a difference is a fact for the critic | DV-077 |
| No fingerprint of the tree around the verification gate | A changed protected set is a fact for the critic and never halts | DV-076 |

## Ids before the split

This feature is the second part of the split of `101-gate-and-verdict`. The old ids are never
reused.

| Old id | New id |
|---|---|
| F101-FR-042 | F149-FR-001 |
| F101-FR-043 | F149-FR-002 |
| F101-FR-044 | F149-FR-003 |
| F101-FR-045 | F149-FR-004 |
| F101-FR-046 | F149-FR-005 |
| F101-FR-047 | F149-FR-006 |
| F101-FR-048 | F149-FR-007 |
| F101-FR-049 | F149-FR-008 |
| F101-FR-050 | F149-FR-009 |
| F101-FR-051 | F149-FR-010 |
| F101-SC-001 | F149-SC-001 |
| F101-SC-006 | F149-SC-002 |
| F101-SC-007 | F149-SC-003 |
| F101-SC-010 | F149-SC-004 |
| CT-101-19 | CT-149-1 |
| CT-101-20 | CT-149-2 |
| CT-101-21 | CT-149-3 |
| CT-101-22 | CT-149-4 |
| CT-101-23 | CT-149-5 |
| CT-101-24 | CT-149-6 |
| CT-101-25 | CT-149-7 |
| CT-101-26 | CT-149-8 |
| CT-101-27 | CT-149-9 |
| CT-101-28 | CT-149-10 |

No parity test moves: no test `PT-101-…` proves a requirement of this feature.

## Repairs after the cross-feature review

2026-09-30, act B-8.6c. Details in `repair-report.md`.

- F149-FR-009 (W-X-18): gained `ep: EP-05 `specstride.check-runner/1` (consumes)`.
- F149-FR-001 (note of feature 101; feature 100 repair report row 23): the warning is named
  "critic-diversity warning" and is due for the results `same-model` and `unverified` of the
  diversity test; the field name `sameModelWarning` of feature 111 is unchanged.
- B-8.7 (2026-09-30): F149-FR-003 cites row 128 of annex X §X.7 for K. The table "Rows of the
  `parity` profile" names this feature as the owner of rows 24 and 128 (annex X §X.7; key list of
  feature 110, keys `confirmed`), and the two closed sets of the bump cite rows 253 and 254 of
  annex X §X.6 in place of "New".
- B-8.7, pass-on (2026-09-30): F149-FR-005 follows CQ-204 and F100-FR-140 as repaired: only a
  target equal to a critic-class call of the run in model and in effort is skipped (rule
  `TB-05-critic-model`, reason `critic-model`, unchanged); a target that shares only the model is
  used and raises the critic-diversity warning; `assumption: CQ-204`. F149-FR-006 names the models
  and efforts of the critic-class calls as the signal. User Story 3 scenario 2, the signal
  `targetIsCriticModel` in `data-model.md`, `contracts/ep18-seams.md`, T021 and `quickstart.md`
  follow.

## Repairs after the analyze run of 2026-09-30

Third analyze run (the first two are in `analyze-report.md`). No requirement, no success
criterion and no id changed.

- Constraints: the row on a move up the model-tier ladder follows F149-FR-005 and ruling 49 (only
  a target equal to a critic-class call in model and in effort is refused). It said "never
  targets a model of the critic".
- Out of scope: fingerprints, the protected set and the content of the fact block name 116 and
  148 as owners (feature 100: rows 31 and 32 of annex X §X.7, and its repair W-100-02). The row
  said 115.
- Key Entities: the fingerprint of the tree names both logical names, `gate:<N>:approved` and
  `phase:<N>:protected-set`.
- `plan.md` and `tasks.md`: the folders of the test kit are `EP-18`, as feature 100 rules; T002
  checks the closed sets that feature 100 exports and defines none again; the test tasks T008,
  T011, T013 and T019 to T022 name in full what their requirement asks; T031 names rows 24 and
  128; the table of phase dependencies names what T011 and T028 wait for.
- Follow-up of the same day: the bump table is a constant of `packages/core/src/ep18/`, the two
  EP-18 values are types without schema files, and the import rule on the writers of the phase
  gate is `contracts/gate-writers-rule.json`, applied by CT-149-7 until feature 100 reads rule
  files. Proposed to feature 100 (`analyze-report.md`, "Proposed upstream fixes"): P1 a place for
  the data of other features, P2 a reader of import-rule files, P3 the text of row 32 of annex
  X §X.7 ("116; 149 performs the comparison").

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Does a failed verification gate, or a MALFORMED verdict, count towards K of the bump? → A: No. Only a verdict REJECTED of the critic counts. Integrated in F149-FR-004. (Source: brief 101 heading 4; R25 F-8, option C; F100-FR-140)
- Q: Are the bump and the escalation of the micro-loop layer one rule? → A: No. They are separate rules with separate counts, and both keep away from the models of critic-class calls. Integrated in F149-FR-006. (Source: `feature-briefs.md` D.8 "Where rulings meet", row 9; rulings 46, 48)
- Q: Does a bump carry over to the next phase? → A: No. It holds for the later phase attempts of the phase in which the critic rejected K times; the next phase starts on the base model tier with a count of 0. Integrated in F149-FR-004. (Source: brief 101 heading 4; R25 F-8)
- Q: How does a critic strategy make a call, given that the nonce and the verdict grammar belong to the core? → A: Through a call function that the engine hands to it. The function mints the nonce and the session, makes the call and parses the reply; a strategy never sees a nonce. Integrated in F149-FR-001. (Source: feature 100 annex E §E.1, "Guarantees of the core": every `completion` call inside `judge` has a nonce of its own and is a fresh session)
- Q: Is a critic ensemble part of Wave 1? → A: No. One critic; the seam is in place and the sample with two calls proves it. (Source: `APPROVAL.md` ruling K5; F100-FR-138)
- Q: Does a difference of the tree at phase entry, or a changed protected set, halt a run? → A: No. Both are facts for the critic; approval stays possible. Integrated in F149-FR-008 and F149-FR-009. (Source: `APPROVAL.md` ruling 41; R23v IR-33; F100-FR-136)
- Q: Which criterion of `feature-briefs.md` section D.5 does this feature carry after the split? → A: "The critic never approves its own session", which the brief assigns to 101, moves here with the requirement of the critic strategy, as F149-SC-001. (Source: `feature-briefs.md` D.5; `STAGE-B-SPLIT-PROMPT.md`)

### Session 2026-09-29 (speckit-clarify)

Three questions, answered from the sources. No question was put to a person.

- Q: From where is the state of the quota of the target of a bump known? → A: From what the run has recorded (the classes the quota classifier gave, the pause record). No call is made to find it out; where nothing is recorded, the quota counts as not exhausted. Integrated in F149-FR-005 and in the edge cases. (Source: feature 100 annex X §X.3, the evaluator reads recorded signals and has no I/O; Principle XII; `APPROVAL.md` ruling 47)
- Q: Is a bump that was skipped tried again? → A: Yes, at the next rejection of the phase, as long as the phase was not bumped; every evaluation is recorded. Integrated in F149-FR-005. (Source: `APPROVAL.md` ruling 47, "skip the escalation; the skip is recorded"; F149-FR-004, a phase is bumped at most once)
- Q: Which model tier is "the next"? → A: The rung above the model tier that the role plan gives the proposer for the phase, on the ladder of the same harness. Integrated in F149-FR-003. (Source: feature 100 annex C §C.6, the role plan per phase and role; ruling 46, "the next tier of the same harness")

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The readings of `feature-briefs.md` section D.8, "Where rulings meet", are used; row 9 bears on this feature.
- The loop that calls `judge` and `next`, the verdict parser, the ledger, the fact block and the fingerprints exist when this feature is built. Until then its tests use the samples of the test kit.
- The two keys of this feature, `attempt.tier_bump` and `attempt.tier_bump_after`, are `confirmed` in the key list of feature 110 with the owner 149 (rows 24 and 128 of annex X §X.7).

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-175 | What is the default of K? No source gives a value | 2, so that with the default reject limit of 3 the last phase attempt runs on the higher model tier | F149-FR-003 |
| CQ-204 | Does the model-tier bump skip a target on the critic's model whatever the effort? | No: as for escalation (CQ-191), only a target equal to a critic-class call in model and in effort is skipped; a target that shares only the model is used with the critic-diversity warning | F149-FR-005 |
