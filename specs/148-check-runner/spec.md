# Feature Specification: Check runner

**Feature Branch**: `148-check-runner` (a label: Spec Kit creates no branch in this repository; the directory is `specs/148-check-runner`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 148-check-runner of Specstride, split from 105-verification: the check runner (EP-05) with pin, start, poll, result, cancel; the kind command (fixed argument list, no shell, own process group, environment allow-list, time limit, output cap); result conditions and their reasons; runner errors; one runner for every check; fingerprints around every command of the verification gate; check events; the step runner as an option; integrity rules with the loop layer off; concurrent verification commands as an option with declared reads and writes; the conformance suite and sample of EP-05."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 105-verification, groups G3, G4 and G5), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, D, X), feature 141 (§O.1 to §O.7), the traceability files, and the research reports R11, R23, R23v, R27, R29 and R29v.

## What this feature is

Every deterministic check of the product is one command run by the runtime: a command of the
verification gate, of release verification, of an inner check, of the closing check, of the merge
check. This feature is the one component that runs such a command. It pins the executable at
launch, runs a fixed argument list without a shell, bounds its time and its output, keeps provider
credentials away from it, and returns a result whose conditions stand beside the exit result.
Because there is one runner, a result means the same wherever it was obtained.

The feature was split from feature 105 on 2026-09-29 (`## Ids before the split`).

**In scope**: the check runner behind EP-05 and its kind `command`; the result, its conditions and
their reasons; the errors of the runner; the two fingerprint readings around a command of the
verification gate and the taint that follows a difference; the events of a check; the step runner
as an option; the integrity rules that hold with a loop layer off (hash of the manifest, pin,
search path); concurrent verification commands as an option; the conformance suite and the sample
of EP-05.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Which commands exist: plan sources, the verification plan, the derivation of the check manifest | 105; this feature reads the manifest (feature 100, annex D §D.8) |
| The verification gate as a step of a phase attempt: its order before the critic, the feedback, release verification, commands staged before and their reuse rules | 105 |
| Fingerprints, the protected set, toolchain profiles; the record stored at `unit:<unitId>:check:<i>` (`specstride.check-result/1`) | 116; consumed through EP-16 and `phase:<N>:protected-set` |
| Inner checks, the closing check and the merge check as decisions | 115; 142 |
| Ending the processes of a pass | 118; this feature reads the process registry |
| The event types and their fields; the spelling of config keys | 111; 110 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A command of a check runs bounded and without credentials (Priority: P1)

The runtime hands the check runner an entry of a check manifest. The runner starts the command
with its fixed argument list, in a process group of its own, with a time limit, an output cap and
an environment that holds no provider credential, and returns the exit result with its conditions.

**Why this priority**: A check runs code of the repository. It is the place where a proposer's
change first executes under the runtime's hand.

**Independent Test**: The conformance suite of EP-05 with scripted commands: one passes, one fails
at step n, one runs slow, one never ends, one prints very large output.

**Acceptance Scenarios**:

1. **Given** a command that exits 0, **When** the runner returns the result, **Then** the command passed and no condition is set (F148-FR-002, F148-FR-003).
2. **Given** a command that never ends, **When** its time limit passes, **Then** its process group is ended, the result has no exit code and the signal `TIMEOUT`, and it counts as failed (F148-FR-004).
3. **Given** a command that prints 10 MB, **When** the result is returned, **Then** each stream holds at most 64000 characters (F148-FR-002).
4. **Given** provider credentials in the environment of the runtime, **When** a command prints its environment outside the `parity` profile, **Then** none of them is printed (F148-FR-002).
5. **Given** a command whose executable cannot be started, **When** the runner starts it, **Then** the error is `cannot-start` and the signal `EXEC_ERROR` (F148-FR-004).
6. **Given** a caller that asks for the environment of the kind `command`, **When** the interface of EP-05 gives it, **Then** no process was started, the environment equals the one a command of the check runner gets, and the check runner starts no detached command (F148-FR-019).

---

### User Story 2 - A result that was obtained against a changed tree is never a pass (Priority: P1)

Around every command of the verification gate the runner takes a reading of the protected set
before and after. A difference, a changed manifest or a replaced executable marks the result.

**Why this priority**: Without it a proposer that edits a test, or the tool that runs it, turns a
failure into a pass.

**Independent Test**: A scripted command that changes a protected file while it runs; a manifest
whose stored bytes are changed between two checks; an executable replaced after launch.

**Acceptance Scenarios**:

1. **Given** a protected file that changes while a command runs, **When** the result is returned, **Then** it carries `tainted` with the reason `changed-during-check` and is not a pass (F148-FR-006).
2. **Given** protected files changed without authority before a check, **When** the verification gate runs, **Then** the commands still run, the result carries `tainted` with the reason `protected-set-changed`, the fact is contributed to the fact block, and the run does not halt (F148-FR-006).
3. **Given** a stored manifest whose hash does not verify, **When** a check is due, **Then** the check does not run and an integrity event is raised (F148-FR-010).
4. **Given** an executable whose size or hash differs from the pin, **When** a check runs, **Then** the result carries `tainted` with the reason `pin-mismatch` (F148-FR-010).

---

### User Story 3 - An author adds a kind of runner without touching the core (Priority: P2)

The author of a later runner, for example one that runs checks on another machine, registers it
behind EP-05.

**Why this priority**: The handle-based interface exists for this; the sample is its proof.

**Independent Test**: The sample runner of the test tree serves an entry of its kind and passes
the conformance suite; no core file names it.

**Acceptance Scenarios**:

1. **Given** the sample runner registered from the test tree, **When** the conformance suite runs, **Then** it passes and no core file differs (F148-FR-018).
2. **Given** a manifest entry of a kind that no runner registered, **When** `pin` runs at launch, **Then** the entry is refused (F148-FR-001).
3. **Given** a runner that throws, **When** the core calls it, **Then** the result is `cannot-start` (F148-FR-004).

---

### User Story 4 - Independent commands run side by side, and the result does not change (Priority: P3)

A consumer sets `verification.parallelism` to 3. Commands whose declared reads and writes do not
meet run in one batch. The results, the failure signature and the facts for the critic are the
same as with the value 1.

**Why this priority**: It is an option that is off by default. It must be safe before it is fast.

**Independent Test**: Two fixtures with opposite completion orders give equal failure signatures;
a build that writes a directory and a test that reads it are never in one batch.

**Acceptance Scenarios**:

1. **Given** a command without declared reads and writes, **When** batches are formed, **Then** it runs alone (F148-FR-011).
2. **Given** a command declared free of side effects that writes a file, **When** its batch ends, **Then** every command of the batch is `tainted` with the reason `changed-during-check` and the parallelism is 1 for the rest of the run (F148-FR-014).
3. **Given** a batch whose first command fails at once, **When** the batch runs, **Then** the second command runs to its end (F148-FR-015).
4. **Given** a command that failed in a batch of two, **When** the batch has ended, **Then** the command runs once more alone and both results are stated (F148-FR-016).

---

### User Story 5 - A long command of many steps stops at its first failed step (Priority: P3)

A consumer switches the step runner on. A command declared with steps is run step by step and
stops at the first failed required step. A later execution of the command may resume from that
step, and is then `partial`.

**Why this priority**: An option, off by default, for long verification jobs.

**Independent Test**: A command of 40 steps whose step 35 fails; a resumed execution from step 35.

**Acceptance Scenarios**:

1. **Given** the step runner on and a step that fails, **When** the execution reaches it, **Then** no later step runs and each step has a result (F148-FR-008).
2. **Given** an execution resumed from step 35 in which every remaining step passes, **When** the result is returned, **Then** it is `partial`, carries `unchecked` with the reason `partial`, and never satisfies the verification gate (F148-FR-009).

---

### Edge Cases

- A result carries a condition the reader does not know: the result is `unchecked` with the reason `unknown-condition` (F148-FR-003).
- A process of the pass still lives when a check is due: the check does not start, apart from a detached job held by an accepted yield (F148-FR-005).
- `verification.parallelism` is set to 5: a configuration error (F148-FR-011).
- Two commands name the same exclusive resource: they are never in one batch (F148-FR-012).
- A command with steps while the parallelism is above 1: its steps run one after the other and the command shares no batch (F148-FR-015).
- An event of a check cannot be written: the result of the check does not change (F148-FR-007).
- A duration was measured inside a batch of more than one command: it is flagged `concurrent` and is never used as a learned duration (F148-FR-017).
- Under the `parity` profile: no manifest exists, no fingerprint is taken, the parallelism is 1, the step runner is off, and the environment of the process is passed as at the baseline.

## Requirements *(mandatory)*

Every requirement follows `STAGE-B-RULES.md` section 4. Notes for this feature:

| Note | Content |
|---|---|
| `origin:` | Names the cluster and the behaviour items that the requirement states. Cluster C-080 is divided: four of its items are carried here, the others by the owner of the verification plan |
| `test:` | A requirement with an origin names a parity test `PT-148-C-080-*`. Every requirement names a characterization test `CT-148-<n>`, where n is 100 plus the number of the requirement |
| As-is literals | Field names and signals of the baseline are written as literals, because compatibility output and the compared records reproduce them |

### Functional Requirements

#### G1 — Check runner, result conditions, events

- **F148-FR-001**: The check runner MUST be handle-based with the operations `pin`, `start`, `poll`, `result` and `cancel` of feature 100, annex C §C.8. `pin` MUST run at launch for every entry of a check manifest and MUST return an identity record; for the kind `command` it MUST resolve the executable to an absolute real path and record its size and its hash. `cancel` MUST end the whole process group of the command. An unknown kind of identity MUST refuse the entry at `pin`.
  - test: CT-148-101
  - ep: EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-002**: The kind `command` MUST run a fixed argument list without a shell, in the declared working directory, in a process group of its own, with the time limit of the command, and with an environment that is an allow-list holding no provider credential, overlaid with the `env` the command declares. The captured standard output and standard error MUST each be cut to the first 64000 characters; what lies beyond the cap MUST NOT be kept. A command MUST pass only when its exit code is 0. The result MUST be the exit status that the runtime observed and MUST never be read from a file. Under the `parity` profile the environment MUST be that of the process overlaid with the declared `env`, as at the baseline.
  - origin: C-080; B-1120; B-1121; B-1124
  - disposition: ported
  - test: PT-148-C-080-command-run; CT-148-102
  - divergence: DV-113
  - parity: off, the environment of the process is passed as at the baseline (row 125 of annex X §X.7)
  - ep: EP-05 `specstride.check-runner/1` (implements)
  - status: unverified (check: on macOS a command started in a process group of its own is ended with all its children by one signal to the group; verified-on: —; pin: the macOS runner of the release build)


- **F148-FR-003**: A result MUST hold the exit result and, each in a field of its own, the conditions of the closed set `tainted`, `cached`, `flaky`, `interrupted`, `unchecked`. A condition MUST never replace the exit result. `tainted` and `unchecked` MUST carry a reason from the closed set of reasons listed under "Closed sets". A result with `tainted` or `unchecked` MUST never be stated as a pass, in a record, in an event or in the fact block; what a caller decides from the exit result belongs to the caller. A result that carries a condition the reader does not know MUST be read as `unchecked` with the reason `unknown-condition`. The check runner MUST set `tainted` (F148-FR-006, F148-FR-010, F148-FR-014), `flaky` (F148-FR-016), `unchecked` with the reasons `partial` and `unknown-condition` (F148-FR-009, this requirement), and `interrupted` when a command was ended by `cancel` or by a stop request before its own end, together with the error `interrupted`; an interrupted result MUST never be stated as a pass. `cached` MUST be set only by the owner of the protected set and the toolchain profiles, when a tool reports a result replayed from a cache (F116-FR-009); the other reasons of `unchecked` MUST be set by the loop layer or the owner of the verification gate. The check runner MUST pass every condition set by another owner through unchanged.
  - test: CT-148-103
  - ep: EP-05 `specstride.check-runner/1` (implements)
  - assumption: CQ-154 (the full list of reasons; feature 100 names three "among them"; closed on 2026-09-30, the recommended answer stands)


- **F148-FR-004**: The errors of the check runner MUST be the closed set `cannot-start`, `timeout`, `interrupted`. A command that runs over its time limit MUST give a result with no exit code and the signal `TIMEOUT`, with `command timed out` added to its standard error. A command that cannot be started MUST give the signal `EXEC_ERROR`. Both MUST count as failed at the verification gate. A runner that throws MUST be treated as `cannot-start`. An unknown error MUST be read as `cannot-start`.
  - origin: C-080; B-1122
  - disposition: ported
  - test: PT-148-C-080-timeout-and-start-error; CT-148-104
  - ep: EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-005**: The verification gate, release verification, inner checks, the closing check and the merge check MUST use the same check runner, and a result MUST mean the same in all of them. A check MUST be run by the runtime and never by the harness of the proposer. No model MUST act as a check. The check runner MUST NOT start a command while the process registry shows a process of the pass as alive, apart from a detached job held by an accepted yield.
  - test: CT-148-105
  - ep: EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-006**: Around every command of the verification gate the protected set MUST be fingerprinted before and after. A result obtained against a changed set MUST carry `tainted` with the reason `changed-during-check`, apart from paths the manifest declares as writes of that command. When files of the protected set were changed without authority, the verification gate MUST still run, its result MUST carry `tainted` with the reason `protected-set-changed`, the fact MUST be contributed to the fact block, approval MUST stay possible and the run MUST NOT halt. A command of the verification gate MUST run at the containment level of the proposer or stricter, with no write access to the control plane where the level allows it. No count of tests MUST be contributed to the fact block.
  - test: CT-148-106
  - divergence: DV-076
  - parity: off (row 31 of annex X §X.7); containment as at the baseline (row 25)
  - ep: EP-16 `specstride.toolchain/1` (consumes); EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-007**: For every execution of a command, by whatever check, the runtime MUST emit one `check.started` and one `check.ended`, with the id of the command, the runner, the duration and the result. The types and the fields of their `data` are those of the event catalogue (feature 100, annex X §X.1): the id of the command is `checkId`, the command by reference `commandRef`, the runner `runner`, the duration `durationMs`, the result `result`, the conditions `condition`. No event MUST hold output of a command; output MUST be referred to by logical name, hash and size. The output MUST be captured through the one ingress of text from outside the runtime.
  - test: CT-148-107
  - ep: EP-05 `specstride.check-runner/1` (implements); EP-08 `specstride.event-sink/1` (consumes)


#### G2 — Step runner and integrity with the layer off

- **F148-FR-008**: The step runner MUST be an option, `verification.step_runner`, that is off by default. With it on, a command whose declaration holds steps MUST be run step by step by the runtime; each step MUST be a fixed argument list. The runner MUST stop at the first failed step that is required, MUST record the result of each step inside the result record of its command, and MUST be able to resume from the failed step. Stopping at a first failure MUST exist in the step runner and nowhere in the verification gate.
  - test: CT-148-108
  - parity: off (row 6 of annex X §X.7)
  - ep: EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-009**: A run of steps is one execution of the steps of one command; it is never the logical run. A run of steps that started from a step other than the first MUST be `partial`. A `partial` run of steps MUST never satisfy the verification gate and MUST never be stated as a pass. The run of steps that serves the verification gate MUST start at the first step, apart from results of commands staged before that the owner of the verification gate takes over and records under `attempt:<N>:<k>:<n>:prestage` (feature 100, annex B §B.5).
  - test: CT-148-109
  - parity: off (row 6 of annex X §X.7)


- **F148-FR-010**: With a loop layer off, these rules MUST still hold wherever a check manifest exists. The hash of the manifest MUST be verified before every check; when it does not verify, the check MUST NOT run and an event of the type `integrity.noted` MUST be written, with the `kind` `manifest-hash` and the phase and the logical name of the manifest in `detail`. The pin of the executable MUST be verified before every check; a difference MUST give `tainted` with the reason `pin-mismatch`. The search path of a check MUST be the value recorded at launch. The files that the derivation of the plan reads MUST belong to the protected set.
  - test: CT-148-110
  - divergence: DV-052
  - parity: no manifest file exists (row 1 of annex X §X.7)
  - assumption: CQ-153 (when a manifest exists with the loop strategy `classic` outside the `parity` profile; closed on 2026-09-30, the recommended answer stands, and F100-FR-137 states it)


#### G3 — Concurrent verification commands

- **F148-FR-011**: Concurrency of verification commands MUST be a parameter, `verification.parallelism`, with the default 1 and the ceiling 4; a value above 4 MUST be a configuration error. It MUST apply to the verification gate and to inner checks alike. A command MUST run beside another only when the manifest declares, for both, what they write and what they read, or `sideEffects: none` together with `reads: tree`, and no command of the batch reads what another writes. Declared reads and writes MUST include ignored paths. The declarations MUST be taken from the frozen check manifest only. They never come from repository text: the check runner MUST NOT read a declaration of reads, writes, side effects or an exclusive resource from a file of the repository, and an entry of the manifest that holds no declaration MUST count as undeclared. A command without a declaration MUST run alone. A command with declared writes MUST never share a batch with a command that follows it in the order of the manifest, unless the reads of that command are declared disjoint from those writes.
  - test: CT-148-111; CT-148-208
  - assumption: CQ-190 (declared reads and writes never come from repository text; a declaration without the provenance of user configuration, the environment or a flag counts as undeclared; closed on 2026-09-30, the recommended answer stands)
  - divergence: DV-080
  - parity: 1 (row 7 of annex X §X.7)
  - ep: EP-05 `specstride.check-runner/1` (implements)


- **F148-FR-012**: Batches MUST be formed in the order of the manifest, greedily. Two scopes MUST be compared as normalised path prefixes with a path boundary. Commands that name the same exclusive resource, or share a cache that a toolchain profile marks as exclusive, MUST be kept apart. Every admission of a command to a batch, and every refusal, MUST be recorded with its reason, in an event of the type `check.admission` with the fields `checkId`, `batch`, `slot` (null for a refusal), `result` (`admitted` or `refused`) and `reason` (row 236 of annex X §X.6).
  - test: CT-148-112
  - divergence: DV-080
  - parity: not used (row 7 of annex X §X.7)
  - ep: EP-16 `specstride.toolchain/1` (consumes)


- **F148-FR-013**: The commands of a batch MUST run in the same tree. Each MUST have its own process group, its own temporary directory, its own captured output with its own cap, its own time limit, and the environment allow-list.
  - test: CT-148-113
  - divergence: DV-080
  - parity: not used (row 7 of annex X §X.7)


- **F148-FR-014**: One pair of fingerprints MUST bracket a batch. When a path changed that lies outside the union of the declared writes, every command of the batch MUST be `tainted` with the reason `changed-during-check`, and the parallelism MUST be 1 for the rest of the run, with an event of the type `check.parallelism_lowered` that carries the fields `from` (the value in force before), `to` (1), `batch`, `phase`, `attempt` and `reason` (`changed-during-check`). The rest of the run includes every later engine start of the same logical run; the lowered value MUST be kept with the run, in the field `verificationParallelism` of the run record (feature 100, annex E §E.2), and read at every engine start. An engine in start mode `child`, which does not write the run record, MUST put the lowered value into the field `verificationParallelism` of its terminal record (feature 100, annex B §B.15, as proposed in `analyze-report.md`, "Proposed upstream fixes", P2); the runtime root copies it into the run record before the next engine start. Where the terminal record was synthesized by the runtime root, the value MUST be derived from the last event `check.parallelism_lowered` of the run.
  - test: CT-148-114
  - assumption: CQ-180 (where the lowered value is kept, and who writes it when the engine is a child of the runtime root; closed on 2026-09-30, the recommended answer stands)
  - divergence: DV-080; DV-076
  - parity: not used (row 7 of annex X §X.7)


- **F148-FR-015**: Every command of a batch MUST run to its end; none MUST be cancelled because another failed. The steps of the step runner MUST never be concurrent, and a command that has steps MUST share no batch while the step runner is on (reason `steps` of an admission). Results, the failure signature and the contribution to the fact block MUST be ordered by the position in the manifest and never by completion.
  - test: CT-148-115
  - divergence: DV-080
  - parity: not used (row 7 of annex X §X.7)


- **F148-FR-016**: A command that fails in a batch of more than one MUST be executed once more alone, with a pair of fingerprint readings of its own, and both results MUST be stated. Where the two differ, the result MUST carry `flaky` with both observed results.
  - test: CT-148-116
  - divergence: DV-080
  - parity: not used (row 7 of annex X §X.7)


- **F148-FR-017**: `check.started` and `check.ended` of a command that ran in a batch MUST carry the batch (`batch`), the slot (`slot`), the duration and the result. A duration measured in a batch of more than one command MUST be flagged `concurrent` (field `concurrent` of `check.ended`) and MUST never be used for the exclusion `slow` or as a learned duration.
  - test: CT-148-117
  - divergence: DV-080
  - parity: not used (row 7 of annex X §X.7)

#### Conformance

- **F148-FR-018**: This feature MUST deliver the conformance suite of EP-05 (scripted commands that pass, fail at step n, run slow, never end, and print very large output) and a sample check runner in the test tree that no core file names. A check runner that fails MUST take the plainer path of feature 100, annex A §A.4, and MUST never produce a verdict, an exit code or a stop reason.
  - test: CT-148-118
  - ep: EP-05 `specstride.check-runner/1` (implements)

- **F148-FR-019**: The environment that the kind `command` gives a command (F148-FR-002: the allow-list with no provider credential, overlaid with the `env` the command declares; under the `parity` profile the environment of the process overlaid with the declared `env`) MUST be obtainable by a caller through the operation `environment` of EP-05 (feature 100, annex C §C.8, as proposed in `analyze-report.md`, "Proposed upstream fixes", P1; the interface types in the `contracts` package) without starting a process and without a handle, so that a command staged before and declared `detached`, which the owner of the verification gate starts with the process primitive of the kernel (F105-FR-035, F100-FR-234), gets the same environment as a command of the check runner. The check runner MUST NOT start such a detached command itself, because it ends every command at its time limit (F148-FR-004).
  - test: CT-148-119
  - divergence: DV-113
  - parity: off, the environment of the process is passed as at the baseline (row 125 of annex X §X.7)
  - ep: EP-05 `specstride.check-runner/1` (implements)
  - assumption: N-105-1 (which component starts a detached command staged before, and with which environment; the recommended answer of feature 105 is the process primitive of the kernel with the environment the check runner would give, and this requirement supplies that environment; queued as CQ-215 and closed on 2026-09-30, the recommended answer stands)

### Key Entities

| Entity | What it is |
|---|---|
| Check runner | The implementation of EP-05 that runs a command and returns a result |
| Pin | The identity record of an entry of the manifest; for the kind `command` the absolute real path of the executable with its size and hash |
| Handle | What `start` returns and `poll`, `result` and `cancel` take |
| Environment | What the operation `environment` returns for an entry: the variables a command of the kind `command` gets (F148-FR-019); computed, never stored |
| Result | A returned value, not a stored record: the exit result, the signal where there is no exit code, the duration, a reference to the captured output, and the conditions in fields of their own. The caller stores it; the record of an inner check at `unit:<unitId>:check:<i>` is `specstride.check-result/1` of feature 116 |
| Condition, reason | A member of the closed set of conditions; for `tainted` and `unchecked` a reason |
| Run of steps | One execution of the steps of one command, with the result of each step; `full` or `partial`. Never the logical run |
| Batch | Commands of one manifest that run side by side, with a slot each |
| Admission | The recorded decision to put a command into a batch or to refuse it, with its reason |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F148-SC-001**: A result never depends on the interleaving. With `verification.parallelism` above 1, every result, failure signature and contribution to the fact block equals that of the same manifest run with the value 1, on 100 per cent of the fixtures.
- **F148-SC-002**: No credential reaches a command. With planted provider credentials in the environment of the runtime, 0 of them are visible to a scripted command outside the `parity` profile.
- **F148-SC-003**: Bounded output and time. A command that never ends is ended at its time limit, and a command that prints 10 MB leaves at most 64000 characters per stream, in 100 per cent of the test cases.
- **F148-SC-004**: Extension without a change of the core. The sample check runner passes the conformance suite of EP-05, and the number of core files that differ between the build with it and the build without it is 0.
- **F148-SC-005**: No tainted pass. On every fixture in which the protected set, the manifest or a pinned executable changes, the number of results stated as a pass is 0.
- **F148-SC-006**: Parity. On the scenarios of the fixture families FX-06, FX-14, FX-15 and FX-16 of feature 141 that run a verification command, the oracle reports 0 results `different` for the fields this feature writes, under the `parity` profile.
- **F148-SC-007**: Every as-is behaviour is placed. 100 per cent of the 4 behaviour items that move to this feature are named by the origin of a requirement and by the `proves:` of a test task.

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
| EP-05 | `specstride.check-runner/1` | implements (content owner after the split) | The core side, the kind `command`, the option `steps`, the conformance suite, the sample |
| EP-16 | `specstride.toolchain/1` | consumes | The protected set of a phase; the caches marked exclusive |
| EP-08 | `specstride.event-sink/1` | consumes | The events of a check reach the sinks |

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Check runner | `specstride.check-runner/1` | C §C.8, F100-FR-097 to F100-FR-100 |
| Toolchain profile | `specstride.toolchain/1` | C §C.14, F100-FR-110 |
| Containment levels | — | C §C.15, F100-FR-111 |
| Check manifest | `specstride.manifest/1` | D §D.8, F100-FR-137 |
| Fact block | `specstride.fact-block/1` | D §D.7, F100-FR-135, F100-FR-136 |
| Result record of the verification gate (result codes) | — | E §E.4, F100-FR-153 |
| Process registry | `specstride.procs/1` | B §B.10 |
| Logical names | `specstride.layout/1` | B §B.5 |
| Common rules of extension points; product-wide rules | — | A §A.4; A §A.5, F100-FR-031 |
| Event envelope | `specstride.event/1` | X §X.1, F100-FR-198, F100-FR-200 |
| Config envelope, trust classes | `specstride.config/1` | X §X.2 |
| List of closed sets | — | X §X.6, rows 53, 54, 233, 235, 236 |
| The `parity` profile | `specstride.profile/1` | X §X.7, rows 1, 6, 7, 25, 31, 125 |
| Run record, field `verificationParallelism` | `specstride.run-state/1` | E §E.2 |
| Record of an inner check (owner 116) | `specstride.check-result/1` | B §B.20, F100-FR-227 |
| Threat model | — | X §X.9: T-21, T-25 (the execution of a check: environment, containment, time limit, output cap) |

Logical names this feature reads or writes, all of annex B §B.5: `phase:<N>:manifest` (read),
`phase:<N>:protected-set` (read), `run:<runId>:procs` (read), `attempt:<N>:<k>:<n>:verification`
(the results it returns are written there by the engine), `attempt:<N>:<k>:<n>:prestage` (named
only), `attempt:<N>:<k>:<n>:fact-block` (contributed to), `unit:<unitId>:check:<i>` (the engine writes
there the record `specstride.check-result/1`, whose fields feature 116 owns; this feature returns
the results that the engine puts into it and writes no field of its own), `run:<runId>:record`
(the field `verificationParallelism`, read).

Fixture families of feature 141 used: FX-14, FX-15, FX-16 and FX-06 (§O.2). Stubs: P, CH, V (§O.3).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. Rows that exist:

| Row | Switch | Key | Default | Under `parity` | Register row | Requirements |
|---|---|---|---|---|---|---|
| 1 | Loop strategy (decides whether a manifest file exists) | `loop.strategy` | `micro` | `classic` | DV-012; DV-052 | F148-FR-010 |
| 6 | Step runner | `verification.step_runner` | off | off | — | F148-FR-008, F148-FR-009 |
| 7 | Concurrent verification commands | `verification.parallelism` | 1 (ceiling 4) | 1 | DV-080 | F148-FR-011 to F148-FR-017 |
| 25 | Containment level (of a command of a check) | `sandbox.level` | The strongest the harness offers | As at the baseline: none | DV-030 | F148-FR-006 |
| 31 | Fingerprints around every command of the verification gate | `integrity.gate_fingerprint` | on | off | DV-076 | F148-FR-006 |

Row 125 of annex X §X.7. The spelling is confirmed; feature 110 owns it.

| Switch | Key | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|
| Environment allow-list of a check | `verification.envAllowlist` | on | off: the environment of the process is passed | DV-113 | F148-FR-002 |

## Closed sets

Stated as F100-FR-208 asks. Owner of each after the split: 148; of row 233 the member `DEADLINE` belongs to 105.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 53 | Result conditions of a check | `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` | Design | The result is `unchecked`, reason `unknown-condition` |
| 53 | Reasons of `tainted` | `changed-during-check`, `protected-set-changed`, `pin-mismatch` | Design | The result stays `tainted`; the reason is shown as text |
| 53 | Reasons of `unchecked` | `no-command`, `slow`, `budget`, `flaky-excluded`, `gate-not-executing`, `partial`, `unknown-condition` | Design | The result stays `unchecked`; the reason is shown as text |
| 54 | Errors of the check runner | `cannot-start`, `timeout`, `interrupted` | Design | `cannot-start` |
| 233 | Signals of a result that has no exit code | `TIMEOUT`, `EXEC_ERROR` (owner 148); `DEADLINE` (owner 105, never set by the check runner) | Design | The command counts as failed |
| 235 | State of a run of steps | `full`, `partial` | Design | `partial` |
| 236 | Reasons of an admission to a batch of verification commands | `disjoint` (admitted); `undeclared`, `reads-written`, `writes-overlap`, `follows-writer`, `exclusive`, `steps`, `demoted` (refused) | Design | The command runs alone |

What each reason of a condition means:

| Reason | Condition | When |
|---|---|---|
| `changed-during-check` | `tainted` | The readings before and after a command, or a batch, differ outside the declared writes |
| `protected-set-changed` | `tainted` | Files of the protected set were changed without authority before the check |
| `pin-mismatch` | `tainted` | The executable no longer has the size and hash recorded at launch |
| `no-command` | `unchecked` | The manifest of the phase is empty, or no command can exercise the unit |
| `slow` | `unchecked` | The loop layer excluded the command from the inner set for its duration |
| `budget` | `unchecked` | The time budget of inner checks was spent |
| `flaky-excluded` | `unchecked` | The loop layer excluded the command from the inner set as flaky |
| `gate-not-executing` | `unchecked` | The verification mode is `plan` or `off` |
| `partial` | `unchecked` | A run of steps did not start at the first step |
| `unknown-condition` | `unchecked` | A result carried a condition the reader does not know |

Open set: kinds of identity of the check runner (an open registry; Wave 1: `command`, and
`steps` as an option).

## As-is behaviour not carried

No as-is requirement and no behaviour item that moves to this feature has the disposition
`superseded-by` or `dropped`.

As-is ids carried, and where:

| As-is id | Items | Disposition | Requirements (items) | Test |
|---|---|---|---|---|
| C-080 (divided) | 4 | ported | F148-FR-002 (B-1120, B-1121, B-1124); F148-FR-004 (B-1122) | PT-148-C-080-command-run; PT-148-C-080-timeout-and-start-error |

## Ids before the split

This feature holds the requirements that left `105-verification` on 2026-09-29. The old ids are
never reused.

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
| F105-FR-046 | F148-FR-011 | CT-105-146; CT-105-201; CT-105-202 | CT-148-111; CT-148-201; CT-148-202; CT-148-208 (new, 2026-09-30) |
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
| — (new) | F148-SC-005, F148-SC-006, F148-SC-007 | — | CT-148-301; PT-148-C-080-suite; CT-148-304 |
| — (new, 2026-09-30) | F148-FR-019 | — | CT-148-119 |

As-is items that moved with their requirements: B-1120, B-1121, B-1124 (with F105-FR-027) and
B-1122 (with F105-FR-029), all of cluster C-080.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Does a check stop at its first failed command? → A: No. Every command of a set runs in every check. Stopping early exists only between the steps of one command, in the step runner. Integrated in F148-FR-008 and F148-FR-015. (Source: `APPROVAL.md` ruling 51; R23v IR-03 as amended, finding V-18)
- Q: What must a command declare to run beside another? → A: What it reads and what it writes, ignored paths included. Undeclared means serial. Integrated in F148-FR-011. (Source: `APPROVAL.md` ruling P11; R29v finding V-04, rule PU-101, which stands over R29 PU-74)
- Q: Does a change of protected files halt the run? → A: No. The verification gate runs, the result carries the condition, the critic is told, approval stays possible. Integrated in F148-FR-006. (Source: `APPROVAL.md` ruling 41)
- Q: Are counts of tests given to the critic? → A: No, not in Wave 1. Integrated in F148-FR-006. (Source: `APPROVAL.md` ruling 53)
- Q: Does a concurrent batch, or a failure inside it, add an exit code or a stop reason? → A: No. (Source: feature 100, annex A §A.5, F100-FR-031; Principle XX)
- Q: Where are the results of the steps of the step runner kept, given that annex B has no logical name for them? → A: Inside the result record of their command. Integrated in F148-FR-008. (Source: feature 100, annex D §D.8, field `entries[].steps`; annex B §B.5)
- Q: Does the environment allow-list of a check apply under the `parity` profile? → A: No. The baseline passes the environment of the process, and the transcript of the verification stubs records the names of the variables. Register row DV-113. Integrated in F148-FR-002. (Source: B-1120; R23 IR-10; feature 141, §O.4, `transcript.verification`)
- Q: May a check start while a process of the pass still lives? → A: No, apart from a detached job held by an accepted yield. The ending of the processes belongs to the owner of kills; the check runner reads the process registry. Integrated in F148-FR-005. (Source: feature 100, annex C §C.8, "Guarantees of the core"; R23v IR-32)
- Q: Is output beyond the cap kept anywhere? → A: No. Each stream is cut to the first 64000 characters, as at the baseline, also in a batch, where each command has its own capture. Integrated in F148-FR-002. (Source: B-1121; R29 PU-75)
- Q: Which requirement does a `partial` run of steps name for the results that may still be taken over? → A: None of another feature. It names the logical name `attempt:<N>:<k>:<n>:prestage` of feature 100, under which the owner of the verification gate records them. Integrated in F148-FR-009. (Source: `STAGE-B-SPLIT-PROMPT.md` step 4; R23 IR-30)
- Q: Which time limit holds for a command: its declared one, or the five minutes of an inner check? → A: Its declared one, from the manifest. The limit per command of an inner check is a cap of the loop layer and belongs to its owner. (Source: B-1120; `architecture.md` section 9, "Caps")
- Q: Does the second execution alone of a command that failed in a batch have fingerprint readings of its own? → A: Yes, as every single command has. Integrated in F148-FR-016. (Source: R23v IR-31; R29v PU-101)
- Q: Does the lowering of the parallelism after a taint hold after a resume or a relaunch? → A: Yes. "Run" is the logical run, which survives both. Integrated in F148-FR-014. The value is the field `verificationParallelism` of the run record; who writes it when the engine is a child is reading CQ-180. (Source: feature 100, annex E §E.2; `consolidation.md` section 1, term 10; R29 PU-76)
- Q: Which questions could the sources not answer? → A: Three: CQ-153 and CQ-154, and the new CQ-180, listed under "Assumptions". The cross-feature review added CQ-190 on 2026-09-30.

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The check manifest exists when this feature needs it; its derivation belongs to its owner (feature 100, annex D §D.8).
- The protected set and the fingerprints are delivered by their owner, feature 116, through EP-16 and `phase:<N>:protected-set`. This feature takes two readings and compares them.
- Lisa's verification executor is extracted as source where it fits and has a characterization test.

Readings that the sources do not settle. Each is marked in its requirement. The five queue rows were closed on 2026-09-30 by the owner's instruction to go with the recommended answers (`docs/ecosystem/CLARIFY-QUEUE.md`; N-105-1 is its row CQ-215).

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-153 | Is a check manifest written in a run whose loop strategy is `classic` outside the `parity` profile? | It is written when the strategy is not `classic`, or when one of the switches of rows 6, 7, 31, 33 is on. Under the `parity` profile no file exists. Closed 2026-09-30 | F148-FR-010 |
| CQ-154 | Which reasons may `tainted` and `unchecked` carry? | The three reasons of `tainted` and the seven of `unchecked` under "Closed sets". Closed 2026-09-30 | F148-FR-003 |
| CQ-180 | Where is the lowered parallelism of a run kept, so that a later engine start reads it? Feature 100, annex E §E.2 has the field `verificationParallelism` of the run record since the amendments; the run record is written by the runtime root, and by the engine only in start mode `standalone` | In the field `verificationParallelism` of the run record. Where the engine is a child and cannot write the record, it puts the value into its terminal record, from which the runtime root copies it (proposal P2 of `analyze-report.md`); where the terminal record was synthesized, a later engine start derives the value from the event `check.parallelism_lowered` in the event file of the run. Closed 2026-09-30 | F148-FR-014 |
| N-105-1 | Which component starts a detached command staged before, and with which environment? (a question of feature 105, reported in its repair report) | The process primitive of the kernel, started by feature 105, with the environment the check runner gives, which this feature supplies without starting a process. Closed 2026-09-30 (CQ-215) | F148-FR-019 |
| CQ-190 | May repository text declare the reads and writes of a verification command? | No. The declarations reach the check manifest only with the provenance of user configuration, the environment or a flag; an entry without a declaration counts as undeclared and runs alone (ruling P11). Closed 2026-09-30 | F148-FR-011 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was renumbered or reused.

| Item | Requirement or place | What changed |
|---|---|---|
| W-148-01 | Key Entities, "Contracts of feature 100 used", logical names | The result is a returned value; the stored record at `unit:<unitId>:check:<i>` is `specstride.check-result/1` of feature 116. The mapping of the fields is in `data-model.md` |
| W-100-02 | "Out of scope"; "Assumptions" | Owner of fingerprints, the protected set and toolchain profiles: 116 |
| W-111-02 | F148-FR-014 | The event of the lowering is named: `check.parallelism_lowered`, with its fields. The field `verificationParallelism` of the run record is named |
| W-111-02 | F148-FR-012 | The record of an admission or refusal is named: `check.admission`, with its fields |
| W-111-02 | F148-FR-010 | The integrity event is named: `integrity.noted`, `kind` `manifest-hash` |
| W-111-02 | F148-FR-007, F148-FR-017 | The fields of `check.started` and `check.ended` are named as the catalogue spells them; `batch`, `slot` and `concurrent` are named |
| W-X-06 | User Story 5; F148-FR-007, F148-FR-009, F148-FR-016 | "execution" for one execution of a command; "run of steps" is kept as the name of row 235 of annex X §X.6 and is defined as never the logical run |
| W-X-11 | F148-FR-002; "Rows of the `parity` profile" | "row 125 of annex X §X.7" in place of "row requested" |
| W-X-12 | "Closed sets" | Rows 233, 235 and 236 of annex X §X.6 in place of "new"; `DEADLINE` of row 233 is named with its owner 105 |
| W-105-03 (CQ-190) | F148-FR-011 | Declared reads and writes are taken from the frozen check manifest only and never come from repository text; new test CT-148-208; `assumption: CQ-190` |
| Re-check B-8.7 (N-105-1) | F148-FR-019 (new) | The environment of the kind `command` is obtainable without starting a process, for the detached command staged before that feature 105 starts with the kernel primitive (F105-FR-035); test CT-148-119, tasks T065 and T066 |
