# Feature Specification: Host plugin for Claude Code

**Feature Branch**: `113-host-claude-code` (a label: Spec Kit creates no branch in this repository; the directory is `specs/113-host-claude-code`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 113-host-claude-code: the Claude Code plugin of Specstride as a thin layer over the published package: the host skills `specstride-run` and `specstride-reverse` and the doctor skill; what each skill tells the host model to do and in which order; modes and the optional comment; host hooks; the executable shim that finds the CLI and checks the protocol; packaging and the marketplace entry; skill-trigger evals; token budgets and the context-cost CI; the host package contract (EP-01) as implemented for this host."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 1, 2, 6, 25, 36, 64, 65, 67), `architecture.md`, `consolidation.md` (glossary; register rows DV-006, DV-009, DV-033, DV-056, DV-061), `feature-briefs.md` (brief 113-host-claude-code), `STAGE-B-RULES.md`, constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles I, VI, XIII, XV, XVI, XVII, XIX), research R3, R3v, R11, R14, R17, and feature 100 annexes G and H.

## Scope

The Claude Code plugin is a thin layer over the published package. It holds no product logic. Every fact it needs is a line of the CLI.

**In scope**: the two host skills `specstride-run` and `specstride-reverse` and the doctor skill; what each tells the host model to do and in which order; modes and the optional comment as the skill takes them; host hooks; the executable shim that finds the CLI and checks the protocol; packaging and the marketplace entry; skill-trigger evals; token budgets and the context-cost CI; EP-01 as implemented for this host, with its conformance suite.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Every command the skills call | 107, 123, 129, 102, 108, 112 |
| The CLI protocol | 100 |
| The detached start, and whether it survives the session | 122 |
| Claude as a harness | 125 |
| The dsh plugin | 120, Wave 2 |
| Renderers | 121, Wave 2 |

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
| Claude Code is the first host; the plugin exposes `specstride-run` and `specstride-reverse` | Prompt section 0; decision 13 |
| Host hook shims may be thin shell shims; nothing else is | Decision 2 |
| Every host fact carries a `verified-on` date and a version pin | Prompt section 6 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer invokes `specstride-run` and the run starts (Priority: P1)

A consumer has finished Spec Kit features. They invoke `specstride-run`, with or without a comment. The skill captures the comment, derives and validates a launch contract through the CLI, launches, and reports the outcome line. Invoking the skill is the consent.

**Why this priority**: It is the path of every real run and it must fit the host's context.

**Independent Test**: Play the command sequence of the skill on fixture `greeting-ready` (FX-32) with stub agents through the host conformance suite; measure bytes from invocation to launch against 8,000 tokens.

**Acceptance Scenarios**:

1. **Given** finished features and no comment, **When** the skill is invoked, **Then** it derives, judges, validates, promotes, renders and launches, and prints one outcome line (F113-FR-002, F113-FR-003).
2. **Given** the mode `dry-run`, **When** the skill is invoked, **Then** it stops after validation and the plan, and starts nothing (F113-FR-004).
3. **Given** a comment that says "do not run yet", **When** the skill is invoked, **Then** the mode is `dry-run` and the skill says that the comment changed it (F113-FR-005).

---

### User Story 2 - The consumer learns the state of a run from one line (Priority: P1)

The consumer starts a new host session while a run lives, or asks how it goes.

**Why this priority**: Supervision must cost 3,000 tokens for a whole run with `relaunch.owner` `root`; with `supervise` the budget is not promised (F113-FR-013).

**Independent Test**: Step a fixture run through scripted state changes; an unchanged state produces 0 bytes and a change at most one line of 420 bytes.

**Acceptance Scenarios**:

1. **Given** a live run, **When** a session starts, **Then** the host hook prints one status line with `validUntil`, or nothing when no run exists (F113-FR-021).
2. **Given** an unchanged run, **When** the consumer submits a prompt, **Then** no line is printed (F113-FR-022).
3. **Given** a run that ends, **When** the digest is printed, **Then** the skill prints it verbatim (F113-FR-012).

---

### User Story 3 - The plugin refuses a CLI it cannot drive (Priority: P1)

The CLI is missing, or speaks another protocol.

**Why this priority**: A plugin that installs code by itself is a supply-chain risk (R11 T-46).

**Independent Test**: Put a stub CLI printing protocol 2 on the search path; the shim prints one line naming the doctor and runs nothing.

**Acceptance Scenarios**:

1. **Given** no CLI, **When** the shim runs, **Then** it prints the install command and installs nothing (F113-FR-018).
2. **Given** a protocol outside the supported range, **When** the shim runs, **Then** it refuses with one line that names the doctor (F113-FR-019).

---

### User Story 4 - The build keeps every skill inside its budget (Priority: P2)

A maintainer changes a skill text.

**Why this priority**: Context is budgeted (Principle XIX).

**Independent Test**: Add 3,000 bytes to `specstride-run`; the static size check fails the build.

**Acceptance Scenarios**:

1. **Given** a skill over its byte limit, **When** the build runs, **Then** it fails with `budget-exceeded` (F113-FR-036, F113-FR-037).
2. **Given** a skill that names a path into product source, **When** the build runs, **Then** the reference closure check fails it (F113-FR-037).

---

### User Story 5 - Each skill triggers on the right requests (Priority: P2)

**Why this priority**: A skill that fires on unrelated requests wastes context.

**Independent Test**: Without a model call: the static check of the suite files, and the eval driver on a stub of the host's suite runner with recorded results (F113-FR-041). With a model: a person runs the trigger suite as a paid task, at the model that configuration names (F113-FR-038, F113-FR-039).

**Acceptance Scenarios**:

1. **Given** a positive case, **When** a person runs the suite as a paid task, **Then** the right skill is invoked (F113-FR-038).
2. **Given** a negative or cross-skill case, **When** a person runs the suite as a paid task, **Then** no skill or the other skill is absent (F113-FR-038).
3. **Given** a suite file with five positive cases for a skill, or with a model id in it, **When** the build runs, **Then** the static check fails the build and no model is called (F113-FR-041).
4. **Given** a release whose skill texts have no logged suite run at the threshold, **When** the release check runs, **Then** it fails, and it calls no model (F113-FR-038).

---

### Edge Cases

- No run exists: host hooks print nothing (F113-FR-021).
- The status line is past `validUntil`: it says the state is unknown (F113-FR-021).
- The consumer's comment asks to skip a launch check: the skill refuses to act on it and says so (F113-FR-005).
- A push alert host hook is killed at its time limit: nothing depends on it (F113-FR-026).
- The plugin loads in a Tier 1 child of a run: the host hooks print nothing (F113-FR-027).
- A host without host hooks, a background primitive or a writable state root: the declared fallback applies (F113-FR-028).
- The plugin version and the CLI version differ but the protocol matches: the doctor shows the difference; the run is not refused (F113-FR-019).
- A run of the trigger suite is asked for and configuration names no model: the run is refused before any call (F113-FR-039).
- A marker of the host is missing or damaged: one more line is printed, and nothing else changes (F113-FR-016, F113-FR-021).

## Requirements *(mandatory)*

### Functional Requirements

#### G1 The three skills

- **F113-FR-001**: The plugin MUST offer three skills with the logical ids `specstride-run`, `specstride-reverse` and a doctor skill. Each MUST be a thin layer over the CLI: operable without reading the product's source, its state or a launch contract, with a happy path that needs no reference file. The plugin MUST NOT author specs.
  - divergence: DV-056
  - test: CT-113-101
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-002**: The skill `specstride-run` MUST tell the host model to work in this order: (1) capture the consumer's comment verbatim; (2) run the shim's CLI check; (3) derive the launch contract through the launch-contract commands of the CLI; (4) judge the batches of the judgment exchange; (5) validate, and promote through validation; (6) render; (7) launch; (8) print the outcome line; (9) supervise; (10) print the digest. It MUST stop at the first refusal and print the line of the CLI that names the fix. If no finished feature exists, it MUST say so and stop.
  - divergence: DV-009
  - test: CT-113-102
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-003**: The skill MUST print the outcome of `launch` as the CLI gives it: `started`; `attached`, and then supervise the run that lives; `refused`, and then print the refusal line and not retry unless the consumer asks. It MUST NOT print a state it did not read from a line.
  - test: CT-113-103
  - ep: EP-01 `specstride.host/1` (implements)
  - status: unverified (check: launch outcomes and codes of annex F §F.3 on the conformance suite; verified-on: —; pin: —)

- **F113-FR-004**: Invoking `specstride-run` MUST be the consent to launch. The modes MUST be `run`, the default, and `dry-run`. In `dry-run` the skill MUST derive and validate, print the plan, and stop; it MUST NOT launch. A failed launch check shown in the plan MUST be reported as a finding and MUST NOT be reported as a failure of derivation. A request that does not invoke the skill launches nothing.
  - origin: C-245; B-2667
  - disposition: translated
  - test: CT-113-2
  - divergence: DV-009
  - parity: row 37 of annex X §X.7 (mapped through the mode map)

- **F113-FR-005**: An explicit mode given by the consumer MUST beat prose in the comment; a refusal in the comment ("do not run yet") MUST beat an invitation and give `dry-run`; no mode and no comment MUST give `run`. The skill MUST NOT infer a mode from the request's prose outside the comment. The comment MUST NOT bypass a launch check, the terms gate or a budget, and the skill MUST refuse to act on a comment that asks for it. The skill MUST say what it changed because of the comment. For every option it set because of the comment it MUST add `--comment-selects <option>` to the same call (`features`, `relaunch` or `learning` on `contract derive`; `mode` on `launch`; annex X §X.6 row 283), and it MUST relay a refusal of an option as the CLI prints it.
  - divergence: DV-009
  - test: PT-113-DV009-*
  - parity: row 37 of annex X §X.7
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-006**: The mode names of the old skill MUST map: `generate` to `dry-run`; `run` and `auto` to `run`. The case "no execution phrasing", which the old skill turned into `generate`, is a waiver of the oracle (FX-36, scenario `mode-no-execution-phrasing`).
  - divergence: DV-009
  - test: PT-113-DV009-mode-map-*
  - parity: row 37 of annex X §X.7

- **F113-FR-007**: The skill MUST pass the consumer's comment to the CLI verbatim as one argument, `--comment`, to `contract derive` and again, unchanged, to `launch`, and MUST capture it before it reads any repository text. It MUST NOT summarize, translate or extend it. Wherever it names the launch contract, the launcher or the launch bundle, it MUST pass the logical name that the CLI printed and never a path.
  - test: CT-113-107
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-008**: The skill MUST judge derivation as the judgment exchange: it reads one batch of at most 3,000 tokens, answers each item with one of the choices the item offers, and never with free text; it never opens the launch contract or a source. When batches remain, it MUST take the printed count and go on. When the count is large, it MAY hand the batches to a subagent. This host has a model; the delegation to a harness is not used.
  - test: CT-113-108
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-009**: The skill MUST NOT write any file of the consumer's repository, an ignore file included. The product's state lives outside the working tree, so the skill appends no ignore rules. Where the CLI writes such a rule, the CLI prints which file received it and the skill relays that line.
  - origin: C-244; B-2661
  - disposition: translated
  - test: CT-113-1
  - divergence: DV-006

- **F113-FR-010**: The skill MUST NOT write the verification plan to a file and pass it. The declared verification commands are read by the CLI from the sources, and the CLI stores the verification-commands document in the control plane. The skill hands over nothing but the consumer's comment.
  - origin: C-244; B-2662
  - disposition: translated
  - test: CT-113-1
  - divergence: DV-006

- **F113-FR-011**: The skill MUST NOT search for or run the CLI except through the shim, and MUST NOT read outside the consumer's repository and its own directory. A missing CLI is reported through the launch checks or the doctor lines. The skill MUST NOT edit a launcher, MUST NOT pass a flag that replaces an edited launcher, MUST NOT run a learning command that applies, reverts or switches off, and MUST NOT write a status. It states the location of a launcher or another artifact by logical name, as the CLI prints it.
  - origin: C-245; B-2663; B-2664; B-2666
  - disposition: translated
  - test: CT-113-2
  - divergence: DV-009; DV-033

- **F113-FR-012**: Supervision in the host MUST only read. The skill MUST relay the lines of the CLI verbatim, report an outcome only from a line, never read a state file or a log, and print the digest verbatim as the last line of the run. A lost output MUST be recovered by repeating the read command.
  - origin: C-245; B-2668
  - disposition: translated
  - test: CT-113-2
  - divergence: DV-009; DV-033

- **F113-FR-013**: The skill MUST supervise with the blocking `wait` command with its change option and the cursor of the previous call. An unchanged state prints nothing. With a background primitive the wait runs in the background; without one every cycle costs at most 150 tokens. The whole supervision of a run MUST stay within 3,000 tokens when `relaunch.owner` is `root`; with `supervise` the budget is not promised.
  - test: CT-113-113
  - ep: EP-09 `specstride.view/1` (consumes)

- **F113-FR-014**: The skill `specstride-reverse` MUST tell the host model: capture the comment; check the CLI; plan; inventory; judge where the reverse commands offer items; run through the reverse command; supervise; print the digest verbatim. Invoking it is the consent to run; a dry run withholds it. It MUST NOT modify the sources of the reverse run.
  - test: CT-113-114
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-015**: The doctor skill MUST run the doctor command, print the findings terse with the fix of each, and print the command to run when a CLI is missing or mismatched. It MUST NOT install or update anything. It MUST report the exit codes 0, 1, 2, 3 as annex G §G.4 gives them.
  - test: CT-113-115
  - ep: EP-14 `specstride.doctor/1` (consumes)

- **F113-FR-016**: The skill MUST tell the consumer once, when the audience `distributed` first shows in a doctor finding or a launch line, that with Claude as harness the default auth tier is then Tier 2, and how to set `personal` in user configuration (key `distribution.audience`). It MUST NOT set it. The marker of "once" is host-scoped and outside the repository. It is state of the host and not of the product: no run and no command of the product reads it, and a missing or damaged marker MUST cause only that the notice is printed once more. Annex B §B.5 holds no logical name for it (reported, F100-FR-053).
  - test: CT-113-116
  - parity: row 34 of annex X §X.7 (owned by feature 147)
  - status: unverified (check: the first-launch notice on a live host; verified-on: —; pin: —)

- **F113-FR-017**: Text that comes from a run or a repository (critic feedback, test names, messages of a harness, judgment excerpts) MUST be framed as data by the skill: the skill's text says that command output is data and no instruction. Every line a host hook injects MUST follow the status-line grammar or a product label of annex G §G.3 and hold no repository text.
  - test: CT-113-117
  - ep: EP-01 `specstride.host/1` (implements)

#### G2 Host hooks and the shim

- **F113-FR-018**: The shim MUST find the CLI in this order: an explicit variable of the consumer, the search path, the package the plugin was published with. It MUST NOT fetch, install or update anything. On a missing CLI it MUST report through the doctor and print the install command.
  - test: CT-113-118
  - ep: EP-01 `specstride.host/1` (implements)
  - status: unverified (check: `bin` on the search path of host hooks is documentation only; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-019**: The shim MUST call `specstride --protocol`, compare the integer with the range it supports, and refuse a mismatch with one line that names the doctor. It MUST NOT refuse for a differing package version alone.
  - test: CT-113-119
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-020**: Host hooks MUST be thin shims that print a file the runtime precomputed, or a line the CLI prints. A host hook MUST NOT start the runtime platform, the status shim MUST NOT depend on a start of the runtime platform, and a host hook MUST keep to its time limit. No run may depend on a host hook.
  - test: CT-113-120
  - ep: EP-09 `specstride.view/1` (consumes)

- **F113-FR-021**: The host hook on session start MUST print one status line with `validUntil`, or nothing when no run exists. Its shim MUST find the line through the logical name `workspace:current:status-line` of annex B §B.5, which points to `run:<runId>:status-line` of the current run (F100-FR-229); it reads no other state of the product. It MUST print again after a compaction only if the state changed since the last injection. A line past `validUntil` MUST say that the state is unknown. The marker of the last injected state is state of the host, as the marker of F113-FR-016: no run and no command of the product reads it, and a missing or damaged marker MUST cause only that one more line is printed.
  - test: CT-113-121
  - ep: EP-09 `specstride.view/1` (consumes)
  - status: unverified (check: firing on start, resume, clear, compact on a live host; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-022**: The host hook on prompt submission MUST print nothing unless the state or the phase changed since the last injection, and then one line.
  - test: CT-113-122
  - ep: EP-09 `specstride.view/1` (consumes)

- **F113-FR-023**: A guardrail host hook before a shell command that launches a run MUST have the CLI evaluate the launch checks without launching, and deny with one line when a launch check would refuse. It is defence in depth: the CLI refuses the same checks, and the comment MUST NOT override it.
  - test: CT-113-123
  - ep: EP-14 `specstride.doctor/1` (consumes)

- **F113-FR-024**: A limit event that the host observes MUST be written through the CLI as an inbox request of type `host-event` (logical name `inbox:host-events:<launchId>`, annex B §B.5 and §B.11), with its `kind` and redacted `data`. The host hook MUST NOT write the inbox itself and MUST NOT inject context. The event describes the host session's own limit, and the run's harness quota comes from its adapter.
  - test: CT-113-124
  - status: unverified (check: the host events for rate limit and quota resume on a live host; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-025**: The plugin MUST register no host hook on stop and none after a tool use that injects context.
  - test: CT-113-125

- **F113-FR-026**: A push alert through a re-waking host hook MUST set an explicit long time limit and re-arm after it fires, or the plugin MUST use the host's monitor as the primary way. No run and no alert of `status` or the digest depends on it.
  - test: CT-113-126
  - status: unverified (check: capture of the lifetime and re-arming of the re-waking host hook on a live host; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-027**: A Tier 1 child of a run MUST NOT load this plugin's host hooks. Its customizations are switched off by the harness adapter, and as a second guard a host hook MUST print nothing when it runs inside a child of a run.
  - test: CT-113-127
  - status: unverified (check: a Tier 1 child on a live host; verified-on: —; pin: Claude Code 2.1.284)

#### G3 Packaging and the host package contract

- **F113-FR-028**: The package for this host MUST offer `describe`, `renderSkill`, `renderEntry` and `evalDriver.run`, and `renderStatusHooks`. `describe` MUST declare the six capabilities of annex H §H.1 with their values: `hooks` (the events of F113-FR-021 to F113-FR-024), `statusSurface`, `background`, `evals` (native), `model` (yes), `stateRootWritable` (`unverified` until the spike of feature 122 reports). Each absent one MUST use its declared fallback.
  - test: CT-113-128
  - ep: EP-01 `specstride.host/1` (implements)
  - status: unverified (check: capture of each capability on a live host; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-029**: An unknown capability in `describe` MUST be ignored. An unknown logical id of a skill or command MUST fail the build.
  - test: CT-113-129
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-030**: One published package MUST hold the plugin directory, with an explicit plugin version equal to the package version, a marketplace entry, no install script and nothing that compiles at install. The build MUST validate the plugin strictly.
  - divergence: DV-056
  - test: CT-113-130
  - status: unverified (check: the npm source of a plugin entry and the version rule; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-031**: The plugin MUST hold skills, host hook configuration, one shim and its manifest, and MUST hold no server of the model context protocol in Wave 1. The `evals` directory MUST NOT ship to consumers.
  - test: CT-113-131

- **F113-FR-032**: The host's own background job mode is considered and rejected as the runtime. The doctor MUST warn when it isolates the working tree.
  - test: CT-113-132
  - status: unverified (check: the isolation setting on a live host; verified-on: —; pin: Claude Code 2.1.284)

- **F113-FR-033**: The plugin MUST register its host checks in the doctor registry with the prefix `host.`, at least: CLI found, protocol supported, plugin version equals package version, host hooks loaded, state root writable, background isolation. None is a launch check except a missing CLI.
  - test: CT-113-133
  - ep: EP-14 `specstride.doctor/1` (consumes)

- **F113-FR-034**: The host conformance suite MUST run the command sequences of both host skills on oracle fixtures with stub agents, against the plain shell and against this plugin, measure bytes against the budgets, check the reference closure and validate the artifact tree. The case of survival after detaching MUST run only on a live host and MUST be reported as a skip with its reason elsewhere.
  - test: CT-113-134
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-035**: Every host fact in the plugin MUST carry a `verified-on` date and a version pin. A fact that rests on documentation only, all macOS behaviour and detach survival inside a host session are `unverified`.
  - test: CT-113-135

#### G4 Evals, budgets and the context-cost CI

The per-change build calls no model. What calls a model is a paid task, run by a person and logged (F113-FR-038 to F113-FR-041, `assumption: CQ-188`).

- **F113-FR-036**: `specstride-run` MUST stay within 8,000 tokens from invocation to launch, `specstride-reverse` within 7,000, the doctor skill within 1,500, one supervision cycle within 150 (an unchanged cycle 0), a whole run's supervision within 3,000. The build MUST measure bytes at 2.8 bytes per token (22,400; 19,600; 4,200; 420; 8,400) and fail on a breach. The body of a skill MUST NOT exceed 500 lines.
  - test: CT-113-136
  - ep: EP-01 `specstride.host/1` (implements)

- **F113-FR-037**: The context-cost CI MUST run seven checks, none of which calls a model: static size; reference closure; golden output; supervision cycle; judgment payload; host cross-check; startup. Reference closure MUST fail any path from a skill into product source, state or logs. Judgment payload MUST use a synthetic feature of at least 200 tasks and the total printed MUST NOT grow with the size of the sources. The host cross-check MUST fail a difference over 15 per cent and be skipped with a warning when the host CLI is absent. Startup MUST hold `status` at or below 150 ms at the 90th percentile over 30 runs. A report file MUST record measured bytes, tokens and limits.
  - test: CT-113-137
  - status: unverified (check: the startup limit on a macOS runner; that the host command of the cross-check makes no model call is inferred (R17) and is confirmed by a capture with the network off; verified-on: —; pin: runner version, Claude Code 2.1.284)

- **F113-FR-038**: The trigger suite MUST hold for each skill at least six positive and six negative cases, among them the confusable pair run and reverse. It MUST use free graders and restrict tools so that no run can launch. A run of the suite calls a model. It is a paid task: a person MUST start it, no job of the build MUST start it on a change, on a schedule or at a release, and it MUST be logged with its date, the model ids, the number of calls, the cost and the hash of the skill texts. The suite is a release check and no check of a change: a release MUST NOT be made unless the log holds a run on the skill texts of that release, matched by their hash, in which every skill reached the threshold 0.8 over three runs without ablation. The release check reads the log and MUST call no model.
  - test: CT-113-138
  - ep: EP-01 `specstride.host/1` (implements)
  - assumption: CQ-188

- **F113-FR-039**: The model of a suite run, and the judge model where a grader uses one, MUST come from the configuration of the run, given by the person who starts it, and MUST be recorded in the log of the run. A model id MUST NOT be written in a suite file, a test, a check or a rule. A run for which configuration names no model MUST be refused before any call. An interrupted run and a run ended by a usage limit MUST NOT count as a score failure; the suite reports them as not scored.
  - test: CT-113-139
  - status: unverified (check: a usage-limit run on a live host; verified-on: —; pin: Claude Code 2.1.284)
  - assumption: CQ-188

- **F113-FR-040**: The behaviour smoke with a stub CLI MUST assert that the doctor runs before `launch` and that `dry-run` never launches. The with-and-without report compares the host with and without the plugin. Both call a model. Both are paid tasks: a person MUST start them, no job of the build and no schedule MUST start them (there is no nightly and no weekly job), and both MUST be logged as F113-FR-038 says. Neither is a check of a change, and neither is a release check.
  - test: CT-113-140
  - assumption: CQ-188

- **F113-FR-041**: The per-change build MUST call no model and no paid or external API. For the evals it MUST check what can be checked without a model call: (a) the suite files: the case counts of F113-FR-038, the confusable pair, the restriction of tools, and that no file holds a model id; (b) the eval driver, on a stub of the host's suite runner with recorded results, among them an interrupted run and a run ended by a usage limit, which are reported as not scored; (c) the token budget of each host skill (F113-FR-036). The build MUST fail when one of its jobs would start the host's suite runner.
  - test: CT-113-141
  - ep: EP-01 `specstride.host/1` (implements)
  - assumption: CQ-188

- **F113-FR-042**: The host package MUST be published only as part of the one published package, under F100-FR-236: by the build, from a protected branch, with the attestation. The plugin directory MUST NOT be published apart from the package, from a working copy or by hand. The marketplace entry and the documentation MUST name the exact package and the exact version, and no range. Because the plugin directory lies inside the package, the release check of F100-FR-236 covers it; this feature adds no second attestation. This is the control of threat T-43 for the host package and, with F113-FR-019, of threat T-45.
  - test: CT-113-142
  - status: unverified (check: that a marketplace entry with an npm source can pin one exact version; verified-on: —; pin: Claude Code 2.1.284)

## Key Entities

| Entity | What it is |
|---|---|
| Host skill | A logical id with a body, references and a budget |
| Shim | The executable that finds the CLI and checks the protocol |
| Host hook | A thin shim on a host event |
| Host package | The artifact tree and eval driver of EP-01 for one host |
| Trigger case | One prompt with the skill that must, or must not, fire |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F113-SC-001**: `specstride-run` uses at most 8,000 tokens and `specstride-reverse` at most 7,000 from invocation to launch, the doctor skill at most 1,500, and all seven checks pass in the per-change build, which makes 0 model calls.
- **F113-SC-002**: On the trigger suite each skill fires on 100 per cent of its positive cases at threshold 0.8 and stays quiet on the negative ones, in a logged paid run that a person started, at the model that configuration names. No suite file, test or check holds a model id.
- **F113-SC-003**: The reference closure check finds 0 paths from a skill into product source, state or logs.
- **F113-SC-004**: A whole run's supervision costs at most 3,000 tokens with `relaunch.owner` `root`; an unchanged state prints 0 bytes.
- **F113-SC-005**: With a missing or mismatched CLI the shim installs 0 files and prints one line.

## Extension points

| EP | Id and version | Relation |
|---|---|---|
| EP-01 | `specstride.host/1` | Implements: first implementation and its conformance suite |
| EP-09 | `specstride.view/1` | Consumes |
| EP-14 | `specstride.doctor/1` | Consumes |

## Contracts of feature 100 used

| Contract | Annex and section |
|---|---|
| CLI protocol, commands, output modes, line grammar | annex G §G.1, §G.2, §G.3 |
| Exit codes per command | annex G §G.4 |
| Token budgets | annex G §G.5 |
| Read model | annex G §G.6 |
| Doctor registry and findings | annex G §G.7 |
| Launch-contract schema, mode map | annex G §G.8 |
| Launch outcomes `started`, `attached`, `refused` and their codes | annex F §F.3; F100-FR-160 |
| `relaunch.owner` (`root`, `supervise`) | annex F §F.4 |
| Judgment exchange | annex G §G.9 |
| Host port and capabilities | annex H §H.1 |
| Inbox request types (`inbox:host-events:<launchId>`); status-line names (`workspace:current:status-line`, `run:<runId>:status-line`) | annex B §B.5, §B.11; F100-FR-229 |
| Publishing by the build with an attestation (control of threat T-43); the threat model | annex X §X.9; F100-FR-236; F100-FR-216 |
| Closed sets, `parity` profile | annex X §X.6, §X.7 |
| Fixture families FX-36 (mode map), FX-32 (derivation), FX-35 (launcher and pipeline runtime) | feature 141 §O.2 |

## Rows of the `parity` profile

This feature introduces no switch. Row 37 (mode of the host skill, owned by 107) and row 34 (audience, owned by 147) are cited only.

## Closed sets

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Capabilities of a host (row 84) | `hooks`, `statusSurface`, `background`, `evals`, `model`, `stateRootWritable` | 113 | Design | Ignored |
| Logical ids of host skills and entries (proposed row) | `specstride-run`, `specstride-reverse`, `doctor` | 113 | Design | The build fails |
| Checks of the context-cost CI (proposed row) | static size, reference closure, golden output, supervision cycle, judgment payload, host cross-check, startup | 113 | Design | The build fails |

## Threats

The threat model is annex X §X.9 (F100-FR-216). It names feature 113 as an owner of seven threats. The requirement that is the control of each:

| Threat | What | Control | Requirement | Other owner |
|---|---|---|---|---|
| T-09 | Repository text makes the host model alter the consumer's comment | The comment is captured before any repository text is read and is passed verbatim | F113-FR-007; F113-FR-002 (step 1) | 107 |
| T-11 | The host model reports a run wrongly | The skill reports an outcome only from a line of the CLI and prints the digest verbatim | F113-FR-003; F113-FR-012 | 123 |
| T-12 | Output of the product injects the host session | Command output is framed as data; a line that a host hook injects holds no repository text | F113-FR-017 | 119, 145 |
| T-43 | A malicious version is published | Publishing by the build only, from a protected branch, with an attestation; the plugin directory is never published apart from the package | F113-FR-042, which cites F100-FR-236 | 100 |
| T-44 | A dependency is compromised | No dependency at run time in the plugin layer, no install script, nothing compiled at install, no server of the model context protocol | F113-FR-030; F113-FR-031 | 100 |
| T-45 | An impostor package or plugin | The marketplace entry and the documentation name the exact package and version; the shim verifies the protocol integer | F113-FR-042; F113-FR-019 | — |
| T-46 | The host package installs the CLI silently | The shim and the doctor skill detect, report and print the command; they fetch, install and update nothing | F113-FR-018; F113-FR-015 | 112 |

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 011 FR-017 | Mode selection defaults to `generate` | DV-009 |
| 011 FR-025 | The onboarding script links the skill into named hosts | DV-056 |
| B-2642 to B-2660 (C-237 to C-243) | The onboarding script: options, environment, exit codes 1 to 7, link targets, output lines, collision scan, trust check | DV-056 |
| B-2665 (C-245) | A request without execution phrasing gets `generate` | DV-009 |

## Clarifications

### Session 2026-09-29

Answered from the sources. No question was put to a person.

- Q: Does `specstride-run` keep "silence is never consent"? → A: No. Invoking the skill is the consent; `dry-run` withholds it. (Source: constitution XV; DV-009)
- Q: Is the judgment exchange part of the protocol? → A: Yes, `specstride.judgment/1`, cited through annex G §G.9 (CQ-024 recommended answer). (Source: F100-FR-192)
- Q: Does the plugin ship a supervisor agent? → A: Not specified in Wave 1; supervision runs through `wait`. (Source: R17 budgets; brief 113 heading 4 names none)
- Q: Which way pushes alerts? → A: Any of a long-limit re-arming host hook or the monitor; correctness never depends on it. (Source: R3v C2)
- Q: How does the shim find the CLI? → A: An explicit variable, the search path, then the sibling package; never a fetch. (Source: R3 recommendation 1; R11 T-46)
- Q: Does the plugin use a user-configuration `options` field? → A: Not in the specification; the plan states any version floor. (Source: R3v P31)

- Q: Which command evaluates the launch checks for the guardrail host hook, given that annex G lists none without launching? → A: The plan assumes the CLI offers one; reported as a gap of feature 100. (Source: F100-FR-189)
- Q: Which tests prove the seven checks of the context-cost CI? → A: Requirement tests named CT-113-136 and CT-113-137. (Source: brief 113 heading 8)

### Session 2026-09-30

Answered after the cross-feature review. No question was put to a person.

- Q: The brief asks for a trigger suite on every pull request and for a nightly and a weekly paid run; Principle XII (NON-NEGOTIABLE) forbids a test or a job of the build that calls a paid or external model API. Which holds? → A: Principle XII holds. The suite, the smoke and the report are paid tasks that a person starts, logged; the suite is a release check that reads the log; the per-change build checks what needs no model call; the model comes from configuration. (Source: CQ-188, recommended answer, the orchestrator's reading; constitution v3.0.0, Principle XII; `assumption: CQ-188`)
- Q: Where does the model of a suite run come from? → A: From the configuration of the run, given by the person who starts it, and recorded in the log. No key of the product configuration is added: annex X §X.7 holds none for evals, and this feature invents none. (Source: Principle XII, "Model ids are configuration"; reported to the orchestrator)
- Q: Under which logical name are the two markers of the host kept? → A: Under none. Annex B §B.5 has no name for state in the data directory of a host, and a feature does not invent one (F100-FR-053). The markers are state of the host; nothing of the product reads them. (Source: annex B §B.5; review item W-113-02; reported)
- Q: Which requirement is the control of threat T-43 for the host package? → A: F100-FR-236, cited by F113-FR-042. (Source: `specs/100-specstride/repair-report.md`, row 31)
- Q: How large is the body of the doctor skill? → A: Feature 100 (annex G §G.5) and the brief give only the total of the doctor skill, 1,500 tokens. The allocation of R17 gives 800 tokens (2,240 bytes) for the body, and the plan keeps it as the upper limit. (Source: annex G §G.5; brief 113 heading 4; R17, table of allocations)

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements and success criteria changed in place, and requirements added.

| Id | Item | What changed |
|---|---|---|
| F113-FR-016 | W-113-02; W-X-16 | The marker is state of the host, read by nothing of the product; a missing marker prints the notice once more. Owner of row 34: 147 |
| F113-FR-017, -018, -022, -023, -025, -026, -027, -031, -033 | W-113-03 | "hook" written as "host hook"; no change of meaning |
| F113-FR-020 | W-113-03; W-X-32 | "host hook"; "a Node start" became "a start of the runtime platform" |
| F113-FR-021 | W-X-25; W-113-02; W-113-03 | Names the logical name `workspace:current:status-line`; the marker of the last injected state is state of the host |
| F113-FR-024 | W-113-03; W-X-25 | "host hook"; names the logical name `inbox:host-events:<launchId>` |
| F113-FR-037 | W-X-31; W-113-01 | "gates" became "checks"; none calls a model; the status names the inferred fact of the host cross-check |
| F113-FR-038 | W-113-01 (CQ-188) | No longer a check of each pull request: a paid task that a person starts, logged; a release check that reads the log |
| F113-FR-039 | W-113-01 (CQ-188) | The model comes from the configuration of the run and is in no suite file, test, check or rule |
| F113-FR-040 | W-113-01 (CQ-188) | No nightly and no weekly job: two paid tasks that a person starts, logged |
| F113-FR-041 | W-113-01 (CQ-188) | New: what the per-change build checks without a model call |
| F113-FR-042 | W-X-22; W-100-17 | New: publishing of the host package under F100-FR-236 (T-43), exact package and version (T-45) |
| F113-SC-001, F113-SC-003 | W-X-31; W-113-01 | "gate" became "check"; the per-change build makes 0 model calls |
| F113-SC-002 | W-113-01 (CQ-188) | Measured in a logged paid run; the model comes from configuration |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- The divergence register runs to DV-097; the queue ran to CQ-045 when the spec was written and runs to CQ-194 on 2026-09-30.
- Test names `CT-113-<100 + requirement number>` are new (CT-113-141 and CT-113-142 were added on 2026-09-30); CT-113-1 and CT-113-2 come from the traceability files.
- Host facts are pinned to Claude Code 2.1.284 (R3, verified locally 2026-09-29) and are otherwise `unverified`.
