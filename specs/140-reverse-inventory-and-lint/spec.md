# Feature Specification: Reverse inventory and lint

**Feature Branch**: `140-reverse-inventory-and-lint` (a label: Spec Kit creates no branch in this repository; the directory is `specs/140-reverse-inventory-and-lint`)

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Feature 140-reverse-inventory-and-lint of Specstride, the second part of the split of feature 108-reverse (group G-B): the source inventory with its fingerprint and manifests, the reverse lint with its finding codes per level, and the Spec Kit templates that the product ships."

**Sources**: `docs/ecosystem/APPROVAL.md` (the authority), `architecture.md`, `consolidation.md`, `feature-briefs.md` (brief 108-reverse, heading 7, group G-B), `STAGE-B-RULES.md`, `STAGE-B-SPLIT-PROMPT.md`, the constitution v3.0.0 (v3.0.1 since 2026-09-30; the patch adds one sentence to Principle IX, the weaker proof, CQ-182), feature 100 (`specs/100-specstride/`), feature 141 (`specs/141-parity-oracle/`), and the as-is specification `old/028-as-is-specstride/`.

## Overview

Reverse specification turns a source tree into an as-is Spec Kit feature. This feature holds two of its deterministic parts and the templates. The **inventory** records every file of the source with size, hash, language and role, the facts of its manifests, its entry points and units, a fingerprint and the git state, and renders a size-capped summary for the proposer. The **lint** checks a produced feature directory level by level against the shipped templates, the evidence comments, the citations and the task grammar, and gives every finding a code of a closed family. The product also ships the five Spec Kit templates that the lint reads when the source has none.

The wrapper, the plan, the driver spec, the guard and the run request are specified by the feature `108-reverse` and are reached only through the CLI commands and logical names of feature 100 (annex G §G.1 and §G.4, annex B §B.5).

**In scope**: the verbs `reverse lint` and `reverse inventory`; the inventory document, its fingerprint, its summary and its limits; the lint, its levels and its closed family of finding codes; the Spec Kit templates that the product ships.

**Out of scope**:

| Out of scope | Owner |
|---|---|
| The wrapper, the plan, the driver spec, the guard, the run request of kind `engine` | 108 |
| The gated loop that runs the driver spec | 101, 103 |
| The host skill text and its token budget | 113 |
| The hashing primitive | 104 |
| Spec-format parsing of the produced feature | 104 |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check a produced specification with the lint (Priority: P1)

A consumer, or a verification command of a phase, runs the reverse lint on a feature directory at a level from 0 to 5. Each level checks the artifacts it owns against the templates, the evidence comments and the task grammar. Every finding names a code of a closed family.

**Why this priority**: The verification gate of each reverse phase executes the lint. Without it no phase can be approved.

**Independent Test**: For each finding code, a fixture feature directory raises exactly that code and the lint exits 3; a clean directory exits 0.

**Acceptance Scenarios**:

1. **Given** a feature directory with a leftover template placeholder, **When** the lint runs, **Then** the output line carries the code `placeholder` and the exit code is 3 (F140-FR-006, F140-FR-001).
2. **Given** a directory that has only warnings, **When** the lint runs, **Then** it exits 0 (F140-FR-001).
3. **Given** the option `--json`, **When** the lint runs, **Then** the output is one object with the lists `errors` and `warnings` (F140-FR-003).

---

### User Story 2 - Inventory a source tree deterministically (Priority: P1)

The inventory is the baseline against which a source is later compared and the ground truth of what exists. Two inventories of the same tree are byte-identical, and the fingerprint equals the baseline's.

**Why this priority**: A guard that compares against an inventory that drifts, or a citation resolved against a wrong file list, would let a change of the source go unseen.

**Independent Test**: Two `inventory` runs over one fixture tree give byte-identical documents, and the fingerprint equals the reference's on every fixture of family FX-30.

**Acceptance Scenarios**:

1. **Given** a source in a git work tree, **When** the inventory runs, **Then** it walks in git mode; **Given** a subdirectory of a repository, **Then** it walks the file system (F140-FR-017).
2. **Given** a path with non-ASCII characters, **When** the inventory runs, **Then** order, serialization and fingerprint equal the baseline's (F140-FR-021).
3. **Given** a file with a NUL byte, over the file limit, or a link that leaves the source, **When** the inventory runs, **Then** it is skipped with a reason and still fingerprinted (F140-FR-020).

---

### User Story 3 - Reverse a large repository unit by unit (Priority: P2)

When the total text of the source exceeds the limit, the inventory is `oversize` and lists the units of work that the plan turns into phases.

**Why this priority**: Without units a large repository cannot be reversed in bounded phases.

**Independent Test**: A fixture with a total text size over the limit gives an inventory with `oversize` true and one unit per workspace package or top-level directory.

**Acceptance Scenarios**:

1. **Given** total text bytes strictly greater than the limit, **When** the inventory runs, **Then** `oversize` is true (F140-FR-021).
2. **Given** a source with workspaces, **When** the inventory runs, **Then** the units are the workspace packages plus `.` (F140-FR-023).

---

### Edge Cases

- The source has no git repository, or is a subdirectory of one: the inventory uses the file-system walk (F140-FR-017).
- A file has a NUL byte, is over the file limit, or is a link that leaves the source: it is skipped with a reason and still fingerprinted (F140-FR-020).
- A path holds non-ASCII characters: order, serialization and fingerprint equal the baseline's (F140-FR-021).
- A citation points into the output directory or the workspace part: rejected as a generated artifact (F140-FR-010).
- The lint runs without a source: only the presence of evidence comments is checked and the warning `evidence.skipped` is raised (F140-FR-003).
- A source that already has a constitution: `memory/constitution.md` in the output is an extra file (F140-FR-007).
- The runtime has no reader for TOML: TOML manifests yield no parsed facts (F140-FR-022).

## Requirements *(mandatory)*

### Functional Requirements

Feature 140 is group G-B of the split of `108-reverse`. The ids are new; the table under "Ids before the split" maps them.

- **F140-FR-001**: The verbs `lint` and `inventory` MUST exit 0 on success, 2 on a usage error, and 3 for findings and for invalid input alike (this is the one code for both, as at the baseline, and the code of the verbs `plan` and `guard` too, annex G §G.4). `lint` MUST exit 3 when at least one finding has the severity error and 0 otherwise; warnings alone never fail it. The verb `inventory` MUST exit 0, 2 or 3 with 3 for invalid input, and print `reverse-inventory: <message>` on standard error; as an internal call it returns the same code as the `exit_code` of a result record.
  - origin: B-1621; B-1622; B-1624; B-1871; B-1872
  - disposition: ported
  - test: PT-140-C-119-exit-codes; PT-140-C-127-inventory-exit

- **F140-FR-002**: `lint` MUST take the feature directory (a missing one fails with `feature directory not found: <dir>`, on standard error as `reverse: ...`, exit 3), `--upto N` (default 5; a value outside 0 to 5 fails with `--upto must be one of 0, 1, 2, 3, 4, 5`, exit 3; a non-integer is a usage error, exit 2), `--baseline INV` (citations resolve against the inventory's file list and line counts instead of the live file system; a document that is not an object with `fingerprint` and `files` fails with `not an inventory: <path>`, exit 3), `--src SRC` (enables the evidence checks against the source; a non-directory fails with `--src is not a directory: <src>`, exit 3), `--claims FILE` (also lints a scratch claims file) and `--json`.
  - origin: B-1604; B-1607; B-1608; B-1609; B-1610; B-1613; B-1614; B-1615
  - disposition: translated
  - test: PT-140-C-117-lint-args
  - divergence: DV-066

- **F140-FR-003**: Every finding MUST have a code of the closed family of "Closed sets", a severity, a file, an optional line and a message. Text output MUST be `ERROR <file>[:<line>] [<code>] <message>` for an error and `warn  <file>[:<line>] [<code>] <message>` for a warning, with `-` for a finding without a file, sorted by file, line, code and message (errors before warnings), followed by the line `<E> error(s), <W> warning(s)`. With `--json` the output MUST be one object `{errors, warnings}`, indented by one space with sorted keys, each finding with `code` (named `rule` at the baseline), `file`, `line` and `message`, and no summary line. Without `--src` the lint MUST raise the warning `evidence.skipped` (`no --src: evidence citations were not checked`), require and forbid no constitution, and take templates from the shipped copy only.
  - origin: B-1694; B-1734; B-1735; B-1736; B-1823; B-1849
  - disposition: ported
  - test: PT-140-C-122-lint-output; PT-140-C-123-lint-order; PT-140-C-120-evidence-skipped
  - parity: as at the baseline (the field `rule` of `--json` is kept in compatibility output)

- **F140-FR-004**: The lint levels MUST be cumulative: `--upto N` checks every artifact owned by the levels 1 to N and neither requires nor lints the artifacts of higher levels. Level 0 owns no artifact (it is the level of the unit phases of an oversize run, which write only a scratch claims file that `--claims` checks). Level 1 owns `spec.md`, `checklists/requirements.md` and `memory/constitution.md`; level 2 `plan.md` and `research.md`; level 3 `data-model.md`, the directory `contracts/` and `quickstart.md`; level 4 `tasks.md`; level 5 no new artifact, and adds the coverage of every requirement of `spec.md` by `tasks.md`. The feature layout is `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `tasks.md`, `checklists/requirements.md`, `memory/constitution.md` and `contracts/*.md` as the only pattern. Template-driven checks apply to the five artifacts `spec.md`, `plan.md`, `tasks.md`, `checklists/requirements.md` and `memory/constitution.md`, each against its template.
  - origin: 028 FR-027; B-1741; B-1742; B-1743; B-1744; B-1745; B-1746; B-1747; B-1748; B-1851
  - disposition: ported
  - test: PT-140-028FR027-levels; PT-140-C-123-levels

- **F140-FR-005**: The template rules MUST load templates from `.specify/templates/` of the source first and from the shipped copy otherwise; required headings are never listed in the code. Only `## ` headings outside fenced code blocks count, after the front matter is stripped, in template and artifact alike, compared after normalization (annotations `*(...)*` removed, emoji and ornaments replaced by spaces, whitespace collapsed, lower-cased). A template heading marked `*(mandatory)*` is required and raises `template.mandatory` (`missing mandatory section '## <heading>' (from <template>)`); a heading marked `*(optional)*`, `*(include if ...)*`, `OPTIONAL` or `[REMOVE IF UNUSED]` gives no rule; a heading with a `[placeholder]` is a family (each bracket matches any text; identical patterns are merged) and raises `template.family` (`no section matches the template family '## <heading>' (from <template>)`); headings `Phase <n>:` collapse into one phase family that any artifact heading `phase <digits>:` satisfies (`no '## Phase <n>:' section (the template's phase family, from <template>)`); every other heading is expected and raises the warning `template.expected` (`expected section '## <heading>' is missing (from <template>)`). A heading with a sample `User Story <n>` and no bracket matches any story number and only warns. A family cannot be satisfied by a heading that an explicit heading already accounts for. A template path in a message is printed relative to the root of the product when shipped, else in full.
  - origin: B-1636; B-1637; B-1638; B-1639; B-1824; B-1825; B-1826; B-1827; B-1828; B-1829; B-1830; B-1831; B-1832; B-1833; B-1834; B-1835
  - disposition: ported
  - test: PT-140-C-120-template-rules; PT-140-C-123-template-rules
  - divergence: DV-066

- **F140-FR-006**: The placeholder rule MUST raise `placeholder` per line for the seven fixed patterns `[FEATURE NAME]`, `[###-feature-name]`, `$ARGUMENTS`, `ACTION REQUIRED`, `[DATE]`, `__SPECKIT_COMMAND_*__` and `[e.g., ...]` (`template placeholder <label> left in the artifact`); for an upper-case bracket token of three or more characters that also occurs in the artifact's template (`[US<n>]` is exempt); and for a template comment of more than 20 characters copied verbatim inside an artifact comment, after whitespace normalization (`template HTML comment copied verbatim: <!-- <first 60 chars>... -->`). `research.md`, `data-model.md`, `quickstart.md` and each `contracts/*.md` MUST get the fixed-pattern check only, when their level owns them.
  - origin: B-1640; B-1641; B-1642; B-1761; B-1852
  - disposition: ported
  - test: PT-140-C-120-placeholder; PT-140-C-123-placeholder-set

- **F140-FR-007**: The structure rules MUST raise `structure.extra` (`not part of the Spec Kit feature layout`) for any file of the feature directory outside the layout at every level including 0, `structure.contracts` (`contracts/ holds no .md contract`) at level 3 and above, and `structure.required` (`required at --upto <N> but missing`) for each owned artifact that is absent. A contract is a file `contracts/<name>.md` directly inside `contracts/`; a nested file is an extra. When the source already has a constitution, `memory/constitution.md` in the output MUST be `structure.extra` with the suffix `(the source already has .specify/memory/constitution.md)`.
  - origin: B-1643; B-1644; B-1645; B-1836; B-1837
  - disposition: ported
  - test: PT-140-C-120-structure; PT-140-C-123-contracts

- **F140-FR-008**: The evidence comment MUST be one line `<!-- evidence: <citations> | kind=... | confidence=... | contradicts=... | validation=... -->`. Several citations are separated by a comma and a space; an empty field reports `no citation`. `kind` MUST be `observed`, `inferred` or `declared` (`evidence.kind`: `kind=desired is forbidden in as-is artifacts`; else `kind must be observed, inferred or declared (got '<v>')`); `confidence` MUST match `0.dd` or `1.00` (`evidence.confidence`: `confidence must be in [0,1] with two decimals (got '<v>')`); `validation` MUST be `verified`, `unverified` or `disproved` (`evidence.validation`: `validation must be verified, unverified or disproved (got '<v>')`); fewer or more than five fields, or a field out of order or misnamed, is `evidence.format` (`evidence comment needs 5 '|'-separated fields (citations | kind= | confidence= | contradicts= | validation=)`; `field '<part>' must be '<key>=...'`); a requirement line of `spec.md` with `disproved` is `evidence.disproved` (`a disproved requirement must be removed, not kept`); a problem in the first field is `evidence.citation`, and `contradicts=` is checked like it unless its value is `none` (`evidence.contradicts`). Every evidence comment of a linted file MUST be validated, whether or not it is attached to a claim.
  - origin: B-1651; B-1652; B-1653; B-1654; B-1655; B-1656; B-1657; B-1658; B-1659; B-1749; B-1750; B-1751; B-1752; B-1753; B-1840; B-1843
  - disposition: ported
  - test: PT-140-C-120-evidence-fields; PT-140-C-123-evidence-grammar

- **F140-FR-009**: A claim MUST have an evidence comment on the line after it: the line after the claim block must start with `<!--` (`evidence.missing`: `<what> has no evidence comment on the line after it`). A claim block extends over wrapped continuation lines and ends at a blank line, at a line starting with `<!--`, `#`, `- `, `* `, `|`, a code fence or `<n>. `, or at the next claim. An unverified claim below 0.50 confidence in `spec.md` MUST raise the warning `unknowns.placement` (`unverified claim below 0.50 confidence belongs under Assumptions, not among the <section>`). Without `--src` only the presence of evidence comments is checked.
  - origin: B-1663; B-1664; B-1841; B-1842
  - disposition: ported
  - test: PT-140-C-120-evidence-missing; PT-140-C-123-claim-block

- **F140-FR-010**: A citation MUST be `path:START` or `path:START-END`, the path without whitespace, comma or `|` (`citation '<c>' is not path:START[-END]`). It MUST be rejected when absolute, that is a path starting with `/` or a drive letter (`absolute path (cite it SRC-relative)`); when it escapes the source (`path escapes the source tree`); when it lies in the output directory inside the source or in the workspace part (`cites a generated artifact under <root>/, not the source`); when it resolves in more than one workspace package (`ambiguous across workspace packages: <hits>`); when the file does not exist (`no such file in the source`); when the file is not a text file that the inventory counted (`<path> is not a text file the inventory counted (<reason>)` for a binary, oversize or link-escape entry); or when the range is outside the file (`line range outside <path> (1-<count>)`, when START < 1, END < START or END > line count). A path MUST be tried source-relative first and then relative to each workspace package, and exactly one workspace hit resolves it. With a baseline a path exists when it is in the inventory's files or skipped entries; without one the live file system is used and workspaces are the non-root directories that hold a `package.json`.
  - origin: B-1646; B-1647; B-1648; B-1649; B-1650; B-1660; B-1661; B-1662; B-1838; B-1839; B-1850
  - disposition: ported
  - test: PT-140-C-120-citations; PT-140-C-123-citation-resolution
  - divergence: DV-006

- **F140-FR-011**: The rules for `spec.md` MUST be: a requirement line is `- **FR-ddd**: <text>` and a criterion line `- **SC-ddd**: <text>`, at column 0, three digits (`spec.fr-format`, `spec.sc-format`: `FR must be written '- **FR-###**: ...' with a 3-digit id`); ids are unique (`spec.fr-unique`, `spec.sc-unique`: `FR-<id> duplicates line <n>`); a story heading is `### User Story <n> - <title> (Priority: P<n>)` and may carry a target emoji suffix after the priority (`spec.story-format`: that message, and `no '### User Story <n> - ...' found`); story numbers run 1 to k in order (`spec.story-numbers`); each story has **Why this priority**, **Independent Test** and a Given/When/Then scenario (`spec.story-parts`); more than 3 `[NEEDS CLARIFICATION` markers are `spec.clarifications`. Claims are the lines that start `- **FR-<digits>**` or `- **SC-<digits>**`.
  - origin: B-1665; B-1666; B-1667; B-1668; B-1669; B-1670; B-1671; B-1672; B-1755; B-1756; B-1757; B-1762; B-1844
  - disposition: ported
  - test: PT-140-C-120-spec-rules; PT-140-C-123-spec-grammar

- **F140-FR-012**: The rules for the design artifacts MUST be: a research claim is a line that starts, after an optional bullet, with `**Decision**` (`research.decisions`: `no '**Decision**' entry (Decision / Rationale / Alternatives)`); a data-model claim is every heading of exactly level 3, each needing an evidence comment on the next line (warning `data-model.entities`: `no '### <Entity>' heading`); a checklist item is a line `- [ ] `, `- [x] ` or `- [X] ` at column 0, and `checklist.items` reports an unchecked item without an indented `Fails:` note, a `Fails:` note without an evidence comment, and no items at all.
  - origin: B-1673; B-1674; B-1675; B-1676; B-1677; B-1759; B-1760; B-1845
  - disposition: ported
  - test: PT-140-C-120-design-rules; PT-140-C-123-design-claims

- **F140-FR-013**: The rules for `tasks.md` MUST be: a task line is `- [ |x|X] Tddd`, then optional ` [P]`, then optional ` [USn]` in that order, then a description that does not start with another marker, the id being exactly three digits (`tasks.line-format`: `task must be '- [ ] T### [P]? [USn]? description'`); each error of the validation of the format `speckit-tasks` by the spec-format adapter is reported as `tasks.grammar`; ids are unique and increasing (`tasks.ids`); the first phase is Setup, the second Foundational, the last Polish, at least three phases hold tasks, a phase between them names a user story, and story phases are in priority order (`tasks.phase-order`); a `[US<n>]` label is only inside a story phase and only in the phase of that story (`tasks.story-labels`) and names a story that `spec.md` has (`tasks.story-exists`); two `[P]` tasks of one phase must not name the same path (`tasks.parallel-files`), where a path is a backticked token, a `dir/file.ext` token or a `dir/` token and never an id or a URL; the marker `<!-- specstride-reverse: tasks=<mode> -->` sets the mode, without it no box-state check is made, and a task box that contradicts the mode is `tasks.mode` (`tasks=done but this task is not [x]`, `tasks=open but this task is ticked`, `unknown tasks mode '<v>'`). Checkbox lines inside fenced code and inside the front matter MUST be ignored, and phase-order checks consider only numbered `## Phase <n>` sections that hold a task.
  - origin: B-1678; B-1679; B-1680; B-1681; B-1682; B-1683; B-1684; B-1685; B-1686; B-1687; B-1688; B-1689; B-1690; B-1691; B-1692; B-1693; B-1754; B-1758; B-1846; B-1847; B-1848
  - disposition: ported
  - test: PT-140-C-120-tasks-rules; PT-140-C-123-tasks-grammar
  - ep: EP-03 `specstride.spec-format/1` (consumes)

- **F140-FR-014**: At level 5 and above, every `FR-ddd` of `spec.md` MUST be mentioned as `FR-ddd` in at least one task description, else `coverage.fr` (`FR-<id> is not covered by any task`); the check MUST NOT run below level 5. A scratch claims file MUST raise `claims.missing` when it was not written (`claims file not written: <path>`) or holds no line starting `- ` (`claims file holds no '- ' claim`); every such line is a claim that needs an evidence comment, and findings name the file by its base name.
  - origin: B-1695; B-1696; B-1697; B-1853; B-1854
  - disposition: ported
  - test: PT-140-C-120-coverage-claims; PT-140-C-123-coverage

- **F140-FR-015**: `reverse inventory <SRC> --out <inventory.json>` MUST build the inventory standalone, print the absolute path of the file it wrote, and take `--md PATH` (also write the summary there) and `--exclude PATH` (repeatable; a source-relative path never walked). A source that is not a directory MUST fail with `source is not a directory: <src>`. Inventory paths in a message are named by logical name when they are state.
  - origin: B-1863; B-1864; B-1865; B-1866; B-1867; B-1902
  - disposition: translated
  - test: PT-140-C-124-inventory-verb; PT-140-C-125-inventory-flags; PT-140-C-130-inventory-path
  - divergence: DV-066

- **F140-FR-016**: The limits MUST be: the text of a single file at most 1,048,576 bytes (`reverse.maxFileBytes`, as-is variable `SPECSTRIDE_REVERSE_MAX_FILE_BYTES`), the total text at most 20,971,520 bytes (`reverse.maxTotalBytes`, `SPECSTRIDE_REVERSE_MAX_TOTAL_BYTES`), and the summary at most 24,000 characters (`reverse.contextBudget`, `SPECSTRIDE_CONTEXT_BUDGET`; a non-positive or non-integer value fails with exit 3). A value that is not a positive integer MUST fail with `<NAME> must be a positive integer (got '<v>')`; an unset or empty value means the default. The legacy-prefixed variable is not read. The sniff window MUST be 8192 bytes.
  - origin: B-1618; B-1868; B-1869; B-1870; B-1873; B-1906; B-1907; B-1908; B-1909
  - disposition: translated
  - test: PT-140-C-126-limits; PT-140-C-128-integer-error; PT-140-C-118-context-budget
  - divergence: DV-027; DV-036
  - parity: the three settings at their as-is defaults (row 69 of annex X §X.7)

- **F140-FR-017**: The inventory MUST walk in git mode only when the source is inside a work tree and is its top level; a subdirectory of a repository is walked by the file-system walk. Git mode MUST list the tracked and the untracked-not-ignored files (30 seconds, 60 seconds and 300 seconds as limits for HEAD, status and listing), drop a path when any of its directory components is a name of state, when it is under an exclusion, or when git lists it and the work tree lacks it; the directory-name deny list MUST NOT apply in git mode. `git_head` MUST be the verified HEAD commit or null when there is no commit or git fails, and `git_status` the sorted list of `XY path` entries with the source path of a rename or copy dropped. A failing listing MUST fail with `git ls-files failed in <src>: <stderr>`. Candidate paths MUST be sorted by code point, and the mode reported as `git` or `walk`. Exclusions MUST be normalised by stripping leading and trailing `/`, de-duplicated and sorted; an exclusion matches itself and everything under it. State names that are never walked are the workspace part and the old trees `.specstride` and `.lisa`.
  - origin: B-1874; B-1910; B-1911; B-1916; B-1917; B-1918; B-1921; B-1922; B-1924; B-1928; B-1931
  - disposition: ported
  - test: PT-140-C-131-git-walk; PT-140-C-128-git-error
  - divergence: DV-036; DV-006
  - status: unverified (check: the same fixtures on a macOS runner, including a case-insensitive file system; verified-on: —; pin: git version of the runner)

- **F140-FR-018**: The file-system walk MUST skip directories named `.git`, `node_modules`, `.venv`, `venv`, `__pycache__`, `dist`, `build`, `target`, `vendor`, `testautomation` and the state names, at any depth; MUST never follow a link, recording a link to a directory as one link entry that is not entered; and MUST honour only the `.gitignore` at the root, as a glob subset (`**/` removed, `/**` read as `/*`, no nested ignore file), where `!` negates, a trailing `/` is directory-only, a pattern with `/` is anchored to the source-relative path, others match the base name or the path, and the last matching rule wins.
  - origin: B-1919; B-1920; B-1923
  - disposition: ported
  - test: PT-140-C-131-file-walk

- **F140-FR-019**: Language MUST be decided by exact file name, then `Dockerfile*` and `*.dockerfile`, then lower-cased extension, then shebang, else `unknown`. Role MUST be decided in this precedence: `ci`, `test`, `schema`, `template`, `doc`, `script`, `source`, `config`, else `other`. Role `test` is decided by path patterns (`tests/`, `__tests__/`, `test_*.py`, `*_test.go`, `*.spec.ts`, `conftest.py` and the like); role `doc` applies to README, CHANGELOG, CONTRIBUTING, LICENSE, AGENTS and CLAUDE style names, markdown, reStructuredText and text files and anything under `docs/`; role `script` applies to shell files, anything under `scripts/` or `bin/`, and any file that starts with a shebang, so an executable entry script is `script` and not `source`. File hashes MUST be SHA-256 of the content read in 64 KiB chunks, through the canonical hasher.
  - origin: B-1912; B-1913; B-1915; B-1925; B-1926; B-1927
  - disposition: ported
  - test: PT-140-C-131-classification
  - ep: none (uses the canonical hasher of annex X §X.5)

- **F140-FR-020**: A file entry MUST hold `path`, `bytes`, `lines`, `sha256`, `language` and `role`. A file with a NUL byte in its first 8192 bytes MUST be skipped with the reason `binary`, checked before the size limit; a file larger than the per-file limit MUST be skipped with `oversize` and record `limit`; a link that resolves outside the source MUST be skipped with `symlink-escape` and be fingerprinted by its target; a link that resolves inside the source MUST be a file entry with `symlink: true`, `target`, `bytes` the length of the target string, `sha256` of the target string, `lines` 0, language `symlink` and role `other`. Skipped entries MUST still carry `bytes` and `sha256`, so that a change to a binary or an oversize file is caught by the guard. The line count MUST be the number of newline bytes plus 1 when the file is non-empty and does not end with a newline. `totals.text_bytes` MUST sum text files only; links and skipped entries do not count towards the total limit.
  - origin: B-1903; B-1929; B-1930; B-1932; B-1933; B-1934; B-1935
  - disposition: ported
  - test: PT-140-C-131-entries

- **F140-FR-021**: The inventory document MUST carry the field `schema` with the value `specstride.reverse-inventory/1` (annex B §B.20; F100-FR-227, F100-FR-048), MUST keep `schema_version` 1 as the as-is field, and MUST have the keys `files`, `skipped`, `src` (real path), `walk`, `excludes` (sorted, normalised), `limits` (`max_file_bytes`, `max_total_bytes`), `totals` (`files`, `skipped`, `text_bytes`, `lines`), `oversize` (true when the total text bytes are strictly greater than the total limit), `project`, `git_head`, `git_status`, `testautomation`, `specify`, `units`, and `fingerprint`. `testautomation` MUST be the map from each regular non-link file under the source's `testautomation/` to `[bytes, sha256]`, or null when it does not exist. The `fingerprint` MUST be the SHA-256 of the compact JSON list of the sorted triples (path, bytes, sha256) over files and skipped entries, serialized as at the baseline, including the escaping of non-ASCII characters. The document MUST be serialized with sorted keys, one space of indentation, non-ASCII characters kept as they are and a final line end, and MUST carry no timestamp, so that two plans over the same tree give byte-identical inventories. Sorting MUST be by code point, never by locale and never by UTF-16 unit. The field `schema` is no part of the fingerprint, which is taken over the triples alone. A reader MUST refuse an inventory whose field `schema` is absent, unknown or of another major, as F100-FR-049 states (`not an inventory: <path>`, exit 3, for the lint's `--baseline`). The key `schema` is the one difference of the document from the baseline's bytes.
  - origin: B-1875; B-1876; B-1877; B-1878; B-1879; B-1880; B-1881; B-1882; B-1883; B-1884; B-1885; B-1886; B-1904; B-1936; B-1937; B-1965
  - disposition: translated
  - test: PT-140-C-129-inventory-document; PT-140-C-131-fingerprint; CT-140-4; CT-140-5
  - divergence: DV-006; DV-116
  - ep: none (uses the canonical hasher of annex X §X.5; a hash of the same class, rule N-09)

- **F140-FR-022**: The project facts MUST be read from manifests: `package.json` (name, bin, exports with main, module and types, scripts, workspaces; dependency names from `dependencies`, `devDependencies` and `peerDependencies`; an unparseable file records `error: unparseable`); `pyproject.toml` (name, scripts of PEP 621 and poetry, build backend; any mention of `pytest` counts as that framework); `setup.cfg` (metadata name, console scripts, install requirements); `go.mod` (module, go version, required module paths); `Cargo.toml` (package name, `[[bin]]` names, workspace members, dependencies); `Dockerfile`, `Dockerfile.*` and `Containerfile` (FROM, ENTRYPOINT, CMD, EXPOSE); `Makefile` and `GNUmakefile` (sorted unique targets); `pom.xml`, `build.gradle` and `build.gradle.kts` (the first `<artifactId>` as name); compose files (sorted service names); `.github/workflows/*.yml` and `*.yaml` (workflow name and job ids); root `pnpm-workspace.yaml` (the `packages:` globs). Manifest records MUST drop keys whose value is null, an empty string, an empty list or an empty map. Frameworks MUST be derived only from manifest dependency names through a fixed table and reported sorted. Where the runtime has no TOML reader the TOML manifests yield no parsed facts, as at the baseline.
  - origin: B-1905; B-1938; B-1939; B-1940; B-1941; B-1942; B-1943; B-1944; B-1945; B-1946; B-1947; B-1948; B-1949; B-1950
  - disposition: ported
  - test: PT-140-C-131-manifests

- **F140-FR-023**: The inventory MUST derive entry points of the kinds `bin` (package `bin`, Cargo `[[bin]]`), `console-script` (manifest scripts, not `package.json` scripts), `export` (with the manifest-relative `resolved` path), `container-entrypoint` (Dockerfile ENTRYPOINT), `python-main` (a Python file with an `if __name__ == "__main__":` line), `go-main` (a Go file with `package main` and `func main()`) and `script` (a role-script file that starts with a shebang), reading at most the first 256 KiB of a file, sorted by their sorted-key JSON text. `languages` MUST count files per language sorted by name, without `unknown` and `symlink`. Workspaces MUST be the directories that hold a `package.json` or `Cargo.toml` and match a root workspace glob (`**` read as `*`, `!` globs exclude). Units MUST be the workspace packages plus `.` for the rest when workspaces exist, else the top-level directories plus `.` for root files, each with `path`, `files` and `bytes`, sorted by path.
  - origin: B-1951; B-1952; B-1953; B-1954; B-1955; B-1956; B-1957; B-1958; B-1959; B-1960; B-1961; B-1962
  - disposition: ported
  - test: PT-140-C-131-entry-points-units

- **F140-FR-024**: The Spec Kit facts of the source MUST be read from the file system directly and not from the walk: `present`, `constitution`, `templates`, `feature_json` and `spec_numbers`. Existing spec numbers MUST be the leading numbers of three or more digits of the directories under `specs/` of the source that are named `<digits>-...`; files are ignored.
  - origin: B-1963; B-1964
  - disposition: ported
  - test: PT-140-C-131-specify-facts

- **F140-FR-025**: The inventory summary MUST have the title `# Inventory — <source base name>`, an introduction that names the source, the walk mode and the full inventory as the full record, and the bullets `- Files: <n> text (<lines> lines, <bytes> bytes); <n> skipped`, `- Oversize: yes|no (limit <n> bytes of text)`, `- git HEAD: <sha>` or `not a git work tree`, ``- Fingerprint: `<sha256>` ``, `- Languages:` (`none` when empty), `- Frameworks:` (`none detected`) and `- Existing Spec Kit: yes|no; constitution present|absent; specs <NNN list>|none`; the sections `## Manifests` (one bullet per manifest with facts as JSON cut to 600 characters, or `- none`), `## Entry points` (`- <kind>: `<target>` (<manifest>)` or `- none detected`), `## Workspaces and units`, `## Skipped` (`- `<path>`: <reason>` or `- none`) and `## Files` (a table `| Path | Lines | Language | Role |`). File rows MUST be added in order until the text, the row and 200 characters would exceed the budget; project facts are never dropped; when rows are dropped the summary ends with `_<k> of <n> file rows dropped to stay within <budget> characters; every file is in `<inventory>`._`. Every file that the inventory writes MUST be written atomically.
  - origin: B-1887; B-1888; B-1889; B-1890; B-1891; B-1892; B-1893; B-1894; B-1895; B-1896; B-1897; B-1898; B-1899; B-1900; B-1901; B-1966
  - disposition: translated
  - test: PT-140-C-129-summary; PT-140-C-131-summary-budget
  - divergence: DV-006

- **F140-FR-026**: The product MUST ship the five Spec Kit templates (checklist, constitution, plan, spec, tasks) as an unchanged copy of the Spec Kit templates at a recorded commit, with their MIT notice, and the lint MUST read them when the source has no `.specify/templates/`. The rules of each template MUST be: in the checklist template, `## [Category 1]` and `## [Category 2]` reduce to one family met by any heading other than the explicit `## Notes`; in the constitution template, upper-case tokens such as `[PROJECT_NAME]` are placeholders that the lint rejects in a written constitution, `## Core Principles` and `## Governance` are expected headings (warnings) and `## [SECTION_2_NAME]` is a family; in the plan template no heading carries a mandatory mark, so each missing one is only a warning; in the spec template `## User Scenarios & Testing`, `## Requirements` and `## Success Criteria` are mandatory and `## Assumptions`, having no mark, only gives a `template.expected` warning; in the tasks template `## Format: `[ID] [P?] [Story] Description`` contains brackets and so is a family (an error when no heading of that shape exists) and the phase headings form the phase family (a `tasks.md` with no `## Phase <n>:` section is a `template.family` error).
  - origin: B-1967; B-1968; B-1969; B-1970; B-1971; B-1972; B-1973; B-1974; B-1975; B-1976; B-1977
  - disposition: ported
  - test: PT-140-C-132-templates-shipped; PT-140-C-136-spec-template-rules; PT-140-C-137-tasks-template-rules
  - status: verified-on 2026-09-29 (Specstride baseline `9cab15d`, copy of the templates read from the baseline; pin: the recorded upstream commit is in the baseline's README of the templates)

### Success Criteria

### Measurable Outcomes

- **F140-SC-001**: 100 per cent of the output lines of the lint carry a finding code of the closed family; 0 lines lack one.
  - test: CT-140-1

- **F140-SC-002**: For each of the finding codes of "Closed sets", at least one fixture raises it; the scenarios `lint-<code>` of fixture family FX-30 cover 100 per cent of the codes.
  - test: CT-140-2

- **F140-SC-003**: Two plans over the same source tree give byte-identical inventories, and the fingerprint equals the baseline's on every fixture of FX-30.
  - test: CT-140-3

### Key Entities *(include if feature involves data)*

- **Source**: the tree to inventory; read-only.
- **Inventory**: the record of every file of the source with size, hash, language and role, the project facts, the fingerprint and the git state; the baseline against which the source is compared later.
- **File entry, skipped entry**: one file of the source, counted as text or skipped with a reason.
- **Project facts**: manifests, languages, frameworks, entry points, workspaces.
- **Unit**: a workspace package, a top-level directory, or `.` for the rest.
- **Inventory summary**: the readable, size-capped rendering of the inventory for the proposer.
- **Finding**: a lint result with a code, a severity, a file, a line and a message.
- **Template**: one of the five Spec Kit templates that the product ships.

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
| The shipped Spec Kit templates carry their MIT notice | R1; DP-015 |

## Extension points

Feature 140 owns no extension point. It implements none and consumes one.

| EP | Id and version | Use | Requirements |
|---|---|---|---|
| EP-03 | `specstride.spec-format/1` | `tasks.md` of the output must validate in the format `speckit-tasks` (`tasks.grammar`) | F140-FR-013 |

## Contracts of feature 100 used

| Contract | Annex and section | Requirements |
|---|---|---|
| CLI protocol and commands `reverse`, reverse lint, reverse inventory | G §G.1 (F100-FR-170) | F140-FR-001, F140-FR-002, F140-FR-015 |
| Exit codes per command, rows "Reverse plan, reverse lint, reverse guard" and "Reverse inventory" | G §G.4 (F100-FR-182) | F140-FR-001 |
| Output modes and line grammar | G §G.2, §G.3 (F100-FR-175, F100-FR-178) | F140-FR-003 |
| Logical names `reverse:<slug>:inventory`, `reverse:<slug>:inventory-summary`, `package:templates:<name>`, and the state layout | B §B.1, §B.5 (F100-FR-038, F100-FR-053) | F140-FR-010, F140-FR-015, F140-FR-025, F140-FR-026 |
| Canonical spec model and spec-format adapter | C §C.7 (F100-FR-095) | F140-FR-013 |
| Canonical hasher | X §X.5 (F100-FR-207) | F140-FR-019, F140-FR-021 |
| Closed sets; the `parity` profile; normalization contract | X §X.6, §X.7, §X.8 (F100-FR-208, F100-FR-212, F100-FR-213, F100-FR-214) | "Closed sets", "Rows of the `parity` profile" |
| Schema id `specstride.reverse-inventory/1`; the field `schema`; the reader's refusal | B §B.4, §B.20 (F100-FR-048, F100-FR-049, F100-FR-227) | F140-FR-021, F140-FR-002 |

The inventory document is read by other commands of the product (the guard, the plan, and the lint's `--baseline`). Annex B §B.20 of feature 100 gives it the schema id `specstride.reverse-inventory/1`, the logical name `reverse:<slug>:inventory` and this feature as owner (F100-FR-227). This feature lists its fields in F140-FR-021 and delivers the schema file `contracts/inventory.schema.json` to the `contracts` package.

## As-is behaviour not carried

| As-is id | Behaviour (short) | Register row |
|---|---|---|
| B-1914 (C-131) | Integer variables are read under the legacy prefix as a fallback | DV-036 |

Parts of kept items that are not carried (the items are kept, `translated`): the legacy-prefixed fallback in the limits of F140-FR-016, and the legacy state directory name in the names of state that the walk skips (F140-FR-017), both DV-036. `.specstride` and `.lisa` stay never walked, as names of old trees.

## Closed sets

Feature 140 owns these closed sets. They are rows 146 to 149 and 151 to 155 of annex X §X.6 (F100-FR-208), in the order of the table; the last line is the schema id of annex B §B.20 and has no row of §X.6. For each, an unknown value read from outside is refused with a message that names the set and the value, unless the row says otherwise.

| Closed set | Members | Owner | Closed by | Unknown value |
|---|---|---|---|---|
| Lint finding codes | 38: `template.mandatory`, `template.family`, `template.expected`, `placeholder`, `structure.extra`, `structure.contracts`, `structure.required`, `evidence.format`, `evidence.kind`, `evidence.confidence`, `evidence.validation`, `evidence.disproved`, `evidence.citation`, `evidence.contradicts`, `evidence.missing`, `evidence.skipped`, `unknowns.placement`, `spec.fr-format`, `spec.sc-format`, `spec.fr-unique`, `spec.sc-unique`, `spec.story-format`, `spec.story-numbers`, `spec.story-parts`, `spec.clarifications`, `research.decisions`, `data-model.entities`, `checklist.items`, `tasks.grammar`, `tasks.line-format`, `tasks.ids`, `tasks.phase-order`, `tasks.story-labels`, `tasks.story-exists`, `tasks.parallel-files`, `tasks.mode`, `coverage.fr`, `claims.missing` | 140 | Design | The lint never writes one; a reader treats a code outside the set as an error finding of unknown kind |
| Severities of a lint finding | `error`, `warning`. Warnings: `template.expected`, `unknowns.placement`, `data-model.entities`, `evidence.skipped`; all others errors | 140 | Design | Read as `error` |
| Lint levels | 0, 1, 2, 3, 4, 5 | 140 | Design | Exit 3 with `--upto must be one of 0, 1, 2, 3, 4, 5` |
| Evidence kinds; evidence validations | `observed`, `inferred`, `declared`; `verified`, `unverified`, `disproved` (`desired` is refused) | 140 | Design | An error finding |
| Walk modes | `git`, `walk` | 140 | Design | Baseline refused |
| Skip reasons | `binary`, `oversize`, `symlink-escape` | 140 | Design | Read as a skipped entry of unknown reason; still fingerprinted |
| Roles of a file | `ci`, `test`, `schema`, `template`, `doc`, `script`, `source`, `config`, `other` | 140 | Design | `other` |
| Kinds of entry point | `bin`, `console-script`, `export`, `container-entrypoint`, `python-main`, `go-main`, `script` | 140 | Design | Kept as text |
| Languages | An open set by data: the table of names and extensions | 140 | Open by data | `unknown` |
| Schema of the inventory | `schema` `specstride.reverse-inventory/1` (annex B §B.20); `schema_version` 1, the as-is field | 140 | Design | The inventory is refused (`not an inventory`), as F100-FR-049 states |

Lint finding codes by level (a code appears at the first level that owns an artifact it checks, and at every level above it): every level: `structure.extra`, `evidence.skipped` (without `--src`); every level from 1: `structure.required` (level 0 owns no artifact); level 0: `claims.missing` and the evidence codes on the claims file; level 1: `template.*`, `placeholder`, `evidence.*`, `unknowns.placement`, `spec.*`, `checklist.items`; level 2: `template.*`, `placeholder`, `evidence.*`, `research.decisions`; level 3: `placeholder`, `evidence.*`, `data-model.entities`, `structure.contracts`; level 4: `template.*`, `placeholder`, `tasks.*`; level 5: `coverage.fr`.

## Rows of the `parity` profile

Feature 110 owns the spelling of every key. These share row 69 of annex X §X.7. Every value under `parity` is the one that reproduces the baseline.

| Switch or option | Key | Default | Under `parity` | Register row | Row of §X.7 |
|---|---|---|---|---|---|
| Largest text file (F140-FR-016) | `reverse.maxFileBytes` | 1048576 | 1048576 | DV-027 | 69 |
| Largest total text (F140-FR-016) | `reverse.maxTotalBytes` | 20971520 | 20971520 | DV-027 | 69 |
| Size of the inventory summary (F140-FR-016) | `reverse.contextBudget` | 24000 | 24000 | DV-027 | 69; the variable `SPECSTRIDE_CONTEXT_BUDGET` is in the alias table of §X.8, one variable for `spec.contextBudget` and `reverse.contextBudget` |

The lint and the inventory add no other switch. Under the `parity` profile no line without an as-is equivalent is printed (row 19 of annex X §X.7); the lint prints only as-is lines.

## Ids before the split

Feature 140 was group G-B of `108-reverse`. Requirements and success criteria that moved got new ids in the order of the old ids; the old ids are never reused. Tests moved with their requirements; the prefix of a parity test changes from `PT-108-` to `PT-140-` and the rest stays.

| Old id (in `108-reverse`) | New id |
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
| CT-108-141 (the byte-exact helpers, task of Phase 2) | CT-140-4 |

## Repairs after the cross-feature review

Dated 2026-09-30. Requirements changed in place; no id was renumbered or reused.

| Item | Requirement | What changed |
|---|---|---|
| W-140-01 | F140-FR-021 | The inventory carries the field `schema` with the value `specstride.reverse-inventory/1`; `schema_version` 1 stays as the as-is field; a reader refuses an inventory without the field; the field is no part of the fingerprint; register row DV-116; new test CT-140-5 |
| W-140-01 | "Closed sets", line "Schema of the inventory"; "Contracts of feature 100 used" | The schema id of annex B §B.20 is cited; the sentence that feature 100 holds no contract is replaced |
| W-X-20 | F140-FR-021 | The `test:` line names CT-140-4, the test of the byte-exact helpers that task T004 already held |
| W-X-11 | F140-FR-016 | The `parity:` line names row 69 of annex X §X.7 in place of "proposed rows" |
| W-X-07 | "Closed sets", introduction | The rows of annex X §X.6 are named by number |
| W-X-05 | "Assumptions" | The register is named without a count |

## Clarifications

### Session 2026-09-29

Questions of `speckit-specify` and `speckit-clarify` for the split, answered from the sources. No question was put to a person.

- Q: Why is this feature split from `108-reverse`? → A: `speckit-specify` of feature 108 yielded 60 requirements, above about 45; the split follows group G-B of heading 7 of the brief. (Source: brief 108, heading 7; `STAGE-B-RULES.md` section 5; `STAGE-B-SPLIT-PROMPT.md`)
- Q: Where does the inventory format live, given that another part of the product reads it? → A: In this feature (F140-FR-021 and `contracts/inventory.schema.json`); feature 100 holds no contract for it, which is reported. (Source: brief 108 heading 5 "Owns (content): the reverse inventory format") *Superseded 2026-09-30 (W-140-01): annex B §B.20 of feature 100 now holds the schema id `specstride.reverse-inventory/1`; see "Contracts of feature 100 used".*
- Q: Which exit code does the lint give for findings and for invalid input? → A: 3 for both; 2 for a usage error. (Source: consolidation section 3.6; B-1622)
- Q: Where do the lint's templates come from? → A: The source's `.specify/templates/` first, the shipped copy otherwise. (Source: B-1824, B-1967)
- Q: Are the two `superseded-by DV-036` items carried? → A: Only B-1914 belongs to this feature and is not carried; B-1763 stays with `108-reverse`. (Source: traceability rows; DV-036)
- Q: How is a sort defined for paths that hold characters above U+FFFF? → A: By code point, as the baseline; never by UTF-16 unit and never by locale. (Source: B-1924; N-27)

## Assumptions

- The glossary of `consolidation.md` section 1 is the vocabulary; this specification repeats no definition.
- The rows of the divergence register that this specification cites exist (DV-006, DV-027, DV-036, DV-066, DV-116).
- Where the as-is specification and the baseline code disagree, the code is what parity means; the behaviour items come from the code.
- The plan, the guard and the wrapper are reached only through the CLI commands of feature 100. The spelling of the verbs `lint` and `inventory` is an assumption of CQ-091, raised in the specification of the wrapper.
- The host skill does not call `reverse lint` between invocation and launch; the lint runs as a verification command of a phase inside the engine, so its output (one as-is line per finding and a summary line) is outside the byte cap of F108-FR-034, which binds `reverse inventory` (proposed upstream fix P-1 in `analyze-report.md`).
- No question of this feature is open beyond CQ-091.
