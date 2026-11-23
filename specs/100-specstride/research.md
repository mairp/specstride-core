# Research: Specstride (umbrella, feature 100)

Phase 0 of the plan. The research of this feature was done in Stage A and stays in
`docs/ecosystem/`. This file records the decisions of the plan, each with its reason and the
alternatives, and links to the reports. It copies none of them.

No item of the Technical Context is open. The ten questions that the sources could not answer are
CQ-017 to CQ-026 in `docs/ecosystem/CLARIFY-QUEUE.md`; the plan proceeds on the recommended
answer of each.

## Where the research is

| Subject | Report or artifact in `docs/ecosystem/` | Used for |
|---|---|---|
| The owner's rulings | `APPROVAL.md` | The authority on every point |
| Architecture: layers, process model, state layout, run-state machine | `architecture.md`; `research/R15-ecosystem-architecture.md` sections A-2 to A-7 | Annexes A, B, E, F |
| Amendments of the architecture | `research/R15v-architecture-red-team.md`, P-1 to P-15 | Annexes A to X; where it differs from R15, it stands |
| Glossary, conflict rulings, exit codes, stop reasons, defect policy, divergence register | `consolidation.md` sections 1 to 6 | Annexes E, G; every `divergence:` field |
| Decomposition, content owners, cross-feature interface contracts | `feature-briefs.md` sections A, B, C (brief 100), D.3, D.4, D.5, D.8 | `spec.md`; the content owner of every section |
| Traceability | `traceability.md`, `traceability-frs.tsv`, `traceability-items.tsv` | `origin:`, `disposition:`, `test:` |
| Behaviour inventory and the parity oracle | `research/R18-behaviour-inventory-parity-oracle.md` O-1 to O-12; `research/R18-behaviour-inventory.tsv` | Annex X §X.8; the old side of the layout table |
| Threat model | `research/R11-security-threat-model.md` | Annex X §X.9 |
| Event envelope, quota classes, pause | `research/R14-quotas-cost-observability.md` | Annex X §X.1; annex C §C.13; annex B §B.17 |
| Config precedence, trust classes, doctor | `research/R16-doctor-config.md` F2 to F7 | Annex X §X.2; annex G §G.7 |
| Harness descriptor, critic order | `research/R20-harness-discovery.md` | Annex C §C.2, §C.6 |
| The JSONL reader and its dialects | `research/R9-pi-dsh-prime.md` | Annex C §C.5 |
| Loop layer, fact block, caps, switches | `research/R27-run-acceleration-synthesis.md` D1.1 to D1.13; `research/R23v-gate-red-team.md` | Annex D; annex X §X.7 |
| Parallel units, tree store, parallel plan | `research/R29-parallel-units-design.md`; `research/R29v-parallel-units-red-team.md` | Annex D §D.1 to §D.3 |
| CLI protocol, token budgets, host facts | `research/R3-claude-code-host.md`; `research/R17-context-efficiency-runtime-language.md` | Annexes G, H |
| Lock mechanism | `research/R2v-port-size-verification.md`; `consolidation.md` C-04 | Annex F §F.5 |

## Decisions of the plan

### D-1 The JSON Schema files are the source; types are generated from them

- **Decision**: every record schema is one JSON Schema file (draft 2020-12) in the `contracts` package. The TypeScript types are generated from the schema files at build time. Closed sets, the `parity` profile, the layout and the normalization tables are JSON data files with a `schema` field.
- **Rationale**: the schemas are an interface for people outside the repository: authors of harness descriptors and of later implementations validate against them (F100-FR-027, ruling 30). A data format that any language reads serves them; types of one language do not. One source also removes the risk that a type and a validator differ, which is the as-is defect that F100-FR-190 fixes for the launch contract.
- **Alternatives considered**: types as the source with schemas derived from them (the derived schema loses the descriptions and the rules for unknown values); a validation library with its own schema language as the source (it binds every outside author to that library).

### D-2 One validator: Ajv

- **Decision**: Ajv validates against the schema files. It is the only runtime dependency of `contracts`. Schemas are compiled lazily, one at first use. The exact version is pinned at the first task, and the licence is checked then.
- **Rationale**: pure JavaScript, MIT, no native part, no install script, supports draft 2020-12. It can also emit standalone validation code at build time, which keeps the start of a command fast.
- **Alternatives considered**: a hand-written validator per record (30 validators to keep equal to 30 schemas); validators of other schema languages (see D-1). `unverified`: the version and the size were not looked up, because this plan makes no network call; the first task does it.

### D-3 The test runner that Node ships

- **Decision**: `node:test` with `node:assert`. Fake executables, stub agents and recorded fixtures are plain files.
- **Rationale**: no dependency; runs on Node 22; Principle XII (no paid call) and Principle VI (small dependency surface). The test kit is published, so every dependency of it is a dependency of outside authors.
- **Alternatives considered**: a test framework from npm (faster watch mode, more dependencies for every consumer of the test kit).

### D-4 The import-boundary check is a tool of the repository, built on the TypeScript compiler

- **Decision**: a tool reads `contracts/data/package-graph.json`, the `package.json` of every package and the import statements of every source file, and fails on an import that the graph does not permit, on a forbidden built-in module in a core package, and on a core file that names a sample or a Wave 1 implementation.
- **Rationale**: F100-FR-001 and F100-FR-012 need a check over the package graph; the third rule (naming a sample) is not an import rule and no ready-made tool has it. The TypeScript compiler is already a development dependency.
- **Alternatives considered**: a dependency-graph tool from npm plus a second script for the naming rule (two tools, one more dependency).

### D-5 The generator keeps annexes and schema files equal

- **Decision**: `contracts/tools/generate.py` reads the tables of the annexes and writes the files of `contracts/`. With `--check` it compares and fails on a difference. The build runs the check.
- **Rationale**: the 40 other features read the files as the machine-readable form of the annexes. A difference must be impossible, not unlikely. The generator is a tool of the specification: it uses the standard library of its language only, it is not shipped, and it is no component in the sense of the Language Ledger (CQ-186, answered by the owner on 2026-09-30: a tool of the build is no component where its file is outside every published package and the build states Python 3 as a requirement of development). Until the port the build runs a Python script; `plan.md` records this under row VI and in Complexity Tracking, and task T207 ports the generator before the release acceptance.
- **Alternatives considered**: writing the files by hand and reviewing them (236 requirements and about 900 table rows; a review does not hold over time); writing the generator in TypeScript (no workspace exists yet at the time the specification is written; task T207 ports it once it does, before T204).

### D-8 One YAML parser: the package `yaml`

(Added by the repairs after the cross-feature review; it stands here, out of order, beside the
decision on the generator, and no decision was renumbered.)

- **Decision**: one YAML parser for the whole product, the npm package `yaml`. It is a dependency of the package that loads configuration (owner 110) and of no other package; a feature that reads YAML reads it through the loader of feature 110 and names no parser of its own. The `contracts` package stays without it: the one validator of D-2 validates the parsed value. The exact version is pinned at the first task of feature 110 that uses it, and the licence is checked then.
- **Rationale**: pure JavaScript, no dependency of its own, no install script, no native part; it reads YAML 1.2, so that words such as `no` and `on` are text and not truth values; it reports the line and column of an error, which a configuration error needs. One parser means one reading of every configuration file.
- **Alternatives considered**: another parser from npm that reads YAML 1.1 by default (the truth-value words change meaning); a parser per feature (two readings of one file); JSON only (the as-is configuration file is YAML, decision 9). `unverified`: the version, the licence (expected: ISC, which is compatible with MIT) and the size were not looked up, because this plan makes no network call; the task that pins the version does it.

### D-6 Logical names resolve through one table with a layout version

- **Decision**: `contracts/data/layout.json` holds, per logical name, the root, the writer, the readers and the path template. One resolver in `contracts` turns a logical name and its parameters into a path. No other code builds a path of state.
- **Rationale**: F100-FR-038. A change of layout changes one data file and the layout version.
- **Alternatives considered**: path constants per package (the as-is state of three systems).

### D-7 The old side of the layout table is complete and is data

- **Decision**: one row per `file` item of the behaviour inventory, 199 rows, in `contracts/data/layout-old-side.json`. A row gives the logical names, or the rule that applies (not carried, a temporary name, a write discipline), and says whether the item fixes a location, a content, a write discipline or a reading rule.
- **Rationale**: F100-FR-214; rule N-02. Building the complete table showed 33 logical names that annex B did not hold; they were added to annex B §B.5 (the requirement text did not change). Spellings proceed on CQ-018.
- **Alternatives considered**: rows only for the paths that two or more features compare (the specification's short table; the oracle needs all).

### D-10 Conformance suites: feature 100 builds the frame, the content owner fills it

- **Decision**: the test kit has one folder per extension point with a fixed shape: the suite, the sample, the registration of the sample from outside the core. Feature 100 builds the frame, the runner, the report, and for each point a contract-level suite that checks what the annex states without any behaviour: the operations exist, results stay inside the closed result set, a throwing implementation degrades to the documented path, an unknown value is handled by the stated rule. The cases that need behaviour are added by the content owner.
- **Rationale**: `feature-briefs.md` D.3 gives the conformance suite and the sample to the content owner; F100-FR-017 and F100-FR-018 need them to have one shape, and F100-FR-222 needs one run over all nineteen.
- **Alternatives considered**: every content owner builds its own frame (nineteen shapes, no single acceptance run).

### D-9 Table-level tests are generated from the data files

- **Decision**: one test per row of the exit-code tables, of the stop-reason enumeration and of the transitions of the run-state machine, generated from `exit-codes.json`, `stop-reasons.json` and `run-state-machine.json`. Each asserts the row against the `contracts` package, and, where a fixture of the oracle ends a process in that way, against the fixture.
- **Rationale**: success criterion F100-SC-009 asks for every row. The behaviour that produces a code belongs to its feature; the table-level assertion belongs here (brief 100, heading 8).
- **Alternatives considered**: tests written per row by hand.

## Facts that stay `unverified`

Each is named in its requirement with the check that would verify it.

| Fact | Requirement | Verified by |
|---|---|---|
| Everything about macOS | F100-FR-025 | A macOS runner that passes the oracle and the conformance suites |
| A process started from the host's shell tool survives the end of the session; the control root is writable from there | F100-FR-155, F100-FR-034, F100-FR-165 | The spike of feature 122 |
| Location of the worker root on macOS | F100-FR-033 | Feature 142 |
| Start time of a process and boot identity on macOS | F100-FR-062, F100-FR-164 | Feature 122 |
| Read denial of the withheld paths by the sandbox of the first harness of the second form | F100-FR-089 | Feature 131, fixture capture |
| The stream of pi and its exit code on a provider error | F100-FR-091 | Feature 134, fixture capture |
| A keychain query that prints no value | F100-FR-107 | Feature 110 |
| Quota signals of the Wave 1 harnesses | F100-FR-109 | The harness adapters, fixture captures |
| A sandbox confines the harness's own file tools to a write root other than the workspace | F100-FR-112 | Feature 142 with the harness adapters |
| Host facts from documentation only | F100-FR-197 | Feature 113 |
| The integration run on a reference project | F100-FR-224 | The release |
| Version, size and licence text of the validator | D-2 | The first task |
