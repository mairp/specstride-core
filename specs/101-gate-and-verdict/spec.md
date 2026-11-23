# Feature Specification: Gate and verdict

**Feature Branch**: `101-gate-and-verdict` (a label: Spec Kit creates no branch in this repository; the directory is `specs/101-gate-and-verdict`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 101-gate-and-verdict of Specstride: the engine's gated phase loop over a run, its phases and phase attempts; the order verification gate, then critic, then approval record; the per-call nonce and the verdict grammar (APPROVED, REJECTED, MALFORMED); the MALFORMED limit, the reject limit and the oscillation halt; the recovery cycle (diagnostician and accelerator); the archive of a rejected phase attempt; the signed approval record and its verification on resume; post-approval steps (ticking tasks, the approval commit); the terminal record; the two internal seams of EP-18 (critic strategy, attempt planner); the model-tier bump after K critic rejections as an option that is off by default; the invariants IR-01 to IR-07 seen from the phase gate."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 2, 4, 5, 8, 9, 13, 17), `consolidation.md` (sections 1, 2, 3, 4, 5, 6), `feature-briefs.md` (brief 101-gate-and-verdict, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.1, feature 100 (`specs/100-specstride/`, annexes A, B, C, D, E, F, X), feature 141 (`specs/141-parity-oracle/`, §O.1 to §O.7), `traceability-frs.tsv`, `traceability-items.tsv`, `research/R18-behaviour-inventory.tsv`, and the research reports R23, R23v, R25, R14 and R11.

## What this feature is

A run works through the phases of a specification one after the other. For each phase the
proposer does the work and writes phase evidence. The phase gate then decides whether the phase
is done. This feature is the engine's loop around that decision.

The order at the phase gate is fixed. First the verification gate runs the declared commands.
Then an independent critic judges the phase evidence in a fresh session, and its reply counts
only if it carries the nonce of that one call. Only then does the runtime write an approval
record, which it signs and keeps where the proposer cannot write. A rejection leads to a new
phase attempt, until a limit halts the run and a person is needed.

The feature replaces the phase loop of the Specstride baseline and of Lisa. Under the `parity`
profile it behaves as the Specstride baseline does, and the parity oracle proves it.

**In scope**: the loop over the phases and phase attempts of a run; the order verification gate,
critic, approval record; the nonce per call and the verdict grammar; the verdicts APPROVED,
REJECTED and MALFORMED; the MALFORMED limit; the reject limit; the oscillation halt; the recovery
cycle (the diagnostician on a new signature of unmet criteria, the accelerator when due); the
archive of a rejected phase attempt; the signed approval record and its verification on resume;
the steps after an approval (ticking tasks, the approval commit); the terminal record.

The feature was split on 2026-09-29. The two internal seams of EP-18, the model-tier bump and
the invariants of the phase gate against loop layers left it; the section "Requirements moved to
149-attempt-planner-and-seams" holds the ids. This feature meets that part only through
interface contracts of feature 100.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Grounding snapshot, critic prompt, verdict pins, the slot of the fact block | 117 |
| The transport of a critic call and the form of the critic | 109 (the port); the harness adapters |
| When the hashes of spec, plan and task list are checked | 102 (launch, resume), 103 (every pass start), 105 (critic start, under the `parity` profile only); the hashing is 104's |
| What the verification gate runs and returns; release verification | 105 |
| The pass loop inside a phase attempt | 103 |
| Stop, resume, counts that survive | 102 |
| Which harness and model play the critic; the preflight of every role at launch, which finds a missing credential before the first pass, and the rule that admits no critic-class candidate whose context window is unknown | 124 |
| The critic ensemble and human approvals | The roadmap |
| The seams of the critic strategy and of the attempt planner; the model-tier bump; the invariants of the phase gate against loop layers; the comparison of the tree at phase entry | The content owner of EP-18; feature 100 annex E §E.1, annex D §D.1, §D.7 |
| The event types and their fields; the spelling of configuration keys | 111; 110 |

Where this feature consumes the behaviour of another feature, it names the interface contract of
feature 100 through which it does so, and no requirement of another feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A phase is approved only by an independent verdict (Priority: P1)

A consumer starts a run and leaves. For every phase the proposer delivers phase evidence, the
verification gate runs, the critic judges, and the runtime records the approval. The consumer
finds every phase approved, the tasks ticked and one commit per phase.

**Why this priority**: It is the path of every successful run and the reason the product exists.
An approval that the author of the work could produce would make every other feature worthless.

**Independent Test**: Run fixture family FX-01 of feature 141 under the `parity` profile and
compare every surface with the reference. Then assert on the event log that every approval
follows a reply with the matching nonce, made after the verification gate of the same phase
attempt ran, or was not required by the verification mode of the run.

**Acceptance Scenarios**:

1. **Given** a specification of three phases and stub agents that approve each phase, **When** the run ends, **Then** the engine exits 0, every phase has an approval record that verifies, the as-is end event carries the outcome `all_approved`, and the tasks of each phase are ticked (F101-FR-018, F101-FR-029, F101-FR-034).
2. **Given** phase evidence that holds a line in the form of a verdict, **When** the critic replies without a verdict line, **Then** the verdict is MALFORMED and no approval record is written (F101-FR-007, F101-FR-008).
3. **Given** a verification gate that fails in mode `required`, **When** the phase gate runs, **Then** the critic is not called, the engine writes the feedback itself and the phase attempt counts as rejected (F101-FR-005).
4. **Given** a reply with two verdict lines that both carry the nonce and both approve, **When** it is parsed, **Then** the verdict is MALFORMED (F101-FR-007).

---

### User Story 2 - A run that cannot converge halts and says why (Priority: P1)

An operator returns to a run that stopped. The exit code and the stop reason say which limit
ended it: the reject limit, the MALFORMED limit, an oscillating criterion or a configuration
error of the critic. The halt banner shows where the latest phase evidence and feedback are.

**Why this priority**: Exit codes and stop reasons are read by other programs. A halt that maps
to two codes, or to none, breaks relaunch and hides the cause.

**Independent Test**: A table test over fixture families FX-03 to FX-07: for each scenario the
exit code, the stop reason and `retryable` of the terminal record equal one row of the table
"Halts of the phase gate". Each scenario is mapped to its row by the end that feature 141 states
for it on the reference, and not by its family: of FX-07 only the scenario `phase-not-found`
ends in the row of the configuration error.

**Acceptance Scenarios**:

1. **Given** a reject limit of 3 and a critic that always rejects, **When** the third phase attempt is rejected, **Then** the engine exits 2 with the stop reason `max_rejects`, the last phase attempt is left unarchived, and the halt banner is printed (F101-FR-014).
2. **Given** a MALFORMED limit of 3, **When** three verdicts in a row are MALFORMED, **Then** the phase attempt is archived and the engine exits 1 with the stop reason `critic_unavailable` (F101-FR-015).
3. **Given** a criterion that is unmet, met and unmet again more often than the threshold allows, **When** the rejection is handled, **Then** the phase attempt is archived and the engine exits 2 with the stop reason `gate_oscillation` (F101-FR-016).
4. **Given** a critic whose configuration is invalid in a way that is found before the call (the phase is not in the specification), **When** the phase gate runs, **Then** the engine exits 3 with the stop reason `critic_config` and no count changes (F101-FR-010).
5. **Given** the `parity` profile, a MALFORMED limit of 3 and a critic whose credential is missing, **When** the run is started, **Then** three phase attempts are scored MALFORMED and the engine exits 1 with the stop reason `critic_unavailable`, as the baseline does; outside the profile the engine exits 3 with `critic_config` before the first call (F101-FR-010, F101-FR-015).

---

### User Story 3 - A forged approval approves nothing (Priority: P1)

An operator resumes a run. Between the stop and the resume, something wrote an approval marker
into the working tree, or changed an approval record. The run does not trust it: the phase is
judged again.

**Why this priority**: At the baseline an empty file that the proposer can write approves a
phase on resume. Automatic relaunch would inherit that path.

**Independent Test**: Own tests: for each way of forging (a planted marker, a record with a
wrong signature, a missing record, a record bound to another hash of the phase evidence), resume
and assert that the phase counts as not approved and that an integrity event was raised.

**Acceptance Scenarios**:

1. **Given** a bare approval marker in the workspace part and no approval record, **When** the run resumes, **Then** the phase counts as not approved and the run starts at it (F101-FR-031).
2. **Given** an approval record whose signature does not verify, **When** the run resumes, **Then** the phase counts as not approved and an integrity event names the phase and the failed binding (F101-FR-031).
3. **Given** a specification whose phase 1 shows every task ticked and no approval record, **When** a run is started, **Then** the start is refused and the three state commands are named (F101-FR-032).

---

### User Story 4 - A stuck phase gets one diagnosis and one accelerated phase attempt (Priority: P2)

A phase is rejected for a set of criteria it was not rejected for before. The runtime asks the
diagnostician once for a hint, and the next phase attempt acts on the hint with a narrowed
prompt. The same set of criteria never gets a second diagnosis.

**Why this priority**: The recovery cycle is as-is behaviour that parity binds, and it is the
only help a stuck phase gets before a person is needed.

**Independent Test**: Fixture family FX-08 of feature 141 under the `parity` profile.

**Acceptance Scenarios**:

1. **Given** a rejection with a signature of unmet criteria that differs from the one recorded, **When** the rejection is handled, **Then** one diagnostician call is made and the signature is recorded, whether or not the call wrote a hint (F101-FR-021).
2. **Given** a hint for a signature that was not accelerated yet, **When** the next phase attempt is planned, **Then** it is of the kind `accelerated`, and the signature is recorded before its pass starts (F101-FR-024).
3. **Given** the same signature again, **When** the rejection is handled, **Then** no diagnostician call is made and no accelerated phase attempt follows (F101-FR-021, F101-FR-024).

---

### Edge Cases

- The critic approves and the approval record cannot be written or does not verify: the phase attempt is handled as a rejection (F101-FR-011).
- The critic call times out, crashes or returns a value outside its result set: the phase attempt is a rejection scored MALFORMED; nothing else halts the run (F101-FR-010).
- The credential of the critic is missing: under the `parity` profile every phase attempt is scored MALFORMED and the run ends at the MALFORMED limit with exit 1; outside the profile the run halts with exit 3 before the first call (F101-FR-010).
- The critic of the role plan has the form `read-only-tools`: the diagnostician runs in that form, the proposer's notebook, handoff and outbox are moved out of the working tree for the call, and a proof that fails gives a warning and no hint (F101-FR-020).
- The diagnostician runs on the model that produced the passes, or its model is not known: the critic-diversity warning is raised and recorded, and the call is made (F101-FR-020).
- The feedback cannot be written: a warning is given and the result stays a rejection (F101-FR-012).
- A critic strategy that makes several calls in one phase attempt: the record of every call is kept inside the one verdict record of the phase attempt, also when two calls fall in the same second (F101-FR-012).
- The engine ends after the approval record was written and before the steps after the approval ran: at the next start the phase counts as approved, and the steps are not run again (F101-FR-033).
- A phase attempt that the verification gate rejected: the feedback the engine wrote is feedback like any other, so it feeds the signature, the diagnostician and the oscillation halt (F101-FR-017).
- The run halted at the reject limit and is resumed: phase evidence and feedback of the last phase attempt are still in place; the phase evidence is set aside before the proposer runs (F101-FR-004).
- A directory of a phase attempt already exists because counts were reset: the as-is suffix rule applies and nothing is overwritten (F101-FR-027).
- Feedback that names no task id: the signature is a hash of the text without verdict lines, and the oscillation halt cannot fire (F101-FR-019, F101-FR-016).
- The MALFORMED limit is 0: the limit is off, and a MALFORMED verdict still counts as a rejected phase attempt (F101-FR-015).
- Ticking the tasks fails after an approval: a warning is logged and the approval stands (F101-FR-034).
- The approval commit fails, or the working tree is not a repository: nothing is logged, no event is written and the run goes on (F101-FR-035).
- The owner of the lease is lost while the engine stands at the phase gate: no phase gate runs, and the engine ends with exit 6 (F101-FR-040).
- An exit of the engine for which the enumeration of stop reasons has no member (an invalid argument, a held lock, an internal error): see F101-FR-036 and its assumption.

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. Three notes for this feature:

| Note | Content |
|---|---|
| `disposition:` | Where a requirement carries ids with different dispositions, each disposition is followed by its ids in brackets |
| `test:` | A requirement with an as-is origin names the tests of the traceability files. A new requirement names a characterization test `CT-101-<n>`, with n from 13 upward; `CT-101-1` to `CT-101-12` are those of the traceability files |
| As-is literals | Literals of the baseline (names of as-is events, log lines, texts of feedback) are given because the compatibility projection and compatibility output must reproduce them. The tables "As-is events of the phase gate" and "As-is lines of the phase gate" hold them |

#### G1 — Phase loop, order at the phase gate, verdict grammar, limits, oscillation

- **F101-FR-001**: The engine MUST be the single driver of the loop over phases and phase attempts. The command `run` of the CLI protocol MUST start it in the foreground; it MUST take options only and no positional argument.
  - origin: C-005
  - disposition: ported
  - test: PT-101-C-005-*

- **F101-FR-002**: The engine MUST derive the phase at which a run starts from the records on disk, as the first phase of the specification that has no approval record that verifies (F101-FR-031). It MUST consult no stored counter for the position. An explicit start phase given by the consumer MUST replace the derived phase, without validation against the specification or the approval records. From the start phase on, the engine MUST run every phase in the order of the specification without checking approval records, so a later phase that is already approved is run again, as at the baseline.
  - origin: 028 FR-003; 002 FR-008; 002 SC-002; B-0271; B-0273; B-0337; B-0020
  - disposition: merged-with 002 FR-008 (028 FR-003); merged-with 028 FR-003 (002 FR-008, 002 SC-002); translated (B-0271); ported (B-0273, B-0337, B-0020)
  - test: PT-101-028FR003-*; CT-101-1; CT-101-11; PT-101-C-013-*; PT-101-C-006-*
  - divergence: DV-029; DV-011
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F101-FR-003**: When every phase is already approved at the start, the engine MUST run release verification first, log its outcome, write the as-is line "All phases already approved", emit the end event of the run with the outcome `all_approved` and without a count of phases, and exit 0. It MUST call neither the proposer nor the critic. When release verification fails, the engine MUST exit 2 with the stop reason `release_verification`.
  - origin: 028 FR-003; B-0275; B-0125; B-0141; B-0204
  - disposition: merged-with 002 FR-008 (028 FR-003); ported (B-0275, B-0125, B-0141, B-0204)
  - test: PT-101-028FR003-*; PT-101-C-013-*; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-012-*
  - divergence: DV-029
  - ep: EP-05 `specstride.check-runner/1` (consumes)

- **F101-FR-004**: At the start of every phase the engine MUST emit the start event of the phase (phase number, title, count of phases, hash of the phase shape or empty) and write the as-is line of the phase start. If phase evidence and feedback of the phase are both present, left by a halted rejection, the engine MUST set the phase evidence aside before the proposer runs, under the as-is label of a resume, and MUST leave the feedback in place for the prompt of the repair.
  - origin: B-0307; B-0093; B-0208
  - disposition: ported (B-0307, B-0208); translated (B-0093)
  - test: PT-101-C-013-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-007

- **F101-FR-005**: In every phase attempt the order at the phase gate MUST be: the pass loop has ended and phase evidence exists; then the verification gate; then the critic; then the approval record. In verification mode `required` the verification gate MUST run before the critic on every phase attempt. When it fails, the critic MUST NOT be called, the result of the phase attempt MUST be forced to a rejection (result code 10), and the engine MUST write the feedback of the phase attempt itself, from the result record of the verification gate. No result of an earlier run of a check MUST stand in for the verification gate.
  - origin: B-1149
  - disposition: ported
  - test: PT-101-C-013-*
  - divergence: DV-040
  - ep: EP-05 `specstride.check-runner/1` (consumes)

- **F101-FR-006**: Every critic call MUST carry a nonce of its own: 64 bits from a secure random source, written as 16 lower-case hexadecimal characters, made fresh for the call and never used for a second call. A call of the diagnostician MUST carry no nonce. The nonce MUST NOT be written to disk, to an event or to a span before the call has returned, and MUST NOT exist while the pass loop of the phase attempt runs.
  - origin: 028 FR-005; 002 FR-018; B-1010
  - disposition: merged-with 002 FR-019 (028 FR-005); merged-with 028 FR-005 (002 FR-018); ported (B-1010)
  - test: PT-101-028FR005-*; CT-101-7; PT-101-C-066-*

- **F101-FR-007**: The engine MUST hand the demand for the verdict to the assembler of the critic prompt: the reply ends with exactly one line `VERDICT <nonce>: APPROVED` or `VERDICT <nonce>: REJECTED`, and the demand is repeated after the end marker of the prompt. The verdict MUST be parsed from the reply by this grammar: a whole line that holds `VERDICT`, the nonce of the call, a colon and one of the two words, with optional blanks around them, matched without regard to case, anywhere in the reply. The word found MUST be read in upper case. Exactly one matching line MUST give its verdict. Every other reply MUST give MALFORMED, with one of three details: a verdict line is present and the nonce is missing or different; no verdict line was found; more than one line carries the nonce, with their number, even when they agree.
  - origin: 028 FR-005; 002 FR-019; B-0973; B-0975; B-0976; B-0977; B-0978; B-0979
  - disposition: merged-with 002 FR-019 (028 FR-005); merged-with 028 FR-005 (002 FR-019); ported (B-0973, B-0975, B-0976, B-0977, B-0978, B-0979)
  - test: PT-101-028FR005-*; CT-101-8; PT-101-C-066-*; CT-101-32

- **F101-FR-008**: A verdict MUST come from the reply of a critic call and from nothing else. A line in the form of a verdict in phase evidence, in a grounded file, in feedback, in a ledger record, in a row of the fact block or in the result of an inner check MUST approve nothing. Only the verdict APPROVED counts as an approval; MALFORMED MUST count as a rejection.
  - origin: 028 SC-002; 002 SC-001
  - disposition: merged-with 002 SC-001 (028 SC-002); merged-with 028 SC-002 (002 SC-001)
  - test: PT-101-028SC002-*; CT-101-10; CT-101-32

- **F101-FR-009**: The engine MUST make every critic call through the critic strategy of feature 100, annex E §E.1, with these inputs: the working directory as an absolute path, the phase, the ordinal of the phase attempt, the reject limit, the critic of the role plan, the time limit of the call, the spec format, the feature slug, and the verification plan where one exists. The time limit MUST default to 300 seconds and MUST also bound a call of the diagnostician. The call MUST be given the role `critic`, the as-is value 0 for the ordinal of the pass, an invocation identity in the as-is form (run id, role, phase, ordinal of the phase attempt) and its invocation record; none of them MUST reach the environment of a later pass. The ordinal and the reject limit MUST be used for records only. The critic MUST NOT be a command of the CLI: its outcome MUST be a result record whose `exit_code` is 0 for APPROVED, 10 for REJECTED and for MALFORMED alike, 3 for a configuration error, 1 for an uncaught error and 2 for a usage error.
  - origin: C-059; C-060; C-061; C-063; B-0321; B-0019; B-0047; B-0081; B-0082; B-0183; B-0870; B-0871
  - disposition: translated (C-059, C-060, C-061, C-063, B-0047, B-0081, B-0082, B-0183, B-0870, B-0871); ported (B-0321, B-0019)
  - test: PT-101-C-059-*; PT-101-C-060-*; PT-101-C-061-*; PT-101-C-063-*; PT-101-C-013-*; PT-101-C-006-*; PT-101-C-007-*; PT-101-C-011-*; PT-101-C-064-*
  - divergence: DV-066; DV-027; DV-006; DV-036
  - ep: EP-02 `specstride.harness/1` (consumes); EP-18 `specstride.critic-strategy/1` (consumes)

- **F101-FR-010**: A configuration error of the critic MUST halt the run: the engine writes the as-is line of the halt, exits 3 and records the stop reason `critic_config` with the phase, and no count changes. The configuration errors are those that are found before the call is made: a missing specification, an invalid format, a phase that is not found, an invalid verification plan, missing phase evidence (F101-FR-013), and a critic whose proof of the form of the `completion` level fails (`critic_not_toolless`). Every other failure of a critic call (a transport error, a time-out, a crash, a result outside the result set, an error that is raised inside the call) MUST be scored as MALFORMED with the detail `call-failed`, which rejects the phase attempt. A missing credential of the critic MUST be handled by the switch of the table "Rows of the `parity` profile". With the switch off, which is its value under the `parity` profile, a missing credential MUST be a failed call as at the baseline: every phase attempt is scored MALFORMED, and the run ends at the MALFORMED limit with exit 1 and the stop reason `critic_unavailable` (F101-FR-015). With the switch on, which is the default, the engine MUST find the missing credential before the call, by the operation `preflight` of the harness port, which makes no paid call, and MUST halt with exit 3 and `critic_config`; the message MUST name the credential by the name of its variable or key and never by a value. This check at the phase gate is the last line: the preflight of every role at launch, which finds a missing credential before the first pass, belongs to feature 124. Where the quota classifier gives a failure a quota class, the rules of the quota pause apply and nothing is scored.
  - origin: 028 FR-010; 002 FR-011; B-0135; B-0151; B-0226; B-0327
  - disposition: merged-with 002 FR-011 (028 FR-010); merged-with 028 FR-010 (002 FR-011); ported (B-0135, B-0151, B-0226, B-0327)
  - test: PT-101-028FR010-*; CT-101-3; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-012-*; PT-101-C-013-*; CT-101-30
  - divergence: DV-117
  - ep: EP-12 `specstride.quota-classifier/1` (consumes)
  - parity: a missing credential is a failed call, scored MALFORMED (the switch is off: row 133 of annex X §X.7); the quota class is not observable: the stub agents emit no quota signal (row 39 of annex X §X.7)
  - assumption: CQ-187 (a missing credential is a failed call under the `parity` profile, as the code of the baseline does; outside the profile it stays a configuration error with exit 3: register row DV-117, row 133 of the profile)

- **F101-FR-011**: A phase MUST count as approved only when the verdict of the critic strategy is APPROVED and the approval record of the phase was written and verifies. An APPROVED verdict without such a record MUST be handled as a rejection. The engine MUST take the kind of a verdict (APPROVED, REJECTED, MALFORMED) from the verdict record of the phase attempt and never from the result code, which is 10 for REJECTED and MALFORMED alike.
  - origin: B-0323; B-0287
  - disposition: translated (B-0323); ported (B-0287)
  - test: PT-101-C-013-*
  - divergence: DV-029

- **F101-FR-012**: For every critic call the engine MUST write a verdict record, for APPROVED, REJECTED and MALFORMED alike and for a failed call as well. In its as-is form it holds the phase, the ordinal of the phase attempt, the critic, the verdict, the detail of the parse, the prompt in full and the reply or `(empty)`. On REJECTED and on MALFORMED the engine MUST write the feedback of the phase attempt, replacing earlier feedback of the phase: the as-is heading with the verdict; for MALFORMED a quoted notice that the reply was malformed, with the detail, and that the phase is treated as REJECTED as the safe failure; the as-is line that says what must be addressed; then the reply of the critic as it was, or `(no critic output)`. The reason of a verdict that is not an approval MUST be the first non-empty line of the reply that is no verdict line, without leading list or heading marks, cut to 120 characters, or the detail of the parse where no such line exists. A phase attempt MUST have one verdict record; where a critic strategy made several calls, the verdict record MUST hold the record of every call. A failed write of the verdict record or of the feedback MUST give a warning only, and the result MUST stay a rejection. The critic call MUST report the one word APPROVED, REJECTED or MALFORMED as its as-is output line.
  - origin: 028 FR-006; 002 FR-020; C-064; B-0900; B-0901; B-1017; B-0883
  - disposition: merged-with 002 FR-012 (028 FR-006); merged-with 028 FR-006 (002 FR-020); translated (C-064, B-0883); ported (B-0900, B-0901, B-1017)
  - test: PT-101-028FR006-*; CT-101-9; PT-101-C-064-*; PT-101-C-065-*; PT-101-C-066-*
  - divergence: DV-006; DV-066; DV-029
  - assumption: CQ-173 (the as-is verdict record and the feedback hold the nonce in clear after the call has returned; F100-FR-139 allows only its hash)

- **F101-FR-013**: The critic MUST judge only phase evidence that exists when the pass loop has ended. The engine MUST read it as a claim: as a regular file, without following links, and with bytes that are no valid text replaced and not refused. Missing phase evidence at a critic call MUST be a configuration error (result code 3) whose message names the logical name of the phase evidence.
  - origin: B-0865; B-0872
  - disposition: translated
  - test: PT-101-C-063-*; PT-101-C-064-*
  - divergence: DV-006

- **F101-FR-014**: Every rejection of a phase attempt (a verdict REJECTED, a verdict MALFORMED, a failed verification gate) MUST emit the as-is rejection event, write the as-is line of the rejection with the ordinal and the reject limit, and use one of the phase attempts that the reject limit allows. The reject limit MUST come from configuration, with the default 3. When the count of phase attempts of the phase has reached the limit at a rejection, the engine MUST print the halt banner (the limit, that a person is needed, the latest phase evidence and feedback, the hint and the acceleration note where they exist, the history of phase attempts, and a rejection trail of one gist line of at most 100 characters per archived phase attempt), MUST record the stop reason `max_rejects` with the phase and the count, and MUST exit 2. It MUST NOT archive that last phase attempt: phase evidence and feedback stay in place (F101-FR-004). Otherwise the engine MUST archive the phase attempt and go on with the next ordinal. At most as many phase attempts as the limit are judged per phase.
  - origin: 028 FR-008; 002 FR-010; 028 SC-004; B-0015; B-0039; B-0105; B-0227; B-0330; B-0310; B-0334; B-0336; B-0306; B-0138; B-0154; B-0231
  - disposition: merged-with 002 FR-010 (028 FR-008); merged-with 028 FR-008 (002 FR-010); ported (028 SC-004, B-0015, B-0227, B-0330, B-0310, B-0334, B-0336, B-0306, B-0138, B-0154, B-0231); translated (B-0039, B-0105)
  - test: PT-101-028FR008-*; CT-101-2; PT-101-028SC004-*; PT-101-C-006-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-012-*; PT-101-C-013-*
  - divergence: DV-011; DV-027; DV-007
  - parity: the count restarts at 1 in every engine start: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F101-FR-015**: The MALFORMED limit MUST come from configuration, with the default 3; the value 0 switches the limit off. While the limit is on, every phase attempt whose newest verdict is MALFORMED MUST raise the MALFORMED streak by one, with the as-is event and line that carry the streak and the limit, and every other result MUST set the streak to 0; a failed verification gate leaves no verdict and sets it to 0 as well. When the streak reaches the limit the engine MUST archive the phase attempt, record the stop reason `critic_unavailable` with the phase, the count of phase attempts and the streak, and exit 1. A MALFORMED verdict below the limit MUST be an ordinary rejection under F101-FR-014.
  - origin: 028 FR-010; B-0048; B-0106; B-0228; B-0136; B-0152; B-0309; B-0328; B-0329; B-0331
  - disposition: merged-with 002 FR-011 (028 FR-010); translated (B-0048, B-0106); ported (B-0228, B-0136, B-0152, B-0309, B-0328, B-0329, B-0331)
  - test: PT-101-028FR010-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-012-*; PT-101-C-013-*
  - divergence: DV-011; DV-027; DV-007
  - parity: the streak starts at 0 in every engine start: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F101-FR-016**: After a rejection the engine MUST look for an oscillating criterion. A criterion is a task id in the as-is form (the letter T, two or more digits, an optional lower-case letter) found in feedback; feedback without such an id can never trip the halt. The check MUST be skipped unless at least four feedback records exist for the phase, the archived ones and the live one together. Over the feedback records of the window, in order, a criterion oscillates when it is present, absent and present again more often than the threshold, which comes from configuration with the default 2. The window MUST be keyed by the sequence of phase attempts of the phase since the counts were last reset, so that it continues across a resume and a relaunch. On an oscillation the engine MUST archive the phase attempt first, emit the as-is event with the criterion and the number of reappearances, record the stop reason `gate_oscillation` with the phase and the count of phase attempts, and exit 2.
  - origin: 028 FR-009; B-0074; B-0107; B-0137; B-0153; B-0288; B-0289; B-0290; B-0291; B-0333
  - disposition: ported (028 FR-009, B-0137, B-0153, B-0288, B-0289, B-0290, B-0291, B-0333); translated (B-0074, B-0107)
  - test: PT-101-028FR009-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-013-*
  - divergence: DV-044; DV-027; DV-007
  - parity: the as-is window (feedback written since the engine start): resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F101-FR-017**: After a rejection the engine MUST act in this order: the MALFORMED limit; the diagnostician; the oscillation halt; the reject limit; the archive and the next phase attempt, whose kind the attempt planner of feature 100, annex E §E.1, gives. The feedback that the engine wrote after a failed verification gate MUST be feedback like any other: it gives a signature and it is a record of the oscillation window. The diagnostician MUST therefore also run after a rejection by the verification gate and on the last phase attempt before a halt by the reject limit or by oscillation, and MUST NOT run on the phase attempt that trips the MALFORMED limit.
  - origin: B-0331; B-0332
  - disposition: ported
  - test: PT-101-C-013-*
  - ep: EP-18 `specstride.attempt-planner/1` (consumes)

- **F101-FR-018**: When every phase from the start phase on was approved in this run, the engine MUST run release verification, and when it passed or was not required MUST emit the end event of the run with the outcome `all_approved` and the count of phases, write the as-is final line with the count and the time, and exit 0. When release verification fails, the engine MUST exit 2 with the stop reason `release_verification`, as in F101-FR-003. `all_approved` MUST be the only outcome of the as-is end event.
  - origin: 028 SC-001; B-0139; B-0155; B-0232
  - disposition: translated (028 SC-001); ported (B-0139, B-0155, B-0232)
  - test: PT-101-028SC001-*; PT-101-C-009-*; PT-101-C-010-*; PT-101-C-012-*
  - divergence: DV-007

#### G2 — Recovery cycle and the archive of a phase attempt

- **F101-FR-019**: The signature of unmet criteria of a feedback MUST be the sorted list, without repeats, of the task ids in the as-is form found in the feedback, joined with commas as at the baseline. For feedback without a task id it MUST be the word `text:` and the hash of the feedback from which every verdict line was removed, so that the nonce of a call does not make equal feedback look new. The hash MUST come from the canonical hasher of feature 100 and MUST equal the baseline's on the same input. The gist of a feedback MUST be one line, chosen in this order: the first line that says that something is not met, not verified or not substantiated, without regard to case; else the first roster line of a failed or errored check; else the first line that is no heading, no quotation and not the as-is line that says what must be addressed. The gist is cut to 160 characters.
  - origin: B-0279; B-0280; B-0281; B-1147
  - disposition: ported
  - test: PT-101-C-013-*

- **F101-FR-020**: A call of the diagnostician MUST be a critic-class call: a fresh session, the critic of the role plan unless the consumer configured another harness for the role, in the form of the `completion` level of its entry of the role plan (feature 100, annex C §C.3: no tools, or only read-only tools), with the proof of the form recorded for the call, the time limit of the critic call, and exactly one call. A call whose proof is missing or fails MUST NOT be made; it MUST be handled as a failure of the diagnostician, which only warns, and no hint is written. Before a diagnostician of the form `read-only-tools` starts, the proposer's notebook, handoff and outbox MUST be moved out of the working tree, and moved back after the call, as feature 100, F100-FR-088, states for a critic of that form. The critic-diversity rule and its warning are those of feature 100, F100-FR-024: before the call the engine MUST compare the identity of provider and model that the operation `capabilities` of the harness port reports for the diagnostician with the models that produced passes in the phase attempt; of the results of the diversity test (feature 100, annex X §X.6, row 183), `same-model` and `unverified` (the identity is null or the model is unknown) MUST raise the critic-diversity warning, which MUST be recorded and MUST never block a run or the call. The diagnostician MUST never run in a session of the proposer. It MUST carry no nonce and no verdict grammar, and it MUST be given the role `diagnostician`, no verification plan and no reject limit. The checks of the specification, the format, the phase and the phase evidence MUST run before the call as they do for a critic call. The outcome of the call MUST be ignored by the loop: its result code is 0 whether the hint was written, the call failed or the hint could not be written. The diagnostician MUST never write an approval record, a verdict or feedback, and a failure of it MUST only warn. The engine MUST emit the as-is events of the start, of the end (with the size of the reply and the case) and of an error of the diagnostician; after an error no hint is written.
  - origin: B-0283; B-1148; B-0071; B-0805; B-0866; B-0966; B-0967; B-1003; B-0851; B-0852; B-0853
  - disposition: ported (B-0283, B-1148, B-0966, B-0967, B-1003); translated (B-0071, B-0805, B-0866, B-0851, B-0852, B-0853)
  - test: PT-101-C-013-*; PT-101-C-066-*; PT-101-C-007-*; PT-101-C-060-*; PT-101-C-063-*; PT-101-C-062-*; CT-101-31
  - divergence: DV-007; DV-027; DV-066; DV-081
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: the as-is transport and mode of the critic, no proof is made, and the line of the critic-diversity warning is not printed (rows 28 and 92 of annex X §X.7)

- **F101-FR-021**: After a rejection the engine MUST run the diagnostician only when the diagnostician is enabled, feedback of the phase exists, and the signature of that feedback differs from the signature recorded for the phase as diagnosed. After every call of the diagnostician the engine MUST record the signature as diagnosed, whether or not the call succeeded or wrote a hint. At most one call of the diagnostician is therefore made per signature and phase. The engine MUST emit the as-is trigger event and write the as-is line of the diagnostician. The diagnostician MUST be enabled by default: the default of its setting is the literal that means true, and any other literal disables it.
  - origin: 028 FR-011; 028 SC-005; B-0282; B-0070; B-0173; B-0089; B-0206
  - disposition: translated (028 FR-011, B-0070, B-0173, B-0089); ported (028 SC-005, B-0282, B-0206)
  - test: PT-101-028FR011-*; PT-101-028SC005-*; PT-101-C-013-*; PT-101-C-007-*; PT-101-C-011-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-066; DV-027; DV-006; DV-007

- **F101-FR-022**: The prompt of the diagnostician MUST demand that the first line of the reply is `CASE: GROUNDING` or `CASE: REAL-GAP`. It MUST show the files it names in full, up to 200,000 bytes per file and 600,000 bytes in total, both scaled by the context window of the model, which is known because role resolution (feature 124) admits no critic-class candidate whose window is unknown, with the as-is markers for a file that is not on disk, a directory (at most 200 entries listed), a binary file, a file skipped because the total was reached, and a file cut at the cap. A prompt that does not fit the window MUST be fitted by shrinking first the block of files, then the history, then the phase evidence. The case MUST be read from the first non-empty line of the reply, tolerant of leading mark-up, of case and of the as-is spellings of the second case; it MUST be recorded as `grounding`, `real_gap` or `unknown`, and nothing at the phase gate MUST read it. Outside the `parity` profile every text in the prompt that comes from outside the runtime (phase evidence, feedback, files) MUST stand inside data boundaries with a token of the call, as feature 100, F100-FR-221, asks; the prompt MUST follow the switch of the block set of the critic prompt and MUST have no switch of its own.
  - origin: B-0917; B-0893; B-0962; B-0963; B-0965
  - disposition: ported
  - test: PT-101-C-066-*; PT-101-C-065-*; CT-101-29
  - divergence: DV-100
  - parity: the as-is prompt, compared in full by rule N-24 (row 58 of annex X §X.7, DV-100)

- **F101-FR-023**: The engine MUST write the hint of the diagnostician as a record of the phase attempt: the as-is heading with the phase and the ordinal of the phase attempt, the as-is notice of three lines that the hint is no verdict of the critic, and the reply as it was, or `(empty diagnostician reply)`. When the hint was written, the call MUST report the as-is word `HINT-WRITTEN`.
  - origin: B-0869; B-0894; B-0797
  - disposition: translated (B-0869, B-0797); ported (B-0894)
  - test: PT-101-C-064-*; PT-101-C-065-*; PT-101-C-060-*
  - divergence: DV-006; DV-066

- **F101-FR-024**: A phase attempt of the kind `accelerated` MUST be due only when the accelerator is enabled, the phase attempt before it in this engine start was not accelerated, a hint and feedback of the phase exist, and the signature recorded as diagnosed is not empty and differs from the signature recorded as accelerated. The engine MUST record the signature as accelerated before the pass of the accelerated phase attempt starts, so that an interrupted one is never repeated for the same signature. At most one accelerated phase attempt is therefore made per diagnosed signature. The accelerator MUST be enabled by default: the default of its setting is the literal that means true, and any other literal disables it. The memory of what the phase attempt before was MUST be kept as the ledger keeps counts. The engine MUST hand to the attempt planner, as facts of the history of the phase, whether a diagnosis was made after the last rejection and whether an accelerated phase attempt is due; the planner works out neither again.
  - origin: 028 FR-012; 028 SC-005; B-0284; B-0072; B-0179; B-0308
  - disposition: ported (028 FR-012, 028 SC-005, B-0284, B-0308); translated (B-0072, B-0179)
  - test: PT-101-028FR012-*; PT-101-028SC005-*; PT-101-C-013-*; PT-101-C-007-*; PT-101-C-011-*
  - divergence: DV-011; DV-027; DV-006
  - parity: the memory starts empty in every engine start: resume fixtures pass `--reset-counts` (row 13 of annex X §X.7)

- **F101-FR-025**: An accelerated phase attempt MUST be run by the pass loop in the role `accelerator`, on the harness configured for the accelerator, which by default is the proposer's. It MUST use an ordinal of the phase like every other phase attempt. Its prompt MUST be narrowed: from the section of the phase only the headings and the lines that name an unmet task id, or the whole section for a signature of text; the feedback; the hint as the first instruction; a rule on the footprint of the change; the contract of the phase evidence; the instruction to take the newest archived phase evidence of the phase and to splice the change into it; the ordinal and the reject limit; and the verification obligations of the unmet ids only. The prompt MUST follow the switch of the block set of the proposer's prompt and MUST have no switch of its own: with the as-is block set it MUST equal the baseline's byte for byte, and otherwise feedback and hint MUST stand in it as data. The engine MUST emit the as-is start event of the accelerator with the phase, the ordinal, the harness and the criteria, and write the as-is line.
  - origin: B-0313; B-0073; B-0285; B-0286; B-0094; B-0211
  - disposition: ported (B-0313, B-0285, B-0286, B-0211); translated (B-0073, B-0094)
  - test: PT-101-C-013-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-027; DV-007; DV-094
  - parity: the as-is block set (row 12 of annex X §X.7)
  - ep: EP-15 `specstride.prompt-block/1` (consumes)

- **F101-FR-026**: Around the pass of an accelerated phase attempt the engine MUST record the state of the tree before and after: the changed files against the last commit with their counts of lines, and the files that are new, sorted; both records are empty outside a repository. After the pass the engine MUST write the acceleration note: the as-is heading with the phase and the ordinal, the criteria acted on, the files that the pass changed, and the accelerator's own note. Where the accelerator left a note of its own, the engine MUST read it as a claim, take it into the acceleration note under its as-is heading, and remove it. The engine MUST emit the as-is event of the acceleration note.
  - origin: B-0174; B-0175; B-0180; B-0098
  - disposition: translated
  - test: PT-101-C-011-*; PT-101-C-008-*
  - divergence: DV-006; DV-007

- **F101-FR-027**: To archive a rejected phase attempt the engine MUST move the phase evidence out of the place where the proposer delivers it, so that stale phase evidence never ends the next pass loop, and MUST keep with it the feedback, the hint, the acceleration note and the newest verdict record of the phase attempt. Feedback, hint and acceleration note MUST stay available to the next phase attempt. Where the place of the archive already exists, the as-is suffix rule MUST apply and nothing MUST be overwritten. The engine MUST emit the as-is event of the archive with the phase, the ordinal and the place.
  - origin: 028 FR-007; 002 FR-014; B-0176; B-0292; B-0293; B-0294; B-0090
  - disposition: merged-with 002 FR-014 (028 FR-007); merged-with 028 FR-007 (002 FR-014); translated (B-0176, B-0090); ported (B-0292, B-0293, B-0294)
  - test: PT-101-028FR007-*; CT-101-6; PT-101-C-011-*; PT-101-C-013-*; PT-101-C-008-*
  - divergence: DV-011; DV-006; DV-007

- **F101-FR-028**: Every file that this feature writes (approval record, approval key, record of a phase attempt, verdict record, feedback, hint, acceleration note, accelerator snapshot, recovery markers, archived phase evidence, the archive at approval, terminal record) MUST be written to a temporary name in the same directory and renamed into place. No reader MUST ever see a part of such a file.
  - origin: 002 FR-013; 002 SC-003
  - disposition: ported
  - test: CT-101-5; CT-101-12
  - divergence: DV-072; DV-029
  - parity: not observable: captures are taken after the run

#### G3 — Approval record, steps after an approval, terminal record

- **F101-FR-029**: On an APPROVED verdict, and only then, the engine MUST write the approval record of the phase, with the fields of feature 100, annex B §B.14: the feature and the phase; the identifiers of the run, the engine start, the phase attempt and the verdict; the hash of the nonce; the critic with the form of the `completion` level and the result of its proof; the hash of the phase evidence that was judged; the mode and the hash of the result of the verification gate; the fingerprint of the tree at the phase gate; the time; the id of the key; and the signature over every field. The record MUST be kept in the control plane. It MUST replace the empty approval marker of both as-is systems; the engine MUST write no marker. Only the engine MUST write an approval record. The engine MUST emit the as-is verdict event of an approval after the record and the verdict record were written.
  - origin: 028 FR-006; 002 FR-012; B-0875; B-0858; B-0867
  - disposition: merged-with 002 FR-012 (028 FR-006); merged-with 028 FR-006 (002 FR-012); translated (B-0875, B-0858, B-0867)
  - test: PT-101-028FR006-*; CT-101-4; PT-101-C-064-*; PT-101-C-062-*; PT-101-C-063-*
  - divergence: DV-029; DV-072; DV-007; DV-006

- **F101-FR-030**: The key that signs approval records MUST be a key of the feature, kept in the control plane. It MUST NOT be the key that signs the ledger. It MUST never be in the environment of a harness call or of a check, and never on a path that the containment level of a pass or of a check lets them read, where that level allows it. The runtime MUST create the key when the first approval record of a feature is written. An approval record MUST name the key that signed it.
  - test: CT-101-13
  - status: unverified (check: on a harness with containment C2 or above, a pass and a check cannot read the approval key; verified-on: —; pin: harness versions of the check)

- **F101-FR-031**: Wherever the engine reads whether a phase is approved (when it derives the start phase, at `resume`, at a relaunch, at phase entry), it MUST verify the approval record: the schema; the signature, with the key the record names; the verdict record it names, with the verdict APPROVED and the same hash of the nonce; the hash of the phase evidence against the phase evidence set aside in the control plane; and the hash of the result of the verification gate against the stored result. A record that fails in any of these, a missing record, and a bare marker without a record MUST each count as not approved and MUST raise an integrity event that names the phase and what failed. With the switch `commit.backpressure` of F152-FR-021 on, a record whose `verdictId` has a void marker of the commit gate (`commit-gate/phase<N>.void.json`) MUST also count as not approved, with the failure `voided` (annex X §X.6 row 255) (F152-FR-014). The fingerprint of the tree is compared at phase entry, as feature 100, F100-FR-136, states, and never makes a record fail.
  - test: CT-101-14
  - divergence: DV-029
  - parity: existence of the approval is compared through the logical name `gate:<N>:approved`; content is waived by surface; the fixture with a planted marker is waived (DV-029)

- **F101-FR-032**: The engine MUST refuse to start a run in a workspace whose specification shows a phase with every task ticked for which no approval record verifies, as feature 100, F100-FR-059, asks. The refusal MUST name the commands `state export`, `state import` and `state adopt`, MUST exit 3 and MUST change no state. It is no halt of the phase gate: it has no row in the table "Halts of the phase gate", and its terminal record carries no stop reason (CQ-174).
  - test: CT-101-15
  - divergence: DV-029
  - assumption: CQ-172 (whether the refusal is active under the `parity` profile; the baseline starts such a run at the first phase without a marker)
  - parity: off (row 129 of annex X §X.7)

- **F101-FR-033**: After an approval the engine MUST act in this order: set aside the feedback, the hint and the acceleration note that are left of the phase, replacing those of an earlier approval of the phase, so that none reaches a later phase; remove the recovery markers of the phase; emit the as-is event that the phase is done and write the as-is line of the approval with the ordinal; tick the tasks; let learning observe and evaluate the phase; make the approval commit. The approved phase evidence MUST stay where the proposer delivered it. Ticked tasks are therefore part of the approval commit. Where the engine ended after the approval record was written and before these steps were done, the next engine start MUST treat the phase as approved and MUST NOT run the steps again, as at the baseline. With the switch of F152-FR-021 on, the commit gate runs before the approval record is written, so an attempt whose commit would be blocked writes no approval record and none of these steps runs for it; where the engine ended after an approval and before its commit, the next start runs the commit gate over the pending work before it honours the approval, and a block voids it (F152-FR-001, F152-FR-014).
  - origin: 002 FR-012; B-0326; B-0184; B-0185; B-0102; B-0224
  - disposition: merged-with 028 FR-006 (002 FR-012); ported (B-0326, B-0224); translated (B-0184, B-0185, B-0102)
  - test: CT-101-4; PT-101-C-013-*; PT-101-C-011-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-006; DV-007; DV-029

- **F101-FR-034**: After an approval the engine MUST tick the task checkboxes of the phase in the specification, through the operation `tick` of the spec-format port, unless ticking is switched off or the format is `native`. A failed tick MUST log the as-is warning, MUST leave the file as it was and MUST NOT undo the approval. A tick that worked MUST emit the as-is event with the phase and the count, and write the as-is line with the count. Ticking MUST be on by default; only the literal that means false switches it off.
  - origin: 028 FR-013; B-0324; B-0083; B-0103; B-0225
  - disposition: ported (028 FR-013, B-0324, B-0225); translated (B-0083, B-0103)
  - test: PT-101-028FR013-*; PT-101-C-013-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-027; DV-007
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F101-FR-035**: After an approval the engine MUST make the approval commit in the project's repository only when commits are set to the as-is value that enables them, the working directory lies inside a work tree of a repository, and the tree has changes. It MUST stage every change of the working tree and commit with the as-is message, which holds the phase number and the title of the phase, or the word for the phase with its number where no title exists. It MUST never create a repository and never push. A commit that fails MUST be ignored without a log line and without an event. With the switch of F152-FR-021 on, a commit that the secret scan blocks is not a failed commit of this kind: it ends the phase attempt as F152-FR-002 states. A commit that fails for any other reason is still ignored. A commit that worked MUST emit the as-is event with the phase and write the as-is line. Before the commit the files that the runtime wrote MUST pass the scan of feature 100, F100-FR-206. No other commit, revert, reset or clean of the project's repository is made by this feature.
  - origin: 028 FR-014; B-0276; B-0277; B-0278; B-0050; B-0088; B-0205
  - disposition: ported (028 FR-014, B-0276, B-0277, B-0278, B-0205); translated (B-0050, B-0088)
  - test: PT-101-028FR014-*; PT-101-C-013-*; PT-101-C-007-*; PT-101-C-008-*; PT-101-C-012-*
  - divergence: DV-006; DV-027; DV-007
  - assumption: CQ-171 (what the commit holds of the state: at the baseline the state directory lies in the working tree and is committed unless the project ignores it; the control plane lies outside the tree)

- **F101-FR-036**: The engine MUST write the terminal record before it exits, on every path by which it exits, with the fields of feature 100, annex B §B.15: the exit code, the stop reason, `retryable`, `cause`, `causedBy`, the identifiers, the phase and the phase attempt where the run stood, the time, and for a run that rests blocked on a human the reason and what is needed. `retryable` MUST be decided for the one stop and MUST never be true for a stop reason that is not transient. After the terminal record the engine MUST run the work of the end of the run (release of the lock in start mode `standalone`, the end of the presenter, the summary of learning) in the order in which it was registered, and a failure of one step MUST NOT keep the others from running.
  - origin: B-0250
  - disposition: ported
  - test: PT-101-C-013-*; CT-101-16
  - divergence: DV-028
  - assumption: CQ-174 (the stop reason of an exit for which the enumeration has no member)

- **F101-FR-037**: Every halt of the phase gate MUST have exactly one exit code and exactly one stop reason, as the table "Halts of the phase gate" states them, and the compatibility projection MUST show the as-is stop line with the as-is fields of that table. This feature MUST add no exit code and no stop reason.
  - origin: C-009; C-010
  - disposition: ported
  - test: PT-101-C-009-*; PT-101-C-010-*

- **F101-FR-038**: The engine MUST emit the events of the phase gate in the envelope of feature 100, annex X §X.1, with the types of the event catalogue: for the start and the end of a phase and of a phase attempt, the end with its cause and its work products; for every critic call, opened and closed, with usage and latency; for a gap of grounding; for a recorded verdict and for a verdict that was adjudicated later; for the archive, the recovery cycle, the oscillation, ticked tasks and the approval commit. No event MUST hold a nonce, a prompt or a reply in full; the excerpts of a reply that the as-is fields `reason`, `error` and `note` carry pass the one ingress first (F101-FR-052). The compatibility projection MUST render them as the as-is events of the table "As-is events of the phase gate", with the as-is fields.
  - origin: C-008; C-062; B-0086; B-0855; B-0859
  - disposition: translated
  - test: PT-101-C-008-*; PT-101-C-062-*
  - divergence: DV-007
  - parity: on: the compatibility projection is compared (row 17 of annex X §X.7)

- **F101-FR-039**: In compatibility output the engine MUST write the lines of the table "As-is lines of the phase gate" to the engine log, byte for byte. A warning or a fatal message of a critic-class call MUST carry the logical component name `critic` where the baseline names the implementation file. Under the `parity` profile this feature MUST print no line that has no as-is equivalent.
  - origin: C-012; C-065; B-0883; B-0893; B-0894; B-0900; B-0901
  - disposition: ported (C-012, B-0893, B-0894, B-0900, B-0901); translated (B-0883)
  - test: PT-101-C-012-*; PT-101-C-065-*
  - divergence: DV-066
  - parity: compatibility output (rows 18 and 19 of annex X §X.7)

- **F101-FR-040**: The engine MUST verify the lease at every boundary of this feature at which it reads the stop request: before a phase starts, before a phase attempt starts, before the verification gate, before a critic-class call, before the approval record is written and before the steps after an approval. When the owner of the lease is lost, the engine MUST run no phase gate and write no approval record, and MUST end as feature 100, F100-FR-147, states: exit 6, stop reason `stop_flag`, cause `owner-lost`.
  - test: CT-101-17
  - ep: EP-13 `specstride.lock/1` (consumes)

- **F101-FR-041**: A halt of the phase gate by the reject limit, by the MALFORMED limit or by oscillation MUST end the run as a stop that is not retryable, with its stop reason of the table, and MUST NOT be relaunched. Where a path of the phase gate finds that the run cannot go on without the consumer for a reason of the closed set of blocked reasons of feature 100, annex E §E.2, the engine MUST emit the event `blocked` with that reason and what is needed, and MUST end with the stop reason and the exit code that the table of blocked reasons gives. From the phase gate these are: a source that changed, found when the critic starts under the `parity` profile (`source-changed`); and a failure of a critic-class call that the quota classifier classes as `quota_credit` or `auth` (`quota-credit`, `auth`). The event `blocked` projects to nothing.
  - test: CT-101-18
  - divergence: DV-067; DV-082
  - parity: the stop is as-is where the baseline stops; the event projects to nothing

- **F101-FR-052**: Text that a critic-class call brings from outside the runtime (the reply of the critic, the reply of the diagnostician, and the message of an error or a warning of the harness) MUST enter through the one ingress of feature 100, F100-FR-009, where it is redacted and cut, before this feature writes any part of it to the engine log, to the halt banner, to a field of an event (the `reason` of a verdict, the `error` of the diagnostician) or to a span. This feature MUST hold no redaction of its own. Where the redactor cannot run, the text MUST be dropped from the line or the field and the mark of dropped content MUST stand in its place, as feature 100, F100-FR-205, states; the verdict and the counts MUST NOT change.
  - test: CT-101-33
  - divergence: DV-095
  - parity: on: no text of a fixture matches a pattern, so the as-is lines and fields compare equal (register row DV-095)

#### Halts of the phase gate

| Cause | Engine exit | Stop reason | `retryable` | As-is fields of the stop line | Archived before the halt |
|---|---|---|---|---|---|
| Every phase approved, release verification passed or not required | 0 | none | false | The end event with `all_approved` | — |
| Configuration error of the critic, found before the call | 3 | `critic_config` | false | phase | No |
| MALFORMED limit reached; a failed call counts, and a missing credential of the critic counts as F101-FR-010 states | 1 | `critic_unavailable` | false | phase, count of phase attempts, streak | Yes |
| Oscillating criterion | 2 | `gate_oscillation` | false | phase, count of phase attempts | Yes |
| Reject limit reached | 2 | `max_rejects` | false | phase, count of phase attempts | No |
| Release verification failed | 2 | `release_verification` | false | As feature 100 states | — |
| The owner of the lease is lost | 6 | `stop_flag` | false | As feature 100 states | No |

Every other halt of a run (the limits of the pass loop, the wall-clock budget, a stop request)
belongs to the feature that owns it; the engine maps the result of the pass loop as feature 100,
annex E §E.4, states.

#### As-is events of the phase gate

What the compatibility projection renders. The names and fields are those of the baseline. The
types of the primary events belong to the event catalogue (feature 100, annex X §X.6, row 73).

| As-is event | As-is fields | When | Item |
|---|---|---|---|
| `run_start` | `workdir`, `phases` (count), `feature`, `proposer`, `critic`, `resume` (phase number or `done`), `states`, `verification` (mode), `verification_plan` | The engine starts the loop | B-0086 |
| `phase_start` | `phase`, `title`, `total`, `shape` | A phase starts | B-0093 |
| `critic_start` | `phase`, `attempt`, `provider` | The critic prompt is assembled, before the call | B-0855 |
| `verdict` (approved) | `phase`, `attempt`, `result=APPROVED`, `title` | After the approval record and the verdict record were written | B-0858 |
| `verdict` (not approved) | `phase`, `attempt`, `result` (`REJECTED` or `MALFORMED`), `reason`, `title`, `max_rejects` | After the feedback was written | B-0859 |
| `reject` | `phase`, `attempt` | Every rejection, a failed verification gate included | B-0105 |
| `critic_malformed` | `phase`, `attempt`, `streak`, `limit` | A MALFORMED verdict while the limit is on | B-0106 |
| `gate_oscillation` | `phase`, `attempt`, `criterion`, `reappears` | An oscillation was found | B-0107 |
| `attempt_archived` | `phase`, `attempt`, `dir` | A phase attempt was archived | B-0090 |
| `diagnostician_trigger` | `phase`, `attempt` | The diagnostician is due | B-0089 |
| `diagnostician_start` | `phase`, `attempt`, `provider` | Before the call of the diagnostician | B-0851 |
| `diagnostician_done` | `phase`, `attempt`, `bytes`, `case` | After the call | B-0853 |
| `diagnostician_error` | `phase`, `attempt`, `error` | The call failed | B-0852 |
| `accelerator_start` | `phase`, `attempt`, `backend`, `criteria` (the signature without its last comma) | Before the pass of an accelerated phase attempt | B-0094 |
| `acceleration_note` | `phase`, `attempt`, `note` | The acceleration note was written | B-0098 |
| `phase_done` | `phase`, `attempt`, `title` | After an approval | B-0102 |
| `tasks_ticked` | `phase`, `count` | Tasks were ticked | B-0103 |
| `git_checkpoint` | `phase` | The approval commit worked | B-0088 |
| `run_stop` | `reason` and the fields of the table "Halts of the phase gate" | A halt | B-0151 to B-0154 |
| `run_end` | `outcome=all_approved`; `phases` (count) except on the path where every phase was approved before | The run ends approved | B-0141, B-0155 |

The events of a verdict adjudicated later, of a gap of grounding, of an integrity note and
`blocked` have no as-is equivalent and project to nothing.

#### As-is lines of the phase gate

Written to the engine log in compatibility output. `<N>` is the phase, `<M>` the ordinal of the
phase attempt, `<L>` the reject limit.

| Line | When | Item |
|---|---|---|
| `# All phases already approved. Nothing to do.` | Every phase was approved before | B-0204 |
| `===== PHASE <N> — <title>  (<time>) =====` | A phase starts | B-0208 |
| `----- critic: phase <N> attempt <M> (<critic>) -----` | Before a critic call | B-0223 |
| `===== PHASE <N> APPROVED (attempt <M>) =====` | An approval | B-0224 |
| `      ticked <n> task checkbox(es) of phase <N> in <spec>`, or `      WARN: could not tick phase <N> task checkboxes in <spec> (approval stands)` | After ticking | B-0225 |
| `----- git checkpoint: phase <N> approved -----` | The approval commit | B-0205 |
| `>>> critic config/usage error (exit 3) — halting.` | A configuration error of the critic | B-0226 |
| `----- phase <N> REJECTED on attempt <M>/<L> -----` | A rejection | B-0227 |
| `>>> critic returned no usable verdict (MALFORMED <streak>/<limit>)` | A MALFORMED verdict while the limit is on | B-0228 |
| `----- diagnostician: phase <N> attempt <M> (unmet set changed) -----` | The diagnostician is due | B-0206 |
| `----- accelerator: phase <N> attempt <M>/<L> (<harness>) — acting on the hint for <criteria> -----` | An accelerated phase attempt starts | B-0211 |
| The halt banner, framed by lines of `#`: `# HALT — phase <N> exceeded MAX_REJECTS (<n>). Human needed.`, then `latest evidence`, `latest feedback`, the optional `diagnostician hint` and `acceleration note`, `attempt history`, and `rejection trail:` | The reject limit was reached | B-0231 |
| `# DONE — all <n> phase(s) approved. <time>` | The run ends approved | B-0232 |
| `APPROVED`, `REJECTED` or `MALFORMED`, as the one word of the critic call | After a critic call | B-0900, B-0901 |
| `HINT-WRITTEN` | The hint was written | B-0894 |
| The markers of the file dump of the diagnostician | In the prompt of the diagnostician | B-0893 |
| A warning or a fatal message with the prefix of the logical component name `critic` | A critic-class call warns or fails | B-0883 |

Paths in these lines are compared through the layout table (rule N-02), times through rule N-04.

### Key Entities

| Entity | What it is | Interface contract |
|---|---|---|
| Phase | One gated part of the specification, with its acceptance criteria | Canonical spec model, feature 100 annex C §C.7 |
| Phase attempt | One cycle of proposer and critic on one phase; it has an id, an ordinal and a kind | Identifiers, annex B §B.3; kinds, annex E §E.1 |
| Verdict and verdict record | The result of the critic strategy for one phase attempt, and the record of the call that gave it | Annex E §E.1; logical name `attempt:<N>:<k>:<n>:verdict` |
| Nonce | 64 bits made for one critic call; recorded by its hash | Annex E §E.1, F100-FR-139 |
| Feedback, hint, acceleration note | What a rejection leaves for the next phase attempt | Logical names `attempt:<N>:<k>:<n>:feedback`, `:hint`, `:acceleration` |
| Recovery markers | The signatures of a phase for which a diagnosis and an acceleration were made | Logical name `phase:<N>:recovery-markers` |
| Approval record | The signed record that a phase is approved | `specstride.approval/1`, annex B §B.14 |
| Approval key | The key of a feature that signs its approval records | Logical name `feature:<slug>:approval-key` |
| Terminal record | What the engine leaves when it exits | `specstride.terminal/1`, annex B §B.15 |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F101-SC-002**: No approval without an independent verdict. On the event log of every run, the number of approval records that do not follow a reply with the matching nonce, from a call made after the full verification gate of the same phase attempt ran or was not required by the verification mode of the run, is 0.
- **F101-SC-003**: One code and one reason per halt. In the table test over fixture families FX-03 to FX-07, 100 per cent of the scenarios end with the exit code, the stop reason and `retryable` of exactly one row of the table "Halts of the phase gate", which is the row that the end of the scenario on the reference names (feature 141, §O.2, the table of the ends on the reference).
- **F101-SC-004**: A forged approval approves nothing. 100 per cent of approval records that are forged, wrongly signed, missing or bound to another hash of the phase evidence are refused on resume, and a planted marker approves 0 phases.
- **F101-SC-005**: Parity. Under the `parity` profile the oracle reports 0 results `different` on the fixture families FX-01 to FX-08, FX-15 and FX-27, and on the scenarios of FX-13, FX-21 and FX-23 that the tests of this feature name.
- **F101-SC-008**: A person is asked in time. No phase gets more judged phase attempts than the reject limit in one count, and no signature gets more than one diagnosis and one accelerated phase attempt, in 100 per cent of the fixtures of FX-03 and FX-08.
- **F101-SC-009**: No partial file. In a test that ends the engine at random moments while it writes, the number of partial files that a reader finds under the logical names of this feature is 0.

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
| Lisa's phase loop is not the base; selected Lisa source is extracted: the verdict parser and the gate store, the store rewritten for the approval record | DP-014; ruling 12 |
| The engine is one engine; the classic loop is the engine with the loop layer off | Decision 21 |
| The verdict nonce has 64 bits | Ruling P16 |
| Inside a phase attempt the runtime never commits, reverts, resets or cleans the tree; the commit at approval stays | Ruling 50 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the signature scheme and the form of the
key, the test runner, bundling, and the spelling of internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-18 | `specstride.critic-strategy/1` | consumes | `judge`, once per phase gate, after the verification gate |
| EP-18 | `specstride.attempt-planner/1` | consumes | `next`, after every rejection |
| EP-02 | `specstride.harness/1` | consumes | `complete` for every critic-class call, in both forms of the `completion` level; `classify`; `preflight` for the credential of the critic; `capabilities` for the identity of provider and model |
| EP-03 | `specstride.spec-format/1` | consumes | The canonical spec model; `tick` |
| EP-05 | `specstride.check-runner/1` | consumes | The result record of the verification gate and of release verification; the fixed-argv calls of the version-control tool for the state of the tree around an accelerated phase attempt (F101-FR-026) and for the approval commit (F101-FR-035), since the engine starts no process itself |
| EP-12 | `specstride.quota-classifier/1` | consumes | The class of a failed critic-class call |
| EP-13 | `specstride.lock/1` | consumes | `verify` of the lease at every boundary |
| EP-15 | `specstride.prompt-block/1` | consumes | The blocks of the prompt of an accelerated phase attempt |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Layering rules; the one ingress of text from outside the runtime; common rules of extension points; the critic-diversity rule and its warning | — | Annex A §A.2, §A.4, §A.5 (F100-FR-006, F100-FR-009, F100-FR-019, F100-FR-024, F100-FR-031) |
| Rules of the layout; atomic write; identifiers; names of a phase attempt | `specstride.layout/1` | Annex B §B.2, §B.3, §B.4 (F100-FR-035, F100-FR-036, F100-FR-047) |
| Logical names | `specstride.layout/1` | Annex B §B.5 |
| Workspace record: the refusal for ticked phases without an approval record | `specstride.layout/1` | Annex B §B.6 (F100-FR-059) |
| Ledger: counts that survive | `specstride.ledger/1` | Annex B §B.13 (F100-FR-068, F100-FR-069) |
| Approval record | `specstride.approval/1` | Annex B §B.14 (F100-FR-070) |
| Terminal record | `specstride.terminal/1` | Annex B §B.15 (F100-FR-071) |
| Harness port, level `completion` in both forms; fresh sessions | `specstride.harness/1` | Annex C §C.1, §C.3 (F100-FR-076, F100-FR-083, F100-FR-087, F100-FR-088, F100-FR-230) |
| Resolved registry and role plan | `specstride.registry/1` | Annex C §C.6 (F100-FR-092) |
| Canonical spec model; `tick` | `specstride.spec-format/1` | Annex C §C.7 (F100-FR-095) |
| Check runner; result record of the verification gate; fixed-argv calls of the version-control tool (F101-FR-026, F101-FR-035) | `specstride.check-runner/1` | Annex C §C.8; annex E §E.4 |
| Quota classifier | `specstride.quota-classifier/1` | Annex C §C.13 (F100-FR-109) |
| Prompt block provider | `specstride.prompt-block/1` | Annex D §D.5 |
| Comparison of the tree at phase entry, as the place where the fingerprint of an approval record is read | `specstride.fact-block/1` | Annex D §D.7 (F100-FR-136) |
| Critic strategy and attempt planner | `specstride.critic-strategy/1`, `specstride.attempt-planner/1` | Annex E §E.1 (F100-FR-138, F100-FR-139, F100-FR-140) |
| Run-state machine; blocked reasons; lease at every boundary | `specstride.run-state/1` | Annex E §E.2 (F100-FR-144, F100-FR-147) |
| Stop-reason enumeration | `specstride.stop-reason/1` | Annex E §E.3 (F100-FR-148, F100-FR-149) |
| Exit codes of the engine; result records | — | Annex E §E.4 (F100-FR-151, F100-FR-153) |
| Lock and liveness provider | `specstride.lock/1` | Annex F §F.5 |
| CLI protocol: the command `run`; output modes | protocol 1 | Annex G §G.1, §G.2 |
| Event envelope | `specstride.event/1` | Annex X §X.1 |
| The one point of redaction; scan before a commit | `specstride.redaction/1` | Annex X §X.4 (F100-FR-205, F100-FR-206) |
| Canonical hasher | — | Annex X §X.5 |
| List of closed sets | — | Annex X §X.6, rows 5, 8, 251, 252, 255, 278; read: 28 (forms of the `completion` level), 183 (results of the diversity test) |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, rows 12, 13, 15, 17, 18, 19, 28, 39, 58, 92, 129, 133 |
| Layout table, alias table, component-name table | `specstride.oracle-normalization/1` | Annex X §X.8 |
| Threat model | — | Annex X §X.9: T-01, T-02, T-05, T-06, T-08, T-22, T-33; the controls are in the section "Threats" |

Fixture families of feature 141 used: FX-01 to FX-08, FX-13, FX-15, FX-21, FX-23, FX-27 (§O.2),
with the stubs P, CH, CC, D and V (§O.3) and the surfaces of the run set and `repository` (§O.4).

## Rows of the `parity` profile

Stated as F100-FR-212 asks.

| Switch | Key (as proposed; feature 110 owns the spelling) | Default | Under `parity` | Register row | Row of annex X §X.7 |
|---|---|---|---|---|---|
| The refusal of a start for ticked phases without an approval record | none; follows the approval record | on | off | DV-029 | 129 |
| A missing credential of the critic is a configuration error, found before the call (F101-FR-010, `assumption: CQ-187`) | none is proposed; feature 110 names a key if the switch gets one | on | off: a missing credential is a failed call, scored MALFORMED | DV-117 | 133 |

Rows this feature reads and does not own: 12 (block set of the proposer's prompt, for the prompt of an accelerated phase attempt), 58 (block set of the critic prompt, for the prompt of the diagnostician), 13 (counts survive a resume), 15 (check points of
staleness), 17 (compatibility projection), 18 and 19 (output mode; lines with no as-is
equivalent), 28 (transport and mode of the critic, which the diagnostician follows), 39 (quota
pause), 92 (line of the critic-diversity warning).

Options of the baseline that this feature carries. They are no new switches: their default is the
as-is default, and under `parity` they have the as-is default unless a fixture sets them.

| Option | Key (as proposed) | As-is variable or flag | Default |
|---|---|---|---|
| Reject limit | `loop.maxRejects` | `SPECSTRIDE_MAX_REJECTS`, `--max-rejects` | 3 |
| MALFORMED limit | `roles.critic.malformedLimit` | `SPECSTRIDE_CRITIC_MALFORMED_LIMIT` | 3; 0 switches it off |
| Threshold of oscillation | `loop.oscMax` | `SPECSTRIDE_OSC_MAX` | 2 |
| Time limit of a critic-class call | `roles.critic.timeoutSec` | `SPECSTRIDE_CRITIC_TIMEOUT`, `--critic-timeout` | 300 seconds |
| Diagnostician on or off | `roles.diagnostician.enabled` | `SPECSTRIDE_DIAGNOSTICIAN` | on |
| Accelerator on or off | `roles.accelerator.enabled` | `SPECSTRIDE_ACCELERATOR` | on |
| Harness of the accelerator | `roles.accelerator.harness` | `SPECSTRIDE_ACCELERATOR_BACKEND` | The proposer's |
| Ticking of tasks | `loop.tickTasks` | `SPECSTRIDE_TICK_TASKS` | on |
| Approval commit | `loop.gitCommits` | `SPECSTRIDE_GIT_COMMITS` | `auto` |
| Start phase | the flag `--start-phase` | `--start-phase` | derived |

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Members | Owner | Closed by | Unknown value | Row of annex X §X.6 |
|---|---|---|---|---|---|
| Verdicts | APPROVED, REJECTED, MALFORMED | 101 | Owner decision | MALFORMED | 8 |
| Terminal `cause` | `normal`, `crash`, `owner-lost` | 101 | Design | Read as `crash` | 5 |
| Terminal `causedBy` | `self`, `operator`, `supervisor`, `host`, `crash` | 101 | Design | Read as `crash` | 5 |
| Details of a MALFORMED verdict | `nonce-mismatch` (a verdict line is present, the nonce is missing or different), `no-verdict-line`, `multiple-verdict-lines`, `call-failed` | 101 | Design | Read as `call-failed`; the verdict stays MALFORMED | 251 |
| Cases of a diagnosis | `grounding`, `real_gap`, `unknown` | 101 | Design | `unknown` | 252 |
| What failed in an approval record | `schema`, `signature`, `key-unknown`, `verdict`, `evidence-hash`, `verification-hash`, `missing`, `marker-only`, `voided` | 101 | Design | The record counts as not approved | 255 |
| `outcome` of the record of a phase attempt (data-model.md) | `approved`, `rejected`, `malformed`, `gate-failed`, `config-error`, `no-verdict` | 101 | Design | Read as `rejected`; the verdict stays one of the three verdicts | 278 |

The kinds of a phase attempt (row 9) are read here and owned by the content owner of EP-18.

## Threats

Stated as F100-FR-216 asks. Feature 100, annex X §X.9, names this feature as an owner of six
threats. The requirement that is the control of each, and its test:

| Threat | What | Control | Requirements | Test |
|---|---|---|---|---|
| T-01 | A verdict line planted in phase evidence or in a grounded file | A nonce of 64 bits per call; the verdict is parsed only from the reply, as a whole line, with exactly one match; MALFORMED is the safe failure | F101-FR-006; F101-FR-007; F101-FR-008 | PT-101-028SC002-*; CT-101-10; CT-101-32 |
| T-02 | The proposer forges approval state (with 102 and 100) | The signed approval record in the control plane, with a key that no pass and no check can read; verified wherever it is read | F101-FR-029; F101-FR-030; F101-FR-031; F101-FR-032 | CT-101-13; CT-101-14; CT-101-15 |
| T-05 | The nonce is written before the call returns (with 111) | The nonce is never on disk, in an event or in a span before the return; afterwards events and the approval record hold its hash | F101-FR-006; F101-FR-038 | CT-101-7; PT-101-C-062-* |
| T-06 | Evidence makes the critic reply malformed until the run halts | MALFORMED stays the safe failure; the halt at the MALFORMED limit is a stop that is not retryable and is not relaunched | F101-FR-015; F101-FR-041 | PT-101-028FR010-*; CT-101-18 |
| T-08 | An injected critic reply reaches the next phase attempt through feedback (with 103 and 117) | The signature takes only task ids, or the hash of the text without verdict lines; outside the `parity` profile feedback and hint stand in the prompts of the recovery cycle as data; text of a reply passes the ingress | F101-FR-019; F101-FR-022; F101-FR-025; F101-FR-052 | CT-101-29; CT-101-33 |
| T-22 | An inner result is taken for a verdict (with 115 and 149) | A verdict comes from the reply of a critic call and from nothing else: a line in the form of a verdict in a ledger record, in a row of the fact block or in the result of an inner check approves nothing; the kind of a verdict is read from the verdict record; only the engine writes an approval record. The invariants against loop layers and the tripwire belong to the content owner of EP-18 | F101-FR-008; F101-FR-011; F101-FR-029 | CT-101-10; CT-101-32; PT-101-028SC002-* |

## As-is behaviour not carried

The traceability files assign no row to feature 101 with the disposition `superseded-by` or
`dropped`: of its 27 requirements and success criteria and its 157 behaviour items, all have a
kept disposition.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

Behaviour that is kept and changes its form, with the register row that says how it is compared:

| As-is behaviour | New form | Register row |
|---|---|---|
| The empty approval marker, written without an atomic rename where the proposer can write (B-0875); resume trusts its presence (B-0271) | The signed approval record in the control plane, verified wherever it is read | DV-029; DV-072 |
| Counts, the MALFORMED streak and the memory of the accelerator start again in every engine start (B-0306, B-0308, B-0309) | They continue in the ledger; `--reset-counts` restores the as-is behaviour | DV-011 |
| The oscillation window holds the feedback written since the engine start (B-0289) | The window is keyed by the sequence of phase attempts | DV-044 |
| The critic is a program of its own with an exit code (C-059, C-063) | A call inside the engine with a result record that carries the same number | DV-066; LR-6 |
| Lisa calls the critic first and verifies afterwards | The verification gate runs before the critic | DV-040 |

## Requirements moved to 149-attempt-planner-and-seams

The feature was split on 2026-09-29. Group G4 left. The old ids are never reused, so the
sequences of this feature have gaps: F101-FR-042 to F101-FR-051, F101-SC-001, F101-SC-006,
F101-SC-007, F101-SC-010, and CT-101-19 to CT-101-28.

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

No parity test moved, and no as-is id: every as-is requirement, success criterion and behaviour
item that the traceability files assign to this feature stays here.

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or
reused; F101-FR-052 and the tests CT-101-30 to CT-101-33 are appended.

| Requirement or place | Item | What changed |
|---|---|---|
| Table "Halts of the phase gate", row of exit 0 | W-101-01 | `retryable` is false where the exit has no stop reason (F100-FR-148) |
| F101-FR-009 | W-X-18 | The line `ep:` names EP-18 `specstride.critic-strategy/1` (consumes) |
| F101-FR-010 | CQ-187 (feature 141, follow-up) | A missing credential is a failed call under the `parity` profile and a configuration error outside it; the configuration errors are those found before the call; `assumption: CQ-187`; test CT-101-30 |
| F101-FR-017 | W-X-18 | The line `ep:` names EP-18 `specstride.attempt-planner/1` (consumes) |
| F101-FR-020 | W-101-02; W-X-17 | "no tools" became the form of the `completion` level of the entry of the role plan, with the proof recorded; the proposer's files are hidden for a diagnostician of the form `read-only-tools`; the critic-diversity rule and its warning are stated; test CT-101-31 |
| F101-FR-007, F101-FR-008 | W-101-03 | The line `test:` names the property test CT-101-32 |
| F101-FR-032 | W-X-03 (same fault, found while repairing) | The line `parity:` names row 129, which feature 100 granted |
| F101-FR-052 (new) | W-X-23 | Text of a critic-class call passes the one ingress before it is written to a line, a field of an event or a span; test CT-101-33 |
| F101-SC-003; user story 2 | Feature 141, follow-up | The table test maps each scenario by its end on the reference, not by its family |
| Section "Threats" (new) | W-X-22 | The six threats that annex X §X.9 assigns to this feature, each with its control and test |
| Table "Closed sets" | Found while repairing | The three sets of this feature have the rows 251, 252 and 255 of annex X §X.6 |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: How many bits does the verdict nonce have, given that the brief leaves a raise to 128 bits open? → A: 64 bits, written as 16 hexadecimal characters, as at the baseline. No register row. Integrated in F101-FR-006. (Source: `APPROVAL.md` ruling P16; F100-FR-139)
- Q: Does the verification gate or the critic run first? → A: The verification gate, on every phase attempt in mode `required`; on a failure the critic is not called. Integrated in F101-FR-005. (Source: `APPROVAL.md` ruling K1; `consolidation.md` C-01; DV-040)
- Q: What happens when every phase is approved already? → A: Release verification runs first and can end the run with exit 2; then exit 0. Lisa's immediate end is not carried. Integrated in F101-FR-003. (Source: brief 101 heading 3; `consolidation.md` C-10)
- Q: Is a later phase that is already approved run again when the run starts at an earlier phase? → A: Yes. The baseline does so, the defect policy preserves it (D-47), and no register row fixes it. Integrated in F101-FR-002. (Source: `consolidation.md` section 5.3, D-47; B-0337)
- Q: Is the last phase attempt archived when the reject limit halts the run? → A: No. It stays in place and is set aside at the next start of the phase; the defect policy preserves it (D-34). Integrated in F101-FR-014 and F101-FR-004. (Source: `consolidation.md` section 5.3, D-34, D-05; B-0336, B-0307)
- Q: Which stop reasons may this feature write? → A: Members of the closed enumeration only: `critic_config`, `critic_unavailable`, `gate_oscillation`, `max_rejects`, `release_verification`, and `stop_flag` for a lost owner. Lisa's `proposer_context_invalid` and `critic_protocol` are not admitted. Integrated in F101-FR-037. (Source: `APPROVAL.md` ruling K4; `consolidation.md` C-08, section 4.3)
- Q: Is a halt by the reject limit, the MALFORMED limit or oscillation the state `blocked-on-human`? → A: No. The closed set of blocked reasons of feature 100 holds none of them; such a halt is a stop that is not retryable. The halt banner still says that a person is needed. Integrated in F101-FR-041. (Source: feature 100 annex E §E.2; DV-067)
- Q: Which bindings of an approval record are verified on resume, given that the working tree may have changed since? → A: The signature, the verdict record, the hash of the phase evidence set aside in the control plane and the hash of the stored result of the verification gate. The fingerprint of the tree is compared at phase entry, where a difference is a fact and never blocks. Integrated in F101-FR-031. (Source: `APPROVAL.md` ruling 33; R23v IR-33; DV-077)
- Q: Which harness runs the diagnostician and the accelerator? → A: The diagnostician runs on the critic of the role plan, under the rules of a critic-class call; the accelerator runs on the proposer's harness unless the consumer configured another. Integrated in F101-FR-020 and F101-FR-025. (Source: B-0283, B-0073; feature 100 annex C §C.6, the roles of the registry)
- Q: Is the critic a command of the CLI? → A: No. Its codes are fields of a result record. Integrated in F101-FR-009. (Source: `APPROVAL.md` ruling 26; F100-FR-171; LR-6)
- Q: How many rows does the divergence register have? → A: 107 when this specification was written; the brief's figure of 85 is out of date. (Source: `consolidation.md` section 6)

### Session 2026-09-29 (speckit-clarify)

Five questions, answered from the sources; one of them left with the split, four are below. No question was put to a person.

- Q: Is feedback that the engine wrote after a failed verification gate treated like feedback of the critic by the recovery cycle and the oscillation halt? → A: Yes. It gives a signature, the diagnostician may run on it, and it is a record of the oscillation window. Integrated in F101-FR-017 and in the edge cases. (Source: B-0332, B-0105, B-1149; the engine script of the Specstride baseline at `9cab15d`, lines 1991 and 2189)
- Q: How many verdict records does a phase attempt have when a critic strategy makes several calls? → A: One, which holds the record of every call. With the one critic of Wave 1 there is one call. Integrated in F101-FR-012 and in the edge cases. (Source: feature 100 annex B §B.5, logical name `attempt:<N>:<k>:<n>:verdict`; annex E §E.1, "a critic strategy returns exactly one verdict record")
- Q: Are the steps after an approval run again when the engine ended between the approval record and those steps? → A: No. The phase counts as approved at the next start and the steps are not repeated, as at the baseline, where the marker alone decides. Integrated in F101-FR-033 and in the edge cases. (Source: B-0271, B-0326; Principle I: the position is derived from verified records)
- Q: Do the prompts of the diagnostician and of an accelerated phase attempt frame outside text as data, given that the oracle compares prompts in full? → A: Outside the `parity` profile, yes. Under it they are the as-is prompts. Neither prompt gets a switch of its own: the prompt of the diagnostician follows the block set of the critic prompt, the prompt of an accelerated phase attempt follows the block set of the proposer's prompt. Integrated in F101-FR-022 and F101-FR-025. (Source: F100-FR-221; F100-FR-131; register rows DV-100 and DV-094; rule N-24)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The readings of `feature-briefs.md` section D.8, "Where rulings meet", are used.
- The field lists of the approval record and of the terminal record are those of feature 100, annex B §B.14 and §B.15 (CQ-019). This feature adds no field to them.
- The grounding snapshot, the critic prompt and the fact block exist when the critic is called; this feature hands the demand for the verdict and the nonce to the assembler of the critic prompt and reads the reply.
- The spelling of every configuration key in this specification is a proposal; feature 110 owns the spelling.
- The signature scheme of the approval record is a matter of the plan. The specification asks only that a record cannot be made without the approval key.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-171 | What does the approval commit hold of the state? At the baseline the state directory lies in the working tree and is committed unless the project ignores it (B-0277). The control plane now lies outside the tree | The commit stages every change of the working tree, as at the baseline. The workspace part is in it unless the project ignores it; the control plane is not, because it is not in the tree. The oracle compares the content of the commit without the paths of state | F101-FR-035 |
| CQ-172 | Is the refusal of a start for ticked phases without an approval record active under the `parity` profile? The baseline starts such a run at the first phase without a marker | Off under the `parity` profile (row 129 of annex X §X.7) | F101-FR-032 |
| CQ-173 | May the verdict record and the feedback hold the nonce in clear after the call has returned? The baseline writes it into both (B-0876, B-0881), and the oracle compares both files; F100-FR-139 allows only the hash | Yes, in these two records only, which are written after the call has returned. Events, spans, the ledger and the approval record hold the hash only | F101-FR-012 |
| CQ-187 | Is a missing credential of the critic a configuration error (exit 3) or a failed call? The baseline scores it as a failed call: MALFORMED, and exit 1 at the MALFORMED limit (feature 141, follow-up report of 2026-09-29) | A failed call under the `parity` profile. Outside the profile it stays a configuration error that is found before the call, with exit 3: register row DV-117 and row 133 of annex X §X.7 | F101-FR-010 |
| CQ-174 | Which stop reason does the terminal record carry on an exit for which the enumeration has no member (an invalid argument or specification with exit 3, the refusal of F101-FR-032 with exit 3, a held lock with exit 5, an internal error with exit 1, an uncaught error with exit 70)? F100-FR-148 asks for a member on every exit other than 0; the baseline writes no stop line for these | No stop reason: the field is empty, the compatibility projection writes no stop line, and `retryable` is false | F101-FR-036 |
