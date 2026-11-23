# Feature Specification: Specstride (umbrella)

**Feature Branch**: `100-specstride` (a label: Spec Kit creates no branch in this repository; the directory is `specs/100-specstride`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 100-specstride, the umbrella feature of Specstride: vision and aims, layering rules, every cross-feature contract and extension-point interface (EP-01 to EP-19), state layout and logical names, record schemas, run-state machine, per-process and per-command exit-code tables, the closed stop-reason enumeration, CLI protocol v1 and line grammar, event and config envelopes, the parity profile, the list of closed sets, normalization contract, threat model and integration acceptance. One feature with annexes by layer (owner ruling 16)."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 100-specstride), `STAGE-B-RULES.md`, the constitution v3.0.1, and the research reports named in the brief.

## Vision and aims

Specstride carries out specified work unattended. A consumer who has a specification, a plan and
a task list invokes a host skill; a detached runtime then works phase by phase, a proposer does
the work of each phase, deterministic checks and an independent critic judge it at the phase gate,
and the consumer is told when the run is finished or needs them.

Three systems do this today: Specstride, mixture-of-loops and Lisa. This product replaces them
with one. The aims, in the order the evidence supports:

| # | Aim |
|---|---|
| 1 | Fail fast. Long checks stop at the first failure, and problems surface in minutes |
| 2 | Units of work small enough that no pass is killed by a time limit; work that was done is kept |
| 3 | Runs that look after themselves: automatic relaunch, and a clear signal when a run is blocked on the consumer |
| 4 | Context is carried forward and not read again |
| 5 | One codebase in place of three |
| 6 | A host skill that uses little of the host's context |

Feature 100 builds none of this behaviour. It is the umbrella: the single source of every
interface that two or more features share. Forty other features (41 specifications after the splits, this one included) specify the behaviour, and
each of them cites the interface contracts of this feature and of no other feature.

**In scope**: the layering rules; the interface of every extension point EP-01 to EP-19; every
cross-feature interface contract; the locations of state and the table of logical names; the
identifiers; the record schemas; the run-state machine; the exit codes per process and per command;
the closed enumeration of stop reasons; the CLI protocol and the grammar of output lines; the
event and config envelopes; the `parity` profile; the list of closed sets; the
normalization contract of the oracle; the threat model; the integration acceptance of the whole product.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The behaviour behind each interface | The content owner named in the annex |
| The event types and their fields; the configuration keys and their defaults | 111; 110 |
| The oracle itself: stub agents, fixtures, normalizer, comparator | 141 |
| Each output line | The feature that prints it |
| The traceability files, the divergence register, the roadmap | `docs/ecosystem/`, the single copies |
| Features of Wave 2 and later | The roadmap |

## The annexes

The annexes are part of this specification and are normative. They hold the functional
requirements. The ids F100-FR-001 to F100-FR-226 run through all annexes in one sequence, in the
order of the table. Requirements added later have the ids F100-FR-227 and upward and stand at the
end of the section they belong to; no id was renumbered.

| Annex | File | Layer | Requirements | Id range |
|---|---|---|---|---|
| A | [annexes/A-foundations.md](annexes/A-foundations.md) | All | 34 | F100-FR-001 to F100-FR-031; added: F100-FR-234, F100-FR-235, F100-FR-237 |
| B | [annexes/B-state.md](annexes/B-state.md) | L0 state | 47 | F100-FR-032 to F100-FR-075; added: F100-FR-227 to F100-FR-229 |
| C | [annexes/C-ports-and-edges.md](annexes/C-ports-and-edges.md) | L1 and L2 | 41 | F100-FR-076 to F100-FR-113; added: F100-FR-230 to F100-FR-232 |
| D | [annexes/D-pass-loop.md](annexes/D-pass-loop.md) | L3 pass loop | 24 | F100-FR-114 to F100-FR-137 |
| E | [annexes/E-engine.md](annexes/E-engine.md) | L4 engine | 17 | F100-FR-138 to F100-FR-154 |
| F | [annexes/F-runtime-root.md](annexes/F-runtime-root.md) | L5 runtime root | 15 | F100-FR-155 to F100-FR-169 |
| G | [annexes/G-cli.md](annexes/G-cli.md) | L6 CLI | 24 | F100-FR-170 to F100-FR-192; added: F100-FR-233 |
| H | [annexes/H-hosts.md](annexes/H-hosts.md) | L7 hosts | 5 | F100-FR-193 to F100-FR-197 |
| X | [annexes/X-cross-layer.md](annexes/X-cross-layer.md) | Cross-layer | 30 | F100-FR-198 to F100-FR-226; added: F100-FR-236 |
| | | **Total** | **236** | |

Where each interface contract is:

| Interface contract | Schema id | Annex and section |
|---|---|---|
| Layers and layering rules LR-1 to LR-11 | — | A §A.1, §A.2 |
| Import rule for the core | — | A §A.3 |
| Common rules of extension points | — | A §A.4 |
| Locations of state, rules SL-1 to SL-7 | `specstride.layout/1` | B §B.1, §B.2 |
| Identifiers | — | B §B.3 |
| `schema` field, refusal of a different major, atomic write, one writer per file | — | B §B.2, §B.4 |
| Logical names | `specstride.layout/1` | B §B.5 |
| Workspace record | `specstride.layout/1` | B §B.6 |
| Launch record; lease; owner record | `specstride.launch/1`; `specstride.lease/1` | B §B.7, §B.8, §B.9 |
| Process registry | `specstride.procs/1` | B §B.10 |
| Inbox request types | `specstride.inbox/1` | B §B.11 |
| Run snapshot, with the source hashes | `specstride.snapshot/1` | B §B.12 |
| Ledger | `specstride.ledger/1` | B §B.13 |
| Approval record, signed | `specstride.approval/1` | B §B.14 |
| Terminal record | `specstride.terminal/1` | B §B.15 |
| Supervision record | `specstride.supervision/1` | B §B.16 |
| Pause record | `specstride.pause/1` | B §B.17 |
| Tripwire record | `specstride.tripwire/1` | B §B.18 |
| Further schema ids, fields with their owners | twenty-one ids | B §B.20 |
| Harness port (EP-02) | `specstride.harness/1` | C §C.1 |
| Harness descriptor | `descriptorVersion: 1` | C §C.2 |
| Forms of the `completion` level | part of `specstride.harness/1` | C §C.3 |
| Withheld paths | `specstride.withheld-paths/1` | C §C.4 |
| Stream readers; dialect table | `specstride.stream-dialect/1` | C §C.5 |
| Resolved registry and role plan; critic order | `specstride.registry/1` | C §C.6 |
| Spec-format adapter (EP-03); canonical spec model | `specstride.spec-format/1` | C §C.7 |
| Check runner (EP-05) | `specstride.check-runner/1` | C §C.8 |
| Verification-plan source (EP-07) | `specstride.verification-source/1` | C §C.9 |
| Event sink (EP-08) | `specstride.event-sink/1` | C §C.10 |
| Secret resolver (EP-10) | `specstride.secret-resolver/1` | C §C.11 |
| Terms-gate data (EP-11) | `specstride.terms/1` | C §C.12 |
| Quota classifier (EP-12) | `specstride.quota-classifier/1` | C §C.13 |
| Toolchain profile (EP-16) | `specstride.toolchain/1` | C §C.14 |
| Containment levels | — | C §C.15 |
| Overlay schema | `specstride-overlay/v1` | C §C.16 |
| Loop-layer interface (EP-04), stacking, directives, negotiation | `specstride.loop-layer/1` | D §D.1 |
| Tree-store service; the two writes to the workspace | `specstride.tree-store/1` | D §D.2 |
| Parallel plan | `specstride.parallel-plan/1` | D §D.3 |
| Router rule table (EP-06) | `specstride.router-rules/1` | D §D.4 |
| Prompt block provider (EP-15) | `specstride.prompt-block/1` | D §D.5 |
| Yield artifact | `specstride-pass-yield/v1` | D §D.6 |
| Fact block | `specstride.fact-block/1` | D §D.7 |
| Check manifest | `specstride.manifest/1` | D §D.8 |
| Critic strategy and attempt planner (EP-18) | internal seams | E §E.1 |
| Run-state machine; blocked reasons; run record | `specstride.run-state/1` | E §E.2 |
| Stop-reason enumeration | `specstride.stop-reason/1` | E §E.3 |
| Exit codes of the engine; result records | — | E §E.4 |
| Process model | — | F §F.1 |
| Run requests | — | F §F.2 |
| Handshake outcomes | — | F §F.3 |
| `relaunch.owner` | — | F §F.4 |
| Lock and liveness provider (EP-13) | `specstride.lock/1` | F §F.5 |
| Detach strategy (EP-17) | `specstride.detach/1` | F §F.6 |
| Stage kind and precondition check (EP-19) | `specstride.stage-kind/1` | F §F.7 |
| Exit codes of the runtime root and the pipeline entry | — | F §F.8 |
| CLI protocol | protocol integer 1 | G §G.1 |
| Output modes | — | G §G.2 |
| Line grammar | — | G §G.3 |
| Exit codes per command | — | G §G.4 |
| Token budgets | — | G §G.5 |
| UI read model (EP-09) | `specstride.view/1` | G §G.6 |
| Doctor check registry (EP-14); doctor findings | `specstride.doctor/1` | G §G.7 |
| Launch-contract schema | `specstride.launch-contract/1` | G §G.8 |
| Judgment exchange | `specstride.judgment/1` | G §G.9 |
| Presenter interface | `specstride.presenter/1` | G §G.10 |
| Host port (EP-01): host package contract, host capabilities | `specstride.host/1` | H §H.1 |
| Event envelope and versioning | `specstride.event/1` | X §X.1 |
| Config envelope, ranks, trust classes | `specstride.config/1` | X §X.2 |
| Table evaluator | `specstride.table/1` | X §X.3 |
| Redactor | `specstride.redaction/1` | X §X.4 |
| Canonical hasher | — | X §X.5 |
| List of closed sets | — | X §X.6 |
| The `parity` profile | `specstride.profile/1` | X §X.7 |
| Normalization rules, layout tables, alias and component tables | `specstride.oracle-normalization/1` | X §X.8 |
| Threat model | — | X §X.9 |
| Integration acceptance | — | X §X.10 |

**The written form of a requirement.** Every requirement follows `STAGE-B-RULES.md` section 4.
Three notes for this feature:

| Note | Content |
|---|---|
| `ep:` | In feature 100, "implements" means that the requirement states the normative interface of the extension point; "consumes" means that it relies on it |
| `test:` | A requirement with an as-is origin names the test of the traceability files. A new requirement names a test `CT-100-<n>`, where n is 100 plus the number of the requirement. `CT-100-1` and `CT-100-2` are the two characterization tests of the traceability files |
| `assumption:` | A requirement that rests on a reading the sources do not settle carries `assumption: CQ-pending-<n>`. The list is under "Assumptions" |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The feature specifications read one source (Priority: P1)

The authors of the 40 other feature specifications need every shared code, reason, state name,
logical name, schema and interface in one place, stated so exactly that two authors cannot read
it in two ways.

**Why this priority**: The 40 specifications are written in parallel and none may cite another.
A gap here is filled 40 times, each time differently.

**Independent Test**: Take any interface contract named under heading 5 of any brief of
`feature-briefs.md`. Find it in the table "Where each interface contract is", open the section,
and find there the schema id, the writer, the readers and every field or member. No other
document is needed.

**Acceptance Scenarios**:

1. **Given** the specification of any feature, **When** it names an exit code, a stop reason, a run state, a logical name, a field of the event envelope or a rank of configuration, **Then** the value is in an annex of feature 100 under a numbered section and a requirement id, and the two agree.
2. **Given** a feature that needs a logical name, a closed set or a switch that the annexes do not hold, **When** its author writes the specification, **Then** the author reports the need and invents nothing, and the rule that says so is F100-FR-053, F100-FR-208 or F100-FR-212.
3. **Given** the consistency review over all specifications, **When** it compares them with the annexes, **Then** it finds no disagreement (F100-FR-226).

---

### User Story 2 - An operator reads an exit code and a stop reason (Priority: P1)

An operator, or a script of theirs, runs a command of the product and must know from the exit
code and the stop reason what happened and whether the run may be started again.

**Why this priority**: Codes and reasons are matched by other programs today. A changed number
breaks relaunch without any error.

**Independent Test**: For every row of the tables of annex E §E.3 and §E.4, annex F §F.8 and
annex G §G.4, a fixture ends a process in that way, and the code, the stop reason and `retryable`
of the terminal record equal the row.

**Acceptance Scenarios**:

1. **Given** a run that halts for any cause, **When** the engine exits, **Then** the code is one of 0 to 6, the terminal record holds a stop reason of the 15 members, and the cause maps to exactly one code (F100-FR-151, F100-FR-148).
2. **Given** a workspace whose lock is held, **When** the operator runs `resume`, **Then** the command exits 5; **Given** nothing to resume, **Then** 3; **Given** a task list whose text changed since launch, **Then** 3 with the file named; **Given** a task list in which only checkboxes changed, **Then** no refusal (F100-FR-183).
3. **Given** a run in a quota pause, **When** the operator reads its state, **Then** the state is `paused-quota`, no stop reason exists, and no count has changed (F100-FR-146).
4. **Given** the micro-loop layer or parallel units on, **When** anything inside them fails, **Then** the sets of exit codes, stop reasons and run states seen over all fixtures are subsets of those seen with them off (F100-FR-031).

---

### User Story 3 - An author adds an implementation without touching the core (Priority: P1)

The author of a later harness adapter, loop layer, sink, check runner, spec format, lock provider
or stage kind adds it behind an extension point. The core does not change.

**Why this priority**: Evolvability is an aim of the owner, and the sample outside the core is
its only proof.

**Independent Test**: For each of EP-01 to EP-19, register the sample implementation from the
test tree, run the conformance suite, then remove the sample: both builds pass and no core file
differs between them.

**Acceptance Scenarios**:

1. **Given** a sample implementation outside the core, **When** the conformance suite of its extension point runs, **Then** it passes with no core file changed (F100-FR-018, F100-FR-222).
2. **Given** a core file that names a sample or a Wave 1 implementation, **When** the build runs, **Then** the import-boundary check fails (F100-FR-012).
3. **Given** an implementation that throws, runs over its time or returns a value outside its result set, **When** the core calls it, **Then** the documented plainer path is taken and no verdict, exit code or stop reason comes from the implementation (F100-FR-019).
4. **Given** a loop layer that declares a directive the engine does not offer, **When** it registers, **Then** it is refused (F100-FR-116).

---

### User Story 4 - An author describes a harness as data (Priority: P2)

The author of a harness descriptor makes a harness usable for which the product has no tested
harness adapter, by writing a descriptor in user configuration.

**Why this priority**: The product has no closed list of harnesses. The descriptor is how a
consumer brings their own.

**Independent Test**: With a descriptor for a fake CLI and one for a fake endpoint in the test
tree, a fixture run completes with the first as proposer and the second as critic; the doctor
shows both as unverified.

**Acceptance Scenarios**:

1. **Given** a descriptor that follows annex C §C.2, **When** it is loaded from user configuration, **Then** the harness is in the resolved registry with the state `declared` and every capability carries its provenance or is null (F100-FR-084, F100-FR-077).
2. **Given** the same descriptor in project configuration, **When** a run launches, **Then** the descriptor is ignored with a launch message and a doctor warning (F100-FR-202).
3. **Given** a descriptor with an unknown top-level key, **When** it is loaded, **Then** it is refused; **Given** an unknown key under `x-`, **Then** it is ignored (F100-FR-084).
4. **Given** any specification of the product, **When** it enumerates harnesses, **Then** it reads the registry (F100-FR-023).

---

### User Story 5 - A consumer invokes a host skill (Priority: P2)

A consumer invokes `specstride-run` in a host. The run starts, outlives the host session, and the
consumer learns its state from one line.

**Why this priority**: It is the path of every real run, and it crosses every layer.

**Independent Test**: The host conformance suite plays the command sequences of both host skills
on the plain shell with stub agents and measures bytes against the budgets.

**Acceptance Scenarios**:

1. **Given** a promoted launch contract, **When** the consumer invokes the host skill, **Then** `launch` ends with exactly one of the outcomes `started`, `attached`, `refused`, and prints one line (F100-FR-160).
2. **Given** a run that lives and a new host session, **When** the session starts, **Then** the consumer sees a status line that carries `validUntil`, and a line past that time says that the state is unknown (F100-FR-161).
3. **Given** a host, **When** it operates the product, **Then** it reads no file of the product and every fact it needs is a line of the CLI (F100-FR-002).
4. **Given** the `parity` profile, **When** any command runs, **Then** no line without an as-is equivalent is printed (F100-FR-176).

---

### Edge Cases

- A record of the control plane has a major that the reader does not support: the reader refuses it, names both majors, and `resume` exits 3 (F100-FR-049).
- The product was updated between launch and `resume`: the run record holds both versions and the doctor shows the difference (F100-FR-050).
- The working tree was moved or cloned: the workspace has a new identity; a launch that finds ticked phases without approval records refuses and names the three state commands (F100-FR-059).
- The runtime root dies and the engine lives: the engine finds the owner lost at its next boundary and ends with exit 6 (F100-FR-147).
- The host session ends during `launch`: the launch record has no outcome; readers derive `launch-abandoned` (F100-FR-060).
- A second user or a container starts a run on the same tree: the advisory marker refuses the launch (F100-FR-042).
- A stop during a yield: the detached job is `adoptable` and survives (F100-FR-064).
- A reader finds a value outside a closed set: it does what the row of the set says (F100-FR-208).
- A feature adds a switch and gives it no value under `parity`: the profile test fails (F100-FR-211).
- The host's shell cannot write the control root: the consumer sets another one (F100-FR-034).

## Requirements *(mandatory)*

### Functional Requirements

The functional requirements are in the annexes, F100-FR-001 to F100-FR-237. The table under "The
annexes" is their index.

### Key Entities

| Entity | What it is | Annex |
|---|---|---|
| Workspace | A working tree with a control plane of its own | B |
| Run | The logical run of one feature; survives resume and relaunch | B, E |
| Launch | One start of the runtime root | B, F |
| Engine start | One start of the engine process | B, E |
| Phase attempt, pass, unit of work, detached job | The units inside a run | B, D |
| Record | A file of the control plane with a schema id | B |
| Extension point | A versioned interface with a registry, a conformance suite and a sample | A, and the annex of its layer |
| Harness, harness descriptor, role plan | What plays a role, how it is described, what a run resolved | C |
| Closed set | A set of values with an owner and a rule for an unknown value | X |
| Profile | Named data that sets switches | X |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F100-SC-001**: Evolvability. For each of the 19 extension points, a sample implementation outside the core passes the conformance suite of its point, and the number of core files that differ between the build with the sample and the build without it is 0.
- **F100-SC-002**: Integration. On a reference project, one run started through the host package for Claude Code reaches 100 per cent of its phase gates approved, on the same build on which the oracle reports 0 results `different` under the `parity` profile and the second suite passes.
- **F100-SC-003**: One vocabulary. The consistency review over the specifications of all Wave 1 features (41 after the splits) finds 0 exit codes, stop reasons, state names, logical names, envelope fields or configuration ranks that disagree with the annexes.
- **F100-SC-004**: No closed list. 0 requirements of any feature enumerate harnesses other than by reading the registry.
- **F100-SC-005**: Time use is reported. The integration run reports the time from launch to the last approved phase gate per stage, beside the measured baseline, so that the owner of the targets of the micro-loop layer can judge them.
- **F100-SC-006**: Complete profile. 100 per cent of the switches of the product have a row in the `parity` profile; a build with a switch that has none fails.
- **F100-SC-007**: Complete closed sets. 100 per cent of the closed sets of the `contracts` package have a row with an owner and a rule for an unknown value; every file of the control plane carries `schema`; a record with a different major is refused in 100 per cent of the test cases.
- **F100-SC-008**: No leaked secret. With content capture on, 0 of the canary secrets planted at seven places appear in any sink. Passing is a release condition.
- **F100-SC-009**: Codes are stable. For every row of the exit-code tables and of the stop-reason enumeration a test ends a process in that way, and 100 per cent of the rows are covered.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host packages as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| One published package holds the CLI, the entry of the runtime and the plugin directory for Claude Code; the `contracts` package and the test kit are also published | Decision 19; ruling 30 |
| The two host skills are named `specstride-run` and `specstride-reverse` | The Stage A prompt, section 0 |
| The copyright line of the licence file is "Copyright (c) 2026 mairp" | Ruling 14 |
| The package as shipped has the audience `distributed`; the owner sets `personal` once in user configuration | Ruling 2 |
| Every parity test passes before any release | Ruling 32 |
| Feature 100 is one feature with annexes by layer and is never split | Ruling 16 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the schema files, the test runner, bundling,
and the spelling of internal functions.

## Extension points

Feature 100 states the normative interface of all nineteen. It implements none of them; the
content owner specifies the core side, the registry, the conformance suite, the sample and the
Wave 1 implementations.

| EP | Id and version | Annex | Content owner | Relation of feature 100 |
|---|---|---|---|---|
| EP-01 | `specstride.host/1` | H §H.1; G §G.1 | 113 | States the interface |
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | C §C.1 to §C.6 | 109 (stream readers: 126; role resolution: 124) | States the interface |
| EP-03 | `specstride.spec-format/1` | C §C.7 | 104 | States the interface |
| EP-04 | `specstride.loop-layer/1` | D §D.1 to §D.3 | 103 (`micro`: 115; `parallel`: 142; engine services: 143) | States the interface |
| EP-05 | `specstride.check-runner/1` | C §C.8 | 148 | States the interface |
| EP-06 | `specstride.router-rules/1` | D §D.4 | 115 | States the interface |
| EP-07 | `specstride.verification-source/1` | C §C.9 | 105 | States the interface |
| EP-08 | `specstride.event-sink/1` | C §C.10 | 111 (compatibility projection: 144; OTLP and Loki: 128) | States the interface |
| EP-09 | `specstride.view/1` | G §G.6 | 129 | States the interface |
| EP-10 | `specstride.secret-resolver/1` | C §C.11 | 110 | States the interface |
| EP-11 | `specstride.terms/1` | C §C.12 | 147 | States the interface |
| EP-12 | `specstride.quota-classifier/1` | C §C.13 | 127 | States the interface |
| EP-13 | `specstride.lock/1` | F §F.5 | 122 | States the interface |
| EP-14 | `specstride.doctor/1` | G §G.7 | 112 | States the interface |
| EP-15 | `specstride.prompt-block/1` | D §D.5 | 103 (the critic's assembler: 117) | States the interface |
| EP-16 | `specstride.toolchain/1` | C §C.14 | 116 | States the interface |
| EP-17 | `specstride.detach/1` | F §F.6 | 122 | States the interface |
| EP-18 | `specstride.critic-strategy/1`, `specstride.attempt-planner/1` (internal seams) | E §E.1 | 149 | States the interface |
| EP-19 | `specstride.stage-kind/1` | F §F.7 | 123 | States the interface |

## Threats

The threat model is annex X §X.9 (49 threats, F100-FR-216). Feature 100 is named there as an
owner of four threats. The requirement that is the control of each:

| Threat | What | Control | Requirement of feature 100 | Other owner |
|---|---|---|---|---|
| T-02 | The proposer forges approval state | The signed approval record, bound to verdict, evidence hash, verification result and tree fingerprint; `resume` verifies | F100-FR-070; F100-FR-217 | 101, 102 |
| T-30 | A link or a path leaves its root | Real paths stay inside their root; links in the control plane are refused | F100-FR-043; F100-FR-037 | 117 |
| T-43 | A malicious version is published | Publishing by the build only, from a protected branch, with an attestation that the release check reads | F100-FR-236 | 113, which cites F100-FR-236 for the host package |
| T-44 | A dependency is compromised | Few dependencies, exact versions, no install script, nothing compiled at install | F100-FR-027 (no install script, nothing compiled, every dependency at an exact version; CQ-206); F100-FR-029; the exact pin of the validator is a task of the plan (T005) | 113 |

## As-is behaviour not carried

Rows of the traceability files that are assigned to feature 100 with the disposition
`superseded-by`. The owner approved each (ruling K8).

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 028 FR-030 | The test suite and the build workflow of the Python product | DV-057 |
| 028 SC-008 | The build succeeds only when the lint and test jobs succeed | DV-057 |
| 011 SC-001 | The build matrix over four versions of the old interpreter | DV-057 |
| B-0084 (C-008) | The event that records a migration of the pre-v2 layout | DV-037 |
| B-0118 (C-009) | Exit 1 when the old interpreter is missing | DV-065 |
| B-0193 (C-012) | The output line of the migration of the pre-v2 layout | DV-037 |
| B-0252, B-0253, B-0254, B-0255, B-0272 (C-013) | The three migrations of the pre-v2 layout | DV-037 |
| B-0347 (C-018) | A legacy variable name copied to the current one | DV-036 |
| B-0354 (C-021) | The deprecation line of a legacy name | DV-036 |
| B-0360 (C-022) | The fallback to the legacy state directory | DV-036 |

As-is ids carried, and where:

| As-is id | Disposition | Requirement | Test |
|---|---|---|---|
| 028 SC-003 | merged-with 002 SC-004 | F100-FR-151 | PT-100-028SC003-* |
| 002 FR-015, 002 SC-004 | merged-with 028 SC-003 | F100-FR-152 | CT-100-1, CT-100-2 |
| 011 SC-004 | ported | F100-FR-168 | PT-100-011SC004-* |
| 011 SC-007 | ported | F100-FR-184 | PT-100-011SC007-* |
| C-008: B-0085 | translated | F100-FR-058 | PT-100-C-008-* |
| C-011: B-0157, B-0165, B-0167, B-0168 | translated | F100-FR-032, F100-FR-055 | PT-100-C-011-* |
| C-012: B-0194 | ported | F100-FR-057 | PT-100-C-012-* |
| C-013: B-0248, B-0256 | ported | F100-FR-046, F100-FR-057 | PT-100-C-013-* |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person.

- Q: Which order of configuration layers is the contract, given that the architecture names five and research names more? → A: The eight ranks of ruling 10: pin of the launch contract, flag, run snapshot (on resume only), environment, project, user, learned value, default. Integrated in annex X §X.2, F100-FR-201. (Source: `APPROVAL.md` ruling 10; `consolidation.md` C-25)
- Q: How many bits does the verdict nonce have, given that the threat-model report proposes 128? → A: 64 bits, as at the baseline. Integrated in annex E §E.1, F100-FR-139, and in threat T-01. (Source: `APPROVAL.md` ruling P16)
- Q: How long may a quota pause last by default, given that the research report on quotas proposes 12 hours? → A: 24 hours, configurable; then `blocked-on-human` with `paused_quota_ceiling`. Integrated in annex E §E.2, F100-FR-146. (Source: `APPROVAL.md` ruling 28)
- Q: Which exit codes does `resume` give for its refusals, and for which files does the changed-hash refusal hold? → A: 5 lock held, 3 nothing to resume, 3 changed source; for spec, plan and task list; the run rests in `blocked-on-human`; for the task list the hash that ignores checkboxes is compared. Integrated in annex G §G.4, F100-FR-183, and annex B §B.12, F100-FR-067. (Source: `APPROVAL.md` rulings K2, K3, P1; `feature-briefs.md` D.8 "Where rulings meet" rows 1 and 2)
- Q: Where does a critic with read-only tools stand in the critic order? → A: In step 3, behind every tool-less candidate of that step; a configured critic is step 1. Integrated in annex C §C.6, F100-FR-093. (Source: `APPROVAL.md` ruling P13)
- Q: Is the terminal record a part of the run record or a file of its own? → A: A file of its own, written by the engine; the run record is written by the runtime root. One state file per writer. Integrated in annex B §B.4 and §B.15, F100-FR-051 and F100-FR-071. (Source: `architecture.md` section 7, amendments from R15v P-8; R15v finding C-8, which stands over R15 A-6.3)
- Q: Which state files does the read model take, given that R15 names run record, lease and pause record and the red team names run record, terminal record and pause record? → A: The run record, the terminal record and the pause record as state files, and the result of a probe of the lease as a further input; the read model stays a pure function. Integrated in annex G §G.6, F100-FR-188. (Source: R15v C-8 over R15 EP-09; R15 A-7.3 on liveness)
- Q: Who mints `launchId`, given that R15 A-5.2 says the runtime root and A-7.3 has the CLI write the launch record before the root exists? → A: The CLI at `launch` and `resume`; the runtime root only for a relaunch it performs itself. Integrated in annex B §B.3, F100-FR-044. (Source: R15 A-6.2 row 1 and A-7.3, read together)
- Q: Which logical name does the approval record have: `approval:<phase>` (R15 SL-4) or `gate:<phase>:approved` (register row DV-029, rule N-02)? → A: `gate:<N>:approved`, since the divergence register ranks above the research report. Integrated in annex B §B.5. (Source: `consolidation.md` DV-029; `STAGE-B-RULES.md` section 1)
- Q: Are the pass loop and the critic commands of the CLI with exit codes of their own? → A: No. Only `spec`, `verify` and `learn` are public; the codes of the pass loop and of the critic are fields of result records. Integrated in annex G §G.1, F100-FR-171, and annex E §E.4, F100-FR-153. (Source: `APPROVAL.md` ruling 26; LR-6)
- Q: Does exit code 70 belong to the engine only or to every command? → A: To every command, on an uncaught error. Integrated in annex G §G.4, F100-FR-182. (Source: `consolidation.md` section 3.12; R15v C-13)
- Q: Does integration of a parallel group merge content? → A: No. It composes disjoint, audited deltas; a shared path refuses the later delta with `overlap`. The operation of the tree store is `compose`, not `merge`. Integrated in annex D §D.2, F100-FR-122. (Source: `feature-briefs.md` brief 100 heading 4; R29v PU-80, which stands over R29 PU-19)
- Q: Do the micro-loop layer, parallel units or concurrent verification commands add a run state, an exit code or a stop reason? → A: No. Integrated in annex A §A.5, F100-FR-031. (Source: decision 21; `architecture.md` section 8; R29 PU-03)
- Q: How many rows does the divergence register have? → A: 91, DV-001 to DV-091, when the question was asked; the brief's 85 is out of date. The register has 117 rows today. (Source: `consolidation.md` section 6.8)
- Q: Is content capture in telemetry off by default? → A: No. It follows traces and can be switched off; it is off under the `parity` profile. Integrated in annex C §C.10, F100-FR-106, and in row 16 of the profile. (Source: `APPROVAL.md` ruling 43; DV-083)
- Q: Does "no snapshot in Wave 1" (ruling 39) bar the snapshots of the tree store, and does "reserve, build nothing" (ruling 31) bar the store? → A: No to both. Ruling 39 concerns what the verification gate and grounding run on; feature 142 (after its split: feature 143) builds the part of the store that parallel units need. Integrated in annex D §D.2, F100-FR-121. (Source: `APPROVAL.md` rulings P3, P7; `feature-briefs.md` D.8 rows 3 and 4)
- Q: With which code does `launch` exit when the handshake ends in `attached` or `refused`? → A: With the supervisor's code 4, which the baseline uses for a refusal and for the launch decision `attach`; with a pipeline code where the refusal is one of the pipeline's. Integrated in annex F §F.3, F100-FR-160. (Source: R15 A-7.3 "Handshake"; `consolidation.md` section 3.10, defect D-37 preserved)
- Q: May feature 100 name as-is paths, given that a specification names no path? → A: Only on the old side of the layout table, which is content of the normalization contract. The new side names logical names only. (Source: R18 rule N-02; `feature-briefs.md` brief 100, heading 11)
- Q: Does the table of logical names hold every name that the old side of the layout table needs? → A: Not at first. Mapping all 199 `file` items of the behaviour inventory showed 33 names that were missing; they were added to annex B §B.5 during planning, with three places that are not roots of state (`temp`, `package`, `harness-home`). No requirement text changed. (Source: `docs/ecosystem/research/R18-behaviour-inventory.tsv`; R18 rule N-02)
- Q: Which row of the `parity` profile does a `parity:` field mean? → A: Every `parity:` field of feature 100 names its row or rows of annex X §X.7. Rows 36, 40 and 41 gained a field in F100-FR-078, F100-FR-008 and F100-FR-154. Row 42 belongs to feature 128 alone and has no requirement in feature 100. Two closed sets were added to annex X §X.6 (rows 87 and 88). (Source: the analysis of this feature)
- Q: Which questions could the sources not answer? → A: Ten at first, CQ-017 to CQ-026; feature 141 raised two more that bear on this feature, CQ-028 and CQ-029. Each has a reading that the specification proceeds on, listed under "Assumptions". Three rows are missing in the divergence register and are written `DV-092` to `DV-094`: the handoff written at every pass start, the polite stop, and the cache-stable order of the prompt. (Source: `STAGE-B-RULES.md` sections 3 and 4)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary; this specification repeats no definition.
- The counted unit of the pass loop is the pass. Its limit is the "pass limit" and its counter the "pass count"; a pass that does not count "is given back" and "spends no pass". The word "iteration" survives only in literals that a contract or the baseline fixes: the directive `giveIterationBack`, the keys `loop.maxIter` and `loop.yield.countsAsIter`, and `MAX_ITER` and `iter_*` of the compatibility projection (glossary row 7).
- The divergence register has 117 rows today (91, DV-001 to DV-091, when this specification was first written). The brief's figure of 85 is out of date.
- The content owners named in the annexes are those of `feature-briefs.md` sections D.3 and D.4.
- The readings of `feature-briefs.md` section D.8, "Where rulings meet", are used.
- Where the architecture file, the brief and a ruling differ, the ruling stands.

Readings that the sources do not settle. Each is marked in its requirement and reported to the
orchestrator with a recommended answer.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-017 | The name of the flag of `resume` that accepts an intended change of spec, plan or task list (ruling P12: "to be settled") | `--accept-source-change` | F100-FR-173 |
| CQ-018 | The spelling of the logical names. The sources give five | The table of annex B §B.5 | F100-FR-053 |
| CQ-019 | The field names of the record schemas. The sources give the content and some names | The field lists of annex B §B.6 to §B.18 and of the run record | F100-FR-060, F100-FR-065, F100-FR-068, F100-FR-074, F100-FR-143 |
| CQ-020 | Which existing stop reason a run that is blocked on a human ends with, per blocked reason | The table of blocked reasons of annex E §E.2 | F100-FR-144 |
| CQ-021 | Who records the state and the event when `resume` is refused for a changed source, since the CLI writes neither run state nor events | The CLI records the refusal in the launch record; readers derive the state; the next writer of the event file writes the event, marked as synthesized | F100-FR-145 |
| CQ-022 | The operations of EP-19. The sources give the two registries and their entries | `validate`, `run`, `evaluate` | F100-FR-166 |
| CQ-023 | The exit codes of commands that have no as-is equivalent | 0 success; 1 missing state or a failed act; 3 usage or invalid input; 5 where a live run forbids the act | F100-FR-186 |
| CQ-024 | The judgment exchange as a named part of the CLI protocol | Adopted with the schema id the red team of the architecture proposed | F100-FR-192 |
| CQ-025 | The operators of a table predicate and the order of evaluation | Nine operators; the first row that holds fires | F100-FR-204 |
| CQ-026 | The logical component names; and how much of the old side of the layout table is in the specification | The names of annex X §X.8; the rows that two or more features compare are in the specification, the complete list is data of the plan | F100-FR-214 |
| CQ-028 | Whether the second suite of the oracle compares compatibility output or default output (raised by feature 141) | Compatibility output; only row 1 of the `parity` profile changes | F100-FR-211 |
| CQ-029 | How a reference output is compared that lists registry entries, one of which the port does not carry (raised by feature 141) | Rule N-15: the entry is found at run time and taken out before storage and comparison | F100-FR-214 |
| CQ-182 | May a tested harness adapter whose stream has no initial record prove the tool-less form and the session by its exact version pin and its preflight (the weaker proof)? | Closed by the owner on 2026-09-30: yes, for a tested harness adapter only, recorded for every call; Principle IX of constitution v3.0.1 names the weaker proof, so it passes. The absence of any proof under the `parity` profile, for every harness (rows 28 and 117 of annex X §X.7), stays a stated deviation under that profile (plan, Complexity Tracking) | F100-FR-230; annex C §C.3; annex X §X.6 row 128 |
| CQ-201 | Does "unknown subcommand" mean the first argument only? | Yes: an unknown first argument (verb) exits 1; an unknown sub-verb takes the code of the row of its command | F100-FR-182 |
| CQ-204 | Does the model-tier bump skip a target on the critic's model whatever the effort? | No: as for escalation (CQ-191), only a target equal in model and in effort is skipped; a target that shares only the model is used with the critic-diversity warning | F100-FR-140 |
| CQ-205 | May the audience change through the environment or a flag? | No: user configuration only (ruling 2) | F100-FR-028 |
| CQ-206 | Which requirement holds the "exact versions" part of the control of T-44? | F100-FR-027: every dependency of a published package is declared at an exact version | F100-FR-027 |
| CQ-238 | May row O-33 of table 1 of feature 123 (refuse a run that rests blocked) be active under the `parity` profile too? Raised by the re-check B-8.7 | Closed by the owner on 2026-09-30: yes for O-33, no for O-34. A blocked run is refused under every profile; DV-114 is narrowed to O-34 by the orchestrator; no deviation from Principle VIII remains | F100-FR-163 |
| CQ-229 | Who reads `run:<runId>:spend`? Raised by the re-check B-8.7 (part B); not yet in the queue | The engine, the doctor and the digest; RunView is not a reader and takes spend from `usage.reported` (F129-FR-001, F129-FR-020) | Annex B §B.5, row `run:<runId>:spend` |
| CQ-202 | Does F100-FR-231 keep the as-is fallback window for a configured critic on an unlisted model outside `parity`? (with CQ-145) | Closed by the owner on 2026-09-30: no; outside `parity` such a critic with no declared window is refused; the as-is fallback holds under `parity` (DV-106, DV-111); a declared window always wins | F100-FR-231 |
| CQ-214 | How does a core package reach the one staleness verdict function of feature 104? | Closed on 2026-09-30 (recommended answer): the classification is a pure operation of the canonical hasher in the kernel (annex X §X.5), rules owned by 104; `@specstride/spec-formats` reads files and lines; EP-03 gains no operation | F100-FR-207 |


## Amendments after the fan-out

Made on 2026-09-29, after the other features were specified (31 then, 40 after the splits), from
`docs/ecosystem/STAGE-B-F100-AMENDMENTS.md` (208 rows). The worklist, one line per row with what
was done, is [amendments-worklist.md](amendments-worklist.md). Nothing was renumbered: every
section number, requirement id, table row number and logical name that existed is as it was.

| What | Before | After |
|---|---|---|
| Requirements | 226 | 235 (F100-FR-227 to F100-FR-235 added) |
| Closed sets, annex X §X.6 | 88 rows | 270 rows (89 to 270 added) |
| Rows of the `parity` profile, annex X §X.7 | 43 | 129 (44 to 129 added) |
| Logical names, annex B §B.5 | 109 | 125 |
| Alias rows, annex X §X.8 | 21 | 40 |
| Sections | — | Annex B §B.20 and annex G §G.10 added |

### Requirements added

| Id | Section | Subject | Raised by | Queue or register id |
|---|---|---|---|---|
| F100-FR-227 | Annex B §B.20 | Further schema ids, fields with their owners | 117, 115, 126, 146, 106, 122, 140, 127, 119 | CQ-105, CQ-114 |
| F100-FR-228 | Annex B §B.2 | The check of files that learning reads while a run writes them | 106 | CQ-115 |
| F100-FR-229 | Annex B §B.5 | The as-is event file per engine start; the comment; the pointer to the status line | 111, 107, 113 | CQ-033, CQ-038 |
| F100-FR-230 | Annex C §C.3 | The session identity in the proof of a critic-class call | 134, 131, 125 | CQ-110, CQ-117 |
| F100-FR-231 | Annex C §C.3 | The context window of a critic model | 125, 131, 130, 138 | CQ-145, CQ-118; DV-106, DV-111 |
| F100-FR-232 | Annex C §C.8 | Reuse of a staged command | 148 | — |
| F100-FR-233 | Annex G §G.10 | The interface between the front door and the presenter | 145, 119 | CQ-101, CQ-121 |
| F100-FR-234 | Annex A §A.3 | What the kernel offers to the core; edge packages | 118, 115, 142, 148, 123, 112 | — |
| F100-FR-235 | Annex A §A.4 | The calls of the engine into learning | 106 | — |

### Changes in place

Each row changed the meaning of something that existed. The id or the section is unchanged.

| Id or section | What it said | What it says | Raised by | Queue or register id |
|---|---|---|---|---|
| Annex X §X.6 row 9, 34, 40, 41, 42, 53, 54 | Owners 101, 124, 110, 110, 110, 105, 105 | Owners 149, 146, 147, 147, 147, 148, 148 | The splits 149, 146, 147, 148 | — |
| Annex X §X.6 row 10 | Unknown kill reason: class `budget` | Class `futility`, as at the baseline (B-0606) | 118 | — |
| Annex X §X.6 row 13 | "The 11 literals …; the list is in the specification of 123" | The eleven literals | 123 | — |
| Annex X §X.6 row 14 | "The 21 literals and the approval `classified-transient`" | 30 refusals of the first table, 4 refusals and one approval of the second | 123 | CQ-052, CQ-053 |
| Annex X §X.6 row 31 | Open sets, no members | The kinds and the stream formats of Wave 1 | 126 | — |
| Annex X §X.6 row 39 | "one for pi, one for prime" | `prime`, `pi` | 138 | — |
| Annex X §X.6 row 51 | Three refusals | Six refusals with their exit codes | 102 | CQ-077 |
| Annex X §X.6 row 53 | `changed-during-check` among the reasons of `unchecked` | Three reasons of `tainted`, seven of `unchecked` | 105, 148 | CQ-154 |
| Annex X §X.6 row 59 | Five fallback reasons | Six: `tripwire` added | 115 | CQ-080 |
| Annex X §X.6 rows 60, 63, 65 | Members partly in the owner's specification | Every member | 142, 115 | — |
| Annex X §X.6 row 66 | Four further facts | Five: `task-list-changed` added | 115 | — |
| Annex X §X.6 row 67 | Three decision points, choice sets by reference | The choice sets; the point `attempt-tier` of the attempt planner | 115, 101, 149 | — |
| Annex X §X.6 row 76 | A key without a class is widening | Also: a key of the run snapshot without a class is read as `pinned` | 102 | CQ-079 |
| Annex X §X.7 rows 6, 7, 17, 24, 31, 32, 34 | Owners 105, 105, 111, 101, "105, 117", 115, 110 | Owners 148, 148, 144, 149, "148, 117", "115; 101 performs the comparison", "110; read by 147" | The splits; 101 | — |
| Annex X §X.7 row 13 | Counts survive a resume; resume fixtures pass the flag | Also a rerun through `run` or `launch` | 102 | CQ-076 |
| Annex X §X.7 row 16 | Default "follows traces" | Default `auto`: follows traces | 110 | — |
| Annex X §X.7 rows 26, 28, 29 | Value under `parity` in words | The reserved literals `baseline` and `as-is`; row 26 names the extra flags of the critic and the tool allow-list; row 28 names the as-is context window | 110, 138, 131 | CQ-118 |
| Annex X §X.7 row 42 | Key `otel.legacyMetricNames` | Key `telemetry.otel.legacyMetricNames`; the reading of `off` is stated | 110, 128 | DV-058 |
| Annex X §X.7, first paragraph | Keys are proposals | Keys are confirmed by feature 110; the spelling rule; the rank of the profile | 110, 147 | CQ-157, CQ-160 |
| Annex X §X.7 row 86 | — (new row) | The proposed key `stream.capture` is the switch of row 79, `stream.tap` | 138, 110 | — |
| Annex X §X.8, alias table | The state-directory variable maps to "the control root" | It maps to the key `state.dir`; 19 alias rows appended | 122, 110 and eight others | DV-027; CQ-120 |
| Annex X §X.8, layout table, old side | No row for the two as-is prompt files | One row, to `pass:<passId>:prompt` | 103 | — |
| Annex X §X.2 | Learned pass ceiling only | Also the learned yield poll, the declared per-phase value, the snapshot at a continuing launch, the keys of the auth tier and the override | 110, 147, 102 | CQ-158, CQ-075 |
| F100-FR-203 | Configuration is validated at launch | Adds: a value read through an alias fails where the baseline fails, under `parity` | 117 | — |
| F100-FR-204 | Five users of the table evaluator | Six: the attempt planner, with the decision point `attempt-tier` | 101, 149 | — |
| Annex X §X.9, T-06 | The halt is reported as blocked on a human | A stop that is not retryable, with an attention item and no `blocked` event | 101 | — |
| F100-FR-217, F100-FR-003, F100-FR-004 | The CLI writes inbox requests, launch records and the supervision record | The CLI writes what annex B §B.5 gives it as writer; the list is stated | 108, 107 | CQ-092 |
| F100-FR-037 | "the carry-over files" | Names them: the handoff and the proposer's notebook | 117 | — |
| Annex B §B.5 | 109 logical names | 125: 16 appended; `attempt:…:session` states the place at auth tier 1; `user:harness-verify:<id>` has a schema id | 111, 107, 117, 109, 124, 146, 128, 127, 108, 130, 106, 113, 125 | CQ-033, CQ-038, CQ-065, CQ-093, CQ-123, CQ-143 |
| Annex B §B.7, launch record | `mode`: `run` or `dry-run`; `refusal` as free text | A `dry-run` writes no launch record; `refusalFile` and four flags added | 107, 102, 129, 124 | CQ-037, CQ-072, CQ-166, CQ-106 |
| F100-FR-063 (annex B §B.10) | The job of a yield is `adoptable` | Also a long verification job | 118 | CQ-055; DV-098 |
| Annex B §B.11, inbox | No field for who asked | `causedBy`, default `operator` | 102 | CQ-078 |
| Annex B §B.18, tripwire record | `kind` from the integrity kinds | `kind` from the breach kinds (annex X §X.6 row 141) | 115 | CQ-083 |
| F100-FR-075 (annex B §B.19) | A signed archive | The archive has the schema id `specstride.state-archive/1` | 122 | CQ-139 |
| Annex C §C.10 (EP-08), F100-FR-104 | `open` takes "the context of the run"; four operations | The content of the context is listed; a fifth operation, `status`; content owner 111 with 144 for the projection sink | 111, 126, 128, 119, 144 | CQ-032, CQ-119 |
| Annex C §C.7 (EP-03) | `tick` takes task ids | Task ids, or a phase number | 104 | — |
| Annex C §C.2 | `continuation`: supported, and how an id is given | Also `cacheTtlSec` | 103 | CQ-068 |
| Annex C §C.3 | The proof needs "the minted session id" | The session identity of F100-FR-230, in three cases | 134, 131, 125 | CQ-110, CQ-117 |
| Annex C §C.5, dialect row | Eight fields | Ten: `limits`, `endWords` | 138 | — |
| Annex C §C.6 | Runners-up inside `criticPick` | A field `runnersUp` of its own | 124 | — |
| Annex C §C.14 (EP-16) | A profile names no command | One fixed argument list of a pinned executable is allowed | 115 | CQ-085 |
| F100-FR-111 (annex C §C.15) | The runtime never asserts a sandbox | Except the as-is assertion variable under the `parity` profile | 109 | DV-030 |
| Annex C §C.15, level C2 | Credential paths denied | The denial by a given harness is `unverified` until a capture | 131 | — |
| Annex C §C.16, overlay | Six fields | The marker also holds `ownerPid`, `ownerStart`, `createdAt`, `markerScope` | 109 | CQ-064 |
| Annex C §C.8, §C.12 | Content owners 105, 110 | Content owners 148, 147 | The splits | — |
| Annex D §D.6, yield artifact | No fields `stable_sec`, `pid`, `argv` under `resume_when` | The three fields, which the baseline requires | 118 | — |
| Annex D §D.4 (EP-06) | Every decision is an event | Every decision is an event once a loop layer is engaged; the signals include the state of the limit window of an escalation target | 115, 127 | CQ-136 |
| Annex D §D.7, `facts` | Four further facts | Five: a task list that changed since launch | 115 | — |
| F100-FR-137 (annex D §D.8) | One manifest per phase; `parity`: row 1 | Written when the strategy is not `classic` or one of rows 6, 7, 31, 33 is on; never under `parity` | 105 | CQ-153 |
| Annex E §E.1 (EP-18) | Inputs of `judge` and `next`; content owner 101 | `judge` receives the call function of the engine; `next` receives two more facts; content owner 149 | 149 | — |
| F100-FR-139 | After the call only the hash of the nonce is recorded | The verdict record and the feedback may hold the nonce in clear after the call | 101 | CQ-173 |
| F100-FR-148 | A stop reason on every exit other than 0 | A stop reason on every exit that has a member; otherwise null | 101 | CQ-174 |
| Annex E §E.2, T11 and T12 | "The backoff is over"; "the relaunch window" | The backoff of the failed stage, or 0; the window is the wall-clock deadline of the relaunch budget | 123 | CQ-048, CQ-049 |
| Annex E §E.2, run record | — | A field `verificationParallelism` | 148 | — |
| Annex E §E.4, pass loop, result 3 | Invalid overlay declaration only | Also a stop before a pass for a changed source | 103 | CQ-067 |
| Annex F §F.3, outcome `refused` | Exit 4, or a pipeline code | Exit 24 for `lock-conflict` and `lock-unknown`, 4 for the other refusals of the detached runtime, 3 for a refusal of role resolution in the foreground | 122, 124 | CQ-107 |
| F100-FR-161 | The status line carries `validUntil` | `validUntil` is `none` for a run that rests | 129 | CQ-163 |
| Annex G §G.1, commands | `run`, `resume`, `reverse`, `supervise`, `harness verify`, `doctor` as first written | `run` continues a run and takes the ported flags; `resume` takes `--resolve-roles` and the route of the last launch; `reverse` has four verbs, `--detach`, `--comment`; `supervise hold`, `supervise release` and `host event` added; owners stated | 102, 124, 108, 123, 113, 128, 109, 146, 112 | CQ-076, CQ-106, CQ-090, CQ-091, CQ-048, CQ-087 |
| F100-FR-172 | Every `--json` output is one record | In compatibility output `events --json` prints one record per line | 119 | — |
| Annex G §G.3, digest | The as-is grammar only | Facts without an as-is field go to the digest record and to the line `[SPECSTRIDE-DIGEST]`; five product lines listed | 107, 124, 102 | — |
| Annex G §G.3, `[LOOP]` line | `protection`; five fields of parallel units | `protection=detect,basic`; `worker-caches`, `wall-hours`, `agent-hours` | 115, 142 | CQ-082 |
| Annex G §G.4 | `spec`: 0, 2, 3; `resume`: three refusals | `spec` also 1; `resume`: the route through the root and six refusals; 127 for a flag without its value; the code of the shim on a protocol mismatch; codes of the new commands | 104, 102, 119, 113, 123 | CQ-042, CQ-073, CQ-077, CQ-098 |
| Annex G §G.6 (EP-09) | Inputs: three state files and a lease probe; cursor of three parts | Further values that the caller supplies; the cursor carries a hash of the change signature; the owner text | 129, 119 | CQ-161, CQ-164 |
| Annex G §G.7 (EP-14) | "The six launch checks of the as-is supervisor" | Names them; who assigns the ids of a harness adapter's checks; where the registration call lives | 112, 123, 134, 138 | CQ-108, CQ-150 |
| Annex G §G.8 | No field for declared scopes | `configuration.scopes` | 107 | DV-097 |
| F100-FR-192 | The exchange is exposed | Names feature 107 as the one that implements it | 107 | — |
| Annex H §H.1 (EP-01), errors | `protocol-mismatch` refused with one line | The line, the exit code 4 and the variable that names the executable | 113 | CQ-089 |
| Package graph (`contracts/sources/package-graph.json`) | 26 packages | 29 packages: three edge packages added (integrity, tree store, check runner); owners after seven splits | 115, 142, 148, 146, 140, 144, 145, 147, 149 | — |

### Rows of annex X §X.7: proposed number to final number

Several features proposed "row 44" and upward for themselves, or asked for a row without a
number ("needed"). The final numbers are these. Where a feature asked for several rows that set
one thing, one row holds the keys together.

| Feature | Proposed | Final row of §X.7 | Switch |
|---|---|---|---|
| 101 | needed | 58 | Block set of the critic's prompt, which the prompt of the diagnostician also reads |
| 101 | needed | 128 | K of the model-tier bump |
| 101 | needed | 129 | Refusal of a start for ticked phases without an approval record |
| 102 | row 44 | 62 | Continuation of an unfinished run |
| 102 | row 45 | 63 | End of adoptable jobs at a stop |
| 103 | row 44 | 59 | No-progress breaker on the structured path |
| 103 | row 45 | 60 | Parameters of carry-over |
| 104 | row 44 to 46 | 49 | Inputs of the specification |
| 105 | needed | 123 | Verification mode |
| 105 | needed (three rows asked; one row given) | 124 | Places of the verification plan, the verification-commands document and the test scaffolds |
| 105 | needed | 125 | Environment allow-list of a check |
| 105 | needed | 126 | Lines of the failure summary |
| 107 | needed | 47 | Delegation of derivation judgment to a harness |
| 107 | needed | 48 | Ceilings of the relaunch count and of the wall clock |
| 108 | needed | 66 | Detached reverse run |
| 108 | needed | 67 | Comment of a reverse run |
| 108 | needed | 68 | Tasks mode of a reverse run |
| 108 | needed | 69 | Limits of the source inventory |
| 111 | row 44 | 44 | Limits of the observability policy |
| 111 | row 45 | 45 | Retention of captures |
| 111 | row 46 | 46 | Time limit of a call of a sink |
| 112 | needed | 61 | Options of the doctor |
| 115 | needed | 64 | Routing |
| 115 | needed (ten rows asked; one row given) | 65 | Caps of the micro-loop layer |
| 117 | P-1 | 52 | Grounding pass of the critic |
| 117 | P-2 | 53 | Cap of presence lines |
| 117 | P-3 | 54 | Ceiling per file of an anchored excerpt |
| 117 | P-4 | 55 | Context window of the critic, set by the consumer |
| 117 | P-5 | 56 | Debug output of the critic |
| 117 | P-6 | 57 | A critic prompt still over the window |
| 117 | P-7 | 58 | Block set of the critic's prompt, which the prompt of the diagnostician also reads |
| 118 | row 44 | 50 | Grace of the polite stop |
| 118 | row 45 | 51 | Grace of a stop at a first failure |
| 119 | row 44 | 70 | Live timeline |
| 119 | row 45 | 71 | Live detail |
| 119 | row 46 | 72 | Verbose output |
| 119 | row 47 | 73 | Colour depth |
| 119 | row 48 | 74 | Banner |
| 119 | row 49 | 75 | Animation |
| 119 | row 50 | 76 | Live rail |
| 119 | row 51 | 77 | Background of the banner |
| 119 | row 52 | 78 | ASCII glyphs |
| 122 | needed | 113 | Detach strategy |
| 122 | needed (three rows asked; one row given) | 114 | Limit of the handshake; heartbeat and grace of the lease |
| 122 | needed | 115 | Lock and liveness provider |
| 122 | needed (proposed key `state.controlRoot`) | 116 | Control root |
| 124 | P-1 | 87 | Discovery |
| 124 | P-2 | 88 | Metadata pass of discovery |
| 124 | P-5 | 89 | Safety margin on a context window from the catalogue |
| 124 | P-3 | 90 | Refusal at launch of a role name that the registry does not hold |
| 124 | P-4 | 91 | Hard spending cap of an automatically picked metered critic |
| 124 | P-6 | 92 | Line of the critic-diversity warning |
| 125 | row 47 | 119 | Slash-command skills of the Claude proposer |
| 125 | row 48 | 120 | Scrub of credentials from the environment of tool commands |
| 125 | row 49 | 121 | Removal of the harness's repository snapshot from context |
| 125 | row 50 | 122 | Refusal of the sub-agent tool on the SDK transport |
| 126 | needed | 79 | Stream tap |
| 126 | needed | 80 | Executable of the stream tap |
| 126 | needed | 81 | Caps on the size and the rate of stream lines |
| 126 | needed | 82 | Flag of a pass that did nothing |
| 126 | needed | 83 | Invocation record for every pass |
| 126 | needed | 84 | Base of the invocation id |
| 126 | needed | 85 | Debug retention of prompt and reply |
| 127 | new | 107 | Wall-clock budget of a run |
| 127 | new | 108 | Ceilings per role and per run |
| 127 | new | 109 | Alert thresholds |
| 127 | new | 110 | Rate table for estimated cost |
| 127 | row 39 (shared) | 111 | Margin, jitter and probe schedule of a quota pause; bounds of the retries at pass level |
| 127 | row 40 (shared) | 112 | Delay and return of a fallback |
| 128 | needed | 97 | Loki sink |
| 128 | needed | 98 | OTLP exporter |
| 128 | needed | 99 | Traces when the exporter is on |
| 128 | needed | 100 | Attribute dialects |
| 128 | needed | 101 | Limits of captured content |
| 128 | needed | 102 | Time limit of a request of a sink |
| 128 | needed | 103 | Bound of a batch |
| 128 | needed | 104 | Flush interval |
| 128 | needed | 105 | Buffer of a sink |
| 128 | needed | 106 | Credential of a collector |
| 129 | needed | 127 | Precomputed status line |
| 130 | needed | 117 | Proof of the critic mode of dsh |
| 130 | needed | 118 | Plugin allowlist of a harness |
| 138 | needed | 86 | Capture of the agent stream |
| 142 | needed | 93 | Declared write scope of a task |
| 142 | needed | 94 | Tasks removed from eligibility |
| 142 | needed | 95 | Seed paths of worker trees |
| 142 | needed | 96 | Capacity of an exclusive resource |

### Rows of annex X §X.6 added, by owner

No feature proposed a number for a closed set. Rows 89 to 270 were given in the order in which
the features were read.

| Owner | Rows of §X.6 added for it |
|---|---|
| 101 | 251 to 252, 255 |
| 102 | 135 |
| 103 | 132 to 133 |
| 103; 117 | 121 |
| 104 | 97 to 100 |
| 105 | 228 to 232, 234 |
| 106 | 187 to 196 |
| 107 | 256 to 261 |
| 108 | 150, 156 |
| 109 | 123 to 131 |
| 110 | 237 to 242 |
| 111 | 89 to 90, 93 to 96 |
| 112 | 134 |
| 113 | 144 to 145 |
| 115 | 136 to 143 |
| 117 | 115 to 120, 122 |
| 118 | 112 to 114 |
| 119 | 157 to 159 |
| 122 | 209 to 214 |
| 123 | 101 to 111 |
| 124 | 180 to 183 |
| 125 | 219 to 221 |
| 126 | 169 to 177 |
| 127 | 205 to 208 |
| 128 | 197 to 204 |
| 129 | 243 to 250 |
| 130 | 215 to 217 |
| 131 | 218 |
| 138 | 222 to 227 |
| 140 | 146 to 149, 151 to 155 |
| 141 | 262 to 270 |
| 142 | 184 to 186 |
| 144 | 91 to 92 |
| 145 | 160 to 168 |
| 146 | 178 to 179 |
| 148 | 235 to 236 |
| 148; `DEADLINE`: 105 | 233 |
| 149 | 253 to 254 |

### Where features proceeded on different readings

| Subject | Readings | Reading taken | Marked |
|---|---|---|---|
| Context window of a critic model that is not listed | Register rows DV-106 and DV-111 (131, 130): no default window, the model does not qualify. CQ-145 (125): the as-is fallback is kept as the smallest window of the table | Under the `parity` profile the as-is fallback of each harness. Outside it: never for an automatic pick; a configured critic with no declared window is refused (owner's answer on CQ-145 and CQ-202, 2026-09-30). A declared window always wins | F100-FR-231, `assumption: CQ-145; CQ-202; CQ-118` |
| Key of `SPECSTRIDE_CONTEXT_BUDGET` | 104: `spec.contextBudget`. 108: `reverse.contextBudget` | Both keys stand; the one variable feeds both, as feature 110 settled | Annex X §X.8, alias table; profile rows 49 and 69 |
| Key of the write scope of a parallel task | 142: `loop.parallel.scopes.<taskId>`. 110 at first: `loop.parallel.tasks.<taskId>.writes` | The key of 142; feature 110 withdrew its own | Profile row 93 |
| Session id in the proof of a critic | 134 (CQ-110): the identity where the initial record carries one, otherwise the weaker proof. 131 (CQ-117): the id of the first stream record, which no pass of the run may have used | Both, as cases of one rule, with the case recorded | F100-FR-230 |
| Content of the context of `open` of a sink | 111: a content accessor. 126: four as-is labels. 128: a lookup of the as-is name | All three; they do not exclude each other | F100-FR-104, `assumption: CQ-032; CQ-119` |
| Key of the control root | 122: `state.controlRoot`. 110: `state.dir` | `state.dir`; feature 110 owns the spelling | Profile row 116 |
| Default of `roles.refuseUnknown` | 124: on, off under `parity` (DV-104). The key list of 110 gave the default `off` at first | Settled: on, as the owner of the behaviour and the register row say; the list of 110 gives `on` | Profile row 90 |
| Capture of the agent stream | 138: a key `stream.capture`. 126: `stream.tap` | One switch, `stream.tap`; row 86 points to row 79 | Profile rows 79 and 86 |
| A failed proof of a critic | Feature 100: a refusal that halts. 125, from the research on the harness: a failed critic call | A configured critic is refused and the run halts; an automatically picked one is passed over. Under `parity` no proof is made | F100-FR-230 |
| Unknown kill reason | Feature 100 row 10: class `budget`. 118, from the baseline: class `futility` | `futility`, as the baseline | Annex X §X.6 row 10 |
| Halt at the MALFORMED limit | Threat T-06: blocked on a human. 101: a stop that is not retryable, without a `blocked` event | The reading of 101, which keeps the as-is stop | Annex X §X.9, T-06 |

### Points not applied

| Row of the amendments file | Point | Why |
|---|---|---|
| 28, 42, 111, 130, 153, 172, 200 | Scenarios, families and lists of feature 141 (FX-07, FX-13, FX-25, FX-29, FX-35, FX-36) | They are for feature 141, which this feature does not edit |
| 50, 97 | Fixture families cited in the traceability files | The traceability files are not written by a feature |
| 76, 110, 122, 137 | Names of event types and fields of events | Content of the event schema, owned by 111; feature 100 owns the envelope |
| 77 | Wider wording of register row DV-052 | The register is not written by a feature |
| 148 | A command to free a foreign or unknown lock | CQ-140 recommends no command in Wave 1 |
| 205 | The assignment of a success criterion in `feature-briefs.md` | Not written by a feature |

Rows of the amendments file that needed no change are marked "no change" in the worklist, with
the reason.

### Repairs after the cross-feature review

Made on 2026-09-29 and 2026-09-30 from section 1 of `docs/ecosystem/reviews/REPAIR-WORKLIST.md`. The running
report, item by item, is [repair-report.md](repair-report.md). Nothing was renumbered: every
requirement id, row number of a closed set, row number of the profile and logical name that
existed is as it was. New rows were appended.

| What | Before | After |
|---|---|---|
| Requirements | 235 | 236 (F100-FR-236 added) |
| Closed sets, annex X §X.6 | 270 rows | 270 rows; owner or "Closed by" changed in rows 64, 142, 143 |
| Rows of the `parity` profile, annex X §X.7 | 129 | 131 (130 and 131 added) |
| Further schema ids, annex B §B.20 | 14 | 15 (`specstride.span-state/1` added) |
| Alias rows, annex X §X.8 | 39 | 35 (four rows that stood twice dropped; two rows narrowed) |

#### Requirement added

| Id | Section | Subject | Item | Queue or register id |
|---|---|---|---|---|
| F100-FR-236 | Annex X §X.9 | Publishing by the build from a protected branch, with attestation: the control of threat T-43 | W-100-17 | — |

#### Requirements changed in place

| Id | What it said | What it says | Item | Queue id |
|---|---|---|---|---|
| F100-FR-012 (annex A §A.3) | A core package starts no process and opens no connection; the file system was not named | A core package does not import the file-system module of the platform; it reads and writes files through the kernel and the ports of the edge packages | W-100-25 | CQ-185 |
| F100-FR-111 (annex C §C.15) | C0 needs an opt-in in user configuration | The same, and the environment, a flag and project configuration cannot give the opt-in | W-100-23 | CQ-183 |
| F100-FR-112 (annex C §C.15) | `loop.parallel.allow_detect` set in user configuration, the environment or a flag | Set in user configuration only | W-100-23 | CQ-183 |
| F100-FR-119 (annex D §D.1) | "give its iteration back"; "outside the iteration loop" | "be given back, so that it does not raise the pass count"; "outside the pass loop", "no pass of the pass limit" | W-100-14 | — |
| F100-FR-127 (annex D §D.3) | `loop.parallel.workers` defaults to 2 with the ceiling 4 | The ceiling is the key `loop.parallel.workersMax`, default 4, a widening key; a worker count above the ceiling in force is a configuration error | W-100-06 | Ruling P5; CQ-006 |
| F100-FR-130 (annex D §D.4) | Escalation never lands on a model of a critic-class call | Never on a rung that equals a critic-class call in model and in effort (`targetIsCriticModel`); a rung that shares only the model is allowed, with the critic-diversity warning | W-115-02 | CQ-191 |
| F100-FR-143 (annex E §E.2) | "the proof that the critic holds no tools" | "the proof that the critic holds no tools or only read-only tools", as F100-FR-218 | W-100-12 | — |
| F100-FR-146 (annex E §E.2) | A quota pause spends "no iteration" | "no pass" | W-100-14 | — |

#### Owners, rows and tables changed

| Id or section | What it said | What it says | Item |
|---|---|---|---|
| EP-16, annex C §C.14 "Content owner"; table "Extension points" | 115; consumed by 105 and 142 | 116; consumed by 105, 148, 142, 143 and 112; the schema file of `specstride.toolchain/1` is written by 116 | W-100-02, W-100-10 |
| EP-02, table "Extension points" | Sub-points: stream readers 126, discovery 146, role resolution 124 | "discovery: 146" deleted; annex C §C.1 names no such sub-point, and feature 146 consumes EP-02 | W-100-13 |
| Fact block, annex D §D.7 | Content owner 115 | 116 | W-100-02 |
| Annex B §B.20, `specstride.protected-set/1`, `specstride.check-result/1` | Owner 115 | Owner 116 | W-100-02 |
| Annex X §X.6 rows 142, 143 | Owner 115 | Owner 116 | W-100-02 |
| Annex X §X.6 row 64 | Closed by: owner decision | Closed by: design (ruling P3 allows the subset to be built; the seven operations come from the design) | W-100-07 |
| Package graph, `@specstride/integrity` | Owner 115 | Owner 116 | W-100-02 |
| Package graph, `@specstride/tree-store` | Owner 142 | Owner 143 | W-100-03 |
| Package graph, core packages | `node:fs` forbidden as write calls, to `@specstride/layer-parallel` only | `node:fs` and `node:fs/promises` forbidden to the three core packages; one rule added; the rule on the splits "not yet applied" removed | W-100-25 (CQ-185), W-100-02 |
| EP-04, annex D §D.1 "Content owner"; table "Extension points" | `parallel` and the engine services: 142 | `parallel`: 142; the engine services behind the group directives: 143 | W-100-03 |
| Tree-store service, annex D §D.2 | Content owner 142 | 143 | W-100-03 |
| Ledger, annex B §B.13 "Content owner" | 142: `parallel` | 143: `parallel` (the namespace of the layer of 142; the engine services write its records) | W-100-03 |
| Annex X §X.7 row 21 | Default "2 (ceiling 4)" | "2; the ceiling is the key of row 130" | W-100-06 |
| Annex X §X.7 row 30 | No key ("follows the auth tier"); under `parity` "Overlay scope `none`" | Key `harnesses.<id>.overlay`; under `parity` `none` | W-100-04 |
| Annex X §X.7 row 34 | Owner "110; read by 147" | Owner 147 | W-100-04 |
| Annex X §X.7 row 65 | `.proposalMinutes`, `.unitMinutes`, `.checkMinutes` | `.proposalMin`, `.unitMin`, `.checkMin` | W-110-11 (CQ-160) |
| Annex X §X.7 row 92 | "Line of the same-model warning" | "Line of the critic-diversity warning"; the key `critic.warnSameModel` is unchanged | W-100-15 |
| Annex X §X.7 row 124 | Defaults: none | `testautomation/<slug>/TEST_PLAN.md`; none; `testautomation/<slug>/generated`, unless the mode is `off` | W-100-05 |
| Annex X §X.7, introduction | Suffixes `Sec`, `Ms`, `Min`, `Bytes`; keys marked "(proposed)" | Suffixes `Sec`, `Ms`, `Min`, `Days`, `Bytes`, `Percent`; no key is marked | W-110-11, W-100-08 |
| Annex X §X.8, alias table | Six pairs of rows that named one variable twice; two keys marked "(proposed)" | Four earlier rows dropped; the rows of the verification and of the telemetry variables keep the variables that no later row names and give their keys in full; the row of `SPECSTRIDE_YIELD_*` keeps the mapping of the other variables to `loop.yield.*`; no mark | W-100-08 |
| Annex G §G.4 | "Any command, unknown subcommand" | "Any command, unknown first argument (verb)" | W-100-11 |
| Annex G §G.4, row `resume`, and the table of colliding numbers | No code for a workspace without state; "pass loop iteration limit" | 1 without state, the first check; "pass limit of the pass loop" | W-100-24 (CQ-184), W-100-14 |
| Annex E §E.1, §E.4; annex C §C.6, §C.13; annex D §D.1 | "same-model warning"; "Iteration limit"; "spend no iteration"; "does not count as an iteration" | "critic-diversity warning", raised for the results `same-model` and `unverified`; "Pass limit"; "spend no pass"; "is given back" | W-100-14, W-100-15 |
| Annex F §F.2, kind `engine`; annex B §B.7, field `request` | "engine invocation" | "engine start" | W-X-06 |
| Generator, field `keys` of `data/parity-profile.json` | Every name in backticks of the key cell | The configuration keys only, short forms written in full; `key` is null where a row has no key | W-100-01 |

#### Records kept

The inspection records `specstride.inspect.<verb>/1` stay with feature 119 after the split of 119
and 145 (annex B §B.20; CQ-099; W-100-09).

#### Not applied, and open

| Item | State | Why |
|---|---|---|
| W-100-18 | Applied by the second pass (A1, 2026-09-30) | Feature 111 listed the members (W-111-05); rows 271 to 273 of annex X §X.6 were appended, and rows 5 and 96 stand, with the relation stated after the table |
| W-110-12 | Nothing to change | Feature 100 has no bare "tier bump"; every use reads "model-tier bump" |
| W-100-08, in part | Two of the six earlier rows were narrowed and not dropped | They name variables that no later row names (`SPECSTRIDE_VERIFICATION`, `SPECSTRIDE_TEST_PLAN`, `SPECSTRIDE_VERIFICATION_COMMANDS`, `SPECSTRIDE_GENERATE_TESTS`; `SPECSTRIDE_TELEMETRY_ENABLED`, `SPECSTRIDE_LOKI_URL`, `SPECSTRIDE_OTEL_ENABLED`, `SPECSTRIDE_OTEL_URL`) |

#### Analyze of 2026-09-30, requirements changed in place

Made on 2026-09-30 from the findings of the `speckit-analyze` run of that date, at the owner's
request (`analyze-report.md`, section "Analyze of 2026-09-30 (owner's request) and repairs").
Nothing was renumbered; no requirement, closed-set row or profile row was added. The contracts were
regenerated.

| Id | What it said | What it says | Finding |
|---|---|---|---|
| F100-FR-008 (annex A §A.2) | "No loop layer and no router MUST call role resolution" | "A loop layer or a router MUST NOT call role resolution" | B1 (meaning unchanged) |
| F100-FR-023 (annex A §A.5) | "No requirement of any feature MUST assume a closed list of harnesses" | "A requirement of any feature MUST NOT assume a closed list of harnesses" | B1 (meaning unchanged) |
| F100-FR-029 (annex A §A.5) | "No published file MUST hold a path" | "A published file MUST NOT hold a path" | B1 (meaning unchanged) |
| F100-FR-032 (annex B §B.1) | "No mutable file MUST be shared between two workspaces" | "A mutable file MUST NOT be shared between two workspaces" | B1 (meaning unchanged) |
| F100-FR-033 (annex B §B.1) | "Neither MUST exist when parallel units are off" | "The worker root and the tree store MUST NOT exist when parallel units are off" | B1 (meaning unchanged) |
| F100-FR-035 (annex B §B.2) | "Nothing in the workspace part MUST decide anything" | "A file in the workspace part MUST NOT decide anything" | B1 (meaning unchanged) |
| F100-FR-052 (annex B §B.4) | "No record of this annex MUST hold a secret value" | "A record of this annex MUST NOT hold a secret value" | B1 (meaning unchanged) |
| F100-FR-087 (annex C §C.3) | "No critic path MUST ever receive a flag that allows all tools" | "A critic path MUST NOT ever receive a flag that allows all tools" | B1 (meaning unchanged) |
| F100-FR-092 (annex C §C.6) | "nothing MUST be resolved after launch" | "a resolution MUST NOT take place after launch" | B1 (meaning unchanged) |
| F100-FR-095 (annex C §C.7) | "no second parser MUST exist" | "a second parser MUST NOT exist" | B1 (meaning unchanged) |
| F100-FR-104 (annex C §C.10) | "No failure of a sink MUST change" | "A failure of a sink MUST NOT change" | B1 (meaning unchanged) |
| F100-FR-117 (annex D §D.1) | "No layer MUST be able to write an approval" | "A layer MUST NOT be able to write an approval" | B1 (meaning unchanged) |
| F100-FR-121 (annex D §D.2) | "and no operation other than `apply` MUST be able to write a path of the workspace" | "and an operation other than `apply` MUST NOT be able to write a path of the workspace" | B1 (meaning unchanged) |
| F100-FR-122 (annex D §D.2) | "No model MUST take part in integration" | "A model MUST NOT take part in integration" | B1 (meaning unchanged) |
| F100-FR-123 (annex D §D.2) | "No operation of the store or of a layer MUST write a file" | "An operation of the store or of a layer MUST NOT write a file" | B1 (meaning unchanged) |
| F100-FR-125 (annex D §D.2) | "nothing MUST be reverted"; "No result obtained in a worker tree and no merge check MUST replace an execution" | "the applied changes MUST NOT be reverted"; "A result obtained in a worker tree or a merge check MUST NOT replace an execution" | B1 (meaning unchanged) |
| F100-FR-128 (annex D §D.3) | "Nothing about groups or workers MUST reach a critic-class call"; "No worker tree MUST exist when a critic-class call starts" | "Information about groups or workers MUST NOT reach a critic-class call"; "A worker tree MUST NOT exist when a critic-class call starts" | B1 (meaning unchanged) |
| F100-FR-134 (annex D §D.6) | "on by default; nothing MUST ride on the switch of a loop layer" | "on by default; it MUST NOT ride on the switch of a loop layer" | B1 (meaning unchanged) |
| F100-FR-135 (annex D §D.7) | "No test counts MUST be shown in Wave 1, only counts of suppression markers" | "Test counts MUST NOT be shown in Wave 1, only counts of suppression markers" | B1 (meaning unchanged) |
| F100-FR-155 (annex F §F.1) | "Nothing MUST connect the root to the host after the handshake"; "No run MUST depend on a host hook" | "The root MUST NOT be connected to the host after the handshake"; "A run MUST NOT depend on a host hook" | B1 (meaning unchanged) |
| F100-FR-158 (annex F §F.1) | "nothing MUST relaunch by itself in Wave 1" | "a relaunch MUST NOT happen by itself in Wave 1" | B1 (meaning unchanged) |
| F100-FR-163 (annex F §F.4) | "Neither relaunch classifier table MUST relaunch a run" | "Each relaunch classifier table MUST NOT relaunch a run" | B1 (meaning unchanged) |
| F100-FR-174 (annex G §G.1) | "No command MUST have a flag" | "A command MUST NOT have a flag" | B1 (meaning unchanged) |
| F100-FR-200 (annex X §X.1) | "No event MUST hold content" | "An event MUST NOT hold content" | B1 (meaning unchanged) |
| F100-FR-217 (annex X §X.9) | "No component outside the runtime tree MUST be able to" | "A component outside the runtime tree MUST NOT be able to" | B1 (meaning unchanged) |
| F100-FR-219 (annex X §X.9) | "No secret value MUST appear" | "A secret value MUST NOT appear" | B1 (meaning unchanged) |
| F100-FR-220 (annex X §X.9) | "No component of Wave 1 MUST open a network listener" | "A component of Wave 1 MUST NOT open a network listener" | B1 (meaning unchanged) |
| F100-FR-231 (annex C §C.3) | "no fallback window MUST be used" | "a fallback window MUST NOT be used" | B1 (meaning unchanged) |
| F100-FR-236 (annex X §X.9) | "No version MUST be published from a working copy or by hand" | "A version MUST NOT be published from a working copy or by hand" | B1 (meaning unchanged) |
| F100-FR-218 (annex X §X.9) | Restated the three per-run fields (containment level, result of the proof of the critic mode, version of the redaction pattern set) | Cites F100-FR-143 for the three fields and adds none; test CT-100-318 kept, as CT-100-243 of F100-FR-143 | D1 |
| F100-FR-230 (annex C §C.3) | `assumption:` CQ-182 "a stated deviation from Principle IX" | CQ-182 answered by the owner; the weaker proof passes under constitution v3.0.1; the absence of a proof under `parity` (row 117) is the stated deviation; the plan's rows stay until the first implementation slice removes them. Requirement text unchanged | K1, K2, K5 |
| F100-FR-231 (annex C §C.3) | `parity:` the as-is fallback window (row 28) | The same, and named as a stated deviation from Principle IX under `parity` (plan, Complexity Tracking; assumption: CQ-145). Requirement text unchanged apart from B1 | K1, K2 |

#### Analyze of 2026-09-30, tables and text changed

| Where | What | Finding |
|---|---|---|
| Annex X §X.2, trust classes, row "Widening" | `profile` added, selected at flag, environment or user rank only (F110-FR-013) | B2 |
| Annex X §X.6 row 128 | The member `pinned-configuration` rests on the owner's answer of CQ-182 (constitution v3.0.1), no longer "not yet ruled" | K4 |
| "Sources"; "Vision and aims"; "Clarifications"; "Assumptions" | Constitution v3.0.1; "Forty other features (41 specifications after the splits)"; the divergence register has 117 rows; CQ-182 closed | K4, I2, I3 |
| "Not applied, and open", row W-100-18 | Marked applied by the second pass (A1): rows 271 to 273 of annex X §X.6 | I5 |

#### Second analyze of 2026-09-30, requirements and tables changed in place

Made on 2026-09-30 from the findings F1 to F7 of the second `speckit-analyze` run of that date
(`analyze-report.md`, "Second run"). Nothing was renumbered; the ids T-38 to T-42 existed and
now have a row each. The contracts were regenerated.

| Id or section | What it said | What it says | Finding |
|---|---|---|---|
| F100-FR-230 (annex C §C.3) | `parity:` no proof is made (row 28 of annex X §X.7); `assumption:` the absence of a proof under `parity`, row 117 | `parity:` no proof is made for any harness: row 28 (the as-is transport and mode of each harness, which made no proof) and row 117 (`harnesses.dsh.critic.proof` = `none`); `assumption:` the same, rows 28 and 117. Requirement text unchanged; the plan (Constitution Check IX, Complexity Tracking) and CQ-182 under "Clarifications" cite rows 28 and 117 | F1 |
| Annex X §X.9, threats (F100-FR-216) | One row "T-38 to T-42", so `data/threat-model.json` held 45 entries | Five rows T-38 to T-42, with the same control; owner 129 for the read model (Wave 1), the viewer in Wave 2. `data/threat-model.json` holds the 49 threats. Requirement text unchanged | F2 |
| "Owners, rows and tables changed", row "Package graph" | 27 packages | 26 packages before, 29 after | F3 |

### Second pass after the cross-feature review (2026-09-30)

Made from section A of `docs/ecosystem/reviews/SECOND-PASS-LIST.md` (items A1 to A37 and A2a).
The running report, item by item, is [repair-report.md](repair-report.md). Nothing was renumbered;
new rows were appended.

| What | Before | After |
|---|---|---|
| Requirements | 236 | 236 (no requirement added or split; one new one is reported only, under "New questions" of the report) |
| Closed sets, annex X §X.6 | 270 rows | 278 rows (271 to 277 added; row 14 reworded, members unchanged; 278 added on 2026-09-30 for the `outcome` of the record of a phase attempt of feature 101) |
| Rows of the `parity` profile, annex X §X.7 | 131 | 133 (132 and 133 added) |
| Normalization rules, annex X §X.8 | N-01 to N-28 | N-01 to N-29 (N-29 added) |
| Alias rows, annex X §X.8 | as after the first pass | one row added: the seven as-is telemetry variables of feature 128 |
| Further schema ids, annex B §B.20 | 15 | 17 (the two internal records of feature 130 added) |
| Research, decisions | D-1 to D-9 | D-1 to D-10: the second heading numbered D-8 (conformance suites) is now D-10 |


#### Third analyze of 2026-09-30, changed in place

| Requirement | Finding | What changed |
|---|---|---|
| F100-FR-231 | I1 (third run) | `parity:` line names rows 28, 55 and 57; `divergence:` adds DV-099 (the over-window prompt, owned by 117) |

#### Fourth analyze of 2026-09-30, changed in place

Seven low findings (`analyze-report.md`, "Fourth run"), all repaired on the same date. Nothing was
renumbered; no requirement, closed-set row or profile row was added. The contracts were regenerated.

| Where | What it said | What it says | Finding |
|---|---|---|---|
| F100-FR-067 (annex B §B.12), F100-FR-075 (§B.19), F100-FR-118 and F100-FR-120 (annex D §D.1), F100-FR-148 (annex E §E.3) | "none of the three check points MUST be active"; "None of the three MUST run"; "no time limit … and no command … MUST differ"; "no limit and no breaker … MUST stop"; "no as-is stop line MUST be written" | "X MUST NOT …" in each, meaning unchanged (the five sentences the B1 rewrite of the first run left) | B1 |
| Annex E §E.4, engine table, codes 1, 2 and 3 | Causes and stop reasons listed side by side, unpaired | Each cause carries its member in parentheses, or "no member"; a sentence under the table states the reading and its source (`consolidation.md` section 3, B-0150, B-0152; the changed source by ruling K3). Requirement text unchanged | U1 |
| Annex C §C.3, first form, proof cell | "an exact version pin together with the preflight" | "… and the flag set of the call", as F100-FR-230 case 3 and Principle IX | I2 |
| Annex B §B.1, control plane, "Who writes" | "The CLI writes inbox requests, launch records and the supervision record only" | The list of F100-FR-217, with the pointer to §B.5 | I3 |
| Annex X §X.7, column header; §X.6 row 157 | "Key (as proposed)"; "unknown subcommand" | "Key" (the generator follows); "unknown first argument (verb), as F100-FR-182" | T1 |
| `tasks.md`, head and Path Conventions | "two modules of the kernel"; six directories | Four modules and the build and release pieces, as `plan.md`; `tools/contracts-gen/`, `tests/release/100/`, `.github/workflows/` added | I1 |
| `tasks.md`, T223 | "every key … not marked (proposed)" | "every key of annex X §X.7" | T1 |
| `tasks.md`, T017 and T018 | No statement of what a contract-level test asserts for F100-FR-024, F100-FR-026 and F100-FR-031 | A `checks:` line per requirement, and two static checks added to T018 (no as-is state directory named outside the old side; no member of the three sets owned by a loop layer or the check runner) | U2 |

#### Fifth analyze of 2026-09-30, changed in place

After the split of `tasks.md` into context-sized slices (228 → 296 tasks). Five medium and ten low
findings (`analyze-report.md`, "Fifth run"), all repaired on the same date. Only `tasks.md` and one
count in `docs/ecosystem/PROGRESS.md` changed: no annex, requirement, closed-set row, profile row or
generated file. Nothing was renumbered.

| Where | What it said | What it says | Finding |
|---|---|---|---|
| `tasks.md`, T272 `reads:` | the `wait` row of `perCommand` for the supervision outcomes | the `supervise` row (with the double uses of 2 and 4) | I1 |
| `tasks.md`, T233 | "every process boundary … is a package boundary of the graph" | a boundary the oracle observes stays a process (`process-model.json`); every other one is a call returning a result record with the as-is `exit_code` (F100-FR-006) | I2 |
| `tasks.md`, T012, T013, T236, T280 | a core package is one with `nodeBuiltins: false`; the forbidden names are the packages of L1; the core packages are `contracts` and `kernel` | a core package is marked `core: true` in the graph (`@specstride/core`, the two loop layers); the forbidden imports of F100-FR-012 spelled out; the forbidden names are every non-core package of the graph | U1 |
| `tasks.md`, T263 `reads:` | the exports of T078 and T080 (user story 2) | the data files `run-state-machine.json`, `stop-reasons.json`, `layout.json`, `config-ranks.json` and the event envelope schema, so that user story 1 stands alone | C1 |
| `tasks.md`, 32 slices among T232 to T296 | see `analyze-report.md`, "Fifth run", the paragraph "The sweep S1, by slice" | each slice text and `reads:` line agrees with its annex section and data keys | S1, U2 to U5 |
| `tasks.md`, "Task ids after the split", "Within Each User Story", "Split map" | "no id changed its file"; slices "stand directly after their parent (T257 …)" | the four ids whose file changed are named (T015, T076, T094, T202); T288 to T293 named as the second exception | I4, I5 |
| `tasks.md`, "Format" | `proves:` only | the `requirement:` key of the eleven parity and characterization tasks is documented | F1 |
| `tasks.md`, "Context budget" | "600 KB of contract files" | "about 1.1 MB", with what is never read whole | A1 |
| `docs/ecosystem/PROGRESS.md`, row "100 tasks" | 228 tasks | 228 tasks; 296 after the split | X1 |

#### Requirements changed in place

| Id | What it said | What it says | Item |
|---|---|---|---|
| F100-FR-009 (annex A §A.1) | Text is cut at the ingress "to a size cap" | The same, and under `parity` the cap is not below the as-is sizes that reach the critic prompt | A25 |
| F100-FR-024 (annex A §A.5) | The critic-diversity warning for the same model | The warning is raised also where the diversity test gives `unverified` | A29 |
| F100-FR-088 (annex C §C.3) | The move of the proposer's files before a critic of the second form starts | The same, and the move holds for every critic-class call, the diagnostician included | A15 |
| F100-FR-127 (annex D §D.3) | `loop.parallel.workersMax` is a widening key, unstated reading | The reading is stated: project configuration may lower it and never raise it; a higher value in project configuration is ignored, with a message at launch | A20 |
| F100-FR-182 (annex G §G.4) | An unknown subcommand MUST exit 1 | An unknown first argument (verb) MUST exit 1; an unknown sub-verb exits with the code of the row of that command | A23, finding 1 of the first pass |
| F100-FR-213 (annex X §X.8) | The normalization rules are exactly N-01 to N-28 | Exactly N-01 to N-29 | A2a |
| F100-FR-234 (annex A §A.3) | The process primitive starts a process in a group of its own | It starts a process in a group and a session of its own, with standard input closed | A13 |

#### Facts, tables and rows changed (no requirement text)

| Where | What | Item |
|---|---|---|
| Annex X §X.6 | Rows 271 to 273 (end causes and phase outcomes, owner 111, closed by A1); row 274 (error classes of the validation of a launch contract, owner 107, CQ-194); rows 275 and 276 (kinds and states of dsh customisations, owner 130); row 277 (open registry of lock and liveness providers, owner 122); row 14 reworded (DV-114); row 85 names N-29 | A1, A2, A3, A5, A6, A2a |
| Annex X §X.7 | Rows 132 (DV-114, owner 123) and 133 (DV-117, owner 101) added | A6, A16 |
| Annex X §X.8 | N-29 added; the seven as-is telemetry variables of 128 in the alias table | A2a, A30 |
| Annex B §B.5 | Writer of `workspace:layout-version` named (the runtime root, F122-FR-043); the session row of `attempt:<N>:<k>:<n>:session` no longer writes into the configuration home at auth tier 1 | A7, A10 |
| Annex B §B.20 | The two internal schema ids of feature 130, in the form `urn:specstride:schema:internal:130:<name>/1` | A34 |
| Annex C §C.5 | The dialect row carries `trackTerminal`; `prime-v3` sets it; a second terminal is dropped as `duplicate_terminal` | A31 |
| Annex C §C.9 | Under the recommended answer of CQ-190 a source that reads repository text reports no declared reads or writes | A12 |
| Annex D §D.1 | `integrateGroup` carries, per worker, `accepted` or the refusal reason; the four engine reports named | A19 |
| Annex E §E.1 | A missing credential of the critic is a failed call under `parity` (row 133; DV-117) | A14 |
| Annex G §G.3 | `[SPECSTRIDE-STATE]` listed with its keys (122) | A8 |
| Annex G §G.4 | Row `spec`: a missing phase number of `tick`, `title`, `shape`, `slice` is a cause of exit 3 | A22 |
| Annex G §G.7 | Feature 123 registers `pipeline.terminalTool` (warn, not launch-blocking) | A9 |
| Annex G §G.8 | Findings of validation carry an error class of annex X §X.6 row 274 | A2 |
| Annex H §H.1 | "The build calls the eval driver" split per the proposal of 113 (CQ-188) | A27 |
| Package graph | `@specstride/integrity` owner "116; 115 (checkpoint reading, tripwire record)"; `@specstride/core` names the module groups of 142 and 143 | A17, A18 |
| research.md | The second heading numbered D-8 renumbered to D-10 | Extra defect of the second pass |

### Re-check B-8.7 (2026-09-30)

Made by the re-check of act B-8.7 (`docs/ecosystem/reviews/B-8.7-D.md`). Nothing was renumbered;
no requirement, closed-set row or profile row was added.

#### Requirements changed in place

| Id | What it said | What it says | Why |
|---|---|---|---|
| F100-FR-024 (annex A §A.5) | "The warning is raised also where the diversity test gives `unverified`" | "The warning MUST also be raised …" | The added sentence of the second pass was not in the normative form |
| F100-FR-027 (annex A §A.5) | No install script, nothing compiled | The same, and every dependency of a published package is declared at an exact version | CQ-206 (A23, the control of T-44) |
| F100-FR-028 (annex A §A.5) | The audience changes through user configuration, the environment or a flag | Through user configuration only | CQ-205 (A23; ruling 2); feature 110 narrows the layers of `distribution.audience` to U |
| F100-FR-127 (annex D §D.3) | A higher `loop.parallel.workersMax` in project configuration is ignored "with a message at launch" | "with a launch message and a doctor warning, as F100-FR-202 says" | Agreement with F100-FR-202 |
| F100-FR-140 (annex E §E.1) | A target equal to a model of a critic-class call is skipped | Only a target equal in model and in effort is skipped; a target that shares only the model is used with the critic-diversity warning | CQ-204 (A23; ruling 49); feature 149 (F149-FR-005) follows |
| F100-FR-163 (annex F §F.4) | Neither table relaunches a blocked or not-retryable run, without exception | The same, and under the `parity` profile table 1 classifies as the baseline (row 132 of annex X §X.7; DV-114), a stated deviation from Principle VIII | Row 132, added by the second pass, contradicted the requirement; CQ-238 |
| F100-FR-182 (annex G §G.4) | — | `assumption: CQ-201` added | CQ-201 was queued after the second pass |
| F100-FR-213 (annex X §X.8) | `divergence:` DV-006 to DV-066 | DV-116 added (rule N-29) | A2a |
| F100-FR-127 (annex D §D.3), F100-FR-231 (annex C §C.3) | — | `assumption: CQ-198` and `assumption: CQ-202` added; text unchanged | The questions N-1 and N-5 of the second pass were queued as CQ-198 and CQ-202 after it |
| F100-FR-230 (annex C §C.3) | Case 3: "the flag set of the call and the exact version pin" | Case 3 for a tested harness adapter only: the exact version pin, the preflight and the flag set, recorded as the weaker proof; `assumption: CQ-182` | Agreement with §C.3, F109-FR-038 and the plan (critical finding W-100-19/20) |

#### Tables and rows changed

| Where | What |
|---|---|
| Annex X §X.6 row 128 | "Closed by" names that the member `pinned-configuration` rests on the recommended answer of CQ-182 and is not yet ruled |
| Annex X §X.8, alias table | `SPECSTRIDE_PRIME_FLEET_BIN` added, read before `SPECSTRIDE_PRIME_BIN` (feature 110 §K.8; CQ-196) |
| Annex G §G.4, table of colliding numbers | "unknown subcommand" reads "unknown first argument (verb)", as F100-FR-182 |
| "Threats", T-44 | F100-FR-027 holds the exact versions |
| "Assumptions" | CQ-182, CQ-201, CQ-204, CQ-205, CQ-206 and CQ-238 listed |
| `plan.md` | Row VIII is a deviation under the `parity` profile, with a row in Complexity Tracking; row XVI names the exception |
| Package graph (`contracts/sources/package-graph.json`), `@specstride/integrity` | The note of A17 lacked the full stop between two sentences ("May touch the file system Feature 115 owns …"); corrected, content unchanged |

### Re-check B-8.7, pass-ons (2026-09-30)

Made by the pass-ons of the re-check (`docs/ecosystem/reviews/B-8.7-E.md`). Nothing was renumbered;
no requirement, closed-set row or profile row was added. The contracts were regenerated.

#### Requirements changed in place

| Id | What it said | What it says | Why |
|---|---|---|---|
| F100-FR-058 (annex B §B.5) | "the engine MUST emit an event" | "the engine MUST emit the event `progress.swept`" (the catalogue type of feature 111) | B-8.7-A: the event of the sweep is `progress.swept`, and feature 103 no longer emits it |

#### Tables and rows changed

| Where | What |
|---|---|
| Annex B §B.5, row `run:<runId>:spend` | Readers "Engine, RunView, doctor" read "Engine, doctor, digest"; the content cell states that RunView takes spend from `usage.reported` (F129-FR-001, F129-FR-020); `assumption: CQ-229` |
| "Assumptions" | CQ-229 listed |

### Answers of the owner, round 1 (2026-09-30)

Applied from the clarification round of Stage B (`docs/ecosystem/CLARIFY-QUEUE.md`). Nothing was
renumbered; no requirement, closed-set row or profile row was added. The contracts were regenerated.

#### Requirements changed in place

| Id | What it said | What it says | Why |
|---|---|---|---|
| F100-FR-163 (annex F §F.4) | Under the `parity` profile table 1 of feature 123 reads neither `retryable` nor the blocked reason, so a blocked run can be relaunched there, a stated deviation from Principle VIII | A run in `blocked-on-human` is never relaunched under any profile, `parity` included (row O-33 of feature 123 active under every profile); under `parity` only the row for a stop with `retryable: false` (O-34) is inactive (DV-114) | CQ-238 |
| F100-FR-231 (annex C §C.3) | For a configured critic on an unlisted model the harness adapter uses the smallest window of its table and warns; the as-is fallback under `parity` | Outside `parity` a configured critic on an unlisted model with no declared window is refused, no fallback window; under `parity` the as-is fallback holds (DV-106, DV-111); a declared window always wins | CQ-145, CQ-202 |
| F100-FR-207 (annex X §X.5) | One hasher with the operations of §X.5 | The same, and the classification of the staleness verdict is the one operation of the hasher, a pure function that 102, 103 and 104 call and do not reimplement; `@specstride/spec-formats` keeps the reading of files and lines; EP-03 gains no operation; `assumption: CQ-214` | CQ-214 |

#### Tables and rows changed

| Where | What |
|---|---|
| Annex X §X.7 row 132 | Covers the reading of `retryable` (row O-34) only; the reading of the blocked reason (row O-33) is not switched by the profile (CQ-238) |
| Annex X §X.5, table of operations | Row "Classification of the staleness verdict" added (rules: feature 104); `contracts/data/kernel-operations.json` regenerated (CQ-214) |
| "Where features proceeded on different readings", row on the context window | Follows F100-FR-231 as answered (CQ-145, CQ-202) |
| "Assumptions" | CQ-238 closed; CQ-202 and CQ-214 listed |
| `plan.md` | Row VIII passes; row XVI no longer names a `parity` exception for a blocked run; the Complexity Tracking row on Principle VIII is removed (CQ-238). Register row DV-114 is narrowed to O-34 by the orchestrator |

### Upstream fixes of the analyze run of feature 104 (2026-09-30)

Applied at the owner's ruling of 2026-09-30. Nothing was renumbered; no requirement was added. The contracts were regenerated.

| Where | Before | After | Why |
|---|---|---|---|
| Further schema ids, annex B §B.20 | 17 | 18 (`specstride.task-list/1`, logical name `run:<runId>:task-list`, owner 104); 21 with the three records of feature 106 applied in the same round (below) | Principle VI: the record is a file boundary and had no schema id (F104-FR-026) |
| Annex B §B.5, row `run:<runId>:task-list` | The task list as read at launch | Names the record `specstride.task-list/1` | Same |
| Annex X §X.5, row "Phase shape, obligation id, signature of unmet criteria" | "As at the baseline" in both cells | Names the rule owner of each of the three hashes (104, 107, 101) and what the hasher builds | The row read as three operations of the hasher; F104-FR-021, F107-FR-004 and F101-FR-019 give two of them to their owners |

### Upstream fixes of the analyze runs of 2026-09-30, other features

Applied at the owner's ruling of 2026-09-30, from the section "Proposed upstream fixes" of the
analyze report of each feature named. Nothing was renumbered. The contracts were regenerated.

| What | Before | After |
|---|---|---|
| Requirements | 236 | 237 (F100-FR-237 added in annex A §A.4: the interface of the engine into the invocation code of feature 126, test CT-100-337; 126 P1) |
| Closed sets, annex X §X.6 | 278 rows | 285 rows: 279 "Hold refusals" (123 U2); 280 and 281, kill classes read by learning and sources of a selected learning mode (106 P5); 282 to 285, the four sets of the launch contract (107 P-2) |
| Row 212 | Ten members, owner 122 | Also `control-root-unsafe` (122 C2), `unknown-mode` and `comment-changed` (107 P-3); owner "122; the last two 107" |
| Row 111 | `retro` owned by 106 | `learning` and `retro` owned by 106 (106 P1) |
| Row 31 | Owner "109; 126" | The kinds 109, the registry and four rows 126, the rows `jsonl` and `prime-v3` 138 (126 P2) |
| Logical names, annex B §B.5 | 125, layout version 1.1 | 127, layout version 1.2: `run:<runId>:engine-log:<k>` (144 P1) and `feature:<slug>:learning:events-legacy` (144 P2, merged with 106 P7, which asked for the same file) |
| Further schema ids, annex B §B.20 | 18 | 21: `specstride.learn.applied/2`, `specstride.learn.summary/7`, `specstride.learn.observation/1` (106 P6) |
| Terminal record, annex B §B.15 | — | Field `verificationParallelism` (148 P2); annex E §E.2 says how the runtime root carries it |
| EP-05, annex C §C.8, F100-FR-097 | Five operations | Six: `environment` added (148 P1); the version stays `/1` |
| Environment alias table, annex X §X.8 | 37 rows | 41 rows: the tail variables and the plan variable of verification (105 P-2), the event context (144 P3), `SPECSTRIDE_SHIP` (144 P4) |
| Requirements changed in place | — | F100-FR-054 (144 P1), F100-FR-207 (105 P-1), F100-FR-214 (107 P-1), F100-FR-228 (106 P3), F100-FR-232 (105 P-4), F100-FR-234 (105 P-3), F100-FR-235 (106 P2) |
| Tables changed in place | — | Annex X §X.5, the hasher (105 P-1); annex X §X.7 row 32 (149 P3); annex X §X.8, the old side of the layout table and the key-name map of the launch contract (144 P1, P2; 106 P8; 107 P-1); annex D §D.8 (105 P-5); annex E §E.4 (105 P-4); annex G §G.1 row `run` (128 U2), §G.3 (129 U-129-01; 106 P4), §G.8 (107 P-9); annex B §B.5, the root `package` (146 U-1) |

### Owner rulings on the campaign (2026-09-30, late evening)

Applied at the owner's ruling of 2026-09-30 (ruling 6 of the campaign round). Nothing was renumbered; no requirement was added. The contracts were regenerated.

| Where | Before | After | Why |
|---|---|---|---|
| F100-FR-225, F100-FR-226 (annex X §X.10) | The consistency review runs over the specifications of all features, always | A scoped review is allowed: `TESTKIT_STATIC_SCOPE` names the feature folders that are the subject, every folder stays reference; a phase gate may use it for the running feature; the full review stays mandatory in the last phase of feature 100 and before any release | On 2026-09-30 an analyze run of features 144 and 146 turned the phase 4 gate of feature 100 red, and the proposer edited those features to turn it green. The owner allowed analyze runs beside implementation runs, isolated from them |
| `tasks.md`, phase 4 | T297 to T304 | T305 added (the scoped runner and its tests); T304 runs `test:static` scoped to feature 100; the verification gates of phases 4 and 9 run it scoped, the gate of phase 10 runs it over all features | Same |
