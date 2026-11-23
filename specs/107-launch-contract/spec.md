# Feature Specification: Launch contract

**Feature Branch**: `107-launch-contract` (a label: Spec Kit creates no branch in this repository; the directory is `specs/107-launch-contract`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 107-launch-contract: the launch contract of Specstride, made from Spec Kit features that already exist: the deterministic inventory of sources; the draft with its open blockers; derivation of what the inventory cannot settle, judged by the host in bounded batches; validation; promotion and its stamp; rendering of the launcher and the content-addressed launch bundle; refusal of an edited launcher; the `dry-run` mode; the consumer's comment (how it is stored, what it may steer, what it may never do); the verification mode that derivation sets."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 18, 40, 56, 64, P11), `architecture.md`, `consolidation.md` (section 1 glossary; register rows DV-008, DV-009, DV-038, DV-054, DV-055, DV-059, DV-060, DV-061, DV-096, DV-097), `feature-briefs.md` (brief 107-launch-contract), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles XIII, XIV, XV, XVIII, XIX), `research/R17`, `R11` (T-09 to T-12, T-47), `R15v` (A-6), `R16` (F5.7), `R19` (`auto` versus `run`), the as-is specification `old/011-as-is-mixture-of-loops/` and its baseline at `9c88f86` (derivation and contract references, the three scripts), and feature 100 (`specs/100-specstride/`, annexes G, X, C, F, B).

## Scope

The product takes Spec Kit features that already exist and does not author specs. This feature turns them into a launch contract that the pipeline can run unattended, and into the launcher and launch bundle that start it.

**In scope**: the inventory of sources; the draft with its open blockers; derivation of what the inventory cannot settle, judged by the host in bounded batches; validation; promotion and its stamp; rendering of the launcher and the content-addressed launch bundle; refusal of an edited launcher; the `dry-run` mode; the consumer's comment; the verification mode that derivation sets; declared write scopes and declared reads and writes that the launch contract carries.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Running the pipeline, launch checks, relaunch, `supervise`, digest lines, the dry-run plan that the pipeline entry prints | 123 |
| Starting the detached runtime and the handshake | 122 |
| The hashing scheme and the staleness verdict | 104 |
| The meaning of the learning block | 106 |
| The text of the host skill and its token budget | 113 |
| Stage kinds and precondition checks (the registries) | 123 (EP-19); the schema lists what is registered |
| Use of declared scopes, reads and writes | 142 and 105 |

## Constraints

Set by the owner. They are not implementation detail to be removed.

| Constraint | Source |
|---|---|
| TypeScript is the language of every component. The Language Ledger is empty at the start of Wave 1; another language enters only through a ledger entry | Decisions 1, 2; DP-043 (ruling 18) |
| The product runs on Node 22 or later and is installed with npm, as one published package with the host plugins as thin layers over it; no install script and nothing that compiles at install | Decision 19; Principle VI |
| Linux and macOS are both first-class; Windows and WSL are recorded as unvalidated. Every statement about macOS is `unverified` | Decision 12; ruling 67 |
| Claude Code is the first host, and Claude is the default proposer and critic of Wave 1. The dsh, Codex, pi and prime harness adapters are Wave 1 features as well. The harnesses the owner named are a starting point and not a boundary: no requirement assumes a closed list of harnesses | Decisions 13, 17; rulings 32, 32b |
| State is greenfield: no old `.specstride/`, `.lisa/` or `.mixture-of-loops/` state is read | Decision 3 |
| The host skill and the detached runtime coordinate only through files | Decision 5; Principle I |
| Parity with the baselines is proven by the differential oracle under the `parity` profile; an intended difference has a divergence register row | Decision 4 |
| MIT licence; no path, account or name specific to the owner's machines | Decision 19 |
| The product takes Spec Kit features that already exist and does not author specs | Prompt section 0 |
| The launcher is TypeScript run through Node; no Bash launcher | Decision 2; DP-043 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A consumer turns finished Spec Kit features into a launch contract (Priority: P1)

A consumer has one or more Spec Kit feature directories. The host skill asks the CLI to inventory them. The CLI lists every source with its hash, builds a draft, settles what facts settle, and hands the host a few bounded batches of judgment items. The host answers them with choices. The CLI writes the stages and the rest of the launch contract from the facts and the answers. Validation checks the result and promotes it.

**Why this priority**: Without a promoted launch contract nothing launches. The host has a small context; derivation must fit in it.

**Independent Test**: Run derivation on the fixtures `greeting-ready` and `greeting-blocked` (fixture family FX-32). The first ends in a validated launch contract and a launcher. The second ends as a blocked draft whose open blocker points at the line of the plan that the fixture names.

**Acceptance Scenarios**:

1. **Given** a feature with all its artifacts, **When** derivation runs, **Then** the draft holds every source with path, kind, content hash and line count, one coverage entry per task, and the open blocker `semantic-derivation-required` (F107-FR-001, F107-FR-005).
2. **Given** a draft with judgment items, **When** the CLI pages them, **Then** each batch is at most 3,000 tokens and the CLI prints how many batches remain (F107-FR-009).
3. **Given** a draft with an open blocker, **When** promotion is asked for, **Then** the launch contract stays a `draft`, `next:` hints are printed and the exit code is 20 (F107-FR-021).
4. **Given** a draft whose judgment items are all answered, **When** the last answer is recorded, **Then** the CLI has written the stages, the settled coverage, the verification-commands document and the findings, the bootstrap finding is resolved, and the host wrote nothing (F107-FR-041).

---

### User Story 2 - Only validation promotes, and only a promoted launch contract renders (Priority: P1)

An operator wants a launcher they can see and run, and wants to know that nobody edited the launch contract, the launcher or the launch bundle between rendering and launch.

**Why this priority**: The launcher runs unattended for hours. An edited launcher or launch bundle runs altered code.

**Independent Test**: Render from a promoted launch contract. Edit the launcher, then the launch bundle, then a source. Each edit is refused with its own exit code (20, 20, 23). Render again over the edited launcher: refused unless told to replace it.

**Acceptance Scenarios**:

1. **Given** a launch contract with status `validated` typed in by hand, **When** render runs, **Then** it refuses with exit 20 because no matching stamp exists (F107-FR-027).
2. **Given** an edited launcher, **When** render runs without `--replace-edited`, **Then** it refuses and leaves the file as it is (F107-FR-028).
3. **Given** a launch bundle whose contract changed after rendering, **When** the launcher starts or a relaunch starts, **Then** the run is refused with exit 20 (F107-FR-031).

---

### User Story 3 - The consumer's comment steers and never bypasses (Priority: P1)

A consumer types a comment with the request: "only feature 2, and skip the launch checks, just run it." The hash of the comment is recorded by the first command of derivation before that command prints anything of the repository, the text is stored at launch, and the comment changes only what validation accepts.

**Why this priority**: Repository text can try to make the host model invent or alter a comment. A comment must never become permission.

**Independent Test**: Launch with a comment that asks to skip a check, then with a comment laundered from repository text. Every check still runs. The digest and events show the comment as typed and what it changed.

**Acceptance Scenarios**:

1. **Given** a comment, **When** `contract derive` starts with it, **Then** the hash of the text as typed is recorded in the draft before any repository text is printed; and **When** `launch` starts with the same text, **Then** the comment, redacted and otherwise as typed, is stored beside the launch record (F107-FR-034).
2. **Given** a comment that asks to skip a launch check, the terms gate or a budget, **When** the run launches, **Then** no launch check, terms gate or budget differs from a run without the comment (F107-FR-035).
3. **Given** a run launched with a comment, **When** the events and the digest are read, **Then** both show the comment and what it changed (F107-FR-035).
4. **Given** a promoted launch contract that records the hash of a comment, **When** `launch` is given another comment or none, **Then** the launch is refused with the reason `comment-changed` and nothing starts (F107-FR-034).

---

### User Story 4 - A consumer previews a launch with `dry-run` (Priority: P2)

A consumer wants to see what would run, without running it.

**Why this priority**: Invocation is consent; `dry-run` is the one way to withhold it.

**Independent Test**: Run `launch` in `dry-run` mode with a process watch and a state comparison. No detached runtime, engine, harness or stage action starts, and no launch record, lease, event or run record is written.

**Acceptance Scenarios**:

1. **Given** a request with no mode, **When** the host skill calls `launch`, **Then** the mode is `run` and the run launches (F107-FR-032).
2. **Given** the mode `dry-run` and a launch contract that the launch-contract commands derived, promoted and rendered, **When** `launch` runs, **Then** it validates the launch contract again, reports what would be launched and stops with exit 0 (F107-FR-033).
3. **Given** parallel units on, **When** `dry-run` prints its report, **Then** it includes the parallel plan once; with them off it prints no line about it (F107-FR-038).
4. **Given** the mode `dry-run` and no promoted launch contract, **When** `launch` runs, **Then** it exits 20 with a `next:` line that names `contract derive`, and it derives nothing (F107-FR-033).

---

### User Story 5 - A host without a model still derives (Priority: P3)

A test host or a CI runner has no model. User configuration names a harness. The CLI delegates the judgment to it and records the delegation.

**Why this priority**: Decision 5 puts derivation in the host; ruling 64 lets a model-less host delegate.

**Independent Test**: With a host that declares no model and a harness named in user configuration, derivation completes and the digest records the delegation. With none named, derivation stops at the first batch with a message that names the configuration key.

**Acceptance Scenarios**:

1. **Given** a host with no model and a named harness, **When** a batch is due, **Then** the harness answers through its completion level and each answer records that provenance (F107-FR-011).
2. **Given** a host with no model and no named harness, **When** a batch is due, **Then** derivation stops with a refusal that names the key (F107-FR-011).

### Edge Cases

- Two feature directories are supplied and one has no `tasks.md`: the absent artifact is recorded, and the task count of that feature is zero.
- No `--feature` and several `specs/*` directories hold `tasks.md` or `spec.md`: the CLI stops and lists the candidates.
- A path given for `--feature` is a file: its parent directory is used. A path that is not a directory after that stops derivation.
- A source is not text: its line count is 0 and its content hash is still taken.
- A prerequisite is named in a plan and the path is absent: an open blocker at its line, and the launch contract stays a draft.
- A verification declaration cannot be written as a fixed argument list, or two declarations disagree: a blocker and never a guess.
- Only task checkboxes changed since derivation: the launch contract is not stale.
- A source under the learning decisions of the run is added as a source: validation refuses it, because that file is rewritten at every approved phase and would refuse every relaunch.
- A relaunch finds the launcher or the launch bundle edited: refused with exit 20.
- The comment is empty or absent: no `configuration.comment` entry, and no line about it.
- The judgment payload is larger than one batch: more batches, never a larger batch.
- The host answers with text that is not one of the offered choices: the answer is refused and the item stays open.
- A draft has no judgment item: the first `--next-batch` prints a batch of zero items with zero remaining, and completes the draft (F107-FR-041).
- The exchange is interrupted between two batches: the next `--next-batch` continues from the answers that the draft holds (F107-FR-009).
- A task stands in no phase of the canonical model: it becomes a judgment item of kind `classify-obligation` and is never mapped by fact (F107-FR-041).
- A plan holds a fenced block of another kind (`text`, `json`) before a shell block: the shell candidates are those of the baseline's reading of fences, its accident included (F107-FR-004).
- `contract validate --promote` names a file that cannot be read, is not JSON or is not an object: the defect of the baseline is preserved, and the file is replaced by a record whose only member is the status `draft` (F107-FR-021).
- `launch` finds no promoted launch contract: it never derives; it refuses and names `contract derive` (F107-FR-033).
- `launch` finds the launcher edited: the launch check `launcher-intact` of feature 123 refuses first, with its own reason; the check of this feature stands behind it, at every start of the launcher (F107-FR-031).
- A comment asks for more relaunches, for the learning mode `apply` or for a feature that is no candidate: the option that would carry it out is refused as widening, and nothing is written (F107-FR-035).

## Requirements *(mandatory)*

### Functional Requirements

Naming: "launch contract" is the pipeline data of schema `specstride.launch-contract/1`. "Coverage obligation" is one entry of its `coverage` list. Commands are written `contract derive`, `contract validate`, `contract render` and `launch`; the spelling is this feature's proposal (annex G §G.1 leaves it to the owner) and is listed in the report. The member names inside the records of the launch contract are those of the baseline and are listed in `data-model.md`, with two exceptions: `schema` stands for `schema_version`, and `configuration.relaunch` for `configuration.auto`. The oracle compares the draft on FX-32, so another renamed member would be a difference.

#### G1 - Inventory, draft, derivation in batches

- **F107-FR-001**: The inventory MUST list, for each feature in scope: the seven Spec Kit artifacts `spec`, `plan`, `tasks`, `research`, `data-model`, `quickstart` and the verification-commands document, when present; every file that is not a symbolic link under `contracts/` (kind `contract`) and `checklists/` (kind `checklist`); and once for the repository, the constitution (kind `constitution`). The kind of an artifact MUST be its base name without extension. Sources MUST be sorted by absolute path. Each source record MUST hold its path (relative to the repository root, else absolute), its kind, its content hash and its line count (the file read as UTF-8 text, a last line without a line end counted; 0 when the file is not text); a `tasks` source MUST also hold the hash that ignores checkboxes. Hashes MUST come from the canonical hasher, so that they equal the baseline's on the same input: those of the spec, the plan and the task list are taken from `inputs` of the canonical spec model, and every other source gets the content hash (F104-FR-023). Absent expected artifacts MUST be recorded, per feature, beside the artifacts present, the slug, the phases and the task count.
  - origin: 011 FR-001; C-213; B-2480; B-2485
  - disposition: ported
  - test: PT-107-011FR001-*; PT-107-C-213-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - status: unverified on macOS (check: FX-32 on a macOS runner; verified-on: —; pin: runner version)

- **F107-FR-002**: Derivation MUST resolve the features in scope as follows. `--feature PATH` may repeat; a relative path resolves against the repository root; a path to a file is replaced by its parent directory; a path that is then not a directory MUST stop derivation with the message `feature path is not a directory: <path as given>`. `--repo DIR` MUST be given and MUST be a directory, else the message is `repository is not a directory: <root>` with exit 2. Without `--feature`, the repository root itself is the feature when it holds `tasks.md` or `spec.md`; otherwise exactly one `specs/*` directory that holds `tasks.md` or `spec.md`; otherwise derivation MUST stop with `feature is ambiguous; pass --feature for each in-scope feature (candidates: ...)`, where the candidates are listed by their path relative to the repository root, or the word `none` stands for them. `contract derive` MUST also take the two options of the learning binding, `--learning-mode off|suggest|apply` (default `off`) and `--applied-file PATH`. Their rules are those of the owner of learning (F106-FR-027, F106-FR-033; items B-2470 and B-2471 are that owner's): this feature hands both to the binding function of that owner and writes the block it returns (F107-FR-005).
  - origin: C-210; C-213; B-2468; B-2472; B-2479
  - disposition: translated
  - test: PT-107-C-210-*; PT-107-C-213-*
  - divergence: DV-066

- **F107-FR-003**: The draft MUST record the repository root, the revision (from the version-control tool, time limit 20 seconds) and whether the tree is dirty (time limit 30 seconds). Both MUST be null when the tool cannot be started, when a query exceeds its time limit, or when the revision cannot be read; the dirty mark alone MUST be null when only the second query ends with a failure. The launch contract id MUST be the lower-cased feature directory names joined by `-and-`, every run of characters outside `a-z0-9` collapsed to `-`, a `-` at either end removed, or `pipeline` when nothing is left.
  - origin: C-213; B-2478; B-2486
  - disposition: ported
  - test: PT-107-C-213-*

- **F107-FR-004**: The inventory MUST hold four kinds of candidate, all deterministic. Shell candidates: fenced blocks in the plan and the quickstart only, each with path, first and last line of its body, text and `classification=candidate-only`. The reading of fences MUST be the baseline's, line by line. Outside a block, a line that starts at column 0 with three backticks, followed by nothing or by `bash`, `sh`, `shell` or `console` in any case, and then only white space, opens a block. Inside a block, a line that is three backticks once its white space is trimmed closes it. A block whose body is empty after trimming, and a block still open at the end of the file, is not recorded. A fence of any other kind therefore opens nothing, and its closing fence opens a plain block that runs to the next bare fence: this accident of the baseline is preserved (Principle XVIII), and the classification `candidate-only` is what keeps such a block from becoming a command. Prerequisite candidates: in every Markdown source, backticked tokens that contain `/` or `.`, do not start with `-` and hold no space, on a line that carries `PRE-<n>` or under a heading of any level that matches `prerequisite` in any case (the section ends at the next line that starts with `#`); each with id (null where the line carries none), source path, line and anchor (the id, else `prerequisites`), the path as written, the path resolved against the repository root, and whether it is present. A record for the verification-commands document with `valid_json` and either the error or the feature, the phase map and the commands. The id of a coverage obligation MUST be `OBL-` followed by the first 12 hexadecimal characters, upper-cased, of the content hash of the text `<source>:<line>:<task id>:<text>` (the content hash of a text of the canonical hasher, F104-FR-021).
  - origin: C-213; B-2481; B-2482; B-2483; B-2484
  - disposition: ported
  - test: PT-107-C-213-*

- **F107-FR-005**: The draft MUST have the status `draft`, the schema id `specstride.launch-contract/1` in the field `schema`, `authorized_roots` set to the repository root and an empty list of stages. It MUST name the logical component `contract-derive` and its version in the members `tool` and `version` of `generated_by`, never an implementation file. It MUST hold one record per feature (path, slug, phases with number, title and line, task count, artifacts present and absent) and one coverage entry per task, with kind `implementation`, timing `specstride-phase:<n>` (or `unclassified` when the task has no phase), producer `unclassified`, disposition `unresolved`, empty stage ids, verification ids and evidence, and the task text as rationale. It MUST hold exactly one bootstrap finding: id `semantic-derivation-required`, severity `blocker`, status `open`, with fixed message and resolution text; its source MUST be that of the first coverage entry, else line 1 of the first source with the anchor `artifact-set` (the path `.` when there is no source). Its `configuration` MUST hold the verification mode (F107-FR-036), the block of the learning binding when the binding function of the owner of learning returns one (F106-FR-027), the hash of the comment when one is given (F107-FR-034), and no other member. It MUST NOT hold the record of the judgment exchange, which the first `--next-batch` adds (F107-FR-009), so that the draft of this call is the one the oracle compares. `contract derive` MUST exit 0 when it writes the draft. The field `schema` stands in the place of the as-is field `schema_version` with the value `1.0`; the oracle compares the pair through the key-name map of the launch contract (annex X §X.8; register row DV-120).
  - origin: 011 FR-002; C-209; B-2467; B-2487; B-2488; B-2490
  - disposition: ported (B-2467, B-2487, B-2490); translated (B-2488)
  - test: PT-107-011FR002-*; PT-107-C-209-*; PT-107-C-213-*
  - divergence: DV-066; DV-120

- **F107-FR-006**: In compatibility output (annex G §G.2; always under the `parity` profile) `contract derive` MUST print its draft to standard output by default, as the baseline does. In default output, without `--output`, it MUST write the draft under `pipeline:<pipelineId>:contract` and MUST print the one product line of `contracts/commands.md` that names it: the draft holds the text of every task, and it MUST never reach a host (F107-FR-039). With `--output PATH` it MUST write the draft to that file in both output modes. A file MUST be written atomically (a temporary name, forced to disk, renamed) and with its parent directories created. The draft MUST be written with sorted keys, an indent of two, non-ASCII characters unescaped and a final line end. Any error of reading or of value during derivation MUST end with exit 2.
  - origin: C-210; C-211; C-212; B-2469; B-2473; B-2474
  - disposition: translated (B-2469); ported (B-2473, B-2474)
  - test: PT-107-C-210-*; PT-107-C-211-*; PT-107-C-212-*; CT-107-17
  - divergence: DV-066

- **F107-FR-007**: The inventory MUST read tasks, phases and the hash that ignores checkboxes only through the canonical spec model. It MUST NOT parse a task list by a grammar of its own. A task list that the as-is grammar of mixture-of-loops could not read but the canonical model reads MUST be inventoried.
  - divergence: DV-060
  - parity: not used (no switch; the difference is a waiver for the scenario `tasks-unreadable-by-old-grammar` of FX-32)
  - test: CT-107-1
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F107-FR-008**: The inventory MUST act as a verification-plan source, with the operations `discover`, `obligations` and `conflicts` of annex C §C.9, and MUST pass the conformance suite of EP-07. It MUST report only commands that a file declares: the verification-commands document, or commands written literally in the plan or the task list. Each command MUST keep its provenance, phase, order, working directory, environment, time limit and source text. This source reads repository text, so it MUST report no declared reads, writes or side effects of a command: a field `reads`, `writes` or `sideEffects` in a file of the repository MUST NOT be reported as a declaration. Declared reads and writes reach the launch contract only through F107-FR-037. A command that cannot be written as a fixed argument list, and two declarations that disagree, MUST become blockers and never a guess. A phase with no declared command MUST stay explicitly empty. Derivation MUST report the counts of source declarations, normalized commands and phase mappings, so that an omission shows.
  - ep: EP-07 `specstride.verification-source/1` (implements)
  - test: CT-107-2
  - assumption: CQ-190 (repository text declares no reads and writes of a verification command)

- **F107-FR-009**: Derivation MUST expose judgment as the exchange `specstride.judgment/1`: `contract derive --next-batch` prints the next batch of judgment items of a draft; `contract derive --answer` records the answers to a batch. Both name the draft by its logical name, and the answers are arguments: the id of the batch and, for each item, its id and the id of one choice. A batch MUST be one record of `specstride.judgment/1` and MUST be at most 3,000 tokens, measured as bytes at 2.8 bytes per token (8,400 bytes). Each item MUST have an id, a kind, a source anchor, an excerpt and the list of choices it offers, each choice with an id. An excerpt MUST pass the redaction point, MUST be cut at a line end to a byte cap that is data of the product (`plan.md` gives the starting value), and MUST say when it was cut; an item with its excerpt MUST fit one batch. Every batch MUST print the number of batches that remain; a draft with no open item gives a batch of zero items with zero remaining. The items, the batch of each and the answers MUST be kept in the draft itself, in `inventory.judgment`, a field that this feature adds as annex G §G.8 allows and that the first `--next-batch` writes; no other state file holds them, so an interrupted exchange continues from the draft. The number of items MUST depend on the number of distinct questions in the sources and not on the number of tasks: obligations that the inventory settles MUST NOT become items. The total printed to the host MUST NOT grow with the size of the sources. The host MUST never need to open the sources or the launch contract.
  - divergence: DV-096
  - parity: not used (no as-is exchange; the reference has the host read the sources)
  - test: CT-107-3
  - ep: EP-01 `specstride.host/1` (implements)
  - assumption: CQ-024 (the exchange is a named part of the protocol, `specstride.judgment/1`; closed on 2026-09-30 by the owner, on the recommended answer; the spelling of the two calls is proposed here and comes from the red team of the architecture)

- **F107-FR-010**: Derivation MUST keep facts and judgment apart. Facts (paths, hashes, tasks, phases, declared commands, prerequisites) are written by the CLI. An answer of the host MUST be one of the choices of its item. A free-text answer, an answer to an item that the batch does not hold, and a second answer that differs from the one recorded MUST be refused with exit 2, and the item MUST keep the state it had. An item that the host cannot settle MUST have the choice "keep an open blocker". Every judged entry of the launch contract MUST carry provenance: who answered, through which route, and the id of the batch. The provenance MUST be kept with the answer in `inventory.judgment`, which names the coverage entries and the findings that the answer settled, and in every finding that the answer wrote (annex G §G.8); a coverage entry gains no member for it. Text of the sources inside an item MUST be framed as data, with a random boundary per call, and MUST never be parsed for control records. The kinds of item, what each asks and what an answer writes are in the table "Judgment items" under "Closed sets".
  - ep: EP-01 `specstride.host/1` (implements)
  - test: CT-107-4
  - assumption: CQ-035 (the kinds of judgment item and their choices are not fixed by the sources; this specification names four kinds, see "Closed sets"; closed on 2026-09-30 on the recommended answer)

- **F107-FR-011**: A host that declares no model MAY delegate the judgment to a harness that user configuration names. The delegation MUST go through the `completion` level of the harness port, MUST resolve the harness through the registry (discovered harnesses included), MUST be accepted from user configuration, the environment or a flag and never from project configuration or the consumer's comment, and MUST be recorded in the provenance of every answer (the route `delegated-harness` and the id of the harness). From that record the runtime shows the delegation in the digest, under the key `delegated` of the line that feature 123 prints before the digest line (annex G §G.3; F123-FR-043). The registry and the `completion` call reach this feature as a port that the command wiring hands over. Without a named harness a model-less host MUST stop at the first batch with a refusal that names the key.
  - divergence: DV-096
  - parity: unset (row 47 of annex X §X.7)
  - test: CT-107-5
  - ep: EP-02 `specstride.harness/1` (consumes)
  - status: unverified (check: one delegation through each Wave 1 harness adapter on a live call, a paid probe; verified-on: —; pin: harness versions)

#### G2 - Validation and promotion

- **F107-FR-012**: The schema of the launch contract MUST be the validator: there MUST be one schema, and validation MUST refuse everything it does not accept. The one schema is the record schema that feature 100 generates from annex G §G.8, joined by reference with the schemas of the items that this feature owns (a source, a record of the inventory, a member of `configuration`, a coverage entry, a finding, a stage with its action, its checks and its recovery); no rule MUST be stated in two of them. The `schema` field MUST equal `specstride.launch-contract/1`; a different value, and a top-level key the schema does not hold, MUST refuse the launch contract with exit 20; a top-level key that starts with `x-` is ignored, as the common rule of the record schemas says. The validator's behaviour at the baseline is the reference.
  - origin: C-218; B-2521
  - disposition: translated
  - test: PT-107-C-218-*
  - divergence: DV-059; DV-120
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

- **F107-FR-013**: Strict validation MUST check identity, roots and sources. A file that cannot be read gives `cannot read contract: <reason>`; a value that is not an object gives `contract must be a JSON object`. The id and every stage id MUST be words of lower-case letters and digits joined by single hyphens. The status MUST be `draft` or `validated`, and unless a draft is allowed it MUST be `validated`. Unless a draft is allowed, the launch contract MUST hold bootstrap provenance (`generated_by` with the member `tool` as text, and `inventory` as a record). `repository.root` and every `authorized_roots` entry MUST be absolute, and the list MUST hold at least one. The list of sources MUST hold at least one. Every source MUST have a path inside the authorized roots, a kind and a content hash of 64 lower-case hexadecimal characters; a `tasks` source MAY hold the hash that ignores checkboxes, of the same form; a duplicate path MUST be refused. A source under the learning decisions of the run MUST be refused with a message that says why and that the code is 23.
  - origin: 011 FR-004; C-218; B-2503; B-2522; B-2523; B-2524; B-2525; B-2526; B-2527
  - disposition: ported
  - test: PT-107-011FR004-*; PT-107-C-218-*

- **F107-FR-014**: Strict validation MUST check stages. A validated launch contract MUST have stages; ids MUST be unique; the kind MUST be an id of the registry of stage kinds, and an unknown kind MUST make the launch contract invalid; `depends_on` MUST be a list of text, each naming a stage that appears earlier; `cwd` MUST be given and inside the authorized roots; every stage MUST have a list of preconditions, non-empty postconditions and a list of evidence paths inside the authorized roots (a path that is a logical name follows F107-FR-026). Recovery MUST have a positive maximum of stage attempts (default 1). When it is above 1, it MUST list the exit codes to retry (a non-empty list of whole numbers), its backoff values (default: none) MUST be non-negative numbers, and its total time limit, where one is given, MUST be positive. A stage of kind `specstride` that retries exit 4 MUST declare a reason rule; the rules of the reason rule are its owner's (feature 123, item B-2532).
  - origin: C-218; B-2499; B-2528; B-2529; B-2530; B-2531; B-2533
  - disposition: ported
  - test: PT-107-C-218-*
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

- **F107-FR-015**: Strict validation MUST check the action of a stage. The argument list MUST be a non-empty list of non-empty texts with no line end and no NUL; a shell (the base name of the first argument is `sh`, `bash`, `zsh` or `dash`) followed by `-c` or `-lc` MUST be refused with `cannot execute a shell command string`; the time limit MUST be a positive whole number and defaults to 3,600 seconds. An environment value MUST be a literal text or a reference to a named variable with a flag that says whether it is required. A name that holds `TOKEN`, `SECRET`, `PASSWORD`, `API_KEY` or `PRIVATE_KEY` as a segment between underscores, in any case, MUST NOT carry a literal value: `... must use from_env; literal secrets are forbidden`. Unless a draft is allowed, a verification-commands file that the action of a stage passes (the option `--verification-commands` followed by the value, or joined to it by `=`) MUST exist and be non-empty (resolved from the working directory of the stage) and have the shape of the verification plan: an object with a non-empty list of commands, each with a unique non-empty id, positive whole `phase` and time limit, a non-empty executable, a list of text arguments (default: none) and an absolute existing working directory.
  - origin: C-218; B-2502; B-2505; B-2506; B-2507
  - disposition: ported
  - test: PT-107-C-218-*

- **F107-FR-016**: Strict validation MUST check preconditions and postconditions. The check type MUST be a member of the registry of precondition checks. `file_exists`, `dir_exists` and `json_field_equals` MUST have a path inside the authorized roots; `env_set` and `command_available` a name; `json_field_equals` also a field and a value; `command_success` an action that passes F107-FR-015 and a working directory (default `.`) inside the authorized roots. `timing` MUST be `preflight` or `stage` (default `stage`); a postcondition with timing `preflight` MUST be refused with `timing preflight applies to preconditions only`. `file_exists` on a directory, and on the state root of a feature, MUST be refused with `use dir_exists, or name a file inside it`.
  - origin: C-218; B-2500; B-2508; B-2509; B-2510
  - disposition: ported
  - test: PT-107-C-218-*
  - ep: EP-19 `specstride.stage-kind/1` (consumes)

- **F107-FR-017**: Strict validation MUST check coverage and findings. A disposition MUST be one of `mapped`, `optional`, `out-of-scope`, `unresolved`, `unsupported`. Every coverage entry MUST have a unique id, a source (path among the sources, a line above 0 and an anchor), known stage ids, a list of verification ids, a non-empty rationale and a list of evidence. Strict validation MUST reject an entry that is `unresolved` or `unsupported`; a producer that is still `unclassified` or that names `stage:<id>` of no stage; an `implementation` entry that is `mapped` with no `specstride` stage among its stage ids. A finding MUST have a unique id, a severity of `info`, `warning` or `blocker`, a status of `open`, `resolved` or `accepted`, a non-empty message and a resolution text. Any open blocker MUST be rejected with `findings[i] is an open blocker: <message>`. A prerequisite that is present, whose path no stage precondition names (a precondition of any check type that carries a path, resolved from the working directory of its stage), and that no `resolved` or `accepted` finding at its own source line explains, MUST be rejected.
  - origin: 011 FR-005; C-218; B-2501; B-2504; B-2534; B-2535; B-2536; B-2537; B-2538; B-2539
  - disposition: ported
  - test: PT-107-011FR005-*; PT-107-C-218-*

- **F107-FR-018**: Validation MUST report structural errors first, and MUST check the staleness of sources and the learning binding only when no structural error exists. The staleness verdict is that of the canonical spec model; the binding of learning is that of its owner; both MUST end validation with exit 23. The effective learned values of the binding are computed when the binding is written, at derivation, and never by validation: for each knob, phase and shape, the last entry that applies or reverts (an entry without action counts as apply) up to the bound decision, keeping only those still applied, as knob, phase and value. The rule is the owner's (F106-FR-027); this feature calls it, and its parity test pins the item it received (B-2514). The rules of the binding reach this feature as a port that the command wiring hands over, because its package may not import the package of learning.
  - origin: C-218; B-2514; B-2540
  - disposition: ported
  - test: PT-107-C-218-*
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F107-FR-019**: The canonical bytes of a launch contract MUST be its canonical record hash input of the canonical hasher: sorted keys, compact separators, non-ASCII unescaped, a final line end. The promotion stamp MUST be the logical component that promoted and the hash of the canonical bytes of the launch contract without `status` and `promotion`, computed on the contract as written on disk before any normalization. Only validation MAY write the status `validated` and the stamp. No other command, the host and the comment MUST NOT be able to.
  - origin: C-218; B-2541; B-2542
  - disposition: ported
  - test: PT-107-C-218-*
  - divergence: DV-066

- **F107-FR-020**: `contract validate --promote` MUST validate as if the status were `validated`; on success it MUST write the status `validated` and the stamp, and print `promoted to validated: <id>` on standard output only when the file was actually rewritten (not when it was already validated with a matching stamp). It MUST rewrite the file through a temporary name and a rename with an indent of two, non-ASCII characters unescaped, a final line end, and WITHOUT sorting keys, so that the key order of the input is kept: `status` keeps its place, and the stamp, removed and written again, is the last key. The stamp MUST hold the members `by` (the logical component `contract-validate` and the flag) and `sha256`. It need not force the write to disk. The launch contract is frozen once validated.
  - origin: 011 FR-006; C-233; C-235; C-236; B-2632; B-2637; B-2641
  - disposition: translated
  - test: PT-107-011FR006-*; PT-107-C-233-*; PT-107-C-235-*; PT-107-C-236-*
  - divergence: DV-006

- **F107-FR-021**: When promotion fails on an error of validation, `contract validate --promote` MUST set the status back to `draft` and remove the stamp, in the form of F107-FR-020, and print `status set back to draft: the contract does not pass strict validation` on standard error, both only when the status on disk was not already `draft`. It MUST then print `invalid launch contract:` and the errors, print `next:` hints (one for the open `semantic-derivation-required` placeholder, and one per absent prerequisite that has no open blocker at its line) and exit 20. A file that cannot be read, is not JSON or is not an object counts as a status that is not `draft`: the baseline then replaces it by a record whose only member is the status `draft`, and creates it when it is absent. This defect is preserved (Principle XVIII: no register row fixes it). Stale sources and changed learning decisions (exit 23) MUST NOT rewrite the file. `--promote` together with `--allow-draft` MUST exit 2 with a message that says that promotion is the strict check.
  - origin: 011 FR-006; C-234; C-236; B-2633; B-2635; B-2638; B-2639
  - disposition: ported (B-2633, B-2635, B-2638, B-2639); translated (011 FR-006)
  - test: PT-107-011FR006-*; PT-107-C-234-*; PT-107-C-236-*
  - divergence: DV-066

- **F107-FR-022**: `contract validate` MUST validate the launch contract and the binding of its sources. `--allow-draft` MUST validate structure without readiness for execution: it MUST skip exactly the rules that ask for the status `validated`, for the bootstrap provenance, for at least one stage, for the verification-commands file of a stage, for a disposition other than `unresolved` and `unsupported`, for a classified producer that names a stage, for a `specstride` stage behind a mapped implementation entry, for no open blocker, and for no unchecked prerequisite. `--no-source-check` MUST skip the comparison of source hashes and the check of the learning binding. On success it MUST print `valid <status> launch contract: <id>` on standard output and exit 0. On an error of validation, with or without `--promote`, it MUST print `invalid launch contract:`, the errors one per line and the `next:` hints of F107-FR-021 on standard error and exit 20. On stale sources or changed learning decisions it MUST print `stale contract sources:` and the list on standard error and exit 23. Exit codes: 0 valid; 2 promotion with a draft allowed; 20 invalid; 23 stale sources or changed learning decisions.
  - origin: C-232; C-233; C-234; B-2629; B-2630; B-2631; B-2636
  - disposition: translated (B-2629, B-2630, B-2631); ported (B-2636)
  - test: PT-107-C-232-*; PT-107-C-233-*; PT-107-C-234-*
  - divergence: DV-066

- **F107-FR-023**: The legacy spellings of mixture-of-loops MUST NOT be normalized. A stage kind, a command, an environment key, a configuration key or a coverage timing in a legacy spelling MUST be refused as unknown, with no warning line and no rewrite in memory.
  - divergence: DV-038
  - parity: not used (register row DV-038; not compared, rule N-28)
  - test: CT-107-6

- **F107-FR-024**: The relaunch budget in the launch contract MUST be named `configuration.relaunch`, with a maximum of relaunches (`max_relaunches`, a whole number from 0 to 5, default 2) and wall-clock seconds (`wall_clock_seconds`, a positive number); a member other than these two MUST be refused. It applies to every mode. The old name `configuration.auto` MUST NOT be accepted; the oracle compares the two names through the key-name map. The five configuration keys that the baseline writes and no component reads MUST NOT be written.
  - divergence: DV-055; DV-061
  - parity: mapped (key-name map of annex X §X.8)
  - test: CT-107-7

- **F107-FR-025**: The values of the relaunch budget (the maximum of relaunches and the wall-clock seconds) MUST lie within the ceilings of user configuration (`supervise.maxRelaunches`, `supervise.wallClockSec`), and validation MUST fail when they do not. The wall-clock seconds MUST also not exceed the bound that the stages themselves declare: the sum over the stages of maximum stage attempts times time limit plus every backoff, times the maximum of relaunches plus one; validation MUST name the bound it found exceeded. Derivation MUST write the block only when the resolved value of one of the two keys differs from its default (2 relaunches; the bound of the stages), with the resolved values, and MUST omit it otherwise. The as-is rule "unless the request or the sources justify a departure from the default" asked a judgment of the host, which the CLI does not make. Derivation MUST never widen a budget to make a failing pipeline finish: a value above the default MUST come from user configuration, the environment or a flag, and never from the comment (F107-FR-035).
  - parity: unset (row 48 of annex X §X.7)
  - test: CT-107-8

- **F107-FR-026**: The launch contract and the launch bundle MUST be stored under the logical names `pipeline:<pipelineId>:contract` and `pipeline:<pipelineId>:bundle:<hash>`, and the launcher under `pipeline:<pipelineId>:launcher`. The as-is rule "the artifact directory is beside the launcher; a launcher inside a directory of that name uses that directory" MUST NOT be carried. A stage postcondition or evidence path that names the state of a feature MUST name it by logical name, and the state directory name of the as-is systems MUST NOT be resolved. A path of the launch contract that is a logical name of the state layout (annex B §B.5) MUST be resolved through the layout, by validation and by the stage executor alike, and the rule of the authorized roots (F107-FR-014, F107-FR-016) does not apply to it; a logical name that the layout does not hold MUST be refused. A `file_exists` check on the logical name of a directory is the case that F107-FR-016 refuses.
  - origin: C-216; C-218; B-2497; B-2519
  - disposition: translated
  - test: PT-107-C-216-*; PT-107-C-218-*
  - divergence: DV-006; DV-036

#### G3 - Rendering, launcher, launch bundle

- **F107-FR-027**: `contract render` MUST validate the launch contract strictly again, MUST require a promotion stamp that matches the contract as written on disk (checked before any normalization), and MUST publish the launch bundle and write the launcher. On success it MUST print `rendered <output>` and then `bundle <bundle>` on standard output and exit 0. It MUST exit 23 with `stale contract sources:` and the list when a source changed, and exit 20 with `cannot render launcher: <reason>` for an invalid launch contract, a missing or mismatched stamp, an edited launcher, an inconsistent bundle, a missing resource or a failed write. `--contract` and `--output` MUST be given; a usage error exits 2. The order MUST be that of the baseline: validation (which ends with 20 or 23), then the stamp, then the check of an existing launcher, then the launch bundle, then the launcher.
  - origin: 011 FR-008; C-219; C-221; C-223; C-224; B-2543; B-2545; B-2546; B-2551; B-2554
  - disposition: ported (011 FR-008, B-2545, B-2546); translated (B-2543, B-2551, B-2554)
  - test: PT-107-011FR008-*; PT-107-C-219-*; PT-107-C-221-*; PT-107-C-223-*; PT-107-C-224-*
  - divergence: DV-066

- **F107-FR-028**: `contract render` MUST refuse to overwrite a launcher that is edited or that was not generated, and MUST leave it unchanged, unless `--replace-edited` is given. A launcher is edited when its own content hash does not match its marker; a file without the marker was not generated.
  - origin: 011 FR-008; C-220; B-2544
  - disposition: translated
  - test: PT-107-011FR008-*; PT-107-C-220-*
  - divergence: DV-066

- **F107-FR-029**: The launch bundle MUST be content-addressed: its address MUST be the first 20 hexadecimal characters of the hash of the canonical bytes of the promoted launch contract. It MUST hold the canonical launch contract, the implementation artifacts that execute it, and a manifest that lists every other file of the bundle with its content hash. The hash of the launch bundle, which the launcher and the launch record name, MUST be the content hash of the manifest. It MUST be published from a temporary name, forced to disk, and renamed into place. An existing bundle MUST be reused only when its launch contract hashes to the contract hash; otherwise render MUST fail with `content-addressed bundle is inconsistent`. Self-consistency of hashes MUST be asserted; the oracle does not compare hashes over implementation bytes.
  - origin: 011 FR-009; C-222; C-224; B-2547; B-2552
  - disposition: translated
  - test: PT-107-011FR009-*; PT-107-C-222-*; PT-107-C-224-*
  - divergence: DV-008

- **F107-FR-030**: The launcher MUST be a file that the operator can see and run, written atomically with the mode `0755`, and its parent directory created. It MUST start with the interpreter line of the product's runtime and hold a marker line that names the product, the renderer version and the hash of the launch contract, and a line with the hash of the launcher's own text computed with that hash replaced by a fixed placeholder. Its body MUST name the launch bundle by its logical name, which the product resolves through the state layout, and by the hash of the launch bundle (F107-FR-029), and MUST pass every argument through. The as-is path of the bundle relative to the launcher is not carried, because the bundle lies in the control plane and the launcher in the working tree (F107-FR-026). It MUST NOT be a Bash script. The oracle compares it as a logical record: marker present, hash valid, reference to the launch bundle resolves, arguments passed through.
  - origin: 011 FR-010; C-222; C-223; C-224; B-2548; B-2549; B-2550; B-2553
  - disposition: translated
  - test: PT-107-011FR010-*; PT-107-C-222-*; PT-107-C-223-*; PT-107-C-224-*
  - divergence: DV-054; DV-008

- **F107-FR-031**: The hash of the launch bundle and the hash of the launcher MUST be verified at every start of the launcher, of the pipeline entry and of the runtime root, a relaunch included, before any launch check of the pipeline and before any stage. The check MUST assert four things: the launcher's own hash matches its marker; the manifest hashes to the hash of the launch bundle that the launcher names; every file of the bundle hashes to its entry in the manifest; the launch contract in the bundle hashes to the address. A mismatch MUST refuse the start with exit 20 and one line that names the logical name and says which of the two failed; nothing runs. Through `launch`, the launch check `launcher-intact` of feature 123 refuses an edited launcher first, with its own reason and the code of a refusal of `launch` (annex G §G.4); the check of this requirement stands behind it and is the only one for the launch bundle.
  - test: CT-107-9
  - status: unverified on macOS (check: the seeded edits of SC-004 on a macOS runner; verified-on: —; pin: runner version)

#### G4 - Modes, the comment, declared scopes

- **F107-FR-032**: `launch` MUST launch by default. The modes MUST be `run` and `dry-run`, given by the argument of `launch`. An explicit mode MUST beat prose in the comment, and a refusal in the comment MUST beat an invitation: a comment that refuses the run gives `dry-run`, and no comment turns `dry-run` into `run`. The host reads the comment and passes the mode as the argument, saying that the comment selected it (F107-FR-035); the CLI MUST NOT read prose, and the mode MUST NOT be chosen from prose of the request outside the comment. The as-is names MUST map: `generate` to `dry-run`, `run` and `auto` to `run`. An unknown mode MUST withhold the launch: `launch` refuses with the reason `unknown-mode` and the code of a refusal (annex G §G.4), and no launch record is written.
  - divergence: DV-009
  - parity: mapped through the mode map (row 37 of annex X §X.7)
  - test: CT-107-10

- **F107-FR-033**: `launch` MUST NOT derive. In both modes the launch contract is derived, judged, validated, promoted and rendered by the launch-contract commands that the host skill calls before it (annex G §G.1; F113-FR-002); a derivation with judgment items cannot end inside one call. In the mode `dry-run`, `launch` MUST validate the promoted launch contract again with the source check, report what would be launched (pipeline id, features, stages with their time limits, the verification mode with its reason, the comment and what it changed, the launch checks evaluated without launching, and the dry-run plan of the pipeline entry, F123-FR-005) and stop with exit 0. It MUST start no detached runtime, no engine, no harness and no stage action, and MUST write no launch record, lease, process registry entry, event, run record or comment record. A launch contract that is absent, a draft or invalid MUST end `dry-run` with exit 20 and a `next:` line that names `contract derive`; stale sources with exit 23. A launch check that would refuse MUST be a line of the report and MUST NOT change the exit code. The launch-contract commands that ran before MAY have written the launch contract, the launcher and the launch bundle, as `generate` did.
  - divergence: DV-009
  - parity: mapped through the mode map (row 37 of annex X §X.7)
  - test: CT-107-11
  - assumption: CQ-037 (a `dry-run` writes no launch record; closed on 2026-09-30 on the recommended answer, and annex B §B.7 now says so)

- **F107-FR-034**: The consumer's comment MUST be passed to the CLI verbatim as one argument, `--comment`, of `contract derive` and of `launch`. The hash MUST be taken over the text as typed. `contract derive` is the first command that reads the repository: it MUST record the hash in the draft (`configuration.comment`) before it prints anything, so that the comment is bound before any repository text reaches the host. `launch` MUST compare the hash of the comment it is given with the hash in the promoted launch contract, and MUST refuse with the reason `comment-changed` and the code of a refusal (annex G §G.4) when they differ, or when one side has a comment and the other has none; a relaunch carries the hash of the first launch and is not compared. In the mode `run`, `launch` MUST keep the comment under the logical name `launch:<launchId>:comment` (annex B §B.5) word for word after it passed the redactor, with no other change (F100-FR-229), and MUST hand the hash to the launch record, which MUST hold only the hash. Every form of the comment that is printed or recorded in an event, a digest or the launch contract MUST pass the redactor and be cut to a size cap.
  - divergence: DV-097
  - parity: not used (no as-is comment; the profile passes none)
  - test: CT-107-12
  - assumption: CQ-038 (the comment is kept under `launch:<launchId>:comment`, annex B §B.5; closed on 2026-09-30)

- **F107-FR-035**: The comment MAY narrow or steer: it MAY select among options that validation accepts, and only among the members of the closed set "Options a comment may select": fewer features in scope (`features`), a lower relaunch budget (`relaunch`), the learning mode `off` or `suggest` (`learning`), and the mode `dry-run` (`mode`). The host reads the comment, sets the option by its ordinary argument, and names the option with `--comment-selects <option>` on the same call: `contract derive` for the first three, `launch` for `mode`. `--comment-selects` without `--comment` MUST be refused. For a named option the CLI MUST check that the value narrows: every feature in scope is a candidate of F107-FR-002; the budget is at or below the default; the learning mode is `off` or `suggest`; the mode is `dry-run`. A value that widens MUST be refused (exit 2 of `contract derive`; the code of a refusal of `launch`) and nothing MUST be written. The comment MUST NOT bypass a launch check, the terms gate or a budget, because no flag for that exists; it MUST NOT widen scope or spend, change the audience, or add a declared scope. The launch contract MUST record, under `configuration.comment`, the hash of the comment and what was changed because of it: one entry per named option, with the option and the value in force. The event `pipeline.started` MUST show the comment (redacted and cut) and what it changed, and the digest its hash and what it changed: the runtime reads both from the comment record and from the launch contract and shows them under the keys `comment` and `changed` of the line before the digest line (annex G §G.3; F123-FR-043). The selection of `dry-run` is shown in the report of `dry-run`, because that mode has no event and no digest.
  - divergence: DV-097
  - test: CT-107-13

- **F107-FR-036**: Derivation MUST state which verification mode it sets and why, and MUST record it in `configuration.verification`. It MUST set `required` wherever commands are declared. Where no command is declared anywhere, it MUST set the mode that configuration resolves (default `required`, ruling K1) and say so. It MUST NOT invent a command. The members are those of annex X §X.6 row 52. The reason MUST be a member of the closed set "Reason of the verification mode": `declared` when the inventory holds at least one declared command, `configured` otherwise, with the source of the configured value. `contract derive` prints it and the report of `dry-run` prints it; it is not stored, because it follows from the inventory.
  - divergence: DV-097
  - parity: not used (as-is derivation sets no mode)
  - test: CT-107-14

- **F107-FR-037**: The promoted launch contract MAY carry the consumer's declarations of write scopes for tasks marked `[P]`, keyed by task id, and declared reads and writes of verification commands, under `configuration.scopes`, each with its source. They MUST be validated as any content (task ids that exist, paths inside the authorized roots, no path that names the control plane). They MUST enter derivation only from user configuration, the environment or a flag, with that provenance recorded, and never from repository text, an answer to a judgment item or the comment. The key of the write scope of a task is `loop.parallel.scopes.<taskId>` (feature 142; row 93 of annex X §X.7); for the reads, the writes and the side effects of a verification command the keys are `verification.scopes.<commandId>.reads`, `.writes` and `.sideEffects` (feature 110). Validation MUST refuse a declaration without that provenance. A verification command that has no declaration with that provenance is undeclared, and an undeclared command runs alone, one after the other (ruling P11). The schema MUST keep `depends_on` and accept an optional list `stages[].writes[]`, validated and unused. Only parallel units and verification MAY use them; nothing else MUST read them.
  - parity: unset (used only with row 20 on; no fixture declares one)
  - test: CT-107-15
  - divergence: DV-097
  - assumption: CQ-190 (declared reads and writes never come from repository text)

- **F107-FR-038**: With parallel units on, the report of `dry-run` MUST show the parallel plan (per feature: groups, tasks made serial with the reason, the ceiling under equal task cost) exactly once: the plan is part of the dry-run plan of the pipeline entry, which prints it (F123-FR-006), and this feature MUST NOT print a second one. With parallel units off it MUST print no line about it.
  - parity: off (row 20 of annex X §X.7)
  - test: CT-107-16

- **F107-FR-039**: The output of the three launch-contract commands and of `launch` MUST be terse. It MUST name state by logical name, MUST accept a logical name wherever an argument names the launch contract, the launcher or the launch bundle (a host names no path of the product's state), MUST NOT echo repository text into default output (a message refers to a source by path and line, never by its text; the judgment excerpt is the one exception and is framed as data), and MUST offer `--json`. The lines that have no as-is equivalent MUST be product lines of annex G §G.3, with the labels and keys of `contracts/commands.md`, and MUST NOT be printed under the `parity` profile (F100-FR-176). Its byte size for the host MUST stay inside the limit that annex G §G.5 gives.
  - test: CT-107-17

#### G5 - Added after the cross-feature review

- **F107-FR-040**: Every error of the validation of a launch contract MUST belong to exactly one error class of the closed set "Error classes of validation" (ten members, the validators of the baseline; annex X §X.6 row 274). Validation MUST NOT report an error without a class, and an error that fits no class MUST make the build fail and MUST NOT be given a new class at run time. The `--json` form of `contract validate` and of `contract render` MUST name the class of each error; the default lines MUST stay those of F107-FR-013 to F107-FR-022 and F107-FR-027 and MUST NOT print the class. Every class ends with exit 20. Stale sources and changed learning decisions are not error classes: they end with exit 23 (F107-FR-018). The scenarios `FX-33/invalid-<class>` of the oracle are one per member.
  - test: CT-107-18
  - assumption: CQ-194 (the error classes are the ten validators of the baseline; closed on 2026-09-30 on the recommended answer)

#### G6 - Added after the analyze run of 2026-09-30

- **F107-FR-041**: The CLI MUST complete the draft, and nothing else MUST write a stage, a coverage entry or a finding of a launch contract: at the baseline the host wrote them by hand (register row DV-096). Completion MUST happen in the `contract derive --answer` call that records the last open answer, and in the first `--next-batch` call when the draft holds no judgment item; until then the draft keeps its empty list of stages and its open bootstrap finding. Completion MUST be a pure function of the draft, the answers and the resolved configuration, so that equal inputs give equal bytes. It MUST write:
  (a) one stage of kind `specstride` per feature in scope, in the order of the features, each depending on the stage before it. Its id is `run-` followed by the feature slug under the id rule of F107-FR-003, made unique by a numeric suffix. Its working directory is the repository root. Its action and its action on resume are the fixed argument lists that start and resume the engine on the task list of the feature, built only from options that the stage kind accepts (EP-19 `validate`), with the verification mode of F107-FR-036 and, where (c) wrote one, the verification-commands document. Its environment holds the literals of the learning binding that F106-FR-028 asks for, and nothing else. Its recovery is one stage attempt (the relaunch budget is the means for a transient, F107-FR-025); its time limit is the resolved value of `derive.stageTimeoutSec` (default 86,400 seconds). Its postconditions and its evidence name the state of the feature by logical name (F107-FR-026), and the postconditions are never empty;
  (b) one precondition per prerequisite whose answer is `mapped`: a check `file_exists`, or `dir_exists` where the path is a directory, with the timing `preflight`, on the stage of the feature whose source names the prerequisite, and on the first stage when the source belongs to no feature. An absent prerequisite gets no precondition in the place of a blocker;
  (c) the verification-commands document of each feature that has at least one declared command with a phase, under `feature:<slug>:verification:commands` (annex B §B.5), in the shape of F105-FR-016: the commands of F107-FR-008 in their declared order, each with its phase, and no command that no file declares;
  (d) the coverage: the entry of an unticked task that stands in a phase gets the producer `stage:<id>` of the stage of its feature, the disposition `mapped` and that stage id (CQ-036); the entry of a ticked task that stands in a phase gets the producer `existing`, the disposition `mapped` and that stage id; the verification ids of a task entry are the ids of the commands of its phase; a task in no phase is settled by its item. One entry of kind `prerequisite` per prerequisite candidate and one of kind `verification` per declared command are added, with the id rule of F107-FR-004 (the anchor in the place of the task id) and the values that the table "Judgment items" gives for their answers;
  (e) the findings that the answers ask for, each with the provenance of F107-FR-010, and the bootstrap finding `semantic-derivation-required` with the status `resolved` and a resolution that names the component.
  Completion MUST NOT write the status `validated` (F107-FR-019). A draft whose answers keep an open blocker is complete and stays a draft: promotion refuses it (F107-FR-021). The report of `dry-run` prints the time limit of each stage.
  - divergence: DV-096
  - parity: not used (no as-is writer: the host wrote these entries)
  - test: CT-107-19
  - ep: EP-19 `specstride.stage-kind/1` (consumes)
  - assumption: CQ-036 (tasks are settled by fact; closed on 2026-09-30 on the recommended answer). The rules (a) to (e) are the rules of the derivation guide of the baseline, stated for the CLI; the owner may overrule each (`research.md`, rows 18 to 20)

- **F107-FR-042**: `contract derive` MUST take `--learning-mode off|suggest|apply` (default `off`) and `--applied-file <path>`. The default of `--applied-file` MUST be the decision log of learning of the feature in scope when exactly one feature is in scope, and none otherwise. Derivation MUST call the binding of the owner of learning (F106-FR-027) with the mode and the log, and MUST write the block `configuration.learning` it returns, or no block when it returns none. Every stage of kind `specstride` MUST then declare, in its action and in its action on resume, the learning mode and the bound of decisions of the block. When the mode `apply` was asked and no block results, derivation MUST write the mode `suggest` in the stages, and MUST print one line on standard error that names the reason: there are no decisions to bind (F106-FR-033). Derivation MUST NOT write `apply` without a block.
  - test: PT-106-C-210-derivation-options (the test of the owner of learning, `specs/106-learning/tasks.md` T042; this requirement carries no `origin:`, because the traceability files assign cluster C-210 to feature 106)

### Key Entities

- **Launch contract**: pipeline data of schema `specstride.launch-contract/1`: sources with hashes, inventory, configuration, coverage, findings and stages. Status `draft` or `validated`. Only validation promotes.
- **Source**: one input file with kind, content hash, line count, and for a task list the hash that ignores checkboxes.
- **Coverage obligation**: one entry of `coverage`: id, source with line and anchor, kind, timing, producer, disposition, stage ids, verification ids, rationale, evidence.
- **Finding**: an entry with severity, status and resolution; for a judged item, the provenance of the answer.
- **Judgment item and batch**: a question the inventory cannot settle, with the choices it offers; a batch is at most 3,000 tokens. Items, batches and answers live in the draft, in `inventory.judgment`.
- **Stage**: one step of the pipeline, written by the CLI when it completes the draft: id, kind, dependencies, working directory, action, action on resume, preconditions, postconditions, recovery, evidence.
- **Verification-commands document**: the declared commands of one feature with their phases, written by derivation into the control plane and passed to the stage of that feature.
- **Promotion stamp**: the proof that validation promoted this launch contract.
- **Launcher**: the generated file the operator runs, with a marker and the hash of its own text.
- **Launch bundle**: the content-addressed directory of the canonical launch contract, the artifacts that execute it and the manifest of their hashes; the hash of the launch bundle is the hash of the manifest.
- **Comment**: the consumer's optional text, kept word for word after redaction at launch, with the hash of the text as typed, which derivation records first.
- **Error class**: the one member of the closed set of ten that an error of validation belongs to.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F107-SC-001**: Derivation fits the host. On a synthetic feature of at least 200 tasks, 100 per cent of the judgment batches are at most 8,400 bytes (3,000 tokens at 2.8 bytes per token), and the total printed to the host differs by less than 5 per cent from that of the same feature reduced to 20 tasks.
- **F107-SC-002**: The comment is recorded. In 100 per cent of runs launched with a comment, the events and the digest show the comment and what it changed; in 100 per cent of the seeded comments that ask to skip a check, the launch checks, the terms gate and the budgets are the same as in a run without a comment.
- **F107-SC-003**: `dry-run` launches nothing. In 100 per cent of executions of `launch` in the mode `dry-run` no detached runtime, engine, harness or stage action starts, and the number of launch records, leases, events, run records and comment records written is 0.
- **F107-SC-004**: Edits are refused. In 100 per cent of seeded edits of the launch contract inside the launch bundle, of another file of the launch bundle, of the launcher or of a source, between rendering and launch and before every relaunch, the start of the launcher is refused with exit 20 (23 for a source) and nothing runs; through `launch` the refusal is that of the launch check that finds the edit first.
- **F107-SC-005**: Only validation promotes. Of the launch contracts that reach a launcher, 0 lack a matching promotion stamp; in 100 per cent of seeded hand-typed `validated` statuses render refuses.
- **F107-SC-006**: Parity. The families FX-32, FX-33 and FX-34 read `equal` or `waived` (with the register row) on 100 per cent of their scenarios under the `parity` profile.
- **F107-SC-007**: Verification is preserved. In 100 per cent of fixtures with declared commands the derived mode is `required`, with its reason; the number of commands in a derived launch contract that no file declares is 0.
- **F107-SC-008**: Coverage is complete. For 100 per cent of fixtures the number of coverage entries equals the number of tasks plus the number of other obligations found (the prerequisite candidates and the declared commands of the inventory), and no entry is left `unresolved` in a validated launch contract.
- **F107-SC-009**: Supervision values are bounded. In 100 per cent of seeded launch contracts whose relaunch budget exceeds a ceiling or the bound of the stages, validation fails and names the bound.

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-01 | `specstride.host/1` | implements (the derivation half of the CLI protocol) | The judgment exchange |
| EP-02 | `specstride.harness/1`, `descriptorVersion: 1` | consumes | Delegated judgment through the `completion` level |
| EP-03 | `specstride.spec-format/1` | consumes | The inventory reads the canonical spec model; hashes and staleness |
| EP-07 | `specstride.verification-source/1` | implements | The inventory of the launch contract is a verification-plan source; it passes the conformance suite of the point |
| EP-19 | `specstride.stage-kind/1` | consumes | Validation asks the registries for stage kinds and precondition checks; completion builds a stage only from what its kind accepts |

This feature owns no extension point. It owns two contents: the launch-contract schema and the launch bundle format. EP-04 is not consumed here: the parallel plan that a `dry-run` shows is printed by the pipeline entry (F123-FR-006; F107-FR-038).

## Contracts of feature 100 used

| Interface contract | Version | Where |
|---|---|---|
| Launch-contract schema | `specstride.launch-contract/1` | Annex G §G.8, F100-FR-190, F100-FR-191 |
| Judgment exchange | `specstride.judgment/1` | Annex G §G.9, F100-FR-192 |
| CLI protocol, the two output modes, line grammar, exit codes per command (0, 2, 20, 23; the codes of `launch`) | protocol 1 | Annex G §G.1 to §G.4; annex F §F.8 |
| Product lines `[SPECSTRIDE-REFUSE]` and `[SPECSTRIDE-DIGEST]` (keys `comment`, `changed`, `delegated`) | — | Annex G §G.3; the second is printed by feature 123 (F123-FR-043) |
| Token budgets | — | Annex G §G.5 (one batch, 3,000 tokens) |
| Canonical spec model, spec-format adapter | `specstride.spec-format/1` | Annex C §C.7 |
| Verification-plan source | `specstride.verification-source/1` | Annex C §C.9 |
| Stage kind and precondition check | `specstride.stage-kind/1` | Annex F §F.7 |
| Canonical hasher | — | Annex X §X.5; the rules of the operations: F104-FR-021 to F104-FR-025 |
| Redactor | `specstride.redaction/1` | Annex X §X.4 |
| State layout, logical names, launch record | `specstride.layout/1`, `specstride.launch/1` | Annex B §B.5 (`pipeline:<pipelineId>:contract`, `:bundle:<hash>`, `:launcher`; `launch:<launchId>:comment`; `feature:<slug>:verification:commands`), §B.7 |
| Common rules of records | — | Annex B §B.4 |
| Config envelope, trust classes | `specstride.config/1` | Annex X §X.2 |
| Closed sets | — | Annex X §X.6, rows 52, 78, 79, 256 to 261, 274 |
| The `parity` profile | `specstride.profile/1` | Annex X §X.7, rows 20, 37, 38, 47, 48 |
| The record schema of the launch contract, generated | `specstride.launch-contract/1` | `contracts/schemas/launch-contract.schema.json` of feature 100; not edited by this feature |
| Normalization rules N-10, N-11, N-16, N-17, N-28; key-name map; mode map | `specstride.oracle-normalization/1` | Annex X §X.8 |
| Threats T-09, T-10, T-11, T-12, T-47 | — | Annex X §X.9 |
| Host port, capability `model` | `specstride.host/1` | Annex H §H.1 |

## Rows of the `parity` profile

This feature adds no row to a compared switch. It reads five rows of annex X §X.7: 20, 37, 38, 47 and 48.

| Switch | Key | Default | Under `parity` | Register row | Row in annex X §X.7 |
|---|---|---|---|---|---|
| Mode of the host skill | the argument of `launch` | `run` | mapped through the mode map | DV-009 | Row 37 |
| Parallel units (the plan line of `dry-run`) | `loop.parallel.units` | off | off | DV-088 | Row 20 |
| Pins of the launch contract | — | the pinnable keys | the two as-is keys only | DV-026 | Row 38 |
| Delegation of derivation judgment to a harness | `derive.judgment.harness` | unset | unset | DV-096 | Row 47 |
| Ceiling of the relaunch count and wall clock | `supervise.maxRelaunches`, `supervise.wallClockSec` | 2; derived | unset | DV-055 | Row 48 (narrowing keys of feature 110) |

## Closed sets

Stated as F100-FR-208 asks. Owner of each: 107.

| Closed set | Members | Unknown value |
|---|---|---|
| Modes of the host skill (row 78) | `run`, `dry-run` | The launch is withheld |
| Status of a launch contract (row 79) | `draft`, `validated` | The launch contract is invalid |
| Kinds of a coverage obligation (row 79) | `implementation`, `prerequisite`, `verification`, `decision`, `operation` | The launch contract is invalid |
| Dispositions of a coverage obligation (row 79) | `mapped`, `optional`, `out-of-scope`, `unresolved`, `unsupported` | The launch contract is invalid |
| Severity and status of a finding (row 79) | `info`, `warning`, `blocker`; `open`, `resolved`, `accepted` | The launch contract is invalid |
| Kinds of a source (row 256) | `constitution`, `spec`, `plan`, `tasks`, `research`, `data-model`, `quickstart`, `verification-commands`, `contract`, `checklist` | The source is refused |
| Timing of a coverage obligation (row 257) | `pipeline-start`, `before:<stage>`, `after:<stage>`, `release`, `specstride-phase:<n>`, `unclassified` | The launch contract is invalid |
| Producer of a coverage obligation (row 258) | `existing`, `stage:<id>`, `automated-policy`, `external-authority`, `unknown`, `unclassified` | The launch contract is invalid; `unclassified` is refused by strict validation |
| Kinds of judgment item (row 259) | `classify-obligation`, `settle-prerequisite`, `map-declared-command`, `resolve-blocker` | The batch is refused |
| Route of an answer (provenance) (row 260) | `host-model`, `delegated-harness` | The answer is refused |
| Source of a declaration of scope, read or write (row 261) | `user-config`, `environment`, `flag` | The declaration is refused |
| Timing of a check (row 282) | `preflight`, `stage` | The launch contract is invalid |
| Error classes of validation (row 274) | `unreadable`, `structure`, `action`, `check`, `verification-commands`, `learning`, `auto`, `open-blocker`, `unchecked-prerequisite`, `not-promoted` | The build fails; no class is added at run time (F107-FR-040) |
| Options a comment may select (row 283) | `features`, `relaunch`, `learning`, `mode` | The call is refused (F107-FR-035) |
| Reason of the verification mode (row 284) | `declared`, `configured` | The build fails: the reason is computed, never read |
| Refusals of `launch` that this feature raises (row 212) | `unknown-mode`, `comment-changed` | Refusal |
| Choices of a judgment item (row 285) | `mapped`, `optional`, `out-of-scope`, `specstride-phase:<n>`, `accepted`, `keep-blocker` | The answer is refused (F107-FR-010) |

Judgment items: what each kind asks, which choices it offers and what an answer writes. The choices are members of the closed sets above (dispositions, timings, the status of a finding), with `keep-blocker` for "keep an open blocker". Items are made when the exchange starts, at the first `--next-batch`.

| Kind | Asked for | Choices | What the answer writes (F107-FR-041) |
|---|---|---|---|
| `classify-obligation` | A task that the canonical model places in no phase | `optional`, `out-of-scope`, `keep-blocker` | The disposition, with the producer `unknown`; or an open blocker at the line of the task |
| `settle-prerequisite` | Each prerequisite candidate of the inventory | Present: `mapped`, `optional`. Absent: `optional`, `keep-blocker` | `mapped`: a precondition on a stage, and a coverage entry with the producer `existing` and the disposition `mapped`. `optional`: a finding with the status `accepted` at the line of the candidate (it gates nothing), and the disposition `optional`, with the producer `existing` when it is present and `external-authority` when it is absent. `keep-blocker`: an open blocker at that line and the disposition `unresolved`, so the launch contract stays a draft; a precondition is no substitute for it |
| `map-declared-command` | A shell candidate of the plan: is it a verification command, and of which phase | `specstride-phase:<n>` for each phase of the feature, `out-of-scope`, `keep-blocker` | A phase: an entry of the verification-commands document for that phase, and a coverage entry of kind `verification` with that timing, the producer `stage:<id>` of the stage of the feature and the disposition `mapped`. `out-of-scope`: the candidate stays a candidate, enters no document and gets no coverage entry. A chosen command that cannot be written as a fixed argument list becomes a blocker, never a guess |
| `resolve-blocker` | A blocker that the inventory finds by fact: two declarations that disagree; a verification-commands document that is not valid; a command that cannot be written as a fixed argument list | `accepted`, `keep-blocker` | `accepted`: the finding gets that status, the command stays out of the verification-commands document, and its phase keeps its other commands or stays explicitly empty. `keep-blocker`: the finding stays open |

The error classes, with what each holds. The names are those of the members of `FX-33/invalid-<class>` in the fixture catalogue of feature 141. The baseline is the contract library of mixture-of-loops at `9c88f86`.

| Class | What it holds | Baseline | Requirement |
|---|---|---|---|
| `unreadable` | The file cannot be read, is not JSON, or is not an object | lines 111 to 117 | F107-FR-013 |
| `structure` | Every rule of the body of the validator that no other class holds: schema id, unknown top-level key, id, status, bootstrap provenance, roots, sources, stages and their recovery, coverage, findings | line 656 and after | F107-FR-012, F107-FR-013, F107-FR-014, F107-FR-017 |
| `action` | The action of a stage, its action on resume, and the action of a check: argument list, shell string, time limit, environment, secret names. The three rules of the learning variables, which the baseline raises inside this validator (lines 278 to 290), belong to the class `learning` (F106-FR-028) | line 248 | F107-FR-015, F107-FR-016 |
| `check` | A precondition or a postcondition: type, fields, timing | line 293 | F107-FR-016 |
| `verification-commands` | The verification-commands file passed to a stage: present, not empty, the shape of the verification plan | line 196 | F107-FR-015 |
| `learning` | The block `configuration.learning` and the learning values of the stages, the three rules of the learning variables of an action included. The rules belong to the owner of learning (F106-FR-028, F106-FR-029); validation calls them | lines 483 and 278 to 290 | F107-FR-018 (the call) |
| `auto` | The relaunch budget. The class keeps the name of the baseline; the block is `configuration.relaunch` (F107-FR-024) | line 536 | F107-FR-024, F107-FR-025 |
| `open-blocker` | A finding of severity `blocker` with status `open` | line 932 | F107-FR-017 |
| `unchecked-prerequisite` | A prerequisite that is present, that no precondition checks and that no finding explains | line 935 | F107-FR-017 |
| `not-promoted` | Status `validated` without a matching promotion stamp. At the baseline the renderer raises it, not the validate command | line 969 | F107-FR-019, F107-FR-027 |

The verification modes are those of row 52 (owner 105). Stage kinds and check types are open registries (owner 123).

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| 011 FR-027 | Legacy `wiggum` spellings normalized with a warning | DV-038 (superseded) |
| B-2520 | The same normalization in the library (stage kind, command, environment keys, configuration key, timing) | DV-038 (superseded) |
| B-2640 | The `warning:` lines for legacy spellings | DV-038 (superseded) |

Two more behaviours of this area have no destination and are listed for completeness: 011 FR-026 (the `MOL_VIA` reminder) and B-2489 (five configuration keys written and never read) are `dropped`, register row DV-061; F107-FR-024 says that the five keys are not written.

As-is ids carried and where: 011 FR-001 in F107-FR-001; 011 FR-002 in F107-FR-005; 011 FR-004 in F107-FR-013; 011 FR-005 in F107-FR-017; 011 FR-006 in F107-FR-020 and F107-FR-021; 011 FR-008 in F107-FR-027 and F107-FR-028; 011 FR-009 in F107-FR-029; 011 FR-010 in F107-FR-030.

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify`, answered from the sources. No question was put to a person.

- Q: Does the judgment exchange belong to the CLI protocol? -> A: Yes, as `specstride.judgment/1`; feature 100 annex G §G.9 already holds the three steps. CQ-024 stays open and this feature proceeds on its recommended answer. (Source: CQ-024; R15v A-6; F100-FR-192)
- Q: What does `dry-run` do beyond `generate`? -> A: Nothing that starts a process or writes run state; it stops before the handshake. (Source: DV-009; R19 "auto versus run"; brief 107 heading 4)
- Q: What is the size of a batch? -> A: 3,000 tokens, measured in bytes at 2.8 bytes per token, that is 8,400 bytes. (Source: ruling 64; annex G §G.5)
- Q: How does the total printed stay constant as the sources grow? -> A: The CLI settles every obligation that the inventory settles; a judgment item is a question about the sources and not about a task. (Source: R17 F10 and the judgment payload check)
- Q: Who may write a declared write scope into the launch contract? -> A: Only a consumer-controlled source (user configuration, environment, flag). A declaration from repository text would widen scope from project text, against ruling 35. (Source: R29 PU-12; annex X §X.2; ruling 35)
- Q: Does `dry-run` promote and render? -> A: It derives and validates; it may write the launch contract, the launcher and the launch bundle, as `generate` did, and never a launch record. (Source: R19; F100 annex B §B.7) (Made exact on 2026-09-30: the launch-contract commands derive, validate, promote and render; `launch` in this mode validates again and writes nothing, F107-FR-033.)
- Q: Which verification mode is set where no command is declared? -> A: The mode that configuration resolves, `required` by default. (Source: ruling K1; ruling 40)
- Q: Is the old key `configuration.auto` read? -> A: No. State is greenfield and the key is renamed; the oracle maps the names. (Source: DV-055; decision 3)
- Q: How does the comment reach the digest, given that the digest line has fixed keys? -> A: In the digest evidence the digest line names, and in the default output of `launch`. Feature 100 is asked for a field. (Source: F100 annex G §G.3; T-09) (Replaced on 2026-09-30: annex G §G.3 now holds the line `[SPECSTRIDE-DIGEST]` with the keys `comment`, `changed` and `delegated`; see the session of the analyze run.)
- Q: Does `launch` in mode `run` re-derive when a validated, current launch contract exists? -> A: No. It reuses it; a stale one triggers derivation again, which the host skill announces. (Source: R19 "auto versus run", where `run` is the re-attach path)
- Q: Is a comment that names a mode read as the mode? -> A: No. The mode is an explicit argument; the comment may only select among accepted options, and a refusal in it beats an invitation. (Source: Principle XV; DV-009) (Made exact on 2026-09-30: the CLI reads no prose; the host turns a refusal in the comment into the argument `dry-run` and names the option as selected by the comment, F107-FR-032 and F107-FR-035.)
- Q: Are the unknown-value rules of the closed sets consistent with annex A F100-FR-021? -> A: Yes: unknown members of a closed set refuse the record. (Source: F100-FR-021)
- Q: Which questions could the sources not answer? -> A: Four, CQ-035 to CQ-038, listed under "Assumptions".

### Session 2026-09-30 (after the cross-feature review)

- Q: May repository text declare the reads and writes of a verification command? -> A: No. The verification-plan source reports none; they come only from user configuration, the environment or a flag, under `configuration.scopes`; a command without such a declaration is undeclared and runs alone. (Source: rulings P11 and 35; the recommended answer of CQ-190, the orchestrator's reading)
- Q: Which are the error classes of validation? -> A: The ten validators of the baseline, with the names of the fixture catalogue of feature 141. (Source: the recommended answer of CQ-194, from feature 141; the contract library at `9c88f86`)

### Session 2026-09-30 (second analyze run)

Questions that the analyze run raised, answered from the sources and from the baseline code. No question was put to a person; each answer is a reading that the owner may overrule (`research.md`, rows 18 to 28).

- Q: Who writes the stages, the settled coverage and the verification-commands document, now that the host only answers with choices? -> A: The CLI, when the last item is answered, by the rules of the derivation guide of the baseline. Integrated in F107-FR-041. (Source: DV-096; R17 F10 "the CLI ... writes the contract"; brief 107 heading 2 "the rules become behaviour here"; annex B §B.5, row `feature:<slug>:verification:commands`; F113-FR-010)
- Q: Which command receives the comment, given that derivation prints repository text before `launch` runs and that the launch contract is frozen at promotion? -> A: `contract derive` first, which records the hash before it prints; then `launch`, which compares the hash and stores the text. Integrated in F107-FR-034. (Source: threat T-09; F113-FR-002, steps 1 to 7; annex G §G.8 `configuration.comment`)
- Q: How does the CLI know what the comment changed? -> A: The host names each option it set because of the comment; the CLI checks that the value narrows and records it. Integrated in F107-FR-035. (Source: F100-FR-196 "the host skill MUST say what it changed"; F113-FR-005; Principle III)
- Q: Does `launch` derive? -> A: No. The launch-contract commands derive, and `launch` validates again. Integrated in F107-FR-033. (Source: annex G §G.1, the rows of `launch` and of the launch-contract commands; F113-FR-002)
- Q: May the draft be printed to a host? -> A: Only in compatibility output, where the oracle compares it. In default output the draft goes to its logical name and one line is printed. Integrated in F107-FR-006 and F107-FR-039. (Source: annex G §G.2; Principle XIX; R17 F6)
- Q: Where do the items, the answers and their provenance live? -> A: In the draft, in `inventory.judgment`. No state file without a logical name is written. Integrated in F107-FR-009 and F107-FR-010. (Source: annex G §G.8 "it may add fields to `inventory`"; F100-FR-051)
- Q: Who prints the parallel plan of a `dry-run`? -> A: The pipeline entry, once. Integrated in F107-FR-038. (Source: F123-FR-006)
- Q: What happens to the accidents of the baseline that the oracle can see? -> A: They are preserved and stated: the reading of fences (F107-FR-004) and `--promote` on a file that cannot be read (F107-FR-021). (Source: Principle XVIII; `bootstrap_contract.py:161-187`, `validate_contract.py:81-98` at `9c88f86`)
- Q: How does the comment reach the digest and the events? -> A: Through the keys `comment`, `changed` and `delegated` of the line that feature 123 prints before the digest line, from the comment record and the launch contract that this feature writes. The event that carries them is asked of the owner of the event catalogue. (Source: annex G §G.3; F123-FR-043)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. The divergence register is that of `consolidation.md`; this feature cites rows that exist there and asks for none.
- The canonical spec model, the canonical hasher, the registries of stage kinds and checks, the redactor and the compatibility projection exist when the fixtures that need them run.
- The staleness verdict, the learning binding, the relaunch budget bound and the reason rule of recovery are specified by their owners; this feature calls them and does not restate them.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-024 | Is the judgment exchange a named part of the CLI protocol? | Yes, `specstride.judgment/1` (closed by the owner on 2026-09-30, on the recommended answer) | F107-FR-009 |
| CQ-035 | Which kinds of judgment item exist and what choices does each offer? | Four kinds: classify an obligation, settle a prerequisite, map a declared command, resolve a blocker; each item offers only the members of the closed set it concerns, plus "keep an open blocker" | F107-FR-010 |
| CQ-036 | May derivation set the producer and disposition of a task by fact alone? | Yes: an unchecked task is work to do; its producer is the stage that implements it and its disposition `mapped`. The derivation guide of the baseline says so | F107-FR-009, F107-FR-041 |
| CQ-037 | May a `dry-run` write a launch record with the mode `dry-run`? | No; no run state is written | F107-FR-033 |
| CQ-038 | Where is the comment stored? | Beside the launch record, under the logical name `launch:<launchId>:comment` (annex B §B.5; the answer was applied there on 2026-09-30) | F107-FR-034 |
| CQ-190 | May repository text declare the reads and writes of a verification command? | No. Only user configuration, the environment or a flag, through `configuration.scopes`; without it the command is undeclared, which means serial | F107-FR-008, F107-FR-037 |
| CQ-194 | Which are the error classes of the validation of a launch contract? | The ten validators of the baseline, stated as a closed set | F107-FR-040 |

All seven questions of the table were closed in the queue on 2026-09-30, each on its recommended answer (CQ-024 and CQ-035 by the owner's own answer, the five others by the owner's blanket instruction). None is open.

The difference `schema` for `schema_version` is register row DV-120, mapped through the key-name map of annex X §X.8.

## Repairs after the cross-feature review

Dated 2026-09-30. No id was renumbered or reused.

| Requirement or place | Item | What changed |
|---|---|---|
| F107-FR-008 | W-105-03 (CQ-190) | The clause "declared reads and writes when the document gives them" left. The source reports no reads, writes or side effects from a file of the repository |
| F107-FR-037 | W-105-03 (CQ-190) | The field is named `configuration.scopes`; a command without a declaration of the allowed provenance is undeclared and runs alone. Register row DV-097 cited |
| F107-FR-040 (new) | W-141-02 (CQ-194) | The ten error classes of validation as a closed set; test CT-107-18 |
| F107-FR-034 | W-X-10; F100-FR-229 | The logical name is cited from annex B §B.5. The kept text is the comment after the redactor; the hash is over the text as typed |
| F107-FR-030 | W-X-32 | "the interpreter line of the product's runtime" in place of the name of the runtime |
| F107-FR-025 | W-110-06 | `parity:` cites row 48 of annex X §X.7 |
| Rows of the `parity` profile | W-110-06 | Default of the two ceilings: "2; derived". Rows 47 and 48 exist, so nothing is asked for |
| Clarifications, session 2026-09-29 | W-X-31 | "judgment payload check" |
| Assumptions | W-X-10; W-X-07 | CQ-038 cites annex B §B.5; the count of register rows, which was out of date, is no longer written |
| F107-FR-040 | Re-check B-8.7, pass-on (2026-09-30) | The closed set is cited as annex X §X.6 row 274; members unchanged |
| Closed sets | Re-check B-8.7, pass-on (2026-09-30) | The error classes of validation cite row 274 in place of "no row in annex X §X.6 yet; reported" |

## Repairs after the analyze run of 2026-09-30

Dated 2026-09-30, second analyze run, after the cross-feature review, the constitution patch v3.0.1 and the closure of the clarification round. One requirement is new, F107-FR-041, with the test CT-107-19; no id was renumbered or reused. The feature has 41 functional requirements and 9 success criteria. The findings and their ids are in `analyze-report.md`, "Second analyze run".

| Requirement or section | Finding | What changed |
|---|---|---|
| F107-FR-041 (new); user story 1; edge cases; Key Entities; "Judgment items" | C1 | The CLI completes the draft: stages, preconditions, the verification-commands document, settled coverage, findings, the resolved bootstrap finding. What each kind of item asks and what its answer writes |
| F107-FR-034; user story 3; commands | I1 | The comment is an argument of `contract derive`, which records its hash before it prints, and of `launch`, which compares the hash and stores the text. A difference refuses the launch (`comment-changed`) |
| F107-FR-006, F107-FR-039 | I2 | The draft is printed only in compatibility output. In default output it goes to its logical name and one line is printed. Arguments accept logical names |
| F107-FR-004; edge cases | I3 | The reading of fences is the baseline's, with its accident; an empty block and an unclosed block are not recorded; the id of an obligation is formed over the content hash of a text |
| F107-FR-005, F107-FR-012; Assumptions | K1 | `schema` stands for `schema_version`; the text of the register row and of the map entry that are missing; `generated_by` keeps the members `tool` and `version` |
| F107-FR-033; user story 4; F107-SC-003 | I4, L3 | `launch` never derives. `dry-run` validates again, reports and exits 0; exits 20 and 23 |
| F107-FR-038; "Extension points" | I5 | The parallel plan is printed once, by the pipeline entry; EP-04 is not consumed here |
| `assumption:` lines; Assumptions | I6 | The seven questions are closed; none is called open |
| F107-FR-032 | I7 | The CLI reads no prose; a refusal in the comment gives `dry-run` through the host; an unknown mode is a refusal without a launch record |
| F107-FR-013 to F107-FR-017, F107-FR-022 | I8 | Sources not empty; provenance only when no draft is allowed; an optional total time limit; `command_success`; non-empty arguments; the nine rules that `--allow-draft` skips; the lines of a failed validation and of stale sources |
| F107-FR-018 | I9 | The effective values are computed at derivation, by the rule of the owner of learning; the rules reach this feature as a port |
| F107-FR-012; "Contracts of feature 100 used" | I10 | The record schema is the generated one of feature 100; this feature adds the schemas of its items and edits no generated file |
| F107-FR-026, F107-FR-014, F107-FR-030 | I11 | A logical name in a path is resolved through the layout and is outside the rule of the roots; the launcher names the bundle by logical name |
| F107-FR-029, F107-FR-031; F107-SC-004 | I12, L3 | The hash of the launch bundle is the hash of its manifest; what the check asserts; which check refuses through `launch` |
| F107-FR-035, F107-FR-025; "Closed sets" | U1 | `--comment-selects`; four options; a value that widens is refused; the record of what changed. The relaunch block is written from the two keys of configuration |
| F107-FR-009, F107-FR-010 | U2, A1 | Items, batches, answers and provenance live in the draft (`inventory.judgment`); choice ids; answers as arguments; refused answers exit 2; the excerpt passes the redactor and has a cap |
| F107-FR-037 | U3 | The key of a task scope is named; the key of the reads and writes of a command is asked of feature 110 |
| F107-FR-020, F107-FR-021; edge cases | U4 | A final line end; the stamp is the last key and leaves on a set-back; the preserved defect for a file that cannot be read |
| Naming; `data-model.md` | U5 | The member names of the records are the baseline's |
| F107-FR-002, F107-FR-005 | U6 | The two options of the learning binding and the block it returns |
| F107-FR-011, F107-FR-035; Clarifications | C2 | The digest keys `comment`, `changed` and `delegated` of annex G §G.3; the event is asked of the owner of the catalogue |
| F107-FR-036; "Closed sets" | U1 | The reason of the verification mode is computed and printed, not stored |
| F107-FR-001, F107-FR-002, F107-FR-003 | L1 | The line count; where the hashes come from; the messages; the two null cases; the id without a hyphen at either end |
| F107-FR-008; error classes | L6 | The three operations of EP-07 and its conformance suite; the class of the rules of the learning variables |
| "Closed sets"; "Contracts of feature 100 used"; rows of the profile | L2 | Rows 256 to 261 cited; five sets without a row named; rows 47 and 48; annex B §B.4 |
| F107-SC-008 | L3 | "Other obligations" are the prerequisite candidates and the declared commands |
