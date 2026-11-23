# Feature Specification: Reverse specification (`specstride-reverse`)

**Feature Branch**: `108-reverse` (a label: Spec Kit creates no branch in this repository; the directory is `specs/108-reverse`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 108-reverse of Specstride: the reverse capability of the CLI. The wrapper and its refusals, output naming, the plan, the driver spec that the gated loop runs, the dry run; the source inventory with its fingerprint and manifests; the reverse guard against the baseline inventory; the reverse lint with its finding codes per level; the Spec Kit templates that reverse ships; the run request of kind `engine` through which reverse runs detached."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 108-reverse), `STAGE-B-RULES.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`), feature 141 (`specs/141-parity-oracle/`), and the as-is specification `old/028-as-is-specstride/`.

## Overview

Reverse specification turns an existing source tree into an as-is Spec Kit feature: a specification, a plan, research, a data model, contracts, a quickstart, a task list and a checklist, every claim of which cites the source. The deterministic parts are code: the inventory of the source, the plan, the driver spec, the guard and the lint. The judgment is a proposer's, inside the gated loop that another feature specifies. Nothing in the source tree may change.

The feature was specified with two requirement groups and then split. This feature keeps group G-A, reverse run: F108-FR-001 to F108-FR-034 (the wrapper, its refusals, output naming, the plan, the driver spec, the dry run, the guard, the run request of kind `engine`). Group G-B, the source inventory, the lint and the shipped templates (F108-FR-035 to F108-FR-060), moved to the feature `140-reverse-inventory-and-lint`; "Requirements moved to 140-reverse-inventory-and-lint" gives the ids. The plan, the guard and the lint commands reach the inventory and the lint only through the CLI commands and logical names of feature 100 (annex G §G.1 and §G.4, annex B §B.5).

**In scope**: the CLI capability `reverse` with its verbs `plan`, `lint`, `guard` and `inventory` as commands (their behaviour beyond the wrapper: the plan and the guard); output naming and refusals; the driver spec and the verification-commands document of a reverse run; the dry run; the guard; the run request of kind `engine` through which a reverse run is detached.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The gated loop that runs the driver spec | 101, 103 |
| The host skill text and its token budget | 113 |
| The detached start; the run request kind is owned by 123 | 122 |
| The hashing primitive | 104 |
| Spec-format parsing of the produced feature | 104 |
| The source inventory, its fingerprint, manifests and summary; the lint and its finding codes; the shipped templates | 140 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reverse-engineer a repository into an as-is specification (Priority: P1)

A consumer has a repository with no specification. They invoke `specstride-reverse` in their host on it. The product inventories the source, writes a plan and a driver spec, launches the gated loop detached, and reports one line. Hours later the consumer finds an as-is Spec Kit feature under `specs/` of their repository, and the run's phase gates approved it.

**Why this priority**: It is the whole purpose of the feature and the second host skill of the product.

**Independent Test**: On a fixture repository run `specstride reverse <SRC>` with the stub proposer and the stub engine of the oracle. The plan, the driver spec and the verification-commands document exist; the engine is started once with the documented arguments; the source tree is byte-identical afterwards apart from the output directory.

**Acceptance Scenarios**:

1. **Given** a source directory and no earlier reverse run of the same slug, **When** the consumer runs `reverse <SRC>`, **Then** the plan is written, the run is launched, and the run's output directory is `specs/NNN-as-is-<slug>` with NNN one above the highest existing spec number (F108-FR-024, F108-FR-007).
2. **Given** the host skill, **When** it launches the reverse run, **Then** the run request is of kind `engine` and the run survives the end of the host session (F108-FR-009).
3. **Given** a run whose phase gates all approved, **When** the guard runs, **Then** it reports the source untouched (F108-FR-031, F108-SC-001).

---

### User Story 2 - Know that the source was not touched (Priority: P1)

After a reverse run, or at every phase gate of it, the guard re-walks the source against the baseline inventory and fails on any change outside the output directory and the workspace part, on a moved git HEAD, and on new git status entries.

**Why this priority**: "The source is untouched" is the safety promise of reverse (028 SC-006).

**Independent Test**: A fixture run in which the stub proposer changes one source file makes the guard print `changed: <path>` and exit 3; a run that writes only to the output directory makes it print `guard: ok` and exit 0.

**Acceptance Scenarios**:

1. **Given** an added, deleted or changed file, **When** the guard runs, **Then** it prints one problem per path and the failure line, and exits 3 (F108-FR-028, F108-FR-031).
2. **Given** a tree that was dirty before the run, **When** the guard runs after a clean run, **Then** it passes (F108-FR-030).

---

### User Story 3 - See the plan without launching (Priority: P2)

A consumer runs `reverse --dry-run`. They see what would be launched and nothing is launched.

**Why this priority**: Dry run is how the consumer withholds consent (Principle XV).

**Independent Test**: `reverse --dry-run` on a fixture prints the labelled plan lines and the engine command, exits 0, and the engine stub records no call.

**Acceptance Scenarios**:

1. **Given** `--dry-run`, **When** the wrapper ends, **Then** the exit code is 0 and no run was launched (F108-FR-005).

---

### User Story 4 - Be refused before anything is written (Priority: P2)

The wrapper and the plan refuse an unsafe output directory, a flag the run sets itself, an unknown mode, and a second run over the same slug, each with the as-is message.

**Why this priority**: Every refusal protects the source or an earlier run.

**Independent Test**: One fixture per refusal; each ends with the documented exit code and message, and nothing is written.

**Acceptance Scenarios**:

1. **Given** `--out` at the source root, outside it, or inside `.git`, the workspace part, `.specify/`, or a non-empty directory, **When** the plan runs, **Then** it exits 3 with the matching message (F108-FR-025).

---

### Edge Cases

- The source is not a directory: exit 3 with `source is not a directory: <src>` (F108-FR-013).
- The source has no git repository, or is a subdirectory of one: the guard makes no git check (F108-FR-030).
- `--out` is a symbolic link that resolves outside the source: refused (F108-FR-025).
- The tree was dirty before the run: git status entries equal to the baseline's are exempt (F108-FR-030).
- The host session ends while the run lives: the run continues; `status` shows it (F108-FR-009).
- The proposer weakens its own driver spec: the change is detected through the source hashes of the run, not prevented (F108-FR-021).

## Requirements *(mandatory)*

### Functional Requirements

Group G-A, reverse run.

- **F108-FR-001**: The CLI MUST offer the command `reverse` with a source directory as its argument, and MUST accept `specstride --reverse <SRC>` as the same entry point, handled before any other argument parsing.
  - origin: B-1427
  - disposition: ported
  - test: PT-108-C-108-entry
  - ep: EP-01 `specstride.host/1` (consumes)
  - parity: as at the baseline (both spellings)

- **F108-FR-002**: `reverse` MUST accept these flags with the as-is meaning: `--src <DIR>`, `--upto <N>` and `--json` (forwarded to the lint, lint mode only), `--lint <FEATURE_DIR>` (lint mode: run the lint, call no model, start no run), `--out <DIR>`, `--name <SLUG>` and `--tasks done|open` (forwarded to the plan), and `-h` or `--help` (print the front-door usage and exit 0).
  - origin: B-1444; B-1445; B-1447; B-1450; B-1451; B-1453; B-1454; B-1455
  - disposition: ported
  - test: PT-108-C-109-wrapper-flags

- **F108-FR-003**: `reverse` MUST pass these flags with their value on to the engine start: `--proposer`, `--critic`, `--max-rejects`, `--max-iter`, `--proposer-timeout`, `--proposer-timeout-phase`, `--critic-timeout`, `--start-phase`, `--loki-url`, `--otel-url`, `--long-job-phase` and `--long-job-cmd`. Any other argument that starts with a hyphen MUST be passed on as a flag without a value.
  - origin: B-1448; B-1449
  - disposition: ported
  - test: PT-108-C-109-passthrough

- **F108-FR-004**: `reverse` MUST refuse, before writing anything: a flag that the reverse run sets itself (`-w`, `--workdir`, `-s`, `--specs`, `--spec-format`, `--feature`, `--verification`, `--verification-commands`, `--test-plan`, `--generate-tests`) with exit 3 and the message `specstride reverse: <flag> is set by the reverse run itself; it cannot be passed`; a second positional argument with exit 2 and `specstride reverse: unexpected argument '<arg>'`; a missing source without `--lint` with exit 2 and a `usage: specstride reverse <SRC> ...` line on standard error; and `--mode` with any value but `source-aware` with exit 3 and a message that starts `specstride reverse: Runtime-assisted reverse engineering requires an explicit permission and side-effect policy` (`Black-box` when the mode is `black-box`).
  - origin: B-1452; B-1476; B-1477; B-1478; B-1479
  - disposition: ported
  - test: PT-108-C-111-refusals; CT-108-160

- **F108-FR-005**: `reverse --dry-run` MUST run the plan, which writes its files as in F108-FR-014, MUST NOT launch anything, and MUST exit 0. In compatibility output it MUST print, in this order: the line `specstride reverse — dry run (no LLM call, nothing launched)`; the labelled lines `source`, `inventory` (files, skipped, bytes, oversize, units), `languages`, `frameworks`, `constitution`, `output dir`, `tasks mode`, `inventory`, `driver`, `commands`; `phases:` with one line `<n>. <title>  (lint --upto <level>)` per phase; and last `  orchestrator (not executed):` with the shell-quoted engine command prefixed `SPECSTRIDE_GIT_COMMITS=off`.
  - origin: B-1446; B-1481; B-1519; B-1520; B-1521
  - disposition: ported
  - test: PT-108-C-114-dry-run; PT-108-C-111-dry-run-exit
  - parity: compatibility output (row 18 of annex X §X.7)

- **F108-FR-006**: `reverse` MUST read from the plan the keys `src`, `driver`, `feature`, `verification_commands`, `test_plan` and `generate_tests` to build the launch. When planning fails, `reverse` MUST exit with the exit code of the plan, which is 3.
  - origin: B-1480; B-1556
  - disposition: ported
  - test: PT-108-C-111-plan-failure; PT-108-C-115-plan-keys

- **F108-FR-007**: A reverse run MUST be one engine start over the source as its working tree, with the driver spec as its spec in the native format, the feature `reverse-<slug>`, the verification-commands document, the plan of tests at `reverse:<slug>:test-plan` and the location of generated tests at `reverse:<slug>:scaffolds` (annex B §B.5; both in the workspace part, so that the engine writes neither into the source), followed by the pass-through flags of F108-FR-003. Before it starts, `reverse` MUST print `reverse: launching <argv>`.
  - origin: B-1557; B-1522
  - disposition: ported
  - test: PT-108-C-115-engine-invocation; PT-108-C-114-launching-line
  - ep: EP-03 `specstride.spec-format/1` (consumes)
  - assumption: CQ-093 (the logical names `reverse:<slug>:test-plan` and `reverse:<slug>:scaffolds` of annex B §B.5; the answer is applied in the annex, the owner has not ruled)

- **F108-FR-008**: A reverse run MUST never commit into the source repository. The engine start of a reverse run MUST carry the commit switch `loop.gitCommits` set to off at the rank of a flag, whatever user, project or environment configuration says.
  - origin: B-1472
  - disposition: translated
  - test: PT-108-C-110-commits-off
  - divergence: DV-027
  - parity: off, as at the baseline (the as-is variable `SPECSTRIDE_GIT_COMMITS` is an alias of `loop.gitCommits`, annex X §X.8)

- **F108-FR-009**: `specstride-reverse` MUST run detached through a run request of kind `engine`: one engine start with its arguments, with the same lock, lease, relaunch classifier and digest as a run request of kind `pipeline`, and with no launch contract. The command `reverse` MUST offer the flag `--detach` to make that request; without the flag it MUST run the engine in the foreground and exit with the engine's code, as the baseline does. The host skill MUST always pass the flag. The runtime root MUST be the same one that a pipeline run uses. The end of the host session MUST NOT end the run. A reverse run on a workspace whose lock is held MUST end with the engine code 5 in the foreground, and when detached with the handshake outcome of annex F §F.3: `attached` (exit 4) when a live run holds the lock; `refused` with exit 24 for the refusals `lock-conflict` and `lock-unknown`, and `refused` with exit 4 for every other refusal of the launch.
  - divergence: DP-077 (ruling 25); no register row, since the flag is off at the baseline
  - test: CT-108-109; CT-108-142; CT-108-162
  - ep: EP-17 `specstride.detach/1` (consumes)
  - parity: off (`--detach` is not passed; the engine runs in the foreground)
  - status: unverified (check: the spike of feature 122 starts a run request of kind `engine` from the host's shell tool, ends the session, and confirms that the run lives; verified-on: —; pin: host versions of the spike)
  - assumption: CQ-090 (the flag `--detach` on `reverse` and the foreground default; annex G §G.1 names the flag, the owner has not ruled)

- **F108-FR-010**: `reverse` MUST accept the consumer's optional comment, under the rules of `specstride-run`: it is stored verbatim with its hash in the launch record before any repository text is printed; it selects only among the options of `reverse` (tasks mode, name, output directory, dry run) and never widens scope or spend; it never changes a launch check, the terms gate or a budget. An explicit flag MUST win over prose in the comment.
  - test: CT-108-110
  - parity: not used (the baseline has no comment)
  - assumption: CQ-091 (the spelling `--comment` of the argument, and of the verbs; annex G §G.1 names them, the owner has not ruled)

- **F108-FR-011**: The tasks mode of a reverse plan MUST be `done` or `open`. It MUST come from `--tasks`, else from the setting `reverse.tasks` (as-is variable `SPECSTRIDE_REVERSE_TASKS`; an empty value counts as `done`), else `done`. Any other value MUST fail the plan with exit 3 and the message `--tasks must be done or open (got '<v>')`, or for the setting `SPECSTRIDE_REVERSE_TASKS must be done or open (got '<v>')`. The legacy-prefixed variable MUST NOT be read.
  - origin: B-1612; B-1619; B-1620; B-1635
  - disposition: translated
  - test: PT-108-C-117-tasks-flag; PT-108-C-118-tasks-env
  - divergence: DV-027; DV-036
  - parity: `reverse.tasks` = done (the as-is default)

- **F108-FR-012**: The command `reverse` MUST offer the verbs `plan`, `lint`, `guard` and `inventory`. A verb is recognised only as the first argument; a source directory with the name of a verb is written with a leading `./`. A missing verb where the wrapper form does not apply, and an unknown verb, MUST be a usage error with exit 2. `plan <SRC>` writes the inventory, the driver spec and the verification-commands document, prints the plan as one JSON object, and never calls a model. `lint <FEATURE_DIR>` runs the deterministic Spec Kit lint. `guard <SRC>` re-walks the source against a baseline inventory and fails when anything outside the output directory and the workspace part changed.
  - origin: B-1599; B-1600; B-1601; B-1602
  - disposition: translated
  - test: PT-108-C-116-verbs
  - divergence: DV-066
  - assumption: CQ-091 (the spelling of the verbs; annex G §G.1 names the four, the owner has not ruled)

- **F108-FR-013**: `plan` MUST take the source directory as its positional argument, resolve it to its real path, and fail with exit 3 and `source is not a directory: <src>` when it is not one. `--name <SLUG>` MUST set the run name, which is slugified (F108-FR-024); the default is the base name of the source directory. `--out <DIR>` MUST set the output feature directory, made absolute against the current directory; the default is F108-FR-024's.
  - origin: B-1605; B-1606; B-1611
  - disposition: translated
  - test: PT-108-C-117-plan-args
  - divergence: DV-066

- **F108-FR-014**: `plan` MUST write, each atomically: `reverse:<slug>:inventory` (the inventory built with the output directory, relative to the source, as its only exclusion), `reverse:<slug>:inventory-summary` (rendered from the inventory under the context budget), `reverse:<slug>:driver` (F108-FR-016 to F108-FR-021) and `reverse:<slug>:verification-commands` (JSON with one space of indentation, sorted keys, a final line end). It MUST create the directories of these names when it writes their first file, and MUST NOT create the output directory. The run needs a constitution written only when the source has none.
  - origin: B-1703; B-1704; B-1705; B-1706; B-1707; B-1812; B-1813
  - disposition: translated
  - test: PT-108-C-121-plan-files; PT-108-C-123-plan-inputs
  - divergence: DV-006
  - assumption: CQ-092 (annex B §B.5 gives the CLI as writer of two control-plane names of reverse; F100-FR-003 allows the records of a reverse plan that are written before a runtime exists)

- **F108-FR-015**: `plan` MUST print one JSON object, indented by one space with sorted keys, with the keys: `src` (real path of the source), `slug`, `feature` (`reverse-<slug>`), `out` (real path of the output directory, the location of `reverse:<slug>:output`), `state_dir` (the workspace part), `run_state` (the directory of the run inside the workspace part), `inventory`, `inventory_md`, `driver`, `verification_commands`, `test_plan` (the location of `reverse:<slug>:test-plan`), `generate_tests` (the location of `reverse:<slug>:scaffolds`), `analysis`, `tasks_mode`, `oversize`, `phases` (a list of `{n, title, lint_level}`) and `summary` (`files`, `skipped`, `text_bytes`, `walk`, `git_head`, `languages`, `frameworks`, `units` as a count, and `constitution` as `existing` or `to be written`). A value that names a file MUST be the location of the logical name of that file; the oracle compares the values through the layout table. `plan` MUST exit 0 after printing the plan.
  - origin: B-1709; B-1710; B-1711; B-1712; B-1713; B-1714; B-1715; B-1716; B-1717; B-1718; B-1719; B-1720; B-1721; B-1722; B-1723; B-1724; B-1725; B-1737; B-1623
  - disposition: ported
  - test: PT-108-C-122-plan-json; PT-108-C-119-plan-exit
  - assumption: CQ-093 (the logical names `reverse:<slug>:test-plan` and `reverse:<slug>:scaffolds` of annex B §B.5; the answer is applied in the annex, the owner has not ruled)

- **F108-FR-016**: The driver spec MUST start with `# Reverse-engineer `<source base name>` into Spec Kit (as-is)` and end with exactly one line end. It MUST have a section `## Run boundaries` that lists the target repository, the output directory, the workspace part, the tasks mode and the whole policy. Each phase MUST be `## Phase <n>: <title>` with the subsections `### Policy` (the policy repeated verbatim), `### Work`, `### Gate` and `### Acceptance criteria`. Every phase MUST name the inventory summary as the ground truth of what exists and tell the proposer not to derive it again. `### Gate` MUST list the phase's lint command and the guard command in a shell code block, and tell the proposer to run them first and fix every error before writing phase evidence. The driver MUST ask that the phase evidence stay short (the grounding budget of the critic is 32 KB), paste the `--json` output of the lint, and cite artifacts by working-tree-relative path. Acceptance criteria MUST be unticked checkbox lines, and every phase's list MUST end with `<lint command> exits 0.` and `<guard command> exits 0.`.
  - origin: B-1699; B-1700; B-1701; B-1784; B-1785; B-1786; B-1787; B-1788; B-1805
  - disposition: translated
  - test: PT-108-C-121-driver-structure; PT-108-C-123-driver-structure
  - divergence: DV-006

- **F108-FR-017**: The policy of the driver spec MUST state: mode source-aware, with source, configuration, tests, schemas, documentation, manifests and git history as read-only evidence; no network access, no dependency install, no services, containers or daemons; the product, its tests, builds, generators, migrations, linters and formatters are not executed, and only read-only discovery (`ls`, `cat`, `grep`, `find`, `wc`) and `git log`, `git show`, `git blame` are allowed; the only permitted writes are the output directory and the workspace part, and the run never touches `.specify/`, never writes `.specify/feature.json` and never creates a git branch or commit; only current behaviour is described, with no To-Be design and no backlog; evidence precedence is executable source, schemas and configuration, then tests, then templates and command definitions, then user documents, then comments and git history, and a disagreement lowers confidence and is recorded in `contradicts=`; every claim that the lint checks carries an evidence comment on the line after it; evidence paths are relative to the source and their ranges must exist; at most 3 `[NEEDS CLARIFICATION` markers are allowed in `spec.md`, and other unknowns go under Assumptions with `validation=unverified`.
  - origin: B-1765; B-1766; B-1767; B-1768; B-1769; B-1770; B-1771; B-1772
  - disposition: ported
  - test: PT-108-C-123-policy

- **F108-FR-018**: The driver phases MUST be numbered contiguously from 1 in list order; the number is the number of the phase gate. A run that is not oversize has five phases: specification (lint level 1), `Plan and research` (2), `Design artifacts` (3), `Tasks (<mode>)` (4) and `Cross-artifact analysis and sign-off` (5). The first is titled `Constitution and specification` when a constitution must be written, else `Specification`. An oversize run MUST put one level-0 phase per inventory unit before the specification phase, titled `Investigate unit <path> (1<letter>)`, with letters `a` to `z` and from the 27th unit the suffix `-<index+1>`, and MUST title the specification phase `Synthesis — constitution and specification` or `Synthesis — specification`. The feature of a reverse run MUST be `reverse-<slug>`.
  - origin: B-1776; B-1777; B-1778; B-1779; B-1780; B-1781; B-1782; B-1783; B-1810
  - disposition: ported
  - test: PT-108-C-123-phases

- **F108-FR-019**: The `### Work` of each phase MUST prescribe: for a unit phase, investigating only that unit and appending claims, one per line as `- <claim>` each followed by its evidence comment, to the scratch claims file of the unit, `reverse:<slug>:claims:<unit-key>` (annex B §B.5), and writing nothing under the output directory; the unit key is `root` for the unit `.`, else the unit path with every run of characters outside `A-Za-z0-9._-` replaced by `-`. For the specification phase: synthesising from the scratch claims files in an oversize run; writing `memory/constitution.md` from the constitution template with principles recovered from evidence when the source has none, and reading without copying the source's constitution when it has one; the grammar of `spec.md` (`### User Story <n> - <title> (Priority: P<n>)` numbered from 1, **Why this priority**, **Independent Test**, a Given/When/Then scenario, `- **FR-###**:` and `- **SC-###**:` lines with evidence comments); `checklists/requirements.md` with every item `[x]` or `[ ]` followed by an indented `Fails:` line with an evidence comment; and leaving no template placeholder, sample text or template comment behind. For the plan phase: `plan.md` from the plan template with a real technical context, constitution check and structure, `[REMOVE IF UNUSED]` options deleted and Complexity Tracking kept as a heading with `None`; `research.md` as `- **Decision**: ...` entries each followed by an evidence comment, then rationale and alternatives, with `unknown` for an unrecoverable rationale. For the design phase: `data-model.md` with one `### <Entity>` heading per entity each followed by an evidence comment; `contracts/*.md`, one file per external surface that exists; `quickstart.md` with commands from manifests and documents each labelled as not executed by the reverse run. For the tasks phase: every box `[x]` in mode `done` and `[ ]` in mode `open`; the phases Setup, Foundational, one per user story in priority order, and a final numbered Polish phase; every `FR-###` mentioned in at least one task description; and the marker `<!-- specstride-reverse: tasks=<mode> -->` alone on the line after the front matter, with the template's front matter kept.
  - origin: B-1789; B-1790; B-1791; B-1792; B-1793; B-1794; B-1795; B-1796; B-1797; B-1798; B-1799; B-1800; B-1801; B-1802; B-1803; B-1804
  - disposition: ported
  - test: PT-108-C-123-phase-work
  - assumption: CQ-093 (the logical name `reverse:<slug>:claims:<unit-key>` of annex B §B.5; the answer is applied in the annex, the owner has not ruled)

- **F108-FR-020**: The acceptance criteria of the phases MUST add to the two common lines: for the specification phase `No desired behavior is represented as current behavior.`; for the design phase that `data-model.md`, `quickstart.md` and at least one `contracts/*.md` exist and every quickstart command is labelled not executed; for the tasks phase that `tasks.md` passes the validation of the `spec` command in the format `speckit-tasks`; for the final phase that the analysis report exists and lists every finding with its resolution and that the lint reports zero errors at level 5. The final phase MUST write the analysis report to `reverse:<slug>:analysis`, in the shape of the `/speckit.analyze` report, and not into the output directory.
  - origin: B-1702; B-1806; B-1807; B-1808; B-1809
  - disposition: translated
  - test: PT-108-C-123-criteria; PT-108-C-121-analysis-location
  - divergence: DV-006
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F108-FR-021**: The driver spec MUST be validated with the native spec-format adapter before it is written; a failure MUST fail the plan with exit 3 and `generated driver is not a valid native spec: <errors>`, and is a defect of the product, not of the input. The driver lies in the workspace part, which the proposer can write; a change to it after launch MUST be detected through the source hashes of the run and never be silently accepted.
  - origin: B-1816
  - disposition: ported
  - test: PT-108-C-123-driver-valid; CT-108-121
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F108-FR-022**: The verification-commands document MUST have the top-level fields `schema_version` (`1.0.0`), `discovery` (`none`), `commands` and `phaseTimeouts`. For each driver phase N it MUST hold a command `lint-N` (the lint of the output directory with the source, the baseline inventory and `--upto <level>`, and for a unit phase also `--claims` with the location of `reverse:<slug>:claims:<unit-key>`; time limit 120 seconds) and a command `guard-N` (the guard over the source with the baseline inventory and the output directory; time limit 300 seconds). Each command is a fixed argument list run with the source as working directory; its executable is the product's own entry and the first argument names the component `reverse`, through the component-name table. The lint and guard commands shown in the driver MUST be the same argument lists, shell-quoted. `phaseTimeouts` MUST give 3600 seconds to every phase with lint level 0 or 1, and no entry to the others.
  - origin: B-1708; B-1814; B-1815; B-1817; B-1818; B-1819; B-1820; B-1821
  - disposition: translated
  - test: PT-108-C-121-commands-document; PT-108-C-123-commands
  - divergence: DV-066; DV-006
  - ep: EP-07 `specstride.verification-source/1` (consumes)

- **F108-FR-023**: The template directory that the driver names MUST be `.specify/templates` of the source when it exists, else the templates that the product ships.
  - origin: B-1822
  - disposition: ported
  - test: PT-108-C-123-template-dir

- **F108-FR-024**: The output directory of a reverse run MUST be the state with the logical name `reverse:<slug>:output` (annex B §B.5): it lies in the working tree outside the workspace part, the proposer is its only writer, and `reverse` and its verbs never write into it. The default output directory MUST be `specs/NNN-as-is-<slug>` of the source, with NNN three digits and one above the highest existing spec number, or 001 when `specs/` holds no numbered directory. The slug MUST be the name lower-cased, every run of characters outside `a-z0-9` replaced by `-`, leading and trailing `-` removed, cut to 40 characters and then stripped of a trailing `-`; a name with nothing usable gives `project`.
  - origin: 028 FR-025; B-1698; B-1764; B-1773; B-1774
  - disposition: ported
  - test: PT-108-028FR025-naming; PT-108-C-121-default-out; PT-108-C-123-slug
  - divergence: DV-006

- **F108-FR-025**: The plan MUST refuse an output directory, judged on real paths, with exit 3 and these messages, checked in this order: the source root itself (`--out cannot be the source root itself; choose a dedicated output folder: <out>`); outside the source (`--out must be inside the source tree <src> (got <out>)`); inside `.git` (`--out cannot be inside the project's .git directory: <out>`); inside the workspace part, or inside a directory of an old state tree of the products this one replaces, `.specstride` and `.lisa` (`--out cannot be inside the state directory <name>/: <out>`); inside `.specify` (`--out cannot be inside .specify/ (the run never touches it): <out>`); existing and not a directory (`--out exists and is not a directory: <out>`); existing, a directory and not empty (`--out already exists and is not empty: <out> (resume an existing reverse run with specstride resume --feature reverse-<slug>)`). An existing empty directory MUST be accepted, and a link that resolves outside the source MUST be refused. The name of the legacy `.wiggum` tree is not refused.
  - origin: 028 FR-025; B-1628; B-1629; B-1630; B-1631; B-1632; B-1633; B-1634; B-1775
  - disposition: ported
  - test: PT-108-028FR025-refusals; PT-108-C-120-out-refusals; CT-108-160
  - divergence: DV-006; DV-036

- **F108-FR-026**: The plan MUST refuse when phase-gate state of the feature `reverse-<slug>` exists (a record of any phase gate of the feature, `gate:<N>:approved` or `gate:<N>:evidence`), with exit 3 and `a reverse run for '<slug>' already has gate state in <logical name>; resume it with specstride resume -w <src> --feature reverse-<slug>, or pass --name`.
  - origin: B-1811
  - disposition: ported
  - test: PT-108-C-123-gate-state-refusal; CT-108-160
  - divergence: DV-006

- **F108-FR-027**: The guard MUST take the source and the baseline inventory (both required; a missing baseline is a usage error with exit 2) and the output directory (required), re-walk the source with the baseline's exclusions plus the output directory, and compare the size and content hash of every walked and skipped entry with the baseline's; the hashes MUST come from the canonical hasher (annex X §X.5). The guard MUST read the baseline by its logical name `reverse:<slug>:inventory` and through its schema `specstride.reverse-inventory/1` (annex B §B.20), and MUST NOT depend on a field that the owner of the inventory does not list. A baseline that cannot be read MUST fail with `cannot read inventory <path>: <error>` and one that is not an object with `fingerprint` and `files` with `not an inventory: <path>`, both exit 3. A baseline without the field `schema`, or with a schema id or a major that the guard does not know, MUST be refused with exit 3 as F100-FR-049 says; in compatibility output the line MUST be the as-is `not an inventory: <path>`. The comparison of single files MUST happen only when the fingerprint of the re-walk differs from the baseline's.
  - origin: 028 FR-026; B-1603; B-1616; B-1617; B-1855; B-1856
  - disposition: ported
  - test: PT-108-028FR026-guard-walk; PT-108-C-117-guard-args; PT-108-C-123-guard-compare; CT-108-161
  - divergence: DV-066; DV-116

- **F108-FR-028**: The guard MUST report a deleted file as `deleted: <path>`, an added file as `added: <path>`, a changed file as `changed: <path>`, and when the fingerprint differs and no path differs as `fingerprint differs from the baseline`. Problems MUST be de-duplicated and kept in the order first seen; paths inside each kind are sorted.
  - origin: 028 FR-026; B-1726; B-1727; B-1728; B-1729; B-1862
  - disposition: ported
  - test: PT-108-C-122-guard-problems; PT-108-C-123-guard-order

- **F108-FR-029**: The guard MUST compare the directory `testautomation/` of the source, which the walk never enters, against the baseline's snapshot: a new directory, a new file and a changed file are problems, with the suffix ` (verification output landed in the source; pass --test-plan/--generate-tests under the state dir)` (the phrase names the state directory as at the baseline); a deletion there is not reported. A baseline without a snapshot MUST report any `testautomation/` as `added: testautomation/ (...)` unless the baseline lists files under it. A baseline whose snapshot is null and a directory that now exists MUST report `added: testautomation/ (...)`.
  - origin: B-1730; B-1731; B-1857; B-1858
  - disposition: ported
  - test: PT-108-C-122-guard-testautomation; PT-108-C-123-guard-testautomation

- **F108-FR-030**: The git checks of the guard MUST run only when the baseline was walked in git mode. They MUST report `git HEAD moved: <baseline head> -> <current head>` and, for each status entry that is new since the baseline, `git status: <porcelain entry>`. An entry under the output directory or under the workspace part, and an entry equal to one in the baseline's status, MUST be exempt, so that a tree that was dirty before the run passes.
  - origin: B-1732; B-1733; B-1859; B-1860; B-1861
  - disposition: ported
  - test: PT-108-C-122-guard-git; PT-108-C-123-guard-git
  - divergence: DV-006
  - status: unverified (check: the same fixtures on a macOS runner; verified-on: —; pin: git version of the runner)

- **F108-FR-031**: The guard MUST print each problem on standard output as `guard: <problem>`; on a problem it MUST print `guard: FAILED — <n> change(s) outside <out> and the state dir` and exit 3; on none it MUST print `guard: ok — source untouched outside the output and state dirs` and exit 0. An `InventoryError` or `ReverseError` in any verb MUST be written to standard error as `reverse: <message>` and exit 3.
  - origin: B-1625; B-1626; B-1738; B-1739; B-1740; B-1627
  - disposition: ported
  - test: PT-108-C-122-guard-lines; PT-108-C-119-guard-exit

- **F108-FR-032**: The guard MUST read the working tree as a claim: as regular files and without following links, so that a link swapped in after the inventory cannot make it read outside the source. The counter files and transcripts of stub agents, which lie outside the working tree, and the control plane MUST never count as a change of the source.
  - test: CT-108-132
  - parity: as at the baseline (no link is followed at the baseline either)

- **F108-FR-033**: The micro-loop layer MUST apply to a reverse run under the same rule as to any run: only where the verification gate executes, which it does for every phase of a reverse run because each holds the commands `lint-N` and `guard-N`. Under the `parity` profile the strategy is `classic`.
  - test: CT-108-133
  - ep: EP-04 `specstride.loop-layer/1` (consumes)
  - parity: `classic` (row 1 of annex X §X.7)

- **F108-FR-034**: In default output, `reverse` and its verbs MUST print one line for a success and for a failure only the failing items, each with its fix; no command that the host skill calls between invocation and launch MUST print more than 1,120 bytes in default output or 2,240 bytes on a failure. `reverse lint` is not called by the host skill between invocation and launch; it runs as a verification command of a phase inside the engine, and its output (one as-is line per finding and a summary line, feature 140, F140-FR-003) is outside this cap. `reverse inventory` is inside it. A line of default output that names state MUST name it by logical name. Under the `parity` profile no line without an as-is equivalent MUST be printed.
  - test: CT-108-134
  - divergence: DV-034; DV-033
  - parity: no new line (row 19 of annex X §X.7)

## Requirements moved to 140-reverse-inventory-and-lint

Group G-B moved to `specs/140-reverse-inventory-and-lint`. The old ids are never reused; the sequence of this feature has the gap of F108-FR-035 to F108-FR-060, F108-SC-002, F108-SC-003 and F108-SC-005.

| Old id | New id in `140-reverse-inventory-and-lint` |
|---|---|
| F108-FR-035 | F140-FR-001 |
| F108-FR-036 | F140-FR-002 |
| F108-FR-037 | F140-FR-003 |
| F108-FR-038 | F140-FR-004 |
| F108-FR-039 | F140-FR-005 |
| F108-FR-040 | F140-FR-006 |
| F108-FR-041 | F140-FR-007 |
| F108-FR-042 | F140-FR-008 |
| F108-FR-043 | F140-FR-009 |
| F108-FR-044 | F140-FR-010 |
| F108-FR-045 | F140-FR-011 |
| F108-FR-046 | F140-FR-012 |
| F108-FR-047 | F140-FR-013 |
| F108-FR-048 | F140-FR-014 |
| F108-FR-049 | F140-FR-015 |
| F108-FR-050 | F140-FR-016 |
| F108-FR-051 | F140-FR-017 |
| F108-FR-052 | F140-FR-018 |
| F108-FR-053 | F140-FR-019 |
| F108-FR-054 | F140-FR-020 |
| F108-FR-055 | F140-FR-021 |
| F108-FR-056 | F140-FR-022 |
| F108-FR-057 | F140-FR-023 |
| F108-FR-058 | F140-FR-024 |
| F108-FR-059 | F140-FR-025 |
| F108-FR-060 | F140-FR-026 |
| F108-SC-002 | F140-SC-001 |
| F108-SC-003 | F140-SC-002 |
| F108-SC-005 | F140-SC-003 |

| Old test | New test |
|---|---|
| PT-108-C-119-exit-codes | PT-140-C-119-exit-codes |
| PT-108-C-127-inventory-exit | PT-140-C-127-inventory-exit |
| PT-108-C-117-lint-args | PT-140-C-117-lint-args |
| PT-108-C-122-lint-output | PT-140-C-122-lint-output |
| PT-108-C-123-lint-order | PT-140-C-123-lint-order |
| PT-108-C-120-evidence-skipped | PT-140-C-120-evidence-skipped |
| PT-108-028FR027-levels | PT-140-028FR027-levels |
| PT-108-C-123-levels | PT-140-C-123-levels |
| PT-108-C-120-template-rules | PT-140-C-120-template-rules |
| PT-108-C-123-template-rules | PT-140-C-123-template-rules |
| PT-108-C-120-placeholder | PT-140-C-120-placeholder |
| PT-108-C-123-placeholder-set | PT-140-C-123-placeholder-set |
| PT-108-C-120-structure | PT-140-C-120-structure |
| PT-108-C-123-contracts | PT-140-C-123-contracts |
| PT-108-C-120-evidence-fields | PT-140-C-120-evidence-fields |
| PT-108-C-123-evidence-grammar | PT-140-C-123-evidence-grammar |
| PT-108-C-120-evidence-missing | PT-140-C-120-evidence-missing |
| PT-108-C-123-claim-block | PT-140-C-123-claim-block |
| PT-108-C-120-citations | PT-140-C-120-citations |
| PT-108-C-123-citation-resolution | PT-140-C-123-citation-resolution |
| PT-108-C-120-spec-rules | PT-140-C-120-spec-rules |
| PT-108-C-123-spec-grammar | PT-140-C-123-spec-grammar |
| PT-108-C-120-design-rules | PT-140-C-120-design-rules |
| PT-108-C-123-design-claims | PT-140-C-123-design-claims |
| PT-108-C-120-tasks-rules | PT-140-C-120-tasks-rules |
| PT-108-C-123-tasks-grammar | PT-140-C-123-tasks-grammar |
| PT-108-C-120-coverage-claims | PT-140-C-120-coverage-claims |
| PT-108-C-123-coverage | PT-140-C-123-coverage |
| PT-108-C-124-inventory-verb | PT-140-C-124-inventory-verb |
| PT-108-C-125-inventory-flags | PT-140-C-125-inventory-flags |
| PT-108-C-130-inventory-path | PT-140-C-130-inventory-path |
| PT-108-C-126-limits | PT-140-C-126-limits |
| PT-108-C-128-integer-error | PT-140-C-128-integer-error |
| PT-108-C-118-context-budget | PT-140-C-118-context-budget |
| PT-108-C-131-git-walk | PT-140-C-131-git-walk |
| PT-108-C-128-git-error | PT-140-C-128-git-error |
| PT-108-C-131-file-walk | PT-140-C-131-file-walk |
| PT-108-C-131-classification | PT-140-C-131-classification |
| PT-108-C-131-entries | PT-140-C-131-entries |
| PT-108-C-129-inventory-document | PT-140-C-129-inventory-document |
| PT-108-C-131-fingerprint | PT-140-C-131-fingerprint |
| PT-108-C-131-manifests | PT-140-C-131-manifests |
| PT-108-C-131-entry-points-units | PT-140-C-131-entry-points-units |
| PT-108-C-131-specify-facts | PT-140-C-131-specify-facts |
| PT-108-C-129-summary | PT-140-C-129-summary |
| PT-108-C-131-summary-budget | PT-140-C-131-summary-budget |
| PT-108-C-132-templates-shipped | PT-140-C-132-templates-shipped |
| PT-108-C-136-spec-template-rules | PT-140-C-136-spec-template-rules |
| PT-108-C-137-tasks-template-rules | PT-140-C-137-tasks-template-rules |
| CT-108-136 | CT-140-1 |
| CT-108-137 | CT-140-2 |
| CT-108-139 | CT-140-3 |
| CT-108-141 (the byte-exact helpers) | CT-140-4 |

### Success Criteria

- **F108-SC-001**: A reverse run whose phase gates pass has changed 0 files outside its output directory and the workspace part; the fingerprint of the source tree is equal before and after every reverse fixture, and the guard exits 0 on every one of them.
  - origin: 028 SC-006
  - disposition: ported
  - test: PT-108-028SC006-source-untouched
  - divergence: DV-006

- **F108-SC-004**: In 100 per cent of the fixtures of FX-30, findings and invalid input end with exit 3, a usage error with exit 2, and a success with exit 0.
  - test: CT-108-138

- **F108-SC-006**: From the invocation of `specstride-reverse` to the launch, the commands that the skill calls print at most 1,120 bytes each in default output; together with the skill text the total stays within the budget of the host skill `specstride-reverse` of annex G §G.5 (F100-FR-187), 7,000 tokens at 2.8 bytes per token.
  - test: CT-108-140

### Key Entities *(include if feature involves data)*

- **Source**: the tree to reverse; read-only.
- **Reverse run**: the logical run of the feature `reverse-<slug>`; one slug per source and name.
- **Inventory**: the record of every file of the source with size, hash, language and role, the project facts, the fingerprint and the git state; the baseline of the guard. It is the record `specstride.reverse-inventory/1` of annex B §B.20 and carries the field `schema`.
- **Inventory summary**: the readable, size-capped rendering of the inventory for the proposer.
- **Plan**: the driver spec, the verification-commands document and the JSON that describes them.
- **Driver spec**: the native-format spec with the phases that the gated loop runs.
- **Output feature**: the as-is Spec Kit feature directory that the run writes.
- **Guard problem**: a difference between the source now and the baseline inventory.

## Constraints

Set by the owner. They are not implementation detail to be removed.

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
| The skill is named `specstride-reverse` | Prompt section 0 |

## Extension points

Feature 108 owns no extension point. It implements none and consumes these.

| EP | Id and version | Use | Requirements |
|---|---|---|---|
| EP-01 | `specstride.host/1` | The CLI protocol that the host skill calls (annex G §G.1) | F108-FR-001 |
| EP-03 | `specstride.spec-format/1` | The driver spec must be a valid native spec; the tasks criterion of the driver names the validation of `speckit-tasks` | F108-FR-007, F108-FR-020, F108-FR-021 |
| EP-04 | `specstride.loop-layer/1` | The micro-loop layer applies where the verification gate executes | F108-FR-033 |
| EP-07 | `specstride.verification-source/1` | The verification-commands document is a source of declared commands | F108-FR-022 |
| EP-17 | `specstride.detach/1` | The detach strategy of the run request of kind `engine` | F108-FR-009 |

## Contracts of feature 100 used

| Contract | Annex and section | Requirements |
|---|---|---|
| Run request of kind `engine`; handshake outcomes; process model | F §F.1, §F.2, §F.3 (F100-FR-155, F100-FR-159, F100-FR-160) | F108-FR-009 |
| CLI protocol, commands, output modes, line grammar | G §G.1, §G.2, §G.3 (F100-FR-170, F100-FR-175 to F100-FR-178) | F108-FR-001, F108-FR-034 |
| Exit codes per command | G §G.4 (F100-FR-182), rows `reverse`, reverse plan, lint, guard, reverse inventory | F108-FR-004, F108-FR-006, F108-FR-031 |
| Token budgets | G §G.5 (F100-FR-187) | F108-FR-034, F108-SC-006 |
| Logical names `reverse:<slug>:inventory`, `:inventory-summary`, `:driver`, `:verification-commands`, `:analysis`, `:output`, `:claims:<unit-key>`, `:test-plan`, `:scaffolds`, `gate:<N>:approved`, `gate:<N>:evidence`; state layout | B §B.1, §B.2, §B.5 (F100-FR-032 to F100-FR-038, F100-FR-053) | F108-FR-007, F108-FR-014, F108-FR-015, F108-FR-019, F108-FR-020, F108-FR-022, F108-FR-024, F108-FR-025, F108-FR-026 |
| The source inventory as a record: schema id `specstride.reverse-inventory/1`, read by logical name and through its schema | B §B.4, §B.20 (F100-FR-048, F100-FR-049, F100-FR-227) | F108-FR-027 |
| Canonical hasher | X §X.5 | F108-FR-027 |
| Canonical spec model and spec-format adapter | C §C.7 (F100-FR-095) | F108-FR-021 |
| Verification-plan source | C §C.9 (F100-FR-101) | F108-FR-022 |
| Closed sets; the `parity` profile; normalization contract | X §X.6, §X.7, §X.8 (F100-FR-208, F100-FR-212, F100-FR-213, F100-FR-214) | "Closed sets", "Rows of the `parity` profile" |
| Micro-loop layer rule; no new run state, exit code or stop reason | A §A.5 (F100-FR-031) | F108-FR-033 |

Placement of the reverse files by feature 100 (annex B §B.5). Every name below is a row of annex B §B.5:

| Logical name | Root | Confirmed | Note |
|---|---|---|---|
| `reverse:<slug>:inventory` | control | Yes | The baseline of the guard lies where the proposer cannot write. Written by the CLI at `plan`, before any runtime exists, which F100-FR-003 allows for the records of a reverse plan (CQ-092) |
| `reverse:<slug>:verification-commands` | control | Yes | Read by the engine only; same note |
| `reverse:<slug>:inventory-summary`, `:driver`, `:analysis` | workspace | Yes | The proposer reads the first two and writes the third. The driver is writable by the proposer; a change is detected through the source hashes of the run (F108-FR-021) |
| `reverse:<slug>:claims:<unit-key>` | workspace | Yes | The scratch claims file of a unit phase. Writer the proposer, reader the reverse lint (F108-FR-019, F108-FR-022) |
| `reverse:<slug>:test-plan`, `reverse:<slug>:scaffolds` | workspace | Yes | The plan of tests and the scaffolds of a reverse run. Writer the engine, reader the proposer. A reverse run never uses `feature:<slug>:verification:test-plan` and `:scaffolds`, which lie in the working tree outside the workspace part, where a write would land in the source (F108-FR-007, F108-FR-015) |
| `reverse:<slug>:output` | workspace (the working tree, outside the workspace part) | Yes | The as-is specification that the run writes. Writer the proposer, reader the consumer (F108-FR-024) |

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-1763 (C-123) | The state directory name is resolved silently, the notice of the legacy directory going to a discarded stream | DV-036 |

Parts of kept items that are not carried (the items are kept, `translated`): the legacy-prefixed fallback of B-1619 (DV-036), and the legacy state directory name in B-1631 (DV-036). `.specstride` and `.lisa` stay refused, as names of old trees.

## Closed sets

Feature 108 owns these closed sets, so that rows can be added to annex X §X.6 (F100-FR-208). An unknown value read from outside is refused with a message that names the set and the value, unless the row says otherwise. The closed sets of the inventory and of the lint (finding codes, severities, levels, evidence kinds and validations, walk modes, skip reasons, roles, entry-point kinds, languages, schema of the inventory, which is `specstride.reverse-inventory/1` of annex B §B.20) are owned by `140-reverse-inventory-and-lint`.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Tasks modes | `done`, `open` | 108 | Design | Exit 3 |
| Kinds of guard problem | `deleted`, `added`, `changed`, `fingerprint differs`, `git HEAD moved`, `git status` | 108 | Design | Not applicable: the guard writes them |

## Rows of the `parity` profile

Feature 110 owns the spelling of every key. These have their final rows of annex X §X.7. Every value under `parity` is the one that reproduces the baseline.

| Switch or option | Key or flag | Default | Under `parity` | Register row | Row of §X.7 |
|---|---|---|---|---|---|
| Run the reverse run detached (F108-FR-009) | the flag `--detach` of `reverse` | off; the host skill passes it | off | none needed | 66 |
| The consumer's comment (F108-FR-010) | the flag `--comment` of `reverse` | absent | not used | none needed | 67 |
| Tasks mode (F108-FR-011) | `reverse.tasks` | `done` | `done` | DV-027 | 68 |
| Commit switch of a reverse run (F108-FR-008) | `loop.gitCommits`, set off by the run | `auto` (the key's default); a reverse run sets it off at the rank of a flag | off in a reverse run, as at the baseline | DV-027 | none; not a switch of this feature (the key has the alias `SPECSTRIDE_GIT_COMMITS` of §X.8) |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify`, answered from the sources. No question was put to a person.

- Q: Does `specstride reverse` detach by default, since ruling 25 lets reverse run through a run request of kind `engine`? → A: No. The command keeps the baseline: it runs the engine in the foreground. The flag `--detach` makes the run request, and the host skill always passes it. This keeps the baseline reproducible without a register row. (Source: `APPROVAL.md` ruling 25; F100-FR-159; annex F §F.2; assumption CQ-090)
- Q: Where do the reverse files lie? → A: As annex B §B.5 places them: the inventory and the verification commands in the control plane, the inventory summary, the driver and the analysis report in the workspace part, the output in the working tree. Confirmed, with the caveat on the driver. The scratch claims file, the plan of tests and the scaffolds have the names `reverse:<slug>:claims:<unit-key>`, `reverse:<slug>:test-plan` and `reverse:<slug>:scaffolds` of annex B §B.5, in the workspace part. (Source: annex B §B.5; the brief's note of the orchestrator; CQ-093)
- Q: Which exit code does `reverse` give when the plan fails? → A: 3, the code of every `ReverseError`. (Source: consolidation section 3.6; B-1480, B-1627)
- Q: Are the two dispositions `superseded-by DV-036` items carried? → A: No; B-1763 is listed (B-1914 went with group G-B) under "As-is behaviour not carried". The old-tree names `.specstride` and `.lisa` stay refused and never walked. (Source: traceability rows; DV-036; N-28)
- Q: How is the control plane treated by the guard? → A: It lies outside the working tree, so it is never walked; stub counters are outside the working tree as well. (Source: annex B §B.1; R18 O-3 rule 1)
- Q: What is the spelling of the verbs and of the comment argument? → A: `plan`, `lint`, `guard`, `inventory`; `--comment`. (Source: annex G §G.1, which names the four verbs and both flags; assumption CQ-091)
- Q: Does the dry run write the plan files? → A: Yes, as the baseline: the plan runs and only the launch is withheld. (Source: B-1446, B-1600; annex G §G.1 `launch --dry-run`; Principle XV) Integrated in F108-FR-005.
- Q: What happens when a second reverse run meets a held workspace lock? → A: The engine exits 5 in the foreground. Detached, the handshake ends with the outcome of annex F §F.3: `attached` (exit 4) when a live run holds the lock; `refused` with exit 24 for `lock-conflict` and `lock-unknown`. (Source: F100-FR-156, F100-FR-160, annex F §F.3) Integrated in F108-FR-009.
- Q: Relative to what is `--out` made absolute? → A: The current directory, as `abspath` at the baseline. (Source: B-1611) Integrated in F108-FR-013.
- Q: Who resumes a reverse run that stopped? → A: The command `resume --feature reverse-<slug>` of the run-control feature, through contract annex G §G.4; feature 108 only names it in the refusal message. (Source: B-1634, B-1811)
- Q: How many requirements does the feature have, and what happened to group G-B? → A: 60 functional requirements and 6 success criteria were specified, above 45. The split proposed along G-A and G-B was made: this feature keeps F108-FR-001 to F108-FR-034 and F108-SC-001, SC-004, SC-006; the rest moved. (Source: brief 108, heading 7; `STAGE-B-SPLIT-PROMPT.md`)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary; this specification repeats no definition.
- The rows of the divergence register that this specification cites exist.
- Where the as-is specification and the baseline code disagree, the code is what parity means; the behaviour items come from the code.
- The engine, the critic, the grounding and the phase gates are specified by other features and are reached through the contracts of feature 100.

| Id | Question | Reading this specification proceeds on | Requirements |
|---|---|---|---|
| CQ-090 | Does `reverse` detach by default, and what is the flag? | `--detach`; foreground without it | F108-FR-009 |
| CQ-091 | The spelling of the comment argument and of the verbs of `reverse` | `--comment`; `plan`, `lint`, `guard`, `inventory` | F108-FR-010, F108-FR-012 |
| CQ-092 | The CLI writes two control-plane names of reverse at `plan` | The row of annex B §B.5 stands; F100-FR-003 names the records of a reverse plan among the files the CLI writes | F108-FR-014 |
| CQ-093 | Logical names for the scratch claims file, the plan of tests and the scaffolds of a reverse run | The three names of annex B §B.5 (answer applied in the annex on 2026-09-30) | F108-FR-007, F108-FR-015, F108-FR-019, F108-FR-022 |

## Repairs after the cross-feature review

Dated 2026-09-30. No id was renumbered or reused. No requirement was added. The test names CT-108-142 and CT-108-160 were in `tasks.md` and in no `test:` line; CT-108-161 and CT-108-162 are new.

| Requirement or place | Item | What changed |
|---|---|---|
| F108-FR-003 | W-X-06 | "engine start" for "engine invocation" |
| F108-FR-004 | W-X-20 | `test:` gains CT-108-160, the test of the task T026 |
| F108-FR-007 | W-X-06; W-X-10 | "one engine start"; the plan of tests and the scaffolds are named `reverse:<slug>:test-plan` and `reverse:<slug>:scaffolds` (annex B §B.5); `assumption: CQ-093` |
| F108-FR-008 | W-X-06 | "engine start" for "engine invocation" |
| F108-FR-009 | W-108-01; W-X-06; W-X-20 | Detached, a held lock gives the outcome of annex F §F.3: `attached` (exit 4) for a live run, `refused` with exit 24 for `lock-conflict` and `lock-unknown`; "one engine start"; `test:` gains CT-108-142 (the test of the task T020) and CT-108-162; the note of CQ-090 says that annex G §G.1 names the flag |
| F108-FR-010, F108-FR-012 | — | The note of CQ-091 says that annex G §G.1 names the verbs and the flags |
| F108-FR-014 | — | The note of CQ-092 says that F100-FR-003 allows the records of a reverse plan |
| F108-FR-015 | W-X-10; W-X-25 | `out`, `test_plan` and `generate_tests` are the locations of `reverse:<slug>:output`, `reverse:<slug>:test-plan` and `reverse:<slug>:scaffolds`; the note of CQ-093 |
| F108-FR-019 | W-X-10 | The scratch claims file is `reverse:<slug>:claims:<unit-key>`; `assumption: CQ-093` |
| F108-FR-022 | W-X-10 | `--claims` takes the location of `reverse:<slug>:claims:<unit-key>` |
| F108-FR-024 | W-X-25 | The output directory is the state `reverse:<slug>:output`, written by the proposer only |
| F108-FR-025, F108-FR-026 | W-X-20 | `test:` gains CT-108-160 |
| F108-FR-027 | W-ORC-03 (register row DV-116); W-104-01 | The baseline is read by its logical name and through the schema `specstride.reverse-inventory/1`; a baseline without the field `schema` or with an unknown schema id is refused; the hashes come from the canonical hasher; `divergence:` gains DV-116; `test:` gains CT-108-161 |
| F108-SC-006 | W-X-33 | The budget is cited as annex G §G.5 (F100-FR-187); the other feature is no longer named |
| "Contracts of feature 100 used" | W-X-10; W-X-25 | The three names and `:output` are rows of annex B §B.5; no name is "missing" or "proposed"; rows for the inventory record and the canonical hasher |
| "Rows of the `parity` profile" | W-100-04 | The row of `loop.gitCommits` has "none; not a switch" in the column of §X.7; the header "Key or flag" without "(proposed)" |
| "Clarifications" | W-108-01; W-X-10 | The answers on the held lock, on the place of the files and on the spelling of the verbs |
| "Assumptions" | — | The register is named without a count |
| `tasks.md` T005 to T008, T010, T020, T021, T024 | W-X-20 | Every test name of a `test:` line of this feature is named in the task that runs it; the task name `PT-108-028FR026-guard` of T021 is written `PT-108-028FR026-guard-walk`, as the `test:` line of F108-FR-027 says |
| `tasks.md` T031 (new) | W-X-20 | A task for CT-108-161, which had none |
| `contracts/plan-output.schema.json`, `contracts/verification-commands.schema.json` | W-100-16 | `$id` written as `urn:specstride:schema:internal:108:reverse-plan/1` and `urn:specstride:schema:internal:108:reverse-verification-commands/1`; the two schema ids are in no annex, so the internal form of `contracts/README.md` of feature 100 applies |
| `research.md` | W-X-30 | The baseline is named as "the Specstride baseline at `9cab15d`" without a machine path; the table "Gaps in feature 100, reported" states which gaps are settled |
| `data-model.md` | W-X-06 | "engine start" for "engine invocation" in the state `launched` |
| "Rows of the `parity` profile" | B-8.7 | The row of `loop.gitCommits` gives the key's default `auto` (annex X §X.8; the key list of feature 110) and says that a reverse run sets it off; it had "off" as the default |
| `tasks.md` T010, T019 to T027, T031; `plan.md` | B-8.7 | The own tests move from `packages/reverse/test/` to `tests/characterization/108/`, the directory of feature 100; T032 (new) runs the tests on the macOS runner and records skips with their reasons (Principle XVII); plan row XVII cites it |
