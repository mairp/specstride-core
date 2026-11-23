# Feature Specification: Codex harness adapter

**Feature Branch**: `131-adapter-codex` (a label: Spec Kit creates no branch in this repository; the directory is `specs/131-adapter-codex`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 131-adapter-codex of Specstride: the Codex harness adapter, specified against the harness seam exactly as the Claude adapter is: a harness descriptor, optional code hooks and recorded fixtures. Detection and version; the login check that reads no credential; the proposer, headless, with a JSONL stream and the operating-system sandbox of the harness; continuation by session id; the critic in two forms, (a) the harness under its read-only sandbox in the working tree with the proposer's notebook, handoff and outbox moved out and the workspace part denied, and (b) a direct call to the provider's API with a key; the proof of each form; quota signals and usage; the tier and terms rows per audience; the containment ceiling; the adapter's doctor checks; the facts that need a fixture capture before the specification freezes."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority: rulings 1, 2, 7, 32, 32b, 34, 36, 37, 38, 57, 57a, 59, 60, 66, 67, D1, P2, P13), `architecture.md` (sections 5, 14, 17), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 131-adapter-codex, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`, annexes A, B, C, E, G, X), feature 141 (`specs/141-parity-oracle/`, §O.1 to §O.7), the traceability files, the baseline of Specstride at `9cab15d` (read with `git show`), and the research reports R6, R8v, R11, R14, R20, R24 and R29v. The installed `codex` command was read with `--version` and `--help` only, on 2026-09-29.

## What this feature is

Codex is an agent CLI of a model vendor. This feature is its harness adapter: the data and the
small amount of code that let the engine run a proposer pass, and a critic-class call, on Codex
through the harness port, without the engine knowing that it is Codex.

Feature 100 states the interface of the harness port (EP-02). The harness seam owns the registry
and the port. This feature is one tested harness adapter of Wave 1, specified against the seam the
same way the Claude adapter is: a harness descriptor, optional code hooks and recorded fixtures.
It owns no extension point.

Two things make this adapter different from the others.

1. **Two forms of critic.** The baseline reaches the Codex critic by a direct HTTP call with an API
   key. The owner ruled that the harness under its own read-only sandbox counts as a critic as
   well (rulings 57, 57a), in the working tree, so that a consumer with a login and no API key can
   use it. The direct call stays for consumers with a key. The first form is a stated exception to
   the rule that a critic holds no tools (constitution, Principle IX). Its exception is limited to
   reading project files (ruling D1).
2. **Facts that are not yet known.** Whether the sandbox can deny reads of named paths, what the
   stream shows of the sandbox mode, what the harness emits at an account limit, whether session
   files can live outside the harness's home, and whether several headless processes may share one
   home are all `unverified`. Five fixture captures settle them. This specification says what the
   adapter does in each case, so that it is correct whichever way the captures come out.

**In scope**: detection and version; the login check that reads no credential; the descriptor, the
code hooks and the stream mapping; the proposer invocation under the `parity` profile and outside
it; the sandbox mode and the containment ceiling; continuation and session state; the critic of
form (a), its withheld paths, its read-denial confirmation and its proof; the critic of form (b),
its context window and its spending cap; quota signals and usage; the tier and terms rows per
audience; the doctor checks; the fixture captures and the paid probes.

**Out of scope**:

| Out of scope | Owner | Reached through |
|---|---|---|
| The port, the second form of the `completion` level as a contract, the generic endpoint client, containment levels | 109 | Feature 100, annex C §C.1, §C.3, §C.15 |
| Moving the proposer's files out before a critic with read tools starts, and the list of withheld paths | 117 | Feature 100, annex C §C.4 |
| The place of a critic with read-only tools in the critic order | 124 | Feature 100, annex C §C.6 |
| The registry of stream readers and the normalized record set | 126 | Feature 100, annex C §C.5 |
| What a quota class does to the run | 127 | Feature 100, annex C §C.13 |
| The terms gate as policy, the terms data and the audience | 147 | Feature 100, annex C §C.12 |
| The spelling of config keys and the secret resolvers | 110 | Feature 100, annex X §X.2; annex C §C.11 |
| The vendor's TypeScript SDK as a transport | Not in Wave 1 | R6, recommendation 1 |
| Other endpoints that speak the same chat format | The generic descriptor of 109; later adapters | Feature 100, annex C §C.2 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A proposer pass runs on Codex, inside its sandbox (Priority: P1)

An operator names Codex as the proposer. The engine starts every pass through the harness port.
Under the `parity` profile the pass is started exactly as the baseline starts it. Otherwise the
pass runs headless, in the operating-system sandbox of Codex, with a JSONL stream, and the
operator's real configuration home is left as it was.

**Why this priority**: Every run that uses Codex passes through this invocation. Owner ruling 32
makes its parity binding for the release.

**Independent Test**: Run fixture families FX-01 (`harness-codex`) and FX-26 (`codex-text`) of
feature 141 under the `parity` profile with the stub executable named `codex`. The stub
transcript (argument list, names of environment variables, prompt) equals the reference's. Then
run the conformance suite with a fake binary and a recorded JSONL stream, outside the profile.

**Acceptance Scenarios**:

1. **Given** the `parity` profile, **When** a pass starts, **Then** the argument list is `exec`, the allow-all flag, `--model M` only if a model was named, and the prompt as one positional argument, and the output is read as raw text (F131-FR-008).
2. **Given** no profile, **When** a pass starts, **Then** the sandbox mode is `workspace-write`, the prompt is on standard input, the stream is JSONL, and no allow-all flag is passed (F131-FR-009, F131-FR-010).
3. **Given** a second pass of the same phase attempt and continuation on, **When** it starts, **Then** it continues the session id that the first pass returned, and never "the latest session" (F131-FR-012).
4. **Given** a new phase attempt, a relaunch, a watchdog kill, a second repair, an escalation or any critic call, **When** it starts, **Then** the session is fresh (F131-FR-012).

---

### User Story 2 - A consumer with a login uses Codex as critic, and it cannot act (Priority: P1)

A consumer has the Codex login and no API key. The critic runs as Codex under its read-only
sandbox in the working tree. It may read project files. It cannot write, run a command that
writes, or reach the network, and it cannot read the history of repairs.

**Why this priority**: It is the owner's exception to the rule that a critic holds no tools. The
safety of the gate rests on the proof of this form.

**Independent Test**: With a fake binary and a fixture tree: the notebook, handoff and outbox
exist before the call, are absent from the tree during it, and are back after it. Every call
record shows the read-only mode and the network off. A call whose read denial is not confirmed is
not made.

**Acceptance Scenarios**:

1. **Given** a critic of form (a), **When** the call starts, **Then** the mode is `read-only`, the session is ephemeral, the user configuration and project rules are ignored, the network is off, and the prompt is on standard input (F131-FR-016).
2. **Given** the notebook, handoff and outbox inside the working tree, **When** a call of form (a) is about to start, **Then** it does not start (F131-FR-018).
3. **Given** a harness that cannot deny reads of a listed path, **When** the adapter tries to confirm the denial, **Then** form (a) is not used: a configured critic is refused with `critic_not_toolless`, and an automatically picked one is passed over and announced (F131-FR-019).
4. **Given** a completed call, **When** its record is read, **Then** it shows the sandbox mode, the network setting, the ephemeral flag, the session id of the first stream record and the confirmation, and no session id that a pass used (F131-FR-020, F131-FR-021).

---

### User Story 3 - A consumer with an API key keeps the direct call (Priority: P1)

A consumer has an API key. The critic is one direct call to the provider's chat endpoint. It is
tool-less by construction. Under the `parity` profile it behaves as the baseline's critic does.

**Why this priority**: The direct call is the parity side of the critic and is proven by FX-06, FX-07 and FX-25.

**Independent Test**: Run FX-06, FX-07 and FX-25 through the stub critic over HTTP. The transcript is compared in transport-neutral form.

**Acceptance Scenarios**:

1. **Given** the direct call, **When** it is made, **Then** it is one user message, a bearer key and no output limit (under parity), and an empty choice list raises (F131-FR-025).
2. **Given** an empty key under the `parity` profile, **When** the call is made, **Then** the error names the missing variable, no request is sent, and the phase gate scores a failed critic call (F131-FR-027).
3. **Given** the `parity` profile and a model not in the table, **When** the window is looked up, **Then** it is 128,000; **Given** no profile, **Then** the model does not qualify (F131-FR-029, F131-FR-030).

---

### User Story 4 - An account limit is a pause and usage is counted (Priority: P2)

Codex reaches the 5-hour or the weekly limit of the account. The run waits instead of counting an
error, after a confirming probe. Every turn's tokens are counted, including those of a killed pass.

**Why this priority**: A quota failure that burns the relaunch budget cost a real run hours.

**Independent Test**: Classifier fixtures for the limit text and for the two API cases; a recorded JSONL stream replayed through the mapping gives usage per turn.

**Acceptance Scenarios**:

1. **Given** the message "Try again in …" under a login, **When** it is classified, **Then** the class is `quota_window` with confidence `text` (F131-FR-032).
2. **Given** an API key and status 429, **When** it is classified, **Then** the class is `rate_limit_transient`; **Given** the body code for exhausted credit, **Then** `quota_credit` (F131-FR-033).
3. **Given** a stream with two completed turns and a killed third, **When** usage is read, **Then** the first two turns are counted and the third is unknown, never zero (F131-FR-035).

---

### User Story 5 - A maintainer knows which facts are dated and which are not (Priority: P2)

A maintainer reads the adapter's facts. Every one has a `verified-on` date and the version pin, or
is marked `unverified` with the check that would settle it. The five captures are tasks that come
first in the list, each marked paid or not paid. No test and no other task waits for one.

**Why this priority**: Owner ruling 32 moved this harness into Wave 1 on facts that are partly unproven.

**Independent Test**: List every fact of the descriptor, the fixtures and the terms rows; each has a date and a pin or an `unverified` mark with its check.

**Acceptance Scenarios**:

1. **Given** the installed version outside `>=0.153.4 <0.154`, **When** the doctor runs, **Then** it warns (F131-FR-002).
2. **Given** the doctor, **When** it lists this adapter, **Then** it names the facts that are still `unverified` (F131-FR-006).
3. **Given** a capture is made, **When** its fixture is recorded, **Then** the fixture carries the harness version and the status of the requirement it closes is updated (F131-FR-037).

---

### Edge Cases

- The harness's own process needs the network to reach the model. "Network off" in this specification means the network for commands that the model runs in the sandbox, and it does not mean that the harness cannot reach its provider (F131-FR-016).
- The sandbox cannot start on this machine (for example the operating system forbids the mechanism it needs): the pass fails with a typed failure and the doctor says why; the adapter never falls back to the allow-all flag by itself (F131-FR-011).
- A package install or another network step inside a proposer pass fails, because the network is off at the ceiling C2. The record says the network was off. Wave 1 adds no option to turn it on (see Assumptions).
- The read-denial probe cannot be run, or a read succeeds: form (a) is not used (F131-FR-019).
- The first stream record does not state the sandbox mode: the fact comes from the adapter's own record of the invocation, and the record says so (F131-FR-020).
- The stream ends without `turn.completed` or `turn.failed`: the reader reports a missing terminal record (F131-FR-036).
- A model with no known window is named for form (b) outside the `parity` profile: it does not qualify and no default window is used (F131-FR-030).
- An API key is present in the environment of the proposer and is meant for the critic: the environment of each call is an allow-list and holds only the key of its own role (F131-FR-015).
- The login status command exits with a code the adapter does not know: the result is `unprobed`, never `present` (F131-FR-003).
- A value outside a closed set of this feature: the reader does what the table "Closed sets" says.

## Requirements *(mandatory)*

Every requirement follows `STAGE-B-RULES.md` section 4. A requirement with an as-is origin names
the test of the traceability files. A new requirement names a test `CT-131-<n>`, where n is the
number of the requirement. Fixture families are those of feature 141, §O.2. The exact flags of the
harness, with their version pin, are in `plan.md`; this specification says "the allow-all flag",
"the sandbox mode" and so on. The word "backend" in a quoted message is an as-is literal.

In compatibility output a message that the baseline starts with the name of an implementation
file starts with the logical component name of feature 100, annex X §X.8 (rule N-15).

### Functional Requirements

#### G1 — Detection, version, login check, descriptor, tier and terms rows, doctor

- **F131-FR-001**: The Codex harness adapter MUST be a tested harness adapter of the one open registry: one harness descriptor of kind `cli` (`descriptorVersion: 1`) with the provider identity `openai`, plus code hooks for the read-only form of the critic, a version range and a `verified-on` date. It MUST offer the level `proposer` and the level `completion`, the second in both forms of feature 100, annex C §C.3, and the transports `subprocess` (proposer; critic form (a)) and `direct-call` (critic form (b)). Under the `parity` profile the entry MUST serve the proposer and the critic with no qualifier, name no stream format and declare no overlay, as the entry of the baseline does, and the stub executable MUST be named after the as-is command `codex`. Outside the profile the stream mapping of F131-FR-036 applies. No control flow of the core MUST test the harness's name.
  - origin: C-035; B-0428
  - disposition: ported
  - test: PT-131-C-035-*
  - divergence: DV-064
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the entry of the baseline: proposer and critic, qualifier `none`, no stream, no overlay (rows 26, 27, 28 of annex X §X.7)

- **F131-FR-002**: Detection MUST establish presence, version and the existence of the configuration home free of charge, with the version command of the harness and nothing that changes state. The executable MUST be resolved to an absolute path and recorded with its version (F100-FR-080). The tested range MUST be `>=0.153.4 <0.154`, `verified-on` 2026-09-29; the flags of this specification were checked by the help of the installed command only, and no run exists. The doctor MUST warn when the installed version is outside the range. Each pass MUST record the harness version, and a change of version between two passes of one run MUST be a warning. Nothing is downloaded to reach a pin.
  - test: CT-131-2
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 (check: `--version` and `--help` of the command, of `exec`, of `exec resume` and of `login`; verified-on: 2026-09-29; pin: codex-cli 0.153.4)

- **F131-FR-003**: At auth tier 1 the preflight of a role MUST ask the login status command of the harness and read its exit code and its first line of output. At auth tier 2 the preflight MUST ask the secret resolver whether the key reference exists. The adapter MUST NEVER open, read or copy the harness's credential file or key store, and MUST NEVER pass a credential in an argument list. The preflight MUST make no model call. Its result MUST be `present`, `absent` or `unprobed`; an exit code that the adapter does not know MUST give `unprobed`.
  - test: CT-131-3
  - ep: EP-02 `specstride.harness/1` (implements); EP-10 `specstride.secret-resolver/1` (consumes)
  - status: unverified (check: the exit code and the first line of the login status command with a login and without one, on Linux and on macOS; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-004**: The operation `capabilities` MUST report, each with its provenance or as null: the containment ceiling C2 (`adapter`); continuation by session id (`adapter`); the identity of provider (`openai`) and model, for the diversity test; the switches of native memory (F131-FR-014); the critic modes (`none` for the tool-less mechanism of the subprocess transport, `structural` for the direct-call transport, and read-only tools supported for the subprocess transport under F131-FR-016 to F131-FR-020); the cost class (`subscription` at auth tier 1, `metered` at auth tier 2); the context window (F131-FR-029, F131-FR-030). `concurrentSessions` MUST be null and the process-level spending limit MUST be null and the model-tier ladder MUST be null: model ids are configuration, and without a ladder from the consumer an escalation is skipped for this harness and recorded. `betweenPasses` MUST return `continue`. A capability that no run has shown MUST be marked `unverified`.
  - test: CT-131-4
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: capture 5, several headless processes under one configuration home and one login with separate session stores; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-005**: The adapter MUST supply the facts of its rows of the terms-gate data. Provider `openai`. Auth tier 1 (the login of the consumer, through the CLI the consumer installed): for the audience `personal` the status `conditional`, with the conditions the account holder's own trusted machine, no public or untrusted environment, no public or open-source CI, the login never copied by the product, and a limit signal treated as a stop; for the audience `distributed` the status `personal-only`. Auth tier 2 (an API key): `allowed` for both audiences. Auth tier 3: no `allowed` row, so it is refused. For the audience `distributed` the default auth tier MUST be 2, and auth tier 1 MUST be an opt-in that is off by default and marked "personal use only". Each row MUST carry source, access date, the quoted sentence and `verified-on`. The adapter handles no login token.
  - test: CT-131-5
  - divergence: DV-048; DV-003
  - ep: EP-11 `specstride.terms/1` (consumes)
  - parity: audience `personal` (row 34 of annex X §X.7)
  - status: unverified (check: the pages of the provider re-read within 30 days; documentation only, read 2026-09-29 by the research; verified-on: —; pin: —)

- **F131-FR-006**: The adapter MUST register these checks with the doctor: executable found and its resolved path; version inside the range; login status at auth tier 1, or existence of the key reference at auth tier 2; whether the sandbox of the harness can start on this machine, without a model call; the state of the read-denial confirmation of F131-FR-019; and one line that lists the facts of this adapter that are still `unverified`. A check MUST read and never write, MUST make no paid call, MUST read no secret value, and MUST keep to its time limit. The checks of executable and credential MUST be launch-blocking for a role in use; the check of version MUST be a warning. The checks of the sandbox, of the read-denial confirmation and of the unverified facts MUST be warnings: what follows from a sandbox that cannot start or from an unconfirmed denial is stated in F131-FR-011 and F131-FR-019.
  - test: CT-131-6
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F131-FR-007**: Every provider fact and harness fact of the descriptor, of the recorded fixtures and of the terms rows MUST carry a `verified-on` date and the version pin of the harness, or MUST be marked `unverified` with the check that would settle it. A fixture recorded from a capture MUST state the version of the harness that produced it. Facts that rest on documentation only, and every statement about macOS, MUST be `unverified`.
  - test: CT-131-7

#### G2 — Proposer: invocation, sandbox mode, continuation, session state

- **F131-FR-008**: Under the `parity` profile the proposer pass MUST be started as `exec`, then the allow-all flag of the harness (the one flag that removes the sandbox and the approvals together), then `--model M` only when a model was named, then the prompt as one positional argument, in this order. The flags that the Claude arm of the baseline passes MUST NOT be passed. The output MUST be read as raw text: no stream option, no session option, no memory flag and no standard input. The argument list, the names of environment variables and the prompt seen by the stub MUST equal those of the reference. The baseline marks this path "unverified on this host"; it is ported as written.
  - origin: C-058; B-0690; B-0691
  - disposition: ported
  - test: PT-131-C-058-*
  - divergence: DV-030; DV-031; DV-064
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: this is the parity form; the permission mode and argument list as at the baseline, mapped through the argument table of this harness adapter (rows 25, 26 of annex X §X.7)

- **F131-FR-009**: Outside the `parity` profile the proposer pass MUST be started as `exec` with the JSONL stream option, the sandbox mode `workspace-write`, approvals set to never, the working directory stated, and the prompt on standard input; the prompt MUST NOT be in an argument list. The mode MUST be stated on every call and recorded. A pass MUST NOT block on a permission prompt. The argument table that maps these settings to the flags of the pinned version is in `plan.md`. How approvals are set to never is `unverified`: in version 0.153.4 the help of `exec` shows no option for the approval policy, only a configuration override.
  - test: CT-131-9
  - divergence: DV-031; DV-030
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off; the argument list is that of F131-FR-008 (row 26 of annex X §X.7)
  - status: unverified (check: capture 2 records the approval policy in force under `exec` with the chosen configuration override; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-010**: The allow-all flag MUST be passed only under the `parity` profile, or where the consumer opted in to containment C0 in user configuration (`sandbox.level` with the value `C0`). The environment, a flag and project configuration MUST NOT give the opt-in (F100-FR-111); a value `C0` that comes from one of them MUST be treated as not given, and the pass runs contained. It MUST NOT be passed on any critic path. The adapter MUST NOT assert a sandbox by itself and MUST NOT set a variable that says the run is sandboxed.
  - test: CT-131-10
  - divergence: DV-030
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: as at the baseline: the allow-all flag is passed (row 25 of annex X §X.7)
  - assumption: CQ-183 (ruling 34, "only by opt-in in user config", is read as the user configuration only)

- **F131-FR-011**: The adapter MUST declare the containment ceiling C2 with the provenance `adapter`. At C2 a proposer pass runs in the sandbox mode `workspace-write`: commands run in an operating-system sandbox, the network is off by default, and the repository's own metadata directories are read-only. The control plane and the credential paths lie outside the write root, so the sandbox refuses writes to them; whether it also refuses reads of them is the unverified fact of F131-FR-019, and until capture 3 the adapter MUST report that fact as null and the doctor MUST say that the ceiling holds for writes. The runtime uses and announces the strongest level available (F100-FR-111). The adapter's check MUST tell, without a model call, whether the sandbox can start on this machine. Where it cannot start, the pass MUST end with the typed failure `capability_absent`, the doctor MUST say why, and the adapter MUST NOT fall back to the allow-all flag unless containment C0 was opted in, in user configuration only (F131-FR-010). Parallel units MAY use this harness only when `concurrentSessions` is declared true by a capture and the option's own rules hold.
  - test: CT-131-11
  - divergence: DV-030
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: as at the baseline: no containment (row 25 of annex X §X.7)
  - status: unverified (check: on Linux and on macOS the mechanism starts, the network is off, the metadata directories are read-only, writes to the control plane and to the credential paths are refused, and the harness's own file tools are confined to the write root; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-012**: Inside a phase attempt a later pass MAY continue the session by the session id that the first pass returned in the first record of its stream, through the resume operation of the harness with that id. The adapter MUST NEVER ask for "the latest session". A new phase attempt, a relaunch, a kill by a watchdog, the second repair of a unit, an escalation, a change of configuration and every critic-class call MUST start a fresh session. The drop rules are those of the pass loop.
  - test: CT-131-12
  - divergence: DV-010
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off; no invocation carries a continuation argument (row 10 of annex X §X.7)
  - status: unverified (check: the resume operation continues a session of a JSONL run, the usage of the continued pass is an increment, and the sandbox mode of the continued pass is the mode that the adapter states, although the help of the resume operation shows no sandbox option, only a configuration override; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-013**: Session state MUST live per phase attempt and MUST be removed when the phase attempt ends (F100-FR-113). At auth tier 2 it lives in the throwaway home of the phase attempt. At auth tier 1 the run never writes the real configuration home, and the harness adapter MUST NOT write, create, edit or remove a file in it, the removal of session state included; so session files must be kept outside it while the login stays in it. Whether the harness can do this is `unverified`. Until capture 4 shows that it can, and if it cannot, continuation MUST be off for auth tier 1 on this harness, a pass MUST persist no session state, and files carry the context. Where continuation is not in use, the pass MUST run without persisting session files, outside the `parity` profile. What the harness writes to its home by itself during such a pass is not an act of the harness adapter; capture 4 lists it, and it is the deviation from Principle VIII that `plan.md` records.
  - test: CT-131-13
  - divergence: DV-002; DV-010
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: overlay scope `none` (row 30 of annex X §X.7)
  - status: unverified (check: capture 4, session files kept outside the home while the login stays in the home, and what the harness writes to its home when it runs without persisting sessions; verified-on: —; pin: codex-cli 0.153.4)
  - assumption: CQ-143 (the reading nearest to the letter of Principle VIII and of ruling 36)

- **F131-FR-014**: Harness-native memory and project instruction files MUST be off for every critic-class call and off by default for the proposer. The opt-in for the memory of the proposer is `memory.native.proposer` (row 29 of annex X §X.7). The opt-in for the customisations of the proposer, which on this harness are the project instruction files, is `harnesses.codex.proposerCustomisations`, the generic key `harnesses.<id>.proposerCustomisations` with the id `codex` (row 131 of annex X §X.7): values `off` and `on`, default `off`, trust class widening. Neither opt-in MUST ever load anything into a critic-class call. The state of both MUST be recorded per run. Plugins, host hooks, skills and tool servers of the harness, the user configuration and the project rules MUST be off for every call at auth tier 1, by the switches of the harness. A customisation with no known switch MUST be reported as null in `capabilities`, and the doctor MUST warn. Under the `parity` profile no flag about memory or customisation is passed.
  - test: CT-131-14
  - divergence: DV-047; DV-002
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `as-is`: no flag about memory and no flag about customisations is passed (rows 29 and 131 of annex X §X.7)
  - status: unverified (check: the switches that turn off memory and project instruction files in this version take effect, shown in a recorded call; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-015**: The environment of every call MUST be an allow-list: the search path, the locale, the home or its overlay, the variable that carries the API key at auth tier 2, and what the descriptor names. It MUST hold no other provider key of the consumer. The key of the critic MUST never be in the environment of the proposer, and the reverse. A key MUST reach the harness in the environment of the process and never in an argument list. The adapter MUST start every process in a process group of its own and MUST switch the harness's own telemetry off where a switch is documented; where none is, the switch is null.
  - test: CT-131-15
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the names of variables the stub saw are compared in the transcript (row 25 of annex X §X.7)

#### G3 — Critic, form (a): the read-only sandbox

- **F131-FR-016**: A critic of form (a) MUST start the harness with the sandbox mode `read-only`, as an ephemeral session, with the user configuration and the project rules ignored, with the network off for commands that the model runs, in the working tree, with the prompt on standard input and the JSONL stream on. The harness MAY read project files by itself. It MUST NOT be given an option that lets it write. No critic path MUST ever receive the allow-all flag. Native memory and project instruction files MUST be off (F131-FR-014). The call MUST keep to the time limit of a critic-class call, and at the limit the adapter MUST end the process and every process of its group.
  - test: CT-131-16
  - divergence: DV-081; DV-001
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: not used; under the profile the critic is the direct call of F131-FR-025 (row 28 of annex X §X.7)
  - status: unverified (check: under the read-only mode a command that opens a network connection is refused; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-017**: A critic of form (a) MUST NOT be able to write a file, to run a command that writes, or to reach the network from the sandbox. Tests with the fake binary MUST assert the mode and the network setting on every call. One logged live probe MUST attempt a seeded write and a seeded network access from the critic and MUST show that both are refused.
  - test: CT-131-17
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the live probe of F131-FR-038, form (a), refuses the write and the network access; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-018**: Before a call of form (a) starts, the adapter MUST read the record of withheld paths (feature 100, annex C §C.4). Every path under `moved` (the proposer's notebook, handoff and outbox) MUST be outside the working tree, and `deny` MUST hold the five locations: the workspace part, the control plane, the event stream, the worker root and the tree store. The adapter MUST refuse to start otherwise. The sandbox MUST be started so that reads of every location in `deny` are refused. The runtime moves the files out and back (F100-FR-088); the adapter never moves, reads or deletes them, and after the call, however it ended, leaves the restoration to the runtime.
  - test: CT-131-18
  - divergence: DV-081
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F131-FR-019**: Before every call of form (a) the adapter MUST confirm that the sandbox denies reads of every path of `deny`, by a probe that reads a planted file at each location under the same sandbox settings and makes no model call, and MUST write the result to `confirmed`. Where the harness cannot deny reads of named paths, or the probe cannot be run, or a read succeeds, `confirmed` MUST be false and form (a) MUST NOT be used. A configured critic MUST then be refused with `critic_not_toolless`. An automatically picked critic MUST be passed over for the next candidate of the critic order, and the passing over MUST be announced and recorded. Whether the sandbox can deny reads is `unverified`.
  - test: CT-131-19
  - divergence: DV-081
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: capture 3, the read-only sandbox denies reads of named paths outside and inside the working tree; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-020**: For every call of form (a) the call record MUST show the sandbox mode, the network setting, the ephemeral flag, the session id of the first record of the stream, and `confirmed`. A call whose record lacks one of them, or shows another mode, another network setting, a session that is not ephemeral, or no session id, MUST fail the proof: a configured critic MUST be refused with `critic_not_toolless`, which halts the run (engine exit 3, stop reason `critic_config`), and an automatically picked critic MUST be passed over for the next candidate of the critic order, announced and recorded (F100-FR-230). The session proof of this harness is case (2) of F100-FR-230 (the harness gives the id itself, and the id of the first record equals no session id of any pass of the run, F131-FR-021), and the call record MUST name that case. A fact that the first record does not state MUST be taken from the adapter's own record of the invocation, and the call record MUST say from which of the two sources each fact came.
  - test: CT-131-20
  - divergence: DV-081
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: capture 2, what the first record of the stream shows of the sandbox mode and of the session; verified-on: —; pin: codex-cli 0.153.4)
  - assumption: CQ-117 (closed by the owner on 2026-09-30 on this reading; F100-FR-230, case 2, states it)

- **F131-FR-021**: A critic-class call on this harness MUST start a fresh session, MUST NEVER resume a session, and MUST NEVER ask for the latest one. The session id in its record MUST NOT equal any session id that a pass of the run used. A call whose session id equals one that a pass used MUST fail the proof as F131-FR-020 states (F100-FR-230). The critic MUST NEVER approve its own session. The critic-diversity rule and its warning are those of feature 100 (F100-FR-024), stated for this harness in F131-FR-040: this harness as critic on the same model as the proposer gives the warning and never blocks a run.
  - test: CT-131-21
  - ep: EP-02 `specstride.harness/1` (implements)

- **F131-FR-022**: A critic of form (a) MUST receive the grounding snapshot and, where one exists, the fact block in its prompt, and its verdict MUST be bound to the nonce of the call. The prompt MUST be handed over on standard input, and the adapter MUST add nothing to it beyond what the calling convention needs. On conflict the snapshot and the disk beat prose, so what the critic read by itself never overrides them. The reply MUST be the final message of the stream; the text of a tool or a command MUST never be read as the reply. A call whose process exits with a code other than 0, or whose stream shows a failed turn or no final message, MUST give no verdict and MUST be reported as a failed critic-class call, which the phase gate scores as the baseline scores one.
  - test: CT-131-22
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F131-FR-023**: The specification, the descriptor and the doctor MUST state that form (a) is a stated exception to Principles III and IX, limited to reading project files, and MUST state the residual risk: repository text reaches this critic without passing the grounding snapshot. The owner accepted the risk (ruling 57a; threat T-48). The residual risk MUST be part of what `capabilities` reports for the form.
  - test: CT-131-23
  - ep: EP-02 `specstride.harness/1` (implements)

- **F131-FR-024**: The adapter MUST offer form (a) where the credential is the consumer's login (auth tier 1) and form (b) where it is an API key (auth tier 2). Form (b) MUST stay the form for a consumer with a key. The form in use MUST be announced at launch and recorded for every call. Under the `parity` profile the critic MUST be form (b), and the stub critic MUST serve both forms so that the transcript is compared in transport-neutral form. The place of form (a) in the critic order is that of feature 100, annex C §C.6.
  - test: CT-131-24
  - divergence: DV-001; DV-081
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the critic of each harness in its as-is transport and mode (row 28 of annex X §X.7)

#### G4 — Critic, form (b): the direct call

- **F131-FR-025**: The critic of form (b) MUST be one call through the generic endpoint client of the kind `openai-chat`: an HTTP POST to the path of the chat call under the base address, with a bearer key, one user message that holds the prompt, and the model. Under the `parity` profile no output limit MUST be sent. A reply with an empty choice list MUST raise an error whose text names the address and the first 300 bytes of the body. The reply text MUST be the content of the first choice, or empty. The call is tool-less by construction. The key MUST be sent only to the host it was declared for, a plain endpoint MUST be refused unless it is the loopback address, and redirects MUST be refused (F100-FR-086). A failed call MUST be scored by the phase gate as the baseline scores a failed critic call.
  - origin: C-066; B-0981
  - disposition: translated
  - test: PT-131-C-066-*
  - divergence: DV-001; DV-081
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: the as-is mode: no output limit, the transcript compared in transport-neutral form (row 28 of annex X §X.7)

- **F131-FR-026**: The base address of the critic MUST be a setting with the default `https://api.openai.com/v1` and the as-is variable `OPENAI_BASE_URL` as an alias of its key. The path of the chat call MUST be appended after a trailing slash is removed.
  - origin: C-061; B-0832
  - disposition: translated
  - test: PT-131-C-061-*
  - divergence: DV-027; DV-081
  - parity: the alias table of annex X §X.8; the base address is as the fixture sets it (row 28 of annex X §X.7)

- **F131-FR-027**: The critic of form (b) MUST need an API key, given as a secret reference whose as-is form is the variable `OPENAI_API_KEY`. An empty key MUST raise the error `this critic path needs OPENAI_API_KEY` before any request is sent. Under the `parity` profile the error is raised inside the call and the phase gate MUST score it as it scores a failed critic call, as the code of the baseline does: the scenario `FX-07/codex-missing-key` ends on the reference with engine exit 1 and the stop reason `critic_unavailable`, after the phase attempts scored MALFORMED. Outside the profile the preflight of this adapter reports `absent` for the key reference (F131-FR-003) before any call, and what the launch does with it is the rule of feature 100 for a missing critic credential (register row DV-117), not of this adapter; a call that is reached with an empty key all the same MUST raise the same error and send no request. The key MUST reach the request only as the bearer credential, and MUST appear in no argument list, event, log, prompt or record.
  - origin: C-061; B-0833
  - disposition: translated
  - test: PT-131-C-061-*
  - divergence: DV-027; DV-081; DV-117
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - parity: the alias table of annex X §X.8; the error is raised at the call and scored as a failed critic call, as at the baseline (row 28 of annex X §X.7)
  - assumption: CQ-187 (a missing critic credential is a failed critic call under the `parity` profile, as the code does)

- **F131-FR-028**: The model of the critic MUST be a setting whose default in the descriptor data is `gpt-5`, with the as-is variable `SPECSTRIDE_CODEX_CRITIC_MODEL` as an alias of `roles.critic.model` for this harness. The same value MUST be the key of the lookup of the context window.
  - origin: C-061; B-0831
  - disposition: translated
  - test: PT-131-C-061-*
  - divergence: DV-027; DV-081
  - parity: the alias table of annex X §X.8; the default is the descriptor's data (row 28 of annex X §X.7)

- **F131-FR-029**: Under the `parity` profile the context window of the critic MUST be looked up in the table of the baseline: `gpt-5` 400,000, `gpt-5.5` 1,000,000, `gpt-5.4` 1,050,000 and `gpt-5.4-pro` 1,050,000, and 128,000 for a model that is not in the table. A window that the consumer states explicitly always wins.
  - origin: C-066; B-0910
  - disposition: ported
  - test: PT-131-C-066-*
  - parity: the as-is window table with its fallback, which is part of the as-is mode of row 28 of annex X §X.7
  - divergence: DV-106
  - assumption: CQ-145 (the fallback window is kept under the `parity` profile only; it is the deviation from Principle IX that `plan.md` records)
  - status: unverified (check: the pages of the provider for the model windows; the baseline's code comment dates the table 2026-09-06; documentation only; verified-on: —; pin: —)

- **F131-FR-030**: Outside the `parity` profile the context window of the critic MUST be taken, in this order: the consumer's declaration; the model-list endpoint, where it reports a window; the table of this adapter, which is data with a date and the provenance `adapter`. Where a declared and an effective window differ, the smaller MUST be used. This holds for both forms: a critic of form (a) MUST run on a model that the role plan names and whose window is known, and a model with no known window MUST NOT qualify for an automatic pick, a critic that the consumer configured on such a model with no declared window MUST be refused by this adapter, and neither MUST get a default window (F100-FR-231). The window in force and its source MUST be recorded with the call. The value 128,000 MUST be used under the `parity` profile only.
  - test: CT-131-30
  - divergence: DV-106
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the fallback is part of the as-is mode (row 28 of annex X §X.7); it is used under the profile only
  - status: unverified (check: whether the model-list endpoint of the provider reports a context window; verified-on: —; pin: —)

- **F131-FR-031**: A call of form (b) MUST honour the budget cap that it is given. It MUST estimate the cost of the call from the size of the prompt, the output limit if one is sent, and the prices of the descriptor with their date. It MUST NOT send the call when the estimate exceeds the remaining cap; the failure is the typed failure `quota_exhausted` with the quota class `budget_cap`. A cap with no prices to estimate from MUST refuse the call. A cap of null means no cap. That an automatically picked critic on a metered endpoint has a cap is enforced by role resolution; this adapter enforces the cap it is given. Outside the `parity` profile an output limit MUST be sent when the caller passes one.
  - test: CT-131-31
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: not used; no fixture sets a cap, and no output limit is sent (row 28 of annex X §X.7)

#### G5 — Quota signals and usage

- **F131-FR-032**: With a login (auth tier 1), a failure whose text says that the 5-hour or the weekly window is reached ("Try again in …") MUST be classified `quota_window` with the confidence `text`, `resetsAt` taken from the text where it can be read and otherwise null, and `retryable` true. The text MAY appear in an error record of the stream, in standard error or in the reply; the classifier MUST look in all three. The run pauses only after the confirming probe of feature 100, annex C §C.13. A quota failure MUST NEVER be classified `agent_failure`.
  - test: CT-131-32
  - divergence: DV-005
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not observable; the stub agents emit no quota signal (row 39 of annex X §X.7)
  - status: unverified (check: capture 1, the record and the exit code at a login limit; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-033**: With an API key (auth tier 2), the status 429 without the body code of exhausted credit MUST be classified `rate_limit_transient` with the confidence `status`; the body code of exhausted credit (`insufficient_quota`) MUST be classified `quota_credit` with the confidence `status`, which leads to the state `blocked-on-human`; the status 401 MUST be classified `auth` and reported as an authentication failure that names what to fix. The status and body MUST come from the HTTP reply of form (b) or from the error record that carries them in a proposer pass. What matches no entry MUST be `provider_other` with the confidence `text`. Every classification MUST carry a value of `retryable`, and the value MUST follow the class, as feature 100, annex E §E.3, writes it for a stop: true for `quota_window`, `rate_limit_transient`, `overload`, `agent_failure` and `provider_other`; false for `quota_credit`, `auth`, `context_window` and `budget_cap`. No entry of this adapter MUST lack the value or state another one.
  - test: CT-131-33
  - divergence: DV-005
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not observable (row 39 of annex X §X.7)
  - status: unverified (check: a mocked endpoint, or one small logged call, gives a 429 with and without the body code of exhausted credit; documentation only; verified-on: —; pin: —)

- **F131-FR-034**: The adapter MUST NOT report the confidence `structured` for a Codex quota signal until capture 1 has recorded a structured quota record, or has shown that none exists. Capture 1 MUST record the record, its fields and the exit code of the harness at a login limit into a fixture. Until then the classification is by text and by the stall of the watchdog. When the capture is made, the classifier entries MUST be changed as data, with no change of code.
  - test: CT-131-34
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - status: unverified (check: capture 1; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-035**: The adapter MUST report usage per turn from the record that completes a turn: input, cached input and output tokens, as increments. A value that the record does not carry MUST be null, never zero. A killed pass MUST keep the usage of the turns that completed, and the turn in flight MUST be unknown. The usage of a call of form (b) MUST be taken from the usage field of the reply where there is one, and otherwise be null. The cost MUST be null unless it is computed from prices with a date in the descriptor. A cost under a login MUST be labelled notional; under an API key it is `metered`.
  - test: CT-131-35
  - ep: EP-02 `specstride.harness/1` (implements)

#### Stream mapping, fixture captures, probes and conformance

- **F131-FR-036**: The mapping from the records of the JSONL stream to the six normalized records of feature 100, annex C §C.5, MUST be data of the descriptor and not code: the record that starts a thread gives `init` with the thread id as the session id; a completed item that is an agent message gives `text`; a completed item that is a command, a file change or a tool call gives `tool`; the record that completes a turn gives `usage` and a successful `terminal`; the record that fails a turn and the error record give `error`, the first also a failed `terminal`; every other record is dropped with a diagnostic event. A stream that ends without a completed or a failed turn MUST be reported as `missing_terminal`. The stream reader is that of the stream seam; this adapter supplies the mapping and its recorded fixtures.
  - test: CT-131-36
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: not used; under the profile the output is raw text and the reader synthesizes `init` and `terminal` (row 26 of annex X §X.7)
  - status: unverified (check: the kinds and fields of the item records in streams recorded by captures 1 and 2; only the event names are documented; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-037**: The five fixture captures MUST be the first tasks of the feature, before the specification freezes: (1) the record that the stream emits when a login limit is reached, and the exit code; (2) what the first record of the stream shows of the sandbox mode and the session; (3) whether the read-only sandbox can deny reads of named paths; (4) whether session files can live outside the home; (5) whether several headless processes may run under one home. Each MUST be a scripted capture or one small call, allowed only as an explicitly authorized probe, and MUST be logged with its date, its command, the harness version and its result. Each capture MUST be marked paid or not paid. Captures 1, 2, 4 and 5 are paid: each needs a run of `exec` against the provider, which calls a model, also where the credential is a login. Capture 3 is not paid: it reads planted files under the harness's own sandbox command and calls no model; that its result also holds under `exec` is shown by a seeded read in the live probe of form (a) (F131-FR-038). Each result MUST be stored as a fixture that states the version, and the status of the requirement it closes MUST be updated. A capture blocks only the closing of the status of the requirements that wait for it. No test and no implementation task MUST wait for a capture: the tests run on the fake binary, the fake endpoint and hand-written streams, a test that needs a captured fixture MUST be a skip with its reason until the fixture exists, never a pass, and a fact that waits for a capture stays `unverified`. This feature runs none of them.
  - test: CT-131-37
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the five captures made and logged; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-038**: There MUST be one logged live probe for each of the proposer, the critic of form (a) and the critic of form (b), and no other paid call than the three probes and the captures marked paid (F131-FR-037). A check of a `status:` line that needs a model call MUST be made inside one of them and never as a further call. The probe of form (a) MUST also attempt a seeded read of a planted file at a withheld location. Every task that calls a model MUST be marked paid and MUST NOT be a precondition of a test that is not paid. A probe is paid: it MUST say so, MUST state its cost where the harness reports one, and MUST be logged with its date, command, harness version and result. No test, no CI job and no run of the runtime MUST make a paid or external call (Principle XII). This feature runs none of the probes.
  - test: CT-131-38
  - status: unverified (check: the three probes and the four paid captures made and logged; verified-on: —; pin: codex-cli 0.153.4)

- **F131-FR-039**: The adapter MUST pass the conformance suite of the harness port (F100-FR-017) with a fake binary and a fake endpoint: argument list, standard input, environment and clean-up asserted; recorded JSONL streams replayed through the mapping; classifier fixtures for the limit text and for the two API cases. The suite MUST make no paid or external call.
  - test: CT-131-39
  - ep: EP-02 `specstride.harness/1` (implements)

#### Critic diversity (added by the repair of 2026-09-30)

- **F131-FR-040**: For every critic-class call, of form (a) and of form (b), the adapter MUST supply the identity that the diversity test needs: the provider and the model id that is sent, or null where it does not know one. For form (b) the identity of the provider MUST come from the host of the endpoint and not from a label of the descriptor; where the base address is not the provider's own host and the real model is not known, the model MUST be reported as null. The critic-diversity rule is that of feature 100 (F100-FR-024; role resolution, annex C §C.6): the critic-diversity warning MUST be raised when, and only when, the critic and the proposer of a phase resolve to the same model (the result `same-model` of the diversity test), or the test gives the result `unverified`, which a null identity does. A shared provider alone (the result `same-provider`, for example this harness as proposer and as critic on two models) and a shared model tier alone MUST NOT raise it. A higher effort on the same model MUST NOT count as a different model: it is allowed, and the warning MUST be raised. Before every critic-class call on this harness the engine compares the model of the call, as this adapter reports it, with the models that produced passes in the phase attempt; a match raises and records the warning, and the call proceeds. The warning has one name, "critic-diversity warning". It MUST be recorded with the call and in an event, MUST be shown by the doctor, and MUST NEVER block a launch, a run or a call. The consumer MAY silence the line; the record and the event MUST stay. The engine applies the rule; this adapter supplies the identity and the fields of the call record.
  - test: CT-131-40
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: not printed (rows 19 and 92 of annex X §X.7); every fixture names the critic (row 35)

### Key Entities

| Entity | What it is |
|---|---|
| Codex harness adapter | The descriptor, the code hooks for form (a), the classifier entries, the stream mapping and the recorded fixtures of this harness |
| Form (a) call | A critic-class call of the harness under its read-only sandbox in the working tree |
| Form (b) call | A critic-class call by a direct HTTP request with an API key |
| Record of withheld paths | The record of feature 100, annex C §C.4: `deny`, `moved`, `confirmed` |
| Proof of form (a) | The facts of a call record that F131-FR-020 lists |
| Capture | A scripted run or one small call, explicitly authorized and logged, marked paid or not paid, whose result is stored as a fixture |
| Terms rows | The rows of the terms-gate data for provider `openai`, per auth tier and audience |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F131-SC-001**: The critic cannot write and cannot reach the network. In form (a), 100 per cent of the call records over all fixtures show the mode `read-only` and the network off, and in the logged live probe 0 seeded write attempts and 0 seeded network attempts succeed.
- **F131-SC-002**: The history of repairs stays withheld. During a form (a) call in the fixture tree 0 of the withheld paths are readable and 0 of the notebook, handoff and outbox are inside the working tree; after the call, including a call that failed or was killed, 100 per cent of them are back in their places.
- **F131-SC-003**: The critic never shares the proposer's session. 0 critic call records carry a session id that a pass of the same run used.
- **F131-SC-004**: Parity of both roles. 100 per cent of the parity tests `PT-131-*` of the 8 items and 4 clusters give `equal`, or `waived` with a register row, on FX-01, FX-06, FX-07, FX-25 and FX-26.
- **F131-SC-005**: Facts are dated. 100 per cent of the provider facts and harness facts carry a `verified-on` date and the version pin, or an `unverified` mark with the check that would settle it.
- **F131-SC-006**: Completeness. 100 per cent of the 4 clusters and of the 8 behaviour items that the traceability files assign to this feature are the origin of a requirement and are proven by a test task.
- **F131-SC-007**: No credential is touched. Over all fixtures 0 reads of a planted credential file by the adapter, and 0 planted key values in any argument list, event, log or record.
- **F131-SC-008**: The five captures and the three probes. Each of the 5 captures is stored as a fixture with the version and each of the 3 probes is logged, or the status of the requirement that waits for it stays `unverified` in the release notes; 100 per cent of the tasks that call a model (4 captures and 3 probes) are marked paid; 0 paid calls are made by any test or CI job, and 0 tests that are not paid wait for a paid task.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| Every parity test of this harness passes before any release | Ruling 32 |
| The exception to Principles III and IX is limited to reading project files | Ruling D1 |
| Subscription use only through the CLI the consumer installed and logged in; the adapter handles no login token | Decision 6; R8v |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, the spelling of
internal functions and, for this feature, the exact flags of the harness with their version pin.

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements (one tested harness adapter) | The descriptor, the code hooks for form (a), the stream mapping as data, the recorded fixtures; the first implementation of the second form of the `completion` level |
| EP-10 | `specstride.secret-resolver/1` | consumes | The key reference of auth tier 2 is checked for existence and resolved at the moment of use |
| EP-11 | `specstride.terms/1` | consumes | The adapter supplies the facts of its rows; the gate decides |
| EP-12 | `specstride.quota-classifier/1` | implements (classifier entries of this harness) | Entries for the login limit text and for the two API cases |
| EP-14 | `specstride.doctor/1` | implements (an entry: the checks of this harness; the owner of the registry is feature 112) | Executable, version, login or key, sandbox, read denial, unverified facts |

Sub-points of EP-02 that this feature consumes and does not own: the stream readers (annex C
§C.5) and role resolution (annex C §C.6).

## Contracts of feature 100 used

| Contract | Annex and section | Requirements of feature 100 |
|---|---|---|
| Common rules of extension points | A §A.4 | F100-FR-013 to F100-FR-021 |
| No closed list of harnesses | A §A.5 | F100-FR-023 |
| Logical names `feature:<slug>:notebook`, `feature:<slug>:handoff`, `feature:<slug>:outbox`, `attempt:<N>:<k>:<n>:session`, `attempt:<N>:<k>:<n>:critic-invocation`, `pass:<passId>:invocation`, `pass:<passId>:usage`, `pass:<passId>:stream`, `harness-home` | B §B.5 | F100-FR-053 |
| Harness port (EP-02) | C §C.1 | F100-FR-076 to F100-FR-083 |
| Harness descriptor | C §C.2 | F100-FR-084 to F100-FR-086 |
| Forms of the `completion` level; the session proof of a critic-class call; the window rule of a critic | C §C.3 | F100-FR-087, F100-FR-088, F100-FR-230, F100-FR-231 |
| Withheld paths | C §C.4 | F100-FR-089 |
| Stream readers and the six normalized records | C §C.5 | F100-FR-090 |
| Resolved registry, role plan and critic order | C §C.6 | F100-FR-092, F100-FR-093 |
| Secret resolver (EP-10) | C §C.11 | F100-FR-107 |
| Terms-gate data (EP-11) | C §C.12 | F100-FR-108 |
| Quota classifier (EP-12) | C §C.13 | F100-FR-109 |
| Containment levels | C §C.15 | F100-FR-111, F100-FR-112 |
| Overlay schema | C §C.16 | F100-FR-113 |
| Exit codes of the engine, the stop reason `critic_config`, `retryable` per failure class | E §E.3, §E.4 | F100-FR-148, F100-FR-151, F100-FR-153 |
| The critic never approves its own session; the critic-diversity warning | A §A.5 | F100-FR-024 |
| Doctor check registry (EP-14) | G §G.7 | F100-FR-189 |
| Event envelope (usage, quota signal) | X §X.1 | F100-FR-198, F100-FR-200 |
| Config envelope and trust classes | X §X.2 | F100-FR-201, F100-FR-202 |
| List of closed sets | X §X.6 | F100-FR-208 |
| The `parity` profile, rows 10, 25, 26, 27, 28, 29, 30, 34, 39, 131; rows 19, 35 and 92 are cited by F131-FR-040 | X §X.7 | F100-FR-210, F100-FR-212 |
| Environment alias table; component-name table; rule N-15 | X §X.8 | F100-FR-214 |
| Threats T-07, T-48 | X §X.9 | F100-FR-216, F100-FR-218 |
| Conformance of every extension point | X §X.10 | F100-FR-222 |

Fixture families of feature 141 cited: FX-01, FX-06, FX-07, FX-25, FX-26 (§O.2); the Codex
harness stub, the critic stub over HTTP and the generic stub (§O.3); the surfaces `exit`,
`stdout`, `stderr`, `state`, `events` and `transcript` (§O.4).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. This feature adds no row. It sets the value of the rows that name its
feature in the column "Owner". Row 131 was added by feature 100 after the cross-feature review, with
the owners 131 and 134.

| Row | Switch | Key (as annex X §X.7 proposes) | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 10 | Session continuation inside a phase attempt | `carry.continuation` | On, where the harness supports it | Off | DV-010 | F131-FR-012, F131-FR-013 |
| 25 | Containment level | `sandbox.level` | The strongest the harness offers (C2 here) | As at the baseline: none | DV-030 | F131-FR-010, F131-FR-011 |
| 26 | Permission mode and argument list of each harness | `sandbox.permissionMode` | Contained, the mode always stated (`workspace-write`) | As at the baseline: the allow-all flag, mapped through the argument table | DV-031 | F131-FR-008, F131-FR-009 |
| 27 | Transport of a harness adapter | `harnesses.<id>.transport` | `subprocess` | `subprocess` | — | F131-FR-001 |
| 28 | Transport and mode of the critic of each harness | `roles.critic.transport` | The harness CLI under its read-only sandbox at auth tier 1; the direct call at auth tier 2 | The direct call, with the as-is window rule and no output limit | DV-001; DV-081 | F131-FR-016, F131-FR-024 to F131-FR-031 |
| 29 | Harness-native memory | `memory.native.proposer` | Off for the critic always; off for the proposer | No flag about memory is passed | DV-047 | F131-FR-014 |
| 30 | Overlay of the configuration home | `harnesses.<id>.overlay` | Unset: follows the auth tier, the real home at auth tier 1 and a throwaway home at auth tier 2 | `none` | DV-002 | F131-FR-013 |
| 34 | Audience | `distribution.audience` | `distributed` | `personal` | DV-048 | F131-FR-005 |
| 39 | Quota pause | `pause.maxTotalMs` | On; ceiling 24 hours | Not reached: the stub agents emit no quota signal | DV-005 | F131-FR-032, F131-FR-033 |
| 131 | Customisations of a harness that are loaded into a proposer pass by themselves; on this harness the project instruction files | `harnesses.codex.proposerCustomisations` | `off`; never loaded into a critic-class call | `as-is`: no flag about customisations is passed | DV-047; DV-002 | F131-FR-014 |

Settings of this feature that are not switches of the profile. Feature 110 owns the spelling.
The key of row 131 was proposed by feature 100 and is in the key list of feature 110 as a widening
key (`harnesses.<id>.proposerCustomisations`, confirmed).

| Setting | Key | Source of the spelling | Value under `parity` |
|---|---|---|---|
| Executable of the harness | `harnesses.codex.bin` | Annex X §X.8, alias table | As the fixture sets it |
| Model of the critic | `roles.critic.model` for this harness | Alias `SPECSTRIDE_CODEX_CRITIC_MODEL` | `gpt-5` unless the fixture sets one |
| Model of the proposer | `roles.proposer.model` for this harness | Alias table (`SPECSTRIDE_<HARNESS>_PROPOSER_MODEL`) | As the fixture sets it |
| Base address of the critic | `harnesses.codex.endpoint.base`, the generic `harnesses.<id>.endpoint.base` with id `codex` | Confirmed by feature 110; alias `OPENAI_BASE_URL`, annex X §X.8, alias table | `https://api.openai.com/v1` unless the fixture sets one |
| Credential of the critic | `harnesses.codex.auth.credential`, the generic `harnesses.<id>.auth.credential` with id `codex` | Confirmed by feature 110; alias `OPENAI_API_KEY`, annex X §X.8, alias table | The reference `env:OPENAI_API_KEY` |
| Auth tier of the harness | `harnesses.codex.authTier`, the generic `harnesses.<id>.authTier` with id `codex` | Confirmed by feature 110 | 1 or 2 as the fixture sets it; the stubs hold no login |
| Window of the critic model | `roles.critic.contextTokens` | Alias `SPECSTRIDE_CRITIC_CONTEXT_TOKENS` ("the keys of the same meaning under `roles.critic`"); spelling proposed here | As the fixture sets it |
| Time limit of a critic-class call | `roles.critic.timeoutSec` | Annex X §X.8, alias table | 300, as at the baseline |
| Opt-in to containment C0 | `sandbox.level` with the value `C0`, in user configuration only: not the environment, not a flag, not project configuration (CQ-183) | Row 25 | Follows row 25 |
| Opt-in to native memory for the proposer | `memory.native.proposer` | Row 29 | Follows row 29 |
| Opt-in to the customisations of the proposer | `harnesses.codex.proposerCustomisations` | Row 131; proposed by feature 100, confirmed by feature 110 | Follows row 131 |

## Closed sets

Stated as F100-FR-208 asks. Rows are those of feature 100, annex X §X.6.

| Row | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 26 | Containment levels | C0, C1, C2, C3 | Design | Read as C0 |
| 28 | Forms of the `completion` level | `tool-less`, `read-only-tools` | Owner decision | `critic_not_toolless` |
| 29 | Tool-less mechanism of a descriptor | `structural`, `flag`, `config`, `none` | Design | `none` |
| 30 | Transports of a harness adapter | `subprocess`, `sdk-in-process`, `direct-call` | Design | The transport is unavailable |
| 33 | Provenance of a capability | `declared`, `probed`, `adapter`, `catalogue` | Design | The value is read as null |
| 36 | Typed failures of the harness port | The eight of annex C §C.1 | Design | `agent_failure` |
| 38 | Kinds of normalized stream record | `init`, `text`, `tool`, `usage`, `error`, `terminal` | Design | The record is dropped with a diagnostic event |
| 40 | Auth tiers | Tier 1, Tier 2, Tier 3; Tier 3 is never valid | Owner decision | Configuration error |
| 41 | Audiences | `personal`, `distributed` | Owner decision | Configuration error |
| 42 | Status of a terms row | `allowed`, `conditional`, `personal-only`, `refused` | Design | `refused` |
| 43 | Cost classes | `subscription`, `metered`, `local`, `unknown` | Design | `unknown` |
| 46 | Quota classes | The nine of annex C §C.13 | Design | `provider_other` |
| 47 | Quota confidence | `structured`, `status`, `text`, `stall`, `host` | Design | `text` |

Closed sets that this feature introduces. Owner: 131. Annex X §X.6 holds it as row 218 ("Sources of a fact of the proof of a critic with read-only tools").

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Sources of a fact of the proof of form (a) | `stream-first-record`, `adapter-invocation` | Design | The proof fails: `critic_not_toolless` |

The sandbox modes of the harness (`read-only`, `workspace-write`, `danger-full-access`) are the
harness's own values and not a closed set of the product. The adapter uses the first two and
never the third.

## As-is behaviour not carried

Rows of the traceability files that are assigned to this feature with the disposition
`superseded-by` or `dropped`: none. All 8 items are parity items (ruling 32) and all 8 are
carried. The behaviour items of the locally registered backend are `superseded-by DV-064` and
belong to feature 109; no name of that backend appears here.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| C-035: B-0428 | ported | F131-FR-001 | PT-131-C-035-* |
| C-058: B-0690, B-0691 | ported | F131-FR-008 | PT-131-C-058-* |
| C-061: B-0831 | translated | F131-FR-028 | PT-131-C-061-* |
| C-061: B-0832 | translated | F131-FR-026 | PT-131-C-061-* |
| C-061: B-0833 | translated | F131-FR-027 | PT-131-C-061-* |
| C-066: B-0910 | ported | F131-FR-029 | PT-131-C-066-* |
| C-066: B-0981 | translated | F131-FR-025 | PT-131-C-066-* |

Behaviour that the baseline has and this specification changes on purpose, outside the `parity`
profile: the allow-all flag is no longer the default (DV-030, DV-031); the critic at auth tier 1 is
the harness under its read-only sandbox (DV-001, DV-081); the fallback window of 128,000 is
dropped (DV-106); a missing key of the critic is found by the preflight before the call (DV-117,
the rule of feature 100). Under the profile each one is as at the baseline.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Does the direct call stay, now that the harness can be the critic? → A: Yes. Form (b) stays the form for a consumer with an API key and is the parity form of the critic; the transcript is compared in transport-neutral form, so the difference is not observable. Integrated in F131-FR-024, F131-FR-025. (Source: `APPROVAL.md` rulings 57, 57a; DV-001, DV-081; brief 131, heading 3)
- Q: Which form is used at which auth tier? → A: Form (a) at auth tier 1, where the consumer's login is the credential; form (b) at auth tier 2. It is announced at launch and recorded per call. Integrated in F131-FR-024. (Source: brief 131, heading 4; `APPROVAL.md` rulings 1, 57)
- Q: Where in the critic order does form (a) stand? → A: In step 3, behind every tool-less candidate of that step; a configured critic is step 1. This is the role resolution of feature 100, annex C §C.6, and not of this adapter. (Source: `APPROVAL.md` ruling P13; F100-FR-093)
- Q: What if the sandbox cannot deny reads of named paths? → A: Form (a) is not used. A configured critic is refused with `critic_not_toolless`; an automatically picked one is passed over, announced and recorded. Integrated in F131-FR-019. (Source: F100-FR-089; R29v open question 1)
- Q: Who moves the proposer's notebook, handoff and outbox? → A: The runtime, before and after the call (F100-FR-088); the list of paths is feature 117's (annex C §C.4). The adapter checks that they are out, denies their locations, and never touches them. Integrated in F131-FR-018. (Source: `APPROVAL.md` ruling D1; brief 131, headings 1 and 4)
- Q: How can the proof record "the session id minted by the runtime", when Codex chooses its own session id? → A: The record shows the id of the first record of the stream, and the adapter checks that no pass of the run used it. Integrated in F131-FR-020, F131-FR-021, and reported as CQ-117 (closed by the owner on 2026-09-30 on this answer; F100-FR-230, case 2). (Source: brief 131, heading 4; annex C §C.1, "the minted session id")
- Q: Is the allow-all flag still the proposer's default? → A: No. It is used only under the `parity` profile and where the consumer opted in to containment C0, in user configuration only (answer after the cross-feature review, 2026-09-30; CQ-183). The default is the sandbox mode `workspace-write`. Integrated in F131-FR-009, F131-FR-010. (Source: `APPROVAL.md` rulings 34, 38; R6 recommendation 1; R11 F-23)
- Q: How does the adapter set approvals to never, given that the installed `exec` shows no such option? → A: By a configuration override of the harness, which is `unverified`; capture 2 records the policy in force. Integrated in F131-FR-009. (Source: `codex exec --help` on 2026-09-29, version 0.153.4; R6 finding 1, which lists an approval option that the help of `exec` no longer shows)
- Q: How does a session at auth tier 1 fit the rule that the real home is never written? → A: Unknown until capture 4. If session files cannot live outside the home, continuation is off for auth tier 1 and files carry the context; a pass that does not continue runs without persisting sessions. Integrated in F131-FR-013. (Source: brief 131, heading 4; `APPROVAL.md` ruling 36)
- Q: Where does the missing key of the direct call end, since FX-07 lists `codex-missing-key` as a critic configuration error? → A: The code of the baseline raises the error inside the call and the phase gate scores it as a failed critic call (`critic.py:2364`, and the handler of a failed call). Parity means the code, so the specification follows it. After the cross-feature review (2026-09-30): the catalogue of feature 141 was corrected and gives the scenario engine exit 1 and `critic_unavailable`, so nothing is left to report on FX-07; the question that stays open is CQ-187, and the behaviour outside the profile is register row DV-117. Integrated in F131-FR-027. (Source: baseline `lib/critic.py` at `9cab15d`; feature 141, §O.2, scenario `FX-07/codex-missing-key`; CQ-187)
- Q: Are `OPENAI_BASE_URL` and `OPENAI_API_KEY` in the alias table? → A: Yes. Annex X §X.8 holds one row for both: `OPENAI_BASE_URL` is the alias of `harnesses.codex.endpoint.base` and `OPENAI_API_KEY` of the secret reference `harnesses.codex.auth.credential`. The answer of 2026-09-29 ("No") was out of date. Integrated in F131-FR-026, F131-FR-027. (Source: annex X §X.8; traceability rows B-0832, B-0833)
- Q: Is the fallback window of 128,000 kept? → A: Only under the `parity` profile. Outside it a model with no known window does not qualify. It is part of the as-is mode of row 28, so no row is added to the profile; the register row for the difference is DV-106. Under the profile the fallback is a deviation from the letter of Principle IX, recorded in `plan.md` with CQ-145. Integrated in F131-FR-029, F131-FR-030. (Source: constitution Principle IX; brief 131, heading 3, "Context window"; F100 annex X §X.7 row 28)
- Q: Does the model-list endpoint give a window? → A: Unknown for this provider; R6 documents a window field for another endpoint only. The order of F131-FR-030 uses the endpoint where it reports one. (Source: R6 questions answered, OpenRouter; R20)
- Q: What does the spending cap do for a single call? → A: The adapter estimates the call and refuses to send it when the estimate exceeds the remaining cap. That an automatically picked critic on a metered endpoint has a cap is checked by role resolution. Integrated in F131-FR-031. (Source: `APPROVAL.md` ruling 60; F100-FR-093; annex C §C.13, `budget_cap`)
- Q: Is a cost figure reported for a login? → A: The harness reports none. A cost computed from dated prices is labelled notional under a login. Integrated in F131-FR-035. (Source: `APPROVAL.md` ruling 66; R14 rule 7)
- Q: Does the SDK of the vendor become a transport? → A: No, not in Wave 1. (Source: brief 131, out of scope; R6 recommendation 1)
- Q: Which terms rows does the harness need? → A: Two rows for the provider `openai`: auth tier 1 (`conditional` for `personal`, `personal-only` for `distributed`) and auth tier 2 (`allowed`). (Source: R8v rows 7 and 9, D2, D3; `APPROVAL.md` rulings 1, 2, 59)
- Q: Which rows of the divergence register does this feature cite? → A: Rows of the divergence register of `consolidation.md` section 6, named by their ids and without a count. The row that was missing on 2026-09-29 exists (DV-106), and DV-117 was added after the cross-feature review. (Source: `consolidation.md` section 6)
- Q: Which open questions of the clarify queue bear on this feature? → A: None of CQ-017 to CQ-069 changes a requirement here. CQ-014 (the place of a critic with read-only tools in the critic order) is closed by ruling P13. (Source: `CLARIFY-QUEUE.md`)
- Q: Which time limit does a call of form (a) keep? → A: The time limit of a critic-class call (300 seconds at the baseline), and at the limit the process and its group are ended. Integrated in F131-FR-016. (Source: annex X §X.8, alias table, `SPECSTRIDE_CRITIC_TIMEOUT`; annex C §C.1 `stop`)
- Q: What if the harness of form (a) exits with a code other than 0 but printed a final message? → A: No verdict. It is a failed critic-class call, scored by the phase gate as the baseline scores one, so a critic that failed can never approve. Integrated in F131-FR-022. (Source: Principle II; annex C §C.1, "Failure of an implementation")
- Q: Does the window rule apply to form (a), where the harness picks a default model if none is named? → A: Yes. A critic of either form runs on a model that the role plan names and whose window is known. Integrated in F131-FR-030. (Source: Principle IX; brief 131, heading 3)
- Q: Which sessions count as "used by a pass" in the check of F131-FR-021? → A: Every pass of the logical run, including passes of earlier engine starts and earlier phase attempts. (Source: `consolidation.md` glossary, "run"; F100 annex B §B.3)
- Q: Which questions could the sources not answer? → A: On 2026-09-29 two, CQ-116 and CQ-117. CQ-116 was answered in the catalogue of feature 141. The readings CQ-117, CQ-143, CQ-145, CQ-183 and CQ-187, listed under "Assumptions", were all closed by the owner on 2026-09-30 on the reading this specification takes.

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The stream readers (126), role resolution (124), the secret resolvers (110), the terms gate, the terms data and the audience (147), the quota classifier and the pause (127), the list of withheld paths and the moving of the proposer's files (117) and the seam (109) exist when this adapter calls them. Each is reached through its interface contract of feature 100.
- The fixture captures and the live probes are run by people who are authorized to run them. This feature runs none.
- Wave 1 adds no option to turn the network on inside the proposer's sandbox. Package installs and other network steps then fail at the ceiling C2. The consumer who needs them has the opt-in to containment C0, or a later option.
- The harness makes its own calls to its provider outside the sandbox. "Network off" concerns commands that the model runs.
- Every macOS statement is `unverified` (ruling 67), the mechanism of the sandbox included.

Readings that the sources did not settle. Each is marked in its requirement. The owner closed all
five on 2026-09-30 on the reading below (`CLARIFY-QUEUE.md`).

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-187 | Is a missing critic credential a critic configuration error (engine exit 3) or a failed critic call? | A failed critic call under the `parity` profile, as the code of the baseline does; outside the profile the rule of feature 100 applies (register row DV-117) | F131-FR-027 |
| CQ-183 | Does "user config" in ruling 34 stand for the user configuration only? | Yes: the opt-in to containment C0 comes from user configuration only | F131-FR-010, F131-FR-011 |
| CQ-143 | Ruling 36 and Principle VIII say the real configuration home is never written; at auth tier 1 the harness itself writes there | The reading nearest to the letter: the harness adapter writes nothing and removes nothing in the real home; at auth tier 1 continuation is off and no session state is persisted until capture 4 shows that the state can be kept outside the home. What remains is what the harness writes by itself, listed by capture 4 | F131-FR-013 |
| CQ-145 | An as-is fallback window for a model that is not listed, against Principle IX ("no default window for an unknown model") | The reading nearest to the letter: no default window outside the `parity` profile. What remains is the fallback of 128,000 under the profile, which Principle XVIII asks for (B-0910, DV-106); F100-FR-231 now states the rule | F131-FR-029, F131-FR-030 |
| CQ-117 | Annex C §C.1 has the runtime mint the session id of a critic-class call, and this harness accepts no chosen session id | The proof records the id of the first stream record and checks that no pass used it; F100-FR-230, case 2, now states it | F131-FR-020, F131-FR-021 |

## Repairs after the cross-feature review

Dated 2026-09-30. Items are those of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id was
renumbered or reused. One requirement was appended: F131-FR-040.

| Requirement | Item | What changed |
|---|---|---|
| F131-FR-006 | W-X-19 | `ep:` reads `implements (an entry)` for the registration of doctor checks |
| F131-FR-010 | W-110-05 | The opt-in to containment C0 comes from user configuration only; the environment, a flag and project configuration cannot give it. `assumption: CQ-183` |
| F131-FR-011 | W-110-05 | "in user configuration only" added to the exception of the fallback |
| F131-FR-013 | Orchestrator's point on CQ-143 | The harness adapter writes nothing and removes nothing in the real home; continuation is off at auth tier 1 until capture 4; the harness's own writes are a recorded deviation. `assumption: CQ-143` |
| F131-FR-014 | W-110-09 | The two opt-ins are named: `memory.native.proposer` (row 29) and `harnesses.codex.proposerCustomisations` (row 131) |
| F131-FR-021 | W-X-17 | The critic-diversity rule and its warning are named; the rule is F131-FR-040 |
| F131-FR-027 | Follow-up of feature 141 | The expectation follows the code under the `parity` profile (CQ-187, DV-117); the note on CQ-116 is removed |
| F131-FR-029 | Orchestrator's point on CQ-145 | `divergence: DV-106` and `assumption: CQ-145` added; the text is unchanged |
| F131-FR-033 | W-127-02 | `retryable` has a value for each of the nine classes |
| F131-FR-037 | W-131-01, W-X-15 | Each capture is marked paid or not paid; no test and no task waits for a capture; a test without its fixture is a skip |
| F131-FR-038 | W-131-01 | "no other paid call than the three probes and the captures marked paid"; a task that calls a model is marked paid |
| F131-SC-008 | W-131-01 | The count of paid tasks and the rule on preconditions are measured |
| F131-FR-040 (new) | W-X-17 | The identity for the diversity test and the critic-diversity warning on a critic-class call of this harness; test CT-131-40 |

Other places changed: the table "Out of scope" and the first list of "Assumptions" (W-X-16: the
terms gate, the terms data and the audience belong to feature 147); the table of settings
(W-110-03: both `OPENAI_*` variables are in annex X §X.8); row 30 and row 131 of the table of
profile rows; the clarification on the register (W-X-05: no count).
