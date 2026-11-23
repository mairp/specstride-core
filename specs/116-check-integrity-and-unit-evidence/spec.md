# Feature Specification: Check integrity and unit evidence

**Feature Branch**: `116-check-integrity-and-unit-evidence` (a label: Spec Kit creates no branch in this repository; the directory is `specs/116-check-integrity-and-unit-evidence`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 116-check-integrity-and-unit-evidence: check integrity and unit evidence of Specstride, split from feature 115: the protected set in two classes, tree and protected-set fingerprints at launch, at phase entry and around every check, taint and the other result conditions, pins and caches, authorisation from the task text at launch, suppression markers, the comparison at phase entry, toolchain profiles (EP-16), and the fact block the critic receives."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md` section 9, `consolidation.md` (glossary and divergence register), `feature-briefs.md` (brief 115-micro-loop-layer, requirement group G-B), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (annexes A, B, C, D, E, G, X), feature 141 (§O.1 to §O.7), and the research reports R27, R23 and R23v.

## What this feature is

This feature makes sure that a result of a deterministic check means what it says, and it builds
what the critic is told about such results. It owns the protected set, the fingerprints, the use
of the result conditions, the toolchain profiles and the fact block. It runs no check by itself
and decides nothing about a unit of work: a loop layer asks for fingerprints and for the fact
block through the contracts of feature 100.

It is the second part of feature `115-micro-loop-layer`, which was split after `speckit-specify`
gave 66 requirements. The brief of this feature is requirement group G-B of brief 115. The two
parts cite each other only through contracts of feature 100.

This feature has no as-is behaviour (decision 21). Everything in it is new.

**In scope**: the protected set in two classes; the tree fingerprint and its scope; fingerprints
at launch, at phase entry, and before and after every check of a loop layer; `tainted` and the
other result conditions as this feature sets them; `protection`; verification of pins, the search
path, the effective configuration of a toolchain, caches; authorisation from the text of the
tasks at launch; suppression markers; the comparison of the tree at phase entry; toolchain
profiles; the fact block.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Units of work, checkpoints, keep, repair and unresolved, caps, the closing check, the router, escalation, the `[LOOP]` line, the tripwire, the experiments | 115 |
| The check runner and the pins at launch | 148 |
| The derivation of the check manifest | 105 |
| Fingerprints around the commands of the verification gate and around grounding | 148, 117 (row 31 of the `parity` profile) |
| The slot and the escaping of the fact block in the critic prompt; grounding refusals | 117 |
| The phase gate, the verdict, the approval record and the tree bound in it | 101 |
| The envelope of the ledger | 103 |
| Worker trees, refusal reasons of a delta | 142 |
| Counts of tests before and after; an immutable snapshot of the tree | Roadmap |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A changed check is detected and never counts as a pass (Priority: P1)

The proposer edits a file that defines a check, deletes a test, adds a skip marker, plants a
cache, or changes a file while the check runs. The result carries the condition `tainted`, and
the critic is told. Where the harness offers a sandbox the change is prevented; everywhere it is
detected.

**Why this priority**: Gate quality must not fall (decision 21). Threats T-19, T-20 and T-24 of
the threat model are owned here.

**Independent Test**: For each seeded tampering of the tamper fixtures the recorded condition
is the expected one and never a pass.

**Acceptance Scenarios**:

1. **Given** a protected set that differs before and after a check, **When** the result is recorded, **Then** it carries `tainted` with the reason `changed-during-check` and keeps its exit result (F116-FR-005, F116-FR-006).
2. **Given** a new file that matches a class A pattern, **When** the next comparison runs, **Then** the result is `tainted` (F116-FR-002).
3. **Given** a task of the phase whose text at launch names a protected path, **When** the proposer changes that path, **Then** the change does not taint and is listed for the critic as authorised (F116-FR-010).
4. **Given** a note of the proposer that claims authorisation, **When** the protected set is compared, **Then** nothing changes (F116-FR-010).
5. **Given** a tool that reports a result as replayed from a cache, **When** the result is recorded, **Then** it carries `cached` and is no pass (F116-FR-009).
6. **Given** a tree that differs at phase entry from the approved tree of the phase before, **When** the phase starts, **Then** an integrity event is raised, the critic gets the differing protected paths, and the run goes on (F116-FR-012).

---

### User Story 2 - The critic sees results, and nothing about how they came to be (Priority: P1)

The critic receives a fact block built by the runtime: results per command and tree with their
conditions, the tasks each unit named as the proposer's declaration, facts about the protected
set, and integrity events by kind. It receives no count, no order, no time, no output and no
history of repairs.

**Why this priority**: Principle II. A critic that sees the repair history is anchored by it.

**Independent Test**: Two fixtures reach the same final tree, one in one cycle and one in nine.
Their fact blocks are byte-identical.

**Acceptance Scenarios**:

1. **Given** two phase attempts with the same final state and different histories, **When** the fact blocks are built, **Then** they are byte-identical (F116-FR-020).
2. **Given** a file in the workspace with the name of the fact block and other content, **When** the critic prompt is built, **Then** the prompt is unchanged (F116-FR-016).
3. **Given** a phase attempt in which no unit was declared and no independent integrity rule found a fact, **When** the critic prompt is built, **Then** no fact block is present (F116-FR-016).
4. **Given** a unit that named all tasks of the phase while one command passed, **When** the fact block is read, **Then** results stand per command and tree, the tasks are headed as the proposer's declaration, and no task row carries a result (F116-FR-018).
5. **Given** a ledger that is invalid from some record on, **When** the fact block is built, **Then** the rows before that record stay and the block says that inner results are unavailable after them (F116-FR-021).

---

### User Story 3 - A consumer describes a toolchain as data (Priority: P2)

A consumer whose project uses a toolchain the product has no profile for writes a profile in
user configuration. The protected set of the next run covers the files the profile names.

**Why this priority**: Without a profile a toolchain has the basic protection only. Profiles are
data, so that a new toolchain needs no change of the product.

**Independent Test**: A profile for a fictional toolchain, given in a test overlay, changes the
protected set of a fixture with no file of the product changed.

**Acceptance Scenarios**:

1. **Given** a valid profile in user configuration, **When** a run launches, **Then** the protected set holds the files the profile names and the run records the profile with its version (F116-FR-013, F116-FR-014).
2. **Given** the same profile in project configuration, **When** a run launches, **Then** the profile is ignored with a launch message and a doctor warning (F116-FR-014).
3. **Given** a profile that does not validate, **When** it is loaded, **Then** it is refused with a doctor finding and treated as absent (F116-FR-013).
4. **Given** a toolchain without a profile, **When** a run ends, **Then** the doctor names it and the basic protection is recorded (F116-FR-015).

---

### Edge Cases

- The tree changed after the last check: the rows of that check read `superseded` (F116-FR-008).
- A unit named a task that an earlier unit named: the final rows of the task are those of the last check whose unit included it (F116-FR-017).
- A command of the check manifest executes from an ignored directory: that directory is in class A by the hash of its listing (F116-FR-003).
- A check writes files that the check manifest declares as written by it: they do not taint (F116-FR-005).
- The harness of the proposer has no sandbox, or none that was confirmed: `protection` reads `detect` (F116-FR-007).
- A profile names no way to read the effective configuration: that comparison is left out and the doctor says so (F116-FR-009, F116-FR-013).
- A profile has a field the product does not know: the field is ignored with a finding (F116-FR-013).
- The integrity switch of the comparison at phase entry is off and no loop layer is on: no fingerprint is taken and no file of this feature exists (F116-FR-004, F116-FR-012).
- An integrity kind outside the closed set is found in the ledger: it is not shown to the critic and stays in the event file (F116-FR-021; "Closed sets", row 65).
- With parallel units on: an integrated group is one unit in the fact block, and nothing about groups or workers is in it (F116-FR-019).

## Requirements *(mandatory)*

### Functional Requirements

Every requirement follows `STAGE-B-RULES.md` section 4. This feature has no as-is origin, so no
requirement carries `origin:` or `disposition:`. A test `CT-116-<n>` with n below 100 is the
test of requirement n. A test `CT-116-<n>` with n from 101 to 160 is the test of integrity rule
IR-(n minus 100); the table "Integrity rules and their tests" lists them.

#### The protected set and fingerprints

- **F116-FR-001**: The protected set of a phase MUST have two classes. Class A: the files by which a check is defined (configuration of runners and linters, scripts and build targets that the check manifest names, files of the build service, the files the derivation of the check manifest reads). Class B: the test files that exist at phase entry. This feature MUST be the single owner of the protected set and of the fingerprints; every other feature MUST obtain them through the contracts of feature 100 (annex C §C.8 and §C.14, annex D §D.1 "Inputs").
  - test: CT-116-1; CT-116-111

- **F116-FR-002**: Class A MUST be a set of path patterns that is evaluated at every comparison, and not the list of files found at phase entry. A new file that matches a pattern of class A MUST taint. The patterns MUST include the files by which a runner changes what it collects or how it starts. The pattern set MUST be versioned data per toolchain.
  - test: CT-116-2; CT-116-138

- **F116-FR-003**: The tree fingerprint MUST cover the tracked files and the untracked files that are not ignored, MUST name what it excludes, and the exclusions MUST be recorded with the check manifest. Ignored paths from which a command of the check manifest executes MUST be in class A, by the hash of their listing with metadata. A file of the protected set that is inside the scope of the tree fingerprint MUST be hashed by content. Inside an ignored path of class A, the content MUST be hashed of every pinned executable (F116-FR-009) and of every file that a class A pattern of a toolchain profile matches; every other file there is covered by the listing alone. The listing MUST hold per entry the name, the kind, the size, the mode, the modification time and the time of the last change of status, so that a change of content that restores size and modification time still changes the listing. The record of the protected set MUST say, per ignored path, that it is covered by a listing and which of its files are hashed by content.
  - test: CT-116-3; CT-116-135
  - status: unverified (check: on Linux and on macOS a process of the proposer's user cannot set the time of the last change of status of a file; verified-on: —; pin: the runners of the build)
  - assumption: CQ-197 (that a listing with metadata, as rule IR-35 words it, meets Principle III for the files of an ignored path that are neither pinned nor named by a profile; closed by the owner on 2026-09-30: yes for Wave 1, as a stated deviation from Principle III)

- **F116-FR-004**: The protected set MUST be fingerprinted at launch and at the entry of every phase of a run in which a loop layer is on or an integrity switch is on, and the fingerprint of phase entry MUST be kept for the whole phase, across phase attempts, resumes and relaunches. The fingerprints MUST be stored in the control plane under `phase:<N>:protected-set`.
  - divergence: DV-052
  - parity: no file of a loop layer exists (rows 1 and 32 of annex X §X.7)
  - test: CT-116-4; CT-116-111
  - assumption: CQ-084 (that register row DV-052 covers every file of the control plane that exists only with the layer on; closed on 2026-09-30, the recommended answer stands)

- **F116-FR-005**: The protected set and the tree fingerprint MUST be taken immediately before and immediately after every check that a loop layer runs through the check runner, the closing check included. A result MUST be a pass only when both readings are equal, apart from paths that the check manifest declares as written by that command. Otherwise the result MUST carry `tainted` with the reason `changed-during-check`.
  - test: CT-116-5; CT-116-131

- **F116-FR-006**: A check that ran while class A differs from phase entry, or while class B differs without authorisation, MUST carry `tainted` with the reason `protected-set-changed`. `tainted` MUST never be a pass. The result MUST keep its exit result, and a unit of work whose check carries `tainted` MUST NOT be recorded as kept (annex D §D.1, directive `keep`). The verification gate MUST still run on a differing protected set, its result MUST carry the condition, and the run MUST NOT halt.
  - test: CT-116-6; CT-116-111

- **F116-FR-007**: `protection` MUST be a closed set of `prevent` and `detect`. It MUST read `prevent` only when the containment level in force is C2 or above and the harness adapter confirmed that its sandbox denies writes to the protected set of class A and to the control plane. In every other case it MUST read `detect`. The value MUST be given to the run record (annex E §E.2, field `containment`), from which the `[LOOP]` line takes it.
  - test: CT-116-7
  - ep: EP-02 `specstride.harness/1` (consumes)
  - status: unverified (check: the sandbox of each harness denies writes to named paths inside the workspace; verified-on: —; pin: harness versions of the capture)

- **F116-FR-008**: Every result MUST be bound to the tree fingerprint it ran on. A result MUST read `current` only when that fingerprint equals the tree at the phase gate, and `superseded` otherwise. A condition MUST never replace the exit result: exit result and each condition stand in fields of their own.
  - test: CT-116-8; CT-116-116; CT-116-140

#### Executables, caches, authorisation, markers

- **F116-FR-009**: The pin of every executable of the check manifest, taken at launch, MUST be verified before each check; a pin that does not verify MUST give `tainted` with the reason `pin-mismatch`. The search path of a check MUST be the value at launch. Where the toolchain profile names how the effective configuration of the toolchain is read, that configuration MUST be recorded at phase entry and compared before each check; a difference MUST taint. Cache locations that a profile names MUST be switched off through the environment of the check or MUST be in class A. A result that the tool reports as replayed from a cache MUST carry `cached` and MUST NOT be a pass.
  - test: CT-116-9; CT-116-136; CT-116-137
  - ep: EP-05 `specstride.check-runner/1` (consumes)

- **F116-FR-010**: Authorisation to change a file of the protected set MUST come only from the text of the tasks of the phase as read at launch: a task that names a path authorises that path and no other. It MUST apply to class A and to class B. The proposer MUST NOT be able to grant it; a note of a checkpoint that claims it MUST change nothing. An authorised change MUST NOT taint and MUST be listed for the critic as authorised. New test files MUST be allowed and listed.
  - test: CT-116-10; CT-116-112; CT-116-141
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F116-FR-011**: The runtime MUST count the suppression markers added and removed since phase entry, from the versioned pattern set of the toolchain profile, and MUST give the counts per file to the critic as facts. A count of tests MUST NOT be shown in Wave 1.
  - test: CT-116-11; CT-116-139

- **F116-FR-012**: The comparison of the tree at phase entry with the approved tree of the phase before MUST be a switch of its own, on by default, independent of the loop strategy. A difference MUST be an integrity event of the kind `phase-entry-mismatch`, the differing protected paths MUST be facts for the critic of the phase, and the run MUST NOT be blocked. Every critic MUST also receive the protected paths changed since launch in phases already approved, as a short list marked as such.
  - divergence: DV-077
  - parity: off (row 32 of annex X §X.7)
  - test: CT-116-12; CT-116-133

#### Toolchain profiles

- **F116-FR-013**: A toolchain profile MUST be data with this content: how the toolchain is detected; the patterns of class A; the patterns of test files; the cache locations and the environment that switches each off; the user-level configuration files; the patterns of suppression markers; the executables to pin; how the effective configuration is read, as a fixed argument list of a pinned executable or not at all; the seed paths of worker trees; the environment per worker. A profile MUST name no command to run other than that reading. A profile that does not validate MUST be refused at load with a doctor finding and treated as absent. An unknown field MUST be ignored with a finding.
  - test: CT-116-13
  - ep: EP-16 `specstride.toolchain/1` (implements)
  - assumption: CQ-085 (annex C §C.14 says that a profile names no command to run; rule IR-36 needs the effective configuration of a toolchain to be read; closed on 2026-09-30, the recommended answer stands, and annex C §C.14 now names the one exception)

- **F116-FR-014**: The product MUST ship profiles for the toolchains it detects and MUST accept profiles of the consumer from user configuration only, under the key `toolchains.<id>`, whose value is a profile of `specstride.toolchain/1` and which is stored under the logical name `user:toolchain:<id>`. The key MUST be of the trust class widening and has no default. A profile from project configuration, from the environment or from a flag MUST be ignored with a launch message and a doctor warning. The profiles a run used MUST be recorded with their versions. A profile for a fictional toolchain, given in a test overlay, MUST change the protected set of a fixture with no file of the product changed.
  - test: CT-116-14
  - ep: EP-16 `specstride.toolchain/1` (implements)
  - parity: not used (`toolchains.<id>`; under `parity` no loop layer is on and no protected set is built, row 1 of annex X §X.7)

- **F116-FR-015**: A toolchain without a profile MUST have the basic protection only: class A holds the executables and the files that the check manifest names and the files its derivation reads, class B is empty, no cache is handled and no marker is counted. The doctor MUST name the toolchains a run detected and which of them have a profile, and the fact that the basic protection applied MUST be recorded with the protected set, so that the `[LOOP]` line can say so (annex C §C.14, guarantees of the core).
  - test: CT-116-15
  - ep: EP-14 `specstride.doctor/1` (consumes)

#### The fact block

- **F116-FR-016**: The fact block MUST be built by the runtime from the control plane and the ledger only, and MUST be handed over at the call point `contributeCriticInput` of the loop-layer interface (annex D §D.1). Nothing in it MUST be read from the workspace: the builder MUST NOT read a file of the workspace. It MUST be present only when at least one unit of work was declared in the phase attempt or when an integrity rule that is independent of the layer found a fact.
  - test: CT-116-16; CT-116-117
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

- **F116-FR-017**: The fact block MUST hold: the hash of the check manifest and the list of its commands by id; the fingerprint of the tree at the phase gate, once; per unit its id and, per command, the exit result and in separate fields each condition (`tainted`, `flaky` with both observed results, `superseded` or `current`, `cached`); the commands excluded from the inner set, each with its reason. The final rows of a task MUST be those of the last check whose unit included it.
  - test: CT-116-17; CT-116-140; CT-116-146

- **F116-FR-018**: The fact block MUST state results per command and tree. The tasks each unit named MUST be headed as the proposer's declaration, and the tasks of the phase that no unit named MUST be listed. A task row MUST NOT carry a result. The block MUST hold one fixed sentence that says that a result is evidence about the tree and not about a task.
  - test: CT-116-18; CT-116-143
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F116-FR-019**: The fact block MUST NOT hold: counts of cycles, repairs, retries or failures; the order in which units were declared; times and durations; output of a command; earlier results; a fingerprint value per row; model tiers; sessions; routing decisions; whether a result came from the closing check; the note of a checkpoint; anything about groups or workers. The only counts in it MUST be those of suppression markers.
  - test: CT-116-19
  - ep: EP-04 `specstride.loop-layer/1` (consumes)

- **F116-FR-020**: The fact block MUST be a pure function of the final state: rows in the order of the tasks at launch and of the check manifest, unit ids as hashes of the sorted task ids. Two phase attempts with the same final state MUST give byte-identical fact blocks, whatever their histories.
  - test: CT-116-20; CT-116-118

- **F116-FR-021**: The fact block MUST hold the protected-set facts (paths changed since phase entry and which of them were authorised; protected paths changed since launch in phases already approved; suppression markers per file), the integrity events by kind and without counts, from the closed set of integrity kinds, and the further facts from their closed set. An integrity event that another feature raised MUST be taken from the ledger and the event file by its kind. When the ledger is invalid, the rows the ledger held before the first invalid record MUST stay and the block MUST say that inner results are unavailable after them. Every value that originates in the workspace MUST be marked as such, so that the critic prompt assembler escapes it.
  - test: CT-116-21; CT-116-142; CT-116-144

#### Events and records (added after the cross-feature review)

- **F116-FR-022**: For every integrity event that this feature raises (the kinds `changed-during-check`, `phase-entry-mismatch`, `toolchain-config-changed` and `pin-mismatch`), the engine MUST emit one event of the type `integrity.noted` of the event catalogue, with the fields `kind` and `detail`. `kind` MUST be a member of closed set row 65. `detail` MUST hold the paths concerned, marked as values of the workspace, and MUST hold no content of a file and no output of a command. This feature MUST emit no other event type. With no loop layer on and the switch of F116-FR-012 off, such an event MUST NOT be emitted.
  - parity: no event of this feature (rows 1 and 32 of annex X §X.7)
  - test: CT-116-22

- **F116-FR-023**: The record of the protected set (`specstride.protected-set/1`, `phase:<N>:protected-set`) and the record of a check result (`specstride.check-result/1`, `unit:<unitId>:check:<i>`) MUST carry their schema id and the fields of the section "Records owned by this feature", and MUST follow the common rules of annex B §B.4. The schema files MUST be delivered to the `contracts` package, with the schema file of `specstride.toolchain/1`. The record of a check result is the stored record; what the check runner returns is a value, and the engine MUST write from it the fields of that section and no other spelling of them.
  - test: CT-116-23
  - ep: EP-05 `specstride.check-runner/1` (consumes)

### Integrity rules and their tests

IR-01 to IR-30 are of R23 as amended by R23v; IR-31 to IR-57 of R23v; IR-58 to IR-60 of R27.
This feature owns 18 of the 60 rules. Every other rule is owned by another feature, which
feature 100 names.

| Rule | Subject | Requirement | Test |
|---|---|---|---|
| IR-11 | Two classes, fingerprint at phase entry, `tainted` | F116-FR-001, F116-FR-004, F116-FR-006 | CT-116-111 |
| IR-12 | Authorisation from the task text at launch | F116-FR-010 | CT-116-112 |
| IR-16 | Results bound to the fingerprint | F116-FR-008 | CT-116-116 |
| IR-17 | The fact block is built from the control plane | F116-FR-016 | CT-116-117 |
| IR-18 | The same final state gives the same block | F116-FR-020 | CT-116-118 |
| IR-31 | Fingerprint before and after, for the checks of a loop layer. At the verification gate and at grounding: annex C §C.8, F100-FR-098 | F116-FR-005 | CT-116-131 |
| IR-33 | Tree at phase entry equals the approved tree | F116-FR-012 | CT-116-133 |
| IR-35 | Scope of the fingerprint | F116-FR-003 | CT-116-135 |
| IR-36 | Executables, search path, configuration of the toolchain | F116-FR-009 | CT-116-136 |
| IR-37 | Caches; `cached` is not a pass | F116-FR-009 | CT-116-137 |
| IR-38 | Class A as patterns | F116-FR-002 | CT-116-138 |
| IR-39 | Suppression markers | F116-FR-011 | CT-116-139 |
| IR-40 | Exit result and conditions in separate fields | F116-FR-008, F116-FR-017 | CT-116-140 |
| IR-41 | Authorisation covers class A | F116-FR-010 | CT-116-141 |
| IR-42 | Integrity events reach the critic | F116-FR-021 | CT-116-142 |
| IR-43 | Results per command and tree | F116-FR-018 | CT-116-143 |
| IR-44 | Escaping inside a data boundary: here the marking of values. The escaping: annex D §D.7, F100-FR-135 | F116-FR-021 | CT-116-144 |
| IR-46 | No fingerprint value per row | F116-FR-017 | CT-116-146 |

### Threats of the threat model owned here

Feature 100, annex X §X.9 names feature 116 as an owner of these threats. The controls below
are specified here.

| Threat | Control | Requirements |
|---|---|---|
| T-19 The proposer edits what a check reads | The pins verified before every check; the protected set fingerprinted before and after; a change is a fact for the critic. Residual risk: inside an ignored path from which a check executes, a file that is neither a pinned executable nor matched by a class A pattern of a profile is covered by the listing alone; a change of its content that keeps name, size, mode, modification time and the time of the last change of status is not detected (F116-FR-003, CQ-197) | F116-FR-003, F116-FR-005, F116-FR-006, F116-FR-009, F116-FR-021 |
| T-20 The proposer weakens the tests it is measured by | Class B; suppression markers counted per file | F116-FR-001, F116-FR-011 |
| T-23 Repair history reaches the critic | The fields the fact block never holds | F116-FR-019 |
| T-24 The proposer overwrites the result the critic will see | The fact block is built from the control plane | F116-FR-016 |
| T-49 Several workers on one phase (with 142 and 117) | Nothing about groups or workers in the fact block | F116-FR-019 |

### Key Entities

| Entity | What it is |
|---|---|
| Protected set | The files of class A and class B of a phase, with their fingerprints at launch and at phase entry |
| Tree fingerprint | The fingerprint of the working tree a result is bound to |
| Check result | The result of one check on one unit: per command the exit result and the conditions, with the fingerprints before and after |
| Result condition | `tainted`, `cached`, `flaky`, `interrupted`, `unchecked`: a fact about a result that never replaces the exit result |
| Toolchain profile | Data per toolchain from which the protected set is built |
| Authorisation | The paths that the text of the tasks of a phase names, as read at launch |
| Fact block | What the critic receives about units, results, the protected set and integrity |
| Integrity event | A detected and refused act, or a detected difference. It reaches the critic by kind |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F116-SC-001**: Integrity of the phase gate. On the fixtures of experiment X12, part (i) shows 0 differences in output beyond the named layer fields when no unit of work is declared, and part (ii) shows that 100 per cent of the seeded tamperings are recorded as their condition and 0 as a pass.
- **F116-SC-002**: The critic learns no history. For 100 per cent of pairs of fixtures with the same final state and different histories, the fact blocks are byte-identical.
- **F116-SC-003**: Every rule has a test. 18 of 18 integrity rules owned here have a passing test.

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; ruling 18 |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. By the owner's rulings the dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no state of the three as-is systems is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a row in the divergence register | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |

| Feature-specific constraint | Source |
|---|---|
| Inner checks are deterministic commands only; no model acts as inner reviewer | Decision 21 |
| The critic sees final results and no repair history | Decision 21, fixed points |
| Detect everywhere, prevent where a sandbox exists; a changed set gives `tainted`, never a pass | Ruling 38 |
| No immutable snapshot of the tree in Wave 1 | Ruling 39 |
| A change of protected files without authority does not halt the run; the critic is told | Ruling 41 |
| No counts of tests in Wave 1, only counts of suppression markers; the unit id stays; no fingerprint value per row | Ruling 53 |

What belongs in the plan and not here: libraries and their versions, the layout of packages and
files, the physical paths behind the logical names, the test runner, bundling, how a fingerprint
is computed, and the spelling of internal functions.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-16 | `specstride.toolchain/1` | implements (content owner) | The shipped toolchain profiles, the conformance suite and the sample profile |
| EP-04 | `specstride.loop-layer/1` | consumes | The inputs of a layer (fingerprints) and the call point `contributeCriticInput`, at which the fact block is handed over |
| EP-05 | `specstride.check-runner/1` | consumes | The result of a check and its conditions; the pins |
| EP-03 | `specstride.spec-format/1` | consumes | The text and the ids of the tasks of a phase, for authorisation and for the rows of tasks |
| EP-02 | `specstride.harness/1` | consumes | The containment level and the confirmation that a sandbox denies writes |
| EP-14 | `specstride.doctor/1` | consumes | The check that names toolchains without a profile |

Conformance, as the brief sets it. EP-16: a profile for a fictional toolchain in a test overlay
changes the protected set of a fixture.

## Contracts of feature 100 used

| Interface contract | Version | Annex and section |
|---|---|---|
| Toolchain profile | `specstride.toolchain/1` | Annex C §C.14, F100-FR-110 |
| Fact block | `specstride.fact-block/1` | Annex D §D.7, F100-FR-135, F100-FR-136 |
| Loop-layer interface: inputs of a layer, the call point `contributeCriticInput`, the directive `keep` | `specstride.loop-layer/1` | Annex D §D.1, F100-FR-114, F100-FR-118 |
| Check runner; conditions of a result; fingerprints at the verification gate | `specstride.check-runner/1` | Annex C §C.8, F100-FR-097, F100-FR-098 |
| Check manifest (declared writes, pins, search path) | `specstride.manifest/1` | Annex D §D.8, F100-FR-137 |
| Canonical spec model | `specstride.spec-format/1` | Annex C §C.7, F100-FR-095 |
| Harness port; containment levels | `specstride.harness/1` | Annex C §C.1, F100-FR-077; §C.15, F100-FR-111 |
| Ledger | `specstride.ledger/1` | Annex B §B.13, F100-FR-068 |
| Further schema ids: the record of the protected set and the record of a check result, owner 116 | `specstride.protected-set/1`, `specstride.check-result/1` | Annex B §B.20, F100-FR-227 |
| Event envelope; the event type `integrity.noted` | `specstride.event/1` | Annex X §X.1 |
| Approval record (the tree bound in it) | `specstride.approval/1` | Annex B §B.14 |
| Rules of the layout; logical names | `specstride.layout/1` | Annex B §B.2, F100-FR-034, F100-FR-040; §B.5 |
| Identifiers (`unitId`) | — | Annex B §B.3, F100-FR-044 |
| Run record (`containment`, `protection`) | `specstride.run-state/1` | Annex E §E.2, F100-FR-143 |
| Doctor check registry | `specstride.doctor/1` | Annex G §G.7 |
| Line grammar (the key `protection` of the `[LOOP]` line) | protocol 1 | Annex G §G.3 |
| Config envelope and trust classes | `specstride.config/1` | Annex X §X.2, F100-FR-202 |
| List of closed sets | — | Annex X §X.6, rows 27, 53, 65, 66, 142, 143 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, rows 1, 31, 32 |
| Threat model | — | Annex X §X.9, T-19, T-20, T-23, T-24, T-49 |

Logical names used: `phase:<N>:manifest`, `phase:<N>:protected-set`, `unit:<unitId>:check:<i>`,
`attempt:<N>:<k>:<n>:fact-block`, `gate:<N>:approved`, `run:<runId>:ledger`,
`run:<runId>:record`, `user:toolchain:<id>`.

Fixture families of feature 141 cited: none for a parity test, since this feature has no as-is
behaviour (feature 141, §O.7). The second suite (F141-FR-039 to F141-FR-042) shows that no file
and no event of this feature appears beyond the layer allowlist when no unit is declared.

## Rows of the `parity` profile

| Row | Switch | Key | Default | Under `parity` | Register row | Requirement |
|---|---|---|---|---|---|---|
| 32 | Comparison of the tree at phase entry | `integrity.phase_entry` | on | off | DV-077 | F116-FR-012 |

This feature introduces no other switch. The key `toolchains.<id>` (F116-FR-014) is data of
the consumer and no switch; it has no row in annex X §X.7 and is not used under `parity`. The
other behaviour of this feature follows row 1 (the loop strategy,
owned by feature 115): under `parity` no loop layer is on, so no check of a loop layer runs, no
fingerprint is taken and no fact block is built.

## Records owned by this feature

Annex B §B.20 of feature 100 fixes the schema id, the logical name and the owner of two records;
F100-FR-227 asks the owner to list the fields. A reader ignores a field it does not know and
refuses another major (annex B §B.4). The schema files are in `contracts/schemas/`.

Record of the protected set, `specstride.protected-set/1`, at `phase:<N>:protected-set`:

| Field | Type in words | Required | Meaning |
|---|---|---|---|
| `schema` | The constant `specstride.protected-set/1` | Yes | Schema id |
| `phase` | Whole number | Yes | Phase number |
| `profiles` | List of `id` and `version` | Yes | The toolchain profiles used; empty when the basic protection applied |
| `basic` | True or false | Yes | Whether the basic protection applied (F116-FR-015) |
| `classA` | Object with `patterns` (list of text) and `ignoredListings` (list) | Yes | Patterns of class A. Per ignored path from which a command executes: `path`, `listingHash`, and `contentHashed`, the files there that are hashed by content, each with `path` and `hash` |
| `classB` | Object with `files`, a list of `path` and `hash` | Yes | Test files at phase entry |
| `authorised` | Map from task id to a list of paths | No | Paths that the text of the tasks at launch names |
| `atLaunch`, `atPhaseEntry` | Object with `set` and `tree`, two fingerprints | Yes | Fingerprint of the set and of the tree at both moments |
| `exclusions` | List of text | Yes | What the tree fingerprint excludes |
| `effectiveConfig` | Hash, or null | No | Hash of the effective configuration of the toolchain at phase entry |

Record of a check result, `specstride.check-result/1`, at `unit:<unitId>:check:<i>`:

| Field | Type in words | Required | Meaning |
|---|---|---|---|
| `schema` | The constant `specstride.check-result/1` | Yes | Schema id |
| `unitId` | Text | Yes | The unit of work (annex B §B.3) |
| `ordinal` | Whole number | Yes | The ordinal `<i>` of the check of the unit |
| `treeBefore`, `treeAfter` | Fingerprint | Yes | The tree before and after the check |
| `protectedBefore`, `protectedAfter` | Fingerprint | Yes | The protected set before and after the check |
| `commands` | List, in the order of the check manifest | Yes | One entry per command, with the fields of the next table |
| `excluded` | List of `id` and `reason` | No | Commands excluded from the inner set |

An entry of `commands`:

| Field | Type in words | Required | Meaning |
|---|---|---|---|
| `id` | Text | Yes | Id of the command in the check manifest. The check runner returns it as `commandId` |
| `exit` | Whole number, or null | Yes | Exit result; null when the command did not end by itself. The check runner returns it as `exitCode` |
| `conditions` | Object with the five fields `tainted`, `cached`, `flaky`, `interrupted`, `unchecked` | Yes | Each field is false, or an object with `reason` (a member of closed set row 53, or null where the condition has no reason) |
| `observed` | List of two exit results | No | Both results of a command that carries `flaky` |
| `durationMs` | Whole number | No | Duration. Never shown to the critic (F116-FR-019) |
| `outputRef` | Object with `name`, `hash`, `bytes` | No | Where the output is kept, by logical name. The output itself is not in the record |

Freshness (`current`, `superseded`) is not stored. It is derived when the fact block is built
(F116-FR-008).

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 116, as annex X §X.6 names it.

| Row of annex X §X.6 | Closed set | Members | Closed by | Unknown value |
|---|---|---|---|---|
| 27 | `protection` | `prevent`, `detect` | Design | Read as `detect` |
| 65 | Integrity kinds that reach the critic | `ledger-invalid`, `manifest-mismatch`, `pin-mismatch`, `changed-during-check`, `phase-entry-mismatch`, `toolchain-config-changed`, `advisory-marker-removed`, and the two neutral kinds of feature 142, `tree-changed-outside-pass` and `protected-change-not-applied` | Design | The kind is not shown to the critic; it stays in the event file |
| 66 | Further facts of the fact block | `manifest-rederived`, `result-of-stopped-job`, `evidence-predates-tree`, `source-change-accepted`, `task-list-changed` | Design | Not shown |
| 142 | Classes of the protected set | A, B | Design | Read as class A |
| 143 | Freshness of a result | `current`, `superseded` | Design | Read as `superseded` |

Row 53 (result conditions of a check, and the reasons of `unchecked`) is owned by the feature
that owns the check runner. This feature sets the conditions `tainted` (with the reasons
`changed-during-check`, `protected-set-changed` and `pin-mismatch`) and `cached`, and reads the
conditions `flaky`, `interrupted` and `unchecked` with their reasons.

Row 63 (refusal reasons of a delta) names feature 142 as owner in annex X §X.6. This feature
lists no member of it. It supplies to that set only the meaning of a violation of the protected
set, through the contract of annex C §C.14.

Who raises which integrity kind: this feature raises `changed-during-check`,
`phase-entry-mismatch`, `toolchain-config-changed` and `pin-mismatch`. The other kinds are raised
by the features that feature 100 names for them; this feature lists them because the set is one
set and the fact block shows them.

Rule for an unknown value, for every set above: a reader does what the column says; a writer
never writes a value outside the set.

## As-is behaviour not carried

The traceability files assign no row to feature 115, from which this feature was split, and none
to this feature: no as-is requirement, no success criterion and no behaviour item, with any
disposition.

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| (none assigned to this feature) | — | — |

## Ids before the split

The requirements, success criteria and tests of this feature had these ids in
`115-micro-loop-layer`. The old ids are not reused there.

| Old id | New id | Old tests | New tests |
|---|---|---|---|
| F115-FR-043 | F116-FR-001 | CT-115-43; CT-115-111 | CT-116-1; CT-116-111 |
| F115-FR-044 | F116-FR-002 | CT-115-44; CT-115-138 | CT-116-2; CT-116-138 |
| F115-FR-045 | F116-FR-003 | CT-115-45; CT-115-135 | CT-116-3; CT-116-135 |
| F115-FR-046 | F116-FR-004 | CT-115-46; CT-115-111 | CT-116-4; CT-116-111 |
| F115-FR-047 | F116-FR-005 | CT-115-47; CT-115-131 | CT-116-5; CT-116-131 |
| F115-FR-048 | F116-FR-006 | CT-115-48; CT-115-111 | CT-116-6; CT-116-111 |
| F115-FR-049 | F116-FR-007 | CT-115-49 | CT-116-7 |
| F115-FR-050 | F116-FR-008 | CT-115-50; CT-115-116; CT-115-140 | CT-116-8; CT-116-116; CT-116-140 |
| F115-FR-051 | F116-FR-009 | CT-115-51; CT-115-136; CT-115-137 | CT-116-9; CT-116-136; CT-116-137 |
| F115-FR-052 | F116-FR-010 | CT-115-52; CT-115-112; CT-115-141 | CT-116-10; CT-116-112; CT-116-141 |
| F115-FR-053 | F116-FR-011 | CT-115-53; CT-115-139 | CT-116-11; CT-116-139 |
| F115-FR-054 | F116-FR-012 | CT-115-54; CT-115-133 | CT-116-12; CT-116-133 |
| F115-FR-055 | F116-FR-013 | CT-115-55 | CT-116-13 |
| F115-FR-056 | F116-FR-014 | CT-115-56 | CT-116-14 |
| F115-FR-057 | F116-FR-015 | CT-115-57 | CT-116-15 |
| F115-FR-058 | F116-FR-016 | CT-115-58; CT-115-117 | CT-116-16; CT-116-117 |
| F115-FR-059 | F116-FR-017 | CT-115-59; CT-115-140; CT-115-146 | CT-116-17; CT-116-140; CT-116-146 |
| F115-FR-060 | F116-FR-018 | CT-115-60; CT-115-143 | CT-116-18; CT-116-143 |
| F115-FR-061 | F116-FR-019 | CT-115-61 | CT-116-19 |
| F115-FR-062 | F116-FR-020 | CT-115-62; CT-115-118 | CT-116-20; CT-116-118 |
| F115-FR-063 | F116-FR-021 | CT-115-63; CT-115-142; CT-115-144 | CT-116-21; CT-116-142; CT-116-144 |
| F115-SC-004 | F116-SC-001 | — | — |
| F115-SC-008 | F116-SC-002 | — | — |

F116-SC-003 is new. It is the part of the old F115-SC-010 that counts the 18 integrity rules
which moved; F115-SC-010 stays in `115-micro-loop-layer` for the 28 rules that stayed.

As-is origins that moved: none. No requirement of either part has an origin.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was
put to a person. The first seven were answered before the split and came with the requirements.

- Q: Does a change of a protected file switch a loop layer off, as R22 and R25 say? → A: No. The result carries `tainted` and keeps its exit result; the run does not halt and the critic is told. Integrated in F116-FR-006. (Source: `APPROVAL.md` rulings 38, 41; R27 D-18)
- Q: Are counts of tests shown to the critic? → A: No, only counts of suppression markers; the unit id stays and no fingerprint value stands per row. Integrated in F116-FR-011, F116-FR-017 and F116-FR-019. (Source: `APPROVAL.md` ruling 53)
- Q: Do the verification gate and grounding run on an immutable copy of the tree? → A: No. The runtime fingerprints before and after. (Source: `APPROVAL.md` ruling 39)
- Q: Does register row DV-052 cover the record of the protected set? → A: This specification proceeds on yes (CQ-084). Integrated in F116-FR-004. (Source: `consolidation.md` DV-052; F100-FR-110, which cites DV-052 for the protected set)
- Q: May a toolchain profile name how the effective configuration is read? → A: This specification proceeds on yes, as one fixed argument list of a pinned executable (CQ-085). Integrated in F116-FR-013 and F116-FR-009. (Source: rule IR-36; annex C §C.14)
- Q: Who owns closed set row 63? → A: Feature 142, as annex X §X.6 says. This feature lists no member. (Source: feature 100, annex X §X.6 row 63)
- Q: How many rows does the divergence register have? → A: 113, DV-001 to DV-113. DV-052, DV-076 and DV-077 bear on this feature. (Source: `consolidation.md` section 6; `STAGE-B-SPLIT-PROMPT.md`)
- Q: After the split, which part hands the fact block to the critic prompt assembler? → A: The loop layer returns it at its call point `contributeCriticInput`; this feature builds it. The two meet in annex D §D.1 and §D.7 of feature 100. Integrated in F116-FR-016. (Source: feature 100, annex D §D.1, §D.7)
- Q: After the split, who says that a tainted unit is not kept and that the failure counts against the repairs? → A: This feature says that `tainted` is never a pass and that a unit with a tainted check is not recorded as kept. How a repair is counted belongs to the loop layer. Integrated in F116-FR-006. (Source: annex D §D.1, directives; R27 D1.6)
- Q: Which fingerprints does this feature take when no loop layer is on? → A: Only those of the comparison at phase entry, and only with its switch on. The fingerprints around the commands of the verification gate and around grounding belong to row 31 of the profile and to its owners. Integrated in F116-FR-004 and F116-FR-012. (Source: annex X §X.7 rows 31, 32; F100-FR-098)
- Q: Where does the success criterion on experiment X12 stand after the split, given that the experiments stay with the layer? → A: Here, as F116-SC-001. This feature builds the tamper fixtures and the test of the conditions; the run of the experiment and its report are work of the feature that owns the experiments. (Source: `STAGE-B-SPLIT-PROMPT.md`; brief 115 heading 8)
- Q: Which integrity kinds does this feature raise itself? → A: Four: `changed-during-check`, `phase-entry-mismatch`, `toolchain-config-changed`, `pin-mismatch`. It lists the whole set because the fact block shows every kind. Integrated in "Closed sets". (Source: rules IR-31, IR-33, IR-36, IR-42)

### Session 2026-09-30, after the cross-feature review

- Q: The plan said that files of the protected set are always hashed by content, and that ignored paths of class A are hashed by their listing. Which holds? → A: Both, with the exception stated. Rule IR-35 words the listing ("by hash of their metadata listing") and R27 adopts it, so an ignored path from which a check executes is covered by a listing. Content is hashed for every protected file inside the scope of the tree fingerprint, for every pinned executable (rule IR-36) and for every file inside such a path that a class A pattern of a profile matches (rule IR-38). The listing holds the time of the last change of status, so that a restored modification time does not hide a change. What remains is stated as a residual risk of T-19 and is reported as a question (CQ-197). Integrated in F116-FR-003. (Source: R23v IR-35, IR-36, IR-38; R27 D1.4; review item W-116-01)
- Q: Under which key does a consumer give a toolchain profile? → A: `toolchains.<id>`, in user configuration only, trust class widening, stored under `user:toolchain:<id>`; the form follows `harnesses.<id>` and `user:harness:<id>`. The spelling is a proposal to the owner of the key list. Integrated in F116-FR-014. (Source: annex B §B.5; annex C §C.14; review item W-110-09)
- Q: Which event type carries an integrity event of this feature? → A: `integrity.noted` of the event catalogue, with `kind` and `detail`. Integrated in F116-FR-022. (Source: feature 100, annex X §X.1; review item W-X-24)
- Q: Whose field names hold for the record at `unit:<unitId>:check:<i>`? → A: Those of this feature, the owner by annex B §B.20. The check runner returns a value; the stored record has `id` and `exit`. Integrated in F116-FR-023. (Source: annex B §B.5, §B.20; F100-FR-227; review item W-148-01)

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place keep their ids and their tests.

| Item | Requirement or place | What changed |
|---|---|---|
| W-116-01 | F116-FR-003 | States where content is hashed and where the listing holds, what the listing contains, and that the record says so; `assumption: CQ-197` |
| W-116-01 | Threat table, T-19 | The residual risk is stated; F116-FR-003 is named |
| W-110-09 | F116-FR-014 | Names the key `toolchains.<id>`, its trust class and its value under `parity`; the environment and a flag are named as refused sources |
| W-X-18 | F116-FR-010, F116-FR-018 | The line `ep: EP-03 specstride.spec-format/1 (consumes)` |
| W-X-24 | F116-FR-022 (new) | Names the event type `integrity.noted` for the four kinds this feature raises |
| W-148-01, W-100-02 | F116-FR-023 (new); section "Records owned by this feature" | The fields of the two records of annex B §B.20, in the specification as F100-FR-227 asks |
| W-X-12 | Section "Closed sets" | Rows 142 and 143 in place of "new"; the sentence that annex X still names 115 is removed |
| W-100-02 | Threat table (introduction); "Assumptions"; "Contracts of feature 100 used" | Feature 100 names 116; the sentences that it still names 115 are removed; annex B §B.20 and rows 142, 143 are cited |
| Found while repairing | F116-FR-006, F116-FR-009; section "Closed sets", row 53 | The reasons `protected-set-changed` and `pin-mismatch` of closed set row 53 are named |
| Found while repairing | Table "Out of scope" | The check runner and the pins at launch: 148; fingerprints at the verification gate: 148, 117 |

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary.
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The open questions of `CLARIFY-QUEUE.md` are read with their recommended answers.
- The check runner returns each condition in a field of its own and gives the pins taken at launch (annex C §C.8).
- A loop layer asks for fingerprints as an input of annex D §D.1 and returns the fact block at its call point.
- Feature 100 names this feature as content owner of EP-16 (annex C §C.14) and of the fact block (annex D §D.7), as owner of the records `specstride.protected-set/1` and `specstride.check-result/1` (annex B §B.20), of closed set rows 27, 65, 66, 142 and 143 (annex X §X.6) and of the package `@specstride/integrity`. This feature writes the schema file of `specstride.toolchain/1`.

Readings that the sources did not settle when this specification was written. Each is marked in its requirement. All three were closed on 2026-09-30 (`docs/ecosystem/CLARIFY-QUEUE.md`): CQ-197 by the owner's answer, CQ-084 and CQ-085 by the owner's instruction that the recommended answer stands. The readings below are the answers.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-084 | Does register row DV-052 cover every file of the control plane that exists only with a loop layer on? Its text names the check manifest and the record of its derivation | Yes: also the protected-set fingerprints and the pins. The layer allowlist of feature 141 needs these logical names | F116-FR-004 |
| CQ-085 | May a toolchain profile name how the effective configuration of a toolchain is read? Annex C §C.14 says a profile names no command to run; rule IR-36 compares that configuration | Yes, as one fixed argument list of a pinned executable, run by the check runner; without it the comparison is left out and the doctor says so | F116-FR-013, F116-FR-009 |
| CQ-197 | Rule IR-35 covers an ignored path from which a check executes by a hash of its listing with metadata. Principle III asks that a change is detected everywhere. Is the listing enough for the files there that are neither pinned nor named by a profile? Reported on 2026-09-30 as CQ-197; closed by the owner the same day on this reading | Yes for Wave 1: the listing, with the time of the last change of status, and content hashes for pinned executables and for files that a class A pattern of a profile matches. The residual risk is stated in the threat table (T-19) and in the plan | F116-FR-003 |
