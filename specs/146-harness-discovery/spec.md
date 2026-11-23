# Feature Specification: Harness discovery

**Feature Branch**: `146-harness-discovery` (a label: Spec Kit creates no branch in this repository; the directory is `specs/146-harness-discovery`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 146-harness-discovery of Specstride, the second part of the split of feature 124: harness discovery from its seven sources; what discovery may execute, read and send; the two passes; the switches of discovery; the probe ladder and bounded probes; the context window and its sources; the four states of a harness and promotion to locally verified."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 124-harness-discovery-and-roles, requirement groups G1 and G2), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, G, X), feature 141 (§O.3, §O.7), and the research reports R20, R16 and R11.

## What this feature is

A consumer has harnesses on their machine: agent CLIs, model endpoints, a gateway. The product
has a tested harness adapter for a few of them. This feature finds the others without reading a
secret and without changing anything, and says of every value it found where the value came
from.

Its result is the list of harnesses that enters the field `harnesses` of the resolved registry
(feature 100, annex C §C.6). What is done with the list, which harness plays which role, is not
part of this feature.

**In scope**: the seven sources of discovery; what discovery may execute, read and send; the two
passes and their switches; the probe ladder; bounded probes; the context window of a model and
its sources; the four states of a harness; promotion to `locally-verified` and its end.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The registry, the harness port, the schema of the harness descriptor, the generic harness adapter | 109 |
| The command `harness verify` and its conformance run | 109 (feature 100, annex G §G.1) |
| Role resolution, the role plan, the critic order, the automatic pick, the same-model warning; the writing of the resolved registry | 124 |
| The secret resolver and the spelling of every configuration key | 110 |
| Display of the registry by the doctor | 112 |
| The catalogue of event types | 111 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discovery finds a harness and touches nothing (Priority: P1)

A consumer installed an agent CLI or set the key of a model endpoint. The product has no tested
harness adapter for it. The consumer wants the product to see it, and wants to be sure that the
product opened no credential store and changed nothing.

**Why this priority**: Discovery runs on every launch and in the doctor, on a machine full of
credentials. One read of a credential file would make the feature unshippable.

**Independent Test**: A fixture home with planted credential files and a fake CLI named by a
bundled harness descriptor. File-access tracing over one discovery shows no open of a planted
file and no write; the fake harness is in the resolved registry as unverified.

**Acceptance Scenarios**:

1. **Given** a fake CLI on the search path that a harness descriptor names, **When** discovery runs, **Then** the harness is in the resolved registry with the state `detected` and every value carries its provenance or is null (F146-FR-002, F146-FR-017; feature 100, annex C §C.6).
2. **Given** an executable on the search path that no harness descriptor and no tested harness adapter names, **When** discovery runs, **Then** it is never executed and is not a candidate (F146-FR-003).
3. **Given** planted credential files in known configuration homes, **When** discovery runs, **Then** none was opened (F146-FR-004).
4. **Given** a model-list endpoint that answers with a redirect, **When** the metadata pass queries it, **Then** the redirect is refused, the credential reached no second host, and the values stay null (F146-FR-008).
5. **Given** a harness entry in project configuration, **When** a run launches, **Then** the entry is ignored with a launch message and a doctor warning (F146-FR-010).
6. **Given** a probe that never answers, **When** discovery runs, **Then** it ends within its time limit and the launch goes on (F146-FR-014).

---

### User Story 2 - Every value says where it came from (Priority: P2)

A consumer, or the doctor on their behalf, reads what the product knows about a harness: its
version, its flags, its context window. For every value they see how it was learned, and a value
that could not be learned is shown as unknown and not as a guess.

**Why this priority**: A wrong context window has already cost phase attempts at the baseline
(R20 F3). The source of a value is what lets a consumer correct it.

**Independent Test**: A fixture with a harness whose window is declared, one whose window comes
from its model list, one whose window comes from the catalogue and one with none: each value
carries its step of the probe ladder, the catalogue value is reduced by the margin, the last is
null.

**Acceptance Scenarios**:

1. **Given** a harness whose model list names a window, **When** discovery runs with the metadata pass on, **Then** the window carries the ladder step `metadata` (F146-FR-013, F146-FR-016).
2. **Given** a declared window that is larger than the effective one, **When** discovery runs, **Then** the smaller is used (F146-FR-016).
3. **Given** a model that no source knows, **When** discovery runs, **Then** its window is null and no default is used (F146-FR-016).
4. **Given** a harness of kind `cli` whose help text lacks a flag that its harness descriptor uses for a role, **When** discovery runs, **Then** the role is recorded as not supported, with the flag as the reason (F146-FR-015).

---

### User Story 3 - A consumer promotes a harness they verified (Priority: P3)

A consumer ran the verification of a harness. From then on it ranks before the other unverified
harnesses, until its version or its harness descriptor changes.

**Why this priority**: It refines the ranking; a run works without it.

**Independent Test**: Place a result of harness verification for a declared harness: its state
reads `locally-verified`. Change the version the fake CLI reports: its state reads `declared`.

**Acceptance Scenarios**:

1. **Given** a valid result of harness verification, **When** discovery runs, **Then** the state is `locally-verified` (F146-FR-018).
2. **Given** a result whose harness version or descriptor hash differs from what discovery finds, **When** discovery runs, **Then** the result is not used and a doctor finding says so (F146-FR-018).
3. **Given** any configuration, **When** discovery runs, **Then** no harness without a shipped tested harness adapter has the state `tested` (F146-FR-019).

---

### Edge Cases

- Two sources describe the same harness id: the precedence of F146-FR-011 decides, and every value names its source.
- Discovery is off: only the tested harness adapters, the entries the consumer declared and the harnesses that the roles name are in the list, and no probe runs (F146-FR-012).
- The machine has no network: the metadata pass yields nothing; values come from declaration and catalogue (F146-FR-013).
- A probe prints more than the output cap: the output is cut, the value is null (F146-FR-014).
- A probe never answers: it is ended at its time limit; the other probes are not delayed (F146-FR-014).
- An address in a variable holds a user part: the part is removed before the address is recorded (F146-FR-006).
- A gateway lists a thousand models: each is a candidate; none is called (F146-FR-007).
- A result of harness verification names an older version: it is not used, and the doctor says so (F146-FR-018).
- The keychain cannot be asked without printing a value: the presence of the credential reads `unprobed` (F146-FR-004; feature 100, annex C §C.11).
- macOS: every statement of this specification about macOS is `unverified`.

## Requirements *(mandatory)*

### Functional Requirements

Every requirement of this feature is new: discovery has no as-is behaviour. Each names a
characterization test `CT-146-<n>`, where n is the number of the requirement. The groups are G1
and G2 of heading 7 of brief 124.

#### G1 — Sources and the safety rules of discovery

- **F146-FR-001**: Discovery MUST be a function from the environment to a list of candidates. It MUST have two passes: a passive pass, which makes no network request and resolves no secret, and a metadata pass, which makes free read-only requests for candidates whose credential reference is known. Discovery MUST never call a model and MUST never make a paid call. Discovery MUST make no candidate a default and MUST pick no candidate for a role: each candidate carries `termsRef` from its harness descriptor, null where the terms of its provider are unknown, and under every audience a harness whose terms are unknown is usable only when the consumer names it, and is never a default and never picked automatically as critic (ruling P14; F100-FR-093; F124-FR-036; F147-FR-008).
  - test: CT-146-1
  - ep: EP-02 `specstride.harness/1` (consumes)
  - divergence: DV-064

- **F146-FR-002**: Discovery MUST read exactly the seven sources of the table "Sources of discovery" under "Closed sets": tested harness adapters that detect their own harness; executables that a harness descriptor names; known configuration homes; agents and tool servers that a host registers; endpoints; gateways; entries the consumer declared. Every candidate MUST record the source that found it.
  - test: CT-146-2
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-003**: Discovery MUST execute only what a tested harness adapter or a harness descriptor names: the executable of the `detect` field with the argument lists for version and help, and nothing else. It MUST NOT search the search path for executables that no harness descriptor names, and MUST NOT execute a command of a harness whose effect on state or secrets is not known to be none.
  - test: CT-146-3
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-004**: Discovery MUST read presence and never values. For a variable it MUST test whether the name is set. For a configuration home it MUST test whether the directory exists and MUST open no file inside it. It MUST never open a credential store, a token file or a state file of a host that holds values of variables or headers; a deny-list in the reader MUST enforce this. It MUST ask the secret resolver for `exists` only.
  - test: CT-146-4
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)

- **F146-FR-005**: From the agents and tool servers that a host registers, discovery MUST read names and types only, and never values of environment, headers or arguments. Such an entry MUST be informational: it MUST appear in the resolved registry as information for the doctor and MUST never be a candidate for a role.
  - test: CT-146-5

- **F146-FR-006**: An endpoint MUST become a candidate by the presence of the credential variable that a harness descriptor or the catalogue names. Its base address MUST come from the harness descriptor or from a variable that is not a secret; any user part of the address MUST be removed, and only scheme, host and path MUST be kept and recorded.
  - test: CT-146-6
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-007**: A gateway MUST be found by the presence of the gateway variables of the host or by an entry the consumer declared. Discovery MUST query only its model list, and MUST never query an endpoint of a gateway that runs a request against a model. Every model that the gateway lists MUST be one candidate, of an endpoint kind, to be called through the generic harness adapter and never through the CLI of the host. A candidate of a gateway MUST be recorded like every other candidate; whether it qualifies as critic is decided by the critic order of feature 100, annex C §C.6.
  - test: CT-146-7
  - ep: EP-02 `specstride.harness/1` (consumes)
  - status: unverified (check: the model list of a gateway is served free of charge and lists models of providers other than the host's; verified-on: —; pin: gateway version of the capture)

- **F146-FR-008**: The metadata pass MUST make GET requests only. It MAY send the credential of a candidate to the model-list endpoint that the harness descriptor of that candidate names, and to no other host. It MUST refuse every redirect. The value of the credential MUST never be stored, logged or written to an event, and the resolved value MUST be registered with the redactor.
  - test: CT-146-8
  - ep: EP-10 `specstride.secret-resolver/1` (consumes)
  - status: unverified (check: the model-list endpoint of a provider is unbilled and accepts the credential by the declared scheme; verified-on: —; pin: provider documentation date)

- **F146-FR-009**: Discovery MUST change nothing. It MUST write no file: its result enters the field `harnesses` of the resolved registry of feature 100, annex C §C.6, which role resolution writes at launch. It MUST perform no login, MUST install nothing and MUST download nothing. In the doctor it MUST write nothing at all.
  - test: CT-146-9

- **F146-FR-010**: An entry the consumer declared MUST be accepted from user configuration, the environment, flags and the bundled data of the product only. A harness declaration, an endpoint or a secret reference in project configuration MUST be ignored, with a launch message that names the key and with a doctor warning. The message MUST be one line of at most 200 bytes and MUST NOT be printed under the `parity` profile.
  - test: CT-146-10
  - ep: EP-02 `specstride.harness/1` (consumes)
  - divergence: DV-068

- **F146-FR-011**: Where two sources describe the same harness id, the order MUST be: the entry the consumer declared, then the tested harness adapter, then the bundled harness descriptor, then the value that the probe ladder detected. For the context window the order of F146-FR-016 applies. The resolved registry MUST record, for every value, the source it came from.
  - test: CT-146-11

- **F146-FR-012**: Discovery MUST have two switches: one for discovery as a whole and one for the metadata pass. With discovery off, the resolved registry MUST hold only the tested harness adapters, the entries the consumer declared and the harnesses that the roles name, no probe MUST run and no request MUST be made. With the metadata pass off, no request MUST be made.
  - test: CT-146-12
  - divergence: DV-064
  - parity: both off: no probe runs and no request is made, so that no stub is called outside a pass (rows 87 and 88 of annex X §X.7)

#### G2 — Probe ladder, states, promotion

- **F146-FR-013**: Capabilities MUST be probed by the five steps of the table "Steps of the probe ladder" under "Closed sets", each free of charge. Every value MUST record the step that produced it as its provenance. What no free step can show (that the verdict format is followed, that a CLI stays without tools, the real quota signal, the real form of the stream) MUST stay declared or null and MUST never be guessed.
  - test: CT-146-13
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-014**: Every probe MUST be bounded: standard input closed, a time limit, a cap on output, and no terminal. Probes MUST run in parallel. A probe that fails, runs over its time or exceeds its cap MUST yield null for its values and a doctor finding, and MUST never fail a launch unless the harness plays a role of the run.
  - test: CT-146-14
  - ep: EP-14 `specstride.doctor/1` (consumes)

- **F146-FR-015**: For a harness of kind `cli`, every flag that the argument lists of its harness descriptor use MUST appear in the help text of the executable. A role whose flags are not all found MUST be recorded as not supported, with the missing flag as the reason.
  - test: CT-146-15
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-016**: The context window of a model MUST be taken in this order: the value the consumer declared, the value of the model-list endpoint, the table of the tested harness adapter, the catalogue. Where the declared window and the effective window (the window of the first later source in this order that gives one) differ, the smaller MUST be used. A window from the catalogue (`package:catalogue`, annex B §B.5) MUST be reduced by a safety margin before it is used. An unknown window MUST stay null; there MUST be no default window.
  - test: CT-146-16
  - ep: EP-02 `specstride.harness/1` (consumes)
  - divergence: DV-106
  - parity: not used: every fixture names the critic, and the window comes from the as-is table of its harness adapter (row 89 of annex X §X.7)

- **F146-FR-017**: Discovery MUST give every harness one of the four states of closed set 34 of feature 100, annex X §X.6: `tested` for a harness with a shipped tested harness adapter; `locally-verified` by F146-FR-018; `declared` for a harness whose harness descriptor the consumer wrote (at `user:harness:<id>`) or confirmed by an entry the consumer declared (F146-FR-010); `detected` for every other harness found. A reader that finds another value MUST read `detected`.
  - test: CT-146-17
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-018**: A harness MUST have the state `locally-verified` only while a result of harness verification exists at `user:harness-verify:<id>` that passed and that names the harness version and the descriptor hash which discovery finds now. A result that names another version or another hash MUST NOT be used, and the doctor MUST say so. Verification is opt-in and never runs by itself.
  - test: CT-146-18
  - ep: EP-02 `specstride.harness/1` (consumes)

- **F146-FR-019**: The state `tested` MUST be reachable only through a tested harness adapter that ships with the product, with its version range and its `verified-on` date. No configuration key, flag, harness descriptor or result of verification MUST set it.
  - test: CT-146-19

### Key Entities

| Entity | What it is |
|---|---|
| Candidate | A harness that a source of discovery found, with the source, the state and the values probed so far. It becomes an entry of the field `harnesses` of the resolved registry |
| Probe | One bounded act of one step of the ladder: a look-up, a process, a request, a read of the catalogue |
| Result of harness verification | What the consumer's verification left: the record `specstride.harness-verify/1` with the fields `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget` (schema file in `contracts/schemas/`). Written by the command of feature 109, read here |
| Catalogue | A dated snapshot of models with windows and prices, read offline |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F146-SC-001**: A harness without a tested harness adapter is discovered. Measure: the fake harness of the fixture appears in the resolved registry as unverified, with 0 values that lack a provenance and are not null.
- **F146-SC-002**: Discovery reads nothing secret and changes nothing. Measure: file-access tracing on the discovery fixture shows 0 opens of a planted credential file and 0 writes by discovery; the number of requests that are not GET is 0; the number of redirects followed is 0.
- **F146-SC-003**: Discovery is bounded. Measure: with one probe that never answers among twenty candidates, discovery ends no later than one second after the time limit of a probe.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated | Decision 12 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Discovery reads nothing secret and changes nothing | Decision 17; Principle VII |
| A credential may be sent to a free model-list endpoint with a GET, redirects refused | Ruling 61 |
| Entries from project scope are ignored | Ruling 35 |

What belongs in the plan and not here: libraries and their versions, the package and file layout,
physical paths behind logical names, the test runner, the time limits and caps of probes, and the
spelling of internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | consumes | `detect` and `capabilities` of the harness port; the fields `detect`, `auth`, `endpoint`, `models`, `roles`, `invoke` of the harness descriptor |
| EP-10 | `specstride.secret-resolver/1` | consumes | `exists` in the passive pass; `resolve` and `boundHost` for the one request of the metadata pass |
| EP-14 | `specstride.doctor/1` | consumes | Findings of probes; the field `registry` of the doctor's findings is filled from the list |

This feature implements no extension point.

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Harness port: `detect`, `capabilities`; provenance of a capability | `specstride.harness/1` | Annex C §C.1, F100-FR-076, F100-FR-077, F100-FR-080 |
| Harness descriptor; states of a harness; rules for secrets and redirects | `descriptorVersion: 1` | Annex C §C.2, F100-FR-084 to F100-FR-086 |
| Resolved registry, field `harnesses`; the critic order, as the reader of the list | `specstride.registry/1` | Annex C §C.6, F100-FR-092 |
| Secret resolver | `specstride.secret-resolver/1` | Annex C §C.11, F100-FR-107 |
| Widening entries of project configuration; registries; no closed list | — | Annex A §A.4, §A.5: F100-FR-015, F100-FR-016, F100-FR-023 |
| Logical names `user:harness:<id>`, `user:harness-verify:<id>`, `user:catalogue`, `user:config`, `project:config` | `specstride.layout/1` | Annex B §B.5, F100-FR-053 |
| Doctor check registry and findings | `specstride.doctor/1` | Annex G §G.7 |
| Line grammar; no new line under the `parity` profile | protocol 1 | Annex G §G.2, §G.3, F100-FR-176 |
| Config envelope and trust classes | `specstride.config/1` | Annex X §X.2, F100-FR-202 |
| Redactor (`register`) | `specstride.redaction/1` | Annex X §X.4 |
| Canonical record hash, for the hash of a harness descriptor | — | Annex X §X.5 |
| Closed sets, rows 33, 34, 35, 45 | — | Annex X §X.6 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, F100-FR-212 |
| Threats T-13, T-15, T-16 | — | Annex X §X.9 |

Fixture families of feature 141: none. Discovery has no reference, so it has no parity test
(feature 141, §O.7, first row). It uses the generic stub `stub-harness` of §O.3 in its own tests.

## Rows of the `parity` profile

This feature owns rows 87, 88 and 89 of annex X §X.7. The keys are confirmed; feature 110 owns
the spelling.

| # | Switch | Key | Default | Under `parity` | Register row |
|---|---|---|---|---|---|
| Row 87 | Discovery | `discovery.enabled` | on | off | DV-064 |
| Row 88 | Metadata pass of discovery | `discovery.online` | on where a credential reference exists | off | DV-064 |
| Row 89 | Safety margin on a context window taken from the catalogue | `critic.catalogueWindowMargin` | 20 per cent | not used | DV-049 (as annex row 89) |

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| States of a harness (row 34 of annex X §X.6) | `tested`, `locally-verified`, `declared`, `detected` | 146 | Design | `detected` |
| Sources of discovery | `harness-adapter`, `binary`, `config-home`, `host`, `endpoint`, `gateway`, `declared` | 146 | Owner decision (decision 17) | The candidate is dropped, with a doctor finding |
| Steps of the probe ladder | `presence`, `version-help`, `credential-presence`, `metadata`, `catalogue` | 146 | Design | The value is read as null |

Sources of discovery:

| Member | What is read | How it stays safe | Result |
|---|---|---|---|
| `harness-adapter` | `detect` of each tested harness adapter | Code that ships with the product | Candidate, state `tested` |
| `binary` | For each harness descriptor of kind `cli`: whether the executable is on the search path; then its version and help | Only what the harness descriptor names is run (F146-FR-003, F146-FR-014) | Candidate, unverified |
| `config-home` | Whether the directory that a harness descriptor names exists | Existence only (F146-FR-004) | Supports a candidate; never enough alone |
| `host` | Agents and tool servers a host registers | Names and types only (F146-FR-005) | Information, never a candidate |
| `endpoint` | Presence of a credential variable; the base address | Presence only; the address without its user part (F146-FR-006) | Candidate, unverified |
| `gateway` | Presence of gateway variables; the model list | GET of the model list only (F146-FR-007) | One candidate per model |
| `declared` | Entries of the consumer | User scope only; secrets as references (F146-FR-010) | Candidate, state `declared` unless it selects a tested harness adapter |

Steps of the probe ladder:

| Member | Probe | Yields |
|---|---|---|
| `presence` | Look-up on the search path; existence of a directory | Installed or not |
| `version-help` | The version and help commands of the harness descriptor | Version; presence of flags |
| `credential-presence` | Whether the variable is set or the file exists | Credential present, not valid |
| `metadata` | The model list, by GET, redirects refused | Model list; window where the provider gives it; an auth failure |
| `catalogue` | The dated snapshot (`package:catalogue`, offline) | Window, output cap, price, each marked with the date of the snapshot |

Row 34 of annex X §X.6 names feature 124 as owner. After the split the owner is 146; the change
is reported.

## As-is behaviour not carried

The traceability files assign no row to this part: discovery has no as-is behaviour. No as-is
requirement, success criterion, cluster or behaviour item is carried, and none is superseded or
dropped here.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none) | — | — |

What the baseline had in place of discovery, a closed list of registry entries, is superseded by
the open registry (DV-064); its items belong to other features.

## Ids before the split

This feature is the second part of `124-harness-discovery-and-roles`. The old ids are never
reused.

| Old id | New id |
|---|---|
| F124-FR-001 to F124-FR-019 | F146-FR-001 to F146-FR-019, each with the same number |
| F124-SC-002 | F146-SC-001 |
| F124-SC-003 | F146-SC-002 |
| F124-SC-007 | F146-SC-003 |
| CT-124-1 to CT-124-19 | CT-146-1 to CT-146-19, each with the same number |

No parity test and no as-is origin moved.

## Inherited work

| Work | Kind | Where |
|---|---|---|
| The fake harness of the descriptor-only fixture of the harness port appears as unverified | Conformance fixture | F146-SC-001; first task of `tasks.md` |
| File-access tracing of discovery on a home with planted credential files | Canary test | F146-SC-002 |
| Whether a model-list endpoint is unbilled and takes the credential as declared | Live probe, free of charge but with a real credential; logged; not run in Stage B | F146-FR-008 |
| Whether a gateway lists models of other providers | Live probe; logged; not run in Stage B | F146-FR-007 |

This feature has no paid probe.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: R20 accepts consumer-declared entries from project configuration. Which holds? → A: They are ignored there. Integrated in F146-FR-010. (Source: `APPROVAL.md` ruling 35; feature 100 F100-FR-202)
- Q: Who owns `harness verify`? → A: Feature 109 owns the command and its conformance run (feature 100 annex G §G.1). This feature owns the state that its result gives and when the result stops counting. Integrated in F146-FR-018. (Source: feature 100 annex G §G.1; annex X §X.6 row 34; brief 124 heading 1)
- Q: Does discovery run under the `parity` profile? → A: No. A probe would call a stub executable outside a pass and add a record to a compared transcript. Both switches are off. Integrated in F146-FR-012. (Source: feature 141 §O.3 rule 4; F100-FR-212)
- Q: Are host-registered agents and tool servers candidates? → A: No. They are information for the doctor. A host agent is served by the model route of the host, and a tool server has no prompt-in, reply-out form. Integrated in F146-FR-005. (Source: R20 F22, F23; brief 124 heading 4)
- Q: Which time limits do probes have? → A: Starting values of 5 seconds for a process and 3 seconds for a request, as data of the plan; their confidence is low. (Source: R20 Q1 S2, Q4 L3)
- Q: Through what is a model of the host's gateway to be called? → A: Through the generic harness adapter as an endpoint, never through the CLI of the host. Integrated in F146-FR-007. (Source: brief 125 heading 1, row "A critic through the host model gateway"; R20 F15, F16)
- Q: Who writes the resolved registry after the split? → A: Role resolution, at launch (feature 100 annex C §C.6, F100-FR-092). Discovery writes nothing; its result is the content of the field `harnesses`. Integrated in F146-FR-009. (Source: feature 100 annex C §C.6; `STAGE-B-SPLIT-PROMPT.md` step 4)
- Q: The baseline gives a model that is not in its table a default context window. Does discovery? → A: No. The window stays null. The as-is default is kept under the `parity` profile by the feature that owns the critic's budget; the register row is DV-106. Integrated in F146-FR-016. (Source: `consolidation.md` DV-106; constitution Principle IX)
- Q: Which commands of a harness may discovery never run? → A: Any command whose effect on state or secrets is not known to be none. Two are known by name from the research: a command that prints the resolved configuration of a harness, and a command that lists the tool servers of a host and may start them. Neither is in any `detect` field that ships. Integrated in F146-FR-003. (Source: R20 F7, F21, open question 7)
- Q: Is the catalogue fetched at launch? → A: No. A dated snapshot ships with the product; a newer one is placed at `user:catalogue` by the CLI on the consumer's request. Discovery reads it offline. Integrated in F146-FR-013. (Source: R20 open question 5; feature 100 annex B §B.5)
- Q: How many candidates may discovery hold, and does the number bound its time? → A: No limit on the number. Time is bounded by the limit of one probe, since probes run in parallel (F146-SC-003). (Source: R16 F2; R20 Q1)
- Q: Which questions could the sources not answer? → A: None for this part.

## Repairs after the cross-feature review

Dated 2026-09-30, from `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. No id is renumbered.

| Item | What changed |
|---|---|
| W-146-01 | The result of `harness verify` (`specstride.harness-verify/1`) has the eight fields `schema`, `harness`, `version`, `descriptorHash`, `at`, `outcome`, `cases`, `budget`; `schema` is required. Stated in the Key Entities row and in `data-model.md` and `contracts/schemas/harness-verify-result.schema.json`; the sentence that feature 100 gives no schema is dropped |
| W-X-11 | The `parity` line of F146-FR-016 cites row 89 of annex X §X.7 in place of "new row P-3"; the three rows 87, 88, 89 are confirmed in the table "Rows of the `parity` profile" |
| W-X-18 | F146-FR-014 gained the line `- ep: EP-14 specstride.doctor/1 (consumes)`, which the row "Extension points" named without a requirement |
| W-X-25 | The logical name `package:catalogue` (annex B §B.5) is named in F146-FR-016 and in the step `catalogue` of the probe ladder |
| B-8.7 (2026-09-30) | F146-FR-001 changed in place: discovery makes no candidate a default and picks none; `termsRef` is carried, null where the terms are unknown; ruling P14 holds under every audience (test CT-146-1, T010). The schema file of `specstride.harness-verify/1` pins `schema` to its constant; `outcome` cites closed set 131 of annex X §X.6 |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The events this feature needs are named by feature 111; this specification says "an event" or "a doctor finding".
- The spelling of every key is feature 110's. The three keys of this feature have the confirmed rows 87, 88 and 89 of annex X §X.7.
- The list of candidates is handed to role resolution inside one command. Feature 100 holds the record that results (annex C §C.6) and no contract for the hand-over in memory; this specification therefore describes its result by the field `harnesses` of that record.
