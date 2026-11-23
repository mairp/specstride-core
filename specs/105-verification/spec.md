# Feature Specification: Verification

**Feature Branch**: `105-verification` (a label: Spec Kit creates no branch in this repository; the directory is `specs/105-verification`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 105-verification of Specstride: verification modes off, plan and required; the verification plan and its verification obligations; plan sources (EP-07); the frozen per-phase check manifest; the verification gate that runs every command before the critic and writes the feedback itself on failure; release verification; pre-staged and detached verification commands with their reuse rules; the failure summary; plan staleness at critic start under the parity profile only; the public verb verify."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 105-verification), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), `STAGE-B-SPLIT-PROMPT.md`, feature 100 (annexes B, C, D, E, G, X), feature 141 (§O.1 to §O.7), the traceability files, and the research reports R23, R23v, R27, R29 and R29v.

## What this feature is

A consumer declares how their project is verified: commands that build, check types, lint and
test. This feature finds those declarations, freezes them at launch, and runs them as the
verification gate of every phase attempt, before the critic is called. When a command fails, the
phase attempt is rejected without a critic call, and the engine writes the feedback itself. The
proposer's claim and the critic's judgment can never stand in for a command that failed.

**In scope**: the verification modes `off`, `plan` and `required` and what each does to a
verdict; the verification plan and its verification obligations; the plan sources; the frozen
check manifest of a phase and its derivation; the verification gate; release verification;
commands staged before the verification gate, detached ones included, and their reuse rules; the
failure summary; the staleness check of the plan at critic start, which stays under the `parity`
profile only; the public command `verify`.

The check runner, the step runner, the integrity rules with a loop layer off and concurrent
verification commands left this feature on 2026-09-29 (`## Requirements moved to 148-check-runner`).
This feature runs its commands through the check runner of feature 100, annex C §C.8.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Fingerprints, the protected set, toolchain profiles | 116; this feature consumes them through EP-16 and the logical name `phase:<N>:protected-set` |
| The check runner (EP-05), the step runner, concurrent verification commands, result conditions | 148; consumed through feature 100, annex C §C.8 |
| Inner checks and the closing check as decisions of the loop layer | 115 |
| The wait on a detached job of a yield; the first-failure predicate | 118 |
| Verification plans bound to a spec bundle | Roadmap |
| Which verification mode the derivation of a launch contract sets | 107 |
| The obligations index in the proposer's prompt | 103 |
| The comparison of source hashes at launch, at resume and at every pass start | 102, 103; the hasher is 104's (feature 100, annex X §X.5) |
| Parallel units and their merge check | 142 |
| Where declared reads and writes of a verification command may come from | 107, in the launch contract (feature 100, annex G, `configuration.scopes`); never the verification-commands document (F105-FR-016) |
| The slot of the fact block in the critic prompt and its escaping | 117 |
| The event types and their fields; the spelling of config keys | 111; 110 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A failed command rejects a phase before any critic is asked (Priority: P1)

A consumer runs a feature in the verification mode `required`. After the proposer has delivered
phase evidence, the runtime runs every declared command of the phase. One fails. The phase attempt
is rejected, the critic is not called, and the feedback the proposer reads next names the command,
its exit code and the end of its output.

**Why this priority**: It is the deterministic half of the phase gate. Without it the verdict rests
on text alone.

**Independent Test**: With stub agents and scripted verification commands (feature 141, §O.2,
FX-14), run one phase whose command fails once and then passes. The critic transcript holds one
call, the first phase attempt has a feedback file written by the engine, and the run ends with
exit 0.

**Acceptance Scenarios**:

1. **Given** the mode `required` and a phase with two declared commands of which the first fails, **When** the verification gate runs, **Then** both commands run, the result names the first as failed, the critic is not called for that phase attempt, and the reject count rises by one (F105-FR-005, F105-FR-032).
2. **Given** a failed verification gate, **When** the engine writes the feedback, **Then** the feedback starts with the as-is heading, holds the failure summary and ends with the as-is closing sentence (F105-FR-006).
3. **Given** the mode `plan`, **When** a phase attempt reaches the phase gate, **Then** the verification gate runs no command, the critic receives the verification obligations as criteria, and the verdict is the critic's alone (F105-FR-003).
4. **Given** the mode `off`, **When** a run starts, **Then** no verification plan is written, no command runs and the critic receives no verification obligations (F105-FR-003).
5. **Given** a value of the mode other than `off`, `plan` or `required`, **When** a run is started, **Then** it ends with exit 3 and the as-is message (F105-FR-001).

---

### User Story 2 - Declared verification is found and frozen, never invented (Priority: P1)

A consumer has a verification-commands document, or commands written literally in the plan or the
task list, or a toolchain whose entry points can be discovered. At launch the runtime gathers them
through the plan sources, writes the verification plan with its hash, and derives one check
manifest per phase. Nothing adds a command afterwards.

**Why this priority**: Every later check rests on the frozen set. A guessed command, or a set that
changes during a run, makes every result doubtful.

**Independent Test**: Run the conformance suite of EP-07 on three fixtures: declared commands,
two declarations that disagree, and no declaration. The first gives a manifest with provenance per
entry, the second a blocker, the third an explicitly empty manifest.

**Acceptance Scenarios**:

1. **Given** a phase without any declared command, **When** the manifest is derived, **Then** its list of entries is empty, no command is generated, and a check of that phase gives the condition `unchecked` (F105-FR-020; feature 100, annex C §C.8).
2. **Given** two declarations of one command id that disagree, **When** the plan is derived, **Then** a blocker is reported and no plan is written in the mode `required` (F105-FR-015, F105-FR-019).
3. **Given** a command that cannot be written as a fixed argument list, **When** a source reports it, **Then** it is a blocker and never a guess (F105-FR-015).
4. **Given** a relaunch that derives a manifest different from the stored one, **When** the run continues, **Then** the difference is announced and recorded, the stored manifest applies, and every critic of the run receives the fact (F105-FR-021).

---

### User Story 3 - A release is verified as a whole (Priority: P2)

After the last phase is approved, the runtime runs the release verification: every command of
every phase. A failure ends the run with exit 2 and the stop reason `release_verification`.

**Why this priority**: A phase gate covers the phases up to its own. Only the release verification
covers commands that are not cumulative.

**Independent Test**: Feature 141, §O.2, FX-15: `release-verification-fails` and
`release-verification-passes`.

**Acceptance Scenarios**:

1. **Given** the mode `required` and all phases approved, **When** release verification fails, **Then** the run ends with exit 2, the stop reason `release_verification` and the result record named in the log (F105-FR-008).
2. **Given** a run in which every phase was approved earlier, **When** it is started again in the mode `required`, **Then** release verification runs on that path too (F105-FR-008).

---

### User Story 4 - Long commands are staged before the verification gate (Priority: P2)

A consumer declares a long command with the stage `prestage`. The runtime runs it before the phase
attempt, detached where declared, and the verification gate takes its result over only when the
tree it ran on is provably the tree of the verification gate.

**Why this priority**: It is today's only reuse rule, and parity binds it.

**Independent Test**: Feature 141, §O.2, FX-16: `pre-staged-reused`, `pre-staged-stale`,
`long-job-running`, `long-job-finished`.

**Acceptance Scenarios**:

1. **Given** a passed and completed result of a command staged before, the same plan hash, the same revision and a clean working tree in both records, **When** the verification gate runs, **Then** the result is taken over and marked as reused with its origin (F105-FR-033).
2. **Given** any of these conditions not met, **When** the verification gate runs, **Then** the command is executed (F105-FR-033).
3. **Given** a command staged before that fails, **When** the phase attempt starts, **Then** the run does not halt (F105-FR-034).

---

### User Story 5 - An operator uses `verify` by hand (Priority: P3)

An operator creates, validates and runs a verification plan with the public command `verify`,
and reads the exit code.

**Why this priority**: The owner ruled that `verify` is public (ruling 26). Scripts of operators
match its codes.

**Independent Test**: For each sub-command of `verify`, a fixture of FX-14 to FX-16 compares
`exit`, `stdout` and `stderr` with the reference.

**Acceptance Scenarios**:

1. **Given** a valid plan, **When** the operator runs the validation, **Then** the output is `valid` and the exit code is 0 (F105-FR-039).
2. **Given** a plan whose hash does not match its content, **When** any sub-command loads it, **Then** the exit code is 3 and the message names the hash mismatch (F105-FR-013).
3. **Given** a verification gate that failed, **When** `verify run` ends, **Then** the exit code is 10 (F105-FR-039).

---

### Edge Cases

- The verification-commands document is missing or has zero bytes: exit 3 with the as-is message (F105-FR-002).
- A directory for test scaffolds is given while the mode is `off`: the mode becomes `plan` without a message (F105-FR-002).
- The mode is `required` and a phase has no command that can run: the verification gate of that phase fails with the as-is summary (F105-FR-018).
- The spec changed during a run under the `parity` profile: in the mode `plan` the critic call ends with result code 3 as at the baseline; in the mode `required` the verification gate meets the stale plan first and the phase attempt is rejected without a critic call (F105-FR-042, F105-FR-005). Outside the profile no critic call is refused for a stale plan and the verification gate makes no staleness check.
- The result record of a verification gate exists with other content: the write is refused (F105-FR-009).
- A command fails to start or runs over its time limit: the check runner returns the error (feature 100, annex C §C.8), and at the verification gate the command counts as failed (F105-FR-032).
- The verification-commands document gives `reads` or `writes` for a command: the field is ignored with a finding, and the command runs alone (F105-FR-016).
- A detached command staged before passes its deadline: it is reported as `deadline_exceeded` and is not killed (F105-FR-035).
- The verification gate cannot run, for example because the stored plan fails its hash check: the phase attempt is rejected as for a failed command, and the event carries the code 3 of the verification gate (F105-FR-005).
- A command is declared with the stage `pre`: it is stored and treated as `prestage` (F105-FR-016).
- A unit of work was declared in the phase attempt: the verification gate takes over no staged result and executes every command (F105-FR-033).

## Requirements *(mandatory)*

Every requirement follows `STAGE-B-RULES.md` section 4. Notes for this feature:

| Note | Content |
|---|---|
| `origin:` | Names the cluster and the behaviour items of the cluster that the requirement states. A cluster is carried by all requirements that name it together; the table "As-is ids carried" shows that every item is placed |
| `disposition:` | The disposition of the traceability files. Where a requirement carries items of two dispositions, both are written, with the items of the second |
| `test:` | A requirement with an origin names the parity tests of the traceability files, `PT-105-<cluster>-*`. A new requirement names `CT-105-<n>`, where n is 100 plus the number of the requirement. `CT-105-1` is the characterization test of the traceability files. `CT-105-2` is the characterization test of the parts extracted from Lisa. `CT-105-301`, `CT-105-302`, `CT-105-304`, `CT-105-305` and `PT-105-028FR020-suite` are the tests of the success criteria (tasks T137 to T141) |
| Gaps | The numbers 026 to 031, 038, 040, 041, 044 and 046 to 052 are not used: those requirements moved and their ids are never reused |
| As-is literals | Messages, headings and field names of the baseline are written as literals, because compatibility output reproduces them byte for byte. A prefix that named an implementation file is the logical component name `verification` or `engine` (feature 100, annex X §X.8) |
| Result record | The record that the baseline calls the evidence of a verification gate is written "result record of the verification gate", so that "phase evidence" keeps its one meaning |

### Functional Requirements

#### G1 — Modes, order, and release verification

- **F105-FR-001**: The verification mode MUST be one of the closed set `off`, `plan`, `required`, with the default `required`. It MUST be settable by the flag `--verification` and by configuration, with the as-is variable as an alias, and the flag MUST win. Any other value MUST end the start of a run with exit 3 and the message `--verification must be off, plan, or required (got: <value>)` after the component name.
  - origin: 028 FR-020; C-006; B-0021; C-007; B-0051; C-009; B-0112
  - disposition: ported; translated (B-0051)
  - test: PT-105-028FR020-modes; PT-105-C-006-flags; PT-105-C-007-variables; PT-105-C-009-invalid-mode
  - divergence: DV-043; DV-027
  - parity: as the fixture sets it; the default is `required` on both sides (row 123 of annex X §X.7)

- **F105-FR-002**: The consumer MUST be able to set, by flag and by configuration with the as-is variables as aliases: the place of the verification plan for people, the verification-commands document, and the directory for test scaffolds. Unless the mode is `off`, the plan for people MUST default to `testautomation/<slug>/TEST_PLAN.md` and the scaffolds to `testautomation/<slug>/generated`, both under the working directory. A scaffold directory that is not absolute MUST end the start with exit 3. A plan place that is relative MUST end the start with exit 3, and this check MUST be skipped when the mode is `off`. A relative place of the verification-commands document MUST be resolved against the directory of the launch, and the document MUST be read only when the mode is not `off`; a missing or empty document MUST end the start with exit 3 and the message `--verification-commands not found or empty: <path>`. A scaffold directory given while the mode is `off` MUST change the mode to `plan` without a message.
  - origin: C-006; B-0022; B-0023; B-0024; C-007; B-0052; B-0053; B-0054; C-009; B-0113; B-0114; B-0121; C-011; B-0158; B-0159; C-013; B-0238; B-0268
  - disposition: ported; translated (B-0052, B-0053, B-0054, B-0158, B-0159)
  - test: PT-105-C-006-flags; PT-105-C-007-variables; PT-105-C-009-path-errors; PT-105-C-011-default-places; PT-105-C-013-upgrade-off-to-plan
  - divergence: DV-006; DV-027
  - parity: as the fixture sets them; defaults as at the baseline (row 124 of annex X §X.7)

- **F105-FR-003**: Each mode MUST act on a verdict as follows. `off`: no verification plan is written, no verification obligation reaches a prompt, no command runs, and the critic receives no plan. `plan`: the plan is written, the verification obligations of the phase become criteria of the critic, the verification gate executes no command, and the verdict is the critic's alone; the commands staged before still run before each phase attempt (F105-FR-034), for information only, as at the baseline. `required`: as `plan`, and in addition the verification gate runs before the critic on every phase attempt and release verification runs at the end. Only the mode `required` MUST mark the verification gates of the plan as required.
  - origin: C-013; B-0322; B-1150; B-1146
  - disposition: ported
  - test: PT-105-C-013-mode-effects
  - divergence: DV-043

- **F105-FR-004**: Unless the mode is `off`, the verification plan MUST be derived before the first phase attempt, from the working directory, the spec in its detected or forced format, and the verification-commands document where one is given; the scaffold directory MUST be passed whenever it is set. When the derivation fails, the start MUST end with exit 3 and the message `verification preflight failed (see <log>)`, where the log is named by logical name in default output, and the output of the derivation MUST go to the engine log only.
  - origin: C-013; B-0267; C-009; B-0122; C-010; B-1140
  - disposition: ported
  - test: PT-105-C-013-plan-before-loop; PT-105-C-009-preflight; PT-105-C-010-preflight-halt

- **F105-FR-005**: In the mode `required` the verification gate MUST run on every phase attempt after phase evidence exists and before the critic is called. The verification gate MUST count as failed whenever it ends with a result code other than 0: when a command failed (code 10), and when the verification gate could not run, for example because the plan is refused when it is loaded (code 3, F105-FR-013). When it fails, the phase attempt MUST be a rejection with the result code 10, whichever of the two codes the verification gate gave; the critic MUST NOT be called for that phase attempt, and the rejection MUST count toward the reject limit. The field `rc` of the event rendered as `verification_failed` (F105-FR-007) MUST hold the code of the verification gate itself. When it passes, the critic is called as the contract of the critic strategy says (feature 100, annex E §E.1).
  - origin: C-013; B-0319; B-0320
  - disposition: ported
  - test: PT-105-C-013-gate-before-critic; PT-105-C-013-gate-failure-counts
  - divergence: DV-040
  - ep: EP-18 `specstride.critic-strategy/1` (consumes)

- **F105-FR-006**: On a failed verification gate the engine MUST write the feedback of the phase attempt itself, under `attempt:<N>:<k>:<n>:feedback`. The feedback MUST start with `# Phase <N> deterministic verification gate rejected`, MUST hold the failure summary under `## What actually failed`, MUST name the plan and the result record under `## References`, and MUST end with `The phase cannot be approved solely from the proposer or critic claim.` When the failure summary cannot be produced, the section MUST hold `(failure digest unavailable — read the evidence document below)`.
  - origin: C-011; B-0182; B-1144; C-012; B-1145
  - disposition: translated (B-0182, B-1144); ported (B-1145)
  - test: PT-105-C-011-synthetic-feedback; PT-105-C-012-summary-unavailable
  - divergence: DV-006

- **F105-FR-007**: Around every run of the verification gate the engine MUST emit events that the compatibility projection renders as the as-is events `verification_start` (fields `phase`, `attempt`, `plan`), `verification_passed` (`phase`, `attempt`, `evidence`) and `verification_failed` (`phase`, `attempt`, `rc`, `evidence`), and after a passed release verification as `verification_release_passed` (`evidence`). The engine log MUST hold the line `----- verification: phase <N> attempt <M> (fixed argv) -----` before the verification gate of a phase attempt. The component that runs the commands MUST emit none of these four events itself.
  - origin: C-008; B-0087; B-0099; B-0100; B-0101; B-1136; B-1137; B-1138; B-1139; C-012; B-0222; C-080; B-1135
  - disposition: translated (C-008); ported (B-0222, B-1135)
  - test: PT-105-C-008-gate-events; PT-105-C-012-gate-log-lines; PT-105-C-080-no-events-from-runner
  - divergence: DV-007
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F105-FR-008**: Release verification MUST run only in the mode `required`, after the last phase is approved, and also on the path where every phase was approved before the run started. It MUST run the verification gate `GATE-release` of the plan, which holds every verification obligation and every command. The engine log MUST hold `----- verification: release gate (fixed argv) -----` before it. When it ends with a result code other than 0, whether a command failed or the verification gate could not run, the log MUST hold `# HALT — release verification failed (exit <rc>).` and `#   evidence: <path>`, the run MUST end with exit 2, and the stop reason MUST be `release_verification` with the fields `rc` and `evidence`. The result MUST be written under `run:<runId>:verification:release`.
  - origin: C-013; B-0274; C-009; B-0124; C-010; B-0140; B-1141; C-012; B-0202; B-0203; C-011; B-0172; B-1142; C-080; B-1106
  - disposition: ported; translated (B-0172, B-1142)
  - test: PT-105-C-013-release-verification; PT-105-C-009-release-exit; PT-105-C-010-release-stop-reason; PT-105-C-012-release-log-lines; PT-105-C-011-release-record; PT-105-C-080-release-gate
  - divergence: DV-006

- **F105-FR-009**: The result record of the verification gate of a phase attempt MUST be written once, under `attempt:<N>:<k>:<n>:verification`, and the verification plan of the run under `run:<runId>:verification:plan`. The record MUST hold `planId`, `planHash`, `gateId`, `phase`, `passed`, `sourceRevision`, `commands`, `buildArtifacts` and `summary`. Each entry of `commands` MUST hold `commandId`, `declaredId`, `source`, `executable`, `args`, `env`, `cwd`, `exitCode`, `signal`, `durationMs`, `stdout`, `stderr` and `passed`. Beside these as-is fields an entry MUST hold `reused` and `reusedFrom` when its result was taken over (F105-FR-033), and each condition that the check runner returned, in a field of its own (F105-FR-032; feature 100, annex C §C.8); an entry without a condition holds no such field, so that under the `parity` profile the record has the as-is fields only. A second write with other content MUST be refused.
  - origin: C-011; B-0160; B-0181; B-1143; C-078; B-1071; C-080; B-1123; B-1134
  - disposition: translated (C-011, C-078); ported (B-1123, B-1134)
  - test: PT-105-C-011-result-records; PT-105-C-078-write-once; PT-105-C-080-record-fields
  - divergence: DV-006

- **F105-FR-010**: In a run whose verification gate does not execute (mode `plan` or `off`) the verification mode in force MUST be in the run snapshot (`run:<runId>:snapshot`, key `verification.mode`), from which the loop layer takes its fallback with the reason `gate-not-executing`. The mode in force is the mode after the change of F105-FR-002 (a scaffold directory given while the mode is `off`): the resolution of the mode that this feature gives to the command line MUST apply that change before the run snapshot is written, so that the snapshot holds `plan`. The reading of the key for the fallback belongs to the owner of the loop layer. This feature MUST NOT write the run record, and MUST NOT switch a loop layer on or off.
  - test: CT-105-110
  - divergence: DV-053
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

#### G2 — Plan, verification obligations, plan sources, manifest

- **F105-FR-011**: The verification plan MUST be a record with `id`, `kind` (`verification-plan`), `version` (1), `source`, `project`, `obligations`, `commands`, `suites`, `gates`, `assumptions`, `ambiguities`, `unsupportedCapabilities`, `declaredCommands` where a document was given, and `contentHash`. `contentHash` MUST be the SHA-256 hash of the plan without that field, written as text with sorted keys, compact separators, non-ASCII characters kept and no final line end, as at the baseline (B-1108). The hash of the projection (F105-FR-012) and `project.fingerprint` MUST be formed over the same text form of their records. Every hash and every id of this requirement and of F105-FR-012 MUST be computed with the operation "content hash of a text" of the canonical hasher (feature 100, annex X §X.5, F100-FR-207), over the same text as at the baseline. The operation "canonical record hash" of that annex ends its text with a line end; it MUST NOT be used for them, because on the same input it gives another hash than the baseline, and the fixtures compare these hashes unchanged (rule "Hash, same class" of the normalization contract). The id of a verification obligation MUST be `VO-` and the id of a command `CMD-`, each followed by 20 hexadecimal characters of a hash: for an obligation over the id of the spec bundle, the phase, the index and the text of the criterion. `source.bundleId` MUST be a deterministic id of 26 characters derived from the place of the spec, its format and its hash. `project.fingerprint` MUST be a hash over the working directory and the content hashes of the root files of the toolchains, as at the baseline. `sourceRevision` MUST record `available`, `revision`, `workingTreeDirty` and `capturedAt`, or `available: false` with a `reason` when there is no repository.
  - origin: C-078; B-1063; C-080; B-1081; B-1082; B-1094; B-1097; B-1108
  - disposition: translated (B-1063); ported (C-080)
  - test: PT-105-C-078-plan-record; PT-105-C-080-ids-and-hashes
  - divergence: DV-006

- **F105-FR-012**: The verification plan MUST be bound to the hashes of its sources, frozen at launch and stored in the control plane. The hash of the spec MUST be taken over a projection that holds the format, the phase numbers and titles in order, and the text of the criteria without the checkbox, so that ticking a task or editing prose around it does not change it. The projection MUST be the record of the baseline, named `tasks-v2` in `source.projection`: `projection`, `format` and `phases`, each phase with `n`, `title` and `criteria`. It MUST be built from the canonical spec model (EP-03) and from no reading of the spec of this feature's own, and hashed in the text form of F105-FR-011. A plan without a named projection MUST be checked by the older rule of the baseline; a plan whose projection name is unknown MUST be refused with `unsupported source projection`. The place, the content hash, the schema version, the number of commands and the phases of the verification-commands document MUST be inside the hashed body of the plan, so that a change of the document invalidates the plan.
  - origin: C-080; B-1095; B-1107; B-1112; B-1113
  - disposition: ported
  - test: PT-105-C-080-source-binding
  - ep: EP-07 `specstride.verification-source/1` (implements); EP-03 `specstride.spec-format/1` (consumes)

- **F105-FR-013**: A verification plan MUST be validated whenever it is loaded. It MUST have the kind `verification-plan` and the version 1, an absolute working directory, an absolute place of the spec, and an absolute executable and working directory on every command; the place of the plan itself MUST be absolute. A recorded `contentHash` that differs from the computed one MUST refuse the plan with `verification plan hash mismatch`. A `source.specPath` that differs from the real path of the given spec MUST refuse it with `verification plan source mismatch`. Every refusal MUST be a verification error with the code 3.
  - origin: C-080; B-1109; B-1110; B-1111; B-1115
  - disposition: ported
  - test: PT-105-C-080-plan-validation

- **F105-FR-014**: The plan MUST hold one verification obligation per criterion of a phase; a phase without criteria MUST get one from its title, or `Complete phase <N>`. A verification obligation MUST be of the kind `effect-witness` and the level `integration` when the title of the phase or the criterion holds a verb of change from the as-is list, and otherwise of the kind `positive` and the level `contract`. Each MUST hold `acceptanceRefs` of the form `phase-<N>-criterion-<i>`, `oracle`, `witnesses`, `negativeCases` and `automationStatus`, which is `planned` when a discovered test command exists and `manual` otherwise.
  - origin: C-080; B-1077; B-1098; B-1099
  - disposition: ported
  - test: PT-105-C-080-obligations
  - ep: EP-07 `specstride.verification-source/1` (implements)

- **F105-FR-015**: Verification commands MUST come from plan sources behind the one interface of EP-07, and from nowhere else. Wave 1 MUST ship four sources: the verification-commands document; commands declared literally in the plan or the task list; discovery of the entry points of a toolchain for build, type check, lint and test (F105-FR-017 lists the entry points of Wave 1 as the baseline has them; a further one, such as a type check, enters as a row of the data); the inventory of the launch contract, which its owner delivers through the same interface. Every command MUST carry its provenance (file and line). A command declared literally in the plan or the task list MUST get the repository root as its working directory and, as its time limit, that of the entry point of F105-FR-017 whose kind it runs, else 1800 seconds; the launch contract's derivation writes these values into the verification-commands document it stores for the feature. A command that cannot be written as a fixed argument list, and two declarations that disagree, MUST be blockers and never a guess. A blocker MUST be recorded among the `ambiguities` of the plan with its provenance, and the command it concerns MUST NOT enter the plan: so the mode `required` refuses the launch (F105-FR-019), and the mode `plan` lists the blocker in the plan for people (F105-FR-022). A source that fails MUST contribute nothing and MUST be reported as a finding; in the mode `required` a phase that a failed source leaves without commands MUST refuse the launch. A source MUST read and never write.
  - test: CT-105-115
  - ep: EP-07 `specstride.verification-source/1` (implements); EP-03 `specstride.spec-format/1` (consumes)

- **F105-FR-016**: The verification-commands document MUST be a record with a list `commands` that is not empty and the optional fields `schema_version`, `discovery` and `phaseTimeouts`; its place MUST be absolute when it is loaded. A command MUST have `id` (text, not empty), `phase` (a positive whole number), `executable`, `cwd` (an absolute directory that exists) and `timeoutSec` (a positive whole number); `args` is a list of text and `env` a map of text to text. The optional fields MUST be `stage` (`gate`, `pre`, `prestage`, `both`; default `gate`; `pre` is a spelling of `prestage` and MUST be stored as `prestage`, so that every rule for `prestage` holds for it), `reportPath`, `reusePolicy` (`per-attempt`, `per-phase`, `per-run`; default `per-attempt`), `detached`, `cumulative` (default true), `kind` (default `verify`) and `label`, and, with no as-is equivalent, the declarations that the check manifest carries (feature 100, annex D §D.8): `steps` and `resource`. The document is repository text: it MUST NOT declare the reads, the writes or the side effects of a command. A field `reads`, `writes` or `sideEffects` of a command in the document MUST be ignored with a finding that names the command and the line, and the command MUST count as undeclared, which means that it runs alone. Any other field that this requirement does not name MUST be ignored with a finding (feature 100, annex C §C.9, unknown-value rule). A bare name of an executable MUST be resolved on the search path when the plan is derived, and a name that cannot be resolved or run MUST be refused. A repeated id, a phase the spec does not define, and `detached: true` on a command of the stage `gate` MUST be refused. `discovery` MUST accept only `none`, which removes every discovered command. Declared commands MUST run after discovered ones, in the order of the document. `phaseTimeouts` MUST supply declared ceilings of a pass per phase; a document that cannot be read for them MUST be treated as holding none.
  - origin: C-078; B-1062; C-080; B-1079; B-1083; B-1084; B-1085; B-1086; B-1087; B-1096; B-1101; C-013; B-0269
  - disposition: translated (B-1062); ported (C-080, B-0269)
  - test: PT-105-C-078-commands-document; PT-105-C-080-declared-commands; PT-105-C-013-phase-timeouts; CT-105-116
  - assumption: CQ-190 (repository text declares no reads and writes of a verification command); CQ-216 (the document may declare `steps` and `resource`). Both closed on 2026-09-30 on the recommended answer
  - ep: EP-07 `specstride.verification-source/1` (implements)

- **F105-FR-017**: Discovery of toolchain entry points MUST give, as at the baseline: for a Node project the scripts `test`, `build`, `lint` and `format:check` with the time limits 1800, 1800, 900 and 900 seconds, through the package manager the project names, else the one its lock file shows, else the default one, with the argument form of that manager; for a Python project that names its test runner, one test command with 1800 seconds; for a Rust project and for a Go project, one test command each with 1800 seconds. A manager or interpreter that is not on the search path MUST be recorded as an ambiguity and not as an error. When no test command is found the plan MUST record the as-is ambiguity; it MUST be removed only when every phase has at least one declared command, and otherwise a second ambiguity MUST name the phases without one. The suite of a phase MUST hold every discovered test command, and the discovered build command only when the title or the criteria of the phase hold a word of the as-is list of build words. The list of toolchains is data and MUST be open to further rows.
  - origin: C-080; B-1078; B-1088; B-1089; B-1090; B-1091; B-1092; B-1093; B-1100; B-1105
  - disposition: ported
  - test: PT-105-C-080-discovery
  - ep: EP-07 `specstride.verification-source/1` (implements); EP-16 `specstride.toolchain/1` (consumes)

- **F105-FR-018**: Every phase MUST get the suite `SUITE-phase-<N>` and the verification gate `GATE-phase-<N>`. The obligations and suites of a verification gate MUST be cumulative over the phases 1 to N, and `cumulative` MUST be false only for the first phase. A command declared with `cumulative: false` MUST be excluded from the verification gate of every other phase and MUST still run at its own phase and at release verification. The `required` flag of every verification gate MUST follow the mode. A phase without a verification gate in the plan MUST fail with the id `missing-<phase>-gate` and the summary `No verification gate exists for <phase>`, and MUST give an empty phase context. A required verification gate with no command that can run MUST fail with `Required gate <id> has no safe executable verification commands`; a verification gate that is not required and has none MUST pass.
  - origin: C-080; B-1102; B-1103; B-1104; B-1116; B-1131; B-1132
  - disposition: ported
  - test: PT-105-C-080-suites-and-gates

- **F105-FR-019**: In the mode `required` a plan with any ambiguity MUST NOT be written. The derivation MUST fail with `required verification is blocked: <ambiguities>` and the code 3.
  - origin: C-077; B-1059; C-075; B-1051
  - disposition: ported (B-1059); translated (B-1051)
  - test: PT-105-C-077-required-blocked; PT-105-C-075-required-flag

- **F105-FR-020**: One check manifest per phase MUST be derived at launch from the verification plan and from nothing else, with the fields of feature 100, annex D §D.8, and stored under `phase:<N>:manifest` with its hash, which MUST be the canonical record hash of the hasher (feature 100, annex X §X.5). Its entries MUST be the commands of the phase itself, that is, of the suite `SUITE-phase-<N>` of the plan (F105-FR-018), in the order of the plan; the commands of earlier phases are in the manifests of those phases. Where manifests are written, the verification gate of a phase, which is cumulative, MUST take its commands from the manifests of the phases whose suites it names, less the commands it excludes, so that it selects the same commands as from the plan. Every entry MUST be derived with `inner` true: the inner check set of a phase is its manifest, and only the runtime takes a command out of that set, with a reason, during a phase attempt. The `pin` of an entry MUST be the identity record that the operation `pin` of the check runner returns at launch (feature 100, annex C §C.8), and `searchPath` the search path for executables as it was at launch. A phase without commands MUST have a manifest whose list of entries is explicitly empty; no command MUST ever be generated for it. Declared reads and writes of a command MUST be put into the manifest only from a declaration of the launch contract (feature 100, annex G, `configuration.scopes`) whose recorded provenance is user configuration, the environment or a flag; a declaration from repository text, and one without that provenance, MUST NOT enter the manifest, so that the entry has no `reads` and no `writes` and is undeclared, which means serial (feature 100, annex D §D.8; F100-FR-099). Steps and exclusive resources MUST be read at launch from the plan sources and MUST be part of the manifest. Nothing MUST add an entry after launch. The manifest MUST be written when the loop strategy is not `classic` or when one of the switches of rows 6, 7, 31 or 33 of the `parity` profile (feature 100, annex X §X.7) is on; otherwise the verification gate MUST take its commands from the verification plan as at the baseline.
  - test: CT-105-120
  - divergence: DV-052
  - parity: no manifest file exists (rows 1, 6, 7, 31 and 33 of annex X §X.7, as F100-FR-137 names them)
  - assumption: CQ-153 (when the manifest is written in a run with the loop strategy `classic` outside the `parity` profile); CQ-190 (where declared reads and writes may come from). Both closed on 2026-09-30 on the recommended answer

- **F105-FR-021**: On a relaunch, and on a `resume`, of a feature that has a stored manifest, the manifest derived anew MUST be compared with the stored one. A command that was removed or changed MUST be announced at launch and recorded, the stored manifest MUST apply, and the fact MUST be contributed to the fact block of every critic call of the run, as the member "a check manifest that a relaunch derived differently" of the further facts. Where `resume` accepts an intended change of a source (feature 100, annex G, F100-FR-173), this feature MUST derive the plan and the manifests again and store them in place of the old ones.
  - test: CT-105-121
  - divergence: DV-078; DV-091
  - parity: off (row 33 of annex X §X.7)

- **F105-FR-022**: The verification plan for people MUST start with the line `<!-- specstride-verification-plan content-hash: <hash> -->` and MUST hold the sections Provenance, Coverage obligations, Phase gates, Effect-witness policy, Automated commands, and Ambiguities and blockers. The section Provenance MUST name the hash of the plan and the hash of the source. It is written under `feature:<slug>:verification:test-plan`.
  - origin: 002 FR-038; C-078; B-1060
  - disposition: merged-with 028 FR-020; translated (B-1060)
  - test: CT-105-1; PT-105-C-078-plan-for-people
  - divergence: DV-006

- **F105-FR-023**: Every file this feature writes into the working directory MUST have an absolute place inside the real working directory and MUST NOT be a symbolic link; otherwise the write MUST be refused with `verification output escapes the authorized workdir` or the as-is message for a link. An existing file with other content MUST be replaced only when it starts with the expected marker of generation, and otherwise the write MUST be refused with `refusing to overwrite a non-generated or changed artifact`. Writes MUST be atomic, with a temporary name in the target directory and a rename; a file with the same content MUST be left untouched.
  - origin: C-078; B-1061; B-1064; B-1065
  - disposition: translated
  - test: PT-105-C-078-safe-writes
  - divergence: DV-006; DV-072

- **F105-FR-024**: Where a scaffold directory is set, the derivation MUST write test scaffolds: for the test runners the baseline knows, one file with one test per verification obligation that is marked as to do or as skipped; and always a list of the scaffolds with the kind `verification-test-scaffold` and the version 1 that names every verification obligation. The phase context MUST state that a scaffold is never passing evidence. They are written under `feature:<slug>:verification:scaffolds`.
  - origin: C-078; B-1066; B-1067; B-1068; C-080; B-1119; C-075; B-1052; C-074; B-1040
  - disposition: translated; ported (B-1119)
  - test: PT-105-C-078-scaffolds; PT-105-C-080-scaffold-notice; PT-105-C-075-scaffold-flag; PT-105-C-074-scaffold-command
  - divergence: DV-006

- **F105-FR-025**: This feature MUST render the phase context that prompts receive. It MUST start with `## Verification obligations`, `Canonical verification plan: <id>`, `Verification plan hash: <hash>` and `Source semantic hash: <hash>`. The verification obligations of the current phase MUST be rendered in full; those of earlier phases MUST be one line each under the as-is heading. It MUST list every command of the cumulative verification gate under `### Commands this phase's gate will execute`, with the environment, the working directory and the time limit, without regard to excluded commands. Where a record of commands staged before exists for the phase, the phase context MUST end with the block of those commands (F105-FR-039, `prestage-report`), after an empty line; without such a record nothing MUST be added. For the public command the directory of the records defaults to the directory of the plan, as at the baseline. Which prompt takes the context, and in which form, belongs to the owner of that prompt.
  - origin: C-079; B-1072; C-080; B-1117; B-1118; C-074; B-1039
  - disposition: ported; translated (B-1039)
  - test: PT-105-C-079-phase-context; PT-105-C-080-phase-context; PT-105-C-074-slice-command
  - ep: EP-15 `specstride.prompt-block/1` (consumes)

#### G3 — The rules of the verification gate, staged commands, failure summary, `verify`







- **F105-FR-032**: The verification gate MUST run every command it selected, also after one has failed, and MUST pass only when all passed. It MUST print `Verification gate <id> passed <n> command(s)` or `Verification gate <id> failed: <command ids>`. It MUST never stop at a failed command. The verification gate MUST decide on the exit results; a condition that the check runner returns beside an exit result (feature 100, annex C §C.8) MUST be kept in the result record and contributed to the fact block, and MUST NOT by itself fail the verification gate or halt the run.
  - origin: C-080; B-1133; C-079; B-1074
  - disposition: ported
  - test: PT-105-C-080-every-command-runs; PT-105-C-079-gate-summary-line
  - ep: EP-05 `specstride.check-runner/1` (consumes)
  - assumption: CQ-179 (whether a condition such as `tainted` fails the verification gate). Closed on 2026-09-30 on the recommended answer

- **F105-FR-033**: The verification gate MUST reuse nothing but results of commands staged before, under these rules. A result MUST be taken over only for a command of the stage `prestage`, only when the record passed and is completed, the plan hash is the same, the revision is the same, and the working tree is clean in the record and at the verification gate. The reuse policy `per-attempt` MUST need the same phase and phase attempt, `per-phase` the same phase, `per-run` neither. The number of the phase attempt MUST default to the one in the name of the result record, and where it is unknown, reuse per phase attempt MUST be refused. A result taken over MUST carry `reused: true` and `reusedFrom` with the place of the record, the stage, the phase, the phase attempt, the plan hash, the revision, the reuse policy, the run time and the duration. The verification gate MUST look for a result in the records of commands staged before of every phase attempt of the run that carry the same plan hash, the most recent phase and phase attempt first. No result of an inner check MUST ever be accepted in place of an execution. In a phase attempt in which a loop layer is engaged, that is, in which a unit of work was declared (feature 100, annex D, F100-FR-118), the verification gate MUST take over no result and MUST execute every command it selected (feature 100, annex C §C.8, F100-FR-232). The engine hands this fact to the verification gate; this feature reads no record of a loop layer.
  - origin: C-080; B-1128; B-1129; B-1130; C-075; B-1045
  - disposition: ported; translated (B-1045)
  - test: PT-105-C-080-reuse-rules; PT-105-C-075-attempt-default; CT-105-133
  - divergence: DV-012 (with a loop layer engaged nothing is reused)
  - parity: reuse as at the baseline; the loop strategy is `classic` (row 1 of annex X §X.7), so no loop layer is engaged

- **F105-FR-034**: In the modes `plan` and `required` the commands staged before MUST run once before each phase attempt. They MUST be the commands of the phase itself with the stage `prestage` or `both`, and MUST NOT be cumulative. The result MUST be a record of the kind `specstride-prestage-evidence`, version 1, with `planId`, `planHash`, `phase`, `attempt`, `sourceRevision`, the times of start and end, `commands`, `passed` and `summary`, written under `attempt:<N>:<k>:<n>:prestage` and replaced on a new run. The step MUST print `Pre-stage phase <N> attempt <M>: <n> command(s), <n> passed, <n> running, <n> failed`, or `No pre-stage commands for phase <N>`. Its result code MUST be 0 when every command passed or none exists and 11 otherwise, for information only: a failure MUST never halt the run. The engine MUST write the log line `----- prestage: phase <N> attempt <M> (rc <rc>) — <summary> -----` and an event that the compatibility projection renders as `prestage_done` with `phase`, `attempt`, `rc` and `summary`; with an empty summary, or one that starts with `No pre-stage commands`, it MUST write neither. A directory given for these records MUST be absolute.
  - origin: C-022; B-0375; C-021; B-0359; C-019; B-0351; C-080; B-1080; B-1126; C-078; B-1069; C-079; B-1073; B-1076; C-076; B-1056; C-075; B-1044; C-074; B-1042
  - disposition: ported; translated (B-0351, B-1069, B-1056, B-1044, B-1042)
  - test: PT-105-C-022-prestage-step; PT-105-C-021-prestage-log-line; PT-105-C-019-prestage-event; PT-105-C-080-prestage-record; PT-105-C-078-prestage-files; PT-105-C-079-prestage-lines; PT-105-C-076-prestage-code; PT-105-C-075-prestage-directory; PT-105-C-074-prestage-command
  - divergence: DV-006; DV-007

- **F105-FR-035**: A command staged before that is declared `detached` MUST be started in a process session of its own with its standard input closed. It MUST never be killed at its deadline; it MUST be reported as `deadline_exceeded` with the signal `DEADLINE`. Its output and its status MUST be written as a log and a status record per command, and copies of an earlier start MUST be removed before the start. The log MUST be written by the process itself: the engine opens the file under `attempt:<N>:<k>:<n>:prestage` and starts the process with its two output streams on it, because the process may outlive the engine that started it; the process gets no other access to the control plane. Such a process MUST be entered in the process registry with the class `adoptable`. It MUST be started by the process primitive that feature 100 gives (annex A, F100-FR-234), because a command started through the check runner is ended at its time limit; this feature MUST start no process by any other way. It MUST get the environment that a command of the check runner gets; the composition root hands that environment in, taken from the check runner (feature 100, annex C §C.8), and this feature builds none.
  - origin: C-080; B-1127; C-078; B-1070
  - disposition: ported; translated (B-1070)
  - test: PT-105-C-080-detached-prestage; PT-105-C-078-detached-files
  - divergence: DV-006
  - assumption: CQ-215 (which component starts a detached command staged before, and with which environment). Closed on 2026-09-30 on the recommended answer
  - status: unverified (check: on macOS a process started in a session of its own survives the end of the engine; verified-on: —; pin: the macOS runner of the release build)

- **F105-FR-036**: After a build command has passed, every export that the workspace declares MUST be recorded in `buildArtifacts` with `exists`, `sizeBytes`, `mtimeEpoch` and `fresh`. This record MUST NOT fail the verification gate.
  - origin: C-080; B-1125
  - disposition: ported
  - test: PT-105-C-080-build-artifacts

- **F105-FR-037**: The failure summary MUST render a result record of the verification gate as text. For each failed command it MUST print `### <commandId> — exit <code>`, then the argument list with `(cwd: <dir>)`. Lines of standard output that start with `FAILED `, `ERROR ` or `E   ` MUST be listed first under `Failing assertions / tests:`, at most 40, then `… <n> more`. The ends of the streams MUST be printed as `stdout (last <n> lines):` and `stderr (last <n> lines):`; an empty stream MUST be left out. The numbers of lines MUST be settable, with the defaults 80 and 40 and the as-is variables `SPECSTRIDE_VERIFY_TAIL_LINES` and `SPECSTRIDE_VERIFY_TAIL_ERR_LINES` as aliases. A record that cannot be read MUST give `Could not read the verification evidence (<error>).`, and a record without a failed command the as-is note of two lines. The result code MUST be 0 in all these cases and 2, with a usage line, when it is not given exactly one record.
  - origin: C-069; B-1027; C-070; B-1028; B-1029; C-071; B-1030; B-1031; C-072; B-1032; B-1033; B-1034; B-1035; C-073; B-1036
  - disposition: translated (C-069, C-070, C-071); ported (C-072, C-073)
  - test: PT-105-C-069-summary-entry; PT-105-C-070-tail-lines; PT-105-C-071-summary-codes; PT-105-C-072-summary-lines; PT-105-C-073-failing-lines-first
  - divergence: DV-027; DV-066
  - parity: 80 and 40, as at the baseline (row 126 of annex X §X.7)


- **F105-FR-039**: `verify` MUST be a public command with the sub-commands of the baseline: `create`, `validate`, `slice`, `scaffold`, `run`, `prestage` and `prestage-report`. `create` MUST need the working directory (absolute, existing), the spec (absolute, existing, valid in its format), the place of the plan for people and the place of the plan record (both absolute and inside the working directory), MAY take a forced format and the verification-commands document (absolute), and MUST print one record with `planId`, `contentHash`, `markdownPath`, `canonicalPath`, `declaredCommands` and `generated`. `validate` MUST print `valid`. `run` MUST take a phase that is a whole number or the literal `release`, and anything else MUST exit 3 with `--phase must be an integer or release`. `prestage-report` MUST print the block for a prompt without adding a line end: the heading `## Pre-staged verification for this phase (attempt <M>)`, the as-is instruction not to run the commands again, the place of the record, and for each command its state (passed or failed with exit code and duration, still running, or past its deadline and left running), its command line, its report path where one is declared, and what the verification gate will do with the result. It MUST print nothing when no record exists for the phase or the record holds no command. The exit codes MUST be: 0 on success; 3 on any verification error, with the message after the component name on standard error; 10 when the verification gate failed; 11 when a command staged before failed.
  - origin: C-074; B-1037; B-1038; B-1041; B-1043; C-075; B-1046; B-1047; B-1048; B-1049; B-1050; B-1053; B-1054; C-076; B-1055; B-1057; B-1058; C-079; B-1075
  - disposition: translated; ported (B-1075)
  - test: PT-105-C-074-sub-commands; PT-105-C-075-create-arguments; PT-105-C-076-exit-codes; PT-105-C-079-valid-line
  - divergence: DV-066
  - assumption: CQ-155 (the spelling of the sub-commands of `verify`). Closed on 2026-09-30 on the recommended answer

#### G4 — Staleness under the `parity` profile, narrowing



- **F105-FR-042**: Under the `parity` profile the verification plan MUST be checked when a critic call starts, as at the baseline: a plan that is invalid, stale or not given by an absolute place MUST end the critic call with the result code 3 and `invalid verification plan: <reason>`, and a plan MUST be stale, with `verification plan is stale`, when the hash of the spec differs from `source.contentHash`. The plan MUST be named to the critic call by an argument whose default is the as-is variable `SPECSTRIDE_VERIFICATION_PLAN`; an empty value MUST mean no plan. Under the `parity` profile every step of the engine that the baseline hands the spec together with the plan MUST make the same check when it loads the plan, with the effect the baseline has: the verification gate and release verification end with the code 3, which is a failed verification gate (F105-FR-005, F105-FR-008), so that in the mode `required` a stale plan is met at the verification gate, before any critic call; the phase context is left out of the prompt; and the step of commands staged before writes neither its log line nor its event. Outside the `parity` profile this feature MUST make no staleness check at critic start, at the verification gate or in either of those steps, and no critic call MUST be refused for a stale plan.
  - origin: C-060; B-0803; C-061; B-0849; C-063; B-0864; C-080; B-1114
  - disposition: translated; ported (B-1114)
  - test: PT-105-C-060-plan-argument; PT-105-C-061-plan-variable; PT-105-C-063-critic-code-3; PT-105-C-080-stale-plan; CT-105-142
  - divergence: DV-082; DV-027
  - parity: critic start only (row 15 of annex X §X.7)

- **F105-FR-043**: Inside and outside the `parity` profile the verification plan MUST stay bound to the hashes of its sources, and the public command `verify` MUST refuse a stale plan with the code 3 whenever it loads one. The comparison of the hashes of spec, plan and task list at launch, at `resume` and at every pass start is not made by this feature.
  - test: CT-105-143
  - divergence: DV-082


- **F105-FR-045**: A verification command, a time limit or a mode in project configuration MUST be accepted only inside the narrowing rule of feature 100, annex X §X.2: project configuration MAY make verification stricter and MUST NOT remove a command, weaken the mode, or raise `verification.parallelism`. The verification-commands document of the project is a plan source and is not configuration. The key that names that document makes code run, and the owner of the keys classes it as widening: from project configuration it MUST be ignored with the launch message and the doctor warning of annex X §X.2, so a file of the project cannot point a run at a document of its choice.
  - test: CT-105-145
  - divergence: DV-068

#### Conformance

- **F105-FR-053**: This feature MUST deliver the conformance suite of EP-07 (fixtures with declared commands, with conflicts and with none) and a sample plan source in the test tree that no core file names. A plan source that fails MUST take the plainer path of feature 100, annex A §A.4, and MUST never produce a verdict, an exit code or a stop reason of its own (F100-FR-019). The refusal of a launch in the mode `required` for a phase that a failed source leaves without commands (F105-FR-015) is the launch check of the mode and not an exit of the source. The half of this requirement that concerned EP-05 moved (see "Requirements moved to 148-check-runner").
  - test: CT-105-153
  - ep: EP-07 `specstride.verification-source/1` (implements)

#### Text from outside the runtime

- **F105-FR-054**: Output of a verification command is text from outside the runtime. It MUST enter through the one ingress of feature 100 (annex A, F100-FR-009), with the ingress class `check-output` (annex X §X.6, row 89), where it is redacted and cut, before this feature writes any part of it: to `summary` of the record of staged commands and of the event rendered as `prestage_done`, to `summary`, `stdout` and `stderr` of a result record, to the failure summary, to the feedback of a phase attempt, to the block of F105-FR-039, and to the status record of a detached command. The log of a detached command is written by the process itself (F105-FR-035): it is a raw capture, kept in the control plane, that no sink and no prompt receives, and every part that this feature takes from it MUST enter through the ingress as any other output. This feature MUST NOT redact by itself, and MUST NOT read the output of a command by a way that passes the ingress by. When the redactor cannot run, the text MUST be dropped and the record MUST say so (F100-FR-205); the verification gate MUST still decide on the exit results.
  - test: CT-105-154
  - divergence: DV-095
  - parity: the fixtures hold no text that the pattern set matches, so the compared bytes are those of the baseline

### Key Entities

| Entity | What it is |
|---|---|
| Verification mode | One of `off`, `plan`, `required`; decides whether a plan exists and whether commands run |
| Verification plan | The frozen record of obligations, commands, suites and gates of a run, bound to the hashes of its sources |
| Verification obligation | One thing a phase must show, derived from a criterion of the phase |
| Plan source | An implementation of EP-07 that reports declared commands with provenance |
| Check manifest | The frozen list of commands of one phase, with pins and, where the consumer declared them outside the repository, reads and writes |
| Verification gate | The run of every selected command of a phase attempt, before the critic |
| Release verification | The run of every command of every phase after the last approval |
| Command staged before | A command of the stage `prestage` (also spelled `pre`) or `both`, run before a phase attempt; may be detached. Only the stage `prestage` offers its result to the verification gate |
| Failure summary | The text that names what failed, for the feedback |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F105-SC-001**: Declared verification is never invented. On every fixture, a phase without declared commands has a manifest with 0 entries and a result `unchecked`, and the number of commands in any manifest that no plan source reported with provenance is 0.
- **F105-SC-002**: Every verification gate executes in full. On every phase attempt in the mode `required`, the number of commands run, plus the number taken over under the reuse rules, equals the number of commands the verification gate selected. A second run that the check runner makes of a failed command (feature 100, annex C §C.8, F100-FR-099) is not counted.
- **F105-SC-004**: Parity. On the fixture families FX-14, FX-15 and FX-16 of feature 141 the oracle reports 0 results `different` under the `parity` profile.
- **F105-SC-005**: No critic call after a failed command. In the mode `required`, the number of critic calls made for a phase attempt whose verification gate failed is 0 on every fixture.
- **F105-SC-006**: No late refusal. Outside the `parity` profile the number of critic calls refused for a stale plan is 0, on a fixture in which the task list changes during a phase attempt.
- **F105-SC-009**: Extension without a change of the core. The sample plan source passes the conformance suite of EP-07, and the number of core files that differ between the build with it and the build without it is 0.
- **F105-SC-010**: Every as-is behaviour is placed. 100 per cent of the 159 behaviour items and of the 2 kept as-is requirements that the traceability files assign to this feature are named by the origin of a requirement and by the `proves:` of a test task.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Checks are deterministic commands only; no model acts as a reviewer | Decision 21 |
| A check is run by the runtime, never by the harness of the proposer | Decision 21 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, and the spelling of
internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-07 | `specstride.verification-source/1` | implements (content owner) | The core side, three of the four Wave 1 sources, the conformance suite, the sample. The inventory of the launch contract as a source is delivered by its owner through the same interface |
| EP-05 | `specstride.check-runner/1` | consumes | Every command of the verification gate, of release verification and of the commands staged before runs through it (F105-FR-032). The one exception is a detached command staged before, which has no deadline at which it is ended (F105-FR-035) |
| EP-16 | `specstride.toolchain/1` | consumes | The toolchains of discovery |
| EP-03 | `specstride.spec-format/1` | consumes | The canonical spec model: phases, criteria, tasks |
| EP-04 | `specstride.loop-layer/1` | consumes | The verification mode in the run snapshot, from which a layer takes its fallback (F105-FR-010). The fact that a layer is engaged in a phase attempt, which the engine hands to the verification gate (F105-FR-033) |
| EP-08 | `specstride.event-sink/1` | consumes | The compatibility projection renders the events of this feature |
| EP-15 | `specstride.prompt-block/1` | consumes | The phase context is handed to the owners of the prompts |
| EP-18 | `specstride.critic-strategy/1` | consumes | The critic is called only after a passed verification gate |

## Threats

Stated as F100-FR-216 asks: the threats of feature 100, annex X §X.9, that name this feature as an
owner, with the requirement that is the control of this feature's part, and its test.

| Threat | This feature's part of the control | Requirements | Tests |
|---|---|---|---|
| T-03, text persuades the critic to approve | The verification gate runs before the critic; a failed command rejects the phase attempt without a critic call, and neither the proposer's claim nor the critic can override it | F105-FR-005, F105-FR-006, F105-FR-032 | PT-105-C-013-gate-before-critic; PT-105-C-013-gate-failure-counts; PT-105-C-080-every-command-runs |
| T-19, the proposer edits what a check reads | The check manifest is derived at launch, stored with its hash and never gains an entry; a manifest that a relaunch derives differently is a fact for the critic and the stored one applies. Fingerprints of the protected set belong to 116 | F105-FR-020, F105-FR-021 | CT-105-120; CT-105-121 |
| T-21, a check runs repository code with the runtime's environment | A command is a fixed argument list with a resolved executable, and runs through the check runner, which owns the environment, the containment and the time limit (148). A detached command staged before gets the same environment. Repository text cannot make two commands run side by side | F105-FR-016, F105-FR-032, F105-FR-035 | PT-105-C-080-declared-commands; CT-105-116; PT-105-C-080-detached-prestage |
| T-25, a check with huge output or without end | Every declared command has a time limit; a detached command that passes its deadline is reported and fails the reuse rules; output enters through the ingress with its cap, and the failure summary prints the ends of the streams only. The raw log of a detached command is written by the process and has no cap, as at the baseline; what is read from it is capped. The end of the process group belongs to 148, the first-failure predicate to 118 | F105-FR-016, F105-FR-035, F105-FR-037, F105-FR-054 | PT-105-C-080-declared-commands; PT-105-C-080-detached-prestage; PT-105-C-070-tail-lines; CT-105-154 |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Check runner (consumed); reuse of a staged command | `specstride.check-runner/1` | C §C.8, F100-FR-097 to F100-FR-100, F100-FR-232 |
| Verification-plan source | `specstride.verification-source/1` | C §C.9, F100-FR-101 to F100-FR-103 |
| Toolchain profile | `specstride.toolchain/1` | C §C.14, F100-FR-110 |
| Canonical spec model | `specstride.spec-format/1` | C §C.7 |
| Check manifest | `specstride.manifest/1` | D §D.8, F100-FR-137 |
| Fact block | `specstride.fact-block/1` | D §D.7, F100-FR-135 |
| Critic strategy | `specstride.critic-strategy/1` | E §E.1 |
| Stop reasons; exit codes of the engine; result record of the verification gate | `specstride.stop-reason/1` | E §E.3, §E.4, F100-FR-151, F100-FR-153 |
| Process registry, classes `owned` and `adoptable` | `specstride.procs/1` | B §B.10 |
| Logical names | `specstride.layout/1` | B §B.5 |
| CLI protocol; the public command `verify`; its exit codes | protocol 1 | G §G.1, F100-FR-171; G §G.4, F100-FR-182 |
| The flag of `resume` that accepts a changed source | — | G §G.1, F100-FR-173 |
| Output modes; component names | — | G §G.2; X §X.8 |
| Event envelope | `specstride.event/1` | X §X.1, F100-FR-198, F100-FR-200 |
| The one ingress and the one point of redaction; ingress class `check-output` | `specstride.redaction/1` | A, F100-FR-009; X §X.4, F100-FR-205; X §X.6, row 89 |
| Run snapshot | `specstride.snapshot/1` | B §B.12, F100-FR-066 |
| Launch contract, `configuration.scopes` | — | G, the table of the launch contract |
| Process primitive of the kernel | — | A, F100-FR-234 |
| Threat model | — | X §X.9, F100-FR-216 |
| Config envelope, trust classes | `specstride.config/1` | X §X.2, F100-FR-202 |
| Canonical hasher: content hash of a text (plan, projection, ids); canonical record hash (manifest) | — | X §X.5, F100-FR-207 |
| List of closed sets | — | X §X.6, rows 52, 228 to 234 |
| The `parity` profile | `specstride.profile/1` | X §X.7, rows 1, 6, 7, 15, 31, 33, 123, 124, 126 |
| Environment alias table; hash classes of the oracle | `specstride.oracle-normalization/1` | X §X.8 |
| Common failure rule of an extension point | — | A §A.4, F100-FR-019 |
| A loop layer engaged in a phase attempt | `specstride.loop-layer/1` | D, F100-FR-118 |

Logical names this feature writes or reads, all of annex B §B.5:
`run:<runId>:verification:plan`, `run:<runId>:verification:release`, `phase:<N>:manifest`,
`attempt:<N>:<k>:<n>:verification`, `attempt:<N>:<k>:<n>:prestage`,
`attempt:<N>:<k>:<n>:feedback`, `attempt:<N>:<k>:<n>:fact-block` (contributed to),
`feature:<slug>:verification:commands` (read), `feature:<slug>:verification:test-plan`,
`feature:<slug>:verification:scaffolds`, `run:<runId>:procs`, `run:<runId>:snapshot` (read).

Fixture families of feature 141 used: FX-14, FX-15, FX-16 (§O.2), and for single items FX-03,
FX-11, FX-20 and FX-22, as the traceability files name them. Stubs: P, CH, V (§O.3).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. Rows that exist:

| Row | Switch | Key | Default | Under `parity` | Register row | Requirements |
|---|---|---|---|---|---|---|
| 1 | Loop strategy (decides whether a manifest file exists, and whether a loop layer can be engaged) | `loop.strategy` | `micro` | `classic` | DV-012; DV-052 | F105-FR-020, F105-FR-033 |
| 6 | Step runner (read only: decides whether a manifest file exists) | `verification.step_runner` | off | off | — | F105-FR-020 |
| 7 | Concurrent verification commands (read only: decides whether a manifest file exists) | `verification.parallelism` | 1 | 1 | DV-080 | F105-FR-020 |
| 15 | Check points of staleness | `staleness.check_points` | launch, resume and every pass start | critic start only | DV-082 | F105-FR-042 |
| 31 | Fingerprints around every command of the verification gate (read only: decides whether a manifest file exists) | `integrity.gate_fingerprint` | on | off | DV-076 | F105-FR-020 |
| 33 | Comparison of the check manifest on a relaunch | `integrity.manifest_relaunch` | on | off | DV-078 | F105-FR-020, F105-FR-021 |

The requirements that state the behaviour of rows 6, 7, 25 and 31 left this feature (`## Requirements moved to 148-check-runner`). F105-FR-020 still reads the switches of rows 6, 7 and 31, and reads them only, to decide whether a manifest file is written; row 25 is not read here.

Rows this feature owns: rows 123, 124 and 126 of annex X §X.7. Row 125 belongs to the owner of the check runner. The spelling is confirmed; feature 110 owns it.

| Switch | Key | Default | Under `parity` | Row | Register row | Requirement |
|---|---|---|---|---|---|---|
| Verification mode | `verification.mode` | `required` | As the fixture sets it | 123 | DV-043 | F105-FR-001 |
| Place of the verification plan for people | `verification.testPlan` | `testautomation/<slug>/TEST_PLAN.md` under the working directory | As the fixture sets it | 124 | — | F105-FR-002 |
| Verification-commands document | `verification.commands` | none | As the fixture sets it | 124 | — | F105-FR-002 |
| Directory for test scaffolds | `verification.generateTests` | `testautomation/<slug>/generated` under the working directory | As the fixture sets it | 124 | — | F105-FR-002 |
| Lines of standard output in the failure summary | `verification.summary.tailLines` | 80 | 80 | 126 | — | F105-FR-037 |
| Lines of standard error in the failure summary | `verification.summary.tailErrLines` | 40 | 40 | 126 | — | F105-FR-037 |

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 105; of row 233 this feature owns the member
`DEADLINE`, and the owner of the check runner owns `TIMEOUT` and `EXEC_ERROR`. Rows 53 and 54 of
annex X §X.6 went with their requirements.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 52 | Verification modes | `required`, `plan`, `off` | Owner decision | Configuration error (exit 3) |
| 228 | Stages of a declared command | `gate`, `pre`, `prestage`, `both`; `pre` is a spelling of `prestage` and is stored as `prestage` | Design (as-is) | The declaration is refused |
| 229 | Reuse policies | `per-attempt`, `per-phase`, `per-run` | Design (as-is) | The declaration is refused |
| 230 | Values of `discovery` | `none` | Design (as-is) | The document is refused |
| 231 | Kinds and levels of a verification obligation | `effect-witness` with `integration`; `positive` with `contract` | Design (as-is) | The plan is refused |
| 232 | `automationStatus` | `planned`, `manual` | Design (as-is) | The plan is refused |
| 233 | Signal of a detached command staged before that has no exit code | `DEADLINE` | Design (as-is) | The command counts as failed |
| 234 | Sub-commands of `verify` | `create`, `validate`, `slice`, `scaffold`, `run`, `prestage`, `prestage-report` | Owner decision (ruling 26) | Exit 3 |

Open sets: plan sources (an open registry), toolchains of discovery (open by data).

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 002 FR-009 | An APPROVED verdict advances a phase only when a separate verification passes afterwards | DV-040: the order of the Specstride baseline wins, the verification gate runs before the critic |

No behaviour item assigned to this feature has the disposition `superseded-by` or `dropped`.

As-is ids carried, and where:

| As-is id | Items | Disposition | Requirements (items) | Test |
|---|---|---|---|---|
| 028 FR-020 | — | ported | F105-FR-001 | PT-105-028FR020-* |
| 002 FR-038 | — | merged-with 028 FR-020 | F105-FR-022 | CT-105-1 |
| C-006 | 4 | ported | F105-FR-001 (B-0021); F105-FR-002 (B-0022, B-0023, B-0024) | PT-105-C-006-* |
| C-007 | 4 | translated | F105-FR-001 (B-0051); F105-FR-002 (B-0052, B-0053, B-0054) | PT-105-C-007-* |
| C-008 | 8 | translated | F105-FR-007 (B-0087, B-0099, B-0100, B-0101, B-1136, B-1137, B-1138, B-1139) | PT-105-C-008-* |
| C-009 | 6 | ported | F105-FR-001 (B-0112); F105-FR-002 (B-0113, B-0114, B-0121); F105-FR-004 (B-0122); F105-FR-008 (B-0124) | PT-105-C-009-* |
| C-010 | 3 | ported | F105-FR-004 (B-1140); F105-FR-008 (B-0140, B-1141) | PT-105-C-010-* |
| C-011 | 9 | translated | F105-FR-002 (B-0158, B-0159); F105-FR-006 (B-0182, B-1144); F105-FR-008 (B-0172, B-1142); F105-FR-009 (B-0160, B-0181, B-1143) | PT-105-C-011-* |
| C-012 | 4 | ported | F105-FR-006 (B-1145); F105-FR-007 (B-0222); F105-FR-008 (B-0202, B-0203) | PT-105-C-012-* |
| C-013 | 10 | ported | F105-FR-002 (B-0238, B-0268); F105-FR-003 (B-0322, B-1150, B-1146); F105-FR-004 (B-0267); F105-FR-005 (B-0319, B-0320); F105-FR-008 (B-0274); F105-FR-016 (B-0269) | PT-105-C-013-* |
| C-019 | 1 | translated | F105-FR-034 (B-0351) | PT-105-C-019-* |
| C-021 | 1 | ported | F105-FR-034 (B-0359) | PT-105-C-021-* |
| C-022 | 1 | ported | F105-FR-034 (B-0375) | PT-105-C-022-* |
| C-060 | 1 | translated | F105-FR-042 (B-0803) | PT-105-C-060-* |
| C-061 | 1 | translated | F105-FR-042 (B-0849) | PT-105-C-061-* |
| C-063 | 1 | translated | F105-FR-042 (B-0864) | PT-105-C-063-* |
| C-069 | 1 | translated | F105-FR-037 (B-1027) | PT-105-C-069-* |
| C-070 | 2 | translated | F105-FR-037 (B-1028, B-1029) | PT-105-C-070-* |
| C-071 | 2 | translated | F105-FR-037 (B-1030, B-1031) | PT-105-C-071-* |
| C-072 | 4 | ported | F105-FR-037 (B-1032, B-1033, B-1034, B-1035) | PT-105-C-072-* |
| C-073 | 1 | ported | F105-FR-037 (B-1036) | PT-105-C-073-* |
| C-074 | 7 | translated | F105-FR-024 (B-1040); F105-FR-025 (B-1039); F105-FR-034 (B-1042); F105-FR-039 (B-1037, B-1038, B-1041, B-1043) | PT-105-C-074-* |
| C-075 | 11 | translated | F105-FR-019 (B-1051); F105-FR-024 (B-1052); F105-FR-033 (B-1045); F105-FR-034 (B-1044); F105-FR-039 (B-1046, B-1047, B-1048, B-1049, B-1050, B-1053, B-1054) | PT-105-C-075-* |
| C-076 | 4 | translated | F105-FR-034 (B-1056); F105-FR-039 (B-1055, B-1057, B-1058) | PT-105-C-076-* |
| C-077 | 1 | ported | F105-FR-019 (B-1059) | PT-105-C-077-* |
| C-078 | 12 | translated | F105-FR-009 (B-1071); F105-FR-011 (B-1063); F105-FR-016 (B-1062); F105-FR-022 (B-1060); F105-FR-023 (B-1061, B-1064, B-1065); F105-FR-024 (B-1066, B-1067, B-1068); F105-FR-034 (B-1069); F105-FR-035 (B-1070) | PT-105-C-078-* |
| C-079 | 5 | ported | F105-FR-025 (B-1072); F105-FR-032 (B-1074); F105-FR-034 (B-1073, B-1076); F105-FR-039 (B-1075) | PT-105-C-079-* |
| C-080 | 55 | ported | F105-FR-007 (B-1135); F105-FR-008 (B-1106); F105-FR-009 (B-1123, B-1134); F105-FR-011 (B-1081, B-1082, B-1094, B-1097, B-1108); F105-FR-012 (B-1095, B-1107, B-1112, B-1113); F105-FR-013 (B-1109, B-1110, B-1111, B-1115); F105-FR-014 (B-1077, B-1098, B-1099); F105-FR-016 (B-1079, B-1083, B-1084, B-1085, B-1086, B-1087, B-1096, B-1101); F105-FR-017 (B-1078, B-1088, B-1089, B-1090, B-1091, B-1092, B-1093, B-1100, B-1105); F105-FR-018 (B-1102, B-1103, B-1104, B-1116, B-1131, B-1132); F105-FR-024 (B-1119); F105-FR-025 (B-1117, B-1118); F105-FR-032 (B-1133); F105-FR-033 (B-1128, B-1129, B-1130); F105-FR-034 (B-1080, B-1126); F105-FR-035 (B-1127); F105-FR-036 (B-1125); F105-FR-042 (B-1114) | PT-105-C-080-* |

Total: 159 behaviour items in 26 clusters, each named by exactly one requirement. Cluster C-080
is divided: 55 of its items are carried here; B-1120, B-1121, B-1122 and B-1124 moved.

## Requirements moved to 148-check-runner

Moved on 2026-09-29. The old ids are never reused; the sequence of this feature has gaps.

| Old id | New id | Old tests | New tests |
|---|---|---|---|
| F105-FR-026 | F148-FR-001 | CT-105-126 | CT-148-101 |
| F105-FR-027 | F148-FR-002 | PT-105-C-080-command-run; CT-105-127 | PT-148-C-080-command-run; CT-148-102 |
| F105-FR-028 | F148-FR-003 | CT-105-128 | CT-148-103 |
| F105-FR-029 | F148-FR-004 | PT-105-C-080-timeout-and-start-error; CT-105-129 | PT-148-C-080-timeout-and-start-error; CT-148-104 |
| F105-FR-030 | F148-FR-005 | CT-105-130 | CT-148-105 |
| F105-FR-031 | F148-FR-006 | CT-105-131 | CT-148-106 |
| F105-FR-038 | F148-FR-007 | CT-105-138 | CT-148-107 |
| F105-FR-040 | F148-FR-008 | CT-105-140 | CT-148-108 |
| F105-FR-041 | F148-FR-009 | CT-105-141 | CT-148-109 |
| F105-FR-044 | F148-FR-010 | CT-105-144 | CT-148-110 |
| F105-FR-046 | F148-FR-011 | CT-105-146; CT-105-201; CT-105-202 | CT-148-111; CT-148-201; CT-148-202 |
| F105-FR-047 | F148-FR-012 | CT-105-147 | CT-148-112 |
| F105-FR-048 | F148-FR-013 | CT-105-148; CT-105-206 | CT-148-113; CT-148-206 |
| F105-FR-049 | F148-FR-014 | CT-105-149; CT-105-203 | CT-148-114; CT-148-203 |
| F105-FR-050 | F148-FR-015 | CT-105-150; CT-105-204; CT-105-205; CT-105-207 | CT-148-115; CT-148-204; CT-148-205; CT-148-207 |
| F105-FR-051 | F148-FR-016 | CT-105-151 | CT-148-116 |
| F105-FR-052 | F148-FR-017 | CT-105-152 | CT-148-117 |
| F105-FR-053, the half for EP-05 (the half for EP-07 stays as F105-FR-053) | F148-FR-018 | CT-105-153 part 1; CT-105-305 (the half for EP-05) | CT-148-118; CT-148-305 |
| F105-SC-003 | F148-SC-001 | CT-105-207 | CT-148-207 |
| F105-SC-007 | F148-SC-002 | CT-105-303 | CT-148-303 |
| F105-SC-008 | F148-SC-003 | CT-105-303 | CT-148-303 |
| F105-SC-009, the half for EP-05 (the half for EP-07 stays as F105-SC-009) | F148-SC-004 | CT-105-305 | CT-148-305 |
| — (new in 148) | F148-SC-005, F148-SC-006, F148-SC-007 | — | CT-148-301; PT-148-C-080-suite; CT-148-304 |

As-is items that moved with their requirements: B-1120, B-1121, B-1124 (with F105-FR-027) and
B-1122 (with F105-FR-029), all of cluster C-080.

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place, and the one added. No id was renumbered or reused.

| Requirement | Item | What changed |
|---|---|---|
| F105-FR-010 | W-105-01 | The fact is no longer written into the run record, which has one writer and no field for it. The verification mode is in the run snapshot under the key `verification.mode`, and the loop layer reads it there |
| F105-FR-016 | W-105-03 (CQ-190) | `reads`, `writes` and `sideEffects` left the optional fields of the verification-commands document. Such a field is ignored with a finding and the command is undeclared. New test CT-105-116 |
| F105-FR-020 | W-105-03 (CQ-190) | Declared reads and writes enter the manifest only from the launch contract with the provenance user configuration, the environment or a flag; without it the entry is undeclared, which means serial |
| F105-FR-035 | W-105-02 | States how a detached command is started: by the process primitive of feature 100, not through the check runner, and with the environment of a command of the check runner |
| F105-FR-007 | W-X-18 | Line `ep:` for EP-08 added |
| F105-FR-032 | W-X-18; W-X-31 | Line `ep:` for EP-05 added; "verification gate" in full |
| F105-FR-001, F105-FR-002, F105-FR-037 | W-X-11 | The `parity:` line names rows 123, 124 and 126 of annex X §X.7 |
| F105-FR-003, F105-FR-007, F105-FR-008, F105-FR-018, F105-FR-025, F105-FR-033 | W-X-31 | "verification gate" in full; literals of the baseline are unchanged |
| F105-FR-054 (new) | W-X-23 | Output of a verification command enters through the one ingress before any part of it is written. Test CT-105-154 |

Other places changed: the owner of fingerprints, the protected set and toolchain profiles is 116
(W-100-02); the table "Closed sets" names rows 228 to 234 of annex X §X.6 (W-X-12); the table
"Threats" is new (W-X-22); the count of register rows is no longer written (W-X-05).

## Repairs after the analyze run of 2026-09-30

Dated 2026-09-30, second analyze run, after the cross-feature review, the constitution patch v3.0.1
and the closure of the clarification round. Requirements changed in place; none added, none
renumbered. The feature keeps 37 functional requirements and 7 success criteria. One test name is
new: CT-105-133. The findings and their ids are in `analyze-report.md`, "Second analyze run".

| Requirement or section | Finding | What changed |
|---|---|---|
| F105-FR-011, F105-FR-012 | I1 | The hashes and ids of the plan are formed over the text form of the baseline (sorted keys, compact separators, non-ASCII kept, no final line end) with the content hash of a text of the hasher. The canonical record hash of annex X §X.5 ends its text with a line end and gives another hash. The projection is the record `tasks-v2`, built from the canonical spec model |
| F105-FR-003, user story 1 scenario 3 | I2 | In the mode `plan` the verification gate executes no command; the commands staged before still run before each phase attempt, as F105-FR-034 and the baseline say (B-0375, B-1150) |
| F105-FR-033 | I3, L4 | With a loop layer engaged the verification gate takes over no result (F100-FR-232). Where the verification gate looks for a record. New test CT-105-133; `divergence:` and `parity:` lines |
| F105-FR-016, "Closed sets", Key Entities | U1 | `pre` is a spelling of `prestage` and is stored as `prestage`. A field the requirement does not name is ignored with a finding |
| F105-FR-020 | U2, I6 | The entries of a manifest are the commands of the phase itself (`SUITE-phase-<N>`), and the cumulative verification gate takes its commands from the manifests of the phases it covers; every entry has `inner` true; `pin` and `searchPath` are named; the hash of the manifest is the canonical record hash. The `parity:` line names rows 1, 6, 7, 31 and 33 |
| F105-FR-005, F105-FR-008 | U3 | A verification gate that ends with any code other than 0 has failed: a failed command (10) or a verification gate that could not run (3). The rejection is the same; the event carries the code of the verification gate |
| F105-FR-042, edge cases | U7 | Under the `parity` profile the verification gate, release verification, the phase context and the step of commands staged before make the staleness check of the baseline when they load the plan; outside the profile none of them does |
| F105-FR-025, F105-FR-039 | U4 | The block of `prestage-report` is described, and the phase context ends with it where a record of commands staged before exists |
| F105-FR-035, F105-FR-054 | I4 | The log of a detached command is written by the process itself through the streams it was started with; it is a raw capture in the control plane, and what is read from it passes the ingress. F105-FR-054 names the ingress class, the register row DV-095 and the rule for a redactor that cannot run |
| F105-FR-010 | U5 | The snapshot holds the mode after the change of F105-FR-002. The reading of the key belongs to the owner of the loop layer |
| F105-FR-015 | U6, L6 | A blocker is recorded among the `ambiguities` and its command does not enter the plan. The entry points of Wave 1 are those of F105-FR-017 |
| F105-FR-016, F105-FR-020, F105-FR-032, F105-FR-035, F105-FR-039, Assumptions | I5 | CQ-153, CQ-155, CQ-179, CQ-190, CQ-215 (was N-105-1) and CQ-216 (was N-105-2) are closed on their recommended answers |
| F105-FR-037, F105-FR-042 | L1 | The as-is variables are named |
| F105-FR-009 | L3 | The fields beside the as-is fields: `reused`, `reusedFrom`, one field per condition |
| F105-FR-053 | L5 | "of its own"; the refusal of a launch is the launch check of the mode |
| F105-FR-045 | L9 | The key that names the verification-commands document is a widening key |
| "Rows of the `parity` profile", "Contracts of feature 100 used", "Threats", Notes | I6, L7 | Rows 6, 7 and 31 are read; F100-FR-232, F100-FR-019, F100-FR-118 and row 89 are cited; the test names of the success criteria are explained |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Which default has the verification mode, given that Lisa starts with `off`? → A: `required`, the default of the Specstride baseline. Integrated in F105-FR-001. (Source: `APPROVAL.md` ruling K1; DV-043)
- Q: Does the critic judge first and verification follow, as in Lisa, or the other way round? → A: The verification gate runs before the critic. 002 FR-009 is not carried. Integrated in F105-FR-005. (Source: `APPROVAL.md` ruling K1; DV-040)
- Q: Does the verification gate stop at its first failed command? → A: No. It runs every command. Stopping early exists only in the step runner of the check runner (feature 100, annex C §C.8, F100-FR-100). Integrated in F105-FR-032. (Source: `APPROVAL.md` ruling 51; R23v IR-03 as amended, finding V-18)
- Q: Is the verification plan bound to a spec bundle and kept across runs, as in Lisa? → A: Not in Wave 1. The plan is derived per run. Integrated in F105-FR-012. (Source: brief 105, heading 3; the roadmap)
- Q: Where is plan staleness checked? → A: Outside the `parity` profile this feature makes no check at critic start; the hashes are compared at launch, at `resume` and at every pass start by their owners. Under the profile the check at critic start stays. Integrated in F105-FR-042 and F105-FR-043. (Source: `APPROVAL.md` ruling K3; DV-082)
- Q: Is `verify` a public command? → A: Yes, with the exit codes of the baseline: 0, 3, 10, 11. Integrated in F105-FR-039. (Source: `APPROVAL.md` ruling 26; feature 100, annex G §G.4)
- Q: May project configuration declare verification commands? → A: Only inside the narrowing rule: it may make verification stricter. The verification-commands document is a plan source and not configuration. Integrated in F105-FR-045. (Source: `APPROVAL.md` ruling 35; brief 105, heading 6, DP-009)
- Q: How many rows has the divergence register? → A: This specification names the divergence register (`consolidation.md` section 6) without a count; the register grows, and the brief's figure is out of date. (Source: `consolidation.md` section 6)
- Q: What is the record called that the baseline names the evidence of a verification gate? → A: "Result record of the verification gate". The glossary gives "phase evidence" one meaning, and the logical name of the record is `attempt:<N>:<k>:<n>:verification`. (Source: `consolidation.md` section 1, term 21; feature 100, annex B §B.5)
- Q: What happens in the mode `required` when a plan source fails and a phase is left without commands? → A: The launch is refused. Integrated in F105-FR-015. (Source: feature 100, annex C §C.9, "Failure of an implementation")
- Q: Does the second run of a command that failed in a batch count as a command of the verification gate? → A: No. It is stated beside the first result. Integrated in F105-SC-002. (Source: R29v rule PU-101; feature 100, annex C §C.8, F100-FR-099)
- Q: Which time limit holds for a command at the verification gate: its declared one, or the five minutes of an inner check? → A: Its declared one. The limit per command of an inner check is a cap of the loop layer and belongs to its owner. No requirement changes. (Source: B-1120; `architecture.md` section 9, "Caps")
- Q: What stays in this feature after the split of 2026-09-29, and how does it reach what left? → A: The modes, the plan, the plan sources, the manifest, the verification gate as a step of a phase attempt, release verification, staged commands, the failure summary, staleness and `verify` stay. The check runner is reached through feature 100, annex C §C.8, and through no requirement of the feature that holds it. (Source: `STAGE-B-SPLIT-PROMPT.md` steps 3 and 4)
- Q: Does a condition such as `tainted` on the result of a command fail the verification gate? → A: No. The gate decides on exit results and carries the condition to the critic: the owner ruled that the gate runs, its result carries the condition, approval stays possible and the run does not halt. Feature 100 says such a result is "never a pass", which is read as: it is never stated as a pass. Integrated in F105-FR-032; reading CQ-179. (Source: `APPROVAL.md` ruling 41; feature 100, annex C §C.8 and annex D §D.7, F100-FR-136)
- Q: Which questions could the sources not answer? → A: Three that stay with this feature: CQ-153, CQ-155 and the new CQ-179, listed under "Assumptions". CQ-154 went with the closed set of row 53.

### Session 2026-09-30

- Q: May the verification-commands document declare the reads and writes of a command? → A: No. It is repository text. Declared reads and writes come only from user configuration, the environment or a flag, through the launch contract; a declaration without that provenance counts as undeclared, which means serial. Integrated in F105-FR-016 and F105-FR-020; reading CQ-190. (Source: `APPROVAL.md` rulings P11 and 35; feature 100, annex D §D.8 and F100-FR-099; the recommended answer of CQ-190)
- Q: Where does the loop layer learn that the verification gate does not execute? → A: From the run snapshot, key `verification.mode`. The run record has one writer, the runtime root, and no field for it. Integrated in F105-FR-010. (Source: feature 100, annex E §E.2, F100-FR-143; annex B §B.12, F100-FR-066; F100-FR-051)

### Session 2026-09-30, second analyze run

Answered from the baseline code and from feature 100, at the owner's instruction to resolve every
finding with the best suggestion. No question was put to a person.

- Q: In which text form are the hashes of the plan taken? → A: In the form of the baseline: sorted keys, compact separators, non-ASCII kept, no final line end, hashed as a text. The canonical record hash of the hasher ends its text with a line end and is used for the manifest only. Integrated in F105-FR-011 and F105-FR-012. (Source: `lib/verification_plan.py:79-88`, `:1050` at `9cab15d`; B-1108; feature 100, annex X §X.5)
- Q: Does a command run in the mode `plan`? → A: The verification gate runs none. The commands staged before run before each phase attempt in the modes `plan` and `required`. Integrated in F105-FR-003. (Source: `specstride-lib.sh:571` at `9cab15d`; B-0375; B-1150)
- Q: May the verification gate take over a staged result while a loop layer is engaged? → A: No. Integrated in F105-FR-033. (Source: feature 100, annex C §C.8, F100-FR-232; Principle II)
- Q: What is the stage `pre`? → A: A spelling of `prestage`, stored as `prestage`. Integrated in F105-FR-016. (Source: `lib/verification_plan.py:51-57` at `9cab15d`; B-1079)
- Q: Which entries of a manifest are inner, and which commands are its entries? → A: Every entry is inner; the entries are the commands of the phase itself, its suite, so that a phase without commands keeps an empty manifest; the cumulative verification gate reads the manifests of the phases it covers. Integrated in F105-FR-020. (Source: brief 115, "The inner set is the manifest", R27 D1.4; feature 100, annex D §D.8, "The commands of the phase"; Principle XIV; F105-SC-001)
- Q: What happens when the verification gate cannot run? → A: The same rejection as for a failed command; the event carries the code 3. Integrated in F105-FR-005 and F105-FR-008. (Source: `orchestrator.sh:1988-1991`, `:979` at `9cab15d`; B-0320)
- Q: Is the staleness of the plan checked only when the critic starts, under the `parity` profile? → A: No. The baseline hands the spec to every call that loads the plan, so the verification gate, release verification, the phase context and the step of commands staged before check it too; in the mode `required` the verification gate meets a stale plan before the critic. Outside the profile none of them checks. Integrated in F105-FR-042. (Source: `orchestrator.sh:973-979`, `:1253`, `:1557`, `:1983-1991`, `specstride-lib.sh:571` and `lib/verification_plan.py:1140-1143` at `9cab15d`; B-0319; B-1114; ruling K3)
- Q: Who writes the log of a detached command, which may outlive the engine? → A: The process itself, through the streams the engine gave it; the ingress stands where the log is read. Integrated in F105-FR-035 and F105-FR-054. (Source: `lib/verification_plan.py:1765-1773` at `9cab15d`; B-1070; B-1127; F100-FR-009)
- Q: What does a blocker do in the mode `plan`? → A: It is recorded among the ambiguities, its command does not enter the plan, and the plan for people lists it. Integrated in F105-FR-015. (Source: feature 100, annex C §C.9; F105-FR-019; F105-FR-022)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection (feature 111) renders the events of this feature in the as-is vocabulary; this feature states which as-is events must result.
- The check runner returns a result with its conditions as feature 100, annex C §C.8 says; this feature reads `passed` and the conditions and adds no meaning of its own.
- The inventory of the launch contract reaches the plan through EP-07 as a source of its owner; declared reads and writes of verification commands arrive only in the launch contract (`configuration.scopes`, register row DV-097), with the provenance user configuration, the environment or a flag; no plan source that reads repository text reports them (CQ-190).
- Lisa's executor, store, hash, renderer and discovery are extracted as source where they fit; each kept behaviour has a characterization test. The planner is written new on the canonical spec model.

Readings that the sources did not settle. Each is marked in its requirement. All six were closed in
`docs/ecosystem/CLARIFY-QUEUE.md` on 2026-09-30 by the owner's blanket instruction: the recommended
answer stands, and it is the reading below.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-153 | Is a check manifest written in a run whose loop strategy is `classic` outside the `parity` profile? F100-FR-137 and DV-052 tie the file to the loop layer; the integrity rules of DV-076 and DV-078 and the option of row 7 need it with the layer off | It is written when the strategy is not `classic`, or when one of the switches of rows 6, 7, 31, 33 is on. Under the `parity` profile none of these holds and no file exists | F105-FR-020 |
| CQ-179 | Does a condition (`tainted`, `unchecked`) on the result of a command fail the verification gate? Ruling 41 keeps approval possible; feature 100, annex C §C.8 says such a result is never a pass | The gate decides on exit results; the condition is carried to the critic and never stated as a pass | F105-FR-032 |
| CQ-190 | May repository text declare the reads and writes of a verification command? Ruling P11 lets two commands run side by side on the strength of them; the verification-commands document is a file of the project | No. They come only from user configuration, the environment or a flag, through the launch contract. A declaration without that provenance counts as undeclared, which by ruling P11 means serial | F105-FR-016, F105-FR-020 |
| CQ-155 | How are the sub-commands of `verify` spelled? Ruling 26 makes the command public with today's exit codes and names no sub-command | The seven names of the baseline | F105-FR-039 |
| CQ-215 | Which component starts a detached command staged before, and with which environment? (N-105-1 of the repair report) | The process primitive of the kernel, in a session of its own with standard input closed (F100-FR-234 says both since its amendment), with the environment the check runner would give | F105-FR-035 |
| CQ-216 | May the verification-commands document declare `resource` and `steps`? (N-105-2 of the repair report) | Yes for both: `resource` narrows, and `steps` are commands declared like any other | F105-FR-016 |
