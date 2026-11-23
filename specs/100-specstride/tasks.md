---
description: "Task list of feature 100-specstride"
---

# Tasks: Specstride (umbrella, feature 100)

**Input**: Design documents from `specs/100-specstride/`

**Prerequisites**: plan.md, spec.md with the annexes, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Parity tests and characterization tests are required tasks (`STAGE-B-RULES.md` section 3). A test task is written before the task it tests and must fail before that task is done.

**Organization**: Tasks are grouped by the user stories of `spec.md`. Inside a story they follow the annex sections. Every task is sized for an implementer whose context window is 200,000 tokens: one task writes one file (two only where the text says so), and the `reads:` line of the task names everything the implementer opens.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (another file, no dependency on an unfinished task)
- **[Story]**: the user story of `spec.md` (US1 to US5)
- Every task names its file
- Every task carries `reads:` with the only inputs the implementer opens (see "Context budget")
- A test task carries `proves:` with what it proves, and a parity test `fixture:` with the fixture families of feature 141. A parity or characterization test proves as-is ids; the requirement it serves stands under `requirement:`, and the coverage count reads both keys
- An implementation task carries `covers:` with the requirements it serves
- A task that is one slice of a former larger task carries `slice of:` with the parent id (see "Task ids after the split")

## Context budget: how an implementer with a 200,000-token window works one task

The specification of this feature is about 1,060 lines of `spec.md`, 4,429 lines of annexes and about 1.1 MB of
contract files (of which `annex-tables/` is never needed and `requirements.json`, `closed-sets.json`, `parity-profile.json` and `layout-old-side.json` are read by id only). No task needs all of it. The rules:

1. **Open only what `reads:` names.** An annex section is read from its `## §X.n` heading to the next `##` heading (`grep -n '^## §' specs/100-specstride/annexes/<annex>.md` gives the line numbers). A requirement id is read inside its section; its text is also one entry of `contracts/requirements.json` (`python3 -c "import json;[print(r['id'],r['text']) for r in json.load(open('specs/100-specstride/contracts/requirements.json'))['requirements'] if r['id'] in {'F100-FR-036'}]"`).
2. **Never read whole**: `spec.md` (read only the user story named by the phase, lines 164 to 283, when a task names it), `contracts/requirements.json` (135 KB; filter by id), `contracts/data/closed-sets.json` (111 KB; filter by `owner` or `number`), `contracts/data/parity-profile.json` (52 KB; filter by `number` or `owner`), `contracts/data/layout-old-side.json` (71 KB; filter by `item`), annex X §X.6 and §X.7 (read the rows named), `contracts/annex-tables/*.json` (never needed: the data files hold the same tables in a better shape).
3. **Never read** another feature's specification, `docs/ecosystem/`, `analyze-report.md`, `repair-report.md` or `amendments-worklist.md`. The annexes are the authority and hold every amendment in place.
4. **Earlier tasks**: read the exported signatures of a package (`packages/<p>/src/index.ts` and the file the task names), never a whole package.
5. **Conventions that every task follows without reading them again**: TypeScript 5 `strict`, ECMAScript modules, Node 22, `node:test` with `node:assert`, one validator (Ajv, pinned by T005), no `node:` import inside `packages/contracts/src/`, no model id, no path or name of the owner's machines, no paid call in any test (plan.md, "Technical Context" and "Constraints"). The `$id` of a schema is `urn:specstride:schema:<schema id>`; the value of the field `schema` in a record is the bare id with its major (`contracts/README.md`, "The `$id` of a schema file").
6. **A record pair** (one contract-test task and one type-and-validator task for a schema) reads: the schema file, the annex section it mirrors (`contracts/README.md`, table "Record schemas"), the validator of T028 and the lazy compile of T232. Nothing else.
7. **An extension-point triplet** (contract-level suite, sample, interface types) reads: the file `contracts/extension-points/EP-nn.*.json` (the thirteen sub-sections of the annex, word for word; the annex section itself is then not needed), the frame of T096 to T279, and the closed sets the point names (filter `closed-sets.json` by `number`). Nothing else.

A task whose `reads:` would exceed about 40,000 tokens was split until it does not; the largest reading of this file is a record pair on annex B §B.5 (170 lines) or an extension-point file (9 KB).

## Task ids after the split

The first task list of this feature had 228 tasks, T001 to T228. Other features, `spec.md`, `plan.md`
and the analyze report cite those ids (T005, T006, T014, T018, T022, T066, T100, T101, T194, T204,
T205, T207, T225 among them), so **no id was renumbered**, and every id keeps its file but four: T015 (`table/index.ts` → `table/load.ts`, the index is T237's), T076 (`static/index.ts` → `static/closed-sets.ts`, the runner is T264's), T094 (`tables/rows.test.ts` → `tables/exit-codes.test.ts`) and T202 (`canary/index.ts` → `canary/plant.ts`); no document outside this file names the old paths. Where a task
was too large for one window it was cut into slices: the original id keeps the first slice, in
its original file (the four exceptions above), with its `covers:` or `proves:` narrowed; the further slices carry new ids,
T229 to T296, and stand directly after their parent (two exceptions: T257 stands after the batches it assembles, and T288 to T293 stand before T207, which finishes their port) with `slice of:`. A citation of a parent id
from outside this file names the parent and its slices together; the table "Split map" at the end
lists them. The ids are therefore sequential within their phase but not across the file; the
execution order is the order of the file, and the dependencies section states it.

## What feature 100 builds, and what it does not

Feature 100 builds the `contracts` package, the test kit, four modules of the kernel (the table
evaluator; the atomic write with the path guard; the notebook sweep; the stable read), the
import-boundary check, and the build and release pieces (the two workflows, the sync and type
scripts, the release checks), as `plan.md` lists them. Its tests are at contract level: they assert a schema, a closed set, a
table, an interface type, a conformance case. The behaviour behind an interface belongs to the
content owner named in the annex, which also adds the behaviour cases of the conformance suite
and the Wave 1 implementations. No task below implements the behaviour of another feature.

## Path Conventions

Packages of one npm workspace, as in `plan.md`: `packages/contracts/`, `packages/kernel/`,
`packages/testkit/`, `tools/import-boundary/`, `tools/contracts-gen/` (T207 and its slices), `tests/parity/100/`,
`tests/characterization/100/`, `tests/release/100/` (T205, T224), and `.github/workflows/`
(T006, T225).
"Data files" are the files of `specs/100-specstride/contracts/`, copied into
`packages/contracts/schemas/` and `packages/contracts/data/` by T008. A task that names
`data/<file>.json` or `schemas/<file>.schema.json` without a directory means the copy in the
package, which equals the file of the specification byte for byte.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: the workspace that every feature needs

- [x] T001 Create the root of the npm workspace: `package.json` at the root of the repository, with the workspaces `packages/*` and `tools/*`, the engine field for Node 22 or later, and no install script
  - covers: F100-FR-027
  - reads: plan.md, "Technical Context" and "Project Structure"; annex A §A.5, F100-FR-027
- [x] T002 [P] Create the base configuration of TypeScript with `strict` and ECMAScript modules in `tsconfig.base.json`
  - covers: F100-FR-030
  - reads: plan.md, "Technical Context"; annex A §A.5, F100-FR-030
- [x] T003 [P] Create the skeleton of `packages/contracts/`: `package.json` (name `@specstride/contracts`, `type: module`, `exports`, `files` with `schemas/` and `data/`), `tsconfig.json` extending the base, an empty `src/index.ts`, and a `test` script that runs `node --test`
  - reads: plan.md, "Project Structure" (the `packages/contracts/` subtree only); T001, T002 as written
- [x] T229 [P] Create the skeleton of `packages/kernel/`: `package.json` (name `@specstride/kernel`), `tsconfig.json` extending the base, `src/index.ts` that re-exports the four modules `table/`, `atomic-write/`, `notebook-sweep/`, `stable-read/` (empty index files), and a `test` script that runs `node --test`
  - slice of: T003
  - reads: plan.md, "Project Structure" (the `packages/kernel/` subtree only); T001, T002 as written
- [x] T230 [P] Create the skeleton of `packages/testkit/`: `package.json` (name `@specstride/testkit`, scripts `test`, `test:static`, `test:tables`, `test:canary`, `conformance`, each running `node --test` over its directory), `tsconfig.json` extending the base, `src/index.ts`, and the empty directories `src/conformance/`, `src/samples/`, `src/static/`, `src/tables/`, `src/canary/`
  - slice of: T003
  - reads: plan.md, "Project Structure" (the `packages/testkit/` subtree only); quickstart.md, scenarios 3, 4, 5, 7 (the commands only); T001, T002 as written
- [x] T231 [P] Create the skeleton of `tools/import-boundary/`: `package.json` (private), `tsconfig.json` extending the base, `src/index.ts` with the command-line entry that T016 wires, and a `test` script that runs `node --test`
  - slice of: T003
  - reads: plan.md, "Project Structure" (the `tools/` subtree only); research.md, D-4; T001, T002 as written
- [x] T004 [P] Write the licence file `LICENSE` (MIT, "Copyright (c) 2026 mairp") and set the licence field of every package
  - covers: F100-FR-029
  - reads: annex A §A.5, F100-FR-029
- [x] T005 Pin the exact version of the schema validator in `packages/contracts/package.json`, record its licence and that it has no install script and no native part in `packages/contracts/DEPENDENCIES.md`
  - covers: F100-FR-027; F100-FR-029
  - reads: research.md, D-2; annex A §A.5, F100-FR-027 and F100-FR-029; the `package.json` and licence file of the validator as installed (never its source)
- [x] T006 Create the build workflow for Linux and macOS in `.github/workflows/build.yml`: `npm install --ignore-scripts`, the tests of every package, `python3 specs/100-specstride/contracts/tools/generate.py --check` until T207 is done and from then on the same check by the TypeScript tool `tools/contracts-gen/` (T207 changes this step), the import-boundary check; Python 3 is stated as a requirement of development while the script is in the build; no job calls a model
  - covers: F100-FR-026; F100-FR-027
  - reads: quickstart.md, "Prerequisites", "Tiers" and scenarios 1 to 7 (the commands); plan.md, Constitution Check rows VI and XII; annex A §A.5, F100-FR-025 to F100-FR-027
- [x] T007 [P] Configure linting and formatting for the workspace in `eslint.config.js` and `.prettierrc`
  - reads: plan.md, "Technical Context"; T002 as written

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: what every story needs: the data files in the package, generated types, the lazy validator, the table evaluator, the import-boundary check

**CRITICAL**: no story starts before this phase is complete

- [x] T008 Write the script `packages/contracts/scripts/sync.mjs` that copies `specs/100-specstride/contracts/schemas/` and `contracts/data/` into `packages/contracts/schemas/` and `packages/contracts/data/` and fails when the generator check of the specification fails
  - covers: F100-FR-038
  - reads: contracts/README.md, "How the files are made", "Record schemas", "Data" (the file lists only); quickstart.md, scenario 1; annex B §B.2, F100-FR-038
- [x] T009 Write the script `packages/contracts/scripts/types.mjs` that generates one TypeScript type per schema file of `packages/contracts/schemas/` into `packages/contracts/src/records/generated/<stem>.ts` and an index, from the schema's `properties`, `required`, `x-type-in-words` and `description`; the script is run by the `build` script of the package and its output is committed
  - covers: F100-FR-048
  - reads: research.md, D-1; contracts/README.md, "The `$id` of a schema file"; three schema files as the sample of the shape: `schemas/lease.schema.json`, `schemas/run-record.schema.json`, `schemas/launch-contract.schema.json`
- [x] T232 Write the lazy validator loader `packages/contracts/src/records/compile.ts`: `validatorFor(schemaId)`, keyed by the value a record carries in its `schema` field (the schema id with its major, for example `specstride.lease/1`, F100-FR-048), reads the schema file of the id from `packages/contracts/schemas/` through the package's own file map (no `node:` import: the map is generated into `src/records/schema-map.ts` by T009), compiles it with the validator of T005 at first use, caches it, and exposes `validate(schemaId, value)` that returns the typed record or the list of errors
  - slice of: T009
  - covers: F100-FR-048
  - reads: research.md, D-2; plan.md, "Performance Goals"; T009 as written (the generated index and the schema map); `schemas/lease.schema.json` as the sample
- [x] T010 [P] Contract tests CT-100-101, CT-100-102, CT-100-103, CT-100-104 for Layering rules LR-1 to LR-4 (annex A, §A.2) in tools/import-boundary/test/layering.test.ts: the graph refuses an import from a lower to a higher layer and from L3 or L4 to an L1 package; a host package may import nothing of the product but the CLI protocol; the packages of L6 and L5 share no import; the writers of the control plane in `layout.json` are packages of the runtime tree only
  - proves: F100-FR-001; F100-FR-002; F100-FR-003; F100-FR-004
  - reads: annex A §A.1 and §A.2, F100-FR-001 to F100-FR-004; `data/package-graph.json`; `data/layers.json`; the `writer` column of `data/layout.json` (the keys `logicalNames[].writer` only)
- [x] T233 [P] Contract tests CT-100-105, CT-100-106, CT-100-107, CT-100-108 for Layering rules LR-5 to LR-8 (annex A, §A.2) in tools/import-boundary/test/layering-5-8.test.ts: the event file of a run has one writer per liveness state, and learning has its own writer domain, its own lock and its own event file in `layout.json` (the contention test belongs to the owner of learning); every boundary that the tables of annex E §E.4 and G §G.4 mark as a process boundary stays a process in `process-model.json`, and every other boundary is a call that returns a result record whose `exit_code` equals the as-is code; the five pure tables name the table evaluator of the kernel as their only evaluator in the graph; role resolution lives in the harness layer and no loop-layer or router package may import it
  - slice of: T010
  - proves: F100-FR-005; F100-FR-006; F100-FR-007; F100-FR-008
  - reads: annex A §A.2, F100-FR-005 to F100-FR-008; `data/package-graph.json`; `data/layers.json`; the `writer` column of `data/layout.json`; the keys `engine[].process` of `data/exit-codes.json` and `perCommand[].Command`; the key `processes` of `data/process-model.json` (the processes of annex F §F.1)
- [x] T234 [P] Contract tests CT-100-109, CT-100-110, CT-100-111 for Layering rules LR-9 to LR-11 (annex A, §A.2) in tools/import-boundary/test/layering-9-11.test.ts: one ingress package names the redactor and a size cap, every sink and prompt package imports only the ingress, and the cap under the `parity` profile is not below 60000 characters of phase evidence and 327680 bytes of grounding at a window of 200000 tokens; no package of the graph is an oracle mode (no package name or export named for the oracle other than the compatibility projection); every closed set of `closed-sets.json` has an owner and an unknown-value rule, every schema file has a required `schema` property, and the validator of T028 refuses a record whose major differs from the one the schema supports
  - slice of: T010
  - proves: F100-FR-009; F100-FR-010; F100-FR-011
  - reads: annex A §A.2, F100-FR-009 to F100-FR-011; `data/package-graph.json`; the keys `closedSets[].owner` and `closedSets[].unknownValue` of `data/closed-sets.json` (never the `literals`); the list of files of `schemas/`
- [x] T011 Implement the graph loader and the import-permission rule of the import-boundary check over `packages/contracts/data/package-graph.json`: read the packages with their layer and `mayImport`, read the import statements of every source file with the TypeScript compiler, and fail with the file, the import and the rule id LR-1 on an import that `mayImport` does not list or that goes to a higher layer (annex A, §A.2) in tools/import-boundary/src/rules.ts
  - covers: F100-FR-001; F100-FR-003; F100-FR-004
  - reads: annex A §A.1 and §A.2, F100-FR-001, F100-FR-003, F100-FR-004; `data/package-graph.json` (all keys); research.md, D-4; T231 as written
- [x] T235 Export the layer facts of `layers.json` and of the graph as data for the contract tests of LR-2 to LR-11: the layer of every package, the packages of the runtime tree, the host packages, the ingress package, the writer of each logical name, the pure tables and their evaluator, the package of role resolution (annex A, §A.2) in tools/import-boundary/src/layer-facts.ts
  - slice of: T011
  - covers: F100-FR-002; F100-FR-005; F100-FR-006; F100-FR-007; F100-FR-008; F100-FR-009; F100-FR-010; F100-FR-011
  - reads: annex A §A.1 and §A.2, F100-FR-002 and F100-FR-005 to F100-FR-011; `data/layers.json`; `data/package-graph.json`; the `writer` column of `data/layout.json`; T011 as written
- [x] T012 [P] Contract tests CT-100-112 for Import rule for the core (annex A, §A.3) in tools/import-boundary/test/core-rule.test.ts
  - proves: F100-FR-012
  - reads: annex A §A.3, F100-FR-012; the packages marked `core: true` in `data/package-graph.json` and the key `rules`
- [x] T013 Implement the first core rule: a core package (a package of the graph marked `core: true`: the engine with the pass loop and every loop-layer package) fails the check on an import of any package of the graph other than `@specstride/contracts` and `@specstride/kernel`, of a provider SDK or any external package, of `node:fs` or `node:fs/promises` (files go through the kernel and the ports of the edge packages, F100-FR-234), and of `node:child_process`, `node:net`, `node:http`, `node:https` or `node:dgram` (no process started and no connection opened directly), each with the file, the import and the rule (annex A, §A.3) in tools/import-boundary/src/core-rule.ts
  - covers: F100-FR-012
  - reads: annex A §A.3, F100-FR-012; `data/package-graph.json` (the keys `name`, `layer`, `mayImport`, `core`, `nodeBuiltins`, and `rules`); T011 as written
- [x] T236 Implement the second core rule: a source file of a core package that names a sample of the test kit (`packages/testkit/src/samples/EP-nn/`) or a Wave 1 implementation of any of the nineteen extension points (every package of the graph that is not marked `core: true` and is not `@specstride/contracts` or `@specstride/kernel`: the harness adapters of L1, the sinks, the hosts of L7, the router rules and prompt blocks of annex D among them; what one core package may import from another is the `mayImport` rule of T011) by its package name or its path fails the check, with the file, the name and the rule (annex A, §A.3) in tools/import-boundary/src/core-names.ts
  - slice of: T013
  - covers: F100-FR-012; F100-FR-018
  - reads: annex A §A.3, F100-FR-012; annex A §A.4, F100-FR-018; the keys `name`, `layer` and `core` of every package in `data/package-graph.json`; T013 as written
- [x] T014 [P] Contract tests CT-100-304 for Table evaluator (annex X, §X.3) in packages/kernel/test/table.test.ts
  - proves: F100-FR-204
  - reads: annex X §X.3 (whole section, 21 lines); `schemas/rule-table.schema.json`; row 68 of `data/closed-sets.json` (the operators)
- [x] T015 Implement the load of a rule table: parse against `schemas/rule-table.schema.json`, refuse at load a table without a default row per decision point, a choice outside the choice set, an unknown signal or an unknown operator, each with the table id, the version and the row (annex X, §X.3) in packages/kernel/src/table/load.ts
  - covers: F100-FR-204
  - reads: annex X §X.3; `schemas/rule-table.schema.json`; row 68 of `data/closed-sets.json`; T232 as written (the validator)
- [x] T237 Implement the evaluation: a pure function over a loaded table and a vector of signals (no I/O, no clock, no randomness), first match in row order, the default row when no row matches, and the decision record with the rule id, the table id and the table version (annex X, §X.3) in packages/kernel/src/table/index.ts, which re-exports the loader of T015
  - slice of: T015
  - covers: F100-FR-204; F100-FR-007
  - reads: annex X §X.3; annex A §A.2, F100-FR-007; T015 as written
- [x] T016 Wire the import-boundary check as the script `check:imports` of the root `package.json`, with a test tree of a permitted and a forbidden import in `tools/import-boundary/test/fixtures/`
  - covers: F100-FR-001; F100-FR-012
  - reads: quickstart.md, scenario 5; T011, T013, T236 as written (their exported functions)

**Checkpoint**: the workspace builds, the data files are in the package, `check:imports` runs

---

## Phase 3: User Story 1 - The feature specifications read one source (Priority: P1)

**Goal**: Every shared value is in the `contracts` package as data with a validator, and the static tests hold the specifications to it

**Independent Test**: Scenarios 1, 2 and 3 of `quickstart.md`

### Product-wide rules (annex A §A.5)

- [x] T017 [P] [US1] Contract tests CT-100-122, CT-100-123, CT-100-124, CT-100-125, CT-100-126 for Product-wide rules F100-FR-022 to F100-FR-026 (annex A, §A.5) in packages/testkit/test/product-rules.test.ts
  - proves: F100-FR-022; F100-FR-023; F100-FR-024; F100-FR-025; F100-FR-026
  - checks: at contract level, what each rule leaves in the data files or the specifications. F100-FR-024: the EP-02 contract of `complete` (`contracts/extension-points/EP-02.harness.json`) requires a fresh session per call, and the closed set of the diversity test (annex X §X.6 row 183) holds `same-model` and `unverified`, both of which raise the warning; the behaviour is proven by 124 and 101. F100-FR-026: no package of the graph, no schema and no data file names a state directory of the three as-is systems (the old side of the layout table names them, and only there); the behaviour (doctor finding, tree left untouched) is proven by 112 and 122
  - reads: annex A §A.5, F100-FR-022 to F100-FR-026; the `complete` operation of `contracts/extension-points/EP-02.harness.json`; row 183 of `data/closed-sets.json`; the `placeholders` key of `data/layout-old-side.json` (the as-is directory names)
- [x] T238 [P] [US1] Contract tests CT-100-127, CT-100-128, CT-100-129, CT-100-130, CT-100-131 for Product-wide rules F100-FR-027 to F100-FR-031 (annex A, §A.5) in packages/testkit/test/product-rules-2.test.ts
  - slice of: T017
  - proves: F100-FR-027; F100-FR-028; F100-FR-029; F100-FR-030; F100-FR-031
  - checks: F100-FR-031: the closed sets of run states, exit codes and stop reasons hold no member owned by 115, 142 or 148, and the second suite of the oracle (T204) compares equal counters; the behaviour is proven by 115 and 142
  - reads: annex A §A.5, F100-FR-027 to F100-FR-031; rows 1, 3, 6 and 7 of `data/closed-sets.json`; the keys `published` and `builtByFeature100` of `data/package-graph.json`; `LICENSE`
- [x] T018 [US1] Implement the static checks of the vocabulary and of the open registry: never-bare terms written in their qualified form, and no requirement of any specification under `specs/1*/` that lists harness names (annex A, §A.5) in packages/testkit/src/static/product-rules.ts
  - covers: F100-FR-022; F100-FR-023
  - checks: F100-SC-004
  - reads: annex A §A.5, F100-FR-022 and F100-FR-023; row 183 and the rows whose `name` holds "harness" of `data/closed-sets.json` (the names a check may match); the list of never-bare terms as the annex states it
- [x] T239 [US1] Implement the static checks of the critic session and of the platform marks: the EP-02 contract file requires a fresh session per `complete` call and the diversity set holds `same-model` and `unverified`; every macOS statement of the specification carries `unverified` until T206 has passed, and no specification names Windows or WSL as supported (annex A, §A.5) in packages/testkit/src/static/product-rules-platform.ts
  - slice of: T018
  - covers: F100-FR-024; F100-FR-025
  - reads: annex A §A.5, F100-FR-024 and F100-FR-025; the `complete` operation of `contracts/extension-points/EP-02.harness.json`; row 183 of `data/closed-sets.json`
- [x] T240 [US1] Implement the static checks of packaging: no package of the graph, no schema and no data file names a state directory of the three as-is systems outside `data/layout-old-side.json`; the root `package.json` and every package have no install script and no compile step, and every dependency of a published package is declared at an exact version, never a range; no legacy command name, legacy variable name or migration of a pre-v2 layout is carried; the shipped package has the audience `distributed` in its data and the audience key `distribution.audience` is settable through user configuration only, never through the environment, a flag, project configuration or the consumer's comment (annex A, §A.5) in packages/testkit/src/static/product-rules-packaging.ts
  - slice of: T018
  - covers: F100-FR-026; F100-FR-027; F100-FR-028
  - reads: annex A §A.5, F100-FR-026 to F100-FR-028; the `placeholders` key of `data/layout-old-side.json`; row 34 of `data/parity-profile.json` (the key `distribution.audience`); the `ranks` of `data/config-ranks.json`
- [x] T241 [US1] Implement the static checks of licence, language and the loop layers: `LICENSE` is MIT with the copyright line and no published file holds an owner-specific path, account or name, every dependency is MIT-compatible and a proprietary one is optional and never bundled; every source file of the workspace is TypeScript or JSON and the Language Ledger is empty; the closed sets of run states, exit codes and stop reasons hold no member owned by 115, 142 or 148 (annex A, §A.5) in packages/testkit/src/static/product-rules-vocabulary.ts
  - slice of: T018
  - covers: F100-FR-029; F100-FR-030; F100-FR-031
  - checks: F100-FR-031 at contract level through the sets; the counters through T204
  - reads: annex A §A.5, F100-FR-029 to F100-FR-031; rows 1, 3, 6, 7 of `data/closed-sets.json`; the `licence` field of every dependency as installed (never its source); `LICENSE`

### Locations, layout rules, identifiers (annex B §B.1 to §B.3)

- [x] T019 [P] [US1] Parity test PT-100-C-011-roots in tests/parity/100/layout-roots.test.ts
  - proves: C-011; B-0157; B-0165
  - requirement: F100-FR-032
  - fixture: FX-01
  - reads: annex B §B.1; the `roots` and `locations` keys of `data/layout.json`; the items B-0157 and B-0165 of `data/layout-old-side.json`; the quickstart of feature 141 for how a parity test of table level is written (its section on table-level assertions only)
- [x] T020 [P] [US1] Contract tests CT-100-133, CT-100-134 for Locations of state (annex B, §B.1) in packages/contracts/test/roots.test.ts
  - proves: F100-FR-033; F100-FR-034
  - reads: annex B §B.1; the `roots` and `locations` keys of `data/layout.json`
- [x] T021 [US1] Implement the roots and the worker root as data and types from `data/layout.json`, with the fallback of the control root (annex B, §B.1) in packages/contracts/src/ids/roots.ts
  - covers: F100-FR-032; F100-FR-033; F100-FR-034
  - reads: annex B §B.1; the `roots` and `locations` keys of `data/layout.json`; plan.md, "Physical paths behind the logical names" (the first table)
- [x] T022 [P] [US1] Contract tests CT-100-136, CT-100-143 for the two kernel functions of the layout rules SL-2 and the path guard (annex B, §B.2) in packages/kernel/test/layout-rules.test.ts: a write is a temporary name in the same directory then a rename, and a reader that opens during the write sees the old file or the new one and never a partial one; a real path that leaves its root, and a link inside the control plane, are refused with the path and the root
  - proves: F100-FR-036; F100-FR-043
  - reads: annex B §B.2, F100-FR-036 and F100-FR-043
- [x] T242 [P] [US1] Contract tests CT-100-135, CT-100-137, CT-100-138, CT-100-139, CT-100-140, CT-100-141, CT-100-142 for the layout rules SL-1, SL-3 to SL-7 as data (annex B, §B.2) in packages/contracts/test/layout-rules-data.test.ts: the claims are read no-follow and decide nothing; the refused paths of grounding are exactly the logical names the rule lists; the layout has a version; after launch only the inbox and the supervision record are written from outside; `protection` is `detect` at C0 and C1, and `prevent` at C2 and above only when the harness adapter confirmed that the sandbox denies writes to the control plane; the layout version file is a logical name; the advisory marker holds an owner record and `foreign-owner` is a refusal
  - slice of: T022
  - proves: F100-FR-035; F100-FR-037; F100-FR-038; F100-FR-039; F100-FR-040; F100-FR-041; F100-FR-042
  - reads: annex B §B.2, F100-FR-035 and F100-FR-037 to F100-FR-042; the `layoutVersion` key and the names of `data/layout.json` whose `root` is `workspace` or `control`; `data/harness-tables.json` key `containmentLevels`
- [x] T023 [US1] Implement the atomic write of the kernel: write to a temporary name in the same directory, fsync, rename into place; a state file holds current state only (annex B, §B.2, SL-2) in packages/kernel/src/atomic-write/index.ts
  - covers: F100-FR-036
  - reads: annex B §B.2, F100-FR-036; T229 as written
- [x] T243 [US1] Implement the path guard of the kernel: resolve the real path and require it inside its root, refuse a symbolic link inside the control plane, open the files it reads as claims (outbox, phase evidence) without following links, and create the directories and files of the control plane, the user-level state and the worker root 0700 and 0600, owner only (annex B, §B.2, SL-1 and F100-FR-043) in packages/kernel/src/atomic-write/path-guard.ts
  - slice of: T023
  - covers: F100-FR-035; F100-FR-043
  - reads: annex B §B.2, F100-FR-035 and F100-FR-043; T023 as written
- [x] T244 [US1] Export the layout rules as data of the `contracts` package: the logical names that grounding refuses by real path (the control plane, the event stream, the outbox, the carry-over files, the worker root and the tree store) and the rule that every path under the project's repository directory is refused too, the layout version and the name of its file in the workspace part, the two names written from outside after launch, the value of `protection` per containment level (`detect` at C0 and C1; `prevent` at C2 and above only when the harness adapter confirmed that the sandbox denies writes to the control plane, else `detect`), and the refusal `foreign-owner` of the advisory marker (annex B, §B.2, SL-3 to SL-7) in packages/contracts/src/ids/layout-rules.ts
  - slice of: T023
  - covers: F100-FR-037; F100-FR-038; F100-FR-039; F100-FR-040; F100-FR-041; F100-FR-042
  - reads: annex B §B.2, F100-FR-037 to F100-FR-042; the `layoutVersion` key of `data/layout.json` and the names it lists for the control plane, the event stream, the outbox, the carry-over files, the worker root and the tree store; `data/harness-tables.json` key `containmentLevels`
- [x] T024 [P] [US1] Parity test PT-100-C-013-run-id in tests/parity/100/run-id.test.ts
  - proves: C-013; B-0248
  - requirement: F100-FR-046
  - fixture: FX-01
  - reads: annex B §B.3, F100-FR-046; the row `runId` of `data/identifiers.json`; the item B-0248 of `data/layout-old-side.json`; the quickstart of feature 141 (table-level assertions)
- [x] T025 [P] [US1] Contract tests CT-100-144, CT-100-145, CT-100-147 for Identifiers (annex B, §B.3) in packages/contracts/test/identifiers.test.ts
  - proves: F100-FR-044; F100-FR-045; F100-FR-047
  - reads: annex B §B.3; `data/identifiers.json`
- [x] T026 [US1] Implement the identifier types (one branded string type per row of `data/identifiers.json`) and the minting rules as data: scope, minting process, rule, and the rule that a `launch` continues the unfinished run of the feature unless `--new-run` (annex B, §B.3) in packages/contracts/src/ids/identifiers.ts
  - covers: F100-FR-044; F100-FR-045
  - reads: annex B §B.3, F100-FR-044 and F100-FR-045; `data/identifiers.json`
- [x] T245 [US1] Implement the as-is form of the run id for compatibility output (date and time of the engine start to the second, a hyphen, the process id) and the name of a phase attempt with the phase number, the ordinal of the engine start and the ordinal of the attempt (`e<k>-a<n>`), with the as-is suffix rule where a directory of that name already exists (the run id is appended) (annex B, §B.3) in packages/contracts/src/ids/attempt-names.ts
  - slice of: T026
  - covers: F100-FR-046; F100-FR-047
  - reads: annex B §B.3, F100-FR-046 and F100-FR-047; the rows `runId`, `engineStartId`, `attemptId` of `data/identifiers.json`; plan.md, "Physical paths behind the logical names" (the `attempts/e<k>-a<n>/` line); T026 as written

### Common rules of records and the logical names (annex B §B.4, §B.5)

- [x] T027 [P] [US1] Contract tests CT-100-148, CT-100-149, CT-100-150, CT-100-151, CT-100-152 for Common rules of records (annex B, §B.4) in packages/contracts/test/records-common.test.ts
  - proves: F100-FR-048; F100-FR-049; F100-FR-050; F100-FR-051; F100-FR-052
  - reads: annex B §B.4; `schemas/lease.schema.json` and `schemas/run-record.schema.json` as the two samples; the `writer` column of `data/layout.json`
- [x] T028 [US1] Implement the record validator over the lazy compile of T232: `readRecord(logicalName, value)` requires the field `schema`, refuses an unknown schema id or a major other than the one supported with the message of the annex (the logical name, the major found, the major supported), and returns the typed record (annex B, §B.4) in packages/contracts/src/records/validate.ts
  - covers: F100-FR-048; F100-FR-049
  - reads: annex B §B.4, F100-FR-048 and F100-FR-049; contracts/README.md, "The `$id` of a schema file"; T232 as written
- [x] T246 [US1] Implement the further rules of records: an unknown field is ignored by the reader and kept by a writer that copies (a `copyRecord` helper); the check `holdsNoSecret(record)` that refuses a secret value, a nonce before its call returned, or content, and asks for the reference, the hash, or the logical name with hash and size; the check `oneWriter(layout)` that fails when two processes write one logical name; and the rule of `productVersions` of the run record (one list: the version that started the run, then the version of every later engine start; a difference is recorded as an event and shown by the doctor, F100-FR-050) (annex B, §B.4) in packages/contracts/src/records/rules.ts
  - slice of: T028
  - covers: F100-FR-050; F100-FR-051; F100-FR-052
  - reads: annex B §B.4, F100-FR-050 to F100-FR-052; the `writer` column of `data/layout.json`; the field `productVersions` of `schemas/run-record.schema.json`; T028 as written
- [x] T029 [P] [US1] Parity test PT-100-C-011-current-names in tests/parity/100/layout-current-names.test.ts
  - proves: C-011; B-0167; B-0168
  - requirement: F100-FR-055
  - fixture: FX-01
  - reads: annex B §B.5, F100-FR-055; the names `workspace:current:events` and `workspace:current:engine-log` of `data/layout.json`; the items B-0167 and B-0168 of `data/layout-old-side.json`; the quickstart of feature 141 (table-level assertions)
- [x] T030 [P] [US1] Parity test PT-100-C-013-notebook-sweep in tests/parity/100/notebook-sweep.test.ts
  - proves: C-013; B-0256
  - requirement: F100-FR-057
  - fixture: FX-01
  - reads: annex B §B.5, F100-FR-057; the name `feature:<slug>:notebook` of `data/layout.json`; the item B-0256 of `data/layout-old-side.json`; the quickstart of feature 141 (table-level assertions)
- [x] T031 [P] [US1] Parity test PT-100-C-012-sweep-line in tests/parity/100/notebook-sweep-line.test.ts
  - proves: C-012; B-0194
  - requirement: F100-FR-057
  - fixture: FX-01
  - reads: annex B §B.5, F100-FR-057; the item B-0194 of `data/layout-old-side.json`; the quickstart of feature 141 (table-level assertions)
- [x] T032 [P] [US1] Parity test PT-100-C-008-sweep-event in tests/parity/100/notebook-sweep-event.test.ts
  - proves: C-008; B-0085
  - requirement: F100-FR-058
  - fixture: FX-01
  - reads: annex B §B.5, F100-FR-058; the item B-0085 of `data/layout-old-side.json`; the quickstart of feature 141 (table-level assertions)
- [x] T033 [P] [US1] Contract tests CT-100-153, CT-100-154, CT-100-156 for Logical names (annex B, §B.5) in packages/contracts/test/logical-names.test.ts
  - proves: F100-FR-053; F100-FR-054; F100-FR-056
  - reads: annex B §B.5, F100-FR-053, F100-FR-054, F100-FR-056 (the requirements, not the whole table); `data/layout.json` (`layoutVersion`, `roots`, and the five `pipeline:<pipelineId>:*` names); the `comparedRows` key of `data/layout-old-side.json`
- [x] T034 [US1] Implement the resolver from a logical name and its parameters to a path, from `data/layout.json`: the layout version, the root, the one writer and the readers of every name, the substitution of `<workspaceId>`, `<slug>`, `<runId>`, `<N>`, `<k>`, `<n>`, `<launchId>`, `<pipelineId>` and the other parameters of the path templates, the five compared names of the pipeline, the two names that resolve to the current run, and the refusal of a name the table does not hold (annex B, §B.5) in packages/contracts/src/ids/logical-names.ts
  - covers: F100-FR-053; F100-FR-054; F100-FR-055; F100-FR-056
  - reads: annex B §B.5 (the table, 170 lines: this is the largest reading of the file); `data/layout.json`; T021 as written
- [x] T247 [US1] Implement the notebook sweep as a function of the kernel that the engine calls at the start of a phase: look at the two as-is stray places (the directory of the phase evidence and the root of the working tree), move a stray notebook to `feature:<slug>:notebook` through the resolver of T034 and the atomic write of T023 (the newer file wins: the stray file is deleted when the canonical one is newer and replaces it otherwise), write the as-is log line of the sweep with both paths, and return the event `progress.swept` with `from` and `to` for the engine to emit (annex B, §B.5) in packages/kernel/src/notebook-sweep/index.ts
  - slice of: T034
  - covers: F100-FR-057; F100-FR-058
  - reads: annex B §B.5, F100-FR-057 and F100-FR-058; the name `feature:<slug>:notebook` and the two stray places as F100-FR-057 names them (its origin items B-0194 and B-0256); T023, T034 as written

### The thirteen records of annex B (§B.6 to §B.19)

Each pair reads what "Context budget" rule 6 lists and nothing else.

- [x] T035 [P] [US1] Contract tests CT-100-159 for Workspace record (annex B, §B.6): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/workspace-record.test.ts
  - proves: F100-FR-059
  - reads: rule 6: `schemas/workspace-record.schema.json`; annex B §B.6
- [x] T036 [US1] Type and validator of Workspace record from `schemas/workspace-record.schema.json`, with the rules of the requirements of annex B, §B.6, in packages/contracts/src/records/workspace-record.ts
  - covers: F100-FR-059
  - reads: rule 6
- [x] T037 [P] [US1] Contract tests CT-100-160 for Launch record (annex B, §B.7): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/launch-record.test.ts
  - proves: F100-FR-060
  - reads: rule 6: `schemas/launch-record.schema.json`; annex B §B.7
- [x] T038 [US1] Type and validator of Launch record from `schemas/launch-record.schema.json`, with the rules of the requirements of annex B, §B.7, in packages/contracts/src/records/launch-record.ts
  - covers: F100-FR-060
  - reads: rule 6
- [x] T039 [P] [US1] Contract tests CT-100-161 for Lease (annex B, §B.8): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/lease.test.ts
  - proves: F100-FR-061
  - reads: rule 6: `schemas/lease.schema.json`; annex B §B.8
- [x] T040 [US1] Type and validator of Lease from `schemas/lease.schema.json`, with the rules of the requirements of annex B, §B.8, in packages/contracts/src/records/lease.ts
  - covers: F100-FR-061
  - reads: rule 6
- [x] T041 [P] [US1] Contract tests CT-100-162 for Owner record (annex B, §B.9): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/owner-record.test.ts
  - proves: F100-FR-062
  - reads: rule 6: `schemas/owner-record.schema.json`; annex B §B.9
- [x] T042 [US1] Type and validator of Owner record from `schemas/owner-record.schema.json`, with the rules of the requirements of annex B, §B.9, in packages/contracts/src/records/owner-record.ts
  - covers: F100-FR-062
  - reads: rule 6
- [x] T043 [P] [US1] Contract tests CT-100-163, CT-100-164 for Process registry (annex B, §B.10): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/process-registry.test.ts
  - proves: F100-FR-063; F100-FR-064
  - reads: rule 6: `schemas/process-registry.schema.json`; annex B §B.10
- [x] T044 [US1] Type and validator of Process registry from `schemas/process-registry.schema.json`, with the rules of the requirements of annex B, §B.10, in packages/contracts/src/records/process-registry.ts
  - covers: F100-FR-063; F100-FR-064
  - reads: rule 6
- [x] T045 [P] [US1] Contract tests CT-100-165 for Inbox requests (annex B, §B.11): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/inbox-request.test.ts
  - proves: F100-FR-065
  - reads: rule 6: `schemas/inbox-request.schema.json`; annex B §B.11
- [x] T046 [US1] Type and validator of Inbox requests from `schemas/inbox-request.schema.json`, with the rules of the requirements of annex B, §B.11, in packages/contracts/src/records/inbox-request.ts
  - covers: F100-FR-065
  - reads: rule 6
- [x] T047 [P] [US1] Contract tests CT-100-166, CT-100-167 for Run snapshot (annex B, §B.12): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/run-snapshot.test.ts
  - proves: F100-FR-066; F100-FR-067
  - reads: rule 6: `schemas/run-snapshot.schema.json`; annex B §B.12
- [x] T048 [US1] Type and validator of Run snapshot from `schemas/run-snapshot.schema.json`, with the rules of the requirements of annex B, §B.12, in packages/contracts/src/records/run-snapshot.ts
  - covers: F100-FR-066; F100-FR-067
  - reads: rule 6
- [x] T049 [P] [US1] Contract tests CT-100-168, CT-100-169 for Ledger (annex B, §B.13): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/ledger-record.test.ts
  - proves: F100-FR-068; F100-FR-069
  - reads: rule 6: `schemas/ledger-record.schema.json`; annex B §B.13
- [x] T050 [US1] Type and validator of Ledger from `schemas/ledger-record.schema.json`, with the rules of the requirements of annex B, §B.13, in packages/contracts/src/records/ledger-record.ts
  - covers: F100-FR-068; F100-FR-069
  - reads: rule 6
- [x] T051 [P] [US1] Contract tests CT-100-170 for Approval record (annex B, §B.14): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/approval-record.test.ts
  - proves: F100-FR-070
  - reads: rule 6: `schemas/approval-record.schema.json`; annex B §B.14
- [x] T052 [US1] Type and validator of Approval record from `schemas/approval-record.schema.json`, with the rules of the requirements of annex B, §B.14, in packages/contracts/src/records/approval-record.ts
  - covers: F100-FR-070
  - reads: rule 6
- [x] T053 [P] [US1] Contract tests CT-100-171 for Terminal record (annex B, §B.15): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/terminal-record.test.ts
  - proves: F100-FR-071
  - reads: rule 6: `schemas/terminal-record.schema.json`; annex B §B.15
- [x] T054 [US1] Type and validator of Terminal record from `schemas/terminal-record.schema.json`, with the rules of the requirements of annex B, §B.15, in packages/contracts/src/records/terminal-record.ts
  - covers: F100-FR-071
  - reads: rule 6
- [x] T055 [P] [US1] Contract tests CT-100-172 for Supervision record (annex B, §B.16): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/supervision-record.test.ts
  - proves: F100-FR-072
  - reads: rule 6: `schemas/supervision-record.schema.json`; annex B §B.16
- [x] T056 [US1] Type and validator of Supervision record from `schemas/supervision-record.schema.json`, with the rules of the requirements of annex B, §B.16, in packages/contracts/src/records/supervision-record.ts
  - covers: F100-FR-072
  - reads: rule 6
- [x] T057 [P] [US1] Contract tests CT-100-173 for Pause record (annex B, §B.17): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/pause-record.test.ts
  - proves: F100-FR-073
  - reads: rule 6: `schemas/pause-record.schema.json`; annex B §B.17
- [x] T058 [US1] Type and validator of Pause record from `schemas/pause-record.schema.json`, with the rules of the requirements of annex B, §B.17, in packages/contracts/src/records/pause-record.ts
  - covers: F100-FR-073
  - reads: rule 6
- [x] T059 [P] [US1] Contract tests CT-100-174 for Tripwire record (annex B, §B.18): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/tripwire-record.test.ts
  - proves: F100-FR-074
  - reads: rule 6: `schemas/tripwire-record.schema.json`; annex B §B.18
- [x] T060 [US1] Type and validator of Tripwire record from `schemas/tripwire-record.schema.json`, with the rules of the requirements of annex B, §B.18, in packages/contracts/src/records/tripwire-record.ts
  - covers: F100-FR-074
  - reads: rule 6
- [x] T061 [P] [US1] Contract tests CT-100-175 for State export, import and adopt (annex B, §B.19) in packages/contracts/test/state-archive.test.ts
  - proves: F100-FR-075
  - reads: annex B §B.19 (6 lines)
- [x] T062 [US1] Implement the interface type of the signed archive of one feature (approval records, ledger, learning log) and the rule that none of the three commands runs beside a live run, as data for feature 122 (annex B, §B.19) in packages/contracts/src/records/state-archive.ts
  - covers: F100-FR-075
  - reads: annex B §B.19; the exported types of T050 and T052

### Envelopes, hasher, closed sets, profile, normalization, static tests (annex X)

- [x] T063 [P] [US1] Contract tests CT-100-298, CT-100-299, CT-100-300 for Event envelope and versioning (annex X, §X.1): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/event-envelope.test.ts
  - proves: F100-FR-198; F100-FR-199; F100-FR-200
  - reads: annex X §X.1; `schemas/event-envelope.schema.json`
- [x] T064 [US1] Type and validator of Event envelope and versioning from `schemas/event-envelope.schema.json`, with the rules of the requirements of annex X, §X.1 (typed values, null for unknown, absence for not-applicable, the range of majors a reader declares, a torn last line tolerated, no content), in packages/contracts/src/envelope/event.ts
  - covers: F100-FR-198; F100-FR-199; F100-FR-200
  - reads: annex X §X.1; `schemas/event-envelope.schema.json`; T028 as written
- [x] T065 [P] [US1] Contract tests CT-100-301, CT-100-302, CT-100-303 for Config envelope, ranks and trust classes (annex X, §X.2) in packages/contracts/test/config-envelope.test.ts
  - proves: F100-FR-201; F100-FR-202; F100-FR-203
  - reads: annex X §X.2; `data/config-ranks.json`; `schemas/config-envelope.schema.json`
- [x] T066 [US1] Implement the eight ranks of configuration from `data/config-ranks.json` as data and type, the resolution of one key through the ranks with the rank recorded, and the place of a tunable key on `resume` (annex X, §X.2) in packages/contracts/src/envelope/config.ts
  - covers: F100-FR-201
  - reads: annex X §X.2, F100-FR-201 and the table of ranks; the `ranks` key of `data/config-ranks.json`; row 76 of `data/closed-sets.json`
- [x] T248 [US1] Implement the four trust classes from `data/config-ranks.json` as data and type, and the filter over project configuration: a widening key is dropped with the launch message and the doctor warning, and a narrowing key is accepted only where its value is stricter than the value from the lower ranks (annex X, §X.2) in packages/contracts/src/envelope/trust-classes.ts
  - slice of: T066
  - covers: F100-FR-202
  - reads: annex X §X.2, F100-FR-202 and the table of trust classes; the `trustClasses` key of `data/config-ranks.json`; T066 as written
- [x] T249 [US1] Implement the envelope validator of a configuration file from `schemas/config-envelope.schema.json`: `schema` required, an unknown key at any level refuses the launch, a key under `x-` is ignored, an inline secret is an error, the as-is environment variables are read through the alias table of `data/normalization.json`, and a value that arrives through an alias the baseline reads late is not refused at launch under the `parity` profile (it fails where the baseline fails; the owner of the key states the place) (annex X, §X.2, §X.8) in packages/contracts/src/envelope/config-validate.ts
  - slice of: T066
  - covers: F100-FR-203
  - reads: annex X §X.2, F100-FR-203; annex X §X.8, the alias table; `schemas/config-envelope.schema.json`; the `environmentAliases` key of `data/normalization.json`; T028, T232 as written
- [x] T067 [P] [US1] Contract tests CT-100-307 for Canonical hasher (annex X, §X.5) in packages/contracts/test/hasher-contract.test.ts
  - proves: F100-FR-207
  - reads: annex X §X.5; the `hasher` key of `data/kernel-operations.json`
- [x] T068 [US1] Implement the interface type of the canonical hasher with its operations. The hasher itself belongs to feature 104 (annex X, §X.5) in packages/contracts/src/ep/hasher.ts
  - covers: F100-FR-207
  - reads: annex X §X.5; the `hasher` key of `data/kernel-operations.json`
- [x] T069 [P] [US1] Contract tests CT-100-308, CT-100-309 for List of closed sets (annex X, §X.6) in packages/contracts/test/closed-sets.test.ts: every row of `closed-sets.json` has a number, a name, an owner, `closedBy` and an unknown-value rule; every set the package exports has a row and every row with literals has an export whose members equal the literals; a reader without a branch for an unknown value fails
  - proves: F100-FR-208; F100-FR-209
  - checks: F100-SC-007
  - reads: annex X §X.6, F100-FR-208 and F100-FR-209 (the two requirements and the head of the table, not the 278 rows); the keys of the first three rows of `data/closed-sets.json`
- [x] T070 [US1] Implement the mechanism of the closed sets: the loader of `data/closed-sets.json` with the type of a row; the type `ClosedSet<M>` (name, number, owner, members as a readonly tuple, `has(value)`, `onUnknown(value)`); the kinds of unknown-value rule that the column "unknown value" of the table uses (refuse the record naming the set and the value; show as `unknown` with an attention item; ignore; treat as the named default), each as a function; and the registration by which the batches of T250 to T256 add their sets to one exported map, assembled by T257 (annex X, §X.6) in packages/contracts/src/enums/index.ts
  - covers: F100-FR-208; F100-FR-209
  - checks: F100-SC-007
  - reads: annex X §X.6, F100-FR-208 and F100-FR-209; rows 1 to 12 of `data/closed-sets.json` (the sets owned by 100, as the sample of every kind of rule); annex A §A.4, F100-FR-021
- [x] T250 [P] [US1] Closed sets of the owners 100 to 104 (33 rows of `data/closed-sets.json`: filter by the feature number at the start of `owner`, 100 to 104; a compound owner such as `100; 102` goes with its first number) as typed sets registered through T070, each with its members from `literals` (a row without literals refers to another table of the package: it registers by reference to that export) and its unknown-value rule, in packages/contracts/src/enums/sets-100-104.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T251 [P] [US1] Closed sets of the owners 105 to 109 (51 rows: the first number of `owner` in 105 to 109) as typed sets registered through T070, in packages/contracts/src/enums/sets-105-109.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T252 [P] [US1] Closed sets of the owners 110 to 119 (56 rows: the first number of `owner` in 110 to 119) as typed sets registered through T070, in packages/contracts/src/enums/sets-110-119.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T253 [P] [US1] Closed sets of the owners 120 to 125 (40 rows: the first number of `owner` in 120 to 125) as typed sets registered through T070, in packages/contracts/src/enums/sets-120-125.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T254 [P] [US1] Closed sets of the owners 126 to 129 (33 rows: the first number of `owner` in 126 to 129) as typed sets registered through T070, in packages/contracts/src/enums/sets-126-129.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T255 [P] [US1] Closed sets of the owners 130 to 144 (42 rows: the first number of `owner` in 130 to 144) as typed sets registered through T070, in packages/contracts/src/enums/sets-130-144.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T256 [P] [US1] Closed sets of the owners 145 to 149 (23 rows: the first number of `owner` in 145 to 149) as typed sets registered through T070, in packages/contracts/src/enums/sets-145-149.ts
  - slice of: T070
  - covers: F100-FR-208
  - reads: annex X §X.6, the rows of those numbers only; the filtered rows of `data/closed-sets.json`; T070 as written
- [x] T257 [US1] Assemble the closed sets: import the seven batch files, register them in the map of T070, and assert at load that the map holds exactly the 278 numbers of `data/closed-sets.json`, each once, with the name of its row; export the map as `closedSets` from packages/contracts/src/enums/all-sets.ts, re-exported by `src/index.ts`
  - slice of: T070
  - covers: F100-FR-208; F100-FR-209
  - checks: F100-SC-007
  - reads: the keys `number` and `name` of every row of `data/closed-sets.json` (never the `literals`); T070 and the seven batch files as written (their exports only)
- [x] T071 [P] [US1] Contract tests CT-100-310, CT-100-311, CT-100-312 for The parity profile (annex X, §X.7) in packages/contracts/test/parity-profile.test.ts
  - proves: F100-FR-210; F100-FR-211; F100-FR-212
  - checks: F100-SC-006
  - reads: annex X §X.7, F100-FR-210 to F100-FR-212 and rows 1 to 5 of the table (not the 133 rows); the keys of the first three `switches` of `data/parity-profile.json`
- [x] T072 [US1] Implement the profile as data with a loader: the type of a row of `data/parity-profile.json` (number, switch, keys, default, value under `parity`, owner, register rows), `loadProfile()`, and `applyProfile(config)` that sets every key of every row to its value under `parity` and does nothing else (annex X, §X.7) in packages/contracts/src/profile/parity.ts
  - covers: F100-FR-210
  - checks: F100-SC-006
  - reads: annex X §X.7, F100-FR-210; contracts/README.md, the row `data/parity-profile.json` of the table "Data" (the meaning of `keys` and `keyNote`); the first ten `switches` of `data/parity-profile.json`; T066 as written
- [x] T258 [US1] Implement the registration of a switch by a package: `registerSwitch({key, owner, default, parity, registerRows})`, read-only after launch, and `registeredSwitches()`; a package that owns a switch of annex X §X.7 registers it at load, and a registration whose owner differs from the owner of its row in `data/parity-profile.json` is refused (a feature does not change a row of another feature) (annex X, §X.7) in packages/contracts/src/profile/switches.ts
  - slice of: T072
  - covers: F100-FR-212
  - reads: annex X §X.7, F100-FR-212; the keys `number`, `keys`, `owner` of the rows of `data/parity-profile.json`; T072 as written
- [x] T259 [US1] Implement the static test "Profile" of the test kit: every registered switch has a row of the profile with a value under `parity` and every row's keys are configuration keys; the second suite is the profile with row 1 set to `micro` and nothing else changed; a switch without a row fails the build (annex X, §X.7) in packages/testkit/src/static/profile.ts
  - slice of: T072
  - covers: F100-FR-211
  - checks: F100-SC-006
  - reads: annex X §X.7, F100-FR-211 and row 1; quickstart.md, scenario 3 (the row "Profile"); T072, T258 as written
- [x] T073 [P] [US1] Contract tests CT-100-313, CT-100-314, CT-100-315 for Normalization contract (annex X, §X.8) in packages/contracts/test/normalization.test.ts
  - proves: F100-FR-213; F100-FR-214; F100-FR-215
  - reads: annex X §X.8, F100-FR-213 to F100-FR-215 and the sub-headings; the keys and the first two entries of every list of `data/normalization.json`
- [x] T074 [US1] Ship `normalization.json` as versioned data with a loader: the 29 rules N-01 to N-29 with the assertion that no rule is added without a register row, the mode map, the exit-code map of `resume`, the key-name map of the launch contract, and the variables of the hermetic environment of the oracle as a documented mapping (annex X, §X.8) in packages/contracts/src/profile/normalization.ts
  - covers: F100-FR-213; F100-FR-215
  - reads: annex X §X.8, F100-FR-213 and F100-FR-215, "Normalization rules"; the keys `rules`, `modeMap`, `resumeExitCodeMap`, `launchContractKeyMap` of `data/normalization.json`
- [x] T266 [US1] Ship the layout table of the old side, the environment alias table and the component-name table as versioned data with a loader: `data/layout-old-side.json` joined to the new side by logical name (an item with a logical name resolves through T034; an item with a rule reports the rule), `environmentAliases` and `componentNames` of `data/normalization.json`, the as-is approval marker mapped to `gate:<N>:approved`, and a baseline registry entry the port does not carry left without a logical name and handled by rule N-15 (annex X, §X.8; annex B, §B.5) in packages/contracts/src/profile/layout-old-side.ts
  - slice of: T074
  - covers: F100-FR-214; F100-FR-056
  - reads: annex X §X.8, F100-FR-214, rule N-15, "Layout table, old side", "Environment alias table", "Component-name table" (the head of each; not the 199 items); the keys `count`, `placeholders`, `comparedRows` and the first five `items` of `data/layout-old-side.json`; the keys `environmentAliases`, `componentNames` of `data/normalization.json`; annex B §B.5, F100-FR-056; T034 as written
- [x] T075 [P] [US1] Static tests CT-100-325 in packages/testkit/test/static.test.ts: the build fails on a record of the control plane without `schema`; on a reader that accepts a different major; on a closed set without a row; on a switch without a row; on a specification that names state by a physical path
  - proves: F100-FR-225
  - checks: F100-SC-003
  - reads: annex X §X.10, F100-FR-225; quickstart.md, scenario 3 (the table)
- [x] T265 [P] [US1] Static tests CT-100-326 in packages/testkit/test/static-review.test.ts: the review fails on a specification whose exit code, stop reason, state name, logical name, envelope field or configuration rank is not in the data files, and on a requirement that lists harness names
  - slice of: T075
  - proves: F100-FR-226
  - checks: F100-SC-003
  - reads: annex X §X.10, F100-FR-226; quickstart.md, scenario 3 (the rows "Vocabulary" and "No closed list")
- [x] T076 [US1] Implement the static test "Closed sets" over the `contracts` package: every set the package exports has a row of `closed-sets.json` and the reverse, and the members of a row with literals equal the export (annex X, §X.10) in packages/testkit/src/static/closed-sets.ts
  - covers: F100-FR-225; F100-FR-209
  - checks: F100-SC-003; F100-SC-007
  - reads: annex X §X.10, F100-FR-225; quickstart.md, scenario 3 (the row "Closed sets"); T070 as written (the exported map)
- [x] T260 [US1] Implement the static test "Schema field": every logical name of the control plane (root `control` in `data/layout.json`) whose content is a record has a schema file under `schemas/` with a required `schema` property, or a row of `data/further-schema-ids.json`, or is the read model of EP-09 whose schema feature 129 delivers (`specstride.view/1`, annex G §G.6); the one stated exception is `specstride.inbox/1`, whose empty stop request carries no field (annex B §B.11, F100-FR-065); and every validator of the package refuses a different major (annex X, §X.10) in packages/testkit/src/static/schema-field.ts
  - slice of: T076
  - covers: F100-FR-225
  - checks: F100-SC-003; F100-SC-007
  - reads: annex X §X.10, F100-FR-225; quickstart.md, scenario 3 (the row "Schema field"); the `root` and `content` columns of `data/layout.json`; the list of files of `schemas/`; the key `schemaIds` of `data/further-schema-ids.json`; annex B §B.11, the field table (the exception of the empty stop request); T028 as written
- [x] T261 [US1] Implement the static test "Logical names": every logical name has a path, a root and exactly one writer, and every root is one of `user`, `control`, `workspace`, `worker-root` or one of the three places `temp`, `package`, `harness-home` that are not roots of state (annex X, §X.10; annex B §B.5) in packages/testkit/src/static/logical-names.ts
  - slice of: T076
  - covers: F100-FR-225; F100-FR-051
  - reads: quickstart.md, scenario 3 (the row "Logical names"); annex B §B.5, the paragraph above the table (what a root is); the keys `roots` and `logicalNames` of `data/layout.json`; T034 as written
- [x] T262 [US1] Implement the static test "Physical paths": no file under `specs/1*/` names a path template of `layout.json` outside `plan.md` and `contracts/`; the test reads the specifications line by line and names the file and the line (annex X, §X.10) in packages/testkit/src/static/physical-paths.ts
  - slice of: T076
  - covers: F100-FR-225; F100-FR-038
  - reads: quickstart.md, scenario 3 (the row "Physical paths"); the `path` column of `data/layout.json`
- [x] T263 [US1] Implement the static test "Vocabulary": no file under `specs/1*/` names an exit code (in the form `exit N` beside a command), a stop reason, a run state, a logical name, an envelope field or a rank that the data files do not hold; the test names the file, the line and the value (annex X, §X.10) in packages/testkit/src/static/vocabulary.ts
  - slice of: T076
  - covers: F100-FR-226
  - checks: F100-SC-003
  - reads: quickstart.md, scenario 3 (the row "Vocabulary"); the exported data of T034, T064, T066 (their signatures); the data files directly, so that the test stands inside user story 1: `data/exit-codes.json` keys `engine`, `perCommand`, `runtimeRootAndPipelineEntry`, `data/run-state-machine.json` key `states`, `data/stop-reasons.json` key `stopReasons`, `data/layout.json` key `logicalNames`, `data/config-ranks.json`, `schemas/event-envelope.schema.json` (its `properties`)
- [x] T264 [US1] Implement the runner of the static tests in packages/testkit/src/static/index.ts: it runs every check of `src/static/` (T018, T239, T240, T241, T259, T076, T260, T261, T262, T263) over `specs/1*/` and over the `contracts` package, reports each as one test, and is the script `test:static` of the package
  - slice of: T076
  - covers: F100-FR-225; F100-FR-226
  - checks: F100-SC-003
  - reads: quickstart.md, scenario 3; the exported functions of the ten check files (their signatures only)

**Checkpoint**: user story 1 can be tested by itself

---

## Phase 4: User Story 2 - An operator reads an exit code and a stop reason (Priority: P1)

**Goal**: Codes, stop reasons and the run-state machine are data and functions of the `contracts` package, with a test per row

**Independent Test**: Scenarios 4 and 8 of `quickstart.md`

- [x] T077 [P] [US2] Contract tests CT-100-241, CT-100-242 for the states and the transitions of the Run-state machine (annex E, §E.2) in packages/contracts/test/run-state.test.ts
  - proves: F100-FR-141; F100-FR-142
  - reads: annex E §E.2, "States", "Transitions and the process that owns each", F100-FR-141 and F100-FR-142; the keys `states` and `transitions` of `data/run-state-machine.json`; data-model.md, "State transitions", "Run" (the diagram)
- [x] T267 [P] [US2] Contract tests CT-100-243, CT-100-244, CT-100-245, CT-100-246, CT-100-247 for the run record, the blocked reasons, the refusal on a changed source, the quota pause and the lease check (annex E, §E.2) in packages/contracts/test/run-record.test.ts: a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required; every blocked reason has a stop reason and an exit code; a changed source hash is refused with exit 3, names the file and records T3, and readers show `blocked-on-human` with `source-changed`; a quota pause spends no count and no budget and at `pause.maxTotalMs` (default 24 hours) rests in `blocked-on-human` with `paused_quota_ceiling`; a lost lease ends with the cause `owner-lost`, `stop_flag`, `causedBy: crash` and exit 6
  - slice of: T077
  - proves: F100-FR-143; F100-FR-144; F100-FR-145; F100-FR-146; F100-FR-147
  - reads: annex E §E.2, "Blocked reasons", "Run record", F100-FR-143 to F100-FR-147; the key `blockedReasons` of `data/run-state-machine.json`; `schemas/run-record.schema.json`
- [x] T078 [US2] Implement the ten states and the three derived conditions as types, the transitions T1 to T18 with their trigger, owner and written record from `data/run-state-machine.json`, and the function `mayWrite(transition, process)` that says whether a transition is allowed for a process (a host never; the CLI only T1, T2, T3, T17) (annex E, §E.2) in packages/contracts/src/state/run-state.ts
  - covers: F100-FR-141; F100-FR-142
  - reads: annex E §E.2, "States", "Transitions and the process that owns each", F100-FR-141 and F100-FR-142; the keys `states` and `transitions` of `data/run-state-machine.json`; rows 1, 2 of `data/closed-sets.json`
- [x] T268 [US2] Implement the blocked reasons with their stop reason, exit code and `retryable` from `data/run-state-machine.json`, the shape of the event `blocked` (the reason and what the run needs), the rule that a blocked run writes its terminal record, releases the lock, ends, and is never relaunched by either classifier table, and the refusal on a changed source hash (exit 3, the file named, recorded in the launch record as T3; readers show `blocked-on-human` with the attention item `source-changed`; the event `blocked` for it is written by the next writer of the event file, marked synthesized) as data (annex E, §E.2) in packages/contracts/src/state/blocked-reasons.ts
  - slice of: T078
  - covers: F100-FR-144; F100-FR-145
  - reads: annex E §E.2, "Blocked reasons", F100-FR-144 and F100-FR-145; the key `blockedReasons` of `data/run-state-machine.json`; row 4 of `data/closed-sets.json`; T078 as written
- [x] T269 [US2] Type and validator of the Run record from `schemas/run-record.schema.json`: the containment level, the result of the critic proof, the version of the redaction pattern set, `productVersions` (one list: the version that started the run and the version of every later engine start), one writer; the rules of the quota pause (nothing spent, `pause.maxTotalMs` as the ceiling with the default of 24 hours, at the ceiling the rest state `blocked-on-human` with the stop reason `paused_quota_ceiling`, the pause record present exactly while paused) and the lease check at every boundary that reads the stop request (owner lost: finish the pass, no phase gate, the terminal record with the cause `owner-lost`, the stop reason `stop_flag`, `causedBy: crash`, exit 6) as data (annex E, §E.2) in packages/contracts/src/records/run-record.ts
  - slice of: T078
  - covers: F100-FR-143; F100-FR-146; F100-FR-147
  - reads: annex E §E.2, "Run record", F100-FR-143, F100-FR-146, F100-FR-147; `schemas/run-record.schema.json`; T028 as written
- [x] T079 [P] [US2] Contract tests CT-100-248, CT-100-249, CT-100-250 for Stop-reason enumeration (annex E, §E.3) in packages/contracts/test/stop-reasons.test.ts
  - proves: F100-FR-148; F100-FR-149; F100-FR-150
  - reads: annex E §E.3; `data/stop-reasons.json`; rows 3, 10, 11, 12 of `data/closed-sets.json`
- [x] T080 [US2] Implement the 15 stop reasons from `data/stop-reasons.json` as a closed set registered through T070: literal, written by, engine exit, `transient`, the rule for `retryable`, and the rule for an unknown value (annex E, §E.3) in packages/contracts/src/codes/stop-reasons.ts
  - covers: F100-FR-148
  - reads: annex E §E.3, F100-FR-148 and the table; `data/stop-reasons.json`; T070 as written
- [x] T270 [US2] Implement the as-is literal of every stop reason 1 to 14 for the compatibility projection, with the rule of two lines where the engine and the pass loop both write a reason, and the other closed families with their as-is literals (the kill reasons of the watchdogs with their class, the stage reasons, the pipeline exit reasons, the launch-check refusals, the relaunch refusals and the approval `classified-transient`) as sets registered through T070, with `all_approved` as the only outcome literal of the as-is end line and the four arbitration literals unchanged in meaning (annex E, §E.3) in packages/contracts/src/codes/stop-reason-literals.ts
  - slice of: T080
  - covers: F100-FR-149; F100-FR-150
  - reads: annex E §E.3, F100-FR-149 and F100-FR-150; the field `matchedByStringAtBaseline` of each entry of `stopReasons` in `data/stop-reasons.json`; rows 10, 11, 12, 13, 14 of `data/closed-sets.json`; T080 as written
- [x] T081 [P] [US2] Parity test PT-100-028SC003-engine-codes in tests/parity/100/engine-codes.test.ts
  - proves: 028 SC-003
  - requirement: F100-FR-151
  - fixture: FX-03, FX-04, FX-05, FX-07, FX-11, FX-12, FX-17
  - reads: annex E §E.4, "Engine", F100-FR-151; the key `engine` of `data/exit-codes.json`; the quickstart of feature 141 (table-level assertions and the fixture families named)
- [x] T082 [P] [US2] Characterization test CT-100-1 (the exit vocabulary of Lisa: seven names, seven numbers) in tests/characterization/100/exit-vocabulary.test.ts
  - proves: 002 FR-015
  - requirement: F100-FR-152
  - reads: annex E §E.4, F100-FR-152; the key `engine` of `data/exit-codes.json`
- [x] T083 [P] [US2] Characterization test CT-100-2 (every termination of a run maps to one of 0 to 6) in tests/characterization/100/termination-codes.test.ts
  - proves: 002 SC-004
  - requirement: F100-FR-152
  - reads: annex E §E.4, F100-FR-151 and F100-FR-152; the key `engine` of `data/exit-codes.json`; `data/stop-reasons.json` (the `engineExit` column)
- [x] T084 [P] [US2] Contract tests CT-100-253, CT-100-254 for Exit codes and result records of the engine (annex E, §E.4) in packages/contracts/test/engine-codes.test.ts
  - proves: F100-FR-153; F100-FR-154
  - reads: annex E §E.4, the five sub-tables; the key `engine` of `data/exit-codes.json`; row 19 of `data/closed-sets.json`
- [x] T085 [US2] Implement the exit codes of the engine (0 to 6 with their meaning and stop reasons) as a closed set from `data/exit-codes.json`, and the mapping from the result of the pass loop to an engine code, applied only when phase evidence is absent (annex E, §E.4, "Engine") in packages/contracts/src/codes/engine.ts
  - covers: F100-FR-151; F100-FR-152
  - reads: annex E §E.4, "Engine", F100-FR-151 and F100-FR-152; the entries `Engine` and `Pass loop` of the key `engine` of `data/exit-codes.json`; T070, T080 as written
- [x] T271 [US2] Implement the result records of the pass loop, the critic call, the verification gate and the internal helpers as types with the `exit_code` numbers of their tables, and the two start modes `standalone` and `child` with what each does (`standalone`: the lock, the lease, the run record and the transitions of the root; `child`: verify the lease handed down, never take a lock), and the engine executable resolved at launch and pinned by path and hash in the launch record, from a configuration key whose default is the product's own entry, as data (annex E, §E.4) in packages/contracts/src/codes/result-records.ts
  - slice of: T085
  - covers: F100-FR-153; F100-FR-154
  - reads: annex E §E.4, "Pass loop", "Critic call", "Verification gate", "Internal helpers", F100-FR-153 and F100-FR-154; the entries other than `Engine` of the key `engine` of `data/exit-codes.json`; row 19 of `data/closed-sets.json`; T085 as written
- [x] T086 [P] [US2] Contract tests CT-100-260, CT-100-261 for Handshake (annex F, §F.3) in packages/contracts/test/handshake.test.ts
  - proves: F100-FR-160; F100-FR-161
  - reads: annex F §F.3; the key `handshake` of `data/exit-codes.json`
- [x] T087 [US2] Implement the three outcomes with the exit code of `launch` for each, and the derivation of `launch-abandoned` from a launch record and a lease (annex F, §F.3) in packages/contracts/src/state/handshake.ts
  - covers: F100-FR-160; F100-FR-161
  - reads: annex F §F.3; the key `handshake` of `data/exit-codes.json`; the exported types of T038 and T040
- [x] T088 [P] [US2] Parity test PT-100-011SC004-pipeline-codes in tests/parity/100/pipeline-codes.test.ts
  - proves: 011 SC-004
  - requirement: F100-FR-168
  - fixture: FX-33, FX-35
  - reads: annex F §F.8; the key `runtimeRootAndPipelineEntry` of `data/exit-codes.json`; the quickstart of feature 141 (table-level assertions)
- [x] T089 [P] [US2] Contract tests CT-100-269 for Exit codes of the runtime root and the pipeline entry (annex F, §F.8) in packages/contracts/test/pipeline-codes.test.ts
  - proves: F100-FR-169
  - reads: annex F §F.8; the key `runtimeRootAndPipelineEntry` of `data/exit-codes.json`
- [x] T090 [US2] Implement the codes 0, 2, 20 to 24 and 128+N and the status of a stage child, from `data/exit-codes.json` (annex F, §F.8) in packages/contracts/src/codes/pipeline.ts
  - covers: F100-FR-168; F100-FR-169
  - reads: annex F §F.8; the key `runtimeRootAndPipelineEntry` of `data/exit-codes.json`; T070 as written
- [x] T091 [P] [US2] Parity test PT-100-011SC007-supervision-outcomes in tests/parity/100/supervision-outcomes.test.ts
  - proves: 011 SC-007
  - requirement: F100-FR-184
  - fixture: FX-36
  - reads: annex G §G.4, F100-FR-184; the rows of `wait` and of supervision in the key `perCommand` of `data/exit-codes.json`; the quickstart of feature 141 (table-level assertions)
- [x] T092 [P] [US2] Contract tests CT-100-282, CT-100-283, CT-100-285, CT-100-286 for Exit codes per command (annex G, §G.4) in packages/contracts/test/command-codes.test.ts
  - proves: F100-FR-182; F100-FR-183; F100-FR-185; F100-FR-186
  - reads: annex G §G.4; the keys `perCommand` and `collisions` of `data/exit-codes.json`
- [x] T093 [US2] Implement the table of codes per command from `data/exit-codes.json` as data and type, with the general rules: a usage error keeps the as-is code of its command, an uncaught error exits 70, an unknown verb 1, an unknown sub-command as the table states (annex G, §G.4) in packages/contracts/src/codes/commands.ts
  - covers: F100-FR-182
  - reads: annex G §G.4, F100-FR-182 and the table; the key `perCommand` of `data/exit-codes.json`; T070 as written
- [x] T272 [US2] Implement the refusals of `resume` (lock held 5; nothing to resume 3; a changed hash of spec, plan or task list 3 with the file named; the task-list hash that ignores checkbox changes) and the seven supervision outcomes with their codes (completed, a reading taken or a relaunch started 0; a status the exit map does not know 1; stopped 2, which is also the usage error; unknown-terminal 3; refused 4, which is also the launch decision `attach`; supervision-expired 5; failed 22; lock-conflict 24) as data (annex G, §G.4) in packages/contracts/src/codes/resume-and-supervision.ts
  - slice of: T093
  - covers: F100-FR-183; F100-FR-184
  - reads: annex G §G.4, F100-FR-183 and F100-FR-184; the rows of `resume` and `supervise` in the key `perCommand` of `data/exit-codes.json` (the seven supervision outcomes are the `supervise` row; 2 is also the usage error and 4 also the launch decision `attach`); row 16 of `data/closed-sets.json`; T093 as written
- [x] T273 [US2] Implement the codes of the doctor (0, 1, 2, 3; `--strict`; a probe that times out) and of the commands without an as-is equivalent (`launch`, `wait`, `state export`, `state import`, `state adopt`, `harness verify`, `config show`, `config schema`, `tripwire clear`), and the table of collisions (one value, its meanings per command) as data (annex G, §G.4) in packages/contracts/src/codes/doctor-and-collisions.ts
  - slice of: T093
  - covers: F100-FR-185; F100-FR-186
  - reads: annex G §G.4, F100-FR-185 and F100-FR-186; the rows of those commands in the key `perCommand` and the key `collisions` of `data/exit-codes.json`; T093 as written
- [x] T094 [P] [US2] Table-level tests generated from `data/exit-codes.json`: one test per row of every exit-code table (`engine` with its five sub-tables, `runtimeRootAndPipelineEntry`, `perCommand`, `handshake`, `collisions`), each asserting the row against the exports of T085, T271, T090, T087, T093, T272, T273, in packages/testkit/src/tables/exit-codes.test.ts, with the script `test:tables` of the package running the directory `src/tables/`
  - proves: F100-FR-151; F100-FR-153; F100-FR-168; F100-FR-182
  - checks: 100 per cent of the rows are covered (F100-SC-009)
  - reads: research.md, D-9; quickstart.md, scenario 4; `data/exit-codes.json` (all keys); the exported signatures of the seven code modules
- [x] T274 [P] [US2] Table-level tests generated from `data/stop-reasons.json`: one test per stop reason (15), asserting literal, engine exit, `transient` and `retryable` against T080 and the as-is literal against T270, in packages/testkit/src/tables/stop-reasons.test.ts
  - slice of: T094
  - proves: F100-FR-148
  - checks: F100-SC-009
  - reads: research.md, D-9; `data/stop-reasons.json`; the exported signatures of T080 and T270
- [x] T275 [P] [US2] Table-level tests generated from `data/run-state-machine.json`: one test per transition (18), asserting from, to, trigger, owner and the written record against T078 and `mayWrite`, and one per blocked reason against T268, in packages/testkit/src/tables/transitions.test.ts
  - slice of: T094
  - proves: F100-FR-142; F100-FR-144
  - checks: F100-SC-009
  - reads: research.md, D-9; the keys `transitions` and `blockedReasons` of `data/run-state-machine.json`; the exported signatures of T078 and T268

### Amendments of 2026-09-30 (owner rulings on the analyze campaign; done in this phase so that the pins of phases 1 to 3 hold again)

The annexes and `contracts/` changed on 2026-09-30 (`spec.md`, the sections of the amendments of that date). Until T297 and T298 are done, the copy in `packages/contracts/` differs from the specification's copy and the contract tests of phase 3 fail; nothing else of this phase depends on them.

- [x] T297 [US2] Re-synchronize the package with the amended specification: run the sync of T008 so that `packages/contracts/data/` and `packages/contracts/schemas/` are byte-identical to `specs/100-specstride/contracts/` again (closed sets 285 rows; layout 127 names, version 1.2; 21 further schema ids; 41 aliases and the second pair of the launch-contract key map; 6 hasher operations; the new optional field `verificationParallelism` of the terminal record), re-run the type generation of T009 for the changed schemas, and make every test that reads these files pass on the new data (among them the test of T074 that pins the key map of the launch contract, which now holds the pair `schema_version`, `schema`)
  - covers: F100-FR-227; F100-FR-214
  - reads: `spec.md`, the sections of the amendments of 2026-09-30; annex X §X.8; annex B §B.15; T008 and T009 as written
- [x] T298 [US2] Register the closed sets added and changed on 2026-09-30 and re-pin the table at 285: typed sets for row 279 (Hold refusals, owner 123) in packages/contracts/src/enums/sets-120-125.ts and rows 280 to 285 (owners 106 and 107) in packages/contracts/src/enums/sets-105-109.ts; the member `learning` of row 111, the members `control-root-unsafe`, `unknown-mode` and `comment-changed` of row 212, and the owner text of row 31; `CLOSED_SETS_OF_THE_TABLE` and `CLOSED_SET_COUNT` of T257 become 285, and the batch counts of T251 (57) and T253 (41) in the batch headers and in packages/contracts/test/closed-sets.test.ts; one negative control that a missing row fails with the pinned message
  - covers: F100-FR-208
  - reads: annex X §X.6, rows 31, 111, 212 and 279 to 285; `data/closed-sets.json`; T070, T250 to T257 as written
- [x] T299 [US2] Deliver the data and schema files of other features into the `contracts` package: after its two clean copies, the sync of T008 reads every `specs/<feature>/contracts/deliver.json` (sorted by directory name, feature 100 skipped; keys `data` and `schemas`, each a map from the target name in the package to a path relative to that feature's `contracts/`), copies each entry, fails with exit 1 when a target already exists, two features name the same target or a source is missing, verifies each delivered file byte for byte, and counts the delivered files in its final line, in packages/contracts/scripts/sync.mjs, with tests over a fixture feature (a delivery, a collision, a missing source)
  - covers: F100-FR-227
  - reads: `plan.md`, "Files of other features in the `contracts` package"; `contracts/README.md`, "How the files are made"; T008 as written
- [x] T300 [US2] Implement the rule files of the import-boundary check: read every `tools/import-boundary/rules/*.json` of the form `{ rule, owner, requirement, from: [path globs], forbid: [path globs of modules], reason }`, refuse a file that lacks a field, and fail `check:imports` with the file, the import and the rule id when a source file that `from` matches imports a module that `forbid` matches (resolved path, relative or through a package export), in tools/import-boundary/src/rule-files.ts, with tests of a permitted and a forbidden import in tools/import-boundary/test/rule-files.test.ts
  - reads: `plan.md`, the entry of `tools/import-boundary`; T231 to T236 as written
- [x] T301 [US2] Align the interface of the canonical hasher with annex X §X.5 as amended on 2026-09-30: the operation "canonical record text" (sorted keys, compact separators, non-ASCII kept, no final line end), the canonical record hash as the content hash of that text with one line end, and the obligation id and the signature of unmet criteria taken over the text their owners form (the hasher holds no rule of theirs), in packages/contracts/src/ep/hasher.ts, with the contract test packages/contracts/test/hasher-contract.test.ts updated
  - covers: F100-FR-207
  - reads: annex X §X.5, the rows "Canonical record text", "Canonical record hash" and "Phase shape, obligation id, signature of unmet criteria"; T068 as written
- [x] T302 [P] [US2] The interface through which the engine calls finalization (F100-FR-237): the plain function types `reconcile`, `finalize` and `sweepRetention` with their inputs and outputs, in the `contracts` package at layer L2 (no extension point in Wave 1), exported from `src/index.ts`, with the contract test CT-100-337
  - covers: F100-FR-237
  - proves: F100-FR-237
  - reads: annex A §A.4, F100-FR-235 and F100-FR-237; annex X §X.6 row 175
- [x] T303 [US2] The logical names added on 2026-09-30 in the resolver of T034: the per-start form of the engine log (suffix `:<k>`) and the legacy learning event file of a feature, and the bare `run:<runId>:engine-log` resolving to the file of the newest engine start, as `run:<runId>:events-legacy` does; tests of both names and of the bare name
  - covers: F100-FR-054; F100-FR-226
  - reads: annex B §B.5, the rows of the two names and of `run:<runId>:engine-log`; `data/layout.json` (version 1.2); T034 as written
- [x] T305 [US2] Scoped review of the static tests (owner ruling of 2026-09-30, F100-FR-225 and F100-FR-226 as amended): the runner of T264 reads `TESTKIT_STATIC_SCOPE` (feature folder names separated by commas; unset or empty means every feature); the checks that read the specifications (T262 physical paths, T263 vocabulary, T265 review, the harness-list check of T018) take the named folders as their subject and still read every folder of `specs/1*/` as reference; a named folder that does not exist fails the run; the checks of the `contracts` package are not scoped. Add tests to packages/testkit/test/static-review.test.ts: a violation in a folder outside the scope passes the scoped run and fails the full run; a violation inside the scope fails both; an unknown folder name fails. In packages/testkit/src/static/kit.ts and packages/testkit/src/static/index.ts
  - covers: F100-FR-225; F100-FR-226
  - proves: F100-FR-226
  - reads: annex X §X.10, F100-FR-225 and F100-FR-226 as amended; T262 to T265 as written; `specDirectories` and `CheckOptions` of packages/testkit/src/static/kit.ts
- [x] T304 [US2] Close the amendment: `generate.py --check`, the contract tests, `test:static` scoped to feature 100 through T305 (the full run over all features is the gate of phase 10, F100-FR-226), `check:imports` and `typecheck` all pass on the tree of this phase, and the proofs of T297 to T303 are in the evidence of phase 4
  - reads: quickstart.md, scenarios 1 to 3; the verification commands of phase 4

**Checkpoint**: user story 2 can be tested by itself

---

## Phase 5: User Story 3 - An author adds an implementation without touching the core (Priority: P1)

**Goal**: Nineteen interfaces, nineteen contract-level suites, nineteen samples outside the core, one acceptance run

**Independent Test**: Scenario 5 of `quickstart.md`

**Order within a point**: for each extension point the contract-level suite comes first, then the sample, then the interface types. The sample is written against the JSON contract of its point (`specs/100-specstride/contracts/extension-points/EP-nn.*.json`), not against the TypeScript interface types, so it may precede them; the types task then generates the types from the same file and the suite runs again on the sample. Every task of a triplet reads what "Context budget" rule 7 lists.

### The frame of the test kit (annex A §A.4)

- [x] T095 [P] [US3] Contract tests CT-100-113, CT-100-114, CT-100-115, CT-100-116 for the registry of an extension point (annex A, §A.4) in packages/testkit/test/frame.test.ts: the id form and the range of majors (current and the one before; outside refused and reported); the three classes (data accepted, first-party accepted, third-party refused in Wave 1); a widening implementation from project configuration ignored with the message and the doctor warning; one registry per point, read-only after launch, resolved values replayed on resume
  - proves: F100-FR-013; F100-FR-014; F100-FR-015; F100-FR-016
  - reads: annex A §A.4, F100-FR-013 to F100-FR-016 and the table of the nineteen points; `contracts/extension-points/index.json`; row 83 of `data/closed-sets.json`
- [x] T276 [P] [US3] Contract tests CT-100-117, CT-100-118, CT-100-119, CT-100-120, CT-100-121 for the run of a suite and the degradation (annex A, §A.4) in packages/testkit/test/frame-run.test.ts: a suite runs on a registered implementation and reports per case; a sample registered from the test tree passes and no core file names it; an implementation that throws, runs over its time or returns outside its result set degrades to the documented path with an event and no verdict, code or stop reason of its own; EP-18 is marked internal; the default unknown-value rule holds where a point states nothing more specific
  - slice of: T095
  - proves: F100-FR-017; F100-FR-018; F100-FR-019; F100-FR-020; F100-FR-021
  - reads: annex A §A.4, F100-FR-017 to F100-FR-021; `contracts/extension-points/index.json`
- [x] T096 [US3] Implement the registry of the frame: `registryOf(pointId)` with one registry per point of `contracts/extension-points/index.json`, `register(implementation)` with the class (data validated against its schema; first-party accepted; third-party refused in Wave 1 with the message), the declared range of majors checked against the current major and the one before, the widening rule for project configuration, the freeze after launch, and `resolved()` for the run's records (annex A, §A.4) in packages/testkit/src/conformance/frame.ts
  - covers: F100-FR-013; F100-FR-014; F100-FR-015; F100-FR-016
  - reads: annex A §A.4, F100-FR-013 to F100-FR-016; `contracts/extension-points/index.json`; row 83 of `data/closed-sets.json`; T248 as written (the widening filter)
- [x] T277 [US3] Implement the run of a suite and its report: `runSuite(pointId, implementation, cases)` runs the cases of the point (the contract-level cases of this feature and the behaviour cases the content owner adds in the same folder), reports per case with the point, the implementation, the class and the major, marks EP-18 as an internal seam in the report, and is the script `conformance` of the package with an optional point argument (annex A, §A.4) in packages/testkit/src/conformance/run.ts
  - slice of: T096
  - covers: F100-FR-017; F100-FR-020
  - reads: annex A §A.4, F100-FR-017 and F100-FR-020; quickstart.md, scenario 5; research.md, D-10; T096 as written
- [x] T278 [US3] Implement the degradation of a failing implementation: a wrapper that catches a throw, a time limit and a result outside the closed result set of the point, takes the plainer path that the point's file documents under "Failure of an implementation", records the degradation as an event of the envelope, and never returns a verdict, an exit code or a stop reason; and the default unknown-value rule of F100-FR-021 as the fallback of every point (annex A, §A.4) in packages/testkit/src/conformance/degrade.ts
  - slice of: T096
  - covers: F100-FR-019; F100-FR-021
  - reads: annex A §A.4, F100-FR-019 and F100-FR-021; the sub-sections "Failure of an implementation" and "Unknown-value rule" of `contracts/extension-points/EP-08.event-sink.json` as the sample; T064, T096 as written
- [x] T279 [US3] Implement the registration of the samples from the test tree: `registerSamples()` imports every `packages/testkit/src/samples/EP-nn/index.ts` and registers it with the class first-party under its point, from the test tree only, so that no core file names a sample and adding or removing a sample changes no core file (annex A, §A.4) in packages/testkit/src/conformance/register-samples.ts
  - slice of: T096
  - covers: F100-FR-018
  - reads: annex A §A.4, F100-FR-018; annex A §A.3, F100-FR-012; T096 as written

### The nineteen points

- [x] T097 [P] [US3] Conformance suite at contract level for EP-02 (annex C, §C.1): CT-100-176, CT-100-177, CT-100-178, CT-100-179, CT-100-180, CT-100-181, CT-100-182, CT-100-183 in packages/testkit/src/conformance/EP-02/contract.test.ts
  - proves: F100-FR-076; F100-FR-077; F100-FR-078; F100-FR-079; F100-FR-080; F100-FR-081; F100-FR-082; F100-FR-083
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-02.harness.json`
- [x] T098 [P] [US3] Sample implementation of EP-02 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-02/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T099 [US3] Interface types of EP-02, from `contracts/extension-points/EP-02.harness.json` and annex C, §C.1, in packages/contracts/src/ep/harness.ts
  - covers: F100-FR-076; F100-FR-077; F100-FR-078; F100-FR-079; F100-FR-080; F100-FR-081; F100-FR-082; F100-FR-083
  - reads: rule 7
- [x] T100 [P] [US3] Conformance suite at contract level for EP-03 (annex C, §C.7): CT-100-195, CT-100-196 in packages/testkit/src/conformance/EP-03/contract.test.ts
  - proves: F100-FR-095; F100-FR-096
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-03.spec-format.json`
- [x] T101 [P] [US3] Sample implementation of EP-03 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-03/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T102 [US3] Interface types of EP-03, from `contracts/extension-points/EP-03.spec-format.json` and annex C, §C.7, in packages/contracts/src/ep/spec-format.ts
  - covers: F100-FR-095; F100-FR-096
  - reads: rule 7
- [x] T103 [P] [US3] Type and validator of the canonical spec model from `schemas/canonical-spec-model.schema.json` in packages/contracts/src/records/canonical-spec-model.ts
  - covers: F100-FR-095
  - reads: rule 6: `schemas/canonical-spec-model.schema.json`; annex C §C.7 (the field table only)
- [x] T104 [P] [US3] Conformance suite at contract level for EP-05 (annex C, §C.8): CT-100-197, CT-100-198, CT-100-199, CT-100-200 in packages/testkit/src/conformance/EP-05/contract.test.ts
  - proves: F100-FR-097; F100-FR-098; F100-FR-099; F100-FR-100
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-05.check-runner.json`
- [x] T105 [P] [US3] Sample implementation of EP-05 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-05/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T106 [US3] Interface types of EP-05, from `contracts/extension-points/EP-05.check-runner.json` and annex C, §C.8, in packages/contracts/src/ep/check-runner.ts
  - covers: F100-FR-097; F100-FR-098; F100-FR-099; F100-FR-100
  - reads: rule 7
- [x] T107 [P] [US3] Conformance suite at contract level for EP-07 (annex C, §C.9): CT-100-201, CT-100-202, CT-100-203 in packages/testkit/src/conformance/EP-07/contract.test.ts
  - proves: F100-FR-101; F100-FR-102; F100-FR-103
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-07.verification-source.json`
- [x] T108 [P] [US3] Sample implementation of EP-07 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-07/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T109 [US3] Interface types of EP-07, from `contracts/extension-points/EP-07.verification-source.json` and annex C, §C.9, in packages/contracts/src/ep/verification-source.ts
  - covers: F100-FR-101; F100-FR-102; F100-FR-103
  - reads: rule 7
- [x] T110 [P] [US3] Conformance suite at contract level for EP-08 (annex C, §C.10): CT-100-204, CT-100-205, CT-100-206 in packages/testkit/src/conformance/EP-08/contract.test.ts
  - proves: F100-FR-104; F100-FR-105; F100-FR-106
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-08.event-sink.json`
- [x] T111 [P] [US3] Sample implementation of EP-08 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-08/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T112 [US3] Interface types of EP-08, from `contracts/extension-points/EP-08.event-sink.json` and annex C, §C.10, in packages/contracts/src/ep/event-sink.ts
  - covers: F100-FR-104; F100-FR-105; F100-FR-106
  - reads: rule 7
- [x] T113 [P] [US3] Conformance suite at contract level for EP-10 (annex C, §C.11): CT-100-207 in packages/testkit/src/conformance/EP-10/contract.test.ts
  - proves: F100-FR-107
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-10.secret-resolver.json`
- [x] T114 [P] [US3] Sample implementation of EP-10 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-10/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T115 [US3] Interface types of EP-10, from `contracts/extension-points/EP-10.secret-resolver.json` and annex C, §C.11, in packages/contracts/src/ep/secret-resolver.ts
  - covers: F100-FR-107
  - reads: rule 7
- [x] T116 [P] [US3] Conformance suite at contract level for EP-11 (annex C, §C.12): CT-100-208 in packages/testkit/src/conformance/EP-11/contract.test.ts
  - proves: F100-FR-108
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-11.terms.json`
- [x] T117 [P] [US3] Sample implementation of EP-11 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-11/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T118 [US3] Interface types of EP-11, from `contracts/extension-points/EP-11.terms.json` and annex C, §C.12, in packages/contracts/src/ep/terms.ts
  - covers: F100-FR-108
  - reads: rule 7
- [x] T119 [P] [US3] Conformance suite at contract level for EP-12 (annex C, §C.13): CT-100-209 in packages/testkit/src/conformance/EP-12/contract.test.ts
  - proves: F100-FR-109
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-12.quota-classifier.json`
- [x] T120 [P] [US3] Sample implementation of EP-12 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-12/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T121 [US3] Interface types of EP-12, from `contracts/extension-points/EP-12.quota-classifier.json` and annex C, §C.13, in packages/contracts/src/ep/quota-classifier.ts
  - covers: F100-FR-109
  - reads: rule 7
- [x] T122 [P] [US3] Conformance suite at contract level for EP-16 (annex C, §C.14): CT-100-210 in packages/testkit/src/conformance/EP-16/contract.test.ts
  - proves: F100-FR-110
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-16.toolchain.json`
- [x] T123 [P] [US3] Sample implementation of EP-16 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-16/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T124 [US3] Interface types of EP-16, from `contracts/extension-points/EP-16.toolchain.json` and annex C, §C.14, in packages/contracts/src/ep/toolchain.ts
  - covers: F100-FR-110
  - reads: rule 7
- [x] T125 [P] [US3] Conformance suite at contract level for EP-04 (annex D, §D.1): CT-100-214, CT-100-215, CT-100-216, CT-100-217, CT-100-218, CT-100-219, CT-100-220 in packages/testkit/src/conformance/EP-04/contract.test.ts
  - proves: F100-FR-114; F100-FR-115; F100-FR-116; F100-FR-117; F100-FR-118; F100-FR-119; F100-FR-120
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-04.loop-layer.json`; the keys `callPoints` and `directives` of `data/loop-layer-tables.json`
- [x] T126 [P] [US3] Sample implementation of EP-04 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-04/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T127 [US3] Interface types of EP-04, from `contracts/extension-points/EP-04.loop-layer.json` and annex D, §D.1, in packages/contracts/src/ep/loop-layer.ts
  - covers: F100-FR-114; F100-FR-115; F100-FR-116; F100-FR-117; F100-FR-118; F100-FR-119; F100-FR-120
  - reads: rule 7; the keys `callPoints` and `directives` of `data/loop-layer-tables.json`
- [x] T128 [P] [US3] Contract tests CT-100-221, CT-100-222, CT-100-223, CT-100-224, CT-100-225 for Tree-store service (annex D, §D.2) in packages/testkit/src/conformance/EP-04/tree-store.test.ts
  - proves: F100-FR-121; F100-FR-122; F100-FR-123; F100-FR-124; F100-FR-125
  - reads: annex D §D.2; the key `treeStoreOperations` of `data/loop-layer-tables.json`; row 64 of `data/closed-sets.json`
- [x] T129 [US3] Implement the interface type of the tree-store service with its seven operations and no other, the refusal reason `overlap`, the conditions of a store commit and the two permitted writes to the workspace as data (rule IR-60 as amended) (annex D, §D.2) in packages/contracts/src/ep/tree-store.ts
  - covers: F100-FR-121; F100-FR-122; F100-FR-123; F100-FR-124; F100-FR-125
  - reads: annex D §D.2; the key `treeStoreOperations` of `data/loop-layer-tables.json`; row 64 of `data/closed-sets.json`
- [x] T130 [P] [US3] Conformance suite at contract level for EP-06 (annex D, §D.4): CT-100-229, CT-100-230 in packages/testkit/src/conformance/EP-06/contract.test.ts
  - proves: F100-FR-129; F100-FR-130
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-06.router-rules.json`; the key `routerDecisionPoints` of `data/loop-layer-tables.json`
- [x] T131 [P] [US3] Sample implementation of EP-06 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-06/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7; T237 as written (a router rule table is evaluated by the table evaluator)
- [x] T132 [US3] Interface types of EP-06, from `contracts/extension-points/EP-06.router-rules.json` and annex D, §D.4, in packages/contracts/src/ep/router-rules.ts
  - covers: F100-FR-129; F100-FR-130
  - reads: rule 7; the key `routerDecisionPoints` of `data/loop-layer-tables.json`
- [x] T133 [P] [US3] Conformance suite at contract level for EP-15 (annex D, §D.5): CT-100-231, CT-100-232 in packages/testkit/src/conformance/EP-15/contract.test.ts
  - proves: F100-FR-131; F100-FR-132
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-15.prompt-block.json`
- [x] T134 [P] [US3] Sample implementation of EP-15 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-15/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T135 [US3] Interface types of EP-15, from `contracts/extension-points/EP-15.prompt-block.json` and annex D, §D.5, in packages/contracts/src/ep/prompt-block.ts
  - covers: F100-FR-131; F100-FR-132
  - reads: rule 7
- [x] T136 [P] [US3] Conformance suite at contract level for EP-18 (annex E, §E.1): CT-100-238, CT-100-239, CT-100-240 in packages/testkit/src/conformance/EP-18/contract.test.ts
  - proves: F100-FR-138; F100-FR-139; F100-FR-140
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-18.critic-strategy-and-attempt-planner.json`
- [x] T137 [P] [US3] Sample implementation of EP-18 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-18/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T138 [US3] Interface types of EP-18, from `contracts/extension-points/EP-18.critic-strategy-and-attempt-planner.json` and annex E, §E.1, in packages/contracts/src/ep/critic-strategy.ts
  - covers: F100-FR-138; F100-FR-139; F100-FR-140
  - reads: rule 7
- [x] T139 [P] [US3] Conformance suite at contract level for EP-13 (annex F, §F.5): CT-100-264 in packages/testkit/src/conformance/EP-13/contract.test.ts
  - proves: F100-FR-164
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-13.lock.json`
- [x] T140 [P] [US3] Sample implementation of EP-13 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-13/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T141 [US3] Interface types of EP-13, from `contracts/extension-points/EP-13.lock.json` and annex F, §F.5, in packages/contracts/src/ep/lock.ts
  - covers: F100-FR-164
  - reads: rule 7
- [x] T142 [P] [US3] Conformance suite at contract level for EP-17 (annex F, §F.6): CT-100-265 in packages/testkit/src/conformance/EP-17/contract.test.ts
  - proves: F100-FR-165
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-17.detach.json`
- [x] T143 [P] [US3] Sample implementation of EP-17 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-17/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T144 [US3] Interface types of EP-17, from `contracts/extension-points/EP-17.detach.json` and annex F, §F.6, in packages/contracts/src/ep/detach.ts
  - covers: F100-FR-165
  - reads: rule 7
- [x] T145 [P] [US3] Conformance suite at contract level for EP-19 (annex F, §F.7): CT-100-266, CT-100-267 in packages/testkit/src/conformance/EP-19/contract.test.ts
  - proves: F100-FR-166; F100-FR-167
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-19.stage-kind.json`
- [x] T146 [P] [US3] Sample implementation of EP-19 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-19/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T147 [US3] Interface types of EP-19, from `contracts/extension-points/EP-19.stage-kind.json` and annex F, §F.7, in packages/contracts/src/ep/stage-kind.ts
  - covers: F100-FR-166; F100-FR-167
  - reads: rule 7
- [x] T148 [P] [US3] Conformance suite at contract level for EP-09 (annex G, §G.6): CT-100-288 in packages/testkit/src/conformance/EP-09/contract.test.ts
  - proves: F100-FR-188
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-09.view.json`
- [x] T149 [P] [US3] Sample implementation of EP-09 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-09/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T150 [US3] Interface types of EP-09, from `contracts/extension-points/EP-09.view.json` and annex G, §G.6, in packages/contracts/src/ep/view.ts
  - covers: F100-FR-188
  - reads: rule 7
- [x] T151 [P] [US3] Conformance suite at contract level for EP-14 (annex G, §G.7): CT-100-289 in packages/testkit/src/conformance/EP-14/contract.test.ts
  - proves: F100-FR-189
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-14.doctor.json`
- [x] T152 [P] [US3] Sample implementation of EP-14 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-14/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7
- [x] T153 [US3] Interface types of EP-14, from `contracts/extension-points/EP-14.doctor.json` and annex G, §G.7, in packages/contracts/src/ep/doctor.ts
  - covers: F100-FR-189
  - reads: rule 7
- [x] T154 [P] [US3] Type and validator of the doctor findings from `schemas/doctor-findings.schema.json` in packages/contracts/src/records/doctor-findings.ts
  - covers: F100-FR-189
  - reads: rule 6: `schemas/doctor-findings.schema.json`; annex G §G.7 (the field table only)
- [x] T155 [P] [US3] Conformance suite at contract level for EP-01 (annex H, §H.1): CT-100-293, CT-100-294, CT-100-295, CT-100-296, CT-100-297 in packages/testkit/src/conformance/EP-01/contract.test.ts
  - proves: F100-FR-193; F100-FR-194; F100-FR-195; F100-FR-196; F100-FR-197
  - checks: the operations exist; results stay inside the closed result sets; a throwing implementation degrades to the documented path; the unknown-value rule; the behaviour cases are added by the content owner
  - reads: rule 7: `contracts/extension-points/EP-01.host.json`; `data/host-capabilities.json`
- [x] T156 [P] [US3] Sample implementation of EP-01 outside the core, registered from the test tree, in packages/testkit/src/samples/EP-01/index.ts
  - proves: F100-FR-018; F100-FR-222
  - checks: the suite passes on the sample; no core file names it
  - reads: rule 7; `data/host-capabilities.json`
- [x] T157 [US3] Interface types of EP-01, from `contracts/extension-points/EP-01.host.json` and annex H, §H.1, in packages/contracts/src/ep/host.ts
  - covers: F100-FR-193; F100-FR-194; F100-FR-195; F100-FR-196; F100-FR-197
  - reads: rule 7; `data/host-capabilities.json`
- [x] T158 [US3] Acceptance run over all nineteen points, CT-100-322, in packages/testkit/test/acceptance.test.ts: `registerSamples()` then `runSuite` for every point of `contracts/extension-points/index.json`; every suite passes on its sample; the report names nineteen points; run by the script `conformance` without an argument
  - proves: F100-FR-222; F100-FR-018
  - checks: F100-SC-001
  - reads: annex X §X.10, F100-FR-222; quickstart.md, scenario 5; `contracts/extension-points/index.json`; T277, T279 as written
- [x] T280 [US3] Acceptance of the core, CT-100-322 second part, in packages/testkit/test/acceptance-core.test.ts: the import-boundary check passes on the workspace; the core packages (every package marked `core: true` in `data/package-graph.json`: `@specstride/core`, `@specstride/layer-micro`, `@specstride/layer-parallel`; in the scratch copy of this feature's workspace, the packages of the graph that exist) build byte-identical with the samples present and with `packages/testkit/src/samples/` removed in a scratch copy; adding the name of a sample to a core file in the scratch copy makes `check:imports` fail and name the file
  - slice of: T158
  - proves: F100-FR-222; F100-FR-018; F100-FR-012
  - checks: F100-SC-001
  - reads: annex X §X.10, F100-FR-222; annex A §A.4, F100-FR-018; quickstart.md, scenario 5; the `core` flag of `data/package-graph.json`; T016, T236 as written

**Checkpoint**: user story 3 can be tested by itself

---

## Phase 6: User Story 4 - An author describes a harness as data (Priority: P2)

**Goal**: The descriptor and what travels with it validate as data

**Independent Test**: Scenario 2 of `quickstart.md`, for the schemas of annex C

- [x] T159 [P] [US4] Contract tests CT-100-184, CT-100-185, CT-100-186 for Harness descriptor, version 1 (annex C, §C.2): a valid sample passes, a different major is refused, an unknown top-level key is refused and a key under `x-` is ignored, every required field is required, in packages/contracts/test/harness-descriptor.test.ts
  - proves: F100-FR-084; F100-FR-085; F100-FR-086
  - reads: rule 6: `schemas/harness-descriptor.schema.json`; annex C §C.2
- [x] T160 [US4] Type and validator of Harness descriptor, version 1 from `schemas/harness-descriptor.schema.json`, with the rules of the requirements of annex C, §C.2, in packages/contracts/src/records/harness-descriptor.ts
  - covers: F100-FR-084; F100-FR-085; F100-FR-086
  - reads: rule 6
- [x] T161 [P] [US4] Contract tests CT-100-187, CT-100-188 for Forms of the completion level (annex C, §C.3) in packages/contracts/test/completion-forms.test.ts
  - proves: F100-FR-087; F100-FR-088
  - reads: annex C §C.3, F100-FR-087 and F100-FR-088 and the table of the two forms; the key `completionForms` of `data/harness-tables.json`
- [x] T162 [US4] Implement the two forms and the proof each needs, from `data/harness-tables.json`, and the type of the proof result that a call record carries (annex C, §C.3) in packages/contracts/src/enums/completion-forms.ts
  - covers: F100-FR-087; F100-FR-088
  - reads: annex C §C.3, F100-FR-087 and F100-FR-088; the key `completionForms` of `data/harness-tables.json`; T070 as written
- [x] T163 [P] [US4] Contract tests CT-100-189 for Withheld paths (annex C, §C.4): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/withheld-paths.test.ts
  - proves: F100-FR-089
  - reads: rule 6: `schemas/withheld-paths.schema.json`; annex C §C.4
- [x] T164 [US4] Type and validator of Withheld paths from `schemas/withheld-paths.schema.json`, with the rules of the requirements of annex C, §C.4, in packages/contracts/src/records/withheld-paths.ts
  - covers: F100-FR-089
  - reads: rule 6
- [x] T165 [P] [US4] Contract tests CT-100-190, CT-100-191 for Stream readers and the dialect table (annex C, §C.5): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/stream-dialect.test.ts
  - proves: F100-FR-090; F100-FR-091
  - reads: rule 6: `schemas/stream-dialect-row.schema.json`; annex C §C.5; the key `normalizedStreamRecords` of `data/harness-tables.json`
- [x] T166 [US4] Type and validator of Stream readers and the dialect table from `schemas/stream-dialect-row.schema.json`, with the rules of the requirements of annex C, §C.5, in packages/contracts/src/records/stream-dialect-row.ts
  - covers: F100-FR-090; F100-FR-091
  - reads: rule 6; the key `normalizedStreamRecords` of `data/harness-tables.json`
- [x] T167 [P] [US4] Contract tests CT-100-192, CT-100-193, CT-100-194 for Resolved registry and role plan (annex C, §C.6): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/resolved-registry.test.ts
  - proves: F100-FR-092; F100-FR-093; F100-FR-094
  - reads: rule 6: `schemas/resolved-registry.schema.json`; annex C §C.6; the key `criticOrder` of `data/harness-tables.json`
- [x] T168 [US4] Type and validator of Resolved registry and role plan from `schemas/resolved-registry.schema.json`, with the rules of the requirements of annex C, §C.6, in packages/contracts/src/records/resolved-registry.ts
  - covers: F100-FR-092; F100-FR-093; F100-FR-094
  - reads: rule 6; the key `criticOrder` of `data/harness-tables.json`
- [x] T169 [P] [US4] Contract tests CT-100-211, CT-100-212 for Containment levels (annex C, §C.15) in packages/contracts/test/containment.test.ts
  - proves: F100-FR-111; F100-FR-112
  - reads: annex C §C.15; the key `containmentLevels` of `data/harness-tables.json`; row 26 of `data/closed-sets.json`
- [x] T170 [US4] Implement the four levels, the ceiling with its provenance, `protection`, and the rule for parallel units as data, from `data/harness-tables.json` (annex C, §C.15) in packages/contracts/src/enums/containment.ts
  - covers: F100-FR-111; F100-FR-112
  - reads: annex C §C.15; the key `containmentLevels` of `data/harness-tables.json`; row 26 of `data/closed-sets.json`; T070 as written
- [x] T171 [P] [US4] Contract tests CT-100-213 for Overlay schema (annex C, §C.16): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/overlay.test.ts
  - proves: F100-FR-113
  - reads: rule 6: `schemas/overlay.schema.json`; annex C §C.16
- [x] T172 [US4] Type and validator of Overlay schema from `schemas/overlay.schema.json`, with the rules of the requirements of annex C, §C.16, in packages/contracts/src/records/overlay.ts
  - covers: F100-FR-113
  - reads: rule 6

**Checkpoint**: user story 4 can be tested by itself

---

## Phase 7: User Story 5 - A consumer invokes a host skill (Priority: P2)

**Goal**: The protocol, the line grammar, the launch contract and the records of the path from invocation to status are in the package; the canary harness exists

**Independent Test**: Scenario 7 of `quickstart.md`, and the tests of the line grammar

### Records of the pass loop and of the runtime root (annex D §D.3, §D.6 to §D.8; annex F §F.1, §F.2, §F.4)

- [X] T173 [P] [US5] Contract tests CT-100-226, CT-100-227, CT-100-228 for Parallel plan (annex D, §D.3): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/parallel-plan.test.ts
  - proves: F100-FR-126; F100-FR-127; F100-FR-128
  - reads: rule 6: `schemas/parallel-plan.schema.json`; annex D §D.3
- [X] T174 [US5] Type and validator of Parallel plan from `schemas/parallel-plan.schema.json`, with the rules of the requirements of annex D, §D.3, in packages/contracts/src/records/parallel-plan.ts
  - covers: F100-FR-126; F100-FR-127; F100-FR-128
  - reads: rule 6
- [X] T175 [P] [US5] Contract tests CT-100-233, CT-100-234 for Yield artifact (annex D, §D.6): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/yield-artifact.test.ts
  - proves: F100-FR-133; F100-FR-134
  - reads: rule 6: `schemas/yield-artifact.schema.json`; annex D §D.6
- [X] T176 [US5] Type and validator of Yield artifact from `schemas/yield-artifact.schema.json`, with the rules of the requirements of annex D, §D.6, in packages/contracts/src/records/yield-artifact.ts
  - covers: F100-FR-133; F100-FR-134
  - reads: rule 6
- [X] T177 [P] [US5] Contract tests CT-100-235, CT-100-236 for Fact block (annex D, §D.7): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/fact-block.test.ts
  - proves: F100-FR-135; F100-FR-136
  - reads: rule 6: `schemas/fact-block.schema.json`; annex D §D.7
- [X] T178 [US5] Type and validator of Fact block from `schemas/fact-block.schema.json`, with the rules of the requirements of annex D, §D.7, in packages/contracts/src/records/fact-block.ts
  - covers: F100-FR-135; F100-FR-136
  - reads: rule 6
- [X] T179 [P] [US5] Contract tests CT-100-237 for Check manifest (annex D, §D.8): a valid sample passes, a different major is refused, an unknown field follows the rule of the schema, every required field is required, in packages/contracts/test/check-manifest.test.ts
  - proves: F100-FR-137
  - reads: rule 6: `schemas/check-manifest.schema.json`; annex D §D.8
- [X] T180 [US5] Type and validator of Check manifest from `schemas/check-manifest.schema.json`, with the rules of the requirements of annex D, §D.8, in packages/contracts/src/records/check-manifest.ts
  - covers: F100-FR-137
  - reads: rule 6
- [X] T181 [P] [US5] Contract tests CT-100-255, CT-100-256, CT-100-257, CT-100-258 for Process model (annex F, §F.1) in packages/contracts/test/process-model.test.ts
  - proves: F100-FR-155; F100-FR-156; F100-FR-157; F100-FR-158
  - reads: annex F §F.1; the key `processes` of `data/process-model.json`
- [X] T182 [US5] Implement the process kinds with their class in the process registry, from `data/process-model.json` (annex F, §F.1) in packages/contracts/src/state/process-model.ts
  - covers: F100-FR-155; F100-FR-156; F100-FR-157; F100-FR-158
  - reads: annex F §F.1; the key `processes` of `data/process-model.json`; the exported type of T044
- [X] T183 [P] [US5] Contract tests CT-100-259 for Run requests (annex F, §F.2) in packages/contracts/test/run-requests.test.ts
  - proves: F100-FR-159
  - reads: annex F §F.2; the key `runRequests` of `data/process-model.json`
- [X] T184 [US5] Implement the two kinds of run request as types (annex F, §F.2) in packages/contracts/src/state/run-requests.ts
  - covers: F100-FR-159
  - reads: annex F §F.2; the key `runRequests` of `data/process-model.json`
- [X] T185 [P] [US5] Contract tests CT-100-262, CT-100-263 for Who relaunches (annex F, §F.4) in packages/contracts/test/relaunch-owner.test.ts
  - proves: F100-FR-162; F100-FR-163
  - reads: annex F §F.4; the key `relaunchOwner` of `data/process-model.json`
- [X] T186 [US5] Implement `relaunch.owner` with its two values and the list of what is never relaunched, as data for feature 123 (annex F, §F.4) in packages/contracts/src/state/relaunch-owner.ts
  - covers: F100-FR-162; F100-FR-163
  - reads: annex F §F.4; the key `relaunchOwner` of `data/process-model.json`

### The CLI protocol and the lines (annex G §G.1 to §G.3, §G.5, §G.8, §G.9)

- [X] T187 [P] [US5] Contract tests CT-100-270, CT-100-271, CT-100-272, CT-100-273, CT-100-274 for CLI protocol, version 1 (annex G, §G.1) in packages/contracts/test/protocol.test.ts
  - proves: F100-FR-170; F100-FR-171; F100-FR-172; F100-FR-173; F100-FR-174
  - reads: annex G §G.1; the keys `protocol` and `commands` of `data/cli-protocol.json`
- [X] T188 [US5] Implement the protocol integer, the list of commands with their owners as data from `data/cli-protocol.json`, the rule that raises the integer, the three public commands of the baseline with their codes, the `--json` record shape, and the handler of `specstride --protocol` as a function that feature 119 mounts (annex G, §G.1) in packages/contracts/src/grammar/protocol.ts
  - covers: F100-FR-170; F100-FR-171; F100-FR-172
  - reads: annex G §G.1, F100-FR-170 to F100-FR-172 and the table of commands; the keys `protocol` and `commands` of `data/cli-protocol.json`; row 157 of `data/closed-sets.json`
- [X] T281 [US5] Implement the name of the flag `--accept-source-change` of `resume` with what it does (the verification plan and the check manifest derived again, the new hashes recorded in the run snapshot, the counts and the phase evidence of delivered phases kept, an event emitted that every critic of the run receives as a fact; without the flag, exit 3 naming the changed file), and the rule that no command has a flag that switches off a launch check, the terms gate or a budget cap, as data that the static test of the flags of every command reads (annex G, §G.1) in packages/contracts/src/grammar/flags.ts
  - slice of: T188
  - covers: F100-FR-173; F100-FR-174
  - reads: annex G §G.1, F100-FR-173 and F100-FR-174; T188 as written
- [X] T189 [P] [US5] Contract tests CT-100-275, CT-100-276, CT-100-277 for Output modes (annex G, §G.2) in packages/contracts/test/output-modes.test.ts
  - proves: F100-FR-175; F100-FR-176; F100-FR-177
  - reads: annex G §G.2; the key `outputModes` of `data/cli-protocol.json`; row 80 of `data/closed-sets.json`
- [X] T190 [US5] Implement the two output modes and the predicate that says whether a line may be written to a compared stream under a profile (annex G, §G.2) in packages/contracts/src/grammar/output-modes.ts
  - covers: F100-FR-175; F100-FR-176; F100-FR-177
  - reads: annex G §G.2; the key `outputModes` of `data/cli-protocol.json`; row 80 of `data/closed-sets.json`; T072 as written
- [X] T191 [P] [US5] Contract tests CT-100-278, CT-100-279, CT-100-280, CT-100-281 for Line grammar (annex G, §G.3) in packages/contracts/test/lines.test.ts
  - proves: F100-FR-178; F100-FR-179; F100-FR-180; F100-FR-181
  - reads: annex G §G.3; `data/line-grammar.json`; the key `componentNames` of `data/normalization.json`
- [X] T192 [US5] Implement the parser and the formatter of a labelled line: the form (label in square brackets, one space, body), the label pattern, and one family per row of `families` of `data/line-grammar.json` with its labels, its body form, its printer and its stream; a label of one family never appears in another (annex G, §G.3) in packages/contracts/src/grammar/lines.ts
  - covers: F100-FR-178
  - reads: annex G §G.3, F100-FR-178 and the table of families; the keys `form`, `label`, `families` of `data/line-grammar.json`; row 81 of `data/closed-sets.json`
- [X] T282 [US5] Implement the digest grammar (the final line of every run of the pipeline entry, produced from events, printed verbatim by a host skill, its states from `digestStates`) and the rule of the `[LOOP]` line (before the digest, default output only, only when a loop layer is on or was switched off by rule, `parallel=` only with parallel units on, `protection=` from the containment level, never under the `parity` profile) (annex G, §G.3) in packages/contracts/src/grammar/digest.ts
  - slice of: T192
  - covers: F100-FR-179; F100-FR-180
  - reads: annex G §G.3, F100-FR-179 and F100-FR-180 and the digest grammar; the key `digestStates` and the row `Loop line` of `families` of `data/line-grammar.json`; T192, T244 as written
- [X] T283 [US5] Implement the keys of every supervisor line and every product line as data from `supervisorLines` and `productLines` of `data/line-grammar.json`, with their printer, and the substitution of an implementation file by its logical component name through the component-name table, leaving the text after the name equal (annex G, §G.3) in packages/contracts/src/grammar/line-keys.ts
  - slice of: T192
  - covers: F100-FR-178; F100-FR-181
  - reads: annex G §G.3, F100-FR-178 and F100-FR-181 and the tables of supervisor lines and product lines; the keys `supervisorLines` and `productLines` of `data/line-grammar.json`; annex X §X.8, the component-name table, and the key `componentNames` of `data/normalization.json`; T192 as written
- [X] T193 [P] [US5] Contract tests CT-100-287 for Token budgets (annex G, §G.5) in packages/testkit/test/budget.test.ts
  - proves: F100-FR-187
  - reads: annex G §G.5; the key `budgets` of `data/cli-protocol.json`
- [X] T194 [US5] Implement the byte measure (2.8 bytes per token) and the budgets as data, as a helper that the owner of each command uses in its build (annex G, §G.5) in packages/testkit/src/static/budget.ts
  - covers: F100-FR-187
  - reads: annex G §G.5; the key `budgets` of `data/cli-protocol.json`
- [X] T195 [P] [US5] Contract tests CT-100-290, CT-100-291 for Launch-contract schema (annex G, §G.8): a valid sample passes, a different major is refused, an unknown top-level key is refused and a key under `x-` is ignored, every required field is required, in packages/contracts/test/launch-contract.test.ts
  - proves: F100-FR-190; F100-FR-191
  - reads: rule 6: `schemas/launch-contract.schema.json`; annex G §G.8
- [X] T196 [US5] Type and validator of Launch-contract schema from `schemas/launch-contract.schema.json`, with the rules of the requirements of annex G, §G.8 (only validation promotes `draft` to `validated`; the proof of promotion), in packages/contracts/src/records/launch-contract.ts
  - covers: F100-FR-190; F100-FR-191
  - reads: rule 6; data-model.md, "State transitions", "Launch contract"
- [X] T197 [P] [US5] Contract tests CT-100-292 for Judgment exchange (annex G, §G.9) in packages/contracts/test/judgment.test.ts
  - proves: F100-FR-192
  - reads: annex G §G.9; the keys `judgmentExchange` and `judgmentSchema` of `data/cli-protocol.json`
- [X] T198 [US5] Implement the types of a judgment item, a batch with its cap of 3,000 tokens, and an answer with its provenance (annex G, §G.9) in packages/contracts/src/grammar/judgment.ts
  - covers: F100-FR-192
  - reads: annex G §G.9; the keys `judgmentExchange` and `judgmentSchema` of `data/cli-protocol.json`; T194 as written (the byte measure)

### Redactor, threat model, canary (annex X §X.4, §X.9)

- [X] T199 [P] [US5] Contract tests CT-100-305, CT-100-306 for Redactor (annex X, §X.4) in packages/testkit/test/redactor-contract.test.ts
  - proves: F100-FR-205; F100-FR-206
  - reads: annex X §X.4; the key `redactor` of `data/kernel-operations.json`; `schemas/redaction-pattern-set.schema.json`
- [X] T200 [US5] Implement the interface type of the redactor (`register`, `redact`) and the validator of the pattern set from `schemas/redaction-pattern-set.schema.json`. The redactor itself belongs to feature 111 (annex X, §X.4) in packages/contracts/src/ep/redactor.ts
  - covers: F100-FR-205
  - reads: annex X §X.4, F100-FR-205; the key `redactor` of `data/kernel-operations.json`; `schemas/redaction-pattern-set.schema.json`; T028 as written
- [X] T284 [US5] Implement the stub redactor of the test kit (exact values registered, replaced everywhere they occur, nothing else) against the interface of T200, and the interface type of the pre-commit scan (the files the runtime wrote, registered secrets and patterns, a hit blocks the commit and raises an event) (annex X, §X.4) in packages/testkit/src/canary/stub-redactor.ts
  - slice of: T200
  - covers: F100-FR-206; F100-FR-205
  - reads: annex X §X.4, F100-FR-205 and F100-FR-206; quickstart.md, scenario 7; T200 as written
- [X] T201 [P] [US5] Contract tests CT-100-316, CT-100-317, CT-100-318, CT-100-319, CT-100-320, CT-100-321 for Threat model (annex X, §X.9) in packages/testkit/test/threat-model.test.ts
  - proves: F100-FR-216; F100-FR-217; F100-FR-218; F100-FR-219; F100-FR-220; F100-FR-221
  - reads: annex X §X.9, F100-FR-216 to F100-FR-221 and the table of the five controls (not the 49 rows); the keys `controls` and the first three `threats` of `data/threat-model.json`
- [X] T202 [US5] Implement the planting of the canary harness: seven distinct canary secrets planted in the prompt, the reply of the model, tool arguments, tool output, phase evidence, the output of a check and the consumer's comment, through a stub harness and a stub check runner of the test kit, with the plan of where each was planted (annex X, §X.9) in packages/testkit/src/canary/plant.ts
  - covers: F100-FR-219
  - reads: annex X §X.9, F100-FR-219; quickstart.md, scenario 7; T098, T105 as written (the two samples the planting drives)
- [X] T285 [US5] Implement the scan of every sink of the canary harness: the event file, the exporters, the digest line, the status output and the payload of the read model are read after the run and searched for each planted value; the report names the sink and the place of planting of every hit; zero hits is the pass (annex X, §X.9) in packages/testkit/src/canary/scan.ts
  - slice of: T202
  - covers: F100-FR-219
  - reads: annex X §X.9, F100-FR-219; quickstart.md, scenario 7; T111, T149 as written (the sample sink and the sample view); T202 as written
- [X] T286 [US5] Implement the static checks of the threat model: every one of the 49 threats of `data/threat-model.json` has an owner feature and a control; the five structural controls are present; no component outside the runtime tree writes control state other than the CLI's listed files (a check over the `writer` column of `layout.json`); the three per-run fields of the run record are required by its schema (annex X, §X.9) in packages/testkit/src/static/threat-model.ts
  - slice of: T202
  - covers: F100-FR-216; F100-FR-217; F100-FR-218
  - reads: annex X §X.9, F100-FR-216 to F100-FR-218; the keys `controls` and `threats` of `data/threat-model.json` (49 short rows); the `writer` column of `data/layout.json`; `schemas/run-record.schema.json` (the `required` list: `containment`, `criticProof`, `redaction`); annex E §E.2, F100-FR-143
- [X] T287 [US5] Implement the static check that no package of Wave 1 opens a network listener (no import of `node:net`, `node:http`, `node:https`, `node:http2` or a server of a dependency in any package of the graph, and no `listen(` call), and the check that every ingress of outside text wraps it in random boundaries and never parses it for a control record, as a static test over the ingress package (annex X, §X.9) in packages/testkit/src/static/no-listener.ts
  - slice of: T202
  - covers: F100-FR-220; F100-FR-221
  - reads: annex X §X.9, F100-FR-220 and F100-FR-221; `data/package-graph.json` (the names and the layer); T013 as written (the scanner of imports)
- [X] T203 [P] [US5] Canary test CT-100-319 in packages/testkit/test/canary.test.ts: with content capture on, canaries planted in the prompt, the reply, tool arguments, tool output, phase evidence, the output of a check and the comment appear in no sink; against the sample sink and the stub redactor; with the script `test:canary`
  - proves: F100-FR-219
  - checks: feature 111 runs the same harness against the real redactor; that run is the release condition; F100-SC-008
  - reads: annex X §X.9, F100-FR-219; quickstart.md, scenario 7; T202, T284, T285 as written

**Checkpoint**: user story 5 can be tested by itself

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: integration acceptance and what spans the stories

### The port of the generator (T207 and its slices; before T204)

The generator `specs/100-specstride/contracts/tools/generate.py` is 602 lines in six parts. Each
slice ports one part to `tools/contracts-gen/` and reads only that part of the script (by its
comment banner) and the files it writes. No slice changes what the files hold: the Python output
is the oracle of every slice until T207 retires it.

- [x] T288 Port the markdown readers of the generator: the cell splitter, the annex parser (headings, requirement blocks with their fields, tables by section and sub-heading), the tick stripper, the profile-key reader and the table finder, in tools/contracts-gen/src/markdown.ts, with a test that parses annex A and finds its five sections and its 33 requirements
  - slice of: T207
  - covers: F100-FR-030
  - reads: `contracts/tools/generate.py`, the part "markdown" (the functions `cells`, `parse_annex`, `ticks`, `profile_keys`, `find_table`, `as_dicts`); annex A (as the test input); T231 as the shape of a tool package
- [x] T289 Port the JSON Schema builder of the generator: the type in words to a JSON Schema type, the placing of a dotted field path in a schema, and the record schema from a field table with `description`, `x-type-in-words`, `x-required`, `x-unknown-field`, `x-different-major` and the `$id`, in tools/contracts-gen/src/schema.ts, with a test that rebuilds `schemas/lease.schema.json` from annex B §B.8 byte for byte
  - slice of: T207
  - covers: F100-FR-030
  - reads: `contracts/tools/generate.py`, the part "JSON Schema" (`one_type`, `types_for`, `place`, `record_schema`) and the schema table at the head of the script; contracts/README.md, "Record schemas" and "The `$id` of a schema file"; `schemas/lease.schema.json`; T288 as written
- [x] T290 Port the writers of the mirrors: `annex-tables/<annex>.json` (every table of every annex by section and sub-heading) and `requirements.json` (every requirement with its fields), in tools/contracts-gen/src/write-tables.ts, with a test that the output equals the committed files byte for byte
  - slice of: T207
  - covers: F100-FR-030
  - reads: `contracts/tools/generate.py`, the part of `build()` that writes `annex-tables/` and `requirements.json`, and `dump`; the head of `contracts/annex-tables/A-foundations.json` and of `contracts/requirements.json` (the first 40 lines of each); T288 as written
- [x] T291 Port the writers of the extension points: one file per point with ids, section, operations, the requirements that cite the point and the thirteen sub-sections word for word, and `extension-points/index.json`, in tools/contracts-gen/src/write-extension-points.ts, with a test that the output equals the committed files byte for byte
  - slice of: T207
  - covers: F100-FR-030
  - reads: `contracts/tools/generate.py`, the extension-point table at the head of the script and the part of `build()` that writes `extension-points/`; `contracts/extension-points/EP-13.lock.json` and `index.json` as the samples; T288 as written
- [x] T292 Port the writers of the data files: the 22 files of `data/` (the inner function `data(name, sid, annex, section, payload)` of `build()` and each payload), the `schemas/` files through T289, and the checks of the hand-written sources: `sources/physical-paths.json` against the table of annex B §B.5 and `sources/old-side.json` against the inventory and the traceability items (`sources/package-graph.json` is copied unchecked), in tools/contracts-gen/src/write-data.ts, with a test that the output equals the committed files byte for byte
  - slice of: T207
  - covers: F100-FR-030
  - reads: `contracts/tools/generate.py`, the part of `build()` from the inner function `data` to the end of `build()`; contracts/README.md, "Data" and "Hand-written sources"; `contracts/sources/package-graph.json` (the smallest source, as the sample); T288, T289 as written
- [x] T293 Write the `--check` mode and the byte-identical proof: `--check` compares every generated file with the committed one, names every file that differs or is not generated, prints `checked <n> files, <m> differ`, and exits 1 when any differ; the test `tools/contracts-gen/test/byte-identical.test.ts` runs the Python generator and the TypeScript one into two scratch directories and asserts the 82 files equal, and is skipped with its reason when `python3` is absent
  - slice of: T207
  - covers: F100-FR-030
  - reads: quickstart.md, scenario 1 (the expected output of `--check`); `contracts/tools/generate.py`, `main()`; T290, T291, T292 as written
- [x] T207 Finish the port of the generator of the specification to `tools/contracts-gen/`: the entry `tools/contracts-gen/src/main.ts` with `--check`, the script `contracts:check` of the root `package.json`, and the change of the step of the build workflow of T006 to the TypeScript tool once T293 has proven byte-identical files; the Python script then leaves the build and Python 3 leaves the requirements of development. Done before T204: no release acceptance runs on a build that still needs the Python script (Principle VI; ruling 18; CQ-186)
  - covers: F100-FR-030
  - reads: plan.md, Complexity Tracking, the row of Principle VI; quickstart.md, "Prerequisites" and scenario 1; `.github/workflows/build.yml` as written by T006; T293 as written

### Acceptance, release checks, documentation

- [x] T204 Integration test CT-100-323 in `tests/parity/100/acceptance-oracle.test.ts`: under the `parity` profile the oracle of feature 141 reports no result `different`; the second suite passes with equal counters; a skip with its reason when the oracle is not installed
  - proves: F100-FR-223
  - fixture: every fixture family of feature 141 (FX-01 to FX-40), through its suite
  - reads: annex X §X.10, F100-FR-223; quickstart.md, "Tiers" and scenario 8; the quickstart of feature 141 (how its suite is invoked and how it reports); T259 as written (the second suite)
- [x] T205 Release check CT-100-324, scripted in `tests/release/100/integration-run.md`: on the release build, a run on a reference project through the host package for Claude Code reaches every phase gate approved; the time per stage is reported beside the baseline. Tier: live. It is run at release, on request, by a person under the owner's login; it is never a job of the build and the build makes no paid call. The run is logged in `specs/100-specstride/verified.md`: date, build, host and harness versions, the reference project, the result per phase gate and the time per stage
  - out-of-band (owner ruling of 2026-09-30): the part a person runs is never run and never faked here. Do the hermetic part on Linux, and record the part a person runs as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F100-FR-224
  - checks: F100-SC-002; F100-SC-005; `unverified` until the run was made
  - reads: annex X §X.10, F100-FR-224; quickstart.md, "Tiers" and scenario 9; plan.md, Constitution Check row XII
- [x] T206 Run every test of this feature on the macOS runner of the build workflow and record the result with the version of the system in `specs/100-specstride/verified.md`
  - out-of-band (owner ruling of 2026-09-30): the macOS runner part is never run and never faked here. Do the hermetic part on Linux, and record the macOS runner part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - proves: F100-FR-025
  - checks: every macOS statement stays `unverified` until this passes
  - reads: annex A §A.5, F100-FR-025; research.md, "Facts that stay `unverified`" (the macOS rows); `.github/workflows/build.yml`
- [x] T208 [P] Write `packages/contracts/README.md` for authors of descriptors and of later implementations: what the package holds, how to validate a record against a schema id, how to read a closed set, a logical name, an exit code and the profile, with one example each
  - covers: F100-FR-017
  - reads: annex A §A.4, F100-FR-017; `packages/contracts/src/index.ts` as written (the exports); contracts/README.md, "The `$id` of a schema file"
- [x] T294 [P] Write `packages/testkit/README.md` for authors of later implementations: how to register an implementation of an extension point, how to run its conformance suite on request, how the report reads, how the content owner adds behaviour cases in the folder of its point, and how the static, table and canary tests are run
  - slice of: T208
  - covers: F100-FR-017
  - reads: annex A §A.4, F100-FR-017; quickstart.md, scenarios 3, 4, 5, 7; `packages/testkit/src/index.ts` as written (the exports); research.md, D-10
- [x] T209 [P] Measure the three performance goals of `plan.md` in the build (load of the `contracts` package, a decision of the table evaluator on 100 rows, the import-boundary check on the workspace) in `packages/testkit/test/performance.test.ts`, and record the values; a breach is a warning until the values have been measured on three builds
  - reads: plan.md, "Performance Goals"; the exported signatures of T232, T237 and `tools/import-boundary/src/index.ts`
- [x] T210 Run the scenarios 1 to 8 of `specs/100-specstride/quickstart.md` and record the result in `specs/100-specstride/verified.md`
  - reads: quickstart.md (whole, 148 lines)

---

## Phase 9: Amendments after the fan-out

**Purpose**: what the amendments of `spec.md`, "Amendments after the fan-out", add. Task ids continue; no earlier task was renumbered. The data files of T008 carry the amended tables (278 closed sets, 133 rows of the profile after the repairs of Phase 10 and the second pass, 29 normalization rules, 125 logical names), so the tasks of the earlier phases that read those files need no change. An implementer of this phase reads the annex sections named, never the section "Amendments after the fan-out" of `spec.md`: the annexes hold every amendment in place.

- [X] T211 [P] Contract tests CT-100-327, CT-100-329 for the further schema ids and the names added to the layout (annex B, §B.20 and §B.5) in packages/contracts/test/further-schema-ids.test.ts
  - proves: F100-FR-227; F100-FR-229
  - reads: annex B §B.20; annex B §B.5, F100-FR-229; `data/further-schema-ids.json`; the names `run:<runId>:events-legacy:<k>` and `launch:<launchId>:comment` of `data/layout.json`
- [X] T212 Registry of the further schema ids with their record, logical name and owner from `data/further-schema-ids.json`, and the rule that a record of the table carries its schema id and follows §B.4 while its fields are with its owner, in packages/contracts/src/ids/further-schema-ids.ts
  - covers: F100-FR-227
  - reads: annex B §B.20; `data/further-schema-ids.json`; T028 as written
- [X] T295 Resolver entries of the sixteen logical names that the amendments added to annex B §B.5 (among them `run:<runId>:events-legacy:<k>`, `launch:<launchId>:comment`), with the rule that the as-is event file is written once per engine start and the comment kept verbatim after redaction with only its hash in the launch record, and `workspace:current:status-line` placed by the real path of the workspace only, as an extension of the resolver of T034, in packages/contracts/src/ids/logical-names-amendments.ts
  - slice of: T212
  - covers: F100-FR-229
  - reads: annex B §B.5, F100-FR-229 and the sixteen added rows (rows 110 to 125 of `logicalNames` in `data/layout.json`, `run:<runId>:events-legacy:<k>` to `workspace:current:status-line`); T034 as written
- [X] T213 [P] Contract test CT-100-328 for the check of files read while a run writes them (annex B, §B.2) in packages/kernel/test/stable-read.test.ts
  - proves: F100-FR-228
  - reads: annex B §B.2, F100-FR-228
- [X] T214 Implement the stable read (leading bytes compared before and after a reading) as a function of the kernel in packages/kernel/src/stable-read/index.ts
  - covers: F100-FR-228
  - reads: annex B §B.2, F100-FR-228; T229 as written
- [X] T215 [P] Conformance cases CT-100-330, CT-100-331 at contract level for the session identity and the context window of a critic (annex C, §C.3) in packages/testkit/src/conformance/EP-02/critic-proof.test.ts
  - proves: F100-FR-230; F100-FR-231
  - reads: annex C §C.3, F100-FR-230 and F100-FR-231; the sub-section "Guarantees of an implementation" of `contracts/extension-points/EP-02.harness.json`; rows 28, 55, 57, 117 of `data/parity-profile.json`; row 128 of `data/closed-sets.json`
- [X] T216 Types of the proof of a critic-class call with its three cases, and of the rule for the context window, in packages/contracts/src/enums/critic-proof.ts
  - covers: F100-FR-230; F100-FR-231
  - reads: annex C §C.3, F100-FR-230 and F100-FR-231; row 128 of `data/closed-sets.json`; T162 as written
- [X] T217 [P] Conformance case CT-100-332 at contract level for the reuse of a staged command (annex C, §C.8) in packages/testkit/src/conformance/EP-05/prestage.test.ts
  - proves: F100-FR-232
  - reads: annex C §C.8, F100-FR-232; the sub-section "Guarantees of the core" of `contracts/extension-points/EP-05.check-runner.json`
- [X] T218 Types of a staged result and of the reuse policies in packages/contracts/src/ep/check-runner-prestage.ts
  - covers: F100-FR-232
  - reads: annex C §C.8, F100-FR-232; T106 as written
- [X] T219 [P] Contract test CT-100-333 for the presenter interface (annex G, §G.10) in packages/contracts/test/presenter.test.ts
  - proves: F100-FR-233
  - reads: annex G §G.10; `data/presenter-interface.json`
- [X] T220 Interface type of the presenter from `data/presenter-interface.json` in packages/contracts/src/ep/presenter.ts
  - covers: F100-FR-233
  - reads: annex G §G.10; `data/presenter-interface.json`; T064 as written
- [X] T221 [P] Tests CT-100-334, CT-100-335 of the import-boundary check for the services of the kernel, the three edge packages and the learning interface (annex A, §A.3 and §A.4) in tools/import-boundary/test/kernel-services.test.ts
  - proves: F100-FR-234; F100-FR-235
  - reads: annex A §A.3, F100-FR-234; annex A §A.4, F100-FR-235; the packages of `data/package-graph.json` whose owner is 100, 106, 116 or 143
- [X] T222 Interface types of the process primitive (start in a group and a session with standard input closed; signal a group polite, terminate, kill; start time; search the process table for a run token; wait for an end), the clock, the registration call of doctor checks and the three calls into learning (`resolve`, `observe`, `evaluate`, a failure leaving the run on the value without learning) in packages/contracts/src/ep/kernel-services.ts
  - covers: F100-FR-234; F100-FR-235
  - reads: annex A §A.3, F100-FR-234; annex A §A.4, F100-FR-235; T153 as written (the doctor registration it names)
- [X] T296 The three edge packages of the kernel services in `packages/contracts/data/package-graph.json` (through `specs/100-specstride/contracts/sources/package-graph.json`, then T008): their layer, owner (116, 143, 148), `mayImport` and `note` (an edge package may touch the file system or start a process), with the rule that a core package receives the kernel services of T222 as arguments and reaches an edge package only through its interface in the `contracts` package, never by importing it
  - slice of: T222
  - covers: F100-FR-234
  - reads: annex A §A.3, F100-FR-234; `contracts/sources/package-graph.json`; contracts/README.md, "Hand-written sources"; T011 as written
- [X] T223 [P] Static test in packages/testkit/test/static-amendments.test.ts: every key of annex X §X.7 is in the key list of feature 110; every alias of annex X §X.8 names a key of that list; every closed set of a feature's section "Closed sets" has a row in `closed-sets.json` with the same members
  - proves: F100-FR-208; F100-FR-211; F100-FR-214
  - reads: annex X §X.7, F100-FR-211 (the requirement only); annex X §X.8, "Environment alias table" (the head); the keys `switches[].keys` of `data/parity-profile.json` and `environmentAliases` of `data/normalization.json`; the key list of feature 110 as its `contracts/` directory publishes it (that file only); the sections "Closed sets" of the specifications under `specs/1*/spec.md` (by `grep -n '^## Closed sets'`, each section only)

---

## Phase 10: Repairs after the cross-feature review

**Purpose**: what `spec.md`, "Repairs after the cross-feature review", adds. Task ids continue; no earlier task was renumbered. T207 moved before T204 and lost `[P]`; its id is unchanged.

- [x] T224 [P] Release check CT-100-336 in `tests/release/100/publish-attestation.test.ts`: a version without an attestation, and a version whose attestation names another repository, branch or commit, fail the check; a version published by the build from the protected branch passes; hermetic, against recorded attestations
  - proves: F100-FR-236
  - reads: annex X §X.10, F100-FR-236 (the requirement, as the section holds it after the repairs); `tests/release/100/` as written by T205 (the layout of the directory)
- [x] T225 Create the publishing workflow in `.github/workflows/release.yml`: it runs on the protected branch only, publishes the three packages with an attestation, and runs the release check of T224 on what it published; no job calls a model. Before it publishes, the workflow fails, and publishes nothing, unless three release conditions hold on the same build: (1) the parity release check of feature 141 (CT-141-126) and T204 of this feature pass, so that under the `parity` profile the oracle reports no result `different` on any fixture family and any surface, the second suite passes with equal counters, and every parity test of every feature passes, those of dsh, Codex and prime included; a skipped parity test counts as a failure (F100-FR-223); (2) the canary run of T203 with the real redactor of feature 111 passes: with content capture on, 0 of the canary secrets planted at the seven places appear in any sink (F100-SC-008, F100-FR-219); (3) `specs/100-specstride/verified.md` holds an entry of the logged live run T205 for this build, with every phase gate approved (F100-FR-224). The workflow reads that entry and never makes the live run
  - out-of-band (owner ruling of 2026-09-30): the release-time part is never run and never faked here. Do the hermetic part on Linux, and record the release-time part as `unverified` with its reason in this feature's verification record; the task is complete when that record exists. A phase whose only open work is of this kind counts as complete.
  - covers: F100-FR-236; F100-FR-223
  - checks: F100-SC-008
  - reads: annex X §X.10, F100-FR-223, F100-FR-224, F100-FR-236; `.github/workflows/build.yml` as written; the keys `published` of `data/package-graph.json`; T204, T205, T224 as written (their names and how each reports)
- [x] T226 [P] Contract test in packages/contracts/test/parity-profile-keys.test.ts: rows 130 and 131 of the profile exist; the field `keys` of every row holds configuration keys only; a worker count above `loop.parallel.workersMax` is named as a configuration error in the data of row 21
  - proves: F100-FR-127; F100-FR-211
  - checks: F100-SC-006
  - reads: rows 21, 130, 131 of `data/parity-profile.json`; contracts/README.md, the row `data/parity-profile.json` of the table "Data"
- [x] T227 [P] Test of the import-boundary check in tools/import-boundary/test/core-fs.test.ts: a core package that imports `node:fs` or `node:fs/promises` fails the check; an edge package that does so passes
  - proves: F100-FR-012
  - reads: annex A §A.3, F100-FR-012 (with its assumption CQ-185); T013 as written
- [x] T228 Add `specstride.span-state/1` to the registry of the further schema ids of T212 in packages/contracts/src/ids/further-schema-ids.ts, and the owners 116 and 143 to the package graph in `specs/100-specstride/contracts/sources/package-graph.json` (then T008) and to the batches of closed sets of T252 and T255 that hold their rows
  - covers: F100-FR-227; F100-FR-234
  - reads: the row `specstride.span-state/1` of `data/further-schema-ids.json`; the packages of owners 116 and 143 in `contracts/sources/package-graph.json`; the rows of owners 116 and 143 in `data/closed-sets.json`; T212, T296 as written

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependency; T003, T229, T230, T231, T004, T007 run in parallel after T001 and T002
- **Foundational (Phase 2)**: after Setup; blocks every story. Inside it: T008 before T009 before T232; T010, T233, T234, T012, T014 in parallel; T011 before T235 and T013; T013 before T236; T015 before T237; T016 last
- **User stories (Phases 3 to 7)**: after Foundational. US1, US2, US3 (all P1) do not depend on each other, except that US2 and US3 use the closed-set mechanism of T070 and the record validator of T028 (both early in US1). US4 and US5 use the record validator of US1 (T028, T232)
- **Polish (Phase 8)**: the port of the generator (T288 to T293, then T207) after Phase 1; T204 after T207 and after T259; T225 (Phase 10) after T204, T205, T224
- **Amendments after the fan-out (Phase 9, T211 to T223 with T295, T296)**: after Foundational; each pair of test and implementation stands on its own, and the data files of T008 carry the amended tables. T214 (`stable-read`, a function of the kernel) is foundational for the features that read files while a run writes them: it comes before their stories, as the kernel modules of Phase 2 do. T223 after T008; T295 after T034; T296 after T011
- **Repairs after the cross-feature review (Phase 10, T224 to T228)**: T224 and T226, T227 after Foundational; T225 after T224, and its release conditions rest on the results of T203, T204 and T205 (Phase 8); T228 after T212 and T296 (Phase 9)

### User Story Dependencies

| Story | Depends on | Reason |
|---|---|---|
| US1 | Foundational | — |
| US2 | Foundational; T028, T070 of US1 | The terminal record of US1 is used by the table-level tests of the stop reasons; the stop reasons and the codes register as closed sets through T070; the tests run against the schema file until the validator of US1 exists |
| US3 | Foundational; T070, T248 of US1 | The frame of the test kit is the first task of the story; the registry uses the widening filter of T248 and the closed sets of T070 |
| US4 | US1, the tasks of annex B §B.4 (T028, T246) and T070 | The record validator; the closed sets |
| US5 | US1, the tasks of annex B §B.4 (T028, T246), T072, T244 | The record validator; the profile for the output-mode predicate; the layout rules for the `[LOOP]` line |

### Within Each User Story

- A test task comes before the task it tests and fails before that task is done. A test task that was split (T010, T017, T022, T075, T077, T094, T095) keeps its file (T094: `exit-codes.test.ts`, see "Task ids after the split"); its slices are other files and run in parallel with it
- Data and types before functions; a mechanism (T070, T072, T096, T192) before the slices that fill it (T250 to T257; T258, T259; T277 to T279; T282, T283)
- For an extension point: the contract-level suite and the sample, then the interface types. The sample is written against the JSON contract of its point (`contracts/extension-points/EP-nn.*.json`), so it may precede the interface types (see the note at the head of Phase 5)
- The seven batches of closed sets (T250 to T256) are independent of each other and of every other task but T070; T257 assembles them

### Dependence on other features

| Task group | Needs | From |
|---|---|---|
| Parity tests `PT-100-*` | Fixture families, stub agents, normalizer, comparator | 141 |
| Behaviour cases of the nineteen conformance suites; the Wave 1 implementations | — | The content owner of each point; not tasks of this feature |
| The canary test against the real redactor | The redactor and its pattern set | 111 |
| The conformance suite on each Wave 1 implementation (F100-FR-222) | Each content owner runs the conformance suite of its extension point on its own Wave 1 implementation, in the same folder of the test kit | The content owners of the table "Extension points" of `spec.md`: EP-01 113; EP-02 109 (stream readers 126, role resolution 124); EP-03 104; EP-04 103 (`micro` 115, `parallel` 142, engine services 143); EP-05 148; EP-06 115; EP-07 105; EP-08 111 (compatibility projection 144, OTLP and Loki 128); EP-09 129; EP-10 110; EP-11 147; EP-12 127; EP-13 122; EP-14 112; EP-15 103 (the critic's assembler 117); EP-16 116; EP-17 122; EP-18 149; EP-19 123 |
| The release conditions of T225 (F100-FR-223, F100-SC-008) | The parity release check CT-141-126, with T204 of this feature; the canary run of T203 against the real redactor and its pattern set | 141 (release check); 111 (redactor and canary run) |
| T223 (the key list) | The key list of feature 110 as its `contracts/` publishes it | 110 |

## Parallel Examples

### User Story 1: the record pairs and the closed-set batches

```text
# Thirteen record pairs of annex B touch thirteen files each side; every test task runs at once:
T035 T037 T039 T041 T043 T045 T047 T049 T051 T053 T055 T057 T059  (tests, [P])
# then the thirteen type tasks, at once:
T036 T038 T040 T042 T044 T046 T048 T050 T052 T054 T056 T058 T060
# The seven batches of closed sets after T070, at once:
T250 T251 T252 T253 T254 T255 T256   (then T257)
# The static checks after T076 and T264's inputs exist, at once:
T239 T240 T241 T260 T261 T262 T263
```

### User Story 2: the tables

```text
# After T070 and T028: the test files of the four code families at once
T077 T267 T079 T084 T086 T089 T092
# then the code modules in their pairs; the three table-level test files at once at the end
T094 T274 T275
```

### User Story 3: the nineteen points

```text
# The contract-level suites and the samples of different points touch different files:
Conformance suite at contract level for EP-02 in packages/testkit/src/conformance/EP-02/contract.test.ts
Conformance suite at contract level for EP-05 in packages/testkit/src/conformance/EP-05/contract.test.ts
Sample implementation of EP-08 in packages/testkit/src/samples/EP-08/index.ts
Sample implementation of EP-13 in packages/testkit/src/samples/EP-13/index.ts
# All nineteen suite tasks at once, then all nineteen sample tasks at once, then the nineteen types tasks
```

### Phase 8: the port of the generator

```text
# After T288: T289, T290, T291 at once; T292 after T289; T293 after T290 to T292; then T207
```

## Implementation Strategy

### MVP first: User Story 1

1. Phase 1 and Phase 2
2. Phase 3 (US1): the data, the record validators, the closed sets, the profile, the static tests
3. Stop and validate: scenarios 1 to 3 of the quickstart. From here the other 40 features can build against the `contracts` package

### Incremental delivery

1. US1: one vocabulary, as data
2. US2: codes, reasons, the state machine; the parity tests of the tables once feature 141 has its fixtures
3. US3: the frame and the nineteen contract-level suites; content owners add their cases
4. US4 and US5: the records of the harness seam and of the path of a launch
5. Polish: the port of the generator, then integration acceptance at release

### Working one task in a 200,000-token window

1. Read this file's head (to "Path Conventions") and the one task, with its `reads:` line. Nothing else of this file
2. Open the inputs of `reads:` in order; slice the JSON files as "Context budget" rule 2 says
3. Write the one file the task names (two where the text says so); run the test task that names it
4. Tick the task. A slice ticks only its own checkbox; the parent is complete when the parent and every slice are ticked

## As-is coverage

Every kept row of the traceability files that is assigned to feature 100 is named by the `proves:` of a test task:

| As-is id | Test | Requirement |
|---|---|---|
| 028 SC-003 | PT-100-028SC003-engine-codes | F100-FR-151 |
| 002 FR-015 | CT-100-1 | F100-FR-152 |
| 002 SC-004 | CT-100-2 | F100-FR-152 |
| 011 SC-004 | PT-100-011SC004-pipeline-codes | F100-FR-168 |
| 011 SC-007 | PT-100-011SC007-supervision-outcomes | F100-FR-184 |
| C-008: B-0085 | PT-100-C-008-sweep-event | F100-FR-058 |
| C-011: B-0157, B-0165 | PT-100-C-011-roots | F100-FR-032 |
| C-011: B-0167, B-0168 | PT-100-C-011-current-names | F100-FR-055 |
| C-012: B-0194 | PT-100-C-012-sweep-line | F100-FR-057 |
| C-013: B-0248 | PT-100-C-013-run-id | F100-FR-046 |
| C-013: B-0256 | PT-100-C-013-notebook-sweep | F100-FR-057 |

## Split map

A citation of a parent id from `spec.md`, `plan.md`, the analyze report or another feature names
the parent together with its slices. The parent keeps its original file, but T015, T076, T094 and T202 ("Task ids after the split").

| Parent | Slices | What was one task |
|---|---|---|
| T003 | T229, T230, T231 | The four package skeletons |
| T009 | T232 | The type generation and the lazy compile of the validators |
| T010 | T233, T234 | The eleven contract tests of the layering rules |
| T011 | T235 | The import-permission rule and the layer facts |
| T013 | T236 | The two core rules |
| T015 | T237 | The load and the evaluation of a rule table |
| T017 | T238 | The ten contract tests of the product-wide rules |
| T018 | T239, T240, T241 | The static checks of the ten product-wide rules |
| T022 | T242 | The nine contract tests of the layout rules |
| T023 | T243, T244 | The atomic write, the path guard and the layout rules as data |
| T026 | T245 | The identifier types and the two name forms |
| T028 | T246 | The record validator and the further rules of records |
| T034 | T247 | The resolver of logical names and the notebook sweep |
| T066 | T248, T249 | The ranks, the trust classes and the envelope validator |
| T070 | T250, T251, T252, T253, T254, T255, T256, T257 | The mechanism of the closed sets, the 278 sets in seven batches, and their assembly |
| T072 | T258, T259 | The profile loader, the switch registration and the completeness test |
| T074 | T266 | The normalization rules and maps, and the old side of the layout with the alias and component tables |
| T075 | T265 | The static tests CT-100-325 and CT-100-326 |
| T076 | T260, T261, T262, T263, T264 | The static tests of the test kit, one per row of quickstart scenario 3, and their runner |
| T077 | T267 | The seven contract tests of the run-state machine |
| T078 | T268, T269 | The states and transitions, the blocked reasons, the run record |
| T080 | T270 | The stop reasons and their as-is literals with the other closed families |
| T085 | T271 | The engine codes and the result records with the start modes |
| T093 | T272, T273 | The codes per command, the refusals of `resume` and the supervision outcomes, the doctor and the collisions |
| T094 | T274, T275 | The table-level tests of the exit codes, the stop reasons and the transitions |
| T095 | T276 | The nine contract tests of the frame |
| T096 | T277, T278, T279 | The registry, the run and report, the degradation, the registration of samples |
| T158 | T280 | The acceptance run of the suites and the acceptance of the core |
| T188 | T281 | The protocol and the flags |
| T192 | T282, T283 | The parser and formatter of lines, the digest and `[LOOP]`, the keys of the lines and the component names |
| T200 | T284 | The redactor interface and the stub redactor |
| T202 | T285, T286, T287 | The planting, the scan, the threat-model checks, the listener check |
| T207 | T288, T289, T290, T291, T292, T293 | The port of the generator in six parts, then the swap of the build step |
| T208 | T294 | The two READMEs |
| T212 | T295 | The registry of the further schema ids and the added resolver entries |
| T222 | T296 | The kernel-service interfaces and the three edge packages |
