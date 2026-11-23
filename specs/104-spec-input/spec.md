# Feature Specification: Spec input

**Feature Branch**: `104-spec-input` (a label: Spec Kit creates no branch in this repository; the directory is `specs/104-spec-input`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 104-spec-input: resolution of the spec when none is named; the spec formats of Wave 1 (`native`, `speckit-tasks`, `openspec-change` with the alias `openspec`) and their detection order; the one grammar owner; the canonical spec model with structured tasks; validation; ticking of task checkboxes as an operation of the model; the one hashing scheme; the staleness verdict for the spec, the plan and the task list, naming the file that changed; the public verb `spec`."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority; rulings 26, 68, 69, K3, K8, P1, P12), `architecture.md` (sections 2, 5, 14), `consolidation.md` (sections 1, 3.5, 5, 6), `feature-briefs.md` (brief 104-spec-input, sections D.5 and D.8), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182) (principles IV, VI, XIV, XVIII), research reports R1, R1v (V3), R15 (EP-03), R15v (P-10), R18, R19 (C-07, D-32), R23v (V-23), R28, and feature 100 (`specs/100-specstride/`, annexes B, C, G, X) and feature 141 (`specs/141-parity-oracle/`).

## What this feature is

Specstride works on a specification that already exists. This feature reads it. It finds the
specification when the consumer names none, decides which format it is in, reads it into one
canonical model, checks that the model is valid, ticks finished tasks in the file, and says
whether the files a run was started from have changed since.

Three systems read specifications today, each with its own parser. This feature is the one place
where a phase heading or a task line is read (principle IV). The engine, the critic, the derivation
of the launch contract, the command line, the doctor and the run view all read the model it builds.

It also owns the one hashing scheme of the product, and the staleness verdict: which of spec,
plan and task list changed, named by its logical name and its repository-relative path, and
whether the change is more than checkboxes. It does not decide when the comparison is made.

**In scope**: resolution of the spec when none is named; the three formats and their detection
order; the canonical model with structured tasks; validation; context documents; ticking;
the canonical hasher; the staleness verdict; the public verb `spec`.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| Spec bundle import, artifact selection, the bundle store, Lisa's bundle hash and its two canonicalizers | Roadmap (`deferred`, decision D-16) |
| The `chat` format; Lisa's legacy `wiggum` format | Roadmap; decision 3 (DV-036) |
| When ticking happens | 101 (after approval), 142 (after a group was applied) |
| What a stale source does to a launch contract, a render or a launch; the printing of exit 23 | 107, 123 |
| When the source hashes are compared during a run, and what a change does to the run | 102 (at launch and at resume), 103 (at every pass start), 105 (at critic start, under the `parity` profile only) |
| Reverse inventory fingerprints | 108 (it calls the canonical hasher) |
| The position at which a run resumes | 101 (derived from approval records, never by a spec-format adapter) |
| The names and defaults of configuration keys | 110 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A run starts from a Spec Kit feature that nobody named (Priority: P1)

A consumer invokes Specstride in a workspace that holds one or more Spec Kit features and gives
no spec file. The product finds the right `tasks.md`, or says exactly why it cannot and lists
what it found.

**Why this priority**: Every run starts here. A wrong pick starts a run on the wrong feature.

**Independent Test**: Run the fixtures of family FX-09 (`explicit-path`, `feature-flag`, `single-candidate`, `ambiguous-candidates`, `no-candidate`) on the port and on the reference; the exit code, output and tree are equal.

**Acceptance Scenarios**:

1. **Given** a workspace with a root `SPECS.md` and no named spec, **When** the product resolves the spec, **Then** it picks `SPECS.md`, even if a feature is named (F104-FR-001).
2. **Given** two features under `specs/` and no `--feature`, **When** the product resolves the spec, **Then** it selects nothing, prints every candidate with the two commands that disambiguate, and exits 3 (F104-FR-001, F104-FR-004).
3. **Given** `--feature` that matches no candidate, **When** the product resolves the spec, **Then** it prints the one-line "no feature/change" message and exits 3 (F104-FR-004).
4. **Given** a tasks file at `openspec/changes/<change>/tasks.md`, **When** the format is detected, **Then** the format is `openspec-change` (F104-FR-005).

---

### User Story 2 - Ticks never stop a run, and a real change does and is named (Priority: P1)

The proposer, the engine after an approval, or the runtime after a group of parallel units ticks
task boxes. The operator sometimes edits the task list on purpose. The product must tell the two
apart and name the file.

**Why this priority**: At the baseline, an operator's amendment ended 22 hours of work without a verdict (R28). A tick that stopped a run would make the same harm routine.

**Independent Test**: For a task list, tick and clear any subset of its checkboxes: the verdict is fresh. Change the text of one task: the verdict is stale and names `tasks` with its path (FX-33, `stale-sources`).

**Acceptance Scenarios**:

1. **Given** a run started from a spec, plan and task list, **When** only checkboxes of the task list changed, **Then** the verdict is fresh (F104-FR-024).
2. **Given** the same run, **When** the text of one task changed, **Then** the verdict is stale and names the task list by its logical name and its repository-relative path (F104-FR-024).
3. **Given** a changed plan and a ticked task list, **When** the verdict is asked, **Then** it names the plan only (F104-FR-024).
4. **Given** a recorded source that cannot be read now, **When** the verdict is asked, **Then** it is stale and says which source could not be read (F104-FR-025).

---

### User Story 3 - Every reader of a specification reads one model (Priority: P1)

The author of the engine, the critic, the derivation of the launch contract, the doctor or the run
view needs phases, criteria and tasks. The author reads the canonical model and writes no parser.

**Why this priority**: Two parsers drift. mixture-of-loops' own reader already read fewer files than Specstride's (defect D-32).

**Independent Test**: A static test finds no second reader of phase headings or task lines in any package; the inventory output of FX-32 comes out of the model and equals the reference's.

**Acceptance Scenarios**:

1. **Given** a `tasks.md` with tasks that carry `[P]` and story tags, **When** it is parsed, **Then** each task has id, markers, text, tick state and line (F104-FR-010).
2. **Given** a native spec whose phase has no acceptance-criteria block, **When** it is validated, **Then** the finding is the as-is message (F104-FR-015).
3. **Given** a `tasks.md` that the reference's own parser could not read, **When** the port reads it, **Then** the read succeeds and the fixture is waived under DV-060 (F104-FR-008).

---

### User Story 4 - An operator uses the `spec` verb (Priority: P2)

An operator or a script calls `specstride spec <subcommand>` to detect a format, validate a spec,
print a title or a slice, render the context, tick a phase or find the first unapproved phase.

**Why this priority**: The module's commands are matched by other programs today. The owner made `spec` a public verb (ruling 26).

**Independent Test**: The eleven subcommands on the fixtures of FX-10 give the as-is output, stream and exit code.

**Acceptance Scenarios**:

1. **Given** a valid spec, **When** `spec validate` runs, **Then** it prints the phase count and exits 0 (F104-FR-015, F104-FR-019).
2. **Given** an invalid spec, **When** `spec validate` runs, **Then** each finding is on its own line of the error stream and the exit code is 3 (F104-FR-015, F104-FR-020).
3. **Given** an unknown subcommand, **When** the verb runs, **Then** it exits 2 (F104-FR-020).

---

### User Story 5 - A new format is added without touching the core (Priority: P2)

A developer registers a sample format from the test tree. It is detected, parsed, validated, ticked
and run with no change to a core file.

**Why this priority**: The constitution (principle VI) requires that a new format never needs a change of the core.

**Independent Test**: The conformance suite of EP-03 registers the sample format and passes; a static test finds no core file that names it.

**Acceptance Scenarios**:

1. **Given** a sample format registered from the test tree, **When** its file is named explicitly, **Then** it is chosen (F104-FR-009).
2. **Given** the same format and a file that a built-in format claims, **When** detection runs, **Then** the built-in format wins (F104-FR-009).

---

### Edge Cases

- `.specify/feature.json` is not valid JSON, has no `feature_directory`, or names a directory with no `tasks.md`: resolution falls through to the candidate search without a message (F104-FR-001).
- A relative explicit path: it is resolved against the directory the command was started from, not the workspace (F104-FR-002).
- A feature value with characters outside letters, digits, dot, underscore and hyphen: the slug replaces them with hyphens (F104-FR-003).
- A task line with an empty box `[]`: the hash that ignores checkboxes does not cover it, as at the baseline; a tick of such a line is a change (F104-FR-022).
- A file with Windows line ends: the hash that ignores checkboxes reads the text with line ends taken as one form, as the baseline does (F104-FR-022).
- The task list has a phase that the plan does not mention: not an error of this feature.
- A native spec is hashed: it has one file, hashed as `spec`; it has no task list and is never ticked (F104-FR-023).
- A phase number that is not a number given to `spec title`: exit 1, the code of the baseline, where it was an uncaught error; the port exits 1 on purpose and not 70 (F104-FR-020).
- A source listed at launch is deleted later: the verdict is stale, "cannot be read" (F104-FR-025).

## Requirements *(mandatory)*

### Functional Requirements

#### G1 - Resolution and detection

- **F104-FR-001**: When no spec is named, the product MUST resolve the spec in this order: (1) `SPECS.md` at the root of the workspace, which wins whenever it exists, even when a feature is named; (2) the `feature_directory` of `.specify/feature.json` (a relative value is taken against the workspace), whose `tasks.md` is the spec, and if the file cannot be parsed, has no `feature_directory`, or names a directory without `tasks.md`, the search MUST go on to step 3 without a message; (3) the candidates `specs/*/tasks.md` and then `openspec/changes/*/tasks.md`, of which exactly one MUST be used. With several candidates and no feature, nothing MUST be selected.
  - origin: 028 FR-001; C-013
  - disposition: ported
  - test: PT-104-028FR001-resolution-order; PT-104-C-013-resolution-steps

- **F104-FR-002**: An explicitly named spec file (`-s` or `--specs`) MUST bypass resolution. A relative path MUST be taken against the directory the command was started from, captured before the product changes into the workspace; an absolute path MUST be kept. The resolved spec path MUST be made absolute and canonical before it is handed to the engine, the critic and the saved run settings. A path that is not a regular file MUST give `spec not found: <path> (pass -s FILE — any name/location)` and exit 3.
  - origin: C-006; C-013; C-009
  - disposition: ported
  - test: PT-104-C-006-explicit-spec; PT-104-C-013-launch-directory; PT-104-C-009-not-a-file

- **F104-FR-003**: `--feature` MUST select among several candidates: the first candidate whose parent directory name equals the raw, unsanitized feature value. The feature slug MUST be derived once by one rule: an explicit feature value has every character outside letters, digits, dot, underscore and hyphen replaced by a hyphen, with leading and trailing hyphens removed, and an empty result becomes `default`. Without an explicit value the slug MUST be the name of the Spec Kit feature directory or of the OpenSpec change directory; a spec inside a `.specify` project is found by walking upward from the spec's directory; a spec at the project root, or any other spec, has the slug `default`. The `spec` verb's `feature-slug` MUST answer before the spec is read.
  - origin: C-006; C-013; C-060; C-138; C-145
  - disposition: ported (C-006, C-013, C-145); translated (C-060, C-138)
  - test: PT-104-C-013-feature-selection; PT-104-C-145-feature-slug; PT-104-C-138-feature-slug
  - divergence: DV-066

- **F104-FR-004**: A failed resolution MUST exit 3 with the as-is text and no other line. With several candidates and no feature: `multiple feature specs found under <workspace> — disambiguate (nothing auto-selected):`, then per candidate its path and the two commands that would disambiguate (`-w … -s …` and `--feature …`). With a feature that matches no candidate: `spec not found: no feature/change '<feature>' tasks.md under <workspace>`, without a list of locations. With nothing found: `spec not found: no spec resolved for <workspace> (pass -s FILE — any name/location).` followed by a `tried:` list of the four locations. The reason kinds MUST be `ambiguous-candidates` and `invalid-spec` of EP-03.
  - origin: 028 FR-001; C-009; C-012
  - disposition: ported
  - test: PT-104-028FR001-not-found-listing; PT-104-C-012-resolution-messages; PT-104-C-009-exit-3
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-005**: The format MUST be detected in this order: (1) a valid explicit override, from the flag and then from configuration; (2) a path shaped `openspec/changes/<change>/tasks.md` is `openspec-change`; (3) any other file whose base name is `tasks.md`, in any case, is `speckit-tasks`; (4) content with a phase heading (`## Phase N` or `## P<N>`), a task line `- [ ] T<digit>` and no `### Acceptance criteria` heading is `speckit-tasks`; (5) content with a `## <N>. title` heading and a task line `- [ ] N.N` is `openspec-change`; (6) everything else is `native`. Detection MUST run once per run; if it fails the format MUST be `native` and no error MUST be raised. The result MUST be printed by `spec detect`.
  - origin: 028 FR-002; 002 FR-029; C-013; C-006; C-145; C-138; C-139
  - disposition: merged-with 002 FR-029 (028 FR-002); merged-with 028 FR-002 (002 FR-029); ported (C-013, C-006, C-145, C-139); translated (C-138)
  - test: PT-104-028FR002-detection-order; PT-104-C-145-detection-steps; CT-104-2
  - divergence: DV-073

- **F104-FR-006**: The explicit format names MUST be `native`, `speckit-tasks` and `openspec-change`, and `openspec` MUST be accepted as an alias of `openspec-change`. An unknown explicit format MUST be an error `unknown-format` and MUST NOT be guessed: `spec: unknown spec format: <value> (<registered names>)` and exit 3, where the names are those of the registry in registration order, and the alias is not listed. An invalid format given to a caller that reads the spec (the critic) MUST be an error with the code 3 of that caller's result.
  - origin: 028 FR-002; 002 FR-029; C-060; C-063
  - disposition: merged-with 002 FR-029 (028 FR-002); merged-with 028 FR-002 (002 FR-029); translated (C-060, C-063)
  - test: PT-104-028FR002-unknown-format; PT-104-C-063-format-invalid; CT-104-3
  - divergence: DV-073; DV-066
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-007**: The format and the feature MUST be inputs of the product: the flags `--spec-format` and `--feature`, and the keys `spec.format` and `spec.feature`, with the as-is variables `SPECSTRIDE_SPEC_FORMAT` and `SPECSTRIDE_FEATURE` as aliases (annex X §X.8). A flag MUST override the key. The resolved format MUST be handed to every later reader of the run, so that none reads the file again to detect it. The value of `spec.format` and of `spec.feature` under the profile `parity` is unset; the fixture sets its own.
  - origin: C-006; C-007; C-060; C-061; C-140
  - disposition: ported (C-006); translated (C-007, C-060, C-061, C-140)
  - test: PT-104-C-006-format-flag; PT-104-C-007-format-feature-keys; PT-104-C-061-format-default
  - divergence: DV-027
  - parity: `spec.format` unset (auto-detect); `spec.feature` unset. Not a switch; no row of annex X §X.7 is needed
  - assumption: CQ-039 (how the resolved format is handed on: the run snapshot of annex B §B.12 is the reading; annex B holds no field for it)

#### G2 - One grammar, the canonical model, validation, ticking

- **F104-FR-008**: There MUST be one grammar owner. The registry of spec-format adapters MUST hold exactly `native`, `speckit-tasks` and `openspec-change` in Wave 1; Lisa's legacy adapter and its `chat` adapter MUST NOT be registered. The engine, the critic, the derivation of the launch contract, the command line, the doctor and the run view MUST read the canonical model and MUST NOT parse a phase heading or a task line themselves. The tasks grammar of mixture-of-loops (`## Phase N:` headings; task lines `- [ ] T### [P] [US1] text`) MUST be replaced by this grammar, and the inventory output of the derivation MUST be produced from the model and MUST equal the reference's. A `tasks.md` that the old parser could not read MUST be readable.
  - origin: 028 FR-029; 002 FR-028; C-022; C-213
  - disposition: translated (028 FR-029); merged-with 028 FR-029 (002 FR-028); ported (C-022); merged-with 028 FR-029 (C-213: B-2475, B-2476)
  - test: PT-104-028FR029-one-owner; CT-104-1; PT-104-C-022-shims; PT-104-C-213-inventory-grammar
  - divergence: DV-060; DV-036; DV-119 (a lower-case `## phase N:` heading, which the grammar of mixture-of-loops read, is not a phase heading of this grammar; CQ-045)
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-009**: The spec-format port MUST offer `detect`, `parse`, `validate`, `tick` and `inputs` (annex C §C.7). `detect` MUST return whether the adapter claims a path and its `priority`. Built-in formats MUST win: the path and content rules of F104-FR-005 steps 2 to 5 come first, an added format MUST be asked after them and before the fallback `native`, and it MUST be chosen when it is named explicitly. An adapter that fails in `detect` MUST be passed over; one that fails in `parse` or `validate` MUST give `invalid-spec`. A sample format registered from the test tree MUST be detected, parsed, validated, ticked and run with no change to a core file.
  - ep: EP-03 `specstride.spec-format/1` (implements)
  - test: CT-104-4
  - assumption: CQ-040 (where an added format stands against the fallback `native`; annex C §C.7 says built-in formats win and a new format is detected where they decline)

- **F104-FR-010**: The canonical model MUST hold the format, the feature slug, the sources (kind, logical name, repository-relative path, hashes), and the phases. Each phase MUST hold number, title, section and acceptance criteria, and its tasks. Each task MUST hold its id (`T` and digits and at most one letter), its markers (the parallel marker `[P]` first, then one bracketed tag such as a story tag; any further bracketed text stays in the text), its text, whether it is ticked, its line, and the file it came from. An unknown marker MUST be kept as text. The four-field view (number, title, section, criteria) that the oracle pins MUST be a projection of the model. `parse` MUST be a pure function of the files.
  - origin: C-213
  - disposition: merged-with 028 FR-029
  - test: PT-104-C-213-task-grammar
  - ep: EP-03 `specstride.spec-format/1` (implements)
  - divergence: DV-060

- **F104-FR-011**: The `native` grammar MUST be the as-is grammar. A phase heading is `## Phase <digits>`, case-sensitive, at column 0, with spaces or tabs as separators. The title is the heading text after the number with a leading run of spaces, hyphens, em dashes and colons removed. A phase runs from its heading to the next level-2 heading or the end of the file, trailing blank lines kept. Its criteria block starts at a heading `### Acceptance criteria` (case-sensitive prefix) and ends at the next line that starts with `###`; the criteria are the checkbox lines inside it. The checkbox syntax of every format is: optional indent, `-`, optional spaces, `[ ]`, `[x]`, `[X]` or `[]`, then the text.
  - origin: C-145; C-142
  - disposition: ported
  - test: PT-104-C-145-native-grammar; PT-104-C-142-native-errors

- **F104-FR-012**: The `speckit-tasks` grammar MUST be the as-is grammar. Explicit headings `## Phase <digits>` with an optional colon and free title text win; the priority form (`## P<N>` or `## p<N>`, optional hyphen, em dash or colon) MUST be used only when no explicit phase exists. The criteria of a phase are every checkbox line with non-empty text anywhere in its section, under any `###` heading. In the priority form only sections that hold checkboxes are phases, numbered contiguously in document order from the first priority number, repeated priorities are valid, the title keeps the priority label, and the level-2 sections after the last such group are appended to every phase's section as shared constraints. Tick handling is in F104-FR-017.
  - origin: C-145; C-142
  - disposition: ported
  - test: PT-104-C-145-speckit-grammar; PT-104-C-142-speckit-errors

- **F104-FR-013**: The `openspec-change` grammar MUST be the as-is grammar. A phase heading is `## <digits>` with an optional `.` or `)` and a title. A criterion is a checkbox followed by a dotted id `N.N[.N…]`, recorded as `<id> <text>`; a checkbox without such an id is not a criterion. The name `openspec` MUST select this grammar.
  - origin: C-145; C-142
  - disposition: ported
  - test: PT-104-C-145-openspec-grammar; PT-104-C-142-openspec-errors
  - divergence: DV-073

- **F104-FR-014**: The model MUST give access to a phase by number: the list of phase numbers, the title, and the section. The raw section (`spec slice`) MUST be the unstripped text followed by one newline; the section that callers such as the critic use MUST be stripped. A phase that does not exist MUST give an empty section, title or shape and no error. A title read from a section alone MUST be read as native, then `speckit-tasks`, then priority, then OpenSpec form. The criteria heading shown to agents MUST be `Acceptance criteria (the phase spec)` for native, ``Tasks to complete (each `- [ ]` is a required deliverable)`` for `speckit-tasks`, and ``OpenSpec tasks to complete (each `- [ ]` is required)`` for `openspec-change`.
  - origin: C-138; C-145
  - disposition: translated (C-138); ported (C-145)
  - test: PT-104-C-138-phase-access; PT-104-C-145-slice-title
  - divergence: DV-066

- **F104-FR-015**: `validate` MUST return findings, and a spec MUST be valid only when there are none. The findings are, with the as-is texts: `spec has zero phases (need at least one "## Phase <N>")`; `phase <n> (<raw heading text>) has no "### Acceptance criteria" block` (a block empty of checkboxes is valid); `duplicate phase number: <n>`; `non-contiguous phases: <b> follows <a> (must ascend by 1)` (the first number is free); for `speckit-tasks`, `tasks.md has zero phases (need task-bearing "## Phase <N>:" or "## P<N>" sections)` and `phase <n> (<title>) has no task checkboxes ("- [ ] T### ..." lines)`; for `openspec-change`, `OpenSpec tasks.md has zero phases (need task-bearing "## <N>. <title>" sections)` and `phase <n> (<title>) has no OpenSpec task checkboxes ("- [ ] N.N ..." lines)`. Native errors MUST come per phase in scan order first, then duplicates and contiguity. On success the phase count is reported. A missing file MUST give `spec not found: <path>`.
  - origin: C-142; C-145; C-009; C-022; C-138; C-141
  - disposition: ported (C-142, C-145, C-009, C-022); translated (C-138, C-141)
  - test: PT-104-C-142-validation-errors; PT-104-C-009-invalid-spec; PT-104-C-022-validate-shim; PT-104-C-141-validate-exit
  - divergence: DV-066

- **F104-FR-016**: The model MUST offer the context documents of a spec as read-only background. Native has none. For `speckit-tasks`, in order: the constitution (only when the spec is inside a `.specify` project), spec, plan, `contract:<stem>` (sorted), data-model, research, quickstart, `checklist:<stem>` (sorted), each only when the file exists. For `openspec-change`, in order: `proposal`, `delta-spec:<name>` (recursive, sorted), `design`, then `current-spec:<name>` for each delta that has a matching file under `openspec/specs/`. The rendered block MUST hold documents in that order under the total budget `spec.contextBudget` (default 24,000 characters; a value that is not a whole number falls back to the default; the as-is variable `SPECSTRIDE_CONTEXT_BUDGET` is its alias, annex X §X.8, and the one variable also feeds `reverse.contextBudget` of feature 108). Each document MUST get the smallest of its size, a fair share (the larger of the remaining budget divided by the documents not yet served and the floor of 1,200 characters) and what remains; a document that would get less than the floor MUST be dropped unless it fits whole. A cut MUST fall on a line end (a single over-long line is cut hard), MUST close an unbalanced code fence, and MUST end with `… (context truncated at line boundary) …`. Each block MUST start `## Context: <name> (read-only background, NOT a gate) — <path>`; blocks are joined by a blank line. `spec context` MUST print `name<TAB>path` per document and `spec render-context` the block with no added newline.
  - origin: C-138; C-140; C-144; C-145
  - disposition: translated (C-138, C-140); ported (C-144, C-145)
  - test: PT-104-C-145-context-order; PT-104-C-145-context-budget; PT-104-C-144-context-markers; PT-104-C-140-context-budget-key
  - divergence: DV-027; DV-066
  - parity: `spec.contextBudget` 24000, the as-is default; not a switch

- **F104-FR-017**: `tick` MUST edit checkboxes in place and MUST change nothing else: line ends and every other byte stay. It MUST tick either the named task ids or, for a phase, every unticked checkbox line with non-empty text in that phase's section (not only lines with a task id); an already ticked line and an empty box are untouched, and the mark written is `x`. Only `speckit-tasks` files with explicit `## Phase N` headings and `openspec-change` files MUST be ticked; native specs and the priority form MUST be left as they are, with 0 ticked. Only lines inside the phase's section count; any other level-2 heading ends it. The file MUST be rewritten atomically, keeping its mode, and nothing MUST be written when no line changed. The result is the number of lines changed. A failed `tick` MUST leave the file unchanged, be reported, and never undo an approval.
  - origin: C-138; C-143; C-145; C-144
  - disposition: translated (C-138, C-143); ported (C-145, C-144)
  - test: PT-104-C-145-tick-rules; PT-104-C-143-atomic-tick; PT-104-C-138-tick-verb; CT-104-5
  - divergence: DV-006; DV-066
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-018**: A caller that reads the model MUST get one error kind for each failure and MUST map it to its own result code 3: a spec file that is missing (`specs not found: <path>`, the critic's as-is text, distinct from the `spec not found: <path>` of the spec module in F104-FR-015), a phase that the model cannot find (`phase <N> not found in <specs>`), an invalid format (F104-FR-006), and an unreadable file (`spec: <operating-system error>`). The critic MUST take the feature slug from `--feature`, else `spec.feature`, else the location of the spec, by the rule of F104-FR-003. These codes are fields of result records and not processes of their own (layering rule LR-6).
  - origin: C-060; C-063; C-141
  - disposition: translated
  - test: PT-104-C-060-critic-inputs; PT-104-C-063-critic-exit-3; PT-104-C-141-unreadable
  - divergence: DV-066
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-019**: `specstride spec` MUST be a public verb (ruling 26) with exactly these subcommands: `feature-slug`, `detect`, `context`, `render-context`, `validate`, `tick <n>`, `numbers`, `title <n>`, `shape <n>`, `slice <n>` and `first-unapproved`, each with `--specs FILE` (required) and `--format` (override of detection). `numbers` MUST print each phase number on its own line, `title` the title (an empty line for a missing phase), `shape` the 16-character phase shape hash (an empty line for a missing phase), `tick` the count of changed lines. `first-unapproved` MUST print the first phase number that lacks a verified approval record (the record of annex B §B.14, never a bare marker) and nothing when all are approved, with exit 0 either way; `--workdir` (default `.`) selects the workspace and `--gates-dir` names a directory of approval records that replaces the default. Whether a record verifies (its schema, its signature and its bindings) is decided by the engine's verification of F101-FR-031, which lives in `@specstride/core`, a package that the spec-format package may not import: the verb MUST receive that verification as a port that the command wiring of the CLI hands over, and MUST verify no signature itself. The verb MUST read the position; it MUST NOT derive the position at which a run resumes.
  - origin: C-138; C-139
  - disposition: translated
  - test: PT-104-C-138-verb-subcommands; PT-104-C-139-verb-flags
  - divergence: DV-066
  - assumption: CQ-041 (the reading of `--gates-dir` and of "approved" now that a bare marker is not an approval; closed by the owner on 2026-09-30 as read here; annex G §G.4 lists the code of the verb but not this flag)

- **F104-FR-020**: The verb MUST exit with the as-is codes: 0 on success; 3 for an invalid spec, an unknown explicit format, an unreadable spec, and a missing phase number for `tick`, `title`, `shape` or `slice` (with `spec: <subcommand> needs a phase number`); 2 for a usage error such as an unknown subcommand of `spec` or a missing `--specs`; and 1 for a phase number that is not a whole number (as at the baseline, where it was an uncaught error; the trace text is not reproduced, rule N-18). These are the codes of the row `spec` of annex G §G.4. The row "Any command, unknown first argument (verb): 1" of that annex is about the first argument of the product and not about a subcommand of `spec`, which exits 2 (ruling K6). The exit 1 for a phase number that is not a whole number MUST be a chosen exit of the verb, and MUST NOT be the uncaught error of annex G §G.4, which exits 70. Every command that prints facts MUST also offer `--json`, opt-in (annex G F100-FR-172).
  - origin: C-141; C-139; C-144
  - disposition: translated (C-141, C-139); ported (C-144)
  - test: PT-104-C-141-verb-exit-codes; PT-104-C-139-usage-errors; PT-104-C-144-missing-number
  - divergence: DV-066
  - parity: `--json` off (opt-in)
  - assumption: CQ-042 (exit 1 for a phase number that is not a whole number; the row `spec` of annex G §G.4 holds the code; closed on 2026-09-30 by the owner's blanket instruction, the recommended answer stands)

#### G3 - Hashing and the staleness verdict

- **F104-FR-021**: There MUST be one hasher, delivered in the kernel package of feature 100 (owner of the hasher: this feature), so that every package, a core package included, can call it without an import of the spec-format package. It MUST offer these operations of annex X §X.5: the content hash of the bytes of a file, and of a text; the task-list hash that ignores checkboxes (F104-FR-022); the canonical record text (sorted keys, compact separators, non-ASCII characters kept, no final line end) and the canonical record hash, which is the content hash of that text with one line end added; the phase shape (16 hexadecimal characters of the hash of the number, title and criteria with runs of white space collapsed; a tick never changes it); and the classification of the staleness verdict (F104-FR-024). The two other hashes that the same row of §X.5 names, the obligation id (`OBL-` and twelve hexadecimal characters of the hash of source, line, task id and text; rule of feature 107) and the signature of unmet criteria (rule of feature 101, F101-FR-019), are formed by their owners over the content hash of a text: this feature builds neither and holds no rule of theirs. Every feature that hashes a source, a launch contract, a plan or a manifest MUST use it. Every hash MUST be SHA-256 and MUST equal the baseline's on the same input, and MUST be stable across runs and platforms. The word "hash" MUST be used for every such value. The hasher MUST read no phase heading and MUST build no model; of the grammar it holds only the rule of F104-FR-022, which says what the task-list hash covers and which this feature states.
  - origin: C-138; C-213
  - disposition: translated (C-138); ported (C-213)
  - test: PT-104-C-138-shape-hash; PT-104-C-213-hash-equality
  - divergence: DV-066
  - ep: EP-03 `specstride.spec-format/1` (implements)

- **F104-FR-022**: The task-list hash that ignores checkboxes MUST be the hash of the file read as UTF-8 text with line ends taken as one form, in which the mark of every task line (optional white space, `-`, optional white space, `[`, one of space, `x` or `X`, `]`, white space, a task id `T`, digits, at most one letter, at a word end) is replaced by a space. Ticking or clearing a box MUST never change it. A file that cannot be decoded MUST give no hash, and so a difference. For `openspec-change` the task line is the checkbox with a dotted id of F104-FR-013. A task line with an empty box `[]` is outside the rule, as at the baseline.
  - origin: C-213; C-218
  - disposition: ported
  - test: PT-104-C-213-checkbox-insensitive-hash; PT-104-C-218-tick-only
  - divergence: DV-060; DV-118 (the rule also covers the OpenSpec task line with a dotted id, which the baseline's rule, T-ids only, did not; CQ-045)

- **F104-FR-023**: `inputs` MUST list the sources of a declared kind (`spec`, `plan`, `tasks`, `other`) with their logical name, repository-relative path and hashes: the content hash for every source and, for the task list, also the hash that ignores checkboxes. For `speckit-tasks` the sources are `spec.md`, `plan.md` and `tasks.md` of the feature directory, those that exist; for `openspec-change` the source is `tasks.md`, `proposal.md` as `spec` and `design.md` as `plan`, those that exist; for `native` the one file, as `spec`. A kind that is unknown MUST be read as `other`. The run snapshot MUST take its source hashes from `inputs`. The launch contract MUST take the hashes of the spec, the plan and the task list from `inputs`; for every other source it records (the kinds of annex X §X.6 row 256, owner 107: the constitution, research, the data model, quickstart, the verification-commands document, contracts and checklists) it MUST use the content hash of the canonical hasher (F104-FR-021) and no hash of its own.
  - ep: EP-03 `specstride.spec-format/1` (implements)
  - test: CT-104-6
  - assumption: CQ-043 (which files of an OpenSpec change stand for `spec` and `plan`, and what a native spec's sources are; the sources give the three kinds and the files of `speckit-tasks` only)

- **F104-FR-024**: The staleness verdict MUST compare recorded sources with the files now. Each source MUST be classified `unchanged`, `ticks-only`, `changed` or `unreadable`. A source MUST be `unchanged` when its content hash is equal. A task list whose content hash differs but whose hash that ignores checkboxes is equal MUST be `ticks-only`; every other difference MUST be `changed`. The verdict MUST be fresh when every source is `unchanged` or `ticks-only`, and stale otherwise. A stale verdict MUST name every source that is `changed` or `unreadable` by its logical name (`spec`, `plan` or `tasks`) and its repository-relative path, in that order, and MUST say for the task list whether the change is more than checkboxes. A tick by the proposer, by the engine after approval, or by the runtime for an integrated group MUST never make a run stale. In the verdict of a run, whose recorded sources are those of the run snapshot (annex B §B.12), a name outside `spec`, `plan` and `tasks` (row 50 of annex X §X.6) MUST give a stale verdict. In the verdict over the sources of a launch contract (F104-FR-025) the recorded sources are those the contract holds, of any kind of annex X §X.6 row 256, each identified by its index and its path; the same classification MUST be applied to each, with the hash that ignores checkboxes for a source of kind `tasks` only, and the name rule of the run MUST NOT apply. The classification (from the recorded hashes and the hashes now to the four states and to `fresh` or `stale`) MUST be the pure operation "Classification of the staleness verdict" of the canonical hasher in the kernel package (feature 100, annex X §X.5, F100-FR-207), whose rules this feature owns; it reads no file. The package `@specstride/spec-formats` MUST read the files, compute the hashes now through the hasher, call the classification and build the lines of F104-FR-025. EP-03 MUST NOT gain an operation for the verdict.
  - origin: 011 FR-007; C-218
  - disposition: ported
  - test: PT-104-011FR007-tick-only-fresh; PT-104-011FR007-changed-named; PT-104-C-218-stale-check
  - divergence: DV-082
  - status: none
  - assumption: CQ-214 (the classification is a pure function of the hasher module of the kernel; `@specstride/spec-formats` keeps the reading of files and lines; no operation is added to EP-03)

- **F104-FR-025**: A recorded source that cannot be read MUST be reported as `sources[<i>] cannot be read: <path>: <error>` and a changed one as `sources[<i>] hash changed: <path>`, one line per source in the order recorded. For the sources of a launch contract, every source of the contract MUST be compared, of any kind of annex X §X.6 row 256 and not only the three files (F104-FR-024). The verdict MUST be the sole input of the decision that a launch contract is stale: the caller prints `stale contract sources:` with the list, exits 23 and does not rewrite the status of the launch contract to draft.
  - origin: 011 FR-007; C-218; C-234
  - disposition: ported
  - test: PT-104-011FR007-stale-lines; PT-104-C-234-exit-23; PT-104-C-218-unreadable
  - divergence: DV-082

- **F104-FR-026**: At launch the model MUST give, for every phase, the reading of its task list: the ordered ids, markers and text of its tasks, with the canonical record hash of that list, which ticks and line numbers do not change. A later reading MUST be comparable with it and MUST report which ids were added, removed, reordered or changed in text. The reading MUST be the content of the record `run:<runId>:task-list` of annex B §B.5, one per run, which the engine writes at launch and which the engine and the loop layers read. This feature MUST give the reading and MUST NOT write the record. The record crosses a file boundary, so its content MUST be validated against a schema of `@specstride/contracts` (Principle VI); its shape is that of `contracts/verdict.md`, and the schema id is feature 100's to give in annex B §B.20, where none exists yet (reported in the analyze report). A difference at the phase gate is a fact for the feature that owns the gate.
  - test: CT-104-7
  - assumption: CQ-044 (the logical name of the launch reading; the answer is applied in annex B §B.5 as `run:<runId>:task-list` and confirmed on 2026-09-30)

- **F104-FR-027**: The verdict MUST be one function whose result does not depend on when it is asked: the classification of the canonical hasher in the kernel package (F104-FR-024; annex X §X.5). Every feature that decides staleness, features 102 and 103 included, MUST reach it through `@specstride/kernel`, which a core package may import, and MUST NOT compare the hashes itself. Under the profile `parity` the same function MUST be used, and only the check points differ: where the comparison is made is the owner's (row 15 of annex X §X.7). This feature MUST NOT compare at any check point itself.
  - test: CT-104-8
  - divergence: DV-082
  - parity: no switch of its own; row 15 of annex X §X.7 (owners 102, 103, 105)
  - assumption: CQ-214 (the "one function" is the kernel's; 102 and 103 reach it through the kernel, since `@specstride/core` may import `contracts` and `kernel` only)

### Key Entities

| Entity | What it is |
|---|---|
| Spec-format adapter | One implementation of EP-03 for one format: `detect`, `parse`, `validate`, `tick`, `inputs` |
| Canonical spec model | Format, feature slug, sources, phases with criteria and structured tasks |
| Phase | Number, title, section, acceptance criteria, tasks |
| Task | Id, markers, text, tick state, line, source file |
| Source | A file a run started from, with kind, logical name, path and hashes |
| Context document | A read-only background file of a spec, with a name and a path |
| Task-list reading | The ordered ids, markers and text of a phase's tasks at launch, with a hash; the content of `run:<runId>:task-list` (annex B §B.5) |
| Staleness verdict | Fresh or stale, with per-source classification and the names of the files that changed |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **F104-SC-001**: One grammar. The number of readers of phase headings or task lines outside the spec-format package is 0 in every package of the product (the hasher in the kernel holds the mark rule of F104-FR-022 and nothing else of the grammar, and is this feature's), the doctor, the run view and any code extracted from the dashboard of Lisa included, proved by a static test on every build.
- **F104-SC-002**: Checkbox-only changes never make a source stale. In 100 per cent of the fixture scenarios of FX-33 that tick or clear boxes, and in 100 per cent of 1,000 generated tick and clear subsets of a task list, the verdict is fresh.
- **F104-SC-003**: A real change is named. In 100 per cent of seeded changes (one per file: a word of the spec, of the plan, of one task) the verdict is stale and names exactly the changed file with its logical name and path.
- **F104-SC-004**: Hashes equal the baseline's. On 100 per cent of the inputs of the fixtures FX-09, FX-10, FX-32 and FX-33 the content hash, the hash that ignores checkboxes and the phase shape equal the reference's.
- **F104-SC-005**: Parity of resolution and detection. 100 per cent of the scenarios of FX-09 and FX-10 give `equal` or `waived` under DV-073 or DV-060, and the inventory output of FX-32 comes out of the model and is `equal`.
- **F104-SC-006**: A format from the test tree is added with 0 changed core files: it is detected, parsed, validated, ticked and run in the conformance suite, and no core file names it.
- **F104-SC-007**: Round trip of `tick`. In 100 per cent of the fixtures a tick changes only checkbox bytes, and a second tick of the same phase changes 0 lines.
- **F104-SC-008**: Lisa's kept behaviour holds. The three characterization tests CT-104-1, CT-104-2 and CT-104-3 pass on the extracted code before the alias of `openspec` is introduced, and the changed one passes after.

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
| The input is Spec Kit features that already exist; the product does not author specs | Prompt section 0 |

## Extension points

| EP | Id and version | Relation | What for |
|---|---|---|---|
| EP-03 | `specstride.spec-format/1` | implements | The five operations, the canonical model, the three Wave 1 formats and the alias. This feature is the content owner: the core side, the conformance suite and the sample format |

This feature consumes no other extension point. Its operations are called by the engine, the CLI, the
derivation of the launch contract, the doctor and the run view; it calls none of them.

## Contracts of feature 100 used

| Contract | Version | Where |
|---|---|---|
| Spec-format adapter and canonical spec model | `specstride.spec-format/1` | Annex C §C.7, F100-FR-095, F100-FR-096 |
| Canonical hasher | — | Annex X §X.5, F100-FR-207; delivered in the kernel package (package graph of feature 100, owner "104 (hasher)") |
| Run snapshot, with the source hashes | `specstride.snapshot/1` | Annex B §B.12, F100-FR-066, F100-FR-067 |
| Logical name `run:<runId>:task-list`, the task list as read at launch (written by the engine, not by this feature) | layout 1.1 | Annex B §B.5 |
| Approval record (read by `first-unapproved`) | `specstride.approval/1` | Annex B §B.14, F100-FR-070 |
| Exit codes per command; the public verbs | as listed | Annex G §G.4, F100-FR-171, F100-FR-182, F100-FR-183 |
| `--json` on commands that print facts | — | Annex G F100-FR-172 |
| Config envelope; the alias table (`spec.format`, `spec.feature`) | `specstride.config/1` | Annex X §X.2, §X.8 |
| Launch-contract sources | `specstride.launch-contract/1` | Annex G §G.8, F100-FR-190 |
| List of closed sets | — | Annex X §X.6, rows 49, 50, 97, 98, 99 and 100 (this feature's) and row 256 (the kinds of source of a launch contract, feature 107's); F100-FR-208 |
| Normalization rules N-01, N-15, N-18; component name `spec` | `specstride.oracle-normalization/1` | Annex X §X.8 |

Fixture families of feature 141 cited: FX-09, FX-10, FX-32, FX-33 (§O.2).

## Rows of the `parity` profile

This feature introduces no switch and adds no row to annex X §X.7. It introduces three inputs with
their as-is defaults: `spec.format` (unset), `spec.feature` (unset) and `spec.contextBudget` (24,000),
and one opt-in flag, `--json` (off). The check points of staleness are row 15 (owners 102, 103, 105).
Feature 110 has given them row 49 of annex X §X.7 (`spec.format`, `spec.feature`, `spec.contextBudget`), with the as-is defaults. The row states the defaults as "detected; the last active; 24000": "detected" is the detection of F104-FR-005 when `spec.format` is unset, and "the last active" is the resolution of F104-FR-001 when `spec.feature` is unset, whose step 2 reads the feature that Spec Kit last made active (`.specify/feature.json`). The two readings are the same.

## Closed sets

Stated as F100-FR-208 asks.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Spec formats (row 49 of annex X §X.6) | An open registry; Wave 1: `native`, `speckit-tasks`, `openspec-change`, alias `openspec` | 104 | Open | `unknown-format` |
| Files of the staleness verdict (row 50) | `spec`, `plan`, `tasks` | 104 | Owner decision | The verdict is stale |
| Kinds of source of a specification (row 97) | `spec`, `plan`, `tasks`, `other` | 104 | Design | Read as `other` |
| States of a source in a staleness verdict (row 98) | `unchanged`, `ticks-only`, `changed`, `unreadable` | 104 | Design | Read as `changed` |
| Errors of a spec-format adapter (row 99) | `invalid-spec`, `ambiguous-candidates`, `unknown-format` | 104 | Design | Read as `invalid-spec` |
| Subcommands of the command `spec` (row 100) | The eleven of F104-FR-019 | 104 | Design | Usage error, exit 2 |

## As-is behaviour not carried

| As-is id | Behaviour (short) | Disposition | Register row |
|---|---|---|---|
| B-1999 | An explicit format `openspec` prints an unknown-format error and exits 3 | superseded-by DV-073 | DV-073 |
| Part of 002 FR-028 | Lisa's legacy adapter (`wiggum`) is not registered | Not carried | DV-036 (decision 3) |
| Part of 002 FR-028 | Lisa's `chat` adapter is not registered | Roadmap | roadmap entry `chat` |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Which grammar wins where the Specstride grammar and the mixture-of-loops grammar differ, for example a lower-case `## phase 1:` heading, which only the second reads? → A: The Specstride grammar (case-sensitive `Phase`), by the merge rule that 028 wins and by D-32, which makes the inventory output the oracle. The difference is a row of the divergence register, DV-119 (CQ-045, closed 2026-09-30). (Source: `bootstrap_contract.py:29` at `9c88f86`; `specstride_spec.py` at `9cab15d`; R19 D-32)
- Q: Which hash decides staleness of the task list? → A: The one that ignores checkboxes, so that a tick never makes a run stale. (Source: ruling K3; ruling P1; R29v PU-94; 011 FR-007; brief 104 heading 4)
- Q: Who decides when the hashes are compared? → A: Not this feature: 102 at launch and resume, 103 at every pass start, 105 at critic start under `parity`. (Source: brief 104 heading 1; feature-briefs section D.8, row 3)
- Q: Does the alias `openspec` change the hash or the model? → A: No. It selects `openspec-change`; the model's `format` field holds `openspec-change`. (Source: ruling 69; R19 C-07)
- Q: Is `.specify/feature.json` old state? → A: No. It is Spec Kit's own file, not state of the three old systems, so decision 3 does not bar reading it. (Source: `orchestrator.sh:371`; decision 3)
- Q: Does the port print the messages of resolution byte for byte? → A: Yes, as the messages carry no implementation file name; the messages of the spec module change only their prefix to the component name `spec`. (Source: ruling 68; N-15; component-name table)
- Q: Which hash algorithm and which text form does the hash that ignores checkboxes use? → A: SHA-256 over the UTF-8 text with line ends normalized, as the baseline reads the file. (Source: `bootstrap_contract.py:44-47`, `contract_lib.py:340-365` at `9c88f86`)

### Session 2026-09-29 (speckit-clarify)

- Q: Do the context documents (research, data model, contracts) belong to the staleness verdict of a run? → A: No. The verdict of a run covers `spec`, `plan` and `tasks` only; the sources of a launch contract are all compared (F104-FR-025), and the context documents are read-only background. (Source: closed-set row 50 of annex X §X.6; `contract_lib.py:329-365` at `9c88f86`)
- Q: Is the plan hashed with the hash that ignores checkboxes? → A: No. Only the task list is; the spec and the plan use the content hash. (Source: `contract_lib.py:340-356`; F100-FR-067)
- Q: What is the verdict for a source that did not exist at launch and exists now? → A: It is not a recorded source, so it is not compared; only recorded sources can be stale. (Source: `contract_lib.py:329-336`, which iterates the recorded sources)
- Q: Does a tick of the priority form of `speckit-tasks` change the hash? → A: The priority form is never ticked (F104-FR-017), so it changes nothing; a person's edit of a box in that form is a tick by the rule of F104-FR-022 where the line has a task id. (Source: B-2054; B-2477)
- Q: Does the verb offer the verdict or `inputs`? → A: No. The brief names the verb `spec` with the as-is subcommands only; consumers call the operations. A new subcommand would need a row of annex G. (Source: brief 104 heading 1; F100-FR-171)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary. The divergence register has 119 rows; DV-118 and DV-119 are this feature's (CQ-045).
- Where the architecture file, the brief and a ruling differ, the ruling stands.
- The compatibility projection, the argument tables and the normalization contract exist when the fixtures that compare them run.

Readings that the sources did not settle when this specification was written. Each is marked in its requirement. All were closed on 2026-09-30 (`docs/ecosystem/CLARIFY-QUEUE.md`): CQ-041 and CQ-214 by the owner's answer, CQ-044 by the answer applied in annex B §B.5 and confirmed, the others by the owner's blanket instruction that the recommended answer stands. The readings below are the closed answers; nothing of this table is open.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-039 | How is the resolved format handed to later readers of a run? | Through the run snapshot of annex B §B.12 as a pinned value of `spec.format` (the map `keys` of the snapshot, F100-FR-066). Closed 2026-09-30 | F104-FR-007 |
| CQ-040 | Where does an added format stand against the fallback `native`? | After the built-in path and content rules, before the fallback. Closed 2026-09-30 | F104-FR-009 |
| CQ-041 | What do `--gates-dir` and "approved" mean for `first-unapproved`, given that a bare marker is not an approval? | A directory of approval records; a phase is approved when its record verifies, by the verification of F101-FR-031, which the verb receives as a port from the CLI. Closed by the owner 2026-09-30 | F104-FR-019 |
| CQ-042 | The baseline gives exit 1 for a phase number that is not a number. Is it kept? | 1 is kept, as an accidental behaviour that no register row fixes; the row `spec` of annex G §G.4 holds the code. Closed 2026-09-30 | F104-FR-020 |
| CQ-043 | Which files of an OpenSpec change are `spec` and `plan`, and what are the sources of a native spec? | `proposal.md` and `design.md`; the one file as `spec`. Closed 2026-09-30 | F104-FR-023 |
| CQ-044 | Where is the launch reading of the task lists stored, and under which logical name? | Under `run:<runId>:task-list` of annex B §B.5, written by the engine at launch, read by the engine and the loop layers. Applied in feature 100 and confirmed 2026-09-30 | F104-FR-026 |
| CQ-045 | Two differences that no fixture reaches: the hash that ignores checkboxes also covers OpenSpec task lines with a dotted id; a lower-case `## phase N:` heading, which mixture-of-loops read, is not read by the port. Do they get register rows? | Yes: DV-118 and DV-119, oracle handling "not observable". Closed 2026-09-30; the rows were written after the analyze run of 2026-09-30 | F104-FR-022, F104-FR-008 |
| CQ-214 | How does a core package reach the one verdict function, given that `@specstride/core` may import `contracts` and `kernel` only? | Closed on 2026-09-30 (the recommended answer stands): the classification is a pure operation of the hasher module of the kernel (annex X §X.5), rules owned by this feature; `@specstride/spec-formats` reads the files and builds the lines; EP-03 gains no operation | F104-FR-024, F104-FR-027 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place. No requirement was added, and no id was renumbered
or reused. The feature has 27 functional requirements and 8 success criteria, as before.

| Requirement | Item | What changed |
|---|---|---|
| F104-FR-021 | W-104-01 | The hasher is delivered in the kernel package of feature 100, whose package graph names this feature as the owner of the hasher, so that a core package can call it. The hasher reads no phase heading; of the grammar it holds only the rule of F104-FR-022 |
| F104-SC-001 | W-104-01 | The count of readers outside the spec-format package names the one exception: the mark rule of F104-FR-022 inside the hasher |
| F104-FR-026 | W-115-01; W-X-10 (CQ-044) | The reading is the content of `run:<runId>:task-list` of annex B §B.5, written by the engine at launch. The sentence that annex B holds no name is removed. This feature gives the reading and does not write the record |
| F104-FR-020 | W-100-11 (CQ-042) | No code changed. The requirement now says that the row "unknown first argument (verb): 1" of annex G §G.4 is not about a subcommand of `spec` (exit 2), that its codes are those of the row `spec`, and that exit 1 for a phase number that is not a whole number is a chosen exit and not the uncaught error (70). The text of the assumption follows annex G as repaired |
| Edge case on `spec title` | W-100-11 | The same statement about exit 1 and exit 70 |
| Contracts of feature 100 used; Key Entities; Assumptions | W-X-10; W-104-01 | The logical name and the place of the hasher are cited; the rows CQ-042 and CQ-044 follow the repaired annexes |
| F104-FR-024 | CQ-214, answer of the owner (2026-09-30) | The classification of the verdict is the pure operation of the canonical hasher in the kernel (annex X §X.5), whose rules this feature owns; `@specstride/spec-formats` reads files and builds lines; EP-03 gains no operation; `assumption: CQ-214` |
| F104-FR-027 | CQ-214, answer of the owner (2026-09-30) | The "one function" is the classification of the kernel's hasher; features 102 and 103 reach it through `@specstride/kernel` and do not compare hashes themselves; `assumption: CQ-214` |


## Repairs after the analyze run of 2026-09-30

Dated 2026-09-30, second analyze run, after the cross-feature review and the closure of the clarification
round. Requirements changed in place; none added, none renumbered. The feature keeps 27 functional
requirements and 8 success criteria. The findings and their ids are in `analyze-report.md`, "Second
analyze run".

| Requirement or section | Finding | What changed |
|---|---|---|
| F104-FR-024, F104-FR-025 | I1 | The rule "a name outside `spec`, `plan` and `tasks` gives a stale verdict" is scoped to the verdict of a run (the sources of the run snapshot, row 50). The verdict over the sources of a launch contract compares every recorded source of any kind of row 256 by index and path, with the same classification; the name rule of the run does not apply to it |
| F104-FR-023 | I2 | The run snapshot takes its hashes from `inputs`; the launch contract takes the three of `inputs` and hashes every other source it records with the content hash of the hasher |
| F104-FR-021 | I3 | The operations this feature builds are named one by one, the classification included; the obligation id (107) and the signature of unmet criteria (101) of the same row of annex X §X.5 are formed by their owners over the content hash of a text and are not built here |
| F104-FR-019, Assumptions (CQ-041) | U1 | The verification of an approval record is the engine's (F101-FR-031, `@specstride/core`); the verb receives it as a port from the CLI and verifies no signature itself |
| F104-FR-026 | U2 | The record `run:<runId>:task-list` crosses a file boundary and is validated against a schema of `@specstride/contracts`; its shape is `contracts/verdict.md`; the schema id is feature 100's to give (reported) |
| F104-FR-008, F104-FR-022, Clarifications, Assumptions | C1 | The two differences of CQ-045 are rows DV-118 and DV-119 of the divergence register; the requirements cite them |
| F104-FR-016 | I5 | The alias `SPECSTRIDE_CONTEXT_BUDGET` is named, with the note that the variable also feeds `reverse.contextBudget` |
| F104-FR-020, Assumptions | I4 | CQ-039 to CQ-045 are closed (2026-09-30); the table says so, and the count of the register is 119 |
| Closed sets; Contracts of feature 100 used | L1 | Rows 97 to 100 of annex X §X.6 are cited; row 256 is named as feature 107's |
| Rows of the `parity` profile | L2 | The defaults "detected" and "the last active" of row 49 are read as the detection and the resolution of this feature when the keys are unset |
| F104-FR-018 | L3 | `specs not found` is named as the critic's as-is text, distinct from `spec not found` of F104-FR-015 |
