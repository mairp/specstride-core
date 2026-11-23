# Feature Specification: Claude harness adapter

**Feature Branch**: `125-adapter-claude` (a label: Spec Kit creates no branch in this repository; the directory is `specs/125-adapter-claude`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 125-adapter-claude: the Claude harness adapter, specified against the harness port of feature 100 as a descriptor, optional code and recorded fixtures. Two transports: the installed CLI as a subprocess (the default) and the Agent SDK in process as an optional Tier 2 transport with API keys only, extracted from Lisa. Detection and version; the proposer invocation, headless, streamed, prompt on standard input; the session directive; isolation of a Tier 1 pass in the consumer's real configuration home with customisations off; the permission mode; the tool-less critic at Tier 1 (installed CLI) and at Tier 2 (direct call with an API key), on a different model tier, in a fresh session, with a budget; the proof read from the initial record; Claude's quota signals and usage figures; the model-tier ladder; the version range with its verified-on date; the harness adapter's doctor checks."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 1, 7, 20, 34, 36, 37, 49, 55, 57, 66, 67, 70, D1, P2, P13), `architecture.md` (sections 5, 9, 14, 17, 18), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 125-adapter-claude, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles VII, VIII, IX, X, XI, XII), research reports R5, R3, R3v, R8, R8v, R11, R12, R14, R24, R25, R1, R1v; the baseline of Specstride at `9cab15d` (`proposer.sh`, `lib/critic.py`, `lib/backends.py`) and the baseline of Lisa at `363e6a3` (`packages/agents/src/claude-agent-sdk/harness.ts` and `tap.ts`)

## What this feature is

Claude is the default proposer and the default critic of Wave 1. This feature is the harness
adapter that lets the engine use Claude through the harness port of feature 100. It holds what is
specific to Claude and nothing more: the descriptor, the code the descriptor cannot express,
the classifier entries for Claude's limit signals, and the recorded fixtures.

Claude is reached in two ways, called transports. The default transport is the installed `claude`
command started as a subprocess, with the prompt on standard input. It is the only transport that
may use the consumer's own subscription login. The second transport is the Agent SDK, loaded in
process. It is optional, it is used at auth tier 2 only, and it authenticates with API keys only. The SDK
is proprietary: the product never bundles it, never vendors it and never installs it.

The harness adapter also reaches the critic in two ways. At auth tier 1 the critic is the installed CLI started
with no tools, in an empty directory, in a session the harness adapter minted, on the model that the role
plan names (by default a model tier different from the proposer's).
At auth tier 2 the critic is a direct call to the messages endpoint with an API key, which has no tools,
no session and no configuration home by construction.

**In scope**: detection and version; the descriptor; the version range and its `verified-on` date;
the terms facts of Claude; the doctor checks of the harness adapter; the proposer invocation (prompt,
argument list, session directive, isolation, permission mode, native memory, containment ceiling,
environment, stop); the critic on both auth tiers with its proof; Claude's quota signals; usage figures;
the model-tier ladder; the Agent SDK transport, extracted from Lisa, and the behaviour that is kept
of Lisa's harness and tap.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The harness port, the generic harness adapter, the registry, the conformance suite | 109 |
| The stream reader for Claude's stream format | 126 |
| A critic through the model gateway of the host | 124 (discovery entry), 109 (generic endpoint client) |
| What a quota class does to a run | 127 |
| Claude Code as a **host** (plugin, host skills, host hooks, packaging) | 113. This feature is about Claude as a **harness** |
| The critic's prompt, the grounding snapshot, the verdict and the nonce | 117, 101 |
| The drop rules of session continuation and the block set of the proposer's prompt | 103 |
| The catalogue of doctor checks and the doctor's output | 112 |
| The spelling and defaults of configuration keys | 110 |
| The rules of the router and of the attempt planner (when to escalate) | 115, 101 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A proposer pass runs on the installed Claude CLI (Priority: P1)

The engine starts a proposer pass on Claude. The harness adapter starts the installed `claude` command in the
working directory, hands it the prompt on standard input, streams the output, and states its
permission mode, its session directive and its customisation mode on every call. Under the `parity`
profile the argument list is the baseline's, and under the default profile it is the contained one.

**Why this priority**: Every run of the default configuration goes through this path.

**Independent Test**: Run the fixtures of FX-01 (`harness-claude`) and FX-26 (`claude-<name>`) on the port with the stub executable named `claude`: the transcript (argument list, standard input, environment names) equals the reference's under `parity`, and under the default profile it matches the argument table of the harness adapter.

**Acceptance Scenarios**:

1. **Given** the `parity` profile and a model named, **When** a pass starts, **Then** the argument list is exactly the as-is list, the prompt arrives on standard input from a file, and the file is gone after the pass (F125-FR-007, F125-FR-008, F125-FR-009).
2. **Given** the default profile, **When** a pass starts, **Then** the call states an accept-edits mode with an allow list and no prompts, states the customisations as off, and carries a minted session id (F125-FR-012, F125-FR-013, F125-FR-015).
3. **Given** a second pass in the same phase attempt where continuation is in force (auth tier 2; at auth tier 1 only once session state can be kept outside the real configuration home, F125-FR-014), **When** it starts, **Then** it continues the session by its id; **Given** auth tier 1 without that, **Then** every pass is a fresh session that persists nothing and files carry the context; **Given** a relaunch, a watchdog kill, a second repair or an escalation, **Then** it starts fresh (F125-FR-013, F125-FR-014).
4. **Given** an empty session id, **When** the harness adapter builds the call, **Then** it refuses to build it (F125-FR-004).

---

### User Story 2 - The critic has no tools and never shares a session (Priority: P1)

The critic strategy asks for a critic-class call on Claude. At auth tier 1 the harness adapter runs the installed
CLI with no tools; at auth tier 2 it makes a direct call. Before it accepts a reply it proves from the
initial record that the tool list is empty and that the session is the one it minted.

**Why this priority**: The critic's independence is the reason the phase gate exists (principles II and IX).

**Independent Test**: Run FX-05 and FX-06 on the port on both critic transports; feed the CLI critic a recorded initial record with one tool, then with another session id, then with no initial record: each is refused with `critic_not_toolless`.

**Acceptance Scenarios**:

1. **Given** a critic call at auth tier 1, **When** the initial record shows an empty tool list, an empty server list and the minted session id, **Then** the reply is accepted and the proof is recorded in the call record (F125-FR-023, F125-FR-024).
2. **Given** an initial record that shows a tool, **When** the harness adapter reads it, **Then** the call is refused with `critic_not_toolless` and the run halts as a critic configuration error (F125-FR-024).
3. **Given** a session id that a proposer pass used, **When** it appears in a critic call record, **Then** the suite fails; no critic call is ever built with a resume, continue or fork argument (F125-FR-025).
4. **Given** a critic and a proposer that resolve to the same model, **When** the plan is resolved, **Then** the critic-diversity warning is raised and recorded and the run goes on (F125-FR-026; F100-FR-024).
5. **Given** the `parity` profile, **When** a critic call is made, **Then** it is the as-is direct call with the as-is headers, body and key order of preference (F125-FR-028, F125-FR-029).

---

### User Story 3 - The consumer's configuration home is never written by the run (Priority: P1)

A consumer runs Specstride at auth tier 1 with the login they already have. The harness adapter uses the real
configuration home with plugins, host hooks, skills, tool servers and native memory off, so that the
Specstride plugin's own host hooks do not run inside its own proposer child.

**Why this priority**: A throwaway home has no login at auth tier 1, and the owner ruled that the real home is used and never written (ruling 36).

**Independent Test**: Run a fixture pass and a fixture critic call with the stub executable and compare the tree of the configuration home before and after: no file written, changed or removed by the harness adapter. Feed a recorded initial record that lists a plugin: the finding is recorded.

**Acceptance Scenarios**:

1. **Given** auth tier 1, **When** a pass runs, **Then** the harness adapter writes, changes and removes no file of the home (F125-FR-015).
2. **Given** a plugin, a host hook, a skill or a tool server in the initial record, **When** the harness adapter reads it, **Then** the finding is recorded, and for a critic the call is refused (F125-FR-016).
3. **Given** the phase attempt ends, **When** its session state exists, **Then** it is outside the real configuration home and is removed with the attempt; at auth tier 1 without continuation no session state was persisted (F125-FR-014).
4. **Given** auth tier 2, **When** a pass runs, **Then** it uses a throwaway home built from the overlay and removed afterwards, even when the pass was killed (F125-FR-017).

---

### User Story 4 - A limit of the provider is a pause and not an error (Priority: P2)

Claude reaches its usage limit. The harness adapter tells a structured limit event apart from a transient
retry, an overload and a credit error, and hands the engine a class, a confidence and a reset time
where the stream gives one.

**Why this priority**: The baseline counts a quota failure as a provider error; the owner ruled that a quota pause spends no budget.

**Independent Test**: Replay the recorded streams with a limit event, a retry event, an overload and a credit error through the classifier: each gets the class of F125-FR-031; overload is never quota. The streams are written from the documented shapes and need no paid call; the case on the captured limit event is a skip with its reason until capture C exists.

**Acceptance Scenarios**:

1. **Given** a limit event that is rejected and carries a reset time, **When** it is classified, **Then** the class is `quota_window`, the confidence is `structured` and `resetsAt` is the value of the event (F125-FR-031).
2. **Given** an overload error, **When** it is classified, **Then** the class is `overload` and no quota pause follows (F125-FR-031).
3. **Given** a pass that was killed, **When** its usage is read, **Then** the usage of each completed model call is reported as an increment and the total is unknown, not zero (F125-FR-032).

---

### User Story 5 - The Agent SDK transport is optional, and only with API keys (Priority: P2)

A consumer who has an API key and the Agent SDK installed chooses the SDK transport in user
configuration. Without the SDK, the transport is unavailable and the subprocess transport is
unaffected.

**Why this priority**: The owner extended Lisa's harness as a second transport (ruling 20) and bounded it (ruling 70).

**Independent Test**: Choose the SDK transport at auth tier 1: refused. Choose it at auth tier 2 with the SDK absent: unavailable, with a doctor line, and a run on the subprocess is unchanged. Put a subscription credential in the environment: the transport does not use it. Build the package: no file of the SDK in it.

**Acceptance Scenarios**:

1. **Given** the SDK transport chosen under auth tier 1, **When** the launch resolves, **Then** it is a configuration error that refuses the launch (F125-FR-034).
2. **Given** the SDK absent, **When** the doctor runs, **Then** the transport is reported unavailable and the subprocess transport is untouched (F125-FR-036).
3. **Given** a subscription login token in the environment, **When** an SDK call is made, **Then** the call carries only the key of its secret reference (F125-FR-035).
4. **Given** the built package, **When** CI inspects it and everything it installs, **Then** it holds no file of the SDK (F125-FR-036).
5. **Given** the same recorded stream replayed through both transports, **When** the conformance suite runs, **Then** the normalized records, the call record and the proof are equal (F125-FR-038).

---

### User Story 6 - The doctor and the launch know which Claude they have (Priority: P2)

The doctor reports the executable, the version against the tested range, the login, and whether a
sandbox and a user other than root are present, which is the precondition of the bypass permission mode that only the consumer can choose.

**Why this priority**: A silent change of the `-p` default in a later release would turn auth tier 1 into auth tier 2 without a message (R5, Q3).

**Independent Test**: Run the doctor against stubs for each state: absent, out of range, no login, managed settings present, no sandbox, SDK absent. Each has its finding and its severity.

**Acceptance Scenarios**:

1. **Given** an installed version outside the tested range, **When** the doctor runs, **Then** it warns and does not block (F125-FR-003, F125-FR-006).
2. **Given** an executable inside the workspace, **When** the launch resolves the harness, **Then** the launch is refused (F125-FR-001).
3. **Given** the capture of the limit event is missing, **When** the specification is frozen, **Then** the requirement stays `unverified`; the capture is a paid, logged task that no test and no implementation task waits for (F125-FR-031).

---

### Edge Cases

- The installed CLI is newer than the tested range: a warning and no block; the flags the harness adapter uses are checked against the capability list of the initial record where it has one (F125-FR-003).
- A later release of the CLI makes the minimal mode the default of headless calls: the harness adapter states its mode on every call, so an auth tier 1 call never becomes an auth tier 2 call by default (F125-FR-004).
- A flag the CLI hides from its help (`--max-turns`, `--system-prompt-file`) is used by the critic: capability detection cannot find it by parsing help, so a version floor and the capability list decide (F125-FR-003).
- The critic's stream has no initial record: the call is refused, since the proof cannot be read (F125-FR-024).
- Administrator-managed settings apply inside the isolated mode, policy host hooks included: the doctor reports their presence and the initial-record assertions are the backstop (F125-FR-016).
- The proposer runs as root and the bypass permission mode is refused by the CLI outside a sandbox: the harness adapter never selects the bypass mode by itself; the consumer chooses it in user configuration, and the harness adapter uses it only where the doctor detects a sandbox and a user other than root (F125-FR-012).
- The pass is killed with a termination signal: the turn is unfinished and the exit code is 143; the polite stop sends an interrupt first (F125-FR-021).
- The reset time is given only as text in the local time of the provider: it is not used as a reset time (F125-FR-031).
- The SDK is installed in a version outside its range: a warning; the run is not blocked by the range (F125-FR-037).
- A resumed session reports the whole conversation's cost: the harness adapter records the delta of the pass (F125-FR-032).

## Requirements *(mandatory)*

### Functional Requirements

#### G1 - Detection, version, descriptor, terms, doctor checks

- **F125-FR-001**: The harness adapter MUST detect Claude without a model call and without opening a credential store: it MUST resolve the `claude` executable to an absolute path, read its version from the executable's own version output, and report whether a configuration home exists. An executable inside the workspace, or in a directory that everyone may write, MUST be refused; a path that changed since the last run MUST give a warning (F100-FR-080). The version, the path and the harness state (`tested`) MUST be recorded in the resolved registry at launch.
  - test: CT-125-1
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified (check: `command -v claude` and `claude --version` on the machine of the specification; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-002**: The harness adapter MUST ship a harness descriptor (`descriptorVersion: 1`) of kind `cli` with the fields of annex C §C.2 filled as follows: the provider id and the terms reference of Claude; the auth tiers 1 and 2; the two roles, with the critic's tool-less mechanism `flag` and its `freshSession`; the invoke entries of both roles; the stream format of Claude's stream, read by the reader of feature 126; the failures map of F125-FR-031; the cost class `subscription` at auth tier 1 and `metered` at auth tier 2; the environment allow-list; the containment ceiling (F125-FR-019); the memory switch (F125-FR-018); the telemetry switch where the harness names one, else null; `concurrentSessions` (F125-FR-019); the spending limit (F125-FR-023); the transports (F125-FR-034); the model-tier ladder (F125-FR-033); and the version range with its `verifiedOn` date (F125-FR-003). Argument lists MUST be lists and never shell text. A value that the harness adapter has not established MUST be null and MUST NOT be guessed.
  - test: CT-125-2
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the descriptor validates against the descriptor schema of feature 100 and each capability names its provenance; verified-on: —; pin: claude 2.1.284)

- **F125-FR-003**: The tested range of the CLI MUST be a floor of 2.1.259 (the first version with the flag that suppresses permission prompts) up to the tested version 2.1.284, with `verified-on` 2026-09-29; a floor of 2.1.248 MUST apply only if the restricted mode is used. Every pass MUST record the version it ran. A version outside the range MUST give a doctor warning, never a block; a change of version between passes of one run MUST be surfaced as a warning. Capability detection MUST prefer the capability list of the initial record (present from 2.1.205) over a comparison of versions, and a flag the help does not list (`--max-turns`, `--system-prompt-file` are documented and hidden) MUST be gated by the version floor. Nothing MUST be downloaded to achieve a pin.
  - test: CT-125-3
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))
  - status: unverified (check: the flags of the argument table exist in `claude --help` of the pinned version (verified for all but the two hidden flags on 2026-09-29, claude 2.1.284) and one live probe per role runs them; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-004**: The harness adapter MUST state its mode on every call and MUST NOT rely on a default of the CLI: the output format, the permission mode, the tool set, the customisation mode, the session directive and the model MUST each be explicit. A call at auth tier 1 MUST NOT use the minimal mode that never reads the subscription login. The harness adapter MUST refuse to build a call whose session id for a continuation is empty, since the CLI would open an interactive picker. The prompt MUST be sent on standard input and MUST NOT be a positional argument after an argument that takes several values.
  - test: CT-125-4
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the documented statement that the minimal mode will become the default of headless calls has no version or date; a version watch on the pin; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-005**: The harness adapter MUST supply the facts of the terms rows of Claude for the terms gate: for each auth tier and each audience, the status, the source, the access date and the `verified-on` date. Auth tier 1 MUST be `allowed` for the audience `personal` and `personal-only` for the audience `distributed`; auth tier 2 MUST be `allowed` for both; auth tier 3 MUST be `refused`. For the audience `distributed` the default MUST be auth tier 2, and auth tier 1 MUST be an opt-in in user configuration marked "personal use only", with a warning. A row MUST name the transport it applies to: the subprocess transport at auth tier 1 and at auth tier 2, and the SDK transport at auth tier 2 only (F125-FR-037).
  - divergence: DV-003; DV-048
  - parity: audience `personal` (row 34 of annex X §X.7)
  - test: CT-125-5
  - ep: EP-11 `specstride.terms/1` (consumes)
  - status: unverified (check: the provider's legal pages are re-read and the sentences quoted in the rows are found; the rows rest on documentation only; verified-on: 2026-09-29; pin: R8v of 2026-09-29)

- **F125-FR-006**: The harness adapter MUST register its checks as entries of the doctor check registry of feature 100 (annex G §G.7, F100-FR-189), each with a stable id, a severity rule and a fix hint, and none of them MUST make a paid call, read a secret value or write: the executable and its path (launch-blocking when Claude is used by a role); the version against the range; the credential (launch-blocking: at auth tier 1 that a login exists, established without a paid call, and at auth tier 2 that the secret reference exists, never its value); the presence of administrator-managed settings, which still apply in the isolated mode; whether the operating system offers the sandbox for commands and whether the user is other than root, which decides the containment ceiling and is the precondition that F125-FR-012 checks before it uses a bypass mode the consumer chose; the state of the transport that needs the SDK (F125-FR-036); and the state of the capability `concurrentSessions` (F125-FR-019). The ids proposed are `harness.claude.bin`, `harness.claude.auth`, `harness.version.claude`, `harness.claude.managed-settings`, `harness.claude.sandbox`, `harness.claude.sdk` and `harness.claude.concurrent-sessions`; the catalogue of checks and its spelling are those of the registry of annex G §G.7.
  - test: CT-125-6
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))
  - status: unverified (check: the existence query of the login prints no value and makes no network call, on Linux and on macOS; verified-on: —; pin: claude 2.1.284)

#### G2 - The proposer: invocation, session, isolation, permission mode

- **F125-FR-007**: The prompt of a proposer pass MUST reach the CLI on standard input from a file that the harness adapter wrote, and never as an argument, so that a prompt of more than 128 KiB does not hit the limit of one argument. Under the `parity` profile the harness adapter MUST name that file to the process it starts in the variable `SPECSTRIDE_STDIN_FILE`, as the baseline does; the as-is variable stays an alias of the mechanism (annex X §X.8), and the transcript of the stub records its name.
  - origin: C-052; B-0522
  - disposition: translated
  - test: PT-125-C-052-stdin-file
  - divergence: DV-027
  - parity: the variable is set, as at the baseline

- **F125-FR-008**: The harness adapter MUST write the prompt file to the temporary directory under the logical name `pass:<passId>:prompt-transfer`, readable by its owner only, and MUST remove it when the pass ends, whether the pass ended normally, with an error or by a kill. The name of the file under `parity` MUST be the as-is pattern `specstride-prompt.XXXXXX` in the directory named by `TMPDIR` or `/tmp`.
  - origin: C-056; B-0625
  - disposition: translated
  - test: PT-125-C-056-prompt-file
  - divergence: DV-006

- **F125-FR-009**: Under the `parity` profile the argument list of the Claude proposer MUST be exactly, in this order: `-p`, `--dangerously-skip-permissions`, `--verbose`, then `--disable-slash-commands` unless F125-FR-010 turns it off, then `--output-format stream-json` when the stream tap or the JSON output is on, then `--model <M>` when a model is set. The shared flags `--dangerously-skip-permissions` and `--verbose` MUST be added for Claude and only for a harness that the harness adapter's argument table names. The argument list MUST be produced through the argument table of the harness adapter, so that the comparison of the transcripts of the stub maps the default list to this one (DV-031).
  - origin: C-058; B-0689; B-0740; B-0742
  - disposition: translated (B-0689, B-0740, B-0742)
  - test: PT-125-C-058-argument-table
  - divergence: DV-031
  - parity: the as-is argument list (row 26 of annex X §X.7)

- **F125-FR-010**: The slash-command skills of the harness MUST be off for a proposer pass: the flag that disables them MUST be passed unless the consumer sets `harnesses.claude.proposerSkills` (as-is variable `SPECSTRIDE_PROPOSER_SKILLS`) to `1`; any other value MUST leave them disabled. The reason is kept: the standing prompt names files full of provider terms that would trigger a large skill and overflow a small model's context.
  - origin: C-052; C-058; B-0534; B-0741
  - disposition: translated (B-0534, B-0741)
  - test: PT-125-C-052-skills-switch; PT-125-C-058-skills-flag
  - divergence: DV-027
  - parity: off (skills disabled; the flag is passed), as the as-is default (row 119 of annex X §X.7)

- **F125-FR-011**: The name that the harness adapter gives to the stream reader and to the compatibility projection as the harness label MUST be the value of the variable `SPECSTRIDE_BACKEND_LABEL` where set (key `harnesses.claude.label`), else `claude`. A Claude pass MUST get an invocation directory for its raw stream and MUST NOT get an invocation metadata record, so that the path of the finalizer, which reconciles the provider's terminal record with the exit, is never taken for Claude.
  - origin: C-058; B-0744; B-0745
  - disposition: ported
  - test: PT-125-C-058-tap-label; PT-125-C-058-no-metadata

- **F125-FR-012**: Under the default profile the proposer MUST run in the accept-edits permission mode with an explicit allow list of tools and no permission prompts: anything not on the list MUST be denied and the pass MUST go on. The harness adapter MUST state the permission mode on every call. The bypass mode MUST be used only when the consumer set it in `sandbox.permissionMode` in user configuration, which the environment, a flag and project configuration MUST NOT give, and then only where the doctor detects a sandbox and a user other than root. The harness adapter MUST never select the bypass mode by itself: it only checks the precondition. Where the consumer set the bypass mode and the precondition does not hold, the launch MUST be refused as a configuration error that names the missing part (no sandbox detected, or the user is root), and the harness adapter MUST NOT fall back to another mode silently. Under the `parity` profile the argument list MUST be that of F125-FR-009.
  - origin: C-058; B-0689
  - disposition: translated
  - test: PT-125-C-058-permission-mode; CT-125-33
  - divergence: DV-031
  - parity: as at the baseline, mapped through the argument table (row 26 of annex X §X.7)
  - assumption: CQ-183
  - status: unverified (check: the permission flags combine as documented in a headless pass with stubs, and the bypass mode is refused as root outside a sandbox on a machine where that is tried without a model call; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-013**: The harness adapter MUST implement the session directive of the harness port. The first pass of a phase attempt MUST start a session whose id the harness adapter minted. A later pass in the same phase attempt MAY continue that session by its id, where continuation is in force for the auth tier (F125-FR-014), and never by "the most recent conversation". A new phase attempt, a critic-class call, a relaunch, a kill by a watchdog, the second repair of a unit and an escalation MUST start fresh with a new minted id. The harness adapter MUST read the session id from the initial record and from the final record of every pass. Under the `parity` profile the argument list MUST carry no session argument and no continuation argument, and the comparator asserts that no invocation carried one.
  - divergence: DV-010
  - parity: off (row 10 of annex X §X.7); key `carry.continuation`
  - test: CT-125-7
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-014**: Continuation MUST require that the harness keeps the session; a pass that continues MUST NOT ask for the session to be discarded. The system prompt of a session is recorded at its first request and reused, so a later pass MUST carry its per-pass instructions in the user prompt and never in the system prompt. Session state MUST live per phase attempt and MUST never be kept in the consumer's real configuration home by an act of the harness adapter. At auth tier 2 it lives in the throwaway home of F125-FR-017 (overlay scope `attempt`) and is removed with it when the phase attempt ends. At auth tier 1 continuation MUST be off and every pass MUST start a fresh session that persists no session state, with context carried through files (F100-FR-083), until capture E shows that the harness keeps the session state of a minted session outside the real configuration home while the login stays in it; until then the harness adapter MUST declare the capability `continuation` as null (`unverified`) at auth tier 1. The harness adapter MUST NOT remove a file of the real configuration home. A session that ended by a termination signal is unfinished; a continuation of it MAY ask the harness to finish the interrupted turn. The cost reported by a continued session covers the whole conversation, and the harness adapter MUST record the delta of the pass (F125-FR-032).
  - test: CT-125-8
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-143
  - status: unverified (check: where the harness keeps session state at auth tier 1 and whether it can be kept outside the real configuration home, and whether a pass that persists nothing leaves no session file in the home; capture E; verified-on: —; pin: claude 2.1.284)

- **F125-FR-015**: At auth tier 1 a pass MUST use the consumer's real configuration home and the harness adapter MUST NOT write, edit, create or remove any file in it: the home is read-only to the harness adapter, the removal of session state included (F125-FR-014). What the harness writes there by itself is not an act of the harness adapter; it is listed by capture E and recorded as a deviation (CQ-143). The harness adapter MUST switch off, for every pass and every critic-class call: plugins, host hooks, skills, tool servers of the harness and, unless the opt-in of F125-FR-018 is set for the proposer, the harness's own auto-loaded memory. Project instruction files are off too under the proposer's default isolation, since the standing prompt is self-contained (assumption). The harness adapter MUST hand the credentials of the harness to the harness only through the environment or the home the harness owns, never copy them, and never write them to a second home.
  - divergence: DV-002
  - parity: overlay scope `none` (row 30 of annex X §X.7): the environment of the stub carries no overlay variable
  - test: CT-125-9
  - ep: EP-02 `specstride.harness/1` (consumes)
  - assumption: CQ-143; CQ-147

- **F125-FR-016**: The harness adapter MUST read the initial record of every pass and every critic-class call and MUST assert what the record shows of the isolation. For a critic-class call a plugin, a host hook, a skill or a tool server in the record MUST refuse the call with `critic_not_toolless`. For a proposer pass the finding MUST be recorded as a warning event and be visible to the doctor, and the pass MUST go on. Administrator-managed settings still apply in the isolated mode, so the assertions are the backstop of the isolation. An auth tier 1 child MUST NOT load the plugin of the host: no host hook of Specstride's own plugin runs inside a proposer child, and a host skill of Specstride is never invoked by it.
  - test: CT-125-10
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-144
  - status: unverified (check: what the initial record of the pinned version lists about plugins, host hooks and servers, from a captured record; verified-on: —; pin: claude 2.1.284)

- **F125-FR-017**: At auth tier 2 the subprocess transport MUST authenticate with an API key resolved from a secret reference at the moment of use, passed by the environment and never in an argument list, and MUST use a throwaway configuration home built from an overlay of annex C §C.16 (scope `attempt` while a session is continued, else `pass`), removed when its scope ends, even when the pass is killed. The minimal mode MAY be used at auth tier 2 and MUST NOT be used at auth tier 1. The environment of an auth tier 2 call MUST NOT carry a subscription login token.
  - test: CT-125-11
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - divergence: DV-002

- **F125-FR-018**: Harness-native memory MUST be off for every critic-class call, and off by default for the proposer with an opt-in in user configuration (`memory.native.proposer`), and the setting MUST be recorded per run. The harness adapter MUST switch it off through the switch that the harness names in its descriptor. Under the `parity` profile the harness adapter MUST pass no switch about memory.
  - divergence: DV-047
  - parity: no flag or variable about memory is passed (row 29 of annex X §X.7)
  - test: CT-125-12
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-019**: The harness adapter MUST declare its containment ceiling with provenance `adapter`: C2 where the platform offers the sandbox of the harness for shell commands, else C1. Whether that sandbox also confines the harness's own file tools to a write root other than the workspace MUST be reported as `unverified` and MUST be captured before the specification freezes. The harness adapter MUST declare `concurrentSessions` null (`unverified`) until a capture shows that several headless processes may run under one configuration home and one login with separate session stores; until then parallel units MUST stay off for this harness at auth tier 1, with the reason stated. The harness adapter MUST never assert a sandbox by itself.
  - divergence: DV-030; DV-080
  - parity: containment as at the baseline: none (row 25 of annex X §X.7)
  - test: CT-125-13
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: fixture capture A, the write root of the harness's own file tools under the sandbox, and fixture capture B, concurrent headless sessions under one configuration home; verified-on: —; pin: claude version of the captures)

- **F125-FR-020**: The environment of every call MUST be an allow-list: the search path, the locale, the home or its overlay, the harness's own auth variables for the auth tier in use, the variable that hands the trace parent to the harness, and what the descriptor names. The consumer's other provider keys MUST NOT be inherited; the critic's credentials MUST NOT be in the proposer's environment and the reverse. The harness adapter MUST switch off the harness's own telemetry through the switch the descriptor names, and MUST scrub credentials from the environment of the shell commands of the tools where the harness offers that option (`harnesses.claude.subprocessEnvScrub`).
  - parity: `harnesses.claude.subprocessEnvScrub` off (no new variable in the transcript; row 120 of annex X §X.7); the trace parent is not passed
  - test: CT-125-14
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the scrub option and the trace-parent variable are documented for the pinned version and are observed in a stub transcript; documentation only; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-021**: The harness adapter MUST start every process in a process group of its own and MUST implement the three stops of the port: a polite stop that sends an interrupt and waits for a grace period so that the turn ends and the session can be continued, a termination, and a kill. It MUST declare the interrupt as its polite-stop signal. The exit code after a termination is 143 and MUST NOT be read as a provider failure by itself. `betweenPasses` MUST return `continue`.
  - divergence: DV-093
  - parity: off, the baseline sends a termination signal (row 11 of annex X §X.7)
  - test: CT-125-15
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: a live pass is interrupted and terminated and the final record and the exit code are read; documentation only; verified-on: 2026-09-29; pin: claude 2.1.284)

- **F125-FR-022**: The harness adapter MUST hand the prompt on unchanged and MUST put nothing volatile before it. It MUST NOT add per-pass text to the system prompt or change the system-prompt flags between the passes of one session. Whether the harness's own snapshot of the git state stays in context waits for the experiment X4; until it decides, the harness adapter MUST NOT set the switch that removes it, and the switch `harnesses.claude.gitInstructions` MUST be unset by default.
  - divergence: DV-094
  - parity: `harnesses.claude.gitInstructions` unset (row 121 of annex X §X.7; row 12 for the block set)
  - test: CT-125-16
  - ep: EP-02 `specstride.harness/1` (implements)

#### G3 - The critic: both auth tiers, the proof, the budget

- **F125-FR-023**: At auth tier 1 the critic MUST be the installed CLI started as a subprocess with the prompt on standard input, in an empty temporary working directory, on the model that the role plan names (by default a model tier different from the proposer's, F125-FR-026), with a fresh session whose id the harness adapter minted, with no session persistence, with no tool, no tool server, the customisations of F125-FR-015 off, a permission mode that denies and never asks, one turn, and a budget cap where the harness accepts one. No critic call MUST receive a flag that allows all tools. At auth tier 2 the CLI MUST NOT be a form of the critic: the critic at auth tier 2 is the direct call of F125-FR-028, or the SDK transport of F125-FR-038. The combination of flags has had no live call: it MUST be recorded `unverified` until one logged probe call per role has confirmed it, and the probe is a paid task that is not run by the specification.
  - divergence: DV-001
  - parity: the critic of each harness in its as-is transport and mode: the direct call of F125-FR-028 (row 28 of annex X §X.7)
  - test: CT-125-17
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: one logged live call per role with the flag combination of the plan: the flags combine without conflict, the session id is echoed on the initial record when nothing is persisted, and the budget cap holds under a subscription login; paid; verified-on: —; pin: claude 2.1.284)

- **F125-FR-024**: A critic-class call on the CLI MUST be refused with `critic_not_toolless` unless the initial record shows an empty tool list, an empty list of tool servers, and a session id equal to the one the harness adapter minted and not in the set of session ids of the proposer passes of the run. A call whose stream has no initial record MUST be refused. The result of the proof MUST be recorded in the call record of every critic-class call. A refusal is a critic configuration error that halts the run (engine exit 3, stop reason `critic_config`).
  - test: CT-125-18
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-025**: The critic MUST never share, resume, continue or fork the proposer's session. The critic invocation type of the harness adapter MUST have no parameter for a resume, a continue or a fork argument. The harness adapter MUST keep, per run, the set of session ids that proposer passes used, and MUST assert that a critic call's session id is not in it. The critic MUST run in an empty temporary directory, so that project settings, tool-server files and instruction files are not in reach even if a flag regresses. A critic session MUST NOT be persisted, so no later pass can resume it.
  - test: CT-125-19
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-026**: By default the critic's model tier differs from the proposer's (F124-FR-025; step 4 of the critic order of feature 100, annex C §C.6). The harness adapter MUST run the critic on the model that the role plan names and MUST NOT choose a model by itself. The critic-diversity rule and its trigger are those of F100-FR-024: where the critic and the proposer resolve to the same model, the critic-diversity warning is raised and recorded in `criticPick`, and the run goes on. A higher effort on the same model does not count as a different model: it is allowed, and the warning is raised (ruling 49). Where the model of either role is not known to the harness adapter, the harness adapter MUST report it as null and MUST NOT guess, so that the diversity test gives `unverified` and the warning is raised. The warning MUST never block a launch or a run and MUST never be a launch check. Native memory MUST be off for the critic (F125-FR-018).
  - test: CT-125-20
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-191

- **F125-FR-027**: A critic call MUST be capped in every way the transport allows: the output cap, one turn, a per-call spending cap where the CLI accepts one, and the prompt-size budget of the critic. Where no per-call cap is set the doctor MUST warn, and the single turn and the prompt-size budget bound the call. The critic MUST run only on a model whose context window is known up front: the table of the as-is critic gives 1,000,000 tokens for the listed Opus, Sonnet, Fable and Mythos ids and 200,000 for the Haiku id. Outside the `parity` profile there MUST be no default window: a Claude model that the table does not list and for which the consumer declared no window MUST NOT qualify as critic, and a critic-class call on it MUST be refused as a critic configuration error that names the model and the key to set. Under the `parity` profile only, an unlisted Claude model falls back to 200,000 tokens, as the baseline does. The consumer's explicit window (`roles.critic.contextTokens`, as-is variable `SPECSTRIDE_CRITIC_CONTEXT_TOKENS`) MUST always win; the model ids are data of the harness adapter and never a rule.
  - origin: C-066; B-0911
  - disposition: ported
  - test: PT-125-C-066-context-window; CT-125-34
  - divergence: DV-106
  - parity: the table and the fallback of 200,000 tokens as at the baseline (row 28 of annex X §X.7)
  - assumption: CQ-145; CQ-146

- **F125-FR-028**: At auth tier 2 the critic MUST be a direct call: an HTTP POST to `<base>/v1/messages` with the headers `x-api-key` and `anthropic-version: 2023-06-01`, a `max_tokens` of 2048, one user message and no field that names tools; the reply MUST be the concatenation of the `text` content blocks. The call has no session and no configuration home. Under the `parity` profile this call MUST be the critic of Claude at auth tier 1 as well, since it is the baseline's transport (DV-001), and the transcript of the critic stub MUST be compared in a transport-neutral form.
  - origin: C-066; B-0980
  - disposition: translated
  - test: PT-125-C-066-messages-call
  - divergence: DV-001
  - parity: the direct call is the critic of Claude (row 28 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-029**: The critic's direct call MUST resolve its key, base address and model as the baseline does, through aliases. The key MUST be the value of `SPECSTRIDE_CLAUDE_CRITIC_API_KEY`, else of `ANTHROPIC_API_KEY`; with neither, the call MUST fail without a reply and the verdict MUST be scored MALFORMED by the critic strategy. The base address MUST be `SPECSTRIDE_CLAUDE_CRITIC_BASE_URL`, else `ANTHROPIC_BASE_URL`, else `https://api.anthropic.com`, with a trailing slash removed. The model MUST be `SPECSTRIDE_CLAUDE_CRITIC_MODEL`, else the default critic model of the as-is critic data (`claude-opus-4-8`); it is also the key of the window lookup of F125-FR-027. Each as-is name MUST stay an alias of a key (annex X §X.8): the key is read from the variable at the moment of use, as a reference of the scheme `env:`, and an inline value in configuration MUST be a configuration error. The key MUST be sent only to the host it was declared for; a plain address MUST be refused unless it is the loopback address; redirects MUST be refused.
  - origin: C-061; B-0811; B-0812; B-0813; B-0814; B-0830
  - disposition: translated
  - test: PT-125-C-061-key-base-model
  - divergence: DV-027
  - parity: the as-is names and the as-is order of preference (row 28 of annex X §X.7)
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)

- **F125-FR-030**: A critic-class call that fails MUST produce no verdict: a transport failure (an error status, a hang, a non-zero exit, an empty reply) MUST be returned as a typed failure of the port and MUST be scored by the critic strategy as the baseline scores a transport error of the critic. The harness adapter MUST refuse a call that the terms gate does not allow at that moment. The critic's credentials MUST NOT be in the proposer's environment.
  - test: CT-125-21
  - ep: EP-02 `specstride.harness/1` (implements)

#### G4 - Quota signals, usage, model-tier ladder

- **F125-FR-031**: The harness adapter MUST supply the classifier entries of Claude to the quota classifier, as data in the failures map and as code where the map cannot express them. A limit event of the stream whose status is rejected MUST be `quota_window` with the confidence `structured` and `resetsAt` from the event; an event that only warns MUST be an observation with its utilization and MUST NOT pause; a retry event whose category is a rate limit MUST be `rate_limit_transient`; an overload (status 529) MUST be `overload` and MUST NOT be quota; a billing error, the credit-required code and the text "Credit balance is too low" MUST be `quota_credit`; an authentication failure MUST be `auth`; a spending cap of the call MUST be `budget_cap`; a prompt that is too long MUST be `context_window`. The limit messages of the result ("session limit", "weekly limit", the per-model limits) MUST be `quota_window` with the confidence `text`, and a reset time given only as text MUST be `null`. A `resetsAt` MUST be read when given. Every entry MUST give `retryable`, with the value of its class (`contracts/classifier-table.md`). The classifier MUST be a pure function.
  - divergence: DV-005
  - parity: not observable, the stub agents emit no quota signal (row 39 of annex X §X.7)
  - test: CT-125-22
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - status: unverified (check: fixture capture C, a real limit event on the CLI stream; the limit event's shape rests on the type file of the SDK and on strings of the binary, and a summarising fetch of the documentation contradicts it; verified-on: —; pin: claude version of the capture)

- **F125-FR-032**: The harness adapter MUST report usage per model call as increments, as each call completes and not only at the end; a pass that was killed MUST end with its usage marked incomplete and the last partial figure, or with usage unavailable. A continued session reports the whole conversation's total: the harness adapter MUST convert a cumulative report to increments per session id. The per-model breakdown MUST be preferred to the top-level usage, which covers the main loop only. The reported dollar figure is an estimate; at auth tier 1 it MUST be labelled notional and kept apart from real spending at auth tier 2. The model recorded MUST be the one the stream reports, else the one on the argument list, else null. An unknown figure MUST be null and never zero.
  - test: CT-125-23
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-033**: The harness adapter MUST declare the model-tier ladder of Claude, lowest first, as data with the model and the effort levels of the harness, read at run time from the harness adapter's data and never from a rule, and pinned for the run at launch. The harness adapter MUST state the model and the effort of a call by argument. It MUST NOT pass an argument that lets the harness fall back to another model, so that the model recorded is the model used. An escalation, a change of model tier and a change of effort MUST start a fresh session. Whether the consumer's plan includes a rung is unknown to the harness adapter and MUST be reported as unknown.
  - test: CT-125-24
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the effort levels and the model flag exist in `claude --help` (verified) and the models of the ladder are served under the consumer's login; verified-on: 2026-09-29; pin: claude 2.1.284)

#### G5 - The Agent SDK transport

- **F125-FR-034**: The harness adapter MUST offer the transports `subprocess` (the default) and `sdk-in-process`, and, for the critic at auth tier 2, `direct-call`. The consumer MUST choose a transport other than the default in user configuration, the environment or a flag (`harnesses.claude.transport`), and the harness adapter MUST never choose one automatically. The SDK transport MUST NOT be used under the `parity` profile. The SDK transport chosen under auth tier 1 MUST be a configuration error that refuses the launch. Project configuration MUST NOT choose a transport.
  - parity: `subprocess`; the SDK transport is not used (row 27 of annex X §X.7)
  - test: CT-125-25
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-035**: The SDK transport MUST authenticate with an API key from a secret reference and with nothing else. It MUST NOT use a subscription login, the login token of the CLI, or a credential of the consumer's configuration home. The environment handed to the SDK MUST be an allow-list that replaces the process environment and does not merge with it, and the SDK transport MUST use a throwaway configuration home. A subscription credential in the environment MUST NOT be used. No call of the SDK transport MUST carry a credential other than the key of its secret reference.
  - test: CT-125-26
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)

- **F125-FR-036**: The SDK MUST be an optional dependency and MUST never be bundled. It MUST NOT be in the published package, MUST NOT be vendored and MUST NOT be installed by the product. The harness adapter MUST load it at run time from the consumer's installation. When it is absent the transport MUST be unavailable, the doctor MUST say so, and the subprocess transport MUST be unaffected. A build step MUST check that the published package and everything it installs hold no file of the SDK, and that check MUST run in CI.
  - test: CT-125-27
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F125-FR-037**: The terms gate MUST evaluate the terms row of the SDK transport, which is `allowed` at auth tier 2 with an API key and never `allowed` with a subscription login. The SDK MUST have its own version range and `verified-on` date, fixed here: tested version 0.3.284, verified on 2026-09-29 by its type file and its documentation and not by a run. The range MUST be the 0.3 line from the tested version; a session interface of the SDK was removed inside that line, so the harness adapter MUST use only the call that starts a session with options. A version outside the range MUST give a doctor warning and MUST NOT block a run. The SDK's two peer packages and its per-platform binaries are the consumer's concern and MUST NOT be named as the product's dependencies.
  - ep: EP-11 `specstride.terms/1` (consumes)
  - test: CT-125-28
  - assumption: CQ-148
  - status: unverified (check: the pinned version is installed in a scratch directory outside the repository and the call of the transport is exercised with the stub of the harness; documentation and type file only; verified-on: 2026-09-29; pin: claude-agent-sdk 0.3.284)

- **F125-FR-038**: Both transports MUST give the same normalized records, the same call record, the same session directive, the same permission mode, the same isolation and the same proof of the critic's form. The conformance suite of EP-02 `specstride.harness/1` (feature 100, annex C §C.1) MUST run on both transports, with the recorded streams replayed and the classifier fixtures; the case on the captured limit event is a skip with its reason until capture C exists. On the SDK transport a critic-class call MUST be made with an empty tool list, no tool server, no settings source, no session persistence, a session id the harness adapter minted, one turn, a budget cap and an empty temporary working directory, and its initial message MUST pass the same proof as F125-FR-024. The SDK's typed messages MUST be mapped to the six normalized records by the same mapping as the stream reader applies to the stream of the CLI.
  - test: CT-125-29
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-039**: What is kept of Lisa's harness MUST hold on the SDK transport, proven by characterization tests written from the code at `363e6a3`. Usage MUST come from the provider's own accounting and never from the text of the stream. Failure kinds MUST come from structured codes first and from text second: a context-window phrase, a rate-limit phrase, an authentication phrase, a tool failure and a transport phrase map to the typed failures of the port (`context_window_exceeded`, `rate_limited`, `authentication_failed`, `agent_failure`, `transport_failed`); a stop that the caller requested and a time limit of the caller are not failures of the harness adapter. Prose that only mentions such a phrase MUST stay a success. A figure the provider did not report MUST be null, where Lisa's harness returned zero (F125-FR-032).
  - test: CT-125-30
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-040**: The mapping of the SDK's messages by the tap MUST be kept: the initial message gives the model, the session id and the tool count; an assistant message gives its text blocks and its tool-use blocks with a compact one-line target of at most 200 characters, taken from the first present of a file path, a path, a command, a pattern, an address or a notebook path, else the first names of the input; the final message gives the usage, the session id, the number of turns and the error. Any other message kind MUST be ignored. A failure of the tap MUST never break the loop. A backend that ignores structured output MUST fall back to raw output passed through unchanged with no structured record. The tap MUST NOT hold the prompt or the reply in a structured record.
  - test: CT-125-31
  - ep: EP-02 `specstride.harness/1` (implements)

- **F125-FR-041**: Four behaviours of Lisa's harness MUST be brought to the seam before their characterization tests are written. The permission mode MUST be that of F125-FR-012, and the bypass of prompts by default MUST NOT be kept. A request MUST carry the session directive of F125-FR-013, where Lisa's request had no session field. The pass MUST NOT end because the harness adapter polls for the evidence file: the pass ends by the terminal message of the SDK or by the stop of the port, and the end of a pass on phase evidence belongs to the pass loop. The harness adapter MUST NOT retry a call by itself: a transient retry belongs to the harness's own retry and to the classification of F125-FR-031. Two options of Lisa's harness MUST stay for the SDK transport: the harness's implicit idle cutoff is off unless the consumer sets it, so that the deadline of the caller is the only deadline, and a consumer's switch (`harnesses.claude.disableSubagents`) adds the sub-agent tool to the tools that are refused.
  - divergence: DV-031; DV-010
  - parity: the SDK transport is not used; `harnesses.claude.disableSubagents` not used (rows 26, 27 and 122 of annex X §X.7)
  - test: CT-125-32
  - ep: EP-02 `specstride.harness/1` (implements)

### Key Entities

| Entity | What it is |
|---|---|
| Claude harness adapter | The descriptor, code, classifier entries and recorded fixtures of Claude, on two transports |
| Transport | `subprocess`, `sdk-in-process`, `direct-call`; each with its auth tier and its terms row |
| Session directive | `fresh` with a minted id, or `continue` with an id, per pass |
| Initial record | The first record of a stream: tool list, server list, session id, model, capabilities |
| Proof of the critic | The result of the checks of F125-FR-024, recorded per critic-class call |
| Classifier entry | A row that maps one of Claude's signals to a quota class, a confidence and a reset time |
| Model-tier ladder | The ordered models and effort levels of Claude, pinned at launch |
| Terms row | The status of Claude at one auth tier and one audience, with its source and date |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F125-SC-001**: The critic never shares the proposer's session. In 100 per cent of the critic calls of the conformance suite and of the fixtures of FX-05 and FX-06, no critic call record carries a session id that a proposer pass of the same run used.
- **F125-SC-002**: Provider and host facts are dated. 100 per cent of the facts about Claude in this specification carry a `verified-on` date and a version pin, or the word `unverified` with the check that would verify them.
- **F125-SC-003**: The consumer's configuration is never written by the harness adapter. The number of files that the harness adapter writes, edits or creates in the configuration home of the consumer is 0 in every fixture run; the number of files that it removes there is 0 as well. The tree of the home before and after a run differs only in the files the harness keeps by itself, which the list of capture E names; that difference is the deviation recorded under CQ-143.
- **F125-SC-004**: The SDK is never bundled. The published package, and everything it installs, holds 0 files of the SDK, checked in CI on every build.
- **F125-SC-005**: No subscription through the SDK. The number of calls of the SDK transport that carry a credential other than the API key of their secret reference is 0 over the conformance suite, including the run with a subscription token planted in the environment.
- **F125-SC-006**: Parity of the invocation. 100 per cent of the scenarios of FX-01, FX-05, FX-06 and FX-26 that name Claude give `equal` or `waived` under DV-001, DV-027, DV-031 or DV-006 on the surfaces `exit`, `stdout`, `stderr`, `state`, `events` and `transcript`, and no invocation carries a continuation argument.
- **F125-SC-007**: The proof of the critic. In 100 per cent of the critic calls on the CLI the call record holds the result of the proof, and 100 per cent of the recorded initial records with a tool, a tool server, a foreign session id or no initial record are refused with `critic_not_toolless`.
- **F125-SC-008**: The two transports agree. The conformance suite of EP-02 passes on both transports, and the number of differences between the normalized records of the same replayed stream on the two is 0.
- **F125-SC-009**: Every class of the classifier has a fixture. Each of the classes `quota_window`, `quota_credit`, `rate_limit_transient`, `overload`, `auth`, `context_window` and `budget_cap` that F125-FR-031 assigns has at least one recorded stream in the fixtures of the harness adapter, written from the documented shapes without a paid call. The fixture with a captured limit event is added by capture C; its absence blocks the freeze of the status of F125-FR-031 only, and no test waits for it.
- **F125-SC-010**: One paid probe per role, logged. Exactly one live call per role (proposer and critic) confirms the flag combination before release, each is logged with its cost and the version of the CLI, and no other paid call is made by any test of this feature.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 (ruling 18) |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Claude is the default proposer and critic of Wave 1 | Decision 13 |
| The Agent SDK is an optional dependency, never bundled, and authenticates with API keys only | Rulings 20, 70 |
| Auth tier 1, the installed CLI under the user's own login, is the default for the audience `personal`; for the audience `distributed` auth tier 2 is the default | Decision 6; DP-042; ruling 1 |
| A proposer pass runs at the strongest containment the harness offers; the bypass mode only when the consumer chose it in user configuration, and then only with a detected sandbox and a user other than root | Rulings 34, P2; DP-011; CQ-183 |
| Auth tier 1 uses the real configuration home, never written by the run and read-only to the harness adapter, with customisations off | Ruling 36; DP-012, DP-038 |
| Subscription use only through the `claude` subprocess that the consumer installed and logged in | Ruling 70; DP-021 |

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements | The Claude descriptor, its code and its recorded fixtures: the first implementation of the port with two transports |
| EP-12 | `specstride.quota-classifier/1` | implements | The classifier entries of Claude (data in the failures map, and code for what the map cannot state) |
| EP-14 | `specstride.doctor/1` | implements (an entry) | The checks of the harness adapter, registered as entries of the doctor check registry of feature 100 (annex G §G.7) |
| EP-10 | `specstride.secret-resolver/1` | consumes | The API key of auth tier 2 and of the SDK transport, by secret reference |
| EP-11 | `specstride.terms/1` | consumes | The terms gate; this feature supplies the facts of the rows of Claude and of its SDK transport |

This feature owns no extension point. The event envelope `specstride.event/1` is used for the usage and quota signals that the harness adapter hands on; the content of the events belongs to feature 111.

## Contracts of feature 100 used

| Contract | Version | Where |
|---|---|---|
| Harness port; two capability levels; capability provenance; environment allow-list; executable resolution; transports; native memory; session directive | `specstride.harness/1` | Annex C §C.1, F100-FR-076, F100-FR-077, F100-FR-079, F100-FR-080, F100-FR-081, F100-FR-082, F100-FR-083 |
| Harness descriptor | `descriptorVersion: 1` | Annex C §C.2, F100-FR-084, F100-FR-085, F100-FR-086 |
| Forms of the `completion` level; the proof | part of `specstride.harness/1` | Annex C §C.3, F100-FR-087 |
| Stream readers; the six normalized records | `specstride.stream-dialect/1` | Annex C §C.5, F100-FR-090 |
| Critic order; resolved registry and role plan | `specstride.registry/1` | Annex C §C.6, F100-FR-092, F100-FR-093 |
| Secret resolver | `specstride.secret-resolver/1` | Annex C §C.11, F100-FR-107 |
| Terms-gate data | `specstride.terms/1` | Annex C §C.12, F100-FR-108 |
| Quota classifier | `specstride.quota-classifier/1` | Annex C §C.13, F100-FR-109 |
| Containment levels | — | Annex C §C.15, F100-FR-111, F100-FR-112 |
| Overlay schema | `specstride-overlay/v1` | Annex C §C.16, F100-FR-113 |
| Logical names of the prompt transfer, overlay tree and session state | `specstride.layout/1` | Annex B §B.5, F100-FR-053 |
| Doctor check registry | `specstride.doctor/1` | Annex G §G.7, F100-FR-189 |
| Event envelope | `specstride.event/1` | Annex X §X.1, F100-FR-198 to F100-FR-200 |
| Config envelope, ranks, trust classes; the alias table | `specstride.config/1` | Annex X §X.2, §X.8, F100-FR-201 to F100-FR-203 |
| Closed sets (rows 26, 28, 30, 33, 34, 36, 43, 46, 47) | — | Annex X §X.6, F100-FR-208 |
| The `parity` profile (rows 10, 12, 25, 26, 27, 28, 29, 30, 34, 39) | `specstride.profile/1` | Annex X §X.7, F100-FR-210 to F100-FR-212 |
| Threats T-07, T-34 | — | Annex X §X.9 |

Fixture families of feature 141 cited: FX-01 (`harness-claude`), FX-02, FX-05, FX-06 (`http-error`, `http-hang`, `cli-nonzero-exit`, `cli-empty-output`), FX-26 (`claude-<name>`), FX-39 (§O.2). Stub: the Claude harness stub of §O.3, with the proposer stub (P) and the critic stub (CH).

## Rows of the `parity` profile

Rows of annex X §X.7 that this feature holds, in whole or in part, and the switches it introduces.

| Switch | Key | Default | Under `parity` | Row of annex X §X.7 | Register row |
|---|---|---|---|---|---|
| Session continuation inside a phase attempt | `carry.continuation` | on, where the harness supports it: at auth tier 2; at auth tier 1 off until capture E (F125-FR-014) | off | 10 (owners 125, 103) | DV-010 |
| Permission mode and argument list of the harness | `sandbox.permissionMode` | contained (accept-edits), the mode always stated; the bypass mode from user configuration only | as at the baseline, through the argument table | 26 (owners 125, 130, 131, 134, 138) | DV-031 |
| Transport of the harness adapter | `harnesses.claude.transport` | `subprocess` | `subprocess` | 27 (owners 109, 125) | — |
| Transport and mode of the critic | `roles.critic.transport` | the CLI without tools at auth tier 1 | the direct call, the as-is transport | 28 | DV-001 |
| Harness-native memory | `memory.native.proposer` | off | no flag passed | 29 | DV-047 |
| Overlay of the configuration home | — | real home at auth tier 1, throwaway at auth tier 2 | scope `none` | 30 | DV-002 |
| Slash-command skills of the proposer | `harnesses.claude.proposerSkills` | off | off | 119 | DV-027 |
| Scrub of credentials from the environment of tool commands | `harnesses.claude.subprocessEnvScrub` | on | off | 120 | — |
| Removal of the harness's git snapshot from context | `harnesses.claude.gitInstructions` | unset | unset | 121 | DV-094 |
| Sub-agent tool refused (SDK transport) | `harnesses.claude.disableSubagents` | off | not used | 122 | — |

Rows 119 to 122 of annex X §X.7 are the four switches that this feature introduces.

## Closed sets

Stated as F100-FR-208 asks. This feature owns none of the six sets that annex X §X.6 leaves to owners. It states four sets of its own.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Outcomes of the proof of a critic call | `proved`, `refused-tool`, `refused-server`, `refused-session`, `refused-no-record`, `refused-customisation` | 125 | Design | Read as a refusal, `critic_not_toolless` |
| Availability of a transport | `available`, `absent-dependency`, `out-of-range`, `refused-at-tier`, `not-chosen` | 125 | Design | `unavailable` |
| Session directives of the harness adapter's call | `fresh`, `continue` | 125 | Design | `fresh` |
| Classifier signals of Claude | The signals of F125-FR-031: limit event (rejected, warning), retry event, overload, billing error, credit-required, authentication failure, spending cap, prompt too long, limit message, other | 125 | Design | `provider_other`, confidence `text` |

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by` or `dropped`: none. The 16 items of the five clusters are all kept (3 ported, 13 translated).

| Part of an item | Behaviour (short) | Disposition | Register row |
|---|---|---|---|
| Part of C-058 (locally registered backend) | The shared flags and the label are also given to a locally registered backend | Not carried | DV-064 (the consumer declares such a harness in the open registry; no name appears here) |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Which transport is the critic of Claude at auth tier 1 under the `parity` profile, given that the baseline reaches it by direct HTTP and the default is the CLI? → A: The direct call, as the baseline; DV-001 records the difference, and the transcript is compared in a transport-neutral form. (Source: DV-001; annex X §X.7 row 28; brief 125 heading 6)
- Q: May the Agent SDK be used under auth tier 1? → A: No. It is a configuration error; the SDK uses API keys only, and subscription use goes through the `claude` subprocess. (Source: rulings 20, 70; DP-021; R8v open question 2, which asks that the rule be stated in terms of the credential)
- Q: May the product install or bundle the SDK? → A: No. It is proprietary; the harness adapter loads it from the consumer's installation. (Source: ruling 20; R1 F8, O3; decision 19)
- Q: Which model tier does the critic use in a Claude-only setup? → A: By default a different model tier from the proposer's; where both roles resolve to the same model the critic-diversity warning is raised and never blocks, and a higher effort on the same model is allowed with the warning. (Source: decision 7; ruling 49; F100-FR-024; brief 125 heading 4)
- Q: Does the proposer pass `--bare`? → A: Never at auth tier 1, since it never reads the subscription login; it MAY at auth tier 2 with an API key. (Source: R5 Q3, F9; R3v D14)
- Q: Which permission mode does the proposer use? → A: Accept-edits with an allow list and no prompts. The bypass mode only when the consumer chose it in user configuration, and then only with a detected sandbox and a user other than root; the harness adapter checks the precondition and never chooses. Under `parity`, the as-is bypass list. (Source: ruling 34; CQ-183; DP-011; R5 Q7; DV-031)
- Q: What does a continued pass carry? → A: The session id; never "continue the latest", since that picks up the consumer's own sessions. Relaunch, kill, second repair and escalation start fresh. (Source: decision 22; ruling 55; R5 Q4; R24)
- Q: Where do the per-pass instructions go in a continued session? → A: In the user prompt, because the system prompt is recorded on the first request and reused. (Source: R5 Q4, F16)
- Q: Is the critic's per-call budget cap enforced under a subscription login? → A: Unknown; the flag exists, the cap is computed from the client-side estimate, and it is `inferred`. The fallback is one turn plus the prompt-size budget. (Source: R5 F30, open question 6)
- Q: Is a limit event on the CLI stream a fact? → A: Not yet. It is inferred from the SDK types and strings of the binary; a capture comes first. (Source: R5 F25; R14 open question 5)
- Q: How is the reported dollar figure treated at auth tier 1? → A: Notional and kept apart from real spending. (Source: ruling 66; DP-030; R14 rule 3)
- Q: Does the harness adapter hold the terms row of the SDK? → A: Yes, as data; the SDK is `allowed` at auth tier 2 with an API key only. (Source: ruling 20; EP-11; R8v rows 1 to 6)
- Q: What does feature 100 say about session state? → A: It lives per phase attempt under the logical name of the attempt's session, written by the harness and removed when the attempt ends. (Source: annex B §B.5; F100-FR-113)
- Q: What does the harness adapter do with a hidden flag? → A: It is documented and supported; capability detection cannot find it in the help, so the version floor and the capability list decide. (Source: R3v open question 1)

### Session 2026-09-29 (speckit-clarify)

- Q: Is the CLI a form of the critic at auth tier 2? → A: No. At auth tier 2 the critic is the direct call, which has no tools, no session and no configuration home by construction, or the SDK transport with an empty tool list. This integrates in F125-FR-023. (Source: R5 Q2, recommendation 3; brief 125 heading 1)
- Q: Does the SDK transport serve the critic as well as the proposer? → A: Yes; the brief requires the same proof of the critic's form on both transports, and R5 gives the options of the SDK for a tool-less critic. It integrates in F125-FR-038. (Source: brief 125 heading 4; R5 Q2)
- Q: What is done when the model tier of the proposer or of the critic is unknown, for example when no model is set and the harness picks its own? → A: The model is reported as null, the diversity test gives `unverified`, and the critic-diversity warning is raised, since diversity cannot be shown. This integrates in F125-FR-026. (Source: decision 7; F100-FR-077, unknown values are null and never guessed)
- Q: Does the harness adapter watch the wall-clock or the idle time of a pass? → A: No. The watchdogs, the pass ceiling and the kill belong to the pass supervision; the harness adapter implements `stop`. (Source: brief 125 heading 1, out of scope; annex C §C.1)
- Q: Which session state is removed at the end of a phase attempt, given that the harness adapter writes nothing in the real home? → A: None in the real home. Answer of 2026-09-29: only the state of the sessions the harness adapter minted. Answer after the cross-feature review (2026-09-30): the removal is a write, so the harness adapter removes nothing in the real home; at auth tier 1 a pass persists no session state and continuation is off until capture E shows that the state can be kept outside the home. (Source: ruling 36; Principle VIII; CQ-143)
- Q: Which requirements need the captures that come before the specification freezes? → A: F125-FR-019 (the write root under the sandbox and concurrent sessions), F125-FR-031 (the limit event on the CLI stream) and F125-FR-016 (what the initial record lists). They are paid, logged tasks; each blocks only the freeze of the status of its requirement, and no test waits for one. (Source: brief 125 heading 8; ruling P2; Principles XII and XVII)
- Q: Is the probe of the flag combination run by this feature? → A: No. It is a paid task that says so, must be logged, and is not run by the specification. (Source: `architecture.md` section 18, risk 8; brief 125 heading 8; STAGE-B-TIER2-PROMPT)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. The divergence register is that of `consolidation.md` section 6.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The argument tables, the compatibility projection and the normalization contract exist when the fixtures that compare them run.
- The stream reader for Claude's format is feature 126's; this feature relies on it for the normalized records and hands it the raw stream.
- Every macOS statement is `unverified`; nothing in this feature is verified on macOS (ruling 67).
- Every provider or host fact of this specification that rests on documentation only is marked `unverified` with the check that would verify it.

Readings that the sources do not settle. Each is marked in its requirement and reported.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-143 | Ruling 36 says the real configuration home is never written, and the criterion says it is byte-identical after a run. The harness itself writes session state and its own bookkeeping there | The reading nearest to the letter of Principle VIII and of ruling 36 (taken on 2026-09-30): the harness adapter writes nothing and removes nothing in the real home; at auth tier 1 continuation is off and a pass persists no session state, until capture E shows that the state can be kept outside the home. What remains as a deviation: the files the harness keeps by itself, listed by capture E and left out of the byte comparison. Recommended to the owner: state that exclusion in the ruling | F125-FR-014, F125-FR-015, F125-SC-003 |
| CQ-144 | What does the harness adapter do when the initial record of a proposer pass shows a customisation that the isolation should have switched off? | Record a warning and go on, for a proposer; refuse, for a critic. Recommended: keep, since a halt for a policy-managed item would stop runs on managed machines | F125-FR-016 |
| CQ-145 | B-0911 (ported) falls back to a window of 200,000 tokens for an unlisted Claude model; Principle IX says there is no default window for an unknown model | The reading nearest to the letter of Principle IX (taken on 2026-09-30): outside the `parity` profile an unlisted model has no default window and does not qualify as critic unless the consumer declares a window. What remains as a deviation: the fallback of 200,000 tokens under the `parity` profile, which Principle XVIII asks for. Recommended to the owner: confirm, and widen register row DV-106 to the Claude item B-0911 | F125-FR-027 |
| CQ-146 | What is the default per-call spending cap of the critic at auth tier 1? | None until the paid probe fixes it; the doctor warns; one turn and the prompt-size budget bound the call. Recommended: a cap of at least the cost of a full-window prompt at the tier's listed price, set in the data of the harness adapter after the probe | F125-FR-027 |
| CQ-147 | Are project instruction files loaded into a proposer pass? | No: the customisation-off mode drops them and the standing prompt is self-contained. Recommended: keep off; if the owner wants them on, a narrower flag combination is needed and unproven | F125-FR-015 |
| CQ-148 | What is the version range of the SDK? | The 0.3 line from 0.3.284; a warning outside it. Recommended: narrow it to the versions the conformance suite has run against | F125-FR-037 |
| CQ-183 | Does "user config" in ruling 34 stand for the user configuration only, or for every source the consumer controls? | The user configuration only: the bypass mode is taken from `sandbox.permissionMode` in user configuration, and not from the environment, a flag or project configuration | F125-FR-012 |
| CQ-191 | Is a higher effort on the critic's model a different model for the critic-diversity rule? | No: it is allowed, and the critic-diversity warning is raised (ruling 49; F100-FR-024) | F125-FR-026 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements and criteria changed in place; no id was renumbered or reused. Two test
names were appended: CT-125-33 and CT-125-34.

| Requirement | Item | What changed |
|---|---|---|
| F125-FR-003 | W-X-19 | `ep:` of EP-14 reads `implements (an entry)` |
| F125-FR-006 | W-X-33, W-X-19, W-125-02 | The registry is named by its contract of feature 100 (annex G §G.7); the sandbox check is the precondition that F125-FR-012 reads, not a choice of the mode |
| F125-FR-010 | W-X-11 | The switch is row 119 of annex X §X.7 |
| F125-FR-012 | W-125-02 | The bypass mode is used only when the consumer set it in user configuration; the harness adapter only checks the precondition and refuses the launch where it fails; test CT-125-33 appended; `assumption: CQ-183` |
| F125-FR-013 | W-125-03 | Continuation holds where it is in force for the auth tier |
| F125-FR-014 | W-125-03 | No removal in the real home; at auth tier 1 no session state is persisted and continuation is off until capture E; at auth tier 2 the state ends with the throwaway home |
| F125-FR-015 | W-125-03 | The real home is read-only to the harness adapter, removal included; the files the harness writes by itself are the recorded deviation (CQ-143) |
| F125-FR-020 | W-125-04, W-X-11 | "the auth tier in use"; row 120 |
| F125-FR-022 | W-X-11 | Row 121 |
| F125-FR-023 | W-125-01 | The critic runs on the model the role plan names |
| F125-FR-026 | W-125-01, W-115-02 | The opening MUST is removed; the rule and its trigger are those of F100-FR-024 (same model; the warning never blocks); recorded in `criticPick`; `assumption: CQ-191` |
| F125-FR-027 | W-125-03 | Outside `parity` no default window: an unlisted model without a declared window does not qualify; the fallback of 200,000 holds under `parity` only; test CT-125-34 appended; `divergence: DV-106` |
| F125-FR-031 | W-127-02 | Every entry gives `retryable`, the value of its class |
| F125-FR-036 | W-X-19 | `ep:` of EP-14 reads `implements (an entry)` |
| F125-FR-038 | W-X-33, W-X-15 | The conformance suite is named by its contract of feature 100; the case on the captured limit event is a skip until capture C exists |
| F125-FR-041 | W-X-11 | The switch is row 122 |
| F125-SC-003 | W-125-03 | No removal by the harness adapter; the harness's own files are the recorded deviation |
| F125-SC-008 | W-X-33 | The suite is named by EP-02 |
| F125-SC-009 | W-X-15 | Recorded streams are written from documented shapes; the captured fixture blocks only the freeze of the status |
| Whole feature | W-125-04; row 23 of the repair report of feature 100 | "Tier 1", "Tier 2", "Tier 3" are written "auth tier"; "same-model warning" is written "critic-diversity warning" |
