# Feature Specification: dsh harness adapter

**Feature Branch**: `130-adapter-dsh` (a label: Spec Kit creates no branch in this repository; the directory is `specs/130-adapter-dsh`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 130-adapter-dsh of Specstride: the dsh harness adapter, specified against the harness seam exactly as the Claude adapter is: a harness descriptor, optional code hooks and recorded fixtures. Detection and version with an exact pin; the headless proposer invocation with the prompt as one argument and a text reply; model selection through a throwaway settings overlay; the permission mode; the fact that a pass never continues a session; the critic made tool-less by a deny list in a patch file plus the read-only permission mode, and the proof of that mode for a text stream; the plugin request protocol of the baseline; quota and error signals on stderr and stdout; usage, which the harness does not report; the harness's own telemetry, switched off; the tier and terms row; the containment ceiling; the doctor checks; the fixture captures that must precede the freeze."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority: rulings 1, 2, 10, 32, 32b, 34, 35, 36, 37, 38, 58, 59, 60, 67, P2, P14, P15), `architecture.md` (sections 5, 14, 17), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 130-adapter-dsh, sections D.5 and D.8), `STAGE-B-RULES.md`, `STAGE-B-TIER2-PROMPT.md`, research R9, R4, R8v, R11, R14, R18, R20, feature 100 (annexes B, C, D, E, G, X), feature 141 (§O.2, §O.3, §O.4), and the Specstride baseline at `9cab15d` (`proposer.sh`, `lib/critic.py`, `lib/dsh_plugin_requests.py`, `lib/backends.py`).

## What this feature is

dsh is an agent command-line tool with a headless profile. It is one of the harnesses of the
one open registry. This feature is its harness adapter: the data and the small amount of code
that let the engine run a proposer pass, and a critic-class call, on dsh through the harness
port, without the engine knowing that it is dsh.

Feature 100 states the interface of the harness port (EP-02). The harness seam owns the registry
and the port. This feature is one tested harness adapter of Wave 1: a harness descriptor of kind
`cli` with a text stream, plus code hooks for three things the data cannot say. The first is the
throwaway settings overlay that selects a model. The second is the patch file that makes the
critic tool-less. The third is the plugin request protocol.

What is particular to dsh, in short:

| Fact | Consequence in this specification |
|---|---|
| The headless profile takes the whole prompt as arguments and prints the final reply as text | The prompt is one argument for the proposer. The critic prompt is split at spaces. There is no stream to read: the seam synthesizes the records `init` and `terminal` |
| The harness cannot continue a session | Every pass is a fresh session. Files carry the context. The switch for continuation has no effect on this harness |
| A model is chosen only through the settings file of the harness's home | A throwaway home is built per pass when a model is named. The consumer's real home is read and never written by a pass |
| The critic has no tool-free flag. Tools are switched off by a patch file that lists their ids (logical name `pass:<passId>:critic-patch`) | The list is a deny list and goes stale. The adapter checks the tool ids the installed version exposes against the patch before every critic call |
| A text stream has no initial record | The proof that the critic holds no tools is weaker than the proof of a stream that has one. This specification says so, and the plan records it as a deviation from Principle IX (CQ-182) |
| The harness reports no usage | Every pass says so, with a reason. No cost is invented |
| The harness's licence and upstream terms are not established | The harness is usable where the consumer names it, with a warning. It is never a default and never picked automatically, in either role and under every audience |
| A pass boots a profile of the harness's home, and the adapter has no switch that takes plugins, host hooks, skills, tool servers or a native memory out of it | The adapter says so: each switch is null in `capabilities`, the doctor warns and the state is recorded per run. This departs from Principle VIII and is a stated deviation (CQ-189). The critic role is refused unless native memory is shown to be off or absent |
| The harness can install its own plugins | The plugin request protocol of the baseline is ported. It is an opt-in by an allowlist that only the consumer sets |

The pages of the harness on the web and in its help are the source of facts. Each fact carries
a date and the version pin, or is marked `unverified` with the check that would settle it.

Out of scope, and where it lives:

| Not here | Owner |
|---|---|
| The port, the descriptor schema, the generic harness adapter, the overlay schema, the containment levels | The harness seam (feature 100, annex C) |
| The registry of stream readers, and the synthesis of `init` and `terminal` for a text stream | The stream seam. This feature supplies the dsh mapping and its fixtures |
| What a quota class does to a run | Feature 100, annex C §C.13, and the quota pause |
| The pass loop, its breakers, and the order of prompt blocks in general | The pass loop. This feature owns the dsh variant of each |
| The terms gate as policy, the audience, the spelling of config keys, the alias table | Feature 100, annex X §X.2 and §X.8; feature 110 owns the spelling |
| Discovery and the critic order | Feature 100, annex C §C.6 |
| dsh as a host of the product | A later wave. This feature is about dsh as a harness |
| Span export of the harness's own trace plugin | Not shipped. The adapter exports the trace parent to the process and nothing more |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A proposer pass runs on dsh and delivers phase evidence (Priority: P1)

A consumer names dsh as the proposer. The runtime starts the headless profile with the prompt as
one argument, in the workspace, with the permission mode stated, and reads the reply as text. If
the consumer named a model, the pass runs on that model through a throwaway home.

**Why this priority**: It is the parity behaviour of the baseline's default proposer. Ruling 32
makes every parity test of this harness release-blocking.

**Independent Test**: Run the parity fixtures FX-01 and FX-26 with the stub executable named
after the as-is command. The argument list, the names of the environment variables and the
prompt seen by the stub equal those of the reference.

**Acceptance Scenarios**:

1. **Given** dsh as proposer with no model named, **When** a pass starts, **Then** the argument list is the executable, `--profile`, the profile, and the prompt as one argument, and no overlay is built.
2. **Given** a model named as `provider/model`, **When** a pass starts, **Then** a throwaway home holds a new settings file with that model, every other entry of the real home is linked in, and the home is removed after the pass.
3. **Given** a model named twice (flag and qualifier), **When** the pass starts, **Then** the pass fails with the as-is message and no process starts.
4. **Given** the executable is not found, **When** a pass starts, **Then** the pass returns 127.
5. **Given** dsh named as proposer and `harnesses.dsh.proposerCustomisations` left at `off`, **When** the run is launched outside the `parity` profile, **Then** the launch and the doctor state that the customisations of the profile cannot be switched off, and the run record holds the state `not-switchable` for each kind.
6. **Given** no proposer is named, **When** role resolution runs, **Then** this harness is never the proposer, under any audience.

---

### User Story 2 - dsh is the critic and cannot act (Priority: P1)

A consumer names dsh as the critic. Before each call the adapter proves what it can: the exact
version, the coverage of every tool id the installed version exposes by the patch file, the hash
of the patch, and the read-only permission mode. If a tool is not covered, the critic role is
refused.

**Why this priority**: Principle IX. A critic that can call tools is not shipped. The list is a
deny list, so the check is what keeps it honest.

**Independent Test**: Run the conformance suite with a fake executable that exposes one tool id
more than the patch covers. The critic role is refused with `critic_not_toolless`.

**Acceptance Scenarios**:

1. **Given** the pinned version and a patch that covers every exposed tool id, **When** a critic call is made, **Then** the record of the call holds the version, the coverage result, the hash of the patch and the mode `read-only`.
2. **Given** a fake executable with one more tool id, **When** the critic role is checked, **Then** it is refused with `critic_not_toolless`.
3. **Given** a version other than the pin, **When** the critic role is checked, **Then** it is refused; for the proposer role the doctor warns only.
4. **Given** the critic exits non-zero or returns an empty reply, **When** the call ends, **Then** the failure carries the first 300 characters of standard error, or of standard output when standard error is empty, and no verdict exists.
5. **Given** no recorded capture shows that native memory of the harness is off or absent, **When** the critic role is checked outside the `parity` profile, **Then** it is refused with the reason `memory-not-off`.
6. **Given** no critic is configured, **When** role resolution picks one, **Then** this harness is never picked, under the audience `personal` as under `distributed`.

---

### User Story 3 - A limit or an error of the provider is understood (Priority: P1)

dsh prints `dsh: <CODE>: <message>` on standard error, and the critic's failures sometimes land
on standard output. The adapter scans both and hands the classifier a typed signal: a quota
window, a credit limit, a transient rate limit, an exceeded context window, or an invalid
credential.

**Why this priority**: A run must wait for a limit and never count it as an error. A context
window error must never be scored as a malformed verdict.

**Independent Test**: The classifier fixtures: each of the four codes, on each of the two
streams, gives the class of F130-FR-038.

**Acceptance Scenarios**:

1. **Given** `dsh: QUOTA: ... resets ...` on standard error, **When** the pass ends, **Then** the class is `quota_window` with confidence `status`, and the reset time is parsed or null.
2. **Given** the same text on standard output, **When** the pass ends, **Then** the class is the same.
3. **Given** `dsh: CONTEXT_WINDOW_EXCEEDED: ...`, **When** the critic call ends, **Then** the class is `context_window` and the outcome is never MALFORMED.

---

### User Story 4 - A proposer asks for a plugin and gets it, or is refused (Priority: P2)

A consumer who listed exact plugin specs in user configuration lets the proposer write one
request file. After the pass exits, the runtime validates the request as a claim, installs the
listed plugins, writes a receipt, and starts a fresh pass. A request outside the allowlist ends
the run with a visible reason.

**Why this priority**: 27 items of the baseline, all release-blocking. The install writes to the
consumer's real home, so consent and the record matter (ruling P15).

**Independent Test**: The fixture family FX-38 with a stub installer: `installed-then-restart`,
`installed-on-final-pass`, `allowlist-empty`, `denied-not-in-allowlist`,
`invalid-request-<case>`, `installer-fails`, `installer-times-out`,
`request-and-evidence-in-one-pass`, `qualified-harness-never-processed`.

**Acceptance Scenarios**:

1. **Given** a valid request whose plugins are all listed, **When** the pass exits, **Then** the installer is called with a fixed argument list, a receipt is written, the request is archived, and the next pass starts fresh and is exempt from every breaker.
2. **Given** a request and an empty allowlist, **When** the pass exits, **Then** the pass loop returns 7 and the event `plugin_install_denied` names the reason `allowlist_empty`.
3. **Given** an install on the final pass, **When** it ends, **Then** the pass loop returns 4.
4. **Given** dsh named with a qualifier, **When** a request file exists, **Then** it is never processed and the prompt has no protocol section.

---

### User Story 5 - A maintainer knows which facts are dated and which are not (Priority: P2)

Every fact about dsh carries the version pin and a `verified-on` date, or an `unverified` mark
with the check that settles it. Six captures precede the freeze (F130-FR-042); among them: what
approval mode `ask` does in a headless run, whether the permission mode is enforced by the
operating system, the list of tool ids of the pinned version, and what the profile loads into a
call.

**Why this priority**: Constitution, workflow rule on facts. Several facts that the adapter needs
are not established today.

**Independent Test**: List every fact of the descriptor, the fixtures and the terms row. Each has
a date and the pin, or the mark and the check.

**Acceptance Scenarios**:

1. **Given** the descriptor, **When** it is read, **Then** the containment ceiling reads C1 with the mark `unverified`.
2. **Given** the release notes, **When** a capture is missing, **Then** the requirement that waits for it is listed as `unverified`.

### Edge Cases

- The harness's home does not exist: the pass starts without an overlay when no model is named; with a model named the overlay holds only the new settings file.
- A model reference has an empty provider or contains a character outside the allowed set: the pass fails with `invalid DSH model ref`.
- The prompt of a proposer pass is larger than one argument can be: F130-FR-011 applies.
- A single token of the critic prompt exceeds 120 KiB: the call is an error.
- A chunk of the critic prompt would start with a dash: the split is moved so that it does not.
- The request file is a link, is larger than 16,384 bytes, has a fourth key, names a range or a tag, or repeats a plugin: it is refused and the run ends with 7.
- The installer exceeds its time limit: the request is refused, no receipt is written and the run ends with 7.
- The consumer's allowlist entry is not an exact `package@semver`: the whole allowlist is refused.
- A pass was killed while its overlay existed: the overlay is removed even so.
- The installed harness gains a tool after a plugin install: the coverage check runs again before the next critic call.
- The pass ends without a reply while the harness waits for an approval: the pass is an `agent_failure`; the adapter never waits.
- The consumer set `harnesses.dsh.proposerCustomisations` to `off` and the adapter has no switch: the pass runs, the state is `not-switchable`, and the launch and the doctor say so. The adapter never records `off` for a customisation it did not switch off.
- The consumer named dsh as critic and the state of native memory is not established: outside the `parity` profile the critic role is refused with `memory-not-off`.
- The audience is `personal` and no harness is named for a role: dsh is not the default and is not picked.

## Requirements *(mandatory)*

### How to read this section

Requirements follow the written form of `STAGE-B-RULES.md` section 4. "The adapter" is the dsh
harness adapter. "The pass loop" and "the engine" are the callers of the harness port. Where a
requirement says "under the `parity` profile", the value is the one that reproduces the baseline
at `9cab15d`. The stub executable that the oracle uses is named after the as-is command, `dsh`
(DV-064). Every statement about macOS is `unverified` (ruling 67). The pin of the harness is the
exact version `0.1.0-rc.8`, `verified-on` 2026-09-29.

Requirement groups: G1 detection, version, descriptor, tier and terms, doctor (F130-FR-001 to
F130-FR-006). G2 proposer (F130-FR-007 to F130-FR-020). G3 critic (F130-FR-021 to F130-FR-030).
G4 plugin request protocol (F130-FR-031 to F130-FR-037). G5 signals, usage, telemetry,
environment (F130-FR-038 to F130-FR-041). Fixture captures and probes (F130-FR-042). G6 what the
profile loads: customisations and native memory (F130-FR-043 to F130-FR-045), added by the repair
of 2026-09-30.

### Functional Requirements

#### G1 — Detection, version, descriptor, tier and terms row, doctor

- **F130-FR-001**: The dsh harness adapter MUST be a tested harness adapter of the one open registry: one harness descriptor of kind `cli` (`descriptorVersion: 1`) with the stream format `text`, provider identity `dsh` (the vendor of the models behind it is chosen in the harness's own settings and is known only where a qualifier names it), and code hooks for the settings overlay, the patch file of the critic and the plugin request protocol, with a version pin and a `verified-on` date. The entry MUST serve the roles proposer and critic, each with an optional qualifier of the form `provider/model`. Under the `parity` profile the entry MUST name no stream format and declare no overlay scope, as the entry of the baseline does, and the stub executable MUST be named after the as-is command. Outside the profile the stream mapping for a text stream applies, through the registry of stream readers of feature 100, annex C §C.5: the seam synthesizes `init` and `terminal`. No control flow of the core MUST test the harness's name; the two places where the baseline compares with the bare name become the capability of F130-FR-035.
  - origin: B-0426
  - disposition: ported
  - test: PT-130-C-035-*
  - divergence: DV-064
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the entry of the baseline: proposer and critic, optional qualifier, no stream, no overlay (rows 26, 27, 28 of annex X §X.7)

- **F130-FR-002**: Detection MUST establish presence, version and the existence of the configuration home free of charge, with the version command of the harness and nothing that changes state. The executable MUST be resolved to an absolute path and recorded with its version (F100-FR-080). The pin MUST be the exact version `0.1.0-rc.8`, `verified-on` 2026-09-29; no range is accepted. For a version other than the pin, the doctor MUST warn for the proposer role and MUST fail for the critic role, and a failure for the critic role MUST be launch-blocking when this harness is the critic (F130-FR-025). Each pass MUST record the harness version, and a change of version between two passes of one run MUST be a warning. Nothing is downloaded to reach a pin.
  - test: CT-130-2
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 (check: `--version` and `--help` of the installed command; verified-on: 2026-09-29; pin: 0.1.0-rc.8)

- **F130-FR-003**: The operation `capabilities` MUST report, each with its provenance or as null: the containment ceiling C1 with the mark `unverified` (F130-FR-018); continuation `none` (F130-FR-016); the usage source `none` (F130-FR-039); the tool-less mechanism of the critic `config` (a patch file) together with the read-only critic mode; the identity of provider and model where a qualifier names them, else null; the switch for native memory as null (the harness offers none that the adapter uses), together with whether a native memory exists, which is `unverified` (F130-FR-044); the switch for each kind of customisation of the profile (`plugins`, `host-hooks`, `skills`, `tool-servers`) as null, because the adapter has no switch that takes one of them out of a pass (F130-FR-043); the cost class as `unknown`; the context window (F130-FR-029). A switch MUST be reported as other than null only when a recorded capture shows that it takes effect. `concurrentSessions` MUST be null until a recorded capture shows several headless processes of this harness running at once under one configuration home and one login, with separate session stores; the capture of the owner's ruling of 2026-11-03 (three `zai/glm-5.3-flash` sessions at once, CT-130-46) is recorded, so the adapter declares it with the proven count and the mark `verified`, and the descriptor carries `true` (F142-FR-020 reads it through EP-02). The process-level spending limit MUST be null, and the model-tier ladder MUST be null: without a ladder from the consumer an escalation is skipped for this harness and recorded. `betweenPasses` MUST return `continue`, except for the plugin cases of F130-FR-036. A capability that no run has shown MUST be marked `unverified`.
  - test: CT-130-3
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-189 (that a harness whose customisations cannot be switched off is usable as proposer when the consumer names it, with each switch reported as null)
  - status: verified-on 2026-11-03 for `concurrentSessions` (check: capture 2 of F130-FR-042 for the containment ceiling; capture 6 for native memory and the customisations of the profile; several headless processes under one home is established by CT-130-46, the owner's ruling of 2026-11-03); verified-on: 2026-11-03; pin: 0.1.0-rc.8

- **F130-FR-004**: The adapter MUST supply the facts of its row of the terms-gate data: provider `dsh`, auth tier 1 and auth tier 2, status absent (no row establishes the licence or the upstream terms), which the gate reads as unknown terms. While the terms are unknown, the harness MUST never be a default and MUST never be picked automatically, for the proposer role and for the critic role alike, under every audience and under every profile (ruling P14; F100-FR-093). It MUST be usable in a role only where the consumer named it for that role, by `roles.proposer.harness` or `roles.critic.harness` or by the flag or the as-is variable that is their alias; a fallback entry that the consumer wrote names it as well. Every launch that names it MUST state "unknown terms", and the doctor MUST warn; under the `parity` profile the warning is recorded and no line is printed (ruling 68). Where no harness is named for a role, role resolution MUST pass over this harness with the reason `terms-unknown`. The audience changes nothing in this requirement: `personal` lifts neither bar. Auth tier 3 is never valid. The adapter MUST NOT hold a login token.
  - test: CT-130-4
  - divergence: DV-048; DV-003
  - ep: EP-11 `specstride.terms/1` (consumes)
  - parity: audience `personal` (row 34 of annex X §X.7); every fixture names the proposer and the critic (row 36), so the bar is not reached
  - status: unverified (check: the licence and the terms of the upstream endpoints are established by the owner of the harness; the research read them as not established; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-005**: The adapter MUST register these checks with the doctor: executable found and its resolved path; version equal to the pin; the state of the home (exists, is readable); for a critic role, the coverage of F130-FR-024; whether the harness's own trace plugin captures content while the product's content capture is off (a warning); the size of the declared context window against an override (F130-FR-029); the unknown terms of F130-FR-004; each kind of customisation of the profile that the adapter cannot switch off, unless the consumer opted in (F130-FR-043); the state of native memory (F130-FR-044); for a critic role, the refusal of F130-FR-045; and one line that lists the facts of this adapter that are still `unverified`. A check MUST read and never write, MUST make no paid call, MUST read no secret value, MUST close standard input of every process it starts, and MUST keep to its time limit. The checks of executable and version for a role in use MUST be launch-blocking, as F130-FR-002 says, and so MUST the check of F130-FR-045 when this harness is the critic; the others MUST be warnings.
  - test: CT-130-5
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F130-FR-006**: Every provider fact and harness fact of the descriptor, of the recorded fixtures and of the terms row MUST carry a `verified-on` date and the version pin of the harness, or MUST be marked `unverified` with the check that would settle it. A fixture recorded from a capture MUST state the version of the harness that produced it. Facts that rest on documentation only, and every statement about macOS, MUST be `unverified`.
  - test: CT-130-6
  - status: verified-on 2026-09-29 (check: the facts of R9 read from the installed command and its packages; verified-on: 2026-09-29; pin: 0.1.0-rc.8)

#### G2 — Proposer: invocation, model, overlay, permission mode, no continuation

- **F130-FR-007**: A proposer pass MUST start the executable as `<executable> --profile <profile> <prompt>`, with the whole prompt as one positional argument and no flag that allows all tools, in the working directory of the pass, with standard input closed. The reply MUST be read as text. The argument list, the names of the environment variables and the prompt seen by the stub MUST equal those of the reference. The default profile is `headless`.
  - origin: B-0688
  - disposition: ported
  - test: PT-130-C-058-*
  - divergence: DV-030; DV-031
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the argument list of the baseline, mapped through the argument table of this adapter (row 26 of annex X §X.7)

- **F130-FR-008**: The settings of the proposer MUST be these, each an alias of a key, so that the as-is variable and the key reach the same value: the executable (`harnesses.dsh.bin`, default `dsh`); the profile (`harnesses.dsh.profile`, default `headless`); the real home of the harness (`harnesses.dsh.home`, default `.dsh` in the consumer's home), which is read, linked into the overlay and exported to the process; the provider for a model reference without a provider (`harnesses.dsh.provider`); the model reference used when the flag names none (`roles.proposer.model` for this harness), which takes precedence over the qualifier of the entry; the reasoning effort, when non-empty written into the overlay (`roles.proposer.effort`); and the permission mode of F130-FR-010. The as-is variables stay as aliases of these keys (DV-027).
  - origin: B-0508; B-0509; B-0510; B-0513; B-0514; B-0515; B-0516
  - disposition: translated
  - test: PT-130-C-052-*
  - divergence: DV-027; DV-030
  - parity: the as-is variables, mapped through the alias table (annex X §X.8), which holds the aliases of `harnesses.dsh.home` and `harnesses.dsh.provider`; `roles.proposer.effort` is reached by the alias `SPECSTRIDE_DSH_REASONING_EFFORT`

- **F130-FR-009**: When the executable of the harness is not found, the pass MUST return the status 127, with a message that names the setting to change, and the pass loop MUST go on until a breaker ends it. No overlay MUST remain.
  - origin: B-0571
  - disposition: translated
  - test: PT-130-C-054-*
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the result record of the pass carries 127 (LR-6 of annex A; annex E §E.4)

- **F130-FR-010**: The permission mode MUST be exported to the process and MUST be stated in the record of every call. Under the `parity` profile it MUST be `workspace-write` for the proposer unless the consumer set a value, as at the baseline. Outside the profile it MUST be `workspace-write` for the proposer and `read-only` for the critic, and the mode `danger-full-access` MUST be used only when the consumer opted in to containment C0 in user configuration. The opt-in MUST come from user configuration only: the environment, a flag and project configuration MUST NOT give it (ruling 34; F100-FR-111). Without the opt-in, a configured value of `danger-full-access` is a configuration error. The mode is a contained mode of the harness, not a sandbox of the operating system, and the runtime MUST NOT assert a sandbox (F100-FR-111).
  - test: CT-130-10
  - divergence: DV-030; DV-031
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `workspace-write` as at the baseline (rows 25, 26 of annex X §X.7)
  - assumption: CQ-183 (that "user config" in ruling 34 means the user configuration only)

- **F130-FR-011**: The proposer prompt travels as arguments, so its size MUST be bounded (Principle VIII). The descriptor MUST declare the limit of one argument, 120 KiB. A prompt within the limit MUST be one argument, as F130-FR-007 says. A prompt over the limit MUST be split only at ASCII spaces into chunks within the limit, with no chunk starting with a dash, because the harness joins its task arguments with one space; a single token over the limit MUST fail the pass with a message that names the limit. The baseline passes one argument of any size and the kernel refuses one over its own limit.
  - test: CT-130-11
  - divergence: DV-108
  - status: unverified (check: capture 4 of F130-FR-042 confirms that the headless profile rejoins several task arguments with one space for the proposer path as it does for the critic path of the baseline; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-012**: The model of a proposer pass MUST be resolved in this order: the flag, then the model setting of F130-FR-008, then the qualifier of the entry. With none of the three, no overlay MUST be built and the profile's own settings select the model. A reference `provider/model` MUST be used as given. A model with no provider MUST take the provider setting, or the provider of the table of F130-FR-013, else the pass MUST fail with the as-is message `DSH model '<raw>' needs a provider; use provider/model or set the provider setting`. A provider embedded in the reference that differs from the provider setting MUST fail the pass with `conflicting DSH providers`. A reference whose provider does not match `[A-Za-z0-9._-]+` or whose model does not match `[A-Za-z0-9._:-]+` MUST fail the pass with `invalid DSH model ref`. A qualifier together with the flag MUST fail the pass with `use either --backend dsh:<provider/model> or --model, not both`, and the pass returns 1. The lines start with the component name `pass-loop` (rule N-15).
  - origin: B-0676; B-0678; B-0679; B-0686; B-0687
  - disposition: ported
  - test: PT-130-C-058-*
  - divergence: DV-066
  - ep: EP-02 `specstride.harness/1` (implements)

- **F130-FR-013**: A bare model id with no provider MAY be mapped to a provider by a table. The table MUST be user configuration (`harnesses.dsh.modelProviders`, a map from a bare id or a prefix pattern to a provider and, where it differs, a model), and the product MUST ship one built-in row: a bare id that begins with `glm-` maps to the provider `zai`. Any other row of the baseline's table is specific to the owner's machines and MUST NOT ship and MUST NOT be named in any specification; a consumer or a fixture supplies it through the configuration. The same table serves the proposer and the critic. An id that no row matches, and that has no provider, fails as F130-FR-012 says (for the critic, F130-FR-028).
  - origin: B-0677; B-0984
  - disposition: ported
  - test: PT-130-C-058-*; PT-130-C-066-*
  - divergence: DV-109
  - parity: the rows of the baseline, supplied by the configuration of the fixture

- **F130-FR-014**: With a model override the adapter MUST build a throwaway home for the pass in the temporary directory. Every entry of the real home except the settings file MUST be linked into it, including entries whose names begin with a dot. The settings file MUST be written new: first the block that selects the model (provider, model and, when set, the reasoning effort), then the real settings file with its own model block removed. The home MUST be exported to the process in place of the real one, and MUST be removed after the pass, also when the pass was killed. A failure to build it MUST fail the pass with the one line `could not build DSH_HOME overlay for <provider/model>` on standard error, return 1, and leave nothing behind. The line starts with the component name `pass-loop`. The home is recorded by its logical name `overlay:dsh:tree`. Because every entry is linked, the throwaway home carries the plugins, host hooks, skills, tool servers and memory of the real home: it selects a model and takes nothing out of the profile. What that means for a pass is stated in F130-FR-043 and F130-FR-044.
  - origin: B-0621; B-0624; B-0642
  - disposition: translated
  - test: PT-130-C-056-*; PT-130-C-057-*
  - divergence: DV-006; DV-066
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: overlay scope `none` for the generic overlay of the descriptor; the dsh settings overlay of this requirement is part of the as-is behaviour and stays (row 30 of annex X §X.7; fixture family FX-39 declares an overlay)

- **F130-FR-015**: A pass MUST NEVER write the consumer's real home of the harness. Without the plugin protocol of G4, the real home MUST be byte-identical before and after a pass, at both auth tiers. The throwaway home MUST hold links and one new file only. This meets the first half of ruling 36 and of F100-FR-113, that the real home is never written. The second half, that the customisations of the harness are off, is not met by this adapter and is the subject of F130-FR-043. The one write that is allowed is the plugin install of F130-FR-034 (ruling P15), which stays the one exception to ruling 36.
  - test: CT-130-15
  - divergence: DV-002
  - ep: EP-02 `specstride.harness/1` (implements)

- **F130-FR-016**: The harness cannot continue a session: every headless run creates a new session. The descriptor MUST declare `session.continuation: none`. Every pass MUST be a fresh session and context MUST be carried by the handoff and the ledger. The switch for continuation (`carry.continuation`) MUST have no effect on this harness, and the run MUST record that it had none. The micro-loop layer MUST run at level L1 for a phase attempt on this harness, without continuation.
  - test: CT-130-16
  - divergence: DV-010
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off, and off always for this harness (row 10 of annex X §X.7)
  - status: verified-on 2026-09-29 (check: the headless application creates a session per run, takes only the task and has no resume or model flag; read from the installed package; verified-on: 2026-09-29; pin: 0.1.0-rc.8)

- **F130-FR-017**: A pass MUST NEVER wait on a human. The standard input of the process MUST be closed, and the watchdogs of the pass supervision apply. What the approval mode `ask` does in a headless run with no human is `unverified`. Until capture 1 of F130-FR-042 exists, a pass that ends without a reply MUST be classified `agent_failure`, and a pass that outlives its watchdogs while waiting MUST be ended by them like any other.
  - test: CT-130-17
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: capture 1: a scripted call in a headless run under each permission mode, with standard input closed, records whether the process waits, fails or answers; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-018**: The containment ceiling MUST be declared C1 with the mark `unverified`. Whether the permission mode is enforced by the operating system is not established. Until a fixture shows that it is, the run record MUST say `protection=detect`, a proposer on this harness MUST NOT be assumed to be sandboxed, and parallel units MUST stay off for this harness with the reason stated, unless the consumer set `loop.parallel.allow_detect` in user configuration; the environment, a flag and project configuration MUST NOT set it (ruling P2; F100-FR-112). The adapter MUST NOT claim C2 by itself.
  - test: CT-130-18
  - divergence: DV-030; DV-080
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off (rows 20, 23, 25 of annex X §X.7)
  - assumption: CQ-183 (that "user config" in ruling P2 means the user configuration only)
  - status: unverified (check: capture 2: a scripted call in `read-only` mode tries to write a file outside the workspace, to write inside it and to reach the network, and records what the operating system allowed; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-019**: When a pass ends without phase evidence, the event `iter_done` MUST carry `evidence=missing`, and after a pass that ended with a plugin install it MUST also carry `plugin_restart=true`. The compatibility projection renders the fields as the as-is literals. The general rules of the event and of its yield variant belong to the pass loop; this requirement states the plugin variant.
  - origin: B-0563
  - disposition: translated
  - test: PT-130-C-053-*
  - divergence: DV-007
  - parity: on, through the compatibility projection (row 17 of annex X §X.7)

- **F130-FR-020**: The pass prompt MUST be assembled in this order: the standing prompt, and after it the section of the plugin protocol when the protocol is enabled; then the block of the status of a long job; then the block of the note of a killed pass; then the block for the resume of a yield; then the block of the short-pass nudge. The blocks are joined by a blank line and each is present only when it is not empty. The section of the plugin protocol is a block that this adapter contributes through the prompt block provider, and its place is that of the baseline. Outside the `parity` profile the assembler may reorder stable blocks, but the section MUST stay a block of the adapter and MUST never reach the critic.
  - origin: B-0764
  - disposition: ported
  - test: PT-130-C-058-*
  - divergence: DV-020; DV-094
  - ep: EP-15 `specstride.prompt-block/1` (implements)
  - parity: the as-is block set and order (row 12 of annex X §X.7)

#### G3 — Critic: patch and deny list, coverage check, proof, prompt as arguments, window

- **F130-FR-021**: A critic call MUST start the executable as `<executable> --profile <profile> --patch <patch file> -- <task arguments>`, in a working directory that the engine names, and MUST take standard output as the reply. Under the `parity` profile the working directory is the one the engine hands over, as at the baseline; outside the profile it MUST be an empty directory made for the call (the placeholder `{emptyTmp}` of annex C §C.2), so that the critic cannot read the project even if a tool were to remain. The environment MUST hold the permission mode of F130-FR-022 and the home of F130-FR-028. The process MUST be in a process group of its own and MUST end with its call.
  - origin: B-0988
  - disposition: ported
  - test: PT-130-C-066-*
  - divergence: DV-110
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the working directory of the baseline (row 28 of annex X §X.7)

- **F130-FR-022**: The settings of the critic MUST be these, each an alias of a key: the executable and the profile, as for the proposer (`harnesses.dsh.bin`, `harnesses.dsh.profile`); the model (`roles.critic.model` for this harness), which is used when the entry has no qualifier, and after it the model of the proposer as a fallback; the provider (`roles.critic.provider` for this harness), preferred over the provider of the proposer; the reasoning effort (`roles.critic.effort`), with the reasoning effort of the proposer as fallback, added to the settings of the overlay; the real home (`harnesses.dsh.home`), which is read and, when a model override exists, replaced by the throwaway home of F130-FR-028 in the environment of the process; and the permission mode `read-only`, which MUST be exported to every critic call whatever the setting of the proposer. A provider that differs from the one embedded in the model reference MUST raise `conflicting DSH providers`. The as-is variables stay as aliases (DV-027).
  - origin: B-0817; B-0818; B-0819; B-0820; B-0821; B-0822; B-0823; B-0824; B-0825; B-0826
  - disposition: translated
  - test: PT-130-C-061-*
  - divergence: DV-027; DV-030
  - parity: the as-is variables, mapped through the alias table (annex X §X.8), which holds the aliases of `roles.critic.provider` and `harnesses.dsh.home`; `roles.critic.effort` is reached by the alias of the as-is variable of the critic's reasoning effort

- **F130-FR-023**: The critic MUST be made tool-less by a patch file that disables the model-facing tools of the harness by id: 18 tools, in the groups shell, filesystem, search, skills, sub-agents, workflow, web, todo and user questions. The patch MUST be written to a temporary file for the call, at the logical name `pass:<passId>:critic-patch` (feature 100, annex B §B.5), its hash MUST be recorded in the record of the call, and the file MUST be removed after the call, also when the call failed. The list of ids belongs to the plan and is data of the adapter, dated and pinned.
  - origin: B-0987
  - disposition: ported
  - test: PT-130-C-066-*
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 (check: the 18 ids of the baseline's patch; whether they cover every tool of the pinned version is the subject of capture 3; verified-on: 2026-09-29; pin: 0.1.0-rc.8)

- **F130-FR-024**: The patch is a deny list, and a deny list goes stale when the harness gains a tool. At preflight and before every critic call, the adapter MUST enumerate the tool ids that the installed harness and its profile expose, by a free introspection of the harness that makes no model call, and MUST refuse the critic role with `critic_not_toolless` when one of them is not covered by the patch. An enumeration that fails or that cannot be read MUST refuse the role in the same way. The switch `harnesses.dsh.critic.proof` MUST have the values `strict` (this requirement and F130-FR-025 apply) and `none`. Its default MUST be `strict`.
  - test: CT-130-24
  - divergence: DV-110
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `none` (no such check exists at the baseline; row 117 of annex X §X.7)
  - assumption: CQ-142 (that the installed harness has a free, model-free way to list the tool ids of its composed profile)
  - status: unverified (check: capture 3 lists the tool ids of the pinned version and the introspection that yields them; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-025**: A dsh stream is text and has no initial record, so the proof that the critic holds no tools cannot come from one. Under the value `strict` of F130-FR-024 the proof MUST consist of four facts, all recorded in the record of the call: the exact version equals the pin; the coverage check of F130-FR-024 passed; the hash of the patch file; and the exported permission mode `read-only`. This proof is weaker than the proof of an initial record: it shows what was asked and what the version exposes, not what the process did. The record MUST say that it is the weaker proof (F100 annex C §C.3, first form; F100-FR-230, third way). Principle IX admits it since constitution v3.0.1 (the owner closed CQ-182 on 2026-09-30); the plan keeps its deviation row until the first implementation slice removes it, as the Sync Impact Report of v3.0.1 says. It is open to this adapter only because it is a tested harness adapter with an exact version pin. Any other version MUST refuse the critic role with `critic_not_toolless`. The result MUST be recorded for every critic-class call (F100-FR-087, F100-FR-218).
  - test: CT-130-25
  - divergence: DV-081; DV-110
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `none` as in F130-FR-024; the record then says that no proof was made (rows 28 and 117 of annex X §X.7)
  - assumption: CQ-182 (that a tested harness adapter whose stream has no initial record may prove the tool-less form by its exact version pin and its preflight)
  - status: unverified (check: the initial-record-free proof rests on a documentation-and-help reading of the pinned version; capture 3 and the fixture with one more tool settle it; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-026**: A critic call whose process exits non-zero MUST fail with a message that carries the first 300 characters of standard error, or of standard output when standard error is empty, because the harness reports some provider failures on standard output. A call whose standard output is empty MUST fail. A call that exceeds its time limit, and a launcher that cannot start, MUST fail with their own message. No failed call yields a verdict: the phase gate scores it as the baseline scores a failed critic call, so a critic that failed never approves. A call that fails because the credential of the harness is missing or invalid (the code `INVALID_CREDENTIAL` of F130-FR-038) is such a failed call under the `parity` profile, as the code of the baseline scores it; outside the profile its end is the one feature 100 gives an authentication failure of the critic.
  - origin: B-0990
  - disposition: ported
  - test: PT-130-C-066-*
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-187 (that a missing or invalid credential of the critic is a failed critic call under the `parity` profile)

- **F130-FR-027**: The critic prompt MUST be passed as arguments, split only at ASCII spaces into chunks of at most 120 KiB, and no chunk MUST start with a dash: where the greedy split would put a token that begins with a dash at the start of a chunk, the split MUST be moved back so that it does not, and chunks only get smaller. A single token over 120 KiB MUST fail the call with a message that names the limit. The chunks are rejoined by the harness with one space, so the prompt is reconstructed byte for byte.
  - origin: B-0983
  - disposition: ported
  - test: PT-130-C-066-*
  - ep: EP-02 `specstride.harness/1` (implements)

- **F130-FR-028**: A model override of the critic MUST be applied by the same rules as for the proposer: the reference rules of F130-FR-012 (the provider must match `[A-Za-z0-9._-]+`, the model `[A-Za-z0-9._:-]+`, else `invalid DSH model ref`) and the table of F130-FR-013. It MUST be applied through a throwaway home that links every entry of the real home except the settings file and holds a new settings file, and it MUST be removed after the call. A reference error of the critic MUST fail the call as F130-FR-026 says, and the phase gate MUST score it as a failed critic call. On the reference the scenarios `dsh-conflicting-providers` and `dsh-invalid-model-ref` of FX-07 end with engine exit 1 and the stop reason `critic_unavailable`, after three phase attempts that are each scored MALFORMED.
  - origin: B-0985; B-0986
  - disposition: ported
  - test: PT-130-C-066-*
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 (check: feature 141 ran the reference at `9cab15d` read-only with stub agents; its table "Ends on the reference" holds both scenarios; verified-on: 2026-09-29; pin: baseline `9cab15d`)

- **F130-FR-029**: For the critic, the window of the context MUST be looked up by the part of the model reference after the last `/`; the bare harness name looks up an empty model. Under the `parity` profile an unknown model MUST get the default of 98,304 tokens, and the windows of the baseline's table MUST be supplied by the configuration of the fixture, because the table names models that are specific to the owner's machines. Outside the profile a critic on this harness MUST qualify only with a known window (Principle IX): declared in the descriptor or in user configuration (`harnesses.dsh.contextWindows`, a map from model to tokens, and `roles.critic.contextTokens`, which always wins), and the value used MUST be the smaller of the declared and the effective window. There is no default window for an unknown model. The descriptor MUST have an override, and the doctor MUST offer a check, because a declared window may be larger than the effective window of a gateway in front of the model.
  - origin: B-0912
  - disposition: ported
  - test: PT-130-C-066-*
  - divergence: DV-111
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the lookup and the default of 98,304 (row 28 of annex X §X.7)

- **F130-FR-030**: While the terms of this harness are unknown (F130-FR-004), it MUST NOT be picked automatically as a critic, whatever step of the critic order it would qualify in, and it MUST NOT be the default critic, under every audience. A consumer who names it as the critic MUST get the unknown-terms warning at launch. Naming it lifts the bar of the terms only: the critic role is still refused where F130-FR-024, F130-FR-025, F130-FR-029 or F130-FR-045 refuses it. The critic-diversity rule and its warning are those of feature 100: this harness with the same model as the proposer gives the warning and never blocks a run.
  - test: CT-130-30
  - divergence: DV-049
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: not reached: every fixture names the critic (row 35 of annex X §X.7)

#### G4 — The plugin request protocol

- **F130-FR-031**: The plugin request processor MUST be kept as an entry of the adapter, with the flags `--request` and `--archive-dir` (both required), `--allowlist`, `--dsh-bin` (default `dsh`), `--profile` (default `headless`) and `--timeout` (default 600), each defaulting to its setting of F130-FR-033. On any request error it MUST print `dsh plugin request: <cause>` on standard error and exit 2; otherwise it MUST print the JSON result on standard output and exit 0. Installs MUST be serialised by an exclusive lock held for the whole processing of one request, at the logical name `harness:dsh:install-lock`. On success it MUST write a receipt of the schema `specstride-dsh-plugin-install/v1` (the as-is id; the product id is `urn:specstride:schema:internal:130:plugin-install/1`, annex B §B.20) with the fields `status` (`installed`), `profile`, `plugins`, `reason`, `requested_at`, `completed_at` and `request_archive`. The messages and the paths name the component `plugin-requests` and the logical names (DV-006, DV-066).
  - origin: B-0433; B-0434; B-0435; B-0436
  - disposition: translated
  - test: PT-130-C-036-*; PT-130-C-037-*; PT-130-C-038-*
  - divergence: DV-006; DV-066
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the exit code and the class of the first line of an error message are compared (rule N-18); the receipt and the archive are compared by logical name (rule N-02)

- **F130-FR-032**: With no request file the processor MUST print `{"plugins": [], "status": "none"}` and exit 0. A request MUST be a regular file, not a link, of at most 16,384 bytes. Its keys MUST be exactly `contract`, `plugins` and `reason`; `contract` MUST be `specstride-dsh-plugin-request/v1` (the as-is id; the product id is `urn:specstride:schema:internal:130:plugin-request/1`, annex B §B.20); `plugins` MUST hold 1 to 8 unique entries, each an exact `package@semver` spec with an optional npm scope, optional pre-release and optional build metadata, so that ranges, tags, addresses and paths do not match; `reason` MUST be a non-empty string of at most 2,048 bytes. Every requested plugin MUST appear literally in the allowlist, and every entry of the allowlist MUST itself be an exact `package@semver` spec, else the request is denied. The installer MUST be run as the fixed argument list `<executable> plugin --profile <profile> add --save-exact <plugins...>`, without a shell, with the configured time limit. The request MUST be read as a claim: after the pass has exited, as a regular file, without following links, and its content MUST never be evaluated.
  - origin: B-0437; B-0438; B-0439; B-0440; B-0441; B-0442; B-0443
  - disposition: ported
  - test: PT-130-C-039-*; PT-130-C-040-*
  - ep: EP-02 `specstride.harness/1` (implements)

- **F130-FR-033**: The artifacts and the settings of the protocol MUST be these. The request written by the proposer is at the logical name `harness:dsh:plugin-request`, in the workspace part, a claim. Each processed request MUST be archived at `harness:dsh:plugin-installs` as `<UTC stamp>.request.json`, and the receipt beside it as `<UTC stamp>.receipt.json`, written atomically, in the control plane. The allowlist MUST be `harnesses.dsh.pluginAllowlist`, a comma-separated list of exact `package@semver` specs, alias of the as-is variable, and an empty value disables the protocol. The time limit of the installer MUST be `harnesses.dsh.pluginTimeoutSec`, default 600, alias of the as-is variable.
  - origin: B-0618; B-0619; B-0536; B-0542
  - disposition: translated
  - test: PT-130-C-056-*; PT-130-C-052-*
  - divergence: DV-006; DV-027
  - parity: the allowlist is empty unless the fixture sets it; the time limit is 600 (row 118 of annex X §X.7)

- **F130-FR-034**: The protocol is an opt-in and MUST stay one. Outside the `parity` profile the allowlist MUST be accepted from user configuration only: it is a widening key, and from project configuration, the environment or a flag it MUST be ignored with a launch message and a doctor warning (ruling P15; F100-FR-202; ruling 35; CQ-233). Under the `parity` profile the as-is variable stays its alias, as at the baseline. A plugin install writes the profile in the consumer's real home, which a run otherwise never writes. The allowlist in user configuration is the consumer's consent to exactly that write, for exactly the listed plugins, and no other write to the real home is allowed (ruling P15; F100 annex C §C.1, "Wave 1 implementations"). Ruling P15 is the one exception to ruling 36 and covers the install only. It is no consent to what the profile loads into a pass: that is F130-FR-043. A plugin that the allowlist admitted is loaded into the next pass by this consent and is recorded as such. Every install MUST be recorded in the run record and in the receipt, with the plugins, the reason and the allowlist entry that admitted each. Under the audience `distributed` the protocol MUST be off unless the allowlist is set. The product MUST never install, vendor or download the harness itself.
  - test: CT-130-34
  - divergence: DV-091
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: as the fixture sets the allowlist (row 118 of annex X §X.7)
  - assumption: CQ-233 (that "user config" in ruling P15 means the user configuration only outside the `parity` profile; closed 2026-09-30 on the recommended answer)

- **F130-FR-035**: The protocol MUST be enabled only by a non-empty allowlist and only for the harness named without a qualifier; with a qualifier it is never enabled, its request file is never processed and the prompt has no protocol section. The descriptor MUST express this as the capability `pluginRequests`, available only without a qualifier, and the core MUST NOT compare the name of the harness (DV-064). When enabled, the prompt MUST gain the section headed `## Optional DSH plugin request protocol` at the place of F130-FR-020, which tells the proposer the request path, the schema, the allowed exact specs and to stop without writing phase evidence after writing a request. A request MUST be handled before the check for phase evidence: a pass that wrote both a request and phase evidence still triggers the install and a restart pass. A pass that ended with a plugin install MUST be exempt from every breaker and from the short-pass counter.
  - origin: B-0650; B-0757; B-0768; B-0769
  - disposition: ported
  - test: PT-130-C-057-*; PT-130-C-058-*
  - ep: EP-02 `specstride.harness/1` (implements); EP-15 `specstride.prompt-block/1` (implements)

- **F130-FR-036**: The ends of the protocol MUST be these, returned by `betweenPasses` as `stop` with a result of the pass loop, or as `continue`. A request that exists while the allowlist is empty, and a request that is invalid, denied, timed out or whose installer failed, MUST end the run with the result 7. An install on the final pass MUST end it with the result 4, because no pass is left to use the plugin. An install on any other pass MUST start the next pass fresh. Three events MUST be emitted, rendered by the compatibility projection with the as-is literals and fields: `plugin_install_denied` (`iter`, `reason=allowlist_empty`), `plugin_install_failed` (`iter`, `reason` = the full output of the processor) and `plugin_installed` (`iter`, `profile`, `plugins` joined by commas). Standard error MUST carry `DSH plugin request found but <allowlist> is empty`, `installed DSH plugin(s): <list>; restarting with fresh profile`, and for the final pass `plugin installed on final pass; raise --max-iter to allow a restarted DSH pass`, each starting with the component name `pass-loop`.
  - origin: B-0551; B-0552; B-0553; B-0585; B-0586; B-0587; B-0653; B-0654
  - disposition: translated
  - test: PT-130-C-053-*; PT-130-C-054-*; PT-130-C-057-*
  - divergence: DV-007; DV-066
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the results 7 and 4 through the result record of the pass loop (LR-6); the events through the compatibility projection (row 17 of annex X §X.7)

- **F130-FR-037**: After a plugin install the coverage check of F130-FR-024 MUST run again before the next critic call, because an installed plugin may add a tool. A tool that the patch does not cover MUST refuse the critic role with `critic_not_toolless` as before. The check MUST also run when the plugin protocol is disabled and the profile changed between two critic calls.
  - test: CT-130-37
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `none` as in F130-FR-024

#### G5 — Quota and error signals, usage, telemetry, environment

- **F130-FR-038**: The adapter MUST scan both standard error and standard output of every pass and of every critic call for the form `dsh: <CODE>: <message>`, and MUST hand the quota classifier the code, the message and the stream. The classifier entries MUST be: `QUOTA` gives the class `quota_window` with confidence `status`, or `quota_credit` when the message says so; `RATE_LIMIT` gives `rate_limit_transient`; `CONTEXT_WINDOW_EXCEEDED` gives `context_window`; `INVALID_CREDENTIAL` gives `auth`. The reset time MUST be parsed from the message, or be `null`. `CONTEXT_WINDOW_EXCEEDED` MUST never be scored MALFORMED. A classifier entry is a pure table: no input or output, no clock, no model. A line that matches no entry is `provider_other` with confidence `text`.
  - test: CT-130-38
  - divergence: DV-005
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not observable: the stub agents emit no quota signal (row 39 of annex X §X.7)
  - status: unverified (check: capture 5 records the message forms of a limit with a reset time and with a credit limit; the codes are read from the installed packages; verified-on: 2026-09-29 for the codes, — for the message forms; pin: 0.1.0-rc.8)

- **F130-FR-039**: The harness reports no usage on standard output. Every pass MUST emit `usage.unavailable` with the reason `harness-does-not-report`, and the descriptor MUST declare `usageSource: none`. No token count and no cost MUST be invented. A cost figure MAY exist only as the consumer's declared estimate, kept apart from any reported cost and labelled as an estimate. A killed pass is counted as unknown.
  - test: CT-130-39
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 (check: the headless application prints only the final text; verified-on: 2026-09-29; pin: 0.1.0-rc.8)

- **F130-FR-040**: The harness's own telemetry MUST be switched off for every process the adapter starts, by the telemetry-mode variable named in the descriptor's field `telemetry.off`. The trace parent of the open pass span MUST be exported to the process in the standard trace-parent variable, and the adapter MUST do nothing more for the harness's own trace plugin: its spans are not exported by this product. The doctor MUST warn when the trace plugin of the harness captures content while the product's content capture is off (F130-FR-005).
  - test: CT-130-40
  - divergence: DV-083
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the variable is set; the trace parent is exported only when traces are on (row 16 of annex X §X.7)
  - status: unverified (check: capture 5 records the name and the off value of the telemetry variable and that the trace plugin honours the trace parent; the names are read from the research only; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-041**: The environment of every call MUST be an allow-list: the search path, the locale, the home or its overlay, the permission mode and the telemetry mode, and what the descriptor names. Of the harness's own variables only the home, the permission mode and the telemetry mode MUST be set. The harness MUST NOT inherit the consumer's other provider keys, and the credentials of the critic MUST never be in the environment of the proposer, or the reverse. A secret MUST never be passed in an argument list. Where a call at auth tier 2 needs a secret, it MUST be resolved through the secret resolver at the moment of use and handed to the process in its environment only; the adapter MUST read no credential file.
  - test: CT-130-41
  - ep: EP-02 `specstride.harness/1` (implements); EP-10 `specstride.secret-resolver/1` (consumes)

#### Fixture captures and probes

- **F130-FR-042**: The facts that the adapter needs and that are not established MUST be settled by scripted captures before this specification freezes, each allowed only as an explicitly authorized probe, each logged, none run by this feature, none run by a test or by CI. Capture 1: what the approval mode `ask` does in a headless run with standard input closed (F130-FR-017). Capture 2: whether the permission mode is enforced by the operating system (F130-FR-018). Capture 3: the list of tool ids of the pinned version, and the introspection that yields it (F130-FR-024, F130-FR-025). Capture 4: whether several task arguments are rejoined with one space on the proposer path, and the size of one argument that the harness accepts (F130-FR-011). Capture 5: the message forms of a limit, the name and off value of the telemetry variable and whether the trace plugin honours the trace parent (F130-FR-038, F130-FR-040). Capture 6: what the composed profile of the pinned version loads into a call (plugins, host hooks, skills, tool servers), whether the harness keeps a native memory across sessions, and whether a patch overlay or a setting switches each of them off (F130-FR-003, F130-FR-043, F130-FR-044, F130-FR-045). Each capture is a recorded fixture that states the version. A capture that needs a paid call MUST say so in its task and MUST be logged. Until a capture exists, the requirements that wait for it stay `unverified` in the release notes.
  - test: CT-130-42
  - status: unverified (check: the six captures; verified-on: —; pin: 0.1.0-rc.8)

#### G6 — What the profile loads: customisations and native memory

- **F130-FR-043**: A pass on this harness boots a profile of the harness's home, and the profile composes what the consumer installed there. The kinds of customisation are a closed set: `plugins`, `host-hooks`, `skills`, `tool-servers`. At the pin the adapter has no switch that takes one of them out of a proposer pass, and the throwaway home of F130-FR-014 links every entry of the real home, so the profile is loaded with a model override and without one, at both auth tiers. This departs from Principle VIII, from ruling 36 and from F100-FR-113; it is a stated deviation and no exception: ruling P15 stays the one exception to ruling 36 (F130-FR-034). The harness MUST therefore be a proposer only where the consumer named it (F130-FR-004). The adapter MUST read `harnesses.dsh.proposerCustomisations` (row 131 of annex X §X.7; values `off` and `on`, default `off`). With `off` it MUST switch off every kind for which it has a switch that a recorded capture shows to take effect, and for every other kind the state MUST be `not-switchable`: the launch MUST state it in one line that names the kinds, the doctor MUST warn, and the pass runs. With `on` the consumer opted in, the state is `opted-in` and no warning is raised. The states are a closed set: `off`, `absent`, `opted-in`, `not-switchable`, `as-is`. The run record MUST hold, per kind, the value asked and the state, and the record of every pass MUST repeat the state. The adapter MUST NEVER record `off` or `absent` for a kind unless a recorded capture shows it. Under the `parity` profile no flag and no patch about customisations is passed, the state is `as-is`, and no line is printed.
  - test: CT-130-43
  - divergence: DV-002
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `as-is`: no flag about customisations is passed (row 131 of annex X §X.7)
  - assumption: CQ-189 (that dsh may be used as proposer with its profile loaded when the consumer names it, each customisation that cannot be switched off being reported as null, warned by the doctor and recorded per run)
  - status: unverified (check: capture 6 lists what the composed profile of the pinned version loads and whether a patch overlay switches a kind off; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-044**: The descriptor MUST declare whether the harness has a native memory and how it is switched off (F100-FR-082; the field `memory` of annex C §C.2). At the pin neither is established: the descriptor MUST declare the existence as unknown and the switch as null, both marked `unverified`. The setting of native memory MUST be recorded for every run (ruling 37): the run record MUST hold the value asked for the proposer (`memory.native.proposer`, row 29 of annex X §X.7), the fixed value `off` asked for every critic-class call, and for each of the two the state, a member of the closed set of F130-FR-043. For the proposer the default is `off`; while the adapter has no switch the state MUST be `not-switchable`, the launch MUST state it and the doctor MUST warn, unless the consumer opted in with the value `on` in user configuration, which gives the state `opted-in`. The adapter MUST NEVER record `off` or `absent` unless a recorded capture shows that the memory is switched off or that the pinned version keeps none. Under the `parity` profile no flag about memory is passed, the state is `as-is`, and no line is printed.
  - test: CT-130-44
  - divergence: DV-047
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `as-is`: no flag about memory is passed (row 29 of annex X §X.7)
  - assumption: CQ-189 (as in F130-FR-043, for native memory in a proposer pass)
  - status: unverified (check: capture 6 records whether the pinned version keeps a memory across sessions and whether a switch exists; verified-on: —; pin: 0.1.0-rc.8)

- **F130-FR-045**: Outside the `parity` profile the critic role on this harness MUST be refused unless the state of native memory for a critic-class call is `off` or `absent` (F100-FR-082). A memory that exists and cannot be switched off refuses the role, and so does a memory whose state is not established: while no recorded capture shows `off` or `absent`, the role is refused. The adapter MUST report the refusal to role resolution with the reason `memory-not-off` (row 182 of annex X §X.6) and as the typed failure `capability_absent`; a critic that the consumer configured is then a configuration error of the critic, and the check is launch-blocking in the doctor (F130-FR-005). No opt-in lifts this refusal: memory is always off for a critic-class call. A customisation of the profile is never loaded into a critic-class call by an opt-in: `harnesses.dsh.proposerCustomisations` has no effect on the critic. What gives the model a tool is covered by the patch and by the coverage check of F130-FR-024, plugins and tool servers included. For every kind of F130-FR-043 the record of each critic-class call MUST hold the state, and a kind that is neither covered by the patch nor shown to be `off` or `absent` MUST be recorded as `not-switchable` and warned by the doctor. Once a recorded capture shows that such a kind exists in the profile and is loaded into a critic-class call, the critic role MUST be refused as for native memory, with the reason `memory-not-off` and the typed failure `capability_absent`; until then the adapter records and warns (row 131 of annex X §X.7: never loaded into a critic-class call; CQ-232). Under the `parity` profile no check of memory or of customisations is made, as at the baseline, and the record says `as-is`.
  - test: CT-130-45
  - divergence: DV-047; DV-110
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: no check; no flag about memory is passed (rows 29 and 131 of annex X §X.7)
  - assumption: CQ-189 (that the critic role is refused where a native memory exists and cannot be switched off; this specification reads a state that is not established as a refusal); CQ-232 (that a customisation shown to be loaded into a critic-class call refuses the role; closed 2026-09-30 on the recommended answer)
  - status: unverified (check: capture 6, for a critic-class call with the patch of F130-FR-023; verified-on: —; pin: 0.1.0-rc.8)

### Key Entities

- **Harness descriptor of dsh**: data of kind `cli` with a text stream: detection, the argument lists of the two roles, the environment allow-list, the permission mechanism, `session.continuation: none`, the containment ceiling C1 (`unverified`), the usage source `none`, the telemetry switch, the version pin and the capability `pluginRequests`.
- **Settings overlay**: the throwaway home of one pass or one critic call, holding links to the real home and one new settings file.
- **Critic patch**: the temporary file that disables 18 model-facing tools by id, with its hash.
- **Proof of the critic mode**: the four recorded facts of F130-FR-025.
- **Plugin request**: one file of exactly three keys, a claim of the proposer.
- **Install receipt**: the record of one installed request, kept with the archived request.
- **Classifier entry**: one row from a `dsh: <CODE>` form to a quota class.
- **Customisation record**: per run, and repeated per call: for each kind of customisation and for native memory, the value asked and the state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F130-SC-001**: The critic has no tools. On the pinned version the coverage check finds every exposed tool id in the patch, and on a fixture with one more tool id the critic role is refused with `critic_not_toolless` in 100 per cent of the trials.
- **F130-SC-002**: Parity of both roles. 100 per cent of the parity tests `PT-130-*` of the 66 items and 14 clusters give `equal`, or `waived` with a register row, on FX-01, FX-06, FX-07, FX-16, FX-17, FX-18, FX-19, FX-20, FX-22, FX-24, FX-25, FX-26, FX-38 and FX-39.
- **F130-SC-003**: A pass never waits on a human. In 100 per cent of the fixture passes the pass ends before its watchdogs, or is ended by them, and 0 fixture passes outlive their watchdogs waiting for an approval.
- **F130-SC-004**: Provider and harness facts are dated. 100 per cent of the facts about the harness in the descriptor, the fixtures and the terms row carry a `verified-on` date and the version pin, or an `unverified` mark with the check that would settle it.
- **F130-SC-005**: The consumer's home is left as found. Over all fixtures without the plugin protocol, 0 bytes of the real home change in a pass, and after a pass, including a killed pass, 0 throwaway homes remain.
- **F130-SC-006**: The protocol admits only the listed. Over the scenarios of FX-38 and the own tests, 100 per cent of the requests that are links, too large, of a fourth key, ranges, or outside the allowlist are denied, and 0 installer calls follow a denied request.
- **F130-SC-007**: Completeness. 100 per cent of the 14 clusters and of the 66 behaviour items that the traceability files assign to this feature are the origin of a requirement and are proven by a test task.
- **F130-SC-008**: Captures and probes. Each of the 6 captures is stored as a fixture with the version, or the status of the requirement that waits for it stays `unverified` in the release notes; 0 paid calls are made by any test or CI job.
- **F130-SC-009**: No secret is exposed. Over all fixtures, 0 planted key values appear in any argument list, event, log, receipt or record of this adapter.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
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
| The product never installs, vendors or downloads the harness; it installs a plugin of the harness only on a request that the consumer's allowlist admits | Constitution, additional constraints; B-0442 |
| No name of a model, provider or launcher that is specific to the owner's machines appears in the specification | Naming rule of the briefs |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, the spelling of
internal functions and, for this feature, the exact flags and variables of the harness with the
pin, and the list of tool ids of the patch.

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements (one tested harness adapter) | The descriptor of kind `cli`, the code hooks for the overlay, the patch and the plugin protocol, the recorded fixtures; the first-form (tool-less) critic with the weaker proof (a stated deviation from Principle IX, CQ-182); the record of customisations and of native memory. Consumes the role plan (registry and critic order) |
| EP-02 sub-point | Stream readers, `specstride.harness/1` | consumes | The text reader, with the synthesized `init` and `terminal` |
| EP-10 | `specstride.secret-resolver/1` | consumes | Where a call at auth tier 2 needs a secret it is resolved at the moment of use; the adapter handles no credential file (F130-FR-041) |
| EP-11 | `specstride.terms/1` | consumes | The adapter supplies the facts of its row (unknown terms); the gate decides |
| EP-12 | `specstride.quota-classifier/1` | implements (classifier entries of this harness) | Four entries on two streams |
| EP-14 | `specstride.doctor/1` | implements (an entry) | The checks of F130-FR-005, registered as entries of the doctor registry |
| EP-15 | `specstride.prompt-block/1` | implements (one block) | The section of the plugin protocol |

## Contracts of feature 100 used

| Contract | Annex and section | Requirements of feature 100 |
|---|---|---|
| Common rules of extension points | A §A.4 | F100-FR-013 to F100-FR-021 |
| No closed list of harnesses | A §A.5 | F100-FR-023 |
| Layers and layering rules (LR-6, the result record of the pass loop) | A §A.1, §A.2 | F100-FR-001 to F100-FR-012 |
| Logical names `harness:<id>:plugin-request`, `harness:<id>:plugin-installs`, `harness:<id>:install-lock`, `overlay:<id>:tree`, `attempt:<N>:<k>:<n>:critic-invocation`, `pass:<passId>:invocation`, `pass:<passId>:critic-patch`, `pass:<passId>:usage`, `pass:<passId>:stream`, `harness-home` | B §B.5 | F100-FR-053 |
| Harness port (EP-02); harness-native memory | C §C.1 | F100-FR-076 to F100-FR-083 (F100-FR-082 for memory) |
| Harness descriptor | C §C.2 | F100-FR-084 to F100-FR-086 |
| Forms of the `completion` level (first form, weaker proof) | C §C.3 | F100-FR-087, F100-FR-088, F100-FR-230 |
| Stream readers and the six normalized records | C §C.5 | F100-FR-090 |
| Resolved registry, role plan and critic order | C §C.6 | F100-FR-092, F100-FR-093 |
| Secret resolver (EP-10) | C §C.11 | F100-FR-107 |
| Terms-gate data (EP-11) | C §C.12 | F100-FR-108 |
| Quota classifier (EP-12) | C §C.13 | F100-FR-109 |
| Containment levels | C §C.15 | F100-FR-111, F100-FR-112 |
| Overlay schema `specstride-overlay/v1` | C §C.16 | F100-FR-113 |
| Prompt block provider (EP-15) | D §D.5 | F100-FR-131, F100-FR-132 |
| Stop reasons; result record of the pass loop (results 7, 4; status 127); `critic_config` | E §E.3, §E.4 | F100-FR-148, F100-FR-153 |
| Doctor check registry (EP-14) | G §G.7 | F100-FR-189 |
| Event envelope (usage, quota signal, the three plugin events) | X §X.1 | F100-FR-198, F100-FR-200 |
| Config envelope, ranks and trust classes | X §X.2 | F100-FR-201 to F100-FR-203 |
| List of closed sets (rows 182, 215, 216, 217 among them) | X §X.6 | F100-FR-208 |
| The `parity` profile, rows 10, 12, 16, 17, 20, 23, 25, 26, 27, 28, 29, 30, 34, 35, 36, 39, 117, 118, 131 | X §X.7 | F100-FR-210, F100-FR-212 |
| Normalization rules N-01, N-02, N-15, N-18, N-24; alias table; component-name table (`pass-loop`, `plugin-requests`) | X §X.8 | F100-FR-213, F100-FR-214 |
| Threats T-07, T-13, T-34 | X §X.9 | F100-FR-216, F100-FR-218 |
| Conformance of every extension point | X §X.10 | F100-FR-222 |

Fixture families of feature 141 cited: FX-01, FX-06, FX-07, FX-16, FX-17, FX-18, FX-19, FX-20,
FX-22, FX-24, FX-25, FX-26 (§O.2); FX-38, the plugin request protocol, and FX-39, the declared
overlay (§O.2, added by feature 141); the harness stub, the critic stub as a command-line
tool and the plugin installer stub (§O.3); the surfaces `exit`, `stdout`, `stderr`, `state`,
`events`, `transcript`, `processes` and `home` (§O.4).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. Rows 10, 12, 16, 17, 20, 23, 25, 26, 27, 28, 29, 30, 34, 35, 36, 39 and 131 of annex
X §X.7 are owned by other features or shared; this feature sets their value for dsh and adds no
change to them. Rows 117 and 118 are its own.

| Row | Switch | Key (as annex X §X.7 proposes) | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 10 | Session continuation inside a phase attempt | `carry.continuation` | On, where the harness supports it (never on dsh) | Off | DV-010 | F130-FR-016 |
| 12 | Block set of the proposer's prompt | `prompt.block_set` | Current | As-is | DV-094 | F130-FR-020 |
| 16 | Content capture in telemetry | `telemetry.content` | `auto`: follows traces; the harness's own telemetry is off by its mode variable | Off; the trace parent is exported only when traces are on | DV-083 | F130-FR-040 |
| 17 | Compatibility projection of events | `compat.legacyEvents` | Off | On: `iter_done` and the three plugin events with the as-is literals | DV-007 | F130-FR-019, F130-FR-036 |
| 20 | Parallel units | `loop.parallel.units` | Off; off on this harness at `protection=detect` unless row 23 is set | Off | DV-080 | F130-FR-018 |
| 23 | Parallel units at detection only | `loop.parallel.allow_detect` | Off; accepted from user configuration only (CQ-183) | Off | DV-080 | F130-FR-018 |
| 25 | Containment level | `sandbox.level` | The strongest the harness offers (C1, `unverified`) | As at the baseline: none | DV-030 | F130-FR-010, F130-FR-018 |
| 26 | Permission mode and argument list | `sandbox.permissionMode` | Contained, the mode always stated (`workspace-write`; `read-only` for the critic) | As at the baseline, mapped through the argument table of this adapter | DV-031 | F130-FR-007, F130-FR-010 |
| 27 | Transport | `harnesses.<id>.transport` | `subprocess` | `subprocess` | — | F130-FR-001 |
| 28 | Transport and mode of the critic | `roles.critic.transport` | The harness CLI without tools, with the proof of F130-FR-025 | The as-is transport and mode: no proof, the working directory of the baseline, the default window | DV-001; DV-081 | F130-FR-021, F130-FR-025, F130-FR-029 |
| 29 | Harness-native memory | `memory.native.proposer` | Off asked; the state on dsh is `not-switchable` until a switch is shown. Always off asked for the critic, which is refused unless the state is `off` or `absent` | `as-is`: no flag about memory is passed | DV-047 | F130-FR-003, F130-FR-044, F130-FR-045 |
| 30 | Overlay of the configuration home | `harnesses.dsh.overlay` | Unset: real home at auth tier 1, throwaway home at auth tier 2 | Overlay scope `none` | DV-002 | F130-FR-014, F130-FR-015 |
| 34 | Audience | `distribution.audience` | `distributed` | `personal` | DV-048 | F130-FR-004 |
| 35 | Automatic pick of the critic | `critic.autoPick` | On (never for this harness, under every audience) | Not reached | DV-049 | F130-FR-030 |
| 36 | Default proposer and critic | `roles.proposer.harness`, `roles.critic.harness` | The default harness; never this harness | Every fixture names both | DV-004 | F130-FR-004, F130-FR-030 |
| 39 | Quota pause | `pause.maxTotalMs` | On; ceiling 24 hours | Not reached: the stub agents emit no quota signal | DV-005 | F130-FR-038 |
| 131 | Customisations of a harness that are loaded into a proposer pass by themselves | `harnesses.dsh.proposerCustomisations` | `off` asked; the state on dsh is `not-switchable` for every kind until a switch is shown; never by opt-in into a critic-class call | `as-is`: no flag about customisations is passed | DV-047; DV-002 | F130-FR-043, F130-FR-045 |

Rows of annex X §X.7 that this feature owns.

| Row | Switch | Key | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 117 | Proof of the critic mode of dsh: version pin, coverage check of the deny list, empty working directory | `harnesses.dsh.critic.proof` | `strict` | `none` | DV-110 | F130-FR-021, F130-FR-024, F130-FR-025, F130-FR-037 |
| 118 | Plugin allowlist of a harness: exact plugin specs (empty means off) | `harnesses.dsh.pluginAllowlist` | Empty | As the fixture sets it | DV-091 | F130-FR-033, F130-FR-034 |

Settings of this feature that are not switches. Feature 110 owns the spelling. The aliases are
those of annex X §X.8.

| Setting | Key | Source of the spelling | Value under `parity` |
|---|---|---|---|
| Executable | `harnesses.dsh.bin` | Alias table (the as-is variable for the executable) | As the fixture sets it; `dsh` |
| Profile | `harnesses.dsh.profile` | Alias table | `headless` |
| Real home of the harness | `harnesses.dsh.home` | Annex X §X.8 (the as-is home variable of the harness) | The consumer's `.dsh` |
| Provider for a model without one | `harnesses.dsh.provider` | Annex X §X.8 (the as-is provider variable) | As the fixture sets it |
| Provider of the critic | `roles.critic.provider` | Annex X §X.8 (the as-is variable of the provider of the critic) | As the fixture sets it |
| Model of proposer and critic | `roles.<role>.model` for this harness | Alias table | As the fixture sets it |
| Reasoning effort | `roles.proposer.effort`; `roles.critic.effort` | Confirmed by feature 110; reached by the aliases of the two as-is variables (annex X §X.8) | Unset |
| Bare model table | `harnesses.dsh.modelProviders` | Key list of feature 110 (F130-FR-013) | The rows the fixture supplies |
| Windows of models | `harnesses.dsh.contextWindows`; `roles.critic.contextTokens` | The second by the alias table; the first by the key list of feature 110 (`harnesses.<id>.contextWindows`) | As the fixture sets it; default 98,304 |
| Permission mode | `sandbox.permissionMode` | Row 26; the as-is variables are aliases | `workspace-write` (proposer), `read-only` (critic) |
| Time limit of the plugin installer | `harnesses.dsh.pluginTimeoutSec` | Annex X §X.8 (`SPECSTRIDE_DSH_PLUGIN_TIMEOUT`) | 600 |
| Declaration of an overlay scope | `harnesses.dsh.overlay` | Alias table (`SPECSTRIDE_<HARNESS>_OVERLAY`) | As the fixture sets it (FX-39) |
| Opt-in to containment C0 | `sandbox.level` with the value `C0`, in user configuration only (CQ-183) | Row 25 | Follows row 25 |
| Opt-in to parallel units at `protection=detect` | `loop.parallel.allow_detect`, in user configuration only (CQ-183) | Row 20; owner 142 | Off |

## Closed sets

Stated as F100-FR-208 asks. Rows are those of feature 100, annex X §X.6. This feature owns none
of the six sets that annex X §X.6 leaves to the owner, and uses these:

| Row | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 26 | Containment levels | C0, C1, C2, C3 | Design | Read as C0 |
| 28 | Forms of the `completion` level | `tool-less`, `read-only-tools` | Owner decision | `critic_not_toolless` |
| 29 | Tool-less mechanism of a descriptor | `structural`, `flag`, `config`, `none` (this adapter: `config`) | Design | `none` |
| 30 | Transports | `subprocess`, `sdk-in-process`, `direct-call` (this adapter: `subprocess`) | Design | The transport is unavailable |
| 36 | Typed failures of the harness port | The eight of annex C §C.1 | Design | `agent_failure` |
| 37 | Outcomes of `betweenPasses` | `continue`; `stop` with 4; `stop` with 7 | Design | `continue` |
| 43 | Cost classes | `subscription`, `metered`, `local`, `unknown` (this adapter: `unknown`) | Design | `unknown` |
| 46 | Quota classes | The nine of annex C §C.13 | Design | `provider_other` |
| 47 | Quota confidence | `structured`, `status`, `text`, `stall`, `host` | Design | `text` |
| 182 | Reasons why a critic candidate does not qualify or is passed over | This adapter gives rise to `terms-unknown` (F130-FR-004, F130-FR-030) and `memory-not-off` (F130-FR-045) | Design | Shown as text; the candidate does not qualify |

Closed sets that this feature introduces. Owner: 130. They are rows 215, 216, 217, 275 and 276
of annex X §X.6; the last two were added by the repair of 2026-09-30.

| Row | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 215 | Facts of the proof of the critic mode of dsh | `version-pin`, `tool-coverage`, `patch-hash`, `permission-mode` | Design | The proof fails: `critic_not_toolless` |
| 216 | Values of `harnesses.dsh.critic.proof` | `strict`, `none` | Design | Configuration error |
| 217 | Causes of a refused plugin request | `request-not-regular`, `request-link`, `request-too-large`, `request-json`, `request-keys`, `request-contract`, `request-plugins`, `request-duplicate`, `request-reason`, `allowlist-entry`, `not-allowed`, `allowlist-empty`, `install-launch`, `install-timeout`, `install-failed` | Design | The request is refused (result 7) |
| 275 | Kinds of customisation of the profile of dsh | `plugins`, `host-hooks`, `skills`, `tool-servers` | Design | Recorded as `not-switchable` |
| 276 | States of a customisation or of native memory of dsh | `off`, `absent`, `opted-in`, `not-switchable`, `as-is` | Design | Read as `not-switchable` |

The permission modes of the harness (`read-only`, `workspace-write`, `danger-full-access`) are
the harness's own values and not a closed set of the product. The adapter uses the first two and
never the third without the opt-in.

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by` or
`dropped`: none. All 66 items are parity items (ruling 32) and all 66 are carried. The behaviour
items of the locally registered backend are `superseded-by DV-064` and belong to feature 109; no
name of that backend appears here.

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| C-035: B-0426 | ported | F130-FR-001 | PT-130-C-035-* |
| C-036: B-0433; C-037: B-0434; C-038: B-0435, B-0436 | translated | F130-FR-031 | PT-130-C-036-*; PT-130-C-037-*; PT-130-C-038-* |
| C-039: B-0437; C-040: B-0438 to B-0443 | ported | F130-FR-032 | PT-130-C-039-*; PT-130-C-040-* |
| C-052: B-0508, B-0509, B-0510, B-0513 to B-0516 | translated | F130-FR-008 | PT-130-C-052-* |
| C-052: B-0536, B-0542; C-056: B-0618, B-0619 | translated | F130-FR-033 | PT-130-C-052-*; PT-130-C-056-* |
| C-053: B-0551 to B-0553; C-054: B-0585 to B-0587; C-057: B-0653, B-0654 | translated | F130-FR-036 | PT-130-C-053-*; PT-130-C-054-*; PT-130-C-057-* |
| C-053: B-0563 | translated | F130-FR-019 | PT-130-C-053-* |
| C-054: B-0571 | translated | F130-FR-009 | PT-130-C-054-* |
| C-056: B-0621, B-0624; C-057: B-0642 | translated | F130-FR-014 | PT-130-C-056-*; PT-130-C-057-* |
| C-057: B-0650; C-058: B-0757, B-0768, B-0769 | ported | F130-FR-035 | PT-130-C-057-*; PT-130-C-058-* |
| C-058: B-0688 | ported | F130-FR-007 | PT-130-C-058-* |
| C-058: B-0676, B-0678, B-0679, B-0686, B-0687 | ported | F130-FR-012 | PT-130-C-058-* |
| C-058: B-0677; C-066: B-0984 | ported | F130-FR-013 | PT-130-C-058-*; PT-130-C-066-* |
| C-058: B-0764 | ported | F130-FR-020 | PT-130-C-058-* |
| C-061: B-0817 to B-0826 | translated | F130-FR-022 | PT-130-C-061-* |
| C-066: B-0912 | ported | F130-FR-029 | PT-130-C-066-* |
| C-066: B-0983 | ported | F130-FR-027 | PT-130-C-066-* |
| C-066: B-0985, B-0986 | ported | F130-FR-028 | PT-130-C-066-* |
| C-066: B-0987 | ported | F130-FR-023 | PT-130-C-066-* |
| C-066: B-0988 | ported | F130-FR-021 | PT-130-C-066-* |
| C-066: B-0990 | ported | F130-FR-026 | PT-130-C-066-* |

Behaviour that the baseline has and this specification changes on purpose, outside the `parity`
profile: the permission mode is always stated and `danger-full-access` needs the opt-in (DV-030,
DV-031); a proposer prompt over the limit of one argument is split (DV-108); the table of bare
model ids is user configuration (DV-109); the critic is refused unless the version and the tool
coverage are proven, and runs in an empty directory (DV-110); a critic needs a known window and
has no default (DV-111); no session continuation, ever (DV-010). Under the profile each one is
as at the baseline.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Does the port admit a proof of a tool-less critic without an initial record? → A: Yes, for a tested harness adapter with an exact version pin. Feature 100 already says so (annex C §C.3, first form); the brief's recommendation and the contract agree. It is recorded as the weaker proof. Integrated in F130-FR-025. (Source: F100-FR-087; brief 130, section 6, point 1; R9 open question 2)
- Q: What does "fleet only, unknown terms" make the terms gate do? → A: The harness is usable where the consumer names it, with the warning; never a default; never picked automatically. The bar holds under every audience and for both roles. Closed by ruling P14 (CQ-015). Integrated in F130-FR-004, F130-FR-030. (Source: `APPROVAL.md` ruling P14; CLARIFY-QUEUE CQ-015; R8 F-P4, R8v)
- Q: A plugin install writes the consumer's real home. How does that agree with ruling 36? → A: The allowlist in user configuration is the consent to exactly that write, for exactly the listed plugins; every install is recorded; ruling 36 holds for everything else. Closed by ruling P15 (CQ-016). Integrated in F130-FR-034. (Source: `APPROVAL.md` ruling P15; DV-091)
- Q: Does a pass on dsh continue a session? → A: Never. Files carry the context; the switch has no effect; the micro-loop layer runs at level L1. Integrated in F130-FR-016. (Source: ruling 58; R9 F10; DV-010)
- Q: What does approval mode `ask` do in a headless run with no human? → A: Not established. Until capture 1 exists a pass that ends without a reply is an `agent_failure`, standard input is closed and the watchdogs apply. Integrated in F130-FR-017. (Source: R9 F12, open question 4)
- Q: Is the permission mode enforced by the operating system? → A: Not established. The ceiling is declared C1, `unverified`; the run says `protection=detect`; parallel units stay off unless `loop.parallel.allow_detect` is set in user configuration. Integrated in F130-FR-018. (Source: R11 F-28, R-2; ruling P2; F100-FR-112)
- Q: Does the prompt go on standard input, as Principle VIII says wherever the harness accepts it? → A: The harness takes the task only as arguments, so the prompt is bounded: one argument within 120 KiB, split at spaces above it. Integrated in F130-FR-011, reported as DV-108. (Source: Principle VIII; baseline `lib/critic.py` `_dsh_task_args`; R20 P2)
- Q: How can the coverage check list the tool ids of the installed harness? → A: By a free introspection of the harness, which the plan names after capture 3; the baseline's own comment shows that a configuration dump exists. Reported as CQ-142. Integrated in F130-FR-024. (Source: baseline `lib/critic.py` comments on the configuration dump; brief 130, section 4)
- Q: Does the pin check apply under the `parity` profile? → A: No. The baseline has no such check, and the stubs of the oracle cannot be assumed to print the pin or to list tool ids, so the check has a switch that is `none` under the profile. They are row 117 of annex X §X.7 and register row DV-110. Integrated in F130-FR-024, F130-FR-025. (Source: F100-FR-212; annex X §X.7 row 28; DV-081)
- Q: What does the critic run in as its working directory? → A: Under the profile the directory the engine hands over, as at the baseline; otherwise an empty directory (annex C §C.1, "for the tool-less form an empty working directory"). Integrated in F130-FR-021. (Source: annex C §C.1; B-0988)
- Q: Does the table of bare model ids ship? → A: One built-in row, the bare `glm-` prefix to the provider `zai`. The other row of the baseline names a route specific to the owner's machines: it is user configuration and no specification names it. Integrated in F130-FR-013; DV-109. (Source: brief 130, section 2, "Bare model ids"; naming rule)
- Q: Where does a reference error of the critic end? → A: In a failed critic call, as the code of the baseline scores it. The catalogue of feature 141 states the same end since its follow-up of 2026-09-29: engine exit 1, `critic_unavailable`, after three phase attempts scored MALFORMED. Integrated in F130-FR-028. (Source: baseline `lib/critic.py`, the handler around `critic_call`; `STAGE-B-RULES.md` section 1 "code is what parity means"; feature 141 §O.2)
- Q: What is the window of a critic with no known window? → A: Under the profile 98,304, as the baseline. Outside it the critic does not qualify (Principle IX). Integrated in F130-FR-029; DV-111. (Source: constitution Principle IX; brief 130, section 3; R9 F18)
- Q: Where do the request, the archive and the lock live? → A: At `harness:dsh:plugin-request` (workspace part, a claim), `harness:dsh:plugin-installs` (control plane) and `harness:dsh:install-lock` (the harness's home, the one permitted write). The as-is request was per feature; the logical name has no feature part, and a workspace has one run. Integrated in F130-FR-033. (Source: annex B §B.5)
- Q: Where is the patch file of the critic kept? → A: In the temporary directory of the call, at the logical name `pass:<passId>:critic-patch`; its hash is in the call record. Integrated in F130-FR-023. (Source: annex B §B.5, root `temp`)
- Q: Can a quota class be found for a critic failure on standard output? → A: Yes; both streams are scanned, because the harness reports some failures on standard output. Integrated in F130-FR-038. (Source: R9 F13; R14 B13; baseline `lib/critic.py`)
- Q: Is a cost figure reported? → A: No. Usage is `none`; every pass says `harness-does-not-report`; a cost exists only as the consumer's declared estimate. Integrated in F130-FR-039. (Source: R14 B13, B16, EV-16)
- Q: Which harness variables does the adapter set? → A: The home, the permission mode and the telemetry mode only. Integrated in F130-FR-041. (Source: R11 T-34; brief 130, section 4)
- Q: Which provider identity has the descriptor? → A: `dsh`, the harness itself; the model provider behind it is chosen in the harness's settings and known only through a qualifier. The terms row is absent, so the terms are unknown. Integrated in F130-FR-001, F130-FR-004. (Source: annex C §C.2; R8 F-D1 to F-D4)
- Q: Which open questions of the clarify queue bear on this feature? → A: CQ-015 and CQ-016 are closed by rulings P14 and P15. CQ-063 (the budget of `harness verify`) means a verification call on this harness needs the budget argument and is a paid probe. CQ-064 (the fields of the overlay marker) bears on the generic overlay; the settings overlay of this feature needs the same marker fields for sweep. CQ-065 gives the descriptor the logical name `package:harness:dsh`. None changes a requirement here. (Source: `CLARIFY-QUEUE.md`)
- Q: How many rows does the divergence register have? → A: 113, DV-001 to DV-113. The four rows of this feature, DV-108 to DV-111, are in it. (Source: `consolidation.md` section 6)
- Q: Does this feature run the captures? → A: No. They are tasks and probes for people who are authorized; a paid call is logged. Integrated in F130-FR-042. (Source: brief 130, section 8; ruling 67)

### Session 2026-09-30, after the cross-feature review

Answered from the rulings, feature 100 and the clarify queue. No question was put to a person.

- Q: Does the audience `personal` lift the bar of ruling P14? → A: No. The ruling names no audience: never a default and never picked automatically, in both roles. Integrated in F130-FR-004, F130-FR-030. (Source: `APPROVAL.md` ruling P14; F100-FR-093; worklist item W-138-02)
- Q: May dsh be a proposer although the adapter cannot switch the customisations of the profile off? → A: Yes, where the consumer names it; each switch is null in `capabilities`, the doctor warns and the state is recorded per run. It is a deviation from Principle VIII, recorded in the plan, and not an exception to ruling 36. Integrated in F130-FR-003, F130-FR-043. (Source: CQ-189, recommended answer; rulings 36, P14, P15)
- Q: What is recorded about native memory? → A: Per run, the value asked and the state, for the proposer and for every critic-class call. Integrated in F130-FR-044. (Source: ruling 37; F100-FR-082)
- Q: May dsh be a critic while it is not established whether it keeps a native memory? → A: No, outside the `parity` profile. A state that is not established is read as not off. Integrated in F130-FR-045. (Source: F100-FR-082; row 182 of annex X §X.6, `memory-not-off`; CQ-189)
- Q: From where may `loop.parallel.allow_detect` and the opt-in to containment C0 come? → A: From user configuration only. Integrated in F130-FR-010, F130-FR-018. (Source: CQ-183, recommended answer; F100-FR-111, F100-FR-112)
- Q: Is a missing or invalid credential of the critic a configuration error? → A: Under the `parity` profile it is a failed critic call, as the code scores it. Integrated in F130-FR-026. (Source: CQ-187, recommended answer; follow-up report of feature 141)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The stream seam (text reader and synthesis of `init` and `terminal`), the harness seam (registry, port, overlay tool), role resolution and the critic order, the terms gate, the quota classifier and the pause, the prompt assembler and the pass loop exist when this adapter calls them. Each is reached through its interface contract of feature 100.
- The fixture captures and the live probes are run by people who are authorized to run them. This feature runs none.
- The harness makes its own calls to its provider. The adapter cannot see them and does not guarantee anything about them.
- The `--profile` value is one profile of the harness's home. A plugin install changes that profile only.
- Every macOS statement is `unverified` (ruling 67), the behaviour of the temporary directory and of links included.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-142 | The coverage check needs a free way to list the tool ids of the composed profile, and none is established | The plan names one after capture 3; if none exists the critic role on this harness is refused under the value `strict` | F130-FR-024 |
| CQ-182 | May a tested harness adapter whose stream has no initial record prove the tool-less form by its exact version pin and its preflight? | Yes, recorded for every call as the weaker proof. Closed by the owner on 2026-09-30; Principle IX names it since constitution v3.0.1, and the plan keeps its deviation row until the first implementation slice | F130-FR-025 |
| CQ-183 | Does "user config" in rulings 34 and P2 mean the user configuration only? | Yes | F130-FR-010, F130-FR-018 |
| CQ-187 | Is a missing critic credential a configuration error or a failed critic call? | A failed call under the `parity` profile | F130-FR-026 |
| CQ-189 | May dsh be used as proposer with its profile loaded? | Yes, where the consumer names it; null in `capabilities`, doctor warning, record per run. The critic role is refused unless native memory is off or absent. Closed by the owner on 2026-09-30 | F130-FR-003, F130-FR-043, F130-FR-044, F130-FR-045 |
| CQ-232 | May a critic-class call run with a customisation of the profile that gives the model no tool and cannot be switched off? | No: the role is refused as for native memory once capture 6 shows such a customisation; until then it is recorded and warned. Closed on 2026-09-30 on the recommended answer | F130-FR-045 |
| CQ-233 | Does "user config" in ruling P15 mean the user configuration only? | Outside the `parity` profile, yes; under the profile the as-is variable stays. Closed on 2026-09-30 on the recommended answer | F130-FR-034 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place, with the item and what changed. No id was
renumbered or reused.

| Requirement | Item | What changed |
|---|---|---|
| F130-FR-001 | W-X-33 | Names annex C §C.5 of feature 100 in place of another tier 2 feature |
| F130-FR-003 | W-130-01; CQ-189 | The switch of each kind of customisation is reported as null; whether a native memory exists is `unverified`; a switch is reported only when a capture shows it |
| F130-FR-004 | W-138-02 (ruling P14) | The bar on the default and on the automatic pick holds under every audience and for both roles; `personal` lifts nothing |
| F130-FR-005 | W-130-01; W-X-19 | Doctor checks for customisations, native memory and the refusal of the critic role; `implements (an entry)` |
| F130-FR-008, F130-FR-022 | W-110-03 | The aliases are those of annex X §X.8 |
| F130-FR-010 | W-100-23 (CQ-183) | The opt-in to C0 comes from user configuration only |
| F130-FR-014, F130-FR-015 | W-130-01 | Say that the throwaway home carries the customisations, and which half of ruling 36 is met |
| F130-FR-018 | W-100-23 (CQ-183) | `loop.parallel.allow_detect` is accepted from user configuration only |
| F130-FR-023 | W-X-25 | Names the logical name `pass:<passId>:critic-patch` |
| F130-FR-024, F130-FR-033, F130-FR-034 | W-X-11 | Rows 117 and 118 of annex X §X.7 by number |
| F130-FR-025 | W-100-19, W-100-20 (CQ-182) | Says that the weaker proof departs from the text of Principle IX |
| F130-FR-026 | CQ-187 | A missing or invalid credential of the critic is a failed call under the `parity` profile |
| F130-FR-028 | Follow-up of feature 141 | The note on CQ-141 is removed; the end on the reference is stated |
| F130-FR-030 | W-138-02 | "Under every audience"; naming the harness lifts the bar of the terms only |
| F130-FR-034 | W-130-01 | Ruling P15 is the one exception to ruling 36 and is no consent to what the profile loads |
| F130-FR-041 | W-X-18 | The secret resolver (EP-10) is consumed here |
| F130-FR-042, F130-SC-008 | W-130-01 | Capture 6 added; six captures |

Re-check B-8.7, pass-on (2026-09-30): the table "Closed sets" cites rows 275 and 276 of annex X §X.6 for the two sets
added by the repair (kinds and states of a customisation) in place of "needs a row"; members unchanged; no requirement
changed. Task T067 follows.

Requirements added: F130-FR-043 (customisations in a proposer pass), F130-FR-044 (native memory,
recorded per run), F130-FR-045 (refusal of the critic role). Tests added: CT-130-43, CT-130-44,
CT-130-45.

Amendment (2026-11-03, the owner's ruling "build parallel units; the release waits for them"): the
parallel-units campaign makes this adapter the first tested concurrent harness. `startPass` of
EP-02 is implemented (`packages/adapter-dsh/src/start-pass/`, one worker pass of a group in a
process group of its own, its tree as the write root, a fresh session under the worker id; pinned
as CT-130-47), and the capture of `concurrentSessions` runs for real (three `zai/glm-5.3-flash`
headless sessions at once under one configuration home and one login, with separate session
stores; CT-130-46, `packages/adapter-dsh/test/concurrent-sessions.test.ts`), so F130-FR-003
declares the capability with the proven count `3`, the provenance `adapter` and the mark
`verified`, and the descriptor data carries `concurrentSessions: true`. The out-of-band rule of
2026-09-30 (never run the paid part) is lifted by that ruling for exactly this capture. Test
added: CT-130-46, CT-130-47; CT-130-3 re-pinned for the one capability that left the nulls.
