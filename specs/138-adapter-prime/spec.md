# Feature Specification: Prime harness adapter

**Feature Branch**: `138-adapter-prime` (a label: Spec Kit creates no branch in this repository; the directory is `specs/138-adapter-prime`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 138-adapter-prime of Specstride: the tested harness adapter for the prime agent, specified against the harness seam exactly as the Claude adapter is (a harness descriptor, optional code hooks, recorded fixtures). Detection and version of the agent executable; the proposer invocation, headless, in text or JSON mode, with the prompt on standard input; the optional qualifier `variant` and the consumer's launcher behind it; the tool-less critic by flags; the JSONL reader for stream schema version 3 with the dialect table that pi shares; the rule that the terminal record decides, because the process exits 0 on a provider error; error and auth classes; usage; the announcement of the observability mode; the harness's own telemetry, switched off; the auth tier and terms row; the containment ceiling; the adapter's doctor checks; the facts that need a fixture capture before the specification freezes."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 32, 32b, 34, 36, 37, 38, 49, 60, 66, 67, P2, P14), `architecture.md` (sections 5, 14, 17), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 138-adapter-prime), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`, annexes B, C, E, G, X), feature 141 (`specs/141-parity-oracle/`, §O.1 to §O.7), the traceability files, and the research reports R9, R18, R14, R8, R8v, R11, R1 and R20. The behaviour of the baseline was read at Specstride `9cab15d`.

## What this feature is

Prime is an agent CLI. It runs headless from a prompt on standard input, and in JSON mode it writes
one JSON record per line (stream schema version 3). It exits 0 even when the model provider
returned an error, so only the terminal record of its stream tells whether a call succeeded. It says
of itself that it is not a sandbox: it runs model-generated code with the consumer's permissions.

Feature 100 states the harness port (EP-02). Feature 109 is the seam: registry, generic harness
adapter, conformance suite. This feature is one tested harness adapter behind that seam, in the
same form as the Claude adapter: a harness descriptor, code hooks where data is not enough, and
recorded fixtures. It carries the whole as-is behaviour of prime: 62 behaviour items in 13 clusters,
all of them parity items (owner ruling 32). It also owns the JSONL reader for stream schema
version 3 and the dialect table that lets pi share that reader (owner ruling 32b).

**In scope**: detection and version pin of the agent executable; the proposer invocation, headless,
in text or JSON mode; the qualifier `variant` and the consumer's launcher behind it; the critic
invocation, tool-less by flags, and the proof of it; the JSONL reader and its dialect table; the
rule that the terminal record decides; error and auth classes; the quota classifier entries;
usage; the announcement of the observability mode; the switching off of the harness's own
telemetry; the auth tier and the terms row; the containment ceiling; the adapter's doctor checks;
the fixture captures that must precede the freeze of this specification.

**Out of scope**:

| Out of scope | Owner | Reached through |
|---|---|---|
| The port, the descriptor schema, the generic harness adapter, the containment levels, the conformance suite | 109 | Feature 100, annex C §C.1, §C.2, §C.15 |
| The registry of stream readers, the six normalized records, the tap, invocation records and their retention | 126 | Feature 100, annex C §C.5; annex B §B.5 |
| The row of the dialect table that belongs to pi | 134 | Feature 100, annex C §C.5 |
| What a quota class does to a run | 127 | Feature 100, annex C §C.13 |
| The terms gate as policy, its file and the audience | 147 | Feature 100, annex C §C.12 |
| Config keys, the alias table and the secret resolvers | 110 | Feature 100, annex X §X.2, §X.8; annex C §C.11 |
| The events as a schema and the compatibility projection | 111 | Feature 100, annex X §X.1; annex C §C.10 |
| Discovery, role resolution and the critic order | 124 | Feature 100, annex C §C.6 |
| The grounding snapshot, the critic prompt and its window budget | 117 | Feature 100, annex C §C.4, §C.6 |
| The scoring of a failed critic-class call as a verdict | 101 | Feature 100, annex C §C.1 "Failure of an implementation" |
| The doctor as a whole and its catalogue | 112 | Feature 100, annex G §G.7 |
| The consumer's launcher and its variants | The consumer | A path in user configuration; this specification names none |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A pass runs on prime as the engine expects (Priority: P1)

A consumer names prime as the proposer, in the bare form or with a variant. The engine starts a
pass through the harness port. The prompt goes in on standard input, the argument list is the one
of the baseline, and a missing executable gives the as-is result code.

**Why this priority**: Parity of the proposer call is the release condition for this harness
(owner ruling 32). Nothing else works if the call differs.

**Independent Test**: Run FX-01 `harness-prime` and `harness-prime-variant` and FX-18
`harness-missing-prime`, `harness-missing-prime-launcher`, `prime-variant-with-model` and
`prime-empty-variant` with the stub executables of feature 141. The `transcript`, `exit`, `stderr` and `events` surfaces read
`equal` or `waived`.

**Acceptance Scenarios**:

1. **Given** prime as the proposer with no variant and the capture of the stream on, **When** a pass starts, **Then** the stub sees headless print mode in JSON mode, no session, the working directory, the prompt on standard input, and no flag that allows all tools (F138-FR-008, F138-FR-009).
2. **Given** prime with a variant and a `--model` setting, **When** a pass starts, **Then** the pass fails with result code 1 and the as-is message, and the stub is not called (F138-FR-010).
3. **Given** an agent executable that is not on the search path, **When** a pass starts, **Then** the result code is 127 and the message names the executable and the variable that sets it (F138-FR-011).
4. **Given** prime as the proposer outside the `parity` profile and no opt-in, **When** a pass starts, **Then** the call carries the four switches that turn skills, extensions, context files and prompt templates off, and the run record holds the setting (F138-FR-044).
5. **Given** auth tier 2 outside the `parity` profile, **When** a pass or a critic-class call starts, **Then** the home that the process sees is a throwaway home and not the consumer's real home, and it is gone after the call (F138-FR-045).

---

### User Story 2 - The terminal record decides (Priority: P1)

Prime exits 0 after a provider error. The consumer must never see such a pass or critic call end
as a success.

**Why this priority**: A wrong success here approves work that was never done, or hides a
credential failure behind a clean exit code.

**Independent Test**: Replay the recorded streams `stock-auth-error` and `empty` with exit code 0.
The first ends as a failed call with the class `provider_auth`; the second ends with
`stream.missing_terminal`.

**Acceptance Scenarios**:

1. **Given** a stream that ends with an error terminal and a process that exited 0, **When** the pass ends, **Then** the call is failed with the reason and class of the terminal (F138-FR-038).
2. **Given** a stream with no terminal record and exit 0, **When** the pass ends, **Then** the outcome is `stream.missing_terminal`, never a success (F138-FR-038).
3. **Given** a stream whose terminal says success and a process that exited non-zero, **When** the pass ends, **Then** the call is not a success (F138-FR-038).

---

### User Story 3 - One reader serves prime and pi (Priority: P1)

The author of the pi adapter, and the author of a later harness of the same lineage, need a reader
for schema version 3 that is written once. What differs per harness is a row of data.

**Why this priority**: Owner ruling 32b. Two readers would drift.

**Independent Test**: Run the reader's replay suite with the dialect `prime` on the recorded prime
streams and with the dialect `pi` on the recorded pi streams of feature 134. Both pass with the
same reader code.

**Acceptance Scenarios**:

1. **Given** a recorded prime stream, **When** the reader replays it, **Then** the normalized records and the display lines equal the expected ones, and the events of the compatibility projection equal the baseline's (F138-FR-025 to F138-FR-037).
2. **Given** a third harness of the family, **When** its row is added to the dialect table, **Then** no line of the reader changes (F138-FR-023).
3. **Given** a stream whose session record names a version that the dialect does not accept, **When** the reader replays it, **Then** it gives one diagnostic and the terminal `unsupported_schema`, and ignores the later records (F138-FR-025).

---

### User Story 4 - The critic can take no action (Priority: P2)

The critic is a fresh prime call with tools, skills and context files switched off. The run needs
proof of it in the call record, and must halt if a tool record ever appears.

**Why this priority**: Principle IX, non-negotiable. It is P2 because the critic path is reached
only after a pass; it still blocks the release.

**Independent Test**: FX-01, FX-06 and FX-07 with the prime critic stub; and an own test that
plants a tool record in a critic stream.

**Acceptance Scenarios**:

1. **Given** the prime critic under the `parity` profile, **When** it is called, **Then** the call is in text mode with the restriction flags of the baseline, and no proof of the form is made, as at the baseline (F138-FR-017, F138-FR-021).
2. **Given** the prime critic outside the `parity` profile, **When** it is called, **Then** it runs in JSON mode, the terminal record decides, and a tool record in the stream halts the run with `critic_not_toolless` (F138-FR-020, F138-FR-021).
3. **Given** an unknown context window and no `parity` profile, **When** prime is configured as critic, **Then** the launch is refused with the reason (F138-FR-022).
4. **Given** `prime:<variant>` named as critic, whose model the product cannot see, **When** the run is launched outside the `parity` profile, **Then** the diversity test gives `unverified`, the critic-diversity warning is raised and recorded, and the run is not blocked (F138-FR-047).
5. **Given** any critic-class call on prime, **When** the run record is read, **Then** it says that harness-native memory was off for the call (F138-FR-046).

---

### User Story 5 - The consumer opts in to no containment, knowing the terms are unknown (Priority: P2)

Prime has no sandbox and its licence and upstream terms are unknown. A consumer who names it must
say so on purpose, and the product must say what it is doing.

**Why this priority**: Rulings 34, 38, 60, P2, P14. It protects the consumer's machine and the
product from a default that nobody chose.

**Independent Test**: Launch with prime as proposer and no opt-in to containment level C0: refused
before the first pass. Launch with the opt-in in user configuration, once per audience: the launch
names "unknown terms", the run record says `protection=detect`, parallel units stay off. Launch with
no role configured and prime discovered, once per audience: prime is in neither role.

**Acceptance Scenarios**:

1. **Given** no opt-in to C0, **When** a launch names prime as proposer, **Then** it is refused before any pass and the reason names the opt-in (F138-FR-015).
2. **Given** any audience and no critic configured, **When** discovery finds prime, **Then** it is never picked automatically as critic and never the default of a role (F138-FR-004, F138-FR-047).
3. **Given** the doctor, **When** it runs with prime configured, **Then** it warns of unknown terms and of the absence of a sandbox (F138-FR-006).
4. **Given** an opt-in to C0 that comes from the environment, a flag or project configuration, **When** a launch names prime as proposer, **Then** it is refused as if there were no opt-in (F138-FR-015).

---

### User Story 6 - The harness reports nothing about the consumer (Priority: P2)

Prime's own usage telemetry is on by default. The consumer did not opt in.

**Why this priority**: Owner rule R14 rule 7; the consumer's privacy.

**Independent Test**: In every fixture that starts prime, the stub records the names of the
variables it saw. The two switches are in the list, every time.

**Acceptance Scenarios**:

1. **Given** any process that the adapter starts for prime, **When** it starts, **Then** its environment holds the telemetry switch of the dialect and the do-not-track variable (F138-FR-041).

---

### Edge Cases

- The stream is empty, or ends inside a line: the reader reports `malformed_json` for the broken line and the stream ends with no terminal (`stream.missing_terminal`).
- A record arrives before any session record: one diagnostic `absent_schema`; records are ignored until a session record with an accepted version arrives.
- A message names another model or provider in the middle of the stream: one `init` update record; usage and text go on.
- A tool starts and never ends, because the stream is cut: one `abandoned_tool` diagnostic per such tool when the agent ends or the stream finishes.
- A provider error is followed by an internal retry and a success: the later terminal replaces the earlier held error (F138-FR-033).
- Two diagnostics carry the same code because the provider error is repeated in the message end and in the end of the agent: both are kept, as at the baseline.
- The prompt is larger than an argument list allows: the prompt is on standard input, so its size is not bounded by the argument list.
- The launcher named by the consumer is missing, or the agent executable is: result code 127, and the message names the one that is missing.
- A variant is given together with a model: the pass is refused before the harness starts, after the launcher was found.
- The model configuration of a gateway makes the gateway reject the call: prime reports a misleading model error. The adapter cannot detect it (F138-FR-007).
- A tool record appears in a critic stream: the run halts (F138-FR-021).
- The throwaway home of auth tier 2 cannot be built, or capture (5) has not shown that prime follows the home variable: the call fails before a process starts (F138-FR-045).
- The opt-in for the customisations of the proposer stands in project configuration: it is ignored (F138-FR-044).
- The launcher of the consumer does not hand the switches on to the agent executable: the product cannot see it; the fact is `unverified` and the consumer's matter (F138-FR-044).
- macOS: every statement about the behaviour of prime on macOS is `unverified` (owner ruling 67).

## Requirements *(mandatory)*

Every requirement follows `STAGE-B-RULES.md` section 4. A requirement with an as-is origin names
the test of the traceability files (`PT-138-<cluster>-*`). A new requirement names a test
`CT-138-<n>`, where n is the number of the requirement. Fixture families are those of feature 141,
§O.2. Where the text says "the argument table", it means the table of `plan.md` that lists, per
role, the exact flags and variables of the pinned version; the argument table is data of the
adapter and is compared by the oracle as feature 100, annex X §X.8 states.

In compatibility output a message that the baseline starts with the name of an implementation file
starts with the logical component name of feature 100, annex X §X.8 (rule N-15). Such a prefix is
written `<component>` below; for the pass loop it is `pass-loop`. The words "fleet" and "Prime
Agent" in a quoted message are as-is literals.

### Functional Requirements

#### G1 — Registry entry, detection, tier and terms, auth, doctor

- **F138-FR-001**: The product MUST ship a tested harness adapter with the id `prime`, made of a harness descriptor of kind `cli`, code hooks and recorded fixtures. It MUST offer the level `proposer` and the level `completion`. Its qualifier MUST be of the form `optional`, with the label `variant`, spelled `prime[:variant]`, for both roles. Under the `parity` profile the entry, as the registry reports it, MUST name no stream format and declare no overlay; a structured pass MUST reach the reader through the dialect row of the adapter and not through the registry entry.
  - origin: C-035; B-0430
  - disposition: ported
  - test: PT-138-C-035-*
  - divergence: DV-064
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-151

- **F138-FR-002**: Detection MUST establish the presence of the agent executable free of charge and MUST read its version from the version flag of the agent executable. The launcher of the consumer has no version flag and MUST NOT be probed for one. The path and the version MUST be recorded with every pass and every critic-class call (F100-FR-080). The tested range MUST be `>=0.7.3 <0.8` with stream schema version 3, verified on 2026-09-29. The doctor MUST warn when the installed version is outside the range, a version that differs from that of an earlier pass or critic-class call of the same run MUST be surfaced as a warning (Principle X), and the adapter MUST never install, vendor or download the harness. Whether the record set of the stream at the pin equals the set of F138-FR-026 is `unverified` until the capture of F138-FR-042.
  - test: CT-138-2
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: verified-on 2026-09-29 for the presence check and the version flag of the installed agent executable (R9 Q1); pin: prime-agent 0.7.3. The stream at the pin: unverified (check: the capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-003**: The agent executable and the launcher MUST be settable by the consumer. The agent executable MUST default to the as-is default name, with the key `harnesses.prime.bin` and the as-is alias `SPECSTRIDE_PRIME_AGENT_BIN`. The launcher MUST be used only when a variant is given, with the key `harnesses.prime.launcher` and the as-is default name. Two as-is variables reach that key, in the order of the baseline: `SPECSTRIDE_PRIME_FLEET_BIN` comes first, and the legacy alias `SPECSTRIDE_PRIME_BIN` is read when the first is unset. The order is the one exception to the rule that refuses a launch when two variables reach one key and differ; the environment alias table (feature 100, annex X §X.8, completed by §K.8 of feature 110) holds the variables and the order. The proposer and the critic MUST read the same settings. The contract targets the agent executable; the launcher is a path in the consumer's configuration and is never named by the product.
  - origin: C-052; B-0517; B-0518; C-061; B-0827; B-0828; B-0829
  - disposition: translated
  - test: PT-138-C-052-*; PT-138-C-061-*
  - divergence: DV-027; DV-064
  - parity: the as-is variable names and default names, and the as-is order of the two variables of the launcher (the environment alias table of annex X §X.8)
  - assumption: CQ-235 (answered by CQ-196 and F110-FR-020: the pair is the one exception to the refusal of two differing variables, and an empty first variable is read as unset)

- **F138-FR-004**: The descriptor MUST offer the auth tiers 1 and 2 and never 3. Its `provider.termsRef` MUST be null, so that the terms gate reads unknown terms; its use is "fleet only". Under every audience prime MUST never be a default and MUST never be picked automatically as critic. The bar holds for both roles: prime is the default of neither the proposer nor the critic, and no step of discovery or of the critic order puts it into a role that the consumer did not name. It MUST be usable when the consumer names it in configuration, and a launch that names it MUST state "unknown terms" and the doctor MUST warn, under every audience. A login of the harness that reuses a subscription token is auth tier 3 and MUST be refused. A change of the terms data that gives prime a row MUST need no code change.
  - divergence: DV-048; DV-049
  - test: CT-138-4
  - ep: EP-11 `specstride.terms/1` (consumes)
  - parity: audience `personal` (row 34 of annex X §X.7); the default and the automatic pick are not reached, because every fixture names the roles (rows 35, 36)
  - status: unverified (check: the licence of the harness and the terms of the upstream model endpoints, which R8 F-D4 could not establish; verified-on: —; pin: —)

- **F138-FR-005**: Auth MUST be by provider API key. The adapter MUST hand the key to the process by environment, from a secret reference resolved at the moment of use, and never by an argument or by the prompt. The adapter MUST read no authentication file of the harness. The environment of every process MUST be an allow-list: the search path, the locale, the home that F138-FR-045 gives for the auth tier, the session directory variable where F138-FR-014 or F138-FR-045 sets it, the variables the consumer named for the provider in use, and the telemetry switches of F138-FR-041; nothing else. The credentials of the critic MUST NOT be in the environment of the proposer, or the reverse. A credential that the secret resolver reports absent MUST fail the launch before the first pass and name what is missing.
  - test: CT-138-5
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - parity: the environment of the baseline is what the oracle's hermetic environment holds (F141-FR-011); the allow-list changes no name that the stub sees, except the two of F138-FR-041

- **F138-FR-006**: The adapter MUST register these checks with the doctor, each free of charge and reading no secret value: the agent executable is present (`lb`); its version is in the range; the launcher is present when a variant is configured; the credential of each role in use exists or is `unprobed` (`lb`); the terms are unknown (warning); the containment ceiling is C0 and whether the consumer opted in (`lb` when prime is the proposer); the context window of a critic is known. The ids MUST be of the form `harness.prime.<check>`. A check MUST time out with a warning and never raise the code above that of a warning.
  - test: CT-138-6
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))
  - assumption: CQ-150

- **F138-FR-007**: The specification MUST list one known failure that the adapter cannot detect: a model configuration that makes a gateway reject the call surfaces in prime as a misleading model error. The adapter MUST classify such an error as it classifies any other, by its words, and MUST NOT guess a cause. The doctor MUST NOT claim to check it.
  - test: CT-138-7
  - status: unverified (check: a fleet note of 2026-08-19 reports it (R9 F20); it is not reproduced, no model call was made; verified-on: —; pin: —)

#### G2 — The proposer

- **F138-FR-008**: The proposer pass on bare prime MUST call the agent executable in headless print mode, in the mode of F138-FR-009, with no session, with the working directory of the pass, and with `--model` only when a model was named. The prompt MUST be on standard input. No flag that allows all tools MUST be passed. The exact flags are those of the argument table.
  - origin: C-058; B-0693
  - disposition: ported
  - test: PT-138-C-058-*
  - divergence: DV-010; DV-064; DV-031
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the argument list of the baseline (row 26 of annex X §X.7); no continuation argument (row 10)

- **F138-FR-009**: The proposer MUST run in JSON mode when the capture of the agent stream is on, or when the consumer asked for stream JSON, and in text mode otherwise. The capture MUST be on by default. The switch MUST be the key `stream.tap` (annex X §X.7 rows 79 and 86) with the as-is alias `SPECSTRIDE_AGENT_STREAM`, and the as-is flag `-j` MUST still turn the capture on for prime.
  - origin: C-058; B-0692
  - disposition: ported
  - test: PT-138-C-058-*
  - divergence: DV-064
  - parity: on (the as-is default; no row of annex X §X.7 holds this switch, see the report)

- **F138-FR-010**: A pass on `prime:<variant>` MUST call the launcher, with the variant as its first argument, followed by the same headless, no-session, working-directory arguments and the mode of F138-FR-009, with the prompt on standard input. The checks MUST run in this order: an empty variant fails the pass with result code 1 and the message `<component>: empty Prime variant; use 'prime' or 'prime:<variant>'`; a launcher that is not found gives F138-FR-011; a model named together with a variant fails the pass with result code 1 and the message `<component>: --model is unsupported with prime:<variant>; the variant selects its model`. No process MUST be started in any of these three cases.
  - origin: C-058; B-0694; B-0695; B-0696
  - disposition: ported
  - test: PT-138-C-058-*
  - divergence: DV-064; DV-066; DV-010
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the argument list of the baseline (row 26 of annex X §X.7)

- **F138-FR-011**: A pass MUST return the result code 127, and MUST NOT start a process, when the agent executable is not found, with the message `<component>: Prime Agent not found: <executable> (set $SPECSTRIDE_PRIME_AGENT_BIN)`, and when the launcher is not found, with the message `<component>: Prime fleet launcher not found: <launcher> (set $SPECSTRIDE_PRIME_FLEET_BIN)`. The code is the `exit_code` of a result record, kept in the record of the pass (F100-FR-153).
  - origin: C-054; B-0572; B-0573
  - disposition: translated
  - test: PT-138-C-054-*
  - divergence: DV-066; DV-064
  - assumption: CQ-152

- **F138-FR-012**: A prime pass that does not use the stream capture MUST announce, at its start, an observability event with the mode `raw-text`, the reason `structured schema unavailable — parsing plain output`, the role, and the supported signals `text,result`.
  - origin: C-053; B-0547
  - disposition: translated
  - test: PT-138-C-053-*
  - divergence: DV-007

- **F138-FR-013**: A prime pass that uses the stream capture MUST be routed to the reader with the provider format `prime-v3`, and that literal MUST be written to the metadata of the invocation. The observability announcement of such a pass MUST have the mode `structured`, the reason `Prime JSON schema v3 selected`, the provider format `prime-v3`, the role, and the five signals `init,text,tool,evidence,result`.
  - origin: C-058; B-0747; C-154; B-2120
  - disposition: ported
  - test: PT-138-C-058-*; PT-138-C-154-*
  - divergence: DV-007

- **F138-FR-014**: Outside the `parity` profile, a pass after the first pass of a phase attempt MAY continue the session of the earlier pass, where the descriptor declares continuation. The adapter MUST then resume the session by the id that the initial record of the earlier pass stated, inside a session directory that belongs to the phase attempt (`attempt:<N>:<k>:<n>:session`), and MUST NEVER resume "the latest" session without that directory. Session state MUST NOT be written to any other place and MUST be removed when the phase attempt ends. Every other start, that is a new phase attempt, a relaunch, a kill by a watchdog, a critic-class call and the first pass of a phase attempt, MUST start with no session and the flag that stores none. When the earlier pass stated no session id, the next pass MUST start fresh and context MUST be carried through files. Under the `parity` profile every pass MUST carry the no-session flag, and no invocation MUST carry a continuation argument.
  - divergence: DV-010
  - test: CT-138-14
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: off (row 10 of annex X §X.7)
  - status: unverified (check: the resume flag inside a session directory works in print mode at the pin; capture (4) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-015**: The containment ceiling of the adapter MUST be C0, declared with the harness's own statement that it is not a sandbox as its provenance. As a proposer, prime MUST run only where the consumer opted in to C0 in user configuration. The opt-in MUST be accepted from user configuration only: the environment, a flag and project configuration MUST NOT give it. A launch that names prime as proposer without the opt-in MUST be refused before any pass, and the reason MUST name the opt-in. The run record MUST say `protection=detect`. Parallel units MUST stay off unless `loop.parallel.allow_detect` is set in user configuration, which is the only source that may set it. The adapter MUST state that the harness has no permission mode, and the runtime MUST never assert a sandbox. Under the `parity` profile the value C0 of row 25 MUST stand for the opt-in.
  - divergence: DV-030; DV-031
  - test: CT-138-15
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: containment as at the baseline, none (rows 25, 26 of annex X §X.7)
  - assumption: CQ-149; CQ-183
  - status: verified-on 2026-09-29 for the harness's own statement in its help text (R9 F19); pin: prime-agent 0.7.3. Whether prime's file tools are confined by anything: unverified (check: capture of a pass with a planted write outside the working directory; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-016**: Outside the `parity` profile the tools of a proposer pass MUST be chosen by an allow-list that the descriptor declares and the consumer may narrow, with the key `harnesses.prime.tools`. The list MUST be recorded per run. Under the `parity` profile no allow-list MUST be passed.
  - divergence: DV-031
  - test: CT-138-16
  - parity: no allow-list (row 26 of annex X §X.7)
  - status: unverified (check: the allow-list flag and the names of the tools at the pin; verified-on: —; pin: prime-agent 0.7.3)

#### G3 — The critic

- **F138-FR-017**: A critic-class call on prime MUST be a fresh session with tools, skills and context files switched off. Under the `parity` profile it MUST be in text mode, in the form of the argument table: the agent executable, or the launcher followed by the variant, then headless print mode, text mode, no session, and the three switches-off, with the working directory only when one was given, and the prompt on standard input. An empty variant MUST raise the error `empty Prime variant; use prime or prime:<variant>`, which the critic-class call reports as `critic call error: <error>`. The executable and the launcher MUST be resolved as in F138-FR-003. A non-zero exit code, an empty output, a time limit passed and a launcher that cannot start MUST be reported to the seam as failures of the call; the seam and the phase gate score them. Harness-native memory is off for every such call (F138-FR-046).
  - origin: C-066; B-0991; B-0995; C-061
  - disposition: ported
  - test: PT-138-C-066-*; PT-138-C-061-*
  - divergence: DV-010; DV-031; DV-064
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: the critic in text mode with the flag set of the baseline (rows 26, 28 of annex X §X.7)

- **F138-FR-018**: The baseline holds a critic function for JSON mode that its dispatcher never calls: the verdict path always uses text mode, although the announcement may say `structured`. Under the `parity` profile this MUST be reproduced: the verdict path MUST use text mode whatever the capture switch says.
  - origin: C-066; B-0994
  - disposition: ported
  - test: PT-138-C-066-*
  - parity: text mode (row 28 of annex X §X.7)

- **F138-FR-019**: A prime critic-class call MUST announce its observability with the role `critic` and the supported signals `text,result`. The mode MUST be `structured`, with the reason `Prime JSON schema v3 selected` and the provider format `prime-v3`, when the capture switch is exactly `true`, and `raw-text`, with the reason `structured schema unavailable — parsing plain output` and no provider format, otherwise. The announcement MUST be made only for prime.
  - origin: C-061; B-0839; C-062; B-0856
  - disposition: translated
  - test: PT-138-C-061-*; PT-138-C-062-*
  - divergence: DV-027; DV-007
  - parity: as the capture switch says, although the call is in text mode (F138-FR-018)

- **F138-FR-020**: Outside the `parity` profile the prime critic MUST run in JSON mode, so that a provider error is seen in the terminal record and not guessed from text. The call MUST carry the restriction flags of F138-FR-017 and the flags that switch off extensions and prompt templates, so that none of the four kinds of auto-loaded context of F138-FR-044 reaches a critic. The reply handed to the verdict parser MUST be the visible text of the text records only, never a display line, a tool argument or thinking. The outcome MUST be that of the terminal record (F138-FR-038). The reason of a failed call MUST be the code of the first diagnostic of severity `error`, or else the reason of the terminal. The model, the provider, the usage and the duration MUST be recorded and MUST NOT change the verdict.
  - divergence: DV-090; DV-031
  - test: CT-138-20
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: text mode (row 28 of annex X §X.7)
  - status: verified-on 2026-09-30 for the existence of the flags for extensions and prompt templates in the help of the installed agent executable; pin: prime-agent 0.7.3. That the critic in JSON mode at the pin ends with a terminal record: unverified (check: capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-021**: Outside the `parity` profile, the record of every prime critic-class call MUST hold the proof of its form. The proof MUST be: the flag set in the call record; in JSON mode, from the initial record, a tool list that is empty and a session id that equals no session id of any pass of the run (feature 100, F100-FR-230, case 2), the case being recorded; and that no tool record appears anywhere in the stream of the call. An initial record that states no tool list or no session id is a missing proof: the weaker proof is open only to a stream that carries no initial record (Principle IX; annex C §C.3). Under the `parity` profile, where the call is in text mode and has no stream, no proof MUST be made or checked, as at the baseline (F100-FR-230; rows 28 and 117 of annex X §X.7); this is the deviation from Principle IX under that profile that the plan of feature 100 records for every harness. A tool record in a critic stream, or a missing proof, MUST be the failure `critic_not_toolless` and MUST halt the run (engine exit 3, stop reason `critic_config`). No critic path MUST receive a flag that allows all tools. A critic call MUST never resume a session.
  - test: CT-138-21
  - ep: EP-02 `specstride.harness/1` (implements)
  - divergence: DV-081
  - status: unverified (check: whether the initial record states the tool list; capture (3) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-022**: The adapter MUST state the context window of a prime critic with its source: declared by the consumer, or read from the model list of the harness, and the smaller of the two where both exist. Outside the `parity` profile there MUST be no default window: a critic whose window is unknown MUST NOT qualify, a configured one MUST be refused with the reason, and it MUST NOT be picked automatically. Under the `parity` profile the adapter MUST state 98,304 tokens for `prime` and for `prime:<variant>`, whose model the product cannot see, with the source `catalogue`.
  - test: CT-138-22
  - parity: 98,304 tokens for an unseen model (row 28 of annex X §X.7)
  - status: unverified (check: the model list of the harness at the pin states a context window per model; verified-on: —; pin: prime-agent 0.7.3)

#### G4 — The JSONL reader and the dialect table

- **F138-FR-023**: There MUST be one reader for the JSONL streams of schema version 3, written once for the family, registered in the registry of stream readers of feature 100, annex C §C.5. What differs per harness MUST be data in a row of the dialect table (`specstride.stream-dialect/1`), and a third harness of the family MUST be added as a row and not as code. The reader MUST parse only the framing of the harness itself, one JSON document per line of its standard output; MUST NEVER read the output of a tool as a stream record; MUST enforce a cap on the size of a line and on the rate of lines, whose values are data of the dialect row and are recorded with the run, a line over the cap giving a `malformed_json` diagnostic; and MUST report a stream that ends without a terminal record. A dialect name that the table does not hold MUST refuse the stream.
  - test: CT-138-23
  - ep: EP-02 `specstride.harness/1` (implements); `specstride.stream-dialect/1` (implements)
  - divergence: DV-007

- **F138-FR-024**: The row `prime` of the dialect table MUST hold: the dialect name `prime`; the accepted session versions, the list holding 3; the provider format `prime-v3`; the switches that turn the telemetry of the harness off; the switches that turn sessions off, name a session directory and resume a session by id; the extra record types, none; the names under which usage is reported (F138-FR-035); and `terminalDecides` true. The known record types MUST be the common set of the family, and the extra record types of a row MUST be added to it. The row MUST hold no path and no name specific to one machine.
  - test: CT-138-24
  - ep: `specstride.stream-dialect/1` (implements)

- **F138-FR-025**: The reader MUST check the schema before it reads anything else. A record that is not a session record, arriving while no accepted schema is in force, MUST give one diagnostic `absent_schema` (severity `error`, message `Prime stream has no schema declaration`, with the type of the record), and every record other than a session record MUST be ignored while no accepted schema is in force. A session record with no version MUST give `absent_schema` with the message `Prime session omitted schema version`. A session record with a version that the dialect does not accept MUST give `unsupported_schema` (severity `error`, message `Unsupported Prime schema version <v>`), and the later records MUST be ignored without further diagnostics. At the end of the stream, a stream whose session named a version that was present and not accepted MUST end with the terminal `unsupported_schema` (status `error`, the same message as its reason). Feature 126's seam MAY read these two codes as the trigger of the degraded announcement.
  - origin: C-168; B-2225; B-2229; B-2230; C-169; B-2241
  - disposition: translated (B-2225, B-2229, B-2230); ported (B-2241)
  - test: PT-138-C-168-*; PT-138-C-169-*
  - divergence: DV-007

- **F138-FR-026**: The reader MUST go on after a bad input. A line that does not parse as JSON MUST give `malformed_json` (severity `error`, message `Malformed Prime JSON: <error>`). A JSON value that is not an object MUST give `malformed_json` with the message `Prime record is not a JSON object`. A record whose type is outside the known set, or has none, MUST give `unknown_record` (severity `warning`, message `Unknown Prime record type: <type>`, with `<absent>` for none), except that a type that begins with `tool` MUST be handled as a tool record and MUST give no diagnostic. The known set MUST be: `session`, `message_start`, `message_update`, `message_end`, `turn_start`, `turn_end`, `agent_start`, `agent_end`, `auto_retry_start`, `auto_retry_end`, `error`, `toolcall_start`, `toolcall_delta`, `toolcall_end`, `tool_execution_start`, `tool_execution_update`, `tool_execution_end`.
  - origin: C-168; B-2224; B-2227; B-2228; C-171; B-2250
  - disposition: translated (B-2224, B-2227, B-2228); ported (B-2250)
  - test: PT-138-C-168-*; PT-138-C-171-*
  - divergence: DV-007
  - status: unverified (check: the recorded stream of a pass at the pin holds no record type outside this set; capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-027**: A session record with an accepted version MUST give an `init` record with the schema version, the session id, the working directory, the provider and the model, and every null value MUST be dropped; the display line MUST be `  · init prime-v3 session=<id>` with `?` where the id is absent. When a message of the role assistant, or of no role, names a model or a provider that differs from the current one, an `init` record with `update` true MUST follow. A message whose role is present and is not `assistant` MUST be ignored for text and for the tracking of the model.
  - origin: C-168; B-2231; B-2232; C-171; B-2252; C-170; B-2244
  - disposition: translated (B-2231, B-2232); ported (B-2252, B-2244)
  - test: PT-138-C-168-*; PT-138-C-171-*; PT-138-C-170-*
  - divergence: DV-007

- **F138-FR-028**: Text deltas (type `text_delta` or `text`) MUST be accumulated per message and content index, and MUST NOT be emitted before the message ends. A negative or non-integer index MUST be read as 0, and a delta with no text as nothing. At the end of a message, a content snapshot of a block MUST replace the accumulated text only when it starts with it, or when nothing was accumulated; otherwise the accumulated deltas MUST win. Each non-empty block MUST then give one `text` record with the message key `<message id>:<index>`, the message id, the content index, `final_fragment` true, the text redacted and cut to 4,096 bytes, and the redaction metadata. The display line MUST be that text, without collapsing whitespace.
  - origin: C-168; B-2233; C-171; B-2253; B-2254; C-170; B-2245
  - disposition: translated (B-2233); ported (B-2253, B-2254, B-2245)
  - test: PT-138-C-168-*; PT-138-C-171-*; PT-138-C-170-*
  - divergence: DV-007
  - ep: `specstride.redaction/1` (consumes)

- **F138-FR-029**: A tool MUST give a `tool` record at its start (status `start`; tool id, tool, targets, summary, redaction metadata), at each non-empty progress message (status `progress`; summary cut to 1,024 bytes; nothing printed) and at its end (status `end`; tool id, tool, `is_error`, duration in milliseconds from the record, result summary cut to 4,096 bytes; null values dropped). A tool record with no call id MUST get the generated id `prime-tool-<n>`. A tool end MUST count as an error when its status is `error`, `failed` or `failure` in any case, or its error flag is true. The display line at the start MUST be `  → <tool> <summary>`, and at the end `  ← <tool> error` or `  ← <tool> done`.
  - origin: C-168; B-2234; B-2236; B-2237; C-171; B-2256; B-2257; C-170; B-2246; B-2247
  - disposition: translated (B-2234, B-2236, B-2237); ported (the others)
  - test: PT-138-C-168-*; PT-138-C-171-*; PT-138-C-170-*
  - divergence: DV-007
  - ep: `specstride.redaction/1` (consumes)

- **F138-FR-030**: Tool arguments MUST be summarized as the redacted JSON of the arguments, cut to 2,048 bytes; arguments that are neither an object nor a list MUST be summarized as an object with one key `script` holding their text. Quoted path literals in the text of the arguments that contain `/`, or are named `GATE<n>-EVIDENCE.md`, MUST be added to the targets, up to 8 paths. Evidence writing MUST be detected lexically from the arguments: a path object written by its write-text, write-bytes or open call; an open call with a write, append, exclusive or update mode; or a variable assigned from a path object and later written. A relative path MUST be resolved against the working directory of the session, and the result MUST equal the expected evidence path. Each matching tool start MUST give one evidence record with the tool id, the tool, the expected path and the match `exact-expected-target`; it is not limited to once.
  - origin: C-168; B-2235; C-171; B-2258; B-2249
  - disposition: translated (B-2235); ported (B-2258, B-2249)
  - test: PT-138-C-168-*; PT-138-C-171-*
  - divergence: DV-007

- **F138-FR-031**: When the agent ends, or when the stream finishes, each tool that started, or had arguments, and never ended MUST give one diagnostic `abandoned_tool` (severity `warning`, message `Prime stream ended before tool <id> completed`, record type `tool_execution`, with the tool id and the tool).
  - origin: C-168; B-2239
  - disposition: translated
  - test: PT-138-C-168-*
  - divergence: DV-007

- **F138-FR-032**: A provider error MUST give a diagnostic of severity `error`, whose record type is `error`, `message_end` or `agent_end`, and whose code MUST be `provider_auth` when the message matches, in any case, `auth`, `authentication`, `authorization`, `credential` or `api key` (the separator of the last one being a space, `_`, `-` or none), and `provider_error` otherwise. A message that ends with the stop reason `error` or with an error message, an `error` record, and an end of the agent with the status `error`, `failed` or `failure`, with the stop reason `error` or with an error value, MUST each record a provider error. The message MUST default to `Prime reported an error`, and for a message end to `Prime message ended with an error`. The error terminal MUST carry the status `error`, the reason code, the reason, the stop reason (default `error`) and the usage fields.
  - origin: C-168; B-2238; C-169; B-2242; B-2243; C-171; B-2255
  - disposition: translated (B-2238); ported (the others)
  - test: PT-138-C-168-*; PT-138-C-169-*; PT-138-C-171-*
  - divergence: DV-007

- **F138-FR-033**: An error recorded before the end of the agent, from an `error` record or a message end, MUST be held and exposed as the terminal only at the end of the stream, and only when the end of the agent delivered none; a terminal that the end of the agent delivers, success or error, replaces it. The end of the agent MUST be an error terminal by the words of F138-FR-032, and a success terminal only when its status is `success`, `completed`, `complete` or `ok`; any other status MUST give no terminal. The success terminal MUST carry the status `success`, the stop reason, the model and the usage fields.
  - origin: C-171; B-2251; B-2259; B-2260
  - disposition: ported
  - test: PT-138-C-171-*

- **F138-FR-034**: The start of an internal retry MUST give a diagnostic `provider_retry` (severity `warning`) whose message is the reason of the record, or `Prime started an internal retry`, with the record type, the attempt and the delay in milliseconds. The end of a retry MUST give nothing.
  - origin: C-168; B-2226
  - disposition: translated
  - test: PT-138-C-168-*
  - divergence: DV-007

- **F138-FR-035**: The reader MUST read usage under both spellings: input, output, cache read (three names), cache write (three names), total, and cost (`cost` or `totalCost`); a negative, boolean or non-numeric value MUST be ignored. The usage of each turn end MUST be summed, and the usage of the end of the agent MUST be merged as the maximum of the running total and the value of the end. The total MUST be derived as input plus output when the provider gave none and either exists. The turn count MUST be reported under two names, `num_turns` and `turns`, when it is above 0. Cost MUST be reported under the key `cost`, cache writes under `cache_write_tokens`, and never under `cost_usd` or `cache_creation_tokens`, so that the old cost metrics get no value from prime. This last point is a preserved defect of the compatibility projection; the normalized records of F138-FR-037 carry typed usage.
  - origin: C-171; B-2261; B-2262; B-2263; B-2264
  - disposition: ported
  - test: PT-138-C-171-*
  - divergence: DV-007
  - status: unverified (check: the recorded stream at the pin reports cost, and in which unit; capture (1) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-036**: Every diagnostic MUST carry the code, the severity, the message redacted and cut to 1,024 bytes, the record type, the redaction metadata and the extras of its code, with null values dropped. Every diagnostic MUST also give the display line `  ! <code>: <message>`. Under the `parity` profile the presenter MUST print the display lines of F138-FR-027 to F138-FR-036 as they are.
  - origin: C-168; B-2240; C-170; B-2248
  - disposition: translated (B-2240); ported (B-2248)
  - test: PT-138-C-168-*; PT-138-C-170-*
  - divergence: DV-007
  - ep: `specstride.redaction/1` (consumes)

- **F138-FR-037**: The reader MUST produce only the six normalized records `init`, `text`, `tool`, `usage`, `error` and `terminal`. The compatibility projection (feature 100, annex C §C.10) MUST render them, under the `parity` profile, as the as-is events `agent_init`, `agent_text`, `agent_tool`, `evidence_writing`, `agent_diagnostic` and the terminal of the invocation, with the fields of F138-FR-025 to F138-FR-036, and MUST compare equal to the baseline on the fixtures FX-26 after the normalization of feature 100, annex X §X.8. Text and tool summaries MUST pass the redactor.
  - test: CT-138-37
  - ep: EP-08 `specstride.event-sink/1` (consumes)
  - divergence: DV-007

#### G5 — The terminal decides; quota; usage; telemetry; captures; conformance

- **F138-FR-038**: For a pass and for a critic-class call in JSON mode, the outcome MUST be decided by the terminal record and never by the exit code alone. A process that exited 0 with an error terminal MUST end as a failed call with the reason and class of the terminal. A stream that ends with no terminal record MUST yield `stream.missing_terminal`. A success terminal with a process that exited non-zero, or ended by a signal, MUST NOT be a success. A success MUST need both a success terminal and an exit code of 0. In text mode there is no terminal, and the exit code and the output decide, as at the baseline.
  - test: CT-138-38
  - parity: the baseline's reconciliation of the provider terminal with the producer status on the structured path
  - status: verified-on 2026-09-29 for exit 0 on a provider error (R9 F5, from the code and the recorded streams of the baseline); pin: prime-agent 0.7.3. The record and the exit code when a provider limit is reached: unverified (check: capture (2) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-039**: The adapter MUST supply the entries of the quota classifier of feature 100, annex C §C.13, for the error classes of the reader. `provider_auth` MUST give the class `auth`. For `provider_error`, a message that states a limit together with a time or a duration of reset MUST give `quota_window` with the confidence `text` and `resetsAt` read from it, so that the run pauses only after the confirming probe; every other message MUST give `provider_other`. The harness has no structured code for quota. The typed failure of the port MUST be `authentication_failed` for `auth`, `quota_exhausted` for `quota_window`, and `agent_failure` otherwise.
  - divergence: DV-005
  - test: CT-138-39
  - ep: EP-12 `specstride.quota-classifier/1` (implements)
  - parity: not observable (row 39 of annex X §X.7)
  - status: unverified (check: the text of a provider limit at the pin, captured; capture (2) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-040**: The reader MUST give usage per turn as increments, each with a unique usage id, and MUST reduce the value of the end of the agent so that the sum of the increments equals the merged total of F138-FR-035. A pass that is killed MUST keep the usage of the turns that ended and MUST be marked as incomplete. A value that the stream does not give MUST be null and never zero. No cost MUST be invented; the cost class of the descriptor MUST be `unknown` unless the consumer declares prices.
  - test: CT-138-40
  - divergence: DV-007
  - ep: EP-08 `specstride.event-sink/1` (consumes)

- **F138-FR-041**: Every process that the adapter starts for prime, for a pass, a critic-class call, a version probe or a doctor check, MUST be started with the telemetry switch of the dialect row and the do-not-track variable set. The consumer did not opt in to the telemetry of the harness. The two names MUST be in the environment that the stub records in every fixture.
  - test: CT-138-41
  - divergence: DV-112
  - status: verified-on 2026-09-29 for the existence of both switches in the documentation shipped with the installed version (R9 F17); pin: prime-agent 0.7.3. That the switches suppress every call the harness makes to the network: unverified (check: a pass under a network that records connections; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-042**: The following MUST be captured on the pinned version before this specification freezes, each as a scripted capture or one small call, allowed only as an explicitly authorized probe and logged as paid where it is: (1) one recorded stream of a proposer pass and one of a critic call, to confirm the record set of F138-FR-026; (2) the record and the exit code when a provider limit is reached; (3) whether the initial record states the tool list; (4) the resume flag inside a session directory in print mode; (5) that the agent executable takes its configuration directory from the home variable, by a scripted check that calls no model; and, read from capture (1), which is made in a watched home, that a call at auth tier 1 with sessions off writes nothing to the home and that a call with the four switches of F138-FR-044 loads none of the four kinds. The live probes MUST be one per role and no other paid call MUST be made. Each result MUST become a recorded fixture with its `verified-on` date and the version. The first task of `tasks.md` MUST be the capture, and this feature runs none itself.
  - test: CT-138-42
  - status: unverified (check: the five captures; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-043**: The adapter MUST pass the conformance suite of the harness port with a fake binary. The reader MUST have a suite of its own: recorded streams replayed, each with its expected normalized records, display lines and projected events; the ten as-is input streams of prime among them. The same suite MUST be run with the dialect `pi`, on the recorded streams that come with the row `pi` of the dialect table (feature 100, annex C §C.5). No test MUST call a paid or external service.
  - test: CT-138-43
  - ep: EP-02 `specstride.harness/1` (implements)

#### G6 — Auto-loaded context, the home, native memory, critic diversity

Added on 2026-09-30 after the cross-feature review. The ids continue the list; no id was renumbered.

- **F138-FR-044**: Outside the `parity` profile the auto-loaded context of prime (skills, extensions, context files, prompt templates) MUST be off for a proposer pass by default, on bare prime and on `prime:<variant>`: the call MUST carry the four switches-off of the argument table. The consumer MAY switch the auto-loaded context on for the proposer with the key `harnesses.prime.proposerCustomisations`. The key MUST be of the trust class widening, MUST be accepted from user configuration only and MUST be ignored in project configuration. The value in force MUST be recorded per run. No key MUST switch the auto-loaded context on for a critic-class call (F138-FR-017, F138-FR-020). On `prime:<variant>` the switches follow the variant in the argument list, as the restriction flags of the critic do at the baseline; what the consumer's launcher does with them is outside the product. Under the `parity` profile no flag about the auto-loaded context MUST be passed to the proposer.
  - test: CT-138-44
  - divergence: DV-047; DV-002; DV-031
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `as-is`: no flag about customisations is passed (row 131 of annex X §X.7)
  - status: verified-on 2026-09-30 for the existence of the four switches in the help of the installed agent executable; pin: prime-agent 0.7.3. That a call with the four switches loads none of the four kinds: unverified (check: capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-045**: A call on prime, for either role, MUST use the home that feature 100, annex C §C.16 and F100-FR-113 give for the auth tier. At auth tier 1 it MUST use the consumer's real home, which the run MUST never write: session state goes to the session directory of the phase attempt (F138-FR-014) or is not stored. At auth tier 2 it MUST use a throwaway home built from an overlay, and the consumer's real home MUST NOT be handed to the process. The harness has a variable of its own for its session directory and none for its configuration directory; the overlay MUST therefore redirect the home variable and the session directory variable. The overlay MUST seed no credential and no authentication file; the key reaches prime by environment only (F138-FR-005). The throwaway home MUST be removed after the call, a killed pass and a call that passed its time limit included. An overlay that cannot be built MUST fail the call before a process starts. The descriptor MUST state, with its provenance, whether the agent executable follows the home variable; until capture (5) of F138-FR-042 has shown it, and for good where the capture shows the contrary, the statement MUST be null and a call on prime at auth tier 2 MUST be refused before a process starts, with a reason that names the missing fact (CQ-234). Under the `parity` profile no overlay MUST be built, and the home is the one of the oracle's hermetic environment.
  - test: CT-138-45
  - divergence: DV-002
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: overlay scope `none` (row 30 of annex X §X.7)
  - assumption: CQ-234
  - status: unverified (check: the agent executable takes its configuration directory from the home variable, and a call at auth tier 1 with sessions off writes nothing to the home; capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-046**: Harness-native memory of prime MUST be off for every critic-class call and off by default for a proposer pass. The consumer MAY switch it on for the proposer with the key `memory.native.proposer`, which MUST be of the trust class widening, MUST be accepted from user configuration only and MUST be ignored in project configuration. The setting in force MUST be recorded per run, for the proposer and for the critic. The descriptor MUST state what the adapter treats as native memory of prime and the switch that turns each part off: saved sessions, off by the flag that stores none (F138-FR-014); the persistent goal of a session, which the adapter MUST never seed; and context files, off by their switch (F138-FR-044). Where a capture shows a memory of the pinned version that none of these switches turns off, the descriptor MUST report it as null in its capabilities, the doctor MUST warn, the run record MUST say so, and prime MUST NOT qualify as critic (F100-FR-082). Under the `parity` profile no flag about memory MUST be passed beyond the flag set of the baseline.
  - test: CT-138-46
  - divergence: DV-047
  - ep: EP-02 `specstride.harness/1` (implements)
  - parity: `as-is`: no flag about memory is passed (row 29 of annex X §X.7)
  - assumption: CQ-236
  - status: unverified (check: the pinned version holds no memory beyond saved sessions, the goal of a session and context files; read from the documentation shipped with the pin and from capture (5) of F138-FR-042; verified-on: —; pin: prime-agent 0.7.3)

- **F138-FR-047**: While the terms of prime are unknown (F138-FR-004), prime MUST NOT be picked automatically as a critic, whatever step of the critic order it would qualify in, and it MUST NOT be the default critic, under every audience. A consumer who names it as the critic MUST get the unknown-terms warning at launch. The critic never approves its own session: a critic-class call on prime is a fresh session and never resumes the session of a pass (F138-FR-021). The critic-diversity rule and its warning are those of feature 100 (F100-FR-024; annex E §E.1). The adapter MUST give the provider and model identity that the diversity test needs, for each role: on bare prime the model that the consumer named, and null where none was named; on `prime:<variant>` null, because the variant selects a model that the product cannot see (F138-FR-022). A null MUST never be replaced by a guess. A null on either side MUST give the result `unverified`, and the same model on both sides the result `same-model`; both MUST raise the critic-diversity warning, which MUST be recorded and MUST NOT block a run. The provider and the model that a stream states MUST be recorded with the call (F138-FR-020, F138-FR-027).
  - test: CT-138-47
  - divergence: DV-049; DV-034
  - ep: EP-02 `specstride.harness/1` (consumes)
  - parity: not reached: every fixture names the critic (row 35 of annex X §X.7); the line of the warning is not printed (row 92)

### Key Entities

- **Prime adapter**: the harness descriptor of `prime`, its code hooks and its recorded fixtures. It offers the proposer and completion levels.
- **Agent executable and launcher**: the agent executable is what the contract targets and what carries the version. The launcher is the consumer's own program that takes a variant as its first argument. The product never names one.
- **Reader**: the one reader for stream schema version 3. It turns lines into the six normalized records, the display lines and the terminal.
- **Dialect row**: one row of the dialect table. It holds the data that differs per harness of the family.
- **Terminal record**: the record that ends a stream with success or error. It decides the outcome.
- **Proof of the critic's form**: what the call record holds to show that a critic could take no action.
- **Capture**: a recorded stream or fact taken from the pinned version, kept as a fixture.
- **Auto-loaded context**: what prime loads into a call by itself: skills, extensions, context files and prompt templates.
- **Throwaway home**: the home of a call at auth tier 2, built from an overlay and removed after the call.
- **Identity for the diversity test**: the provider and the model of a role, or null where the product cannot see them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F138-SC-001**: The terminal record decides: in 100 per cent of the fixtures in which the process exits 0 after a provider error, the call ends as failed, and 0 of them end as a success; in 100 per cent of the fixtures with no terminal record the outcome is `stream.missing_terminal`.
- **F138-SC-002**: Parity of both roles and of the reader: 100 per cent of the parity tests `PT-138-*` for the 62 items give `equal`, or `waived` with a register row, on the fixture families FX-01, FX-06, FX-07, FX-18 and FX-26.
- **F138-SC-003**: One reader, two harnesses: the recorded streams of prime and of pi pass the same reader with 0 lines of reader code that branch on a dialect name, and the only difference between the two runs is the dialect row.
- **F138-SC-004**: The harness reports nothing about the consumer: in 100 per cent of the fixtures that start prime, the environment of every launched process holds the telemetry switch and the do-not-track variable.
- **F138-SC-005**: Provider and harness facts are dated: 100 per cent of the facts about prime in this specification carry a `verified-on` date and the version pin, or the status `unverified` with the check that would verify them.
- **F138-SC-006**: Containment is chosen on purpose: 100 per cent of the launches that name prime as proposer with no opt-in to C0 are refused before the first pass, and 0 passes are started in them.
- **F138-SC-007**: No critic acts: outside the `parity` profile, 100 per cent of the critic-class call records of prime hold a proof of the form; a planted tool record in a critic stream halts the run in 100 per cent of the fixtures that plant one.
- **F138-SC-008**: Quota signal: each recorded stream of a reached provider limit is classified `quota_window`, with the confidence `text`, and adds 0 to the reject count, the MALFORMED count and the error count.
- **F138-SC-009**: Coverage: 100 per cent of the 13 clusters and of the 62 items that the traceability files assign to this feature are the origin of a requirement and are proven by a test task.
- **F138-SC-010**: Nothing is loaded that nobody chose: outside the `parity` profile, 100 per cent of the proposer calls without the opt-in carry the four switches of F138-FR-044, 100 per cent of the calls at auth tier 2 see a home that is not the consumer's real home, and 0 throwaway homes are left after a call.
- **F138-SC-011**: Prime is in a role only when named: in 100 per cent of the launches that name no role, under each audience, prime is neither proposer nor critic.

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
| pi and prime share one JSONL reader with a dialect table | Ruling 32b |
| No name of a launcher, variant, model or gateway that is specific to the owner's machines appears in the specification | BRIEF-COMMON, naming rule; R9 open question 7 |
| The harness is not a sandbox: as a proposer it runs only where the consumer opted in to no containment | Rulings 34, 38, P2 |
| The terms of the harness are unknown: never a default, never picked automatically as critic, usable when named; under every audience | Rulings 60, P14 |
| Auto-loaded context and harness-native memory are off unless the consumer opts in, in user configuration; the real home is never written, and auth tier 2 uses a throwaway home | Principle VIII; rulings 36, 37 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind logical names, the test runner, bundling, the spelling of internal
functions, and the exact flags and variables of the harness with their version pin.

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements | The tested harness adapter of prime at the levels `proposer` and `completion` (first form, tool-less) |
| EP-02, sub-point stream readers | `specstride.harness/1`; `specstride.stream-dialect/1` | implements (content owner of the reader and the table) | The JSONL reader for schema version 3 and the row `prime` of the dialect table |
| EP-12 | `specstride.quota-classifier/1` | implements | The entries for the error classes of the reader |
| EP-14 | `specstride.doctor/1` | implements (an entry) | The checks of the adapter, registered as entries of the doctor's registry |
| EP-10 | `specstride.secret-resolver/1` | consumes | The credential, resolved at the moment of use |
| EP-11 | `specstride.terms/1` | consumes | The unknown-terms decision for prime |
| EP-08 | `specstride.event-sink/1` | consumes | The compatibility projection of the events of the reader |
| Redactor | `specstride.redaction/1` | consumes | Text and tool summaries |

This feature owns no extension point. It owns content: the prime descriptor, its classifier
entries, its recorded fixtures, the JSONL reader and the dialect table.

## Contracts of feature 100 used

| Contract | Annex and section | Requirements of feature 100 |
|---|---|---|
| No closed list of harnesses; the critic never approves its own session, the critic-diversity warning | A §A.5 | F100-FR-023, F100-FR-024 |
| Logical names `attempt:<N>:<k>:<n>:session`, `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:critic-invocation`, `pass:<passId>:provider-terminal`, `pass:<passId>:result`, `pass:<passId>:stream` | B §B.5 | F100-FR-053 |
| Harness port (EP-02), typed failures, guarantees of an implementation | C §C.1 | F100-FR-076 to F100-FR-083 |
| Harness descriptor | C §C.2 | F100-FR-084, F100-FR-085 |
| Forms of the `completion` level | C §C.3 | F100-FR-087 |
| Stream readers and the dialect table | C §C.5 | F100-FR-090, F100-FR-091 |
| Resolved registry and critic order | C §C.6 | F100-FR-093 |
| Event sink and compatibility projection | C §C.10 | F100-FR-104, F100-FR-105 |
| Secret resolver | C §C.11 | F100-FR-107 |
| Terms-gate data | C §C.12 | F100-FR-108 |
| Quota classifier | C §C.13 | F100-FR-109 |
| Containment levels | C §C.15 | F100-FR-111, F100-FR-112 |
| Overlay schema | C §C.16 | F100-FR-113 |
| The diversity test and its results `same-model` and `unverified` | E §E.1 | F100-FR-024 |
| Exit codes of the engine; result records (the pass 127; the critic call) | E §E.3, §E.4 | F100-FR-151, F100-FR-153 |
| Doctor check registry | G §G.7 | F100-FR-189 |
| Event envelope | X §X.1 | F100-FR-198, F100-FR-200 |
| Config envelope and trust classes | X §X.2 | F100-FR-201, F100-FR-202 |
| Redactor | X §X.4 | F100-FR-205 |
| List of closed sets, rows 39, 46, 47 | X §X.6 | F100-FR-208 |
| The `parity` profile, rows 10, 25, 26, 28, 29, 30, 34, 35, 36, 39, 79, 86, 92, 131 | X §X.7 | F100-FR-210, F100-FR-212 |
| Environment alias table; component-name table; rule N-15 | X §X.8 | F100-FR-214 |
| Threats T-07, T-17, T-34, T-35 | X §X.9 | F100-FR-216, F100-FR-218 |

Fixture families of feature 141 cited: FX-01 (`harness-prime`, `harness-prime-variant`), FX-06
(`prime-critic-error`), FX-07 (`prime-empty-variant`, the critic), FX-18 (`harness-missing-prime`,
`harness-missing-prime-launcher`, `prime-variant-with-model`, `prime-empty-variant`, the proposer;
in none of the four is the prime stub started), FX-25 (window per harness, owned by
feature 117), FX-26 (`prime-v3-<name>` for the ten as-is streams); the stub `prime` and the pi stub
(§O.3); the surfaces `exit`, `stdout`, `stderr`, `state`, `events`, `transcript` (§O.4).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. This feature adds no row of the profile. It gives the value of the
rows that name it or that its requirements use.

| Row | Switch | Key (as annex X §X.7 proposes) | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 10 | Session continuation inside a phase attempt | `carry.continuation` | On, where the harness supports it | Off; no continuation argument | DV-010 | F138-FR-008, F138-FR-014 |
| 25 | Containment level | `sandbox.level` | The strongest the harness offers (for prime, C0 by opt-in only) | As at the baseline: none | DV-030 | F138-FR-015 |
| 26 | Permission mode and argument list of each harness | `sandbox.permissionMode` | Contained, the mode always stated | As at the baseline, mapped through the argument table | DV-031 | F138-FR-008, F138-FR-010, F138-FR-016, F138-FR-017 |
| 28 | Transport and mode of the critic of each harness | `roles.critic.transport` | For prime, JSON mode | The as-is mode: text | DV-001; DV-081; DV-090 | F138-FR-017, F138-FR-018, F138-FR-020, F138-FR-022 |
| 29 | Harness-native memory | `memory.native.proposer` | Off for the critic always; off for the proposer | `as-is`: no flag about memory is passed | DV-047 | F138-FR-046 |
| 30 | Overlay of the configuration home | `harnesses.prime.overlay` (the generic `harnesses.<id>.overlay`) | Unset: follows the auth tier, the real home at Tier 1 and a throwaway home at Tier 2 | `none` | DV-002 | F138-FR-045 |
| 34 | Audience | `distribution.audience` | `distributed` | `personal` | DV-048 | F138-FR-004 |
| 35 | Automatic pick of the critic | `critic.autoPick` | On (never for this harness) | Not reached | DV-049 | F138-FR-004, F138-FR-047 |
| 36 | Default proposer and critic | `roles.proposer.harness`, `roles.critic.harness` | The default harness (never this harness) | Every fixture names both | DV-004 | F138-FR-004 |
| 39 | Quota pause | `pause.maxTotalMs` | On | Not reached: the stub emits no quota signal | DV-005 | F138-FR-039 |
| 79, 86 | Stream tap; capture of the agent stream | `stream.tap` | On | On | DV-065 | F138-FR-009 |
| 92 | Line of the critic-diversity warning | `critic.warnSameModel` | True | Not printed | DV-034 | F138-FR-047 |
| 131 | Customisations loaded into a proposer pass by themselves | `harnesses.prime.proposerCustomisations` (the generic `harnesses.<id>.proposerCustomisations`) | Off; never loaded into a critic-class call | `as-is`: no flag about customisations is passed | DV-047; DV-002 | F138-FR-044 |

Settings of this feature that are not switches of the profile. Feature 110 owns the spelling.

| Setting | Key | Source of the spelling | Value under `parity` |
|---|---|---|---|
| Agent executable | `harnesses.prime.bin` | Environment alias table of annex X §X.8 | The as-is default name |
| Launcher for a variant | `harnesses.prime.launcher` | Environment alias table of annex X §X.8; confirmed by feature 110. The table names `SPECSTRIDE_PRIME_BIN`; the first variable, `SPECSTRIDE_PRIME_FLEET_BIN`, and the order are reported (F138-FR-003) | The as-is default name |
| Capture of the agent stream | `stream.tap` | Confirmed by feature 110; owner 126; rows 79 and 86 of annex X §X.7 | On, the as-is default |
| Tool allow-list of the proposer | `harnesses.prime.tools` | Confirmed by feature 110 | Not used |
| Extra variables of the environment allow-list | `harnesses.prime.envAllow` (the generic `harnesses.<id>.envAllow`) | Confirmed by feature 110 | As the fixture sets it |
| Context window of the critic | `roles.critic.contextTokens` | The alias table, "the keys of the same meaning under `roles.critic`" | 98,304 for an unseen model |
| Opt-in to containment C0 | `sandbox.level` with the value `C0`, in user configuration only | Row 25 | Follows row 25 |
| Parallel units at a level below C2 | `loop.parallel.allow_detect`, in user configuration only | F100-FR-112 | Off |

## Closed sets

Stated as F100-FR-208 asks. The set of row 39 is owned by this feature.

| Row | Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|---|
| 39 | Dialects of the JSONL reader | The rows of the dialect table. Wave 1: `prime` (this feature) and `pi` (feature 134) | 138 | Open by data | The stream is refused |

Closed sets that this feature introduces. Owner: 138. Each needs a row in annex X §X.6.

| Closed set | Members | Closed by | Unknown value |
|---|---|---|---|
| Codes of the diagnostics of the reader | `malformed_json`, `absent_schema`, `unsupported_schema`, `unknown_record`, `provider_retry`, `provider_auth`, `provider_error`, `abandoned_tool` | Design | A consumer treats it as a warning and keeps it |
| Severities of a diagnostic | `error`, `warning` | Design | Read as `warning` |
| Reason codes of a terminal that the reader writes | `unsupported_schema`, `provider_auth`, `provider_error` (the reason `missing_terminal` is written by the seam of feature 126) | Design | Read as `provider_error` |
| Statuses of a tool record | `start`, `progress`, `end` | Design | The record is dropped with a diagnostic event |
| Words of the end of the agent | Error: `error`, `failed`, `failure`. Success: `success`, `completed`, `complete`, `ok`. Any other gives no terminal | Design | No terminal |
| Modes of a critic-class call on prime | `text`, `json` | Design | `text` |

The record types of a dialect are data of its row (F138-FR-024), not a closed set of the product.
The set of row 39 is open by data: a dialect is added as a row.

## As-is behaviour not carried

Rows of the traceability files assigned to this feature with the disposition `superseded-by` or
`dropped`: none. The 62 items are 35 `ported` and 27 `translated`, all parity items (owner ruling
32). Feature 141 §O.7 holds the rule for pi, which has no as-is behaviour. The locally registered
backend of the baseline has no row here: its items belong to feature 109.

As-is ids carried, and where:

| Cluster and items | Disposition | Requirement | Test |
|---|---|---|---|
| C-035: B-0430 | ported | F138-FR-001 | PT-138-C-035-* |
| C-052: B-0517, B-0518 | translated | F138-FR-003 | PT-138-C-052-* |
| C-053: B-0547 | translated | F138-FR-012 | PT-138-C-053-* |
| C-054: B-0572, B-0573 | translated | F138-FR-011 | PT-138-C-054-* |
| C-058: B-0692, B-0693, B-0694, B-0695, B-0696, B-0747 | ported | F138-FR-008, F138-FR-009, F138-FR-010, F138-FR-013 | PT-138-C-058-* |
| C-061: B-0827, B-0828, B-0829, B-0839 | translated | F138-FR-003, F138-FR-017, F138-FR-019 | PT-138-C-061-* |
| C-062: B-0856 | translated | F138-FR-019 | PT-138-C-062-* |
| C-066: B-0991, B-0994, B-0995 | ported | F138-FR-017, F138-FR-018 | PT-138-C-066-* |
| C-154: B-2120 | ported | F138-FR-013 | PT-138-C-154-* |
| C-168: B-2224 to B-2240 | translated | F138-FR-025 to F138-FR-036 | PT-138-C-168-* |
| C-169: B-2241, B-2242, B-2243 | ported | F138-FR-025, F138-FR-032 | PT-138-C-169-* |
| C-170: B-2244 to B-2248 | ported | F138-FR-027, F138-FR-028, F138-FR-029, F138-FR-036 | PT-138-C-170-* |
| C-171: B-2249 to B-2264 | ported | F138-FR-026 to F138-FR-035 | PT-138-C-171-* |

Lisa has a package for this harness. It is not extracted: the baseline's reader is the reference,
and Lisa's is a port of an older state of it (R1). It may be read as a reference for the mapping.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Do the exact flags of the harness belong in this specification? → A: No. The brief puts the exact flags and variables, with their version pin, in `plan.md`. The specification says what the call does, and names the argument table that holds the flags. Integrated in the introduction of the requirements. (Source: brief 138, heading 11, "What belongs in `plan.md` instead")
- Q: Does the terminal record already decide at the baseline? → A: On the structured path, yes: the baseline reconciles the producer status with the terminal of the tap, and an error terminal with exit 0 is an error; a stream with no success terminal is `missing_terminal`. What is new is the rule for the critic in JSON mode and the event name `stream.missing_terminal`. Integrated in F138-FR-038. (Source: the invocation-result module of the baseline at `9cab15d`; R9 F5; R14 EV-31)
- Q: Which of two terminals wins when a message end holds an error and the end of the agent says success? → A: The later one. The baseline replaces the held error by the success terminal, which suits a provider retry that succeeded. Integrated in F138-FR-033. (Source: the reader of the baseline, the handling of the end of the agent)
- Q: Is a record type that begins with `tool` and is not in the known set an unknown record? → A: No. The baseline handles it as a tool record and gives no diagnostic. Preserved. Integrated in F138-FR-026. (Source: the reader of the baseline)
- Q: Does the registry entry of prime name a stream format under the `parity` profile? → A: No, as the baseline entry names none, while the baseline's pass loop routes prime to its reader by the backend name. In the port the adapter routes by its dialect row. Integrated in F138-FR-001, with `assumption: CQ-151`. (Source: B-0430; the pass loop of the baseline)
- Q: Where does the opt-in to containment level C0 come from under the `parity` profile? → A: Row 25 of the profile sets the value C0, and that value stands for the opt-in. Integrated in F138-FR-015, with `assumption: CQ-149`. (Source: feature 100 annex X §X.7 row 25; F100-FR-111)
- Q: What does "fleet only" make the terms gate do? → A: Usable when the consumer names it, with the unknown-terms warning; never a default; never picked automatically as critic. It is closed by the owner. Integrated in F138-FR-004. (Source: ruling P14; CQ-015; R8v)
- Q: Which session id does a continued pass resume, given that prime has no flag to choose one? → A: The id stated by the initial record of the earlier pass, inside the session directory of the phase attempt. Where none was stated, the next pass is fresh. Integrated in F138-FR-014. (Source: R9 F10; F100 annex B §B.5 `attempt:<N>:<k>:<n>:session`)
- Q: Does the critic in JSON mode need a change of the announcement? → A: No. Outside the `parity` profile the call is in JSON mode, so the announcement `structured` is true; under `parity` the baseline's untrue case is reproduced. Integrated in F138-FR-018 to F138-FR-020. (Source: B-0994; brief 138 heading 4)
- Q: What does the port do with prime's cost, which the baseline reports under a key the old metrics do not read? → A: The projection keeps the defect for the oracle. The normalized `usage` record carries typed usage, null where the stream gives nothing. Integrated in F138-FR-035 and F138-FR-040. (Source: B-2262; R14 rule 6; EV-03, EV-17)
- Q: Which error classes does the quota classifier get from prime? → A: `provider_auth` gives `auth`; a limit with a reset time in the message gives `quota_window`, confidence `text`; the rest gives `provider_other`. Integrated in F138-FR-039. (Source: brief 138 heading 4; R9 F14; R14 B12; feature 100 annex C §C.13)
- Q: Does telemetry off need a register row? → A: Yes. The baseline sets no such variable, and the oracle compares the names of the variables the stub saw. It is register row `DV-112`. Integrated in F138-FR-041. (Source: F141-FR-011; R9 F17; R14 rule 7)
- Q: Is the version of the launcher pinned? → A: No. The launcher has no version flag; the pin is on the agent executable. Integrated in F138-FR-002. (Source: R9 Q1; brief 138 heading 4)
- Q: Which package holds the reader, given that the package graph says feature 138 decides? → A: The reader is a unit of its own inside the package of the prime adapter, and the pi adapter imports it, as the graph already allows. It is a matter of `plan.md`. (Source: feature 100 `contracts/data/package-graph.json`, rules)
- Q: Which rows of the divergence register bear on this feature? → A: Those named in the `divergence:` lines of the requirements; among them DV-090 (the prime critic in JSON mode), DV-064 and DV-112 (telemetry off). The register is cited by row, without a count. (Source: `consolidation.md` section 6)
- Q: What are the numeric caps on the size and the rate of lines that the reader enforces? → A: The sources give none for the product; the fixtures of the baseline keep each line to 4,096 bytes only as a test rule. The values are data of the dialect row, proposed in `plan.md`, recorded with the run, and a line over the cap is a `malformed_json` diagnostic that lets reading go on. Integrated in F138-FR-023. (Source: F100-FR-090; R11 T-17)
- Q: Does the proposer's stream JSON flag `-j` keep its meaning for prime? → A: Yes. At the baseline it keeps the tap on for prime even when the capture switch is false, so prime reads JSON when either is on. Integrated in F138-FR-009. (Source: baseline `proposer.sh` help text and pass loop)
- Q: Is the unknown-terms warning shown for the audience `personal` as well? → A: Yes. Unknown terms allow auth tiers 1 and 2 with a warning under both audiences; the default and the automatic pick are barred under every audience. Integrated in F138-FR-004. (Source: F100 annex C §C.12 "Unknown-value rule"; ruling P14)
- Q: Which questions could the sources not answer? → A: Four in this session, and three in the session of 2026-09-30, all listed under "Assumptions".

### Session 2026-09-30

Repairs after the cross-feature review. No question was put to a person.

- Q: Under which audience are the default and the automatic pick of prime barred? → A: Under every audience, and for both roles. Ruling P14 has no condition. Integrated in F138-FR-004 and F138-FR-047. (Source: `APPROVAL.md` ruling P14; F100-FR-093; review item W-138-02)
- Q: Does the pinned version offer a switch for each of the four kinds of auto-loaded context? → A: Yes. The help of the installed agent executable, version 0.7.3, lists a switch for skills, for extensions, for context files and for prompt templates. Their effect is `unverified` until capture (5). Integrated in F138-FR-044. (Source: the help of the agent executable, read on 2026-09-30; R9 F8)
- Q: Does the harness offer a switch for its configuration directory, so that auth tier 2 can use a throwaway home? → A: No. It has a variable for its session directory only. The overlay redirects the home variable, as the overlay schema of feature 100 allows. Whether the agent executable follows the home variable is `unverified`. Integrated in F138-FR-045, with `assumption: CQ-234`; the plan records the deviation. (Source: R9 F16; feature 100 annex C §C.16; Principle VIII; ruling 36)
- Q: What is harness-native memory of prime, and which switch turns it off? → A: Saved sessions, the goal of a session and context files, each with its switch. The help shows no switch named after memory. A memory that a capture finds and no switch turns off bars prime as critic. Integrated in F138-FR-046, with `assumption: CQ-236`. (Source: ruling 37; F100-FR-082; the recommended answer of CQ-189 for a like case)
- Q: Which identity does the diversity test get for `prime:<variant>`? → A: Null, so the result is `unverified` and the critic-diversity warning is due. Integrated in F138-FR-047. (Source: F100-FR-024; feature 100 annex E §E.1; F138-FR-022; review item W-X-17)
- Q: From which source may the opt-in to C0 and `loop.parallel.allow_detect` come? → A: User configuration only. Integrated in F138-FR-015, with `assumption: CQ-183`. (Source: rulings 34, P2; F100-FR-111; F100-FR-112)
- Q: Which of the two variables of the launcher wins? → A: `SPECSTRIDE_PRIME_FLEET_BIN`; `SPECSTRIDE_PRIME_BIN` is read when the first is unset, as the proposer and the critic of the baseline do. Integrated in F138-FR-003, with `assumption: CQ-235`, which CQ-196 and F110-FR-020 answer. (Source: the pass-loop script and the critic module of the baseline at `9cab15d`; review item W-110-03)

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place keep their ids. New requirements continue the list.

| Requirement | Item | What changed |
|---|---|---|
| F138-FR-003 | W-110-03 | The order of the two variables of the launcher is stated, as the one exception to the refusal of two differing variables; the alias table is cited |
| F138-FR-004 | W-138-02 | The default and the automatic pick are barred under every audience and for both roles; DV-049 added |
| F138-FR-005 | W-138-01 | The home of the allow-list is the home that F138-FR-045 gives; the session directory variable is in the list |
| F138-FR-006 | W-X-19 | `implements (an entry)` |
| F138-FR-015 | W-100-23 | The opt-in to C0 and `loop.parallel.allow_detect` come from user configuration only; `assumption: CQ-183` |
| F138-FR-017 | W-138-01 | Names F138-FR-046 for native memory |
| F138-FR-020 | W-138-01 | The switches for extensions and prompt templates are always carried; their existence at the pin is verified from the help |
| F138-FR-022 | W-138-03 | The citation of a requirement of feature 117 is deleted |
| F138-FR-042 | W-138-01 | Capture (5) added: the home variable, no write to the real home, none of the four kinds loaded |
| F138-FR-043 | W-X-33 | The recorded streams of pi are named through annex C §C.5 |
| F138-FR-044 | W-138-01 | New: auto-loaded context off for the proposer by default |
| F138-FR-045 | W-138-01 | New: the home per auth tier, the throwaway home at auth tier 2 |
| F138-FR-046 | W-138-01 | New: harness-native memory, recorded per run (ruling 37) |
| F138-FR-047 | W-X-17 | New: the critic-diversity rule, its warning and the identity the test needs |
| F138-FR-003, F138-FR-045, F138-FR-046 | Re-check B-8.7, pass-on (2026-09-30) | The placeholders `CQ-234` to `-3`, which the rules forbid, are renamed `CQ-234` to `CQ-236` in the `assumption:` lines, the clarifications, "Assumptions" and the plan (row VIII and Complexity Tracking). The line of F138-FR-003 cites CQ-196 and F110-FR-020, which answer CQ-235. No requirement text changed |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The seam (109), the stream tap and the registry of readers (126), the quota classifier (127), the terms gate (147) and the secret resolvers (110) exist when the adapter calls them. Each is reached through its interface contract of feature 100.
- The five captures of F138-FR-042 and the two live probes are run by the owner's authorization, outside this feature; this feature runs no paid probe.
- The hand-authored recorded streams of the baseline (Prime 0.7.1) are the reference for parity. Captures at the pin may differ, and a difference is a finding for the pin, not a parity failure.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-149 | Under the `parity` profile, does the value C0 of row 25 stand for the consumer's opt-in that F100-FR-111 requires for a proposer whose ceiling is C0? | Yes. The profile is selected by ordinary configuration, and the baseline runs with no containment | F138-FR-015 |
| CQ-150 | What are the ids of the doctor checks of a harness adapter, and which are launch-blocking? Feature 100 says each adapter registers its own; feature 112 owns the catalogue | `harness.prime.<check>`; executable, credential and containment (proposer) are `lb` | F138-FR-006 |
| CQ-151 | The baseline entry names no stream format although the pass loop reads prime through its reader. Does the registry query report the format under the `parity` profile? | No: the query reports empty, as B-0430 and FX-26 read; the adapter routes by its dialect row | F138-FR-001 |
| CQ-183 | Does "user config" in rulings 34 and P2 stand for the user configuration only? | Yes | F138-FR-015 |
| CQ-234 | The harness has no variable for its configuration directory. Is a throwaway home that is made by redirecting the home variable the throwaway home of ruling 36, and what holds if a capture shows that the agent executable does not follow the home variable? | Yes; and until capture (5) has passed, the fact is `unverified` and prime is refused at auth tier 2. If the capture fails, the refusal stays | F138-FR-045 |
| CQ-235 | Two as-is variables reach `harnesses.prime.launcher`, in an order. Does the refusal of two differing variables apply to them? | No: the order of the baseline is kept as the one exception; answered by CQ-196 (an empty first variable is read as unset) and F110-FR-020, and annex X §X.8 of feature 100 names the pair as the one exception | F138-FR-003 |
| CQ-236 | What holds if the pinned version has a memory that no switch turns off? | As the recommended answer of CQ-189: reported as null, warned, recorded per run; prime is then refused as critic | F138-FR-046 |
| CQ-152 | Feature 109 gives one generic message for a missing executable (`<component>: <executable> not found`). The as-is prime messages name the variable that sets the executable | The adapter supplies its as-is messages, and the generic message applies where an adapter supplies none | F138-FR-011 |
