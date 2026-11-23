# Feature Specification: Harness seam

**Feature Branch**: `109-harness-seam` (a label: Spec Kit creates no branch in this repository; the directory is `specs/109-harness-seam`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 109-harness-seam of Specstride: the one open harness registry; the harness port (EP-02) with its two capability levels, proposer and completion, the second in two forms (tool-less; read-only tools in an operating-system sandbox); transports as a property of a harness adapter; the harness descriptor schema v1; the generic descriptor-driven harness adapter for the kinds cli, openai-chat and anthropic-messages; the closed vocabulary of typed failures; containment levels C0 to C3 as a capability; the config-home overlay and its scope; the environment allow-list of every call; the proof of the critic's form for every critic-class call; recorded versions per harness adapter; the conformance suite that every tested harness adapter and every descriptor passes."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` (sections 2, 5, 13, 14, 17), `consolidation.md` (sections 1 and 6), `feature-briefs.md` (brief 109-harness-seam, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`, annexes A, B, C, G, X), feature 141 (`specs/141-parity-oracle/`, §O.1 to §O.7), the traceability files, and the research reports R20, R11, R1, R5, R9, R6, R29 and R29v.

## What this feature is

A harness is an agent CLI, an SDK or a model endpoint that plays the proposer or the critic. The
engine must run a pass or a critic-class call on any harness without knowing which harness it is.
This feature is the seam that makes that possible.

Feature 100 states the interface of the harness port (EP-02). This feature is its content owner:
it specifies the registry, the core side of the port, the generic harness adapter that is driven
by a harness descriptor, the conformance suite and the sample outside the core. It also specifies
what every harness call has in common: the containment level, the overlay of the configuration
home, the environment allow-list, and the proof that a critic can take no action.

**In scope**: the one open harness registry; the eight operations of the port and the two
capability levels; transports; the typed failures; the harness descriptor and its validation; the
generic harness adapter for the kinds `cli`, `openai-chat` and `anthropic-messages`; containment
levels and ceilings; the overlay of the configuration home; the environment allow-list; the two
forms of the `completion` level and the proof of each; recorded versions; the conformance suite;
the command `harness verify`.

**Out of scope**:

| Out of scope | Owner | Reached through |
|---|---|---|
| Finding harnesses, probing them, choosing proposer and critic, the critic order | 124 | Feature 100, annex C §C.6 |
| The tested harness adapters of Wave 1 | 125, 130, 131, 134, 138 | Feature 100, annex C §C.1 |
| Stream readers, invocation identity and retention | 126 | Feature 100, annex C §C.5; annex B §B.5 |
| Quota classification and what a quota class does | 127 | Feature 100, annex C §C.13 |
| The terms gate, the terms data, the audience and auth tiers as policy | 147 | Feature 100, annex C §C.12 |
| The spelling of config keys; the secret resolvers | 110 | Feature 100, annex X §X.2; annex C §C.11 |
| The list of withheld paths; moving the proposer's files out before a critic with read tools | 117 | Feature 100, annex C §C.4 |
| The scoring of a failed critic-class call as a verdict | 101 | Feature 100, annex C §C.1 "Failure of an implementation" |
| The doctor and how it shows a harness | 112 | Feature 100, annex G §G.7 |
| Harness adapters of later waves | Roadmap | — |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The engine runs any harness through one port (Priority: P1)

An operator starts a run and names a proposer and a critic. The engine runs every pass and every
critic-class call through the port. It behaves the same whatever harness stands behind the port.

**Why this priority**: Every run passes through the seam. The parity of the invocation with the
baseline is proven here.

**Independent Test**: Run fixture families FX-01 and FX-26 of feature 141 under the `parity`
profile, with stub executables named after as-is commands and with the generic stub. The
transcripts of the stubs (argument lists, names of environment variables, prompts) are equal on
both sides.

**Acceptance Scenarios**:

1. **Given** a registry with a tested harness adapter and a declared harness, **When** the engine starts a pass on either, **Then** it calls the same operations with the same inputs and receives a handle, a raw stream and a session id (F109-FR-003).
2. **Given** a harness reference that carries a qualifier on an entry that takes none, **When** the reference is resolved, **Then** it matches no entry and the message names the spellings that the registry offers (F109-FR-008).
3. **Given** a critic-class call whose process does not answer within its time limit, **When** the limit passes, **Then** the call is ended, reported once with the as-is detail text, and not tried again (F109-FR-010).
4. **Given** the text of the core packages, **When** the build runs, **Then** no harness name is found in them (F109-FR-008).

---

### User Story 2 - A consumer brings a harness as data (Priority: P1)

A consumer has a harness for which the product has no tested harness adapter. The consumer writes
a harness descriptor in user configuration. The harness then plays a role in a run.

**Why this priority**: The owner ruled that the registry is open. This story is the success
criterion that `feature-briefs.md` section D.5 assigns to this feature.

**Independent Test**: The descriptor-only fixture: a descriptor for a fake CLI and one for a fake
endpoint, both in the test tree, complete a run as proposer and as critic. No product file
differs between the build with the two descriptors and the build without them.

**Acceptance Scenarios**:

1. **Given** a valid descriptor in user configuration, **When** the registry is built, **Then** the harness is an entry with the origin `user`, and every capability carries its provenance or is null (F109-FR-014, F109-FR-004).
2. **Given** the same descriptor in project configuration, **When** a run launches, **Then** the descriptor is ignored with a launch message and a doctor warning (F109-FR-015).
3. **Given** a descriptor with an unknown top-level key, a placeholder outside the closed set or an argument list written as shell text, **When** it is loaded, **Then** it is refused and the doctor names the reason (F109-FR-014).
4. **Given** a descriptor of kind `cli` that declares no way to suppress permission prompts, **When** it is named as proposer, **Then** the launch is refused; no flag is guessed (F109-FR-016).
5. **Given** a descriptor of an endpoint kind whose address is plain and not loopback, or whose endpoint answers with a redirect, **When** a call is made, **Then** the call is refused and the secret is not sent (F109-FR-018).

---

### User Story 3 - No critic can act (Priority: P1)

The operator relies on the critic being unable to change anything. Every critic-class call proves
its form before its reply counts.

**Why this priority**: Principles II, III and IX. A critic that can act can approve work by
changing it.

**Independent Test**: The conformance suite drives a fake binary in each form. With the proof
present the call passes. With the proof absent the call is refused with `critic_not_toolless` and
the run ends with engine exit 3 and the stop reason `critic_config`.

**Acceptance Scenarios**:

1. **Given** a critic of the first form, **When** its initial record shows an empty tool list and the minted session id, **Then** the reply is accepted and the proof is recorded (F109-FR-038).
2. **Given** a critic of the first form whose initial record lists a tool or another session id, **When** the record is read, **Then** the call is refused with `critic_not_toolless` (F109-FR-038).
3. **Given** a critic of the second form, **When** the call record shows the read-only sandbox, the network off and the confirmed denial of the withheld paths, **Then** the reply is accepted (F109-FR-039).
4. **Given** a critic of the second form without the confirmation, **When** the critic was configured, **Then** it is refused; **When** it was picked automatically, **Then** it is passed over, announced and recorded (F109-FR-039).
5. **Given** a harness that is not tested, **When** it is offered in the second form or with the proof by pinned configuration, **Then** it is refused (F109-FR-037).

---

### User Story 4 - A pass is contained and leaves the consumer's environment as it was (Priority: P2)

The consumer expects that a pass runs at the strongest containment its harness offers, sees only
the variables it needs, and never writes the consumer's configuration home.

**Why this priority**: Principle VIII and threats T-07, T-15, T-34 of feature 100.

**Independent Test**: A fake binary records its environment and its home. After a run, and after a
killed pass, no overlay tree is left in the temporary directory, the real configuration home is
unchanged, and the recorded environment holds no variable outside the allow-list.

**Acceptance Scenarios**:

1. **Given** a proposer whose containment ceiling is C0, **When** the consumer did not opt in to C0 in user configuration, **Then** the launch is refused and the message names the key (F109-FR-026).
2. **Given** a call at auth tier 2 of a harness that declares an overlay, **When** the pass runs, **Then** the harness sees a throwaway home, and the tree is removed after the pass, also when the pass was killed (F109-FR-029, F109-FR-033).
3. **Given** the `parity` profile, **When** a pass runs, **Then** the overlay scope is `none`, no overlay operation does anything, and the harness runs with the environment the baseline gives it (F109-FR-029).
4. **Given** an overlay scope value other than `pass` or `attempt`, **When** a run starts, **Then** it ends with exit 3 before the spec is resolved and before the lock is taken (F109-FR-031).
5. **Given** an overlay tree whose owner no longer lives, **When** the next engine start happens, **Then** the tree is removed and one line says so (F109-FR-035).
6. **Given** an executable of a harness that lies inside the workspace, **When** the registry resolves it, **Then** it is refused (F109-FR-020).

---

### User Story 5 - An author proves a harness adapter or a descriptor (Priority: P2)

The author of a harness adapter, or of a descriptor, runs the conformance suite and learns whether
the harness meets the port.

**Why this priority**: The suite is what lets 125, 130, 131, 134 and 138 be specified against one
seam, and what keeps the core unchanged when a harness is added.

**Independent Test**: The suite passes on the sample outside the core and on every bundled
descriptor; adding or removing the sample changes no core file.

**Acceptance Scenarios**:

1. **Given** a fake binary and a fake endpoint, **When** the suite runs on a harness adapter, **Then** it asserts the argument list, standard input, the environment and the clean-up (F109-FR-042).
2. **Given** a consumer who runs `harness verify` on a declared harness, **When** the suite passes inside the budget, **Then** the command exits 0 and the result is stored with the version of the harness, the hash of the descriptor and the date (F109-FR-025).
3. **Given** a stored verification, **When** the version of the harness or the hash of the descriptor changes, **Then** the verification no longer counts (F109-FR-025).
4. **Given** a tested harness adapter whose installed harness is outside the pinned range, **When** the doctor runs, **Then** it warns; nothing is downloaded (F109-FR-041).

---

### Edge Cases

- The registry cannot be read when help is printed: help shows the as-is line that the list is unavailable and still succeeds (F109-FR-006).
- A transport needs an optional dependency that is absent: that transport is unavailable with a doctor line; the other transports of the harness adapter work (F109-FR-011).
- An operation of a harness adapter throws or runs over its time: the documented plainer path is taken and no verdict, exit code or stop reason comes from the harness adapter (F109-FR-003).
- A harness cannot switch its native memory off: it does not qualify as critic (F109-FR-022).
- A harness cannot continue a session: every pass is fresh and context is carried through files (F109-FR-004).
- An overlay cannot be created or populated: the half-made tree is removed, the pass fails and the harness is not started (F109-FR-033, F109-FR-034).
- The removal of an overlay fails: one warning line; the status of the pass does not change (F109-FR-035).
- A seed of an overlay looks like a credential, or its path leaves its directory: the declaration is refused (F109-FR-030).
- An explicit overlay scope is set for a harness that declares no overlay: a warning, and the scope is `none` (F109-FR-031).
- The version of a harness changes between two passes of one run: a warning is recorded (F109-FR-041).
- A failure that matches no entry of the `failures` map: `agent_failure` (F109-FR-009).
- A descriptor of the consumer has the id of a tested harness adapter: the consumer's entry wins as a whole, is unverified, and the doctor names the entry that lost (F109-FR-014).
- A value outside a closed set of this feature: the reader does what the table "Closed sets" says.
- The test of the sandbox assertion under the `parity` profile runs without the effective user id 0: the scenario `FX-26/root-sandbox-assertion` is a skip with its reason and never a pass, and a skip blocks a release (F109-FR-027; feature 141, F141-FR-037).
- The line for a registry that cannot be read has no reference run: the reference tree is read-only, so the line is proven by a characterization test and not by a scenario of FX-26 (F109-FR-006).

## Requirements *(mandatory)*

Every requirement follows `STAGE-B-RULES.md` section 4. A requirement with an as-is origin names
the test of the traceability files. A new requirement names a test `CT-109-<n>`, where n is the
number of the requirement; `CT-109-101` to `CT-109-104` are the characterization tests of the
behaviour extracted from Lisa. `CT-109-105` to `CT-109-107` prove success criteria: the parity of
every `PT-109-*` (SC-004), the environment that stays as it was (SC-006) and the traceability
coverage (SC-007). `CT-109-108` proves that no file of the feature holds a path, an account, a
model, a gateway or a name of the owner's machines (F109-FR-017, F109-FR-023). `CT-109-109` is the
characterization test of the as-is line for a registry that cannot be read, which no fixture of
feature 141 reaches; `CT-109-110` measures the bytes of the output that reaches a host. Fixture families are those of feature 141, §O.2. Where the
traceability files name FX-26 for an item of a declared overlay, the test cites FX-39, as feature
141 §O.2 states.

In compatibility output a message that the baseline starts with the name of an implementation
file starts with the logical component name of feature 100, annex X §X.8 (rule N-15). Such a
prefix is written `<component>` below. The word "backend" in a quoted message is an as-is literal.

### Functional Requirements

#### G1 — Registry, port, capability levels, transports, typed failures

- **F109-FR-001**: There MUST be exactly one harness registry. It MUST hold tested harness adapters, bundled harness descriptors, harnesses the consumer declared and harnesses that discovery detected, each as one entry with a unique id. Help text, error messages and every listing of harnesses MUST read the registry. Entries MUST keep a stable order: the order of registration, which is the order of display. Under the `parity` profile the registry MUST hold one entry for each stub executable that is named after an as-is command, with the roles, the qualifier form, the stream format and the overlay declaration that the baseline gives that entry; the entry of the as-is command of Claude serves the proposer and the critic, takes no qualifier, names no stream format and declares no overlay.
  - origin: 028 FR-021; C-035; B-0427
  - disposition: translated (028 FR-021); ported (B-0427)
  - test: PT-109-028FR021-*; PT-109-C-035-*
  - divergence: DV-064; DV-004
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-002**: An entry MUST declare which capability levels it offers: `proposer`, `completion` or both. Registration MUST fail when an entry declares a level and lacks an operation of that level. The level `proposer` MUST require the six capabilities P1 to P6 of the table "Capability levels", and the level `completion` the six capabilities C1 to C6. An entry that lacks one of them MUST NOT be offered for the role, and the registry MUST record which one is missing.
  - test: CT-109-2; CT-109-101
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-003**: The seam MUST offer the eight operations of feature 100, annex C §C.1, with the inputs, outputs and errors stated there, and MUST call a harness adapter through them only. Every operation MUST have a time limit, which is configuration and is recorded with the run. When an operation throws, runs over its limit or returns a value outside its result set, the seam MUST take the path of annex C §C.1 "Failure of an implementation", MUST record the degradation, and MUST NOT pass on a verdict, an exit code or a stop reason from the harness adapter. Before every call of a harness the seam MUST ask the terms gate, and MUST refuse the call unless the decision allows it at that moment.
  - test: CT-109-3
  - ep: EP-02 `specstride.harness/1` (implements); EP-11 `specstride.terms/1` (consumes)

- **F109-FR-004**: The operation `capabilities` MUST return every capability of annex C §C.1 with its provenance (`declared`, `probed`, `adapter`, `catalogue`), or null. The seam MUST never guess a value. A capability that no run has shown MUST be marked `unverified`. Where a declared and an effective context window differ, the smaller MUST be used. The capabilities `concurrentSessions` and process-level spending limit MUST be null unless a tested harness adapter declares them. A harness that does not declare continuation MUST receive the session directive `fresh` on every pass, and context is then carried through files.
  - test: CT-109-4
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: several headless processes of one harness run at once under one configuration home and one login, with separate session stores; verified-on: —; pin: harness versions of the capture, per harness adapter)

- **F109-FR-005**: The registry MUST answer three queries as internal operations that return a result record with the field `exit_code`: the names of the entries that serve a role, one per line and in registry order; the stream format of an entry, which is empty where the entry names none; and the invocation model of a harness reference. A query for the names MUST require a role, and the role MUST be one of the role registry. A query that names an unknown entry MUST return the code 1. A query for the stream format of a known entry MUST return the code 0.
  - origin: C-032; C-033
  - disposition: translated
  - test: PT-109-C-032-*; PT-109-C-033-*
  - divergence: DV-064; DV-066

- **F109-FR-006**: An entry MUST have one of the three qualifier forms, per role. The spelling of an entry MUST be: `name` for the form `none`, `name[:label]` for `optional` and `name:label` for `required`. The display of a role MUST be one line: the spellings of the entries that serve the role, joined with ` | `. When the registry cannot be read while help is printed, help MUST show the as-is line `(backend list unavailable: could not run lib/backends.py; see README "Configuration")` in compatibility output, a line of the same meaning that names the registry in default output, and MUST still succeed.
  - origin: C-034; C-035; B-0431; C-021
  - disposition: translated (C-034, B-0431); ported (C-021)
  - test: PT-109-C-034-*; PT-109-C-035-*; CT-109-109
  - divergence: DV-064
  - assumption: CQ-193 (no fixture changes the reference tree; the line for a registry that cannot be read is proven by the characterization test CT-109-109, which row B-0356 of the traceability files names as its proof)

- **F109-FR-007**: An entry that names no stream format MUST be read as raw text. An entry that declares no overlay MUST have none. The invocation model of a harness reference MUST be: the model the caller named, unless the reference also carries a qualifier, in which case no model is reported; a qualifier counts as the model only for an entry whose qualifier label says that the qualifier names provider and model.
  - origin: C-035; B-0423; B-0424; B-0432
  - disposition: translated
  - test: PT-109-C-035-*
  - divergence: DV-064

- **F109-FR-008**: A harness reference (`id` or `id:qualifier`) MUST be resolved through the registry and through nothing else. A reference with a qualifier MUST match no entry when the entry has the qualifier form `none`. There MUST be no fallback from one transport to another when a call fails. No control flow of the core MUST test a harness name: the build MUST fail when the import-boundary check or a text search finds the id of any registry entry, bundled descriptor or sample in a core package.
  - origin: 028 FR-021; C-058; B-0685; C-066; B-0993
  - disposition: translated
  - test: PT-109-028FR021-*; PT-109-C-058-*; PT-109-C-066-*; CT-109-8
  - divergence: DV-064
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-009**: The operation `classify` MUST return one member of the closed vocabulary of typed failures: `authentication_failed`, `rate_limited`, `quota_exhausted`, `context_window_exceeded`, `transport_failed`, `agent_failure`, `capability_absent`, `critic_not_toolless`. A structured code MUST win over a match on text. What matches no entry MUST be `agent_failure`. For a declared harness the `failures` map of its descriptor MUST be the only source of the classification. An authentication failure MUST be reported as such and MUST name what to fix. The typed failure MUST be handed to the quota classifier unchanged.
  - test: CT-109-9; CT-109-102
  - ep: EP-02 `specstride.harness/1` (implements); EP-12 `specstride.quota-classifier/1` (consumes)

- **F109-FR-010**: A critic-class call MUST make exactly one call of the harness and MUST NOT try again. The call MUST be bounded by a time limit in whole seconds, 300 by default, set by the key of the critic's time limit or its as-is alias `SPECSTRIDE_CRITIC_TIMEOUT`. A call of a process that passes the limit MUST be reported with the detail `<harness> critic timed out after <n>s`. A failure of the transport or of the endpoint MUST be reported with the detail `critic call failed: <error>` and an empty reply. Every other failure of the call (a time limit passed, an exit code other than 0, empty output, a missing key, an unknown harness) MUST be reported with the detail `critic call error: <error>`. The seam produces no verdict: the report is scored as feature 100, annex C §C.1 states.
  - origin: C-066; B-0989; B-1012; B-1013; B-1014; C-060; C-061
  - disposition: ported (C-066); translated (C-060, C-061)
  - test: PT-109-C-066-*; PT-109-C-060-*; PT-109-C-061-*
  - divergence: DV-027; DV-066

- **F109-FR-011**: A transport MUST be a property of a harness adapter. A harness adapter MAY offer several transports of the closed set `subprocess`, `sdk-in-process`, `direct-call`, each with its own auth tier and its own row of terms-gate data. A transport whose optional dependency is absent MUST be unavailable, with a doctor line, and MUST leave the other transports of the harness adapter as they are. A transport other than the default MUST be chosen by the consumer in user configuration, the environment or a flag only.
  - parity: `subprocess` for every harness (row 27 of annex X §X.7); the critic of each harness in its as-is transport and mode (row 28)
  - divergence: DV-001
  - test: CT-109-11
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-012**: Every process of a harness MUST start in a process group of its own. The operation `stop` MUST take one of `polite`, `terminate`, `kill` and MUST report whether the process ended. The operation `betweenPasses` MUST return one of `continue`, `stop` with the result 4, `stop` with the result 7; a failure of it MUST be read as `continue`.
  - test: CT-109-12
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-013**: A harness that is not `tested` MUST be treated as unverified: it has no version pin, its capabilities are declared or probed, and it runs at auth tier 1 or 2 only. Auth tier 3 MUST NOT be a valid value of a descriptor or of a registry entry, and a descriptor that names it MUST be refused with the reason.
  - test: CT-109-13
  - ep: EP-02 `specstride.harness/1` (implements)

#### G2 — Harness descriptor and the generic harness adapter

- **F109-FR-014**: A harness descriptor MUST be validated against the schema of feature 100, annex C §C.2, when it is loaded. The loader MUST refuse a descriptor with an unknown top-level key, with a `descriptorVersion` outside the accepted range, with an argument list that is not a list, with a placeholder outside the closed set of seven, with an id that another descriptor of the same origin holds, or with a member of a closed set that the set does not hold. Keys under `x-` MUST be ignored. `kind` and `stream.format` MUST be resolved through their registries, and a value that no registry entry matches MUST refuse the descriptor. Every refusal MUST give a doctor finding that names the descriptor and the reason. The loader MUST set `origin`. Where two sources describe the same id, one entry MUST win as a whole, in this order: the entry the consumer declared, the tested harness adapter, the bundled descriptor, the detected entry; nothing is merged, the entry that lost MUST be recorded with the reason, and an entry that comes from a descriptor of the consumer is never `tested`. The optional fields `tiers` and `session` MUST be accepted and MUST be null in the capabilities when absent.
  - test: CT-109-14
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-015**: A harness declaration, an endpoint and a secret reference MUST be accepted from user configuration, the environment, flags and the product's bundled data only. The same entry in project configuration MUST be ignored with a launch message and a doctor warning, and MUST NOT change the registry.
  - test: CT-109-15
  - divergence: DV-068
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-016**: For the kind `cli` the generic harness adapter MUST start the harness with the argument list of the descriptor and with nothing added. It MUST NOT guess a flag that suppresses permission prompts: a descriptor that declares no permission mechanism, and does not declare that none exists, MUST NOT qualify as proposer. It MUST hand the prompt over by standard input where the descriptor allows it, else by a file, else as an argument with the size limit of the descriptor, and MUST refuse a prompt above that limit before the harness starts. It MUST write the files that the descriptor names before the call and MUST remove them after it. It MUST run a critic of the first form in an empty temporary directory, which it removes after the call.
  - test: CT-109-16
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-017**: For the kinds `openai-chat` and `anthropic-messages` the generic harness adapter MUST send one prompt and read one reply. The request MUST carry no tool of any kind. The address, the model and the secret reference MUST come from the descriptor; the generic harness adapter MUST read no fixed variable name and MUST hold no name of a machine, a gateway or a model. Usage MUST come from the endpoint's own accounting and MUST be null where the endpoint reports none. The identity of the provider MUST come from the descriptor and the endpoint, never from the reply.
  - test: CT-109-17; CT-109-103; CT-109-104
  - ep: EP-02 `specstride.harness/1` (implements); EP-10 `specstride.secret-resolver/1` (consumes)

- **F109-FR-018**: A secret MUST be sent only to the host that it is bound to. A plain, unencrypted endpoint MUST be refused unless its address is loopback. A redirect MUST be refused. A free read-only request for a model list MAY carry the credential; it MUST be a read request, MUST end after 3 seconds at the latest, and the value MUST never be stored or logged. A secret MUST reach a harness by the environment or by standard input and never in an argument list.
  - test: CT-109-18
  - ep: EP-02 `specstride.harness/1` (implements); EP-10 `specstride.secret-resolver/1` (consumes)

- **F109-FR-019**: The generic harness adapter MUST hand the raw stream of a call to the stream reader that is registered for the `stream.format` of the descriptor, and MUST read no stream by itself. Where the descriptor carries `stream.mapping`, the mapping MUST be handed to the reader as data. A stream format that no reader is registered for MUST refuse the descriptor.
  - test: CT-109-19
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F109-FR-020**: The executable of a harness MUST be resolved to an absolute path at launch, with the consumer's real search path and home, before any variable of an overlay is applied. The path and the version MUST be recorded. An executable inside the workspace, or in a directory that everyone may write, MUST be refused. A path that changed since the last run MUST give a warning. When the executable is not on the search path, the pass MUST fail with the result code 127 and the message `<component>: <executable> not found`, and the harness is not started.
  - origin: C-054; B-0570; C-058; B-0683
  - disposition: translated (B-0570); ported (B-0683)
  - test: PT-109-C-054-*; PT-109-C-058-*
  - divergence: DV-066
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-021**: Where a descriptor or a harness adapter names the switch for the harness's own telemetry, every process the seam starts for that harness MUST be started with the telemetry switched off.
  - test: CT-109-21
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-022**: A descriptor MUST declare whether the harness has native memory and how it is switched off. The seam MUST switch it off for every critic-class call, and for the proposer unless the consumer opted in in user configuration. A harness that has native memory and cannot switch it off MUST NOT qualify as critic. The setting MUST be recorded per run.
  - divergence: DV-047
  - parity: no flag about memory is passed, as at the baseline (row 29 of annex X §X.7)
  - test: CT-109-22
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-023**: The product MUST ship a small set of harness descriptors as data, with the origin `bundled`. A bundled descriptor MUST pass the same validation and the same conformance suite as a descriptor of the consumer. No bundled descriptor MUST hold a path, an account, a model, a gateway or a name that is specific to one machine. Removing a bundled descriptor MUST change no code. A bundled descriptor MUST be read by its logical name `package:harness:<id>` (feature 100, annex B §B.5).
  - test: CT-109-23

- **F109-FR-024**: Every harness adapter, and the generic harness adapter for every descriptor, MUST register three doctor checks with stable ids: whether the executable or the endpoint is present, whether the credential of the role is present and not refused, and whether the version is inside the pinned range. For a harness that is not `tested` the third check MUST report that no pin exists. No check MUST make a paid call or read a secret value.
  - test: CT-109-24
  - ep: EP-14 `specstride.doctor/1` (implements (an entry))

- **F109-FR-025**: The command `harness verify` MUST run the conformance suite on one harness of the registry, live, only on request and inside a budget that the consumer states. It MUST exit 0 when the suite passed, 2 when it failed, and 3 on a usage error or an unknown harness. It MUST store the result with the version of the harness, the hash of the descriptor and the date, as the record `specstride.harness-verify/1` at the logical name `user:harness-verify:<id>`, with the field names of the owner that feature 100, annex B §B.20 names for that schema: `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`. It MUST write no field under another name. A stored result MUST stop counting when the version or the hash changes. The command MUST refuse to run without a stated budget.
  - test: CT-109-25
  - parity: not used (no fixture runs the command)
  - assumption: CQ-063 (the unit and the spelling of the budget of `harness verify`)

#### G3 — Containment, overlay, environment, the two forms of the critic

- **F109-FR-026**: Containment MUST be a capability with the four levels C0, C1, C2, C3 of feature 100, annex C §C.15. Every harness adapter and every descriptor MUST declare its ceiling with provenance; a ceiling that no run has shown MUST be `unverified`. The seam MUST run a pass at the strongest level that is available, which is C2 where the harness offers it and else C1. C0 MUST need an opt-in in user configuration only: the opt-in MUST NOT be accepted from the environment, from a flag or from project configuration. A proposer whose ceiling is C0 MUST be refused at launch without it, with a message that names the key. C3 MUST be detected and never created. The level MUST be announced and recorded for every run, and at C0 and C1 the record MUST say `protection=detect`.
  - divergence: DV-030
  - parity: as at the baseline: none (row 25 of annex X §X.7)
  - test: CT-109-26
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-183 ("user config" in ruling 34 means the user configuration only)
  - status: unverified (check: on macOS a harness that declares C2 denies a write outside its write root; verified-on: —; pin: macOS version and harness version of the runner)

- **F109-FR-027**: Outside the `parity` profile the seam MUST never assert a sandbox to a harness by itself. Under the `parity` profile, when the run has the effective user id 0 and the variable `IS_SANDBOX` is unset or empty, the seam MUST hand `IS_SANDBOX=1` to the harness, as the baseline does, and the engine log MUST carry the as-is note `  note     : root + IS_SANDBOX unset -> auto-set IS_SANDBOX=1`.
  - origin: C-007; B-0067; C-052; B-0497
  - disposition: translated
  - test: PT-109-C-007-*; PT-109-C-052-*
  - divergence: DV-030; DV-027
  - parity: on (row 25 of annex X §X.7)

- **F109-FR-028**: The environment of every call of a harness MUST be an allow-list: the search path, the locale, the home or its overlay, the harness's own auth variables, and the variables that `isolation.envAllow` of the descriptor names. No other variable of the consumer MUST reach the harness. The credentials of the critic MUST never be in the environment of the proposer, and the reverse. Under the `parity` profile the allow-list MUST be the set of variables that the baseline hands to the harness, so that the names the stub saw are equal on both sides.
  - test: CT-109-28
  - parity: the variables the baseline hands over
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-029**: At auth tier 1 a call MUST use the consumer's real configuration home, MUST never write it, and MUST switch off the plugins, host hooks, skills and tool servers of the harness. At auth tier 2 a call MUST use a throwaway home built from the overlay of the entry; where a declared harness declares no overlay, the call runs against the consumer's configuration home, the doctor says so, and the run record holds it. Credentials MUST never be copied between homes. With the overlay scope `none` every overlay operation MUST do nothing: no process is started for it, and the harness runs with the environment the consumer gave.
  - origin: 028 FR-028; C-058; B-0680
  - disposition: translated (028 FR-028); ported (B-0680)
  - test: PT-109-028FR028-*; PT-109-C-058-*
  - divergence: DV-002
  - parity: overlay scope `none` (row 30 of annex X §X.7)
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-030**: An overlay declaration MUST follow these rules, and a declaration that breaks one MUST be refused with a configuration error. The key is the id of the entry without a qualifier, in lower-case letters and digits, starting with a letter. Only the fields `vars` and `seeds` are allowed. `vars` is a list that is not empty, of names in upper-case letters, digits and underscores, without a duplicate. The names `PATH`, `PWD`, `SHELL`, every variable of the author or committer identity of git, and every name that starts with `SPECSTRIDE_` are reserved. A seed has exactly a variable, a path and a content; the variable is declared; the path is relative and has no empty part, no `.` and no `..`; no two seeds name the same file. A seed whose content looks like a credential (it names an api key, a secret, a token, a password, a bearer or an authorization, in any case) is refused. A harness adapter that keeps an overlay of its own for its configuration home MUST refuse a declaration for its entry. When the declarations cannot be read, the table MUST be empty, every entry MUST have the scope `none`, and the operation MUST succeed.
  - origin: 028 FR-028; C-031; B-0402; B-0403; B-0405; B-0406; B-0407; B-0408
  - disposition: translated (028 FR-028); ported (C-031)
  - test: PT-109-028FR028-*; PT-109-C-031-*

- **F109-FR-031**: The overlay scope of an entry MUST come from the key of the overlay scope of that harness, whose as-is alias is `SPECSTRIDE_<NAME>_OVERLAY` with the upper-case id of the entry; an id whose upper-case form is no valid variable name has no alias. The value MUST be validated for every entry: anything other than unset, empty, `pass` or `attempt` MUST end the run with the message `<VAR>='<v>' is invalid; accepted values: pass, attempt` and exit 3, before any phase attempt, before the spec is resolved and before the lock is taken. An entry without a declaration MUST have the scope `none`; when a valid explicit value is set for it, the line `specstride: warning: <VAR> is set but backend '<id>' has no overlay; ignoring it` MUST be printed on standard error. An entry with a declaration MUST have the value, or `pass` when the value is unset or empty. The scope MUST be resolved once, before the first pass, together with the sweep of F109-FR-035 and the validation of F109-FR-030. The pass loop MUST ask for the scope `attempt` when the start-up resolved it and for `pass` otherwise.
  - origin: 028 FR-028; C-007; B-0059; C-009; C-027; C-030; B-0399; C-031; B-0409; B-0410; C-052; B-0511; C-058; B-0758
  - disposition: translated (028 FR-028, C-007, C-027, C-052); ported (C-009, C-030, C-031, C-058)
  - test: PT-109-028FR028-*; PT-109-C-007-*; PT-109-C-009-*; PT-109-C-027-*; PT-109-C-030-*; PT-109-C-031-*; PT-109-C-052-*; PT-109-C-058-*
  - divergence: DV-027

- **F109-FR-032**: An overlay tree MUST be built in the temporary directory of the system, under a generated name, in this order. First the marker, written atomically, with the schema id `specstride-overlay/v1`, the id of the entry, the scope word, the process id of the owner, the start time of that process, the time of creation and the variables. Then one directory per declared variable, readable by the owner only; the variable is set to that path for the harness. Then the seeds, each created exclusively, readable and writable by the owner only, with parent directories readable by the owner only; a seed whose real path leaves the directory of its variable is refused. When the declaration overlays the home, every base directory variable for configuration, data, cache and state that the declaration does not overlay MUST be unset for the harness. The variable for the global git configuration MUST always be set to a file inside the tree. The consumer's git identity MUST be resolved in the real environment, the specific key first and the general key second, and handed over as the author and committer variables; an identity MUST never be invented, and a variable that is already exported MUST be left as it is. The environment record of the tree MUST hold, in this order: every unset, one set per declared variable, the global git configuration, the git identity. A reader of the record MUST accept the two kinds `unset` and `set` and MUST treat every other kind as an error.
  - origin: C-029; C-031; B-0404; B-0412; B-0413; C-052; B-0512; C-056; B-0623
  - disposition: translated (C-029, C-052, C-056); ported (C-031)
  - test: PT-109-C-029-*; PT-109-C-031-*; PT-109-C-052-*; PT-109-C-056-*
  - divergence: DV-006; DV-027
  - assumption: CQ-064 (the fields of the owner and of the time of creation of the marker; feature 100, annex C §C.16 now lists them as `ownerPid`, `ownerStart`, `createdAt`)
  - status: unverified (check: on macOS the modes of the directories and files of an overlay and the start time of a process read as on Linux; verified-on: —; pin: macOS version of the runner)

- **F109-FR-033**: With the scope `pass` a fresh overlay MUST be created and populated before each pass and removed after the supervision of the pass has returned; after every pass the seam MUST also remove the overlays of scope `pass` that a killed pass of this owner left behind. With the scope `attempt` one overlay MUST be created before the first pass and used by every pass of the invocation of the pass loop, and MUST be removed when that invocation ends. The environment of an overlay MUST reach the process tree of the harness only, and never the pass loop, a watchdog or the stream tap. When populating fails, the half-made tree MUST be removed and the pass MUST fail without the harness being started. Releasing an overlay MUST always succeed: a failed removal prints a warning and never changes the status of the pass. When the pass loop ends with a scope other than `none`, it MUST first end the process tree of the pass in flight (a request to terminate, then a kill after at most 10 seconds) and then remove every overlay it owns.
  - origin: C-056; B-0622; C-058; B-0681; B-0682; B-0684; B-0759; B-0767
  - disposition: translated (C-056); ported (C-058)
  - test: PT-109-C-056-*; PT-109-C-058-*
  - divergence: DV-006

- **F109-FR-034**: The overlay operations `scope`, `populate`, `remove`, `reap`, `sweep` and `startup` MUST be internal operations of the harness layer, each returning a result record whose field `exit_code` carries the code of the as-is process. `scope` and `startup` return 3 for an invalid declaration or scope value, with the error on standard error; `scope` takes a quiet mode that suppresses the warning of F109-FR-031; `startup` sweeps, validates and returns the scope word. `populate` fills an existing empty directory for a scope, an owner and a working directory, and returns 1 on failure after the message `<component>: could not create overlay for backend '<id>' in <dir>: <cause>`. `remove`, `reap` and `sweep` always return 0. When the directory of an overlay cannot be created, the message MUST carry the cause `mktemp failed` and the pass MUST fail. The pass loop MUST end with the code of `startup` when `startup` fails (3, or 1 for an internal failure), after the fast exit on existing phase evidence and before the first pass. It MUST end with 1 when the overlay of scope `attempt` cannot be created or populated. With an overlay of scope `attempt`, and with no other scope, an interrupt MUST end the pass loop with 130 and a request to terminate with 143, both through the clean-up of F109-FR-033.
  - origin: C-026; C-028; C-054; B-0579; B-0580; B-0581; B-0582; B-0583; C-057
  - disposition: translated
  - test: PT-109-C-026-*; PT-109-C-028-*; PT-109-C-054-*; PT-109-C-057-*
  - divergence: DV-066

- **F109-FR-035**: `sweep` and `reap` MUST look only at real directories in the real temporary directory whose name marks them as overlays of the product, that belong to the current user, and that hold a valid marker. `sweep` MUST remove the overlays whose owner no longer lives. `reap` MUST remove the overlays of one owner without a test of liveness, and MAY be limited to one scope. An owner lives when its process exists, or exists and may not be signalled, and the recorded start time is null, cannot be read, or equals the present one. For every tree that the sweep at start-up removes, the line `specstride: removed stale overlay <root> (owner <pid> gone)` MUST be printed on standard error. Removal MUST try each entry that fails once more after making it writable, MUST never raise, and MUST unlink a link without following it. For a removal that still fails, exactly one line `specstride: warning: could not remove overlay <root>: <cause>` MUST be printed.
  - origin: C-030; B-0400; B-0401; C-031; B-0411; B-0415; B-0416; B-0417
  - disposition: ported
  - test: PT-109-C-030-*; PT-109-C-031-*
  - status: unverified (check: on macOS the liveness of an owner is read from the process id and the start time as on Linux; verified-on: —; pin: macOS version of the runner)

- **F109-FR-036**: A critic-class call of an entry that declares an overlay MUST run in an overlay of its own, created for that call with the scope word `critic` and removed when the call ends, also when the call fails or passes its time limit. The configured overlay scope MUST NOT be read for it. A declaration error or an overlay error of such a call MUST be reported as a failure of the call under F109-FR-010.
  - origin: C-031; B-0414; C-066; B-0992
  - disposition: ported
  - test: PT-109-C-031-*; PT-109-C-066-*
  - assumption: CQ-064 (the scope word `critic` is a member of row 129 of feature 100, annex X §X.6, the scope words of a marker, and not of row 88, the configured scopes)

- **F109-FR-037**: The level `completion` MUST have exactly two forms: `tool-less` and `read-only-tools`. The form MUST be fixed per entry of the role plan before the call. The second form, and the proof by pinned configuration of F109-FR-038, MUST be open to a tested harness adapter only. No critic path MUST ever receive a flag or a mode that allows all tools. A critic-class call MUST run on a model whose context window is known with its source; there MUST be no default window for an unknown model.
  - divergence: DV-081
  - parity: the critic of each harness in its as-is transport and mode (row 28 of annex X §X.7)
  - test: CT-109-37
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-038**: A critic-class call of the first form MUST be refused unless its initial record shows an empty tool list and the session id that the seam minted for the call. For a harness whose stream has no initial record the proof MUST be by pinned configuration: the installed version equals the exact version pin of the tested harness adapter, the preflight of that harness adapter passed, and the call ran with the flag set of the first form of that harness adapter (feature 100, F100-FR-230, third way). This proof, with the pin and the flag set of the call, MUST be recorded as the weaker proof for every call that rests on it. Until 2026-09-30 it was a recorded deviation from the text of Principle IX, which asks for the proof from the harness's own initial record; the owner has since ruled on CQ-182, Principle IX v3.0.1 names this weaker proof, and `plan.md` keeps its deviation row only until the first implementation slice (Complexity Tracking). Every other result MUST be the typed failure `critic_not_toolless`, a critic configuration error that halts the run (engine exit 3, stop reason `critic_config`). A reply of a refused call MUST NOT be read.
  - test: CT-109-38
  - ep: EP-02 `specstride.harness/1` (implements)
  - assumption: CQ-182 (the weaker proof is allowed for a tested harness adapter only; if the owner answers otherwise, the second and third sentence of this requirement are removed and a harness whose stream has no initial record is refused as critic)
  - status: unverified (check: one live critic call per tested harness shows an initial record with an empty tool list; a paid probe, logged, run by the harness adapter's feature; verified-on: —; pin: harness versions of the probe)

- **F109-FR-039**: A critic-class call of the second form MUST be refused unless its call record shows the read-only sandbox mode, the network off, and the confirmation of the harness adapter that the withheld paths of feature 100, annex C §C.4 cannot be read. The confirmation MUST be given before the call. Without it a configured critic MUST be refused with `critic_not_toolless`, and an automatically picked one MUST be passed over for the next candidate, announced and recorded. Every act of such a critic to write or to reach the network MUST be refused and MUST be recorded as refused.
  - divergence: DV-081
  - test: CT-109-39
  - ep: EP-02 `specstride.harness/1` (implements)
  - status: unverified (check: the read-only sandbox of the first harness of this form denies reads of the withheld paths inside and outside the working tree; a fixture capture of the harness adapter's feature; verified-on: —; pin: version of that harness at the capture)

- **F109-FR-040**: For every critic-class call the seam MUST write into the invocation record of the call: the form, the kind of proof (`initial-record`, `pinned-configuration`, `read-only-sandbox`), the result of the proof, and for the second form the sandbox mode, the state of the network and the confirmation. For every run the seam MUST record the containment level of each role.
  - test: CT-109-40
  - ep: EP-02 `specstride.harness/1` (implements)

#### G4 — Recorded versions and the conformance suite

- **F109-FR-041**: A tested harness adapter MUST be a harness descriptor plus optional code, with a version range and a `verified-on` date. Every pass and every critic-class call MUST record the version of the harness it ran, and null where the harness states none; a version MUST never be guessed. The doctor MUST warn when the installed version is outside the range. A change of the version between two passes of one run MUST give a warning. The product MUST never install, vendor or download a harness, also not to reach a pin.
  - test: CT-109-41
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-042**: There MUST be one conformance suite of the harness port, published in the test kit. With a fake binary and a fake endpoint it MUST assert, for every operation: the argument list, standard input, the names and values of the environment, the working directory, the process group, and the clean-up of every file, directory and overlay the call made. It MUST call no paid and no external service. Every tested harness adapter, every bundled descriptor and the sample outside the core MUST pass it in the build. A consumer MUST be able to run it on a descriptor on request (F109-FR-025).
  - test: CT-109-42
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-043**: The test tree MUST hold the descriptor-only fixture: a descriptor for a fake CLI and one for a fake endpoint. With them a run MUST complete with the first as proposer and the second as critic, and again with the first as critic. No file of the product MUST differ between the build with the two descriptors and the build without them, and the build MUST fail if a core file names either.
  - test: CT-109-43
  - ep: EP-02 `specstride.harness/1` (implements)

- **F109-FR-044**: The conformance suite MUST hold a part for the second form: a fake binary that declares a read-only sandbox passes with the confirmation of the read denial and is refused without it; its try to write and its try to reach the network are recorded as refused.
  - test: CT-109-44
  - ep: EP-02 `specstride.harness/1` (implements)

### Capability levels

| Level | Id | Capability |
|---|---|---|
| `proposer` | P1 | The harness runs without interaction and ends by itself |
| `proposer` | P2 | It takes the prompt by standard input, by a file, or as an argument with a declared size limit |
| `proposer` | P3 | It works in a given directory, writes files and runs commands there, without asking |
| `proposer` | P4 | It has a declared way to suppress permission prompts, or declares that none exists |
| `proposer` | P5 | It gives an exit code |
| `proposer` | P6 | Its credential can be checked before the first pass without a paid call, or it declares that no such check exists, which gives a doctor warning |
| `completion` | C1 | One prompt in, one text reply out |
| `completion` | C2 | No tools, by construction or by a declared mechanism that is proven per call; or the second form |
| `completion` | C3 | A known context window in tokens, with its source |
| `completion` | C4 | A fresh session on every call |
| `completion` | C5 | Typed failures for at least authentication, rate limit or quota, and context overflow |
| `completion` | C6 | An identity of provider and model |

### Key Entities

| Entity | What it is |
|---|---|
| Harness registry | The one set of entries of a process. Filled at process start, read-only after launch. What a run resolved from it is the record `run:<runId>:registry` of feature 100, which feature 124 writes |
| Registry entry | One harness: id, origin, roles with their qualifier forms, capability levels, stream format, overlay declaration, transports, containment ceiling |
| Harness descriptor | The data that lets the generic harness adapter drive a harness (`user:harness:<id>`, or `package:harness:<id>` for a bundled descriptor) |
| Tested harness adapter | A descriptor plus optional code, with a version range and a `verified-on` date |
| Transport | The way a harness adapter reaches its harness, with its own auth tier and terms row |
| Overlay declaration | The variables and seeds of a throwaway configuration home of one entry |
| Overlay tree | One built overlay (`overlay:<id>:tree`): marker, environment record, one directory per variable, seeds |
| Proof of the critic's form | What a critic-class call shows before its reply counts; recorded in `attempt:<N>:<k>:<n>:critic-invocation` |
| Verification result | The stored result of `harness verify` (`user:harness-verify:<id>`, schema id `specstride.harness-verify/1`). This feature writes it; the owner of the schema is the feature that annex B §B.20 names |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F109-SC-001**: A harness the product has no tested harness adapter for completes a run as critic from a descriptor alone: the descriptor-only fixture passes, and the number of product files that differ between the build with the fixture's descriptors and the build without them is 0. (The criterion of `feature-briefs.md` section D.5; discovery of that harness is measured in 124 and its display as unverified in 112.)
- **F109-SC-002**: The core names no harness: the import-boundary check and the text search find 0 ids of registry entries, bundled descriptors or samples in the core packages.
- **F109-SC-003**: No critic can act: 100 per cent of the critic-class call records of all fixtures show an empty tool list, or the proof by pinned configuration, or the read-only sandbox with the network off and the read denial confirmed; 0 replies are read from a call without proof.
- **F109-SC-004**: Parity: 100 per cent of the parity tests `PT-109-*` give `equal` or `waived` with a register row, on the fixture families FX-01, FX-05, FX-06, FX-11, FX-21, FX-26 and FX-39.
- **F109-SC-005**: Conformance: 100 per cent of the tested harness adapters of the build, of the bundled descriptors and of the samples pass the conformance suite, with 0 paid or external calls.
- **F109-SC-006**: The consumer's environment stays as it was: over all fixtures a fake binary sees 0 variables outside its allow-list, the real configuration home has 0 changed files after a run at auth tier 1, and 0 overlay trees remain after a run, a killed pass included.
- **F109-SC-007**: 100 per cent of the 21 clusters and of the two as-is requirements that the traceability files assign to this feature with a kept disposition are the origin of a requirement and are proven by a test task.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| The seam is designed for every harness; the named harnesses are a starting point and not a boundary | Decisions 13, 17 |
| The product never installs, vendors or downloads a harness | Constitution, additional constraints |
| The Agent SDK is an optional dependency of one harness adapter, never bundled, with API keys only. The seam sees one more transport | Rulings 20, 70 |
| Project configuration never widens: a harness declaration, an endpoint and a secret reference come from user scope, the environment or flags | Ruling 35 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind logical names, the test runner, bundling, and the spelling of
internal functions.

## Extension points

| EP | Id and version | Relation | What this feature does |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | implements (content owner) | The registry, the core side of the port, the generic harness adapter, the conformance suite, the sample outside the core |
| EP-10 | `specstride.secret-resolver/1` | consumes | Resolves the credential of a call at the moment of use and asks for the bound host |
| EP-11 | `specstride.terms/1` | consumes | Asks the terms gate before every call; each transport has its own row |
| EP-12 | `specstride.quota-classifier/1` | consumes | Hands over the typed failure; the `failures` map of a descriptor is a Wave 1 implementation of the classifier, whose entries this feature validates |
| EP-14 | `specstride.doctor/1` | implements (an entry) | Registers the checks of executable or endpoint, credential and version per harness in the registry of doctor checks, which feature 112 owns |

Sub-points of EP-02 that this feature consumes and does not own: the stream readers (126,
annex C §C.5) and role resolution (124, annex C §C.6).

## Contracts of feature 100 used

| Contract | Annex and section | Requirements of feature 100 |
|---|---|---|
| Layering rules; the import rule for the core | A §A.2, §A.3 | F100-FR-001, F100-FR-006, F100-FR-012 |
| Common rules of extension points | A §A.4 | F100-FR-013 to F100-FR-021 |
| No closed list of harnesses | A §A.5 | F100-FR-023 |
| Logical names `user:harness:<id>`, `package:harness:<id>`, `user:harness-verify:<id>`, `overlay:<id>:tree`, `pass:<passId>:prompt-transfer`, `pass:<passId>:invocation`, `attempt:<N>:<k>:<n>:critic-invocation`, `run:<runId>:registry` | B §B.5 | F100-FR-053 |
| Harness port (EP-02) | C §C.1 | F100-FR-076 to F100-FR-083 |
| Harness descriptor | C §C.2 | F100-FR-084 to F100-FR-086 |
| Forms of the `completion` level | C §C.3 | F100-FR-087, F100-FR-088 |
| Withheld paths | C §C.4 | F100-FR-089 |
| Stream readers | C §C.5 | F100-FR-090 |
| Resolved registry and role plan | C §C.6 | F100-FR-092, F100-FR-094 |
| Secret resolver (EP-10) | C §C.11 | F100-FR-107 |
| Terms-gate data (EP-11) | C §C.12 | F100-FR-108 |
| Quota classifier (EP-12) | C §C.13 | F100-FR-109 |
| Containment levels | C §C.15 | F100-FR-111 |
| Schema id `specstride.harness-verify/1` and its owner | B §B.20 | F100-FR-227 |
| Overlay schema `specstride-overlay/v1` | C §C.16 | F100-FR-113 |
| Exit codes of the engine; result records | E §E.3, §E.4 | F100-FR-151, F100-FR-153 |
| The command `harness verify` and its exit codes | G §G.1, §G.4 | F100-FR-186 |
| Doctor check registry (EP-14) | G §G.7 | — |
| Event envelope | X §X.1 | F100-FR-198, F100-FR-200 |
| Config envelope and trust classes | X §X.2 | F100-FR-201, F100-FR-202 |
| List of closed sets, rows 26, 28 to 33, 35 to 37, 43, 87, 88, 123 to 131 | X §X.6 | F100-FR-208 |
| The `parity` profile, rows 25, 27, 28, 29, 30 | X §X.7 | F100-FR-210, F100-FR-212 |
| Environment alias table; component-name table; rule N-15 | X §X.8 | F100-FR-214 |
| Threats T-07, T-13 to T-16, T-34, T-48 | X §X.9 | F100-FR-216, F100-FR-218 |

Fixture families of feature 141 cited: FX-01, FX-05, FX-06, FX-11, FX-21, FX-26, FX-39 (§O.2);
the generic stub `stub-harness` (§O.3); the surfaces `exit`, `stdout`, `stderr`, `state`,
`events`, `transcript`, `processes`, `home` (§O.4).

## Rows of the `parity` profile

Stated as F100-FR-212 asks. This feature adds no row.

| Row | Switch | Key (annex X §X.7) | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 25 | Containment level | `sandbox.level` | The strongest the harness offers | As at the baseline: none | DV-030 | F109-FR-026, F109-FR-027 |
| 27 | Transport of a harness adapter | `harnesses.<id>.transport` | `subprocess` | `subprocess` | — | F109-FR-011 |
| 28 | Transport and mode of the critic of each harness | `roles.critic.transport` | Per harness | The as-is transport and mode | DV-001; DV-081; DV-090 | F109-FR-011, F109-FR-037 |
| 29 | Harness-native memory | `memory.native.proposer` | Off for the critic always; off for the proposer | No flag about memory is passed | DV-047 | F109-FR-022 |
| 30 | Overlay of the configuration home | `harnesses.<id>.overlay` | Unset: follows the auth tier, the real home at Tier 1 and a throwaway home at Tier 2 | Overlay scope `none` | DV-002 | F109-FR-029, F109-FR-031 |

Settings of this feature that are not switches of the profile. Feature 110 owns the spelling.

| Setting | Key | Source of the spelling | Value under `parity` |
|---|---|---|---|
| Overlay scope of a harness | `harnesses.<id>.overlay`, the key of row 30 | Annex X §X.7, row 30; the alias in the environment alias table of annex X §X.8 | `none` by row 30; the as-is alias as the fixture sets it, unset in every family but FX-39 |
| Executable of a harness | `harnesses.<id>.bin` | Environment alias table | As the fixture sets it |
| Time limit of a critic-class call | `roles.critic.timeoutSec` | The key list of feature 110, reached through annex X §X.2 and the alias table of §X.8 | 300, the default of the baseline |
| Opt-in to containment C0 | `sandbox.level` with the value `C0`, in user configuration only: not the environment, not a flag, not project configuration (F100-FR-111; `assumption: CQ-183`) | Row 25 | Follows row 25 |
| Budget of `harness verify` | An argument of the command, not a key | Annex G §G.1; the unit is CQ-063 | Not used |

## Closed sets

Stated as F100-FR-208 asks. Rows are those of feature 100, annex X §X.6.

| Row | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 26 | Containment levels | C0, C1, C2, C3 | Design | Read as C0 |
| 28 | Forms of the `completion` level | `tool-less`, `read-only-tools` | Owner decision | `critic_not_toolless` |
| 29 | Tool-less mechanism of a descriptor | `structural`, `flag`, `config`, `none` | Design | `none` |
| 30 | Transports of a harness adapter | `subprocess`, `sdk-in-process`, `direct-call` | Design | The transport is unavailable |
| 32 | Placeholders of a descriptor | `{prompt}`, `{promptFile}`, `{workdir}`, `{emptyTmp}`, `{model}`, `{sessionId}`, `{file:<name>}` | Design | The descriptor is refused |
| 33 | Provenance of a capability | `declared`, `probed`, `adapter`, `catalogue` | Design | The value is read as null |
| 35 | Origin of a descriptor | `adapter`, `bundled`, `user`, `detected` | Design | The descriptor is refused |
| 36 | Typed failures of the harness port | `authentication_failed`, `rate_limited`, `quota_exhausted`, `context_window_exceeded`, `transport_failed`, `agent_failure`, `capability_absent`, `critic_not_toolless` | Design | `agent_failure` |
| 37 | Outcomes of `betweenPasses` | `continue`; `stop` with 4; `stop` with 7 | Design | `continue` |
| 43 | Cost classes | `subscription`, `metered`, `local`, `unknown` | Design | `unknown` |
| 87 | Auth schemes of a descriptor | `bearer`, `x-api-key`, `none` | Design | The descriptor is refused |
| 88 | Scopes of an overlay | `none`, `pass`, `attempt` | Design | Configuration error (exit 3) |

Closed sets that this feature introduced. Owner: 109. Feature 100 holds them as rows 123 to 131
of annex X §X.6.

| Row | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 123 | Capability levels | `proposer`, `completion` | Design | The entry is refused at registration |
| 124 | Qualifier forms of an entry | `none`, `optional`, `required` | Design | The entry is refused at registration |
| 125 | Modes of `stop` | `polite`, `terminate`, `kill` | Design | Read as `terminate` |
| 126 | Session directives | `fresh`, `continue` | Design | Read as `fresh` |
| 127 | Ways to hand over a prompt | `stdin`, `file`, `argument` | Design | The descriptor is refused |
| 128 | Kinds of proof of the critic's form | `initial-record`, `pinned-configuration`, `read-only-sandbox` | Owner decision | `critic_not_toolless` |
| 129 | Scope words of an overlay marker | `pass`, `attempt`, `critic` | Design | The tree is not an overlay of the product: `sweep` and `reap` leave it alone |
| 130 | Kinds of record of the environment record of an overlay | `unset`, `set` | Design | The pass fails with the result code 1 |
| 131 | Results of `harness verify` (the field `outcome` of the stored result) | `passed`, `failed` | Design | Read as `failed` |

Open sets: the kinds of a descriptor (Wave 1: `cli`, `openai-chat`, `anthropic-messages`), the
stream formats (owner 126) and the roles (owner 124), each resolved through its registry (row 31).

## As-is behaviour not carried

Rows of the traceability files that are assigned to this feature with the disposition
`superseded-by`. The owner approved each (ruling K8). One registry entry of the baseline is a
locally registered backend; its name appears nowhere. A consumer who has such a harness declares
it in the registry by a descriptor.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 028 SC-007 | No shipped registry entry declares an overlay; runs use the operator's real environment | DV-002 |
| B-0425 (C-035) | The registry holds exactly five entries | DV-064 |
| B-0429 (C-035) | The entry of a locally registered backend: roles and qualifier | DV-064 |
| B-0519, B-0520 (C-052) | The two variables that name the inner backend and the defining file of a locally registered backend | DV-064 |
| B-0574 (C-054) | A pass of a locally registered backend returns 127 when its defining file is missing | DV-064 |
| B-0697 (C-058) | How a locally registered backend is called as proposer | DV-064 |
| B-0815, B-0816, B-0834, B-0835, B-0836, B-0837, B-0838 (C-061) | The variables of the critic of a locally registered backend: defining file, sandbox assertion, transport, inner backend, address, key and model of its gateway | DV-064 |
| B-0905, B-0906, B-0907, B-0908, B-0909 (C-066) | Context windows of locally routed models, and the default window for a model that is not recognised | DV-064 |
| B-0982 (C-066) | How the critic of a locally registered backend is called | DV-064 |

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 FR-021 | translated | F109-FR-001, F109-FR-008 | PT-109-028FR021-* |
| 028 FR-028 | translated | F109-FR-029, F109-FR-030, F109-FR-031 | PT-109-028FR028-* |
| C-007: B-0059, B-0067 | translated | F109-FR-031, F109-FR-027 | PT-109-C-007-* |
| C-009: B-0115 | ported | F109-FR-031 | PT-109-C-009-* |
| C-021: B-0356 | ported | F109-FR-006 | CT-109-109, a characterization test (the proof the traceability files name) |
| C-026: B-0386 to B-0391 | translated | F109-FR-034 | PT-109-C-026-* |
| C-027: B-0392 | translated | F109-FR-031 | PT-109-C-027-* |
| C-028: B-0393, B-0394 | translated | F109-FR-034 | PT-109-C-028-* |
| C-029: B-0395 to B-0398 | translated | F109-FR-032 | PT-109-C-029-* |
| C-030: B-0399, B-0400, B-0401 | ported | F109-FR-031, F109-FR-035 | PT-109-C-030-* |
| C-031: B-0402 to B-0417 | ported | F109-FR-030, F109-FR-031, F109-FR-032, F109-FR-035, F109-FR-036 | PT-109-C-031-* |
| C-032: B-0418, B-0419, B-0420 | translated | F109-FR-005 | PT-109-C-032-* |
| C-033: B-0421 | translated | F109-FR-005 | PT-109-C-033-* |
| C-034: B-0422 | translated | F109-FR-006 | PT-109-C-034-* |
| C-035: B-0423, B-0424, B-0427, B-0431, B-0432 | translated; B-0427 ported | F109-FR-001, F109-FR-006, F109-FR-007 | PT-109-C-035-* |
| C-052: B-0497, B-0511, B-0512 | translated | F109-FR-027, F109-FR-031, F109-FR-032 | PT-109-C-052-* |
| C-054: B-0570, B-0579 to B-0583 | translated | F109-FR-020, F109-FR-034 | PT-109-C-054-* |
| C-056: B-0622, B-0623 | translated | F109-FR-033, F109-FR-032 | PT-109-C-056-* |
| C-057: B-0641 | translated | F109-FR-034 | PT-109-C-057-* |
| C-058: B-0680 to B-0685, B-0758, B-0759, B-0767 | ported; B-0685 translated | F109-FR-029, F109-FR-033, F109-FR-020, F109-FR-008, F109-FR-031 | PT-109-C-058-* |
| C-060: B-0800 | translated | F109-FR-010 | PT-109-C-060-* |
| C-061: B-0846 | translated | F109-FR-010 | PT-109-C-061-* |
| C-066: B-0989, B-0992, B-0993, B-1012, B-1013, B-1014 | ported; B-0993 translated | F109-FR-010, F109-FR-036, F109-FR-008 | PT-109-C-066-* |

Behaviour extracted from Lisa, with its characterization test. Lisa has no reference run in the
oracle (feature 141, §O.7).

| Behaviour of Lisa's provider seam | Kept or changed | Requirement | Test |
|---|---|---|---|
| A provider declares its capability levels; registering one whose declared level has no matching operation fails | Kept | F109-FR-002 | CT-109-101 |
| Failures are classified into typed kinds; a structured code wins over a match on text | Kept; the vocabulary is that of annex C §C.1 | F109-FR-009 | CT-109-102 |
| A completion call has no tools and no shell | Kept | F109-FR-017 | CT-109-103 |
| The two completion clients, one per endpoint kind | Kept, with machine-specific names removed; address, key and model come from the descriptor and no longer from fixed variable names; usage that the endpoint does not report is null and no longer zero (Principle XI) | F109-FR-017 | CT-109-104 |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Which fixture family proves the items of a declared overlay, given that the traceability files name FX-26? → A: FX-39. Feature 141 added the family because FX-26 runs with overlay scope `none`; until the traceability files are corrected both citations are valid. (Source: feature 141, §O.2, the table of new families)
- Q: Do the registry queries of the baseline (`names`, `display`, `stream`, `invocation-model`) become commands of the CLI? → A: No. Feature 100, annex G §G.1 holds no such command. They are internal operations that return a result record with `exit_code`; the display line is part of help text. Integrated in F109-FR-005 and F109-FR-006. (Source: feature 100 annex G §G.1; layering rule LR-6; `traceability.md` section 1.3)
- Q: May the seam set the sandbox assertion variable, given that ruling 34 says the runtime never asserts a sandbox? → A: Only under the `parity` profile, where row 25 sets containment to the behaviour of the baseline and the names of the variables the stub saw are compared. Integrated in F109-FR-027. (Source: `consolidation.md` DV-030, oracle handling "off")
- Q: How can the rule "this harness may never declare an overlay" be kept without a test of a harness name? → A: The harness adapter that keeps an overlay of its own refuses the declaration for its entry. The seam asks the harness adapter and names no harness. Integrated in F109-FR-030. (Source: B-0405; Principle VII; F100-FR-023)
- Q: Is usage that an endpoint does not report zero, as in Lisa, or null? → A: Null. (Source: constitution, Principle XI; F100-FR-077)
- Q: Is the proof by pinned configuration open to a declared harness? → A: No. It needs the exact version pin and the preflight of a tested harness adapter, and it is recorded as the weaker proof. Integrated in F109-FR-037 and F109-FR-038. (Source: brief 109, heading 4; feature 100 annex C §C.3)
- Q: What happens to a critic with read-only tools that gives no confirmation of the read denial? → A: A configured one is refused with `critic_not_toolless`; an automatically picked one is passed over, announced and recorded. Integrated in F109-FR-039. (Source: F100-FR-089)
- Q: Who scores a failed critic-class call as MALFORMED? → A: The phase gate, through feature 100, annex C §C.1 "Failure of an implementation". The seam reports the failure with the as-is detail text. Integrated in F109-FR-010. (Source: brief 109, heading 1, out of scope; C-066)
- Q: Which containment level is the default? → A: C2 where the harness offers it, else C1; C0 only by opt-in in user configuration; C3 is supplied by the consumer and detected. Integrated in F109-FR-026. (Source: `APPROVAL.md` ruling 34; DV-030; R11 R-2)
- Q: Where does the opt-in to C0 live? → A: In the key of row 25 of the `parity` profile, set to `C0` in user configuration only. The environment, a flag and project configuration cannot give it. The key is of the trust class widening. Corrected on 2026-09-30 (W-110-05); integrated in F109-FR-026. (Source: `APPROVAL.md` ruling 34; F100-FR-111; CQ-183; feature 100 annex X §X.2, §X.7)
- Q: What happens when two sources describe the same harness id? → A: One entry wins as a whole: consumer-declared, then tested harness adapter, then bundled descriptor, then detected. The entry of a consumer's descriptor is never `tested`. Two descriptors of the same origin with one id are refused. Integrated in F109-FR-014 and in the edge cases. (Source: R20, Q1, "Precedence when two sources describe the same harness id"; `APPROVAL.md` ruling 10)
- Q: How long may the free request for a model list take, and what kind of request is it? → A: A read request, at most 3 seconds, redirects refused. Integrated in F109-FR-018. (Source: R20 Q4, step L3; `APPROVAL.md` ruling 61)
- Q: What is recorded as the version of a harness that states none? → A: Null. Integrated in F109-FR-041. (Source: constitution, Principles X and XI)
- Q: Which home does a call at auth tier 2 use when a declared harness declares no overlay? → A: The consumer's configuration home; the doctor says so and the run records it. Integrated in F109-FR-029. (Source: R20 Q5, "Sandboxed")
- Q: Does this feature fix the values of the time limits of the operations, and the event types the seam emits? → A: No. The limits are configuration, whose keys feature 110 owns; the event types are in the catalogue of feature 111. The seam supplies the facts of the event envelope. Integrated in F109-FR-003. (Source: feature 100 annex X §X.1, §X.2)
- Q: Which rows of the divergence register bear on this feature? → A: DV-001, DV-002, DV-004, DV-006, DV-027, DV-030, DV-047, DV-064, DV-066, DV-068 and DV-081, and DV-090 through row 28 of the `parity` profile. The register grows while Stage B runs, so this specification names the rows and gives no count. (Source: `consolidation.md` section 6)
- Q: Which questions could the sources not answer? → A: Three, listed under "Assumptions". One of them, CQ-065, has been answered since; three questions of the cross-feature review were added on 2026-09-30.

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The stream readers (126), role resolution (124), the secret resolvers (110), the terms gate (147) and the quota classifier (127) exist when the seam calls them. Each is reached through its interface contract of feature 100.
- The ceilings of the Wave 1 harness adapters and their argument tables are specified by 125, 130, 131, 134 and 138.
- The paid probe of F109-FR-038 and the fixture capture of F109-FR-039 are run by the features of the harness adapters. This feature runs no paid probe.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-063 | In which unit, and under which spelling, does the consumer state the budget of `harness verify`? The sources say "opt-in, budget-capped" (R20 Q5) and "inside a budget" (annex G §G.1) | An argument of the command: a number of model calls and a time limit for every harness, and a spending cap in addition for a harness of the cost class `metered`. Without it the command refuses with exit 3 | F109-FR-025 |
| CQ-064 | The marker of an overlay at the baseline holds the owner's process id, its start time and the time of creation, and the scope word `critic` for a critic-class call. Annex C §C.16 lists neither the three fields nor that scope word | The marker holds the fields of §C.16 and the three fields of the baseline, which the schema permits as further fields; the scope word `critic` is a value of the marker and not of the configured scope (row 88) | F109-FR-032, F109-FR-036 |
| CQ-065 | Which logical name has a bundled descriptor? | Answered: the name is `package:harness:<id>`, annex B §B.5. The requirement cites it and carries no assumption any more | F109-FR-023 |
| CQ-182 | May a tested harness adapter whose stream has no initial record prove the tool-less form by its exact version pin and its preflight? | Answered 2026-09-30 by the owner: yes, for a tested harness adapter only, recorded for every call as the weaker proof; Principle IX v3.0.1 names it, and the requirement needs no change | F109-FR-038 |
| CQ-183 | Does "user config" in ruling 34 mean the user configuration only? | Yes. The opt-in to C0 comes from user configuration only | F109-FR-026 |
| CQ-193 | May a fixture change the reference tree to reach a line that runs only when a file of the reference is missing? | No. The line for a registry that cannot be read gets a characterization test | F109-FR-006 |

## Threats

Stated as F100-FR-216 asks. The threats are those of feature 100, annex X §X.9 that name this
feature. Where another feature shares the control, the table names the part of this feature.

| Threat | What it is | Control in this feature |
|---|---|---|
| T-07 | A proposer with all tools acts on injected instructions | F109-FR-026 (containment, the strongest level by default, C0 by opt-in in user configuration only); F109-FR-027 (the seam never asserts a sandbox outside the `parity` profile); F109-FR-028 (environment allow-list) |
| T-13 | Project configuration declares a harness, a critic, a command or an endpoint | F109-FR-015 |
| T-14 | A discovered harness claims falsely that it qualifies as critic | F109-FR-037, F109-FR-038, F109-FR-039 (only a form that the seam proves per call qualifies); F109-FR-040 (the proof is recorded); F109-FR-013 (a harness that is not tested is unverified); F109-FR-017 (the identity of the provider comes from the descriptor and the endpoint, never from the reply). The announcement of the pick is the part of feature 124 |
| T-15 | An executable shadows a harness on the search path | F109-FR-020 |
| T-16 | An endpoint points at an attacker | F109-FR-015 (endpoints from the consumer's scope only); F109-FR-018 (bound host, no plain address but loopback, no redirect) |
| T-34 | The proposer inherits the whole environment | F109-FR-028 |
| T-48 | A critic with read-only tools reads the project by itself | F109-FR-039 (read-only sandbox, network off, the denial of the withheld paths confirmed before the call); F109-FR-044 (the part of the conformance suite). Moving the proposer's files out is the part of feature 117 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place. No id was renumbered or reused.

| Requirement | Item | What changed |
|---|---|---|
| F109-FR-006 | Follow-up of feature 141; CQ-193 | The test CT-109-109, a characterization test, proves the line for a registry that cannot be read; `assumption: CQ-193` |
| F109-FR-023 | W-X-10 | The logical name `package:harness:<id>` of annex B §B.5 is cited; the assumption CQ-065 is removed |
| F109-FR-024 | W-X-19 | `ep:` EP-14 reads `implements (an entry)` in place of `consumes` |
| F109-FR-025 | W-146-01 | The stored result is the record `specstride.harness-verify/1` with the field names of the owner of the schema: `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget` |
| F109-FR-026 | W-110-05; W-100-23 | The opt-in to C0 comes from user configuration only; `assumption: CQ-183` |
| F109-FR-032, F109-FR-036 | W-X-07 | The text of the assumption CQ-064 states what feature 100 holds today (annex C §C.16; annex X §X.6 row 129). The requirement text is unchanged |
| F109-FR-038 | W-100-19; W-100-20 | The weaker proof is named as a recorded deviation from Principle IX and is recorded for every call; `assumption: CQ-182` |
| F109-FR-006 | Re-check B-8.7 part F, ripple R-109 (2026-09-30) | `PT-109-C-021-*` leaves `test:`; CT-109-109 is the proof row B-0356 of the traceability files names; the assumption text follows |
| F109-FR-038 | Re-check B-8.7, pass-on (2026-09-30) | The proof by pinned configuration names the flag set of the call beside the pin and the preflight, and records the pin and the flag set, as F100-FR-230 (third way) says after its re-check |

Requirements added: none. Tests added: CT-109-109 (F109-FR-006), CT-109-110 (row XIX of the
Constitution Check; it proves F109-FR-024 and F109-FR-025 for the size of their output).
