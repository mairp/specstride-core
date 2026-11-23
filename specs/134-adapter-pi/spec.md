# Feature Specification: Adapter for pi

**Feature Branch**: `134-adapter-pi` (a label: Spec Kit creates no branch in this repository; the directory is `specs/134-adapter-pi`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 134-adapter-pi of Specstride: the harness adapter for pi, specified against the harness seam exactly as the Claude adapter is: a harness descriptor, optional code hooks and recorded fixtures. Detection and version pin; the proposer invocation, headless, with a JSONL stream and the prompt on standard input; continuation by a session id the runtime mints; the tool-less critic by flags and the proof of that mode; the row of pi in the dialect table of the JSONL reader it shares with prime; quota and error signals inside the stream; usage per message; the harness's own telemetry switched off; project-local resources left untrusted; the tier and terms rows gated by the back end in use, with the refusal of its Claude OAuth path; the containment ceiling C0; the adapter's doctor checks; the fixture captures that must happen before the specification freezes."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority: rulings 7, 32a, 32b, 34, 36, 37, 38, 59, 60, 67, P2), `architecture.md` (section 14), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 134-adapter-pi, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`, annexes A, B, C, E, G, X), feature 141 (`specs/141-parity-oracle/`, §O.1, §O.3, §O.7), research R9, R8v, R11, R14, R20, R24.

## What this feature is

pi is an agent CLI. It runs in a non-interactive print mode, reads its prompt from standard
input, and can write a JSON Lines stream of what it does. It has no sandbox, no permission mode
and no permission prompt: it acts with the permissions of the consumer who starts it. It belongs
to the same family of harnesses as prime, and its stream header declares the same schema version.

This feature is the harness adapter for pi. It is written against the harness seam of feature
100 (annex C §C.1 to §C.3) as the adapter for Claude is: one harness descriptor, code hooks only
where the descriptor cannot express a rule, and recorded fixtures. The adapter adds one row to
the dialect table of the JSONL reader that pi and prime share (annex C §C.5). It adds no branch
to the reader.

pi has no adapter in Specstride, in mixture-of-loops or in Lisa, and no registry entry at the
baselines. There is therefore no as-is behaviour to port and no parity test. The feature is in
Wave 1 by the owner's rulings 32a and 32b. Its requirements come from research, and its tests are
conformance tests, classifier fixtures and characterization tests (`CT-134-<n>`), as feature 141
§O.7 says.

**Provisional facts.** The flags, the stream and the documentation of pi were read from the
installed package on 2026-09-29. The product has never run the harness. Every fact that rests on
that reading, and every fact that rests on documentation only, is marked `unverified` in its
requirement, with the check that would verify it. Four fixture captures (F134-FR-027) settle the
facts that block the specification, and each is a first task of `tasks.md`.

**In scope**: detection and version pin; the descriptor of pi; auth by secret reference; the
tier and terms facts and the refusal of the Claude OAuth path; the containment ceiling and the
consent to run without containment; the proposer invocation; tool selection by allow-list;
continuation by a minted session id; the tool-less critic by flags and its proof; project-local
resources left untrusted; the row of pi in the dialect table; the classifier entries; the
terminal record; usage; the harness's own telemetry; the context window; the doctor checks of
the adapter; the recorded fixtures and the captures.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The port, the descriptor schema, the generic harness adapter, containment levels | 109 |
| The JSONL reader for stream schema version 3 and the schema of its dialect table | 138 (content owner), 100 (contract). This feature adds one row of data and the fixtures that prove it |
| The registry of stream readers; the normalized record set | 126 |
| What a quota class does to the run | 127 |
| The terms gate as policy; the rows of the providers | 147 |
| Discovery and the critic order | 124 |
| The RPC mode and the SDK of pi | Not in Wave 1 |
| Installing, vendoring, downloading or logging in to pi | Never done by the product |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer runs pi as proposer, having consented to no containment (Priority: P1)

A consumer has pi installed and an API key for a provider. They name pi as the proposer in
their own configuration and set the opt-in to run without containment. A run then works phase by
phase with pi as the proposer, and the run record says that protection is by detection only.

**Why this priority**: The harness has no sandbox. The consent is the one thing that separates
"the owner's ruling" from "the product acts on the consumer's machine without asking".

**Independent Test**: With a fake pi executable, launch a run with pi as proposer twice: once
without the opt-in, once with it. The first launch is refused before any pass, with the reason
and a doctor line. The second runs, and its run record says `protection=detect`.

**Acceptance Scenarios**:

1. **Given** pi as proposer and no opt-in to containment C0 in user configuration, **When** the consumer launches a run, **Then** the launch is refused with the reason and no pass starts (F134-FR-008).
2. **Given** the opt-in, **When** a pass starts, **Then** the invocation is headless, the prompt arrives on standard input, the tools are an allow-list and the working directory is stated (F134-FR-011, F134-FR-012).
3. **Given** the opt-in and a run that asks for parallel units, **When** `loop.parallel.allow_detect` is not set, **Then** parallel units stay off for pi with the reason stated (F134-FR-009).

---

### User Story 2 - pi is used as a critic that can take no action (Priority: P1)

A consumer names pi as the critic. Every critic call runs without tools, without skills, without
context files, without extensions, without prompt templates and without a session. Before the
reply is read, the adapter proves the mode from the stream.

**Why this priority**: Principle IX is non-negotiable. A critic that can act is not shipped.

**Independent Test**: Replay a recorded critic stream whose initial record shows the minted
session and an empty tool list: the call is accepted. Replay one whose tool list is not empty:
the call is refused with `critic_not_toolless` and the run halts with exit 3.

**Acceptance Scenarios**:

1. **Given** a critic call, **When** the process starts, **Then** its argument list holds the whole flag set of F134-FR-018 and no flag that allows a tool (F134-FR-018).
2. **Given** an initial record that lists a tool, **When** the adapter checks it, **Then** the call is refused with `critic_not_toolless` (F134-FR-019).
3. **Given** a stream that does not state the tool list, **When** the adapter checks it, **Then** the proof is the exact version pin, a passed preflight and the flag set in the call record, recorded as the weaker proof (F134-FR-019).
4. **Given** a phase attempt with passes and a critic call, **When** the records are read, **Then** no critic call carries a session id that a pass used (F134-FR-020).

---

### User Story 3 - The subscription path of a Claude login is refused (Priority: P1)

pi can log in to a Claude subscription by OAuth. Under the terms data that path is auth tier 3
and ships refused. A configuration that names it is refused with the explanation, for both
audiences, and the adapter never starts a login.

**Why this priority**: Constitution XII. The consumer's subscription account is at stake.

**Independent Test**: Configure pi with the OAuth path of a Claude subscription. The terms gate
refuses at launch with the Tier 3 explanation. No process of pi is started.

**Acceptance Scenarios**:

1. **Given** a configuration whose provider is the Claude subscription login of pi, **When** the terms gate evaluates it for `personal` and for `distributed`, **Then** both are refused with the explanation (F134-FR-006).
2. **Given** any run, **When** the adapter has started a pi process, **Then** no login command was among the calls (F134-FR-007).

---

### User Story 4 - The stream of pi and the stream of prime pass one reader (Priority: P2)

A maintainer adds a harness of the same family and expects a row of data, not code. The streams
of pi and prime pass the same reader, and the one difference between the two configurations is
the row of the dialect table.

**Why this priority**: The owner ruled that pi and prime share one reader (ruling 32b).

**Independent Test**: Replay the recorded stream of a pi proposer pass and of a pi critic call
through the reader with the dialect `pi`; replay a prime stream with the dialect `prime`. All
pass. Remove the row of pi: the streams of pi are refused.

**Acceptance Scenarios**:

1. **Given** a recorded pi stream, **When** the reader runs with the dialect `pi`, **Then** it yields only the six normalized records (F134-FR-023).
2. **Given** a stream whose session header declares a version other than 3, **When** the reader runs, **Then** it ends in the reader's terminal for an unsupported schema (F134-FR-023).
3. **Given** a stream that ends without a terminal record, **When** the reader runs, **Then** the call is reported as `missing_terminal` (F134-FR-023).

---

### User Story 5 - A provider limit makes a run wait and does not count as an error (Priority: P2)

pi reports a provider error inside its stream, after its own retries. The adapter turns the
message text into a class of the quota classifier and parses a reset time where the text has
one. A limit whose delay is above pi's own cap fails at once, which makes the limit visible
without a stall.

**Why this priority**: Decision 8. A run that counts a limit as an error burns its budget.

**Independent Test**: Feed the classifier the fixture of an error message with a reset time and
the fixture of one without. The first gives a quota class with `resetsAt`; the second gives the
same class with `resetsAt` null.

**Acceptance Scenarios**:

1. **Given** an assistant message with stop reason `error` and the text "reset after 5h", **When** the classifier reads it, **Then** the class is a quota class, the confidence is `text` and `resetsAt` is five hours after the message (F134-FR-024).
2. **Given** the same message without a reset time, **When** the classifier reads it, **Then** `resetsAt` is null (F134-FR-024).

---

### Edge Cases

- pi exits 0 on a provider error. The terminal record decides, not the exit code (F134-FR-025).
- pi exits non-zero on a provider error. The outcome is the same; the adapter does not depend on the exit code (F134-FR-025).
- The installed version is outside the pin. The doctor warns, the run records the version, and a change of version between passes is a warning (F134-FR-003).
- The model has no known context window. No default is used; a critic on it is not offered (F134-FR-022).
- The consumer's configuration home of pi holds project trust settings that trust project-local resources. The adapter still passes the explicit ignore setting for both roles (F134-FR-017).
- The session header of a call in which no session is kept carries no id that equals the minted one. The identity part of the proof cannot be made; the weaker proof applies and is recorded (F134-FR-019).
- The provider has no row in the terms data. The terms are unknown: usable when the consumer names pi and the provider, with the warning; never a default and never picked automatically (F134-FR-005).

## Requirements *(mandatory)*

Groups G1 to G4 are those of heading 7 of the brief. Every requirement has a characterization
test `CT-134-<n>`, or is proven by the conformance suite named in it. No parity test exists
(feature 141 §O.7). No requirement has an `origin:`.

### Functional Requirements

#### G1 — Detection, version pin, descriptor, tier and terms, Tier 3 refusal, doctor

- **F134-FR-001**: The adapter for pi MUST be a harness descriptor of kind `cli` with the id `pi`, the stream format `jsonl` and the dialect `pi`, plus code hooks only where the descriptor cannot express a rule. It MUST be a new entry of the open registry, in the state `tested`, with the origin `adapter`. No other entry of the registry MUST change, and no code of the core MUST name it.
  - test: CT-134-1
  - divergence: DV-064
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-002**: Detection MUST be free of charge: the executable is resolved to an absolute path, its version is read by the harness's own version option, and its help text must hold what the descriptor names. Detection MUST make no model call and MUST read no credential. The product MUST never install, vendor or download pi.
  - test: CT-134-2
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: `command -v`, the version option and the help text of the installed pi match the descriptor on Linux and on macOS; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-003**: The descriptor MUST carry the version range `>=0.80.6 <0.81` with `verifiedOn` 2026-09-29, marked provisional until the first fixture capture confirms it. Every pass MUST record the version of pi that ran. The doctor MUST warn when the installed version is outside the range, and a change of version between passes of one run MUST be a warning.
  - test: CT-134-3
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the fixture capture of F134-FR-027 runs the pinned version end to end; verified-on: —; pin: `>=0.80.6 <0.81` read from the installed package on 2026-09-29, never run)

- **F134-FR-004**: Auth MUST be by a provider API key that a secret reference names. The adapter MUST hand the resolved value to the process by environment and never by argument. It MUST read no auth file of pi, open no credential store of pi and start no login. `preflight` MUST report whether the credential of the role is present, without a paid call. A missing credential MUST fail before the first pass and name what is missing.
  - test: CT-134-4
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-005**: The adapter MUST supply the facts of the terms rows of pi: the software is `ALLOWED-DOCUMENTED` with API-key providers, and pi is a front harness. The decision MUST be that of the row of the provider, which the terms gate evaluates for the provider and the model in use at launch, at role resolution and at every switch to a fallback. When the consumer has not stated the provider, or the provider has no row, the terms MUST be unknown: usable when the consumer names pi, with the unknown-terms warning, never a default and never picked automatically. This is the rule of feature 147 for a provider without a row (F147-FR-008); ruling P14 names dsh and prime and not pi, and pi itself has no row of its own (F147-FR-011).
  - test: CT-134-5
  - ep: EP-11 `specstride.terms/1` (consumes)
  - status: unverified (check: the licence and the login text of the installed package are re-read and the rows are dated in the terms data; verified-on: 2026-09-29 for R8v rows 37 and 38 against the documentation of pi only; pin: `>=0.80.6 <0.81`)

- **F134-FR-006**: The OAuth login of pi for a Claude subscription MUST be auth tier 3 and MUST be refused for both audiences, with the explanation that tier 3 ships refused. The same MUST hold for every login of pi that reuses the subscription token of a provider whose row says so. `auth.tiers` of the descriptor MUST NOT list 3. A configuration that names such a path MUST be refused by the terms gate at launch, and no process of pi MUST be started for it.
  - test: CT-134-6
  - ep: EP-11 `specstride.terms/1` (consumes)
  - status: unverified (check: the terms of the provider, re-read; verified-on: 2026-09-29 for R8v rows 39 and 40 against the documentation of pi and of the provider; pin: `>=0.80.6 <0.81`)

- **F134-FR-007**: The adapter MUST never start a login of pi, never write the auth file of pi, and never set or change the trust of a project. An installed plugin, extension or login is never a consent of the consumer to a call.
  - test: CT-134-7
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-008**: The descriptor MUST declare the containment ceiling C0 with the provenance `adapter`: pi has no sandbox, no permission mode and no permission prompt, and runs with the permissions of the consumer. A launch that names pi as proposer without the opt-in to C0 MUST be refused, with the reason and a doctor line, and no pass MUST start. The opt-in to C0 is accepted from the user configuration only: never from the environment, never from a flag and never from project configuration (`assumption: CQ-183`). With the opt-in, the run record MUST say `protection=detect`, and the level, the opt-in and the protection MUST be announced and recorded for the run.
  - test: CT-134-8
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the permission and containment settings as at the baseline: none (rows 25, 26 of annex X §X.7)
  - status: unverified (check: pi in print mode neither prompts nor confines its file tools, tested with a fake write outside the working tree; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-009**: Parallel units MUST stay off for pi as proposer unless the consumer set `loop.parallel.allow_detect` in the user configuration only, never in the environment and never as a flag (`assumption: CQ-183`). The reason MUST be stated when the option is off, and the run MUST say `protection=detect` when it is on. The adapter MUST declare `concurrentSessions` as null until a capture shows whether several headless processes of pi may run under one configuration home.
  - test: CT-134-9
  - divergence: DV-080
  - parity: off (rows 20, 23 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: two headless processes of pi under one home keep separate session stores; verified-on: —; pin: pi version of the capture)

- **F134-FR-010**: The adapter MUST register the checks of pi with the doctor: the executable and its version range; the presence of the credential reference, never its value; the containment ceiling C0 and whether the opt-in is set; and the two settings that keep project-local resources untrusted. A check MUST read and never write, make no paid call, open no credential store and keep to the time limit and the output cap of the doctor. The ids proposed are `harness.pi.executable`, `harness.pi.version`, `harness.pi.credential`, `harness.pi.containment`, `harness.pi.project-trust`.
  - test: CT-134-10
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))
  - assumption: CQ-108 (the doctor's ids of harness checks are owned by feature 112; the five ids are proposals)

#### G2 — Proposer: invocation, tool allow-list, continuation, home, telemetry

- **F134-FR-011**: pi as proposer MUST run headless: print mode with the JSON output mode, the prompt on standard input and never as an argument, the working directory stated, no wait for a human, and a process group of its own. The environment MUST be an allow-list: the search path, the locale, the home or its overlay, the variable that carries the API key of the role, and what `isolation.envAllow` of the descriptor names. The credentials of the critic MUST never be in the environment of the proposer.
  - test: CT-134-11
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-012**: Tools of pi as proposer MUST be selected by an allow-list that the descriptor holds, and never by a deny list. A tool that a later version of pi adds MUST be off until the descriptor lists it. The allow-list MUST be stated in the invocation record of the pass.
  - test: CT-134-12
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the invocation with the allow-list runs the listed tools and no other, on the captured stream; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-013**: Continuation MUST be by the exact session id that the runtime minted for the phase attempt, and never by "the most recent" session. The descriptor MUST declare continuation as supported, with the provenance `adapter` and the status `unverified`, and MUST state how an id is given. The session directory MUST be one per phase attempt and MUST be removed when the phase attempt ends. Where a session cannot be continued, context MUST be carried through files.
  - test: CT-134-13
  - divergence: DV-010
  - parity: off: no invocation carries a continuation argument (row 10 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the option that gives an exact session id works together with print mode and the JSON output mode, and a second pass under the same id continues; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-014**: A pass that cannot continue, a new phase attempt, a relaunch, a kill by a watchdog, the second repair of a unit, an escalation, a change of configuration, and every critic-class call MUST start a fresh session. A fresh pass that no later pass of its phase attempt will continue MUST run with no session kept. The first pass of a phase attempt in which continuation is on MUST keep its session under the id minted for the attempt, so that a later pass can continue it. Under the `parity` profile every pass MUST run with no session kept.
  - test: CT-134-14
  - divergence: DV-010
  - parity: off (row 10 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-109 (the sources say "run without a session" for these cases and also that the first pass must leave a session to continue; this reading keeps a session only where a continuation can follow)

- **F134-FR-015**: The call MUST use the home that annex C §C.16 and F100-FR-113 give for the auth tier: the real home, never written by the run, at auth tier 1; a throwaway home built from an overlay at auth tier 2. The overlay MUST redirect the agent directory and the session directory of pi, MUST seed no credential, and MUST be removed after the call, a killed pass included. The API key MUST reach pi by environment only, so that no auth file is copied between homes.
  - test: CT-134-15
  - divergence: DV-002
  - parity: overlay scope `none` (row 30 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-016**: The harness's own telemetry and its update check MUST be switched off for every process the adapter starts, in both roles, through the variables and flags that the descriptor and the dialect row name. The adapter MUST NOT depend on the switch for correctness: a launched process that ignores it MUST still be handled.
  - test: CT-134-16
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: a captured run with the switches set makes no request to any address but the provider's; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-029**: Auto-loaded context of pi (extensions, skills, context files, prompt templates) MUST be off for the proposer by default, with an opt-in in user configuration under the key `harnesses.<id>.proposerCustomisations` (row 131 of annex X §X.7; for pi, `harnesses.pi.proposerCustomisations`), and the setting MUST be recorded per run. Harness-native memory MUST be off for the proposer by default, with the same opt-in. The opt-in MUST be of the trust class widening and MUST be ignored in project configuration.
  - test: CT-134-29
  - divergence: DV-047
  - parity: no flag about memory or customisations is passed (rows 29 and 131 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the captured invocation loads none of the four kinds of resource and the initial record shows none; verified-on: 2026-09-29 for the help text only; pin: `>=0.80.6 <0.81`)

#### G3 — Critic: the flag set, the proof, untrusted project resources, the context window

- **F134-FR-017**: Project-local resources of pi (extensions, skills, context files, prompt templates and settings that a project holds) MUST NOT be trusted for either role. The adapter MUST never pass the approval option, MUST never set project trust, and MUST pass the explicit setting that ignores project-local resources where the pinned version offers it. In print mode pi ignores them by default; the adapter MUST NOT rely on that default alone.
  - test: CT-134-17
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: a fake project-local resource is not loaded in print mode with and without the explicit setting; verified-on: 2026-09-29 for the documentation of pi only; pin: `>=0.80.6 <0.81`)

- **F134-FR-018**: A critic-class call on pi MUST be tool-less by flags: no tools, no skills, no context files, no extensions, no prompt templates, no session, print mode, the JSON output mode and the prompt on standard input, in an empty working directory. `roles` of the descriptor MUST declare `toolless: flag`. No critic path MUST ever receive a flag that allows a tool or a bypass. Harness-native memory and context files MUST be off for every critic call, and the setting MUST be recorded.
  - test: CT-134-18
  - divergence: DV-047
  - parity: the critic of each harness in its as-is transport and mode; no flag about memory or customisations is passed (rows 28, 29 and 131 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: one logged live call per role runs the flag set and the initial record shows the mode; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-019**: The adapter MUST accept a critic call only if the initial record of the stream shows the identity that the adapter minted for the call and, where the stream states it, an empty tool list. If the stream does not state the tool list, the proof MUST be the weaker proof of Principle IX and F109-FR-038: the installed version equals the exact version pin of the tested adapter (the version of the fixture capture, not only a version inside the range of F134-FR-003), the preflight of the adapter passed, and the call record holds the flag set of F134-FR-018; it MUST be recorded as the weaker proof, with the pin and the flag set, for every call that rests on it. A proof that fails MUST end the call with `critic_not_toolless`, which halts the run with exit 3 and the stop reason `critic_config`. The result of the proof MUST be recorded for every critic call.
  - test: CT-134-19
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-110 (whether the initial record of a call in which no session is kept carries an identity that the adapter can compare; capture 3 and 4 decide it. If it carries none, the weaker proof applies to that part); CQ-182 (closed 2026-09-30 by the owner: the weaker proof is allowed for a tested harness adapter and recorded on every call; Principle IX v3.0.1 names it for a stream with no initial record; the plan records the remaining case, an initial record that states no tool list, in Complexity Tracking)
  - status: unverified (check: the initial record of a critic call is captured and states or does not state the tool list and the identity; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-020**: A critic call MUST never share a session with a pass. The identity of the critic call MUST be minted apart from every pass, and no critic call record MUST carry a session id that a pass of the run used.
  - test: CT-134-20
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-021**: The descriptor MUST declare that pi offers the critic form `tool-less` only, and MUST declare `readOnlyTools` as not supported, although pi has a read-only tool selection. That selection is not a sandbox of the operating system, so the second form of annex C §C.3 is never used with pi. pi MUST be picked automatically as a critic only as a tested adapter and only where the row of its provider allows it; an automatic pick on a metered provider MUST carry the hard spending cap of F100-FR-093, and a provider whose terms are unknown MUST never be picked automatically.
  - test: CT-134-21
  - ep: EP-02 `specstride.harness/1` (implements)
  - ep: EP-11 `specstride.terms/1` (consumes)

- **F134-FR-022**: The context window MUST be read from the model list of pi or declared in the descriptor or by the consumer. The window in use MUST be the smaller of the declared and the effective value. For a model with no known window there MUST be no default, and pi MUST NOT be offered as critic on that model.
  - test: CT-134-22
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the model list prints a context column for the models in use and the value equals the effective window; verified-on: 2026-09-29 for the printed list on one machine; pin: `>=0.80.6 <0.81`)

- **F134-FR-030**: The critic-diversity rule and its warning are those of feature 100 (F100-FR-024) and of feature 124 (F124-FR-045): pi as the critic on the same model as the proposer (the result `same-model` of the diversity test), or pi as the critic where the diversity test gives `unverified`, MUST raise the critic-diversity warning and record it, and the warning MUST NOT block a run. A shared provider alone and a shared model tier alone MUST NOT raise it. The provider and the model of every pi call MUST be recorded so that the diversity test can compare them. The unknown-terms rule of F134-FR-005 stands beside this: pi is never picked automatically as critic while its terms are unknown.
  - test: CT-134-30
  - ep: EP-02 `specstride.harness/1` (implements)

#### G4 — Dialect row, terminal record, quota signals, usage, fixtures

- **F134-FR-023**: The adapter MUST add one row to the dialect table for the dialect `pi`, with the accepted session-header version 3, the literal by which the stream names its provider format, the variables and flags that switch telemetry off, the variables and flags that name a session directory and continue by id, the record types of pi beyond the common ones (the retry records and the compaction records) with the normalized kind each maps to or `ignore`, the names under which pi reports input, output, cache and reasoning tokens, and `terminalDecides: true`. Where pi and prime differ, the difference MUST be a row of the table and never a branch in the reader. A stream whose session header names a version other than 3 MUST end in the terminal of the reader for an unsupported schema, and a stream that ends without a terminal record MUST be reported as `missing_terminal`.
  - test: CT-134-23
  - divergence: DV-090
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the recorded stream of a pi proposer pass and of a pi critic call pass the reader with the dialect `pi`; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-024**: The classifier entries of pi MUST read a provider error that arrives as an assistant message with the stop reason `error` and a message text, after the retry records, and MUST give the class from the text. A reset time in the text MUST be parsed into `resetsAt`; without one, `resetsAt` MUST be null. The confidence MUST be `text`, so that a pause follows only a confirming probe. A server-requested delay above the cap of pi fails at once with the provider's text, and the adapter MUST classify that text like any other. An input that matches no entry MUST be `provider_other`. The classifier MUST be a pure table: no I/O, no clock, no model.
  - test: CT-134-24
  - divergence: DV-005
  - parity: not observable: the stub agents emit no quota signal (row 39 of annex X §X.7)
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - status: unverified (check: the wording of a real provider error, with and without a reset time, is captured; verified-on: 2026-09-29 for the documentation of pi only; pin: `>=0.80.6 <0.81`)

- **F134-FR-025**: The terminal record MUST decide the outcome of a call, as for prime. The adapter MUST NOT depend on the exit code of pi on a provider error. The exit code MUST be captured in a fixture.
  - test: CT-134-25
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the exit code of pi on a provider error is captured in a fixture; verified-on: —; pin: pi version of the fixture capture)

- **F134-FR-026**: Usage MUST be read from the stream per message and reported as increments. Cost MUST be null where the stream gives none, and the model name MUST be no more than the invocation specified. The cost class of the descriptor MUST be `unknown` unless the consumer states another. Cost of a subscription MUST never be presented as spend.
  - test: CT-134-26
  - ep: EP-02 `specstride.harness/1` (implements)

- **F134-FR-027**: The four fixture captures MUST be done before the specification freezes, each as a scripted capture or one small call that only an explicitly authorized probe may make, and each logged: (1) the exit code on a provider error; (2) one recorded stream of a proposer pass and one of a critic call, to confirm that the shared reader accepts them; (3) whether the initial record states the tool list; (4) whether the exact-session-id option works in print mode with the JSON output mode. A paid probe MUST say so in its task, and one logged probe per role MUST be the only paid call of the feature. Each fact of the descriptor MUST carry a `verified-on` date and the version pin, or the mark `unverified`.
  - test: CT-134-27
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the four captures are on disk with their logs; verified-on: —; pin: pi version of the captures)

- **F134-FR-028**: The adapter MUST pass the conformance suite of the harness port with a fake executable, which asserts the argument list, standard input, the environment and the clean-up, and MUST pass the conformance suite of the shared reader with the dialect `pi` on the recorded streams. Classifier fixtures MUST cover an error message with a reset time and one without. No test of the feature MUST call a paid or external model API.
  - test: CT-134-28
  - ep: EP-02 `specstride.harness/1` (implements)
  - ep: EP-12 `specstride.quota-classifier/1` (implements)

### Key Entities

- **Harness descriptor of pi**: the data record of kind `cli`, id `pi`, with its version range, ceiling, roles, invocation, continuation, failures map, telemetry switch and isolation. Provenance of each capability is declared, adapter or probed.
- **Dialect row `pi`**: one row of the dialect table of the JSONL reader, shared with prime.
- **Classifier entries of pi**: the table from message text to a quota class, with the reset time parsed.
- **Recorded fixtures of pi**: streams of a proposer pass and of a critic call, an error message with and without a reset time, and the captured exit code, each with its pin and date.
- **Proof record of a critic call**: the identity minted, the tool list where stated, and whether the proof is the initial record or the weaker one.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F134-SC-001**: One reader, two harnesses: the recorded streams of pi and of prime pass the same reader, 100 per cent of them, and the only difference between the two configurations is the dialect row: 0 lines of the reader differ between them.
  - test: CT-134-101
- **F134-SC-002**: Tier 3 is refused: over every configuration of the tests that names the OAuth path of a Claude subscription or another subscription login of pi, 100 per cent are refused by the terms gate with the explanation, and 0 processes of pi start.
  - test: CT-134-102
- **F134-SC-003**: The critic never shares the proposer's session: over all recorded runs, 0 critic call records carry a session id that a pass used.
  - test: CT-134-103
- **F134-SC-004**: Provider and harness facts are dated: 100 per cent of the facts of the descriptor, of the dialect row and of the classifier entries carry a `verified-on` date and the version pin, or the mark `unverified` with its check.
  - test: CT-134-104
- **F134-SC-005**: No launch without consent: over all launches of the tests with pi as proposer and no opt-in to C0, 100 per cent are refused with the reason and the doctor line, and 0 passes start.
  - test: CT-134-105
- **F134-SC-006**: Conformance without spend: the adapter passes the conformance suite of the port, the conformance suite of the reader with the dialect `pi`, and the classifier fixtures, with 0 paid or external calls.
  - test: CT-134-106
- **F134-SC-007**: The captures are done: at the freeze, 4 of the 4 captures of F134-FR-027 are on disk with their logs, and each of the facts they settle is either dated or still marked `unverified` with the reason.
  - test: CT-134-107

## Constraints

Owner-set constraints, from heading 11 of the brief.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every macOS statement is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| The adapter is specified against the harness seam exactly as the Claude adapter is: descriptor, optional code hooks, recorded fixtures | `architecture.md` section 14; roadmap |
| pi and prime share one JSONL reader with a dialect table | Ruling 32b |
| The product never installs, vendors or downloads the harness, and never logs in to it | Constitution, additional constraints; BRIEF-COMMON safety rules |

## Extension points

This feature owns no extension point. Versions are those of feature 100, annex A §A.4.

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements (a harness adapter) | The descriptor of pi, its code hooks, its row of the dialect table (sub-point stream readers, `specstride.stream-dialect/1`) and its recorded fixtures |
| EP-12 | `specstride.quota-classifier/1` | implements (the entries of one harness) | The classifier entries of pi, in the `failures` map and in code where the map cannot say it |
| EP-10 | `specstride.secret-resolver/1` | consumes | The API key is a secret reference, resolved at the moment of use |
| EP-11 | `specstride.terms/1` | consumes | The adapter supplies the facts of its rows; the decision is that of the provider's row |
| EP-14 | `specstride.doctor/1` | implements (an entry) | Registers the checks of the adapter |

## Contracts of feature 100 used

| Contract | Annex and section | Requirements of feature 100 |
|---|---|---|
| No closed list of harnesses | A §A.5 | F100-FR-023 |
| Common rules of extension points | A §A.4 | F100-FR-013 to F100-FR-021 |
| Logical names `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:session`, `attempt:<N>:<k>:<n>:critic-invocation`, `overlay:<id>:tree`, `pass:<passId>:provider-terminal`, `pass:<passId>:producer-status` | B §B.5 | F100-FR-053 |
| Harness port (EP-02) | C §C.1 | F100-FR-076 to F100-FR-083 |
| Harness descriptor | C §C.2 | F100-FR-084 to F100-FR-086 |
| Forms of the `completion` level | C §C.3 | F100-FR-087, F100-FR-088 |
| Stream readers; dialect table | C §C.5 | F100-FR-090, F100-FR-091 |
| Resolved registry and role plan; critic order | C §C.6 | F100-FR-092, F100-FR-093 |
| Secret resolver (EP-10) | C §C.11 | F100-FR-107 |
| Terms-gate data (EP-11) | C §C.12 | F100-FR-108 |
| Quota classifier (EP-12) | C §C.13 | F100-FR-109 |
| Containment levels | C §C.15 | F100-FR-111, F100-FR-112 |
| Overlay schema | C §C.16 | F100-FR-113 |
| Engine exit codes; stop reason `critic_config` | E §E.3, §E.4 | F100-FR-151, F100-FR-153 |
| Doctor check registry (EP-14) | G §G.7 | — |
| Event envelope | X §X.1 | F100-FR-198, F100-FR-200 |
| Config envelope and trust classes | X §X.2 | F100-FR-201, F100-FR-202 |
| List of closed sets, rows 26, 28, 29, 33, 36, 38, 39, 43, 46, 47 | X §X.6 | F100-FR-208 |
| The `parity` profile, rows 10, 20, 23, 25, 26, 28, 29, 30, 39, 131 | X §X.7 | F100-FR-210, F100-FR-212 |
| The critic-diversity rule and its warning | A §A.5; applied by the engine as E §E.1 says | F100-FR-024 |
| Threats T-07, T-13 to T-16, T-34, T-35 | X §X.9 | F100-FR-216, F100-FR-218 |

Fixture families of feature 141 cited: none as a parity fixture (§O.7). Used: the pi stub and the
generic stub `stub-harness` (§O.3, F141-FR-010, port side only); the surfaces `exit`, `stdout`,
`stderr`, `events`, `transcript`, `home` (§O.4) in the conformance suite; §O.7, F141-FR-028.

## Rows of the `parity` profile

Stated as F100-FR-212 asks. This feature introduces no switch and adds no row. It uses the rows
below, which other features own, and states its value under each.

| Row | Switch | Key (as annex X §X.7 proposes) | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 10 | Session continuation inside a phase attempt | `carry.continuation` | on, where the harness supports it | off | DV-010 | F134-FR-013, F134-FR-014 |
| 20, 23 | Parallel units; parallel units at detection only | `loop.parallel.units`, `loop.parallel.allow_detect` | off | off | DV-080 | F134-FR-009 |
| 25, 26 | Containment level; permission mode | `sandbox.level`, `sandbox.permissionMode` | The strongest the harness offers (C0 for pi, by opt-in); pi has no permission mode | As at the baseline: none | DV-030; DV-031 | F134-FR-008 |
| 28 | Transport and mode of the critic | `roles.critic.transport` | The harness CLI without tools | The as-is transport and mode (none exists for pi) | DV-001; DV-081; DV-090 | F134-FR-018 |
| 29 | Harness-native memory | `memory.native.proposer` | Off for the critic always; off for the proposer | No flag about memory is passed | DV-047 | F134-FR-018, F134-FR-029 |
| 131 | Proposer customisations (auto-loaded context) | `harnesses.<id>.proposerCustomisations` | Off; never loaded into a critic-class call | No flag about customisations is passed | DV-047; DV-002 | F134-FR-029 |
| 30 | Overlay of the configuration home | — (follows the auth tier) | Real home at Tier 1, throwaway home at Tier 2 | Overlay scope `none` | DV-002 | F134-FR-015 |
| 39 | Quota pause | `pause.maxTotalMs` | On; ceiling 24 hours | Not reached | DV-005 | F134-FR-024 |

Settings of this feature that are not switches. Feature 110 owns the spelling.

| Setting | Key | Source of the spelling | Value under `parity` |
|---|---|---|---|
| Executable of pi | `harnesses.pi.bin` | Environment alias table of annex X §X.8, as feature 109 uses it | As the fixture sets it |
| Opt-in to containment C0 | `sandbox.level` with the value `C0`, in user configuration | Row 25 | Follows row 25 |
| Opt-in for the auto-loaded context of pi | `harnesses.pi.proposerCustomisations` | Row 131 of annex X §X.7 (feature 100); 110 owns the spelling | Unset (off) |
| Window of a model, when the consumer declares it | `harnesses.pi.contextWindows`, the generic `harnesses.<id>.contextWindows` with id `pi` (a map from model id to tokens) | Confirmed by feature 110 | Unset |

Row needed and not present in annex X §X.7: none. The key `harnesses.pi.contextWindows` is
confirmed by feature 110.

## Closed sets

Stated as F100-FR-208 asks. This feature owns no closed set. Rows of annex X §X.6 that it reads,
and what it does with an unknown value:

| Row | Set | This feature's behaviour on an unknown value |
|---|---|---|
| 26 | Containment levels | The ceiling of pi is C0; an unknown level in configuration is read as C0 |
| 28 | Forms of the `completion` level | Only `tool-less` is offered; an unknown form is `critic_not_toolless` |
| 33 | Provenance of a capability | An unknown provenance reads as null |
| 36 | Typed failures of the harness port | An unknown failure is `agent_failure` |
| 38 | Kinds of normalized stream record | An unknown record type of pi is `ignore` in the dialect row, or the record is dropped with a diagnostic event |
| 39 | Dialects of the JSONL reader | The row `pi` is one member; a stream with no row is refused |
| 43 | Cost classes | `unknown` |
| 46, 47 | Quota classes; confidence | An unknown class reads as `provider_other`; an unknown confidence as `text` |

## As-is behaviour not carried

The traceability files assign no as-is requirement, success criterion, cluster or behaviour item
to this feature (`traceability.md` section 4.2). There are no rows with `superseded-by` or
`dropped`. The baseline states that no entry named `pi` exists (B-0425); that item belongs to
feature 109 and is superseded by DV-064, which this feature cites as the register row for a new
entry of the open registry.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| — | none assigned to this feature | DV-064 (cited by F134-FR-001) |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Which tier does pi with a provider API key sit at, given that R8v rows 37 and 38 list it at tier 1 and the constitution puts an API key at tier 2? → A: The descriptor offers tiers 1 and 2. The call follows the home rule of the tier, and the terms decision is that of the provider's row. The adapter adds no tier rule of its own. Integrated in F134-FR-005 and F134-FR-015. (Source: R8v rows 37, 38; constitution XII; annex C §C.12, §C.16)
- Q: Is the read-only tool selection of pi the second form of the critic (read-only tools in a sandbox)? → A: No. It is a tool allow-list, not a sandbox of the operating system, and the second form needs one. Only `tool-less` is offered. Integrated in F134-FR-021. (Source: annex C §C.3; R9 F8; R11 F-27)
- Q: May pi be the critic picked automatically? → A: Only as a tested adapter and only where the provider's row allows it; a provider with an unknown row is never picked; a metered provider needs the hard cap. Integrated in F134-FR-021. (Source: ruling 60; F100-FR-093)
- Q: Does a proposer on pi need the opt-in to C0? → A: Yes, and without it the launch is refused with the reason and a doctor line. Parallel units stay off unless `loop.parallel.allow_detect` is set. Integrated in F134-FR-008 and F134-FR-009. (Source: rulings 34, 38, P2; F100-FR-111, F100-FR-112)
- Q: Does the adapter depend on pi's exit code on a provider error? → A: No. The terminal record decides, as for prime; the code is captured in a fixture. Integrated in F134-FR-025. (Source: R9 F14, open question 3; ruling 32b "To apply")
- Q: Which cases start a fresh session on pi? → A: The list of F100-FR-083. Where no later pass will continue, no session is kept. Recorded as an assumption in F134-FR-014. (Source: decision 22; rulings 7, 36; F100-FR-083)
- Q: What is the proof of the critic mode when the stream does not state the tool list? → A: The flag set in the call record with the exact version pin, recorded as the weaker proof. Integrated in F134-FR-019. (Source: annex C §C.3; brief 134, heading 4)
- Q: Is the OAuth login for a Claude subscription usable if the consumer sets `personal`? → A: No. Tier 3 ships refused for every provider and both audiences. Integrated in F134-FR-006. (Source: ruling 59; R8v rows 39, 40; F100-FR-108)
- Q: Are project-local resources of pi trusted in print mode? → A: No. The adapter passes the explicit ignore setting and never the approval option. Integrated in F134-FR-017. (Source: R9 F9; R11 F-27; Principle III)
- Q: Are the customisations of pi (extensions, skills, context files, prompt templates) and its native memory on for the proposer? → A: Off by default, with an opt-in in user configuration recorded per run; always off for the critic. Integrated in F134-FR-018 and F134-FR-029. (Source: Principle VIII; ruling 37; F100-FR-082)
- Q: Where does the file layout of the descriptor live, and which logical name does a bundled descriptor have? → A: A bundled descriptor is data of the package, under the logical name `package:harness:<id>` of annex B §B.5. This feature uses no name that annex B lacks. (Source: annex B §B.5, F100-FR-053)
- Q: Which cache lifetime applies to a session of pi? → A: The one the descriptor's continuation record declares, with 300 seconds where none is declared (CQ-068 proposes this); the value for pi is a plan datum. (Source: CQ-068; R24)
- Q: How many rows does the divergence register have? → A: 117 today, DV-001 to DV-117 (count taken on 2026-09-30); none is needed by this feature. (Source: `consolidation.md` section 6)
- Q: Which questions could the sources not answer? → A: Three, listed under "Assumptions".

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The seam (109), the stream readers (126), the reader and its dialect table (138), role resolution (124), the secret resolvers (110) and the terms gate (147), the quota classifier (127) and the doctor (112) exist when the adapter uses them. Each is reached through its interface contract of feature 100.
- The exact flags and variables of pi are `plan.md` matter, with their version pin. This specification names none.
- The four captures and the two logged probes of F134-FR-027 are run by the person who authorizes them. This feature runs none.

Readings that the sources do not settle. Each is marked in its requirement.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-108 | Who fixes the ids of the doctor checks of a harness adapter? | The five ids of F134-FR-010, proposed, in the form `harness.<id>.<subject>`; feature 112 confirms or renames them before the doctor's catalogue freezes | F134-FR-010 |
| CQ-109 | The brief says every fresh pass runs without a session, and also that a session is minted per phase attempt and continued by id | A fresh pass keeps no session unless a later pass of its phase attempt can continue it. The first pass of such a phase attempt keeps its session under the minted id | F134-FR-014 |
| CQ-110 | The brief says the proof of the critic mode needs "the session it minted", and also that the critic runs with no session | The minted identity is compared where the initial record of a no-session call carries one; where it carries none, the weaker proof applies and is recorded. Captures 3 and 4 decide which case holds | F134-FR-019 |

## Repairs after the cross-feature review

Dated 2026-09-30. Item ids are those of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`; "B-8.7" is the re-check after the repairs. No id was renumbered or reused.

| Requirement | Item | What changed |
|---|---|---|
| F134-FR-005 | W-134-01 | "back end" became "provider" |
| F134-FR-008 | W-110-05 | The opt-in to C0 is accepted from the user configuration only (`assumption: CQ-183`) |
| F134-FR-009 | W-100-23 | `loop.parallel.allow_detect` is accepted from the user configuration only (`assumption: CQ-183`) |
| F134-FR-010 | W-X-19 | `ep: EP-14` reads `implements (an entry)` |
| F134-FR-021 | W-134-01 | "back end" became "provider" |
| F134-FR-029 | W-110-09 | The opt-in key `harnesses.<id>.proposerCustomisations` (row 131 of annex X §X.7) is named; the `parity` lines cite rows 29 and 131 |
| F134-FR-030 | W-X-17 | New: the critic-diversity rule and its warning; test CT-134-30, task T039 |
| F134-FR-005 | B-8.7 | The unknown-terms rule is cited from F147-FR-008 and F147-FR-011; ruling P14 does not name pi |
| F134-FR-019 | B-8.7 | `assumption: CQ-182` added: the weaker proof is a deviation from Principle IX, recorded in the plan's Complexity Tracking |
| F134-FR-030 | B-8.7 | The rule follows F124-FR-045: the result `unverified` also raises the warning; a shared provider or model tier alone does not |
| F134-FR-019 | analyze 2026-09-30 | The weaker proof now holds the three parts of Principle IX v3.0.1 and F109-FR-038 (exact pin, passed preflight, flag set); `assumption: CQ-182` records the owner's answer |
| US4 scenarios 1 and 2 | analyze 2026-09-30 | The requirement cited is F134-FR-023 (was F134-FR-021 and F134-FR-022) |
